// ==UserScript==
// @name         SakaLuX Mission Rewards
// @namespace    sakalux.mission.rewards
// @version      1.0.1
// @description  Advanced Mission Shop reward information, value per credit, ammo ownership and weapon mod tracking for Torn PDA / Tampermonkey.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @license      MIT
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.user.js
// @updateURL https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = '1.0.1';
    const PDA_KEY = '###PDA-APIKEY###';
    const MISSIONS_URL = 'https://www.torn.com/page.php?sid=missions';
    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 24 * 60 * 60 * 1000;
    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';

    const STORAGE = {
        apiKey: 'SakaLuX_MR_API_KEY',
        settings: 'SakaLuX_MR_SETTINGS_V1',
        catalogue: 'SakaLuX_MR_CATALOGUE_V1',
        catalogueTime: 'SakaLuX_MR_CATALOGUE_TIME_V1',
        ammo: 'SakaLuX_MR_AMMO_V1',
        ammoTime: 'SakaLuX_MR_AMMO_TIME_V1',
        modRanges: 'SakaLuX_MR_MOD_RANGES_V1'
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
        processedCards: new WeakSet()
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
        if (!isMissionsPage()) return;
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
        if (!isMissionsPage()) return;
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
                <button class="sl-mr-settings-btn" id="sl-mr-save">💾 SAVE</button>
                <button class="sl-mr-settings-btn gray" id="sl-mr-refresh">🔄 REFRESH DATA</button>
                <button class="sl-mr-settings-btn gray" id="sl-mr-clear-mods">🧩 CLEAR LEARNED MOD RANGES</button>
            </div>`;
        document.body.appendChild(overlay);
        document.getElementById('sl-mr-settings-close').onclick = () => overlay.remove();
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
            #sl-mri-button{position:fixed;right:12px;bottom:150px;z-index:2147483645;border:0;border-radius:999px;padding:10px 13px;background:#18181b;color:#fff;font-size:13px;font-weight:900;box-shadow:0 5px 18px rgba(0,0,0,.4)}
            .sl-mr-card-info{position:absolute!important;left:6px!important;right:6px!important;bottom:42px!important;z-index:20!important;padding:5px 6px!important;border-radius:6px!important;background:rgba(17,24,39,.94)!important;color:#fff!important;font-size:9px!important;line-height:1.35!important;pointer-events:none!important;box-sizing:border-box!important;box-shadow:0 2px 6px rgba(0,0,0,.35)!important}
            .sl-mr-line{font-weight:800}.sl-mr-line.good{color:#4ade80}.sl-mr-line.special,.sl-mr-line.special-text{color:#fbbf24}.sl-mr-line.muted{color:#c5cad1;font-weight:600}
            .sl-mr-detail{margin-top:10px;padding:10px;border-radius:9px;background:#111827;border:1px solid #303640;color:#e5e7eb;font-size:11px;line-height:1.6}.sl-mr-detail-title{color:#fbbf24;font-size:12px;font-weight:900;margin-bottom:6px}.sl-mr-highlight{margin-top:5px;color:#4ade80;font-size:12px}.sl-mr-note{margin-top:7px;color:#9ca3af;font-size:9px}
            #sl-mr-settings-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}#sl-mr-settings{width:min(560px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0}.sl-mr-settings-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.sl-mr-settings-title{font-size:17px;font-weight:900}.sl-mr-settings-sub{margin-top:3px;color:#9ca3af;font-size:9px}#sl-mr-settings-close{width:36px;height:36px;border:0;border-radius:9px;background:#252a32;color:#fff;font-size:20px}.sl-mr-setting{display:block;margin-bottom:7px;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}.sl-mr-api-box{margin-top:10px;padding:10px;background:#181d24;border:1px solid #292f38;border-radius:9px;font-size:11px}#sl-mr-api-key{width:100%;box-sizing:border-box;margin-top:8px;padding:9px;border:1px solid #303640;border-radius:8px;background:#101318;color:#fff}.sl-mr-settings-btn{width:100%;margin-top:7px;min-height:40px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900}.sl-mr-settings-btn.gray{background:#374151}
            #${HUB_PROMPT_ID}{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif}#${HUB_PROMPT_ID}>div{width:min(420px,100%);background:#101318;color:#fff;border:1px solid #303640;border-radius:14px;padding:16px;box-shadow:0 12px 35px rgba(0,0,0,.55)}#${HUB_PROMPT_ID} h3{margin:0 0 8px;font-size:16px}#${HUB_PROMPT_ID} p{margin:0 0 14px;color:#b8c0cc;font-size:12px;line-height:1.45}#${HUB_PROMPT_ID} .sl-mr-hub-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}#${HUB_PROMPT_ID} button{border:0;border-radius:9px;padding:10px;font-weight:900;color:#fff;background:#374151}#${HUB_PROMPT_ID} .install{background:#16a34a}
            @media(min-width:700px){#sl-mr-settings-overlay{align-items:center}#sl-mr-settings{border-radius:18px}}
        `;
        document.head.appendChild(style);
    }

    function createButton() {
        if (!isMissionsPage() || document.getElementById('sl-mri-button')) return;
        const button = document.createElement('button');
        button.id = 'sl-mri-button';
        button.textContent = '🎯 Missions';
        button.onclick = openSettings;
        document.body.appendChild(button);
    }

    function startObserver() {
        if (!isMissionsPage() || state.observer) return;
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
        if (hubInstalled() || document.getElementById(HUB_PROMPT_ID)) return;
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

    window.SakaLuXMissionRewards = {
        id: 'mission-rewards',
        name: 'Mission Rewards',
        version: VERSION,
        ready: true,
        open() {
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
        health() {
            return {
                ready: true,
                version: VERSION,
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

    window.dispatchEvent(new CustomEvent('SakaLuX:MissionRewardsReady', { detail: { version: VERSION } }));

    async function init() {
        setTimeout(maybePromptForHub, 3500);

        if (!isMissionsPage()) {
            console.log('[SakaLuX Mission Rewards v' + VERSION + '] Hub API ready; Mission features on standby.');
            return;
        }

        injectCss();
        createButton();
        startObserver();
        loadCatalogueCache();
        loadAmmoCache();

        if (settings.showItemValue && !state.catalogue.size) {
            loadCatalogue().then(() => scheduleScan(true));
        }
        if (settings.showAmmoOwned && !state.ammo.length) {
            loadAmmo().then(() => scheduleScan(true));
        }

        scheduleScan(true);
        console.log('[SakaLuX Mission Rewards v' + VERSION + '] Loaded.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
