// ==UserScript==
// @name         SakaLuX Company Intelligence
// @namespace    sakalux.torn.company
// @version      1.0.0
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

const APP={name:'SakaLuX Company Intelligence',version:'1.0.0',base:'https://api.torn.com/v2',key:'sak_ci'};
const KEY={
 api:APP.key+':api', mode:APP.key+':mode', compact:APP.key+':compact',
 agreements:APP.key+':agreements', trains:APP.key+':trains',
 offers:APP.key+':offers', snapshots:APP.key+':snapshots'
};
const S={open:false,loading:false,mode:'employee',tab:'overview',compact:true,data:{},errors:[],updated:0};

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

function req(url){
 return new Promise((resolve,reject)=>{
  GM_xmlhttpRequest({
   method:'GET',url,timeout:15000,headers:{Accept:'application/json'},
   onload:r=>{try{const j=JSON.parse(r.responseText);j?.error?reject(new Error(j.error.error||j.error.code||'API error')):resolve(j)}catch(e){reject(e)}},
   onerror:()=>reject(new Error('Network/API request failed')),
   ontimeout:()=>reject(new Error('API timeout'))
  });
 });
}
async function api(path){
 const k=String(get(KEY.api,'')||'').trim();
 if(!k)throw new Error('Add your Torn API key in Settings.');
 return req(`${APP.base}${path}${path.includes('?')?'&':'?'}key=${encodeURIComponent(k)}`);
}
const unwrap=(o,...keys)=>{if(!o||typeof o!=='object')return o;for(const k of keys)if(o[k]!=null)return o[k];return o};
const basic=()=>unwrap(S.data.basic,'basic')||{};
const work=()=>{
 const w=unwrap(S.data.workstats,'workstats','working_stats')||{};
 return {manual:num(first(w,['manual_labor','manual','man'],0)),intelligence:num(first(w,['intelligence','int'],0)),endurance:num(first(w,['endurance','end'],0))};
};
const job=()=>unwrap(S.data.job,'job')||{};
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
  id:num(first(p,['id','company_id'],first(job(),['company_id'],0))),
  name:first(p,['name','company_name'],first(job(),['company_name'],'Unknown company')),
  type:first(p,['type.name','type','company_type','type_name'],first(job(),['company_type','type'],'Unknown')),
  stars:num(first(p,['rating','stars','star_rating'],0)),
  age:num(first(p,['age','days_old','company_age'],0)),
  popularity:num(first(p,['popularity','performance.popularity'],0)),
  efficiency:num(first(p,['efficiency','performance.efficiency'],0)),
  environment:num(first(p,['environment','performance.environment'],0)),
  trains:num(first(p,['trains_available','trains','training_available'],0)),
  dailyIncome:num(first(p,['daily_income','income.daily','income'],0)),
  weeklyIncome:num(first(p,['weekly_income','income.weekly'],0)),
  maxEmployees:num(first(p,['employees_capacity','max_employees','employees_max'],0)),
  directorId:num(first(p,['director_id','director.id'],0))
 };
}
function me(){
 const id=num(first(basic(),['id','player_id'],0));
 return employees().map(normEmp).find(e=>e.id===id)||null;
}
function isDirector(){
 const id=num(first(basic(),['id','player_id'],0)),m=meta();
 return (id&&m.directorId&&id===m.directorId)||String(first(job(),['position','position_name'],'')).toLowerCase().includes('director');
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
 const add=(label,delta,reason)=>{s+=delta;out.push({label,delta,reason})};
 if(m.stars>=8)add('Stars',15,`${m.stars}★`);else if(m.stars>=5)add('Stars',10,`${m.stars}★`);else if(m.stars>=1)add('Stars',3,`${m.stars}★`);else add('Stars',-12,'0★');
 if(m.age>=365)add('Age',10,`${m.age}d`);else if(m.age>=90)add('Age',5,`${m.age}d`);else if(m.age<14)add('Age',-10,`${m.age}d / very new`);
 for(const [n,v] of [['Efficiency',m.efficiency],['Environment',m.environment],['Popularity',m.popularity]]){if(v>=95)add(n,5,`${v}%`);else if(v>=75)add(n,2,`${v}%`);else if(v>0&&v<40)add(n,-5,`${v}%`)}
 const e=employees().map(normEmp),inactive=e.filter(x=>x.lastTs&&days(now()-x.lastTs)>=3).length;
 inactive?add('Inactivity',-Math.min(12,inactive*3),`${inactive} inactive 3+d`):e.length&&add('Activity',3,'No 3+d inactivity detected');
 return {score:clamp(Math.round(s),0,100),breakdown:out};
}
const arr=k=>get(k,[])||[];
function saveSnapshot(){
 const m=meta();if(!m.id&&m.name==='Unknown company')return;
 const a=arr(KEY.snapshots),date=new Date().toISOString().slice(0,10),w=work();
 const snap={date,ts:now(),company:m,workstats:w,myPosition:me()?.position||first(job(),['position','position_name'],'')};
 const i=a.findIndex(x=>x.date===date&&(x.company?.id||x.company?.name)===(m.id||m.name));i>=0?a[i]=snap:a.push(snap);
 set(KEY.snapshots,a.slice(-120));
}
async function refresh(){
 if(S.loading)return;S.loading=true;S.errors=[];render();
 const ep={basic:'/user/basic',workstats:'/user/workstats',job:'/user/job',profile:'/company/profile',employees:'/company/employees',stock:'/company/stock'};
 const r=await Promise.allSettled(Object.entries(ep).map(async([k,p])=>[k,await api(p)]));
 for(const x of r)x.status==='fulfilled'?S.data[x.value[0]]=x.value[1]:S.errors.push(x.reason?.message||String(x.reason));
 S.loading=false;S.updated=now();if(isDirector()&&get(KEY.mode,null)==null)S.mode='director';saveSnapshot();render();
}
const card=(t,b)=>`<section class="ci-card"><div class="ci-title">${t}</div><div class="ci-body">${b}</div></section>`;
const kv=(k,v,h='')=>`<div class="ci-kv"><span>${esc(k)}</span><b>${v}</b>${h?`<small>${esc(h)}</small>`:''}</div>`;
const badge=(x,c='')=>`<span class="ci-badge ${c}">${esc(x)}</span>`;
const empty=x=>`<div class="ci-empty">${esc(x)}</div>`;
function risk(s){return s>=80?['LOW','good']:s>=60?['MODERATE','warn']:['HIGH','bad']}

function employeeOverview(){
 const m=meta(),w=work(),u=me(),h=health(),[rl,rc]=risk(h.score),ags=arr(KEY.agreements),a=ags.filter(x=>x.active!==false).slice(-1)[0],got=arr(KEY.trains).filter(x=>now()-x.ts<7*86400000).length;
 return `<div class="ci-grid">
 ${card('Company',kv('Name',esc(m.name))+kv('Type',esc(m.type))+kv('Stars',m.stars+'★')+kv('Age',fmt(m.age)+' days')+kv('Position',esc(u?.position||first(job(),['position','position_name'],'Unknown'))))}
 ${card('My Work Stats',kv('Manual Labor',fmt(w.manual))+kv('Intelligence',fmt(w.intelligence))+kv('Endurance',fmt(w.endurance))+kv('Total',fmt(w.manual+w.intelligence+w.endurance))+kv('Effectiveness',u?fmt(u.effectiveness):'—'))}
 ${card('Company Risk',`<div class="ci-score ${rc}"><b>${h.score}/100</b><span>${rl} RISK</span></div>${h.breakdown.slice(0,6).map(x=>`<div class="ci-line"><span>${esc(x.label)} <small>${esc(x.reason)}</small></span><b class="${x.delta>=0?'pos':'neg'}">${x.delta>=0?'+':''}${x.delta}</b></div>`).join('')}`)}
 ${card('Train Promise',a?kv('Promised',fmt(a.perWeek)+'/week')+kv('Received 7d',got+'/'+fmt(a.perWeek))+kv('Cost',a.cost?money(a.cost)+'/train':'FREE')+kv('Starts',esc(a.startDate||'Now'))+`<button class="ci-btn" data-act="log-train">+ Log train</button>`:empty('No train agreement saved.')+`<button class="ci-btn" data-act="new-agreement">Add agreement</button>`)}
 </div>`;
}
function employeePosition(){
 const w=work(),a=advisor(w);
 if(!a.length)return card('Best Position Advisor',empty('The current company profile did not expose position requirements. Company Intelligence will not invent them.')+`<p class="ci-note">Current: MAN ${fmt(w.manual)} · INT ${fmt(w.intelligence)} · END ${fmt(w.endurance)}</p>`);
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
 const a=arr(KEY.snapshots).slice().sort((x,y)=>y.ts-x.ts);
 return card('Daily Snapshots',a.length?`<div class="ci-tablewrap"><table><thead><tr><th>Date</th><th>Company</th><th>Stars</th><th>Position</th><th>MAN</th><th>INT</th><th>END</th></tr></thead><tbody>${a.slice(0,60).map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.company?.name)}</td><td>${fmt(x.company?.stars)}★</td><td>${esc(x.myPosition)}</td><td>${fmt(x.workstats?.manual)}</td><td>${fmt(x.workstats?.intelligence)}</td><td>${fmt(x.workstats?.endurance)}</td></tr>`).join('')}</tbody></table></div>`:empty('Snapshots are saved automatically on refresh.'));
}
function directorOverview(){
 const m=meta(),h=health(),[rl,rc]=risk(h.score),e=employees().map(normEmp),pay=e.reduce((a,x)=>a+x.wage,0);
 return `<div class="ci-grid">
 ${card('Company Health',`<div class="ci-score ${rc}"><b>${h.score}/100</b><span>${rl}</span></div>${h.breakdown.map(x=>`<div class="ci-line"><span>${esc(x.label)} <small>${esc(x.reason)}</small></span><b class="${x.delta>=0?'pos':'neg'}">${x.delta>=0?'+':''}${x.delta}</b></div>`).join('')}`)}
 ${card('Performance',kv('Stars',m.stars+'★')+kv('Popularity',m.popularity+'%')+kv('Efficiency',m.efficiency+'%')+kv('Environment',m.environment+'%')+kv('Age',fmt(m.age)+' days'))}
 ${card('Roster',kv('Employees',e.length+(m.maxEmployees?' / '+m.maxEmployees:''))+kv('Low EE',e.filter(x=>x.effectiveness&&x.effectiveness<90).length)+kv('Payroll/day',money(pay))+kv('Trains available',fmt(m.trains)))}
 ${card('Financial Snapshot',kv('Daily income',money(m.dailyIncome))+kv('Weekly income',money(m.weeklyIncome))+kv('Payroll/week',money(pay*7))+kv('Simple margin',money(m.weeklyIncome-pay*7),'before stock/ads/other costs'))}
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
 return `<div class="ci-grid">${card('API Settings',`<label class="ci-field"><span>Torn API key</span><input id="ci-api" type="password" value="${esc(get(KEY.api,''))}" placeholder="Paste API key"></label><div class="ci-actions"><button class="ci-btn primary" data-act="save-key">Save</button><button class="ci-btn" data-act="test-key">Test & refresh</button></div><p class="ci-note">Stored locally only.</p>`)}
 ${card('Interface',`<label class="ci-check"><input id="ci-compact" type="checkbox" ${S.compact?'checked':''}> Compact PDA mode</label>`)}
 ${card('Local data',`<div class="ci-actions"><button class="ci-btn" data-act="export">Export</button><button class="ci-btn" data-act="import">Import</button><button class="ci-btn danger" data-act="clear">Clear history</button></div>`)}</div>`;
}
function body(){
 if(S.tab==='settings')return settings();
 if(S.mode==='director'){
  if(S.tab==='employees')return directorEmployees();
  if(S.tab==='trains')return directorTrains();
  if(S.tab==='finance')return directorFinance();
  if(S.tab==='stock')return directorStock();
  if(S.tab==='history')return history();
  return directorOverview();
 }
 if(S.tab==='position')return employeePosition();
 if(S.tab==='trains')return employeeTrains();
 if(S.tab==='offers')return employeeOffers();
 if(S.tab==='history')return history();
 return employeeOverview();
}
const tabs=()=>S.mode==='director'?[['overview','Overview'],['employees','Employees'],['trains','Trains'],['finance','Finance'],['stock','Stock'],['history','History']]:[['overview','Overview'],['position','Position'],['trains','Trains'],['offers','Offers'],['history','History']];

function css(){
 if($('#ci-style'))return;
 const st=document.createElement('style');st.id='ci-style';st.textContent=`
#ci-launch{position:fixed;right:12px;bottom:82px;z-index:999998;background:#111821;color:#ffd166;border:1px solid #3a4554;border-radius:999px;padding:10px 14px;font:700 13px Arial;box-shadow:0 8px 24px #0008;cursor:pointer}
#ci-root{position:fixed;inset:0;z-index:999999;background:#05080bd9;color:#edf2f7;font-family:Arial,sans-serif;display:flex;align-items:flex-start;justify-content:center;padding:16px;box-sizing:border-box;overflow:auto}
.ci-shell{width:min(1180px,100%);background:#10151c;border:1px solid #303946;border-radius:16px;box-shadow:0 22px 80px #000b;overflow:hidden}
.ci-head{display:flex;gap:8px;align-items:center;padding:11px 12px;background:#151c25;border-bottom:1px solid #2c3541;position:sticky;top:0;z-index:3}.ci-brand{flex:1;min-width:0}.ci-brand b{display:block;color:#ffd166}.ci-brand small{color:#8390a0}.ci-mode{display:flex;border:1px solid #394454;border-radius:9px;overflow:hidden}.ci-mode button,.ci-icon{border:0;background:#111821;color:#b7c2ce;padding:8px 9px;cursor:pointer}.ci-mode button.active{background:#293649;color:#fff}.ci-icon{border:1px solid #354151;border-radius:8px}
.ci-tabs{display:flex;gap:4px;overflow:auto;padding:7px;background:#0c1117;border-bottom:1px solid #27313d}.ci-tabs button{white-space:nowrap;border:0;background:transparent;color:#95a2b1;padding:8px 10px;border-radius:8px;font-weight:700}.ci-tabs button.active{background:#222d3b;color:#ffd166}.ci-body{padding:10px}.ci-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ci-card{background:#151b23;border:1px solid #2a3441;border-radius:11px;overflow:hidden;margin-bottom:9px}.ci-title{padding:9px 11px;font-weight:800;border-bottom:1px solid #29333f}.ci-body .ci-body{padding:9px 11px}.ci-kv{display:grid;grid-template-columns:minmax(110px,1fr) auto;gap:4px 9px;padding:5px 0;border-bottom:1px solid #222b35}.ci-kv span{color:#9eabb9}.ci-kv b{text-align:right}.ci-kv small{grid-column:1/-1;color:#768493}.ci-score{display:flex;justify-content:space-between;align-items:center;padding:11px;border-radius:9px;background:#1b2530;margin-bottom:7px}.ci-score b{font-size:24px}.ci-score.good{border-left:4px solid #49c68d}.ci-score.warn{border-left:4px solid #f2bd52}.ci-score.bad{border-left:4px solid #ef7070}.ci-line{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid #222b35}.ci-line small{color:#748190}.pos{color:#59d29a}.neg{color:#f07d7d}.ci-badge{display:inline-block;padding:3px 6px;border-radius:999px;background:#27313e;color:#ccd5df;font-size:10px;font-weight:800}.ci-badge.good{background:#173a2d;color:#6ee0aa}.ci-badge.warn{background:#493a18;color:#f5cf70}.ci-badge.bad{background:#482323;color:#ff9292}.ci-btn{border:1px solid #3b4857;background:#1b2430;color:#e6edf5;border-radius:8px;padding:8px 10px;font-weight:700;cursor:pointer}.ci-btn.primary{background:#a8791d;border-color:#d1a03d}.ci-btn.danger{border-color:#6c3838;color:#ffabab}.ci-actions{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:9px}.ci-tablewrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border-bottom:1px solid #28313b;padding:7px 6px;text-align:left;white-space:nowrap}th{color:#91a0af;font-size:10px;text-transform:uppercase}td small{display:block;color:#6f7d8c}.ci-empty{color:#82909e;padding:12px 2px}.ci-note{color:#8391a0;font-size:11px;line-height:1.45}.ci-field{display:block}.ci-field span{display:block;color:#9ba8b7;font-size:11px;margin-bottom:5px}.ci-field input,.ci-field select{width:100%;box-sizing:border-box;background:#0e141b;color:#e8edf2;border:1px solid #354151;border-radius:8px;padding:9px}.ci-status{padding:7px 10px;color:#81909f;font-size:11px;border-top:1px solid #26303b;background:#0c1117}.ci-error{background:#421f25;color:#ffb6bf;padding:7px 9px;border-radius:7px;margin-bottom:7px}.ci-dialogback{position:fixed;inset:0;z-index:1000000;background:#000b;display:flex;align-items:center;justify-content:center;padding:14px}.ci-dialog{width:min(460px,100%);background:#151c24;border:1px solid #3b4654;border-radius:12px;padding:13px}.ci-dialog h3{margin:0 0 10px;color:#ffd166}.ci-form{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ci-form .wide{grid-column:1/-1}.ci-compact .ci-body{padding:7px}.ci-compact .ci-card .ci-body{padding:7px 8px}.ci-compact .ci-kv{padding:3px 0}
@media(max-width:720px){#ci-root{padding:0;align-items:stretch}.ci-shell{min-height:100vh;border:0;border-radius:0}.ci-grid{grid-template-columns:1fr}.ci-head{padding:7px}.ci-brand b{font-size:13px}.ci-brand small{font-size:10px}.ci-mode button{font-size:10px;padding:7px}.ci-tabs{padding:5px}.ci-tabs button{font-size:11px;padding:7px 8px}.ci-form{grid-template-columns:1fr}.ci-form .wide{grid-column:auto}#ci-launch{right:8px;bottom:72px}}
`;document.head.appendChild(st);
}
function render(){
 let root=$('#ci-root');if(!S.open){root?.remove();return}
 if(!root){root=document.createElement('div');root.id='ci-root';document.body.appendChild(root)}
 root.innerHTML=`<div class="ci-shell ${S.compact?'ci-compact':''}"><div class="ci-head"><div class="ci-brand"><b>${APP.name}</b><small>v${APP.version} · SakaLuX [2380374]</small></div><div class="ci-mode"><button data-mode="employee" class="${S.mode==='employee'?'active':''}">EMPLOYEE</button><button data-mode="director" class="${S.mode==='director'?'active':''}">DIRECTOR</button></div><button class="ci-icon" data-act="refresh">↻</button><button class="ci-icon" data-act="settings">⚙</button><button class="ci-icon" data-act="close">✕</button></div><div class="ci-tabs">${tabs().map(([k,n])=>`<button data-tab="${k}" class="${S.tab===k?'active':''}">${n}</button>`).join('')}</div><div class="ci-body">${S.loading?`<p class="ci-note">Loading Torn API data…</p>`:''}${S.errors.slice(0,4).map(e=>`<div class="ci-error">${esc(e)}</div>`).join('')}${body()}</div><div class="ci-status">${S.updated?'Updated '+new Date(S.updated).toLocaleString():'Not refreshed yet'} · no automated company actions</div></div>`;
 $$('[data-mode]',root).forEach(b=>b.onclick=()=>{S.mode=b.dataset.mode;S.tab='overview';set(KEY.mode,S.mode);render()});
 $$('[data-tab]',root).forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;render()});
 $$('[data-act]',root).forEach(b=>b.onclick=()=>act(b.dataset.act));
 const c=$('#ci-compact',root);if(c)c.onchange=()=>{S.compact=c.checked;set(KEY.compact,S.compact);render()};
}
function dialog(title,fields,onSave){
 const back=document.createElement('div');back.className='ci-dialogback';
 back.innerHTML=`<div class="ci-dialog"><h3>${esc(title)}</h3><div class="ci-form">${fields.map(f=>f.type==='select'?`<label class="ci-field ${f.wide?'wide':''}"><span>${esc(f.label)}</span><select name="${esc(f.name)}">${f.options.map(o=>`<option>${esc(o)}</option>`).join('')}</select></label>`:`<label class="ci-field ${f.wide?'wide':''}"><span>${esc(f.label)}</span><input name="${esc(f.name)}" type="${f.type||'text'}" value="${esc(f.value??'')}" placeholder="${esc(f.placeholder||'')}"></label>`).join('')}</div><div class="ci-actions"><button class="ci-btn primary" data-save>Save</button><button class="ci-btn" data-cancel>Cancel</button></div></div>`;
 document.body.appendChild(back);$('[data-cancel]',back).onclick=()=>back.remove();$('[data-save]',back).onclick=()=>{const d={};fields.forEach(f=>d[f.name]=$(`[name="${CSS.escape(f.name)}"]`,back)?.value??'');onSave(d);back.remove();render()};
}
function act(a){
 if(a==='close'){S.open=false;render();return}
 if(a==='settings'){S.tab='settings';render();return}
 if(a==='refresh'){refresh();return}
 if(a==='save-key'){set(KEY.api,$('#ci-api')?.value.trim()||'');alert('API key saved locally.');return}
 if(a==='test-key'){set(KEY.api,$('#ci-api')?.value.trim()||'');S.tab='overview';refresh();return}
 if(a==='new-agreement')return dialog('Train Agreement',[{name:'company',label:'Company / employee',value:meta().name},{name:'perWeek',label:'Trains promised/week',type:'number',value:10},{name:'cost',label:'Cost/train (0 = free)',type:'number',value:0},{name:'startDate',label:'Starts / wait note',value:'Immediately'},{name:'note',label:'Notes',wide:true}],d=>{let x=arr(KEY.agreements);x.push({...d,perWeek:num(d.perWeek),cost:num(d.cost),ts:now(),active:true});set(KEY.agreements,x)});
 if(a==='log-train')return dialog('Log Train',[{name:'primary',label:'Primary stat',type:'select',options:['Intelligence','Endurance','Manual Labor','Unknown']},{name:'secondary',label:'Secondary stat',type:'select',options:['Endurance','Intelligence','Manual Labor','Unknown']},{name:'price',label:'Price received/paid',type:'number',value:0},{name:'note',label:'Note',wide:true}],d=>{let x=arr(KEY.trains);x.push({...d,price:num(d.price),ts:now()});set(KEY.trains,x)});
 if(a==='new-offer')return dialog('Add Company Offer',[{name:'company',label:'Company name'},{name:'type',label:'Company type'},{name:'stars',label:'Stars',type:'number',value:0},{name:'dailySalary',label:'Salary/day',type:'number',value:0},{name:'trainsPerWeek',label:'Trains/week',type:'number',value:0},{name:'trainCost',label:'Cost/train',type:'number',value:0},{name:'trainValue',label:'Your value/train',type:'number',value:500000}],d=>{let x=arr(KEY.offers);x.push({...d,stars:num(d.stars),dailySalary:num(d.dailySalary),trainsPerWeek:num(d.trainsPerWeek),trainCost:num(d.trainCost),trainValue:num(d.trainValue),ts:now()});set(KEY.offers,x)});
 if(a==='export'){const data={version:APP.version,agreements:arr(KEY.agreements),trains:arr(KEY.trains),offers:arr(KEY.offers),snapshots:arr(KEY.snapshots)};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),ln=document.createElement('a');ln.href=u;ln.download=`SakaLuX-Company-Intelligence-${new Date().toISOString().slice(0,10)}.json`;ln.click();setTimeout(()=>URL.revokeObjectURL(u),1000);return}
 if(a==='import'){const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{try{const d=JSON.parse(await i.files[0].text());if(d.agreements)set(KEY.agreements,d.agreements);if(d.trains)set(KEY.trains,d.trains);if(d.offers)set(KEY.offers,d.offers);if(d.snapshots)set(KEY.snapshots,d.snapshots);alert('Import complete.');render()}catch(e){alert('Import failed: '+e.message)}};i.click();return}
 if(a==='clear'&&confirm('Clear local train, offer and snapshot history?')){[KEY.agreements,KEY.trains,KEY.offers,KEY.snapshots].forEach(del);render()}
}
function init(){
 css();S.compact=get(KEY.compact,true)!==false;S.mode=get(KEY.mode,'employee')||'employee';
 if(!$('#ci-launch')){const b=document.createElement('button');b.id='ci-launch';b.textContent='🏢 Company Intel';b.onclick=()=>{S.open=true;S.tab='overview';render();if(!S.updated&&get(KEY.api,''))refresh()};document.body.appendChild(b)}
 try{
  window.SakaLuX=window.SakaLuX||{};
  window.SakaLuX.companyIntelligence={name:APP.name,version:APP.version,open:()=>{S.open=true;render()},refresh,mode:m=>{if(['employee','director'].includes(m)){S.mode=m;S.tab='overview';set(KEY.mode,m);render()}}};
  window.dispatchEvent(new CustomEvent('SakaLuX:ModuleReady',{detail:{id:'company-intelligence',name:APP.name,version:APP.version,actions:['OPEN','REFRESH','EMPLOYEE','DIRECTOR']}}));
 }catch{}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();