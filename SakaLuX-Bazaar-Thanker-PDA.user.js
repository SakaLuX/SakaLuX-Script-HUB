// ==UserScript==
// @name         SakaLuX Bazaar Thanker - PDA
// @namespace    sakalux.bazaar.thanker
// @version      5.3.44
// @description  Optimized Bazaar Thanker with custom/auto Bazaar name, buyer grouping, details, copy, big buyer detection, statistics and history management.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @downloadURL  https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.user.js
// @updateURL    https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.meta.js
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
  const CORE_VERSION = '1.0.0-test.4';
  const NS = 'SakaLuXCore';

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

  const core = Object.freeze({ version: CORE_VERSION, perf, hub, storage, router, dock, api, ui, logger });

  g[NS] = core;
  g.SakaLuXPerf = perf;
  routeKey = router.key();
  ui.ensureSharedSkin();
})();
/* SakaLuX Shared Core — END */

/* SakaLuX Canonical Installed Version — BEGIN */
(() => {
  'use strict';
  let v = '5.3.44';
  try {
    const meta = globalThis.GM_info && globalThis.GM_info.script && globalThis.GM_info.script.version;
    if (meta) v = String(meta);
  } catch {}
  const g = globalThis;
  g.__SakaLuXInstalledVersions = g.__SakaLuXInstalledVersions || Object.create(null);
  g.__SakaLuXInstalledVersions['bazaar'] = v;
  try {
    document.documentElement?.setAttribute('data-sakalux-installed-bazaar', v);
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
  const VERSION = '1.0.0-test.2';
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
    setTimeout(() => maybePrompt(), 1200);
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
  const SELF = Object.freeze(Object.assign({"id":"bazaar","name":"Bazaar","icon":"💬","selector":"","fallback":"https://www.torn.com/page.php?sid=events"}, { version: "5.3.44" }));
  const API_GLOBAL = "SakaLuXBazaarThanker";
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

    const STORAGE_KEY = 'sakalux_bazaar_thanker_v5';
    const PROCESSED_KEY = 'sakalux_bazaar_processed_events_v2';
    const HISTORY_KEY = 'sakalux_bazaar_thanks_history_v2';
    const PENDING_SUBJECT_KEY = 'sakalux_pending_bazaar_subject';
    const PENDING_HTML_KEY = 'sakalux_pending_bazaar_html';
    const PENDING_PLAIN_KEY = 'sakalux_pending_bazaar_plain';
    const PENDING_XID_KEY = 'sakalux_pending_bazaar_xid';
    const ENABLED_KEY = 'SakaLuX_BT_ENABLED';

    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 12 * 60 * 60 * 1000;
    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';

    const DEFAULTS = {
        sellerId: '2380374',
        bazaarUrl: 'https://www.torn.com/bazaar.php?userID=2380374',
        bazaarName: '',
        priceListUrl: 'https://weav3r.dev/pricelist/2380374',
        subject: 'Thank you for shopping at my bazaar!',
        greeting: 'Hello {name}!',
        message: 'Thanks for shopping at',
        priceListText: 'Link to my price list here! New trader wanting to get a good start in the community!',
        priceListLabel: 'Price List!',
        afterPriceList: 'Hope to see you again soon.',
        favoriteText: 'A favorite would be greatly appreciated :)',
        footer: 'I also rent out 1,000 happiness mansions at $75k for 7 days. If interested, please shoot me a message. Thank You!!',
        cooldownHours: 4,
        bigBuyerItems: 10,
        bigBuyerSpent: 1000000
    };

    let moduleEnabled = localStorage.getItem(ENABLED_KEY) !== '0';

    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return Object.assign({}, DEFAULTS, saved);
        } catch (e) {
            return Object.assign({}, DEFAULTS);
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    function readStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch (e) {
            return {};
        }
    }

    function writeStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function getProcessedEvents() {
        return readStorage(PROCESSED_KEY);
    }

    function hasProcessedEvent(eventKey) {
        return Boolean(getProcessedEvents()[eventKey]);
    }

    function markEventsProcessed(eventKeys) {
        if (!Array.isArray(eventKeys) || !eventKeys.length) return;
        const events = getProcessedEvents();
        const now = Date.now();
        eventKeys.forEach(key => { events[key] = now; });
        cleanupProcessedEvents(events);
        writeStorage(PROCESSED_KEY, events);
    }

    function cleanupProcessedEvents(events) {
        const maxAge = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        Object.keys(events).forEach(key => {
            if (now - Number(events[key]) > maxAge) delete events[key];
        });
    }

    function getHistory() {
        return readStorage(HISTORY_KEY);
    }

    function saveHistory(history) {
        writeStorage(HISTORY_KEY, history);
    }

    function getLastThanked(xid) {
        const history = getHistory();
        return Number(history[xid] || 0);
    }

    function canThank(xid) {
        const settings = loadSettings();
        const last = getLastThanked(xid);
        if (!last) return true;
        const cooldown = Number(settings.cooldownHours || 0) * 60 * 60 * 1000;
        if (cooldown <= 0) return true;
        return Date.now() - last >= cooldown;
    }

    function markThanked(xid) {
        const history = getHistory();
        history[xid] = Date.now();
        cleanupHistory(history);
        saveHistory(history);
    }

    function cleanupHistory(history) {
        const maxAge = 90 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        Object.keys(history).forEach(xid => {
            if (now - Number(history[xid]) > maxAge) delete history[xid];
        });
    }

    function resetHistory() {
        localStorage.removeItem(HISTORY_KEY);
        localStorage.removeItem(PROCESSED_KEY);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function makeLink(url, text) {
        return '<a href="' + escapeHtml(url) + '" target="_blank">' + escapeHtml(text) + '</a>';
    }

    function formatMoney(amount) {
        return Number(amount || 0).toLocaleString();
    }

    function formatDate(timestamp) {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleString();
    }

    function isHubInstalled() {
        return Boolean(
            window.SakaLuXScriptHub ||
            document.getElementById('sakalux-hub-button')
        );
    }

    function rememberHubPrompt() {
        try {
            localStorage.setItem(HUB_PROMPT_STORAGE, String(Date.now()));
        } catch {}
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

    let detectedBazaarName = '';

    function cleanBazaarName(name) {
        if (!name) return '';
        let value = String(name).replace(/\s+/g, ' ').trim();
        value = value.replace(/^your\s+bazaar$/i, '');
        value = value.replace(/^view\s+profile$/i, '');
        value = value.replace(/^bazaar$/i, '');
        value = value.replace(/^your$/i, '');
        return value.trim();
    }

    function getManualBazaarName() {
        return cleanBazaarName(loadSettings().bazaarName);
    }

    function detectBazaarNameFromDocument() {
        const candidates = [];
        if (document.title) candidates.push(document.title);

        const selectors = [
            'h1',
            '.profile-name',
            '.title',
            '.bazaar-name',
            '[class*="bazaar"] h1',
            '[class*="bazaar"] .title',
            '[class*="bazaar"]'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                const text = el.textContent.replace(/\s+/g, ' ').trim();
                if (text && text.length < 150) candidates.push(text);
            });
        });

        const sellerId = loadSettings().sellerId;
        document.querySelectorAll('a[href*="XID="]').forEach(link => {
            const href = link.href || '';
            if (href.includes('XID=' + sellerId)) {
                const text = link.textContent.replace(/\s+/g, ' ').trim();
                if (text) candidates.push(text);
            }
        });

        const blacklist = ['your', 'your bazaar', 'view profile', 'bazaar', 'events', 'torn', 'home'];

        for (const candidate of candidates) {
            const value = cleanBazaarName(candidate);
            if (!value) continue;
            if (blacklist.includes(value.toLowerCase())) continue;
            if (value.length > 80) continue;
            return value;
        }

        return '';
    }

    async function detectBazaarName() {
        const manual = getManualBazaarName();
        if (manual) {
            detectedBazaarName = manual;
            return manual;
        }

        const current = detectBazaarNameFromDocument();
        if (current) {
            detectedBazaarName = current;
            return current;
        }

        const settings = loadSettings();

        try {
            const response = await fetch(settings.bazaarUrl, { credentials: 'include' });
            if (response.ok) {
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const title = cleanBazaarName(doc.title);

                if (title && !/^torn$/i.test(title)) {
                    detectedBazaarName = title;
                    return title;
                }

                const selectors = [
                    'h1',
                    '.profile-name',
                    '.title',
                    '.bazaar-name',
                    '[class*="bazaar"] h1',
                    '[class*="bazaar"] .title'
                ];

                for (const selector of selectors) {
                    const elements = doc.querySelectorAll(selector);
                    for (const element of elements) {
                        const value = cleanBazaarName(element.textContent);
                        if (value && value.length < 80 && !/view profile/i.test(value)) {
                            detectedBazaarName = value;
                            return value;
                        }
                    }
                }
            }
        } catch (e) {
            console.log('[SakaLuX] Bazaar name detection failed:', e);
        }

        const sellerLink = document.querySelector('a[href*="XID=' + settings.sellerId + '"]');
        if (sellerLink) {
            const name = cleanBazaarName(sellerLink.textContent);
            if (name) {
                detectedBazaarName = name + ' Bazaar';
                return detectedBazaarName;
            }
        }

        detectedBazaarName = 'SakaLuX Bazaar';
        return detectedBazaarName;
    }

    function getCleanEventText(p) {
        const clone = p.cloneNode(true);
        clone.querySelectorAll('.sakalux-bt-ui').forEach(el => el.remove());
        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    function parsePurchase(text) {
        const clean = text.replace(/\s+/g, ' ').trim();
        const match = clean.match(/bought\s+([\d,]+)\s+x\s+(.+?)\s+from your bazaar\s+for\s+\$([\d,]+)/i);
        if (!match) return null;
        return {
            qty: Number(match[1].replace(/,/g, '')),
            item: match[2].trim(),
            price: Number(match[3].replace(/,/g, ''))
        };
    }

    function unitPrice(purchase) {
        const qty = Math.max(1, Number(purchase?.qty) || 1);
        return Math.round((Number(purchase?.price) || 0) / qty);
    }

    function getBuyerFromEvent(p) {
        const link = p.querySelector('a[href*="XID="]');
        if (!link) return null;
        const match = link.href.match(/XID=(\d+)/);
        if (!match) return null;
        return { id: match[1], name: link.textContent.trim(), link };
    }

    function getEventKey(p, buyer) {
        return buyer.id + '|' + getCleanEventText(p);
    }

    function getBazaarParagraphs() {
        return [...document.querySelectorAll('p')].filter(
            p => !p.closest('.sakalux-bt-ui') && p.textContent.toLowerCase().includes('from your bazaar')
        );
    }

    function getBuyerGroups() {
        const groups = new Map();

        getBazaarParagraphs().forEach(p => {
            const buyer = getBuyerFromEvent(p);
            if (!buyer) return;

            const purchase = parsePurchase(getCleanEventText(p));
            if (!purchase) return;

            const eventKey = getEventKey(p, buyer);

            if (!groups.has(buyer.id)) {
                groups.set(buyer.id, {
                    id: buyer.id,
                    name: buyer.name,
                    paragraphs: [],
                    events: [],
                    purchases: {},
                    totalItems: 0,
                    totalSpent: 0
                });
            }

            const group = groups.get(buyer.id);
            group.paragraphs.push(p);
            group.events.push({ paragraph: p, eventKey, purchase });

            const item = purchase.item;
            if (!group.purchases[item]) group.purchases[item] = { qty: 0, spent: 0 };
            group.purchases[item].qty += purchase.qty;
            group.purchases[item].spent += purchase.price;
            group.totalItems += purchase.qty;
            group.totalSpent += purchase.price;
        });

        return groups;
    }

    function isBigBuyer(group) {
        const settings = loadSettings();
        return group.totalItems >= Number(settings.bigBuyerItems || 0) ||
            group.totalSpent >= Number(settings.bigBuyerSpent || 0);
    }

    function buildBuyerSummary(group) {
        let text = `${group.name} [XID: ${group.id}]\n\n`;
        text += `Purchases: ${group.events.length}\n`;
        text += `Total items: ${group.totalItems}\n`;
        text += `Total spent: $${formatMoney(group.totalSpent)}\n\n`;
        text += 'Items:\n';

        Object.keys(group.purchases).forEach(item => {
            const p = group.purchases[item];
            text += `• ${item} — ${p.qty} x $${formatMoney(p.spent)}\n`;
        });

        return text;
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
                return true;
            } catch (err) {
                return false;
            }
        }
    }

    function showDetails(group) {
        const old = document.getElementById('sakalux-bt-details');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'sakalux-bt-details';
        modal.style.cssText = `
            position:fixed;z-index:1000000;inset:0;background:rgba(0,0,0,.72);
            display:flex;align-items:center;justify-content:center;padding:15px;
            box-sizing:border-box;font-family:Arial,sans-serif;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            width:94vw;max-width:560px;max-height:85vh;overflow:auto;background:#181818;
            color:#fff;border:1px solid #666;border-radius:14px;padding:18px;
            box-sizing:border-box;box-shadow:0 15px 50px rgba(0,0,0,.8);
        `;

        let itemsHtml = '';
        Object.keys(group.purchases).forEach(item => {
            const p = group.purchases[item];
            itemsHtml += `<div style="padding:9px 0;border-bottom:1px solid #333;"><b>${escapeHtml(item)}</b><br>Quantity: ${p.qty}<br>Spent: $${formatMoney(p.spent)}</div>`;
        });

        box.innerHTML = `
            <div style="font-size:20px;font-weight:bold;margin-bottom:12px;">👤 ${escapeHtml(group.name)}</div>
            <div style="color:#aaa;margin-bottom:15px;">XID: ${group.id}</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:15px;">
                <div style="background:#252525;padding:10px;border-radius:8px;text-align:center;"><b>${group.events.length}</b><br><small>Purchases</small></div>
                <div style="background:#252525;padding:10px;border-radius:8px;text-align:center;"><b>${group.totalItems}</b><br><small>Items</small></div>
                <div style="background:#252525;padding:10px;border-radius:8px;text-align:center;"><b>$${formatMoney(group.totalSpent)}</b><br><small>Total</small></div>
            </div>
            ${isBigBuyer(group) ? '<div style="padding:9px;margin-bottom:12px;border-radius:7px;background:#5b4717;border:1px solid #9b7b25;">⭐ BIG BUYER</div>' : ''}
            <div style="font-size:16px;font-weight:bold;margin-bottom:5px;">Purchases</div>
            ${itemsHtml}
            <div style="display:flex;gap:8px;margin-top:15px;">
                <button id="sbtDetailsCopy" style="${buttonStyle('#2878ff')}">📋 COPY</button>
                <button id="sbtDetailsClose" style="${buttonStyle('#555')}">CLOSE</button>
            </div>
        `;

        modal.appendChild(box);
        document.body.appendChild(modal);

        document.getElementById('sbtDetailsClose').onclick = () => modal.remove();
        document.getElementById('sbtDetailsCopy').onclick = async () => {
            const ok = await copyText(buildBuyerSummary(group));
            const btn = document.getElementById('sbtDetailsCopy');
            btn.textContent = ok ? '✓ COPIED' : 'COPY FAILED';
            setTimeout(() => { if (btn) btn.textContent = '📋 COPY'; }, 1500);
        };

        modal.addEventListener('click', e => {
            if (e.target === modal) modal.remove();
        });
    }

    async function buildMessage(group) {
        const settings = loadSettings();
        const bazaarName = await detectBazaarName();
        const greeting = settings.greeting.replace(/\{name\}/g, escapeHtml(group.name));
        const bazaarLink = makeLink(settings.bazaarUrl, bazaarName);
        const priceListLink = makeLink(settings.priceListUrl, settings.priceListLabel);
        const sellerLink = makeLink(
            'https://www.torn.com/profiles.php?XID=2380374',
            '🙏'
        );

        let purchaseLines = '';
        Object.keys(group.purchases).forEach(item => {
            const p = group.purchases[item];
            purchaseLines += '• ' + escapeHtml(item) + ' (' + p.qty + ' x $' + formatMoney(Math.round(p.spent / Math.max(1, p.qty))) + ')<br>';
        });

        let mainMessage = String(settings.message || '').trim();
        mainMessage = mainMessage
            .replace(/Thanks\s+for\s+shopping\s+at\s*$/i, 'Thanks for shopping at')
            .replace(/Thanks\s+for\s+shopping\s+at\s+my\s+bazaar\s*!?/gi, 'Thanks for shopping at')
            .replace(/Thanks\s+for\s+shopping\s+at\s+SakaLuX\s+Bazaar\s*!?/gi, 'Thanks for shopping at')
            .trim();

        if (!mainMessage || /^thanks\s+for\s+shopping\s+at\s*$/i.test(mainMessage) === false) {
            if (/^thanks\s+for\s+shopping\s+at/i.test(mainMessage)) {
                mainMessage = 'Thanks for shopping at';
            }
        }

        const thanksLine = mainMessage + ' ' + bazaarLink + '!';

        const html = `
            ${greeting}<br><br>
            ${thanksLine}<br><br>
            ${escapeHtml(settings.priceListText)}${priceListLink}<br><br>
            ${escapeHtml(settings.afterPriceList)}<br><br>
            You purchased:<br><br>
            ${purchaseLines}
            <br>
            Total items: ${group.totalItems}<br>
            Total spent: $${formatMoney(group.totalSpent)}<br><br>
            ${escapeHtml(settings.favoriteText)}${sellerLink}<br><br>
            ${escapeHtml(settings.footer)}
        `;

        return { html, plain: stripHtml(html) };
    }

    function stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.innerText;
    }

    async function storePending(group) {
        const settings = loadSettings();
        const message = await buildMessage(group);
        localStorage.setItem(PENDING_SUBJECT_KEY, settings.subject);
        localStorage.setItem(PENDING_HTML_KEY, message.html);
        localStorage.setItem(PENDING_PLAIN_KEY, message.plain);
        localStorage.setItem(PENDING_XID_KEY, group.id);
    }

    function openMessage(xid) {
        window.location.href = 'https://www.torn.com/messages.php#/p=compose&XID=' + encodeURIComponent(xid);
    }

    function removeBuyerUI(xid) {
        document.querySelectorAll('.sakalux-bt-ui[data-buyer-id="' + CSS.escape(xid) + '"]').forEach(el => el.remove());
    }

    function createBuyerUI(group) {
        if (!group || !group.paragraphs.length) return;
        if (document.querySelector('.sakalux-bt-ui[data-buyer-id="' + CSS.escape(group.id) + '"]')) return;

        const firstParagraph = group.paragraphs[0];
        const eventKeys = group.events.map(e => e.eventKey);
        const alreadyProcessed = eventKeys.some(hasProcessedEvent);
        const allowed = canThank(group.id);

        const wrapper = document.createElement('span');
        wrapper.className = 'sakalux-bt-ui';
        wrapper.dataset.buyerId = group.id;
        wrapper.style.cssText = 'display:inline-flex;flex-direction:column;align-items:flex-start;gap:4px;margin-left:8px;vertical-align:middle;font-family:Arial,sans-serif;';

        const topRow = document.createElement('span');
        topRow.style.cssText = 'display:inline-flex;align-items:center;gap:5px;';

        const thankButton = document.createElement('button');
        thankButton.className = 'sakalux-thanks-button';

        const count = group.events.length;
        const countText = `${count} purchase${count !== 1 ? 's' : ''}`;

        if (!allowed || alreadyProcessed) {
            thankButton.textContent = '✓ THANKED';
            thankButton.disabled = true;
            thankButton.style.cssText = 'padding:5px 9px;border-radius:6px;border:1px solid #397b4b;background:#246b35;color:#fff;font-weight:bold;font-size:12px;opacity:.85;white-space:nowrap;';
        } else {
            thankButton.textContent = `💬 THANKS (${count})`;
            thankButton.style.cssText = 'padding:5px 9px;border-radius:6px;border:1px solid #777;background:#292929;color:#fff;font-weight:bold;font-size:12px;cursor:pointer;white-space:nowrap;';

            thankButton.onclick = async function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (thankButton.disabled) return;
                thankButton.disabled = true;

                try {
                    await storePending(group);
                } catch (e) {
                    console.error('[SakaLuX] Message generation failed:', e);
                    thankButton.disabled = false;
                    return;
                }

                markEventsProcessed(eventKeys);
                markThanked(group.id);
                thankButton.textContent = '✓ THANKED';
                thankButton.style.background = '#246b35';
                thankButton.style.borderColor = '#397b4b';
                thankButton.style.cursor = 'default';

                document.querySelectorAll('.sakalux-bt-ui[data-buyer-id="' + CSS.escape(group.id) + '"]').forEach(el => {
                    if (el !== wrapper) el.remove();
                });

                setTimeout(() => openMessage(group.id), 50);
            };
        }

        const detailsButton = document.createElement('button');
        detailsButton.textContent = 'DETAILS';
        detailsButton.className = 'sakalux-bt-details-button';
        detailsButton.style.cssText = 'padding:5px 8px;border-radius:6px;border:1px solid #555;background:#202020;color:#ddd;font-weight:bold;font-size:11px;cursor:pointer;white-space:nowrap;';
        detailsButton.onclick = function (event) {
            event.preventDefault();
            event.stopPropagation();
            showDetails(group);
        };

        /* SakaLuX Bazaar ↔ Suite Event Actions — BAZAAR v1 */
        const info = document.createElement('span');
        info.className = 'sakalux-bt-info';
        info.style.cssText = 'display:block;color:#aaa;font-size:11px;white-space:nowrap;padding-left:2px;';
        info.textContent = `${countText} • ${group.totalItems} item${group.totalItems !== 1 ? 's' : ''} • $${formatMoney(group.totalSpent)}`;

        if (isBigBuyer(group)) {
            info.style.color = '#e5c55b';
            info.textContent = '⭐ ' + info.textContent;
        }

        topRow.appendChild(thankButton);
        topRow.appendChild(detailsButton);
        wrapper.appendChild(topRow);
        wrapper.appendChild(info);
        firstParagraph.appendChild(wrapper);
    }

    function processBuyerGroups() {
        if (!moduleEnabled || !location.href.includes('sid=events')) return;
        const groups = getBuyerGroups();

        document.querySelectorAll('.sakalux-bt-ui[data-buyer-id]').forEach(ui => {
            const xid = ui.dataset.buyerId;
            if (!groups.has(xid)) ui.remove();
        });

        groups.forEach(group => createBuyerUI(group));
    }

    function getStatistics() {
        const groups = getBuyerGroups();
        let buyers = 0;
        let purchases = 0;
        let items = 0;
        let spent = 0;

        groups.forEach(group => {
            buyers++;
            purchases += group.events.length;
            items += group.totalItems;
            spent += group.totalSpent;
        });

        return { buyers, purchases, items, spent };
    }

    function createSettings() {
        if (document.getElementById('sakalux-bt-settings')) return;

        const settings = loadSettings();
        const panel = document.createElement('div');
        panel.id = 'sakalux-bt-settings';
        panel.style.cssText = 'position:fixed;z-index:999999;top:52px;left:50%;transform:translateX(-50%);width:min(94vw,640px);max-height:88vh;overflow:auto;background:linear-gradient(160deg,#111a26,#0b1119);color:#f8fafc;border:1px solid #334155;border-radius:18px;padding:18px;box-sizing:border-box;display:none;box-shadow:0 18px 55px rgba(0,0,0,.75);font-family:Arial,sans-serif;';

        panel.innerHTML = `
            <div class="sbt-settings-head">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px;"><div style="font-size:21px;font-weight:900;letter-spacing:.01em;">⚙️ SakaLuX Bazaar Thanker</div><span style="padding:5px 8px;border:1px solid #334155;border-radius:999px;background:#172235;color:#93c5fd;font-size:10px;font-weight:900;">PDA</span></div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:15px;">Version ${BAZAAR_VERSION} · buyer messages and bazaar analytics</div>
            </div><div class="sbt-settings-content">
            <div id="sbtStats" style="background:linear-gradient(145deg,#172334,#111923);border:1px solid #334155;border-radius:12px;padding:12px;margin-bottom:15px;"></div>
            <label>Your Torn ID</label><input id="sbtSellerId" value="${escapeHtml(settings.sellerId)}" style="${inputStyle()}">
            <label>Bazaar URL</label><input id="sbtBazaarUrl" value="${escapeHtml(settings.bazaarUrl)}" style="${inputStyle()}">
            <label>Bazaar Name <span style="color:#777;font-size:11px;">(leave empty for automatic detection)</span></label>
            <input id="sbtBazaarName" value="${escapeHtml(settings.bazaarName)}" placeholder="Example: SakaLuX Bazaar" style="${inputStyle()}">
            <div style="color:#888;font-size:11px;margin-top:-8px;margin-bottom:14px;">This name becomes the clickable Bazaar link in the THANK YOU message.</div>
            <label>Price List URL</label><input id="sbtPriceListUrl" value="${escapeHtml(settings.priceListUrl)}" style="${inputStyle()}">
            <label>Subject</label><input id="sbtSubject" value="${escapeHtml(settings.subject)}" style="${inputStyle()}">
            <label>Greeting</label><textarea id="sbtGreeting" style="${textareaStyle()}">${escapeHtml(settings.greeting)}</textarea>
            <label>Main message prefix</label><textarea id="sbtMessage" style="${textareaStyle()}">${escapeHtml(settings.message)}</textarea>
            <div style="color:#888;font-size:11px;margin-top:-8px;margin-bottom:14px;">Normally leave this as: "Thanks for shopping at"</div>
            <label>Price List sentence</label><textarea id="sbtPriceText" style="${textareaStyle()}">${escapeHtml(settings.priceListText)}</textarea>
            <label>Price List clickable text</label><input id="sbtPriceLabel" value="${escapeHtml(settings.priceListLabel)}" style="${inputStyle()}">
            <label>Text after Price List</label><textarea id="sbtAfterPrice" style="${textareaStyle()}">${escapeHtml(settings.afterPriceList)}</textarea>
            <label>Favorite sentence</label><textarea id="sbtFavorite" style="${textareaStyle()}">${escapeHtml(settings.favoriteText)}</textarea>
            <label>Footer</label><textarea id="sbtFooter" style="${textareaStyle()}">${escapeHtml(settings.footer)}</textarea>
            <label>Cooldown (hours)</label><input id="sbtCooldown" type="number" min="0" max="168" step="0.5" value="${Number(settings.cooldownHours)}" style="${inputStyle()}">
            <div style="font-size:16px;font-weight:bold;margin:8px 0 4px;">⭐ Big Buyer</div>
            <div style="color:#888;font-size:12px;margin-bottom:8px;">A buyer becomes BIG when either threshold is reached.</div>
            <label>Minimum items</label><input id="sbtBigItems" type="number" min="0" value="${Number(settings.bigBuyerItems)}" style="${inputStyle()}">
            <label>Minimum spent</label><input id="sbtBigSpent" type="number" min="0" value="${Number(settings.bigBuyerSpent)}" style="${inputStyle()}">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:5px;">
                <button id="sbtSave" style="${buttonStyle('#2878ff')}">SAVE</button>
                <button id="sbtReset" style="${buttonStyle('#555')}">RESET SETTINGS</button>
                <button id="sbtResetHistory" style="${buttonStyle('#8b3030')}">🧹 RESET HISTORY</button>
                <button id="sbtClose" style="${buttonStyle('#444')}">CLOSE</button>
            </div></div>
        `;

        document.body.appendChild(panel);


        document.getElementById('sbtClose').onclick = () => { panel.style.display = 'none'; };

        document.getElementById('sbtSave').onclick = function () {
            const newSettings = {
                sellerId: document.getElementById('sbtSellerId').value.trim(),
                bazaarUrl: document.getElementById('sbtBazaarUrl').value.trim(),
                bazaarName: document.getElementById('sbtBazaarName').value.trim(),
                priceListUrl: document.getElementById('sbtPriceListUrl').value.trim(),
                subject: document.getElementById('sbtSubject').value,
                greeting: document.getElementById('sbtGreeting').value,
                message: document.getElementById('sbtMessage').value,
                priceListText: document.getElementById('sbtPriceText').value,
                priceListLabel: document.getElementById('sbtPriceLabel').value,
                afterPriceList: document.getElementById('sbtAfterPrice').value,
                favoriteText: document.getElementById('sbtFavorite').value,
                footer: document.getElementById('sbtFooter').value,
                cooldownHours: Number(document.getElementById('sbtCooldown').value),
                bigBuyerItems: Number(document.getElementById('sbtBigItems').value),
                bigBuyerSpent: Number(document.getElementById('sbtBigSpent').value)
            };

            saveSettings(newSettings);
            detectedBazaarName = '';
            panel.style.display = 'none';
            processBuyerGroups();
        };

        document.getElementById('sbtReset').onclick = function () {
            if (!confirm('Reset all message settings?')) return;
            saveSettings(DEFAULTS);
            detectedBazaarName = '';
            location.reload();
        };

        document.getElementById('sbtResetHistory').onclick = function () {
            if (!confirm('Reset THANKED history and processed events?')) return;
            resetHistory();
            alert('THANKED history has been reset.');
            processBuyerGroups();
        };
    }

    function updateStats() {
        const box = document.getElementById('sbtStats');
        if (!box) return;
        const stats = getStatistics();
        box.innerHTML = `
            <div style="font-weight:bold;margin-bottom:8px;">📊 Current Event Statistics</div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:7px;">
                <div>Buyers: <b>${stats.buyers}</b></div>
                <div>Purchases: <b>${stats.purchases}</b></div>
                <div>Items: <b>${stats.items}</b></div>
                <div>Value: <b>$${formatMoney(stats.spent)}</b></div>
            </div>
        `;
    }

    function inputStyle() {
        return 'width:100%;height:42px;margin:6px 0 14px;padding:8px;box-sizing:border-box;background:#090909;color:#fff;border:1px solid #555;border-radius:6px;font-size:15px;';
    }

    function textareaStyle() {
        return 'width:100%;min-height:70px;margin:6px 0 14px;padding:8px;box-sizing:border-box;background:#090909;color:#fff;border:1px solid #555;border-radius:6px;font-size:15px;resize:vertical;';
    }

    function buttonStyle(color) {
        return `min-height:42px;background:${color};color:#fff;border:0;border-radius:7px;font-weight:bold;cursor:pointer;`;
    }

    function fillSubject() {
        if (!moduleEnabled) return;
        const subject = localStorage.getItem(PENDING_SUBJECT_KEY);
        if (!subject) return;
        const input = document.querySelector('input.subject');
        if (!input) return;
        if (!input.value) setNativeValue(input, subject);
        localStorage.removeItem(PENDING_SUBJECT_KEY);
    }

    function fillMessageEditor() {
        if (!moduleEnabled) return;
        const html = localStorage.getItem(PENDING_HTML_KEY);
        if (!html) return;

        try {
            if (window.tinymce && window.tinymce.activeEditor) {
                window.tinymce.activeEditor.setContent(html);
                localStorage.removeItem(PENDING_HTML_KEY);
                localStorage.removeItem(PENDING_PLAIN_KEY);
                return;
            }
        } catch (e) {
            console.log('[SakaLuX] TinyMCE error', e);
        }

        const iframe = document.querySelector('iframe[id^="mce_"]') || document.querySelector('.tox-edit-area iframe');
        if (iframe) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc && doc.body) {
                    doc.body.innerHTML = html;
                    doc.body.dispatchEvent(new Event('input', { bubbles: true }));
                    localStorage.removeItem(PENDING_HTML_KEY);
                    localStorage.removeItem(PENDING_PLAIN_KEY);
                    return;
                }
            } catch (e) {
                console.log('[SakaLuX] iframe editor error', e);
            }
        }

        const editable = document.querySelector('[contenteditable="true"]');
        if (editable) {
            editable.innerHTML = html;
            editable.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
            localStorage.removeItem(PENDING_HTML_KEY);
            localStorage.removeItem(PENDING_PLAIN_KEY);
            return;
        }

        const textarea = document.querySelector('textarea');
        if (textarea) {
            const plain = localStorage.getItem(PENDING_PLAIN_KEY) || stripHtml(html);
            setNativeValue(textarea, plain);
            localStorage.removeItem(PENDING_HTML_KEY);
            localStorage.removeItem(PENDING_PLAIN_KEY);
        }
    }

    function setNativeValue(element, value) {
        const prototype = Object.getPrototypeOf(element);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
        if (descriptor && descriptor.set) descriptor.set.call(element, value);
        else element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    let eventObserver = null;
    let eventProcessTimer = null;

    function scheduleProcess() {
        if (!moduleEnabled || eventProcessTimer) return;
        eventProcessTimer = setTimeout(function () {
            eventProcessTimer = null;
            processBuyerGroups();
            updateStats();
        }, 60);
    }

    function startEventObserver() {
        if (!moduleEnabled || eventObserver) return;
        eventObserver = new MutationObserver(function (records) { if (!window.SakaLuXPerf?.unrelated?.(records)) scheduleProcess(); });
        eventObserver.observe(document.body, { childList: true, subtree: true });
    }

    let messageObserver = null;

    function startMessageObserver() {
        if (!moduleEnabled || messageObserver) return;
        messageObserver = new MutationObserver(function () {
            fillSubject();
            fillMessageEditor();
        });
        messageObserver.observe(document.body, { childList: true, subtree: true });
        fillSubject();
        fillMessageEditor();
        setTimeout(fillSubject, 300);
        setTimeout(fillMessageEditor, 300);
        setTimeout(fillSubject, 1000);
        setTimeout(fillMessageEditor, 1000);
        setTimeout(fillSubject, 2000);
        setTimeout(fillMessageEditor, 2000);
    }

    const BAZAAR_VERSION='5.3.42';

    function openSettingsPanel() {
        if (!moduleEnabled) setEnabled(true);
        createSettings();
        const panel = document.getElementById('sakalux-bt-settings');
        if (!panel) return false;
        panel.style.display = 'flex';
        updateStats();
        return true;
    }

    function closeSettingsPanel() {
        const panel = document.getElementById('sakalux-bt-settings');
        if (!panel) return false;
        panel.style.display = 'none';
        return true;
    }

    function startRuntime() {
        if (!moduleEnabled) return;
        if (location.href.includes('sid=events')) {
            createSettings();
            processBuyerGroups();
            startEventObserver();
        }
        if (location.pathname.includes('messages.php')) startMessageObserver();
    }

    function stopRuntime() {
        eventObserver?.disconnect();
        messageObserver?.disconnect();
        eventObserver = null;
        messageObserver = null;
        if (eventProcessTimer) clearTimeout(eventProcessTimer);
        eventProcessTimer = null;
        document.querySelectorAll('.sakalux-bt-ui').forEach(element => element.remove());
        document.getElementById('sakalux-bt-details')?.remove();
        document.getElementById('sakalux-bt-settings')?.remove();
        document.getElementById(HUB_PROMPT_ID)?.remove();
    }

    function setEnabled(value) {
        moduleEnabled = Boolean(value);
        localStorage.setItem(ENABLED_KEY, moduleEnabled ? '1' : '0');
        if (moduleEnabled) startRuntime();
        else stopRuntime();
        window.dispatchEvent(new CustomEvent('SakaLuX:BazaarThankerStateChanged', { detail: { version: BAZAAR_VERSION, enabled: moduleEnabled } }));
        syncHubBridge('bazaar', moduleEnabled);
        return moduleEnabled;
    }

    function toggleEnabled() {
        return setEnabled(!moduleEnabled);
    }

    function syncHubBridge(id, value) { const bridge = document.getElementById('sakalux-module-bridge-' + id); if (bridge) bridge.dataset.enabled = String(Boolean(value)); }
    function installHubBridge(id, openHandler) {
        let bridge = document.getElementById('sakalux-module-bridge-' + id);
        if (!bridge) { bridge = document.createElement('button'); bridge.type = 'button'; bridge.id = 'sakalux-module-bridge-' + id; bridge.hidden = true; (document.body || document.documentElement).appendChild(bridge); }
        bridge.dataset.version = BAZAAR_VERSION; bridge.dataset.enabled = String(Boolean(moduleEnabled));
        bridge.onclick = () => { const action = bridge.dataset.action; if (action === 'open') openHandler(); else if (action === 'toggle') toggleEnabled(); else if (action === 'on' || action === 'off') setEnabled(action === 'on'); bridge.dataset.action = ''; syncHubBridge(id, moduleEnabled); };
    }

    window.SakaLuXBazaarThanker = {
        id: 'bazaar-thanker',
        name: 'Bazaar Thanker',
        version: BAZAAR_VERSION,

        open() {
            return openSettingsPanel();
        },

        close() {
            return closeSettingsPanel();
        },

        refresh() {
            if (location.href.includes('sid=events')) {
                processBuyerGroups();
                updateStats();
            }
            return true;
        },
        setEnabled,
        toggleEnabled,
        isEnabled() { return moduleEnabled; },

        stats() {
            if (!location.href.includes('sid=events')) {
                return { buyers: 0, purchases: 0, items: 0, spent: 0 };
            }
            return getStatistics();
        },

        health() {
            const onEvents = location.href.includes('sid=events');
            const onMessages = location.pathname.includes('messages.php');
            let statistics = { buyers: 0, purchases: 0, items: 0, spent: 0 };

            if (onEvents) {
                try {
                    statistics = getStatistics();
                } catch (e) {
                    console.error('[SakaLuX Bazaar Thanker] Health stats error:', e);
                }
            }

            return {
                ready: true,
                version: BAZAAR_VERSION,
                enabled: moduleEnabled,
                onEvents,
                onMessages,
                settingsAvailable: Boolean(document.getElementById('sakalux-bt-settings')),
                buttonAvailable: Boolean(document.getElementById('sakalux-bt-settings-button')),
                observerActive: Boolean(eventObserver || messageObserver),
                detectedBazaarName: detectedBazaarName || '',
                buyers: statistics.buyers,
                purchases: statistics.purchases,
                items: statistics.items,
                spent: statistics.spent
            };
        },

        goToEvents() {
            location.href = 'https://www.torn.com/page.php?sid=events';
            return true;
        }
    };

    window.dispatchEvent(new CustomEvent('SakaLuX:BazaarThankerReady', {
        detail: { version: BAZAAR_VERSION, enabled: moduleEnabled }
    }));

    function init() {
        try { localStorage.setItem('SakaLuX_Installed_bazaar', BAZAAR_VERSION); } catch {}
        installHubBridge('bazaar', openSettingsPanel);
        if (moduleEnabled) {
            startRuntime();
            scheduleHubInstallPrompt();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }


    /* SakaLuX Unified Control Center UI — visual layer only. */
    function installSakaLuXUnifiedTheme_bazaar() {
        if (document.getElementById('sakalux-unified-theme-bazaar')) return;
        const style = document.createElement('style');
        style.id = 'sakalux-unified-theme-bazaar';
        style.textContent = `
:where([id^="sakalux-bt-"],[class*="sakalux-bt-"]){font-family:Inter,Arial,sans-serif!important;box-sizing:border-box}
:where([id^="sakalux-bt-"][id*="panel" i],[id^="sakalux-bt-"][id*="settings" i],[id^="sakalux-bt-"][id*="modal" i],[id^="sakalux-bt-"][id*="details" i]){background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%)!important;color:#e7edf5!important;border:1px solid #314154!important;border-radius:16px!important;box-shadow:0 18px 52px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.025)!important}
:where([class*="sakalux-bt-"][class*="header" i],[id^="sakalux-bt-"][id*="header" i]){background:linear-gradient(155deg,#1b2634,#111923)!important;border-color:#314154!important;color:#f8fafc!important}
:where([class*="sakalux-bt-"][class*="card" i],[class*="sakalux-bt-"][class*="row" i],[class*="sakalux-bt-"][class*="section" i],[class*="sakalux-bt-"][class*="note" i]){background:linear-gradient(145deg,#18212d,#131b25)!important;border-color:#2d3c4e!important;border-radius:12px!important;color:#dce6f0!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}
:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"]){border:1px solid #3d78bf!important;border-radius:10px!important;background:linear-gradient(180deg,#377fcf,#275f9f)!important;color:#fff!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,filter .12s ease!important}
:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"]):active{transform:translateY(1px)!important}
:where(input[id^="sakalux-bt-"],select[id^="sakalux-bt-"],textarea[id^="sakalux-bt-"],[id^="sakalux-bt-"] input,[id^="sakalux-bt-"] select,[id^="sakalux-bt-"] textarea){background:#0d141d!important;border:1px solid #3a4b61!important;border-radius:9px!important;color:#f4f7fb!important;outline:none!important}
:where(input[type="checkbox"][id^="sakalux-bt-"]){appearance:none!important;-webkit-appearance:none!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0 8px 0 0!important;vertical-align:middle!important;border:1px solid #546276!important;border-radius:999px!important;background:radial-gradient(circle at 10px 50%,#e7edf5 0 6px,transparent 6.5px),#465365!important;cursor:pointer!important;transition:.18s ease!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)!important}
:where(input[type="checkbox"][id^="sakalux-bt-"]):checked{border-color:#24754f!important;background:radial-gradient(circle at 27px 50%,#fff 0 6px,transparent 6.5px),#1eb36a!important}
:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[id*="close" i],:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[class*="close" i],:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[id*="back" i],:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[class*="gray" i],:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[class*="secondary" i]{background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}
:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[id*="clear" i],:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[id*="reset" i],:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[id*="delete" i],:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[class*="danger" i],:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"])[class*="red" i]{background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
@media(max-width:520px){:where([id^="sakalux-bt-"][id*="panel" i],[id^="sakalux-bt-"][id*="settings" i],[id^="sakalux-bt-"][id*="modal" i],[id^="sakalux-bt-"][id*="details" i]){border-radius:15px!important}:where(button[id^="sakalux-bt-"],button[class*="sakalux-bt-"]){min-height:34px!important}}
`;
        (document.head || document.documentElement).appendChild(style);
    }
    installSakaLuXUnifiedTheme_bazaar();

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
 const selector="#sakalux-bt-settings",id="sakalux-inline-footer-bazaar-thanker",profile='https://www.torn.com/profiles.php?XID=2380374';
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

/* Compact donation controls and Elimination mobile panel geometry 5.3.37 */
(()=>{const s=document.createElement('style');s.textContent="@media(max-width:820px){\n#sakalux-bt-settings#sakalux-bt-settings#sakalux-bt-settings{position:fixed!important;inset:0 4px 36px!important;top:0!important;bottom:36px!important;left:4px!important;right:4px!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;transform:none!important;box-sizing:border-box!important;border-radius:14px!important;overflow-y:auto!important;overscroll-behavior:contain!important;}\n\n}";(document.head||document.documentElement).appendChild(s)})();

/* Bazaar v5.3.38: fixed title/footer, separately scrollable settings. */
(()=>{const s=document.createElement('style');s.textContent=`
#sakalux-bt-settings#sakalux-bt-settings#sakalux-bt-settings{flex-direction:column!important;padding:0!important;overflow:hidden!important}
#sakalux-bt-settings#sakalux-bt-settings>.sbt-settings-head{flex:0 0 auto!important;padding:14px 18px 0!important}
#sakalux-bt-settings#sakalux-bt-settings>.sbt-settings-content{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;padding:0 18px 14px!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
#sakalux-bt-settings#sakalux-bt-settings .sbt-settings-content input,
#sakalux-bt-settings#sakalux-bt-settings .sbt-settings-content textarea{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important}
#sakalux-bt-settings#sakalux-bt-settings>#sakalux-inline-footer-bazaar-thanker{position:relative!important;inset:auto!important;flex:0 0 50px!important;width:100%!important;margin:0!important;padding:0!important;border-radius:10px 10px 14px 14px!important}
@media(min-width:821px){#sakalux-bt-settings#sakalux-bt-settings#sakalux-bt-settings{height:min(820px,calc(100vh - 104px))!important}}
`;(document.head||document.documentElement).appendChild(s)})();
