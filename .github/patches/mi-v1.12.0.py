from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'


def rep(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing anchor: {label}')
    return text.replace(old,new,1)

s=SRC.read_text(encoding='utf-8')
s=rep(s,'// @version      1.11.0','// @version      1.12.0','metadata version')
s=rep(s,
'// @description  Torn market and travel intelligence with Best Route Basket Optimizer, budget-aware Travel planning, real flight times, Bazaar flips, Item Market signals, arrival prediction and Museum valuation.',
'// @description  Torn market and travel intelligence with Best Route Basket Optimizer, Valigia-style in-country Best Buys, budget-aware Travel planning, Bazaar flips, Item Market signals, arrival prediction and Museum valuation.',
'metadata description')
s=rep(s,"const VERSION = '1.11.0';","const VERSION = '1.12.0';",'runtime version')

s=rep(s,
"        bestRun: true,\n        stockEta: true,",
"        bestRun: true,\n        countryBestBuys: true,\n        stockEta: true,",
'default setting')

s=rep(s,
"        bestRunBudgetAware: false, bestRunAffordableRoutes: 0, bestRunBlockedRoutes: 0,\n        bestRunBasketRoutes: 0, bestRunBasketItems: 0, bestRunBasketProfit: 0",
"        bestRunBudgetAware: false, bestRunAffordableRoutes: 0, bestRunBlockedRoutes: 0,\n        bestRunBasketRoutes: 0, bestRunBasketItems: 0, bestRunBasketProfit: 0,\n        countryBestBuysRows: 0, countryBestBuyName: '', countryBestBuyProfit: 0, countryBestBuyQty: 0, countryBestBuysDestination: ''",
'country state')

anchor = """    function paintTravelBuyPlan(plan){
        document.getElementById('sl-mi-travel-plan')?.remove();
"""
if anchor not in s:
    raise SystemExit('Missing paintTravelBuyPlan anchor')

insert = r'''
    function paintCountryBestBuys(destination,entries,marketMap){
        document.getElementById('sl-mi-country-best')?.remove();
        const slots=Math.max(1,Number(settings.travelSlots)||29);
        const plan=buildTravelBuyPlan(destination,entries,marketMap);
        const plannedQty=new Map((plan?.rows||[]).map(r=>[String(r.id),Number(r.qty)||0]));
        const candidates=travelPlannerCandidates(entries,marketMap,slots).map(r=>{
            const qty=plannedQty.get(String(r.id))||0;
            const stock=Math.max(0,Number(r.stock)||0);
            return {...r,plannedQty:qty,plannedProfit:r.profitItem*qty,stock};
        });
        candidates.sort((a,b)=>{
            const ap=a.plannedQty>0?1:0,bp=b.plannedQty>0?1:0;
            if(ap!==bp)return bp-ap;
            if(ap&&bp)return b.plannedProfit-a.plannedProfit || b.profitItem-a.profitItem || b.roi-a.roi;
            return b.profitItem-a.profitItem || b.roi-a.roi;
        });
        const top=candidates.slice(0,12);
        state.countryBestBuysRows=top.length;
        state.countryBestBuysDestination=destination||'';
        state.countryBestBuyName=top[0]?.name||'';
        state.countryBestBuyProfit=top[0]?.profitItem||0;
        state.countryBestBuyQty=top[0]?.plannedQty||0;
        if(!top.length)return;

        const bar=document.createElement('div');bar.id='sl-mi-country-best';bar.className='open';
        const plannedCount=top.filter(r=>r.plannedQty>0).length;
        const budgetText=plan?.budget>0?(' · budget '+money(plan.budget)):' · unlimited budget';
        bar.innerHTML='<div class="sl-mi-country-head"><div><span class="sl-mi-br-title">🌍 BEST BUYS · '+esc(destination.toUpperCase())+'</span><strong>'+plannedCount+' recommended item'+(plannedCount===1?'':'s')+'</strong></div><div>'+((plan?.used)||0)+'/'+slots+' slots · '+money(plan?.totalProfit||0)+' profit'+budgetText+'</div><button type="button">▾</button></div>'+
            '<div class="sl-mi-country-note">Shows what is best to buy here right now. Green rows are in the optimized basket; alternatives stay ranked below. Tap an item to jump to it in Torn.</div>'+
            '<div class="sl-mi-country-summary"><span>Spend <strong>'+money(plan?.totalCost||0)+'</strong></span><span>Expected net profit <strong>'+money(plan?.totalProfit||0)+'</strong></span><span>Mode <strong>'+esc(plan?.mode||'GREEDY')+'</strong></span>'+(plan?.unusedBudget!=null?'<span>Budget left <strong>'+money(plan.unusedBudget)+'</strong></span>':'')+'</div><div class="sl-mi-country-body"></div>';
        const body=bar.querySelector('.sl-mi-country-body');
        top.forEach((r,index)=>{
            const row=document.createElement('div');row.className='sl-mi-country-row '+(r.plannedQty>0?'recommended':'alternative');row.setAttribute('role','button');row.tabIndex=0;
            const buyLabel=r.plannedQty>0?('BUY ×'+r.plannedQty):'ALT';
            const total=r.plannedQty>0?r.plannedProfit:r.profitItem;
            row.innerHTML='<span class="rank">#'+(index+1)+'</span><span class="name">'+esc(r.name)+'</span><strong class="buy">'+buyLabel+'</strong><span>stock '+Math.round(r.stock).toLocaleString('en-US')+'</span><span>buy '+money(r.buy)+'</span><span>market '+money(r.market)+'</span><span class="profit">+'+money(r.profitItem)+'/ea</span><span>'+pct(r.roi)+'</span><strong class="total">+'+money(total)+'</strong>';
            const go=()=>{try{r.row?.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){r.row?.scrollIntoView();}if(r.row){r.row.classList.add('sl-mi-target');setTimeout(()=>r.row.classList.remove('sl-mi-target'),2200);}};
            row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};body.appendChild(row);
        });
        bar.querySelector('.sl-mi-country-head').onclick=()=>bar.classList.toggle('open');
        mountTop(bar);
    }

'''
s=s.replace(anchor,insert+anchor,1)

s=rep(s,
"        flushStockHistory();\n        paintTravelBuyPlan(buildTravelBuyPlan(destination,unique,marketMap));",
"        flushStockHistory();\n        if(settings.countryBestBuys) paintCountryBestBuys(destination,unique,marketMap);\n        else paintTravelBuyPlan(buildTravelBuyPlan(destination,unique,marketMap));",
'landed board call')

s=rep(s,
"document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board,#sl-mi-market-bar,#sl-mi-travel-plan').forEach(n=>n.remove())",
"document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board,#sl-mi-market-bar,#sl-mi-travel-plan,#sl-mi-country-best').forEach(n=>n.remove())",
'force cleanup')

s=rep(s,
"+toggle('bestRun','Best Travel Run board')+toggle('stockEta','Stock + restock ETA')",
"+toggle('bestRun','Best Travel Run board')+toggle('countryBestBuys','In-country Best Buys board')+toggle('stockEta','Stock + restock ETA')",
'settings toggle html')

s=rep(s,
"for(const k of['enabled','travel','bestRun','stockEta','arrivalStock','bazaar','itemMarket','items','museum','points'])",
"for(const k of['enabled','travel','bestRun','countryBestBuys','stockEta','arrivalStock','bazaar','itemMarket','items','museum','points'])",
'settings save keys')

s=rep(s,
"bestRunBasketProfit:state.bestRunBasketProfit,arrivalRows:state.arrivalRows",
"bestRunBasketProfit:state.bestRunBasketProfit,countryBestBuysRows:state.countryBestBuysRows,countryBestBuyName:state.countryBestBuyName,countryBestBuyProfit:state.countryBestBuyProfit,countryBestBuyQty:state.countryBestBuyQty,countryBestBuysDestination:state.countryBestBuysDestination,arrivalRows:state.arrivalRows",
'health country fields')

css_anchor="#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-bazaar-board,#sl-mi-travel-plan{"
s=rep(s,css_anchor,"#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-bazaar-board,#sl-mi-travel-plan,#sl-mi-country-best{",'country panel base css')

css_insert=r'''
.sl-mi-country-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer}.sl-mi-country-head>div:first-child{display:flex;align-items:center;gap:8px;min-width:0}.sl-mi-country-head button{border:0;background:transparent;color:#d7b94c;font-size:14px}.sl-mi-country-note{margin-top:5px;color:#8f98a5;font-weight:600;font-size:9px}.sl-mi-country-summary{display:flex;gap:12px;flex-wrap:wrap;margin-top:7px;padding:6px;border:1px solid #29323a;border-radius:6px}.sl-mi-country-body{display:none;margin-top:7px;gap:4px}#sl-mi-country-best.open .sl-mi-country-body{display:flex;flex-direction:column}.sl-mi-country-row{display:grid;grid-template-columns:auto minmax(0,1.5fr) auto auto auto auto auto auto auto;gap:7px;align-items:center;padding:7px;border:1px solid #292f38;border-radius:6px;font-size:10px;cursor:pointer}.sl-mi-country-row.recommended{border-left:3px solid #78d98b;background:#142019}.sl-mi-country-row.alternative{border-left:3px solid #59616c;background:#15191f}.sl-mi-country-row:hover,.sl-mi-country-row:focus{background:#1b251f;border-color:#4d6957;outline:none}.sl-mi-country-row .rank{color:#d7b94c;font-weight:900}.sl-mi-country-row .name{font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-mi-country-row .buy,.sl-mi-country-row .profit,.sl-mi-country-row .total{color:#78d98b}.sl-mi-country-row.alternative .buy{color:#9da6b3}
'''
s=rep(s,'.sl-mi-plan-head{',css_insert+'.sl-mi-plan-head{','country css insert')

s=rep(s,
"@media(max-width:700px){.sl-mi-plan-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}",
"@media(max-width:700px){.sl-mi-country-row{grid-template-columns:auto minmax(0,1fr) auto;gap:3px 7px}.sl-mi-country-row .name{grid-column:2/-1}.sl-mi-country-row .profit,.sl-mi-country-row .total{font-weight:900}.sl-mi-plan-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}",
'country mobile css')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.12.0'
        entry['description']='Market/travel intelligence with Best Route Basket Optimizer and a Valigia-style in-country Best Buys board showing recommended quantities, stock, buy price, resale estimate, profit and ROI.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.11.0**','SakaLuX Market Intelligence: **v1.12.0**',1)
release='''### SakaLuX Market Intelligence v1.12.0\n- Added **In-Country Best Buys** for the Travel shop after landing.\n- The board is designed to provide the same kind of at-a-glance buying guidance users expect from travel-helper scripts, while using SakaLuX's own calculations and UI.\n- Shows the destination, optimized basket summary, planned spend, expected net profit, used slots and remaining budget.\n- Ranks up to 12 items with **BUY × quantity** for items selected by the optimizer and **ALT** for profitable alternatives.\n- Each row shows current stock, abroad buy price, Torn Item Market estimate, profit per item, ROI and planned/alternative profit.\n- Recommended rows are highlighted separately from alternatives.\n- Tapping a row scrolls to the matching Torn travel-shop item and highlights it; the script does not auto-buy.\n- Added an **In-country Best Buys board** toggle in Settings.\n- Added Best Buys destination/row/top-item fields to `health()`.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.11.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.11.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.11.0**','**Current version: v1.12.0**',1)
gf_release='''## v1.12.0 — In-Country Best Buys\n\n- Added a dedicated **Best Buys** board when you are already in an abroad destination.\n- Provides at-a-glance buying guidance similar in usefulness to dedicated travel-helper scripts, using SakaLuX's own interface and calculations.\n- Shows the optimized basket, planned spend, expected net profit, used travel slots and remaining budget.\n- Ranks up to 12 profitable items.\n- Items selected by the optimizer show **BUY × quantity**; other profitable choices appear as **ALT**.\n- Each item shows current stock, abroad buy price, Item Market estimate, profit per item, ROI and profit contribution.\n- Recommended items are highlighted and can be tapped to jump to the matching Torn travel-shop row.\n- No automatic purchase is performed.\n- Added a setting to enable/disable the in-country Best Buys board and added related fields to `health()`.\n\n'''
gf=gf.replace('## v1.11.0 — Best Route Basket Optimizer\n',gf_release+'## v1.11.0 — Best Route Basket Optimizer\n',1)
gf=gf.replace('No observations are uploaded to a SakaLuX server in v1.11.0.','No observations are uploaded to a SakaLuX server in v1.12.0.',1)
GF.write_text(gf,encoding='utf-8')
