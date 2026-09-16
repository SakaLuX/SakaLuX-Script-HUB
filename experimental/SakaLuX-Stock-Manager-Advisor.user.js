// ==UserScript==
// @name         SakaLuX Stock Manager & Advisor [EXPERIMENTAL]
// @namespace    sakalux.stock.manager.advisor
// @version      0.1.0
// @description  Experimental Torn stock vault manager, benefit-safe withdrawals, portfolio advisor and one-tap Panic vault.
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
    version: '0.1.0',
    experimental: true,
    profile: 'https://www.torn.com/profiles.php?XID=2380374',
    stocksUrl: 'https://www.torn.com/page.php?sid=stocks'
  };

  const K = {
    api: 'SLX_STOCK_API_KEY',
    target: 'SLX_STOCK_TARGET',
    keep: 'SLX_STOCK_KEEP_CASH',
    withdraw: 'SLX_STOCK_WITHDRAW',
    benefitLock: 'SLX_STOCK_BENEFIT_LOCK',
    panicPending: 'SLX_STOCK_PANIC_PENDING',
    panicConfirm: 'SLX_STOCK_PANIC_CONFIRM',
    presets: 'SLX_STOCK_PRESETS',
    tx: 'SLX_STOCK_TX_CACHE'
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

  const S = { stocks:new Map(), portfolio:{}, money:null, panel:null, status:null };

  const $ = (q, r=document) => r.querySelector(q);
  const $$ = (q, r=document) => [...r.querySelectorAll(q)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => Number(String(v ?? '').replace(/[$,\s]/g,'')) || 0;
  const money = v => '$' + Math.max(0, Number(v)||0).toLocaleString('en-US', {maximumFractionDigits:0});
  const get = (k, d='') => { try { const v=localStorage.getItem(k); return v===null?d:v; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
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

  function benefitTier(sym, shares) {
    const d=BENEFITS[sym];
    if(!d) return {tier:0,keep:0,next:0};
    shares=Math.max(0,Number(shares)||0);
    if(d.type==='P') return shares>=d.base ? {tier:1,keep:d.base,next:0} : {tier:0,keep:0,next:d.base};
    if(shares<d.base) return {tier:0,keep:0,next:d.base};
    let tier=1;
    while(shares>=d.base*tier*2) tier*=2;
    return {tier,keep:d.base*tier,next:d.base*tier*2};
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

  function postTrade(sym, shares, step) {
    const stock=S.stocks.get(sym);
    if(!stock?.id) return Promise.reject(new Error(`Stock ID missing for ${sym}. Open Stocks and refresh.`));
    shares=Math.floor(Number(shares)||0);
    if(shares<=0) return Promise.reject(new Error('Share amount is 0.'));
    const body=new URLSearchParams({stockId:stock.id,amount:String(shares)});
    return fetch(`https://www.torn.com/page.php?sid=StockMarket&step=${encodeURIComponent(step)}&rfcv=${encodeURIComponent(rfc())}`, {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}, body, credentials:'include'
    }).then(async res => {
      const text=await res.text(); let data=null;
      try{data=JSON.parse(text);}catch{}
      if(data && data.success===false) throw new Error(data.text||'Trade failed');
      return data||text;
    });
  }

  async function vault({keep=0, panic=false}={}) {
    scanStocks();
    const sym=get(K.target).toUpperCase();
    if(!sym) throw new Error('Choose a vault target first.');
    const stock=S.stocks.get(sym);
    if(!stock?.price) throw new Error(`Price unavailable for ${sym}.`);
    let cash=currentMoneyFromDom();
    if(!cash || panic) {
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

  function buildAdvisorRows() {
    scanStocks();
    const rows=[];
    for(const [sym,st] of S.stocks) {
      const owned=ownedShares(sym), tier=benefitTier(sym,owned);
      if(!BENEFITS[sym] || !st.price) continue;
      const nextShares=tier.next?Math.max(0,tier.next-owned):0;
      const nextCost=nextShares*st.price;
      const avg=averageBuy(sym);
      const pl=avg>0 && owned>0 ? (st.price-avg)*owned : null;
      rows.push({sym,owned,tier:tier.tier,nextShares,nextCost,price:st.price,pl});
    }
    rows.sort((a,b)=>{
      const az=a.nextCost||Number.MAX_SAFE_INTEGER, bz=b.nextCost||Number.MAX_SAFE_INTEGER;
      return az-bz || a.sym.localeCompare(b.sym);
    });
    return rows;
  }

  function renderAdvisor() {
    const box=$('#slx-stock-advisor-body'); if(!box) return;
    const rows=buildAdvisorRows();
    if(!rows.length){box.innerHTML='<div class="muted">Open the Torn Stocks page so stock prices can be scanned.</div>';return;}
    box.innerHTML=rows.slice(0,12).map(r=>`<div class="adv-row"><b>${esc(r.sym)}</b><span>${r.owned.toLocaleString()} sh</span><span>${r.tier?'Tier '+r.tier:'No benefit'}</span><span>${r.nextShares?money(r.nextCost)+' to next':'Current tier max'}</span>${r.pl===null?'':`<span class="${r.pl>=0?'good':'bad'}">P/L ${r.pl>=0?'+':''}${money(Math.abs(r.pl))}</span>`}</div>`).join('');
  }

  function panicButton() {
    if($('#slx-stock-panic')) return;
    const b=document.createElement('button');
    b.id='slx-stock-panic'; b.type='button'; b.textContent='PANIC'; b.title='Vault on-hand cash into your selected stock';
    b.addEventListener('click', panic);
    (document.body||document.documentElement).appendChild(b);
  }

  async function panic() {
    const target=get(K.target).toUpperCase();
    if(!target){ openPanel(); status('Choose a Panic target first.','bad'); return; }
    if(bool(K.panicConfirm,false) && !confirm(`PANIC: vault available cash into ${target}?`)) return;
    if(!isStocks()) {
      set(K.panicPending,'1');
      location.href=APP.stocksUrl;
      return;
    }
    try { await vault({keep:parseAmount(get(K.keep,'0')),panic:true}); set(K.panicPending,'0'); }
    catch(e){ status(`PANIC failed: ${e.message}`,'bad'); }
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
#slx-stock-panel .primary{background:#194f86;border-color:#2e77b9} #slx-stock-panel .danger{background:#64131c;border-color:#a92c3b} #slx-stock-panel .good{color:#55d98a}.bad{color:#ff6b78}.muted{color:#8392a4}
#slx-stock-panel #slx-stock-status{padding:8px;border-radius:8px;background:#111b26;font-size:11px;color:#9fb0c3} #slx-stock-panel #slx-stock-status[data-kind="ok"]{color:#61e291} #slx-stock-panel #slx-stock-status[data-kind="bad"]{color:#ff7a86} #slx-stock-panel #slx-stock-status[data-kind="warn"]{color:#ffd36b}
#slx-stock-panel .adv-row{display:grid;grid-template-columns:70px 1fr 1fr 1.4fr 1fr;gap:7px;padding:7px 0;border-bottom:1px solid #1c2a38;font-size:10px;align-items:center}
@media(max-width:600px){#slx-stock-panel .grid{grid-template-columns:1fr}#slx-stock-panel .adv-row{grid-template-columns:56px 1fr 1fr;}.adv-row span:nth-child(4),.adv-row span:nth-child(5){grid-column:2/4}#slx-stock-panic{top:auto;bottom:88px;right:12px}}
`;
    (document.head||document.documentElement).appendChild(s);
  }

  function panel() {
    if(S.panel?.isConnected) return S.panel;
    const p=document.createElement('div'); p.id='slx-stock-panel';
    p.innerHTML=`<div class="card"><div class="head"><div>📊</div><h2>${APP.name} <span class="muted">v${APP.version} · EXPERIMENTAL</span></h2><button class="close" type="button">×</button></div><div class="body">
      <div class="section"><div class="title">Vault & Panic</div><div class="grid">
        <label>API key <input id="slx-stock-api" type="password" placeholder="Optional Torn API key"></label>
        <label>Vault target <select id="slx-stock-target"><option value="">Open Stocks to detect symbols</option></select></label>
        <label>Keep cash <input id="slx-stock-keep" value="${esc(get(K.keep,'0'))}" placeholder="e.g. 250k"></label>
        <label>Withdraw amount <input id="slx-stock-withdraw" value="${esc(get(K.withdraw,'1m'))}" placeholder="e.g. 1m"></label>
      </div><div class="actions"><button id="slx-vault-max" class="primary">Vault Max</button><button id="slx-vault-keep">Vault (Keep)</button><button id="slx-withdraw">Withdraw</button><button id="slx-withdraw-all">Withdraw All</button></div>
      <div class="actions"><label><input id="slx-benefit-lock" type="checkbox"> Lock Benefits</label><label><input id="slx-panic-confirm" type="checkbox"> Confirm Panic</label><button id="slx-sync">Sync API</button></div></div>
      <div class="section"><div class="title">Advisor</div><div id="slx-stock-advisor-body" class="muted">Waiting for stock data…</div></div>
      <div id="slx-stock-status">Experimental build. Not registered in SakaLuX Hub or Standalone.</div>
    </div></div>`;
    document.body.appendChild(p); S.panel=p; S.status=$('#slx-stock-status',p);
    $('.close',p).onclick=()=>p.dataset.open='0';
    $('#slx-stock-api',p).value=get(K.api);
    $('#slx-benefit-lock',p).checked=bool(K.benefitLock,true);
    $('#slx-panic-confirm',p).checked=bool(K.panicConfirm,false);
    $('#slx-stock-api',p).onchange=e=>set(K.api,e.target.value.trim());
    $('#slx-stock-keep',p).onchange=e=>set(K.keep,e.target.value);
    $('#slx-stock-withdraw',p).onchange=e=>set(K.withdraw,e.target.value);
    $('#slx-benefit-lock',p).onchange=e=>set(K.benefitLock,e.target.checked?'1':'0');
    $('#slx-panic-confirm',p).onchange=e=>set(K.panicConfirm,e.target.checked?'1':'0');
    $('#slx-stock-target',p).onchange=e=>{set(K.target,e.target.value);renderAdvisor();};
    $('#slx-vault-max',p).onclick=()=>vault().catch(e=>status(e.message,'bad'));
    $('#slx-vault-keep',p).onclick=()=>vault({keep:parseAmount($('#slx-stock-keep',p).value)}).catch(e=>status(e.message,'bad'));
    $('#slx-withdraw',p).onclick=()=>withdrawCash(parseAmount($('#slx-stock-withdraw',p).value)).catch(e=>status(e.message,'bad'));
    $('#slx-withdraw-all',p).onclick=()=>withdrawAll().catch(e=>status(e.message,'bad'));
    $('#slx-sync',p).onclick=()=>apiSync().then(()=>{status('API portfolio synced.','ok');renderAdvisor();}).catch(e=>status(e.message,'bad'));
    return p;
  }

  function refreshTargetSelect() {
    if(!S.panel?.isConnected) return;
    scanStocks();
    const sel=$('#slx-stock-target',S.panel); if(!sel) return;
    const current=get(K.target).toUpperCase();
    const list=[...S.stocks.keys()].sort();
    sel.innerHTML='<option value="">Select stock…</option>'+list.map(sym=>`<option value="${esc(sym)}" ${sym===current?'selected':''}>${esc(sym)} · ${money(S.stocks.get(sym).price)}</option>`).join('');
  }

  function openPanel() { style(); panel(); refreshTargetSelect(); renderAdvisor(); S.panel.dataset.open='1'; }

  function managerLauncher() {
    if($('#slx-stock-open')) return;
    const b=document.createElement('button'); b.id='slx-stock-open'; b.type='button'; b.textContent='📊 Stock Manager';
    b.style.cssText='position:fixed;right:10px;bottom:44px;z-index:2147482499;border:1px solid #3c6c96;border-radius:10px;padding:8px 10px;background:#102335;color:#dceeff;font:800 11px Arial;';
    b.onclick=openPanel; document.body.appendChild(b);
  }

  function restoreCache() { try { S.portfolio=JSON.parse(get(K.tx,'{}'))||{}; } catch {} }

  async function init() {
    style(); restoreCache(); panicButton(); managerLauncher();
    if(isStocks()) {
      const wait=setInterval(()=>{ if(scanStocks().size){clearInterval(wait); if(S.panel?.dataset.open==='1'){refreshTargetSelect();renderAdvisor();} if(get(K.panicPending)==='1') panic();}},500);
      setTimeout(()=>clearInterval(wait),15000);
    }
    const mo=new MutationObserver(()=>{ if(isStocks()) scanStocks(); });
    mo.observe(document.documentElement,{subtree:true,childList:true});
  }

  init();
})();
