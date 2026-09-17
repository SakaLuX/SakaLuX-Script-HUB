// ==UserScript==
// @name         hubtest
// @namespace    sakalux.hub.fullscreen.test
// @version      0.0.1
// @description  Temporary GitHub test override for SakaLuX Script Hub v1.9.55 fullscreen behavior.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/hubtest.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/hubtest.user.js
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  const STYLE_ID = 'sakalux-hub-fullscreen-local-test';
  const ROOT_VAR = '--slh-real-vh';

  function realHeight() {
    const vv = window.visualViewport;
    const h = vv && Number.isFinite(vv.height) ? vv.height : window.innerHeight;
    return Math.max(320, Math.round(h));
  }

  function applyViewportHeight() {
    document.documentElement.style.setProperty(ROOT_VAR, `${realHeight()}px`);
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
@media (max-width: 820px) {
  #sakalux-hub-overlay {
    position: fixed !important;
    inset: 0 auto auto 0 !important;
    top: 0 !important;
    left: 0 !important;
    right: auto !important;
    bottom: auto !important;
    width: 100vw !important;
    height: var(${ROOT_VAR}) !important;
    min-height: var(${ROOT_VAR}) !important;
    max-height: var(${ROOT_VAR}) !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    display: flex !important;
    align-items: stretch !important;
    justify-content: stretch !important;
    background: #0b1118 !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    box-shadow: none !important;
    transform: none !important;
  }

  #sakalux-hub-panel {
    position: relative !important;
    inset: auto !important;
    flex: 1 1 auto !important;
    align-self: stretch !important;
    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    border: 0 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    background: #0b1118 !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    transform: none !important;
  }

  #sakalux-hub-panel > .slh-header {
    flex: 0 0 auto !important;
    min-height: 0 !important;
    position: relative !important;
    z-index: 2 !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  #sakalux-hub-panel > .slh-list {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    overscroll-behavior: contain !important;
    touch-action: pan-y !important;
    -webkit-overflow-scrolling: touch !important;
    contain: layout paint !important;
    padding-bottom: 8px !important;
  }

  #sakalux-hub-panel > .slh-view,
  #sakalux-hub-panel > .slh-settings {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    overscroll-behavior: contain !important;
    touch-action: pan-y !important;
    -webkit-overflow-scrolling: touch !important;
  }

  #sakalux-hub-panel > .slh-bottom {
    position: relative !important;
    inset: auto !important;
    flex: 0 0 64px !important;
    height: 64px !important;
    min-height: 64px !important;
    margin: 0 !important;
    padding: 7px 16px !important;
    box-sizing: border-box !important;
    background: #0b1118 !important;
    border-top: 1px solid rgba(255,255,255,.08) !important;
    z-index: 3 !important;
  }

  #sakalux-hub-panel > .slh-bottom .slh-bottom-grid {
    height: 50px !important;
  }

  #sakalux-hub-panel > .slh-bottom .slh-bottom-btn {
    height: 50px !important;
    min-height: 50px !important;
    box-shadow: none !important;
  }

  #sakalux-hub-panel > .slh-footer {
    position: relative !important;
    inset: auto !important;
    flex: 0 0 38px !important;
    height: 38px !important;
    min-height: 38px !important;
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    background: #080d13 !important;
    border-top: 1px solid rgba(223,154,55,.52) !important;
    z-index: 3 !important;
  }

  #sakalux-hub-overlay *,
  #sakalux-hub-panel * {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  #sakalux-hub-panel *,
  #sakalux-hub-overlay * {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
}
`;
    (document.head || document.documentElement).appendChild(s);
  }

  applyViewportHeight();
  installStyle();

  const vv = window.visualViewport;
  vv?.addEventListener('resize', applyViewportHeight, {passive:true});
  vv?.addEventListener('scroll', applyViewportHeight, {passive:true});
  window.addEventListener('resize', applyViewportHeight, {passive:true});
  window.addEventListener('orientationchange', () => setTimeout(applyViewportHeight, 80), {passive:true});

  // Re-apply only when Hub appears; lightweight, no document-wide rerender work.
  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (!(n instanceof Element)) continue;
        if (n.id === 'sakalux-hub-overlay' || n.querySelector?.('#sakalux-hub-overlay')) {
          applyViewportHeight();
          installStyle();
          return;
        }
      }
    }
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
})();
