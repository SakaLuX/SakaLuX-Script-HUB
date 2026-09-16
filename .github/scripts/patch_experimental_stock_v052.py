from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

if '// @version      0.5.1' not in s:
    raise SystemExit('expected v0.5.1 source')
s=s.replace('// @version      0.5.1','// @version      0.5.2',1)
s=s.replace("version: '0.5.1'","version: '0.5.2'",1)
s=s.replace('Experimental Torn stock portfolio optimizer with rebalance preview, ROI, bank comparison, Panic v2 and hardened Trade Assistant.','Experimental Torn stock dashboard with inline Stock Market controls, rebalance preview, ROI, Panic v2 and hardened Trade Assistant.',1)

# Inline UI preference.
s=s.replace("    rebalanceReserve: 'SLX_STOCK_REBALANCE_RESERVE'\n", "    rebalanceReserve: 'SLX_STOCK_REBALANCE_RESERVE',\n    inlineCollapsed: 'SLX_STOCK_INLINE_COLLAPSED'\n",1)

# Refresh inline card after successful API sync.
s=s.replace("    renderTradeAssistant();\n    status(`API connected", "    renderTradeAssistant();\n    refreshInlinePanel();\n    status(`API connected",1)

# Insert inline Stock Market dashboard before style().
marker='  function style() {'
idx=s.find(marker)
if idx<0: raise SystemExit('style marker missing')
inline=r'''  function inlineStockHost() {
    const firstStock=$("ul[class^='stock_'], ul[id^='stock_']");
    if(firstStock?.parentElement) return {host:firstStock.parentElement,before:firstStock};
    const host=$('#mainContainer .content-wrapper') || $('.content-wrapper') || $('#mainContainer') || $('main') || document.body;
    return {host,before:null};
  }

  function inlineTotals() {
    const rows=buildPortfolioRows();
    const total=rows.reduce((n,r)=>n+r.value,0);
    const knownCost=rows.reduce((n,r)=>n+(r.cost||0),0);
    const knownValue=rows.reduce((n,r)=>n+(r.cost===null?0:r.value),0);
    return {total,pl:knownValue-knownCost,cash:Number(S.money)||currentMoneyFromDom()||0};
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
    card.innerHTML=`<div class="slx-inline-head"><div><b>📊 SakaLuX Stock Manager</b><small>v${APP.version} · EXPERIMENTAL</small></div><div class="slx-inline-head-actions"><button id="slx-inline-api" type="button">API</button><button id="slx-inline-full" type="button">Full</button><button id="slx-inline-toggle" type="button">${card.dataset.collapsed==='1'?'＋':'−'}</button></div></div>
      <div class="slx-inline-body">
        <div class="slx-inline-summary"><div><span>Total invested</span><b id="slx-inline-total">—</b></div><div><span>Unrealized P/L</span><b id="slx-inline-pl">—</b></div><div><span>Cash</span><b id="slx-inline-cash">—</b></div></div>
        <div class="slx-inline-nav"><button id="slx-inline-advisor" type="button">★ Advisor</button><button id="slx-inline-trade" type="button">📈 Trade Assistant</button><button id="slx-inline-rebalance" type="button">⚖ Rebalance</button></div>
        <div class="slx-inline-target"><label>Target <select id="slx-inline-target"><option value="">Loading…</option></select></label><div><span>Owned</span><b id="slx-inline-owned">—</b></div></div>
        <div class="slx-inline-actions"><button id="slx-inline-vault-max" class="primary" type="button">Vault Max</button><label><input id="slx-inline-keep" value="${esc(get(K.keep,'0'))}" placeholder="Keep cash"></label><button id="slx-inline-vault-keep" type="button">Vault (Keep)</button><label><input id="slx-inline-withdraw-value" value="${esc(get(K.withdraw,'1m'))}" placeholder="Withdraw"></label><button id="slx-inline-withdraw" class="danger" type="button">Withdraw</button><button id="slx-inline-withdraw-all" class="danger" type="button">Withdraw All</button></div>
        <div class="slx-inline-options"><label><input id="slx-inline-benefit-lock" type="checkbox"> Lock Benefits</label><label><input id="slx-inline-dry" type="checkbox"> Dry Run</label><button id="slx-inline-panic" class="danger" type="button">PANIC</button></div>
        <div class="slx-inline-presets">${['50k','250k','1m','5m','10m','25m'].map(v=>`<button type="button" data-slx-preset="${v}">${v.toUpperCase()}</button>`).join('')}</div>
        <div id="slx-inline-status" class="slx-inline-note">Ready.</div>
      </div>`;
    if(before) host.insertBefore(card,before); else host.prepend(card);

    $('#slx-inline-toggle',card).onclick=()=>{const closed=card.dataset.collapsed!=='1';card.dataset.collapsed=closed?'1':'0';set(K.inlineCollapsed,closed?'1':'0');$('#slx-inline-toggle',card).textContent=closed?'＋':'−';};
    $('#slx-inline-full',card).onclick=openPanel;
    $('#slx-inline-api',card).onclick=()=>openPanelAt('#slx-stock-api');
    $('#slx-inline-advisor',card).onclick=()=>openPanelAt('#slx-stock-advisor-body');
    $('#slx-inline-trade',card).onclick=()=>openPanelAt('#slx-stock-trade-body');
    $('#slx-inline-rebalance',card).onclick=()=>openPanelAt('#slx-stock-rebalance-body');
    $('#slx-inline-target',card).onchange=e=>{set(K.target,e.target.value);refreshTargetSelect();refreshInlinePanel();};
    $('#slx-inline-keep',card).onchange=e=>set(K.keep,e.target.value);
    $('#slx-inline-withdraw-value',card).onchange=e=>set(K.withdraw,e.target.value);
    $('#slx-inline-benefit-lock',card).checked=bool(K.benefitLock,true);
    $('#slx-inline-benefit-lock',card).onchange=e=>{set(K.benefitLock,e.target.checked?'1':'0');renderPortfolio();renderOptimizer();refreshInlinePanel();};
    $('#slx-inline-dry',card).checked=bool(K.dryRun,true);
    $('#slx-inline-dry',card).onchange=e=>{set(K.dryRun,e.target.checked?'1':'0');refreshInlinePanel();};
    $('#slx-inline-vault-max',card).onclick=()=>vault().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));
    $('#slx-inline-vault-keep',card).onclick=()=>vault({keep:parseAmount($('#slx-inline-keep',card).value)}).then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));
    $('#slx-inline-withdraw',card).onclick=()=>withdrawCash(parseAmount($('#slx-inline-withdraw-value',card).value)).then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));
    $('#slx-inline-withdraw-all',card).onclick=()=>withdrawAll().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));
    $('#slx-inline-panic',card).onclick=panic;
    $$('[data-slx-preset]',card).forEach(b=>b.onclick=()=>{const v=b.dataset.slxPreset;$('#slx-inline-withdraw-value',card).value=v;set(K.withdraw,v);inlineStatus(`Withdraw preset: ${v.toUpperCase()}`,'ok');});
    refreshInlinePanel();
    return card;
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
    $('#slx-inline-total',card).textContent=money(totals.total);
    $('#slx-inline-cash',card).textContent=money(totals.cash);
    if(pl){pl.textContent=`${totals.pl>=0?'+':'-'}${money(Math.abs(totals.pl))}`;pl.className=totals.pl>=0?'good':'bad';}
    $('#slx-inline-owned',card).textContent=target?ownedShares(target).toLocaleString():'—';
    const api=$('#slx-inline-api',card); if(api){api.textContent=get(K.api).trim()?'API ✓':'API !';api.dataset.kind=get(K.api).trim()?'ok':'warn';}
    const lock=$('#slx-inline-benefit-lock',card); if(lock) lock.checked=bool(K.benefitLock,true);
    const dry=$('#slx-inline-dry',card); if(dry) dry.checked=bool(K.dryRun,true);
  }

'''
s=s[:idx]+inline+s[idx:]

# CSS before existing responsive media.
media='@media(max-width:600px)'
css=r'''#slx-stock-inline{margin:10px 0 14px;padding:0;border:1px solid #344458;border-radius:14px;background:#0b1118;color:#e8eef7;box-shadow:0 8px 24px #0008;overflow:hidden;font-family:Arial,sans-serif}#slx-stock-inline *{box-sizing:border-box}#slx-stock-inline .slx-inline-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:linear-gradient(180deg,#182535,#101923);border-bottom:1px solid #2c3d50}#slx-stock-inline .slx-inline-head>div:first-child{display:grid;gap:2px;flex:1}#slx-stock-inline .slx-inline-head b{font-size:13px}#slx-stock-inline .slx-inline-head small{font-size:9px;color:#8394a7}#slx-stock-inline .slx-inline-head-actions{display:flex;gap:5px}#slx-stock-inline button,#slx-stock-inline input,#slx-stock-inline select{border:1px solid #415369;border-radius:8px;background:#17212c;color:#ecf4ff;padding:8px;font-size:11px}#slx-stock-inline button{font-weight:800}#slx-stock-inline .primary{border-color:#2c8b52;color:#7ee09f;background:#102a1d}#slx-stock-inline .danger{border-color:#8c3140;color:#ff7a86;background:#2b1016}#slx-stock-inline .slx-inline-body{padding:10px;display:grid;gap:9px}#slx-stock-inline[data-collapsed="1"] .slx-inline-body{display:none}#slx-stock-inline .slx-inline-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#slx-stock-inline .slx-inline-summary>div{display:grid;gap:2px;padding:8px;border:1px solid #26384a;border-radius:9px;background:#101821}#slx-stock-inline .slx-inline-summary span,#slx-stock-inline .slx-inline-target span{font-size:9px;color:#8596a8}#slx-stock-inline .slx-inline-summary b{font-size:12px}#slx-stock-inline .slx-inline-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#slx-stock-inline .slx-inline-target{display:grid;grid-template-columns:1fr 110px;gap:8px;align-items:end}#slx-stock-inline .slx-inline-target label,#slx-stock-inline .slx-inline-target>div{display:grid;gap:4px}#slx-stock-inline .slx-inline-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#slx-stock-inline .slx-inline-actions label{display:block}#slx-stock-inline .slx-inline-actions input{width:100%}#slx-stock-inline .slx-inline-options{display:flex;flex-wrap:wrap;gap:9px;align-items:center}#slx-stock-inline .slx-inline-options label{display:flex;align-items:center;gap:4px;font-size:10px;color:#a4b1bf}#slx-stock-inline .slx-inline-options input{width:auto}#slx-stock-inline #slx-inline-panic{margin-left:auto}#slx-stock-inline .slx-inline-presets{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}#slx-stock-inline .slx-inline-note{font-size:9px;color:#8ea0b3}#slx-stock-inline .slx-inline-note[data-kind="bad"]{color:#ff7a86}#slx-stock-inline .slx-inline-note[data-kind="ok"]{color:#61e291}#slx-stock-inline .good{color:#61e291}#slx-stock-inline .bad{color:#ff7a86}#slx-stock-inline #slx-inline-api[data-kind="ok"]{border-color:#267c52;color:#63df9a}#slx-stock-inline #slx-inline-api[data-kind="warn"]{border-color:#8b6a1f;color:#ffd36b}
'''
if media not in s: raise SystemExit('media marker missing')
s=s.replace(media,css+media,1)
s=s.replace('@media(max-width:600px){','@media(max-width:600px){#slx-stock-inline .slx-inline-summary{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-summary>div:nth-child(3){grid-column:1/3}#slx-stock-inline .slx-inline-nav{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-nav button:nth-child(3){grid-column:1/3}#slx-stock-inline .slx-inline-target{grid-template-columns:1fr 86px}#slx-stock-inline .slx-inline-actions{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-presets{grid-template-columns:repeat(3,minmax(0,1fr))}',1)

# Init inline panel and keep it mounted through Torn SPA redraws.
s=s.replace("    style(); restoreCache(); panicButton(); managerLauncher();", "    style(); restoreCache(); panicButton(); managerLauncher(); if(isStocks()) setTimeout(mountInlinePanel,250);",1)
old="""    const mo=new MutationObserver(()=>{ if(isStocks()) scanStocks(); if(!$('#slx-stock-open')) managerLauncher(); if(!$('#slx-stock-panic')) panicButton(); });
"""
new="""    const mo=new MutationObserver(()=>{ if(isStocks()){scanStocks();mountInlinePanel();} else $('#slx-stock-inline')?.remove(); if(!$('#slx-stock-open')) managerLauncher(); if(!$('#slx-stock-panic')) panicButton(); });
"""
if old not in s: raise SystemExit('observer marker missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.5.2**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.5.2** adds a native-style inline Stock Manager dashboard directly above the Torn Stock Market list on the Stocks page, with live portfolio summary, target/owned view, vault/withdraw controls, quick presets, Benefit Lock, Dry Run, PANIC and shortcuts into Advisor, Trade Assistant and Rebalance.\n''',m,count=1,flags=re.S)
h='## Changelog\n'
entry='''### v0.5.2 — Inline Stock Market Dashboard\n\n- Added a compact **SakaLuX Stock Manager** dashboard directly inside the Torn Stocks page.\n- Shows Total Invested, known Unrealized P/L and on-hand Cash.\n- Added inline Target selector and live Owned shares display.\n- Added inline Vault Max, Vault Keep, Withdraw and Withdraw All controls.\n- Added 50K / 250K / 1M / 5M / 10M / 25M withdrawal presets.\n- Added inline Benefit Lock, Dry Run and PANIC controls.\n- Added quick links to API settings, full panel, ROI Advisor, Trade Assistant and Rebalance Preview.\n- Inline dashboard can be collapsed and the preference persists locally.\n- Dashboard remounts automatically after Torn SPA redraws and is removed outside the Stocks page.\n- Existing full modal panel remains available for advanced settings and diagnostics.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
if h in m and '### v0.5.2 — Inline Stock Market Dashboard' not in m:m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
