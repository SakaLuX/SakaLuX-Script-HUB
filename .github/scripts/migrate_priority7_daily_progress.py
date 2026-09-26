#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork/SakaLuX-Suite.md'
OLD = '0.9.938'
NEW = '0.9.939'
BEGIN = '/* SakaLuX Suite Daily Progress Dashboard — BEGIN */'
END = '/* SakaLuX Suite Daily Progress Dashboard — END */'

FEATURE = r'''/* SakaLuX Suite Daily Progress Dashboard — BEGIN */
(() => {
  'use strict';
  if (window.SakaLuXSuiteDailyProgress?.version === '1.0.0') return;

  const VERSION = '1.0.0';
  const STATE_KEY = 'sakalux_suite_daily_progress_v1';
  const GOALS_KEY = 'sakalux_suite_daily_goals_v1';
  const PANEL_ID = 'slx-suite-daily-progress';
  const LAUNCHER_ID = 'slx-suite-daily-launcher';
  const BRIDGE_ID = 'sakalux-module-bridge-daily-progress-dashboard';
  const STYLE_ID = 'slx-suite-daily-progress-style';
  const MAX_HISTORY = 14;

  const DEFAULT_GOALS = Object.freeze([
    { id: 'visit', label: 'Open Torn today', auto: true },
    { id: 'gym', label: 'Visit Gym / train', auto: true },
    { id: 'missions', label: 'Check Missions', auto: true },
    { id: 'prayer', label: 'Pray at Church', auto: true }
  ]);

  const dayKey = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const read = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw == null ? fallback : JSON.parse(raw); }
    catch { return fallback; }
  };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function goalTemplates() {
    const saved = read(GOALS_KEY, []);
    const custom = Array.isArray(saved) ? saved.filter(g => g && g.id && g.label && !DEFAULT_GOALS.some(d => d.id === g.id)) : [];
    return [...DEFAULT_GOALS, ...custom];
  }

  function blankDay(key = dayKey()) {
    return { day: key, routes: [], routeEvents: 0, actions: 0, activeSeconds: 0, completed: { visit: true }, updatedAt: Date.now() };
  }

  function loadStore() {
    const raw = read(STATE_KEY, {});
    const store = raw && typeof raw === 'object' ? raw : {};
    store.history = Array.isArray(store.history) ? store.history : [];
    const today = dayKey();
    if (!store.today || store.today.day !== today) {
      if (store.today?.day) {
        store.history.unshift(store.today);
        store.history = store.history.filter((row, i, arr) => row?.day && arr.findIndex(x => x?.day === row.day) === i).slice(0, MAX_HISTORY);
      }
      store.today = blankDay(today);
    }
    store.today.completed = store.today.completed && typeof store.today.completed === 'object' ? store.today.completed : { visit: true };
    store.today.completed.visit = true;
    store.today.routes = Array.isArray(store.today.routes) ? store.today.routes : [];
    return store;
  }

  let store = loadStore();
  const save = () => { store.today.updatedAt = Date.now(); write(STATE_KEY, store); };

  function complete(id, value = true) {
    store = loadStore();
    store.today.completed[id] = !!value;
    save();
    renderIfOpen();
  }

  function routeKey() { return `${location.pathname || ''}${location.search || ''}${location.hash || ''}`; }
  function recordRoute() {
    store = loadStore();
    const route = routeKey();
    store.today.routeEvents = Number(store.today.routeEvents || 0) + 1;
    if (route && !store.today.routes.includes(route)) store.today.routes.push(route);
    if (/\/gym\.php/i.test(location.pathname)) store.today.completed.gym = true;
    if (/\/missions?\.php/i.test(location.pathname) || /(?:^|[?&#])sid=missions?\b/i.test(location.href)) store.today.completed.missions = true;
    save();
    renderIfOpen();
  }

  function recordAction(label = '') {
    store = loadStore();
    store.today.actions = Number(store.today.actions || 0) + 1;
    store.today.lastAction = String(label || '').slice(0, 80);
    save();
    renderIfOpen();
  }

  function summary(row = store.today) {
    const goals = goalTemplates();
    const done = goals.filter(g => !!row.completed?.[g.id]).length;
    return { day: row.day, goals: goals.length, done, percent: goals.length ? Math.round(done * 100 / goals.length) : 100,
      routes: Array.isArray(row.routes) ? row.routes.length : 0, actions: Number(row.actions || 0), activeMinutes: Math.floor(Number(row.activeSeconds || 0) / 60) };
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style'); style.id = STYLE_ID;
    style.textContent = `
#${LAUNCHER_ID}{position:fixed;right:58px;bottom:calc(54px + env(safe-area-inset-bottom,0px));z-index:2147483200;width:40px;height:40px;border:1px solid rgba(255,255,255,.16);border-radius:11px;background:#0b1118;color:#e9a84d;font:800 17px/1 Arial;box-shadow:0 8px 24px rgba(0,0,0,.38)}
#${PANEL_ID}{position:fixed;inset:8px 8px calc(36px + env(safe-area-inset-bottom,0px));z-index:2147483500;display:flex;align-items:flex-start;justify-content:center;padding-top:max(8px,env(safe-area-inset-top,0px));background:rgba(0,0,0,.38);font-family:Inter,Arial,sans-serif;box-sizing:border-box}
#${PANEL_ID}[hidden]{display:none!important}#${PANEL_ID} *{box-sizing:border-box}
#${PANEL_ID} .dp-shell{width:min(620px,100%);max-height:100%;overflow:auto;border:1px solid #314154;border-radius:16px;background:linear-gradient(155deg,#18212d,#101720 72%);color:#e7edf5;box-shadow:0 18px 52px rgba(0,0,0,.55)}
#${PANEL_ID} .dp-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:12px 14px;background:#121b26;border-bottom:1px solid #2c3949}.dp-head b{flex:1;font-size:14px}.dp-head button{border:0;background:#202d3b;color:#eef3f8;border-radius:8px;min-width:34px;height:30px;font-weight:900}
#${PANEL_ID} .dp-body{padding:12px}.dp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.dp-stat,.dp-card{padding:10px;border:1px solid #2d3c4e;border-radius:11px;background:#131c27}.dp-stat strong{display:block;font-size:16px;color:#f0b35b}.dp-stat span{font-size:9px;color:#9ba9b8}
#${PANEL_ID} .dp-card{margin-top:9px}.dp-title{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;font-size:11px;font-weight:900}.dp-goal{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid rgba(255,255,255,.06);font-size:11px}.dp-goal input{width:18px;height:18px}.dp-goal small{margin-left:auto;color:#7f8d9c}.dp-add{display:flex;gap:7px;margin-top:9px}.dp-add input{flex:1;min-width:0;border:1px solid #34465a;border-radius:8px;background:#0d151e;color:#eef3f8;padding:8px}.dp-add button{border:1px solid #54452d;border-radius:8px;background:#7a5729;color:#fff;padding:0 12px;font-weight:800}.dp-history{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:7px}.dp-h{padding:8px;border-radius:9px;background:#0e1620;font-size:10px}.dp-h b{display:block;color:#f0b35b;font-size:13px}
@media(max-width:540px){#${PANEL_ID} .dp-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureLauncher() {
    if (!document.body) return;
    addStyle();
    let button = document.getElementById(LAUNCHER_ID);
    if (!button) {
      button = document.createElement('button'); button.id = LAUNCHER_ID; button.type = 'button'; button.textContent = '📊'; button.title = 'Daily Progress';
      button.addEventListener('click', open);
      document.body.appendChild(button);
    }
    return button;
  }

  function ensureBridge() {
    if (!document.body || document.getElementById(BRIDGE_ID)) return;
    const bridge = document.createElement('button'); bridge.id = BRIDGE_ID; bridge.hidden = true; bridge.type = 'button';
    bridge.dataset.version = VERSION; bridge.dataset.enabled = 'true';
    bridge.addEventListener('click', () => { const action = bridge.dataset.action || 'open'; if (action === 'open') open(); else if (action === 'reset') resetToday(); bridge.dataset.action = ''; });
    document.body.appendChild(bridge);
  }

  function render() {
    store = loadStore(); addStyle();
    let root = document.getElementById(PANEL_ID);
    if (!root) {
      root = document.createElement('div'); root.id = PANEL_ID; root.hidden = true;
      root.addEventListener('click', e => { if (e.target === root) close(); });
      document.body.appendChild(root);
    }
    const s = summary(); const goals = goalTemplates(); const history = store.history.slice(0, 7);
    root.innerHTML = `<div class="dp-shell"><div class="dp-head"><span>📊</span><b>Daily Progress · ${esc(s.day)}</b><button type="button" data-reset title="Reset today">↻</button><button type="button" data-close>×</button></div><div class="dp-body">
      <div class="dp-stats"><div class="dp-stat"><strong>${s.percent}%</strong><span>GOALS</span></div><div class="dp-stat"><strong>${s.routes}</strong><span>PAGES</span></div><div class="dp-stat"><strong>${s.actions}</strong><span>ACTIONS</span></div><div class="dp-stat"><strong>${s.activeMinutes}m</strong><span>ACTIVE</span></div></div>
      <div class="dp-card"><div class="dp-title"><span>Today's goals</span><span>${s.done}/${s.goals}</span></div>${goals.map(g => `<label class="dp-goal"><input type="checkbox" data-goal="${esc(g.id)}" ${store.today.completed[g.id]?'checked':''}><span>${esc(g.label)}</span>${g.auto?'<small>AUTO</small>':'<button type="button" data-remove="'+esc(g.id)+'" title="Remove">×</button>'}</label>`).join('')}<div class="dp-add"><input data-new-goal maxlength="60" placeholder="Add recurring daily goal"><button type="button" data-add>Add</button></div></div>
      <div class="dp-card"><div class="dp-title"><span>Last days</span><span>local only</span></div><div class="dp-history">${history.length?history.map(row=>{const x=summary(row);return `<div class="dp-h"><b>${x.percent}%</b>${esc(x.day)}<br>${x.routes} pages · ${x.activeMinutes}m</div>`}).join(''):'<div class="dp-h">History starts today.</div>'}</div></div>
    </div></div>`;
    root.querySelector('[data-close]').onclick = close;
    root.querySelector('[data-reset]').onclick = () => { if (confirm('Reset today\'s Daily Progress?')) resetToday(); };
    root.querySelectorAll('[data-goal]').forEach(box => box.addEventListener('change', () => complete(box.dataset.goal, box.checked)));
    root.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); removeGoal(btn.dataset.remove); }));
    root.querySelector('[data-add]').onclick = () => { const input = root.querySelector('[data-new-goal]'); if (input?.value.trim()) { addGoal(input.value.trim()); input.value=''; } };
    return root;
  }

  function renderIfOpen() { const root = document.getElementById(PANEL_ID); if (root && !root.hidden) render(); }
  function open() { ensureLauncher(); ensureBridge(); const root = render(); root.hidden = false; recordAction('Open Daily Progress'); return true; }
  function close() { const root = document.getElementById(PANEL_ID); if (root) root.hidden = true; }
  function resetToday() { store = loadStore(); store.today = blankDay(dayKey()); save(); renderIfOpen(); }
  function addGoal(label) {
    const text = String(label || '').trim().slice(0,60); if (!text) return null;
    const custom = read(GOALS_KEY, []); const list = Array.isArray(custom) ? custom : [];
    const id = `custom-${Date.now().toString(36)}`; list.push({ id, label: text, auto: false }); write(GOALS_KEY, list); renderIfOpen(); return id;
  }
  function removeGoal(id) { const list = read(GOALS_KEY, []); write(GOALS_KEY, (Array.isArray(list)?list:[]).filter(g => g?.id !== id)); delete store.today.completed[id]; save(); renderIfOpen(); }

  function onDocumentClick(event) {
    const target = event.target?.closest?.('button,a,[role="button"],input[type="button"],input[type="submit"]'); if (!target) return;
    const text = `${target.textContent || ''} ${target.value || ''} ${target.getAttribute?.('aria-label') || ''}`.trim();
    if (/pray/i.test(text) && /church\.php/i.test(location.pathname)) complete('prayer', true);
    if (target.id?.startsWith('sakalux-module-bridge-') || target.closest?.('#sakalux-master-suite-window,[id*="master-suite" i]')) recordAction(text || target.id || 'Suite action');
  }

  function heartbeat() { if (document.visibilityState === 'hidden') return; store = loadStore(); store.today.activeSeconds = Number(store.today.activeSeconds || 0) + 30; save(); renderIfOpen(); }
  function start() {
    ensureLauncher(); ensureBridge(); recordRoute();
    document.addEventListener('click', onDocumentClick, true);
    const router = window.SakaLuXCore?.router;
    if (router?.onChange) { router.onChange(recordRoute); router.bind?.(); }
    else { addEventListener('hashchange', recordRoute, {passive:true}); addEventListener('popstate', recordRoute, {passive:true}); }
    setInterval(heartbeat, 30000);
  }

  window.SakaLuXSuiteDailyProgress = Object.freeze({ version: VERSION, open, close, snapshot: () => ({ today: {...loadStore().today}, summary: summary(loadStore().today), history: [...loadStore().history] }), resetToday, addGoal, complete });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
/* SakaLuX Suite Daily Progress Dashboard — END */'''

text = SUITE.read_text(encoding='utf-8')
if BEGIN not in text:
    m = re.search(r'(?m)^//\s*@version\s+(\S+)\s*$', text)
    if not m:
        raise RuntimeError('Suite metadata version not found')
    current = m.group(1)
    text = text[:m.start(1)] + NEW + text[m.end(1):]
    # Keep the Suite runtime's own canonical version synchronized when it uses the previous release value.
    text = re.sub(r"(?m)(\b(?:VERSION|SUITE_VERSION)\s*=\s*['\"])" + re.escape(current) + r"(['\"])", r"\g<1>" + NEW + r"\2", text)
    text = text.rstrip() + '\n\n' + FEATURE + '\n'
    SUITE.write_text(text, encoding='utf-8')

# Documentation: preserve old history and add a new current release section.
doc = DOC.read_text(encoding='utf-8')
doc = re.sub(r'(?m)^\*\*v' + re.escape(OLD) + r'\*\*$', '**v' + NEW + '**', doc, count=1)
doc = re.sub(r'(?m)^- Canonical version: \*\*v' + re.escape(OLD) + r'\*\*$', '- Canonical version: **v' + NEW + '**', doc, count=1)
release_note = '''### v0.9.939 — Daily Progress Dashboard
- Adds the Suite Daily Progress dashboard with daily goal completion, unique pages visited, Suite actions and active-time tracking.
- Includes automatic goals for Torn visit, Gym, Missions and Church prayer, plus user-defined recurring goals.
- Keeps a rolling 14-day local history and exposes `SakaLuXSuiteDailyProgress` for diagnostics/integration.
- Uses local browser storage only; no new API requests or remote sync are introduced.

'''
if '### v0.9.939 — Daily Progress Dashboard' not in doc:
    marker = '## Release history / Changelog\n\n'
    if marker not in doc:
        raise RuntimeError('Suite changelog marker missing')
    doc = doc.replace(marker, marker + release_note, 1)
doc = re.sub(r'\*\*v' + re.escape(OLD) + r' — Release documentation synchronized with the current Suite userscript version\*\*', '**v' + NEW + ' — Daily Progress Dashboard**', doc, count=1)
DOC.write_text(doc, encoding='utf-8')

print('Priority 7 Daily Progress Dashboard migration applied.')
