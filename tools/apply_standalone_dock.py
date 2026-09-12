from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
MARK_START = '/* SakaLuX Standalone Dock Bootstrap — BEGIN */'
MARK_END = '/* SakaLuX Standalone Dock Bootstrap — END */'

BOOTSTRAP = r'''/* SakaLuX Standalone Dock Bootstrap — BEGIN */
(() => {
  'use strict';
  const HUB_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
  const INTERVAL = 12 * 60 * 60 * 1000;
  const DOCK_ID = 'sakalux-standalone-dock';
  const PROMPT_ID = 'sakalux-hub-install-prompt';
  const STYLE_ID = 'sakalux-standalone-dock-style';

  const hubInstalled = () => !!(window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button'));

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#${DOCK_ID}{position:fixed;right:10px;bottom:72px;z-index:2147483000;display:flex;flex-direction:column;gap:6px;max-width:min(260px,calc(100vw - 20px));padding:8px;background:rgba(13,17,23,.96);border:1px solid #3b4654;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.45);font:12px Arial,sans-serif}
#${DOCK_ID}[data-collapsed="1"] .slx-dock-items{display:none}
#${DOCK_ID} .slx-dock-head{display:flex;align-items:center;gap:6px}
#${DOCK_ID} .slx-dock-title{flex:1;color:#facc15;font-weight:900}
#${DOCK_ID} button,#${DOCK_ID} a{box-sizing:border-box!important;position:static!important;inset:auto!important;transform:none!important;float:none!important;margin:0!important;min-width:0!important;max-width:none!important;width:100%!important;height:auto!important;min-height:34px!important;padding:7px 9px!important;border-radius:8px!important;font:700 12px/1.2 Arial,sans-serif!important;white-space:normal!important}
#${DOCK_ID} .slx-dock-head button{width:auto!important;min-height:28px!important;padding:4px 7px!important}
#${DOCK_ID} .slx-dock-install{background:#8a5a00!important;border:1px solid #f59e0b!important;color:#fff!important;text-decoration:none!important;text-align:center!important;display:block!important}
#${DOCK_ID} .slx-dock-items{display:flex;flex-direction:column;gap:5px}
`;
    (document.head || document.documentElement).appendChild(s);
  }

  function ensureDock() {
    if (hubInstalled()) {
      document.getElementById(DOCK_ID)?.remove();
      document.getElementById(PROMPT_ID)?.remove();
      return null;
    }
    addStyle();
    let dock = document.getElementById(DOCK_ID);
    if (dock) return dock;
    dock = document.createElement('div');
    dock.id = DOCK_ID;
    dock.innerHTML = `<div class="slx-dock-head"><span class="slx-dock-title">SakaLuX Scripts</span><button type="button" data-slx-collapse>−</button></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${HUB_URL}">⬇ Install SakaLuX Hub</a>`;
    (document.body || document.documentElement).appendChild(dock);
    dock.querySelector('[data-slx-collapse]').addEventListener('click', () => {
      const collapsed = dock.dataset.collapsed === '1';
      dock.dataset.collapsed = collapsed ? '0' : '1';
      dock.querySelector('[data-slx-collapse]').textContent = collapsed ? '−' : '+';
    });
    return dock;
  }

  function eligible(el) {
    if (!el || el.nodeType !== 1 || el.closest('#' + DOCK_ID) || el.id === 'sakalux-hub-button') return false;
    if (!['BUTTON','A','DIV'].includes(el.tagName)) return false;
    const ident = `${el.id || ''} ${el.className || ''}`.toLowerCase();
    if (!/(slx|sakalux)/.test(ident)) return false;
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.width > 320 || r.height > 100) return false;
    if (/panel|modal|prompt|toast|style|overlay|dock/i.test(ident)) return false;
    return true;
  }

  function collectLaunchers() {
    const dock = ensureDock();
    if (!dock) return;
    const items = dock.querySelector('.slx-dock-items');
    document.querySelectorAll('button,a,div').forEach(el => {
      if (!eligible(el)) return;
      el.dataset.slxDocked = '1';
      items.appendChild(el);
    });
  }

  function maybePrompt() {
    if (hubInstalled() || document.getElementById(PROMPT_ID)) return;
    let last = 0;
    try { last = Number(localStorage.getItem(LAST_KEY) || 0); } catch {}
    if (last && Date.now() - last < INTERVAL) return;
    try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch {}
    const p = document.createElement('div');
    p.id = PROMPT_ID;
    p.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';
    p.innerHTML = `<div style="width:min(380px,100%);background:#111820;color:#fff;border:1px solid #465365;border-radius:14px;padding:18px;font:14px Arial,sans-serif;box-shadow:0 16px 50px #0008"><b style="font-size:17px">Install SakaLuX Script Hub?</b><div style="margin-top:8px;color:#cbd5e1;line-height:1.45">Keep all SakaLuX scripts together, with shared settings and controls.</div><div style="display:flex;gap:8px;margin-top:14px"><button type="button" data-slx-later style="flex:1;padding:10px;border-radius:8px;background:#202a36;color:#fff;border:1px solid #526174">Later</button><button type="button" data-slx-install style="flex:1;padding:10px;border-radius:8px;background:#8a5a00;color:#fff;border:1px solid #f59e0b;font-weight:900">Install Hub</button></div></div>`;
    (document.body || document.documentElement).appendChild(p);
    p.querySelector('[data-slx-later]').addEventListener('click', () => p.remove());
    p.querySelector('[data-slx-install]').addEventListener('click', () => { location.href = HUB_URL; });
  }

  function start() {
    if (hubInstalled()) return;
    ensureDock();
    collectLaunchers();
    setTimeout(maybePrompt, 1200);
    let timer = 0;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (hubInstalled()) {
          document.getElementById(DOCK_ID)?.remove();
          document.getElementById(PROMPT_ID)?.remove();
        } else collectLaunchers();
      }, 80);
    }).observe(document.documentElement, {childList:true, subtree:true});
    setInterval(() => { if (!hubInstalled()) { collectLaunchers(); maybePrompt(); } }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
/* SakaLuX Standalone Dock Bootstrap — END */'''


def strip_old_bootstrap(text: str) -> str:
    pattern = re.compile(re.escape(MARK_START) + r'.*?' + re.escape(MARK_END) + r'\n?', re.S)
    return re.sub(pattern, '', text)


def normalize_12h(text: str) -> str:
    text = re.sub(r'(HUB_PROMPT_INTERVAL\s*=\s*)86400000\b', r'\g<1>43200000', text)
    text = re.sub(r'(HUB_PROMPT_INTERVAL\s*=\s*)24\s*\*\s*60\s*\*\s*60\s*\*\s*1000', r'\g<1>12 * 60 * 60 * 1000', text)
    return text


def inject(text: str) -> str:
    text = strip_old_bootstrap(text)
    text = normalize_12h(text)
    marker = '// ==/UserScript=='
    idx = text.find(marker)
    if idx < 0:
        return text
    end = idx + len(marker)
    return text[:end] + '\n\n' + BOOTSTRAP + text[end:]


changed = []
for path in ROOT.glob('*.user.js'):
    if path.name == 'SakaLuX-Script-Hub.user.js':
        continue
    original = path.read_text(encoding='utf-8')
    updated = inject(original)
    if updated != original:
        path.write_text(updated, encoding='utf-8')
        changed.append(path.name)

print('Updated', len(changed), 'userscripts')
for name in changed:
    print(' -', name)
