from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')
if '// @version      0.5.6' not in s:
    raise SystemExit('expected v0.5.6 source')
s=s.replace('// @version      0.5.6','// @version      0.5.7',1)
s=s.replace("version: '0.5.6'","version: '0.5.7'",1)
s=s.replace('Experimental Torn stock workspace with per-stock quick BUY/SELL presets, benefit progress, inline metrics, ROI, Panic v2 and hardened direct trades.','Experimental Torn stock workspace with native stock sorting/filtering, opportunity highlighting, quick trades, ROI, Panic v2 and hardened direct trades.',1)

# Storage keys
key_anchor="    inlineButtons: 'SLX_STOCK_INLINE_BUTTONS'\n"
if key_anchor not in s:
    raise SystemExit('K anchor missing')
s=s.replace(key_anchor,"    inlineButtons: 'SLX_STOCK_INLINE_BUTTONS',\n    stockSort: 'SLX_STOCK_SORT',\n    stockFilter: 'SLX_STOCK_FILTER'\n",1)

# Insert stock-view helpers before enhanceStockRows.
anchor='  function enhanceStockRows() {'
if anchor not in s:
    raise SystemExit('enhanceStockRows anchor missing')
helpers=r'''  function stockViewScore(sym, mode) {
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

'''
s=s.replace(anchor,helpers+anchor,1)

# Add opportunity badge inside enhanced rows and call applyStockView after enhancing all rows.
old="""      const progress=stockRowBenefitProgress(sym,m.owned);
      const quickOptions=stockRowQuickOptions().map(v=>`<option value=\"${esc(v)}\">${esc(String(v).toUpperCase())}</option>`).join('');
"""
if old not in s:
    raise SystemExit('row progress anchor missing')
new="""      const progress=stockRowBenefitProgress(sym,m.owned);
      const opp=opportunityRanks().get(sym);
      const quickOptions=stockRowQuickOptions().map(v=>`<option value=\"${esc(v)}\">${esc(String(v).toUpperCase())}</option>`).join('');
"""
s=s.replace(old,new,1)
s=s.replace("<div class=\"slx-row-stock\"><b>${esc(sym)}</b><span>${money(m.price)}</span></div>","<div class=\"slx-row-stock\"><b>${esc(sym)}${opp?` <em class=\\\"slx-opp-badge\\\">#${opp.rank} ROI</em>`:''}</b><span>${money(m.price)}</span>${opp?`<small class=\\\"slx-opp-roi\\\">${opp.roi.toFixed(2)}% APR</small>`:''}</div>",1)
loop_end="""      li.dataset.target=get(K.target).toUpperCase()===sym?'1':'0';
    }
  }

  function loadActionLog() {
"""
if loop_end not in s:
    raise SystemExit('enhance end anchor missing')
s=s.replace(loop_end,"""      li.dataset.target=get(K.target).toUpperCase()===sym?'1':'0';
      li.dataset.opportunity=opp?String(opp.rank):'';
    }
    applyStockView();
  }

  function loadActionLog() {
""",1)

# Add direct sort/filter controls to inline card after navigation.
nav='''        <div class="slx-inline-nav"><button data-slx-inline-tab="advisor" type="button">★ Advisor</button><button data-slx-inline-tab="trade" type="button">📈 Trade Assistant</button><button data-slx-inline-tab="rebalance" type="button">⚖ Rebalance</button></div>
'''
if nav not in s:
    raise SystemExit('inline nav anchor missing')
controls=nav+'''        <div class="slx-stock-view-controls"><label>Sort<select id="slx-stock-sort"><option value="default">Torn default</option><option value="owned">Owned shares</option><option value="value">Position value</option><option value="roi">Best ROI</option><option value="benefit">Closest benefit</option><option value="pl">Biggest P/L</option><option value="loss">Biggest loss</option><option value="excess">Excess shares</option></select></label><label>Filter<select id="slx-stock-filter"><option value="all">All stocks</option><option value="owned">Owned only</option><option value="profit">Profit only</option><option value="loss">Loss only</option><option value="excess">Excess shares</option><option value="benefit">Has next benefit</option></select></label><button id="slx-stock-view-reset" type="button">Reset</button></div>
'''
s=s.replace(nav,controls,1)

# Bind controls near other inline event bindings; use settings button anchor.
bind_anchor="""    $('#slx-inline-settings').onclick=()=>{
"""
if bind_anchor not in s:
    raise SystemExit('inline settings bind anchor missing')
binds="""    refreshStockViewControls();
    const sortCtl=$('#slx-stock-sort'); if(sortCtl) sortCtl.onchange=()=>{set(K.stockSort,sortCtl.value);applyStockView();enhanceStockRows();inlineStatus(`Sorted: ${sortCtl.options[sortCtl.selectedIndex]?.text||sortCtl.value}`,'ok');};
    const filterCtl=$('#slx-stock-filter'); if(filterCtl) filterCtl.onchange=()=>{set(K.stockFilter,filterCtl.value);applyStockView();enhanceStockRows();inlineStatus(`Filter: ${filterCtl.options[filterCtl.selectedIndex]?.text||filterCtl.value}`,'ok');};
    const resetView=$('#slx-stock-view-reset'); if(resetView) resetView.onclick=()=>{set(K.stockSort,'default');set(K.stockFilter,'all');refreshStockViewControls();scanStocks();for(const [,st] of S.stocks){if(st?.row)st.row.style.display='';}enhanceStockRows();inlineStatus('Stock view reset.','ok');};

"""+bind_anchor
s=s.replace(bind_anchor,binds,1)

# CSS
css_anchor='#slx-stock-inline .slx-inline-nav button[data-active="1"]{border-color:#3b8ec9;background:#123653;color:#9bd5ff}'
if css_anchor not in s:
    raise SystemExit('inline nav CSS anchor missing')
css=css_anchor+'#slx-stock-inline .slx-stock-view-controls{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:end}#slx-stock-inline .slx-stock-view-controls label{display:grid;gap:3px;font-size:9px;color:#8fa1b4}#slx-stock-inline .slx-stock-view-controls select{width:100%}.slx-stock-row-tools .slx-opp-badge{display:inline-block;margin-left:3px;padding:1px 4px;border:1px solid #8b6a1f;border-radius:999px;color:#ffd36b;background:#2b2412;font:800 7px Arial;font-style:normal}.slx-stock-row-tools .slx-opp-roi{color:#ffd36b!important}.slx-stock-row-tools[data-opportunity="1"]{box-shadow:inset 3px 0 #ffd36b}.slx-stock-row-tools[data-opportunity="2"],.slx-stock-row-tools[data-opportunity="3"]{box-shadow:inset 2px 0 #7c91a8}'
s=s.replace(css_anchor,css,1)
mobile='@media(max-width:600px){'
if mobile not in s:
    raise SystemExit('mobile CSS anchor missing')
s=s.replace(mobile,mobile+'#slx-stock-inline .slx-stock-view-controls{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-stock-view-controls button{grid-column:1/3}',1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.5.7**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.5.7** adds native sorting/filtering directly on the Torn Stocks page, persistent view preferences, and visual highlighting for the top ROI opportunities.
''',m,count=1,flags=re.S)
change='''### v0.5.7 — Stock Sort, Filters & Opportunity Highlights

- Added persistent **Sort** controls directly in the inline Stock Market workspace.
- Sort modes: Torn default, Owned shares, Position value, Best ROI, Closest benefit, Biggest P/L, Biggest loss and Excess shares.
- Added persistent **Filter** controls: All, Owned only, Profit only, Loss only, Excess shares and Has next benefit.
- Added one-tap **Reset** to restore Torn's default stock view and show all rows.
- Sorting reorders only detected Torn stock rows while keeping the rest of the page structure intact.
- Added visual ROI opportunity badges for the current top 3 benefit ROI candidates.
- The #1 ROI opportunity receives a stronger highlight in the original Torn stock list.
- Sorting/filtering preferences persist locally and are reapplied after Torn SPA redraws.
- Compatible with the v0.5.6 quick BUY/SELL controls, benefit progress, Dry Run and Benefit Lock.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

'''
m=m.replace('## Changelog\n','## Changelog\n'+change,1)
md.write_text(m,encoding='utf-8')
