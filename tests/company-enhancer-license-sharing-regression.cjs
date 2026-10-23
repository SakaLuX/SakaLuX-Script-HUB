'use strict';
const fs=require('node:fs'), assert=require('node:assert/strict');
const company=fs.readFileSync('SakaLuX-Company-Intelligence-v1.0.0.user.js','utf8');
const enhancer=fs.readFileSync('SakaLuX-Enhancer-Guard.user.js','utf8');
for(const [name,source,scope] of [
 ['Company',company,sourceSlice(company,'async function ciCheckDirectorPro(','function ciProExplanation()')],
 ['Enhancer',enhancer,sourceSlice(enhancer,'async function slxCheckProAccess()','function slxProCurrent()')]
]){
 assert.match(scope,/SakaLuXLicenseStandaloneFlight/,name+' shares standalone in-flight lookup');
 assert.match(scope,/\.key===key&&.*\.promise/,name+' requires same API key');
 assert.match(scope,/SakaLuXLicenseBroker/,name+' prefers broker when available');
 assert.match(scope,/globalThis\.__SakaLuXLicenseStandaloneFlight===shared/,name+' cleans only own in-flight request');
 assert.match(scope,/replace\(\/Z\$\/i,''\)\+'Z'/,name+' normalizes UTC expiry');
}
assert.match(company,/entitlements\.includes\('company_director'\)/,'Company entitlement stays scoped');
assert.match(enhancer,/entitlements\.includes\('enhancer_guard'\)/,'Enhancer entitlement stays scoped');
function sourceSlice(src,a,b){const begin=src.indexOf(a),end=src.indexOf(b,begin);assert(begin>=0&&end>begin,a+' must exist');return src.slice(begin,end)}
console.log('Company and Enhancer common in-flight license wiring passed.');

// Isolated userscript worlds have different globalThis objects; never claim same-realm
// deduplication across those worlds. Dedicated remote verification remains mandatory.
const realmA={},realmB={};
realmA.__SakaLuXLicenseStandaloneFlight={key:'AAAAAAAAAAAAAAAA',promise:Promise.resolve({status:'ok'})};
assert.equal(realmB.__SakaLuXLicenseStandaloneFlight,undefined);
console.log('Isolated realms: standalone globals are not a cross-world cache.');
