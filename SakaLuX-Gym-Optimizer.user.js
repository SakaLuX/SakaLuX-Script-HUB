// ==UserScript==
// @name         SakaLuX Gym Optimizer
// @namespace    https://sakalux.ro/
// @version      1.0.0
// @description  Safe Gym stat planner with confirmed-only gym suggestions. TornPDA/Tampermonkey.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @homepageURL  https://github.com/SakaLuX/SakaLuX-Script-HUB
// ==/UserScript==
(() => {
  'use strict';
  if (window.SakaLuXGymOptimizer) return;
  const KEY='slx_gym_optimizer_v1';
  const stats=['Strength','Speed','Defense','Dexterity'];
  const defaults={mode:'Balanced',weights:{Strength:1,Speed:1,Defense:1,Dexterity:1},values:{Strength:0,Speed:0,Defense:0,Dexterity:0},history:[],enabled:true};
  const presets={
    Balanced:[1,1,1,1],
    '3-stat (Defense dump)':[1,1,0,1],
    '3-stat (Dexterity dump)':[1,1,1,0],
    '2-stat (Str/Dex)':[1,0,0,1],
    '2-stat (Speed/Dex)':[0,1,0,1],
    // Strategy labels are adjustable starting templates, NOT purported StatForge equations.
    Baldr:[0.8,1,0,1],
    Hank:[1,1,1,0],
    Aec3:[1,1,1,1],
    Custom:[1,1,1,1]
  };
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
  const state={...defaults,...saved,values:{...defaults.values,...saved.values},weights:{...defaults.weights,...saved.weights}};
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const onGym=()=>/gym\.php/i.test(location.href)||/\bGym\b/i.test(document.title)&&/torn/i.test(location.host);
  const fmt=n=>Math.round(Number(n)||0).toLocaleString('en-US');
  const css=document.createElement('style');
  css.textContent='#slx-gym-toggle{position:fixed;right:10px;bottom:80px;z-index:2147483000;padding:9px 13px;background:#164d62;color:white;border:1px solid #59b9d5;border-radius:13px;font-weight:800}#slx-gym-panel{position:fixed;z-index:2147483001;inset:8% 7px 49px;background:#131923;color:#e8edf4;border:1px solid #52667a;border-radius:14px;display:flex;flex-direction:column;font:14px Arial,sans-serif;box-sizing:border-box;overflow:hidden}#slx-gym-panel[hidden],#slx-gym-toggle[hidden]{display:none!important}#slx-gym-panel .head{display:flex;justify-content:space-between;padding:14px;background:#212c3b;font-weight:800}#slx-gym-panel .body{padding:12px;overflow:auto;flex:1}#slx-gym-panel input,#slx-gym-panel select{background:#0c1017;color:white;border:1px solid #52667a;border-radius:7px;padding:7px;max-width:100%;box-sizing:border-box}#slx-gym-panel button{background:#24566a;color:white;border:1px solid #557a8d;border-radius:8px;padding:8px;cursor:pointer}#slx-gym-panel .stat{display:grid;grid-template-columns:1fr 112px 64px;gap:6px;margin:7px 0;align-items:center}#slx-gym-panel .hint{font-size:12px;color:#aebdca;line-height:1.5}#slx-gym-panel .notice{padding:10px;background:#243544;border-radius:10px;margin:12px 0}';
  (document.head||document.documentElement).append(css);
  const toggle=document.createElement('button');toggle.id='slx-gym-toggle';toggle.textContent='GYM ⚡';
  const panel=document.createElement('section');panel.id='slx-gym-panel';panel.hidden=true;
  panel.innerHTML='<div class="head"><span>SakaLuX Gym Optimizer · v1.0.0</span><button data-close>✕</button></div><div class="body"></div>';
  (document.body||document.documentElement).append(toggle,panel);
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
  function render(){
    const recommendation=target();
    const gym=confirmedGym();
    body.innerHTML='<label>Strategy <select id="slx-gym-mode">'+Object.keys(presets).map(n=>'<option '+(state.mode===n?'selected':'')+'>'+escape(n)+'</option>').join('')+'</select></label>'+
      '<div class="hint">Preset ratios are editable starter weights, not exact StatForge formulas. Enter your current values; they are saved only on this device.</div>'+
      stats.map(s=>'<div class="stat"><label>'+s+'</label><input type="number" min="0" step="1" data-value="'+s+'" value="'+(Number(state.values[s])||0)+'"><input aria-label="'+s+' weight" type="number" min="0" max="100" step=".1" data-weight="'+s+'" value="'+(Number(state.weights[s])||0)+'"></div>').join('')+
      '<button id="slx-gym-calc">Calculate & save</button>'+
      '<div class="notice"><b>TRAIN NEXT:</b> '+(recommendation?escape(recommendation.stat)+' (gap '+fmt(recommendation.gap)+')':'Select at least one weighted stat')+
      '<div class="hint">Relative catch-up recommendation; does not predict gym gains or special gym caps.</div></div>'+
      '<div class="notice"><b>GYM:</b> '+(gym?'Current gym detected: '+escape(gym):'Availability unverified')+
      '<div class="hint">No switch button is offered without a confirmed unlocked gym. Pick a gym manually in Torn. Locked Deep Burn is never recommended for switching.</div></div>'+
      '<div class="hint">Local snapshots: '+state.history.length+'. The script makes no API calls and never clicks Torn training actions automatically.</div>'+
      '<button id="slx-gym-history">Save progress snapshot</button> <button id="slx-gym-clear">Clear snapshots</button>';
    body.querySelector('#slx-gym-mode').onchange=e=>{
      state.mode=e.target.value;
      stats.forEach((s,i)=>state.weights[s]=presets[state.mode][i]);
      save();render();
    };
    body.querySelector('#slx-gym-calc').onclick=()=>{
      body.querySelectorAll('[data-value]').forEach(el=>state.values[el.dataset.value]=Math.max(0,Number(el.value)||0));
      body.querySelectorAll('[data-weight]').forEach(el=>state.weights[el.dataset.weight]=Math.max(0,Number(el.value)||0));
      save();render();
    };
    body.querySelector('#slx-gym-history').onclick=()=>{
      state.history.push({at:new Date().toISOString(),values:{...state.values}});
      state.history=state.history.slice(-180);save();render();
    };
    body.querySelector('#slx-gym-clear').onclick=()=>{if(confirm('Delete saved Gym snapshots?')){state.history=[];save();render()}};
  }
  const open=()=>{render();panel.hidden=false};
  const close=()=>{panel.hidden=true};
  toggle.onclick=open;panel.querySelector('[data-close]').onclick=close;
  window.SakaLuXGymOptimizer={open,close,refresh:render,version:'1.0.0',getState:()=>({...state})};
  function show(){toggle.hidden=!onGym()||!state.enabled;if(toggle.hidden)close()}
  show();setInterval(show,2000);
})();