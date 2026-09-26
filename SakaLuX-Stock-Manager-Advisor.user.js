// ==UserScript==
// @name         SakaLuX Stock Manager & Advisor
// @namespace    sakalux.stock.manager.advisor
// @version      0.8.16
// @description  Torn stock workspace with Hub-style premium UI, throttled SPA rendering, compact controls and guided rebalance execution.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @run-at       document-end
// @downloadURL  https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.user.js
// @updateURL    https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.meta.js
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

/* SakaLuX Canonical Installed Version — BEGIN */
(() => {
  'use strict';
  let v = '0.8.16';
  try {
    const meta = globalThis.GM_info && globalThis.GM_info.script && globalThis.GM_info.script.version;
    if (meta) v = String(meta);
  } catch {}
  const g = globalThis;
  g.__SakaLuXInstalledVersions = g.__SakaLuXInstalledVersions || Object.create(null);
  g.__SakaLuXInstalledVersions['stock-manager-advisor'] = v;
  try {
    document.documentElement?.setAttribute('data-sakalux-installed-stock-manager-advisor', v);
  } catch {}
})();
/* SakaLuX Canonical Installed Version — END */

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
  const SELF = Object.freeze(Object.assign({"id":"stock-manager-advisor","name":"Stocks","icon":"📊","selector":"#sakalux-module-bridge-stock-manager-advisor","fallback":"https://www.torn.com/page.php?sid=stocks"}, { version: "0.8.16" }));
  const API_GLOBAL = "SakaLuXStockManagerAdvisor";
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
  [id^="slx-elim-"][id*="panel" i]
){z-index:2147483646!important;}
#sakalux-standalone-dock{z-index:2147483500!important;}`;
    (document.head||document.documentElement).appendChild(style);
  }
})();

(() => {
  'use strict';

  const APP = {
    name: 'SakaLuX Stock Manager & Advisor',
    version: '0.8.16',
    experimental: false,
    profile: 'https://www.torn.com/profiles.php?XID=2380374',
    stocksUrl: 'https://www.torn.com/page.php?sid=stocks'
  };

  const REQUIRED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Stock%20Manager%20Advisor&user=money,stocks&torn=stocks';

  const K = {
    api: 'SLX_STOCK_API_KEY',
    enabled: 'SLX_STOCK_ENABLED',
    target: 'SLX_STOCK_TARGET',
    keep: 'SLX_STOCK_KEEP_CASH',
    withdraw: 'SLX_STOCK_WITHDRAW',
    benefitLock: 'SLX_STOCK_BENEFIT_LOCK',
    panicPending: 'SLX_STOCK_PANIC_PENDING',
    panicConfirm: 'SLX_STOCK_PANIC_CONFIRM',
    panicDirect: 'SLX_STOCK_PANIC_DIRECT',
    presets: 'SLX_STOCK_PRESETS',
    tx: 'SLX_STOCK_TX_CACHE',
    benefitValues: 'SLX_STOCK_BENEFIT_VALUES',
    dryRun: 'SLX_STOCK_DRY_RUN',
    actionLog: 'SLX_STOCK_ACTION_LOG',
    panicFallback: 'SLX_STOCK_PANIC_FALLBACK',
    panicKeep: 'SLX_STOCK_PANIC_KEEP_CASH',
    panicMax: 'SLX_STOCK_PANIC_MAX_SPEND',
    panicUseAll: 'SLX_STOCK_PANIC_USE_ALL',
    bankApr: 'SLX_STOCK_BANK_APR',
    optimizerMinApr: 'SLX_STOCK_OPTIMIZER_MIN_APR',
    rebalanceReserve: 'SLX_STOCK_REBALANCE_RESERVE',
    inlineCollapsed: 'SLX_STOCK_INLINE_COLLAPSED',
    inlineTab: 'SLX_STOCK_INLINE_TAB',
    inlineApiMode: 'SLX_STOCK_INLINE_API_MODE',
    inlinePresets: 'SLX_STOCK_INLINE_PRESETS',
    inlineButtons: 'SLX_STOCK_INLINE_BUTTONS',
    stockSort: 'SLX_STOCK_SORT',
    stockFilter: 'SLX_STOCK_FILTER',
    favorites: 'SLX_STOCK_FAVORITES',
    nearBenefitPct: 'SLX_STOCK_NEAR_BENEFIT_PCT',
    targetLock: 'SLX_STOCK_TARGET_LOCK',
    compactMode: 'SLX_STOCK_COMPACT_MODE',
    rowSearch: 'SLX_STOCK_ROW_SEARCH',
    targetFavorites: 'SLX_STOCK_TARGET_FAVORITES',
    cashTarget: 'SLX_STOCK_CASH_TARGET',
    txHistory: 'SLX_STOCK_TRANSACTION_HISTORY',
    dailyCosts: 'SLX_STOCK_DAILY_COSTS',
    excludedStocks: 'SLX_STOCK_EXCLUDED_STOCKS',
    bankPeriod: 'SLX_STOCK_BANK_PERIOD',
    bankRates: 'SLX_STOCK_BANK_RATES',
    techHistory: 'SLX_STOCK_TECH_HISTORY',
    techSymbol: 'SLX_STOCK_TECH_SYMBOL',
    techWindow: 'SLX_STOCK_TECH_WINDOW',
    simFrom: 'SLX_STOCK_SIM_FROM',
    simTo: 'SLX_STOCK_SIM_TO',
    simAmount: 'SLX_STOCK_SIM_AMOUNT'
  };

  const BENEFITS = {
    ASS:{base:1000000,type:'A'}, BAG:{base:3000000,type:'A'}, CNC:{base:7500000,type:'A'}, EWM:{base:1000000,type:'A'},
    ELT:{base:5000000,type:'P'}, EVL:{base:100000,type:'A'}, FHG:{base:2000000,type:'A'}, GRN:{base:500000,type:'A'},
    CBD:{base:350000,type:'A'}, HRG:{base:10000000,type:'A'}, IIL:{base:1000000,type:'P'}, IOU:{base:3000000,type:'A'},
    IST:{base:100000,type:'P'}, LAG:{base:750000,type:'A'}, LOS:{base:7500000,type:'P'}, LSC:{base:500000,type:'A'},
    MCS:{base:350000,type:'A'}, MSG:{base:300000,type:'P'}, MUN:{base:5000000,type:'A'}, PRN:{base:1000000,type:'A'},
    PTS:{base:10000000,type:'A'}, SYM:{base:500000,type:'A'}, SYS:{base:3000000,type:'P'}, TCP:{base:1000000,type:'P'},
    TMI:{base:6000000,type:'A'}, TGP:{base:2500000,type:'P'}, TCT:{base:100000,type:'A'}, TSB:{base:3000000,type:'A'},
    TCC:{base:7500000,type:'A'}, THS:{base:150000,type:'A'}, TCI:{base:1500000,type:'P'}, TCM:{base:1000000,type:'P'},
    WSU:{base:1000000,type:'P'}, WLT:{base:9000000,type:'P'}, YAZ:{base:1000000,type:'P'}
  };

  const BENEFIT_MODELS = {
    MUN:{type:'item',id:818,freq:7,label:'Six-Pack of Energy Drink'},
    ASS:{type:'item',id:817,freq:7,label:'Six-Pack of Alcohol'},
    HRG:{type:'manual',freq:31,label:'Average property value'},
    LSC:{type:'item',id:369,freq:7,label:'Lottery Voucher'},
    LAG:{type:'item',id:368,freq:14,label:'Lawyer Business Card'},
    FHG:{type:'item',id:367,freq:7.75,label:'Feathery Hotel Coupon'},
    PRN:{type:'item',id:366,freq:7,label:'Erotic DVD'},
    SYM:{type:'item',id:370,freq:7,label:'Drug Pack'},
    TCC:{type:'average',ids:[1057,1112,1113,1114,1115,1116,1117],freq:31,label:'Average clothing cache'},
    THS:{type:'item',id:365,freq:7,label:'Box of Medical Supplies'},
    EWM:{type:'item',id:364,freq:7,label:'Box of Grenades'},
    CNC:{type:'cash',value:80000000,freq:31,label:'Cash-equivalent benefit'},
    TSB:{type:'cash',value:50000000,freq:31,label:'Cash dividend'},
    TMI:{type:'cash',value:25000000,freq:31,label:'Cash dividend'},
    IOU:{type:'cash',value:12000000,freq:31,label:'Cash dividend'},
    GRN:{type:'cash',value:4000000,freq:31,label:'Cash dividend'},
    TCT:{type:'cash',value:1000000,freq:31,label:'Cash-equivalent benefit'}
  };

  const S = { stocks:new Map(), portfolio:{}, money:null, panel:null, status:null, benefitPrices:{}, tradeBusy:false, lastTradeAt:0 };

  const $ = (q, r=document) => r.querySelector(q);
  const $$ = (q, r=document) => [...r.querySelectorAll(q)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => Number(String(v ?? '').replace(/[$,\s]/g,'')) || 0;
  const money = v => '$' + Math.max(0, Number(v)||0).toLocaleString('en-US', {maximumFractionDigits:0});
  const get = (k, d='') => { try { const v=localStorage.getItem(k); return v===null?d:v; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
  const del = k => { try { localStorage.removeItem(k); } catch {} };
  const bool = (k, d=false) => get(k, d?'1':'0') === '1';
  const isDryRun = () => bool(K.dryRun,true);
  const isStocks = () => /(?:page\.php\?sid=stocks|sid=StockMarket|sid=stocks)/i.test(location.href);
  const rfc = () => (document.cookie.match(/(?:^|;\s*)rfc_v=([^;]+)/)||[])[1] || '';


  function stockHubActive() {
    try {
      const installed=Boolean(window.SakaLuXScriptHub || document.documentElement?.getAttribute('data-sakalux-hub-installed')==='1' || document.body?.getAttribute('data-sakalux-hub-installed')==='1');
      const activeAttr=document.documentElement?.getAttribute('data-sakalux-hub-active') ?? document.body?.getAttribute('data-sakalux-hub-active');
      return installed && activeAttr!=='0';
    } catch { return false; }
  }

  function stockApiAccess() {
    try {
      if(stockHubActive()) {
        const api=window.SakaLuXScriptHub;
        const direct=String(api?.getApiKey?.()||'').trim();
        if(direct) return {key:direct,source:'SakaLuX Hub',shared:true};
        const stored=String(localStorage.getItem('SakaLuX_HUB_TORN_API_KEY')||'').trim();
        if(stored) return {key:stored,source:'SakaLuX Hub',shared:true};
      }
    } catch {}
    const local=String(get(K.api,'')||'').trim();
    if(local) return {key:local,source:'Local standalone',shared:false};
    return {key:'',source:'None',shared:false};
  }

  const getStockApiKey = () => stockApiAccess().key;

  function parseAmount(v) {
    const s=String(v||'').trim().toLowerCase().replace(/,/g,'');
    if(!s) return 0;
    const m=s.match(/^(-?\d+(?:\.\d+)?)\s*([kmb])?$/);
    if(!m) return Number(s)||0;
    const mul={k:1e3,m:1e6,b:1e9}[m[2]]||1;
    return Number(m[1])*mul;
  }

  function status(msg, kind='info') {
    if (!S.status) return;
    S.status.textContent=msg;
    S.status.dataset.kind=kind;
  }

  function currentMoneyFromDom() {
    const el=$('#user-money');
    if(!el) return 0;
    const raw=el.getAttribute('data-money');
    return raw ? num(raw) : parseAmount(el.textContent);
  }

  function apiErrorMessage(data, fallback='Torn API error') {
    const raw=data?.error?.error ?? data?.error?.message ?? data?.error ?? data?.message;
    if(typeof raw==='string' && raw.trim()) return raw.trim();
    return fallback;
  }

  async function apiJson(url, label='API') {
    try {
      const data=await window.SakaLuXCore.api.requestJson(url,{timeout:15000,retries:2,retryBase:450});
      if(data?.error) throw new Error(apiErrorMessage(data));
      return data;
    } catch(err) {
      if(err?.code==='INVALID_JSON') throw new Error(`${label}: invalid JSON response.`);
      if(err?.code==='HTTP') throw new Error(`${label}: HTTP ${err.status||0} · ${err.message||'request failed'}`);
      throw new Error(`${label}: ${err?.message||'request failed'}`);
    }
  }

  function normalizeUserStocks(data) {
    const out={};
    const raw=data?.stocks;
    if(Array.isArray(raw)) {
      for(const st of raw) {
        const id=String(st?.id ?? st?.stock_id ?? '');
        if(!id) continue;
        const shares=Number(st?.shares ?? st?.total_shares ?? st?.amount ?? 0)||0;
        out[id]={...st,total_shares:shares,transactions:st?.transactions||{}};
      }
      return out;
    }
    if(raw && typeof raw==='object') {
      for(const [id,st] of Object.entries(raw)) out[String(id)]={...st,total_shares:Number(st?.total_shares ?? st?.shares ?? 0)||0,transactions:st?.transactions||{}};
    }
    return out;
  }

  async function apiSync(keyOverride='') {
    const key=String(keyOverride||getStockApiKey()).trim();
    if(!key) throw new Error('Add an API key first.');
    const q=`key=${encodeURIComponent(key)}&ts=${Date.now()}`;
    const [moneyData,stocksData]=await Promise.all([
      apiJson(`https://api.torn.com/v2/user/money?${q}`,'User / money'),
      apiJson(`https://api.torn.com/v2/user/stocks?${q}`,'User / stocks')
    ]);
    const rawCash=moneyData?.money?.onhand ?? moneyData?.money?.cash ?? moneyData?.money_onhand ?? moneyData?.cash;
    const cash=Number(rawCash);
    if(Number.isFinite(cash)) S.money=cash;
    S.portfolio=normalizeUserStocks(stocksData);
    set(K.tx,JSON.stringify(S.portfolio||{}));
    return {money:moneyData,stocks:stocksData};
  }

  function setApiBadge(text, kind='idle') {
    const el=$('#slx-stock-api-badge');
    if(!el) return;
    el.textContent=text;
    el.dataset.kind=kind;
  }

  function saveApiKeyFromPanel() {
    const input=$('#slx-stock-api');
    const key=String(input?.value||'').trim();
    if(!key) throw new Error('Paste the Torn API key first.');
    set(K.api,key);
    setApiBadge('Saved','ok');
    status('API key saved locally.','ok');
    return key;
  }

  function clearApiKey() {
    del(K.api);
    const input=$('#slx-stock-api');
    if(input) input.value='';
    S.money=null;
    S.portfolio={};
    setApiBadge('Not configured','idle');
    renderPortfolio();
    renderAdvisor();
    status('API key cleared from local storage.','ok');
  }

  let apiSyncPending=null;
  function syncAllApi(keyOverride='') {
    if(apiSyncPending)return apiSyncPending;
    apiSyncPending=(async()=>{
    setApiBadge('Testing…','warn');
    const user=await apiSync(keyOverride);
    await syncStockCatalog(keyOverride);
    setApiBadge('Connected','ok');
    refreshTargetSelect();
    renderPortfolio();
    renderBenefitValues();
    renderAdvisor();
    renderOptimizer();
    renderTradeAssistant();
    refreshInlinePanel();
    status(`API connected · cash ${money(S.money||0)} · ${Object.keys(S.portfolio||{}).length} stock positions detected.`,'ok');
    return user;
    })().finally(()=>{apiSyncPending=null;});
    return apiSyncPending;
  }

  function createRequiredApiKey() {
    try { sessionStorage.setItem('SakaLuX_STOCK_KEY_SETUP_PENDING','1'); } catch {}
    location.href=REQUIRED_API_KEY_URL;
  }

  async function syncStockCatalog(keyOverride='') {
    const key=String(keyOverride||getStockApiKey()).trim();
    if(!key) throw new Error('Add an API key first.');
    const data=await apiJson(`https://api.torn.com/v2/torn/stocks?key=${encodeURIComponent(key)}&ts=${Date.now()}`,'Torn / stocks');
    const stocks=data?.stocks;
    if(!stocks || (typeof stocks!=='object' && !Array.isArray(stocks))) throw new Error('Torn / stocks: stock catalog unavailable.');
    const next=new Map(S.stocks);
    const list=Array.isArray(stocks)?stocks:Object.entries(stocks).map(([id,v])=>({...v,id:v?.id??id}));
    for(const raw of list) {
      const id=String(raw?.id ?? raw?.stock_id ?? '');
      const sym=String(raw?.acronym||raw?.symbol||'').toUpperCase();
      const price=Number(raw?.market?.price ?? raw?.current_price ?? raw?.price ?? 0);
      if(!id || !sym || !Number.isFinite(price) || price<=0) continue;
      const prev=next.get(sym)||{};
      next.set(sym,{...prev,sym,id,price,source:'api-v2'});
    }
    if(next.size) S.stocks=next;
    return S.stocks;
  }

  async function ensureStock(sym) {
    sym=String(sym||'').toUpperCase();
    scanStocks();
    let stock=S.stocks.get(sym);
    if(stock?.id && stock?.price) return stock;
    await syncStockCatalog();
    stock=S.stocks.get(sym);
    if(!stock?.id || !stock?.price) throw new Error(`Unable to resolve ${sym} stock ID/price.`);
    return stock;
  }

  function benefitTier(sym, shares) {
    const d=BENEFITS[sym];
    if(!d) return {tier:0,keep:0,next:0,nextBlock:0};
    shares=Math.max(0,Number(shares)||0);
    if(d.type==='P') return shares>=d.base ? {tier:1,keep:d.base,next:0,nextBlock:0} : {tier:0,keep:0,next:d.base,nextBlock:d.base};
    let tier=0;
    while(shares >= d.base*(Math.pow(2,tier+1)-1)) tier++;
    const keep=tier>0 ? d.base*(Math.pow(2,tier)-1) : 0;
    const next=d.base*(Math.pow(2,tier+1)-1);
    const nextBlock=d.base*Math.pow(2,tier);
    return {tier,keep,next,nextBlock};
  }

  function loadBenefitOverrides() {
    try { return JSON.parse(get(K.benefitValues,'{}'))||{}; } catch { return {}; }
  }

  function saveBenefitOverrides(v) { set(K.benefitValues,JSON.stringify(v||{})); }

  function benefitValueInfo(sym) {
    const model=BENEFIT_MODELS[sym];
    if(!model) return {value:0,freq:0,label:'Not modelled',source:'none'};
    const overrides=loadBenefitOverrides();
    const ov=overrides[sym]||{};
    const freq=Number(ov.freq)>0?Number(ov.freq):Number(model.freq||0);
    let value=Number(ov.value)>0?Number(ov.value):0;
    let source=Number(ov.value)>0?'manual':'default';
    if(!value && model.type==='cash') value=Number(model.value||0);
    if(!value && model.type==='item') { value=Number(S.benefitPrices[model.id]||0); source=value?'Torn market':'missing'; }
    if(!value && model.type==='average') {
      const vals=(model.ids||[]).map(id=>Number(S.benefitPrices[id]||0)).filter(v=>v>0);
      if(vals.length){ value=vals.reduce((a,b)=>a+b,0)/vals.length; source='Torn market avg'; }
    }
    if(model.type==='manual' && !value) source='manual required';
    return {value,freq,label:model.label||sym,source};
  }

  function benefitDailyValue(sym) {
    const i=benefitValueInfo(sym);
    return i.value>0 && i.freq>0 ? i.value/i.freq : 0;
  }

  async function fetchBenefitMarketValues() {
    const key=getStockApiKey();
    if(!key) throw new Error('Add an API key first.');
    const ids=[...new Set(Object.values(BENEFIT_MODELS).flatMap(m=>m.id?[m.id]:(m.ids||[])))];
    let ok=0;
    status(`Benefit values: fetching 0/${ids.length}…`,'warn');
    for(let i=0;i<ids.length;i++) {
      const id=ids[i];
      try {
        const d=await apiJson(`https://api.torn.com/v2/torn/${id}/items?key=${encodeURIComponent(key)}&ts=${Date.now()}`,'Torn / item');
        let price=Number(d?.value?.market_price||d?.items?.[0]?.value?.market_price||d?.items?.[0]?.market_value||d?.market_price||0);
        if(price>0){S.benefitPrices[id]=price;ok++;}
      } catch {}
      status(`Benefit values: fetching ${i+1}/${ids.length}…`,'warn');
      await new Promise(r=>setTimeout(r,80));
    }
    renderBenefitValues(); renderAdvisor(); renderOptimizer(); renderTradeAssistant();
    status(`Benefit values updated: ${ok}/${ids.length} market prices loaded.`,'ok');
    return ok;
  }

  function buildRoiCandidates() {
    scanStocks();
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    const rows=[];
    const excludedV080=excludedStocksSetV080();
    for(const [sym,model] of Object.entries(BENEFIT_MODELS)) {
      const d=BENEFITS[sym], st=S.stocks.get(sym);
      if(!d || !st?.price) continue;
      const daily=benefitDailyValue(sym);
      if(daily<=0) continue;
      const owned=ownedShares(sym);
      const tier=benefitTier(sym,owned);
      if(d.type==='P' && tier.tier>=1) continue;
      const targetShares=d.type==='P'?d.base:tier.next;
      const sharesNeeded=Math.max(0,targetShares-owned);
      if(sharesNeeded<=0) continue;
      const marginalShares=d.type==='P'?d.base:tier.nextBlock;
      const marginalCapital=marginalShares*st.price;
      const cost=sharesNeeded*st.price;
      const annual=daily*365;
      const roi=marginalCapital>0?(annual/marginalCapital)*100:0;
      if(!(roi>0)) continue;
      const bankApr=Math.max(0,Number(get(K.bankApr,'0'))||0);
      const paybackDays=daily>0?marginalCapital/daily:Infinity;
      rows.push({sym,model,tier:tier.tier+1,owned,targetShares,sharesNeeded,price:st.price,cost,marginalCapital,daily,annual,roi,paybackDays,bankApr,bankDelta:roi-bankApr,beatsBank:bankApr>0?roi>bankApr:null,affordable:cash>=cost,cash});
    }
    return rows.sort((a,b)=>b.roi-a.roi || a.cost-b.cost);
  }

  function renderBenefitValues() {
    const box=$('#slx-stock-benefit-values'); if(!box) return;
    const overrides=loadBenefitOverrides();
    const rows=Object.keys(BENEFIT_MODELS).sort().map(sym=>{
      const m=BENEFIT_MODELS[sym], i=benefitValueInfo(sym), ov=overrides[sym]||{};
      return `<div class="benefit-row" data-sym="${sym}"><b>${sym}</b><span>${esc(m.label||'Benefit')}</span><input class="benefit-value" inputmode="numeric" placeholder="${i.value?Math.round(i.value):'value'}" value="${ov.value||''}"><input class="benefit-freq" inputmode="decimal" placeholder="days" value="${ov.freq||m.freq||''}"><small>${i.value?money(i.value):'value missing'} · ${esc(i.source)}</small></div>`;
    }).join('');
    box.innerHTML=rows;
    $$('.benefit-row',box).forEach(row=>{
      const sym=row.dataset.sym;
      const save=()=>{const all=loadBenefitOverrides();const value=parseAmount($('.benefit-value',row).value);const freq=Number($('.benefit-freq',row).value)||0;if(value>0||freq>0) all[sym]={value:value||undefined,freq:freq||undefined}; else delete all[sym];saveBenefitOverrides(all);renderAdvisor();renderTradeAssistant();};
      $('.benefit-value',row).onchange=save; $('.benefit-freq',row).onchange=save;
    });
  }

  function renderTradeAssistant() {
    const box=$('#slx-stock-trade-body'); if(!box) return;
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="muted">Sync API and fetch benefit values to generate ROI candidates.</div>';return;}
    const best=rows[0];
    const affordable=rows.find(r=>r.affordable);
    const cards=[['Best ROI',best],['Best affordable',affordable]].filter(x=>x[1]);
    box.innerHTML=cards.map(([title,r])=>`<div class="trade-card"><div><small>${title}</small><b>${r.sym} · Tier ${r.tier}</b><span>${r.roi.toFixed(2)}% est. annual ROI</span></div><div><small>Need</small><b>${r.sharesNeeded.toLocaleString()} shares</b><span>${money(r.cost)}</span></div><div class="trade-actions"><button data-set="${r.sym}">Set target</button><button class="primary" data-buy="${r.sym}" data-shares="${r.sharesNeeded}">Buy gap</button></div></div>`).join('');
    $$('[data-set]',box).forEach(b=>b.onclick=()=>{set(K.target,b.dataset.set);refreshTargetSelect();status(`${b.dataset.set} selected as vault target.`,'ok');});
    $$('[data-buy]',box).forEach(b=>b.onclick=async()=>{const sym=b.dataset.buy;const requested=Number(b.dataset.shares)||0;try{const st=await ensureStock(sym);let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());if(!cash){await apiSync();cash=Number(S.money)||0;}const can=Math.floor(cash/st.price);const shares=Math.min(requested,can);if(shares<=0)throw new Error(`Not enough cash to buy ${sym}.`);if(!confirm(`Buy ${shares.toLocaleString()} ${sym} shares for about ${money(shares*st.price)}?`))return;await postTrade(sym,shares,'buyShares');status(`Trade Assistant bought ${shares.toLocaleString()} ${sym}.`,'ok');await syncAllApi();}catch(e){status(`Trade Assistant: ${e.message}`,'bad');}});
  }

  function scanStocks() {
    const rows=$$("ul[class^='stock_'], ul[id^='stock_']");
    const next=new Map();
    for(const row of rows) {
      const img=$('img[src*="logos/"]',row);
      const src=img?.getAttribute('src')||'';
      const mm=src.match(/logos\/([^/.]+)\.svg/i);
      const sym=(mm?.[1]||'').toUpperCase();
      if(!sym) continue;
      const id=(row.id||'').replace(/^stock_/, '');
      const priceEl=$("div[class^='price_']",row) || $('[data-price]',row);
      const price=num(priceEl?.textContent || priceEl?.getAttribute('data-price'));
      let owned=0;
      const mobile=$("p[class^='count']",row);
      if(mobile) owned=num(mobile.textContent);
      if(!owned) {
        const txt=row.textContent||'';
        const m=txt.match(/(?:owned|shares)\s*:?\s*([\d,]+)/i);
        if(m) owned=num(m[1]);
      }
      next.set(sym,{sym,id,row,price,owned});
    }
    if(next.size) S.stocks=next;
    return S.stocks;
  }

  function ownedShares(sym) {
    const stock=S.stocks.get(sym);
    if(stock?.owned) return stock.owned;
    const id=stock?.id;
    if(id && S.portfolio?.[id]) return Number(S.portfolio[id].total_shares)||0;
    return 0;
  }

  function averageBuy(sym) {
    const stock=S.stocks.get(sym); if(!stock?.id) return 0;
    const data=S.portfolio?.[stock.id];
    const tx=data?.transactions ? Object.values(data.transactions) : [];
    let shares=0,cost=0;
    for(const t of tx) {
      const q=Number(t.shares||t.amount||0);
      const p=Number(t.bought_price||t.price||t.price_each||0);
      if(q>0 && p>0){shares+=q;cost+=q*p;}
    }
    return shares?cost/shares:0;
  }

  function stockRowMetrics(sym) {
    const st=S.stocks.get(sym);
    if(!st) return null;
    const owned=ownedShares(sym);
    const avg=averageBuy(sym);
    const price=Number(st.price)||0;
    const value=owned*price;
    const cost=avg>0?owned*avg:null;
    const pl=cost===null?null:value-cost;
    const plPct=cost>0?(pl/cost)*100:null;
    const tier=benefitTier(sym,owned);
    const nextGap=tier.next&&tier.next>owned?tier.next-owned:0;
    const protectedShares=tier.keep||0;
    const freeShares=Math.max(0,owned-protectedShares);
    return {sym,st,owned,avg,price,value,cost,pl,plPct,tier,nextGap,protectedShares,freeShares};
  }

  async function stockRowBuyGap(sym) {
    try {
      scanStocks();
      const m=stockRowMetrics(sym);
      if(!m) throw new Error(`${sym} is not available.`);
      if(!m.nextGap) throw new Error(`${sym} has no detected next benefit gap.`);
      let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
      if(bool(K.inlineApiMode,true)&&getStockApiKey()) {
        try { await apiSync(); cash=Math.max(cash,Number(S.money)||0); } catch {}
      }
      const shares=Math.min(m.nextGap,Math.floor(cash/m.price));
      if(shares<=0) throw new Error(`Not enough cash to buy ${sym}.`);
      const estimate=shares*m.price;
      if(!confirm(`BUY GAP · ${sym}\n\n${shares.toLocaleString()} shares\nEstimated: ${money(estimate)}\nNext benefit gap: ${m.nextGap.toLocaleString()} shares\n\nExecute now?`)) return;
      await postTrade(sym,shares,'buyShares');
      inlineStatus(`${isDryRun()?'Dry Run · ':''}BUY GAP ${shares.toLocaleString()} ${sym}.`,'ok');
      if(getStockApiKey()&&!isDryRun()) await syncAllApi();
      scanStocks(); enhanceStockRows(); refreshInlinePanel();
    } catch(e) { inlineStatus(`Row BUY ${sym}: ${e.message}`,'bad'); }
  }

  async function stockRowSellExcess(sym) {
    try {
      scanStocks();
      const m=stockRowMetrics(sym);
      if(!m?.owned) throw new Error(`No ${sym} shares detected.`);
      const shares=m.freeShares;
      if(shares<=0) throw new Error(`${sym} has no shares above the protected benefit floor.`);
      const estimate=shares*m.price;
      if(!confirm(`SELL EXCESS · ${sym}\n\n${shares.toLocaleString()} shares\nEstimated: ${money(estimate)}\nProtected after sale: ${m.protectedShares.toLocaleString()} shares\n\nExecute now?`)) return;
      await postTrade(sym,shares,'sellShares');
      inlineStatus(`${isDryRun()?'Dry Run · ':''}SELL EXCESS ${shares.toLocaleString()} ${sym}.`,'ok');
      if(getStockApiKey()&&!isDryRun()) await syncAllApi();
      scanStocks(); enhanceStockRows(); refreshInlinePanel();
    } catch(e) { inlineStatus(`Row SELL ${sym}: ${e.message}`,'bad'); }
  }

  function stockRowBenefitProgress(sym, owned) {
    const tier=benefitTier(sym,owned);
    if(!tier.next) return {pct:100,label:tier.tier?`Tier ${tier.tier} complete`:'No next tier',tier};
    const start=Math.max(0,Number(tier.keep)||0);
    const span=Math.max(1,Number(tier.next)-start);
    const pct=Math.max(0,Math.min(100,((Number(owned)||0)-start)/span*100));
    return {pct,label:`${pct.toFixed(1)}% to Tier ${tier.tier+1}`,tier};
  }

  function stockRowQuickOptions() {
    const vals=inlinePresetValues().slice(0,6);
    return [...vals,'max'];
  }

  async function stockRowQuickTrade(sym, side, rawAmount) {
    try {
      sym=String(sym||'').toUpperCase();
      const st=await ensureStock(sym);
      scanStocks();
      const owned=ownedShares(sym);
      const isMax=String(rawAmount||'').toLowerCase()==='max';
      const amount=isMax?0:Math.max(0,parseAmount(rawAmount));
      let shares=0;
      let estimate=0;

      if(side==='buy') {
        let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
        if(!cash && getStockApiKey()) { await apiSync(); cash=Number(S.money)||0; }
        if(!cash) throw new Error('Unable to determine on-hand cash.');
        const keep=Math.max(0,parseAmount(get(K.keep,'0')));
        const spendable=Math.max(0,cash-keep);
        const budget=isMax?spendable:Math.min(amount,spendable);
        shares=Math.floor(budget/st.price);
        estimate=shares*st.price;
        if(shares<=0) throw new Error(`Not enough spendable cash for ${sym}.`);
        if(!confirm(`Quick BUY ${sym}\n\nPreset: ${isMax?'MAX':String(rawAmount).toUpperCase()}\nShares: ${shares.toLocaleString()}\nEstimated spend: ${money(estimate)}\nVault keep preserved: ${money(keep)}\n\nExecute now?`)) return;
        await postTrade(sym,shares,'buyShares');
        inlineStatus(`${isDryRun()?'Dry Run · ':''}Quick BUY ${shares.toLocaleString()} ${sym} · ${money(estimate)}.`,'ok');
      } else {
        if(!owned) throw new Error(`No ${sym} shares detected.`);
        const tier=benefitTier(sym,owned);
        const protectedShares=bool(K.benefitLock,true)?tier.keep:0;
        const sellable=Math.max(0,owned-protectedShares);
        if(sellable<=0) throw new Error('Benefit Lock: no sellable shares above the protected floor.');
        const requested=isMax?sellable:Math.ceil(amount/st.price);
        shares=Math.min(sellable,requested);
        estimate=shares*st.price;
        if(shares<=0) throw new Error(`Nothing to sell for ${sym}.`);
        if(!confirm(`Quick SELL ${sym}\n\nPreset: ${isMax?'MAX':String(rawAmount).toUpperCase()}\nShares: ${shares.toLocaleString()}\nEstimated proceeds: ${money(estimate)}\nProtected floor: ${protectedShares.toLocaleString()} shares\n\nExecute now?`)) return;
        await postTrade(sym,shares,'sellShares');
        inlineStatus(`${isDryRun()?'Dry Run · ':''}Quick SELL ${shares.toLocaleString()} ${sym} · ${money(estimate)}.`,'ok');
      }

      if(getStockApiKey()&&!isDryRun()) await syncAllApi();
      scanStocks(); enhanceStockRows(); refreshInlinePanel();
    } catch(e) { inlineStatus(`Quick ${String(side||'trade').toUpperCase()} ${sym}: ${e.message}`,'bad'); }
  }

  function favoriteStocks() {
    try { const a=JSON.parse(get(K.favorites,'[]')); return new Set(Array.isArray(a)?a.map(x=>String(x).toUpperCase()):[]); } catch { return new Set(); }
  }
  function saveFavoriteStocks(setv) { set(K.favorites,JSON.stringify([...setv].sort())); }
  function toggleFavorite(sym) { const f=favoriteStocks(); sym=String(sym||'').toUpperCase(); f.has(sym)?f.delete(sym):f.add(sym); saveFavoriteStocks(f); enhanceStockRows(); refreshInlinePanel(); }
  function nearBenefitInfo(sym) {
    const m=stockRowMetrics(sym); if(!m||!m.tier?.next) return null;
    const start=Math.max(0,Number(m.tier.keep)||0), span=Math.max(1,Number(m.tier.next)-start);
    const pct=Math.max(0,Math.min(100,((m.owned-start)/span)*100));
    const threshold=Math.max(50,Math.min(99.9,Number(get(K.nearBenefitPct,'90'))||90));
    return {pct,near:pct>=threshold && pct<100,threshold,gap:m.nextGap};
  }
  function safetySnapshot() {
    const target=get(K.target).toUpperCase();
    return {dryRun:isDryRun(),benefitLock:bool(K.benefitLock,true),targetLock:bool(K.targetLock,false),target,panicFallback:get(K.panicFallback).toUpperCase(),tradeBusy:!!S.tradeBusy,api:!!getStockApiKey()};
  }
  function exportStockManagerData() {
    const keys=Object.values(K), data={version:APP.version,exportedAt:new Date().toISOString(),settings:{}};
    keys.forEach(k=>{const v=get(k,null); if(v!==null && k!==K.api) data.settings[k]=v;});
    data.actionLog=loadActionLog();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=`SakaLuX-Stock-Manager-${APP.version}-backup.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }
  function importStockManagerData(file) {
    if(!file) return;
    const r=new FileReader(); r.onload=()=>{try{const d=JSON.parse(String(r.result||'{}')); for(const [k,v] of Object.entries(d.settings||{})){if(Object.values(K).includes(k)&&k!==K.api)set(k,v);} if(Array.isArray(d.actionLog))set(K.actionLog,JSON.stringify(d.actionLog.slice(0,100))); inlineStatus('Settings/history imported. Reloading…','ok'); setTimeout(()=>location.reload(),500);}catch(e){inlineStatus(`Import failed: ${e.message}`,'bad');}}; r.readAsText(file);
  }
  function diagnosticsText() {
    const x=safetySnapshot(), rows=[...S.stocks.values()].filter(v=>v?.row?.isConnected).length;
    return `v${APP.version} · API ${x.api?'ON':'OFF'} · DryRun ${x.dryRun?'ON':'OFF'} · BenefitLock ${x.benefitLock?'ON':'OFF'} · TargetLock ${x.targetLock?'ON':'OFF'} · Target ${x.target||'none'} · Stocks ${S.stocks.size} · DOM rows ${rows} · Positions ${Object.keys(S.portfolio||{}).length}`;
  }

  function favoriteTargets() {
    try { const a=JSON.parse(get(K.targetFavorites,'[]')); return Array.isArray(a)?[...new Set(a.map(x=>String(x).toUpperCase()).filter(Boolean))]:[]; } catch { return []; }
  }
  function saveFavoriteTargets(a) { set(K.targetFavorites,JSON.stringify([...new Set(a)].sort())); }
  function toggleFavoriteTarget(sym) {
    sym=String(sym||get(K.target)||'').toUpperCase(); if(!sym) return;
    const a=favoriteTargets(), i=a.indexOf(sym); i>=0?a.splice(i,1):a.push(sym); saveFavoriteTargets(a); refreshRoadmapControls();
  }
  function setTargetSafely(sym) {
    sym=String(sym||'').toUpperCase(); if(!sym) return false;
    const current=get(K.target).toUpperCase();
    if(bool(K.targetLock,false) && current && current!==sym){ inlineStatus(`Target Lock is ON · unlock before changing ${current} → ${sym}.`,'warn'); return false; }
    set(K.target,sym); refreshTargetSelect(); refreshInlinePanel(); enhanceStockRows(); return true;
  }
  function loadTransactionHistory() {
    try { const a=JSON.parse(get(K.txHistory,'[]')); return Array.isArray(a)?a:[]; } catch { return []; }
  }
  function addTransactionHistory(entry) {
    const step=String(entry?.step||''); if(!/buyShares|sellShares/i.test(step)) return;
    const rows=loadTransactionHistory(); rows.unshift({time:Date.now(),...entry}); set(K.txHistory,JSON.stringify(rows.slice(0,200)));
  }
  function renderTransactionHistory() {
    const box=$('#slx-stock-tx-history'); if(!box) return;
    const q=String($('#slx-tx-search')?.value||'').trim().toLowerCase(), filter=$('#slx-tx-filter')?.value||'all';
    let rows=loadTransactionHistory();
    if(filter!=='all') rows=rows.filter(r=>filter==='buy'?r.step==='buyShares':r.step==='sellShares');
    if(q) rows=rows.filter(r=>`${r.sym||''} ${r.message||''} ${r.status||''}`.toLowerCase().includes(q));
    if(!rows.length){box.innerHTML='<div class="muted">No matching transactions yet.</div>';return;}
    box.innerHTML=rows.slice(0,100).map(r=>`<div class="action-row"><span>${new Date(r.time||0).toLocaleString()}</span><b>${r.step==='buyShares'?'BUY':'SELL'} ${esc(r.sym||'')}</b><span>${Number(r.shares||0).toLocaleString()} sh · ${money(Number(r.estimate||0))}</span><small>${esc(r.status||'')} · ${esc(r.message||'')}</small></div>`).join('');
    const qs=$('#slx-tx-search'), fs=$('#slx-tx-filter'); if(qs&&!qs.dataset.bound){qs.dataset.bound='1';qs.oninput=renderTransactionHistory;} if(fs&&!fs.dataset.bound){fs.dataset.bound='1';fs.onchange=renderTransactionHistory;}
  }
  function refreshRoadmapControls() {
    const card=$('#slx-stock-inline'); if(!card) return;
    const sel=$('#slx-target-favorites',card), cur=get(K.target).toUpperCase(), favs=favoriteTargets();
    if(sel){sel.innerHTML='<option value="">Favorite targets…</option>'+favs.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''); if(favs.includes(cur)) sel.value=cur;}
    const t=$('#slx-target-fav-toggle',card); if(t) t.textContent=favs.includes(cur)?'★ Target':'☆ Target';
    const near=$('#slx-near-pct',card); if(near) near.value=String(Math.max(50,Math.min(99.9,Number(get(K.nearBenefitPct,'90'))||90)));
    const cash=$('#slx-cash-target',card); if(cash) cash.value=get(K.cashTarget,'0');
  }
  async function sellToCashTarget() {
    const targetCash=parseAmount(get(K.cashTarget,'0')), cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    if(targetCash<=0) throw new Error('Set a Cash Target first.');
    if(cash>=targetCash){inlineStatus(`Cash target already reached: ${money(cash)}.`,'ok');return;}
    const sym=get(K.target).toUpperCase(); if(!sym) throw new Error('Select a target stock to sell from.');
    await ensureStock(sym); const m=stockRowMetrics(sym); if(!m?.owned||!m.price) throw new Error(`No sellable ${sym} position detected.`);
    const protectedShares=bool(K.benefitLock,true)?Math.max(0,Number(m.tier?.keep)||0):0, sellable=Math.max(0,m.owned-protectedShares);
    const need=targetCash-cash, shares=Math.min(sellable,Math.ceil(need/m.price));
    if(shares<=0) throw new Error('Benefit Lock leaves no sellable shares for this cash target.');
    const estimate=shares*m.price;
    if(!confirm(`Sell to Cash Target\n\nSELL ${shares.toLocaleString()} ${sym}\nEstimated proceeds: ${money(estimate)}\nCash target: ${money(targetCash)}\nProtected shares kept: ${protectedShares.toLocaleString()}\n\nContinue?`)) return;
    await postTrade(sym,shares,'sellShares'); if(getStockApiKey()) await apiSync(); refreshInlinePanel(); renderTransactionHistory();
  }
  function buildExecutableRebalancePlan() {
    const x=buildRebalancePreview();
    if(!x?.target) return null;
    const targetSym=String(x.target.sym||'').toUpperCase();
    const sources=(x.sells||[]).filter(r=>String(r.sym||'').toUpperCase()!==targetSym&&Number.isFinite(Number(r.shares))&&Number(r.shares)>0&&Number.isFinite(Number(r.proceeds))&&Number(r.proceeds)>0)
      .map(r=>({sym:String(r.sym||'').toUpperCase(),shares:Math.floor(Number(r.shares)),value:Number(r.proceeds),price:Number(r.price)||0}));
    return {target:x.target,cash:x.cash,need:x.required||0,sources,shortfall:Number(x.shortfall)||0,reserve:x.reserve||0};
  }

  function rebalanceConfirmText(plan) {
    const sellTotal=plan.sources.reduce((n,x)=>n+Number(x.value||0),0);
    const sells=plan.sources.length?plan.sources.map(x=>`SELL ${x.shares.toLocaleString()} ${x.sym} ≈ ${money(x.value)}`).join('\n'):'No SELL required · current cash is enough';
    const projectedCash=Math.max(0,Number(plan.cash||0)+sellTotal);
    return `Guided Rebalance\n\nSELL PHASE\n${sells}\n\nTotal estimated sale: ${money(sellTotal)}\nCash before: ${money(plan.cash||0)}\nCash after SELL: ≈ ${money(projectedCash)}\nReserve kept: ${money(plan.reserve||0)}\n\nBUY PHASE\nBUY ${Math.floor(Number(plan.target.sharesNeeded)||0).toLocaleString()} ${plan.target.sym} ≈ ${money(plan.target.cost)}\nTarget Tier ${plan.target.tier}\n\nBenefit floors are preserved. Continue with SELL phase?`;
  }


  const STOCK_REBALANCE_STATES=Object.freeze({PLANNING:'PLANNING',SELLING:'SELLING',VERIFYING_SELL:'VERIFYING_SELL',WAITING_SYNC:'WAITING_SYNC',VERIFYING_CASH:'VERIFYING_CASH',BUYING:'BUYING',VERIFYING_POSITION:'VERIFYING_POSITION',COMPLETE:'COMPLETE',STOPPED:'STOPPED',ERROR:'ERROR'});
  const STOCK_REBALANCE_CHECKPOINT='SLX_STOCK_REBALANCE_CHECKPOINT_V1';
  function stockRebalanceCheckpointRead(){return window.SakaLuXCore.storage.get(STOCK_REBALANCE_CHECKPOINT,null)}
  function stockRebalanceCheckpointWrite(state){window.SakaLuXCore.storage.set(STOCK_REBALANCE_CHECKPOINT,state)}
  function stockRebalanceCheckpointClear(){window.SakaLuXCore.storage.remove(STOCK_REBALANCE_CHECKPOINT)}
  function stockRebalanceNormalizeResume(resume){
    if(!resume||typeof resume!=='object')return {sold:[],bought:null};
    const sold=Array.isArray(resume.sold)?resume.sold.map(x=>({sym:String(x.sym||'').toUpperCase(),shares:Math.floor(Number(x.shares)||0)})).filter(x=>x.sym&&x.shares>0):[];
    const bought=resume.bought&&Number(resume.bought.shares)>0?{sym:String(resume.bought.sym||'').toUpperCase(),shares:Math.floor(Number(resume.bought.shares)||0),price:Number(resume.bought.price)||0}:null;
    return {sold,bought};
  }
  function stockRebalanceSanitizePlan(plan){
    if(!plan||!plan.target)throw new Error('Missing rebalance target.');
    const targetSym=String(plan.target.sym||'').toUpperCase(),targetShares=Math.floor(Number(plan.target.sharesNeeded)||0);
    if(!targetSym||targetShares<=0)throw new Error('Invalid rebalance target.');
    const sources=(plan.sources||[]).map(s=>({sym:String(s.sym||'').toUpperCase(),shares:Math.floor(Number(s.shares)||0),price:Number(s.price)||0})).filter(s=>s.sym&&s.sym!==targetSym&&s.shares>0&&s.price>0);
    return {target:{sym:targetSym,sharesNeeded:targetShares,tier:plan.target.tier??null,price:Number(plan.target.price)||0,cost:Number(plan.target.cost)||0},sources,reserve:Math.max(0,Number(plan.reserve)||0),startingCash:Math.max(0,Number(plan.cash)||0)};
  }
  function stockRebalanceAlreadySold(ctx,src){return ctx.sold.some(x=>x.sym===src.sym&&Number(x.shares)>=src.shares)}
  async function stockRebalanceExecute(plan,io,opts={}){
    const resume=stockRebalanceNormalizeResume(opts.resumeState),ctx={phase:STOCK_REBALANCE_STATES.PLANNING,plan:stockRebalanceSanitizePlan(plan),sold:resume.sold.map(x=>({...x,recovered:true})),bought:resume.bought,cashBeforeBuy:0,targetPriceBeforeBuy:0,verified:false,error:null,resumed:resume.sold.length>0||!!resume.bought,history:[STOCK_REBALANCE_STATES.PLANNING]};
    const transition=n=>{ctx.phase=n;ctx.history.push(n)};
    const checkpoint=async()=>{const state={target:ctx.plan.target.sym,phase:ctx.phase,sold:ctx.sold.map(x=>({sym:x.sym,shares:x.shares})),bought:ctx.bought?{...ctx.bought}:null};stockRebalanceCheckpointWrite(state);if(typeof io.checkpoint==='function')await io.checkpoint(state)};
    const syncDelayMs=Number.isFinite(opts.syncDelayMs)?opts.syncDelayMs:2600,maxRetries=Math.max(0,Math.floor(Number(opts.maxSellRetries)||1));
    try{
      if(ctx.bought){transition(STOCK_REBALANCE_STATES.VERIFYING_POSITION);if(syncDelayMs>0)await io.wait(syncDelayMs);await io.sync();const s=await io.snapshot();if(Math.max(0,Math.floor(Number(s.targetShares)||0))<ctx.bought.shares)throw new Error('Recovered BUY checkpoint could not be verified.');ctx.verified=true;transition(STOCK_REBALANCE_STATES.COMPLETE);stockRebalanceCheckpointClear();return ctx}
      transition(STOCK_REBALANCE_STATES.SELLING);
      for(const src of ctx.plan.sources){
        if(stockRebalanceAlreadySold(ctx,src))continue;
        let ok=false,lastError=null,recovered=false;
        for(let attempt=0;attempt<=maxRetries&&!ok;attempt++){
          let result=null;
          try{result=await io.sell(src.sym,src.shares);transition(STOCK_REBALANCE_STATES.VERIFYING_SELL);ok=await io.verifySell(src.sym,src.shares,result);if(!ok)lastError=new Error(`SELL verification failed for ${src.sym}.`);else recovered=result?.success!==true}
          catch(e){lastError=e instanceof Error?e:new Error(String(e));transition(STOCK_REBALANCE_STATES.VERIFYING_SELL);ok=await io.verifySell(src.sym,src.shares,result);recovered=ok}
          if(!ok&&attempt<maxRetries){await io.wait(1800);transition(STOCK_REBALANCE_STATES.SELLING)}
        }
        if(!ok)throw lastError||new Error(`SELL failed for ${src.sym}.`);
        ctx.sold.push({...src,recovered});await checkpoint();if(ctx.phase!==STOCK_REBALANCE_STATES.SELLING)transition(STOCK_REBALANCE_STATES.SELLING);
      }
      transition(STOCK_REBALANCE_STATES.WAITING_SYNC);if(syncDelayMs>0)await io.wait(syncDelayMs);await io.sync();transition(STOCK_REBALANCE_STATES.VERIFYING_CASH);
      const before=await io.snapshot(),cash=Math.max(0,Number(before.cash)||0),targetPrice=Math.max(0,Number(before.targetPrice)||0);if(!(targetPrice>0))throw new Error('Target price unavailable after SELL sync.');ctx.cashBeforeBuy=cash;ctx.targetPriceBeforeBuy=targetPrice;
      const buyShares=Math.min(ctx.plan.target.sharesNeeded,Math.floor(Math.max(0,cash-ctx.plan.reserve)/targetPrice));if(buyShares<=0){transition(STOCK_REBALANCE_STATES.STOPPED);ctx.error='Insufficient verified cash for BUY.';await checkpoint();return ctx}
      transition(STOCK_REBALANCE_STATES.BUYING);const buyResult=await io.buy(ctx.plan.target.sym,buyShares);if(!buyResult||buyResult.success!==true)throw new Error(`BUY not confirmed for ${ctx.plan.target.sym}.`);ctx.bought={sym:ctx.plan.target.sym,shares:buyShares,price:targetPrice};await checkpoint();
      transition(STOCK_REBALANCE_STATES.VERIFYING_POSITION);if(syncDelayMs>0)await io.wait(syncDelayMs);await io.sync();const after=await io.snapshot();const held=Math.max(0,Math.floor(Number(after.targetShares)||0)),heldBefore=Math.max(0,Math.floor(Number(before.targetShares)||0));if(held-heldBefore<buyShares)throw new Error('BUY verification failed: target position did not increase enough.');ctx.verified=true;transition(STOCK_REBALANCE_STATES.COMPLETE);stockRebalanceCheckpointClear();return ctx;
    }catch(e){ctx.error=e?.message||String(e);transition(STOCK_REBALANCE_STATES.ERROR);await checkpoint();return ctx}
  }

  async function executeGuidedRebalance() {
    const rawPlan=buildExecutableRebalancePlan(); if(!rawPlan) throw new Error('No ROI rebalance candidate available.');
    if(rawPlan.shortfall>0) throw new Error(`Rebalance still needs ${money(rawPlan.shortfall)} after all valid free/excess shares.`);
    if(!confirm(rebalanceConfirmText(rawPlan))) return;
    const plan={cash:rawPlan.cash,reserve:rawPlan.reserve,target:{sym:rawPlan.target.sym,sharesNeeded:rawPlan.target.sharesNeeded,price:rawPlan.target.price||0,cost:rawPlan.target.cost||0,tier:rawPlan.target.tier},sources:rawPlan.sources};
    const oldCheckpoint=stockRebalanceCheckpointRead();
    const resumeState=oldCheckpoint&&String(oldCheckpoint.target||'').toUpperCase()===String(plan.target.sym).toUpperCase()&&oldCheckpoint.phase!==STOCK_REBALANCE_STATES.COMPLETE?oldCheckpoint:null;
    const preSellOwned=new Map();
    const io={
      sell:async(sym,shares)=>{await ensureStock(sym);preSellOwned.set(sym,ownedShares(sym));return postTrade(sym,shares,'sellShares')},
      verifySell:async(sym,shares)=>{if(isDryRun())return true;await new Promise(r=>setTimeout(r,1800));if(getStockApiKey())await apiSync();else scanStocks();const before=Number(preSellOwned.get(sym));const now=Number(ownedShares(sym)||0);return Number.isFinite(before)?now<=Math.max(0,before-shares):true},
      buy:async(sym,shares)=>postTrade(sym,shares,'buyShares'),
      wait:ms=>new Promise(r=>setTimeout(r,ms)),
      sync:async()=>{if(getStockApiKey())await apiSync();else{scanStocks();await new Promise(r=>setTimeout(r,350));scanStocks()}},
      snapshot:async()=>{await ensureStock(plan.target.sym);const m=stockRowMetrics(plan.target.sym);return {cash:Math.max(Number(S.money)||0,currentMoneyFromDom()),targetPrice:Number(m?.price)||0,targetShares:Number(ownedShares(plan.target.sym)||0)}},
      checkpoint:async state=>inlineStatus(`Rebalance · ${state.phase}`,'warn')
    };
    const ctx=await stockRebalanceExecute(plan,io,{syncDelayMs:isDryRun()?0:2600,maxSellRetries:isDryRun()?0:1,resumeState});
    refreshInlinePanel();renderTransactionHistory();
    if(ctx.phase===STOCK_REBALANCE_STATES.COMPLETE){inlineStatus(`Guided rebalance verified and complete for ${plan.target.sym}.`,'ok');return}
    if(ctx.phase===STOCK_REBALANCE_STATES.STOPPED){inlineStatus(ctx.error||'Rebalance stopped safely before BUY.','warn');return}
    throw new Error(ctx.error||`Rebalance failed in ${ctx.phase}.`);
  }

  function stockViewScore(sym, mode) {
    const m=stockRowMetrics(sym);
    if(!m) return 0;
    const candidate=buildRoiCandidates().find(x=>x.sym===sym);
    if(mode==='owned') return m.owned||0;
    if(mode==='roi') return candidate?.roi||0;
    if(mode==='benefit') return m.nextGap>0 ? 1/Math.max(1,m.nextGap) : 0;
    if(mode==='pl') return m.pl===null ? -Infinity : m.pl;
    if(mode==='loss') return m.pl===null ? Infinity : m.pl;
    if(mode==='excess') return m.freeShares||0;
    if(mode==='value') return m.value||0;
    return 0;
  }

  function stockPassesFilter(sym, filter) {
    const m=stockRowMetrics(sym);
    if(!m) return false;
    if(filter==='owned') return m.owned>0;
    if(filter==='loss') return m.pl!==null && m.pl<0;
    if(filter==='profit') return m.pl!==null && m.pl>0;
    if(filter==='excess') return m.freeShares>0;
    if(filter==='benefit') return m.nextGap>0;
    if(filter==='favorites') return favoriteStocks().has(sym);
    const q=get(K.rowSearch,'').trim().toUpperCase();
    if(q && !String(sym).toUpperCase().includes(q)) return false;
    return true;
  }

  function stockRowTools(row, sym) {
    const sibling=row?.nextElementSibling;
    if(sibling?.matches?.('.slx-stock-row-tools') && sibling.dataset.sym===sym) return sibling;
    return row?.querySelector?.('.slx-stock-row-tools') || document.querySelector('.slx-stock-row-tools[data-sym="'+sym+'"]');
  }

  function applyStockView() {
    if(!isStocks()) return;
    scanStocks();
    const sort=get(K.stockSort,'default');
    const filter=get(K.stockFilter,'all');
    const byParent=new Map();
    for(const [sym,st] of S.stocks) {
      const row=st?.row;
      if(!row?.isConnected || !row.parentElement) continue;
      if(!byParent.has(row.parentElement)) byParent.set(row.parentElement,[]);
      byParent.get(row.parentElement).push({sym,row,score:stockViewScore(sym,sort)});
      row.style.display=stockPassesFilter(sym,filter)?'':'none';
      row.dataset.slxViewVisible=row.style.display==='none'?'0':'1';
      const tools=stockRowTools(row,sym);
      if(tools) tools.hidden=row.dataset.slxViewVisible==='0';
    }
    if(sort==='default') return;
    for(const [parent,items] of byParent) {
      const visible=items.filter(x=>x.row.style.display!=='none');
      const hidden=items.filter(x=>x.row.style.display==='none');
      visible.sort((a,b)=> sort==='loss' ? a.score-b.score : b.score-a.score || a.sym.localeCompare(b.sym));
      const ordered=[...visible,...hidden];
      if(ordered.length<2) continue;
      if(ordered.every((item,index)=>item.row===items[index].row && (!stockRowTools(item.row,item.sym) || item.row.nextElementSibling===stockRowTools(item.row,item.sym)))) continue;
      const marker=document.createComment('slx-stock-sort');
      parent.insertBefore(marker,ordered[0].row);
      const frag=document.createDocumentFragment();
      ordered.forEach(x=>{
        const tools=stockRowTools(x.row,x.sym);
        frag.appendChild(x.row);
        if(tools)frag.appendChild(tools);
      });
      marker.parentNode.insertBefore(frag,marker.nextSibling);
      marker.remove();
    }
  }

  function opportunityRanks() {
    const roi=buildRoiCandidates();
    const map=new Map();
    roi.slice(0,3).forEach((r,i)=>map.set(r.sym,{rank:i+1,roi:r.roi}));
    return map;
  }

  function refreshStockViewControls() {
    const sort=$('#slx-stock-sort'); if(sort) sort.value=get(K.stockSort,'default');
    const filter=$('#slx-stock-filter'); if(filter) filter.value=get(K.stockFilter,'all');
  }

  function enhanceStockRows() {
    if(!isStocks()) return;
    scanStocks();
    const ranks=opportunityRanks(), favorites=favoriteStocks();
    const quickOptions=stockRowQuickOptions().map(v=>`<option value="${esc(v)}">${esc(String(v).toUpperCase())}</option>`).join('');
    for(const tools of $$('.slx-stock-row-tools')) {
      if(!S.stocks.get(tools.dataset.sym)?.row?.isConnected)tools.remove();
    }
    for(const [sym,st] of S.stocks) {
      const row=st?.row;
      if(!row?.isConnected) continue;
      const old=stockRowTools(row,sym);
      const m=stockRowMetrics(sym);
      if(!m) continue;
      const li=old?.tagName==='DIV'?old:document.createElement('div');
      if(old && old!==li)old.remove();
      li.setAttribute('data-slx-stock-companion','1');
      li.className='slx-stock-row-tools';
      li.dataset.sym=sym;
      const tierLabel=m.tier.tier?`Tier ${m.tier.tier}`:'No tier';
      const nextText=m.nextGap?`${m.nextGap.toLocaleString()} to next`:'No next gap';
      const plText=m.pl===null?'P/L n/a':`${m.pl>=0?'+':'-'}${money(Math.abs(m.pl))}${m.plPct===null?'':` (${m.plPct>=0?'+':''}${m.plPct.toFixed(2)}%)`}`;
      const progress=stockRowBenefitProgress(sym,m.owned);
      const opp=ranks.get(sym);
      const fav=favorites.has(sym);
      const near=nearBenefitInfo(sym);
      const markup=`<div class="slx-row-stock"><b>${esc(sym)}${opp?` <em class=\"slx-opp-badge\">#${opp.rank} ROI</em>`:''}</b><span>${money(m.price)}</span>${opp?`<small class=\"slx-opp-roi\">${opp.roi.toFixed(2)}% APR</small>`:''}</div><div class="slx-row-stat"><small>Owned</small><b>${m.owned.toLocaleString()}</b><span>${money(m.value)}</span></div><div class="slx-row-stat"><small>Avg buy</small><b>${m.avg?money(m.avg):'n/a'}</b><span class="${m.pl===null?'muted':m.pl>=0?'good':'bad'}">${plText}</span></div><div class="slx-row-stat"><small>Benefit</small><b>${tierLabel}</b><span>${nextText}</span><div class="slx-row-progress"><i style="width:${progress.pct.toFixed(2)}%"></i></div><small class="slx-row-progress-label">${esc(progress.label)}${near?.near?` · ⚡ ${near.gap.toLocaleString()} left`:''}</small></div><div class="slx-row-actions"><button type="button" class="slx-fav" data-row-fav="${sym}" title="Favorite">${fav?'★':'☆'}</button><button type="button" data-row-target="${sym}" ${bool(K.targetLock,false)&&get(K.target).toUpperCase()!==sym?'disabled':''}>Target</button><button type="button" class="primary" data-row-buy="${sym}" ${m.nextGap?'':'disabled'}>Buy gap</button><button type="button" class="danger" data-row-sell="${sym}" ${m.freeShares?'':'disabled'}>Sell excess</button></div><div class="slx-row-quick"><select data-row-quick-amount="${sym}" title="Quick trade amount">${quickOptions}</select><button type="button" class="primary" data-row-quick-buy="${sym}">BUY</button><button type="button" class="danger" data-row-quick-sell="${sym}" ${m.owned?'':'disabled'}>SELL</button></div>`;
      const previousAmount=$('[data-row-quick-amount]',li)?.value;
      if(li.__slxRowMarkup!==markup){li.innerHTML=markup;li.__slxRowMarkup=markup;}
      if(row.nextElementSibling!==li)row.after(li);
      const amountSelect=$('[data-row-quick-amount]',li);
      if(previousAmount && amountSelect && [...amountSelect.options].some(o=>o.value===previousAmount)) amountSelect.value=previousAmount;
      const fb=$('[data-row-fav]',li); if(fb) fb.onclick=e=>{e.preventDefault();e.stopPropagation();toggleFavorite(sym);};
      $('[data-row-target]',li).onclick=e=>{e.preventDefault();e.stopPropagation();set(K.target,sym);refreshTargetSelect();refreshInlinePanel();enhanceStockRows();inlineStatus(`${sym} selected as target.`,'ok');};
      $('[data-row-buy]',li).onclick=e=>{e.preventDefault();e.stopPropagation();stockRowBuyGap(sym);};
      $('[data-row-sell]',li).onclick=e=>{e.preventDefault();e.stopPropagation();stockRowSellExcess(sym);};
      const qbuy=$('[data-row-quick-buy]',li); if(qbuy) qbuy.onclick=()=>stockRowQuickTrade(sym,'buy',$('[data-row-quick-amount]',li)?.value||'max');
      const qsell=$('[data-row-quick-sell]',li); if(qsell) qsell.onclick=()=>stockRowQuickTrade(sym,'sell',$('[data-row-quick-amount]',li)?.value||'max');
      li.dataset.target=get(K.target).toUpperCase()===sym?'1':'0';
      li.dataset.opportunity=opp?String(opp.rank):'';
    }
    applyStockView();
  }

  function loadActionLog() {
    try { const v=JSON.parse(get(K.actionLog,'[]')); return Array.isArray(v)?v:[]; } catch { return []; }
  }

  function addActionLog(entry) {
    const rows=loadActionLog();
    rows.unshift({time:Date.now(),...entry});
    set(K.actionLog,JSON.stringify(rows.slice(0,40)));
    addTransactionHistory(entry);
    renderActionLog();
  }

  function clearActionLog() {
    del(K.actionLog);
    renderActionLog();
    status('Action log cleared.','ok');
  }

  function renderActionLog() {
    const box=$('#slx-stock-action-log'); if(!box) return;
    const rows=loadActionLog();
    if(!rows.length){box.innerHTML='<div class="muted">No stock actions logged yet.</div>';return;}
    box.innerHTML=rows.slice(0,15).map(r=>{
      const when=new Date(Number(r.time)||Date.now()).toLocaleString();
      const verb=r.step==='buyShares'?'BUY':r.step==='sellShares'?'SELL':String(r.step||'ACTION').toUpperCase();
      const cls=r.status==='ok'?'good':r.status==='dry'?'warn':'bad';
      return `<div class="action-row"><span>${esc(when)}</span><b>${esc(verb)} ${esc(r.sym||'')}</b><span>${Number(r.shares||0).toLocaleString()} sh</span><span>${r.estimate?money(r.estimate):''}</span><span class="${cls}">${esc(r.message||r.status||'')}</span></div>`;
    }).join('');
  }

  function setTradeBusy(on, label='') {
    S.tradeBusy=!!on;
    const p=S.panel;
    if(p){p.dataset.trading=on?'1':'0';$$('button',p).forEach(b=>{if(!b.classList.contains('close')) b.disabled=!!on;});}
    const panic=$('#slx-stock-panic'); if(panic) panic.disabled=!!on;
    if(on && label) status(label,'warn');
  }

  function tradeCooldownRemaining() {
    return Math.max(0,1500-(Date.now()-Number(S.lastTradeAt||0)));
  }

  async function postTrade(sym, shares, step) {
    if(!bool(K.enabled,true)) throw new Error('Stock Manager is disabled.');
    const stock=S.stocks.get(sym);
    if(!stock?.id) throw new Error(`Stock ID missing for ${sym}. Sync API or open Stocks.`);
    shares=Math.floor(Number(shares)||0);
    if(shares<=0) throw new Error('Share amount is 0.');
    const estimate=shares*Number(stock.price||0);
    if(S.tradeBusy) throw new Error('Another stock transaction is already running.');
    const wait=tradeCooldownRemaining();
    if(wait>0) throw new Error(`Trade cooldown: wait ${Math.ceil(wait/1000)}s.`);
    const dry=isDryRun();
    if(dry){
      addActionLog({status:'dry',step,sym,shares,estimate,message:'DRY RUN · no order sent'});
      status(`DRY RUN: ${step==='buyShares'?'buy':'sell'} ${shares.toLocaleString()} ${sym} ≈ ${money(estimate)} · no order sent.`,'warn');
      return {success:true,dryRun:true};
    }
    const token=rfc();
    if(!token) throw new Error('Torn session token unavailable. Refresh the page and try again.');
    setTradeBusy(true,`${step==='buyShares'?'Buying':'Selling'} ${shares.toLocaleString()} ${sym}…`);
    try {
      const body=new URLSearchParams({stockId:String(stock.id),amount:String(shares)});
      const res=await fetch(`https://www.torn.com/page.php?sid=StockMarket&step=${encodeURIComponent(step)}&rfcv=${encodeURIComponent(token)}`, {
        method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'}, body, credentials:'include', cache:'no-store'
      });
      const text=await res.text();
      let data=null; try{data=JSON.parse(text);}catch{}
      if(!res.ok) throw new Error(`Torn returned HTTP ${res.status}.`);
      const serverMessage=String(data?.text||data?.message||data?.error?.error||data?.error||'').trim();
      if(!data || data?.success!==true){
        const snippet=String(text||'').replace(/\s+/g,' ').trim().slice(0,180);
        throw new Error(serverMessage||snippet||'Torn did not confirm the stock transaction.');
      }
      S.lastTradeAt=Date.now();
      addActionLog({status:'ok',step,sym,shares,estimate,message:serverMessage||'Accepted by Torn'});
      return data||{success:true,raw:text};
    } catch(e) {
      addActionLog({status:'error',step,sym,shares,estimate,message:e.message||'Trade failed'});
      throw e;
    } finally {
      setTradeBusy(false);
    }
  }

  async function vault({keep=0, panic=false, direct=false}={}) {
    const sym=get(K.target).toUpperCase();
    if(!sym) throw new Error('Choose a vault target first.');
    const stock=await ensureStock(sym);
    let cash=currentMoneyFromDom();
    if(!cash || panic || direct) {
      try { await apiSync(); cash=S.money||cash; } catch(e) { if(!cash) throw e; }
    }
    const available=Math.max(0,cash-(Number(keep)||0));
    const shares=Math.floor(available/stock.price);
    if(shares<=0) throw new Error(`Not enough cash after keeping ${money(keep)}.`);
    status(`${panic?'PANIC':'Vault'}: buying ${shares.toLocaleString()} ${sym}…`,'warn');
    await postTrade(sym,shares,'buyShares');
    status(`${panic?'PANIC complete':'Vaulted'}: ${shares.toLocaleString()} ${sym} ≈ ${money(shares*stock.price)}`,'ok');
    return shares;
  }

  async function withdrawCash(amount) {
    scanStocks();
    const sym=get(K.target).toUpperCase();
    const stock=S.stocks.get(sym);
    if(!stock?.price) throw new Error('Select a valid target stock.');
    const shares=Math.ceil((Number(amount)||0)/stock.price);
    if(shares<=0) throw new Error('Enter a withdrawal amount.');
    const owned=ownedShares(sym);
    if(bool(K.benefitLock,true)) {
      const now=benefitTier(sym,owned), after=benefitTier(sym,owned-shares);
      if(after.tier<now.tier) throw new Error(`Benefit Lock: selling ${shares.toLocaleString()} ${sym} would drop the current benefit tier.`);
    }
    await postTrade(sym,Math.min(shares,owned||shares),'sellShares');
    status(`Withdrawn ≈ ${money(amount)} from ${sym}`,'ok');
  }

  async function withdrawAll() {
    scanStocks();
    const sym=get(K.target).toUpperCase();
    const owned=ownedShares(sym);
    if(!owned) throw new Error(`No ${sym} shares detected.`);
    let sell=owned;
    if(bool(K.benefitLock,true)) sell=Math.max(0,owned-benefitTier(sym,owned).keep);
    if(sell<=0) throw new Error('Benefit Lock: all detected shares are protected.');
    if(!confirm(`Sell ${sell.toLocaleString()} ${sym} shares?`)) return;
    await postTrade(sym,sell,'sellShares');
    status(`Sold ${sell.toLocaleString()} ${sym}`,'ok');
  }


  /* SAKALUX_STOCK_ADVISOR_SUITE_V080 */
  function excludedStocksSetV080() {
    return new Set(String(get(K.excludedStocks,'')).toUpperCase().split(/[\s,;]+/).map(v=>v.trim()).filter(Boolean));
  }

  function captureBankRatesFromDomV080() {
    const saved=(()=>{try{return JSON.parse(get(K.bankRates,'{}')||'{}')}catch{return {}}})();
    const href=String(location.href||'').toLowerCase();
    if(!/bank|citybank/.test(href)) return saved;
    const text=String(document.body?.innerText||'').replace(/\u00a0/g,' ');
    const specs=[['1w',/1\s*week[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i],['2w',/2\s*weeks?[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i],['1m',/1\s*month[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i],['2m',/2\s*months?[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i],['3m',/3\s*months?[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i]];
    let changed=false;
    for(const [key,re] of specs){const m=text.match(re);if(m){const v=Number(m[1]);if(Number.isFinite(v)&&v>0&&v<100){if(Number(saved[key])!==v){saved[key]=v;changed=true;}}}}
    if(changed){saved.capturedAt=Date.now();set(K.bankRates,JSON.stringify(saved));}
    return saved;
  }

  function selectedBankRateV080() {
    const period=get(K.bankPeriod,'3m');
    const rates=captureBankRatesFromDomV080();
    const auto=Number(rates?.[period]);
    const manual=Math.max(0,Number(get(K.bankApr,'0'))||0);
    return {period,apr:Number.isFinite(auto)&&auto>0?auto:manual,source:Number.isFinite(auto)&&auto>0?'Torn Bank page':'Manual APR',capturedAt:Number(rates?.capturedAt)||0};
  }

  function stockIncomeSummaryV080() {
    scanStocks();
    const excluded=excludedStocksSetV080();
    let grossDaily=0, active=0;
    const rows=[];
    for(const [sym] of S.stocks) {
      if(excluded.has(sym)) continue;
      const owned=ownedShares(sym); if(!owned) continue;
      const tier=benefitTier(sym,owned); if(!tier.tier) continue;
      const baseDaily=Math.max(0,Number(benefitDailyValue(sym))||0); if(!baseDaily) continue;
      const multiplier=BENEFITS[sym]?.type==='A'?Math.max(1,tier.tier):1;
      const daily=baseDaily*multiplier;
      grossDaily+=daily; active++;
      rows.push({sym,tier:tier.tier,daily,annual:daily*365});
    }
    const costs=Math.max(0,parseAmount(get(K.dailyCosts,'0')));
    const netDaily=grossDaily-costs;
    return {grossDaily,costs,netDaily,monthly:netDaily*30,annual:netDaily*365,active,rows:rows.sort((a,b)=>b.daily-a.daily)};
  }

  function loadTechHistoryV080(){
    try{
      const raw=JSON.parse(get(K.techHistory,'{}')||'{}');
      if(!raw||typeof raw!=='object'||Array.isArray(raw)) return {};
      const now=Date.now(),cutoff=now-31*86400000,out={};
      for(const [sym,list] of Object.entries(raw)){
        if(!Array.isArray(list)) continue;
        const clean=list.map(p=>({t:Number(p?.t),p:Number(p?.p)})).filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.p)&&p.t>=cutoff&&p.t<=now+300000&&p.p>0).sort((a,b)=>a.t-b.t);
        const dedup=[]; for(const p of clean){const last=dedup[dedup.length-1];if(last&&last.t===p.t)last.p=p.p;else dedup.push(p);}
        if(dedup.length) out[String(sym).toUpperCase()]=dedup.slice(-1200);
      }
      return out;
    }catch{return {}}
  }
  function saveTechHistoryV080(x){
    try{set(K.techHistory,JSON.stringify(x));return true;}catch{}
    try{const slim={};for(const [sym,list] of Object.entries(x||{}))if(Array.isArray(list)&&list.length)slim[sym]=list.slice(-600);set(K.techHistory,JSON.stringify(slim));return true;}catch{return false;}
  }
  function recordTechnicalSnapshotV080(force=false){
    scanStocks();
    const now=Date.now(), cutoff=now-31*86400000, hist=loadTechHistoryV080();
    let changed=false;
    for(const [sym,st] of S.stocks){
      const price=Number(st?.price||0); if(!(price>0)) continue;
      let arr=Array.isArray(hist[sym])?hist[sym].filter(p=>Number(p?.t)>=cutoff&&Number(p?.p)>0):[];
      const last=arr[arr.length-1];
      if(force||!last||now-Number(last.t)>=300000){arr.push({t:now,p:price});changed=true;}
      if(arr.length>1200) arr=arr.slice(-1200);
      hist[sym]=arr;
    }
    if(changed) saveTechHistoryV080(hist);
    return hist;
  }

  function emaV080(values,period){if(!values.length)return null;const k=2/(period+1);let e=values[0];for(let i=1;i<values.length;i++)e=values[i]*k+e*(1-k);return e;}
  function emaSeriesV081(values,period){if(!values.length)return [];const k=2/(period+1),out=[];let e=values[0];for(let i=0;i<values.length;i++){if(i)e=values[i]*k+e*(1-k);out.push(e);}return out;}
  function rsiV080(values,period=14){if(values.length<period+1)return null;let gain=0,loss=0;for(let i=values.length-period;i<values.length;i++){const d=values[i]-values[i-1];if(d>=0)gain+=d;else loss-=d;}if(loss===0)return 100;const rs=(gain/period)/(loss/period);return 100-(100/(1+rs));}
  function bollingerV080(values,period=20){if(values.length<period)return null;const v=values.slice(-period),mean=v.reduce((a,b)=>a+b,0)/v.length,sd=Math.sqrt(v.reduce((a,b)=>a+Math.pow(b-mean,2),0)/v.length);return {mid:mean,upper:mean+2*sd,lower:mean-2*sd};}
  function bollingerSeriesV081(values,period=20){return values.map((_,i)=>{if(i+1<period)return null;const v=values.slice(i+1-period,i+1),mid=v.reduce((a,b)=>a+b,0)/v.length,sd=Math.sqrt(v.reduce((a,b)=>a+Math.pow(b-mid,2),0)/v.length);return {mid,upper:mid+2*sd,lower:mid-2*sd};});}
  function technicalChartV081(points){
    if(!points.length)return '<div class="slx-v080-empty">No local price history yet. Keep Stocks open periodically to build samples.</div>';
    const vals=points.map(x=>Number(x.p)).filter(x=>x>0);if(!vals.length)return '';
    const ema20=emaSeriesV081(vals,20),ema90=emaSeriesV081(vals,90),bbs=bollingerSeriesV081(vals,20),allVals=[...vals,...ema20,...ema90,...bbs.flatMap(b=>b?[b.lower,b.upper]:[])].filter(Number.isFinite);
    const lo=Math.min(...allVals),hi=Math.max(...allVals),span=Math.max(1e-9,hi-lo),w=360,h=132,pad=8;
    const xy=(v,i)=>`${(pad+(i/Math.max(1,vals.length-1))*(w-pad*2)).toFixed(1)},${(pad+(1-(v-lo)/span)*(h-pad*2)).toFixed(1)}`;
    const line=(arr,cls)=>{const chunks=[];let cur=[];arr.forEach((v,i)=>{if(Number.isFinite(v))cur.push(xy(v,i));else if(cur.length){chunks.push(cur);cur=[];}});if(cur.length)chunks.push(cur);return chunks.map(c=>`<polyline class="${cls}" points="${c.join(' ')}" fill="none" vector-effect="non-scaling-stroke"/>`).join('');};
    const upper=bbs.map(b=>b?.upper??null),lower=bbs.map(b=>b?.lower??null),mid=bbs.map(b=>b?.mid??null);
    return `<div class="slx-v081-chart-wrap"><svg class="slx-v080-chart slx-v081-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Technical price chart">${line(upper,'bb')}${line(lower,'bb')}${line(mid,'bb-mid')}${line(ema90,'ema90')}${line(ema20,'ema20')}${line(vals,'price')}</svg><div class="slx-v081-legend"><span class="price">Price</span><span class="ema20">EMA20</span><span class="ema90">EMA90</span><span class="bb">Bollinger</span></div><div class="slx-v080-range"><span>${money(lo)}</span><span>${money(hi)}</span></div></div>`;
  }
  function technicalSignalV081({price,rsi,ema20,ema90,bb,momentumPct,samples}){
    let score=0;const reasons=[];
    if(samples>=90&&Number.isFinite(ema20)&&Number.isFinite(ema90)){if(ema20>ema90){score+=2;reasons.push('EMA20 above EMA90');}else if(ema20<ema90){score-=2;reasons.push('EMA20 below EMA90');}}
    else if(samples>=20) reasons.push('EMA90 warming up');
    if(Number.isFinite(rsi)){if(rsi<=30){score+=2;reasons.push('RSI oversold');}else if(rsi>=70){score-=2;reasons.push('RSI overbought');}else if(rsi>=52&&rsi<=65){score+=1;reasons.push('RSI constructive');}else if(rsi>=35&&rsi<=48){score-=1;reasons.push('RSI weak');}}
    if(bb&&price){if(price<bb.lower){score+=1;reasons.push('below lower Bollinger');}else if(price>bb.upper){score-=1;reasons.push('above upper Bollinger');}else if(price>bb.mid){score+=0.5;reasons.push('above Bollinger mid');}else{score-=0.5;reasons.push('below Bollinger mid');}}
    if(Number.isFinite(momentumPct)){if(momentumPct>1){score+=1;reasons.push('positive window momentum');}else if(momentumPct<-1){score-=1;reasons.push('negative window momentum');}}
    const limited=samples<20;
    let label='NEUTRAL',cls='neutral';
    if(score>=3){label='BUY BIAS';cls='buy';}else if(score<=-3){label='SELL BIAS';cls='sell';}else if(score>=1){label='WATCH BUY';cls='watch';}else if(score<=-1){label='WATCH SELL';cls='watch';}
    if(limited){label='COLLECTING DATA';cls='neutral';}
    return {score,label,cls,reasons,limited};
  }
  function technicalStatsV080(sym,windowKey){
    const hist=recordTechnicalSnapshotV080(false),all=Array.isArray(hist[sym])?hist[sym]:[];
    const now=Date.now(),safeWindow=['24h','1w','1m'].includes(windowKey)?windowKey:'24h',ms={'24h':86400000,'1w':604800000,'1m':2592000000}[safeWindow];
    const points=all.filter(x=>now-Number(x.t)<=ms),values=points.map(x=>Number(x.p)).filter(x=>x>0);
    const price=Number(S.stocks.get(sym)?.price||values[values.length-1]||0),rsi=rsiV080(values,14),ema20=values.length?emaV080(values,20):null,ema90=values.length?emaV080(values,90):null,bb=bollingerV080(values,20);
    const first=values[0]||0,momentumPct=first>0&&price>0?((price-first)/first)*100:null;
    const coverageMs=points.length>1?Number(points[points.length-1].t)-Number(points[0].t):0;
    const signal=technicalSignalV081({price,rsi,ema20,ema90,bb,momentumPct,samples:values.length});
    return {points,allCount:all.length,price,rsi,ema20,ema90,bb,momentumPct,coverageMs,signal,windowKey:safeWindow};
  }

  function ensureAdvisorSuiteHostV080(){
    const p=S.panel?.isConnected?S.panel:document.querySelector('#slx-stock-panel,[data-slx-stock-panel]'); if(!p)return null;
    let host=p.querySelector('#slx-stock-advisor-suite-v080'); if(host)return host;
    host=document.createElement('div'); host.id='slx-stock-advisor-suite-v080';
    host.innerHTML=`
      <div class="section slx-v080-section"><div class="title">💰 Financial Advisor</div>
        <div class="slx-v080-controls"><label>Daily costs<input id="slx-v080-daily-costs" placeholder="e.g. 2m"></label><label>Bank period<select id="slx-v080-bank-period"><option value="1w">1 week</option><option value="2w">2 weeks</option><option value="1m">1 month</option><option value="2m">2 months</option><option value="3m">3 months</option></select></label></div>
        <label class="slx-v080-wide">Excluded stocks<input id="slx-v080-excluded" placeholder="e.g. TCI,WLT"></label>
        <div id="slx-v080-financial"></div>
      </div>
      <div class="section slx-v080-section"><div class="title">📈 Technical Trade Assistant</div>
        <div class="slx-v080-controls"><label>Stock<select id="slx-v080-tech-symbol"></select></label><label>Window<select id="slx-v080-tech-window"><option value="24h">24H</option><option value="1w">1W</option><option value="1m">1M</option></select></label></div>
        <button type="button" id="slx-v080-analyze">ANALYZE NOW</button><div id="slx-v080-technical"></div>
      </div>
      <div class="section slx-v080-section"><div class="title">🧮 Portfolio Simulator</div>
        <div class="slx-v080-controls"><label>Sell from<select id="slx-v080-sim-from"></select></label><label>Buy into<select id="slx-v080-sim-to"></select></label></div>
        <label class="slx-v080-wide">Amount to reallocate<input id="slx-v080-sim-amount" placeholder="e.g. 10m"></label>
        <div id="slx-v080-simulator"></div><div class="api-help">Preview only — the simulator never sends a trade.</div>
      </div>`;
    const opt=p.querySelector('#slx-stock-optimizer-body')?.closest('.section');
    if(opt?.parentNode) opt.parentNode.insertBefore(host,opt); else (p.querySelector('.body')||p).appendChild(host);
    return host;
  }

  function renderFinancialAdvisorV080(){
    const host=ensureAdvisorSuiteHostV080(),box=host?.querySelector('#slx-v080-financial'); if(!box)return;
    const x=stockIncomeSummaryV080(), bank=selectedBankRateV080(), days=({'1w':7,'2w':14,'1m':30,'2m':60,'3m':90}[bank.period]||90), market=buildPortfolioRows().reduce((n,r)=>n+(Number(r.value)||0),0),bankReturn=market>0&&bank.apr>0?market*(bank.apr/100)*(days/365):0;
    const candidates=buildRoiCandidates().filter(r=>!excludedStocksSetV080().has(r.sym)).slice().sort((a,b)=>(Number(b.roi)||0)-(Number(a.roi)||0));
    const best=candidates[0]||null,affordable=candidates.find(r=>r.affordable)||null;
    const card=(label,r)=>`<div class="slx-v080-pick"><span>${label}</span><b>${r?`${r.sym} · ${(Number(r.roi)||0).toFixed(2)}% APR`:'—'}</b><small>${r?`Tier ${r.tier} · gap ${money(Number(r.cost)||0)} · ${Number.isFinite(Number(r.paybackDays))?Math.round(Number(r.paybackDays))+'d payback':'n/a'}`:'No candidate'}</small></div>`;
    box.innerHTML=`<div class="slx-v080-summary"><div><span>Income / day</span><b>${money(x.grossDaily)}</b></div><div><span>Costs / day</span><b>${money(x.costs)}</b></div><div><span>Net / day</span><b class="${x.netDaily>=0?'good':'bad'}">${x.netDaily>=0?'+':'-'}${money(Math.abs(x.netDaily))}</b></div><div><span>Net / month</span><b>${x.monthly>=0?'+':'-'}${money(Math.abs(x.monthly))}</b></div></div><div class="slx-v080-picks">${card('BEST ROI',best)}${card('BEST AFFORDABLE',affordable)}</div><div class="api-help">Bank ${bank.period}: ${bank.apr?bank.apr.toFixed(2)+'% APR':'not configured'} · ${bank.source}${bank.apr?` · est. ${money(bankReturn)} over selected period`:''}</div>${x.rows.length?`<div class="slx-v080-list">${x.rows.slice(0,12).map(r=>`<div><b>${r.sym}</b><span>Tier ${r.tier}</span><span>${money(r.daily)}/day</span><span>${money(r.annual)}/yr</span></div>`).join('')}</div>`:'<div class="slx-v080-empty">No valued active stock benefits detected.</div>'}`;
  }

  function renderTechnicalAdvisorV080(){
    const host=ensureAdvisorSuiteHostV080();if(!host)return;
    const select=host.querySelector('#slx-v080-tech-symbol'),win=host.querySelector('#slx-v080-tech-window'),box=host.querySelector('#slx-v080-technical');
    const syms=[...S.stocks.keys()].sort();if(!syms.length){box.innerHTML='<div class="slx-v080-empty">No stock prices detected yet.</div>';return;}
    const wanted=get(K.techSymbol,syms[0]);if(select.options.length!==syms.length||![...select.options].every((o,i)=>o.value===syms[i]))select.innerHTML=syms.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
    select.value=syms.includes(wanted)?wanted:syms[0];if(select.value!==wanted)set(K.techSymbol,select.value);
    const wantedWindow=get(K.techWindow,'24h');win.value=['24h','1w','1m'].includes(wantedWindow)?wantedWindow:'24h';if(win.value!==wantedWindow)set(K.techWindow,win.value);
    const st=technicalStatsV080(select.value,win.value),fmt=x=>x==null?'—':Number(x).toLocaleString(undefined,{maximumFractionDigits:2}),pct=x=>x==null?'—':`${x>=0?'+':''}${Number(x).toFixed(2)}%`,hours=st.coverageMs/3600000;
    const sig=st.signal,reason=sig.reasons.length?sig.reasons.map(esc).join(' · '):'Waiting for enough local samples';
    box.innerHTML=`<div class="slx-v080-summary slx-v081-summary"><div><span>Price</span><b>${money(st.price)}</b></div><div><span>Window momentum</span><b class="${Number(st.momentumPct)>=0?'good':'bad'}">${pct(st.momentumPct)}</b></div><div><span>RSI 14</span><b>${fmt(st.rsi)}</b></div><div><span>EMA 20 / 90</span><b>${st.ema20==null?'—':money(st.ema20)} / ${st.ema90==null?'—':money(st.ema90)}</b></div></div>${technicalChartV081(st.points)}<div class="slx-v081-signal ${sig.cls}"><div><span>Technical signal</span><b>${esc(sig.label)}</b></div><strong>${sig.limited?'Needs more samples':`Score ${sig.score>=0?'+':''}${sig.score.toFixed(1)}`}</strong><small>${reason}</small></div><div class="slx-v081-metrics"><span>Bollinger lower <b>${st.bb?money(st.bb.lower):'—'}</b></span><span>Mid <b>${st.bb?money(st.bb.mid):'—'}</b></span><span>Upper <b>${st.bb?money(st.bb.upper):'—'}</b></span></div><div class="api-help">${st.points.length} samples in selected ${String(st.windowKey).toUpperCase()} window · local coverage ${hours>=24?(hours/24).toFixed(1)+'d':hours.toFixed(1)+'h'} · samples are collected locally while the script is active. Signals are technical indicators, not automatic trades.</div>`;
  }

  function portfolioValueV082(){let total=0;for(const [sym] of S.stocks){const m=stockRowMetrics(sym);if(m&&m.price>0)total+=Math.max(0,Number(m.owned)||ownedShares(sym))*m.price;}return total;}
  function annualBenefitValueV082(sym){const p=BENEFITS?.[sym]||{};const direct=Number(p.annualValue||p.yearlyValue||p.valueYear||0);if(direct>0)return direct;const weekly=Number(p.weeklyValue||p.valueWeek||0);if(weekly>0)return weekly*52;const monthly=Number(p.monthlyValue||p.valueMonth||0);return monthly>0?monthly*12:0;}
  function positionBenefitYieldV082(sym,owned,price){if(!(price>0&&owned>0))return 0;const tier=benefitTier(sym,owned),keep=Math.max(0,Number(tier.keep)||0),annual=annualBenefitValueV082(sym);return keep>0&&annual>0&&owned>=keep?annual/(keep*price):0;}
  function technicalBiasV082(sym){try{const x=Number(technicalStatsV080(sym,'1w')?.signal?.score);return Number.isFinite(x)?x:0;}catch{return 0;}}
  function renderPortfolioSimulatorV080(){
    const host=ensureAdvisorSuiteHostV080();if(!host)return;
    const fromSel=host.querySelector('#slx-v080-sim-from'),toSel=host.querySelector('#slx-v080-sim-to'),amountEl=host.querySelector('#slx-v080-sim-amount'),box=host.querySelector('#slx-v080-simulator');
    const syms=[...S.stocks.keys()].sort();if(!syms.length){box.innerHTML='<div class=\"slx-v080-empty\">No stocks detected.</div>';return;}
    const fill=el=>{if(el.options.length!==syms.length||![...el.options].every((o,i)=>o.value===syms[i]))el.innerHTML=syms.map(x=>`<option value=\"${esc(x)}\">${esc(x)}</option>`).join('');};fill(fromSel);fill(toSel);
    const f=get(K.simFrom,syms[0]),t=get(K.simTo,syms.find(x=>x!==f)||syms[0]);fromSel.value=syms.includes(f)?f:syms[0];toSel.value=syms.includes(t)?t:(syms.find(x=>x!==fromSel.value)||fromSel.value);amountEl.value=get(K.simAmount,'10m');
    const from=stockRowMetrics(fromSel.value),to=stockRowMetrics(toSel.value),requested=Math.max(0,parseAmount(amountEl.value));
    if(!from||!to||!(from.price>0)||!(to.price>0)){box.innerHTML='<div class=\"slx-v080-empty\">Waiting for live stock metrics.</div>';return;}if(fromSel.value===toSel.value){box.innerHTML='<div class=\"slx-v080-empty\">Choose two different stocks.</div>';return;}
    const sellable=Math.max(0,Math.floor(Number(from.freeShares)||0)),maxSafeValue=sellable*from.price,amount=Math.min(requested,maxSafeValue),sellShares=Math.min(sellable,Math.floor(amount/from.price)),proceeds=sellShares*from.price,buyShares=Math.floor(proceeds/to.price),buyCost=buyShares*to.price,unused=Math.max(0,proceeds-buyCost);
    const fromOwned=Math.max(0,Number(from.owned)||ownedShares(fromSel.value)),toOwned=Math.max(0,Number(to.owned)||ownedShares(toSel.value)),fromAfter=Math.max(0,fromOwned-sellShares),toAfter=toOwned+buyShares;
    const beforeTier=benefitTier(toSel.value,toOwned),afterTier=benefitTier(toSel.value,toAfter),beforeGap=Math.max(0,(Number(beforeTier.next)||0)-toOwned),afterGap=Math.max(0,(Number(afterTier.next)||0)-toAfter);
    const beforePortfolio=portfolioValueV082(),afterPortfolio=Math.max(0,beforePortfolio-proceeds+buyCost+unused),portfolioDelta=afterPortfolio-beforePortfolio;
    const fy=positionBenefitYieldV082(fromSel.value,fromOwned,from.price),ty0=positionBenefitYieldV082(toSel.value,toOwned,to.price),ty1=positionBenefitYieldV082(toSel.value,toAfter,to.price),annualBefore=fy*(fromOwned*from.price)+ty0*(toOwned*to.price),annualAfter=positionBenefitYieldV082(fromSel.value,fromAfter,from.price)*(fromAfter*from.price)+ty1*(toAfter*to.price),annualDelta=annualAfter-annualBefore;
    const tf=technicalBiasV082(fromSel.value),tt=technicalBiasV082(toSel.value),td=tt-tf,moved=beforePortfolio>0?proceeds/beforePortfolio*100:0,coverage=requested>0?proceeds/requested*100:0;
    const score=(annualDelta>0?2:annualDelta<0?-2:0)+(td>1?1:td<-1?-1:0)+(afterTier.tier>beforeTier.tier?1:0);let verdict='NEUTRAL',cls='neutral';if(score>=3){verdict='STRONGER AFTER';cls='buy';}else if(score>=1){verdict='IMPROVED';cls='watch';}else if(score<=-2){verdict='WEAKER AFTER';cls='sell';}
    const yp=x=>x>0?`${(x*100).toFixed(2)}%`:'—',reasons=[];if(annualDelta)reasons.push(`annual benefit ${annualDelta>=0?'+':''}${money(annualDelta)}`);if(td)reasons.push(`technical delta ${td>=0?'+':''}${td.toFixed(1)}`);if(afterTier.tier!==beforeTier.tier)reasons.push(`target tier ${beforeTier.tier} → ${afterTier.tier}`);if(coverage<99&&requested>0)reasons.push(`safe coverage ${coverage.toFixed(1)}%`);
    box.innerHTML=`<div class=\"slx-v082-verdict ${cls}\"><div><span>What-if result</span><b>${verdict}</b></div><strong>${money(proceeds)} reallocated</strong><small>${reasons.length?reasons.map(esc).join(' · '):'No measurable advantage from current local data.'}</small></div><div class=\"slx-v082-before-after\"><div><span>BEFORE</span><b>${esc(fromSel.value)} ${fromOwned.toLocaleString()} sh</b><small>Benefit yield ${yp(fy)} · Tech ${tf>=0?'+':''}${tf.toFixed(1)}</small></div><div><span>AFTER</span><b>${esc(toSel.value)} ${toAfter.toLocaleString()} sh</b><small>Benefit yield ${yp(ty1)} · Tech ${tt>=0?'+':''}${tt.toFixed(1)}</small></div></div><div class=\"slx-v080-sim-grid slx-v082-grid\"><div><span>SELL</span><b>${sellShares.toLocaleString()} ${esc(fromSel.value)}</b><small>${money(proceeds)} · safe max ${money(maxSafeValue)}</small></div><div><span>BUY</span><b>${buyShares.toLocaleString()} ${esc(toSel.value)}</b><small>${money(buyCost)} · unused ${money(unused)}</small></div><div><span>Target tier</span><b>${beforeTier.tier} → ${afterTier.tier}</b><small>Next gap ${beforeGap.toLocaleString()} → ${afterGap.toLocaleString()}</small></div><div><span>Portfolio moved</span><b>${moved.toFixed(2)}%</b><small>Requested coverage ${coverage.toFixed(1)}% · Benefit Lock respected</small></div><div><span>Est. annual benefit</span><b class=\"${annualDelta>=0?'good':'bad'}\">${annualDelta>=0?'+':''}${money(annualDelta)}</b><small>Uses available benefit metadata</small></div><div><span>Value after simulation</span><b>${money(afterPortfolio)}</b><small>Rounding delta ${portfolioDelta>=0?'+':''}${money(portfolioDelta)}</small></div></div><div class=\"api-help\">Preview only — no trade is submitted. Uses current detected prices, protected/free shares, benefit tiers and locally collected technical history.</div>`;
  }

  /* SAKALUX_STOCK_SMART_REBALANCE_V083 */
  /* SAKALUX_STOCK_REBALANCE_PROFILES_V084 */
  const REBALANCE_PROFILE_KEY_V084='slx_stock_rebalance_profile_v084';
  const REBALANCE_PROFILES_V084={
    safe:{id:'safe',label:'SAFE',maxPortfolioPct:.10,minScoreGap:.75,maxMoves:2,techWeight:.75,benefitWeight:.65,tierWeight:.55,affordWeight:.15},
    balanced:{id:'balanced',label:'BALANCED',maxPortfolioPct:.20,minScoreGap:.35,maxMoves:4,techWeight:1.00,benefitWeight:1.00,tierWeight:.35,affordWeight:.25},
    aggressive:{id:'aggressive',label:'AGGRESSIVE',maxPortfolioPct:.35,minScoreGap:.15,maxMoves:6,techWeight:1.20,benefitWeight:1.25,tierWeight:.20,affordWeight:.35}
  };
  function rebalanceProfileV084(){const id=String(get(REBALANCE_PROFILE_KEY_V084,'balanced')||'balanced').toLowerCase();return REBALANCE_PROFILES_V084[id]||REBALANCE_PROFILES_V084.balanced;}
  function smartRebalanceScoreV083(sym,metrics,profile=rebalanceProfileV084()){
    if(!metrics||!(metrics.price>0))return -999;
    const owned=Math.max(0,Number(metrics.owned)||ownedShares(sym));
    const tech=technicalBiasV082(sym);
    const y=positionBenefitYieldV082(sym,owned,metrics.price);
    const tier=benefitTier(sym,owned);
    const nextGap=Math.max(0,(Number(tier.next)||0)-owned);
    const nextCost=nextGap*metrics.price;
    const affordability=nextGap>0&&nextCost>0?Math.max(-1,1-Math.min(1,nextCost/Math.max(1,portfolioValueV082()))):0;
    return tech*profile.techWeight+(y*100)*profile.benefitWeight+(tier.tier>0?profile.tierWeight:0)+affordability*profile.affordWeight;
  }

  function buildSmartRebalancePlanV083(){
    const profile=rebalanceProfileV084(),rows=[];
    for(const [sym] of S.stocks){
      const m=stockRowMetrics(sym); if(!m||!(m.price>0))continue;
      const owned=Math.max(0,Number(m.owned)||ownedShares(sym));
      const free=Math.max(0,Math.floor(Number(m.freeShares)||0));
      const value=owned*m.price,freeValue=free*m.price;
      const tier=benefitTier(sym,owned);
      rows.push({sym,m,owned,free,value,freeValue,tier,tech:technicalBiasV082(sym),yield:positionBenefitYieldV082(sym,owned,m.price),score:smartRebalanceScoreV083(sym,m,profile)});
    }
    if(rows.length<2)return {moves:[],rows,total:portfolioValueV082(),profile,reason:'Need at least two detected stocks.'};
    const sources=rows.filter(r=>r.free>0&&r.freeValue>0).sort((a,b)=>(a.score-b.score)||(b.freeValue-a.freeValue));
    const targets=[...rows].sort((a,b)=>(b.score-a.score)||(b.yield-a.yield)||(b.tech-a.tech));
    const total=portfolioValueV082(); const maxMove=Math.max(1_000_000,total*profile.maxPortfolioPct);
    const usedSource=new Map(),moves=[];
    for(const src of sources){
      if(moves.length>=profile.maxMoves)break;
      const tgt=targets.find(t=>t.sym!==src.sym && t.score>src.score+profile.minScoreGap);
      if(!tgt)continue;
      const remainingShares=Math.max(0,src.free-(usedSource.get(src.sym)||0)); if(!remainingShares)continue;
      const available=remainingShares*src.m.price;
      const amount=Math.min(available,maxMove);
      const sellShares=Math.max(0,Math.min(remainingShares,Math.floor(amount/src.m.price)));
      const proceeds=sellShares*src.m.price; if(!(proceeds>0))continue;
      const buyShares=Math.floor(proceeds/tgt.m.price); if(!(buyShares>0))continue;
      const buyCost=buyShares*tgt.m.price,unused=Math.max(0,proceeds-buyCost);
      const srcAfter=Math.max(0,src.owned-sellShares),tgtAfter=tgt.owned+buyShares;
      const srcYieldAfter=positionBenefitYieldV082(src.sym,srcAfter,src.m.price),tgtYieldAfter=positionBenefitYieldV082(tgt.sym,tgtAfter,tgt.m.price);
      const annualBefore=src.yield*(src.owned*src.m.price)+tgt.yield*(tgt.owned*tgt.m.price);
      const annualAfter=srcYieldAfter*(srcAfter*src.m.price)+tgtYieldAfter*(tgtAfter*tgt.m.price);
      const beforeTier=tgt.tier,afterTier=benefitTier(tgt.sym,tgtAfter);
      moves.push({from:src.sym,to:tgt.sym,sellShares,buyShares,proceeds,buyCost,unused,scoreDelta:tgt.score-src.score,techDelta:tgt.tech-src.tech,annualDelta:annualAfter-annualBefore,tierBefore:beforeTier.tier,tierAfter:afterTier.tier});
      usedSource.set(src.sym,(usedSource.get(src.sym)||0)+sellShares);
    }
    return {moves,rows,total,profile,reason:moves.length?'':`No move cleared the ${profile.label} threshold.`};
  }

  function renderSmartRebalanceV083(){
    const host=ensureAdvisorSuiteHostV080(); if(!host)return;
    let sec=host.querySelector('#slx-smart-rebalance-v083');
    if(!sec){
      sec=document.createElement('section'); sec.id='slx-smart-rebalance-v083'; sec.className='slx-v083-rebalance';
      sec.innerHTML=`<div class="slx-v083-head"><div><span>SMART REBALANCE</span><b>Portfolio plan</b></div><button type="button" id="slx-v083-refresh">RECALCULATE</button></div><div class="slx-v084-profiles"><button data-profile="safe">SAFE</button><button data-profile="balanced">BALANCED</button><button data-profile="aggressive">AGGRESSIVE</button></div><div id="slx-v084-profile-help"></div><div id="slx-v083-summary"></div><div id="slx-v083-moves"></div><div class="api-help">Decision support only — the plan never submits trades. Protected/Benefit Lock shares remain excluded because only detected free shares are used as sell sources.</div>`;
      host.appendChild(sec);
      sec.querySelector('#slx-v083-refresh').onclick=()=>{recordTechnicalSnapshotV080(true);renderSmartRebalanceV083();};
      sec.querySelectorAll('[data-profile]').forEach(btn=>btn.onclick=()=>{set(REBALANCE_PROFILE_KEY_V084,btn.dataset.profile);renderSmartRebalanceV083();});
    }
    const plan=buildSmartRebalancePlanV083(),profile=plan.profile,sum=sec.querySelector('#slx-v083-summary'),box=sec.querySelector('#slx-v083-moves'),help=sec.querySelector('#slx-v084-profile-help');
    sec.querySelectorAll('[data-profile]').forEach(btn=>btn.classList.toggle('active',btn.dataset.profile===profile.id));
    const descriptions={safe:'Lower turnover · max 10% per move · stronger score gap · up to 2 moves',balanced:'Default mix · max 20% per move · medium score gap · up to 4 moves',aggressive:'Higher turnover · max 35% per move · lower score gap · up to 6 moves'};
    help.innerHTML=`<span>${profile.label}</span> ${descriptions[profile.id]}`;
    const moved=plan.moves.reduce((a,x)=>a+x.proceeds,0),annual=plan.moves.reduce((a,x)=>a+x.annualDelta,0),tech=plan.moves.length?plan.moves.reduce((a,x)=>a+x.techDelta,0)/plan.moves.length:0;
    sum.innerHTML=`<div class="slx-v083-summary-grid"><div><span>Profile</span><b>${profile.label}</b></div><div><span>Portfolio</span><b>${money(plan.total)}</b></div><div><span>Suggested moves</span><b>${plan.moves.length}</b></div><div><span>Capital moved</span><b>${money(moved)}</b></div><div><span>Avg tech delta</span><b>${tech>=0?'+':''}${tech.toFixed(1)}</b></div><div><span>Est. annual benefit delta</span><b class="${annual>=0?'good':'bad'}">${annual>=0?'+':''}${money(annual)}</b></div></div>`;
    if(!plan.moves.length){box.innerHTML=`<div class="slx-v080-empty">${esc(plan.reason)}</div>`;return;}
    box.innerHTML=plan.moves.map((x,i)=>`<div class="slx-v083-move"><div class="slx-v083-step">${i+1}</div><div class="slx-v083-route"><b>${esc(x.from)} → ${esc(x.to)}</b><small>SELL ${x.sellShares.toLocaleString()} · BUY ${x.buyShares.toLocaleString()} · ${money(x.proceeds)}</small></div><div class="slx-v083-metrics"><span>Score ${x.scoreDelta>=0?'+':''}${x.scoreDelta.toFixed(2)}</span><span>Tech ${x.techDelta>=0?'+':''}${x.techDelta.toFixed(1)}</span><span>Benefit ${x.annualDelta>=0?'+':''}${money(x.annualDelta)}/yr</span><span>Tier ${x.tierBefore} → ${x.tierAfter}</span></div><small class="slx-v083-unused">Unused after rounding: ${money(x.unused)}</small></div>`).join('');
  }

  function bindAdvisorSuiteControlsV080(){
    const host=ensureAdvisorSuiteHostV080(); if(!host||host.dataset.bound==='1')return; host.dataset.bound='1';
    const costs=host.querySelector('#slx-v080-daily-costs'),excluded=host.querySelector('#slx-v080-excluded'),period=host.querySelector('#slx-v080-bank-period'),sym=host.querySelector('#slx-v080-tech-symbol'),win=host.querySelector('#slx-v080-tech-window'),analyze=host.querySelector('#slx-v080-analyze'),from=host.querySelector('#slx-v080-sim-from'),to=host.querySelector('#slx-v080-sim-to'),amount=host.querySelector('#slx-v080-sim-amount');
    costs.value=get(K.dailyCosts,'0'); excluded.value=get(K.excludedStocks,''); period.value=get(K.bankPeriod,'3m');
    const defer=(key,fn)=>window.SakaLuXPerf?.debounce?window.SakaLuXPerf.debounce('stocks-v0801-'+key,fn,260):setTimeout(fn,260);
    const saveCosts=()=>{set(K.dailyCosts,costs.value);defer('costs',renderFinancialAdvisorV080);}; costs.oninput=saveCosts; costs.onchange=saveCosts;
    const saveExcluded=()=>{excluded.value=excluded.value.toUpperCase();set(K.excludedStocks,excluded.value);defer('excluded',()=>{renderAdvisor();renderOptimizer();renderFinancialAdvisorV080();});}; excluded.oninput=saveExcluded; excluded.onchange=saveExcluded;
    period.onchange=()=>{set(K.bankPeriod,period.value);renderFinancialAdvisorV080();};
    sym.onchange=()=>{set(K.techSymbol,sym.value);renderTechnicalAdvisorV080();}; win.onchange=()=>{set(K.techWindow,win.value);renderTechnicalAdvisorV080();}; analyze.onclick=()=>{recordTechnicalSnapshotV080(true);renderTechnicalAdvisorV080();};
    const sim=()=>{if(from.value===to.value){const alt=[...to.options].map(o=>o.value).find(v=>v!==from.value);if(alt)to.value=alt;}set(K.simFrom,from.value);set(K.simTo,to.value);set(K.simAmount,amount.value);defer('sim',renderPortfolioSimulatorV080);}; from.onchange=sim;to.onchange=sim;amount.oninput=sim;amount.onchange=sim;
  }

  function renderAdvisorSuiteV080(){
    try{recordTechnicalSnapshotV080(false);}catch(e){console.warn('[SakaLuX Stocks] technical snapshot skipped',e);}
    try{captureBankRatesFromDomV080();}catch(e){console.warn('[SakaLuX Stocks] bank capture skipped',e);}
    if(!ensureAdvisorSuiteHostV080()) return;
    try{bindAdvisorSuiteControlsV080();}catch(e){console.warn('[SakaLuX Stocks] controls bind skipped',e);}
    for(const [name,fn] of [['Financial',renderFinancialAdvisorV080],['Technical',renderTechnicalAdvisorV080],['Simulator',renderPortfolioSimulatorV080],['SmartRebalance',renderSmartRebalanceV083]]){try{fn();}catch(e){console.warn('[SakaLuX Stocks] '+name+' render skipped',e);}}
  }

  function buildOptimizerRows() {
    scanStocks();
    const minApr=Math.max(0,Number(get(K.optimizerMinApr,'0'))||0);
    const bankApr=Math.max(0,Number(get(K.bankApr,'0'))||0);
    const rows=[];
    const excludedV080=excludedStocksSetV080();
    for(const [sym,st] of S.stocks) {
      if(excludedV080.has(sym)) continue;
      const owned=ownedShares(sym);
      if(!owned || !st?.price) continue;
      const tier=benefitTier(sym,owned);
      const protectedShares=bool(K.benefitLock,true)?tier.keep:0;
      const freeShares=Math.max(0,owned-protectedShares);
      const protectedValue=protectedShares*st.price;
      const freeValue=freeShares*st.price;
      const daily=benefitDailyValue(sym);
      const currentApr=protectedValue>0&&daily>0?(daily*365/protectedValue)*100:0;
      const next=tier.next||0;
      const nextGap=next>owned?next-owned:0;
      const nextCost=nextGap*st.price;
      let signal='hold';
      if(freeShares>0) signal='excess';
      if(currentApr>0 && currentApr<Math.max(minApr,bankApr)) signal='weak';
      rows.push({sym,owned,price:Number(st.price)||0,tier:tier.tier,protectedShares,freeShares,protectedValue,freeValue,currentApr,nextGap,nextCost,signal,bankApr,minApr});
    }
    return rows.sort((a,b)=>({weak:0,excess:1,hold:2}[a.signal]-{weak:0,excess:1,hold:2}[b.signal]) || b.freeValue-a.freeValue || b.currentApr-a.currentApr);
  }

  function safeRender(name, fn) {
    try { fn(); return true; }
    catch(e) {
      console.error(`[${APP.name}] ${name} render failed`, e);
      status(`${name} render error: ${e.message}`,'bad');
      return false;
    }
  }

  function buildRebalancePreview() {
    const held=buildOptimizerRows();
    const candidates=buildRoiCandidates().filter(r=>Number.isFinite(Number(r.cost))&&Number(r.cost)>0&&Number.isFinite(Number(r.sharesNeeded))&&Number(r.sharesNeeded)>0);
    const reserve=Math.max(0,parseAmount(get(K.rebalanceReserve,'0')));
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    const sellNetFactor=0.999; // Torn takes a 0.1% stock selling fee.
    const validSource=r=>Number.isFinite(Number(r?.price))&&Number(r.price)>0&&Number.isFinite(Number(r?.freeShares))&&Number(r.freeShares)>0&&Number.isFinite(Number(r?.freeValue))&&Number(r.freeValue)>0;
    const freeRows=held.filter(validSource).sort((a,b)=>Number(b.freeValue)-Number(a.freeValue));
    const weakRows=held.filter(r=>r.signal==='weak'&&validSource(r)).sort((a,b)=>Number(a.currentApr||0)-Number(b.currentApr||0));
    const allSources=[...freeRows,...weakRows.filter(w=>!freeRows.some(f=>f.sym===w.sym))];
    const netSourceValue=r=>Math.max(0,Math.floor(Number(r.freeShares)||0))*Math.max(0,Number(r.price)||0)*sellNetFactor;
    const deployableFor=target=>Math.max(0,cash+allSources.filter(r=>String(r.sym)!==String(target?.sym)).reduce((n,r)=>n+netSourceValue(r),0)-reserve);
    const target=candidates.find(r=>Number(r.cost)<=deployableFor(r)) || candidates[0] || null;
    if(!target) return {cash,reserve,sourceCapital:0,deployable:Math.max(0,cash-reserve),sources:[],target:null,sells:[],shortfall:0};
    // Never sell the same stock that this rebalance is trying to buy.
    const sources=allSources.filter(r=>String(r.sym)!==String(target.sym));
    const sourceCapital=sources.reduce((n,r)=>n+netSourceValue(r),0);
    const deployable=Math.max(0,cash+sourceCapital-reserve);
    const required=Math.max(0,Number(target.cost)-cash+reserve);
    let need=required;
    const sells=[];
    for(const r of sources) {
      if(need<=0) break;
      const price=Number(r.price), freeShares=Math.floor(Number(r.freeShares));
      if(!Number.isFinite(price)||price<=0||!Number.isFinite(freeShares)||freeShares<=0) continue;
      const perShareNet=price*sellNetFactor;
      const shares=Math.min(freeShares,Math.ceil(need/perShareNet));
      if(!Number.isFinite(shares)||shares<=0) continue;
      const gross=shares*price;
      const proceeds=gross*sellNetFactor;
      if(!Number.isFinite(proceeds)||proceeds<=0) continue;
      sells.push({sym:r.sym,shares,proceeds,gross,currentApr:Number(r.currentApr)||0,price,sellFee:gross-proceeds});
      need=Math.max(0,need-proceeds);
    }
    const funded=Math.max(0,Number(target.cost)-Math.max(0,need));
    return {cash,reserve,sourceCapital,deployable,sources,target,required,sells,shortfall:Math.max(0,need),funded,sellNetFactor};
  }
  function renderRebalancePreview() {
    const box=$('#slx-stock-rebalance-body'); if(!box) return;
    const x=buildRebalancePreview();
    if(!x.target){box.innerHTML='<div class="muted">No ROI candidate available yet. Sync API and benefit values first.</div>';return;}
    const sellHtml=x.sells.length?x.sells.map(r=>`<div class="rebalance-row"><b>SELL ${r.sym}</b><span>${r.shares.toLocaleString()} shares</span><span>≈ ${money(r.proceeds)}</span><small>${r.currentApr?r.currentApr.toFixed(2)+'% current APR':'ROI n/a'}</small></div>`).join(''):'<div class="muted">No stock sale is needed; current cash can fund the selected opportunity.</div>';
    const before=x.sells.reduce((n,r)=>n+r.currentApr*(r.proceeds||0),0);
    const moved=x.sells.reduce((n,r)=>n+r.proceeds,0);
    const sourceWeighted=moved>0?before/moved:0;
    const delta=x.target.roi-sourceWeighted;
    box.innerHTML=`<div class="rebalance-summary"><div><span>Available cash</span><b>${money(x.cash)}</b></div><div><span>Potential releases</span><b>${money(x.sourceCapital)}</b></div><div><span>Reserve</span><b>${money(x.reserve)}</b></div><div><span>Deployable</span><b>${money(x.deployable)}</b></div></div><div class="rebalance-target"><b>Target: ${x.target.sym} · Tier ${x.target.tier}</b><span>${x.target.sharesNeeded.toLocaleString()} shares · ${money(x.target.cost)} · ${x.target.roi.toFixed(2)}% APR</span><small>${Math.round(x.target.paybackDays).toLocaleString()}d payback${moved>0?` · estimated ROI shift ${delta>=0?'+':''}${delta.toFixed(2)}pp`:''}</small></div><div class="rebalance-list">${sellHtml}</div>${x.shortfall>0?`<div class="bad">Still missing ${money(x.shortfall)} after available free/excess capital.</div>`:'<div class="good">Preview fully funded. No trades executed.</div>'}`;
  }

  function renderOptimizer() {
    const box=$('#slx-stock-optimizer-body'); if(!box) return;
    const held=buildOptimizerRows();
    const candidates=buildRoiCandidates();
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    const freeCapital=held.reduce((n,r)=>n+r.freeValue,0);
    const protectedCapital=held.reduce((n,r)=>n+r.protectedValue,0);
    const weakCapital=held.filter(r=>r.signal==='weak').reduce((n,r)=>n+r.protectedValue,0);
    const bankApr=Math.max(0,Number(get(K.bankApr,'0'))||0);
    const best=candidates[0]||null;
    const affordable=candidates.find(r=>r.affordable)||null;
    const summary=`<div class="optimizer-summary"><div><span>Protected capital</span><b>${money(protectedCapital)}</b></div><div><span>Free / excess</span><b>${money(freeCapital)}</b></div><div><span>Weak capital</span><b>${money(weakCapital)}</b></div><div><span>Cash</span><b>${money(cash)}</b></div></div>`;
    const picks=(best?`<div class="optimizer-pick"><b>Best ROI: ${best.sym} · Tier ${best.tier}</b><span>${best.roi.toFixed(2)}% APR · ${Math.round(best.paybackDays).toLocaleString()}d payback · gap ${money(best.cost)}</span>${bankApr?`<small>${best.bankDelta>=0?'+':''}${best.bankDelta.toFixed(2)}pp vs bank</small>`:''}</div>`:'')+(affordable?`<div class="optimizer-pick"><b>Best affordable: ${affordable.sym}</b><span>${affordable.roi.toFixed(2)}% APR · gap ${money(affordable.cost)}</span></div>`:'');
    const rows=held.length?held.map(r=>`<div class="optimizer-row"><div><b>${r.sym}</b><small>Tier ${r.tier||0}</small></div><div><span>${r.protectedShares.toLocaleString()} protected</span><small>${money(r.protectedValue)}</small></div><div><span>${r.freeShares.toLocaleString()} free</span><small>${money(r.freeValue)}</small></div><div><span>${r.currentApr?r.currentApr.toFixed(2)+'% APR':'ROI n/a'}</span><small>${bankApr?`${(r.currentApr-bankApr).toFixed(2)}pp vs bank`:'set bank APR'}</small></div><div><span>${r.nextGap?money(r.nextCost)+' to next':'no next tier'}</span><small class="${r.signal==='weak'?'bad':r.signal==='excess'?'warn':'good'}">${r.signal==='weak'?'Below threshold':r.signal==='excess'?'Excess shares':'Protected'}</small></div></div>`).join(''):'<div class="muted">No held-stock optimizer data yet. Sync API first.</div>';
    box.innerHTML=summary+picks+`<div class="optimizer-list">${rows}</div>`;
  }

  function renderAdvisor() {
    const box=$('#slx-stock-advisor-body'); if(!box) return;
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="muted">Sync API and load benefit values. Only benefits with a known cash-equivalent value are ranked.</div>';return;}
    box.innerHTML=rows.slice(0,10).map((r,index)=>`<div class="roi-row"><b>#${index+1} ${r.sym}</b><span>Tier ${r.tier}</span><span>${r.roi.toFixed(2)}% APR</span><span>${Math.round(r.paybackDays).toLocaleString()}d payback</span><span>${money(r.cost)} gap</span><span>${money(r.daily)}/day</span><span class="${r.bankApr?(r.beatsBank?'good':'bad'):'muted'}">${r.bankApr?`${r.bankDelta>=0?'+':''}${r.bankDelta.toFixed(2)}pp vs bank`:'Bank APR n/a'}</span><span class="${r.affordable?'good':'muted'}">${r.affordable?'Affordable':'Missing '+money(Math.max(0,r.cost-r.cash))}</span></div>`).join('');
  }


  function renderPortfolio() {
    const box=$('#slx-stock-portfolio-body'); if(!box) return;
    const rows=buildPortfolioRows();
    if(!rows.length){
      box.innerHTML='<div class="muted">No portfolio data yet. Add/test the API key or open the Stocks page.</div>';
      return;
    }
    const totalValue=rows.reduce((n,r)=>n+r.value,0);
    const knownCost=rows.reduce((n,r)=>n+(r.cost||0),0);
    const knownValue=rows.reduce((n,r)=>n+(r.cost===null?0:r.value),0);
    const totalPl=knownValue-knownCost;
    const cash=Number(S.money)||currentMoneyFromDom()||0;
    box.innerHTML=`<div class="portfolio-summary"><div><span>Positions</span><b>${rows.length}</b></div><div><span>Market value</span><b>${money(totalValue)}</b></div><div><span>Cash</span><b>${money(cash)}</b></div><div><span>Known P/L</span><b class="${totalPl>=0?'good':'bad'}">${totalPl>=0?'+':''}${money(Math.abs(totalPl))}</b></div></div>`+
      `<div class="portfolio-list">${rows.map(r=>`<div class="portfolio-row"><div class="portfolio-sym"><b>${esc(r.sym)}</b><small>${r.tier?'Benefit tier '+r.tier:'No active benefit'}</small></div><div><span>${r.owned.toLocaleString()} shares</span><small>@ ${money(r.price)}</small></div><div><span>${money(r.value)}</span><small>${r.avg?`avg ${money(r.avg)}`:'avg n/a'}</small></div><div>${r.pl===null?'<span class="muted">P/L n/a</span>':`<span class="${r.pl>=0?'good':'bad'}">${r.pl>=0?'+':''}${money(Math.abs(r.pl))}</span>`}<small>${r.locked?`${r.locked.toLocaleString()} protected`:'no lock floor'}</small></div></div>`).join('')}</div>`;
  }


  function panicButton() {
    if($('#slx-stock-panic')) return;
    const b=document.createElement('button');
    b.id='slx-stock-panic'; b.type='button'; b.textContent='PANIC'; b.title='Panic v2 · preview and vault on-hand cash into the configured stock target';
    b.addEventListener('click', panic);
    (document.body||document.documentElement).appendChild(b);
  }

  async function resolvePanicPreview() {
    const primary=get(K.target).toUpperCase();
    const fallback=get(K.panicFallback).toUpperCase();
    const candidates=[primary,fallback].filter((v,i,a)=>v && a.indexOf(v)===i);
    if(!candidates.length) throw new Error('Choose a Panic primary target first.');

    let cash=currentMoneyFromDom();
    if(getStockApiKey()) {
      try { await apiSync(); cash=Number(S.money)||cash; } catch(e) { if(!cash) throw e; }
    }
    if(!cash) throw new Error('Unable to determine on-hand cash. Add/test the API key first.');

    const useAll=bool(K.panicUseAll,false);
    const keep=useAll ? 0 : parseAmount(get(K.panicKeep,get(K.keep,'0')));
    const maxSpend=useAll ? 0 : parseAmount(get(K.panicMax,'0'));
    const available=Math.max(0,cash-keep);
    const allowed=maxSpend>0?Math.min(available,maxSpend):available;
    if(allowed<=0) throw new Error(`No Panic cash available after keeping ${money(keep)}.`);

    let lastError=null;
    for(let i=0;i<candidates.length;i++) {
      const sym=candidates[i];
      try {
        const stock=await ensureStock(sym);
        const shares=Math.floor(allowed/stock.price);
        if(shares<=0){lastError=new Error(`${sym} is too expensive for the configured Panic spend.`);continue;}
        const estimate=shares*stock.price;
        return {sym,stock,cash,keep,maxSpend,available,allowed,shares,estimate,leftover:Math.max(0,cash-estimate),fallbackUsed:i>0,useAll};
      } catch(e) { lastError=e; }
    }
    throw lastError||new Error('No Panic target could be resolved.');
  }

  function panicPreviewText(x) {
    return `${x.fallbackUsed?'Fallback ':''}${x.sym} · ${x.shares.toLocaleString()} shares · about ${money(x.estimate)} · cash ${money(x.cash)} → ${money(x.leftover)} remaining${x.useAll?' · 100% mode':''}`;
  }

  async function previewPanic() {
    try {
      status('PANIC preview: calculating exact order…','warn');
      const x=await resolvePanicPreview();
      const box=$('#slx-panic-preview');
      if(box){box.dataset.kind='ok';box.textContent=panicPreviewText(x);}
      status(`PANIC preview · ${panicPreviewText(x)}`,'ok');
      return x;
    } catch(e) {
      const box=$('#slx-panic-preview');
      if(box){box.dataset.kind='bad';box.textContent=e.message;}
      status(`PANIC preview failed: ${e.message}`,'bad');
      throw e;
    }
  }

  async function panic() {
    try {
      set(K.panicPending,'0');
      const x=await previewPanic();
      if(bool(K.panicConfirm,false)) {
        const ok=confirm(`PANIC v2\n\nTarget: ${x.sym}${x.fallbackUsed?' (fallback)':''}\nShares: ${x.shares.toLocaleString()}\nEstimated spend: ${money(x.estimate)}\nCash before: ${money(x.cash)}\nEstimated cash after: ${money(x.leftover)}\n\nExecute now?`);
        if(!ok){status('PANIC cancelled.','warn');return;}
      }
      status(`PANIC: buying ${x.shares.toLocaleString()} ${x.sym}…`,'warn');
      await postTrade(x.sym,x.shares,'buyShares');
      status(`PANIC complete · ${panicPreviewText(x)}`,'ok');
      if(getStockApiKey() && !isDryRun()) syncAllApi().catch(()=>{});
    } catch(e) {
      set(K.panicPending,'0');
      status(`PANIC failed: ${e.message}`,'bad');
      openPanel();
    }
  }

  function stockHostVisible(node) {
    for(let el=node;el&&el!==document.documentElement;el=el.parentElement) {
      if(el.hidden) return false;
      const css=getComputedStyle(el);
      if(css.display==='none'||css.visibility==='hidden'||css.visibility==='collapse') return false;
    }
    return Boolean(node?.isConnected);
  }
  function inlineStockHost() {
    const firstStock=$$("ul[class^='stock_'], ul[id^='stock_']").find(stockHostVisible);
    if(firstStock?.parentElement) return {host:firstStock.parentElement,before:firstStock};
    const host=['#mainContainer .content-wrapper','.content-wrapper','#mainContainer','main'].flatMap(selector=>$$(selector)).find(stockHostVisible)||document.body;
    return {host,before:null};
  }

  function buildPortfolioRows() {
    scanStocks();
    const rows=[];
    for(const [sym,st] of S.stocks) {
      const owned=Math.max(0,Math.floor(Number(ownedShares(sym))||0));
      const price=Number(st?.price)||0;
      if(owned<=0 || price<=0) continue;
      const avg=Number(averageBuy(sym))||0;
      const value=owned*price;
      const cost=avg>0 ? owned*avg : null;
      const pl=cost===null ? null : value-cost;
      const tier=benefitTier(sym,owned);
      const locked=bool(K.benefitLock,true)?Math.max(0,Number(tier.keep)||0):0;
      rows.push({sym,owned,price,avg,value,cost,pl,tier:tier.tier||0,locked});
    }
    return rows.sort((a,b)=>b.value-a.value || a.sym.localeCompare(b.sym));
  }

  function inlineTotals() {
    const rows=buildPortfolioRows();
    const marketValue=rows.reduce((n,r)=>n+r.value,0);
    const knownRows=rows.filter(r=>r.cost!==null && Number.isFinite(r.cost));
    const invested=knownRows.reduce((n,r)=>n+r.cost,0);
    const knownValue=knownRows.reduce((n,r)=>n+r.value,0);
    const pl=knownValue-invested;
    const plPct=invested>0?(pl/invested)*100:0;
    const coverage=rows.length?Math.round((knownRows.length/rows.length)*100):0;
    return {marketValue,invested,pl,plPct,coverage,cash:Number(S.money)||currentMoneyFromDom()||0,positions:rows.length,known:knownRows.length};
  }

  function inlinePresetValues() {
    const raw=get(K.inlinePresets,'50k,250k,1m,5m,10m,25m');
    const vals=String(raw).split(/[;,\s]+/).map(v=>v.trim()).filter(Boolean).slice(0,10);
    return vals.length?vals:['50k','250k','1m','5m','10m','25m'];
  }

  function inlineButtonPrefs() {
    const defaults={advisor:true,trade:true,rebalance:true,panic:true,full:true};
    try { return {...defaults,...JSON.parse(get(K.inlineButtons,'{}'))}; } catch { return defaults; }
  }

  function saveInlineButtonPrefs(next) { set(K.inlineButtons,JSON.stringify({...inlineButtonPrefs(),...next})); }

  function renderInlinePresetButtons(card=$('#slx-stock-inline')) {
    const box=$('#slx-inline-presets',card||document); if(!box) return;
    box.innerHTML=inlinePresetValues().map(v=>`<button type="button" data-slx-preset="${esc(v)}">${esc(v.toUpperCase())}</button>`).join('');
    $$('[data-slx-preset]',box).forEach(b=>b.onclick=()=>{const v=b.dataset.slxPreset;const input=$('#slx-inline-withdraw-value',card);if(input)input.value=v;set(K.withdraw,v);inlineStatus(`Withdraw preset: ${v.toUpperCase()}`,'ok');});
  }

  function applyInlineButtonPrefs(card=$('#slx-stock-inline')) {
    if(!card) return;
    const pref=inlineButtonPrefs();
    const map={advisor:'[data-slx-inline-tab="advisor"]',trade:'[data-slx-inline-tab="trade"]',rebalance:'[data-slx-inline-tab="rebalance"]',panic:'#slx-inline-panic',full:'#slx-inline-full'};
    Object.entries(map).forEach(([k,sel])=>{const el=$(sel,card);if(el)el.hidden=!pref[k];});
  }

  function openPanelAt(selector) {
    openPanel();
    setTimeout(()=>{
      const node=$(selector,S.panel||document);
      const section=node?.closest?.('.section')||node;
      section?.scrollIntoView?.({behavior:'smooth',block:'start'});
    },40);
  }

  function mountInlinePanel() {
    if(!isStocks()) { $('#slx-stock-inline')?.remove(); return null; }
    const {host,before}=inlineStockHost();
    if(!host) return null;
    const existing=$('#slx-stock-inline');
    if(existing) {
      if(existing.parentElement!==host) {
        if(before) host.insertBefore(existing,before); else host.prepend(existing);
      }
      return existing;
    }
    const card=document.createElement('section');
    card.id='slx-stock-inline';
    card.dataset.collapsed=bool(K.inlineCollapsed,false)?'1':'0';
    card.innerHTML=`<div class="slx-inline-head"><div><b>📊 SakaLuX Stock Manager</b><small>v${APP.version}</small></div><div class="slx-inline-head-actions"><button id="slx-inline-refresh" type="button" title="Refresh Stock Manager">↻</button><button id="slx-inline-api" type="button">API</button><button id="slx-inline-settings" type="button" title="Inline settings">⚙</button><button id="slx-inline-full" type="button">Full</button><button id="slx-inline-toggle" type="button">${card.dataset.collapsed==='1'?'＋':'−'}</button></div></div>
      <div class="slx-inline-body">
        <div class="slx-inline-summary"><div><span>Total invested <small id="slx-inline-coverage"></small></span><b id="slx-inline-total">—</b></div><div><span>Market value</span><b id="slx-inline-market">—</b></div><div><span>Unrealized P/L</span><b id="slx-inline-pl">—</b><small id="slx-inline-pl-pct"></small></div><div><span>Cash</span><b id="slx-inline-cash">—</b></div></div>
        <div class="slx-inline-nav"><button data-slx-inline-tab="advisor" type="button">★ Advisor</button><button data-slx-inline-tab="trade" type="button">📈 Trade Assistant</button><button data-slx-inline-tab="rebalance" type="button">⚖ Rebalance Preview</button><button id="slx-exec-rebalance" class="primary" type="button">⚡ Execute Rebalance</button></div>
        <div id="slx-inline-advanced" class="slx-inline-advanced"><div class="slx-stock-view-controls"><label>Sort<select id="slx-stock-sort"><option value="default">Torn default</option><option value="owned">Owned shares</option><option value="value">Position value</option><option value="roi">Best ROI</option><option value="benefit">Closest benefit</option><option value="pl">Biggest P/L</option><option value="loss">Biggest loss</option><option value="excess">Excess shares</option></select></label><label>Filter<select id="slx-stock-filter"><option value="all">All stocks</option><option value="owned">Owned only</option><option value="profit">Profit only</option><option value="loss">Loss only</option><option value="excess">Excess shares</option><option value="benefit">Has next benefit</option><option value="favorites">Favorites only</option></select></label><button id="slx-stock-view-reset" type="button">Reset</button></div><div class="slx-v070-toolbar"><input id="slx-stock-search" type="search" placeholder="Search stock…"><button id="slx-favorites-only" type="button">★ Favorites</button><label><input id="slx-target-lock" type="checkbox"> Target lock</label><button id="slx-diagnostics" type="button">Diagnostics</button><button id="slx-export" type="button">Export</button><button id="slx-import" type="button">Import</button><input id="slx-import-file" type="file" accept="application/json" hidden><button id="slx-target-fav-toggle" type="button">☆ Target</button><select id="slx-target-favorites"><option value="">Favorite targets…</option></select><label>Near % <input id="slx-near-pct" inputmode="decimal" value="90" style="width:55px"></label><label>Cash target <input id="slx-cash-target" value="0" placeholder="e.g. 50m" style="width:85px"></label><button id="slx-sell-cash-target" type="button">Sell → Cash</button><button id="slx-history-open" type="button">History</button></div><div id="slx-diagnostic-line" class="slx-inline-note"></div></div>
        <div id="slx-inline-workspace" class="slx-inline-workspace" data-open="0"></div>
        <div class="slx-inline-target"><label>Target <select id="slx-inline-target"><option value="">Loading…</option></select></label><div><span>Owned</span><b id="slx-inline-owned">—</b></div></div>
        <div class="slx-inline-actions"><button id="slx-inline-vault-max" class="primary" type="button">Vault Max</button><button id="slx-inline-withdraw-all" class="danger" type="button">Withdraw All</button><button id="slx-inline-vault-keep" type="button">Vault Keep</button><label><input id="slx-inline-keep" value="${esc(get(K.keep,'0'))}" placeholder="Keep cash"></label><button id="slx-inline-withdraw" type="button">Withdraw</button><label><input id="slx-inline-withdraw-value" value="${esc(get(K.withdraw,'1m'))}" placeholder="Withdraw amount"></label></div>
        <div class="slx-inline-options"><label><input id="slx-inline-api-mode" type="checkbox"> API Mode</label><label><input id="slx-inline-benefit-lock" type="checkbox"> Lock Benefits</label><label><input id="slx-inline-dry" type="checkbox"> Dry Run</label><button id="slx-inline-compact" type="button">Compact</button></div>
        <div id="slx-inline-presets" class="slx-inline-presets"></div>
        <div id="slx-inline-config" class="slx-inline-config" hidden><label>Withdrawal presets <input id="slx-inline-preset-input" value="${esc(get(K.inlinePresets,'50k,250k,1m,5m,10m,25m'))}" placeholder="50k,250k,1m,5m,10m,25m"></label><div class="slx-inline-config-actions"><button id="slx-inline-save-presets" type="button">Save presets</button><label><input data-inline-button="advisor" type="checkbox"> Advisor</label><label><input data-inline-button="trade" type="checkbox"> Trade</label><label><input data-inline-button="rebalance" type="checkbox"> Rebalance</label><label><input data-inline-button="panic" type="checkbox"> PANIC</label><label><input data-inline-button="full" type="checkbox"> Full</label></div></div>
        <div id="slx-inline-status" class="slx-inline-note">Ready.</div>
      </div>`;
    if(before) host.insertBefore(card,before); else host.prepend(card);
    const advanced=$('#slx-inline-advanced',card), configBox=$('#slx-inline-config',card); if(advanced&&configBox) configBox.after(advanced);

    $('#slx-inline-toggle',card).onclick=()=>{const closed=card.dataset.collapsed!=='1';card.dataset.collapsed=closed?'1':'0';set(K.inlineCollapsed,closed?'1':'0');$('#slx-inline-toggle',card).textContent=closed?'＋':'−';};
    $('#slx-inline-full',card).onclick=openPanel;
    $('#slx-inline-api',card).onclick=()=>{openPanel();setTimeout(openStockApiSheet,25);};
    $('#slx-inline-refresh',card).onclick=async()=>{try{inlineStatus('Refreshing…','info');if(bool(K.inlineApiMode,true)&&getStockApiKey())await syncAllApi();else{scanStocks();refreshInlinePanel();}inlineStatus('Refreshed.','ok');}catch(e){inlineStatus(e.message,'bad');}};
    $$('[data-slx-inline-tab]',card).forEach(b=>b.onclick=()=>toggleInlineWorkspace(b.dataset.slxInlineTab));
    $('#slx-inline-target',card).onchange=e=>{set(K.target,e.target.value);refreshTargetSelect();refreshInlinePanel();};
    $('#slx-inline-keep',card).onchange=e=>set(K.keep,e.target.value);
    $('#slx-inline-withdraw-value',card).onchange=e=>set(K.withdraw,e.target.value);
    $('#slx-inline-api-mode',card).checked=bool(K.inlineApiMode,true);
    $('#slx-inline-api-mode',card).onchange=e=>{set(K.inlineApiMode,e.target.checked?'1':'0');refreshInlinePanel();inlineStatus(`API Mode ${e.target.checked?'ON':'OFF'}.`,e.target.checked?'ok':'info');};
    refreshStockViewControls();
    const sortCtl=$('#slx-stock-sort',card); if(sortCtl) sortCtl.onchange=()=>{set(K.stockSort,sortCtl.value);applyStockView();enhanceStockRows();inlineStatus(`Sorted: ${sortCtl.options[sortCtl.selectedIndex]?.text||sortCtl.value}`,'ok');};
    const filterCtl=$('#slx-stock-filter',card); if(filterCtl) filterCtl.onchange=()=>{set(K.stockFilter,filterCtl.value);applyStockView();enhanceStockRows();inlineStatus(`Filter: ${filterCtl.options[filterCtl.selectedIndex]?.text||filterCtl.value}`,'ok');};
    const resetView=$('#slx-stock-view-reset',card); if(resetView) resetView.onclick=()=>{set(K.stockSort,'default');set(K.stockFilter,'all');refreshStockViewControls();scanStocks();for(const [,st] of S.stocks){if(st?.row)st.row.style.display='';}enhanceStockRows();inlineStatus('Stock view reset.','ok');};

    $('#slx-inline-settings',card).onclick=()=>{const cfg=$('#slx-inline-config',card),btn=$('#slx-inline-settings',card);if(!cfg)return;const opening=cfg.hidden;cfg.hidden=!opening;btn.dataset.active=opening?'1':'0';btn.textContent=opening?'⚙✓':'⚙';if(opening)setTimeout(()=>cfg.scrollIntoView({behavior:'smooth',block:'nearest'}),30);};
    const search=$('#slx-stock-search',card); if(search){search.value=get(K.rowSearch,'');search.oninput=()=>{set(K.rowSearch,search.value);applyStockView();};}
    const favOnly=$('#slx-favorites-only',card); if(favOnly) favOnly.onclick=()=>{set(K.stockFilter,'favorites');refreshStockViewControls();applyStockView();enhanceStockRows();};
    const tl=$('#slx-target-lock',card); if(tl){tl.checked=bool(K.targetLock,false);tl.onchange=()=>{set(K.targetLock,tl.checked?'1':'0');enhanceStockRows();inlineStatus(`Target lock ${tl.checked?'ON':'OFF'}.`,'ok');};}
    const diag=$('#slx-diagnostics',card); if(diag) diag.onclick=()=>{$('#slx-diagnostic-line',card).textContent=diagnosticsText();};
    const ex=$('#slx-export',card); if(ex) ex.onclick=exportStockManagerData;
    const im=$('#slx-import',card), fi=$('#slx-import-file',card); if(im&&fi){im.onclick=()=>fi.click();fi.onchange=()=>importStockManagerData(fi.files?.[0]);}
    refreshRoadmapControls();
    const tf=$('#slx-target-fav-toggle',card); if(tf) tf.onclick=()=>toggleFavoriteTarget(get(K.target));
    const ts=$('#slx-target-favorites',card); if(ts) ts.onchange=()=>{if(ts.value&&setTargetSafely(ts.value)) refreshRoadmapControls();};
    const nb=$('#slx-near-pct',card); if(nb) nb.onchange=()=>{const v=Math.max(50,Math.min(99.9,Number(nb.value)||90));set(K.nearBenefitPct,String(v));nb.value=String(v);enhanceStockRows();inlineStatus(`Near-benefit alert set to ${v}%.`,'ok');};
    const ct=$('#slx-cash-target',card); if(ct) ct.onchange=()=>set(K.cashTarget,ct.value);
    const sc=$('#slx-sell-cash-target',card); if(sc) sc.onclick=()=>sellToCashTarget().catch(e=>inlineStatus(e.message,'bad'));
    const er=$('#slx-exec-rebalance',card); if(er) er.onclick=()=>executeGuidedRebalance().catch(e=>inlineStatus(e.message,'bad'));
    const ho=$('#slx-history-open',card); if(ho) ho.onclick=()=>{openPanel();setTimeout(()=>$('#slx-stock-tx-history')?.scrollIntoView({behavior:'smooth',block:'center'}),50);};
    const compactBtn=$('#slx-inline-compact',card); if(compactBtn){const syncCompact=()=>{const on=bool(K.compactMode,false);card.dataset.compact=on?'1':'0';compactBtn.dataset.active=on?'1':'0';compactBtn.textContent=on?'Compact ✓':'Compact';};syncCompact();compactBtn.onclick=()=>{set(K.compactMode,bool(K.compactMode,false)?'0':'1');syncCompact();renderInlineWorkspace(get(K.inlineTab,''));};}
    $('#slx-inline-save-presets',card).onclick=()=>{const raw=$('#slx-inline-preset-input',card).value;set(K.inlinePresets,raw);renderInlinePresetButtons(card);inlineStatus('Withdrawal presets saved.','ok');};
    $$('[data-inline-button]',card).forEach(cb=>{const key=cb.dataset.inlineButton;cb.checked=!!inlineButtonPrefs()[key];cb.onchange=()=>{saveInlineButtonPrefs({[key]:cb.checked});applyInlineButtonPrefs(card);};});
    $('#slx-inline-benefit-lock',card).checked=bool(K.benefitLock,true);
    $('#slx-inline-benefit-lock',card).onchange=e=>{set(K.benefitLock,e.target.checked?'1':'0');renderPortfolio();renderOptimizer();refreshInlinePanel();};
    $('#slx-inline-dry',card).checked=bool(K.dryRun,true);
    $('#slx-inline-dry',card).onchange=e=>{set(K.dryRun,e.target.checked?'1':'0');refreshInlinePanel();};
    $('#slx-inline-vault-max',card).onclick=()=>{if(!confirm('Vault Max: continue?'))return;vault().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));};
    $('#slx-inline-vault-keep',card).onclick=()=>vault({keep:parseAmount($('#slx-inline-keep',card).value)}).then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));
    $('#slx-inline-withdraw',card).onclick=()=>withdrawCash(parseAmount($('#slx-inline-withdraw-value',card).value)).then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));
    $('#slx-inline-withdraw-all',card).onclick=()=>{if(!confirm('Withdraw All: continue?'))return;withdrawAll().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));};
    renderInlinePresetButtons(card);
    applyInlineButtonPrefs(card);
    refreshInlinePanel();
    return card;
  }

  function toggleInlineWorkspace(tab) {
    tab=String(tab||'');
    const current=get(K.inlineTab,'');
    const next=current===tab?'':tab;
    set(K.inlineTab,next);
    renderInlineWorkspace(next);
  }

  function renderInlineWorkspace(tab=get(K.inlineTab,'')) {
    const card=$('#slx-stock-inline');
    const box=$('#slx-inline-workspace',card||document);
    if(!card || !box) return;
    tab=String(tab||'');
    $$('[data-slx-inline-tab]',card).forEach(b=>b.dataset.active=b.dataset.slxInlineTab===tab?'1':'0');
    if(!tab){box.dataset.open='0';box.innerHTML='';return;}
    box.dataset.open='1';
    try {
      if(tab==='advisor') return renderInlineAdvisor(box);
      if(tab==='trade') return renderInlineTrade(box);
      if(tab==='rebalance') return renderInlineRebalance(box);
      box.innerHTML='<div class="slx-inline-empty">Unknown workspace.</div>';
    } catch(e) {
      console.error(`[${APP.name}] inline ${tab} failed`,e);
      const msg=String(e?.message||'Workspace error');
      box.innerHTML=`<div class="slx-inline-error">${esc(msg)}</div>`;
      inlineStatus(`${tab}: ${msg}`,'bad');
    }
  }

  function renderInlineAdvisor(box) {
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="slx-inline-empty">No ROI data yet. Sync API and Fetch Market Values from Full → Benefit Values.</div>';return;}
    const bankApr=Math.max(0,Number(get(K.bankApr,'0'))||0);
    box.innerHTML=`<div class="slx-inline-work-head"><b>★ Benefit ROI Advisor</b><button type="button" data-open-full="#slx-stock-advisor-body">Full Advisor</button></div><div class="slx-inline-roi-list">${rows.slice(0,5).map((r,i)=>`<div class="slx-inline-roi-row"><b>#${i+1} ${r.sym}</b><span>Tier ${r.tier}</span><span>${r.roi.toFixed(2)}% APR</span><span>${money(r.cost)} gap</span><small>${Math.round(r.paybackDays).toLocaleString()}d payback${bankApr?` · ${r.bankDelta>=0?'+':''}${r.bankDelta.toFixed(2)}pp vs bank`:''}</small><button type="button" data-inline-target="${r.sym}">Target</button></div>`).join('')}</div>`;
    $('[data-open-full]',box).onclick=()=>openPanelAt('#slx-stock-advisor-body');
    $$('[data-inline-target]',box).forEach(b=>b.onclick=()=>{set(K.target,b.dataset.inlineTarget);refreshTargetSelect();refreshInlinePanel();inlineStatus(`${b.dataset.inlineTarget} selected as target.`,'ok');});
  }

  async function inlineBuyGap(sym,requested) {
    try {
      const st=await ensureStock(sym);
      let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
      if(!cash && getStockApiKey()){await apiSync();cash=Number(S.money)||0;}
      const shares=Math.min(Math.max(0,Math.floor(Number(requested)||0)),Math.floor(cash/st.price));
      if(shares<=0) throw new Error(`Not enough cash to buy ${sym}.`);
      if(!confirm(`Buy ${shares.toLocaleString()} ${sym} shares for about ${money(shares*st.price)}?`)) return;
      await postTrade(sym,shares,'buyShares');
      inlineStatus(`${isDryRun()?'Dry Run · ':''}Buy gap ${shares.toLocaleString()} ${sym}.`,'ok');
      if(getStockApiKey() && !isDryRun()) await syncAllApi(); else refreshInlinePanel();
    } catch(e) { inlineStatus(`Trade Assistant: ${e.message}`,'bad'); }
  }

  function renderInlineTrade(box) {
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="slx-inline-empty">No trade candidates yet. Sync API and benefit values first.</div>';return;}
    const best=rows[0], affordable=rows.find(r=>r.affordable);
    const cards=[['Best ROI',best],['Best affordable',affordable]].filter((x,i,a)=>x[1] && a.findIndex(y=>y[1]?.sym===x[1].sym && y[1]?.tier===x[1].tier)===i);
    box.innerHTML=`<div class="slx-inline-work-head"><b>📈 Trade Assistant</b><button type="button" data-open-full="#slx-stock-trade-body">Full Assistant</button></div><div class="slx-inline-trade-list">${cards.map(([title,r])=>`<div class="slx-inline-trade-card"><div><small>${title}</small><b>${r.sym} · Tier ${r.tier}</b><span>${r.roi.toFixed(2)}% APR · ${money(r.cost)}</span></div><div class="slx-inline-mini-actions"><button type="button" data-inline-target="${r.sym}">Target</button><button type="button" class="primary" data-inline-buy="${r.sym}" data-shares="${r.sharesNeeded}">Buy gap</button></div></div>`).join('')}</div>`;
    $('[data-open-full]',box).onclick=()=>openPanelAt('#slx-stock-trade-body');
    $$('[data-inline-target]',box).forEach(b=>b.onclick=()=>{set(K.target,b.dataset.inlineTarget);refreshTargetSelect();refreshInlinePanel();});
    $$('[data-inline-buy]',box).forEach(b=>b.onclick=()=>inlineBuyGap(b.dataset.inlineBuy,Number(b.dataset.shares)||0));
  }

  function renderInlineRebalance(box) {
    const x=buildRebalancePreview();
    if(!x.target){box.innerHTML='<div class="slx-inline-empty">No rebalance candidate yet. Sync API and benefit values first.</div>';return;}
    const sells=x.sells.length?x.sells.map(r=>`<div class="slx-inline-rebalance-row"><b>SELL ${r.sym}</b><span>${r.shares.toLocaleString()} sh</span><span>≈ ${money(r.proceeds)}</span></div>`).join(''):'<div class="slx-inline-empty">Current cash can fund the target; no stock sale is required.</div>';
    box.innerHTML=`<div class="slx-inline-work-head"><b>⚖ Rebalance Preview</b><button type="button" data-open-full="#slx-stock-rebalance-body">Full Preview</button></div><div class="slx-inline-rebalance-target"><small>Target</small><b>${x.target.sym} · Tier ${x.target.tier}</b><span>${x.target.sharesNeeded.toLocaleString()} shares · ${money(x.target.cost)} · ${x.target.roi.toFixed(2)}% APR</span></div><div class="slx-inline-rebalance-list">${sells}</div><div class="${x.shortfall>0?'bad':'good'}">${x.shortfall>0?`Shortfall ${money(x.shortfall)}`:'Fully fundable · preview only, no trades executed'}</div>`;
    $('[data-open-full]',box).onclick=()=>openPanelAt('#slx-stock-rebalance-body');
  }

  function inlineStatus(msg,kind='info') {
    const el=$('#slx-inline-status'); if(!el) return;
    el.textContent=msg; el.dataset.kind=kind;
  }

  function refreshInlinePanel() {
    const card=$('#slx-stock-inline'); if(!card || !isStocks()) return;
    scanStocks();
    const target=get(K.target).toUpperCase();
    const sel=$('#slx-inline-target',card);
    const list=[...S.stocks.keys()].sort();
    if(sel){
      const active=sel.value||target;
      sel.innerHTML='<option value="">Select stock…</option>'+list.map(sym=>`<option value="${esc(sym)}" ${sym===active?'selected':''}>${esc(sym)} · ${money(S.stocks.get(sym)?.price||0)}</option>`).join('');
      if(target && list.includes(target)) sel.value=target;
    }
    const totals=inlineTotals();
    const pl=$('#slx-inline-pl',card);
    $('#slx-inline-total',card).textContent=totals.invested>0?money(totals.invested):'—';
    $('#slx-inline-market',card).textContent=money(totals.marketValue);
    $('#slx-inline-cash',card).textContent=money(totals.cash);
    $('#slx-inline-coverage',card).textContent=totals.positions?`· ${totals.coverage}% cost basis`:'';
    $('#slx-inline-pl-pct',card).textContent=totals.invested>0?`${totals.plPct>=0?'+':''}${totals.plPct.toFixed(2)}%`:'';
    if(pl){pl.textContent=totals.invested>0?`${totals.pl>=0?'+':'-'}${money(Math.abs(totals.pl))}`:'—';pl.className=totals.pl>=0?'good':'bad';}
    $('#slx-inline-owned',card).textContent=target?ownedShares(target).toLocaleString():'—';
    const api=$('#slx-inline-api',card); if(api){const enabled=bool(K.inlineApiMode,true);api.textContent=!getStockApiKey()?'API !':enabled?'API ON':'API OFF';api.dataset.kind=getStockApiKey()&&enabled?'ok':'warn';} const apiMode=$('#slx-inline-api-mode',card);if(apiMode)apiMode.checked=bool(K.inlineApiMode,true);applyInlineButtonPrefs(card);
    const lock=$('#slx-inline-benefit-lock',card); if(lock) lock.checked=bool(K.benefitLock,true);
    const dry=$('#slx-inline-dry',card); if(dry) dry.checked=bool(K.dryRun,true);
    renderInlineWorkspace(get(K.inlineTab,''));
    enhanceStockRows();
  }

  function style() {
    if($('#slx-stock-style')) return;
    const s=document.createElement('style'); s.id='slx-stock-style';
    s.textContent=`
#slx-stock-panic{position:fixed;right:10px;top:174px;z-index:2147482500;border:1px solid #ff5c6b;border-radius:10px;padding:8px 10px;background:linear-gradient(180deg,#7f1520,#4d0d14);color:#fff;font:900 11px Arial;box-shadow:0 6px 18px #0008}
#slx-stock-panel{position:fixed;inset:0;z-index:2147483000;background:#05080dcc;color:#e8eef7;display:none;align-items:flex-start;justify-content:center;padding:70px 10px 90px;overflow:auto;font-family:Arial,sans-serif}
#slx-stock-panel[data-open="1"]{display:flex} #slx-stock-panel .card{width:min(720px,100%);background:#0e1620;border:1px solid #344458;border-radius:16px;box-shadow:0 20px 55px #000b;overflow:hidden}
#slx-stock-panel .head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:linear-gradient(180deg,#162536,#101a26);border-bottom:1px solid #33465b} #slx-stock-panel h2{font-size:16px;margin:0;flex:1}
#slx-stock-panel button,#slx-stock-panel select,#slx-stock-panel input{box-sizing:border-box;border:1px solid #43556a;border-radius:9px;background:#111d29;color:#eef5ff;padding:9px;font-size:12px}
#slx-stock-panel button{font-weight:800} #slx-stock-panel .close{width:36px} #slx-stock-panel .body{padding:12px;display:grid;gap:10px}
#slx-stock-panel .section{border:1px solid #27384a;border-radius:12px;padding:10px;background:#0b121a} #slx-stock-panel .title{font-size:11px;font-weight:900;color:#90b9e8;margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em}
#slx-stock-panel .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px} #slx-stock-panel label{display:grid;gap:5px;font-size:10px;color:#9aabba} #slx-stock-panel .slx-vault-grid>button{align-self:end;min-height:46px;width:100%;font-weight:900} #slx-stock-panel #slx-withdraw-all.danger{background:linear-gradient(180deg,#7a2630,#561820)!important;border-color:#b54552!important;color:#fff!important} #slx-stock-panel .actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
#slx-stock-panel .primary{background:#194f86;border-color:#2e77b9} #slx-stock-panel .danger{background:#64131c;border-color:#a92c3b} #slx-stock-panel .good{color:#55d98a}.bad{color:#ff6b78}.muted{color:#8392a4} #slx-stock-panel .warn{color:#ffd36b} #slx-stock-panel button:disabled,#slx-stock-panic:disabled{opacity:.5;cursor:not-allowed} #slx-stock-panel[data-trading="1"] .card{outline:1px solid #8b6a1f}
#slx-stock-panel #slx-stock-status{padding:8px;border-radius:8px;background:#111b26;font-size:11px;color:#9fb0c3} #slx-stock-panel #slx-stock-status[data-kind="ok"]{color:#61e291} #slx-stock-panel #slx-stock-status[data-kind="bad"]{color:#ff7a86} #slx-stock-panel #slx-stock-status[data-kind="warn"]{color:#ffd36b}
#slx-stock-panel .adv-row{display:grid;grid-template-columns:70px 1fr 1fr 1.4fr 1fr;gap:7px;padding:7px 0;border-bottom:1px solid #1c2a38;font-size:10px;align-items:center}
#slx-stock-panel .section:has(#slx-stock-api){display:none!important}
#slx-stock-panel .api-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}#slx-stock-panel .api-head .title{margin:0;flex:1}
#slx-stock-panel .api-badge{padding:4px 7px;border-radius:999px;border:1px solid #44566a;background:#121e2a;color:#98aabd;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}
#slx-stock-panel .api-badge[data-kind="ok"]{border-color:#267c52;color:#63df9a;background:#0d281d}#slx-stock-panel .api-badge[data-kind="warn"]{border-color:#8b6a1f;color:#ffd36b;background:#2a210d}
#slx-stock-panel .api-key-row{display:grid;grid-template-columns:1fr auto;gap:7px}#slx-stock-panel .api-help{margin-top:7px;font-size:10px;line-height:1.35;color:#8293a7}
#slx-stock-panel .portfolio-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}#slx-stock-panel .portfolio-summary>div{padding:8px;border:1px solid #23374a;border-radius:9px;background:#101a25;display:grid;gap:3px}#slx-stock-panel .portfolio-summary span,#slx-stock-panel .portfolio-row small{color:#8192a5;font-size:9px}#slx-stock-panel .portfolio-summary b{font-size:11px}
#slx-stock-panel .portfolio-list{display:grid;gap:6px}#slx-stock-panel .portfolio-row{display:grid;grid-template-columns:1.05fr 1.1fr 1.15fr 1.15fr;gap:7px;align-items:center;padding:8px;border:1px solid #1f3040;border-radius:9px;background:#0d1620;font-size:10px}#slx-stock-panel .portfolio-row>div{display:grid;gap:3px}.portfolio-sym b{font-size:12px;color:#dcecff}
#slx-stock-panel .benefit-list{display:grid;gap:6px;max-height:280px;overflow:auto}#slx-stock-panel .benefit-row{display:grid;grid-template-columns:42px 1.4fr 95px 62px 1fr;gap:6px;align-items:center;padding:7px;border:1px solid #203142;border-radius:8px;background:#0d1620;font-size:9px}#slx-stock-panel .benefit-row input{min-width:0;padding:6px}#slx-stock-panel .benefit-row small{color:#7f91a5}
#slx-stock-panel .roi-row{display:grid;grid-template-columns:78px 65px 78px 1fr 1fr 1fr;gap:6px;padding:7px 0;border-bottom:1px solid #1c2a38;font-size:10px;align-items:center}#slx-stock-panel .trade-list{display:grid;gap:7px}#slx-stock-panel .trade-card{display:grid;grid-template-columns:1.4fr 1fr auto;gap:8px;padding:9px;border:1px solid #27415a;border-radius:10px;background:#0e1823;align-items:center}.trade-card>div{display:grid;gap:3px}.trade-card small{font-size:9px;color:#8296aa}.trade-card span{font-size:9px;color:#a7b8c9}.trade-actions{display:flex!important;gap:5px}.trade-actions button{padding:7px!important}
#slx-stock-panel .safety-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#slx-stock-panel .panic-preview{margin-top:8px;padding:8px;border:1px solid #2b3f53;border-radius:8px;background:#0d1721;color:#8fa2b6;font-size:10px;line-height:1.4}#slx-stock-panel .panic-preview[data-kind="ok"]{border-color:#267c52;color:#63df9a}#slx-stock-panel .panic-preview[data-kind="bad"]{border-color:#8c3140;color:#ff7a86}#slx-stock-panel .action-list{display:grid;gap:5px;max-height:230px;overflow:auto}#slx-stock-panel .action-row{display:grid;grid-template-columns:1.25fr .8fr .8fr 1fr 1.4fr;gap:6px;padding:6px 0;border-bottom:1px solid #1c2a38;font-size:9px;align-items:center}
#slx-stock-panel .optimizer-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:8px}#slx-stock-panel .optimizer-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}#slx-stock-panel .optimizer-summary>div{display:grid;gap:3px;padding:8px;border:1px solid #23374a;border-radius:9px;background:#101a25}#slx-stock-panel .optimizer-summary span{font-size:9px;color:#8293a7}#slx-stock-panel .optimizer-pick{display:grid;gap:3px;padding:8px;margin-bottom:7px;border:1px solid #365a78;border-radius:9px;background:#0e1c29}.optimizer-pick span,.optimizer-pick small{font-size:9px;color:#9fb3c6}#slx-stock-panel .optimizer-list{display:grid;gap:5px;max-height:310px;overflow:auto}#slx-stock-panel .optimizer-row{display:grid;grid-template-columns:62px 1fr 1fr 1fr 1.25fr;gap:6px;padding:7px;border:1px solid #203142;border-radius:8px;background:#0d1620;font-size:9px;align-items:center}.optimizer-row>div{display:grid;gap:3px}.optimizer-row small{color:#8293a7}
#slx-stock-panel .rebalance-controls{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-bottom:8px}#slx-stock-panel .rebalance-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}#slx-stock-panel .rebalance-summary>div{display:grid;gap:3px;padding:8px;border:1px solid #23374a;border-radius:9px;background:#101a25}.rebalance-summary span{font-size:9px;color:#8293a7}#slx-stock-panel .rebalance-target{display:grid;gap:3px;padding:9px;border:1px solid #365a78;border-radius:9px;background:#0e1c29;margin-bottom:7px}.rebalance-target span,.rebalance-target small{font-size:9px;color:#9fb3c6}#slx-stock-panel .rebalance-list{display:grid;gap:5px;margin-bottom:7px}.rebalance-row{display:grid;grid-template-columns:80px 1fr 1fr 1fr;gap:6px;padding:7px;border:1px solid #203142;border-radius:8px;background:#0d1620;font-size:9px;align-items:center}
#slx-stock-inline{margin:10px 0 14px;padding:0;border:1px solid #344458;border-radius:14px;background:#0b1118;color:#e8eef7;box-shadow:0 8px 24px #0008;overflow:hidden;font-family:Arial,sans-serif}#slx-stock-inline *{box-sizing:border-box}#slx-stock-inline .slx-inline-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:linear-gradient(180deg,#182535,#101923);border-bottom:1px solid #2c3d50}#slx-stock-inline .slx-inline-head>div:first-child{display:grid;gap:2px;flex:1}#slx-stock-inline .slx-inline-head b{font-size:13px}#slx-stock-inline .slx-inline-head small{font-size:9px;color:#8394a7}#slx-stock-inline .slx-inline-head-actions{display:flex;gap:5px}#slx-stock-inline button,#slx-stock-inline input,#slx-stock-inline select{border:1px solid #415369;border-radius:8px;background:#17212c;color:#ecf4ff;padding:8px;font-size:11px}#slx-stock-inline button{font-weight:800}#slx-stock-inline .primary{border-color:#2c8b52;color:#7ee09f;background:#102a1d}#slx-stock-inline .danger{border-color:#8c3140;color:#ff7a86;background:#2b1016}#slx-stock-inline .slx-inline-body{padding:10px;display:grid;gap:9px}#slx-stock-inline[data-collapsed="1"] .slx-inline-body{display:none}#slx-stock-inline .slx-inline-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}#slx-stock-inline .slx-inline-summary>div{display:grid;gap:2px;padding:8px;border:1px solid #26384a;border-radius:9px;background:#101821}#slx-stock-inline .slx-inline-summary span,#slx-stock-inline .slx-inline-target span{font-size:9px;color:#8596a8}#slx-stock-inline .slx-inline-summary small{font-size:8px;color:#74869a}#slx-stock-inline .slx-inline-summary b{font-size:12px}#slx-stock-inline .slx-inline-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}#slx-stock-inline .slx-inline-target{display:grid;grid-template-columns:1fr 110px;gap:8px;align-items:end}#slx-stock-inline .slx-inline-target label,#slx-stock-inline .slx-inline-target>div{display:grid;gap:4px}#slx-stock-inline .slx-inline-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#slx-stock-inline .slx-inline-actions label{display:block}#slx-stock-inline .slx-inline-actions input{width:100%}#slx-stock-inline .slx-inline-options{display:flex;flex-wrap:wrap;gap:9px;align-items:center}#slx-stock-inline .slx-inline-options label{display:flex;align-items:center;gap:4px;font-size:10px;color:#a4b1bf}#slx-stock-inline .slx-inline-options input{width:auto}#slx-stock-inline #slx-inline-panic{margin-left:auto}#slx-stock-inline .slx-inline-presets{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}#slx-stock-inline .slx-inline-config{padding:9px;border:1px solid #2b3d50;border-radius:9px;background:#0d1721;display:grid;gap:8px}#slx-stock-inline .slx-inline-config[hidden]{display:none}#slx-stock-inline .slx-inline-config label{display:grid;gap:4px;font-size:9px;color:#9aabba}#slx-stock-inline .slx-inline-config-actions{display:flex;flex-wrap:wrap;gap:7px;align-items:center}#slx-stock-inline .slx-inline-config-actions label{display:flex;align-items:center;gap:4px}#slx-stock-inline .slx-inline-note{font-size:9px;color:#8ea0b3}#slx-stock-inline .slx-inline-note[data-kind="bad"]{color:#ff7a86}#slx-stock-inline .slx-inline-note[data-kind="ok"]{color:#61e291}#slx-stock-inline .good{color:#61e291}#slx-stock-inline .bad{color:#ff7a86}#slx-stock-inline #slx-inline-api[data-kind="ok"]{border-color:#267c52;color:#63df9a}#slx-stock-inline #slx-inline-api[data-kind="warn"]{border-color:#8b6a1f;color:#ffd36b}
#slx-stock-inline .slx-inline-nav button[data-active="1"],#slx-stock-inline #slx-inline-compact[data-active="1"]{border-color:#3b8ec9;background:#123653;color:#9bd5ff}#slx-stock-inline .slx-stock-view-controls{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:end}#slx-stock-inline .slx-stock-view-controls label{display:grid;gap:3px;font-size:9px;color:#8fa1b4}#slx-stock-inline .slx-stock-view-controls select{width:100%}.slx-stock-row-tools .slx-opp-badge{display:inline-block;margin-left:3px;padding:1px 4px;border:1px solid #8b6a1f;border-radius:999px;color:#ffd36b;background:#2b2412;font:800 7px Arial;font-style:normal}.slx-stock-row-tools .slx-opp-roi{color:#ffd36b!important}.slx-stock-row-tools[data-opportunity="1"]{box-shadow:inset 3px 0 #ffd36b}.slx-stock-row-tools[data-opportunity="2"],.slx-stock-row-tools[data-opportunity="3"]{box-shadow:inset 2px 0 #7c91a8}#slx-stock-inline .slx-inline-workspace{display:none;border:1px solid #26394b;border-radius:10px;background:#0d151e;padding:8px}#slx-stock-inline .slx-inline-workspace[data-open="1"]{display:grid;gap:7px}#slx-stock-inline .slx-inline-work-head{display:flex;align-items:center;gap:8px}#slx-stock-inline .slx-inline-work-head>b{flex:1;font-size:11px;color:#9fc7ef}#slx-stock-inline .slx-inline-work-head button{padding:6px 8px;font-size:9px}#slx-stock-inline .slx-inline-roi-list,#slx-stock-inline .slx-inline-trade-list,#slx-stock-inline .slx-inline-rebalance-list{display:grid;gap:5px}#slx-stock-inline .slx-inline-roi-row{display:grid;grid-template-columns:66px 48px 68px 1fr auto;gap:5px;align-items:center;padding:7px;border:1px solid #203142;border-radius:8px;background:#101923;font-size:9px}#slx-stock-inline .slx-inline-roi-row small{grid-column:1/5;color:#8497aa}#slx-stock-inline .slx-inline-roi-row button{grid-row:1/3;grid-column:5;padding:6px}#slx-stock-inline .slx-inline-trade-card{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:8px;border:1px solid #263b4e;border-radius:9px;background:#101923}#slx-stock-inline .slx-inline-trade-card>div:first-child{display:grid;gap:2px}#slx-stock-inline .slx-inline-trade-card small,#slx-stock-inline .slx-inline-trade-card span{font-size:9px;color:#8497aa}#slx-stock-inline .slx-inline-mini-actions{display:flex;gap:5px}#slx-stock-inline .slx-inline-rebalance-target{display:grid;gap:3px;padding:8px;border:1px solid #365a78;border-radius:9px;background:#0e1c29}#slx-stock-inline .slx-inline-rebalance-target small,#slx-stock-inline .slx-inline-rebalance-target span{font-size:9px;color:#91a8bc}#slx-stock-inline .slx-inline-rebalance-row{display:grid;grid-template-columns:80px 1fr 1fr;gap:6px;padding:6px;border-bottom:1px solid #1e2c39;font-size:9px}#slx-stock-inline .slx-inline-empty,#slx-stock-inline .slx-inline-error{padding:8px;font-size:9px;color:#8fa1b4}#slx-stock-inline .slx-inline-error{color:#ff7a86}
#slx-stock-inline~ul .slx-stock-row-tools,.slx-stock-row-tools{list-style:none!important;display:grid;grid-template-columns:90px 1fr 1.15fr 1fr auto;gap:7px;align-items:center;width:100%;margin:7px 0 0!important;padding:8px!important;border-top:1px solid #2a3b4d;background:linear-gradient(180deg,#101923,#0c141c);color:#dce9f7;font-family:Arial,sans-serif;box-sizing:border-box}.slx-stock-row-tools *{box-sizing:border-box}.slx-stock-row-tools[data-target="1"]{box-shadow:inset 3px 0 #4da3ff}.slx-stock-row-tools .slx-row-stock,.slx-stock-row-tools .slx-row-stat{display:grid;gap:2px;min-width:0}.slx-stock-row-tools b{font-size:10px}.slx-stock-row-tools span,.slx-stock-row-tools small{font-size:8px;color:#8fa0b2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.slx-stock-row-tools .good{color:#61e291}.slx-stock-row-tools .bad{color:#ff7a86}.slx-stock-row-tools .slx-row-actions{display:flex;gap:4px;justify-content:flex-end}.slx-stock-row-tools button{border:1px solid #415369;border-radius:7px;background:#17212c;color:#ecf4ff;padding:6px 7px;font:800 9px Arial}.slx-stock-row-tools button.primary{border-color:#2c8b52;color:#7ee09f;background:#102a1d}.slx-stock-row-tools button.danger{border-color:#8c3140;color:#ff7a86;background:#2b1016}.slx-stock-row-tools button:disabled{opacity:.38}.slx-stock-row-tools .slx-row-progress{height:4px;border-radius:999px;background:#202d3a;overflow:hidden;margin-top:2px}.slx-stock-row-tools .slx-row-progress i{display:block;height:100%;background:linear-gradient(90deg,#2c8b52,#6bdc97);border-radius:999px}.slx-stock-row-tools .slx-row-progress-label{font-size:7px!important}.slx-stock-row-tools .slx-row-quick{grid-column:1/-1;display:grid;grid-template-columns:minmax(76px,120px) 72px 72px;gap:5px;justify-content:end;border-top:1px dashed #243548;padding-top:6px}.slx-stock-row-tools .slx-row-quick select{border:1px solid #415369;border-radius:7px;background:#17212c;color:#ecf4ff;padding:6px;font:800 9px Arial}
.slx-stock-row-tools .slx-fav{font-size:13px!important;padding:3px 6px!important;color:#ffd36b}.slx-stock-row-tools .slx-row-progress-label{white-space:normal!important}#slx-stock-inline .slx-v070-toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}#slx-stock-inline .slx-v070-toolbar input[type="search"]{flex:1;min-width:130px}#slx-stock-inline .slx-v070-toolbar label{display:flex;align-items:center;gap:4px;font-size:9px;color:#9fb0c0}#slx-stock-inline .slx-v070-toolbar input[type="checkbox"]{width:auto}#slx-stock-inline[data-compact="1"] .slx-inline-summary,#slx-stock-inline[data-compact="1"] .slx-inline-presets{display:none!important}#slx-stock-inline .slx-inline-advanced{display:grid;gap:8px;padding-top:9px;margin-top:2px;border-top:1px solid #243548}#slx-stock-inline #slx-inline-settings[data-active="1"]{border-color:#3b8ec9;color:#9bd5ff;background:#123653}#slx-stock-inline .slx-v070-toolbar select{max-width:140px}#slx-stock-inline .slx-v070-toolbar #slx-exec-rebalance{border-color:#3b8ec9;color:#9bd5ff}#slx-stock-inline .slx-v070-toolbar #slx-sell-cash-target{border-color:#8b6a1f;color:#ffd36b}@media(max-width:600px){#slx-stock-inline .slx-stock-view-controls{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-stock-view-controls button{grid-column:1/3}.slx-stock-row-tools{grid-template-columns:58px 1fr 1fr!important;gap:5px!important;padding:7px!important}.slx-stock-row-tools .slx-row-stat:nth-child(4){grid-column:1/3}.slx-stock-row-tools .slx-row-actions{grid-column:1/4;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))}.slx-stock-row-tools button{padding:7px 4px!important}.slx-stock-row-tools .slx-row-quick{grid-column:1/4;grid-template-columns:1fr 1fr 1fr;justify-content:stretch}.slx-stock-row-tools .slx-row-quick select{width:100%;padding:7px 4px}#slx-stock-inline .slx-inline-roi-row{grid-template-columns:58px 42px 62px 1fr}#slx-stock-inline .slx-inline-roi-row button{grid-row:auto;grid-column:4}#slx-stock-inline .slx-inline-roi-row small{grid-column:1/5}#slx-stock-inline .slx-inline-trade-card{grid-template-columns:1fr}#slx-stock-inline .slx-inline-mini-actions{justify-content:flex-end}#slx-stock-inline .slx-inline-summary{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-nav{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-target{grid-template-columns:1fr 86px}#slx-stock-inline .slx-inline-actions{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-presets{grid-template-columns:repeat(3,minmax(0,1fr))}#slx-stock-panel .rebalance-controls{grid-template-columns:1fr}#slx-stock-panel .rebalance-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .rebalance-row{grid-template-columns:1fr 1fr}#slx-stock-panel .optimizer-controls{grid-template-columns:1fr}#slx-stock-panel .optimizer-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .optimizer-row{grid-template-columns:1fr 1fr}.optimizer-row>div:nth-child(5){grid-column:1/3}#slx-stock-panel .safety-grid{grid-template-columns:1fr}#slx-stock-panel .action-row{grid-template-columns:1fr 1fr}.action-row span:nth-child(n+3){grid-column:2/3}#slx-stock-panel .grid{grid-template-columns:1fr}#slx-stock-panel .benefit-row{grid-template-columns:42px 1fr 85px 58px}.benefit-row small{grid-column:2/5}#slx-stock-panel .roi-row{grid-template-columns:65px 55px 70px}.roi-row span:nth-child(n+4){grid-column:2/4}#slx-stock-panel .trade-card{grid-template-columns:1fr 1fr}.trade-actions{grid-column:1/3}#slx-stock-panel .portfolio-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .portfolio-row{grid-template-columns:1fr 1fr}#slx-stock-panel .adv-row{grid-template-columns:56px 1fr 1fr;}.adv-row span:nth-child(4),.adv-row span:nth-child(5){grid-column:2/4}#slx-stock-panic{top:auto;bottom:88px;right:12px}}
`;

    s.textContent += `

`;
    (document.head||document.documentElement).appendChild(s);
  }

  function panel() {
    if(S.panel?.isConnected) return S.panel;
    const p=document.createElement('div'); p.id='slx-stock-panel';
    p.innerHTML=`<div class="card"><div class="head"><div>📊</div><h2>${APP.name} <span class="muted">v${APP.version}</span></h2><button class="close" type="button">×</button></div><div class="body">
      <div class="section"><div class="api-head"><div class="title">Torn API Key</div><span id="slx-stock-api-badge" class="api-badge">${get(K.api)?'Saved':'Not configured'}</span></div>
        <div class="api-key-row"><input id="slx-stock-api" type="password" autocomplete="off" placeholder="Paste Torn API key"><button id="slx-api-show" type="button" title="Show / hide API key">👁</button></div>
        <div class="actions slx-api-actions"><button id="slx-api-save" class="primary" type="button">Save Key</button><button id="slx-api-test" type="button">Test & Sync</button><button id="slx-api-create" type="button">Create Required Key</button><button id="slx-api-clear" class="danger" type="button">Clear</button></div>
        <div class="api-help">Required selections: <b>user → money, stocks</b> and <b>torn → stocks</b>. The key is stored locally in this script.</div>
      </div>
      <div class="section"><div class="title">Vault & Panic v2</div><div class="grid slx-vault-grid">
        <label>Primary target <select id="slx-stock-target"><option value="">Sync API or open Stocks to detect symbols</option></select></label>
        <label>Fallback target <select id="slx-panic-fallback"><option value="">None</option></select></label>
        <button id="slx-vault-keep" type="button">Vault (Keep)</button>
        <label>Vault keep cash <input id="slx-stock-keep" value="${esc(get(K.keep,'0'))}" placeholder="e.g. 250k"></label>
        <button id="slx-withdraw" type="button">Withdraw</button>
        <label>Withdraw amount <input id="slx-stock-withdraw" value="${esc(get(K.withdraw,'1m'))}" placeholder="e.g. 1m"></label>
        <button id="slx-vault-max" class="primary" type="button">Vault Max</button>
        <button id="slx-withdraw-all" class="danger" type="button">Withdraw All</button>
      </div>
      <input id="slx-panic-keep" type="hidden" value="${esc(get(K.panicKeep,get(K.keep,'0')))}">
      <input id="slx-panic-max" type="hidden" value="${esc(get(K.panicMax,'0'))}">
      <div class="actions slx-safety-options"><label><input id="slx-benefit-lock" type="checkbox"> Lock Benefits</label><label><input id="slx-panic-confirm" type="checkbox"> Confirm Panic</label><label><input id="slx-panic-use-all" type="checkbox"> PANIC uses 100% cash</label><button id="slx-panic-preview-btn" type="button">Preview PANIC</button></div>
      <div id="slx-panic-preview" class="panic-preview">Preview shows target, exact shares, estimated spend and cash remaining before any order is sent.</div></div>
      <div class="section"><div class="title">Safety</div><div class="safety-grid"><label><input id="slx-dry-run" type="checkbox"> Dry Run · calculate/log only, never send BUY/SELL</label><div class="muted">Trades are serialized and protected by a 1.5s anti-double-click cooldown.</div></div></div>
      <div class="section"><div class="api-head"><div class="title">Transaction History</div><div><select id="slx-tx-filter"><option value="all">All</option><option value="buy">BUY</option><option value="sell">SELL</option></select> <input id="slx-tx-search" placeholder="Search symbol/status…" style="max-width:170px"></div></div><div id="slx-stock-tx-history" class="action-list muted">No transactions yet.</div></div>
      <div class="section"><div class="api-head"><div class="title">Action Log</div><button id="slx-log-clear" type="button">Clear Log</button></div><div id="slx-stock-action-log" class="action-list muted">No stock actions logged yet.</div></div>
      <div class="section"><div class="title">Portfolio</div><div id="slx-stock-portfolio-body" class="muted">Waiting for portfolio data…</div></div>
      <div class="section"><div class="title">Benefit Values</div><div class="actions"><button id="slx-benefit-fetch" class="primary" type="button">Fetch Market Values</button><button id="slx-benefit-reset" type="button">Reset Manual Values</button></div><div id="slx-stock-benefit-values" class="benefit-list"></div></div>
      <div class="section"><div class="title">Benefit ROI Advisor</div><div id="slx-stock-advisor-body" class="muted">Waiting for stock data…</div></div>
      <div class="section"><div class="title">Portfolio Optimizer</div><div class="optimizer-controls"><label>Bank APR % <input id="slx-bank-apr" inputmode="decimal" value="${esc(get(K.bankApr,'0'))}" placeholder="e.g. 70"></label><label>Minimum acceptable APR % <input id="slx-opt-min-apr" inputmode="decimal" value="${esc(get(K.optimizerMinApr,'0'))}" placeholder="e.g. 50"></label></div><div class="api-help">Bank APR is manual so the comparison uses your actual current bank return instead of a guessed rate.</div><div id="slx-stock-optimizer-body" class="muted">Waiting for portfolio data…</div></div>
      <div class="section"><div class="title">Rebalance Preview</div><div class="rebalance-controls"><label>Cash reserve <input id="slx-rebalance-reserve" value="${esc(get(K.rebalanceReserve,'0'))}" placeholder="e.g. 10m"></label><button id="slx-rebalance-preview-btn" type="button">Build Preview</button></div><div class="api-help">Preview only: proposes which excess shares could be released and where capital could move. It never executes SELL/BUY automatically.</div><div id="slx-stock-rebalance-body" class="muted">Press Build Preview after syncing API and benefit values.</div></div>
      <div class="section"><div class="title">Trade Assistant</div><div id="slx-stock-trade-body" class="trade-list muted">Waiting for ROI data…</div></div>
      <div id="slx-stock-status">Ready · open from Script Hub or Stock Manager.</div>
    </div>
<div id="slx-stock-donation-wrap">
  <div id="slx-stock-donation-row">
    <button type="button" id="slx-stock-send-money">💸 SEND MONEY</button>
    <button type="button" id="slx-stock-send-items">🎁 SEND ITEMS</button>
  </div>
</div>
<div id="slx-stock-author-footer">Made with ❤️ by&nbsp;<a href="https://www.torn.com/profiles.php?XID=2380374" target="_blank" rel="noopener noreferrer">SakaLuX [2380374]</a></div>
</div>`;
    
document.body.appendChild(p); S.panel=p; S.status=$('#slx-stock-status',p);
    $('.close',p).onclick=()=>p.dataset.open='0';
    $('#slx-stock-api',p).value=get(K.api);
    $('#slx-stock-api-badge',p).dataset.kind=get(K.api)?'idle':'idle';
    $('#slx-benefit-lock',p).checked=bool(K.benefitLock,true);
    $('#slx-panic-confirm',p).checked=bool(K.panicConfirm,false);
    $('#slx-panic-use-all',p).checked=bool(K.panicUseAll,false);
    $('#slx-dry-run',p).checked=bool(K.dryRun,true);
    $('#slx-api-show',p).onclick=()=>{const i=$('#slx-stock-api',p);i.type=i.type==='password'?'text':'password';};
    $('#slx-api-save',p).onclick=()=>{try{saveApiKeyFromPanel();}catch(e){status(e.message,'bad');}};
    $('#slx-api-test',p).onclick=async()=>{try{saveApiKeyFromPanel();await syncAllApi();}catch(e){const msg=String(e?.message||'API test failed');setApiBadge('Error','warn');status(`API test: ${msg}`,'bad');console.error(`[${APP.name}] API test failed`,e);}};
    $('#slx-api-create',p).onclick=createRequiredApiKey;
    $('#slx-api-clear',p).onclick=clearApiKey;
    $('#slx-benefit-fetch',p).onclick=()=>fetchBenefitMarketValues().catch(e=>status(e.message,'bad'));
    $('#slx-benefit-reset',p).onclick=()=>{if(confirm('Reset all manual benefit values/frequencies?')){del(K.benefitValues);renderBenefitValues();renderAdvisor();renderTradeAssistant();status('Manual benefit values reset.','ok');}};
    $('#slx-stock-keep',p).onchange=e=>set(K.keep,e.target.value);
    $('#slx-stock-withdraw',p).onchange=e=>set(K.withdraw,e.target.value);
    $('#slx-panic-keep',p).onchange=e=>set(K.panicKeep,e.target.value);
    $('#slx-panic-max',p).onchange=e=>set(K.panicMax,e.target.value);
    $('#slx-benefit-lock',p).onchange=e=>set(K.benefitLock,e.target.checked?'1':'0');
    $('#slx-panic-confirm',p).onchange=e=>set(K.panicConfirm,e.target.checked?'1':'0');
    $('#slx-panic-use-all',p).onchange=e=>{set(K.panicUseAll,e.target.checked?'1':'0');status(`PANIC 100% cash mode ${e.target.checked?'enabled':'disabled'}.`,e.target.checked?'warn':'ok');};
    $('#slx-panic-fallback',p).onchange=e=>set(K.panicFallback,e.target.value);
    $('#slx-panic-preview-btn',p).onclick=()=>previewPanic().catch(()=>{});
    $('#slx-dry-run',p).onchange=e=>{set(K.dryRun,e.target.checked?'1':'0');status(`Dry Run ${e.target.checked?'enabled':'disabled'}.`,e.target.checked?'warn':'ok');};
    $('#slx-log-clear',p).onclick=clearActionLog;
    $('#slx-bank-apr',p).onchange=e=>{set(K.bankApr,String(Math.max(0,Number(e.target.value)||0)));renderAdvisor();renderOptimizer();renderTradeAssistant();};
    $('#slx-opt-min-apr',p).onchange=e=>{set(K.optimizerMinApr,String(Math.max(0,Number(e.target.value)||0)));renderOptimizer();};
    $('#slx-rebalance-reserve',p).onchange=e=>{set(K.rebalanceReserve,e.target.value);renderRebalancePreview();};
    $('#slx-rebalance-preview-btn',p).onclick=()=>safeRender('Rebalance Preview',renderRebalancePreview);
    $('#slx-stock-target',p).onchange=e=>{set(K.target,e.target.value);const v=$('#slx-panic-preview',p);if(v){v.dataset.kind='';v.textContent='Target changed · run Preview PANIC again.';}renderPortfolio();renderAdvisor();renderOptimizer();};
    $('#slx-vault-max',p).onclick=()=>vault().then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    $('#slx-vault-keep',p).onclick=()=>vault({keep:parseAmount($('#slx-stock-keep',p).value)}).then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    $('#slx-withdraw',p).onclick=()=>withdrawCash(parseAmount($('#slx-stock-withdraw',p).value)).then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    $('#slx-withdraw-all',p).onclick=()=>withdrawAll().then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    return p;
  }

  document.getElementById('slx-stock-send-money')?.addEventListener('click',()=>{ location.href='https://www.torn.com/sendcash.php#/XID=2380374'; });
  document.getElementById('slx-stock-send-items')?.addEventListener('click',()=>{ location.href='https://www.torn.com/item.php#giveItems'; });

  function refreshTargetSelect() {
    if(!S.panel?.isConnected) return;
    scanStocks();
    const primary=$('#slx-stock-target',S.panel), fallback=$('#slx-panic-fallback',S.panel);
    const current=get(K.target).toUpperCase(), currentFallback=get(K.panicFallback).toUpperCase();
    const list=[...S.stocks.keys()].sort();
    if(primary) primary.innerHTML='<option value="">Select stock…</option>'+list.map(sym=>`<option value="${esc(sym)}" ${sym===current?'selected':''}>${esc(sym)} · ${money(S.stocks.get(sym).price)}</option>`).join('');
    if(fallback) fallback.innerHTML='<option value="">None</option>'+list.map(sym=>`<option value="${esc(sym)}" ${sym===currentFallback?'selected':''}>${esc(sym)} · ${money(S.stocks.get(sym).price)}</option>`).join('');
  }

  function premiumStyle() {
    if($('#slx-stock-premium-style')) return;
    const st=document.createElement('style');
    st.id='slx-stock-premium-style';
    st.textContent=`
:root{--slx-surface:#101720;--slx-surface-2:#18212d;--slx-surface-3:#0b1118;--slx-border:rgba(142,170,201,.22);--slx-border-strong:#41536b;--slx-text:#f2f6fb;--slx-muted:#8fa1b5;--slx-accent:#dfbd61;--slx-blue:#4f8fe8;--slx-green:#59d88a;--slx-red:#ff6b78}
#slx-stock-panel{background:rgba(3,7,11,.84);backdrop-filter:blur(10px);font-family:Inter,Arial,sans-serif;padding:52px 8px 90px}
#slx-stock-panel .card{width:min(780px,100%);background:linear-gradient(180deg,rgba(16,23,32,.995),rgba(9,14,20,.995));border:1px solid rgba(255,255,255,.10);border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.04)}
#slx-stock-panel .head{padding:16px;background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.20),transparent 42%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-bottom:1px solid var(--slx-border)}
#slx-stock-panel h2{font-size:17px;letter-spacing:.01em;color:var(--slx-text)}
#slx-stock-panel .body{padding:12px;gap:10px;background:linear-gradient(180deg,rgba(255,255,255,.012),transparent)}
#slx-stock-panel .section{border:1px solid var(--slx-border);border-radius:14px;padding:11px;background:linear-gradient(180deg,rgba(21,31,42,.92),rgba(12,19,27,.96));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
#slx-stock-panel .title{color:#a9c8ef;font-size:10px;letter-spacing:.11em}
#slx-stock-panel button,#slx-stock-panel select,#slx-stock-panel input,#slx-stock-inline button,#slx-stock-inline select,#slx-stock-inline input{min-height:38px;border:1px solid var(--slx-border-strong);border-radius:11px;background:linear-gradient(180deg,#202c3a,#17212d);color:#e9f0f7;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;transition:border-color .15s ease,background .15s ease,transform .08s ease}
#slx-stock-panel button,#slx-stock-inline button{font-weight:850;letter-spacing:.01em}
#slx-stock-panel button:active,#slx-stock-inline button:active{transform:scale(.985)}
#slx-stock-panel button:hover,#slx-stock-inline button:hover{border-color:#5b7390;background:linear-gradient(180deg,#263448,#192532)}
#slx-stock-panel .primary,#slx-stock-inline .primary{border-color:#2f7854;background:linear-gradient(180deg,#173f2b,#102d20);color:#7ee0a5}
#slx-stock-panel .danger,#slx-stock-inline .danger{border-color:#8b3543;background:linear-gradient(180deg,#401821,#2b1016);color:#ff8c97}
#slx-stock-inline{margin:10px 0 14px;border:1px solid rgba(255,255,255,.10);border-radius:20px;background:linear-gradient(180deg,rgba(11,17,24,.995),rgba(7,12,18,.995));box-shadow:0 18px 52px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.035);font-family:Inter,Arial,sans-serif}
#slx-stock-inline .slx-inline-head{padding:14px 14px 13px;background:radial-gradient(circle at 10% -30%,rgba(79,143,232,.22),transparent 45%),linear-gradient(155deg,#18212d,#101720 72%);border-bottom:1px solid var(--slx-border)}
#slx-stock-inline .slx-inline-head b{font-size:15px;color:var(--slx-text)}
#slx-stock-inline .slx-inline-head small{font-size:9px;color:#7f94aa;font-weight:750;letter-spacing:.07em}
#slx-stock-inline .slx-inline-head-actions button{min-width:42px;padding:7px 9px}
#slx-stock-inline .slx-inline-body{padding:12px;gap:10px}
#slx-stock-inline .slx-inline-summary{gap:7px}
#slx-stock-inline .slx-inline-summary>div{padding:10px;border:1px solid var(--slx-border);border-radius:12px;background:linear-gradient(180deg,rgba(24,35,47,.86),rgba(15,23,32,.92));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
#slx-stock-inline .slx-inline-summary span{font-size:8px;text-transform:uppercase;letter-spacing:.07em;color:#8296aa}
#slx-stock-inline .slx-inline-summary b{font-size:13px;color:#edf4fb}
#slx-stock-inline .slx-inline-nav{gap:7px}
#slx-stock-inline .slx-inline-nav button[data-active="1"]{border-color:#6b84a2;background:linear-gradient(180deg,#29384a,#1c2937);color:#fff}
#slx-stock-inline .slx-inline-target{padding:10px;border:1px solid var(--slx-border);border-radius:13px;background:rgba(16,24,34,.72)}
#slx-stock-inline .slx-inline-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:10px;border:1px solid var(--slx-border);border-radius:13px;background:rgba(16,24,34,.72)}
#slx-stock-inline .slx-inline-actions button,#slx-stock-inline .slx-inline-actions input{width:100%}
#slx-stock-inline .slx-inline-options{padding:8px 2px;gap:12px}
#slx-stock-inline .slx-inline-options label{font-size:10px;color:#9eacbc}
#slx-stock-inline .slx-inline-presets{gap:6px}
#slx-stock-inline .slx-inline-presets button{min-height:34px;padding:6px}
#slx-stock-inline .slx-inline-config,#slx-stock-inline .slx-inline-advanced,#slx-stock-inline .slx-inline-workspace{border:1px solid var(--slx-border)!important;border-radius:13px!important;background:linear-gradient(180deg,rgba(18,27,37,.90),rgba(12,18,26,.94))!important}
#slx-stock-inline .slx-inline-note{border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(13,20,28,.72);padding:8px 10px;color:#8fa1b5}
#slx-stock-open{border:1px solid #41536b!important;border-radius:13px!important;background:linear-gradient(145deg,#263448,#17212e)!important;box-shadow:0 10px 28px rgba(0,0,0,.38),inset 0 1px rgba(255,255,255,.05)!important;color:#eaf2fb!important;font-family:Inter,Arial,sans-serif!important;padding:9px 12px!important}
#slx-stock-panic{border-radius:13px!important;box-shadow:0 10px 28px rgba(0,0,0,.42)!important}
.slx-stock-row-tools{border-color:rgba(142,170,201,.20)!important;background:linear-gradient(180deg,rgba(17,26,36,.94),rgba(10,16,23,.95))!important;border-radius:12px!important;box-shadow:inset 0 1px rgba(255,255,255,.025)}
@media(max-width:620px){#slx-stock-panel{padding:42px 5px 86px}#slx-stock-inline{border-radius:16px}#slx-stock-inline .slx-inline-head{align-items:flex-start;flex-wrap:wrap}#slx-stock-inline .slx-inline-head-actions{width:100%;display:grid;grid-template-columns:repeat(5,1fr)}#slx-stock-inline .slx-inline-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-inline .slx-inline-nav{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-inline .slx-inline-target{grid-template-columns:1fr 92px}#slx-stock-inline .slx-inline-actions{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-inline .slx-inline-presets{grid-template-columns:repeat(3,minmax(0,1fr))}}

/* Compact Stocks UI; isolated from shared userscript control styles. */
#slx-stock-panel#slx-stock-panel{inset:0!important;box-sizing:border-box!important;padding:4px 4px 36px!important;overflow:hidden!important;align-items:stretch!important;justify-content:center!important;backdrop-filter:none!important}
#slx-stock-panel#slx-stock-panel>.card{display:flex!important;flex-direction:column!important;box-sizing:border-box!important;width:min(780px,100%)!important;height:100%!important;max-height:100%!important;min-height:0!important;margin:0 auto!important;border-radius:14px!important;overflow:hidden!important}
#slx-stock-panel#slx-stock-panel .head{flex:0 0 auto!important;padding:10px 12px!important;gap:8px}
#slx-stock-panel#slx-stock-panel h2{font-size:15px!important;line-height:1.25}
#slx-stock-panel#slx-stock-panel .body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;padding:9px!important;gap:8px!important}
#slx-stock-panel#slx-stock-panel .section{padding:9px;border-radius:11px}
#slx-stock-panel#slx-stock-panel button,#slx-stock-inline#slx-stock-inline button{box-sizing:border-box!important;min-height:32px!important;padding:5px 8px!important;font-size:11px!important;line-height:1.2!important;border-radius:9px!important}
#slx-stock-panel#slx-stock-panel .close{width:32px!important;height:32px!important;flex:0 0 32px}
#slx-stock-panel#slx-stock-panel input:not([type="checkbox"]),#slx-stock-panel#slx-stock-panel select,#slx-stock-inline#slx-stock-inline input:not([type="checkbox"]):not([type="file"]),#slx-stock-inline#slx-stock-inline select{box-sizing:border-box!important;min-height:34px!important;min-width:0!important;max-width:100%!important;padding:6px 8px!important;font-size:12px!important;border-radius:9px!important}
#slx-stock-panel#slx-stock-panel .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px}
#slx-stock-panel#slx-stock-panel .grid input,#slx-stock-panel#slx-stock-panel .grid select{width:100%!important}
#slx-stock-panel#slx-stock-panel .api-key-row{grid-template-columns:minmax(0,1fr) 34px}
#slx-stock-panel#slx-stock-panel .api-key-row input{width:100%!important}
#slx-stock-panel#slx-stock-panel .actions{gap:6px;align-items:center}
#slx-stock-panel#slx-stock-panel .slx-api-actions,#slx-stock-panel#slx-stock-panel .slx-vault-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
#slx-stock-panel#slx-stock-panel .slx-safety-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
#slx-stock-panel#slx-stock-panel .slx-safety-options>label:nth-child(3),#slx-stock-panel#slx-stock-panel .slx-safety-options>button{grid-column:1/-1}
#slx-stock-panel#slx-stock-panel .actions>label,#slx-stock-panel#slx-stock-panel .safety-grid>label,#slx-stock-inline#slx-stock-inline .slx-inline-options>label,#slx-stock-inline#slx-stock-inline .slx-inline-config-actions>label{display:flex;align-items:center;gap:6px;font-size:11px;line-height:1.3}
#slx-stock-panel#slx-stock-panel input[type="checkbox"],#slx-stock-inline#slx-stock-inline input[type="checkbox"]{appearance:auto!important;box-sizing:border-box!important;width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important;max-width:18px!important;max-height:18px!important;flex:0 0 18px!important;padding:0!important;margin:0!important;accent-color:#168bea;box-shadow:none!important}
#slx-stock-panel#slx-stock-panel #slx-stock-donation-wrap{box-sizing:border-box!important;flex:0 0 28px!important;height:28px!important;min-height:28px!important;padding:4px 14px!important;margin:0!important;width:100%!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important;border-radius:10px 10px 0 0!important;overflow:hidden!important}
#slx-stock-panel#slx-stock-panel #slx-stock-donation-row{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;height:20px!important}
#slx-stock-panel#slx-stock-panel #slx-stock-donation-row button{height:20px!important;min-height:20px!important;max-height:20px!important;padding:0 4px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#151f2a!important;color:#b9c7d6!important;font-size:8px!important;font-weight:900!important;line-height:1.2!important;letter-spacing:.04em!important}
#slx-stock-panel#slx-stock-panel #slx-stock-author-footer{box-sizing:border-box!important;flex:0 0 22px!important;height:22px!important;min-height:22px!important;max-height:22px!important;padding:0 6px!important;margin:0!important;width:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;background:#080d13!important;border-top:1px solid rgba(223,154,55,.52)!important;color:#df9a37!important;font:500 9px/20px Inter,Arial,sans-serif!important;border-radius:0 0 14px 14px!important;overflow:hidden!important}
#slx-stock-panel#slx-stock-panel #slx-stock-author-footer a{color:#78aef2!important;text-decoration:none!important;font-weight:900!important}
@media(max-width:820px){
#slx-stock-panel#slx-stock-panel{inset:0 4px 36px!important;padding:0!important;background:transparent!important;border-radius:14px!important}
#slx-stock-panel#slx-stock-panel>.card{width:100%!important}
#slx-stock-panel#slx-stock-panel .head{background:linear-gradient(155deg,#18212d,#101720 72%)!important}
#slx-stock-panel#slx-stock-panel button,#slx-stock-inline#slx-stock-inline button{transition:none!important}
}
@media(max-width:340px){#slx-stock-panel#slx-stock-panel .grid{grid-template-columns:1fr!important}}


/* Keep SakaLuX controls outside Torn's native stock-column list. */
.slx-stock-row-tools[data-slx-stock-companion][data-slx-stock-companion]{position:static!important;inset:auto!important;float:none!important;clear:both!important;flex:0 0 100%!important;grid-column:1/-1!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;max-height:none!important;margin:6px 0 12px!important;padding:10px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;overflow:hidden!important;background:#101923!important;opacity:1!important;isolation:isolate;border:1px solid #34465b!important;border-radius:11px!important}
.slx-stock-row-tools[data-slx-stock-companion][hidden]{display:none!important}
.slx-stock-row-tools[data-slx-stock-companion] .slx-row-stock{grid-column:1/-1!important;display:flex!important;align-items:center;flex-wrap:wrap;gap:8px}
.slx-stock-row-tools[data-slx-stock-companion] b{font-size:12px!important;line-height:1.3}
.slx-stock-row-tools[data-slx-stock-companion] span,.slx-stock-row-tools[data-slx-stock-companion] small{font-size:10px!important;line-height:1.35!important;white-space:normal!important;overflow-wrap:anywhere}
.slx-stock-row-tools[data-slx-stock-companion] .slx-row-actions{grid-column:1/-1!important;display:grid!important;grid-template-columns:32px repeat(3,minmax(0,1fr))!important;gap:6px!important}
.slx-stock-row-tools[data-slx-stock-companion] .slx-row-quick{grid-column:1/-1!important;display:grid!important;grid-template-columns:minmax(0,1fr) repeat(2,minmax(60px,80px))!important;gap:6px!important;justify-content:stretch!important}
.slx-stock-row-tools[data-slx-stock-companion] button,.slx-stock-row-tools[data-slx-stock-companion] select{box-sizing:border-box!important;min-width:0!important;width:100%!important;height:30px!important;min-height:30px!important;padding:4px 6px!important;font-size:10px!important;line-height:1.2!important}
#slx-stock-inline#slx-stock-inline{position:static!important;float:none!important;clear:both!important;flex:0 0 100%!important;grid-column:1/-1!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
@media(max-width:820px){
.slx-stock-row-tools[data-slx-stock-companion][data-slx-stock-companion]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.slx-stock-row-tools[data-slx-stock-companion] .slx-row-stat:nth-child(4){grid-column:1/-1!important}
.slx-stock-row-tools[data-slx-stock-companion] .slx-row-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}
#slx-stock-inline#slx-stock-inline .slx-inline-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}
#slx-stock-inline#slx-stock-inline .slx-inline-summary span{font-size:10px!important}
#slx-stock-inline#slx-stock-inline .slx-inline-summary b{font-size:12px!important}
}

`;
    document.head.appendChild(st);
  }


  /* SAKALUX_STOCKS_PANEL_CHROME_V0714 */
  function normalizeStockPanelChrome() {
    const p=S.panel||$('#slx-stock-panel'); if(!p) return;
    p.style.setProperty('z-index','2147483646','important');
    const card=p.querySelector('.card');
    const head=p.querySelector('.head');
    if(head && !head.querySelector('#slx-stock-api-trigger')) {
      const b=document.createElement('button');
      b.id='slx-stock-api-trigger'; b.type='button'; b.title='API Access'; b.textContent='🔑';
      b.className='slx-stock-api-trigger'; b.onclick=openStockApiSheet;
      const close=head.querySelector('.close, [data-close], button:last-child');
      if(close) head.insertBefore(b,close); else head.appendChild(b);
    }
    const oldInput=p.querySelector('.section #slx-stock-api');
    const oldSection=oldInput?.closest('.section');
    if(oldSection) oldSection.remove();
    if(!document.getElementById('slx-stock-api-sheet-style')) {
      const st=document.createElement('style'); st.id='slx-stock-api-sheet-style';
      st.textContent=`
#slx-stock-panel{z-index:2147483646!important}
#slx-stock-panel .slx-stock-api-trigger{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;padding:0!important;border:1px solid #78621b!important;background:#29240f!important;color:#f5d85f!important;font-size:17px!important}
#slx-stock-api-sheet{position:absolute!important;inset:0!important;z-index:20!important;background:#0b1118!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
#slx-stock-api-sheet .slx-api-sheet-head{display:flex!important;align-items:center!important;gap:8px!important;padding:12px!important;border-bottom:1px solid #34465b!important;background:linear-gradient(155deg,#18212d,#101720 72%)!important}
#slx-stock-api-sheet .slx-api-sheet-head>div{flex:1!important}.slx-api-sheet-title{font-size:16px!important;font-weight:900!important}.slx-api-sheet-sub{font-size:9px!important;color:#93a4b7!important;margin-top:2px!important}
#slx-stock-api-sheet .slx-api-sheet-close{width:36px!important;height:36px!important;padding:0!important;font-size:20px!important}
#slx-stock-api-sheet .slx-api-sheet-body{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;padding:12px!important;display:grid!important;gap:9px!important}
#slx-stock-api-sheet .slx-api-box{padding:10px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#111a24!important;font-size:11px!important;line-height:1.45!important}
#slx-stock-api-sheet input{width:100%!important;box-sizing:border-box!important}.slx-api-sheet-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important}
#slx-stock-api-sheet .slx-api-primary{background:#194f86!important;border-color:#2e77b9!important}.slx-api-sheet-result{font-size:10px!important;color:#93a4b7!important;min-height:18px!important}
`;
      (document.head||document.documentElement).appendChild(st);
    }
    if(card) card.style.position='relative';
  }

  function openStockApiSheet() {
    normalizeStockPanelChrome();
    const p=S.panel||$('#slx-stock-panel'); const card=p?.querySelector('.card'); if(!card) return;
    card.querySelector('#slx-stock-api-sheet')?.remove();
    const sheet=document.createElement('div'); sheet.id='slx-stock-api-sheet';
    const local=String(get(K.api,'')||'');
    const initial=stockApiAccess();
    sheet.innerHTML=`<div class="slx-api-sheet-head"><div><div class="slx-api-sheet-title">🔑 Stock Manager API Access</div><div class="slx-api-sheet-sub">SakaLuX Stock Manager & Advisor v${APP.version}</div></div><button type="button" class="slx-api-sheet-close">×</button></div>
      <div class="slx-api-sheet-body">
        <div class="slx-api-box slx-stock-api-required"><b>Exact Torn permissions required</b><br>User: Money, Stocks<br>Torn: Stocks<br>No write permission is requested.</div>
        <button type="button" class="slx-api-primary" id="slx-stock-api-create">🔑 CREATE STOCK API KEY</button>
        <div class="slx-api-box">
          <div class="slx-stock-api-status" id="slx-stock-api-status"><b>TORN API ACCESS</b><span>${initial.key?'READY':'NOT CHECKED'}</span></div>
          <div id="slx-stock-api-source" class="slx-api-source">Active source: <b>${esc(initial.source)}</b></div>
          <div class="slx-api-note">The SakaLuX Hub general key is used automatically first when Hub is installed and active. The local key below remains the standalone fallback.</div>
          <label>Replace / paste standalone Torn API key</label>
          <input id="slx-stock-api-sheet-input" type="password" autocomplete="off" placeholder="Paste Torn API key here" value="${esc(local)}">
          <div class="slx-api-sheet-actions"><button type="button" class="slx-api-primary" id="slx-stock-api-save">SAVE & TEST</button><button type="button" id="slx-stock-api-check">CHECK ACCESS</button></div>
          <button type="button" id="slx-stock-api-clear">CLEAR LOCAL TORN KEY</button>
          <div class="slx-api-sheet-result" id="slx-stock-api-result" role="status" aria-live="polite">${initial.shared?'Hub key detected · it will be used automatically.':initial.key?'Local key detected.':'No API key configured.'}</div>
        </div>
      </div>`;
    card.appendChild(sheet);
    const result=sheet.querySelector('#slx-stock-api-result'), input=sheet.querySelector('#slx-stock-api-sheet-input');
    const statusBox=sheet.querySelector('#slx-stock-api-status'), sourceBox=sheet.querySelector('#slx-stock-api-source');
    const refreshSource=()=>{
      const access=stockApiAccess();
      sourceBox.innerHTML='Active source: <b>'+esc(access.source)+'</b>';
      statusBox.className='slx-stock-api-status '+(access.key?'ok':'missing');
      statusBox.querySelector('span').textContent=access.key?'READY':'MISSING';
      return access;
    };
    sheet.querySelector('.slx-api-sheet-close').onclick=()=>sheet.remove();
    sheet.querySelector('#slx-stock-api-create').onclick=createRequiredApiKey;
    const run=async save=>{
      const typed=String(input.value||'').trim();
      if(save&&!typed){result.textContent='Paste a Torn API key first.';input.focus();return;}
      if(save)set(K.api,typed);
      const active=stockApiAccess();
      const testKey=save?typed:(typed||active.key);
      if(!testKey){result.textContent='No API key configured in Hub or locally.';refreshSource();return;}
      const buttons=[sheet.querySelector('#slx-stock-api-save'),sheet.querySelector('#slx-stock-api-check')];
      buttons.forEach(b=>b.disabled=true);result.textContent='Checking Money, User Stocks and Torn Stocks access…';
      statusBox.className='slx-stock-api-status checking';statusBox.querySelector('span').textContent='CHECKING…';
      try{
        await syncAllApi(testKey);
        result.textContent=(save?'Local key saved and tested. ':'')+'Money: OK · User Stocks: OK · Torn Stocks: OK';
        statusBox.className='slx-stock-api-status ok';statusBox.querySelector('span').textContent='ACCESS OK ✓';
        refreshSource();
        refreshInlinePanel();
        if(S.panel?.dataset.open==='1'){renderPortfolio();renderAdvisor();renderOptimizer();renderTradeAssistant();}
      } catch(e){
        result.textContent='API check failed: '+String(e?.message||e);
        statusBox.className='slx-stock-api-status error';statusBox.querySelector('span').textContent='CHECK FAILED';
      } finally { buttons.forEach(b=>b.disabled=false); }
    };
    sheet.querySelector('#slx-stock-api-save').onclick=()=>run(true);
    sheet.querySelector('#slx-stock-api-check').onclick=()=>run(false);
    sheet.querySelector('#slx-stock-api-clear').onclick=()=>{
      del(K.api);input.value='';
      const access=refreshSource();
      result.textContent=access.shared?'Local key cleared · SakaLuX Hub key remains active.':'Local API key cleared.';
      refreshInlinePanel();
    };
  }

  function openPanel() { style(); premiumStyle(); const p=panel(); normalizeStockPanelChrome(); const legacyApi=p.querySelector('#slx-stock-api')?.closest('.section'); if(legacyApi) legacyApi.style.setProperty('display','none','important'); p.dataset.open='1'; safeRender('Targets',refreshTargetSelect); safeRender('Portfolio',renderPortfolio); safeRender('Benefit Values',renderBenefitValues); safeRender('ROI Advisor',renderAdvisor); safeRender('Portfolio Optimizer',renderOptimizer); safeRender('Rebalance Preview',renderRebalancePreview); safeRender('Trade Assistant',renderTradeAssistant); safeRender('Transaction History',renderTransactionHistory); safeRender('Action Log',renderActionLog); safeRender('Advisor Suite',renderAdvisorSuiteV080); }

  function managerLauncher() { $('#slx-stock-open')?.remove(); }

  function restoreCache() { try { S.portfolio=JSON.parse(get(K.tx,'{}'))||{}; } catch {} }

  let inlineMountTimer=0, lastSpaRefresh=0, lastHref=location.href;
  function scheduleInlineMount(force=false) {
    if(!bool(K.enabled,true)) return;
    // Coalesce busy-page mutations without postponing the pending mount.
    if(inlineMountTimer && !force) return;
    clearTimeout(inlineMountTimer);
    const delay=force?40:360;
    inlineMountTimer=setTimeout(()=>{
      inlineMountTimer=0;
      if(!bool(K.enabled,true)) return;
      const now=Date.now();
      if(!force && now-lastSpaRefresh<300) return;
      lastSpaRefresh=now;
      if(isStocks()) {
        mountInlinePanel();
        scanStocks();
        refreshInlinePanel();
      } else {
        $('#slx-stock-inline')?.remove();
        $$('.slx-stock-row-tools').forEach(x=>x.remove());
      }
      managerLauncher();
      if(!$('#slx-stock-panic')) panicButton();
    },delay);
  }


  let runtimeObserver=null, stockPollTimer=0, stockPollStop=0;
  function hubPresent() {
    return Boolean(window.SakaLuXScriptHub || document.documentElement?.getAttribute('data-sakalux-hub-installed')==='1');
  }
  function syncModuleBridge() {
    const b=$('#sakalux-module-bridge-stock-manager-advisor');
    if(b){b.dataset.version=APP.version;b.dataset.enabled=String(bool(K.enabled,true));}
  }
  function registerModule() {
    let b=$('#sakalux-module-bridge-stock-manager-advisor');
    if(!b){b=document.createElement('button');b.type='button';b.id='sakalux-module-bridge-stock-manager-advisor';b.hidden=true;document.body.appendChild(b);}
    b.onclick=()=>{
      const action=b.dataset.action||'open';b.dataset.action='';
      if(action==='open') moduleOpen();
      else if(action==='on'||action==='off') setEnabled(action==='on');
      else if(action==='toggle') setEnabled(!bool(K.enabled,true));
      else if(action==='refresh') moduleRefresh().catch(e=>status(e.message,'bad'));
      syncModuleBridge();
    };
    window.SakaLuXStockManagerAdvisor={
      name:APP.name,version:APP.version,open:moduleOpen,refresh:moduleRefresh,setEnabled,
      toggleEnabled:()=>setEnabled(!bool(K.enabled,true)),isEnabled:()=>bool(K.enabled,true),
      goToStocks:()=>{location.href=APP.stocksUrl;},
      health:()=>({ready:true,version:APP.version,enabled:bool(K.enabled,true),apiConfigured:Boolean(getStockApiKey()),apiSource:stockApiAccess().source,dryRun:isDryRun(),tradeBusy:S.tradeBusy})
    };
    syncModuleBridge();
    window.dispatchEvent(new CustomEvent('SakaLuX:ModuleReady',{detail:{id:'stock-manager-advisor',name:APP.name,version:APP.version,actions:['OPEN','REFRESH']}}));
  }
  function moduleOpen() {if(!bool(K.enabled,true))setEnabled(true);openPanel();}
  async function moduleRefresh() {
    if(!bool(K.enabled,true))return false;
    scanStocks();
    if(getStockApiKey()) await syncAllApi();
    if(!bool(K.enabled,true))return false;
    if(isStocks()){mountInlinePanel();refreshInlinePanel();}
    if(S.panel?.dataset.open==='1')openPanel();
    return true;
  }
  function stopRuntime() {
    runtimeObserver?.disconnect();runtimeObserver=null;
    clearTimeout(inlineMountTimer);clearInterval(stockPollTimer);clearTimeout(stockPollStop);
    stockPollTimer=0;stockPollStop=0;
    $('#slx-stock-open')?.remove();$('#slx-stock-inline')?.remove();
    $$('.slx-stock-row-tools').forEach(x=>x.remove());
    if(S.panel)S.panel.dataset.open='0';
  }
  function setEnabled(value) {
    const enabled=Boolean(value);
    if(enabled===bool(K.enabled,true)){syncModuleBridge();return enabled;}
    set(K.enabled,enabled?'1':'0');
    if(enabled)init();else stopRuntime();
    syncModuleBridge();
    window.dispatchEvent(new CustomEvent('SakaLuXStockManagerAdvisorStateChanged',{detail:{enabled,version:APP.version}}));
    return enabled;
  }

  async function init() {
    style(); panicButton();
    if(!bool(K.enabled,true)||runtimeObserver)return;
    premiumStyle(); restoreCache(); managerLauncher();
    if(isStocks()) setTimeout(()=>scheduleInlineMount(true),220);
    try { if(sessionStorage.getItem('SakaLuX_STOCK_KEY_SETUP_PENDING')==='1'){sessionStorage.removeItem('SakaLuX_STOCK_KEY_SETUP_PENDING');setTimeout(()=>{if(bool(K.enabled,true))openPanel();},700);} } catch {}
    if(isStocks()) {
      stockPollTimer=setInterval(()=>{ if(!bool(K.enabled,true))return; if(scanStocks().size){clearInterval(stockPollTimer); scheduleInlineMount(true); if(S.panel?.dataset.open==='1'){refreshTargetSelect();renderAdvisor();} if(get(K.panicPending)==='1') panic();}},650);
      stockPollStop=setTimeout(()=>clearInterval(stockPollTimer),10000);
    }
    const mo=new MutationObserver(records=>{
      const hrefChanged=location.href!==lastHref;
      if(hrefChanged) lastHref=location.href;
      const own='#slx-stock-panel,#slx-stock-inline,#slx-stock-open,#slx-stock-panic,.slx-stock-row-tools,[id^="sakalux-module-bridge-"]';
      managerLauncher();
      const relevant=hrefChanged || (isStocks() && records.some(r=>{
        const target=r.target.nodeType===1?r.target:r.target.parentElement;
        if(target?.closest?.(own))return false;
        return [...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches?.(own));
      }));
      if(relevant) scheduleInlineMount(hrefChanged);
    });
    runtimeObserver=mo;
    mo.observe(document.body||document.documentElement,{subtree:true,childList:true});
  }

  registerModule();
  window.addEventListener('popstate',()=>scheduleInlineMount(true));
  window.addEventListener('hashchange',()=>scheduleInlineMount(true));
  init();
})();

/* SAKALUX_STOCK_API_ELIMINATION_LAYOUT_V0716 */
(()=>{
 const st=document.createElement('style');st.id='sakalux-stock-api-elimination-layout-v0716';st.textContent=`
#slx-stock-panel#slx-stock-panel{z-index:2147483646!important}
#slx-stock-panel .head{display:flex!important;align-items:center!important;gap:7px!important;padding:8px 10px!important;min-height:54px!important}
#slx-stock-panel .head>div:first-child{min-width:0!important;flex:1 1 auto!important}
#slx-stock-panel .head button,#slx-stock-panel .slx-stock-api-trigger{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;max-width:38px!important;max-height:38px!important;padding:0!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important}
#slx-stock-api-sheet#slx-stock-api-sheet{position:absolute!important;inset:8px!important;z-index:2147483647!important;display:flex!important;flex-direction:column!important;min-height:0!important;max-height:calc(100% - 16px)!important;padding:0!important;overflow:hidden!important;border:1px solid #3c4652!important;border-radius:14px!important;background:#0b1118!important;box-shadow:0 18px 48px rgba(0,0,0,.55)!important}
#slx-stock-api-sheet .slx-api-sheet-head{display:flex!important;align-items:center!important;gap:8px!important;flex:0 0 58px!important;height:58px!important;padding:8px 10px!important;border-bottom:1px solid #2d3d50!important;background:linear-gradient(155deg,#18212d,#101720 72%)!important}
#slx-stock-api-sheet .slx-api-sheet-head>div{min-width:0!important;flex:1!important}
#slx-stock-api-sheet .slx-api-sheet-title{font-size:15px!important;font-weight:900!important;line-height:1.15!important}
#slx-stock-api-sheet .slx-api-sheet-sub{font-size:9px!important;color:#93a4b7!important;margin-top:2px!important}
#slx-stock-api-sheet .slx-api-sheet-close{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;padding:0!important;border-radius:10px!important;font-size:20px!important}
#slx-stock-api-sheet .slx-api-sheet-body{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;padding:10px!important;display:flex!important;flex-direction:column!important;gap:8px!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
#slx-stock-api-sheet .slx-api-box{margin:0!important;padding:10px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#111a24!important;font-size:11px!important;line-height:1.45!important}
#slx-stock-api-sheet .slx-api-box p{margin:5px 0!important;color:#93a4b7!important}
#slx-stock-api-sheet label{display:block!important;margin:5px 0 4px!important;font-size:10px!important;color:#c7d2df!important}
#slx-stock-api-sheet input{width:100%!important;height:40px!important;min-height:40px!important;margin:0!important;padding:8px 10px!important;box-sizing:border-box!important;border-radius:9px!important}
#slx-stock-api-sheet button{min-height:40px!important;height:40px!important;margin:0!important;border-radius:10px!important;font-size:11px!important;font-weight:900!important;line-height:1.1!important}
#slx-stock-api-sheet #slx-stock-api-create{width:100%!important;background:linear-gradient(180deg,#a87b17,#79550e)!important;border-color:#c79b34!important;color:#fff!important}
#slx-stock-api-sheet .slx-api-sheet-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:0!important}
#slx-stock-api-sheet .slx-api-sheet-actions button{width:100%!important;min-width:0!important}
#slx-stock-api-sheet #slx-stock-api-save,#slx-stock-api-sheet #slx-stock-api-check{background:linear-gradient(180deg,#377fcf,#275f9f)!important;border-color:#3d78bf!important;color:#fff!important}
#slx-stock-api-sheet #slx-stock-api-clear{width:100%!important;background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
#slx-stock-api-sheet .slx-api-sheet-result{min-height:16px!important;margin:0!important;font-size:10px!important;color:#93a4b7!important;overflow-wrap:anywhere!important}
#slx-stock-api-sheet .slx-stock-api-required{border-color:#66591d!important;background:#211d10!important;color:#e4c95d!important}
#slx-stock-api-sheet .slx-api-source,#slx-stock-api-sheet .slx-api-note{margin:8px 0!important;color:#9ca3af!important;font-size:9px!important;line-height:1.45!important}
#slx-stock-api-sheet .slx-stock-api-status{display:flex!important;justify-content:space-between!important;gap:8px!important;padding:8px!important;margin-bottom:8px!important;border-radius:7px!important;background:#181d24!important;font-size:10px!important;line-height:1.35!important}
#slx-stock-api-sheet .slx-stock-api-status b{color:#d7b94c!important}
#slx-stock-api-sheet .slx-stock-api-status.ok span{color:#78d98b!important}
#slx-stock-api-sheet .slx-stock-api-status.error span,#slx-stock-api-sheet .slx-stock-api-status.missing span{color:#f08b8b!important}
#slx-stock-api-sheet .slx-api-sheet-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;width:100%!important;margin:2px 0 0!important}
#slx-stock-api-sheet .slx-api-sheet-actions>button{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:none!important;height:42px!important;min-height:42px!important;margin:0!important;padding:0 8px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:normal!important;line-height:1.15!important}
#slx-stock-api-sheet #slx-stock-api-clear{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-width:0!important;max-width:none!important;height:42px!important;min-height:42px!important;margin:0!important;padding:0 8px!important;text-align:center!important;background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
#slx-stock-api-sheet #slx-stock-api-create{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:42px!important;min-height:42px!important;margin:0!important;text-align:center!important}
#slx-stock-api-sheet .slx-api-sheet-result{width:100%!important;box-sizing:border-box!important;padding:7px 8px!important;border:1px solid rgba(255,255,255,.06)!important;border-radius:8px!important;background:#0d141d!important;line-height:1.35!important}
@media(max-width:420px){#slx-stock-api-sheet .slx-api-sheet-actions{grid-template-columns:1fr 1fr!important;gap:6px!important}#slx-stock-api-sheet .slx-api-sheet-actions>button,#slx-stock-api-sheet #slx-stock-api-clear,#slx-stock-api-sheet #slx-stock-api-create{font-size:10px!important;height:40px!important;min-height:40px!important;padding:0 5px!important}}
@media(max-width:820px){#slx-stock-api-sheet#slx-stock-api-sheet{inset:6px!important;max-height:calc(100% - 12px)!important}}
`;(document.head||document.documentElement).appendChild(st);
})();



/* SAKALUX_STOCK_TECHNICAL_V081 */
(()=>{const id='slx-stock-technical-v081-style';if(document.getElementById(id))return;const st=document.createElement('style');st.id=id;st.textContent=`
#slx-stock-advisor-suite-v080 .slx-v081-chart-wrap{margin-top:10px;padding:9px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:#0a1119}
#slx-stock-advisor-suite-v080 .slx-v081-chart{height:132px!important;width:100%;display:block}
#slx-stock-advisor-suite-v080 .slx-v081-chart .price{stroke:#f2f6fb;stroke-width:2.2}#slx-stock-advisor-suite-v080 .slx-v081-chart .ema20{stroke:#5aa7ff;stroke-width:1.6}#slx-stock-advisor-suite-v080 .slx-v081-chart .ema90{stroke:#dfbd61;stroke-width:1.6}#slx-stock-advisor-suite-v080 .slx-v081-chart .bb{stroke:#7c8da1;stroke-width:1;stroke-dasharray:3 3;opacity:.68}#slx-stock-advisor-suite-v080 .slx-v081-chart .bb-mid{stroke:#60758d;stroke-width:1;opacity:.5}
#slx-stock-advisor-suite-v080 .slx-v081-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:7px;font-size:10px;font-weight:800;color:#9fb0c3}#slx-stock-advisor-suite-v080 .slx-v081-legend span:before{content:'•';font-size:18px;line-height:0;vertical-align:-2px;margin-right:3px}#slx-stock-advisor-suite-v080 .slx-v081-legend .price:before{color:#f2f6fb}#slx-stock-advisor-suite-v080 .slx-v081-legend .ema20:before{color:#5aa7ff}#slx-stock-advisor-suite-v080 .slx-v081-legend .ema90:before{color:#dfbd61}#slx-stock-advisor-suite-v080 .slx-v081-legend .bb:before{color:#7c8da1}
#slx-stock-advisor-suite-v080 .slx-v081-signal{margin-top:9px;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:#101923;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 10px;align-items:center}#slx-stock-advisor-suite-v080 .slx-v081-signal div{min-width:0}#slx-stock-advisor-suite-v080 .slx-v081-signal span{display:block;color:#91a2b6;font-size:9px;text-transform:uppercase;font-weight:900;letter-spacing:.08em}#slx-stock-advisor-suite-v080 .slx-v081-signal b{display:block;font-size:15px;margin-top:2px}#slx-stock-advisor-suite-v080 .slx-v081-signal strong{font-size:11px}#slx-stock-advisor-suite-v080 .slx-v081-signal small{grid-column:1/-1;color:#9fb0c3;line-height:1.35}#slx-stock-advisor-suite-v080 .slx-v081-signal.buy{border-color:rgba(85,217,138,.45)}#slx-stock-advisor-suite-v080 .slx-v081-signal.sell{border-color:rgba(255,107,120,.45)}#slx-stock-advisor-suite-v080 .slx-v081-signal.watch{border-color:rgba(223,189,97,.4)}
#slx-stock-advisor-suite-v080 .slx-v081-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:7px}#slx-stock-advisor-suite-v080 .slx-v081-metrics span{padding:7px;border:1px solid rgba(255,255,255,.07);border-radius:9px;font-size:9px;color:#92a3b6}#slx-stock-advisor-suite-v080 .slx-v081-metrics b{display:block;margin-top:2px;color:#e9f0f8;font-size:10px}
@media(max-width:700px){#slx-stock-advisor-suite-v080 .slx-v081-metrics{grid-template-columns:1fr}#slx-stock-advisor-suite-v080 .slx-v081-summary{grid-template-columns:1fr 1fr!important}#slx-stock-advisor-suite-v080 .slx-v081-chart{height:150px!important}}
`;document.head.appendChild(st);})();

(()=>{const id='slx-stock-portfolio-v082-style';if(document.getElementById(id))return;const st=document.createElement('style');st.id=id;st.textContent=`#slx-stock-advisor-suite-v080 .slx-v082-verdict{margin-top:9px;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:#101923;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 10px;align-items:center}#slx-stock-advisor-suite-v080 .slx-v082-verdict span,#slx-stock-advisor-suite-v080 .slx-v082-before-after span{display:block;color:#91a2b6;font-size:9px;text-transform:uppercase;font-weight:900}#slx-stock-advisor-suite-v080 .slx-v082-verdict b{display:block;font-size:15px}#slx-stock-advisor-suite-v080 .slx-v082-verdict small{grid-column:1/-1;color:#9fb0c3}#slx-stock-advisor-suite-v080 .slx-v082-verdict.buy{border-color:rgba(85,217,138,.45)}#slx-stock-advisor-suite-v080 .slx-v082-verdict.sell{border-color:rgba(255,107,120,.45)}#slx-stock-advisor-suite-v080 .slx-v082-verdict.watch{border-color:rgba(223,189,97,.4)}#slx-stock-advisor-suite-v080 .slx-v082-before-after{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}#slx-stock-advisor-suite-v080 .slx-v082-before-after>div{padding:9px;border:1px solid rgba(255,255,255,.08);border-radius:11px;background:#0b121b}#slx-stock-advisor-suite-v080 .slx-v082-grid{margin-top:8px}#slx-stock-advisor-suite-v080 .slx-v082-grid .good{color:#55d98a}#slx-stock-advisor-suite-v080 .slx-v082-grid .bad{color:#ff6b78}@media(max-width:700px){#slx-stock-advisor-suite-v080 .slx-v082-before-after,#slx-stock-advisor-suite-v080 .slx-v082-verdict{grid-template-columns:1fr}}`;document.head.appendChild(st);})();

(()=>{const id='slx-stock-smart-rebalance-v083-style';if(document.getElementById(id))return;const st=document.createElement('style');st.id=id;st.textContent=`
#slx-stock-advisor-suite-v080 .slx-v083-rebalance{margin-top:10px;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:#0b121b}#slx-stock-advisor-suite-v080 .slx-v083-head{display:flex;align-items:center;justify-content:space-between;gap:8px}#slx-stock-advisor-suite-v080 .slx-v083-head span{display:block;color:#91a2b6;font-size:9px;font-weight:900;letter-spacing:.08em}#slx-stock-advisor-suite-v080 .slx-v083-head b{display:block;margin-top:2px;font-size:14px}#slx-stock-advisor-suite-v080 .slx-v083-head button{border:1px solid rgba(255,255,255,.11);border-radius:9px;background:#111c28;color:#dce7f2;padding:7px 9px;font-size:9px;font-weight:900}
#slx-stock-advisor-suite-v080 .slx-v083-summary-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:8px}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid>div{padding:8px;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:#101923;min-width:0}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid span{display:block;color:#899bad;font-size:8px;font-weight:900;text-transform:uppercase}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid b{display:block;margin-top:3px;font-size:11px;overflow:hidden;text-overflow:ellipsis}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid .good{color:#55d98a}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid .bad{color:#ff6b78}
#slx-stock-advisor-suite-v080 .slx-v083-move{display:grid;grid-template-columns:26px minmax(0,1fr);gap:6px 8px;margin-top:7px;padding:8px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:#0e1721}#slx-stock-advisor-suite-v080 .slx-v083-step{grid-row:1/4;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#162332;font-weight:900;font-size:10px}#slx-stock-advisor-suite-v080 .slx-v083-route b{font-size:12px}#slx-stock-advisor-suite-v080 .slx-v083-route small,#slx-stock-advisor-suite-v080 .slx-v083-unused{display:block;color:#91a2b6;margin-top:2px;line-height:1.3}#slx-stock-advisor-suite-v080 .slx-v083-metrics{display:flex;flex-wrap:wrap;gap:5px}#slx-stock-advisor-suite-v080 .slx-v083-metrics span{padding:3px 6px;border-radius:999px;background:#162332;color:#b9c7d6;font-size:9px;font-weight:800}
#slx-stock-advisor-suite-v080 .slx-v084-profiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}#slx-stock-advisor-suite-v080 .slx-v084-profiles button{min-height:32px;border:1px solid rgba(255,255,255,.10);border-radius:9px;background:#111b26;color:#91a2b6;font-size:9px;font-weight:900;letter-spacing:.04em}#slx-stock-advisor-suite-v080 .slx-v084-profiles button.active{border-color:rgba(223,189,97,.72);background:linear-gradient(180deg,#5b471b,#33290f);color:#ffe7a3}#slx-stock-advisor-suite-v080 #slx-v084-profile-help{margin-top:6px;padding:6px 8px;border-radius:9px;background:#0d1620;color:#8fa1b4;font-size:9px;line-height:1.35}#slx-stock-advisor-suite-v080 #slx-v084-profile-help span{color:#dfbd61;font-weight:900;margin-right:5px}
@media(max-width:700px){#slx-stock-advisor-suite-v080 .slx-v083-summary-grid{grid-template-columns:1fr 1fr}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid>div:last-child{grid-column:1/-1}}
`;document.head.appendChild(st);})();

/* SAKALUX_STOCK_PORTFOLIO_V082 */

/* SAKALUX_STOCK_STABILIZATION_V0801 */
(()=>{const id='slx-stock-stabilization-v0801-style';if(document.getElementById(id))return;const st=document.createElement('style');st.id=id;st.textContent=`
#slx-stock-advisor-suite-v080 input,#slx-stock-advisor-suite-v080 select{box-sizing:border-box!important;max-width:100%!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary>div,#slx-stock-advisor-suite-v080 .slx-v080-pick,#slx-stock-advisor-suite-v080 .slx-v080-sim-grid>div{min-width:0!important;overflow:hidden!important}
#slx-stock-advisor-suite-v080 b,#slx-stock-advisor-suite-v080 span,#slx-stock-advisor-suite-v080 small{overflow-wrap:anywhere}
@media(max-width:700px){#slx-stock-advisor-suite-v080 .slx-v080-controls,#slx-stock-advisor-suite-v080 .slx-v080-summary,#slx-stock-advisor-suite-v080 .slx-v080-picks,#slx-stock-advisor-suite-v080 .slx-v080-sim-grid{grid-template-columns:minmax(0,1fr)!important}#slx-stock-advisor-suite-v080 .slx-v080-chart{height:92px!important}#slx-stock-advisor-suite-v080 .api-help{line-height:1.45!important}}
`;document.head.appendChild(st);})();

/* SAKALUX_STOCK_ADVISOR_SUITE_V080_CSS */
(()=>{
 const id='slx-stock-advisor-suite-v080-style';if(document.getElementById(id))return;const st=document.createElement('style');st.id=id;st.textContent=`
#slx-stock-advisor-suite-v080{display:block!important}
#slx-stock-advisor-suite-v080 .slx-v080-section{border-color:#2f4053!important;background:linear-gradient(180deg,#131d28,#0d151e)!important}
#slx-stock-advisor-suite-v080 .slx-v080-controls{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:8px 0!important}
#slx-stock-advisor-suite-v080 label{display:flex!important;flex-direction:column!important;gap:4px!important;color:#9cabbc!important;font-size:10px!important}
#slx-stock-advisor-suite-v080 input,#slx-stock-advisor-suite-v080 select{width:100%!important;box-sizing:border-box!important;height:34px!important;min-height:34px!important;padding:6px 8px!important;border:1px solid #34465b!important;border-radius:8px!important;background:#0d1622!important;color:#edf3fa!important;font-size:11px!important}
#slx-stock-advisor-suite-v080 button{min-height:34px!important;height:34px!important;padding:0 10px!important;border:1px solid #3b6fa7!important;border-radius:8px!important;background:linear-gradient(180deg,#2f78c6,#245e9e)!important;color:#fff!important;font-size:10px!important;font-weight:900!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;margin:9px 0!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary>div{min-width:0!important;padding:8px 5px!important;border:1px solid #2b3a4b!important;border-radius:9px!important;background:#121b25!important;text-align:center!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary span{display:block!important;color:#8493a5!important;font-size:8px!important;text-transform:uppercase!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary b{display:block!important;margin-top:3px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#f1f5f9!important;font-size:11px!important}
#slx-stock-advisor-suite-v080 .good{color:#5cdb91!important}#slx-stock-advisor-suite-v080 .bad{color:#ff7b86!important}
#slx-stock-advisor-suite-v080 .slx-v080-picks{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin:7px 0!important}.slx-v080-pick{padding:9px!important;border:1px solid #3a4858!important;border-radius:9px!important;background:#111923!important}.slx-v080-pick>span{display:block!important;color:#dfbd61!important;font-size:8px!important;font-weight:900!important}.slx-v080-pick>b{display:block!important;margin-top:3px!important;color:#fff!important;font-size:11px!important}.slx-v080-pick>small{display:block!important;margin-top:3px!important;color:#93a4b7!important;font-size:8px!important;line-height:1.35!important}
#slx-stock-advisor-suite-v080 .slx-v080-list{margin-top:7px!important;border:1px solid #293746!important;border-radius:9px!important;overflow:hidden!important}.slx-v080-list>div{display:grid!important;grid-template-columns:.7fr .7fr 1fr 1fr!important;gap:6px!important;align-items:center!important;padding:7px 8px!important;border-bottom:1px solid rgba(255,255,255,.055)!important;font-size:9px!important}.slx-v080-list>div:last-child{border-bottom:0!important}.slx-v080-list span{color:#a3afbe!important;text-align:right!important}
#slx-stock-advisor-suite-v080 .slx-v080-chart{display:block!important;width:100%!important;height:82px!important;margin-top:8px!important;padding:5px!important;box-sizing:border-box!important;border:1px solid #2d3d50!important;border-radius:9px!important;background:#0b121a!important;color:#4f8fe8!important}.slx-v080-range{display:flex!important;justify-content:space-between!important;margin-top:3px!important;color:#7f8b9a!important;font-size:8px!important}.slx-v080-signal{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-top:7px!important;padding:8px!important;border-radius:9px!important;background:#121b25!important;border:1px solid #2b3a4b!important;font-size:9px!important}.slx-v080-signal span{color:#dfbd61!important;text-align:right!important}
#slx-stock-advisor-suite-v080 .slx-v080-sim-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-top:8px!important}.slx-v080-sim-grid>div{padding:9px!important;border:1px solid #2d3d50!important;border-radius:9px!important;background:#111923!important}.slx-v080-sim-grid span{display:block!important;color:#8291a4!important;font-size:8px!important;text-transform:uppercase!important}.slx-v080-sim-grid b{display:block!important;margin-top:3px!important;color:#f2f6fb!important;font-size:11px!important}.slx-v080-sim-grid small{display:block!important;margin-top:3px!important;color:#93a4b7!important;font-size:8px!important;line-height:1.35!important}.slx-v080-empty{padding:10px!important;text-align:center!important;color:#8795a6!important;font-size:9px!important}
@media(max-width:520px){#slx-stock-advisor-suite-v080 .slx-v080-summary{grid-template-columns:1fr 1fr!important}#slx-stock-advisor-suite-v080 .slx-v080-picks,#slx-stock-advisor-suite-v080 .slx-v080-sim-grid{grid-template-columns:1fr!important}.slx-v080-list>div{grid-template-columns:.6fr .6fr 1fr 1fr!important;font-size:8px!important}}
`; (document.head||document.documentElement).appendChild(st);
})();
