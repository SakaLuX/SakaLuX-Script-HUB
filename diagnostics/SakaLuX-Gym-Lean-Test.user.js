// ==UserScript==
// @name         SakaLuX Gym Optimizer (Lean Test)
// @namespace    https://sakalux.ro/
// @version      1.5.3-lean-test
// @description  Safe Gym stat planner with confirmed-only gym suggestions. TornPDA/Tampermonkey.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @homepageURL  https://github.com/SakaLuX/SakaLuX-Script-HUB
// ==/UserScript==

// Gym bootstrap: publish proof of script execution before Shared Core or UI initializes.
;(() => {
  try {
    const id='gym-optimizer',v='1.5.3',root=document.documentElement;
    if(!root)return;
    root.setAttribute('data-sakalux-installed-'+id,v);
    root.setAttribute('data-sakalux-gym-boot','loaded');
    let marker=document.getElementById('sakalux-module-bridge-'+id);
    if(!marker){marker=document.createElement('span');marker.id='sakalux-module-bridge-'+id;marker.hidden=true;root.appendChild(marker)}
    marker.dataset.version=v;
    marker.dataset.stage='loaded';
    addEventListener('error',event=>{
      const source=String(event.filename||'');
      if(source.includes('SakaLuX-Gym-Optimizer')||source.includes('sakalux-gym')){
        root.setAttribute('data-sakalux-gym-boot','error');
        marker.dataset.stage='error';
      }
    });
  } catch(e) {}
})();

/* Diagnostic variant: Shared Core supplied by the Hub, not embedded here. */

(() => {
  'use strict';
  // Register in a DOM bridge visible across userscript execution contexts.
  // Do this before the duplicate-instance guard: legacy live instances can still be detected.
  try {
    const ver='1.5.3',id='gym-optimizer';
    const html=document.documentElement;
    html?.setAttribute('data-sakalux-installed-'+id,ver);
    let node=document.getElementById('sakalux-module-bridge-'+id);
    if(!node){node=document.createElement('span');node.id='sakalux-module-bridge-'+id;node.hidden=true;(document.body||html)?.appendChild(node)}
    node.dataset.version=ver;
  }catch{}
  if (window.SakaLuXGymOptimizer) return;
  const KEY='slx_gym_optimizer_v1';
  const stats=['Strength','Speed','Defense','Dexterity'];
  const defaults={mode:'SakaLuX',weights:{Strength:0.8,Speed:1,Defense:0,Dexterity:1.25},values:{Strength:0,Speed:0,Defense:0,Dexterity:0},history:[],enabled:true};
  const presets={
    Balanced:[1,1,1,1],
    '3-stat (Defense dump)':[1,1,0,1],
    '3-stat (Dexterity dump)':[1,1,1,0],
    '2-stat (Str/Dex)':[1,0,0,1],
    '2-stat (Speed/Dex)':[0,1,0,1],
    // Strategy labels are adjustable starting templates, NOT purported StatForge equations.
    Baldr:[0.8,1,0,1],
    Hank:[1,1,1,0],
    SakaLuX:[0.8,1,0,1.25],
    Custom:[1,1,1,1]
  };
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
  const legacy=saved.mode==='Aec3';
  const state={...defaults,...saved,mode:legacy?'SakaLuX':(saved.mode||defaults.mode),values:{...defaults.values,...saved.values},weights:legacy?{Strength:0.8,Speed:1,Defense:0,Dexterity:1.25}:{...defaults.weights,...saved.weights}};
  if(legacy)try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const onGym=()=>/gym\.php/i.test(location.href)||/\bGym\b/i.test(document.title)&&/torn/i.test(location.host);
  const fmt=n=>Math.round(Number(n)||0).toLocaleString('en-US');
  const css=document.createElement('style');
  css.textContent='#slx-gym-toggle{position:fixed;right:10px;bottom:80px;z-index:2147483000;padding:9px 13px;background:#164d62;color:white;border:1px solid #59b9d5;border-radius:13px;font-weight:800}#slx-gym-panel{position:relative;z-index:1;width:100%;inset:auto;max-width:100%;margin:12px 0;background:#131923;color:#e8edf4;border:1px solid #52667a;border-radius:14px;display:flex;flex-direction:column;font:14px Arial,sans-serif;box-sizing:border-box;overflow:hidden}#slx-gym-panel[hidden],#slx-gym-toggle[hidden]{display:none!important}#slx-gym-panel .body{max-height:none!important}#slx-gym-panel .head button{display:none}#slx-gym-panel .head{display:flex;justify-content:space-between;padding:14px;background:#212c3b;font-weight:800}#slx-gym-panel .body{padding:12px;overflow:auto;flex:1}#slx-gym-panel input,#slx-gym-panel select{background:#0c1017;color:white;border:1px solid #52667a;border-radius:7px;padding:7px;max-width:100%;box-sizing:border-box}#slx-gym-panel button{background:#24566a;color:white;border:1px solid #557a8d;border-radius:8px;padding:8px;cursor:pointer}#slx-gym-panel .stat{display:grid;grid-template-columns:1fr 112px 64px;gap:6px;margin:7px 0;align-items:center}#slx-gym-panel .hint{font-size:12px;color:#aebdca;line-height:1.5}#slx-gym-panel .notice{padding:10px;background:#243544;border-radius:10px;margin:12px 0}';
  css.textContent += '#slx-gym-panel .slx-g-title{color:#888!important;font-size:12px!important;letter-spacing:2px!important;font-weight:bold!important;border-bottom:1px solid #333!important;padding:9px 0 5px!important;margin:8px 0!important}#slx-gym-panel{display:block!important;min-height:0!important;height:auto!important;overflow:visible!important;margin:8px 0 12px!important;border-radius:10px!important;background:#1b1b1b!important;border:1px solid #424242!important}#slx-gym-panel[hidden]{display:none!important}#slx-gym-panel .head{padding:8px 11px!important;font-size:13px!important;background:#303030!important;align-items:center}#slx-gym-panel .body{display:block!important;padding:10px!important;overflow:visible!important;flex:none!important}#slx-gym-panel .stat{grid-template-columns:minmax(65px,1fr) 90px 52px!important;gap:5px!important;margin:4px 0!important}#slx-gym-panel input,#slx-gym-panel select{padding:5px!important;font-size:13px!important;min-width:0!important}#slx-gym-panel .notice{margin:6px 0!important;padding:9px!important;border-left:3px solid #428cbe!important;background:#282828!important;font-size:13px!important}#slx-gym-panel .hint{font-size:11px!important;line-height:1.3!important}#slx-gym-panel .settings{display:none}#slx-gym-panel.expanded .settings{display:block}#slx-gym-panel .head button{display:inline-block!important;padding:4px 9px!important;font-size:12px!important}#slx-gym-panel .summary{font-size:12px;color:#c8d3dc;margin:5px 0}#slx-gym-panel .actions{display:flex;flex-wrap:wrap;gap:5px}#slx-gym-panel button{padding:6px!important;font-size:12px!important}';
  css.textContent += '#slx-gym-panel{font:13px Arial,sans-serif!important;background:#1b1b1b!important;color:#ddd!important;border:1px solid #383838!important;border-radius:6px!important;margin:10px 0!important;padding:8px 12px!important;box-shadow:none!important;position:relative!important;height:auto!important;max-height:none!important;z-index:1!important}#slx-gym-panel .head{background:transparent!important;color:#bbb!important;border-bottom:1px solid #383838!important;padding:8px 2px!important;letter-spacing:1px;font-size:13px!important}#slx-gym-panel .body{padding:4px!important;background:transparent!important;overflow:visible!important}#slx-gym-panel .notice{background:#262626!important;border:1px solid #383838!important;border-left:4px solid #4b96c3!important;color:#ddd!important;border-radius:6px!important;margin:8px 0!important;padding:12px 10px!important;font-size:13px!important}#slx-gym-panel .hint{color:#b1b1b1!important}#slx-gym-panel .settings{border-top:1px solid #393939!important;padding-top:8px}#slx-gym-panel .stat{margin:5px 0!important}#slx-gym-panel[hidden]{display:none!important}';
  css.textContent += '#slx-gym-panel{position:static!important;inset:auto!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;float:none!important;clear:both!important;display:block!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important;margin:12px 0!important;isolation:isolate!important}#slx-gym-panel[hidden]{display:none!important}';
  css.textContent += '#slx-gym-panel .slx-g-stat{margin:10px 1px!important}#slx-gym-panel .slx-g-statline{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px!important}#slx-gym-panel .slx-g-track{height:9px;border-radius:8px;background:#343434;margin:5px 0;overflow:hidden}';
  css.textContent += '#slx-gym-panel{background:#1c1c1c!important;color:#ddd!important;border:1px solid #303030!important;border-radius:7px!important;padding:5px 9px!important;margin:8px 0 14px!important;font:12px Arial,sans-serif!important;line-height:1.25!important}#slx-gym-panel .head{background:transparent!important;border-bottom:1px solid #363636!important;padding:7px 3px!important;font-size:12px!important}#slx-gym-panel .body{padding:5px 3px!important}#slx-gym-panel .notice{padding:7px 9px!important;margin:5px 0 9px!important;border-radius:5px!important;font-size:12px!important}#slx-gym-panel .slx-g-title{padding:5px 0 3px!important;margin:6px 0!important;font-size:11px!important}#slx-gym-panel .slx-g-stat{margin:7px 1px!important}#slx-gym-panel .slx-g-statline{font-size:12px!important}#slx-gym-panel .slx-g-track{height:7px!important;margin:4px 0!important}#slx-gym-panel .hint{font-size:11px!important;line-height:1.25!important}#slx-gym-panel button,#slx-gym-panel select{font-size:12px!important;padding:4px 6px!important}';
  css.textContent += '#slx-gym-panel{padding:0!important;background:#171717!important;border:1px solid #343434!important;border-top:3px solid #67b9eb!important;border-radius:5px!important;color:#ccc!important;font:12px Arial,sans-serif!important;overflow:hidden!important}#slx-gym-panel>.head{display:none!important}#slx-gym-panel .body{padding:0!important}#slx-gym-panel .sf-top{display:flex;justify-content:space-between;align-items:center;padding:13px 17px 12px;background:#171717;font-size:17px;letter-spacing:2px;border-bottom:1px solid #050505}#slx-gym-panel .sf-top strong{color:#78bdf0}#slx-gym-panel .sf-top span{color:#888;font-size:10px;letter-spacing:1px}#slx-gym-panel .sf-tabs{display:flex;justify-content:space-around;gap:1px;border-bottom:1px solid #070707;background:#161616}#slx-gym-panel .sf-tabs button{background:transparent!important;border:0!important;color:#888!important;padding:8px 3px!important;font-weight:bold!important;letter-spacing:1px!important;font-size:10px!important;flex:1}#slx-gym-panel .sf-tabs button.active{color:#6db9e5!important;border-bottom:2px solid #67baff!important}#slx-gym-panel .sf-overview{display:flex;justify-content:space-between;padding:20px 16px 12px;gap:7px}#slx-gym-panel .sf-eyebrow,#slx-gym-panel .sf-section{color:#999;letter-spacing:2px;font-size:11px;font-weight:bold}#slx-gym-panel .sf-ratio{display:flex;gap:9px;align-items:center;margin-top:9px}#slx-gym-panel .sf-ratio>b{font-size:40px;color:#f2bc32}#slx-gym-panel .sf-ratio span{font-weight:bold}#slx-gym-panel .sf-ratio small{display:block;color:#999}#slx-gym-panel .sf-total{font-size:28px;font-weight:bold;color:#78bafb;margin:6px 0}#slx-gym-panel .sf-gain{font-size:10px;letter-spacing:1px;color:#49cc83;font-weight:bold}#slx-gym-panel .sf-section{border-top:1px solid #323232;margin:9px 17px;padding-top:9px}#slx-gym-panel .sf-card{background:#242424;border:1px solid #3a3a3a;border-left:4px solid #5fb8ee;margin:6px 17px 14px;padding:12px 15px;border-radius:5px;line-height:1.4;color:#aaa;font-weight:600}#slx-gym-panel .sf-main{font-size:19px;font-weight:900;margin-bottom:3px}#slx-gym-panel .sf-purple{color:#b58dd8}#slx-gym-panel .sf-gold{color:#e9c247;margin-top:5px}#slx-gym-panel .sf-cap{display:flex;justify-content:space-between;margin:8px 0;font-size:13px}#slx-gym-panel .sf-card p{font-size:11px;color:#999;font-weight:400;margin-top:10px}#slx-gym-panel .sf-stat{margin:9px 17px 13px}#slx-gym-panel .sf-statline{display:flex;align-items:baseline;gap:7px;font-weight:800;font-size:14px}#slx-gym-panel .sf-statline small{font-size:10px;color:#aaa}#slx-gym-panel .sf-statline b{margin-left:auto;font-size:12px}#slx-gym-panel .sf-track{height:9px;border-radius:10px;background:#303030;margin:6px 0;overflow:hidden}#slx-gym-panel .sf-track>div{height:100%;border-radius:9px}#slx-gym-panel .sf-statmessage{font-size:11px;color:#aaa}#slx-gym-panel .sf-settings{padding:8px 16px 17px}#slx-gym-panel .sf-edit{display:grid;grid-template-columns:1fr 100px 58px;gap:5px;margin:7px 0;align-items:center}#slx-gym-panel .sf-edit input{min-width:0}#slx-gym-panel select{max-width:70%}';
  css.textContent += '#slx-gym-panel .sf-hrow{display:grid;grid-template-columns:1.1fr repeat(4,1fr) 1fr;gap:3px;text-align:center;align-items:center;padding:9px 1px;border-bottom:1px solid #303030;font-size:11px;font-weight:800}#slx-gym-panel .sf-history{margin:12px 15px;overflow-x:auto}#slx-gym-panel .sf-hrow small{display:block;color:#43cc84;font-size:10px}#slx-gym-panel .sf-hhead{color:#9a9a9a;font-size:9px;letter-spacing:0}#slx-gym-panel .sf-history-actions{display:flex;flex-direction:column;margin:12px 16px;gap:8px}#slx-gym-panel .sf-export{padding:5px 16px 20px}#slx-gym-panel .sf-export pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#242424;border:1px solid #3b3b3b;padding:12px;font:11px/1.5 monospace;color:#c7c7c7}#slx-gym-panel .sf-export button{width:100%;border:0!important;letter-spacing:1px!important}#slx-gym-panel .sf-info{padding:4px 4px 16px}#slx-gym-panel .sf-info p{padding:0 16px;line-height:1.6;font-weight:600;font-size:13px}#slx-gym-panel .sf-three{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 16px}#slx-gym-panel .sf-three div{background:#242424;border:1px solid #414141;padding:9px 2px;text-align:center;font-size:9px;color:#aaa}#slx-gym-panel .sf-three strong{display:block;font-size:22px;color:#e5ba54}';
  css.textContent += '#slx-gym-panel{max-height:none!important;overflow:visible!important;touch-action:pan-y!important}#slx-gym-panel .body{height:auto!important;max-height:none!important;overflow:visible!important;touch-action:pan-y!important}#slx-gym-panel .sf-card{padding:8px 10px!important;margin:5px 12px 9px!important}#slx-gym-panel .sf-overview{padding:11px 12px 5px!important}#slx-gym-panel .sf-section{margin:5px 12px!important;padding-top:5px!important}#slx-gym-panel .sf-stat{margin:6px 12px 9px!important}#slx-gym-panel .sf-top{padding:8px 12px!important}#slx-gym-panel .sf-tabs button{padding:6px 2px!important}#slx-gym-panel .sf-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}#slx-gym-panel .sf-feedback{font-size:11px;color:#b7c9d3}';
  css.textContent += '#slx-gym-panel .sf-estimate{font-size:11px;color:#b0bbc3;margin-top:7px}#slx-gym-panel .sf-actions button{font-size:11px!important}';
  (document.head||document.documentElement).append(css);
  const toggle=document.createElement('button');toggle.id='slx-gym-toggle';toggle.textContent='GYM ⚡';
  const panel=document.createElement('section');panel.id='slx-gym-panel';panel.hidden=true;
  panel.innerHTML='<div class="head"><span>SAKALUX GYM · v1.3.0</span><button data-settings>Settings ▾</button></div><div class="body"></div>';
  (document.body||document.documentElement).append(panel);
  toggle.hidden=true;
  const body=panel.querySelector('.body');
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Reading exact personal stats from arbitrary page text is ambiguous; manual values are authoritative.
  const target=()=>{
    const weights=stats.map(s=>Math.max(0,Number(state.weights[s])||0));
    const active=weights.map((w,i)=>w?i:-1).filter(x=>x>=0);
    if(!active.length)return null;
    const mean=Math.max(...active.map(i=>state.values[stats[i]]/weights[i]),1);
    const gaps=active.map(i=>({stat:stats[i],gap:Math.max(0,Math.ceil(mean*weights[i]-state.values[stats[i]]))}));
    gaps.sort((a,b)=>b.gap-a.gap);return gaps[0];
  };
  function confirmedGym(){
    // Never infer unlocked status from missing CSS classes, a gym title, or the existence of a locked button.
    // A user-confirmed gym is the one currently selected; alternate gyms require manual selection.
    const gym=document.querySelector('[class*="gymName"],[class*="selectedGym"],[data-testid="current-gym"]');
    return gym?.textContent?.trim().slice(0,80)||null;
  }
  const statColors={Strength:'#ff8754',Speed:'#37c9d9',Defense:'#ab86ec',Dexterity:'#38cb78'};
  const statNumber=s=>Number(String(s).replace(/,/g,''))||0;
  function nativeStats(){
    const found={};
    // Read individual Torn training tile headings, never global HUD or injected text.
    const buttons=[...document.querySelectorAll('button,input[type="button"]')].filter(b=>!panel.contains(b)&&/^train$/i.test((b.textContent||b.value||'').trim()));
    for(const button of buttons){
      let node=button.parentElement;
      for(let d=0;node&&d<5;d++,node=node.parentElement){
        if(node.contains(panel))break;
        const text=(node.innerText||'').replace(/\s+/g,' ');
        const matched=stats.find(n=>new RegExp('^'+n+'\\s+[\\d,.]+','i').test(text));
        if(!matched)continue;
        const value=text.match(new RegExp('^'+matched+'\\s+([\\d,]+(?:\\.\\d+)?)','i'));
        if(value&&statNumber(value[1])>0){found[matched]=statNumber(value[1]);break}
      }
    }
    return found;
  }
  function nativeStatTile(name){
    const candidates=[...document.querySelectorAll('button,input[type="button"]')].filter(b=>!panel.contains(b)&&/^train$/i.test((b.innerText||b.value||'').trim()));
    for(const b of candidates){
      let p=b.parentElement;
      for(let i=0;p&&i<5;i++,p=p.parentElement){
        const t=(p.innerText||'').slice(0,350);
        if(new RegExp('^\\s*'+name+'\\b','i').test(t))return p;
      }
    }
    return null;
  }
  function setNativeReps(stat,reps){
    const tile=nativeStatTile(stat);
    if(!tile)return false;
    const input=tile.querySelector('input[type="number"],input[inputmode="numeric"],input[type="text"]');
    if(!input||input.disabled||input.readOnly)return false;
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(!setter)return false;
    setter.call(input,String(Math.max(1,Math.min(999,Math.floor(reps)))));
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    input.focus();
    return true;
  }
  function unlockedGymButton(name){
    const all=[...document.querySelectorAll('button,[role="button"]')].filter(b=>!panel.contains(b));
    return all.find(b=>{
      const label=(b.innerText||b.getAttribute('aria-label')||'').trim();
      if(!label.toLowerCase().includes(name.toLowerCase()))return false;
      const outer=(b.className||'')+' '+(b.parentElement?.className||'');
      const disabled=b.disabled||b.getAttribute('aria-disabled')==='true'||/locked|disabled|unavailable|purchase/i.test(outer);
      // Require affirmative unlock data; lack of a lock CSS class is not proof.
      const affirmative=b.dataset.unlocked==='true'||b.getAttribute('data-unlocked')==='true'||b.getAttribute('aria-label')?.toLowerCase().includes('unlocked');
      return Boolean(affirmative&&!disabled);
    })||null;
  }

  // Torn Wiki standard gym values (dots) and approximate energy for the NEXT gym.
  // Membership/unlock is never inferred from this list.
  const gymTable=[
    ['Premier Fitness',5,[2,2,2,2],200],['Average Joes',5,[2.4,2.4,2.8,2.4],500],
    ["Woody's Workout",5,[2.8,3.2,3,2.8],1000],['Beach Bods',5,[3.2,3.2,3.2,0],2000],
    ['Silver Gym',5,[3.4,3.6,3.4,3.2],2750],['Pour Femme',5,[3.4,3.6,3.6,3.8],3000],
    ['Davies Den',5,[3.7,0,3.7,3.7],3500],['Global Gym',5,[4,4,4,4],4000],
    ['Knuckle Heads',10,[4.8,4.4,4,4.2],6000],['Pioneer Fitness',10,[4.4,4.5,4.8,4.4],7000],
    ['Anabolic Anomalies',10,[5,4.5,5.2,4.5],8000],['Core',10,[5,5.2,5,5],11000],
    ['Racing Fitness',10,[5,5.4,4.8,5.2],12420],['Complete Cardio',10,[5.5,5.8,5.5,5.2],18000],
    ['Legs, Bums and Tums',10,[0,5.6,5.6,5.8],18100],['Deep Burn',10,[6,6,6,6],24140],
    ['Apollo Gym',10,[6,6.2,6.4,6.2],31260],['Gun Shop',10,[6.6,6.4,6.2,6.2],36610],
    ['Force Training',10,[6.4,6.6,6.4,6.8],46640],["Cha Cha's",10,[6.4,6.4,6.8,7],56520],
    ['Atlas',10,[7,6.4,6.4,6.6],67775],['Last Round',10,[6.8,6.6,7,6.6],84535],
    ['The Edge',10,[6.8,7,7,6.8],106305],["George's",10,[7.3,7.3,7.3,7.3],null]
  ];
  // A deliberately conservative detector: a displayed title is not proof of unlock.
  // The currently active gym is known usable; any other gym must be explicitly marked unlocked/owned
  // by Torn's own DOM before actions are permitted.
  function gymAvailability(){
    const activeName=confirmedGym();
    const choices=new Map();
    if(activeName)choices.set(activeName.toLowerCase(),{name:activeName,active:true,button:null});
    const candidates=[...document.querySelectorAll('button,[role="button"],a')].filter(el=>!panel.contains(el));
    for(const el of candidates){
      const label=(el.textContent||el.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ');
      const g=gymTable.find(g=>label.toLowerCase()===g[0].toLowerCase());
      if(!g)continue;
      const explicit=el.getAttribute('data-unlocked')==='true'||el.dataset?.unlocked==='true'||el.getAttribute('aria-label')?.toLowerCase().includes('unlocked');
      if(!explicit||el.disabled||el.getAttribute('aria-disabled')==='true')continue;
      choices.set(g[0].toLowerCase(),{name:g[0],active:false,button:el});
    }
    return choices;
  }
  function bestAvailable(stat){
    const ix=stats.indexOf(stat);if(ix<0)return null;
    const owned=gymAvailability();
    return gymTable.filter(g=>g[2][ix]>0&&owned.has(g[0].toLowerCase()))
      .map(g=>({name:g[0],dot:g[2][ix],energy:g[1],...owned.get(g[0].toLowerCase())}))
      .sort((a,b)=>b.dot-a.dot)[0]||null;
  }
  function nextGymEstimate(){
    const current=confirmedGym(),idx=gymTable.findIndex(g=>g[0].toLowerCase()===String(current||'').toLowerCase());
    if(idx<0||idx>=gymTable.length-1)return null;
    // Wiki value is an estimate for that step, not a live remaining-gym-XP amount.
    const next=gymTable[idx+1],energy=gymTable[idx][3];
    return {name:next[0],energy,minimumDays:energy?Math.ceil(energy/150):null};
  }
  function clickNativeTrain(stat){
    const tile=nativeStatTile(stat);
    if(!tile)return false;
    const train=[...tile.querySelectorAll('button,input[type="button"],[role="button"]')]
      .find(b=>/^(train)$/i.test((b.innerText||b.value||'').trim())&&!b.disabled&&b.getAttribute('aria-disabled')!=='true');
    if(!train)return false;
    train.click();return true;
  }

  // Perks are displayed only when returned by Torn API. An unknown stacking rule is
  // never silently converted into a claimed exact training bonus.
  let gymApi={status:'Not checked',data:null,at:0};
  const GYM_KEY_STORAGE='sakalux_gym_api_key_v1';
  // Shared Hub key has priority; personal key is persisted locally as fallback.
  function hubApiKey(){
    try{
      const h=window.SakaLuXScriptHub;
      const shared=typeof h?.getApiKey==='function'?String(h.getApiKey()||'').trim():'';
      if(/^[a-zA-Z0-9]{16}$/.test(shared))return shared;
    }catch{}
    try{
      // Hub's saved fallback key, looked up using its own storage constant only
      // when the Hub runtime is not directly reachable.
      const key=localStorage.getItem(GYM_KEY_STORAGE)||'';
      if(/^[a-zA-Z0-9]{16}$/.test(key))return key;
    }catch{}
    return '';
  }
  function savePersonalKey(key){
    const clean=String(key||'').trim();
    if(clean&&!/^[a-zA-Z0-9]{16}$/.test(clean))return false;
    try{
      if(clean)localStorage.setItem(GYM_KEY_STORAGE,clean);
      else localStorage.removeItem(GYM_KEY_STORAGE);
      return true;
    }catch{return false}
  }
  function registerGym(){
    try{
      const version='1.5.3',id='gym-optimizer';
      window.__SakaLuXInstalledVersions=window.__SakaLuXInstalledVersions||{};
      window.__SakaLuXInstalledVersions[id]=version;
      document.documentElement?.setAttribute('data-sakalux-installed-'+id,version);
      let bridge=document.getElementById('sakalux-module-bridge-'+id);
      if(!bridge){bridge=document.createElement('span');bridge.id='sakalux-module-bridge-'+id;bridge.hidden=true;(document.body||document.documentElement).appendChild(bridge)}
      bridge.dataset.version=version;
    }catch{}
  }
  function apiRequest(url){
    return new Promise((resolve,reject)=>{
      if(typeof GM_xmlhttpRequest==='function'){
        GM_xmlhttpRequest({method:'GET',url,timeout:12000,onload:r=>{try{resolve(JSON.parse(r.responseText))}catch(e){reject(e)}},onerror:()=>reject(new Error('Network error')),ontimeout:()=>reject(new Error('Timeout'))});
      } else fetch(url).then(r=>r.json()).then(resolve,reject);
    });
  }
  async function refreshGymApi(){
    const key=hubApiKey();
    if(!key){gymApi.status='No Hub API key available';render();return}
    gymApi.status='Loading';render();
    try{
      const data=await apiRequest('https://api.torn.com/user/?selections=perks,bars,gym,battlestats&key='+encodeURIComponent(key));
      if(data?.error)throw Error(data.error.error||'Torn API returned an error');
      gymApi={status:'Updated',data,at:Date.now()};
    }catch(e){gymApi.status='Unavailable: '+String(e.message||e).slice(0,100)}
    render();
  }
  function perkGroups(){
    const p=gymApi.data?.perks||{};
    return Object.entries(p).filter(([,v])=>Array.isArray(v))
      .map(([group,entries])=>({group,entries:entries.map(x=>typeof x==='string'?x:(x?.description||x?.name||'')).filter(t=>/gym|train|steadfast|strength|speed|defense|dexterity|happy|energy/i.test(t))}))
      .filter(g=>g.entries.length);
  }
  function gymEnergy(){
    const d=gymApi.data||{},current=d.energy||d.bars?.energy;
    return Number(current?.current??current?.amount??d?.energy?.current);
  }
  function safeReps(stat){
    const energy=gymEnergy();
    // An exact limit cannot be inferred from a displayed ratio alone because
    // special-gym criteria vary. Conservatively avoid automatic cap extrapolation.
    const tile=nativeStatTile(stat);
    const input=tile?.querySelector('input[type="number"],input[inputmode="numeric"],input[type="text"]');
    const cost=Number(tile?.getAttribute('data-energy-cost'));
    if(!Number.isFinite(energy)||energy<1||!Number.isFinite(cost)||cost<=0)return null;
    return Math.max(0,Math.min(999,Math.floor(energy/cost)));
  }
  function specialGymSafety(actual){
    const high=Number(actual.Dexterity)||0;
    const secondary=Math.max(Number(actual.Strength)||0,Number(actual.Speed)||0);
    if(!high||!secondary)return 'Ratio safety not verified — missing stats';
    const ratio=high/secondary;
    return 'DEX / highest secondary = '+ratio.toFixed(3)+'×. Gym eligibility must still be checked in Torn.';
  }

  const gymCalc={
    num(v){const n=Number(v);return Number.isFinite(n)?n:null},
    // Changes to gym XP are derived only from exposed fields; API shapes vary across v1/v2.
    xp(){
      const g=gymApi.data?.gym||{};
      const progress=g.progress||g.experience||g.gym_experience||{};
      const direct=this.num(g.energy_remaining??g.energy_to_next??progress.energy_remaining);
      if(direct!==null&&direct>=0)return {remaining:direct,source:'API energy remaining'};
      const total=this.num(progress.required??progress.next_required??g.next_required);
      const current=this.num(progress.current??progress.value??g.gym_experience_current);
      if(total!==null&&current!==null&&total>=current)return {remaining:total-current,source:'API gym experience'};
      return null;
    },
    modifiers(stat){
      const out=[];for(const group of perkGroups()){
        for(const line of group.entries){
          const t=line.toLowerCase();
          if(!/gym gain|gym train|train.*gain|steadfast/.test(t))continue;
          const names=['strength','speed','defense','dexterity'];
          const references=names.filter(n=>t.includes(n));
          if(references.length&&!references.includes(stat.toLowerCase()))continue;
          const m=line.match(/(?:increase|bonus|gain|steadfast)[^%]*?(\d+(?:\.\d+)?)\s*%/i)||line.match(/(\d+(?:\.\d+)?)\s*%[^.]*gym/i);
          if(!m){out.push({group:group.group,text:line,value:null});continue}
          const pct=Number(m[1]);if(pct>=0&&pct<=200)out.push({group:group.group,text:line,value:pct});
        }
      }
      return out;
    },
    gain(stat,rep=1){
      const st=Number(gymApi.data?.[stat.toLowerCase()]??state.values[stat]);
      const happiness=Number(gymApi.data?.happy?.current??gymApi.data?.bars?.happy?.current);
      const gym=confirmedGym();const row=gymTable.find(g=>g[0].toLowerCase()===String(gym||'').toLowerCase());
      if(!row||!Number.isFinite(st)||st<=0||!Number.isFinite(happiness)||happiness<0)return null;
      const idx=stats.indexOf(stat),dots=row[2][idx];if(!dots)return null;
      const effects=this.modifiers(stat);
      if(effects.some(x=>x.value===null))return {estimate:null,reason:'Unparsed gym perk: '+effects.find(x=>x.value===null).text};
      // Wiki approximation, not an exact real-world guarantee.
      const multi=effects.reduce((a,x)=>a*(1+x.value/100),1);
      const H=happiness+250;
      const one=(3.480061091e-7*Math.log(H)+3.091619094e-6)*st+6.82775184551527e-5*H-0.0301431777;
      const estimate=Math.max(0,multi*dots*row[1]*one*rep);
      return {estimate,multi,dots,effects,happiness};
    },
    eta(){
      const xp=this.xp(),e=gymEnergy();
      const progress=gymApi.data?.gym||{};
      const regeneration=Number(progress.energy_per_day??progress.daily_energy);
      const rate=Number.isFinite(regeneration)&&regeneration>0?regeneration:null;
      if(!xp)return {text:'ETA unavailable: Gym EXP / energy remaining is not exposed by the current response.'};
      if(xp.remaining===0)return {text:'Next gym threshold reached — check membership in Torn.'};
      if(!rate)return {text:'Remaining: '+fmt(xp.remaining)+' gym energy ('+xp.source+'). ETA needs verified energy/day; no guessed unlock time.'};
      const days=xp.remaining/rate;
      return {text:'~'+days.toFixed(1)+' days ('+fmt(xp.remaining)+' energy remaining at '+fmt(rate)+' E/day). Estimation assumes all future energy is spent at Gym.'};
    },
    headroom(actual){
      const dex=Number(actual.Dexterity);
      const second=Math.max(Number(actual.Strength),Number(actual.Speed),Number(actual.Defense));
      if(!Number.isFinite(dex)||!Number.isFinite(second)||dex<=0)return null;
      const threshold=dex/1.25;
      return {maxSecondary:Math.floor(threshold),remaining:Math.max(0,Math.floor(threshold-second)),eligible:dex>=1.25*second};
    }
  };
  function render(){
    const live=nativeStats(),actual={...state.values,...live};
    const active=stats.filter(n=>Number(state.weights[n])>0 && Number(actual[n])>0);
    const baseline=active.length?Math.max(...active.map(n=>actual[n]/state.weights[n])):0;
    const targets=Object.fromEntries(stats.map(n=>[n,Number(state.weights[n])>0?Math.ceil(baseline*state.weights[n]):0]));
    const gaps=active.map(n=>({stat:n,gap:Math.max(0,targets[n]-actual[n])})).sort((a,b)=>b.gap-a.gap);
    const next=active.length>=2&&gaps.some(x=>x.gap>0)?gaps[0]:null;
    const planGym=next?bestAvailable(next.stat):null,estimate=nextGymEstimate();
    const gym=confirmedGym(),total=stats.reduce((sum,n)=>sum+(Number(actual[n])||0),0);
    const complete=stats.every(n=>Number(actual[n])>0);
    const pct=active.length?Math.round(100*active.reduce((sum,n)=>sum+Math.min(1,(actual[n]||0)/(targets[n]||1)),0)/active.length):0;
    const snapshots=state.history||[];
    const previous=snapshots[snapshots.length-1]?.values||{};
    const oldTotal=stats.reduce((sum,n)=>sum+(Number(previous[n])||0),0);
    const gain=oldTotal?total-oldTotal:null;
    const tab=panel.dataset.tab||'OVERVIEW';
    const esc=escape;
    const tabs=['OVERVIEW','HISTORY','EXPORT','SETTINGS','INFO'];
    const header='<div class="sf-top"><strong>SAKALUX GYM</strong><span>SAKALUX · DEXTERITY HIGH</span></div><div class="sf-tabs">'+tabs.map(t=>'<button data-tab="'+t+'" class="'+(tab===t?'active':'')+'">'+t+'</button>').join('')+'</div>';
    const info='<div class="sf-overview"><div><div class="sf-eyebrow">RATIO HEALTH</div><div class="sf-ratio"><b>'+(!complete?'—':pct>=98?'A':pct>=90?'B':pct>=80?'C':'D')+'</b><span>'+(!complete?'Awaiting stats':pct+'% toward targets')+'<small>SakaLuX Ratio</small></span></div></div><div style="text-align:right"><div class="sf-eyebrow">TOTAL BATTLE STATS</div><div class="sf-total">'+(total?fmt(total):'—')+'</div><div class="sf-gain">'+(gain==null?'NO SAVED BASELINE':(gain>=0?'+':'')+fmt(gain)+' SINCE SNAPSHOT')+'</div></div></div>';
    const train='<div class="sf-section">TRAIN NEXT</div><div class="sf-card">'+(next?'<div class="sf-main" style="color:'+statColors[next.stat]+'">'+esc(next.stat)+'</div><div>Currently '+fmt(actual[next.stat])+' · Target '+fmt(targets[next.stat])+' · Need +'+fmt(next.gap)+'</div>':'<div class="sf-main">Waiting for stat values</div>')+
      '<div class="sf-actions">'+(next?'<button data-reps="'+next.stat+'">SET 999 '+next.stat.toUpperCase()+'</button><button id="slx-gym-train" data-train="'+next.stat+'">TRAIN '+next.stat.toUpperCase()+'</button>':'')+'</div>'+
      '<div class="sf-gold">Best verified gym: '+(planGym?esc(planGym.name)+' ('+planGym.dot+' dots)':'not verified')+'</div>'+
      (planGym&&!planGym.active?'<div class="sf-actions"><button id="slx-gym-switch" data-gym="'+esc(planGym.name)+'">SWITCH TO '+esc(planGym.name).toUpperCase()+'</button></div>':'')+
      (estimate?'<div class="sf-estimate">Next standard gym: '+esc(estimate.name)+' · approx. '+fmt(estimate.energy)+' energy for this unlock step (not remaining energy). No accurate ETA until gym EXP progress is available.</div>':'')+
      '<div class="sf-feedback" role="status"></div></div>';
    const headroom='<div class="sf-section">▼ HEADROOM TO GYM LIMIT</div><div class="sf-card"><div>Energy: read from Torn HUD</div>'+stats.map(n=>'<div class="sf-cap"><b style="color:'+statColors[n]+'">'+n+'</b><span>limit not verified</span></div>').join('')+'<p>Special gym caps cannot be validated. No locked gym will be recommended or switched to.</p></div>';
    const statView='<div class="sf-section">▼ STATS</div>'+stats.map((n,i)=>{
      const value=Number(actual[n])||0,t=targets[n],w=Number(state.weights[n])||0,progress=t?Math.min(100,100*value/t):0;
      const order=[...stats].sort((a,b)=>(Number(actual[b])||0)-(Number(actual[a])||0)).indexOf(n)+1;
      const message=w===0?'! Dump - minimize':!value?'Unknown - enter stats':value>=t?'OK - on target':'Need +'+fmt(t-value);
      return '<div class="sf-stat"><div class="sf-statline"><span style="color:'+statColors[n]+'">'+n+'</span><small>'+(w===0?'DUMP':order===1?'1ST':order===2?'2ND':order===3?'3RD':'4TH')+'</small><b>'+fmt(value)+(t?' / '+fmt(t):'')+'</b></div><div class="sf-track"><div style="width:'+progress+'%;background:'+statColors[n]+'"></div></div><div class="sf-statmessage">'+message+'</div></div>';
    }).join('');
    const groups=perkGroups(),eta=gymCalc.eta(),head=gymCalc.headroom(actual),gainInfo=next?gymCalc.gain(next.stat):null;
    const perkPanel='<div class="sf-section">GYM PERKS & ENERGY</div><div class="sf-card"><button id="slx-gym-api-refresh">REFRESH API</button><div>API: '+escape(gymApi.status)+(gymApi.at?' · '+new Date(gymApi.at).toLocaleTimeString():'')+'</div><div>Energy: '+(Number.isFinite(gymEnergy())?fmt(gymEnergy()):'unavailable')+'</div><div>'+escape(specialGymSafety(actual))+'</div><div class="sf-perks">'+(groups.length?groups.map(g=>'<p><b>'+escape(g.group)+'</b>: '+g.entries.map(escape).join(' · ')+'</p>').join(''):'No verified gym perks loaded')+'</div><div><b>Next gym ETA:</b> '+escape(eta.text)+'</div><div><b>DEX 1.25 safety:</b> '+(head?'Secondary maximum '+fmt(head.maxSecondary)+' / remaining '+fmt(head.remaining):'Stats unavailable')+'</div><div><b>Estimated '+escape(next?.stat||'next')+' gain:</b> '+(gainInfo?.estimate!=null?gainInfo.estimate.toFixed(2)+' (x'+gainInfo.multi.toFixed(3)+', '+gainInfo.dots+' dots)':escape(gainInfo?.reason||'Needs current happiness, stats and known gym'))+'</div><small>Gain is a Wiki-formula estimate. Unknown or ambiguous perk effects block precise gain claims. Special gym membership must be verified separately.</small></div>';
    const settings='<div class="sf-section">STRATEGY SETTINGS</div><div class="sf-settings"><label>Strategy <select id="slx-gym-mode">'+Object.keys(presets).map(n=>'<option '+(state.mode===n?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select></label><p>Custom weights are planning targets; exact StatForge formulas are not yet verified.</p>'+stats.map(n=>'<div class="sf-edit"><label>'+n+'</label><input type="number" data-value="'+n+'" value="'+(Number(actual[n])||0)+'"><input type="number" step=".05" min="0" data-weight="'+n+'" value="'+(Number(state.weights[n])||0)+'"></div>').join('')+'<button id="slx-gym-calc">Save values</button><div class="sf-section">API ACCESS</div><p>Uses your saved SakaLuX Hub API key automatically. You can save a separate Torn API key locally as fallback.</p><input id="slx-gym-private-key" type="password" autocomplete="off" placeholder="16-character Torn API key" maxlength="16"><button id="slx-gym-save-key">SAVE OWN KEY</button><button id="slx-gym-clear-key">CLEAR OWN KEY</button><div id="slx-gym-key-message" role="status">'+(hubApiKey()?'API key available':'No key found')+'</div></div>';
    const compact=n=>{const v=Number(n)||0;return v>=1e6?(v/1e6).toFixed(1)+'M':v>=1000?Math.round(v/1000)+'K':fmt(v)};
    const rows=snapshots.slice(-15).reverse();
    const history='<div class="sf-section">STAT HISTORY (LAST 15 SNAPSHOTS)</div><div class="sf-history"><div class="sf-hrow sf-hhead"><b>DATE</b>'+stats.map(n=>'<b style="color:'+statColors[n]+'">'+n.toUpperCase()+'</b>').join('')+'<b>TBS</b></div>'+rows.map((x,i)=>{
      const before=rows[i+1]?.values||{};
      const values=x.values||{},sum=stats.reduce((a,n)=>a+(Number(values[n])||0),0),old=stats.reduce((a,n)=>a+(Number(before[n])||0),0);
      return '<div class="sf-hrow"><b>'+escape(new Date(x.at).toLocaleDateString('en-US',{month:'short',day:'numeric'}))+'</b>'+stats.map(n=>'<div style="color:'+statColors[n]+'">'+compact(values[n])+(before[n]!=null&&Number(values[n])>Number(before[n])?'<small>+'+fmt(values[n]-before[n])+'</small>':'')+'</div>').join('')+'<div style="color:#70b9f1">'+compact(sum)+(old?'<small>+'+fmt(sum-old)+'</small>':'')+'</div></div>';
    }).join('')+(rows.length?'':'<p>No snapshots saved yet.</p>')+'</div><div class="sf-history-actions"><button id="slx-gym-history">SAVE SNAPSHOT</button><button id="slx-gym-clear">CLEAR HISTORY</button></div>';
    const summary='=== SakaLuX Gym Export ===\nDate: '+new Date().toLocaleString()+'\nRatio: '+state.mode+' | High: '+(state.highStat||'Dexterity')+'\nHealth: '+(complete?pct+'%':'unverified')+' | TBS: '+fmt(total)+'\n\nSTAT       CURRENT     TARGET      STATUS\n'+stats.map(n=>n.padEnd(11)+fmt(actual[n]).padEnd(12)+(targets[n]?fmt(targets[n]):'dump').padEnd(12)+(Number(state.weights[n])===0?'Minimize':(actual[n]>=targets[n]?'At target':'Below target'))).join('\n');
    const exporter='<div class="sf-section">EXPORT SNAPSHOT</div><div class="sf-export"><p>Copy a plain-text summary of your current ratio health and target stats.</p><button id="slx-gym-copy">COPY TO CLIPBOARD</button><pre>'+escape(summary)+'</pre><button id="slx-gym-export">EXPORT HISTORY CSV</button></div>';
    const about='<div class="sf-info"><div class="sf-section">WHY NOT JUST TRAIN ALL STATS EQUALLY?</div><p>Specialist gyms offer different training gains and ratio requirements. A ratio plan helps balance training priorities while preserving gym access.</p><div class="sf-section">GYM DOTS — WHY THEY MATTER</div><p>More gym dots generally mean greater gains per energy, but eligibility and training costs vary. Always verify unlocks in Torn.</p><div class="sf-three"><div>GEORGE’S GYM<strong>~7.3</strong></div><div>SPECIAL GYMS<strong>~7.5</strong></div><div>ELITE GYMS<strong>~8.0</strong></div></div><div class="sf-section">BALDR’S RATIO</div><p>Balanced specialist plan using multiple trained stats. Suitable when avoiding a very low dump stat.</p><div class="sf-section">HANK’S RATIO</div><p>A three-stat emphasis with one dump stat. The dump may reduce combat effectiveness, so choose carefully.</p><div class="sf-section">SAKALUX · DEXTERITY HIGH</div><p>DEX is primary, Speed secondary, Strength supporting, and Defense is the default dump. Exact unlock rules are not automatically verified.</p><div class="sf-section">STATS EXPLAINED</div><p><b>Strength:</b> damage when you hit.</p><p><b>Speed:</b> chance to hit an opponent.</p><p><b>Defense:</b> reduces damage from landed hits.</p><p><b>Dexterity:</b> improves dodging.</p></div>';
    body.innerHTML=header+(tab==='OVERVIEW'?info+train+headroom+perkPanel+statView:tab==='HISTORY'?history:tab==='EXPORT'?exporter:tab==='SETTINGS'?settings:about);
    body.querySelector('[data-reps]')?.addEventListener('click',e=>{
      const stat=e.currentTarget.dataset.reps;
      const reps=safeReps(stat);
      const ok=setNativeReps(stat,reps??999);
      const msg=body.querySelector('.sf-feedback');
      if(msg)msg.textContent=ok?'Set '+(reps??999)+' repetitions for '+stat+'. Verify energy and press TRAIN to confirm.':'Could not identify an editable '+stat+' repetition field. Nothing changed.';
    });
    body.querySelector('#slx-gym-switch')?.addEventListener('click',e=>{
      const name=e.currentTarget.dataset.gym;
      const verified=gymAvailability().get(name.toLowerCase());
      const msg=body.querySelector('.sf-feedback');
      if(!verified?.button){if(msg)msg.textContent='Gym unlock is no longer verified. No change made.';return}
      verified.button.click();
      if(msg)msg.textContent='Requested '+name+'. Confirm active gym before training.';
    });
    body.querySelector('#slx-gym-train')?.addEventListener('click',e=>{
      const stat=e.currentTarget.dataset.train,msg=body.querySelector('.sf-feedback');
      const currentBest=bestAvailable(stat),active=confirmedGym();
      if(currentBest&&!currentBest.active){if(msg)msg.textContent='Switch to '+currentBest.name+' first, then confirm the active gym.';return}
      if(!clickNativeTrain(stat)){if(msg)msg.textContent='Native TRAIN control unavailable. No training executed.';return}
      if(msg)msg.textContent='One native '+stat+' TRAIN action requested. Verify the Torn result.';
    });
    body.querySelector('#slx-gym-api-refresh')?.addEventListener('click',refreshGymApi);
    body.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{panel.dataset.tab=b.dataset.tab;render()});
    body.querySelector('#slx-gym-save-key')?.addEventListener('click',()=>{const val=body.querySelector('#slx-gym-private-key')?.value;const ok=savePersonalKey(val);const label=body.querySelector('#slx-gym-key-message');if(label)label.textContent=ok?'Personal API key saved locally':'Invalid key: expected 16 letters/numbers';if(ok)refreshGymApi()});
    body.querySelector('#slx-gym-clear-key')?.addEventListener('click',()=>{savePersonalKey('');const label=body.querySelector('#slx-gym-key-message');if(label)label.textContent='Personal key cleared; Hub shared key is still available if configured.'});
    body.querySelector('#slx-gym-mode')?.addEventListener('change',e=>{state.mode=e.target.value;stats.forEach((n,i)=>state.weights[n]=presets[state.mode][i]);save();render()});
    body.querySelector('#slx-gym-calc')?.addEventListener('click',()=>{
      body.querySelectorAll('[data-value]').forEach(el=>state.values[el.dataset.value]=Math.max(0,Number(el.value)||0));
      body.querySelectorAll('[data-weight]').forEach(el=>state.weights[el.dataset.weight]=Math.max(0,Number(el.value)||0));
      save();render();
    });
    body.querySelector('#slx-gym-history')?.addEventListener('click',()=>{state.history.push({at:new Date().toISOString(),values:{...actual}});state.history=state.history.slice(-180);save();render()});
    body.querySelector('#slx-gym-clear')?.addEventListener('click',()=>{if(confirm('Clear local gym snapshots?')){state.history=[];save();render()}});
    body.querySelector('#slx-gym-copy')?.addEventListener('click',()=>{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(summary).catch(()=>{});else{const el=document.createElement('textarea');el.value=summary;document.body.appendChild(el);el.select();document.execCommand('copy');el.remove()}});
    body.querySelector('#slx-gym-export')?.addEventListener('click',()=>{
      const rows=[['date',...stats].join(','),...state.history.map(x=>[x.at,...stats.map(n=>Number(x.values[n])||0)].join(','))];
      const a=document.createElement('a'),u=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));
      a.href=u;a.download='sakalux-gym-history.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
    });
  }
  const open=()=>{render();mount();};
  const close=()=>{panel.hidden=true};
  toggle.onclick=open;panel.querySelector('[data-settings]').onclick=()=>{panel.classList.toggle('expanded');panel.querySelector('[data-settings]').textContent=panel.classList.contains('expanded')?'Close settings ▴':'Settings ▾'};
  window.SakaLuXGymOptimizer={open,close,refresh:render,version:'1.5.3',getState:()=>({...state})};
  // Insert ONLY as a normal-flow sibling of Torn's actual training tile group.
  // Previous gym-root insertion overlapped the stat/HUD section on TornPDA.
  function trainingAnchor(){
    const trainButtons=[...document.querySelectorAll('button,input[type="button"],[role="button"]')]
      .filter(el=>!panel.contains(el) && /^(train)$/i.test((el.innerText||el.value||'').trim()));
    for(const btn of trainButtons){
      let node=btn.parentElement;
      for(let depth=0;node&&depth<8;depth++,node=node.parentElement){
        if(node===document.body || node===document.documentElement)break;
        if(node.contains(panel))break;
        const text=(node.innerText||'').slice(0,5000);
        const count=[...node.querySelectorAll('button,input[type="button"],[role="button"]')]
          .filter(b=>/^(train)$/i.test((b.innerText||b.value||'').trim())).length;
        if(count>=3 && count<=5 && /strength/i.test(text) && /dexterity/i.test(text) && node.parentElement){
          // Never mount inside a floating, fixed, or absolute wrapper.
          const parent=node.parentElement;
          if(parent===document.body||parent===document.documentElement) return null;
          return node;
        }
      }
    }
    return null;
  }
  function mount(){
    if(!onGym()||!state.enabled){panel.hidden=true;return}
    const anchor=trainingAnchor();
    if(!anchor){panel.hidden=true;return}
    if(panel.parentElement!==anchor.parentElement || panel.nextElementSibling!==anchor){
      anchor.parentElement.insertBefore(panel,anchor);
    }
    panel.hidden=false;
  }
  registerGym();
  try {
    render();mount();
    document.documentElement?.setAttribute('data-sakalux-gym-boot','ready');
    document.getElementById('sakalux-module-bridge-gym-optimizer')?.setAttribute('data-stage','ready');
  } catch(error) {
    document.documentElement?.setAttribute('data-sakalux-gym-boot','error');
    document.getElementById('sakalux-module-bridge-gym-optimizer')?.setAttribute('data-stage','error');
    console.error('[SakaLuX Gym] Initial render failed:',error);
  }
  // TornPDA navigates without full reload. Move the inline widget when Gym's React root is replaced.
  let lastUrl=location.href;
  setInterval(()=>{if(location.href!==lastUrl){lastUrl=location.href;render()}registerGym();mount()},1100);
})();