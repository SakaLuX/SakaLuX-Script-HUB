// ==UserScript==
// @name         SakaLuX Elimination Assistant
// @namespace    sakalux.elimination.assistant
// @version      1.3.31
// @description  Torn Eliminations advisor with rotating 500-player batches, persistent SAFE targets, TornPDA export, FF/BS calibration and PC-safe attack links.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @license      All Rights Reserved
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @connect      ffscouter.com
// @require      https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/b734af7de5aa675cad7de42884d925e96864f838/SakaLuX-Elimination-Assistant.user.js
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Elimination-Assistant-v1.3.31.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Elimination-Assistant-v1.3.31.user.js
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '1.3.31';
  const ATTACK_SELECTOR = '#slx-elim a[href*="loader.php?sid=attack"], #slx-elim a.atk';

  function pcSafeAttackUrl(raw) {
    try {
      const u = new URL(raw, location.origin);
      if (u.hostname !== 'www.torn.com' && u.hostname !== 'torn.com') return raw;
      if (!/\/loader\.php$/i.test(u.pathname) || u.searchParams.get('sid') !== 'attack') return raw;
      u.pathname = '/page.php';
      return u.href;
    } catch {
      return raw;
    }
  }

  function rewriteAttackLinks(root = document) {
    const links = [];
    if (root?.matches?.(ATTACK_SELECTOR)) links.push(root);
    if (root?.querySelectorAll) links.push(...root.querySelectorAll(ATTACK_SELECTOR));
    for (const a of links) {
      const oldHref = a.getAttribute('href') || '';
      const next = pcSafeAttackUrl(oldHref);
      if (next !== oldHref) {
        a.setAttribute('href', next);
        a.dataset.slxAttackRoute = 'page';
      }
    }
  }

  function syncDisplayedVersion() {
    const header = document.querySelector('#slx-elim .slx-h b');
    if (header && /SakaLuX Elimination Assistant v/i.test(header.textContent || '')) {
      header.textContent = `SakaLuX Elimination Assistant v${VERSION}`;
    }

    const bridge = document.getElementById('sakalux-module-bridge-elimination-assistant');
    if (bridge) bridge.dataset.version = VERSION;

    for (const marker of document.querySelectorAll('[data-slx-standalone-registration="elimination-assistant"]')) {
      marker.dataset.version = VERSION;
    }

    try {
      if (window.SakaLuXEliminationAssistant && typeof window.SakaLuXEliminationAssistant === 'object') {
        window.SakaLuXEliminationAssistant.version = VERSION;
      }
    } catch {}
  }

  function repair(root = document) {
    rewriteAttackLinks(root);
    syncDisplayedVersion();
  }

  document.addEventListener('click', event => {
    const a = event.target?.closest?.('#slx-elim a[href*="loader.php?sid=attack"]');
    if (!a) return;
    const oldHref = a.getAttribute('href') || '';
    const next = pcSafeAttackUrl(oldHref);
    if (next !== oldHref) a.setAttribute('href', next);
  }, true);

  const start = () => {
    repair();
    let timer = 0;
    const observer = new MutationObserver(records => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        for (const record of records) {
          for (const node of record.addedNodes || []) {
            if (node?.nodeType === 1) rewriteAttackLinks(node);
          }
        }
        syncDisplayedVersion();
      }, 30);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setInterval(repair, 3000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
