from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')
if '// @version      0.7.0' not in s: raise SystemExit('expected v0.7.0')
s=s.replace('// @version      0.7.0','// @version      0.7.1',1)
s=s.replace("version: '0.7.0'","version: '0.7.1'",1)
s=s.replace('Experimental Torn stock workspace with watchlist, safety center, diagnostics, searchable native tools, ROI, Panic v2 and hardened direct trades.','Experimental Torn stock workspace with complete roadmap tools: favorite targets, cash-target selling, transaction history, configurable benefit alerts, guided rebalance, diagnostics and hardened trades.',1)

# Storage keys
anchor="    rowSearch: 'SLX_STOCK_ROW_SEARCH'\n"
if anchor not in s: raise SystemExit('rowSearch key anchor missing')
s=s.replace(anchor,"    rowSearch: 'SLX_STOCK_ROW_SEARCH',\n    targetFavorites: 'SLX_STOCK_TARGET_FAVORITES',\n    cashTarget: 'SLX_STOCK_CASH_TARGET',\n    txHistory: 'SLX_STOCK_TRANSACTION_HISTORY'\n",1)

# Completion helpers before stockViewScore
anchor='  function stockViewScore(sym, mode) {'
if anchor not in s: raise SystemExit('stockViewScore anchor missing')
helpers=r'''  function favoriteTargets() {
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
    const target=buildRoiCandidates()[0]; if(!target) return null;
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom()), need=Math.max(0,target.cost-cash), sources=[];
    let remaining=need;
    for(const r of buildOptimizerRows().filter(x=>x.sym!==target.sym&&x.freeShares>0).sort((a,b)=>b.freeValue-a.freeValue)){
      if(remaining<=0) break; const shares=Math.min(r.freeShares,Math.ceil(remaining/r.price)); if(shares<=0) continue; const value=shares*r.price; sources.push({sym:r.sym,shares,value}); remaining=Math.max(0,remaining-value);
    }
    return {target,cash,need,sources,shortfall:remaining};
  }
  async function executeGuidedRebalance() {
    const plan=buildExecutableRebalancePlan(); if(!plan) throw new Error('No ROI rebalance candidate available.');
    if(plan.shortfall>0) throw new Error(`Rebalance still needs ${money(plan.shortfall)} after all free/excess shares.`);
    const sells=plan.sources.map(x=>`SELL ${x.shares.toLocaleString()} ${x.sym} ≈ ${money(x.value)}`).join('\n')||'No sales required';
    if(!confirm(`Guided Rebalance\n\n${sells}\n\nThen BUY ${plan.target.sharesNeeded.toLocaleString()} ${plan.target.sym} ≈ ${money(plan.target.cost)}\nTarget Tier ${plan.target.tier}\n\nBenefit floors are preserved. Continue with SELL phase?`)) return;
    for(const x of plan.sources){ await postTrade(x.sym,x.shares,'sellShares'); if(!isDryRun()) await new Promise(r=>setTimeout(r,1650)); }
    if(get(K.api).trim()&&!isDryRun()) await apiSync();
    if(!confirm(`SELL phase complete${isDryRun()?' (Dry Run)':''}.\n\nProceed with BUY ${plan.target.sharesNeeded.toLocaleString()} ${plan.target.sym} toward Tier ${plan.target.tier}?`)){inlineStatus('Rebalance stopped before BUY phase.','warn');return;}
    if(!isDryRun() && tradeCooldownRemaining()>0) await new Promise(r=>setTimeout(r,Math.max(1650,tradeCooldownRemaining()+100)));
    await postTrade(plan.target.sym,plan.target.sharesNeeded,'buyShares'); if(get(K.api).trim()&&!isDryRun()) await apiSync(); refreshInlinePanel(); renderTransactionHistory(); inlineStatus(`Guided rebalance finished for ${plan.target.sym}.`,'ok');
  }

'''
s=s.replace(anchor,helpers+anchor,1)

# Mirror BUY/SELL entries into independent transaction history.
anchor="    set(K.actionLog,JSON.stringify(rows.slice(0,40)));\n"
if anchor not in s: raise SystemExit('addActionLog anchor missing')
s=s.replace(anchor,anchor+'    addTransactionHistory(entry);\n',1)

# Full-panel transaction history before Action Log.
anchor='      <div class="section"><div class="api-head"><div class="title">Action Log</div><button id="slx-log-clear" type="button">Clear Log</button></div><div id="slx-stock-action-log" class="action-list muted">No stock actions logged yet.</div></div>\n'
if anchor not in s: raise SystemExit('Action Log panel anchor missing')
history='''      <div class="section"><div class="api-head"><div class="title">Transaction History</div><div><select id="slx-tx-filter"><option value="all">All</option><option value="buy">BUY</option><option value="sell">SELL</option></select> <input id="slx-tx-search" placeholder="Search symbol/status…" style="max-width:170px"></div></div><div id="slx-stock-tx-history" class="action-list muted">No transactions yet.</div></div>\n'''
s=s.replace(anchor,history+anchor,1)

# Ensure panel render includes transaction history.
s=s.replace("safeRender('Trade Assistant',renderTradeAssistant); safeRender('Action Log',renderActionLog);","safeRender('Trade Assistant',renderTradeAssistant); safeRender('Transaction History',renderTransactionHistory); safeRender('Action Log',renderActionLog);",1)

# Expand v0.7 toolbar with all remaining roadmap controls.
anchor='<input id="slx-import-file" type="file" accept="application/json" hidden></div>'
if anchor not in s: raise SystemExit('v070 toolbar anchor missing')
extra='<input id="slx-import-file" type="file" accept="application/json" hidden><button id="slx-target-fav-toggle" type="button">☆ Target</button><select id="slx-target-favorites"><option value="">Favorite targets…</option></select><label>Near % <input id="slx-near-pct" inputmode="decimal" value="90" style="width:55px"></label><label>Cash target <input id="slx-cash-target" value="0" placeholder="e.g. 50m" style="width:85px"></label><button id="slx-sell-cash-target" type="button">Sell → Cash</button><button id="slx-exec-rebalance" type="button">Execute Rebalance</button><button id="slx-history-open" type="button">History</button></div>'
s=s.replace(anchor,extra,1)

# Bind completion controls after existing import binding.
anchor="    const im=$('#slx-import',card), fi=$('#slx-import-file',card); if(im&&fi){im.onclick=()=>fi.click();fi.onchange=()=>importStockManagerData(fi.files?.[0]);}\n"
if anchor not in s: raise SystemExit('import binding anchor missing')
binds=r'''    refreshRoadmapControls();
    const tf=$('#slx-target-fav-toggle',card); if(tf) tf.onclick=()=>toggleFavoriteTarget(get(K.target));
    const ts=$('#slx-target-favorites',card); if(ts) ts.onchange=()=>{if(ts.value&&setTargetSafely(ts.value)) refreshRoadmapControls();};
    const nb=$('#slx-near-pct',card); if(nb) nb.onchange=()=>{const v=Math.max(50,Math.min(99.9,Number(nb.value)||90));set(K.nearBenefitPct,String(v));nb.value=String(v);enhanceStockRows();inlineStatus(`Near-benefit alert set to ${v}%.`,'ok');};
    const ct=$('#slx-cash-target',card); if(ct) ct.onchange=()=>set(K.cashTarget,ct.value);
    const sc=$('#slx-sell-cash-target',card); if(sc) sc.onclick=()=>sellToCashTarget().catch(e=>inlineStatus(e.message,'bad'));
    const er=$('#slx-exec-rebalance',card); if(er) er.onclick=()=>executeGuidedRebalance().catch(e=>inlineStatus(e.message,'bad'));
    const ho=$('#slx-history-open',card); if(ho) ho.onclick=()=>{openPanel();setTimeout(()=>$('#slx-stock-tx-history')?.scrollIntoView({behavior:'smooth',block:'center'}),50);};
'''
s=s.replace(anchor,anchor+binds,1)

# CSS small additions.
media='@media(max-width:600px){'
if media not in s: raise SystemExit('mobile CSS anchor missing')
css='#slx-stock-inline .slx-v070-toolbar select{max-width:140px}#slx-stock-inline .slx-v070-toolbar #slx-exec-rebalance{border-color:#3b8ec9;color:#9bd5ff}#slx-stock-inline .slx-v070-toolbar #slx-sell-cash-target{border-color:#8b6a1f;color:#ffd36b}'
s=s.replace(media,css+media,1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.7.1**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.7.1** completes the previously listed roadmap gaps: favorite target presets, Sell-to-Cash target, dedicated searchable transaction history, configurable near-benefit threshold and a user-confirmed guided SELL → BUY rebalance workflow.\n''',m,count=1,flags=re.S)
change='''### v0.7.1 — Roadmap Completion\n\n- Added a separate **Favorite Targets** list, independent from the general stock watchlist.\n- Added **Sell → Cash** with a configurable cash target; Benefit Lock limits shares that may be sold.\n- Added dedicated persistent **Transaction History** (up to 200 BUY/SELL records), separate from the general Action Log.\n- Transaction History includes BUY/SELL filter, text search, timestamp, shares, estimated value, status and server/log message.\n- Added an inline **Near Benefit %** control; the existing near-benefit alert threshold is now user configurable.\n- Added **Execute Rebalance**, a guided two-phase SELL → BUY flow using only free/excess shares for funding and preserving protected benefit floors.\n- Guided Rebalance requires explicit confirmation before the SELL phase and a second explicit confirmation before BUY.\n- Dry Run, trade serialization, 1.5 second cooldown and Action Log remain active for every guided transaction.\n- Added a History shortcut directly in the Stock Market toolbar.\n- API key remains excluded from Export/Import backup data.\n- This closes the outstanding feature ideas previously listed for the 0.7 roadmap.\n\n'''
m=m.replace('## Changelog\n','## Changelog\n'+change,1)
md.write_text(m,encoding='utf-8')
