from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

if '// @version      0.5.0' not in s:
    raise SystemExit('expected v0.5.0 source')
s=s.replace('// @version      0.5.0','// @version      0.5.1',1)
s=s.replace("version: '0.5.0'","version: '0.5.1'",1)
s=s.replace('Experimental Torn stock portfolio optimizer with ROI, bank comparison, payback analysis, Panic v2 and hardened Trade Assistant.','Experimental Torn stock portfolio optimizer with rebalance preview, ROI, bank comparison, Panic v2 and hardened Trade Assistant.',1)

# Add rebalance settings keys.
s=s.replace("    optimizerMinApr: 'SLX_STOCK_OPTIMIZER_MIN_APR'\n", "    optimizerMinApr: 'SLX_STOCK_OPTIMIZER_MIN_APR',\n    rebalanceReserve: 'SLX_STOCK_REBALANCE_RESERVE'\n",1)

# Add safe renderer helper before renderOptimizer.
marker='  function renderOptimizer() {'
idx=s.find(marker)
if idx<0: raise SystemExit('renderOptimizer marker missing')
helper=r'''  function safeRender(name, fn) {
    try { fn(); return true; }
    catch(e) {
      console.error(`[${APP.name}] ${name} render failed`, e);
      status(`${name} render error: ${e.message}`,'bad');
      return false;
    }
  }

  function buildRebalancePreview() {
    const held=buildOptimizerRows();
    const candidates=buildRoiCandidates();
    const reserve=Math.max(0,parseAmount(get(K.rebalanceReserve,'0')));
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    const freeRows=held.filter(r=>r.freeShares>0).sort((a,b)=>b.freeValue-a.freeValue);
    const weakRows=held.filter(r=>r.signal==='weak').sort((a,b)=>a.currentApr-b.currentApr);
    const sources=[...freeRows,...weakRows.filter(w=>!freeRows.some(f=>f.sym===w.sym))];
    const sourceCapital=sources.reduce((n,r)=>n+(r.freeValue||0),0);
    const deployable=Math.max(0,cash+sourceCapital-reserve);
    const target=candidates.find(r=>r.cost<=deployable) || candidates[0] || null;
    if(!target) return {cash,reserve,sourceCapital,deployable,sources,target:null};
    const required=Math.max(0,target.cost-cash+reserve);
    let need=required;
    const sells=[];
    for(const r of sources) {
      if(need<=0) break;
      const value=Math.min(r.freeValue,need);
      const shares=Math.min(r.freeShares,Math.ceil(value/r.price));
      if(shares<=0) continue;
      const proceeds=shares*r.price;
      sells.push({sym:r.sym,shares,proceeds,currentApr:r.currentApr});
      need-=proceeds;
    }
    const funded=Math.max(0,target.cost-Math.max(0,need));
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

'''
s=s[:idx]+helper+s[idx:]

# CSS.
media='@media(max-width:600px)'
css='#slx-stock-panel .rebalance-controls{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-bottom:8px}#slx-stock-panel .rebalance-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}#slx-stock-panel .rebalance-summary>div{display:grid;gap:3px;padding:8px;border:1px solid #23374a;border-radius:9px;background:#101a25}.rebalance-summary span{font-size:9px;color:#8293a7}#slx-stock-panel .rebalance-target{display:grid;gap:3px;padding:9px;border:1px solid #365a78;border-radius:9px;background:#0e1c29;margin-bottom:7px}.rebalance-target span,.rebalance-target small{font-size:9px;color:#9fb3c6}#slx-stock-panel .rebalance-list{display:grid;gap:5px;margin-bottom:7px}.rebalance-row{display:grid;grid-template-columns:80px 1fr 1fr 1fr;gap:6px;padding:7px;border:1px solid #203142;border-radius:8px;background:#0d1620;font-size:9px;align-items:center}\n'
if media not in s: raise SystemExit('media marker missing')
s=s.replace(media,css+media,1)
s=s.replace('@media(max-width:600px){','@media(max-width:600px){#slx-stock-panel .rebalance-controls{grid-template-columns:1fr}#slx-stock-panel .rebalance-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .rebalance-row{grid-template-columns:1fr 1fr}',1)

# Add Rebalance Preview before Trade Assistant.
trade='''      <div class="section"><div class="title">Trade Assistant</div><div id="slx-stock-trade-body" class="trade-list muted">Waiting for ROI data…</div></div>'''
reb='''      <div class="section"><div class="title">Rebalance Preview</div><div class="rebalance-controls"><label>Cash reserve <input id="slx-rebalance-reserve" value="${esc(get(K.rebalanceReserve,'0'))}" placeholder="e.g. 10m"></label><button id="slx-rebalance-preview-btn" type="button">Build Preview</button></div><div class="api-help">Preview only: proposes which excess shares could be released and where capital could move. It never executes SELL/BUY automatically.</div><div id="slx-stock-rebalance-body" class="muted">Press Build Preview after syncing API and benefit values.</div></div>\n'''+trade
if trade not in s: raise SystemExit('trade section missing')
s=s.replace(trade,reb,1)

# Bind controls after optimizer min APR.
needle="""    $('#slx-opt-min-apr',p).onchange=e=>{set(K.optimizerMinApr,String(Math.max(0,Number(e.target.value)||0)));renderOptimizer();};
"""
repl=needle+"    $('#slx-rebalance-reserve',p).onchange=e=>{set(K.rebalanceReserve,e.target.value);renderRebalancePreview();};\n    $('#slx-rebalance-preview-btn',p).onclick=()=>safeRender('Rebalance Preview',renderRebalancePreview);\n"
if needle not in s: raise SystemExit('optimizer bind marker missing')
s=s.replace(needle,repl,1)

# Critical launcher fix: open immediately, then render each section safely so one broken renderer cannot keep panel hidden.
old="function openPanel() { style(); panel(); refreshTargetSelect(); renderPortfolio(); renderBenefitValues(); renderAdvisor(); renderOptimizer(); renderTradeAssistant(); renderActionLog(); S.panel.dataset.open='1'; }"
new="function openPanel() { style(); const p=panel(); p.dataset.open='1'; safeRender('Targets',refreshTargetSelect); safeRender('Portfolio',renderPortfolio); safeRender('Benefit Values',renderBenefitValues); safeRender('ROI Advisor',renderAdvisor); safeRender('Portfolio Optimizer',renderOptimizer); safeRender('Rebalance Preview',renderRebalancePreview); safeRender('Trade Assistant',renderTradeAssistant); safeRender('Action Log',renderActionLog); }"
if old not in s: raise SystemExit('openPanel marker missing')
s=s.replace(old,new,1)

# Guard launcher click itself and make it resilient on SPA rerenders.
old="""    b.onclick=openPanel; document.body.appendChild(b);
"""
new="""    b.onclick=()=>{try{openPanel();}catch(e){console.error(`[${APP.name}] open panel failed`,e);const p=S.panel;if(p?.isConnected)p.dataset.open='1';}}; document.body.appendChild(b);
"""
if old not in s: raise SystemExit('launcher marker missing')
s=s.replace(old,new,1)

# Keep launcher/panic alive after Torn SPA redraws.
old="""    const mo=new MutationObserver(()=>{ if(isStocks()) scanStocks(); });
    mo.observe(document.documentElement,{subtree:true,childList:true});
"""
new="""    const mo=new MutationObserver(()=>{ if(isStocks()) scanStocks(); if(!$('#slx-stock-open')) managerLauncher(); if(!$('#slx-stock-panic')) panicButton(); });
    mo.observe(document.documentElement,{subtree:true,childList:true});
"""
if old not in s: raise SystemExit('observer marker missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.5.1**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.5.1** fixes the Stock Manager launcher/panel regression and adds Rebalance Preview with cash reserve, excess-share release proposals, target opportunity selection, estimated funding shortfall and ROI-shift preview. The preview never executes trades.\n''',m,count=1,flags=re.S)
h='## Changelog\n'
entry='''### v0.5.1 — Panel Recovery & Rebalance Preview\n\n- Fixed the **Stock Manager** button/panel regression from v0.5.0.\n- Panel is opened before any renderer runs, so one failed section can no longer keep the entire panel hidden.\n- Added safe per-section rendering with console/status error reporting.\n- Launcher and PANIC buttons are restored automatically after Torn SPA redraws.\n- Added **Rebalance Preview** with configurable cash reserve.\n- Preview identifies excess/free shares that could be released without crossing the Benefit Lock floor.\n- Selects an ROI candidate and estimates required SELL sources, funding, shortfall, target shares, payback and approximate ROI shift.\n- Rebalance Preview is analysis-only and never executes SELL/BUY automatically.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
if h in m and '### v0.5.1 — Panel Recovery & Rebalance Preview' not in m:m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
