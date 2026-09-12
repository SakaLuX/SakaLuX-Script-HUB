// ==UserScript==
// @name         SakaLuX Company Intelligence
// @namespace    sakalux.torn.company
// @version      1.8.0
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

const APP={name:'SakaLuX Company Intelligence',version:'1.8.0',base:'https://api.torn.com/v2',legacy:'https://api.torn.com',key:'sak_ci'};
const PROFILE_URL='https://www.torn.com/profiles.php?XID=2380374';
const API_CREATE_URL='https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX_Company_Intelligence&user=basic,profile,workstats,job&company=profile,employees,stock';
const HUB_API_STORAGE='SakaLuX_HUB_TORN_API_KEY';
const KEY={
 api:APP.key+':api', mode:APP.key+':mode', compact:APP.key+':compact', enabled:APP.key+':enabled',
 agreements:APP.key+':agreements', trains:APP.key+':trains',
 offers:APP.key+':offers', snapshots:APP.key+':snapshots', company:APP.key+':company',
 contracts:APP.key+':contracts', benchmarks:APP.key+':benchmarks', notes:APP.key+':notes',
 metrics:APP.key+':metrics'
};
const S={open:false,loading:false,mode:'employee',tab:'overview',compact:true,enabled:true,data:{},errors:[],updated:0};

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
const userProfile=()=>unwrap(S.data.userProfile,'profile','user')||{};
const jobCompanyName=()=>first(job(),['company_name','company.name','job.company_name','job.company.name'],first(userProfile(),['job.company_name','job.company.name'],'Unknown company'));
function companyIdFromPage(){
 for(const a of document.querySelectorAll('a[href*="company"]')){
  const h=String(a.getAttribute('href')||'');
  const m=h.match(/(?:companyprofile\.php|companies\.php)[^#]*(?:ID|companyID|company_id)=(\d+)/i);
  if(m&&num(m[1])>0)return num(m[1]);
 }
 const m=location.href.match(/(?:ID|companyID|company_id)=(\d+)/i);return m?num(m[1]):0;
}
function detectCompanyId(){
 const paths=['company_id','companyId','company.id','company.company_id','company.companyId','job.company_id','job.companyId','job.company.id','employment.company_id','employment.company.id'];
 for(const src of [job(),userProfile(),S.data.job,S.data.userProfile]){const id=num(first(src,paths,0));if(id>0)return id}
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
function normEmp(e){
 const ws=e.working_stats||e.work_stats||e.stats||{};
 const ef=e.effectiveness||e.efficiency||{};
 const last=first(e,['last_action.timestamp','last_action','last_action_timestamp'],null);
 let lastTs=null;if(typeof last==='number')lastTs=last*(last<1e12?1000:1);else if(typeof last==='string'&&!isNaN(Date.parse(last)))lastTs=Date.parse(last);
 return {
  id:num(e.id||e.player_id||e.user_id),name:first(e,['name','player_name'],'Unknown'),
  position:first(e,['position','position_name','role'],''),
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
  stars:num(first(p,['rating','stars','star_rating'],0)),
  age:num(first(p,['age','days_old','company_age'],0)),
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
function currentPosition(){
 const cached=knownSnapshots().at(-1)?.myPosition;
 return String(first(job(),['position','position_name','company.position','company.position_name','job.position','job.position_name'],first(userProfile(),['job.position','job.position_name','position'],me()?.position||cached||''))||'').trim();
}
function currentEffectiveness(){
 const own=me()?.effectiveness;if(Number.isFinite(own)&&own>0)return own;
 const value=first(job(),['effectiveness','company.effectiveness','job.effectiveness'],first(userProfile(),['job.effectiveness','company.effectiveness'],null));
 if(value!=null&&Number.isFinite(Number(value)))return num(value);
 const el=document.querySelector('[data-effectiveness],.effectiveness-value,p.effectiveness-value');
 const dom=el?.getAttribute?.('data-effectiveness')||el?.textContent||'';
 const match=String(dom).match(/-?\d+(?:\.\d+)?/);return match?num(match[0]):null;
}
function isDirector(){
 const id=num(first(basic(),['id','player_id'],0)),m=meta();
 return (id&&m.directorId&&id===m.directorId)||String(first(job(),['position','position_name','company.position','company.position_name'],'')).toLowerCase().includes('director');
}
function positions(){
 let x=first(profile(),['positions','company_positions','type.positions'],[]);
 if(!Array.isArray(x)&&x&&typeof x==='object')x=Object.entries(x).map(([name,v])=>({name,...v}));
 if(!Array.isArray(x))return[];
 return x.map((p,i)=>{
  const r=p.requirements||p.required_stats||p.stats||{},g=p.stat_gains||p.gains||p.daily_gains||{};
  return {
   id:p.id||p.position_id||i,name:p.name||p.position||`Position ${i+1}`,
   req:{manual:num(first(r,['manual_labor','manual','man'],first(p,['manual_labor_required'],0))),intelligence:num(first(r,['intelligence','int'],first(p,['intelligence_required'],0))),endurance:num(first(r,['endurance','end'],first(p,['endurance_required'],0)))},
   gains:{manual:num(first(g,['manual_labor','manual','man'],0)),intelligence:num(first(g,['intelligence','int'],0)),endurance:num(first(g,['endurance','end'],0))}
  };
 });
}
function fit(stats,p){
 const rs=[['manual',p.req.manual],['intelligence',p.req.intelligence],['endurance',p.req.endurance]].filter(x=>x[1]>0);
 if(!rs.length)return 0;
 return Math.round(rs.reduce((a,[k,r])=>a+clamp(stats[k]/r,0,1.25),0)/rs.length*100);
}
function advisor(stats){
 return positions().map(p=>({...p,fit:fit(stats,p),qualified:stats.manual>=p.req.manual&&stats.intelligence>=p.req.intelligence&&stats.endurance>=p.req.endurance}))
 .sort((a,b)=>(Number(b.qualified)-Number(a.qualified))||b.fit-a.fit);
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
 const userEndpoints={basic:['/user/basic','basic'],workstats:['/user/workstats','workstats'],job:['/user/job','job']};
 const userResults=await Promise.allSettled(Object.entries(userEndpoints).map(async([k,[p,selection]])=>{try{return[k,await api(p)]}catch(v2Error){try{return[k,await legacyApi('user','',selection)]}catch{throw v2Error}}}));
 for(const x of userResults)x.status==='fulfilled'?S.data[x.value[0]]=x.value[1]:S.errors.push(x.reason?.message||String(x.reason));
 try{S.data.userProfile=await api('/user/profile')}catch{try{S.data.userProfile=await legacyApi('user','','profile,job,workstats')}catch{}}
 if(!detectCompanyId()||jobCompanyName()==='Unknown company')try{S.data.job=await legacyApi('user','','job')}catch{}
 const companyId=detectCompanyId();
 delete S.data.employees;delete S.data.stock;
 if(companyId){
  let freshProfile=null;
  try{freshProfile=await api(`/company/${companyId}/profile`)}catch(e){
   try{freshProfile=await legacyApi('company',companyId,'profile')}catch{if(!S.data.profile)S.errors.push(e.code===7?'Company profile access is unavailable for this API key.':e.message||String(e))}
  }
  if(freshProfile){S.data.profile=freshProfile;set(KEY.company,freshProfile)}
  if(isDirector()&&get(KEY.mode,null)==null)S.mode='director';
  if(S.mode==='director'&&isDirector()){
   const directorEndpoints={employees:`/company/${companyId}/employees`,stock:`/company/${companyId}/stock`};
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
 if(older&&latest){const keys=['weeklyIncome','weeklyCustomers','popularity','efficiency','environment'],changes=keys.map(k=>num(latest.company?.[k])-num(older.company?.[k])),positive=changes.filter(x=>x>0).length,negative=changes.filter(x=>x<0).length,perf=[m.popularity,m.efficiency,m.environment].filter(v=>v>0),avg=perf.length?perf.reduce((a,v)=>a+v,0)/perf.length:0,income=changes[0];if(negative>=3||avg&&avg<55||income<0&&negative>=2){state='STAR LOSS RISK';cls='bad'}else if(positive>=3&&avg>=80&&income>=0){state='LIKELY STAR UP';cls='good'}else{state='STABLE';cls='warn'}detail=`${positive} improving · ${negative} declining · weekly income ${income>=0?'+':''}${money(income)}.`}
 return card('Star Direction',`<div class="ci-score ${cls}"><b>${m.stars}★</b><span>${state}</span></div>${kv('Next rating review',next.toLocaleDateString())}${kv('Metric samples',rows.length)}<p class="ci-note">${esc(detail)} This is an evidence-based direction indicator. Torn compares companies of the same type, so it cannot guarantee the next rating.</p>`);
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
 if(!list.length)return card('Position Optimizer',empty('Employee data is available only to the company director with the required API access.'));
 const rows=list.map(e=>{const stats={manual:e.manual,intelligence:e.intelligence,endurance:e.endurance},ranked=pos.map(p=>({...p,score:fit(stats,p)})).sort((a,b)=>b.score-a.score),best=ranked[0],current=ranked.find(p=>p.name===e.position),gain=best?Math.max(0,best.score-(current?.score||0)):0;return {...e,best:best?.name||'No requirements',fit:best?.score||0,gain}}).sort((a,b)=>b.gain-a.gain||a.effectiveness-b.effectiveness);
 return card('Employee Effectiveness & Position Optimizer',`<div class="ci-tablewrap"><table><thead><tr><th>Employee</th><th>Current</th><th>EE</th><th>Suggested</th><th>Fit</th><th>Potential</th></tr></thead><tbody>${rows.map(e=>`<tr><td><b>${esc(e.name)}</b></td><td>${esc(e.position||'—')}</td><td>${fmt(e.effectiveness)}</td><td>${esc(e.best)}</td><td>${e.fit}%</td><td>${e.gain?badge('+'+e.gain+' fit','good'):badge('KEEP')}</td></tr>`).join('')}</tbody></table></div><p class="ci-note">Suggestions use exposed position requirements and work stats. Torn's real effectiveness value remains authoritative.</p>`);
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
 const m=meta(),e=employees().map(normEmp),tips=[];if(!health().available)tips.push(['Sync company profile','Company growth and risk need a valid profile.','bad']);if(m.efficiency&&m.efficiency<90)tips.push(['Improve efficiency',`${m.efficiency}% is below the 90% target.`,'warn']);if(m.environment&&m.environment<90)tips.push(['Improve environment',`${m.environment}% can reduce performance.`,'warn']);if(m.popularity&&m.popularity<70)tips.push(['Grow popularity','Review pricing, advertising and customer flow.','warn']);const inactive=e.filter(x=>x.lastTs&&days(now()-x.lastTs)>=3);if(inactive.length)tips.push(['Inactive employees',`${inactive.length} employee(s) inactive for 3+ days.`,'bad']);if(e.length&&meta().maxEmployees&&e.length<meta().maxEmployees)tips.push(['Open employee slots',`${meta().maxEmployees-e.length} position(s) available.`,'warn']);if(!tips.length)tips.push(['No urgent flags','Current exposed metrics are healthy.','good']);return `<div class="ci-grid">${card('Actionable Advice',tips.map(([t,d,c])=>`<div class="ci-advice ${c}"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join(''))}${card('Sync Diagnostics',kv('API source',esc(apiSource()))+kv('Company ID',detectCompanyId()||'Missing')+kv('Company profile',health().available?'Loaded':'Missing')+kv('Employees',employees().length||'Not loaded')+kv('Snapshots',knownSnapshots().length))}</div>`;
}
function timeline(){const events=[];for(const x of knownSnapshots())events.push({ts:x.ts,title:`Company snapshot · ${x.company.name}`,detail:`${x.company.stars}★ · ${money(x.company.weeklyIncome)}`});for(const x of arr(KEY.trains))events.push({ts:x.ts,title:`Train · ${x.employee||'Unassigned'}`,detail:`${x.primary||'Unknown'} · ${money(x.price)}`});for(const x of arr(KEY.contracts))events.push({ts:x.ts,title:`Contract · ${x.employee}`,detail:`${x.totalTrains} trains · ${money(num(x.totalTrains)*num(x.pricePerTrain))}`});events.sort((a,b)=>b.ts-a.ts);return `<div class="ci-actions"><button class="ci-btn" data-act="export-report">EXPORT REPORT CSV</button></div>${card('Company Timeline',events.length?events.slice(0,100).map(x=>`<div class="ci-timeline"><time>${new Date(x.ts).toLocaleString()}</time><b>${esc(x.title)}</b><span>${esc(x.detail)}</span></div>`).join(''):empty('No company events saved yet.'))}`}

function employeeOverview(){
 const m=meta(),w=work(),u=me(),h=health(),position=currentPosition(),effectiveness=currentEffectiveness(),[rl,rc]=h.available?risk(h.score):['UNAVAILABLE','warn'];
 return `<div class="ci-grid">
 ${card('Company',kv('Name',esc(m.name))+kv('Type',h.available?esc(m.type):'—')+kv('Stars',h.available?m.stars+'★':'—')+kv('Age',h.available?fmt(m.age)+' days':'—')+kv('Position',position?esc(position):'Not returned by Torn API'))}
 ${card('My Work Stats',kv('Manual Labor',fmt(w.manual))+kv('Intelligence',fmt(w.intelligence))+kv('Endurance',fmt(w.endurance))+kv('Total',fmt(w.manual+w.intelligence+w.endurance))+kv('Effectiveness',effectiveness==null?'Director data required':fmt(effectiveness)))}
 ${card('Company Risk',h.available?`<div class="ci-score ${rc}"><b>${h.score}/100</b><span>${rl} RISK</span></div>${h.breakdown.slice(0,6).map(x=>`<div class="ci-line"><span>${esc(x.label)} <small>${esc(x.reason)}</small></span><b class="${x.delta>=0?'pos':'neg'}">${x.delta>=0?'+':''}${x.delta}</b></div>`).join('')}`:`<div class="ci-score warn"><b>—</b><span>UNAVAILABLE</span></div><p class="ci-note">Company Profile data is missing. Risk is not calculated from zero or incomplete values.</p>`)}
 ${starOutlook()}
 </div>`;
}
function employeeProgress(){
 const samples=metricSamples(),latest=samples.at(-1),previous=samples.length>1?samples[0]:null,w=work(),position=currentPosition(),effectiveness=currentEffectiveness(),logs=arr(KEY.trains),agreement=arr(KEY.agreements).filter(x=>x.active!==false).at(-1),received7=logs.filter(x=>now()-num(x.ts)<7*86400000).length;
 const delta=k=>previous&&latest?num(latest.workstats?.[k])-num(previous.workstats?.[k]):null;
 const row=(label,value)=>kv(label,value==null?'Waiting for history':`${value>0?'+':''}${fmt(value)}`);
 const weeklyGain=['manual','intelligence','endurance'].reduce((a,k)=>a+Math.max(0,num(delta(k))),0),covered=previous&&latest?Math.max(1,days(num(latest.ts)-num(previous.ts))):0,perDay=covered?weeklyGain/covered:0;
 return `<div class="ci-grid">${card('Current Employment',kv('Position',position?esc(position):'Not returned by Torn API')+kv('Effectiveness',effectiveness==null?'Director data required':fmt(effectiveness))+kv('Tracked samples',samples.length))}${card('Work Stats Progress',row('Manual Labor',delta('manual'))+row('Intelligence',delta('intelligence'))+row('Endurance',delta('endurance'))+kv('Observed daily pace',covered?fmt(Math.round(perDay)):'Waiting for history'))}${card('Train Compliance',agreement?kv('Promised / week',fmt(agreement.perWeek))+kv('Received last 7 days',`${received7} / ${fmt(agreement.perWeek)}`)+kv('Status',received7>=num(agreement.perWeek)?badge('ON TRACK','good'):badge(`${Math.max(0,num(agreement.perWeek)-received7)} DUE`,'warn')):empty('Add a train agreement from Trains to monitor compliance.'))}${card('Projection',covered&&perDay>0?kv('Next 30 days','~+'+fmt(Math.round(perDay*30))+' total work stats')+kv('Next 90 days','~+'+fmt(Math.round(perDay*90))+' total work stats')+`<p class="ci-note">Projection uses your observed saved history and is not a guarantee.</p>`:empty('Refresh after your stats change to create a usable projection.'))}</div>`;
}
function employeePosition(){
 const w=work(),a=advisor(w);
 if(!a.length)return `<div class="ci-grid">${card('Current Position',kv('Position',currentPosition()?esc(currentPosition()):'Not returned by Torn API')+kv('Effectiveness',currentEffectiveness()==null?'Director data required':fmt(currentEffectiveness())))}${card('Best Position Advisor',empty('The current Company Profile did not expose position requirements. No backend request is made from this tab and the script will not invent requirements.')+`<p class="ci-note">Current stats: MAN ${fmt(w.manual)} · INT ${fmt(w.intelligence)} · END ${fmt(w.endurance)}</p>`)}</div>`;
 return card('Best Position Advisor',`<div class="ci-tablewrap"><table><thead><tr><th>Position</th><th>Fit</th><th>MAN</th><th>INT</th><th>END</th><th>Status</th></tr></thead><tbody>${a.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.fit}%</td><td>${fmt(p.req.manual)}</td><td>${fmt(p.req.intelligence)}</td><td>${fmt(p.req.endurance)}</td><td>${badge(p.qualified?'QUALIFIED':'BUILD STATS',p.qualified?'good':'warn')}</td></tr>`).join('')}</tbody></table></div>`);
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
 return card('Smart Roster',e.length?`<div class="ci-tablewrap"><table><thead><tr><th>Employee</th><th>Position</th><th>MAN</th><th>INT</th><th>END</th><th>EE</th><th>Wage</th><th>Flags</th></tr></thead><tbody>${e.map(x=>{let f=[];if(x.effectiveness&&x.effectiveness<90)f.push(badge('LOW EE','bad'));if(x.lastTs&&days(now()-x.lastTs)>=3)f.push(badge('INACTIVE','bad'));return `<tr><td><b>${esc(x.name)}</b><small>#${x.id||''}</small></td><td>${esc(x.position)}</td><td>${fmt(x.manual)}</td><td>${fmt(x.intelligence)}</td><td>${fmt(x.endurance)}</td><td>${fmt(x.effectiveness)}</td><td>${money(x.wage)}</td><td>${f.join(' ')||badge('OK','good')}</td></tr>`}).join('')}</tbody></table></div>`:empty('No employee data available.'));
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
.ci-tabs{display:flex;gap:4px;overflow:auto;padding:7px;background:#0c1219;border-bottom:1px solid #2d3c4e}.ci-tabs button{white-space:nowrap;border:0;background:transparent;color:#95a2b1;padding:8px 10px;border-radius:8px;font-weight:800}.ci-tabs button.active{background:#234d7d;color:#fff}.ci-body{padding:10px}.ci-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ci-card{background:linear-gradient(145deg,#18212d,#131b25);border:1px solid #2d3c4e;border-radius:12px;overflow:hidden;margin-bottom:9px;box-shadow:0 6px 18px rgba(0,0,0,.14)}.ci-title{padding:9px 11px;font-weight:900;border-bottom:1px solid #2d3c4e;color:#f1f5f9}.ci-body .ci-body{padding:9px 11px}.ci-kv{display:grid;grid-template-columns:minmax(110px,1fr) auto;gap:4px 9px;padding:5px 0;border-bottom:1px solid #222b35}.ci-kv span{color:#9eabb9}.ci-kv b{text-align:right}.ci-kv small{grid-column:1/-1;color:#768493}.ci-score{display:flex;justify-content:space-between;align-items:center;padding:11px;border-radius:9px;background:#1b2530;margin-bottom:7px}.ci-score b{font-size:24px}.ci-score.good{border-left:4px solid #49c68d}.ci-score.warn{border-left:4px solid #f2bd52}.ci-score.bad{border-left:4px solid #ef7070}.ci-line{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid #222b35}.ci-line small{color:#748190}.pos{color:#59d29a}.neg{color:#f07d7d}.ci-badge{display:inline-block;padding:3px 6px;border-radius:999px;background:#27313e;color:#ccd5df;font-size:10px;font-weight:800}.ci-badge.good{background:#173a2d;color:#6ee0aa}.ci-badge.warn{background:#493a18;color:#f5cf70}.ci-badge.bad{background:#482323;color:#ff9292}.ci-btn{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;border:1px solid #3d78bf;background:linear-gradient(180deg,#377fcf,#275f9f);color:#fff;border-radius:9px;padding:8px 10px;font-weight:900;cursor:pointer;text-decoration:none}.ci-btn.primary{background:linear-gradient(180deg,#377fcf,#275f9f);border-color:#4b8bd4}.ci-btn.danger{background:linear-gradient(180deg,#733344,#54232f);border-color:#864354;color:#ffd7df}.ci-actions{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:9px}.ci-tablewrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border-bottom:1px solid #28313b;padding:7px 6px;text-align:left;white-space:nowrap}th{color:#91a0af;font-size:10px;text-transform:uppercase}td small{display:block;color:#6f7d8c}.ci-empty{color:#82909e;padding:12px 2px}.ci-note{color:#8391a0;font-size:11px;line-height:1.45}.ci-good-note{color:#78d98b}.ci-field{display:block}.ci-field span{display:block;color:#9ba8b7;font-size:11px;margin-bottom:5px}.ci-field input,.ci-field select{width:100%;box-sizing:border-box;background:#0d141d;color:#f4f7fb;border:1px solid #3a4b61;border-radius:9px;padding:9px}.ci-api-required{display:grid;gap:4px;padding:10px;border:1px solid #66591d;border-radius:9px;background:#211d10;color:#e4c95d;font-size:11px}.ci-api-create{width:100%;margin:9px 0;background:#2a2512;border-color:#7c681e;color:#f5d85f}.ci-api-source{display:flex;justify-content:space-between;gap:8px;margin-bottom:10px;padding:8px;border-radius:7px;background:#101720;color:#9ba8b7;font-size:11px}.ci-api-source b{color:#f5d85f}.ci-api-actions .danger{margin-left:auto}.ci-status{padding:7px 10px;color:#81909f;font-size:11px;border-top:1px solid #26303b;background:#0c1117}.ci-footer{padding:10px 8px 9px;border-top:1px solid #2d3c4e;background:rgba(10,15,21,.72);color:#8e99a8;text-align:center;font:700 10px/1.25 Arial}.ci-footer a{color:#d7a94a;text-decoration:none;font-weight:900}.ci-error{background:#421f25;color:#ffb6bf;padding:7px 9px;border-radius:7px;margin-bottom:7px}.ci-dialogback{position:fixed;inset:0;z-index:1000000;background:#000b;display:flex;align-items:center;justify-content:center;padding:14px}.ci-dialog{width:min(460px,100%);background:linear-gradient(155deg,#1b2634,#111923);border:1px solid #3b4654;border-radius:12px;padding:13px}.ci-dialog h3{margin:0 0 10px;color:#f8fafc}.ci-form{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ci-form .wide{grid-column:1/-1}.ci-compact .ci-body{padding:7px}.ci-compact .ci-card .ci-body{padding:7px 8px}.ci-compact .ci-kv{padding:3px 0}
.ci-snapshots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ci-snapshot{background:#0e1620;border:1px solid #304156;border-radius:10px;padding:10px;min-width:0}.ci-snapshot-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding-bottom:8px;border-bottom:1px solid #283646}.ci-snapshot-head b{color:#f3c85d;font-size:13px;white-space:nowrap}.ci-snapshot-head span{color:#e6edf5;font-weight:800;text-align:right;overflow-wrap:anywhere}.ci-snapshot-position{display:flex;justify-content:space-between;gap:10px;padding:9px 0}.ci-snapshot-position span,.ci-snapshot-stats span{color:#8494a7;font-size:9px;font-weight:900;letter-spacing:.08em}.ci-snapshot-position b{color:#dbe7f4;text-align:right}.ci-snapshot-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.ci-snapshot-stats div{display:flex;flex-direction:column;gap:3px;background:#172230;border-radius:7px;padding:8px;text-align:center}.ci-snapshot-stats b{color:#66d7a1;font-size:14px}
.ci-contract{padding:11px;border-bottom:1px solid #2a3542}.ci-contract>div:first-child{display:flex;justify-content:space-between;gap:10px;margin-bottom:7px}.ci-contract small{color:#f2bd52;font-weight:900}.ci-contract-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;margin-bottom:8px}.ci-advice{display:flex;flex-direction:column;gap:3px;border-left:4px solid #5b6a7b;background:#111a24;padding:9px 10px;margin-bottom:7px;border-radius:7px}.ci-advice span{color:#9aa8b7;font-size:11px}.ci-advice.good{border-color:#49c68d}.ci-advice.warn{border-color:#f2bd52}.ci-advice.bad{border-color:#ef7070}.ci-timeline{display:grid;grid-template-columns:130px minmax(0,1fr);gap:3px 10px;padding:9px 0;border-bottom:1px solid #28313b}.ci-timeline time{grid-row:1/3;color:#8190a0;font-size:10px}.ci-timeline b{color:#e8eef6}.ci-timeline span{color:#91a0af;font-size:11px}
.ci-module-list{display:grid;grid-template-columns:auto 1fr;gap:8px 12px}.ci-module-list b{color:#f2bd52;font-size:10px}.ci-module-list span{color:#cbd5df;font-size:11px;line-height:1.45}
@media(max-width:720px){#ci-root{inset:0 0 72px;padding:0;display:block;overflow:hidden;touch-action:pan-y;overscroll-behavior:contain}.ci-shell{width:100%;height:100%;min-height:0;border:0;border-radius:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding-bottom:24px;box-sizing:border-box}.ci-grid,.ci-snapshots{grid-template-columns:1fr}.ci-head{padding:7px}.ci-brand b{font-size:13px}.ci-brand small{font-size:10px}.ci-mode button{font-size:10px;padding:7px}.ci-tabs{position:sticky;top:58px;z-index:2;padding:5px}.ci-tabs button{font-size:11px;padding:7px 8px}.ci-form{grid-template-columns:1fr}.ci-form .wide{grid-column:auto}#ci-launch{right:8px;bottom:72px}}
`;document.head.appendChild(st);
}
function render(){
 let root=$('#ci-root');if(!S.open){root?.remove();return}
 if(!root){root=document.createElement('div');root.id='ci-root';document.body.appendChild(root)}
 const oldShell=$('.ci-shell',root),oldTabs=$('.ci-tabs',root),scrollTop=oldShell?.scrollTop||0,tabsLeft=oldTabs?.scrollLeft||0;
 root.innerHTML=`<div class="ci-shell ${S.compact?'ci-compact':''}"><div class="ci-head"><div class="ci-brand"><b>🏢 ${APP.name}</b><small>v${APP.version} · Employee & Director Intelligence</small></div><div class="ci-mode"><button type="button" data-mode="employee" class="${S.mode==='employee'?'active':''}">EMPLOYEE</button><button type="button" data-mode="director" class="${S.mode==='director'?'active':''}">DIRECTOR</button></div><button type="button" class="ci-icon" data-act="refresh" title="Refresh">↻</button><button type="button" class="ci-icon api" data-act="settings" title="API Access">🔑</button><button type="button" class="ci-icon" data-act="close" title="Close">✕</button></div><div class="ci-tabs">${tabs().map(([k,n])=>`<button type="button" data-tab="${k}" class="${S.tab===k?'active':''}">${n}</button>`).join('')}</div><div class="ci-body">${S.loading?`<p class="ci-note">Loading Torn API data…</p>`:''}${S.errors.slice(0,4).map(e=>`<div class="ci-error">${esc(e)}</div>`).join('')}${body()}</div><div class="ci-status">${S.updated?'Updated '+new Date(S.updated).toLocaleString():'Not refreshed yet'} · ${esc(apiSource())} · no automated company actions</div><div class="ci-footer">Made with ❤️ by <a href="${PROFILE_URL}" target="_self">SakaLuX [2380374]</a></div></div>`;
 const shell=$('.ci-shell',root),tabBar=$('.ci-tabs',root);if(shell) shell.scrollTop=scrollTop;if(tabBar)tabBar.scrollLeft=tabsLeft;
 $$('button',root).forEach(b=>{if(!b.type)b.type='button'});
 $$('[data-mode]',root).forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();S.mode=b.dataset.mode;S.tab='overview';set(KEY.mode,S.mode);render();if(S.mode==='director'&&!S.data.employees&&!S.loading)refresh()});
 $$('[data-tab]',root).forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();if(S.tab===b.dataset.tab)return;S.tab=b.dataset.tab;render()});
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
 if(a==='settings'){S.tab='settings';render();return}
 if(a==='refresh'){refresh();return}
 if(a==='save-key'){set(KEY.api,$('#ci-api')?.value.trim()||'');alert('API key saved locally.');return}
 if(a==='test-key'){set(KEY.api,$('#ci-api')?.value.trim()||'');S.tab='overview';refresh();return}
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
function installHubBridge(){let b=$('#sakalux-module-bridge-company-intelligence');if(!b){b=document.createElement('button');b.type='button';b.id='sakalux-module-bridge-company-intelligence';b.hidden=true;(document.body||document.documentElement).appendChild(b)}b.dataset.version=APP.version;b.dataset.enabled=String(S.enabled);b.onclick=()=>{const a=b.dataset.action;if(a==='open'){if(!S.enabled)setEnabled(true);S.open=true;S.tab='overview';render()}else if(a==='toggle')setEnabled(!S.enabled);else if(a==='on'||a==='off')setEnabled(a==='on');b.dataset.action='';syncHubBridge()}}
function setEnabled(value){S.enabled=!!value;set(KEY.enabled,S.enabled);if(!S.enabled){S.open=false;$('#ci-root')?.remove();$('#ci-launch')?.remove()}else init();syncHubBridge();try{window.dispatchEvent(new CustomEvent('SakaLuXCompanyIntelligenceStateChanged',{detail:{enabled:S.enabled,version:APP.version}}))}catch{}return S.enabled}
function init(){
 css();S.enabled=get(KEY.enabled,true)!==false;S.compact=get(KEY.compact,true)!==false;S.mode=get(KEY.mode,'employee')||'employee';
 if(!S.data.profile){const cached=get(KEY.company,null),last=arr(KEY.snapshots).filter(x=>x.company?.name&&x.company.name!=='Unknown company').sort((a,b)=>b.ts-a.ts)[0]?.company;if(cached||last)S.data.profile=cached||last}
 installHubBridge();syncHubBridge();
 try{localStorage.setItem('SakaLuX_Installed_company-intelligence',APP.version)}catch{}
 if(S.enabled&&!$('#ci-launch')){const b=document.createElement('button');b.id='ci-launch';b.textContent='🏢 Company Intel';b.onclick=()=>{S.open=true;S.tab='overview';render();if(!S.updated&&apiKey())refresh()};document.body.appendChild(b)}
 try{
  window.SakaLuX=window.SakaLuX||{};
  window.SakaLuX.companyIntelligence={name:APP.name,version:APP.version,open:()=>{if(!S.enabled)setEnabled(true);S.open=true;render()},refresh,mode:m=>{if(['employee','director'].includes(m)){S.mode=m;S.tab='overview';set(KEY.mode,m);render()}},getApiKey:apiKey,setEnabled,toggleEnabled:()=>setEnabled(!S.enabled),isEnabled:()=>S.enabled};
  window.SakaLuXCompanyIntelligence=window.SakaLuX.companyIntelligence;
  window.dispatchEvent(new CustomEvent('SakaLuX:ModuleReady',{detail:{id:'company-intelligence',name:APP.name,version:APP.version,actions:['OPEN','REFRESH','EMPLOYEE','DIRECTOR']}}));
 }catch{}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
