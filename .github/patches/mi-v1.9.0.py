from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'


def rep(text,old,new,label):
    if old not in text:
        raise SystemExit('Missing anchor: '+label)
    return text.replace(old,new,1)

s=SRC.read_text(encoding='utf-8')
if '// @version      1.8.0' not in s:
    raise SystemExit('Expected v1.8.0 source')

s=rep(s,'// @version      1.8.0','// @version      1.9.0','metadata version')
s=rep(s,
'// @description  Torn market and travel intelligence with budget-aware Travel Buy Planner, real flight-time detection, Bazaar Flip Intelligence, Item Market trend/signals, arrival prediction and Museum valuation.',
'// @description  Torn market and travel intelligence with profit-optimized Travel Buy Planner, real flight times, Bazaar flips, Item Market signals, arrival prediction and Museum valuation.',
'description')
s=rep(s,"const VERSION = '1.8.0';","const VERSION = '1.9.0';",'runtime version')
s=rep(s,
"        travelPlanItems: 0, travelPlanCost: 0, travelPlanProfit: 0, travelPlanSlots: 0,\n        travelPlanBudget: 0, travelPlanUnusedBudget: 0",
"        travelPlanItems: 0, travelPlanCost: 0, travelPlanProfit: 0, travelPlanSlots: 0,\n        travelPlanBudget: 0, travelPlanUnusedBudget: 0, travelPlanMode: '', travelPlanOptimizationGain: 0",
'state optimizer fields')

old=r'''    function buildTravelBuyPlan(destination, entries, marketMap) {
        const slots=Math.max(1,Number(settings.travelSlots)||29);
        const configuredBudget=Math.max(0,Number(settings.travelBudget)||0);
        let budgetLeft=configuredBudget>0?configuredBudget:Infinity;
        const ranked=[];
        for(const e of entries){
            const market=marketMap.get(e.id);if(!market)continue;
            const m=metrics(e.buy,market.price);if(m.profit<=0)continue;
            const stock=e.stock==null?slots:Math.max(0,Number(e.stock)||0);
            if(stock<=0)continue;
            ranked.push({id:e.id,name:e.name,buy:e.buy,stock,market:market.price,profitItem:m.profit,roi:m.roi,row:e.row,efficiency:e.buy>0?m.profit/e.buy:0});
        }
        ranked.sort((a,b)=>b.profitItem-a.profitItem || b.efficiency-a.efficiency || b.roi-a.roi);
        let remaining=slots,totalCost=0,totalProfit=0;
        const plan=[];
        for(const r of ranked){
            if(remaining<=0||budgetLeft<=0)break;
            const affordable=Number.isFinite(budgetLeft)?Math.floor(budgetLeft/r.buy):remaining;
            const qty=Math.min(remaining,r.stock,affordable);
            if(qty<=0)continue;
            const cost=r.buy*qty,profit=r.profitItem*qty;
            totalCost+=cost;totalProfit+=profit;remaining-=qty;
            if(Number.isFinite(budgetLeft))budgetLeft-=cost;
            plan.push({...r,qty,cost,profit});
        }
        return {destination,slots,used:slots-remaining,remaining,totalCost,totalProfit,rows:plan,budget:configuredBudget,unusedBudget:configuredBudget>0?Math.max(0,configuredBudget-totalCost):null};
    }'''

new=r'''    function travelPlannerCandidates(entries,marketMap,slots){
        const ranked=[];
        for(const e of entries){
            const market=marketMap.get(e.id);if(!market)continue;
            const m=metrics(e.buy,market.price);if(m.profit<=0)continue;
            const stock=e.stock==null?slots:Math.max(0,Number(e.stock)||0);
            if(stock<=0||!(e.buy>0))continue;
            ranked.push({id:e.id,name:e.name,buy:e.buy,stock:Math.min(stock,slots),market:market.price,profitItem:m.profit,roi:m.roi,row:e.row,efficiency:m.profit/e.buy});
        }
        return ranked;
    }

    function buildGreedyTravelPlan(destination,candidates,slots,configuredBudget){
        let budgetLeft=configuredBudget>0?configuredBudget:Infinity;
        const ranked=candidates.slice().sort((a,b)=>b.profitItem-a.profitItem || b.efficiency-a.efficiency || b.roi-a.roi);
        let remaining=slots,totalCost=0,totalProfit=0;const plan=[];
        for(const r of ranked){
            if(remaining<=0||budgetLeft<=0)break;
            const affordable=Number.isFinite(budgetLeft)?Math.floor(budgetLeft/r.buy):remaining;
            const qty=Math.min(remaining,r.stock,affordable);if(qty<=0)continue;
            const cost=r.buy*qty,profit=r.profitItem*qty;
            totalCost+=cost;totalProfit+=profit;remaining-=qty;
            if(Number.isFinite(budgetLeft))budgetLeft-=cost;
            plan.push({...r,qty,cost,profit});
        }
        return {destination,slots,used:slots-remaining,remaining,totalCost,totalProfit,rows:plan,budget:configuredBudget,unusedBudget:configuredBudget>0?Math.max(0,configuredBudget-totalCost):null,mode:'GREEDY'};
    }

    function prunePlannerStates(states,budget,maxStates=700){
        if(!states.length)return states;
        states=states.filter(x=>x.cost<=budget).sort((a,b)=>a.cost-b.cost || b.profit-a.profit);
        const out=[];let bestProfit=-Infinity;
        for(const st of states){
            if(st.profit<=bestProfit+0.0001)continue;
            bestProfit=st.profit;out.push(st);
        }
        if(out.length<=maxStates)return out;
        const kept=[];const step=(out.length-1)/(maxStates-1);
        for(let i=0;i<maxStates;i++)kept.push(out[Math.round(i*step)]);
        return kept;
    }

    function buildOptimizedTravelPlan(destination,candidates,slots,configuredBudget){
        if(!(configuredBudget>0))return buildGreedyTravelPlan(destination,candidates,slots,configuredBudget);
        const budget=configuredBudget;
        const states=Array.from({length:slots+1},()=>[]);
        states[0]=[{cost:0,profit:0,counts:{}}];
        for(const item of candidates){
            const next=states.map(bucket=>bucket.slice());
            for(let used=0;used<=slots;used++){
                const bucket=states[used];if(!bucket.length)continue;
                const maxQty=Math.min(item.stock,slots-used,Math.floor(budget/item.buy));
                for(const base of bucket){
                    const affordable=Math.min(maxQty,Math.floor((budget-base.cost)/item.buy));
                    for(let qty=1;qty<=affordable;qty++){
                        const nu=used+qty;
                        const cost=base.cost+item.buy*qty;
                        const profit=base.profit+item.profitItem*qty;
                        const counts={...base.counts,[item.id]:(base.counts[item.id]||0)+qty};
                        next[nu].push({cost,profit,counts});
                    }
                }
            }
            for(let used=0;used<=slots;used++)next[used]=prunePlannerStates(next[used],budget);
            for(let used=0;used<=slots;used++)states[used]=next[used];
        }
        let best={cost:0,profit:0,counts:{},used:0};
        for(let used=0;used<=slots;used++)for(const st of states[used]){
            if(st.profit>best.profit+0.0001 || (Math.abs(st.profit-best.profit)<0.0001&&used>best.used))best={...st,used};
        }
        const byId=new Map(candidates.map(x=>[String(x.id),x]));
        const rows=[];
        for(const [id,qtyRaw] of Object.entries(best.counts)){
            const r=byId.get(String(id)),qty=Number(qtyRaw)||0;if(!r||qty<=0)continue;
            rows.push({...r,qty,cost:r.buy*qty,profit:r.profitItem*qty});
        }
        rows.sort((a,b)=>b.profit-a.profit || b.profitItem-a.profitItem);
        const totalCost=rows.reduce((sum,r)=>sum+r.cost,0),totalProfit=rows.reduce((sum,r)=>sum+r.profit,0),used=rows.reduce((sum,r)=>sum+r.qty,0);
        return {destination,slots,used,remaining:slots-used,totalCost,totalProfit,rows,budget:configuredBudget,unusedBudget:Math.max(0,configuredBudget-totalCost),mode:'OPTIMIZED'};
    }

    function buildTravelBuyPlan(destination, entries, marketMap) {
        const slots=Math.max(1,Number(settings.travelSlots)||29);
        const configuredBudget=Math.max(0,Number(settings.travelBudget)||0);
        const candidates=travelPlannerCandidates(entries,marketMap,slots);
        const greedy=buildGreedyTravelPlan(destination,candidates,slots,configuredBudget);
        const optimized=buildOptimizedTravelPlan(destination,candidates,slots,configuredBudget);
        optimized.greedyProfit=greedy.totalProfit;
        optimized.optimizationGain=Math.max(0,optimized.totalProfit-greedy.totalProfit);
        optimized.candidateCount=candidates.length;
        return optimized;
    }'''
s=rep(s,old,new,'replace planner algorithm')

s=rep(s,
"        state.travelPlanBudget=plan?.budget||0;\n        state.travelPlanUnusedBudget=plan?.unusedBudget||0;",
"        state.travelPlanBudget=plan?.budget||0;\n        state.travelPlanUnusedBudget=plan?.unusedBudget||0;\n        state.travelPlanMode=plan?.mode||'';\n        state.travelPlanOptimizationGain=plan?.optimizationGain||0;",
'planner state output')

s=rep(s,
"        const budgetText=plan.budget>0?(' · budget '+money(plan.budget)):' · unlimited budget';",
"        const budgetText=plan.budget>0?(' · budget '+money(plan.budget)):' · unlimited budget';\n        const modeText=plan.mode==='OPTIMIZED'?'OPTIMIZED':'GREEDY';\n        const gainText=plan.optimizationGain>0?(' · +'+money(plan.optimizationGain)+' vs greedy'):'';",
'planner mode strings')
s=rep(s,
"<div>'+plan.used+'/'+plan.slots+' slots · '+money(plan.totalProfit)+' profit'+budgetText+'</div>",
"<div>'+plan.used+'/'+plan.slots+' slots · '+money(plan.totalProfit)+' profit · '+modeText+gainText+budgetText+'</div>",
'planner headline')
s=rep(s,
"Recommended quantities respect both travel capacity and your configured cash budget. 0 budget means unlimited.",
"Recommended quantities maximize estimated total net profit across your slot limit and cash budget. 0 budget uses the simpler slot-only greedy path because that is already optimal without a cash constraint.",
'planner note')

s=rep(s,
"travelPlanBudget:state.travelPlanBudget,travelPlanUnusedBudget:state.travelPlanUnusedBudget",
"travelPlanBudget:state.travelPlanBudget,travelPlanUnusedBudget:state.travelPlanUnusedBudget,travelPlanMode:state.travelPlanMode,travelPlanOptimizationGain:state.travelPlanOptimizationGain",
'health optimizer fields')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.9.0'
        e['description']='Market/travel intelligence with profit-optimized Travel Buy Planner under slot + cash budget constraints, real Torn flight times, Bazaar flips, Item Market signals, arrival prediction and Museum valuation.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.8.0**','SakaLuX Market Intelligence: **v1.9.0**',1)
release='''### SakaLuX Market Intelligence v1.9.0\n- Added **Travel Profit Optimizer** on top of Travel Budget Planner.\n- When a cash budget is configured, the planner now searches combinations of abroad items instead of simply taking items greedily in profit-per-item order.\n- The optimizer maximizes estimated **total net profit** while respecting both travel slots, current stock and the configured cash budget.\n- Uses a bounded Pareto-frontier dynamic-programming solver by slot count and cost/profit dominance, avoiding an impractical dollar-by-dollar budget table.\n- With unlimited budget, the planner keeps the simpler profit-per-item greedy path because that is already optimal when slots are the only constraint.\n- Planner header shows **OPTIMIZED** or **GREEDY** and, when applicable, the extra profit gained versus the old greedy budget plan.\n- Added `travelPlanMode` and `travelPlanOptimizationGain` to `health()`.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.8.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.8.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.8.0**','**Current version: v1.9.0**',1)
gf_release='''## v1.9.0 — Travel Profit Optimizer\n\n- Travel Budget Planner now optimizes the item combination for **maximum estimated total net profit** under both slot and cash-budget constraints.\n- Uses current stock and item buy prices together with the existing Item Market profit estimates.\n- The budget optimizer uses a Pareto-frontier dynamic-programming approach rather than a dollar-by-dollar budget matrix.\n- With no budget limit, the existing highest-profit-per-item fill remains because it is already optimal for a pure slot constraint.\n- Planner clearly shows **OPTIMIZED** or **GREEDY** mode.\n- When optimization beats the old greedy budget plan, the panel shows the additional expected profit gained.\n- `health()` exposes optimizer mode and optimization gain.\n\n'''
gf=gf.replace('## v1.8.0 — Travel Budget Planner\n',gf_release+'## v1.8.0 — Travel Budget Planner\n',1)
GF.write_text(gf,encoding='utf-8')
