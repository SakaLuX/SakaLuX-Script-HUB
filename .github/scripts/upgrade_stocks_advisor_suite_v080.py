from pathlib import Path
import json, re

ROOT=Path('.')
stock_path=ROOT/'SakaLuX-Stock-Manager-Advisor.user.js'
doc_path=ROOT/'greasyfork'/'Stock-Manager-Advisor.md'
reg_path=ROOT/'scripts.json'
hub_doc=ROOT/'greasyfork'/'Script-Hub.md'
backup=ROOT/'backups'/'stocks-advisor-suite-v0.8.0-2026-09-18'
backup.mkdir(parents=True, exist_ok=True)

stock=stock_path.read_text(encoding='utf-8')
doc=doc_path.read_text(encoding='utf-8')
reg_raw=reg_path.read_text(encoding='utf-8')
(backup/'SakaLuX-Stock-Manager-Advisor-v0.7.17.user.js').write_text(stock,encoding='utf-8')
(backup/'Stock-Manager-Advisor.md').write_text(doc,encoding='utf-8')
(backup/'scripts.json').write_text(reg_raw,encoding='utf-8')
if hub_doc.exists(): (backup/'Script-Hub.md').write_text(hub_doc.read_text(encoding='utf-8'),encoding='utf-8')

# Version surfaces: userscript header, standalone SELF and any live runtime version literal.
stock=stock.replace('0.7.17','0.8.0')

# Extend persisted settings keys once.
old="    txHistory: 'SLX_STOCK_TRANSACTION_HISTORY'\n  };"
new="""    txHistory: 'SLX_STOCK_TRANSACTION_HISTORY',
    dailyCosts: 'SLX_STOCK_DAILY_COSTS',
    excludedStocks: 'SLX_STOCK_EXCLUDED_STOCKS',
    bankPeriod: 'SLX_STOCK_BANK_PERIOD',
    bankRates: 'SLX_STOCK_BANK_RATES',
    techHistory: 'SLX_STOCK_TECH_HISTORY',
    techSymbol: 'SLX_STOCK_TECH_SYMBOL',
    techWindow: 'SLX_STOCK_TECH_WINDOW',
    simFrom: 'SLX_STOCK_SIM_FROM',
    simTo: 'SLX_STOCK_SIM_TO',
    simAmount: 'SLX_STOCK_SIM_AMOUNT'
  };"""
if "techHistory: 'SLX_STOCK_TECH_HISTORY'" not in stock:
    if old not in stock: raise SystemExit('K txHistory anchor not found')
    stock=stock.replace(old,new,1)

addon=r'''
  /* SAKALUX_STOCK_ADVISOR_SUITE_V080 */
  function excludedStocksSetV080() {
    return new Set(String(get(K.excludedStocks,'')).toUpperCase().split(/[\s,;]+/).map(v=>v.trim()).filter(Boolean));
  }

  function captureBankRatesFromDomV080() {
    const saved=(()=>{try{return JSON.parse(get(K.bankRates,'{}')||'{}')}catch{return {}}})();
    const href=String(location.href||'').toLowerCase();
    if(!/bank|citybank/.test(href)) return saved;
    const text=String(document.body?.innerText||'').replace(/\u00a0/g,' ');
    const specs=[['1w',/1\s*week[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i],['2w',/2\s*weeks?[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i],['1m',/1\s*month[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i],['2m',/2\s*months?[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i],['3m',/3\s*months?[^\d]{0,35}(\d+(?:\.\d+)?)\s*%/i]];
    let changed=false;
    for(const [key,re] of specs){const m=text.match(re);if(m){const v=Number(m[1]);if(Number.isFinite(v)&&v>=0&&v<1000){saved[key]=v;changed=true;}}}
    if(changed){saved.capturedAt=Date.now();set(K.bankRates,JSON.stringify(saved));}
    return saved;
  }

  function selectedBankRateV080() {
    const period=get(K.bankPeriod,'3m');
    const rates=captureBankRatesFromDomV080();
    const auto=Number(rates?.[period]);
    const manual=Math.max(0,Number(get(K.bankApr,'0'))||0);
    return {period,apr:Number.isFinite(auto)&&auto>0?auto:manual,source:Number.isFinite(auto)&&auto>0?'Torn Bank page':'Manual APR',capturedAt:Number(rates?.capturedAt)||0};
  }

  function stockIncomeSummaryV080() {
    scanStocks();
    const excluded=excludedStocksSetV080();
    let grossDaily=0, active=0;
    const rows=[];
    for(const [sym] of S.stocks) {
      if(excluded.has(sym)) continue;
      const owned=ownedShares(sym); if(!owned) continue;
      const tier=benefitTier(sym,owned); if(!tier.tier) continue;
      const baseDaily=Math.max(0,Number(benefitDailyValue(sym))||0); if(!baseDaily) continue;
      const multiplier=BENEFITS[sym]?.type==='A'?Math.max(1,tier.tier):1;
      const daily=baseDaily*multiplier;
      grossDaily+=daily; active++;
      rows.push({sym,tier:tier.tier,daily,annual:daily*365});
    }
    const costs=Math.max(0,parseAmount(get(K.dailyCosts,'0')));
    const netDaily=grossDaily-costs;
    return {grossDaily,costs,netDaily,monthly:netDaily*30,annual:netDaily*365,active,rows:rows.sort((a,b)=>b.daily-a.daily)};
  }

  function loadTechHistoryV080(){try{return JSON.parse(get(K.techHistory,'{}')||'{}')}catch{return {}}}
  function saveTechHistoryV080(x){try{set(K.techHistory,JSON.stringify(x))}catch{}}
  function recordTechnicalSnapshotV080(force=false){
    scanStocks();
    const now=Date.now(), cutoff=now-31*86400000, hist=loadTechHistoryV080();
    let changed=false;
    for(const [sym,st] of S.stocks){
      const price=Number(st?.price||0); if(!(price>0)) continue;
      let arr=Array.isArray(hist[sym])?hist[sym].filter(p=>Number(p?.t)>=cutoff&&Number(p?.p)>0):[];
      const last=arr[arr.length-1];
      if(force||!last||now-Number(last.t)>=300000){arr.push({t:now,p:price});changed=true;}
      if(arr.length>1200) arr=arr.slice(-1200);
      hist[sym]=arr;
    }
    if(changed) saveTechHistoryV080(hist);
    return hist;
  }

  function emaV080(values,period){if(!values.length)return null;const k=2/(period+1);let e=values[0];for(let i=1;i<values.length;i++)e=values[i]*k+e*(1-k);return e;}
  function rsiV080(values,period=14){if(values.length<period+1)return null;let gain=0,loss=0;for(let i=values.length-period;i<values.length;i++){const d=values[i]-values[i-1];if(d>=0)gain+=d;else loss-=d;}if(loss===0)return 100;const rs=(gain/period)/(loss/period);return 100-(100/(1+rs));}
  function bollingerV080(values,period=20){if(values.length<period)return null;const v=values.slice(-period),mean=v.reduce((a,b)=>a+b,0)/v.length,sd=Math.sqrt(v.reduce((a,b)=>a+Math.pow(b-mean,2),0)/v.length);return {mid:mean,upper:mean+2*sd,lower:mean-2*sd};}
  function sparklineV080(points){
    if(!points.length)return '<div class="slx-v080-empty">No local price history yet.</div>';
    const vals=points.map(x=>Number(x.p)).filter(x=>x>0); if(!vals.length)return '';
    const lo=Math.min(...vals),hi=Math.max(...vals),span=Math.max(1e-9,hi-lo),w=320,h=82,pad=4;
    const coords=vals.map((v,i)=>`${pad+(i/Math.max(1,vals.length-1))*(w-pad*2)},${pad+(1-(v-lo)/span)*(h-pad*2)}`).join(' ');
    return `<svg class="slx-v080-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Local price history"><polyline points="${coords}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div class="slx-v080-range"><span>${money(lo)}</span><span>${money(hi)}</span></div>`;
  }

  function technicalStatsV080(sym,windowKey){
    const hist=recordTechnicalSnapshotV080(false),all=Array.isArray(hist[sym])?hist[sym]:[];
    const now=Date.now(),ms={24h:86400000,1w:604800000,1m:2592000000}[windowKey]||86400000;
    const points=all.filter(x=>now-Number(x.t)<=ms),values=all.map(x=>Number(x.p)).filter(x=>x>0);
    const price=Number(S.stocks.get(sym)?.price||values[values.length-1]||0),rsi=rsiV080(values,14),ema20=values.length?emaV080(values.slice(-Math.max(20,Math.min(values.length,180))),20):null,ema90=values.length>=2?emaV080(values.slice(-Math.max(90,Math.min(values.length,360))),90):null,bb=bollingerV080(values,20);
    let trend='Collecting history',signal='Neutral / insufficient history';
    if(ema20!=null&&ema90!=null){trend=ema20>ema90?'Uptrend':'Downtrend';signal=ema20>ema90?'Momentum positive':'Momentum weak';}
    if(rsi!=null){if(rsi<=30)signal='RSI oversold';else if(rsi>=70)signal='RSI overbought';}
    if(bb&&price){if(price<bb.lower)signal='Below lower Bollinger band';else if(price>bb.upper)signal='Above upper Bollinger band';}
    return {points,allCount:all.length,price,rsi,ema20,ema90,bb,trend,signal};
  }

  function ensureAdvisorSuiteHostV080(){
    const p=S.panel?.isConnected?S.panel:document.querySelector('#slx-stock-panel,[data-slx-stock-panel]'); if(!p)return null;
    let host=p.querySelector('#slx-stock-advisor-suite-v080'); if(host)return host;
    host=document.createElement('div'); host.id='slx-stock-advisor-suite-v080';
    host.innerHTML=`
      <div class="section slx-v080-section"><div class="title">💰 Financial Advisor</div>
        <div class="slx-v080-controls"><label>Daily costs<input id="slx-v080-daily-costs" placeholder="e.g. 2m"></label><label>Bank period<select id="slx-v080-bank-period"><option value="1w">1 week</option><option value="2w">2 weeks</option><option value="1m">1 month</option><option value="2m">2 months</option><option value="3m">3 months</option></select></label></div>
        <label class="slx-v080-wide">Excluded stocks<input id="slx-v080-excluded" placeholder="e.g. TCI,WLT"></label>
        <div id="slx-v080-financial"></div>
      </div>
      <div class="section slx-v080-section"><div class="title">📈 Technical Trade Assistant</div>
        <div class="slx-v080-controls"><label>Stock<select id="slx-v080-tech-symbol"></select></label><label>Window<select id="slx-v080-tech-window"><option value="24h">24H</option><option value="1w">1W</option><option value="1m">1M</option></select></label></div>
        <button type="button" id="slx-v080-analyze">ANALYZE NOW</button><div id="slx-v080-technical"></div>
      </div>
      <div class="section slx-v080-section"><div class="title">🧮 Portfolio Simulator</div>
        <div class="slx-v080-controls"><label>Sell from<select id="slx-v080-sim-from"></select></label><label>Buy into<select id="slx-v080-sim-to"></select></label></div>
        <label class="slx-v080-wide">Amount to reallocate<input id="slx-v080-sim-amount" placeholder="e.g. 10m"></label>
        <div id="slx-v080-simulator"></div><div class="api-help">Preview only — the simulator never sends a trade.</div>
      </div>`;
    const opt=p.querySelector('#slx-stock-optimizer-body')?.closest('.section');
    if(opt?.parentNode) opt.parentNode.insertBefore(host,opt); else (p.querySelector('.body')||p).appendChild(host);
    return host;
  }

  function renderFinancialAdvisorV080(){
    const host=ensureAdvisorSuiteHostV080(),box=host?.querySelector('#slx-v080-financial'); if(!box)return;
    const x=stockIncomeSummaryV080(), bank=selectedBankRateV080(), days=({1w:7,2w:14,1m:30,2m:60,3m:90}[bank.period]||90), market=buildPortfolioRows().reduce((n,r)=>n+(Number(r.value)||0),0),bankReturn=market>0&&bank.apr>0?market*(bank.apr/100)*(days/365):0;
    const candidates=buildRoiCandidates().filter(r=>!excludedStocksSetV080().has(r.sym)).slice().sort((a,b)=>(Number(b.roi)||0)-(Number(a.roi)||0));
    const best=candidates[0]||null,affordable=candidates.find(r=>r.affordable)||null;
    const card=(label,r)=>`<div class="slx-v080-pick"><span>${label}</span><b>${r?`${r.sym} · ${(Number(r.roi)||0).toFixed(2)}% APR`:'—'}</b><small>${r?`Tier ${r.tier} · gap ${money(Number(r.cost)||0)} · ${Number.isFinite(Number(r.paybackDays))?Math.round(Number(r.paybackDays))+'d payback':'n/a'}`:'No candidate'}</small></div>`;
    box.innerHTML=`<div class="slx-v080-summary"><div><span>Income / day</span><b>${money(x.grossDaily)}</b></div><div><span>Costs / day</span><b>${money(x.costs)}</b></div><div><span>Net / day</span><b class="${x.netDaily>=0?'good':'bad'}">${x.netDaily>=0?'+':'-'}${money(Math.abs(x.netDaily))}</b></div><div><span>Net / month</span><b>${x.monthly>=0?'+':'-'}${money(Math.abs(x.monthly))}</b></div></div><div class="slx-v080-picks">${card('BEST ROI',best)}${card('BEST AFFORDABLE',affordable)}</div><div class="api-help">Bank ${bank.period}: ${bank.apr?bank.apr.toFixed(2)+'% APR':'not configured'} · ${bank.source}${bank.apr?` · est. ${money(bankReturn)} over selected period`:''}</div>${x.rows.length?`<div class="slx-v080-list">${x.rows.slice(0,12).map(r=>`<div><b>${r.sym}</b><span>Tier ${r.tier}</span><span>${money(r.daily)}/day</span><span>${money(r.annual)}/yr</span></div>`).join('')}</div>`:'<div class="slx-v080-empty">No valued active stock benefits detected.</div>'}`;
  }

  function renderTechnicalAdvisorV080(){
    const host=ensureAdvisorSuiteHostV080(); if(!host)return;
    const select=host.querySelector('#slx-v080-tech-symbol'),win=host.querySelector('#slx-v080-tech-window'),box=host.querySelector('#slx-v080-technical');
    const syms=[...S.stocks.keys()].sort(); if(!syms.length){box.innerHTML='<div class="slx-v080-empty">No stock prices detected yet.</div>';return;}
    const wanted=get(K.techSymbol,syms[0]); if(select.options.length!==syms.length||![...select.options].every((o,i)=>o.value===syms[i]))select.innerHTML=syms.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
    select.value=syms.includes(wanted)?wanted:syms[0]; win.value=get(K.techWindow,'24h');
    const st=technicalStatsV080(select.value,win.value),fmt=x=>x==null?'—':Number(x).toLocaleString(undefined,{maximumFractionDigits:2});
    box.innerHTML=`<div class="slx-v080-summary"><div><span>Price</span><b>${money(st.price)}</b></div><div><span>RSI 14</span><b>${fmt(st.rsi)}</b></div><div><span>EMA 20</span><b>${st.ema20==null?'—':money(st.ema20)}</b></div><div><span>EMA 90</span><b>${st.ema90==null?'—':money(st.ema90)}</b></div></div>${sparklineV080(st.points)}<div class="slx-v080-signal"><b>${esc(st.trend)}</b><span>${esc(st.signal)}</span></div><div class="api-help">Bollinger: ${st.bb?`${money(st.bb.lower)} — ${money(st.bb.upper)}`:'needs 20 samples'} · Local samples: ${st.allCount}. History is collected locally at most once every 5 minutes while Stocks is used.</div>`;
  }

  function renderPortfolioSimulatorV080(){
    const host=ensureAdvisorSuiteHostV080(); if(!host)return;
    const fromSel=host.querySelector('#slx-v080-sim-from'),toSel=host.querySelector('#slx-v080-sim-to'),amountEl=host.querySelector('#slx-v080-sim-amount'),box=host.querySelector('#slx-v080-simulator');
    const syms=[...S.stocks.keys()].sort(); if(!syms.length){box.innerHTML='<div class="slx-v080-empty">No stocks detected.</div>';return;}
    const fill=(el)=>{if(el.options.length!==syms.length||![...el.options].every((o,i)=>o.value===syms[i]))el.innerHTML=syms.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');}; fill(fromSel);fill(toSel);
    const f=get(K.simFrom,syms[0]),t=get(K.simTo,syms.find(s=>s!==f)||syms[0]); fromSel.value=syms.includes(f)?f:syms[0]; toSel.value=syms.includes(t)?t:(syms.find(s=>s!==fromSel.value)||fromSel.value); amountEl.value=get(K.simAmount,'10m');
    const from=stockRowMetrics(fromSel.value),to=stockRowMetrics(toSel.value),amount=Math.max(0,parseAmount(amountEl.value));
    if(!from||!to||!(from.price>0)||!(to.price>0)){box.innerHTML='<div class="slx-v080-empty">Waiting for live stock metrics.</div>';return;}
    const sellable=Math.max(0,Math.floor(Number(from.freeShares)||0)),sellShares=Math.min(sellable,Math.floor(amount/from.price)),proceeds=sellShares*from.price,buyShares=Math.floor(proceeds/to.price),toOwned=Math.max(0,Number(to.owned)||ownedShares(toSel.value)),afterOwned=toOwned+buyShares,beforeTier=benefitTier(toSel.value,toOwned),afterTier=benefitTier(toSel.value,afterOwned),beforeGap=Math.max(0,(Number(beforeTier.next)||0)-toOwned),afterGap=Math.max(0,(Number(afterTier.next)||0)-afterOwned);
    box.innerHTML=`<div class="slx-v080-sim-grid"><div><span>SELL</span><b>${sellShares.toLocaleString()} ${esc(fromSel.value)}</b><small>${money(proceeds)} · max safe ${sellable.toLocaleString()} shares</small></div><div><span>BUY</span><b>${buyShares.toLocaleString()} ${esc(toSel.value)}</b><small>${money(buyShares*to.price)}</small></div><div><span>Tier before → after</span><b>${beforeTier.tier} → ${afterTier.tier}</b><small>Next gap ${beforeGap.toLocaleString()} → ${afterGap.toLocaleString()} shares</small></div><div><span>Unused cash</span><b>${money(Math.max(0,proceeds-buyShares*to.price))}</b><small>Benefit Lock respected on sell side</small></div></div>`;
  }

  function bindAdvisorSuiteControlsV080(){
    const host=ensureAdvisorSuiteHostV080(); if(!host||host.dataset.bound==='1')return; host.dataset.bound='1';
    const costs=host.querySelector('#slx-v080-daily-costs'),excluded=host.querySelector('#slx-v080-excluded'),period=host.querySelector('#slx-v080-bank-period'),sym=host.querySelector('#slx-v080-tech-symbol'),win=host.querySelector('#slx-v080-tech-window'),analyze=host.querySelector('#slx-v080-analyze'),from=host.querySelector('#slx-v080-sim-from'),to=host.querySelector('#slx-v080-sim-to'),amount=host.querySelector('#slx-v080-sim-amount');
    costs.value=get(K.dailyCosts,'0'); excluded.value=get(K.excludedStocks,''); period.value=get(K.bankPeriod,'3m');
    costs.onchange=()=>{set(K.dailyCosts,costs.value);renderFinancialAdvisorV080();};
    excluded.onchange=()=>{set(K.excludedStocks,excluded.value.toUpperCase());renderAdvisor();renderOptimizer();renderFinancialAdvisorV080();};
    period.onchange=()=>{set(K.bankPeriod,period.value);renderFinancialAdvisorV080();};
    sym.onchange=()=>{set(K.techSymbol,sym.value);renderTechnicalAdvisorV080();}; win.onchange=()=>{set(K.techWindow,win.value);renderTechnicalAdvisorV080();}; analyze.onclick=()=>{recordTechnicalSnapshotV080(true);renderTechnicalAdvisorV080();};
    const sim=()=>{set(K.simFrom,from.value);set(K.simTo,to.value);set(K.simAmount,amount.value);renderPortfolioSimulatorV080();}; from.onchange=sim;to.onchange=sim;amount.onchange=sim;
  }

  function renderAdvisorSuiteV080(){
    recordTechnicalSnapshotV080(false); captureBankRatesFromDomV080(); ensureAdvisorSuiteHostV080(); bindAdvisorSuiteControlsV080(); renderFinancialAdvisorV080(); renderTechnicalAdvisorV080(); renderPortfolioSimulatorV080();
  }
'''

if 'SAKALUX_STOCK_ADVISOR_SUITE_V080' not in stock:
    anchor='  function buildOptimizerRows() {'
    if anchor not in stock: raise SystemExit('buildOptimizerRows anchor missing')
    stock=stock.replace(anchor,addon+'\n'+anchor,1)

# Advisor/optimizer exclusions: keep Portfolio visible, ignore selected symbols in recommendations.
def add_exclusion(fn,text):
    start=text.find(f'  function {fn}(')
    if start<0: return text
    end=text.find('\n  function ',start+10)
    if end<0: end=len(text)
    seg=text[start:end]
    if 'excludedStocksSetV080()' in seg: return text
    seg=seg.replace('    const rows=[];','    const rows=[];\n    const excludedV080=excludedStocksSetV080();',1)
    seg=seg.replace('    for(const [sym,st] of S.stocks) {','    for(const [sym,st] of S.stocks) {\n      if(excludedV080.has(sym)) continue;',1)
    return text[:start]+seg+text[end:]
stock=add_exclusion('buildRoiCandidates',stock)
stock=add_exclusion('buildOptimizerRows',stock)

# Render the new suite whenever full panel opens.
if "safeRender('Advisor Suite',renderAdvisorSuiteV080)" not in stock:
    stock,n=re.subn(r"safeRender\('Action Log',renderActionLog\);\s*}","safeRender('Action Log',renderActionLog); safeRender('Advisor Suite',renderAdvisorSuiteV080); }",stock,count=1)
    if n!=1: raise SystemExit('openPanel render hook not found')

# UI contract for the new sections; appended once inside the userscript scope.
css_block=r'''

/* SAKALUX_STOCK_ADVISOR_SUITE_V080_CSS */
(()=>{
 const id='slx-stock-advisor-suite-v080-style';if(document.getElementById(id))return;const st=document.createElement('style');st.id=id;st.textContent=`
#slx-stock-advisor-suite-v080{display:block!important}
#slx-stock-advisor-suite-v080 .slx-v080-section{border-color:#2f4053!important;background:linear-gradient(180deg,#131d28,#0d151e)!important}
#slx-stock-advisor-suite-v080 .slx-v080-controls{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:8px 0!important}
#slx-stock-advisor-suite-v080 label{display:flex!important;flex-direction:column!important;gap:4px!important;color:#9cabbc!important;font-size:10px!important}
#slx-stock-advisor-suite-v080 input,#slx-stock-advisor-suite-v080 select{width:100%!important;box-sizing:border-box!important;height:34px!important;min-height:34px!important;padding:6px 8px!important;border:1px solid #34465b!important;border-radius:8px!important;background:#0d1622!important;color:#edf3fa!important;font-size:11px!important}
#slx-stock-advisor-suite-v080 button{min-height:34px!important;height:34px!important;padding:0 10px!important;border:1px solid #3b6fa7!important;border-radius:8px!important;background:linear-gradient(180deg,#2f78c6,#245e9e)!important;color:#fff!important;font-size:10px!important;font-weight:900!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;margin:9px 0!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary>div{min-width:0!important;padding:8px 5px!important;border:1px solid #2b3a4b!important;border-radius:9px!important;background:#121b25!important;text-align:center!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary span{display:block!important;color:#8493a5!important;font-size:8px!important;text-transform:uppercase!important}
#slx-stock-advisor-suite-v080 .slx-v080-summary b{display:block!important;margin-top:3px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#f1f5f9!important;font-size:11px!important}
#slx-stock-advisor-suite-v080 .good{color:#5cdb91!important}#slx-stock-advisor-suite-v080 .bad{color:#ff7b86!important}
#slx-stock-advisor-suite-v080 .slx-v080-picks{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin:7px 0!important}.slx-v080-pick{padding:9px!important;border:1px solid #3a4858!important;border-radius:9px!important;background:#111923!important}.slx-v080-pick>span{display:block!important;color:#dfbd61!important;font-size:8px!important;font-weight:900!important}.slx-v080-pick>b{display:block!important;margin-top:3px!important;color:#fff!important;font-size:11px!important}.slx-v080-pick>small{display:block!important;margin-top:3px!important;color:#93a4b7!important;font-size:8px!important;line-height:1.35!important}
#slx-stock-advisor-suite-v080 .slx-v080-list{margin-top:7px!important;border:1px solid #293746!important;border-radius:9px!important;overflow:hidden!important}.slx-v080-list>div{display:grid!important;grid-template-columns:.7fr .7fr 1fr 1fr!important;gap:6px!important;align-items:center!important;padding:7px 8px!important;border-bottom:1px solid rgba(255,255,255,.055)!important;font-size:9px!important}.slx-v080-list>div:last-child{border-bottom:0!important}.slx-v080-list span{color:#a3afbe!important;text-align:right!important}
#slx-stock-advisor-suite-v080 .slx-v080-chart{display:block!important;width:100%!important;height:82px!important;margin-top:8px!important;padding:5px!important;box-sizing:border-box!important;border:1px solid #2d3d50!important;border-radius:9px!important;background:#0b121a!important;color:#4f8fe8!important}.slx-v080-range{display:flex!important;justify-content:space-between!important;margin-top:3px!important;color:#7f8b9a!important;font-size:8px!important}.slx-v080-signal{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-top:7px!important;padding:8px!important;border-radius:9px!important;background:#121b25!important;border:1px solid #2b3a4b!important;font-size:9px!important}.slx-v080-signal span{color:#dfbd61!important;text-align:right!important}
#slx-stock-advisor-suite-v080 .slx-v080-sim-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-top:8px!important}.slx-v080-sim-grid>div{padding:9px!important;border:1px solid #2d3d50!important;border-radius:9px!important;background:#111923!important}.slx-v080-sim-grid span{display:block!important;color:#8291a4!important;font-size:8px!important;text-transform:uppercase!important}.slx-v080-sim-grid b{display:block!important;margin-top:3px!important;color:#f2f6fb!important;font-size:11px!important}.slx-v080-sim-grid small{display:block!important;margin-top:3px!important;color:#93a4b7!important;font-size:8px!important;line-height:1.35!important}.slx-v080-empty{padding:10px!important;text-align:center!important;color:#8795a6!important;font-size:9px!important}
@media(max-width:520px){#slx-stock-advisor-suite-v080 .slx-v080-summary{grid-template-columns:1fr 1fr!important}#slx-stock-advisor-suite-v080 .slx-v080-picks,#slx-stock-advisor-suite-v080 .slx-v080-sim-grid{grid-template-columns:1fr!important}.slx-v080-list>div{grid-template-columns:.6fr .6fr 1fr 1fr!important;font-size:8px!important}}
`; (document.head||document.documentElement).appendChild(st);
})();
'''
# Insert CSS helper before final userscript closure to keep it executable in scope-neutral form.
if 'SAKALUX_STOCK_ADVISOR_SUITE_V080_CSS' not in stock:
    stock += css_block

stock_path.write_text(stock,encoding='utf-8')

# scripts.json: complete INFO + RELEASE synchronization.
reg=json.loads(reg_raw)
entry=next((x for x in reg.get('scripts',[]) if x.get('id')=='stock-manager-advisor'),None)
if not entry: raise SystemExit('stock-manager-advisor missing from scripts.json')
entry['version']='0.8.0'
entry['description']='Torn stock vault, ROI/benefit advisor, financial income analysis, local technical indicators, portfolio simulation, protected trading and global PANIC workflow.'
entry['info']='Stock Manager & Advisor is the SakaLuX stock decision-support and protected-trading module. It provides stock-vault targets, Vault Max/Keep, Withdraw/Withdraw All, Benefit Lock, portfolio and cost-basis views, ROI and next-benefit analysis, quick BUY/SELL tools, favorites, filters, guided rebalance, transaction history and a global PANIC cash-to-stock workflow. v0.8.0 adds a Financial Advisor with daily/monthly income and cost modelling, Best ROI and Best Affordable cards, bank-period comparison with best-effort automatic rate capture from Torn Bank pages, a local Technical Trade Assistant with 24H/1W/1M history, RSI 14, EMA 20/90, Bollinger bands and an SVG chart, plus a no-trade Portfolio Simulator that previews safe excess-share reallocation while respecting Benefit Lock. Technical history is stored locally and grows as the module is used; no external market-history service is required.'
entry['release']={
  'date':'2026-09-18','version':'0.8.0','notes':[
    'Adds Financial Advisor: stock-benefit income per day/month/year, configurable daily costs, net profit, Best ROI and Best Affordable cards, stock exclusions and bank-period comparison.',
    'Adds best-effort automatic bank-rate capture when a Torn Bank page is visited, with the existing manual APR retained as fallback.',
    'Adds Technical Trade Assistant with locally collected 24H/1W/1M price history, RSI 14, EMA 20/90, Bollinger bands, trend/signal text and an inline SVG price chart.',
    'Adds Portfolio Simulator for SELL excess -> BUY target what-if scenarios without executing trades; Benefit Lock remains respected.',
    'Synchronizes userscript, standalone registration, scripts.json INFO/NEW metadata and Stock Manager release documentation to v0.8.0.'
  ]
}
reg_path.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# GreasyFork INFO / release / changelog. Replace stale current release note and prepend v0.8.0 changelog.
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*','## Current version\n**v0.8.0**',doc,count=1)
what='''## What it does
- Stock vault target selection directly from the Torn Stocks page.
- Vault Max / Vault Keep, Withdraw / Withdraw All and Benefit Lock protected-share floors.
- Torn API sync for money, portfolio positions and stock catalog, with dedicated API Access management.
- Portfolio dashboard, cost-basis coverage, unrealized P/L, quick BUY/SELL, favorites, sort/filter and transaction history.
- ROI / next-benefit Advisor with marginal APR, payback and bank comparison.
- **Financial Advisor** with benefit income per day/month/year, configurable daily costs, net profit, Best ROI and Best Affordable cards, exclusions and bank-period comparison.
- **Automatic bank-rate capture** when a Torn Bank page exposes supported 1w / 2w / 1m / 2m / 3m rates; manual APR remains the fallback.
- **Technical Trade Assistant** using locally collected price history with 24H / 1W / 1M chart, RSI 14, EMA 20 / EMA 90 and Bollinger bands.
- **Portfolio Simulator** for no-trade SELL-excess → BUY-target scenarios while preserving Benefit Lock.
- Guided rebalance preview/execution, Dry Run, Target Lock, action log and global PANIC cash-to-stock workflow.
- Shared Script Hub / Standalone Dock integration and TornPDA-first UI.
'''
doc=re.sub(r'## What it does\n.*?\n## Current release note',what+'\n## Current release note',doc,count=1,flags=re.S)
release='''## Current release note

**v0.8.0 — Advisor Suite**
- Adds Financial Advisor with daily/monthly/yearly benefit income, configurable daily costs, net profit, Best ROI / Best Affordable, exclusions and bank-period comparison.
- Captures supported Torn Bank rates when available on the Bank page and falls back to the existing manual APR setting.
- Adds local Technical Trade Assistant: 24H / 1W / 1M history, RSI 14, EMA 20/90, Bollinger bands, trend/signal text and inline SVG chart. History is local and accumulates as Stocks is used.
- Adds Portfolio Simulator for safe excess-share reallocation previews. It never trades and respects Benefit Lock on the simulated sell side.
- Keeps all existing Vault, Withdraw, quick trade, Rebalance, Dry Run, Target Lock, PANIC, API and Hub/Standalone functionality.
'''
doc=re.sub(r'## Current release note\n.*?\n## Installation and Hub integration',release+'\n## Installation and Hub integration',doc,count=1,flags=re.S)
ch='''### v0.8.0 — Advisor Suite
- Financial Advisor: benefit income/day/month/year, daily-cost modelling, net profit, Best ROI, Best Affordable, exclusions and bank-period comparison.
- Best-effort Torn Bank rate capture with manual APR fallback.
- Technical Trade Assistant with local 24H/1W/1M history, RSI 14, EMA 20/90, Bollinger bands and SVG chart.
- Portfolio Simulator for SELL excess → BUY target what-if scenarios; simulation never submits orders.
- `scripts.json`, INFO, release metadata, standalone/runtime version surfaces and documentation synchronized to v0.8.0.

'''
idx=doc.find('## Changelog')
if idx>=0 and '### v0.8.0 — Advisor Suite' not in doc:
    pos=doc.find('\n',idx)+1; doc=doc[:pos]+'\n'+ch+doc[pos:]
doc_path.write_text(doc,encoding='utf-8')

# Hub documentation version reference only; do not bump Hub itself.
if hub_doc.exists():
    h=hub_doc.read_text(encoding='utf-8')
    h=re.sub(r'(SakaLuX Stock Manager[^\n]*?\*\*v)0\.7\.17(\*\*)',r'\g<1>0.8.0\2',h)
    hub_doc.write_text(h,encoding='utf-8')

print('Stocks Advisor Suite v0.8.0 patch complete')
