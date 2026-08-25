from pathlib import Path
import json

ROOT=Path('.')
P=ROOT/'SakaLuX-Market-Intelligence.user.js'
s=P.read_text(encoding='utf-8')


def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'missing anchor: {label}')
    s=s.replace(old,new,1)

rep('// @version      1.15.12','// @version      1.16.0','metadata version')
rep('// @description  Torn market and travel intelligence with route/basket optimization, in-country Best Buys, smart landing refresh and a local Travel Session Summary with trip history.','// @description  Torn PDA-first market/travel intelligence with anonymous opt-in SakaLuX Price Network consensus, Item Market signals, Bazaar Flip and travel basket tools.','metadata description')
rep("const VERSION = '1.15.12';","const VERSION = '1.16.0';",'internal version')
rep("    const YATA_EXPORT_URL = 'https://yata.yt/api/v1/travel/export/';\n","    const YATA_EXPORT_URL = 'https://yata.yt/api/v1/travel/export/';\n    const PRICE_NETWORK_DEFAULT_URL = '';\n",'network url')

rep("        priceHistory: 'SakaLuX_MI_PRICE_HISTORY_V1',\n        travelSessions: 'SakaLuX_MI_TRAVEL_SESSIONS_V1'\n","        priceHistory: 'SakaLuX_MI_PRICE_HISTORY_V1',\n        travelSessions: 'SakaLuX_MI_TRAVEL_SESSIONS_V1',\n        networkQueue: 'SakaLuX_MI_PRICE_NETWORK_QUEUE_V1',\n        networkConsensus: 'SakaLuX_MI_PRICE_NETWORK_CONSENSUS_V1',\n        networkLastObservation: 'SakaLuX_MI_PRICE_NETWORK_LAST_OBS_V1'\n",'storage')

rep("    const MIN_LEARNED_RESTOCK_GAP_MIN = 10;\n","    const MIN_LEARNED_RESTOCK_GAP_MIN = 10;\n    const PRICE_NETWORK_MIN_GAP = 10 * 60 * 1000;\n    const PRICE_NETWORK_FLUSH_MS = 60 * 1000;\n    const PRICE_NETWORK_CACHE_MS = 5 * 60 * 1000;\n    const PRICE_NETWORK_MAX_QUEUE = 200;\n    const PRICE_NETWORK_BATCH = 25;\n",'network constants')

rep("        itemMarket: true,\n        items: true,\n","        itemMarket: true,\n        priceNetwork: false,\n        priceNetworkEndpoint: PRICE_NETWORK_DEFAULT_URL,\n        items: true,\n",'settings defaults')

rep("    let priceHistory = loadJson(STORAGE.priceHistory, {});\n    let travelSessions = loadJson(STORAGE.travelSessions, {current:null,history:[]});\n","    let priceHistory = loadJson(STORAGE.priceHistory, {});\n    let travelSessions = loadJson(STORAGE.travelSessions, {current:null,history:[]});\n    let networkQueue = loadJson(STORAGE.networkQueue, []);\n    let networkConsensus = loadJson(STORAGE.networkConsensus, {});\n    let networkLastObservation = loadJson(STORAGE.networkLastObservation, {});\n    if(!Array.isArray(networkQueue))networkQueue=[];\n    if(!networkConsensus||typeof networkConsensus!=='object'||Array.isArray(networkConsensus))networkConsensus={};\n    if(!networkLastObservation||typeof networkLastObservation!=='object'||Array.isArray(networkLastObservation))networkLastObservation={};\n",'network loads')

rep("        travelSessionCount: 0, currentSessionDestination: '', currentSessionStatus: '', currentSessionPredictedProfit: 0, currentSessionLandedProfit: 0, currentSessionRecordedProfit: 0, lastSessionProfit: 0\n","        travelSessionCount: 0, currentSessionDestination: '', currentSessionStatus: '', currentSessionPredictedProfit: 0, currentSessionLandedProfit: 0, currentSessionRecordedProfit: 0, lastSessionProfit: 0,\n        networkBusy: false, networkQueued: networkQueue.length, networkSent: 0, networkLastFlush: 0, networkLastError: '', networkSamples: 0, networkMedian: 0, networkLastConsensusAt: 0\n",'network state')

anchor="    function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }\n"
network_code=r'''    function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }

    function normalizeNetworkEndpoint(value) {
        const raw=String(value||'').trim().replace(/\/+$/,'');
        if(!raw)return '';
        try { const u=new URL(raw); return u.protocol==='https:'?u.origin+u.pathname.replace(/\/+$/,''):''; }
        catch (_) { return ''; }
    }
    function priceNetworkEndpoint(){return normalizeNetworkEndpoint(settings.priceNetworkEndpoint||PRICE_NETWORK_DEFAULT_URL);}
    function priceNetworkConfigured(){return Boolean(priceNetworkEndpoint());}
    function saveNetworkQueue(){networkQueue=networkQueue.slice(-PRICE_NETWORK_MAX_QUEUE);saveJson(STORAGE.networkQueue,networkQueue);state.networkQueued=networkQueue.length;}
    function networkObservationKey(itemId,source){return String(itemId)+'|'+String(source||'itemmarket');}
    function queueNetworkObservation(itemId,price,source='itemmarket',now=Date.now()){
        if(!settings.priceNetwork||!priceNetworkConfigured())return false;
        const id=Math.round(Number(itemId)),p=Math.round(Number(price));
        if(!(id>0)||!(p>0)||p>2000000000000)return false;
        if(!['itemmarket','bazaar','travel'].includes(source))source='itemmarket';
        const key=networkObservationKey(id,source),last=networkLastObservation[key];
        const materiallyChanged=last?.price>0?Math.abs(p-Number(last.price))/Number(last.price)>=0.01:true;
        if(last?.at&&now-Number(last.at)<PRICE_NETWORK_MIN_GAP&&!materiallyChanged)return false;
        if(last?.at&&now-Number(last.at)<120000)return false;
        networkLastObservation[key]={at:now,price:p};saveJson(STORAGE.networkLastObservation,networkLastObservation);
        networkQueue.push({itemId:id,price:p,observedAt:now,source});saveNetworkQueue();
        schedulePriceNetworkFlush(1500);return true;
    }
    function networkRequest(path,options={}){
        const base=priceNetworkEndpoint();if(!base)return Promise.reject(new Error('Price Network endpoint not configured'));
        return fetch(base+path,{method:options.method||'GET',headers:{'content-type':'application/json','accept':'application/json'},body:options.body?JSON.stringify(options.body):undefined,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'}).then(async r=>{
            let data=null;try{data=await r.json();}catch(_){data=null;}
            if(!r.ok||data?.ok===false)throw new Error(data?.error||('Price Network HTTP '+r.status));
            return data;
        });
    }
    let networkFlushTimer=null;
    function schedulePriceNetworkFlush(delay=PRICE_NETWORK_FLUSH_MS){
        if(!settings.priceNetwork||!priceNetworkConfigured()||!networkQueue.length||networkFlushTimer)return;
        networkFlushTimer=setTimeout(()=>{networkFlushTimer=null;flushPriceNetwork();},Math.max(250,Number(delay)||0));
    }
    async function flushPriceNetwork(){
        if(state.networkBusy||!settings.priceNetwork||!priceNetworkConfigured()||!networkQueue.length)return false;
        state.networkBusy=true;state.networkLastError='';
        const batch=networkQueue.slice(0,PRICE_NETWORK_BATCH);
        try{
            const data=await networkRequest('/v1/observe',{method:'POST',body:{observations:batch}});
            networkQueue.splice(0,batch.length);saveNetworkQueue();
            state.networkSent+=Number(data?.accepted)||batch.length;state.networkLastFlush=Date.now();
            if(networkQueue.length)schedulePriceNetworkFlush(PRICE_NETWORK_FLUSH_MS);
            return true;
        }catch(e){state.networkLastError=String(e?.message||e);schedulePriceNetworkFlush(PRICE_NETWORK_FLUSH_MS);return false;}
        finally{state.networkBusy=false;}
    }
    function cachedNetworkConsensus(itemId){
        const row=networkConsensus[String(itemId)];
        if(!row?.at||Date.now()-Number(row.at)>PRICE_NETWORK_CACHE_MS)return null;
        return row.data||null;
    }
    async function fetchNetworkConsensus(itemId,force=false){
        if(!settings.priceNetwork||!priceNetworkConfigured())return null;
        if(!force){const c=cachedNetworkConsensus(itemId);if(c)return c;}
        try{
            const data=await networkRequest('/v1/items/'+encodeURIComponent(itemId));
            networkConsensus[String(itemId)]={at:Date.now(),data};saveJson(STORAGE.networkConsensus,networkConsensus);
            state.networkSamples=Number(data?.samples)||0;state.networkMedian=Number(data?.consensus?.median)||0;state.networkLastConsensusAt=Date.now();state.networkLastError='';
            return data;
        }catch(e){state.networkLastError=String(e?.message||e);return null;}
    }
    function networkConsensusHtml(data){
        if(!settings.priceNetwork)return '';
        if(!priceNetworkConfigured())return '<div class="sl-mi-network"><b>🌐 PRICE NETWORK</b><span>Opt-in enabled, but no HTTPS endpoint is configured yet.</span></div>';
        if(!data)return '<div class="sl-mi-network"><b>🌐 PRICE NETWORK</b><span>Loading anonymous network consensus…</span></div>';
        const c=data.consensus,samples=Number(data.samples)||0;
        if(!c||samples<=0)return '<div class="sl-mi-network"><b>🌐 PRICE NETWORK</b><span>No shared samples yet for this item.</span></div>';
        return '<div class="sl-mi-network"><b>🌐 PRICE NETWORK</b><span>Median <strong>'+money(c.median)+'</strong> · range '+money(c.low)+'–'+money(c.high)+' · '+samples+' samples</span><small>Secondary anonymous reference only — Torn/local prices remain primary.</small></div>';
    }
    function updateNetworkBlock(bar,data){
        if(!bar?.isConnected)return;const old=bar.querySelector('.sl-mi-network');if(!old)return;
        const wrap=document.createElement('div');wrap.innerHTML=networkConsensusHtml(data);const next=wrap.firstElementChild;if(next)old.replaceWith(next);
    }
'''
if anchor not in s: raise SystemExit('missing anchor: saveJson')
s=s.replace(anchor,network_code,1)

old="""        const row={price:marketValue,averagePrice:average>0?average:null,minPrice:floor,listingPrice:effective?.price||floor,qty:effective?.qty||0,count:norm.length}; cachePut(itemId,row); return row;\n"""
new="""        const row={price:marketValue,averagePrice:average>0?average:null,minPrice:floor,listingPrice:effective?.price||floor,qty:effective?.qty||0,count:norm.length}; cachePut(itemId,row); queueNetworkObservation(itemId,row.minPrice,'itemmarket'); return row;\n"""
rep(old,new,'fetchMarket observation')

old="""        bar.innerHTML='<div class=\"sl-mi-market-head\"><div><b>📈 ITEM MARKET INTELLIGENCE</b><span>floor <strong>'+money(market.minPrice)+'</strong> · effective <strong>'+money(market.price)+'</strong> · '+market.count+' listings</span></div><span class=\"sl-mi-signal '+signalClass+'\">'+esc(analysis.signal)+'</span></div>'+\n            '<div class=\"sl-mi-market-grid\"><div><small>TREND</small><strong>'+trendIcon+' '+pct(analysis.trend)+'</strong></div><div><small>MEDIAN</small><strong>'+money(analysis.median)+'</strong></div><div><small>VOLATILITY</small><strong>'+analysis.volatility.toFixed(1)+'%</strong></div><div><small>SPREAD</small><strong>'+analysis.spread.toFixed(1)+'%</strong></div></div>'+\n            '<div class=\"sl-mi-spark\"><span>'+esc(sparkText(analysis.rows))+'</span><small>'+analysis.samples+' local samples · '+esc(analysis.reason)+'</small></div>'+\n            '<div class=\"sl-mi-watch-row\"><input id=\"sl-mi-watch-price\" inputmode=\"numeric\" placeholder=\"Watch below...\" value=\"'+esc(watched?.maxPrice||'')+'\"><button id=\"sl-mi-watch-save\">'+(watched?'UPDATE WATCH':'ADD WATCH')+'</button>'+(watched?'<button id=\"sl-mi-watch-remove\">REMOVE</button>':'')+'</div>';\n        previous?.remove();\n        mountTop(bar);\n"""
new="""        const cachedNetwork=settings.priceNetwork&&priceNetworkConfigured()?cachedNetworkConsensus(id):null;bar.dataset.itemId=String(id);\n        bar.innerHTML='<div class=\"sl-mi-market-head\"><div><b>📈 ITEM MARKET INTELLIGENCE</b><span>floor <strong>'+money(market.minPrice)+'</strong> · effective <strong>'+money(market.price)+'</strong> · '+market.count+' listings</span></div><span class=\"sl-mi-signal '+signalClass+'\">'+esc(analysis.signal)+'</span></div>'+\n            '<div class=\"sl-mi-market-grid\"><div><small>TREND</small><strong>'+trendIcon+' '+pct(analysis.trend)+'</strong></div><div><small>MEDIAN</small><strong>'+money(analysis.median)+'</strong></div><div><small>VOLATILITY</small><strong>'+analysis.volatility.toFixed(1)+'%</strong></div><div><small>SPREAD</small><strong>'+analysis.spread.toFixed(1)+'%</strong></div></div>'+\n            '<div class=\"sl-mi-spark\"><span>'+esc(sparkText(analysis.rows))+'</span><small>'+analysis.samples+' local samples · '+esc(analysis.reason)+'</small></div>'+\n            networkConsensusHtml(cachedNetwork)+\n            '<div class=\"sl-mi-watch-row\"><input id=\"sl-mi-watch-price\" inputmode=\"numeric\" placeholder=\"Watch below...\" value=\"'+esc(watched?.maxPrice||'')+'\"><button id=\"sl-mi-watch-save\">'+(watched?'UPDATE WATCH':'ADD WATCH')+'</button>'+(watched?'<button id=\"sl-mi-watch-remove\">REMOVE</button>':'')+'</div>';\n        previous?.remove();\n        mountTop(bar);\n        if(settings.priceNetwork&&priceNetworkConfigured())fetchNetworkConsensus(id).then(data=>{if(bar.dataset.itemId===String(id))updateNetworkBlock(bar,data);});\n"""
rep(old,new,'item market network panel')

old="toggle('bazaar','Bazaar deal detection')+toggle('itemMarket','Item Market + local watchlist')+toggle('items','Inventory market estimates')"
new="toggle('bazaar','Bazaar deal detection')+toggle('itemMarket','Item Market + local watchlist')+toggle('priceNetwork','SakaLuX Price Network — anonymous opt-in')+'<label class=\"sl-mi-field\">Price Network HTTPS endpoint<input id=\"sl-mi-network-endpoint\" inputmode=\"url\" placeholder=\"https://your-worker.workers.dev\" value=\"'+esc(settings.priceNetworkEndpoint||'')+'\"></label><div class=\"sl-mi-network-privacy\">When enabled, only item ID, observed Item Market floor price, timestamp and source are shared. Torn ID, username, API key, device ID and cookies are never sent.</div>'+toggle('items','Inventory market estimates')"
rep(old,new,'settings network ui')

old="for(const k of['enabled','travel','bestRun','countryBestBuys','stockEta','arrivalStock','arrivalBasket','smartLandedRefresh','sessionSummary','bazaar','itemMarket','items','museum','points'])settings[k]=!!overlay.querySelector('#sl-mi-'+k)?.checked;"
new="for(const k of['enabled','travel','bestRun','countryBestBuys','stockEta','arrivalStock','arrivalBasket','smartLandedRefresh','sessionSummary','bazaar','itemMarket','priceNetwork','items','museum','points'])settings[k]=!!overlay.querySelector('#sl-mi-'+k)?.checked;"
rep(old,new,'settings save toggle')

old="settings.minProfit=parseMoney(overlay.querySelector('#sl-mi-min-profit').value)||0;const api=overlay.querySelector('#sl-mi-api')?.value.trim();"
new="settings.minProfit=parseMoney(overlay.querySelector('#sl-mi-min-profit').value)||0;settings.priceNetworkEndpoint=normalizeNetworkEndpoint(overlay.querySelector('#sl-mi-network-endpoint')?.value||'');const api=overlay.querySelector('#sl-mi-api')?.value.trim();"
rep(old,new,'settings endpoint save')

old="saveJson(STORAGE.settings,settings);overlay.remove();scheduleScan(true);};"
new="saveJson(STORAGE.settings,settings);if(settings.priceNetwork)schedulePriceNetworkFlush(500);overlay.remove();scheduleScan(true);};"
rep(old,new,'settings schedule network')

old=".sl-mi-watch-row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}.sl-mi-watch-row input{flex:1 1 140px;background:#0d0f14;color:#fff;border:1px solid #363e49;border-radius:6px;padding:8px}.sl-mi-watch-row button{border:0;border-radius:6px;padding:7px 9px;background:#303844;color:#fff;font-weight:900;font-size:10px}\n"
new=".sl-mi-network{display:flex;flex-direction:column;gap:3px;margin-top:7px;padding:7px;border:1px solid #2b3b49;border-radius:6px;background:#101820}.sl-mi-network>b{color:#7fc8ff}.sl-mi-network>span{color:#cbd5df}.sl-mi-network small{color:#7f8996;font-weight:600}.sl-mi-network-privacy{margin:6px 0;padding:8px;border-radius:7px;background:#111820;border:1px solid #273542;color:#9da8b5;font-size:9px;line-height:1.45}.sl-mi-watch-row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}.sl-mi-watch-row input{flex:1 1 140px;background:#0d0f14;color:#fff;border:1px solid #363e49;border-radius:6px;padding:8px}.sl-mi-watch-row button{border:0;border-radius:6px;padding:7px 9px;background:#303844;color:#fff;font-weight:900;font-size:10px}\n"
rep(old,new,'network css')

old="watchlistItems:Object.keys(watchlist).length,cachedMarketItems:Object.keys(marketCache).length,travelCacheHits:state.travelCacheHits"
new="watchlistItems:Object.keys(watchlist).length,cachedMarketItems:Object.keys(marketCache).length,priceNetworkEnabled:settings.priceNetwork,priceNetworkConfigured:priceNetworkConfigured(),networkQueued:networkQueue.length,networkSent:state.networkSent,networkBusy:state.networkBusy,networkLastFlush:state.networkLastFlush,networkLastError:state.networkLastError,networkSamples:state.networkSamples,networkMedian:state.networkMedian,networkLastConsensusAt:state.networkLastConsensusAt,travelCacheHits:state.travelCacheHits"
rep(old,new,'health network')

old="        itemMarketIntelligence(){if(detectPage()!=='itemmarket')return null;const id=selectedMarketItemId();if(!id)return null;const c=cachePeek(id);if(!c)return null;return analyzePriceHistory(id,Number(c.minPrice),c);},\n        goToBazaar()"
new="        itemMarketIntelligence(){if(detectPage()!=='itemmarket')return null;const id=selectedMarketItemId();if(!id)return null;const c=cachePeek(id);if(!c)return null;return analyzePriceHistory(id,Number(c.minPrice),c);},\n        priceNetworkStatus(){return{enabled:settings.priceNetwork,configured:priceNetworkConfigured(),endpoint:priceNetworkEndpoint(),queued:networkQueue.length,sent:state.networkSent,lastFlush:state.networkLastFlush,lastError:state.networkLastError,samples:state.networkSamples,median:state.networkMedian};},\n        async flushPriceNetwork(){return flushPriceNetwork();},\n        goToBazaar()"
rep(old,new,'public api')

old="function init(){injectCss();createButton();startObserver();maybePromptHub();saveTravelSessions();scheduleScan(true);console.log('['+NAME+' v'+VERSION+'] Loaded.');}"
new="function init(){injectCss();createButton();startObserver();maybePromptHub();saveTravelSessions();if(settings.priceNetwork&&networkQueue.length)schedulePriceNetworkFlush(2500);scheduleScan(true);console.log('['+NAME+' v'+VERSION+'] Loaded.');}"
rep(old,new,'init network flush')

P.write_text(s,encoding='utf-8')

# scripts.json registry
sp=ROOT/'scripts.json'
data=json.loads(sp.read_text(encoding='utf-8'))
found=False
for row in data:
    if row.get('id')=='market-intelligence':
        row['version']='1.16.0'
        row['description']='Torn PDA-first market/travel intelligence with anonymous opt-in SakaLuX Price Network consensus, Item Market signals, Bazaar Flip and travel/basket tools.'
        found=True
if not found: raise SystemExit('market-intelligence registry entry missing')
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Update info
up=ROOT/'UPDATE-INFO.md'
u=up.read_text(encoding='utf-8')
u=u.replace('- SakaLuX Market Intelligence: **v1.15.12** — Greasy Fork **592781**','- SakaLuX Market Intelligence: **v1.16.0** — Greasy Fork **592781**',1)
marker='## Latest changes\n\n'
entry='''### SakaLuX Market Intelligence v1.16.0 — SakaLuX Price Network Client\n- Added the first client for **SakaLuX Price Network** as an explicit anonymous opt-in.\n- When enabled, successful Torn Item Market lookups can queue only: item ID, observed floor price, timestamp and source. No Torn ID, username, API key, device ID, cookies or persistent client identifier are sent.\n- Added a bounded local queue (200 max), 25-observation batches, 10-minute duplicate suppression and retry-on-failure behavior.\n- Added HTTPS endpoint configuration in Settings so the shared backend can be deployed independently.\n- Item Market Intelligence can show a secondary **PRICE NETWORK** consensus with shared median, range and sample count; it never silently replaces Torn/local pricing.\n- Added a 5-minute local consensus cache and automatic local/Torn fallback when the network is unavailable.\n- Added Price Network counters/status to `health()`, plus `priceNetworkStatus()` and `flushPriceNetwork()` public API actions.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.12.user.js`.\n\n'''
if marker not in u: raise SystemExit('UPDATE marker missing')
u=u.replace(marker,marker+entry,1)
up.write_text(u,encoding='utf-8')

# Greasy Fork info
gp=ROOT/'greasyfork'/'Market-Intelligence.md'
g=gp.read_text(encoding='utf-8')
g=g.replace('**Current version: v1.15.12**','**Current version: v1.16.0**',1)
marker='SakaLuX Market Intelligence is a Torn PDA / Tampermonkey add-on for market and travel decisions, fully integrated with **SakaLuX Script Hub**.\n\n'
entry='''## v1.16.0 — SakaLuX Price Network Client\n\n- Adds an explicit opt-in client for the anonymous **SakaLuX Price Network**.\n- Shared observations contain only item ID, observed Torn Item Market floor price, timestamp and source.\n- Torn ID, username, API key, device ID, cookies and persistent client identifiers are not sent.\n- Uses a small local queue with batching, duplicate suppression and retry behavior so Torn PDA is not spammed with requests.\n- Adds an HTTPS endpoint field in Settings; if no endpoint is configured, all existing local/Torn/YATA features continue normally.\n- Item Market Intelligence can show network median/range/sample count as a secondary reference without replacing Torn/local prices.\n- Adds network health/status counters and public API helpers.\n\n'''
if marker not in g: raise SystemExit('GF marker missing')
g=g.replace(marker,marker+entry,1)
gp.write_text(g,encoding='utf-8')

# Price Network README status
rp=ROOT/'price-network'/'README.md'
r=rp.read_text(encoding='utf-8')
r=r.replace('## Next client phase\n\nMarket Intelligence will add:\n\n- opt-in `SakaLuX Price Network` setting;\n- local observation queue with rate limiting and batching;\n- anonymous upload of observed market prices;\n- network consensus shown as a secondary reference, never silently replacing Torn\'s own price data;\n- health counters for queued/sent/network samples;\n- automatic fallback to local/Torn data when the network is unavailable.','## Client status — Market Intelligence v1.16.0\n\nImplemented in the userscript:\n\n- explicit opt-in `SakaLuX Price Network` setting;\n- configurable HTTPS Worker endpoint;\n- bounded local observation queue with duplicate suppression and batching;\n- anonymous upload contract restricted to item ID, price, timestamp and source;\n- network consensus as a secondary Item Market reference;\n- health counters for queued/sent/network samples;\n- automatic fallback to local/Torn data when the network is unavailable.\n\nThe remaining deployment step is to create the Cloudflare D1 database, deploy the Worker, and paste its HTTPS URL into Market Intelligence Settings.')
rp.write_text(r,encoding='utf-8')

print('patched v1.16.0')
