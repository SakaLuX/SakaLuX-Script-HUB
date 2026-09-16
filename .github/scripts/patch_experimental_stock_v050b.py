from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

if '// @version      0.4.2' not in s:
    raise SystemExit('expected v0.4.2 source')
s=s.replace('// @version      0.4.2','// @version      0.5.0',1)
s=s.replace("version: '0.4.2'","version: '0.5.0'",1)
s=s.replace('Experimental Torn stock vault manager with Panic v2, hardened trades, ROI advisor, benefit valuation and Trade Assistant.','Experimental Torn stock portfolio optimizer with ROI, bank comparison, payback analysis, Panic v2 and hardened Trade Assistant.',1)

s=s.replace("    panicUseAll: 'SLX_STOCK_PANIC_USE_ALL'\n", "    panicUseAll: 'SLX_STOCK_PANIC_USE_ALL',\n    bankApr: 'SLX_STOCK_BANK_APR',\n    optimizerMinApr: 'SLX_STOCK_OPTIMIZER_MIN_APR'\n",1)

s=s.replace("""      const annual=daily*365;
      const roi=marginalCapital>0?(annual/marginalCapital)*100:0;
      if(!(roi>0)) continue;
      rows.push({sym,model,tier:tier.tier+1,owned,targetShares,sharesNeeded,price:st.price,cost,marginalCapital,daily,annual,roi,affordable:cash>=cost,cash});
""","""      const annual=daily*365;
      const roi=marginalCapital>0?(annual/marginalCapital)*100:0;
      if(!(roi>0)) continue;
      const bankApr=Math.max(0,Number(get(K.bankApr,'0'))||0);
      const paybackDays=daily>0?marginalCapital/daily:Infinity;
      rows.push({sym,model,tier:tier.tier+1,owned,targetShares,sharesNeeded,price:st.price,cost,marginalCapital,daily,annual,roi,paybackDays,bankApr,bankDelta:roi-bankApr,beatsBank:bankApr>0?roi>bankApr:null,affordable:cash>=cost,cash});
""",1)

marker='  function renderAdvisor() {'
idx=s.find(marker)
if idx<0: raise SystemExit('renderAdvisor marker missing')
optimizer=r'''  function buildOptimizerRows() {
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
      rows.push({sym,owned,price,tier:tier.tier,protectedShares,freeShares,protectedValue,freeValue,currentApr,nextGap,nextCost,signal,bankApr,minApr});
    }
    return rows.sort((a,b)=>({weak:0,excess:1,hold:2}[a.signal]-{weak:0,excess:1,hold:2}[b.signal]) || b.freeValue-a.freeValue || b.currentApr-a.currentApr);
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

'''
s=s[:idx]+optimizer+s[idx:]

old_line="""    box.innerHTML=rows.slice(0,10).map((r,index)=>`<div class=\"roi-row\"><b>#${index+1} ${r.sym}</b><span>Tier ${r.tier}</span><span>${r.roi.toFixed(2)}% APR</span><span>${money(r.cost)} gap</span><span>${money(r.daily)}/day est.</span><span class=\"${r.affordable?'good':'muted'}\">${r.affordable?'Affordable':'Missing '+money(Math.max(0,r.cost-r.cash))}</span></div>`).join('');
"""
new_line="""    box.innerHTML=rows.slice(0,10).map((r,index)=>`<div class=\"roi-row\"><b>#${index+1} ${r.sym}</b><span>Tier ${r.tier}</span><span>${r.roi.toFixed(2)}% APR</span><span>${Math.round(r.paybackDays).toLocaleString()}d payback</span><span>${money(r.cost)} gap</span><span>${money(r.daily)}/day</span><span class=\"${r.bankApr?(r.beatsBank?'good':'bad'):'muted'}\">${r.bankApr?`${r.bankDelta>=0?'+':''}${r.bankDelta.toFixed(2)}pp vs bank`:'Bank APR n/a'}</span><span class=\"${r.affordable?'good':'muted'}\">${r.affordable?'Affordable':'Missing '+money(Math.max(0,r.cost-r.cash))}</span></div>`).join('');
"""
if old_line not in s: raise SystemExit('advisor line missing')
s=s.replace(old_line,new_line,1)

s=s.replace('    renderAdvisor();\n    renderTradeAssistant();','    renderAdvisor();\n    renderOptimizer();\n    renderTradeAssistant();',1)
s=s.replace('    renderBenefitValues(); renderAdvisor(); renderTradeAssistant();','    renderBenefitValues(); renderAdvisor(); renderOptimizer(); renderTradeAssistant();',1)

media='@media(max-width:600px)'
css='#slx-stock-panel .optimizer-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:8px}#slx-stock-panel .optimizer-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}#slx-stock-panel .optimizer-summary>div{display:grid;gap:3px;padding:8px;border:1px solid #23374a;border-radius:9px;background:#101a25}#slx-stock-panel .optimizer-summary span{font-size:9px;color:#8293a7}#slx-stock-panel .optimizer-pick{display:grid;gap:3px;padding:8px;margin-bottom:7px;border:1px solid #365a78;border-radius:9px;background:#0e1c29}.optimizer-pick span,.optimizer-pick small{font-size:9px;color:#9fb3c6}#slx-stock-panel .optimizer-list{display:grid;gap:5px;max-height:310px;overflow:auto}#slx-stock-panel .optimizer-row{display:grid;grid-template-columns:62px 1fr 1fr 1fr 1.25fr;gap:6px;padding:7px;border:1px solid #203142;border-radius:8px;background:#0d1620;font-size:9px;align-items:center}.optimizer-row>div{display:grid;gap:3px}.optimizer-row small{color:#8293a7}\n'
if media not in s: raise SystemExit('media missing')
s=s.replace(media,css+media,1)
s=s.replace('@media(max-width:600px){','@media(max-width:600px){#slx-stock-panel .optimizer-controls{grid-template-columns:1fr}#slx-stock-panel .optimizer-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-panel .optimizer-row{grid-template-columns:1fr 1fr}.optimizer-row>div:nth-child(5){grid-column:1/3}',1)

trade='''      <div class="section"><div class="title">Trade Assistant</div><div id="slx-stock-trade-body" class="trade-list muted">Waiting for ROI data…</div></div>'''
opt='''      <div class="section"><div class="title">Portfolio Optimizer</div><div class="optimizer-controls"><label>Bank APR % <input id="slx-bank-apr" inputmode="decimal" value="${esc(get(K.bankApr,'0'))}" placeholder="e.g. 70"></label><label>Minimum acceptable APR % <input id="slx-opt-min-apr" inputmode="decimal" value="${esc(get(K.optimizerMinApr,'0'))}" placeholder="e.g. 50"></label></div><div class="api-help">Bank APR is manual so the comparison uses your actual current bank return instead of a guessed rate.</div><div id="slx-stock-optimizer-body" class="muted">Waiting for portfolio data…</div></div>
'''+trade
if trade not in s: raise SystemExit('trade section missing')
s=s.replace(trade,opt,1)

target="""    $('#slx-stock-target',p).onchange=e=>{set(K.target,e.target.value);const v=$('#slx-panic-preview',p);if(v){v.dataset.kind='';v.textContent='Target changed · run Preview PANIC again.';}renderPortfolio();renderAdvisor();};
"""
newtarget="""    $('#slx-bank-apr',p).onchange=e=>{set(K.bankApr,String(Math.max(0,Number(e.target.value)||0)));renderAdvisor();renderOptimizer();renderTradeAssistant();};
    $('#slx-opt-min-apr',p).onchange=e=>{set(K.optimizerMinApr,String(Math.max(0,Number(e.target.value)||0)));renderOptimizer();};
    $('#slx-stock-target',p).onchange=e=>{set(K.target,e.target.value);const v=$('#slx-panic-preview',p);if(v){v.dataset.kind='';v.textContent='Target changed · run Preview PANIC again.';}renderPortfolio();renderAdvisor();renderOptimizer();};
"""
if target not in s: raise SystemExit('target binding missing')
s=s.replace(target,newtarget,1)

s=s.replace('function openPanel() { style(); panel(); refreshTargetSelect(); renderPortfolio(); renderBenefitValues(); renderAdvisor(); renderTradeAssistant(); renderActionLog(); S.panel.dataset.open=\'1\'; }','function openPanel() { style(); panel(); refreshTargetSelect(); renderPortfolio(); renderBenefitValues(); renderAdvisor(); renderOptimizer(); renderTradeAssistant(); renderActionLog(); S.panel.dataset.open=\'1\'; }',1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.5.0**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.5.0** adds the Portfolio Optimizer with protected/free/weak capital analysis, configurable Bank APR comparison, minimum acceptable APR, payback days and Best ROI / Best Affordable opportunity cards.\n''',m,count=1,flags=re.S)
h='## Changelog\n'
entry='''### v0.5.0 — Portfolio Optimizer & Bank Comparison\n\n- Added Portfolio Optimizer for held stocks.\n- Splits holdings into Benefit-Lock protected shares and free/excess shares.\n- Calculates protected, excess/free and below-threshold capital.\n- Added manual Bank APR comparison and Minimum acceptable APR.\n- Added payback days and percentage-point comparison versus bank to ROI candidates.\n- Added Best ROI and Best Affordable optimizer opportunity cards.\n- Flags positions as Protected, Excess shares, or Below threshold.\n- Keeps Dry Run, Action Log, hardened trades and Panic v2 protections.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
if h in m and '### v0.5.0 — Portfolio Optimizer & Bank Comparison' not in m:m=m.replace(h,h+entry,1)
m=m.replace('- **v0.5.x:** bank comparison, daily income / cost model and benefit-aware portfolio optimizer.\n- **v0.5.x:** bank comparison, daily income / cost model and benefit-aware portfolio optimizer.','- **v0.5.x:** refine optimizer, income/cost modelling, rebalance preview and capital-allocation scenarios.')
md.write_text(m,encoding='utf-8')
