from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'

def rep(text, old, new, label):
    if old not in text:
        raise SystemExit('Missing anchor: '+label)
    return text.replace(old,new,1)

s=SRC.read_text(encoding='utf-8')
if '// @version      1.9.0' not in s:
    raise SystemExit('Expected v1.9.0 source')
s=rep(s,'// @version      1.9.0','// @version      1.10.0','metadata version')
s=rep(s,"const VERSION = '1.9.0';","const VERSION = '1.10.0';",'runtime version')
s=rep(s,
'// @description  Torn market and travel intelligence with profit-optimized Travel Buy Planner, real flight times, Bazaar flips, Item Market signals, arrival prediction and Museum valuation.',
'// @description  Torn market and travel intelligence with budget-aware Best Travel Run, profit-optimized Travel Buy Planner, real flight times, Bazaar flips, Item Market signals, arrival prediction and Museum valuation.',
'description')

s=rep(s,
"        travelPlanItems: 0, travelPlanCost: 0, travelPlanProfit: 0, travelPlanSlots: 0, travelPlanBudget: 0, travelPlanUnusedBudget: 0",
"        travelPlanItems: 0, travelPlanCost: 0, travelPlanProfit: 0, travelPlanSlots: 0, travelPlanBudget: 0, travelPlanUnusedBudget: 0,\n        bestRunBudgetAware: false, bestRunAffordableRoutes: 0, bestRunBlockedRoutes: 0",
'best run state')

old_build='''    function buildBestRunRows(candidates,marketMap,actualTimes){
        const slots=Math.max(1,Number(settings.travelSlots)||29),ranked=[];
        for(const r of candidates){
            const market=marketMap.get(r.itemId),flight=flightInfo(r.destination,actualTimes);if(!market||!flight)continue;
            const m=metrics(r.buyPrice,market.price);if(m.profit<=0)continue;
            const qty=r.stock==null?slots:Math.min(slots,r.stock);if(qty<=0)continue;
            const profitRun=m.profit*qty,roundTrip=flight.mins*2,profitHour=profitRun/(roundTrip/60);
            ranked.push(Object.assign({},r,{market:market.price,net:m.net,profitItem:m.profit,roi:m.roi,qty,profitRun,profitHour,flightMins:flight.mins,flightSource:flight.source,eta:estimateRestock(r.destination,r.itemId)}));
        }
        return ranked.sort((a,b)=>b.profitHour-a.profitHour).slice(0,11);
    }
'''
new_build='''    function buildBestRunRows(candidates,marketMap,actualTimes){
        const slots=Math.max(1,Number(settings.travelSlots)||29),budget=Math.max(0,Number(settings.travelBudget)||0),ranked=[];
        let blocked=0;
        for(const r of candidates){
            const market=marketMap.get(r.itemId),flight=flightInfo(r.destination,actualTimes);if(!market||!flight)continue;
            const m=metrics(r.buyPrice,market.price);if(m.profit<=0)continue;
            const stockQty=r.stock==null?slots:Math.min(slots,Math.max(0,Number(r.stock)||0));
            const affordableQty=budget>0?Math.floor(budget/Math.max(1,r.buyPrice)):stockQty;
            const qty=Math.min(stockQty,affordableQty);
            if(qty<=0){blocked++;continue;}
            const costRun=r.buyPrice*qty,profitRun=m.profit*qty,roundTrip=flight.mins*2,profitHour=profitRun/(roundTrip/60);
            ranked.push(Object.assign({},r,{market:market.price,net:m.net,profitItem:m.profit,roi:m.roi,qty,costRun,profitRun,profitHour,flightMins:flight.mins,flightSource:flight.source,eta:estimateRestock(r.destination,r.itemId),budgetLimited:budget>0&&affordableQty<stockQty}));
        }
        state.bestRunBudgetAware=budget>0;
        state.bestRunAffordableRoutes=ranked.length;
        state.bestRunBlockedRoutes=blocked;
        return ranked.sort((a,b)=>b.profitHour-a.profitHour || b.profitRun-a.profitRun).slice(0,11);
    }
'''
s=rep(s,old_build,new_build,'budget-aware best run builder')

old_row="""            row.innerHTML='<span class=\"name\">'+esc(r.name)+'</span><span>'+esc(r.destination)+'</span><span>stock '+(r.stock==null?'?':Number(r.stock).toLocaleString('en-US'))+'</span><span class=\"eta\">'+eta+'</span><span>'+money(r.profitRun)+'/run</span><strong>'+money(r.profitHour)+'/hr</strong>';
"""
new_row="""            const costLine='cost '+money(r.costRun)+(r.budgetLimited?' · budget capped':'');
            row.innerHTML='<span class=\"name\">'+esc(r.name)+'</span><span>'+esc(r.destination)+'</span><span>stock '+(r.stock==null?'?':Number(r.stock).toLocaleString('en-US'))+' · buy ×'+r.qty+'</span><span class=\"eta\">'+eta+' · '+costLine+'</span><span>'+money(r.profitRun)+'/run</span><strong>'+money(r.profitHour)+'/hr</strong>';
"""
s=rep(s,old_row,new_row,'best run row budget details')

old_cached="""        if(cachedTop.length) paintBestTravelRun(cachedTop,'instant cache · '+(actualTimes.size?'actual Torn times '+actualTimes.size+'/'+Object.keys(FLIGHT_MINS).length:'fallback flight times')+' · refreshing '+TRAVEL_REFRESH_LIMIT+' prices');
"""
new_cached="""        if(cachedTop.length) paintBestTravelRun(cachedTop,'instant cache · '+(settings.travelBudget>0?('budget '+money(settings.travelBudget)+' · '):'')+(actualTimes.size?'actual Torn times '+actualTimes.size+'/'+Object.keys(FLIGHT_MINS).length:'fallback flight times')+' · refreshing '+TRAVEL_REFRESH_LIMIT+' prices');
"""
s=rep(s,old_cached,new_cached,'cached phase label')
old_live="""        if(finalTop.length) paintBestTravelRun(finalTop,'live-refreshed · '+(actualTimes.size?'actual Torn flight times':'fallback flight times')+' · '+ids.length+' prices checked');
"""
new_live="""        if(finalTop.length) paintBestTravelRun(finalTop,'live-refreshed · '+(settings.travelBudget>0?('budget '+money(settings.travelBudget)+' · '):'')+(actualTimes.size?'actual Torn flight times':'fallback flight times')+' · '+ids.length+' prices checked');
"""
s=rep(s,old_live,new_live,'live phase label')

s=rep(s,
"travelPlanUnusedBudget:state.travelPlanUnusedBudget,museumSets:state.museumSets",
"travelPlanUnusedBudget:state.travelPlanUnusedBudget,bestRunBudgetAware:state.bestRunBudgetAware,bestRunAffordableRoutes:state.bestRunAffordableRoutes,bestRunBlockedRoutes:state.bestRunBlockedRoutes,museumSets:state.museumSets",
'health budget best run')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.10.0'
        entry['description']='Market/travel intelligence with budget-aware Best Travel Run, profit-optimized Travel Buy Planner, real Torn flight times, Bazaar flips, Item Market signals, arrival prediction and Museum valuation.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.9.0**','SakaLuX Market Intelligence: **v1.10.0**',1)
release='''### SakaLuX Market Intelligence v1.10.0\n- Best Travel Run is now **budget-aware**.\n- When Travel budget is greater than 0, each route is ranked using only the quantity that can actually be afforded with that budget.\n- Routes that cannot afford even one unit are excluded from the recommendation list.\n- Best Travel Run rows now show planned buy quantity, trip purchase cost and whether the route was budget-capped.\n- Profit/run and profit/hour are recalculated from the affordable quantity instead of pretending the full travel capacity can always be purchased.\n- Cache-first and live-refreshed Best Travel Run phases both use the same budget-aware logic.\n- Added `bestRunBudgetAware`, `bestRunAffordableRoutes` and `bestRunBlockedRoutes` to `health()`.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.9.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.9.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.9.0**','**Current version: v1.10.0**',1)
gf_release='''## v1.10.0 — Budget-Aware Best Travel Run\n\n- Best Travel Run now respects the configured **Travel budget ($)**.\n- Recommended routes use only the quantity that can actually be purchased with the available budget.\n- A route is hidden when the budget cannot afford even one unit.\n- Each recommendation shows buy quantity, trip cost and whether the quantity was capped by budget.\n- Profit per run and profit per hour are recalculated from the affordable quantity.\n- Budget logic applies to both instant cached results and live-refreshed results.\n- `health()` now exposes whether Best Travel Run is budget-aware plus affordable/blocked route counts.\n\n'''
if '## v1.9.0' in gf:
    gf=gf.replace('## v1.9.0',gf_release+'## v1.9.0',1)
else:
    gf=gf.replace('**Greasy Fork:** script **592781**\n\n','**Greasy Fork:** script **592781**\n\n'+gf_release,1)
GF.write_text(gf,encoding='utf-8')
