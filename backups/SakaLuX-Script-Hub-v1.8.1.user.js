// ==UserScript==
// @name         SakaLuX Script Hub
// @namespace    sakalux.script.hub
// @version      1.8.1
// @description  Central manager, installer, updater and health monitor for SakaLuX Torn add-ons with scripts.json auto-discovery, What's New, update-all and system diagnostics.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      update.greasyfork.org
// @connect      raw.githubusercontent.com
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js
// @updateURL https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = '1.8.1';
    const PROFILE_XID = '2380374';
    const PROFILE_URL = 'https://www.torn.com/profiles.php?XID=' + PROFILE_XID;
    const REGISTRY_URL = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/scripts.json';
    const UPDATE_CACHE_TIME = 24 * 60 * 60 * 1000;

    // WHAT'S NEW belongs to the Hub itself, not to scripts.json.
    const HUB_CHANGELOG = [
        {
            version: '1.8.1',
            date: '2026-08-24',
            changes: [
                "Fixed the WHAT'S NEW button so it is visible and usable on mobile/PDA.",
                'Removed Hub release information from scripts.json.',
                'scripts.json is now used only as the add-on registry.',
                'Kept UPDATE ALL, SYSTEM CHECK and automatic add-on discovery.'
            ]
        },
        {
            version: '1.8.0',
            date: '2026-08-24',
            changes: [
                'Added central scripts.json add-on discovery.',
                'Added UPDATE ALL for installed add-ons with available updates.',
                'Added SYSTEM CHECK diagnostics.',
                'Added the global SakaLuXScriptHub API for reliable Hub detection.'
            ]
        }
    ];

    const STORAGE = {
        settings: 'SakaLuX_HUB_SETTINGS_V16',
        favorites: 'SakaLuX_HUB_FAVORITES_V16',
        usage: 'SakaLuX_HUB_USAGE_V16',
        updates: 'SakaLuX_HUB_UPDATES_V16',
        registry: 'SakaLuX_HUB_REGISTRY_V18'
    };

    const DEFAULT_SETTINGS = {
        hideIndividualButtons: true,
        buttonPosition: 'top-right',
        buttonSize: 48,
        longPressQuickMenu: true,
        autoCheckUpdates: true
    };

    // Only add-ons are kept here as an offline fallback.
    const FALLBACK_REGISTRY = {
        scripts: [
            {
                id: 'enhancer', type: 'addon', active: true, name: 'Enhancer Guard', icon: '🛡️', category: 'Inventory', version: '1.3.2',
                description: 'Advanced Enhancer inventory tracker for Torn PDA / Tampermonkey.',
                greasyForkId: '592698',
                metaUrl: 'https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.user.js',
                apiGlobal: 'SakaLuXEnhancerGuard', buttonSelector: '#sl-eg-button',
                quickActions: [
                    { id: 'open', label: 'OPEN', icon: '🛡️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' },
                    { id: 'hardRefresh', label: 'HARD', icon: '⚡', method: 'hardRefresh' }
                ]
            },
            {
                id: 'bazaar', type: 'addon', active: true, name: 'Bazaar Thanker', icon: '💬', category: 'Trading', version: '5.3.1',
                description: 'Bazaar buyer grouping, thank-you messages, statistics and history management.',
                greasyForkId: '592388',
                metaUrl: 'https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.user.js',
                apiGlobal: 'SakaLuXBazaarThanker', buttonSelector: '#sakalux-bt-settings-button',
                quickActions: [
                    { id: 'open', label: 'SETTINGS', icon: '⚙️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' },
                    { id: 'events', label: 'EVENTS', icon: '📋', method: 'goToEvents', fallbackUrl: 'https://www.torn.com/page.php?sid=events' }
                ]
            }
        ]
    };

    const IDS = {
        button: 'sakalux-hub-button', badge: 'sakalux-hub-badge', overlay: 'sakalux-hub-overlay',
        panel: 'sakalux-hub-panel', style: 'sakalux-hub-style'
    };

    let registry = loadJson(STORAGE.registry, FALLBACK_REGISTRY);
    let SCRIPTS = normalizeRegistry(registry);
    let settings = { ...DEFAULT_SETTINGS, ...loadJson(STORAGE.settings, DEFAULT_SETTINGS) };
    let favorites = new Set(loadJson(STORAGE.favorites, []));
    let usage = loadJson(STORAGE.usage, {});
    let updateCache = loadJson(STORAGE.updates, {});
    let search = '';
    let category = 'ALL';
    let registryStatus = 'cached';
    let updateCheckRunning = false;
    let observer = null;
    let observerTimer = null;
    let longPressTimer = null;
    let longPressTriggered = false;

    function loadJson(key, fallback) {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
    }
    function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
    function escapeHtml(value) {
        return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function formatAgo(timestamp) {
        if (!timestamp) return 'Never';
        const diff = Date.now() - Number(timestamp);
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Now';
        if (minutes < 60) return minutes + 'm ago';
        const hours = Math.floor(minutes / 60);
        return hours < 24 ? hours + 'h ago' : Math.floor(hours / 24) + 'd ago';
    }
    function compareVersions(a, b) {
        const pa = String(a || '0').split('.').map(v => parseInt(v, 10) || 0);
        const pb = String(b || '0').split('.').map(v => parseInt(v, 10) || 0);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            if ((pa[i] || 0) > (pb[i] || 0)) return 1;
            if ((pa[i] || 0) < (pb[i] || 0)) return -1;
        }
        return 0;
    }

    function normalizeRegistry(data) {
        const rows = Array.isArray(data?.scripts) ? data.scripts : FALLBACK_REGISTRY.scripts;
        return rows.filter(s => s?.active !== false).map(s => ({
            ...s,
            expectedVersion: String(s.version || '0'),
            quickActions: Array.isArray(s.quickActions) ? s.quickActions : [],
            api() {
                try { return s.apiGlobal ? window[s.apiGlobal] || null : null; } catch { return null; }
            },
            fallbackOpen() {
                if (!s.buttonSelector) return false;
                const button = document.querySelector(s.buttonSelector);
                if (!button) return false;
                button.click();
                return true;
            }
        }));
    }

    function httpGet(url) {
        return new Promise((resolve, reject) => {
            if (typeof window.PDA_httpGet === 'function') {
                window.PDA_httpGet(url, { Accept: 'text/plain' })
                    .then(r => resolve(String(r?.responseText ?? r?.body ?? r ?? ''))).catch(reject);
                return;
            }
            if (window.flutter_inappwebview?.callHandler) {
                window.flutter_inappwebview.callHandler('PDA_httpGet', url, { Accept: 'text/plain' })
                    .then(r => resolve(String(r?.responseText ?? r?.body ?? r ?? ''))).catch(reject);
                return;
            }
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method: 'GET', url, headers: { Accept: 'text/plain' }, timeout: 15000,
                    onload: r => r.status >= 200 && r.status < 400 ? resolve(r.responseText || '') : reject(new Error('HTTP ' + r.status)),
                    onerror: () => reject(new Error('Network error')),
                    ontimeout: () => reject(new Error('Request timeout'))
                });
                return;
            }
            fetch(url, { cache: 'no-store' })
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
                .then(resolve).catch(reject);
        });
    }

    async function loadRegistry(force = false) {
        try {
            const raw = await httpGet(REGISTRY_URL + (force ? '?t=' + Date.now() : ''));
            const data = JSON.parse(raw);
            if (!Array.isArray(data?.scripts)) throw new Error('Invalid registry');
            registry = data;
            SCRIPTS = normalizeRegistry(data);
            registryStatus = 'online';
            saveJson(STORAGE.registry, data);
            updateHiddenButtons(); updateBadge(); renderCategories(); renderList(); renderMainStats();
            return true;
        } catch (error) {
            console.warn('[SakaLuX Hub] Registry fallback:', error);
            registryStatus = 'fallback';
            if (!Array.isArray(registry?.scripts)) registry = FALLBACK_REGISTRY;
            SCRIPTS = normalizeRegistry(registry);
            return false;
        }
    }

    function parseMetaVersion(text) {
        const match = String(text).match(/^\s*\/\/\s*@version\s+([^\s]+)\s*$/mi);
        return match ? match[1].trim() : null;
    }
    function getInstalledVersion(script) {
        try {
            const api = script.api();
            if (!api) return null;
            if (api.version) return String(api.version);
            const h = api.health?.();
            return h?.version ? String(h.version) : null;
        } catch { return null; }
    }
    function recordUsage(id) {
        if (!usage[id]) usage[id] = { count: 0, lastUsed: 0 };
        usage[id].count++;
        usage[id].lastUsed = Date.now();
        saveJson(STORAGE.usage, usage);
    }
    function isUpdateCacheFresh(id) {
        const data = updateCache[id];
        return Boolean(data?.checkedAt && Date.now() - Number(data.checkedAt) < UPDATE_CACHE_TIME);
    }

    async function checkScriptUpdate(script, force = false) {
        if (!force && isUpdateCacheFresh(script.id)) return updateCache[script.id];
        const installed = getInstalledVersion(script);
        try {
            const latest = parseMetaVersion(await httpGet(script.metaUrl));
            if (!latest) throw new Error('No @version found');
            const data = { installed, latest, available: Boolean(installed && compareVersions(latest, installed) > 0), checkedAt: Date.now(), error: null };
            updateCache[script.id] = data;
            saveJson(STORAGE.updates, updateCache);
            return data;
        } catch (error) {
            const data = { installed, latest: null, available: false, checkedAt: Date.now(), error: String(error?.message || error) };
            updateCache[script.id] = data;
            saveJson(STORAGE.updates, updateCache);
            return data;
        }
    }

    async function checkAllUpdates(force = false) {
        if (updateCheckRunning) return;
        updateCheckRunning = true;
        updateCheckButtonState(true);
        try { await Promise.allSettled(SCRIPTS.map(s => checkScriptUpdate(s, force))); }
        finally {
            updateCheckRunning = false;
            updateCheckButtonState(false);
            updateBadge(); renderList(); renderMainStats();
        }
    }

    function getUpdateState(script) {
        const installed = getInstalledVersion(script);
        const data = updateCache[script.id];
        if (!installed) return { state: 'missing', text: '⬇ ADD-ON NOT INSTALLED', data: data || null };
        if (!data) return { state: 'unknown', text: 'NOT CHECKED', data: null };
        if (data.error) return { state: 'failed', text: 'CHECK FAILED', data };
        if (data.available) return { state: 'available', text: '⬆ UPDATE AVAILABLE', data };
        return { state: 'current', text: '✓ UP TO DATE', data };
    }
    function getUpdateCount() { return SCRIPTS.filter(s => getInstalledVersion(s) && updateCache[s.id]?.available).length; }
    function getUpdateErrorCount() { return SCRIPTS.filter(s => updateCache[s.id]?.error).length; }
    function getMissingCount() { return SCRIPTS.filter(s => !s.api()).length; }
    function openInstall(script) { if (script?.downloadUrl) location.href = script.downloadUrl; }

    function getHealth(script) {
        const api = script.api();
        if (!api) return { state: 'missing', text: 'NOT INSTALLED', version: null, data: null };
        try {
            const data = typeof api.health === 'function' ? api.health() : null;
            if (data?.error) return { state: 'error', text: 'ERROR', version: api.version || data.version || '?', data };
            return { state: 'ok', text: 'INSTALLED', version: api.version || data?.version || '?', data };
        } catch (error) {
            return { state: 'error', text: 'ERROR', version: api.version || '?', data: { error: String(error?.message || error) } };
        }
    }
    function getAllHealth() { return SCRIPTS.map(script => ({ script, health: getHealth(script) })); }

    function injectCss() {
        if (document.getElementById(IDS.style)) return;
        const style = document.createElement('style');
        style.id = IDS.style;
        style.textContent = `
#${IDS.button}{position:fixed!important;z-index:2147483646!important;border:2px solid #555!important;border-radius:50%!important;background:#171717!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important;font-size:24px!important;box-shadow:0 5px 18px rgba(0,0,0,.6)!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;touch-action:manipulation!important}
#${IDS.badge}{position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#ef4444;color:#fff;display:none;align-items:center;justify-content:center;font-size:9px;font-weight:900;border:2px solid #171717}
#${IDS.overlay}{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.76);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}
#${IDS.panel}{width:min(620px,100%);max-height:94vh;display:flex;flex-direction:column;overflow:hidden;background:#101318;color:#fff;border-radius:18px 18px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.7)}
.slh-header{padding:14px;border-bottom:1px solid #292f38;flex-shrink:0}.slh-headrow{display:flex;align-items:center;justify-content:space-between;gap:8px}.slh-title{font-size:19px;font-weight:900}.slh-sub{margin-top:3px;color:#8b949e;font-size:10px}.slh-close{width:36px;height:36px;border:0;border-radius:9px;background:#252a32;color:#fff;font-size:20px}
.slh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.slh-stat{background:#181d24;border:1px solid #292f38;border-radius:9px;text-align:center;padding:7px 3px}.slh-stat strong{display:block;font-size:14px}.slh-stat span{display:block;margin-top:2px;color:#8b949e;font-size:8px}
.slh-tools{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:9px}.slh-search{grid-column:1/-1;min-width:0;background:#181d24;color:#fff;border:1px solid #303640;border-radius:9px;padding:9px}.slh-tool{height:42px;border:0;border-radius:9px;background:#252a32;color:#fff;font-size:16px;font-weight:900}.slh-tool.checking{opacity:.55}.slh-tool.whatsnew{background:#5b3a86}
.slh-cats{display:flex;gap:5px;margin-top:7px;overflow-x:auto}.slh-cat{flex-shrink:0;background:#181d24;border:1px solid #303640;color:#ddd;border-radius:8px;padding:6px 9px;font-size:9px;font-weight:900}.slh-cat.active{background:#2563eb}
.slh-list,.slh-view,.slh-settings,.slh-quick{overflow-y:auto;padding:10px;-webkit-overflow-scrolling:touch}.slh-card{display:grid;grid-template-columns:40px 1fr;gap:9px;padding:10px;margin-bottom:8px;background:#181d24;border:1px solid #292f38;border-radius:12px}.slh-card.favorite{box-shadow:0 0 0 1px #fbbf24}.slh-card.update{border-color:#d97706}.slh-card.missing{border-color:#475569}.slh-icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:#252a32;border-radius:10px;font-size:20px}.slh-name{font-size:13px;font-weight:900}.slh-star{border:0;background:transparent;color:#fbbf24;font-size:16px}.slh-meta{margin-top:3px;font-size:9px;color:#8b949e;line-height:1.5}.slh-health,.slh-update-status{font-weight:900}.slh-health.ok,.slh-update-status.current,.slh-check-ok{color:#4ade80}.slh-health.error,.slh-update-status.failed,.slh-check-bad{color:#fb7185}.slh-health.missing,.slh-update-status.available,.slh-check-warn{color:#fbbf24}.slh-update-status.missing,.slh-update-status.unknown{color:#94a3b8}
.slh-actions{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.slh-action{border:0;border-radius:7px;background:#2563eb;color:#fff;padding:6px 8px;font-size:9px;font-weight:900}.slh-action.secondary{background:#374151}.slh-action.update{background:#d97706}.slh-action.install{background:#16a34a}.slh-bottom{padding:10px;background:#0d1117;border-top:1px solid #292f38;flex-shrink:0}.slh-bottom-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.slh-bottom-btn{border:0;border-radius:9px;padding:9px;background:#252a32;color:#fff;font-size:10px;font-weight:900}.slh-footer{padding:9px;text-align:center;color:#6b7280;font-size:9px;border-top:1px solid #20252c}.slh-author{color:#60a5fa;font-weight:900;text-decoration:none}
.slh-setting,.slh-note,.slh-check-row{background:#181d24;border:1px solid #292f38;border-radius:10px;padding:10px;margin-bottom:8px;font-size:11px;line-height:1.5}.slh-setting select,.slh-setting input[type=range]{width:100%;margin-top:7px}.slh-big-btn{width:100%;padding:10px;margin-top:6px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900}.slh-big-btn.gray{background:#374151}.slh-big-btn.red{background:#8b3030}.slh-big-btn.update{background:#d97706}.slh-big-btn.install{background:#16a34a}.slh-version-title{font-size:13px;font-weight:900;margin-bottom:5px}.slh-version-date{color:#8b949e;font-size:9px;margin-left:5px}
@media(min-width:700px){#${IDS.overlay}{align-items:center}#${IDS.panel}{border-radius:18px;max-height:88vh}.slh-tools{grid-template-columns:1fr repeat(5,44px)}.slh-search{grid-column:auto}}
`;
        document.head.appendChild(style);
    }

    function positionButton() {
        const button = document.getElementById(IDS.button); if (!button) return;
        const size = Math.max(38, Math.min(64, Number(settings.buttonSize) || 48));
        button.style.setProperty('width', size + 'px', 'important');
        button.style.setProperty('height', size + 'px', 'important');
        ['top','bottom','left','right'].forEach(p => button.style.removeProperty(p));
        if (settings.buttonPosition === 'middle-right') { button.style.setProperty('top','45%','important'); button.style.setProperty('right','12px','important'); }
        else if (settings.buttonPosition === 'bottom-right') { button.style.setProperty('bottom','90px','important'); button.style.setProperty('right','12px','important'); }
        else if (settings.buttonPosition === 'top-left') { button.style.setProperty('top','76px','important'); button.style.setProperty('left','12px','important'); }
        else { button.style.setProperty('top','76px','important'); button.style.setProperty('right','12px','important'); }
    }

    function createHubButton() {
        let button = document.getElementById(IDS.button);
        if (!button) {
            button = document.createElement('button'); button.id = IDS.button; button.type = 'button';
            button.innerHTML = `☠️<span id="${IDS.badge}"></span>`;
            document.body.appendChild(button); bindMainButton(button);
        }
        positionButton(); updateBadge();
    }
    function bindMainButton(button) {
        const start = () => {
            longPressTriggered = false;
            if (!settings.longPressQuickMenu) return;
            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => { longPressTriggered = true; openQuickMenu(); }, 650);
        };
        const end = () => clearTimeout(longPressTimer);
        button.addEventListener('touchstart', start, { passive: true });
        button.addEventListener('touchend', end); button.addEventListener('touchcancel', end);
        button.addEventListener('mousedown', start); button.addEventListener('mouseup', end); button.addEventListener('mouseleave', end);
        button.addEventListener('click', e => { e.preventDefault(); if (longPressTriggered) { longPressTriggered = false; return; } openHub(); });
    }

    function updateBadge() {
        const badge = document.getElementById(IDS.badge); if (!badge) return;
        const total = getAllHealth().filter(r => r.health.state === 'error').length + getUpdateCount() + getMissingCount();
        badge.style.display = total > 0 ? 'flex' : 'none';
        if (total > 0) badge.textContent = String(total);
    }
    function updateHiddenButtons() {
        for (const script of SCRIPTS) {
            if (!script.buttonSelector) continue;
            document.querySelectorAll(script.buttonSelector).forEach(el => {
                if (settings.hideIndividualButtons) {
                    el.style.setProperty('display','none','important'); el.style.setProperty('visibility','hidden','important');
                } else {
                    el.style.removeProperty('display'); el.style.removeProperty('visibility');
                }
            });
        }
    }

    function closeHub() { document.getElementById(IDS.overlay)?.remove(); }
    function createOverlay(content) {
        closeHub();
        const overlay = document.createElement('div');
        overlay.id = IDS.overlay;
        overlay.innerHTML = `<div id="${IDS.panel}">${content}</div>`;
        document.body.appendChild(overlay);
        overlay.onclick = e => { if (e.target === overlay) closeHub(); };
        return overlay;
    }

    function openHub() {
        createOverlay(`
            <div class="slh-header">
                <div class="slh-headrow">
                    <div><div class="slh-title">☠️ SakaLuX Script Hub</div><div class="slh-sub">v${VERSION} • Registry: ${escapeHtml(registryStatus)} • ${SCRIPTS.length} add-ons</div></div>
                    <button class="slh-close" id="slh-close">×</button>
                </div>
                <div class="slh-stats" id="slh-stats"></div>
                <div class="slh-tools">
                    <input class="slh-search" id="slh-search" type="search" placeholder="🔎 Search..." value="${escapeHtml(search)}">
                    <button class="slh-tool" id="slh-update-check" title="Check updates">⬆️</button>
                    <button class="slh-tool" id="slh-update-all" title="Update all">⏫</button>
                    <button class="slh-tool" id="slh-health" title="System check">🩺</button>
                    <button class="slh-tool whatsnew" id="slh-whats-new" title="What's new">✨</button>
                    <button class="slh-tool" id="slh-settings" title="Settings">⚙️</button>
                </div>
                <div class="slh-cats" id="slh-cats"></div>
            </div>
            <div class="slh-list" id="slh-list"></div>
            <div class="slh-bottom"><div class="slh-bottom-grid"><button class="slh-bottom-btn" id="slh-money">💸 SEND MONEY</button><button class="slh-bottom-btn" id="slh-items">🎁 SEND ITEMS</button></div></div>
            <div class="slh-footer">Made with ❤️ by <a class="slh-author" id="slh-author" href="${PROFILE_URL}">SakaLuX [2380374]</a></div>
        `);

        document.getElementById('slh-close').onclick = closeHub;
        document.getElementById('slh-search').oninput = function () { search = this.value.trim().toLowerCase(); renderList(); };
        document.getElementById('slh-update-check').onclick = () => checkAllUpdates(true);
        document.getElementById('slh-update-all').onclick = updateAll;
        document.getElementById('slh-health').onclick = openSystemCheck;
        document.getElementById('slh-whats-new').onclick = openWhatsNew;
        document.getElementById('slh-settings').onclick = openSettings;
        document.getElementById('slh-money').onclick = () => location.href = PROFILE_URL;
        document.getElementById('slh-items').onclick = () => location.href = PROFILE_URL;
        document.getElementById('slh-author').onclick = e => { e.preventDefault(); location.href = PROFILE_URL; };
        renderMainStats(); renderCategories(); renderList(); updateCheckButtonState(updateCheckRunning);
        if (settings.autoCheckUpdates) checkAllUpdates(false);
    }

    function renderMainStats() {
        const box = document.getElementById('slh-stats'); if (!box) return;
        const rows = getAllHealth();
        const installed = rows.filter(r => r.health.state !== 'missing').length;
        const healthy = rows.filter(r => r.health.state === 'ok').length;
        const errors = rows.filter(r => r.health.state === 'error').length;
        box.innerHTML = `<div class="slh-stat"><strong>${installed}/${SCRIPTS.length}</strong><span>ADD-ONS</span></div><div class="slh-stat"><strong>${healthy}</strong><span>INSTALLED</span></div><div class="slh-stat"><strong>${getUpdateCount()}</strong><span>UPDATES</span></div><div class="slh-stat"><strong>${errors + getUpdateErrorCount()}</strong><span>ISSUES</span></div>`;
    }
    function updateCheckButtonState(loading) {
        const button = document.getElementById('slh-update-check'); if (!button) return;
        button.disabled = Boolean(loading); button.classList.toggle('checking', Boolean(loading)); button.textContent = loading ? '⏳' : '⬆️';
    }
    function renderCategories() {
        const box = document.getElementById('slh-cats'); if (!box) return;
        const cats = ['ALL', ...new Set(SCRIPTS.map(s => s.category || 'Other'))];
        box.innerHTML = cats.map(v => `<button class="slh-cat ${category === v ? 'active' : ''}" data-category="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('');
        box.querySelectorAll('[data-category]').forEach(b => b.onclick = () => { category = b.dataset.category; renderCategories(); renderList(); });
    }
    function renderList() {
        const list = document.getElementById('slh-list'); if (!list) return;
        let rows = getAllHealth().map(r => ({ ...r, favorite: favorites.has(r.script.id), usage: usage[r.script.id] || { count: 0, lastUsed: 0 }, update: getUpdateState(r.script) }));
        rows = rows.filter(r => (category === 'ALL' || r.script.category === category) && (!search || (r.script.name + ' ' + r.script.category + ' ' + (r.script.description || '')).toLowerCase().includes(search)));
        rows.sort((a,b) => {
            if (a.health.state === 'missing' && b.health.state !== 'missing') return -1;
            if (b.health.state === 'missing' && a.health.state !== 'missing') return 1;
            if (a.update.state === 'available' && b.update.state !== 'available') return -1;
            if (b.update.state === 'available' && a.update.state !== 'available') return 1;
            if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
            return b.usage.count - a.usage.count;
        });
        list.innerHTML = rows.map(renderCard).join('') || '<div style="padding:30px;text-align:center;color:#888">No scripts found.</div>';
        bindCards();
    }
    function renderCard(row) {
        const s = row.script, h = row.health, u = row.update;
        const installed = getInstalledVersion(s), latest = u.data?.latest || s.expectedVersion || '?', missing = h.state === 'missing';
        let extra = '';
        if (s.id === 'enhancer' && h.data) extra = ` • Inventory: ${h.data.inventoryEntries ?? 0}`;
        if (s.id === 'bazaar' && h.data) extra = (h.data.onEvents || h.data.onMessages) ? ` • Buyers: ${h.data.buyers ?? 0}` : ' • Standby on this page';
        const actions = missing
            ? `<button class="slh-action install" data-install="${escapeHtml(s.id)}">⬇ INSTALL</button>`
            : `${u.state === 'available' ? `<button class="slh-action update" data-update="${escapeHtml(s.id)}">⬆ UPDATE</button>` : ''}${s.quickActions.map(a => `<button class="slh-action ${a.id === 'open' ? '' : 'secondary'}" data-script="${escapeHtml(s.id)}" data-action="${escapeHtml(a.id)}">${a.icon || '▶'} ${escapeHtml(a.label || a.id)}</button>`).join('')}`;
        return `<div class="slh-card ${row.favorite ? 'favorite' : ''} ${u.state === 'available' ? 'update' : ''} ${missing ? 'missing' : ''}"><div class="slh-icon">${s.icon || '🧩'}</div><div><div class="slh-name">${escapeHtml(s.name)} <button class="slh-star" data-fav="${escapeHtml(s.id)}">${row.favorite ? '★' : '☆'}</button></div><div class="slh-meta">Installed: <b>${installed ? 'v' + escapeHtml(installed) : 'NOT INSTALLED'}</b> • Registry: <b>v${escapeHtml(s.expectedVersion)}</b> • Latest: <b>${latest === '?' ? '?' : 'v' + escapeHtml(latest)}</b><br><span class="slh-update-status ${u.state}">${escapeHtml(u.text)}</span>${u.data?.checkedAt ? ' • Checked ' + escapeHtml(formatAgo(u.data.checkedAt)) : ''}<br>Status: <span class="slh-health ${h.state}">${escapeHtml(h.text)}</span>${extra}<br>${s.description ? escapeHtml(s.description) + '<br>' : ''}Used: ${row.usage.count} • ${escapeHtml(formatAgo(row.usage.lastUsed))}</div><div class="slh-actions">${actions}</div></div></div>`;
    }
    function bindCards() {
        document.querySelectorAll('[data-fav]').forEach(b => b.onclick = e => {
            e.stopPropagation(); const id = b.dataset.fav; favorites.has(id) ? favorites.delete(id) : favorites.add(id); saveJson(STORAGE.favorites, [...favorites]); renderList();
        });
        document.querySelectorAll('[data-install]').forEach(b => b.onclick = () => { const s = SCRIPTS.find(x => x.id === b.dataset.install); if (s) openInstall(s); });
        document.querySelectorAll('[data-update]').forEach(b => b.onclick = () => { const s = SCRIPTS.find(x => x.id === b.dataset.update); if (s) openInstall(s); });
        document.querySelectorAll('[data-script][data-action]').forEach(b => b.onclick = () => runAction(b.dataset.script, b.dataset.action));
    }

    async function runAction(id, actionId) {
        const s = SCRIPTS.find(x => x.id === id); if (!s) return;
        const api = s.api(); if (!api) { openInstall(s); return; }
        const action = s.quickActions.find(a => a.id === actionId) || { method: actionId };
        try {
            if (typeof api[action.method] === 'function') {
                recordUsage(id);
                const result = await api[action.method]();
                if (actionId === 'open') {
                    if (result === false && action.fallbackUrl) location.href = action.fallbackUrl;
                    else closeHub();
                } else setTimeout(openHub, 100);
                return;
            }
            if (action.fallbackUrl) { recordUsage(id); location.href = action.fallbackUrl; return; }
            if (actionId === 'open' && s.fallbackOpen()) { recordUsage(id); closeHub(); return; }
            alert(s.name + ' is not available on this page.');
        } catch (error) {
            console.error('[SakaLuX Hub]', error); alert('Action failed: ' + String(error?.message || error));
        }
    }

    async function updateAll() {
        await checkAllUpdates(true);
        const updates = SCRIPTS.filter(s => getInstalledVersion(s) && updateCache[s.id]?.available && s.downloadUrl);
        if (!updates.length) { alert('All installed SakaLuX add-ons are up to date.'); return; }
        if (!confirm('Open ' + updates.length + ' update installer' + (updates.length === 1 ? '' : 's') + ' now?')) return;
        let opened = 0;
        for (const s of updates) {
            try { const w = window.open(s.downloadUrl, '_blank'); if (w) opened++; } catch {}
        }
        if (opened < updates.length) alert('Some installer tabs were blocked. Use the individual UPDATE buttons for the remaining add-ons.');
    }

    function openWhatsNew() {
        createOverlay(`
            <div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">✨ WHAT'S NEW</div><div class="slh-sub">SakaLuX Script Hub release notes</div></div><button class="slh-close" id="slhn-close">×</button></div></div>
            <div class="slh-view">
                ${HUB_CHANGELOG.map(release => `<div class="slh-note"><div class="slh-version-title">v${escapeHtml(release.version)} <span class="slh-version-date">${escapeHtml(release.date)}</span></div>${release.changes.map(c => `<div>• ${escapeHtml(c)}</div>`).join('')}</div>`).join('')}
                <button class="slh-big-btn" id="slhn-back">← BACK</button>
            </div>
        `);
        document.getElementById('slhn-close').onclick = closeHub;
        document.getElementById('slhn-back').onclick = openHub;
    }

    async function openSystemCheck() {
        createOverlay(`<div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">🩺 SYSTEM CHECK</div><div class="slh-sub">Checking registry, Greasy Fork and add-ons...</div></div><button class="slh-close" id="slhc-close">×</button></div></div><div class="slh-view" id="slhc-results"><div class="slh-note">⏳ Running diagnostics...</div></div>`);
        document.getElementById('slhc-close').onclick = closeHub;
        const results = [];
        try {
            const data = JSON.parse(await httpGet(REGISTRY_URL + '?check=' + Date.now()));
            results.push({ level: Array.isArray(data?.scripts) ? 'ok' : 'bad', label: 'scripts.json registry', detail: Array.isArray(data?.scripts) ? data.scripts.length + ' add-ons found' : 'Invalid registry' });
        } catch (e) {
            results.push({ level: 'bad', label: 'scripts.json registry', detail: String(e?.message || e) });
        }
        for (const s of SCRIPTS) {
            try {
                const latest = parseMetaVersion(await httpGet(s.metaUrl));
                results.push({ level: latest ? 'ok' : 'warn', label: s.name + ' update source', detail: latest ? 'Greasy Fork v' + latest : 'No version found' });
            } catch (e) {
                results.push({ level: 'bad', label: s.name + ' update source', detail: String(e?.message || e) });
            }
            const h = getHealth(s);
            results.push({ level: h.state === 'ok' ? 'ok' : h.state === 'missing' ? 'warn' : 'bad', label: s.name + ' local status', detail: h.state === 'missing' ? 'Not installed' : h.state === 'ok' ? 'Installed v' + h.version : String(h.data?.error || 'Error') });
        }
        results.push({ level: 'ok', label: 'SakaLuX Script Hub', detail: 'Loaded v' + VERSION + ' • API exposed' });
        const box = document.getElementById('slhc-results'); if (!box) return;
        box.innerHTML = results.map(r => `<div class="slh-check-row slh-check-${r.level}">${r.level === 'ok' ? '🟢' : r.level === 'warn' ? '🟠' : '🔴'} <b>${escapeHtml(r.label)}</b><br><span style="color:#9ca3af">${escapeHtml(r.detail)}</span></div>`).join('') + `<button class="slh-big-btn" id="slhc-back">← BACK</button>`;
        document.getElementById('slhc-back').onclick = openHub;
    }

    function openQuickMenu() {
        const rows = getAllHealth();
        createOverlay(`<div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">☠️ Quick Menu</div><div class="slh-sub">Installed add-ons and one-tap install</div></div><button class="slh-close" id="slhq-close">×</button></div></div><div class="slh-quick">${rows.map(r => { const u = getUpdateState(r.script); if (r.health.state === 'missing') return `<button class="slh-big-btn install" data-quick-install="${r.script.id}">⬇ INSTALL ${r.script.icon || '🧩'} ${escapeHtml(r.script.name)}</button>`; return `<button class="slh-big-btn ${u.state === 'available' ? 'update' : ''}" data-quick-open="${r.script.id}">${r.script.icon || '🧩'} ${escapeHtml(r.script.name)} • ${escapeHtml(r.health.text)}</button>${u.state === 'available' ? `<button class="slh-big-btn update" data-quick-update="${r.script.id}">⬆ UPDATE TO v${escapeHtml(u.data.latest)}</button>` : ''}`; }).join('')}<button class="slh-big-btn gray" id="slhq-full">☠️ OPEN FULL HUB</button></div>`);
        document.getElementById('slhq-close').onclick = closeHub; document.getElementById('slhq-full').onclick = openHub;
        document.querySelectorAll('[data-quick-install]').forEach(b => b.onclick = () => { const s = SCRIPTS.find(x => x.id === b.dataset.quickInstall); if (s) openInstall(s); });
        document.querySelectorAll('[data-quick-open]').forEach(b => b.onclick = () => runAction(b.dataset.quickOpen, 'open'));
        document.querySelectorAll('[data-quick-update]').forEach(b => b.onclick = () => { const s = SCRIPTS.find(x => x.id === b.dataset.quickUpdate); if (s) openInstall(s); });
    }

    function openSettings() {
        createOverlay(`<div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">⚙️ Hub Settings</div><div class="slh-sub">SakaLuX Script Hub v${VERSION}</div></div><button class="slh-close" id="slhs-close">×</button></div></div><div class="slh-settings"><div class="slh-setting"><label><input id="slhs-hide" type="checkbox" ${settings.hideIndividualButtons ? 'checked' : ''}> Hide individual script buttons</label></div><div class="slh-setting"><label><input id="slhs-long" type="checkbox" ${settings.longPressQuickMenu ? 'checked' : ''}> Long press ☠️ opens Quick Menu</label></div><div class="slh-setting"><label><input id="slhs-auto" type="checkbox" ${settings.autoCheckUpdates ? 'checked' : ''}> Automatically check Greasy Fork updates</label></div><div class="slh-setting">Button position<select id="slhs-position"><option value="top-right">Top right</option><option value="middle-right">Middle right</option><option value="bottom-right">Bottom right</option><option value="top-left">Top left</option></select></div><div class="slh-setting">Button size: <b id="slhs-size-label">${settings.buttonSize}px</b><input id="slhs-size" type="range" min="38" max="64" step="2" value="${settings.buttonSize}"></div><button class="slh-big-btn" id="slhs-save">💾 SAVE SETTINGS</button><button class="slh-big-btn gray" id="slhs-registry">🔄 REFRESH scripts.json</button><button class="slh-big-btn update" id="slhs-check">⬆ CHECK UPDATES NOW</button><button class="slh-big-btn gray" id="slhs-backup">📤 BACKUP</button><button class="slh-big-btn gray" id="slhs-restore">📥 RESTORE</button><button class="slh-big-btn red" id="slhs-reset">🧹 RESET HUB</button><button class="slh-big-btn gray" id="slhs-back">← BACK</button></div>`);
        const pos = document.getElementById('slhs-position'), size = document.getElementById('slhs-size');
        pos.value = settings.buttonPosition;
        size.oninput = function () { document.getElementById('slhs-size-label').textContent = this.value + 'px'; };
        document.getElementById('slhs-close').onclick = closeHub; document.getElementById('slhs-back').onclick = openHub;
        document.getElementById('slhs-save').onclick = () => {
            settings.hideIndividualButtons = document.getElementById('slhs-hide').checked;
            settings.longPressQuickMenu = document.getElementById('slhs-long').checked;
            settings.autoCheckUpdates = document.getElementById('slhs-auto').checked;
            settings.buttonPosition = pos.value; settings.buttonSize = Number(size.value);
            saveJson(STORAGE.settings, settings); updateHiddenButtons(); positionButton(); openHub();
        };
        document.getElementById('slhs-registry').onclick = async () => { await loadRegistry(true); openSettings(); };
        document.getElementById('slhs-check').onclick = async () => { await checkAllUpdates(true); openHub(); };
        document.getElementById('slhs-backup').onclick = backupSettings;
        document.getElementById('slhs-restore').onclick = restoreSettings;
        document.getElementById('slhs-reset').onclick = resetHub;
    }

    async function backupSettings() {
        const text = JSON.stringify({ app: 'SakaLuX Script Hub', version: VERSION, created: Date.now(), settings, favorites: [...favorites], usage });
        try { await navigator.clipboard.writeText(text); alert('Hub backup copied to clipboard.'); }
        catch { prompt('Copy this backup:', text); }
    }
    function restoreSettings() {
        const raw = prompt('Paste SakaLuX Hub backup:'); if (!raw) return;
        try {
            const d = JSON.parse(raw); if (d.app !== 'SakaLuX Script Hub') throw new Error();
            settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
            favorites = new Set(Array.isArray(d.favorites) ? d.favorites : []);
            usage = d.usage && typeof d.usage === 'object' ? d.usage : {};
            saveJson(STORAGE.settings, settings); saveJson(STORAGE.favorites, [...favorites]); saveJson(STORAGE.usage, usage);
            updateHiddenButtons(); positionButton(); alert('Backup restored.'); openHub();
        } catch { alert('Invalid Hub backup.'); }
    }
    function resetHub() {
        if (!confirm('Reset only SakaLuX Script Hub settings?')) return;
        Object.values(STORAGE).forEach(k => localStorage.removeItem(k));
        settings = { ...DEFAULT_SETTINGS }; favorites = new Set(); usage = {}; updateCache = {};
        registry = FALLBACK_REGISTRY; SCRIPTS = normalizeRegistry(registry);
        updateHiddenButtons(); positionButton(); updateBadge(); openHub();
    }

    function ensureEverything() { injectCss(); createHubButton(); updateHiddenButtons(); updateBadge(); }
    function queueEnsure() {
        if (observerTimer) clearTimeout(observerTimer);
        observerTimer = setTimeout(() => { observerTimer = null; ensureEverything(); }, 400);
    }
    function startObserver() {
        if (observer) return;
        observer = new MutationObserver(ms => { if (ms.some(m => m.addedNodes.length)) queueEnsure(); });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    window.SakaLuXScriptHub = {
        id: 'script-hub', name: 'SakaLuX Script Hub', version: VERSION, ready: true,
        open: () => { openHub(); return true; },
        refresh: async () => { await loadRegistry(true); await checkAllUpdates(true); return true; },
        health: () => ({ ready: true, version: VERSION, registryStatus, addOns: SCRIPTS.length, installed: SCRIPTS.filter(s => s.api()).length, updates: getUpdateCount() })
    };
    window.dispatchEvent(new CustomEvent('SakaLuX:ScriptHubReady', { detail: { version: VERSION } }));
    window.addEventListener('SakaLuX:EnhancerGuardReady', () => { queueEnsure(); renderList(); renderMainStats(); });
    window.addEventListener('SakaLuX:BazaarThankerReady', () => { queueEnsure(); renderList(); renderMainStats(); });

    async function init() {
        ensureEverything(); startObserver(); await loadRegistry(false);
        setTimeout(ensureEverything, 1000); setTimeout(ensureEverything, 3000);
        if (settings.autoCheckUpdates) setTimeout(() => checkAllUpdates(false), 1500);
        console.log('[SakaLuX Script Hub v' + VERSION + '] Loaded.');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
