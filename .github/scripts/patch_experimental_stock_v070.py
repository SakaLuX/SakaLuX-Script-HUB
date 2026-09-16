from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')
if '// @version      0.5.7' not in s: raise SystemExit('expected v0.5.7')
s=s.replace('// @version      0.5.7','// @version      0.7.0',1)
s=s.replace("version: '0.5.7'","version: '0.7.0'",1)
s=s.replace('Experimental Torn stock workspace with native stock sorting/filtering, opportunity highlighting, quick trades, ROI, Panic v2 and hardened direct trades.','Experimental Torn stock workspace with watchlist, safety center, diagnostics, searchable native tools, ROI, Panic v2 and hardened direct trades.',1)

# keys
anchor="    stockFilter: 'SLX_STOCK_FILTER'\n"
if anchor not in s: raise SystemExit('key anchor')
s=s.replace(anchor,"    stockFilter: 'SLX_STOCK_FILTER',\n    favorites: 'SLX_STOCK_FAVORITES',\n    nearBenefitPct: 'SLX_STOCK_NEAR_BENEFIT_PCT',\n    targetLock: 'SLX_STOCK_TARGET_LOCK',\n    compactMode: 'SLX_STOCK_COMPACT_MODE',\n    rowSearch: 'SLX_STOCK_ROW_SEARCH'\n",1)

# helpers before stockViewScore
anchor='  function stockViewScore(sym, mode) {'
if anchor not in s: raise SystemExit('view anchor')
helpers=r'''  function favoriteStocks() {
    try { const a=JSON.parse(get(K.favorites,'[]')); return new Set(Array.isArray(a)?a.map(x=>String(x).toUpperCase()):[]); } catch { return new Set(); }
  }
  function saveFavoriteStocks(setv) { set(K.favorites,JSON.stringify([...setv].sort())); }
  function toggleFavorite(sym) { const f=favoriteStocks(); sym=String(sym||'').toUpperCase(); f.has(sym)?f.delete(sym):f.add(sym); saveFavoriteStocks(f); enhanceStockRows(); refreshInlinePanel(); }
  function nearBenefitInfo(sym) {
    const m=stockRowMetrics(sym); if(!m||!m.tier?.next) return null;
    const start=Math.max(0,Number(m.tier.keep)||0), span=Math.max(1,Number(m.tier.next)-start);
    const pct=Math.max(0,Math.min(100,((m.owned-start)/span)*100));
    const threshold=Math.max(50,Math.min(99.9,Number(get(K.nearBenefitPct,'90'))||90));
    return {pct,near:pct>=threshold && pct<100,threshold,gap:m.nextGap};
  }
  function safetySnapshot() {
    const target=get(K.target).toUpperCase();
    return {dryRun:bool(K.dryRun,false),benefitLock:bool(K.benefitLock,true),targetLock:bool(K.targetLock,false),target,panicFallback:get(K.panicFallback).toUpperCase(),tradeBusy:!!S.tradeBusy,api:!!get(K.api).trim()};
  }
  function exportStockManagerData() {
    const keys=Object.values(K), data={version:APP.version,exportedAt:new Date().toISOString(),settings:{}};
    keys.forEach(k=>{const v=get(k,null); if(v!==null && k!==K.api) data.settings[k]=v;});
    data.actionLog=loadActionLog();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=`SakaLuX-Stock-Manager-${APP.version}-backup.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }
  function importStockManagerData(file) {
    if(!file) return;
    const r=new FileReader(); r.onload=()=>{try{const d=JSON.parse(String(r.result||'{}')); for(const [k,v] of Object.entries(d.settings||{})){if(Object.values(K).includes(k)&&k!==K.api)set(k,v);} if(Array.isArray(d.actionLog))set(K.actionLog,JSON.stringify(d.actionLog.slice(0,100))); inlineStatus('Settings/history imported. Reloading…','ok'); setTimeout(()=>location.reload(),500);}catch(e){inlineStatus(`Import failed: ${e.message}`,'bad');}}; r.readAsText(file);
  }
  function diagnosticsText() {
    const x=safetySnapshot(), rows=[...S.stocks.values()].filter(v=>v?.row?.isConnected).length;
    return `v${APP.version} · API ${x.api?'ON':'OFF'} · DryRun ${x.dryRun?'ON':'OFF'} · BenefitLock ${x.benefitLock?'ON':'OFF'} · TargetLock ${x.targetLock?'ON':'OFF'} · Target ${x.target||'none'} · Stocks ${S.stocks.size} · DOM rows ${rows} · Positions ${Object.keys(S.portfolio||{}).length}`;
  }

'''
s=s.replace(anchor,helpers+anchor,1)

# extend filter favorites and search
s=s.replace("    if(filter==='benefit') return m.nextGap>0;\n    return true;","    if(filter==='benefit') return m.nextGap>0;\n    if(filter==='favorites') return favoriteStocks().has(sym);\n    const q=get(K.rowSearch,'').trim().toUpperCase();\n    if(q && !String(sym).toUpperCase().includes(q)) return false;\n    return true;",1)

# add row favorite + near badge variables
old="      const progress=stockRowBenefitProgress(sym,m.owned);\n      const opp=opportunityRanks().get(sym);"
if old not in s: raise SystemExit('row vars')
s=s.replace(old,"      const progress=stockRowBenefitProgress(sym,m.owned);\n      const opp=opportunityRanks().get(sym);\n      const fav=favoriteStocks().has(sym);\n      const near=nearBenefitInfo(sym);",1)
# inject button before Target
s=s.replace('<div class="slx-row-actions"><button type="button" data-row-target="${sym}">Target</button>','<div class="slx-row-actions"><button type="button" class="slx-fav" data-row-fav="${sym}" title="Favorite">${fav?\'★\':\'☆\'}</button><button type="button" data-row-target="${sym}" ${bool(K.targetLock,false)&&get(K.target).toUpperCase()!==sym?\'disabled\':\'\'}>Target</button>',1)
# near badge next to progress label
s=s.replace('<small class="slx-row-progress-label">${esc(progress.label)}</small>','<small class="slx-row-progress-label">${esc(progress.label)}${near?.near?` · ⚡ ${near.gap.toLocaleString()} left`:\'\'}</small>',1)
# bind favorite before target binding
bind="      $('[data-row-target]',li).onclick=e=>{e.preventDefault();e.stopPropagation();set(K.target,sym);refreshTargetSelect();refreshInlinePanel();enhanceStockRows();inlineStatus(`${sym} selected as target.`,'ok');};"
if bind not in s: raise SystemExit('target bind')
s=s.replace(bind,"      const fb=$('[data-row-fav]',li); if(fb) fb.onclick=e=>{e.preventDefault();e.stopPropagation();toggleFavorite(sym);};\n"+bind,1)

# add inline toolbar after view controls
needle='<button id="slx-stock-view-reset" type="button">Reset</button></div>'
if needle not in s: raise SystemExit('view controls')
extra=needle+'''<div class="slx-v070-toolbar"><input id="slx-stock-search" type="search" placeholder="Search stock…"><button id="slx-favorites-only" type="button">★ Favorites</button><label><input id="slx-target-lock" type="checkbox"> Target lock</label><label><input id="slx-compact-mode" type="checkbox"> Compact</label><button id="slx-diagnostics" type="button">Diagnostics</button><button id="slx-export" type="button">Export</button><button id="slx-import" type="button">Import</button><input id="slx-import-file" type="file" accept="application/json" hidden></div><div id="slx-diagnostic-line" class="slx-inline-note"></div>'''
s=s.replace(needle,extra,1)
# filter option favorites
s=s.replace('<option value="benefit">Has next benefit</option></select>','<option value="benefit">Has next benefit</option><option value="favorites">Favorites only</option></select>',1)

# bindings after settings binding known exact
anchor="    $('#slx-inline-settings',card).onclick=()=>{const cfg=$('#slx-inline-config',card);cfg.hidden=!cfg.hidden;};\n"
if anchor not in s: raise SystemExit('inline bind anchor')
binds=r'''    const search=$('#slx-stock-search',card); if(search){search.value=get(K.rowSearch,'');search.oninput=()=>{set(K.rowSearch,search.value);applyStockView();};}
    const favOnly=$('#slx-favorites-only',card); if(favOnly) favOnly.onclick=()=>{set(K.stockFilter,'favorites');refreshStockViewControls();applyStockView();enhanceStockRows();};
    const tl=$('#slx-target-lock',card); if(tl){tl.checked=bool(K.targetLock,false);tl.onchange=()=>{set(K.targetLock,tl.checked?'1':'0');enhanceStockRows();inlineStatus(`Target lock ${tl.checked?'ON':'OFF'}.`,'ok');};}
    const cm=$('#slx-compact-mode',card); if(cm){cm.checked=bool(K.compactMode,false);cm.onchange=()=>{set(K.compactMode,cm.checked?'1':'0');card.dataset.compact=cm.checked?'1':'0';};card.dataset.compact=cm.checked?'1':'0';}
    const diag=$('#slx-diagnostics',card); if(diag) diag.onclick=()=>{$('#slx-diagnostic-line',card).textContent=diagnosticsText();};
    const ex=$('#slx-export',card); if(ex) ex.onclick=exportStockManagerData;
    const im=$('#slx-import',card), fi=$('#slx-import-file',card); if(im&&fi){im.onclick=()=>fi.click();fi.onchange=()=>importStockManagerData(fi.files?.[0]);}
'''
s=s.replace(anchor,anchor+binds,1)

# CSS append before media
media='@media(max-width:600px){'
if media not in s: raise SystemExit('media')
css='.slx-stock-row-tools .slx-fav{font-size:13px!important;padding:3px 6px!important;color:#ffd36b}.slx-stock-row-tools .slx-row-progress-label{white-space:normal!important}#slx-stock-inline .slx-v070-toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}#slx-stock-inline .slx-v070-toolbar input[type="search"]{flex:1;min-width:130px}#slx-stock-inline .slx-v070-toolbar label{display:flex;align-items:center;gap:4px;font-size:9px;color:#9fb0c0}#slx-stock-inline .slx-v070-toolbar input[type="checkbox"]{width:auto}#slx-stock-inline[data-compact="1"] .slx-inline-summary,#slx-stock-inline[data-compact="1"] .slx-inline-workspace,#slx-stock-inline[data-compact="1"] .slx-inline-presets{display:none!important}'
s=s.replace(media,css+media,1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.7.0**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.7.0** completes the experimental 0.5.8→0.7 milestone with watchlist/favorites, near-benefit alerts, target lock, diagnostics, search, compact mode and local settings/history import-export.\n''',m,count=1,flags=re.S)
changes='''### v0.7.0 — UX, Search, Backup & Diagnostics\n\n- Added stock search directly in the Stock Market workspace.\n- Added Compact mode for smaller mobile/TornPDA footprint.\n- Added one-click local settings + Action Log export/import (API key excluded).\n- Added live Diagnostics line for API, Dry Run, locks, target, detected stocks/rows and portfolio positions.\n- Preserves all v0.6 safety controls and v0.5 native row tools.\n\n### v0.6.5 — Safety Center & Target Lock\n\n- Added persistent Target Lock to prevent accidental target changes from stock rows.\n- Added a consolidated safety snapshot/diagnostic state.\n- Existing direct trades continue through confirmation, Dry Run, cooldown, serialization and Action Log.\n- PANIC fallback and protected benefit-floor behavior remain active.\n\n### v0.6.0 — Watchlist-aware Trading Workspace\n\n- Favorites integrate with stock rows and filters.\n- Added Favorites-only view and persistent watchlist state.\n- Near-benefit status is shown directly beside benefit progress without executing trades automatically.\n\n### v0.5.8 — Watchlist & Near-Benefit Alerts\n\n- Added ★/☆ favorite toggle to every enhanced stock row.\n- Added Favorites-only quick filter.\n- Added configurable near-benefit calculation (default 90%) and visual ⚡ gap indicator.\n- Favorites persist locally across Torn sessions.\n\n'''
m=m.replace('## Changelog\n','## Changelog\n'+changes,1)
md.write_text(m,encoding='utf-8')
