// ==UserScript==
// @name         SakaLuX Mission Rewards
// @namespace    sakalux.mission.rewards
// @version      1.0.46
// @description  Advanced Mission Shop reward information, value per credit, ammo ownership and weapon mod tracking for Torn PDA / Tampermonkey.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @license      All Rights Reserved
// @run-at       document-end
// @downloadURL  https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.user.js
// @updateURL    https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.meta.js
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
  let v = '1.0.46';
  try {
    const meta = globalThis.GM_info && globalThis.GM_info.script && globalThis.GM_info.script.version;
    if (meta) v = String(meta);
  } catch {}
  const g = globalThis;
  g.__SakaLuXInstalledVersions = g.__SakaLuXInstalledVersions || Object.create(null);
  g.__SakaLuXInstalledVersions['mission-rewards'] = v;
  try {
    document.documentElement?.setAttribute('data-sakalux-installed-mission-rewards', v);
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
  const SELF = Object.freeze(Object.assign({"id":"mission-rewards","name":"Missions","icon":"🎯","selector":"","fallback":"https://www.torn.com/page.php?sid=missions"}, { version: "1.0.46" }));
  const API_GLOBAL = "SakaLuXMissionRewards";
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

    const VERSION = '1.0.43';
    const PDA_KEY = '###PDA-APIKEY###';
    const MISSIONS_URL = 'https://www.torn.com/page.php?sid=missions';
    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 12 * 60 * 60 * 1000;
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


    async function checkMissionApiAccess(key) {
        if (!key) return [{label:'API KEY',ok:false,message:'No API key configured.'}];
        return Promise.all([
            ['Torn: Items','https://api.torn.com/v2/torn/items?cat=All&sort=ASC&key='],
            ['User: Ammo','https://api.torn.com/user/?selections=ammo&key=']
        ].map(async ([label,url]) => {
            try {
                const data=await apiGet(url+encodeURIComponent(key));
                if(data?.error) return {label,ok:false,message:'API '+(data.error.code||'error')+' — '+(data.error.error||data.error.message||'Access denied')};
                return {label,ok:true,message:'Access OK'};
            } catch {return {label,ok:false,message:'Access check failed. Please retry.'};}
        }));
    }
    function openApiSettings() {
        injectCss();
        document.getElementById('sl-mr-api-overlay')?.remove();
        const local=localStorage.getItem(STORAGE.apiKey)||'';
        getApiKey();
        const overlay=document.createElement('div');
        overlay.id='sl-mr-api-overlay';
        overlay.innerHTML=`
            <div id="sl-mr-api-panel">
                <div class="sl-mr-api-head">
                    <div><div class="sl-mr-api-title">🔑 Mission Rewards API Access</div><div class="sl-mr-api-sub">SakaLuX Mission Rewards v${VERSION}</div></div>
                    <button class="sl-mr-close" id="sl-mr-api-close">×</button>
                </div>
                <div class="sl-mr-api-required"><b>Exact permissions required</b><br>User: Ammo<br>Torn: Items<br>No write permission is requested.</div>
                <button type="button" class="sl-mr-api-create" id="sl-mr-api-create">🔑 CREATE MISSION API KEY</button>
                <div class="sl-mr-api-box">
                    <div class="sl-mr-api-status"><b>API ACCESS</b><span id="sl-mr-api-result" role="status" aria-live="polite">Not checked yet</span></div>
                    <div class="sl-mr-api-source">Active source: <b id="sl-mr-api-source"></b></div>
                    <label class="sl-mr-api-field">Replace / paste Torn API key<input id="sl-mr-api-local" type="password" autocomplete="off" placeholder="Paste newly created key here" value="${escapeHtml(local)}"></label>
                    <div class="sl-mr-api-actions"><button type="button" id="sl-mr-api-save">SAVE NEW API KEY</button><button type="button" id="sl-mr-api-check">CHECK API ACCESS</button></div>
                    <button type="button" class="sl-mr-api-clear" id="sl-mr-api-clear">CLEAR LOCAL KEY</button>
                    <div class="sl-mr-api-note">The Hub general key is used first when available. This local key remains the standalone fallback. TornPDA's injected key is never overwritten.</div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const input=overlay.querySelector('#sl-mr-api-local'),result=overlay.querySelector('#sl-mr-api-result');
        const source=()=>{const active=getApiKey();overlay.querySelector('#sl-mr-api-source').textContent=active?(state.apiMode||'Active key'):'None';};
        source();
        overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
        overlay.querySelector('#sl-mr-api-close').onclick=()=>overlay.remove();
        overlay.querySelector('#sl-mr-api-create').onclick=()=>{location.href=REQUIRED_API_KEY_URL;};
        const run=async save=>{
            const typed=input.value.trim();
            if(save&&!typed){input.focus();result.textContent='Paste a local API key first.';return;}
            if(save)saveApiKey(typed);
            const effective=getApiKey(),key=typed||effective;
            const buttons=[overlay.querySelector('#sl-mr-api-save'),overlay.querySelector('#sl-mr-api-check')];
            buttons.forEach(x=>x.disabled=true);result.textContent='Checking access…';
            try{
                const rows=await checkMissionApiAccess(key);
                result.textContent=(save?'Local key saved. ':'')+rows.map(r=>r.label+': '+r.message).join(' · ');
                if(save){state.catalogue=new Map();state.ammo=[];localStorage.removeItem(STORAGE.catalogueTime);localStorage.removeItem(STORAGE.ammoTime);}
                source();
            }finally{buttons.forEach(x=>x.disabled=false);}
        };
        overlay.querySelector('#sl-mr-api-save').onclick=()=>run(true);
        overlay.querySelector('#sl-mr-api-check').onclick=()=>run(false);
        overlay.querySelector('#sl-mr-api-clear').onclick=()=>{localStorage.removeItem(STORAGE.apiKey);input.value='';result.textContent='Local key cleared. Shared Hub / TornPDA keys are preserved.';source();};
        return true;
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
            <div id="sl-mr-settings"><div class="sl-mr-settings-content">
                <div class="sl-mr-settings-head"><div><div class="sl-mr-settings-title">🎯 SakaLuX Mission Rewards</div><div class="sl-mr-settings-sub">v${VERSION} • ${escapeHtml(state.apiMode || 'API not loaded')}</div></div><div class="sl-mr-head-actions"><button type="button" id="sl-mr-api-open" title="API Access">🔑</button><button id="sl-mr-settings-close">×</button></div></div>
                <label class="sl-mr-setting"><input id="sl-mr-show-items" type="checkbox" ${settings.showItemValue ? 'checked' : ''}> Show item market value / credit</label>
                <label class="sl-mr-setting"><input id="sl-mr-show-ammo" type="checkbox" ${settings.showAmmoOwned ? 'checked' : ''}> Show owned special ammo</label>
                <label class="sl-mr-setting"><input id="sl-mr-learn-mods" type="checkbox" ${settings.learnModPrices ? 'checked' : ''}> Learn weapon mod price ranges locally</label>
                <label class="sl-mr-setting"><input id="sl-mr-show-badges" type="checkbox" ${settings.showCardBadges ? 'checked' : ''}> Show information directly on reward cards</label>
                <button class="sl-mr-settings-btn" id="sl-mr-save">💾 SAVE</button>
                <button class="sl-mr-settings-btn gray" id="sl-mr-refresh">🔄 REFRESH DATA</button>
                <button class="sl-mr-settings-btn gray" id="sl-mr-clear-mods">🧩 CLEAR LEARNED MOD RANGES</button>
            </div></div>`;
        document.body.appendChild(overlay);
        document.getElementById('sl-mr-settings-close').onclick = () => overlay.remove();
        document.getElementById('sl-mr-api-open').onclick = openApiSettings;
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
            .sl-mr-card-info{position:absolute!important;left:6px!important;right:6px!important;bottom:42px!important;z-index:20!important;padding:5px 6px!important;border-radius:6px!important;background:rgba(17,24,39,.94)!important;color:#fff!important;font-size:9px!important;line-height:1.35!important;pointer-events:none!important;box-sizing:border-box!important;box-shadow:0 2px 6px rgba(0,0,0,.35)!important}
            .sl-mr-line{font-weight:800}.sl-mr-line.good{color:#4ade80}.sl-mr-line.special,.sl-mr-line.special-text{color:#fbbf24}.sl-mr-line.muted{color:#c5cad1;font-weight:600}
            .sl-mr-detail{margin-top:10px;padding:10px;border-radius:9px;background:#111827;border:1px solid #303640;color:#e5e7eb;font-size:11px;line-height:1.6}.sl-mr-detail-title{color:#fbbf24;font-size:12px;font-weight:900;margin-bottom:6px}.sl-mr-highlight{margin-top:5px;color:#4ade80;font-size:12px}.sl-mr-note{margin-top:7px;color:#9ca3af;font-size:9px}
            #sl-mr-settings-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.75);display:flex;align-items:flex-start;justify-content:center;font-family:Arial,sans-serif}#sl-mr-settings{width:min(560px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0}.sl-mr-settings-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.sl-mr-settings-title{font-size:17px;font-weight:900}.sl-mr-settings-sub{margin-top:3px;color:#9ca3af;font-size:9px}#sl-mr-settings-close{width:36px;height:36px;border:0;border-radius:9px;background:#252a32;color:#fff;font-size:20px}.sl-mr-setting{display:block;margin-bottom:7px;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}.sl-mr-api-box{margin-top:10px;padding:10px;background:#181d24;border:1px solid #292f38;border-radius:9px;font-size:11px}#sl-mr-api-key{width:100%;box-sizing:border-box;margin-top:8px;padding:9px;border:1px solid #303640;border-radius:8px;background:#101318;color:#fff}.sl-mr-settings-btn{width:100%;margin-top:7px;min-height:40px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900}.sl-mr-settings-btn.gray{background:#374151}
            #${HUB_PROMPT_ID}{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif}#${HUB_PROMPT_ID}>div{width:min(420px,100%);background:#101318;color:#fff;border:1px solid #303640;border-radius:14px;padding:16px;box-shadow:0 12px 35px rgba(0,0,0,.55)}#${HUB_PROMPT_ID} h3{margin:0 0 8px;font-size:16px}#${HUB_PROMPT_ID} p{margin:0 0 14px;color:#b8c0cc;font-size:12px;line-height:1.45}#${HUB_PROMPT_ID} .sl-mr-hub-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}#${HUB_PROMPT_ID} button{border:0;border-radius:9px;padding:10px;font-weight:900;color:#fff;background:#374151}#${HUB_PROMPT_ID} .install{background:#16a34a}
            @media(min-width:700px){#sl-mr-settings-overlay{align-items:center}#sl-mr-settings{border-radius:18px}}
        `;
        document.head.appendChild(style);
    }


    function startObserver() {
        if (!state.enabled || !isMissionsPage() || state.observer) return;
        state.observer = new MutationObserver(mutations => {
            if (window.SakaLuXPerf?.unrelated?.(mutations)) return;
            if (mutations.some(m => {
                const root=m.target.nodeType===1?m.target:m.target.parentElement;
                if(root?.closest?.('#sl-mr-settings-overlay,#sakalux-hub-overlay,[id^="sakalux-inline-footer-"],.sl-mr-card-info,.sl-mr-detail'))return false;
                return [...m.addedNodes].some(n=>n.nodeType===1&&!n.matches?.('.sl-mr-card-info,.sl-mr-detail,#sl-mr-settings-overlay,#sakalux-hub-overlay'));
            })) {
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
        openApiSettings,
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




/* Compact donation controls and Elimination mobile panel geometry 1.0.32 */
(()=>{const s=document.createElement('style');s.textContent="@media(max-width:820px){\n#sl-mr-settings-overlay#sl-mr-settings-overlay#sl-mr-settings-overlay{position:fixed!important;inset:0 4px 36px!important;top:0!important;bottom:36px!important;left:4px!important;right:4px!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;transform:none!important;box-sizing:border-box!important;padding:0!important;background:transparent!important;overflow:hidden!important;border-radius:14px!important;align-items:stretch!important;justify-content:stretch!important;}\n#sl-mr-settings-overlay#sl-mr-settings-overlay#sl-mr-settings-overlay #sl-mr-settings#sl-mr-settings{position:relative!important;inset:auto!important;top:auto!important;bottom:auto!important;left:auto!important;right:auto!important;align-self:stretch!important;flex:1 1 auto!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;max-width:100%!important;margin:0!important;transform:none!important;box-sizing:border-box!important;border:1px solid #3c4652!important;border-radius:14px!important;}\n#sl-mr-settings-overlay#sl-mr-settings-overlay#sl-mr-settings-overlay #sl-mr-settings#sl-mr-settings{overflow-y:auto!important;overscroll-behavior:contain!important;}\n\n}";(document.head||document.documentElement).appendChild(s)})();

/* Mission Rewards v1.0.33: full-width anchored footer and dedicated API sheet. */
(()=>{const s=document.createElement('style');s.textContent=`
#sl-mr-settings#sl-mr-settings#sl-mr-settings{display:flex!important;flex-direction:column!important;padding:0!important;overflow:hidden!important;position:relative}
#sl-mr-settings#sl-mr-settings>.sl-mr-settings-content{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;padding:14px!important;overscroll-behavior:contain!important}
#sl-mr-settings#sl-mr-settings>#sakalux-inline-footer-mission-rewards{position:relative!important;width:100%!important;flex:0 0 50px!important;border-radius:10px 10px 14px 14px!important}
#sl-mr-settings .sl-mr-head-actions{display:flex;gap:7px;flex:0 0 auto}
#sl-mr-settings #sl-mr-api-open,#sl-mr-settings #sl-mr-api-close{width:36px;height:36px;border:1px solid #526174;border-radius:9px;background:#272d35;color:#facc15;font-size:18px;flex-shrink:0}
#sl-mr-settings#sl-mr-settings>#sl-mr-api-sheet{
 position:absolute!important;inset:0 0 50px!important;z-index:20!important;background:#101318!important;
 padding:14px!important;box-sizing:border-box!important;overflow-y:auto!important;overflow-x:hidden!important;
}
#sl-mr-api-sheet *,#sl-mr-api-sheet *::before,#sl-mr-api-sheet *::after{box-sizing:border-box!important}
#sl-mr-api-sheet input{width:100%!important;min-width:0!important;max-width:100%!important;height:40px!important;margin:7px 0!important;padding:9px!important;border:1px solid #526174!important;border-radius:8px!important;background:#0d141d!important;color:#fff!important}
#sl-mr-api-sheet .sl-mr-api-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
#sl-mr-api-sheet button{min-width:0;white-space:normal}
#sl-mr-api-sheet #sl-mr-api-result{margin-top:10px;line-height:1.5;overflow-wrap:anywhere}
`;(document.head||document.documentElement).appendChild(s)})();

/* SakaLuX Hub footer v3: native module root only; compact donation controls. */
(()=>{
 const selector="#sl-mr-settings-panel",id="sakalux-inline-footer-mission-rewards",profile='https://www.torn.com/profiles.php?XID=2380374';
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
  const panel=document.querySelector(selector);if(!panel)return;
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

/* SAKALUX_FORCE_FOOTER_V5_MISSION */
(()=>{
 const PANEL='#sl-mr-settings-panel',ID='sakalux-inline-footer-mission-rewards',PROFILE='https://www.torn.com/profiles.php?XID=2380374';
 function ensure(){const panel=document.querySelector(PANEL);if(!panel)return;let f=panel.querySelector('#'+ID);if(f)return;f=document.createElement('div');f.id=ID;f.innerHTML='<div class="slh-bottom"><div class="slh-bottom-grid"><button type="button" class="slh-bottom-btn" data-slx-donate>💸 SEND MONEY</button><button type="button" class="slh-bottom-btn" data-slx-donate>🎁 SEND ITEMS</button></div></div><div class="slh-footer">Made with ❤️ by <a class="slh-author" href="'+PROFILE+'">SakaLuX [2380374]</a></div>';f.querySelectorAll('[data-slx-donate]').forEach(b=>b.onclick=()=>location.href=PROFILE);panel.appendChild(f);}
 let pending=false;
 const kick=()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;ensure();},100)};
 new MutationObserver(records=>{
   if(window.SakaLuXPerf?.unrelated?.(records))return;
   if(records.some(r=>r.target?.closest?.('#sl-mr-settings-panel')||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('#sl-mr-settings-panel')||n.querySelector('#sl-mr-settings-panel')))))kick();
  }).observe(document.body||document.documentElement,{childList:true,subtree:true});
 kick();
})();


/* SAKALUX_MISSION_REAL_FOOTER_V1038 */
(()=>{
 const ID='sakalux-inline-footer-mission-rewards',PROFILE='https://www.torn.com/profiles.php?XID=2380374';
 const css=document.createElement('style');css.textContent=`
 #sl-mr-settings#sl-mr-settings{display:flex!important;flex-direction:column!important;overflow:hidden!important;min-height:0!important}
 #sl-mr-settings#sl-mr-settings>.sl-mr-settings-content{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important}
 #${ID}#${ID}{position:relative!important;display:block!important;flex:0 0 50px!important;width:100%!important;height:50px!important;min-height:50px!important;max-height:50px!important;margin:0!important;padding:0!important;z-index:50!important;overflow:hidden!important;background:#080d13!important}
 #${ID} .slh-bottom{height:28px!important;padding:4px 14px!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important}
 #${ID} .slh-bottom-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;height:20px!important}
 #${ID} .slh-bottom-btn{display:block!important;width:100%!important;height:20px!important;min-height:20px!important;padding:0 4px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#151f2a!important;color:#b9c7d6!important;font:900 8px/1.2 Arial,sans-serif!important}
 #${ID} .slh-footer{height:22px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;border-top:1px solid rgba(223,154,55,.52)!important;background:#080d13!important;color:#df9a37!important;font:400 9px/20px Arial,sans-serif!important;white-space:nowrap!important}
 #${ID} .slh-author{color:#78aef2!important;font-weight:900!important;text-decoration:none!important}
 `;(document.head||document.documentElement).appendChild(css);
 function ensure(){
  const panel=document.querySelector('#sl-mr-settings'); if(!panel)return;
  let f=panel.querySelector('#'+ID);
  if(!f){f=document.createElement('div');f.id=ID;f.innerHTML='<div class="slh-bottom"><div class="slh-bottom-grid"><button type="button" class="slh-bottom-btn" data-slx-mr-donate>💸 SEND MONEY</button><button type="button" class="slh-bottom-btn" data-slx-mr-donate>🎁 SEND ITEMS</button></div></div><div class="slh-footer">Made with ❤️ by <a class="slh-author" href="'+PROFILE+'">SakaLuX [2380374]</a></div>';f.querySelectorAll('[data-slx-mr-donate]').forEach(b=>b.onclick=()=>location.href=PROFILE);panel.appendChild(f);}
  else if(f.parentElement!==panel)panel.appendChild(f);
 }
 let pending=false;
 const kick=()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;ensure();},100)};
 new MutationObserver(records=>{
   if(window.SakaLuXPerf?.unrelated?.(records))return;
   if(records.some(r=>r.target?.closest?.('#sl-mr-settings')||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('#sl-mr-settings')||n.querySelector('#sl-mr-settings')))))kick();
  }).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',kick,{once:true});else kick();
})();


/* SAKALUX_MISSION_API_ENHANCER_PARITY_V1039 */
(()=>{
 const st=document.createElement('style');st.id='sakalux-mission-api-enhancer-parity-v1039';st.textContent=`
#sl-mr-api-sheet#sl-mr-api-sheet{position:absolute!important;inset:0!important;z-index:2147483647!important;display:flex!important;flex-direction:column!important;min-height:0!important;max-height:100%!important;padding:0!important;overflow:hidden!important;box-sizing:border-box!important;border:0!important;border-radius:0!important;background:#0b151f!important;color:#edf3fa!important;box-shadow:none!important}
#sl-mr-api-sheet .sl-mr-api-head{display:flex!important;align-items:center!important;gap:10px!important;flex:0 0 92px!important;min-height:92px!important;padding:18px 26px 14px!important;box-sizing:border-box!important;background:linear-gradient(155deg,#142235 0%,#0f1a28 72%)!important;border-bottom:1px solid rgba(255,255,255,.08)!important}
#sl-mr-api-sheet .sl-mr-api-heading{min-width:0!important;flex:1 1 auto!important}
#sl-mr-api-sheet .sl-mr-api-title{font-size:17px!important;font-weight:900!important;line-height:1.15!important;color:#f4f7fb!important}
#sl-mr-api-sheet .sl-mr-api-sub{margin-top:4px!important;font-size:10px!important;font-weight:500!important;color:#8f9cad!important}
#sl-mr-api-sheet .sl-mr-api-close{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;max-width:40px!important;max-height:40px!important;padding:0!important;border-radius:12px!important;border:1px solid #34465b!important;background:#172331!important;color:#e6edf5!important;font-size:22px!important;font-weight:700!important;display:grid!important;place-items:center!important}
#sl-mr-api-sheet .sl-mr-api-body{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;padding:12px 16px 24px!important;display:flex!important;flex-direction:column!important;gap:12px!important;box-sizing:border-box!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
#sl-mr-api-sheet .sl-mr-api-required{padding:10px 14px!important;border:1px solid #7d6920!important;border-radius:10px!important;background:#211c08!important;color:#d8bc55!important;font-size:11px!important;line-height:1.5!important}
#sl-mr-api-sheet .sl-mr-api-required b{display:block!important;margin-bottom:0!important;color:#f2dc72!important}
#sl-mr-api-sheet button{font-family:Inter,Arial,sans-serif!important;font-weight:900!important}
#sl-mr-api-sheet .sl-mr-api-primary,#sl-mr-api-sheet .sl-mr-api-danger{width:100%!important;min-height:38px!important;height:38px!important;margin:0!important;padding:0 10px!important;border-radius:10px!important;font-size:10px!important;line-height:1.1!important;box-sizing:border-box!important}
#sl-mr-api-sheet .sl-mr-api-create{background:linear-gradient(180deg,#3a84d8,#2866ad)!important;border:1px solid #4b8ed9!important;color:#fff!important}
#sl-mr-api-sheet .sl-mr-api-card{padding:10px!important;border:1px solid #2e4055!important;border-radius:11px!important;background:#121b25!important;display:flex!important;flex-direction:column!important;gap:8px!important;box-sizing:border-box!important}
#sl-mr-api-sheet .sl-mr-api-status{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;padding:8px!important;border-radius:8px!important;background:#151e29!important;font-size:10px!important;color:#e8eef5!important}
#sl-mr-api-sheet .sl-mr-api-status b{color:#d8bc55!important}
#sl-mr-api-sheet .sl-mr-api-status span{font-weight:500!important;color:#e8eef5!important;text-align:right!important}
#sl-mr-api-sheet .sl-mr-api-source{font-size:10px!important;color:#aab6c5!important;line-height:1.35!important}
#sl-mr-api-sheet label{display:block!important;margin:0!important;font-size:10px!important;color:#c5cfdb!important}
#sl-mr-api-sheet input#sl-mr-api-local{width:100%!important;height:40px!important;min-height:40px!important;margin:0!important;padding:8px 10px!important;box-sizing:border-box!important;border:1px solid #3a4d63!important;border-radius:9px!important;background:#0d1622!important;color:#f4f7fb!important;font-size:11px!important}
#sl-mr-api-sheet .sl-mr-api-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:0!important}
#sl-mr-api-sheet .sl-mr-api-actions .sl-mr-api-primary{min-width:0!important;background:linear-gradient(180deg,#3a84d8,#2866ad)!important;border:1px solid #4b8ed9!important;color:#fff!important}
#sl-mr-api-sheet .sl-mr-api-danger{background:linear-gradient(180deg,#8b394d,#6b293a)!important;border:1px solid #9f4a60!important;color:#ffe4ea!important}
#sl-mr-api-sheet .sl-mr-api-note{padding:8px!important;border-radius:8px!important;background:#151e29!important;color:#c5cfdb!important;font-size:9px!important;line-height:1.45!important}
@media(max-width:700px){
 #sl-mr-api-sheet .sl-mr-api-head{flex-basis:84px!important;min-height:84px!important;padding:14px 18px 12px!important}
 #sl-mr-api-sheet .sl-mr-api-title{font-size:16px!important}
 #sl-mr-api-sheet .sl-mr-api-body{padding:10px 14px 18px!important;gap:10px!important}
}
`;(document.head||document.documentElement).appendChild(st);
})();


/* SAKALUX_MISSION_API_COMPACT_V1040 */
(()=>{
 const st=document.createElement('style');st.id='sakalux-mission-api-compact-v1040';st.textContent=`
#sl-mr-api-sheet .sl-mr-api-required b{margin-bottom:0!important}
#sl-mr-api-sheet .sl-mr-api-primary,#sl-mr-api-sheet .sl-mr-api-danger{height:38px!important;min-height:38px!important;font-size:10px!important}
#sl-mr-api-sheet input#sl-mr-api-local{height:40px!important;min-height:40px!important}
#sl-mr-api-sheet .sl-mr-api-actions{gap:8px!important}
`;(document.head||document.documentElement).appendChild(st);
})();


/* SAKALUX_MISSION_EXACT_ENHANCER_API_V1041 */
(()=>{const s=document.createElement('style');s.id='sakalux-mission-exact-enhancer-api-v1041';s.textContent=`
#sl-mr-api-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.8);display:flex;align-items:flex-start;justify-content:center;font-family:Arial,sans-serif}
#sl-mr-api-panel{width:min(560px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0;box-shadow:0 -8px 35px rgba(0,0,0,.55)}
.sl-mr-api-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.sl-mr-api-head-actions{display:flex;align-items:center;gap:7px}.sl-mr-api-title{font-size:17px;font-weight:900}.sl-mr-api-sub{margin-top:3px;color:#8e96a3;font-size:10px}.sl-mr-api-required{margin:9px 0;padding:10px;border:1px solid #66591d;border-radius:9px;background:#211d10;color:#e4c95d;font-size:11px;line-height:1.5}.sl-mr-api-required b{color:#fde68a}.sl-mr-api-create{width:100%;min-height:42px;border:1px solid #7c681e;border-radius:9px;background:#2a2512;color:#f5d85f;font-weight:900}.sl-mr-api-box{margin-top:10px;padding:9px;border:1px solid #2f3945;border-radius:10px;background:#121820}.sl-mr-api-status{display:flex;justify-content:space-between;gap:8px;padding:8px;border-radius:8px;background:#181d24;font-size:10px;line-height:1.35}.sl-mr-api-status b{color:#d7b94c}.sl-mr-api-status.ok span{color:#78d98b}.sl-mr-api-status.missing span,.sl-mr-api-status.missing-permission span,.sl-mr-api-status.error span{color:#f08b8b}.sl-mr-api-source{margin:8px 0;color:#9ca3af;font-size:10px}.sl-mr-api-field{display:block;margin:8px 0;color:#d1d5db;font-size:10px}.sl-mr-api-field input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:8px;font-size:12px}.sl-mr-api-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sl-mr-api-actions button,.sl-mr-api-clear{min-height:38px;border:0;border-radius:8px;background:#374151;color:#fff;font-weight:900;font-size:10px}.sl-mr-api-actions button:first-child{background:#2563eb}.sl-mr-api-clear{width:100%;margin-top:7px}.sl-mr-api-note{margin-top:9px;color:#8e96a3;font-size:9px;line-height:1.5}.sl-mr-close{width:36px;height:36px;border:1px solid #343b45;border-radius:10px;background:#252a32;color:#fff;font-size:18px}
@media(min-width:700px){#sl-mr-api-overlay{align-items:center}#sl-mr-api-panel{border-radius:18px;max-height:90vh}}
`;document.head.appendChild(s);})();
