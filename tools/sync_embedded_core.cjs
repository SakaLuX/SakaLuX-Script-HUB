'use strict';
// Propagate the canonical Shared Core to every managed userscript without
// changing app code, userscript metadata or application versions.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { metadataHeader, BEGIN, END } = require('./embed-shared-core.cjs');

const write = process.argv.includes('--write');
const core = fs.readFileSync('src/core/sakalux-core.js', 'utf8').trim();
const config = JSON.parse(fs.readFileSync('release-config.json', 'utf8')).scripts;
const marker = /\/\* SakaLuX Shared Core\s*[—-]\s*BEGIN \*\/[\s\S]*?\/\* SakaLuX Shared Core\s*[—-]\s*END \*\//g;
const expected = BEGIN + '\n' + core + '\n' + END;
const version = core.match(/const CORE_VERSION = '([^']+)'/)?.[1];
assert.ok(version, 'Canonical Core must declare a version');

const updated = [];
for (const entry of config) {
  const source = fs.readFileSync(entry.file, 'utf8');
  const matches = [...source.matchAll(marker)];
  assert.equal(matches.length, 1, entry.file + ': expected one complete embedded Shared Core block');
  const output = source.replace(marker, expected);
  assert.equal(metadataHeader(output), metadataHeader(source), entry.file + ': metadata must remain unchanged');
  assert.equal(output.split("const NS = 'SakaLuXCore'").length - 1, 1, entry.file + ': exactly one Core namespace');
  if (output !== source) {
    updated.push(entry.file);
    if (write) fs.writeFileSync(entry.file, output, 'utf8');
  }
}
console.log('Shared Core ' + version + ' | managed scripts: ' + config.length + ' | needing update: ' + updated.length);
for (const file of updated) console.log((write ? 'UPDATED ' : 'PENDING ') + file);
