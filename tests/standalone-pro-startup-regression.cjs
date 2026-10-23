'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
for (const [file, id] of [
  ['SakaLuX-Bounty-Hunter.user.js','bounty-hunter'],
  ['SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor']
]) {
  const source = fs.readFileSync(file,'utf8');
  const anchor = "globalThis.SakaLuXFreemium['"+id+"']={isPro,locked,isActive:()=>verifiedKey===key()&&verifiedUntil>Date.now()};";
  assert(source.includes(anchor), id + ' missing existing PRO gating');
  const index = source.indexOf(anchor);
  const next = source.slice(index+anchor.length,index+anchor.length+250);
  assert.match(next,/setTimeout\(\(\)=>\{void isPro\(\)\.catch\(\(\)=>\{\}\);\},1200\)/,
    id + ' must initialize entitlement check without opening Hub');
  assert.match(source,/broker\?\.check/,id+' must reuse shared broker');
  assert.match(source,/GM_xmlhttpRequest/,id+' must retain standalone fallback');
}
console.log('Standalone Bounty and Stock PRO startup checks wired.');
