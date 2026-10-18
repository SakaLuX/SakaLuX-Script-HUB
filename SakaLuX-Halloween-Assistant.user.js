// ==UserScript==
// @name         SakaLuX Halloween Assistant
// @namespace    sakalux.halloween.assistant
// @version      0.1.0
// @description  Finds only live attack-ready Torn Halloween targets and ranks the quickest estimated defeats first.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @license      All Rights Reserved
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @connect      ffscouter.com
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Halloween-Assistant.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Halloween-Assistant.user.js
// @homepage     https://github.com/SakaLuX/SakaLuX-Script-HUB
// @supportURL   https://github.com/SakaLuX/SakaLuX-Script-HUB/issues
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.1.0';
  const IDS = Object.freeze({ launcher: 'slx-halloween-launcher', overlay: 'slx-halloween-overlay', style: 'slx-halloween-style' });
  const KEYS = Object.freeze({
    settings: 'SLX_HALLOWEEN_SETTINGS_V1',
    torn: 'SLX_HALLOWEEN_TORN_KEY',
    ff: 'SLX_HALLOWEEN_FF_KEY',
    board: 'SLX_HALLOWEEN_BOARD_CACHE_V1',
    ffCache: 'SLX_HALLOWEEN_FF_CACHE_V1',
    statusCache: 'SLX_HALLOWEEN_STATUS_CACHE_V1'
  });
  const DEFAULTS = Object.freeze({ maxPages: 10, maxFF: 1.5, maxResults: 25, statusChecks: 80, autoRefresh: true, refreshSeconds: 90 });
  const $ = (query, root = document) => root.querySelector(query);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };

  let settings = { ...DEFAULTS, ...read(KEYS.settings, {}) };
  let boardCache = read(KEYS.board, { at: 0, rows: [] });
  let ffCache = read(KEYS.ffCache, {});
  let statusCache = read(KEYS.statusCache, {});
  let targets = [];
  let scanning = false;
  let timer = 0;
  let lastError = '';

  function getHubKey() {
    try {
      for (const hub of [globalThis.SakaLuXScriptHub, globalThis.SakaLuXHub, globalThis.SakaLuX?.hub]) {
        const key = typeof hub?.getApiKey === 'function' ? hub.getApiKey() : '';
        if (key) return String(key).trim();
      }
      return String(localStorage.getItem('SakaLuX_HUB_TORN_API_KEY') || '').trim();
    } catch { return ''; }
  }
  function getTornKey() { return getHubKey() || String(localStorage.getItem(KEYS.torn) || '').trim(); }
  function getFFKey() { return String(localStorage.getItem(KEYS.ff) || '').trim() || getTornKey(); }
  function validKey(key) { return /^[A-Za-z0-9]{16}$/.test(String(key || '').trim()); }

  function requestText(url) {
    if (globalThis.SakaLuXCore?.api?.requestText) {
      return globalThis.SakaLuXCore.api.requestText({ url, ttl: 0, retries: 1, timeout: 15000 });
    }
    if (typeof GM_xmlhttpRequest === 'function') {
      return new Promise((resolve, reject) => GM_xmlhttpRequest({
        method: 'GET', url, timeout: 15000,
        onload: response => response.status >= 200 && response.status < 300 ? resolve(String(response.responseText || '')) : reject(new Error('HTTP ' + response.status)),
        onerror: () => reject(new Error('Network error')),
        ontimeout: () => reject(new Error('Request timeout'))
      }));
    }
    return fetch(url, { credentials: 'omit', headers: { Accept: 'application/json' } }).then(async response => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.text();
    });
  }
  async function requestJSON(url) {
    const raw = await requestText(url);
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (data?.error) throw new Error(data.error.error || data.error.message || 'API error');
    return data;
  }

  function formatBS(value) {
    const n = num(value);
    if (!n) return '—';
    if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.round(n).toLocaleString();
  }
  function money(value) { return '$' + Math.round(num(value)).toLocaleString(); }
  function apiList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.bounties)) return data.bounties;
    if (data?.bounties && typeof data.bounties === 'object') return Object.values(data.bounties);
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }
  function pick(object, ...keys) { for (const key of keys) if (object?.[key] != null) return object[key]; return null; }
  function normalizeBounty(item) {
    const player = pick(item, 'target', 'player', 'user') || {};
    const id = num(pick(item, 'target_id', 'targetID', 'user_id', 'userID', 'player_id', 'playerID') ?? pick(player, 'id', 'user_id', 'player_id'));
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    return {
      id,
      name: String(pick(item, 'target_name', 'name') ?? pick(player, 'name') ?? ('Player ' + id)),
      level: pick(item, 'level') ?? pick(player, 'level') ?? null,
      reward: num(pick(item, 'reward', 'amount', 'money', 'bounty')),
      count: 1,
      ff: null,
      bs: null,
      status: 'Unknown',
      statusVerified: false,
      lastAction: ''
    };
  }

  async function loadBoard(force = false) {
    if (!force && Array.isArray(boardCache.rows) && boardCache.rows.length && Date.now() - num(boardCache.at) < 120000) return boardCache.rows.map(row => ({ ...row }));
    const key = getTornKey();
    if (!validKey(key)) throw new Error('Add a valid Torn API key in Settings or SakaLuX Hub.');
    const grouped = new Map();
    const pages = Math.max(1, Math.min(60, Math.floor(num(settings.maxPages) || DEFAULTS.maxPages)));
    let offset = 0;
    for (let page = 0; page < pages; page++) {
      setProgress('Scanning bounty board', page, pages);
      const url = 'https://api.torn.com/v2/torn/bounties?limit=100&offset=' + offset + '&key=' + encodeURIComponent(key);
      const data = await requestJSON(url);
      const list = apiList(data);
      for (const item of list) {
        const row = normalizeBounty(item);
        if (!row) continue;
        const previous = grouped.get(row.id);
        if (previous) { previous.reward += row.reward; previous.count++; }
        else grouped.set(row.id, row);
      }
      if (list.length < 100) break;
      offset += list.length;
      await wait(850);
    }
    const rows = [...grouped.values()];
    boardCache = { at: Date.now(), rows };
    write(KEYS.board, boardCache);
    return rows;
  }

  function normalizeFF(data) {
    const list = Array.isArray(data) ? data : Array.isArray(data?.players) ? data.players : Array.isArray(data?.data) ? data.data : [];
    return list.map(item => ({
      id: num(item.player_id ?? item.id),
      ff: Number.isFinite(Number(item.fair_fight ?? item.ff)) ? Number(item.fair_fight ?? item.ff) : null,
      bs: Number.isFinite(Number(item.bs_estimate ?? item.battle_stats ?? item.bss)) ? Number(item.bs_estimate ?? item.battle_stats ?? item.bss) : null
    })).filter(item => item.id > 0);
  }
  async function enrichFF(rows) {
    const key = getFFKey();
    if (!validKey(key)) throw new Error('Add a valid FFScouter key to rank quick targets.');
    const now = Date.now();
    const needed = [];
    for (const row of rows) {
      const cached = ffCache[String(row.id)];
      if (cached && now - num(cached.at) < 12 * 60 * 60 * 1000) { row.ff = cached.ff; row.bs = cached.bs; }
      else needed.push(row.id);
    }
    for (let index = 0; index < needed.length; index += 205) {
      const batch = needed.slice(index, index + 205);
      setProgress('Loading FF / battle stats', Math.min(index, needed.length), needed.length);
      const url = 'https://ffscouter.com/api/v1/get-stats?key=' + encodeURIComponent(key) + '&targets=' + batch.join(',');
      for (const item of normalizeFF(await requestJSON(url))) ffCache[String(item.id)] = { at: Date.now(), ff: item.ff, bs: item.bs };
      if (index + 205 < needed.length) await wait(200);
    }
    write(KEYS.ffCache, ffCache);
    for (const row of rows) {
      const cached = ffCache[String(row.id)];
      if (cached) { row.ff = cached.ff; row.bs = cached.bs; }
    }
    return rows;
  }

  function statusFrom(data) {
    const user = data?.user || data?.profile || data || {};
    const status = user.status || {};
    const travel = user.travel || user.travel_info || user.traveling || {};
    const text = [
      typeof status === 'object' ? [status.state, status.description, status.details].filter(Boolean).join(' ') : status,
      typeof travel === 'object' ? [travel.state, travel.status, travel.destination, travel.country].filter(Boolean).join(' ') : travel
    ].filter(Boolean).join(' ');
    let state = 'Unknown';
    if (/hospital/i.test(text)) state = 'Hospital';
    else if (/jail/i.test(text)) state = 'Jail';
    else if (/federal/i.test(text)) state = 'Federal';
    else if (/travel|abroad|flying|returning/i.test(text)) state = 'Abroad';
    else if (/okay|healthy|available/i.test(text)) state = 'Okay';
    return { status: state, name: String(user.name || user.player_name || ''), level: user.level == null ? null : num(user.level), lastAction: String(user.last_action?.relative || user.last_action?.status || '') };
  }
  async function checkStatus(row, force = false) {
    const cached = statusCache[String(row.id)];
    if (!force && cached && Date.now() - num(cached.at) < 30000) return { ...row, ...cached.data, statusVerified: cached.data.status !== 'Unknown', ff: row.ff, bs: row.bs };
    const key = getTornKey();
    const routes = [
      'https://api.torn.com/v2/user/' + row.id + '/basic?striptags=true&key=' + encodeURIComponent(key),
      'https://api.torn.com/v2/user/' + row.id + '?selections=basic&striptags=true&key=' + encodeURIComponent(key),
      'https://api.torn.com/user/' + row.id + '?selections=basic&key=' + encodeURIComponent(key)
    ];
    let result = null;
    for (const url of routes) {
      try { result = statusFrom(await requestJSON(url)); if (result.status !== 'Unknown') break; } catch {}
    }
    if (!result) return row;
    statusCache[String(row.id)] = { at: Date.now(), data: result };
    write(KEYS.statusCache, statusCache);
    return { ...row, ...result, name: result.name || row.name, level: result.level ?? row.level, statusVerified: result.status !== 'Unknown', ff: row.ff, bs: row.bs };
  }

  function quickCompare(a, b) {
    const aKnown = a.bs == null ? 1 : 0, bKnown = b.bs == null ? 1 : 0;
    if (aKnown !== bKnown) return aKnown - bKnown;
    if (!aKnown && num(a.bs) !== num(b.bs)) return num(a.bs) - num(b.bs);
    if (num(a.ff) !== num(b.ff)) return num(a.ff) - num(b.ff);
    const aLevel = a.level == null ? 999 : num(a.level), bLevel = b.level == null ? 999 : num(b.level);
    return aLevel - bLevel || b.reward - a.reward;
  }
  function speedLabel(row) {
    if (row.ff <= 1.15 && (row.bs == null || row.bs <= 1e6)) return '⚡ VERY FAST';
    if (row.ff <= 1.3) return '⚡ FAST';
    return '✓ EASY';
  }
  function candidateRows(rows) {
    const maxFF = Math.max(1, num(settings.maxFF) || DEFAULTS.maxFF);
    return rows.filter(row => row.ff != null && row.ff >= 1 && row.ff <= maxFF).sort(quickCompare);
  }

  async function scan(force = false) {
    if (scanning) return false;
    scanning = true;
    lastError = '';
    updateControls();
    try {
      let rows = await loadBoard(force);
      rows = await enrichFF(rows);
      const candidates = candidateRows(rows);
      const limit = Math.max(10, Math.min(160, Math.floor(num(settings.statusChecks) || DEFAULTS.statusChecks)));
      const wanted = Math.max(5, Math.min(100, Math.floor(num(settings.maxResults) || DEFAULTS.maxResults)));
      const verified = [];
      for (let index = 0; index < Math.min(limit, candidates.length); index += 4) {
        const batch = candidates.slice(index, index + 4);
        setProgress('Verifying attack-ready status', Math.min(index, limit), Math.min(limit, candidates.length));
        const checked = await Promise.all(batch.map(row => checkStatus(row, force)));
        verified.push(...checked.filter(row => row.statusVerified === true && row.status === 'Okay'));
        if (verified.length >= wanted) break;
      }
      targets = verified.sort(quickCompare).slice(0, wanted);
      renderTargets();
      setProgress('Ready', targets.length, targets.length);
      return true;
    } catch (error) {
      lastError = String(error?.message || error || 'Scan failed');
      renderTargets();
      setProgress('Error: ' + lastError, 0, 0);
      return false;
    } finally {
      scanning = false;
      updateControls();
    }
  }

  function ensureStyle() {
    if ($(('#' + IDS.style))) return;
    const style = document.createElement('style'); style.id = IDS.style;
    style.textContent = `#${IDS.launcher}{position:fixed;right:12px;bottom:88px;z-index:2147483000;width:48px;height:48px;border:1px solid #f59e0b;border-radius:15px;background:linear-gradient(160deg,#542109,#1a1212);color:#fff;font-size:24px;box-shadow:0 10px 28px #000a}#${IDS.overlay}{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:flex-end;justify-content:center;background:#02050ab8;color:#f8fafc;font:14px/1.4 system-ui,sans-serif}#${IDS.overlay}[hidden]{display:none!important}#${IDS.overlay} .ha-panel{width:min(760px,100%);height:min(92dvh,920px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #6b3b1c;border-radius:18px 18px 0 0;background:linear-gradient(155deg,#1d1620,#0d141d 55%);box-shadow:0 -18px 60px #000c}#${IDS.overlay} header{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #483020;background:#201822}#${IDS.overlay} header b{flex:1;color:#ffd894}#${IDS.overlay} button,#${IDS.overlay} input{border:1px solid #594a43;border-radius:9px;background:#17202a;color:#fff;min-height:38px;padding:7px 10px}#${IDS.overlay} .ha-head-btn{width:40px;padding:0}#${IDS.overlay} .ha-progress{padding:10px 12px;color:#cbd5e1;border-bottom:1px solid #2f3037}#${IDS.overlay} .ha-settings{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px;border-bottom:1px solid #2f3037}#${IDS.overlay} label{display:grid;gap:4px;color:#cbd5e1;font-size:11px}#${IDS.overlay} .ha-wide{grid-column:1/-1}#${IDS.overlay} .ha-actions{display:flex;gap:8px;grid-column:1/-1}#${IDS.overlay} .ha-actions button{flex:1;font-weight:800}#${IDS.overlay} [data-scan]{background:linear-gradient(#e57b18,#a8450b);border-color:#ffad45}#${IDS.overlay} .ha-list{flex:1;min-height:0;overflow:auto;display:grid;align-content:start;gap:8px;padding:10px}#${IDS.overlay} .ha-target{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:11px;border:1px solid #3c4655;border-radius:12px;background:#131c27}#${IDS.overlay} .ha-name{font-weight:900;color:#fff}#${IDS.overlay} .ha-meta{margin-top:4px;color:#aebdce;font-size:11px}#${IDS.overlay} .ha-speed{color:#ffcc70;font-weight:900}#${IDS.overlay} .ha-links{display:flex;gap:6px;align-items:center}#${IDS.overlay} .ha-links a{display:grid;place-items:center;width:42px;height:38px;border:1px solid #87531f;border-radius:9px;background:#42230c;color:#fff;text-decoration:none;font-weight:900}#${IDS.overlay} .ha-empty{padding:30px;text-align:center;color:#aebdce}#${IDS.overlay} footer{padding:8px 12px;border-top:1px solid #2f3037;color:#8998aa;font-size:10px}@media(max-width:540px){#${IDS.overlay} .ha-panel{height:94dvh}#${IDS.overlay} .ha-settings{grid-template-columns:1fr 1fr}#${IDS.overlay} .ha-target{grid-template-columns:1fr}#${IDS.overlay} .ha-links{justify-content:flex-end}}`;
    (document.head || document.documentElement).appendChild(style);
  }
  function setProgress(text, current = 0, total = 0) {
    const element = $('[data-progress]', $('#' + IDS.overlay));
    if (element) element.textContent = text + (total > 0 ? ' · ' + current + '/' + total : '');
  }
  function updateControls() {
    const overlay = $('#' + IDS.overlay);
    const button = $('[data-scan]', overlay);
    if (button) { button.disabled = scanning; button.textContent = scanning ? 'SCANNING…' : 'SCAN NOW'; }
  }
  function renderTargets() {
    const list = $('.ha-list', $('#' + IDS.overlay));
    if (!list) return;
    list.replaceChildren();
    if (!targets.length) {
      const empty = document.createElement('div'); empty.className = 'ha-empty';
      empty.textContent = lastError ? lastError : 'No verified attack-ready easy targets right now. Scan again shortly.';
      list.appendChild(empty); return;
    }
    for (const row of targets) {
      const card = document.createElement('article'); card.className = 'ha-target';
      card.innerHTML = `<div><div class="ha-name">${esc(row.name)} <small>[${row.id}]</small></div><div class="ha-meta"><span class="ha-speed">${esc(speedLabel(row))}</span> · LIVE OKAY ✓ · FF ${num(row.ff).toFixed(2)} · BS ${esc(formatBS(row.bs))}${row.level != null ? ' · L' + esc(row.level) : ''} · ${row.count} bount${row.count === 1 ? 'y' : 'ies'} ${money(row.reward)}</div></div><div class="ha-links"><a href="https://www.torn.com/page.php?sid=attack&user2ID=${row.id}" title="Open attack">ATK</a><a href="https://www.torn.com/profiles.php?XID=${row.id}" target="_blank" rel="noopener noreferrer" title="Open profile">👤</a></div>`;
      list.appendChild(card);
    }
  }
  function saveSettingsFromUI() {
    const overlay = $('#' + IDS.overlay);
    settings.maxPages = Math.max(1, Math.min(60, num($('[data-pages]', overlay)?.value) || DEFAULTS.maxPages));
    settings.maxFF = Math.max(1, Math.min(3, num($('[data-maxff]', overlay)?.value) || DEFAULTS.maxFF));
    settings.maxResults = Math.max(5, Math.min(100, num($('[data-results]', overlay)?.value) || DEFAULTS.maxResults));
    settings.statusChecks = Math.max(10, Math.min(160, num($('[data-checks]', overlay)?.value) || DEFAULTS.statusChecks));
    write(KEYS.settings, settings);
    const torn = String($('[data-torn]', overlay)?.value || '').trim();
    const ff = String($('[data-ff]', overlay)?.value || '').trim();
    if (torn) localStorage.setItem(KEYS.torn, torn);
    if (ff) localStorage.setItem(KEYS.ff, ff);
    $('[data-torn]', overlay).value = '';
    $('[data-ff]', overlay).value = '';
    setProgress('Settings saved');
  }
  function ensureUI() {
    ensureStyle();
    let launcher = $('#' + IDS.launcher);
    if (!launcher) {
      launcher = document.createElement('button'); launcher.id = IDS.launcher; launcher.type = 'button'; launcher.textContent = '🎃'; launcher.title = 'SakaLuX Halloween Assistant';
      launcher.onclick = open; document.body.appendChild(launcher);
    }
    let overlay = $('#' + IDS.overlay);
    if (!overlay) {
      overlay = document.createElement('div'); overlay.id = IDS.overlay; overlay.hidden = true;
      overlay.innerHTML = `<section class="ha-panel"><header><b>🎃 SakaLuX Halloween Assistant v${VERSION}</b><button class="ha-head-btn" data-close>×</button></header><div class="ha-progress" data-progress>Ready to scan</div><div class="ha-settings"><label>Torn API key<input data-torn type="password" maxlength="16" placeholder="Hub key used automatically"></label><label>FFScouter key<input data-ff type="password" maxlength="16" placeholder="Falls back to Torn key"></label><label>Board pages<input data-pages type="number" min="1" max="60" value="${settings.maxPages}"></label><label>Maximum FF<input data-maxff type="number" min="1" max="3" step="0.05" value="${settings.maxFF}"></label><label>Results<input data-results type="number" min="5" max="100" value="${settings.maxResults}"></label><label>Live checks<input data-checks type="number" min="10" max="160" value="${settings.statusChecks}"></label><div class="ha-actions"><button data-save>SAVE</button><button data-scan>SCAN NOW</button></div><div class="ha-wide">Only live-verified <b>Okay</b> targets are shown. Hospital, Jail, Abroad, Federal and Unknown are always hidden. Speed is an estimate from FFScouter BS/FF and level; no win is guaranteed.</div></div><div class="ha-list"></div><footer>Manual attacks only · no automatic attack or weapon action · © 2026 SakaLuX [2380374]</footer></section>`;
      overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
      $('[data-close]', overlay).onclick = close;
      $('[data-save]', overlay).onclick = saveSettingsFromUI;
      $('[data-scan]', overlay).onclick = () => { saveSettingsFromUI(); void scan(true); };
      document.body.appendChild(overlay);
    }
    return overlay;
  }
  function open() { const overlay = ensureUI(); overlay.hidden = false; renderTargets(); if (!targets.length && !scanning) void scan(false); return true; }
  function close() { const overlay = $('#' + IDS.overlay); if (overlay) overlay.hidden = true; }
  function schedule() { clearInterval(timer); if (settings.autoRefresh) timer = setInterval(() => { if (!document.hidden && !scanning) void scan(false); }, Math.max(30, num(settings.refreshSeconds) || 90) * 1000); }
  function health() { return { version: VERSION, ready: true, scanning, targets: targets.length, hasTornKey: validKey(getTornKey()), hasFFKey: validKey(getFFKey()), lastError }; }

  globalThis.SakaLuXHalloweenAssistant = Object.freeze({ version: VERSION, open, close, scan: () => scan(true), health });
  function start() { ensureUI(); schedule(); window.dispatchEvent(new CustomEvent('SakaLuXHalloweenAssistantReady', { detail: { version: VERSION } })); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
