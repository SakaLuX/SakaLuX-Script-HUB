'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');

const targets=[
  'SakaLuX-Enhancer-Guard.user.js',
  'SakaLuX-Bazaar-Thanker-PDA.user.js',
  'SakaLuX-Bazaar-Smart-Pricer.user.js',
  'SakaLuX-Mission-Rewards.user.js',
  'SakaLuX-Market-Intelligence.user.js',
  'SakaLuX-Elimination-Assistant.user.js',
  'SakaLuX-Company-Intelligence-v1.0.0.user.js',
  'SakaLuX-Stock-Manager-Advisor.user.js',
  'SakaLuX-Account-Auditor.user.js',
];
for(const file of targets){
  const src=fs.readFileSync(file,'utf8');
  assert.equal((src.match(/SakaLuX Shared Dock Runtime — BEGIN/g)||[]).length,1,`${file}: runtime once`);
  assert.equal((src.match(/SakaLuX Shared Dock Runtime — END/g)||[]).length,1,`${file}: runtime end once`);
  assert.equal((src.match(/SakaLuX Shared Dock Registration — BEGIN/g)||[]).length,1,`${file}: registration once`);
  assert.ok(!src.includes('SakaLuX Standalone Dock Bootstrap — BEGIN'),`${file}: legacy block removed`);
  assert.ok(!src.includes('function ensureDock'),`${file}: legacy ensureDock removed`);
  assert.ok(src.includes('globalThis.SakaLuXDockRuntime'),`${file}: shared runtime registration present`);
  assert.ok(src.includes("bridge.dataset.action = 'open'"),`${file}: bridge open fallback preserved`);
  assert.match(src,/\/\/\s*@version\s+\S+/,`${file}: metadata version preserved`);
}
console.log(`Priority 6 migration regression passed for ${targets.length} userscripts.`);
