from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

# Version bump.
for old,new in [
    ('// @version      0.2.0','// @version      0.3.0'),
    ("version: '0.2.0'","version: '0.3.0'"),
]:
    if old not in s:
        raise SystemExit(f'Missing version marker: {old}')
    s=s.replace(old,new,1)

# Dedicated API-key creator link, matching the SakaLuX API setup pattern.
anchor="""  const K = {
"""
insert="""  const REQUIRED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Stock%20Manager%20Advisor&user=money,stocks&torn=stocks';

  const K = {
"""
if anchor not in s: raise SystemExit('K anchor missing')
s=s.replace(anchor,insert,1)

# Add remove helper.
old="""  const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
  const bool = (k, d=false) => get(k, d?'1':'0') === '1';
"""
new="""  const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
  const del = k => { try { localStorage.removeItem(k); } catch {} };
  const bool = (k, d=false) => get(k, d?'1':'0') === '1';
"""
if old not in s: raise SystemExit('storage helper anchor missing')
s=s.replace(old,new,1)

# API key manager helpers, inserted before stock-catalog sync.
anchor="""  async function syncStockCatalog() {
"""
api_helpers="""  function setApiBadge(text, kind='idle') {
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
    renderAdvisor();
    status(`API connected · cash ${money(S.money||0)} · ${Object.keys(S.portfolio||{}).length} stock positions detected.`,'ok');
    return user;
  }

  function createRequiredApiKey() {
    try { sessionStorage.setItem('SakaLuX_STOCK_KEY_SETUP_PENDING','1'); } catch {}
    location.href=REQUIRED_API_KEY_URL;
  }

"""+anchor
if anchor not in s: raise SystemExit('syncStockCatalog anchor missing')
s=s.replace(anchor,api_helpers,1)

# Improve advisor empty-state now that API catalog sync works from any page.
s=s.replace("if(!rows.length){box.innerHTML='<div class=\"muted\">Open the Torn Stocks page so stock prices can be scanned.</div>';return;}",
            "if(!rows.length){box.innerHTML='<div class=\"muted\">Sync the API or open Torn Stocks to load stock prices and benefit progress.</div>';return;}",1)

# Add portfolio cards before renderAdvisor.
anchor="""  function renderAdvisor() {
"""
portfolio="""  function buildPortfolioRows() {
    scanStocks();
    const rows=[];
    for(const [sym,st] of S.stocks) {
      const owned=ownedShares(sym);
      if(!owned || !st.price) continue;
      const avg=averageBuy(sym);
      const value=owned*st.price;
      const cost=avg>0?owned*avg:null;
      const pl=cost===null?null:value-cost;
      const tier=benefitTier(sym,owned);
      rows.push({sym,owned,price:st.price,value,avg,cost,pl,tier:tier.tier,locked:tier.keep});
    }
    rows.sort((a,b)=>b.value-a.value||a.sym.localeCompare(b.sym));
    return rows;
  }

  function renderPortfolio() {
    const box=$('#slx-stock-portfolio-body'); if(!box) return;
    const rows=buildPortfolioRows();
    if(!rows.length){
      box.innerHTML='<div class=\"muted\">No portfolio data yet. Add/test the API key or open the Stocks page.</div>';
      return;
    }
    const totalValue=rows.reduce((n,r)=>n+r.value,0);
    const knownCost=rows.reduce((n,r)=>n+(r.cost||0),0);
    const knownValue=rows.reduce((n,r)=>n+(r.cost===null?0:r.value),0);
    const totalPl=knownValue-knownCost;
    const cash=Number(S.money)||currentMoneyFromDom()||0;
    box.innerHTML=`<div class=\"portfolio-summary\"><div><span>Positions</span><b>${rows.length}</b></div><div><span>Market value</span><b>${money(totalValue)}</b></div><div><span>Cash</span><b>${money(cash)}</b></div><div><span>Known P/L</span><b class=\"${totalPl>=0?'good':'bad'}\">${totalPl>=0?'+':''}${money(Math.abs(totalPl))}</b></div></div>`+
      `<div class=\"portfolio-list\">${rows.map(r=>`<div class=\"portfolio-row\"><div class=\"portfolio-sym\"><b>${esc(r.sym)}</b><small>${r.tier?'Benefit tier '+r.tier:'No active benefit'}</small></div><div><span>${r.owned.toLocaleString()} shares</span><small>@ ${money(r.price)}</small></div><div><span>${money(r.value)}</span><small>${r.avg?`avg ${money(r.avg)}`:'avg n/a'}</small></div><div>${r.pl===null?'<span class=\"muted\">P/L n/a</span>':`<span class=\"${r.pl>=0?'good':'bad'}\">${r.pl>=0?'+':''}${money(Math.abs(r.pl))}</span>`}<small>${r.locked?`${r.locked.toLocaleString()} protected`:'no lock floor'}</small></div></div>`).join('')}</div>`;
  }

"""+anchor
if anchor not in s: raise SystemExit('renderAdvisor anchor missing')
s=s.replace(anchor,portfolio,1)

# Extend styles with API manager and portfolio layout.
css_anchor="#slx-stock-panel .adv-row{display:grid;grid-template-columns:70px 1fr 1fr 1.4fr 1fr;gap:7px;padding:7px 0;border-bottom:1px solid #1c2a38;font-size:10px;align-items:center}\n"
css_extra=css_anchor+"""#slx-stock-panel .api-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}#slx-stock-panel .api-head .title{margin:0;flex:1}
#slx-stock-panel .api-badge{padding:4px 7px;border-radius:999px;border:1px solid #44566a;background:#121e2a;color:#98aabd;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}
#slx-stock-panel .api-badge[data-kind=\"ok\"]{border-color:#267c52;color:#63df9a;background:#0d281d}#slx-stock-panel .api-badge[data-kind=\"warn\"]{border-color:#8b6a1f;color:#ffd36b;background:#2a210d}
#slx-stock-panel .api-key-row{display:grid;grid-template-columns:1fr auto;gap:7px}#slx-stock-panel .api-help{margin-top:7px;font-size:10px;line-height:1.35;color:#8293a7}
#slx-stock-panel .portfolio-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}#slx-stock-panel .portfolio-summary>div{padding:8px;border:1px solid #23374a;border-radius:9px;background:#101a25;display:grid;gap:3px}#slx-stock-panel .portfolio-summary span,#slx-stock-panel .portfolio-row small{color:#8192a5;font-size:9px}#slx-stock-panel .portfolio-summary b{font-size:11px}
#slx-stock-panel .portfolio-list{display:grid;gap:6px}#slx-stock-panel .portfolio-row{display:grid;grid-template-columns:1.05fr 1.1fr 1.15fr 1.15fr;gap:7px;align-items:center;padding:8px;border:1px solid #1f3040;border-radius:9px;background:#0d1620;font-size:10px}#slx-stock-panel .portfolio-row>div{display:grid;gap:3px}.portfolio-sym b{font-size:12px;color:#dcecff}
"""
if css_anchor not in s: raise SystemExit('CSS advisor anchor missing')
s=s.replace(css_anchor,css_extra,1)
s=s.replace("@media(max-width:600px){#slx-stock-panel .grid{grid-template-columns:1fr}","@media(max-width:600px){#slx-stock-panel .grid{grid-template-columns:1fr}#slx-stock-panel .portfolio-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .portfolio-row{grid-template-columns:1fr 1fr}",1)

# Replace panel markup and wiring with dedicated API section + portfolio section.
start=s.find("    p.innerHTML=`<div class=\\\"card\\\"")
if start<0:
    # actual source contains normal escaped JS template string representation, not Python-escaped literal
    start=s.find('    p.innerHTML=`<div class="card"')
end=s.find("    return p;\n  }",start)
if start<0 or end<0: raise SystemExit('panel block bounds missing')
end += len("    return p;\n  }")
new_panel='''    p.innerHTML=`<div class="card"><div class="head"><div>📊</div><h2>${APP.name} <span class="muted">v${APP.version} · EXPERIMENTAL</span></h2><button class="close" type="button">×</button></div><div class="body">
      <div class="section"><div class="api-head"><div class="title">Torn API Key</div><span id="slx-stock-api-badge" class="api-badge">${get(K.api)?'Saved':'Not configured'}</span></div>
        <div class="api-key-row"><input id="slx-stock-api" type="password" autocomplete="off" placeholder="Paste Torn API key"><button id="slx-api-show" type="button" title="Show / hide API key">👁</button></div>
        <div class="actions"><button id="slx-api-save" class="primary" type="button">Save Key</button><button id="slx-api-test" type="button">Test & Sync</button><button id="slx-api-create" type="button">Create Required Key</button><button id="slx-api-clear" class="danger" type="button">Clear</button></div>
        <div class="api-help">Required selections: <b>user → money, stocks</b> and <b>torn → stocks</b>. The key is stored locally in this experimental script.</div>
      </div>
      <div class="section"><div class="title">Vault & Panic</div><div class="grid">
        <label>Vault target <select id="slx-stock-target"><option value="">Sync API or open Stocks to detect symbols</option></select></label>
        <label>Keep cash <input id="slx-stock-keep" value="${esc(get(K.keep,'0'))}" placeholder="e.g. 250k"></label>
        <label>Withdraw amount <input id="slx-stock-withdraw" value="${esc(get(K.withdraw,'1m'))}" placeholder="e.g. 1m"></label>
      </div><div class="actions"><button id="slx-vault-max" class="primary">Vault Max</button><button id="slx-vault-keep">Vault (Keep)</button><button id="slx-withdraw">Withdraw</button><button id="slx-withdraw-all">Withdraw All</button></div>
      <div class="actions"><label><input id="slx-benefit-lock" type="checkbox"> Lock Benefits</label><label><input id="slx-panic-confirm" type="checkbox"> Confirm Panic</label></div></div>
      <div class="section"><div class="title">Portfolio</div><div id="slx-stock-portfolio-body" class="muted">Waiting for portfolio data…</div></div>
      <div class="section"><div class="title">Advisor</div><div id="slx-stock-advisor-body" class="muted">Waiting for stock data…</div></div>
      <div id="slx-stock-status">Experimental build. Not registered in SakaLuX Hub or Standalone.</div>
    </div></div>`;
    document.body.appendChild(p); S.panel=p; S.status=$('#slx-stock-status',p);
    $('.close',p).onclick=()=>p.dataset.open='0';
    $('#slx-stock-api',p).value=get(K.api);
    $('#slx-stock-api-badge',p).dataset.kind=get(K.api)?'idle':'idle';
    $('#slx-benefit-lock',p).checked=bool(K.benefitLock,true);
    $('#slx-panic-confirm',p).checked=bool(K.panicConfirm,false);
    $('#slx-api-show',p).onclick=()=>{const i=$('#slx-stock-api',p);i.type=i.type==='password'?'text':'password';};
    $('#slx-api-save',p).onclick=()=>{try{saveApiKeyFromPanel();}catch(e){status(e.message,'bad');}};
    $('#slx-api-test',p).onclick=async()=>{try{saveApiKeyFromPanel();await syncAllApi();}catch(e){setApiBadge('Error','warn');status(e.message,'bad');}};
    $('#slx-api-create',p).onclick=createRequiredApiKey;
    $('#slx-api-clear',p).onclick=clearApiKey;
    $('#slx-stock-keep',p).onchange=e=>set(K.keep,e.target.value);
    $('#slx-stock-withdraw',p).onchange=e=>set(K.withdraw,e.target.value);
    $('#slx-benefit-lock',p).onchange=e=>set(K.benefitLock,e.target.checked?'1':'0');
    $('#slx-panic-confirm',p).onchange=e=>set(K.panicConfirm,e.target.checked?'1':'0');
    $('#slx-stock-target',p).onchange=e=>{set(K.target,e.target.value);renderPortfolio();renderAdvisor();};
    $('#slx-vault-max',p).onclick=()=>vault().then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    $('#slx-vault-keep',p).onclick=()=>vault({keep:parseAmount($('#slx-stock-keep',p).value)}).then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    $('#slx-withdraw',p).onclick=()=>withdrawCash(parseAmount($('#slx-stock-withdraw',p).value)).then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    $('#slx-withdraw-all',p).onclick=()=>withdrawAll().then(()=>syncAllApi().catch(()=>{})).catch(e=>status(e.message,'bad'));
    return p;
  }'''
s=s[:start]+new_panel+s[end:]

# Open panel now renders portfolio too.
old="  function openPanel() { style(); panel(); refreshTargetSelect(); renderAdvisor(); S.panel.dataset.open='1'; }"
new="  function openPanel() { style(); panel(); refreshTargetSelect(); renderPortfolio(); renderAdvisor(); S.panel.dataset.open='1'; }"
if old not in s: raise SystemExit('openPanel anchor missing')
s=s.replace(old,new,1)

# If user returns from API key creation page, open panel as a reminder.
old="""    style(); restoreCache(); panicButton(); managerLauncher();
"""
new="""    style(); restoreCache(); panicButton(); managerLauncher();
    try { if(sessionStorage.getItem('SakaLuX_STOCK_KEY_SETUP_PENDING')==='1'){sessionStorage.removeItem('SakaLuX_STOCK_KEY_SETUP_PENDING');setTimeout(openPanel,700);} } catch {}
"""
if old not in s: raise SystemExit('init anchor missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

# Update experimental changelog / roadmap only.
md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=m.replace('**v0.2.0**','**v0.3.0**',1)
m=m.replace('- Optional Torn API sync for money and portfolio data.','- Dedicated Torn API Key Manager with Save, Show/Hide, Test & Sync, Create Required Key and Clear controls.\n- Torn API sync for money, portfolio positions and the public stock catalog.\n- Portfolio dashboard with position count, market value, cash, known unrealized P/L, per-stock benefit tier and protected-share floor.',1)
m=m.replace('- PANIC uses the configured vault target, navigates to Stocks when required, then buys the maximum affordable shares after the configured keep-cash amount.','- PANIC uses the configured vault target and buys directly from the current Torn page without navigating to Stocks.',1)
marker='## Current release note\n'
st=m.find(marker)
if st>=0:
    st+=len(marker); en=m.find('\n## ',st); en=len(m) if en<0 else en
    m=m[:st]+"\n**v0.3.0** adds the SakaLuX-style API Key Manager and the first full Portfolio dashboard. API setup can create the required Torn key, save/show/test/clear it, synchronize cash + holdings + stock prices, and render portfolio value/P&L/benefit protection from any Torn page.\n"+m[en:]
m=m.replace('- Panic depends on the configured target being visible and tradeable on the Torn Stocks page.','- Direct trade endpoints and returned response shapes remain experimental and must be verified in TornPDA with small transactions first.',1)
m=m.replace('- **v0.2.x:** full portfolio cards, richer P/L, configurable withdrawal presets and transaction history.\n- **v0.3.x:** benefit-value database and true ROI ranking.', '- **v0.3.x:** benefit-value database, true ROI ranking, configurable withdrawal presets and transaction history.\n- **v0.4.x:** Trade Assistant with buy/sell suggestions and liquidity-gap calculations.',1)
# Remove duplicate existing v0.4 roadmap line if created by replacement.
m=m.replace('- **v0.4.x:** Trade Assistant with buy/sell suggestions and liquidity-gap calculations.\n- **v0.4.x:** Trade Assistant with buy/sell suggestions and liquidity-gap calculations.','- **v0.4.x:** Trade Assistant with buy/sell suggestions and liquidity-gap calculations.')
h='## Changelog\n'
entry='''### v0.3.0 — API Key Manager & Portfolio\n\n- Added a dedicated API Key section matching the SakaLuX module workflow.\n- Added Save Key, Show/Hide, Test & Sync, Create Required Key and Clear controls.\n- Added a prefilled Torn API-key creation link requesting user money/stocks and torn stocks selections.\n- Added API connection status feedback and synchronized target-stock discovery from any Torn page.\n- Added Portfolio summary: position count, market value, cash and known unrealized P/L.\n- Added per-position shares, current value, average buy when available, benefit tier and Benefit Lock floor.\n- Refreshes portfolio/advisor data after successful vault/withdraw actions when an API key is available.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
if h in m and '### v0.3.0 — API Key Manager & Portfolio' not in m:
    m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
