// ==UserScript==
// @name         SakaLuX Mission Rewards
// @namespace    sakalux.mission.rewards
// @version      1.0.8
// @description  Advanced Mission Shop reward information, value per credit, ammo ownership and weapon mod tracking for Torn PDA / Tampermonkey.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @license      All Rights Reserved
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.user.js
// @updateURL https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.meta.js
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

    const VERSION = '1.0.8';
    const PDA_KEY = '###PDA-APIKEY###';
    const MISSIONS_URL = 'https://www.torn.com/page.php?sid=missions';
    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 24 * 60 * 60 * 1000;
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
        if (!state.enabled || !isMissionsPage() || document.getElementById('sl-mri-button')) return;
        const button = document.createElement('button');
        button.id = 'sl-mri-button';
        button.textContent = '🎯 Missions';
        button.onclick = openSettings;
        document.body.appendChild(button);
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
        createButton();
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
        document.getElementById('sl-mri-button')?.remove();
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
