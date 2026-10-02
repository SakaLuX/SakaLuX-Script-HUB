#!/usr/bin/env python3
from pathlib import Path
from datetime import date
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
TEST = ROOT / 'tests' / 'suite-daily-progress-regression.cjs'
VERSION = '0.9.968'
BEGIN = '/* SakaLuX Suite Daily Progress — BEGIN */'
END = '/* SakaLuX Suite Daily Progress — END */'
MARKER = '/* SakaLuX Smart Daily Checklist v2.0.0 — v0.9.968 */'

BLOCK = r'''/* SakaLuX Suite Daily Progress — BEGIN */
(() => {
  'use strict';

  const API_VERSION = '2.0.0';
  const STORAGE_KEY = 'sakalux_suite_smart_daily_v2';
  const LEGACY_KEYS = ['sakalux_suite_daily_progress_v1', 'sakalux_suite_daily_progress'];
  const MAX_DAYS = 30;
  const ROUTE_COALESCE_MS = 30000;
  const g = globalThis;

  const TASKS = Object.freeze([
    { id:'energy_refill', label:'Energy refill', icon:'⚡', category:'Resources', auto:'api', endpoint:'refills' },
    { id:'nerve_refill', label:'Nerve refill', icon:'🧠', category:'Resources', auto:'api', endpoint:'refills' },
    { id:'drug', label:'Drug / drug cooldown', icon:'💊', category:'Resources', auto:'api', endpoint:'cooldowns' },
    { id:'booster', label:'Booster cooldown', icon:'🍬', category:'Resources', auto:'api', endpoint:'cooldowns' },
    { id:'medical', label:'Medical cooldown', icon:'🩸', category:'Resources', auto:'api', endpoint:'cooldowns', optional:true },
    { id:'missions', label:'Daily missions', icon:'🎯', category:'Daily', auto:'api+route', endpoint:'missions', routes:['missions'] },
    { id:'shops', label:'City shops 100/100', icon:'🛒', category:'Daily', auto:'route', routes:['shops'] },
    { id:'virus', label:'Virus coding', icon:'💻', category:'Daily', auto:'api', endpoint:'virus', optional:true },
    { id:'education', label:'Education course', icon:'🎓', category:'Daily', auto:'api', endpoint:'education', optional:true },
    { id:'casino', label:'Casino tokens', icon:'🎰', category:'Daily', auto:'api', endpoint:'casino', optional:true },
    { id:'wheels', label:'Daily wheels', icon:'🎡', category:'Daily', auto:'route', routes:['wheels'], optional:true },
    { id:'city', label:'City / map check', icon:'🏙️', category:'Activity', auto:'route', routes:['city'] },
    { id:'gym', label:'Gym / energy spent', icon:'🏋️', category:'Activity', auto:'route', routes:['gym'] },
    { id:'crimes', label:'Crimes / nerve spent', icon:'🔫', category:'Activity', auto:'route', routes:['crimes'] },
    { id:'travel', label:'Travel', icon:'✈️', category:'Activity', auto:'api+route', endpoint:'travel', routes:['travel'] },
    { id:'racing', label:'Racing', icon:'🏎️', category:'Activity', auto:'route', routes:['racing'], optional:true },
    { id:'job', label:'Job / company check', icon:'🏢', category:'Activity', auto:'route', routes:['job'], optional:true },
    { id:'faction_oc', label:'Faction / OC readiness', icon:'👥', category:'Faction', auto:'api+route', endpoint:'organizedcrime', routes:['faction'], optional:true },
    { id:'prayer', label:'Church prayer', icon:'⛪', category:'Daily', auto:'route', routes:['prayer'], optional:true },
    { id:'review', label:'Review daily plan', icon:'📋', category:'Custom', auto:'manual' }
  ]);

  const ALIASES = Object.freeze({ faction:'faction_oc' });
  const ENDPOINTS = Object.freeze({
    refills:'https://api.torn.com/v2/user/refills',
    cooldowns:'https://api.torn.com/v2/user/cooldowns',
    missions:'https://api.torn.com/v2/user/missions',
    virus:'https://api.torn.com/v2/user/virus',
    education:'https://api.torn.com/v2/user/education',
    casino:'https://api.torn.com/v2/user/casino',
    travel:'https://api.torn.com/v2/user/travel',
    organizedcrime:'https://api.torn.com/v2/user/organizedcrime'
  });

  const state = { showCompleted:true, filter:'all', syncing:false, apiError:'', lastApiAt:0, lastData:{} };

  function dayKey(d = new Date()) {
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function startOfTodayMs() { const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); }
  function nowSec(){ return Math.floor(Date.now()/1000); }
  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function safeJson(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
  function rootData(x, key){ return x?.[key] ?? x?.data?.[key] ?? x?.data ?? x ?? {}; }
  function first(obj, paths, fallback=undefined){
    for(const p of paths){ let cur=obj; let ok=true; for(const k of p.split('.')){ if(cur==null || !(k in Object(cur))){ok=false;break;} cur=cur[k]; } if(ok && cur!==undefined) return cur; }
    return fallback;
  }
  function asBool(v){ if(typeof v==='boolean') return v; if(typeof v==='number') return v>0; if(typeof v==='string') return /^(1|true|yes|used|complete|completed|done|active)$/i.test(v); return false; }
  function fmtDuration(sec){ sec=Math.max(0,Number(sec)||0); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return h?`${h}h ${m}m`:`${m}m`; }

  function blankTask(t){ return { id:t.id, status:'pending', done:false, source:'none', detail:'Waiting for sync', updatedAt:0, optional:!!t.optional }; }
  function freshDay(key=dayKey()){
    const tasks={}; for(const t of TASKS) tasks[t.id]=blankTask(t);
    return { date:key, tasks, custom:[], activities:[], manual:{}, api:{lastAt:0,error:''}, updatedAt:Date.now() };
  }
  function freshStore(){ return { schemaVersion:2, days:{}, prefs:{showCompleted:true,filter:'all'} }; }

  function migrateLegacy(store){
    if(store?.schemaVersion===2) return store;
    const out=freshStore();
    if(store?.days && typeof store.days==='object'){
      for(const [k,v] of Object.entries(store.days)){
        const d=freshDay(k);
        const old=v?.objectives||{};
        for(const [id,val] of Object.entries(old)){
          const tid=ALIASES[id]||id; if(d.tasks[tid] && val){ d.tasks[tid]={...d.tasks[tid],status:'done',done:true,source:'legacy',detail:'Carried from Daily Progress',updatedAt:Number(v.updatedAt)||Date.now()}; }
        }
        d.custom=Array.isArray(v?.custom)?v.custom:[];
        d.activities=Array.isArray(v?.activities)?v.activities:[];
        out.days[k]=d;
      }
    }
    return out;
  }
  function load(){
    let raw=null; try{raw=localStorage.getItem(STORAGE_KEY);}catch{}
    if(!raw){ for(const k of LEGACY_KEYS){ try{const x=localStorage.getItem(k); if(x){raw=x;break;}}catch{} } }
    const parsed=migrateLegacy(safeJson(raw,freshStore()));
    parsed.prefs=parsed.prefs||{showCompleted:true,filter:'all'};
    state.showCompleted=parsed.prefs.showCompleted!==false; state.filter=parsed.prefs.filter||'all';
    return parsed;
  }
  function prune(store){ const keys=Object.keys(store.days||{}).sort().reverse(); for(const k of keys.slice(MAX_DAYS)) delete store.days[k]; return store; }
  function save(store){ store.prefs={showCompleted:state.showCompleted,filter:state.filter}; prune(store); try{localStorage.setItem(STORAGE_KEY,JSON.stringify(store));return true;}catch{return false;} }
  function getStore(){ const s=load(); const k=dayKey(); if(!s.days[k]){s.days[k]=freshDay(k);save(s);} return s; }
  function get(){ const s=getStore(); return clone(s.days[dayKey()]); }
  function mutate(fn){ const s=getStore(), k=dayKey(), d=s.days[k]||freshDay(k); fn(d,s); d.updatedAt=Date.now(); s.days[k]=d; save(s); render(); return clone(d); }

  function setTask(id, patch={}){
    id=ALIASES[id]||id;
    return mutate(d=>{ if(!d.tasks[id]) return; const prev=d.tasks[id]; const next={...prev,...patch,updatedAt:Date.now()}; next.done=next.status==='done'; d.tasks[id]=next; });
  }
  function setObjective(id, done=true){
    id=ALIASES[id]||id;
    const custom=get().custom.find(x=>x.id===id);
    if(custom) return mutate(d=>{ const x=d.custom.find(y=>y.id===id); if(x){x.done=!!done;x.updatedAt=Date.now();} });
    return setTask(id,{status:done?'done':'action',source:'manual',detail:done?'Marked complete manually':'Marked incomplete manually'});
  }
  function addObjective(label){
    const text=String(label||'').trim(); if(!text) return '';
    const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
    mutate(d=>d.custom.push({id,label:text,done:false,createdAt:Date.now(),updatedAt:Date.now()})); return id;
  }
  function removeObjective(id){ return mutate(d=>{ d.custom=d.custom.filter(x=>x.id!==id); }); }

  function routeType(url=location.href){
    const u=String(url).toLowerCase();
    if(/gym\.php|sid=gym/.test(u)) return 'gym';
    if(/loader\.php.*sid=crimes|crimes\.php|\/crimes/.test(u)) return 'crimes';
    if(/sid=missions|missions\.php/.test(u)) return 'missions';
    if(/factions\.php|faction/.test(u)) return 'faction';
    if(/travelagency|sid=travel|travel/.test(u)) return 'travel';
    if(/city\.php|sid=city|\/city/.test(u)) return 'city';
    if(/race|racing/.test(u)) return 'racing';
    if(/joblist|companies|company|jobs\.php/.test(u)) return 'job';
    if(/church|pray/.test(u)) return 'prayer';
    if(/casino.*wheel|wheel/.test(u)) return 'wheels';
    if(/shops|shop\.php|points\.php/.test(u)) return 'shops';
    return '';
  }
  function recordActivity(type, url=location.href){
    type=ALIASES[type]||type; const now=Date.now();
    return mutate(d=>{
      const last=d.activities[d.activities.length-1];
      if(!last || last.type!==type || now-Number(last.at||0)>ROUTE_COALESCE_MS) d.activities.push({type,url:String(url),at:now});
      d.activities=d.activities.slice(-60);
      const targets=TASKS.filter(t=>(t.routes||[]).includes(type) || t.id===type);
      for(const t of targets){
        const cur=d.tasks[t.id];
        if(cur && cur.status!=='done') d.tasks[t.id]={...cur,status:'done',done:true,source:'route',detail:'Detected from Torn activity',updatedAt:now};
      }
    });
  }

  function getApiKey(){
    try{ const k=String(g.SakaLuXScriptHub?.getApiKey?.()||'').trim(); if(k) return k; }catch{}
    const candidates=['sakalux_master_suite_settings_v1','SakaLuX_HUB_SETTINGS_V16','SakaLuX_HUB_SETTINGS_V15'];
    const walk=o=>{ if(!o||typeof o!=='object') return ''; for(const [k,v] of Object.entries(o)){ if(/^(apikey|api_key|key)$/i.test(k)&&typeof v==='string'&&v.trim().length>=8) return v.trim(); if(typeof v==='object'){const f=walk(v);if(f)return f;} } return ''; };
    for(const key of candidates){ try{const f=walk(safeJson(localStorage.getItem(key),null));if(f)return f;}catch{} }
    return '';
  }
  function httpJson(url){
    const key=getApiKey(); if(!key) return Promise.reject(new Error('No Torn API key available'));
    const full=url+(url.includes('?')?'&':'?')+'key='+encodeURIComponent(key)+'&striptags=true';
    return new Promise((resolve,reject)=>{
      try{
        if(typeof GM_xmlhttpRequest==='function'){
          GM_xmlhttpRequest({method:'GET',url:full,timeout:15000,onload:r=>{try{const j=JSON.parse(r.responseText||'{}');if(j?.error)reject(new Error(j.error.error||j.error.code||'API error'));else resolve(j);}catch(e){reject(e);}},onerror:()=>reject(new Error('Network error')),ontimeout:()=>reject(new Error('API timeout'))});
          return;
        }
      }catch{}
      fetch(full,{credentials:'omit'}).then(r=>r.json()).then(j=>{if(j?.error)throw new Error(j.error.error||j.error.code||'API error');return j;}).then(resolve,reject);
    });
  }

  function interpret(name,data){
    const d=rootData(data,name);
    if(name==='refills'){
      const e=first(d,['energy','energy_refill','refills.energy'],{}), n=first(d,['nerve','nerve_refill','refills.nerve'],{});
      const used=x=>asBool(first(x,['used','is_used','used_today'],false)) || first(x,['available','is_available'],undefined)===false || Number(first(x,['timestamp','used_at'],0))*1000>=startOfTodayMs();
      setTask('energy_refill',{status:used(e)?'done':'action',source:'api',detail:used(e)?'Used today':'Available'});
      setTask('nerve_refill',{status:used(n)?'done':'action',source:'api',detail:used(n)?'Used today':'Available'});
    }
    if(name==='cooldowns'){
      const c=rootData(data,'cooldowns');
      const drug=Number(first(c,['drug','drug_cooldown'],0))||0, booster=Number(first(c,['booster','booster_cooldown'],0))||0, med=Number(first(c,['medical','medical_cooldown'],0))||0;
      setTask('drug',{status:drug>0?'done':'action',source:'api',detail:drug>0?`Cooldown ${fmtDuration(drug)}`:'No drug cooldown'});
      setTask('booster',{status:booster>0?'done':'action',source:'api',detail:booster>0?`Cooldown ${fmtDuration(booster)}`:'No booster cooldown'});
      setTask('medical',{status:med>0?'done':'na',source:'api',detail:med>0?`Cooldown ${fmtDuration(med)}`:'No medical cooldown'});
    }
    if(name==='missions'){
      const arr=Array.isArray(d)?d:(Array.isArray(d?.missions)?d.missions:[]);
      if(!arr.length) setTask('missions',{status:'done',source:'api',detail:'No active missions'});
      else { const open=arr.filter(x=>!asBool(first(x,['completed','is_complete','done'],false))); setTask('missions',{status:open.length?'action':'done',source:'api',detail:open.length?`${open.length} active mission${open.length===1?'':'s'}`:'All missions complete'}); }
    }
    if(name==='virus'){
      const v=rootData(data,'virus'); const active=!!first(v,['virus','name','item','started_at','time_started'],null); const left=Number(first(v,['time_left','remaining','seconds_left'],0))||0;
      setTask('virus',{status:active?'done':'action',source:'api',detail:active?`Coding${left?` • ${fmtDuration(left)} left`:''}`:'No virus coding'});
    }
    if(name==='education'){
      const e=rootData(data,'education'); const cur=first(e,['current','education_current','course','current_course'],null); const left=Number(first(e,['timeleft','time_left','remaining'],first(cur||{},['timeleft','time_left','remaining'],0)))||0;
      const completed=Array.isArray(first(e,['completed','education_completed'],null));
      setTask('education',{status:cur?'done':(completed?'na':'action'),source:'api',detail:cur?`Course active${left?` • ${fmtDuration(left)} left`:''}`:(completed?'No active course':'Start a course')});
    }
    if(name==='casino'){
      const c=rootData(data,'casino'); const tokens=Number(first(c,['tokens','casino_tokens','token_refill'],NaN));
      if(Number.isFinite(tokens)) setTask('casino',{status:tokens<=0?'done':'action',source:'api',detail:tokens<=0?'Tokens used':`${tokens} token${tokens===1?'':'s'} remaining`});
      else setTask('casino',{status:'na',source:'api',detail:'Casino token state unavailable'});
    }
    if(name==='travel'){
      const t=rootData(data,'travel'); const status=String(first(t,['status','state'],'')); const destination=String(first(t,['destination','country','name'],'')); const active=!!status && !/home|torn city|idle|none/i.test(status);
      if(active||destination) setTask('travel',{status:'done',source:'api',detail:[status,destination].filter(Boolean).join(' • ')||'Travel detected'});
    }
    if(name==='organizedcrime'){
      const oc=rootData(data,'organizedcrime'); const exists=oc && typeof oc==='object' && Object.keys(oc).length>0; const ready=asBool(first(oc,['ready','is_ready','ready_at'],false)); const status=String(first(oc,['status','state'],''));
      setTask('faction_oc',{status:ready?'done':(exists?'action':'na'),source:'api',detail:ready?'OC ready':(exists?(status||'OC in progress'):'No current OC')});
    }
  }

  async function refreshApi(force=false){
    if(state.syncing) return false;
    if(!force && state.lastApiAt && Date.now()-state.lastApiAt<60000) return true;
    const key=getApiKey(); if(!key){ state.apiError='API key unavailable'; render(); return false; }
    state.syncing=true; state.apiError=''; render();
    const entries=Object.entries(ENDPOINTS);
    const results=await Promise.allSettled(entries.map(([,url])=>httpJson(url)));
    let ok=0, err='';
    results.forEach((r,i)=>{ const name=entries[i][0]; if(r.status==='fulfilled'){ok++;state.lastData[name]=r.value;try{interpret(name,r.value);}catch(e){err=String(e?.message||e);}} else err=String(r.reason?.message||r.reason||'API error'); });
    state.lastApiAt=Date.now(); state.apiError=ok?err:(err||'API sync failed'); state.syncing=false;
    mutate(d=>{d.api={lastAt:state.lastApiAt,error:state.apiError};});
    return ok>0;
  }

  function summary(){
    const d=get(); const defaults=TASKS.map(t=>({ ...t, ...(d.tasks[t.id]||blankTask(t)) }));
    const custom=(d.custom||[]).map(x=>({id:x.id,label:x.label,icon:'➕',category:'Custom',status:x.done?'done':'action',done:!!x.done,source:'manual',detail:'Custom task'}));
    const objectives=[...defaults,...custom]; const counted=objectives.filter(x=>x.status!=='na'); const done=counted.filter(x=>x.status==='done').length;
    return {date:d.date,total:counted.length,done,percent:counted.length?Math.round(done*100/counted.length):100,objectives,api:d.api||{},showCompleted:state.showCompleted,filter:state.filter};
  }
  function moduleStatus(){
    let settings={}; try{settings=safeJson(localStorage.getItem('sakalux_master_suite_settings_v1'),{})||{};}catch{}
    const mods=settings.modules||{}; const vals=Object.values(mods); return {enabled:vals.filter(Boolean).length,total:Math.max(23,vals.length)};
  }
  function resetToday(){ const s=getStore(); s.days[dayKey()]=freshDay(); save(s); render(); return true; }

  function css(){
    if(document.getElementById('sdp-smart-style')) return;
    const st=document.createElement('style'); st.id='sdp-smart-style'; st.textContent=`
#sakalux-suite-daily-progress{position:fixed;inset:0;z-index:2147483200;display:none;background:rgba(5,7,10,.74);font-family:Arial,sans-serif;color:#eee;padding:8px;box-sizing:border-box}#sakalux-suite-daily-progress.open{display:flex;align-items:flex-start;justify-content:center}.sdp-shell{width:min(720px,100%);max-height:calc(100dvh - 16px);background:#12151b;border:1px solid #333a46;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 18px 60px #000a}.sdp-head{padding:12px 14px;border-bottom:1px solid #2b3039;display:flex;gap:10px;align-items:center}.sdp-title{font-size:17px;font-weight:800;flex:1}.sdp-sub{font-size:11px;color:#9fa7b3;margin-top:2px}.sdp-close,.sdp-btn{border:1px solid #3b424e;background:#1a1f27;color:#eee;border-radius:9px;padding:8px 10px;font-weight:700}.sdp-close{font-size:18px;padding:4px 10px}.sdp-body{padding:12px;overflow:auto}.sdp-progress{display:flex;align-items:center;gap:10px;margin-bottom:10px}.sdp-track{height:9px;background:#272d36;border-radius:99px;overflow:hidden;flex:1}.sdp-bar{height:100%;background:linear-gradient(90deg,#c79427,#f0c45a);width:0}.sdp-count{font-size:12px;font-weight:800;color:#f0c45a}.sdp-toolbar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.sdp-btn{font-size:11px;padding:7px 9px}.sdp-btn.active{border-color:#d8a93d;color:#f1c45e}.sdp-sync{font-size:11px;color:#9099a8;margin-bottom:10px}.sdp-list{display:grid;gap:7px}.sdp-task{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:9px;padding:9px 10px;border:1px solid #2c323c;border-radius:11px;background:#171b22}.sdp-task.done{opacity:.66}.sdp-icon{font-size:21px;text-align:center}.sdp-label{font-size:13px;font-weight:800}.sdp-detail{font-size:10px;color:#929baa;margin-top:3px}.sdp-pill{font-size:10px;font-weight:900;border-radius:99px;padding:5px 7px;border:1px solid #444}.sdp-pill.done{color:#7be09c;border-color:#315d40}.sdp-pill.action{color:#f1c45e;border-color:#725a25}.sdp-pill.pending,.sdp-pill.sync{color:#8dc7ff;border-color:#315270}.sdp-pill.na{color:#9aa2ad}.sdp-custom{display:flex;gap:6px;margin-top:10px}.sdp-custom input{flex:1;min-width:0;background:#0e1116;color:#eee;border:1px solid #343b46;border-radius:8px;padding:9px}.sdp-foot{padding:8px 12px;border-top:1px solid #292f38;font-size:10px;color:#808894;text-align:center}@media(max-width:600px){#sakalux-suite-daily-progress{padding:4px}.sdp-shell{max-height:calc(100dvh - 8px);border-radius:12px}.sdp-body{padding:9px}.sdp-task{grid-template-columns:30px 1fr auto;padding:8px}.sdp-label{font-size:12px}}
`;
    document.head.appendChild(st);
  }
  function ensurePanel(){
    css(); let p=document.getElementById('sakalux-suite-daily-progress'); if(p) return p;
    p=document.createElement('div'); p.id='sakalux-suite-daily-progress'; p.innerHTML='<div class="sdp-shell"><div class="sdp-head"><div><div class="sdp-title">✅ Smart Daily Checklist</div><div class="sdp-sub">Auto-sync + Torn activity fallback</div></div><button class="sdp-close" data-sdp="close">×</button></div><div class="sdp-body"></div><div class="sdp-foot">SakaLuX Suite • Smart Daily Checklist v2</div></div>';
    p.addEventListener('click',e=>{ const a=e.target.closest('[data-sdp]'); if(!a)return; const act=a.dataset.sdp,id=a.dataset.id;if(act==='close')close();if(act==='refresh')refreshApi(true);if(act==='toggle-completed'){state.showCompleted=!state.showCompleted;const s=getStore();save(s);render();}if(act==='filter'){state.filter=a.dataset.value||'all';const s=getStore();save(s);render();}if(act==='toggle-task')setObjective(id,summary().objectives.find(x=>x.id===id)?.status!=='done');if(act==='remove')removeObjective(id);if(act==='reset'&&confirm('Reset today checklist?'))resetToday();if(act==='add'){const input=p.querySelector('.sdp-custom input');const x=addObjective(input?.value);if(x&&input)input.value='';}});
    p.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.sdp-custom input'))p.querySelector('[data-sdp="add"]')?.click();});
    document.body.appendChild(p); return p;
  }
  function render(){
    const p=document.getElementById('sakalux-suite-daily-progress'); if(!p)return; const s=summary(); const body=p.querySelector('.sdp-body');
    let rows=s.objectives.filter(x=>state.showCompleted||x.status!=='done').filter(x=>state.filter==='all'||x.category===state.filter);
    const cats=['all',...new Set(TASKS.map(x=>x.category))];
    body.innerHTML=`<div class="sdp-progress"><div class="sdp-track"><div class="sdp-bar" style="width:${s.percent}%"></div></div><div class="sdp-count">${s.done}/${s.total} • ${s.percent}%</div></div><div class="sdp-toolbar"><button class="sdp-btn" data-sdp="refresh">${state.syncing?'SYNCING…':'↻ SYNC API'}</button><button class="sdp-btn ${state.showCompleted?'active':''}" data-sdp="toggle-completed">Show completed</button>${cats.map(c=>`<button class="sdp-btn ${state.filter===c?'active':''}" data-sdp="filter" data-value="${c}">${c==='all'?'All':c}</button>`).join('')}<button class="sdp-btn" data-sdp="reset">Reset today</button></div><div class="sdp-sync">${state.apiError?'⚠ '+state.apiError:(s.api?.lastAt?`Last API sync ${new Date(s.api.lastAt).toLocaleTimeString()}`:'API not synced yet')}</div><div class="sdp-list">${rows.map(x=>`<div class="sdp-task ${x.status}"><div class="sdp-icon">${x.icon||'•'}</div><div><div class="sdp-label">${x.label}</div><div class="sdp-detail">${x.detail||x.source||''}</div></div><div><button class="sdp-pill ${x.status}" data-sdp="toggle-task" data-id="${x.id}">${x.status==='done'?'DONE':x.status==='action'?'ACTION':x.status==='na'?'N/A':'SYNC'}</button>${x.id.startsWith('custom-')?`<button class="sdp-btn" data-sdp="remove" data-id="${x.id}">×</button>`:''}</div></div>`).join('')||'<div class="sdp-sync">No tasks in this view.</div>'}</div><div class="sdp-custom"><input placeholder="Add custom task"><button class="sdp-btn" data-sdp="add">ADD</button></div>`;
  }
  function open(){ const p=ensurePanel(); p.classList.add('open'); render(); refreshApi(false); return true; }
  function close(){ const p=document.getElementById('sakalux-suite-daily-progress'); if(p)p.classList.remove('open'); return true; }
  function ensureBridge(){
    let b=document.getElementById('sakalux-module-bridge-suite-daily-progress'); if(b)return b;
    b=document.createElement('button'); b.id='sakalux-module-bridge-suite-daily-progress'; b.type='button'; b.hidden=true; b.addEventListener('click',()=>{ if((b.dataset.action||'open')==='close')close(); else open(); }); document.body.appendChild(b); return b;
  }
  function observeRoutes(){
    let last=location.href; const hit=()=>{const t=routeType(location.href);if(t)recordActivity(t,location.href);}; hit();
    try{g.SakaLuXCore?.router?.onChange?.(()=>setTimeout(hit,50)); g.SakaLuXCore?.router?.bind?.();}catch{}
    setInterval(()=>{if(location.href!==last){last=location.href;hit();}},1800);
  }

  g.SakaLuXSuiteDailyProgress=Object.freeze({version:API_VERSION,storageKey:STORAGE_KEY,dayKey,get,summary,setObjective,addObjective,removeObjective,recordActivity,refreshApi,moduleStatus,open,close,resetToday,routeType,getApiKey});
  const init=()=>{ensureBridge();observeRoutes();setTimeout(()=>refreshApi(false),2500);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
/* SakaLuX Smart Daily Checklist v2.0.0 — v0.9.968 */
/* SakaLuX Suite Daily Progress — END */'''

TEST_CONTENT = r'''\'use strict\';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('SakaLuX-Suite.user.js','utf8');
assert.match(source,/^\/\/\s*@version\s+0\.9\.968$/m,'Suite metadata version');
assert.ok(source.includes("const VERSION = '0.9.968';\n  const SUITE = Object.freeze"),'Suite runtime version synchronized');
assert.ok(source.includes('data-action="daily-progress"'),'Daily Progress toolbar action preserved');
const begin='/* SakaLuX Suite Daily Progress — BEGIN */', end='/* SakaLuX Suite Daily Progress — END */';
const a=source.indexOf(begin),b=source.indexOf(end,a); assert.ok(a>=0&&b>a,'Smart checklist block markers');
const block=source.slice(a+begin.length,b);
const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'https://www.torn.com/index.php',runScripts:'outside-only',pretendToBeVisual:true});
const {window}=dom; window.confirm=()=>true; window.fetch=()=>Promise.reject(new Error('offline test')); window.SakaLuXCore={router:{onChange(){return()=>{}},bind(){return true;}}};
window.eval(block); window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
const api=window.SakaLuXSuiteDailyProgress; assert.ok(api,'public API exposed'); assert.equal(api.version,'2.0.0'); assert.equal(api.dayKey(new Date(2026,8,6)),'2026-09-06');
let s=api.summary(); assert.ok(s.total>=15,'full smart checklist installed'); assert.ok(s.objectives.some(x=>x.id==='energy_refill')); assert.ok(s.objectives.some(x=>x.id==='prayer'));
api.setObjective('review',true); assert.equal(api.summary().objectives.find(x=>x.id==='review').status,'done');
const customId=api.addObjective('Check bazaar listings'); assert.ok(customId); api.setObjective(customId,true); assert.equal(api.summary().objectives.find(x=>x.id===customId).done,true); api.removeObjective(customId);
api.recordActivity('gym','/gym.php'); assert.equal(api.summary().objectives.find(x=>x.id==='gym').status,'done');
api.recordActivity('faction','/factions.php'); assert.equal(api.summary().objectives.find(x=>x.id==='faction_oc').status,'done');
assert.equal(api.open(),true); const panel=window.document.getElementById('sakalux-suite-daily-progress'); assert.ok(panel.classList.contains('open')); assert.ok(panel.querySelector('.sdp-bar')); assert.ok(panel.textContent.includes('Smart Daily Checklist')); api.close();
const bridge=window.document.getElementById('sakalux-module-bridge-suite-daily-progress'); assert.ok(bridge); bridge.dataset.action='open'; bridge.click(); assert.ok(panel.classList.contains('open'));
api.resetToday(); assert.equal(api.summary().objectives.find(x=>x.id==='review').status,'pending'); dom.window.close(); console.log('Suite Smart Daily Checklist v2 regression passed.');
'''.replace("\\'use strict\\';", "'use strict';")

s = SUITE.read_text(encoding='utf-8')
old_m = re.search(r'(?m)^//\s*@version\s+(\S+)', s)
if not old_m:
    raise SystemExit('Suite @version missing')
old = old_m.group(1)

if MARKER not in s:
    pattern = re.compile(re.escape(BEGIN) + r'.*?' + re.escape(END), re.S)
    if not pattern.search(s):
        raise SystemExit('Daily Progress block markers not found')
    s = pattern.sub(BLOCK, s, count=1)

s = re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', s, count=1)
s = re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])([^'\"]+)(['\"]\s*;\s*\n\s*const\s+SUITE\s*=)", lambda m:m.group(1)+VERSION+m.group(3), s, count=1)
SUITE.write_text(s, encoding='utf-8')

TEST.write_text(TEST_CONTENT, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Verified:\s*\*\*)[^*]+(\*\*)', rf'\g<1>{date.today().isoformat()}\2', d, count=1)
    title = 'Smart Daily Checklist v2 with API auto-completion'
    bullets = [
        'Replaces the route-only Daily Progress logic with a full Smart Daily Checklist while preserving its public API and Master Control entry point.',
        'Automatically checks Energy/Nerve refills, cooldowns, missions, virus coding, education, casino tokens, travel and organized crime through Torn API v2 when a shared API key is available.',
        'Keeps Torn-route fallback detection for Gym, Crimes, Missions, Faction/OC, Travel, City, Shops, Racing, Job, Wheels and Prayer, so TornPDA activity can still complete supported tasks without extra API calls.',
        'Adds DONE / ACTION / N/A / SYNC states, overall completion percentage, category filters, Show completed persistence, API refresh, custom tasks and 30-day local rollover history.',
        'Uses Script Hub getApiKey() first and falls back to existing Suite/Hub local settings; no API key is stored by the checklist itself.'
    ]
    block = '## Current release note\n\n**v' + VERSION + ' — ' + title + '**\n' + '\n'.join('- ' + x for x in bullets) + '\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', d)
    if m: d = d[:m.start()] + block.rstrip() + '\n' + d[m.end():]
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', d)
    if heading and not re.search(r'(?im)^###\s+v?0\.9\.968(?:\s|—|-|$)', d):
        entry = '\n\n### v0.9.968 — ' + title + '\n' + '\n'.join('- ' + x for x in bullets) + '\n'
        d = d[:heading.end()] + entry + d[heading.end():]
    DOC.write_text(d, encoding='utf-8')

print(f'Suite Smart Daily Checklist {VERSION} applied. Previous version: {old}')
