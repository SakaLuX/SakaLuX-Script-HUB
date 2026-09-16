from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

if '// @version      0.5.2' not in s:
    raise SystemExit('expected v0.5.2 source')
s=s.replace('// @version      0.5.2','// @version      0.5.3',1)
s=s.replace("version: '0.5.2'","version: '0.5.3'",1)
s=s.replace('Experimental Torn stock dashboard with inline Stock Market controls, rebalance preview, ROI, Panic v2 and hardened Trade Assistant.','Experimental Torn stock workspace with inline Advisor, Trade Assistant, Rebalance, ROI, Panic v2 and hardened direct controls.',1)
s=s.replace("    inlineCollapsed: 'SLX_STOCK_INLINE_COLLAPSED'\n", "    inlineCollapsed: 'SLX_STOCK_INLINE_COLLAPSED',\n    inlineTab: 'SLX_STOCK_INLINE_TAB'\n",1)

# Replace inline nav and add embedded workspace.
old_nav='''        <div class="slx-inline-nav"><button id="slx-inline-advisor" type="button">★ Advisor</button><button id="slx-inline-trade" type="button">📈 Trade Assistant</button><button id="slx-inline-rebalance" type="button">⚖ Rebalance</button></div>'''
new_nav='''        <div class="slx-inline-nav"><button data-slx-inline-tab="advisor" type="button">★ Advisor</button><button data-slx-inline-tab="trade" type="button">📈 Trade Assistant</button><button data-slx-inline-tab="rebalance" type="button">⚖ Rebalance</button></div>\n        <div id="slx-inline-workspace" class="slx-inline-workspace" data-open="0"></div>'''
if old_nav not in s: raise SystemExit('inline nav marker missing')
s=s.replace(old_nav,new_nav,1)

# Add refresh button in header.
old_head='<button id="slx-inline-api" type="button">API</button><button id="slx-inline-full" type="button">Full</button><button id="slx-inline-toggle" type="button">'
new_head='<button id="slx-inline-refresh" type="button" title="Refresh Stock Manager">↻</button><button id="slx-inline-api" type="button">API</button><button id="slx-inline-full" type="button">Full</button><button id="slx-inline-toggle" type="button">'
if old_head not in s: raise SystemExit('inline head marker missing')
s=s.replace(old_head,new_head,1)

# Replace old modal-opening nav bindings with inline workspace toggles.
old_bind="""    $('#slx-inline-full',card).onclick=openPanel;
    $('#slx-inline-api',card).onclick=()=>openPanelAt('#slx-stock-api');
    $('#slx-inline-advisor',card).onclick=()=>openPanelAt('#slx-stock-advisor-body');
    $('#slx-inline-trade',card).onclick=()=>openPanelAt('#slx-stock-trade-body');
    $('#slx-inline-rebalance',card).onclick=()=>openPanelAt('#slx-stock-rebalance-body');
"""
new_bind="""    $('#slx-inline-full',card).onclick=openPanel;
    $('#slx-inline-api',card).onclick=()=>openPanelAt('#slx-stock-api');
    $('#slx-inline-refresh',card).onclick=async()=>{try{inlineStatus('Refreshing…','info');if(get(K.api).trim())await syncAllApi();else{scanStocks();refreshInlinePanel();}inlineStatus('Refreshed.','ok');}catch(e){inlineStatus(e.message,'bad');}};
    $$('[data-slx-inline-tab]',card).forEach(b=>b.onclick=()=>toggleInlineWorkspace(b.dataset.slxInlineTab));
"""
if old_bind not in s: raise SystemExit('inline nav bindings marker missing')
s=s.replace(old_bind,new_bind,1)

# Insert inline workspace functions before inlineStatus.
marker='  function inlineStatus(msg,kind=\'info\') {'
idx=s.find(marker)
if idx<0: raise SystemExit('inlineStatus marker missing')
workspace=r'''  function toggleInlineWorkspace(tab) {
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
      box.innerHTML=`<div class="slx-inline-error">${esc(e.message||'Workspace error')}</div>`;
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
      inlineStatus(`${bool(K.dryRun,false)?'Dry Run · ':''}Buy gap ${shares.toLocaleString()} ${sym}.`,'ok');
      if(get(K.api).trim() && !bool(K.dryRun,false)) await syncAllApi(); else refreshInlinePanel();
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

'''
s=s[:idx]+workspace+s[idx:]

# Refresh active inline workspace with latest values.
old_tail="""    const dry=$('#slx-inline-dry',card); if(dry) dry.checked=bool(K.dryRun,true);
  }
"""
new_tail="""    const dry=$('#slx-inline-dry',card); if(dry) dry.checked=bool(K.dryRun,true);
    renderInlineWorkspace(get(K.inlineTab,''));
  }
"""
if old_tail not in s: raise SystemExit('refreshInlinePanel tail marker missing')
s=s.replace(old_tail,new_tail,1)

# Inline workspace CSS before media block.
media='@media(max-width:600px)'
css=r'''#slx-stock-inline .slx-inline-nav button[data-active="1"]{border-color:#3b8ec9;background:#123653;color:#9bd5ff}#slx-stock-inline .slx-inline-workspace{display:none;border:1px solid #26394b;border-radius:10px;background:#0d151e;padding:8px}#slx-stock-inline .slx-inline-workspace[data-open="1"]{display:grid;gap:7px}#slx-stock-inline .slx-inline-work-head{display:flex;align-items:center;gap:8px}#slx-stock-inline .slx-inline-work-head>b{flex:1;font-size:11px;color:#9fc7ef}#slx-stock-inline .slx-inline-work-head button{padding:6px 8px;font-size:9px}#slx-stock-inline .slx-inline-roi-list,#slx-stock-inline .slx-inline-trade-list,#slx-stock-inline .slx-inline-rebalance-list{display:grid;gap:5px}#slx-stock-inline .slx-inline-roi-row{display:grid;grid-template-columns:66px 48px 68px 1fr auto;gap:5px;align-items:center;padding:7px;border:1px solid #203142;border-radius:8px;background:#101923;font-size:9px}#slx-stock-inline .slx-inline-roi-row small{grid-column:1/5;color:#8497aa}#slx-stock-inline .slx-inline-roi-row button{grid-row:1/3;grid-column:5;padding:6px}#slx-stock-inline .slx-inline-trade-card{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:8px;border:1px solid #263b4e;border-radius:9px;background:#101923}#slx-stock-inline .slx-inline-trade-card>div:first-child{display:grid;gap:2px}#slx-stock-inline .slx-inline-trade-card small,#slx-stock-inline .slx-inline-trade-card span{font-size:9px;color:#8497aa}#slx-stock-inline .slx-inline-mini-actions{display:flex;gap:5px}#slx-stock-inline .slx-inline-rebalance-target{display:grid;gap:3px;padding:8px;border:1px solid #365a78;border-radius:9px;background:#0e1c29}#slx-stock-inline .slx-inline-rebalance-target small,#slx-stock-inline .slx-inline-rebalance-target span{font-size:9px;color:#91a8bc}#slx-stock-inline .slx-inline-rebalance-row{display:grid;grid-template-columns:80px 1fr 1fr;gap:6px;padding:6px;border-bottom:1px solid #1e2c39;font-size:9px}#slx-stock-inline .slx-inline-empty,#slx-stock-inline .slx-inline-error{padding:8px;font-size:9px;color:#8fa1b4}#slx-stock-inline .slx-inline-error{color:#ff7a86}
'''
if media not in s: raise SystemExit('media marker missing')
s=s.replace(media,css+media,1)
s=s.replace('@media(max-width:600px){','@media(max-width:600px){#slx-stock-inline .slx-inline-roi-row{grid-template-columns:58px 42px 62px 1fr}#slx-stock-inline .slx-inline-roi-row button{grid-row:auto;grid-column:4}#slx-stock-inline .slx-inline-roi-row small{grid-column:1/5}#slx-stock-inline .slx-inline-trade-card{grid-template-columns:1fr}#slx-stock-inline .slx-inline-mini-actions{justify-content:flex-end}',1)

# Throttle MutationObserver inline remount/refresh to avoid repeated heavy renders.
old_init="""  async function init() {
    style(); restoreCache(); panicButton(); managerLauncher(); if(isStocks()) setTimeout(mountInlinePanel,250);
"""
new_init="""  let inlineMountTimer=0;
  function scheduleInlineMount() {
    clearTimeout(inlineMountTimer);
    inlineMountTimer=setTimeout(()=>{if(isStocks()) mountInlinePanel(); else $('#slx-stock-inline')?.remove();},120);
  }

  async function init() {
    style(); restoreCache(); panicButton(); managerLauncher(); if(isStocks()) setTimeout(mountInlinePanel,250);
"""
if old_init not in s: raise SystemExit('init marker missing')
s=s.replace(old_init,new_init,1)
old_obs="""    const mo=new MutationObserver(()=>{ if(isStocks()){scanStocks();mountInlinePanel();} else $('#slx-stock-inline')?.remove(); if(!$('#slx-stock-open')) managerLauncher(); if(!$('#slx-stock-panic')) panicButton(); });
"""
new_obs="""    const mo=new MutationObserver(()=>{ if(isStocks()) scanStocks(); scheduleInlineMount(); if(!$('#slx-stock-open')) managerLauncher(); if(!$('#slx-stock-panic')) panicButton(); });
"""
if old_obs not in s: raise SystemExit('observer marker missing')
s=s.replace(old_obs,new_obs,1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.5.3**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.5.3** turns the inline Stock Market dashboard into a workspace: Advisor, Trade Assistant and Rebalance now expand directly inside the Stocks page, with persistent active tab, quick target selection, direct Buy Gap, refresh control and throttled SPA remounting.\n''',m,count=1,flags=re.S)
h='## Changelog\n'
entry='''### v0.5.3 — Inline Advisor / Trade / Rebalance Workspace\n\n- Advisor, Trade Assistant and Rebalance now expand **inside the Stock Market dashboard** instead of forcing the full modal panel.\n- Added persistent inline workspace tab state.\n- Inline Advisor shows the top five ROI opportunities with tier, APR, gap, payback and bank comparison.\n- Inline Trade Assistant shows Best ROI / Best Affordable candidates with **Target** and **Buy gap** actions.\n- Buy gap continues to use the hardened trade path and respects Dry Run.\n- Inline Rebalance shows the selected target, proposed SELL sources, funding status and shortfall without executing trades.\n- Added inline refresh button for API/catalog/portfolio refresh.\n- Full modal remains available for API setup, Benefit Values and detailed diagnostics.\n- Throttled Torn SPA remounts to reduce repeated inline rendering on mobile/TornPDA.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
if h in m and '### v0.5.3 — Inline Advisor / Trade / Rebalance Workspace' not in m:m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
