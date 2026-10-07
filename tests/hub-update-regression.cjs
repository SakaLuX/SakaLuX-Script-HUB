const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const dom = new JSDOM('<body></body>', { url: 'https://www.torn.com/index.php', runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.fetch = () => Promise.reject(Error('Offline fixture'));
  let source = fs.readFileSync('SakaLuX-Script-Hub.user.js', 'utf8');
  source = source.replace('    async function init() {', '    window.__updatesTest = { compareVersions, normalizeRegistry, checkScriptUpdate, normalizeCachedUpdate, getUpdateState, getInstallUrl, isUpdateCacheFresh, FALLBACK_REGISTRY };\n    async function init() {');
  w.eval(source);
  const api = w.__updatesTest;
  const original = api.FALLBACK_REGISTRY.scripts.find(s => s.id === 'bounty-hunter');
  const script = api.normalizeRegistry({ scripts: [original] })[0];
  assert.equal(api.compareVersions('0.5.7', '0.5.6.7'), 1);
  // Even a stale registry carrying a larger detailsRevision cannot lower a release.
  const stale = api.normalizeRegistry({ scripts: [{ ...original, version: '0.5.6.7', detailsRevision: 999, info: 'stale' }] })[0];
  assert.equal(stale.expectedVersion, original.version);
  assert.equal(stale.info, original.info);

  const calls = [];
  const response = version => ({ ok: true, text: async () => '// @version '+version+'\n' });
  w.document.documentElement.setAttribute('data-sakalux-installed-bounty-hunter', '0.5.6.7');
  w.fetch = async url => {
    calls.push(url);
    return response(url.startsWith(script.metaUrl) ? '0.5.6.7' : script.version);
  };
  let result = await api.checkScriptUpdate(script, true);
  assert.equal(result.available, true);
  assert.equal(result.latest, script.version);
  assert.equal(result.distributionBehind, false);
  assert.equal(api.getUpdateState(script).state, 'available');
  assert.equal(api.getInstallUrl(script), script.sourceUrl);
  assert(calls.some(url => url.startsWith(script.metaUrl) && url.includes('?t=')));
  assert(calls.some(url => url.startsWith(script.sourceUrl)));
  assert.equal(api.isUpdateCacheFresh(script), true);
  w.document.documentElement.setAttribute('data-sakalux-installed-bounty-hunter', script.version);
  assert.equal(api.isUpdateCacheFresh(script), false);
  assert.equal(api.normalizeCachedUpdate(script).available, false);
  assert.equal(api.getUpdateState(script).state, 'current');

  w.fetch = async url => {
    if (url.startsWith(script.metaUrl)) throw Error('GreasyFork unavailable');
    return response(script.version);
  };
  result = await api.checkScriptUpdate(script, true);
  assert.equal(result.error, null);
  assert.equal(api.getInstallUrl(script), script.sourceUrl);
  w.fetch = () => Promise.reject(Error('All sources offline'));
  result = await api.checkScriptUpdate(script, true);
  assert(result.error);
  assert.equal(api.getUpdateState(script).state, 'failed');
  assert.equal(api.isUpdateCacheFresh(script), false);

  w.document.documentElement.setAttribute('data-sakalux-installed-bounty-hunter', '0.5.6.7');
  w.fetch = async url => {
    assert(url.startsWith(script.metaUrl), 'No source request needed when GreasyFork is current');
    return response('0.5.8');
  };
  result = await api.checkScriptUpdate(script, true);
  assert.equal(result.latest, '0.5.8');
  assert.equal(result.available, true);
  assert.equal(api.getInstallUrl(script), script.downloadUrl);

  w.fetch = async url => {
    if (url.startsWith(script.sourceUrl)) throw Error('GitHub unavailable');
    return response('0.5.6.7');
  };
  result = await api.checkScriptUpdate(script, true);
  assert.equal(result.available, false);
  assert.equal(api.getUpdateState(script).state, 'pending');
  assert.equal(api.getInstallUrl(script), script.downloadUrl);
  dom.window.close();
  console.log('Hub updates: four-to-three-part upgrade, stale registry, verified installer, cache invalidation and offline failures passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
