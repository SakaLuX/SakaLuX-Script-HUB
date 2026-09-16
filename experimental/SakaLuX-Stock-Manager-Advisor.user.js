// ==UserScript==
// @name         SakaLuX Stock Manager & Advisor [EXPERIMENTAL]
// @namespace    sakalux.stock.manager.advisor
// @version      0.4.2
// @description  Experimental Torn stock vault manager with Panic v2, hardened trades, ROI advisor, benefit valuation and Trade Assistant.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  const APP = {
    name: 'SakaLuX Stock Manager & Advisor',
    version: '0.4.2',
    experimental: true,
    profile: 'https://www.torn.com/profiles.php?XID=2380374',
    stocksUrl: 'https://www.torn.com/page.php?sid=stocks'
  };

  const REQUIRED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Stock%20Manager%20Advisor&user=money,stocks&torn=stocks';

  const K = {
    api: 'SLX_STOCK_API_KEY',
    target: 'SLX_STOCK_TARGET',
    keep: 'SLX_STOCK_KEEP_CASH',
    withdraw: 'SLX_STOCK_WITHDRAW',
    benefitLock: 'SLX_STOCK_BENEFIT_LOCK',
    panicPending: 'SLX_STOCK_PANIC_PENDING',
    panicConfirm: 'SLX_STOCK_PANIC_CONFIRM',
    panicDirect: 'SLX_STOCK_PANIC_DIRECT',
    presets: 'SLX_STOCK_PRESETS',
    tx: 'SLX_STOCK_TX_CACHE',
    benefitValues: 'SLX_STOCK_BENEFIT_VALUES',
    dryRun: 'SLX_STOCK_DRY_RUN',
    actionLog: 'SLX_STOCK_ACTION_LOG',
    panicFallback: 'SLX_STOCK_PANIC_FALLBACK',
    panicKeep: 'SLX_STOCK_PANIC_KEEP_CASH',
    panicMax: 'SLX_STOCK_PANIC_MAX_SPEND',
    panicUseAll: 'SLX_STOCK_PANIC_USE_ALL'
  };

  const BENEFITS = {
    ASS:{base:1000000,type:'A'}, BAG:{base:3000000,type:'A'}, CNC:{base:7500000,type:'A'}, EWM:{base:1000000,type:'A'},
    ELT:{base:5000000,type:'P'}, EVL:{base:100000,type:'A'}, FHG:{base:2000000,type:'A'}, GRN:{base:500000,type:'A'},
    CBD:{base:350000,type:'A'}, HRG:{base:10000000,type:'A'}, IIL:{base:1000000,type:'P'}, IOU:{base:3000000,type:'A'},
    IST:{base:100000,type:'P'}, LAG:{base:750000,type:'A'}, LOS:{base:7500000,type:'P'}, LSC:{base:500000,type:'A'},
    MCS:{base:350000,type:'A'}, MSG:{base:300000,type:'P'}, MUN:{base:5000000,type:'A'}, PRN:{base:1000000,type:'A'},
    PTS:{base:10000000,type:'A'}, SYM:{base:500000,type:'A'}, SYS:{base:3000000,type:'P'}, TCP:{base:1000000,type:'P'},
    TMI:{base:6000000,type:'A'}, TGP:{base:2500000,type:'P'}, TCT:{base:100000,type:'A'}, TSB:{base:3000000,type:'A'},
    TCC:{base:7500000,type:'A'}, THS:{base:150000,type:'A'}, TCI:{base:1500000,type:'P'}, TCM:{base:1000000,type:'P'},
    WSU:{base:1000000,type:'P'}, WLT:{base:9000000,type:'P'}, YAZ:{base:1000000,type:'P'}
  };

  const BENEFIT_MODELS = {
    MUN:{type:'item',id:818,freq:7,label:'Six-Pack of Energy Drink'},
    ASS:{type:'item',id:817,freq:7,label:'Six-Pack of Alcohol'},
    HRG:{type:'manual',freq:31,label:'Average property value'},
    LSC:{type:'item',id:369,freq:7,label:'Lottery Voucher'},
    LAG:{type:'item',id:368,freq:14,label:'Lawyer Business Card'},
    FHG:{type:'item',id:367,freq:7.75,label:'Feathery Hotel Coupon'},
    PRN:{type:'item',id:366,freq:7,label:'Erotic DVD'},
    SYM:{type:'item',id:370,freq:7,label:'Drug Pack'},
    TCC:{type:'average',ids:[1057,1112,1113,1114,1115,1116,1117],freq:31,label:'Average clothing cache'},
    THS:{type:'item',id:365,freq:7,label:'Box of Medical Supplies'},
    EWM:{type:'item',id:364,freq:7,label:'Box of Grenades'},
    CNC:{type:'cash',value:80000000,freq:31,label:'Cash-equivalent benefit'},
    TSB:{type:'cash',value:50000000,freq:31,label:'Cash dividend'},
    TMI:{type:'cash',value:25000000,freq:31,label:'Cash dividend'},
    IOU:{type:'cash',value:12000000,freq:31,label:'Cash dividend'},
    GRN:{type:'cash',value:4000000,freq:31,label:'Cash dividend'},
    TCT:{type:'cash',value:1000000,freq:31,label:'Cash-equivalent benefit'}
  };

  const S = { stocks:new Map(), portfolio:{}, money:null, panel:null, status:null, benefitPrices:{}, tradeBusy:false, lastTradeAt:0 };

  const $ = (q, r=document) => r.querySelector(q);
  const $$ = (q, r=document) => [...r.querySelectorAll(q)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => Number(String(v ?? '').replace(/[$,\s]/g,'')) || 0;
  const money = v => '$' + Math.max(0, Number(v)||0).toLocaleString('en-US', {maximumFractionDigits:0});
  const get = (k, d='') => { try { const v=localStorage.getItem(k); return v===null?d:v; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
  const del = k => { try { localStorage.removeItem(k); } catch {} };
  const bool = (k, d=false) => get(k, d?'1':'0') === '1';
  const isStocks = () => /(?:page\.php\?sid=stocks|sid=StockMarket|sid=stocks)/i.test(location.href);
  const rfc = () => (document.cookie.match(/(?:^|;\s*)rfc_v=([^;]+)/)||[])[1] || '';

  function parseAmount(v) {
    const s=String(v||'').trim().toLowerCase().replace(/,/g,'');
    if(!s) return 0;
    const m=s.match(/^(-?\d+(?:\.\d+)?)\s*([kmb])?$/);
    if(!m) return Number(s)||0;
    const mul={k:1e3,m:1e6,b:1e9}[m[2]]||1;
    return Number(m[1])*mul;
  }

  function status(msg, kind='info') {
    if (!S.status) return;
    S.status.textContent=msg;
    S.status.dataset.kind=kind;
  }

  function currentMoneyFromDom() {
    const el=$('#user-money');
    if(!el) return 0;
    const raw=el.getAttribute('data-money');
    return raw ? num(raw) : parseAmount(el.textContent);
  }

  async function apiSync() {
    const key=get(K.api).trim();
    if(!key) throw new Error('Add an API key first.');
    const url=`https://api.torn.com/user/?selections=money,stocks&key=${encodeURIComponent(key)}&ts=${Date.now()}`;
    const res=await fetch(url, {credentials:'omit'});
    const data=await res.json();
    if(data?.error) throw new Error(data.error.error || 'Torn API error');
    if(Number.isFinite(Number(data.money_onhand))) S.money=Number(data.money_onhand);
    if(data.stocks && typeof data.stocks==='object') S.portfolio=data.stocks;
    set(K.tx, JSON.stringify(S.portfolio||{}));
    return data;
  }

  function setApiBadge(text, kind='idle') {
    const el=$('#slx-stock-api-badge');
    if(!el) return;
    el.textContent=text;
    el.dataset.kind=kind;
  }

  function saveApiKeyFromPanel() {
    const input=$('#slx-stock-api');
    const key=String(input?.value||'').trim();
    if(!key) throw new Error('Paste the Torn API key first.');
    set(K.api,key);
    setApiBadge('Saved','ok');
    status('API key saved locally.','ok');
    return key;
  }

  function clearApiKey() {
    del(K.api);
    const input=$('#slx-stock-api');
    if(input) input.value='';
    S.money=null;
    S.portfolio={};
    setApiBadge('Not configured','idle');
    renderPortfolio();
    renderAdvisor();
    status('API key cleared from local storage.','ok');
  }

  async function syncAllApi() {
    setApiBadge('Testing…','warn');
    const user=await apiSync();
    await syncStockCatalog();
    setApiBadge('Connected','ok');
    refreshTargetSelect();
    renderPortfolio();
    renderBenefitValues();
    renderAdvisor();
    renderTradeAssistant();
    status(`API connected · cash ${money(S.money||0)} · ${Object.keys(S.portfolio||{}).length} stock positions detected.`,'ok');
    return user;
  }

  function createRequiredApiKey() {
    try { sessionStorage.setItem('SakaLuX_STOCK_KEY_SETUP_PENDING','1'); } catch {}
    location.href=REQUIRED_API_KEY_URL;
  }

  async function syncStockCatalog() {
    const key=get(K.api).trim();
    if(!key) throw new Error('Add an API key first.');
    const url=`https://api.torn.com/torn/?selections=stocks&key=${encodeURIComponent(key)}&ts=${Date.now()}`;
    const res=await fetch(url, {credentials:'omit'});
    const data=await res.json();
    if(data?.error) throw new Error(data.error.error || 'Torn stocks API error');
    const stocks=data?.stocks;
    if(!stocks || typeof stocks!=='object') throw new Error('Torn stock catalog unavailable.');
    const next=new Map(S.stocks);
    for(const [id,raw] of Object.entries(stocks)) {
      const sym=String(raw?.acronym||'').toUpperCase();
      const price=Number(raw?.current_price||raw?.price||0);
      if(!sym || !Number.isFinite(price) || price<=0) continue;
      const prev=next.get(sym)||{};
      next.set(sym,{...prev,sym,id:String(id),price,source:'api'});
    }
    if(next.size) S.stocks=next;
    return S.stocks;
  }

  async function ensureStock(sym) {
    sym=String(sym||'').toUpperCase();
    scanStocks();
    let stock=S.stocks.get(sym);
    if(stock?.id && stock?.price) return stock;
    await syncStockCatalog();
    stock=S.stocks.get(sym);
    if(!stock?.id || !stock?.price) throw new Error(`Unable to resolve ${sym} stock ID/price.`);
    return stock;
  }

  function benefitTier(sym, shares) {
    const d=BENEFITS[sym];
    if(!d) return {tier:0,keep:0,next:0,nextBlock:0};
    shares=Math.max(0,Number(shares)||0);
    if(d.type==='P') return shares>=d.base ? {tier:1,keep:d.base,next:0,nextBlock:0} : {tier:0,keep:0,next:d.base,nextBlock:d.base};
    let tier=0;
    while(shares >= d.base*(Math.pow(2,tier+1)-1)) tier++;
    const keep=tier>0 ? d.base*(Math.pow(2,tier)-1) : 0;
    const next=d.base*(Math.pow(2,tier+1)-1);
    const nextBlock=d.base*Math.pow(2,tier);
    return {tier,keep,next,nextBlock};
  }

  function loadBenefitOverrides() {
    try { return JSON.parse(get(K.benefitValues,'{}'))||{}; } catch { return {}; }
  }

  function saveBenefitOverrides(v) { set(K.benefitValues,JSON.stringify(v||{})); }

  function benefitValueInfo(sym) {
    const model=BENEFIT_MODELS[sym];
    if(!model) return {value:0,freq:0,label:'Not modelled',source:'none'};
    const overrides=loadBenefitOverrides();
    const ov=overrides[sym]||{};
    const freq=Number(ov.freq)>0?Number(ov.freq):Number(model.freq||0);
    let value=Number(ov.value)>0?Number(ov.value):0;
    let source=Number(ov.value)>0?'manual':'default';
    if(!value && model.type==='cash') value=Number(model.value||0);
    if(!value && model.type==='item') { value=Number(S.benefitPrices[model.id]||0); source=value?'Torn market':'missing'; }
    if(!value && model.type==='average') {
      const vals=(model.ids||[]).map(id=>Number(S.benefitPrices[id]||0)).filter(v=>v>0);
      if(vals.length){ value=vals.reduce((a,b)=>a+b,0)/vals.length; source='Torn market avg'; }
    }
    if(model.type==='manual' && !value) source='manual required';
    return {value,freq,label:model.label||sym,source};
  }

  function benefitDailyValue(sym) {
    const i=benefitValueInfo(sym);
    return i.value>0 && i.freq>0 ? i.value/i.freq : 0;
  }

  async function fetchBenefitMarketValues() {
    const key=get(K.api).trim();
    if(!key) throw new Error('Add an API key first.');
    const ids=[...new Set(Object.values(BENEFIT_MODELS).flatMap(m=>m.id?[m.id]:(m.ids||[])))];
    let ok=0;
    status(`Benefit values: fetching 0/${ids.length}…`,'warn');
    for(let i=0;i<ids.length;i++) {
      const id=ids[i];
      try {
        const r=await fetch(`https://api.torn.com/v2/torn/${id}/items?key=${encodeURIComponent(key)}&ts=${Date.now()}`,{credentials:'omit'});
        const d=await r.json();
        if(d?.error) throw new Error(d.error.error||'API error');
        let price=Number(d?.value?.market_price||d?.items?.[0]?.value?.market_price||d?.items?.[0]?.market_value||d?.market_price||0);
        if(price>0){S.benefitPrices[id]=price;ok++;}
      } catch {}
      status(`Benefit values: fetching ${i+1}/${ids.length}…`,'warn');
      await new Promise(r=>setTimeout(r,80));
    }
    renderBenefitValues(); renderAdvisor(); renderTradeAssistant();
    status(`Benefit values updated: ${ok}/${ids.length} market prices loaded.`,'ok');
    return ok;
  }

  function buildRoiCandidates() {
    scanStocks();
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    const rows=[];
    for(const [sym,model] of Object.entries(BENEFIT_MODELS)) {
      const d=BENEFITS[sym], st=S.stocks.get(sym);
      if(!d || !st?.price) continue;
      const daily=benefitDailyValue(sym);
      if(daily<=0) continue;
      const owned=ownedShares(sym);
      const tier=benefitTier(sym,owned);
      if(d.type==='P' && tier.tier>=1) continue;
      const targetShares=d.type==='P'?d.base:tier.next;
      const sharesNeeded=Math.max(0,targetShares-owned);
      if(sharesNeeded<=0) continue;
      const marginalShares=d.type==='P'?d.base:tier.nextBlock;
      const marginalCapital=marginalShares*st.price;
      const cost=sharesNeeded*st.price;
      const annual=daily*365;
      const roi=marginalCapital>0?(annual/marginalCapital)*100:0;
      if(!(roi>0)) continue;
      rows.push({sym,model,tier:tier.tier+1,owned,targetShares,sharesNeeded,price:st.price,cost,marginalCapital,daily,annual,roi,affordable:cash>=cost,cash});
    }
    return rows.sort((a,b)=>b.roi-a.roi || a.cost-b.cost);
  }

  function renderBenefitValues() {
    const box=$('#slx-stock-benefit-values'); if(!box) return;
    const overrides=loadBenefitOverrides();
    const rows=Object.keys(BENEFIT_MODELS).sort().map(sym=>{
      const m=BENEFIT_MODELS[sym], i=benefitValueInfo(sym), ov=overrides[sym]||{};
      return `<div class="benefit-row" data-sym="${sym}"><b>${sym}</b><span>${esc(m.label||'Benefit')}</span><input class="benefit-value" inputmode="numeric" placeholder="${i.value?Math.round(i.value):'value'}" value="${ov.value||''}"><input class="benefit-freq" inputmode="decimal" placeholder="days" value="${ov.freq||m.freq||''}"><small>${i.value?money(i.value):'value missing'} · ${esc(i.source)}</small></div>`;
    }).join('');
    box.innerHTML=rows;
    $$('.benefit-row',box).forEach(row=>{
      const sym=row.dataset.sym;
      const save=()=>{const all=loadBenefitOverrides();const value=parseAmount($('.benefit-value',row).value);const freq=Number($('.benefit-freq',row).value)||0;if(value>0||freq>0) all[sym]={value:value||undefined,freq:freq||undefined}; else delete all[sym];saveBenefitOverrides(all);renderAdvisor();renderTradeAssistant();};
      $('.benefit-value',row).onchange=save; $('.benefit-freq',row).onchange=save;
    });
  }

  function renderTradeAssistant() {
    const box=$('#slx-stock-trade-body'); if(!box) return;
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="muted">Sync API and fetch benefit values to generate ROI candidates.</div>';return;}
    const best=rows[0];
    const affordable=rows.find(r=>r.affordable);
    const cards=[['Best ROI',best],['Best affordable',affordable]].filter(x=>x[1]);
    box.innerHTML=cards.map(([title,r])=>`<div class="trade-card"><div><small>${title}</small><b>${r.sym} · Tier ${r.tier}</b><span>${r.roi.toFixed(2)}% est. annual ROI</span></div><div><small>Need</small><b>${r.sharesNeeded.toLocaleString()} shares</b><span>${money(r.cost)}</span></div><div class="trade-actions"><button data-set="${r.sym}">Set target</button><button class="primary" data-buy="${r.sym}" data-shares="${r.sharesNeeded}">Buy gap</button></div></div>`).join('');
    $$('[data-set]',box).forEach(b=>b.onclick=()=>{set(K.target,b.dataset.set);refreshTargetSelect();status(`${b.dataset.set} selected as vault target.`,'ok');});
    $$('[data-buy]',box).forEach(b=>b.onclick=async()=>{const sym=b.dataset.buy;const requested=Number(b.dataset.shares)||0;try{const st=await ensureStock(sym);let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());if(!cash){await apiSync();cash=Number(S.money)||0;}const can=Math.floor(cash/st.price);const shares=Math.min(requested,can);if(shares<=0)throw new Error(`Not enough cash to buy ${sym}.`);if(!confirm(`Buy ${shares.toLocaleString()} ${sym} shares for about ${money(shares*st.price)}?`))return;await postTrade(sym,shares,'buyShares');status(`Trade Assistant bought ${shares.toLocaleString()} ${sym}.`,'ok');await syncAllApi();}catch(e){status(`Trade Assistant: ${e.message}`,'bad');}});
  }

  function scanStocks() {
    const rows=$$("ul[class^='stock_'], ul[id^='stock_']");
    const next=new Map();
    for(const row of rows) {
      const img=$('img[src*="logos/"]',row);
      const src=img?.getAttribute('src')||'';
      const mm=src.match(/logos\/([^/.]+)\.svg/i);
      const sym=(mm?.[1]||'').toUpperCase();
      if(!sym) continue;
      const id=(row.id||'').replace(/^stock_/, '');
      const priceEl=$("div[class^='price_']",row) || $('[data-price]',row);
      const price=num(priceEl?.textContent || priceEl?.getAttribute('data-price'));
      let owned=0;
      const mobile=$("p[class^='count']",row);
      if(mobile) owned=num(mobile.textContent);
      if(!owned) {
        const txt=row.textContent||'';
        const m=txt.match(/(?:owned|shares)\s*:?\s*([\d,]+)/i);
        if(m) owned=num(m[1]);
      }
      next.set(sym,{sym,id,row,price,owned});
    }
    if(next.size) S.stocks=next;
    return S.stocks;
  }

  function ownedShares(sym) {
    const stock=S.stocks.get(sym);
    if(stock?.owned) return stock.owned;
    const id=stock?.id;
    if(id && S.portfolio?.[id]) return Number(S.portfolio[id].total_shares)||0;
    return 0;
  }

  function averageBuy(sym) {
    const stock=S.stocks.get(sym); if(!stock?.id) return 0;
    const data=S.portfolio?.[stock.id];
    const tx=data?.transactions ? Object.values(data.transactions) : [];
    let shares=0,cost=0;
    for(const t of tx) {
      const q=Number(t.shares||t.amount||0);
      const p=Number(t.bought_price||t.price||t.price_each||0);
      if(q>0 && p>0){shares+=q;cost+=q*p;}
    }
    return shares?cost/shares:0;
  }

  function loadActionLog() {
    try { const v=JSON.parse(get(K.actionLog,'[]')); return Array.isArray(v)?v:[]; } catch { return []; }
  }

  function addActionLog(entry) {
    const rows=loadActionLog();
    rows.unshift({time:Date.now(),...entry});
    set(K.actionLog,JSON.stringify(rows.slice(0,40)));
    renderActionLog();
  }

  function clearActionLog() {
    del(K.actionLog);
    renderActionLog();
    status('Action log cleared.','ok');
  }

  function renderActionLog() {
    const box=$('#slx-stock-action-log'); if(!box) return;
    const rows=loadActionLog();
    if(!rows.length){box.innerHTML='<div class="muted">No stock actions logged yet.</div>';return;}
    box.innerHTML=rows.slice(0,15).map(r=>{
      const when=new Date(Number(r.time)||Date.now()).toLocaleString();
      const verb=r.step==='buyShares'?'BUY':r.step==='sellShares'?'SELL':String(r.step||'ACTION').toUpperCase();
      const cls=r.status==='ok'?'good':r.status==='dry'?'warn':'bad';
      return `<div class="action-row"><span>${esc(when)}</span><b>${esc(verb)} ${esc(r.sym||'')}</b><span>${Number(r.shares||0).toLocaleString()} sh</span><span>${r.estimate?money(r.estimate):''}</span><span class="${cls}">${esc(r.message||r.status||'')}</span></div>`;
    }).join('');
  }

  function setTradeBusy(on, label='') {
    S.tradeBusy=!!on;
    const p=S.panel;
    if(p){p.dataset.trading=on?'1':'0';$$('button',p).forEach(b=>{if(!b.classList.contains('close')) b.disabled=!!on;});}
    const panic=$('#slx-stock-panic'); if(panic) panic.disabled=!!on;
    if(on && label) status(label,'warn');
  }

  function tradeCooldownRemaining() {
    return Math.max(0,1500-(Date.now()-Number(S.lastTradeAt||0)));
  }

  async function postTrade(sym, shares, step) {
    const stock=S.stocks.get(sym);
    if(!stock?.id) throw new Error(`Stock ID missing for ${sym}. Sync API or open Stocks.`);
    shares=Math.floor(Number(shares)||0);
    if(shares<=0) throw new Error('Share amount is 0.');
    const estimate=shares*Number(stock.price||0);
    if(S.tradeBusy) throw new Error('Another stock transaction is already running.');
    const wait=tradeCooldownRemaining();
    if(wait>0) throw new Error(`Trade cooldown: wait ${Math.ceil(wait/1000)}s.`);
    const dry=bool(K.dryRun,false);
    if(dry){
      addActionLog({status:'dry',step,sym,shares,estimate,message:'DRY RUN · no order sent'});
      status(`DRY RUN: ${step==='buyShares'?'buy':'sell'} ${shares.toLocaleString()} ${sym} ≈ ${money(estimate)} · no order sent.`,'warn');
      return {success:true,dryRun:true};
    }
    const token=rfc();
    if(!token) throw new Error('Torn session token unavailable. Refresh the page and try again.');
    setTradeBusy(true,`${step==='buyShares'?'Buying':'Selling'} ${shares.toLocaleString()} ${sym}…`);
    try {
      const body=new URLSearchParams({stockId:String(stock.id),amount:String(shares)});
      const res=await fetch(`https://www.torn.com/page.php?sid=StockMarket&step=${encodeURIComponent(step)}&rfcv=${encodeURIComponent(token)}`, {
        method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'}, body, credentials:'include', cache:'no-store'
      });
      const text=await res.text();
      let data=null; try{data=JSON.parse(text);}catch{}
      if(!res.ok) throw new Error(`Torn returned HTTP ${res.status}.`);
      const serverMessage=String(data?.text||data?.message||data?.error?.error||'').trim();
      if(data?.success===false || data?.error) throw new Error(serverMessage||'Torn rejected the stock transaction.');
      if(!data && /(?:error|invalid|failed|denied|insufficient)/i.test(text.slice(0,600))) throw new Error('Torn returned an unexpected trade error response.');
      S.lastTradeAt=Date.now();
      addActionLog({status:'ok',step,sym,shares,estimate,message:serverMessage||'Accepted by Torn'});
      return data||{success:true,raw:text};
    } catch(e) {
      addActionLog({status:'error',step,sym,shares,estimate,message:e.message||'Trade failed'});
      throw e;
    } finally {
      setTradeBusy(false);
    }
  }

  async function vault({keep=0, panic=false, direct=false}={}) {
    const sym=get(K.target).toUpperCase();
    if(!sym) throw new Error('Choose a vault target first.');
    const stock=await ensureStock(sym);
    let cash=currentMoneyFromDom();
    if(!cash || panic || direct) {
      try { await apiSync(); cash=S.money||cash; } catch(e) { if(!cash) throw e; }
    }
    const available=Math.max(0,cash-(Number(keep)||0));
    const shares=Math.floor(available/stock.price);
    if(shares<=0) throw new Error(`Not enough cash after keeping ${money(keep)}.`);
    status(`${panic?'PANIC':'Vault'}: buying ${shares.toLocaleString()} ${sym}…`,'warn');
    await postTrade(sym,shares,'buyShares');
    status(`${panic?'PANIC complete':'Vaulted'}: ${shares.toLocaleString()} ${sym} ≈ ${money(shares*stock.price)}`,'ok');
    return shares;
  }

  async function withdrawCash(amount) {
    scanStocks();
    const sym=get(K.target).toUpperCase();
    const stock=S.stocks.get(sym);
    if(!stock?.price) throw new Error('Select a valid target stock.');
    const shares=Math.ceil((Number(amount)||0)/stock.price);
    if(shares<=0) throw new Error('Enter a withdrawal amount.');
    const owned=ownedShares(sym);
    if(bool(K.benefitLock,true)) {
      const now=benefitTier(sym,owned), after=benefitTier(sym,owned-shares);
      if(after.tier<now.tier) throw new Error(`Benefit Lock: selling ${shares.toLocaleString()} ${sym} would drop the current benefit tier.`);
    }
    await postTrade(sym,Math.min(shares,owned||shares),'sellShares');
    status(`Withdrawn ≈ ${money(amount)} from ${sym}`,'ok');
  }

  async function withdrawAll() {
    scanStocks();
    const sym=get(K.target).toUpperCase();
    const owned=ownedShares(sym);
    if(!owned) throw new Error(`No ${sym} shares detected.`);
    let sell=owned;
    if(bool(K.benefitLock,true)) sell=Math.max(0,owned-benefitTier(sym,owned).keep);
    if(sell<=0) throw new Error('Benefit Lock: all detected shares are protected.');
    if(!confirm(`Sell ${sell.toLocaleString()} ${sym} shares?`)) return;
    await postTrade(sym,sell,'sellShares');
    status(`Sold ${sell.toLocaleString()} ${sym}`,'ok');
  }

  function renderAdvisor() {
    const box=$('#slx-stock-advisor-body'); if(!box) return;
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="muted">Sync API and load benefit values. Only benefits with a known cash-equivalent value are ranked.</div>';return;}
    box.innerHTML=rows.slice(0,10).map((r,index)=>`<div class="roi-row"><b>#${index+1} ${r.sym}</b><span>Tier ${r.tier}</span><span>${r.roi.toFixed(2)}% APR</span><span>${money(r.cost)} gap</span><span>${money(r.daily)}/day est.</span><span class="${r.affordable?'good':'muted'}">${r.affordable?'Affordable':'Missing '+money(Math.max(0,r.cost-r.cash))}</span></div>`).join('');
  }


  function renderPortfolio() {
    const box=$('#slx-stock-portfolio-body'); if(!box) return;
    const rows=buildPortfolioRows();
    if(!rows.length){
      box.innerHTML='<div class="muted">No portfolio data yet. Add/test the API key or open the Stocks page.</div>';
      return;
    }
    const totalValue=rows.reduce((n,r)=>n+r.value,0);
    const knownCost=rows.reduce((n,r)=>n+(r.cost||0),0);
    const knownValue=rows.reduce((n,r)=>n+(r.cost===null?0:r.value),0);
    const totalPl=knownValue-knownCost;
    const cash=Number(S.money)||currentMoneyFromDom()||0;
    box.innerHTML=`<div class="portfolio-summary"><div><span>Positions</span><b>${rows.length}</b></div><div><span>Market value</span><b>${money(totalValue)}</b></div><div><span>Cash</span><b>${money(cash)}</b></div><div><span>Known P/L</span><b class="${totalPl>=0?'good':'bad'}">${totalPl>=0?'+':''}${money(Math.abs(totalPl))}</b></div></div>`+
      `<div class="portfolio-list">${rows.map(r=>`<div class="portfolio-row"><div class="portfolio-sym"><b>${esc(r.sym)}</b><small>${r.tier?'Benefit tier '+r.tier:'No active benefit'}</small></div><div><span>${r.owned.toLocaleString()} shares</span><small>@ ${money(r.price)}</small></div><div><span>${money(r.value)}</span><small>${r.avg?`avg ${money(r.avg)}`:'avg n/a'}</small></div><div>${r.pl===null?'<span class="muted">P/L n/a</span>':`<span class="${r.pl>=0?'good':'bad'}">${r.pl>=0?'+':''}${money(Math.abs(r.pl))}</span>`}<small>${r.locked?`${r.locked.toLocaleString()} protected`:'no lock floor'}</small></div></div>`).join('')}</div>`;
  }


  function panicButton() {
    if($('#slx-stock-panic')) return;
    const b=document.createElement('button');
    b.id='slx-stock-panic'; b.type='button'; b.textContent='PANIC'; b.title='Panic v2 · preview and vault on-hand cash into the configured stock target';
    b.addEventListener('click', panic);
    (document.body||document.documentElement).appendChild(b);
  }

  async function resolvePanicPreview() {
    const primary=get(K.target).toUpperCase();
    const fallback=get(K.panicFallback).toUpperCase();
    const candidates=[primary,fallback].filter((v,i,a)=>v && a.indexOf(v)===i);
    if(!candidates.length) throw new Error('Choose a Panic primary target first.');

    let cash=currentMoneyFromDom();
    if(get(K.api).trim()) {
      try { await apiSync(); cash=Number(S.money)||cash; } catch(e) { if(!cash) throw e; }
    }
    if(!cash) throw new Error('Unable to determine on-hand cash. Add/test the API key first.');

    const useAll=bool(K.panicUseAll,false);
    const keep=useAll ? 0 : parseAmount(get(K.panicKeep,get(K.keep,'0')));
    const maxSpend=useAll ? 0 : parseAmount(get(K.panicMax,'0'));
    const available=Math.max(0,cash-keep);
    const allowed=maxSpend>0?Math.min(available,maxSpend):available;
    if(allowed<=0) throw new Error(`No Panic cash available after keeping ${money(keep)}.`);

    let lastError=null;
    for(let i=0;i<candidates.length;i++) {
      const sym=candidates[i];
      try {
        const stock=await ensureStock(sym);
        const shares=Math.floor(allowed/stock.price);
        if(shares<=0){lastError=new Error(`${sym} is too expensive for the configured Panic spend.`);continue;}
        const estimate=shares*stock.price;
        return {sym,stock,cash,keep,maxSpend,available,allowed,shares,estimate,leftover:Math.max(0,cash-estimate),fallbackUsed:i>0,useAll};
      } catch(e) { lastError=e; }
    }
    throw lastError||new Error('No Panic target could be resolved.');
  }

  function panicPreviewText(x) {
    return `${x.fallbackUsed?'Fallback ':''}${x.sym} · ${x.shares.toLocaleString()} shares · about ${money(x.estimate)} · cash ${money(x.cash)} → ${money(x.leftover)} remaining${x.useAll?' · 100% mode':''}`;
  }

  async function previewPanic() {
    try {
      status('PANIC preview: calculating exact order…','warn');
      const x=await resolvePanicPreview();
      const box=$('#slx-panic-preview');
      if(box){box.dataset.kind='ok';box.textContent=panicPreviewText(x);}
      status(`PANIC preview · ${panicPreviewText(x)}`,'ok');
      return x;
    } catch(e) {
      const box=$('#slx-panic-preview');
      if(box){box.dataset.kind='bad';box.textContent=e.message;}
      status(`PANIC preview failed: ${e.message}`,'bad');
      throw e;
    }
  }

  async function panic() {
    try {
      set(K.panicPending,'0');
      const x=await previewPanic();
      if(bool(K.panicConfirm,false)) {
        const ok=confirm(`PANIC v2\n\nTarget: ${x.sym}${x.fallbackUsed?' (fallback)':''}\nShares: ${x.shares.toLocaleString()}\nEstimated spend: ${money(x.estimate)}\nCash before: ${money(x.cash)}\nEstimated cash after: ${money(x.leftover)}\n\nExecute now?`);
        if(!ok){status('PANIC cancelled.','warn');return;}
      }
      status(`PANIC: buying ${x.shares.toLocaleString()} ${x.sym}…`,'warn');
      await postTrade(x.sym,x.shares,'buyShares');
      status(`PANIC complete · ${panicPreviewText(x)}`,'ok');
      if(get(K.api).trim() && !bool(K.dryRun,false)) syncAllApi().catch(()=>{});
    } catch(e) {
      set(K.panicPending,'0');
      status(`PANIC failed: ${e.message}`,'bad');
      openPanel();
    }
  }

  function style() {
    if($('#slx-stock-style')) return;
    const s=document.createElement('style'); s.id='slx-stock-style';
    s.textContent=`
#slx-stock-panic{position:fixed;right:10px;top:174px;z-index:2147482500;border:1px solid #ff5c6b;border-radius:10px;padding:8px 10px;background:linear-gradient(180deg,#7f1520,#4d0d14);color:#fff;font:900 11px Arial;box-shadow:0 6px 18px #0008}
#slx-stock-panel{position:fixed;inset:0;z-index:2147483000;background:#05080dcc;color:#e8eef7;display:none;align-items:flex-start;justify-content:center;padding:70px 10px 90px;overflow:auto;font-family:Arial,sans-serif}
#slx-stock-panel[data-open="1"]{display:flex} #slx-stock-panel .card{width:min(720px,100%);background:#0e1620;border:1px solid #344458;border-radius:16px;box-shadow:0 20px 55px #000b;overflow:hidden}
#slx-stock-panel .head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:linear-gradient(180deg,#162536,#101a26);border-bottom:1px solid #33465b} #slx-stock-panel h2{font-size:16px;margin:0;flex:1}
#slx-stock-panel button,#slx-stock-panel select,#slx-stock-panel input{box-sizing:border-box;border:1px solid #43556a;border-radius:9px;background:#111d29;color:#eef5ff;padding:9px;font-size:12px}
#slx-stock-panel button{font-weight:800} #slx-stock-panel .close{width:36px} #slx-stock-panel .body{padding:12px;display:grid;gap:10px}
#slx-stock-panel .section{border:1px solid #27384a;border-radius:12px;padding:10px;background:#0b121a} #slx-stock-panel .title{font-size:11px;font-weight:900;color:#90b9e8;margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em}
#slx-stock-panel .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px} #slx-stock-panel label{display:grid;gap:5px;font-size:10px;color:#9aabba} #slx-stock-panel .actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
#slx-stock-panel .primary{background:#194f86;border-color:#2e77b9} #slx-stock-panel .danger{background:#64131c;border-color:#a92c3b} #slx-stock-panel .good{color:#55d98a}.bad{color:#ff6b78}.muted{color:#8392a4} #slx-stock-panel .warn{color:#ffd36b} #slx-stock-panel button:disabled,#slx-stock-panic:disabled{opacity:.5;cursor:not-allowed} #slx-stock-panel[data-trading="1"] .card{outline:1px solid #8b6a1f}
#slx-stock-panel #slx-stock-status{padding:8px;border-radius:8px;background:#111b26;font-size:11px;color:#9fb0c3} #slx-stock-panel #slx-stock-status[data-kind="ok"]{color:#61e291} #slx-stock-panel #slx-stock-status[data-kind="bad"]{color:#ff7a86} #slx-stock-panel #slx-stock-status[data-kind="warn"]{color:#ffd36b}
#slx-stock-panel .adv-row{display:grid;grid-template-columns:70px 1fr 1fr 1.4fr 1fr;gap:7px;padding:7px 0;border-bottom:1px solid #1c2a38;font-size:10px;align-items:center}
#slx-stock-panel .api-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}#slx-stock-panel .api-head .title{margin:0;flex:1}
#slx-stock-panel .api-badge{padding:4px 7px;border-radius:999px;border:1px solid #44566a;background:#121e2a;color:#98aabd;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}
#slx-stock-panel .api-badge[data-kind="ok"]{border-color:#267c52;color:#63df9a;background:#0d281d}#slx-stock-panel .api-badge[data-kind="warn"]{border-color:#8b6a1f;color:#ffd36b;background:#2a210d}
#slx-stock-panel .api-key-row{display:grid;grid-template-columns:1fr auto;gap:7px}#slx-stock-panel .api-help{margin-top:7px;font-size:10px;line-height:1.35;color:#8293a7}
#slx-stock-panel .portfolio-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}#slx-stock-panel .portfolio-summary>div{padding:8px;border:1px solid #23374a;border-radius:9px;background:#101a25;display:grid;gap:3px}#slx-stock-panel .portfolio-summary span,#slx-stock-panel .portfolio-row small{color:#8192a5;font-size:9px}#slx-stock-panel .portfolio-summary b{font-size:11px}
#slx-stock-panel .portfolio-list{display:grid;gap:6px}#slx-stock-panel .portfolio-row{display:grid;grid-template-columns:1.05fr 1.1fr 1.15fr 1.15fr;gap:7px;align-items:center;padding:8px;border:1px solid #1f3040;border-radius:9px;background:#0d1620;font-size:10px}#slx-stock-panel .portfolio-row>div{display:grid;gap:3px}.portfolio-sym b{font-size:12px;color:#dcecff}
#slx-stock-panel .benefit-list{display:grid;gap:6px;max-height:280px;overflow:auto}#slx-stock-panel .benefit-row{display:grid;grid-template-columns:42px 1.4fr 95px 62px 1fr;gap:6px;align-items:center;padding:7px;border:1px solid #203142;border-radius:8px;background:#0d1620;font-size:9px}#slx-stock-panel .benefit-row input{min-width:0;padding:6px}#slx-stock-panel .benefit-row small{color:#7f91a5}
#slx-stock-panel .roi-row{display:grid;grid-template-columns:78px 65px 78px 1fr 1fr 1fr;gap:6px;padding:7px 0;border-bottom:1px solid #1c2a38;font-size:10px;align-items:center}#slx-stock-panel .trade-list{display:grid;gap:7px}#slx-stock-panel .trade-card{display:grid;grid-template-columns:1.4fr 1fr auto;gap:8px;padding:9px;border:1px solid #27415a;border-radius:10px;background:#0e1823;align-items:center}.trade-card>div{display:grid;gap:3px}.trade-card small{font-size:9px;color:#8296aa}.trade-card span{font-size:9px;color:#a7b8c9}.trade-actions{display:flex!important;gap:5px}.trade-actions button{padding:7px!important}
#slx-stock-panel .safety-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#slx-stock-panel .panic-preview{margin-top:8px;padding:8px;border:1px solid #2b3f53;border-radius:8px;background:#0d1721;color:#8fa2b6;font-size:10px;line-height:1.4}#slx-stock-panel .panic-preview[data-kind="ok"]{border-color:#267c52;color:#63df9a}#slx-stock-panel .panic-preview[data-kind="bad"]{border-color:#8c3140;color:#ff7a86}#slx-stock-panel .action-list{display:grid;gap:5px;max-height:230px;overflow:auto}#slx-stock-panel .action-row{display:grid;grid-template-columns:1.25fr .8fr .8fr 1fr 1.4fr;gap:6px;padding:6px 0;border-bottom:1px solid #1c2a38;font-size:9px;align-items:center}
@media(max-width:600px){#slx-stock-panel .safety-grid{grid-template-columns:1fr}#slx-stock-panel .action-row{grid-template-columns:1fr 1fr}.action-row span:nth-child(n+3){grid-column:2/3}#slx-stock-panel .grid{grid-template-columns:1fr}#slx-stock-panel .benefit-row{grid-template-columns:42px 1fr 85px 58px}.benefit-row small{grid-column:2/5}#slx-stock-panel .roi-row{grid-template-columns:65px 55px 70px}.roi-row span:nth-child(n+4){grid-column:2/4}#slx-stock-panel .trade-card{grid-template-columns:1fr 1fr}.trade-actions{grid-column:1/3}#slx-stock-panel .portfolio-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .portfolio-row{grid-template-columns:1fr 1fr}#slx-stock-panel .adv-row{grid-template-columns:56px 1fr 1fr;}.adv-row span:nth-child(4),.adv-row span:nth-child(5){grid-column:2/4}#slx-stock-panic{top:auto;bottom:88px;right:12px}}
`;
    (document.head||document.documentElement).appendChild(s);
  }

  function panel() {
    if(S.panel?.isConnected) return S.panel;
    const p=document.createElement('div'); p.id='slx-stock-panel';
    p.innerHTML=`<div class="card"><div class="head"><div>📊</div><h2>${APP.name} <span class="muted">v${APP.version} · EXPERIMENTAL</span></h2><button class="close" type="button">×</button></div><div class="body">
      <div class="section"><div class="api-head"><div class="title">Torn API Key</div><span id="slx-stock-api-badge" class="api-badge">${get(K.api)?'Saved':'Not configured'}</span></div>
        <div class="api-key-row"><input id="slx-stock-api" type="password" autocomplete="off" placeholder="Paste Torn API key"><button id="slx-api-show" type="button" title="Show / hide API key">👁</button></div>
        <div class="actions"><button id="slx-api-save" class="primary" type="button">Save Key</button><button id="slx-api-test" type="button">Test & Sync</button><button id="slx-api-create" type="button">Create Required Key</button><button id="slx-api-clear" class="danger" type="button">Clear</button></div>
        <div class="api-help">Required selections: <b>user → money, stocks</b> and <b>torn → stocks</b>. The key is stored locally in this experimental script.</div>
      </div>
      <div class="section"><div class="title">Vault & Panic v2</div><div class="grid">
        <label>Primary target <select id="slx-stock-target"><option value="">Sync API or open Stocks to detect symbols</option></select></label>
        <label>Fallback target <select id="slx-panic-fallback"><option value="">None</option></select></label>
        <label>Vault keep cash <input id="slx-stock-keep" value="${esc(get(K.keep,'0'))}" placeholder="e.g. 250k"></label>
        <label>Withdraw amount <input id="slx-stock-withdraw" value="${esc(get(K.withdraw,'1m'))}" placeholder="e.g. 1m"></label>
        <label>PANIC keep cash <input id="slx-panic-keep" value="${esc(get(K.panicKeep,get(K.keep,'0')))}" placeholder="e.g. 100k"></label>
        <label>PANIC max spend <input id="slx-panic-max" value="${esc(get(K.panicMax,'0'))}" placeholder="0 = unlimited"></label>
      </div><div class="actions"><button id="slx-vault-max" class="primary">Vault Max</button><button id="slx-vault-keep">Vault (Keep)</button><button id="slx-withdraw">Withdraw</button><button id="slx-withdraw-all">Withdraw All</button></div>
      <div class="actions"><label><input id="slx-benefit-lock" type="checkbox"> Lock Benefits</label><label><input id="slx-panic-confirm" type="checkbox"> Confirm Panic</label><label><input id="slx-panic-use-all" type="checkbox"> PANIC uses 100% cash</label><button id="slx-panic-preview-btn" type="button">Preview PANIC</button></div>
      <div id="slx-panic-preview" class="panic-preview">Preview shows target, exact shares, estimated spend and cash remaining before any order is sent.</div></div>
      <div class="section"><div class="title">Safety</div><div class="safety-grid"><label><input id="slx-dry-run" type="checkbox"> Dry Run · calculate/log only, never send BUY/SELL</label><div class="muted">Trades are serialized and protected by a 1.5s anti-double-click cooldown.</div></div></div>
      <div class="section"><div class="api-head"><div class="title">Action Log</div><button id="slx-log-clear" type="button">Clear Log</button></div><div id="slx-stock-action-log" class="action-list muted">No stock actions logged yet.</div></div>
      <div class="section"><div class="title">Portfolio</div><div id="slx-stock-portfolio-body" class="muted">Waiting for portfolio data…</div></div>
      <div class="section"><div class="title">Benefit Values</div><div class="actions"><button id="slx-benefit-fetch" class="primary" type="button">Fetch Market Values</button><button id="slx-benefit-reset" type="button">Reset Manual Values</button></div><div id="slx-stock-benefit-values" class="benefit-list"></div></div>
      <div class="section"><div class="title">Benefit ROI Advisor</div><div id="slx-stock-advisor-body" class="muted">Waiting for stock data…</div></div>
      <div class="section"><div class="title">Trade Assistant</div><div id="slx-stock-trade-body" class="trade-list muted">Waiting for ROI data…</div></div>
      <div id="slx-stock-status">Experimental build. Not registered in SakaLuX Hub or Standalone.</div>
    </div></div>`;
    document.body.appendChild(p); S.panel=p; S.status=$('#slx-stock-status',p);
    $('.close',p).onclick=()=>p.dataset.open='0';
    $('#slx-stock-api',p).value=get(K.api);
    $('#slx-stock-api-badge',p).dataset.kind=get(K.api)?'idle':'idle';
    $('#slx-benefit-lock',p).checked=bool(K.benefitLock,true);
    $('#slx-panic-confirm',p).checked=bool(K.panicConfirm,false);
    $('#slx-panic-use-all',p).checked=bool(K.panicUseAll,false);
    $('#slx-dry-run',p).checked=bool(K.dryRun,true);
    $('#slx-api-show',p).onclick=()=>{const i=$('#slx-stock-api',p);i.type=i.type==='password'?'text':'password';};
    $('#slx-api-save',p).onclick=()=>{try{saveApiKeyFromPanel();}catch(e){status(e.message,'bad');}};
    $('#slx-api-test',p).onclick=async()=>{try{saveApiKeyFromPanel();await syncAllApi();}catch(e){setApiBadge('Error','warn');status(e.message,'bad');}};
    $('#slx-api-create',p).onclick=createRequiredApiKey;
    $('#slx-api-clear',p).onclick=clearApiKey;
    $('#slx-benefit-fetch',p).onclick=()=>fetchBenefitMarketValues().catch(e=>status(e.message,'bad'));
    $('#slx-benefit-reset',p).onclick=()=>{if(confirm('Reset all manual benefit values/frequencies?')){del(K.benefitValues);renderBenefitValues();renderAdvisor();renderTradeAssistant();status('Manual benefit values reset.','ok');}};
    $('#slx-stock-keep',p).onchange=e=>set(K.keep,e.target.value);
    $('#slx-stock-withdraw',p).onchange=e=>set(K.withdraw,e.target.value);
    $('#slx-panic-keep',p).onchange=e=>set(K.panicKeep,e.target.value);
    $('#slx-panic-max',p).onchange=e=>set(K.panicMax,e.target.value);
    $('#slx-benefit-lock',p).onchange=e=>set(K.benefitLock,e.target.checked?'1':'0');
    $('#slx-panic-confirm',p).onchange=e=>set(K.panicConfirm,e.target.checked?'1':'0');
    $('#slx-panic-use-all',p).onchange=e=>{set(K.panicUseAll,e.target.checked?'1':'0');status(`PANIC 100% cash mode ${e.target.checked?'enabled':'disabled'}.`,e.target.checked?'warn':'ok');};
    $('#slx-panic-fallback',p).onchange=e=>set(K.panicFallback,e.target.value);
    $('#slx-panic-preview-btn',p).onclick=()=>previewPanic().catch(()=>{});
    $('#slx-dry-run',p).onchange=e=>{set(K.dryRun,e.target.checked?'1':'0');status(`Dry Run ${e.target.checked?'enabled':'disabled'}.`,e.target.checked?'warn':'ok');};
    $('#slx-log-clear',p).onclick=clearActionLog;
    $('#slx-stock-target',p).onchange=e=>{set(K.target,e.target.value);const v=$('#slx-panic-preview',p);if(v){v.dataset.kind='';v.textContent='Target changed · run Preview PANIC again.';}renderPortfolio();renderAdvisor();};
    $('#slx-vault-max',p).onclick=()=>vault().then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    $('#slx-vault-keep',p).onclick=()=>vault({keep:parseAmount($('#slx-stock-keep',p).value)}).then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    $('#slx-withdraw',p).onclick=()=>withdrawCash(parseAmount($('#slx-stock-withdraw',p).value)).then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    $('#slx-withdraw-all',p).onclick=()=>withdrawAll().then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    return p;
  }

  function refreshTargetSelect() {
    if(!S.panel?.isConnected) return;
    scanStocks();
    const primary=$('#slx-stock-target',S.panel), fallback=$('#slx-panic-fallback',S.panel);
    const current=get(K.target).toUpperCase(), currentFallback=get(K.panicFallback).toUpperCase();
    const list=[...S.stocks.keys()].sort();
    if(primary) primary.innerHTML='<option value="">Select stock…</option>'+list.map(sym=>`<option value="${esc(sym)}" ${sym===current?'selected':''}>${esc(sym)} · ${money(S.stocks.get(sym).price)}</option>`).join('');
    if(fallback) fallback.innerHTML='<option value="">None</option>'+list.map(sym=>`<option value="${esc(sym)}" ${sym===currentFallback?'selected':''}>${esc(sym)} · ${money(S.stocks.get(sym).price)}</option>`).join('');
  }

  function openPanel() { style(); panel(); refreshTargetSelect(); renderPortfolio(); renderBenefitValues(); renderAdvisor(); renderTradeAssistant(); renderActionLog(); S.panel.dataset.open='1'; }

  function managerLauncher() {
    if($('#slx-stock-open')) return;
    const b=document.createElement('button'); b.id='slx-stock-open'; b.type='button'; b.textContent='📊 Stock Manager';
    b.style.cssText='position:fixed;right:10px;bottom:44px;z-index:2147482499;border:1px solid #3c6c96;border-radius:10px;padding:8px 10px;background:#102335;color:#dceeff;font:800 11px Arial;';
    b.onclick=openPanel; document.body.appendChild(b);
  }

  function restoreCache() { try { S.portfolio=JSON.parse(get(K.tx,'{}'))||{}; } catch {} }

  async function init() {
    style(); restoreCache(); panicButton(); managerLauncher();
    try { if(sessionStorage.getItem('SakaLuX_STOCK_KEY_SETUP_PENDING')==='1'){sessionStorage.removeItem('SakaLuX_STOCK_KEY_SETUP_PENDING');setTimeout(openPanel,700);} } catch {}
    if(isStocks()) {
      const wait=setInterval(()=>{ if(scanStocks().size){clearInterval(wait); if(S.panel?.dataset.open==='1'){refreshTargetSelect();renderAdvisor();} if(get(K.panicPending)==='1') panic();}},500);
      setTimeout(()=>clearInterval(wait),15000);
    }
    const mo=new MutationObserver(()=>{ if(isStocks()) scanStocks(); });
    mo.observe(document.documentElement,{subtree:true,childList:true});
  }

  init();
})();
