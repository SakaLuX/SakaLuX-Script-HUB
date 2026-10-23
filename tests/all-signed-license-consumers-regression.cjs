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
 assert(code.includes('SakaLuXSignedGrant.load')||code.includes('signed.load(localStorage'),file+' missing signed cache load');
 assert(code.includes('/v2/user/basic?key='),file+' must independently fetch Torn ID');
 assert(code.includes(ent),file+' missing explicit entitlement');
 assert(code.includes('SakaLuX Signed License Verifier — END'),file+' unterminated verifier');
}
const suite=fs.readFileSync('SakaLuX-Suite.user.js','utf8');
assert(suite.includes('SakaLuX Signed License Verifier — BEGIN'));
assert(!suite.includes("SakaLuXFreemium['suite']={isPro:()=>true}"),'Suite must not bypass license gates');
console.log('Signed-license consumers: 9 independent modules and Suite verifier available; no Suite-wide PRO bypass.');
