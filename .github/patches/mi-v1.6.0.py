from pathlib import Path
import json,re,shutil

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'
BACKUP=ROOT/'backups/SakaLuX-Market-Intelligence-v1.5.0.user.js'

s=SRC.read_text(encoding='utf-8')
if '// @version      1.5.0' not in s:
    raise SystemExit('Expected v1.5.0 source')
BACKUP.write_text(s,encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s: raise SystemExit('Missing anchor: '+label)
    s=s.replace(old,new,1)

rep('// @version      1.5.0','// @version      1.6.0','metadata version')
rep('// @description  Torn market and travel intelligence with fast Travel tools, Bazaar Flip Intelligence, Item Market trend/signals, arrival-stock prediction and Museum set valuation.','// @description  Torn market and travel intelligence with real Torn flight-time detection, fast Travel tools, Bazaar Flip Intelligence, Item Market trend/signals, arrival prediction and Museum valuation.','description')
rep("const VERSION = '1.5.0';","const VERSION = '1.6.0';",'runtime version')
rep("itemMarketSignal: '', itemMarketTrend: 0, itemMarketVolatility: 0, itemMarketHistorySamples: 0","itemMarketSignal: '', itemMarketTrend: 0, itemMarketVolatility: 0, itemMarketHistorySamples: 0,\n        actualFlightTimes: 0, travelTimeSource: 'fallback'",'state flight fields')

insert=r'''

    function parseTravelDurationMinutes(text) {
        const t=normText(text);
        let m=t.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
        if(m){
            const h=Number(m[1]),min=Number(m[2]),sec=m[3]==null?0:Number(m[3]);
            const total=h*60+min+sec/60;
            if(total>=1&&total<=600)return total;
        }
        m=t.match(/\b(\d+)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:in(?:ute)?s?)?)?/i);
        if(m){const total=Number(m[1])*60+Number(m[2]||0);if(total>=1&&total<=600)return total;}
        m=t.match(/\b(\d+)\s*m(?:in(?:ute)?s?)\b/i);
        if(m){const total=Number(m[1]);if(total>=1&&total<=600)return total;}
        return null;
    }

    function fmtFlightMinutes(mins) {
        const n=Math.max(0,Math.round(Number(mins)||0));
        if(n<60)return n+'m';
        const h=Math.floor(n/60),m=n%60;
        return h+'h'+(m?' '+m+'m':'');
    }

    function scrapeTravelTimes() {
        const found=new Map();
        const nodes=[...document.querySelectorAll('tr,li,[role="row"],a,button,[class*="destination"],[class*="travel"],[class*="row"],[class*="Row"]')];
        for(const destination of Object.keys(FLIGHT_MINS)){
            const labels=TORN_TRAVEL_LABELS[destination]||[destination];
            let best=null;
            for(const el of nodes){
                if(!isVisible(el))continue;
                const text=normText(el.innerText||el.textContent);
                if(!text||text.length>260)continue;
                const lower=text.toLowerCase();
                if(!labels.some(label=>lower.includes(label.toLowerCase())))continue;
                const mins=parseTravelDurationMinutes(text);
                if(!Number.isFinite(mins))continue;
                const score=text.length+(el.children?.length||0)*2;
                if(!best||score<best.score)best={mins,score,text};
            }
            if(best)found.set(destination,{mins:best.mins,source:'torn-page'});
        }
        return found;
    }

    function flightInfo(destination,actualMap) {
        const actual=actualMap?.get(destination);
        if(actual&&Number.isFinite(actual.mins))return actual;
        const base=Number(FLIGHT_MINS[destination]);
        if(!Number.isFinite(base))return null;
        return {mins:base*Math.max(0.1,Number(settings.flightMultiplier)||1),source:'fallback'};
    }
'''
rep("    function selectTravelDestination(destination) {",insert+"\n    function selectTravelDestination(destination) {",'insert travel time scraper')

old=r'''    function buildBestRunRows(candidates,marketMap){
        const slots=Math.max(1,Number(settings.travelSlots)||29),mult=Math.max(0.1,Number(settings.flightMultiplier)||1),ranked=[];
        for(const r of candidates){
            const market=marketMap.get(r.itemId),flight=FLIGHT_MINS[r.destination];if(!market||!flight)continue;
            const m=metrics(r.buyPrice,market.price);if(m.profit<=0)continue;
            const qty=r.stock==null?slots:Math.min(slots,r.stock);if(qty<=0)continue;
            const profitRun=m.profit*qty,roundTrip=flight*mult*2,profitHour=profitRun/(roundTrip/60);
            ranked.push(Object.assign({},r,{market:market.price,net:m.net,profitItem:m.profit,roi:m.roi,qty,profitRun,profitHour,flightMins:flight*mult,eta:estimateRestock(r.destination,r.itemId)}));
        }
        return ranked.sort((a,b)=>b.profitHour-a.profitHour).slice(0,11);
    }'''
new=r'''    function buildBestRunRows(candidates,marketMap,actualTimes){
        const slots=Math.max(1,Number(settings.travelSlots)||29),ranked=[];
        for(const r of candidates){
            const market=marketMap.get(r.itemId),flight=flightInfo(r.destination,actualTimes);if(!market||!flight)continue;
            const m=metrics(r.buyPrice,market.price);if(m.profit<=0)continue;
            const qty=r.stock==null?slots:Math.min(slots,r.stock);if(qty<=0)continue;
            const profitRun=m.profit*qty,roundTrip=flight.mins*2,profitHour=profitRun/(roundTrip/60);
            ranked.push(Object.assign({},r,{market:market.price,net:m.net,profitItem:m.profit,roi:m.roi,qty,profitRun,profitHour,flightMins:flight.mins,flightSource:flight.source,eta:estimateRestock(r.destination,r.itemId)}));
        }
        return ranked.sort((a,b)=>b.profitHour-a.profitHour).slice(0,11);
    }'''
rep(old,new,'buildBestRunRows')

rep("const eta=r.eta.learned?('next '+fmtDuration(r.eta.mins)):('ETA learning · possible ≤'+Math.max(1,Math.ceil(r.eta.mins))+'m');","const eta=(r.eta.learned?('next '+fmtDuration(r.eta.mins)):('ETA learning · possible ≤'+Math.max(1,Math.ceil(r.eta.mins))+'m'))+' · flight '+fmtFlightMinutes(r.flightMins)+' '+(r.flightSource==='torn-page'?'actual':'fallback');",'best row flight label')

old2=r'''    function travelRefreshIds(candidates,limit){
        const scored=candidates.map(r=>{
            const c=cachePeek(r.itemId),flight=FLIGHT_MINS[r.destination]||9999;
            let score=0;
            if(c){const m=metrics(r.buyPrice,c.price);score=Math.max(0,m.profit)*(Math.min(Math.max(1,Number(settings.travelSlots)||29),r.stock==null?999:r.stock))/(flight||1);}
            else score=Math.max(1,r.buyPrice)/Math.max(1,flight);
            return {id:r.itemId,score,cached:!!c};
        }).sort((a,b)=>(b.cached-a.cached)||(b.score-a.score));'''
new2=r'''    function travelRefreshIds(candidates,limit,actualTimes){
        const scored=candidates.map(r=>{
            const c=cachePeek(r.itemId),flight=flightInfo(r.destination,actualTimes)?.mins||9999;
            let score=0;
            if(c){const m=metrics(r.buyPrice,c.price);score=Math.max(0,m.profit)*(Math.min(Math.max(1,Number(settings.travelSlots)||29),r.stock==null?999:r.stock))/(flight||1);}
            else score=Math.max(1,r.buyPrice)/Math.max(1,flight);
            return {id:r.itemId,score,cached:!!c};
        }).sort((a,b)=>(b.cached-a.cached)||(b.score-a.score));'''
rep(old2,new2,'travelRefreshIds')

rep("        const cachedMap=new Map();","        const actualTimes=scrapeTravelTimes();\n        state.actualFlightTimes=actualTimes.size;\n        state.travelTimeSource=actualTimes.size?'torn-page':'fallback';\n        const cachedMap=new Map();",'actual map in render')
rep("const cachedTop=buildBestRunRows(candidates,cachedMap);","const cachedTop=buildBestRunRows(candidates,cachedMap,actualTimes);",'cached top actual')
rep("paintBestTravelRun(cachedTop,'instant cache · refreshing '+TRAVEL_REFRESH_LIMIT+' prices in background');","paintBestTravelRun(cachedTop,'instant cache · '+(actualTimes.size?'actual Torn times '+actualTimes.size+'/'+Object.keys(FLIGHT_MINS).length:'fallback flight times')+' · refreshing '+TRAVEL_REFRESH_LIMIT+' prices');",'cached phase')
rep("const ids=travelRefreshIds(candidates,TRAVEL_REFRESH_LIMIT);","const ids=travelRefreshIds(candidates,TRAVEL_REFRESH_LIMIT,actualTimes);",'best refresh ids')
rep("const finalTop=buildBestRunRows(candidates,finalMap);","const finalTop=buildBestRunRows(candidates,finalMap,actualTimes);",'final top actual')
rep("paintBestTravelRun(finalTop,'live-refreshed shortlist · '+ids.length+' market requests max');","paintBestTravelRun(finalTop,'live-refreshed · '+(actualTimes.size?'actual Torn flight times':'fallback flight times')+' · '+ids.length+' prices checked');",'final phase')
rep("const ids=travelRefreshIds(yata,ARRIVAL_REFRESH_LIMIT);","const ids=travelRefreshIds(yata,ARRIVAL_REFRESH_LIMIT,new Map());",'arrival signature')
rep('Flight multiplier<input','Fallback flight multiplier<input','settings label')

s=s.replace("observerSkips:state.observerSkips,", "observerSkips:state.observerSkips,actualFlightTimes:state.actualFlightTimes,travelTimeSource:state.travelTimeSource,",1)

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.6.0'
        e['description']='Market and travel intelligence with real Torn Travel Agency flight-time detection for precise profit/hour ranking, plus Bazaar flips, Item Market signals, arrival prediction and Museum valuation.'
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.5.0**','SakaLuX Market Intelligence: **v1.6.0**',1)
release='''### SakaLuX Market Intelligence v1.6.0\n- Added **real Torn Travel Agency flight-time detection** for Best Travel Run.\n- Best Travel Run now reads the currently displayed one-way time for each destination directly from the Travel page when available.\n- Actual detected times automatically include the player's current Torn travel modifiers, so profit/hour no longer depends on the old static baseline when Torn provides a time.\n- Static `FLIGHT_MINS` values remain only as a safe fallback for destinations whose time cannot be detected.\n- The existing Flight Multiplier setting is now explicitly a **Fallback flight multiplier** and is not applied on top of a real Torn time.\n- Each Best Travel Run row shows its one-way flight duration and whether it is **actual** or **fallback**.\n- The performance line shows how many destination times were detected from Torn.\n- Added `actualFlightTimes` and `travelTimeSource` to `health()`.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.5.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.5.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.5.0**','**Current version: v1.6.0**',1)
gf_release='''## v1.6.0 — Real Torn Flight Times\n\n- Best Travel Run now detects destination flight durations directly from Torn's Travel Agency page.\n- Profit/hour ranking uses the player's currently displayed Torn travel times whenever they are available.\n- Current travel modifiers are therefore reflected automatically instead of relying only on static baseline durations.\n- Static flight times remain as a fallback if a destination time cannot be read.\n- Fallback Flight Multiplier is used only for fallback times.\n- Best Travel Run rows show the detected one-way flight time and whether it is actual or fallback.\n- `health()` exposes how many actual destination times were detected and the active travel-time source.\n\n'''
gf=gf.replace('## v1.5.0 — Item Market Intelligence\n',gf_release+'## v1.5.0 — Item Market Intelligence\n',1)
GF.write_text(gf,encoding='utf-8')
