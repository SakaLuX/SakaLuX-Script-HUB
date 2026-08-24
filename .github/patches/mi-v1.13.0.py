from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'

s=SRC.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit('Missing anchor: '+label)
    s=s.replace(old,new,1)

rep('// @version      1.12.0','// @version      1.13.0','meta version')
rep('// @description  Torn market and travel intelligence with Best Route Basket Optimizer, Valigia-style in-country Best Buys, budget-aware Travel planning, Bazaar flips, Item Market signals, arrival prediction and Museum valuation.',
    '// @description  Torn market and travel intelligence with Best Route Basket Optimizer, in-country Best Buys and an Arrival Basket Planner that prepares the optimal shopping mix before landing.',
    'meta description')
rep("const VERSION = '1.12.0';","const VERSION = '1.13.0';",'runtime version')
rep("        arrivalStock: true,\n        bazaar: true,","        arrivalStock: true,\n        arrivalBasket: true,\n        bazaar: true,",'default arrival basket')
rep("        arrivalRows: 0, flightDestination: '', landingMins: null,",
    "        arrivalRows: 0, flightDestination: '', landingMins: null, arrivalBasketItems: 0, arrivalBasketCost: 0, arrivalBasketProfit: 0, arrivalBasketSlots: 0, arrivalBasketMode: '',",
    'arrival state')

start=s.index('    async function renderArrivalStock(){')
end=s.index('    function travelPlannerCandidates(',start)
new_func=r'''    async function renderArrivalStock(){
        document.getElementById('sl-mi-arrival')?.remove();
        state.arrivalRows=0;state.flightDestination='';state.landingMins=null;
        state.arrivalBasketItems=0;state.arrivalBasketCost=0;state.arrivalBasketProfit=0;state.arrivalBasketSlots=0;state.arrivalBasketMode='';
        if(!settings.arrivalStock||!detectInFlight()) return;
        const flight=await fetchFlightStatus();
        const destination=normalizeDestination(flight.destination),landingMins=Number(flight.seconds)/60;
        if(!destination||!Number.isFinite(landingMins)||landingMins<0) return;
        state.flightDestination=destination;state.landingMins=landingMins;
        const yata=(await fetchYataAll()).filter(r=>r.destination===destination);if(!yata.length)return;
        for(const r of yata)if(r.stock!=null)recordStock(destination,r.itemId,r.stock);flushStockHistory();

        const marketMap=new Map();
        for(const r of yata){const c=cachePeek(r.itemId);if(c)marketMap.set(r.itemId,c);}
        const ids=travelRefreshIds(yata,ARRIVAL_REFRESH_LIMIT,new Map());
        await mapWithLimit(ids,async id=>{const m=await fetchMarket(id,true);if(m)marketMap.set(id,m);});

        const slots=Math.max(1,Number(settings.travelSlots)||29),rows=[];
        for(const r of yata){
            const market=marketMap.get(r.itemId);if(!market)continue;
            const m=metrics(r.buyPrice,market.price);if(m.profit<=0)continue;
            const p=predictAtArrival(destination,r.itemId,r.stock,landingMins);
            const projectedStock=p.projected==null?(r.stock==null?0:Number(r.stock)||0):Math.max(0,Math.floor(Number(p.projected)||0));
            const availableQty=Math.min(slots,projectedStock);
            const currentQty=r.stock==null?0:Math.min(slots,Math.max(0,Number(r.stock)||0));
            const projectedProfit=m.profit*availableQty,currentProfit=m.profit*currentQty;
            const score=projectedProfit+(p.expectedRestocks>0?Math.max(0,m.profit)*Math.min(slots,Number(p.eta.qty)||0)*0.25:0);
            rows.push(Object.assign({},r,{market:market.price,profitItem:m.profit,roi:m.roi,p,currentProfit,projectedProfit,projectedStock,score}));
        }
        if(!rows.length)return;

        let plan=null,plannedQty=new Map();
        if(settings.arrivalBasket){
            const projectedEntries=rows.map(r=>({id:r.itemId,name:r.name,buy:r.buyPrice,stock:r.projectedStock,row:null,destination}));
            plan=buildTravelBuyPlan(destination,projectedEntries,marketMap);
            plannedQty=new Map((plan?.rows||[]).map(r=>[String(r.id),Number(r.qty)||0]));
            state.arrivalBasketItems=plan?.rows?.length||0;
            state.arrivalBasketCost=plan?.totalCost||0;
            state.arrivalBasketProfit=plan?.totalProfit||0;
            state.arrivalBasketSlots=plan?.used||0;
            state.arrivalBasketMode=plan?.mode||'';
        }

        rows.forEach(r=>{r.plannedQty=plannedQty.get(String(r.itemId))||0;r.plannedProfit=r.plannedQty*r.profitItem;});
        rows.sort((a,b)=>{
            if((a.plannedQty>0)!==(b.plannedQty>0))return (b.plannedQty>0)-(a.plannedQty>0);
            if(a.plannedQty>0&&b.plannedQty>0)return b.plannedProfit-a.plannedProfit||b.profitItem-a.profitItem;
            return b.score-a.score;
        });
        const top=rows.slice(0,10);state.arrivalRows=top.length;if(!top.length)return;

        const bar=document.createElement('div');bar.id='sl-mi-arrival';bar.className='open';
        const title=settings.arrivalBasket?'✈ ARRIVAL BASKET':'✈ ARRIVAL STOCK';
        const planSummary=settings.arrivalBasket&&plan?.rows?.length
            ?('<strong>'+plan.used+'/'+slots+' slots · '+money(plan.totalProfit)+' profit · '+esc(plan.mode)+'</strong>')
            :('<strong>'+top.length+' opportunities</strong>');
        const budgetText=settings.travelBudget>0?(' · budget '+money(settings.travelBudget)):' · unlimited budget';
        bar.innerHTML='<div class="sl-mi-arrival-head"><div><span class="sl-mi-br-title">'+title+'</span><strong>'+esc(destination)+'</strong></div><div>Landing '+fmtDuration(landingMins)+' · '+esc(flight.source)+'</div><button type="button">▾</button></div>'+
            '<div class="sl-mi-arrival-note">'+(settings.arrivalBasket?'Pre-builds the best basket for landing using predicted stock, travel slots and your budget. ':'Prediction uses current YATA stock plus locally learned restock timing. ')+planSummary+budgetText+' · projected stock is an estimate, not guaranteed.</div><div class="sl-mi-arrival-body"></div>';
        const body=bar.querySelector('.sl-mi-arrival-body');
        for(const r of top){
            const p=r.p,restockText=p.expectedRestocks>0?(p.eta.learned?('likely '+p.expectedRestocks+' restock'+(p.expectedRestocks===1?'':'s')):'possible restock'):'no learned restock';
            const proj=Math.max(0,Math.round(r.projectedStock)).toLocaleString('en-US');
            const row=document.createElement('div');row.className='sl-mi-arrival-row '+(r.plannedQty>0?'recommended':'alternative');
            const buy=r.plannedQty>0?('BUY ×'+r.plannedQty):'ALT';
            const total=r.plannedQty>0?r.plannedProfit:r.projectedProfit;
            row.innerHTML='<span class="name">'+esc(r.name)+'</span><strong class="buy">'+buy+'</strong><span>now '+(r.stock==null?'?':Number(r.stock).toLocaleString('en-US'))+'</span><span class="eta">arrival ~'+proj+' · '+esc(restockText)+'</span><span>+'+money(r.profitItem)+'/ea</span><span class="conf '+p.confidence.toLowerCase()+'">'+esc(p.confidence)+'</span><strong>'+money(total)+'</strong>';
            body.appendChild(row);
        }
        bar.querySelector('.sl-mi-arrival-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);
    }

'''
s=s[:start]+new_func+s[end:]

rep("+toggle('arrivalStock','Arrival-stock prediction while flying')+toggle('bazaar'",
    "+toggle('arrivalStock','Arrival-stock prediction while flying')+toggle('arrivalBasket','Arrival Basket Planner while flying')+toggle('bazaar'",
    'settings toggle')
rep("['enabled','travel','bestRun','countryBestBuys','stockEta','arrivalStock','bazaar'",
    "['enabled','travel','bestRun','countryBestBuys','stockEta','arrivalStock','arrivalBasket','bazaar'",
    'settings save keys')
rep("#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar", "#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar", 'cleanup noop')
rep("landingMins:state.landingMins,stockEtaLearned:state.stockEtaLearned",
    "landingMins:state.landingMins,arrivalBasketItems:state.arrivalBasketItems,arrivalBasketCost:state.arrivalBasketCost,arrivalBasketProfit:state.arrivalBasketProfit,arrivalBasketSlots:state.arrivalBasketSlots,arrivalBasketMode:state.arrivalBasketMode,stockEtaLearned:state.stockEtaLearned",
    'health arrival basket')
rep("        async arrivalPrediction(){if(detectPage()!=='travel'||!detectInFlight())return false;await renderArrivalStock();return true;},",
    "        async arrivalPrediction(){if(detectPage()!=='travel'||!detectInFlight())return false;await renderArrivalStock();return true;},\n        async arrivalBasket(){if(detectPage()!=='travel'||!detectInFlight())return false;await renderArrivalStock();return true;},",
    'public arrival basket api')
rep(".sl-mi-arrival-row .conf.low,.sl-mi-arrival-row .conf.learning{color:#9da6b3}",
    ".sl-mi-arrival-row .conf.low,.sl-mi-arrival-row .conf.learning{color:#9da6b3}.sl-mi-arrival-row.recommended{border-left:3px solid #78d98b;background:#142019}.sl-mi-arrival-row.alternative{border-left:3px solid #59616c}.sl-mi-arrival-row .buy{color:#78d98b}",
    'arrival css')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.13.0'
        e['description']='Market/travel intelligence with Best Route Basket, in-country Best Buys and Arrival Basket Planner that predicts landing stock and pre-builds the optimal basket for slots and budget.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.12.0**','SakaLuX Market Intelligence: **v1.13.0**',1)
release='''### SakaLuX Market Intelligence v1.13.0\n- Added **Arrival Basket Planner** while flying.\n- Uses the detected destination and remaining flight time together with YATA stock and locally learned restock timing to estimate stock at landing.\n- Builds the optimal landing shopping basket using the same slot + budget optimizer used by the in-country planner.\n- Recommended arrival rows now show **BUY × quantity**, estimated stock on arrival, profit per item, confidence and planned total profit.\n- Profitable alternatives remain visible below the optimized basket.\n- The panel shows planned used slots, expected profit, optimizer mode and configured budget before landing.\n- Added an **Arrival Basket Planner while flying** toggle in Settings.\n- Added arrival basket item/cost/profit/slot/mode fields to `health()` and `arrivalBasket()` to the public API.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.12.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.12.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.12.0**','**Current version: v1.13.0**',1)
gf_release='''## v1.13.0 — Arrival Basket Planner\n\n- While flying, Market Intelligence now prepares the **best basket to buy immediately after landing**.\n- Predicted stock combines current YATA stock with the script's locally learned restock timing and refill quantities.\n- Uses your configured travel slots and optional Travel budget to optimize the basket.\n- Recommended rows show **BUY × quantity**, current stock, estimated landing stock, profit per item, prediction confidence and planned total profit.\n- Profitable alternatives are still shown below the selected basket.\n- The panel shows planned slot usage, expected profit and optimization mode before landing.\n- Added a dedicated Settings toggle and `arrivalBasket()` public API action.\n\n'''
gf=gf.replace('## v1.12.0',gf_release+'## v1.12.0',1)
gf=gf.replace('No observations are uploaded to a SakaLuX server in v1.12.0.','No observations are uploaded to a SakaLuX server in v1.13.0.',1)
GF.write_text(gf,encoding='utf-8')
