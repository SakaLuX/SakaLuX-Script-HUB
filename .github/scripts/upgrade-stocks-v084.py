from pathlib import Path
import json,re

stock_p=Path('SakaLuX-Stock-Manager-Advisor.user.js')
docs_p=Path('greasyfork/Stock-Manager-Advisor.md')
reg_p=Path('scripts.json')
stock=stock_p.read_text()
docs=docs_p.read_text()
reg=json.loads(reg_p.read_text())

if '// @version      0.8.3' not in stock:
    raise SystemExit('Expected Stocks v0.8.3 baseline not found')
if 'SAKALUX_STOCK_REBALANCE_PROFILES_V084' in stock:
    raise SystemExit('Stocks v0.8.4 profiles already applied')
if 'SAKALUX_STOCK_SMART_REBALANCE_V083' not in stock:
    raise SystemExit('Smart Rebalance v0.8.3 baseline marker missing')

backup=Path('backups/stocks-v0.8.4-rebalance-profiles-2026-09-18')
backup.mkdir(parents=True,exist_ok=True)
(backup/'SakaLuX-Stock-Manager-Advisor-v0.8.3.user.js').write_text(stock)
(backup/'Stock-Manager-Advisor-v0.8.3.md').write_text(docs)
entry=next(x for x in reg['scripts'] if x.get('id')=='stock-manager-advisor')
(backup/'scripts-stock-entry-v0.8.3.json').write_text(json.dumps(entry,indent=2,ensure_ascii=False)+'\n')

stock=stock.replace('// @version      0.8.3','// @version      0.8.4',1)
stock=stock.replace("version:'0.8.3'","version:'0.8.4'")
stock=stock.replace("version: '0.8.3'","version: '0.8.4'")

pattern=re.compile(r"  /\* SAKALUX_STOCK_SMART_REBALANCE_V083 \*/.*?\n\n  function bindAdvisorSuiteControlsV080\(\)\{",re.S)
replacement=r'''  /* SAKALUX_STOCK_SMART_REBALANCE_V083 */
  /* SAKALUX_STOCK_REBALANCE_PROFILES_V084 */
  const REBALANCE_PROFILE_KEY_V084='slx_stock_rebalance_profile_v084';
  const REBALANCE_PROFILES_V084={
    safe:{id:'safe',label:'SAFE',maxPortfolioPct:.10,minScoreGap:.75,maxMoves:2,techWeight:.75,benefitWeight:.65,tierWeight:.55,affordWeight:.15},
    balanced:{id:'balanced',label:'BALANCED',maxPortfolioPct:.20,minScoreGap:.35,maxMoves:4,techWeight:1.00,benefitWeight:1.00,tierWeight:.35,affordWeight:.25},
    aggressive:{id:'aggressive',label:'AGGRESSIVE',maxPortfolioPct:.35,minScoreGap:.15,maxMoves:6,techWeight:1.20,benefitWeight:1.25,tierWeight:.20,affordWeight:.35}
  };
  function rebalanceProfileV084(){const id=String(get(REBALANCE_PROFILE_KEY_V084,'balanced')||'balanced').toLowerCase();return REBALANCE_PROFILES_V084[id]||REBALANCE_PROFILES_V084.balanced;}
  function smartRebalanceScoreV083(sym,metrics,profile=rebalanceProfileV084()){
    if(!metrics||!(metrics.price>0))return -999;
    const owned=Math.max(0,Number(metrics.owned)||ownedShares(sym));
    const tech=technicalBiasV082(sym);
    const y=positionBenefitYieldV082(sym,owned,metrics.price);
    const tier=benefitTier(sym,owned);
    const nextGap=Math.max(0,(Number(tier.next)||0)-owned);
    const nextCost=nextGap*metrics.price;
    const affordability=nextGap>0&&nextCost>0?Math.max(-1,1-Math.min(1,nextCost/Math.max(1,portfolioValueV082()))):0;
    return tech*profile.techWeight+(y*100)*profile.benefitWeight+(tier.tier>0?profile.tierWeight:0)+affordability*profile.affordWeight;
  }

  function buildSmartRebalancePlanV083(){
    const profile=rebalanceProfileV084(),rows=[];
    for(const [sym] of S.stocks){
      const m=stockRowMetrics(sym); if(!m||!(m.price>0))continue;
      const owned=Math.max(0,Number(m.owned)||ownedShares(sym));
      const free=Math.max(0,Math.floor(Number(m.freeShares)||0));
      const value=owned*m.price,freeValue=free*m.price;
      const tier=benefitTier(sym,owned);
      rows.push({sym,m,owned,free,value,freeValue,tier,tech:technicalBiasV082(sym),yield:positionBenefitYieldV082(sym,owned,m.price),score:smartRebalanceScoreV083(sym,m,profile)});
    }
    if(rows.length<2)return {moves:[],rows,total:portfolioValueV082(),profile,reason:'Need at least two detected stocks.'};
    const sources=rows.filter(r=>r.free>0&&r.freeValue>0).sort((a,b)=>(a.score-b.score)||(b.freeValue-a.freeValue));
    const targets=[...rows].sort((a,b)=>(b.score-a.score)||(b.yield-a.yield)||(b.tech-a.tech));
    const total=portfolioValueV082(); const maxMove=Math.max(1_000_000,total*profile.maxPortfolioPct);
    const usedSource=new Map(),moves=[];
    for(const src of sources){
      if(moves.length>=profile.maxMoves)break;
      const tgt=targets.find(t=>t.sym!==src.sym && t.score>src.score+profile.minScoreGap);
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
    return {moves,rows,total,profile,reason:moves.length?'':`No move cleared the ${profile.label} threshold.`};
  }

  function renderSmartRebalanceV083(){
    const host=ensureAdvisorSuiteHostV080(); if(!host)return;
    let sec=host.querySelector('#slx-smart-rebalance-v083');
    if(!sec){
      sec=document.createElement('section'); sec.id='slx-smart-rebalance-v083'; sec.className='slx-v083-rebalance';
      sec.innerHTML=`<div class="slx-v083-head"><div><span>SMART REBALANCE</span><b>Portfolio plan</b></div><button type="button" id="slx-v083-refresh">RECALCULATE</button></div><div class="slx-v084-profiles"><button data-profile="safe">SAFE</button><button data-profile="balanced">BALANCED</button><button data-profile="aggressive">AGGRESSIVE</button></div><div id="slx-v084-profile-help"></div><div id="slx-v083-summary"></div><div id="slx-v083-moves"></div><div class="api-help">Decision support only — the plan never submits trades. Protected/Benefit Lock shares remain excluded because only detected free shares are used as sell sources.</div>`;
      host.appendChild(sec);
      sec.querySelector('#slx-v083-refresh').onclick=()=>{recordTechnicalSnapshotV080(true);renderSmartRebalanceV083();};
      sec.querySelectorAll('[data-profile]').forEach(btn=>btn.onclick=()=>{set(REBALANCE_PROFILE_KEY_V084,btn.dataset.profile);renderSmartRebalanceV083();});
    }
    const plan=buildSmartRebalancePlanV083(),profile=plan.profile,sum=sec.querySelector('#slx-v083-summary'),box=sec.querySelector('#slx-v083-moves'),help=sec.querySelector('#slx-v084-profile-help');
    sec.querySelectorAll('[data-profile]').forEach(btn=>btn.classList.toggle('active',btn.dataset.profile===profile.id));
    const descriptions={safe:'Lower turnover · max 10% per move · stronger score gap · up to 2 moves',balanced:'Default mix · max 20% per move · medium score gap · up to 4 moves',aggressive:'Higher turnover · max 35% per move · lower score gap · up to 6 moves'};
    help.innerHTML=`<span>${profile.label}</span> ${descriptions[profile.id]}`;
    const moved=plan.moves.reduce((a,x)=>a+x.proceeds,0),annual=plan.moves.reduce((a,x)=>a+x.annualDelta,0),tech=plan.moves.length?plan.moves.reduce((a,x)=>a+x.techDelta,0)/plan.moves.length:0;
    sum.innerHTML=`<div class="slx-v083-summary-grid"><div><span>Profile</span><b>${profile.label}</b></div><div><span>Portfolio</span><b>${money(plan.total)}</b></div><div><span>Suggested moves</span><b>${plan.moves.length}</b></div><div><span>Capital moved</span><b>${money(moved)}</b></div><div><span>Avg tech delta</span><b>${tech>=0?'+':''}${tech.toFixed(1)}</b></div><div><span>Est. annual benefit delta</span><b class="${annual>=0?'good':'bad'}">${annual>=0?'+':''}${money(annual)}</b></div></div>`;
    if(!plan.moves.length){box.innerHTML=`<div class="slx-v080-empty">${esc(plan.reason)}</div>`;return;}
    box.innerHTML=plan.moves.map((x,i)=>`<div class="slx-v083-move"><div class="slx-v083-step">${i+1}</div><div class="slx-v083-route"><b>${esc(x.from)} → ${esc(x.to)}</b><small>SELL ${x.sellShares.toLocaleString()} · BUY ${x.buyShares.toLocaleString()} · ${money(x.proceeds)}</small></div><div class="slx-v083-metrics"><span>Score ${x.scoreDelta>=0?'+':''}${x.scoreDelta.toFixed(2)}</span><span>Tech ${x.techDelta>=0?'+':''}${x.techDelta.toFixed(1)}</span><span>Benefit ${x.annualDelta>=0?'+':''}${money(x.annualDelta)}/yr</span><span>Tier ${x.tierBefore} → ${x.tierAfter}</span></div><small class="slx-v083-unused">Unused after rounding: ${money(x.unused)}</small></div>`).join('');
  }

  function bindAdvisorSuiteControlsV080(){'''
stock,count=pattern.subn(replacement,stock,count=1)
if count!=1:
    raise SystemExit(f'Smart Rebalance block replacement count={count}')

css_marker="@media(max-width:700px){#slx-stock-advisor-suite-v080 .slx-v083-summary-grid"
if css_marker not in stock:
    raise SystemExit('v0.8.3 Smart Rebalance CSS anchor missing')
css='''#slx-stock-advisor-suite-v080 .slx-v084-profiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}#slx-stock-advisor-suite-v080 .slx-v084-profiles button{min-height:32px;border:1px solid rgba(255,255,255,.10);border-radius:9px;background:#111b26;color:#91a2b6;font-size:9px;font-weight:900;letter-spacing:.04em}#slx-stock-advisor-suite-v080 .slx-v084-profiles button.active{border-color:rgba(223,189,97,.72);background:linear-gradient(180deg,#5b471b,#33290f);color:#ffe7a3}#slx-stock-advisor-suite-v080 #slx-v084-profile-help{margin-top:6px;padding:6px 8px;border-radius:9px;background:#0d1620;color:#8fa1b4;font-size:9px;line-height:1.35}#slx-stock-advisor-suite-v080 #slx-v084-profile-help span{color:#dfbd61;font-weight:900;margin-right:5px}\n'''
stock=stock.replace(css_marker,css+css_marker,1)

if '## v0.8.4' not in docs:
    release='''\n## v0.8.4 — Rebalance Strategy Profiles\n- Adds persistent SAFE, BALANCED and AGGRESSIVE Smart Rebalance profiles.\n- SAFE limits each proposed move to 10% of portfolio value, requires a larger score gap and suggests up to 2 moves.\n- BALANCED keeps the v0.8.3 behavior as the default: 20% per move and up to 4 moves.\n- AGGRESSIVE raises the cap to 35%, accepts smaller score gaps and can suggest up to 6 moves.\n- Each profile changes technical, benefit, tier and affordability weighting while preserving Benefit Lock and preview-only execution.\n- The selected profile is saved locally and restored automatically on TornPDA/desktop.\n\n'''
    pos=docs.find('\n## ')
    docs=(docs[:pos+1]+release+docs[pos+1:]) if pos>=0 else docs+release

docs=re.sub(r'(Current version[^\n]*?)0\.8\.3',r'\g<1>0.8.4',docs,count=1,flags=re.I)
entry['version']='0.8.4'
entry['description']='Torn stock vault and advisor with Financial Advisor, Technical Trade Assistant, Portfolio Simulator and Smart Rebalance strategy profiles.'
entry['release']={'version':'0.8.4','date':'2026-09-18','notes':[
  'Adds persistent SAFE, BALANCED and AGGRESSIVE Smart Rebalance strategy profiles.',
  'Profiles adjust per-move portfolio caps, score thresholds, maximum suggested moves and technical/benefit weighting.',
  'Benefit Lock remains enforced and every rebalance plan remains preview-only with no automatic trades.'
]}
info=entry.get('info','')
if 'v0.8.4' not in info:
    entry['info']=info+' v0.8.4 adds persistent SAFE, BALANCED and AGGRESSIVE Smart Rebalance profiles that tune turnover caps, score thresholds and technical/benefit weighting while preserving Benefit Lock and preview-only behavior.'

stock_p.write_text(stock)
docs_p.write_text(docs)
reg_p.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n')
print('Prepared Stocks v0.8.4 Rebalance Strategy Profiles')
