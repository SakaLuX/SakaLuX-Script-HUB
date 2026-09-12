// ==UserScript==
// @name         SakaLuX Enhancer Guard
// @namespace    https://torn.com/
// @version      1.3.25
// @description  Advanced Enhancer inventory tracker for Torn PDA / Tampermonkey.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @license      All Rights Reserved
// @downloadURL https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.user.js
// @updateURL https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.meta.js
// ==/UserScript==

/* SakaLuX Standalone Dock Bootstrap — BEGIN */
(() => {
  'use strict';
  const SELF=Object.assign({"id":"enhancer","name":"Enhancer","icon":"🛡️","selector":"#sl-eg-button","fallback":"https://www.torn.com/item.php"},{version:'1.3.25'});
  const HUB_URL='https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY='SakaLuX_HUB_INSTALL_PROMPT_LAST', INTERVAL=12*60*60*1000;
  const DOCK_ID='sakalux-standalone-dock', PROMPT_ID='sakalux-hub-install-prompt', STYLE_ID='sakalux-standalone-dock-style';
  const NATIVE_ID='sakalux-standalone-native-s', FALLBACK_ID='sakalux-standalone-fallback-s';
  const REG_ATTR='data-slx-standalone-registration', OPEN_KEY='SakaLuX_STANDALONE_DOCK_OPEN';
  const ORDER=["enhancer","bazaar","mission-rewards","market-intelligence","elimination-assistant"];
  const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.querySelector('[data-sakalux-hub-installed="1"]'));
  function registerSelf(){let m=document.querySelector(`[${REG_ATTR}="${SELF.id}"]`);if(!m){m=document.createElement('span');m.setAttribute(REG_ATTR,SELF.id);m.hidden=true;(document.body||document.documentElement).appendChild(m);}Object.assign(m.dataset,SELF);}
  function addStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#${DOCK_ID}{position:fixed;right:10px;bottom:74px;z-index:2147483000;width:min(196px,calc(100vw - 20px));max-height:min(58vh,390px);overflow:hidden;padding:8px;background:linear-gradient(180deg,rgba(13,18,26,.985),rgba(8,12,18,.985));border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 14px 34px rgba(0,0,0,.44);backdrop-filter:blur(12px);font-family:Inter,Arial,sans-serif;display:none}
#${DOCK_ID}[data-open="1"]{display:block}
#${DOCK_ID} .slx-dock-head{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:3px;padding:3px 4px 8px;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,.055)}
#${DOCK_ID} .slx-dock-mark{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:linear-gradient(180deg,#293443,#18212c);border:1px solid rgba(215,169,74,.34);color:#ddb95d;font:900 15px/28px Arial;box-shadow:inset 0 1px rgba(255,255,255,.04)}
#${DOCK_ID} .slx-dock-title{color:#f4f7fb;font-size:11px;font-weight:900;line-height:1.15;letter-spacing:.01em;text-align:center}
#${DOCK_ID} .slx-dock-sub{color:#7f8b99;font-size:7px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;text-align:center}
#${DOCK_ID} .slx-dock-items{display:flex;flex-direction:column;gap:4px;max-height:calc(min(58vh,390px) - 112px);overflow:auto}
#${DOCK_ID} .slx-dock-row{display:grid!important;grid-template-columns:18px 1fr 18px!important;align-items:center!important;width:100%!important;min-height:30px!important;margin:0!important;padding:5px 8px!important;box-sizing:border-box!important;position:static!important;inset:auto!important;transform:none!important;border:1px solid rgba(255,255,255,.075)!important;border-radius:10px!important;background:linear-gradient(180deg,#151d27,#101720)!important;color:#eef2f7!important;font:800 10px/1 Arial,sans-serif!important;box-shadow:inset 0 1px rgba(255,255,255,.018)!important}
#${DOCK_ID} .slx-dock-row:active{background:linear-gradient(180deg,#1b2531,#141c26)!important;transform:scale(.985)!important}
#${DOCK_ID} .slx-dock-row .i{grid-column:1;width:18px;text-align:center;font-size:12px}#${DOCK_ID} .slx-dock-row .n{grid-column:2;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#${DOCK_ID} .slx-dock-row .pad{grid-column:3;width:18px}
#${DOCK_ID} .slx-dock-install{display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:6px!important;padding:6px 8px!important;border-radius:10px!important;background:linear-gradient(180deg,#7c5a17,#5f4311)!important;border:1px solid rgba(221,185,91,.62)!important;color:#f9edc4!important;text-align:center!important;text-decoration:none!important;font:900 9px Arial,sans-serif!important;letter-spacing:.01em}
#${NATIVE_ID}{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border:0!important;list-style:none!important;background:none!important;box-shadow:none!important}#${NATIVE_ID}::before,#${NATIVE_ID}::after{content:none!important;display:none!important}#${NATIVE_ID} .slx-s-link{display:grid!important;place-items:center!important;width:17px!important;height:17px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;text-decoration:none!important;color:#dfbd61!important;font:900 15px/17px Arial,sans-serif!important;text-shadow:0 1px 1px rgba(0,0,0,.72),0 0 4px rgba(223,189,97,.18)!important}#${NATIVE_ID} .slx-s-link:active{transform:scale(.9)!important}
#${FALLBACK_ID}{position:fixed;right:10px;bottom:78px;z-index:2147483001;width:32px;height:32px;padding:0;border:1px solid #64748b;border-radius:9px;background:linear-gradient(145deg,#202b39,#111923);color:#dfbd61;box-shadow:0 8px 22px rgba(0,0,0,.42);font:900 15px Arial;display:none;align-items:center;justify-content:center}
body:not([data-sakalux-hub-active="1"]) :is(#sl-eg-button,#sakalux-bt-settings-button,#sl-mri-button,#sl-mi-button,#slx-elim-btn){display:none!important}
`; (document.head||document.documentElement).appendChild(s);}
  function findStatusIconList(){const selectors=['ul[class*="statusIcons"][class*="big"]','ul[class*="status-icons"][class*="big"]','ul[class*="statusIcons"]','ul[class*="status-icons"]'];const lists=selectors.flatMap(q=>[...document.querySelectorAll(q)]);return lists.find(list=>list.isConnected&&[...list.children].some(item=>item.querySelector?.('a')))||null;}
  function copyNativeCell(item,list){const ref=[...list.children].find(x=>x!==item&&x.querySelector?.('a'));if(!ref)return;const native=[...ref.classList].filter(x=>x&&!x.startsWith('slx-')&&!x.startsWith('sakalux-'));item.className=[...native,'slx-standalone-native'].join(' ');}
  function toggleDock(force){const d=ensureDock();if(!d)return;const next=typeof force==='boolean'?force:d.dataset.open!=='1';d.dataset.open=next?'1':'0';try{localStorage.setItem(OPEN_KEY,next?'1':'0')}catch{}}
  function ensureNativeLauncher(){if(hubInstalled()){document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return false;}const list=findStatusIconList();let item=document.getElementById(NATIVE_ID);if(list){if(!item){item=document.createElement('li');item.id=NATIVE_ID;item.innerHTML='<a href="#" class="slx-s-link" aria-label="SakaLuX Scripts" title="SakaLuX Scripts">S</a>';item.querySelector('a').onclick=e=>{e.preventDefault();e.stopPropagation();toggleDock();};}copyNativeCell(item,list);const children=[...list.children].filter(x=>x!==item);const cashIndex=children.findIndex(x=>/\$|cash|money/i.test((x.textContent||'')+' '+(x.className||'')));const anchor=cashIndex>=0?children[cashIndex]:children[0];if(anchor)anchor.insertAdjacentElement('afterend',item);else list.appendChild(item);document.getElementById(FALLBACK_ID)?.remove();return true;}item?.remove();let fb=document.getElementById(FALLBACK_ID);if(!fb){fb=document.createElement('button');fb.id=FALLBACK_ID;fb.type='button';fb.textContent='S';fb.title='SakaLuX Scripts';fb.onclick=()=>toggleDock();(document.body||document.documentElement).appendChild(fb);}fb.style.display='flex';return false;}
  function ensureDock(){if(hubInstalled()){document.body?.setAttribute('data-sakalux-hub-active','1');document.getElementById(DOCK_ID)?.remove();document.getElementById(PROMPT_ID)?.remove();document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return null;}document.body?.removeAttribute('data-sakalux-hub-active');addStyle();let d=document.getElementById(DOCK_ID);if(d)return d;d=document.createElement('div');d.id=DOCK_ID;d.dataset.open=localStorage.getItem(OPEN_KEY)==='1'?'1':'0';d.innerHTML=`<div class="slx-dock-head"><span class="slx-dock-mark">S</span><div class="slx-dock-title">SakaLuX Scripts</div><div class="slx-dock-sub">Standalone</div></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${HUB_URL}">Install SakaLuX Hub</a>`;(document.body||document.documentElement).appendChild(d);return d;}
  function openEntry(data){const el=data.selector?document.querySelector(data.selector):null;if(el){el.click();return;}if(data.fallback)location.href=data.fallback;}
  function render(){const d=ensureDock();if(!d)return;const box=d.querySelector('.slx-dock-items');const regs=[...document.querySelectorAll(`[${REG_ATTR}]`)].map(x=>x.dataset).filter(x=>x.id);regs.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id));box.replaceChildren();for(const r of regs){const b=document.createElement('button');b.type='button';b.className='slx-dock-row';b.innerHTML=`<span class="i">${r.icon||'•'}</span><span class="n">${r.name||r.id}</span><span class="pad"></span>`;b.onclick=()=>openEntry(r);box.appendChild(b);}ensureNativeLauncher();}
  function maybePrompt(){if(hubInstalled()||document.getElementById(PROMPT_ID))return;let last=0;try{last=Number(localStorage.getItem(LAST_KEY)||0)}catch{}if(last&&Date.now()-last<INTERVAL)return;try{localStorage.setItem(LAST_KEY,String(Date.now()))}catch{}const p=document.createElement('div');p.id=PROMPT_ID;p.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';p.innerHTML=`<div style="width:min(350px,100%);background:#111820;color:#fff;border:1px solid #394657;border-radius:14px;padding:16px;font:13px Arial,sans-serif;box-shadow:0 16px 48px #0008"><b style="display:block;text-align:center;font-size:16px">Install SakaLuX Script Hub?</b><div style="margin-top:7px;color:#cbd5e1;line-height:1.4;text-align:center">Manage every SakaLuX add-on from one place with shared settings and controls.</div><div style="display:flex;gap:7px;margin-top:12px"><button type="button" data-later style="flex:1;padding:9px;border-radius:8px;background:#202a36;color:#fff;border:1px solid #526174">Later</button><button type="button" data-install style="flex:1;padding:9px;border-radius:8px;background:#6a4d12;color:#fff4cf;border:1px solid #cda84e;font-weight:900">Install Hub</button></div></div>`;(document.body||document.documentElement).appendChild(p);p.querySelector('[data-later]').onclick=()=>p.remove();p.querySelector('[data-install]').onclick=()=>location.href=HUB_URL;}
  function start(){registerSelf();render();setTimeout(maybePrompt,1200);let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{registerSelf();render();},80);}).observe(document.documentElement,{childList:true,subtree:true});setInterval(()=>{registerSelf();render();maybePrompt();},60000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
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

    const VERSION = '1.3.25';
    const PDA_KEY = '###PDA-APIKEY###';

    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 12 * 60 * 60 * 1000;
    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';
    const REQUIRED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Enhancer%20Guard&user=inventory&torn=items';

    const STORAGE = {
        apiKey: 'SakaLuX_EG_API_KEY',
        showRelics: 'SakaLuX_EG_SHOW_RELICS',
        catalogue: 'SakaLuX_EG_CATALOGUE_V2',
        catalogueTime: 'SakaLuX_EG_CATALOGUE_TIME_V2',
        filter: 'SakaLuX_EG_FILTER',
        sort: 'SakaLuX_EG_SORT',
        compact: 'SakaLuX_EG_COMPACT',
        diagnostics: 'SakaLuX_EG_DIAGNOSTICS',
        favorites: 'SakaLuX_EG_FAVORITES',
        autoRefresh: 'SakaLuX_EG_AUTO_REFRESH',
        enabled: 'SakaLuX_EG_ENABLED'
    };

    // Shared with #1 Item Protector 🔐 MP. When that script is installed,
    // its public storage bridge is preferred (including TornPDA storage).
    const PROTECTOR_STORAGE = {
        full: 'mmp_v91_full',
        partial: 'mmp_v91_partial',
        showProtected: 'mmp_show_protected'
    };
    const PROTECTOR_SETTINGS = 'mmp_dashboard_settings';

    const CACHE_MS = 6 * 60 * 60 * 1000;

    const ENHANCERS = [
        'Advanced Driving Manual','Balaclava','Chloroform','Cut-Throat Razor','Duct Tape','Ergonomic Keyboard','Fanny Pack','Flashlight','Glasses','Heavy Duty Padlock','High-Speed Drive','Large Suitcase','Latex Gloves','Magnifying Glass','Medium Suitcase','Megaphone','Mountain Bike','Office Chair','Paint Mask','Rosary Beads','Screwdriver','Small Suitcase','Sports Sneakers','Tracking Device','Tumble Dryer','Windproof Lighter','Wireless Dongle'
    ];

    const RELICS = ['Asmol Knuckle','Dyno Sac','Ladso Eye',"M'aol Tentacle",'Nol Cloachra','Sylo Tooth'];
    const ALL_NAMES = [...ENHANCERS, ...RELICS];

    const state = {
        catalogue: new Map(),
        inventory: new Map(),
        loading: false,
        lastUpdate: null,
        error: null,
        search: '',
        filter: 'all',
        sort: 'owned',
        showRelics: true,
        compact: false,
        diagnosticsVisible: false,
        favorites: new Set(),
        autoRefreshMinutes: 0,
        autoRefreshTimer: null,
        categories: [],
        apiMode: '',
        apiKeySource: 'None',
        apiAccessStatus: 'unknown',
        apiAccessMessage: 'Not checked yet',
        apiAccessCheckedAt: 0,
        diagnostics: [],
        enabled: getBool(STORAGE.enabled, true)
    };

    function normalize(v) {
        return String(v ?? '').trim().toLowerCase().replace(/[’]/g, "'");
    }

    const RELIC_SET = new Set(RELICS.map(normalize));

    function escapeHtml(v) {
        return String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatMoney(v) {
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) return '?';
        return '$' + Math.round(n).toLocaleString('en-US');
    }

    function formatNumber(v) {
        const n = Number(v);
        return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0';
    }

    function getBool(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v === null ? fallback : v === 'true';
        } catch {
            return fallback;
        }
    }

    function setBool(key, value) {
        try { localStorage.setItem(key, String(value)); } catch {}
    }

    function getString(key, fallback) {
        try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    }

    function setString(key, value) {
        try { localStorage.setItem(key, String(value)); } catch {}
    }

    function normalizeProtectedName(name) {
        return String(name || '').replace(/\s+x\s*[\d,]+$/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function readProtectorLocks() {
        try {
            const full = typeof window.mmpStorageGetFullLocks === 'function'
                ? window.mmpStorageGetFullLocks()
                : JSON.parse(localStorage.getItem(PROTECTOR_STORAGE.full) || '{}');
            const partial = typeof window.mmpStorageGetPartialLocks === 'function'
                ? window.mmpStorageGetPartialLocks()
                : JSON.parse(localStorage.getItem(PROTECTOR_STORAGE.partial) || '{}');
            return {
                full: full && typeof full === 'object' ? full : {},
                partial: partial && typeof partial === 'object' ? partial : {}
            };
        } catch {
            return { full: {}, partial: {} };
        }
    }

    async function writeProtectorLocks(full, partial) {
        const nextFull = full && typeof full === 'object' ? full : {};
        const nextPartial = partial && typeof partial === 'object' ? partial : {};
        try {
            localStorage.setItem(PROTECTOR_STORAGE.full, JSON.stringify(nextFull));
            localStorage.setItem(PROTECTOR_STORAGE.partial, JSON.stringify(nextPartial));
        } catch {}
        if (typeof window.mmpStorageSetLocks === 'function') {
            try { await window.mmpStorageSetLocks(nextFull, nextPartial); } catch {}
        }
        try { window.mmpRefreshAll?.(); } catch {}
    }

    function protectorKey(item) {
        return 'stack_' + normalizeProtectedName(item?.name);
    }

    function protectionFor(item) {
        const locks = readProtectorLocks();
        const key = protectorKey(item);
        return { key, full: Boolean(locks.full[key]), partial: Number(locks.partial[key] || 0) };
    }

    function getProtectorDisplaySettings() {
        try {
            const value = JSON.parse(localStorage.getItem(PROTECTOR_SETTINGS) || '{}');
            return {
                lockSize: ['small', 'medium', 'large'].includes(value.lockSize) ? value.lockSize : 'medium',
                invisible: Boolean(value.invisible)
            };
        } catch {
            return { lockSize: 'medium', invisible: false };
        }
    }

    function cycleProtectorLockSize() {
        const settings = getProtectorDisplaySettings();
        const sizes = ['small', 'medium', 'large'];
        settings.lockSize = sizes[(sizes.indexOf(settings.lockSize) + 1) % sizes.length];
        try { localStorage.setItem(PROTECTOR_SETTINGS, JSON.stringify(settings)); } catch {}
        try { window.saveDashSettings?.(settings); } catch {}
        try { window.mmpRefreshAll?.(); } catch {}
        try { window.dispatchEvent(new CustomEvent('SakaLuX:ItemProtectorSettingsChanged', { detail: settings })); } catch {}
        refreshInventoryProtectionBadges();
        return settings.lockSize;
    }

    function isItemsPage() {
        const href = String(location.href || '').toLowerCase();
        return href.includes('sid=items') || href.includes('/items') || Boolean(document.querySelector('.items-list, .thumbnail-wrap, span.image-wrap'));
    }

    function inventoryItemName(target) {
        if (!target) return '';
        const image = target.querySelector('img');
        const itemNode = target.closest('[data-item-name], [data-name], [data-item-id]');
        const labelled = target.querySelector('[title], [aria-label]') || target.parentElement?.querySelector('[title], [aria-label]');
        const direct = target.dataset.itemName || target.getAttribute('data-item-name') || itemNode?.dataset.itemName || itemNode?.dataset.name || image?.alt || image?.title || image?.getAttribute('aria-label') || labelled?.getAttribute('title') || labelled?.getAttribute('aria-label');
        if (direct && normalizeProtectedName(direct)) return String(direct).replace(/\s+x\s*[\d,]+$/i, '').trim();
        const rows = [target.closest('li'), target.closest('.item'), target.parentElement?.parentElement, target.parentElement?.parentElement?.parentElement].filter(Boolean);
        const text = rows.flatMap(row => (row.innerText || '').split('\n').map(value => value.trim())).filter(Boolean);
        const candidate = text.find(value => !/^items?$/i.test(value) && !/^x?\s*[\d,]+$/i.test(value) && !/^\d+[\s/]/.test(value) && value.length > 1);
        return candidate ? candidate.replace(/\s+x\s*[\d,]+$/i, '').trim() : '';
    }

    function inventoryBadgeMarkup(target, name) {
        const protection = protectionFor({ name });
        const settings = getProtectorDisplaySettings();
        const size = settings.invisible ? 12 : settings.lockSize === 'small' ? 18 : settings.lockSize === 'large' ? 27 : 22;
        const font = settings.invisible ? 7 : settings.lockSize === 'large' ? 12 : 10;
        const qtyFont = settings.invisible ? 6 : settings.lockSize === 'small' ? 7 : settings.lockSize === 'large' ? 11 : 9;
        const badge = target.querySelector('[data-sl-eg-inventory-lock]') || document.createElement('button');
        badge.type = 'button';
        badge.dataset.slEgInventoryLock = '1';
        badge.dataset.name = name;
        badge.title = protection.full ? 'Unlock item' : protection.partial ? 'Edit reserved quantity' : 'Protect item';
        badge.innerHTML = protection.partial
            ? `<span style="font-size:${qtyFont}px;font-weight:900">${protection.partial}</span><span style="font-size:${font}px">🔒</span>`
            : protection.full ? '🔒' : '🔓';
        badge.style.cssText = `position:absolute;top:1px;left:1px;width:${size}px;height:${size}px;padding:0;margin:0;border:0;border-radius:50%;background:${protection.full ? '#a00000' : protection.partial ? '#d07a00' : '#0a8f08'};color:#fff;display:flex;align-items:center;justify-content:center;gap:1px;z-index:2147483000;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.5);font:${font}px/1 Arial,sans-serif;touch-action:none;`;
        if (!badge.parentNode) target.appendChild(badge);
        if (!badge.dataset.bound) {
            badge.dataset.bound = '1';
            let timer = null;
            let held = false;
            badge.addEventListener('pointerdown', event => {
                event.preventDefault();
                event.stopPropagation();
                held = false;
                clearTimeout(timer);
                timer = setTimeout(async () => {
                    held = true;
                    const current = protectionFor({ name }).partial || 1;
                    const value = window.prompt('Protected quantity:', String(current));
                    if (value !== null) await toggleItemProtection({ name }, value);
                    refreshInventoryProtectionBadges();
                }, 850);
            });
            badge.addEventListener('pointerup', event => { event.preventDefault(); event.stopPropagation(); clearTimeout(timer); });
            badge.addEventListener('pointercancel', () => clearTimeout(timer));
            badge.addEventListener('click', async event => {
                event.preventDefault();
                event.stopPropagation();
                if (held) { held = false; return; }
                await toggleItemProtection({ name });
                refreshInventoryProtectionBadges();
            });
        }
    }

    function refreshInventoryProtectionBadges() {
        document.querySelectorAll('div.thumbnail-wrap, span.image-wrap').forEach(target => {
            const name = inventoryItemName(target);
            if (name) inventoryBadgeMarkup(target, name);
        });
    }

    let inventoryProtectionObserver = null;
    let inventoryProtectionTimer = null;
    function installInventoryProtection() {
        if (!document.body || inventoryProtectionObserver) return;
        const refresh = () => {
            clearTimeout(inventoryProtectionTimer);
            inventoryProtectionTimer = setTimeout(refreshInventoryProtectionBadges, 80);
        };
        refresh();
        inventoryProtectionObserver = new MutationObserver(refresh);
        inventoryProtectionObserver.observe(document.body, { childList: true, subtree: true });
    }

    function renderProtectionBadge(item) {
        const protection = protectionFor(item);
        const settings = getProtectorDisplaySettings();
        const badgeSize = settings.invisible ? 12 : settings.lockSize === 'small' ? 18 : settings.lockSize === 'large' ? 27 : 22;
        const fontSize = settings.invisible ? 7 : settings.lockSize === 'large' ? 12 : 10;
        const quantitySize = settings.invisible ? 6 : settings.lockSize === 'small' ? 7 : settings.lockSize === 'large' ? 11 : 9;
        const color = protection.full ? '#a00000' : protection.partial ? '#d07a00' : '#0a8f08';
        const label = protection.partial ? `${protection.partial} 🔒` : protection.full ? '🔒' : '🔓';
        return `<button class="sl-eg-lock ${protection.full || protection.partial ? 'is-locked' : ''}" data-name="${escapeHtml(item.name)}" title="${protection.full ? 'Unlock item' : protection.partial ? 'Edit reserved quantity' : 'Protect item'}" style="position:absolute;top:1px;left:1px;width:${badgeSize}px;height:${badgeSize}px;padding:0;margin:0;border:0;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;gap:1px;z-index:4;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.5);font-size:${fontSize}px;line-height:1;">${protection.partial ? `<span style="font-size:${quantitySize}px;font-weight:900">${protection.partial}</span><span style="font-size:${fontSize}px">🔒</span>` : label}</button>`;
    }

    async function toggleItemProtection(item, quantity = null) {
        if (!item?.name) return;
        const locks = readProtectorLocks();
        const key = protectorKey(item);
        if (quantity !== null) {
            const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
            delete locks.full[key];
            locks.partial[key] = safeQuantity;
        } else if (locks.full[key]) {
            delete locks.full[key];
            delete locks.partial[key];
        } else {
            locks.full[key] = true;
            delete locks.partial[key];
        }
        await writeProtectorLocks(locks.full, locks.partial);
        render();
    }

    function saleRowName(row) {
        if (!row) return '';
        const name = row.querySelector('.name')?.textContent
            || row.querySelector('img')?.alt
            || row.querySelector('[aria-label*="available:" i]')?.getAttribute('aria-label')?.match(/about the (.*?) \(available/i)?.[1]
            || (row.innerText || '').split('\n')[0];
        return normalizeProtectedName(name);
    }

    function isProtectedSalePage() {
        const href = String(location.href || '').toLowerCase();
        return href.includes('#/addlisting')
            || href.includes('displaycase.php#add')
            || href.includes('factions.php?step=your&type=1')
            || href.includes('bazaar.php?step=add')
            || href.includes('trade.php');
    }

    function hideProtectedSaleRows() {
        if (typeof window.mmpRefreshAll === 'function' || !isProtectedSalePage()) return;
        const locks = readProtectorLocks();
        const isLocked = row => Boolean(locks.full['stack_' + saleRowName(row)]);
        document.querySelectorAll('li.clearfix, .sell-items-list > li').forEach(row => {
            if (!saleRowName(row)) return;
            const locked = isLocked(row);
            row.style.display = locked ? 'none' : '';
            if (locked) {
                row.querySelectorAll('input[type="checkbox"]').forEach(input => {
                    if (input.checked) input.click();
                    input.checked = false;
                });
                row.querySelectorAll('input[placeholder="Qty"], input.input-money').forEach(input => {
                    if (input.value !== '0') {
                        input.value = '0';
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }
        });
        if (String(location.href).toLowerCase().includes('#/addlisting')) {
            document.querySelectorAll('[class*="virtualListing___"]').forEach(row => {
                if (!saleRowName(row)) return;
                const locked = isLocked(row);
                row.style.display = locked ? 'none' : '';
                if (locked) {
                    row.querySelectorAll('input.input-money').forEach(input => {
                        if (input.value !== '0') {
                            input.value = '0';
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                    row.querySelectorAll('input[type="checkbox"]').forEach(input => {
                        if (input.checked) input.click();
                    });
                }
            });
        }
    }

    let saleObserverTimer = null;
    let saleObserver = null;
    function installSaleProtectionFallback() {
        if (saleObserver || !document.body) return;
        saleObserver = new MutationObserver(() => {
            clearTimeout(saleObserverTimer);
            saleObserverTimer = setTimeout(hideProtectedSaleRows, 40);
        });
        saleObserver.observe(document.body, { childList: true, subtree: true });
        hideProtectedSaleRows();
    }

    function loadFavorites() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE.favorites) || '[]');
            return new Set(Array.isArray(data) ? data : []);
        } catch {
            return new Set();
        }
    }

    function saveFavorites() {
        try { localStorage.setItem(STORAGE.favorites, JSON.stringify([...state.favorites])); } catch {}
    }

    function getApiKey() {
        try {
            const hubKey = window.SakaLuXScriptHub?.getApiKey?.() || '';
            if (hubKey) {
                state.apiMode = 'SakaLuX Hub';
                state.apiKeySource = 'SakaLuX Hub';
                return hubKey;
            }
            if (window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button')) {
                const storedHubKey = localStorage.getItem('SakaLuX_HUB_TORN_API_KEY') || '';
                if (storedHubKey) { state.apiMode = 'SakaLuX Hub'; state.apiKeySource = 'SakaLuX Hub'; return storedHubKey; }
            }
        } catch {}
        if (PDA_KEY && PDA_KEY !== '###PDA-APIKEY###') {
            state.apiMode = 'Torn PDA';
            state.apiKeySource = 'Torn PDA';
            return PDA_KEY;
        }
        try {
            const key = localStorage.getItem(STORAGE.apiKey) || '';
            if (key) { state.apiMode = 'Manual'; state.apiKeySource = 'Local standalone'; }
            else state.apiKeySource = 'None';
            return key;
        } catch {
            state.apiKeySource = 'None';
            return '';
        }
    }

    function saveApiKey(key) {
        try {
            localStorage.setItem(STORAGE.apiKey, key);
            state.apiMode = 'Manual';
            state.apiKeySource = 'Local standalone';
        } catch {}
    }

    function clearApiKey() {
        try { localStorage.removeItem(STORAGE.apiKey); } catch {}
    }

    function createRequiredApiKey() {
        state.apiAccessStatus = 'setup';
        state.apiAccessMessage = 'Create the named key in Torn, then return and paste it below.';
        try { sessionStorage.setItem('SakaLuX_EG_KEY_SETUP_PENDING', '1'); } catch {}
        location.href = REQUIRED_API_KEY_URL;
        return true;
    }

    function apiSetupPending() {
        try { return sessionStorage.getItem('SakaLuX_EG_KEY_SETUP_PENDING') === '1'; }
        catch { return false; }
    }

    function parseResponse(response) {
        if (response == null) throw new Error('Empty API response.');
        if (typeof response === 'object' && !('responseText' in response)) return response;
        let raw = response.responseText ?? response.body ?? response.data ?? response;
        if (typeof raw === 'object') return raw;
        try { return JSON.parse(String(raw)); }
        catch { throw new Error('Invalid JSON returned by Torn API.'); }
    }

    function apiGet(url) {
        return new Promise((resolve, reject) => {
            if (typeof window.PDA_httpGet === 'function') {
                state.apiMode = 'Torn PDA';
                window.PDA_httpGet(url, { Accept: 'application/json' })
                    .then(response => { try { resolve(parseResponse(response)); } catch (error) { reject(error); } })
                    .catch(reject);
                return;
            }

            if (window.flutter_inappwebview?.callHandler) {
                state.apiMode = 'Torn PDA';
                window.flutter_inappwebview.callHandler('PDA_httpGet', url, { Accept: 'application/json' })
                    .then(response => { try { resolve(parseResponse(response)); } catch (error) { reject(error); } })
                    .catch(reject);
                return;
            }

            if (typeof GM_xmlhttpRequest === 'function') {
                state.apiMode = 'Tampermonkey';
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    headers: { Accept: 'application/json' },
                    timeout: 20000,
                    onload: response => { try { resolve(parseResponse(response)); } catch (error) { reject(error); } },
                    onerror: () => reject(new Error('Network request failed.')),
                    ontimeout: () => reject(new Error('API request timed out.'))
                });
                return;
            }

            state.apiMode = 'Fetch';
            fetch(url, { headers: { Accept: 'application/json' } })
                .then(response => {
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.json();
                })
                .then(resolve)
                .catch(reject);
        });
    }

    function apiError(data) {
        if (!data?.error) return null;
        if (typeof data.error === 'string') return data.error;
        return data.error.error || data.error.message || data.error.code || 'Unknown Torn API error';
    }

    async function checkRequiredApiAccess(keyOverride = '') {
        const key = String(keyOverride || getApiKey() || '').trim();
        if (!key) {
            state.apiAccessStatus = 'missing';
            state.apiAccessMessage = 'No API key configured';
            state.apiAccessCheckedAt = Date.now();
            return { ok: false, status: state.apiAccessStatus, message: state.apiAccessMessage };
        }

        try {
            const items = await apiGet('https://api.torn.com/v2/torn/items?cat=Enhancer&sort=ASC&key=' + encodeURIComponent(key));
            const itemsError = apiError(items);
            if (itemsError) throw new Error('Torn Items: ' + itemsError);

            const inventory = await apiGet('https://api.torn.com/v2/user/inventory?cat=Enhancer&limit=1&offset=0&key=' + encodeURIComponent(key));
            const inventoryError = apiError(inventory);
            if (inventoryError) throw new Error('User Inventory: ' + inventoryError);

            state.apiAccessStatus = 'ok';
            state.apiAccessMessage = 'API access OK · Inventory + Torn Items available';
            state.apiAccessCheckedAt = Date.now();
            return { ok: true, status: state.apiAccessStatus, message: state.apiAccessMessage };
        } catch (error) {
            const message = String(error?.message || error || 'API request failed');
            state.apiAccessStatus = /permission|access|scope|key|incorrect|invalid/i.test(message) ? 'missing-permission' : 'error';
            state.apiAccessMessage = state.apiAccessStatus === 'missing-permission'
                ? 'API KEY MISSING INVENTORY OR TORN ITEMS ACCESS'
                : message;
            state.apiAccessCheckedAt = Date.now();
            return { ok: false, status: state.apiAccessStatus, message: state.apiAccessMessage, raw: message };
        }
    }

    function saveReplacementApiKey(key) {
        const clean = String(key || '').trim();
        if (!clean) return false;
        saveApiKey(clean);
        state.apiAccessStatus = 'unknown';
        state.apiAccessMessage = 'New key saved · checking access…';
        state.apiAccessCheckedAt = 0;
        try { sessionStorage.removeItem('SakaLuX_EG_KEY_SETUP_PENDING'); } catch {}
        return clean;
    }

    function normalizeCatalogue(data) {
        const map = new Map();
        if (!Array.isArray(data?.items)) return map;
        for (const raw of data.items) {
            if (!raw?.id || !raw?.name) continue;
            const price = Number(raw.value?.market_price ?? raw.market_price ?? raw.market_value ?? 0);
            map.set(String(raw.id), {
                id: String(raw.id),
                name: String(raw.name).trim(),
                category: raw.type ?? raw.category ?? raw.item_type ?? null,
                marketPrice: Number.isFinite(price) && price > 0 ? price : null
            });
        }
        return map;
    }

    function loadCatalogueCache() {
        try {
            const ts = Number(localStorage.getItem(STORAGE.catalogueTime) || 0);
            if (!ts || Date.now() - ts > CACHE_MS) return null;
            const arr = JSON.parse(localStorage.getItem(STORAGE.catalogue) || '[]');
            const map = new Map();
            for (const item of arr) {
                if (item?.id && item?.name) map.set(String(item.id), item);
            }
            return map.size ? map : null;
        } catch {
            return null;
        }
    }

    function getCatalogueCacheAge() {
        try {
            const ts = Number(localStorage.getItem(STORAGE.catalogueTime) || 0);
            if (!ts) return null;
            return Date.now() - ts;
        } catch {
            return null;
        }
    }

    function cacheAgeText() {
        const age = getCatalogueCacheAge();
        if (age === null) return 'No cache';
        const minutes = Math.floor(age / 60000);
        if (minutes < 1) return '<1m';
        if (minutes < 60) return minutes + 'm';
        return Math.floor(minutes / 60) + 'h';
    }

    function saveCatalogueCache(map) {
        try {
            localStorage.setItem(STORAGE.catalogue, JSON.stringify([...map.values()]));
            localStorage.setItem(STORAGE.catalogueTime, String(Date.now()));
        } catch {}
    }

    function clearCatalogueCache() {
        try {
            localStorage.removeItem(STORAGE.catalogue);
            localStorage.removeItem(STORAGE.catalogueTime);
        } catch {}
    }

    function catalogueByName() {
        const map = new Map();
        for (const item of state.catalogue.values()) map.set(normalize(item.name), item);
        return map;
    }

    async function ensureCatalogue(key, force = false) {
        if (!force) {
            const cached = loadCatalogueCache();
            if (cached) {
                state.catalogue = cached;
                state.diagnostics.push('Catalogue cache: ' + cached.size + ' items');
                return;
            }
        }

        const url = 'https://api.torn.com/v2/torn/items?cat=All&sort=ASC&key=' + encodeURIComponent(key);
        const data = await apiGet(url);
        const err = apiError(data);
        if (err) throw new Error('Items API: ' + err);
        state.catalogue = normalizeCatalogue(data);
        if (!state.catalogue.size) throw new Error('Item catalogue returned no items.');
        saveCatalogueCache(state.catalogue);
        state.diagnostics.push('Catalogue API: ' + state.catalogue.size + ' items');
    }

    function normalizeInventory(data) {
        const map = new Map();
        const rows = data?.inventory?.items;
        if (!Array.isArray(rows)) return map;
        for (const row of rows) {
            if (!row?.id) continue;
            const id = String(row.id);
            const amount = Number(row.amount ?? 0);
            const qty = Number.isFinite(amount) ? amount : 0;
            if (!map.has(id)) map.set(id, { personal: 0, faction: 0, total: 0 });
            const current = map.get(id);
            if (row.faction_owned) current.faction += qty;
            else current.personal += qty;
            current.total += qty;
        }
        return map;
    }

    function mergeInventory(target, source) {
        for (const [id, quantities] of source) {
            if (!target.has(id)) target.set(id, { personal: 0, faction: 0, total: 0 });
            const row = target.get(id);
            row.personal += quantities.personal || 0;
            row.faction += quantities.faction || 0;
            row.total += quantities.total || 0;
        }
    }

    function detectCategories() {
        const byName = catalogueByName();
        const set = new Set();
        for (const name of ALL_NAMES) {
            const item = byName.get(normalize(name));
            if (item?.category) set.add(String(item.category));
        }
        if (!set.size) set.add('Enhancer');
        return [...set];
    }

    async function refreshData(options = {}) {
        if (state.loading) return;
        state.loading = true;
        state.error = null;
        state.diagnostics = [];
        render();

        const key = getApiKey();
        if (!key) {
            state.loading = false;
            showKeyPrompt();
            return;
        }

        try {
            await ensureCatalogue(key, Boolean(options.forceCatalogue));
            state.categories = detectCategories();
            state.diagnostics.push('Categories: ' + state.categories.join(', '));
            const merged = new Map();

            for (const category of state.categories) {
                const url = 'https://api.torn.com/v2/user/inventory?cat=' + encodeURIComponent(category) + '&limit=100&offset=0&key=' + encodeURIComponent(key);
                const data = await apiGet(url);
                const err = apiError(data);
                if (err) throw new Error('Inventory (' + category + '): ' + err);
                const normalized = normalizeInventory(data);
                mergeInventory(merged, normalized);
                state.diagnostics.push(category + ': ' + normalized.size + ' item types');
            }

            state.inventory = merged;
            state.lastUpdate = new Date();
            state.loading = false;
            render();
        } catch (error) {
            console.error('[SakaLuX Enhancer Guard]', error);
            state.error = error?.message || 'Unknown API error';
            state.loading = false;
            render();
        }
    }

    function resolveItem(name) {
        const item = catalogueByName().get(normalize(name));
        const isRelic = RELIC_SET.has(normalize(name));
        if (!item) {
            return {
                id: null,
                name,
                category: null,
                personal: 0,
                faction: 0,
                quantity: 0,
                owned: false,
                marketValue: null,
                isRelic,
                favorite: state.favorites.has(name)
            };
        }

        const quantities = state.inventory.get(String(item.id)) || { personal: 0, faction: 0, total: 0 };
        return {
            id: item.id,
            name,
            category: item.category,
            personal: quantities.personal,
            faction: quantities.faction,
            quantity: quantities.total,
            owned: quantities.total > 0,
            marketValue: isRelic ? null : item.marketPrice,
            isRelic,
            favorite: state.favorites.has(name)
        };
    }

    function sortItems(items) {
        return [...items].sort((a, b) => {
            if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
            if (state.sort === 'name') return a.name.localeCompare(b.name);
            if (state.sort === 'priceHigh') return Number(b.marketValue || 0) - Number(a.marketValue || 0);
            if (state.sort === 'priceLow') {
                const ap = a.marketValue || Number.MAX_SAFE_INTEGER;
                const bp = b.marketValue || Number.MAX_SAFE_INTEGER;
                return ap - bp;
            }
            if (a.owned !== b.owned) return a.owned ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
    }

    function filterItems(items) {
        return items.filter(item => {
            if (state.filter === 'owned' && !item.owned) return false;
            if (state.filter === 'missing' && item.owned) return false;
            if (state.search && !item.name.toLowerCase().includes(state.search)) return false;
            return true;
        });
    }

    function calculateMissingCost(items) {
        return items
            .filter(item => !item.owned && !item.isRelic && item.marketValue)
            .reduce((sum, item) => sum + item.marketValue, 0);
    }

    function configureAutoRefresh() {
        if (state.autoRefreshTimer) {
            clearInterval(state.autoRefreshTimer);
            state.autoRefreshTimer = null;
        }
        if (!state.enabled || state.autoRefreshMinutes <= 0) return;
        state.autoRefreshTimer = setInterval(() => refreshData(), state.autoRefreshMinutes * 60 * 1000);
    }

    function injectCss() {
        if (document.getElementById('sl-eg-style')) return;
        const style = document.createElement('style');
        style.id = 'sl-eg-style';
        style.textContent = `
            #sl-eg-button{position:fixed;right:12px;bottom:82px;z-index:2147483646;border:0;border-radius:999px;padding:10px 14px;background:#111827;color:#fff;font-size:13px;font-weight:800;box-shadow:0 5px 18px rgba(0,0,0,.35)}
            #sl-eg-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}
            #sl-eg-panel{width:min(700px,100%);max-height:94vh;overflow:hidden;background:#101318;color:#f3f4f6;border-radius:18px 18px 0 0;box-shadow:0 -8px 35px rgba(0,0,0,.5);display:flex;flex-direction:column}
            #sl-eg-header{padding:14px;border-bottom:1px solid #272c34;flex-shrink:0}
            #sl-eg-title-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
            #sl-eg-title-actions{display:flex;align-items:center;gap:7px}
            #sl-eg-title{font-size:19px;font-weight:900}
            #sl-eg-subtitle{margin-top:4px;color:#9ca3af;font-size:10px}
            .sl-eg-close,.sl-eg-key-button{width:36px;height:36px;border:1px solid #343b45;border-radius:10px;background:#252a32;color:#fff;font-size:18px}
            .sl-eg-key-button{border-color:#66591d;background:#2a2512;color:#e4c95d;font-size:16px}
            #sl-eg-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:11px}
            .sl-eg-stat{background:#181d24;border:1px solid #292f38;border-radius:10px;padding:7px 4px;text-align:center;min-width:0}
            .sl-eg-stat-value{font-size:12px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .sl-eg-stat-label{color:#8b949e;font-size:8px;margin-top:2px;white-space:nowrap}
            #sl-eg-controls{display:grid;grid-template-columns:1fr auto auto auto;gap:6px;margin-top:9px}
            #sl-eg-search{border:1px solid #303640;background:#181d24;color:#fff;border-radius:9px;padding:9px;outline:none}
            .sl-eg-control{border:0;border-radius:9px;min-width:40px;background:#252a32;color:#fff;font-weight:800}
            #sl-eg-filters{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:7px}
            .sl-eg-filter{border:1px solid #303640;border-radius:8px;background:#181d24;color:#c9d1d9;padding:7px;font-size:11px;font-weight:800}
            .sl-eg-filter.active{background:#2563eb;border-color:#3b82f6;color:#fff}
            #sl-eg-list{overflow-y:auto;padding:10px;-webkit-overflow-scrolling:touch}
            .sl-eg-section{margin:7px 0 8px;color:#fbbf24;font-size:12px;font-weight:900;text-transform:uppercase}
            .sl-eg-row{display:grid;grid-template-columns:30px 1fr auto;gap:8px;align-items:center;background:#181d24;border:1px solid #292f38;border-radius:11px;padding:9px;margin-bottom:7px}
            .sl-eg-row.owned{border-left:4px solid #22c55e}.sl-eg-row.not-owned{border-left:4px solid #ef4444;opacity:.82}.sl-eg-row.favorite{box-shadow:0 0 0 1px #fbbf24}
            .sl-eg-icon{position:relative;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#252a32;font-size:15px;overflow:visible}
            .sl-eg-name{font-size:13px;font-weight:900}.sl-eg-name-link{color:#f3f4f6;text-decoration:none;border-bottom:1px dotted #718096}.sl-eg-name-link:active{color:#fbbf24}.sl-eg-status{margin-top:3px;font-size:10px;font-weight:800}.sl-eg-status.yes{color:#4ade80}.sl-eg-status.no{color:#f87171}
            .sl-eg-price{text-align:right;white-space:nowrap}.sl-eg-mv{font-size:12px;font-weight:900}.sl-eg-total{margin-top:3px;color:#9ca3af;font-size:9px}.sl-eg-relic{color:#c084fc;font-size:11px;font-weight:900}button.sl-eg-star{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:20px!important;min-width:20px!important;max-width:20px!important;height:20px!important;min-height:20px!important;max-height:20px!important;border:0!important;border-radius:0!important;background:transparent!important;color:#fbbf24!important;box-shadow:none!important;font-size:16px!important;line-height:20px!important;padding:0!important;margin:0 0 0 5px!important;vertical-align:middle!important}.sl-eg-lock{touch-action:none}
            .sl-eg-protection-note{padding:10px;background:#181d24;border:1px solid #303640;border-radius:9px;color:#c9d1d9;font-size:11px;line-height:1.45}.sl-eg-protection-list{margin-top:8px;max-height:38vh;overflow:auto}.sl-eg-protection-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #292f38}.sl-eg-protection-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-eg-protection-clear{width:100%;margin-top:10px;min-height:38px;border:0;border-radius:8px;background:#7f1d1d;color:#fff;font-weight:900}
            .sl-eg-diagnostics{padding:10px;margin-top:10px;background:#111827;border-radius:8px;color:#9ca3af;font-size:9px;line-height:1.5}.sl-eg-footer{padding:8px 10px;border-top:1px solid #272c34;color:#6b7280;font-size:9px;text-align:center;flex-shrink:0}.sl-eg-empty{padding:30px 10px;text-align:center;color:#9ca3af}.sl-eg-error{padding:15px;background:#32191d;border:1px solid #6b252d;color:#fca5a5;border-radius:12px;margin:10px;font-size:12px;line-height:1.5}
            #sl-eg-api-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.8);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}
            #sl-eg-api-panel{width:min(560px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0;box-shadow:0 -8px 35px rgba(0,0,0,.55)}
            .sl-eg-api-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.sl-eg-api-head-actions{display:flex;align-items:center;gap:7px}.sl-eg-api-title{font-size:17px;font-weight:900}.sl-eg-api-sub{margin-top:3px;color:#8e96a3;font-size:10px}.sl-eg-api-required{margin:9px 0;padding:10px;border:1px solid #66591d;border-radius:9px;background:#211d10;color:#e4c95d;font-size:11px;line-height:1.5}.sl-eg-api-required b{color:#fde68a}.sl-eg-api-create{width:100%;min-height:42px;border:1px solid #7c681e;border-radius:9px;background:#2a2512;color:#f5d85f;font-weight:900}.sl-eg-api-box{margin-top:10px;padding:9px;border:1px solid #2f3945;border-radius:10px;background:#121820}.sl-eg-api-status{display:flex;justify-content:space-between;gap:8px;padding:8px;border-radius:8px;background:#181d24;font-size:10px;line-height:1.35}.sl-eg-api-status b{color:#d7b94c}.sl-eg-api-status.ok span{color:#78d98b}.sl-eg-api-status.missing span,.sl-eg-api-status.missing-permission span,.sl-eg-api-status.error span{color:#f08b8b}.sl-eg-api-source{margin:8px 0;color:#9ca3af;font-size:10px}.sl-eg-api-field{display:block;margin:8px 0;color:#d1d5db;font-size:10px}.sl-eg-api-field input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:8px;font-size:12px}.sl-eg-api-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sl-eg-api-actions button,.sl-eg-api-clear{min-height:38px;border:0;border-radius:8px;background:#374151;color:#fff;font-weight:900;font-size:10px}.sl-eg-api-actions button:first-child{background:#2563eb}.sl-eg-api-clear{width:100%;margin-top:7px}.sl-eg-api-note{margin-top:9px;color:#8e96a3;font-size:9px;line-height:1.5}.sl-eg-lock-size{width:36px;height:36px;border:1px solid #66591d;border-radius:10px;background:#2a2512;color:#f5d85f;font-size:17px;font-weight:900}
            #sl-eg-panel.compact .sl-eg-row{padding:6px;margin-bottom:4px}#sl-eg-panel.compact .sl-eg-icon{width:25px;height:25px}#sl-eg-panel.compact .sl-eg-name{font-size:12px}#sl-eg-panel.compact .sl-eg-category{display:none}
            @media(min-width:700px){#sl-eg-overlay,#sl-eg-api-overlay{align-items:center}#sl-eg-panel,#sl-eg-api-panel{border-radius:18px;max-height:90vh}}
        `;
        document.head.appendChild(style);
    }

    function createButton() {
        if (!state.enabled || document.getElementById('sl-eg-button')) return;
        const button = document.createElement('button');
        button.id = 'sl-eg-button';
        button.textContent = '🛡️ Enhancers';
        button.onclick = openPanel;
        document.body.appendChild(button);
    }

    function openPanel() {
        if (!state.enabled) setEnabled(true);
        if (document.getElementById('sl-eg-overlay')) return true;
        const overlay = document.createElement('div');
        overlay.id = 'sl-eg-overlay';
        overlay.innerHTML = `
            <div id="sl-eg-panel" class="${state.compact ? 'compact' : ''}">
                <div id="sl-eg-header">
                    <div id="sl-eg-title-row">
                        <div><div id="sl-eg-title">🛡️ SakaLuX Enhancer Guard</div><div id="sl-eg-subtitle">v${VERSION} • API v2 • Cache ${cacheAgeText()}</div></div>
                        <div id="sl-eg-title-actions"><button class="sl-eg-key-button" id="sl-eg-api-button" title="API key settings" aria-label="API key settings">🔑</button><button class="sl-eg-close" id="sl-eg-close">×</button></div>
                    </div>
                    <div id="sl-eg-stats"></div>
                    <div id="sl-eg-controls">
                        <input id="sl-eg-search" type="search" placeholder="🔎 Search...">
                        <button class="sl-eg-control" id="sl-eg-relics" title="Relics">⭐</button>
                        <button class="sl-eg-control" id="sl-eg-refresh" title="Refresh">🔄</button>
                    </div>
                    <div id="sl-eg-filters"><button class="sl-eg-filter" data-filter="all">ALL</button><button class="sl-eg-filter" data-filter="owned">OWNED</button><button class="sl-eg-filter" data-filter="missing">MISSING</button></div>
                </div>
                <div id="sl-eg-list"></div>
                <div class="sl-eg-footer">Read-only • Relics excluded from value • ⭐ = priority</div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('sl-eg-close').onclick = closePanel;
        document.getElementById('sl-eg-api-button').onclick = openApiPanel;
        document.getElementById('sl-eg-refresh').onclick = () => refreshData();
        document.getElementById('sl-eg-relics').onclick = () => {
            state.showRelics = !state.showRelics;
            setBool(STORAGE.showRelics, state.showRelics);
            render();
        };

        document.getElementById('sl-eg-search').oninput = function () {
            state.search = this.value.trim().toLowerCase();
            render();
        };

        document.querySelectorAll('.sl-eg-filter').forEach(button => {
            button.onclick = () => {
                state.filter = button.dataset.filter;
                setString(STORAGE.filter, state.filter);
                render();
            };
        });

        overlay.onclick = event => { if (event.target === overlay) closePanel(); };
        render();
        if (!state.lastUpdate && !state.loading) refreshData();
        return true;
    }

    function closePanel() {
        const overlay = document.getElementById('sl-eg-overlay');
        if (!overlay) return false;
        overlay.remove();
        return true;
    }

    function setEnabled(value) {
        state.enabled = Boolean(value);
        setBool(STORAGE.enabled, state.enabled);
        if (state.enabled) {
            injectCss();
            createButton();
            configureAutoRefresh();
        } else {
            if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
            state.autoRefreshTimer = null;
            if (saleObserver) { saleObserver.disconnect(); saleObserver = null; }
            document.getElementById('sl-eg-overlay')?.remove();
            document.getElementById('sl-eg-api-overlay')?.remove();
            document.getElementById('sl-eg-button')?.remove();
            document.getElementById(HUB_PROMPT_ID)?.remove();
        }
        window.dispatchEvent(new CustomEvent('SakaLuX:EnhancerGuardStateChanged', { detail: { version: VERSION, enabled: state.enabled } }));
        syncHubBridge('enhancer', state.enabled);
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

    function updateApiPanelStatus() {
        const panel = document.getElementById('sl-eg-api-panel');
        if (!panel) return;
        const status = panel.querySelector('.sl-eg-api-status');
        const source = panel.querySelector('.sl-eg-api-source');
        if (status) {
            status.className = 'sl-eg-api-status ' + state.apiAccessStatus;
            status.querySelector('span').textContent = state.apiAccessMessage || 'Not checked yet';
        }
        getApiKey();
        if (source) source.innerHTML = 'Active source: <b>' + escapeHtml(state.apiKeySource || 'None') + '</b>';
    }

    function openApiPanel() {
        injectCss();
        document.getElementById('sl-eg-api-overlay')?.remove();
        getApiKey();
        const overlay = document.createElement('div');
        overlay.id = 'sl-eg-api-overlay';
        overlay.innerHTML = `
            <div id="sl-eg-api-panel">
                <div class="sl-eg-api-head">
                    <div><div class="sl-eg-api-title">🔑 Enhancer API Access</div><div class="sl-eg-api-sub">SakaLuX Enhancer Guard v${VERSION}</div></div>
                    <button class="sl-eg-close" id="sl-eg-api-close">×</button>
                </div>
                <div class="sl-eg-api-required"><b>Exact permissions required</b><br>User: Inventory<br>Torn: Items<br>No write permission is requested.</div>
                <button type="button" class="sl-eg-api-create" id="sl-eg-create-key">🔑 CREATE ENHANCER API KEY</button>
                <div class="sl-eg-api-box">
                    <div class="sl-eg-api-status ${escapeHtml(state.apiAccessStatus)}"><b>API ACCESS</b><span>${escapeHtml(state.apiAccessMessage || 'Not checked yet')}</span></div>
                    <div class="sl-eg-api-source">Active source: <b>${escapeHtml(state.apiKeySource || 'None')}</b></div>
                    <label class="sl-eg-api-field">Replace / paste Torn API key<input id="sl-eg-key" type="password" autocomplete="off" placeholder="Paste newly created key here"></label>
                    <div class="sl-eg-api-actions"><button type="button" id="sl-eg-save-key">SAVE NEW API KEY</button><button type="button" id="sl-eg-check-key">CHECK API ACCESS</button></div>
                    <button type="button" class="sl-eg-api-clear" id="sl-eg-clear-key">CLEAR LOCAL KEY</button>
                    <div class="sl-eg-api-note">The Hub general key is used first when available. This local key remains the standalone fallback. TornPDA's injected key is never overwritten.</div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
        overlay.querySelector('#sl-eg-api-close').onclick = () => overlay.remove();
        overlay.querySelector('#sl-eg-create-key').onclick = createRequiredApiKey;
        overlay.querySelector('#sl-eg-save-key').onclick = async () => {
            const input = overlay.querySelector('#sl-eg-key');
            const clean = saveReplacementApiKey(input?.value);
            if (!clean) { input?.focus(); return; }
            const button = overlay.querySelector('#sl-eg-save-key');
            button.textContent = 'CHECKING…';
            const result = await checkRequiredApiAccess(clean);
            button.textContent = result.ok ? 'API KEY OK ✓' : 'KEY SAVED · CHECK FAILED';
            if (result.ok) { input.value = ''; refreshData(); }
            updateApiPanelStatus();
        };
        overlay.querySelector('#sl-eg-check-key').onclick = async () => {
            const button = overlay.querySelector('#sl-eg-check-key');
            button.textContent = 'CHECKING…';
            const result = await checkRequiredApiAccess();
            button.textContent = result.ok ? 'ACCESS OK ✓' : 'CHECK FAILED';
            updateApiPanelStatus();
        };
        overlay.querySelector('#sl-eg-clear-key').onclick = () => {
            clearApiKey();
            const remainingKey = getApiKey();
            state.apiAccessStatus = remainingKey ? 'unknown' : 'missing';
            state.apiAccessMessage = remainingKey ? 'Local key cleared · another active source remains' : 'No API key configured';
            state.apiAccessCheckedAt = Date.now();
            updateApiPanelStatus();
        };
        return true;
    }

    function showKeyPrompt() {
        if (!document.getElementById('sl-eg-overlay')) openPanel();
        state.apiAccessStatus = 'missing';
        state.apiAccessMessage = 'No API key configured';
        openApiPanel();
    }

    function itemMarketUrl(item) {
        const value = item?.id
            ? 'itemID=' + encodeURIComponent(item.id)
            : 'searchname=' + encodeURIComponent(item?.name || '');
        return 'https://www.torn.com/page.php?sid=ItemMarket#/market?' + value;
    }

    function openProtectionPanel() {
        document.getElementById('sl-eg-protection-overlay')?.remove();
        const locks = readProtectorLocks();
        const entries = Object.entries(locks.full).filter(([, value]) => value);
        const partialEntries = Object.entries(locks.partial).filter(([, value]) => Number(value) > 0);
        const names = new Map();
        ENHANCERS.concat(RELICS).forEach(name => names.set(protectorKey({ name }), name));
        const rows = entries.concat(partialEntries.map(([key]) => [key, false]))
            .filter(([key], index, all) => all.findIndex(row => row[0] === key) === index)
            .map(([key]) => {
                const name = names.get(key) || key.replace(/^stack_/, '');
                const amount = Number(locks.partial[key] || 0);
                return `<div class="sl-eg-protection-row"><span>🔒 ${escapeHtml(name)}${amount ? ' · ' + amount + ' reserved' : ''}</span><button class="sl-eg-control sl-eg-unlock" data-key="${escapeHtml(key)}">UNLOCK</button></div>`;
            }).join('');
        const overlay = document.createElement('div');
        overlay.id = 'sl-eg-protection-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.8);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif;';
        overlay.innerHTML = `<div id="sl-eg-api-panel"><div class="sl-eg-api-head"><div><div class="sl-eg-api-title">🔒 Item Protector</div><div class="sl-eg-api-sub">Shared with #1 Item Protector 🔐 MP</div></div><button class="sl-eg-close" data-close="1">×</button></div><div class="sl-eg-protection-note">The lock is shown directly over the item icon on the Items page, as in Item Protector: green = unlocked, red = protected, orange = reserved quantity. Short press toggles protection and long press sets the reserved quantity.</div><div class="sl-eg-protection-list">${rows || '<div class="sl-eg-empty">You have no protected items.</div>'}</div><button class="sl-eg-protection-clear" data-clear="1">CLEAR ALL PROTECTIONS</button></div>`;
        document.body.appendChild(overlay);
        overlay.onclick = event => { if (event.target === overlay || event.target.closest('[data-close]')) overlay.remove(); };
        overlay.querySelectorAll('.sl-eg-unlock').forEach(button => {
            button.onclick = async () => {
                const next = readProtectorLocks();
                delete next.full[button.dataset.key];
                delete next.partial[button.dataset.key];
                await writeProtectorLocks(next.full, next.partial);
                openProtectionPanel();
            };
        });
        overlay.querySelector('[data-clear]')?.addEventListener('click', async () => {
            await writeProtectorLocks({}, {});
            openProtectionPanel();
        });
    }

    function render() {
        const stats = document.getElementById('sl-eg-stats');
        const list = document.getElementById('sl-eg-list');
        if (!stats || !list) return;

        document.querySelectorAll('.sl-eg-filter').forEach(button => {
            button.classList.toggle('active', button.dataset.filter === state.filter);
        });

        if (state.loading) {
            stats.innerHTML = '<div class="sl-eg-stat"><div class="sl-eg-stat-value">⏳</div><div class="sl-eg-stat-label">STATUS</div></div>';
            list.innerHTML = '<div class="sl-eg-empty">Loading...</div>';
            return;
        }

        if (state.error) {
            stats.innerHTML = '<div class="sl-eg-stat"><div class="sl-eg-stat-value">⚠️</div><div class="sl-eg-stat-label">ERROR</div></div>';
            list.innerHTML = `<div class="sl-eg-error">${escapeHtml(state.error)}${state.diagnosticsVisible ? `<div class="sl-eg-diagnostics">${state.diagnostics.map(escapeHtml).join('<br>')}</div>` : ''}</div>`;
            return;
        }

        const normal = sortItems(ENHANCERS.map(resolveItem));
        const relics = sortItems(RELICS.map(resolveItem));
        const ownedEnhancers = normal.filter(item => item.owned).length;
        const ownedRelics = relics.filter(item => item.owned).length;
        const totalValue = normal.filter(item => item.owned && item.marketValue).reduce((sum, item) => sum + item.marketValue * item.quantity, 0);
        const missingCost = calculateMissingCost(normal);

        stats.innerHTML = `
            <div class="sl-eg-stat"><div class="sl-eg-stat-value">${ownedEnhancers}/${ENHANCERS.length}</div><div class="sl-eg-stat-label">ENHANCERS</div></div>
            <div class="sl-eg-stat"><div class="sl-eg-stat-value">${ownedRelics}/${RELICS.length}</div><div class="sl-eg-stat-label">RELICS</div></div>
            <div class="sl-eg-stat"><div class="sl-eg-stat-value">${formatMoney(totalValue)}</div><div class="sl-eg-stat-label">OWNED VALUE</div></div>
            <div class="sl-eg-stat"><div class="sl-eg-stat-value">${formatMoney(missingCost)}</div><div class="sl-eg-stat-label">MISSING COST</div></div>
        `;

        let html = '';
        const filteredNormal = filterItems(normal);
        const filteredRelics = filterItems(relics);
        html += renderSection('Enhancers', filteredNormal);
        if (state.showRelics) html += renderSection('⭐ Enhancer Relics', filteredRelics);

        if (state.lastUpdate) {
            html += `<div class="sl-eg-diagnostics">✅ Connected<br>Updated: ${escapeHtml(state.lastUpdate.toLocaleTimeString())}<br>Cache age: ${escapeHtml(cacheAgeText())}</div>`;
        }

        list.innerHTML = html || '<div class="sl-eg-empty">No results.</div>';
        bindStars();
        bindLocks();
    }

    function renderSection(title, items) {
        if (!items.length) return '';
        let html = `<div class="sl-eg-section">${escapeHtml(title)}</div>`;
        for (const item of items) {
            const rowClass = item.owned ? 'owned' : 'not-owned';
            const icon = item.owned ? '🟢' : '🔴';
            const status = item.owned ? 'OWNED ×' + formatNumber(item.quantity) : 'NOT OWNED';
            const total = !item.isRelic && item.owned && item.marketValue ? item.marketValue * item.quantity : null;
            const protection = protectionFor(item);
            const marketHref = itemMarketUrl(item);
            html += `
                <div class="sl-eg-row ${rowClass} ${item.favorite ? 'favorite' : ''}">
                    <div class="sl-eg-icon">${icon}</div>
                    <div>
                        <div class="sl-eg-name"><a class="sl-eg-name-link" href="${marketHref}" title="Open in Item Market">${escapeHtml(item.name)}</a><button class="sl-eg-star" data-name="${escapeHtml(item.name)}" title="Priority">${item.favorite ? '★' : '☆'}</button></div>
                        <div class="sl-eg-status ${item.owned ? 'yes' : 'no'}">${escapeHtml(status)}</div>
                    </div>
                    <div class="sl-eg-price">
                        ${item.isRelic ? '<div class="sl-eg-relic">🔒 RELIC</div>' : `<div class="sl-eg-mv">💰 ${formatMoney(item.marketValue)}</div><div class="sl-eg-total">${total ? 'Total: ' + formatMoney(total) : 'Market Value'}</div>`}
                    </div>
                </div>
            `;
        }
        return html;
    }

    function bindStars() {
        document.querySelectorAll('.sl-eg-star').forEach(button => {
            button.onclick = event => {
                event.stopPropagation();
                const name = button.dataset.name;
                if (state.favorites.has(name)) state.favorites.delete(name);
                else state.favorites.add(name);
                saveFavorites();
                render();
            };
        });
    }

    function bindLocks() {
        document.querySelectorAll('.sl-eg-lock').forEach(button => {
            let holdTimer = null;
            let holdTriggered = false;
            const item = { name: button.dataset.name };
            const setPartial = async () => {
                holdTriggered = true;
                const current = protectionFor(item).partial || 1;
                const value = window.prompt('Protected quantity:', String(current));
                if (value !== null) await toggleItemProtection(item, value);
            };
            button.addEventListener('pointerdown', event => {
                event.stopPropagation();
                holdTriggered = false;
                clearTimeout(holdTimer);
                holdTimer = setTimeout(setPartial, 750);
            });
            button.addEventListener('pointerup', event => {
                event.stopPropagation();
                clearTimeout(holdTimer);
            });
            button.addEventListener('pointerleave', () => clearTimeout(holdTimer));
            button.addEventListener('click', async event => {
                event.preventDefault();
                event.stopPropagation();
                if (holdTriggered) { holdTriggered = false; return; }
                await toggleItemProtection(item);
            });
        });
    }

    function isHubInstalled() {
        return Boolean(
            window.SakaLuXScriptHub ||
            document.getElementById('sakalux-hub-button')
        );
    }

    function rememberHubPrompt() {
        try { localStorage.setItem(HUB_PROMPT_STORAGE, String(Date.now())); } catch {}
    }

    function shouldOfferHub() {
        if (isHubInstalled()) return false;
        try {
            const last = Number(localStorage.getItem(HUB_PROMPT_STORAGE) || 0);
            return !last || Date.now() - last >= HUB_PROMPT_INTERVAL;
        } catch {
            return true;
        }
    }

    function closeHubPrompt(remember = true) {
        if (remember) rememberHubPrompt();
        document.getElementById(HUB_PROMPT_ID)?.remove();
    }

    function showHubInstallPrompt() {
        if (!shouldOfferHub() || document.getElementById(HUB_PROMPT_ID)) return;
        const overlay = document.createElement('div');
        overlay.id = HUB_PROMPT_ID;
        overlay.style.cssText = 'position:fixed;z-index:2147483647;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;font-family:Arial,sans-serif;';
        overlay.innerHTML = `
            <div style="width:min(420px,94vw);background:#101318;color:#fff;border:1px solid #303640;border-radius:16px;padding:18px;box-sizing:border-box;box-shadow:0 15px 50px rgba(0,0,0,.65);">
                <div style="font-size:19px;font-weight:900;margin-bottom:8px;">☠️ SakaLuX Script Hub</div>
                <div style="font-size:12px;line-height:1.5;color:#c9d1d9;margin-bottom:14px;">This script is part of the SakaLuX suite. Install the main Script Hub for add-on management, quick access and update checking?</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button id="sakalux-hub-install-now" style="border:0;border-radius:9px;padding:11px;background:#16a34a;color:#fff;font-weight:900;">⬇ INSTALL HUB</button>
                    <button id="sakalux-hub-not-now" style="border:0;border-radius:9px;padding:11px;background:#374151;color:#fff;font-weight:900;">NOT NOW</button>
                </div>
                <div style="margin-top:10px;color:#8b949e;font-size:10px;text-align:center;">If you choose NOT NOW, this reminder can appear again after 24 hours.</div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('sakalux-hub-install-now').onclick = () => {
            rememberHubPrompt();
            window.location.href = HUB_INSTALL_URL;
        };
        document.getElementById('sakalux-hub-not-now').onclick = () => closeHubPrompt(true);
        overlay.addEventListener('click', event => {
            if (event.target === overlay) closeHubPrompt(true);
        });
    }

    function scheduleHubInstallPrompt() {
        setTimeout(() => {
            if (!isHubInstalled()) showHubInstallPrompt();
        }, 3500);
    }

    window.SakaLuXEnhancerGuard = {
        id: 'enhancer-guard',
        name: 'Enhancer Guard',
        version: VERSION,
        open() { return openPanel(); },
        close() { return closePanel(); },
        async refresh() { await refreshData(); return true; },
        async hardRefresh() { clearCatalogueCache(); await refreshData({ forceCatalogue: true }); return true; },
        createRequiredTornKey: createRequiredApiKey,
        openApiSettings: openApiPanel,
        checkApiAccess: checkRequiredApiAccess,
        setEnabled,
        toggleEnabled,
        isEnabled() { return state.enabled; },
        health() {
            return {
                ready: true,
                version: VERSION,
                enabled: state.enabled,
                loading: state.loading,
                error: state.error,
                lastUpdate: state.lastUpdate ? state.lastUpdate.getTime() : null,
                inventoryEntries: state.inventory.size,
                catalogueEntries: state.catalogue.size,
                categories: [...state.categories],
                apiMode: state.apiMode,
                apiKeySource: state.apiKeySource,
                hasApiKey: Boolean(getApiKey()),
                apiAccessStatus: state.apiAccessStatus,
                apiAccessMessage: state.apiAccessMessage,
                apiAccessCheckedAt: state.apiAccessCheckedAt,
                autoRefreshMinutes: state.autoRefreshMinutes
            };
        }
    };

    window.dispatchEvent(new CustomEvent('SakaLuX:EnhancerGuardReady', { detail: { version: VERSION, enabled: state.enabled } }));

    function init() {
        try { localStorage.setItem('SakaLuX_Installed_enhancer', VERSION); } catch {}
        state.enabled = getBool(STORAGE.enabled, true);
        installHubBridge('enhancer', openPanel);
        state.showRelics = getBool(STORAGE.showRelics, true);
        state.compact = getBool(STORAGE.compact, false);
        state.diagnosticsVisible = getBool(STORAGE.diagnostics, false);
        state.filter = getString(STORAGE.filter, 'all');
        state.sort = 'name';
        state.favorites = loadFavorites();
        state.autoRefreshMinutes = 0;
        setString(STORAGE.sort, 'name');
        setString(STORAGE.autoRefresh, '0');
        if (state.enabled) {
            injectCss();
            configureAutoRefresh();
            createButton();
            installSaleProtectionFallback();
            installInventoryProtection();
            scheduleHubInstallPrompt();
            if (apiSetupPending() && !/preferences\.php/i.test(location.pathname + location.href)) setTimeout(openApiPanel, 900);
        }
        console.log('[SakaLuX Enhancer Guard v' + VERSION + '] Loaded.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }


    /* SakaLuX Unified Control Center UI — visual layer only. */
    function installSakaLuXUnifiedTheme_enhancer() {
        if (document.getElementById('sakalux-unified-theme-enhancer')) return;
        const style = document.createElement('style');
        style.id = 'sakalux-unified-theme-enhancer';
        style.textContent = `
:where([id^="sl-eg-"],[class*="sl-eg-"]){font-family:Inter,Arial,sans-serif!important;box-sizing:border-box}
:where([id^="sl-eg-"][id*="panel" i],[id^="sl-eg-"][id*="settings" i],[id^="sl-eg-"][id*="modal" i],[id^="sl-eg-"][id*="details" i]){background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%)!important;color:#e7edf5!important;border:1px solid #314154!important;border-radius:16px!important;box-shadow:0 18px 52px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.025)!important}
:where([class*="sl-eg-"][class*="header" i],[id^="sl-eg-"][id*="header" i]){background:linear-gradient(155deg,#1b2634,#111923)!important;border-color:#314154!important;color:#f8fafc!important}
:where([class*="sl-eg-"][class*="card" i],[class*="sl-eg-"][class*="row" i],[class*="sl-eg-"][class*="section" i],[class*="sl-eg-"][class*="note" i]){background:linear-gradient(145deg,#18212d,#131b25)!important;border-color:#2d3c4e!important;border-radius:12px!important;color:#dce6f0!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}
:where(button[id^="sl-eg-"],button[class*="sl-eg-"]){border:1px solid #3d78bf!important;border-radius:10px!important;background:linear-gradient(180deg,#377fcf,#275f9f)!important;color:#fff!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,filter .12s ease!important}
:where(button[id^="sl-eg-"],button[class*="sl-eg-"]):active{transform:translateY(1px)!important}
:where(input[id^="sl-eg-"],select[id^="sl-eg-"],textarea[id^="sl-eg-"],[id^="sl-eg-"] input,[id^="sl-eg-"] select,[id^="sl-eg-"] textarea){background:#0d141d!important;border:1px solid #3a4b61!important;border-radius:9px!important;color:#f4f7fb!important;outline:none!important}
:where(input[type="checkbox"][id^="sl-eg-"]){appearance:none!important;-webkit-appearance:none!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0 8px 0 0!important;vertical-align:middle!important;border:1px solid #546276!important;border-radius:999px!important;background:radial-gradient(circle at 10px 50%,#e7edf5 0 6px,transparent 6.5px),#465365!important;cursor:pointer!important;transition:.18s ease!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)!important}
:where(input[type="checkbox"][id^="sl-eg-"]):checked{border-color:#24754f!important;background:radial-gradient(circle at 27px 50%,#fff 0 6px,transparent 6.5px),#1eb36a!important}
:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[id*="close" i],:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[class*="close" i],:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[id*="back" i],:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[class*="gray" i],:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[class*="secondary" i]{background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}
:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[id*="clear" i],:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[id*="reset" i],:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[id*="delete" i],:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[class*="danger" i],:where(button[id^="sl-eg-"],button[class*="sl-eg-"])[class*="red" i]{background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
@media(max-width:520px){:where([id^="sl-eg-"][id*="panel" i],[id^="sl-eg-"][id*="settings" i],[id^="sl-eg-"][id*="modal" i],[id^="sl-eg-"][id*="details" i]){border-radius:15px!important}:where(button[id^="sl-eg-"],button[class*="sl-eg-"]){min-height:34px!important}}
`;
        (document.head || document.documentElement).appendChild(style);
    }
    installSakaLuXUnifiedTheme_enhancer();

})();
// SAKALUX_INLINE_PANEL_FOOTER_V2
;(() => {
    const FOOTER_ID='sakalux-inline-footer-enhancer-guard';
    const PANEL_SELECTOR='#sl-eg-panel';
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
