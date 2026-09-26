'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const child = require('node:child_process');
const { embedSharedCore, stripSharedCore, metadataHeader, BEGIN, END } = require('../tools/embed-shared-core.cjs');

const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'src/core/sakalux-core.js'), 'utf8');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'scripts.json'), 'utf8'));
const canonicalOrder = [
  'enhancer','bazaar','bazaar-smart-pricer','mission-rewards','market-intelligence',
  'elimination-assistant','company-intelligence','chat-intelligence','stock-manager-advisor','account-auditor'
];

function sourceFileFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.split('/').pop() || '');
  } catch { return null; }
}

const activeEntries = (registry.scripts || []).filter(x => x && x.active !== false && x.sourceUrl);
const files = [];
for (const entry of activeEntries) {
  const file = sourceFileFromUrl(entry.sourceUrl);
  if (!file || !file.endsWith('.user.js')) continue;
  const full = path.join(root, file);
  assert.ok(fs.existsSync(full), `registry source missing locally: ${entry.id} -> ${file}`);
  files.push({ id: entry.id, file, full, entry });
}

const hubFile = path.join(root, 'SakaLuX-Script-Hub.user.js');
if (fs.existsSync(hubFile) && !files.some(x => x.full === hubFile)) {
  files.push({ id: 'script-hub', file: 'SakaLuX-Script-Hub.user.js', full: hubFile, entry: null });
}

assert.ok(files.length >= 8, `expected the active SakaLuX suite, found only ${files.length} userscripts`);

const report = [];
for (const item of files) {
  const source = fs.readFileSync(item.full, 'utf8');
  assert.ok(source.includes('// ==UserScript==') && source.includes('// ==/UserScript=='), `${item.file}: invalid userscript metadata`);

  const output = embedSharedCore(source, core);
  assert.equal(metadataHeader(output), metadataHeader(source), `${item.file}: metadata changed during embedding`);
  assert.equal((output.match(new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1, `${item.file}: core not embedded exactly once`);
  assert.equal((output.match(new RegExp(END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1, `${item.file}: core end marker mismatch`);
  assert.ok(output.indexOf(BEGIN) > output.indexOf('// ==/UserScript=='), `${item.file}: Core must be after metadata`);

  const output2 = embedSharedCore(output, core);
  assert.equal(output2, output, `${item.file}: embedding is not idempotent`);

  assert.equal(stripSharedCore(output), source, `${item.file}: embedding changed original userscript body`);

  const tmp = path.join(root, '.tmp-core-test-' + item.id.replace(/[^a-z0-9_-]/gi, '_') + '.js');
  fs.writeFileSync(tmp, output, 'utf8');
  try {
    child.execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  } finally {
    fs.rmSync(tmp, { force: true });
  }

  const usesPerf = /SakaLuXPerf/.test(source);
  const usesHubDetection = /hubInstalled|SakaLuXScriptHub|sakalux-hub-panel|data-sakalux-hub-installed/.test(source);
  const orderMatch = source.match(/const\s+ORDER\s*=\s*\[([^\]]+)\]/);
  let orderCompatible = true;
  if (orderMatch) {
    const ids = [...orderMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
    orderCompatible = JSON.stringify(ids) === JSON.stringify(canonicalOrder);
    assert.ok(orderCompatible, `${item.file}: standalone dock ORDER diverges from Shared Core canonical order`);
  }

  report.push({ id:item.id, file:item.file, usesPerf, usesHubDetection, hasDockOrder:!!orderMatch, orderCompatible });
}

const activeIds = new Set(activeEntries.map(x => x.id));
const knownActive = canonicalOrder.filter(id => activeIds.has(id));
const registryOrder = activeEntries.map(x => x.id).filter(id => canonicalOrder.includes(id));
assert.deepEqual(registryOrder, knownActive, 'scripts.json active shared-dock order diverges from canonical Core order');

console.log(`Shared Core all-script compatibility passed for ${files.length} userscripts.`);
for (const r of report) console.log(JSON.stringify(r));
