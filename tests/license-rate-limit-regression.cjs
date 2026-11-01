'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto,generateKeyPairSync,sign,createHash}=require('node:crypto');
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const pub=publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64');
const source=fs.readFileSync('src/core/sakalux-signed-license-grant.js','utf8').replace('Hw+1h/0NZwOLEmJ+sbwgcKBIpJrgE/5kmjGnA7hnrhM=',pub);
const key='AAAAAAAAAAAAAAAA',other='BBBBBBBBBBBBBBBB';
let now=Date.now(),requests=0;
const storageMap=new Map();
const storage={getItem:k=>storageMap.get(k)||null,setItem:(k,v)=>storageMap.set(k,v),removeItem:k=>storageMap.delete(k)};
function grant(apiKey=key,rights=['stock_manager_pro','bounty_hunter_pro']){
 const t=Math.floor(now/1000),claim={issuer:'sakalux.ro',v:1,subject:apiKey===key?123:456,iat:t,exp:t+300,entitlements:rights,
  api_key_hash:createHash('sha256').update(apiKey).digest('hex')};
 const bytes=Buffer.from(JSON.stringify(claim));
 return {status:'ok',premium_active:true,user:{id:claim.subject},entitlements:rights,expires_at:new Date(now+3600000).toISOString(),
  signed_certificate:{format:'slx-ed25519-v1',payload:bytes.toString('base64url'),signature:sign(null,bytes,privateKey).toString('base64url')}};
}
let reply=options=>({status:200,responseText:JSON.stringify(grant(JSON.parse(options.data).api_key))});
let tail=Promise.resolve();
const locks={request:(_name,callback)=>{const next=tail.then(callback);tail=next.catch(()=>{});return next}};
function realm({withLocks=true,transport='callback',sharedStorage=storage}={}){
 const context={crypto:webcrypto,TextEncoder,TextDecoder,atob,Uint8Array,setTimeout,clearTimeout,Math,
  Date:class extends Date{static now(){return now}},localStorage:sharedStorage,navigator:withLocks?{locks}:{},
  GM_xmlhttpRequest:options=>{
   requests++;assert.equal(options.method,'POST','No repeated Torn identity request is needed');
   const response=reply(options);
   if(transport==='promise')return Promise.resolve(response);
   if(transport==='both'){options.onload(response);return Promise.resolve(response)}
   setTimeout(()=>options.onload(response),1);
  }};
 vm.createContext(context);vm.runInContext(source,context);return context;
}
function reset(){storageMap.clear();requests=0;tail=Promise.resolve()}
(async()=>{
 reset();
 const worlds=Array.from({length:11},()=>realm());
 const results=await Promise.all(worlds.map(r=>r.SakaLuXLicenseClient.check(key)));
 assert.equal(requests,1,'Eleven isolated modules must make a single server request');
 assert(results.every(d=>d.premium_active));
 const reloaded=realm();await reloaded.SakaLuXLicenseClient.check(key);
 assert.equal(requests,1,'Page reload must reuse the independently verified certificate');
 const signed=reloaded.SakaLuXSignedGrant;
 assert(await signed.load(storage,key,'stock_manager_pro'));
 assert.equal(await signed.load(storage,key,'company_director'),null,'Entitlements stay module-scoped');
 assert.equal(await signed.verify(grant(),{apiKey:other,entitlement:'stock_manager_pro'}),false,'A signed key binding prevents replay under another key');
 await reloaded.SakaLuXLicenseClient.check(other);assert.equal(requests,2,'Account switches trigger their own verification');
 assert.equal(await signed.load(storage,key,'stock_manager_pro'),null);
 now+=301000;await realm().SakaLuXLicenseClient.check(key);
 assert.equal(requests,3,'Certificate expiry requires a fresh online check');
 // Modified storage fields never grant PRO: the signed claims are checked again.
 const saved=JSON.parse(storage.getItem(signed.STORAGE_KEY));saved.data.entitlements.push('company_director');
 storage.setItem(signed.STORAGE_KEY,JSON.stringify(saved));
 assert.equal(await signed.load(storage,key,'company_director'),null);
 await realm().SakaLuXLicenseClient.check(key);assert.equal(requests,4);

 reset();
 const fallback=Array.from({length:9},()=>realm({withLocks:false}));
 await Promise.all(fallback.map(r=>r.SakaLuXLicenseClient.check(key)));
 assert.equal(requests,1,'Older WebViews coordinate through an expiring storage lease');

 for(const [response,seconds] of [
  [{status:429,responseText:'{"status":"rate_limited","retry_after":37}'},37],
  [{status:429,responseText:'{}',responseHeaders:'Retry-After: 123\r\n'},123],
  [{status:429,responseText:'not JSON'},900]
 ]){
  reset();reply=()=>response;
  await assert.rejects(realm().SakaLuXLicenseClient.check(key),new RegExp('retry in '+seconds+'s'));
  for(let i=0;i<3;i++)await assert.rejects(realm().SakaLuXLicenseClient.check(other,{force:true}),/rate_limited/);
  assert.equal(requests,1,'Cooldown survives reload and account changes');
  now+=(seconds+1)*1000;reply=o=>({status:200,responseText:JSON.stringify(grant(JSON.parse(o.data).api_key))});
  await realm().SakaLuXLicenseClient.check(key);assert.equal(requests,2,'Retry resumes after the actual server deadline');
 }
 for(const transport of ['promise','both']){
  reset();await realm({transport}).SakaLuXLicenseClient.check(key);assert.equal(requests,1);
  await realm().SakaLuXLicenseClient.check(key);assert.equal(requests,1,'Promise/callback adapters persist one valid result');
 }
 reset();reply=()=>({status:200,responseText:'{"status":"ok","premium_active":false,"user":{"id":123},"entitlements":[],"expires_at":null}'});
 await Promise.all(Array.from({length:9},()=>realm().SakaLuXLicenseClient.check(key)));
 assert.equal(requests,1,'FREE accounts share a 30 second negative cache');
 now+=31000;await realm().SakaLuXLicenseClient.check(key);assert.equal(requests,2);
 reset();reply=()=>({status:200,responseText:'bad JSON'});
 await assert.rejects(realm().SakaLuXLicenseClient.check(key),/invalid_license_response/);
 await assert.rejects(realm().SakaLuXLicenseClient.check(key));assert.equal(requests,1,'Transient failures cannot create request storms');
 reset();reply=o=>({status:200,responseText:JSON.stringify(grant(JSON.parse(o.data).api_key))});
 // Exercise the actual Hub startup path with an existing signed certificate.
 const hubWorld=realm();await hubWorld.SakaLuXSignedGrant.store(storage,key,grant(),123);
 const hubSource=fs.readFileSync('SakaLuX-Script-Hub.user.js','utf8');
 const broker=hubSource.slice(hubSource.indexOf('    const slxLicenseBroker=(()=>{'),hubSource.indexOf('    // Lightweight status display;'));
 const refresh=hubSource.slice(hubSource.indexOf('    async function refreshHubProStatus('),hubSource.indexOf('    // Shared license recovery:'));
 Object.assign(hubWorld,{testKey:key,cleared:0,document:{getElementById:()=>null},CustomEvent:class{constructor(name,args){this.detail=args?.detail}},
  window:{dispatchEvent(){}},getSharedApiKey:()=>hubWorld.testKey,restoreVerifiedHubPro:()=>null,
  paintHubProStatus(){},rememberVerifiedHubPro(){},discardVerifiedHubPro(){},publishSignedHubGrant:async()=>{},clearHubProRecovery(){},queueHubProRecovery(){},
  clearSignedHubGrant:()=>{hubWorld.cleared++;storage.removeItem(hubWorld.SakaLuXSignedGrant.STORAGE_KEY)}});
 vm.runInContext("let hubProCache=null,hubProCheckedAt=0,hubProPending=null,hubProTimer=null,hubProKey='',hubProRequestKey='';\n"+
  broker.replace('Hw+1h/0NZwOLEmJ+sbwgcKBIpJrgE/5kmjGnA7hnrhM=',pub)+refresh+'\nglobalThis.testRefresh=refreshHubProStatus;',hubWorld);
 await hubWorld.testRefresh();assert.equal(hubWorld.cleared,0,'Initial Hub startup must preserve the saved certificate');
 assert.equal(requests,0,'Hub startup can reuse the same certificate as isolated modules');
 hubWorld.testKey=other;await hubWorld.testRefresh();assert.equal(hubWorld.cleared,1,'A real account switch clears the previous signed grant');
 assert.equal(requests,1);
 reset();
 const manual=realm();await manual.SakaLuXLicenseClient.check(key);
 await manual.SakaLuXLicenseClient.check(key,{force:true});
 assert.equal(requests,2,'An explicit manual revalidation can refresh an otherwise valid grant');
 reset();
 const blocked={getItem(){throw Error('storage blocked')},setItem(){throw Error('storage blocked')},removeItem(){throw Error('storage blocked')}};
 await realm({withLocks:false,sharedStorage:blocked}).SakaLuXLicenseClient.check(key);
 assert.equal(requests,1,'Unavailable storage still permits authoritative online checks');
 console.log('License runtime: isolated realms, reload, expiry, identity, rights, tampering, 429 deadlines, transport modes, FREE cache and offline storage passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
