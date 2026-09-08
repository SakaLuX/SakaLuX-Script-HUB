// ==UserScript==
// @name         SakaLuX Elimination Assistant
// @namespace    sakalux.elimination.assistant
// @version      1.1.1
// @description  Eliminations target scanner with Torn API + optional FFScouter estimates, composite SAFE/RISKY/SKIP signal, quick filters, local history and Hub/PDA support.
// @author       SakaLuX [2380374]
// @license      MIT
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @connect      ffscouter.com
// @downloadURL  https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.user.js
// @updateURL    https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.meta.js
// ==/UserScript==

(() => {
'use strict';

const VERSION = '1.1.1';
const IDS = { button:'slx-elim-btn', panel:'slx-elim', style:'slx-elim-style' };
const KEYS = {
  torn:'slx_elim_torn_key',
  ff:'slx_elim_ff_key',
  team:'slx_elim_team',
  history:'slx_elim_history_v3',
  settings:'slx_elim_settings_v3',
  ffCache:'slx_elim_ff_cache_v1'
};
const DEFAULTS = {
  hideUnavailable:true,
  autoFF:true,
  maxRows:300,
  safeFF:3.0,
  riskyFF:1.5,
  ffCacheMinutes:30,
  compactMobile:true
};

const state = {
  tornKey: localStorage.getItem(KEYS.torn) || '',
  ffKey: localStorage.getItem(KEYS.ff) || '',
  teamId: Number(localStorage.getItem(KEYS.team) || 0),
  teams: [],
  players: [],
  view: [],
  history: loadJSON(KEYS.history, []),
  settings: { ...DEFAULTS, ...loadJSON(KEYS.settings, {}) },
  ffCache: loadJSON(KEYS.ffCache, {}),
  busy:false,
  lastRefresh:0,
  ffLoaded:false,
  ffLoadedCount:0
};

const $ = (q,r=document)=>r.querySelector(q);
const $$ = (q,r=document)=>[...r.querySelectorAll(q)];
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const nowSec = ()=>Math.floor(Date.now()/1000);
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
}[c]));

function loadJSON(k,f){ try { const v=JSON.parse(localStorage.getItem(k)||''); return v ?? f; } catch { return f; } }
function saveJSON(k,v){ try { localStorage.setItem(k,JSON.stringify(v)); } catch {} }

function fmtAge(ts){
  if(!ts) return '—';
  const s=Math.max(0,nowSec()-Number(ts));
  if(s<60) return `${s}s`;
  if(s<3600) return `${Math.floor(s/60)}m`;
  if(s<86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}
function fmtBS(n){
  n=Number(n||0);
  if(!n) return '—';
  if(n>=1e12) return `${(n/1e12).toFixed(2)}T`;
  if(n>=1e9) return `${(n/1e9).toFixed(2)}B`;
  if(n>=1e6) return `${(n/1e6).toFixed(1)}M`;
  if(n>=1e3) return `${(n/1e3).toFixed(1)}K`;
  return String(Math.round(n));
}
function requestJSON(url){
  return new Promise((resolve,reject)=>{
    const parse=text=>{
      try{
        const j=JSON.parse(text);
        if(j?.error) reject(new Error(j.error.error||j.error.message||j.error.code||'API error'));
        else resolve(j);
      }catch(e){ reject(e); }
    };
    if(typeof window.PDA_httpGet==='function'){
      window.PDA_httpGet(url,{Accept:'application/json'})
        .then(r=>parse(String(r?.responseText??r?.body??r??''))).catch(reject);
      return;
    }
    if(window.flutter_inappwebview?.callHandler){
      window.flutter_inappwebview.callHandler('PDA_httpGet',url,{Accept:'application/json'})
        .then(r=>parse(String(r?.responseText??r?.body??r??''))).catch(reject);
      return;
    }
    if(typeof GM_xmlhttpRequest==='function'){
      GM_xmlhttpRequest({
        method:'GET', url, headers:{Accept:'application/json'}, timeout:15000,
        onload:r=>r.status>=200&&r.status<400?parse(r.responseText):reject(new Error(`HTTP ${r.status}`)),
        onerror:()=>reject(new Error('Network error')),
        ontimeout:()=>reject(new Error('Request timeout'))
      });
      return;
    }
    fetch(url,{cache:'no-store'})
      .then(r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(parse).catch(reject);
  });
}
function torn(path,params={}){
  if(!state.tornKey) return Promise.reject(new Error('Set your Torn API key in Settings'));
  const u=new URL(`https://api.torn.com/v2/${path.replace(/^\/+/, '')}`);
  u.searchParams.set('key',state.tornKey.trim());
  u.searchParams.set('striptags','true');
  Object.entries(params).forEach(([k,v])=>{
    if(v!==undefined&&v!==null&&v!=='') u.searchParams.set(k,String(v));
  });
  return requestJSON(u.href);
}
function ffStats(ids){
  if(!state.ffKey) return Promise.reject(new Error('FFScouter key not configured'));
  const clean=[...new Set(ids.map(Number).filter(x=>x>0))].slice(0,205);
  if(!clean.length) return Promise.resolve([]);
  const u=new URL('https://ffscouter.com/api/v1/get-stats');
  u.searchParams.set('key',state.ffKey.trim());
  u.searchParams.set('targets',clean.join(','));
  return requestJSON(u.href);
}

function normalizeTeams(raw){
  const root=raw?.elimination||raw?.teams||raw?.data||raw;
  let arr=[];
  if(Array.isArray(root)) arr=root;
  else if(root&&typeof root==='object'){
    if(Array.isArray(root.teams)) arr=root.teams;
    else arr=Object.entries(root).map(([id,x])=>({id:Number(id),...(x||{})}));
  }
  return arr.map((t,i)=>({
    id:Number(t.id??t.team_id??t.teamId??i),
    name:t.name??t.team_name??t.team??`Team ${t.id??i}`,
    score:Number(t.score??t.points??0),
    lives:Number(t.lives??t.life??0),
    participants:Number(t.participants??t.members??0)
  })).filter(t=>Number.isFinite(t.id));
}
function normalizePlayers(raw){
  const root=raw?.eliminationteam||raw?.players||raw?.members||raw?.data||raw;
  let arr=[];
  if(Array.isArray(root)) arr=root;
  else if(root&&typeof root==='object'){
    if(Array.isArray(root.players)) arr=root.players;
    else if(Array.isArray(root.members)) arr=root.members;
    else arr=Object.entries(root).map(([id,x])=>({id:Number(id),...(x||{})}));
  }
  return arr.map((p,i)=>({
    id:Number(p.id??p.user_id??p.player_id??i),
    name:p.name??p.player_name??p.username??`Player ${p.id??i}`,
    level:Number(p.level??0),
    score:Number(p.score??p.points??p.contribution??0),
    attacks:Number(p.attacks??p.hits??0),
    lastActionTs:Number(p.last_action?.timestamp??p.last_action_timestamp??0),
    lastActionText:p.last_action?.relative??p.last_action?.status??'',
    statusState:String(p.status?.state??p.status?.description??p.status??''),
    statusDescription:String(p.status?.description??p.status?.details??''),
    ff:null, bs:null, ffSource:''
  })).filter(p=>p.id>0);
}
function normalizeFF(raw){
  const arr=Array.isArray(raw)?raw:
    (Array.isArray(raw?.players)?raw.players:
    (Array.isArray(raw?.data)?raw.data:[]));
  return arr.map(x=>({
    id:Number(x.player_id??x.id??0),
    ff:Number(x.fair_fight??x.ff??0)||null,
    bs:Number(x.bs_estimate??x.battle_stats??x.bss??0)||null,
    source:String(x.source??'FFScouter')
  })).filter(x=>x.id>0);
}

function unavailable(p){
  return /hospital|federal|fallen|jail/i.test(`${p.statusState} ${p.statusDescription}`);
}
function historyCount(id){
  return state.history.filter(x=>Number(x.id)===Number(id)).length;
}
function addHistory(p,action='attack opened'){
  state.history.unshift({
    id:p.id,name:p.name,action,at:Date.now(),teamId:state.teamId,
    ff:p.ff||null,bs:p.bs||null
  });
  state.history=state.history.slice(0,800);
  saveJSON(KEYS.history,state.history);
}
function risk(p){
  let score=50;
  const reason=[];
  const h=p.lastActionTs?(nowSec()-p.lastActionTs)/3600:null;

  if(p.ff){
    if(p.ff>=5){ score-=36; reason.push('FF very good'); }
    else if(p.ff>=state.settings.safeFF){ score-=27; reason.push('FF good'); }
    else if(p.ff>=state.settings.riskyFF){ score-=8; reason.push('FF medium'); }
    else { score+=28; reason.push('FF low'); }
  }else{
    if(p.level<=10&&p.level>0) score-=22;
    else if(p.level<=25&&p.level>0) score-=13;
    else if(p.level<=50&&p.level>0) score+=4;
    else if(p.level<=75&&p.level>0) score+=15;
    else if(p.level>75) score+=26;
    reason.push('level heuristic');
  }

  if(h!==null){
    if(h>=168){ score-=18; reason.push('inactive 7d+'); }
    else if(h>=24){ score-=11; reason.push('inactive 24h+'); }
    else if(h>=4){ score-=4; reason.push('inactive 4h+'); }
    else { score+=10; reason.push('recently active'); }
  }

  if(p.bs){
    if(p.bs < 1e6) score-=5;
    else if(p.bs > 1e10) score+=5;
  }

  if(unavailable(p)){
    score=100;
    reason.length=0;
    reason.push('unavailable');
  }

  const seen=historyCount(p.id);
  if(seen){
    score+=Math.min(10,seen*2);
    reason.push(`opened ${seen}x`);
  }

  score=clamp(Math.round(score),0,100);
  return {
    score,
    label:score<=34?'SAFE':score<=64?'RISKY':'SKIP',
    reason:reason.join(', ')
  };
}
function signalText(p){
  const r=risk(p);
  const ff=p.ff?`FF ${Number(p.ff).toFixed(2)}`:'FF —';
  const bs=p.bs?`BS ~${fmtBS(p.bs)}`:'BS —';
  return `${ff} · ${bs} · ${r.label}`;
}
function attackUrl(id){ return `https://www.torn.com/loader.php?sid=attack&user2ID=${encodeURIComponent(id)}`; }
function profileUrl(id){ return `https://www.torn.com/profiles.php?XID=${encodeURIComponent(id)}`; }

function injectCSS(){
  if(document.getElementById(IDS.style)) return;
  const s=document.createElement('style');
  s.id=IDS.style;
  s.textContent=`
#${IDS.button}{position:fixed;right:12px;bottom:82px;z-index:999999;border:1px solid #414a55;background:#171b21;color:#fff;border-radius:999px;padding:10px 13px;font:800 12px Arial;box-shadow:0 5px 18px #0008}
#${IDS.panel}{display:none;position:fixed;right:8px;bottom:130px;z-index:999998;width:min(880px,calc(100vw - 16px));height:min(80vh,780px);background:#101419;color:#e9eef4;border:1px solid #343c45;border-radius:14px;overflow:hidden;box-shadow:0 12px 40px #000b;font:12px Arial}
#${IDS.panel}.open{display:flex;flex-direction:column}
#${IDS.panel} *{box-sizing:border-box}
.slxeh{display:flex;gap:7px;align-items:center;padding:9px 11px;background:#171c22;border-bottom:1px solid #2c343d}
.slxeh b{flex:1;font-size:14px}.slxeh small{opacity:.55}
.slxeh button,.slxet button,.slxef button{background:#202832;color:#fff;border:1px solid #3b4652;border-radius:7px;padding:6px 8px}
.slxet{display:flex;gap:6px;flex-wrap:wrap;padding:8px;background:#12171c;border-bottom:1px solid #28313a}
.slxet input,.slxet select{background:#0f1318;color:#fff;border:1px solid #343e49;border-radius:7px;padding:7px;min-width:105px}
.slxet input{flex:1;min-width:125px}
.slxes{display:flex;gap:10px;align-items:center;padding:7px 9px;color:#aeb9c5;border-bottom:1px solid #28313a}
.slxes strong{color:#e7edf4}.slxes .grow{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.slxeb{overflow:auto;flex:1}.slxeb table{width:100%;border-collapse:collapse}
.slxeb th{position:sticky;top:0;background:#181e25;text-align:left;color:#aab4c0;z-index:2}
.slxeb td,.slxeb th{padding:6px;border-bottom:1px solid #242c34;vertical-align:middle}
.slxeb tr:hover{background:#161c22}
.slxe-safe{color:#63d889;font-weight:900}.slxe-risky{color:#f2c15c;font-weight:900}.slxe-skip{color:#ef7474;font-weight:900}
.slxe-act{display:inline-block;color:#fff;text-decoration:none;background:#27313c;border:1px solid #3e4b58;border-radius:6px;padding:5px 6px;margin:1px}
.slxe-muted{opacity:.6}.slxe-pill{font-size:10px;padding:2px 5px;border-radius:10px;background:#29313a;white-space:nowrap}
.slxe-signal{font-weight:800;white-space:nowrap}.slxe-signal small{display:block;font-weight:400;opacity:.58;margin-top:2px}
.slxef{display:flex;gap:6px;align-items:center;padding:7px 9px;background:#171c22;border-top:1px solid #2b343d}.slxef span{flex:1;color:#9aa6b2}
.slxe-modal{display:none;position:absolute;inset:0;z-index:20;background:#0c1015f5;padding:14px;overflow:auto}.slxe-modal.open{display:block}
.slxe-modal h3{margin:0 0 12px}.slxe-modal label{display:block;margin:9px 0 4px;color:#aeb9c5}
.slxe-modal input{width:100%;padding:8px;background:#11161c;color:#fff;border:1px solid #35404c;border-radius:7px}
.slxe-row{display:flex;gap:8px}.slxe-row>div{flex:1}
@media(max-width:680px){
  #${IDS.panel}{right:4px;bottom:123px;width:calc(100vw - 8px);height:80vh}
  .slxe-hide-m{display:none}.slxeb td,.slxeb th{font-size:11px;padding:5px 4px}
  .slxe-signal{white-space:normal;min-width:92px}
}`;
  document.head.appendChild(s);
}

function inject(){
  if(document.getElementById(IDS.panel)) return;
  injectCSS();

  const btn=document.createElement('button');
  btn.id=IDS.button;
  btn.textContent='ELIM ⚔';
  btn.title='SakaLuX Elimination Assistant';

  const panel=document.createElement('div');
  panel.id=IDS.panel;
  panel.innerHTML=`
<div class="slxeh">
  <b>SakaLuX Elimination Assistant <small>v${VERSION}</small></b>
  <button id="slxe-settings">⚙</button><button id="slxe-close">✕</button>
</div>
<div class="slxet">
  <select id="slxe-team"><option value="">Team…</option></select>
  <button id="slxe-load">LOAD</button>
  <button id="slxe-ff">FF SCAN</button>
  <input id="slxe-q" placeholder="Player / ID">
  <select id="slxe-filter">
    <option value="all">All targets</option>
    <option value="safe">SAFE only</option>
    <option value="ok">SAFE + RISKY</option>
    <option value="active">Active &lt;4h</option>
    <option value="inactive">Inactive 24h+</option>
    <option value="new">Not attacked/opened</option>
  </select>
  <select id="slxe-sort">
    <option value="risk">Risk ↑</option>
    <option value="ff">Fair Fight ↓</option>
    <option value="bs">BS estimate ↑</option>
    <option value="level">Level ↑</option>
    <option value="activity">Oldest activity</option>
    <option value="score">Contribution ↓</option>
  </select>
</div>
<div class="slxes">
  <span class="grow" id="slxe-status">Set your Torn API key in ⚙ Settings.</span>
  <span id="slxe-teamstat"></span>
  <span id="slxe-localstat"></span>
</div>
<div class="slxeb">
<table>
<thead><tr>
  <th>Target signal</th><th>Player</th><th>Lvl</th>
  <th>Last</th><th class="slxe-hide-m">Status</th><th>Actions</th>
</tr></thead>
<tbody id="slxe-rows"></tbody>
</table>
</div>
<div class="slxef">
  <span id="slxe-count">0 targets</span>
  <button id="slxe-best">BEST 10</button>
  <button id="slxe-history">HISTORY</button>
  <button id="slxe-clear">CLEAR HISTORY</button>
</div>
<div class="slxe-modal" id="slxe-settings-modal">
  <h3>Elimination Assistant Settings</h3>
  <label>Torn API key</label>
  <input id="slxe-torn-key" type="text" autocomplete="off" placeholder="Torn API key">
  <label>FFScouter API key (optional)</label>
  <input id="slxe-ff-key" type="text" autocomplete="off" placeholder="FFScouter key">
  <div class="slxe-row">
    <div><label>SAFE FF threshold</label><input id="slxe-safeff" type="number" step="0.1" min="1"></div>
    <div><label>RISKY FF threshold</label><input id="slxe-riskyff" type="number" step="0.1" min="1"></div>
  </div>
  <label>FF cache minutes</label>
  <input id="slxe-cachemin" type="number" min="1" max="240">
  <label><input id="slxe-hide-unavail" type="checkbox" style="width:auto"> Hide unavailable targets by default</label>
  <div style="margin-top:14px">
    <button class="slxe-act" id="slxe-save">SAVE</button>
    <button class="slxe-act" id="slxe-cancel">CLOSE</button>
  </div>
  <p class="slxe-muted">FFScouter is optional. Without it, risk falls back to visible Torn data. Keys stay on this device.</p>
</div>
<div class="slxe-modal" id="slxe-history-modal">
  <h3>Local attack/open history</h3>
  <div id="slxe-history-list"></div>
  <div style="margin-top:14px"><button class="slxe-act" id="slxe-history-close">CLOSE</button></div>
</div>`;

  document.body.append(btn,panel);

  btn.onclick=()=>panel.classList.toggle('open');
  $('#slxe-close',panel).onclick=()=>panel.classList.remove('open');
  $('#slxe-settings',panel).onclick=openSettings;
  $('#slxe-cancel',panel).onclick=()=>$('#slxe-settings-modal',panel).classList.remove('open');
  $('#slxe-save',panel).onclick=saveSettings;
  $('#slxe-load',panel).onclick=()=>busy(loadSelectedTeam);
  $('#slxe-ff',panel).onclick=()=>busy(()=>loadFFForPlayers(true));
  $('#slxe-q',panel).oninput=apply;
  $('#slxe-filter',panel).onchange=apply;
  $('#slxe-sort',panel).onchange=apply;
  $('#slxe-team',panel).onchange=e=>{
    state.teamId=Number(e.target.value||0);
    localStorage.setItem(KEYS.team,String(state.teamId||''));
  };
  $('#slxe-history',panel).onclick=openHistory;
  $('#slxe-history-close',panel).onclick=()=>$('#slxe-history-modal',panel).classList.remove('open');
  $('#slxe-clear',panel).onclick=()=>{
    state.history=[];
    saveJSON(KEYS.history,[]);
    apply();
    renderSummary();
  };
  $('#slxe-best',panel).onclick=()=>{
    $('#slxe-filter',panel).value='ok';
    $('#slxe-sort',panel).value='risk';
    apply();
    setStatus('Showing best SAFE/RISKY targets first');
  };

  if(state.tornKey) busy(refresh);
}

function setStatus(t){ const e=$('#slxe-status'); if(e) e.textContent=t; }
function openSettings(){
  const m=$('#slxe-settings-modal');
  if(!m) return;
  $('#slxe-torn-key',m).value=state.tornKey;
  $('#slxe-ff-key',m).value=state.ffKey;
  $('#slxe-safeff',m).value=state.settings.safeFF;
  $('#slxe-riskyff',m).value=state.settings.riskyFF;
  $('#slxe-cachemin',m).value=state.settings.ffCacheMinutes;
  $('#slxe-hide-unavail',m).checked=!!state.settings.hideUnavailable;
  m.classList.add('open');
}
function saveSettings(){
  const m=$('#slxe-settings-modal');
  state.tornKey=$('#slxe-torn-key',m).value.trim();
  state.ffKey=$('#slxe-ff-key',m).value.trim();
  state.settings.safeFF=Number($('#slxe-safeff',m).value||3);
  state.settings.riskyFF=Number($('#slxe-riskyff',m).value||1.5);
  state.settings.ffCacheMinutes=Number($('#slxe-cachemin',m).value||30);
  state.settings.hideUnavailable=$('#slxe-hide-unavail',m).checked;
  localStorage.setItem(KEYS.torn,state.tornKey);
  localStorage.setItem(KEYS.ff,state.ffKey);
  saveJSON(KEYS.settings,state.settings);
  m.classList.remove('open');
  busy(refresh);
}
function openHistory(){
  const m=$('#slxe-history-modal');
  if(!m) return;
  const list=$('#slxe-history-list',m);
  list.innerHTML=state.history.length
    ? state.history.slice(0,150).map(h=>`
      <div style="padding:6px 0;border-bottom:1px solid #252d35">
        <a class="slxe-act" target="_blank" href="${profileUrl(h.id)}">${esc(h.name)} [${h.id}]</a>
        <span class="slxe-muted">${esc(h.action||'opened')} · ${h.ff?`FF ${Number(h.ff).toFixed(2)} · `:''}${h.bs?`BS ~${fmtBS(h.bs)} · `:''}${new Date(h.at).toLocaleString()}</span>
      </div>`).join('')
    : '<div class="slxe-muted">No local history.</div>';
  m.classList.add('open');
}
function teamOptions(){
  const e=$('#slxe-team');
  if(!e) return;
  e.innerHTML='<option value="">Team…</option>'+
    state.teams.slice().sort((a,b)=>b.score-a.score).map(t=>
      `<option value="${t.id}" ${t.id===state.teamId?'selected':''}>${esc(t.name)}${t.score?` · ${t.score}`:''}</option>`
    ).join('');
}

async function loadTeams(){
  state.teams=normalizeTeams(await torn('torn/elimination'));
  if(!state.teamId&&state.teams[0]){
    state.teamId=state.teams[0].id;
    localStorage.setItem(KEYS.team,String(state.teamId));
  }
  teamOptions();
}
async function loadSelectedTeam(){
  if(!state.teamId) state.teamId=Number($('#slxe-team')?.value||0);
  if(!state.teamId) throw new Error('Choose an Eliminations team');
  const all=[];
  let offset=0,limit=100;
  for(let page=0;page<5;page++){
    const batch=normalizePlayers(await torn(`torn/${state.teamId}/eliminationteam`,{limit,offset}));
    all.push(...batch);
    if(batch.length<limit) break;
    offset+=limit;
  }
  state.players=[...new Map(all.map(p=>[p.id,p])).values()];
  state.ffLoaded=false;
  state.ffLoadedCount=0;
  applyFFCache();
  if(state.ffKey&&state.settings.autoFF) await loadFFForPlayers(false);
  apply();
  renderSummary();
  setStatus(`Loaded ${state.players.length} players`);
}
function applyFFCache(){
  const maxAge=Math.max(1,Number(state.settings.ffCacheMinutes||30))*60000;
  const now=Date.now();
  let count=0;
  state.players.forEach(p=>{
    const c=state.ffCache[String(p.id)];
    if(c && now-Number(c.at||0)<=maxAge){
      p.ff=Number(c.ff||0)||null;
      p.bs=Number(c.bs||0)||null;
      p.ffSource=c.source||'cache';
      count++;
    }
  });
  if(count){
    state.ffLoaded=true;
    state.ffLoadedCount=count;
  }
}
async function loadFFForPlayers(force=false){
  if(!state.players.length) throw new Error('Load a team first');
  if(!state.ffKey) throw new Error('Add your FFScouter API key in Settings');

  const maxAge=Math.max(1,Number(state.settings.ffCacheMinutes||30))*60000;
  const now=Date.now();
  const ids=state.players.filter(p=>{
    if(force) return true;
    const c=state.ffCache[String(p.id)];
    return !(c && now-Number(c.at||0)<=maxAge);
  }).map(p=>p.id);

  if(!ids.length){
    applyFFCache();
    apply();
    renderSummary();
    setStatus(`FFScouter cache: ${state.ffLoadedCount} estimates`);
    return;
  }

  setStatus(`FFScouter scanning ${ids.length} targets…`);
  const result=[];
  for(let i=0;i<ids.length;i+=205){
    const batch=normalizeFF(await ffStats(ids.slice(i,i+205)));
    result.push(...batch);
  }

  result.forEach(x=>{
    state.ffCache[String(x.id)]={ff:x.ff,bs:x.bs,source:x.source,at:Date.now()};
  });
  saveJSON(KEYS.ffCache,state.ffCache);

  const map=new Map(result.map(x=>[x.id,x]));
  state.players.forEach(p=>{
    const x=map.get(p.id);
    if(x){
      p.ff=x.ff;
      p.bs=x.bs;
      p.ffSource=x.source;
    }
  });

  applyFFCache();
  state.ffLoaded=true;
  state.ffLoadedCount=state.players.filter(p=>p.ff||p.bs).length;
  apply();
  renderSummary();
  setStatus(`FFScouter: ${state.ffLoadedCount}/${state.players.length} estimates available`);
}
function apply(){
  const q=($('#slxe-q')?.value||'').trim().toLowerCase();
  const f=$('#slxe-filter')?.value||'all';
  const sort=$('#slxe-sort')?.value||'risk';

  let a=state.players.filter(p=>!q||p.name.toLowerCase().includes(q)||String(p.id).includes(q));
  a=a.filter(p=>{
    const r=risk(p);
    const h=p.lastActionTs?(nowSec()-p.lastActionTs)/3600:null;
    if(state.settings.hideUnavailable&&unavailable(p)) return false;
    if(f==='safe') return r.label==='SAFE';
    if(f==='ok') return r.label!=='SKIP';
    if(f==='active') return h!==null&&h<4;
    if(f==='inactive') return h!==null&&h>=24;
    if(f==='new') return historyCount(p.id)===0;
    return true;
  });

  a.sort((x,y)=>{
    if(sort==='ff') return (y.ff||0)-(x.ff||0);
    if(sort==='bs') return (x.bs||Number.MAX_SAFE_INTEGER)-(y.bs||Number.MAX_SAFE_INTEGER);
    if(sort==='level') return (x.level||999)-(y.level||999);
    if(sort==='activity') return (x.lastActionTs||0)-(y.lastActionTs||0);
    if(sort==='score') return (y.score||0)-(x.score||0);
    return risk(x).score-risk(y).score;
  });

  state.view=a;
  renderRows();
  renderSummary();
}
function renderRows(){
  const e=$('#slxe-rows');
  if(!e) return;

  e.innerHTML=state.view.slice(0,state.settings.maxRows).map(p=>{
    const r=risk(p);
    const cls=r.label==='SAFE'?'slxe-safe':r.label==='RISKY'?'slxe-risky':'slxe-skip';
    const hc=historyCount(p.id);
    const st=`${p.statusState||''}${p.statusDescription&&p.statusDescription!==p.statusState?` · ${p.statusDescription}`:''}`.trim()||'—';
    return `<tr title="${esc(r.reason)}">
      <td class="slxe-signal">
        <span class="${cls}">${esc(signalText(p))}</span>
        <small>risk ${r.score}${r.reason?` · ${esc(r.reason)}`:''}</small>
      </td>
      <td>
        <a class="slxe-act" target="_blank" href="${profileUrl(p.id)}">${esc(p.name)}</a>
        <div class="slxe-muted">[${p.id}]${hc?` · opened ${hc}×`:''}</div>
      </td>
      <td>${p.level||'—'}</td>
      <td>${fmtAge(p.lastActionTs)}</td>
      <td class="slxe-hide-m">${unavailable(p)?'<span class="slxe-skip">Unavailable</span>':esc(st)}</td>
      <td>
        <a class="slxe-act" target="_blank" href="${profileUrl(p.id)}">PROFILE</a>
        <a class="slxe-act slxe-attack" data-id="${p.id}" href="${attackUrl(p.id)}">ATTACK</a>
      </td>
    </tr>`;
  }).join('');

  $$('.slxe-attack',e).forEach(a=>a.addEventListener('click',()=>{
    const p=state.players.find(x=>x.id===Number(a.dataset.id));
    if(p){
      addHistory(p);
      renderSummary();
      apply();
    }
  }));

  const c=$('#slxe-count');
  if(c) c.textContent=`${state.view.length} targets`;
}
function renderSummary(){
  const team=state.teams.find(t=>t.id===state.teamId);
  const ts=$('#slxe-teamstat');
  if(ts) ts.innerHTML=team?`Team: <strong>${esc(team.name)}</strong> · Score ${team.score}`:'';

  const safe=state.players.filter(p=>!unavailable(p)&&risk(p).label==='SAFE').length;
  const risky=state.players.filter(p=>!unavailable(p)&&risk(p).label==='RISKY').length;
  const local=$('#slxe-localstat');
  if(local) local.innerHTML=`SAFE <strong>${safe}</strong> · RISKY <strong>${risky}</strong> · Opened <strong>${state.history.length}</strong>${state.ffLoaded?` · FF ${state.ffLoadedCount}/${state.players.length}`:''}`;
}

async function refresh(){
  await loadTeams();
  if(state.teamId) await loadSelectedTeam();
  state.lastRefresh=Date.now();
  renderSummary();
}
async function busy(fn){
  if(state.busy) return;
  state.busy=true;
  try{
    setStatus('Working…');
    await fn();
  }catch(e){
    console.error('[SakaLuX Elimination]',e);
    setStatus(`Error: ${e.message}`);
  }finally{
    state.busy=false;
  }
}

function open(){ inject(); $('#'+IDS.panel)?.classList.add('open'); }
function close(){ $('#'+IDS.panel)?.classList.remove('open'); }
function goToEliminations(){ location.href='https://www.torn.com/page.php?sid=elimination'; }
function health(){
  return {
    version:VERSION,
    ready:!!$('#'+IDS.panel),
    teamId:state.teamId,
    targets:state.players.length,
    ffLoaded:state.ffLoaded,
    ffLoadedCount:state.ffLoadedCount,
    lastRefresh:state.lastRefresh
  };
}

window.SakaLuXEliminationAssistant={
  version:VERSION,
  open, close,
  refresh:()=>busy(refresh),
  scanFF:()=>busy(()=>loadFFForPlayers(true)),
  goToEliminations,
  health
};
window.dispatchEvent(new CustomEvent('SakaLuXEliminationAssistantReady',{detail:{version:VERSION}}));

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',inject,{once:true});
else inject();
})();
