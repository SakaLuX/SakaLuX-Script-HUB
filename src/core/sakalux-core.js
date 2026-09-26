/* SakaLuX Shared Core v1 - test foundation
 * Source-only module. Not installed directly by users.
 * Intended to be embedded into standalone userscripts at build/release time.
 */
(() => {
  'use strict';

  const g = globalThis;
  const CORE_VERSION = '1.0.0-test.1';
  const NS = 'SakaLuXCore';

  if (g[NS]?.version === CORE_VERSION) return;

  const timers = new Map();
  const listeners = new Set();
  let routeKey = '';

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
      if (typeof requestIdleCallback === 'function') {
        return requestIdleCallback(fn, { timeout });
      }
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
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
  };

  const router = {
    key(loc = g.location) {
      if (!loc) return '';
      return `${loc.pathname || ''}${loc.search || ''}${loc.hash || ''}`;
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    check(loc = g.location) {
      const next = this.key(loc);
      if (next === routeKey) return false;
      const prev = routeKey;
      routeKey = next;
      for (const fn of [...listeners]) {
        try { fn({ previous: prev, current: next }); } catch (err) { console.error('[SakaLuXCore router]', err); }
      }
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

  const logger = {
    debug(...args) {
      if (storage.get('SakaLuX_DEBUG', false)) console.debug('[SakaLuX]', ...args);
    },
    warn(...args) { console.warn('[SakaLuX]', ...args); },
    error(...args) { console.error('[SakaLuX]', ...args); }
  };

  const core = Object.freeze({
    version: CORE_VERSION,
    perf,
    hub,
    storage,
    router,
    dock,
    logger
  });

  g[NS] = core;
  if (!g.SakaLuXPerf) g.SakaLuXPerf = perf;
  routeKey = router.key();
})();
