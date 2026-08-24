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
s=rep(s,'// @version      1.6.0','// @version      1.7.0','metadata version')
s=rep(s,
'// @description  Torn market and travel intelligence with real Torn flight-time detection, fast Travel tools, Bazaar Flip Intelligence, Item Market trend/signals, arrival prediction and Museum valuation.',
'// @description  Torn market and travel intelligence with Travel Buy Planner, real flight-time detection, Bazaar Flip Intelligence, Item Market trend/signals, arrival prediction and Museum valuation.',
'description')
s=rep(s,"const VERSION = '1.6.0';","const VERSION = '1.7.0';",'runtime version')
s=rep(s,
"        bazaarDeals: 0, bazaarBestProfit: 0, bazaarBestRoi: 0,\n        itemMarketSignal: '', itemMarketTrend: 0, itemMarketVolatility: 0, itemMarketHistorySamples: 0,\n        actualFlightTimes: 0, travelTimeSource: 'fallback'",
"        bazaarDeals: 0, bazaarBestProfit: 0, bazaarBestRoi: 0,\n        itemMarketSignal: '', itemMarketTrend: 0, itemMarketVolatility: 0, itemMarketHistorySamples: 0,\n        actualFlightTimes: 0, travelTimeSource: 'fallback',\n        travelPlanItems: 0, travelPlanCost: 0, travelPlanProfit: 0, travelPlanSlots: 0",
'state travel planner')

planner=r'''

    function buildTravelBuyPlan(destination, entries, marketMap) {
        const slots=Math.max(1,Number(settings.travelSlots)||29);
        const ranked=[];
        for(const e of entries){
            const market=marketMap.get(e.id);if(!market)continue;
            const m=metrics(e.buy,market.price);if(m.profit<=0)continue;
            const stock=e.stock==null?slots:Math.max(0,Number(e.stock)||0);
            if(stock<=0)continue;
            ranked.push({id:e.id,name:e.name,buy:e.buy,stock,market:market.price,profitItem:m.profit,roi:m.roi,row:e.row});
        }
        ranked.sort((a,b)=>b.profitItem-a.profitItem || b.roi-a.roi);
        let remaining=slots,totalCost=0,totalProfit=0;
        const plan=[];
        for(const r of ranked){
            if(remaining<=0)break;
            const qty=Math.min(remaining,r.stock);
            if(qty<=0)continue;
            const cost=r.buy*qty,profit=r.profitItem*qty;
            totalCost+=cost;totalProfit+=profit;remaining-=qty;
            plan.push({...r,qty,cost,profit});
        }
        return {destination,slots,used:slots-remaining,remaining,totalCost,totalProfit,rows:plan};
    }

    function paintTravelBuyPlan(plan){
        document.getElementById('sl-mi-travel-plan')?.remove();
        state.travelPlanItems=plan?.rows?.length||0;
        state.travelPlanCost=plan?.totalCost||0;
        state.travelPlanProfit=plan?.totalProfit||0;
        state.travelPlanSlots=plan?.used||0;
        if(!plan?.rows?.length)return;
        const bar=document.createElement('div');bar.id='sl-mi-travel-plan';bar.className='open';
        bar.innerHTML='<div class="sl-mi-plan-head"><div><span class="sl-mi-br-title">🧳 TRAVEL BUY PLANNER</span><strong>'+esc(plan.destination)+'</strong></div><div>'+plan.used+'/'+plan.slots+' slots · '+money(plan.totalProfit)+' profit</div><button type="button">▾</button></div><div class="sl-mi-plan-note">Recommended quantity mix fills your configured travel capacity using the highest estimated net profit per item available right now.</div><div class="sl-mi-plan-summary"><span>Spend <strong>'+money(plan.totalCost)+'</strong></span><span>Expected net profit <strong>'+money(plan.totalProfit)+'</strong></span><span>Unused slots <strong>'+plan.remaining+'</strong></span></div><div class="sl-mi-plan-body"></div>';
        const body=bar.querySelector('.sl-mi-plan-body');
        for(const r of plan.rows){
            const row=document.createElement('div');row.className='sl-mi-plan-row';row.setAttribute('role','button');row.tabIndex=0;
            row.innerHTML='<span class="name">'+esc(r.name)+'</span><span>BUY ×'+r.qty+'</span><span>'+money(r.buy)+'/ea</span><span>cost '+money(r.cost)+'</span><span>'+money(r.profit)+'</span><strong>'+pct(r.roi)+'</strong>';
            const go=()=>{try{r.row?.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){r.row?.scrollIntoView();}if(r.row){r.row.classList.add('sl-mi-target');setTimeout(()=>r.row.classList.remove('sl-mi-target'),2200);}};
            row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};body.appendChild(row);
        }
        bar.querySelector('.sl-mi-plan-head').onclick=()=>bar.classList.toggle('open');
        mountTop(bar);
    }
'''
s=rep(s,"    async function scanTravel(){",planner+"\n    async function scanTravel(){",'insert planner')

old_scan="""        const unique=[...new Map(entries.map(e=>[e.id,e])).values()].slice(0,MAX_LIVE_FETCHES);
        await mapWithLimit(unique,async e=>{if(e.stock!=null)recordStock(destination,e.id,e.stock);const market=await fetchMarket(e.id);if(!market)return;const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-travel');box.classList.toggle('loss',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>☠︎ MI</b> Market '+money(market.price)+' · Net '+money(m.net)+' · <strong>'+money(m.profit)+' ('+pct(m.roi)+')</strong>'+(e.stock!=null?' · Stock '+e.stock.toLocaleString('en-US')+stockEtaText(destination,e.id,e.stock):'');state.decorated++;});
        flushStockHistory();
"""
new_scan="""        const unique=[...new Map(entries.map(e=>[e.id,e])).values()].slice(0,MAX_LIVE_FETCHES);
        const marketMap=new Map();
        for(const e of unique){const c=cachePeek(e.id);if(c)marketMap.set(e.id,c);}
        await mapWithLimit(unique,async e=>{if(e.stock!=null)recordStock(destination,e.id,e.stock);const market=await fetchMarket(e.id);if(!market)return;marketMap.set(e.id,market);const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-travel');box.classList.toggle('loss',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>☠︎ MI</b> Market '+money(market.price)+' · Net '+money(m.net)+' · <strong>'+money(m.profit)+' ('+pct(m.roi)+')</strong>'+(e.stock!=null?' · Stock '+e.stock.toLocaleString('en-US')+stockEtaText(destination,e.id,e.stock):'');state.decorated++;});
        flushStockHistory();
        paintTravelBuyPlan(buildTravelBuyPlan(destination,unique,marketMap));
"""
s=rep(s,old_scan,new_scan,'scan travel planner wiring')

s=rep(s,
"document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board,#sl-mi-market-bar').forEach(n=>n.remove())",
"document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board,#sl-mi-market-bar,#sl-mi-travel-plan').forEach(n=>n.remove())",
'force cleanup planner')

s=rep(s,
"actualFlightTimes:state.actualFlightTimes,travelTimeSource:state.travelTimeSource",
"actualFlightTimes:state.actualFlightTimes,travelTimeSource:state.travelTimeSource,travelPlanItems:state.travelPlanItems,travelPlanCost:state.travelPlanCost,travelPlanProfit:state.travelPlanProfit,travelPlanSlots:state.travelPlanSlots",
'health planner fields')

css=r'''.sl-mi-plan-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer}.sl-mi-plan-head>div:first-child{display:flex;align-items:center;gap:8px}.sl-mi-plan-head button{border:0;background:transparent;color:#d7b94c;font-size:14px}.sl-mi-plan-note{margin-top:5px;color:#8f98a5;font-weight:600;font-size:9px}.sl-mi-plan-summary{display:flex;gap:12px;flex-wrap:wrap;margin-top:7px;padding:6px;border:1px solid #29323a;border-radius:6px}.sl-mi-plan-body{display:none;margin-top:7px;gap:4px}#sl-mi-travel-plan.open .sl-mi-plan-body{display:flex;flex-direction:column}.sl-mi-plan-row{display:grid;grid-template-columns:minmax(0,1.4fr) auto auto auto auto auto;gap:8px;align-items:center;padding:6px;border:1px solid #292f38;border-radius:5px;font-size:10px;cursor:pointer}.sl-mi-plan-row:hover,.sl-mi-plan-row:focus{background:#1b251f;border-color:#4d6957;outline:none}.sl-mi-plan-row .name{font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-mi-target{outline:2px solid #d7b94c!important;box-shadow:0 0 0 2px rgba(215,185,76,.22)!important}
'''
s=rep(s,'.sl-mi-baz-head{display:flex;',css+'.sl-mi-baz-head{display:flex;','planner css')
s=rep(s,
"#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run,#sl-mi-arrival{margin:8px auto 10px;max-width:1100px;border-left:3px solid #d7b94c;font-size:11px}",
"#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-bazaar-board,#sl-mi-travel-plan{margin:8px auto 10px;max-width:1100px;border-left:3px solid #d7b94c;font-size:11px}",
'planner shared bar css')
s=rep(s,
"@media(max-width:700px){",
"@media(max-width:700px){.sl-mi-plan-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-plan-row .name{grid-column:1/-1}",
'planner mobile css')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.7.0'
        e['description']='Market/travel intelligence with Travel Buy Planner, real Torn flight times, Bazaar Flip Intelligence, Item Market trend/signals, arrival prediction and Museum set valuation.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.6.0**','SakaLuX Market Intelligence: **v1.7.0**',1)
release='''### SakaLuX Market Intelligence v1.7.0\n- Added **Travel Buy Planner** for the abroad shop page.\n- Builds an automatic shopping mix using the configured travel capacity and current destination stock.\n- Ranks available items by estimated net profit per item and fills the available slots greedily with the best-profit items first.\n- Shows recommended quantity for each item, unit buy price, total spend, expected net profit and ROI.\n- Shows total planned spend, total expected profit, used slots and any unused capacity.\n- Tapping a planner row scrolls directly to the matching abroad item and highlights it temporarily.\n- Uses the same market cache/API results already fetched for Travel overlays, so it does not add a second independent round of requests.\n- Added planner item/cost/profit/slot fields to `health()`.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.6.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.6.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.6.0**','**Current version: v1.7.0**',1)
gf_release='''## v1.7.0 — Travel Buy Planner\n\n- Added an automatic **Travel Buy Planner** while abroad.\n- Uses the configured travel capacity, current abroad stock and current/cached Item Market prices.\n- Fills available slots with the highest estimated net-profit items first.\n- Shows recommended quantity, buy price, total spend, expected net profit and ROI per planned item.\n- Shows total spend, total expected profit, used slots and unused capacity.\n- Tapping a planner row jumps to the corresponding abroad listing and highlights it.\n- Reuses the Travel market results already being fetched, avoiding a second independent request pass.\n- `health()` exposes planner items, planned cost, planned profit and used slots.\n\n'''
gf=gf.replace('## v1.6.0 — Real Torn Flight Times\n',gf_release+'## v1.6.0 — Real Torn Flight Times\n',1)
gf=gf.replace('No observations are uploaded to a SakaLuX server in v1.4.0.','No observations are uploaded to a SakaLuX server in v1.7.0.',1)
GF.write_text(gf,encoding='utf-8')
