// ==UserScript==
// @name         SakaLuX Account Auditor
// @namespace    sakalux.account.auditor
// @version      1.3.25
// @description  Private read-only Torn account auditor with rate-limit-safe API collection, split GitHub snapshots, and user-triggered capture of the currently visible Torn message.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      api.torn.com
// @connect      api.github.com
// @license      MIT
// @run-at       document-end
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
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
  const SELF = Object.freeze(Object.assign({"id":"account-auditor","name":"Auditor","icon":"🔎","selector":"#sl-aa-button","fallback":"https://www.torn.com/index.php"}, { version: "1.3.25" }));
  const API_GLOBAL = "";
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



(function () {
    'use strict';

    const VERSION = '1.3.25';
    const NAME = 'SakaLuX Account Auditor';
    const PDA_KEY = '###PDA-APIKEY###';
    const AUDITOR_API_CREATE_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Account%20Auditor&user=profile,bars,cooldowns,travel,education,jobpoints,merits,refills,notifications,money,stocks,properties,discord,weaponexp,workstats,skills,battlestats,networth,display,icons,criminalrecord,bazaar,crimes,hof,ammo,attacksfull,bounties,calendar,casino,competition,enlistedcars,equipment,faction,forumfeed,forumfriends,forumposts,forumsubscribedthreads,forumthreads,gym,honors,itemmarket,itemmods,job,jobranks,medals,missions,organizedcrime,organizedcrimes,perks,property,races,racingrecords,reports,revivesfull,trades,virus,snapshot,personalstats,list,inventory,messages,events,log&torn=merits,education';
    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 12 * 60 * 60 * 1000;
    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';
    const STORAGE = {
        apiKey:'SakaLuX_AUDITOR_TORN_API_KEY',
        githubToken:'SakaLuX_AUDITOR_GITHUB_TOKEN',
        settings:'SakaLuX_AUDITOR_SETTINGS_V3',
        lastSync:'SakaLuX_AUDITOR_LAST_SYNC_V3',
        captures:'SakaLuX_AUDITOR_MESSAGE_CAPTURES_V1',
        auditBaseline:'SakaLuX_AUDITOR_CHANGE_BASELINE_V1',
        lastChanges:'SakaLuX_AUDITOR_LAST_CHANGES_V1'
    };
    const DEFAULT_SETTINGS = {
        repo:'SakaLuX/SakaLuX-Torn-Account-Data', branch:'main', auditFolder:'audit', path:'SakaLuX-Account-Snapshot.json',
        autoSync:false, autoSyncMinutes:30, showButton:true, includePrivateData:true, maxPrivatePages:200,
        splitSnapshots:true, includeCapturedMessages:true
    };
    const V2_ENDPOINTS = [
        'profile','bars','cooldowns','travel','education','jobpoints','merits','refills','notifications','money',
        'stocks','properties','discord','weaponexp','workstats','skills','battlestats','networth','display','icons',
        'bazaar','hof','ammo','attacksfull','bounties','calendar','casino','competition',
        'enlistedcars','equipment','faction','forumfeed','forumfriends','forumposts','forumsubscribedthreads',
        'forumthreads','gym','honors','itemmarket','itemmods','job','jobranks','medals','missions','organizedcrime',
        'organizedcrimes','perks','property','races','racingrecords','reports','revivesfull','trades','virus'
    ];
    // newmessages/newevents are subsets of messages/events and are intentionally omitted to prevent duplicate records.
    const V2_PRIVATE_ENDPOINTS = ['messages','events'];
    const CONTACT_LISTS = ['Friends','Enemies','Targets'];
    const INVENTORY_CATEGORIES = [
        'Collectible','Clothing','Other','Tool','Melee','Defensive','Material','Car','Primary','Secondary','Book',
        'Special','Supply Pack','Temporary','Enhancer','Artifact','Flower','Booster','Medical','Candy','Jewelry',
        'Alcohol','Plushie','Drug','Energy Drink'
    ];

    let settings = Object.assign({}, DEFAULT_SETTINGS, loadJson(STORAGE.settings, {}));
    let busy = false, autoTimer = null, lastStatus = '';

    function rawGet(key){
        try { if (typeof GM_getValue === 'function') { const v=GM_getValue(key,''); if (typeof v==='string' && v) return v; } } catch(_){}
        try { return localStorage.getItem(key)||''; } catch(_) { return ''; }
    }
    function rawSet(key,value){
        const text=String(value??'');
        try{if(typeof GM_setValue==='function')GM_setValue(key,text);}catch(_){}
        // TornPDA/Tampermonkey compatibility: mirror values to localStorage too.
        // Some environments expose asynchronous GM storage semantics, so removing
        // the fallback here made freshly-saved values (notably LAST SYNC) read as empty.
        try{localStorage.setItem(key,text);}catch(_){}
    }
    function loadJson(key,fallback){ try{const raw=rawGet(key); return raw?JSON.parse(raw):fallback;}catch(_){return fallback;} }
    function saveJson(key,value){ try{rawSet(key,JSON.stringify(value));}catch(_){} }
    function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');}
    function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
    function getTornApiKey(){const saved=rawGet(STORAGE.apiKey);if(saved)return saved;return PDA_KEY && PDA_KEY!=='###PDA-APIKEY###' ? PDA_KEY : ''; }

    const RATE={minGapMs:1100,retryDelays:[3000,6000,12000],lastAt:0};
    let rateQueue=Promise.resolve();
    function rateGate(){const grant=rateQueue.then(async()=>{const wait=Math.max(0,RATE.minGapMs-(Date.now()-RATE.lastAt));if(wait)await sleep(wait);RATE.lastAt=Date.now();});rateQueue=grant.catch(()=>{});return grant;}

    function request(url,options={}){
        return new Promise((resolve,reject)=>{
            const method=options.method||'GET', headers=options.headers||{}, body=options.body;
            if(method==='GET' && typeof window.PDA_httpGet==='function' && url.includes('api.torn.com')){
                window.PDA_httpGet(url,headers).then(r=>{try{const raw=r?.responseText??r?.body??r?.data??r;resolve({status:200,text:typeof raw==='string'?raw:JSON.stringify(raw)});}catch(e){reject(e);}}).catch(reject);return;
            }
            if(typeof GM_xmlhttpRequest==='function'){
                GM_xmlhttpRequest({method,url,headers,data:body,timeout:30000,onload:r=>resolve({status:r.status,text:r.responseText,headers:r.responseHeaders}),onerror:()=>reject(new Error('Network error')),ontimeout:()=>reject(new Error('Request timeout'))});return;
            }
            fetch(url,{method,headers,body}).then(async r=>resolve({status:r.status,text:await r.text()})).catch(reject);
        });
    }
    async function apiJson(url){
        try{const r=await request(url);let data;try{data=JSON.parse(r.text||'{}');}catch(_){return{ok:false,error:'Invalid JSON',httpStatus:r.status};}
            if(data?.error)return{ok:false,error:data.error.error||data.error.message||'Torn API error',code:data.error.code??null,httpStatus:r.status};
            if(r.status<200||r.status>=300)return{ok:false,error:'HTTP '+r.status,httpStatus:r.status,data};
            return{ok:true,data,httpStatus:r.status};
        }catch(e){return{ok:false,error:String(e?.message||e)};}
    }
    async function apiJsonWithRetry(url,retries=RATE.retryDelays.length){
        for(let attempt=0;;attempt++){
            await rateGate(); const r=await apiJson(url);
            if(r.ok || r.code!==5 || attempt>=retries) return r;
            const delay=RATE.retryDelays[Math.min(attempt,RATE.retryDelays.length-1)]; setStatus('Torn rate limit · retry in '+Math.ceil(delay/1000)+'s…'); await sleep(delay);
        }
    }
    function withKey(url,key){const sep=url.includes('?')?'&':'?';return /[?&]key=/.test(url)?url:url+sep+'key='+encodeURIComponent(key);}
    async function tornV1(selection,key){return apiJsonWithRetry('https://api.torn.com/user/?selections='+encodeURIComponent(selection)+'&key='+encodeURIComponent(key));}
    async function tornV2(endpoint,key,query='',absoluteUrl=''){let url=absoluteUrl||('https://api.torn.com/v2/user/'+encodeURIComponent(endpoint)+(query?(query.startsWith('?')?query:'?'+query):''));return apiJsonWithRetry(withKey(url,key));}
    async function tornV2Selection(endpoint,key,query=''){const q='selections='+encodeURIComponent(endpoint)+(query?'&'+String(query).replace(/^\?/,''):'');return apiJsonWithRetry(withKey('https://api.torn.com/v2/user?'+q,key));}
    async function tornGlobalV2(endpoint,key,query=''){let url='https://api.torn.com/v2/torn/'+encodeURIComponent(endpoint)+(query?(query.startsWith('?')?query:'?'+query):'');return apiJsonWithRetry(withKey(url,key));}
    const CRIME_2_IDS = Object.freeze([1,2,3,4,5,6,7,8,9,10,11,12]);
    async function collectCrimes2(key){
        const byCrime={},errors={};
        for(const id of CRIME_2_IDS){
            setStatus('v2 crimes · '+id+'/'+CRIME_2_IDS.length);
            const r=await tornV2Selection('crimes',key,'id='+encodeURIComponent(id));
            if(r.ok)byCrime[id]=sanitizeDeep(r.data);
            else errors[id]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};
        }
        return{ok:Object.keys(errors).length===0,data:{crimeIds:CRIME_2_IDS.slice(),byCrime},errors};
    }
    async function keyInfo(key){return apiJsonWithRetry(withKey('https://api.torn.com/v2/key/info',key));}
    async function testAuditorApiKey(candidate=''){
        const key=String(candidate||getTornApiKey()||'').trim();
        if(!key){setStatus('API KEY MISSING · create or paste an Auditor key first.');return false;}
        setStatus('Testing Auditor API key…');
        const info=await keyInfo(key);
        if(!info.ok){setStatus('API INVALID · '+String(info.error||'Unknown Torn API error'));return false;}
        const profile=await tornV2('profile',key);
        if(!profile.ok){setStatus('API ACCESS ERROR · '+String(profile.error||'Profile access failed'));return false;}
        rawSet(STORAGE.apiKey,key);
        const root=profile.data?.profile||profile.data||{};
        setStatus('API OK · '+String(root.name||'Torn account')+(root.player_id||root.id?' ['+(root.player_id||root.id)+']':''));
        return true;
    }
    function clearAuditorApiKey(){rawSet(STORAGE.apiKey,'');setStatus('Auditor API key cleared.');}

    function sanitizeDeep(value,depth=0){
        if(depth>40)return'[depth-limit]'; if(Array.isArray(value))return value.map(v=>sanitizeDeep(v,depth+1)); if(!value||typeof value!=='object')return value;
        const out={}; for(const[k,v]of Object.entries(value)){const kk=String(k).toLowerCase();if(['key','apikey','api_key','token','authorization','cookie','cookies','session','sessionid','password','secret'].includes(kk))continue;out[k]=sanitizeDeep(v,depth+1);}return out;
    }
    function nextLink(data){const n=data?._metadata?.links?.next??data?.metadata?.links?.next??data?._metadata?.next??null;return typeof n==='string'&&n?n:null;}
    async function collectPagedV2(endpoint,key,query='',maxPages=200){
        const pages=[];let url='';const seenUrls=new Set();const limit=Math.max(1,Math.min(500,Number(maxPages)||200));
        for(let page=0;page<limit;page++){
            if(url&&seenUrls.has(url))break;
            if(url)seenUrls.add(url);
            let result=await tornV2(endpoint,key,url?'':query,url);
            if(!url && !result.ok && (result.code===6 || result.code===7)) result=await tornV2Selection(endpoint,key,query);
            if(!result.ok)return{ok:false,error:result.error,code:result.code??null,httpStatus:result.httpStatus??null,pages};
            const clean=sanitizeDeep(result.data);pages.push(clean);
            const next=nextLink(clean);if(!next)break;
            url=next.startsWith('http')?next:'https://api.torn.com'+next;
        }
        const last=pages[pages.length-1];const truncated=Boolean(last&&nextLink(last)&&pages.length>=limit);
        return{ok:true,data:pages.length===1?pages[0]:{pages,pageCount:pages.length,truncated},pages,truncated};
    }
    async function collectContacts(key){const out={},errors={};for(const cat of CONTACT_LISTS){const r=await collectPagedV2('list',key,'cat='+encodeURIComponent(cat)+'&limit=50',200);if(r.ok)out[cat.toLowerCase()]=r.data;else errors[cat]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};}return{data:out,errors};}
    function countInventoryItems(payload){
        if(!payload)return 0;
        if(Array.isArray(payload?.inventory))return payload.inventory.length;
        if(Array.isArray(payload?.pages))return payload.pages.reduce((sum,page)=>sum+countInventoryItems(page),0);
        return 0;
    }
    async function collectInventory(key){
        const categories={},errors={};let itemCount=0;
        for(const cat of INVENTORY_CATEGORIES){
            const r=await collectPagedV2('inventory',key,'cat='+encodeURIComponent(cat)+'&limit=250',200);
            if(r.ok){categories[cat]=r.data;itemCount+=countInventoryItems(r.data);}
            else errors[cat]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};
        }
        return{data:{categories,itemCount,categoryCount:Object.keys(categories).length},errors};
    }

    function flattenCatalog(value,out=[],depth=0){
        if(depth>10||value==null)return out;
        if(Array.isArray(value)){for(const v of value)flattenCatalog(v,out,depth+1);return out;}
        if(typeof value!=='object')return out;
        const id=value.id??value.merit_id??value.education_id??value.course_id;
        const name=value.name??value.title??value.description??null;
        if(id!=null&&name)out.push({id:Number(id),name:String(name),raw:value});
        for(const v of Object.values(value))if(v&&typeof v==='object')flattenCatalog(v,out,depth+1);
        return out;
    }
    function catalogNameMap(value){const map={};for(const row of flattenCatalog(value)){if(Number.isFinite(row.id)&&!map[row.id])map[row.id]=row.name;}return map;}
    function decodeMerits(userMerits,catalog){
        const root=userMerits?.merits??userMerits??{}, upgrades=Array.isArray(root?.upgrades)?root.upgrades:[], names=catalogNameMap(catalog);
        return upgrades.map(u=>({id:u?.id??null,name:names[Number(u?.id)]||null,level:u?.level??null}));
    }
    function decodeEducation(userEducation,catalog){
        const root=userEducation?.education??userEducation??{}, names=catalogNameMap(catalog), complete=Array.isArray(root?.complete)?root.complete:[];
        return {complete:complete.map(id=>({id,name:names[Number(id)]||null})),current:root?.current?.id!=null?{...root.current,name:names[Number(root.current.id)]||null}:root?.current??null};
    }

    let snapshotPending=null;
    function collectSnapshot(){if(snapshotPending)return snapshotPending;snapshotPending=collectSnapshotData().finally(()=>{snapshotPending=null;});return snapshotPending;}
    async function collectSnapshotData(){
        const key=getTornApiKey(); if(!key)throw new Error('Torn API key missing. Open AUDIT settings and add a key, or use Torn PDA API injection.');
        const data={keyInfo:null,v2:{},special:{},private:{}},errors={},unavailable={};let requested=0,successful=0;
        requested++;setStatus('Checking API key…');const ki=await keyInfo(key);if(ki.ok){data.keyInfo=sanitizeDeep(ki.data);successful++;}else errors['key:info']={error:ki.error,code:ki.code??null,httpStatus:ki.httpStatus??null};
        setStatus('Loading Torn merit / education catalogs…');
        const meritCatalog=await tornGlobalV2('merits',key), educationCatalog=await tornGlobalV2('education',key);
        data.special.reference={merits:meritCatalog.ok?sanitizeDeep(meritCatalog.data):null,education:educationCatalog.ok?sanitizeDeep(educationCatalog.data):null};
        if(settings.includePrivateData){
            const privatePages=Math.max(1,Math.min(500,Number(settings.maxPrivatePages)||200));
            for(let i=0;i<V2_PRIVATE_ENDPOINTS.length;i++){
                const endpoint=V2_PRIVATE_ENDPOINTS[i];requested++;setStatus('PRIVATE '+endpoint+' '+(i+1)+'/'+V2_PRIVATE_ENDPOINTS.length);
                const q=endpoint==='events'?'limit=100':'limit=100&sort=desc';
                const r=await collectPagedV2(endpoint,key,q,privatePages);
                if(r.ok){data.private[endpoint]=r.data;successful++;}
                else{if(r.pages?.length)data.private[endpoint]={pages:r.pages,pageCount:r.pages.length,partial:true};errors['private:'+endpoint]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};}
            }
            requested++;setStatus('PRIVATE logs');const logs=await collectPagedV2('log',key,'limit=100&sort=desc',privatePages);
            if(logs.ok){data.private.log=logs.data;successful++;}
            else if(logs.code===16)unavailable['private:log']={reason:'Torn requires a Full access API key for user/log.',code:16};
            else errors['private:log']={error:logs.error,code:logs.code??null,httpStatus:logs.httpStatus??null};
        }
        // criminalrecord is API v1-only in Torn's current API matrix. Keep it as a compatibility
        // source, but normalize it into data.v2 so the split audit schema stays stable.
        requested++;setStatus('v1 criminalrecord compatibility');
        const criminalRecord=await tornV1('criminalrecord',key);
        if(criminalRecord.ok){data.v2.criminalrecord=sanitizeDeep(criminalRecord.data);successful++;}
        else errors['v1:criminalrecord']={error:criminalRecord.error,code:criminalRecord.code??null,httpStatus:criminalRecord.httpStatus??null};

        // user/crimes in API v2 is a per-crime endpoint and requires an explicit crime id.
        // Query every current Crimes 2.0 category instead of calling /user/crimes without an id.
        requested++;setStatus('v2 crimes by crime ID');
        const crimes2=await collectCrimes2(key);
        data.v2.crimes=crimes2.data;
        if(crimes2.ok)successful++;else errors['v2:crimes']=crimes2.errors;

        for(let i=0;i<V2_ENDPOINTS.length;i++){
            const endpoint=V2_ENDPOINTS[i];requested++;setStatus('v2 '+endpoint+' '+(i+1)+'/'+V2_ENDPOINTS.length);
            const r=await collectPagedV2(endpoint,key,'',200);
            if(r.ok){data.v2[endpoint]=r.data;successful++;}
            else errors['v2:'+endpoint]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};
        }
        requested++;const ps=await collectPagedV2('personalstats',key,'cat=all',200);if(ps.ok){data.special.personalstats=ps.data;successful++;}else errors['v2:personalstats']={error:ps.error,code:ps.code??null,httpStatus:ps.httpStatus??null};
        requested++;const contacts=await collectContacts(key);data.special.contacts=contacts.data;if(Object.keys(contacts.data).length)successful++;if(Object.keys(contacts.errors).length)errors['v2:list']=contacts.errors;
        requested++;const inv=await collectInventory(key);data.special.inventory=inv.data;if(inv.data.categoryCount)successful++;if(Object.keys(inv.errors).length)errors['v2:inventory']=inv.errors;
        data.special.decoded={merits:decodeMerits(data.v2.merits,data.special.reference?.merits),education:decodeEducation(data.v2.education,data.special.reference?.education)};
        const profileRoot=data.v2.profile||{},profile=profileRoot.profile||profileRoot;
        return{schema:'sakalux-torn-account-snapshot-v5',generatedAt:new Date().toISOString(),generatedAtUnix:Date.now(),script:{name:NAME,version:VERSION,mode:'read-only'},privacy:{containsTornApiKey:false,containsGitHubToken:false,containsBrowserCookies:false,containsPassword:false,privateDataIncluded:Boolean(settings.includePrivateData),capturedMessageBodiesRequireExplicitUserAction:true,note:'Official Torn API data plus only message text explicitly captured by the user from a visible Torn message page.'},capabilities:{canonicalApi:'v2',legacyV1Duplicates:false,legacyV1Compatibility:['criminalrecord'],excludedNonAccountEndpoints:['snapshot'],messageList:true,messageBodyViaOfficialApi:false,messageBodyViaUserCapture:true,logsRequireFullAccess:true,splitSnapshots:Boolean(settings.splitSnapshots)},account:{playerId:profile.player_id??profile.playerID??profile.user_id??profile.id??null,name:profile.name??null,level:profile.level??null,rank:profile.rank??null,status:profile.status??null,faction:profile.faction??null,job:profile.job??null,lastAction:profile.last_action??profile.lastAction??null,age:profile.age??null},coverage:{requested,successful,failed:Object.keys(errors).length,unavailable:Object.keys(unavailable).length,v2Endpoints:V2_ENDPOINTS.slice(),privateEndpoints:settings.includePrivateData?V2_PRIVATE_ENDPOINTS.concat(['log']):[],privateDataEnabled:Boolean(settings.includePrivateData),deduplication:'v2 canonical; criminalrecord uses required v1 compatibility; user/crimes is collected per Crimes 2.0 ID; user/snapshot is excluded because Torn returns a global daily-active-players CSV, not account data; no newmessages/newevents subsets; attacksfull/revivesfull replace reduced variants'},data,errors,unavailable};
    }

    function parseRepo(){const m=String(settings.repo||'').trim().match(/^([^/\s]+)\/([^/\s]+)$/);if(!m)throw new Error('GitHub repo must be owner/repository.');return{owner:m[1],repo:m[2]};}
    function utf8ToBase64(text){const bytes=new TextEncoder().encode(text);let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}
    async function githubJson(url,options={}){const token=rawGet(STORAGE.githubToken);if(!token)throw new Error('GitHub token missing.');const headers={'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};const r=await request(url,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined});let data={};try{data=JSON.parse(r.text||'{}');}catch(_){}if(r.status<200||r.status>=300)throw new Error('GitHub '+r.status+': '+(data?.message||'request failed'));return data;}
    async function syncJsonFile(path,value,message){
        const{owner,repo}=parseRepo(),branch=String(settings.branch||'main').trim()||'main';path=String(path).replace(/^\/+/, '');
        const api='https://api.github.com/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo)+'/contents/'+path.split('/').map(encodeURIComponent).join('/');
        const json=JSON.stringify(value,null,2)+'\n', encoded=utf8ToBase64(json);let current=null;
        try{current=await githubJson(api+'?ref='+encodeURIComponent(branch));}catch(e){if(!/GitHub 404:/.test(String(e?.message||e)))throw e;}
        if(current?.content&&String(current.content).replace(/\s/g,'')===encoded)return{unchanged:true,sha:current.sha,commit:null};
        const body={message,content:encoded,branch};if(current?.sha)body.sha=current.sha;
        return githubJson(api,{method:'PUT',body});
    }

    function pickFields(source,names,assigned){const out={};for(const name of names){if(Object.prototype.hasOwnProperty.call(source,name)){out[name]=source[name];assigned.add(name);}}return out;}
    function buildSplitSnapshots(snapshot){
        const v2=snapshot.data?.v2||{},sp=snapshot.data?.special||{},pv=snapshot.data?.private||{},assigned=new Set(),captures=settings.includeCapturedMessages?loadJson(STORAGE.captures,[]):[];
        const parts={};
        if(snapshot.changesSinceLastAudit)parts['changes-since-last-audit.json']=snapshot.changesSinceLastAudit;
        parts['summary.json']={...pickFields(v2,['profile','bars','cooldowns','travel','education','jobpoints','merits','refills','notifications','discord','display','icons','calendar','competition','faction','gym','honors','job','jobranks','medals','perks','virus','hof'],assigned),decoded:sp.decoded||null,reference:sp.reference||null};
        parts['finance.json']=pickFields(v2,['money','networth','stocks','properties','property','bazaar','itemmarket','trade','trades'],assigned);
        parts['combat.json']=pickFields(v2,['battlestats','attacksfull','ammo','bounties','equipment','itemmods','weaponexp','workstats','skills','revivesfull'],assigned);
        parts['crimes.json']={...pickFields(v2,['criminalrecord','crimes','missions','organizedcrime','organizedcrimes'],assigned),personalstats:sp.personalstats||null};
        parts['racing.json']=pickFields(v2,['enlistedcars','races','racingrecords'],assigned);
        parts['forum.json']=pickFields(v2,['forumfeed','forumfriends','forumposts','forumsubscribedthreads','forumthreads'],assigned);
        parts['activity.json']=pickFields(v2,['reports','snapshot'],assigned);
        parts['inventory.json']={inventory:sp.inventory||null};
        parts['contacts.json']={contacts:sp.contacts||null};
        parts['messages.json']={api:pv.messages||null,captured:captures};
        parts['events.json']={events:pv.events||null};
        parts['logs.json']={logs:pv.log||null};
        const other={};for(const[k,v]of Object.entries(v2))if(!assigned.has(k))other[k]=v;if(Object.keys(other).length)parts['other.json']=other;
        const manifest={schema:'sakalux-account-split-v3',generatedAt:snapshot.generatedAt,script:snapshot.script,account:snapshot.account,privacy:snapshot.privacy,capabilities:snapshot.capabilities,apiKeyInfo:snapshot.data?.keyInfo||null,decoded:snapshot.data?.special?.decoded||null,coverage:snapshot.coverage,errors:snapshot.errors,unavailable:snapshot.unavailable,files:Object.keys(parts)};
        return{'manifest.json':manifest,...parts};
    }
    function normalizeAuditFolder(){
        const raw=String(settings.auditFolder||'audit').trim().replace(/\\/g,'/').replace(/^\/+|\/+$/g,'');
        const clean=raw.split('/').filter(Boolean).filter(part=>part!=='.'&&part!=='..').join('/');
        return clean||'audit';
    }
    function auditPath(name){return normalizeAuditFolder()+'/'+String(name||'').replace(/^\/+/, '');}
    async function syncSnapshot(snapshot){
        if(!snapshot?.data?.keyInfo || Number(snapshot?.coverage?.successful||0)===0){
            throw new Error('Torn API key invalid or no account data was collected. Create/save a valid Auditor API key, then retry.');
        }
        const configured=String(settings.path||'SakaLuX-Account-Snapshot.json').replace(/^\/+/, '');
        const fileName=configured.split('/').filter(Boolean).pop()||'SakaLuX-Account-Snapshot.json';
        const folder=normalizeAuditFolder(),fullPath=auditPath(fileName),files=[];let primary=null;
        if(settings.splitSnapshots){
            const parts=buildSplitSnapshots(snapshot);
            for(const[path,value]of Object.entries(parts)){const remotePath=auditPath(path);setStatus('Uploading '+remotePath+'…');await syncJsonFile(remotePath,value,'Sync Torn split snapshot '+remotePath+' '+new Date().toISOString());files.push(remotePath);}
            const pointer={schema:'sakalux-account-split-pointer-v1',generatedAt:snapshot.generatedAt,manifest:auditPath('manifest.json'),folder,note:'All Account Auditor data is stored inside the dedicated audit folder.'};
            setStatus('Updating snapshot pointer…');primary=await syncJsonFile(fullPath,pointer,'Update Torn account snapshot pointer '+new Date().toISOString());
        }else{
            setStatus('Uploading full snapshot…');primary=await syncJsonFile(fullPath,snapshot,'Sync Torn account snapshot '+new Date().toISOString());
        }
        const meta={at:Date.now(),atIso:new Date().toISOString(),repo:settings.repo,branch:settings.branch,auditFolder:folder,path:fullPath,splitFiles:files,commitSha:primary?.commit?.sha||null};saveJson(STORAGE.lastSync,meta);return meta;
    }

    function isVisible(el){if(!el||el.closest('#sl-aa-overlay'))return false;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>20&&r.height>20&&s.display!=='none'&&s.visibility!=='hidden';}
    function cleanText(text){return String(text||'').replace(/\u00a0/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
    function simpleHash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
    function captureCurrentMessage(){
        if(!/message|mail/i.test(location.href)){setStatus('Open a Torn message/conversation first.');return false;}
        const selected=cleanText(window.getSelection?.().toString()||'');let text=selected;
        if(text.length<10){
            const selectors=['[class*="messageBody"]','[class*="message-body"]','[class*="messageContent"]','[class*="message-content"]','[class*="conversation"] [class*="message"]','[class*="mail"] [class*="message"]','[data-testid*="message"]'];
            const candidates=[];for(const sel of selectors){for(const el of document.querySelectorAll(sel)){if(!isVisible(el))continue;const t=cleanText(el.innerText||el.textContent||'');if(t.length>=10&&t.length<=50000)candidates.push({el,text:t,score:t.length});}}
            candidates.sort((a,b)=>b.score-a.score);if(candidates.length)text=candidates[0].text;
        }
        if(text.length<10){setStatus('Could not detect the visible message. Select its text and press CAPTURE again.');return false;}
        text=text.slice(0,50000);const topic=cleanText(document.querySelector('h1,h2,h3,[class*="subject"],[class*="topic"]')?.textContent||document.title||'').slice(0,500);
        const url=location.origin+location.pathname+location.search;const id=simpleHash(url+'\n'+text);const list=loadJson(STORAGE.captures,[]);if(list.some(x=>x.id===id)){setStatus('Message already captured.');return true;}
        list.unshift({id,capturedAt:new Date().toISOString(),url,topic,text});saveJson(STORAGE.captures,list.slice(0,200));setStatus('Captured current visible message · '+text.length+' chars');updatePanelStatus();return true;
    }
    function clearCapturedMessages(){saveJson(STORAGE.captures,[]);setStatus('Captured messages cleared.');updatePanelStatus();}

/* SakaLuX Auditor Changes Since Last Audit — BEGIN */
    const AUDIT_CHANGE_GROUPS=['money','networth','battlestats','workstats','skills','criminalrecord','racingrecords','personalstats','merits','education','jobpoints','stocks','bars'];
    const AUDIT_CHANGE_IGNORE=/(?:^|\.)(?:timestamp|time|date|last_action|lastAction|updated|cooldown|current|maximum|interval|until|expires|expiry)(?:$|\.)/i;
    function auditScalar(value){return value===null||['string','number','boolean'].includes(typeof value);}
    function flattenAuditValues(value,prefix,out,depth=0){
        if(depth>6||Object.keys(out).length>=600)return;
        if(auditScalar(value)){if(prefix&&!AUDIT_CHANGE_IGNORE.test(prefix))out[prefix]=value;return;}
        if(Array.isArray(value)){if(prefix)out[prefix+'.length']=value.length;return;}
        if(!value||typeof value!=='object')return;
        for(const key of Object.keys(value).sort()){
            if(Object.keys(out).length>=600)break;
            flattenAuditValues(value[key],prefix?prefix+'.'+key:key,out,depth+1);
        }
    }
    function buildAuditFingerprint(snapshot){
        const values={};
        flattenAuditValues(snapshot?.account||{},'account',values);
        flattenAuditValues(snapshot?.coverage||{},'coverage',values);
        const v2=snapshot?.data?.v2||{};
        const special=snapshot?.data?.special||{};
        for(const group of AUDIT_CHANGE_GROUPS){
            const value=group==='personalstats'?special.personalstats:v2[group];
            if(value!==undefined)flattenAuditValues(value,group,values);
        }
        return{schema:'sakalux-audit-fingerprint-v1',at:snapshot?.generatedAt||new Date().toISOString(),playerId:snapshot?.account?.playerId??null,values};
    }
    function auditChangePriority(path){
        if(/^account\.(?:level|rank|job|faction)/.test(path))return 0;
        if(/^(?:networth|money|battlestats|workstats|skills)\./.test(path))return 1;
        if(/^(?:criminalrecord|racingrecords|personalstats|stocks)\./.test(path))return 2;
        return 3;
    }
    function compareAuditFingerprints(previous,current){
        const previousValues=previous?.values||{},currentValues=current?.values||{};
        if(!previous||previous.schema!=='sakalux-audit-fingerprint-v1')return{schema:'sakalux-audit-changes-v1',baseline:true,previousAt:null,currentAt:current?.at||null,totalChanges:0,shownChanges:0,changes:[]};
        const changes=[];
        for(const path of [...new Set([...Object.keys(previousValues),...Object.keys(currentValues)])].sort()){
            const before=Object.prototype.hasOwnProperty.call(previousValues,path)?previousValues[path]:null;
            const after=Object.prototype.hasOwnProperty.call(currentValues,path)?currentValues[path]:null;
            if(Object.is(before,after))continue;
            const row={path,before,after};
            if(typeof before==='number'&&typeof after==='number'&&Number.isFinite(before)&&Number.isFinite(after))row.delta=after-before;
            changes.push(row);
        }
        changes.sort((a,b)=>auditChangePriority(a.path)-auditChangePriority(b.path)||a.path.localeCompare(b.path));
        return{schema:'sakalux-audit-changes-v1',baseline:false,previousAt:previous?.at||null,currentAt:current?.at||null,totalChanges:changes.length,shownChanges:Math.min(80,changes.length),changes:changes.slice(0,80)};
    }
    function prepareAuditChanges(snapshot){
        const current=buildAuditFingerprint(snapshot),previous=loadJson(STORAGE.auditBaseline,null),report=compareAuditFingerprints(previous,current);
        snapshot.changesSinceLastAudit=report;
        saveJson(STORAGE.lastChanges,report);
        return{current,report};
    }
    function commitAuditBaseline(fingerprint){if(fingerprint)saveJson(STORAGE.auditBaseline,fingerprint);}
    function getLastAuditChanges(){return loadJson(STORAGE.lastChanges,{schema:'sakalux-audit-changes-v1',baseline:true,totalChanges:0,shownChanges:0,changes:[]});}
/* SakaLuX Auditor Changes Since Last Audit — END */

    async function syncNow(){if(busy)return false;busy=true;try{setStatus('Collecting read-only account snapshot…');const snapshot=await collectSnapshot();const prepared=prepareAuditChanges(snapshot);const result=await syncSnapshot(snapshot);commitAuditBaseline(prepared.current);setStatus('SYNC OK · '+new Date(result.at).toLocaleTimeString()+' · '+(result.splitFiles?.length||0)+' split files · '+(prepared.report.totalChanges||0)+' changes');updatePanelStatus();return true;}catch(e){setStatus('ERROR · '+String(e?.message||e));updatePanelStatus();return false;}finally{busy=false;}}
    function setStatus(text){lastStatus=String(text||'');const el=document.getElementById('sl-aa-status');if(el)el.textContent=lastStatus;const b=document.getElementById('sl-aa-button');if(b)b.textContent=busy?'☠︎ SYNC…':'☠︎ AUDIT';}
    function lastSyncText(){const s=loadJson(STORAGE.lastSync,null);if(!s?.at)return'Never';try{return new Date(s.at).toLocaleString();}catch(_){return'Unknown';}}
    function updatePanelStatus(){const el=document.getElementById('sl-aa-last-sync');if(el)el.textContent=lastSyncText();const c=document.getElementById('sl-aa-captures');if(c)c.textContent=String(loadJson(STORAGE.captures,[]).length);const d=document.getElementById('sl-aa-changes');if(d)d.textContent=String(getLastAuditChanges().totalChanges||0);setStatus(lastStatus);}

    function isHubInstalled(){return Boolean(window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button'));}
    function rememberHubPrompt(){try{localStorage.setItem(HUB_PROMPT_STORAGE,String(Date.now()));}catch(_){}}
    function shouldOfferHub(){
        if(isHubInstalled())return false;
        try{const last=Number(localStorage.getItem(HUB_PROMPT_STORAGE)||0);return !last||Date.now()-last>=HUB_PROMPT_INTERVAL;}catch(_){return true;}
    }
    function closeHubPrompt(remember=true){if(remember)rememberHubPrompt();document.getElementById(HUB_PROMPT_ID)?.remove();}
    function showHubInstallPrompt(){
        if(!shouldOfferHub()||document.getElementById(HUB_PROMPT_ID))return;
        const overlay=document.createElement('div');overlay.id=HUB_PROMPT_ID;overlay.style.cssText='position:fixed;z-index:2147483647;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;font-family:Arial,sans-serif;';
        overlay.innerHTML='<div style="width:min(420px,94vw);background:#101318;color:#fff;border:1px solid #303640;border-radius:16px;padding:18px;box-sizing:border-box;box-shadow:0 15px 50px rgba(0,0,0,.65);"><div style="font-size:19px;font-weight:900;margin-bottom:8px;">☠️ SakaLuX Script Hub</div><div style="font-size:12px;line-height:1.5;color:#c9d1d9;margin-bottom:14px;">This script is part of the SakaLuX suite. Install the main Script Hub for add-on management, quick access and update checking?</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><button id="sl-aa-hub-later" style="border:0;border-radius:9px;padding:10px;font-weight:900;color:#fff;background:#374151;">LATER</button><button id="sl-aa-hub-install" style="border:0;border-radius:9px;padding:10px;font-weight:900;color:#fff;background:#16a34a;">INSTALL HUB</button></div></div>';
        document.body.appendChild(overlay);
        overlay.querySelector('#sl-aa-hub-later').onclick=()=>closeHubPrompt(true);
        overlay.querySelector('#sl-aa-hub-install').onclick=()=>{rememberHubPrompt();location.href=HUB_INSTALL_URL;};
    }

    function openSettings(){
        document.getElementById('sl-aa-overlay')?.remove();const overlay=document.createElement('div');overlay.id='sl-aa-overlay';overlay.innerHTML='<div id="sl-aa-panel">'+
        '<div class="sl-aa-head"><div><b>☠︎ SakaLuX Account Auditor</b><small>v'+VERSION+' · PRIVATE / READ-ONLY</small></div><button id="sl-aa-close">×</button></div>'+
        '<div class="sl-aa-warning"><b>Use a PRIVATE GitHub repository.</b> Split files can contain private Torn data. Passwords, cookies, session data and API/GitHub keys are never synced.</div>'+
        '<div class="sl-aa-note"><b>Messages:</b> Torn API supplies metadata only. To save body text, open a message yourself and press <b>CAPTURE CURRENT MESSAGE</b>. The script never opens private conversations automatically.</div>'+
        '<label>GitHub repository <input id="sl-aa-repo" value="'+esc(settings.repo)+'"></label><label>Branch <input id="sl-aa-branch" value="'+esc(settings.branch)+'"></label><label>Audit folder <input id="sl-aa-folder" value="'+esc(settings.auditFolder||'audit')+'" placeholder="audit"></label><label>Snapshot filename <input id="sl-aa-path" value="'+esc(String(settings.path||'SakaLuX-Account-Snapshot.json').split('/').pop())+'"></label>'+
        '<label>GitHub fine-grained token <input id="sl-aa-gh" type="password" placeholder="Stored in userscript storage"></label>'+
        '<div class="sl-aa-api-box"><div class="sl-aa-api-title">🔑 AUDITOR API ACCESS</div>'+
        '<div class="sl-aa-note"><b>Required access:</b> read-only account data for profile, money/stocks/properties, battle/work stats, inventory/equipment, crimes/missions, racing, forum, contacts, messages/events and Torn merit/education catalogues. <b>Full access is required only if you also want user logs.</b> The Auditor key is isolated from the Script Hub shared key.</div>'+
        '<label>Auditor Torn API key <input id="sl-aa-torn" type="password" value="" placeholder="'+(getTornApiKey()?'Saved key present — paste a replacement to change it':'Paste the newly created key here')+'"></label>'+
        '<div class="sl-aa-api-actions"><button id="sl-aa-create-api" type="button">🔑 CREATE KEY</button><button id="sl-aa-test-api" type="button">🧪 TEST & SAVE</button><button id="sl-aa-clear-api" type="button">🗑 CLEAR</button></div>'+
        '<div class="sl-aa-api-state">Current key: <b>'+(getTornApiKey()?'SAVED':'MISSING')+'</b></div></div>'+
        '<label class="sl-aa-check"><input id="sl-aa-private" type="checkbox" '+(settings.includePrivateData?'checked':'')+'> Include messages/events/logs API data</label><label class="sl-aa-check"><input id="sl-aa-split" type="checkbox" '+(settings.splitSnapshots?'checked':'')+'> Sync deduplicated split JSON files (recommended)</label><label class="sl-aa-check"><input id="sl-aa-captured" type="checkbox" '+(settings.includeCapturedMessages?'checked':'')+'> Include explicitly captured message bodies in messages.json</label><label class="sl-aa-check"><input id="sl-aa-auto" type="checkbox" '+(settings.autoSync?'checked':'')+'> Auto-sync while Torn is open</label>'+
        '<label>Auto-sync interval (minutes) <input id="sl-aa-minutes" type="number" min="15" max="1440" value="'+esc(settings.autoSyncMinutes)+'"></label><label>Max paged history pages <input id="sl-aa-pages" type="number" min="1" max="500" value="'+esc(settings.maxPrivatePages)+'"></label>'+
        '<div class="sl-aa-info">Captured messages: <strong id="sl-aa-captures">'+loadJson(STORAGE.captures,[]).length+'</strong> · Last sync: <strong id="sl-aa-last-sync">'+esc(lastSyncText())+'</strong> · Changes: <strong id="sl-aa-changes">'+esc(getLastAuditChanges().totalChanges||0)+'</strong></div><div id="sl-aa-status">'+esc(lastStatus||'Ready')+'</div>'+
        '<button id="sl-aa-capture">CAPTURE CURRENT MESSAGE</button><button id="sl-aa-clear">CLEAR CAPTURED MESSAGES</button><button id="sl-aa-save">SAVE SETTINGS</button><button id="sl-aa-sync">SYNC NOW</button></div>';
        document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};overlay.querySelector('#sl-aa-close').onclick=()=>overlay.remove();overlay.querySelector('#sl-aa-create-api').onclick=()=>{location.href=AUDITOR_API_CREATE_URL;};overlay.querySelector('#sl-aa-test-api').onclick=async()=>{const input=overlay.querySelector('#sl-aa-torn');await testAuditorApiKey(input?.value.trim()||'');updatePanelStatus();};overlay.querySelector('#sl-aa-clear-api').onclick=()=>{clearAuditorApiKey();const input=overlay.querySelector('#sl-aa-torn');if(input)input.value='';updatePanelStatus();};overlay.querySelector('#sl-aa-capture').onclick=()=>captureCurrentMessage();overlay.querySelector('#sl-aa-clear').onclick=()=>clearCapturedMessages();
        overlay.querySelector('#sl-aa-save').onclick=()=>{settings.repo=overlay.querySelector('#sl-aa-repo').value.trim();settings.branch=overlay.querySelector('#sl-aa-branch').value.trim()||'main';settings.auditFolder=overlay.querySelector('#sl-aa-folder').value.trim()||'audit';settings.path=(overlay.querySelector('#sl-aa-path').value.trim().split('/').pop()||'SakaLuX-Account-Snapshot.json');settings.includePrivateData=!!overlay.querySelector('#sl-aa-private').checked;settings.splitSnapshots=!!overlay.querySelector('#sl-aa-split').checked;settings.includeCapturedMessages=!!overlay.querySelector('#sl-aa-captured').checked;settings.autoSync=!!overlay.querySelector('#sl-aa-auto').checked;settings.autoSyncMinutes=Math.max(15,Math.min(1440,Number(overlay.querySelector('#sl-aa-minutes').value)||30));settings.maxPrivatePages=Math.max(1,Math.min(500,Number(overlay.querySelector('#sl-aa-pages').value)||200));const gh=overlay.querySelector('#sl-aa-gh').value.trim();if(gh)rawSet(STORAGE.githubToken,gh);saveJson(STORAGE.settings,settings);scheduleAutoSync();setStatus('Settings saved');updatePanelStatus();};overlay.querySelector('#sl-aa-sync').onclick=async()=>{await syncNow();};
    }
    function injectCss(){if(document.getElementById('sl-aa-style'))return;const s=document.createElement('style');s.id='sl-aa-style';s.textContent=`#sl-aa-button{position:fixed;right:10px;bottom:150px;z-index:2147483643;border:1px solid #53657a;border-radius:999px;padding:9px 12px;background:linear-gradient(180deg,#202b38,#151d27);color:#fff;box-shadow:0 5px 18px rgba(0,0,0,.42);font:900 12px Arial;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}#sl-aa-button.sl-aa-dragging{cursor:grabbing;opacity:.94;box-shadow:0 8px 24px rgba(0,0,0,.55)}#sl-aa-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.78);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}#sl-aa-panel{width:min(640px,100%);max-height:92vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0}.sl-aa-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.sl-aa-head>div{display:flex;flex-direction:column;gap:3px}.sl-aa-head small{color:#8e96a3}#sl-aa-close{width:36px;height:36px;border:0;border-radius:9px;background:#272d35;color:#fff;font-size:20px}#sl-aa-panel label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}#sl-aa-panel label input{width:54%;box-sizing:border-box;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:7px;padding:8px}.sl-aa-check input{width:auto!important}.sl-aa-warning,.sl-aa-note{margin:8px 0;padding:10px;border-radius:9px;font-size:10px;line-height:1.45}.sl-aa-warning{background:#2a2010;border:1px solid #6a5420;color:#f2dc8c}.sl-aa-note{background:#122033;border:1px solid #29456b;color:#cfe3ff}.sl-aa-info,#sl-aa-status{margin:9px 0;padding:9px;background:#12171e;border:1px solid #29313a;border-radius:8px;font-size:10px}#sl-aa-panel>button{width:100%;min-height:42px;margin-top:7px;border:0;border-radius:9px;color:#fff;font-weight:900;background:#374151}#sl-aa-sync{background:#2563eb!important}#sl-aa-capture{background:#166534!important}#sl-aa-clear{background:#7f1d1d!important}.sl-aa-api-box{margin:10px 0;padding:10px;border:1px solid #355173;border-radius:12px;background:#0f1824}.sl-aa-api-title{font-size:12px;font-weight:900;color:#8fc2ff;margin-bottom:6px}.sl-aa-api-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.sl-aa-api-actions button{min-height:38px;border:0;border-radius:8px;color:#fff;font-weight:900;background:#334155}.sl-aa-api-actions #sl-aa-test-api{background:#166534}.sl-aa-api-actions #sl-aa-clear-api{background:#7f1d1d}.sl-aa-api-state{margin-top:7px;font-size:10px;color:#cbd5e1}@media(min-width:700px){#sl-aa-overlay{align-items:center}#sl-aa-panel{border-radius:18px}}`;document.head.appendChild(s);}
    /* SakaLuX Auditor Draggable Launcher v1 */
    const AUDIT_BUTTON_POS_KEY='SakaLuX_AUDITOR_BUTTON_POSITION_V1';
    function loadAuditButtonPosition(){
        try{const p=JSON.parse(localStorage.getItem(AUDIT_BUTTON_POS_KEY)||'null');return p&&Number.isFinite(Number(p.left))&&Number.isFinite(Number(p.top))?{left:Number(p.left),top:Number(p.top)}:null;}catch(_){return null;}
    }
    function saveAuditButtonPosition(left,top){try{localStorage.setItem(AUDIT_BUTTON_POS_KEY,JSON.stringify({left:Math.round(left),top:Math.round(top)}));}catch(_){}}
    function clampAuditButtonPosition(b,left,top){const r=b.getBoundingClientRect(),w=r.width||84,h=r.height||36,pad=4;return{left:Math.max(pad,Math.min(window.innerWidth-w-pad,left)),top:Math.max(pad,Math.min(window.innerHeight-h-pad,top))};}
    function applyAuditButtonPosition(b,pos){if(!pos)return;const p=clampAuditButtonPosition(b,pos.left,pos.top);b.style.left=p.left+'px';b.style.top=p.top+'px';b.style.right='auto';b.style.bottom='auto';}
    function makeAuditButtonDraggable(b){
        const saved=loadAuditButtonPosition();if(saved)requestAnimationFrame(()=>applyAuditButtonPosition(b,saved));
        let drag=null,moved=false,suppressClick=false;
        b.addEventListener('pointerdown',e=>{
            if(e.button!=null&&e.button!==0)return;
            const r=b.getBoundingClientRect();
            drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};moved=false;
            try{b.setPointerCapture(e.pointerId);}catch(_){}
            b.classList.add('sl-aa-dragging');
            e.preventDefault();
        });
        b.addEventListener('pointermove',e=>{
            if(!drag||e.pointerId!==drag.id)return;
            const before=b.getBoundingClientRect();
            const p=clampAuditButtonPosition(b,e.clientX-drag.dx,e.clientY-drag.dy);
            if(Math.abs(p.left-before.left)>2||Math.abs(p.top-before.top)>2)moved=true;
            b.style.left=p.left+'px';b.style.top=p.top+'px';b.style.right='auto';b.style.bottom='auto';
            e.preventDefault();
        });
        const end=e=>{
            if(!drag||e.pointerId!==drag.id)return;
            const r=b.getBoundingClientRect();saveAuditButtonPosition(r.left,r.top);
            suppressClick=moved;drag=null;b.classList.remove('sl-aa-dragging');
            try{b.releasePointerCapture(e.pointerId);}catch(_){}
            if(suppressClick)setTimeout(()=>{suppressClick=false;},180);
            e.preventDefault();
        };
        b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
        b.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();return;}openSettings();});
        window.addEventListener('resize',()=>{const r=b.getBoundingClientRect();applyAuditButtonPosition(b,{left:r.left,top:r.top});const n=b.getBoundingClientRect();saveAuditButtonPosition(n.left,n.top);},{passive:true});
    }
    function createButton(){if(!settings.showButton||document.getElementById('sl-aa-button'))return;const b=document.createElement('button');b.id='sl-aa-button';b.type='button';b.textContent='☠︎ AUDIT';b.title='Tap to open · drag to move';document.body.appendChild(b);makeAuditButtonDraggable(b);}
    function scheduleAutoSync(){if(autoTimer){clearInterval(autoTimer);autoTimer=null;}if(!settings.autoSync)return;const mins=Math.max(15,Number(settings.autoSyncMinutes)||30);autoTimer=setInterval(()=>syncNow(),mins*60*1000);const last=loadJson(STORAGE.lastSync,null);if(!last?.at||Date.now()-Number(last.at)>=mins*60*1000)setTimeout(()=>syncNow(),5000);}

    window.SakaLuXAccountAuditor={id:'account-auditor',name:'Account Auditor',version:VERSION,open(){openSettings();return true;},async sync(){return syncNow();},async snapshot(){return collectSnapshot();},captureCurrentMessage(){return captureCurrentMessage();},capturedMessages(){return loadJson(STORAGE.captures,[]);},changesSinceLastAudit(){return getLastAuditChanges();},status(){return{version:VERSION,busy,lastStatus,lastSync:loadJson(STORAGE.lastSync,null),changesSinceLastAudit:getLastAuditChanges(),capturedMessages:loadJson(STORAGE.captures,[]).length,settings:{repo:settings.repo,branch:settings.branch,path:settings.path,autoSync:settings.autoSync,autoSyncMinutes:settings.autoSyncMinutes,includePrivateData:settings.includePrivateData,maxPrivatePages:settings.maxPrivatePages,splitSnapshots:settings.splitSnapshots,includeCapturedMessages:settings.includeCapturedMessages},hasTornKey:Boolean(getTornApiKey()),hasGitHubToken:Boolean(rawGet(STORAGE.githubToken))};}};
    window.dispatchEvent(new CustomEvent('SakaLuX:AccountAuditorReady',{detail:{version:VERSION}}));
    function init(){injectCss();createButton();scheduleAutoSync();setTimeout(showHubInstallPrompt,3500);console.log('['+NAME+' v'+VERSION+'] Loaded.');}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();


    /* SakaLuX Unified Control Center UI — visual layer only. */
    function installSakaLuXUnifiedTheme_account_auditor() {
        if (document.getElementById('sakalux-unified-theme-account-auditor')) return;
        const style = document.createElement('style');
        style.id = 'sakalux-unified-theme-account-auditor';
        style.textContent = `
:where([id^="sl-aa-"],[class*="sl-aa-"]){font-family:Inter,Arial,sans-serif!important;box-sizing:border-box}
:where([id^="sl-aa-"][id*="panel" i],[id^="sl-aa-"][id*="settings" i],[id^="sl-aa-"][id*="modal" i],[id^="sl-aa-"][id*="details" i]){background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%)!important;color:#e7edf5!important;border:1px solid #314154!important;border-radius:16px!important;box-shadow:0 18px 52px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.025)!important}
:where([class*="sl-aa-"][class*="header" i],[id^="sl-aa-"][id*="header" i]){background:linear-gradient(155deg,#1b2634,#111923)!important;border-color:#314154!important;color:#f8fafc!important}
:where([class*="sl-aa-"][class*="card" i],[class*="sl-aa-"][class*="row" i],[class*="sl-aa-"][class*="section" i],[class*="sl-aa-"][class*="note" i]){background:linear-gradient(145deg,#18212d,#131b25)!important;border-color:#2d3c4e!important;border-radius:12px!important;color:#dce6f0!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}
:where(button[id^="sl-aa-"],button[class*="sl-aa-"]){border:1px solid #3d78bf!important;border-radius:10px!important;background:linear-gradient(180deg,#377fcf,#275f9f)!important;color:#fff!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,filter .12s ease!important}
:where(button[id^="sl-aa-"],button[class*="sl-aa-"]):active{transform:translateY(1px)!important}
:where(input[id^="sl-aa-"],select[id^="sl-aa-"],textarea[id^="sl-aa-"],[id^="sl-aa-"] input,[id^="sl-aa-"] select,[id^="sl-aa-"] textarea){background:#0d141d!important;border:1px solid #3a4b61!important;border-radius:9px!important;color:#f4f7fb!important;outline:none!important}
:where(input[type="checkbox"][id^="sl-aa-"]){appearance:none!important;-webkit-appearance:none!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0 8px 0 0!important;vertical-align:middle!important;border:1px solid #546276!important;border-radius:999px!important;background:radial-gradient(circle at 10px 50%,#e7edf5 0 6px,transparent 6.5px),#465365!important;cursor:pointer!important;transition:.18s ease!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)!important}
:where(input[type="checkbox"][id^="sl-aa-"]):checked{border-color:#24754f!important;background:radial-gradient(circle at 27px 50%,#fff 0 6px,transparent 6.5px),#1eb36a!important}
:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="close" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="close" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="back" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="gray" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="secondary" i]{background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}
:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="clear" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="reset" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="delete" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="danger" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="red" i]{background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
@media(max-width:520px){:where([id^="sl-aa-"][id*="panel" i],[id^="sl-aa-"][id*="settings" i],[id^="sl-aa-"][id*="modal" i],[id^="sl-aa-"][id*="details" i]){border-radius:15px!important}:where(button[id^="sl-aa-"],button[class*="sl-aa-"]){min-height:34px!important}}
`;
        (document.head || document.documentElement).appendChild(style);
    }
    installSakaLuXUnifiedTheme_account_auditor();

})();






/* slx-host-scroll-contract-v3 */
(()=>{if(document.getElementById('slx-host-scroll-contract-v3'))return;const s=document.createElement('style');s.id='slx-host-scroll-contract-v3';s.textContent=`@media(max-width:820px){
[data-slx-fullsheet-v2="1"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)){position:relative!important;inset:auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;}
}`;(document.head||document.documentElement).appendChild(s)})();


/* SakaLuX Mobile Full-Screen Performance Contract */
(()=>{
  if(document.getElementById('sakalux-fullscreen-performance-contract')) return;
  const s=document.createElement('style');
  s.id='sakalux-fullscreen-performance-contract';
  s.textContent=`@media(max-width:820px){
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="overlay"],
    [id^="slx-"][id*="overlay"],
    [id^="sl-"][id*="overlay"]{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;padding:0!important;border-radius:0!important;overflow:hidden!important;
      -webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:#0b1118!important;box-shadow:none!important
    }
    [data-slx-fullsheet-v2="1"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)),
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="panel"],[id^="slx-"][id*="panel"],[id^="sl-"][id*="panel"],
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="modal"],[id^="slx-"][id*="modal"],[id^="sl-"][id*="modal"]{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;border-radius:0!important;box-sizing:border-box!important;overflow:auto!important;
      touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;
      -webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:none!important
    }
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) *,[id^="slx-"] *,[id^="sl-"] *{ -webkit-backdrop-filter:none!important;backdrop-filter:none!important }
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="panel"] *,[id^="slx-"][id*="panel"] *,[id^="sl-"][id*="panel"] *,
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="modal"] *,[id^="slx-"][id*="modal"] *,[id^="sl-"][id*="modal"] *{
      animation:none!important;transition:none!important
    }
  }`;
  (document.head||document.documentElement).appendChild(s);
})();


/* SakaLuX Hub footer v3: native module root only; compact donation controls. */
(()=>{
 const selector="#sl-aa-panel",id="sakalux-inline-footer-account-auditor",profile='https://www.torn.com/profiles.php?XID=2380374';
 const st=document.createElement('style');st.textContent=`
 #${id}#${id}{position:sticky!important;bottom:0!important;inset-inline:auto!important;display:block!important;flex:0 0 50px!important;width:100%!important;height:50px!important;min-height:50px!important;max-height:50px!important;margin:0!important;padding:0!important;box-sizing:border-box!important;z-index:5!important;font-family:Arial,sans-serif!important;overflow:hidden!important;border-radius:10px!important}
 #${id}#${id} *{box-sizing:border-box!important}
 #${id}#${id} .slh-bottom{height:28px!important;margin:0!important;padding:4px 14px!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important;border-radius:10px 10px 0 0!important;overflow:hidden!important}
 #${id}#${id} .slh-bottom-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;height:20px!important}
 #${id}#${id} .slh-bottom-btn{display:block!important;width:100%!important;min-width:0!important;height:20px!important;min-height:20px!important;max-height:20px!important;margin:0!important;padding:0 4px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#151f2a!important;color:#b9c7d6!important;font:900 8px/1.2 Arial,sans-serif!important;letter-spacing:.04em!important;white-space:nowrap!important;box-shadow:none!important;cursor:pointer!important}
 #${id}#${id} .slh-footer{height:22px!important;min-height:22px!important;max-height:22px!important;margin:0!important;padding:0 6px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;border-top:1px solid rgba(223,154,55,.52)!important;border-radius:0 0 10px 10px!important;background:#080d13!important;color:#df9a37!important;font:400 9px/20px Arial,sans-serif!important;white-space:nowrap!important;overflow:hidden!important}
 #${id}#${id} .slh-author{color:#78aef2!important;font-weight:900!important;text-decoration:none!important}
 `;(document.head||document.documentElement).appendChild(st);
 function ensure(){
  const panel=document.querySelector(selector);if(!panel||panel.closest('#sakalux-hub-overlay, #sakalux-hub-panel'))return;
  if(panel.querySelector('#'+id))return;
  const f=document.createElement('div');f.id=id;
  f.innerHTML='<div class="slh-bottom"><div class="slh-bottom-grid"><button type="button" class="slh-bottom-btn" data-slx-donate>💸 SEND MONEY</button><button type="button" class="slh-bottom-btn" data-slx-donate>🎁 SEND ITEMS</button></div></div><div class="slh-footer">Made with ❤️ by <a class="slh-author" href="'+profile+'">SakaLuX [2380374]</a></div>';
  f.querySelectorAll('[data-slx-donate]').forEach(b=>b.onclick=()=>{location.href=profile});panel.appendChild(f);
 }
 function start(){ensure();let scheduled=false;new MutationObserver(records=>{
  const nativeRoot=selector.split(/[ >]/)[0];
  const relevant=records.some(r=>{
   if(r.target?.closest?.('[id^="sakalux-inline-footer-"]'))return false;
   return r.target?.closest?.(nativeRoot)||[...r.addedNodes].some(n=>n.nodeType===1&&n.matches?.(nativeRoot));
  });
  if(scheduled||!relevant)return;
  scheduled=true;requestAnimationFrame(()=>{scheduled=false;ensure()});
 }).observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* Compact donation controls and Elimination mobile panel geometry 1.3.12 */
(()=>{const s=document.createElement('style');s.textContent="@media(max-width:820px){\n#sl-aa-overlay#sl-aa-overlay#sl-aa-overlay{position:fixed!important;inset:0 4px 36px!important;top:0!important;bottom:36px!important;left:4px!important;right:4px!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;transform:none!important;box-sizing:border-box!important;padding:0!important;background:transparent!important;overflow:hidden!important;border-radius:14px!important;align-items:stretch!important;justify-content:stretch!important;}\n#sl-aa-overlay#sl-aa-overlay#sl-aa-overlay #sl-aa-panel#sl-aa-panel{position:relative!important;inset:auto!important;top:auto!important;bottom:auto!important;left:auto!important;right:auto!important;align-self:stretch!important;flex:1 1 auto!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;max-width:100%!important;margin:0!important;transform:none!important;box-sizing:border-box!important;border:1px solid #3c4652!important;border-radius:14px!important;}\n#sl-aa-overlay#sl-aa-overlay#sl-aa-overlay #sl-aa-panel#sl-aa-panel{overflow-y:auto!important;overscroll-behavior:contain!important;}\n\n}";(document.head||document.documentElement).appendChild(s)})();

