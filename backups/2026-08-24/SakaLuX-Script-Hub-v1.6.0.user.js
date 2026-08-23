// ==UserScript==
// @name         SakaLuX Script Hub
// @namespace    sakalux.script.hub
// @version      1.6.0
// @description  Central manager, launcher and health monitor for SakaLuX Torn scripts, with quick actions, favorites, search, backup and mobile/PDA support.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      update.greasyfork.org
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js
// @updateURL https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = '1.6.0';

    const PROFILE_XID = '2380374';

    const PROFILE_URL =
        'https://www.torn.com/profiles.php?XID=' +
        PROFILE_XID;

    const UPDATE_CACHE_TIME =
        24 * 60 * 60 * 1000;

    const STORAGE = {
        settings: 'SakaLuX_HUB_SETTINGS_V16',
        favorites: 'SakaLuX_HUB_FAVORITES_V16',
        usage: 'SakaLuX_HUB_USAGE_V16',
        updates: 'SakaLuX_HUB_UPDATES_V16'
    };

    const DEFAULT_SETTINGS = {
        hideIndividualButtons: true,
        compactMode: false,
        buttonPosition: 'top-right',
        buttonSize: 48,
        longPressQuickMenu: true,
        autoCheckUpdates: true
    };

    const IDS = {
        button: 'sakalux-hub-button',
        badge: 'sakalux-hub-badge',
        overlay: 'sakalux-hub-overlay',
        panel: 'sakalux-hub-panel',
        style: 'sakalux-hub-style'
    };

    const SCRIPTS = [
        {
            id: 'enhancer',
            name: 'Enhancer Guard',
            icon: '🛡️',
            category: 'Inventory',
            expectedVersion: '1.3.1',
            buttonSelector: '#sl-eg-button',
            greasyFork: {
                id: '592698',
                metaUrl: 'https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.user.js'
            },
            api() {
                return window.SakaLuXEnhancerGuard || null;
            },
            fallbackOpen() {
                const button = document.querySelector('#sl-eg-button');
                if (!button) return false;
                button.click();
                return true;
            },
            quickActions: [
                { id: 'open', label: 'OPEN', icon: '🛡️' },
                { id: 'refresh', label: 'REFRESH', icon: '🔄' },
                { id: 'hardRefresh', label: 'HARD', icon: '⚡' }
            ]
        },
        {
            id: 'bazaar',
            name: 'Bazaar Thanker',
            icon: '💬',
            category: 'Trading',
            expectedVersion: '5.2.1',
            buttonSelector: '#sakalux-bt-settings-button',
            greasyFork: {
                id: '592388',
                metaUrl: 'https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.user.js'
            },
            api() {
                return window.SakaLuXBazaarThanker || null;
            },
            fallbackOpen() {
                const button = document.querySelector('#sakalux-bt-settings-button');
                if (!button) return false;
                button.click();
                return true;
            },
            quickActions: [
                { id: 'open', label: 'SETTINGS', icon: '⚙️' },
                { id: 'refresh', label: 'REFRESH', icon: '🔄' },
                { id: 'events', label: 'EVENTS', icon: '📋' }
            ]
        }
    ];

    let settings = loadJson(STORAGE.settings, DEFAULT_SETTINGS);
    settings = { ...DEFAULT_SETTINGS, ...settings };
    let favorites = new Set(loadJson(STORAGE.favorites, []));
    let usage = loadJson(STORAGE.usage, {});
    let updateCache = loadJson(STORAGE.updates, {});
    let search = '';
    let category = 'ALL';
    let observer = null;
    let observerTimer = null;
    let longPressTimer = null;
    let longPressTriggered = false;
    let updateCheckRunning = false;

    function loadJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function saveJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {}
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatAgo(timestamp) {
        if (!timestamp) return 'Never';
        const diff = Date.now() - Number(timestamp);
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Now';
        if (minutes < 60) return minutes + 'm ago';
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + 'h ago';
        return Math.floor(hours / 24) + 'd ago';
    }

    function compareVersions(a, b) {
        const pa = String(a || '0').split('.').map(value => parseInt(value, 10) || 0);
        const pb = String(b || '0').split('.').map(value => parseInt(value, 10) || 0);
        const length = Math.max(pa.length, pb.length);
        for (let i = 0; i < length; i++) {
            const av = pa[i] || 0;
            const bv = pb[i] || 0;
            if (av > bv) return 1;
            if (av < bv) return -1;
        }
        return 0;
    }

    function getInstalledVersion(script) {
        try {
            const api = script.api();
            if (api?.version) return String(api.version);
            const health = api?.health?.();
            if (health?.version) return String(health.version);
        } catch {}
        return String(script.expectedVersion);
    }

    function recordUsage(id) {
        if (!usage[id]) usage[id] = { count: 0, lastUsed: 0 };
        usage[id].count++;
        usage[id].lastUsed = Date.now();
        saveJson(STORAGE.usage, usage);
    }

    function httpGet(url) {
        return new Promise((resolve, reject) => {
            if (typeof window.PDA_httpGet === 'function') {
                window.PDA_httpGet(url, { Accept: 'text/plain' })
                    .then(response => resolve(String(response?.responseText ?? response?.body ?? response ?? '')))
                    .catch(reject);
                return;
            }
            if (window.flutter_inappwebview?.callHandler) {
                window.flutter_inappwebview.callHandler('PDA_httpGet', url, { Accept: 'text/plain' })
                    .then(response => resolve(String(response?.responseText ?? response?.body ?? response ?? '')))
                    .catch(reject);
                return;
            }
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    headers: { Accept: 'text/plain' },
                    timeout: 15000,
                    onload: response => {
                        if (response.status >= 200 && response.status < 400) resolve(response.responseText || '');
                        else reject(new Error('HTTP ' + response.status));
                    },
                    onerror: () => reject(new Error('Network error')),
                    ontimeout: () => reject(new Error('Request timeout'))
                });
                return;
            }
            fetch(url, { cache: 'no-store' })
                .then(response => {
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.text();
                })
                .then(resolve)
                .catch(reject);
        });
    }

    function parseMetaVersion(metaText) {
        const match = String(metaText).match(/^\s*\/\/\s*@version\s+([^\s]+)\s*$/mi);
        return match ? match[1].trim() : null;
    }

    function isUpdateCacheFresh(scriptId) {
        const data = updateCache[scriptId];
        return Boolean(data?.checkedAt && Date.now() - Number(data.checkedAt) < UPDATE_CACHE_TIME);
    }

    async function checkScriptUpdate(script, force = false) {
        if (!force && isUpdateCacheFresh(script.id)) return updateCache[script.id];
        const installed = getInstalledVersion(script);
        try {
            const meta = await httpGet(script.greasyFork.metaUrl);
            const latest = parseMetaVersion(meta);
            if (!latest) throw new Error('No @version found');
            const data = {
                installed,
                latest,
                available: compareVersions(latest, installed) > 0,
                checkedAt: Date.now(),
                error: null
            };
            updateCache[script.id] = data;
            saveJson(STORAGE.updates, updateCache);
            return data;
        } catch (error) {
            const data = {
                installed,
                latest: null,
                available: false,
                checkedAt: Date.now(),
                error: String(error?.message || error)
            };
            updateCache[script.id] = data;
            saveJson(STORAGE.updates, updateCache);
            return data;
        }
    }

    async function checkAllUpdates(force = false) {
        if (updateCheckRunning) return;
        updateCheckRunning = true;
        updateCheckButtonState(true);
        try {
            await Promise.allSettled(SCRIPTS.map(script => checkScriptUpdate(script, force)));
        } finally {
            updateCheckRunning = false;
            updateCheckButtonState(false);
            updateBadge();
            renderList();
            renderMainStats();
        }
    }

    function getUpdateState(script) {
        const data = updateCache[script.id];
        if (!data) return { state: 'unknown', text: 'NOT CHECKED', data: null };
        if (data.error) return { state: 'failed', text: 'CHECK FAILED', data };
        if (data.available) return { state: 'available', text: '⬆ UPDATE AVAILABLE', data };
        return { state: 'current', text: '✓ UP TO DATE', data };
    }

    function getUpdateCount() {
        return SCRIPTS.filter(script => updateCache[script.id]?.available).length;
    }

    function getUpdateErrorCount() {
        return SCRIPTS.filter(script => Boolean(updateCache[script.id]?.error)).length;
    }

    function openUpdate(script) {
        if (script?.greasyFork?.downloadUrl) window.location.href = script.greasyFork.downloadUrl;
    }

    function getHealth(script) {
        const api = script.api();
        if (!api) return { state: 'missing', text: 'NOT LOADED HERE', version: null, data: null };
        try {
            let data = null;
            if (typeof api.health === 'function') data = api.health();
            if (data?.error) return { state: 'error', text: 'ERROR', version: api.version || data.version, data };
            return { state: 'ok', text: 'OK', version: api.version || data?.version || '?', data };
        } catch (error) {
            return {
                state: 'error',
                text: 'ERROR',
                version: api.version || '?',
                data: { error: String(error?.message || error) }
            };
        }
    }

    function getAllHealth() {
        return SCRIPTS.map(script => ({ script, health: getHealth(script) }));
    }

    function updateBadge() {
        const badge = document.getElementById(IDS.badge);
        if (!badge) return;
        const healthErrors = getAllHealth().filter(row => row.health.state === 'error').length;
        const total = healthErrors + getUpdateCount();
        if (total <= 0) {
            badge.style.display = 'none';
            return;
        }
        badge.textContent = String(total);
        badge.style.display = 'flex';
    }

    function injectCss() {
        if (document.getElementById(IDS.style)) return;
        const style = document.createElement('style');
        style.id = IDS.style;
        style.textContent = `
            #${IDS.button}{position:fixed!important;z-index:2147483646!important;border:2px solid #555!important;border-radius:50%!important;background:#171717!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important;font-size:24px!important;box-shadow:0 5px 18px rgba(0,0,0,.6)!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;touch-action:manipulation!important;}
            #${IDS.badge}{position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#ef4444;color:#fff;display:none;align-items:center;justify-content:center;font-size:9px;font-weight:900;border:2px solid #171717;}
            #${IDS.overlay}{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.76);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif;}
            #${IDS.panel}{width:min(600px,100%);max-height:94vh;display:flex;flex-direction:column;overflow:hidden;background:#101318;color:#fff;border-radius:18px 18px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.7);}
            .slh-header{padding:14px;border-bottom:1px solid #292f38;flex-shrink:0;}.slh-headrow{display:flex;align-items:center;justify-content:space-between;gap:8px;}.slh-title{font-size:19px;font-weight:900;}.slh-sub{margin-top:3px;color:#8b949e;font-size:10px;}.slh-close{width:36px;height:36px;border:0;border-radius:9px;background:#252a32;color:#fff;font-size:20px;}.slh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px;}.slh-stat{background:#181d24;border:1px solid #292f38;border-radius:9px;text-align:center;padding:7px 3px;min-width:0;}.slh-stat strong{display:block;font-size:14px;overflow:hidden;text-overflow:ellipsis;}.slh-stat span{display:block;margin-top:2px;color:#8b949e;font-size:8px;}.slh-tools{display:grid;grid-template-columns:1fr auto auto auto;gap:6px;margin-top:9px;}.slh-search{min-width:0;background:#181d24;color:#fff;border:1px solid #303640;border-radius:9px;padding:9px;}.slh-tool{min-width:42px;border:0;border-radius:9px;background:#252a32;color:#fff;font-weight:900;}.slh-tool.checking{opacity:.55;}.slh-cats{display:flex;gap:5px;margin-top:7px;overflow-x:auto;}.slh-cat{flex-shrink:0;background:#181d24;border:1px solid #303640;color:#ddd;border-radius:8px;padding:6px 9px;font-size:9px;font-weight:900;}.slh-cat.active{background:#2563eb;}.slh-list{overflow-y:auto;padding:10px;-webkit-overflow-scrolling:touch;}.slh-card{display:grid;grid-template-columns:40px 1fr;gap:9px;padding:10px;margin-bottom:8px;background:#181d24;border:1px solid #292f38;border-radius:12px;}.slh-card.favorite{box-shadow:0 0 0 1px #fbbf24;}.slh-card.update{border-color:#d97706;}.slh-icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:#252a32;border-radius:10px;font-size:20px;}.slh-name{font-size:13px;font-weight:900;}.slh-star{border:0;background:transparent;color:#fbbf24;font-size:16px;}.slh-meta{margin-top:3px;font-size:9px;color:#8b949e;line-height:1.45;}.slh-health,.slh-update-status{font-weight:900;}.slh-health.ok,.slh-update-status.current{color:#4ade80;}.slh-health.error,.slh-update-status.failed{color:#fb7185;}.slh-health.missing,.slh-update-status.available{color:#fbbf24;}.slh-update-status.unknown{color:#8b949e;}.slh-actions{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px;}.slh-action{border:0;border-radius:7px;background:#2563eb;color:#fff;padding:6px 8px;font-size:9px;font-weight:900;}.slh-action.secondary{background:#374151;}.slh-action.update{background:#d97706;}.slh-bottom{padding:10px;background:#0d1117;border-top:1px solid #292f38;flex-shrink:0;}.slh-bottom-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;}.slh-bottom-btn{border:0;border-radius:9px;padding:9px;background:#252a32;color:#fff;font-size:10px;font-weight:900;}.slh-footer{padding:9px;text-align:center;color:#6b7280;font-size:9px;border-top:1px solid #20252c;flex-shrink:0;}.slh-author{color:#60a5fa;font-weight:900;text-decoration:none;}.slh-settings,.slh-quick{padding:12px;overflow-y:auto;}.slh-setting{background:#181d24;border:1px solid #292f38;border-radius:10px;padding:10px;margin-bottom:8px;font-size:11px;}.slh-setting select,.slh-setting input[type="range"]{width:100%;margin-top:7px;}.slh-big-btn{width:100%;padding:10px;margin-top:6px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900;}.slh-big-btn.gray{background:#374151;}.slh-big-btn.red{background:#8b3030;}.slh-big-btn.update{background:#d97706;}@media(min-width:700px){#${IDS.overlay}{align-items:center;}#${IDS.panel}{border-radius:18px;max-height:88vh;}}
        `;
        document.head.appendChild(style);
    }

    function positionButton() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const size = Math.max(38, Math.min(64, Number(settings.buttonSize) || 48));
        button.style.setProperty('width', size + 'px', 'important');
        button.style.setProperty('height', size + 'px', 'important');
        ['top','bottom','left','right'].forEach(property => button.style.removeProperty(property));
        switch (settings.buttonPosition) {
            case 'middle-right': button.style.setProperty('top','45%','important'); button.style.setProperty('right','12px','important'); break;
            case 'bottom-right': button.style.setProperty('bottom','90px','important'); button.style.setProperty('right','12px','important'); break;
            case 'top-left': button.style.setProperty('top','76px','important'); button.style.setProperty('left','12px','important'); break;
            default: button.style.setProperty('top','76px','important'); button.style.setProperty('right','12px','important');
        }
    }

    function createHubButton() {
        let button = document.getElementById(IDS.button);
        if (!button) {
            button = document.createElement('button');
            button.id = IDS.button;
            button.type = 'button';
            button.innerHTML = `☠️<span id="${IDS.badge}"></span>`;
            document.body.appendChild(button);
            bindMainButton(button);
        }
        positionButton();
        updateBadge();
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
        button.addEventListener('touchend', end);
        button.addEventListener('touchcancel', end);
        button.addEventListener('mousedown', start);
        button.addEventListener('mouseup', end);
        button.addEventListener('mouseleave', end);
        button.addEventListener('click', event => {
            event.preventDefault();
            if (longPressTriggered) { longPressTriggered = false; return; }
            openHub();
        });
    }

    function updateHiddenButtons() {
        for (const script of SCRIPTS) {
            if (!script.buttonSelector) continue;
            document.querySelectorAll(script.buttonSelector).forEach(element => {
                if (settings.hideIndividualButtons) {
                    element.style.setProperty('display','none','important');
                    element.style.setProperty('visibility','hidden','important');
                } else {
                    element.style.removeProperty('display');
                    element.style.removeProperty('visibility');
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
        overlay.onclick = event => { if (event.target === overlay) closeHub(); };
        return overlay;
    }

    function openHub() {
        createOverlay(`
            <div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">☠️ SakaLuX Script Hub</div><div class="slh-sub">v${VERSION} • Greasy Fork Update Manager</div></div><button class="slh-close" id="slh-close">×</button></div><div class="slh-stats" id="slh-stats"></div><div class="slh-tools"><input class="slh-search" id="slh-search" type="search" placeholder="🔎 Search..." value="${escapeHtml(search)}"><button class="slh-tool" id="slh-update-check" title="Check Greasy Fork updates">⬆️</button><button class="slh-tool" id="slh-health" title="Health check">🩺</button><button class="slh-tool" id="slh-settings" title="Settings">⚙️</button></div><div class="slh-cats" id="slh-cats"></div></div>
            <div class="slh-list" id="slh-list"></div>
            <div class="slh-bottom"><div class="slh-bottom-grid"><button class="slh-bottom-btn" id="slh-money">💸 SEND MONEY</button><button class="slh-bottom-btn" id="slh-items">🎁 SEND ITEMS</button></div></div>
            <div class="slh-footer">Made with ❤️ by <a class="slh-author" id="slh-author" href="${PROFILE_URL}">SakaLuX [2380374]</a></div>
        `);
        document.getElementById('slh-close').onclick = closeHub;
        document.getElementById('slh-search').oninput = function () { search = this.value.trim().toLowerCase(); renderList(); };
        document.getElementById('slh-update-check').onclick = () => checkAllUpdates(true);
        document.getElementById('slh-health').onclick = () => { updateBadge(); renderMainStats(); renderList(); };
        document.getElementById('slh-settings').onclick = openSettings;
        document.getElementById('slh-money').onclick = () => { location.href = PROFILE_URL; };
        document.getElementById('slh-items').onclick = () => { location.href = PROFILE_URL; };
        document.getElementById('slh-author').onclick = event => { event.preventDefault(); location.href = PROFILE_URL; };
        renderMainStats(); renderCategories(); renderList(); updateCheckButtonState(updateCheckRunning);
        if (settings.autoCheckUpdates) checkAllUpdates(false);
    }

    function renderMainStats() {
        const stats = document.getElementById('slh-stats');
        if (!stats) return;
        const rows = getAllHealth();
        const loaded = rows.filter(row => row.health.state !== 'missing').length;
        const errors = rows.filter(row => row.health.state === 'error').length;
        const updates = getUpdateCount();
        const updateErrors = getUpdateErrorCount();
        stats.innerHTML = `<div class="slh-stat"><strong>${loaded}/${SCRIPTS.length}</strong><span>LOADED</span></div><div class="slh-stat"><strong>${rows.filter(row => row.health.state === 'ok').length}</strong><span>HEALTHY</span></div><div class="slh-stat"><strong>${updates}</strong><span>UPDATES</span></div><div class="slh-stat"><strong>${errors + updateErrors}</strong><span>ISSUES</span></div>`;
    }

    function updateCheckButtonState(loading) {
        const button = document.getElementById('slh-update-check');
        if (!button) return;
        button.disabled = Boolean(loading);
        button.classList.toggle('checking', Boolean(loading));
        button.textContent = loading ? '⏳' : '⬆️';
    }

    function renderCategories() {
        const box = document.getElementById('slh-cats');
        if (!box) return;
        const categories = ['ALL', ...new Set(SCRIPTS.map(script => script.category))];
        box.innerHTML = categories.map(value => `<button class="slh-cat ${category === value ? 'active' : ''}" data-category="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join('');
        box.querySelectorAll('[data-category]').forEach(button => { button.onclick = () => { category = button.dataset.category; renderCategories(); renderList(); }; });
    }

    function renderList() {
        const list = document.getElementById('slh-list');
        if (!list) return;
        let rows = getAllHealth().map(row => ({ ...row, favorite: favorites.has(row.script.id), usage: usage[row.script.id] || { count:0,lastUsed:0 }, update: getUpdateState(row.script) }));
        rows = rows.filter(row => {
            if (category !== 'ALL' && row.script.category !== category) return false;
            if (search && !(row.script.name + ' ' + row.script.category).toLowerCase().includes(search)) return false;
            return true;
        });
        rows.sort((a,b) => {
            if (a.update.state === 'available' && b.update.state !== 'available') return -1;
            if (b.update.state === 'available' && a.update.state !== 'available') return 1;
            if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
            return b.usage.count - a.usage.count;
        });
        list.innerHTML = rows.map(renderCard).join('') || `<div style="padding:30px;text-align:center;color:#888;">No scripts found.</div>`;
        bindCards();
    }

    function renderCard(row) {
        const script = row.script;
        const health = row.health;
        const update = row.update;
        const installed = getInstalledVersion(script);
        const latest = update.data?.latest || '?';
        let extra = '';
        if (script.id === 'enhancer' && health.data) extra = ` • Inventory: ${health.data.inventoryEntries ?? 0}`;
        else if (script.id === 'bazaar' && health.data) extra = ` • Buyers: ${health.data.buyers ?? 0}`;
        return `<div class="slh-card ${row.favorite ? 'favorite' : ''} ${update.state === 'available' ? 'update' : ''}"><div class="slh-icon">${script.icon}</div><div><div class="slh-name">${escapeHtml(script.name)} <button class="slh-star" data-fav="${escapeHtml(script.id)}">${row.favorite ? '★' : '☆'}</button></div><div class="slh-meta">Installed: <b>v${escapeHtml(installed)}</b> • Latest: <b>${latest === '?' ? '?' : 'v'+escapeHtml(latest)}</b><br><span class="slh-update-status ${update.state}">${escapeHtml(update.text)}</span>${update.data?.checkedAt ? ' • Checked '+escapeHtml(formatAgo(update.data.checkedAt)) : ''}<br>Health: <span class="slh-health ${health.state}">${escapeHtml(health.text)}</span>${extra}<br>Used: ${row.usage.count} • ${escapeHtml(formatAgo(row.usage.lastUsed))}</div><div class="slh-actions">${update.state === 'available' ? `<button class="slh-action update" data-update="${escapeHtml(script.id)}">⬆ UPDATE</button>` : ''}${script.quickActions.map(action => `<button class="slh-action ${action.id === 'open' ? '' : 'secondary'}" data-script="${escapeHtml(script.id)}" data-action="${escapeHtml(action.id)}">${action.icon} ${action.label}</button>`).join('')}</div></div></div>`;
    }

    function bindCards() {
        document.querySelectorAll('[data-fav]').forEach(button => { button.onclick = event => { event.stopPropagation(); const id = button.dataset.fav; favorites.has(id) ? favorites.delete(id) : favorites.add(id); saveJson(STORAGE.favorites,[...favorites]); renderList(); }; });
        document.querySelectorAll('[data-update]').forEach(button => { button.onclick = () => { const script = SCRIPTS.find(item => item.id === button.dataset.update); if (script) openUpdate(script); }; });
        document.querySelectorAll('[data-script][data-action]').forEach(button => { button.onclick = () => runAction(button.dataset.script, button.dataset.action); });
    }

    async function runAction(id, action) {
        const script = SCRIPTS.find(item => item.id === id);
        if (!script) return;
        const api = script.api();
        try {
            if (action === 'events') {
                recordUsage(id);
                if (api?.goToEvents) api.goToEvents();
                else location.href = 'https://www.torn.com/page.php?sid=events';
                return;
            }
            if (api && typeof api[action] === 'function') {
                recordUsage(id); await api[action]();
                if (action === 'open') closeHub(); else setTimeout(openHub,100);
                return;
            }
            if (action === 'open' && script.fallbackOpen()) { recordUsage(id); closeHub(); return; }
            alert(script.name + ' is not available on this page.');
        } catch (error) {
            console.error('[SakaLuX Hub]',error);
            alert('Action failed: ' + String(error?.message || error));
        }
    }

    function openQuickMenu() {
        const rows = getAllHealth();
        createOverlay(`<div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">☠️ Quick Menu</div><div class="slh-sub">Long-press shortcuts</div></div><button class="slh-close" id="slhq-close">×</button></div></div><div class="slh-quick">${rows.map(row => { const update=getUpdateState(row.script); return `<button class="slh-big-btn ${update.state === 'available' ? 'update' : ''}" data-quick-open="${row.script.id}">${row.script.icon} ${escapeHtml(row.script.name)} • ${escapeHtml(row.health.text)}</button>${update.state === 'available' ? `<button class="slh-big-btn update" data-quick-update="${row.script.id}">⬆ UPDATE TO v${escapeHtml(update.data.latest)}</button>` : ''}`; }).join('')}<button class="slh-big-btn gray" id="slhq-full">☠️ OPEN FULL HUB</button></div>`);
        document.getElementById('slhq-close').onclick = closeHub;
        document.getElementById('slhq-full').onclick = openHub;
        document.querySelectorAll('[data-quick-open]').forEach(button => { button.onclick = () => runAction(button.dataset.quickOpen,'open'); });
        document.querySelectorAll('[data-quick-update]').forEach(button => { button.onclick = () => { const script=SCRIPTS.find(item=>item.id===button.dataset.quickUpdate); if(script) openUpdate(script); }; });
    }

    function openSettings() {
        createOverlay(`<div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">⚙️ Hub Settings</div><div class="slh-sub">SakaLuX Script Hub v${VERSION}</div></div><button class="slh-close" id="slhs-close">×</button></div></div><div class="slh-settings"><div class="slh-setting"><label><input id="slhs-hide" type="checkbox" ${settings.hideIndividualButtons ? 'checked' : ''}> Hide individual script buttons</label></div><div class="slh-setting"><label><input id="slhs-long" type="checkbox" ${settings.longPressQuickMenu ? 'checked' : ''}> Long press ☠️ opens Quick Menu</label></div><div class="slh-setting"><label><input id="slhs-auto-updates" type="checkbox" ${settings.autoCheckUpdates ? 'checked' : ''}> Automatically check Greasy Fork updates</label><div style="margin-top:5px;color:#8b949e;font-size:9px;">Automatic checks use a 24-hour cache.</div></div><div class="slh-setting">Button position<select id="slhs-position"><option value="top-right">Top right</option><option value="middle-right">Middle right</option><option value="bottom-right">Bottom right</option><option value="top-left">Top left</option></select></div><div class="slh-setting">Button size: <b id="slhs-size-label">${settings.buttonSize}px</b><input id="slhs-size" type="range" min="38" max="64" step="2" value="${settings.buttonSize}"></div><button class="slh-big-btn" id="slhs-save">💾 SAVE SETTINGS</button><button class="slh-big-btn update" id="slhs-check">⬆ CHECK UPDATES NOW</button><button class="slh-big-btn gray" id="slhs-backup">📤 BACKUP</button><button class="slh-big-btn gray" id="slhs-restore">📥 RESTORE</button><button class="slh-big-btn red" id="slhs-reset">🧹 RESET HUB</button><button class="slh-big-btn gray" id="slhs-back">← BACK</button></div>`);
        const position=document.getElementById('slhs-position'); position.value=settings.buttonPosition;
        const size=document.getElementById('slhs-size'); size.oninput=function(){document.getElementById('slhs-size-label').textContent=this.value+'px';};
        document.getElementById('slhs-close').onclick=closeHub;
        document.getElementById('slhs-back').onclick=openHub;
        document.getElementById('slhs-save').onclick=()=>{settings.hideIndividualButtons=document.getElementById('slhs-hide').checked;settings.longPressQuickMenu=document.getElementById('slhs-long').checked;settings.autoCheckUpdates=document.getElementById('slhs-auto-updates').checked;settings.buttonPosition=position.value;settings.buttonSize=Number(size.value);saveJson(STORAGE.settings,settings);updateHiddenButtons();positionButton();openHub();};
        document.getElementById('slhs-check').onclick=async()=>{await checkAllUpdates(true);openHub();};
        document.getElementById('slhs-backup').onclick=backupSettings;
        document.getElementById('slhs-restore').onclick=restoreSettings;
        document.getElementById('slhs-reset').onclick=resetHub;
    }

    async function backupSettings() {
        const text=JSON.stringify({app:'SakaLuX Script Hub',version:VERSION,created:Date.now(),settings,favorites:[...favorites],usage});
        try { await navigator.clipboard.writeText(text); alert('Hub backup copied to clipboard.'); }
        catch { prompt('Copy this backup:',text); }
    }

    function restoreSettings() {
        const raw=prompt('Paste SakaLuX Hub backup:'); if(!raw)return;
        try { const data=JSON.parse(raw); if(data.app!=='SakaLuX Script Hub')throw new Error('Invalid backup'); settings={...DEFAULT_SETTINGS,...(data.settings||{})}; favorites=new Set(Array.isArray(data.favorites)?data.favorites:[]); usage=data.usage&&typeof data.usage==='object'?data.usage:{}; saveJson(STORAGE.settings,settings); saveJson(STORAGE.favorites,[...favorites]); saveJson(STORAGE.usage,usage); updateHiddenButtons(); positionButton(); alert('Backup restored.'); openHub(); }
        catch { alert('Invalid Hub backup.'); }
    }

    function resetHub() {
        if(!confirm('Reset only SakaLuX Script Hub settings?'))return;
        localStorage.removeItem(STORAGE.settings); localStorage.removeItem(STORAGE.favorites); localStorage.removeItem(STORAGE.usage); localStorage.removeItem(STORAGE.updates); settings={...DEFAULT_SETTINGS}; favorites=new Set(); usage={}; updateCache={}; updateHiddenButtons(); positionButton(); updateBadge(); openHub();
    }

    function ensureEverything() { injectCss(); createHubButton(); updateHiddenButtons(); updateBadge(); }
    function queueEnsure() { if(observerTimer)clearTimeout(observerTimer); observerTimer=setTimeout(()=>{observerTimer=null;ensureEverything();},400); }
    function startObserver() { if(observer)return; observer=new MutationObserver(mutations=>{for(const mutation of mutations){if(mutation.addedNodes.length){queueEnsure();break;}}}); observer.observe(document.body,{childList:true,subtree:true}); }

    window.addEventListener('SakaLuX:EnhancerGuardReady',()=>{queueEnsure();renderList();});
    window.addEventListener('SakaLuX:BazaarThankerReady',()=>{queueEnsure();renderList();});

    function init() {
        ensureEverything();
        setTimeout(ensureEverything,1000);
        setTimeout(ensureEverything,3000);
        startObserver();
        if(settings.autoCheckUpdates)setTimeout(()=>checkAllUpdates(false),1500);
        console.log('[SakaLuX Script Hub v'+VERSION+'] Loaded.');
    }

    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
    else init();
})();