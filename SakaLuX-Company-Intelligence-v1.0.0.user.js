// ==UserScript==
// @name         SakaLuX Company Intelligence
// @namespace    sakalux.torn.company
// @version      1.8.31
// @description  Employee + Director company intelligence for Torn. PDA-first, API-based, no automated gameplay actions.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @license      All Rights Reserved
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @connect      api.torn.com
// @run-at       document-end
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Company-Intelligence-v1.0.0.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Company-Intelligence-v1.0.0.user.js
// ==/UserScript==

/* Company Intelligence is Hub-managed. No standalone dock/launcher is created. */



/*
Copyright © 2026 SakaLuX [2380374]
All Rights Reserved.
Personal use and private modification are permitted.
Redistribution, republication, rebranding, sale, sublicensing, or public
publication of modified versions requires prior written permission.
This is an information/decision-support tool. It never automates company actions.
*/

(() => {
'use strict';

  // v1.8.20 authoritative TornPDA layout override.
  (() => {
    if (document.getElementById('sakalux-company-v1820-layout')) return;
    const st=document.createElement('style');
    st.id='sakalux-company-v1820-layout';
    st.textContent=`
#ci-root{align-items:flex-start!important;justify-content:center!important;overflow-y:auto!important;overflow-x:hidden!important;padding:0 0 88px!important;box-sizing:border-box!important;overscroll-behavior:contain!important}
#ci-root .ci-shell{display:block!important;margin:0 auto!important;max-height:none!important;height:auto!important;min-height:100%!important;overflow:visible!important;width:100%!important}
#ci-root .ci-body{overflow:visible!important;max-height:none!important}
#ci-root .ci-status{display:none!important}
#ci-root .ci-footer{display:flex!important;align-items:center!important;justify-content:center!important;position:sticky!important;bottom:76px!important;z-index:2147483640!important;min-height:44px!important;padding:11px 10px!important;box-sizing:border-box!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important;white-space:nowrap!important;overflow:visible!important;opacity:1!important;visibility:visible!important}
`;
    (document.head||document.documentElement).appendChild(st);
  })();

  // Shared SakaLuX performance + Hub-style UI foundation.
  (() => {
    const g = window;
    if (!g.SakaLuXPerf) {
      const timers = new Map();
      g.SakaLuXPerf = {
        debounce(key, fn, wait=220) {
          const old = timers.get(key); if (old) clearTimeout(old);
          const id = setTimeout(() => { timers.delete(key); fn(); }, Math.max(120, wait));
          timers.set(key,id); return id;
        },
        idle(fn, timeout=700) {
          if ('requestIdleCallback' in g) return g.requestIdleCallback(fn,{timeout});
          return setTimeout(fn,32);
        }
      };
    }
    if (!document.getElementById('sakalux-shared-hub-skin')) {
      const st=document.createElement('style');
      st.id='sakalux-shared-hub-skin';
      st.textContent=`
:root{--slx-bg:#0b1118;--slx-card:#111a24;--slx-card2:#172331;--slx-border:#34465b;--slx-border-soft:rgba(255,255,255,.09);--slx-text:#edf3fa;--slx-muted:#93a4b7;--slx-blue:#4f8fe8;--slx-gold:#dfbd61;--slx-green:#55d98a;--slx-red:#ff6b78;--slx-shadow:0 16px 40px rgba(0,0,0,.46)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) button,body [id^="slx-"] button,body [class^="sakalux-"] button,body [class*=" sakalux-"] button{border-radius:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;transition:border-color .15s ease,background .15s ease,transform .08s ease,opacity .15s ease}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) button:active,body [id^="slx-"] button:active{transform:scale(.985)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) input,body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) select,body [id^="slx-"] input,body [id^="slx-"] select{border-radius:10px;border-color:#3a4d63;background:#151f2b;color:var(--slx-text);font-family:Inter,Arial,sans-serif}
body [id*="sakalux"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="panel"],body [id*="sakalux"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="modal"],body [id*="slx"][id*="panel"],body [id*="slx"][id*="modal"],body #slx-stock-inline{font-family:Inter,Arial,sans-serif;color:var(--slx-text);border-color:var(--slx-border);box-shadow:var(--slx-shadow)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .header,body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .head,body [id^="slx-"] .header,body [id^="slx-"] .head{background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.18),transparent 42%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-color:var(--slx-border-soft)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .card,body [id^="slx-"] .card{border-color:var(--slx-border-soft);background:linear-gradient(180deg,rgba(19,28,39,.98),rgba(11,17,24,.98))}
@media(max-width:700px){body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) button,body [id^="slx-"] button{min-height:36px}body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) input,body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) select,body [id^="slx-"] input,body [id^="slx-"] select{min-height:36px}}
`;
      (document.head||document.documentElement).appendChild(st);
    }
  })();


const APP={name:'SakaLuX Company Intelligence',version:'1.8.31',base:'https://api.torn.com/v2',legacy:'https://api.torn.com',key:'sak_ci'};
const PROFILE_URL='https://www.torn.com/profiles.php?XID=2380374';
const API_CREATE_URL='https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX_Company_Intelligence&user=basic,profile,workstats,job&company=profile,employees,stock';
const HUB_API_STORAGE='SakaLuX_HUB_TORN_API_KEY';
const KEY={
 api:APP.key+':api', mode:APP.key+':mode', tab:APP.key+':tab', compact:APP.key+':compact', enabled:APP.key+':enabled',
 agreements:APP.key+':agreements', trains:APP.key+':trains',
 offers:APP.key+':offers', snapshots:APP.key+':snapshots', company:APP.key+':company',
 contracts:APP.key+':contracts', benchmarks:APP.key+':benchmarks', notes:APP.key+':notes',
 metrics:APP.key+':metrics', ownEffectiveness:APP.key+':own_effectiveness', positionReqs:APP.key+':position_requirements'
};
const S={open:false,loading:false,mode:'employee',tab:'overview',compact:true,enabled:true,data:{},errors:[],updated:0};

const STANDALONE_REG_ATTR='data-slx-standalone-registration';
function registerStandaloneEntry(){
 try{
  let m=document.querySelector(`[${STANDALONE_REG_ATTR}="company-intelligence"]`);
  if(!m){m=document.createElement('span');m.setAttribute(STANDALONE_REG_ATTR,'company-intelligence');m.hidden=true;(document.body||document.documentElement).appendChild(m)}
  Object.assign(m.dataset,{id:'company-intelligence',name:'Company',icon:'🏢',selector:'',fallback:'https://www.torn.com/joblist.php',version:APP.version});
 }catch{}
}

function normalizeStandaloneCompanyPlacement(){
 try{
  const dock=document.querySelector('#sakalux-standalone-dock');
  const box=dock?.querySelector('.slx-dock-items');
  if(!dock||!box) return;
  // Repair malformed/legacy docks that placed a module row outside the list.
  for(const row of [...dock.querySelectorAll(':scope > .slx-dock-row')]) box.appendChild(row);
  const rows=[...box.querySelectorAll(':scope > .slx-dock-row')];
  const company=rows.find(row=>String(row.querySelector('.slx-title')?.textContent||row.textContent||'').trim().toLowerCase()==='company');
  if(company&&company!==box.lastElementChild) box.appendChild(company);
 }catch{}
}

const $=(q,r=document)=>r.querySelector(q);
const $$=(q,r=document)=>[...r.querySelectorAll(q)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const fmt=v=>num(v).toLocaleString('en-US');
const money=v=>'$'+Math.round(num(v)).toLocaleString('en-US');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const now=()=>Date.now();
const days=ms=>ms/86400000;
const first=(o,paths,f=null)=>{
 for(const path of paths){let x=o,ok=true;for(const p of path.split('.')){if(x==null||!(p in Object(x))){ok=false;break;}x=x[p];}if(ok&&x!=null)return x}
 return f;
};
const get=(k,f=null)=>{try{if(typeof GM_getValue==='function')return GM_getValue(k,f)}catch{};try{let v=localStorage.getItem(k);return v==null?f:JSON.parse(v)}catch{return f}};
const set=(k,v)=>{try{if(typeof GM_setValue==='function')return GM_setValue(k,v)}catch{};try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const del=k=>{try{if(typeof GM_deleteValue==='function')return GM_deleteValue(k)}catch{};try{localStorage.removeItem(k)}catch{}};
function hubApiKey(){try{const k=String(window.SakaLuXScriptHub?.getApiKey?.()||'').trim();if(k)return k}catch{}try{if(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button'))return String(localStorage.getItem(HUB_API_STORAGE)||'').trim()}catch{}return''}
function apiKey(){return hubApiKey()||String(get(KEY.api,'')||'').trim()}
function apiSource(){return hubApiKey()?'SakaLuX Script Hub':String(get(KEY.api,'')||'').trim()?'Local standalone key':'No API key configured'}

function req(url){
 return new Promise((resolve,reject)=>{
  let finished=false;
  const done=(fn,value)=>{if(finished)return;finished=true;fn(value)};
  const parse=r=>{try{
   const raw=r?.responseText??r?.response;
   if(raw==null)throw new Error('Empty response received from TornPDA');
   const j=typeof raw==='string'?JSON.parse(raw):raw;
   if(j?.error){const e=new Error(j.error.error||j.error.message||'API error');e.code=num(j.error.code);done(reject,e)}else done(resolve,j);
  }catch(e){done(reject,e)}};
  const fallback=()=>fetch(url,{headers:{Accept:'application/json'}}).then(r=>r.text()).then(t=>parse({responseText:t})).catch(e=>done(reject,e));
  let request;
  try{request=GM_xmlhttpRequest({
   method:'GET',url,timeout:15000,headers:{Accept:'application/json'},
   onload:function(r){const response=r||this;if(response?.responseText!=null||response?.response!=null)parse(response);else fallback()},
   onerror:()=>done(reject,new Error('Network/API request failed')),
   ontimeout:()=>done(reject,new Error('API timeout'))
  })}catch(e){fallback();return}
  if(request&&typeof request.then==='function')request.then(parse).catch(e=>done(reject,e));
 });
}
async function api(path){
 const k=apiKey();
 if(!k)throw new Error('Add your Torn API key in API Access or SakaLuX Script Hub.');
 return req(`${APP.base}${path}${path.includes('?')?'&':'?'}key=${encodeURIComponent(k)}`);
}
async function legacyApi(section,id,selections){
 const k=apiKey();if(!k)throw new Error('Add your Torn API key in API Access or SakaLuX Script Hub.');
 return req(`${APP.legacy}/${section}/${id||''}?selections=${encodeURIComponent(selections)}&key=${encodeURIComponent(k)}`);
}
const unwrap=(o,...keys)=>{if(!o||typeof o!=='object')return o;for(const k of keys)if(o[k]!=null)return o[k];return o};
const basic=()=>unwrap(S.data.basic,'basic','profile')||{};
const work=()=>{
 const w=unwrap(S.data.workstats,'workstats','working_stats')||{};
 return {manual:num(first(w,['manual_labor','manual','man'],0)),intelligence:num(first(w,['intelligence','int'],0)),endurance:num(first(w,['endurance','end'],0))};
};
const job=()=>unwrap(S.data.job,'job')||{};
const legacyJob=()=>unwrap(S.data.legacyJob,'job')||{};
const userProfile=()=>unwrap(S.data.userProfile,'profile','user')||{};
const jobCompanyName=()=>S.employment?.known&&!S.employment.id?'No current company':first(job(),['company_name','company.name','job.company_name','job.company.name'],first(userProfile(),['job.company_name','job.company.name'],'Unknown company'));
function companyIdFromPage(){
 for(const a of document.querySelectorAll('a[href*="company"]')){
  const h=String(a.getAttribute('href')||'');
  const m=h.match(/(?:companyprofile\.php|companies\.php)[^#]*(?:ID|companyID|company_id)=(\d+)/i);
  if(m&&num(m[1])>0)return num(m[1]);
 }
 const m=location.href.match(/(?:ID|companyID|company_id)=(\d+)/i);return m?num(m[1]):0;
}

function employmentFromResponse(response){
 if(!response||typeof response!=='object')return {known:false,id:0};
 const value=Object.prototype.hasOwnProperty.call(response,'job')?response.job:response;
 if(value===null)return {known:true,id:0,position:''};
 if(!value||typeof value!=='object')return {known:false,id:0};
 const paths=['company_id','companyId','company.id','company.company_id','company.companyId','employment.company_id','employment.company.id'];
 for(const path of paths){
  let current=value;let present=true;
  for(const part of path.split('.')){if(!current||typeof current!=='object'||!Object.prototype.hasOwnProperty.call(current,part)){present=false;break;}current=current[part];}
  if(present&&current!==undefined)return {known:true,id:Math.max(0,Number(current)||0),position:positionLabel(value.position||value.position_name||value.job)};
 }
 if(Object.prototype.hasOwnProperty.call(value,'company')&&value.company===null)return {known:true,id:0,position:positionLabel(value.position||value.position_name)};
 if(/^(unemployed|none)$/i.test(String(value.job||value.position||value.position_name||'')))return {known:true,id:0,position:''};
 return {known:false,id:0};
}
function clearCurrentCompany(){
 delete S.data.profile;delete S.data.employees;delete S.data.stock;
 del(KEY.company);del(KEY.ownEffectiveness);
}

function detectCompanyId(){
 if(S.employment?.known)return S.employment.id;
 const paths=['company_id','companyId','company.id','company.company_id','company.companyId','job.company_id','job.companyId','job.company.id','employment.company_id','employment.company.id'];
 for(const src of [profile(),S.data.profile,job(),legacyJob(),userProfile(),S.data.job,S.data.legacyJob,S.data.userProfile]){const id=num(first(src,['id','ID','company_id','companyId','company.id','company.ID','company.company_id','company.companyId','job.company_id','job.companyId','job.company.id','employment.company_id','employment.company.id'],0));if(id>0)return id}
 return companyIdFromPage();
}
const profile=()=>unwrap(S.data.profile,'company','profile')||{};
function employees(){
 const x=unwrap(S.data.employees,'employees');
 if(Array.isArray(x))return x;
 if(x&&typeof x==='object')return Object.entries(x).map(([id,v])=>({id:num(v?.id||id),...v}));
 return [];
}
function stocks(){
 const x=unwrap(S.data.stock,'stock');
 if(Array.isArray(x))return x;
 if(x&&typeof x==='object')return Object.entries(x).map(([name,v])=>({name,...v}));
 return [];
}
function positionLabel(v){
 if(v==null)return '';
 if(typeof v==='string'||typeof v==='number')return String(v).trim();
 if(typeof v==='object')return String(first(v,['name','position','title','label','role.name','role'],'')||'').trim();
 return '';
}
function normEmp(e){
 const ws=e.working_stats||e.work_stats||e.stats||{};
 const ef=e.effectiveness||e.efficiency||{};
 const last=first(e,['last_action.timestamp','last_action','last_action_timestamp'],null),posRaw=first(e,['position','position_name','role'],'');
 let lastTs=null;if(typeof last==='number')lastTs=last*(last<1e12?1000:1);else if(typeof last==='string'&&!isNaN(Date.parse(last)))lastTs=Date.parse(last);
 return {
  id:num(e.id||e.player_id||e.user_id),name:first(e,['name','player_name'],'Unknown'),
  position:positionLabel(posRaw),
  wage:num(first(e,['wage','salary'],0)),
  manual:num(first(ws,['manual_labor','manual','man'],first(e,['manual_labor'],0))),
  intelligence:num(first(ws,['intelligence','int'],first(e,['intelligence'],0))),
  endurance:num(first(ws,['endurance','end'],first(e,['endurance'],0))),
  effectiveness:typeof ef==='number'?ef:num(first(ef,['total','effectiveness','value'],first(e,['effectiveness_total','efficiency_total'],0))),
  addiction:num(first(ef,['addiction'],first(e,['addiction'],0))),
  inactivity:num(first(ef,['inactivity'],first(e,['inactivity'],0))),
  lastTs,raw:e
 };
}
function meta(){
 const p=profile();
 return {
  id:num(first(p,['id','company_id'],detectCompanyId())),
  name:first(p,['name','company_name'],first(job(),['company_name','company.name','job.company_name','job.company.name'],first(userProfile(),['job.company_name','job.company.name'],'Unknown company'))),
  type:first(p,['type.name','type','company_type','type_name'],first(job(),['company_type','company.type','type'],first(userProfile(),['job.company_type','job.company.type'],'Unknown'))),
  stars:num(first(p,['rating','stars','star_rating','company_rating','company_stars','company.rating','company.stars','company.star_rating'],first(job(),['rating','stars','star_rating','company_rating','company_stars','company.rating','company.stars','company.star_rating'],first(legacyJob(),['rating','stars','star_rating','company_rating','company_stars','company.rating','company.stars','company.star_rating'],first(userProfile(),['job.rating','job.stars','job.star_rating','job.company_rating','job.company_stars','job.company.rating','job.company.stars','job.company.star_rating'],0))))),
  age:num(first(p,['age','days_old','company_age','company.age','company.days_old','company.company_age'],first(job(),['company_age','company.age','age'],0))),
  popularity:num(first(p,['popularity','performance.popularity'],0)),
  efficiency:num(first(p,['efficiency','performance.efficiency'],0)),
  environment:num(first(p,['environment','performance.environment'],0)),
  trains:num(first(p,['trains_available','trains','training_available'],0)),
  dailyIncome:num(first(p,['daily_income','income.daily','income'],0)),
  weeklyIncome:num(first(p,['weekly_income','income.weekly'],0)),
  dailyCustomers:num(first(p,['daily_customers','customers.daily','customers_today'],0)),
  weeklyCustomers:num(first(p,['weekly_customers','customers.weekly','customers'],0)),
  maxEmployees:num(first(p,['employees_capacity','max_employees','employees_max'],0)),
  directorId:num(first(p,['director_id','director.id'],0))
 };
}
function me(){
 const id=num(first(basic(),['id','player_id'],0));
 return employees().map(normEmp).find(e=>e.id===id)||null;
}
function ownEmployee(){
 const id=num(first(basic(),['id','player_id'],0));
 return id?employees().map(normEmp).find(e=>e.id===id)||null:null;
}
function ownDaysInCompany(){
 const id=num(first(basic(),['id','player_id'],0)),raw=employees().find(e=>num(e?.id||e?.player_id||e?.user_id)===id)||{};
 let v=first(raw,['days_in_company','days','company_days','employment.days','company.days'],null);
 if(v==null)v=first(job(),['days_in_company','company_days','company.days_in_company','company.days','job.days_in_company','employment.days'],null);
 if(v==null)v=first(legacyJob(),['days_in_company','company_days','company.days_in_company','company.days','job.days_in_company','employment.days'],null);
 if(v==null)v=first(userProfile(),['days_in_company','company_days','job.days_in_company','job.company_days','job.company.days_in_company','employment.days'],null);
 if(v!=null&&Number.isFinite(Number(v))&&Number(v)>=0)return num(v);
 const txt=document.body?.innerText||'';
 const m=txt.match(/(?:Days\s+in\s+company|Company\s+days|Days\s+employed)\s*[:\-]?\s*(\d+)/i);
 return m?num(m[1]):0;
}
function cacheOwnEffectiveness(v){
 if(v!=null&&Number.isFinite(Number(v))&&Number(v)>=0){set(KEY.ownEffectiveness,Number(v));return Number(v)}
 return null;
}
function currentPosition(){
 if(S.employment?.known&&!S.employment.id)return S.employment.position||'Not currently employed';
 const cached=knownSnapshots().at(-1)?.myPosition,own=ownEmployee()?.position;
 const raw=own||first(job(),['position','position_name','company.position','company.position_name','job.position','job.position_name'],first(userProfile(),['job.position','job.position_name','position'],cached||''));
 return positionLabel(raw);
}
function currentEffectiveness(){
 if(S.employment?.known&&!S.employment.id)return null;
 const own=ownEmployee()?.effectiveness;if(Number.isFinite(own)&&own>=0)return cacheOwnEffectiveness(own);
 const value=first(job(),['effectiveness','company.effectiveness','job.effectiveness'],first(userProfile(),['job.effectiveness','company.effectiveness'],null));
 if(value!=null&&Number.isFinite(Number(value)))return cacheOwnEffectiveness(num(value));
 const nodes=[...document.querySelectorAll('[data-effectiveness],.effectiveness-value,p.effectiveness-value,[class*=effectiveness]')];
 for(const el of nodes){const raw=el?.getAttribute?.('data-effectiveness')||el?.textContent||'';const m=String(raw).match(/(?:effectiveness[^0-9-]*)?(-?\d+(?:\.\d+)?)/i);if(m)return cacheOwnEffectiveness(num(m[1]));}
 const body=(document.body?.innerText||'').match(/Effectiveness\s*[:+-]?\s*(\d+(?:\.\d+)?)/i);if(body)return cacheOwnEffectiveness(num(body[1]));
 const cached=num(get(KEY.ownEffectiveness,-1),-1);return cached>=0?cached:null;
}
function isDirector(){
 const id=num(first(basic(),['id','player_id'],0)),m=meta();
 return (id&&m.directorId&&id===m.directorId)||String(first(job(),['position','position_name','company.position','company.position_name'],'')).toLowerCase().includes('director');
}
const PUB_POSITIONS=[
 {name:'Bartender',primary:{stat:'endurance',value:3000},secondary:{stat:'manual',value:1500}},
 {name:'Bouncer',primary:{stat:'manual',value:6000},secondary:{stat:'endurance',value:3000}},
 {name:'Waiter',primary:{stat:'endurance',value:3000},secondary:{stat:'manual',value:1500}},
 {name:'Cleaner',primary:{stat:'manual',value:1500},secondary:{stat:'endurance',value:750}},
 {name:'Manager',primary:{stat:'endurance',value:6000},secondary:{stat:'intelligence',value:3000}},
 {name:'Bookkeeper',primary:{stat:'endurance',value:4500},secondary:{stat:'intelligence',value:2250}},
 {name:'Trainer',primary:{stat:'intelligence',value:9000},secondary:{stat:'endurance',value:4500}},
 {name:'Promoter',primary:{stat:'intelligence',value:6000},secondary:{stat:'endurance',value:3000}}
];
function statKey(label){const t=String(label||'').toUpperCase();if(/\bMAN\b|MANUAL/.test(t))return'manual';if(/\bINT\b|INTELLIGENCE/.test(t))return'intelligence';if(/\bEND\b|ENDURANCE/.test(t))return'endurance';return''}
function reqObj(primary,secondary){const r={manual:0,intelligence:0,endurance:0};for(const x of [primary,secondary])if(x?.stat&&x?.value)r[x.stat]=num(x.value);return r}
function seededCompanyPositions(){const type=String(meta().type||'').toLowerCase();return type.includes('pub')?PUB_POSITIONS:[]}
function positionReqCache(){const all=get(KEY.positionReqs,{})||{},key=String(detectCompanyId()||meta().name||'unknown');return {all,key,rows:all[key]||{}}}
function savePositionReqRows(rows){if(!rows?.length)return;const c=positionReqCache();for(const row of rows){if(!row?.name)continue;const old=c.rows[row.name]||{};c.rows[row.name]={...old,...row,primary:row.primary||old.primary,secondary:row.secondary||old.secondary,updated:now()}}c.all[c.key]=c.rows;set(KEY.positionReqs,c.all)}
function scrapePositionRequirements(){
 if(document.hidden||!/(?:companies|joblist)\.php/i.test(location.pathname))return [];
 const text=document.body?.innerText||'';if(!/Company Positions/i.test(text))return [];
 const isPrimary=/Primary Stat/i.test(text)&&!/Secondary Stat/i.test(text),isSecondary=/Secondary Stat/i.test(text)&&!/Primary Stat/i.test(text);
 const mode=isPrimary?'primary':isSecondary?'secondary':null;if(!mode)return [];
 const names=['Bartender','Bouncer','Waiter','Cleaner','Manager','Bookkeeper','Trainer','Promoter'];
 const out=[];
 for(const name of names){
  const nodes=[...document.querySelectorAll('tr,li,div')].filter(el=>{const t=(el.innerText||'').trim();return t.startsWith(name)&&/\b(?:MAN|INT|END)\b/i.test(t)&&/[\d,]+/.test(t)});
  const el=nodes.sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length)[0];if(!el)continue;
  const t=(el.innerText||'').replace(/\s+/g,' ').trim(),m=t.match(/([\d,]+)\s*(MAN|INT|END)\b/i);if(!m)continue;
  out.push({name,[mode]:{stat:statKey(m[2]),value:num(m[1].replace(/,/g,''))}})
 }
 savePositionReqRows(out);return out
}
function cachedOfficialPositions(){
 scrapePositionRequirements();const c=positionReqCache().rows,seed=seededCompanyPositions(),names=new Set([...Object.keys(c),...seed.map(x=>x.name)]),out=[];
 for(const name of names){const base=seed.find(x=>x.name===name)||{},row=c[name]||{},primary=row.primary||base.primary,secondary=row.secondary||base.secondary;if(!primary&&!secondary)continue;out.push({name,primary,secondary,req:reqObj(primary,secondary),official:true,source:(row.primary||row.secondary)?'Company Positions':'Pub requirements'})}
 return out
}
function positions(){
 const official=cachedOfficialPositions();if(official.length)return official.map((p,i)=>({id:i,name:p.name,req:p.req,gains:{manual:0,intelligence:0,endurance:0},primary:p.primary,secondary:p.secondary,official:true,source:p.source}));
 let x=first(profile(),['positions','company_positions','type.positions'],[]);
 if(!Array.isArray(x)&&x&&typeof x==='object')x=Object.entries(x).map(([name,v])=>({name,...v}));
 if(!Array.isArray(x))return[];
 return x.map((p,i)=>{
  const r=p.requirements||p.required_stats||p.stats||{},g=p.stat_gains||p.gains||p.daily_gains||{};
  return {
   id:p.id||p.position_id||i,name:positionLabel(p.name||p.position)||`Position ${i+1}`,
   req:{manual:num(first(r,['manual_labor','manual','man'],first(p,['manual_labor_required'],0))),intelligence:num(first(r,['intelligence','int'],first(p,['intelligence_required'],0))),endurance:num(first(r,['endurance','end'],first(p,['endurance_required'],0)))},
   gains:{manual:num(first(g,['manual_labor','manual','man'],0)),intelligence:num(first(g,['intelligence','int'],0)),endurance:num(first(g,['endurance','end'],0))},official:true,source:'API requirements'
  };
 });
}
function fit(stats,p){
 const rs=[['manual',p.req.manual],['intelligence',p.req.intelligence],['endurance',p.req.endurance]].filter(x=>x[1]>0);
 if(!rs.length)return 0;
 return Math.round(rs.reduce((a,[k,r])=>a+clamp(stats[k]/r,0,1.25),0)/rs.length*100);
}
function observedPositionAdvisor(stats){
 const groups=new Map();
 for(const e of employees().map(normEmp)){
  if(!e.position||(!e.manual&&!e.intelligence&&!e.endurance))continue;
  if(!groups.has(e.position))groups.set(e.position,[]);groups.get(e.position).push(e);
 }
 const median=a=>{const x=a.filter(Number.isFinite).sort((a,b)=>a-b);if(!x.length)return 0;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2};
 return [...groups.entries()].map(([name,list])=>{
  const req={manual:median(list.map(x=>x.manual)),intelligence:median(list.map(x=>x.intelligence)),endurance:median(list.map(x=>x.endurance))};
  const active=[['manual',req.manual],['intelligence',req.intelligence],['endurance',req.endurance]].filter(x=>x[1]>0);
  const score=active.length?Math.round(active.reduce((a,[k,r])=>a+clamp(stats[k]/r,0,1.25),0)/active.length*100):0;
  return {name,req,fit:score,qualified:active.every(([k,r])=>stats[k]>=r),sample:list.length,estimated:true};
 }).sort((a,b)=>(Number(b.qualified)-Number(a.qualified))||b.fit-a.fit||b.sample-a.sample);
}
function advisor(stats){
 return positions().map(p=>{const qualified=stats.manual>=p.req.manual&&stats.intelligence>=p.req.intelligence&&stats.endurance>=p.req.endurance;const primaryValue=num(p.primary?.value),secondaryValue=num(p.secondary?.value),demand=primaryValue+secondaryValue*.5||Object.values(p.req).reduce((a,v)=>a+num(v),0);return {...p,fit:fit(stats,p),qualified,demand}})
 .sort((a,b)=>(Number(b.qualified)-Number(a.qualified))||(b.qualified?b.demand-a.demand:b.fit-a.fit)||b.fit-a.fit);
}
function health(){
 const m=meta(),out=[];let s=50;
 if(!S.data.profile||!Object.keys(profile()).length)return {available:false,score:null,breakdown:[]};
 const add=(label,delta,reason)=>{s+=delta;out.push({label,delta,reason})};
 if(m.stars>=8)add('Stars',15,`${m.stars}★`);else if(m.stars>=5)add('Stars',10,`${m.stars}★`);else if(m.stars>=1)add('Stars',3,`${m.stars}★`);else add('Stars',-12,'0★');
 if(m.age>=365)add('Age',10,`${m.age}d`);else if(m.age>=90)add('Age',5,`${m.age}d`);else if(m.age<14)add('Age',-10,`${m.age}d / very new`);
 for(const [n,v] of [['Efficiency',m.efficiency],['Environment',m.environment],['Popularity',m.popularity]]){if(v>=95)add(n,5,`${v}%`);else if(v>=75)add(n,2,`${v}%`);else if(v>0&&v<40)add(n,-5,`${v}%`)}
 const e=employees().map(normEmp),inactive=e.filter(x=>x.lastTs&&days(now()-x.lastTs)>=3).length;
 inactive?add('Inactivity',-Math.min(12,inactive*3),`${inactive} inactive 3+d`):e.length&&add('Activity',3,'No 3+d inactivity detected');
 return {available:true,score:clamp(Math.round(s),0,100),breakdown:out};
}
const arr=k=>get(k,[])||[];
function saveSnapshot(){
 const m=meta();if(!m.id&&m.name==='Unknown company')return;
 const a=arr(KEY.snapshots),date=new Date().toISOString().slice(0,10),w=work();
 const snap={date,ts:now(),company:m,workstats:w,myPosition:currentPosition(),effectiveness:currentEffectiveness()};
 const i=a.findIndex(x=>x.date===date);if(i>=0)a[i]=snap;else a.push(snap);
 set(KEY.snapshots,a.slice(-120));
 const samples=arr(KEY.metrics),sample={ts:now(),company:m,workstats:w,position:currentPosition(),effectiveness:currentEffectiveness()};
 const last=samples.at(-1),changed=!last||['weeklyIncome','weeklyCustomers','popularity','efficiency','environment','stars'].some(k=>num(last.company?.[k])!==num(m[k]))||['manual','intelligence','endurance'].some(k=>num(last.workstats?.[k])!==num(w[k]));
 if(!last||changed||now()-num(last.ts)>6*3600000)samples.push(sample);else samples[samples.length-1]=sample;
 set(KEY.metrics,samples.slice(-500));
}
async function refresh(){
 if(S.loading)return;S.loading=true;S.errors=[];render();
 delete S.data.job;delete S.data.legacyJob;delete S.data.userProfile;
 const userEndpoints={basic:['/user/basic','basic'],workstats:['/user/workstats','workstats'],job:['/user/job','job']};
 const userResults=await Promise.allSettled(Object.entries(userEndpoints).map(async([k,[p,selection]])=>{try{return[k,await api(p)]}catch(v2Error){try{return[k,await legacyApi('user','',selection)]}catch{throw v2Error}}}));
 for(const x of userResults)x.status==='fulfilled'?S.data[x.value[0]]=x.value[1]:S.errors.push(x.reason?.message||String(x.reason));
 try{S.data.userProfile=await api('/user/profile')}catch{try{S.data.userProfile=await legacyApi('user','','profile,job,workstats')}catch{}}
 try{S.data.legacyJob=await legacyApi('user','','job')}catch{}

 const employment=[S.data.job,S.data.legacyJob,S.data.userProfile].map(employmentFromResponse).find(x=>x.known);
 if(employment){
  const previousId=detectCompanyId();
  S.employment=employment;set(APP.key+':employment',employment);
  if(!employment.id){
   clearCurrentCompany();S.mode='employee';S.tab='overview';set(KEY.mode,S.mode);set(KEY.tab,S.tab);
   S.loading=false;S.updated=now();render();return;
  }
  if(previousId&&previousId!==employment.id)clearCurrentCompany();
 }

 let selfProfile=null;
 try{selfProfile=await legacyApi('company','','profile')}catch{}
 if(selfProfile){S.data.profile=selfProfile;set(KEY.company,selfProfile)}
 let companyId=detectCompanyId();
 delete S.data.employees;delete S.data.stock;
 try{const ownCompany=await legacyApi('company','','profile,employees');if(ownCompany){if(ownCompany.company)S.data.profile=ownCompany.company;else if(ownCompany.company_id||ownCompany.rating||ownCompany.employees)S.data.profile=ownCompany;if(ownCompany.employees)S.data.employees=ownCompany.employees;else{const numeric=Object.fromEntries(Object.entries(ownCompany).filter(([k,v])=>/^\d+$/.test(k)&&v&&typeof v==='object'));if(Object.keys(numeric).length)S.data.employees=numeric;}set(KEY.company,S.data.profile||ownCompany);}}catch{}
 companyId=detectCompanyId();
 if(companyId&&!employees().length){try{S.data.employees=await api(`/company/${companyId}/employees`)}catch{}}
 if(companyId){
  let freshProfile=null;
  try{freshProfile=await api(`/company/${companyId}/profile`)}catch(e){
   try{freshProfile=await legacyApi('company',companyId,'profile')}catch{if(!S.data.profile)S.errors.push(e.code===7?'Company profile access is unavailable for this API key.':e.message||String(e))}
  }
  if(freshProfile){S.data.profile=freshProfile;set(KEY.company,freshProfile)}
  if(isDirector()&&get(KEY.mode,null)==null)S.mode='director';
  if(S.mode==='director'&&isDirector()){
   const directorEndpoints={stock:`/company/${companyId}/stock`};
   const directorResults=await Promise.allSettled(Object.entries(directorEndpoints).map(async([k,p])=>[k,await api(p)]));
   for(const x of directorResults){if(x.status==='fulfilled')S.data[x.value[0]]=x.value[1];else S.errors.push(x.reason?.code===7?'Director access required for private company data.':x.reason?.message||String(x.reason))}
  }
 }else if(S.mode==='director')S.errors.push('Company ID is unavailable, so private director data cannot be loaded. Employee history remains available.');
 S.loading=false;S.updated=now();saveSnapshot();render();
}
const card=(t,b)=>`<section class="ci-card"><div class="ci-title">${t}</div><div class="ci-body">${b}</div></section>`;
const kv=(k,v,h='')=>`<div class="ci-kv"><span>${esc(k)}</span><b>${v}</b>${h?`<small>${esc(h)}</small>`:''}</div>`;
const badge=(x,c='')=>`<span class="ci-badge ${c}">${esc(x)}</span>`;
const empty=x=>`<div class="ci-empty">${esc(x)}</div>`;
function risk(s){return s>=80?['LOW','good']:s>=60?['MODERATE','warn']:['HIGH','bad']}
function starOutlook(){
 const m=meta(),rows=metricSamples(),latest=rows.at(-1),older=rows.length>1?rows[0]:null;
 const d=new Date(),until=(7-d.getUTCDay())%7||7,next=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+until));
 if(!health().available)return card('Star Outlook',`<div class="ci-score warn"><b>—</b><span>WAITING FOR PROFILE</span></div><p class="ci-note">A real Company Profile snapshot is required. No star probability is invented from missing data.</p>`);
 let state='BUILDING HISTORY',cls='warn',detail='At least two different metric samples are needed.';
 if(older&&latest){const keys=['weeklyIncome','weeklyCustomers','popularity','efficiency','environment'],changes=keys.map(k=>num(latest.company?.[k])-num(older.company?.[k])),positive=changes.filter(x=>x>0).length,negative=changes.filter(x=>x<0).length,perf=[m.popularity,m.efficiency,m.environment].filter(v=>v>0),avg=perf.length?perf.reduce((a,v)=>a+v,0)/perf.length:0,income=changes[0];if(negative>=3||avg&&avg<55||income<0&&negative>=2){state='STAR LOSS RISK';cls='bad'}else if(positive>=3&&avg>=80&&income>=0){state='LIKELY STAR UP';cls='good'}else{state='STABLE';cls='warn'}const unchanged=Math.max(0,keys.length-positive-negative);detail=`${positive} improving · ${negative} declining · ${unchanged} unchanged · weekly income ${income>=0?'+':''}${money(income)}.`}
 return card('Star Direction',`<div class="ci-score ${cls}"><b>${m.stars}★</b><span>${state}</span></div>${kv('Next rating review',next.toLocaleDateString())}${kv('History samples',rows.length)}<p class="ci-note">${esc(detail)} History samples are saved measurements used for comparison, not a star score. Improving/declining counts refer to the five tracked metrics: weekly income, weekly customers, popularity, efficiency and environment. This indicator does not mean 2 = star up or 0 = star loss.</p>`);
}
function knownSnapshots(){const map=new Map();for(const x of arr(KEY.snapshots).filter(x=>x.company?.name&&x.company.name!=='Unknown company').sort((a,b)=>a.ts-b.ts))map.set(x.date,x);return [...map.values()]}
function metricSamples(){const a=arr(KEY.metrics).filter(x=>x.company?.name&&x.company.name!=='Unknown company').sort((a,b)=>a.ts-b.ts);return a.length?a:knownSnapshots()}
function trendMetric(rows,key){if(rows.length<2)return null;const a=num(first(rows[0].company,[key],0)),b=num(first(rows.at(-1).company,[key],0));return {from:a,to:b,change:b-a,pct:a?Math.round((b-a)/a*1000)/10:null}}
function growthCenter(){
 const rows=metricSamples(),m=meta(),income=trendMetric(rows,'weeklyIncome'),customers=trendMetric(rows,'weeklyCustomers'),pop=trendMetric(rows,'popularity'),eff=trendMetric(rows,'efficiency'),env=trendMetric(rows,'environment'),d=new Date(),daysToSunday=(7-d.getUTCDay())%7||7;
 const metric=(name,t,suffix='')=>kv(name,t?(t.change===0?'Stable':`${t.change>0?'+':''}${fmt(t.change)}${suffix}`):'Waiting for a changed sample',t?.pct==null?'':`${t.pct>0?'+':''}${t.pct}% from first saved sample`);
 return `<div class="ci-grid">${starOutlook()}${card('Growth Signals',metric('Weekly income',income)+metric('Weekly customers',customers)+metric('Popularity',pop,'%')+metric('Efficiency',eff,'%')+metric('Environment',env,'%'))}${card('Rating Readiness',kv('Current rating',health().available?m.stars+'★':'—')+kv('Review cycle',`${daysToSunday} day${daysToSunday===1?'':'s'} to Sunday`)+kv('History coverage',rows.length+' day'+(rows.length===1?'':'s'))+`<p class="ci-note">A promotion depends on gross performance and comparison with companies of the same type. Confidence improves as daily history and benchmarks accumulate.</p>`)}${card('Growth Goals',health().available?`${m.efficiency<90?badge('Raise efficiency above 90%','warn'):badge('Efficiency healthy','good')} ${m.environment<90?badge('Improve environment','warn'):badge('Environment healthy','good')} ${m.popularity<70?badge('Grow popularity','warn'):badge('Popularity healthy','good')}<p class="ci-note">Track income and customers after the daily company report, then compare with the next-star benchmark.</p>`:empty('Sync Company Profile to generate goals.'))}</div>`;
}
function employeeOptimizer(){
 const list=employees().map(normEmp),pos=positions();
 if(!list.length)return card('Position Optimizer',empty('Employee data is unavailable for this API response.'));
 const rows=list.map(e=>{const stats={manual:e.manual,intelligence:e.intelligence,endurance:e.endurance},ranked=pos.map(p=>({...p,score:fit(stats,p)})).sort((a,b)=>(Number(b.qualified)-Number(a.qualified))||(b.demand||0)-(a.demand||0)||b.score-a.score),best=ranked[0],current=ranked.find(p=>p.name===e.position),gain=best?Math.max(0,best.score-(current?.score||0)):0;return {...e,best:best?.name||'No requirements',fit:best?.score||0,gain}}).sort((a,b)=>b.gain-a.gain||a.effectiveness-b.effectiveness);
 return card('Employee Effectiveness & Position Optimizer',`<div class="ci-tablewrap ci-mobile-cards ci-optimizer-table"><table><thead><tr><th>Employee</th><th>Current</th><th>EE</th><th>Suggested</th><th>Fit</th><th>Potential</th></tr></thead><tbody>${rows.map(e=>`<tr><td class="ci-person-cell" data-label="Employee"><b>${esc(e.name)}</b><small>#${e.id||''}</small></td><td data-label="Current">${esc(e.position||'Unassigned')}</td><td data-label="Effectiveness">${fmt(e.effectiveness)}</td><td data-label="Suggested"><b>${esc(e.best)}</b></td><td data-label="Fit">${e.fit}%</td><td data-label="Potential">${e.gain?badge('+'+e.gain+' fit','good'):badge('KEEP')}</td></tr>`).join('')}</tbody></table></div><p class="ci-note">Suggestions use official position requirements when available. Torn's effectiveness value remains authoritative.</p>`);
}
function trainingManager(){
 const list=employees().map(normEmp),logs=arr(KEY.trains),contracts=arr(KEY.contracts).filter(x=>x.active!==false),week=logs.filter(x=>now()-x.ts<7*86400000),counts=new Map();
 for(const x of week){const n=String(x.employee||'');if(n)counts.set(n,(counts.get(n)||0)+1)}
 const rotation=list.slice().sort((a,b)=>(counts.get(a.name)||0)-(counts.get(b.name)||0));
 const contractRows=contracts.map(c=>{const start=Date.parse(c.startDate)||c.ts||now(),weeks=Math.max(0,(now()-start)/604800000),owed=Math.floor(weeks*num(c.perWeek)),given=logs.filter(x=>String(x.employee||'').toLowerCase()===String(c.employee||'').toLowerCase()&&x.ts>=start).length;return {...c,owed,given,debt:Math.max(0,owed-given)}}).sort((a,b)=>b.debt-a.debt);
 return `<div class="ci-actions"><button class="ci-btn primary" data-act="log-train">+ LOG TRAIN</button><button class="ci-btn" data-act="new-contract">+ CONTRACT</button></div><div class="ci-grid">${card('Fair Rotation',rotation.length?rotation.slice(0,10).map((e,i)=>`<div class="ci-line"><span>${i===0?'NEXT · ':''}${esc(e.name)} <small>${esc(e.position)}</small></span><b>${counts.get(e.name)||0} / 7d</b></div>`).join(''):empty('Sync employees to calculate rotation.'))}${card('Training Debt',contractRows.length?contractRows.map(c=>`<div class="ci-line"><span>${esc(c.employee)} <small>${fmt(c.given)} given · ${fmt(c.owed)} expected</small></span><b class="${c.debt?'neg':'pos'}">${c.debt} owed</b></div>`).join(''):empty('No active training contracts.'))}</div>${card('Recent Training Log',logs.length?`<div class="ci-tablewrap"><table><thead><tr><th>Date</th><th>Employee</th><th>Primary</th><th>Price</th></tr></thead><tbody>${logs.slice().sort((a,b)=>b.ts-a.ts).slice(0,50).map(x=>`<tr><td>${new Date(x.ts).toLocaleDateString()}</td><td>${esc(x.employee||'Unassigned')}</td><td>${esc(x.primary)}</td><td>${money(x.price)}</td></tr>`).join('')}</tbody></table></div>`:empty('No trains logged.'))}`;
}
function trainContracts(){
 const rows=arr(KEY.contracts),logs=arr(KEY.trains);
 return `<div class="ci-actions"><button class="ci-btn primary" data-act="new-contract">+ NEW CONTRACT</button><button class="ci-btn" data-act="export-contracts">EXPORT CSV</button></div>${card('Train Sales & Contracts',rows.length?rows.map(c=>{const delivered=logs.filter(x=>String(x.employee||'').toLowerCase()===String(c.employee||'').toLowerCase()&&x.ts>=(c.ts||0)).length,total=num(c.totalTrains),left=Math.max(0,total-delivered),value=total*num(c.pricePerTrain),received=c.paid?value:delivered*num(c.pricePerTrain);return `<div class="ci-contract"><div><b>${esc(c.employee)}</b><small>${c.active===false?'CLOSED':c.paid?'PAID':'ACTIVE'}</small></div><div class="ci-contract-grid">${kv('Delivered',`${delivered} / ${total}`)}${kv('Remaining',left)}${kv('Contract value',money(value))}${kv('Balance',money(Math.max(0,value-received)))}</div><button class="ci-btn" data-contract-paid="${esc(c.id)}">${c.paid?'MARK UNPAID':'MARK PAID'}</button> <button class="ci-btn danger" data-contract-close="${esc(c.id)}">${c.active===false?'REOPEN':'CLOSE'}</button></div>`}).join(''):empty('No train-sale contracts saved.'))}`;
}
function financeBalance(){
 const m=meta(),e=employees().map(normEmp),pay=e.reduce((a,x)=>a+x.wage,0),logs=arr(KEY.trains).filter(x=>now()-x.ts<7*86400000),trainRevenue=logs.reduce((a,x)=>a+num(x.price),0),stockCost=stocks().reduce((a,x)=>a+num(first(x,['cost','price','unit_cost'],0))*num(first(x,['quantity','stock','amount'],0)),0),known=m.weeklyIncome-pay*7+trainRevenue-stockCost;
 return `<div class="ci-grid">${card('Weekly Balance',kv('Company income',money(m.weeklyIncome))+kv('Wages',`-${money(pay*7)}`)+kv('Logged train revenue',money(trainRevenue))+kv('Known stock cost',`-${money(stockCost)}`)+kv('Known balance',money(known),'excludes unavailable costs and taxes'))}${card('Cost Ratios',kv('Payroll / income',m.weeklyIncome?Math.round(pay*700/m.weeklyIncome)+'%':'—')+kv('Train revenue share',m.weeklyIncome?Math.round(trainRevenue*100/m.weeklyIncome)+'%':'—')+kv('Daily payroll',money(pay)))}${card('Data Integrity',`<p class="ci-note">Only API values and manually logged train sales are included. Missing advertising, taxes, upgrades or private expenses are never estimated as zero.</p>`)}</div>${history()}`;
}
function benchmarks(){
 const rows=arr(KEY.benchmarks).sort((a,b)=>num(a.stars)-num(b.stars)),m=meta(),next=m.stars+1,candidates=rows.filter(x=>num(x.stars)===next),threshold=candidates.length?Math.min(...candidates.map(x=>num(x.weeklyIncome))):0;
 return `<div class="ci-actions"><button class="ci-btn primary" data-act="new-benchmark">+ ADD COMPANY</button></div><div class="ci-grid">${card('Next-star Benchmark',threshold?kv('Target rating',next+'★')+kv('Lowest saved income',money(threshold))+kv('Your weekly income',money(m.weeklyIncome))+kv('Gap',money(m.weeklyIncome-threshold)):empty(`Add at least one ${next}★ company of the same type.`))}${card('Confidence',kv('Comparable companies',candidates.length)+kv('Company type',esc(m.type))+`<p class="ci-note">Use several companies near the lower or middle range. One competitor is not enough for a reliable promotion forecast.</p>`)}</div>${card('Saved Competitors',rows.length?`<div class="ci-tablewrap"><table><thead><tr><th>Company</th><th>Type</th><th>Stars</th><th>Weekly income</th><th>Customers</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.type)}</td><td>${fmt(x.stars)}★</td><td>${money(x.weeklyIncome)}</td><td>${fmt(x.customers)}</td></tr>`).join('')}</tbody></table></div>`:empty('No competitor benchmarks saved.'))}`;
}
function advice(){
 const m=meta(),e=employees().map(normEmp),tips=[];if(!health().available)tips.push(['Sync company profile','Company growth and risk need a valid profile.','bad']);if(m.efficiency&&m.efficiency<90)tips.push(['Improve efficiency',`${m.efficiency}% is below the 90% target.`,'warn']);if(m.environment&&m.environment<90)tips.push(['Improve environment',`${m.environment}% can reduce performance.`,'warn']);if(m.popularity&&m.popularity<70)tips.push(['Grow popularity','Review pricing, advertising and customer flow.','warn']);const inactive=e.filter(x=>x.lastTs&&days(now()-x.lastTs)>=3);if(inactive.length)tips.push(['Inactive employees',`${inactive.length} employee(s) inactive for 3+ days.`,'bad']);if(e.length&&meta().maxEmployees&&e.length<meta().maxEmployees)tips.push(['Open employee slots',`${meta().maxEmployees-e.length} position(s) available.`,'warn']);if(!tips.length)tips.push(['No urgent flags','Current exposed metrics are healthy.','good']);return `<div class="ci-grid">${card('Actionable Advice',tips.map(([t,d,c])=>`<div class="ci-advice ${c}"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join(''))}${card('Sync Diagnostics',kv('API source',esc(apiSource()))+kv('Company ID',detectCompanyId()||'Missing')+kv('Company profile',health().available?'Loaded':'Missing')+kv('Employees',employees().length?employees().length+' loaded':'Not exposed by API')+kv('My effectiveness',currentEffectiveness()==null?'Not exposed yet':fmt(currentEffectiveness()))+kv('Days in company',ownDaysInCompany()||'Not returned')+kv('Snapshots',knownSnapshots().length))}</div>`;
}
function timeline(){const events=[];for(const x of knownSnapshots())events.push({ts:x.ts,title:`Company snapshot · ${x.company.name}`,detail:`${x.company.stars}★ · ${money(x.company.weeklyIncome)}`});for(const x of arr(KEY.trains))events.push({ts:x.ts,title:`Train · ${x.employee||'Unassigned'}`,detail:`${x.primary||'Unknown'} · ${money(x.price)}`});for(const x of arr(KEY.contracts))events.push({ts:x.ts,title:`Contract · ${x.employee}`,detail:`${x.totalTrains} trains · ${money(num(x.totalTrains)*num(x.pricePerTrain))}`});events.sort((a,b)=>b.ts-a.ts);return `<div class="ci-actions"><button class="ci-btn" data-act="export-report">EXPORT REPORT CSV</button></div>${card('Company Timeline',events.length?events.slice(0,100).map(x=>`<div class="ci-timeline"><time>${new Date(x.ts).toLocaleString()}</time><b>${esc(x.title)}</b><span>${esc(x.detail)}</span></div>`).join(''):empty('No company events saved yet.'))}`}

function employeeOverview(){
 if(S.employment?.known&&!S.employment.id){const w=work();return card('Employment',empty('You are not currently employed at a player company.')+kv('Position',esc(currentPosition())))+card('My Work Stats',kv('Manual Labor',fmt(w.manual))+kv('Intelligence',fmt(w.intelligence))+kv('Endurance',fmt(w.endurance)));}
 const m=meta(),w=work(),u=me(),h=health(),position=currentPosition(),effectiveness=currentEffectiveness(),[rl,rc]=h.available?risk(h.score):['UNAVAILABLE','warn'];
 return `<div class="ci-grid">
 ${card('Company',kv('Name',esc(m.name))+kv('Type',h.available?esc(m.type):'—')+kv('Stars',h.available?m.stars+'★':'—')+kv('Age',h.available?fmt(m.age)+' days':'—')+kv('Position',position?esc(position):'Not returned by Torn API'))}
 ${card('My Work Stats',kv('Manual Labor',fmt(w.manual))+kv('Intelligence',fmt(w.intelligence))+kv('Endurance',fmt(w.endurance))+kv('Total',fmt(w.manual+w.intelligence+w.endurance))+kv('Effectiveness',effectiveness==null?'Not exposed yet':fmt(effectiveness)))}
 ${card('Company Risk',h.available?`<div class="ci-score ${rc}"><b>${h.score}/100</b><span>${rl} RISK</span></div>${h.breakdown.slice(0,6).map(x=>`<div class="ci-line"><span>${esc(x.label)} <small>${esc(x.reason)}</small></span><b class="${x.delta>=0?'pos':'neg'}">${x.delta>=0?'+':''}${x.delta}</b></div>`).join('')}`:`<div class="ci-score warn"><b>—</b><span>UNAVAILABLE</span></div><p class="ci-note">Company Profile data is missing. Risk is not calculated from zero or incomplete values.</p>`)}
 ${starOutlook()}
 </div>`;
}
function employeeProgress(){
 const samples=metricSamples(),latest=samples.at(-1),previous=samples.length>1?samples[0]:null,w=work(),position=currentPosition(),effectiveness=currentEffectiveness(),logs=arr(KEY.trains),agreement=arr(KEY.agreements).filter(x=>x.active!==false).at(-1),received7=logs.filter(x=>now()-num(x.ts)<7*86400000).length;
 const delta=k=>previous&&latest?num(latest.workstats?.[k])-num(previous.workstats?.[k]):null;
 const row=(label,value)=>kv(label,value==null?'Waiting for history':`${value>0?'+':''}${fmt(value)}`);
 const weeklyGain=['manual','intelligence','endurance'].reduce((a,k)=>a+Math.max(0,num(delta(k))),0),covered=previous&&latest?Math.max(1,days(num(latest.ts)-num(previous.ts))):0,perDay=covered?weeklyGain/covered:0;
 return `<div class="ci-grid">${card('Current Employment',kv('Position',position?esc(position):'Not returned by Torn API')+kv('Effectiveness',effectiveness==null?'Not exposed yet':fmt(effectiveness))+kv('Tracked samples',samples.length))}${card('Work Stats Progress',row('Manual Labor',delta('manual'))+row('Intelligence',delta('intelligence'))+row('Endurance',delta('endurance'))+kv('Observed daily pace',covered?fmt(Math.round(perDay)):'Waiting for history'))}${card('Train Compliance',agreement?kv('Promised / week',fmt(agreement.perWeek))+kv('Received last 7 days',`${received7} / ${fmt(agreement.perWeek)}`)+kv('Status',received7>=num(agreement.perWeek)?badge('ON TRACK','good'):badge(`${Math.max(0,num(agreement.perWeek)-received7)} DUE`,'warn')):empty('Add a train agreement from Trains to monitor compliance.'))}${card('Projection',covered&&perDay>0?kv('Next 30 days','~+'+fmt(Math.round(perDay*30))+' total work stats')+kv('Next 90 days','~+'+fmt(Math.round(perDay*90))+' total work stats')+`<p class="ci-note">Projection uses your observed saved history and is not a guarantee.</p>`:empty('Refresh after your stats change to create a usable projection.'))}</div>`;
}
function employeePosition(){
 const w=work(),a=advisor(w),observed=!a.length?observedPositionAdvisor(w):[],rows=a.length?a:observed,best=rows[0],current=currentPosition(),eff=currentEffectiveness(),daysHere=ownDaysInCompany();
 const currentCard=card('Current Position',kv('Position',current?esc(current):'Not returned by Torn API')+kv('Effectiveness',eff==null?'Not exposed yet':fmt(eff))+kv('Days in company',daysHere||'Not returned'));
 if(!rows.length)return `<div class="ci-grid">${currentCard}${card('Best Position Advisor',empty('Position requirements are not exposed by your current API response and no coworker work-stat samples are available yet.')+`<p class="ci-note">Refresh Company Intelligence. The script will use real company employee data when Torn exposes it; it will not invent requirements.</p><p class="ci-note">Current stats: MAN ${fmt(w.manual)} · INT ${fmt(w.intelligence)} · END ${fmt(w.endurance)}</p>`)}</div>`;
 const source=a.length?(a[0]?.source||'Official company position requirements'):'Estimated from real coworkers in each position';
 const recommendation=best?card('Recommended Position',kv('Best match',esc(best.name))+kv('Fit',best.fit+'%')+kv('Status',badge(best.qualified?'QUALIFIED':'BUILD STATS',best.qualified?'good':'warn'))+`<p class="ci-note">${esc(source)}${best.estimated?` · ${best.sample} employee sample${best.sample===1?'':'s'}`:''}.</p>`):'';
 const table=card('Best Position Advisor',`<div class="ci-tablewrap ci-mobile-cards ci-position-table"><table><thead><tr><th>Position</th><th>Fit</th><th>Primary</th><th>Secondary</th><th>Status</th></tr></thead><tbody>${rows.map(p=>`<tr><td class="ci-person-cell" data-label="Position"><b>${esc(p.name)}${p.name===current?' · CURRENT':''}</b></td><td data-label="Fit">${p.fit}%</td><td data-label="Primary">${p.primary?fmt(p.primary.value)+' '+p.primary.stat.slice(0,3).toUpperCase():'—'}</td><td data-label="Secondary">${p.secondary?fmt(p.secondary.value)+' '+p.secondary.stat.slice(0,3).toUpperCase():'—'}</td><td data-label="Status">${badge(p.qualified?'QUALIFIED':'BUILD STATS',p.qualified?'good':'warn')}</td></tr>`).join('')}</tbody></table></div><p class="ci-note">${esc(source)}. Official Company Positions requirements are preferred. Coworker medians are used only when Torn does not expose requirements.</p>`);
 return `<div class="ci-grid">${currentCard}${recommendation}${table}</div>`;
}
function employeeTrains(){
 const ag=arr(KEY.agreements).filter(x=>x.active!==false).slice(-1)[0],logs=arr(KEY.trains).slice().sort((a,b)=>b.ts-a.ts),got=logs.filter(x=>now()-x.ts<7*86400000).length,weekly=ag?num(ag.perWeek)*75:0;
 return `<div class="ci-actions"><button class="ci-btn primary" data-act="new-agreement">+ Agreement</button><button class="ci-btn" data-act="log-train">+ Received train</button></div>
 <div class="ci-grid">${card('Current Agreement',ag?kv('Promised',fmt(ag.perWeek)+'/week')+kv('Received 7d',got+'/'+fmt(ag.perWeek))+kv('Price',ag.cost?money(ag.cost):'FREE')+kv('Starts',esc(ag.startDate||'Now')):empty('No active agreement.'))}
 ${card('Projection',ag?kv('7 days','~+'+fmt(weekly)+' work stats')+kv('30 days','~+'+fmt(weekly*30/7))+kv('90 days','~+'+fmt(weekly*90/7))+kv('Weekly cost',money(num(ag.perWeek)*num(ag.cost))):empty('Add an agreement first.'))}</div>
 ${card('Train History',logs.length?`<div class="ci-tablewrap"><table><thead><tr><th>Date</th><th>Primary</th><th>Secondary</th><th>Note</th></tr></thead><tbody>${logs.slice(0,50).map(x=>`<tr><td>${new Date(x.ts).toLocaleString()}</td><td>${esc(x.primary)}</td><td>${esc(x.secondary)}</td><td>${esc(x.note||'')}</td></tr>`).join('')}</tbody></table></div>`:empty('No trains logged.'))}`;
}
function offerScore(o){return num(o.dailySalary)*7+num(o.trainsPerWeek)*(num(o.trainValue,500000)-num(o.trainCost))+num(o.stars)*50000}
function employeeOffers(){
 const o=arr(KEY.offers);
 return `<div class="ci-actions"><button class="ci-btn primary" data-act="new-offer">+ Add offer</button></div>${card('Company Offer Analyzer',o.length?`<div class="ci-tablewrap"><table><thead><tr><th>Company</th><th>Type</th><th>Stars</th><th>Salary/day</th><th>Trains/wk</th><th>Train cost</th><th>Est. weekly value</th></tr></thead><tbody>${o.map(x=>`<tr><td>${esc(x.company)}</td><td>${esc(x.type)}</td><td>${fmt(x.stars)}★</td><td>${money(x.dailySalary)}</td><td>${fmt(x.trainsPerWeek)}</td><td>${x.trainCost?money(x.trainCost):'FREE'}</td><td><b>${money(offerScore(x))}</b></td></tr>`).join('')}</tbody></table></div><p class="ci-note">Comparison aid only: salary + your train value − train cost + small star-quality weight.</p>`:empty('No saved offers.'))}`;
}
function history(){
 const byDate=new Map();for(const x of arr(KEY.snapshots).slice().sort((a,b)=>a.ts-b.ts)){const old=byDate.get(x.date);if(!old||x.company?.name!=='Unknown company')byDate.set(x.date,x)}const a=[...byDate.values()].sort((x,y)=>y.ts-x.ts);
 return card('Daily Snapshots',a.length?`<div class="ci-snapshots">${a.slice(0,60).map(x=>`<article class="ci-snapshot"><div class="ci-snapshot-head"><b>${esc(x.date)}</b><span>${esc(x.company?.name||'Unknown company')} · ${fmt(x.company?.stars)}★</span></div><div class="ci-snapshot-position"><span>POSITION</span><b>${esc(x.myPosition||'Unknown')}</b></div><div class="ci-snapshot-stats"><div><span>MAN</span><b>${fmt(x.workstats?.manual)}</b></div><div><span>INT</span><b>${fmt(x.workstats?.intelligence)}</b></div><div><span>END</span><b>${fmt(x.workstats?.endurance)}</b></div></div></article>`).join('')}</div>`:empty('Snapshots are saved automatically on refresh.'));
}
function directorOverview(){
 const m=meta(),h=health(),[rl,rc]=h.available?risk(h.score):['UNAVAILABLE','warn'],e=employees().map(normEmp),pay=e.reduce((a,x)=>a+x.wage,0);
 return `<div class="ci-grid">
 ${card('Company Health',h.available?`<div class="ci-score ${rc}"><b>${h.score}/100</b><span>${rl}</span></div>${h.breakdown.map(x=>`<div class="ci-line"><span>${esc(x.label)} <small>${esc(x.reason)}</small></span><b class="${x.delta>=0?'pos':'neg'}">${x.delta>=0?'+':''}${x.delta}</b></div>`).join('')}`:`<div class="ci-score warn"><b>—</b><span>UNAVAILABLE</span></div><p class="ci-note">Company Profile data is required before health can be calculated.</p>`)}
 ${card('Performance',kv('Stars',m.stars+'★')+kv('Popularity',m.popularity+'%')+kv('Efficiency',m.efficiency+'%')+kv('Environment',m.environment+'%')+kv('Age',fmt(m.age)+' days'))}
 ${card('Roster',kv('Employees',e.length+(m.maxEmployees?' / '+m.maxEmployees:''))+kv('Low EE',e.filter(x=>x.effectiveness&&x.effectiveness<90).length)+kv('Payroll/day',money(pay))+kv('Trains available',fmt(m.trains)))}
 ${card('Financial Snapshot',kv('Daily income',money(m.dailyIncome))+kv('Weekly income',money(m.weeklyIncome))+kv('Payroll/week',money(pay*7))+kv('Simple margin',money(m.weeklyIncome-pay*7),'before stock/ads/other costs'))}
 ${card('Director Modules',`<div class="ci-module-list"><b>GROWTH</b><span>Star outlook · trends · review countdown</span><b>STAFF</b><span>Position optimizer · effectiveness · inactivity flags</span><b>OPERATIONS</b><span>Training · contracts · balance · stock</span><b>INTELLIGENCE</b><span>Benchmark · timeline · advice · history</span></div>`)}
 </div>`;
}
function directorEmployees(){
 const e=employees().map(normEmp).sort((a,b)=>b.effectiveness-a.effectiveness);
 return card('Smart Roster',e.length?`<div class="ci-tablewrap ci-mobile-cards ci-roster-table"><table><thead><tr><th>Employee</th><th>Position</th><th>MAN</th><th>INT</th><th>END</th><th>EE</th><th>Wage</th><th>Flags</th></tr></thead><tbody>${e.map(x=>{let f=[];if(x.effectiveness&&x.effectiveness<90)f.push(badge('LOW EE','bad'));if(x.lastTs&&days(now()-x.lastTs)>=3)f.push(badge('INACTIVE','bad'));return `<tr><td class="ci-person-cell" data-label="Employee"><b>${esc(x.name)}</b><small>#${x.id||''}</small></td><td data-label="Position">${esc(x.position||'Unassigned')}</td><td data-label="MAN">${fmt(x.manual)}</td><td data-label="INT">${fmt(x.intelligence)}</td><td data-label="END">${fmt(x.endurance)}</td><td data-label="Effectiveness">${fmt(x.effectiveness)}</td><td data-label="Wage">${money(x.wage)}</td><td data-label="Flags">${f.join(' ')||badge('OK','good')}</td></tr>`}).join('')}</tbody></table></div>`:empty('No employee data available.'));
}
function directorTrains(){
 const a=arr(KEY.agreements).filter(x=>x.active!==false),l=arr(KEY.trains);
 return `<div class="ci-actions"><button class="ci-btn primary" data-act="new-agreement">+ Commitment</button><button class="ci-btn" data-act="log-train">+ Delivered train</button></div>
 <div class="ci-grid">${card('Train Manager',kv('Available now',fmt(meta().trains))+kv('Commitments',a.length)+kv('Delivered 7d',l.filter(x=>now()-x.ts<7*86400000).length)+`<p class="ci-note">Actual training remains manual.</p>`)}
 ${card('Advisory Modes',badge('MANUAL','good')+' '+badge('FAIR ROTATION')+' '+badge('GROWTH PRIORITY')+' '+badge('PERFORMANCE PRIORITY')+`<p class="ci-note">v1.0.0 tracks and advises; it does not click Train.</p>`)}</div>
 ${card('Commitments',a.length?`<div class="ci-tablewrap"><table><thead><tr><th>Employee / company</th><th>Promised/wk</th><th>Cost</th><th>Starts</th></tr></thead><tbody>${a.map(x=>`<tr><td>${esc(x.employee||x.company||'')}</td><td>${fmt(x.perWeek)}</td><td>${x.cost?money(x.cost):'FREE'}</td><td>${esc(x.startDate||'Now')}</td></tr>`).join('')}</tbody></table></div>`:empty('No commitments saved.'))}`;
}
function directorFinance(){
 const e=employees().map(normEmp),pay=e.reduce((a,x)=>a+x.wage,0),m=meta(),sales=arr(KEY.trains).filter(x=>now()-x.ts<7*86400000&&num(x.price)>0).reduce((a,x)=>a+num(x.price),0);
 return `<div class="ci-grid">${card('Financial Intelligence',kv('Daily income',money(m.dailyIncome))+kv('Weekly income',money(m.weeklyIncome))+kv('Payroll/day',money(pay))+kv('Payroll/week',money(pay*7))+kv('Logged train sales 7d',money(sales))+kv('Simple margin',money(m.weeklyIncome-pay*7+sales)))}
 ${card('Important',`<p class="ci-note">Simple margin excludes costs the current API response may not expose, including stock, advertising or other expenses. No fake precision.</p>`)}</div>`;
}
function directorStock(){
 const a=stocks();return card('Stock Intelligence',a.length?`<div class="ci-tablewrap"><table><thead><tr><th>Item</th><th>Current</th><th>Cost</th><th>Value</th><th>Status</th></tr></thead><tbody>${a.map(x=>{const q=num(first(x,['quantity','stock','amount'],0)),c=num(first(x,['cost','price','unit_cost'],0)),cap=num(first(x,['capacity','max','maximum'],0)),ratio=cap?q/cap:1;return `<tr><td>${esc(x.name||x.item||x.item_name||'Stock')}</td><td>${fmt(q)}${cap?' / '+fmt(cap):''}</td><td>${money(c)}</td><td>${money(num(first(x,['value','total_value'],q*c)))}</td><td>${ratio<.2?badge('LOW','bad'):ratio<.4?badge('WATCH','warn'):badge('OK','good')}</td></tr>`}).join('')}</tbody></table></div>`:empty('No stock data exposed for this company/API response.'));
}
function settings(){
 return `<div class="ci-grid">${card('🔑 API Access',`<div class="ci-api-required"><b>Required Torn access</b><span>User: Basic, Profile, Work Stats, Job</span><span>Company: Profile, Employees, Stock</span></div><a class="ci-btn ci-api-create" href="${API_CREATE_URL}" target="_self">CREATE REQUIRED TORN KEY</a><div class="ci-api-source"><span>Active source</span><b>${esc(apiSource())}</b></div>${hubApiKey()?'<p class="ci-note ci-good-note">The shared Hub key is active. A local key is optional and remains available when this script runs separately.</p>':''}<label class="ci-field"><span>Standalone Torn API key</span><input id="ci-api" type="password" value="${esc(get(KEY.api,''))}" placeholder="Paste API key"></label><div class="ci-actions ci-api-actions"><button class="ci-btn primary" data-act="save-key">SAVE KEY</button><button class="ci-btn" data-act="test-key">TEST & REFRESH</button><button class="ci-btn danger" data-act="clear-key">CLEAR LOCAL KEY</button></div><p class="ci-note">The key is stored locally only. Director data is available only when Torn allows the key owner to access that company information.</p>`)}
 ${card('Interface',`<label class="ci-check"><input id="ci-compact" type="checkbox" ${S.compact?'checked':''}> Compact PDA mode</label>`)}
 ${card('Local data',`<div class="ci-actions"><button class="ci-btn" data-act="export">Export</button><button class="ci-btn" data-act="import">Import</button><button class="ci-btn danger" data-act="clear">Clear history</button></div>`)}</div>`;
}
function body(){
 if(S.tab==='settings')return settings();
 if(S.mode==='director'){
  if(S.updated&&!isDirector())return card('Director access required',`<p class="ci-note">Torn only exposes private Employees and Stock data to the company director. Switch to EMPLOYEE mode for your personal company intelligence.</p>`);
  if(S.tab==='growth')return growthCenter();
  if(S.tab==='employees')return directorEmployees()+employeeOptimizer();
  if(S.tab==='training')return trainingManager();
  if(S.tab==='contracts')return trainContracts();
  if(S.tab==='finance')return financeBalance();
  if(S.tab==='stock')return directorStock();
  if(S.tab==='benchmark')return benchmarks();
  if(S.tab==='timeline')return timeline();
  if(S.tab==='advice')return advice();
  if(S.tab==='history')return history();
  return directorOverview();
 }
 if(S.tab==='growth')return growthCenter();
 if(S.tab==='progress')return employeeProgress();
 if(S.tab==='position')return employeePosition();
 if(S.tab==='trains')return employeeTrains();
 if(S.tab==='offers')return employeeOffers();
 if(S.tab==='advice')return advice();
 if(S.tab==='history')return history();
 return employeeOverview();
}
const tabs=()=>S.mode==='director'?[['overview','Overview'],['growth','Growth'],['employees','Staff'],['training','Training'],['contracts','Contracts'],['finance','Balance'],['stock','Stock'],['benchmark','Benchmark'],['timeline','Timeline'],['advice','Advice'],['history','History']]:[['overview','Overview'],['progress','Progress'],['growth','Growth'],['position','Position'],['trains','Trains'],['offers','Offers'],['advice','Advice'],['history','History']];

function css(){
 if($('#ci-style'))return;
 const st=document.createElement('style');st.id='ci-style';st.textContent=`
#ci-launch{position:fixed;right:12px;bottom:82px;z-index:999998;background:linear-gradient(180deg,#377fcf,#275f9f);color:#fff;border:1px solid #4b8bd4;border-radius:999px;padding:10px 14px;font:900 13px Arial;box-shadow:0 8px 24px #0008;cursor:pointer}
#ci-root{position:fixed;inset:0;z-index:999999;background:#05080bd9;color:#edf2f7;font-family:Arial,sans-serif;display:flex;align-items:flex-start;justify-content:center;padding:16px;box-sizing:border-box;overflow:auto}
.ci-shell{width:min(1180px,100%);background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%);border:1px solid #314154;border-radius:16px;box-shadow:0 22px 80px #000b;overflow:hidden}
.ci-head{display:flex;gap:8px;align-items:center;padding:11px 12px;background:linear-gradient(155deg,#1b2634,#111923);border-bottom:1px solid #314154;position:sticky;top:0;z-index:3}.ci-brand{flex:1;min-width:0}.ci-brand b{display:block;color:#f8fafc;font-size:16px}.ci-brand small{color:#8fa0b5}.ci-mode{display:flex;border:1px solid #394b61;border-radius:9px;overflow:hidden}.ci-mode button,.ci-icon{border:0;background:#17212d;color:#c5d0dc;padding:8px 9px;cursor:pointer}.ci-mode button.active{background:linear-gradient(180deg,#377fcf,#275f9f);color:#fff}.ci-icon{border:1px solid #3a4a5d;border-radius:8px}.ci-icon.api{border-color:#78621b;background:#29240f;color:#f5d85f}
.ci-tabs{display:flex;gap:4px;overflow:auto;padding:7px;background:#0c1219;border-bottom:1px solid #2d3c4e}.ci-tabs button{white-space:nowrap;border:0;background:transparent;color:#95a2b1;padding:8px 10px;border-radius:8px;font-weight:800}.ci-tabs button.active{background:#234d7d;color:#fff}.ci-body{padding:10px}.ci-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ci-card{background:linear-gradient(145deg,#18212d,#131b25);border:1px solid #2d3c4e;border-radius:12px;overflow:hidden;margin-bottom:9px;box-shadow:0 6px 18px rgba(0,0,0,.14)}.ci-title{padding:9px 11px;font-weight:900;border-bottom:1px solid #2d3c4e;color:#f1f5f9}.ci-body .ci-body{padding:9px 11px}.ci-kv{display:grid;grid-template-columns:minmax(110px,1fr) auto;gap:4px 9px;padding:5px 0;border-bottom:1px solid #222b35}.ci-kv span{color:#9eabb9}.ci-kv b{text-align:right}.ci-kv small{grid-column:1/-1;color:#768493}.ci-score{display:flex;justify-content:space-between;align-items:center;padding:11px;border-radius:9px;background:#1b2530;margin-bottom:7px}.ci-score b{font-size:24px}.ci-score.good{border-left:4px solid #49c68d}.ci-score.warn{border-left:4px solid #f2bd52}.ci-score.bad{border-left:4px solid #ef7070}.ci-line{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid #222b35}.ci-line small{color:#748190}.pos{color:#59d29a}.neg{color:#f07d7d}.ci-badge{display:inline-block;padding:3px 6px;border-radius:999px;background:#27313e;color:#ccd5df;font-size:10px;font-weight:800}.ci-badge.good{background:#173a2d;color:#6ee0aa}.ci-badge.warn{background:#493a18;color:#f5cf70}.ci-badge.bad{background:#482323;color:#ff9292}.ci-btn{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;border:1px solid #3d78bf;background:linear-gradient(180deg,#377fcf,#275f9f);color:#fff;border-radius:9px;padding:8px 10px;font-weight:900;cursor:pointer;text-decoration:none}.ci-btn.primary{background:linear-gradient(180deg,#377fcf,#275f9f);border-color:#4b8bd4}.ci-btn.danger{background:linear-gradient(180deg,#733344,#54232f);border-color:#864354;color:#ffd7df}.ci-actions{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:9px}.ci-tablewrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border-bottom:1px solid #28313b;padding:7px 6px;text-align:left;white-space:nowrap}th{color:#91a0af;font-size:10px;text-transform:uppercase}td small{display:block;color:#6f7d8c}.ci-empty{color:#82909e;padding:12px 2px}.ci-note{color:#8391a0;font-size:11px;line-height:1.45}.ci-good-note{color:#78d98b}.ci-field{display:block}.ci-field span{display:block;color:#9ba8b7;font-size:11px;margin-bottom:5px}.ci-field input,.ci-field select{width:100%;box-sizing:border-box;background:#0d141d;color:#f4f7fb;border:1px solid #3a4b61;border-radius:9px;padding:9px}.ci-api-required{display:grid;gap:4px;padding:10px;border:1px solid #66591d;border-radius:9px;background:#211d10;color:#e4c95d;font-size:11px}.ci-api-create{width:100%;margin:9px 0;background:#2a2512;border-color:#7c681e;color:#f5d85f}.ci-api-source{display:flex;justify-content:space-between;gap:8px;margin-bottom:10px;padding:8px;border-radius:7px;background:#101720;color:#9ba8b7;font-size:11px}.ci-api-source b{color:#f5d85f}.ci-api-actions .danger{margin-left:auto}.ci-status{padding:7px 10px;color:#81909f;font-size:11px;border-top:1px solid #26303b;background:#0c1117}.ci-footer{padding:10px 8px 9px;border-top:1px solid #2d3c4e;background:rgba(10,15,21,.72);color:#8e99a8;text-align:center;font:700 10px/1.25 Arial}.ci-footer a{color:#d7a94a;text-decoration:none;font-weight:900}#ci-root{overflow-y:auto!important;overflow-x:hidden!important;align-items:flex-start!important;display:block!important;padding:0!important}#ci-root .ci-shell{display:block!important;width:min(1180px,100%)!important;max-height:none!important;min-height:100%!important;overflow:visible!important;margin:0 auto!important}#ci-root .ci-head{position:sticky!important;top:0!important;z-index:20!important}#ci-root .ci-tabs{position:sticky!important;top:58px!important;z-index:19!important}#ci-root .ci-body{overflow:visible!important}#ci-root .ci-status{display:none!important}#ci-root .ci-footer{position:relative!important;bottom:auto!important;width:100%!important;box-sizing:border-box!important}.ci-error{background:#421f25;color:#ffb6bf;padding:7px 9px;border-radius:7px;margin-bottom:7px}.ci-dialogback{position:fixed;inset:0;z-index:1000000;background:#000b;display:flex;align-items:center;justify-content:center;padding:14px}.ci-dialog{width:min(460px,100%);background:linear-gradient(155deg,#1b2634,#111923);border:1px solid #3b4654;border-radius:12px;padding:13px}.ci-dialog h3{margin:0 0 10px;color:#f8fafc}.ci-form{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ci-form .wide{grid-column:1/-1}.ci-compact .ci-body{padding:7px}.ci-compact .ci-card .ci-body{padding:7px 8px}.ci-compact .ci-kv{padding:3px 0}
.ci-snapshots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ci-snapshot{background:#0e1620;border:1px solid #304156;border-radius:10px;padding:10px;min-width:0}.ci-snapshot-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding-bottom:8px;border-bottom:1px solid #283646}.ci-snapshot-head b{color:#f3c85d;font-size:13px;white-space:nowrap}.ci-snapshot-head span{color:#e6edf5;font-weight:800;text-align:right;overflow-wrap:anywhere}.ci-snapshot-position{display:flex;justify-content:space-between;gap:10px;padding:9px 0}.ci-snapshot-position span,.ci-snapshot-stats span{color:#8494a7;font-size:9px;font-weight:900;letter-spacing:.08em}.ci-snapshot-position b{color:#dbe7f4;text-align:right}.ci-snapshot-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.ci-snapshot-stats div{display:flex;flex-direction:column;gap:3px;background:#172230;border-radius:7px;padding:8px;text-align:center}.ci-snapshot-stats b{color:#66d7a1;font-size:14px}
.ci-contract{padding:11px;border-bottom:1px solid #2a3542}.ci-contract>div:first-child{display:flex;justify-content:space-between;gap:10px;margin-bottom:7px}.ci-contract small{color:#f2bd52;font-weight:900}.ci-contract-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;margin-bottom:8px}.ci-advice{display:flex;flex-direction:column;gap:3px;border-left:4px solid #5b6a7b;background:#111a24;padding:9px 10px;margin-bottom:7px;border-radius:7px}.ci-advice span{color:#9aa8b7;font-size:11px}.ci-advice.good{border-color:#49c68d}.ci-advice.warn{border-color:#f2bd52}.ci-advice.bad{border-color:#ef7070}.ci-timeline{display:grid;grid-template-columns:130px minmax(0,1fr);gap:3px 10px;padding:9px 0;border-bottom:1px solid #28313b}.ci-timeline time{grid-row:1/3;color:#8190a0;font-size:10px}.ci-timeline b{color:#e8eef6}.ci-timeline span{color:#91a0af;font-size:11px}
.ci-module-list{display:grid;grid-template-columns:auto 1fr;gap:8px 12px}.ci-module-list b{color:#f2bd52;font-size:10px}.ci-module-list span{color:#cbd5df;font-size:11px;line-height:1.45}
#ci-root .ci-card,#ci-root .ci-card table,#ci-root .ci-card tr,#ci-root .ci-card td{color:#e8eef6!important}
#ci-root .ci-card td b,#ci-root .ci-kv b,#ci-root .ci-line b{color:#f8fafc!important}
#ci-root .ci-card th,#ci-root .ci-mobile-cards td::before{color:#9fb0c3!important}
#ci-root .ci-note,#ci-root .ci-empty,#ci-root .ci-kv span{color:#aab7c6!important}
#ci-root .ci-badge.good{color:#83f0bc!important}#ci-root .ci-badge.warn{color:#ffe08a!important}#ci-root .ci-badge.bad{color:#ffaaaa!important}

@media(max-width:720px){
 .ci-mobile-cards{overflow:visible!important}
 .ci-mobile-cards table,.ci-mobile-cards tbody,.ci-mobile-cards tr,.ci-mobile-cards td{display:block!important;width:100%!important;box-sizing:border-box!important}
 .ci-mobile-cards thead{display:none!important}
 .ci-mobile-cards tr{margin:0 0 10px!important;padding:8px 10px!important;border:1px solid #304156!important;border-radius:10px!important;background:#0f1721!important;box-shadow:0 3px 10px rgba(0,0,0,.18)!important}
 .ci-mobile-cards td{display:grid!important;grid-template-columns:minmax(92px,42%) minmax(0,1fr)!important;align-items:center!important;gap:8px!important;padding:5px 0!important;border:0!important;border-bottom:1px solid #222d39!important;white-space:normal!important;overflow-wrap:anywhere!important;text-align:right!important;font-size:12px!important}
 .ci-mobile-cards td{color:#e8eef6!important;text-shadow:none!important}
 .ci-mobile-cards td>*,.ci-mobile-cards td b,.ci-mobile-cards td span{color:inherit}
 .ci-position-table .ci-person-cell b{color:#f8fafc!important}
 .ci-mobile-cards td:last-child{border-bottom:0!important}
 .ci-mobile-cards td::before{content:attr(data-label);color:#8291a2;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;text-align:left!important}
 .ci-mobile-cards .ci-person-cell{display:block!important;text-align:left!important;padding:2px 0 8px!important;margin-bottom:2px!important;border-bottom:1px solid #334152!important}
 .ci-mobile-cards .ci-person-cell::before{display:none!important}
 .ci-mobile-cards .ci-person-cell b{display:block!important;color:#f2f6fa!important;font-size:14px!important;line-height:1.2!important}
 .ci-mobile-cards .ci-person-cell small{display:block!important;margin-top:2px!important;color:#7f8da0!important;font-size:10px!important}
 .ci-mobile-cards .ci-badge{font-size:10px!important;padding:4px 7px!important}
 .ci-roster-table td[data-label="MAN"],.ci-roster-table td[data-label="INT"],.ci-roster-table td[data-label="END"]{font-variant-numeric:tabular-nums!important}
 .ci-optimizer-table td[data-label="Suggested"] b{color:#7dd3fc!important}
}
@media(max-width:720px){#ci-root{inset:0 0 72px;padding:0;display:block;overflow:hidden;touch-action:pan-y;overscroll-behavior:contain}.ci-shell{width:100%;height:100%;min-height:0;border:0;border-radius:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding-bottom:24px;box-sizing:border-box}.ci-grid,.ci-snapshots{grid-template-columns:1fr}.ci-head{padding:7px}.ci-brand b{font-size:13px}.ci-brand small{font-size:10px}.ci-mode button{font-size:10px;padding:7px}.ci-tabs{position:sticky;top:58px;z-index:2;padding:5px}.ci-tabs button{font-size:11px;padding:7px 8px}.ci-form{grid-template-columns:1fr}.ci-form .wide{grid-column:auto}#ci-launch{right:8px;bottom:72px}}
`;document.head.appendChild(st);
}
function render(){
 let root=$('#ci-root');if(!S.open){root?.remove();return}
 if(!root){root=document.createElement('div');root.id='ci-root';document.body.appendChild(root)}
 const oldBody=$('.ci-shell > .ci-body',root),oldTabs=$('.ci-tabs',root),scrollTop=oldBody?.scrollTop||0,tabsLeft=oldTabs?.scrollLeft||0;
 root.innerHTML=`<div class="ci-shell ${S.compact?'ci-compact':''}"><div class="ci-head"><div class="ci-brand"><b>🏢 ${APP.name}</b><small>v${APP.version} · Employee & Director Intelligence</small></div><div class="ci-mode"><button type="button" data-mode="employee" class="${S.mode==='employee'?'active':''}">EMPLOYEE</button><button type="button" data-mode="director" class="${S.mode==='director'?'active':''}">DIRECTOR</button></div><button type="button" class="ci-icon" data-act="refresh" title="Refresh">↻</button><button type="button" class="ci-icon api" data-act="settings" title="API Access">🔑</button><button type="button" class="ci-icon" data-act="close" title="Close">✕</button></div><div class="ci-tabs">${tabs().map(([k,n])=>`<button type="button" data-tab="${k}" class="${S.tab===k?'active':''}">${n}</button>`).join('')}</div><div class="ci-body">${S.loading?`<p class="ci-note">Loading Torn API data…</p>`:''}${S.errors.slice(0,4).map(e=>`<div class="ci-error">${esc(e)}</div>`).join('')}${body()}</div></div>`;
 const content=$('.ci-shell > .ci-body',root),tabBar=$('.ci-tabs',root);if(content)content.scrollTop=scrollTop;if(tabBar)tabBar.scrollLeft=tabsLeft;
 $$('button',root).forEach(b=>{if(!b.type)b.type='button'});
 $$('[data-mode]',root).forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();S.mode=b.dataset.mode;S.tab='overview';set(KEY.mode,S.mode);set(KEY.tab,S.tab);render();if(S.mode==='director'&&!S.data.employees&&!S.loading)refresh()});
 $$('[data-tab]',root).forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();if(S.tab===b.dataset.tab)return;S.tab=b.dataset.tab;set(KEY.tab,S.tab);render()});
 $$('[data-act]',root).forEach(b=>b.onclick=()=>act(b.dataset.act));
 $$('[data-contract-paid]',root).forEach(b=>b.onclick=()=>{const x=arr(KEY.contracts),c=x.find(v=>String(v.id)===b.dataset.contractPaid);if(c)c.paid=!c.paid;set(KEY.contracts,x);render()});
 $$('[data-contract-close]',root).forEach(b=>b.onclick=()=>{const x=arr(KEY.contracts),c=x.find(v=>String(v.id)===b.dataset.contractClose);if(c)c.active=c.active===false;set(KEY.contracts,x);render()});
 const c=$('#ci-compact',root);if(c)c.onchange=()=>{S.compact=c.checked;set(KEY.compact,S.compact);render()};
}
function dialog(title,fields,onSave){
 const back=document.createElement('div');back.className='ci-dialogback';
 back.innerHTML=`<div class="ci-dialog"><h3>${esc(title)}</h3><div class="ci-form">${fields.map(f=>f.type==='select'?`<label class="ci-field ${f.wide?'wide':''}"><span>${esc(f.label)}</span><select name="${esc(f.name)}">${f.options.map(o=>`<option>${esc(o)}</option>`).join('')}</select></label>`:`<label class="ci-field ${f.wide?'wide':''}"><span>${esc(f.label)}</span><input name="${esc(f.name)}" type="${f.type||'text'}" value="${esc(f.value??'')}" placeholder="${esc(f.placeholder||'')}"></label>`).join('')}</div><div class="ci-actions"><button class="ci-btn primary" data-save>Save</button><button class="ci-btn" data-cancel>Cancel</button></div></div>`;
 document.body.appendChild(back);$('[data-cancel]',back).onclick=()=>back.remove();$('[data-save]',back).onclick=()=>{const d={};fields.forEach(f=>d[f.name]=$(`[name="${CSS.escape(f.name)}"]`,back)?.value??'');onSave(d);back.remove();render()};
}
function downloadCsv(name,rows){const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n'),blob=new Blob([csv],{type:'text/csv'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function act(a){
 if(a==='close'){S.open=false;render();return}
 if(a==='settings'){S.tab='settings';set(KEY.tab,S.tab);render();return}
 if(a==='refresh'){refresh();return}
 if(a==='save-key'){set(KEY.api,$('#ci-api')?.value.trim()||'');alert('API key saved locally.');return}
 if(a==='test-key'){set(KEY.api,$('#ci-api')?.value.trim()||'');S.tab='overview';set(KEY.tab,S.tab);refresh();return}
 if(a==='clear-key'){del(KEY.api);alert(hubApiKey()?'Local key cleared. The SakaLuX Hub key remains active.':'Local API key cleared.');render();return}
 if(a==='new-agreement')return dialog('Train Agreement',[{name:'company',label:'Company / employee',value:meta().name},{name:'perWeek',label:'Trains promised/week',type:'number',value:10},{name:'cost',label:'Cost/train (0 = free)',type:'number',value:0},{name:'startDate',label:'Starts / wait note',value:'Immediately'},{name:'note',label:'Notes',wide:true}],d=>{let x=arr(KEY.agreements);x.push({...d,perWeek:num(d.perWeek),cost:num(d.cost),ts:now(),active:true});set(KEY.agreements,x)});
 if(a==='log-train')return dialog('Log Train',[{name:'employee',label:'Employee / buyer',value:me()?.name||''},{name:'primary',label:'Primary stat',type:'select',options:['Intelligence','Endurance','Manual Labor','Unknown']},{name:'secondary',label:'Secondary stat',type:'select',options:['Endurance','Intelligence','Manual Labor','Unknown']},{name:'price',label:'Price received/paid',type:'number',value:0},{name:'note',label:'Note',wide:true}],d=>{let x=arr(KEY.trains);x.push({...d,price:num(d.price),ts:now()});set(KEY.trains,x)});
 if(a==='new-contract')return dialog('Train Sale Contract',[{name:'employee',label:'Employee / buyer'},{name:'totalTrains',label:'Total trains',type:'number',value:10},{name:'perWeek',label:'Promised per week',type:'number',value:10},{name:'pricePerTrain',label:'Price per train',type:'number',value:500000},{name:'startDate',label:'Start date',value:new Date().toISOString().slice(0,10)},{name:'note',label:'Notes',wide:true}],d=>{const x=arr(KEY.contracts);x.push({...d,id:String(now()),totalTrains:num(d.totalTrains),perWeek:num(d.perWeek),pricePerTrain:num(d.pricePerTrain),ts:now(),active:true,paid:false});set(KEY.contracts,x)});
 if(a==='new-benchmark')return dialog('Add Competitor Benchmark',[{name:'name',label:'Company name'},{name:'type',label:'Company type',value:meta().type},{name:'stars',label:'Stars',type:'number',value:Math.min(10,meta().stars+1)},{name:'weeklyIncome',label:'Weekly income',type:'number',value:0},{name:'customers',label:'Weekly customers',type:'number',value:0}],d=>{const x=arr(KEY.benchmarks);x.push({...d,stars:num(d.stars),weeklyIncome:num(d.weeklyIncome),customers:num(d.customers),ts:now()});set(KEY.benchmarks,x)});
 if(a==='export-contracts'){const logs=arr(KEY.trains);return downloadCsv('SakaLuX-train-contracts.csv',[['Employee','Total trains','Delivered','Remaining','Price/train','Paid','Active'],...arr(KEY.contracts).map(c=>{const delivered=logs.filter(x=>String(x.employee||'').toLowerCase()===String(c.employee||'').toLowerCase()&&x.ts>=(c.ts||0)).length;return[c.employee,c.totalTrains,delivered,Math.max(0,num(c.totalTrains)-delivered),c.pricePerTrain,c.paid?'Yes':'No',c.active===false?'No':'Yes']})])}
 if(a==='export-report'){const events=[...knownSnapshots().map(x=>[new Date(x.ts).toISOString(),'Snapshot',x.company.name,`${x.company.stars} stars`,x.company.weeklyIncome]),...arr(KEY.trains).map(x=>[new Date(x.ts).toISOString(),'Train',x.employee||'',x.primary||'',x.price||0]),...arr(KEY.contracts).map(x=>[new Date(x.ts).toISOString(),'Contract',x.employee||'',x.totalTrains||0,num(x.totalTrains)*num(x.pricePerTrain)])].sort((a,b)=>String(b[0]).localeCompare(String(a[0])));return downloadCsv('SakaLuX-company-report.csv',[['Date','Type','Subject','Detail','Value'],...events])}
 if(a==='new-offer')return dialog('Add Company Offer',[{name:'company',label:'Company name'},{name:'type',label:'Company type'},{name:'stars',label:'Stars',type:'number',value:0},{name:'dailySalary',label:'Salary/day',type:'number',value:0},{name:'trainsPerWeek',label:'Trains/week',type:'number',value:0},{name:'trainCost',label:'Cost/train',type:'number',value:0},{name:'trainValue',label:'Your value/train',type:'number',value:500000}],d=>{let x=arr(KEY.offers);x.push({...d,stars:num(d.stars),dailySalary:num(d.dailySalary),trainsPerWeek:num(d.trainsPerWeek),trainCost:num(d.trainCost),trainValue:num(d.trainValue),ts:now()});set(KEY.offers,x)});
 if(a==='export'){const data={version:APP.version,agreements:arr(KEY.agreements),trains:arr(KEY.trains),contracts:arr(KEY.contracts),offers:arr(KEY.offers),benchmarks:arr(KEY.benchmarks),snapshots:arr(KEY.snapshots),metrics:arr(KEY.metrics)};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),ln=document.createElement('a');ln.href=u;ln.download=`SakaLuX-Company-Intelligence-${new Date().toISOString().slice(0,10)}.json`;ln.click();setTimeout(()=>URL.revokeObjectURL(u),1000);return}
 if(a==='import'){const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{try{const d=JSON.parse(await i.files[0].text());for(const k of ['agreements','trains','contracts','offers','benchmarks','snapshots','metrics'])if(d[k])set(KEY[k],d[k]);alert('Import complete.');render()}catch(e){alert('Import failed: '+e.message)}};i.click();return}
 if(a==='clear'&&confirm('Clear local train, contract, benchmark, offer and snapshot history?')){[KEY.agreements,KEY.trains,KEY.contracts,KEY.benchmarks,KEY.offers,KEY.snapshots,KEY.metrics].forEach(del);render()}
}
function syncHubBridge(){const b=$('#sakalux-module-bridge-company-intelligence');if(b)b.dataset.enabled=String(S.enabled)}
function installHubBridge(){let b=$('#sakalux-module-bridge-company-intelligence');if(!b){b=document.createElement('button');b.type='button';b.id='sakalux-module-bridge-company-intelligence';b.hidden=true;(document.body||document.documentElement).appendChild(b)}b.dataset.version=APP.version;b.dataset.enabled=String(S.enabled);b.onclick=()=>{const a=b.dataset.action;if(a==='open'){if(!S.enabled)setEnabled(true);S.open=true;render()}else if(a==='toggle')setEnabled(!S.enabled);else if(a==='on'||a==='off')setEnabled(a==='on');b.dataset.action='';syncHubBridge()}}
function setEnabled(value){S.enabled=!!value;set(KEY.enabled,S.enabled);if(!S.enabled){S.open=false;$('#ci-root')?.remove();$('#ci-launch')?.remove()}else init();syncHubBridge();try{window.dispatchEvent(new CustomEvent('SakaLuXCompanyIntelligenceStateChanged',{detail:{enabled:S.enabled,version:APP.version}}))}catch{}return S.enabled}
let ciPlacementTimer=null;
function init(){
 registerStandaloneEntry();
 setTimeout(normalizeStandaloneCompanyPlacement,250);
 setTimeout(normalizeStandaloneCompanyPlacement,900);
 if(!ciPlacementTimer)ciPlacementTimer=setInterval(normalizeStandaloneCompanyPlacement,2000);
 css();S.enabled=get(KEY.enabled,true)!==false;S.compact=get(KEY.compact,true)!==false;S.mode=get(KEY.mode,'employee')||'employee';S.tab=get(KEY.tab,'overview')||'overview';
 S.employment=get(APP.key+':employment',null);
 if(!S.data.profile&&!(S.employment?.known&&!S.employment.id)){const cached=get(KEY.company,null),last=arr(KEY.snapshots).filter(x=>x.company?.name&&x.company.name!=='Unknown company').sort((a,b)=>b.ts-a.ts)[0]?.company;if(cached||last)S.data.profile=cached||last}
 installHubBridge();syncHubBridge();
 try{localStorage.setItem('SakaLuX_Installed_company-intelligence',APP.version)}catch{}
 $('#ci-launch')?.remove();
 try{
  window.SakaLuX=window.SakaLuX||{};
  window.SakaLuX.companyIntelligence={name:APP.name,version:APP.version,open:()=>{if(!S.enabled)setEnabled(true);S.open=true;render()},refresh,mode:m=>{if(['employee','director'].includes(m)){S.mode=m;S.tab='overview';set(KEY.mode,m);set(KEY.tab,S.tab);render()}},getApiKey:apiKey,setEnabled,toggleEnabled:()=>setEnabled(!S.enabled),isEnabled:()=>S.enabled};
  window.SakaLuXCompanyIntelligence=window.SakaLuX.companyIntelligence;
  window.dispatchEvent(new CustomEvent('SakaLuX:ModuleReady',{detail:{id:'company-intelligence',name:APP.name,version:APP.version,actions:['OPEN','REFRESH','EMPLOYEE','DIRECTOR']}}));
 }catch{}
}
let ciPosTimer=0;new MutationObserver(records=>{if(document.hidden||!/(?:companies|joblist)\.php/i.test(location.pathname)||records.every(r=>(r.target.nodeType===1?r.target:r.target.parentElement)?.closest?.('#ci-root,#sakalux-hub-overlay,[id^="sakalux-inline-footer-"]')))return;clearTimeout(ciPosTimer);ciPosTimer=setTimeout(()=>{try{scrapePositionRequirements()}catch{}},300)}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
setTimeout(()=>{try{scrapePositionRequirements()}catch{}},800);
setInterval(registerStandaloneEntry,15000);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();




/* slx-host-scroll-contract-v3 */
(()=>{if(document.getElementById('slx-host-scroll-contract-v3'))return;const s=document.createElement('style');s.id='slx-host-scroll-contract-v3';s.textContent=`@media(max-width:820px){
[data-slx-fullsheet-v2="1"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)){position:relative!important;inset:auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;}
}`;(document.head||document.documentElement).appendChild(s)})();


/* slx-company-scroll-hotfix-1822 */
(()=>{if(document.getElementById('slx-company-scroll-hotfix-1822'))return;const s=document.createElement('style');s.id='slx-company-scroll-hotfix-1822';s.textContent=`@media(max-width:820px){
#ci-root{overflow:hidden!important;align-items:stretch!important;justify-content:stretch!important}
#ci-root .ci-shell{position:relative!important;inset:auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;}
#ci-root .ci-body{overflow:visible!important;max-height:none!important;min-height:auto!important;flex:0 0 auto!important}
#ci-root .ci-footer,#ci-root .sakalux-stable-module-footer{position:relative!important;inset:auto!important;width:100%!important;box-sizing:border-box!important;text-align:center!important;color:#f59e0b!important;font-weight:800!important;background:rgba(9,15,22,.96)!important;border-top:1px solid rgba(245,158,11,.24)!important;padding:10px 12px!important}
#ci-root .ci-footer a,#ci-root .sakalux-stable-module-footer a{color:#f59e0b!important;font-weight:900!important}
}`;(document.head||document.documentElement).appendChild(s)})();


/* SakaLuX Mobile Full-Screen Performance Contract */
(()=>{
  if(document.getElementById('sakalux-fullscreen-performance-contract')) return;
  const s=document.createElement('style');
  s.id='sakalux-fullscreen-performance-contract';
  s.textContent=`@media(max-width:820px){
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="overlay"],
    [id^="slx-"][id*="overlay"],
    [id^="sl-"][id*="overlay"]{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;padding:0!important;border-radius:0!important;overflow:hidden!important;
      -webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:#0b1118!important;box-shadow:none!important
    }
    [data-slx-fullsheet-v2="1"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)),
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="panel"],[id^="slx-"][id*="panel"],[id^="sl-"][id*="panel"],
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="modal"],[id^="slx-"][id*="modal"],[id^="sl-"][id*="modal"]{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;border-radius:0!important;box-sizing:border-box!important;overflow:auto!important;
      touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;
      -webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:none!important
    }
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) *,[id^="slx-"] *,[id^="sl-"] *{ -webkit-backdrop-filter:none!important;backdrop-filter:none!important }
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="panel"] *,[id^="slx-"][id*="panel"] *,[id^="sl-"][id*="panel"] *,
    [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="modal"] *,[id^="slx-"][id*="modal"] *,[id^="sl-"][id*="modal"] *{
      animation:none!important;transition:none!important
    }
  }`;
  (document.head||document.documentElement).appendChild(s);
})();


/* SakaLuX Hub footer v3: native module root only; compact donation controls. */
(()=>{
 const selector="#ci-root > .ci-shell",id="sakalux-inline-footer-company-intelligence",profile='https://www.torn.com/profiles.php?XID=2380374';
 const st=document.createElement('style');st.textContent=`
 #${id}#${id}{position:sticky!important;bottom:0!important;inset-inline:auto!important;display:block!important;flex:0 0 50px!important;width:100%!important;height:50px!important;min-height:50px!important;max-height:50px!important;margin:0!important;padding:0!important;box-sizing:border-box!important;z-index:5!important;font-family:Arial,sans-serif!important;overflow:hidden!important;border-radius:10px!important}
 #${id}#${id} *{box-sizing:border-box!important}
 #${id}#${id} .slh-bottom{height:28px!important;margin:0!important;padding:4px 14px!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important;border-radius:10px 10px 0 0!important;overflow:hidden!important}
 #${id}#${id} .slh-bottom-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;height:20px!important}
 #${id}#${id} .slh-bottom-btn{display:block!important;width:100%!important;min-width:0!important;height:20px!important;min-height:20px!important;max-height:20px!important;margin:0!important;padding:0 4px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#151f2a!important;color:#b9c7d6!important;font:900 8px/1.2 Arial,sans-serif!important;letter-spacing:.04em!important;white-space:nowrap!important;box-shadow:none!important;cursor:pointer!important}
 #${id}#${id} .slh-footer{height:22px!important;min-height:22px!important;max-height:22px!important;margin:0!important;padding:0 6px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;border-top:1px solid rgba(223,154,55,.52)!important;border-radius:0 0 10px 10px!important;background:#080d13!important;color:#df9a37!important;font:400 9px/20px Arial,sans-serif!important;white-space:nowrap!important;overflow:hidden!important}
 #${id}#${id} .slh-author{color:#78aef2!important;font-weight:900!important;text-decoration:none!important}
 `;(document.head||document.documentElement).appendChild(st);
 function ensure(){
  const panel=document.querySelector(selector);if(!panel||panel.closest('#sakalux-hub-overlay, #sakalux-hub-panel'))return;
  if(panel.querySelector('#'+id))return;
  const f=document.createElement('div');f.id=id;
  f.innerHTML='<div class="slh-bottom"><div class="slh-bottom-grid"><button type="button" class="slh-bottom-btn" data-slx-donate>💸 SEND MONEY</button><button type="button" class="slh-bottom-btn" data-slx-donate>🎁 SEND ITEMS</button></div></div><div class="slh-footer">Made with ❤️ by <a class="slh-author" href="'+profile+'">SakaLuX [2380374]</a></div>';
  f.querySelectorAll('[data-slx-donate]').forEach(b=>b.onclick=()=>{location.href=profile});panel.appendChild(f);
 }
 function start(){ensure();let scheduled=false;new MutationObserver(records=>{
  const nativeRoot=selector.split(/[ >]/)[0];
  const relevant=records.some(r=>{
   if(r.target?.closest?.('[id^="sakalux-inline-footer-"]'))return false;
   return r.target?.closest?.(nativeRoot)||[...r.addedNodes].some(n=>n.nodeType===1&&n.matches?.(nativeRoot));
  });
  if(scheduled||!relevant)return;
  scheduled=true;requestAnimationFrame(()=>{scheduled=false;ensure()});
 }).observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* Compact donation controls and Elimination mobile panel geometry 1.8.27 */
(()=>{const s=document.createElement('style');s.textContent="@media(max-width:820px){\n#ci-root#ci-root#ci-root{position:fixed!important;inset:0 4px 36px!important;top:0!important;bottom:36px!important;left:4px!important;right:4px!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;transform:none!important;box-sizing:border-box!important;padding:0!important;background:transparent!important;overflow:hidden!important;border-radius:14px!important;align-items:stretch!important;justify-content:stretch!important;}\n#ci-root#ci-root#ci-root > .ci-shell{position:relative!important;inset:auto!important;top:auto!important;bottom:auto!important;left:auto!important;right:auto!important;align-self:stretch!important;flex:1 1 auto!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;max-width:100%!important;margin:0!important;transform:none!important;box-sizing:border-box!important;border:1px solid #3c4652!important;border-radius:14px!important;}\n#ci-root#ci-root#ci-root > .ci-shell{display:flex!important;flex-direction:column!important;overflow:hidden!important;}\n#ci-root#ci-root#ci-root > .ci-shell>.ci-body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;}\n\n}";(document.head||document.documentElement).appendChild(s)})();

/* Company v1.8.28: fixed header/tabs/footer, native content-only scrolling. */
(()=>{const s=document.createElement('style');s.textContent=`
#ci-root#ci-root#ci-root>.ci-shell{
 display:flex!important;flex-direction:column!important;padding:0!important;min-height:0!important;overflow:hidden!important;height:min(820px,calc(100vh - 32px))!important;
}
#ci-root#ci-root#ci-root>.ci-shell>.ci-head,
#ci-root#ci-root#ci-root>.ci-shell>.ci-tabs{
 position:relative!important;inset:auto!important;flex:0 0 auto!important;margin:0!important;
}
#ci-root#ci-root#ci-root>.ci-shell>.ci-tabs{overflow-x:auto!important;overflow-y:hidden!important;touch-action:pan-x!important}
#ci-root#ci-root#ci-root>.ci-shell>.ci-body{
 flex:1 1 0!important;min-height:0!important;max-height:none!important;
 overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;
 touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;
}
#ci-root#ci-root#ci-root>.ci-shell>#sakalux-inline-footer-company-intelligence{
 position:relative!important;inset:auto!important;flex:0 0 50px!important;
 width:100%!important;height:50px!important;min-height:50px!important;max-height:50px!important;
 margin:0!important;padding:0!important;border-radius:10px 10px 14px 14px!important;
}
@media(max-width:820px){
 #ci-root#ci-root#ci-root{inset:0 4px 36px!important;top:0!important;bottom:36px!important;height:auto!important;min-height:0!important;max-height:none!important;padding:0!important;overflow:hidden!important}
 #ci-root#ci-root#ci-root>.ci-shell{height:100%!important;max-height:100%!important;margin:0!important}
}
`;(document.head||document.documentElement).appendChild(s)})();

/* Company v1.8.30: vertical gestures from anywhere in the shell scroll its body. */
(()=>{
 let gesture=null,suppressClickUntil=0;
 const bodyFor=target=>{
  const shell=target?.closest?.('#ci-root > .ci-shell');
  if(!shell||target.closest('.ci-dialogback,[role="dialog"],input[type="range"]'))return null;
  return shell.querySelector(':scope > .ci-body');
 };
 document.addEventListener('touchstart',e=>{
  gesture=null;if(e.touches.length!==1)return;
  const body=bodyFor(e.target);if(!body)return;
  const t=e.touches[0];gesture={body,x:t.clientX,y:t.clientY,lastY:t.clientY,active:false};
 },{capture:true,passive:true});
 document.addEventListener('touchmove',e=>{
  if(!gesture||e.touches.length!==1||!gesture.body.isConnected){gesture=null;return;}
  const t=e.touches[0],dx=t.clientX-gesture.x,dy=t.clientY-gesture.y;
  if(!gesture.active){
   if(Math.abs(dy)<5||Math.abs(dy)<=Math.abs(dx))return;
   gesture.active=true;
  }
  if(e.cancelable)e.preventDefault();
  const body=gesture.body,max=Math.max(0,body.scrollHeight-body.clientHeight);
  body.scrollTop=Math.max(0,Math.min(max,body.scrollTop+gesture.lastY-t.clientY));
  gesture.lastY=t.clientY;suppressClickUntil=Date.now()+400;
 },{capture:true,passive:false});
 const end=()=>{gesture=null;};
 document.addEventListener('touchend',end,{capture:true,passive:true});
 document.addEventListener('touchcancel',end,{capture:true,passive:true});
 document.addEventListener('click',e=>{
  if(Date.now()<suppressClickUntil&&bodyFor(e.target)){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 document.addEventListener('wheel',e=>{
  if(e.ctrlKey||Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;
  const body=bodyFor(e.target);if(!body||body.contains(e.target))return;
  if(e.cancelable)e.preventDefault();
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?body.clientHeight:1);
  body.scrollTop=Math.max(0,Math.min(Math.max(0,body.scrollHeight-body.clientHeight),body.scrollTop+delta));
 },{capture:true,passive:false});
 const s=document.createElement('style');s.textContent=`
#ci-root#ci-root#ci-root,#ci-root#ci-root#ci-root>.ci-shell,#ci-root#ci-root#ci-root>.ci-shell>.ci-head,
#ci-root#ci-root#ci-root>.ci-shell>.ci-body,#ci-root#ci-root#ci-root>.ci-shell>#sakalux-inline-footer-company-intelligence{touch-action:pan-x!important}
#ci-root#ci-root#ci-root>.ci-shell>.ci-body{overflow-y:auto!important;min-height:0!important;flex:1 1 0!important}
`;(document.head||document.documentElement).appendChild(s);
})();
