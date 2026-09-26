'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const child = require('node:child_process');
const crypto = require('node:crypto');
const { embedSharedCore, metadataHeader, BEGIN, END, stripSharedCore } = require('../tools/embed-shared-core.cjs');

const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'src/core/sakalux-core.js'), 'utf8');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'scripts.json'), 'utf8'));
const canonicalOrder = [
  'enhancer','bazaar','bazaar-smart-pricer','mission-rewards','market-intelligence',
  'elimination-assistant','company-intelligence','chat-intelligence','stock-manager-advisor','account-auditor'
];

const SKIP_DIRS = new Set(['.git', 'node_modules']);

function walkUserscripts(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.tmp-core-test-')) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkUserscripts(full, out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.user.js')) out.push({ full, rel, file: entry.name });
  }
  return out;
}

function sourceFileFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.split('/').pop() || '');
  } catch { return null; }
}

const registryEntries = (registry.scripts || []).filter(Boolean);
const registryByFile = new Map();
for (const entry of registryEntries) {
  const file = sourceFileFromUrl(entry.sourceUrl);
  if (file) registryByFile.set(file, entry);
}

// Critical rule: discover from the repository filesystem, not scripts.json.
// This guarantees that inactive, standalone and non-registry userscripts are tested too.
const files = walkUserscripts(root).sort((a, b) => a.rel.localeCompare(b.rel));
assert.ok(files.length > 0, 'no repository userscripts found');
assert.ok(files.some(x => x.file === 'SakaLuX-Suite.user.js'), 'SakaLuX Suite must be included in repository-wide coverage');
assert.ok(files.some(x => x.file === 'SakaLuX-Script-Hub.user.js'), 'Script Hub must be included in repository-wide coverage');

const report = [];
for (const item of files) {
  const source = fs.readFileSync(item.full, 'utf8');
  const baseline = stripSharedCore(source);
  assert.ok(source.includes('// ==UserScript==') && source.includes('// ==/UserScript=='), `${item.rel}: invalid userscript metadata`);

  const output = embedSharedCore(source, core);
  assert.equal(metadataHeader(output), metadataHeader(source), `${item.rel}: metadata changed during embedding`);
  assert.equal((output.match(new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1, `${item.rel}: core not embedded exactly once`);
  assert.equal((output.match(new RegExp(END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1, `${item.rel}: core end marker mismatch`);
  assert.ok(output.indexOf(BEGIN) > output.indexOf('// ==/UserScript=='), `${item.rel}: Core must be after metadata`);
  assert.equal(metadataHeader(output), metadataHeader(source), `${item.rel}: unexpected metadata/runtime dependency change`);

  // Idempotent rebuild: never duplicate Core or alter surrounding whitespace.
  const output2 = embedSharedCore(output, core);
  assert.equal(output2, output, `${item.rel}: embedding is not idempotent`);

  // Removing the embedded Core must restore the Core-free baseline byte-for-byte,
  // whether the checked-in source already contains Core or not.
  assert.equal(stripSharedCore(output), baseline, `${item.rel}: embedding changed original userscript body`);

  // Syntax validation of the fully embedded standalone build.
  const token = crypto.createHash('sha1').update(item.rel).digest('hex').slice(0, 12);
  const tmp = path.join(root, `.tmp-core-test-${token}.js`);
  fs.writeFileSync(tmp, output, 'utf8');
  try {
    child.execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe', maxBuffer: 16 * 1024 * 1024 });
  } finally {
    fs.rmSync(tmp, { force: true });
  }

  const usesPerf = /SakaLuXPerf/.test(source);
  const usesHubDetection = /hubInstalled|SakaLuXScriptHub|sakalux-hub-panel|data-sakalux-hub-installed/.test(source);
  const orderMatches = [...source.matchAll(/const\s+ORDER\s*=\s*\[([^\]]+)\]/g)];
  let dockOrdersChecked = 0;
  for (const orderMatch of orderMatches) {
    const ids = [...orderMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
    // Only treat ORDER constants containing known dock module ids as a shared-dock contract.
    if (!ids.some(id => canonicalOrder.includes(id))) continue;
    dockOrdersChecked++;
    assert.deepEqual(ids, canonicalOrder, `${item.rel}: standalone dock ORDER diverges from Shared Core canonical order`);
  }

  const registryEntry = registryByFile.get(item.file) || null;
  report.push({
    file: item.rel,
    registryId: registryEntry?.id || null,
    registryActive: registryEntry ? registryEntry.active !== false : null,
    usesPerf,
    usesHubDetection,
    dockOrdersChecked
  });
}

// Registry ids that participate in the shared dock must preserve canonical relative ordering.
const activeEntries = registryEntries.filter(x => x.active !== false);
const activeIds = new Set(activeEntries.map(x => x.id));
const knownActive = canonicalOrder.filter(id => activeIds.has(id));
const registryOrder = activeEntries.map(x => x.id).filter(id => canonicalOrder.includes(id));
assert.deepEqual(registryOrder, knownActive, 'scripts.json active shared-dock order diverges from canonical Core order');

// Every registry userscript source that points at this repository must exist among scanned files.
const scannedBasenames = new Set(files.map(x => x.file));
for (const entry of registryEntries) {
  const file = sourceFileFromUrl(entry.sourceUrl);
  if (file?.endsWith('.user.js')) assert.ok(scannedBasenames.has(file), `registry userscript missing from repository-wide scan: ${entry.id} -> ${file}`);
}

console.log(`Shared Core repository-wide compatibility passed for ${files.length} userscripts.`);
for (const r of report) console.log(JSON.stringify(r));
