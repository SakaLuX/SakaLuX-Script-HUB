// ==UserScript==
// @name         SakaLuX Chat Intelligence
// @namespace    sakalux.chat.intelligence
// @version      1.2.38
// @description  Torn chat intelligence with controls visually integrated into the native Chat V3 title bar.
// @author       SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
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
/* SakaLuX Chat Intelligence visible-chat toast suppression v1.2.37 */
/* SakaLuX Chat Intelligence active-chat toast suppression v1.2.38 */
(()=>{'use strict';
  // SakaLuX shared mobile top-alignment contract.
  (() => {
    const id='sakalux-global-top-align-v3';
    if(document.getElementById(id)) return;
    const st=document.createElement('style');
    st.id=id;
    st.textContent=`@media(max-width:700px){
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="overlay"],body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="modal"],
body [id^="slx-"][id*="overlay"],body [id^="slx-"][id*="modal"],
body [id^="sl-"][id*="overlay"],body [id^="sl-"][id*="modal"],
#sl-eg-overlay,#sl-mr-settings-overlay,#sl-mi-overlay,#ci-root{
 align-items:flex-start!important;justify-content:center!important;padding-top:0!important;margin-top:0!important;
}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="panel"],body [id^="slx-"][id*="panel"],body [id^="sl-"][id*="panel"],
#sl-eg-panel,#sl-mr-settings-panel,#sl-mi-panel,#ci-root .ci-shell{
 margin-top:0!important;align-self:flex-start!important;
}
}`;
    (document.head||document.documentElement).appendChild(st);
  })();


const V='1.2.38',ID='chat-intelligence',API='SakaLuXChatIntelligence';
const K='SLX_CHAT_CFG4',KP='SLX_CHAT_PEOPLE4',KF='SLX_CHAT_FAV4',KM='SLX_CHAT_MUTE4';
const D={enabled:true,search:true,quickActions:true,contextFavorite:true,contextReply:true,contextCopyId:true,contextCopyName:true,contextProfile:true,contextMute:true,contextAlias:true,notifications:true,notifyPM:true,notifyFaction:true,notifyCompany:true,mentionAutocomplete:true,exportSearch:true};
const J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}},W=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},N=v=>String(v??'').replace(/\s+/g,' ').trim(),H=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
let S={...D,...J(K,{})},P=J(KP,{}),F=new Set(J(KF,[])),M=new Set(J(KM,[])),O,T,MENU,MD;
const ROOTS=new WeakSet(),BOUND=new WeakSet(),MENT=new WeakMap(),SEEN=new Set(),MESSAGE_KEYS=new WeakMap(),MAX=new WeakMap(),HEADER_STYLE=new WeakMap();
const save=()=>W(K,S),saveP=()=>{W(KP,P);W(KF,[...F]);W(KM,[...M])},pk=p=>p.id?'id:'+p.id:p.name?'name:'+p.name.toLowerCase():'',pd=p=>P[pk(p)]||{},dn=p=>pd(p).alias||p.name||(p.id?'Player '+p.id:'Unknown');
function composer(){return[...document.querySelectorAll('textarea,[contenteditable="true"]')].filter(x=>/type your message/i.test(N(x.getAttribute?.('placeholder'))))}
function rootFor(c){for(let n=c.parentElement,i=0;n&&i<10;i++,n=n.parentElement){if(n===document.body)break;const r=n.getBoundingClientRect(),hasMsg=!!n.querySelector('[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="messageRow"],a[href*="profiles.php"],a[href*="XID="]');if(hasMsg&&r.width>=220&&r.height>=180&&r.width<=innerWidth*.99&&r.height<=innerHeight*.98)return n}return null}
function roots(){const a=[];composer().forEach(c=>{const r=rootFor(c);if(r&&!a.includes(r))a.push(r)});return a}
function who(e){const a=e.querySelector('a[href*="profiles.php"],a[href*="XID="]');let id='',name='';if(a){const mm=(a.href||'').match(/[?&]XID=(\d+)/i);if(mm)id=mm[1];const z=N(a.textContent).replace(/:$/,'');if(z&&z.length<=40)name=z}if(!name){for(const s of e.querySelectorAll('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],strong,b')){const z=N(s.textContent).replace(/:$/,'');if(z&&z.length>=2&&z.length<=40&&!/^(today|yesterday|mon|tue|wed|thu|fri|sat|sun)$/i.test(z)){name=z;break}}}if(!name){const t=N(e.innerText||e.textContent),mm=t.match(/^([A-Za-z0-9_\-]{2,32})\s*:/);if(mm)name=mm[1]}return{id,name}}
function okMsg(e){if(!e?.isConnected||e.closest('.slx-head-controls,.slx-search,.slx-mentions,#slx-menu,.slx-toast-host'))return false;if(e.querySelector('textarea,[contenteditable="true"]'))return false;const t=N(e.innerText);if(!t||t.length>2500)return false;const c=String(e.className||'').toLowerCase();return e.hasAttribute('data-message-id')||e.hasAttribute('data-message')||c.includes('chatmessage')||c.includes('messageitem')||c.includes('messagerow')||!!e.querySelector('a[href*="profiles.php"],a[href*="XID="]')}
function msgs(r){
 const out=[],seen=new Set();
 const add=e=>{if(!e||seen.has(e)||!e.isConnected||e.closest('.slx-head-controls,.slx-search,.slx-mentions,#slx-menu,.slx-toast-host,#sakalux-chat-settings-overlay'))return;const q=e.getBoundingClientRect(),t=N(e.innerText||e.textContent);if(!t||q.width<90||q.height<18||q.height>190)return;if(e.querySelector('textarea,[contenteditable="true"],input[type="search"]'))return;seen.add(e);out.push(e)};
 const named='[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="message-item"],[class*="messageRow"],[class*="message-row"]';
 r.querySelectorAll(named).forEach(add);
 const senders=r.querySelectorAll('a[href*="profiles.php"],a[href*="XID="],[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],strong,b');
 for(const s of senders){let best=null;for(let e=s.parentElement,i=0;e&&e!==r&&i<5;i++,e=e.parentElement){const q=e.getBoundingClientRect(),t=N(e.innerText||e.textContent);if(q.width<90||q.height<18||q.height>190||!t)continue;if(e.querySelector('textarea,[contenteditable="true"]'))continue;best=e;if(q.height>=28&&q.width>=Math.min(220,r.getBoundingClientRect().width*.45))break}if(best)add(best)}
 if(out.length<3){for(const e of r.querySelectorAll('div,li,p,article,section')){const t=N(e.innerText||e.textContent);if(!t||t.length>700)continue;if(!/^[A-Za-z0-9_\-]{2,32}\s*:/.test(t))continue;const child=[...e.children].some(ch=>/^[A-Za-z0-9_\-]{2,32}\s*:/.test(N(ch.innerText||ch.textContent)));if(!child)add(e)}}
 return out.filter((e,i,a)=>!a.some((o,j)=>j!==i&&e.contains(o)))
}
function body(e,p){let t=N(e.innerText);if(p.name&&t.startsWith(p.name))t=N(t.slice(p.name.length));return t}
function chan(r){const t=N(r.innerText).toLowerCase();return t.includes('faction')?'faction':t.includes('company')?'company':'pm'}
function allow(r){const c=chan(r);return c==='faction'?S.notifyFaction:c==='company'?S.notifyCompany:S.notifyPM}
function rememberMessage(k){SEEN.add(k);if(SEEN.size>4096)SEEN.delete(SEEN.values().next().value)}
function toast(r,t,b,k){if(!S.notifications||SEEN.has(k))return;rememberMessage(k);let h=r.querySelector(':scope>.slx-toast-host');if(!h){h=document.createElement('div');h.className='slx-toast-host';r.appendChild(h)}const e=document.createElement('div');e.className='slx-toast';e.innerHTML='<b>'+t.replace(/[<>]/g,'')+'</b><span>'+b.replace(/[<>]/g,'').slice(0,150)+'</span>';h.appendChild(e);setTimeout(()=>{e.remove();if(!h.childElementCount)h.remove()},2800)}
function exportMessages(r,q=''){const s=N(q).toLowerCase(),rows=msgs(r).filter(e=>{const p=who(e);return !s||body(e,p).toLowerCase().includes(s)||dn(p).toLowerCase().includes(s)}).map(e=>{const p=who(e);return dn(p)+(p.id?' ['+p.id+']':'')+': '+body(e,p)}),blob=new Blob([rows.join('\n')],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='SakaLuX-chat-'+Date.now()+'.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500)}
function closeSearch(reset=true){
 document.querySelectorAll('.slx-search').forEach(p=>{
  // Cleanup any stale display:none left by older builds.
  if(p._root)msgs(p._root).forEach(e=>e.style.removeProperty('display'));
  p.remove()
 })
}
function searchBox(r){
 if(!S.search)return;closeSearch(true);
 const p=document.createElement('div');p.className='slx-search';p._root=r;
 p.innerHTML='<div class="slx-search-title"><span>Search chat</span><button data-c>×</button></div><div class="slx-search-row"><input type="search" placeholder="Name or message…"><span data-count>0/0</span><button data-e title="Export results">⇩</button></div><div class="slx-search-results"></div>';
 document.body.appendChild(p);
 const place=()=>{const rr=r.getBoundingClientRect(),w=Math.min(Math.max(290,rr.width-16),innerWidth-16);p.style.width=w+'px';p.style.left=Math.max(8,Math.min(innerWidth-w-8,rr.left+8))+'px';p.style.top=Math.max(8,Math.min(innerHeight-p.offsetHeight-8,rr.top+44))+'px'};p._place=place;
 const i=p.querySelector('input'),n=p.querySelector('[data-count]'),ex=p.querySelector('[data-e]'),box=p.querySelector('.slx-search-results');ex.hidden=!S.exportSearch;
 const render=()=>{
  const q=N(i.value).toLowerCase(),all=msgs(r),hits=all.filter(e=>{const pl=who(e),txt=N(e.innerText||e.textContent).toLowerCase();return !q||txt.includes(q)||dn(pl).toLowerCase().includes(q)});
  n.textContent=hits.length+'/'+all.length;box.textContent='';
  if(!q){const hint=document.createElement('div');hint.className='slx-search-empty';hint.textContent='Type to search loaded chat messages.';box.appendChild(hint);place();return}
  if(!hits.length){const z=document.createElement('div');z.className='slx-search-empty';z.textContent='No matching messages.';box.appendChild(z);place();return}
  hits.slice(0,80).forEach(e=>{
   const pl=who(e),row=document.createElement('button');row.type='button';row.className='slx-search-result';
   const name=document.createElement('b');name.textContent=dn(pl)||pl.name||'Message';
   const body=document.createElement('span');let raw=N(e.innerText||e.textContent);if(pl.name&&raw.toLowerCase().startsWith(pl.name.toLowerCase()))raw=raw.slice(pl.name.length).replace(/^\s*:\s*/,'');body.textContent=raw;
   row.append(name,body);row.onclick=()=>{closeSearch(true);try{e.scrollIntoView({behavior:'smooth',block:'center'});e.animate?.([{outline:'2px solid #4aa3ff'},{outline:'0 solid transparent'}],{duration:1200})}catch{}};box.appendChild(row)
  });
  if(hits.length>80){const more=document.createElement('div');more.className='slx-search-empty';more.textContent='Showing first 80 of '+hits.length+' results.';box.appendChild(more)}
  place()
 };
 i.addEventListener('input',render);i.addEventListener('search',render);p.querySelector('[data-c]').onclick=()=>closeSearch(true);ex.onclick=()=>{if(S.exportSearch)exportMessages(r,i.value)};render();place();setTimeout(()=>i.focus(),0)
}
function viewport(r,c){const m=msgs(r);if(!m.length)return null;let best=null,bestScore=-1;for(let n=m[0].parentElement;n&&n!==r;n=n.parentElement){const rr=n.getBoundingClientRect(),cs=getComputedStyle(n),scroll=n.scrollHeight>n.clientHeight+8||['auto','scroll'].includes(cs.overflowY),score=(scroll?1000:0)+rr.width*rr.height-(n.contains(c)?1e8:0);if(rr.width>180&&rr.height>80&&score>bestScore){best=n;bestScore=score}}return best}
function chatShell(r,h,c){
 let n=h;
 for(let i=0;n&&i<12;i++,n=n.parentElement){
  if(n===document.body||n===document.documentElement)break;
  if(!n.contains(c))continue;
  const q=n.getBoundingClientRect();
  if(q.width>=220&&q.height>=180)return n;
 }
 return r;
}
function restoreStyle(el,style){if(!el)return;if(style===null||style===undefined||style==='')el.removeAttribute('style');else el.setAttribute('style',style)}
function commonChatPanel(r,c){
 const h=findHeader(r,c);if(!h)return r;
 let n=h,best=null;
 const vw=window.visualViewport?.width||innerWidth,vh=window.visualViewport?.height||innerHeight;
 for(let i=0;n&&i<12;i++,n=n.parentElement){
  if(n===document.body||n===document.documentElement)break;
  if(!n.contains(r)||!n.contains(c))continue;
  const q=n.getBoundingClientRect();
  if(q.width<220||q.height<220)continue;
  if(q.width>vw*.94||q.height>vh*.94)break;
  best=n;
 }
 return best||r
}
function toggleMax(r,c,b){
 if(MAX.has(r)){
  const s=MAX.get(r);restoreStyle(s.panel,s.panelStyle);restoreStyle(r,s.rootStyle);restoreStyle(s.view,s.viewStyle);restoreStyle(s.composerHost,s.composerStyle);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');MAX.delete(r);b.textContent='⛶';b.title='Maximize';setTimeout(()=>c?.focus(),0);return
 }
 const panel=commonChatPanel(r,c),v=viewport(r,c),ch=c?.parentElement;
 const state={panel,panelStyle:panel.getAttribute('style'),rootStyle:r.getAttribute('style'),view:v,viewStyle:v?.getAttribute('style')??null,composerHost:ch,composerStyle:ch?.getAttribute('style')??null};MAX.set(r,state);
 document.documentElement.classList.add('slx-chat-max-active');document.body.classList.add('slx-chat-max-active');
 const f=(el,k,val)=>el?.style?.setProperty(k,val,'important');
 const vv=window.visualViewport,top=Math.max(6,Math.round(vv?.offsetTop||0)+6),left=Math.max(6,Math.round(vv?.offsetLeft||0)+6),vw=Math.round(vv?.width||innerWidth),vh=Math.round(vv?.height||innerHeight);
 f(panel,'position','fixed');f(panel,'left',left+'px');f(panel,'top',top+'px');f(panel,'right','auto');f(panel,'bottom','auto');f(panel,'width',Math.max(280,vw-12)+'px');f(panel,'height',Math.max(360,vh-12)+'px');f(panel,'max-width','none');f(panel,'max-height','none');f(panel,'min-width','0');f(panel,'min-height','0');f(panel,'margin','0');f(panel,'transform','none');f(panel,'z-index','2147483600');f(panel,'overflow','hidden');f(panel,'display','flex');f(panel,'flex-direction','column');f(panel,'box-sizing','border-box');
 if(panel!==r){f(r,'position','relative');f(r,'display','flex');f(r,'flex-direction','column');f(r,'flex','1 1 auto');f(r,'width','100%');f(r,'height','auto');f(r,'min-height','0');f(r,'max-width','none');f(r,'max-height','none');f(r,'overflow','hidden')}
 if(v){f(v,'position','relative');f(v,'flex','1 1 auto');f(v,'height','auto');f(v,'min-height','0');f(v,'max-height','none');f(v,'overflow-y','auto');f(v,'overscroll-behavior','contain')}
 if(ch){f(ch,'position','relative');f(ch,'flex','0 0 auto');f(ch,'left','auto');f(ch,'right','auto');f(ch,'bottom','auto');f(ch,'width','100%');f(ch,'margin-top','auto')}
 b.textContent='⤢';b.title='Restore';
 requestAnimationFrame(()=>{const q=panel.getBoundingClientRect(),ok=q.width>=vw*.88&&q.height>=vh*.80&&q.left>=-2&&q.top>=-2&&q.right<=left+vw+4&&q.bottom<=top+vh+4;if(!ok){restoreStyle(panel,state.panelStyle);restoreStyle(r,state.rootStyle);restoreStyle(v,state.viewStyle);restoreStyle(ch,state.composerStyle);MAX.delete(r);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');b.textContent='⛶';b.title='Maximize';return}setTimeout(()=>{try{v?.scrollTo?.({top:v.scrollHeight,behavior:'auto'})}catch{};c?.focus?.()},40)})
}
function findHeader(r,c){const rr=r.getBoundingClientRect(),cr=c.getBoundingClientRect();let scope=r;for(let i=0;i<4&&scope.parentElement&&scope.parentElement!==document.body;i++)scope=scope.parentElement;let best=null,bestScore=-1;for(const e of scope.querySelectorAll('header,div,section')){if(e===r||e.closest('.slx-head-controls'))continue;const er=e.getBoundingClientRect();if(er.width<rr.width*.72||er.width>rr.width*1.2||er.height<36||er.height>78)continue;if(er.bottom>cr.top-24)continue;if(er.top<rr.top-120||er.top>rr.top+28)continue;if(Math.abs(er.left-rr.left)>48)continue;if(e.querySelector('textarea,[contenteditable="true"]'))continue;const t=N(e.innerText);if(!t||t.length>140)continue;let s=0;s+=Math.max(0,100-Math.abs(er.width-rr.width));s+=Math.max(0,80-Math.min(Math.abs(er.top-rr.top),Math.abs(er.bottom-rr.top)));s+=Math.max(0,50-Math.abs(er.left-rr.left));if([...e.querySelectorAll('button,[role="button"],a,span,div')].some(x=>/^(—|−|-|_)$/.test(N(x.textContent))))s+=90;if(/^(?:faction|company|global|trade|new players|chat)(?:\s|$)/i.test(t))s+=30;if(s>bestScore){best=e;bestScore=s}}
return bestScore>=80?best:null}
function bindButton(b,fn){b.onclick=e=>{e.preventDefault();e.stopPropagation();fn(e.currentTarget)};b.addEventListener('pointerdown',e=>e.stopPropagation(),{passive:true});b.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true})}
function controls(r){const c=composer().find(x=>rootFor(x)===r);if(!c)return;const h=findHeader(r,c);let x=document.querySelector('.slx-head-controls[data-root="'+(r.dataset.slxRootId||'')+'"]');if(!r.dataset.slxRootId)r.dataset.slxRootId='slx'+Math.random().toString(36).slice(2,8);if(!x)x=[...document.querySelectorAll('.slx-head-controls')].find(z=>z._root===r);if(!h){x?.remove();return}if(getComputedStyle(h).position==='static'){if(!HEADER_STYLE.has(h))HEADER_STYLE.set(h,h.getAttribute('style')||'');h.style.position='relative'}if(!x||x.parentElement!==h){x?.remove();x=document.createElement('div');x.className='slx-head-controls';x.dataset.sakaluxChatControls='1';x._root=r;x.dataset.root=r.dataset.slxRootId;x.innerHTML='<button data-s title="Search">🔎</button><button data-m title="Maximize">⛶</button><button data-e title="Export">⇩</button><button data-o title="Chat Intelligence settings">⚙</button>';const native=[...h.querySelectorAll('button,[role="button"],a,span,div')].find(el=>/^(?:—|−|-|_)$/.test(N(el.textContent))&&!el.closest('.slx-head-controls'));const anchor=native?.closest('button,[role="button"],a')||native;if(anchor&&anchor.parentElement===h)h.insertBefore(x,anchor);else h.appendChild(x);bindButton(x.querySelector('[data-s]'),()=>searchBox(r));bindButton(x.querySelector('[data-m]'),b=>toggleMax(r,c,b));bindButton(x.querySelector('[data-e]'),()=>exportMessages(r,''));bindButton(x.querySelector('[data-o]'),()=>settings());syncHeaderControlVisibility()}x.querySelector('[data-s]').hidden=!S.search;x.querySelector('[data-e]').hidden=!S.exportSearch;const mb=x.querySelector('[data-m]');if(mb)mb.textContent=MAX.has(r)?'⤢':'⛶'}
function hideMenu(){MENU?.classList.remove('show');MD=null}
function chooseAliasColor(current,onPick){
 document.getElementById('slx-color-picker')?.remove();
 const colors=[
  ['','Default','#68717b'],
  ['#22c55e','Green','#22c55e'],
  ['#facc15','Yellow','#facc15'],
  ['#ef4444','Red','#ef4444'],
  ['#3b82f6','Blue','#3b82f6'],
  ['#ffffff','White','#ffffff'],
  ['#000000','Black','#000000'],
  ['#f97316','Orange','#f97316'],
  ['#a855f7','Purple','#a855f7']
 ];
 const o=document.createElement('div');o.id='slx-color-picker';
 o.innerHTML='<section><header><b>Choose alias color</b><button type="button" data-close>×</button></header><main></main><footer><button type="button" data-cancel>Cancel</button></footer></section>';
 const m=o.querySelector('main');
 colors.forEach(([value,label,swatch])=>{const b=document.createElement('button');b.type='button';b.className='slx-color-choice';b.dataset.color=value;b.innerHTML='<span class="slx-color-swatch"></span><span>'+label+'</span><span class="slx-color-check">'+((current||'').toLowerCase()===value.toLowerCase()?'✓':'')+'</span>';b.querySelector('.slx-color-swatch').style.background=swatch;b.onclick=()=>{o.remove();onPick(value)};m.appendChild(b)});
 const close=()=>o.remove();o.querySelector('[data-close]').onclick=close;o.querySelector('[data-cancel]').onclick=close;o.addEventListener('click',e=>{if(e.target===o)close()});document.body.appendChild(o)
}
function menu(){
 if(MENU?.isConnected)return;
 MENU=document.createElement('div');MENU.id='slx-menu';
 MENU.innerHTML='<button data-a="fav" title="Favorite">☆</button><button data-a="reply" title="Reply">↩</button><button data-a="id" title="Copy player ID">ID</button><button data-a="name" title="Copy name">N</button><button data-a="profile" title="Open profile">↗</button><button data-a="mute" title="Mute / unmute locally">🔇</button><button data-a="alias" title="Alias / color">✎</button><button data-a="close" title="Close">×</button>';
 document.body.appendChild(MENU);
 MENU.onclick=e=>{const b=e.target.closest('button[data-a]');if(!b||!MD)return;const a=b.dataset.a,{r,p}=MD,k=pk(p);if(a==='close')return hideMenu();if(a==='fav'&&S.contextFavorite){F.has(k)?F.delete(k):F.add(k);saveP();return showMenu(r,MD.e,p)}if(a==='mute'&&S.contextMute){M.has(k)?M.delete(k):M.add(k);saveP();return showMenu(r,MD.e,p)}if(a==='reply'&&S.contextReply){const c=composer().find(x=>rootFor(x)===r);if(c&&p.name){c.value='@'+p.name+' '+(c.value||'');c.dispatchEvent(new Event('input',{bubbles:true}));c.focus()}return hideMenu()}if(a==='id'&&S.contextCopyId&&p.id)return navigator.clipboard?.writeText(p.id);if(a==='name'&&S.contextCopyName&&p.name)return navigator.clipboard?.writeText(p.name);if(a==='profile'&&S.contextProfile&&p.id)return location.href='https://www.torn.com/profiles.php?XID='+p.id;if(a==='alias'&&S.contextAlias){const d=pd(p),al=prompt('Alias for '+(p.name||p.id),d.alias||'');if(al===null)return;hideMenu();chooseAliasColor(d.color||'',co=>{P[k]={...d,alias:N(al),color:co};saveP();scan()})}}
}
function applyMenuSettings(p){
 const map={fav:'contextFavorite',reply:'contextReply',id:'contextCopyId',name:'contextCopyName',profile:'contextProfile',mute:'contextMute',alias:'contextAlias'};
 for(const [a,k] of Object.entries(map)){const b=MENU?.querySelector('[data-a="'+a+'"]');if(b)b.hidden=!S[k]}
 const key=pk(p),d=pd(p),fav=MENU?.querySelector('[data-a="fav"]'),mute=MENU?.querySelector('[data-a="mute"]'),id=MENU?.querySelector('[data-a="id"]'),profile=MENU?.querySelector('[data-a="profile"]'),alias=MENU?.querySelector('[data-a="alias"]');
 if(fav)fav.textContent=F.has(key)?'★':'☆';if(mute)mute.textContent=M.has(key)?'🔈':'🔇';if(id)id.disabled=!p.id;if(profile)profile.disabled=!p.id;if(alias)alias.title=(d.alias?'Alias: '+d.alias:'Alias / color')+(d.color?' • '+d.color:'')
}
function showMenu(r,e,p){if(!S.quickActions||(!p.id&&!p.name))return;menu();MD={r,e,p};applyMenuSettings(p);MENU.classList.add('show');const x=e.getBoundingClientRect(),m=MENU.getBoundingClientRect();MENU.style.left=Math.max(8,Math.min(innerWidth-m.width-8,x.right-m.width))+'px';MENU.style.top=Math.max(8,Math.min(innerHeight-m.height-8,x.bottom+4))+'px'}
function isChatHeaderCandidate(r,e){
 if(!e)return true;
 if(e.closest('.slx-head-controls,#sakalux-chat-settings-overlay,#slx-menu,.slx-search'))return true;
 const c=composer().find(x=>rootFor(x)===r),h=c?findHeader(r,c):null;
 if(h&&(e===h||e.contains(h)||h.contains(e)))return true;
 const cls=String(e.className||'');
 if(/(?:chat.?header|title.?bar|conversation.?header|chat.?title)/i.test(cls))return true;
 return false
}
function syncContextTrigger(r,e,p){
 let z=e.querySelector(':scope > .slx-msg-actions,.slx-msg-actions');
 if(!S.enabled||!S.quickActions||(!p.id&&!p.name)||isChatHeaderCandidate(r,e)){z?.remove();return}
 if(z){z._slxPlayer=p;return}
 z=document.createElement('button');z.type='button';z.className='slx-msg-actions';z.textContent='⋮';z.title='Player actions';z.setAttribute('aria-label','Player actions');z._slxPlayer=p;
 z.onclick=x=>{x.preventDefault();x.stopPropagation();showMenu(r,e,z._slxPlayer||p)};
 const sender=e.querySelector('a[href*="profiles.php"],a[href*="XID="],[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],strong,b');
 if(sender&&sender!==e){sender.insertAdjacentElement('afterend',z)}else e.appendChild(z)
}

function chatIsActivelyVisible(r,e){
 if(!r?.isConnected||!e?.isConnected)return false;
 if(document.visibilityState&&document.visibilityState!=='visible')return false;
 try{
  const rc=getComputedStyle(r),rr=r.getBoundingClientRect();
  if(rc.display==='none'||rc.visibility==='hidden'||Number(rc.opacity)===0)return false;
  if(rr.width<120||rr.height<120||rr.bottom<=0||rr.right<=0||rr.top>=innerHeight||rr.left>=innerWidth)return false;
  const c=composer().find(x=>rootFor(x)===r);
  if(!c||!c.isConnected)return false;
  const cc=getComputedStyle(c),cr=c.getBoundingClientRect();
  if(cc.display==='none'||cc.visibility==='hidden'||Number(cc.opacity)===0)return false;
  if(cr.width<80||cr.height<18||cr.bottom<=0||cr.right<=0||cr.top>=innerHeight||cr.left>=innerWidth)return false;
  const ec=getComputedStyle(e),er=e.getBoundingClientRect();
  if(ec.display==='none'||ec.visibility==='hidden'||Number(ec.opacity)===0)return false;
  if(er.width<2||er.height<2||er.bottom<=0||er.right<=0||er.top>=innerHeight||er.left>=innerWidth)return false;
  return true;
 }catch{return false}
}
function decorate(r,e,first){const p=who(e),b=body(e,p),k=e.dataset.messageId||e.id||H((p.id||p.name)+'|'+b),d=pd(p),sender=e.querySelector('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],a[href*="profiles.php"],a[href*="XID="]');syncContextTrigger(r,e,p);if(sender){if(d.color){if(!sender.dataset.slxOriginalColor)sender.dataset.slxOriginalColor=sender.style.color||'';sender.style.setProperty('color',d.color,'important')}else if('slxOriginalColor' in sender.dataset){sender.style.color=sender.dataset.slxOriginalColor||'';delete sender.dataset.slxOriginalColor}};if(!BOUND.has(e)){BOUND.add(e);e.onclick=x=>{if(x.target.closest('.slx-msg-actions'))return;const senderTap=x.target.closest('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"]');if(senderTap){x.preventDefault();x.stopPropagation();showMenu(r,e,p);return}if(!x.target.closest('a,button,input,textarea,[contenteditable="true"]'))showMenu(r,e,p)}}if(MESSAGE_KEYS.get(e)===k)return;MESSAGE_KEYS.set(e,k);if(first||!p.name||!allow(r)||M.has(pk(p))||chatIsActivelyVisible(r,e)){rememberMessage(k);return}toast(r,(F.has(pk(p))?'★ ':'')+dn(p),b,k)}
function mentions(r){if(!S.mentionAutocomplete)return;const c=composer().find(x=>rootFor(x)===r);if(!c)return;const previous=MENT.get(c);if(previous?.box.isConnected)return;if(previous)c.removeEventListener('input',previous.handler);const b=document.createElement('div');b.className='slx-mentions';b.hidden=true;(c.parentElement||r).appendChild(b);const handler=()=>{const v=c.value??'',m=v.match(/(^|\s)@([\w .'-]*)$/);if(!m){b.hidden=true;return}const q=m[2].toLowerCase(),map=new Map;msgs(r).forEach(e=>{const p=who(e),k=pk(p);if(p.name&&!map.has(k))map.set(k,p)});const a=[...map.values()].filter(p=>!q||p.name.toLowerCase().includes(q)||dn(p).toLowerCase().includes(q)).sort((x,y)=>Number(F.has(pk(y)))-Number(F.has(pk(x)))||dn(x).localeCompare(dn(y))).slice(0,7);b.innerHTML='';a.forEach(p=>{const z=document.createElement('button');z.innerHTML='<strong>'+dn(p).replace(/[<>]/g,'')+'</strong>'+(p.id?'<small>#'+p.id+'</small>':'');z.onmousedown=e=>{e.preventDefault();const now=c.value??'',mm=now.match(/(^|\s)@([\w .'-]*)$/);if(mm){c.value=now.slice(0,now.length-mm[2].length)+p.name+' ';c.dispatchEvent(new Event('input',{bubbles:true}));c.focus()}b.hidden=true};b.appendChild(z)});b.hidden=!a.length};c.addEventListener('input',handler);MENT.set(c,{box:b,handler})}
function contextRows(r){return msgs(r).map(e=>({e,p:who(e)})).filter(x=>x.p.name||x.p.id)}
function enhance(r){controls(r);mentions(r);const first=!ROOTS.has(r);msgs(r).forEach(e=>decorate(r,e,first));ROOTS.add(r)}
function clean(){document.querySelectorAll('.slx-head-controls').forEach(x=>{if(!x._root?.isConnected)x.remove()})}
function scan(){document.querySelectorAll('.slx-head-controls .slx-msg-actions').forEach(e=>e.remove());clean();roots().forEach(r=>{controls(r);if(S.enabled){enhance(r);contextRows(r).forEach(({e,p})=>syncContextTrigger(r,e,p))}else{r.querySelectorAll('.slx-msg-actions').forEach(e=>e.remove());r.querySelectorAll('.slx-mentions').forEach(e=>e.remove())}});syncHeaderControlVisibility();bridge()}
function start(){if(O)return;O=new MutationObserver(a=>{if(a.some(m=>m.addedNodes?.length&&!m.target?.closest?.(".slx-head-controls,.slx-toast-host,.slx-mentions,.slx-msg-actions,#slx-menu,#sakalux-chat-settings-overlay"))&&!T){T=setTimeout(()=>{T=null;scan()},120)}});O.observe(document.documentElement,{childList:true,subtree:true})}
function bridge(){let b=document.getElementById('sakalux-module-bridge-'+ID);if(!b){b=document.createElement('button');b.id='sakalux-module-bridge-'+ID;b.hidden=true;b.style.display='none';b.onclick=()=>{const a=b.dataset.action;if(a==='open')settings();else if(a==='on')enable(true);else if(a==='off')enable(false);else if(a==='toggle')enable(!S.enabled);b.dataset.action=''};document.documentElement.appendChild(b)}b.dataset.version=V;b.dataset.enabled=String(S.enabled);b.dataset.ready='true'}
function enable(v){
 S.enabled=!!v;save();
 if(!O)start();
 if(!S.enabled){clearTimeout(T);T=null;hideMenu();closeSearch(true);document.querySelectorAll('.slx-toast-host,.slx-mentions,.slx-msg-actions').forEach(e=>e.remove())}
 scan();syncHeaderControlVisibility();bridge();return S.enabled
}
function syncHeaderControlVisibility(){
 document.querySelectorAll('.slx-head-controls').forEach(x=>{
  const s=x.querySelector('[data-s]'),m=x.querySelector('[data-m]'),e=x.querySelector('[data-e]'),o=x.querySelector('[data-o]');
  if(s)s.hidden=!S.enabled||!S.search;
  if(m)m.hidden=!S.enabled;
  if(e)e.hidden=!S.enabled||!S.exportSearch;
  if(o)o.hidden=false;
 });
}
function settings(){
 if(document.getElementById('sakalux-chat-settings-overlay'))return;
 const o=document.createElement('div');o.id='sakalux-chat-settings-overlay';
 const general=[['enabled','Enhancements enabled'],['search','Search button'],['quickActions','Context actions'],['notifications','Notifications'],['notifyPM','Notify PM'],['notifyFaction','Notify Faction'],['notifyCompany','Notify Company'],['mentionAutocomplete','@mention autocomplete (favorites first + player ID)'],['exportSearch','Export chat/search']];
 const context=[['contextFavorite','★ Favorite'],['contextReply','↩ Reply'],['contextCopyId','ID — Copy player ID'],['contextCopyName','N — Copy name'],['contextProfile','↗ Open profile'],['contextMute','🔇 Local mute'],['contextAlias','✎ Alias + color']];
 const rows=a=>a.map(([k,l])=>'<label>'+l+'<input type="checkbox" data-k="'+k+'" '+(S[k]?'checked':'')+'></label>').join('');
 o.innerHTML='<section><header><b>💬 Chat Intelligence v'+V+'</b><button type="button">×</button></header><main><p class="slx-settings-note">Settings ⚙ always stays available, even when enhancements are disabled.</p><h3>General</h3>'+rows(general)+'<h3>Context menu</h3>'+rows(context)+'<div class="slx-settings-actions"><button type="button" data-clear-mute>Clear mute list ('+M.size+')</button><button type="button" data-clear-people>Clear aliases/favorites ('+F.size+')</button><button type="button" data-reset>Reset settings</button></div></main><footer>SakaLuX [2380374]</footer></section>';
 document.body.appendChild(o);
 const close=()=>o.remove();o.querySelector('header button').onclick=close;o.addEventListener('click',e=>{if(e.target===o)close()});
 o.querySelectorAll('[data-k]').forEach(x=>x.onchange=()=>{
  const k=x.dataset.k;S[k]=x.checked;save();
  if(k==='search'&&!S.search)closeSearch(true);
  if(k==='quickActions'&&!S.quickActions)hideMenu();
  if(k==='mentionAutocomplete'&&!S.mentionAutocomplete)document.querySelectorAll('.slx-mentions').forEach(e=>e.remove());
  if(k==='enabled')enable(S.enabled); else scan();
  syncHeaderControlVisibility();
 });
 o.querySelector('[data-clear-mute]').onclick=e=>{M.clear();saveP();e.currentTarget.textContent='Clear mute list (0)'};
 o.querySelector('[data-clear-people]').onclick=e=>{P={};F.clear();saveP();e.currentTarget.textContent='Clear aliases/favorites (0)';scan()};
 o.querySelector('[data-reset]').onclick=()=>{S={...D};save();hideMenu();closeSearch(true);document.querySelectorAll('.slx-mentions').forEach(e=>e.remove());enable(true);syncHeaderControlVisibility();close();scan()}
}
function css(){const s=document.createElement('style');s.textContent=`
body .slx-head-controls[data-sakalux-chat-controls="1"]{position:absolute!important;right:50px!important;top:0!important;bottom:0!important;transform:none!important;width:auto!important;max-width:none!important;height:auto!important;display:flex!important;align-items:stretch!important;gap:0!important;z-index:2147483001!important;pointer-events:auto!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button{all:unset!important;box-sizing:border-box!important;display:grid!important;place-items:center!important;flex:0 0 34px!important;width:34px!important;min-width:34px!important;max-width:34px!important;height:100%!important;min-height:0!important;padding:0!important;margin:0!important;font-size:15px!important;line-height:1!important;color:#d9e0e6!important;background:transparent!important;border:0!important;border-left:1px solid rgba(255,255,255,.07)!important;border-radius:0!important;box-shadow:none!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button:first-child{border-left:0!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button:active{background:rgba(255,255,255,.10)!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button[hidden]{display:none!important}@media(max-width:520px){body .slx-head-controls[data-sakalux-chat-controls="1"]{right:48px!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button{flex-basis:30px!important;width:30px!important;min-width:30px!important;max-width:30px!important;font-size:14px!important}}
.slx-search{position:fixed!important;z-index:2147483300!important;padding:7px!important;border:1px solid #465462!important;border-radius:8px!important;background:#20262c!important;box-shadow:0 10px 28px #0009!important}.slx-search-title{display:flex!important;justify-content:space-between!important;color:#eee!important;margin-bottom:6px!important}.slx-search-row{display:flex!important;gap:5px!important}.slx-search-row input{flex:1!important;min-width:0!important;height:32px!important;background:#171d22!important;color:#eee!important;border:1px solid #46535f!important;border-radius:6px!important;padding:0 8px!important}.slx-search-row button,.slx-search-title button{width:30px!important;border:0!important;background:#303840!important;color:#eee!important;border-radius:5px!important}
.slx-msg-actions{position:relative!important;display:inline-flex!important;vertical-align:middle!important;align-items:center!important;justify-content:center!important;width:24px!important;height:24px!important;min-width:24px!important;margin:0 0 0 5px!important;padding:0!important;border:1px solid rgba(255,255,255,.20)!important;border-radius:6px!important;background:#313a43!important;color:#fff!important;font-size:17px!important;line-height:1!important;z-index:2147483000!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;box-shadow:0 1px 3px #0008!important}.slx-chat-max-active{overflow:hidden!important}
.slx-toast-host{position:absolute!important;top:44px!important;right:8px!important;z-index:65!important;width:min(300px,calc(100% - 16px))!important;pointer-events:none!important}.slx-toast{margin-bottom:5px!important;padding:8px!important;border:1px solid #465462!important;border-radius:6px!important;background:#20262cf2!important;color:#eee!important}.slx-toast b,.slx-toast span{display:block!important}.slx-toast span{font-size:10px!important;color:#aaa!important}


body .slx-head-controls[data-sakalux-chat-controls="1"]{position:relative!important;right:auto!important;left:auto!important;top:auto!important;bottom:auto!important;transform:none!important;display:flex!important;align-items:stretch!important;justify-content:flex-end!important;gap:0!important;flex:0 0 auto!important;width:auto!important;max-width:none!important;height:100%!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important;white-space:nowrap!important;z-index:20!important;pointer-events:auto!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button{position:relative!important;z-index:2!important;width:30px!important;min-width:30px!important;max-width:30px!important;flex:0 0 30px!important;height:100%!important;min-height:0!important;padding:0!important;margin:0!important;font-size:16px!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button[hidden]{display:none!important}@media(max-width:520px){body .slx-head-controls[data-sakalux-chat-controls="1"] button{width:27px!important;min-width:27px!important;max-width:27px!important;flex-basis:27px!important;font-size:15px!important}.slx-msg-actions{width:24px!important;height:24px!important;min-width:24px!important;margin-left:4px!important}}
#slx-color-picker{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;background:#000b!important;box-sizing:border-box!important}#slx-color-picker>section{width:min(390px,94vw)!important;max-height:82dvh!important;overflow:hidden!important;border:1px solid #485563!important;border-radius:14px!important;background:#171c21!important;color:#eee!important;box-shadow:0 16px 44px #000c!important}#slx-color-picker header{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:12px 14px!important;background:#242b32!important;font-size:15px!important}#slx-color-picker header button{width:34px!important;height:34px!important;border:0!important;border-radius:8px!important;background:#303840!important;color:#fff!important;font-size:20px!important}#slx-color-picker main{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;padding:12px!important;overflow:auto!important}.slx-color-choice{display:grid!important;grid-template-columns:28px 1fr 20px!important;align-items:center!important;gap:9px!important;min-height:44px!important;padding:7px 9px!important;border:1px solid #3d4854!important;border-radius:9px!important;background:#20272e!important;color:#f1f5f9!important;text-align:left!important;font-weight:700!important}.slx-color-choice:active{background:#2b343d!important}.slx-color-swatch{width:26px!important;height:26px!important;border:2px solid rgba(255,255,255,.55)!important;border-radius:50%!important;box-shadow:0 0 0 1px #0008 inset!important}.slx-color-check{text-align:center!important;color:#6ee7b7!important;font-size:17px!important}#slx-color-picker footer{padding:0 12px 12px!important}#slx-color-picker footer button{width:100%!important;min-height:38px!important;border:1px solid #465462!important;border-radius:8px!important;background:#303840!important;color:#eee!important;font-weight:700!important}@media(max-width:420px){#slx-color-picker main{grid-template-columns:1fr 1fr!important;gap:6px!important;padding:9px!important}.slx-color-choice{min-height:40px!important;padding:6px!important;font-size:12px!important}}
.slx-search-results{display:flex!important;flex-direction:column!important;gap:6px!important;max-height:min(48dvh,420px)!important;overflow-y:auto!important;padding:8px!important;border-top:1px solid rgba(255,255,255,.08)!important;background:#151b20!important}.slx-search-result{display:flex!important;flex-direction:column!important;align-items:flex-start!important;width:100%!important;min-height:0!important;padding:8px 10px!important;border:1px solid #394652!important;border-radius:8px!important;background:#202830!important;color:#e9eef3!important;text-align:left!important;box-sizing:border-box!important;white-space:normal!important}.slx-search-result b{font-size:13px!important;line-height:1.25!important;color:#fff!important}.slx-search-result span{display:block!important;margin-top:2px!important;font-size:12px!important;line-height:1.3!important;color:#c5ced7!important;overflow-wrap:anywhere!important}.slx-search-result:active{background:#2a3540!important}.slx-search-empty{padding:12px 8px!important;color:#9aa5b1!important;font-size:12px!important;text-align:center!important}
#slx-menu{position:fixed!important;z-index:2147483646!important;display:flex!important;gap:3px!important;padding:4px!important;border:1px solid #485563!important;border-radius:6px!important;background:#20262c!important;opacity:0!important;visibility:hidden!important}#slx-menu.show{opacity:1!important;visibility:visible!important}#slx-menu button{min-width:31px!important;height:28px!important;border:1px solid #4a5662!important;border-radius:4px!important;background:#303840!important;color:#eee!important}.slx-mentions{position:absolute!important;left:4px!important;right:4px!important;bottom:42px!important;z-index:2147483200!important;max-height:160px!important;overflow:auto!important;padding:4px!important;background:#20262c!important}.slx-mentions button{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;padding:7px!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.06)!important;background:transparent!important;color:#eee!important;text-align:left!important}.slx-mentions small{color:#8fa3ba!important;font-size:10px!important}.slx-settings-actions{display:flex!important;gap:6px!important;flex-wrap:wrap!important;margin-top:8px!important}.slx-settings-actions button{flex:1 1 145px!important;min-height:34px!important;padding:7px 9px!important;background:#1a2634!important;color:#fff!important;border:1px solid #3a4c62!important;border-radius:8px!important}#sakalux-chat-settings-overlay footer{text-align:center!important;padding:8px!important;color:#8fa3ba!important}.slx-settings-note{margin:4px 0 10px!important;padding:8px!important;border:1px solid #394550!important;border-radius:8px!important;background:#20272e!important;color:#aebdca!important;font-size:11px!important;line-height:1.35!important}#sakalux-chat-settings-overlay h3{margin:10px 2px 7px!important;font-size:12px!important;color:#9fb7d0!important;text-transform:uppercase!important;letter-spacing:.5px!important}
#sakalux-chat-settings-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:flex-end!important;background:#000b!important}#sakalux-chat-settings-overlay section{width:100%!important;background:#171c21!important;color:#eee!important}#sakalux-chat-settings-overlay header{display:flex!important;justify-content:space-between!important;padding:11px!important;background:#242b32!important}#sakalux-chat-settings-overlay main{padding:8px!important}#sakalux-chat-settings-overlay label{display:flex!important;justify-content:space-between!important;padding:8px!important;margin-bottom:5px!important;border:1px solid #39434d!important}
`;document.head.appendChild(s)}
addEventListener('scroll',()=>{hideMenu();document.querySelectorAll('.slx-search').forEach(p=>p._place?.())},true);addEventListener('resize',()=>document.querySelectorAll('.slx-search').forEach(p=>p._place?.()));
function init(){css();bridge();window[API]={id:ID,version:V,open:settings,refresh:scan,setEnabled:enable,toggleEnabled:()=>enable(!S.enabled),isEnabled:()=>S.enabled,health:()=>({version:V,roots:roots().length,favorites:F.size,muted:M.size,seenMessages:SEEN.size,seenMessageLimit:4096})};if(S.enabled){start();scan();setTimeout(scan,700)}dispatchEvent(new CustomEvent('SakaLuX:ModuleReady',{detail:{id:ID,version:V,apiGlobal:API}}))}
document.readyState==='loading'?addEventListener('DOMContentLoaded',init,{once:true}):init();
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
 const selector="#sakalux-chat-settings-overlay > section",id="sakalux-inline-footer-chat-intelligence",profile='https://www.torn.com/profiles.php?XID=2380374';
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

/* Compact donation controls and Elimination mobile panel geometry 1.2.16 */
(()=>{const s=document.createElement('style');s.textContent="@media(max-width:820px){\n#sakalux-chat-settings-overlay#sakalux-chat-settings-overlay#sakalux-chat-settings-overlay{position:fixed!important;inset:0 4px 36px!important;top:0!important;bottom:36px!important;left:4px!important;right:4px!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;transform:none!important;box-sizing:border-box!important;padding:0!important;background:transparent!important;overflow:hidden!important;border-radius:14px!important;align-items:stretch!important;justify-content:stretch!important;}\n#sakalux-chat-settings-overlay#sakalux-chat-settings-overlay#sakalux-chat-settings-overlay > section{position:relative!important;inset:auto!important;top:auto!important;bottom:auto!important;left:auto!important;right:auto!important;align-self:stretch!important;flex:1 1 auto!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;max-width:100%!important;margin:0!important;transform:none!important;box-sizing:border-box!important;border:1px solid #3c4652!important;border-radius:14px!important;}\n#sakalux-chat-settings-overlay#sakalux-chat-settings-overlay#sakalux-chat-settings-overlay > section{display:flex!important;flex-direction:column!important;overflow:hidden!important;}\n#sakalux-chat-settings-overlay#sakalux-chat-settings-overlay#sakalux-chat-settings-overlay > section>main{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;}\n\n}";(document.head||document.documentElement).appendChild(s)})();

/* SAKALUX_GLOBAL_STANDALONE_CHAT_INTELLIGENCE */
(()=>{
 const mount=()=>{
  if(!document.body)return;
  let e=document.querySelector('[data-slx-standalone-registration="chat-intelligence"]');
  if(!e){e=document.createElement('span');e.hidden=true;e.setAttribute('data-slx-standalone-registration','chat-intelligence');document.body.appendChild(e);}
  Object.assign(e.dataset,{id:'chat-intelligence',name:'Chat',icon:'💬',selector:'',fallback:'https://www.torn.com/index.php',version:'1.2.37'});
 };
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
})();
