// ==UserScript==
// @name         SakaLuX Gym Optimizer
// @namespace    https://sakalux.ro/
// @version      1.5.3
// @description  Temporary isolated execution probe; no training actions.
// @match        https://www.torn.com/*
// @grant        none
// ==/UserScript==
(() => {
  'use strict';
  const version='1.5.3', id='gym-optimizer';
  const boot=()=>{
    const root=document.documentElement;
    if(!root)return;
    root.setAttribute('data-sakalux-installed-'+id,version);
    root.setAttribute('data-sakalux-gym-boot','probe-ready');
    window.__SakaLuXInstalledVersions=window.__SakaLuXInstalledVersions||{};
    window.__SakaLuXInstalledVersions[id]=version;
    window.SakaLuXGymOptimizer={version,open:()=>{},refresh:()=>{},health:()=>({version,status:'probe'})};
    let marker=document.getElementById('sakalux-module-bridge-'+id);
    if(!marker){marker=document.createElement('span');marker.id='sakalux-module-bridge-'+id;marker.hidden=true;root.appendChild(marker)}
    marker.dataset.version=version;marker.dataset.stage='probe-ready';
    if(!document.getElementById('slx-gym-probe')){
      const note=document.createElement('div');note.id='slx-gym-probe';
      note.textContent='SAKALUX GYM PROBE: script executed (no training functions)';
      note.style.cssText='position:fixed;top:58px;left:8px;right:8px;z-index:2147483645;background:#173a46;color:white;border:2px solid #7fdfff;border-radius:6px;padding:10px;font:13px Arial';
      (document.body||root).appendChild(note);
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
