// ==UserScript==
// @name         SakaLuX Script Hub
// @namespace    sakalux.script.hub
// @version      1.9.2
// @description  Professional TornPDA control center for SakaLuX add-ons with clean module cards, persistent slide switches and one-tap panel access.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      update.greasyfork.org
// @connect      raw.githubusercontent.com
// @connect      api.torn.com
// @license      All Rights Reserved
// @downloadURL https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js
// @updateURL https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.meta.js
// ==/UserScript==

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

    const VERSION = '1.9.2';
    const PROFILE_XID = '2380374';
    const PROFILE_URL = 'https://www.torn.com/profiles.php?XID=' + PROFILE_XID;
    const REGISTRY_URL = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/scripts.json';
    const SHARED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Script%20Hub&user=basic,money,travel,equipment,inventory,battlestats,ammo&torn=items,elimination,eliminationteam&market=itemmarket';
    const UPDATE_CACHE_TIME = 24 * 60 * 60 * 1000;

    const HUB_CHANGELOG = [
        {
            version: '1.9.1',
            date: '2026-09-10',
            changes: [
                'Made scripts.json the canonical minimum version so Latest can never fall behind Registry.',
                'Invalidates update cache whenever a registry version changes.',
                'Uses the current GitHub userscript source when the Greasy Fork mirror is behind, preventing downgrades.',
                'Synchronized the offline fallback registry and added automated cross-file version checks.'
            ]
        },
        {
            version: '1.9.0',
            date: '2026-09-10',
            changes: [
                'Redesigned the Hub as a cleaner professional TornPDA control center.',
                'Replaced every module action cluster with one persistent ON/OFF slide switch and one OPEN or SETTINGS button.',
                'Removed favorite, refresh, scan, calibration, key and navigation buttons from module cards.',
                'All managed add-ons now use the same native setEnabled, toggleEnabled and isEnabled power API.',
                'Added one shared Hub Torn API key with a general key creator; installed add-ons automatically prefer it while retaining standalone key support.',
                'Kept update, diagnostics and management tools in the Hub header instead of repeating them on every card.'
            ]
        },
        {
            version: '1.8.6',
            date: '2026-08-24',
            changes: [
                'Fixed false UPDATE AVAILABLE states caused by cached checks from an older installed add-on version.',
                'Cached update data is now fresh only when its recorded installed version still matches the version currently loaded.',
                'Update cards, counters and HUB alert badge now recalculate availability from Latest versus Installed before rendering.',
                'Added Market Intelligence v1.1.1 to the offline fallback registry and its ready-event integration.'
            ]
        },
        {
            version: '1.8.4',
            date: '2026-08-24',
            changes: [
                'Rebuilt the mobile HUB entry using Torn mobileLink, area-row and swiper classes like native navigation entries.',
                'HUB is mounted as its own swiper slide immediately before Messages instead of inside the Messages slot.',
                'The skull reuses Torn native SVG sizing and colors, replacing only the icon artwork.',
                'Removed custom layout sizing that made HUB look detached from the Torn navigation row.',
                'Kept the subtle skull blink and Hub click action without moving the label or surrounding menu.'
            ]
        },
        {
            version: '1.8.3',
            date: '2026-08-24',
            changes: [
                'Rebuilt the Hub launcher as a native Torn navigation item before Messages.',
                'The floating Hub button automatically hides when the native launcher is available.'
            ]
        },
        {
            version: '1.8.2',
            date: '2026-08-24',
            changes: [
                'Added the first animated skull launcher experiment.',
                'Added Mission Rewards v1.0.2 to the offline fallback registry.'
            ]
        }
    ];

    const STORAGE = {
        settings: 'SakaLuX_HUB_SETTINGS_V16',
        favorites: 'SakaLuX_HUB_FAVORITES_V16',
        usage: 'SakaLuX_HUB_USAGE_V16',
        updates: 'SakaLuX_HUB_UPDATES_V16',
        registry: 'SakaLuX_HUB_REGISTRY_V18',
        modulePower: 'SakaLuX_HUB_MODULE_POWER_V19',
        apiKey: 'SakaLuX_HUB_TORN_API_KEY'
    };

    const DEFAULT_SETTINGS = {
        hideIndividualButtons: true,
        buttonPosition: 'top-right',
        buttonSize: 48,
        longPressQuickMenu: true,
        autoCheckUpdates: true,
        showTopbarSkull: true
    };

    const FALLBACK_REGISTRY = {
        scripts: [
            {
                id: 'enhancer', type: 'addon', active: true,
                name: 'Enhancer Guard', icon: '🛡️', category: 'Inventory', version: '1.3.13',
                description: 'Advanced Enhancer inventory tracker for Torn PDA / Tampermonkey.',
                greasyForkId: '592698',
                metaUrl: 'https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Enhancer-Guard.user.js',
                apiGlobal: 'SakaLuXEnhancerGuard', buttonSelector: '#sl-eg-button',
                quickActions: [
                    { id: 'open', label: 'OPEN', icon: '🛡️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' },
                    { id: 'hardRefresh', label: 'HARD', icon: '⚡', method: 'hardRefresh' }
                ]
            },
            {
                id: 'bazaar', type: 'addon', active: true,
                name: 'Bazaar Thanker', icon: '💬', category: 'Trading', version: '5.3.3',
                description: 'Bazaar buyer grouping, thank-you messages, statistics and history management.',
                greasyForkId: '592388',
                metaUrl: 'https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Thanker-PDA.user.js',
                apiGlobal: 'SakaLuXBazaarThanker', buttonSelector: '#sakalux-bt-settings-button',
                quickActions: [
                    { id: 'open', label: 'SETTINGS', icon: '⚙️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' },
                    { id: 'events', label: 'EVENTS', icon: '📋', method: 'goToEvents', fallbackUrl: 'https://www.torn.com/page.php?sid=events' }
                ]
            },
            {
                id: 'mission-rewards', type: 'addon', active: true,
                name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.0.3',
                description: 'Mission Shop reward values, value per credit, ammo ownership and weapon mod tracking.',
                greasyForkId: '592711',
                metaUrl: 'https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Mission-Rewards.user.js',
                apiGlobal: 'SakaLuXMissionRewards', buttonSelector: '#sl-mri-button',
                quickActions: [
                    { id: 'open', label: 'SETTINGS', icon: '⚙️', method: 'open', fallbackUrl: 'https://www.torn.com/page.php?sid=missions' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh', fallbackUrl: 'https://www.torn.com/page.php?sid=missions' },
                    { id: 'missions', label: 'MISSIONS', icon: '🎯', method: 'goToMissions', fallbackUrl: 'https://www.torn.com/page.php?sid=missions' }
                ]
            },
            {
                id: 'market-intelligence', type: 'addon', active: true,
                name: 'Market Intelligence', icon: '📈', category: 'Trading', version: '1.17.1',
                description: 'Market and travel intelligence with clickable Best Travel Run routes, stock/restock ETA, Bazaar deals, Item Market watchlist, Items, Museum and Points Market support.',
                greasyForkId: '592781',
                metaUrl: 'https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Market-Intelligence.user.js',
                apiGlobal: 'SakaLuXMarketIntelligence', buttonSelector: '#sl-mi-button',
                quickActions: [
                    { id: 'open', label: 'SETTINGS', icon: '⚙️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' },
                    { id: 'best-run', label: 'BEST RUN', icon: '✈️', method: 'goToBestRun', fallbackUrl: 'https://www.torn.com/page.php?sid=travel' },
                    { id: 'market', label: 'MARKET', icon: '📈', method: 'goToMarket', fallbackUrl: 'https://www.torn.com/page.php?sid=ItemMarket' }
                ]
            },
            {
                id: 'elimination-assistant', type: 'addon', active: true,
                name: 'Elimination Assistant', icon: '⚔️', category: 'Combat', version: '1.3.7',
                description: 'Eliminations advisor with rotating target batches, availability status and TornPDA export.',
                greasyForkId: '594921',
                metaUrl: 'https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Elimination-Assistant.user.js',
                apiGlobal: 'SakaLuXEliminationAssistant', buttonSelector: '#slx-elim-btn',
                quickActions: [
                    { id: 'open', label: 'OPEN', icon: '⚔️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' }
                ]
            }
        ]
    };

    const IDS = {
        button: 'sakalux-hub-button',
        badge: 'sakalux-hub-badge',
        topSkull: 'sakalux-hub-top-skull',
        topBadge: 'sakalux-hub-top-badge',
        overlay: 'sakalux-hub-overlay',
        panel: 'sakalux-hub-panel',
        style: 'sakalux-hub-style'
    };

    let registry = loadJson(STORAGE.registry, FALLBACK_REGISTRY);
    let SCRIPTS = normalizeRegistry(registry);
    let settings = { ...DEFAULT_SETTINGS, ...loadJson(STORAGE.settings, DEFAULT_SETTINGS) };
    let favorites = new Set(loadJson(STORAGE.favorites, []));
    let usage = loadJson(STORAGE.usage, {});
    let updateCache = loadJson(STORAGE.updates, {});
    let modulePower = loadJson(STORAGE.modulePower, {});
    let category = 'ALL';
    let registryStatus = 'cached';
    let updateCheckRunning = false;
    let observer = null;
    let observerTimer = null;
    let longPressTimer = null;
    let longPressTriggered = false;

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

    function getSharedApiKey() {
        try { return (localStorage.getItem(STORAGE.apiKey) || '').trim(); }
        catch { return ''; }
    }

    function setSharedApiKey(value) {
        const key = String(value || '').trim();
        try {
            if (key) localStorage.setItem(STORAGE.apiKey, key);
            else localStorage.removeItem(STORAGE.apiKey);
        } catch {}
        window.dispatchEvent(new CustomEvent('SakaLuX:HubApiKeyChanged', { detail: { available: Boolean(key) } }));
        return Boolean(key);
    }

    async function testSharedApiKey(key = getSharedApiKey()) {
        if (!key) throw new Error('Paste or create the shared Torn API key first.');
        const raw = await httpGet('https://api.torn.com/v2/user/battlestats?key=' + encodeURIComponent(key));
        const data = JSON.parse(String(raw || '{}'));
        if (data?.error) throw new Error(data.error.error || data.error.message || 'Torn rejected the API key.');
        return true;
    }

    function createSharedApiKey() {
        try { sessionStorage.setItem('SakaLuX_HUB_API_SETUP_PENDING', '1'); } catch {}
        location.href = SHARED_API_KEY_URL;
        return true;
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

    function canonicalLatestVersion(script, publishedVersion) {
        const registryVersion = String(script?.expectedVersion || script?.version || '0');
        const published = publishedVersion ? String(publishedVersion) : null;
        return published && compareVersions(published, registryVersion) > 0 ? published : registryVersion;
    }

    function getInstallUrl(script) {
        const data = normalizeCachedUpdate(script);
        if (data?.distributionBehind && script.sourceUrl) return script.sourceUrl;
        return script.downloadUrl || script.sourceUrl || '';
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
                    .then(r => { const body = r?.responseText ?? r?.body ?? r?.data ?? r ?? ''; resolve(typeof body === 'string' ? body : JSON.stringify(body)); })
                    .catch(reject);
                return;
            }
            if (window.flutter_inappwebview?.callHandler) {
                window.flutter_inappwebview.callHandler('PDA_httpGet', url, { Accept: 'text/plain' })
                    .then(r => { const body = r?.responseText ?? r?.body ?? r?.data ?? r ?? ''; resolve(typeof body === 'string' ? body : JSON.stringify(body)); })
                    .catch(reject);
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
                .then(resolve)
                .catch(reject);
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
            updateHiddenButtons();
            updateBadge();
            renderCategories();
            renderList();
            renderMainStats();
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
            const health = api.health?.();
            return health?.version ? String(health.version) : null;
        } catch {
            return null;
        }
    }

    function recordUsage(id) {
        if (!usage[id]) usage[id] = { count: 0, lastUsed: 0 };
        usage[id].count++;
        usage[id].lastUsed = Date.now();
        saveJson(STORAGE.usage, usage);
    }

    function isUpdateCacheFresh(script) {
        const data = updateCache[script.id];
        const installed = getInstalledVersion(script);
        return Boolean(
            data?.checkedAt &&
            Date.now() - Number(data.checkedAt) < UPDATE_CACHE_TIME &&
            String(data.installed || '') === String(installed || '') &&
            String(data.expected || '') === String(script.expectedVersion || '')
        );
    }

    function normalizeCachedUpdate(script) {
        const data = updateCache[script.id];
        if (!data) return null;
        const installed = getInstalledVersion(script);
        const publishedLatest = data.publishedLatest ? String(data.publishedLatest) : (data.latest ? String(data.latest) : null);
        const latest = canonicalLatestVersion(script, publishedLatest);
        const distributionBehind = Boolean(publishedLatest && compareVersions(publishedLatest, script.expectedVersion) < 0);
        const available = Boolean(installed && latest && compareVersions(latest, installed) > 0);
        if (String(data.installed || '') !== String(installed || '') || String(data.latest || '') !== latest || String(data.expected || '') !== String(script.expectedVersion || '') || Boolean(data.available) !== available || Boolean(data.distributionBehind) !== distributionBehind) {
            updateCache[script.id] = { ...data, installed, expected: script.expectedVersion, publishedLatest, latest, distributionBehind, available };
            saveJson(STORAGE.updates, updateCache);
        }
        return updateCache[script.id];
    }

    async function checkScriptUpdate(script, force = false) {
        if (!force && isUpdateCacheFresh(script)) return normalizeCachedUpdate(script);
        const installed = getInstalledVersion(script);
        let publishedLatest = null;
        let sourceError = null;
        try {
            publishedLatest = parseMetaVersion(await httpGet(script.metaUrl));
            if (!publishedLatest) throw new Error('No @version found');
        } catch (error) {
            sourceError = String(error?.message || error);
        }
        const latest = canonicalLatestVersion(script, publishedLatest);
        const distributionBehind = Boolean(publishedLatest && compareVersions(publishedLatest, script.expectedVersion) < 0);
        const data = {
            installed,
            expected: script.expectedVersion,
            publishedLatest,
            latest,
            distributionBehind,
            available: Boolean(installed && compareVersions(latest, installed) > 0),
            checkedAt: Date.now(),
            sourceError,
            error: null
        };
        updateCache[script.id] = data;
        saveJson(STORAGE.updates, updateCache);
        return data;
    }

    async function checkAllUpdates(force = false) {
        if (updateCheckRunning) return;
        updateCheckRunning = true;
        updateCheckButtonState(true);
        try {
            await Promise.allSettled(SCRIPTS.map(s => checkScriptUpdate(s, force)));
        } finally {
            updateCheckRunning = false;
            updateCheckButtonState(false);
            updateBadge();
            renderList();
            renderMainStats();
        }
    }

    function getUpdateState(script) {
        const installed = getInstalledVersion(script);
        const data = normalizeCachedUpdate(script);
        if (!installed) return { state: 'missing', text: '⬇ ADD-ON NOT INSTALLED', data: data || null };
        if (!data) return { state: 'unknown', text: 'NOT CHECKED', data: null };
        if (data.error) return { state: 'failed', text: 'CHECK FAILED', data };
        if (data.available) return { state: 'available', text: '⬆ UPDATE AVAILABLE', data };
        return { state: 'current', text: '✓ UP TO DATE', data };
    }

    function getUpdateCount() {
        return SCRIPTS.filter(script => Boolean(normalizeCachedUpdate(script)?.available)).length;
    }

    function getUpdateErrorCount() {
        return SCRIPTS.filter(s => updateCache[s.id]?.error).length;
    }

    function getMissingCount() {
        return SCRIPTS.filter(s => !s.api()).length;
    }

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

    function getAllHealth() {
        return SCRIPTS.map(script => ({ script, health: getHealth(script) }));
    }

    function getPrimaryAction(script) {
        const actions = Array.isArray(script.quickActions) ? script.quickActions : [];
        return actions.find(action => action.id === 'open')
            || actions.find(action => action.id === 'settings' || /settings/i.test(action.label || ''))
            || actions.find(action => action.method === 'open')
            || { id: 'open', label: 'OPEN', icon: '↗', method: 'open' };
    }

    function isModuleEnabled(script) {
        const api = script.api();
        try {
            if (api && typeof api.isEnabled === 'function') return api.isEnabled() !== false;
            const health = api && typeof api.health === 'function' ? api.health() : null;
            if (typeof health?.enabled === 'boolean') return health.enabled;
        } catch {}
        return Object.prototype.hasOwnProperty.call(modulePower, script.id) ? modulePower[script.id] !== false : true;
    }

    async function setModulePower(id, enabled) {
        const script = SCRIPTS.find(item => item.id === id);
        if (!script) return false;
        const api = script.api();
        if (!api || typeof api.setEnabled !== 'function' || typeof api.isEnabled !== 'function') {
            throw new Error('Update ' + script.name + ' to the latest version to use its ON/OFF switch.');
        }
        await api.setEnabled(Boolean(enabled));
        modulePower[id] = Boolean(enabled);
        saveJson(STORAGE.modulePower, modulePower);
        updateHiddenButtons();
        renderList();
        renderMainStats();
        return true;
    }

    function getIssueCount() {
        return getAllHealth().filter(row => row.health.state === 'error').length + getUpdateCount() + getMissingCount();
    }

    function injectCss() {
        if (document.getElementById(IDS.style)) return;
        const style = document.createElement('style');
        style.id = IDS.style;
        style.textContent = `
#${IDS.button}{position:fixed!important;z-index:2147483646!important;border:2px solid #555!important;border-radius:50%!important;background:#171717!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important;font-size:24px!important;box-shadow:0 5px 18px rgba(0,0,0,.6)!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;touch-action:manipulation!important}
#${IDS.badge}{position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#ef4444;color:#fff;display:none;align-items:center;justify-content:center;font-size:9px;font-weight:900;border:2px solid #171717}
#${IDS.topSkull}{position:relative!important;box-sizing:border-box!important}
#${IDS.topSkull} .slh-native-link{position:relative!important;cursor:pointer!important;-webkit-tap-highlight-color:transparent!important}
#${IDS.topSkull} .slh-native-skull-icon{animation:slhNativeSkullBlink 2.45s ease-in-out infinite!important;transform-origin:center center!important}
#${IDS.topSkull}.slh-alert .slh-native-skull-icon{animation:slhNativeSkullAlert .92s ease-in-out infinite!important}
#${IDS.topBadge}{position:absolute;top:0;right:4px;min-width:14px;height:14px;padding:0 3px;box-sizing:border-box;border-radius:999px;background:#b53b3b;color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:900;line-height:1;z-index:3}
@keyframes slhNativeSkullBlink{0%,8%,16%,24%,32%,100%{opacity:.48}11%,19%,27%{opacity:1}40%,75%{opacity:.72}}
@keyframes slhNativeSkullAlert{0%,100%{opacity:.38}50%{opacity:1}72%{opacity:.58}}
#${IDS.overlay}{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.76);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}
#${IDS.panel}{width:min(620px,100%);max-height:94vh;display:flex;flex-direction:column;overflow:hidden;background:#101318;color:#fff;border-radius:18px 18px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.7)}
.slh-header{padding:14px;border-bottom:1px solid #292f38;flex-shrink:0}.slh-headrow{display:flex;align-items:center;justify-content:space-between;gap:8px}.slh-title{font-size:19px;font-weight:900}.slh-sub{margin-top:3px;color:#8b949e;font-size:10px}.slh-close{width:36px;height:36px;border:0;border-radius:9px;background:#252a32;color:#fff;font-size:20px}
.slh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.slh-stat{background:#181d24;border:1px solid #292f38;border-radius:9px;text-align:center;padding:7px 3px}.slh-stat strong{display:block;font-size:14px}.slh-stat span{display:block;margin-top:2px;color:#8b949e;font-size:8px}
.slh-tools{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:9px}.slh-search{grid-column:1/-1;min-width:0;background:#181d24;color:#fff;border:1px solid #303640;border-radius:9px;padding:9px}.slh-tool{height:42px;border:0;border-radius:9px;background:#252a32;color:#fff;font-size:16px;font-weight:900}.slh-tool.checking{opacity:.55}.slh-tool.whatsnew{background:#5b3a86}
.slh-cats{display:flex;gap:5px;margin-top:7px;overflow-x:auto}.slh-cat{flex-shrink:0;background:#181d24;border:1px solid #303640;color:#ddd;border-radius:8px;padding:6px 9px;font-size:9px;font-weight:900}.slh-cat.active{background:#2563eb}
.slh-list,.slh-view,.slh-settings,.slh-quick{overflow-y:auto;padding:10px;-webkit-overflow-scrolling:touch}.slh-card{display:grid;grid-template-columns:40px 1fr;gap:9px;padding:10px;margin-bottom:8px;background:#181d24;border:1px solid #292f38;border-radius:12px}.slh-card.favorite{box-shadow:0 0 0 1px #fbbf24}.slh-card.update{border-color:#d97706}.slh-card.missing{border-color:#475569}.slh-icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:#252a32;border-radius:10px;font-size:20px}.slh-name{font-size:13px;font-weight:900}.slh-star{border:0;background:transparent;color:#fbbf24;font-size:16px}.slh-meta{margin-top:3px;font-size:9px;color:#8b949e;line-height:1.5}.slh-health,.slh-update-status{font-weight:900}.slh-health.ok,.slh-update-status.current,.slh-check-ok{color:#4ade80}.slh-health.error,.slh-update-status.failed,.slh-check-bad{color:#fb7185}.slh-health.missing,.slh-update-status.available,.slh-check-warn{color:#fbbf24}.slh-update-status.missing,.slh-update-status.unknown{color:#94a3b8}
.slh-actions{display:none}.slh-action{border:0;border-radius:7px;background:#2563eb;color:#fff;padding:6px 8px;font-size:9px;font-weight:900}.slh-action.secondary{background:#374151}.slh-action.update{background:#d97706}.slh-action.install{background:#16a34a}.slh-bottom{padding:10px;background:#0b1016;border-top:1px solid #253041;flex-shrink:0}.slh-bottom-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.slh-bottom-btn{border:1px solid #2c3747;border-radius:10px;padding:10px;background:#17202c;color:#f8fafc;font-size:10px;font-weight:900}.slh-footer{padding:9px;text-align:center;color:#6b7280;font-size:9px;border-top:1px solid #202936;background:#0b1016}.slh-author{color:#60a5fa;font-weight:900;text-decoration:none}
.slh-list{background:linear-gradient(180deg,#0b1119 0%,#0d131c 100%)}.slh-card{grid-template-columns:44px minmax(0,1fr) 96px;gap:10px;align-items:center;padding:12px;margin-bottom:9px;background:linear-gradient(145deg,#161e29,#111821);border:1px solid #2a3646;border-radius:14px;box-shadow:0 5px 16px rgba(0,0,0,.18)}.slh-card.update{border-color:#a86b19;box-shadow:inset 3px 0 #d97706,0 5px 16px rgba(0,0,0,.18)}.slh-card.missing{border-color:#475569}.slh-card.off .slh-card-copy{opacity:.58}.slh-card-copy{min-width:0}.slh-icon{width:42px;height:42px;background:linear-gradient(145deg,#263142,#1b2431);border:1px solid #334155;border-radius:12px;font-size:21px}.slh-name{display:flex;align-items:center;gap:5px;color:#f8fafc;font-size:14px;line-height:1.25}.slh-favorite-mark{color:#fbbf24;font-size:13px}.slh-description{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;color:#aab4c3}.slh-module-controls{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:7px}.slh-switch,.slh-primary{width:100%;min-height:36px;border-radius:10px;font-family:Arial,sans-serif;font-size:10px;font-weight:900;touch-action:manipulation}.slh-switch{display:grid;grid-template-columns:38px 1fr;align-items:center;gap:5px;padding:5px 7px;border:1px solid #475569;background:#111827;color:#94a3b8}.slh-switch-track{position:relative;display:block;width:36px;height:20px;border-radius:999px;background:#4b5563;box-shadow:inset 0 1px 3px rgba(0,0,0,.55);transition:.18s ease}.slh-switch-track i{position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#e5e7eb;box-shadow:0 1px 4px #0008;transition:.18s ease}.slh-switch.on{border-color:#16804b;background:#0d2b20;color:#86efac}.slh-switch.on .slh-switch-track{background:#22c55e}.slh-switch.on .slh-switch-track i{transform:translateX(16px);background:#fff}.slh-switch.off{border-color:#60404a;background:#29151b;color:#fda4af}.slh-switch:disabled{opacity:.5}.slh-primary{border:1px solid #3478d4;background:linear-gradient(180deg,#2f80ed,#1d5fc5);color:#fff;padding:7px}.slh-primary:disabled{border-color:#374151;background:#202733;color:#6b7280}.slh-primary.install{border-color:#16804b;background:linear-gradient(180deg,#1e9b5f,#147443)}
#${IDS.overlay}{background:rgba(2,6,12,.84);backdrop-filter:blur(3px)}#${IDS.panel}{background:#0b1119;border:1px solid #2a3748;box-shadow:0 -16px 55px rgba(0,0,0,.78)}.slh-header{padding:14px;background:linear-gradient(155deg,#151e2a 0%,#0c131d 72%);border-bottom-color:#2a3748}.slh-title{color:#f8fafc;letter-spacing:.01em}.slh-close{border:1px solid #364255;background:#1b2431}.slh-stats{gap:7px}.slh-stat{background:rgba(21,30,42,.88);border-color:#334155}.slh-stat strong{color:#f8fafc}.slh-search{background:#0d1520;border-color:#344258;min-height:42px}.slh-tool{border:1px solid #303c4e;background:#1a2330}.slh-tool.whatsnew{background:linear-gradient(160deg,#67409a,#4c2d77)}.slh-cats{padding-bottom:2px}.slh-cat{background:#101824;border-color:#303d50}.slh-cat.active{background:linear-gradient(180deg,#347ff0,#215fc5);border-color:#4b91f5}.slh-bottom-btn:active,.slh-tool:active,.slh-primary:active,.slh-switch:active{transform:translateY(1px)}
@media(max-width:520px){.slh-header{padding:11px}.slh-title{font-size:17px}.slh-stats{margin-top:8px}.slh-stat{padding:6px 2px}.slh-tools{margin-top:8px}.slh-card{grid-template-columns:40px minmax(0,1fr) 88px;gap:8px;padding:10px 9px}.slh-icon{width:38px;height:38px}.slh-name{font-size:13px}.slh-meta{font-size:8.5px}.slh-module-controls{gap:5px}.slh-switch,.slh-primary{min-height:34px;font-size:9px}.slh-switch{grid-template-columns:34px 1fr;padding:4px 5px}.slh-switch-track{width:32px;height:18px}.slh-switch-track i{width:12px;height:12px}.slh-switch.on .slh-switch-track i{transform:translateX(14px)}}
.slh-setting,.slh-note,.slh-check-row{background:#181d24;border:1px solid #292f38;border-radius:10px;padding:10px;margin-bottom:8px;font-size:11px;line-height:1.5}.slh-setting select,.slh-setting input[type=range],.slh-setting input[type=password]{width:100%;box-sizing:border-box;margin-top:7px}.slh-setting input[type=password]{min-height:40px;padding:9px;border:1px solid #3a4657;border-radius:8px;background:#0d131b;color:#fff}.slh-api-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}.slh-big-btn{width:100%;padding:10px;margin-top:6px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900}.slh-big-btn.gray{background:#374151}.slh-big-btn.red{background:#8b3030}.slh-big-btn.update{background:#d97706}.slh-big-btn.install{background:#16a34a}.slh-version-title{font-size:13px;font-weight:900;margin-bottom:5px}.slh-version-date{color:#8b949e;font-size:9px;margin-left:5px}
@media(min-width:700px){#${IDS.overlay}{align-items:center}#${IDS.panel}{border-radius:18px;max-height:88vh}.slh-tools{grid-template-columns:1fr repeat(5,44px)}.slh-search{grid-column:auto}}
        `;
        document.head.appendChild(style);
    }

    function positionButton() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const size = Math.max(38, Math.min(64, Number(settings.buttonSize) || 48));
        button.style.setProperty('width', size + 'px', 'important');
        button.style.setProperty('height', size + 'px', 'important');
        ['top', 'bottom', 'left', 'right'].forEach(p => button.style.removeProperty(p));
        if (settings.buttonPosition === 'middle-right') {
            button.style.setProperty('top', '45%', 'important');
            button.style.setProperty('right', '12px', 'important');
        } else if (settings.buttonPosition === 'bottom-right') {
            button.style.setProperty('bottom', '90px', 'important');
            button.style.setProperty('right', '12px', 'important');
        } else if (settings.buttonPosition === 'top-left') {
            button.style.setProperty('top', '76px', 'important');
            button.style.setProperty('left', '12px', 'important');
        } else {
            button.style.setProperty('top', '76px', 'important');
            button.style.setProperty('right', '12px', 'important');
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
        syncFloatingButtonVisibility();
    }

    function bindMainButton(button) {
        const start = () => {
            longPressTriggered = false;
            if (!settings.longPressQuickMenu) return;
            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => {
                longPressTriggered = true;
                openQuickMenu();
            }, 650);
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
            if (longPressTriggered) {
                longPressTriggered = false;
                return;
            }
            openHub();
        });
    }

    function getMobileNavContext() {
        const swiperWrap = document.querySelector('.swiper-wrapper')
            || document.querySelector('[class*="swiper___"]');
        const areasWrap = document.querySelector('[class*="areasMobile___"]');
        const wrapper = swiperWrap || areasWrap;
        if (!wrapper) return null;

        const links = [...wrapper.querySelectorAll('a[class*="mobileLink___"]')];
        const messagesLink = links.find(link => {
            const label = link.querySelector('span[class*="linkName___"]');
            const text = String(label?.textContent || link.textContent || '').trim().toUpperCase();
            const href = String(link.getAttribute('href') || '').toLowerCase();
            return text === 'MESSAGES' || href.includes('messages');
        });
        if (!messagesLink) return null;

        const messagesArea = messagesLink.closest('[class*="area-mobile___"]');
        if (!messagesArea) return null;
        const messagesSlide = messagesArea.closest('[class*="slide___"]');
        const isSwiper = Boolean(messagesSlide && messagesSlide.parentElement === wrapper);

        return {
            wrapper,
            isSwiper,
            messagesLink,
            messagesArea,
            messagesSlide,
            nativeRow: messagesArea.querySelector('[class*="areaRow___"], [class*="area-row___"]'),
            nativeIconWrap: messagesLink.querySelector('span[class*="svgIconWrap___"]'),
            nativeDefaultIcon: messagesLink.querySelector('span[class*="defaultIcon___"]'),
            nativeLabel: messagesLink.querySelector('span[class*="linkName___"]'),
            nativeSvg: messagesLink.querySelector('svg')
        };
    }

    function buildSkullSvg(nativeSvg) {
        if (!nativeSvg) return null;
        const svg = nativeSvg.cloneNode(false);
        const vb = (nativeSvg.getAttribute('viewBox') || '0 0 24 24').split(/\s+/).map(Number);
        const vbW = vb[2] || 24;
        const vbH = vb[3] || 24;
        const ART_INK = 20;
        const scale = vbH / ART_INK;
        const tx = (vb[0] || 0) + (vbW - 24 * scale) / 2;
        const ty = (vb[1] || 0) + (vbH - 24 * scale) / 2;
        svg.style.overflow = 'visible';
        svg.style.setProperty('filter', 'none', 'important');
        svg.style.setProperty('-webkit-filter', 'none', 'important');
        svg.setAttribute('aria-hidden', 'true');

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`);
        g.setAttribute('fill', 'none');
        g.setAttribute('stroke', 'currentColor');
        g.setAttribute('stroke-width', '1.75');
        g.setAttribute('stroke-linecap', 'round');
        g.setAttribute('stroke-linejoin', 'round');
        g.innerHTML = `
            <path d="M12 2.4c-4.8 0-8.1 3.2-8.1 7.6 0 2.8 1.4 5.1 3.8 6.4v3.1h2.2v-2.1h1v2.1h2.2v-2.1h1v2.1h2.2v-3.1c2.4-1.3 3.8-3.6 3.8-6.4 0-4.4-3.3-7.6-8.1-7.6Z"/>
            <circle cx="8.8" cy="10.5" r="1.65"/>
            <circle cx="15.2" cy="10.5" r="1.65"/>
            <path d="m12 12.7-1 1.8h2l-1-1.8Z"/>
            <path d="M8.1 16.1h7.8M10.5 16.1v1.3M13.5 16.1v1.3"/>
        `;
        svg.appendChild(g);
        return svg;
    }

    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const nativeReady = settings.showTopbarSkull && Boolean(document.getElementById(IDS.topSkull));
        button.style.setProperty('display', nativeReady ? 'none' : 'flex', 'important');
    }

    function createTopbarSkull() {
        const existing = document.getElementById(IDS.topSkull);
        if (!settings.showTopbarSkull) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        if (existing?.isConnected) {
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }

        const ctx = getMobileNavContext();
        if (!ctx) {
            syncFloatingButtonVisibility();
            return false;
        }

        const area = document.createElement('div');
        area.className = ctx.messagesArea.className;

        const row = document.createElement('div');
        if (ctx.nativeRow) row.className = ctx.nativeRow.className;

        const link = document.createElement('a');
        link.className = ctx.messagesLink.className;
        link.href = '#';
        link.tabIndex = 0;
        link.classList.add('slh-native-link');
        link.setAttribute('aria-label', 'Open SakaLuX Script Hub');
        link.setAttribute('title', 'SakaLuX Script Hub');

        const iconWrap = document.createElement('span');
        if (ctx.nativeIconWrap) iconWrap.className = ctx.nativeIconWrap.className;

        const innerIcon = document.createElement('span');
        if (ctx.nativeDefaultIcon) innerIcon.className = ctx.nativeDefaultIcon.className;
        innerIcon.classList.add('slh-native-skull-icon');
        innerIcon.style.setProperty('filter', 'none', 'important');
        innerIcon.style.setProperty('-webkit-filter', 'none', 'important');

        const skullSvg = buildSkullSvg(ctx.nativeSvg);
        if (skullSvg) innerIcon.appendChild(skullSvg);
        else innerIcon.textContent = '☠︎';

        iconWrap.appendChild(innerIcon);
        link.appendChild(iconWrap);

        const label = document.createElement('span');
        if (ctx.nativeLabel) label.className = ctx.nativeLabel.className;
        label.textContent = 'HUB';
        link.appendChild(label);

        const badge = document.createElement('span');
        badge.id = IDS.topBadge;
        link.appendChild(badge);

        const open = event => {
            event.preventDefault();
            event.stopPropagation();
            openHub();
        };
        link.addEventListener('click', open);
        link.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') open(event);
        });

        row.appendChild(link);
        area.appendChild(row);

        let mounted;
        if (ctx.isSwiper && ctx.messagesSlide) {
            const slide = document.createElement('div');
            slide.className = ctx.messagesSlide.className
                .replace(/swiper-slide-active|swiper-slide-next|swiper-slide-prev|contextMenuActive___\S+/g, '')
                .trim();
            if (ctx.messagesSlide.style.width) slide.style.width = ctx.messagesSlide.style.width;
            slide.appendChild(area);
            mounted = slide;
        } else {
            mounted = area;
        }

        mounted.id = IDS.topSkull;
        const reference = ctx.isSwiper ? ctx.messagesSlide : ctx.messagesArea;
        ctx.wrapper.insertBefore(mounted, reference);

        if (ctx.isSwiper) {
            try {
                const swiper = ctx.wrapper.parentElement?.swiper;
                swiper?.update?.();
            } catch {}
        }

        updateTopbarSkullState();
        syncFloatingButtonVisibility();
        return true;
    }

    function updateTopbarSkullState() {
        const skull = document.getElementById(IDS.topSkull);
        const badge = document.getElementById(IDS.topBadge);
        if (!skull) return;
        const total = getIssueCount();
        skull.classList.toggle('slh-alert', total > 0);
        if (badge) {
            badge.style.display = total > 0 ? 'flex' : 'none';
            badge.textContent = total > 99 ? '99+' : String(total);
        }
    }

    function updateBadge() {
        const total = getIssueCount();
        const badge = document.getElementById(IDS.badge);
        if (badge) {
            badge.style.display = total > 0 ? 'flex' : 'none';
            if (total > 0) badge.textContent = total > 99 ? '99+' : String(total);
        }
        updateTopbarSkullState();
    }

    function updateHiddenButtons() {
        for (const script of SCRIPTS) {
            if (!script.buttonSelector) continue;
            const moduleEnabled = isModuleEnabled(script);
            document.querySelectorAll(script.buttonSelector).forEach(element => {
                if (!moduleEnabled || settings.hideIndividualButtons) {
                    element.style.setProperty('display', 'none', 'important');
                    element.style.setProperty('visibility', 'hidden', 'important');
                } else {
                    element.style.removeProperty('display');
                    element.style.removeProperty('visibility');
                }
            });
        }
    }

    function closeHub() {
        document.getElementById(IDS.overlay)?.remove();
    }

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
            <div class="slh-header">
                <div class="slh-headrow">
                    <div><div class="slh-title">☠️ SakaLuX Script Hub</div><div class="slh-sub">v${VERSION} • Registry: ${escapeHtml(registryStatus)} • ${SCRIPTS.length} add-ons</div></div>
                    <button class="slh-close" id="slh-close">×</button>
                </div>
                <div class="slh-stats" id="slh-stats"></div>
                <div class="slh-tools">
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
        document.getElementById('slh-update-check').onclick = () => checkAllUpdates(true);
        document.getElementById('slh-update-all').onclick = updateAll;
        document.getElementById('slh-health').onclick = openSystemCheck;
        document.getElementById('slh-whats-new').onclick = openWhatsNew;
        document.getElementById('slh-settings').onclick = openSettings;
        document.getElementById('slh-money').onclick = () => location.href = PROFILE_URL;
        document.getElementById('slh-items').onclick = () => location.href = PROFILE_URL;
        document.getElementById('slh-author').onclick = event => {
            event.preventDefault();
            location.href = PROFILE_URL;
        };
        renderMainStats();
        renderCategories();
        renderList();
        updateCheckButtonState(updateCheckRunning);
        if (settings.autoCheckUpdates) checkAllUpdates(false);
    }

    function renderMainStats() {
        const box = document.getElementById('slh-stats');
        if (!box) return;
        const rows = getAllHealth();
        const installed = rows.filter(r => r.health.state !== 'missing').length;
        const healthy = rows.filter(r => r.health.state === 'ok').length;
        const errors = rows.filter(r => r.health.state === 'error').length;
        box.innerHTML = `
            <div class="slh-stat"><strong>${installed}/${SCRIPTS.length}</strong><span>ADD-ONS</span></div>
            <div class="slh-stat"><strong>${healthy}</strong><span>INSTALLED</span></div>
            <div class="slh-stat"><strong>${getUpdateCount()}</strong><span>UPDATES</span></div>
            <div class="slh-stat"><strong>${errors + getUpdateErrorCount()}</strong><span>ISSUES</span></div>
        `;
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
        const categories = ['ALL', ...new Set(SCRIPTS.map(s => s.category || 'Other'))];
        box.innerHTML = categories.map(value => `<button class="slh-cat ${category === value ? 'active' : ''}" data-category="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join('');
        box.querySelectorAll('[data-category]').forEach(button => {
            button.onclick = () => {
                category = button.dataset.category;
                renderCategories();
                renderList();
            };
        });
    }

    function renderList() {
        const list = document.getElementById('slh-list');
        if (!list) return;
        let rows = getAllHealth().map(row => ({
            ...row,
            favorite: favorites.has(row.script.id),
            usage: usage[row.script.id] || { count: 0, lastUsed: 0 },
            update: getUpdateState(row.script)
        }));
        rows = rows.filter(row => {
            const categoryOk = category === 'ALL' || row.script.category === category;
            return categoryOk;
        });
        rows.sort((a, b) => {
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
        const script = row.script;
        const health = row.health;
        const update = row.update;
        const installed = getInstalledVersion(script);
        const latest = update.data?.latest || script.expectedVersion || '?';
        const missing = health.state === 'missing';
        let extra = '';
        if (script.id === 'enhancer' && health.data) extra = ` • Inventory: ${health.data.inventoryEntries ?? 0}`;
        if (script.id === 'bazaar' && health.data) extra = (health.data.onEvents || health.data.onMessages) ? ` • Buyers: ${health.data.buyers ?? 0}` : ' • Standby on this page';
        if (script.id === 'mission-rewards' && health.data) extra = health.data.onMissions === false ? ' • Standby outside Missions' : ` • Rewards: ${health.data.rewardCards ?? 0}`;
        const enabled = !missing && isModuleEnabled(script);
        const moduleApi = script.api();
        const powerReady = Boolean(moduleApi && typeof moduleApi.setEnabled === 'function' && typeof moduleApi.isEnabled === 'function');
        const primary = getPrimaryAction(script);
        const primaryLabel = /settings/i.test(primary.label || '') ? 'SETTINGS' : 'OPEN';
        const controls = missing
            ? `<button class="slh-switch off" type="button" role="switch" aria-checked="false" disabled><span class="slh-switch-track"><i></i></span><b>OFF</b></button><button class="slh-primary install" data-install="${escapeHtml(script.id)}">INSTALL</button>`
            : `<button class="slh-switch ${enabled ? 'on' : 'off'}" type="button" role="switch" aria-checked="${enabled ? 'true' : 'false'}" data-module-toggle="${escapeHtml(script.id)}" title="${powerReady ? `Turn ${escapeHtml(script.name)} ${enabled ? 'off' : 'on'}` : `Update ${escapeHtml(script.name)} to enable native power control`}" ${powerReady ? '' : 'disabled'}><span class="slh-switch-track"><i></i></span><b>${enabled ? 'ON' : 'OFF'}</b></button><button class="slh-primary" data-script="${escapeHtml(script.id)}" data-action="${escapeHtml(primary.id)}" ${enabled ? '' : 'disabled'}>${primaryLabel}</button>`;
        return `
            <div class="slh-card ${row.favorite ? 'favorite' : ''} ${update.state === 'available' ? 'update' : ''} ${missing ? 'missing' : ''} ${!missing && !enabled ? 'off' : ''}">
                <div class="slh-icon">${script.icon || '🧩'}</div>
                <div class="slh-card-copy">
                    <div class="slh-name">${escapeHtml(script.name)}${row.favorite ? ' <span class="slh-favorite-mark">★</span>' : ''}</div>
                    <div class="slh-meta">
                        Installed: <b>${installed ? 'v' + escapeHtml(installed) : 'NOT INSTALLED'}</b> • Registry: <b>v${escapeHtml(script.expectedVersion)}</b> • Latest: <b>${latest === '?' ? '?' : 'v' + escapeHtml(latest)}</b><br>
                        <span class="slh-update-status ${update.state}">${escapeHtml(update.text)}</span>${update.data?.checkedAt ? ' • Checked ' + escapeHtml(formatAgo(update.data.checkedAt)) : ''}<br>
                        Status: <span class="slh-health ${health.state}">${escapeHtml(health.text)}</span>${extra}<br>
                        ${script.description ? `<span class="slh-description">${escapeHtml(script.description)}</span>` : ''}
                    </div>
                </div>
                <div class="slh-module-controls">${controls}</div>
            </div>
        `;
    }

    function bindCards() {
        document.querySelectorAll('[data-module-toggle]').forEach(button => {
            button.onclick = async () => {
                const id = button.dataset.moduleToggle;
                const next = button.getAttribute('aria-checked') !== 'true';
                button.disabled = true;
                try {
                    await setModulePower(id, next);
                } catch (error) {
                    console.error('[SakaLuX Hub]', error);
                    alert('Power control failed: ' + String(error?.message || error));
                    renderList();
                }
            };
        });
        document.querySelectorAll('[data-fav]').forEach(button => {
            button.onclick = event => {
                event.stopPropagation();
                const id = button.dataset.fav;
                favorites.has(id) ? favorites.delete(id) : favorites.add(id);
                saveJson(STORAGE.favorites, [...favorites]);
                renderList();
            };
        });
        document.querySelectorAll('[data-install]').forEach(button => {
            button.onclick = () => {
                const script = SCRIPTS.find(item => item.id === button.dataset.install);
                const url = script ? getInstallUrl(script) : '';
                if (url) location.href = url;
            };
        });
        document.querySelectorAll('[data-update]').forEach(button => {
            button.onclick = () => {
                const script = SCRIPTS.find(item => item.id === button.dataset.update);
                const url = script ? getInstallUrl(script) : '';
                if (url) location.href = url;
            };
        });
        document.querySelectorAll('[data-script][data-action]').forEach(button => {
            button.onclick = () => runAction(button.dataset.script, button.dataset.action);
        });
    }

    async function runAction(id, actionId) {
        const script = SCRIPTS.find(item => item.id === id);
        if (!script) return;
        const api = script.api();
        if (!api) {
            const url = getInstallUrl(script);
            if (url) location.href = url;
            return;
        }
        const action = script.quickActions.find(item => item.id === actionId) || { method: actionId };
        const isPanelAction = actionId === getPrimaryAction(script).id || actionId === 'open' || actionId === 'settings';
        try {
            if (typeof api[action.method] === 'function') {
                recordUsage(id);
                const result = await api[action.method]();
                if (result === false && action.fallbackUrl) {
                    location.href = action.fallbackUrl;
                    return;
                }
                if (isPanelAction) closeHub();
                else setTimeout(openHub, 100);
                return;
            }
            if (action.fallbackUrl) {
                recordUsage(id);
                location.href = action.fallbackUrl;
                return;
            }
            if (isPanelAction && script.fallbackOpen()) {
                recordUsage(id);
                closeHub();
                return;
            }
            alert(script.name + ' is not available on this page.');
        } catch (error) {
            console.error('[SakaLuX Hub]', error);
            alert('Action failed: ' + String(error?.message || error));
        }
    }

    async function updateAll() {
        await checkAllUpdates(true);
        const updates = SCRIPTS.filter(script => getUpdateState(script).state === 'available' && getInstallUrl(script));
        if (!updates.length) {
            alert('All installed SakaLuX add-ons are up to date.');
            return;
        }
        if (!confirm('Open ' + updates.length + ' update installer' + (updates.length === 1 ? '' : 's') + ' now?')) return;
        let opened = 0;
        for (const script of updates) {
            try {
                const win = window.open(getInstallUrl(script), '_blank');
                if (win) opened++;
            } catch {}
        }
        if (opened < updates.length) alert('Some installer tabs were blocked. Use the individual UPDATE buttons for the remaining add-ons.');
    }

    function openWhatsNew() {
        createOverlay(`
            <div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">✨ WHAT'S NEW</div><div class="slh-sub">SakaLuX Script Hub release notes</div></div><button class="slh-close" id="slhn-close">×</button></div></div>
            <div class="slh-view">
                ${HUB_CHANGELOG.map(release => `<div class="slh-note"><div class="slh-version-title">v${escapeHtml(release.version)} <span class="slh-version-date">${escapeHtml(release.date)}</span></div>${release.changes.map(change => `<div>• ${escapeHtml(change)}</div>`).join('')}</div>`).join('')}
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
        } catch (error) {
            results.push({ level: 'bad', label: 'scripts.json registry', detail: String(error?.message || error) });
        }
        for (const script of SCRIPTS) {
            try {
                const published = parseMetaVersion(await httpGet(script.metaUrl));
                const canonical = canonicalLatestVersion(script, published);
                const behind = Boolean(published && compareVersions(published, script.expectedVersion) < 0);
                results.push({
                    level: behind || !published ? 'warn' : 'ok',
                    label: script.name + ' update source',
                    detail: 'Canonical v' + canonical + (published ? ' • Greasy Fork v' + published + (behind ? ' (mirror behind; GitHub source used)' : '') : ' • Greasy Fork unavailable')
                });
            } catch (error) {
                results.push({ level: 'warn', label: script.name + ' update source', detail: 'Canonical Registry v' + script.expectedVersion + ' • ' + String(error?.message || error) });
            }
            const health = getHealth(script);
            results.push({
                level: health.state === 'ok' ? 'ok' : health.state === 'missing' ? 'warn' : 'bad',
                label: script.name + ' local status',
                detail: health.state === 'missing' ? 'Not installed' : health.state === 'ok' ? 'Installed v' + health.version : String(health.data?.error || 'Error')
            });
        }
        results.push({ level: 'ok', label: 'SakaLuX Script Hub', detail: 'Loaded v' + VERSION + ' • API exposed' });
        results.push({
            level: document.getElementById(IDS.topSkull) ? 'ok' : 'warn',
            label: 'Torn-native HUB launcher',
            detail: document.getElementById(IDS.topSkull) ? 'Mounted as a native mobile navigation entry before Messages' : 'Torn mobile navigation not detected yet'
        });
        const box = document.getElementById('slhc-results');
        if (!box) return;
        box.innerHTML = results.map(result => `<div class="slh-check-row slh-check-${result.level}">${result.level === 'ok' ? '🟢' : result.level === 'warn' ? '🟠' : '🔴'} <b>${escapeHtml(result.label)}</b><br><span style="color:#9ca3af">${escapeHtml(result.detail)}</span></div>`).join('') + '<button class="slh-big-btn" id="slhc-back">← BACK</button>';
        document.getElementById('slhc-back').onclick = openHub;
    }

    function openQuickMenu() {
        const rows = getAllHealth();
        createOverlay(`<div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">☠️ Quick Menu</div><div class="slh-sub">Installed add-ons and one-tap install</div></div><button class="slh-close" id="slhq-close">×</button></div></div><div class="slh-quick">${rows.map(row => {
            const update = getUpdateState(row.script);
            if (row.health.state === 'missing') return `<button class="slh-big-btn install" data-quick-install="${row.script.id}">⬇ INSTALL ${row.script.icon || '🧩'} ${escapeHtml(row.script.name)}</button>`;
            return `<button class="slh-big-btn ${update.state === 'available' ? 'update' : ''}" data-quick-open="${row.script.id}">${row.script.icon || '🧩'} ${escapeHtml(row.script.name)} • ${escapeHtml(row.health.text)}</button>${update.state === 'available' ? `<button class="slh-big-btn update" data-quick-update="${row.script.id}">⬆ UPDATE TO v${escapeHtml(update.data.latest)}</button>` : ''}`;
        }).join('')}<button class="slh-big-btn gray" id="slhq-full">☠️ OPEN FULL HUB</button></div>`);
        document.getElementById('slhq-close').onclick = closeHub;
        document.getElementById('slhq-full').onclick = openHub;
        document.querySelectorAll('[data-quick-install]').forEach(button => button.onclick = () => {
            const script = SCRIPTS.find(item => item.id === button.dataset.quickInstall);
            const url = script ? getInstallUrl(script) : '';
            if (url) location.href = url;
        });
        document.querySelectorAll('[data-quick-open]').forEach(button => button.onclick = () => runAction(button.dataset.quickOpen, 'open'));
        document.querySelectorAll('[data-quick-update]').forEach(button => button.onclick = () => {
            const script = SCRIPTS.find(item => item.id === button.dataset.quickUpdate);
            const url = script ? getInstallUrl(script) : '';
            if (url) location.href = url;
        });
    }

    function openSettings() {
        createOverlay(`<div class="slh-header"><div class="slh-headrow"><div><div class="slh-title">⚙️ Hub Settings</div><div class="slh-sub">SakaLuX Script Hub v${VERSION}</div></div><button class="slh-close" id="slhs-close">×</button></div></div><div class="slh-settings">
            <div class="slh-setting"><label><input id="slhs-hide" type="checkbox" ${settings.hideIndividualButtons ? 'checked' : ''}> Hide individual script buttons</label></div>
            <div class="slh-setting"><label><input id="slhs-topbar" type="checkbox" ${settings.showTopbarSkull ? 'checked' : ''}> Show Torn-native blinking skull HUB before Messages</label></div>
            <div class="slh-setting"><label><input id="slhs-long" type="checkbox" ${settings.longPressQuickMenu ? 'checked' : ''}> Long press fallback floating skull opens Quick Menu</label></div>
            <div class="slh-setting"><label><input id="slhs-auto" type="checkbox" ${settings.autoCheckUpdates ? 'checked' : ''}> Automatically check Greasy Fork updates</label></div>
            <div class="slh-setting">Fallback button position<select id="slhs-position"><option value="top-right">Top right</option><option value="middle-right">Middle right</option><option value="bottom-right">Bottom right</option><option value="top-left">Top left</option></select></div>
            <div class="slh-setting">Fallback button size: <b id="slhs-size-label">${settings.buttonSize}px</b><input id="slhs-size" type="range" min="38" max="64" step="2" value="${settings.buttonSize}"></div>
            <div class="slh-setting"><b>🔑 SHARED SAKALUX TORN API KEY</b><div style="margin-top:4px;color:#9ca3af">One key for Enhancer Guard, Mission Rewards, Market Intelligence and Elimination Assistant. Bazaar Thanker does not require a Torn API key.</div><div id="slhs-api-status" style="margin-top:6px;color:${getSharedApiKey() ? '#4ade80' : '#fbbf24'}">${getSharedApiKey() ? '✅ Shared key saved' : '⚠️ No shared key saved'}</div><input id="slhs-api-key" type="password" autocomplete="off" placeholder="Paste the newly created Torn API key"><button class="slh-big-btn update" id="slhs-api-create">🔑 CREATE GENERAL API KEY</button><div class="slh-api-actions"><button class="slh-big-btn" id="slhs-api-save">SAVE & TEST</button><button class="slh-big-btn red" id="slhs-api-clear">CLEAR KEY</button></div></div>
            <button class="slh-big-btn" id="slhs-save">💾 SAVE SETTINGS</button><button class="slh-big-btn gray" id="slhs-registry">🔄 REFRESH scripts.json</button><button class="slh-big-btn update" id="slhs-check">⬆ CHECK UPDATES NOW</button><button class="slh-big-btn gray" id="slhs-backup">📤 BACKUP</button><button class="slh-big-btn gray" id="slhs-restore">📥 RESTORE</button><button class="slh-big-btn red" id="slhs-reset">🧹 RESET HUB</button><button class="slh-big-btn gray" id="slhs-back">← BACK</button>
        </div>`);
        const position = document.getElementById('slhs-position');
        const size = document.getElementById('slhs-size');
        position.value = settings.buttonPosition;
        size.oninput = function () { document.getElementById('slhs-size-label').textContent = this.value + 'px'; };
        document.getElementById('slhs-close').onclick = closeHub;
        document.getElementById('slhs-back').onclick = openHub;
        document.getElementById('slhs-api-create').onclick = createSharedApiKey;
        document.getElementById('slhs-api-save').onclick = async () => {
            const input = document.getElementById('slhs-api-key');
            const status = document.getElementById('slhs-api-status');
            const key = input.value.trim() || getSharedApiKey();
            status.style.color = '#fbbf24';
            status.textContent = '⏳ Testing shared key...';
            try {
                await testSharedApiKey(key);
                setSharedApiKey(key);
                input.value = '';
                status.style.color = '#4ade80';
                status.textContent = '✅ Shared key valid and saved';
            } catch (error) {
                status.style.color = '#fb7185';
                status.textContent = '❌ ' + String(error?.message || error);
            }
        };
        document.getElementById('slhs-api-clear').onclick = () => {
            if (!confirm('Remove the shared SakaLuX Torn API key?')) return;
            setSharedApiKey('');
            openSettings();
        };
        document.getElementById('slhs-save').onclick = () => {
            settings.hideIndividualButtons = document.getElementById('slhs-hide').checked;
            settings.showTopbarSkull = document.getElementById('slhs-topbar').checked;
            settings.longPressQuickMenu = document.getElementById('slhs-long').checked;
            settings.autoCheckUpdates = document.getElementById('slhs-auto').checked;
            settings.buttonPosition = position.value;
            settings.buttonSize = Number(size.value);
            saveJson(STORAGE.settings, settings);
            updateHiddenButtons();
            positionButton();
            document.getElementById(IDS.topSkull)?.remove();
            createTopbarSkull();
            syncFloatingButtonVisibility();
            openHub();
        };
        document.getElementById('slhs-registry').onclick = async () => { await loadRegistry(true); openSettings(); };
        document.getElementById('slhs-check').onclick = async () => { await checkAllUpdates(true); openHub(); };
        document.getElementById('slhs-backup').onclick = backupSettings;
        document.getElementById('slhs-restore').onclick = restoreSettings;
        document.getElementById('slhs-reset').onclick = resetHub;
    }

    async function backupSettings() {
        const text = JSON.stringify({ app: 'SakaLuX Script Hub', version: VERSION, created: Date.now(), settings, favorites: [...favorites], usage });
        try {
            await navigator.clipboard.writeText(text);
            alert('Hub backup copied to clipboard.');
        } catch {
            prompt('Copy this backup:', text);
        }
    }

    function restoreSettings() {
        const raw = prompt('Paste SakaLuX Hub backup:');
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            if (data.app !== 'SakaLuX Script Hub') throw new Error();
            settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
            favorites = new Set(Array.isArray(data.favorites) ? data.favorites : []);
            usage = data.usage && typeof data.usage === 'object' ? data.usage : {};
            saveJson(STORAGE.settings, settings);
            saveJson(STORAGE.favorites, [...favorites]);
            saveJson(STORAGE.usage, usage);
            updateHiddenButtons();
            positionButton();
            document.getElementById(IDS.topSkull)?.remove();
            createTopbarSkull();
            syncFloatingButtonVisibility();
            alert('Backup restored.');
            openHub();
        } catch {
            alert('Invalid Hub backup.');
        }
    }

    function resetHub() {
        if (!confirm('Reset only SakaLuX Script Hub settings?')) return;
        Object.entries(STORAGE).forEach(([name, key]) => { if (name !== 'apiKey') localStorage.removeItem(key); });
        settings = { ...DEFAULT_SETTINGS };
        favorites = new Set();
        usage = {};
        updateCache = {};
        registry = FALLBACK_REGISTRY;
        SCRIPTS = normalizeRegistry(registry);
        updateHiddenButtons();
        positionButton();
        document.getElementById(IDS.topSkull)?.remove();
        createTopbarSkull();
        syncFloatingButtonVisibility();
        updateBadge();
        openHub();
    }

    function ensureEverything() {
        injectCss();
        createTopbarSkull();
        createHubButton();
        updateHiddenButtons();
        updateBadge();
        syncFloatingButtonVisibility();
    }

    function queueEnsure() {
        if (observerTimer) clearTimeout(observerTimer);
        observerTimer = setTimeout(() => {
            observerTimer = null;
            ensureEverything();
        }, 300);
    }

    function startObserver() {
        if (observer) return;
        observer = new MutationObserver(mutations => {
            if (mutations.some(mutation => mutation.addedNodes.length || mutation.removedNodes.length)) queueEnsure();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('hashchange', () => setTimeout(queueEnsure, 250));
    }

    window.SakaLuXScriptHub = {
        id: 'script-hub',
        name: 'SakaLuX Script Hub',
        version: VERSION,
        ready: true,
        open: () => { openHub(); return true; },
        getApiKey: getSharedApiKey,
        setApiKey: setSharedApiKey,
        hasApiKey: () => Boolean(getSharedApiKey()),
        createRequiredTornKey: createSharedApiKey,
        refresh: async () => { await loadRegistry(true); await checkAllUpdates(true); return true; },
        health: () => ({
            ready: true,
            version: VERSION,
            registryStatus,
            addOns: SCRIPTS.length,
            installed: SCRIPTS.filter(script => script.api()).length,
            updates: getUpdateCount(),
            sharedApiKey: Boolean(getSharedApiKey()),
            nativeHubLauncher: Boolean(document.getElementById(IDS.topSkull))
        })
    };

    window.dispatchEvent(new CustomEvent('SakaLuX:ScriptHubReady', { detail: { version: VERSION } }));
    window.addEventListener('SakaLuX:EnhancerGuardReady', () => { queueEnsure(); renderList(); renderMainStats(); });
    window.addEventListener('SakaLuX:BazaarThankerReady', () => { queueEnsure(); renderList(); renderMainStats(); });
    window.addEventListener('SakaLuX:MissionRewardsReady', () => { queueEnsure(); renderList(); renderMainStats(); });
    window.addEventListener('SakaLuX:MarketIntelligenceReady', () => { queueEnsure(); renderList(); renderMainStats(); });

    async function init() {
        ensureEverything();
        startObserver();
        await loadRegistry(false);
        setTimeout(ensureEverything, 700);
        setTimeout(ensureEverything, 1800);
        setTimeout(ensureEverything, 4000);
        try {
            if (sessionStorage.getItem('SakaLuX_HUB_API_SETUP_PENDING') === '1' && !/preferences\.php/i.test(location.pathname + location.href)) {
                sessionStorage.removeItem('SakaLuX_HUB_API_SETUP_PENDING');
                setTimeout(openSettings, 900);
            }
        } catch {}
        if (settings.autoCheckUpdates) setTimeout(() => checkAllUpdates(false), 1500);
        console.log('[SakaLuX Script Hub v' + VERSION + '] Loaded.');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
