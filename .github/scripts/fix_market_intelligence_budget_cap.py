from pathlib import Path

p = Path('SakaLuX-Market-Intelligence.user.js')
s = p.read_text(encoding='utf-8')

# Bump release once from the current version.
s = s.replace('// @version      1.17.55', '// @version      1.17.56', 1)

marker = '/* SakaLuX Travel Hard Budget Cap v1 */'
if marker not in s:
    anchor = """    function buildTravelBuyPlan(destination, entries, marketMap, budgetOverride=null) {\n        const slots=Math.max(1,Number(settings.travelSlots)||29);\n        const configuredBudget=Number.isFinite(Number(budgetOverride))&&Number(budgetOverride)>=0?Math.max(0,Number(budgetOverride)):Math.max(0,Number(settings.travelBudget)||0);\n        const candidates=travelPlannerCandidates(entries,marketMap,slots);\n        const greedy=buildGreedyTravelPlan(destination,candidates,slots,configuredBudget);\n        const optimized=buildOptimizedTravelPlan(destination,candidates,slots,configuredBudget);\n        optimized.greedyProfit=greedy.totalProfit;\n        optimized.optimizationGain=Math.max(0,optimized.totalProfit-greedy.totalProfit);\n        optimized.candidateCount=candidates.length;\n        return optimized;\n    }\n"""

    replacement = """    /* SakaLuX Travel Hard Budget Cap v1 */\n    function enforceTravelBudgetCap(plan, configuredBudget, slots) {\n        const budget=Math.max(0,Number(configuredBudget)||0);\n        if(!plan||!(budget>0))return plan;\n        const rows=Array.isArray(plan.rows)?plan.rows:[];\n        let left=budget,totalCost=0,totalProfit=0,used=0;\n        const capped=[];\n        for(const r of rows){\n            if(left<=0||used>=slots)break;\n            const buy=Math.max(0,Number(r.buy)||0);\n            if(!(buy>0))continue;\n            const requested=Math.max(0,Math.floor(Number(r.qty)||0));\n            const affordable=Math.floor(left/buy);\n            const qty=Math.min(requested,affordable,Math.max(0,slots-used));\n            if(qty<=0)continue;\n            const cost=buy*qty;\n            const profit=(Number(r.profitItem)||0)*qty;\n            capped.push({...r,qty,cost,profit});\n            totalCost+=cost;totalProfit+=profit;used+=qty;left-=cost;\n        }\n        if(totalCost>budget){\n            console.warn('[SakaLuX Market Intelligence] Travel budget cap invariant failed', {totalCost,budget});\n        }\n        return {...plan,rows:capped,totalCost,totalProfit,used,remaining:Math.max(0,slots-used),budget,unusedBudget:Math.max(0,budget-totalCost),budgetCapped:true};\n    }\n\n    function buildTravelBuyPlan(destination, entries, marketMap, budgetOverride=null) {\n        const slots=Math.max(1,Number(settings.travelSlots)||29);\n        const configuredBudget=Number.isFinite(Number(budgetOverride))&&Number(budgetOverride)>=0?Math.max(0,Number(budgetOverride)):Math.max(0,Number(settings.travelBudget)||0);\n        const candidates=travelPlannerCandidates(entries,marketMap,slots);\n        const greedy=buildGreedyTravelPlan(destination,candidates,slots,configuredBudget);\n        const optimized=buildOptimizedTravelPlan(destination,candidates,slots,configuredBudget);\n        optimized.greedyProfit=greedy.totalProfit;\n        optimized.optimizationGain=Math.max(0,optimized.totalProfit-greedy.totalProfit);\n        optimized.candidateCount=candidates.length;\n        return enforceTravelBudgetCap(optimized,configuredBudget,slots);\n    }\n"""

    if anchor not in s:
        raise SystemExit('buildTravelBuyPlan anchor not found')
    s = s.replace(anchor, replacement, 1)

p.write_text(s, encoding='utf-8')
