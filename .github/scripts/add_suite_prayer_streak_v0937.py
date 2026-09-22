from pathlib import Path
import re

suite = Path('SakaLuX-Suite.user.js')
doc = Path('greasyfork/SakaLuX-Suite.md')
text = suite.read_text(encoding='utf-8')

if 'SakaLuX Prayer Streak Tracker' in text:
    raise SystemExit('Prayer streak tracker already present')

m = re.search(r'(?m)^(//\s*@version\s+)(\S+)', text)
if not m:
    raise SystemExit('Suite @version not found')
old = m.group(2)
if old != '0.9.936':
    raise SystemExit(f'Unexpected Suite version: {old}')
text = text[:m.start(2)] + '0.9.937' + text[m.end(2):]

marker = '  init();\n\n\n    /* SakaLuX Unified'
if marker not in text:
    raise SystemExit('Suite injection marker not found')

block = r'''

  /* SakaLuX Prayer Streak Tracker — START */
  (() => {
    'use strict';
    const STORAGE_KEY = 'sakalux_suite_prayer_streak_v1';
    const WIDGET_ID = 'sakalux-prayer-streak-widget';
    const STYLE_ID = 'sakalux-prayer-streak-style';

    const dayKey = (d = new Date()) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const addDays = (key, delta) => {
      const [y, m, d] = key.split('-').map(Number);
      const x = new Date(y, m - 1, d);
      x.setDate(x.getDate() + delta);
      return dayKey(x);
    };
    const load = () => {
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return {
          days: Array.isArray(parsed.days) ? [...new Set(parsed.days.filter(v => /^\d{4}-\d{2}-\d{2}$/.test(v)))].sort() : [],
          lastPrayerTs: Number(parsed.lastPrayerTs) || 0
        };
      } catch (_) {
        return { days: [], lastPrayerTs: 0 };
      }
    };
    const save = state => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    };
    const recordToday = () => {
      const state = load();
      const today = dayKey();
      if (!state.days.includes(today)) state.days.push(today);
      state.days = [...new Set(state.days)].sort();
      state.lastPrayerTs = Date.now();
      save(state);
      render();
    };
    const currentStreak = state => {
      if (!state.days.length) return 0;
      const set = new Set(state.days);
      const today = dayKey();
      const yesterday = addDays(today, -1);
      let cursor = set.has(today) ? today : (set.has(yesterday) ? yesterday : null);
      if (!cursor) return 0;
      let streak = 0;
      while (set.has(cursor)) {
        streak += 1;
        cursor = addDays(cursor, -1);
      }
      return streak;
    };
    const pageLooksLikeChurch = () => {
      if (/church/i.test(location.href)) return true;
      const heading = [...document.querySelectorAll('h1,h2,h3,[class*="title"],[class*="header"]')]
        .some(el => /\bchurch\b/i.test((el.textContent || '').trim()));
      return heading;
    };
    const prayActionButton = () => [...document.querySelectorAll('button,input[type="button"],input[type="submit"]')]
      .find(el => {
        const label = (el.value || el.textContent || '').trim();
        return /^pray(?:\b|\s)/i.test(label) && !el.disabled;
      }) || null;
    const prayTabPresent = () => [...document.querySelectorAll('a,button,[role="tab"]')]
      .some(el => /^pray$/i.test((el.textContent || '').trim()));

    const ensureStyle = () => {
      if (document.getElementById(STYLE_ID)) return;
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = `
#${WIDGET_ID}{margin:10px 0;padding:10px 12px;border:1px solid rgba(128,128,128,.35);border-radius:8px;background:rgba(20,20,20,.08);font:600 13px/1.35 Arial,sans-serif}
#${WIDGET_ID} .slx-prayer-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
#${WIDGET_ID} .slx-prayer-count{font-size:15px;font-weight:800}
#${WIDGET_ID} .slx-prayer-done{color:#42b883}
#${WIDGET_ID} .slx-prayer-pending{color:#e0a52b}
#${WIDGET_ID} .slx-prayer-note{margin-top:4px;font-size:11px;opacity:.72;font-weight:500}`;
      document.head.appendChild(s);
    };
    const render = () => {
      if (!pageLooksLikeChurch()) {
        document.getElementById(WIDGET_ID)?.remove();
        return;
      }
      const action = prayActionButton();
      if (!action && !prayTabPresent()) return;
      ensureStyle();
      let box = document.getElementById(WIDGET_ID);
      if (!box) {
        box = document.createElement('div');
        box.id = WIDGET_ID;
        const anchor = action || [...document.querySelectorAll('a,button,[role="tab"]')].find(el => /^pray$/i.test((el.textContent || '').trim()));
        const host = anchor?.parentElement || document.querySelector('main') || document.body;
        if (anchor?.parentElement) anchor.parentElement.insertAdjacentElement('afterend', box);
        else host.prepend(box);
      }
      const state = load();
      const streak = currentStreak(state);
      const done = state.days.includes(dayKey());
      box.innerHTML = `<div class="slx-prayer-row"><span>🙏 Prayer streak</span><span class="slx-prayer-count">${streak} day${streak === 1 ? '' : 's'}</span></div><div class="${done ? 'slx-prayer-done' : 'slx-prayer-pending'}">${done ? '✓ Prayer recorded today' : '○ Not recorded today'}</div><div class="slx-prayer-note">Tracked locally by SakaLuX Suite from the first prayer recorded after this update.</div>`;
    };

    document.addEventListener('click', ev => {
      const btn = ev.target?.closest?.('button,input[type="button"],input[type="submit"]');
      if (!btn || !pageLooksLikeChurch()) return;
      const label = (btn.value || btn.textContent || '').trim();
      if (!/^pray(?:\b|\s)/i.test(label) || btn.disabled) return;
      setTimeout(recordToday, 600);
    }, true);

    let queued = false;
    const scheduleRender = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; render(); });
    };
    new MutationObserver(scheduleRender).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('popstate', scheduleRender, { passive: true });
    window.addEventListener('hashchange', scheduleRender, { passive: true });
    scheduleRender();
  })();
  /* SakaLuX Prayer Streak Tracker — END */
'''

text = text.replace('  init();\n\n\n    /* SakaLuX Unified', '  init();' + block + '\n\n    /* SakaLuX Unified', 1)
suite.write_text(text, encoding='utf-8')

md = doc.read_text(encoding='utf-8')
md = md.replace('**v0.9.936**', '**v0.9.937**', 1)
md = md.replace('Canonical version: **v0.9.936**', 'Canonical version: **v0.9.937**', 1)
md = md.replace('Verified: **2026-09-20**', 'Verified: **2026-09-22**', 1)
md = md.replace('**v0.9.936 — Release documentation synchronized with the current Suite userscript version**\n- Release documentation synchronized with the current Suite userscript version.', '**v0.9.937 — Church prayer streak tracker**\n- Adds a compact Prayer Streak card on Church / Pray views.\n- Records each successful-looking Pray action locally by calendar day and shows the current consecutive-day streak plus today status.\n- Keeps the data local and starts tracking from the first prayer made after installing this version.', 1)
needle = '## Release history / Changelog\n\n'
entry = '### v0.9.937 — Church prayer streak tracker\n- Adds a compact Prayer Streak card on Church / Pray views.\n- Tracks one prayer per local calendar day, calculates the active consecutive-day streak and marks whether today is complete.\n- Stores only local day stamps in browser/userscript storage; no API key or remote sync is required.\n- Tracking begins with the first prayer recorded after this update.\n\n'
if needle not in md:
    raise SystemExit('Changelog heading not found')
md = md.replace(needle, needle + entry, 1)
doc.write_text(md, encoding='utf-8')
