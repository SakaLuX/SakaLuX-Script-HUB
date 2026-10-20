// ==UserScript==
// @name         SakaLuX Gym Diagnostic
// @namespace    https://sakalux.ro/diagnostic
// @version      0.1.0
// @description  Temporary read-only TornPDA Gym startup diagnostic. Does not alter or train.
// @match        https://www.torn.com/*
// @grant        none
// ==/UserScript==
(() => {
  'use strict';
  if (document.getElementById('slx-gym-diagnostic')) return;
  const started = Date.now(), errors = [];
  const display = () => {
    let panel = document.getElementById('slx-gym-diagnostic');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'slx-gym-diagnostic';
      panel.style.cssText = 'position:fixed!important;left:8px!important;right:8px!important;top:65px!important;z-index:2147483646!important;background:#171c26!important;color:#fff!important;border:2px solid #69bdf4!important;padding:10px!important;border-radius:8px!important;font:12px/1.4 Arial,sans-serif!important;max-height:55vh!important;overflow:auto!important;box-sizing:border-box!important';
      (document.body || document.documentElement).appendChild(panel);
    }
    const root = document.documentElement;
    const stage = root.getAttribute('data-sakalux-gym-boot') || 'not detected';
    const bridge = document.getElementById('sakalux-module-bridge-gym-optimizer');
    const gymPanel = document.getElementById('slx-gym-panel');
    const gym = typeof window.SakaLuXGymOptimizer === 'object' && !!window.SakaLuXGymOptimizer;
    const shared = !!window.SakaLuXCore;
    const hub = !!window.SakaLuXScriptHub;
    const isGym = /gym\.php/i.test(location.href);
    const lines = [
      'Diagnostic loaded: YES',
      'Gym page: ' + (isGym ? 'YES' : 'NO'),
      'Gym script boot: ' + stage,
      'Gym bridge: ' + (bridge?.dataset?.version || 'MISSING'),
      'Gym API global: ' + (gym ? 'YES' : 'NO'),
      'Shared Core: ' + (shared ? 'YES' : 'NO'),
      'Hub global: ' + (hub ? 'YES' : 'NO'),
      'Gym panel: ' + (gymPanel ? (gymPanel.hidden ? 'HIDDEN' : 'VISIBLE') : 'MISSING'),
      'Elapsed: ' + Math.floor((Date.now()-started)/1000) + ' sec',
      'Captured errors: ' + (errors.length ? errors.slice(-3).join(' | ') : 'none (before/other contexts not observable)')
    ];
    panel.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = 'SAKALUX GYM DIAGNOSTIC 0.1.0';
    panel.appendChild(heading);
    const pre = document.createElement('pre');
    pre.style.cssText = 'white-space:pre-wrap;margin:7px 0;font:12px/1.5 monospace;';
    pre.textContent = lines.join('\n');
    panel.appendChild(pre);
    const btn = document.createElement('button');
    btn.textContent = 'COPY REPORT';
    btn.style.cssText = 'padding:8px;background:#28567d;color:#fff;border:1px solid #8ed0fc;border-radius:4px;';
    btn.onclick = async () => {
      const report = lines.join('\n');
      try { await navigator.clipboard.writeText(report); btn.textContent='COPIED'; }
      catch { prompt('Copy this report:', report); }
    };
    panel.appendChild(btn);
    const hide = document.createElement('button');
    hide.textContent = 'HIDE';
    hide.style.cssText = 'margin-left:8px;padding:8px;';
    hide.onclick = () => {panel.style.display='none';};
    panel.appendChild(hide);
  };
  addEventListener('error', e => {
    const message = String(e.message || 'unknown').slice(0,120);
    if (/sakalux|gym/i.test(String(e.filename||'')+' '+message)) {
      errors.push(message);
      display();
    }
  }, true);
  addEventListener('unhandledrejection', e => {
    const message = String(e.reason?.message || e.reason || 'unknown').slice(0,120);
    if (/sakalux|gym/i.test(message)) {errors.push(message); display();}
  }, true);
  const tick = () => {
    const p=document.getElementById('slx-gym-diagnostic');
    if (p && p.style.display==='none') return;
    display();
  };
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', tick, {once:true});
  else tick();
  setInterval(tick, 2500);
})();
