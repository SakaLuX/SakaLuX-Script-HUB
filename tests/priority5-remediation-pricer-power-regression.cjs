'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');

const hub = fs.readFileSync('SakaLuX-Script-Hub.user.js','utf8');
const pricer = fs.readFileSync('SakaLuX-Bazaar-Smart-Pricer.user.js','utf8');
const registry = JSON.parse(fs.readFileSync('scripts.json','utf8'));

assert.match(hub,/\/\/ @version\s+1\.9\.88/);
assert.ok(hub.includes('function getRemediationAction(script)'));
for (const label of ['UPDATE','ENABLE','OPEN PAGE','FIX API','RECHECK','INSTALL']) assert.ok(hub.includes(`label: '${label}'`), label);
assert.ok(hub.includes('data-remediate='));
assert.ok(hub.includes("document.querySelectorAll('[data-remediate]')"));
assert.ok(hub.includes('runRemediationAction(button.dataset.remediate)'));
assert.ok(hub.includes("script.id === 'bazaar-smart-pricer' && installed"));
assert.ok(hub.includes('SakaLuX:BazaarSmartPricerPowerRequested'));

assert.match(pricer,/\/\/ @version\s+1\.1\.12/);
assert.ok(pricer.includes('SakaLuX Bazaar Smart Pricer Global Power Bridge — BEGIN'));
assert.ok(pricer.includes("const LOCAL_KEY = 'SakaLuX_BAZAAR_SMART_PRICER_ENABLED'"));
assert.ok(pricer.includes('api.isEnabled = readEnabled'));
assert.ok(pricer.includes('api.setEnabled = writeEnabled'));
assert.ok(pricer.includes('api.toggleEnabled'));
assert.ok(pricer.includes("bridge.id = 'sakalux-module-bridge-bazaar-smart-pricer'"));
assert.ok(pricer.includes('SakaLuX:BazaarSmartPricerPowerRequested'));
assert.ok(pricer.includes("localStorage.setItem('SakaLuX_BAZAAR_SMART_PRICER_ENABLED'"));

const hubRow = registry.scripts.find(x=>x.id==='script-hub');
const pricerRow = registry.scripts.find(x=>x.id==='bazaar-smart-pricer');
assert.equal(hubRow.version,'1.9.88');
assert.equal(pricerRow.version,'1.1.12');

console.log('Priority 5 remediation + Bazaar Smart Pricer global power regression passed.');
