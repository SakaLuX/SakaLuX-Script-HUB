'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function userscripts() {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.user.js'))
    .map(entry => entry.name)
    .sort();
}

function makeContext() {
  const handlers = new Map();
  const store = new Map();
  const location = { pathname: '/index.php', search: '', hash: '', origin: 'https://www.torn.com' };
  let pendingPdaResolve = null;
  const context = {
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    URL,
    location,
    document: {
      documentElement: { getAttribute() { return null; } },
      body: { getAttribute() { return null; } },
      getElementById() { return null; }
    },
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); }
    },
    addEventListener(type, fn) {
      const list = handlers.get(type) || [];
      list.push(fn);
      handlers.set(type, list);
    },
    PDA_httpGet() {
      return new Promise(resolve => { pendingPdaResolve = resolve; });
    },
    globalThis: null
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/core/sakalux-core.js'), 'utf8'), context);
  return {
    context,
    core: context.SakaLuXCore,
    handlers,
    location,
    resolvePda(value) { pendingPdaResolve?.(value); }
  };
}

function setRoute(location, value) {
  const url = new URL(value, 'https://www.torn.com');
  location.pathname = url.pathname;
  location.search = url.search;
  location.hash = url.hash;
}

function emit(handlers, type) {
  for (const fn of handlers.get(type) || []) fn({ type });
}

(async () => {
  const scripts = userscripts();
  assert.equal(scripts.length, 12, 'repository-wide TornPDA navigation suite expects all 12 userscripts');
  for (const file of scripts) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert(source.includes('/* SakaLuX Shared Core — BEGIN */'), `${file}: embedded Shared Core missing`);
    assert(source.includes('/* SakaLuX Shared Core — END */'), `${file}: embedded Shared Core end marker missing`);
    assert(!/@require\s+[^\n]*sakalux-core/i.test(source), `${file}: must remain standalone without runtime Core dependency`);
  }

  const { context, core, handlers, location, resolvePda } = makeContext();
  assert(core?.router, 'Shared Core router exported');
  assert(core?.api, 'Shared Core API Broker exported');

  const events = [];
  core.router.onChange(event => events.push(event));
  assert.equal(core.router.check(), false, 'initial route is already seeded');
  assert.equal(core.router.bind(), true, 'route signals bind once');
  assert.equal(core.router.bind(), false, 'route binding is idempotent');
  assert.equal((handlers.get('popstate') || []).length, 1, 'one popstate listener');
  assert.equal((handlers.get('hashchange') || []).length, 1, 'one hashchange listener');

  const sequence = [
    '/page.php?sid=stocks',
    '/bazaar.php#/manage',
    '/travelagency.php',
    '/index.php?sid=travel#destination=hawaii',
    '/messages.php'
  ];
  for (const route of sequence) {
    setRoute(location, route);
    emit(handlers, 'popstate');
  }
  assert.equal(events.length, sequence.length, 'all TornPDA-style SPA route transitions observed');
  assert.deepEqual(events.map(x => x.current), sequence, 'route keys preserve path + query + hash');
  assert.equal(core.router.epoch(), sequence.length, 'router epoch advances once per unique navigation');

  emit(handlers, 'popstate');
  assert.equal(events.length, sequence.length, 'duplicate route signal is ignored');

  setRoute(location, '/messages.php#tab=events');
  emit(handlers, 'hashchange');
  assert.equal(events.at(-1).current, '/messages.php#tab=events', 'hash-only TornPDA navigation observed');

  const beforeChurn = events.length;
  for (let i = 0; i < 100; i++) {
    setRoute(location, i % 2 ? '/index.php' : '/page.php?sid=stocks');
    emit(handlers, 'popstate');
  }
  assert.equal(events.length - beforeChurn, 100, '100 rapid SPA navigations emit exactly 100 unique route changes');

  const listenerCounts = {
    popstate: (handlers.get('popstate') || []).length,
    hashchange: (handlers.get('hashchange') || []).length
  };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/core/sakalux-core.js'), 'utf8'), context);
  assert.equal(context.SakaLuXCore, core, 're-embedding same Core version does not reinitialize router');
  assert.equal((handlers.get('popstate') || []).length, listenerCounts.popstate, 'no duplicate popstate listener after duplicate Core load');
  assert.equal((handlers.get('hashchange') || []).length, listenerCounts.hashchange, 'no duplicate hashchange listener after duplicate Core load');

  setRoute(location, '/page.php?sid=stocks');
  emit(handlers, 'popstate');
  const stale = core.api.requestJson({
    url: 'https://api.torn.com/v2/user/?selections=money',
    routeScoped: true,
    retries: 0,
    timeout: 0,
    force: true
  });
  await Promise.resolve();
  setRoute(location, '/index.php');
  emit(handlers, 'popstate');
  resolvePda('{"money_onhand":123}');
  await assert.rejects(stale, err => ['STALE_ROUTE', 'ABORTED'].includes(err?.code), 'route-scoped API work is discarded after navigation');

  const routeSensitive = {
    'SakaLuX-Market-Intelligence.user.js': [/router\.onChange|popstate|hashchange|location\./],
    'SakaLuX-Stock-Manager-Advisor.user.js': [/router\.onChange|popstate|hashchange|location\./],
    'SakaLuX-Suite.user.js': [/startRouteWatcher\(|router\.onChange|popstate|hashchange/],
    'SakaLuX-Script-Hub.user.js': [/router\.onChange|popstate|hashchange|location\./]
  };
  for (const [file, patterns] of Object.entries(routeSensitive)) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert(patterns.some(re => re.test(source)), `${file}: route/navigation handling disappeared`);
  }

  console.log(`TornPDA navigation regression passed: ${scripts.length} userscripts, ${events.length} observed route changes, stale-route API cancellation verified.`);
})().catch(err => {
  console.error(err.stack || err);
  process.exit(1);
});
