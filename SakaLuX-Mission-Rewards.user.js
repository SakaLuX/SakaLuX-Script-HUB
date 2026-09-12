// ==UserScript==
// @name         SakaLuX Mission Rewards
// @namespace    sakalux.mission.rewards
// @version      1.0.21
// @description  Stable Mission Rewards with TornPDA-safe isolated Duke mission task and hint guidance for Torn PDA / Tampermonkey.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @license      All Rights Reserved
// @run-at       document-end
// @downloadURL https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Mission-Rewards.user.js
// @updateURL https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Mission-Rewards.user.js
// ==/UserScript==

/* SakaLuX Standalone Dock Bootstrap — BEGIN */
(() => {
  'use strict';
  const SELF=Object.assign({"id":"mission-rewards","name":"Missions","icon":"🎯","selector":"","fallback":"https://www.torn.com/page.php?sid=missions"},{version:'1.0.21'});
  const HUB_URL='https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY='SakaLuX_HUB_INSTALL_PROMPT_LAST', INTERVAL=12*60*60*1000;
  const DOCK_ID='sakalux-standalone-dock', PROMPT_ID='sakalux-hub-install-prompt', STYLE_ID='sakalux-standalone-dock-style';
  const NATIVE_ID='sakalux-standalone-native-s', FALLBACK_ID='sakalux-standalone-fallback-s';
  const REG_ATTR='data-slx-standalone-registration', OPEN_KEY='SakaLuX_STANDALONE_DOCK_OPEN';
  const ORDER=['enhancer','bazaar','mission-rewards','market-intelligence','elimination-assistant'];
  const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.getElementById('sakalux-hub-top-skull')||document.getElementById('sakalux-hub-nav-skull')||document.getElementById('sakalux-hub-panel')||document.getElementById('sakalux-hub-style')||document.querySelector('[data-sakalux-hub-installed="1"]')||document.querySelector('[data-sakalux-hub-active="1"]'));

  function registerSelf(){
    let m=document.querySelector(`[${REG_ATTR}="${SELF.id}"]`);
    if(!m){m=document.createElement('span');m.setAttribute(REG_ATTR,SELF.id);m.hidden=true;(document.body||document.documentElement).appendChild(m);}
    Object.assign(m.dataset,SELF);
  }

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
#${DOCK_ID}{position:fixed;right:10px;bottom:74px;z-index:2147483000;width:min(198px,calc(100vw - 20px));max-height:min(58vh,390px);overflow:hidden;padding:9px;background:linear-gradient(180deg,rgba(10,14,20,.988),rgba(7,10,15,.988));border:1px solid rgba(255,255,255,.07);border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.03);backdrop-filter:blur(12px);font-family:Inter,Arial,sans-serif;display:none}
#${DOCK_ID}[data-open="1"]{display:block}
#${DOCK_ID} .slx-dock-head{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;padding:4px 6px 10px;margin-bottom:7px;border-bottom:1px solid rgba(255,255,255,.055)}
#${DOCK_ID} .slx-dock-mark{width:30px;height:30px;display:grid;place-items:center;padding:0;margin:0;border-radius:10px;background:linear-gradient(180deg,#293545,#1a2430);border:1px solid rgba(223,189,97,.38);color:#dfbd61;font:900 16px/30px Arial,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.2);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}#${DOCK_ID} .slx-dock-mark:active{transform:scale(.92);background:linear-gradient(180deg,#344256,#202b39)}
#${DOCK_ID} .slx-dock-title{color:#f4f7fb;font-size:11px;font-weight:900;line-height:1.15;letter-spacing:.01em;text-align:center}
#${DOCK_ID} .slx-dock-sub{color:#8693a3;font-size:8px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;text-align:center}
#${DOCK_ID} .slx-dock-items{display:flex;flex-direction:column;gap:6px;max-height:calc(min(58vh,390px) - 116px);overflow:auto;padding-top:2px}
#${DOCK_ID} .slx-dock-row{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:42px!important;margin:0!important;padding:0 12px!important;box-sizing:border-box!important;inset:auto!important;border:1px solid rgba(255,255,255,.075)!important;border-radius:14px!important;background:linear-gradient(180deg,rgba(17,25,35,.96),rgba(12,18,26,.96))!important;color:#f2f5f9!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.02),0 4px 10px rgba(0,0,0,.14)!important;overflow:hidden!important;transform:none!important}
#${DOCK_ID} .slx-dock-row:active{transform:scale(.985)!important;background:linear-gradient(180deg,#1b2531,#141c26)!important}
#${DOCK_ID} .slx-left{width:22px;height:22px;min-width:22px;display:grid;place-items:center;border-radius:7px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#202b38,#151d27);box-shadow:inset 0 1px 0 rgba(255,255,255,.03);z-index:1}
#${DOCK_ID} .slx-left .i{font-size:13px;line-height:1}
#${DOCK_ID} .slx-title{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:112px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;font:800 10px/1 Arial,sans-serif;letter-spacing:.01em;pointer-events:none}
#${DOCK_ID} .slx-right-pad{margin-left:auto;width:22px;min-width:22px;height:22px;opacity:0;pointer-events:none}
#${DOCK_ID} .slx-dock-install{display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:8px!important;padding:8px 10px!important;border-radius:13px!important;background:linear-gradient(180deg,#80601d,#624813)!important;border:1px solid rgba(223,189,97,.54)!important;color:#fff3cb!important;text-align:center!important;text-decoration:none!important;font:800 10px Arial,sans-serif!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.16)!important}
#${DOCK_ID} .slx-dock-install:active{transform:scale(.985)}
#${NATIVE_ID}{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border:0!important;list-style:none!important;background:none!important;box-shadow:none!important}#${NATIVE_ID}::before,#${NATIVE_ID}::after{content:none!important;display:none!important}#${NATIVE_ID} .slx-s-link{display:grid!important;place-items:center!important;width:17px!important;height:17px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;text-decoration:none!important;color:#dfbd61!important;font:900 15px/17px Arial,sans-serif!important;text-shadow:0 1px 1px rgba(0,0,0,.72),0 0 4px rgba(223,189,97,.18)!important}#${NATIVE_ID} .slx-s-link:active{transform:scale(.9)!important}
#${FALLBACK_ID}{position:fixed;right:10px;bottom:78px;z-index:2147483001;width:32px;height:32px;padding:0;border:1px solid #64748b;border-radius:9px;background:linear-gradient(145deg,#202b39,#111923);color:#dfbd61;box-shadow:0 8px 22px rgba(0,0,0,.42);font:900 15px Arial;display:none;align-items:center;justify-content:center}
body:not([data-sakalux-hub-active="1"]) :is(#sl-eg-button,#sakalux-bt-settings-button,#sl-mri-button,#sl-mi-button,#slx-elim-btn){display:none!important}
`;
    (document.head||document.documentElement).appendChild(s);
  }

  function findStatusIconList(){
    const selectors=['ul[class*="statusIcons"][class*="big"]','ul[class*="status-icons"][class*="big"]','ul[class*="statusIcons"]','ul[class*="status-icons"]'];
    const lists=selectors.flatMap(q=>[...document.querySelectorAll(q)]);
    return lists.find(list=>list.isConnected&&[...list.children].some(item=>item.querySelector?.('a')))||null;
  }
  function copyNativeCell(item,list){
    const ref=[...list.children].find(x=>x!==item&&x.querySelector?.('a')); if(!ref) return;
    const native=[...ref.classList].filter(x=>x&&!x.startsWith('slx-')&&!x.startsWith('sakalux-'));
    item.className=[...native,'slx-standalone-native'].join(' ');
  }
  function toggleDock(force){
    const d=ensureDock(); if(!d) return;
    const next=typeof force==='boolean'?force:d.dataset.open!=='1';
    d.dataset.open=next?'1':'0';
    try{localStorage.setItem(OPEN_KEY,next?'1':'0')}catch{}
  }
  function ensureNativeLauncher(){
    if(hubInstalled()){document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return false;}
    const list=findStatusIconList(); let item=document.getElementById(NATIVE_ID);
    if(list){
      if(!item){item=document.createElement('li');item.id=NATIVE_ID;item.innerHTML='<a href="#" class="slx-s-link" aria-label="SakaLuX Scripts" title="SakaLuX Scripts">S</a>';item.querySelector('a').onclick=e=>{e.preventDefault();e.stopPropagation();toggleDock();};}
      copyNativeCell(item,list);
      const children=[...list.children].filter(x=>x!==item);
      const cashIndex=children.findIndex(x=>/\$|cash|money/i.test((x.textContent||'')+' '+(x.className||'')));
      const anchor=cashIndex>=0?children[cashIndex]:children[0];
      if(anchor) anchor.insertAdjacentElement('afterend',item); else list.appendChild(item);
      document.getElementById(FALLBACK_ID)?.remove(); return true;
    }
    item?.remove();
    let fb=document.getElementById(FALLBACK_ID);
    if(!fb){fb=document.createElement('button');fb.id=FALLBACK_ID;fb.type='button';fb.textContent='S';fb.title='SakaLuX Scripts';fb.onclick=()=>toggleDock();(document.body||document.documentElement).appendChild(fb);}
    fb.style.display='flex'; return false;
  }
  function ensureDock(){
    if(hubInstalled()){document.body?.setAttribute('data-sakalux-hub-active','1');document.getElementById(DOCK_ID)?.remove();document.getElementById(PROMPT_ID)?.remove();document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return null;}
    document.body?.removeAttribute('data-sakalux-hub-active'); addStyle();
    let d=document.getElementById(DOCK_ID); if(d) return d;
    d=document.createElement('div'); d.id=DOCK_ID; d.dataset.open=localStorage.getItem(OPEN_KEY)==='1'?'1':'0';
    d.innerHTML=`<div class="slx-dock-head"><button type="button" class="slx-dock-mark" aria-label="Close SakaLuX Scripts" title="Close SakaLuX Scripts">S</button><div class="slx-dock-title">SakaLuX Scripts</div><div class="slx-dock-sub">Standalone</div></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${HUB_URL}">Install SakaLuX Hub</a>`;
    (document.body||document.documentElement).appendChild(d); const close=d.querySelector('.slx-dock-mark'); if(close) close.onclick=e=>{e.preventDefault();e.stopPropagation();toggleDock(false);}; return d;
  }
  function openEntry(data){const el=data.selector?document.querySelector(data.selector):null;if(el){el.click();return;}const bridge=document.getElementById('sakalux-module-bridge-'+data.id);if(bridge){bridge.dataset.action='open';bridge.click();return;}if(data.fallback)location.href=data.fallback;}
  function render(){
    const d=ensureDock(); if(!d) return;
    const box=d.querySelector('.slx-dock-items');
    const regs=[...document.querySelectorAll(`[${REG_ATTR}]`)].map(x=>x.dataset).filter(x=>x.id);
    regs.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id)); box.replaceChildren();
    for(const r of regs){
      const b=document.createElement('button'); b.type='button'; b.className='slx-dock-row';
      b.innerHTML=`<span class="slx-left"><span class="i">${r.icon||'•'}</span></span><span class="slx-title">${r.name||r.id}</span><span class="slx-right-pad"></span>`;
      b.onclick=()=>openEntry(r); box.appendChild(b);
    }
    ensureNativeLauncher();
  }
  function maybePrompt(){
    if(hubInstalled()||document.getElementById(PROMPT_ID)) return;
    let last=0; try{last=Number(localStorage.getItem(LAST_KEY)||0)}catch{}
    if(last&&Date.now()-last<INTERVAL) return;
    try{localStorage.setItem(LAST_KEY,String(Date.now()))}catch{}
    const p=document.createElement('div'); p.id=PROMPT_ID; p.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';
    p.innerHTML=`<div style="width:min(350px,100%);background:#111820;color:#fff;border:1px solid #394657;border-radius:14px;padding:16px;font:13px Arial,sans-serif;box-shadow:0 16px 48px #0008"><b style="display:block;text-align:center;font-size:16px">Install SakaLuX Script Hub?</b><div style="margin-top:7px;color:#cbd5e1;line-height:1.4;text-align:center">Manage every SakaLuX add-on from one place with shared settings and controls.</div><div style="display:flex;gap:7px;margin-top:12px"><button type="button" data-later style="flex:1;padding:9px;border-radius:8px;background:#202a36;color:#fff;border:1px solid #526174">Later</button><button type="button" data-install style="flex:1;padding:9px;border-radius:8px;background:#6a4d12;color:#fff4cf;border:1px solid #cda84e;font-weight:900">Install Hub</button></div></div>`;
    (document.body||document.documentElement).appendChild(p);
    p.querySelector('[data-later]').onclick=()=>p.remove();
    p.querySelector('[data-install]').onclick=()=>location.href=HUB_URL;
  }
  function start(){registerSelf();render();setTimeout(maybePrompt,1200);let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{registerSelf();render();},80);}).observe(document.documentElement,{childList:true,subtree:true});setInterval(()=>{registerSelf();render();maybePrompt();},60000);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
(() => {
  const id='sakalux-standalone-layer-style';
  if(!document.getElementById(id)){
    const style=document.createElement('style');
    style.id=id;
    style.textContent=`/* Keep managed add-on panels above the shared standalone dock. */
:where(
  [id^="sl-eg-"][id*="panel" i],
  [id^="sakalux-bt-"][id*="settings" i],
  [id^="sl-mr-"][id*="panel" i],
  [id^="sl-mri-"][id*="panel" i],
  [id^="sl-mi-"][id*="panel" i],
  #slx-elim,
  [id^="slx-elim-"][id*="panel" i]
){z-index:2147483646!important;}
#sakalux-standalone-dock{z-index:2147483500!important;}`;
    (document.head||document.documentElement).appendChild(style);
  }
})();

/* SakaLuX Standalone Dock Bootstrap — END */



/*
 * Copyright © 2026 SakaLuX [2380374]
 * All Rights Reserved.
 *
 * Personal use and private modification are permitted.
 * Redistribution, republication, rebranding, or publication of
 * modified versions requires prior written permission from
 * SakaLuX [2380374].
 *
 * Original author attribution must be retained in all authorized
 * derivative works.
 */

(function () {
    'use strict';

    const VERSION = '1.0.21';
    const PDA_KEY = '###PDA-APIKEY###';
    const MISSIONS_URL = 'https://www.torn.com/page.php?sid=missions';
    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 12 * 60 * 60 * 1000;
    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';
    const REQUIRED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Mission%20Rewards&user=ammo&torn=items';

    const STORAGE = {
        apiKey: 'SakaLuX_MR_API_KEY',
        settings: 'SakaLuX_MR_SETTINGS_V1',
        catalogue: 'SakaLuX_MR_CATALOGUE_V1',
        catalogueTime: 'SakaLuX_MR_CATALOGUE_TIME_V1',
        ammo: 'SakaLuX_MR_AMMO_V1',
        ammoTime: 'SakaLuX_MR_AMMO_TIME_V1',
        modRanges: 'SakaLuX_MR_MOD_RANGES_V1',
        enabled: 'SakaLuX_MR_ENABLED'
    };

    const CATALOGUE_CACHE = 6 * 60 * 60 * 1000;
    const AMMO_CACHE = 5 * 60 * 1000;
    const DEFAULT_SETTINGS = {
        showItemValue: true,
        showAmmoOwned: true,
        learnModPrices: true,
        showCardBadges: true
    };

    let settings = { ...DEFAULT_SETTINGS, ...loadJson(STORAGE.settings, DEFAULT_SETTINGS) };

    const state = {
        catalogue: new Map(),
        ammo: [],
        loadingCatalogue: false,
        loadingAmmo: false,
        apiMode: '',
        lastScan: 0,
        observer: null,
        scanTimer: null,
        processedCards: new WeakSet(),
        enabled: loadJson(STORAGE.enabled, true) !== false
    };

    function isMissionsPage() {
        return location.href.includes('sid=missions');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalize(value) {
        return String(value ?? '').trim().toLowerCase().replace(/[’]/g, "'");
    }

    function formatNumber(value, decimals = 0) {
        const n = Number(value);
        if (!Number.isFinite(n)) return '0';
        return n.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function formatMoney(value) {
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) return '?';
        return '$' + Math.round(n).toLocaleString('en-US');
    }

    function loadJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function saveJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }

    function getApiKey() {
        try {
            const hubKey = window.SakaLuXScriptHub?.getApiKey?.() || '';
            if (hubKey) {
                state.apiMode = 'SakaLuX Hub';
                return hubKey;
            }
            if (window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button')) {
                const storedHubKey = localStorage.getItem('SakaLuX_HUB_TORN_API_KEY') || '';
                if (storedHubKey) { state.apiMode = 'SakaLuX Hub'; return storedHubKey; }
            }
        } catch {}
        if (PDA_KEY && PDA_KEY !== '###PDA-APIKEY###') {
            state.apiMode = 'Torn PDA';
            return PDA_KEY;
        }
        try {
            const key = localStorage.getItem(STORAGE.apiKey) || '';
            if (key) state.apiMode = 'Manual';
            return key;
        } catch {
            return '';
        }
    }

    function saveApiKey(key) {
        try {
            localStorage.setItem(STORAGE.apiKey, key);
            state.apiMode = 'Manual';
        } catch {}
    }

    function createRequiredApiKey() {
        if (window.SakaLuXScriptHub?.createRequiredTornKey) return window.SakaLuXScriptHub.createRequiredTornKey();
        location.href = REQUIRED_API_KEY_URL;
        return true;
    }

    function parseApiResponse(response) {
        if (response == null) throw new Error('Empty API response.');
        if (typeof response === 'object' && !('responseText' in response)) return response;
        const raw = response.responseText ?? response.body ?? response.data ?? response;
        if (typeof raw === 'object') return raw;
        return JSON.parse(String(raw));
    }

    function apiGet(url) {
        return new Promise((resolve, reject) => {
            if (typeof window.PDA_httpGet === 'function') {
                state.apiMode = 'Torn PDA';
                window.PDA_httpGet(url, { Accept: 'application/json' })
                    .then(r => { try { resolve(parseApiResponse(r)); } catch (e) { reject(e); } })
                    .catch(reject);
                return;
            }
            if (window.flutter_inappwebview?.callHandler) {
                state.apiMode = 'Torn PDA';
                window.flutter_inappwebview.callHandler('PDA_httpGet', url, { Accept: 'application/json' })
                    .then(r => { try { resolve(parseApiResponse(r)); } catch (e) { reject(e); } })
                    .catch(reject);
                return;
            }
            if (typeof GM_xmlhttpRequest === 'function') {
                state.apiMode = 'Tampermonkey';
                GM_xmlhttpRequest({
                    method: 'GET', url,
                    headers: { Accept: 'application/json' }, timeout: 15000,
                    onload: r => { try { resolve(parseApiResponse(r)); } catch (e) { reject(e); } },
                    onerror: () => reject(new Error('Network error.')),
                    ontimeout: () => reject(new Error('Request timed out.'))
                });
                return;
            }
            fetch(url)
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(resolve).catch(reject);
        });
    }

    function checkApiError(data) {
        if (data?.error) throw new Error(data.error.error || data.error.message || 'Torn API error');
    }

    function normalizeCatalogue(data) {
        const map = new Map();
        if (!Array.isArray(data?.items)) return map;
        for (const item of data.items) {
            if (!item?.name) continue;
            const marketPrice = Number(item.value?.market_price ?? item.market_price ?? item.market_value ?? 0);
            const normalized = {
                id: item.id ? String(item.id) : null,
                name: String(item.name),
                marketPrice: Number.isFinite(marketPrice) && marketPrice > 0 ? marketPrice : null
            };
            map.set(normalize(item.name), normalized);
            if (item.id) map.set('id:' + String(item.id), normalized);
        }
        return map;
    }

    function loadCatalogueCache() {
        const timestamp = Number(localStorage.getItem(STORAGE.catalogueTime) || 0);
        if (!timestamp || Date.now() - timestamp > CATALOGUE_CACHE) return false;
        const rows = loadJson(STORAGE.catalogue, []);
        if (!Array.isArray(rows)) return false;
        const map = new Map();
        for (const item of rows) {
            if (!item?.name) continue;
            map.set(normalize(item.name), item);
            if (item.id) map.set('id:' + item.id, item);
        }
        if (!map.size) return false;
        state.catalogue = map;
        return true;
    }

    function saveCatalogueCache() {
        const unique = new Map();
        for (const item of state.catalogue.values()) {
            if (item?.name) unique.set(normalize(item.name), item);
        }
        saveJson(STORAGE.catalogue, [...unique.values()]);
        localStorage.setItem(STORAGE.catalogueTime, String(Date.now()));
    }

    async function loadCatalogue(force = false) {
        if (state.loadingCatalogue) return;
        if (!force && state.catalogue.size) return;
        if (!force && loadCatalogueCache()) return;
        const key = getApiKey();
        if (!key) return;
        state.loadingCatalogue = true;
        try {
            const data = await apiGet('https://api.torn.com/v2/torn/items?cat=All&sort=ASC&key=' + encodeURIComponent(key));
            checkApiError(data);
            state.catalogue = normalizeCatalogue(data);
            saveCatalogueCache();
        } catch (error) {
            console.error('[SakaLuX Mission Rewards] Catalogue:', error);
        } finally {
            state.loadingCatalogue = false;
        }
    }

    function loadAmmoCache() {
        const timestamp = Number(localStorage.getItem(STORAGE.ammoTime) || 0);
        if (!timestamp || Date.now() - timestamp > AMMO_CACHE) return false;
        const data = loadJson(STORAGE.ammo, []);
        if (!Array.isArray(data)) return false;
        state.ammo = data;
        return true;
    }

    async function loadAmmo(force = false) {
        if (state.loadingAmmo) return;
        if (!force && state.ammo.length) return;
        if (!force && loadAmmoCache()) return;
        const key = getApiKey();
        if (!key) return;
        state.loadingAmmo = true;
        try {
            const data = await apiGet('https://api.torn.com/user/?selections=ammo&key=' + encodeURIComponent(key));
            checkApiError(data);
            state.ammo = Array.isArray(data.ammo) ? data.ammo : [];
            saveJson(STORAGE.ammo, state.ammo);
            localStorage.setItem(STORAGE.ammoTime, String(Date.now()));
        } catch (error) {
            console.error('[SakaLuX Mission Rewards] Ammo:', error);
        } finally {
            state.loadingAmmo = false;
        }
    }

    function getOwnedAmmo(type, size) {
        const wantedType = normalize(type);
        const wantedSize = normalize(size);
        let total = 0;
        for (const ammo of state.ammo) {
            if (normalize(ammo.type) === wantedType && normalize(ammo.size) === wantedSize) {
                total += Number(ammo.quantity || 0);
            }
        }
        return total;
    }

    function getModRanges() {
        return loadJson(STORAGE.modRanges, {});
    }

    function saveModObservation(name, price, special) {
        if (!settings.learnModPrices) return;
        const points = Number(price);
        if (!name || !Number.isFinite(points) || points <= 0) return;
        const data = getModRanges();
        const key = normalize(name);
        if (!data[key]) {
            data[key] = { name, min: null, max: null, specialMin: null, specialMax: null, observations: 0, lastSeen: 0 };
        }
        const row = data[key];
        if (special) {
            row.specialMin = row.specialMin == null ? points : Math.min(row.specialMin, points);
            row.specialMax = row.specialMax == null ? points : Math.max(row.specialMax, points);
        } else {
            row.min = row.min == null ? points : Math.min(row.min, points);
            row.max = row.max == null ? points : Math.max(row.max, points);
        }
        row.observations = Number(row.observations || 0) + 1;
        row.lastSeen = Date.now();
        saveJson(STORAGE.modRanges, data);
    }

    function getModRange(name) {
        return getModRanges()[normalize(name)] || null;
    }

    function parseRewardData(element) {
        const raw = element?.dataset?.ammoInfo;
        if (!raw) return null;
        try { return JSON.parse(raw); }
        catch (error) {
            console.warn('[SakaLuX Mission Rewards] Invalid reward data.', error);
            return null;
        }
    }

    function getRewardCards() {
        return [...document.querySelectorAll('.rewards-list li[data-ammo-info]')];
    }

    function getRewardType(data) {
        if (data?.type === 'weaponUpgrade') return 'mod';
        if (data?.basicType === 'Ammo') return 'ammo';
        if (data?.basicType === 'Item') return 'item';
        return 'other';
    }

    function createBadgeContainer(card) {
        let box = card.querySelector(':scope > .sl-mr-card-info');
        if (box) return box;
        card.style.setProperty('position', 'relative', 'important');
        box = document.createElement('div');
        box.className = 'sl-mr-card-info';
        card.appendChild(box);
        return box;
    }

    function findCatalogueItem(data) {
        if (data?.itemID) {
            const byId = state.catalogue.get('id:' + String(data.itemID));
            if (byId) return byId;
        }
        if (data?.id) {
            const byId = state.catalogue.get('id:' + String(data.id));
            if (byId) return byId;
        }
        return data?.name ? state.catalogue.get(normalize(data.name)) || null : null;
    }

    function renderItemBadge(box, data) {
        const item = findCatalogueItem(data);
        const points = Number(data.points || 0);
        const amount = Number(data.amount || 1);
        if (!item?.marketPrice) {
            box.innerHTML = '<div class="sl-mr-line muted">💰 Value unavailable</div>';
            return;
        }
        const totalValue = item.marketPrice * amount;
        const perCredit = points > 0 ? totalValue / points : 0;
        box.innerHTML = `<div class="sl-mr-line">💰 ${formatMoney(totalValue)}</div><div class="sl-mr-line good">${formatMoney(perCredit)} / credit</div>`;
    }

    function renderAmmoBadge(box, data) {
        const owned = getOwnedAmmo(data.ammoType, data.name);
        box.innerHTML = `<div class="sl-mr-line">🔫 Owned: ${formatNumber(owned)}</div><div class="sl-mr-line muted">${formatNumber(data.amount || 0)} for ${formatNumber(data.points || 0)} credits</div>`;
    }

    function renderModBadge(box, data) {
        const special = data.label === 'special-offer';
        saveModObservation(data.name, data.points, special);
        const range = getModRange(data.name);
        const normalText = range?.min != null ? (range.min === range.max ? String(range.min) : range.min + '–' + range.max) : 'No normal range yet';
        const specialText = range?.specialMin != null ? (range.specialMin === range.specialMax ? String(range.specialMin) : range.specialMin + '–' + range.specialMax) : 'No special range yet';
        box.innerHTML = `<div class="sl-mr-line ${special ? 'special' : ''}">${special ? '⭐ SPECIAL' : '🧩 MOD'} • ${formatNumber(data.points || 0)} credits</div><div class="sl-mr-line muted">Seen: ${escapeHtml(normalText)}</div><div class="sl-mr-line special-text">Special: ${escapeHtml(specialText)}</div>`;
    }

    async function processCard(card) {
        const data = parseRewardData(card);
        if (!data) return;
        const type = getRewardType(data);
        const box = createBadgeContainer(card);
        if (!settings.showCardBadges) {
            box.style.display = 'none';
            return;
        }
        box.style.display = '';
        if (type === 'item' && settings.showItemValue) {
            await loadCatalogue();
            renderItemBadge(box, data);
            return;
        }
        if (type === 'ammo' && settings.showAmmoOwned) {
            await loadAmmo();
            renderAmmoBadge(box, data);
            return;
        }
        if (type === 'mod') {
            renderModBadge(box, data);
            return;
        }
        box.innerHTML = `<div class="sl-mr-line muted">${escapeHtml(data.basicType || data.type || 'Reward')}</div>`;
    }

    function getActiveReward() {
        const active = document.querySelector('.rewards-list > li.act[data-ammo-info]');
        return active ? { element: active, data: parseRewardData(active) } : null;
    }

    function removeDetailPanel() {
        document.querySelectorAll('.sl-mr-detail').forEach(el => el.remove());
    }

    async function renderDetailPanel() {
        const description = document.querySelector('.show-item-info');
        if (!description || description.querySelector('.sl-mr-detail')) return;
        const active = getActiveReward();
        if (!active?.data) return;
        const data = active.data;
        const type = getRewardType(data);
        const panel = document.createElement('div');
        panel.className = 'sl-mr-detail';
        panel.innerHTML = '<div class="sl-mr-detail-title">🎯 SakaLuX Reward Info</div><div class="sl-mr-detail-body">Loading...</div>';
        description.appendChild(panel);
        const body = panel.querySelector('.sl-mr-detail-body');

        if (type === 'item') {
            await loadCatalogue();
            const item = findCatalogueItem(data);
            const points = Number(data.points || 0);
            const amount = Number(data.amount || 1);
            if (item?.marketPrice) {
                const total = item.marketPrice * amount;
                const perCredit = points > 0 ? total / points : 0;
                body.innerHTML = `<div>Market value: <b>${formatMoney(item.marketPrice)}</b></div><div>Reward amount: <b>${formatNumber(amount)}</b></div><div>Estimated total: <b>${formatMoney(total)}</b></div><div class="sl-mr-highlight">💰 Value / credit: <b>${formatMoney(perCredit)}</b></div>`;
            } else body.textContent = 'Market value unavailable.';
            return;
        }

        if (type === 'ammo') {
            await loadAmmo();
            const owned = getOwnedAmmo(data.ammoType, data.name);
            body.innerHTML = `<div>Ammo: <b>${escapeHtml(data.name)}</b></div><div>Type: <b>${escapeHtml(data.ammoType || '?')}</b></div><div>Reward: <b>${formatNumber(data.amount || 0)}</b></div><div>Cost: <b>${formatNumber(data.points || 0)} credits</b></div><div class="sl-mr-highlight">🔫 Currently owned: <b>${formatNumber(owned)}</b></div>`;
            return;
        }

        if (type === 'mod') {
            const special = data.label === 'special-offer';
            saveModObservation(data.name, data.points, special);
            const range = getModRange(data.name);
            body.innerHTML = `<div>Mod: <b>${escapeHtml(data.name)}</b></div><div>Current cost: <b>${formatNumber(data.points || 0)} credits</b></div><div>Offer: <b>${special ? '⭐ SPECIAL' : 'Normal'}</b></div><br><div>Observed normal range: <b>${range?.min != null ? range.min + (range.max !== range.min ? ' – ' + range.max : '') : 'Not enough data'}</b></div><div>Observed special range: <b>${range?.specialMin != null ? range.specialMin + (range.specialMax !== range.specialMin ? ' – ' + range.specialMax : '') : 'Not enough data'}</b></div><div class="sl-mr-note">Ranges are learned locally from Mission Shop offers seen on this device.</div>`;
            return;
        }

        body.textContent = 'No additional information available for this reward type.';
    }

    async function scanRewards(force = false) {
        if (!state.enabled || !isMissionsPage()) return;
        for (const card of getRewardCards()) {
            if (!force && state.processedCards.has(card)) continue;
            state.processedCards.add(card);
            try { await processCard(card); }
            catch (error) { console.error('[SakaLuX Mission Rewards]', error); }
        }
        await renderDetailPanel();
        state.lastScan = Date.now();
    }

    function scheduleScan(force = false) {
        if (!state.enabled || !isMissionsPage()) return;
        if (state.scanTimer) clearTimeout(state.scanTimer);
        state.scanTimer = setTimeout(() => {
            state.scanTimer = null;
            scanRewards(force);
        }, 150);
    }

    function openSettings() {
        if (!isMissionsPage()) {
            location.href = MISSIONS_URL;
            return;
        }
        let overlay = document.getElementById('sl-mr-settings-overlay');
        if (overlay) overlay.remove();
        overlay = document.createElement('div');
        overlay.id = 'sl-mr-settings-overlay';
        overlay.innerHTML = `
            <div id="sl-mr-settings">
                <div class="sl-mr-settings-head"><div><div class="sl-mr-settings-title">🎯 SakaLuX Mission Rewards</div><div class="sl-mr-settings-sub">v${VERSION} • ${escapeHtml(state.apiMode || 'API not loaded')}</div></div><button id="sl-mr-settings-close">×</button></div>
                <label class="sl-mr-setting"><input id="sl-mr-show-items" type="checkbox" ${settings.showItemValue ? 'checked' : ''}> Show item market value / credit</label>
                <label class="sl-mr-setting"><input id="sl-mr-show-ammo" type="checkbox" ${settings.showAmmoOwned ? 'checked' : ''}> Show owned special ammo</label>
                <label class="sl-mr-setting"><input id="sl-mr-learn-mods" type="checkbox" ${settings.learnModPrices ? 'checked' : ''}> Learn weapon mod price ranges locally</label>
                <label class="sl-mr-setting"><input id="sl-mr-show-badges" type="checkbox" ${settings.showCardBadges ? 'checked' : ''}> Show information directly on reward cards</label>
                <div class="sl-mr-api-box"><div>API: <b>${getApiKey() ? '✅ Available' : '⚠️ Missing'}</b></div>${!getApiKey() ? '<input id="sl-mr-api-key" type="password" placeholder="Minimal Torn API key...">' : ''}</div>
                <button class="sl-mr-settings-btn gray" id="sl-mr-create-key">🔑 ${window.SakaLuXScriptHub ? 'CREATE GENERAL HUB API KEY' : 'CREATE REQUIRED API KEY'}</button>
                <button class="sl-mr-settings-btn" id="sl-mr-save">💾 SAVE</button>
                <button class="sl-mr-settings-btn gray" id="sl-mr-refresh">🔄 REFRESH DATA</button>
                <button class="sl-mr-settings-btn gray" id="sl-mr-clear-mods">🧩 CLEAR LEARNED MOD RANGES</button>
            </div>`;
        document.body.appendChild(overlay);
        document.getElementById('sl-mr-settings-close').onclick = () => overlay.remove();
        document.getElementById('sl-mr-create-key').onclick = createRequiredApiKey;
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
        document.getElementById('sl-mr-save').onclick = () => {
            settings.showItemValue = document.getElementById('sl-mr-show-items').checked;
            settings.showAmmoOwned = document.getElementById('sl-mr-show-ammo').checked;
            settings.learnModPrices = document.getElementById('sl-mr-learn-mods').checked;
            settings.showCardBadges = document.getElementById('sl-mr-show-badges').checked;
            const keyInput = document.getElementById('sl-mr-api-key');
            if (keyInput?.value.trim()) saveApiKey(keyInput.value.trim());
            saveJson(STORAGE.settings, settings);
            state.processedCards = new WeakSet();
            overlay.remove();
            scheduleScan(true);
        };
        document.getElementById('sl-mr-refresh').onclick = async () => {
            state.catalogue = new Map();
            state.ammo = [];
            localStorage.removeItem(STORAGE.catalogueTime);
            localStorage.removeItem(STORAGE.ammoTime);
            await loadCatalogue(true);
            await loadAmmo(true);
            state.processedCards = new WeakSet();
            scheduleScan(true);
            overlay.remove();
        };
        document.getElementById('sl-mr-clear-mods').onclick = () => {
            if (!confirm('Clear all locally learned weapon mod ranges?')) return;
            localStorage.removeItem(STORAGE.modRanges);
            state.processedCards = new WeakSet();
            scheduleScan(true);
        };
    }

    function injectCss() {
        if (document.getElementById('sl-mr-style')) return;
        const style = document.createElement('style');
        style.id = 'sl-mr-style';
        style.textContent = `
            .sl-mr-card-info{position:absolute!important;left:6px!important;right:6px!important;bottom:42px!important;z-index:20!important;padding:5px 6px!important;border-radius:6px!important;background:rgba(17,24,39,.94)!important;color:#fff!important;font-size:9px!important;line-height:1.35!important;pointer-events:none!important;box-sizing:border-box!important;box-shadow:0 2px 6px rgba(0,0,0,.35)!important}
            .sl-mr-line{font-weight:800}.sl-mr-line.good{color:#4ade80}.sl-mr-line.special,.sl-mr-line.special-text{color:#fbbf24}.sl-mr-line.muted{color:#c5cad1;font-weight:600}
            .sl-mr-detail{margin-top:10px;padding:10px;border-radius:9px;background:#111827;border:1px solid #303640;color:#e5e7eb;font-size:11px;line-height:1.6}.sl-mr-detail-title{color:#fbbf24;font-size:12px;font-weight:900;margin-bottom:6px}.sl-mr-highlight{margin-top:5px;color:#4ade80;font-size:12px}.sl-mr-note{margin-top:7px;color:#9ca3af;font-size:9px}
            #sl-mr-settings-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}#sl-mr-settings{width:min(560px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0}.sl-mr-settings-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.sl-mr-settings-title{font-size:17px;font-weight:900}.sl-mr-settings-sub{margin-top:3px;color:#9ca3af;font-size:9px}#sl-mr-settings-close{width:36px;height:36px;border:0;border-radius:9px;background:#252a32;color:#fff;font-size:20px}.sl-mr-setting{display:block;margin-bottom:7px;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}.sl-mr-api-box{margin-top:10px;padding:10px;background:#181d24;border:1px solid #292f38;border-radius:9px;font-size:11px}#sl-mr-api-key{width:100%;box-sizing:border-box;margin-top:8px;padding:9px;border:1px solid #303640;border-radius:8px;background:#101318;color:#fff}.sl-mr-settings-btn{width:100%;margin-top:7px;min-height:40px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900}.sl-mr-settings-btn.gray{background:#374151}
            #${HUB_PROMPT_ID}{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif}#${HUB_PROMPT_ID}>div{width:min(420px,100%);background:#101318;color:#fff;border:1px solid #303640;border-radius:14px;padding:16px;box-shadow:0 12px 35px rgba(0,0,0,.55)}#${HUB_PROMPT_ID} h3{margin:0 0 8px;font-size:16px}#${HUB_PROMPT_ID} p{margin:0 0 14px;color:#b8c0cc;font-size:12px;line-height:1.45}#${HUB_PROMPT_ID} .sl-mr-hub-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}#${HUB_PROMPT_ID} button{border:0;border-radius:9px;padding:10px;font-weight:900;color:#fff;background:#374151}#${HUB_PROMPT_ID} .install{background:#16a34a}
            @media(min-width:700px){#sl-mr-settings-overlay{align-items:center}#sl-mr-settings{border-radius:18px}}
        `;
        document.head.appendChild(style);
    }


    function startObserver() {
        if (!state.enabled || !isMissionsPage() || state.observer) return;
        state.observer = new MutationObserver(mutations => {
            if (mutations.some(m => m.addedNodes.length)) {
                removeDetailPanel();
                scheduleScan();
            }
        });
        state.observer.observe(document.body, { childList: true, subtree: true });
    }

    function hubInstalled() {
        return Boolean(window.SakaLuXScriptHub?.ready || document.getElementById('sakalux-hub-button'));
    }

    function maybePromptForHub() {
        if (!state.enabled || hubInstalled() || document.getElementById(HUB_PROMPT_ID)) return;
        let last = 0;
        try { last = Number(localStorage.getItem(HUB_PROMPT_STORAGE) || 0); } catch {}
        if (last && Date.now() - last < HUB_PROMPT_INTERVAL) return;
        injectCss();
        const overlay = document.createElement('div');
        overlay.id = HUB_PROMPT_ID;
        overlay.innerHTML = `<div><h3>☠️ Install SakaLuX Script Hub?</h3><p>Mission Rewards works on its own, but the Script Hub can detect, launch and manage all SakaLuX add-ons from one place.</p><div class="sl-mr-hub-actions"><button id="sl-mr-hub-not-now">NOT NOW</button><button class="install" id="sl-mr-hub-install">INSTALL HUB</button></div></div>`;
        document.body.appendChild(overlay);
        const remember = () => { try { localStorage.setItem(HUB_PROMPT_STORAGE, String(Date.now())); } catch {} };
        document.getElementById('sl-mr-hub-not-now').onclick = () => { remember(); overlay.remove(); };
        document.getElementById('sl-mr-hub-install').onclick = () => { remember(); location.href = HUB_INSTALL_URL; };
    }

    function startRuntime() {
        if (!state.enabled || !isMissionsPage()) return;
        injectCss();
        startObserver();
        loadCatalogueCache();
        loadAmmoCache();
        if (settings.showItemValue && !state.catalogue.size) loadCatalogue().then(() => scheduleScan(true));
        if (settings.showAmmoOwned && !state.ammo.length) loadAmmo().then(() => scheduleScan(true));
        scheduleScan(true);
    }

    function stopRuntime() {
        if (state.scanTimer) clearTimeout(state.scanTimer);
        state.scanTimer = null;
        state.observer?.disconnect();
        state.observer = null;
        document.getElementById('sl-mr-settings-overlay')?.remove();
        document.getElementById(HUB_PROMPT_ID)?.remove();
        removeDetailPanel();
        document.querySelectorAll('.sl-mr-card-info').forEach(box => {
            const card = box.parentElement;
            box.remove();
            if (card?.style.getPropertyValue('position') === 'relative') card.style.removeProperty('position');
        });
        state.processedCards = new WeakSet();
    }

    function setEnabled(value) {
        state.enabled = Boolean(value);
        saveJson(STORAGE.enabled, state.enabled);
        if (state.enabled) startRuntime();
        else stopRuntime();
        window.dispatchEvent(new CustomEvent('SakaLuX:MissionRewardsStateChanged', { detail: { version: VERSION, enabled: state.enabled } }));
        syncHubBridge('mission-rewards', state.enabled);
        return state.enabled;
    }

    function toggleEnabled() {
        return setEnabled(!state.enabled);
    }

    function syncHubBridge(id, value) { const bridge = document.getElementById('sakalux-module-bridge-' + id); if (bridge) bridge.dataset.enabled = String(Boolean(value)); }
    function installHubBridge(id, openHandler) {
        let bridge = document.getElementById('sakalux-module-bridge-' + id);
        if (!bridge) { bridge = document.createElement('button'); bridge.type = 'button'; bridge.id = 'sakalux-module-bridge-' + id; bridge.hidden = true; (document.body || document.documentElement).appendChild(bridge); }
        bridge.dataset.version = VERSION; bridge.dataset.enabled = String(Boolean(state.enabled));
        bridge.onclick = () => { const action = bridge.dataset.action; if (action === 'open') openHandler(); else if (action === 'toggle') toggleEnabled(); else if (action === 'on' || action === 'off') setEnabled(action === 'on'); bridge.dataset.action = ''; syncHubBridge(id, state.enabled); };
    }

    window.SakaLuXMissionRewards = {
        id: 'mission-rewards',
        name: 'Mission Rewards',
        version: VERSION,
        ready: true,
        open() {
            if (!state.enabled) setEnabled(true);
            if (!isMissionsPage()) {
                location.href = MISSIONS_URL;
                return true;
            }
            openSettings();
            return true;
        },
        async refresh() {
            if (!isMissionsPage()) return false;
            state.processedCards = new WeakSet();
            await scanRewards(true);
            return true;
        },
        async hardRefresh() {
            if (!isMissionsPage()) return false;
            state.catalogue = new Map();
            state.ammo = [];
            localStorage.removeItem(STORAGE.catalogueTime);
            localStorage.removeItem(STORAGE.ammoTime);
            await loadCatalogue(true);
            await loadAmmo(true);
            state.processedCards = new WeakSet();
            await scanRewards(true);
            return true;
        },
        setEnabled,
        toggleEnabled,
        isEnabled() { return state.enabled; },
        createRequiredTornKey: createRequiredApiKey,
        health() {
            return {
                ready: true,
                version: VERSION,
                enabled: state.enabled,
                activePage: isMissionsPage(),
                apiMode: state.apiMode,
                hasApiKey: Boolean(getApiKey()),
                catalogueItems: state.catalogue.size,
                ammoEntries: state.ammo.length,
                rewardCards: isMissionsPage() ? getRewardCards().length : 0,
                lastScan: state.lastScan,
                learnedMods: Object.keys(getModRanges()).length
            };
        },
        goToMissions() {
            location.href = MISSIONS_URL;
            return true;
        }
    };

    window.dispatchEvent(new CustomEvent('SakaLuX:MissionRewardsReady', { detail: { version: VERSION, enabled: state.enabled } }));

    async function init() {
        try { localStorage.setItem('SakaLuX_Installed_mission-rewards', VERSION); } catch {}
        state.enabled = loadJson(STORAGE.enabled, true) !== false;
        installHubBridge('mission-rewards', () => window.SakaLuXMissionRewards.open());
        if (state.enabled) setTimeout(maybePromptForHub, 3500);

        if (!isMissionsPage()) {
            console.log('[SakaLuX Mission Rewards v' + VERSION + '] Hub API ready; Mission features on standby.');
            return;
        }

        if (state.enabled) startRuntime();
        console.log('[SakaLuX Mission Rewards v' + VERSION + '] Loaded.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }


    /* SakaLuX Unified Control Center UI — visual layer only. */
    function installSakaLuXUnifiedTheme_mission_rewards() {
        if (document.getElementById('sakalux-unified-theme-mission-rewards')) return;
        const style = document.createElement('style');
        style.id = 'sakalux-unified-theme-mission-rewards';
        style.textContent = `
:where([id^="sl-mr-"],[class*="sl-mr-"],[id^="sl-mri-"],[class*="sl-mri-"]){font-family:Inter,Arial,sans-serif!important;box-sizing:border-box}
:where([id^="sl-mr-"][id*="panel" i],[id^="sl-mr-"][id*="settings" i],[id^="sl-mr-"][id*="modal" i],[id^="sl-mr-"][id*="details" i],[id^="sl-mri-"][id*="panel" i],[id^="sl-mri-"][id*="settings" i],[id^="sl-mri-"][id*="modal" i],[id^="sl-mri-"][id*="details" i]){background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%)!important;color:#e7edf5!important;border:1px solid #314154!important;border-radius:16px!important;box-shadow:0 18px 52px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.025)!important}
:where([class*="sl-mr-"][class*="header" i],[id^="sl-mr-"][id*="header" i],[class*="sl-mri-"][class*="header" i],[id^="sl-mri-"][id*="header" i]){background:linear-gradient(155deg,#1b2634,#111923)!important;border-color:#314154!important;color:#f8fafc!important}
:where([class*="sl-mr-"][class*="card" i],[class*="sl-mr-"][class*="row" i],[class*="sl-mr-"][class*="section" i],[class*="sl-mr-"][class*="note" i],[class*="sl-mri-"][class*="card" i],[class*="sl-mri-"][class*="row" i],[class*="sl-mri-"][class*="section" i],[class*="sl-mri-"][class*="note" i]){background:linear-gradient(145deg,#18212d,#131b25)!important;border-color:#2d3c4e!important;border-radius:12px!important;color:#dce6f0!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}
:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"]){border:1px solid #3d78bf!important;border-radius:10px!important;background:linear-gradient(180deg,#377fcf,#275f9f)!important;color:#fff!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,filter .12s ease!important}
:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"]):active{transform:translateY(1px)!important}
:where(input[id^="sl-mr-"],select[id^="sl-mr-"],textarea[id^="sl-mr-"],[id^="sl-mr-"] input,[id^="sl-mr-"] select,[id^="sl-mr-"] textarea,input[id^="sl-mri-"],select[id^="sl-mri-"],textarea[id^="sl-mri-"],[id^="sl-mri-"] input,[id^="sl-mri-"] select,[id^="sl-mri-"] textarea){background:#0d141d!important;border:1px solid #3a4b61!important;border-radius:9px!important;color:#f4f7fb!important;outline:none!important}
:where(input[type="checkbox"][id^="sl-mr-"],input[type="checkbox"][id^="sl-mri-"]){appearance:none!important;-webkit-appearance:none!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0 8px 0 0!important;vertical-align:middle!important;border:1px solid #546276!important;border-radius:999px!important;background:radial-gradient(circle at 10px 50%,#e7edf5 0 6px,transparent 6.5px),#465365!important;cursor:pointer!important;transition:.18s ease!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)!important}
:where(input[type="checkbox"][id^="sl-mr-"],input[type="checkbox"][id^="sl-mri-"]):checked{border-color:#24754f!important;background:radial-gradient(circle at 27px 50%,#fff 0 6px,transparent 6.5px),#1eb36a!important}
:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[id*="close" i],:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[class*="close" i],:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[id*="back" i],:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[class*="gray" i],:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[class*="secondary" i]{background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}
:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[id*="clear" i],:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[id*="reset" i],:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[id*="delete" i],:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[class*="danger" i],:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"])[class*="red" i]{background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
@media(max-width:520px){:where([id^="sl-mr-"][id*="panel" i],[id^="sl-mr-"][id*="settings" i],[id^="sl-mr-"][id*="modal" i],[id^="sl-mr-"][id*="details" i],[id^="sl-mri-"][id*="panel" i],[id^="sl-mri-"][id*="settings" i],[id^="sl-mri-"][id*="modal" i],[id^="sl-mri-"][id*="details" i]){border-radius:15px!important}:where(button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"]){min-height:34px!important}}
`;
        (document.head || document.documentElement).appendChild(style);
    }
    installSakaLuXUnifiedTheme_mission_rewards();

})();
// SAKALUX_INLINE_PANEL_FOOTER_V2
;(() => {
    const FOOTER_ID='sakalux-inline-footer-mission-rewards';
    const PANEL_SELECTOR='#sl-mr-settings';
    const PROFILE='https://www.torn.com/profiles.php?XID=2380374';
    function ensureInlineSakaLuXFooter(){
        const panel=document.querySelector(PANEL_SELECTOR);
        if(!panel)return;
        let footer=panel.querySelector('#'+FOOTER_ID);
        if(!footer){
            footer=document.createElement('div');
            footer.id=FOOTER_ID;
            footer.innerHTML='Made with ❤️ by <a href="'+PROFILE+'" target="_self" rel="noopener">SakaLuX [2380374]</a>';
            footer.style.cssText='flex:0 0 auto;width:100%;box-sizing:border-box;margin-top:10px;padding:10px 8px 9px;border-top:1px solid #2d3c4e;background:rgba(10,15,21,.72);color:#8e99a8;text-align:center;font:700 10px/1.25 Arial,sans-serif';
            const link=footer.querySelector('a');
            if(link)link.style.cssText='color:#d7a94a!important;text-decoration:none!important;font-weight:900!important';
        }
        if(panel.lastElementChild!==footer)panel.appendChild(footer);
    }
    const start=()=>{
        ensureInlineSakaLuXFooter();
        if(!document.body)return;
        const observer=new MutationObserver(ensureInlineSakaLuXFooter);
        observer.observe(document.body,{childList:true,subtree:true});
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* SAKALUX_MISSION_HINTS_ISOLATED_V1020_BEGIN
 * Runtime-isolated Mission Hints. Mission Rewards core initializes before this block.
 * Static execution avoids CSP/WebView restrictions on Function/eval in TornPDA.
 */
(() => {
    'use strict';
    try {
/* SAKALUX_MISSION_HINTS_V120_BEGIN */
/*
 * Integrated Duke Mission Task + Hint guide.
 * Independent SakaLuX implementation inspired by the public TornTools Mission Hints feature.
 * No external runtime dependency, no userscript-manager bridge, and no userscript-manager-specific compatibility code.
 */
(() => {
    'use strict';

const MISSION_GUIDE = {
    a_good_day_to_get_hard:{task:'Build a 3–10 kill streak.',hint:'Buying losses can help.'},
    a_kimpossible_task:{task:'Defeat the target using melee and temporary weapons only.',hint:'Guns may stay equipped; do not use them.'},
    a_problem_at_the_tracks:{task:'Defeat 3 targets using only fists or melee weapons.',hint:'Other weapon types may stay equipped, but using them fails the mission.'},
    a_thor_loser:{task:"Hit 6–14 unique body parts with Duke’s hammer.",hint:'Long fights or stalemates give you more chances to hit different body parts.'},
    against_the_odds:{task:'Defeat 2 targets.'},
    an_honorary_degree:{task:'Defeat the target without using guns.',hint:'Guns can remain equipped.'},
    army_of_one:{task:'Attack the target 3 times while changing masks.',hint:'Use the two masks Duke sends and make one attack with no mask; simply attacking is enough.'},
    bakeout_breakout:{task:'Combine a fruitcake with the lock pick, then send the special fruitcake to a jailed player.'},
    bare_knuckle:{task:'Defeat the target with no weapons or armor equipped.',hint:'Unequip everything before the fight.'},
    batshit_crazy:{task:'Deal the required damage with Penelope.',hint:'Duke supplies Penelope.'},
    battering_ram:{task:'Attack the target 3 times.'},
    big_tub_of_muscle:{task:'Defeat the target despite boosted strength.'},
    birthday_surprise:{task:'Send Duke the requested item as a present.',hint:'Use an empty box and gift wrap to make a parcel.'},
    bonnie_and_clyde:{task:'Defeat the target and their spouse.'},
    bountiful:{task:'Successfully claim 2–5 bounties.',hint:'Hospitalize the bounty target for the claim.'},
    bounty_on_the_mutiny:{task:'Place a bounty on the target and wait for someone to claim it.',hint:'You cannot claim your own bounty.'},
    bring_it:{task:'Defeat Duke in a group attack.',hint:'Joining a loot fight can count; you do not need the finishing hit.'},
    candy_from_babies:{task:'Collect the required total bounty value.',hint:'It may be split across multiple bounties.'},
    charity_work:{task:'Successfully mug 2 targets.',hint:'A small transfer beforehand can guarantee mug cash.'},
    cracking_up:{task:'Interrogate the target for Duke’s safe code, open the safe, then send Duke its contents.',hint:'It may take several attempts to obtain the code.'},
    critical_education:{task:'Land 3–9 critical hits.'},
    cut_them_down_to_size:{task:'Defeat any player at your level or higher.'},
    dirty_little_secret:{task:'Bounty the target, then attack the player who claims that bounty.',hint:'Anonymous claimers can still expose an ID in the mission panel.'},
    double_jeopardy:{task:'Place a bounty on a player, then defeat that player.',hint:'The bounty can be any amount and does not need to be claimed.'},
    drug_problem:{task:'Defeat 4–7 targets.'},
    emotional_debt:{task:'Hit the target with tear gas or pepper spray.'},
    estranged:{task:'Injure one of the target’s legs.',hint:'Feet count as leg hits for this mission.'},
    family_ties:{task:'Hospitalize the target 3 times.'},
    field_trip:{task:'Win the required amount on 3 casino games.'},
    fireworks:{task:'Use 250–1,250 rounds of ammunition.'},
    forgotten_bills:{task:'Defeat the target.'},
    frenzy:{task:'Defeat 5–15 players.',hint:'You must initiate the attacks yourself; bought losses do not count.'},
    get_things_jumping:{task:'Deal and receive the required amount of damage.'},
    graffiti:{task:'Hit the target with pepper spray.',hint:'It still counts even if the pepper spray effect is ineffective.'},
    guardian:{task:'Defeat the target.'},
    hammer_time:{task:'Defeat the target with a hammer.',hint:'Dual hammers do not count.'},
    hands_off:{task:'Defeat 3–5 targets.'},
    hare_meet_tortoise:{task:'Defeat the target despite boosted speed.',hint:'Flash or smoke can reduce speed.'},
    hide_and_seek:{task:'Identify the correct player from the listed clues and defeat them.'},
    hiding_in_plain_view:{task:'Defeat the target while they are in the required foreign country.'},
    high_fliers:{task:'Defeat 3 targets in the specified foreign countries.'},
    hobgoblin:{task:'Defeat a player of your choice 5 times.'},
    immovable_object:{task:'Defeat the target despite boosted defense.'},
    inside_job:{task:'Attack the target and plant the item Duke gives you.',hint:'The Secrete option appears after you defeat the target.'},
    introduction_duke:{task:'Complete 10 Duke contracts.'},
    keeping_up_appearances:{task:'Mug the target, then return the money.',hint:'The mug must be successful.'},
    kiss_of_death:{task:'Defeat the target and choose the kiss finishing option.'},
    lack_of_awareness:{task:'Defeat the target.'},
    lost_and_found:{task:'Hospitalize the target for 12 hours.'},
    loud_and_clear:{task:'Use 3–11 explosive grenades.',hint:'Use grenades classified as explosive, such as HEG or Grenade; flash-type utility items may not qualify.'},
    loyal_customer:{task:'Defeat the target.'},
    make_it_slow:{task:'Defeat the target in no fewer than the required 5–9 turns.',hint:'Keep the fight alive until the required turn count, then finish the target.'},
    marriage_counseling:{task:'Defeat the target’s spouse.'},
    massacrist:{task:'Defeat the target.'},
    meeting_the_challenge:{task:'Mug players until the required total cash has been collected.'},
    motivator:{task:'Lose or stalemate against the target on your first attempt.',hint:'Lowering your health and unequipping armor can make this easier.'},
    new_kid_on_the_block:{task:'Defeat 5 players.'},
    no_man_is_an_island:{task:'Mug 2 of the 3 listed targets.',hint:'Any two different listed targets count.'},
    no_second_chances:{task:'Defeat the target on the first attempt.'},
    out_of_the_frying_pan:{task:'Go to jail, use Felovax to move to hospital, then use Zylkene.'},
    painleth_dentitht:{task:'Defeat the target with a baseball bat.',hint:'Other weapons may stay equipped; the baseball bat must satisfy the mission condition.'},
    party_tricks:{task:'Defeat the target despite boosted dexterity.'},
    pass_the_word:{task:'Send the target a message containing the required keyword.',hint:'Copying the relevant mission text into Torn mail is the safest method.'},
    peak_experience:{task:'Defeat the target.'},
    proof_of_the_pudding:{task:'Use the requested weapon type on the target, then send that weapon type to them.',hint:'It does not have to be the exact same item instance.'},
    rabbit_response:{task:'Defeat 3 targets within the mission time window.',hint:'The timer begins after you attack the first target.'},
    reconstruction:{task:'Equip a kitchen knife and leather gloves, defeat the target, then dump both items.',hint:'The knife only needs to be equipped.'},
    red_faced:{task:'Land the finishing hit with a trout.'},
    rising_costs:{task:'Hit the target with a brick.',hint:'The brick must connect.'},
    rolling_in_it:{task:'Successfully mug the target.',hint:'A small transfer beforehand can guarantee mug cash.'},
    safari:{task:'Defeat the target with a rifle in South Africa.',hint:'All damaging hits should be made with a rifle; other weapons may remain equipped.'},
    scammer:{task:'Defeat the target.',hint:'Mugging may be worthwhile if they are carrying cash.'},
    sellout_slayer:{task:'Buy a gun, use that gun against 2–6 players, then sell it.',hint:'Not every ranged weapon is treated as a gun for this mission.'},
    sending_a_message:{task:'Defeat the target.'},
    show_some_muscle:{task:'Attack the target.',hint:'You only need to initiate the attack; a win is not required.'},
    sleep_aid:{task:'Defeat the target.'},
    some_people:{task:'Send any item as a parcel to the target.'},
    standard_routine:{task:'Defeat the target using fists, kicks, or a clubbing weapon.'},
    stomach_upset:{task:'Injure the target’s stomach.'},
    swan_step_too_far:{task:'Find an item in the dump, then defeat its previous owner.',hint:'Keep searching until the previous owner is a viable target.'},
    the_executive_game:{task:'Defeat the target using only fists or kicks.',hint:'Weapons can remain equipped as long as you do not use them.'},
    the_tattoo_artist:{task:'Defeat the target using only a slashing or piercing weapon.',hint:'Guns can stay equipped, but do not use them.'},
    three_peat:{task:'Leave one player, mug one player, and hospitalize one player.'},
    training_day:{task:'Spend 250–1,250 energy in the gym.'},
    tree_huggers:{task:'Defeat 5–8 targets.'},
    undercutters:{task:'Defeat 3 targets.'},
    unwanted_attention:{task:'Hospitalize 4 targets.'},
    withdrawal:{task:'Injure both of the target’s arms.',hint:'Hands count as arms for this mission.'},
    wrath_of_duke:{task:'Defeat 4 targets.'}
};

    const STYLE_ID = 'sl-mr-integrated-mission-hints-style';
    const BOX_CLASS = 'sl-mr-mission-hint';
    let renderTimer = 0;

    function isMissionsPage() {
        const u = String(location.href || '');
        return /(?:loader|page)\.php\?[^#]*sid=missions/i.test(u) || /#.*missions/i.test(u);
    }

    function moduleEnabled() {
        try {
            const api = window.SakaLuXMissionRewards;
            if (api && typeof api.isEnabled === 'function') return api.isEnabled() !== false;
        } catch {}
        return true;
    }

    function normalizeMissionKey(title) {
        return String(title || '')
            .toLowerCase()
            .replace(/&nbsp;/g, ' ')
            .replace(/[’']/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[-\s]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function missionTitle(card) {
        const stored = card?.dataset?.slxMissionTitle || '';
        if (stored) return stored;
        const node = card?.querySelector?.('.title-black, [class*="title-black"], h1, h2, h3, h4, [class*="title"], [class*="name"]');
        if (!node) return '';
        const raw = node.childNodes?.[0]?.wholeText || node.textContent || '';
        return String(raw).replace(/\s+/g, ' ').trim();
    }

    function isVisibleElement(el) {
        if (!el || !el.isConnected) return false;
        const r=el.getBoundingClientRect?.();
        if (!r || r.width < 2 || r.height < 2) return false;
        const cs=getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) !== 0;
    }

    function findMobileActiveMissionHost() {
        const root=document.getElementById('missionsMainContainer') || document.body;
        if (!root) return null;
        const candidates=[];
        for (const el of root.querySelectorAll('h1,h2,h3,h4,h5,strong,b,span,div')) {
            if (!isVisibleElement(el)) continue;
            if (el.children.length > 3) continue;
            const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
            if (!text || text.length > 80) continue;
            const key=normalizeMissionKey(text);
            if (!MISSION_GUIDE[key]) continue;
            candidates.push({el,text,key});
        }
        if (!candidates.length) return null;
        // TornPDA renders the selected mission detail after the mission list. Prefer
        // the last visible matching title and a compact parent host around it.
        const chosen=candidates[candidates.length-1];
        let host=chosen.el.parentElement || chosen.el;
        for (let i=0;i<3 && host?.parentElement;i++) {
            const txt=String(host.textContent||'').trim();
            if (txt.length >= 90 && txt.length <= 1800) break;
            host=host.parentElement;
        }
        if (!host) return null;
        host.dataset.slxMissionTitle=chosen.text;
        return host;
    }

    function missionCards() {
        const exact = [...document.querySelectorAll('.giver-cont-wrap > div[id^="mission"], #missionsMainContainer div[id^="mission"], [id^="mission"][class*="mission"]')];
        const mobile=findMobileActiveMissionHost();
        if (mobile && !exact.includes(mobile)) exact.push(mobile);
        return exact;
    }

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style=document.createElement('style');
        style.id=STYLE_ID;
        style.textContent=`
.${BOX_CLASS}{margin:14px 0 2px;padding:10px 12px;border:1px solid rgba(69,157,255,.32);border-radius:10px;background:linear-gradient(145deg,rgba(20,31,44,.96),rgba(13,21,30,.96));color:#dce8f5;font:12px/1.45 Arial,sans-serif;box-sizing:border-box}
.${BOX_CLASS} .sl-mr-hint-title{margin:0 0 7px;color:#71b7ff;text-align:center;font-size:12px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}
.${BOX_CLASS} .sl-mr-hint-row{margin:3px 0;white-space:normal;overflow-wrap:anywhere}
.${BOX_CLASS} .sl-mr-hint-label{color:#f3f7fb;font-weight:900}
.${BOX_CLASS} .sl-mr-hint-text{color:#cbd8e6}
`;
        (document.head||document.documentElement).appendChild(style);
    }

    function removeExternalDuplicates(card) {
        card.querySelectorAll('.tt-mission-information,.tpda-mission-information').forEach(el=>{
            if (!el.classList.contains(BOX_CLASS)) el.style.setProperty('display','none','important');
        });
    }

    function renderMissionHints() {
        if (!isMissionsPage()) return;
        ensureStyle();
        const enabled=moduleEnabled();
        for (const card of missionCards()) {
            const existing=card.querySelector('.'+BOX_CLASS);
            if (!enabled) { existing?.remove(); continue; }
            const title=missionTitle(card);
            if (!title) continue;
            const info=MISSION_GUIDE[normalizeMissionKey(title)];
            if (!info) { existing?.remove(); continue; }
            removeExternalDuplicates(card);
            const host=card.querySelector('.max-height-fix') || card;
            const box=existing || document.createElement('div');
            box.className=BOX_CLASS;
            box.replaceChildren();
            const heading=document.createElement('div');
            heading.className='sl-mr-hint-title';
            heading.textContent='Mission Information';
            box.appendChild(heading);
            const task=document.createElement('div');
            task.className='sl-mr-hint-row';
            const tl=document.createElement('span'); tl.className='sl-mr-hint-label'; tl.textContent='Task: ';
            const tv=document.createElement('span'); tv.className='sl-mr-hint-text'; tv.textContent=info.task || '';
            task.append(tl,tv); box.appendChild(task);
            if (info.hint) {
                const hint=document.createElement('div');
                hint.className='sl-mr-hint-row';
                const hl=document.createElement('span'); hl.className='sl-mr-hint-label'; hl.textContent='Hint: ';
                const hv=document.createElement('span'); hv.className='sl-mr-hint-text'; hv.textContent=info.hint;
                hint.append(hl,hv); box.appendChild(hint);
            }
            if (!existing) host.appendChild(box);
        }
    }

    function scheduleRender() {
        clearTimeout(renderTimer);
        renderTimer=setTimeout(renderMissionHints,80);
    }

    function start() {
        scheduleRender();
        const root=document.getElementById('missionsMainContainer') || document.body || document.documentElement;
        if (!root) return;
        new MutationObserver(scheduleRender).observe(root,{childList:true,subtree:true});
        window.addEventListener('hashchange',scheduleRender);
        window.addEventListener('popstate',scheduleRender);
        document.addEventListener('sakalux:mission-rewards-state',scheduleRender);
    }

    window.SakaLuXMissionHints={
        version:'1.2.0',
        refresh:renderMissionHints,
        count:()=>Object.keys(MISSION_GUIDE).length
    };

    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
    else start();
})();
/* SAKALUX_MISSION_HINTS_V120_END */


    } catch (error) {
        console.error('[SakaLuX Mission Rewards] Mission Hints isolated module failed; base Mission Rewards remains active.', error);
    }
})();
/* SAKALUX_MISSION_HINTS_ISOLATED_V1020_END */
