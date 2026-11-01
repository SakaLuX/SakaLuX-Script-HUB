'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const rows=[
 ['SakaLuX-Bounty-Hunter.user.js','bounty_hunter_pro'],
 ['SakaLuX-Market-Intelligence.user.js','market_intelligence_pro'],
 ['SakaLuX-Stock-Manager-Advisor.user.js','stock_manager_pro'],
 ['SakaLuX-Elimination-Assistant.user.js','elimination_assistant_pro'],
 ['SakaLuX-Mission-Rewards.user.js','mission_rewards_pro'],
 ['SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar_smart_pricer_pro'],
 ['SakaLuX-Company-Intelligence-v1.0.0.user.js','company_director'],
 ['SakaLuX-Enhancer-Guard.user.js','enhancer_guard'],
 ['SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar_thanker']
];
for(const [file,ent] of rows){
 const code=fs.readFileSync(file,'utf8');
 assert(code.includes('SakaLuX Signed License Verifier — BEGIN'),file+' missing isolated verifier');
 assert(code.includes('SakaLuXLicenseClient.check'),file+' missing shared license client');
 assert(code.includes('claim.api_key_hash!==await hash(apiKey)'),file+' must authenticate signed API key binding');
 assert(code.includes(ent),file+' missing explicit entitlement');
 assert(code.includes('SakaLuX Signed License Verifier — END'),file+' unterminated verifier');
}
const suite=fs.readFileSync('SakaLuX-Suite.user.js','utf8');
const canonical=fs.readFileSync('src/core/sakalux-signed-license-grant.js','utf8').trimEnd();
for(const file of [...rows.map(r=>r[0]),'SakaLuX-Suite.user.js','SakaLuX-Script-Hub.user.js']){
 const code=fs.readFileSync(file,'utf8');
 const embedded=code.match(/\/\* SakaLuX Signed License Verifier — BEGIN \*\/\n([\s\S]*?)\n\/\* SakaLuX Signed License Verifier — END \*\//);
 assert.equal(embedded?.[1],canonical,file+' must embed the exact shared verifier/client source');
}
assert(suite.includes('SakaLuX Signed License Verifier — BEGIN'));
assert(!suite.includes("SakaLuXFreemium['suite']={isPro:()=>true}"),'Suite must not bypass license gates');
assert(suite.includes('SakaLuX Suite Signed PRO Access — BEGIN'),'Suite must expose a signed-grant consumer');
assert(suite.includes('SakaLuXSuiteSignedPro=Object.freeze({check})'),'Suite must provide module-specific entitlement checks');
assert(suite.includes('SakaLuXLicenseClient.check(apiKey)'),'Suite must use independently verified, key-bound grants');
assert(suite.includes('claim.api_key_hash!==await hash(apiKey)'),'Suite must authenticate current key using the signed claim');
assert(suite.includes("if(apiKey!==getApiKey())return false"),'Suite must reject account switches');
assert(!suite.includes('SakaLuXSuiteSignedPro=Object.freeze({check:()=>true})'),'Suite must never unconditionally grant PRO');
console.log('Signed-license consumers: 9 independent modules and Suite verifier available; no Suite-wide PRO bypass.');
