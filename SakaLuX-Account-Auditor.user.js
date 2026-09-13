// ==UserScript==
// @name         SakaLuX Account Auditor
// @namespace    sakalux.account.auditor
// @version      1.3.0
// @description  Private read-only Torn account auditor with rate-limit-safe API collection, split GitHub snapshots, and user-triggered capture of the currently visible Torn message.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      api.torn.com
// @connect      api.github.com
// @license      MIT
// @run-at       document-end
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
// ==/UserScript==

/* SakaLuX Standalone Dock Bootstrap — BEGIN */
(() => {
  'use strict';
  const HUB_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
  const INTERVAL = 12 * 60 * 60 * 1000;
  const DOCK_ID = 'sakalux-standalone-dock';
  const PROMPT_ID = 'sakalux-hub-install-prompt';
  const STYLE_ID = 'sakalux-standalone-dock-style';

  const hubInstalled = () => !!(window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button'));

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#${DOCK_ID}{position:fixed;right:10px;bottom:72px;z-index:2147483000;display:flex;flex-direction:column;gap:6px;max-width:min(260px,calc(100vw - 20px));padding:8px;background:rgba(13,17,23,.96);border:1px solid #3b4654;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.45);font:12px Arial,sans-serif}
#${DOCK_ID}[data-collapsed="1"] .slx-dock-items{display:none}
#${DOCK_ID} .slx-dock-head{display:flex;align-items:center;gap:6px}
#${DOCK_ID} .slx-dock-title{flex:1;color:#facc15;font-weight:900}
#${DOCK_ID} button,#${DOCK_ID} a{box-sizing:border-box!important;position:static!important;inset:auto!important;transform:none!important;float:none!important;margin:0!important;min-width:0!important;max-width:none!important;width:100%!important;height:auto!important;min-height:34px!important;padding:7px 9px!important;border-radius:8px!important;font:700 12px/1.2 Arial,sans-serif!important;white-space:normal!important}
#${DOCK_ID} .slx-dock-head button{width:auto!important;min-height:28px!important;padding:4px 7px!important}
#${DOCK_ID} .slx-dock-install{background:#8a5a00!important;border:1px solid #f59e0b!important;color:#fff!important;text-decoration:none!important;text-align:center!important;display:block!important}
#${DOCK_ID} .slx-dock-items{display:flex;flex-direction:column;gap:5px}
`;
    (document.head || document.documentElement).appendChild(s);
  }

  function ensureDock() {
    if (hubInstalled()) {
      document.getElementById(DOCK_ID)?.remove();
      document.getElementById(PROMPT_ID)?.remove();
      return null;
    }
    addStyle();
    let dock = document.getElementById(DOCK_ID);
    if (dock) return dock;
    dock = document.createElement('div');
    dock.id = DOCK_ID;
    dock.innerHTML = `<div class="slx-dock-head"><span class="slx-dock-title">SakaLuX Scripts</span><button type="button" data-slx-collapse>−</button></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${HUB_URL}">⬇ Install SakaLuX Hub</a>`;
    (document.body || document.documentElement).appendChild(dock);
    dock.querySelector('[data-slx-collapse]').addEventListener('click', () => {
      const collapsed = dock.dataset.collapsed === '1';
      dock.dataset.collapsed = collapsed ? '0' : '1';
      dock.querySelector('[data-slx-collapse]').textContent = collapsed ? '−' : '+';
    });
    return dock;
  }

  function eligible(el) {
    if (!el || el.nodeType !== 1 || el.closest('#' + DOCK_ID) || el.id === 'sakalux-hub-button') return false;
    if (!['BUTTON','A','DIV'].includes(el.tagName)) return false;
    const ident = `${el.id || ''} ${el.className || ''}`.toLowerCase();
    if (!/(slx|sakalux)/.test(ident)) return false;
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.width > 320 || r.height > 100) return false;
    if (/panel|modal|prompt|toast|style|overlay|dock/i.test(ident)) return false;
    return true;
  }

  function collectLaunchers() {
    const dock = ensureDock();
    if (!dock) return;
    const items = dock.querySelector('.slx-dock-items');
    document.querySelectorAll('button,a,div').forEach(el => {
      if (!eligible(el)) return;
      el.dataset.slxDocked = '1';
      items.appendChild(el);
    });
  }

  function maybePrompt() {
    if (hubInstalled() || document.getElementById(PROMPT_ID)) return;
    let last = 0;
    try { last = Number(localStorage.getItem(LAST_KEY) || 0); } catch {}
    if (last && Date.now() - last < INTERVAL) return;
    try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch {}
    const p = document.createElement('div');
    p.id = PROMPT_ID;
    p.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';
    p.innerHTML = `<div style="width:min(380px,100%);background:#111820;color:#fff;border:1px solid #465365;border-radius:14px;padding:18px;font:14px Arial,sans-serif;box-shadow:0 16px 50px #0008"><b style="font-size:17px">Install SakaLuX Script Hub?</b><div style="margin-top:8px;color:#cbd5e1;line-height:1.45">Keep all SakaLuX scripts together, with shared settings and controls.</div><div style="display:flex;gap:8px;margin-top:14px"><button type="button" data-slx-later style="flex:1;padding:10px;border-radius:8px;background:#202a36;color:#fff;border:1px solid #526174">Later</button><button type="button" data-slx-install style="flex:1;padding:10px;border-radius:8px;background:#8a5a00;color:#fff;border:1px solid #f59e0b;font-weight:900">Install Hub</button></div></div>`;
    (document.body || document.documentElement).appendChild(p);
    p.querySelector('[data-slx-later]').addEventListener('click', () => p.remove());
    p.querySelector('[data-slx-install]').addEventListener('click', () => { location.href = HUB_URL; });
  }

  function start() {
    if (hubInstalled()) return;
    ensureDock();
    collectLaunchers();
    setTimeout(maybePrompt, 1200);
    let timer = 0;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (hubInstalled()) {
          document.getElementById(DOCK_ID)?.remove();
          document.getElementById(PROMPT_ID)?.remove();
        } else collectLaunchers();
      }, 80);
    }).observe(document.documentElement, {childList:true, subtree:true});
    setInterval(() => { if (!hubInstalled()) { collectLaunchers(); maybePrompt(); } }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
/* SakaLuX Standalone Dock Bootstrap — END */



(function () {
    'use strict';

    const VERSION = '1.3.0';
    const NAME = 'SakaLuX Account Auditor';
    const PDA_KEY = '###PDA-APIKEY###';
    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 12 * 60 * 60 * 1000;
    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';
    const STORAGE = {
        apiKey:'SakaLuX_AUDITOR_TORN_API_KEY',
        githubToken:'SakaLuX_AUDITOR_GITHUB_TOKEN',
        settings:'SakaLuX_AUDITOR_SETTINGS_V3',
        lastSync:'SakaLuX_AUDITOR_LAST_SYNC_V3',
        captures:'SakaLuX_AUDITOR_MESSAGE_CAPTURES_V1'
    };
    const DEFAULT_SETTINGS = {
        repo:'SakaLuX/SakaLuX-Torn-Account-Data', branch:'main', path:'SakaLuX-Account-Snapshot.json',
        autoSync:false, autoSyncMinutes:30, showButton:true, includePrivateData:true, maxPrivatePages:200,
        splitSnapshots:true, includeCapturedMessages:true
    };
    const V2_ENDPOINTS = [
        'profile','bars','cooldowns','travel','education','jobpoints','merits','refills','notifications','money',
        'stocks','properties','discord','weaponexp','workstats','skills','battlestats','networth','display','icons',
        'criminalrecord','bazaar','crimes','hof','ammo','attacksfull','bounties','calendar','casino','competition',
        'enlistedcars','equipment','faction','forumfeed','forumfriends','forumposts','forumsubscribedthreads',
        'forumthreads','gym','honors','itemmarket','itemmods','job','jobranks','medals','missions','organizedcrime',
        'organizedcrimes','perks','property','races','racingrecords','reports','revivesfull','trade','trades','virus','snapshot'
    ];
    // newmessages/newevents are subsets of messages/events and are intentionally omitted to prevent duplicate records.
    const V2_PRIVATE_ENDPOINTS = ['messages','events'];
    const CONTACT_LISTS = ['Friends','Enemies','Targets'];
    const INVENTORY_CATEGORIES = [
        'Collectible','Clothing','Other','Tool','Melee','Defensive','Material','Car','Primary','Secondary','Book',
        'Special','Supply Pack','Temporary','Enhancer','Artifact','Flower','Booster','Medical','Candy','Jewelry',
        'Alcohol','Plushie','Drug','Energy Drink'
    ];

    let settings = Object.assign({}, DEFAULT_SETTINGS, loadJson(STORAGE.settings, {}));
    let busy = false, autoTimer = null, lastStatus = '';

    function rawGet(key){
        try { if (typeof GM_getValue === 'function') { const v=GM_getValue(key,''); if (typeof v==='string' && v) return v; } } catch(_){}
        try { return localStorage.getItem(key)||''; } catch(_) { return ''; }
    }
    function rawSet(key,value){ const text=String(value??''); try{if(typeof GM_setValue==='function')GM_setValue(key,text);}catch(_){} try{localStorage.removeItem(key);}catch(_){} }
    function loadJson(key,fallback){ try{const raw=rawGet(key); return raw?JSON.parse(raw):fallback;}catch(_){return fallback;} }
    function saveJson(key,value){ try{rawSet(key,JSON.stringify(value));}catch(_){} }
    function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');}
    function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
    function getTornApiKey(){return PDA_KEY && PDA_KEY!=='###PDA-APIKEY###' ? PDA_KEY : rawGet(STORAGE.apiKey);}

    const RATE={minGapMs:1100,retryDelays:[3000,6000,12000],lastAt:0};
    async function rateGate(){const wait=Math.max(0,RATE.minGapMs-(Date.now()-RATE.lastAt));if(wait)await sleep(wait);RATE.lastAt=Date.now();}

    function request(url,options={}){
        return new Promise((resolve,reject)=>{
            const method=options.method||'GET', headers=options.headers||{}, body=options.body;
            if(method==='GET' && typeof window.PDA_httpGet==='function' && url.includes('api.torn.com')){
                window.PDA_httpGet(url,headers).then(r=>{try{const raw=r?.responseText??r?.body??r?.data??r;resolve({status:200,text:typeof raw==='string'?raw:JSON.stringify(raw)});}catch(e){reject(e);}}).catch(reject);return;
            }
            if(typeof GM_xmlhttpRequest==='function'){
                GM_xmlhttpRequest({method,url,headers,data:body,timeout:30000,onload:r=>resolve({status:r.status,text:r.responseText,headers:r.responseHeaders}),onerror:()=>reject(new Error('Network error')),ontimeout:()=>reject(new Error('Request timeout'))});return;
            }
            fetch(url,{method,headers,body}).then(async r=>resolve({status:r.status,text:await r.text()})).catch(reject);
        });
    }
    async function apiJson(url){
        try{const r=await request(url);let data;try{data=JSON.parse(r.text||'{}');}catch(_){return{ok:false,error:'Invalid JSON',httpStatus:r.status};}
            if(data?.error)return{ok:false,error:data.error.error||data.error.message||'Torn API error',code:data.error.code??null,httpStatus:r.status};
            if(r.status<200||r.status>=300)return{ok:false,error:'HTTP '+r.status,httpStatus:r.status,data};
            return{ok:true,data,httpStatus:r.status};
        }catch(e){return{ok:false,error:String(e?.message||e)};}
    }
    async function apiJsonWithRetry(url,retries=RATE.retryDelays.length){
        for(let attempt=0;;attempt++){
            await rateGate(); const r=await apiJson(url);
            if(r.ok || r.code!==5 || attempt>=retries) return r;
            const delay=RATE.retryDelays[Math.min(attempt,RATE.retryDelays.length-1)]; setStatus('Torn rate limit · retry in '+Math.ceil(delay/1000)+'s…'); await sleep(delay);
        }
    }
    function withKey(url,key){const sep=url.includes('?')?'&':'?';return /[?&]key=/.test(url)?url:url+sep+'key='+encodeURIComponent(key);}
    async function tornV1(selection,key){return apiJsonWithRetry('https://api.torn.com/user/?selections='+encodeURIComponent(selection)+'&key='+encodeURIComponent(key));}
    async function tornV2(endpoint,key,query='',absoluteUrl=''){let url=absoluteUrl||('https://api.torn.com/v2/user/'+encodeURIComponent(endpoint)+(query?(query.startsWith('?')?query:'?'+query):''));return apiJsonWithRetry(withKey(url,key));}
    async function keyInfo(key){return apiJsonWithRetry(withKey('https://api.torn.com/v2/key/info',key));}

    function sanitizeDeep(value,depth=0){
        if(depth>40)return'[depth-limit]'; if(Array.isArray(value))return value.map(v=>sanitizeDeep(v,depth+1)); if(!value||typeof value!=='object')return value;
        const out={}; for(const[k,v]of Object.entries(value)){const kk=String(k).toLowerCase();if(['key','apikey','api_key','token','authorization','cookie','cookies','session','sessionid','password','secret'].includes(kk))continue;out[k]=sanitizeDeep(v,depth+1);}return out;
    }
    function nextLink(data){const n=data?._metadata?.links?.next??data?.metadata?.links?.next??data?._metadata?.next??null;return typeof n==='string'&&n?n:null;}
    async function collectPagedV2(endpoint,key,query='',maxPages=200){
        const pages=[];let url='';const seenUrls=new Set();const limit=Math.max(1,Math.min(500,Number(maxPages)||200));
        for(let page=0;page<limit;page++){
            if(url&&seenUrls.has(url))break;
            if(url)seenUrls.add(url);
            const result=await tornV2(endpoint,key,url?'':query,url);
            if(!result.ok)return{ok:false,error:result.error,code:result.code??null,httpStatus:result.httpStatus??null,pages};
            const clean=sanitizeDeep(result.data);pages.push(clean);
            const next=nextLink(clean);if(!next)break;
            url=next.startsWith('http')?next:'https://api.torn.com'+next;
        }
        const last=pages[pages.length-1];const truncated=Boolean(last&&nextLink(last)&&pages.length>=limit);
        return{ok:true,data:pages.length===1?pages[0]:{pages,pageCount:pages.length,truncated},pages,truncated};
    }
    async function collectContacts(key){const out={},errors={};for(const cat of CONTACT_LISTS){const r=await collectPagedV2('list',key,'cat='+encodeURIComponent(cat)+'&limit=50',200);if(r.ok)out[cat.toLowerCase()]=r.data;else errors[cat]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};}return{data:out,errors};}
    async function collectInventory(key){const categories={},errors={};let itemCount=0;for(const cat of INVENTORY_CATEGORIES){const r=await tornV2('inventory',key,'cat='+encodeURIComponent(cat)+'&limit=250&offset=0');if(r.ok){const clean=sanitizeDeep(r.data);categories[cat]=clean;const items=Array.isArray(clean?.inventory)?clean.inventory:[];itemCount+=items.length;}else errors[cat]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};}return{data:{categories,itemCount,categoryCount:Object.keys(categories).length},errors};}

    async function collectSnapshot(){
        const key=getTornApiKey(); if(!key)throw new Error('Torn API key missing. Open AUDIT settings and add a key, or use Torn PDA API injection.');
        const data={keyInfo:null,v2:{},special:{},private:{}},errors={},unavailable={};let requested=0,successful=0;
        requested++;setStatus('Checking API key…');const ki=await keyInfo(key);if(ki.ok){data.keyInfo=sanitizeDeep(ki.data);successful++;}else errors['key:info']={error:ki.error,code:ki.code??null,httpStatus:ki.httpStatus??null};
        if(settings.includePrivateData){
            const privatePages=Math.max(1,Math.min(500,Number(settings.maxPrivatePages)||200));
            for(let i=0;i<V2_PRIVATE_ENDPOINTS.length;i++){
                const endpoint=V2_PRIVATE_ENDPOINTS[i];requested++;setStatus('PRIVATE '+endpoint+' '+(i+1)+'/'+V2_PRIVATE_ENDPOINTS.length);
                const q=endpoint==='events'?'limit=100':'limit=100&sort=desc';
                const r=await collectPagedV2(endpoint,key,q,privatePages);
                if(r.ok){data.private[endpoint]=r.data;successful++;}
                else{if(r.pages?.length)data.private[endpoint]={pages:r.pages,pageCount:r.pages.length,partial:true};errors['private:'+endpoint]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};}
            }
            requested++;setStatus('PRIVATE logs');const logs=await collectPagedV2('log',key,'limit=100&sort=desc',privatePages);
            if(logs.ok){data.private.log=logs.data;successful++;}
            else if(logs.code===16)unavailable['private:log']={reason:'Torn requires a Full access API key for user/log.',code:16};
            else errors['private:log']={error:logs.error,code:logs.code??null,httpStatus:logs.httpStatus??null};
        }
        for(let i=0;i<V2_ENDPOINTS.length;i++){
            const endpoint=V2_ENDPOINTS[i];requested++;setStatus('v2 '+endpoint+' '+(i+1)+'/'+V2_ENDPOINTS.length);
            const r=await collectPagedV2(endpoint,key,'',200);
            if(r.ok){data.v2[endpoint]=r.data;successful++;}
            else errors['v2:'+endpoint]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};
        }
        requested++;const ps=await collectPagedV2('personalstats',key,'cat=all',200);if(ps.ok){data.special.personalstats=ps.data;successful++;}else errors['v2:personalstats']={error:ps.error,code:ps.code??null,httpStatus:ps.httpStatus??null};
        requested++;const contacts=await collectContacts(key);data.special.contacts=contacts.data;if(Object.keys(contacts.data).length)successful++;if(Object.keys(contacts.errors).length)errors['v2:list']=contacts.errors;
        requested++;const inv=await collectInventory(key);data.special.inventory=inv.data;if(inv.data.categoryCount)successful++;if(Object.keys(inv.errors).length)errors['v2:inventory']=inv.errors;
        const profile=data.v2.profile||{};
        return{schema:'sakalux-torn-account-snapshot-v4',generatedAt:new Date().toISOString(),generatedAtUnix:Date.now(),script:{name:NAME,version:VERSION,mode:'read-only'},privacy:{containsTornApiKey:false,containsGitHubToken:false,containsBrowserCookies:false,containsPassword:false,privateDataIncluded:Boolean(settings.includePrivateData),capturedMessageBodiesRequireExplicitUserAction:true,note:'Official Torn API data plus only message text explicitly captured by the user from a visible Torn message page.'},capabilities:{canonicalApi:'v2',legacyV1Duplicates:false,messageList:true,messageBodyViaOfficialApi:false,messageBodyViaUserCapture:true,logsRequireFullAccess:true,splitSnapshots:Boolean(settings.splitSnapshots)},account:{playerId:profile.player_id??profile.playerID??profile.user_id??profile.id??null,name:profile.name??null,level:profile.level??null,rank:profile.rank??null,status:profile.status??null,faction:profile.faction??null,job:profile.job??null,lastAction:profile.last_action??profile.lastAction??null,age:profile.age??null},coverage:{requested,successful,failed:Object.keys(errors).length,unavailable:Object.keys(unavailable).length,v2Endpoints:V2_ENDPOINTS.slice(),privateEndpoints:settings.includePrivateData?V2_PRIVATE_ENDPOINTS.concat(['log']):[],privateDataEnabled:Boolean(settings.includePrivateData),deduplication:'v2 canonical; no v1 mirror; no newmessages/newevents subsets; attacksfull/revivesfull replace reduced variants'},data,errors,unavailable};
    }

    function parseRepo(){const m=String(settings.repo||'').trim().match(/^([^/\s]+)\/([^/\s]+)$/);if(!m)throw new Error('GitHub repo must be owner/repository.');return{owner:m[1],repo:m[2]};}
    function utf8ToBase64(text){const bytes=new TextEncoder().encode(text);let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}
    async function githubJson(url,options={}){const token=rawGet(STORAGE.githubToken);if(!token)throw new Error('GitHub token missing.');const headers={'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};const r=await request(url,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined});let data={};try{data=JSON.parse(r.text||'{}');}catch(_){}if(r.status<200||r.status>=300)throw new Error('GitHub '+r.status+': '+(data?.message||'request failed'));return data;}
    async function syncJsonFile(path,value,message){
        const{owner,repo}=parseRepo(),branch=String(settings.branch||'main').trim()||'main';path=String(path).replace(/^\/+/, '');
        const api='https://api.github.com/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo)+'/contents/'+path.split('/').map(encodeURIComponent).join('/');
        const json=JSON.stringify(value,null,2)+'\n', encoded=utf8ToBase64(json);let current=null;
        try{current=await githubJson(api+'?ref='+encodeURIComponent(branch));}catch(e){if(!/GitHub 404:/.test(String(e?.message||e)))throw e;}
        if(current?.content&&String(current.content).replace(/\s/g,'')===encoded)return{unchanged:true,sha:current.sha,commit:null};
        const body={message,content:encoded,branch};if(current?.sha)body.sha=current.sha;
        return githubJson(api,{method:'PUT',body});
    }

    function pickFields(source,names,assigned){const out={};for(const name of names){if(Object.prototype.hasOwnProperty.call(source,name)){out[name]=source[name];assigned.add(name);}}return out;}
    function buildSplitSnapshots(snapshot){
        const v2=snapshot.data?.v2||{},sp=snapshot.data?.special||{},pv=snapshot.data?.private||{},assigned=new Set(),captures=settings.includeCapturedMessages?loadJson(STORAGE.captures,[]):[];
        const parts={};
        parts['summary.json']=pickFields(v2,['profile','bars','cooldowns','travel','education','jobpoints','merits','refills','notifications','discord','display','icons','calendar','competition','faction','gym','honors','job','jobranks','medals','perks','virus','hof'],assigned);
        parts['finance.json']=pickFields(v2,['money','networth','stocks','properties','property','bazaar','itemmarket','trade','trades'],assigned);
        parts['combat.json']=pickFields(v2,['battlestats','attacksfull','ammo','bounties','equipment','itemmods','weaponexp','workstats','skills','revivesfull'],assigned);
        parts['crimes.json']={...pickFields(v2,['criminalrecord','crimes','missions','organizedcrime','organizedcrimes'],assigned),personalstats:sp.personalstats||null};
        parts['racing.json']=pickFields(v2,['enlistedcars','races','racingrecords'],assigned);
        parts['forum.json']=pickFields(v2,['forumfeed','forumfriends','forumposts','forumsubscribedthreads','forumthreads'],assigned);
        parts['activity.json']=pickFields(v2,['reports','snapshot'],assigned);
        parts['inventory.json']={inventory:sp.inventory||null};
        parts['contacts.json']={contacts:sp.contacts||null};
        parts['messages.json']={api:pv.messages||null,captured:captures};
        parts['events.json']={events:pv.events||null};
        parts['logs.json']={logs:pv.log||null};
        const other={};for(const[k,v]of Object.entries(v2))if(!assigned.has(k))other[k]=v;if(Object.keys(other).length)parts['other.json']=other;
        const manifest={schema:'sakalux-account-split-v2',generatedAt:snapshot.generatedAt,script:snapshot.script,account:snapshot.account,privacy:snapshot.privacy,capabilities:snapshot.capabilities,coverage:snapshot.coverage,errors:snapshot.errors,unavailable:snapshot.unavailable,files:Object.keys(parts)};
        return{'manifest.json':manifest,...parts};
    }
    async function syncSnapshot(snapshot){
        const fullPath=String(settings.path||'SakaLuX-Account-Snapshot.json').replace(/^\/+/, '');const files=[];let primary=null;
        if(settings.splitSnapshots){
            const parts=buildSplitSnapshots(snapshot);
            for(const[path,value]of Object.entries(parts)){setStatus('Uploading '+path+'…');await syncJsonFile(path,value,'Sync Torn split snapshot '+path+' '+new Date().toISOString());files.push(path);}
            const pointer={schema:'sakalux-account-split-pointer-v1',generatedAt:snapshot.generatedAt,manifest:'manifest.json',note:'Data is split across the manifest files to avoid duplicating the full account payload.'};
            setStatus('Updating snapshot pointer…');primary=await syncJsonFile(fullPath,pointer,'Update Torn account snapshot pointer '+new Date().toISOString());
        }else{
            setStatus('Uploading full snapshot…');primary=await syncJsonFile(fullPath,snapshot,'Sync Torn account snapshot '+new Date().toISOString());
        }
        const meta={at:Date.now(),atIso:new Date().toISOString(),repo:settings.repo,branch:settings.branch,path:fullPath,splitFiles:files,commitSha:primary?.commit?.sha||null};saveJson(STORAGE.lastSync,meta);return meta;
    }

    function isVisible(el){if(!el||el.closest('#sl-aa-overlay'))return false;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>20&&r.height>20&&s.display!=='none'&&s.visibility!=='hidden';}
    function cleanText(text){return String(text||'').replace(/\u00a0/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
    function simpleHash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
    function captureCurrentMessage(){
        if(!/message|mail/i.test(location.href)){setStatus('Open a Torn message/conversation first.');return false;}
        const selected=cleanText(window.getSelection?.().toString()||'');let text=selected;
        if(text.length<10){
            const selectors=['[class*="messageBody"]','[class*="message-body"]','[class*="messageContent"]','[class*="message-content"]','[class*="conversation"] [class*="message"]','[class*="mail"] [class*="message"]','[data-testid*="message"]'];
            const candidates=[];for(const sel of selectors){for(const el of document.querySelectorAll(sel)){if(!isVisible(el))continue;const t=cleanText(el.innerText||el.textContent||'');if(t.length>=10&&t.length<=50000)candidates.push({el,text:t,score:t.length});}}
            candidates.sort((a,b)=>b.score-a.score);if(candidates.length)text=candidates[0].text;
        }
        if(text.length<10){setStatus('Could not detect the visible message. Select its text and press CAPTURE again.');return false;}
        text=text.slice(0,50000);const topic=cleanText(document.querySelector('h1,h2,h3,[class*="subject"],[class*="topic"]')?.textContent||document.title||'').slice(0,500);
        const url=location.origin+location.pathname+location.search;const id=simpleHash(url+'\n'+text);const list=loadJson(STORAGE.captures,[]);if(list.some(x=>x.id===id)){setStatus('Message already captured.');return true;}
        list.unshift({id,capturedAt:new Date().toISOString(),url,topic,text});saveJson(STORAGE.captures,list.slice(0,200));setStatus('Captured current visible message · '+text.length+' chars');updatePanelStatus();return true;
    }
    function clearCapturedMessages(){saveJson(STORAGE.captures,[]);setStatus('Captured messages cleared.');updatePanelStatus();}

    async function syncNow(){if(busy)return false;busy=true;try{setStatus('Collecting read-only account snapshot…');const snapshot=await collectSnapshot();const result=await syncSnapshot(snapshot);setStatus('SYNC OK · '+new Date(result.at).toLocaleTimeString()+' · '+(result.splitFiles?.length||0)+' split files');updatePanelStatus();return true;}catch(e){setStatus('ERROR · '+String(e?.message||e));updatePanelStatus();return false;}finally{busy=false;}}
    function setStatus(text){lastStatus=String(text||'');const el=document.getElementById('sl-aa-status');if(el)el.textContent=lastStatus;const b=document.getElementById('sl-aa-button');if(b)b.textContent=busy?'☠︎ SYNC…':'☠︎ AUDIT';}
    function lastSyncText(){const s=loadJson(STORAGE.lastSync,null);if(!s?.at)return'Never';try{return new Date(s.at).toLocaleString();}catch(_){return'Unknown';}}
    function updatePanelStatus(){const el=document.getElementById('sl-aa-last-sync');if(el)el.textContent=lastSyncText();const c=document.getElementById('sl-aa-captures');if(c)c.textContent=String(loadJson(STORAGE.captures,[]).length);setStatus(lastStatus);}

    function isHubInstalled(){return Boolean(window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button'));}
    function rememberHubPrompt(){try{localStorage.setItem(HUB_PROMPT_STORAGE,String(Date.now()));}catch(_){}}
    function shouldOfferHub(){
        if(isHubInstalled())return false;
        try{const last=Number(localStorage.getItem(HUB_PROMPT_STORAGE)||0);return !last||Date.now()-last>=HUB_PROMPT_INTERVAL;}catch(_){return true;}
    }
    function closeHubPrompt(remember=true){if(remember)rememberHubPrompt();document.getElementById(HUB_PROMPT_ID)?.remove();}
    function showHubInstallPrompt(){
        if(!shouldOfferHub()||document.getElementById(HUB_PROMPT_ID))return;
        const overlay=document.createElement('div');overlay.id=HUB_PROMPT_ID;overlay.style.cssText='position:fixed;z-index:2147483647;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;font-family:Arial,sans-serif;';
        overlay.innerHTML='<div style="width:min(420px,94vw);background:#101318;color:#fff;border:1px solid #303640;border-radius:16px;padding:18px;box-sizing:border-box;box-shadow:0 15px 50px rgba(0,0,0,.65);"><div style="font-size:19px;font-weight:900;margin-bottom:8px;">☠️ SakaLuX Script Hub</div><div style="font-size:12px;line-height:1.5;color:#c9d1d9;margin-bottom:14px;">This script is part of the SakaLuX suite. Install the main Script Hub for add-on management, quick access and update checking?</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><button id="sl-aa-hub-later" style="border:0;border-radius:9px;padding:10px;font-weight:900;color:#fff;background:#374151;">LATER</button><button id="sl-aa-hub-install" style="border:0;border-radius:9px;padding:10px;font-weight:900;color:#fff;background:#16a34a;">INSTALL HUB</button></div></div>';
        document.body.appendChild(overlay);
        overlay.querySelector('#sl-aa-hub-later').onclick=()=>closeHubPrompt(true);
        overlay.querySelector('#sl-aa-hub-install').onclick=()=>{rememberHubPrompt();location.href=HUB_INSTALL_URL;};
    }

    function openSettings(){
        document.getElementById('sl-aa-overlay')?.remove();const overlay=document.createElement('div');overlay.id='sl-aa-overlay';overlay.innerHTML='<div id="sl-aa-panel">'+
        '<div class="sl-aa-head"><div><b>☠︎ SakaLuX Account Auditor</b><small>v'+VERSION+' · PRIVATE / READ-ONLY</small></div><button id="sl-aa-close">×</button></div>'+
        '<div class="sl-aa-warning"><b>Use a PRIVATE GitHub repository.</b> Split files can contain private Torn data. Passwords, cookies, session data and API/GitHub keys are never synced.</div>'+
        '<div class="sl-aa-note"><b>Messages:</b> Torn API supplies metadata only. To save body text, open a message yourself and press <b>CAPTURE CURRENT MESSAGE</b>. The script never opens private conversations automatically.</div>'+
        '<label>GitHub repository <input id="sl-aa-repo" value="'+esc(settings.repo)+'"></label><label>Branch <input id="sl-aa-branch" value="'+esc(settings.branch)+'"></label><label>Full snapshot path <input id="sl-aa-path" value="'+esc(settings.path)+'"></label>'+
        '<label>GitHub fine-grained token <input id="sl-aa-gh" type="password" placeholder="Stored in userscript storage"></label>'+(!getTornApiKey()?'<label>Torn API key <input id="sl-aa-torn" type="password" placeholder="Use the least access you need"></label>':'')+
        '<label class="sl-aa-check"><input id="sl-aa-private" type="checkbox" '+(settings.includePrivateData?'checked':'')+'> Include messages/events/logs API data</label><label class="sl-aa-check"><input id="sl-aa-split" type="checkbox" '+(settings.splitSnapshots?'checked':'')+'> Sync deduplicated split JSON files (recommended)</label><label class="sl-aa-check"><input id="sl-aa-captured" type="checkbox" '+(settings.includeCapturedMessages?'checked':'')+'> Include explicitly captured message bodies in messages.json</label><label class="sl-aa-check"><input id="sl-aa-auto" type="checkbox" '+(settings.autoSync?'checked':'')+'> Auto-sync while Torn is open</label>'+
        '<label>Auto-sync interval (minutes) <input id="sl-aa-minutes" type="number" min="15" max="1440" value="'+esc(settings.autoSyncMinutes)+'"></label><label>Max paged history pages <input id="sl-aa-pages" type="number" min="1" max="500" value="'+esc(settings.maxPrivatePages)+'"></label>'+
        '<div class="sl-aa-info">Captured messages: <strong id="sl-aa-captures">'+loadJson(STORAGE.captures,[]).length+'</strong> · Last sync: <strong id="sl-aa-last-sync">'+esc(lastSyncText())+'</strong></div><div id="sl-aa-status">'+esc(lastStatus||'Ready')+'</div>'+
        '<button id="sl-aa-capture">CAPTURE CURRENT MESSAGE</button><button id="sl-aa-clear">CLEAR CAPTURED MESSAGES</button><button id="sl-aa-save">SAVE SETTINGS</button><button id="sl-aa-sync">SYNC NOW</button></div>';
        document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};overlay.querySelector('#sl-aa-close').onclick=()=>overlay.remove();overlay.querySelector('#sl-aa-capture').onclick=()=>captureCurrentMessage();overlay.querySelector('#sl-aa-clear').onclick=()=>clearCapturedMessages();
        overlay.querySelector('#sl-aa-save').onclick=()=>{settings.repo=overlay.querySelector('#sl-aa-repo').value.trim();settings.branch=overlay.querySelector('#sl-aa-branch').value.trim()||'main';settings.path=overlay.querySelector('#sl-aa-path').value.trim()||'SakaLuX-Account-Snapshot.json';settings.includePrivateData=!!overlay.querySelector('#sl-aa-private').checked;settings.splitSnapshots=!!overlay.querySelector('#sl-aa-split').checked;settings.includeCapturedMessages=!!overlay.querySelector('#sl-aa-captured').checked;settings.autoSync=!!overlay.querySelector('#sl-aa-auto').checked;settings.autoSyncMinutes=Math.max(15,Math.min(1440,Number(overlay.querySelector('#sl-aa-minutes').value)||30));settings.maxPrivatePages=Math.max(1,Math.min(500,Number(overlay.querySelector('#sl-aa-pages').value)||200));const gh=overlay.querySelector('#sl-aa-gh').value.trim();if(gh)rawSet(STORAGE.githubToken,gh);const tk=overlay.querySelector('#sl-aa-torn')?.value.trim();if(tk)rawSet(STORAGE.apiKey,tk);saveJson(STORAGE.settings,settings);scheduleAutoSync();setStatus('Settings saved');updatePanelStatus();};overlay.querySelector('#sl-aa-sync').onclick=async()=>{await syncNow();};
    }
    function injectCss(){if(document.getElementById('sl-aa-style'))return;const s=document.createElement('style');s.id='sl-aa-style';s.textContent=`#sl-aa-button{position:fixed;right:10px;bottom:150px;z-index:2147483643;border:0;border-radius:999px;padding:9px 11px;background:#16191f;color:#fff;box-shadow:0 5px 18px rgba(0,0,0,.42);font:900 12px Arial}#sl-aa-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.78);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}#sl-aa-panel{width:min(640px,100%);max-height:92vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0}.sl-aa-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.sl-aa-head>div{display:flex;flex-direction:column;gap:3px}.sl-aa-head small{color:#8e96a3}#sl-aa-close{width:36px;height:36px;border:0;border-radius:9px;background:#272d35;color:#fff;font-size:20px}#sl-aa-panel label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}#sl-aa-panel label input{width:54%;box-sizing:border-box;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:7px;padding:8px}.sl-aa-check input{width:auto!important}.sl-aa-warning,.sl-aa-note{margin:8px 0;padding:10px;border-radius:9px;font-size:10px;line-height:1.45}.sl-aa-warning{background:#2a2010;border:1px solid #6a5420;color:#f2dc8c}.sl-aa-note{background:#122033;border:1px solid #29456b;color:#cfe3ff}.sl-aa-info,#sl-aa-status{margin:9px 0;padding:9px;background:#12171e;border:1px solid #29313a;border-radius:8px;font-size:10px}#sl-aa-panel>button{width:100%;min-height:42px;margin-top:7px;border:0;border-radius:9px;color:#fff;font-weight:900;background:#374151}#sl-aa-sync{background:#2563eb!important}#sl-aa-capture{background:#166534!important}#sl-aa-clear{background:#7f1d1d!important}@media(min-width:700px){#sl-aa-overlay{align-items:center}#sl-aa-panel{border-radius:18px}}`;document.head.appendChild(s);}
    function createButton(){if(!settings.showButton||document.getElementById('sl-aa-button'))return;const b=document.createElement('button');b.id='sl-aa-button';b.textContent='☠︎ AUDIT';b.onclick=openSettings;document.body.appendChild(b);}
    function scheduleAutoSync(){if(autoTimer){clearInterval(autoTimer);autoTimer=null;}if(!settings.autoSync)return;const mins=Math.max(15,Number(settings.autoSyncMinutes)||30);autoTimer=setInterval(()=>syncNow(),mins*60*1000);const last=loadJson(STORAGE.lastSync,null);if(!last?.at||Date.now()-Number(last.at)>=mins*60*1000)setTimeout(()=>syncNow(),5000);}

    window.SakaLuXAccountAuditor={id:'account-auditor',name:'Account Auditor',version:VERSION,open(){openSettings();return true;},async sync(){return syncNow();},async snapshot(){return collectSnapshot();},captureCurrentMessage(){return captureCurrentMessage();},capturedMessages(){return loadJson(STORAGE.captures,[]);},status(){return{version:VERSION,busy,lastStatus,lastSync:loadJson(STORAGE.lastSync,null),capturedMessages:loadJson(STORAGE.captures,[]).length,settings:{repo:settings.repo,branch:settings.branch,path:settings.path,autoSync:settings.autoSync,autoSyncMinutes:settings.autoSyncMinutes,includePrivateData:settings.includePrivateData,maxPrivatePages:settings.maxPrivatePages,splitSnapshots:settings.splitSnapshots,includeCapturedMessages:settings.includeCapturedMessages},hasTornKey:Boolean(getTornApiKey()),hasGitHubToken:Boolean(rawGet(STORAGE.githubToken))};}};
    window.dispatchEvent(new CustomEvent('SakaLuX:AccountAuditorReady',{detail:{version:VERSION}}));
    function init(){injectCss();createButton();scheduleAutoSync();setTimeout(showHubInstallPrompt,3500);console.log('['+NAME+' v'+VERSION+'] Loaded.');}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();


    /* SakaLuX Unified Control Center UI — visual layer only. */
    function installSakaLuXUnifiedTheme_account_auditor() {
        if (document.getElementById('sakalux-unified-theme-account-auditor')) return;
        const style = document.createElement('style');
        style.id = 'sakalux-unified-theme-account-auditor';
        style.textContent = `
:where([id^="sl-aa-"],[class*="sl-aa-"]){font-family:Inter,Arial,sans-serif!important;box-sizing:border-box}
:where([id^="sl-aa-"][id*="panel" i],[id^="sl-aa-"][id*="settings" i],[id^="sl-aa-"][id*="modal" i],[id^="sl-aa-"][id*="details" i]){background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%)!important;color:#e7edf5!important;border:1px solid #314154!important;border-radius:16px!important;box-shadow:0 18px 52px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.025)!important}
:where([class*="sl-aa-"][class*="header" i],[id^="sl-aa-"][id*="header" i]){background:linear-gradient(155deg,#1b2634,#111923)!important;border-color:#314154!important;color:#f8fafc!important}
:where([class*="sl-aa-"][class*="card" i],[class*="sl-aa-"][class*="row" i],[class*="sl-aa-"][class*="section" i],[class*="sl-aa-"][class*="note" i]){background:linear-gradient(145deg,#18212d,#131b25)!important;border-color:#2d3c4e!important;border-radius:12px!important;color:#dce6f0!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}
:where(button[id^="sl-aa-"],button[class*="sl-aa-"]){border:1px solid #3d78bf!important;border-radius:10px!important;background:linear-gradient(180deg,#377fcf,#275f9f)!important;color:#fff!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,filter .12s ease!important}
:where(button[id^="sl-aa-"],button[class*="sl-aa-"]):active{transform:translateY(1px)!important}
:where(input[id^="sl-aa-"],select[id^="sl-aa-"],textarea[id^="sl-aa-"],[id^="sl-aa-"] input,[id^="sl-aa-"] select,[id^="sl-aa-"] textarea){background:#0d141d!important;border:1px solid #3a4b61!important;border-radius:9px!important;color:#f4f7fb!important;outline:none!important}
:where(input[type="checkbox"][id^="sl-aa-"]){appearance:none!important;-webkit-appearance:none!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0 8px 0 0!important;vertical-align:middle!important;border:1px solid #546276!important;border-radius:999px!important;background:radial-gradient(circle at 10px 50%,#e7edf5 0 6px,transparent 6.5px),#465365!important;cursor:pointer!important;transition:.18s ease!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)!important}
:where(input[type="checkbox"][id^="sl-aa-"]):checked{border-color:#24754f!important;background:radial-gradient(circle at 27px 50%,#fff 0 6px,transparent 6.5px),#1eb36a!important}
:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="close" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="close" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="back" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="gray" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="secondary" i]{background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}
:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="clear" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="reset" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[id*="delete" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="danger" i],:where(button[id^="sl-aa-"],button[class*="sl-aa-"])[class*="red" i]{background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
@media(max-width:520px){:where([id^="sl-aa-"][id*="panel" i],[id^="sl-aa-"][id*="settings" i],[id^="sl-aa-"][id*="modal" i],[id^="sl-aa-"][id*="details" i]){border-radius:15px!important}:where(button[id^="sl-aa-"],button[class*="sl-aa-"]){min-height:34px!important}}
`;
        (document.head || document.documentElement).appendChild(style);
    }
    installSakaLuXUnifiedTheme_account_auditor();

})();
// SAKALUX_INLINE_PANEL_FOOTER_V2
;(() => {
    const FOOTER_ID='sakalux-inline-footer-account-auditor';
    const PANEL_SELECTOR='#sl-aa-panel';
    const PROFILE='https://www.torn.com/profiles.php?XID=2380374';
    function ensureInlineSakaLuXFooter(){
        const panel=document.querySelector(PANEL_SELECTOR);
        if(!panel)return;
        let footer=panel.querySelector('#'+FOOTER_ID);
        if(!footer){
            footer=document.createElement('div');
            footer.id=FOOTER_ID;
            footer.innerHTML='Made with ❤️ by <a href="'+PROFILE+'" target="_self" rel="noopener">SakaLuX [2380374]</a>';
            footer.style.cssText='flex:0 0 auto;width:100%;box-sizing:border-box;margin-top:10px;padding:10px 8px 9px;border-top:1px solid #2d3c4e;background:rgba(10,15,21,.72);color:#8e99a8;text-align:center;font:700 10px/1.25 Arial,sans-serif';
            const link=footer.querySelector('a');
            if(link)link.style.cssText='color:#d7a94a!important;text-decoration:none!important;font-weight:900!important';
        }
        if(panel.lastElementChild!==footer)panel.appendChild(footer);
    }
    const start=()=>{
        ensureInlineSakaLuXFooter();
        if(!document.body)return;
        const observer=new MutationObserver(ensureInlineSakaLuXFooter);
        observer.observe(document.body,{childList:true,subtree:true});
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

