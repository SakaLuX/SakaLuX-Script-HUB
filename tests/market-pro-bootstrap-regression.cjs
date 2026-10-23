'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('SakaLuX-Market-Intelligence.user.js','utf8');
const start = source.indexOf('async function isPro(forceRevalidate=false)');
const end = source.indexOf('function locked()', start);
assert(start >= 0 && end > start, 'Market must expose independent forced PRO revalidation');
const block = source.slice(start, end);
assert.match(block, /!forceRevalidate&&k===verifiedKey/, 'Forced revalidation must bypass local short-lived grant');
assert.match(block, /!forceRevalidate&&hub\?\.key/, 'Forced revalidation must bypass Hub cached grant');
assert.match(block, /!forceRevalidate&&restoreRecentGrant\(k\)/, 'Forced revalidation must bypass persisted grant');
assert.match(block, /broker\?\.check/, 'Use shared license broker when available');
assert.match(block, /GM_xmlhttpRequest/, 'Standalone license lookup must work without Hub');
assert.match(block, /__SakaLuXLicenseStandaloneFlight/, 'Market must share same-key in-flight license requests');
assert.match(block, /existing\?\.key===k&&existing\.promise/, 'Market must require matching identity');
assert.match(block, /globalThis\.__SakaLuXLicenseStandaloneFlight===shared/, 'Market must clean up only its own request');

assert.match(source, /if\(restoreRecentGrant\(key\(\)\)\)setTimeout\(\(\)=>\{void isPro\(true\)/,
  'Previously verified cached PRO must trigger a fresh validation at page startup');
assert.match(block, /forgetGrant\(\);verificationState='free'/, 'Explicit revocation must clear saved grant');
assert.match(block, /licenseNextRetry=Date\.now\(\)/, 'Network failure must retain rate-limit backoff');
console.log('Market independent PRO bootstrap and revocation guard passed.');
