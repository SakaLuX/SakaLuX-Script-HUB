// ==UserScript==
// @name         SakaLuX Hub Launcher TEST
// @namespace    sakalux.script.hub.test
// @version      0.1.0
// @description  Isolated launcher diagnostic for TornPDA/Torn. Does not modify the production Hub.
// @author       SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @run-at       document-start
// @license      All Rights Reserved
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/hubtest.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/hubtest.user.js
// ==/UserScript==

(() => {
  'use strict';

  const BTN_ID = 'sakalux-hub-launcher-test';
  const PANEL_ID = 'sakalux-hub-launcher-test-panel';
  const STYLE_ID = 'sakalux-hub-launcher-test-style';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
#${BTN_ID}{
  all:initial!important;
  position:fixed!important;
  right:10px!important;
  bottom:72px!important;
  width:58px!important;
  height:58px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  z-index:2147483647!important;
  box-sizing:border-box!important;
  border:2px solid #ff9f1a!important;
  border-radius:16px!important;
  background:#111923!important;
  color:#ffb347!important;
  font:900 11px/1 Arial,sans-serif!important;
  letter-spacing:.04em!important;
  box-shadow:0 8px 30px rgba(0,0,0,.75)!important;
  transform:none!important;
  filter:none!important;
  overflow:visible!important;
  contain:none!important;
  isolation:isolate!important;
}
#${PANEL_ID}{
  all:initial!important;
  position:fixed!important;
  inset:8px!important;
  z-index:2147483647!important;
  display:none!important;
  box-sizing:border-box!important;
  background:#0b1118!important;
  border:1px solid #40536a!important;
  border-radius:14px!important;
  color:#eef4fb!important;
  font:12px/1.45 Arial,sans-serif!important;
  padding:12px!important;
  overflow:auto!important;
  white-space:pre-wrap!important;
}
#${PANEL_ID}[data-open="1"]{display:block!important}
#${PANEL_ID} button{all:initial!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:8px 12px!important;margin:0 6px 8px 0!important;border:1px solid #526985!important;border-radius:9px!important;background:#172331!important;color:#eef4fb!important;font:800 11px Arial,sans-serif!important}
`;
    (document.documentElement || document).appendChild(st);
  }

  function describe(el) {
    if (!el) return 'missing';
    let cs = null, r = null;
    try { cs = getComputedStyle(el); } catch {}
    try { r = el.getBoundingClientRect(); } catch {}
    return JSON.stringify({
      connected: !!el.isConnected,
      display: cs?.display,
      visibility: cs?.visibility,
      opacity: cs?.opacity,
      position: cs?.position,
      zIndex: cs?.zIndex,
      width: r?.width,
      height: r?.height,
      top: r?.top,
      right: r?.right,
      bottom: r?.bottom,
      left: r?.left,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      visualViewport: window.visualViewport ? {
        width: window.visualViewport.width,
        height: window.visualViewport.height,
        offsetTop: window.visualViewport.offsetTop,
        offsetLeft: window.visualViewport.offsetLeft
      } : null
    }, null, 2);
  }

  function refreshPanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel || panel.dataset.open !== '1') return;
    const test = document.getElementById(BTN_ID);
    const prodCandidates = [
      document.getElementById('sakalux-hub-button'),
      document.getElementById('sakalux-hub-top-skull'),
      document.getElementById('sakalux-hub-nav-skull')
    ];
    const lines = [
      'SakaLuX HUB LAUNCHER TEST v0.1.0',
      '',
      'TEST BUTTON:', describe(test),
      '',
      'PRODUCTION CANDIDATES:',
      ...prodCandidates.map((el, i) => `#${i + 1}: ${el?.id || 'missing'}\n${describe(el)}`),
      '',
      `URL: ${location.href}`,
      `UA: ${navigator.userAgent}`
    ];
    const pre = panel.querySelector('[data-log]');
    if (pre) pre.textContent = lines.join('\n');
  }

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = '<button type="button" data-close>CLOSE</button><button type="button" data-refresh>REFRESH</button><div data-log></div>';
    panel.querySelector('[data-close]').onclick = () => panel.dataset.open = '0';
    panel.querySelector('[data-refresh]').onclick = refreshPanel;
    (document.documentElement || document.body).appendChild(panel);
    return panel;
  }

  function ensureButton() {
    addStyle();
    let btn = document.getElementById(BTN_ID);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = BTN_ID;
      btn.type = 'button';
      btn.textContent = 'HUB\nTEST';
      btn.title = 'SakaLuX Hub launcher diagnostic';
      btn.onclick = () => {
        const panel = ensurePanel();
        panel.dataset.open = '1';
        refreshPanel();
      };
      (document.documentElement || document.body).appendChild(btn);
    }
    btn.style.setProperty('display', 'flex', 'important');
    btn.style.setProperty('visibility', 'visible', 'important');
    btn.style.setProperty('opacity', '1', 'important');
    btn.style.setProperty('pointer-events', 'auto', 'important');
    btn.style.setProperty('z-index', '2147483647', 'important');
    return btn;
  }

  function boot() {
    ensureButton();
    let ticks = 0;
    const timer = setInterval(() => {
      ensureButton();
      refreshPanel();
      ticks += 1;
      if (ticks > 1800) clearInterval(timer);
    }, 1000);
    addEventListener('resize', () => { ensureButton(); refreshPanel(); }, {passive:true});
    window.visualViewport?.addEventListener?.('resize', () => { ensureButton(); refreshPanel(); }, {passive:true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
    addStyle();
    ensureButton();
  } else {
    boot();
  }
})();
