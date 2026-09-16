from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')
if '// @version      0.7.1' not in s: raise SystemExit('expected v0.7.1')
s=s.replace('// @version      0.7.1','// @version      0.7.2',1)
s=s.replace("version: '0.7.1'","version: '0.7.2'",1)
s=s.replace('Experimental Torn stock workspace with complete roadmap tools: favorite targets, cash-target selling, transaction history, configurable benefit alerts, guided rebalance, diagnostics and hardened trades.','Experimental Torn stock workspace with repaired API v2 sync, reorganized inline controls, fixed settings access and validated guided rebalance trade amounts.',1)

# API v2: replace old combined v1 user sync with explicit, current endpoints and normalized portfolio shape.
start=s.index('  async function apiSync() {')
end=s.index('  function setApiBadge', start)
api_block=r'''  function apiErrorMessage(data, fallback='Torn API error') {
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

'''
s=s[:start]+api_block+s[end:]

# API v2 public stock catalog.
start=s.index('  async function syncStockCatalog() {')
end=s.index('  async function ensureStock', start)
catalog=r'''  async function syncStockCatalog() {
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

'''
s=s[:start]+catalog+s[end:]

# Fix the optimizer price bug responsible for SELL NaN in guided rebalance.
old='rows.push({sym,owned,price,tier:tier.tier,protectedShares,freeShares,protectedValue,freeValue,currentApr,nextGap,nextCost,signal,bankApr,minApr});'
if old not in s: raise SystemExit('optimizer row anchor missing')
s=s.replace(old,'rows.push({sym,owned,price:Number(st.price)||0,tier:tier.tier,protectedShares,freeShares,protectedValue,freeValue,currentApr,nextGap,nextCost,signal,bankApr,minApr});',1)

# Harden preview math so invalid rows can never become NaN SELL lines.
start=s.index('  function buildRebalancePreview() {')
end=s.index('  function renderRebalancePreview()', start)
rebalance_preview=r'''  function buildRebalancePreview() {
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

'''
s=s[:start]+rebalance_preview+s[end:]

# Make Execute Rebalance use the exact validated preview plan and display every SELL amount/value before execution.
start=s.index('  function buildExecutableRebalancePlan() {')
end=s.index('  function stockViewScore', start)
exec_block=r'''  function buildExecutableRebalancePlan() {
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

'''
s=s[:start]+exec_block+s[end:]

# Rename the top Rebalance tab to make it clear it is the non-executing preview.
s=s.replace('<button data-slx-inline-tab="rebalance" type="button">⚖ Rebalance</button>','<button data-slx-inline-tab="rebalance" type="button">⚖ Rebalance Preview</button>',1)

# Wrap the advanced controls and move them below presets/settings/PANIC area.
s=s.replace('<div class="slx-stock-view-controls">','<div id="slx-inline-advanced" class="slx-inline-advanced"><div class="slx-stock-view-controls">',1)
needle='<div id="slx-diagnostic-line" class="slx-inline-note"></div>\n        <div id="slx-inline-workspace"'
if needle not in s: raise SystemExit('advanced wrapper closing anchor missing')
s=s.replace(needle,'<div id="slx-diagnostic-line" class="slx-inline-note"></div></div>\n        <div id="slx-inline-workspace"',1)
insert="    if(before) host.insertBefore(card,before); else host.prepend(card);\n"
if insert not in s: raise SystemExit('inline insert anchor missing')
s=s.replace(insert,insert+"    const advanced=$('#slx-inline-advanced',card), configBox=$('#slx-inline-config',card); if(advanced&&configBox) configBox.after(advanced);\n",1)

# Fix Settings gear: visible state, scroll to settings when opening, and active state.
old="    $('#slx-inline-settings',card).onclick=()=>{const cfg=$('#slx-inline-config',card);cfg.hidden=!cfg.hidden;};"
if old not in s: raise SystemExit('settings handler anchor missing')
new="    $('#slx-inline-settings',card).onclick=()=>{const cfg=$('#slx-inline-config',card),btn=$('#slx-inline-settings',card);if(!cfg)return;const opening=cfg.hidden;cfg.hidden=!opening;btn.dataset.active=opening?'1':'0';btn.textContent=opening?'⚙✓':'⚙';if(opening)setTimeout(()=>cfg.scrollIntoView({behavior:'smooth',block:'nearest'}),30);};"
s=s.replace(old,new,1)

# API test should expose the actual endpoint/permission error instead of only 'Error'.
old="    $('#slx-api-test',p).onclick=async()=>{try{saveApiKeyFromPanel();await syncAllApi();}catch(e){setApiBadge('Error','warn');status(e.message,'bad');}};"
if old not in s: raise SystemExit('api test binding anchor missing')
new="    $('#slx-api-test',p).onclick=async()=>{try{saveApiKeyFromPanel();await syncAllApi();}catch(e){const msg=String(e?.message||'API test failed');setApiBadge('Error','warn');status(`API test: ${msg}`,'bad');console.error(`[${APP.name}] API test failed`,e);}};"
s=s.replace(old,new,1)

# UI styling for advanced section and visible gear state.
css_anchor='#slx-stock-inline .slx-v070-toolbar select{max-width:140px}'
if css_anchor not in s: raise SystemExit('css anchor missing')
s=s.replace(css_anchor,'#slx-stock-inline .slx-inline-advanced{display:grid;gap:8px;padding-top:9px;margin-top:2px;border-top:1px solid #243548}#slx-stock-inline #slx-inline-settings[data-active="1"]{border-color:#3b8ec9;color:#9bd5ff;background:#123653}'+css_anchor,1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.7.2**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.7.2** fixes Torn API key testing/sync with API v2 endpoints, repairs the inline Settings gear, moves advanced Sort/Filter/Watchlist/Rebalance controls below the preset/PANIC/settings area, and fixes NaN SELL quantities in Guided Rebalance.\n''',m,count=1,flags=re.S)
change='''### v0.7.2 — API, Inline Layout & Rebalance Fixes\n\n- Migrated API sync to current Torn API v2 endpoints: `user/money`, `user/stocks`, and `torn/stocks`.\n- Added normalization for the v2 user stocks array so existing portfolio/benefit logic continues to work.\n- API test errors now include the failing endpoint/permission message in the panel status instead of only showing `Error`.\n- Fixed Inline Settings gear: it now visibly toggles the settings block and scrolls it into view when opened.\n- Moved the complete advanced block (Sort, Filter, Search, Favorites, Target Lock, Compact, Diagnostics, Export/Import, Favorite Targets, Near %, Cash Target, Sell → Cash, Execute Rebalance and History) below the presets/settings/PANIC area.\n- Renamed the top Rebalance button to **Rebalance Preview** to clarify that it only previews a plan and never trades.\n- Fixed the optimizer row `price` field that could resolve to a page-global DOM value and produce `SELL NaN`.\n- Hardened rebalance calculations against non-finite prices/shares/proceeds.\n- Execute Rebalance now shows every planned SELL symbol, exact share count, estimated proceeds, total estimated sale, cash before/after SELL, reserve, and the planned BUY before the first confirmation.\n- Execute Rebalance still requires a second explicit confirmation before the BUY phase.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
m=m.replace('## Changelog\n','## Changelog\n'+change,1)
md.write_text(m,encoding='utf-8')
