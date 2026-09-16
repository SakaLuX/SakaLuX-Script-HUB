from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

# Version.
s=s.replace('// @version      0.4.0','// @version      0.4.1',1)
s=s.replace("version: '0.4.0'","version: '0.4.1'",1)
s=s.replace('Experimental Torn stock vault manager with ROI advisor, benefit valuation, trade assistant and one-tap Panic vault.','Experimental Torn stock vault manager with hardened trades, ROI advisor, benefit valuation, Trade Assistant and one-tap Panic vault.',1)

# Storage keys.
old="""    tx: 'SLX_STOCK_TX_CACHE',
    benefitValues: 'SLX_STOCK_BENEFIT_VALUES'
"""
new="""    tx: 'SLX_STOCK_TX_CACHE',
    benefitValues: 'SLX_STOCK_BENEFIT_VALUES',
    dryRun: 'SLX_STOCK_DRY_RUN',
    actionLog: 'SLX_STOCK_ACTION_LOG'
"""
if old not in s: raise SystemExit('storage marker missing')
s=s.replace(old,new,1)

# Runtime trade state.
old="const S = { stocks:new Map(), portfolio:{}, money:null, panel:null, status:null, benefitPrices:{} };"
new="const S = { stocks:new Map(), portfolio:{}, money:null, panel:null, status:null, benefitPrices:{}, tradeBusy:false, lastTradeAt:0 };"
if old not in s: raise SystemExit('state marker missing')
s=s.replace(old,new,1)

# Insert safety helpers before postTrade.
marker='  function postTrade(sym, shares, step) {'
idx=s.find(marker)
if idx<0: raise SystemExit('postTrade marker missing')
helpers=r'''  function loadActionLog() {
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

'''
s=s[:idx]+helpers+s[idx:]

# Replace postTrade with hardened implementation.
start=s.find('  function postTrade(sym, shares, step) {')
end=s.find('\n  async function vault(',start)
if start<0 or end<0: raise SystemExit('postTrade block bounds missing')
new_post=r'''  async function postTrade(sym, shares, step) {
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
'''
s=s[:start]+new_post+s[end:]

# Remove stale duplicate advisor renderer left from previous experimental patch.
legacy=re.compile(r'''\n  function renderAdvisor\(\) \{\n    const box=\$\('#slx-stock-advisor-body'\); if\(!box\) return;\n    const rows=buildAdvisorRows\(\);.*?\n  \}\n''',re.S)
s,n=legacy.subn('\n',s,count=1)
if n!=1: raise SystemExit('legacy duplicate renderAdvisor not found')

# Add CSS for disabled/dry-run/action log.
css_marker='#slx-stock-panel .primary{background:#194f86;border-color:#2e77b9} #slx-stock-panel .danger{background:#64131c;border-color:#a92c3b} #slx-stock-panel .good{color:#55d98a}.bad{color:#ff6b78}.muted{color:#8392a4}'
css_add=css_marker+' #slx-stock-panel .warn{color:#ffd36b} #slx-stock-panel button:disabled,#slx-stock-panic:disabled{opacity:.5;cursor:not-allowed} #slx-stock-panel[data-trading="1"] .card{outline:1px solid #8b6a1f}'
if css_marker not in s: raise SystemExit('css marker missing')
s=s.replace(css_marker,css_add,1)
media='@media(max-width:600px)'
extra='#slx-stock-panel .safety-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#slx-stock-panel .action-list{display:grid;gap:5px;max-height:230px;overflow:auto}#slx-stock-panel .action-row{display:grid;grid-template-columns:1.25fr .8fr .8fr 1fr 1.4fr;gap:6px;padding:6px 0;border-bottom:1px solid #1c2a38;font-size:9px;align-items:center}\n'
if media not in s: raise SystemExit('media marker missing')
s=s.replace(media,extra+media,1)
s=s.replace('@media(max-width:600px){','@media(max-width:600px){#slx-stock-panel .safety-grid{grid-template-columns:1fr}#slx-stock-panel .action-row{grid-template-columns:1fr 1fr}.action-row span:nth-child(n+3){grid-column:2/3}',1)

# Add safety + action-log sections before Portfolio.
panel_marker='''      <div class="section"><div class="title">Portfolio</div><div id="slx-stock-portfolio-body" class="muted">Waiting for portfolio data…</div></div>'''
panel_add='''      <div class="section"><div class="title">Safety</div><div class="safety-grid"><label><input id="slx-dry-run" type="checkbox"> Dry Run · calculate/log only, never send BUY/SELL</label><div class="muted">Trades are serialized and protected by a 1.5s anti-double-click cooldown.</div></div></div>
      <div class="section"><div class="api-head"><div class="title">Action Log</div><button id="slx-log-clear" type="button">Clear Log</button></div><div id="slx-stock-action-log" class="action-list muted">No stock actions logged yet.</div></div>
'''+panel_marker
if panel_marker not in s: raise SystemExit('panel portfolio marker missing')
s=s.replace(panel_marker,panel_add,1)

# Bind dry run + log clear.
bind_marker="""    $('#slx-panic-confirm',p).checked=bool(K.panicConfirm,false);
"""
bind_add=bind_marker+"    $('#slx-dry-run',p).checked=bool(K.dryRun,true);\n"
if bind_marker not in s: raise SystemExit('bind marker missing')
s=s.replace(bind_marker,bind_add,1)
change_marker="""    $('#slx-panic-confirm',p).onchange=e=>set(K.panicConfirm,e.target.checked?'1':'0');
"""
change_add=change_marker+"    $('#slx-dry-run',p).onchange=e=>{set(K.dryRun,e.target.checked?'1':'0');status(`Dry Run ${e.target.checked?'enabled':'disabled'}.`,e.target.checked?'warn':'ok');};\n    $('#slx-log-clear',p).onclick=clearActionLog;\n"
if change_marker not in s: raise SystemExit('change marker missing')
s=s.replace(change_marker,change_add,1)

# Ensure action log renders whenever panel opens.
old="function openPanel() { style(); panel(); refreshTargetSelect(); renderPortfolio(); renderBenefitValues(); renderAdvisor(); renderTradeAssistant(); S.panel.dataset.open='1'; }"
new="function openPanel() { style(); panel(); refreshTargetSelect(); renderPortfolio(); renderBenefitValues(); renderAdvisor(); renderTradeAssistant(); renderActionLog(); S.panel.dataset.open='1'; }"
if old not in s: raise SystemExit('openPanel marker missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

# Changelog.
md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.4.1**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.4.1** hardens every stock transaction with a global trade lock, anti-double-click cooldown, stricter Torn response validation, Dry Run mode and a persistent local action log. It also removes a stale duplicate Advisor renderer left by the previous experimental patch.\n''',m,count=1,flags=re.S)
h='## Changelog\n'
entry='''### v0.4.1 — Trade Hardening & Safety\n\n- Added global transaction lock so two BUY/SELL requests cannot run concurrently.\n- Added 1.5-second anti-double-click cooldown.\n- Added stricter HTTP / Torn-response validation and session-token validation.\n- Added **Dry Run** mode: calculations and logs run, but no BUY/SELL request is sent.\n- Added persistent local Action Log for BUY, SELL, errors and Dry Run simulations.\n- Disabled trade controls while a real stock request is in progress.\n- Added estimated transaction value to each action-log entry.\n- Fixed a stale duplicate `renderAdvisor()` implementation that could override the ROI Advisor at runtime.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
if h in m and '### v0.4.1 — Trade Hardening & Safety' not in m: m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
