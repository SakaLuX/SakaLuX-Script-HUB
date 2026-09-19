from pathlib import Path
import re

p = Path('SakaLuX-Suite.user.js')
s = p.read_text(encoding='utf-8')
marker = '/* SakaLuX Suite War Quick Attack — BEGIN */'
if marker in s:
    raise SystemExit('War Quick Attack already present')

m = re.search(r'^// @version\s+(\d+)\.(\d+)\.(\d+)\s*$', s, re.M)
if not m:
    raise SystemExit('Suite @version not found')
old = tuple(map(int, m.groups()))
new = f'{old[0]}.{old[1]}.{old[2] + 1}'
s = re.sub(r'^// @version\s+\d+\.\d+\.\d+\s*$', f'// @version      {new}', s, count=1, flags=re.M)
s = re.sub(r"const VERSION = '\d+\.\d+\.\d+';", f"const VERSION = '{new}';", s, count=1)

block = r'''

/* SakaLuX Suite War Quick Attack — BEGIN */
(() => {
  'use strict';

  const STYLE_ID = 'sakalux-war-quick-attack-style';
  const BTN_CLASS = 'sakalux-war-quick-attack';
  const START_CLASS = 'sakalux-war-start-highlight';

  const onFactionWarPage = () => /\/factions\.php/i.test(location.pathname) && /war|ranked|territory|faction/i.test(location.href);
  const onAttackPage = () => /loader\.php/i.test(location.pathname) && new URLSearchParams(location.search).get('sid') === 'attack';

  function getPlayerIdFromHref(href) {
    if (!href) return null;
    try {
      const u = new URL(href, location.origin);
      const direct = u.searchParams.get('user2ID') || u.searchParams.get('XID') || u.searchParams.get('ID');
      if (direct && /^\d+$/.test(direct)) return direct;
      const m = u.href.match(/(?:XID|user2ID|ID)=(\d+)/i);
      return m ? m[1] : null;
    } catch {
      const m = String(href).match(/(?:XID|user2ID|ID)=(\d+)/i);
      return m ? m[1] : null;
    }
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
.${BTN_CLASS}{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:38px!important;min-height:30px!important;margin-left:6px!important;padding:4px 8px!important;border:1px solid #b91c1c!important;border-radius:8px!important;background:linear-gradient(180deg,#ef4444,#991b1b)!important;color:#fff!important;font:800 12px/1 Arial,sans-serif!important;text-decoration:none!important;box-shadow:0 2px 8px #0005!important;vertical-align:middle!important;cursor:pointer!important}
.${BTN_CLASS}:active{transform:scale(.97)!important}
.${START_CLASS}{position:fixed!important;left:max(8px,env(safe-area-inset-left,0px))!important;right:max(8px,env(safe-area-inset-right,0px))!important;bottom:max(10px,calc(env(safe-area-inset-bottom,0px) + 8px))!important;width:auto!important;max-width:none!important;min-height:54px!important;z-index:2147483000!important;font-size:18px!important;font-weight:900!important;border-radius:12px!important;box-shadow:0 10px 28px #0009!important;animation:slxWarPulse 1.2s ease-in-out 2!important}
@keyframes slxWarPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.015)}}
`;
    (document.head || document.documentElement).appendChild(st);
  }

  function addQuickAttackButtons(root = document) {
    if (!onFactionWarPage()) return;
    ensureStyle();
    const links = root.querySelectorAll?.('a[href*="profiles.php"],a[href*="XID="],a[href*="user2ID="]') || [];
    for (const link of links) {
      if (link.closest('.sakalux-war-quick-attack-wrap') || link.dataset.slxWarScanned === '1') continue;
      link.dataset.slxWarScanned = '1';
      const id = getPlayerIdFromHref(link.getAttribute('href'));
      if (!id) continue;
      const row = link.closest('li,[class*="member"],[class*="row"],[class*="user"],[class*="enemy"],tr') || link.parentElement;
      if (!row || row.querySelector(`.${BTN_CLASS}[data-user-id="${id}"]`)) continue;

      const a = document.createElement('a');
      a.className = BTN_CLASS;
      a.dataset.userId = id;
      a.href = `/loader.php?sid=attack&user2ID=${encodeURIComponent(id)}`;
      a.textContent = '⚔️';
      a.title = 'Quick Attack';
      a.setAttribute('aria-label', 'Quick Attack');
      a.addEventListener('click', (e) => {
        e.stopPropagation();
      }, true);
      link.insertAdjacentElement('afterend', a);
    }
  }

  function isVisible(el) {
    if (!el || !el.isConnected || el.disabled) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  function findNativeStartButton() {
    const candidates = document.querySelectorAll('button,input[type="button"],input[type="submit"],[role="button"]');
    for (const el of candidates) {
      const text = `${el.textContent || ''} ${el.value || ''} ${el.getAttribute('aria-label') || ''} ${el.title || ''}`.replace(/\s+/g,' ').trim().toLowerCase();
      if (!text) continue;
      if ((text.includes('start fight') || text.includes('join fight')) && isVisible(el)) return el;
    }
    return null;
  }

  function highlightStartButton() {
    if (!onAttackPage()) return;
    ensureStyle();
    const btn = findNativeStartButton();
    if (!btn) return;
    document.querySelectorAll(`.${START_CLASS}`).forEach(el => { if (el !== btn) el.classList.remove(START_CLASS); });
    btn.classList.add(START_CLASS);
    btn.dataset.slxWarQuickAttack = '1';
  }

  let queued = false;
  function refresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      addQuickAttackButtons();
      highlightStartButton();
    });
  }

  refresh();
  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', () => setTimeout(refresh, 60));
  window.addEventListener('hashchange', () => setTimeout(refresh, 60));
  setInterval(refresh, 1500);
})();
/* SakaLuX Suite War Quick Attack — END */
'''

s = s.rstrip() + block + '\n'
p.write_text(s, encoding='utf-8')
print(f'Updated Suite {old[0]}.{old[1]}.{old[2]} -> {new}')
