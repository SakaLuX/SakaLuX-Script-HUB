from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

if '// @version      0.5.3' not in s:
    raise SystemExit('expected v0.5.3 source')
s=s.replace('// @version      0.5.3','// @version      0.5.4',1)
s=s.replace("version: '0.5.3'","version: '0.5.4'",1)
s=s.replace('Experimental Torn stock workspace with inline Advisor, Trade Assistant, Rebalance, ROI, Panic v2 and hardened direct controls.','Experimental Torn stock workspace with native inline metrics, API mode, editable presets, configurable controls, ROI and hardened direct trades.',1)

# Storage keys.
s=s.replace("    inlineCollapsed: 'SLX_STOCK_INLINE_COLLAPSED',\n    inlineTab: 'SLX_STOCK_INLINE_TAB'", "    inlineCollapsed: 'SLX_STOCK_INLINE_COLLAPSED',\n    inlineTab: 'SLX_STOCK_INLINE_TAB',\n    inlineApiMode: 'SLX_STOCK_INLINE_API_MODE',\n    inlinePresets: 'SLX_STOCK_INLINE_PRESETS',\n    inlineButtons: 'SLX_STOCK_INLINE_BUTTONS'",1)

# Replace inlineTotals with cost-basis aware metrics.
old=re.search(r"  function inlineTotals\(\) \{.*?\n  \}\n\n  function openPanelAt",s,re.S)
if not old: raise SystemExit('inlineTotals block missing')
new=r'''  function inlineTotals() {
    const rows=buildPortfolioRows();
    const marketValue=rows.reduce((n,r)=>n+r.value,0);
    const knownRows=rows.filter(r=>r.cost!==null && Number.isFinite(r.cost));
    const invested=knownRows.reduce((n,r)=>n+r.cost,0);
    const knownValue=knownRows.reduce((n,r)=>n+r.value,0);
    const pl=knownValue-invested;
    const plPct=invested>0?(pl/invested)*100:0;
    const coverage=rows.length?Math.round((knownRows.length/rows.length)*100):0;
    return {marketValue,invested,pl,plPct,coverage,cash:Number(S.money)||currentMoneyFromDom()||0,positions:rows.length,known:knownRows.length};
  }

  function inlinePresetValues() {
    const raw=get(K.inlinePresets,'50k,250k,1m,5m,10m,25m');
    const vals=String(raw).split(/[;,\s]+/).map(v=>v.trim()).filter(Boolean).slice(0,10);
    return vals.length?vals:['50k','250k','1m','5m','10m','25m'];
  }

  function inlineButtonPrefs() {
    const defaults={advisor:true,trade:true,rebalance:true,panic:true,full:true};
    try { return {...defaults,...JSON.parse(get(K.inlineButtons,'{}'))}; } catch { return defaults; }
  }

  function saveInlineButtonPrefs(next) { set(K.inlineButtons,JSON.stringify({...inlineButtonPrefs(),...next})); }

  function renderInlinePresetButtons(card=$('#slx-stock-inline')) {
    const box=$('#slx-inline-presets',card||document); if(!box) return;
    box.innerHTML=inlinePresetValues().map(v=>`<button type="button" data-slx-preset="${esc(v)}">${esc(v.toUpperCase())}</button>`).join('');
    $$('[data-slx-preset]',box).forEach(b=>b.onclick=()=>{const v=b.dataset.slxPreset;const input=$('#slx-inline-withdraw-value',card);if(input)input.value=v;set(K.withdraw,v);inlineStatus(`Withdraw preset: ${v.toUpperCase()}`,'ok');});
  }

  function applyInlineButtonPrefs(card=$('#slx-stock-inline')) {
    if(!card) return;
    const pref=inlineButtonPrefs();
    const map={advisor:'[data-slx-inline-tab="advisor"]',trade:'[data-slx-inline-tab="trade"]',rebalance:'[data-slx-inline-tab="rebalance"]',panic:'#slx-inline-panic',full:'#slx-inline-full'};
    Object.entries(map).forEach(([k,sel])=>{const el=$(sel,card);if(el)el.hidden=!pref[k];});
  }

  function openPanelAt'''
s=s[:old.start()]+new+s[old.end()-len('  function openPanelAt'):]

# Change inline card HTML summary + add API mode/settings/editor controls.
s=s.replace("<div class=\"slx-inline-head-actions\"><button id=\"slx-inline-refresh\" type=\"button\" title=\"Refresh Stock Manager\">↻</button><button id=\"slx-inline-api\" type=\"button\">API</button><button id=\"slx-inline-full\" type=\"button\">Full</button><button id=\"slx-inline-toggle\" type=\"button\">${card.dataset.collapsed==='1'?'＋':'−'}</button></div>","<div class=\"slx-inline-head-actions\"><button id=\"slx-inline-refresh\" type=\"button\" title=\"Refresh Stock Manager\">↻</button><button id=\"slx-inline-api\" type=\"button\">API</button><button id=\"slx-inline-settings\" type=\"button\" title=\"Inline settings\">⚙</button><button id=\"slx-inline-full\" type=\"button\">Full</button><button id=\"slx-inline-toggle\" type=\"button\">${card.dataset.collapsed==='1'?'＋':'−'}</button></div>",1)
s=s.replace("<div class=\"slx-inline-summary\"><div><span>Total invested</span><b id=\"slx-inline-total\">—</b></div><div><span>Unrealized P/L</span><b id=\"slx-inline-pl\">—</b></div><div><span>Cash</span><b id=\"slx-inline-cash\">—</b></div></div>","<div class=\"slx-inline-summary\"><div><span>Total invested <small id=\"slx-inline-coverage\"></small></span><b id=\"slx-inline-total\">—</b></div><div><span>Market value</span><b id=\"slx-inline-market\">—</b></div><div><span>Unrealized P/L</span><b id=\"slx-inline-pl\">—</b><small id=\"slx-inline-pl-pct\"></small></div><div><span>Cash</span><b id=\"slx-inline-cash\">—</b></div></div>",1)
s=s.replace("<div class=\"slx-inline-options\"><label><input id=\"slx-inline-benefit-lock\" type=\"checkbox\"> Lock Benefits</label><label><input id=\"slx-inline-dry\" type=\"checkbox\"> Dry Run</label><button id=\"slx-inline-panic\" class=\"danger\" type=\"button\">PANIC</button></div>\n        <div class=\"slx-inline-presets\">${['50k','250k','1m','5m','10m','25m'].map(v=>`<button type=\"button\" data-slx-preset=\"${v}\">${v.toUpperCase()}</button>`).join('')}</div>","<div class=\"slx-inline-options\"><label><input id=\"slx-inline-api-mode\" type=\"checkbox\"> API Mode</label><label><input id=\"slx-inline-benefit-lock\" type=\"checkbox\"> Lock Benefits</label><label><input id=\"slx-inline-dry\" type=\"checkbox\"> Dry Run</label><button id=\"slx-inline-edit-presets\" type=\"button\">Edit presets</button><button id=\"slx-inline-panic\" class=\"danger\" type=\"button\">PANIC</button></div>\n        <div id=\"slx-inline-presets\" class=\"slx-inline-presets\"></div>\n        <div id=\"slx-inline-config\" class=\"slx-inline-config\" hidden><label>Withdrawal presets <input id=\"slx-inline-preset-input\" value=\"${esc(get(K.inlinePresets,'50k,250k,1m,5m,10m,25m'))}\" placeholder=\"50k,250k,1m,5m,10m,25m\"></label><div class=\"slx-inline-config-actions\"><button id=\"slx-inline-save-presets\" type=\"button\">Save presets</button><label><input data-inline-button=\"advisor\" type=\"checkbox\"> Advisor</label><label><input data-inline-button=\"trade\" type=\"checkbox\"> Trade</label><label><input data-inline-button=\"rebalance\" type=\"checkbox\"> Rebalance</label><label><input data-inline-button=\"panic\" type=\"checkbox\"> PANIC</label><label><input data-inline-button=\"full\" type=\"checkbox\"> Full</label></div></div>",1)

# Bind new controls. API refresh respects API Mode.
s=s.replace("$('#slx-inline-refresh',card).onclick=async()=>{try{inlineStatus('Refreshing…','info');if(get(K.api).trim())await syncAllApi();else{scanStocks();refreshInlinePanel();}inlineStatus('Refreshed.','ok');}catch(e){inlineStatus(e.message,'bad');}};", "$('#slx-inline-refresh',card).onclick=async()=>{try{inlineStatus('Refreshing…','info');if(bool(K.inlineApiMode,true)&&get(K.api).trim())await syncAllApi();else{scanStocks();refreshInlinePanel();}inlineStatus('Refreshed.','ok');}catch(e){inlineStatus(e.message,'bad');}};",1)
needle="""    $('#slx-inline-benefit-lock',card).checked=bool(K.benefitLock,true);
"""
insert="""    $('#slx-inline-api-mode',card).checked=bool(K.inlineApiMode,true);
    $('#slx-inline-api-mode',card).onchange=e=>{set(K.inlineApiMode,e.target.checked?'1':'0');refreshInlinePanel();inlineStatus(`API Mode ${e.target.checked?'ON':'OFF'}.`,e.target.checked?'ok':'info');};
    $('#slx-inline-settings',card).onclick=()=>{const cfg=$('#slx-inline-config',card);cfg.hidden=!cfg.hidden;};
    $('#slx-inline-edit-presets',card).onclick=()=>{const cfg=$('#slx-inline-config',card);cfg.hidden=false;$('#slx-inline-preset-input',card)?.focus();};
    $('#slx-inline-save-presets',card).onclick=()=>{const raw=$('#slx-inline-preset-input',card).value;set(K.inlinePresets,raw);renderInlinePresetButtons(card);inlineStatus('Withdrawal presets saved.','ok');};
    $$('[data-inline-button]',card).forEach(cb=>{const key=cb.dataset.inlineButton;cb.checked=!!inlineButtonPrefs()[key];cb.onchange=()=>{saveInlineButtonPrefs({[key]:cb.checked});applyInlineButtonPrefs(card);};});
"""+needle
if needle not in s: raise SystemExit('benefit lock bind missing')
s=s.replace(needle,insert,1)
# Remove old static preset binder and replace with renderer/prefs.
s=s.replace("    $$('[data-slx-preset]',card).forEach(b=>b.onclick=()=>{const v=b.dataset.slxPreset;$('#slx-inline-withdraw-value',card).value=v;set(K.withdraw,v);inlineStatus(`Withdraw preset: ${v.toUpperCase()}`,'ok');});\n    refreshInlinePanel();", "    renderInlinePresetButtons(card);\n    applyInlineButtonPrefs(card);\n    refreshInlinePanel();",1)

# Precise metric refresh and API Mode badge.
old="""    const totals=inlineTotals();
    const pl=$('#slx-inline-pl',card);
    $('#slx-inline-total',card).textContent=money(totals.total);
    $('#slx-inline-cash',card).textContent=money(totals.cash);
    if(pl){pl.textContent=`${totals.pl>=0?'+':'-'}${money(Math.abs(totals.pl))}`;pl.className=totals.pl>=0?'good':'bad';}
"""
new="""    const totals=inlineTotals();
    const pl=$('#slx-inline-pl',card);
    $('#slx-inline-total',card).textContent=totals.invested>0?money(totals.invested):'—';
    $('#slx-inline-market',card).textContent=money(totals.marketValue);
    $('#slx-inline-cash',card).textContent=money(totals.cash);
    $('#slx-inline-coverage',card).textContent=totals.positions?`· ${totals.coverage}% cost basis`:'';
    $('#slx-inline-pl-pct',card).textContent=totals.invested>0?`${totals.plPct>=0?'+':''}${totals.plPct.toFixed(2)}%`:'';
    if(pl){pl.textContent=totals.invested>0?`${totals.pl>=0?'+':'-'}${money(Math.abs(totals.pl))}`:'—';pl.className=totals.pl>=0?'good':'bad';}
"""
if old not in s: raise SystemExit('inline totals refresh marker missing')
s=s.replace(old,new,1)
s=s.replace("const api=$('#slx-inline-api',card); if(api){api.textContent=get(K.api).trim()?'API ✓':'API !';api.dataset.kind=get(K.api).trim()?'ok':'warn';}", "const api=$('#slx-inline-api',card); if(api){const enabled=bool(K.inlineApiMode,true);api.textContent=!get(K.api).trim()?'API !':enabled?'API ON':'API OFF';api.dataset.kind=get(K.api).trim()&&enabled?'ok':'warn';} const apiMode=$('#slx-inline-api-mode',card);if(apiMode)apiMode.checked=bool(K.inlineApiMode,true);applyInlineButtonPrefs(card);",1)

# CSS for 4 summary cards and editor/config.
s=s.replace("#slx-stock-inline .slx-inline-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}","#slx-stock-inline .slx-inline-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}",1)
s=s.replace("#slx-stock-inline .slx-inline-summary span,#slx-stock-inline .slx-inline-target span{font-size:9px;color:#8596a8}","#slx-stock-inline .slx-inline-summary span,#slx-stock-inline .slx-inline-target span{font-size:9px;color:#8596a8}#slx-stock-inline .slx-inline-summary small{font-size:8px;color:#74869a}",1)
s=s.replace("#slx-stock-inline .slx-inline-note{font-size:9px;color:#8ea0b3}","#slx-stock-inline .slx-inline-config{padding:9px;border:1px solid #2b3d50;border-radius:9px;background:#0d1721;display:grid;gap:8px}#slx-stock-inline .slx-inline-config[hidden]{display:none}#slx-stock-inline .slx-inline-config label{display:grid;gap:4px;font-size:9px;color:#9aabba}#slx-stock-inline .slx-inline-config-actions{display:flex;flex-wrap:wrap;gap:7px;align-items:center}#slx-stock-inline .slx-inline-config-actions label{display:flex;align-items:center;gap:4px}#slx-stock-inline .slx-inline-note{font-size:9px;color:#8ea0b3}",1)
# mobile summary now 2x2, remove nth child 3 span behavior.
s=s.replace("#slx-stock-inline .slx-inline-summary{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-summary>div:nth-child(3){grid-column:1/3}","#slx-stock-inline .slx-inline-summary{grid-template-columns:1fr 1fr}",1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.5.4**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.5.4** refines the native inline Stock Market experience with cost-basis-aware Total Invested and P/L, Market Value, API Mode ON/OFF, editable withdrawal presets and configurable visibility for Advisor, Trade, Rebalance, PANIC and Full controls.\n''',m,count=1,flags=re.S)
h='## Changelog\n'
entry='''### v0.5.4 — Native Metrics, API Mode & Inline Customization\n\n- Total Invested now uses known transaction cost basis instead of incorrectly mirroring market value.\n- Added Market Value as a separate live metric.\n- Unrealized P/L now shows amount and percentage using known cost basis.\n- Added cost-basis coverage indicator so incomplete API transaction history is obvious.\n- Added inline **API Mode** ON/OFF switch; manual refresh respects it.\n- Added editable withdrawal presets directly from the Stock Market card.\n- Added inline settings to show/hide Advisor, Trade Assistant, Rebalance, PANIC and Full controls.\n- Preset and control preferences persist locally.\n- Kept the full modal for API setup, benefit values and diagnostics.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
if h in m and '### v0.5.4 — Native Metrics, API Mode & Inline Customization' not in m:m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
