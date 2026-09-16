from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')
if '// @version      0.7.2' not in s: raise SystemExit('expected v0.7.2')
s=s.replace('// @version      0.7.2','// @version      0.7.3',1)
s=s.replace("version: '0.7.2'","version: '0.7.3'",1)
s=s.replace('Experimental Torn stock workspace with repaired API v2 sync, reorganized inline controls, fixed settings access and validated guided rebalance trade amounts.','Experimental Torn stock workspace with repaired inline workspaces, portfolio runtime helpers, compact controls and guided rebalance execution beside its preview.',1)

# Central Dry Run helper (default ON for safety) and replace old false-default runtime checks.
anchor="  const bool = (k, d=false) => get(k, d?'1':'0') === '1';\n"
if anchor not in s: raise SystemExit('bool anchor missing')
s=s.replace(anchor,anchor+"  const isDryRun = () => bool(K.dryRun,true);\n",1)
s=s.replace('bool(K.dryRun,false)','isDryRun()')

# Restore missing portfolio row builder used by inlineTotals() and renderPortfolio().
anchor='  function inlineTotals() {'
if anchor not in s: raise SystemExit('inlineTotals anchor missing')
portfolio=r'''  function buildPortfolioRows() {
    scanStocks();
    const rows=[];
    for(const [sym,st] of S.stocks) {
      const owned=Math.max(0,Math.floor(Number(ownedShares(sym))||0));
      const price=Number(st?.price)||0;
      if(owned<=0 || price<=0) continue;
      const avg=Number(averageBuy(sym))||0;
      const value=owned*price;
      const cost=avg>0 ? owned*avg : null;
      const pl=cost===null ? null : value-cost;
      const tier=benefitTier(sym,owned);
      const locked=bool(K.benefitLock,true)?Math.max(0,Number(tier.keep)||0):0;
      rows.push({sym,owned,price,avg,value,cost,pl,tier:tier.tier||0,locked});
    }
    return rows.sort((a,b)=>b.value-a.value || a.sym.localeCompare(b.sym));
  }

'''
s=s.replace(anchor,portfolio+anchor,1)

# Put Execute Rebalance directly beside Rebalance Preview in top workspace navigation.
old='<div class="slx-inline-nav"><button data-slx-inline-tab="advisor" type="button">★ Advisor</button><button data-slx-inline-tab="trade" type="button">📈 Trade Assistant</button><button data-slx-inline-tab="rebalance" type="button">⚖ Rebalance Preview</button></div>'
new='<div class="slx-inline-nav"><button data-slx-inline-tab="advisor" type="button">★ Advisor</button><button data-slx-inline-tab="trade" type="button">📈 Trade Assistant</button><button data-slx-inline-tab="rebalance" type="button">⚖ Rebalance Preview</button><button id="slx-exec-rebalance" class="primary" type="button">⚡ Execute Rebalance</button></div>'
if old not in s: raise SystemExit('inline nav anchor missing')
s=s.replace(old,new,1)

# Remove duplicate Compact checkbox and lower Execute Rebalance from advanced toolbar.
s=s.replace('<label><input id="slx-compact-mode" type="checkbox"> Compact</label>','',1)
s=s.replace('<button id="slx-exec-rebalance" type="button">Execute Rebalance</button>','',1)

# Turn Edit presets button into the requested Compact button. Presets remain editable through the settings gear.
s=s.replace('<button id="slx-inline-edit-presets" type="button">Edit presets</button>','<button id="slx-inline-compact" type="button">Compact</button>',1)

# Remove obsolete compact-checkbox binding.
old="    const cm=$('#slx-compact-mode',card); if(cm){cm.checked=bool(K.compactMode,false);cm.onchange=()=>{set(K.compactMode,cm.checked?'1':'0');card.dataset.compact=cm.checked?'1':'0';};card.dataset.compact=cm.checked?'1':'0';}\n"
s=s.replace(old,'',1)

# Replace old Edit presets handler with Compact button behavior. Gear remains the presets/settings entry point.
old="    $('#slx-inline-edit-presets',card).onclick=()=>{const cfg=$('#slx-inline-config',card);cfg.hidden=false;$('#slx-inline-preset-input',card)?.focus();};\n"
if old not in s: raise SystemExit('edit presets handler missing')
new="    const compactBtn=$('#slx-inline-compact',card); if(compactBtn){const syncCompact=()=>{const on=bool(K.compactMode,false);card.dataset.compact=on?'1':'0';compactBtn.dataset.active=on?'1':'0';compactBtn.textContent=on?'Compact ✓':'Compact';};syncCompact();compactBtn.onclick=()=>{set(K.compactMode,bool(K.compactMode,false)?'0':'1');syncCompact();renderInlineWorkspace(get(K.inlineTab,''));};}\n"
s=s.replace(old,new,1)

# Compact mode must NOT hide the inline Advisor/Trade/Rebalance workspace.
s=s.replace('#slx-stock-inline[data-compact="1"] .slx-inline-summary,#slx-stock-inline[data-compact="1"] .slx-inline-workspace,#slx-stock-inline[data-compact="1"] .slx-inline-presets{display:none!important}', '#slx-stock-inline[data-compact="1"] .slx-inline-summary,#slx-stock-inline[data-compact="1"] .slx-inline-presets{display:none!important}',1)

# Active Compact button styling and 4-button desktop / 2x2 mobile nav.
s=s.replace('#slx-stock-inline .slx-inline-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}', '#slx-stock-inline .slx-inline-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}',1)
s=s.replace('#slx-stock-inline .slx-inline-nav button[data-active="1"]{border-color:#3b8ec9;background:#123653;color:#9bd5ff}', '#slx-stock-inline .slx-inline-nav button[data-active="1"],#slx-stock-inline #slx-inline-compact[data-active="1"]{border-color:#3b8ec9;background:#123653;color:#9bd5ff}',1)
s=s.replace('#slx-stock-inline .slx-inline-nav{grid-template-columns:1fr 1fr}#slx-stock-inline .slx-inline-nav button:nth-child(3){grid-column:1/3}', '#slx-stock-inline .slx-inline-nav{grid-template-columns:1fr 1fr}',1)

# Safer workspace click status: show a visible error/status rather than appearing to do nothing.
old="    } catch(e) {\n      console.error(`[${APP.name}] inline ${tab} failed`,e);\n      box.innerHTML=`<div class=\"slx-inline-error\">${esc(e.message||'Workspace error')}</div>`;\n    }\n"
if old not in s: raise SystemExit('workspace catch anchor missing')
new="    } catch(e) {\n      console.error(`[${APP.name}] inline ${tab} failed`,e);\n      const msg=String(e?.message||'Workspace error');\n      box.innerHTML=`<div class=\"slx-inline-error\">${esc(msg)}</div>`;\n      inlineStatus(`${tab}: ${msg}`,'bad');\n    }\n"
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.7.3**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.7.3** fixes non-responsive Advisor/Trade Assistant/Rebalance Preview workspaces, restores the missing portfolio builder, restores the central Dry Run helper, moves Execute Rebalance beside its preview, and converts Edit presets into the Compact toggle.\n''',m,count=1,flags=re.S)
change='''### v0.7.3 — Inline Workspace & Runtime Fixes\n\n- Fixed **Advisor**, **Trade Assistant** and **Rebalance Preview** appearing unresponsive while Compact mode was enabled.\n- Compact mode now hides summary/preset clutter but keeps the selected inline workspace visible.\n- Restored missing `buildPortfolioRows()` used by portfolio totals and the full Portfolio panel.\n- Restored central `isDryRun()` with safe default **ON** and routed runtime Dry Run checks through it.\n- Replaced the old **Edit presets** inline button with a persistent **Compact** toggle; preset editing remains available from the settings gear.\n- Removed the duplicate Compact checkbox from the lower advanced controls.\n- Moved **Execute Rebalance** directly beside **Rebalance Preview** in the top workspace controls.\n- Added visible inline error reporting when a workspace renderer fails.\n\n'''
m=m.replace('## Changelog\n','## Changelog\n'+change,1)
md.write_text(m,encoding='utf-8')
