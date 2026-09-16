// ==UserScript==
// @name         SakaLuX Hub Card UX
// @namespace    sakalux.script.hub.card.ux
// @version      1.0.0
// @description  Adds per-module INFO/NEW controls, compact Hub cards and stable SakaLuX footers to managed add-ons.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @run-at       document-end
// @license      All Rights Reserved
// ==/UserScript==

(() => {
  'use strict';

  const REGISTRY_URL = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/scripts.json';
  const PROFILE_URL = 'https://www.torn.com/profiles.php?XID=2380374';
  const STYLE_ID = 'sakalux-hub-card-ux-style';
  const MODAL_ID = 'sakalux-hub-card-ux-modal';
  const FOOTER_CLASS = 'sakalux-stable-module-footer';

  let registry = [];
  let queued = false;

  const panelSelectors = [
    '#sl-eg-panel',
    '#sakalux-bt-settings',
    '#sl-mr-settings',
    '#sl-mi-panel',
    '#slx-elim',
    '[id^="slx-elim-"][id*="panel" i]',
    '[id^="ci-"][id*="panel" i]',
    '[class^="ci-"][class*="panel" i]',
    '[class*=" ci-"][class*="panel" i]'
  ];

  function httpGet(url) {
    return new Promise((resolve, reject) => {
      if (typeof window.PDA_httpGet === 'function') {
        window.PDA_httpGet(url, { Accept: 'application/json,text/plain' })
          .then(r => resolve(r?.responseText ?? r?.body ?? r?.data ?? r ?? ''))
          .catch(reject);
        return;
      }
      if (window.flutter_inappwebview?.callHandler) {
        window.flutter_inappwebview.callHandler('PDA_httpGet', url, { Accept: 'application/json,text/plain' })
          .then(r => resolve(r?.responseText ?? r?.body ?? r?.data ?? r ?? ''))
          .catch(reject);
        return;
      }
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET', url, timeout: 15000,
          headers: { Accept: 'application/json,text/plain' },
          onload: r => r.status >= 200 && r.status < 400 ? resolve(r.responseText || '') : reject(new Error('HTTP ' + r.status)),
          onerror: () => reject(new Error('Network error')),
          ontimeout: () => reject(new Error('Request timeout'))
        });
        return;
      }
      fetch(url, { cache: 'no-store' }).then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).then(resolve).catch(reject);
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .slh-card.slh-ux-compact .slh-description{display:none!important}
      .slh-card.slh-ux-compact .slh-module-controls{display:flex!important;flex-direction:column!important;gap:7px!important;align-items:stretch!important;min-width:136px!important}
      .slh-card.slh-ux-compact .slh-ux-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%}
      .slh-card.slh-ux-compact .slh-ux-mini{min-height:31px!important;padding:6px 8px!important;border-radius:9px!important;border:1px solid #3b4d63!important;background:linear-gradient(180deg,#182536,#111a25)!important;color:#dbe8f7!important;font:800 9px/1 Arial,sans-serif!important;letter-spacing:.6px!important;box-shadow:inset 0 1px rgba(255,255,255,.04)!important}
      .slh-card.slh-ux-compact .slh-ux-mini.info{border-color:#3c6da7!important;background:linear-gradient(180deg,#173353,#10243a)!important}
      .slh-card.slh-ux-compact .slh-ux-mini.new{border-color:#6a4c83!important;background:linear-gradient(180deg,#33213f,#23172d)!important;color:#ecdfff!important}
      .slh-card.slh-ux-compact .slh-switch,.slh-card.slh-ux-compact .slh-primary{width:100%!important;box-sizing:border-box!important}
      #${MODAL_ID}{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:Inter,Arial,sans-serif}
      #${MODAL_ID} .slx-ux-box{width:min(520px,96vw);max-height:80vh;overflow:auto;border:1px solid #3a4d63;border-radius:16px;background:linear-gradient(180deg,#121c28,#0c131b);color:#edf3fa;box-shadow:0 22px 70px rgba(0,0,0,.68)}
      #${MODAL_ID} .slx-ux-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 15px;border-bottom:1px solid rgba(255,255,255,.08);background:radial-gradient(circle at 10% -30%,rgba(79,143,232,.2),transparent 48%)}
      #${MODAL_ID} .slx-ux-kicker{font:800 9px/1 Arial,sans-serif;letter-spacing:1.4px;color:#76a9e8;margin-bottom:5px}
      #${MODAL_ID} .slx-ux-title{font:900 18px/1.15 Arial,sans-serif}
      #${MODAL_ID} .slx-ux-close{width:38px;height:38px;border:1px solid #3b4d63;border-radius:10px;background:#172331;color:#fff;font-size:22px;font-weight:800}
      #${MODAL_ID} .slx-ux-body{padding:15px;font-size:12px;line-height:1.55;color:#cbd7e5}
      #${MODAL_ID} .slx-ux-chip{display:inline-block;margin:0 6px 8px 0;padding:5px 8px;border:1px solid #38516e;border-radius:999px;background:#122236;color:#9cc7f4;font:800 9px/1 Arial,sans-serif}
      #${MODAL_ID} .slx-ux-note{margin-top:10px;padding:11px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:#111a24}
      #${MODAL_ID} .slx-ux-note div{margin:5px 0}
      .${FOOTER_CLASS}{flex:0 0 auto!important;position:sticky!important;bottom:0!important;z-index:25!important;width:100%!important;box-sizing:border-box!important;text-align:center!important;padding:9px 10px!important;border-top:1px solid rgba(255,255,255,.08)!important;background:#0c131b!important;color:#74869a!important;font:500 10px/1.3 Arial,sans-serif!important}
      .${FOOTER_CLASS} a{color:#5f9fe8!important;text-decoration:none!important}
      @media(max-width:700px){.slh-card.slh-ux-compact .slh-module-controls{min-width:124px!important}.slh-card.slh-ux-compact .slh-ux-mini{min-height:34px!important}}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function findScriptForCard(card) {
    const name = card.querySelector('.slh-name')?.textContent?.trim();
    if (!name) return null;
    return registry.find(s => s.name === name) || null;
  }

  function shouldKeepChip(text) {
    const t = String(text || '').trim();
    if (!t) return false;
    return /^v\d/i.test(t)
      || /^(UP TO DATE|UPDATE AVAILABLE|PUBLISH PENDING|CHECK FAILED|CHECKING)$/i.test(t)
      || /^(ACTIVE|DISABLED|NOT INSTALLED)$/i.test(t)
      || /^(NOW|\d+[mhd]\s+ago)$/i.test(t);
  }

  function openModal(script, mode) {
    document.getElementById(MODAL_ID)?.remove();
    const release = script?.release || {};
    const isInfo = mode === 'info';
    const title = isInfo ? `${script.icon || '🧩'} ${script.name}` : `✦ ${script.name} — What's New`;
    const kicker = isInfo ? 'MODULE INFORMATION' : 'RELEASE CENTER';
    const body = isInfo
      ? `<span class="slx-ux-chip">v${escapeHtml(script.version || '?')}</span><span class="slx-ux-chip">${escapeHtml(script.category || 'Other')}</span><div class="slx-ux-note">${escapeHtml(script.info || script.description || 'No module information available.')}</div>`
      : `<span class="slx-ux-chip">v${escapeHtml(release.version || script.version || '?')}</span>${release.date ? `<span class="slx-ux-chip">${escapeHtml(release.date)}</span>` : ''}<div class="slx-ux-note">${Array.isArray(release.notes) && release.notes.length ? release.notes.map(note => `<div>• ${escapeHtml(note)}</div>`).join('') : '<div>No release notes available yet.</div>'}</div>`;
    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.innerHTML = `<div class="slx-ux-box"><div class="slx-ux-head"><div><div class="slx-ux-kicker">${kicker}</div><div class="slx-ux-title">${escapeHtml(title)}</div></div><button class="slx-ux-close" type="button" aria-label="Close">×</button></div><div class="slx-ux-body">${body}</div></div>`;
    modal.addEventListener('click', event => { if (event.target === modal) modal.remove(); });
    modal.querySelector('.slx-ux-close').onclick = () => modal.remove();
    document.body.appendChild(modal);
  }

  function compactCard(card) {
    if (!(card instanceof HTMLElement)) return;
    const script = findScriptForCard(card);
    if (!script) return;
    card.classList.add('slh-ux-compact');
    card.querySelector('.slh-description')?.remove();

    card.querySelectorAll('.slh-chip').forEach(chip => {
      if (!shouldKeepChip(chip.textContent)) chip.remove();
    });

    const controls = card.querySelector('.slh-module-controls');
    if (!controls) return;
    let actions = controls.querySelector('.slh-ux-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'slh-ux-actions';
      actions.innerHTML = '<button class="slh-ux-mini info" type="button">INFO</button><button class="slh-ux-mini new" type="button">✦ NEW</button>';
      controls.insertBefore(actions, controls.firstChild);
      actions.querySelector('.info').onclick = event => { event.preventDefault(); event.stopPropagation(); openModal(script, 'info'); };
      actions.querySelector('.new').onclick = event => { event.preventDefault(); event.stopPropagation(); openModal(script, 'new'); };
    }
  }

  function ensureFooter(panel) {
    if (!(panel instanceof HTMLElement)) return;
    const existing = panel.querySelector('[id^="sakalux-inline-footer-"], .' + FOOTER_CLASS);
    if (existing) {
      existing.classList.add(FOOTER_CLASS);
      return;
    }
    const footer = document.createElement('div');
    footer.className = FOOTER_CLASS;
    footer.innerHTML = `Made with ❤️ by <a href="${PROFILE_URL}" target="_self" rel="noopener">SakaLuX [2380374]</a>`;
    footer.querySelector('a').onclick = event => { event.preventDefault(); location.href = PROFILE_URL; };
    panel.appendChild(footer);
  }

  function stabilizeFooters() {
    const seen = new Set();
    for (const selector of panelSelectors) {
      document.querySelectorAll(selector).forEach(panel => {
        if (seen.has(panel)) return;
        seen.add(panel);
        ensureFooter(panel);
      });
    }
  }

  function apply() {
    queued = false;
    document.querySelectorAll('.slh-card').forEach(compactCard);
    stabilizeFooters();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  async function loadRegistry() {
    try {
      const raw = await httpGet(REGISTRY_URL + '?ux=' + Date.now());
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(data?.scripts)) registry = data.scripts.filter(s => s?.active !== false);
    } catch (error) {
      console.warn('[SakaLuX Hub Card UX] Registry unavailable:', error?.message || error);
    }
  }

  injectStyle();
  loadRegistry().finally(schedule);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('SakaLuX:LanguageChanged', schedule);
  setInterval(schedule, 4000);
})();
