'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const { embedSharedCore, metadataHeader, BEGIN, END } = require('../tools/embed-shared-core.cjs');

const core = fs.readFileSync('src/core/sakalux-core.js', 'utf8');
const targets = [
  'SakaLuX-Market-Intelligence.user.js',
  'SakaLuX-Stock-Manager-Advisor.user.js'
];

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

for (const file of targets) {
  const original = fs.readFileSync(file, 'utf8');
  const originalHeader = metadataHeader(original);
  const version = originalHeader.match(/^\/\/ @version\s+(.+)$/m)?.[1]?.trim();
  assert.ok(version, `${file}: metadata version found`);

  const built = embedSharedCore(original, core);
  assert.equal(metadataHeader(built), originalHeader, `${file}: userscript metadata unchanged`);
  assert.equal(count(built, BEGIN), 1, `${file}: one Shared Core BEGIN marker`);
  assert.equal(count(built, END), 1, `${file}: one Shared Core END marker`);
  assert.equal(count(built, "const NS = 'SakaLuXCore'"), 1, `${file}: Core embedded exactly once`);
  assert.match(built, /globalThis/, `${file}: embedded Core remains standalone`);
  assert.doesNotMatch(originalHeader, /@require\s+.*sakalux-core/i, `${file}: no runtime Core dependency`);
  assert.equal(metadataHeader(embedSharedCore(built, core)), originalHeader, `${file}: re-embedding is idempotent`);
  assert.equal(count(embedSharedCore(built, core), BEGIN), 1, `${file}: repeated build does not duplicate Core`);

  const temp = path.join(os.tmpdir(), `shared-core-${path.basename(file)}`);
  fs.writeFileSync(temp, built, 'utf8');
  cp.execFileSync(process.execPath, ['--check', temp], { stdio: 'pipe' });

  const builtVersion = metadataHeader(built).match(/^\/\/ @version\s+(.+)$/m)?.[1]?.trim();
  assert.equal(builtVersion, version, `${file}: version is unchanged by test embedding`);
}

console.log('Shared Core embedding/build test passed for Market Intelligence and Stock Manager.');
