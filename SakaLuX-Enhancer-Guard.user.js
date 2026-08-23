// ==UserScript==
// @name         SakaLuX Enhancer Guard
// @namespace    https://torn.com/
// @version      1.3.2
// @description  Advanced Enhancer inventory tracker for Torn PDA / Tampermonkey.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.user.js
// @updateURL https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = '1.3.2';
    const PDA_KEY = '###PDA-APIKEY###';

    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 24 * 60 * 60 * 1000;
    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';

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
        autoRefresh: 'SakaLuX_EG_AUTO_REFRESH'
    };

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
        diagnostics: []
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

    function clearApiKey() {
        try { localStorage.removeItem(STORAGE.apiKey); } catch {}
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
        if (state.autoRefreshMinutes <= 0) return;
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
            #sl-eg-title{font-size:19px;font-weight:900}
            #sl-eg-subtitle{margin-top:4px;color:#9ca3af;font-size:10px}
            .sl-eg-close{width:34px;height:34px;border:0;border-radius:10px;background:#252a32;color:#fff;font-size:19px}
            #sl-eg-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:11px}
            .sl-eg-stat{background:#181d24;border:1px solid #292f38;border-radius:10px;padding:8px;text-align:center;min-width:0}
            .sl-eg-stat-value{font-size:14px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .sl-eg-stat-label{color:#8b949e;font-size:9px;margin-top:2px}
            #sl-eg-controls{display:grid;grid-template-columns:1fr auto auto auto;gap:6px;margin-top:9px}
            #sl-eg-search,#sl-eg-sort,#sl-eg-auto{border:1px solid #303640;background:#181d24;color:#fff;border-radius:9px;padding:9px;outline:none}
            .sl-eg-control{border:0;border-radius:9px;min-width:40px;background:#252a32;color:#fff;font-weight:800}
            #sl-eg-filters{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:7px}
            .sl-eg-filter{border:1px solid #303640;border-radius:8px;background:#181d24;color:#c9d1d9;padding:7px;font-size:11px;font-weight:800}
            .sl-eg-filter.active{background:#2563eb;border-color:#3b82f6;color:#fff}
            #sl-eg-list{overflow-y:auto;padding:10px;-webkit-overflow-scrolling:touch}
            .sl-eg-section{margin:7px 0 8px;color:#fbbf24;font-size:12px;font-weight:900;text-transform:uppercase}
            .sl-eg-row{display:grid;grid-template-columns:30px 1fr auto;gap:8px;align-items:center;background:#181d24;border:1px solid #292f38;border-radius:11px;padding:9px;margin-bottom:7px}
            .sl-eg-row.owned{border-left:4px solid #22c55e}.sl-eg-row.not-owned{border-left:4px solid #ef4444;opacity:.82}.sl-eg-row.favorite{box-shadow:0 0 0 1px #fbbf24}
            .sl-eg-icon{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#252a32;font-size:15px}
            .sl-eg-name{font-size:13px;font-weight:900}.sl-eg-category{margin-top:2px;color:#6b7280;font-size:9px}.sl-eg-status{margin-top:3px;font-size:10px;font-weight:800}.sl-eg-status.yes{color:#4ade80}.sl-eg-status.no{color:#f87171}
            .sl-eg-price{text-align:right;white-space:nowrap}.sl-eg-mv{font-size:12px;font-weight:900}.sl-eg-total{margin-top:3px;color:#9ca3af;font-size:9px}.sl-eg-relic{color:#c084fc;font-size:11px;font-weight:900}.sl-eg-star{border:0;background:transparent;color:#fbbf24;font-size:16px;padding:0;margin-left:5px}
            .sl-eg-diagnostics{padding:10px;margin-top:10px;background:#111827;border-radius:8px;color:#9ca3af;font-size:9px;line-height:1.5}.sl-eg-footer{padding:8px 10px;border-top:1px solid #272c34;color:#6b7280;font-size:9px;text-align:center;flex-shrink:0}.sl-eg-empty{padding:30px 10px;text-align:center;color:#9ca3af}.sl-eg-error{padding:15px;background:#32191d;border:1px solid #6b252d;color:#fca5a5;border-radius:12px;margin:10px;font-size:12px;line-height:1.5}
            #sl-eg-panel.compact .sl-eg-row{padding:6px;margin-bottom:4px}#sl-eg-panel.compact .sl-eg-icon{width:25px;height:25px}#sl-eg-panel.compact .sl-eg-name{font-size:12px}#sl-eg-panel.compact .sl-eg-category{display:none}
            @media(min-width:700px){#sl-eg-overlay{align-items:center}#sl-eg-panel{border-radius:18px;max-height:90vh}}
        `;
        document.head.appendChild(style);
    }

    function createButton() {
        if (document.getElementById('sl-eg-button')) return;
        const button = document.createElement('button');
        button.id = 'sl-eg-button';
        button.textContent = '🛡️ Enhancers';
        button.onclick = openPanel;
        document.body.appendChild(button);
    }

    function openPanel() {
        if (document.getElementById('sl-eg-overlay')) return true;
        const overlay = document.createElement('div');
        overlay.id = 'sl-eg-overlay';
        overlay.innerHTML = `
            <div id="sl-eg-panel" class="${state.compact ? 'compact' : ''}">
                <div id="sl-eg-header">
                    <div id="sl-eg-title-row">
                        <div><div id="sl-eg-title">🛡️ SakaLuX Enhancer Guard</div><div id="sl-eg-subtitle">v${VERSION} • API v2 • Cache ${cacheAgeText()}</div></div>
                        <button class="sl-eg-close" id="sl-eg-close">×</button>
                    </div>
                    <div id="sl-eg-stats"></div>
                    <div id="sl-eg-controls">
                        <input id="sl-eg-search" type="search" placeholder="🔎 Caută...">
                        <button class="sl-eg-control" id="sl-eg-relics" title="Relics">⭐</button>
                        <button class="sl-eg-control" id="sl-eg-compact" title="Compact mode">↕</button>
                        <button class="sl-eg-control" id="sl-eg-refresh" title="Refresh">🔄</button>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px;">
                        <select id="sl-eg-sort"><option value="owned">Owned first</option><option value="name">Name A-Z</option><option value="priceHigh">Price high-low</option><option value="priceLow">Price low-high</option></select>
                        <select id="sl-eg-auto"><option value="0">Auto refresh OFF</option><option value="5">Auto refresh 5m</option><option value="10">Auto refresh 10m</option><option value="30">Auto refresh 30m</option></select>
                    </div>
                    <div id="sl-eg-filters"><button class="sl-eg-filter" data-filter="all">ALL</button><button class="sl-eg-filter" data-filter="owned">OWNED</button><button class="sl-eg-filter" data-filter="missing">MISSING</button></div>
                </div>
                <div id="sl-eg-list"></div>
                <div class="sl-eg-footer">Read-only • Relics excluded from value • ⭐ = priority</div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('sl-eg-close').onclick = closePanel;
        document.getElementById('sl-eg-refresh').onclick = () => refreshData();
        document.getElementById('sl-eg-relics').onclick = () => {
            state.showRelics = !state.showRelics;
            setBool(STORAGE.showRelics, state.showRelics);
            render();
        };
        document.getElementById('sl-eg-compact').onclick = () => {
            state.compact = !state.compact;
            setBool(STORAGE.compact, state.compact);
            document.getElementById('sl-eg-panel').classList.toggle('compact', state.compact);
        };

        const sort = document.getElementById('sl-eg-sort');
        sort.value = state.sort;
        sort.onchange = function () {
            state.sort = this.value;
            setString(STORAGE.sort, state.sort);
            render();
        };

        const auto = document.getElementById('sl-eg-auto');
        auto.value = String(state.autoRefreshMinutes);
        auto.onchange = function () {
            state.autoRefreshMinutes = Number(this.value);
            setString(STORAGE.autoRefresh, state.autoRefreshMinutes);
            configureAutoRefresh();
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

    function showKeyPrompt() {
        if (!document.getElementById('sl-eg-overlay')) {
            openPanel();
            return;
        }
        const list = document.getElementById('sl-eg-list');
        if (!list) return;
        list.innerHTML = `
            <div class="sl-eg-error">
                <b>🔑 Minimal API Key required</b><br><br>
                Torn PDA should inject it automatically.<br><br>
                <input id="sl-eg-key" type="password" placeholder="Torn API key..." style="width:100%;box-sizing:border-box;padding:10px;background:#101318;color:#fff;border:1px solid #444;border-radius:8px;">
                <button id="sl-eg-save-key" style="width:100%;margin-top:8px;padding:10px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:800;">SAVE</button>
                <button id="sl-eg-clear-key" style="width:100%;margin-top:8px;padding:10px;border:0;border-radius:8px;background:#374151;color:#fff;">CLEAR KEY</button>
            </div>
        `;
        document.getElementById('sl-eg-save-key').onclick = () => {
            const key = document.getElementById('sl-eg-key').value.trim();
            if (!key) return;
            saveApiKey(key);
            refreshData();
        };
        document.getElementById('sl-eg-clear-key').onclick = () => {
            clearApiKey();
            state.lastUpdate = null;
            state.error = null;
            showKeyPrompt();
        };
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
            html += `<div class="sl-eg-diagnostics">✅ Connected<br>Updated: ${escapeHtml(state.lastUpdate.toLocaleTimeString())}<br>Cache age: ${escapeHtml(cacheAgeText())}<br>Auto refresh: ${state.autoRefreshMinutes ? state.autoRefreshMinutes + ' min' : 'OFF'}</div>`;
        }

        list.innerHTML = html || '<div class="sl-eg-empty">No results.</div>';
        bindStars();
    }

    function renderSection(title, items) {
        if (!items.length) return '';
        let html = `<div class="sl-eg-section">${escapeHtml(title)}</div>`;
        for (const item of items) {
            const rowClass = item.owned ? 'owned' : 'not-owned';
            const icon = item.owned ? '🟢' : '🔴';
            const status = item.owned ? 'AI ×' + formatNumber(item.quantity) : 'NU AI';
            const total = !item.isRelic && item.owned && item.marketValue ? item.marketValue * item.quantity : null;
            html += `
                <div class="sl-eg-row ${rowClass} ${item.favorite ? 'favorite' : ''}">
                    <div class="sl-eg-icon">${icon}</div>
                    <div>
                        <div class="sl-eg-name">${escapeHtml(item.name)} <button class="sl-eg-star" data-name="${escapeHtml(item.name)}">${item.favorite ? '★' : '☆'}</button></div>
                        <div class="sl-eg-category">${escapeHtml(item.category || (item.isRelic ? 'Enhancer Relic' : 'Unknown'))}</div>
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
        health() {
            return {
                ready: true,
                version: VERSION,
                loading: state.loading,
                error: state.error,
                lastUpdate: state.lastUpdate ? state.lastUpdate.getTime() : null,
                inventoryEntries: state.inventory.size,
                catalogueEntries: state.catalogue.size,
                categories: [...state.categories],
                apiMode: state.apiMode,
                hasApiKey: Boolean(getApiKey()),
                autoRefreshMinutes: state.autoRefreshMinutes
            };
        }
    };

    window.dispatchEvent(new CustomEvent('SakaLuX:EnhancerGuardReady', { detail: { version: VERSION } }));

    function init() {
        injectCss();
        state.showRelics = getBool(STORAGE.showRelics, true);
        state.compact = getBool(STORAGE.compact, false);
        state.diagnosticsVisible = getBool(STORAGE.diagnostics, false);
        state.filter = getString(STORAGE.filter, 'all');
        state.sort = getString(STORAGE.sort, 'owned');
        state.favorites = loadFavorites();
        state.autoRefreshMinutes = Number(getString(STORAGE.autoRefresh, '0'));
        configureAutoRefresh();
        createButton();
        scheduleHubInstallPrompt();
        console.log('[SakaLuX Enhancer Guard v' + VERSION + '] Loaded.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();