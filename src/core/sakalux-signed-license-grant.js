/* SakaLuX signed license grant verifier — independent userscript realms.
 * Shared storage is a transport only, never an authorization decision.
 */
(function(root) {
  'use strict';
  const PUBLIC_KEY_B64='Hw+1h/0NZwOLEmJ+sbwgcKBIpJrgE/5kmjGnA7hnrhM=';
  const STORAGE_KEY='SakaLuX_SIGNED_PRO_GRANT_V1';
  const decode=s=>Uint8Array.from(atob(String(s).replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-String(s).length%4)%4)),c=>c.charCodeAt(0));
  const validKey=k=>/^[A-Za-z0-9]{16}$/.test(String(k));
  const hash=async k=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(k)))).map(n=>n.toString(16).padStart(2,'0')).join('');
  async function verify(data,{apiKey,entitlement,userId,now=Date.now()}={}){
    if(!validKey(apiKey)||typeof entitlement!=='string'||!entitlement||!Number.isSafeInteger(userId)||userId<=0)return false;
    const cert=data?.signed_certificate;
    if(data?.status!=='ok'||data.premium_active!==true||cert?.format!=='slx-ed25519-v1')return false;
    if(!Array.isArray(data.entitlements)||!data.entitlements.includes(entitlement))return false;
    if(!Number.isSafeInteger(Number(data.user?.id))||Number(data.user.id)<=0)return false;
    const keyBytes=decode(PUBLIC_KEY_B64),signature=decode(cert.signature),payload=decode(cert.payload);
    if(keyBytes.length!==32||signature.length!==64)return false;
    const publicKey=await crypto.subtle.importKey('raw',keyBytes,{name:'Ed25519'},false,['verify']);
    if(!await crypto.subtle.verify('Ed25519',publicKey,signature,payload))return false;
    const claim=JSON.parse(new TextDecoder().decode(payload));
    const t=Math.floor(now/1000);
    if(claim.issuer!=='sakalux.ro'||claim.v!==1||claim.subject!==Number(data.user.id)||claim.subject!==userId)return false;
    if(!Number.isInteger(claim.iat)||!Number.isInteger(claim.exp)||claim.exp<=t||claim.iat>t+30||claim.exp>claim.iat+300)return false;
    if(JSON.stringify(claim.entitlements)!==JSON.stringify(data.entitlements))return false;
    // The signed claim expires within five minutes; other clients must independently verify it.
    return true;
  }
  async function store(storage,apiKey,data,userId){
    if(!validKey(apiKey)||!data?.signed_certificate)return false;
    const entitlements=Array.isArray(data.entitlements)?data.entitlements:[];
    if(!entitlements.length||!await verify(data,{apiKey,entitlement:entitlements[0],userId}))return false;
    storage.setItem(STORAGE_KEY,JSON.stringify({keyHash:await hash(apiKey),data}));
    return true;
  }
  async function load(storage,apiKey,entitlement,userId){
    if(!validKey(apiKey))return null;
    try{
      const saved=JSON.parse(storage.getItem(STORAGE_KEY)||'null');
      if(saved?.keyHash!==await hash(apiKey))return null;
      return await verify(saved.data,{apiKey,entitlement,userId})?saved.data:null;
    }catch{return null}
  }
  root.SakaLuXSignedGrant=Object.freeze({verify,store,load,STORAGE_KEY});
})(typeof globalThis!=='undefined'?globalThis:this);
