from pathlib import Path
import json, re

stock_p=Path('SakaLuX-Stock-Manager-Advisor.user.js')
docs_p=Path('greasyfork/Stock-Manager-Advisor.md')
reg_p=Path('scripts.json')
stock=stock_p.read_text()
docs=docs_p.read_text()
reg=json.loads(reg_p.read_text())

if '// @version      0.8.0' not in stock:
    raise SystemExit('Expected Stocks v0.8.0 baseline not found')

backup=Path('backups/stocks-v0.8.0.1-stabilization-2026-09-18')
backup.mkdir(parents=True,exist_ok=True)
(backup/'SakaLuX-Stock-Manager-Advisor-v0.8.0.user.js').write_text(stock)
(backup/'Stock-Manager-Advisor-v0.8.0.md').write_text(docs)
entry=next(x for x in reg['scripts'] if x.get('id')=='stock-manager-advisor')
(backup/'scripts-stock-entry-v0.8.0.json').write_text(json.dumps(entry,indent=2,ensure_ascii=False)+'\n')

# Version surfaces.
stock=stock.replace('// @version      0.8.0','// @version      0.8.0.1',1)
stock=stock.replace("version:'0.8.0'","version:'0.8.0.1'")
stock=stock.replace("version: '0.8.0'","version: '0.8.0.1'")

# Safer automatic bank-rate capture.
stock=stock.replace(
    "if(Number.isFinite(v)&&v>=0&&v<1000){saved[key]=v;changed=true;}",
    "if(Number.isFinite(v)&&v>0&&v<100){if(Number(saved[key])!==v){saved[key]=v;changed=true;}}"
)

# Harden local history parsing/storage.
stock=stock.replace(
"  function loadTechHistoryV080(){try{return JSON.parse(get(K.techHistory,'{}')||'{}')}catch{return {}}}\n  function saveTechHistoryV080(x){try{set(K.techHistory,JSON.stringify(x))}catch{}}",
"""  function loadTechHistoryV080(){
    try{
      const raw=JSON.parse(get(K.techHistory,'{}')||'{}');
      if(!raw||typeof raw!=='object'||Array.isArray(raw)) return {};
      const now=Date.now(),cutoff=now-31*86400000,out={};
      for(const [sym,list] of Object.entries(raw)){
        if(!Array.isArray(list)) continue;
        const clean=list.map(p=>({t:Number(p?.t),p:Number(p?.p)})).filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.p)&&p.t>=cutoff&&p.t<=now+300000&&p.p>0).sort((a,b)=>a.t-b.t);
        const dedup=[]; for(const p of clean){const last=dedup[dedup.length-1];if(last&&last.t===p.t)last.p=p.p;else dedup.push(p);}
        if(dedup.length) out[String(sym).toUpperCase()]=dedup.slice(-1200);
      }
      return out;
    }catch{return {}}
  }
  function saveTechHistoryV080(x){
    try{set(K.techHistory,JSON.stringify(x));return true;}catch{}
    try{const slim={};for(const [sym,list] of Object.entries(x||{}))if(Array.isArray(list)&&list.length)slim[sym]=list.slice(-600);set(K.techHistory,JSON.stringify(slim));return true;}catch{return false;}
  }"""
)

# Selected 24H/1W/1M window must drive the indicators too, not only the chart.
stock=stock.replace(
"    const now=Date.now(),ms={'24h':86400000,'1w':604800000,'1m':2592000000}[windowKey]||86400000;\n    const points=all.filter(x=>now-Number(x.t)<=ms),values=all.map(x=>Number(x.p)).filter(x=>x>0);",
"    const now=Date.now(),safeWindow=['24h','1w','1m'].includes(windowKey)?windowKey:'24h',ms={'24h':86400000,'1w':604800000,'1m':2592000000}[safeWindow];\n    const points=all.filter(x=>now-Number(x.t)<=ms),values=points.map(x=>Number(x.p)).filter(x=>x>0);"
)

# Persist valid Technical selection fallbacks.
stock=stock.replace(
"    select.value=syms.includes(wanted)?wanted:syms[0]; win.value=get(K.techWindow,'24h');",
"    select.value=syms.includes(wanted)?wanted:syms[0]; if(select.value!==wanted)set(K.techSymbol,select.value); const wantedWindow=get(K.techWindow,'24h'); win.value=['24h','1w','1m'].includes(wantedWindow)?wantedWindow:'24h'; if(win.value!==wantedWindow)set(K.techWindow,win.value);"
)

old="""    costs.onchange=()=>{set(K.dailyCosts,costs.value);renderFinancialAdvisorV080();};
    excluded.onchange=()=>{set(K.excludedStocks,excluded.value.toUpperCase());renderAdvisor();renderOptimizer();renderFinancialAdvisorV080();};
    period.onchange=()=>{set(K.bankPeriod,period.value);renderFinancialAdvisorV080();};
    sym.onchange=()=>{set(K.techSymbol,sym.value);renderTechnicalAdvisorV080();}; win.onchange=()=>{set(K.techWindow,win.value);renderTechnicalAdvisorV080();}; analyze.onclick=()=>{recordTechnicalSnapshotV080(true);renderTechnicalAdvisorV080();};
    const sim=()=>{set(K.simFrom,from.value);set(K.simTo,to.value);set(K.simAmount,amount.value);renderPortfolioSimulatorV080();}; from.onchange=sim;to.onchange=sim;amount.onchange=sim;"""
new="""    const defer=(key,fn)=>window.SakaLuXPerf?.debounce?window.SakaLuXPerf.debounce('stocks-v0801-'+key,fn,260):setTimeout(fn,260);
    const saveCosts=()=>{set(K.dailyCosts,costs.value);defer('costs',renderFinancialAdvisorV080);}; costs.oninput=saveCosts; costs.onchange=saveCosts;
    const saveExcluded=()=>{excluded.value=excluded.value.toUpperCase();set(K.excludedStocks,excluded.value);defer('excluded',()=>{renderAdvisor();renderOptimizer();renderFinancialAdvisorV080();});}; excluded.oninput=saveExcluded; excluded.onchange=saveExcluded;
    period.onchange=()=>{set(K.bankPeriod,period.value);renderFinancialAdvisorV080();};
    sym.onchange=()=>{set(K.techSymbol,sym.value);renderTechnicalAdvisorV080();}; win.onchange=()=>{set(K.techWindow,win.value);renderTechnicalAdvisorV080();}; analyze.onclick=()=>{recordTechnicalSnapshotV080(true);renderTechnicalAdvisorV080();};
    const sim=()=>{if(from.value===to.value){const alt=[...to.options].map(o=>o.value).find(v=>v!==from.value);if(alt)to.value=alt;}set(K.simFrom,from.value);set(K.simTo,to.value);set(K.simAmount,amount.value);defer('sim',renderPortfolioSimulatorV080);}; from.onchange=sim;to.onchange=sim;amount.oninput=sim;amount.onchange=sim;"""
if old not in stock: raise SystemExit('Advisor controls anchor missing')
stock=stock.replace(old,new,1)

old="""  function renderAdvisorSuiteV080(){
    recordTechnicalSnapshotV080(false); captureBankRatesFromDomV080(); ensureAdvisorSuiteHostV080(); bindAdvisorSuiteControlsV080(); renderFinancialAdvisorV080(); renderTechnicalAdvisorV080(); renderPortfolioSimulatorV080();
  }"""
new="""  function renderAdvisorSuiteV080(){
    try{recordTechnicalSnapshotV080(false);}catch(e){console.warn('[SakaLuX Stocks] technical snapshot skipped',e);}
    try{captureBankRatesFromDomV080();}catch(e){console.warn('[SakaLuX Stocks] bank capture skipped',e);}
    if(!ensureAdvisorSuiteHostV080()) return;
    try{bindAdvisorSuiteControlsV080();}catch(e){console.warn('[SakaLuX Stocks] controls bind skipped',e);}
    for(const [name,fn] of [['Financial',renderFinancialAdvisorV080],['Technical',renderTechnicalAdvisorV080],['Simulator',renderPortfolioSimulatorV080]]){try{fn();}catch(e){console.warn('[SakaLuX Stocks] '+name+' render skipped',e);}}
  }"""
if old not in stock: raise SystemExit('Advisor suite anchor missing')
stock=stock.replace(old,new,1)

polish="""
/* SAKALUX_STOCK_STABILIZATION_V0801 */
(()=>{const id='slx-stock-stabilization-v0801-style';if(document.getElementById(id))return;const st=document.createElement('style');st.id=id;st.textContent=`
#slx-stock-advisor-suite-v080 input,#slx-stock-advisor-suite-v080 select{box-sizing:border-box!important;max-width:100%!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary>div,#slx-stock-advisor-suite-v080 .slx-v080-pick,#slx-stock-advisor-suite-v080 .slx-v080-sim-grid>div{min-width:0!important;overflow:hidden!important}
#slx-stock-advisor-suite-v080 b,#slx-stock-advisor-suite-v080 span,#slx-stock-advisor-suite-v080 small{overflow-wrap:anywhere}
@media(max-width:700px){#slx-stock-advisor-suite-v080 .slx-v080-controls,#slx-stock-advisor-suite-v080 .slx-v080-summary,#slx-stock-advisor-suite-v080 .slx-v080-picks,#slx-stock-advisor-suite-v080 .slx-v080-sim-grid{grid-template-columns:minmax(0,1fr)!important}#slx-stock-advisor-suite-v080 .slx-v080-chart{height:92px!important}#slx-stock-advisor-suite-v080 .api-help{line-height:1.45!important}}
`;document.head.appendChild(st);})();

"""
marker='/* SAKALUX_STOCK_ADVISOR_SUITE_V080_CSS */'
if marker not in stock: raise SystemExit('Advisor CSS marker missing')
if 'SAKALUX_STOCK_STABILIZATION_V0801' not in stock: stock=stock.replace(marker,polish+marker,1)
stock_p.write_text(stock)

entry['version']='0.8.0.1'
entry['description']='Torn stock vault, ROI/benefit advisor and stabilized Financial Advisor foundation with persistent settings, safer bank-rate capture, protected trading and global PANIC workflow.'
entry['release']={'date':'2026-09-18','version':'0.8.0.1','notes':[
'Stabilization and TornPDA polish before the staged v0.8.1 Technical Trade Assistant and v0.8.2 Portfolio Simulator releases.',
'Hardens local technical-history parsing, pruning and storage fallback; indicators respect the selected 24H / 1W / 1M window.',
'Persists typed Daily Costs, exclusions and Simulator amount immediately with debounced rerenders and prevents identical simulator source/target selections.',
'Tightens automatic Bank APR capture and isolates Advisor Suite card rendering failures.',
'Adds narrow-screen overflow protection and single-column TornPDA polish without changing established trading controls.'
]}
reg_p.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n')

docs=re.sub(r'## Current version\n\*\*v[^*]+\*\*','## Current version\n**v0.8.0.1**',docs,count=1)
release="""## Current release note

**v0.8.0.1 — Stabilization & TornPDA polish**
- Stabilizes the v0.8.0 foundation before v0.8.1 Technical Trade Assistant and v0.8.2 Portfolio Simulator.
- Hardens local history parsing/pruning/storage and makes technical calculations respect the selected 24H / 1W / 1M window.
- Saves Daily Costs, exclusions and Simulator amount while typing with debounced rerenders.
- Prevents identical Simulator source/target selections and tightens automatic Bank APR capture.
- Isolates Advisor Suite render failures and adds TornPDA overflow/single-column polish without changing existing trading controls.
"""
docs=re.sub(r'## Current release note\n.*?(?=\n## Installation and Hub integration)',release+'\n',docs,count=1,flags=re.S)
change="""### v0.8.0.1 — Stabilization & TornPDA polish
- Hardened local technical-history parsing, pruning, de-duplication and storage fallback.
- Technical indicators now use the selected 24H / 1W / 1M sample window.
- Daily Costs, exclusions and Simulator amount persist while typing with debounced rerenders.
- Simulator avoids identical SELL/BUY symbols; Bank auto-capture rejects implausible percentages.
- Financial, Technical and Simulator renders are isolated so one failure does not take down the full panel.
- Added narrow-screen overflow protection and one-column TornPDA polish.
- Synchronized userscript/runtime version surfaces, scripts.json, INFO, release note and changelog to v0.8.0.1.

"""
if '### v0.8.0.1 — Stabilization & TornPDA polish' not in docs: docs=docs.replace('## Changelog\n\n','## Changelog\n\n'+change,1)
docs_p.write_text(docs)
