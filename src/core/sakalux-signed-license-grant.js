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
    if(!validKey(apiKey)||typeof entitlement!=='string'||!entitlement)return false;
    const trustedIdentity=Number.isSafeInteger(userId)&&userId>0;
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
    if(claim.issuer!=='sakalux.ro'||claim.v!==1||claim.subject!==Number(data.user.id))return false;
    if(trustedIdentity&&claim.subject!==userId)return false;
    // An unsigned storage keyHash is only an index. Identity may be omitted only
    // when the server signed the current key's SHA-256 hash inside the claim.
    if(claim.api_key_hash!==undefined){if(claim.api_key_hash!==await hash(apiKey))return false;}
    else if(!trustedIdentity)return false;
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
      if(!await verify(saved.data,{apiKey,entitlement,userId}))return null;
      const claim=JSON.parse(new TextDecoder().decode(decode(saved.data.signed_certificate.payload)));
      return {...saved.data,verifiedGrantExpiresAt:claim.exp*1000};
    }catch{return null}
  }
  root.SakaLuXSignedGrant=Object.freeze({verify,store,load,STORAGE_KEY});
})(typeof globalThis!=='undefined'?globalThis:this);

/* Shared online lookup and cross-realm coordination. Storage never grants PRO:
 * only a verified, key-bound Ed25519 certificate can authorize a cached response.
 */
(function(root){
  'use strict';
  if(root.SakaLuXLicenseClient)return;
  const COOLDOWN='SakaLuX_LICENSE_RETRY_V1',FREE='SakaLuX_LICENSE_FREE_V1';
  const LEASE='SakaLuX_LICENSE_FLIGHT_V1',LOCK='SakaLuX:license-check:v1';
  let cached=null,flight=null,retryUntil=0,retryReason='unavailable';
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const remove=k=>{try{localStorage.removeItem(k)}catch{}};
  const hash=async k=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(k)))).map(n=>n.toString(16).padStart(2,'0')).join('');
  const expiry=d=>Date.parse(String(d?.expires_at||'').replace(' ','T').replace(/Z$/i,'')+'Z');
  function retryAt(){
    const saved=read(COOLDOWN),now=Date.now();
    if(Number.isFinite(saved?.until)&&saved.until>now&&saved.until<=now+900000&&saved.until>=retryUntil){
      retryUntil=saved.until;retryReason=saved.reason==='rate_limited'?'rate_limited':'unavailable';
    }
    return retryUntil;
  }
  function pause(seconds,reason){
    retryUntil=Math.max(retryAt(),Date.now()+seconds*1000);retryReason=reason;
    write(COOLDOWN,{until:retryUntil,reason});
  }
  function assertReady(){
    const remaining=Math.ceil((retryAt()-Date.now())/1000);
    if(remaining>0)throw Error(retryReason+'; retry in '+remaining+'s');
  }
  async function fromCache(apiKey){
    const now=Date.now();
    if(cached?.key===apiKey&&cached.until>now)return cached.data;
    const saved=read(root.SakaLuXSignedGrant.STORAGE_KEY);
    const ent=saved?.data?.entitlements?.[0];
    if(typeof ent==='string'){
      let grant=null;
      try{grant=await root.SakaLuXSignedGrant.load(localStorage,apiKey,ent)}catch{}
      if(grant&&expiry(grant)>now){
        cached={key:apiKey,until:Math.min(grant.verifiedGrantExpiresAt,expiry(grant)),data:grant};
        return grant;
      }
    }
    // A persisted FREE result can only deny access. It never grants entitlement.
    const free=read(FREE);
    if(Number.isFinite(free?.at)&&now>=free.at&&now-free.at<30000&&free.keyHash===await hash(apiKey))
      return {status:'ok',premium_active:false,entitlements:[],expires_at:null,user:free.user};
    return null;
  }
  function request(apiKey){
    return new Promise((resolve,reject)=>{
      if(typeof GM_xmlhttpRequest!=='function'){reject(Error('transport_unavailable'));return;}
      let settled=false;
      const timer=setTimeout(()=>fail(Error('timeout')),16000);
      const fail=e=>{if(settled)return;settled=true;clearTimeout(timer);reject(e)};
      const receive=r=>{
        if(settled)return;
        settled=true;clearTimeout(timer);
        try{
          let data;try{data=JSON.parse(String(r?.responseText??r?.response??'{}'))}catch{
            if(Number(r?.status)!==429)throw Error('invalid_license_response');
          }
          if(Number(r?.status)===429||data?.status==='rate_limited'){
            const header=String(r?.responseHeaders||'').match(/^retry-after:\s*(\d+)/im);
            const supplied=Number(data?.retry_after||header?.[1]);
            const seconds=Number.isFinite(supplied)&&supplied>0?Math.min(900,Math.ceil(supplied)):900;
            pause(seconds,'rate_limited');
            throw Error('rate_limited; retry in '+seconds+'s');
          }
          if(Number(r?.status)!==200||data?.status!=='ok')throw Error(data?.status||'HTTP '+r?.status);
          resolve(data);
        }catch(e){reject(e)}
      };
      try{
        const result=GM_xmlhttpRequest({method:'POST',url:'https://sakalux.ro/api/hub-premium-check.php',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          data:JSON.stringify({api_key:apiKey}),timeout:15000,
          onload:receive,onerror:()=>fail(Error('network_unavailable')),ontimeout:()=>fail(Error('timeout'))});
        // Torn PDA transports may use callbacks, a Promise, or both.
        if(result&&typeof result.then==='function')Promise.resolve(result).then(r=>{if(r!==undefined)receive(r)},e=>fail(e||Error('network_unavailable')));
      }catch(e){fail(e)}
    });
  }
  async function lookup(apiKey){
    const hit=await fromCache(apiKey);if(hit)return hit;
    assertReady();
    let data;
    try{data=await request(apiKey)}catch(e){
      if(retryAt()<=Date.now())pause(20,'unavailable');
      throw e;
    }
    if(typeof data.premium_active!=='boolean'||!Number.isSafeInteger(Number(data.user?.id))||Number(data.user.id)<=0||
       !Array.isArray(data.entitlements)||!data.entitlements.every(e=>typeof e==='string')||
       (data.premium_active&&!(expiry(data)>Date.now())))throw Error('invalid_license_response');
    let until=Date.now()+(data.premium_active?300000:30000);
    if(data.premium_active){
      until=Math.min(until,expiry(data));
      if(data.signed_certificate){
        // Legacy certificates still require the online, authenticated identity.
        if(!data.entitlements.length||!await root.SakaLuXSignedGrant.verify(data,{apiKey,entitlement:data.entitlements[0],userId:Number(data.user.id)}))
          throw Error('invalid_certificate_signature_or_identity');
        const claim=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data.signed_certificate.payload.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-data.signed_certificate.payload.length%4)%4)),c=>c.charCodeAt(0))));
        until=Math.min(until,claim.exp*1000);
        try{await root.SakaLuXSignedGrant.store(localStorage,apiKey,data,Number(data.user.id))}catch{}
      }
      remove(FREE);
    }else{
      remove(root.SakaLuXSignedGrant.STORAGE_KEY);
      write(FREE,{keyHash:await hash(apiKey),at:Date.now(),user:data.user});
    }
    data={...data,verifiedGrantExpiresAt:until};
    cached={key:apiKey,until,data};
    return data;
  }
  async function coordinated(apiKey){
    if(root.navigator?.locks?.request)return root.navigator.locks.request(LOCK,()=>lookup(apiKey));
    // Advisory fallback for older WebViews. The lease is never an authorization
    // proof, expires after crashes, and is rechecked after yielding to contenders.
    const token=Date.now()+':'+Math.random(),deadline=Date.now()+22000;
    while(Date.now()<deadline){
      const hit=await fromCache(apiKey);if(hit)return hit;
      assertReady();
      const old=read(LEASE),now=Date.now();
      if(!old||!Number.isFinite(old.until)||old.until<=now||old.until>now+20000){
        if(!write(LEASE,{token,until:now+20000}))return lookup(apiKey);
        await new Promise(r=>setTimeout(r,50));
        if(read(LEASE)?.token===token){
          try{return await lookup(apiKey)}finally{if(read(LEASE)?.token===token)remove(LEASE)}
        }
      }
      await new Promise(r=>setTimeout(r,100));
    }
    throw Error('license_check_busy');
  }
  function invalidate(){
    if(retryAt()>Date.now())return;
    cached=null;remove(root.SakaLuXSignedGrant.STORAGE_KEY);remove(FREE);
    // Explicit revalidation never clears the server's persisted cooldown.
  }
  async function check(apiKey,{force=false}={}){
    if(!/^[A-Za-z0-9]{16}$/.test(String(apiKey)))throw Error('invalid_key');
    if(flight?.key===apiKey)return flight.promise;
    if(force)invalidate();
    const promise=coordinated(apiKey),own={key:apiKey,promise};flight=own;
    try{return await promise}catch(e){
      if(retryAt()<=Date.now())pause(20,'unavailable');
      throw e;
    }finally{if(flight===own)flight=null}
  }
  root.SakaLuXLicenseClient=Object.freeze({check,retryAt,invalidate});
})(typeof globalThis!=='undefined'?globalThis:this);
