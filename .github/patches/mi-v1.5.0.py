from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'


def repl(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing anchor: {label}')
    return text.replace(old,new,1)

s=SRC.read_text(encoding='utf-8')
s=repl(s,'// @version      1.4.0','// @version      1.5.0','metadata version')
s=repl(s,'// @description  Torn market and travel intelligence with fast Travel tools, Bazaar Flip Intelligence, Item Market tools, arrival-stock prediction and Museum set valuation.','// @description  Torn market and travel intelligence with fast Travel tools, Bazaar Flip Intelligence, Item Market trend/signals, arrival-stock prediction and Museum set valuation.','metadata description')
s=repl(s,"const VERSION = '1.4.0';","const VERSION = '1.5.0';",'runtime version')
s=repl(s,"        itemCatalog: 'SakaLuX_MI_ITEM_CATALOG_V1'","        itemCatalog: 'SakaLuX_MI_ITEM_CATALOG_V1',\n        priceHistory: 'SakaLuX_MI_PRICE_HISTORY_V1'",'price history storage')
s=repl(s,"    const POINTS_RATE_MAX_AGE = 24 * 60 * 60 * 1000;","    const POINTS_RATE_MAX_AGE = 24 * 60 * 60 * 1000;\n    const PRICE_HISTORY_MAX_AGE = 14 * 24 * 60 * 60 * 1000;\n    const PRICE_HISTORY_MAX_SAMPLES = 120;\n    const PRICE_HISTORY_MIN_GAP = 5 * 60 * 1000;",'history constants')
s=repl(s,"    let stockHistory = loadJson(STORAGE.stockHistory, {});","    let stockHistory = loadJson(STORAGE.stockHistory, {});\n    let priceHistory = loadJson(STORAGE.priceHistory, {});",'load price history')
s=repl(s,"        bazaarDeals: 0, bazaarBestProfit: 0, bazaarBestRoi: 0","        bazaarDeals: 0, bazaarBestProfit: 0, bazaarBestRoi: 0,\n        itemMarketSignal: '', itemMarketTrend: 0, itemMarketVolatility: 0, itemMarketHistorySamples: 0",'item market state')

helpers=r'''

    function percentile(values,p){
        const a=values.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;
        const idx=(a.length-1)*Math.max(0,Math.min(1,p));const lo=Math.floor(idx),hi=Math.ceil(idx);
        if(lo===hi)return a[lo];const w=idx-lo;return a[lo]*(1-w)+a[hi]*w;
    }
    function avg(values){const a=values.filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
    function stdev(values){const a=values.filter(Number.isFinite);if(a.length<2)return 0;const m=avg(a);return Math.sqrt(a.reduce((sum,v)=>sum+(v-m)*(v-m),0)/a.length);}
    function recordPriceHistory(itemId,market,now=Date.now()){
        if(!itemId||!market?.minPrice)return;
        const key=String(itemId),current=Array.isArray(priceHistory[key])?priceHistory[key]:[];
        const fresh=current.filter(x=>x?.at&&now-Number(x.at)<PRICE_HISTORY_MAX_AGE&&Number(x.price)>0);
        const last=fresh[fresh.length-1];
        if(!last||now-Number(last.at)>=PRICE_HISTORY_MIN_GAP||Number(last.price)!==Number(market.minPrice)){
            fresh.push({at:now,price:Number(market.minPrice),effective:Number(market.price)||Number(market.minPrice),count:Number(market.count)||0});
        } else {
            fresh[fresh.length-1]={...last,effective:Number(market.price)||Number(market.minPrice),count:Number(market.count)||0};
        }
        priceHistory[key]=fresh.slice(-PRICE_HISTORY_MAX_SAMPLES);saveJson(STORAGE.priceHistory,priceHistory);
    }
    function analyzePriceHistory(itemId,currentPrice,market){
        const rows=(Array.isArray(priceHistory[String(itemId)])?priceHistory[String(itemId)]:[]).filter(x=>x?.at&&Date.now()-Number(x.at)<PRICE_HISTORY_MAX_AGE&&Number(x.price)>0);
        const prices=rows.map(x=>Number(x.price));const samples=prices.length;
        const med=median(prices),p25=percentile(prices,.25),p75=percentile(prices,.75);
        let trend=0;
        if(samples>=4){const cut=Math.max(2,Math.floor(samples/3));const older=avg(prices.slice(0,cut)),recent=avg(prices.slice(-cut));if(older>0)trend=(recent-older)/older*100;}
        const mean=avg(prices),volatility=mean>0?stdev(prices)/mean*100:0;
        const spread=market?.minPrice>0?((Number(market.price)-Number(market.minPrice))/Number(market.minPrice))*100:0;
        let signal='LEARNING',reason='Collecting local price history';
        if(samples>=3&&med>0){
            if((p25&&currentPrice<=p25)||(currentPrice<=med*.97&&trend>=0)){signal='BUY NOW';reason='Current floor is cheap versus recent history';}
            else if((p75&&currentPrice>=p75)||(currentPrice>=med*1.05)||(trend<-3&&currentPrice>med*.98)){signal='WAIT';reason='Price is elevated or trend is falling';}
            else {signal='FAIR';reason='Current price is close to its recent range';}
        }
        return {samples,median:med,p25,p75,trend,volatility,spread,signal,reason,rows};
    }
    function sparkText(rows){
        const vals=rows.slice(-12).map(x=>Number(x.price)).filter(Number.isFinite);if(vals.length<2)return '···';
        const blocks='▁▂▃▄▅▆▇█',lo=Math.min(...vals),hi=Math.max(...vals),span=Math.max(1,hi-lo);
        return vals.map(v=>blocks[Math.min(blocks.length-1,Math.max(0,Math.round((v-lo)/span*(blocks.length-1))))]).join('');
    }
'''
s=repl(s,"    function selectedMarketItemId(){const m=(location.hash||'').match(/itemID=(\\d+)/i);return m?Number(m[1]):null;}",helpers+"\n    function selectedMarketItemId(){const m=(location.hash||'').match(/itemID=(\\d+)/i);return m?Number(m[1]):null;}",'history helpers')

old="""    async function scanItemMarket(){
        if(!settings.itemMarket)return;const id=selectedMarketItemId();document.getElementById('sl-mi-market-bar')?.remove();if(!id)return;const market=await fetchMarket(id,true);if(!market)return;const watched=watchlist[String(id)]||null,bar=document.createElement('div');bar.id='sl-mi-market-bar';
        bar.innerHTML='<div><b>☠︎ Market Intelligence</b> · floor <strong>'+money(market.minPrice)+'</strong> · effective <strong>'+money(market.price)+'</strong> · '+market.count+' listings</div><div class="sl-mi-watch-row"><input id="sl-mi-watch-price" inputmode="numeric" placeholder="Watch below..." value="'+esc(watched?.maxPrice||'')+'"><button id="sl-mi-watch-save">'+(watched?'UPDATE WATCH':'ADD WATCH')+'</button>'+(watched?'<button id="sl-mi-watch-remove">REMOVE</button>':'')+'</div>';mountTop(bar);
        bar.querySelector('#sl-mi-watch-save').onclick=()=>{const n=parseMoney(bar.querySelector('#sl-mi-watch-price').value);if(!(n>0))return;watchlist[String(id)]={itemId:id,maxPrice:n,updatedAt:Date.now()};saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};
        const rm=bar.querySelector('#sl-mi-watch-remove');if(rm)rm.onclick=()=>{delete watchlist[String(id)];saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};if(watched&&market.minPrice<=watched.maxPrice)bar.classList.add('hit');
    }
"""
new=r'''    async function scanItemMarket(){
        if(!settings.itemMarket)return;
        const id=selectedMarketItemId();document.getElementById('sl-mi-market-bar')?.remove();if(!id)return;
        const market=await fetchMarket(id,true);if(!market)return;
        recordPriceHistory(id,market);
        const analysis=analyzePriceHistory(id,Number(market.minPrice),market);
        state.itemMarketSignal=analysis.signal;state.itemMarketTrend=analysis.trend;state.itemMarketVolatility=analysis.volatility;state.itemMarketHistorySamples=analysis.samples;
        const watched=watchlist[String(id)]||null,bar=document.createElement('div');bar.id='sl-mi-market-bar';
        const trendIcon=analysis.trend>1?'↑':analysis.trend<-1?'↓':'→';
        const signalClass=analysis.signal==='BUY NOW'?'buy':analysis.signal==='WAIT'?'wait':analysis.signal==='FAIR'?'fair':'learning';
        bar.innerHTML='<div class="sl-mi-market-head"><div><b>📈 ITEM MARKET INTELLIGENCE</b><span>floor <strong>'+money(market.minPrice)+'</strong> · effective <strong>'+money(market.price)+'</strong> · '+market.count+' listings</span></div><span class="sl-mi-signal '+signalClass+'">'+esc(analysis.signal)+'</span></div>'+
            '<div class="sl-mi-market-grid"><div><small>TREND</small><strong>'+trendIcon+' '+pct(analysis.trend)+'</strong></div><div><small>MEDIAN</small><strong>'+money(analysis.median)+'</strong></div><div><small>VOLATILITY</small><strong>'+analysis.volatility.toFixed(1)+'%</strong></div><div><small>SPREAD</small><strong>'+analysis.spread.toFixed(1)+'%</strong></div></div>'+
            '<div class="sl-mi-spark"><span>'+esc(sparkText(analysis.rows))+'</span><small>'+analysis.samples+' local samples · '+esc(analysis.reason)+'</small></div>'+
            '<div class="sl-mi-watch-row"><input id="sl-mi-watch-price" inputmode="numeric" placeholder="Watch below..." value="'+esc(watched?.maxPrice||'')+'"><button id="sl-mi-watch-save">'+(watched?'UPDATE WATCH':'ADD WATCH')+'</button>'+(watched?'<button id="sl-mi-watch-remove">REMOVE</button>':'')+'</div>';
        mountTop(bar);
        bar.querySelector('#sl-mi-watch-save').onclick=()=>{const n=parseMoney(bar.querySelector('#sl-mi-watch-price').value);if(!(n>0))return;watchlist[String(id)]={itemId:id,maxPrice:n,updatedAt:Date.now()};saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};
        const rm=bar.querySelector('#sl-mi-watch-remove');if(rm)rm.onclick=()=>{delete watchlist[String(id)];saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};
        if(watched&&market.minPrice<=watched.maxPrice)bar.classList.add('hit');
    }
'''
s=repl(s,old,new,'replace item market module')

s=repl(s,"document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board').forEach(n=>n.remove())","document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board,#sl-mi-market-bar').forEach(n=>n.remove())",'force cleanup')

s=repl(s,"cachedMarketItems:Object.keys(marketCache).length,travelCacheHits:state.travelCacheHits,travelRefreshes:state.travelRefreshes,observerSkips:state.observerSkips,museumSets:state.museumSets,museumMissingSets:state.museumMissingSets,museumRecommendation:state.museumRecommendation,bazaarDeals:state.bazaarDeals,bazaarBestProfit:state.bazaarBestProfit,bazaarBestRoi:state.bazaarBestRoi","cachedMarketItems:Object.keys(marketCache).length,travelCacheHits:state.travelCacheHits,travelRefreshes:state.travelRefreshes,observerSkips:state.observerSkips,museumSets:state.museumSets,museumMissingSets:state.museumMissingSets,museumRecommendation:state.museumRecommendation,bazaarDeals:state.bazaarDeals,bazaarBestProfit:state.bazaarBestProfit,bazaarBestRoi:state.bazaarBestRoi,itemMarketSignal:state.itemMarketSignal,itemMarketTrend:state.itemMarketTrend,itemMarketVolatility:state.itemMarketVolatility,itemMarketHistorySamples:state.itemMarketHistorySamples",'health fields')

s=repl(s,"        goToMarket(){location.href='https://www.torn.com/page.php?sid=ItemMarket';return true;},","        goToMarket(){location.href='https://www.torn.com/page.php?sid=ItemMarket';return true;},\n        itemMarketIntelligence(){if(detectPage()!=='itemmarket')return null;const id=selectedMarketItemId();if(!id)return null;const c=cachePeek(id);if(!c)return null;return analyzePriceHistory(id,Number(c.minPrice),c);},",'public api')

css_anchor='.sl-mi-watch-row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}'
css=r'''.sl-mi-market-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.sl-mi-market-head>div{display:flex;flex-direction:column;gap:3px}.sl-mi-signal{padding:4px 7px;border-radius:6px;font-weight:900;white-space:nowrap}.sl-mi-signal.buy{background:#16351f;color:#78d98b}.sl-mi-signal.wait{background:#3a1d1d;color:#f08b8b}.sl-mi-signal.fair{background:#2f2b17;color:#e1c865}.sl-mi-signal.learning{background:#252a31;color:#aab2bd}.sl-mi-market-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:7px}.sl-mi-market-grid>div{background:#0f1318;border:1px solid #2b323b;border-radius:6px;padding:6px}.sl-mi-market-grid small{display:block;color:#7f8894;font-size:8px}.sl-mi-market-grid strong{display:block;margin-top:2px}.sl-mi-spark{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:7px;padding:6px;border-radius:6px;background:#0f1318;border:1px solid #2b323b}.sl-mi-spark>span{font-size:15px;letter-spacing:1px;color:#d7b94c}.sl-mi-spark small{color:#8f98a5;text-align:right}
'''
s=repl(s,css_anchor,css+css_anchor,'item market css')
s=repl(s,"@media(max-width:700px){.sl-mi-br-row,.sl-mi-arrival-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-museum-row{grid-template-columns:minmax(0,1fr) auto;gap:3px 7px}.sl-mi-museum-row .name{grid-column:1/-1}","@media(max-width:700px){.sl-mi-br-row,.sl-mi-arrival-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-museum-row{grid-template-columns:minmax(0,1fr) auto;gap:3px 7px}.sl-mi-museum-row .name{grid-column:1/-1}.sl-mi-market-grid{grid-template-columns:repeat(2,1fr)}.sl-mi-spark{align-items:flex-start;flex-direction:column}.sl-mi-spark small{text-align:left}",'mobile css')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.5.0'
        e['description']='Fast Travel and market intelligence with Bazaar Flip Intelligence, Item Market local price history, trend/volatility and BUY NOW / WAIT signals, arrival-stock prediction and Museum set valuation.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.4.0**','SakaLuX Market Intelligence: **v1.5.0**',1)
release='''### SakaLuX Market Intelligence v1.5.0\n- Added **Item Market Intelligence** with local price history per item.\n- Records Item Market floor/effective prices locally with a 5-minute minimum sampling gap and keeps up to 14 days / 120 samples.\n- Added **trend**, recent **median**, **volatility** and effective-vs-floor **spread** calculations.\n- Added direct **BUY NOW / FAIR / WAIT / LEARNING** signals based on the current floor versus recent local history and trend.\n- Added a compact 12-sample sparkline for quick price direction context.\n- Existing per-item price watchlist remains available inside the same panel.\n- Added Item Market signal/trend/volatility/sample fields to `health()` and `itemMarketIntelligence()` to the public API.\n- No additional recurring API traffic is added: history is recorded from Item Market checks the script already performs.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.4.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.4.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.4.0**','**Current version: v1.5.0**',1)
gf_release='''## v1.5.0 — Item Market Intelligence\n\n- Added local Item Market price history per item.\n- Records floor/effective prices with a 5-minute minimum sample gap and retains up to 14 days / 120 samples.\n- Shows recent price **trend**, **median**, **volatility** and effective-vs-floor **spread**.\n- Adds **BUY NOW / FAIR / WAIT / LEARNING** signals from the current floor versus the locally observed range and trend.\n- Includes a compact recent-price sparkline.\n- Existing price watch thresholds remain available in the same panel.\n- Added Item Market intelligence fields to `health()` and `itemMarketIntelligence()` to the public API.\n- Price history stays local and creates no separate background polling.\n\n'''
gf=gf.replace('## v1.4.0 — Bazaar Flip Intelligence\n',gf_release+'## v1.4.0 — Bazaar Flip Intelligence\n',1)
gf=gf.replace('No observations are uploaded to a SakaLuX server in v1.3.0.','No observations are uploaded to a SakaLuX server in v1.5.0.',1)
gf=gf.replace('- Expanded Bazaar and Item Market deal surfaces.\n','',1)
GF.write_text(gf,encoding='utf-8')
