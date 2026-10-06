/* SakaLuX Shared Dock Runtime v1 - Priority 6 foundation
 * Source-only module. Not installed directly by users.
 * Intended to be embedded with Shared Core into standalone userscripts.
 */
(() => {
  'use strict';

  const g = globalThis;
  const NS = 'SakaLuXDockRuntime';
  const VERSION = '1.1.8';
  const HUB_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const OPEN_KEY = 'SakaLuX_STANDALONE_DOCK_OPEN';
  const PROMPT_KEY = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
  const PROMPT_INTERVAL = 12 * 60 * 60 * 1000;
  const IDS = Object.freeze({
    dock: 'sakalux-standalone-dock',
    prompt: 'sakalux-hub-install-prompt',
    native: 'sakalux-standalone-native-s',
    fallback: 'sakalux-standalone-fallback-s',
    style: 'sakalux-standalone-dock-runtime-style'
  });

  function versionParts(v){return String(v||'0').match(/\d+/g)?.map(Number)||[0]}
  function compareVersion(a,b){const x=versionParts(a),y=versionParts(b);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0?1:-1}return 0}
  const currentRuntime=g.__SakaLuXDockRuntimeCurrent||g[NS];
  if(currentRuntime?.version&&compareVersion(currentRuntime.version,VERSION)>=0)return;
  try { currentRuntime?.removeUi?.(); } catch {}

  const modules = g.__SakaLuXDockRuntimeModules instanceof Map
    ? g.__SakaLuXDockRuntimeModules
    : new Map();
  g.__SakaLuXDockRuntimeModules = modules;
  let observer = null;
  let observerQueued = false;
  let runtimeSignalsBound = false;
  let promptScheduled = false;

  function core() { return g.SakaLuXCore || null; }
  function doc() { return typeof document === 'undefined' ? null : document; }
  function hubInstalled() { return Boolean(core()?.hub?.installed?.()); }
  let openState = false;
  let autoCloseTimer = 0;
  let userOpened = false;
  function readOpen() { return false; }
  function writeOpen(value) { openState = Boolean(value); try { localStorage.removeItem(OPEN_KEY); } catch {} }
  function forceCloseDock() {
    userOpened = false;
    openState = false;
    clearTimeout(autoCloseTimer);
    const p = doc()?.getElementById(IDS.dock);
    if (p) { p.dataset.open = '0'; p.hidden = true; }
    try { localStorage.removeItem(OPEN_KEY); } catch {}
    return false;
  }
  function armAutoClose() {
    clearTimeout(autoCloseTimer);
    if (!openState) return;
    autoCloseTimer = setTimeout(() => forceCloseDock(), 6000);
  }

  function normalize(entry = {}) {
    const id = String(entry.id || '').trim();
    if (!id) throw new Error('Dock module id is required');
    return Object.freeze({
      id,
      name: String(entry.name || id),
      icon: String(entry.icon || '🧩'),
      version: String(entry.version || ''),
      open: typeof entry.open === 'function' ? entry.open : null,
      enabled: typeof entry.enabled === 'function' ? entry.enabled : () => true
    });
  }

  function sorted() {
    const values = [...modules.values()];
    const sorter = core()?.dock?.sort;
    return typeof sorter === 'function' ? sorter.call(core().dock, values) : values;
  }

  function removeNode(id) { try { doc()?.getElementById(id)?.remove(); } catch {} }

  function removeUi() {
    removeNode(IDS.dock);
    removeNode(IDS.prompt);
    removeNode(IDS.native);
    removeNode(IDS.fallback);
  }

  function addStyle() {
    const d = doc();
    if (!d || d.getElementById(IDS.style)) return;
    const style = d.createElement('style');
    style.id = IDS.style;
    style.textContent = `
#${IDS.dock}{position:fixed;right:10px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:min(220px,calc(100vw - 20px));max-height:calc(100dvh - 190px);overflow:hidden;padding:10px;background:linear-gradient(180deg,rgba(10,14,20,.992),rgba(7,10,15,.992));border:1px solid rgba(255,255,255,.09);border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;display:none;flex-direction:column;box-sizing:border-box}
#${IDS.dock}[data-open="1"]{display:flex}
#${IDS.dock} .slx-dock-head{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;padding:4px 6px 10px;margin-bottom:7px;border-bottom:1px solid rgba(255,255,255,.055)}
#${IDS.dock} .slx-dock-mark{width:30px;height:30px;display:grid;place-items:center;padding:0;margin:0;border-radius:10px;background:linear-gradient(180deg,#293545,#1a2430);border:1px solid rgba(223,189,97,.38);color:#dfbd61;font:900 16px/30px Arial,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.2);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#${IDS.dock} .slx-dock-title{color:#f4f7fb;font-size:11px;font-weight:900;line-height:1.15;letter-spacing:.01em;text-align:center}
#${IDS.dock} .slx-dock-items{overflow:auto;min-height:0}
#${IDS.dock} .sl-dock-row{display:flex;align-items:center;gap:8px;width:100%;min-height:34px;margin:0 0 6px;padding:7px 9px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:#111b26;color:#eaf0f6;text-align:left;font:700 11px/1.2 Arial,sans-serif}
#${IDS.dock} .sl-dock-row:last-child{margin-bottom:0}#${IDS.dock} .sl-dock-row[disabled]{opacity:.45}
#${IDS.dock} .slx-dock-install{display:block;margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.08);color:#d8a45c;text-align:center;text-decoration:none;font-size:10px;font-weight:800}
#${IDS.fallback}{position:fixed;right:10px;bottom:calc(44px + env(safe-area-inset-bottom,0px));z-index:2147482900;width:38px;height:38px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:#0b1118;color:#e9a84d;font:800 15px/1 Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}
#${IDS.native}{all:unset!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;vertical-align:middle!important;box-sizing:border-box!important;flex:0 0 24px!important;width:24px!important;min-width:24px!important;max-width:24px!important;height:24px!important;min-height:24px!important;max-height:24px!important;margin:0 3px 0 0!important;padding:0!important;border:0!important;border-radius:0!important;list-style:none!important;background:transparent!important;background-image:none!important;box-shadow:none!important;filter:none!important;transform:none!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;overflow:visible!important}#${IDS.native}::before,#${IDS.native}::after,#${IDS.native} .slx-s-link::before,#${IDS.native} .slx-s-link::after{content:none!important;display:none!important;background:none!important;background-image:none!important}#${IDS.native} .slx-s-link{all:unset!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;filter:none!important;transform:none!important;color:#dfbd61!important;font:900 17px/24px Arial,sans-serif!important;line-height:24px!important;text-align:center!important;text-decoration:none!important;text-shadow:0 1px 1px rgba(0,0,0,.75),0 0 4px rgba(223,189,97,.2)!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}#${IDS.native} .slx-s-link:active{transform:scale(.92)!important}

#${IDS.prompt}{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483600;width:min(360px,calc(100vw - 20px));padding:10px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0b1118;color:#eef3f8;font:600 11px/1.35 Arial,sans-serif;box-shadow:0 16px 42px rgba(0,0,0,.45)}
#${IDS.prompt} .slx-prompt-actions{display:flex;gap:7px;margin-top:8px}#${IDS.prompt} button{flex:1;min-height:30px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#17212d;color:#eef3f8;font-weight:800}
`;
    (d.head || d.documentElement).appendChild(style);
  }

  function findStatusIconList() {
    const d=doc(); if(!d)return null;
    const selectors=['ul[class*="statusIcons"][class*="big"]','ul[class*="status-icons"][class*="big"]','ul[class*="statusIcons"]','ul[class*="status-icons"]'];
    const lists=selectors.flatMap(q=>[...d.querySelectorAll(q)]);
    return lists.find(list=>list.isConnected&&[...list.children].some(item=>item.querySelector?.('a')))||null;
  }
  function ensureLauncher(){
    const d=doc();
    if(!d||hubInstalled()){removeNode(IDS.native);removeNode(IDS.fallback);return null;}
    const list=findStatusIconList();
    let item=d.getElementById(IDS.native);
    if(!list){item?.remove();return null;}
    if(!item){
      item=d.createElement('li');
      item.id=IDS.native;
    }
    item.className='slx-standalone-native';
    item.removeAttribute?.('style');
    let link=item.querySelector('a.slx-s-link');
    if(!link){
      item.replaceChildren();
      link=d.createElement('a');
      link.href='#';link.className='slx-s-link';link.textContent='S';
      link.title='SakaLuX Scripts';link.setAttribute('aria-label','SakaLuX Scripts');
      item.appendChild(link);
    }else{
      link.textContent='S';link.href='#';link.className='slx-s-link';
    }
    link.onclick=e=>{
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
      const p=d.getElementById(IDS.dock);
      const open=p?.dataset.open==='1'&&!p.hidden;
      if(open)forceCloseDock();else{userOpened=true;toggleDock(true);}
    };
    const first=[...list.children].find(x=>x!==item)||null;
    if(first){
      if(list.firstElementChild!==item) list.insertBefore(item,first);
    }else if(item.parentElement!==list){
      list.appendChild(item);
    }
    removeNode(IDS.fallback);
    return item;
  }

  function ensureDock() {
    const d = doc();
    if (!d || hubInstalled()) { removeUi(); return null; }
    let panel = d.getElementById(IDS.dock);
    if (!panel) {
      panel = d.createElement('div');
      panel.id = IDS.dock;
      panel.dataset.open = '0';
      panel.hidden = true;
      writeOpen(false);
      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const close = d.createElement('button'); close.type = 'button'; close.className = 'slx-dock-mark'; close.textContent = 'S'; close.title = 'Close SakaLuX Scripts';
      close.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); forceCloseDock(); });
      const title = d.createElement('div'); title.className = 'slx-dock-title'; title.textContent = 'SakaLuX Scripts';
      const sub = d.createElement('div'); sub.className = 'slx-dock-sub'; sub.textContent = 'Standalone';
      head.appendChild(close); head.appendChild(title); head.appendChild(sub);
      const items = d.createElement('div'); items.className = 'slx-dock-items';
      const install = d.createElement('a'); install.className = 'slx-dock-install'; install.href = HUB_URL; install.textContent = 'Install SakaLuX Hub';
      panel.appendChild(head); panel.appendChild(items); panel.appendChild(install);
      (d.body || d.documentElement).appendChild(panel);
    }
    return panel;
  }

  function toggleDock(force) {
    if (hubInstalled()) { removeUi(); return false; }
    render();
    const panel = doc()?.getElementById(IDS.dock);
    if (!panel) return false;
    const next = typeof force === 'boolean' ? force : panel.dataset.open !== '1';
    if (next) {
      userOpened = true;
      openState = true;
      panel.dataset.open = '1';
      panel.hidden = false;
      writeOpen(true);
      armAutoClose();
    } else forceCloseDock();
    return next;
  }

  function render() {
    const d = doc();
    if (!d) return null;
    if (hubInstalled()) {
      try { d.documentElement?.setAttribute('data-sakalux-hub-active', '1'); } catch {}
      try { d.body?.setAttribute('data-sakalux-hub-active', '1'); } catch {}
      removeUi();
      return null;
    }
    try { d.body?.removeAttribute('data-sakalux-hub-active'); } catch {}
    addStyle();
    ensureLauncher();
    const panel = ensureDock();
    if (!panel) return null;
    const box = typeof panel.querySelector === 'function' ? panel.querySelector('.slx-dock-items') : panel.children?.[1];
    if (!box) return panel;
    box.replaceChildren?.();
    for (const entry of sorted()) {
      const button = d.createElement('button');
      button.type = 'button';
      button.className = 'sl-dock-row';
      button.dataset.moduleId = entry.id;
      button.textContent = `${entry.icon} ${entry.name}`;
      let enabled = true;
      try { enabled = entry.enabled() !== false; } catch { enabled = false; }
      button.disabled = !enabled || !entry.open;
      button.addEventListener?.('click', () => {
        try { entry.open?.(); } finally { toggleDock(false); }
      });
      box.appendChild(button);
    }
    if(!userOpened) forceCloseDock(); else panel.hidden = panel.dataset.open !== '1';
    return panel;
  }

  function maybePrompt() {
    const d = doc();
    if (!d || hubInstalled() || !d.body) return false;
    let last = 0;
    try { last = Number(localStorage.getItem(PROMPT_KEY) || 0); } catch {}
    if (Date.now() - last < PROMPT_INTERVAL || d.getElementById(IDS.prompt)) return false;
    try { localStorage.setItem(PROMPT_KEY, String(Date.now())); } catch {}
    const prompt = d.createElement('div'); prompt.id = IDS.prompt;
    const text = d.createElement('div'); text.textContent = 'Install SakaLuX Script Hub for one control center, health checks and module management.';
    const actions = d.createElement('div'); actions.className = 'slx-prompt-actions';
    const later = d.createElement('button'); later.type = 'button'; later.textContent = 'LATER'; later.addEventListener?.('click', () => prompt.remove());
    const install = d.createElement('button'); install.type = 'button'; install.textContent = 'INSTALL HUB'; install.addEventListener?.('click', () => { location.href = HUB_URL; });
    actions.appendChild(later); actions.appendChild(install); prompt.appendChild(text); prompt.appendChild(actions); d.body.appendChild(prompt);
    return true;
  }

  function scheduleRefresh(delay = 180) {
    if (observerQueued) return;
    observerQueued = true;
    const run = () => { observerQueued = false; render(); };
    const perf = core()?.perf;
    if (typeof perf?.debounce === 'function') perf.debounce('shared-dock-runtime', run, delay); else setTimeout(run, delay);
  }

  function bindRuntimeSignals() {
    if (runtimeSignalsBound) return;
    runtimeSignalsBound = true;
    try {
      core()?.router?.onChange?.(() => { forceCloseDock(); scheduleRefresh(180); });
      core()?.router?.bind?.();
    } catch {}
    try { g.addEventListener?.('SakaLuX:ScriptHubReady', () => removeUi(), { passive: true }); } catch {}
    try {
      const outside = e => {
        const panel = doc()?.getElementById(IDS.dock);
        if (!panel || panel.dataset.open !== '1' || panel.hidden) return;
        const t=e?.target;
        if (t?.closest?.('#'+IDS.dock) || t?.closest?.('#'+IDS.native) || t?.closest?.('#'+IDS.fallback)) return;
        forceCloseDock();
      };
      for (const ev of ['pointerdown','touchstart','mousedown','click']) doc()?.addEventListener?.(ev,outside,true);
    } catch {}
    try { g.addEventListener?.('keydown', e => { if(e?.key==='Escape') forceCloseDock(); }, {passive:true}); } catch {}
    try {
      if (!observer && typeof MutationObserver === 'function' && doc()?.body) {
        observer = new MutationObserver(records => {
          if (core()?.perf?.unrelated?.(records)) return;
          scheduleRefresh(240);
        });
        observer.observe(doc().body, { childList:true, subtree:true });
      }
    } catch {}
  }

  function register(entry) {
    const normalized = normalize(entry);
    modules.set(normalized.id, normalized); // latest registration wins
    render();
    bindRuntimeSignals();
    if (!promptScheduled) {
      promptScheduled = true;
      Promise.resolve().then(() => maybePrompt());
    }
    return normalized;
  }

  function unregister(id) {
    const removed = modules.delete(String(id || ''));
    render();
    return removed;
  }

  function list() { return Object.freeze(sorted().map(item => Object.freeze({ ...item }))); }

  const api = Object.freeze({ version: VERSION, ids: IDS, register, unregister, list, render, toggleDock, removeUi, hubInstalled, maybePrompt });
  g.__SakaLuXDockRuntimeCurrent = api;
  try {
    const desc=Object.getOwnPropertyDescriptor(g,NS);
    if(!desc||desc.configurable){
      Object.defineProperty(g,NS,{configurable:true,enumerable:true,get(){return g.__SakaLuXDockRuntimeCurrent},set(v){if(v?.version&&compareVersion(v.version,g.__SakaLuXDockRuntimeCurrent?.version)>=0)g.__SakaLuXDockRuntimeCurrent=v}});
    } else g[NS]=api;
  } catch { try { g[NS]=api; } catch {} }
})();
