'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function response(status, body) {
  return { status, text: async () => typeof body === 'string' ? body : JSON.stringify(body) };
}

function makeCore(fetchImpl) {
  const handlers = new Map();
  const store = new Map();
  const context = {
    console,
    setTimeout,
    clearTimeout,
    URL,
    AbortController,
    fetch: fetchImpl,
    addEventListener(type, fn) {
      const rows = handlers.get(type) || [];
      rows.push(fn);
      handlers.set(type, rows);
    },
    localStorage: {
      getItem: k => store.has(k) ? store.get(k) : null,
      setItem: (k,v) => store.set(k,String(v)),
      removeItem: k => store.delete(k)
    },
    location: { origin:'https://www.torn.com', pathname:'/index.php', search:'', hash:'' },
    document: { documentElement:{getAttribute:()=>null}, body:{getAttribute:()=>null}, getElementById:()=>null },
    globalThis: null
  };
  context.globalThis = context;
  vm.createContext(context);
  const code = fs.readFileSync('src/core/sakalux-core.js','utf8');
  vm.runInContext(code, context);
  return { context, core: context.SakaLuXCore, handlers, code };
}

(async () => {
  let calls = 0;
  const { context, core, code } = makeCore(async url => {
    calls++;
    await new Promise(r => setTimeout(r, 20));
    return response(200, { ok:true, url:String(url) });
  });

  // Concurrent same-request dedupe, including cache-buster normalization.
  const [a,b] = await Promise.all([
    core.api.requestJson('https://api.torn.com/v2/user/money?key=abc&ts=1'),
    core.api.requestJson('https://api.torn.com/v2/user/money?ts=2&key=abc')
  ]);
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(calls, 1, 'same logical request must share one network call');
  assert.equal(core.api.diagnostics().deduped, 1);

  // TTL cache and force refresh.
  await core.api.requestJson('https://api.torn.com/v2/user/stocks?key=abc', { ttl:1000 });
  const afterFirstCacheable = calls;
  await core.api.requestJson('https://api.torn.com/v2/user/stocks?key=abc', { ttl:1000 });
  assert.equal(calls, afterFirstCacheable, 'TTL cache should prevent second network call');
  assert.ok(core.api.diagnostics().cacheHits >= 1);
  await core.api.requestJson('https://api.torn.com/v2/user/stocks?key=abc', { ttl:1000, force:true });
  assert.equal(calls, afterFirstCacheable + 1, 'force refresh must bypass cached response');

  // Retry 429/5xx, but not normal 4xx.
  let retryCalls = 0;
  core.api.registerEnvironment({ fetch: async () => {
    retryCalls++;
    return retryCalls === 1 ? response(429, { error:'rate' }) : response(200, { ok:'retry' });
  }});
  const retried = await core.api.requestJson('https://api.torn.com/v2/test/retry?x=1', { retries:1, retryBase:1, force:true });
  assert.equal(retried.ok, 'retry');
  assert.equal(retryCalls, 2, '429 should retry exactly once');

  let badCalls = 0;
  core.api.registerEnvironment({ fetch: async () => { badCalls++; return response(400, { error:'bad' }); } });
  await assert.rejects(
    () => core.api.requestJson('https://api.torn.com/v2/test/bad?x=1', { retries:3, retryBase:1, force:true }),
    err => err?.code === 'HTTP' && err?.status === 400
  );
  assert.equal(badCalls, 1, 'non-retryable 4xx must not loop');

  // Torn API application errors are classified without leaking keys into diagnostics.
  core.api.registerEnvironment({ fetch: async () => response(200, { error:{ code:2, error:'Incorrect key' } }) });
  await assert.rejects(
    () => core.api.requestJson('https://api.torn.com/v2/user/money?key=secret-key', { throwApiError:true, force:true }),
    err => err?.code === 'TORN_API_ERROR' && err?.isInvalidKey === true && err?.apiCode === 2
  );
  assert.equal(JSON.stringify(core.api.diagnostics()).includes('secret-key'), false, 'diagnostics must not expose API keys');

  // Concurrency queue is globally bounded.
  let live = 0, peak = 0;
  core.api.configure({ maxConcurrent:2 });
  core.api.registerEnvironment({ fetch: async url => {
    live++; peak = Math.max(peak, live);
    await new Promise(r => setTimeout(r, 20));
    live--;
    return response(200, { url:String(url) });
  }});
  await Promise.all(Array.from({length:6}, (_,i) => core.api.requestJson(`https://example.test/${i}`, { force:true })));
  assert.ok(peak <= 2, `broker concurrency exceeded configured maximum: ${peak}`);

  // Route-scoped requests are aborted/suppressed after SPA navigation.
  core.api.configure({ maxConcurrent:4 });
  core.api.registerEnvironment({ fetch: (url, opts={}) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(response(200,{late:true})), 120);
    opts.signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('aborted')); }, { once:true });
  }) });
  const routeRequest = core.api.requestJson('https://example.test/route', { routeScoped:true, force:true, retries:0 });
  await new Promise(r => setTimeout(r, 10));
  context.location.search='?sid=travel';
  core.router.check();
  await assert.rejects(routeRequest, err => ['ABORTED','STALE_ROUTE'].includes(err?.code));
  assert.ok(core.api.diagnostics().aborted >= 1);

  // A later userscript can register a stronger GM transport into the already shared Core.
  let gmCalls = 0;
  context.GM_xmlhttpRequest = opts => {
    gmCalls++;
    setTimeout(() => opts.onload({ status:200, responseText:'{"via":"gm"}' }), 0);
    return { abort(){} };
  };
  vm.runInContext(code, context);
  const viaGm = await core.api.requestJson('https://example.test/gm', { force:true, retries:0 });
  assert.equal(viaGm.via, 'gm');
  assert.equal(gmCalls, 1, 'same-version Core bootstrap must register later GM transport');

  console.log('All Shared Core API Request Broker regression tests passed.');
})().catch(err => { console.error(err.stack || err); process.exit(1); });
