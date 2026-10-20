// ==UserScript==
// @name         SakaLuX Halloween Assistant
// @namespace    sakalux.halloween.assistant
// @version      0.5.3
// @description  Finds only live attack-ready Torn Halloween targets and ranks the quickest estimated defeats first.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @license      All Rights Reserved
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @connect      ffscouter.com
// @connect      torntargets.net
// @connect      raw.githubusercontent.com
// @homepage     https://github.com/SakaLuX/SakaLuX-Script-HUB
// @supportURL   https://github.com/SakaLuX/SakaLuX-Script-HUB/issues
// ==/UserScript==

/* SakaLuX Shared Core — BEGIN */
/* SakaLuX Shared Core v1 - test foundation
 * Source-only module. Not installed directly by users.
 * Intended to be embedded into standalone userscripts at build/release time.
 */
(() => {
  'use strict';

  const g = globalThis;
  const CORE_VERSION = '1.2.8';
  const NS = 'SakaLuXCore';

  const SETTINGS_CATALOG = Object.freeze([
    { match: /Account Auditor/i, id: 'account-auditor', version: 1, keys: ['SakaLuX_AUDITOR_SETTINGS_V3'] },
    { match: /Bazaar Smart Pricer/i, id: 'bazaar-smart-pricer', version: 1, keys: ['SakaLuX_BAZAAR_SMART_PRICER_SETTINGS'] },
    { match: /Bazaar Thanker/i, id: 'bazaar', version: 1, keys: ['sakalux_bazaar_thanker_v5'] },
    { match: /Bounty Hunter/i, id: 'bounty-hunter', version: 1, keys: ['SLX_BOUNTY_SETTINGS_V3','SLX_BOUNTY_WATCH_V1','SLX_BOUNTY_BLACK_V1','SLX_BOUNTY_CACHE_V2','SLX_BOUNTY_USER_CACHE_V1','SLX_BOUNTY_FF_CACHE_V1','SLX_BOUNTY_SCAN_STATE_V1'] },
    { match: /Chat Intelligence/i, id: 'chat-intelligence', version: 1, keys: ['SLX_CHAT_CFG4'] },
    { match: /Company Intelligence/i, id: 'company-intelligence', version: 1, keys: ['sak_ci:mode', 'sak_ci:tab', 'sak_ci:compact', 'sak_ci:enabled'] },
    { match: /Elimination Assistant/i, id: 'elimination-assistant', version: 1, keys: ['slx_elim_ui_v1'] },
    { match: /Enhancer Guard/i, id: 'enhancer', version: 1, keys: ['SakaLuX_EG_FAVORITES'] },
    { match: /Market Intelligence/i, id: 'market-intelligence', version: 1, keys: ['SakaLuX_MI_SETTINGS_V2'] },
    { match: /Mission Rewards/i, id: 'mission-rewards', version: 1, keys: ['SakaLuX_MR_SETTINGS_V1'] },
    { match: /Script Hub/i, id: 'script-hub', version: 1, keys: ['SakaLuX_HUB_SETTINGS_V16'] },
    { match: /Stock Manager/i, id: 'stock-manager-advisor', version: 1, keys: ['SLX_STOCK_PRESETS', 'SLX_STOCK_BENEFIT_VALUES'] },
    { match: /SakaLuX Suite/i, id: 'suite', version: 1, keys: ['sakalux_master_suite_settings_v1'] }
  ]);

  function currentScriptSettingsDefinition() {
    let name = '';
    try { name = String(g.GM_info?.script?.name || ''); } catch {}
    return SETTINGS_CATALOG.find(entry => entry.match.test(name)) || null;
  }

  function currentTransportEnvironment() {
    let gm = null;
    try { if (typeof GM_xmlhttpRequest === 'function') gm = GM_xmlhttpRequest; } catch {}
    return {
      pda: typeof g.PDA_httpGet === 'function' ? g.PDA_httpGet.bind(g) : null,
      gm,
      fetch: typeof g.fetch === 'function' ? g.fetch.bind(g) : null
    };
  }

  if (g[NS]?.version === CORE_VERSION) {
    g[NS].api?.registerEnvironment?.(currentTransportEnvironment());
    g[NS].settings?.autoGuardCurrentScript?.();
    if (!g.SakaLuXPerf && g[NS].perf) g.SakaLuXPerf = g[NS].perf;
    return;
  }

  const timers = new Map();
  const listeners = new Set();
  let routeKey = '';
  let routeEpoch = 0;
  let routerBound = false;
  let routeAbortHook = null;

  const perf = {
    debounce(key, fn, wait = 220) {
      const old = timers.get(key);
      if (old) clearTimeout(old);
      const id = setTimeout(() => {
        timers.delete(key);
        fn();
      }, Math.max(120, Number(wait) || 220));
      timers.set(key, id);
      return id;
    },
    idle(fn, timeout = 700) {
      if (typeof requestIdleCallback === 'function') return requestIdleCallback(fn, { timeout });
      return setTimeout(fn, 32);
    },
    unrelated(records) {
      return Array.isArray(records) && records.length > 0 && records.every(record => {
        const node = record?.target;
        const target = node?.nodeType === 1 ? node : node?.parentElement;
        return !!target?.closest?.('#chat-box,[id^="chat-box"],[class*="chat-box"],[class*="chatBox"],#sakalux-standalone-dock,[id^="sakalux-inline-footer-"]');
      });
    }
  };

  const hub = {
    installed() {
      if (typeof document === 'undefined') return false;
      const html = document.documentElement;
      const body = document.body;
      return !!(
        g.SakaLuXScriptHub ||
        document.getElementById('sakalux-hub-button') ||
        document.getElementById('sakalux-hub-top-skull') ||
        document.getElementById('sakalux-hub-nav-skull') ||
        document.getElementById('sakalux-hub-panel') ||
        document.getElementById('sakalux-hub-style') ||
        html?.getAttribute('data-sakalux-hub-installed') === '1' ||
        body?.getAttribute('data-sakalux-hub-installed') === '1' ||
        html?.getAttribute('data-sakalux-hub-active') === '1' ||
        body?.getAttribute('data-sakalux-hub-active') === '1'
      );
    }
  };

  const storage = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch { return false; }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch { return false; }
    }
  };

  const settings = (() => {
    const statuses = new Map();
    const prefix = 'SakaLuX_SettingsSchema::';
    const backupPrefix = 'SakaLuX_SettingsBackup::';

    function normalizeDefinition(definition = {}) {
      const id = String(definition.id || '').trim();
      const version = Math.max(1, Math.floor(Number(definition.version) || 1));
      const keys = [...new Set((definition.keys || []).map(String).filter(Boolean))];
      if (!id) throw new Error('Settings schema id is required');
      if (!keys.length) throw new Error(`Settings schema ${id} has no storage keys`);
      return { ...definition, id, version, keys };
    }

    function readJson(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    }

    function writeJson(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch { return false; }
    }

    function snapshot(keys) {
      const values = {};
      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (raw != null) values[key] = raw;
        } catch {}
      }
      return values;
    }

    function validateAndRecover(def, backup) {
      const recovered = [];
      const reset = [];
      const valid = [];
      for (const key of def.keys) {
        let raw = null;
        try { raw = localStorage.getItem(key); } catch {}
        if (raw == null) continue;
        try { JSON.parse(raw); valid.push(key); continue; } catch {}
        const previous = backup?.values?.[key];
        if (typeof previous === 'string') {
          try { JSON.parse(previous); localStorage.setItem(key, previous); recovered.push(key); continue; } catch {}
        }
        try { localStorage.removeItem(key); } catch {}
        reset.push(key);
      }
      return { recovered, reset, valid };
    }

    function register(definition = {}) {
      const def = normalizeDefinition(definition);
      const metaKey = prefix + def.id;
      const backupKey = backupPrefix + def.id;
      const previousMeta = readJson(metaKey, {}) || {};
      const previousVersion = Math.max(0, Math.floor(Number(previousMeta.version) || 0));
      const existingBackup = readJson(backupKey, null);
      const before = snapshot(def.keys);
      if (Object.keys(before).length) writeJson(backupKey, { version: previousVersion, at: Date.now(), values: before });
      const recovery = validateAndRecover(def, existingBackup);
      let migrated = false;
      let fallback = recovery.reset.length > 0;
      let error = '';

      if (previousVersion < def.version) {
        try {
          for (let target = previousVersion + 1; target <= def.version; target++) {
            const migrate = def.migrations?.[target];
            if (typeof migrate !== 'function') continue;
            for (const key of def.keys) {
              let raw = null;
              try { raw = localStorage.getItem(key); } catch {}
              if (raw == null) continue;
              const current = JSON.parse(raw);
              const next = migrate(current, { id: def.id, key, from: target - 1, to: target });
              if (next !== undefined) localStorage.setItem(key, JSON.stringify(next));
            }
          }
          migrated = previousVersion > 0 || Object.keys(before).length > 0;
        } catch (err) {
          error = String(err?.message || err);
          fallback = true;
          for (const key of def.keys) {
            const raw = before[key];
            try { if (raw == null) localStorage.removeItem(key); else localStorage.setItem(key, raw); } catch {}
          }
        }
      }

      const nextMeta = {
        schema: 'sakalux-settings-schema-v1', id: def.id, version: error ? previousVersion : Math.max(previousVersion, def.version),
        updatedAt: Date.now(), migrated, fallback, recovered: recovery.recovered, reset: recovery.reset,
        error: error || null
      };
      writeJson(metaKey, nextMeta);
      statuses.set(def.id, Object.freeze({ ...nextMeta }));
      return statuses.get(def.id);
    }

    function status(id) { return statuses.get(String(id)) || readJson(prefix + String(id), null); }
    function diagnostics() { return Object.freeze(Object.fromEntries([...statuses.entries()])); }
    function autoGuardCurrentScript() {
      const def = currentScriptSettingsDefinition();
      if (!def) return null;
      try { return register(def); }
      catch (err) {
        const failed = Object.freeze({ schema: 'sakalux-settings-schema-v1', id: def.id, version: 0, fallback: true, error: String(err?.message || err) });
        statuses.set(def.id, failed);
        return failed;
      }
    }

    return Object.freeze({ register, status, diagnostics, autoGuardCurrentScript, catalog: SETTINGS_CATALOG });
  })();

  const router = {
    key(loc = g.location) {
      if (!loc) return '';
      return `${loc.pathname || ''}${loc.search || ''}${loc.hash || ''}`;
    },
    epoch() { return routeEpoch; },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    check(loc = g.location) {
      const next = this.key(loc);
      if (next === routeKey) return false;
      const prev = routeKey;
      routeKey = next;
      routeEpoch++;
      try { routeAbortHook?.({ previous: prev, current: next, epoch: routeEpoch }); } catch (err) { console.error('[SakaLuXCore router abort]', err); }
      for (const fn of [...listeners]) {
        try { fn({ previous: prev, current: next, epoch: routeEpoch }); } catch (err) { console.error('[SakaLuXCore router]', err); }
      }
      return true;
    },
    bind() {
      if (routerBound || typeof g.addEventListener !== 'function') return false;
      const signal = () => this.check();
      g.addEventListener('hashchange', signal, { passive: true });
      g.addEventListener('popstate', signal, { passive: true });
      routerBound = true;
      return true;
    }
  };

  const dock = {
    ORDER: Object.freeze([
      'enhancer','bazaar','bazaar-smart-pricer','bounty-hunter','mission-rewards','market-intelligence',
      'elimination-assistant','company-intelligence','chat-intelligence','stock-manager-advisor','account-auditor'
    ]),
    dedupe(registrations = []) {
      return [...new Map(registrations.filter(Boolean).map(r => [r.id, r])).values()];
    },
    sort(registrations = []) {
      const order = this.ORDER;
      return this.dedupe(registrations).sort((a, b) => {
        const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
        const ar = ai < 0 ? Number.MAX_SAFE_INTEGER : ai;
        const br = bi < 0 ? Number.MAX_SAFE_INTEGER : bi;
        return ar - br || String(a.name || a.id).localeCompare(String(b.name || b.id));
      });
    }
  };

  const api = (() => {
    const inflight = new Map();
    const responseCache = new Map();
    const queue = [];
    const routeControllers = new Set();
    const env = { pda: null, gm: null, fetch: null };
    const stats = {
      requests: 0,
      networkRequests: 0,
      cacheHits: 0,
      deduped: 0,
      retries: 0,
      failures: 0,
      aborted: 0,
      timeouts: 0,
      rateLimited: 0
    };
    let active = 0;
    let maxConcurrent = 4;
    let sequence = 0;

    function registerEnvironment(next = {}) {
      if (typeof next.pda === 'function') env.pda = next.pda;
      if (typeof next.gm === 'function') env.gm = next.gm;
      if (typeof next.fetch === 'function') env.fetch = next.fetch;
      if (typeof g.PDA_httpGet === 'function') env.pda = g.PDA_httpGet.bind(g);
      if (!env.fetch && typeof g.fetch === 'function') env.fetch = g.fetch.bind(g);
      return { pda: !!env.pda, gm: !!env.gm, fetch: !!env.fetch };
    }

    function makeError(message, code, extra = {}) {
      const err = new Error(message);
      err.code = code;
      Object.assign(err, extra);
      return err;
    }

    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, Math.max(0, ms))); }

    function canonicalUrl(value) {
      const raw = String(value || '');
      try {
        const u = new URL(raw, g.location?.origin || 'https://www.torn.com');
        for (const key of ['ts', '_', 'cacheBust', 'cache_bust']) u.searchParams.delete(key);
        u.searchParams.sort();
        return u.toString();
      } catch { return raw; }
    }

    function requestKey(opts) {
      if (opts.key) return String(opts.key);
      return `${opts.method}|${canonicalUrl(opts.url)}|${opts.parse || 'text'}|${opts.credentials || ''}`;
    }

    function cacheRead(key) {
      const row = responseCache.get(key);
      if (!row) return null;
      if (row.expiresAt <= Date.now()) { responseCache.delete(key); return null; }
      return row.value;
    }

    function cacheWrite(key, value, ttl) {
      const ms = Math.max(0, Number(ttl) || 0);
      if (ms > 0) responseCache.set(key, { value, expiresAt: Date.now() + ms });
    }

    function enqueue(run, priority = 0) {
      return new Promise((resolve, reject) => {
        queue.push({ run, priority: Number(priority) || 0, sequence: sequence++, resolve, reject });
        queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
        pump();
      });
    }

    function pump() {
      while (active < maxConcurrent && queue.length) {
        const job = queue.shift();
        active++;
        Promise.resolve().then(job.run).then(job.resolve, job.reject).finally(() => { active--; pump(); });
      }
    }

    function normalizePdaResponse(raw) {
      if (typeof raw === 'string') return { status: 200, text: raw };
      const status = Number(raw?.status || raw?.statusCode || 200) || 200;
      const value = raw?.responseText ?? raw?.body ?? raw?.data ?? raw;
      return { status, text: typeof value === 'string' ? value : JSON.stringify(value ?? null) };
    }

    function requestViaPda(opts) {
      return Promise.resolve(env.pda(opts.url, opts.headers || {})).then(normalizePdaResponse);
    }

    function requestViaGm(opts, controller) {
      return new Promise((resolve, reject) => {
        let settled = false;
        let handle = null;
        const finish = fn => value => { if (settled) return; settled = true; fn(value); };
        const onResolve = finish(resolve);
        const onReject = finish(reject);
        try {
          handle = env.gm({
            method: opts.method,
            url: opts.url,
            headers: opts.headers || {},
            data: opts.body == null ? undefined : opts.body,
            timeout: opts.timeout,
            onload: r => onResolve({ status: Number(r?.status || 200) || 200, text: String(r?.responseText ?? '') }),
            onerror: () => onReject(makeError('Network error', 'NETWORK')),
            ontimeout: () => onReject(makeError('Request timeout', 'TIMEOUT')),
            onabort: () => onReject(makeError('Request aborted', 'ABORTED'))
          });
        } catch (err) { onReject(err); return; }
        if (controller?.signal) {
          const abort = () => { try { handle?.abort?.(); } catch {} onReject(makeError('Request aborted', 'ABORTED')); };
          if (controller.signal.aborted) abort(); else controller.signal.addEventListener('abort', abort, { once: true });
        }
      });
    }

    async function requestViaFetch(opts, controller) {
      if (!env.fetch) throw makeError('No HTTP transport available', 'NO_TRANSPORT');
      let timeoutId = null;
      let timeoutController = controller;
      if (!timeoutController && typeof AbortController === 'function') timeoutController = new AbortController();
      if (opts.timeout > 0 && timeoutController) timeoutId = setTimeout(() => timeoutController.abort('timeout'), opts.timeout);
      try {
        const res = await env.fetch(opts.url, {
          method: opts.method,
          headers: opts.headers || {},
          body: opts.body == null ? undefined : opts.body,
          credentials: opts.credentials || 'omit',
          cache: opts.cacheMode || 'no-store',
          signal: timeoutController?.signal
        });
        return { status: Number(res?.status || 0), text: await res.text() };
      } catch (err) {
        if (timeoutController?.signal?.aborted) {
          const timedOut = timeoutController.signal.reason === 'timeout';
          throw makeError(timedOut ? 'Request timeout' : 'Request aborted', timedOut ? 'TIMEOUT' : 'ABORTED');
        }
        throw makeError(err?.message || 'Network error', 'NETWORK', { cause: err });
      } finally { if (timeoutId) clearTimeout(timeoutId); }
    }

    async function transport(opts, controller) {
      registerEnvironment(currentTransportEnvironment());
      if (opts.method === 'GET' && env.pda) return requestViaPda(opts);
      if (env.gm) return requestViaGm(opts, controller);
      return requestViaFetch(opts, controller);
    }

    function retryableStatus(status) { return status === 429 || status === 408 || status >= 500; }
    function retryableError(err) { return ['NETWORK', 'TIMEOUT'].includes(err?.code); }

    function tornError(data) {
      const raw = data?.error;
      if (!raw) return null;
      const message = String(raw?.error ?? raw?.message ?? raw ?? 'Torn API error');
      const apiCode = Number(raw?.code);
      const lower = message.toLowerCase();
      const isRateLimit = apiCode === 5 || /too many|rate.?limit|requests per/i.test(lower);
      const isInvalidKey = [2, 12, 13, 16].includes(apiCode) || /invalid.*key|key.*invalid|incorrect.*key/i.test(lower);
      return { message, apiCode: Number.isFinite(apiCode) ? apiCode : null, isRateLimit, isInvalidKey };
    }

    async function networkRequest(opts, startEpoch) {
      let attempt = 0;
      const retries = Math.max(0, Number(opts.retries) || 0);
      while (true) {
        if (opts.routeScoped && router.epoch() !== startEpoch) throw makeError('Stale route request', 'STALE_ROUTE');
        const controller = opts.routeScoped && typeof AbortController === 'function' ? new AbortController() : null;
        if (controller) routeControllers.add(controller);
        try {
          stats.networkRequests++;
          const result = await transport(opts, controller);
          if (opts.routeScoped && router.epoch() !== startEpoch) throw makeError('Stale route request', 'STALE_ROUTE');
          const status = Number(result?.status || 0);
          if (status >= 200 && status < 300) return String(result?.text ?? '');
          if (status === 429) stats.rateLimited++;
          if (attempt < retries && retryableStatus(status)) {
            stats.retries++;
            await sleep((Number(opts.retryBase) || 400) * (2 ** attempt));
            attempt++;
            continue;
          }
          throw makeError(`HTTP ${status || 0}`, 'HTTP', { status, retryable: retryableStatus(status) });
        } catch (err) {
          if (err?.code === 'ABORTED' || err?.code === 'STALE_ROUTE') { stats.aborted++; throw err; }
          if (err?.code === 'TIMEOUT') stats.timeouts++;
          if (attempt < retries && retryableError(err)) {
            stats.retries++;
            await sleep((Number(opts.retryBase) || 400) * (2 ** attempt));
            attempt++;
            continue;
          }
          throw err;
        } finally { if (controller) routeControllers.delete(controller); }
      }
    }

    function requestText(input = {}) {
      const opts = typeof input === 'string' ? { url: input } : { ...input };
      opts.url = String(opts.url || '');
      opts.method = String(opts.method || 'GET').toUpperCase();
      opts.timeout = Math.max(0, Number(opts.timeout ?? 15000));
      opts.retries = Math.max(0, Number(opts.retries ?? 2));
      opts.retryBase = Math.max(0, Number(opts.retryBase ?? 400));
      opts.parse = 'text';
      if (!opts.url) return Promise.reject(makeError('Request URL is required', 'INVALID_REQUEST'));

      stats.requests++;
      const key = requestKey(opts);
      const cacheable = opts.method === 'GET' && opts.body == null;
      if (cacheable && !opts.force) {
        const cached = cacheRead(key);
        if (cached != null) { stats.cacheHits++; return Promise.resolve(cached); }
      }
      if (cacheable && inflight.has(key)) { stats.deduped++; return inflight.get(key); }

      const startEpoch = router.epoch();
      const promise = enqueue(() => networkRequest(opts, startEpoch), opts.priority)
        .then(text => { if (cacheable) cacheWrite(key, text, opts.ttl); return text; })
        .catch(err => { stats.failures++; throw err; })
        .finally(() => { if (inflight.get(key) === promise) inflight.delete(key); });
      if (cacheable) inflight.set(key, promise);
      return promise;
    }

    async function requestJson(urlOrOptions, options = {}) {
      const opts = typeof urlOrOptions === 'string' ? { ...options, url: urlOrOptions } : { ...(urlOrOptions || {}) };
      const text = await requestText(opts);
      let data;
      try { data = text ? JSON.parse(text) : null; }
      catch (err) { throw makeError('Invalid JSON response', 'INVALID_JSON', { cause: err }); }
      if (opts.throwApiError) {
        const info = tornError(data);
        if (info) {
          if (info.isRateLimit) stats.rateLimited++;
          throw makeError(info.message, 'TORN_API_ERROR', info);
        }
      }
      return data;
    }

    function clearCache(match = null) {
      if (match == null) { const size = responseCache.size; responseCache.clear(); return size; }
      const needle = String(match);
      let removed = 0;
      for (const key of [...responseCache.keys()]) if (key.includes(needle)) { responseCache.delete(key); removed++; }
      return removed;
    }

    function cancelRouteScoped() {
      let count = 0;
      for (const controller of [...routeControllers]) { try { controller.abort('route-change'); count++; } catch {} }
      return count;
    }

    function configure(options = {}) {
      if (Number.isFinite(Number(options.maxConcurrent))) maxConcurrent = Math.max(1, Math.min(12, Math.floor(Number(options.maxConcurrent))));
      pump();
      return diagnostics();
    }

    function diagnostics() {
      return Object.freeze({
        ...stats,
        active,
        queued: queue.length,
        inflight: inflight.size,
        cacheEntries: responseCache.size,
        maxConcurrent,
        transports: { pda: !!env.pda, gm: !!env.gm, fetch: !!env.fetch }
      });
    }

    routeAbortHook = cancelRouteScoped;
    registerEnvironment(currentTransportEnvironment());
    return Object.freeze({ request: requestText, requestText, requestJson, clearCache, cancelRouteScoped, configure, diagnostics, registerEnvironment });
  })();

  const ui = {
    makeDraggable(element, options = {}) {
      if (!element || typeof window === 'undefined' || typeof element.addEventListener !== 'function') return null;
      if (element.dataset.slxDraggable === '1') return element._slxDragCleanup || null;
      const storageKey = String(options.storageKey || ('SLX_DRAG_POSITION_' + (element.id || 'BUTTON')));
      const padding = Math.max(0, Number(options.padding ?? 6));
      let drag = null;
      let suppressClick = false;
      let releaseClickTimer = 0;
      const viewport = () => ({
        width: Math.max(0, Number(window.visualViewport?.width || window.innerWidth || 0)),
        height: Math.max(0, Number(window.visualViewport?.height || window.innerHeight || 0))
      });
      const place = (x, y) => {
        const view = viewport();
        const width = Math.max(1, element.offsetWidth || 48);
        const height = Math.max(1, element.offsetHeight || 48);
        const left = Math.min(Math.max(padding, Number(x) || padding), Math.max(padding, view.width - width - padding));
        const top = Math.min(Math.max(padding, Number(y) || padding), Math.max(padding, view.height - height - padding));
        Object.assign(element.style, { left: left + 'px', top: top + 'px', right: 'auto', bottom: 'auto', touchAction: 'none', userSelect: 'none' });
        return { x: left, y: top };
      };
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) place(saved.x, saved.y);
      } catch {}
      const onPointerDown = event => {
        if (event.button != null && event.button !== 0) return;
        const rect = element.getBoundingClientRect();
        drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false };
        element.setPointerCapture?.(event.pointerId);
      };
      const onPointerMove = event => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
        drag.moved = true;
        event.preventDefault();
        place(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
      };
      const onPointerUp = event => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        element.releasePointerCapture?.(event.pointerId);
        if (drag.moved) {
          const rect = element.getBoundingClientRect();
          const position = place(rect.left, rect.top);
          try { localStorage.setItem(storageKey, JSON.stringify(position)); } catch {}
          suppressClick = true;
          clearTimeout(releaseClickTimer);
          releaseClickTimer = setTimeout(() => { suppressClick = false; }, 0);
        }
        drag = null;
      };
      const onClick = event => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      };
      const onResize = () => {
        if (element.style.left && element.style.top) place(parseFloat(element.style.left), parseFloat(element.style.top));
      };
      element.dataset.slxDraggable = '1';
      element.addEventListener('pointerdown', onPointerDown);
      element.addEventListener('pointermove', onPointerMove);
      element.addEventListener('pointerup', onPointerUp);
      element.addEventListener('pointercancel', onPointerUp);
      element.addEventListener('click', onClick, true);
      window.addEventListener('resize', onResize);
      const cleanup = () => {
        clearTimeout(releaseClickTimer);
        element.removeEventListener('pointerdown', onPointerDown);
        element.removeEventListener('pointermove', onPointerMove);
        element.removeEventListener('pointerup', onPointerUp);
        element.removeEventListener('pointercancel', onPointerUp);
        element.removeEventListener('click', onClick, true);
        window.removeEventListener('resize', onResize);
        delete element.dataset.slxDraggable;
        delete element._slxDragCleanup;
      };
      element._slxDragCleanup = cleanup;
      return cleanup;
    },
    ensureDonationFooter(rootOrSelector, options = {}) {
      if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
      const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;
      if (!root) return null;
      const moduleId = String(options.id || 'module').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
      const id = 'sakalux-inline-footer-' + moduleId;
      const existing = root.querySelector?.('#' + id) || document.getElementById(id);
      if (existing) { if (existing.parentElement !== root) root.appendChild(existing); return existing; }
      const profile = String(options.profile || 'https://www.torn.com/profiles.php?XID=2380374');
      const author = String(options.author || 'SakaLuX [2380374]');
      const showMoney = options.showMoney !== false;
      const showItems = options.showItems !== false;
      const moneyLabel = String(options.moneyLabel || '💸 SEND MONEY');
      const itemsLabel = String(options.itemsLabel || '🎁 SEND ITEMS');
      const inlineLayout = options.layout === 'inline';
      if (!document.getElementById('sakalux-shared-donation-footer-style')) {
        const style = document.createElement('style');
        style.id = 'sakalux-shared-donation-footer-style';
        style.textContent = `.ha-keyline{display:flex;align-items:flex-end;gap:8px;margin:5px 0}.ha-keyline label{min-width:0;flex:1;margin:0!important}.ha-keyline input{width:100%;min-width:0;box-sizing:border-box}.ha-keyline .ha-setup{display:flex;align-items:center;justify-content:center;white-space:nowrap;flex:0 0 auto;width:auto!important;margin:0!important;padding:10px 9px!important;font-size:12px!important;min-height:20px}.ha-api-panel{gap:7px!important}.slx-shared-donation{display:block!important;flex:0 0 50px!important;width:100%!important;height:50px!important;min-height:50px!important;margin:0!important;padding:0!important;box-sizing:border-box!important;overflow:hidden!important;border-top:1px solid rgba(255,255,255,.08)!important;background:#080d13!important;font-family:Inter,Arial,sans-serif!important}.slx-shared-donation *{box-sizing:border-box!important}.slx-shared-donation-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;height:28px!important;padding:4px 10px!important}.slx-shared-donation button{display:block!important;width:100%!important;height:20px!important;min-height:20px!important;margin:0!important;padding:0 4px!important;border:1px solid #2d3d50!important;border-radius:8px!important;background:#151f2a!important;color:#c5d2df!important;font:900 8px/1.2 Inter,Arial,sans-serif!important;letter-spacing:.04em!important;white-space:nowrap!important;box-shadow:none!important}.slx-shared-donation-made{height:22px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;padding:0 6px!important;border-top:1px solid rgba(223,154,55,.52)!important;color:#df9a37!important;font:500 9px/20px Inter,Arial,sans-serif!important;white-space:nowrap!important}.slx-shared-donation-made a{color:#78aef2!important;font-weight:900!important;text-decoration:none!important}.slx-shared-donation.slx-shared-donation-inline{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;flex:0 0 29px!important;height:29px!important;min-height:29px!important}.slx-shared-donation-inline .slx-shared-donation-actions{height:29px!important;padding:4px 6px 4px 10px!important}.slx-shared-donation-inline .slx-shared-donation-made{height:29px!important;border-top:0!important;padding:0 10px 0 6px!important}`;
        (document.head || document.documentElement).appendChild(style);
      }
      const footer = document.createElement('div');
      footer.id = id;
      footer.className = 'slx-shared-donation' + (inlineLayout ? ' slx-shared-donation-inline' : '');
      const actions = document.createElement('div');
      actions.className = 'slx-shared-donation-actions';
      const actionDefinitions = [];
      if (showMoney) actionDefinitions.push(['money', moneyLabel]);
      if (showItems) actionDefinitions.push(['items', itemsLabel]);
      actions.style.gridTemplateColumns = `repeat(${Math.max(1, actionDefinitions.length)}, minmax(0, 1fr))`;
      for (const [actionName, actionLabel] of actionDefinitions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.slxDonate = actionName;
        button.textContent = actionLabel;
        actions.appendChild(button);
      }
      const made = document.createElement('div');
      made.className = 'slx-shared-donation-made';
      made.appendChild(document.createTextNode('Made with ❤️ by '));
      const authorLink = document.createElement('a');
      authorLink.href = profile;
      authorLink.textContent = author;
      made.appendChild(authorLink);
      footer.append(actions, made);
      footer.addEventListener('click', event => {
        const action = event.target?.closest?.('[data-slx-donate]');
        const link = event.target?.closest?.('a');
        if (!action && !link) return;
        event.preventDefault();
        if (action && typeof options.onDonate === 'function') {
          try { options.onDonate(action.dataset.slxDonate, profile); return; } catch {}
        }
        if (typeof location !== 'undefined') location.href = profile;
      });
      root.appendChild(footer);
      return footer;
    },
    applyWorkspaceLayout(overlay, panel, options = {}) {
      if (!overlay || !panel || typeof window === 'undefined') return null;
      const top = Math.max(0, Number(options.top ?? 0));
      const bottom = Math.max(0, Number(options.bottom ?? 8));
      const side = Math.max(0, Number(options.side ?? 4));
      const maxWidth = Math.max(240, Number(options.maxWidth ?? 760));
      const radius = Math.max(0, Number(options.radius ?? 16));
      if (typeof document !== 'undefined' && !document.getElementById('sakalux-shared-workspace-layout-style')) {
        const style = document.createElement('style');
        style.id = 'sakalux-shared-workspace-layout-style';
        style.textContent = `[data-slx-workspace-layout="1"],[data-slx-workspace-layout="1"] *,[data-slx-workspace-panel="1"],[data-slx-workspace-panel="1"] *{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important}[data-slx-workspace-layout="1"]{background:transparent!important;background-image:none!important;box-shadow:none!important}`;
        (document.head || document.documentElement).appendChild(style);
      }
      overlay.dataset.slxWorkspaceLayout = '1';
      panel.dataset.slxWorkspacePanel = '1';
      const apply = () => {
        const vv = window.visualViewport;
        const width = Math.max(0, Number(vv?.width || window.innerWidth || 0));
        const height = Math.max(0, Number(vv?.height || window.innerHeight || 0));
        const offsetTop = Math.max(0, Number(vv?.offsetTop || 0));
        const offsetLeft = Math.max(0, Number(vv?.offsetLeft || 0));
        Object.assign(overlay.style, {
          position: 'fixed',
          inset: `0px 0px ${bottom}px 0px`,
          width: 'auto',
          height: 'auto',
          maxHeight: 'none',
          display: 'block',
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          boxShadow: 'none'
        });
        const usable = Math.max(240, height - top - bottom);
        const panelWidth = Math.min(maxWidth, Math.max(240, width - side * 2));
        Object.assign(panel.style, {
          position: 'fixed',
          top: (offsetTop + top) + 'px',
          bottom: 'auto',
          left: (offsetLeft + Math.max(side, (width - panelWidth) / 2)) + 'px',
          width: panelWidth + 'px',
          height: usable + 'px',
          maxHeight: usable + 'px',
          margin: '0',
          boxSizing: 'border-box',
          borderRadius: radius + 'px',
          overflow: 'hidden',
          boxShadow: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none'
        });
      };
      apply();
      const vv = window.visualViewport;
      vv?.addEventListener?.('resize', apply);
      vv?.addEventListener?.('scroll', apply);
      window.addEventListener?.('resize', apply);
      return () => {
        vv?.removeEventListener?.('resize', apply);
        vv?.removeEventListener?.('scroll', apply);
        window.removeEventListener?.('resize', apply);
        delete overlay.dataset.slxWorkspaceLayout;
        delete panel.dataset.slxWorkspacePanel;
      };
    },
    ensureSharedSkin() {
      if (typeof document === 'undefined' || typeof document.createElement !== 'function' || document.getElementById('sakalux-shared-hub-skin')) return;
      const st = document.createElement('style');
      st.id = 'sakalux-shared-hub-skin';
      st.textContent = `
:root{--slx-bg:#0b1118;--slx-card:#111a24;--slx-card2:#172331;--slx-border:#34465b;--slx-border-soft:rgba(255,255,255,.09);--slx-text:#edf3fa;--slx-muted:#93a4b7;--slx-blue:#4f8fe8;--slx-gold:#dfbd61;--slx-green:#55d98a;--slx-red:#ff6b78;--slx-shadow:0 16px 40px rgba(0,0,0,.46)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) button,body [id^="slx-"] button,body [class^="sakalux-"] button,body [class*=" sakalux-"] button{border-radius:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;transition:border-color .15s ease,background .15s ease,transform .08s ease,opacity .15s ease}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) button:active,body [id^="slx-"] button:active{transform:scale(.985)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) input,body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) select,body [id^="slx-"] input,body [id^="slx-"] select{border-radius:10px;border-color:#3a4d63;background:#151f2b;color:var(--slx-text);font-family:Inter,Arial,sans-serif}
body [id*="sakalux"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="panel"],body [id*="sakalux"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="modal"],body [id*="slx"][id*="panel"],body [id*="slx"][id*="modal"],body #slx-stock-inline{font-family:Inter,Arial,sans-serif;color:var(--slx-text);border-color:var(--slx-border);box-shadow:var(--slx-shadow)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .header,body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .head,body [id^="slx-"] .header,body [id^="slx-"] .head{background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.18),transparent 42%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-color:var(--slx-border-soft)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .card,body [id^="slx-"] .card{border-color:var(--slx-border-soft);background:linear-gradient(180deg,rgba(19,28,39,.98),rgba(11,17,24,.98))}
@media(max-width:700px){body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) button,body [id^="slx-"] button{min-height:36px}body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) input,body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) select,body [id^="slx-"] input,body [id^="slx-"] select{min-height:36px}}
`;
      (document.head || document.documentElement).appendChild(st);
    }
  };

  const logger = {
    debug(...args) { if (storage.get('SakaLuX_DEBUG', false)) console.debug('[SakaLuX]', ...args); },
    warn(...args) { console.warn('[SakaLuX]', ...args); },
    error(...args) { console.error('[SakaLuX]', ...args); }
  };

  const core = Object.freeze({ version: CORE_VERSION, perf, hub, storage, settings, router, dock, api, ui, logger });

  g[NS] = core;
  g.SakaLuXPerf = perf;
  settings.autoGuardCurrentScript();
  routeKey = router.key();
  ui.ensureSharedSkin();
})();
/* SakaLuX Shared Core — END */

(() => {
  'use strict';

  const VERSION = '0.5.3';
  const SHARED_CORE = globalThis.SakaLuXCore || null;
  const PDA_KEY = '###PDA-APIKEY###';
  const BOARD_TTL = 120000;
  const FF_TTL = 12 * 60 * 60 * 1000;
  const STATUS_TTL = 15000;
  const BOARD_CONCURRENCY = 3;
  const FF_CONCURRENCY = 2;
  const STATUS_CONCURRENCY = 8;
  const IDS = Object.freeze({ launcher: 'slx-halloween-launcher', overlay: 'slx-halloween-overlay', style: 'slx-halloween-style' });
  const KEYS = Object.freeze({
    settings: 'SLX_HALLOWEEN_SETTINGS_V1',
    torn: 'SLX_HALLOWEEN_TORN_KEY',
    ff: 'SLX_HALLOWEEN_FF_KEY',
    board: 'SLX_HALLOWEEN_BOARD_CACHE_V1',
    ffCache: 'SLX_HALLOWEEN_FF_CACHE_V1',
    statusCache: 'SLX_HALLOWEEN_STATUS_CACHE_V1',
    targetPool: 'SLX_HALLOWEEN_TARGET_POOL_V1',
    discovered: 'SLX_HALLOWEEN_DISCOVERED_V1'
  });
  const DEFAULTS = Object.freeze({ maxPages: 10, maxFF: 1.5, maxResults: 50, statusChecks: 80, autoRefresh: true, refreshSeconds: 90, includeBounties: false, includeInactive: true, inactiveDays: 1, useTornTargets: false, useBaldr: true, discoveryLimit: 2500 });
  const $ = (query, root = document) => root.querySelector(query);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };

  let settings = { ...DEFAULTS, ...read(KEYS.settings, {}), includeInactive: true, useBaldr: true, includeBounties: false, useTornTargets: false };
  try {
    if (!localStorage.getItem('SLX_HALLOWEEN_MIGRATED_020')) {
      if (num(settings.maxResults) === 25) settings.maxResults = 50;
      localStorage.setItem('SLX_HALLOWEEN_MIGRATED_020', '1');
      write(KEYS.settings, settings);
    }
  } catch {}
  let boardCache = read(KEYS.board, { at: 0, rows: [] });
  let ffCache = { ...read('SLX_BOUNTY_FF_CACHE_V1', {}), ...read(KEYS.ffCache, {}) };
  let statusCache = read(KEYS.statusCache, {});
  let targetPool = read(KEYS.targetPool, { at: 0, rows: [] });
  let discoveredPool = read(KEYS.discovered, { at: 0, rows: [] });
  // Old faction discovery rows must not survive migration to the source-only scanner.
  if (Array.isArray(discoveredPool.rows)) {
    const clean = discoveredPool.rows.filter(row => row?.source !== 'Torn faction');
    if (clean.length !== discoveredPool.rows.length) {
      discoveredPool = { at: Date.now(), rows: clean };
      write(KEYS.discovered, discoveredPool);
    }
  }
  let targets = [];
  let scanning = false;
  let timer = 0;
  let lastError = '';
  let lastWarning = '';
  let lastScanMs = 0;
  let rateLimited = false;

  try {
    SHARED_CORE?.settings?.register?.({ id: 'halloween-assistant', version: 2, keys: Object.values(KEYS) });
    SHARED_CORE?.api?.configure?.({ maxConcurrent: 8 });
    SHARED_CORE?.ui?.ensureSharedSkin?.();
  } catch {}

  function getHubKey() {
    try {
      for (const hub of [globalThis.SakaLuXScriptHub, globalThis.SakaLuXHub, globalThis.SakaLuX?.hub]) {
        const key = typeof hub?.getApiKey === 'function' ? hub.getApiKey() : '';
        if (key) return String(key).trim();
      }
      return String(localStorage.getItem('SakaLuX_HUB_TORN_API_KEY') || '').trim();
    } catch { return ''; }
  }
  function getPDAKey() { return PDA_KEY && PDA_KEY !== '###PDA-APIKEY###' ? String(PDA_KEY).trim() : ''; }
  function getTornKey() { return getHubKey() || getPDAKey() || String(localStorage.getItem(KEYS.torn) || '').trim(); }
  function getFFKey() {
    try {
      return String(localStorage.getItem(KEYS.ff) || localStorage.getItem('SakaLuX_BOUNTY_FFSCOUTER_KEY') || localStorage.getItem('bh_ffscouterKey') || getTornKey() || '').trim();
    } catch { return getTornKey(); }
  }
  function keySource() { return getHubKey() ? 'Hub' : getPDAKey() ? 'Torn PDA' : validKey(String(localStorage.getItem(KEYS.torn) || '').trim()) ? 'Local' : 'None'; }
  function validKey(key) { return /^[A-Za-z0-9]{16}$/.test(String(key || '').trim()); }
  function pruneCaches() {
    const now = Date.now();
    let ffChanged = false, statusChanged = false;
    for (const [id, cached] of Object.entries(ffCache)) if (!cached || now - num(cached.at) > 24 * 60 * 60 * 1000) { delete ffCache[id]; ffChanged = true; }
    for (const [id, cached] of Object.entries(statusCache)) if (!cached || now - num(cached.at) > 5 * 60 * 1000) { delete statusCache[id]; statusChanged = true; }
    const ffIds = Object.keys(ffCache), statusIds = Object.keys(statusCache);
    if (ffIds.length > 5000) { ffIds.sort((a, b) => num(ffCache[b]?.at) - num(ffCache[a]?.at)).slice(5000).forEach(id => delete ffCache[id]); ffChanged = true; }
    if (statusIds.length > 1000) { statusIds.sort((a, b) => num(statusCache[b]?.at) - num(statusCache[a]?.at)).slice(1000).forEach(id => delete statusCache[id]); statusChanged = true; }
    if (ffChanged) write(KEYS.ffCache, ffCache);
    if (statusChanged) write(KEYS.statusCache, statusCache);
  }
  async function mapLimit(items, limit, worker) {
    const results = new Array(items.length);
    let next = 0;
    async function run() {
      while (next < items.length) {
        const index = next++;
        results[index] = await worker(items[index], index);
      }
    }
    await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, run));
    return results;
  }

  function requestText(url) {
    if (globalThis.SakaLuXCore?.api?.requestText) {
      return globalThis.SakaLuXCore.api.requestText({ url, ttl: 0, retries: 1, timeout: 15000 });
    }
    const parsePDA = response => response?.responseText ?? response?.body ?? response?.data ?? response;
    if (/^https:\/\/api\.torn\.com\//i.test(url) && typeof globalThis.PDA_httpGet === 'function') {
      return globalThis.PDA_httpGet(url, { Accept: 'application/json' }).then(parsePDA);
    }
    if (/^https:\/\/api\.torn\.com\//i.test(url) && globalThis.flutter_inappwebview?.callHandler) {
      return globalThis.flutter_inappwebview.callHandler('PDA_httpGet', url, { Accept: 'application/json' }).then(parsePDA);
    }
    if (typeof GM_xmlhttpRequest === 'function') {
      return new Promise((resolve, reject) => GM_xmlhttpRequest({
        method: 'GET', url, timeout: 15000,
        onload: response => {
          if (response.status >= 200 && response.status < 300) return resolve(String(response.responseText || ''));
          let detail = '';
          try { const body = JSON.parse(String(response.responseText || '{}')); detail = body?.error?.error || body?.error || body?.message || ''; } catch {}
          reject(new Error('HTTP ' + response.status + (detail ? ' · ' + detail : '')));
        },
        onerror: () => reject(new Error('Network error')),
        ontimeout: () => reject(new Error('Request timeout'))
      }));
    }
    return fetch(url, { credentials: 'omit', headers: { Accept: 'application/json' } }).then(async response => {
      if (!response.ok) {
        let detail = '';
        try { const body = await response.clone().json(); detail = body?.error?.error || body?.error || body?.message || ''; } catch {}
        throw new Error('HTTP ' + response.status + (detail ? ' · ' + detail : ''));
      }
      return response.text();
    });
  }
  async function requestJSON(url) {
    const raw = await requestText(url);
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : data.error.error || data.error.message || 'API error');
    return data;
  }
  function isRateLimitError(error) { return /(?:http\s*429|rate.?limit|too many requests)/i.test(String(error?.message || error || '')); }
  function friendlyError(error, service = 'API') {
    const message = String(error?.message || error || 'Unknown error');
    if (service === 'FFScouter' && /(?:http\s*401|invalid api key|sign up)/i.test(message)) return 'FFScouter key not registered · using level/cache ranking';
    if (service === 'Torn' && /http\s*401/i.test(message)) return 'Torn key rejected · open Settings and save a valid key';
    return service + ': ' + message;
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
      hasBounty: true,
      source: 'Bounty board',
      ff: null,
      bs: null,
      status: 'Unknown',
      statusVerified: false,
      lastAction: ''
    };
  }

  async function loadBoard(force = false) {
    if (!force && Array.isArray(boardCache.rows) && boardCache.rows.length && Date.now() - num(boardCache.at) < BOARD_TTL) return boardCache.rows.map(row => ({ ...row }));
    const key = getTornKey();
    if (!validKey(key)) throw new Error('Add a valid Torn API key in Settings or SakaLuX Hub.');
    const grouped = new Map();
    const pages = Math.max(1, Math.min(60, Math.floor(num(settings.maxPages) || DEFAULTS.maxPages)));
    let completed = 0;
    const offsets = Array.from({ length: pages }, (_, page) => page * 100);
    const pageLists = await mapLimit(offsets, BOARD_CONCURRENCY, async (offset, page) => {
      const url = 'https://api.torn.com/v2/torn/bounties?limit=100&offset=' + offset + '&key=' + encodeURIComponent(key);
      try {
        const list = apiList(await requestJSON(url));
        completed++;
        setProgress('Scanning bounty board', completed, pages);
        return list;
      } catch (error) {
        completed++;
        setProgress('Scanning bounty board', completed, pages);
        if (page === 0) throw error;
        return [];
      }
    });
    for (const list of pageLists) {
      for (const item of list) {
        const row = normalizeBounty(item);
        if (!row) continue;
        const previous = grouped.get(row.id);
        if (previous) { previous.reward += row.reward; previous.count++; }
        else grouped.set(row.id, row);
      }
    }
    const rows = [...grouped.values()];
    boardCache = { at: Date.now(), rows };
    write(KEYS.board, boardCache);
    return rows;
  }

  function compactPool(rows) {
    const map = new Map();
    for (const row of rows || []) {
      const id = Number(row?.id);
      if (!Number.isSafeInteger(id) || id <= 0 || id === 2380374) continue;
      const previous = map.get(id);
      if (!previous || (row.name && !/^Player \d+$/.test(row.name))) map.set(id, { ...previous, ...row, id });
    }
    return [...map.values()].slice(-Math.max(100, Math.min(10000, num(settings.discoveryLimit) || 2500)));
  }
  function saveDiscovery(rows) {
    const fresh = compactPool([...discoveredPool.rows || [], ...rows]);
    discoveredPool = { at: Date.now(), rows: fresh };
    write(KEYS.discovered, discoveredPool);
    return fresh;
  }
  const BALDR_FALLBACK_IDS = '320161,488552,810355,524912,1682111,387822,566484,298167,879148,234429,428732,18798,476620,472351,807823,1379450,316768,153910,76096,659852,738073,284536,263120,729174,1489357,669996,191060,454302,1046495,1199189,485156,1399310,581300,211286,469582,652354,491724,233040,688148,442427,588113,669588,1265642,861978,993561,475911,853558,1199867,556637,318410,627612,719349,969920,656275,587991,590277,44940,983314,888467,567611,1269587,782249,56712,383473,894205,1016568,874491,481648,1032025,443421,194310,573258,104318,1011379,33084,1387230,353299,542048,659243,1104804,352232,670186,448387,441061,652570,693146,595042,63476,508876,640180,104247,534510,507739,172402,508367,456008,591855,247701,470393,471778,323695,969780,1389629,685929,524902,974933,497977,1022737,794755,1171459,422145,581343,648698,857866,849660,313327,512249,904225,342880,1101484,582138,790460,525298,677104,580371,921628,894666,1413853,693966,579753,428350,982909,671763,678613,238623,469387,96674,298602,490998,916404,577479,323067,1073189,239449,509029,938020,331666,1306189,1151368,785081,640201,999990,956400,295976,424049,848845,1003142,257120,279869,1011214,865088,774785,734208,782638,512111,901426,1423394,1075217,870109,296249,1183664,789256,430140,935251,1169008,367428,555271,750371,1380052,477364,1442848,430622,1394290,552906,91892,849274,1663511,75522,95057,21631,76480,87572,241909,200728,943004,87461,929257,136660,1514039,34069,556583,173148,247665,850551,320301,583658,813216,41317,50835,14641,222151,26299,340810,27340,54567,228704,359740,185958,316174,431576,244123,188142,45179,17003,251077,313353,353885,514096,753853,458343,237866,451695,953808,162476,802907,800608,67254,147082,792900,275866,365986,264257,464079,342150,372870,14092,905822,575176,815125,983447,330496,436308,280295,660205,478962,382338,229632,488384,465467,381995,342907,432474,1177887,451753,83039,421949,740967,470180,1082559,644384,484743,281747,1210736,938350,768356,232564,668705,758810,343321,65146,384786,466947,325378,1278107,463919,930653,380958,349371,184845,931279,355177,228051,545762,507362,28699,421990,327989,1399729,197040,451340,768647,353161,347364,787968,504786,714004,510003,553287,535986,971899,916292,670897,522148,446282,512527,344390,1013307,292411,482042,970145,273087,233737,272293,19864,568129,525550,992984,314252,882854,914038,183886,742707,543610,950733,610508,465776,984505,773962,528613,163117,517671,432385,218930,857383,13800,1064044,918435,1201,20230,1258259,566824,305270,627428,31580,185939,232200,666693,165654,170474,367657,507984,218703,769246,525046,297041,295463,148374,295547,714273,247192,466216,729522,30117,556294,670286,1978001,2150020,1893007,2061354,1964175,1999595,1776074';
  function baldrFallbackRows() {
    return BALDR_FALLBACK_IDS.split(',').map(id => ({
      id: Number(id), name: 'Player ' + id, level: null, reward: 0, count: 0,
      hasBounty: false, source: 'Baldr backup', ff: null, bs: null,
      status: 'Unknown', statusVerified: false, lastAction: '', lastActionStatus: ''
    }));
  }
  let sourceDiagnostics = {};
  async function loadBaldrTargets() {
    if (!settings.includeInactive || !settings.useBaldr) { sourceDiagnostics.Baldr = 'OFF'; return []; }
    try {
      const data = await requestJSON('https://raw.githubusercontent.com/OranWeb/tc-baldrs-levelling-list/master/data.json');
      const lists = Object.values(data || {}).flatMap(v => Array.isArray(v) ? v : []);
      const found = lists.map(p => {
        const id = Number(p.id);
        if (!Number.isSafeInteger(id) || id <= 0) return null;
        return { id, name: String(p.name || 'Player ' + id), level: Number(p.lvl) || null,
          reward: 0, count: 0, hasBounty: false, source: 'Baldr list', ff: null,
          bs: Number(p.total) || null, status: 'Unknown', statusVerified: false,
          lastAction: '', lastActionStatus: '' };
      }).filter(Boolean);
      sourceDiagnostics.Baldr = found.length + ' ID-uri';
      return found.length ? found : baldrFallbackRows();
    } catch (error) {
      sourceDiagnostics.Baldr = 'backup local: ' + baldrFallbackRows().length + ' · ' + String(error?.message || error).slice(0,80);
      return baldrFallbackRows();
    }
  }
  function importedTargetRows(text) {
    const ids = [...new Set(String(text || '').match(/\b\d{2,9}\b/g) || [])].slice(0, 10000);
    return ids.map(id => ({ id: Number(id), name: 'Player ' + id, level: null,
      reward: 0, count: 0, hasBounty: false, source: 'Imported target list',
      ff: null, bs: null, status: 'Unknown', statusVerified: false,
      lastAction: '', lastActionStatus: '' }));
  }
  async function loadTornTargets() {
    if (!settings.includeInactive || !settings.useTornTargets) return [];
    const key = String(localStorage.getItem('SLX_HALLOWEEN_TORN_TARGETS_KEY') || '').trim();
    if (!key) { lastWarning = 'Torn Targets: adaugă cheia API în setări'; return []; }
    const discovered = [];
    for (let offset = 0; offset < 300; offset += 100) {
      if (rateLimited) break;
      try {
        const url = 'https://torntargets.net/api/v1/targets?status=okay&limit=100&offset=' + offset + '&api_key=' + encodeURIComponent(key);
        const data = await requestJSON(url);
        const list = Array.isArray(data?.data) ? data.data : [];
        for (const p of list) {
          const id = Number(p.torn_id ?? p.id);
          if (!Number.isSafeInteger(id) || id <= 0) continue;
          discovered.push({ id, name: String(p.name || 'Player ' + id), level: p.level ?? null,
            reward: 0, count: 0, hasBounty: false, source: 'Torn Targets',
            ff: null, bs: p.battle_stats_total ?? null, status: 'Unknown',
            statusVerified: false, lastAction: '', lastActionStatus: '' });
        }
        if (list.length < 100) break;
      } catch (error) {
        lastWarning = friendlyError(error, 'Torn Targets'); break;
      }
    }
    return discovered;
  }
  function normalizeTargetPool(data) {
    const list = Array.isArray(data?.targets) ? data.targets : Array.isArray(data) ? data : [];
    return list.map(item => {
      const id = num(item.player_id ?? item.id);
      if (!Number.isSafeInteger(id) || id <= 0) return null;
      return {
        id,
        name: String(item.name || ('Player ' + id)),
        level: item.level == null ? null : num(item.level),
        reward: 0,
        count: 0,
        hasBounty: false,
        source: 'FFScouter targets',
        ff: Number.isFinite(Number(item.fair_fight ?? item.ff)) ? Number(item.fair_fight ?? item.ff) : null,
        bs: Number.isFinite(Number(item.bs_estimate ?? item.bss_public ?? item.battle_stats)) ? Number(item.bs_estimate ?? item.bss_public ?? item.battle_stats) : null,
        status: 'Unknown',
        statusVerified: false,
        lastAction: item.last_action ? String(item.last_action) : ''
      };
    }).filter(Boolean);
  }

  async function loadSupplementalTargets() {
    if (!settings.includeInactive) { sourceDiagnostics.FFScouter = 'OFF'; return []; }
    const key = getFFKey();
    if (!validKey(key)) return Array.isArray(targetPool.rows) ? targetPool.rows.map(row => ({ ...row })) : [];
    const maxFF = Math.max(1, num(settings.maxFF) || DEFAULTS.maxFF);
    const url = 'https://ffscouter.com/api/v1/get-targets?key=' + encodeURIComponent(key) + '&minlevel=1&maxlevel=100&minff=1&maxff=' + encodeURIComponent(maxFF) + '&inactiveonly=1&limit=50';
    try {
      const rows = normalizeTargetPool(await requestJSON(url));
      if (rows.length) {
        targetPool = { at: Date.now(), rows };
        write(KEYS.targetPool, targetPool);
        for (const row of rows) ffCache[String(row.id)] = { at: Date.now(), ff: row.ff, bs: row.bs };
      }
      sourceDiagnostics.FFScouter = rows.length + ' ID-uri';
      return rows;
    } catch (error) {
      sourceDiagnostics.FFScouter = 'eroare: ' + String(error?.message || error).slice(0,80);
      lastWarning = friendlyError(error, 'FFScouter');
      return Array.isArray(targetPool.rows) ? targetPool.rows.map(row => ({ ...row })) : [];
    }
  }

  function mergeTargetSources(bounties, supplemental) {
    const merged = new Map();
    for (const row of bounties) merged.set(String(row.id), { ...row, hasBounty: true });
    for (const row of supplemental) if (!merged.has(String(row.id))) merged.set(String(row.id), { ...row, hasBounty: false, reward: 0, count: 0 });
    return [...merged.values()];
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
      if (row.ff != null || row.bs != null) {
        ffCache[String(row.id)] = { at: now, ff: row.ff, bs: row.bs };
        continue;
      }
      const cached = ffCache[String(row.id)];
      if (cached && now - num(cached.at) < FF_TTL) { row.ff = cached.ff; row.bs = cached.bs; }
      else needed.push(row.id);
    }
    const batches = [];
    for (let index = 0; index < needed.length; index += 205) batches.push(needed.slice(index, index + 205));
    let completed = 0;
    const results = await mapLimit(batches, FF_CONCURRENCY, async batch => {
      const url = 'https://ffscouter.com/api/v1/get-stats?key=' + encodeURIComponent(key) + '&targets=' + batch.join(',');
      const result = normalizeFF(await requestJSON(url));
      completed += batch.length;
      setProgress('Loading FF / battle stats', Math.min(completed, needed.length), needed.length);
      return result;
    });
    for (const result of results) for (const item of result) ffCache[String(item.id)] = { at: Date.now(), ff: item.ff, bs: item.bs };
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
    return { status: state, name: String(user.name || user.player_name || ''), level: user.level == null ? null : num(user.level), lastAction: String(user.last_action?.relative || ''), lastActionStatus: String(user.last_action?.status || ''), lastActionTimestamp: Number(user.last_action?.timestamp) || 0 };
  }
  async function checkStatus(row, force = false) {
    const cached = statusCache[String(row.id)];
    if (!force && cached && Date.now() - num(cached.at) < STATUS_TTL) return { ...row, ...cached.data, statusVerified: cached.data.status === 'Okay', verifiedAt: cached.at, ff: row.ff, bs: row.bs };
    const key = getTornKey();
    const routes = [
      'https://api.torn.com/v2/user/' + row.id + '/basic?striptags=true&key=' + encodeURIComponent(key),
      'https://api.torn.com/v2/user/' + row.id + '?selections=basic&striptags=true&key=' + encodeURIComponent(key),
      'https://api.torn.com/user/' + row.id + '?selections=basic&key=' + encodeURIComponent(key)
    ];
    let result = null;
    for (const url of routes) {
      if (rateLimited) break;
      try {
        result = statusFrom(await requestJSON(url));
        if (result.status !== 'Unknown') break;
      } catch (error) {
        if (isRateLimitError(error)) { rateLimited = true; break; }
      }
    }
    if (!result || result.status === 'Unknown') return { ...row, status: 'Unknown', statusVerified: false, verifiedAt: 0 };
    statusCache[String(row.id)] = { at: Date.now(), data: result };
    return { ...row, ...result, name: result.name || row.name, level: result.level ?? row.level, statusVerified: result.status === 'Okay', verifiedAt: Date.now(), ff: row.ff, bs: row.bs };
  }

  function quickCompare(a, b) {
    const aKnown = a.bs == null ? 1 : 0, bKnown = b.bs == null ? 1 : 0;
    if (aKnown !== bKnown) return aKnown - bKnown;
    if (!aKnown && num(a.bs) !== num(b.bs)) return num(a.bs) - num(b.bs);
    if (num(a.ff) !== num(b.ff)) return num(a.ff) - num(b.ff);
    const aLevel = a.level == null ? 999 : num(a.level), bLevel = b.level == null ? 999 : num(b.level);
    return aLevel - bLevel || b.reward - a.reward;
  }
  function targetCompare(a, b) {
    if (Boolean(a.hasBounty) !== Boolean(b.hasBounty)) return a.hasBounty ? -1 : 1;
    return quickCompare(a, b);
  }
  function speedLabel(row) {
    if (row.ff == null && row.bs == null) return 'LEVEL PICK';
    if (row.ff <= 1.15 && (row.bs == null || row.bs <= 1e6)) return '⚡ VERY FAST';
    if (row.ff <= 1.3) return '⚡ FAST';
    return '✓ EASY';
  }
  function isInactiveTarget(row) {
    const lastAction = String(row.lastAction || '').toLowerCase();
    const days = Math.max(1, Math.min(365, Math.floor(num(settings.inactiveDays) || 1)));
    const parsed = lastAction.match(/(\d+)\s*(minute|hour|day|week|month|year)s?/i);
    const ageHours = num(row.lastActionTimestamp) > 0 ? Math.max(0, (Date.now() / 1000 - num(row.lastActionTimestamp)) / 3600) : parsed ? Number(parsed[1]) * ({minute:1/60,hour:1,day:24,week:168,month:720,year:8760}[parsed[2]] || 0) : 0;
    const lastStatus = String(row.lastActionStatus || '').toLowerCase();
    return lastStatus === 'offline' && ageHours >= days * 24;
  }
  function permittedSource(row) { return !row.hasBounty; }
  function candidateRows(rows) {
    const maxFF = Math.max(1, num(settings.maxFF) || DEFAULTS.maxFF);
    return rows.filter(row => permittedSource(row) && (row.ff == null || (row.ff >= 1 && row.ff <= maxFF))).sort(targetCompare);
  }
  function applyCachedIntelligence(rows) {
    const now = Date.now();
    return rows.map(row => {
      const ff = ffCache[String(row.id)];
      const status = statusCache[String(row.id)];
      const next = { ...row };
      if (ff && now - num(ff.at) < FF_TTL) { next.ff = ff.ff; next.bs = ff.bs; }
      if (status && now - num(status.at) < STATUS_TTL) Object.assign(next, status.data, { statusVerified: status.data.status === 'Okay', verifiedAt: status.at });
      return next;
    });
  }
  function paintInstantCache(rows) {
    // Fail closed: cache cannot put an unverified target on the attack list.
    return 0;
    const wanted = Math.max(5, Math.min(100, Math.floor(num(settings.maxResults) || DEFAULTS.maxResults)));
    const instant = candidateRows(applyCachedIntelligence(rows)).filter(row => row.statusVerified === true && row.status === 'Okay' && isInactiveTarget(row)).slice(0, wanted);
    if (instant.length) { targets = instant; renderTargets(); setProgress('Instant cache · refreshing live', instant.length, instant.length); }
    return instant.length;
  }

  async function scan(force = false) {
    if (scanning) return false;
    const started = performance.now();
    scanning = true;
    targets = [];
    renderTargets();
    rateLimited = false;
    lastScanMs = 0;
    lastError = '';
    lastWarning = '';
    sourceDiagnostics = {};
    sourceDiagnostics.Config = 'FFScouter → Baldr → Torn LIVE/inactiv';
    updateControls();
    try {
      if (Array.isArray(boardCache.rows) && boardCache.rows.length) paintInstantCache(mergeTargetSources(settings.includeBounties && !settings.includeInactive ? boardCache.rows : [], settings.includeInactive ? compactPool([...(targetPool.rows || []), ...(discoveredPool.rows || [])]) : []));
      // FFScouter is always queried first. Baldr extends it, while cached discoveries
      // preserve targets when a provider temporarily fails.
      const ffRows = await loadSupplementalTargets();
      const baldrRows = await loadBaldrTargets();
      const previous = (discoveredPool.rows || []).filter(row => /FFScouter|Baldr/.test(String(row.source || '')));
      saveDiscovery([...previous, ...baldrRows, ...ffRows]);
      let rows = compactPool([...ffRows, ...baldrRows, ...previous]);
      // Verify live status first. FF enrichment is optional and must not delay target discovery.
      sourceDiagnostics.Local = discoveredPool.rows.length + ' ID-uri memorate';
      sourceDiagnostics.Pool = rows.length + ' ID-uri după combinare';
      const candidates = candidateRows(rows);
      sourceDiagnostics.EligibleCandidates = candidates.length;
      if (!candidates.length) sourceDiagnostics.Hint = 'No candidates available from enabled sources';
      const limit = Math.max(10, Math.min(160, Math.floor(num(settings.statusChecks) || DEFAULTS.statusChecks)));
      const wanted = Math.max(5, Math.min(100, Math.floor(num(settings.maxResults) || DEFAULTS.maxResults)));
      const verified = [];
      const checkedStatuses = { okay: 0, offline: 0, unknown: 0, excluded: 0 };
      const checkCount = Math.min(limit, candidates.length);
      for (let index = 0; index < checkCount; index += STATUS_CONCURRENCY) {
        const batch = candidates.slice(index, index + STATUS_CONCURRENCY);
        setProgress('Verifying attack-ready status', Math.min(index, limit), Math.min(limit, candidates.length));
        const checked = await mapLimit(batch, STATUS_CONCURRENCY, row => rateLimited ? row : checkStatus(row, force));
        for (const item of checked) {
          if (item.status === 'Okay' && item.statusVerified) checkedStatuses.okay++;
          else checkedStatuses.unknown++;
          if (String(item.lastActionStatus || '').toLowerCase() === 'offline') checkedStatuses.offline++;
          if (item.statusVerified && item.status === 'Okay' && (!settings.includeInactive || isInactiveTarget(item))) verified.push(item);
          else checkedStatuses.excluded++;
        }
        sourceDiagnostics.Torn = `${checkedStatuses.okay} Okay · ${checkedStatuses.offline} offline · ${checkedStatuses.unknown} necunoscuți · ${checkedStatuses.excluded} excluși`;
        targets = verified.filter(row => Date.now() - num(row.verifiedAt) <= STATUS_TTL).sort(targetCompare).slice(0, wanted);
        renderTargets();
        if (verified.length >= wanted || rateLimited) break;
      }
      write(KEYS.statusCache, statusCache);
      targets = verified.filter(row => row.status === 'Okay' && row.statusVerified && Date.now() - num(row.verifiedAt) <= STATUS_TTL).sort(targetCompare).slice(0, wanted);
      renderTargets();
      lastScanMs = Math.round(performance.now() - started);
      setProgress((rateLimited ? 'Torn API limit · ' : '') + Object.entries(sourceDiagnostics).map(([k,v]) => k + ': ' + v).join(' · ') + ' · ' + candidates.length + ' candidați · ' + verified.length + ' eligibili · ' + targets.length + ' LIVE · ' + (lastScanMs / 1000).toFixed(1) + 's', targets.length, targets.length);
      return true;
    } catch (error) {
      lastError = friendlyError(error, 'Torn');
      sourceDiagnostics.Scan = lastError;
      targets = [];
      renderTargets();
      setProgress('Error: ' + lastError + ' · ' + Object.entries(sourceDiagnostics).map(([k,v]) => k + ': ' + v).join(' · '), 0, 0);
      return false;
    } finally {
      if (!lastScanMs) lastScanMs = Math.round(performance.now() - started);
      scanning = false;
      updateControls();
    }
  }

  function ensureStyle() {
    if ($(('#' + IDS.style))) return;
    const style = document.createElement('style'); style.id = IDS.style;
    style.textContent = `.ha-toggle-row{display:flex!important;flex-direction:row!important;align-items:center;justify-content:space-between;gap:12px;padding:10px 6px}.ha-switch{position:relative;display:inline-flex;flex:0 0 48px;width:48px;height:27px}.ha-switch input{position:absolute;opacity:0;width:48px;height:27px;margin:0;z-index:2;cursor:pointer}.ha-switch-track{width:48px;height:27px;background:#555;border-radius:99px;transition:background .2s;pointer-events:none}.ha-switch-track:before{content:'';display:block;width:21px;height:21px;background:white;border-radius:50%;margin:3px;transition:transform .2s}.ha-switch input:checked+.ha-switch-track{background:#16a34a}.ha-switch input:checked+.ha-switch-track:before{transform:translateX(21px)}.ha-switch input:focus-visible+.ha-switch-track{outline:2px solid #f59e0b;outline-offset:2px}#${IDS.launcher}{position:fixed;right:12px;bottom:88px;z-index:2147483000;width:48px;height:48px;border:1px solid #f59e0b;border-radius:15px;background:linear-gradient(160deg,#542109,#1a1212);color:#fff;font-size:24px;box-shadow:0 10px 28px #000a;touch-action:none;user-select:none}#${IDS.overlay}{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:flex-end;justify-content:center;background:transparent;background-image:none;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none;color:#f8fafc;font:14px/1.4 system-ui,sans-serif}#${IDS.overlay}[hidden]{display:none!important}#${IDS.overlay} .ha-panel{width:min(760px,100%);height:min(92dvh,920px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #6b3b1c;border-radius:18px;background:linear-gradient(155deg,#1d1620,#0d141d 55%);box-shadow:none}#${IDS.overlay} header{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #483020;background:#201822}#${IDS.overlay} header b{flex:1;color:#ffd894}#${IDS.overlay} button,#${IDS.overlay} input{border:1px solid #594a43;border-radius:9px;background:#17202a;color:#fff;min-height:38px;padding:7px 10px}#${IDS.overlay} .ha-head-btn{width:40px;padding:0}#${IDS.overlay} .ha-progress{padding:10px 12px;color:#cbd5e1;border-bottom:1px solid #2f3037}#${IDS.overlay} .ha-settings{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px;border-bottom:1px solid #2f3037}#${IDS.overlay} label{display:grid;gap:4px;color:#cbd5e1;font-size:11px}#${IDS.overlay} .ha-wide{grid-column:1/-1}#${IDS.overlay} .ha-actions{display:flex;gap:8px;grid-column:1/-1}#${IDS.overlay} .ha-actions button{flex:1;font-weight:800}#${IDS.overlay} [data-scan]{background:linear-gradient(#e57b18,#a8450b);border-color:#ffad45}#${IDS.overlay} .ha-list{flex:1;min-height:0;overflow:auto;display:grid;align-content:start;gap:8px;padding:10px}#${IDS.overlay} .ha-target{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:11px;border:1px solid #3c4655;border-radius:12px;background:#131c27}#${IDS.overlay} .ha-name{font-weight:900;color:#fff}#${IDS.overlay} .ha-meta{margin-top:4px;color:#aebdce;font-size:11px}#${IDS.overlay} .ha-speed{color:#ffcc70;font-weight:900}#${IDS.overlay} .ha-links{display:flex;gap:6px;align-items:center}#${IDS.overlay} .ha-links a{display:grid;place-items:center;width:42px;height:38px;border:1px solid #87531f;border-radius:9px;background:#42230c;color:#fff;text-decoration:none;font-weight:900}#${IDS.overlay} .ha-empty{padding:30px;text-align:center;color:#aebdce}#${IDS.overlay} footer{padding:8px 12px;border-top:1px solid #2f3037;color:#8998aa;font-size:10px}@media(max-width:540px){#${IDS.overlay} .ha-panel{height:94dvh}#${IDS.overlay} .ha-settings{grid-template-columns:1fr 1fr}#${IDS.overlay} .ha-target{grid-template-columns:1fr}#${IDS.overlay} .ha-links{justify-content:flex-end}}`;
    style.textContent += `#${IDS.overlay} .ha-panel{height:min(86dvh,780px);border-radius:16px;background:linear-gradient(180deg,#17131d,#0b1119 42%)}#${IDS.overlay} header{min-height:48px;padding:7px 10px}#${IDS.overlay} header b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#${IDS.overlay} .ha-head-btn{width:36px;min-height:36px}#${IDS.overlay} .ha-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;align-items:center;padding:8px 10px;border-bottom:1px solid #302c35;background:#111722}#${IDS.overlay} .ha-key{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8fd6ad;font-size:11px;font-weight:800}#${IDS.overlay} .ha-toolbar button{min-height:34px;padding:5px 11px;font-size:12px;font-weight:900}#${IDS.overlay} .ha-progress{padding:7px 10px;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#${IDS.overlay} .ha-settings[hidden],#${IDS.overlay} .ha-api-panel[hidden]{display:none!important}#${IDS.overlay} .ha-settings,#${IDS.overlay} .ha-api-panel{max-height:50dvh;overflow:auto;background:#111722}#${IDS.overlay} .ha-api-panel{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px;border-bottom:1px solid #2f3037}#${IDS.overlay} .ha-api-head,#${IDS.overlay} .ha-api-status,#${IDS.overlay} .ha-api-actions,#${IDS.overlay} .ha-api-panel .ha-setup{grid-column:1/-1}#${IDS.overlay} .ha-api-head{display:flex;align-items:center;gap:8px;color:#ffd894}#${IDS.overlay} .ha-api-head b{flex:1}#${IDS.overlay} .ha-api-close{width:36px;min-height:34px;padding:0}#${IDS.overlay} .ha-api-status{color:#8fd6ad;font-size:11px}#${IDS.overlay} .ha-api-actions{display:flex;gap:8px}#${IDS.overlay} .ha-api-actions button{flex:1;font-weight:800}#${IDS.overlay} [data-api-save]{background:linear-gradient(#e57b18,#a8450b);border-color:#ffad45}#${IDS.overlay} .ha-hint{padding:6px 10px;color:#8e9cad;font-size:10px;border-bottom:1px solid #29313a}#${IDS.overlay} .ha-setup{display:grid;place-items:center;flex:1;min-height:38px;border:1px solid #594a43;border-radius:9px;background:#17202a;color:#ffd894;text-decoration:none;font-weight:800}#${IDS.overlay} footer{padding:5px 10px;text-align:center}@media(max-width:540px){#${IDS.overlay}{font-size:13px}#${IDS.overlay} .ha-panel{height:84dvh;border-radius:16px}#${IDS.overlay} .ha-settings,#${IDS.overlay} .ha-api-panel{grid-template-columns:1fr 1fr;gap:7px;padding:8px}#${IDS.overlay} label{font-size:10px}#${IDS.overlay} input{min-height:36px;padding:5px 8px}#${IDS.overlay} .ha-list{padding:7px;gap:7px}#${IDS.overlay} .ha-target{grid-template-columns:minmax(0,1fr) auto;padding:9px}#${IDS.overlay} .ha-links{justify-content:initial}#${IDS.overlay} .ha-links a{width:40px;height:35px}#${IDS.overlay} .ha-hint{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}`;
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
    targets = targets.filter(row => row.statusVerified === true && row.status === 'Okay' &&
      num(row.verifiedAt) > 0 && Date.now() - num(row.verifiedAt) <= STATUS_TTL && (!settings.includeInactive || isInactiveTarget(row)));
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
      const intel = `${row.ff != null ? ' · FF ' + num(row.ff).toFixed(2) : ''}${row.bs != null ? ' · BS ' + esc(formatBS(row.bs)) : ''}`;
      const bounty = row.hasBounty ? ` · 🎯 BOUNTY ${money(row.reward)}` : ' · FĂRĂ BOUNTY';
      card.innerHTML = `<div><div class="ha-name">${esc(row.name)} <small>[${row.id}]</small></div><div class="ha-meta"><span class="ha-speed">${esc(speedLabel(row))}</span> · LIVE OKAY ✓${intel}${row.level != null ? ' · L' + esc(row.level) : ''}${bounty}</div></div><div class="ha-links"><a href="https://www.torn.com/page.php?sid=attack&user2ID=${row.id}" title="Attack">ATK</a><a href="https://www.torn.com/profiles.php?XID=${row.id}" target="_blank" rel="noopener noreferrer" title="Profile">👤</a></div>`;
      list.appendChild(card);
    }
  }
  function saveSettingsFromUI() {
    const overlay = $('#' + IDS.overlay);
    settings.maxPages = DEFAULTS.maxPages;
    settings.maxFF = DEFAULTS.maxFF;
    settings.maxResults = Math.max(5, Math.min(100, num($('[data-results]', overlay)?.value) || DEFAULTS.maxResults));
    settings.statusChecks = Math.max(10, Math.min(160, num($('[data-checks]', overlay)?.value) || DEFAULTS.statusChecks));
    settings.includeBounties = false;
    settings.includeInactive = true;
    settings.useTornTargets = false;
    settings.useBaldr = true;
    settings.inactiveDays = Math.max(1, Math.min(365, Math.floor(num($('[data-days]', overlay)?.value) || 1)));

    settings.discoveryLimit = 2500;
    write(KEYS.settings, settings);
    setProgress('Setările scanării au fost salvate');
  }
  function refreshApiPanel(overlay = $('#' + IDS.overlay)) {
    if (!overlay) return;
    const localTorn = validKey(String(localStorage.getItem(KEYS.torn) || '').trim());
    const localFF = validKey(String(localStorage.getItem(KEYS.ff) || '').trim());
    const source = $('[data-api-source]', overlay);
    const toolbar = $('.ha-key', overlay);
    const text = `Torn: ${keySource()} · FFScouter: ${localFF ? 'local' : validKey(getFFKey()) ? 'cheie disponibilă' : 'fără cheie'} · Baldr: automat`;
    if (source) source.textContent = text;
    if (toolbar) toolbar.textContent = `API: ${keySource()} · CORE ${SHARED_CORE?.version || '—'}`;
    const clear = $('[data-api-clear]', overlay);
    if (clear) clear.disabled = !localTorn && !localFF;
  }
  function saveApiKeysFromUI() {
    const overlay = $('#' + IDS.overlay);
    const torn = String($('[data-torn]', overlay)?.value || '').trim();
    const ff = String($('[data-ff]', overlay)?.value || '').trim();
    if (torn && !validKey(torn)) { setProgress('Cheia Torn trebuie să aibă exact 16 caractere alfanumerice'); return; }
    if (ff && !validKey(ff)) { setProgress('Cheia FFScouter trebuie să aibă exact 16 caractere alfanumerice'); return; }
    if (!torn && !ff) { setProgress('Introdu cel puțin o cheie API'); return; }
    if (torn) localStorage.setItem(KEYS.torn, torn);
    if (ff) localStorage.setItem(KEYS.ff, ff);
    $('[data-torn]', overlay).value = '';
    $('[data-ff]', overlay).value = '';
    refreshApiPanel(overlay);
    setProgress('Cheile API au fost salvate');
  }
  function clearApiKeys() {
    const overlay = $('#' + IDS.overlay);
    localStorage.removeItem(KEYS.torn);
    localStorage.removeItem(KEYS.ff);
    $('[data-torn]', overlay).value = '';
    $('[data-ff]', overlay).value = '';
    refreshApiPanel(overlay);
    setProgress('Cheile API locale au fost șterse');
  }
  function ensureUI() {
    ensureStyle();
    let launcher = $('#' + IDS.launcher);
    if (!launcher) {
      launcher = document.createElement('button'); launcher.id = IDS.launcher; launcher.type = 'button'; launcher.textContent = '🎃'; launcher.title = 'SakaLuX Halloween Assistant';
      launcher.onclick = open; document.body.appendChild(launcher);
    }
    SHARED_CORE?.ui?.makeDraggable?.(launcher, { storageKey: 'SLX_HALLOWEEN_LAUNCHER_POSITION_V1', padding: 6 });
    let overlay = $('#' + IDS.overlay);
    if (!overlay) {
      overlay = document.createElement('div'); overlay.id = IDS.overlay; overlay.hidden = true;
      overlay.innerHTML = `<section class="ha-panel"><header><b>🎃 Halloween Assistant <small>v${VERSION}</small></b><button class="ha-head-btn" data-key title="Chei API">🔑</button><button class="ha-head-btn" data-close>×</button></header><div class="ha-toolbar"><span class="ha-key">API: ${esc(keySource())} · CORE ${esc(SHARED_CORE?.version || '—')}</span><button data-settings>⚙ SETĂRI</button><button data-scan>SCAN</button></div><div class="ha-api-panel" hidden><div class="ha-api-head"><b>🔑 CHEI API</b><button class="ha-api-close" data-api-close>×</button></div><div class="ha-api-status" data-api-source></div><div class="ha-keyline"><label>Cheie Torn<input data-torn type="password" maxlength="16" autocomplete="off" placeholder="Hub/PDA automat"></label><a class="ha-setup" data-generate-torn href="https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Halloween%20Assistant&user=basic&torn=bounties" target="_blank" rel="noopener noreferrer">🔑 GENEREAZĂ</a></div><div class="ha-keyline"><label>Cheie FFScouter<input data-ff type="password" maxlength="16" autocomplete="off" placeholder="Cheie FFScouter"></label><a class="ha-setup" href="https://ffscouter.com/" target="_blank" rel="noopener noreferrer">🔑 OBȚINE</a></div><div class="ha-api-actions"><button data-api-save>SALVEAZĂ CHEILE</button><button data-api-clear>ȘTERGE LOCALE</button></div></div><div class="ha-progress" data-progress>Pregătit pentru scanare</div><div class="ha-settings" hidden><label>Rezultate<input data-results type="number" min="5" max="100" value="${settings.maxResults}"></label><label>Verificări live<input data-checks type="number" min="10" max="160" value="${settings.statusChecks}"></label><label>Inactiv minimum (zile)<select data-days>${[1,3,7,14,30].map(d => '<option value="' + d + '"' + (num(settings.inactiveDays) === d ? ' selected' : '') + '>' + d + ' zile</option>').join('')}</select></label><div class="ha-actions"><button data-save>SALVEAZĂ SETĂRILE</button></div></div><div class="ha-hint">FFSCOUTER → BALDR · doar Torn Okay + inactivi</div><div class="ha-list"></div></section>`;
      overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
      $('[data-close]', overlay).onclick = close;
      $('[data-save]', overlay).onclick = saveSettingsFromUI;

      $('[data-api-save]', overlay).onclick = saveApiKeysFromUI;
      $('[data-api-clear]', overlay).onclick = clearApiKeys;
      $('[data-api-close]', overlay).onclick = () => { $('.ha-api-panel', overlay).hidden = true; };
      $('[data-scan]', overlay).onclick = () => { saveSettingsFromUI(); void scan(true); };
      $('[data-settings]', overlay).onclick = () => { const panel = $('.ha-settings', overlay); $('.ha-api-panel', overlay).hidden = true; panel.hidden = !panel.hidden; };
      $('[data-key]', overlay).onclick = () => { const panel = $('.ha-api-panel', overlay); $('.ha-settings', overlay).hidden = true; panel.hidden = !panel.hidden; refreshApiPanel(overlay); if (!panel.hidden) $('[data-torn]', overlay)?.focus(); };
      document.body.appendChild(overlay);
      const panel = $('.ha-panel', overlay);
      SHARED_CORE?.ui?.ensureDonationFooter?.(panel, {
        id: 'halloween-assistant',
        showMoney: false,
        itemsLabel: '🇷🇴 Special for REK family 🪖',
        layout: 'inline'
      });
      overlay._slxWorkspaceCleanup = SHARED_CORE?.ui?.applyWorkspaceLayout?.(overlay, panel, { top: 0, bottom: 8, side: 4, maxWidth: 760, radius: 16 }) || null;
      refreshApiPanel(overlay);
    }
    return overlay;
  }
  function open() { const overlay = ensureUI(); overlay.hidden = false; targets = []; renderTargets(); if (!scanning) void scan(true); return true; }
  function close() { const overlay = $('#' + IDS.overlay); if (overlay) overlay.hidden = true; }
  setInterval(() => { if (targets.length) renderTargets(); }, 5000);
  function schedule() { clearInterval(timer); if (settings.autoRefresh) timer = setInterval(() => { if (!document.hidden && !scanning) { targets = []; renderTargets(); void scan(true); } }, Math.max(30, num(settings.refreshSeconds) || 90) * 1000); }
  function health() { return { version: VERSION, core: SHARED_CORE?.version || null, ready: true, scanning, targets: targets.length, bountyTargets: targets.filter(row => row.hasBounty).length, supplementalTargets: targets.filter(row => !row.hasBounty).length, lastScanMs, boardCacheAge: Date.now() - num(boardCache.at), targetPoolAge: Date.now() - num(targetPool.at), ffCache: Object.keys(ffCache).length, statusCache: Object.keys(statusCache).length, hasTornKey: validKey(getTornKey()), hasFFKey: validKey(getFFKey()), lastError, lastWarning }; }

  globalThis.SakaLuXHalloweenAssistant = Object.freeze({ version: VERSION, open, close, scan: () => scan(true), health });
  function start() { pruneCaches(); ensureUI(); schedule(); window.dispatchEvent(new CustomEvent('SakaLuXHalloweenAssistantReady', { detail: { version: VERSION } })); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
