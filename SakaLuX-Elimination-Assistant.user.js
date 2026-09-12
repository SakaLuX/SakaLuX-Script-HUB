// ==UserScript==
// @name         SakaLuX Elimination Assistant
// @namespace    sakalux.elimination.assistant
// @version      1.3.20
// @description  Torn Eliminations advisor with rotating 500-player batches, persistent SAFE targets, TornPDA export and FF/BS calibration.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @license      All Rights Reserved
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @connect      ffscouter.com
// @downloadURL  https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.user.js
// @updateURL    https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.meta.js
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

/*
 * Copyright © 2026 SakaLuX [2380374]
 * All Rights Reserved.
 *
 * Personal use and private modification are permitted.
 * Redistribution, republication, rebranding, or publication of
 * modified versions requires prior written permission from
 * SakaLuX [2380374].
 *
 * Original author attribution must be retained in all authorized
 * derivative works.
 */
(() => {
'use strict';
const VERSION='1.3.20';
const HUB_INSTALL_URL='https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
const HUB_PROMPT_STORAGE='SakaLuX_HUB_INSTALL_PROMPT_LAST';
const HUB_PROMPT_ID='sakalux-hub-install-prompt';
const HUB_PROMPT_INTERVAL=43200000;
const TORN_KEY_CREATE_URL='https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX_Elimination_Assistant&user=battlestats&torn=elimination,eliminationteam';
const IDS={button:'slx-elim-btn',panel:'slx-elim',style:'slx-elim-style'};
const K={torn:'slx_elim_torn_key',ff:'slx_elim_ff_key',team:'slx_elim_team',teams:'slx_elim_teams_v1',enabled:'slx_elim_enabled',hist:'slx_elim_history_v4',learn:'slx_elim_learning_v1',cache:'slx_elim_ff_cache_v2',my:'slx_elim_my_stats_v1',batches:'slx_elim_batches_v1',safe:'slx_elim_safe_targets_v1',ui:'slx_elim_ui_v1'};
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const state={enabled:localStorage.getItem(K.enabled)!=='0',tornKey:localStorage.getItem(K.torn)||'',ffKey:localStorage.getItem(K.ff)||'',teamId:Number(localStorage.getItem(K.team)||0),teams:load(K.teams,[]),players:[],view:[],history:load(K.hist,[]),learning:load(K.learn,{}),cache:load(K.cache,{}),my:load(K.my,{total:null,at:0,source:''}),batchOffsets:load(K.batches,{}),safeTargets:load(K.safe,[]),ui:Object.assign({filters:[],query:'',panelOpen:false},load(K.ui,{})),batchRawCount:0,busy:false,keyBusy:false,lastRefresh:0,tornKeySource:'None',tornAccessStatus:'unknown',tornAccessMessage:'Not checked yet',tornAccessCheckedAt:0,ffAccessStatus:'unknown',ffAccessMessage:'Optional · not checked'};
function getTornKey(){try{const k=window.SakaLuXScriptHub?.getApiKey?.()||'';if(k){state.tornKeySource='SakaLuX Hub';return k}if(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')){const stored=localStorage.getItem('SakaLuX_HUB_TORN_API_KEY')||'';if(stored){state.tornKeySource='SakaLuX Hub';return stored}}}catch{}if(state.tornKey){state.tornKeySource='Local standalone';return state.tornKey}state.tornKeySource='None';return''}
const fmtBS=n=>{n=Number(n||0);if(!n)return'—';if(n>=1e12)return(n/1e12).toFixed(2)+'T';if(n>=1e9)return(n/1e9).toFixed(2)+'B';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return String(Math.round(n))};
const age=ts=>{if(!ts)return'—';const s=Math.max(0,Math.floor(Date.now()/1000)-Number(ts));return s<60?s+'s':s<3600?Math.floor(s/60)+'m':s<86400?Math.floor(s/3600)+'h':Math.floor(s/86400)+'d'};
function requestJSON(url){
  const decode=raw=>{
    let v=raw;
    if(v&&typeof v==='object'){
      if(v.responseText!==undefined)v=v.responseText;
      else if(v.body!==undefined)v=v.body;
      else if(v.data!==undefined)v=v.data;
      else if(v.response!==undefined)v=v.response;
      else return v;
    }
    if(typeof v!=='string')v=String(v??'');
    v=v.trim();
    if(!v)throw new Error('Empty API response');
    try{return JSON.parse(v)}catch(e){
      const a=v.indexOf('{'),b=v.lastIndexOf('}');
      if(a>=0&&b>a){try{return JSON.parse(v.slice(a,b+1))}catch(_){}}
      throw new Error('Invalid API response: '+e.message);
    }
  };
  const checked=raw=>{const j=decode(raw);if(j?.error){const e=new Error(j.error.error||j.error.message||'API error');e.code=Number(j.error.code||0);throw e}return j};
  const viaGM=()=>new Promise((resolve,reject)=>{
    if(typeof GM_xmlhttpRequest!=='function'){reject(new Error('GM request unavailable'));return}
    GM_xmlhttpRequest({method:'GET',url,timeout:15000,onload:r=>{try{if(r.status<200||r.status>=400)throw new Error('HTTP '+r.status);resolve(checked(r))}catch(e){reject(e)}},onerror:()=>reject(new Error('Network error')),ontimeout:()=>reject(new Error('Timeout'))});
  });
  const viaFetch=()=>fetch(url,{headers:{Accept:'application/json'}}).then(async r=>{if(!r.ok)throw new Error('HTTP '+r.status);return checked(await r.text())});
  return (async()=>{
    let last=null;
    if(typeof window.PDA_httpGet==='function')try{return checked(await window.PDA_httpGet(url,{Accept:'application/json'}))}catch(e){last=e}
    if(window.flutter_inappwebview?.callHandler)try{return checked(await window.flutter_inappwebview.callHandler('PDA_httpGet',url,{Accept:'application/json'}))}catch(e){last=e}
    if(typeof GM_xmlhttpRequest==='function')try{return await viaGM()}catch(e){last=e}
    try{return await viaFetch()}catch(e){last=e}
    throw last||new Error('API request failed');
  })();
}
function torn(path,params={},keyOverride=''){const key=String(keyOverride||getTornKey()||'').trim();if(!key)return Promise.reject(new Error('Set Torn API key in API Access or SakaLuX Hub'));const u=new URL('https://api.torn.com/v2/'+path.replace(/^\/+/,''));u.searchParams.set('key',key);u.searchParams.set('striptags','true');Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,String(v)));return requestJSON(u.href)}
function ffReq(ids,keyOverride=''){const key=String(keyOverride||state.ffKey||'').trim();if(!key)return Promise.reject(new Error('Set FFScouter API key in API Access'));const u=new URL('https://ffscouter.com/api/v1/get-stats');u.searchParams.set('key',key);u.searchParams.set('targets',ids.join(','));return requestJSON(u.href)}
function normTeams(raw){const root=raw?.elimination??raw?.eliminations??raw?.teams??raw?.data??raw;const nested=root?.teams??root?.elimination_teams??root?.participants??root;const a=Array.isArray(nested)?nested:(nested&&typeof nested==='object'?Object.entries(nested).map(([id,x])=>x&&typeof x==='object'?{id:Number(x.id??x.team_id??id),...x}:{id:Number(id),name:String(x||'')}):[]);return a.map((t,i)=>({id:Number(t.id??t.team_id??t.teamId??i),name:t.name??t.team_name??t.teamName??('Team '+(t.id??t.team_id??i)),score:Number(t.score??t.points??0)})).filter(x=>Number.isFinite(x.id)&&x.id>0)}
function normPlayers(raw){const r=raw?.eliminationteam||raw?.players||raw?.members||raw?.data||raw;const a=Array.isArray(r)?r:(r&&typeof r==='object'?(Array.isArray(r.players)?r.players:Array.isArray(r.members)?r.members:Object.entries(r).map(([id,x])=>({id:Number(id),...(x||{})}))):[]);return a.map((p,i)=>{const st=p.status&&typeof p.status==='object'?p.status:{};const tr=p.travel&&typeof p.travel==='object'?p.travel:{};return{id:Number(p.id??p.user_id??p.player_id??i),name:p.name??p.player_name??p.username??('Player '+i),level:Number(p.level??0),score:Number(p.score??p.points??p.contribution??0),last:Number(p.last_action?.timestamp??p.last_action_timestamp??0),statusState:String(st.state??p.status_state??(typeof p.status==='string'?p.status:'')),statusDescription:String(st.description??p.status_description??''),statusDetails:String(st.details??p.status_details??''),travelStatus:String(tr.status??tr.state??p.travel_status??''),destination:String(tr.destination??tr.country??p.destination??p.country??''),ff:null,bs:null}}).filter(p=>p.id>0)}
function normFF(raw){const a=Array.isArray(raw)?raw:Array.isArray(raw?.players)?raw.players:Array.isArray(raw?.data)?raw.data:[];return a.map(x=>({id:Number(x.player_id??x.id??0),ff:Number(x.fair_fight??x.ff??0)||null,bs:Number(x.bs_estimate??x.battle_stats??x.bss??0)||null})).filter(x=>x.id>0)}
function presence(p){const raw=[p.statusState,p.statusDescription,p.statusDetails,p.travelStatus,p.destination].filter(Boolean).join(' ').trim();if(/hospital/i.test(raw))return{key:'hospital',icon:'🏥',label:'Hospital',detail:raw};if(/jail/i.test(raw))return{key:'jail',icon:'🔒',label:'Jail',detail:raw};if(/federal/i.test(raw))return{key:'federal',icon:'⛔',label:'Federal',detail:raw};if(/fallen/i.test(raw))return{key:'fallen',icon:'💀',label:'Fallen',detail:raw};if(/dormant/i.test(raw))return{key:'dormant',icon:'💤',label:'Dormant',detail:raw};if(/awoken/i.test(raw))return{key:'awoken',icon:'👁️',label:'Awoken',detail:raw};if(/travel(?:ing|ling)|flying|returning/i.test(raw))return{key:'flying',icon:'✈️',label:'Flying',detail:raw};if(/abroad|south africa|switzerland|united kingdom|cayman|canada|china|hawaii|japan|mexico|uae|argentina/i.test(raw))return{key:'abroad',icon:'🌍',label:'Abroad',detail:raw};if(/okay|torn|online|offline|idle/i.test(raw))return{key:'torn',icon:'🟢',label:'Torn',detail:raw};return{key:'unknown',icon:'⚪',label:'Unknown',detail:raw||'No location status returned'}}
function attackable(p){return presence(p).key==='torn'}
function unavailable(p){return/^(hospital|jail|federal|fallen|dormant|awoken|flying|abroad)$/.test(presence(p).key)}
function learn(id){const x=state.learning[String(id)]||{};return{wins:Number(x.wins||0),losses:Number(x.losses||0)}}
function risk(p){let n=50;const l=learn(p.id);const edge=state.my.total&&p.bs?state.my.total/Math.max(1,p.bs):null;if(edge!==null){if(edge>=5)n-=38;else if(edge>=2)n-=27;else if(edge>=1.25)n-=14;else if(edge<.8)n+=34;else n+=8}else if(p.ff){if(p.ff>=5)n-=34;else if(p.ff>=3)n-=25;else if(p.ff>=1.5)n-=7;else n+=27}else{if(p.level&&p.level<=10)n-=22;else if(p.level<=25)n-=13;else if(p.level<=50)n+=4;else if(p.level<=75)n+=15;else if(p.level>75)n+=26}if(p.last){const h=(Date.now()/1000-p.last)/3600;if(h>=168)n-=16;else if(h>=24)n-=10;else if(h<4)n+=8}if(l.wins+l.losses){const wr=l.wins/(l.wins+l.losses);if(l.wins+l.losses>=2&&wr>=.75)n-=14;else if(l.wins+l.losses>=2&&wr<=.4)n+=22}if(unavailable(p))n=100;n=Math.max(0,Math.min(100,Math.round(n)));return{score:n,label:n<=34?'SAFE':n<=64?'RISKY':'SKIP',edge}}
function smart(p){const r=risk(p);let s=100-r.score;if(p.ff)s+=Math.max(-8,Math.min(16,(p.ff-1)*4));if(r.edge!==null)s+=Math.max(-18,Math.min(20,Math.log2(Math.max(.1,r.edge))*8));if(unavailable(p))s=0;return Math.max(0,Math.min(100,Math.round(s)))}
function signal(p){const r=risk(p);const top=`${p.ff?'FF '+p.ff.toFixed(2):'FF —'} · ${p.bs?'BS '+fmtBS(p.bs):'BS —'}`;const bottom=`${r.edge!==null?r.edge.toFixed(1)+'× · ':''}${r.label} · ${smart(p)}/100`;return top+'\n'+bottom}
function syncHubPower(){
  for(const b of $$('[data-script="elimination-assistant"][data-action="toggle"]')){
    const txt=state.enabled?'⏻ ON':'⏻ OFF';
    if(b.textContent!==txt)b.textContent=txt;
    b.style.setProperty('display','inline-block','important');
    b.style.setProperty('background',state.enabled?'#166534':'#991b1b','important');
    b.style.setProperty('border-color',state.enabled?'#22c55e':'#ef4444','important');
    b.style.setProperty('color','#fff','important');
    b.style.setProperty('font-weight','900','important');
    const actions=b.closest('.slh-actions');
    if(actions){
      for(const x of $$('.slh-action',actions)){
        if(x===b)x.style.setProperty('display','inline-block','important');
        else if(state.enabled)x.style.removeProperty('display');
        else x.style.setProperty('display','none','important');
      }
    }
  }
}
function isHubInstalled(){return!!(window.SakaLuXScriptHub||$('#sakalux-hub-button'))}
function showHubPrompt(){if(!state.enabled||isHubInstalled()||$('#'+HUB_PROMPT_ID))return;const last=Number(localStorage.getItem(HUB_PROMPT_STORAGE)||0);if(last&&Date.now()-last<HUB_PROMPT_INTERVAL)return;const d=document.createElement('div');d.id=HUB_PROMPT_ID;d.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center';d.innerHTML='<div style="background:#111;color:#fff;padding:18px;border-radius:12px"><b>Install SakaLuX Script Hub?</b><div style="margin-top:12px"><button id="slx-later">LATER</button> <button id="slx-install">INSTALL HUB</button></div></div>';document.body.appendChild(d);$('#slx-later',d).onclick=()=>{localStorage.setItem(HUB_PROMPT_STORAGE,String(Date.now()));d.remove()};$('#slx-install',d).onclick=()=>{localStorage.setItem(HUB_PROMPT_STORAGE,String(Date.now()));location.href=HUB_INSTALL_URL}}
function css(){if($('#'+IDS.style))return;const s=document.createElement('style');s.id=IDS.style;s.textContent=`#${IDS.button}{position:fixed;right:12px;bottom:82px;z-index:999999;background:#171b21;color:#fff;border:1px solid #414a55;border-radius:999px;padding:11px 14px;font-weight:900;font-size:14px}#${IDS.panel}{display:none;position:fixed;right:6px;bottom:125px;z-index:999998;width:min(920px,calc(100vw - 12px));height:80vh;background:#0d1117;color:#f8fafc;border:1px solid #3c4652;border-radius:14px;overflow:hidden;font:14px Arial,sans-serif}#${IDS.panel}.open{display:flex;flex-direction:column}.slx-h,.slx-t,.slx-s{display:flex;gap:8px;align-items:center;padding:10px;border-bottom:1px solid #2d3742;flex-wrap:wrap}.slx-h{background:#111821}.slx-h b{font-size:16px;color:#f8fafc}.slx-h b,.slx-s span{flex:1}.slx-s{background:#121a23;font-size:14px;line-height:1.35}.slx-s span{color:#e5e7eb}.slx-s b{color:#facc15}.slx-t input,.slx-t select,.slx-t button,.slx-a,.slx-h button{background:#18212c;color:#f8fafc;border:1px solid #475569;border-radius:8px;padding:9px 10px;font-size:14px}.slx-t button{font-weight:800}.slx-t input{min-width:180px;flex:1}.slx-body{overflow:auto;flex:1;background:#0d1117}.slx-body table{width:100%;border-collapse:collapse;table-layout:auto}.slx-body td,.slx-body th{padding:9px 8px;border-bottom:1px solid #26313c;text-align:left;vertical-align:top;font-size:14px;line-height:1.35}.slx-body th{position:sticky;top:0;background:#121a23;color:#f1f5f9;z-index:2}.slx-body td:first-child{min-width:190px}.slx-body td:nth-child(2){min-width:130px}.slx-a{display:inline-block;text-decoration:none;margin:2px}.safe{color:#4ade80!important;font-weight:900}.risky{color:#fbbf24!important;font-weight:900}.skip{color:#fb7185!important;font-weight:900}.slx-presence{display:block;margin-top:3px;font-size:11px;font-weight:900;white-space:nowrap}.slx-presence.torn{color:#4ade80}.slx-presence.flying{color:#7dd3fc}.slx-presence.abroad{color:#c4b5fd}.slx-presence.hospital,.slx-presence.jail,.slx-presence.federal,.slx-presence.fallen{color:#fda4af}.slx-presence.unknown{color:#94a3b8}.slx-wait{display:inline-block;color:#94a3b8;font-size:10px;font-weight:900;padding:3px}.slx-modal{display:none;position:absolute;inset:0;z-index:20;background:#0c1015f5;padding:16px;overflow:auto;font-size:14px}.slx-modal.open{display:block}.slx-modal input{width:100%;padding:10px;margin:4px 0 10px;background:#11161c;color:#fff;border:1px solid #475569;border-radius:8px;font-size:14px}@media(max-width:640px){#${IDS.panel}{right:4px;width:calc(100vw - 8px);height:82vh;font-size:14px}.slx-h,.slx-t,.slx-s{padding:9px}.slx-t input,.slx-t select,.slx-t button{min-height:42px;font-size:14px}.slx-body td,.slx-body th{font-size:13px;padding:8px 6px}.slx-body td:first-child{min-width:170px}.slx-a{padding:8px 9px}}`;document.head.appendChild(s)}
function safeCss(){if($('#slx-elim-safe-style'))return;const x=document.createElement('style');x.id='slx-elim-safe-style';x.textContent=`#slx-safe-open{border-color:#237a4b!important;background:#123523!important;color:#86efac!important;white-space:nowrap!important}#slx-safe-count{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;margin-left:3px;padding:0 4px;border-radius:999px;background:#22c55e;color:#07150d;font-size:9px;font-weight:900}.slx-safe-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.slx-safe-head h3{margin:0;color:#86efac}.slx-safe-note{margin:8px 0;color:#a7b2c0;font-size:11px;line-height:1.45}.slx-safe-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0}.slx-safe-actions button{min-height:40px;margin:0!important;font-weight:900}.slx-safe-list{border:1px solid #2d3742;border-radius:10px;overflow:hidden}.slx-safe-empty{padding:18px;color:#94a3b8;text-align:center}.slx-safe-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:9px;border-bottom:1px solid #26313c;background:#111821}.slx-safe-row:last-child{border-bottom:0}.slx-safe-player{min-width:0}.slx-safe-player a{color:#86efac;text-decoration:none;font-weight:900}.slx-safe-player small{display:block;margin-top:3px;color:#94a3b8}.slx-safe-remove{min-width:34px!important;margin:0!important;color:#fda4af!important}.slx-safe-danger{grid-column:1/3;background:#54232f!important;border-color:#864354!important;color:#ffd7df!important}`;(document.head||document.documentElement).appendChild(x)}
let safeUiObserver=null;
function installSafeTargetsUi(){const p=$('#'+IDS.panel);if(!p||$('#slx-safe-open',p))return;safeCss();const header=$('.slx-h',p);if(!header)return;const openButton=document.createElement('button');openButton.id='slx-safe-open';openButton.type='button';openButton.innerHTML='SAFE <span id="slx-safe-count">0</span>';const settings=$('#slx-set',header);header.insertBefore(openButton,settings||header.lastElementChild);const modal=document.createElement('div');modal.className='slx-modal';modal.id='slx-safe-list-modal';modal.innerHTML='<div class="slx-safe-head"><h3>Remembered SAFE Targets</h3><button class="slx-a" id="slx-safe-close">CLOSE</button></div><div class="slx-safe-note" id="slx-safe-total"></div><div class="slx-safe-note">Every target detected as SAFE and currently in Torn is saved automatically across LOAD NEXT batches and future sessions.</div><div class="slx-safe-actions"><button class="slx-a" id="slx-safe-copy">COPY ALL SAFE</button><button class="slx-a" id="slx-safe-export">EXPORT SAFE</button><button class="slx-a slx-safe-danger" id="slx-safe-clear">CLEAR ALL</button></div><div class="slx-safe-list" id="slx-safe-list"></div>';p.appendChild(modal);openButton.onclick=openSafeTargets;$('#slx-safe-close',modal).onclick=()=>modal.classList.remove('open');$('#slx-safe-copy',modal).onclick=()=>busy(copyAllSafe);$('#slx-safe-export',modal).onclick=()=>busy(exportSafeTargets);$('#slx-safe-clear',modal).onclick=clearSafeTargets;renderSafeTargets()}
function watchSafeTargetsUi(){if(safeUiObserver)return;safeCss();installSafeTargetsUi();safeUiObserver=new MutationObserver(installSafeTargetsUi);safeUiObserver.observe(document.documentElement,{childList:true,subtree:true})}
function apiCss(){if($('#slx-elim-api-style'))return;const x=document.createElement('style');x.id='slx-elim-api-style';x.textContent=`.slx-key-button{border-color:#7c681e!important;background:#2a2512!important;color:#f5d85f!important}.slx-api-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.slx-api-head h3{margin:0;color:#fff;font-size:17px}.slx-api-sub{margin-top:3px;color:#8e96a3;font-size:10px}.slx-api-required{padding:10px;border:1px solid #66591d;border-radius:9px;background:#211d10;color:#e4c95d;font-size:11px;line-height:1.5}.slx-api-create{display:block!important;width:100%;box-sizing:border-box;margin:9px 0!important;text-align:center;background:#2a2512!important;color:#f5d85f!important;border-color:#7c681e!important;font-weight:900}.slx-api-box{margin:9px 0;padding:9px;border:1px solid #2f3945;border-radius:9px;background:#121820}.slx-api-status{display:flex;justify-content:space-between;gap:8px;padding:8px;border-radius:7px;background:#181d24;font-size:10px;line-height:1.35}.slx-api-status b{color:#d7b94c}.slx-api-status.ok span{color:#78d98b}.slx-api-status.error span,.slx-api-status.missing span,.slx-api-status.missing-permission span{color:#f08b8b}.slx-api-source,.slx-api-note{margin:8px 0;color:#9ca3af;font-size:9px;line-height:1.45}.slx-api-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.slx-api-actions button,.slx-api-clear{min-height:36px;border:0;border-radius:8px;background:#374151;color:#fff;font-weight:900;font-size:10px}.slx-api-actions button:first-child{background:#2563eb}.slx-api-clear{width:100%;margin-top:7px}.slx-ff-box{border-color:#43385a;background:#171321}.slx-ff-title{color:#c4b5fd;font-size:12px;font-weight:900;margin-bottom:4px}.slx-manual-box{margin-top:9px;padding-top:9px;border-top:1px solid #2f3945}.slx-manual-save{width:100%}`;document.head.appendChild(x)}
function syncApiButton(){apiCss();const b=$('#slx-set');if(!b)return;b.textContent='🔑';b.title='API Access';b.setAttribute('aria-label','API Access');b.classList.add('slx-key-button');const status=$('#slx-status');if(status&&status.textContent.includes('Settings'))status.textContent=status.textContent.replace('Settings','API Access')}
function compactCss(){if($('#slx-elim-compact-style'))return;const x=document.createElement('style');x.id='slx-elim-compact-style';x.textContent=`#${IDS.panel}{right:4px!important;bottom:72px!important;width:min(920px,calc(100vw - 8px))!important;height:88vh!important;max-height:calc(100vh - 88px)!important;font-size:13px!important}.slx-h{padding:6px 8px!important;gap:6px!important}.slx-h b{font-size:14px!important}.slx-t{padding:5px 7px!important;gap:5px!important;flex-wrap:nowrap!important}.slx-top #slx-team{flex:1!important;min-width:0!important}.slx-search{align-items:center!important;flex-wrap:nowrap!important;position:relative!important}.slx-target-wrap{position:relative!important;flex:0 0 auto!important}.slx-search #slx-targets-btn{min-width:118px!important;min-height:34px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;font-weight:900!important}.slx-search #slx-targets-count{display:none!important;min-width:17px!important;height:17px!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;background:#2563eb!important;color:#fff!important;font-size:9px!important}.slx-search #slx-targets-count.on{display:inline-flex!important}.slx-targets-menu{display:none!important;position:absolute!important;left:0!important;top:calc(100% + 6px)!important;z-index:50!important;width:184px!important;padding:8px!important;border:1px solid #334155!important;border-radius:12px!important;background:linear-gradient(160deg,#17202b,#10161e)!important;box-shadow:0 14px 30px rgba(0,0,0,.48)!important}.slx-targets-menu.open{display:block!important}.slx-targets-title{padding:2px 3px 7px!important;color:#8fa0b5!important;font-size:9px!important;font-weight:900!important;letter-spacing:.35px!important;text-transform:uppercase!important}.slx-target-option{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;min-height:35px!important;margin:3px 0!important;padding:7px 9px!important;box-sizing:border-box!important;border:1px solid #263545!important;border-radius:9px!important;background:#121a23!important;color:#d6dee8!important;font-size:10px!important;font-weight:850!important;cursor:pointer!important;transition:background .16s ease,border-color .16s ease!important}.slx-target-option:hover{background:#151f2a!important}.slx-target-option span{order:1!important;flex:1!important;white-space:nowrap!important;letter-spacing:.1px!important}.slx-target-option input{order:2!important;appearance:none!important;-webkit-appearance:none!important;position:relative!important;width:40px!important;height:22px!important;min-width:40px!important;max-width:40px!important;min-height:22px!important;max-height:22px!important;margin:0!important;padding:0!important;border:1px solid #46576b!important;border-radius:999px!important;background:#25303d!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.35)!important;outline:none!important;transition:background .18s ease,border-color .18s ease!important;cursor:pointer!important}.slx-target-option input:before{content:''!important;position:absolute!important;top:2px!important;left:2px!important;width:16px!important;height:16px!important;border-radius:50%!important;background:#b9c4d0!important;box-shadow:0 1px 2px rgba(0,0,0,.45)!important;transition:transform .18s ease,background .18s ease!important}.slx-target-option input:checked{background:#2563eb!important;border-color:#3b82f6!important}.slx-target-option input:checked:before{transform:translateX(18px)!important;background:#fff!important}.slx-target-option:has(input:checked){border-color:#334a62!important;background:#14202c!important;color:#eef4fb!important}.slx-target-option.safe-opt:has(input:checked){border-color:#315b43!important;color:#93e6ad!important}.slx-target-option.safe-opt input:checked{background:#198754!important;border-color:#2aa66a!important}.slx-target-option.risky-opt:has(input:checked){border-color:#625225!important;color:#f1d56b!important}.slx-target-option.risky-opt input:checked{background:#8a6f16!important;border-color:#b69428!important}.slx-targets-menu #slx-targets-clear{width:100%!important;margin-top:7px!important;min-height:30px!important;border:1px solid #344357!important;border-radius:8px!important;background:#1a2430!important;color:#aeb9c7!important;font-size:9px!important;font-weight:900!important}.slx-search #slx-q{flex:1 1 auto!important;min-width:0!important}.slx-t input,.slx-t select,.slx-t button{min-height:34px!important;padding:6px 7px!important;font-size:12px!important}.slx-s{padding:4px 7px!important;gap:5px!important;flex-wrap:nowrap!important;min-height:32px!important}.slx-s span{min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:11px!important}.slx-s b{font-size:11px!important;white-space:nowrap!important;color:#facc15!important}.slx-cal-mini{background:#2a220b!important;color:#fde68a!important;border:1px solid #7c5f11!important;border-radius:7px!important;padding:4px 6px!important;min-height:26px!important;font-size:10px!important;font-weight:900!important;white-space:nowrap!important}.slx-body table{table-layout:fixed!important}.slx-body col.signal{width:32%}.slx-body col.player{width:28%}.slx-body col.lvl{width:7%}.slx-body col.last{width:9%}.slx-body col.actions{width:24%}.slx-body th,.slx-body td{font-size:11px!important;padding:5px 3px!important;line-height:1.12!important;vertical-align:middle!important;overflow:hidden!important}.slx-body td:first-child{min-width:0!important;white-space:pre-line!important}.slx-body td:nth-child(2){min-width:0!important;white-space:nowrap!important;text-overflow:ellipsis!important}.slx-body td:nth-child(2) small{display:block;font-size:8px;color:#94a3b8}.slx-body td:nth-child(2) .slx-presence{font-size:9px!important;overflow:hidden;text-overflow:ellipsis}.slx-body td:nth-child(3),.slx-body td:nth-child(4){text-align:center;white-space:nowrap}.slx-body td:nth-child(3){color:#fde047!important;font-weight:900!important;text-shadow:0 1px 1px #000}.slx-body td:nth-child(4){color:#bae6fd!important;font-weight:900!important;text-shadow:0 1px 1px #000}.slx-player{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.slx-actions{white-space:nowrap!important;text-align:right!important}.slx-action-grid{display:grid!important;grid-template-columns:minmax(34px,1fr) 24px!important;grid-template-rows:repeat(2,22px)!important;gap:2px!important;align-items:stretch!important}.slx-action-grid>.atk,.slx-action-grid>.slx-wait{grid-column:1!important;grid-row:1/3!important;align-self:center!important}.slx-action-grid>.win{grid-column:2!important;grid-row:1!important}.slx-action-grid>.loss{grid-column:2!important;grid-row:2!important}.slx-action-grid>.win,.slx-action-grid>.loss{min-height:22px!important;min-width:24px!important;padding:1px 3px!important;margin:0!important}.slx-actions .slx-a{display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:9px!important;padding:3px 4px!important;min-height:24px!important;min-width:22px!important;margin:1px!important}.slx-actions .atk{min-width:34px!important;font-weight:900!important}.slx-actions .win{color:#86efac!important}.slx-actions .loss{color:#fda4af!important}.safe{color:#4ade80!important}.risky{color:#fbbf24!important}.skip{color:#fb7185!important}@media(max-width:640px){#${IDS.panel}{height:90vh!important;max-height:calc(100vh - 72px)!important}}`;document.head.appendChild(x)}
function removeTouchingGrassWidget(){
  const panel=$('#'+IDS.panel);if(!panel)return false;
  const leaves=[...panel.querySelectorAll('*')].filter(el=>/touching\s+grass\s+targets/i.test((el.textContent||'').trim()));
  for(const leaf of leaves){
    let node=leaf;
    for(let depth=0;node&&node!==panel&&depth<7;depth++,node=node.parentElement){
      const txt=(node.textContent||'').replace(/\s+/g,' ').trim();
      if(/touching\s+grass\s+targets/i.test(txt)&&/target\s*list/i.test(txt)&&/show\s*all/i.test(txt)&&/apply/i.test(txt)){
        node.remove();
        return true;
      }
    }
  }
  return false;
}
function guardAgainstForeignTargetWidgets(){
  const panel=$('#'+IDS.panel);if(!panel)return;
  removeTouchingGrassWidget();
  if(panel.__slxForeignWidgetObserver)return;
  const observer=new MutationObserver(()=>removeTouchingGrassWidget());
  observer.observe(panel,{childList:true,subtree:true});
  panel.__slxForeignWidgetObserver=observer;
  setTimeout(removeTouchingGrassWidget,100);
  setTimeout(removeTouchingGrassWidget,800);
}
function inject(){if(!state.enabled||$('#'+IDS.panel))return;css();compactCss();const b=document.createElement('button');b.id=IDS.button;b.textContent='ELIM ⚔';const p=document.createElement('div');p.id=IDS.panel;p.innerHTML=`<div class="slx-h"><b>SakaLuX Elimination Assistant v${VERSION}</b><button id="slx-set">⚙</button><button id="slx-close">✕</button></div><div class="slx-t slx-top"><select id="slx-team"><option value="">Team…</option></select><button id="slx-load">LOAD NEXT</button><button id="slx-ff">FF SCAN</button><button id="slx-export" title="Export Targets for TornPDA">EXPORT TARGETS</button></div><div class="slx-t slx-search"><div class="slx-target-wrap"><button id="slx-targets-btn" type="button">TARGETS <span id="slx-targets-count"></span>⌄</button><div id="slx-targets-menu" class="slx-targets-menu"><div class="slx-targets-title">Target filters</div><label class="slx-target-option"><input type="checkbox" data-filter="attackable"><span>ATTACKABLE</span></label><label class="slx-target-option safe-opt"><input type="checkbox" data-filter="safe"><span>SAFE</span></label><label class="slx-target-option risky-opt"><input type="checkbox" data-filter="risky"><span>RISKY</span></label><label class="slx-target-option"><input type="checkbox" data-filter="unopened"><span>UNOPENED</span></label><button type="button" id="slx-targets-clear">CLEAR</button></div></div><input id="slx-q" placeholder="Player / ID"></div><div class="slx-s"><span id="slx-status">${getTornKey()?'API key ready.':'Set a Torn API key in Settings or Hub.'}</span><button class="slx-cal-mini" id="slx-cal">CALIBRATE</button><b id="slx-summary"></b></div><div class="slx-body"><table><colgroup><col class="signal"><col class="player"><col class="lvl"><col class="last"><col class="actions"></colgroup><thead><tr><th>Signal</th><th>Player / Status</th><th>Lvl</th><th>Last</th><th>Actions</th></tr></thead><tbody id="slx-rows"></tbody></table></div><div class="slx-modal" id="slx-settings"><h3>Settings</h3><p>${window.SakaLuXScriptHub?.getApiKey?.()?'Using the shared SakaLuX Hub Torn API key. ':''}TEST TORN KEY checks battlestats and Eliminations separately. API 32 on eliminationteam means that Torn is not currently exposing that event endpoint; it is not treated as a bad API key.</p><button class="slx-a" id="slx-create">🔑 ${window.SakaLuXScriptHub?'CREATE GENERAL HUB KEY':'CREATE REQUIRED TORN KEY'}</button> <button class="slx-a" id="slx-test">🧪 TEST TORN KEY</button><label>Standalone Torn API key</label><input id="slx-torn"><label>FFScouter API key (optional, separate service)</label><input id="slx-ffkey"><label>Manual total BS</label><input id="slx-manual" type="number"><button class="slx-a" id="slx-save">SAVE</button> <button class="slx-a" id="slx-cancel">CLOSE</button></div>`;document.body.append(b,p);guardAgainstForeignTargetWidgets();b.onclick=()=>{p.classList.toggle('open');guardAgainstForeignTargetWidgets()};$('#slx-close',p).onclick=()=>p.classList.remove('open');$('#slx-set',p).onclick=openSettings;$('#slx-cancel',p).onclick=()=>$('#slx-settings',p).classList.remove('open');$('#slx-save',p).onclick=saveSettings;$('#slx-create',p).onclick=createKey;$('#slx-test',p).onclick=()=>busy(testKey);$('#slx-load',p).onclick=()=>busy(loadNextTeamBatch);$('#slx-ff',p).onclick=()=>busy(()=>loadFF(true));$('#slx-export',p).onclick=()=>busy(exportTargets);$('#slx-cal',p).onclick=()=>busy(()=>calibrate(true));$('#slx-q',p).oninput=apply;$$('#slx-targets-menu input[data-filter]',p).forEach(x=>x.onchange=apply);$('#slx-targets-btn',p).onclick=e=>{e.stopPropagation();$('#slx-targets-menu',p).classList.toggle('open')};$('#slx-targets-menu',p).onclick=e=>e.stopPropagation();$('#slx-targets-clear',p).onclick=()=>{$$('#slx-targets-menu input[data-filter]',p).forEach(x=>x.checked=false);apply()};document.addEventListener('click',()=>$('#slx-targets-menu',p)?.classList.remove('open'));$('#slx-team',p).onchange=e=>{state.teamId=Number(e.target.value||0);localStorage.setItem(K.team,String(state.teamId||''));state.players=[];state.view=[];state.batchRawCount=0;render();setStatus('Team selected · press LOAD NEXT')};if(getTornKey())busy(refresh)}
function removeUI(){$('#'+IDS.panel)?.remove();$('#'+IDS.button)?.remove();$('#'+HUB_PROMPT_ID)?.remove()}
function setEnabled(v){state.enabled=!!v;localStorage.setItem(K.enabled,state.enabled?'1':'0');state.enabled?inject():removeUI();syncApiButton();syncHubPower();setTimeout(syncHubPower,180);window.dispatchEvent(new CustomEvent('SakaLuXEliminationAssistantStateChanged',{detail:{enabled:state.enabled,version:VERSION}}));syncHubBridge('elimination-assistant',state.enabled);return state.enabled}
function toggleEnabled(){return setEnabled(!state.enabled)}
function syncHubBridge(id,value){const bridge=document.getElementById('sakalux-module-bridge-'+id);if(bridge)bridge.dataset.enabled=String(Boolean(value))}
function installHubBridge(id,openHandler){let bridge=document.getElementById('sakalux-module-bridge-'+id);if(!bridge){bridge=document.createElement('button');bridge.type='button';bridge.id='sakalux-module-bridge-'+id;bridge.hidden=true;(document.body||document.documentElement).appendChild(bridge)}bridge.dataset.version=VERSION;bridge.dataset.enabled=String(Boolean(state.enabled));bridge.onclick=()=>{const action=bridge.dataset.action;if(action==='open')openHandler();else if(action==='toggle')toggleEnabled();else if(action==='on'||action==='off')setEnabled(action==='on');bridge.dataset.action='';syncHubBridge(id,state.enabled)}}
function setStatus(t){const e=$('#slx-status');if(e)e.textContent=t}
function createKey(){if(state.keyBusy)return false;state.keyBusy=true;setTimeout(()=>state.keyBusy=false,2500);state.tornAccessStatus='setup';state.tornAccessMessage='Create the named key in Torn, then return and paste it below.';try{sessionStorage.setItem('SakaLuX_ELIM_KEY_SETUP_PENDING','1')}catch{}location.href=TORN_KEY_CREATE_URL;return true}
function apiSetupPending(){try{return sessionStorage.getItem('SakaLuX_ELIM_KEY_SETUP_PENDING')==='1'}catch{return false}}
function updateAccessPanel(){
  const m=$('#slx-settings');if(!m)return;getTornKey();
  const ts=$('#slx-torn-status',m),fs=$('#slx-ff-status',m),source=$('#slx-torn-source',m);
  if(ts){ts.className='slx-api-status '+state.tornAccessStatus;$('span',ts).textContent=state.tornAccessMessage}
  if(fs){fs.className='slx-api-status '+state.ffAccessStatus;$('span',fs).textContent=state.ffAccessMessage}
  if(source)source.innerHTML='Active source: <b>'+esc(state.tornKeySource)+'</b>';
}
function openSettings(){
  apiCss();syncApiButton();const m=$('#slx-settings');if(!m)return false;getTornKey();
  m.innerHTML=`
    <div class="slx-api-head"><div><h3>🔑 Elimination API Access</h3><div class="slx-api-sub">SakaLuX Elimination Assistant v${VERSION}</div></div><button class="slx-a" id="slx-cancel">✕</button></div>
    <div class="slx-api-required"><b>Exact Torn permissions required</b><br>User: Battlestats<br>Torn: Elimination + Elimination Team<br>No write permission is requested.</div>
    <button class="slx-a slx-api-create" id="slx-create">🔑 CREATE ELIMINATION API KEY</button>
    <div class="slx-api-box">
      <div class="slx-api-status ${esc(state.tornAccessStatus)}" id="slx-torn-status"><b>TORN API ACCESS</b><span>${esc(state.tornAccessMessage)}</span></div>
      <div class="slx-api-source" id="slx-torn-source">Active source: <b>${esc(state.tornKeySource)}</b></div>
      <label>Replace / paste standalone Torn API key</label><input id="slx-torn" type="password" autocomplete="off" placeholder="Paste newly created Torn key here" value="${esc(state.tornKey)}">
      <div class="slx-api-actions"><button id="slx-save-torn">SAVE & TEST</button><button id="slx-test">CHECK ACCESS</button></div>
      <button class="slx-api-clear" id="slx-clear-torn">CLEAR LOCAL TORN KEY</button>
      <div class="slx-api-note">The Hub general key is used first when available. The local key remains the standalone fallback.</div>
    </div>
    <div class="slx-api-box slx-ff-box">
      <div class="slx-ff-title">📊 FFSCOUTER — OPTIONAL, SEPARATE SERVICE</div>
      <div class="slx-api-status ${esc(state.ffAccessStatus)}" id="slx-ff-status"><b>FFSCOUTER ACCESS</b><span>${esc(state.ffAccessMessage)}</span></div>
      <label>FFScouter API key</label><input id="slx-ffkey" type="password" autocomplete="off" placeholder="Paste FFScouter key here" value="${esc(state.ffKey)}">
      <div class="slx-api-actions"><button id="slx-save-ff">SAVE & TEST FF</button><button id="slx-open-ff">OPEN FFSCOUTER</button></div>
      <button class="slx-api-clear" id="slx-clear-ff">CLEAR FFSCOUTER KEY</button>
      <div class="slx-api-note">FFScouter supplies optional Fair Fight and estimated battle-stat data. It is not part of Torn API and is never stored in the Hub key.</div>
    </div>
    <div class="slx-manual-box"><label>Manual total battle stats fallback</label><input id="slx-manual" type="number" inputmode="numeric" placeholder="Optional" value="${state.my.source==='manual'?(state.my.total||''):''}"><button class="slx-a slx-manual-save" id="slx-save-manual">SAVE MANUAL BS</button></div>`;
  m.classList.add('open');
  $('#slx-cancel',m).onclick=()=>m.classList.remove('open');
  $('#slx-create',m).onclick=createKey;
  $('#slx-save-torn',m).onclick=async()=>{const key=$('#slx-torn',m).value.trim();if(!key){$('#slx-torn',m).focus();return}state.tornKey=key;localStorage.setItem(K.torn,key);try{sessionStorage.removeItem('SakaLuX_ELIM_KEY_SETUP_PENDING')}catch{}const b=$('#slx-save-torn',m);b.textContent='CHECKING…';const ok=await testKey(key);b.textContent=ok?'TORN KEY OK ✓':'SAVED · CHECK FAILED';updateAccessPanel();if(ok)busy(refresh)};
  $('#slx-test',m).onclick=async()=>{const b=$('#slx-test',m);b.textContent='CHECKING…';const ok=await testKey($('#slx-torn',m).value.trim());b.textContent=ok?'ACCESS OK ✓':'CHECK FAILED';updateAccessPanel()};
  $('#slx-clear-torn',m).onclick=()=>{state.tornKey='';localStorage.removeItem(K.torn);const remaining=getTornKey();state.tornAccessStatus=remaining?'unknown':'missing';state.tornAccessMessage=remaining?'Local key cleared · Hub key remains active':'No Torn API key configured';$('#slx-torn',m).value='';updateAccessPanel()};
  $('#slx-save-ff',m).onclick=async()=>{const key=$('#slx-ffkey',m).value.trim();if(!key){$('#slx-ffkey',m).focus();return}state.ffKey=key;localStorage.setItem(K.ff,key);const b=$('#slx-save-ff',m);b.textContent='CHECKING…';const ok=await testFFKey(key);b.textContent=ok?'FF KEY OK ✓':'SAVED · CHECK FAILED';updateAccessPanel()};
  $('#slx-open-ff',m).onclick=()=>window.open('https://ffscouter.com/','_blank','noopener');
  $('#slx-clear-ff',m).onclick=()=>{state.ffKey='';localStorage.removeItem(K.ff);state.ffAccessStatus='missing';state.ffAccessMessage='No FFScouter key configured';$('#slx-ffkey',m).value='';updateAccessPanel()};
  $('#slx-save-manual',m).onclick=()=>{const n=Number($('#slx-manual',m).value||0);if(n>0){state.my={total:n,at:Date.now(),source:'manual'};save(K.my,state.my);apply();$('#slx-save-manual',m).textContent='SAVED ✓'}};
  return true;
}
function saveSettings(){const m=$('#slx-settings');state.tornKey=$('#slx-torn',m).value.trim();state.ffKey=$('#slx-ffkey',m).value.trim();const n=Number($('#slx-manual',m).value||0);if(n>0){state.my={total:n,at:Date.now(),source:'manual'};save(K.my,state.my)}localStorage.setItem(K.torn,state.tornKey);localStorage.setItem(K.ff,state.ffKey);m.classList.remove('open');busy(refresh)}
async function testKey(keyOverride=''){
  const typed=String(keyOverride||$('#slx-torn')?.value||'').trim();
  if(typed){state.tornKey=typed;localStorage.setItem(K.torn,typed)}
  const key=typed||getTornKey();
  if(!key){state.tornAccessStatus='missing';state.tornAccessMessage='No Torn API key configured';updateAccessPanel();return false}
  const out=[];let failed=false,testTeam=state.teamId;
  try{await torn('user/battlestats',{},key);out.push('battlestats: OK')}catch(e){out.push('battlestats: FAIL'+(e.code?' API '+e.code:''));failed=true}
  try{const elimination=await torn('torn/elimination',{},key);out.push('elimination: OK');if(!testTeam)testTeam=normTeams(elimination)[0]?.id||0}
  catch(e){if(Number(e.code)===32)out.push('elimination: UNAVAILABLE API 32');else{out.push('elimination: FAIL'+(e.code?' API '+e.code:''));failed=true}}
  if(testTeam){
    try{await torn(`torn/${testTeam}/eliminationteam`,{limit:1,offset:0},key);out.push('eliminationteam: OK')}
    catch(e){if(Number(e.code)===32)out.push('eliminationteam: UNAVAILABLE API 32');else{out.push('eliminationteam: FAIL'+(e.code?' API '+e.code:''));failed=true}}
  }else out.push('eliminationteam: no active team available');
  state.tornAccessStatus=failed?'missing-permission':'ok';
  state.tornAccessMessage=failed?'TORN KEY MISSING REQUIRED ACCESS':out.join(' · ');
  state.tornAccessCheckedAt=Date.now();setStatus(out.join(' | '));updateAccessPanel();return!failed;
}
async function testFFKey(keyOverride=''){
  const key=String(keyOverride||state.ffKey||'').trim();
  if(!key){state.ffAccessStatus='missing';state.ffAccessMessage='No FFScouter key configured';updateAccessPanel();return false}
  try{const target=state.players[0]?.id||2380374;await ffReq([target],key);state.ffAccessStatus='ok';state.ffAccessMessage='FFScouter access OK';updateAccessPanel();return true}
  catch(e){state.ffAccessStatus='error';state.ffAccessMessage=String(e?.message||e||'FFScouter request failed');updateAccessPanel();return false}
}
async function calibrate(force=false){if(state.my.source==='manual'&&!force)return state.my.total;if(!force&&state.my.total&&Date.now()-Number(state.my.at||0)<900000)return state.my.total;const raw=await torn('user/battlestats');const x=raw?.battlestats??raw?.data?.battlestats??raw?.data??raw??{};const statVal=k=>{const v=x?.[k]??x?.battle_stats?.[k]??0;if(v&&typeof v==='object')return Number(v.value??v.amount??v.total??v.base??0)||0;return Number(v)||0};const apiTotal=Number(x?.total??x?.total_battlestats??0)||0;const total=apiTotal||['strength','defense','speed','dexterity'].reduce((sum,k)=>sum+statVal(k),0);if(!total)throw new Error('Battle stats endpoint replied, but no stat values were found. Check Torn API key access.');state.my={total,at:Date.now(),source:'Torn API'};save(K.my,state.my);apply();setStatus('Battle stats calibrated: '+fmtBS(total));return total}
function renderTeamOptions(){const e=$('#slx-team');if(!e)return;e.innerHTML='<option value="">Team…</option>'+state.teams.map(t=>`<option value="${t.id}" ${t.id===state.teamId?'selected':''}>${esc(t.name)}</option>`).join('')}
async function loadTeams(){const fresh=normTeams(await torn('torn/elimination'));if(fresh.length){state.teams=fresh;save(K.teams,state.teams)}else if(!state.teams.length){state.teamId=0;localStorage.removeItem(K.team);renderTeamOptions();throw new Error('Torn returned no Elimination teams. The saved team was cleared so an old team cannot be loaded silently. Refresh and try again.')}if(!state.teams.some(t=>t.id===state.teamId))state.teamId=state.teams[0]?.id||0;if(state.teamId)localStorage.setItem(K.team,String(state.teamId));renderTeamOptions()}
async function loadTeam(startOffset=Number(state.batchOffsets[String(state.teamId)]||0)){if(!state.teamId)throw new Error('Choose a team');startOffset=Math.max(0,Math.floor(Number(startOffset)||0));setStatus(`Loading targets ${startOffset+1}–${startOffset+500}…`);const a=[];for(let off=startOffset,i=0;i<5;i++,off+=100){let raw;try{raw=await torn(`torn/${state.teamId}/eliminationteam`,{limit:100,offset:off})}catch(e){if(Number(e.code)===32)throw new Error('Elimination team data is currently unavailable from Torn (API 32). Your API key was not rejected; try again when Torn enables the Eliminations team endpoint.');throw e}const batch=normPlayers(raw);a.push(...batch);if(batch.length<100)break}if(!a.length&&startOffset>0){setStatus('End reached · returning to the first 500 targets…');return loadTeam(0)}state.players=[...new Map(a.map(p=>[p.id,p])).values()];state.batchRawCount=a.length;state.batchOffsets[String(state.teamId)]=startOffset;save(K.batches,state.batchOffsets);applyCache();apply();const end=startOffset+a.length;let note=a.length?`Batch ${startOffset+1}–${end} · ${state.players.length} players`:'No players returned';if(a.length<500)note+=' · end reached, next LOAD wraps to 1';if(state.ffKey){try{await loadFF(false);note+=' · FF ready'}catch(e){apply();note+=' · FFScouter unavailable: '+e.message}}setStatus(note);return state.players.length}
async function loadNextTeamBatch(){if(!state.teamId)throw new Error('Choose a team');const current=Number(state.batchOffsets[String(state.teamId)]||0);const next=state.players.length?(state.batchRawCount>=500?current+500:0):current;return loadTeam(next)}
function applyCache(){for(const p of state.players){const c=state.cache[String(p.id)];if(c&&Date.now()-Number(c.at||0)<1800000){p.ff=c.ff||null;p.bs=c.bs||null}}}
async function copyText(text){if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return}catch{}}const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(area);area.focus();area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Clipboard access was blocked')}
function cleanSafeTargets(){const map=new Map;for(const x of Array.isArray(state.safeTargets)?state.safeTargets:[]){const id=Number(x?.id||0);if(id>0)map.set(id,{id,name:String(x.name||('Player '+id)),level:Number(x.level||0),score:Number(x.score||0),teamId:Number(x.teamId||0),addedAt:Number(x.addedAt||Date.now()),seenAt:Number(x.seenAt||x.addedAt||Date.now())})}state.safeTargets=[...map.values()].slice(-5000)}
function rememberSafeTargets(){cleanSafeTargets();const map=new Map(state.safeTargets.map(x=>[x.id,x]));let changed=false;for(const p of state.players){if(!attackable(p)||risk(p).label!=='SAFE')continue;const old=map.get(p.id),next={id:p.id,name:p.name,level:p.level||0,score:smart(p),teamId:state.teamId||0,addedAt:old?.addedAt||Date.now(),seenAt:Date.now()};if(!old||old.name!==next.name||old.level!==next.level||old.score!==next.score||old.teamId!==next.teamId){map.set(p.id,next);changed=true}}if(changed){state.safeTargets=[...map.values()].sort((a,b)=>a.addedAt-b.addedAt).slice(-5000);save(K.safe,state.safeTargets)}renderSafeTargets()}
function renderSafeTargets(){cleanSafeTargets();const count=state.safeTargets.length,badge=$('#slx-safe-count');if(badge)badge.textContent=String(count);const total=$('#slx-safe-total');if(total)total.textContent=`${count} remembered SAFE target${count===1?'':'s'}`;const list=$('#slx-safe-list');if(!list)return;const rows=[...state.safeTargets].sort((a,b)=>b.addedAt-a.addedAt);list.innerHTML=rows.length?rows.map(x=>`<div class="slx-safe-row"><div class="slx-safe-player"><a href="https://www.torn.com/profiles.php?XID=${x.id}" target="_blank" rel="noopener noreferrer">${esc(x.name)} [${x.id}]</a><small>Score ${x.score}/100${x.level?' · Level '+x.level:''} · saved ${age(Math.floor(x.addedAt/1000))} ago</small></div><button class="slx-a slx-safe-remove" data-id="${x.id}" title="Remove saved target">✕</button></div>`).join(''):'<div class="slx-safe-empty">SAFE targets will be remembered automatically while loading and scanning batches.</div>';$$('.slx-safe-remove',list).forEach(b=>b.onclick=()=>removeSafeTarget(Number(b.dataset.id)))}
function openSafeTargets(){renderSafeTargets();$('#slx-safe-list-modal')?.classList.add('open')}
function removeSafeTarget(id){state.safeTargets=state.safeTargets.filter(x=>Number(x.id)!==Number(id));save(K.safe,state.safeTargets);renderSafeTargets();setStatus(`Removed target ${id} from SAFE list`)}
function clearSafeTargets(){if(!state.safeTargets.length)return;if(!confirm(`Clear all ${state.safeTargets.length} remembered SAFE targets?`))return;state.safeTargets=[];save(K.safe,state.safeTargets);renderSafeTargets();setStatus('Remembered SAFE targets cleared')}
async function copyAllSafe(){cleanSafeTargets();if(!state.safeTargets.length)throw new Error('No remembered SAFE targets yet');await copyText(state.safeTargets.map(x=>`https://www.torn.com/profiles.php?XID=${x.id}`).join('\n'));setStatus(`Copied ${state.safeTargets.length} remembered SAFE profile links`);return state.safeTargets.length}
async function exportSafeTargets(){cleanSafeTargets();if(!state.safeTargets.length)throw new Error('No remembered SAFE targets yet');const payload={target_backup:state.safeTargets.map(x=>({id:x.id,notes:`SakaLuX SAFE · Score ${x.score}/100`,notes_color:'green'}))};await copyText(JSON.stringify(payload));setStatus(`Copied ${state.safeTargets.length} remembered SAFE targets · TornPDA: Chaining → Targets → Import / Export → paste → Add`);return state.safeTargets.length}
async function exportTargets(){if(!state.view.length)throw new Error('Load and filter targets first');const list=state.view.filter(p=>attackable(p)&&risk(p).label!=='SKIP');if(!list.length)throw new Error('No attackable SAFE/RISKY targets in the current filtered list');const payload={target_backup:list.map(p=>{const r=risk(p);return{id:p.id,notes:`SakaLuX ${r.label} · Score ${smart(p)}/100 · ${presence(p).label}`,notes_color:r.label==='SAFE'?'green':'red'}})};await copyText(JSON.stringify(payload));setStatus(`Copied ${list.length} targets · TornPDA: Chaining → Targets → Import / Export → paste → Add`);return list.length}
async function loadFF(force=false){if(!state.players.length)throw new Error('Load a team first');if(!state.ffKey)throw new Error('Set FFScouter API key');const ids=state.players.filter(p=>force||!state.cache[String(p.id)]||Date.now()-Number(state.cache[String(p.id)].at||0)>=1800000).map(p=>p.id),all=[];for(let i=0;i<ids.length;i+=205)all.push(...normFF(await ffReq(ids.slice(i,i+205))));for(const x of all)state.cache[String(x.id)]={...x,at:Date.now()};save(K.cache,state.cache);applyCache();apply();setStatus('FF scan ready')}
function updateTargetFilterCount(){const n=$$('#slx-targets-menu input[data-filter]:checked').length,c=$('#slx-targets-count');if(c){c.textContent=n?String(n):'';c.classList.toggle('on',n>0)}}
function apply(){const q=($('#slx-q')?.value||'').toLowerCase();const filters=new Set($$('#slx-targets-menu input[data-filter]:checked').map(x=>x.dataset.filter));let a=state.players.filter(p=>!q||p.name.toLowerCase().includes(q)||String(p.id).includes(q));a=a.filter(p=>{const r=risk(p);if(filters.has('attackable')&&!attackable(p))return false;if(filters.has('unopened')&&state.history.some(h=>Number(h.id)===p.id))return false;const riskFilters=['safe','risky'].filter(x=>filters.has(x));if(riskFilters.length){const key=String(r.label||'').toLowerCase();if(!riskFilters.includes(key))return false}return true});a.sort((x,y)=>smart(y)-smart(x));state.view=a;updateTargetFilterCount();rememberSafeTargets();render()}
function render(){const e=$('#slx-rows');if(!e)return;e.innerHTML=state.view.map(p=>{const r=risk(p),c=r.label==='SAFE'?'safe':r.label==='RISKY'?'risky':'skip',l=learn(p.id),st=presence(p),action=unavailable(p)?`<span class="slx-wait">WAIT</span>`:`<a class="slx-a atk" data-id="${p.id}" href="https://www.torn.com/loader.php?sid=attack&user2ID=${p.id}" target="_blank" rel="noopener noreferrer">ATK</a>`;return`<tr><td class="${c}">${esc(signal(p))}</td><td><a class="slx-a slx-player" href="https://www.torn.com/profiles.php?XID=${p.id}" target="_blank">${esc(p.name)}</a><small> ${l.wins}W/${l.losses}L</small><span class="slx-presence ${st.key}" title="${esc(st.detail)}">${st.icon} ${esc(st.label)}</span></td><td>${p.level||'—'}</td><td>${age(p.last)}</td><td class="slx-actions"><div class="slx-action-grid">${action}<button class="slx-a win" data-id="${p.id}">W</button><button class="slx-a loss" data-id="${p.id}">L</button></div></td></tr>`}).join('');$$('.atk',e).forEach(a=>a.onclick=()=>{const p=state.players.find(x=>x.id===Number(a.dataset.id));if(p){state.history.unshift({id:p.id,name:p.name,action:'opened',at:Date.now()});save(K.hist,state.history.slice(0,1000))}});$$('.win',e).forEach(b=>b.onclick=()=>record(state.players.find(x=>x.id===Number(b.dataset.id)),'win'));$$('.loss',e).forEach(b=>b.onclick=()=>record(state.players.find(x=>x.id===Number(b.dataset.id)),'loss'));const safe=state.players.filter(p=>!unavailable(p)&&risk(p).label==='SAFE').length,tornCount=state.players.filter(attackable).length;$('#slx-summary').textContent=`TORN ${tornCount} · SAFE ${safe}`}
function record(p,res){if(!p)return;const l=learn(p.id);res==='win'?l.wins++:l.losses++;state.learning[String(p.id)]=l;save(K.learn,state.learning);apply()}
async function refresh(){if(!state.enabled)return false;await loadTeams();if(state.teamId)await loadTeam();state.lastRefresh=Date.now();return true}
async function busy(fn){if(!state.enabled||state.busy)return false;state.busy=true;try{await fn();return true}catch(e){console.error('[SakaLuX Elimination]',e);setStatus('Error: '+e.message);return false}finally{state.busy=false}}
function open(){if(!state.enabled)setEnabled(true);inject();syncApiButton();$('#'+IDS.panel)?.classList.add('open');return true}
function close(){$('#'+IDS.panel)?.classList.remove('open')}
function health(){const batchStart=Number(state.batchOffsets[String(state.teamId)]||0);return{version:VERSION,enabled:state.enabled,ready:state.enabled&&!!$('#'+IDS.panel),hasApiKey:Boolean(getTornKey()),apiMode:state.tornKeySource,tornAccessStatus:state.tornAccessStatus,tornAccessMessage:state.tornAccessMessage,hasFFScouterKey:Boolean(state.ffKey),ffAccessStatus:state.ffAccessStatus,targets:state.players.length,rememberedSafeTargets:state.safeTargets.length,batchStart:batchStart+1,batchEnd:batchStart+state.batchRawCount,myBattleStats:state.my.total||null,lastRefresh:state.lastRefresh}}
function goToEliminations(){location.href='https://www.torn.com/page.php?sid=elimination'}
window.SakaLuXEliminationAssistant={version:VERSION,open,close,openApiSettings:openSettings,openSafeTargets,refresh:()=>busy(refresh),scanFF:()=>busy(()=>loadFF(true)),exportTargets:()=>busy(exportTargets),copyAllSafe:()=>busy(copyAllSafe),exportSafeTargets:()=>busy(exportSafeTargets),calibrate:()=>busy(()=>calibrate(true)),testTornKey:()=>busy(testKey),testFFScouterKey:()=>busy(testFFKey),createRequiredTornKey:createKey,setEnabled,toggleEnabled,isEnabled:()=>state.enabled,goToEliminations,health};
window.dispatchEvent(new CustomEvent('SakaLuXEliminationAssistantReady',{detail:{version:VERSION,enabled:state.enabled}}));
watchSafeTargetsUi();
function persistTargetUI(){const panel=$('#'+IDS.panel);if(!panel)return;state.ui.query=$('#slx-q',panel)?.value||'';state.ui.filters=$$('#slx-targets-menu input[data-filter]:checked',panel).map(x=>x.dataset.filter);state.ui.panelOpen=panel.classList.contains('open');save(K.ui,state.ui)}
function restoreTargetUI(){const panel=$('#'+IDS.panel);if(!panel||panel.dataset.slxUiRestored==='1')return;panel.dataset.slxUiRestored='1';renderTeamOptions();const q=$('#slx-q',panel);if(q)q.value=String(state.ui.query||'');const selected=new Set(Array.isArray(state.ui.filters)?state.ui.filters:[]);$$('#slx-targets-menu input[data-filter]',panel).forEach(x=>x.checked=selected.has(x.dataset.filter));panel.classList.toggle('open',!!state.ui.panelOpen);apply()}
function installUIPersistence(){document.addEventListener('input',e=>{if(e.target?.id==='slx-q')persistTargetUI()});document.addEventListener('change',e=>{if(e.target?.matches?.('#slx-targets-menu input[data-filter]'))persistTargetUI()});document.addEventListener('click',e=>{if(e.target?.id==='slx-targets-clear')setTimeout(persistTargetUI,0);if(e.target?.id==='slx-elim-btn'||e.target?.id==='slx-close')setTimeout(persistTargetUI,0)});new MutationObserver(restoreTargetUI).observe(document.documentElement,{childList:true,subtree:true});restoreTargetUI()}
function start(){installUIPersistence();try{localStorage.setItem('SakaLuX_Installed_elimination-assistant',VERSION);localStorage.setItem('SakaLuX_Installed_elimination',VERSION)}catch{}installHubBridge('elimination-assistant',open);syncHubPower();setInterval(syncHubPower,900);if(state.enabled){inject();syncApiButton();setTimeout(showHubPrompt,1200);if(apiSetupPending()&&!/preferences\.php/i.test(location.pathname+location.href))setTimeout(()=>{open();openSettings()},900)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();


    /* SakaLuX Unified Control Center UI — visual layer only. */
    function installSakaLuXUnifiedTheme_elimination_assistant() {
        if (document.getElementById('sakalux-unified-theme-elimination-assistant')) return;
        const style = document.createElement('style');
        style.id = 'sakalux-unified-theme-elimination-assistant';
        style.textContent = `
:where([id^="slx-elim-"],[class*="slx-elim-"]){font-family:Inter,Arial,sans-serif!important;box-sizing:border-box}
:where([id^="slx-elim-"][id*="panel" i],[id^="slx-elim-"][id*="settings" i],[id^="slx-elim-"][id*="modal" i],[id^="slx-elim-"][id*="details" i]){background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%)!important;color:#e7edf5!important;border:1px solid #314154!important;border-radius:16px!important;box-shadow:0 18px 52px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.025)!important}
:where([class*="slx-elim-"][class*="header" i],[id^="slx-elim-"][id*="header" i]){background:linear-gradient(155deg,#1b2634,#111923)!important;border-color:#314154!important;color:#f8fafc!important}
:where([class*="slx-elim-"][class*="card" i],[class*="slx-elim-"][class*="row" i],[class*="slx-elim-"][class*="section" i],[class*="slx-elim-"][class*="note" i]){background:linear-gradient(145deg,#18212d,#131b25)!important;border-color:#2d3c4e!important;border-radius:12px!important;color:#dce6f0!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}
:where(button[id^="slx-elim-"],button[class*="slx-elim-"]){border:1px solid #3d78bf!important;border-radius:10px!important;background:linear-gradient(180deg,#377fcf,#275f9f)!important;color:#fff!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,filter .12s ease!important}
:where(button[id^="slx-elim-"],button[class*="slx-elim-"]):active{transform:translateY(1px)!important}
:where(input[id^="slx-elim-"],select[id^="slx-elim-"],textarea[id^="slx-elim-"],[id^="slx-elim-"] input,[id^="slx-elim-"] select,[id^="slx-elim-"] textarea){background:#0d141d!important;border:1px solid #3a4b61!important;border-radius:9px!important;color:#f4f7fb!important;outline:none!important}
:where(input[type="checkbox"][id^="slx-elim-"]){appearance:none!important;-webkit-appearance:none!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0 8px 0 0!important;vertical-align:middle!important;border:1px solid #546276!important;border-radius:999px!important;background:radial-gradient(circle at 10px 50%,#e7edf5 0 6px,transparent 6.5px),#465365!important;cursor:pointer!important;transition:.18s ease!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)!important}
:where(input[type="checkbox"][id^="slx-elim-"]):checked{border-color:#24754f!important;background:radial-gradient(circle at 27px 50%,#fff 0 6px,transparent 6.5px),#1eb36a!important}
:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[id*="close" i],:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[class*="close" i],:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[id*="back" i],:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[class*="gray" i],:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[class*="secondary" i]{background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}
:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[id*="clear" i],:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[id*="reset" i],:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[id*="delete" i],:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[class*="danger" i],:where(button[id^="slx-elim-"],button[class*="slx-elim-"])[class*="red" i]{background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
@media(max-width:520px){:where([id^="slx-elim-"][id*="panel" i],[id^="slx-elim-"][id*="settings" i],[id^="slx-elim-"][id*="modal" i],[id^="slx-elim-"][id*="details" i]){border-radius:15px!important}:where(button[id^="slx-elim-"],button[class*="slx-elim-"]){min-height:34px!important}}
`;
        (document.head || document.documentElement).appendChild(style);
    }
    installSakaLuXUnifiedTheme_elimination_assistant();

})();
// SAKALUX_INLINE_PANEL_FOOTER_V2
;(() => {
    const FOOTER_ID='sakalux-inline-footer-elimination-assistant';
    const PANEL_SELECTOR='#slx-elim';
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
