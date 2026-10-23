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
  assert.match(source,/__SakaLuXLicenseStandaloneFlight/,id+' must share in-flight fallback request');
  assert.match(source,/globalFlight\?\.key===k&&globalFlight\.promise/,id+' must match the correct API key');
  assert.match(source,/const ok=d\?\.status==='ok'&&accepts\(d,k\)/,id+' must independently validate its own entitlement');
}
console.log('Standalone Bounty and Stock PRO startup checks wired.');

(async () => {
  const shared = {};
  let requests = 0;
  const reply = {
    status: 'ok', premium_active: true,
    entitlements: ['bounty-hunter'],
    expires_at: new Date(Date.now() + 3600000).toISOString()
  };
  const GM = options => {
    requests++;
    setTimeout(() => options.onload({status:200,responseText:JSON.stringify(reply)}),10);
  };
  function build(file, entitlement, keyValue='AAAAAAAAAAAAAAAA') {
    const text = fs.readFileSync(file,'utf8');
    const begin = text.indexOf('async function isPro(){');
    const end = text.indexOf('function locked(){',begin);
    assert(begin >= 0 && end > begin, file + ' missing isPro implementation');
    const method = text.slice(begin,end);
    const factory = new Function('shared','GM','entitlement','keyValue',`
      const globalThis=shared, GM_xmlhttpRequest=GM;
      let pending=null, verifiedKey='', verifiedUntil=0, verificationState='not_checked';
      const key=()=>keyValue;
      const accepts=(d,k)=>d?.premium_active===true &&
        d.entitlements?.includes(entitlement) && k===keyValue;
      ${method}
      return isPro;
    `);
    return factory(shared,GM,entitlement,keyValue);
  }
  const bounty = build('SakaLuX-Bounty-Hunter.user.js','bounty-hunter');
  const stock = build('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor');
  const [bountyGranted,stockGranted] = await Promise.all([bounty(),stock()]);
  assert.equal(requests,1,'Two independent modules should coalesce same-key concurrent checks');
  assert.equal(bountyGranted,true,'Bounty should receive only its own entitlement');
  assert.equal(stockGranted,false,'Stock must not inherit Bounty entitlement');
  assert.equal(shared.__SakaLuXLicenseStandaloneFlight,undefined,'In-flight check must be cleaned up');
  console.log('Standalone license concurrency: one network request, module-specific grants and cleanup passed.');
})().catch(err=>{console.error(err);process.exitCode=1;});
