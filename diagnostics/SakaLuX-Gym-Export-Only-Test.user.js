// ==UserScript==
// @name         SakaLuX Gym Export Only Test
// @namespace    https://sakalux.ro/
// @version      1.1.0-export-only
// @description  Safe Gym stat planner with confirmed-only gym suggestions. TornPDA/Tampermonkey.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @homepageURL  https://github.com/SakaLuX/SakaLuX-Script-HUB
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
        style.textContent = `.slx-shared-donation{display:block!important;flex:0 0 50px!important;width:100%!important;height:50px!important;min-height:50px!important;margin:0!important;padding:0!important;box-sizing:border-box!important;overflow:hidden!important;border-top:1px solid rgba(255,255,255,.08)!important;background:#080d13!important;font-family:Inter,Arial,sans-serif!important}.slx-shared-donation *{box-sizing:border-box!important}.slx-shared-donation-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;height:28px!important;padding:4px 10px!important}.slx-shared-donation button{display:block!important;width:100%!important;height:20px!important;min-height:20px!important;margin:0!important;padding:0 4px!important;border:1px solid #2d3d50!important;border-radius:8px!important;background:#151f2a!important;color:#c5d2df!important;font:900 8px/1.2 Inter,Arial,sans-serif!important;letter-spacing:.04em!important;white-space:nowrap!important;box-shadow:none!important}.slx-shared-donation-made{height:22px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;padding:0 6px!important;border-top:1px solid rgba(223,154,55,.52)!important;color:#df9a37!important;font:500 9px/20px Inter,Arial,sans-serif!important;white-space:nowrap!important}.slx-shared-donation-made a{color:#78aef2!important;font-weight:900!important;text-decoration:none!important}.slx-shared-donation.slx-shared-donation-inline{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;flex:0 0 29px!important;height:29px!important;min-height:29px!important}.slx-shared-donation-inline .slx-shared-donation-actions{height:29px!important;padding:4px 6px 4px 10px!important}.slx-shared-donation-inline .slx-shared-donation-made{height:29px!important;border-top:0!important;padding:0 10px 0 6px!important}`;
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
  if (window.SakaLuXGymOptimizer) return;
  const KEY='slx_gym_optimizer_v1';
  const stats=['Strength','Speed','Defense','Dexterity'];
  const defaults={mode:'SakaLuX',weights:{Strength:0.8,Speed:1,Defense:0,Dexterity:1.25},values:{Strength:0,Speed:0,Defense:0,Dexterity:0},history:[],enabled:true};
  const presets={
    Balanced:[1,1,1,1],
    '3-stat (Defense dump)':[1,1,0,1],
    '3-stat (Dexterity dump)':[1,1,1,0],
    '2-stat (Str/Dex)':[1,0,0,1],
    '2-stat (Speed/Dex)':[0,1,0,1],
    // Strategy labels are adjustable starting templates, NOT purported StatForge equations.
    Baldr:[0.8,1,0,1],
    Hank:[1,1,1,0],
    SakaLuX:[0.8,1,0,1.25],
    Custom:[1,1,1,1]
  };
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
  const legacy=saved.mode==='Aec3';
  const state={...defaults,...saved,mode:legacy?'SakaLuX':(saved.mode||defaults.mode),values:{...defaults.values,...saved.values},weights:legacy?{Strength:0.8,Speed:1,Defense:0,Dexterity:1.25}:{...defaults.weights,...saved.weights}};
  if(legacy)try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const onGym=()=>/gym\.php/i.test(location.href)||/\bGym\b/i.test(document.title)&&/torn/i.test(location.host);
  const fmt=n=>Math.round(Number(n)||0).toLocaleString('en-US');
  const css=document.createElement('style');
  css.textContent='#slx-gym-toggle{position:fixed;right:10px;bottom:80px;z-index:2147483000;padding:9px 13px;background:#164d62;color:white;border:1px solid #59b9d5;border-radius:13px;font-weight:800}#slx-gym-panel{position:relative;z-index:1;width:100%;inset:auto;max-width:100%;margin:12px 0;background:#131923;color:#e8edf4;border:1px solid #52667a;border-radius:14px;display:flex;flex-direction:column;font:14px Arial,sans-serif;box-sizing:border-box;overflow:hidden}#slx-gym-panel[hidden],#slx-gym-toggle[hidden]{display:none!important}#slx-gym-panel .body{max-height:none!important}#slx-gym-panel .head button{display:none}#slx-gym-panel .head{display:flex;justify-content:space-between;padding:14px;background:#212c3b;font-weight:800}#slx-gym-panel .body{padding:12px;overflow:auto;flex:1}#slx-gym-panel input,#slx-gym-panel select{background:#0c1017;color:white;border:1px solid #52667a;border-radius:7px;padding:7px;max-width:100%;box-sizing:border-box}#slx-gym-panel button{background:#24566a;color:white;border:1px solid #557a8d;border-radius:8px;padding:8px;cursor:pointer}#slx-gym-panel .stat{display:grid;grid-template-columns:1fr 112px 64px;gap:6px;margin:7px 0;align-items:center}#slx-gym-panel .hint{font-size:12px;color:#aebdca;line-height:1.5}#slx-gym-panel .notice{padding:10px;background:#243544;border-radius:10px;margin:12px 0}';
  css.textContent += '#slx-gym-panel .slx-g-title{color:#888!important;font-size:12px!important;letter-spacing:2px!important;font-weight:bold!important;border-bottom:1px solid #333!important;padding:9px 0 5px!important;margin:8px 0!important}#slx-gym-panel{display:block!important;min-height:0!important;height:auto!important;overflow:visible!important;margin:8px 0 12px!important;border-radius:10px!important;background:#1b1b1b!important;border:1px solid #424242!important}#slx-gym-panel[hidden]{display:none!important}#slx-gym-panel .head{padding:8px 11px!important;font-size:13px!important;background:#303030!important;align-items:center}#slx-gym-panel .body{display:block!important;padding:10px!important;overflow:visible!important;flex:none!important}#slx-gym-panel .stat{grid-template-columns:minmax(65px,1fr) 90px 52px!important;gap:5px!important;margin:4px 0!important}#slx-gym-panel input,#slx-gym-panel select{padding:5px!important;font-size:13px!important;min-width:0!important}#slx-gym-panel .notice{margin:6px 0!important;padding:9px!important;border-left:3px solid #428cbe!important;background:#282828!important;font-size:13px!important}#slx-gym-panel .hint{font-size:11px!important;line-height:1.3!important}#slx-gym-panel .settings{display:none}#slx-gym-panel.expanded .settings{display:block}#slx-gym-panel .head button{display:inline-block!important;padding:4px 9px!important;font-size:12px!important}#slx-gym-panel .summary{font-size:12px;color:#c8d3dc;margin:5px 0}#slx-gym-panel .actions{display:flex;flex-wrap:wrap;gap:5px}#slx-gym-panel button{padding:6px!important;font-size:12px!important}';
  css.textContent += '#slx-gym-panel{font:13px Arial,sans-serif!important;background:#1b1b1b!important;color:#ddd!important;border:1px solid #383838!important;border-radius:6px!important;margin:10px 0!important;padding:8px 12px!important;box-shadow:none!important;position:relative!important;height:auto!important;max-height:none!important;z-index:1!important}#slx-gym-panel .head{background:transparent!important;color:#bbb!important;border-bottom:1px solid #383838!important;padding:8px 2px!important;letter-spacing:1px;font-size:13px!important}#slx-gym-panel .body{padding:4px!important;background:transparent!important;overflow:visible!important}#slx-gym-panel .notice{background:#262626!important;border:1px solid #383838!important;border-left:4px solid #4b96c3!important;color:#ddd!important;border-radius:6px!important;margin:8px 0!important;padding:12px 10px!important;font-size:13px!important}#slx-gym-panel .hint{color:#b1b1b1!important}#slx-gym-panel .settings{border-top:1px solid #393939!important;padding-top:8px}#slx-gym-panel .stat{margin:5px 0!important}#slx-gym-panel[hidden]{display:none!important}';
  css.textContent += '#slx-gym-panel{position:static!important;inset:auto!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;float:none!important;clear:both!important;display:block!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important;margin:12px 0!important;isolation:isolate!important}#slx-gym-panel[hidden]{display:none!important}';
  css.textContent += '#slx-gym-panel .slx-g-stat{margin:10px 1px!important}#slx-gym-panel .slx-g-statline{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px!important}#slx-gym-panel .slx-g-track{height:9px;border-radius:8px;background:#343434;margin:5px 0;overflow:hidden}';
  css.textContent += '#slx-gym-panel{background:#1c1c1c!important;color:#ddd!important;border:1px solid #303030!important;border-radius:7px!important;padding:5px 9px!important;margin:8px 0 14px!important;font:12px Arial,sans-serif!important;line-height:1.25!important}#slx-gym-panel .head{background:transparent!important;border-bottom:1px solid #363636!important;padding:7px 3px!important;font-size:12px!important}#slx-gym-panel .body{padding:5px 3px!important}#slx-gym-panel .notice{padding:7px 9px!important;margin:5px 0 9px!important;border-radius:5px!important;font-size:12px!important}#slx-gym-panel .slx-g-title{padding:5px 0 3px!important;margin:6px 0!important;font-size:11px!important}#slx-gym-panel .slx-g-stat{margin:7px 1px!important}#slx-gym-panel .slx-g-statline{font-size:12px!important}#slx-gym-panel .slx-g-track{height:7px!important;margin:4px 0!important}#slx-gym-panel .hint{font-size:11px!important;line-height:1.25!important}#slx-gym-panel button,#slx-gym-panel select{font-size:12px!important;padding:4px 6px!important}';
  css.textContent += '#slx-gym-panel{padding:0!important;background:#171717!important;border:1px solid #343434!important;border-top:3px solid #67b9eb!important;border-radius:5px!important;color:#ccc!important;font:12px Arial,sans-serif!important;overflow:hidden!important}#slx-gym-panel>.head{display:none!important}#slx-gym-panel .body{padding:0!important}#slx-gym-panel .sf-top{display:flex;justify-content:space-between;align-items:center;padding:13px 17px 12px;background:#171717;font-size:17px;letter-spacing:2px;border-bottom:1px solid #050505}#slx-gym-panel .sf-top strong{color:#78bdf0}#slx-gym-panel .sf-top span{color:#888;font-size:10px;letter-spacing:1px}#slx-gym-panel .sf-tabs{display:flex;justify-content:space-around;gap:1px;border-bottom:1px solid #070707;background:#161616}#slx-gym-panel .sf-tabs button{background:transparent!important;border:0!important;color:#888!important;padding:8px 3px!important;font-weight:bold!important;letter-spacing:1px!important;font-size:10px!important;flex:1}#slx-gym-panel .sf-tabs button.active{color:#6db9e5!important;border-bottom:2px solid #67baff!important}#slx-gym-panel .sf-overview{display:flex;justify-content:space-between;padding:20px 16px 12px;gap:7px}#slx-gym-panel .sf-eyebrow,#slx-gym-panel .sf-section{color:#999;letter-spacing:2px;font-size:11px;font-weight:bold}#slx-gym-panel .sf-ratio{display:flex;gap:9px;align-items:center;margin-top:9px}#slx-gym-panel .sf-ratio>b{font-size:40px;color:#f2bc32}#slx-gym-panel .sf-ratio span{font-weight:bold}#slx-gym-panel .sf-ratio small{display:block;color:#999}#slx-gym-panel .sf-total{font-size:28px;font-weight:bold;color:#78bafb;margin:6px 0}#slx-gym-panel .sf-gain{font-size:10px;letter-spacing:1px;color:#49cc83;font-weight:bold}#slx-gym-panel .sf-section{border-top:1px solid #323232;margin:9px 17px;padding-top:9px}#slx-gym-panel .sf-card{background:#242424;border:1px solid #3a3a3a;border-left:4px solid #5fb8ee;margin:6px 17px 14px;padding:12px 15px;border-radius:5px;line-height:1.4;color:#aaa;font-weight:600}#slx-gym-panel .sf-main{font-size:19px;font-weight:900;margin-bottom:3px}#slx-gym-panel .sf-purple{color:#b58dd8}#slx-gym-panel .sf-gold{color:#e9c247;margin-top:5px}#slx-gym-panel .sf-cap{display:flex;justify-content:space-between;margin:8px 0;font-size:13px}#slx-gym-panel .sf-card p{font-size:11px;color:#999;font-weight:400;margin-top:10px}#slx-gym-panel .sf-stat{margin:9px 17px 13px}#slx-gym-panel .sf-statline{display:flex;align-items:baseline;gap:7px;font-weight:800;font-size:14px}#slx-gym-panel .sf-statline small{font-size:10px;color:#aaa}#slx-gym-panel .sf-statline b{margin-left:auto;font-size:12px}#slx-gym-panel .sf-track{height:9px;border-radius:10px;background:#303030;margin:6px 0;overflow:hidden}#slx-gym-panel .sf-track>div{height:100%;border-radius:9px}#slx-gym-panel .sf-statmessage{font-size:11px;color:#aaa}#slx-gym-panel .sf-settings{padding:8px 16px 17px}#slx-gym-panel .sf-edit{display:grid;grid-template-columns:1fr 100px 58px;gap:5px;margin:7px 0;align-items:center}#slx-gym-panel .sf-edit input{min-width:0}#slx-gym-panel select{max-width:70%}';
  (document.head||document.documentElement).append(css);
  const toggle=document.createElement('button');toggle.id='slx-gym-toggle';toggle.textContent='GYM ⚡';
  const panel=document.createElement('section');panel.id='slx-gym-panel';panel.hidden=true;
  panel.innerHTML='<div class="head"><span>SAKALUX GYM · v1.1.0</span><button data-settings>Settings ▾</button></div><div class="body"></div>';
  (document.body||document.documentElement).append(panel);
  toggle.hidden=true;
  const body=panel.querySelector('.body');
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Reading exact personal stats from arbitrary page text is ambiguous; manual values are authoritative.
  const target=()=>{
    const weights=stats.map(s=>Math.max(0,Number(state.weights[s])||0));
    const active=weights.map((w,i)=>w?i:-1).filter(x=>x>=0);
    if(!active.length)return null;
    const mean=Math.max(...active.map(i=>state.values[stats[i]]/weights[i]),1);
    const gaps=active.map(i=>({stat:stats[i],gap:Math.max(0,Math.ceil(mean*weights[i]-state.values[stats[i]]))}));
    gaps.sort((a,b)=>b.gap-a.gap);return gaps[0];
  };
  function confirmedGym(){
    // Never infer unlocked status from missing CSS classes, a gym title, or the existence of a locked button.
    // A user-confirmed gym is the one currently selected; alternate gyms require manual selection.
    const gym=document.querySelector('[class*="gymName"],[class*="selectedGym"],[data-testid="current-gym"]');
    return gym?.textContent?.trim().slice(0,80)||null;
  }
  const statColors={Strength:'#ff8754',Speed:'#37c9d9',Defense:'#ab86ec',Dexterity:'#38cb78'};
  const statNumber=s=>Number(String(s).replace(/,/g,''))||0;
  function nativeStats(){
    const found={};
    // Read individual Torn training tile headings, never global HUD or injected text.
    const buttons=[...document.querySelectorAll('button,input[type="button"]')].filter(b=>!panel.contains(b)&&/^train$/i.test((b.textContent||b.value||'').trim()));
    for(const button of buttons){
      let node=button.parentElement;
      for(let d=0;node&&d<5;d++,node=node.parentElement){
        if(node.contains(panel))break;
        const text=(node.innerText||'').replace(/\s+/g,' ');
        const matched=stats.find(n=>new RegExp('^'+n+'\\s+[\\d,.]+','i').test(text));
        if(!matched)continue;
        const value=text.match(new RegExp('^'+matched+'\\s+([\\d,]+(?:\\.\\d+)?)','i'));
        if(value&&statNumber(value[1])>0){found[matched]=statNumber(value[1]);break}
      }
    }
    return found;
  }
  function render(){
    const live=nativeStats(),actual={...state.values,...live};
    const active=stats.filter(n=>Number(state.weights[n])>0 && Number(actual[n])>0);
    const baseline=active.length?Math.max(...active.map(n=>actual[n]/state.weights[n])):0;
    const targets=Object.fromEntries(stats.map(n=>[n,Number(state.weights[n])>0?Math.ceil(baseline*state.weights[n]):0]));
    const gaps=active.map(n=>({stat:n,gap:Math.max(0,targets[n]-actual[n])})).sort((a,b)=>b.gap-a.gap);
    const next=active.length>=2&&gaps.some(x=>x.gap>0)?gaps[0]:null;
    const gym=confirmedGym(),total=stats.reduce((sum,n)=>sum+(Number(actual[n])||0),0);
    const complete=stats.every(n=>Number(actual[n])>0);
    const pct=active.length?Math.round(100*active.reduce((sum,n)=>sum+Math.min(1,(actual[n]||0)/(targets[n]||1)),0)/active.length):0;
    const snapshots=state.history||[];
    const previous=snapshots[snapshots.length-1]?.values||{};
    const oldTotal=stats.reduce((sum,n)=>sum+(Number(previous[n])||0),0);
    const gain=oldTotal?total-oldTotal:null;
    const tab=panel.dataset.tab||'OVERVIEW';
    const esc=escape;
    const tabs=['OVERVIEW','HISTORY','EXPORT','SETTINGS','INFO'];
    const header='<div class="sf-top"><strong>SAKALUX GYM</strong><span>SAKALUX · DEXTERITY HIGH</span></div><div class="sf-tabs">'+tabs.map(t=>'<button data-tab="'+t+'" class="'+(tab===t?'active':'')+'">'+t+'</button>').join('')+'</div>';
    const info='<div class="sf-overview"><div><div class="sf-eyebrow">RATIO HEALTH</div><div class="sf-ratio"><b>'+(!complete?'—':pct>=98?'A':pct>=90?'B':pct>=80?'C':'D')+'</b><span>'+(!complete?'Awaiting stats':pct+'% toward targets')+'<small>SakaLuX Ratio</small></span></div></div><div style="text-align:right"><div class="sf-eyebrow">TOTAL BATTLE STATS</div><div class="sf-total">'+(total?fmt(total):'—')+'</div><div class="sf-gain">'+(gain==null?'NO SAVED BASELINE':(gain>=0?'+':'')+fmt(gain)+' SINCE SNAPSHOT')+'</div></div></div>';
    const train='<div class="sf-section">TRAIN NEXT</div><div class="sf-card">'+(next?'<div class="sf-main" style="color:'+statColors[next.stat]+'">'+esc(next.stat)+'</div><div>Currently at '+fmt(actual[next.stat])+' - Target '+fmt(targets[next.stat])+' - Need +'+fmt(next.gap)+'</div><div class="sf-purple">Catch-up — train the furthest-behind active stat.</div>':'<div class="sf-main">Waiting for stat values</div><div>Open Settings if automatic reading is incomplete.</div>')+'<div class="sf-gold">Best gym: '+(gym?esc(gym)+' (current; unlock verified only for current gym)':'not verified — choose manually in Torn')+'</div></div>';
    const headroom='<div class="sf-section">▼ HEADROOM TO GYM LIMIT</div><div class="sf-card"><div>Energy: read from Torn HUD</div>'+stats.map(n=>'<div class="sf-cap"><b style="color:'+statColors[n]+'">'+n+'</b><span>limit not verified</span></div>').join('')+'<p>Special gym caps cannot be validated. No locked gym will be recommended or switched to.</p></div>';
    const statView='<div class="sf-section">▼ STATS</div>'+stats.map((n,i)=>{
      const value=Number(actual[n])||0,t=targets[n],w=Number(state.weights[n])||0,progress=t?Math.min(100,100*value/t):0;
      const order=[...stats].sort((a,b)=>(Number(actual[b])||0)-(Number(actual[a])||0)).indexOf(n)+1;
      const message=w===0?'! Dump - minimize':!value?'Unknown - enter stats':value>=t?'OK - on target':'Need +'+fmt(t-value);
      return '<div class="sf-stat"><div class="sf-statline"><span style="color:'+statColors[n]+'">'+n+'</span><small>'+(w===0?'DUMP':order===1?'1ST':order===2?'2ND':order===3?'3RD':'4TH')+'</small><b>'+fmt(value)+(t?' / '+fmt(t):'')+'</b></div><div class="sf-track"><div style="width:'+progress+'%;background:'+statColors[n]+'"></div></div><div class="sf-statmessage">'+message+'</div></div>';
    }).join('');
    const settings='<div class="sf-section">STRATEGY SETTINGS</div><div class="sf-settings"><label>Strategy <select id="slx-gym-mode">'+Object.keys(presets).map(n=>'<option '+(state.mode===n?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select></label><p>Custom weights are planning targets; exact StatForge formulas are not yet verified.</p>'+stats.map(n=>'<div class="sf-edit"><label>'+n+'</label><input type="number" data-value="'+n+'" value="'+(Number(actual[n])||0)+'"><input type="number" step=".05" min="0" data-weight="'+n+'" value="'+(Number(state.weights[n])||0)+'"></div>').join('')+'<button id="slx-gym-calc">Save values</button></div>';
    const history='<div class="sf-section">HISTORY</div><div class="sf-card"><button id="slx-gym-history">Save current snapshot</button><button id="slx-gym-clear">Clear snapshots</button><p>'+snapshots.length+' saved snapshots</p>'+snapshots.slice(-8).reverse().map(x=>'<div>'+esc(x.at)+' · '+fmt(stats.reduce((sum,n)=>sum+(Number(x.values[n])||0),0))+' total</div>').join('')+'</div>';
    const summary='=== SakaLuX Gym Export ===\nDate: '+new Date().toLocaleString()+'\nRatio: '+state.mode+' | High: '+(state.highStat||'Dexterity')+'\nHealth: '+(complete?pct+'%':'unverified')+' | TBS: '+fmt(total)+'\n\nSTAT       CURRENT     TARGET      STATUS\n'+stats.map(n=>n.padEnd(11)+fmt(actual[n]).padEnd(12)+(targets[n]?fmt(targets[n]):'dump').padEnd(12)+(Number(state.weights[n])===0?'Minimize':(actual[n]>=targets[n]?'At target':'Below target'))).join('\n');
    const exporter='<div class="sf-section">EXPORT SNAPSHOT</div><div class="sf-export"><p>Copy a plain-text summary of your current ratio health and target stats.</p><button id="slx-gym-copy">COPY TO CLIPBOARD</button><pre>'+escape(summary)+'</pre><button id="slx-gym-export">EXPORT HISTORY CSV</button></div>';
    const about='<div class="sf-section">INFO</div><div class="sf-card">SakaLuX Gym Optimizer v1.1.0 — inline training planner. DEX-focused SakaLuX strategy. Recommendations are advisory and do not automatically train or switch gyms. Formula and unlock verification are pending.</div>';
    body.innerHTML=header+(tab==='OVERVIEW'?info+train+headroom+statView:tab==='HISTORY'?history:tab==='EXPORT'?exporter:tab==='SETTINGS'?settings:about);
    body.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{panel.dataset.tab=b.dataset.tab;render()});
    body.querySelector('#slx-gym-mode')?.addEventListener('change',e=>{state.mode=e.target.value;stats.forEach((n,i)=>state.weights[n]=presets[state.mode][i]);save();render()});
    body.querySelector('#slx-gym-calc')?.addEventListener('click',()=>{
      body.querySelectorAll('[data-value]').forEach(el=>state.values[el.dataset.value]=Math.max(0,Number(el.value)||0));
      body.querySelectorAll('[data-weight]').forEach(el=>state.weights[el.dataset.weight]=Math.max(0,Number(el.value)||0));
      save();render();
    });
    body.querySelector('#slx-gym-history')?.addEventListener('click',()=>{state.history.push({at:new Date().toISOString(),values:{...actual}});state.history=state.history.slice(-180);save();render()});
    body.querySelector('#slx-gym-clear')?.addEventListener('click',()=>{if(confirm('Clear local gym snapshots?')){state.history=[];save();render()}});
    body.querySelector('#slx-gym-copy')?.addEventListener('click',()=>{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(summary).catch(()=>{});else{const el=document.createElement('textarea');el.value=summary;document.body.appendChild(el);el.select();document.execCommand('copy');el.remove()}});
    body.querySelector('#slx-gym-export')?.addEventListener('click',()=>{
      const rows=[['date',...stats].join(','),...state.history.map(x=>[x.at,...stats.map(n=>Number(x.values[n])||0)].join(','))];
      const a=document.createElement('a'),u=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));
      a.href=u;a.download='sakalux-gym-history.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
    });
  }
  const open=()=>{render();mount();};
  const close=()=>{panel.hidden=true};
  toggle.onclick=open;panel.querySelector('[data-settings]').onclick=()=>{panel.classList.toggle('expanded');panel.querySelector('[data-settings]').textContent=panel.classList.contains('expanded')?'Close settings ▴':'Settings ▾'};
  window.SakaLuXGymOptimizer={open,close,refresh:render,version:'1.1.0',getState:()=>({...state})};
  // Insert ONLY as a normal-flow sibling of Torn's actual training tile group.
  // Previous gym-root insertion overlapped the stat/HUD section on TornPDA.
  function trainingAnchor(){
    const trainButtons=[...document.querySelectorAll('button,input[type="button"],[role="button"]')]
      .filter(el=>!panel.contains(el) && /^(train)$/i.test((el.innerText||el.value||'').trim()));
    for(const btn of trainButtons){
      let node=btn.parentElement;
      for(let depth=0;node&&depth<8;depth++,node=node.parentElement){
        if(node===document.body || node===document.documentElement)break;
        if(node.contains(panel))break;
        const text=(node.innerText||'').slice(0,5000);
        const count=[...node.querySelectorAll('button,input[type="button"],[role="button"]')]
          .filter(b=>/^(train)$/i.test((b.innerText||b.value||'').trim())).length;
        if(count>=3 && count<=5 && /strength/i.test(text) && /dexterity/i.test(text) && node.parentElement){
          // Never mount inside a floating, fixed, or absolute wrapper.
          const parent=node.parentElement;
          if(parent===document.body||parent===document.documentElement) return null;
          return node;
        }
      }
    }
    return null;
  }
  function mount(){
    if(!onGym()||!state.enabled){panel.hidden=true;return}
    const anchor=trainingAnchor();
    if(!anchor){panel.hidden=true;return}
    if(panel.parentElement!==anchor.parentElement || panel.nextElementSibling!==anchor){
      anchor.parentElement.insertBefore(panel,anchor);
    }
    panel.hidden=false;
  }
  render();mount();
  // TornPDA navigates without full reload. Move the inline widget when Gym's React root is replaced.
  let lastUrl=location.href;
  setInterval(()=>{if(location.href!==lastUrl){lastUrl=location.href;render()}mount()},1100);
})();