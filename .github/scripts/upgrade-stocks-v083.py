from pathlib import Path
import json,re

stock_p=Path('SakaLuX-Stock-Manager-Advisor.user.js')
docs_p=Path('greasyfork/Stock-Manager-Advisor.md')
reg_p=Path('scripts.json')
stock=stock_p.read_text()
docs=docs_p.read_text()
reg=json.loads(reg_p.read_text())

if '// @version      0.8.2' not in stock:
    raise SystemExit('Expected Stocks v0.8.2 baseline not found')
if 'SAKALUX_STOCK_SMART_REBALANCE_V083' in stock:
    raise SystemExit('Stocks v0.8.3 Smart Rebalance already applied')

backup=Path('backups/stocks-v0.8.3-smart-rebalance-2026-09-18')
backup.mkdir(parents=True,exist_ok=True)
(backup/'SakaLuX-Stock-Manager-Advisor-v0.8.2.user.js').write_text(stock)
(backup/'Stock-Manager-Advisor-v0.8.2.md').write_text(docs)
entry=next(x for x in reg['scripts'] if x.get('id')=='stock-manager-advisor')
(backup/'scripts-stock-entry-v0.8.2.json').write_text(json.dumps(entry,indent=2)+'\n')

stock=stock.replace('// @version      0.8.2','// @version      0.8.3',1)
stock=stock.replace("version:'0.8.2'","version:'0.8.3'")
stock=stock.replace("version: '0.8.2'","version: '0.8.3'")

anchor='  function bindAdvisorSuiteControlsV080(){'
if anchor not in stock:
    raise SystemExit('Advisor controls anchor not found')

inject=r'''  /* SAKALUX_STOCK_SMART_REBALANCE_V083 */
  function smartRebalanceScoreV083(sym,metrics){
    if(!metrics||!(metrics.price>0))return -999;
    const owned=Math.max(0,Number(metrics.owned)||ownedShares(sym));
    const tech=technicalBiasV082(sym);
    const y=positionBenefitYieldV082(sym,owned,metrics.price);
    const tier=benefitTier(sym,owned);
    const nextGap=Math.max(0,(Number(tier.next)||0)-owned);
    const nextCost=nextGap*metrics.price;
    const affordability=nextGap>0&&nextCost>0?Math.max(-1,1-Math.min(1,nextCost/Math.max(1,portfolioValueV082()))):0;
    return tech+(y*100)+(tier.tier>0?0.35:0)+affordability*0.25;
  }

  function buildSmartRebalancePlanV083(){
    const rows=[];
    for(const [sym] of S.stocks){
      const m=stockRowMetrics(sym); if(!m||!(m.price>0))continue;
      const owned=Math.max(0,Number(m.owned)||ownedShares(sym));
      const free=Math.max(0,Math.floor(Number(m.freeShares)||0));
      const value=owned*m.price,freeValue=free*m.price;
      const tier=benefitTier(sym,owned);
      rows.push({sym,m,owned,free,value,freeValue,tier,tech:technicalBiasV082(sym),yield:positionBenefitYieldV082(sym,owned,m.price),score:smartRebalanceScoreV083(sym,m)});
    }
    if(rows.length<2)return {moves:[],rows,total:portfolioValueV082(),reason:'Need at least two detected stocks.'};
    const sources=rows.filter(r=>r.free>0&&r.freeValue>0).sort((a,b)=>(a.score-b.score)||(b.freeValue-a.freeValue));
    const targets=[...rows].sort((a,b)=>(b.score-a.score)||(b.yield-a.yield)||(b.tech-a.tech));
    const total=portfolioValueV082(); const maxMove=Math.max(1_000_000,total*0.20);
    const usedSource=new Map(); const moves=[];
    for(const src of sources){
      if(moves.length>=4)break;
      const tgt=targets.find(t=>t.sym!==src.sym && t.score>src.score+0.35);
      if(!tgt)continue;
      const remainingShares=Math.max(0,src.free-(usedSource.get(src.sym)||0)); if(!remainingShares)continue;
      const available=remainingShares*src.m.price;
      const amount=Math.min(available,maxMove);
      const sellShares=Math.max(0,Math.min(remainingShares,Math.floor(amount/src.m.price)));
      const proceeds=sellShares*src.m.price; if(!(proceeds>0))continue;
      const buyShares=Math.floor(proceeds/tgt.m.price); if(!(buyShares>0))continue;
      const buyCost=buyShares*tgt.m.price,unused=Math.max(0,proceeds-buyCost);
      const srcAfter=Math.max(0,src.owned-sellShares),tgtAfter=tgt.owned+buyShares;
      const srcYieldAfter=positionBenefitYieldV082(src.sym,srcAfter,src.m.price),tgtYieldAfter=positionBenefitYieldV082(tgt.sym,tgtAfter,tgt.m.price);
      const annualBefore=src.yield*(src.owned*src.m.price)+tgt.yield*(tgt.owned*tgt.m.price);
      const annualAfter=srcYieldAfter*(srcAfter*src.m.price)+tgtYieldAfter*(tgtAfter*tgt.m.price);
      const beforeTier=tgt.tier,afterTier=benefitTier(tgt.sym,tgtAfter);
      moves.push({from:src.sym,to:tgt.sym,sellShares,buyShares,proceeds,buyCost,unused,scoreDelta:tgt.score-src.score,techDelta:tgt.tech-src.tech,annualDelta:annualAfter-annualBefore,tierBefore:beforeTier.tier,tierAfter:afterTier.tier});
      usedSource.set(src.sym,(usedSource.get(src.sym)||0)+sellShares);
    }
    return {moves,rows,total,reason:moves.length?'':'No positive rebalance move cleared the current safety threshold.'};
  }

  function renderSmartRebalanceV083(){
    const host=ensureAdvisorSuiteHostV080(); if(!host)return;
    let sec=host.querySelector('#slx-smart-rebalance-v083');
    if(!sec){
      sec=document.createElement('section'); sec.id='slx-smart-rebalance-v083'; sec.className='slx-v083-rebalance';
      sec.innerHTML=`<div class="slx-v083-head"><div><span>SMART REBALANCE</span><b>Portfolio plan</b></div><button type="button" id="slx-v083-refresh">RECALCULATE</button></div><div id="slx-v083-summary"></div><div id="slx-v083-moves"></div><div class="api-help">Decision support only — the plan never submits trades. Protected/Benefit Lock shares remain excluded because only detected free shares are used as sell sources.</div>`;
      host.appendChild(sec);
      sec.querySelector('#slx-v083-refresh').onclick=()=>{recordTechnicalSnapshotV080(true);renderSmartRebalanceV083();};
    }
    const plan=buildSmartRebalancePlanV083(),sum=sec.querySelector('#slx-v083-summary'),box=sec.querySelector('#slx-v083-moves');
    const moved=plan.moves.reduce((a,x)=>a+x.proceeds,0),annual=plan.moves.reduce((a,x)=>a+x.annualDelta,0),tech=plan.moves.length?plan.moves.reduce((a,x)=>a+x.techDelta,0)/plan.moves.length:0;
    sum.innerHTML=`<div class="slx-v083-summary-grid"><div><span>Portfolio</span><b>${money(plan.total)}</b></div><div><span>Suggested moves</span><b>${plan.moves.length}</b></div><div><span>Capital moved</span><b>${money(moved)}</b></div><div><span>Avg tech delta</span><b>${tech>=0?'+':''}${tech.toFixed(1)}</b></div><div><span>Est. annual benefit delta</span><b class="${annual>=0?'good':'bad'}">${annual>=0?'+':''}${money(annual)}</b></div></div>`;
    if(!plan.moves.length){box.innerHTML=`<div class="slx-v080-empty">${esc(plan.reason)}</div>`;return;}
    box.innerHTML=plan.moves.map((x,i)=>`<div class="slx-v083-move"><div class="slx-v083-step">${i+1}</div><div class="slx-v083-route"><b>${esc(x.from)} → ${esc(x.to)}</b><small>SELL ${x.sellShares.toLocaleString()} · BUY ${x.buyShares.toLocaleString()} · ${money(x.proceeds)}</small></div><div class="slx-v083-metrics"><span>Score ${x.scoreDelta>=0?'+':''}${x.scoreDelta.toFixed(2)}</span><span>Tech ${x.techDelta>=0?'+':''}${x.techDelta.toFixed(1)}</span><span>Benefit ${x.annualDelta>=0?'+':''}${money(x.annualDelta)}/yr</span><span>Tier ${x.tierBefore} → ${x.tierAfter}</span></div><small class="slx-v083-unused">Unused after rounding: ${money(x.unused)}</small></div>`).join('');
  }

'''
stock=stock.replace(anchor,inject+anchor,1)

old="for(const [name,fn] of [['Financial',renderFinancialAdvisorV080],['Technical',renderTechnicalAdvisorV080],['Simulator',renderPortfolioSimulatorV080]])"
new="for(const [name,fn] of [['Financial',renderFinancialAdvisorV080],['Technical',renderTechnicalAdvisorV080],['Simulator',renderPortfolioSimulatorV080],['SmartRebalance',renderSmartRebalanceV083]])"
if old not in stock:
    raise SystemExit('Advisor render list anchor not found')
stock=stock.replace(old,new,1)

style_anchor='/* SAKALUX_STOCK_PORTFOLIO_V082 */'
if style_anchor not in stock:
    raise SystemExit('Portfolio style marker not found')
css=r'''(()=>{const id='slx-stock-smart-rebalance-v083-style';if(document.getElementById(id))return;const st=document.createElement('style');st.id=id;st.textContent=`
#slx-stock-advisor-suite-v080 .slx-v083-rebalance{margin-top:10px;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:#0b121b}#slx-stock-advisor-suite-v080 .slx-v083-head{display:flex;align-items:center;justify-content:space-between;gap:8px}#slx-stock-advisor-suite-v080 .slx-v083-head span{display:block;color:#91a2b6;font-size:9px;font-weight:900;letter-spacing:.08em}#slx-stock-advisor-suite-v080 .slx-v083-head b{display:block;margin-top:2px;font-size:14px}#slx-stock-advisor-suite-v080 .slx-v083-head button{border:1px solid rgba(255,255,255,.11);border-radius:9px;background:#111c28;color:#dce7f2;padding:7px 9px;font-size:9px;font-weight:900}
#slx-stock-advisor-suite-v080 .slx-v083-summary-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:8px}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid>div{padding:8px;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:#101923;min-width:0}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid span{display:block;color:#899bad;font-size:8px;font-weight:900;text-transform:uppercase}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid b{display:block;margin-top:3px;font-size:11px;overflow:hidden;text-overflow:ellipsis}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid .good{color:#55d98a}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid .bad{color:#ff6b78}
#slx-stock-advisor-suite-v080 .slx-v083-move{display:grid;grid-template-columns:26px minmax(0,1fr);gap:6px 8px;margin-top:7px;padding:8px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:#0e1721}#slx-stock-advisor-suite-v080 .slx-v083-step{grid-row:1/4;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#162332;font-weight:900;font-size:10px}#slx-stock-advisor-suite-v080 .slx-v083-route b{font-size:12px}#slx-stock-advisor-suite-v080 .slx-v083-route small,#slx-stock-advisor-suite-v080 .slx-v083-unused{display:block;color:#91a2b6;margin-top:2px;line-height:1.3}#slx-stock-advisor-suite-v080 .slx-v083-metrics{display:flex;flex-wrap:wrap;gap:5px}#slx-stock-advisor-suite-v080 .slx-v083-metrics span{padding:3px 6px;border-radius:999px;background:#162332;color:#b9c7d6;font-size:9px;font-weight:800}
@media(max-width:700px){#slx-stock-advisor-suite-v080 .slx-v083-summary-grid{grid-template-columns:1fr 1fr}#slx-stock-advisor-suite-v080 .slx-v083-summary-grid>div:last-child{grid-column:1/-1}}
`;document.head.appendChild(st);})();

'''
stock=stock.replace(style_anchor,css+style_anchor,1)

# docs
if '## v0.8.3' not in docs:
    release='''\n## v0.8.3 — Smart Rebalance Engine\n- Adds a portfolio-wide Smart Rebalance plan beneath the What-if simulator.\n- Uses only free/protected-safe shares as sell sources, preserving Benefit Lock.\n- Ranks source and target stocks from local technical score, benefit yield and benefit-tier context.\n- Produces up to four preview-only SELL → BUY moves with capital, share counts, score delta, technical delta, benefit delta and tier movement.\n- Adds a Recalculate action that refreshes the local technical snapshot before rebuilding the plan.\n- No trade is submitted automatically.\n\n'''
    pos=docs.find('\n## ')
    docs=(docs[:pos+1]+release+docs[pos+1:]) if pos>=0 else docs+release

docs=re.sub(r'(Current version[^\n]*?)0\.8\.2',r'\g<1>0.8.3',docs,count=1,flags=re.I)

entry['version']='0.8.3'
entry['release']={
  'version':'0.8.3','date':'2026-09-18','notes':[
    'Adds a portfolio-wide Smart Rebalance plan using only free shares as sell sources.',
    'Ranks source and target positions with local technical score, benefit yield and benefit-tier context.',
    'Shows up to four preview-only SELL → BUY moves with capital, share, technical, benefit and tier deltas.'
  ]
}
info=entry.get('info','')
if 'v0.8.3' not in info:
    entry['info']=info+' v0.8.3 adds a portfolio-wide Smart Rebalance Engine that builds preview-only SELL → BUY plans from free shares while respecting Benefit Lock and combining local technical signals with benefit context.'

stock_p.write_text(stock)
docs_p.write_text(docs)
reg_p.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n')
print('Prepared Stocks v0.8.3 Smart Rebalance Engine')
