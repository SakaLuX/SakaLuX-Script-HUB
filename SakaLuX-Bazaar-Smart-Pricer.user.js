// ==UserScript==
// @name         SakaLuX Bazaar Smart Pricer
// @namespace    sakalux.bazaar.smart.pricer
// @version      1.1.13
// @description  SakaLuX Hub-integrated Bazaar quick pricing with exact per-item Quick Add, bulk fill, RW safety and mobile-first settings.
// @author       SakaLuX [2380374] · based on Zedtrooper [3028329]
// @license      MIT
// @match        https://www.torn.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @run-at       document-end
// @noframes
// @homepage     https://github.com/SakaLuX/SakaLuX-Script-HUB
// @supportURL   https://github.com/SakaLuX/SakaLuX-Script-HUB/issues
// @downloadURL  https://update.greasyfork.org/scripts/596672/SakaLuX%20Bazaar%20Smart%20Pricer.user.js
// @updateURL    https://update.greasyfork.org/scripts/596672/SakaLuX%20Bazaar%20Smart%20Pricer.meta.js
// ==/UserScript==

/* SakaLuX Shared Core — BEGIN */
/* SakaLuX Shared Core v1 - test foundation
 * Source-only module. Not installed directly by users.
 * Intended to be embedded into standalone userscripts at build/release time.
 */
(() => {
  'use strict';

  const g = globalThis;
  const CORE_VERSION = '1.1.0';
  const NS = 'SakaLuXCore';

  const SETTINGS_CATALOG = Object.freeze([
    { match: /Account Auditor/i, id: 'account-auditor', version: 1, keys: ['SakaLuX_AUDITOR_SETTINGS_V3'] },
    { match: /Bazaar Smart Pricer/i, id: 'bazaar-smart-pricer', version: 1, keys: ['SakaLuX_BAZAAR_SMART_PRICER_SETTINGS'] },
    { match: /Bazaar Thanker/i, id: 'bazaar', version: 1, keys: ['sakalux_bazaar_thanker_v5'] },
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
      'enhancer','bazaar','bazaar-smart-pricer','mission-rewards','market-intelligence',
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

/* SakaLuX Canonical Installed Version — BEGIN */
(() => {
  'use strict';
  let v = '1.1.13';
  try {
    const meta = globalThis.GM_info && globalThis.GM_info.script && globalThis.GM_info.script.version;
    if (meta) v = String(meta);
  } catch {}
  const g = globalThis;
  g.__SakaLuXInstalledVersions = g.__SakaLuXInstalledVersions || Object.create(null);
  g.__SakaLuXInstalledVersions['bazaar-smart-pricer'] = v;
  try {
    document.documentElement?.setAttribute('data-sakalux-installed-bazaar-smart-pricer', v);
  } catch {}
})();
/* SakaLuX Canonical Installed Version — END */

/* SakaLuX Bazaar Smart Pricer Global Power Bridge — BEGIN */
(() => {
  'use strict';
  const VERSION = '1.1.13';
  const LOCAL_KEY = 'SakaLuX_BAZAAR_SMART_PRICER_ENABLED';
  const GM_KEY = 'moduleEnabled';
  function readEnabled() {
    try { const local = localStorage.getItem(LOCAL_KEY); if (local === '1') return true; if (local === '0') return false; } catch {}
    try { return GM_getValue(GM_KEY, true) !== false; } catch { return true; }
  }
  function writeEnabled(value) {
    const enabled = Boolean(value);
    try { localStorage.setItem(LOCAL_KEY, enabled ? '1' : '0'); } catch {}
    try { GM_setValue(GM_KEY, enabled); } catch {}
    try { window.dispatchEvent(new CustomEvent('SakaLuX:BazaarSmartPricerStateChanged', { detail: { version: VERSION, enabled } })); } catch {}
    return enabled;
  }
  const api = window.SakaLuXBazaarSmartPricer || {};
  api.version = VERSION;
  api.isEnabled = readEnabled;
  api.setEnabled = writeEnabled;
  api.toggleEnabled = () => writeEnabled(!readEnabled());
  api.health = () => ({ ready: true, version: VERSION, enabled: readEnabled(), powerBridge: true, pageActive: location.pathname === '/bazaar.php' });
  window.SakaLuXBazaarSmartPricer = api;
  try {
    let bridge = document.getElementById('sakalux-module-bridge-bazaar-smart-pricer');
    if (!bridge) { bridge = document.createElement('button'); bridge.type = 'button'; bridge.id = 'sakalux-module-bridge-bazaar-smart-pricer'; bridge.hidden = true; (document.body || document.documentElement).appendChild(bridge); }
    const sync = () => { bridge.dataset.version = VERSION; bridge.dataset.enabled = readEnabled() ? 'true' : 'false'; };
    bridge.onclick = () => { const action = bridge.dataset.action; if (action === 'on') writeEnabled(true); else if (action === 'off') writeEnabled(false); else if (action === 'toggle') writeEnabled(!readEnabled()); sync(); };
    sync();
    window.addEventListener('SakaLuX:BazaarSmartPricerStateChanged', sync, { passive: true });
    window.addEventListener('SakaLuX:BazaarSmartPricerPowerRequested', event => { writeEnabled(event?.detail?.enabled); sync(); }, { passive: true });
  } catch {}
})();
/* SakaLuX Bazaar Smart Pricer Global Power Bridge — END */

/* SakaLuX Shared Dock Runtime — BEGIN */
/* SakaLuX Shared Dock Runtime v1 - Priority 6 foundation
 * Source-only module. Not installed directly by users.
 * Intended to be embedded with Shared Core into standalone userscripts.
 */
(() => {
  'use strict';

  const g = globalThis;
  const NS = 'SakaLuXDockRuntime';
  const VERSION = '1.0.0-test.3';
  const HUB_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const OPEN_KEY = 'SakaLuX_STANDALONE_DOCK_OPEN';
  const PROMPT_KEY = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
  const PROMPT_INTERVAL = 12 * 60 * 60 * 1000;
  const IDS = Object.freeze({
    dock: 'sakalux-standalone-dock',
    prompt: 'sakalux-hub-install-prompt',
    native: 'sakalux-standalone-native-s',
    fallback: 'sakalux-standalone-fallback-s',
    style: 'sakalux-standalone-dock-runtime-style'
  });

  if (g[NS]?.version === VERSION) return;

  const modules = g.__SakaLuXDockRuntimeModules instanceof Map
    ? g.__SakaLuXDockRuntimeModules
    : new Map();
  g.__SakaLuXDockRuntimeModules = modules;
  let observer = null;
  let observerQueued = false;
  let runtimeSignalsBound = false;
  let promptScheduled = false;

  function core() { return g.SakaLuXCore || null; }
  function doc() { return typeof document === 'undefined' ? null : document; }
  function hubInstalled() { return Boolean(core()?.hub?.installed?.()); }
  function readOpen() { try { return localStorage.getItem(OPEN_KEY) === '1'; } catch { return false; } }
  function writeOpen(value) { try { localStorage.setItem(OPEN_KEY, value ? '1' : '0'); } catch {} }

  function normalize(entry = {}) {
    const id = String(entry.id || '').trim();
    if (!id) throw new Error('Dock module id is required');
    return Object.freeze({
      id,
      name: String(entry.name || id),
      icon: String(entry.icon || '🧩'),
      version: String(entry.version || ''),
      open: typeof entry.open === 'function' ? entry.open : null,
      enabled: typeof entry.enabled === 'function' ? entry.enabled : () => true
    });
  }

  function sorted() {
    const values = [...modules.values()];
    const sorter = core()?.dock?.sort;
    return typeof sorter === 'function' ? sorter.call(core().dock, values) : values;
  }

  function removeNode(id) { try { doc()?.getElementById(id)?.remove(); } catch {} }

  function removeUi() {
    removeNode(IDS.dock);
    removeNode(IDS.prompt);
    removeNode(IDS.native);
    removeNode(IDS.fallback);
  }

  function addStyle() {
    const d = doc();
    if (!d || d.getElementById(IDS.style)) return;
    const style = d.createElement('style');
    style.id = IDS.style;
    style.textContent = `
#${IDS.dock}{position:fixed;right:10px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:min(220px,calc(100vw - 20px));max-height:calc(100dvh - 190px);overflow:hidden;padding:10px;background:linear-gradient(180deg,rgba(10,14,20,.992),rgba(7,10,15,.992));border:1px solid rgba(255,255,255,.09);border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;display:none;flex-direction:column;box-sizing:border-box}
#${IDS.dock}[data-open="1"]{display:flex}
#${IDS.dock} .slx-dock-head{display:grid;grid-template-columns:28px 1fr auto;gap:7px;align-items:center;margin-bottom:8px}
#${IDS.dock} .slx-dock-mark{width:28px;height:28px;border:0;border-radius:8px;background:#d79b49;color:#111;font-weight:900}
#${IDS.dock} .slx-dock-title{font-size:12px;font-weight:900;color:#f5f7fa}.slx-dock-sub{font-size:9px;color:#8d98a6}
#${IDS.dock} .slx-dock-items{overflow:auto;min-height:0}
#${IDS.dock} .sl-dock-row{display:flex;align-items:center;gap:8px;width:100%;min-height:34px;margin:0 0 6px;padding:7px 9px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:#111b26;color:#eaf0f6;text-align:left;font:700 11px/1.2 Arial,sans-serif}
#${IDS.dock} .sl-dock-row:last-child{margin-bottom:0}#${IDS.dock} .sl-dock-row[disabled]{opacity:.45}
#${IDS.dock} .slx-dock-install{display:block;margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.08);color:#d8a45c;text-align:center;text-decoration:none;font-size:10px;font-weight:800}
#${IDS.fallback}{position:fixed;right:10px;bottom:calc(44px + env(safe-area-inset-bottom,0px));z-index:2147482900;width:38px;height:38px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:#0b1118;color:#e9a84d;font:800 15px/1 Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}
#${IDS.native} .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;font-weight:900!important;color:#e9a84d!important;text-decoration:none!important}
#${IDS.prompt}{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483600;width:min(360px,calc(100vw - 20px));padding:10px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0b1118;color:#eef3f8;font:600 11px/1.35 Arial,sans-serif;box-shadow:0 16px 42px rgba(0,0,0,.45)}
#${IDS.prompt} .slx-prompt-actions{display:flex;gap:7px;margin-top:8px}#${IDS.prompt} button{flex:1;min-height:30px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#17212d;color:#eef3f8;font-weight:800}
`;
    (d.head || d.documentElement).appendChild(style);
  }

  function findStatusIconList() {
    const d = doc();
    if (!d || typeof d.querySelectorAll !== 'function') return null;
    const selectors = ['ul[class*="statusIcons"][class*="big"]','ul[class*="status-icons"][class*="big"]','ul[class*="statusIcons"]','ul[class*="status-icons"]'];
    const lists = selectors.flatMap(q => [...d.querySelectorAll(q)]);
    return lists.find(list => list?.isConnected !== false && [...(list.children || [])].some(item => item.querySelector?.('a'))) || null;
  }

  function copyNativeCell(item, list) {
    try {
      const ref = [...list.children].find(x => x !== item && x.querySelector?.('a'));
      if (!ref) return;
      const native = [...(ref.classList || [])].filter(x => x && !x.startsWith('slx-') && !x.startsWith('sakalux-'));
      item.className = [...native, 'slx-standalone-native'].join(' ');
    } catch {}
  }

  function ensureLauncher() {
    const d = doc();
    if (!d || hubInstalled()) { removeUi(); return null; }
    const list = findStatusIconList();
    if (list && typeof d.createElement === 'function') {
      let item = d.getElementById(IDS.native);
      if (!item) {
        item = d.createElement('li');
        item.id = IDS.native;
        const link = d.createElement('a');
        link.href = '#';
        link.className = 'slx-s-link';
        link.textContent = 'S';
        link.title = 'SakaLuX Scripts';
        link.setAttribute?.('aria-label', 'SakaLuX Scripts');
        link.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(); });
        item.appendChild(link);
      }
      copyNativeCell(item, list);
      const children = [...(list.children || [])].filter(x => x !== item);
      const cashIndex = children.findIndex(x => /\$|cash|money/i.test((x.textContent || '') + ' ' + (x.className || '')));
      const anchor = cashIndex >= 0 ? children[cashIndex] : children[0];
      try { if (anchor?.insertAdjacentElement) anchor.insertAdjacentElement('afterend', item); else list.appendChild(item); } catch { list.appendChild?.(item); }
      removeNode(IDS.fallback);
      return item;
    }
    let button = d.getElementById(IDS.fallback);
    if (!button) {
      button = d.createElement('button');
      button.id = IDS.fallback;
      button.type = 'button';
      button.textContent = 'S';
      button.title = 'SakaLuX Scripts';
      button.addEventListener?.('click', () => toggleDock());
      (d.body || d.documentElement).appendChild(button);
    }
    removeNode(IDS.native);
    return button;
  }

  function ensureDock() {
    const d = doc();
    if (!d || hubInstalled()) { removeUi(); return null; }
    let panel = d.getElementById(IDS.dock);
    if (!panel) {
      panel = d.createElement('div');
      panel.id = IDS.dock;
      panel.dataset.open = readOpen() ? '1' : '0';
      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const close = d.createElement('button'); close.type = 'button'; close.className = 'slx-dock-mark'; close.textContent = 'S'; close.title = 'Close SakaLuX Scripts';
      close.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); });
      const title = d.createElement('div'); title.className = 'slx-dock-title'; title.textContent = 'SakaLuX Scripts';
      const sub = d.createElement('div'); sub.className = 'slx-dock-sub'; sub.textContent = 'Standalone';
      head.appendChild(close); head.appendChild(title); head.appendChild(sub);
      const items = d.createElement('div'); items.className = 'slx-dock-items';
      const install = d.createElement('a'); install.className = 'slx-dock-install'; install.href = HUB_URL; install.textContent = 'Install SakaLuX Hub';
      panel.appendChild(head); panel.appendChild(items); panel.appendChild(install);
      (d.body || d.documentElement).appendChild(panel);
    }
    return panel;
  }

  function toggleDock(force) {
    if (hubInstalled()) { removeUi(); return false; }
    render();
    const panel = doc()?.getElementById(IDS.dock);
    if (!panel) return false;
    const next = typeof force === 'boolean' ? force : panel.dataset.open !== '1';
    panel.dataset.open = next ? '1' : '0';
    panel.hidden = !next;
    writeOpen(next);
    return next;
  }

  function render() {
    const d = doc();
    if (!d) return null;
    if (hubInstalled()) {
      try { d.documentElement?.setAttribute('data-sakalux-hub-active', '1'); } catch {}
      try { d.body?.setAttribute('data-sakalux-hub-active', '1'); } catch {}
      removeUi();
      return null;
    }
    try { d.body?.removeAttribute('data-sakalux-hub-active'); } catch {}
    addStyle();
    ensureLauncher();
    const panel = ensureDock();
    if (!panel) return null;
    const box = typeof panel.querySelector === 'function' ? panel.querySelector('.slx-dock-items') : panel.children?.[1];
    if (!box) return panel;
    box.replaceChildren?.();
    for (const entry of sorted()) {
      const button = d.createElement('button');
      button.type = 'button';
      button.className = 'sl-dock-row';
      button.dataset.moduleId = entry.id;
      button.textContent = `${entry.icon} ${entry.name}`;
      let enabled = true;
      try { enabled = entry.enabled() !== false; } catch { enabled = false; }
      button.disabled = !enabled || !entry.open;
      button.addEventListener?.('click', () => {
        try { entry.open?.(); } finally { toggleDock(false); }
      });
      box.appendChild(button);
    }
    panel.hidden = panel.dataset.open !== '1';
    return panel;
  }

  function maybePrompt() {
    const d = doc();
    if (!d || hubInstalled() || !d.body) return false;
    let last = 0;
    try { last = Number(localStorage.getItem(PROMPT_KEY) || 0); } catch {}
    if (Date.now() - last < PROMPT_INTERVAL || d.getElementById(IDS.prompt)) return false;
    try { localStorage.setItem(PROMPT_KEY, String(Date.now())); } catch {}
    const prompt = d.createElement('div'); prompt.id = IDS.prompt;
    const text = d.createElement('div'); text.textContent = 'Install SakaLuX Script Hub for one control center, health checks and module management.';
    const actions = d.createElement('div'); actions.className = 'slx-prompt-actions';
    const later = d.createElement('button'); later.type = 'button'; later.textContent = 'LATER'; later.addEventListener?.('click', () => prompt.remove());
    const install = d.createElement('button'); install.type = 'button'; install.textContent = 'INSTALL HUB'; install.addEventListener?.('click', () => { location.href = HUB_URL; });
    actions.appendChild(later); actions.appendChild(install); prompt.appendChild(text); prompt.appendChild(actions); d.body.appendChild(prompt);
    return true;
  }

  function scheduleRefresh(delay = 180) {
    if (observerQueued) return;
    observerQueued = true;
    const run = () => { observerQueued = false; render(); };
    const perf = core()?.perf;
    if (typeof perf?.debounce === 'function') perf.debounce('shared-dock-runtime', run, delay); else setTimeout(run, delay);
  }

  function bindRuntimeSignals() {
    if (runtimeSignalsBound) return;
    runtimeSignalsBound = true;
    try {
      core()?.router?.onChange?.(() => scheduleRefresh(180));
      core()?.router?.bind?.();
    } catch {}
    try { g.addEventListener?.('SakaLuX:ScriptHubReady', () => removeUi(), { passive: true }); } catch {}
    try {
      if (!observer && typeof MutationObserver === 'function' && doc()?.body) {
        observer = new MutationObserver(records => {
          if (core()?.perf?.unrelated?.(records)) return;
          scheduleRefresh(240);
        });
        observer.observe(doc().body, { childList: true, subtree: true });
      }
    } catch {}
  }

  function register(entry) {
    const normalized = normalize(entry);
    modules.set(normalized.id, normalized); // latest registration wins
    render();
    bindRuntimeSignals();
    if (!promptScheduled) {
      promptScheduled = true;
      Promise.resolve().then(() => maybePrompt());
    }
    return normalized;
  }

  function unregister(id) {
    const removed = modules.delete(String(id || ''));
    render();
    return removed;
  }

  function list() { return Object.freeze(sorted().map(item => Object.freeze({ ...item }))); }

  const api = Object.freeze({ version: VERSION, ids: IDS, register, unregister, list, render, toggleDock, removeUi, hubInstalled, maybePrompt });
  g[NS] = api;
})();
/* SakaLuX Shared Dock Runtime — END */

/* SakaLuX Shared Dock Registration — BEGIN */
(() => {
  'use strict';
  const SELF = Object.freeze(Object.assign({"id":"bazaar-smart-pricer","name":"Bazaar Smart Pricer","icon":"💰","selector":".qp-chip","fallback":"https://www.torn.com/bazaar.php"}, { version: "1.1.13" }));
  const API_GLOBAL = "SakaLuXBazaarSmartPricer";
  function openSelf() {
    if (SELF.id === 'bazaar-smart-pricer' && location.pathname !== '/bazaar.php') {
      location.href = SELF.fallback || 'https://www.torn.com/bazaar.php';
      return;
    }
    try {
      const api = API_GLOBAL ? window[API_GLOBAL] : null;
      if (api && typeof api.open === 'function') { api.open(); return; }
    } catch {}
    const el = SELF.selector ? document.querySelector(SELF.selector) : null;
    if (el) { el.click(); return; }
    const bridge = document.getElementById('sakalux-module-bridge-' + SELF.id);
    if (bridge) { bridge.dataset.action = 'open'; bridge.click(); return; }
    if (SELF.fallback) location.href = SELF.fallback;
  }
  function register() {
    const dock = globalThis.SakaLuXDockRuntime;
    if (!dock || typeof dock.register !== 'function') throw new Error('SakaLuX Shared Dock Runtime is unavailable');
    dock.register({ ...SELF, open: openSelf });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register, { once: true }); else register();
})();
/* SakaLuX Shared Dock Registration — END */

(() => {
  const id='sakalux-standalone-layer-style';
  if(!document.getElementById(id)){
    const style=document.createElement('style');
    style.id=id;
    style.textContent=`/* Keep managed add-on panels above the shared standalone dock. */
:where(
  [id^="sl-eg-"][id*="panel" i],
  [id^="sakalux-bt-"][id*="settings" i],
  [id^="sl-mr-"][id*="panel" i],
  [id^="sl-mri-"][id*="panel" i],
  [id^="sl-mi-"][id*="panel" i],
  #slx-elim,
  [id^="slx-elim-"][id*="panel" i],
  #ci-root
){z-index:2147483646!important;}
#sakalux-standalone-dock{z-index:2147483500!important;}`;
    (document.head||document.documentElement).appendChild(style);
  }
})();

/*
 * SakaLuX Bazaar Smart Pricer
 * Behavior/UI structure rebased on Torn Bazaar Quick Pricer v2.9.3
 * by Zedtrooper [3028329] / Musa-dabwe contributors, used under MIT License.
 * SakaLuX integration, Hub skin, bonus-item protection and release packaging:
 * SakaLuX [2380374].
 */

(function() {
    'use strict';

    // The userscript runs on every Torn page so Script Hub can always see the
    // canonical installed-version DOM marker above. Keep all Bazaar runtime
    // work strictly scoped to the real Bazaar page.
    if (location.pathname !== '/bazaar.php') return;

    if (typeof GM_getValue === 'undefined') {
        console.error('[SakaLuXBazaarSmartPricer] GM_getValue not available! Please check Tampermonkey settings.');
        return;
    }

    const VERSION = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '1.1.8';

    console.log(`[SakaLuXBazaarSmartPricer] v${VERSION} Starting (PDA optimized)...`);

    if (GM_getValue('pricingModelVersion', '') !== 'market-value-city-floor-v1') {
        GM_setValue('priceCache', {});
        GM_setValue('pricingModelVersion', 'market-value-city-floor-v1');
    }

    // =====================================================================
    // CONFIGURATION
    // =====================================================================

    /** Torn API keys are exactly 16 alphanumeric characters. */
    function isValidApiKey(k) {
        return typeof k === 'string' && /^[a-zA-Z0-9]{16}$/.test(k);
    }

    /** Discounts outside 0–99.9% would produce negative or absurd prices. */
    function clampDiscount(val) {
        const n = parseFloat(val);
        if (!Number.isFinite(n)) return 0;
        return Math.min(Math.max(n, 0), 99.9);
    }

    /** Price-change alert threshold: 0 confirms every change, capped at 1000%. */
    function clampThreshold(val) {
        const n = parseFloat(val);
        if (!Number.isFinite(n)) return 20;
        return Math.min(Math.max(n, 0), 1000);
    }

    // In-memory settings cache: storage is hit once per key, then reads stay in
    // memory (hot paths read settings once per item) and writes go through to
    // GM_setValue immediately.
    const settingsCache = {};
    function getSetting(name, def) {
        if (!(name in settingsCache)) settingsCache[name] = GM_getValue(name, def);
        return settingsCache[name];
    }
    function setSetting(name, val) {
        settingsCache[name] = val;
        GM_setValue(name, val);
    }

    function hubInstalled() {
        try {
            return !!(window.SakaLuXScriptHub || document.documentElement?.getAttribute('data-sakalux-hub-installed') === '1' || document.documentElement?.getAttribute('data-sakalux-hub-active') === '1' || document.getElementById('sakalux-hub-panel') || document.getElementById('sakalux-hub-button'));
        } catch { return false; }
    }

    function getHubSharedApiKey() {
        if (!hubInstalled()) return '';
        try {
            const k=(localStorage.getItem('SakaLuX_HUB_TORN_API_KEY')||'').trim();
            return isValidApiKey(k)?k:'';
        } catch { return ''; }
    }

    function activeApiSource() { return getHubSharedApiKey() ? 'SakaLuX Hub shared key' : (CONFIG.apiKey ? 'Local key' : 'No key'); }

    // Torn PDA key injection — runs once at startup, before any settings read.
    // NOTE: this literal is the ONLY occurrence of the PDA placeholder in the whole
    // file. Torn PDA's script manager does a global find/replace of every occurrence
    // of the placeholder token in the source with the real key before running it — so
    // if the token appears anywhere else (even in a comment or a comparison), that
    // text gets rewritten too and silently breaks. Validate by format instead, never
    // by string equality against the token itself.
    (function persistInjectedPdaKey() {
        const injected = '###PDA-APIKEY###';
        if (isValidApiKey(injected) && injected !== GM_getValue('tornApiKey', '')) {
            GM_setValue('tornApiKey', injected); // persist so it survives even without re-injection
        }
    })();

    const CONFIG = {
        get defaultDiscount() { return getSetting('discountPercent', 0); },
        set defaultDiscount(val) { setSetting('discountPercent', val); },
        get apiKey() {
            const hub=getHubSharedApiKey();
            if (hub) return hub;
            const k = getSetting('tornApiKey', '');
            return isValidApiKey(k) ? k : '';
        },
        set apiKey(val) { setSetting('tornApiKey', val); },
        get disableNpcCheck() { return getSetting('disableNpcCheck', false); },
        set disableNpcCheck(val) { setSetting('disableNpcCheck', val); },
        get skipRwWeapons() { return getSetting('skipRwWeapons', true); },
        set skipRwWeapons(val) { setSetting('skipRwWeapons', val); },
        get skipBonusItems() { return getSetting('skipBonusItems', true); },
        set skipBonusItems(val) { setSetting('skipBonusItems', val); },
        // $1 is Torn's convention for intentional giveaway/transfer listings —
        // batch runs must not "correct" them to market value.
        get skipDollarItems() { return getSetting('skipDollarItems', true); },
        set skipDollarItems(val) { setSetting('skipDollarItems', val); },
        // Direction of the percentage adjustment: true = N% below market (discount,
        // the default), false = N% above market (markup). Replaces the old "type a
        // negative discount" trick that got clamped away — the magnitude is always a
        // positive 0–99.9% and this flag chooses the sign.
        get priceBelowMarket() { return getSetting('priceBelowMarket', true); },
        set priceBelowMarket(val) { setSetting('priceBelowMarket', val); },
        get priceDiffThreshold() { return clampThreshold(getSetting('priceDiffThreshold', 20)); },
        set priceDiffThreshold(val) { setSetting('priceDiffThreshold', clampThreshold(val)); },
        get cacheTimeoutMin() { return getSetting('cacheTimeoutMin', 5); },
        set cacheTimeoutMin(val) { setSetting('cacheTimeoutMin', val); },
        get cacheTimeout() { return Math.max(1, this.cacheTimeoutMin) * 60 * 1000; }
    };

    // =====================================================================
    // PRICE CACHE  (in-memory copy of the persisted cache; stale entries are
    // pruned at startup and writes are debounced into a single GM_setValue so
    // batch runs don't re-serialize the whole object once per item)
    // =====================================================================

    let priceCache = GM_getValue('priceCache', {});
    let priceCachePersistTimer = null;

    (function pruneStalePrices() {
        const now = Date.now();
        let dirty = false;
        for (const id of Object.keys(priceCache)) {
            const entry = priceCache[id];
            if (!entry || !entry.timestamp || now - entry.timestamp >= CONFIG.cacheTimeout) {
                delete priceCache[id];
                dirty = true;
            }
        }
        if (dirty) GM_setValue('priceCache', priceCache);
    })();

    function cachePrice(itemId, marketValue, buyPrice, sellPrice, lowestMarketPrice) {
        priceCache[itemId] = { marketValue, buyPrice, sellPrice, lowestMarketPrice, timestamp: Date.now() };
        clearTimeout(priceCachePersistTimer);
        priceCachePersistTimer = setTimeout(() => GM_setValue('priceCache', priceCache), 500);
    }

    function getCachedPrice(itemId) {
        const entry = priceCache[itemId];
        if (entry && entry.timestamp && Date.now() - entry.timestamp < CONFIG.cacheTimeout) return entry;
        return null;
    }

    function clearPriceCache() {
        priceCache = {};
        clearTimeout(priceCachePersistTimer);
        GM_setValue('priceCache', priceCache);
    }

    // =====================================================================
    // DEBUG LOGGING  (set the "debug" flag in script storage to enable)
    // =====================================================================

    const DEBUG = getSetting('debug', false);
    function log(...args) {
        if (DEBUG) console.log('[SakaLuXBazaarSmartPricer]', ...args);
    }

    // =====================================================================
    // TORN DOM SELECTORS  (single source of truth: Torn's CSS-module class
    // hashes change on front-end rebuilds, so every fragile selector lives
    // here and a breakage is a one-spot fix)
    // =====================================================================

    const SELECTORS = {
        bazaarRoot: '#bazaarRoot',
        bazaarRootLegacy: '.bazaar-main-wrap',
        // Add-items page
        itemLists: 'ul.items-cont, div[class*="itemsContainner___"], div[class*="rowItems___"]',
        addItems: 'li.clearfix:not(.disabled), div[class*="item___GYCYJ"], div[class*="item___khvF6"]',
        allAddItems: 'ul.items-cont li.clearfix:not(.disabled), div[class*="itemsContainner___"] div[class*="item___"], div[class*="rowItems___"] div[class*="item___"]',
        tabItemClass: 'item___UN3Mg', // tab entries share the item___ prefix; excluded everywhere
        itemTitle: 'div[class*="name___"], div.title-wrap',
        itemDescription: 'div[class*="description___"], div.title-wrap',
        itemImage: 'div.image-wrap img',
        amountWrap: 'div[class*="amount___"], div.amount-main-wrap',
        priceWrap: 'div[class*="price___"], div.price',
        priceInputs: 'div.price div input',
        quantityCheckbox: 'div.choice-container, [class*="choiceContainer___"]',
        // Manage page
        manageItems: 'div[class*="item___"]',
        managePriceWrap: 'div[class*="price"]',
        managePriceInput: 'input.input-money, input',
        sectionHeadings: 'div[role="heading"], div[class*="title"], div[class*="panelHeader"], div[class*="titleContainer"]',
        // RW detection
        rwBonusIcons: 'ul.bonuses-wrap li.bonus i[class^="bonus-attachment-"]',
        rarityGlow: 'div.title-wrap div.image-wrap[class*="glow-"]'
    };

    const warnedSelectors = new Set();
    /** Warn once per selector when an expected element is missing (Torn markup change). */
    function warnSelectorMiss(name) {
        if (warnedSelectors.has(name)) return;
        warnedSelectors.add(name);
        console.warn(`[SakaLuXBazaarSmartPricer] Selector "${name}" matched nothing — Torn's markup may have changed`);
    }

    // =====================================================================
    // RW WEAPON DETECTION
    // =====================================================================

    const RW_BONUS_NAMES = new Set([
        'achilles', 'assassinate', 'backstab', 'berserk', 'bleed', 'blindside',
        'bloodlust', 'comeback', 'conserve', 'cripple', 'crusher', 'cupid',
        'deadeye', 'deadly', 'disarm', 'double-edged', 'double tap', 'empower',
        'eviscerate', 'execute', 'expose', 'finale', 'focus', 'frenzy', 'fury',
        'grace', 'home run', 'irradiate', 'motivation', 'paralyze', 'parry',
        'penetrate', 'plunder', 'powerful', 'proficience', 'puncture', 'quicken',
        'rage', 'revitalize', 'roshambo', 'slow', 'smurf', 'specialist',
        'stricken', 'stun', 'suppress', 'sure shot', 'throttle', 'warlord',
        'weaken', 'wind-up', 'wither',
        'blindfire', 'burn', 'demoralize', 'emasculate', 'freeze', 'hazardous',
        'lacerate', 'laceration', 'poison', 'poisoned', 'shock', 'sleep',
        'smash', 'spray', 'storage', 'toxin'
    ]);

    /**
     * Detect whether an item row is a ranked-war weapon.
     * Torn renders RW bonuses as <i class="bonus-attachment-{name}"> inside
     * <li class="bonus left"> inside <ul class="bonuses-wrap">.
     * @returns {{isRanked: boolean, bonus: ?string, rarity: ?string}}
     */
    function getRWBonusInfo(itemElement) {
        const bonusIcons = itemElement.querySelectorAll(SELECTORS.rwBonusIcons);
        for (const icon of bonusIcons) {
            const cls = icon.className || '';
            if (cls.includes('blank-bonus')) continue;
            const match = cls.match(/bonus-attachment-([a-z0-9-]+)/i);
            if (!match) continue;
            const bonusName = match[1].toLowerCase();
            if (RW_BONUS_NAMES.has(bonusName)) {
                const rarity = detectRarity(itemElement);
                log(`RW detected: ${bonusName} (${rarity || 'unknown'})`);
                return { isRanked: true, bonus: bonusName, rarity };
            }
        }
        return { isRanked: false, bonus: null, rarity: null };
    }

    function hasAnyBonus(itemElement) {
        const rw=getRWBonusInfo(itemElement);
        if (rw.isRanked) return true;
        const rarity=itemElement.querySelector(SELECTORS.rarityGlow);
        if (!rarity) return false;
        const icons=itemElement.querySelectorAll('ul.bonuses-wrap li.bonus i[class*="bonus-attachment-"]');
        return Array.from(icons).some(icon => !String(icon.className || '').includes('blank-bonus'));
    }

    /** Rarity is encoded as glow-yellow / glow-orange / glow-red on the image wrap. */
    function detectRarity(itemElement) {
        const glowEl = itemElement.querySelector(SELECTORS.rarityGlow);
        if (!glowEl) return null;
        const cls = glowEl.className;
        if (cls.includes('glow-yellow')) return 'yellow';
        if (cls.includes('glow-orange')) return 'orange';
        if (cls.includes('glow-red'))    return 'red';
        return null;
    }

    function rwSkipLabel(info) {
        const rarity = info.rarity ? info.rarity.charAt(0).toUpperCase() + info.rarity.slice(1) : 'Unknown rarity';
        const bonus = info.bonus ? info.bonus.charAt(0).toUpperCase() + info.bonus.slice(1) : 'Unknown bonus';
        return `${rarity} ${bonus} RW weapon`;
    }

    /** Shared "price an RW weapon anyway?" dialog. @returns {Promise<boolean>} */
    function confirmRwPricing(rwInfo) {
        return qpConfirm(
            `This appears to be a ${rwSkipLabel(rwInfo)}.\nRW weapons have unique pricing not based on standard market value.\n\nPrice it anyway using the base item's market value?`,
            { title: 'RW weapon detected', confirmText: 'Price it', kind: 'rw' }
        );
    }

    // =====================================================================
    // STATE
    // =====================================================================

    const processedItems = new WeakSet();
    const processedManageItems = new WeakSet();
    let mutationDebounceTimer = null;

    // =====================================================================
    // GLOBAL CSS  (button system + badges)
    // =====================================================================

    // Best-effort cleanup of a previous instance (PDA re-injection / SPA nav
    // without a full reload): sweep any UI the old instance left in the DOM.
    ['#qp-style', '#qp-font', '.qp-chip', '.qp-toast-wrap', '.qp-overlay'].forEach(sel =>
        document.querySelectorAll(sel).forEach(el => el.remove()));

    // Nunito is the shared display face of the pastel design system
    // (see docs/pastel-theme.md) — falls back to system-ui if blocked.
    const fontLink = document.createElement('link');
    fontLink.id = 'qp-font';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap';
    document.head.appendChild(fontLink);

    const style = document.createElement('style');
    style.id = 'qp-style';
    style.textContent = `
        /* ── PASTEL DESIGN SYSTEM (shared tokens — docs/pastel-theme.md) ── */
        :root {
            --qp-accent:    #4f8fe8;
            --qp-accent-bg: #efeafd;
            --qp-ink:       #2b2740;
            --qp-muted:     #8a86a0;
            --qp-field-bg:  #f7f6fb;
            --qp-border:    #e5e1f4;
            --qp-ok:        #3aa06b;
            --qp-ok-bg:     #e4f3ec;
            --qp-danger:    #c25a5a;
            --qp-danger-bg: #fbecec;
            --qp-warn:      #c9782e;
            --qp-warn-bg:   #fdf6ec;
            --qp-rw:        #f0a35e;
            --qp-rw-bg:     #fdeeda;
            --qp-font: 'Nunito', system-ui, sans-serif;
        }

        @keyframes qp-pop-spring {
            0%   { transform: scale(.4) translateY(14px); opacity: 0; }
            55%  { transform: scale(1.08) translateY(-3px); opacity: 1; }
            75%  { transform: scale(.97) translateY(1px); }
            100% { transform: scale(1) translateY(0); }
        }
        @keyframes qp-toast-in {
            from { transform: translateY(12px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes qpDotBlink {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.25; }
        }

        /* ── PER-ITEM BUTTONS ── */
        .qp-item-btn {
            border: none;
            cursor: pointer;
            width: 34px; height: 34px;
            border-radius: 10px !important;
            background: var(--qp-accent) !important;
            color: #fff !important;
            display: inline-flex; align-items: center; justify-content: center;
            box-shadow: 0 3px 8px rgba(79,143,232,.3);
            transition: background .15s;
            font-family: var(--qp-font) !important;
        }
        .qp-item-btn:hover { background: #3f79ca !important; }
        .qp-item-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .qp-item-btn.qp-btn-red {                 /* filled → undo / fetch failed */
            background: var(--qp-danger-bg) !important;
            color: var(--qp-danger) !important;
            box-shadow: none;
        }
        .qp-item-btn.qp-btn-red:hover { background: #f6dede !important; }

        .quick-price-btn, .quick-update-price-btn {
            display: flex; align-items: center; flex-shrink: 0;
            margin-left: auto; padding-right: 5px; z-index: 10;
        }

        .qp-rw-dot {                              /* blinking RW badge next to the button */
            width: 9px; height: 9px;
            border-radius: 50% !important;
            border: 2px solid #fff;
            flex-shrink: 0;
            margin-right: 4px;
            animation: qpDotBlink 1.2s ease-in-out infinite;
            pointer-events: none;
        }
        .qp-rw-dot.rw-yellow { background: #e8c97e; }
        .qp-rw-dot.rw-orange { background: var(--qp-rw); }
        .qp-rw-dot.rw-red    { background: var(--qp-danger); }
        .qp-rw-dot.rw-unknown { background: var(--qp-accent); }

        /* ── OVERLAY + MODAL SHELL ── */
        .qp-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(43,39,64,.28);
            backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
            z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            font-family: var(--qp-font);
            padding: 20px 15px;
            box-sizing: border-box;
        }
        .qp-modal {
            width: 320px; max-width: calc(100vw - 32px);
            background: #fff;
            color: var(--qp-ink);
            border-radius: 20px;
            box-shadow: 0 16px 48px rgba(43,39,64,.35);
            animation: qp-pop-spring .45s cubic-bezier(.34,1.56,.64,1) both;
            max-height: 100%;
            overflow-y: auto;
        }
        .qp-head { display: flex; align-items: center; gap: 10px; padding: 18px 18px 0; }
        .qp-head__badge {
            flex: none; width: 40px; height: 40px; border-radius: 11px;
            background: var(--qp-accent-bg);
            display: flex; align-items: center; justify-content: center;
        }
        .qp-head__badge--warn { background: var(--qp-warn-bg); font-size: 16px; }
        .qp-head__badge--rw   { background: var(--qp-rw-bg);   font-size: 16px; position: relative; }
        .qp-head__badge--rw .qp-rw-dot { position: absolute; right: -4px; top: -4px; margin: 0; width: 10px; height: 10px; background: var(--qp-rw); }
        .qp-head__title { font: 800 15px/1.15 var(--qp-font); color: var(--qp-ink); }
        .qp-head__sub   { font: 700 11.5px/1.3 var(--qp-font); color: var(--qp-muted); margin-top: 1px; }
        .qp-head__sub a { color: var(--qp-accent); font-weight: 800; text-decoration: none; }
        .qp-close {
            margin-left: auto; width: 28px; height: 28px; border-radius: 50%;
            background: #f4f2fa; border: none; cursor: pointer;
            font: 800 13px var(--qp-font); color: var(--qp-muted);
            display: flex; align-items: center; justify-content: center;
            flex: none;
        }
        .qp-close:hover { background: #e9e5f6; }
        .qp-head-actions{margin-left:auto;display:flex;align-items:center;gap:7px}.qp-api-head{font-size:14px!important}
        .qp-api-status{padding:10px 12px;border-radius:12px;background:var(--qp-field-bg);border:1.5px solid var(--qp-border);font:800 11px/1.45 var(--qp-font);color:var(--qp-muted)}
        .qp-api-status strong{color:var(--qp-ink)}
        .qp-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 12px; }

        /* ── FIELDS ── */
        .qp-label { font: 800 11px var(--qp-font); letter-spacing: .5px; color: var(--qp-muted); margin-bottom: 6px; }
        .qp-field {
            display: flex; align-items: center; gap: 8px;
            background: var(--qp-field-bg);
            border: 2px solid var(--qp-border); border-radius: 12px;
            padding: 10px 12px;
        }
        .qp-field:focus-within { border-color: var(--qp-accent); }
        .qp-field input {
            flex: 1; min-width: 0; border: none; outline: none; background: transparent;
            font: 700 13px var(--qp-font); color: var(--qp-ink); letter-spacing: 1px;
        }
        .qp-eye-toggle {
            flex: none; cursor: pointer;
            color: var(--qp-muted);
            display: flex; align-items: center;
        }
        .qp-eye-toggle:hover { color: var(--qp-ink); }

        /* note strip (security hint) */
        .qp-note {
            display: flex; align-items: flex-start; gap: 8px;
            background: var(--qp-warn-bg); border-radius: 12px; padding: 10px 12px;
            font: 700 11px/1.45 var(--qp-font); color: #9a7b45;
            margin: 0;
        }

        /* number-field grid: DISCOUNT / ALERT AT / CACHE */
        .qp-numgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .qp-numcell {
            background: var(--qp-field-bg); border: 1.5px solid var(--qp-border);
            border-radius: 12px; padding: 9px 10px;
            display: block;
        }
        .qp-numcell:focus-within { border-color: var(--qp-accent); }
        .qp-numcell__label { font: 800 9.5px var(--qp-font); letter-spacing: .4px; color: var(--qp-muted); }
        .qp-numcell__row { display: flex; align-items: baseline; gap: 2px; margin-top: 3px; }
        .qp-numcell input {
            width: 100%; min-width: 0; border: none; outline: none; background: transparent;
            font: 900 16px var(--qp-font); color: var(--qp-ink); padding: 0;
        }
        .qp-numcell__unit { font: 800 11px var(--qp-font); color: var(--qp-muted); }

        /* ── TOGGLES ── */
        .qp-toggles-card { background: var(--qp-field-bg); border-radius: 14px; padding: 4px 12px; display: flex; flex-direction: column; }
        .qp-toggle-row {
            display: flex; align-items: center; justify-content: space-between; gap: 12px;
            padding: 10px 0;
        }
        .qp-toggle-row:not(:last-child) { border-bottom: 1.5px solid #edeaf6; }
        .qp-toggle-row__name { font: 800 12px var(--qp-font); color: var(--qp-ink); display: block; }
        .qp-toggle-row__desc { font: 700 10px/1.35 var(--qp-font); color: var(--qp-muted); }

        .qp-toggle {
            position: relative;
            display: inline-block;
            flex: none;
            width: 36px;
            height: 21px;
        }
        .qp-toggle input { opacity: 0; width: 0; height: 0; }
        .qp-toggle-track {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background: #d9d5e8;
            border-radius: 999px !important;
            transition: background .15s;
        }
        .qp-toggle-track:before {
            position: absolute;
            content: "";
            width: 16px; height: 16px;
            left: 2.5px; top: 2.5px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,.2);
            transition: transform .15s;
        }
        input:checked + .qp-toggle-track { background: var(--qp-accent); }
        input:checked + .qp-toggle-track:before { transform: translateX(15px); }

        /* ── MODAL BUTTONS ── */
        .qp-btn-row { display: flex; gap: 8px; }
        .qp-btn {
            border: none; cursor: pointer; border-radius: 12px !important; padding: 11px 0;
            font: 900 13.5px var(--qp-font); text-align: center; flex: 1;
        }
        .qp-btn--primary {
            background: var(--qp-accent); color: #fff;
            box-shadow: 0 4px 12px rgba(79,143,232,.35);
        }
        .qp-btn--primary:hover { background: #3f79ca; }
        .qp-btn--ghost  { background: #f4f2fa; color: var(--qp-muted); font-weight: 800; font-size: 12px; }
        .qp-btn--ghost:hover { background: #e9e5f6; }
        .qp-btn--danger { background: var(--qp-danger-bg); color: var(--qp-danger); font-weight: 800; font-size: 12px; }
        .qp-btn--danger:hover { background: #f6dede; }
        .qp-btn--rw {
            background: var(--qp-rw); color: #fff;
            box-shadow: 0 4px 12px rgba(240,163,94,.4);
        }
        .qp-help { text-align: center; font: 800 11.5px var(--qp-font); color: var(--qp-accent); text-decoration: none; }
        .qp-confirm-text {
            margin: 0;
            font: 700 12px/1.55 var(--qp-font);
            white-space: pre-line;
            color: var(--qp-ink);
        }

        /* ── FLOATING DRAG CHIP ── */
        .qp-chip {
            position: fixed;
            left: 50%; bottom: 18px;
            transform: translateX(-50%);
            display: flex; align-items: center; gap: 6px;
            background: #fff;
            border-radius: 999px !important;
            padding: 6px;
            z-index: 99998;
            box-shadow: 0 8px 24px rgba(43,39,64,.18), 0 2px 6px rgba(0,0,0,.08);
            font-family: var(--qp-font) !important;
            touch-action: none;
        }
        .qp-chip.qp-chip-dragging { opacity: 0.85; box-shadow: 0 12px 32px rgba(43,39,64,.3); }
        .qp-chip-grip {
            width: 18px; height: 34px;
            display: flex; align-items: center; justify-content: center;
            color: #c5c1d6; font: 800 13px/1 var(--qp-font); letter-spacing: -1px;
            cursor: grab; flex-shrink: 0; user-select: none;
        }
        .qp-chip-grip:active { cursor: grabbing; }
        .qp-chip-fill {
            border: none; cursor: pointer;
            background: var(--qp-accent) !important; color: #fff !important;
            border-radius: 999px !important; padding: 9px 18px !important;
            font: 900 12.5px var(--qp-font) !important;
            box-shadow: 0 3px 10px rgba(79,143,232,.35);
            white-space: nowrap;
            transition: background .15s;
        }
        .qp-chip-fill:hover { background: #3f79ca !important; }
        .qp-chip-fill:disabled {                  /* busy: queue is running */
            background: var(--qp-accent-bg) !important; color: var(--qp-accent) !important;
            box-shadow: none; cursor: default;
        }
        .qp-chip-gear {
            border: none; cursor: pointer;
            width: 34px; height: 34px; border-radius: 50% !important; padding: 0 !important;
            background: #f4f2fa !important; color: var(--qp-muted) !important;
            display: flex; align-items: center; justify-content: center;
        }
        .qp-chip-gear:hover { background: #e9e5f6 !important; }

        /* ── TOASTS ── */
        .qp-toast-wrap {
            position: fixed;
            bottom: 70px; left: 50%;
            transform: translateX(-50%);
            z-index: 100000;
            display: flex; flex-direction: column-reverse; gap: 8px; align-items: center;
            pointer-events: none;
        }
        .qp-toast {
            display: flex; align-items: center; gap: 8px;
            background: #fff; border-radius: 999px; padding: 8px 16px 8px 10px;
            box-shadow: 0 6px 18px rgba(43,39,64,.16);
            font: 800 11.5px/1.3 var(--qp-font); color: var(--qp-ink);
            max-width: min(320px, calc(100vw - 32px));
            animation: qp-toast-in .25s cubic-bezier(.2,.9,.3,1.2) both;
        }
        .qp-toast__icon {
            flex: none; width: 20px; height: 20px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font: 900 12px var(--qp-font);
        }
        .qp-toast-success .qp-toast__icon { background: var(--qp-ok-bg);     color: var(--qp-ok); }
        .qp-toast-error   .qp-toast__icon { background: var(--qp-danger-bg); color: var(--qp-danger); }
        .qp-toast-info    .qp-toast__icon { background: var(--qp-warn-bg);   color: var(--qp-warn); font-size: 11px; }
    `;
    document.head.appendChild(style);

    const sakaluxHubSkin = document.createElement('style');
    sakaluxHubSkin.id = 'slx-bsp-hub-skin';
    sakaluxHubSkin.textContent = `
      :root{
        --qp-accent:#4f8fe8;--qp-accent-bg:#172331;--qp-ink:#edf3fa;--qp-muted:#93a4b7;
        --qp-field-bg:#151f2b;--qp-border:#34465b;--qp-ok:#55d98a;--qp-ok-bg:#173126;
        --qp-danger:#ff6b78;--qp-danger-bg:#3b2028;--qp-warn:#dfbd61;--qp-warn-bg:#2d2818;
        --qp-rw:#f0a35e;--qp-rw-bg:#37281d;--qp-font:Inter,Arial,sans-serif;
      }
      .qp-overlay{background:rgba(0,0,0,.68);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
      .qp-modal{background:linear-gradient(180deg,#111a24,#0b1118);color:var(--qp-ink);border:1px solid #34465b;box-shadow:0 18px 48px rgba(0,0,0,.56)}
      .qp-head__badge{background:#172331;border:1px solid rgba(79,143,232,.28)}
      .qp-head__badge svg{filter:none}
      .qp-close{background:#172331;color:#93a4b7;border:1px solid #34465b}
      .qp-close:hover{background:#223143;color:#edf3fa}
      .qp-note{background:#2d2818;color:#dfbd61;border:1px solid rgba(223,189,97,.22)}
      .qp-numcell,.qp-toggles-card,.qp-field{background:#151f2b;border-color:#34465b}
      .qp-toggle-row:not(:last-child){border-bottom-color:#263647}
      .qp-toggle-track{background:#34465b}
      .qp-toggle-track:before{background:#edf3fa}
      .qp-btn--ghost{background:#172331;color:#93a4b7;border:1px solid #34465b}
      .qp-btn--ghost:hover{background:#223143;color:#edf3fa}
      .qp-btn--danger{background:#3b2028;color:#ff6b78;border:1px solid rgba(255,107,120,.24)}
      .qp-btn--danger:hover{background:#492630}
      .qp-btn--primary{background:#4f8fe8;color:#fff;box-shadow:0 4px 12px rgba(79,143,232,.28)}
      .qp-btn--primary:hover,.qp-item-btn:hover{background:#3f79ca!important}
      .qp-chip{background:#111a24;border:1px solid #34465b;box-shadow:0 10px 28px rgba(0,0,0,.42)}
      .qp-chip-grip{color:#60758c}.qp-chip-gear{color:#93a4b7!important}.qp-chip-gear:hover{background:#172331!important;color:#edf3fa!important}
      .qp-item-btn{background:#4f8fe8!important;box-shadow:0 3px 8px rgba(79,143,232,.28)}
      .qp-head__sub a,.qp-help{color:#dfbd61}
      .qp-toast{background:#111a24!important;color:#edf3fa!important;border:1px solid #34465b!important;box-shadow:0 10px 26px rgba(0,0,0,.38)!important}
      @media(max-width:700px){.qp-overlay{padding:8px}.qp-modal{max-width:calc(100vw - 16px);border-radius:14px}.qp-body{padding-bottom:16px}}
    `;
    document.head.appendChild(sakaluxHubSkin);

    // =====================================================================
    // SVGs
    // =====================================================================

    const addButtonSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
    const refreshSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>`;

    const eyeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
    const eyeOffSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;

    const gearSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M19.1 4.9 17 7m-10 10-2.1 2.1"/></svg>`;

    // Header badge icons (accent-stroked, per the pastel design system)
    const keyBadgeSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f8fe8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 21 2m-4 4 3 3"/></svg>`;
    const gearBadgeSVG = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4f8fe8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M19.1 4.9 17 7m-10 10-2.1 2.1"/></svg>`;

    // =====================================================================
    // UI HELPERS
    // =====================================================================

    function wireToggleRowLabel(overlay, checkboxId) {
        const checkbox = overlay.querySelector('#' + checkboxId);
        const label = checkbox.closest('.qp-toggle-row').querySelector('span');
        const sync = () => label.classList.toggle('qp-on', checkbox.checked);
        sync();
        checkbox.addEventListener('change', sync);
    }

    /** Show/hide toggle for the API key input (click or Enter/Space). */
    function wireEyeToggle(overlay, apiInput) {
        const eyeToggle = overlay.querySelector('#qpEyeToggle');
        const flip = () => {
            const isPass = apiInput.type === 'password';
            apiInput.type = isPass ? 'text' : 'password';
            eyeToggle.innerHTML = isPass ? eyeOffSVG : eyeSVG;
        };
        eyeToggle.addEventListener('click', flip);
        eyeToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
        });
    }

    /** Dialog accessibility: role/aria attributes, Escape to close, Tab focus trap. */
    function wireOverlayA11y(overlay, onClose) {
        const modal = overlay.querySelector('.qp-modal');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
            if (e.key !== 'Tab') return;
            const focusables = overlay.querySelectorAll('button, input, a[href], [tabindex]:not([tabindex="-1"])');
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }

    let toastWrap = null;

    /** Non-blocking notification. @param {'info'|'success'|'error'} kind */
    function qpToast(message, kind = 'info', duration = 4000) {
        if (!toastWrap || !document.body.contains(toastWrap)) {
            toastWrap = document.createElement('div');
            toastWrap.className = 'qp-toast-wrap';
            document.body.appendChild(toastWrap);
        }
        const toast = document.createElement('div');
        toast.className = `qp-toast qp-toast-${kind}`;
        toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
        const icon = document.createElement('span');
        icon.className = 'qp-toast__icon';
        icon.textContent = kind === 'success' ? '✓' : kind === 'error' ? '!' : 'i';
        const text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(icon);
        toast.appendChild(text);
        toastWrap.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    }

    /**
     * Non-blocking replacement for window.confirm, styled like the settings modal.
     * @returns {Promise<boolean>} true if the user confirmed
     */
    function qpConfirm(message, opts = {}) {
        return new Promise((resolve) => {
            const rw = opts.kind === 'rw';
            const overlay = document.createElement('div');
            overlay.className = 'qp-overlay';
            overlay.innerHTML = `
                <div class="qp-modal">
                    <div class="qp-head">
                        <div class="qp-head__badge ${rw ? 'qp-head__badge--rw' : 'qp-head__badge--warn'}">${rw ? '🗡️<span class="qp-rw-dot"></span>' : '⚠️'}</div>
                        <div class="qp-head__title">${opts.title || 'Confirm'}</div>
                    </div>
                    <div class="qp-body">
                        <p class="qp-confirm-text"></p>
                        <div class="qp-btn-row">
                            <button class="qp-btn qp-btn--ghost" data-qp="cancel">Cancel</button>
                            <button class="qp-btn ${rw ? 'qp-btn--rw' : 'qp-btn--primary'}" data-qp="ok">${opts.confirmText || 'Confirm'}</button>
                        </div>
                    </div>
                </div>
            `;
            overlay.querySelector('.qp-confirm-text').textContent = message;
            document.body.appendChild(overlay);
            const done = (val) => { overlay.remove(); resolve(val); };
            overlay.querySelector('[data-qp="ok"]').onclick = () => done(true);
            overlay.querySelector('[data-qp="cancel"]').onclick = () => done(false);
            overlay.onclick = (e) => { if (e.target === overlay) done(false); };
            wireOverlayA11y(overlay, () => done(false));
            overlay.querySelector('[data-qp="ok"]').focus();
        });
    }

    // =====================================================================
    // UI — API KEY PROMPT
    // =====================================================================

    function showApiKeyPrompt() {
        const overlay = document.createElement('div');
        overlay.className = 'qp-overlay';
        overlay.innerHTML = `
            <div class="qp-modal">
                <div class="qp-head">
                    <div class="qp-head__badge">${keyBadgeSVG}</div>
                    <div>
                        <div class="qp-head__title">SakaLuX Smart Pricer</div>
                        <div class="qp-head__sub">Needs your public API key</div>
                    </div>
                    <button class="qp-close" id="qpCancel" aria-label="Close">✕</button>
                </div>
                <div class="qp-body">
                    <div>
                        <div class="qp-label">PUBLIC API KEY</div>
                        <div class="qp-field">
                            <input type="password" id="qpApiKey" placeholder="ENTER KEY" autocomplete="off" spellcheck="false" aria-label="Torn API key" />
                            <div class="qp-eye-toggle" id="qpEyeToggle" role="button" tabindex="0" aria-label="Show or hide API key">${eyeSVG}</div>
                        </div>
                    </div>
                    <div class="qp-note"><span>🔒</span><span>A <strong>Public</strong>-level key is enough — the script
                    only reads item market prices. Create one at Torn &gt; Settings &gt; API Keys &gt; Create Key &gt; Public.
                    Never paste a Full Access key into third-party scripts.</span></div>
                    <button class="qp-btn qp-btn--primary" id="qpSave">Authorize</button>
                    <a class="qp-help" href="https://www.torn.com/preferences.php#tab=api" target="_blank" rel="noopener">Where do I find my key? →</a>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const apiInput = overlay.querySelector('#qpApiKey');
        wireEyeToggle(overlay, apiInput);

        overlay.querySelector('#qpSave').onclick = () => {
            const key = apiInput.value.trim();
            if (isValidApiKey(key)) {
                CONFIG.apiKey = key;
                overlay.remove();
                // No reload needed: the chip, observer, and item buttons are already
                // wired up; the queue simply starts working once a key exists.
                qpToast('API key saved', 'success');
            } else {
                qpToast('Please enter a valid 16-character alphanumeric API key', 'error');
            }
        };
        overlay.querySelector('#qpCancel').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        wireOverlayA11y(overlay, () => overlay.remove());
    }

    function showApiAccessPanel() {
        const overlay=document.createElement('div');
        overlay.className='qp-overlay';
        const shared=getHubSharedApiKey();
        const local=getSetting('tornApiKey','');
        overlay.innerHTML=`
            <div class="qp-modal">
                <div class="qp-head">
                    <div class="qp-head__badge">${keyBadgeSVG}</div>
                    <div><div class="qp-head__title">API Access</div><div class="qp-head__sub">SakaLuX Bazaar Smart Pricer</div></div>
                    <button class="qp-close" id="qpApiClose" aria-label="Close">✕</button>
                </div>
                <div class="qp-body">
                    <div class="qp-api-status">Active source: <strong>${shared?'SakaLuX Hub shared key':(isValidApiKey(local)?'Local key':'No valid key')}</strong><br>${shared?'Hub is installed, so the shared key is used automatically. Local key stays as fallback.':'Install/configure SakaLuX Hub for automatic shared-key use, or save a local Public key below.'}</div>
                    <div><div class="qp-label">LOCAL FALLBACK KEY</div><div class="qp-field"><input type="password" id="qpApiLocal" autocomplete="off" spellcheck="false"/><div class="qp-eye-toggle" id="qpApiEye" role="button" tabindex="0">${eyeSVG}</div></div></div>
                    <div class="qp-note"><span>🔒</span><span>Only read access to Torn item data is required. A Hub shared key is preferred when Hub is active.</span></div>
                    <div class="qp-btn-row"><button class="qp-btn qp-btn--ghost" id="qpCreateKey">Create key</button><button class="qp-btn qp-btn--primary" id="qpTestActive">Test active</button></div>
                    <div class="qp-btn-row"><button class="qp-btn qp-btn--danger" id="qpClearLocal">Clear local</button><button class="qp-btn qp-btn--primary" id="qpSaveLocal">Save local</button></div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const input=overlay.querySelector('#qpApiLocal'); input.value=isValidApiKey(local)?local:'';
        const eye=overlay.querySelector('#qpApiEye'); eye.onclick=()=>{const p=input.type==='password';input.type=p?'text':'password';eye.innerHTML=p?eyeOffSVG:eyeSVG;};
        const close=()=>overlay.remove(); overlay.querySelector('#qpApiClose').onclick=close; overlay.onclick=e=>{if(e.target===overlay)close();};
        overlay.querySelector('#qpCreateKey').onclick=()=>window.open('https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Bazaar%20Smart%20Pricer&torn=items','_blank');
        overlay.querySelector('#qpSaveLocal').onclick=()=>{const k=input.value.trim();if(k && !isValidApiKey(k))return qpToast('API key must be 16 alphanumeric characters','error');CONFIG.apiKey=k;qpToast('Local fallback key saved','success');close();};
        overlay.querySelector('#qpClearLocal').onclick=()=>{CONFIG.apiKey='';input.value='';qpToast('Local fallback key cleared','success');};
        overlay.querySelector('#qpTestActive').onclick=()=>{const k=CONFIG.apiKey;if(!k)return qpToast('No active API key','error');GM_xmlhttpRequest({method:'GET',url:`https://api.torn.com/torn/1?selections=items&key=${k}`,timeout:12000,onload:r=>{try{const d=JSON.parse(r.responseText);if(d.error)throw new Error(d.error.error||'API error');qpToast(`API works · ${activeApiSource()}`,'success');}catch(e){qpToast('API test failed: '+e.message,'error');}},onerror:()=>qpToast('API test failed','error'),ontimeout:()=>qpToast('API test timed out','error')});};
        wireOverlayA11y(overlay,close);
    }

    function showSettingsPanel() {
        const overlay = document.createElement('div');
        overlay.className = 'qp-overlay';
        overlay.innerHTML = `
            <div class="qp-modal">
                <div class="qp-head">
                    <div class="qp-head__badge">${gearBadgeSVG}</div>
                    <div>
                        <div class="qp-head__title">SakaLuX Smart Pricer settings</div>
                        <div class="qp-head__sub">v${VERSION}</div>
                    </div>
                    <div class="qp-head-actions"><button class="qp-close qp-api-head" id="qpApiAccess" title="API Access" aria-label="API Access">🔑</button><button class="qp-close" id="qpCancel" aria-label="Close">✕</button></div>
                </div>
                <div class="qp-body">
                    <div>
                        <div class="qp-label">API KEY</div>
                        <div class="qp-field">
                            <input type="password" id="qpApiKey" autocomplete="off" spellcheck="false" aria-label="Torn API key" />
                            <div class="qp-eye-toggle" id="qpEyeToggle" role="button" tabindex="0" aria-label="Show or hide API key">${eyeSVG}</div>
                        </div>
                    </div>
                    <div class="qp-note"><span>🔒</span><span>A <strong>Public</strong>-level key is enough — the script only reads item market data.</span></div>
                    <div class="qp-numgrid">
                        <label class="qp-numcell">
                            <span class="qp-numcell__label" id="qpDiscountLabel">${CONFIG.priceBelowMarket ? 'DISCOUNT' : 'MARKUP'}</span>
                            <span class="qp-numcell__row"><input type="number" id="qpDiscount" value="${CONFIG.defaultDiscount}" step="0.1" min="0" max="99.9" aria-label="Percent below or above market" /><span class="qp-numcell__unit">%</span></span>
                        </label>
                        <label class="qp-numcell">
                            <span class="qp-numcell__label">ALERT AT</span>
                            <span class="qp-numcell__row"><input type="number" id="qpThreshold" value="${CONFIG.priceDiffThreshold}" step="1" min="0" max="1000" aria-label="Ask before applying price changes larger than this percent" /><span class="qp-numcell__unit">%</span></span>
                        </label>
                        <label class="qp-numcell">
                            <span class="qp-numcell__label">CACHE</span>
                            <span class="qp-numcell__row"><input type="number" id="qpCacheMin" value="${CONFIG.cacheTimeoutMin}" step="1" min="1" max="120" aria-label="Price cache lifetime in minutes" /><span class="qp-numcell__unit">min</span></span>
                        </label>
                    </div>
                    <div class="qp-toggles-card">
                        <div class="qp-toggle-row">
                            <div>
                                <span class="qp-toggle-row__name">Torn City shop floor</span>
                                <div class="qp-toggle-row__desc">Never price below Torn City shop buy price</div>
                            </div>
                            <label class="qp-toggle">
                                <input type="checkbox" id="qpNpcCheck" ${!CONFIG.disableNpcCheck ? 'checked' : ''} />
                                <span class="qp-toggle-track"></span>
                            </label>
                        </div>
                        <div class="qp-toggle-row">
                            <div>
                                <span class="qp-toggle-row__name">Skip RW weapons</span>
                                <div class="qp-toggle-row__desc">Ranked-war weapons have unique pricing</div>
                            </div>
                            <label class="qp-toggle">
                                <input type="checkbox" id="qpRwCheck" ${CONFIG.skipRwWeapons ? 'checked' : ''} />
                                <span class="qp-toggle-track"></span>
                            </label>
                        </div>
                        <div class="qp-toggle-row">
                            <div>
                                <span class="qp-toggle-row__name">Skip bonus items</span>
                                <div class="qp-toggle-row__desc">Do not auto-price weapons/items with Torn bonus icons</div>
                            </div>
                            <label class="qp-toggle">
                                <input type="checkbox" id="qpBonusCheck" ${CONFIG.skipBonusItems ? 'checked' : ''} />
                                <span class="qp-toggle-track"></span>
                            </label>
                        </div>
                        <div class="qp-toggle-row">
                            <div>
                                <span class="qp-toggle-row__name">Skip $1 items</span>
                                <div class="qp-toggle-row__desc">Update All leaves $1 giveaway listings alone</div>
                            </div>
                            <label class="qp-toggle">
                                <input type="checkbox" id="qpDollarCheck" ${CONFIG.skipDollarItems ? 'checked' : ''} />
                                <span class="qp-toggle-track"></span>
                            </label>
                        </div>
                        <div class="qp-toggle-row">
                            <div>
                                <span class="qp-toggle-row__name">Undercut market</span>
                                <div class="qp-toggle-row__desc">On: price below market · Off: above market</div>
                            </div>
                            <label class="qp-toggle">
                                <input type="checkbox" id="qpBelowMarket" ${CONFIG.priceBelowMarket ? 'checked' : ''} />
                                <span class="qp-toggle-track"></span>
                            </label>
                        </div>
                    </div>
                    <div class="qp-btn-row">
                        <button class="qp-btn qp-btn--danger" id="qpClearCache">Clear cache</button>
                        <button class="qp-btn qp-btn--primary" id="qpSave" style="flex:1.4;font-size:12.5px">Save settings</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#qpApiAccess').onclick = (e) => { e.preventDefault(); showApiAccessPanel(); };
        wireToggleRowLabel(overlay, 'qpNpcCheck');
        wireToggleRowLabel(overlay, 'qpRwCheck');
        wireToggleRowLabel(overlay, 'qpBonusCheck');
        wireToggleRowLabel(overlay, 'qpDollarCheck');
        wireToggleRowLabel(overlay, 'qpBelowMarket');

        // Keep the number-cell label honest about which direction the % applies.
        const belowMarketToggle = overlay.querySelector('#qpBelowMarket');
        const discountLabel = overlay.querySelector('#qpDiscountLabel');
        belowMarketToggle.addEventListener('change', () => {
            discountLabel.textContent = belowMarketToggle.checked ? 'DISCOUNT' : 'MARKUP';
        });

        const apiInput = overlay.querySelector('#qpApiKey');
        // Set via DOM, never string-interpolated into HTML: a malformed stored value
        // containing quotes must not be able to break out of the attribute.
        apiInput.value = CONFIG.apiKey;
        wireEyeToggle(overlay, apiInput);

        overlay.querySelector('#qpClearCache').onclick = () => {
            clearPriceCache();
            const btn = overlay.querySelector('#qpClearCache');
            btn.textContent = 'Cleared ✓';
            setTimeout(() => { btn.textContent = 'Clear cache'; }, 1500);
        };

        overlay.querySelector('#qpSave').onclick = () => {
            const key = apiInput.value.trim();
            if (key !== '' && !isValidApiKey(key)) {
                qpToast('API key must be 16 alphanumeric characters (leave empty to clear it)', 'error');
                return;
            }
            CONFIG.defaultDiscount = clampDiscount(overlay.querySelector('#qpDiscount').value);
            CONFIG.priceDiffThreshold = clampThreshold(overlay.querySelector('#qpThreshold').value);
            CONFIG.apiKey = key;
            CONFIG.disableNpcCheck = !overlay.querySelector('#qpNpcCheck').checked;
            CONFIG.skipRwWeapons = overlay.querySelector('#qpRwCheck').checked;
            CONFIG.skipBonusItems = overlay.querySelector('#qpBonusCheck').checked;
            CONFIG.skipDollarItems = overlay.querySelector('#qpDollarCheck').checked;
            CONFIG.priceBelowMarket = overlay.querySelector('#qpBelowMarket').checked;
            CONFIG.cacheTimeoutMin = Math.min(Math.max(parseInt(overlay.querySelector('#qpCacheMin').value, 10) || 5, 1), 120);
            overlay.remove();
            qpToast('Settings saved', 'success');
        };

        overlay.querySelector('#qpCancel').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        wireOverlayA11y(overlay, () => overlay.remove());
    }

    // =====================================================================
    // HELPERS
    // =====================================================================

    const itemIdCache = new Map();
    /** Torn item images live under /images/items/{itemId}/ — extract the id. */
    function getItemIdFromImage(image) {
        const src = image.src;
        if (itemIdCache.has(src)) return itemIdCache.get(src);
        const match = src.match(/\/(\d+)\//);
        if (match) {
            const itemId = parseInt(match[1], 10);
            itemIdCache.set(src, itemId);
            return itemId;
        }
        return null;
    }

    function getQuantity(itemElement) {
        const titleWrap = itemElement.querySelector(SELECTORS.itemTitle);
        if (!titleWrap) return 1;
        // Anchored to the end of the title so item names containing "x<digits>"
        // (e.g. weapon model numbers) can't be misread as a quantity.
        const match = titleWrap.textContent.trim().match(/\bx(\d+)\s*$/i);
        return match ? parseInt(match[1], 10) : 1;
    }

    /** Item name from a row's title, minus any trailing "x<qty>" marker. */
    function getItemName(itemElement) {
        const titleWrap = itemElement.querySelector(SELECTORS.itemTitle);
        if (!titleWrap) return null;
        return titleWrap.textContent.trim().replace(/\s*\bx\d+\s*$/i, '') || null;
    }

    // =====================================================================
    // API REQUEST QUEUE
    // =====================================================================

    const requestQueue = [];            // { itemId, retries } waiting to be fetched
    const pendingRequests = new Map();  // itemId -> callback[] (queued or in flight)
    let isProcessingQueue = false;
    let queueHalted = false;            // set when a fatal API error stops the run

    const REQUEST_SPACING_MS = 650;         // ≤100 req/min, Torn's documented limit
    const REQUEST_TIMEOUT_MS = 15000;
    const RATE_LIMIT_RETRY_DELAY_MS = 5000;
    const RATE_LIMIT_MAX_RETRIES = 2;

    // Torn API error codes that make every further request pointless this run.
    const FATAL_API_ERRORS = {
        2: 'Incorrect API key — please re-enter it in Settings.',
        8: 'Your IP is temporarily blocked by the Torn API.',
        9: 'The Torn API is currently disabled.'
    };

    function notifyApiError(message) {
        qpToast(message, 'error', 6000);
    }

    function finishRequest(itemId, result) {
        const callbacks = pendingRequests.get(itemId) || [];
        pendingRequests.delete(itemId);
        callbacks.forEach(cb => cb(result));
    }

    function failAllPending() {
        requestQueue.length = 0;
        const ids = Array.from(pendingRequests.keys());
        ids.forEach(id => finishRequest(id, { marketValue: 0, buyPrice: 0, sellPrice: 0, lowestMarketPrice: 0 }));
        isProcessingQueue = false;
    }

    function processRequestQueue() {
        if (isProcessingQueue || requestQueue.length === 0) return;
        if (queueHalted) { failAllPending(); return; }
        isProcessingQueue = true;
        const { itemId, retries } = requestQueue.shift();

        const releaseAndContinue = (delay) => {
            isProcessingQueue = false;
            setTimeout(processRequestQueue, delay);
        };
        const failItem = () => {
            finishRequest(itemId, { marketValue: 0, buyPrice: 0, sellPrice: 0, lowestMarketPrice: 0 });
            releaseAndContinue(REQUEST_SPACING_MS);
        };

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.torn.com/torn/${itemId}?selections=items&key=${CONFIG.apiKey}`,
            timeout: REQUEST_TIMEOUT_MS,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.error) {
                        const code = data.error.code;
                        if (FATAL_API_ERRORS[code]) {
                            if (code === 2) CONFIG.apiKey = '';
                            queueHalted = true;
                            notifyApiError(FATAL_API_ERRORS[code]);
                            finishRequest(itemId, { marketValue: 0, buyPrice: 0, sellPrice: 0, lowestMarketPrice: 0 });
                            failAllPending();
                            return;
                        }
                        if (code === 5 && retries < RATE_LIMIT_MAX_RETRIES) {
                            console.warn('[SakaLuXBazaarSmartPricer] Rate limited, backing off...');
                            requestQueue.unshift({ itemId, retries: retries + 1 });
                            releaseAndContinue(RATE_LIMIT_RETRY_DELAY_MS);
                            return;
                        }
                        console.warn(`[SakaLuXBazaarSmartPricer] API error ${code}: ${data.error.error}`);
                        failItem();
                    } else if (data.items?.[itemId]) {
                        const itemData = data.items[itemId];
                        const marketValue = Number(itemData.market_value) || 0;
                        const buyPrice = Number(itemData.buy_price) || 0;
                        const sellPrice = Number(itemData.sell_price) || 0;
                        cachePrice(itemId, marketValue, buyPrice, sellPrice, 0);
                        finishRequest(itemId, { marketValue, buyPrice, sellPrice, lowestMarketPrice: 0 });
                        releaseAndContinue(REQUEST_SPACING_MS);
                    } else {
                        failItem();
                    }
                } catch (e) {
                    console.error('[SakaLuXBazaarSmartPricer] Parse error:', e);
                    failItem();
                }
            },
            onerror: failItem,
            ontimeout: function() {
                console.warn(`[SakaLuXBazaarSmartPricer] Request for item ${itemId} timed out`);
                failItem();
            },
            onabort: failItem
        });
    }

    /**
     * Get {marketValue, sellPrice} for an item — served from cache when fresh,
     * otherwise queued behind the rate-limited request queue. The callback is
     * always invoked exactly once (with zeros on failure).
     */
    function fetchItemData(itemId, callback) {
        const cached = getCachedPrice(itemId);
        if (cached) {
            callback({ marketValue: cached.marketValue||0, buyPrice: cached.buyPrice||0, sellPrice: cached.sellPrice||0, lowestMarketPrice: cached.lowestMarketPrice||0 });
            return;
        }
        // Dedupe: if this item is already queued or in flight, piggyback on it.
        if (pendingRequests.has(itemId)) {
            pendingRequests.get(itemId).push(callback);
            return;
        }
        // A halted queue gets a fresh chance once the previous run has fully drained
        // (e.g. the user fixed their API key in Settings).
        if (queueHalted && requestQueue.length === 0 && pendingRequests.size === 0) {
            queueHalted = false;
        }
        pendingRequests.set(itemId, [callback]);
        requestQueue.push({ itemId, retries: 0 });
        processRequestQueue();
    }

    // =====================================================================
    // PRICING LOGIC
    // =====================================================================

    /**
     * Market value adjusted by the discount magnitude: N% below market when
     * priceBelowMarket is on (the default), N% above market (a markup) when it's
     * off. The magnitude is clamped to 0–99.9% in both directions, so a markup
     * tops out at +99.9% (≈2× market). Below-market results are floored at the
     * NPC sell price unless the user disabled floor enforcement; that floor can
     * never trigger for a markup (the price is already ≥ market ≥ sell price).
     */
    function calculateFinalPrice(marketValue, buyPrice, sellPrice, lowestMarketPrice, discount) {
        const pct = clampDiscount(discount) / 100;
        const multiplier = CONFIG.priceBelowMarket ? (1 - pct) : (1 + pct);
        // Use Torn market_value as the canonical reference, matching the proven
        // Quick Pricer behavior. live Item Market was removed because it can
        // include transient/outlier listings and produced wrong bulk prices.
        const referencePrice = Number(marketValue) || 0;
        let finalPrice = Math.round(referencePrice * multiplier);
        const cityShopFloor = Number(buyPrice) > 0 ? Number(buyPrice) : (Number(sellPrice) || 0);
        if (!CONFIG.disableNpcCheck && cityShopFloor > 0 && finalPrice < cityShopFloor) {
            log(`Price ${finalPrice} below Torn City shop price ${cityShopFloor}, adjusting...`);
            finalPrice = cityShopFloor;
        }
        return finalPrice;
    }

    function clearItemInputs(itemElement) {
        const amountDiv = itemElement.querySelector(SELECTORS.amountWrap);
        const priceDiv = itemElement.querySelector(SELECTORS.priceWrap);
        if (priceDiv) {
            priceDiv.querySelectorAll('input').forEach(input => {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
        if (amountDiv) {
            const isQuantityCheckbox = amountDiv.querySelector(SELECTORS.quantityCheckbox);
            if (isQuantityCheckbox) {
                const checkbox = isQuantityCheckbox.querySelector('input');
                if (checkbox && checkbox.checked) checkbox.click();
            } else {
                const quantityInput = amountDiv.querySelector('input');
                if (quantityInput) {
                    quantityInput.value = '';
                    quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
    }

    /**
     * Fill one add-items row with its calculated price and quantity.
     * @returns {Promise<boolean>} true if the price was actually filled
     */
    function fillItemPrice(itemElement) {
        const image = itemElement.querySelector('img');
        if (!image) return Promise.resolve(false);
        const itemId = getItemIdFromImage(image);
        if (!itemId) return Promise.resolve(false);
        const amountDiv = itemElement.querySelector(SELECTORS.amountWrap);
        const priceDiv = itemElement.querySelector(SELECTORS.priceWrap);
        if (!priceDiv) { warnSelectorMiss('priceWrap'); return Promise.resolve(false); }
        const priceInputs = priceDiv.querySelectorAll('input');
        if (priceInputs.length === 0) return Promise.resolve(false);

        return new Promise((resolve) => {
            fetchItemData(itemId, ({ marketValue, buyPrice, sellPrice, lowestMarketPrice }) => {
                if (marketValue > 0) {
                    const finalPrice = calculateFinalPrice(marketValue, buyPrice, sellPrice, lowestMarketPrice, CONFIG.defaultDiscount);
                    priceInputs.forEach(input => {
                        input.value = finalPrice;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                    if (amountDiv) {
                        const isQuantityCheckbox = amountDiv.querySelector(SELECTORS.quantityCheckbox);
                        if (isQuantityCheckbox) {
                            const checkbox = isQuantityCheckbox.querySelector('input');
                            if (checkbox && !checkbox.checked) checkbox.click();
                        } else {
                            const quantityInput = amountDiv.querySelector('input');
                            if (quantityInput) {
                                quantityInput.value = getQuantity(itemElement);
                                quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
                                quantityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
                            }
                        }
                    }
                    const btn = itemElement.querySelector('.quick-price-btn button');
                    if (btn) { btn.classList.add('qp-btn-red'); btn.dataset.mode = 'undo'; }
                    resolve(true);
                    return;
                } else {
                    // Surface the failure on the button instead of silently doing nothing.
                    const btn = itemElement.querySelector('.quick-price-btn button');
                    if (btn && btn.dataset.mode !== 'undo') {
                        const prevTitle = btn.title;
                        btn.classList.add('qp-btn-red');
                        btn.title = 'Price fetch failed — click to retry';
                        setTimeout(() => {
                            if (btn.dataset.mode !== 'undo') {
                                btn.classList.remove('qp-btn-red');
                                btn.title = prevTitle;
                            }
                        }, 2500);
                    }
                }
                resolve(false);
            });
        });
    }

    // =====================================================================
    // TAB / ITEM VISIBILITY
    // =====================================================================

    /** Items in the currently visible add-items list(s), excluding tab entries. */
    function getVisibleItems() {
        const allItemsLists = document.querySelectorAll(SELECTORS.itemLists);
        let visibleItems = [];
        for (const list of allItemsLists) {
            const listStyle = window.getComputedStyle(list);
            if (listStyle.display !== 'none') {
                const items = list.querySelectorAll(SELECTORS.addItems);
                visibleItems = visibleItems.concat(Array.from(items).filter(item => !item.className.includes(SELECTORS.tabItemClass)));
            }
        }
        return visibleItems;
    }

    // =====================================================================
    // MANAGE ITEMS PAGE
    // =====================================================================

    /**
     * Fetch the market price for one manage-page item and write it into the input.
     * @returns {Promise<'updated'|'declined'|'failed'>} what actually happened, so
     *          batch runs can report real counts instead of attempts.
     */
    function updateManageItemPrice(priceDiv, itemId, itemName, { confirmLargeChange = true } = {}) {
        return new Promise((resolve) => {
            const priceInput = priceDiv.querySelector(SELECTORS.managePriceInput);
            if (!priceInput) { warnSelectorMiss('managePriceInput'); resolve('failed'); return; }
            const currentPrice = parseInt(priceInput.value.replace(/,/g, ''), 10) || 0;
            priceInput.disabled = true;
            priceInput.style.opacity = '0.5';
            fetchItemData(itemId, async ({ marketValue, buyPrice, sellPrice, lowestMarketPrice }) => {
                try {
                    priceInput.disabled = false;
                    priceInput.style.opacity = '1';
                    if (marketValue <= 0) {
                    qpToast(`Could not fetch price for ${itemName || 'this item'}`, 'error');
                    resolve('failed');
                    return;
                }
                const newPrice = calculateFinalPrice(marketValue, buyPrice, sellPrice, lowestMarketPrice, CONFIG.defaultDiscount);
                const priceDiff = Math.abs(newPrice - currentPrice);
                const percentDiff = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 100;
                if (confirmLargeChange && percentDiff > CONFIG.priceDiffThreshold && currentPrice > 0) {
                    const direction = newPrice > currentPrice ? 'increase' : 'decrease';
                    const confirmed = await qpConfirm(
                        `${itemName ? itemName + '\n\n' : ''}Price ${direction} detected!\n\nCurrent: $${currentPrice.toLocaleString()}\nNew: $${newPrice.toLocaleString()}\nDifference: ${percentDiff.toFixed(1)}%\n\nUpdate to new price?`,
                        { title: 'Big price change', confirmText: 'Update price' }
                    );
                    if (!confirmed) { resolve('declined'); return; }
                }
                priceInput.value = newPrice;
                priceInput.dispatchEvent(new Event('input', { bubbles: true }));
                priceInput.dispatchEvent(new Event('change', { bubbles: true }));
                const cityFloor=(buyPrice>0?buyPrice:sellPrice); const borderColor = (cityFloor > 0 && newPrice === cityFloor) ? '#f0a35e' : '#4f8fe8';
                priceInput.style.border = `2px solid ${borderColor}`;
                    setTimeout(() => priceInput.style.border = '', 1000);
                    resolve('updated');
                } catch (e) {
                    console.error('[SakaLuXBazaarSmartPricer] Manage pricing failed:', e);
                    priceInput.disabled = false;
                    priceInput.style.opacity = '1';
                    qpToast(`Pricing failed for ${itemName || 'this item'}`, 'error');
                    resolve('failed');
                }
            });
        });
    }

    /**
     * Build the per-item button container, prefixing a blinking RW badge dot
     * when the item is a ranked-war weapon. Shared by both bazaar pages.
     * @returns {{btnContainer: HTMLDivElement, btnInput: HTMLButtonElement}}
     */
    function buildItemButton(rwInfo, { containerClass, buttonClass, svg, normalTitle }) {
        const btnContainer = document.createElement('div');
        btnContainer.className = containerClass;
        const btnInput = document.createElement('button');
        btnInput.innerHTML = svg;
        btnInput.className = buttonClass;
        if (rwInfo.isRanked) {
            const dot = document.createElement('span');
            dot.className = `qp-rw-dot${rwInfo.rarity ? ` rw-${rwInfo.rarity}` : ' rw-unknown'}`;
            dot.title = rwSkipLabel(rwInfo);
            btnContainer.appendChild(dot);
            btnContainer.appendChild(btnInput);
            btnInput.title = `RW Weapon (${rwSkipLabel(rwInfo)}) — click to price manually`;
        } else {
            btnContainer.appendChild(btnInput);
            btnInput.title = normalTitle;
        }
        btnInput.setAttribute('aria-label', btnInput.title);
        return { btnContainer, btnInput };
    }

    function addUpdatePriceButton(manageItem) {
        if (processedManageItems.has(manageItem)) return;
        if (manageItem.className.includes(SELECTORS.tabItemClass)) return;
        const priceDiv = manageItem.querySelector(SELECTORS.managePriceWrap);
        if (!priceDiv) return;
        if (priceDiv.querySelector('.quick-update-price-btn')) {
            processedManageItems.add(manageItem);
            return;
        }
        processedManageItems.add(manageItem);
        const image = manageItem.querySelector('img');
        if (!image) return;
        const itemId = getItemIdFromImage(image);
        if (!itemId) return;

        const rwInfo = getRWBonusInfo(manageItem);
        const { btnContainer, btnInput } = buildItemButton(rwInfo, {
            containerClass: 'quick-update-price-btn',
            buttonClass: 'qp-item-btn',
            svg: refreshSVG,
            normalTitle: 'Update Price'
        });

        priceDiv.style.display = 'flex';
        priceDiv.style.alignItems = 'center';
        priceDiv.appendChild(btnContainer);

        btnInput.addEventListener('click', async function(event) {
            event.stopPropagation();
            event.preventDefault();
            if (!CONFIG.apiKey) { showApiKeyPrompt(); return; }
            if (CONFIG.skipRwWeapons && rwInfo.isRanked) { qpToast('RW weapon skipped by Settings', 'info'); return; }
            if (CONFIG.skipBonusItems && hasAnyBonus(manageItem)) { qpToast('Bonus item skipped by Settings', 'info'); return; }
            if (rwInfo.isRanked && !(await confirmRwPricing(rwInfo))) return;
            updateManageItemPrice(priceDiv, itemId, getItemName(manageItem));
        });
    }

    /**
     * Walk up from a matching section heading to the nearest ancestor that
     * contains item rows — used to scope queries to one bazaar section.
     */
    function findSectionContainer(matchFn) {
        const headings = Array.from(document.querySelectorAll(SELECTORS.sectionHeadings));
        const heading = headings.find(matchFn);
        if (!heading) return null;
        let node = heading.parentElement;
        for (let i = 0; i < 5 && node && node !== document.body; i++) {
            if (node.querySelector(SELECTORS.manageItems)) return node;
            node = node.parentElement;
        }
        return null;
    }

    function getManageItems() {
        // Scoped to the "Manage your Bazaar" section specifically — a plain class-based
        // selector here also matches rows in the "Add items" section (they share the
        // same item___ classnames), which was causing the chip to misdetect context and
        // fire updateAllManagePrices() on the add-items page. If the manage heading
        // isn't found, treat it as "no manage items" rather than falling back to a
        // document-wide scan, since a false negative here is harmless but a false
        // positive breaks the chip.
        const container = findSectionContainer(h =>
            h.textContent.includes('Manage your Bazaar') ||
            h.textContent.includes('Manage items') ||
            h.textContent.includes('Manage Bazaar')
        );
        if (!container) return [];
        const manageItemsList = container.querySelectorAll(SELECTORS.manageItems);
        return Array.from(manageItemsList).filter(item => !item.className.includes(SELECTORS.tabItemClass));
    }

    /**
     * Torn lazy-loads bazaar rows (~48 at a time) and only renders the next
     * chunk once the last row scrolls into view, so a batch run can only see
     * the rows already in the DOM. We deliberately do NOT auto-scroll to force
     * the rest in — programmatically moving the page simulates interaction the
     * user never performed, which Torn's script rules disallow. Instead, if the
     * last rendered row still sits below the fold (so more rows may be waiting
     * to load), the caller tells the user to scroll down and run again.
     * @param {Element[]} items currently rendered rows
     * @returns {boolean} true if more rows may exist below what's loaded
     */
    function mayHaveUnloadedItems(items) {
        if (items.length === 0) return false;
        const lastRect = items[items.length - 1].getBoundingClientRect();
        return lastRect.top > window.innerHeight;
    }

    function findLiveManageItem(itemId, itemName) {
        const items=getManageItems();
        for(const item of items){
            const image=item.querySelector('img');
            if(!image) continue;
            if(getItemIdFromImage(image)!==itemId) continue;
            if(itemName){
                const n=getItemName(item);
                if(n && n!==itemName) continue;
            }
            return item;
        }
        return null;
    }

    async function ensureManagePriceEditor(item) {
        const findEditor=()=>{
            const direct=item.querySelector(SELECTORS.managePriceWrap);
            if(direct?.querySelector(SELECTORS.managePriceInput)) return direct;
            const name=getItemName(item);
            const container=findSectionContainer(h => h.textContent.includes('Manage your Bazaar') || h.textContent.includes('Manage items') || h.textContent.includes('Manage Bazaar')) || item.parentElement;
            if(!container) return null;
            for(const candidate of container.querySelectorAll(SELECTORS.manageItems)){
                if(name && getItemName(candidate)!==name) continue;
                const p=candidate.querySelector(SELECTORS.managePriceWrap);
                if(p?.querySelector(SELECTORS.managePriceInput)) return p;
            }
            return null;
        };
        let p=findEditor(); if(p) return {priceDiv:p,opened:false,toggle:null};
        const controls=[...item.querySelectorAll('button,[role="button"],a')];
        let toggle=controls.find(el=>/expand|edit|details|open/i.test((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')));
        if(!toggle) toggle=controls[controls.length-1] || item.querySelector('[class*="arrow"],[class*="chevron"],[class*="expand"]');
        if(!toggle) return null;
        toggle.click();
        for(let i=0;i<24;i++){await new Promise(r=>setTimeout(r,75));p=findEditor();if(p)return{priceDiv:p,opened:true,toggle};}
        return null;
    }

    async function updateAllManagePrices() {
        const updateButton=chipFillBtn;
        if(updateButton){updateButton.disabled=true;updateButton.style.opacity='0.5';updateButton.textContent='Loading…';}
        const restoreButton=()=>{if(updateButton){updateButton.disabled=false;updateButton.style.opacity='1';updateButton.textContent='Update All';}};
        const items=getManageItems();
        if(items.length===0){restoreButton();qpToast('No items found to update!','error');return;}
        const moreBelow=mayHaveUnloadedItems(items);
        let skippedRw=0,skippedBonus=0,skippedDollar=0,updated=0,failed=0,done=0;
        const work=[];
        const seenIds=new Set();
        for(const item of items){
            const image=item.querySelector('img'); if(!image)continue;
            const itemId=getItemIdFromImage(image); if(!itemId||seenIds.has(itemId))continue;
            seenIds.add(itemId);
            if(CONFIG.skipRwWeapons&&getRWBonusInfo(item).isRanked){skippedRw++;continue;}
            if(CONFIG.skipBonusItems&&hasAnyBonus(item)){skippedBonus++;continue;}
            work.push({itemId,itemName:getItemName(item)});
        }
        for(const job of work){
            done++;
            if(updateButton)updateButton.textContent=`Opening ${done}/${work.length}`;
            // Always reacquire the current live row; Torn may replace row nodes
            // whenever an accordion row opens/closes.
            const liveItem=findLiveManageItem(job.itemId,job.itemName);
            if(!liveItem){failed++;continue;}
            const editor=await ensureManagePriceEditor(liveItem);
            if(!editor){failed++;continue;}
            const input=editor.priceDiv.querySelector(SELECTORS.managePriceInput);
            const current=input?parseInt(String(input.value||'').replace(/,/g,''),10)||0:0;
            if(CONFIG.skipDollarItems&&current===1){
                skippedDollar++;
                if(editor.opened&&editor.toggle){editor.toggle.click();await new Promise(r=>setTimeout(r,180));}
                continue;
            }
            if(updateButton)updateButton.textContent=`Pricing ${done}/${work.length}`;
            const result=await updateManageItemPrice(editor.priceDiv,job.itemId,job.itemName,{confirmLargeChange:false});
            if(result==='updated')updated++;else if(result==='failed')failed++;
            if(editor.opened&&editor.toggle){
                editor.toggle.click();
                await new Promise(r=>setTimeout(r,220));
            } else {
                await new Promise(r=>setTimeout(r,120));
            }
        }
        restoreButton();
        let msg=`Updated ${updated} of ${work.length} item price${work.length===1?'':'s'}`;
        if(skippedRw)msg+=` — ${skippedRw} RW skipped`;
        if(skippedBonus)msg+=` — ${skippedBonus} bonus skipped`;
        if(skippedDollar)msg+=` — ${skippedDollar} $1 skipped`;
        if(failed)msg+=` — ${failed} failed`;
        if(moreBelow)msg+=' — scroll down to load more items, then run again';
        msg+=' — press SAVE CHANGES in Torn to commit';
        qpToast(msg,failed?'error':'success',6500);
    }

    // =====================================================================
    // FLOATING DRAG CHIP  (replaces the old embedded "Quick Fill / Update All
    // / Settings" buttons, which Torn's desktop-top layout could clip or
    // hide entirely depending on header width. The chip lives on document.body
    // as a fixed-position element, independent of any page container, so it
    // can't be hidden by a layout it doesn't belong to. Position is
    // draggable and persisted per player via GM_setValue.)
    // =====================================================================

    let chipEl = null;
    let chipFillBtn = null;
    let chipContext = null; // 'add' | 'manage' | null

    function clampChipPosition(x, y) {
        const rect = chipEl.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 6;
        const maxY = window.innerHeight - rect.height - 6;
        return { x: Math.min(Math.max(x, 6), Math.max(maxX, 6)), y: Math.min(Math.max(y, 6), Math.max(maxY, 6)) };
    }

    function applyChipPosition() {
        const pos = GM_getValue('chipPosition', null);
        if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
            // Clamp to the current viewport: a position saved on a large monitor
            // must not restore off-screen on a phone.
            const { x, y } = clampChipPosition(pos.x, pos.y);
            chipEl.style.left = x + 'px';
            chipEl.style.top = y + 'px';
            chipEl.style.bottom = 'auto';
            chipEl.style.transform = 'none';
        }
        // otherwise leave the CSS default (bottom-center) in place
    }

    function createFloatingChip() {
        if (chipEl) return;
        // Defensive cleanup: if the script gets re-injected (PDA re-injection, SPA route
        // change) without a full page reload, a previous instance's chip can be orphaned
        // in the DOM with no reference to clean it up. Sweep those out before making a new one.
        document.querySelectorAll('.qp-chip').forEach(el => el.remove());
        chipEl = document.createElement('div');
        chipEl.className = 'qp-chip';
        chipEl.innerHTML = `
            <div class="qp-chip-grip" id="qpChipGrip" title="Drag to reposition" role="button" tabindex="0" aria-label="Move chip (use arrow keys)">⋮⋮</div>
            <button class="qp-chip-fill" id="qpChipFill">Quick Fill</button>
            <button class="qp-chip-gear" id="qpChipGear" title="Settings" aria-label="Settings">${gearSVG}</button>
        `;
        document.body.appendChild(chipEl);
        chipFillBtn = chipEl.querySelector('#qpChipFill');

        applyChipPosition();

        chipEl.querySelector('#qpChipGear').addEventListener('click', (e) => {
            e.preventDefault();
            showSettingsPanel();
        });

        chipFillBtn.addEventListener('click', () => {
            if (!CONFIG.apiKey) { showApiKeyPrompt(); return; }
            if (chipContext === 'manage') updateAllManagePrices();
            else fillAllItems();
        });

        // Drag handling via Pointer Events (covers mouse + touch/stylus in one API)
        const grip = chipEl.querySelector('#qpChipGrip');
        let dragOffsetX = 0, dragOffsetY = 0, dragging = false;

        grip.addEventListener('pointerdown', (e) => {
            dragging = true;
            chipEl.classList.add('qp-chip-dragging');
            const rect = chipEl.getBoundingClientRect();
            // Lock in current pixel position before dragging so left/top math is stable
            chipEl.style.left = rect.left + 'px';
            chipEl.style.top = rect.top + 'px';
            chipEl.style.bottom = 'auto';
            chipEl.style.transform = 'none';
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            grip.setPointerCapture(e.pointerId);
        });
        grip.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const { x, y } = clampChipPosition(e.clientX - dragOffsetX, e.clientY - dragOffsetY);
            chipEl.style.left = x + 'px';
            chipEl.style.top = y + 'px';
        });
        const endDrag = (e) => {
            if (!dragging) return;
            dragging = false;
            chipEl.classList.remove('qp-chip-dragging');
            const rect = chipEl.getBoundingClientRect();
            GM_setValue('chipPosition', { x: rect.left, y: rect.top });
        };
        grip.addEventListener('pointerup', endDrag);
        grip.addEventListener('pointercancel', endDrag);

        // Keyboard repositioning for the grip (paired with its role="button")
        grip.addEventListener('keydown', (e) => {
            const step = 10;
            let dx = 0, dy = 0;
            if (e.key === 'ArrowLeft') dx = -step;
            else if (e.key === 'ArrowRight') dx = step;
            else if (e.key === 'ArrowUp') dy = -step;
            else if (e.key === 'ArrowDown') dy = step;
            else return;
            e.preventDefault();
            const rect = chipEl.getBoundingClientRect();
            chipEl.style.bottom = 'auto';
            chipEl.style.transform = 'none';
            const { x, y } = clampChipPosition(rect.left + dx, rect.top + dy);
            chipEl.style.left = x + 'px';
            chipEl.style.top = y + 'px';
            GM_setValue('chipPosition', { x, y });
        });

        window.addEventListener('resize', () => {
            if (!chipEl) return;
            const pos = GM_getValue('chipPosition', null);
            if (!pos) return;
            const { x, y } = clampChipPosition(pos.x, pos.y);
            chipEl.style.left = x + 'px';
            chipEl.style.top = y + 'px';
        });
    }

    function updateChipContext() {
        if (!chipEl) return;
        // A running batch owns the button label (progress text) — don't clobber it.
        if (chipFillBtn && chipFillBtn.disabled) return;
        const manageCount = getManageItems().length;
        if (manageCount > 0) {
            chipContext = 'manage';
            chipFillBtn.textContent = 'Update All';
            return;
        }
        const addCount = getVisibleItems().length;
        if (addCount > 0) {
            chipContext = 'add';
            chipFillBtn.textContent = 'Quick Fill';
        }
        // if neither section has items yet (still loading), keep the last known context
    }

    function processManageItems() {
        const items = getManageItems();
        if (items.length > 0) items.forEach(item => addUpdatePriceButton(item));
    }

    // =====================================================================
    // ADD ITEMS PAGE
    // =====================================================================

    function addQuickPriceButton(itemElement) {
        if (processedItems.has(itemElement)) return;
        const descriptionCont = itemElement.querySelector(SELECTORS.itemDescription);
        if (!descriptionCont) return;
        if (descriptionCont.querySelector('.quick-price-btn')) { processedItems.add(itemElement); return; }
        processedItems.add(itemElement);
        const image = itemElement.querySelector(SELECTORS.itemImage);
        if (!image) return;
        const itemId = getItemIdFromImage(image);
        if (!itemId) return;
        const amountDiv = itemElement.querySelector('div.amount-main-wrap');
        if (!amountDiv) return;
        const priceInputs = amountDiv.querySelectorAll(SELECTORS.priceInputs);
        if (priceInputs.length === 0) return;

        const rwInfo = getRWBonusInfo(itemElement);
        const { btnContainer, btnInput } = buildItemButton(rwInfo, {
            containerClass: 'quick-price-btn',
            buttonClass: 'qp-item-btn',
            svg: addButtonSVG,
            normalTitle: 'Quick Add / Undo'
        });
        btnInput.dataset.mode = 'add';

        descriptionCont.style.display = 'flex';
        descriptionCont.style.alignItems = 'center';
        descriptionCont.appendChild(btnContainer);

        btnInput.addEventListener('click', async function(event) {
            event.stopPropagation();
            if (btnInput.dataset.mode === 'undo') {
                clearItemInputs(itemElement);
                btnInput.classList.remove('qp-btn-red');
                btnInput.dataset.mode = 'add';
                return;
            }
            if (!CONFIG.apiKey) { showApiKeyPrompt(); return; }
            if (CONFIG.skipRwWeapons && rwInfo.isRanked) { qpToast('RW weapon skipped by Settings', 'info'); return; }
            if (CONFIG.skipBonusItems && hasAnyBonus(itemElement)) { qpToast('Bonus item skipped by Settings', 'info'); return; }
            if (rwInfo.isRanked && !(await confirmRwPricing(rwInfo))) return;
            btnInput.disabled = true;
            btnInput.style.opacity = '0.5';
            fillItemPrice(itemElement).then(() => { btnInput.disabled = false; btnInput.style.opacity = '1'; });
        });
    }

    async function fillAllItems() {
        const fillButton = chipFillBtn;
        if (fillButton) { fillButton.disabled = true; fillButton.style.opacity = '0.5'; fillButton.textContent = 'Loading…'; }
        // Same as Update All: only the rows Torn has already rendered are
        // processed; rows below the fold aren't in the DOM until scrolled to.
        const items = getVisibleItems();
        if (items.length === 0) {
            if (fillButton) { fillButton.disabled = false; fillButton.style.opacity = '1'; fillButton.textContent = 'Quick Fill'; }
            qpToast('No items found to fill!', 'error');
            return;
        }
        const moreBelow = mayHaveUnloadedItems(items);
        let skippedRw = 0, skippedBonus = 0;
        const toFill = items.filter(item => {
            if (CONFIG.skipRwWeapons && getRWBonusInfo(item).isRanked) { skippedRw++; return false; }
            if (CONFIG.skipBonusItems && hasAnyBonus(item)) { skippedBonus++; return false; }
            return true;
        });
        if (fillButton) fillButton.textContent = `Filling 0/${toFill.length}`;
        let completed = 0, filled = 0;
        const promises = toFill.map(item => fillItemPrice(item).then((ok) => {
            completed++;
            if (ok) filled++;
            if (fillButton) fillButton.textContent = `Filling ${completed}/${toFill.length}`;
        }));
        await Promise.all(promises);
        if (fillButton) { fillButton.disabled = false; fillButton.style.opacity = '1'; fillButton.textContent = 'Quick Fill'; }
        const failedCount = toFill.length - filled;
        let msg = `Filled ${filled} of ${toFill.length} item${toFill.length === 1 ? '' : 's'}`;
        if (skippedRw > 0) msg += ` — ${skippedRw} RW weapon${skippedRw > 1 ? 's' : ''} skipped`;
        if (skippedBonus > 0) msg += ` — ${skippedBonus} bonus item${skippedBonus > 1 ? 's' : ''} skipped`;
        if (failedCount > 0) msg += ` — ${failedCount} failed`;
        if (moreBelow) msg += ' — scroll down to load more items, then run again';
        qpToast(msg, failedCount > 0 ? 'error' : 'success', 6000);
    }

    // =====================================================================
    // ITEM PROCESSING
    // =====================================================================

    function processAllItems() {
        const items = document.querySelectorAll(SELECTORS.allAddItems);
        if (items.length > 0) {
            items.forEach(item => {
                if (!item.className.includes(SELECTORS.tabItemClass)) addQuickPriceButton(item);
            });
        }
    }

    // =====================================================================
    // OBSERVER & INIT
    // =====================================================================

    let bazaarObserver = null;

    const MODULE_ENABLED_KEY = 'moduleEnabled';

    function isModuleEnabled() {
        try { const local = localStorage.getItem('SakaLuX_BAZAAR_SMART_PRICER_ENABLED'); if (local === '1') return true; if (local === '0') return false; } catch {}
        return GM_getValue(MODULE_ENABLED_KEY, true) !== false;
    }

    function stopModuleRuntime() {
        if (bazaarObserver) { bazaarObserver.disconnect(); bazaarObserver = null; }
        clearTimeout(mutationDebounceTimer);
        document.querySelectorAll('.qp-chip,.quick-price-btn,.quick-update-price-btn,.qp-overlay,.qp-toast-wrap').forEach(el => el.remove());
        chipEl = null;
        chipFillBtn = null;
        isScriptInitialized = false;
    }

    function setModuleEnabled(value) {
        const enabled = Boolean(value);
        GM_setValue(MODULE_ENABLED_KEY, enabled);
        try { localStorage.setItem('SakaLuX_BAZAAR_SMART_PRICER_ENABLED', enabled ? '1' : '0'); } catch {}
        if (enabled) {
            checkForBazaar();
        } else {
            stopModuleRuntime();
        }
        try {
            window.dispatchEvent(new CustomEvent('SakaLuX:BazaarSmartPricerStateChanged', { detail: { version: VERSION, enabled } }));
        } catch {}
        return enabled;
    }

    function toggleModuleEnabled() {
        return setModuleEnabled(!isModuleEnabled());
    }

    function setupObserver(bazaarRoot) {
        if (bazaarObserver) bazaarObserver.disconnect();
        bazaarObserver = new MutationObserver(() => {
            clearTimeout(mutationDebounceTimer);
            mutationDebounceTimer = setTimeout(() => {
                processAllItems();
                processManageItems();
                updateChipContext();
            }, 300);
        });
        bazaarObserver.observe(bazaarRoot, { childList: true, subtree: true });
    }

    function initScript(bazaarRoot) {
        if (!isModuleEnabled()) return;
        // Full init regardless of key state: the chip and item buttons stay usable
        // and simply prompt for a key when clicked, instead of the script going
        // dead until a reload if the first-run prompt is dismissed.
        processAllItems();
        setupObserver(bazaarRoot);
        processManageItems();
        createFloatingChip();
        updateChipContext();
        if (!CONFIG.apiKey) showApiKeyPrompt();
    }

    let isScriptInitialized = false;

    const ROOT_WAIT_TIMEOUT_MS = 20000;

    function checkForBazaar() {
        if (!isModuleEnabled()) return;
        if (isScriptInitialized) return;
        const findRoot = () =>
            document.querySelector(SELECTORS.bazaarRoot) || document.querySelector(SELECTORS.bazaarRootLegacy);
        const root = findRoot();
        if (root) {
            isScriptInitialized = true;
            initScript(root);
            return;
        }

        // Multi-stage initialization fallback strategy for Torn PDA and various mobile browsers:
        // 1. MutationObserver on document.body or documentElement
        let observer = null;
        const target = document.body || document.documentElement;
        if (target) {
            observer = new MutationObserver(() => {
                if (isScriptInitialized) { observer.disconnect(); return; }
                const found = findRoot();
                if (found) {
                    isScriptInitialized = true;
                    observer.disconnect();
                    if (pollingInterval) clearInterval(pollingInterval);
                    clearTimeout(giveUpTimer);
                    initScript(found);
                }
            });
            observer.observe(target, { childList: true, subtree: true });
        }

        // 2. Polling fallback (100ms interval for up to 50 attempts = 5s)
        let attempts = 0;
        const pollingInterval = setInterval(() => {
            if (isScriptInitialized) {
                clearInterval(pollingInterval);
                if (observer) observer.disconnect();
                return;
            }
            attempts++;
            const found = findRoot();
            if (found) {
                isScriptInitialized = true;
                clearInterval(pollingInterval);
                if (observer) observer.disconnect();
                clearTimeout(giveUpTimer);
                initScript(found);
            } else if (attempts >= 50) {
                clearInterval(pollingInterval);
            }
        }, 100);

        // 3. Hard timeout safeguard
        const giveUpTimer = setTimeout(() => {
            if (!isScriptInitialized) {
                if (observer) observer.disconnect();
                if (pollingInterval) clearInterval(pollingInterval);
                console.warn(`[SakaLuXBazaarSmartPricer] Bazaar container not found after ${ROOT_WAIT_TIMEOUT_MS / 1000}s — giving up`);
            }
        }, ROOT_WAIT_TIMEOUT_MS);
    }

    function init() {
        if (!isModuleEnabled()) return;
        // Stage 0: Check immediately
        checkForBazaar();
        if (isScriptInitialized) return;

        // Stage 1: DOMContentLoaded listener
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkForBazaar);
        }
    }

    // Test hook: under the Node test runner (jsdom + GM_* stubs) expose the pure
    // helpers and skip booting against a live page. In the browser `module` is
    // undefined, so this block is inert there and init() runs as normal.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            isValidApiKey,
            clampDiscount,
            clampThreshold,
            calculateFinalPrice,
            rwSkipLabel,
            getRWBonusInfo,
            detectRarity,
            getItemIdFromImage,
            getQuantity,
            getItemName,
            getCachedPrice,
            cachePrice,
            clearPriceCache,
            CONFIG,
            SELECTORS
        };
        return;
    }

    try {
        document.documentElement?.setAttribute('data-sakalux-bazaar-smart-pricer', '1');
        window.SakaLuXBazaarSmartPricer = {
            version: VERSION,
            open: showSettingsPanel,
            openSettings: showSettingsPanel,
            quickFill: fillAllItems,
            priceAll: fillAllItems,
            refresh: () => { if (isModuleEnabled()) { processAllItems(); processManageItems(); updateChipContext(); } },
            isEnabled: isModuleEnabled,
            setEnabled: setModuleEnabled,
            toggleEnabled: toggleModuleEnabled
        };
    } catch {}

    init();

})();
