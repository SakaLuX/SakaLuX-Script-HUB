// ==UserScript==
// @name         SakaLuX Stock Manager & Advisor [EXPERIMENTAL]
// @namespace    sakalux.stock.manager.advisor
// @version      0.7.4
// @description  Experimental Torn stock workspace with repaired inline workspaces, portfolio runtime helpers, compact controls and guided rebalance execution beside its preview.
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
    version: '0.7.4',
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
    panicUseAll: 'SLX_STOCK_PANIC_USE_ALL',
    bankApr: 'SLX_STOCK_BANK_APR',
    optimizerMinApr: 'SLX_STOCK_OPTIMIZER_MIN_APR',
    rebalanceReserve: 'SLX_STOCK_REBALANCE_RESERVE',
    inlineCollapsed: 'SLX_STOCK_INLINE_COLLAPSED',
    inlineTab: 'SLX_STOCK_INLINE_TAB',
    inlineApiMode: 'SLX_STOCK_INLINE_API_MODE',
    inlinePresets: 'SLX_STOCK_INLINE_PRESETS',
    inlineButtons: 'SLX_STOCK_INLINE_BUTTONS',
    stockSort: 'SLX_STOCK_SORT',
    stockFilter: 'SLX_STOCK_FILTER',
    favorites: 'SLX_STOCK_FAVORITES',
    nearBenefitPct: 'SLX_STOCK_NEAR_BENEFIT_PCT',
    targetLock: 'SLX_STOCK_TARGET_LOCK',
    compactMode: 'SLX_STOCK_COMPACT_MODE',
    rowSearch: 'SLX_STOCK_ROW_SEARCH',
    targetFavorites: 'SLX_STOCK_TARGET_FAVORITES',
    cashTarget: 'SLX_STOCK_CASH_TARGET',
    txHistory: 'SLX_STOCK_TRANSACTION_HISTORY'
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
  const isDryRun = () => bool(K.dryRun,true);
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

  function apiErrorMessage(data, fallback='Torn API error') {
    const raw=data?.error?.error ?? data?.error?.message ?? data?.error ?? data?.message;
    if(typeof raw==='string' && raw.trim()) return raw.trim();
    return fallback;
  }

  async function apiJson(url, label='API') {
    const res=await fetch(url,{credentials:'omit',cache:'no-store'});
    let data=null;
    try { data=await res.json(); } catch { throw new Error(`${label}: invalid JSON response (HTTP ${res.status}).`); }
    if(!res.ok) throw new Error(`${label}: HTTP ${res.status} · ${apiErrorMessage(data,'request failed')}`);
    if(data?.error) throw new Error(`${label}: ${apiErrorMessage(data)}`);
    return data;
  }

  function normalizeUserStocks(data) {
    const out={};
    const raw=data?.stocks;
    if(Array.isArray(raw)) {
      for(const st of raw) {
        const id=String(st?.id ?? st?.stock_id ?? '');
        if(!id) continue;
        const shares=Number(st?.shares ?? st?.total_shares ?? st?.amount ?? 0)||0;
        out[id]={...st,total_shares:shares,transactions:st?.transactions||{}};
      }
      return out;
    }
    if(raw && typeof raw==='object') {
      for(const [id,st] of Object.entries(raw)) out[String(id)]={...st,total_shares:Number(st?.total_shares ?? st?.shares ?? 0)||0,transactions:st?.transactions||{}};
    }
    return out;
  }

  async function apiSync() {
    const key=get(K.api).trim();
    if(!key) throw new Error('Add an API key first.');
    const q=`key=${encodeURIComponent(key)}&ts=${Date.now()}`;
    const [moneyData,stocksData]=await Promise.all([
      apiJson(`https://api.torn.com/v2/user/money?${q}`,'User / money'),
      apiJson(`https://api.torn.com/v2/user/stocks?${q}`,'User / stocks')
    ]);
    const rawCash=moneyData?.money?.onhand ?? moneyData?.money?.cash ?? moneyData?.money_onhand ?? moneyData?.cash;
    const cash=Number(rawCash);
    if(Number.isFinite(cash)) S.money=cash;
    S.portfolio=normalizeUserStocks(stocksData);
    set(K.tx,JSON.stringify(S.portfolio||{}));
    return {money:moneyData,stocks:stocksData};
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
    renderOptimizer();
    renderTradeAssistant();
    refreshInlinePanel();
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
    const data=await apiJson(`https://api.torn.com/v2/torn/stocks?key=${encodeURIComponent(key)}&ts=${Date.now()}`,'Torn / stocks');
    const stocks=data?.stocks;
    if(!stocks || (typeof stocks!=='object' && !Array.isArray(stocks))) throw new Error('Torn / stocks: stock catalog unavailable.');
    const next=new Map(S.stocks);
    const list=Array.isArray(stocks)?stocks:Object.entries(stocks).map(([id,v])=>({...v,id:v?.id??id}));
    for(const raw of list) {
      const id=String(raw?.id ?? raw?.stock_id ?? '');
      const sym=String(raw?.acronym||raw?.symbol||'').toUpperCase();
      const price=Number(raw?.market?.price ?? raw?.current_price ?? raw?.price ?? 0);
      if(!id || !sym || !Number.isFinite(price) || price<=0) continue;
      const prev=next.get(sym)||{};
      next.set(sym,{...prev,sym,id,price,source:'api-v2'});
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
    renderBenefitValues(); renderAdvisor(); renderOptimizer(); renderTradeAssistant();
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
      const bankApr=Math.max(0,Number(get(K.bankApr,'0'))||0);
      const paybackDays=daily>0?marginalCapital/daily:Infinity;
      rows.push({sym,model,tier:tier.tier+1,owned,targetShares,sharesNeeded,price:st.price,cost,marginalCapital,daily,annual,roi,paybackDays,bankApr,bankDelta:roi-bankApr,beatsBank:bankApr>0?roi>bankApr:null,affordable:cash>=cost,cash});
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

  function stockRowMetrics(sym) {
    const st=S.stocks.get(sym);
    if(!st) return null;
    const owned=ownedShares(sym);
    const avg=averageBuy(sym);
    const price=Number(st.price)||0;
    const value=owned*price;
    const cost=avg>0?owned*avg:null;
    const pl=cost===null?null:value-cost;
    const plPct=cost>0?(pl/cost)*100:null;
    const tier=benefitTier(sym,owned);
    const nextGap=tier.next&&tier.next>owned?tier.next-owned:0;
    const protectedShares=tier.keep||0;
    const freeShares=Math.max(0,owned-protectedShares);
    return {sym,st,owned,avg,price,value,cost,pl,plPct,tier,nextGap,protectedShares,freeShares};
  }

  async function stockRowBuyGap(sym) {
    try {
      scanStocks();
      const m=stockRowMetrics(sym);
      if(!m) throw new Error(`${sym} is not available.`);
      if(!m.nextGap) throw new Error(`${sym} has no detected next benefit gap.`);
      let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
      if(bool(K.inlineApiMode,true)&&get(K.api).trim()) {
        try { await apiSync(); cash=Math.max(cash,Number(S.money)||0); } catch {}
      }
      const shares=Math.min(m.nextGap,Math.floor(cash/m.price));
      if(shares<=0) throw new Error(`Not enough cash to buy ${sym}.`);
      const estimate=shares*m.price;
      if(!confirm(`BUY GAP · ${sym}\n\n${shares.toLocaleString()} shares\nEstimated: ${money(estimate)}\nNext benefit gap: ${m.nextGap.toLocaleString()} shares\n\nExecute now?`)) return;
      await postTrade(sym,shares,'buyShares');
      inlineStatus(`${isDryRun()?'Dry Run · ':''}BUY GAP ${shares.toLocaleString()} ${sym}.`,'ok');
      if(get(K.api).trim()&&!isDryRun()) await syncAllApi();
      scanStocks(); enhanceStockRows(); refreshInlinePanel();
    } catch(e) { inlineStatus(`Row BUY ${sym}: ${e.message}`,'bad'); }
  }

  async function stockRowSellExcess(sym) {
    try {
      scanStocks();
      const m=stockRowMetrics(sym);
      if(!m?.owned) throw new Error(`No ${sym} shares detected.`);
      const shares=m.freeShares;
      if(shares<=0) throw new Error(`${sym} has no shares above the protected benefit floor.`);
      const estimate=shares*m.price;
      if(!confirm(`SELL EXCESS · ${sym}\n\n${shares.toLocaleString()} shares\nEstimated: ${money(estimate)}\nProtected after sale: ${m.protectedShares.toLocaleString()} shares\n\nExecute now?`)) return;
      await postTrade(sym,shares,'sellShares');
      inlineStatus(`${isDryRun()?'Dry Run · ':''}SELL EXCESS ${shares.toLocaleString()} ${sym}.`,'ok');
      if(get(K.api).trim()&&!isDryRun()) await syncAllApi();
      scanStocks(); enhanceStockRows(); refreshInlinePanel();
    } catch(e) { inlineStatus(`Row SELL ${sym}: ${e.message}`,'bad'); }
  }

  function stockRowBenefitProgress(sym, owned) {
    const tier=benefitTier(sym,owned);
    if(!tier.next) return {pct:100,label:tier.tier?`Tier ${tier.tier} complete`:'No next tier',tier};
    const start=Math.max(0,Number(tier.keep)||0);
    const span=Math.max(1,Number(tier.next)-start);
    const pct=Math.max(0,Math.min(100,((Number(owned)||0)-start)/span*100));
    return {pct,label:`${pct.toFixed(1)}% to Tier ${tier.tier+1}`,tier};
  }

  function stockRowQuickOptions() {
    const vals=inlinePresetValues().slice(0,6);
    return [...vals,'max'];
  }

  async function stockRowQuickTrade(sym, side, rawAmount) {
    try {
      sym=String(sym||'').toUpperCase();
      const st=await ensureStock(sym);
      scanStocks();
      const owned=ownedShares(sym);
      const isMax=String(rawAmount||'').toLowerCase()==='max';
      const amount=isMax?0:Math.max(0,parseAmount(rawAmount));
      let shares=0;
      let estimate=0;

      if(side==='buy') {
        let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
        if(!cash && get(K.api).trim()) { await apiSync(); cash=Number(S.money)||0; }
        if(!cash) throw new Error('Unable to determine on-hand cash.');
        const keep=Math.max(0,parseAmount(get(K.keep,'0')));
        const spendable=Math.max(0,cash-keep);
        const budget=isMax?spendable:Math.min(amount,spendable);
        shares=Math.floor(budget/st.price);
        estimate=shares*st.price;
        if(shares<=0) throw new Error(`Not enough spendable cash for ${sym}.`);
        if(!confirm(`Quick BUY ${sym}\n\nPreset: ${isMax?'MAX':String(rawAmount).toUpperCase()}\nShares: ${shares.toLocaleString()}\nEstimated spend: ${money(estimate)}\nVault keep preserved: ${money(keep)}\n\nExecute now?`)) return;
        await postTrade(sym,shares,'buyShares');
        inlineStatus(`${isDryRun()?'Dry Run · ':''}Quick BUY ${shares.toLocaleString()} ${sym} · ${money(estimate)}.`,'ok');
      } else {
        if(!owned) throw new Error(`No ${sym} shares detected.`);
        const tier=benefitTier(sym,owned);
        const protectedShares=bool(K.benefitLock,true)?tier.keep:0;
        const sellable=Math.max(0,owned-protectedShares);
        if(sellable<=0) throw new Error('Benefit Lock: no sellable shares above the protected floor.');
        const requested=isMax?sellable:Math.ceil(amount/st.price);
        shares=Math.min(sellable,requested);
        estimate=shares*st.price;
        if(shares<=0) throw new Error(`Nothing to sell for ${sym}.`);
        if(!confirm(`Quick SELL ${sym}\n\nPreset: ${isMax?'MAX':String(rawAmount).toUpperCase()}\nShares: ${shares.toLocaleString()}\nEstimated proceeds: ${money(estimate)}\nProtected floor: ${protectedShares.toLocaleString()} shares\n\nExecute now?`)) return;
        await postTrade(sym,shares,'sellShares');
        inlineStatus(`${isDryRun()?'Dry Run · ':''}Quick SELL ${shares.toLocaleString()} ${sym} · ${money(estimate)}.`,'ok');
      }

      if(get(K.api).trim()&&!isDryRun()) await syncAllApi();
      scanStocks(); enhanceStockRows(); refreshInlinePanel();
    } catch(e) { inlineStatus(`Quick ${String(side||'trade').toUpperCase()} ${sym}: ${e.message}`,'bad'); }
  }

  function favoriteStocks() {
    try { const a=JSON.parse(get(K.favorites,'[]')); return new Set(Array.isArray(a)?a.map(x=>String(x).toUpperCase()):[]); } catch { return new Set(); }
  }
  function saveFavoriteStocks(setv) { set(K.favorites,JSON.stringify([...setv].sort())); }
  function toggleFavorite(sym) { const f=favoriteStocks(); sym=String(sym||'').toUpperCase(); f.has(sym)?f.delete(sym):f.add(sym); saveFavoriteStocks(f); enhanceStockRows(); refreshInlinePanel(); }
  function nearBenefitInfo(sym) {
    const m=stockRowMetrics(sym); if(!m||!m.tier?.next) return null;
    const start=Math.max(0,Number(m.tier.keep)||0), span=Math.max(1,Number(m.tier.next)-start);
    const pct=Math.max(0,Math.min(100,((m.owned-start)/span)*100));
    const threshold=Math.max(50,Math.min(99.9,Number(get(K.nearBenefitPct,'90'))||90));
    return {pct,near:pct>=threshold && pct<100,threshold,gap:m.nextGap};
  }
  function safetySnapshot() {
    const target=get(K.target).toUpperCase();
    return {dryRun:isDryRun(),benefitLock:bool(K.benefitLock,true),targetLock:bool(K.targetLock,false),target,panicFallback:get(K.panicFallback).toUpperCase(),tradeBusy:!!S.tradeBusy,api:!!get(K.api).trim()};
  }
  function exportStockManagerData() {
    const keys=Object.values(K), data={version:APP.version,exportedAt:new Date().toISOString(),settings:{}};
    keys.forEach(k=>{const v=get(k,null); if(v!==null && k!==K.api) data.settings[k]=v;});
    data.actionLog=loadActionLog();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=`SakaLuX-Stock-Manager-${APP.version}-backup.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }
  function importStockManagerData(file) {
    if(!file) return;
    const r=new FileReader(); r.onload=()=>{try{const d=JSON.parse(String(r.result||'{}')); for(const [k,v] of Object.entries(d.settings||{})){if(Object.values(K).includes(k)&&k!==K.api)set(k,v);} if(Array.isArray(d.actionLog))set(K.actionLog,JSON.stringify(d.actionLog.slice(0,100))); inlineStatus('Settings/history imported. Reloading…','ok'); setTimeout(()=>location.reload(),500);}catch(e){inlineStatus(`Import failed: ${e.message}`,'bad');}}; r.readAsText(file);
  }
  function diagnosticsText() {
    const x=safetySnapshot(), rows=[...S.stocks.values()].filter(v=>v?.row?.isConnected).length;
    return `v${APP.version} · API ${x.api?'ON':'OFF'} · DryRun ${x.dryRun?'ON':'OFF'} · BenefitLock ${x.benefitLock?'ON':'OFF'} · TargetLock ${x.targetLock?'ON':'OFF'} · Target ${x.target||'none'} · Stocks ${S.stocks.size} · DOM rows ${rows} · Positions ${Object.keys(S.portfolio||{}).length}`;
  }

  function favoriteTargets() {
    try { const a=JSON.parse(get(K.targetFavorites,'[]')); return Array.isArray(a)?[...new Set(a.map(x=>String(x).toUpperCase()).filter(Boolean))]:[]; } catch { return []; }
  }
  function saveFavoriteTargets(a) { set(K.targetFavorites,JSON.stringify([...new Set(a)].sort())); }
  function toggleFavoriteTarget(sym) {
    sym=String(sym||get(K.target)||'').toUpperCase(); if(!sym) return;
    const a=favoriteTargets(), i=a.indexOf(sym); i>=0?a.splice(i,1):a.push(sym); saveFavoriteTargets(a); refreshRoadmapControls();
  }
  function setTargetSafely(sym) {
    sym=String(sym||'').toUpperCase(); if(!sym) return false;
    const current=get(K.target).toUpperCase();
    if(bool(K.targetLock,false) && current && current!==sym){ inlineStatus(`Target Lock is ON · unlock before changing ${current} → ${sym}.`,'warn'); return false; }
    set(K.target,sym); refreshTargetSelect(); refreshInlinePanel(); enhanceStockRows(); return true;
  }
  function loadTransactionHistory() {
    try { const a=JSON.parse(get(K.txHistory,'[]')); return Array.isArray(a)?a:[]; } catch { return []; }
  }
  function addTransactionHistory(entry) {
    const step=String(entry?.step||''); if(!/buyShares|sellShares/i.test(step)) return;
    const rows=loadTransactionHistory(); rows.unshift({time:Date.now(),...entry}); set(K.txHistory,JSON.stringify(rows.slice(0,200)));
  }
  function renderTransactionHistory() {
    const box=$('#slx-stock-tx-history'); if(!box) return;
    const q=String($('#slx-tx-search')?.value||'').trim().toLowerCase(), filter=$('#slx-tx-filter')?.value||'all';
    let rows=loadTransactionHistory();
    if(filter!=='all') rows=rows.filter(r=>filter==='buy'?r.step==='buyShares':r.step==='sellShares');
    if(q) rows=rows.filter(r=>`${r.sym||''} ${r.message||''} ${r.status||''}`.toLowerCase().includes(q));
    if(!rows.length){box.innerHTML='<div class="muted">No matching transactions yet.</div>';return;}
    box.innerHTML=rows.slice(0,100).map(r=>`<div class="action-row"><span>${new Date(r.time||0).toLocaleString()}</span><b>${r.step==='buyShares'?'BUY':'SELL'} ${esc(r.sym||'')}</b><span>${Number(r.shares||0).toLocaleString()} sh · ${money(Number(r.estimate||0))}</span><small>${esc(r.status||'')} · ${esc(r.message||'')}</small></div>`).join('');
    const qs=$('#slx-tx-search'), fs=$('#slx-tx-filter'); if(qs&&!qs.dataset.bound){qs.dataset.bound='1';qs.oninput=renderTransactionHistory;} if(fs&&!fs.dataset.bound){fs.dataset.bound='1';fs.onchange=renderTransactionHistory;}
  }
  function refreshRoadmapControls() {
    const card=$('#slx-stock-inline'); if(!card) return;
    const sel=$('#slx-target-favorites',card), cur=get(K.target).toUpperCase(), favs=favoriteTargets();
    if(sel){sel.innerHTML='<option value="">Favorite targets…</option>'+favs.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''); if(favs.includes(cur)) sel.value=cur;}
    const t=$('#slx-target-fav-toggle',card); if(t) t.textContent=favs.includes(cur)?'★ Target':'☆ Target';
    const near=$('#slx-near-pct',card); if(near) near.value=String(Math.max(50,Math.min(99.9,Number(get(K.nearBenefitPct,'90'))||90)));
    const cash=$('#slx-cash-target',card); if(cash) cash.value=get(K.cashTarget,'0');
  }
  async function sellToCashTarget() {
    const targetCash=parseAmount(get(K.cashTarget,'0')), cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    if(targetCash<=0) throw new Error('Set a Cash Target first.');
    if(cash>=targetCash){inlineStatus(`Cash target already reached: ${money(cash)}.`,'ok');return;}
    const sym=get(K.target).toUpperCase(); if(!sym) throw new Error('Select a target stock to sell from.');
    await ensureStock(sym); const m=stockRowMetrics(sym); if(!m?.owned||!m.price) throw new Error(`No sellable ${sym} position detected.`);
    const protectedShares=bool(K.benefitLock,true)?Math.max(0,Number(m.tier?.keep)||0):0, sellable=Math.max(0,m.owned-protectedShares);
    const need=targetCash-cash, shares=Math.min(sellable,Math.ceil(need/m.price));
    if(shares<=0) throw new Error('Benefit Lock leaves no sellable shares for this cash target.');
    const estimate=shares*m.price;
    if(!confirm(`Sell to Cash Target\n\nSELL ${shares.toLocaleString()} ${sym}\nEstimated proceeds: ${money(estimate)}\nCash target: ${money(targetCash)}\nProtected shares kept: ${protectedShares.toLocaleString()}\n\nContinue?`)) return;
    await postTrade(sym,shares,'sellShares'); if(get(K.api).trim()) await apiSync(); refreshInlinePanel(); renderTransactionHistory();
  }
  function buildExecutableRebalancePlan() {
    const x=buildRebalancePreview();
    if(!x?.target) return null;
    const sources=(x.sells||[]).filter(r=>Number.isFinite(Number(r.shares))&&Number(r.shares)>0&&Number.isFinite(Number(r.proceeds))&&Number(r.proceeds)>0)
      .map(r=>({sym:String(r.sym||'').toUpperCase(),shares:Math.floor(Number(r.shares)),value:Number(r.proceeds),price:Number(r.price)||0}));
    return {target:x.target,cash:x.cash,need:x.required||0,sources,shortfall:Number(x.shortfall)||0,reserve:x.reserve||0};
  }

  function rebalanceConfirmText(plan) {
    const sellTotal=plan.sources.reduce((n,x)=>n+Number(x.value||0),0);
    const sells=plan.sources.length?plan.sources.map(x=>`SELL ${x.shares.toLocaleString()} ${x.sym} ≈ ${money(x.value)}`).join('\n'):'No SELL required · current cash is enough';
    const projectedCash=Math.max(0,Number(plan.cash||0)+sellTotal);
    return `Guided Rebalance\n\nSELL PHASE\n${sells}\n\nTotal estimated sale: ${money(sellTotal)}\nCash before: ${money(plan.cash||0)}\nCash after SELL: ≈ ${money(projectedCash)}\nReserve kept: ${money(plan.reserve||0)}\n\nBUY PHASE\nBUY ${Math.floor(Number(plan.target.sharesNeeded)||0).toLocaleString()} ${plan.target.sym} ≈ ${money(plan.target.cost)}\nTarget Tier ${plan.target.tier}\n\nBenefit floors are preserved. Continue with SELL phase?`;
  }

  async function executeGuidedRebalance() {
    const plan=buildExecutableRebalancePlan(); if(!plan) throw new Error('No ROI rebalance candidate available.');
    if(plan.shortfall>0) throw new Error(`Rebalance still needs ${money(plan.shortfall)} after all valid free/excess shares.`);
    if(!confirm(rebalanceConfirmText(plan))) return;
    for(const x of plan.sources){
      if(!Number.isFinite(x.shares)||x.shares<=0) throw new Error(`Invalid SELL amount detected for ${x.sym}; rebalance stopped.`);
      await postTrade(x.sym,x.shares,'sellShares');
      if(!isDryRun()) await new Promise(r=>setTimeout(r,1650));
    }
    if(get(K.api).trim()&&!isDryRun()) await apiSync();
    const buyShares=Math.floor(Number(plan.target.sharesNeeded)||0);
    if(!Number.isFinite(buyShares)||buyShares<=0) throw new Error('Invalid BUY share amount; rebalance stopped before BUY.');
    if(!confirm(`SELL phase complete${isDryRun()?' (Dry Run)':''}.\n\nProceed with BUY ${buyShares.toLocaleString()} ${plan.target.sym} toward Tier ${plan.target.tier} for about ${money(plan.target.cost)}?`)){inlineStatus('Rebalance stopped before BUY phase.','warn');return;}
    if(!isDryRun() && tradeCooldownRemaining()>0) await new Promise(r=>setTimeout(r,Math.max(1650,tradeCooldownRemaining()+100)));
    await postTrade(plan.target.sym,buyShares,'buyShares'); if(get(K.api).trim()&&!isDryRun()) await apiSync(); refreshInlinePanel(); renderTransactionHistory(); inlineStatus(`Guided rebalance finished for ${plan.target.sym}.`,'ok');
  }

  function stockViewScore(sym, mode) {
    const m=stockRowMetrics(sym);
    if(!m) return 0;
    const candidate=buildRoiCandidates().find(x=>x.sym===sym);
    if(mode==='owned') return m.owned||0;
    if(mode==='roi') return candidate?.roi||0;
    if(mode==='benefit') return m.nextGap>0 ? 1/Math.max(1,m.nextGap) : 0;
    if(mode==='pl') return m.pl===null ? -Infinity : m.pl;
    if(mode==='loss') return m.pl===null ? Infinity : m.pl;
    if(mode==='excess') return m.freeShares||0;
    if(mode==='value') return m.value||0;
    return 0;
  }

  function stockPassesFilter(sym, filter) {
    const m=stockRowMetrics(sym);
    if(!m) return false;
    if(filter==='owned') return m.owned>0;
    if(filter==='loss') return m.pl!==null && m.pl<0;
    if(filter==='profit') return m.pl!==null && m.pl>0;
    if(filter==='excess') return m.freeShares>0;
    if(filter==='benefit') return m.nextGap>0;
    if(filter==='favorites') return favoriteStocks().has(sym);
    const q=get(K.rowSearch,'').trim().toUpperCase();
    if(q && !String(sym).toUpperCase().includes(q)) return false;
    return true;
  }

  function applyStockView() {
    if(!isStocks()) return;
    scanStocks();
    const sort=get(K.stockSort,'default');
    const filter=get(K.stockFilter,'all');
    const byParent=new Map();
    for(const [sym,st] of S.stocks) {
      const row=st?.row;
      if(!row?.isConnected || !row.parentElement) continue;
      if(!byParent.has(row.parentElement)) byParent.set(row.parentElement,[]);
      byParent.get(row.parentElement).push({sym,row,score:stockViewScore(sym,sort)});
      row.style.display=stockPassesFilter(sym,filter)?'':'none';
      row.dataset.slxViewVisible=row.style.display==='none'?'0':'1';
    }
    if(sort==='default') return;
    for(const [parent,items] of byParent) {
      const visible=items.filter(x=>x.row.style.display!=='none');
      const hidden=items.filter(x=>x.row.style.display==='none');
      visible.sort((a,b)=> sort==='loss' ? a.score-b.score : b.score-a.score || a.sym.localeCompare(b.sym));
      const ordered=[...visible,...hidden];
      if(ordered.length<2) continue;
      const marker=document.createComment('slx-stock-sort');
      parent.insertBefore(marker,ordered[0].row);
      const frag=document.createDocumentFragment();
      ordered.forEach(x=>frag.appendChild(x.row));
      marker.parentNode.insertBefore(frag,marker.nextSibling);
      marker.remove();
    }
  }

  function opportunityRanks() {
    const roi=buildRoiCandidates();
    const map=new Map();
    roi.slice(0,3).forEach((r,i)=>map.set(r.sym,{rank:i+1,roi:r.roi}));
    return map;
  }

  function refreshStockViewControls() {
    const sort=$('#slx-stock-sort'); if(sort) sort.value=get(K.stockSort,'default');
    const filter=$('#slx-stock-filter'); if(filter) filter.value=get(K.stockFilter,'all');
  }

  function enhanceStockRows() {
    if(!isStocks()) return;
    scanStocks();
    for(const [sym,st] of S.stocks) {
      const row=st?.row;
      if(!row?.isConnected) continue;
      const old=$('.slx-stock-row-tools',row);
      const m=stockRowMetrics(sym);
      if(!m) continue;
      const li=old||document.createElement('li');
      li.className='slx-stock-row-tools';
      li.dataset.sym=sym;
      const tierLabel=m.tier.tier?`Tier ${m.tier.tier}`:'No tier';
      const nextText=m.nextGap?`${m.nextGap.toLocaleString()} to next`:'No next gap';
      const plText=m.pl===null?'P/L n/a':`${m.pl>=0?'+':'-'}${money(Math.abs(m.pl))}${m.plPct===null?'':` (${m.plPct>=0?'+':''}${m.plPct.toFixed(2)}%)`}`;
      const progress=stockRowBenefitProgress(sym,m.owned);
      const opp=opportunityRanks().get(sym);
      const fav=favoriteStocks().has(sym);
      const near=nearBenefitInfo(sym);
      const quickOptions=stockRowQuickOptions().map(v=>`<option value="${esc(v)}">${esc(String(v).toUpperCase())}</option>`).join('');
      li.innerHTML=`<div class="slx-row-stock"><b>${esc(sym)}${opp?` <em class=\"slx-opp-badge\">#${opp.rank} ROI</em>`:''}</b><span>${money(m.price)}</span>${opp?`<small class=\"slx-opp-roi\">${opp.roi.toFixed(2)}% APR</small>`:''}</div><div class="slx-row-stat"><small>Owned</small><b>${m.owned.toLocaleString()}</b><span>${money(m.value)}</span></div><div class="slx-row-stat"><small>Avg buy</small><b>${m.avg?money(m.avg):'n/a'}</b><span class="${m.pl===null?'muted':m.pl>=0?'good':'bad'}">${plText}</span></div><div class="slx-row-stat"><small>Benefit</small><b>${tierLabel}</b><span>${nextText}</span><div class="slx-row-progress"><i style="width:${progress.pct.toFixed(2)}%"></i></div><small class="slx-row-progress-label">${esc(progress.label)}${near?.near?` · ⚡ ${near.gap.toLocaleString()} left`:''}</small></div><div class="slx-row-actions"><button type="button" class="slx-fav" data-row-fav="${sym}" title="Favorite">${fav?'★':'☆'}</button><button type="button" data-row-target="${sym}" ${bool(K.targetLock,false)&&get(K.target).toUpperCase()!==sym?'disabled':''}>Target</button><button type="button" class="primary" data-row-buy="${sym}" ${m.nextGap?'':'disabled'}>Buy gap</button><button type="button" class="danger" data-row-sell="${sym}" ${m.freeShares?'':'disabled'}>Sell excess</button></div><div class="slx-row-quick"><select data-row-quick-amount="${sym}" title="Quick trade amount">${quickOptions}</select><button type="button" class="primary" data-row-quick-buy="${sym}">BUY</button><button type="button" class="danger" data-row-quick-sell="${sym}" ${m.owned?'':'disabled'}>SELL</button></div>`;
      if(!old) row.appendChild(li);
      const fb=$('[data-row-fav]',li); if(fb) fb.onclick=e=>{e.preventDefault();e.stopPropagation();toggleFavorite(sym);};
      $('[data-row-target]',li).onclick=e=>{e.preventDefault();e.stopPropagation();set(K.target,sym);refreshTargetSelect();refreshInlinePanel();enhanceStockRows();inlineStatus(`${sym} selected as target.`,'ok');};
      $('[data-row-buy]',li).onclick=e=>{e.preventDefault();e.stopPropagation();stockRowBuyGap(sym);};
      $('[data-row-sell]',li).onclick=e=>{e.preventDefault();e.stopPropagation();stockRowSellExcess(sym);};
      const qbuy=$('[data-row-quick-buy]',li); if(qbuy) qbuy.onclick=()=>stockRowQuickTrade(sym,'buy',$('[data-row-quick-amount]',li)?.value||'max');
      const qsell=$('[data-row-quick-sell]',li); if(qsell) qsell.onclick=()=>stockRowQuickTrade(sym,'sell',$('[data-row-quick-amount]',li)?.value||'max');
      li.dataset.target=get(K.target).toUpperCase()===sym?'1':'0';
      li.dataset.opportunity=opp?String(opp.rank):'';
    }
    applyStockView();
  }

  function loadActionLog() {
    try { const v=JSON.parse(get(K.actionLog,'[]')); return Array.isArray(v)?v:[]; } catch { return []; }
  }

  function addActionLog(entry) {
    const rows=loadActionLog();
    rows.unshift({time:Date.now(),...entry});
    set(K.actionLog,JSON.stringify(rows.slice(0,40)));
    addTransactionHistory(entry);
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
    const dry=isDryRun();
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

  function buildOptimizerRows() {
    scanStocks();
    const minApr=Math.max(0,Number(get(K.optimizerMinApr,'0'))||0);
    const bankApr=Math.max(0,Number(get(K.bankApr,'0'))||0);
    const rows=[];
    for(const [sym,st] of S.stocks) {
      const owned=ownedShares(sym);
      if(!owned || !st?.price) continue;
      const tier=benefitTier(sym,owned);
      const protectedShares=bool(K.benefitLock,true)?tier.keep:0;
      const freeShares=Math.max(0,owned-protectedShares);
      const protectedValue=protectedShares*st.price;
      const freeValue=freeShares*st.price;
      const daily=benefitDailyValue(sym);
      const currentApr=protectedValue>0&&daily>0?(daily*365/protectedValue)*100:0;
      const next=tier.next||0;
      const nextGap=next>owned?next-owned:0;
      const nextCost=nextGap*st.price;
      let signal='hold';
      if(freeShares>0) signal='excess';
      if(currentApr>0 && currentApr<Math.max(minApr,bankApr)) signal='weak';
      rows.push({sym,owned,price:Number(st.price)||0,tier:tier.tier,protectedShares,freeShares,protectedValue,freeValue,currentApr,nextGap,nextCost,signal,bankApr,minApr});
    }
    return rows.sort((a,b)=>({weak:0,excess:1,hold:2}[a.signal]-{weak:0,excess:1,hold:2}[b.signal]) || b.freeValue-a.freeValue || b.currentApr-a.currentApr);
  }

  function safeRender(name, fn) {
    try { fn(); return true; }
    catch(e) {
      console.error(`[${APP.name}] ${name} render failed`, e);
      status(`${name} render error: ${e.message}`,'bad');
      return false;
    }
  }

  function buildRebalancePreview() {
    const held=buildOptimizerRows();
    const candidates=buildRoiCandidates().filter(r=>Number.isFinite(Number(r.cost))&&Number(r.cost)>0&&Number.isFinite(Number(r.sharesNeeded))&&Number(r.sharesNeeded)>0);
    const reserve=Math.max(0,parseAmount(get(K.rebalanceReserve,'0')));
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    const validSource=r=>Number.isFinite(Number(r?.price))&&Number(r.price)>0&&Number.isFinite(Number(r?.freeShares))&&Number(r.freeShares)>0&&Number.isFinite(Number(r?.freeValue))&&Number(r.freeValue)>0;
    const freeRows=held.filter(validSource).sort((a,b)=>Number(b.freeValue)-Number(a.freeValue));
    const weakRows=held.filter(r=>r.signal==='weak'&&validSource(r)).sort((a,b)=>Number(a.currentApr||0)-Number(b.currentApr||0));
    const sources=[...freeRows,...weakRows.filter(w=>!freeRows.some(f=>f.sym===w.sym))];
    const sourceCapital=sources.reduce((n,r)=>n+Number(r.freeValue||0),0);
    const deployable=Math.max(0,cash+sourceCapital-reserve);
    const target=candidates.find(r=>Number(r.cost)<=deployable) || candidates[0] || null;
    if(!target) return {cash,reserve,sourceCapital,deployable,sources,target:null,sells:[],shortfall:0};
    const required=Math.max(0,Number(target.cost)-cash+reserve);
    let need=required;
    const sells=[];
    for(const r of sources) {
      if(need<=0) break;
      const price=Number(r.price), freeShares=Math.floor(Number(r.freeShares));
      if(!Number.isFinite(price)||price<=0||!Number.isFinite(freeShares)||freeShares<=0) continue;
      const value=Math.min(Number(r.freeValue)||0,need);
      const shares=Math.min(freeShares,Math.ceil(value/price));
      if(!Number.isFinite(shares)||shares<=0) continue;
      const proceeds=shares*price;
      if(!Number.isFinite(proceeds)||proceeds<=0) continue;
      sells.push({sym:r.sym,shares,proceeds,currentApr:Number(r.currentApr)||0,price});
      need=Math.max(0,need-proceeds);
    }
    const funded=Math.max(0,Number(target.cost)-Math.max(0,need));
    return {cash,reserve,sourceCapital,deployable,sources,target,required,sells,shortfall:Math.max(0,need),funded};
  }

  function renderRebalancePreview() {
    const box=$('#slx-stock-rebalance-body'); if(!box) return;
    const x=buildRebalancePreview();
    if(!x.target){box.innerHTML='<div class="muted">No ROI candidate available yet. Sync API and benefit values first.</div>';return;}
    const sellHtml=x.sells.length?x.sells.map(r=>`<div class="rebalance-row"><b>SELL ${r.sym}</b><span>${r.shares.toLocaleString()} shares</span><span>≈ ${money(r.proceeds)}</span><small>${r.currentApr?r.currentApr.toFixed(2)+'% current APR':'ROI n/a'}</small></div>`).join(''):'<div class="muted">No stock sale is needed; current cash can fund the selected opportunity.</div>';
    const before=x.sells.reduce((n,r)=>n+r.currentApr*(r.proceeds||0),0);
    const moved=x.sells.reduce((n,r)=>n+r.proceeds,0);
    const sourceWeighted=moved>0?before/moved:0;
    const delta=x.target.roi-sourceWeighted;
    box.innerHTML=`<div class="rebalance-summary"><div><span>Available cash</span><b>${money(x.cash)}</b></div><div><span>Potential releases</span><b>${money(x.sourceCapital)}</b></div><div><span>Reserve</span><b>${money(x.reserve)}</b></div><div><span>Deployable</span><b>${money(x.deployable)}</b></div></div><div class="rebalance-target"><b>Target: ${x.target.sym} · Tier ${x.target.tier}</b><span>${x.target.sharesNeeded.toLocaleString()} shares · ${money(x.target.cost)} · ${x.target.roi.toFixed(2)}% APR</span><small>${Math.round(x.target.paybackDays).toLocaleString()}d payback${moved>0?` · estimated ROI shift ${delta>=0?'+':''}${delta.toFixed(2)}pp`:''}</small></div><div class="rebalance-list">${sellHtml}</div>${x.shortfall>0?`<div class="bad">Still missing ${money(x.shortfall)} after available free/excess capital.</div>`:'<div class="good">Preview fully funded. No trades executed.</div>'}`;
  }

  function renderOptimizer() {
    const box=$('#slx-stock-optimizer-body'); if(!box) return;
    const held=buildOptimizerRows();
    const candidates=buildRoiCandidates();
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    const freeCapital=held.reduce((n,r)=>n+r.freeValue,0);
    const protectedCapital=held.reduce((n,r)=>n+r.protectedValue,0);
    const weakCapital=held.filter(r=>r.signal==='weak').reduce((n,r)=>n+r.protectedValue,0);
    const bankApr=Math.max(0,Number(get(K.bankApr,'0'))||0);
    const best=candidates[0]||null;
    const affordable=candidates.find(r=>r.affordable)||null;
    const summary=`<div class="optimizer-summary"><div><span>Protected capital</span><b>${money(protectedCapital)}</b></div><div><span>Free / excess</span><b>${money(freeCapital)}</b></div><div><span>Weak capital</span><b>${money(weakCapital)}</b></div><div><span>Cash</span><b>${money(cash)}</b></div></div>`;
    const picks=(best?`<div class="optimizer-pick"><b>Best ROI: ${best.sym} · Tier ${best.tier}</b><span>${best.roi.toFixed(2)}% APR · ${Math.round(best.paybackDays).toLocaleString()}d payback · gap ${money(best.cost)}</span>${bankApr?`<small>${best.bankDelta>=0?'+':''}${best.bankDelta.toFixed(2)}pp vs bank</small>`:''}</div>`:'')+(affordable?`<div class="optimizer-pick"><b>Best affordable: ${affordable.sym}</b><span>${affordable.roi.toFixed(2)}% APR · gap ${money(affordable.cost)}</span></div>`:'');
    const rows=held.length?held.map(r=>`<div class="optimizer-row"><div><b>${r.sym}</b><small>Tier ${r.tier||0}</small></div><div><span>${r.protectedShares.toLocaleString()} protected</span><small>${money(r.protectedValue)}</small></div><div><span>${r.freeShares.toLocaleString()} free</span><small>${money(r.freeValue)}</small></div><div><span>${r.currentApr?r.currentApr.toFixed(2)+'% APR':'ROI n/a'}</span><small>${bankApr?`${(r.currentApr-bankApr).toFixed(2)}pp vs bank`:'set bank APR'}</small></div><div><span>${r.nextGap?money(r.nextCost)+' to next':'no next tier'}</span><small class="${r.signal==='weak'?'bad':r.signal==='excess'?'warn':'good'}">${r.signal==='weak'?'Below threshold':r.signal==='excess'?'Excess shares':'Protected'}</small></div></div>`).join(''):'<div class="muted">No held-stock optimizer data yet. Sync API first.</div>';
    box.innerHTML=summary+picks+`<div class="optimizer-list">${rows}</div>`;
  }

  function renderAdvisor() {
    const box=$('#slx-stock-advisor-body'); if(!box) return;
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="muted">Sync API and load benefit values. Only benefits with a known cash-equivalent value are ranked.</div>';return;}
    box.innerHTML=rows.slice(0,10).map((r,index)=>`<div class="roi-row"><b>#${index+1} ${r.sym}</b><span>Tier ${r.tier}</span><span>${r.roi.toFixed(2)}% APR</span><span>${Math.round(r.paybackDays).toLocaleString()}d payback</span><span>${money(r.cost)} gap</span><span>${money(r.daily)}/day</span><span class="${r.bankApr?(r.beatsBank?'good':'bad'):'muted'}">${r.bankApr?`${r.bankDelta>=0?'+':''}${r.bankDelta.toFixed(2)}pp vs bank`:'Bank APR n/a'}</span><span class="${r.affordable?'good':'muted'}">${r.affordable?'Affordable':'Missing '+money(Math.max(0,r.cost-r.cash))}</span></div>`).join('');
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
      if(get(K.api).trim() && !isDryRun()) syncAllApi().catch(()=>{});
    } catch(e) {
      set(K.panicPending,'0');
      status(`PANIC failed: ${e.message}`,'bad');
      openPanel();
    }
  }

  function inlineStockHost() {
    const firstStock=$("ul[class^='stock_'], ul[id^='stock_']");
    if(firstStock?.parentElement) return {host:firstStock.parentElement,before:firstStock};
    const host=$('#mainContainer .content-wrapper') || $('.content-wrapper') || $('#mainContainer') || $('main') || document.body;
    return {host,before:null};
  }

  function buildPortfolioRows() {
    scanStocks();
    const rows=[];
    for(const [sym,st] of S.stocks) {
      const owned=Math.max(0,Math.floor(Number(ownedShares(sym))||0));
      const price=Number(st?.price)||0;
      if(owned<=0 || price<=0) continue;
      const avg=Number(averageBuy(sym))||0;
      const value=owned*price;
      const cost=avg>0 ? owned*avg : null;
      const pl=cost===null ? null : value-cost;
      const tier=benefitTier(sym,owned);
      const locked=bool(K.benefitLock,true)?Math.max(0,Number(tier.keep)||0):0;
      rows.push({sym,owned,price,avg,value,cost,pl,tier:tier.tier||0,locked});
    }
    return rows.sort((a,b)=>b.value-a.value || a.sym.localeCompare(b.sym));
  }

  function inlineTotals() {
    const rows=buildPortfolioRows();
    const marketValue=rows.reduce((n,r)=>n+r.value,0);
    const knownRows=rows.filter(r=>r.cost!==null && Number.isFinite(r.cost));
    const invested=knownRows.reduce((n,r)=>n+r.cost,0);
    const knownValue=knownRows.reduce((n,r)=>n+r.value,0);
    const pl=knownValue-invested;
    const plPct=invested>0?(pl/invested)*100:0;
    const coverage=rows.length?Math.round((knownRows.length/rows.length)*100):0;
    return {marketValue,invested,pl,plPct,coverage,cash:Number(S.money)||currentMoneyFromDom()||0,positions:rows.length,known:knownRows.length};
  }

  function inlinePresetValues() {
    const raw=get(K.inlinePresets,'50k,250k,1m,5m,10m,25m');
    const vals=String(raw).split(/[;,\s]+/).map(v=>v.trim()).filter(Boolean).slice(0,10);
    return vals.length?vals:['50k','250k','1m','5m','10m','25m'];
  }

  function inlineButtonPrefs() {
    const defaults={advisor:true,trade:true,rebalance:true,panic:true,full:true};
    try { return {...defaults,...JSON.parse(get(K.inlineButtons,'{}'))}; } catch { return defaults; }
  }

  function saveInlineButtonPrefs(next) { set(K.inlineButtons,JSON.stringify({...inlineButtonPrefs(),...next})); }

  function renderInlinePresetButtons(card=$('#slx-stock-inline')) {
    const box=$('#slx-inline-presets',card||document); if(!box) return;
    box.innerHTML=inlinePresetValues().map(v=>`<button type="button" data-slx-preset="${esc(v)}">${esc(v.toUpperCase())}</button>`).join('');
    $$('[data-slx-preset]',box).forEach(b=>b.onclick=()=>{const v=b.dataset.slxPreset;const input=$('#slx-inline-withdraw-value',card);if(input)input.value=v;set(K.withdraw,v);inlineStatus(`Withdraw preset: ${v.toUpperCase()}`,'ok');});
  }

  function applyInlineButtonPrefs(card=$('#slx-stock-inline')) {
    if(!card) return;
    const pref=inlineButtonPrefs();
    const map={advisor:'[data-slx-inline-tab="advisor"]',trade:'[data-slx-inline-tab="trade"]',rebalance:'[data-slx-inline-tab="rebalance"]',panic:'#slx-inline-panic',full:'#slx-inline-full'};
    Object.entries(map).forEach(([k,sel])=>{const el=$(sel,card);if(el)el.hidden=!pref[k];});
  }

  function openPanelAt(selector) {
    openPanel();
    setTimeout(()=>{
      const node=$(selector,S.panel||document);
      const section=node?.closest?.('.section')||node;
      section?.scrollIntoView?.({behavior:'smooth',block:'start'});
    },40);
  }

  function mountInlinePanel() {
    if(!isStocks()) { $('#slx-stock-inline')?.remove(); return null; }
    if($('#slx-stock-inline')) { refreshInlinePanel(); return $('#slx-stock-inline'); }
    const {host,before}=inlineStockHost();
    if(!host) return null;
    const card=document.createElement('section');
    card.id='slx-stock-inline';
    card.dataset.collapsed=bool(K.inlineCollapsed,false)?'1':'0';
    card.innerHTML=`<div class="slx-inline-head"><div><b>📊 SakaLuX Stock Manager</b><small>v${APP.version} · EXPERIMENTAL</small></div><div class="slx-inline-head-actions"><button id="slx-inline-refresh" type="button" title="Refresh Stock Manager">↻</button><button id="slx-inline-api" type="button">API</button><button id="slx-inline-settings" type="button" title="Inline settings">⚙</button><button id="slx-inline-full" type="button">Full</button><button id="slx-inline-toggle" type="button">${card.dataset.collapsed==='1'?'＋':'−'}</button></div></div>
      <div class="slx-inline-body">
        <div class="slx-inline-summary"><div><span>Total invested <small id="slx-inline-coverage"></small></span><b id="slx-inline-total">—</b></div><div><span>Market value</span><b id="slx-inline-market">—</b></div><div><span>Unrealized P/L</span><b id="slx-inline-pl">—</b><small id="slx-inline-pl-pct"></small></div><div><span>Cash</span><b id="slx-inline-cash">—</b></div></div>
        <div class="slx-inline-nav"><button data-slx-inline-tab="advisor" type="button">★ Advisor</button><button data-slx-inline-tab="trade" type="button">📈 Trade Assistant</button><button data-slx-inline-tab="rebalance" type="button">⚖ Rebalance Preview</button><button id="slx-exec-rebalance" class="primary" type="button">⚡ Execute Rebalance</button></div>
        <div id="slx-inline-advanced" class="slx-inline-advanced"><div class="slx-stock-view-controls"><label>Sort<select id="slx-stock-sort"><option value="default">Torn default</option><option value="owned">Owned shares</option><option value="value">Position value</option><option value="roi">Best ROI</option><option value="benefit">Closest benefit</option><option value="pl">Biggest P/L</option><option value="loss">Biggest loss</option><option value="excess">Excess shares</option></select></label><label>Filter<select id="slx-stock-filter"><option value="all">All stocks</option><option value="owned">Owned only</option><option value="profit">Profit only</option><option value="loss">Loss only</option><option value="excess">Excess shares</option><option value="benefit">Has next benefit</option><option value="favorites">Favorites only</option></select></label><button id="slx-stock-view-reset" type="button">Reset</button></div><div class="slx-v070-toolbar"><input id="slx-stock-search" type="search" placeholder="Search stock…"><button id="slx-favorites-only" type="button">★ Favorites</button><label><input id="slx-target-lock" type="checkbox"> Target lock</label><button id="slx-diagnostics" type="button">Diagnostics</button><button id="slx-export" type="button">Export</button><button id="slx-import" type="button">Import</button><input id="slx-import-file" type="file" accept="application/json" hidden><button id="slx-target-fav-toggle" type="button">☆ Target</button><select id="slx-target-favorites"><option value="">Favorite targets…</option></select><label>Near % <input id="slx-near-pct" inputmode="decimal" value="90" style="width:55px"></label><label>Cash target <input id="slx-cash-target" value="0" placeholder="e.g. 50m" style="width:85px"></label><button id="slx-sell-cash-target" type="button">Sell → Cash</button><button id="slx-history-open" type="button">History</button></div><div id="slx-diagnostic-line" class="slx-inline-note"></div></div>
        <div id="slx-inline-workspace" class="slx-inline-workspace" data-open="0"></div>
        <div class="slx-inline-target"><label>Target <select id="slx-inline-target"><option value="">Loading…</option></select></label><div><span>Owned</span><b id="slx-inline-owned">—</b></div></div>
        <div class="slx-inline-actions"><button id="slx-inline-vault-max" class="primary" type="button">Vault Max</button><button id="slx-inline-withdraw-all" class="danger" type="button">Withdraw All</button><button id="slx-inline-vault-keep" type="button">Vault Keep</button><label><input id="slx-inline-keep" value="${esc(get(K.keep,'0'))}" placeholder="Keep cash"></label><button id="slx-inline-withdraw" class="danger" type="button">Withdraw</button><label><input id="slx-inline-withdraw-value" value="${esc(get(K.withdraw,'1m'))}" placeholder="Withdraw amount"></label></div>
        <div class="slx-inline-options"><label><input id="slx-inline-api-mode" type="checkbox"> API Mode</label><label><input id="slx-inline-benefit-lock" type="checkbox"> Lock Benefits</label><label><input id="slx-inline-dry" type="checkbox"> Dry Run</label><button id="slx-inline-compact" type="button">Compact</button></div>
        <div id="slx-inline-presets" class="slx-inline-presets"></div>
        <div id="slx-inline-config" class="slx-inline-config" hidden><label>Withdrawal presets <input id="slx-inline-preset-input" value="${esc(get(K.inlinePresets,'50k,250k,1m,5m,10m,25m'))}" placeholder="50k,250k,1m,5m,10m,25m"></label><div class="slx-inline-config-actions"><button id="slx-inline-save-presets" type="button">Save presets</button><label><input data-inline-button="advisor" type="checkbox"> Advisor</label><label><input data-inline-button="trade" type="checkbox"> Trade</label><label><input data-inline-button="rebalance" type="checkbox"> Rebalance</label><label><input data-inline-button="panic" type="checkbox"> PANIC</label><label><input data-inline-button="full" type="checkbox"> Full</label></div></div>
        <div id="slx-inline-status" class="slx-inline-note">Ready.</div>
      </div>`;
    if(before) host.insertBefore(card,before); else host.prepend(card);
    const advanced=$('#slx-inline-advanced',card), configBox=$('#slx-inline-config',card); if(advanced&&configBox) configBox.after(advanced);

    $('#slx-inline-toggle',card).onclick=()=>{const closed=card.dataset.collapsed!=='1';card.dataset.collapsed=closed?'1':'0';set(K.inlineCollapsed,closed?'1':'0');$('#slx-inline-toggle',card).textContent=closed?'＋':'−';};
    $('#slx-inline-full',card).onclick=openPanel;
    $('#slx-inline-api',card).onclick=()=>openPanelAt('#slx-stock-api');
    $('#slx-inline-refresh',card).onclick=async()=>{try{inlineStatus('Refreshing…','info');if(bool(K.inlineApiMode,true)&&get(K.api).trim())await syncAllApi();else{scanStocks();refreshInlinePanel();}inlineStatus('Refreshed.','ok');}catch(e){inlineStatus(e.message,'bad');}};
    $$('[data-slx-inline-tab]',card).forEach(b=>b.onclick=()=>toggleInlineWorkspace(b.dataset.slxInlineTab));
    $('#slx-inline-target',card).onchange=e=>{set(K.target,e.target.value);refreshTargetSelect();refreshInlinePanel();};
    $('#slx-inline-keep',card).onchange=e=>set(K.keep,e.target.value);
    $('#slx-inline-withdraw-value',card).onchange=e=>set(K.withdraw,e.target.value);
    $('#slx-inline-api-mode',card).checked=bool(K.inlineApiMode,true);
    $('#slx-inline-api-mode',card).onchange=e=>{set(K.inlineApiMode,e.target.checked?'1':'0');refreshInlinePanel();inlineStatus(`API Mode ${e.target.checked?'ON':'OFF'}.`,e.target.checked?'ok':'info');};
    refreshStockViewControls();
    const sortCtl=$('#slx-stock-sort',card); if(sortCtl) sortCtl.onchange=()=>{set(K.stockSort,sortCtl.value);applyStockView();enhanceStockRows();inlineStatus(`Sorted: ${sortCtl.options[sortCtl.selectedIndex]?.text||sortCtl.value}`,'ok');};
    const filterCtl=$('#slx-stock-filter',card); if(filterCtl) filterCtl.onchange=()=>{set(K.stockFilter,filterCtl.value);applyStockView();enhanceStockRows();inlineStatus(`Filter: ${filterCtl.options[filterCtl.selectedIndex]?.text||filterCtl.value}`,'ok');};
    const resetView=$('#slx-stock-view-reset',card); if(resetView) resetView.onclick=()=>{set(K.stockSort,'default');set(K.stockFilter,'all');refreshStockViewControls();scanStocks();for(const [,st] of S.stocks){if(st?.row)st.row.style.display='';}enhanceStockRows();inlineStatus('Stock view reset.','ok');};

    $('#slx-inline-settings',card).onclick=()=>{const cfg=$('#slx-inline-config',card),btn=$('#slx-inline-settings',card);if(!cfg)return;const opening=cfg.hidden;cfg.hidden=!opening;btn.dataset.active=opening?'1':'0';btn.textContent=opening?'⚙✓':'⚙';if(opening)setTimeout(()=>cfg.scrollIntoView({behavior:'smooth',block:'nearest'}),30);};
    const search=$('#slx-stock-search',card); if(search){search.value=get(K.rowSearch,'');search.oninput=()=>{set(K.rowSearch,search.value);applyStockView();};}
    const favOnly=$('#slx-favorites-only',card); if(favOnly) favOnly.onclick=()=>{set(K.stockFilter,'favorites');refreshStockViewControls();applyStockView();enhanceStockRows();};
    const tl=$('#slx-target-lock',card); if(tl){tl.checked=bool(K.targetLock,false);tl.onchange=()=>{set(K.targetLock,tl.checked?'1':'0');enhanceStockRows();inlineStatus(`Target lock ${tl.checked?'ON':'OFF'}.`,'ok');};}
    const diag=$('#slx-diagnostics',card); if(diag) diag.onclick=()=>{$('#slx-diagnostic-line',card).textContent=diagnosticsText();};
    const ex=$('#slx-export',card); if(ex) ex.onclick=exportStockManagerData;
    const im=$('#slx-import',card), fi=$('#slx-import-file',card); if(im&&fi){im.onclick=()=>fi.click();fi.onchange=()=>importStockManagerData(fi.files?.[0]);}
    refreshRoadmapControls();
    const tf=$('#slx-target-fav-toggle',card); if(tf) tf.onclick=()=>toggleFavoriteTarget(get(K.target));
    const ts=$('#slx-target-favorites',card); if(ts) ts.onchange=()=>{if(ts.value&&setTargetSafely(ts.value)) refreshRoadmapControls();};
    const nb=$('#slx-near-pct',card); if(nb) nb.onchange=()=>{const v=Math.max(50,Math.min(99.9,Number(nb.value)||90));set(K.nearBenefitPct,String(v));nb.value=String(v);enhanceStockRows();inlineStatus(`Near-benefit alert set to ${v}%.`,'ok');};
    const ct=$('#slx-cash-target',card); if(ct) ct.onchange=()=>set(K.cashTarget,ct.value);
    const sc=$('#slx-sell-cash-target',card); if(sc) sc.onclick=()=>sellToCashTarget().catch(e=>inlineStatus(e.message,'bad'));
    const er=$('#slx-exec-rebalance',card); if(er) er.onclick=()=>executeGuidedRebalance().catch(e=>inlineStatus(e.message,'bad'));
    const ho=$('#slx-history-open',card); if(ho) ho.onclick=()=>{openPanel();setTimeout(()=>$('#slx-stock-tx-history')?.scrollIntoView({behavior:'smooth',block:'center'}),50);};
    const compactBtn=$('#slx-inline-compact',card); if(compactBtn){const syncCompact=()=>{const on=bool(K.compactMode,false);card.dataset.compact=on?'1':'0';compactBtn.dataset.active=on?'1':'0';compactBtn.textContent=on?'Compact ✓':'Compact';};syncCompact();compactBtn.onclick=()=>{set(K.compactMode,bool(K.compactMode,false)?'0':'1');syncCompact();renderInlineWorkspace(get(K.inlineTab,''));};}
    $('#slx-inline-save-presets',card).onclick=()=>{const raw=$('#slx-inline-preset-input',card).value;set(K.inlinePresets,raw);renderInlinePresetButtons(card);inlineStatus('Withdrawal presets saved.','ok');};
    $$('[data-inline-button]',card).forEach(cb=>{const key=cb.dataset.inlineButton;cb.checked=!!inlineButtonPrefs()[key];cb.onchange=()=>{saveInlineButtonPrefs({[key]:cb.checked});applyInlineButtonPrefs(card);};});
    $('#slx-inline-benefit-lock',card).checked=bool(K.benefitLock,true);
    $('#slx-inline-benefit-lock',card).onchange=e=>{set(K.benefitLock,e.target.checked?'1':'0');renderPortfolio();renderOptimizer();refreshInlinePanel();};
    $('#slx-inline-dry',card).checked=bool(K.dryRun,true);
    $('#slx-inline-dry',card).onchange=e=>{set(K.dryRun,e.target.checked?'1':'0');refreshInlinePanel();};
    $('#slx-inline-vault-max',card).onclick=()=>{if(!confirm('Vault Max: continue?'))return;vault().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));};
    $('#slx-inline-vault-keep',card).onclick=()=>vault({keep:parseAmount($('#slx-inline-keep',card).value)}).then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));
    $('#slx-inline-withdraw',card).onclick=()=>withdrawCash(parseAmount($('#slx-inline-withdraw-value',card).value)).then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));
    $('#slx-inline-withdraw-all',card).onclick=()=>{if(!confirm('Withdraw All: continue?'))return;withdrawAll().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));};
    renderInlinePresetButtons(card);
    applyInlineButtonPrefs(card);
    refreshInlinePanel();
    return card;
  }

  function toggleInlineWorkspace(tab) {
    tab=String(tab||'');
    const current=get(K.inlineTab,'');
    const next=current===tab?'':tab;
    set(K.inlineTab,next);
    renderInlineWorkspace(next);
  }

  function renderInlineWorkspace(tab=get(K.inlineTab,'')) {
    const card=$('#slx-stock-inline');
    const box=$('#slx-inline-workspace',card||document);
    if(!card || !box) return;
    tab=String(tab||'');
    $$('[data-slx-inline-tab]',card).forEach(b=>b.dataset.active=b.dataset.slxInlineTab===tab?'1':'0');
    if(!tab){box.dataset.open='0';box.innerHTML='';return;}
    box.dataset.open='1';
    try {
      if(tab==='advisor') return renderInlineAdvisor(box);
      if(tab==='trade') return renderInlineTrade(box);
      if(tab==='rebalance') return renderInlineRebalance(box);
      box.innerHTML='<div class="slx-inline-empty">Unknown workspace.</div>';
    } catch(e) {
      console.error(`[${APP.name}] inline ${tab} failed`,e);
      const msg=String(e?.message||'Workspace error');
      box.innerHTML=`<div class="slx-inline-error">${esc(msg)}</div>`;
      inlineStatus(`${tab}: ${msg}`,'bad');
    }
  }

  function renderInlineAdvisor(box) {
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="slx-inline-empty">No ROI data yet. Sync API and Fetch Market Values from Full → Benefit Values.</div>';return;}
    const bankApr=Math.max(0,Number(get(K.bankApr,'0'))||0);
    box.innerHTML=`<div class="slx-inline-work-head"><b>★ Benefit ROI Advisor</b><button type="button" data-open-full="#slx-stock-advisor-body">Full Advisor</button></div><div class="slx-inline-roi-list">${rows.slice(0,5).map((r,i)=>`<div class="slx-inline-roi-row"><b>#${i+1} ${r.sym}</b><span>Tier ${r.tier}</span><span>${r.roi.toFixed(2)}% APR</span><span>${money(r.cost)} gap</span><small>${Math.round(r.paybackDays).toLocaleString()}d payback${bankApr?` · ${r.bankDelta>=0?'+':''}${r.bankDelta.toFixed(2)}pp vs bank`:''}</small><button type="button" data-inline-target="${r.sym}">Target</button></div>`).join('')}</div>`;
    $('[data-open-full]',box).onclick=()=>openPanelAt('#slx-stock-advisor-body');
    $$('[data-inline-target]',box).forEach(b=>b.onclick=()=>{set(K.target,b.dataset.inlineTarget);refreshTargetSelect();refreshInlinePanel();inlineStatus(`${b.dataset.inlineTarget} selected as target.`,'ok');});
  }

  async function inlineBuyGap(sym,requested) {
    try {
      const st=await ensureStock(sym);
      let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
      if(!cash && get(K.api).trim()){await apiSync();cash=Number(S.money)||0;}
      const shares=Math.min(Math.max(0,Math.floor(Number(requested)||0)),Math.floor(cash/st.price));
      if(shares<=0) throw new Error(`Not enough cash to buy ${sym}.`);
      if(!confirm(`Buy ${shares.toLocaleString()} ${sym} shares for about ${money(shares*st.price)}?`)) return;
      await postTrade(sym,shares,'buyShares');
      inlineStatus(`${isDryRun()?'Dry Run · ':''}Buy gap ${shares.toLocaleString()} ${sym}.`,'ok');
      if(get(K.api).trim() && !isDryRun()) await syncAllApi(); else refreshInlinePanel();
    } catch(e) { inlineStatus(`Trade Assistant: ${e.message}`,'bad'); }
  }

  function renderInlineTrade(box) {
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="slx-inline-empty">No trade candidates yet. Sync API and benefit values first.</div>';return;}
    const best=rows[0], affordable=rows.find(r=>r.affordable);
    const cards=[['Best ROI',best],['Best affordable',affordable]].filter((x,i,a)=>x[1] && a.findIndex(y=>y[1]?.sym===x[1].sym && y[1]?.tier===x[1].tier)===i);
    box.innerHTML=`<div class="slx-inline-work-head"><b>📈 Trade Assistant</b><button type="button" data-open-full="#slx-stock-trade-body">Full Assistant</button></div><div class="slx-inline-trade-list">${cards.map(([title,r])=>`<div class="slx-inline-trade-card"><div><small>${title}</small><b>${r.sym} · Tier ${r.tier}</b><span>${r.roi.toFixed(2)}% APR · ${money(r.cost)}</span></div><div class="slx-inline-mini-actions"><button type="button" data-inline-target="${r.sym}">Target</button><button type="button" class="primary" data-inline-buy="${r.sym}" data-shares="${r.sharesNeeded}">Buy gap</button></div></div>`).join('')}</div>`;
    $('[data-open-full]',box).onclick=()=>openPanelAt('#slx-stock-trade-body');
    $$('[data-inline-target]',box).forEach(b=>b.onclick=()=>{set(K.target,b.dataset.inlineTarget);refreshTargetSelect();refreshInlinePanel();});
    $$('[data-inline-buy]',box).forEach(b=>b.onclick=()=>inlineBuyGap(b.dataset.inlineBuy,Number(b.dataset.shares)||0));
  }

  function renderInlineRebalance(box) {
    const x=buildRebalancePreview();
    if(!x.target){box.innerHTML='<div class="slx-inline-empty">No rebalance candidate yet. Sync API and benefit values first.</div>';return;}
    const sells=x.sells.length?x.sells.map(r=>`<div class="slx-inline-rebalance-row"><b>SELL ${r.sym}</b><span>${r.shares.toLocaleString()} sh</span><span>≈ ${money(r.proceeds)}</span></div>`).join(''):'<div class="slx-inline-empty">Current cash can fund the target; no stock sale is required.</div>';
    box.innerHTML=`<div class="slx-inline-work-head"><b>⚖ Rebalance Preview</b><button type="button" data-open-full="#slx-stock-rebalance-body">Full Preview</button></div><div class="slx-inline-rebalance-target"><small>Target</small><b>${x.target.sym} · Tier ${x.target.tier}</b><span>${x.target.sharesNeeded.toLocaleString()} shares · ${money(x.target.cost)} · ${x.target.roi.toFixed(2)}% APR</span></div><div class="slx-inline-rebalance-list">${sells}</div><div class="${x.shortfall>0?'bad':'good'}">${x.shortfall>0?`Shortfall ${money(x.shortfall)}`:'Fully fundable · preview only, no trades executed'}</div>`;
    $('[data-open-full]',box).onclick=()=>openPanelAt('#slx-stock-rebalance-body');
  }

  function inlineStatus(msg,kind='info') {
    const el=$('#slx-inline-status'); if(!el) return;
    el.textContent=msg; el.dataset.kind=kind;
  }

  function refreshInlinePanel() {
    const card=$('#slx-stock-inline'); if(!card || !isStocks()) return;
    scanStocks();
    const target=get(K.target).toUpperCase();
    const sel=$('#slx-inline-target',card);
    const list=[...S.stocks.keys()].sort();
    if(sel){
      const active=sel.value||target;
      sel.innerHTML='<option value="">Select stock…</option>'+list.map(sym=>`<option value="${esc(sym)}" ${sym===active?'selected':''}>${esc(sym)} · ${money(S.stocks.get(sym)?.price||0)}</option>`).join('');
      if(target && list.includes(target)) sel.value=target;
    }
    const totals=inlineTotals();
    const pl=$('#slx-inline-pl',card);
    $('#slx-inline-total',card).textContent=totals.invested>0?money(totals.invested):'—';
    $('#slx-inline-market',card).textContent=money(totals.marketValue);
    $('#slx-inline-cash',card).textContent=money(totals.cash);
    $('#slx-inline-coverage',card).textContent=totals.positions?`· ${totals.coverage}% cost basis`:'';
    $('#slx-inline-pl-pct',card).textContent=totals.invested>0?`${totals.plPct>=0?'+':''}${totals.plPct.toFixed(2)}%`:'';
    if(pl){pl.textContent=totals.invested>0?`${totals.pl>=0?'+':'-'}${money(Math.abs(totals.pl))}`:'—';pl.className=totals.pl>=0?'good':'bad';}
    $('#slx-inline-owned',card).textContent=target?ownedShares(target).toLocaleString():'—';
    const api=$('#slx-inline-api',card); if(api){const enabled=bool(K.inlineApiMode,true);api.textContent=!get(K.api).trim()?'API !':enabled?'API ON':'API OFF';api.dataset.kind=get(K.api).trim()&&enabled?'ok':'warn';} const apiMode=$('#slx-inline-api-mode',card);if(apiMode)apiMode.checked=bool(K.inlineApiMode,true);applyInlineButtonPrefs(card);
    const lock=$('#slx-inline-benefit-lock',card); if(lock) lock.checked=bool(K.benefitLock,true);
    const dry=$('#slx-inline-dry',card); if(dry) dry.checked=bool(K.dryRun,true);
    renderInlineWorkspace(get(K.inlineTab,''));
    enhanceStockRows();
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
#slx-stock-panel .optimizer-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:8px}#slx-stock-panel .optimizer-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}#slx-stock-panel .optimizer-summary>div{display:grid;gap:3px;padding:8px;border:1px solid #23374a;border-radius:9px;background:#101a25}#slx-stock-panel .optimizer-summary span{font-size:9px;color:#8293a7}#slx-stock-panel .optimizer-pick{display:grid;gap:3px;padding:8px;margin-bottom:7px;border:1px solid #365a78;border-radius:9px;background:#0e1c29}.optimizer-pick span,.optimizer-pick small{font-size:9px;color:#9fb3c6}#slx-stock-panel .optimizer-list{display:grid;gap:5px;max-height:310px;overflow:auto}#slx-stock-panel .optimizer-row{display:grid;grid-template-columns:62px 1fr 1fr 1fr 1.25fr;gap:6px;padding:7px;border:1px solid #203142;border-radius:8px;background:#0d1620;font-size:9px;align-items:center}.optimizer-row>div{display:grid;gap:3px}.optimizer-row small{color:#8293a7}
#slx-stock-panel .rebalance-controls{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-bottom:8px}#slx-stock-panel .rebalance-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}#slx-stock-panel .rebalance-summary>div{display:grid;gap:3px;padding:8px;border:1px solid #23374a;border-radius:9px;background:#101a25}.rebalance-summary span{font-size:9px;color:#8293a7}#slx-stock-panel .rebalance-target{display:grid;gap:3px;padding:9px;border:1px solid #365a78;border-radius:9px;background:#0e1c29;margin-bottom:7px}.rebalance-target span,.rebalance-target small{font-size:9px;color:#9fb3c6}#slx-stock-panel .rebalance-list{display:grid;gap:5px;margin-bottom:7px}.rebalance-row{display:grid;grid-template-columns:80px 1fr 1fr 1fr;gap:6px;padding:7px;border:1px solid #203142;border-radius:8px;background:#0d1620;font-size:9px;align-items:center}
#slx-stock-inline{margin:10px 0 14px;padding:0;border:1px solid #344458;border-radius:14px;background:#0b1118;color:#e8eef7;box-shadow:0 8px 24px #0008;overflow:hidden;font-family:Arial,sans-serif}#slx-stock-inline *{box-sizing:border-box}#slx-stock-inline .slx-inline-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:linear-gradient(180deg,#182535,#101923);border-bottom:1px solid #2c3d50}#slx-stock-inline .slx-inline-head>div:first-child{display:grid;gap:2px;flex:1}#slx-stock-inline .slx-inline-head b{font-size:13px}#slx-stock-inline .slx-inline-head small{font-size:9px;color:#8394a7}#slx-stock-inline .slx-inline-head-actions{display:flex;gap:5px}#slx-stock-inline button,#slx-stock-inline input,#slx-stock-inline select{border:1px solid #415369;border-radius:8px;background:#17212c;color:#ecf4ff;padding:8px;font-size:11px}#slx-stock-inline button{font-weight:800}#slx-stock-inline .primary{border-color:#2c8b52;color:#7ee09f;background:#102a1d}#slx-stock-inline .danger{border-color:#8c3140;color:#ff7a86;background:#2b1016}#slx-stock-inline .slx-inline-body{padding:10px;display:grid;gap:9px}#slx-stock-inline[data-collapsed="1"] .slx-inline-body{display:none}#slx-stock-inline .slx-inline-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}#slx-stock-inline .slx-inline-summary>div{display:grid;gap:2px;padding:8px;border:1px solid #26384a;border-radius:9px;background:#101821}#slx-stock-inline .slx-inline-summary span,#slx-stock-inline .slx-inline-target span{font-size:9px;color:#8596a8}#slx-stock-inline .slx-inline-summary small{font-size:8px;color:#74869a}#slx-stock-inline .slx-inline-summary b{font-size:12px}#slx-stock-inline .slx-inline-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}#slx-stock-inline .slx-inline-target{display:grid;grid-template-columns:1fr 110px;gap:8px;align-items:end}#slx-stock-inline .slx-inline-target label,#slx-stock-inline .slx-inline-target>div{display:grid;gap:4px}#slx-stock-inline .slx-inline-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#slx-stock-inline .slx-inline-actions label{display:block}#slx-stock-inline .slx-inline-actions input{width:100%}#slx-stock-inline .slx-inline-options{display:flex;flex-wrap:wrap;gap:9px;align-items:center}#slx-stock-inline .slx-inline-options label{display:flex;align-items:center;gap:4px;font-size:10px;color:#a4b1bf}#slx-stock-inline .slx-inline-options input{width:auto}#slx-stock-inline #slx-inline-panic{margin-left:auto}#slx-stock-inline .slx-inline-presets{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}#slx-stock-inline .slx-inline-config{padding:9px;border:1px solid #2b3d50;border-radius:9px;background:#0d1721;display:grid;gap:8px}#slx-stock-inline .slx-inline-config[hidden]{display:none}#slx-stock-inline .slx-inline-config label{display:grid;gap:4px;font-size:9px;color:#9aabba}#slx-stock-inline .slx-inline-config-actions{display:flex;flex-wrap:wrap;gap:7px;align-items:center}#slx-stock-inline .slx-inline-config-actions label{display:flex;align-items:center;gap:4px}#slx-stock-inline .slx-inline-note{font-size:9px;color:#8ea0b3}#slx-stock-inline .slx-inline-note[data-kind="bad"]{color:#ff7a86}#slx-stock-inline .slx-inline-note[data-kind="ok"]{color:#61e291}#slx-stock-inline .good{color:#61e291}#slx-stock-inline .bad{color:#ff7a86}#slx-stock-inline #slx-inline-api[data-kind="ok"]{border-color:#267c52;color:#63df9a}#slx-stock-inline #slx-inline-api[data-kind="warn"]{border-color:#8b6a1f;color:#ffd36b}
#slx-stock-inline .slx-inline-nav button[data-active="1"],#slx-stock-inline #slx-inline-compact[data-active="1"]{border-color:#3b8ec9;background:#123653;color:#9bd5ff}#slx-stock-inline .slx-stock-view-controls{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:end}#slx-stock-inline .slx-stock-view-controls label{display:grid;gap:3px;font-size:9px;color:#8fa1b4}#slx-stock-inline .slx-stock-view-controls select{width:100%}.slx-stock-row-tools .slx-opp-badge{display:inline-block;margin-left:3px;padding:1px 4px;border:1px solid #8b6a1f;border-radius:999px;color:#ffd36b;background:#2b2412;font:800 7px Arial;font-style:normal}.slx-stock-row-tools .slx-opp-roi{color:#ffd36b!important}.slx-stock-row-tools[data-opportunity="1"]{box-shadow:inset 3px 0 #ffd36b}.slx-stock-row-tools[data-opportunity="2"],.slx-stock-row-tools[data-opportunity="3"]{box-shadow:inset 2px 0 #7c91a8}#slx-stock-inline .slx-inline-workspace{display:none;border:1px solid #26394b;border-radius:10px;background:#0d151e;padding:8px}#slx-stock-inline .slx-inline-workspace[data-open="1"]{display:grid;gap:7px}#slx-stock-inline .slx-inline-work-head{display:flex;align-items:center;gap:8px}#slx-stock-inline .slx-inline-work-head>b{flex:1;font-size:11px;color:#9fc7ef}#slx-stock-inline .slx-inline-work-head button{padding:6px 8px;font-size:9px}#slx-stock-inline .slx-inline-roi-list,#slx-stock-inline .slx-inline-trade-list,#slx-stock-inline .slx-inline-rebalance-list{display:grid;gap:5px}#slx-stock-inline .slx-inline-roi-row{display:grid;grid-template-columns:66px 48px 68px 1fr auto;gap:5px;align-items:center;padding:7px;border:1px solid #203142;border-radius:8px;background:#101923;font-size:9px}#slx-stock-inline .slx-inline-roi-row small{grid-column:1/5;color:#8497aa}#slx-stock-inline .slx-inline-roi-row button{grid-row:1/3;grid-column:5;padding:6px}#slx-stock-inline .slx-inline-trade-card{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:8px;border:1px solid #263b4e;border-radius:9px;background:#101923}#slx-stock-inline .slx-inline-trade-card>div:first-child{display:grid;gap:2px}#slx-stock-inline .slx-inline-trade-card small,#slx-stock-inline .slx-inline-trade-card span{font-size:9px;color:#8497aa}#slx-stock-inline .slx-inline-mini-actions{display:flex;gap:5px}#slx-stock-inline .slx-inline-rebalance-target{display:grid;gap:3px;padding:8px;border:1px solid #365a78;border-radius:9px;background:#0e1c29}#slx-stock-inline .slx-inline-rebalance-target small,#slx-stock-inline .slx-inline-rebalance-target span{font-size:9px;color:#91a8bc}#slx-stock-inline .slx-inline-rebalance-row{display:grid;grid-template-columns:80px 1fr 1fr;gap:6px;padding:6px;border-bottom:1px solid #1e2c39;font-size:9px}#slx-stock-inline .slx-inline-empty,#slx-stock-inline .slx-inline-error{padding:8px;font-size:9px;color:#8fa1b4}#slx-stock-inline .slx-inline-error{color:#ff7a86}
#slx-stock-inline~ul .slx-stock-row-tools,.slx-stock-row-tools{list-style:none!important;display:grid;grid-template-columns:90px 1fr 1.15fr 1fr auto;gap:7px;align-items:center;width:100%;margin:7px 0 0!important;padding:8px!important;border-top:1px solid #2a3b4d;background:linear-gradient(180deg,#101923,#0c141c);color:#dce9f7;font-family:Arial,sans-serif;box-sizing:border-box}.slx-stock-row-tools *{box-sizing:border-box}.slx-stock-row-tools[data-target="1"]{box-shadow:inset 3px 0 #4da3ff}.slx-stock-row-tools .slx-row-stock,.slx-stock-row-tools .slx-row-stat{display:grid;gap:2px;min-width:0}.slx-stock-row-tools b{font-size:10px}.slx-stock-row-tools span,.slx-stock-row-tools small{font-size:8px;color:#8fa0b2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.slx-stock-row-tools .good{color:#61e291}.slx-stock-row-tools .bad{color:#ff7a86}.slx-stock-row-tools .slx-row-actions{display:flex;gap:4px;justify-content:flex-end}.slx-stock-row-tools button{border:1px solid #415369;border-radius:7px;background:#17212c;color:#ecf4ff;padding:6px 7px;font:800 9px Arial}.slx-stock-row-tools button.primary{border-color:#2c8b52;color:#7ee09f;background:#102a1d}.slx-stock-row-tools button.danger{border-color:#8c3140;color:#ff7a86;background:#2b1016}.slx-stock-row-tools button:disabled{opacity:.38}.slx-stock-row-tools .slx-row-progress{height:4px;border-radius:999px;background:#202d3a;overflow:hidden;margin-top:2px}.slx-stock-row-tools .slx-row-progress i{display:block;height:100%;background:linear-gradient(90deg,#2c8b52,#6bdc97);border-radius:999px}.slx-stock-row-tools .slx-row-progress-label{font-size:7px!important}.slx-stock-row-tools .slx-row-quick{grid-column:1/-1;display:grid;grid-template-columns:minmax(76px,120px) 72px 72px;gap:5px;justify-content:end;border-top:1px dashed #243548;padding-top:6px}.slx-stock-row-tools .slx-row-quick select{border:1px solid #415369;border-radius:7px;background:#17212c;color:#ecf4ff;padding:6px;font:800 9px Arial}
.slx-stock-row-tools .slx-fav{font-size:13px!important;padding:3px 6px!important;color:#ffd36b}.slx-stock-row-tools .slx-row-progress-label{white-space:normal!important}#slx-stock-inline .slx-v070-toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}#slx-stock-inline .slx-v070-toolbar input[type="search"]{flex:1;min-width:130px}#slx-stock-inline .slx-v070-toolbar label{display:flex;align-items:center;gap:4px;font-size:9px;color:#9fb0c0}#slx-stock-inline .slx-v070-toolbar input[type="checkbox"]{width:auto}#slx-stock-inline[data-compact="1"] .slx-inline-summary,#slx-stock-inline[data-compact="1"] .slx-inline-presets{display:none!important}#slx-stock-inline .slx-inline-advanced{display:grid;gap:8px;padding-top:9px;margin-top:2px;border-top:1px solid #243548}#slx-stock-inline #slx-inline-settings[data-active="1"]{border-color:#3b8ec9;color:#9bd5ff;background:#123653}#slx-stock-inline .slx-v070-toolbar select{max-width:140px}#slx-stock-inline .slx-v070-toolbar #slx-exec-rebalance{border-color:#3b8ec9;color:#9bd5ff}#slx-stock-inline .slx-v070-toolbar #slx-sell-cash-target{border-color:#8b6a1f;color:#ffd36b}@media(max-width:600px){#slx-stock-inline .slx-stock-view-controls{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-stock-view-controls button{grid-column:1/3}.slx-stock-row-tools{grid-template-columns:58px 1fr 1fr!important;gap:5px!important;padding:7px!important}.slx-stock-row-tools .slx-row-stat:nth-child(4){grid-column:1/3}.slx-stock-row-tools .slx-row-actions{grid-column:1/4;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))}.slx-stock-row-tools button{padding:7px 4px!important}.slx-stock-row-tools .slx-row-quick{grid-column:1/4;grid-template-columns:1fr 1fr 1fr;justify-content:stretch}.slx-stock-row-tools .slx-row-quick select{width:100%;padding:7px 4px}#slx-stock-inline .slx-inline-roi-row{grid-template-columns:58px 42px 62px 1fr}#slx-stock-inline .slx-inline-roi-row button{grid-row:auto;grid-column:4}#slx-stock-inline .slx-inline-roi-row small{grid-column:1/5}#slx-stock-inline .slx-inline-trade-card{grid-template-columns:1fr}#slx-stock-inline .slx-inline-mini-actions{justify-content:flex-end}#slx-stock-inline .slx-inline-summary{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-nav{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-target{grid-template-columns:1fr 86px}#slx-stock-inline .slx-inline-actions{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-presets{grid-template-columns:repeat(3,minmax(0,1fr))}#slx-stock-panel .rebalance-controls{grid-template-columns:1fr}#slx-stock-panel .rebalance-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .rebalance-row{grid-template-columns:1fr 1fr}#slx-stock-panel .optimizer-controls{grid-template-columns:1fr}#slx-stock-panel .optimizer-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .optimizer-row{grid-template-columns:1fr 1fr}.optimizer-row>div:nth-child(5){grid-column:1/3}#slx-stock-panel .safety-grid{grid-template-columns:1fr}#slx-stock-panel .action-row{grid-template-columns:1fr 1fr}.action-row span:nth-child(n+3){grid-column:2/3}#slx-stock-panel .grid{grid-template-columns:1fr}#slx-stock-panel .benefit-row{grid-template-columns:42px 1fr 85px 58px}.benefit-row small{grid-column:2/5}#slx-stock-panel .roi-row{grid-template-columns:65px 55px 70px}.roi-row span:nth-child(n+4){grid-column:2/4}#slx-stock-panel .trade-card{grid-template-columns:1fr 1fr}.trade-actions{grid-column:1/3}#slx-stock-panel .portfolio-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .portfolio-row{grid-template-columns:1fr 1fr}#slx-stock-panel .adv-row{grid-template-columns:56px 1fr 1fr;}.adv-row span:nth-child(4),.adv-row span:nth-child(5){grid-column:2/4}#slx-stock-panic{top:auto;bottom:88px;right:12px}}
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
      <div class="section"><div class="api-head"><div class="title">Transaction History</div><div><select id="slx-tx-filter"><option value="all">All</option><option value="buy">BUY</option><option value="sell">SELL</option></select> <input id="slx-tx-search" placeholder="Search symbol/status…" style="max-width:170px"></div></div><div id="slx-stock-tx-history" class="action-list muted">No transactions yet.</div></div>
      <div class="section"><div class="api-head"><div class="title">Action Log</div><button id="slx-log-clear" type="button">Clear Log</button></div><div id="slx-stock-action-log" class="action-list muted">No stock actions logged yet.</div></div>
      <div class="section"><div class="title">Portfolio</div><div id="slx-stock-portfolio-body" class="muted">Waiting for portfolio data…</div></div>
      <div class="section"><div class="title">Benefit Values</div><div class="actions"><button id="slx-benefit-fetch" class="primary" type="button">Fetch Market Values</button><button id="slx-benefit-reset" type="button">Reset Manual Values</button></div><div id="slx-stock-benefit-values" class="benefit-list"></div></div>
      <div class="section"><div class="title">Benefit ROI Advisor</div><div id="slx-stock-advisor-body" class="muted">Waiting for stock data…</div></div>
      <div class="section"><div class="title">Portfolio Optimizer</div><div class="optimizer-controls"><label>Bank APR % <input id="slx-bank-apr" inputmode="decimal" value="${esc(get(K.bankApr,'0'))}" placeholder="e.g. 70"></label><label>Minimum acceptable APR % <input id="slx-opt-min-apr" inputmode="decimal" value="${esc(get(K.optimizerMinApr,'0'))}" placeholder="e.g. 50"></label></div><div class="api-help">Bank APR is manual so the comparison uses your actual current bank return instead of a guessed rate.</div><div id="slx-stock-optimizer-body" class="muted">Waiting for portfolio data…</div></div>
      <div class="section"><div class="title">Rebalance Preview</div><div class="rebalance-controls"><label>Cash reserve <input id="slx-rebalance-reserve" value="${esc(get(K.rebalanceReserve,'0'))}" placeholder="e.g. 10m"></label><button id="slx-rebalance-preview-btn" type="button">Build Preview</button></div><div class="api-help">Preview only: proposes which excess shares could be released and where capital could move. It never executes SELL/BUY automatically.</div><div id="slx-stock-rebalance-body" class="muted">Press Build Preview after syncing API and benefit values.</div></div>
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
    $('#slx-api-test',p).onclick=async()=>{try{saveApiKeyFromPanel();await syncAllApi();}catch(e){const msg=String(e?.message||'API test failed');setApiBadge('Error','warn');status(`API test: ${msg}`,'bad');console.error(`[${APP.name}] API test failed`,e);}};
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
    $('#slx-bank-apr',p).onchange=e=>{set(K.bankApr,String(Math.max(0,Number(e.target.value)||0)));renderAdvisor();renderOptimizer();renderTradeAssistant();};
    $('#slx-opt-min-apr',p).onchange=e=>{set(K.optimizerMinApr,String(Math.max(0,Number(e.target.value)||0)));renderOptimizer();};
    $('#slx-rebalance-reserve',p).onchange=e=>{set(K.rebalanceReserve,e.target.value);renderRebalancePreview();};
    $('#slx-rebalance-preview-btn',p).onclick=()=>safeRender('Rebalance Preview',renderRebalancePreview);
    $('#slx-stock-target',p).onchange=e=>{set(K.target,e.target.value);const v=$('#slx-panic-preview',p);if(v){v.dataset.kind='';v.textContent='Target changed · run Preview PANIC again.';}renderPortfolio();renderAdvisor();renderOptimizer();};
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

  function openPanel() { style(); const p=panel(); p.dataset.open='1'; safeRender('Targets',refreshTargetSelect); safeRender('Portfolio',renderPortfolio); safeRender('Benefit Values',renderBenefitValues); safeRender('ROI Advisor',renderAdvisor); safeRender('Portfolio Optimizer',renderOptimizer); safeRender('Rebalance Preview',renderRebalancePreview); safeRender('Trade Assistant',renderTradeAssistant); safeRender('Transaction History',renderTransactionHistory); safeRender('Action Log',renderActionLog); }

  function managerLauncher() {
    if($('#slx-stock-open')) return;
    const b=document.createElement('button'); b.id='slx-stock-open'; b.type='button'; b.textContent='📊 Stock Manager';
    b.style.cssText='position:fixed;right:10px;bottom:44px;z-index:2147482499;border:1px solid #3c6c96;border-radius:10px;padding:8px 10px;background:#102335;color:#dceeff;font:800 11px Arial;';
    b.onclick=()=>{try{openPanel();}catch(e){console.error(`[${APP.name}] open panel failed`,e);const p=S.panel;if(p?.isConnected)p.dataset.open='1';}}; document.body.appendChild(b);
  }

  function restoreCache() { try { S.portfolio=JSON.parse(get(K.tx,'{}'))||{}; } catch {} }

  let inlineMountTimer=0;
  function scheduleInlineMount() {
    clearTimeout(inlineMountTimer);
    inlineMountTimer=setTimeout(()=>{if(isStocks()){mountInlinePanel();enhanceStockRows();} else {$('#slx-stock-inline')?.remove();$$('.slx-stock-row-tools').forEach(x=>x.remove());}},120);
  }

  async function init() {
    style(); restoreCache(); panicButton(); managerLauncher(); if(isStocks()) setTimeout(()=>{mountInlinePanel();enhanceStockRows();},250);
    try { if(sessionStorage.getItem('SakaLuX_STOCK_KEY_SETUP_PENDING')==='1'){sessionStorage.removeItem('SakaLuX_STOCK_KEY_SETUP_PENDING');setTimeout(openPanel,700);} } catch {}
    if(isStocks()) {
      const wait=setInterval(()=>{ if(scanStocks().size){clearInterval(wait); if(S.panel?.dataset.open==='1'){refreshTargetSelect();renderAdvisor();} if(get(K.panicPending)==='1') panic();}},500);
      setTimeout(()=>clearInterval(wait),15000);
    }
    const mo=new MutationObserver(()=>{ if(isStocks()) scanStocks(); scheduleInlineMount(); if(!$('#slx-stock-open')) managerLauncher(); if(!$('#slx-stock-panic')) panicButton(); });
    mo.observe(document.documentElement,{subtree:true,childList:true});
  }

  init();
})();
