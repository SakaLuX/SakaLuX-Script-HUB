from pathlib import Path
import re

p = Path('SakaLuX-Suite.user.js')
s = p.read_text(encoding='utf-8')
start = '/* SakaLuX Suite War Quick Attack — BEGIN */'
end = '/* SakaLuX Suite War Quick Attack — END */'
if start not in s or end not in s:
    raise SystemExit('War Quick Attack block not found')

m = re.search(r'^// @version\s+(\d+)\.(\d+)\.(\d+)\s*$', s, re.M)
if not m:
    raise SystemExit('Suite @version not found')
old = tuple(map(int, m.groups()))
new = f'{old[0]}.{old[1]}.{old[2] + 1}'
s = re.sub(r'^// @version\s+\d+\.\d+\.\d+\s*$', f'// @version      {new}', s, count=1, flags=re.M)
s = re.sub(r"const VERSION = '\d+\.\d+\.\d+';", f"const VERSION = '{new}';", s, count=1)

block = r'''/* SakaLuX Suite War Quick Attack — BEGIN */
(() => {
  'use strict';

  const STYLE_ID = 'sakalux-war-quick-attack-style';
  const BTN_CLASS = 'sakalux-war-quick-attack';
  const START_CLASS = 'sakalux-war-start-highlight';
  const PANEL_ID = 'sakalux-war-quick-attack-module';
  const STORAGE_KEY = 'SakaLuX_Suite_WarQuickAttack_Enabled';

  const onFactionWarPage = () => /\/factions\.php/i.test(location.pathname) && /war|ranked|territory|faction/i.test(location.href);
  const onAttackPage = () => /loader\.php/i.test(location.pathname) && new URLSearchParams(location.search).get('sid') === 'attack';

  function isEnabled() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw === null ? true : raw === '1';
    } catch { return true; }
  }

  function setEnabled(value) {
    try { localStorage.setItem(STORAGE_KEY, value ? '1' : '0'); } catch {}
    applyEnabledState();
  }

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
#${PANEL_ID}{display:flex;align-items:center;gap:10px;margin:8px 0;padding:9px 10px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(16,23,32,.95);color:#edf3fa;font:700 12px/1.2 Arial,sans-serif;box-sizing:border-box}
#${PANEL_ID} .slx-wqa-title{flex:1;min-width:0}
#${PANEL_ID} .slx-wqa-title b{display:block;font-size:13px;color:#fff}
#${PANEL_ID} .slx-wqa-title span{display:block;margin-top:2px;color:#93a4b7;font-weight:500}
#${PANEL_ID} .slx-wqa-toggle{border:1px solid #526174;border-radius:999px;padding:6px 10px;min-width:58px;background:#202a36;color:#fff;font:800 11px Arial,sans-serif;cursor:pointer}
#${PANEL_ID}[data-enabled="1"] .slx-wqa-toggle{background:#14532d;border-color:#22c55e;color:#dcfce7}
#${PANEL_ID}[data-enabled="0"] .slx-wqa-toggle{background:#3f1d1d;border-color:#ef4444;color:#fee2e2}
@keyframes slxWarPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.015)}}
`;
    (document.head || document.documentElement).appendChild(st);
  }

  function cleanupQuickAttackUI() {
    document.querySelectorAll(`.${BTN_CLASS}`).forEach(el => el.remove());
    document.querySelectorAll(`.${START_CLASS}`).forEach(el => el.classList.remove(START_CLASS));
    document.querySelectorAll('[data-slx-war-scanned="1"]').forEach(el => delete el.dataset.slxWarScanned);
  }

  function ensureFactionModuleControl() {
    if (!onFactionWarPage()) {
      document.getElementById(PANEL_ID)?.remove();
      return;
    }
    ensureStyle();
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.innerHTML = `<div class="slx-wqa-title"><b>⚔️ War Quick Attack</b><span>Direct attack shortcut + highlighted Start Fight</span></div><button type="button" class="slx-wqa-toggle"></button>`;
      const host = document.querySelector('#faction-page-wrap,#mainContainer,[class*="faction"][class*="content"],main') || document.querySelector('#mainContainer') || document.body;
      if (host.firstChild) host.insertBefore(panel, host.firstChild); else host.appendChild(panel);
      panel.querySelector('.slx-wqa-toggle').addEventListener('click', () => setEnabled(!isEnabled()));
    }
    const enabled = isEnabled();
    panel.dataset.enabled = enabled ? '1' : '0';
    const toggle = panel.querySelector('.slx-wqa-toggle');
    if (toggle) {
      toggle.textContent = enabled ? 'ON' : 'OFF';
      toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    }
  }

  function addQuickAttackButtons(root = document) {
    if (!onFactionWarPage() || !isEnabled()) return;
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
      a.addEventListener('click', (e) => e.stopPropagation(), true);
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
    if (!onAttackPage() || !isEnabled()) return;
    ensureStyle();
    const btn = findNativeStartButton();
    if (!btn) return;
    document.querySelectorAll(`.${START_CLASS}`).forEach(el => { if (el !== btn) el.classList.remove(START_CLASS); });
    btn.classList.add(START_CLASS);
    btn.dataset.slxWarQuickAttack = '1';
  }

  function applyEnabledState() {
    ensureFactionModuleControl();
    if (!isEnabled()) cleanupQuickAttackUI();
    else refresh();
  }

  let queued = false;
  function refresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      ensureFactionModuleControl();
      if (!isEnabled()) {
        cleanupQuickAttackUI();
        return;
      }
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
/* SakaLuX Suite War Quick Attack — END */'''

pattern = re.escape(start) + r'[\s\S]*?' + re.escape(end)
s2, n = re.subn(pattern, block, s, count=1)
if n != 1:
    raise SystemExit(f'Expected to replace 1 block, got {n}')

p.write_text(s2, encoding='utf-8')
print(f'Updated Suite {old[0]}.{old[1]}.{old[2]} -> {new} with faction toggle')
