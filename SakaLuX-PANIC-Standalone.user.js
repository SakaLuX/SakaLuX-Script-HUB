// ==UserScript==
// @name         SakaLuX PANIC Standalone
// @namespace    https://sakalux.ro/
// @version      0.1.1
// @description  Independent one-tap PANIC Torn stock buy. This feature carries Torn scripting compliance risk.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';
  if (window.__SakaLuXPanicStandalone) return;
  window.__SakaLuXPanicStandalone = true;
  const VERSION = '0.1.1';
  const STORE = {
    key: 'SLX_PANIC_STANDALONE_API_KEY',
    target: 'SLX_STOCK_TARGET',
    fallback: 'SLX_STOCK_PANIC_FALLBACK',
    reserve: 'SLX_STOCK_PANIC_KEEP_CASH',
    max: 'SLX_STOCK_PANIC_MAX_SPEND',
    all: 'SLX_STOCK_PANIC_USE_ALL',
    dry: 'SLX_STOCK_DRY_RUN',
    enabled: 'SLX_PANIC_STANDALONE_ENABLED'
  };
  const get = (k, fallback='') => localStorage.getItem(k) ?? fallback;
  const money = n => '$' + Math.floor(Number(n)||0).toLocaleString('en-US');
  const parseAmount = v => {
    const m=String(v||'0').trim().replace(/,/g,'').match(/^(\d+(?:\.\d+)?)\s*([kmb])?$/i);
    return m ? Number(m[1])*({k:1e3,m:1e6,b:1e9}[m[2]?.toLowerCase()]||1) : NaN;
  };
  const key = () => get(STORE.key).trim() || get('SLX_STOCK_API_KEY').trim() || get('SakaLuX_HUB_TORN_API_KEY').trim();
  const enabled = () => get(STORE.enabled,'1') !== '0';
  let busy=false, lastTradeAt=0, toastTimer=0;
  const style=document.createElement('style');
  style.textContent=`
  #slx-panic-standalone-button {position:fixed!important;right:14px!important;bottom:calc(88px + env(safe-area-inset-bottom,0px))!important;z-index:2147483646!important;min-width:92px!important;min-height:46px!important;padding:12px 17px!important;border:1px solid #fa6976!important;border-radius:13px!important;background:linear-gradient(180deg,#a62437,#651522)!important;color:white!important;box-shadow:0 5px 24px #000a!important;font:900 13px Arial,sans-serif!important;letter-spacing:.7px!important;cursor:pointer!important;}
  #slx-panic-standalone-button:disabled {opacity:.6!important}
  #slx-panic-standalone-status {position:fixed!important;bottom:calc(144px + env(safe-area-inset-bottom,0px))!important;right:12px!important;z-index:2147483647!important;max-width:min(330px,calc(100vw - 24px))!important;background:#101a29!important;border:1px solid #6385a9!important;border-radius:10px!important;padding:10px!important;color:white!important;font:12px/1.5 Arial,sans-serif!important;box-shadow:0 4px 24px #000b!important;white-space:pre-line!important}
  #slx-panic-standalone-settings {position:fixed!important;right:12px!important;bottom:calc(148px + env(safe-area-inset-bottom,0px))!important;z-index:2147483647!important;width:min(340px,calc(100vw - 24px))!important;max-height:70vh!important;overflow:auto!important;background:#111b2a!important;border:1px solid #61768f!important;border-radius:12px!important;padding:14px!important;color:#eef4ff!important;font:13px Arial,sans-serif!important;box-shadow:0 4px 26px #000c!important}
  #slx-panic-standalone-settings label {display:grid!important;gap:4px!important;margin:8px 0!important}
  #slx-panic-standalone-settings input:not([type=checkbox]) {box-sizing:border-box!important;width:100%!important;border:1px solid #516078!important;border-radius:7px!important;background:#0a111e!important;color:white!important;padding:9px!important}
  #slx-panic-standalone-settings button {border:1px solid #59799d!important;border-radius:8px!important;background:#23476b!important;color:#fff!important;padding:9px!important;cursor:pointer!important}
  #slx-panic-standalone-settings .slx-row {display:flex!important;gap:8px!important;align-items:center!important;margin:8px 0!important}
  #slx-panic-standalone-settings .slx-row label {margin:0!important}
  #slx-panic-standalone-settings small {color:#bdcddd!important}
  @media(min-width:900px){#slx-panic-standalone-button{bottom:20px!important}#slx-panic-standalone-status,#slx-panic-standalone-settings{bottom:78px!important}}
  `;
  (document.head||document.documentElement).appendChild(style);
  function status(msg, error=false) {
    let box=document.getElementById('slx-panic-standalone-status');
    if (!box) { box=document.createElement('div');box.id='slx-panic-standalone-status';box.setAttribute('role','status');document.body.appendChild(box); }
    box.textContent=String(msg);
    box.style.borderColor=error?'#e46d7b':'#6385a9';
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>box.remove(),12000);
  }
  function apiJson(url) {
    return new Promise((resolve,reject)=>{
      GM_xmlhttpRequest({
        method:'GET',url,timeout:16000,
        onload:r=>{
          try {const data=JSON.parse(r.responseText);if(r.status!==200)throw Error('API HTTP '+r.status);if(data?.error)throw Error(data.error.error||data.error.message||'API error');resolve(data);}
          catch(e){reject(e);}
        },
        onerror:()=>reject(Error('Torn API connection failed')),
        ontimeout:()=>reject(Error('Torn API timed out'))
      });
    });
  }
  async function prepare() {
    const apiKey=key();
    if(!apiKey) throw Error('Configure a Torn API key using PANIC settings.');
    const target=get(STORE.target,'GRN').trim().toUpperCase();
    const fallback=get(STORE.fallback).trim().toUpperCase();
    if(!/^[A-Z]{2,5}$/.test(target)) throw Error('Set a valid primary stock symbol.');
    const [user, catalog]=await Promise.all([
      apiJson('https://api.torn.com/v2/user/money?key='+encodeURIComponent(apiKey)),
      apiJson('https://api.torn.com/v2/torn/stocks?key='+encodeURIComponent(apiKey))
    ]);
    const cash=Number(user?.money?.wallet ?? user?.money?.onhand ?? user?.money?.cash ?? user?.money_onhand ?? user?.cash);
    if(!Number.isFinite(cash)||cash<=0) throw Error('No positive cash balance returned by Torn API.');
    const all=get(STORE.all,'0')==='1';
    const reserve=all?0:parseAmount(get(STORE.reserve,'0'));
    const maxSpend=all?0:parseAmount(get(STORE.max,'0'));
    if(!Number.isFinite(reserve)||reserve<0||!Number.isFinite(maxSpend)||maxSpend<0) throw Error('Invalid reserve or maximum spend.');
    const allowed=Math.max(0,Math.min(cash-reserve,maxSpend>0?maxSpend:cash));
    if(allowed<=0) throw Error('No cash available after reserve/limit.');
    const raw=catalog?.stocks;
    if(!raw||typeof raw!=='object') throw Error('Stock catalogue is unavailable.');
    const list=Array.isArray(raw)?raw:Object.entries(raw).map(([id,v])=>({...v,id:v?.id??id}));
    const picks=[target,fallback].filter((x,i,a)=>x&&a.indexOf(x)===i);
    for(const sym of picks) {
      const found=list.find(v=>String(v?.acronym||v?.symbol||'').toUpperCase()===sym);
      const stockId=String(found?.id??found?.stock_id??'');
      const price=Number(found?.market?.price??found?.current_price??found?.price);
      if(!stockId||!Number.isFinite(price)||price<=0)continue;
      const shares=Math.floor(allowed/price);
      if(shares>0)return {sym,stockId,price,shares,cash,estimate:shares*price,remaining:cash-shares*price};
    }
    throw Error('No affordable stock found for primary/fallback targets.');
  }
  async function buy() {
    if(busy)return;
    if(Date.now()-lastTradeAt<2000){status('Please wait before pressing PANIC again.',true);return;}
    busy=true;
    const button=document.getElementById('slx-panic-standalone-button');
    if(button)button.disabled=true;
    try {
      status('PANIC: checking Torn balance and stock price…');
      const x=await prepare();
      if(get(STORE.dry,'0')==='1') {
        status('DRY RUN · '+x.shares.toLocaleString()+' '+x.sym+' · '+money(x.estimate)+' · no transaction sent.');
        return;
      }
      const rfc=(document.cookie.match(/(?:^|;\s*)rfc_v=([^;]+)/)||[])[1];
      if(!rfc)throw Error('Missing Torn session token; reload Torn and try again.');
      lastTradeAt=Date.now();
      status('PANIC: buying '+x.shares.toLocaleString()+' '+x.sym+' for about '+money(x.estimate)+'…');
      const response=await fetch('https://www.torn.com/page.php?sid=StockMarket&step=buyShares&rfcv='+encodeURIComponent(rfc),{
        method:'POST',credentials:'include',cache:'no-store',
        headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},
        body:new URLSearchParams({stockId:x.stockId,amount:String(x.shares)})
      });
      const raw=await response.text();
      let data;try{data=JSON.parse(raw)}catch{throw Error('Torn returned an invalid transaction response.');}
      if(!response.ok||data?.success!==true)throw Error(String(data?.text||data?.message||data?.error?.error||'Torn did not confirm this purchase.'));
      status('PANIC completed · '+x.shares.toLocaleString()+' '+x.sym+' · approximately '+money(x.estimate)+'.');
    } catch(e) { status('PANIC failed: '+String(e?.message||e),true); }
    finally {busy=false;if(button)button.disabled=false;}
  }
  function settings() {
    document.getElementById('slx-panic-standalone-settings')?.remove();
    const box=document.createElement('section');
    box.id='slx-panic-standalone-settings';
    const top=document.createElement('div');
    top.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:10px';
    const title=document.createElement('b');title.textContent='SakaLuX PANIC · v'+VERSION;
    const close=document.createElement('button');close.textContent='×';close.onclick=()=>box.remove();
    top.append(title,close);box.append(top);
    const fields=[
      ['API key (leave blank to reuse existing key)',STORE.key,'password'],
      ['Primary stock',STORE.target,'text','GRN'],
      ['Fallback stock',STORE.fallback,'text',''],
      ['Keep cash',STORE.reserve,'text','0'],
      ['Maximum spend (0 = no limit)',STORE.max,'text','0']
    ];
    const controls={};
    for(const [label,k,type,def] of fields){
      const row=document.createElement('label');row.textContent=label;
      const input=document.createElement('input');input.type=type;input.value=get(k,def||'');
      if(k===STORE.key){input.placeholder=key()?'Key available (stored locally)':'Paste Torn API key';}
      row.appendChild(input);box.appendChild(row);controls[k]=input;
    }
    for(const [label,k] of [['Use all available cash',STORE.all],['Dry Run (no real purchase)',STORE.dry]]){
      const row=document.createElement('label');row.className='slx-row';
      const check=document.createElement('input');check.type='checkbox';check.checked=get(k,'0')==='1';row.append(check,document.createTextNode(label));box.appendChild(row);controls[k]=check;
    }
    const note=document.createElement('small');note.textContent='Risk notice: automated off-page stock transactions may violate Torn scripting rules. The key is stored locally; optional existing SakaLuX keys are reused locally. The script requests money/stocks data from Torn API.';
    box.appendChild(note);
    const actions=document.createElement('div');actions.className='slx-row';
    const save=document.createElement('button');save.textContent='SAVE SETTINGS';
    save.onclick=()=>{
      for(const [k,el] of Object.entries(controls)){
        const v=el.type==='checkbox'?(el.checked?'1':'0'):el.value.trim();
        if(k===STORE.key && !v)continue;
        localStorage.setItem(k,[STORE.target,STORE.fallback].includes(k)?v.toUpperCase():v);
      }
      box.remove();status('PANIC settings saved locally.');
    };
    const test=document.createElement('button');test.textContent='TEST API';
    test.onclick=async()=>{try{test.disabled=true;const p=await prepare();status('API OK · '+p.sym+' · '+p.shares.toLocaleString()+' shares · '+money(p.estimate));}catch(e){status(String(e.message||e),true)}finally{test.disabled=false;}};
    actions.append(save,test);box.appendChild(actions);
    document.body.appendChild(box);
  }
  function init() {
    if(!document.body)return;
    if(document.getElementById('slx-panic-standalone-button'))return;
    const button=document.createElement('button');
    button.type='button';button.id='slx-panic-standalone-button';button.textContent='PANIC';
    button.title='Tap: immediate PANIC buy · long press / right click: settings';
    let hold=0,suppress=false;
    button.addEventListener('pointerdown',()=>{suppress=false;hold=setTimeout(()=>{suppress=true;settings();},650)});
    for(const event of ['pointerup','pointercancel','pointerleave'])button.addEventListener(event,()=>clearTimeout(hold));
    button.addEventListener('contextmenu',e=>{e.preventDefault();suppress=true;settings();});
    button.addEventListener('click',()=>{if(suppress){suppress=false;return;}void buy();});
    document.body.appendChild(button);
    if(!key()||!get(STORE.target))setTimeout(()=>{if(!document.getElementById('slx-panic-standalone-settings'))settings();},300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
