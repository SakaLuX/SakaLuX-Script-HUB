'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const src=fs.readFileSync('SakaLuX-Script-Hub.user.js','utf8');
const start=src.indexOf('const slxLicenseBroker=(()=>{');
const end=src.indexOf('\n    globalThis.SakaLuXLicenseBroker=slxLicenseBroker;',start);
assert(start>=0&&end>start,'license broker not found');
const brokerSource=src.slice(start,end)+'\nthis.testBroker=slxLicenseBroker;';
const id=2380374, expiry=new Date(Date.now()+180000).toISOString().replace('T',' ').replace(/\..*$/,'');
const future=Math.floor(Date.now()/1000)+160;
const key='A'.repeat(16);
const base64url=x=>Buffer.from(x).toString('base64url');
const claims={v:1,issuer:'sakalux.ro',subject:id,entitlements:['enhancer_guard'],iat:future-120,exp:future};
const cert={format:'slx-ed25519-v1',payload:base64url(JSON.stringify(claims)),signature:base64url(Buffer.alloc(64,3))};
const base={status:'ok',user:{id},premium_active:true,entitlements:['enhancer_guard'],expires_at:expiry};
async function scenario(label,response,verifyResult,shouldPass){
 let calls=0;
 const ctx={Date,JSON,Math,Number,String,Array,Error,Uint8Array,TextDecoder,atob,globalThis:null,
    crypto:{subtle:{importKey:async()=>({}),verify:async()=>verifyResult}},
    GM_xmlhttpRequest:req=>{calls++;queueMicrotask(()=>req.onload({status:200,responseText:JSON.stringify(response)}));}};
 ctx.globalThis=ctx;
 vm.runInNewContext(brokerSource,ctx);
 let passed=false;
 try{await ctx.testBroker.check(key);passed=true}catch{}
 assert.equal(passed,shouldPass,label);
 assert.equal(calls,1,label+': expected one network call');
}
(async()=>{
 await scenario('missing certificate',base,true,false);
 await scenario('bad signature',{...base,signed_certificate:cert},false,false);
 await scenario('valid signature',{...base,signed_certificate:cert},true,true);
 await scenario('verified FREE',{...base,premium_active:false,entitlements:[],signed_certificate:null},false,true);
 console.log('PASS: signed license broker positive/negative path tests');
})().catch(e=>{console.error(e);process.exit(1)});
