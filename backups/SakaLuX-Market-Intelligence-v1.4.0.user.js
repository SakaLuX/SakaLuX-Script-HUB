// ==UserScript==
// @name         SakaLuX Market Intelligence
// @namespace    sakalux.market.intelligence
// @version      1.4.0
// @description  Torn market and travel intelligence with fast Travel tools, Bazaar Flip Intelligence, Item Market tools, arrival-stock prediction and Museum set valuation.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @connect      yata.yt
// @connect      raw.githubusercontent.com
// @license      MIT
// @run-at       document-end
// @downloadURL  https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.user.js
// @updateURL    https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = '1.4.0';
    const NAME = 'SakaLuX Market Intelligence';
    const PDA_KEY = '###PDA-APIKEY###';
    const HUB_INSTALL_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
    const HUB_PROMPT_STORAGE = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
    const HUB_PROMPT_INTERVAL = 24 * 60 * 60 * 1000;
    const YATA_EXPORT_URL = 'https://yata.yt/api/v1/travel/export/';

    const STORAGE = {
        apiKey: 'SakaLuX_MI_API_KEY',
        settings: 'SakaLuX_MI_SETTINGS_V2',
        marketCache: 'SakaLuX_MI_MARKET_CACHE_V1',
        watchlist: 'SakaLuX_MI_WATCHLIST_V1',
        pointsRate: 'SakaLuX_MI_POINTS_RATE_V1',
        stockHistory: 'SakaLuX_MI_STOCK_HISTORY_V1',
        itemCatalog: 'SakaLuX_MI_ITEM_CATALOG_V1'
    };

    const MARKET_CACHE_MS = 10 * 60 * 1000;
    const TRAVEL_CACHE_MAX_STALE_MS = 6 * 60 * 60 * 1000;
    const TRAVEL_REFRESH_LIMIT = 15;
    const ARRIVAL_REFRESH_LIMIT = 12;
    const MAX_LIVE_FETCHES = 45;
    const CONCURRENCY = 6;
    const MAX_HISTORY_EVENTS = 8;
    const STOCK_HISTORY_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
    const ITEM_CATALOG_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
    const POINTS_RATE_MAX_AGE = 24 * 60 * 60 * 1000;

    const FLIGHT_MINS = {
        Mexico: 25, Caymans: 33, Canada: 39, Hawaii: 127, UK: 151,
        Argentina: 158, Switzerland: 166, Japan: 213, China: 229,
        UAE: 257, 'South Africa': 281
    };

    const YATA_COUNTRY_MAP = {
        mex: 'Mexico', cay: 'Caymans', can: 'Canada', haw: 'Hawaii',
        uni: 'UK', arg: 'Argentina', swi: 'Switzerland', jap: 'Japan',
        chi: 'China', uae: 'UAE', sou: 'South Africa'
    };



    const MUSEUM_SETS = [
        { id:'arrowheads', name:'Arrowhead Set', points:25, members:[
            {name:'Chert Point',qty:1},{name:'Quartzite Point',qty:1},{name:'Basalt Point',qty:1},
            {name:'Obsidian Point',qty:1},{name:'Quartz Point',qty:1},{name:'Chalcedony Point',qty:1}
        ]},
        { id:'medieval-coins', name:'Medieval Coin Set', points:100, members:[
            {name:'Leopard Coin',qty:1},{name:'Florin Coin',qty:1},{name:'Gold Noble Coin',qty:1}
        ]},
        { id:'patagonian-fossil', name:'Patagonian Fossil', points:20, members:[{name:'Patagonian Fossil',qty:1}] },
        { id:'meteorite-fragment', name:'Meteorite Fragment', points:15, members:[{name:'Meteorite Fragment',qty:1}] },
        { id:'vairocana-buddha', name:'Vairocana Buddha', points:100, members:[{name:'Vairocana Buddha Sculpture',qty:1}] },
        { id:'ganesha', name:'Ganesha Sculpture', points:250, members:[{name:'Ganesha Sculpture',qty:1}] },
        { id:'shabti', name:'Shabti Sculpture', points:500, members:[{name:'Shabti Sculpture',qty:1}] },
        { id:'senet', name:'Senet Game Set', points:2000, members:[
            {name:'Senet Board',qty:1},{name:'White Senet Pawn',qty:5},{name:'Black Senet Pawn',qty:5}
        ]},
        { id:'companion-scripts', name:'Companion Script Set', points:1000, members:[
            {name:'Companion Script : Abdullah',qty:1},{name:'Companion Script : Ali',qty:1},{name:'Companion Script : Ubay',qty:1}
        ]},
        { id:'egyptian-amulet', name:'Egyptian Amulet', points:10000, members:[{name:'Egyptian Amulet',qty:1}] }
    ];

    const TORN_TRAVEL_LABELS = {
        Mexico: ['Mexico'],
        Caymans: ['Cayman Islands', 'Caymans'],
        Canada: ['Canada'],
        Hawaii: ['Hawaii'],
        UK: ['United Kingdom', 'UK'],
        Argentina: ['Argentina'],
        Switzerland: ['Switzerland'],
        Japan: ['Japan'],
        China: ['China'],
        UAE: ['UAE', 'United Arab Emirates'],
        'South Africa': ['South Africa']
    };

    const DEFAULT_SETTINGS = {
        enabled: true,
        travel: true,
        bestRun: true,
        stockEta: true,
        arrivalStock: true,
        bazaar: true,
        itemMarket: true,
        items: true,
        museum: true,
        points: true,
        showButton: true,
        marketFeePct: 5,
        minProfit: 0,
        travelSlots: 29,
        flightMultiplier: 1
    };

    let settings = Object.assign({}, DEFAULT_SETTINGS, loadJson(STORAGE.settings, {}));
    let marketCache = loadJson(STORAGE.marketCache, {});
    let watchlist = loadJson(STORAGE.watchlist, {});
    let stockHistory = loadJson(STORAGE.stockHistory, {});

    const state = {
        page: '', apiMode: '', busy: false, lastScan: 0, lastError: '',
        scanCount: 0, marketRequests: 0, decorated: 0, observer: null,
        scanTimer: null, bestRunRows: 0, stockEtaLearned: 0,
        arrivalRows: 0, flightDestination: '', landingMins: null,
        travelCacheHits: 0, travelRefreshes: 0, observerSkips: 0, lastObserverScan: 0,
        museumSets: 0, museumRecommendation: '', museumMissingSets: 0,
        bazaarDeals: 0, bazaarBestProfit: 0, bazaarBestRoi: 0
    };

    function loadJson(key, fallback) {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
        catch (_) { return fallback; }
    }
    function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
    function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
    function money(v) { const n=Number(v); if(!Number.isFinite(n)) return '?'; return (n<0?'-':'')+'$'+Math.round(Math.abs(n)).toLocaleString('en-US'); }
    function pct(v) { const n=Number(v); if(!Number.isFinite(n)) return '?'; return (n>=0?'+':'')+n.toFixed(1)+'%'; }
    function parseMoney(text) { const s=String(text||'').replace(/[^0-9]/g,''); return s?Number(s):NaN; }
    function fmtDuration(mins) { if(mins==null||!Number.isFinite(mins)) return 'learning'; mins=Math.max(0,Math.round(mins)); if(mins<60) return '~'+mins+'m'; const h=Math.floor(mins/60),m=mins%60; return '~'+h+'h'+(m?' '+m+'m':''); }
    function normText(text) { return String(text||'').replace(/\s+/g,' ').trim(); }
    function median(values) { const a=values.filter(Number.isFinite).sort((x,y)=>x-y); return a.length ? a[Math.floor(a.length/2)] : null; }



    function museumNameKey(name) {
        return normText(name).toLowerCase().replace(/\s*:\s*/g, ':');
    }

    function museumDomCatalog() {
        const map=new Map();
        document.querySelectorAll('img[src*="/images/items/"]').forEach(img=>{
            const id=itemIdFromImg(img); if(!id)return;
            const row=rowContainer(img);
            const raw=normText(img.getAttribute('alt')||'') || normText((row?.innerText||'').split('\n')[0]);
            if(!raw)return;
            map.set(museumNameKey(raw),{id,name:raw,source:'museum-dom'});
        });
        return map;
    }

    async function loadMuseumCatalog() {
        const merged=museumDomCatalog();
        const cached=loadJson(STORAGE.itemCatalog,null);
        if(cached?.items && cached?.at && Date.now()-cached.at<ITEM_CATALOG_MAX_AGE) {
            for(const item of cached.items){if(item?.id&&item?.name)merged.set(museumNameKey(item.name),item);}
            return merged;
        }
        const key=getApiKey();
        if(!key)return merged;
        try {
            const data=await requestJson('https://api.torn.com/torn/?selections=items&key='+encodeURIComponent(key));
            checkApiError(data);
            const items=[];
            for(const [id,meta] of Object.entries(data?.items||{})){
                const n=Number(id); if(!n||!meta?.name)continue;
                const item={id:n,name:meta.name,type:meta.type||'',source:'torn-catalog'};
                items.push(item); merged.set(museumNameKey(item.name),item);
            }
            if(items.length)saveJson(STORAGE.itemCatalog,{at:Date.now(),items});
        } catch (_) {}
        return merged;
    }

    function freshPointsRate() {
        const row=loadJson(STORAGE.pointsRate,null);
        if(!row?.rate||!row?.at)return null;
        if(Date.now()-Number(row.at)>POINTS_RATE_MAX_AGE)return null;
        return Number(row.rate)||null;
    }

    function normalizeDestination(value) {
        const text=normText(value).toLowerCase();
        if(!text) return null;
        for(const [key,labels] of Object.entries(TORN_TRAVEL_LABELS)) {
            if(key.toLowerCase()===text || labels.some(v=>v.toLowerCase()===text)) return key;
        }
        if(text.includes('cayman')) return 'Caymans';
        if(text==='united kingdom'||text==='uk') return 'UK';
        if(text.includes('united arab')||text==='uae') return 'UAE';
        if(text.includes('south africa')) return 'South Africa';
        for(const key of Object.keys(FLIGHT_MINS)) if(text.includes(key.toLowerCase())) return key;
        return null;
    }

    function getApiKey() {
        if (PDA_KEY && PDA_KEY !== '###PDA-APIKEY###') { state.apiMode='Torn PDA'; return PDA_KEY; }
        try { const key=localStorage.getItem(STORAGE.apiKey)||''; if(key) state.apiMode='Manual'; return key; } catch (_) { return ''; }
    }
    function saveApiKey(key) { try { localStorage.setItem(STORAGE.apiKey,key); state.apiMode='Manual'; } catch (_) {} }

    function requestJson(url) {
        return new Promise((resolve,reject)=>{
            if (typeof window.PDA_httpGet === 'function') {
                state.apiMode='Torn PDA';
                window.PDA_httpGet(url,{Accept:'application/json'}).then(r=>{
                    try { if(typeof r==='string') return resolve(JSON.parse(r)); const raw=r?.responseText??r?.body??r?.data??r; resolve(typeof raw==='string'?JSON.parse(raw):raw); }
                    catch(e){reject(e);}
                }).catch(reject); return;
            }
            if (typeof GM_xmlhttpRequest === 'function') {
                state.apiMode=state.apiMode||'Tampermonkey';
                GM_xmlhttpRequest({method:'GET',url,timeout:15000,headers:{Accept:'application/json'},onload:r=>{try{resolve(JSON.parse(r.responseText));}catch(e){reject(e);}},onerror:()=>reject(new Error('Network error')),ontimeout:()=>reject(new Error('Request timeout'))});
                return;
            }
            fetch(url).then(r=>r.json()).then(resolve).catch(reject);
        });
    }
    function checkApiError(data) { if(data?.error) throw new Error(data.error.error||data.error.message||'Torn API error'); }

    function detectPage() {
        const u=location.href;
        if(/sid=travel/i.test(u)) return 'travel';
        if(/sid=ItemMarket/i.test(u)) return 'itemmarket';
        if(/bazaar\.php/i.test(u)) return 'bazaar';
        if(/item\.php/i.test(u)) return 'items';
        if(/museum\.php/i.test(u)) return 'museum';
        if(/pmarket\.php/i.test(u)) return 'points';
        return 'other';
    }
    function detectDestination() { const body=document.body?.innerText||''; const m=body.match(/You are in ([A-Z][A-Za-z ]+?) and have/); return m?normalizeDestination(m[1]):null; }
    function detectInFlight() { const body=document.body?.innerText||''; return /Remaining Flight Time/i.test(body)||/Traveling from .* to /i.test(body); }

    function parseClockToSeconds(text) {
        const m=String(text||'').match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if(!m) return null;
        if(m[3]!=null) return Number(m[1])*3600+Number(m[2])*60+Number(m[3]);
        return Number(m[1])*60+Number(m[2]);
    }

    function detectFlightFromDom() {
        const body=document.body?.innerText||'';
        let destination=null, seconds=null;
        const to=body.match(/Traveling\s+(?:from\s+.+?\s+)?to\s+([A-Za-z ]+?)(?:\n|Remaining|$)/i);
        if(to) destination=normalizeDestination(to[1]);
        if(!destination) {
            for(const key of Object.keys(FLIGHT_MINS)) {
                const labels=TORN_TRAVEL_LABELS[key]||[key];
                if(labels.some(l=>new RegExp('(?:to|destination)\\s+'+l.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(body))) { destination=key; break; }
            }
        }
        const rt=body.match(/Remaining Flight Time[^0-9]*(\d{1,2}:\d{2}(?::\d{2})?)/i);
        if(rt) seconds=parseClockToSeconds(rt[1]);
        return {destination,seconds,source:'page'};
    }

    async function fetchFlightStatus() {
        const fallback=detectFlightFromDom();
        const key=getApiKey();
        if(!key) return fallback;
        try {
            const data=await requestJson('https://api.torn.com/user/?selections=travel&key='+encodeURIComponent(key));
            checkApiError(data);
            const travel=data?.travel||{};
            const destination=normalizeDestination(travel.destination)||fallback.destination;
            let seconds=Number(travel.time_left);
            if(!Number.isFinite(seconds) || seconds<0) {
                const ts=Number(travel.timestamp);
                seconds=Number.isFinite(ts)&&ts>0 ? Math.max(0,ts-Math.floor(Date.now()/1000)) : fallback.seconds;
            }
            return {destination,seconds:Number.isFinite(seconds)?seconds:fallback.seconds,source:'Torn API'};
        } catch (_) {
            return fallback;
        }
    }

    function isVisible(el) {
        if(!el || !(el instanceof Element)) return false;
        const r=el.getBoundingClientRect();
        if(r.width===0 && r.height===0) return false;
        const s=getComputedStyle(el);
        return s.display!=='none' && s.visibility!=='hidden';
    }

    function selectTravelDestination(destination) {
        if(detectPage()!=='travel' || detectDestination() || detectInFlight()) return false;
        const labels=TORN_TRAVEL_LABELS[destination]||[destination];
        const candidates=[];
        const nodes=document.querySelectorAll('a,button,[role="button"],li,tr,div');
        for(const el of nodes){
            if(!isVisible(el)) continue;
            const text=normText(el.innerText||el.textContent);
            if(!text || text.length>180) continue;
            const lower=text.toLowerCase();
            let hit=false;
            for(const label of labels){
                const l=label.toLowerCase();
                if(lower===l || lower.startsWith(l+' -') || lower.startsWith(l+'-') || lower.startsWith(l+' ')){hit=true;break;}
            }
            if(!hit) continue;
            candidates.push({el,textLen:text.length,area:Math.max(1,el.getBoundingClientRect().width*el.getBoundingClientRect().height)});
        }
        candidates.sort((a,b)=>a.textLen-b.textLen || a.area-b.area);
        const seed=candidates[0]?.el;
        if(!seed) return false;
        const target=seed.closest('a,button,[role="button"],li,tr')||seed;
        try { target.scrollIntoView({behavior:'smooth',block:'center'}); } catch (_) { try { target.scrollIntoView(); } catch(__){} }
        setTimeout(()=>{
            try { target.click(); }
            catch (_) { try { target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window})); } catch(__){} }
        },120);
        return true;
    }

    function rowContainer(img) { return img.closest('tr')||img.closest('li')||img.closest('[class*="row"]')||img.closest('[class*="Row"]')||img.closest('[class*="item"]')||img.parentElement?.parentElement||img.parentElement; }
    function itemIdFromImg(img) { const m=(img?.getAttribute('src')||'').match(/\/images\/items\/(\d+)\//); return m?Number(m[1]):null; }
    function extractFirstPrice(node) { const txt=(node?.innerText||node?.textContent||'').replace(/\s+/g,' '); const m=txt.match(/\$\s*([\d,.]+)/); return m?parseMoney(m[1]):NaN; }
    function extractStock(node) { const txt=(node?.innerText||'').replace(/\$\s*[\d,.]+/g,' '); const nums=txt.match(/\b\d[\d,]*\b/g)||[]; if(!nums.length) return null; const vals=nums.map(x=>Number(x.replace(/,/g,''))).filter(Number.isFinite); return vals.length?Math.max(...vals):null; }

    function cacheGet(itemId) { const row=marketCache[String(itemId)]; if(!row||!row.at||Date.now()-row.at>MARKET_CACHE_MS) return null; return row; }
    function cachePeek(itemId,maxAge=TRAVEL_CACHE_MAX_STALE_MS) { const row=marketCache[String(itemId)]; if(!row||!row.at||Date.now()-row.at>maxAge) return null; return row; }
    function cachePut(itemId,row) { marketCache[String(itemId)]=Object.assign({},row,{at:Date.now()}); saveJson(STORAGE.marketCache,marketCache); }
    async function fetchMarket(itemId,force=false) {
        if(!force){const c=cacheGet(itemId); if(c) return c;}
        const key=getApiKey(); if(!key) return null;
        state.marketRequests++;
        const data=await requestJson('https://api.torn.com/v2/market/'+encodeURIComponent(itemId)+'/itemmarket?key='+encodeURIComponent(key));
        checkApiError(data);
        const listings=Array.isArray(data?.itemmarket?.listings)?data.itemmarket.listings:(Array.isArray(data?.itemmarket)?data.itemmarket:[]);
        const norm=listings.map(l=>({price:Number(l.price??l.cost??0),qty:Number(l.amount??l.quantity??1)})).filter(l=>l.price>0).sort((a,b)=>a.price-b.price);
        if(!norm.length) return null;
        const effective=norm.find(l=>l.qty>=2)||norm[0];
        const row={price:effective.price,minPrice:norm[0].price,qty:effective.qty,count:norm.length}; cachePut(itemId,row); return row;
    }
    async function mapWithLimit(items,fn) { const out=new Array(items.length); let i=0; async function worker(){while(i<items.length){const idx=i++; try{out[idx]=await fn(items[idx],idx);}catch(_){out[idx]=null;}}} const workers=[]; for(let w=0;w<Math.min(CONCURRENCY,items.length);w++) workers.push(worker()); await Promise.all(workers); return out; }
    function metrics(buyPrice,marketPrice) { const fee=Math.max(0,Number(settings.marketFeePct)||0)/100; const net=marketPrice*(1-fee); const profit=net-buyPrice; return {net,profit,roi:buyPrice>0?profit/buyPrice*100:0}; }

    function stockKey(destination,itemId){return destination+'|'+itemId;}
    function nextQuarterHourMins(now=Date.now()){const tick=15*60*1000; return (Math.ceil(now/tick)*tick-now)/60000;}
    function recordStock(destination,itemId,stock,now=Date.now()) {
        if(!destination||!Number.isFinite(Number(stock))) return;
        const key=stockKey(destination,itemId), qty=Number(stock);
        let h=stockHistory[key]||{last:null,restocks:[],restockQty:[]};
        if(!Array.isArray(h.restocks)) h.restocks=[];
        if(!Array.isArray(h.restockQty)) h.restockQty=[];
        if(h.last&&Number.isFinite(h.last.qty)&&qty>h.last.qty){
            const delta=qty-h.last.qty;
            h.restocks=h.restocks.filter(t=>now-t<STOCK_HISTORY_MAX_AGE); h.restocks.push(now); h.restocks=h.restocks.slice(-MAX_HISTORY_EVENTS);
            h.restockQty.push(delta); h.restockQty=h.restockQty.filter(v=>Number.isFinite(v)&&v>0).slice(-MAX_HISTORY_EVENTS);
        }
        h.last={qty,at:now}; stockHistory[key]=h;
    }

    function restockStats(destination,itemId,now=Date.now()) {
        const h=stockHistory[stockKey(destination,itemId)];
        const events=(h?.restocks||[]).filter(t=>Number.isFinite(t)&&now-t<STOCK_HISTORY_MAX_AGE).sort((a,b)=>a-b);
        const gaps=[];
        for(let i=1;i<events.length;i++){const g=(events[i]-events[i-1])/60000;if(g>0&&g<24*60)gaps.push(g);}
        const medGap=median(gaps);
        const medQty=median((h?.restockQty||[]).map(Number).filter(v=>v>0));
        return {events,gaps,medGap,medQty,samples:events.length};
    }

    function estimateRestock(destination,itemId,now=Date.now()) {
        const stats=restockStats(destination,itemId,now);
        if(stats.medGap&&stats.events.length>=2){
            const last=stats.events[stats.events.length-1]; let target=last+stats.medGap*60000;
            while(target<=now) target+=stats.medGap*60000;
            state.stockEtaLearned++;
            return {mins:(target-now)/60000,learned:true,samples:stats.events.length,gap:stats.medGap,qty:stats.medQty};
        }
        return {mins:nextQuarterHourMins(now),learned:false,samples:stats.events.length,gap:null,qty:stats.medQty};
    }

    function predictAtArrival(destination,itemId,currentStock,landingMins,now=Date.now()) {
        const stock=Number(currentStock);
        const horizon=Math.max(0,Number(landingMins)||0);
        const e=estimateRestock(destination,itemId,now);
        let expectedRestocks=0;
        let confidence='LOW';
        let projected=Number.isFinite(stock)?stock:null;
        if(e.learned&&e.gap>0){
            if(e.mins<=horizon) expectedRestocks=1+Math.floor(Math.max(0,horizon-e.mins)/e.gap);
            confidence=e.samples>=5?'HIGH':e.samples>=3?'MEDIUM':'LOW';
            if(projected!=null&&e.qty&&expectedRestocks>0) projected+=e.qty*expectedRestocks;
        } else {
            expectedRestocks=Math.max(0,Math.floor((horizon-nextQuarterHourMins(now))/15)+1);
            confidence='LEARNING';
        }
        return {current:projected==null?null:stock,projected,expectedRestocks,confidence,eta:e};
    }

    function stockEtaText(destination,itemId,stock){
        if(!settings.stockEta) return '';
        const e=estimateRestock(destination,itemId);
        if(e.learned) return ' · next stock '+fmtDuration(e.mins);
        if(Number(stock)===0) return ' · possible restock ≤'+Math.max(1,Math.ceil(e.mins))+'m';
        return ' · restock ETA learning';
    }
    function flushStockHistory(){ saveJson(STORAGE.stockHistory,stockHistory); }

    async function fetchYataAll(){
        const data=await requestJson(YATA_EXPORT_URL); const countries=data?.stocks||data||{}; const rows=[];
        for(const code of Object.keys(countries)){
            const destination=YATA_COUNTRY_MAP[code]; if(!destination) continue;
            const arr=countries[code]?.stocks||countries[code]||[]; if(!Array.isArray(arr)) continue;
            for(const s of arr){const id=Number(s.id),buy=Number(s.cost),stock=Number(s.quantity);if(!id||!(buy>0))continue;rows.push({itemId:id,name:s.name||('Item #'+id),destination,buyPrice:buy,stock:Number.isFinite(stock)?stock:null});}
        }
        return rows;
    }

    function ensureBadge(row,cls){let box=row.querySelector(':scope > .'+cls);if(!box){box=document.createElement('div');box.className=cls;row.appendChild(box);}return box;}

    function buildBestRunRows(candidates,marketMap){
        const slots=Math.max(1,Number(settings.travelSlots)||29),mult=Math.max(0.1,Number(settings.flightMultiplier)||1),ranked=[];
        for(const r of candidates){
            const market=marketMap.get(r.itemId),flight=FLIGHT_MINS[r.destination];if(!market||!flight)continue;
            const m=metrics(r.buyPrice,market.price);if(m.profit<=0)continue;
            const qty=r.stock==null?slots:Math.min(slots,r.stock);if(qty<=0)continue;
            const profitRun=m.profit*qty,roundTrip=flight*mult*2,profitHour=profitRun/(roundTrip/60);
            ranked.push(Object.assign({},r,{market:market.price,net:m.net,profitItem:m.profit,roi:m.roi,qty,profitRun,profitHour,flightMins:flight*mult,eta:estimateRestock(r.destination,r.itemId)}));
        }
        return ranked.sort((a,b)=>b.profitHour-a.profitHour).slice(0,11);
    }

    function paintBestTravelRun(top,phase){
        document.getElementById('sl-mi-best-run')?.remove();state.bestRunRows=top.length;if(!top.length)return;
        const bar=document.createElement('div');bar.id='sl-mi-best-run';const best=top[0];
        bar.innerHTML='<div class="sl-mi-br-head"><span class="sl-mi-br-title">☠︎ BEST TRAVEL RUN</span><strong>'+esc(best.name)+' → '+esc(best.destination)+'</strong><span>'+money(best.profitHour)+'/hr</span><button type="button">▾</button></div><div class="sl-mi-perf-note">'+esc(phase||'cached')+'</div><div class="sl-mi-br-body"></div>';
        const body=bar.querySelector('.sl-mi-br-body');
        for(const r of top){
            const row=document.createElement('div');row.className='sl-mi-br-row sl-mi-route';row.dataset.destination=r.destination;row.setAttribute('role','button');row.tabIndex=0;row.title='Select '+r.destination+' in Torn Travel';
            const eta=r.eta.learned?('next '+fmtDuration(r.eta.mins)):('ETA learning · possible ≤'+Math.max(1,Math.ceil(r.eta.mins))+'m');
            row.innerHTML='<span class="name">'+esc(r.name)+'</span><span>'+esc(r.destination)+'</span><span>stock '+(r.stock==null?'?':Number(r.stock).toLocaleString('en-US'))+'</span><span class="eta">'+eta+'</span><span>'+money(r.profitRun)+'/run</span><strong>'+money(r.profitHour)+'/hr</strong>';
            const activate=()=>selectTravelDestination(r.destination);row.addEventListener('click',activate);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});body.appendChild(row);
        }
        bar.querySelector('.sl-mi-br-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);
    }

    function travelRefreshIds(candidates,limit){
        const scored=candidates.map(r=>{
            const c=cachePeek(r.itemId),flight=FLIGHT_MINS[r.destination]||9999;
            let score=0;
            if(c){const m=metrics(r.buyPrice,c.price);score=Math.max(0,m.profit)*(Math.min(Math.max(1,Number(settings.travelSlots)||29),r.stock==null?999:r.stock))/(flight||1);}
            else score=Math.max(1,r.buyPrice)/Math.max(1,flight);
            return {id:r.itemId,score,cached:!!c};
        }).sort((a,b)=>(b.cached-a.cached)||(b.score-a.score));
        const ids=[];const seen=new Set();
        for(const x of scored){if(seen.has(x.id))continue;seen.add(x.id);ids.push(x.id);if(ids.length>=limit)break;}
        return ids;
    }

    async function renderBestTravelRun(){
        document.getElementById('sl-mi-best-run')?.remove();
        if(!settings.bestRun||detectDestination()||detectInFlight()) return;
        const yata=await fetchYataAll(); if(!yata.length) return;
        const candidates=[];
        for(const r of yata){if(r.stock!=null)recordStock(r.destination,r.itemId,r.stock);if(r.stock===0)continue;candidates.push(r);}flushStockHistory();

        const cachedMap=new Map();
        for(const r of candidates){const c=cachePeek(r.itemId);if(c)cachedMap.set(r.itemId,c);}
        state.travelCacheHits=cachedMap.size;
        const cachedTop=buildBestRunRows(candidates,cachedMap);
        if(cachedTop.length) paintBestTravelRun(cachedTop,'instant cache · refreshing '+TRAVEL_REFRESH_LIMIT+' prices in background');

        const ids=travelRefreshIds(candidates,TRAVEL_REFRESH_LIMIT);
        state.travelRefreshes=ids.length;
        await mapWithLimit(ids,async id=>{const m=await fetchMarket(id,true);if(m)return m;});

        const finalMap=new Map();
        for(const r of candidates){const c=cachePeek(r.itemId);if(c)finalMap.set(r.itemId,c);}
        const finalTop=buildBestRunRows(candidates,finalMap);
        if(finalTop.length) paintBestTravelRun(finalTop,'live-refreshed shortlist · '+ids.length+' market requests max');
    }

    async function renderArrivalStock(){
        document.getElementById('sl-mi-arrival')?.remove();
        state.arrivalRows=0;state.flightDestination='';state.landingMins=null;
        if(!settings.arrivalStock||!detectInFlight()) return;
        const flight=await fetchFlightStatus();
        const destination=normalizeDestination(flight.destination);const landingMins=Number(flight.seconds)/60;
        if(!destination||!Number.isFinite(landingMins)||landingMins<0) return;
        state.flightDestination=destination;state.landingMins=landingMins;
        const yata=(await fetchYataAll()).filter(r=>r.destination===destination);if(!yata.length)return;
        for(const r of yata)if(r.stock!=null)recordStock(destination,r.itemId,r.stock);flushStockHistory();
        const marketMap=new Map();
        for(const r of yata){const c=cachePeek(r.itemId);if(c)marketMap.set(r.itemId,c);}
        const ids=travelRefreshIds(yata,ARRIVAL_REFRESH_LIMIT);
        await mapWithLimit(ids,async id=>{const m=await fetchMarket(id,true);if(m)marketMap.set(id,m);});
        const slots=Math.max(1,Number(settings.travelSlots)||29),rows=[];
        for(const r of yata){
            const market=marketMap.get(r.itemId);if(!market)continue;
            const m=metrics(r.buyPrice,market.price);if(m.profit<=0)continue;
            const p=predictAtArrival(destination,r.itemId,r.stock,landingMins);
            const availableQty=p.projected==null?slots:Math.min(slots,Math.max(0,p.projected));
            const currentQty=r.stock==null?0:Math.min(slots,Math.max(0,r.stock));
            const projectedProfit=m.profit*availableQty,currentProfit=m.profit*currentQty;
            const score=projectedProfit+(p.expectedRestocks>0?Math.max(0,m.profit)*Math.min(slots,Number(p.eta.qty)||0)*0.25:0);
            rows.push(Object.assign({},r,{market:market.price,profitItem:m.profit,roi:m.roi,p,currentProfit,projectedProfit,score}));
        }
        rows.sort((a,b)=>b.score-a.score);const top=rows.slice(0,8);state.arrivalRows=top.length;if(!top.length)return;
        const bar=document.createElement('div');bar.id='sl-mi-arrival';bar.className='open';
        bar.innerHTML='<div class="sl-mi-arrival-head"><div><span class="sl-mi-br-title">✈ ARRIVAL STOCK</span><strong>'+esc(destination)+'</strong></div><div>Landing '+fmtDuration(landingMins)+' · '+esc(flight.source)+'</div><button type="button">▾</button></div><div class="sl-mi-arrival-note">Prediction uses current YATA stock plus locally learned restock timing. “Projected” is an estimate, not guaranteed stock.</div><div class="sl-mi-arrival-body"></div>';
        const body=bar.querySelector('.sl-mi-arrival-body');
        for(const r of top){
            const p=r.p,restockText=p.expectedRestocks>0?(p.eta.learned?('likely '+p.expectedRestocks+' restock'+(p.expectedRestocks===1?'':'s')+' before landing'):('possible restock before landing')):'no learned restock before landing';
            const proj=p.projected==null?'?':Math.max(0,Math.round(p.projected)).toLocaleString('en-US');
            const row=document.createElement('div');row.className='sl-mi-arrival-row';
            row.innerHTML='<span class="name">'+esc(r.name)+'</span><span>now '+(r.stock==null?'?':Number(r.stock).toLocaleString('en-US'))+'</span><span class="eta">arrival ~'+proj+'</span><span>'+esc(restockText)+'</span><span class="conf '+p.confidence.toLowerCase()+'">'+esc(p.confidence)+'</span><strong>'+money(r.projectedProfit)+'/run</strong>';
            body.appendChild(row);
        }
        bar.querySelector('.sl-mi-arrival-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);
    }

    async function scanTravel(){
        if(!settings.travel)return;
        if(detectInFlight()){document.getElementById('sl-mi-best-run')?.remove();await renderArrivalStock();return;}
        document.getElementById('sl-mi-arrival')?.remove();
        if(!detectDestination()){await renderBestTravelRun();return;}
        const destination=detectDestination();if(!destination)return;
        document.getElementById('sl-mi-best-run')?.remove();
        const imgs=[...document.querySelectorAll('img[src*="/images/items/"]')],entries=[],seen=new Set();
        for(const img of imgs){const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;const buy=extractFirstPrice(row);if(!(buy>0))continue;seen.add(row);entries.push({id,row,buy,name:img.alt||('Item #'+id),stock:extractStock(row)});}
        const unique=[...new Map(entries.map(e=>[e.id,e])).values()].slice(0,MAX_LIVE_FETCHES);
        await mapWithLimit(unique,async e=>{if(e.stock!=null)recordStock(destination,e.id,e.stock);const market=await fetchMarket(e.id);if(!market)return;const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-travel');box.classList.toggle('loss',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>☠︎ MI</b> Market '+money(market.price)+' · Net '+money(m.net)+' · <strong>'+money(m.profit)+' ('+pct(m.roi)+')</strong>'+(e.stock!=null?' · Stock '+e.stock.toLocaleString('en-US')+stockEtaText(destination,e.id,e.stock):'');state.decorated++;});
        flushStockHistory();
    }

    function paintBazaarBoard(rows){
        document.getElementById('sl-mi-bazaar-board')?.remove();
        state.bazaarDeals=rows.length;
        state.bazaarBestProfit=rows[0]?.profit||0;
        state.bazaarBestRoi=rows.slice().sort((a,b)=>b.roi-a.roi)[0]?.roi||0;
        if(!rows.length)return;
        const top=rows.slice(0,10),best=top[0];
        const bar=document.createElement('div');bar.id='sl-mi-bazaar-board';bar.className='open';
        bar.innerHTML='<div class="sl-mi-baz-head"><div><span class="sl-mi-br-title">💰 BAZAAR FLIP INTELLIGENCE</span><strong>'+esc(best.name)+' · '+money(best.profit)+'</strong></div><div>'+top.length+' deals</div><button type="button">▾</button></div><div class="sl-mi-baz-note">Ranked by estimated net profit after '+esc(settings.marketFeePct)+'% market fee. Tap a row to scroll to that Bazaar listing.</div><div class="sl-mi-baz-body"></div>';
        const body=bar.querySelector('.sl-mi-baz-body');
        for(const r of top){
            const row=document.createElement('div');row.className='sl-mi-baz-row';row.tabIndex=0;row.setAttribute('role','button');
            row.innerHTML='<span class="name">'+esc(r.name)+'</span><span>Buy '+money(r.buy)+'</span><span>Market '+money(r.market)+'</span><strong>'+money(r.profit)+'</strong><span>'+pct(r.roi)+'</span>';
            const go=()=>{try{r.row.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){r.row.scrollIntoView();}r.row.classList.add('sl-mi-focus');setTimeout(()=>r.row.classList.remove('sl-mi-focus'),1800);};
            row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};body.appendChild(row);
        }
        bar.querySelector('.sl-mi-baz-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);
    }

    async function scanBazaar(){
        if(!settings.bazaar)return;
        document.getElementById('sl-mi-bazaar-board')?.remove();
        state.bazaarDeals=0;state.bazaarBestProfit=0;state.bazaarBestRoi=0;
        const imgs=[...document.querySelectorAll('img[src*="/images/items/"]')],entries=[],seen=new Set();
        for(const img of imgs){
            const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;
            const buy=extractFirstPrice(row);if(!(buy>1))continue;
            seen.add(row);entries.push({id,row,buy,name:img.alt||('Item #'+id)});
        }
        const ids=[...new Set(entries.map(e=>e.id))].slice(0,MAX_LIVE_FETCHES),map=new Map();
        for(const id of ids){const c=cachePeek(id);if(c)map.set(id,c);}
        await mapWithLimit(ids,async id=>{const m=await fetchMarket(id);if(m)map.set(id,m);});
        const deals=[];
        for(const e of entries){
            const market=map.get(e.id);if(!market)continue;
            const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-bazaar');
            const good=m.profit>=Number(settings.minProfit||0)&&m.profit>0;
            box.classList.toggle('good',good);box.classList.toggle('bad',!good);
            box.innerHTML='<b>'+(good?'▲ DEAL':'▼ NO FLIP')+'</b> · Market '+money(market.price)+' · '+money(m.profit)+' · '+pct(m.roi);
            if(good)deals.push({id:e.id,row:e.row,name:e.name,buy:e.buy,market:market.price,profit:m.profit,roi:m.roi});
            state.decorated++;
        }
        deals.sort((a,b)=>b.profit-a.profit || b.roi-a.roi);
        paintBazaarBoard(deals);
    }

    function selectedMarketItemId(){const m=(location.hash||'').match(/itemID=(\d+)/i);return m?Number(m[1]):null;}
    async function scanItemMarket(){
        if(!settings.itemMarket)return;const id=selectedMarketItemId();document.getElementById('sl-mi-market-bar')?.remove();if(!id)return;const market=await fetchMarket(id,true);if(!market)return;const watched=watchlist[String(id)]||null,bar=document.createElement('div');bar.id='sl-mi-market-bar';
        bar.innerHTML='<div><b>☠︎ Market Intelligence</b> · floor <strong>'+money(market.minPrice)+'</strong> · effective <strong>'+money(market.price)+'</strong> · '+market.count+' listings</div><div class="sl-mi-watch-row"><input id="sl-mi-watch-price" inputmode="numeric" placeholder="Watch below..." value="'+esc(watched?.maxPrice||'')+'"><button id="sl-mi-watch-save">'+(watched?'UPDATE WATCH':'ADD WATCH')+'</button>'+(watched?'<button id="sl-mi-watch-remove">REMOVE</button>':'')+'</div>';mountTop(bar);
        bar.querySelector('#sl-mi-watch-save').onclick=()=>{const n=parseMoney(bar.querySelector('#sl-mi-watch-price').value);if(!(n>0))return;watchlist[String(id)]={itemId:id,maxPrice:n,updatedAt:Date.now()};saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};
        const rm=bar.querySelector('#sl-mi-watch-remove');if(rm)rm.onclick=()=>{delete watchlist[String(id)];saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};if(watched&&market.minPrice<=watched.maxPrice)bar.classList.add('hit');
    }

    async function scanItems(){
        if(!settings.items)return;const imgs=[...document.querySelectorAll('img[src*="/images/items/"]')],entries=[],seen=new Set();
        for(const img of imgs){const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;const qm=(row.innerText||'').match(/\bx\s*([\d,]+)/i);if(!qm)continue;const qty=Number(qm[1].replace(/,/g,''));if(!(qty>0))continue;seen.add(row);entries.push({id,row,qty});}
        await mapWithLimit(entries.slice(0,MAX_LIVE_FETCHES),async e=>{const market=await fetchMarket(e.id);if(!market)return;const net=market.price*(1-(Number(settings.marketFeePct)||0)/100),box=ensureBadge(e.row,'sl-mi-items');box.innerHTML='<b>☠︎ MI</b> est. net '+money(net)+'/ea · stack '+money(net*e.qty);state.decorated++;});
    }

    function scrapePointsRate(){const vals=[];document.querySelectorAll('*').forEach(el=>{if(el.children.length)return;const m=(el.textContent||'').trim().match(/^\$\s*([\d,]+)$/);if(!m)return;const n=parseMoney(m[1]);if(n>=5000&&n<=200000)vals.push(n);});return vals.length?Math.min(...vals):null;}
    function scanPoints(){if(!settings.points)return;const rate=scrapePointsRate();if(!rate)return;saveJson(STORAGE.pointsRate,{rate,at:Date.now()});document.getElementById('sl-mi-points-bar')?.remove();const bar=document.createElement('div');bar.id='sl-mi-points-bar';bar.innerHTML='<b>☠︎ Points Intelligence</b> · captured <strong>'+money(rate)+'/point</strong>';mountTop(bar);}
    async function scanMuseum(){
        if(!settings.museum)return;
        document.getElementById('sl-mi-museum-bar')?.remove();
        state.museumSets=0;state.museumRecommendation='';state.museumMissingSets=0;

        const pointsRate=freshPointsRate();
        const catalog=await loadMuseumCatalog();
        const resolved=[];
        const itemIds=new Set();

        for(const set of MUSEUM_SETS){
            const members=[];const missing=[];
            for(const member of set.members){
                const item=catalog.get(museumNameKey(member.name));
                if(!item?.id){missing.push(member.name);continue;}
                members.push({id:Number(item.id),name:item.name||member.name,qty:Number(member.qty)||1});
                itemIds.add(Number(item.id));
            }
            resolved.push({set,members,missing});
        }

        const marketMap=new Map();
        for(const id of itemIds){const c=cachePeek(id);if(c)marketMap.set(id,c);}
        await mapWithLimit([...itemIds].slice(0,MAX_LIVE_FETCHES),async id=>{
            const m=await fetchMarket(id);if(m)marketMap.set(id,m);return m;
        });

        const rows=[];
        const fee=Math.max(0,Number(settings.marketFeePct)||0)/100;
        for(const entry of resolved){
            let gross=0;const unpriced=[];
            for(const member of entry.members){
                const market=marketMap.get(member.id);
                if(!market?.price){unpriced.push(member.name);continue;}
                gross+=Number(market.price)*member.qty;
            }
            const complete=entry.missing.length===0&&unpriced.length===0&&entry.members.length===entry.set.members.length;
            const sellNet=complete?gross*(1-fee):null;
            const pointsCash=complete&&pointsRate?entry.set.points*pointsRate:null;
            let recommendation='WAITING FOR DATA',difference=null,edgePct=null;
            if(complete&&!pointsRate)recommendation='CAPTURE POINTS RATE';
            if(complete&&pointsRate){
                difference=pointsCash-sellNet;
                recommendation=difference>=0?'TURN IN SET':'SELL ITEMS';
                const winner=Math.max(pointsCash,sellNet),loser=Math.max(1,Math.min(pointsCash,sellNet));
                edgePct=(winner-loser)/loser*100;
            }
            rows.push({set:entry.set,complete,missing:[...entry.missing,...unpriced],gross,sellNet,pointsCash,recommendation,difference,edgePct});
        }

        const ready=rows.filter(r=>r.complete);
        state.museumSets=ready.length;
        state.museumMissingSets=rows.length-ready.length;
        const actionable=ready.filter(r=>r.pointsCash!=null).sort((a,b)=>Math.abs(b.difference)-Math.abs(a.difference));
        state.museumRecommendation=actionable[0]?.recommendation||'';

        const bar=document.createElement('div');bar.id='sl-mi-museum-bar';bar.className='open';
        const rateText=pointsRate?money(pointsRate)+'/pt':'not captured / stale';
        bar.innerHTML='<div class="sl-mi-museum-head"><div><span class="sl-mi-br-title">🏛 MUSEUM INTELLIGENCE</span><strong>'+esc(rateText)+'</strong></div><button type="button">▾</button></div>'+
            '<div class="sl-mi-museum-note">Compares net Item Market sale value after '+esc(settings.marketFeePct)+'% fee with the cash-equivalent value of the Museum points reward.</div><div class="sl-mi-museum-body"></div>';
        const body=bar.querySelector('.sl-mi-museum-body');

        rows.sort((a,b)=>{
            if(a.complete!==b.complete)return a.complete?-1:1;
            return Math.abs(b.difference||0)-Math.abs(a.difference||0);
        });
        for(const r of rows){
            const row=document.createElement('div');row.className='sl-mi-museum-row';
            if(!r.complete){
                row.classList.add('missing');
                row.innerHTML='<span class="name">'+esc(r.set.name)+'</span><span>'+r.set.points.toLocaleString('en-US')+' pts</span><span class="muted">missing price/data: '+esc(r.missing.slice(0,2).join(', '))+(r.missing.length>2?' +'+(r.missing.length-2):'')+'</span>';
            } else if(!pointsRate){
                row.classList.add('missing');
                row.innerHTML='<span class="name">'+esc(r.set.name)+'</span><span>'+r.set.points.toLocaleString('en-US')+' pts</span><span>Sell net '+money(r.sellNet)+'</span><strong>CAPTURE POINTS RATE</strong>';
            } else {
                const turn=r.recommendation==='TURN IN SET';row.classList.add(turn?'turn':'sell');
                row.innerHTML='<span class="name">'+esc(r.set.name)+'</span><span>'+r.set.points.toLocaleString('en-US')+' pts</span><span>Sell net '+money(r.sellNet)+'</span><span>Points '+money(r.pointsCash)+'</span><strong>'+esc(r.recommendation)+'</strong><span class="edge">+'+money(Math.abs(r.difference))+' · '+pct(r.edgePct)+'</span>';
            }
            body.appendChild(row);
        }
        if(!pointsRate){
            const hint=document.createElement('button');hint.type='button';hint.className='sl-mi-points-link';hint.textContent='OPEN POINTS MARKET';hint.onclick=()=>{location.href='https://www.torn.com/pmarket.php';};body.prepend(hint);
        }
        bar.querySelector('.sl-mi-museum-head').onclick=()=>bar.classList.toggle('open');
        mountTop(bar);
    }
    function mountTop(el){const host=document.querySelector('#mainContainer .content-wrapper')||document.querySelector('.content-wrapper')||document.querySelector('#mainContainer')||document.body;host.insertBefore(el,host.firstChild);}

    async function scan(force=false){
        if(!settings.enabled||state.busy)return;state.busy=true;state.page=detectPage();state.decorated=0;state.marketRequests=0;state.stockEtaLearned=0;state.lastError='';
        try{if(force)document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board').forEach(n=>n.remove());switch(state.page){case'travel':await scanTravel();break;case'bazaar':await scanBazaar();break;case'itemmarket':await scanItemMarket();break;case'items':await scanItems();break;case'points':scanPoints();break;case'museum':await scanMuseum();break;}state.lastScan=Date.now();state.scanCount++;}
        catch(e){state.lastError=String(e?.message||e);console.error('['+NAME+']',e);}finally{state.busy=false;}
    }
    function scheduleScan(force=false){if(state.scanTimer)clearTimeout(state.scanTimer);state.scanTimer=setTimeout(()=>{state.scanTimer=null;scan(force);},450);}

    function toggle(key,label){return '<label class="sl-mi-toggle"><input id="sl-mi-'+key+'" type="checkbox" '+(settings[key]?'checked':'')+'><span>'+esc(label)+'</span></label>';}
    function openSettings(){
        document.getElementById('sl-mi-overlay')?.remove();const overlay=document.createElement('div');overlay.id='sl-mi-overlay';
        overlay.innerHTML='<div id="sl-mi-panel"><div class="sl-mi-head"><div><div class="sl-mi-title">☠︎ SakaLuX Market Intelligence</div><div class="sl-mi-sub">v'+VERSION+' · '+esc(state.apiMode||'API idle')+' · page: '+esc(state.page||detectPage())+'</div></div><button id="sl-mi-close">×</button></div>'+toggle('enabled','Enable Market Intelligence')+toggle('travel','Travel profit intelligence')+toggle('bestRun','Best Travel Run board')+toggle('stockEta','Stock + restock ETA')+toggle('arrivalStock','Arrival-stock prediction while flying')+toggle('bazaar','Bazaar deal detection')+toggle('itemMarket','Item Market + local watchlist')+toggle('items','Inventory market estimates')+toggle('museum','Museum intelligence')+toggle('points','Points Market rate capture')+'<label class="sl-mi-field">Travel slots<input id="sl-mi-slots" type="number" min="1" max="100" value="'+esc(settings.travelSlots)+'"></label><label class="sl-mi-field">Flight multiplier<input id="sl-mi-flight" type="number" min="0.1" max="1" step="0.01" value="'+esc(settings.flightMultiplier)+'"></label><label class="sl-mi-field">Market fee %<input id="sl-mi-fee" type="number" min="0" max="100" step="0.1" value="'+esc(settings.marketFeePct)+'"></label><label class="sl-mi-field">Minimum highlighted profit<input id="sl-mi-min-profit" inputmode="numeric" value="'+esc(settings.minProfit)+'"></label>'+(!getApiKey()?'<label class="sl-mi-field">Manual Torn API key<input id="sl-mi-api" type="password" placeholder="Public/limited key"></label>':'')+'<div class="sl-mi-info">Watchlist: <b>'+Object.keys(watchlist).length+'</b> · Cached market: <b>'+Object.keys(marketCache).length+'</b> · Stock histories: <b>'+Object.keys(stockHistory).length+'</b> · Arrival rows: <b>'+state.arrivalRows+'</b></div><button class="sl-mi-primary" id="sl-mi-save">SAVE</button><button class="sl-mi-secondary" id="sl-mi-refresh">REFRESH PAGE DATA</button><button class="sl-mi-secondary" id="sl-mi-hard">HARD REFRESH MARKET CACHE</button></div>';
        document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};overlay.querySelector('#sl-mi-close').onclick=()=>overlay.remove();
        overlay.querySelector('#sl-mi-save').onclick=()=>{for(const k of['enabled','travel','bestRun','stockEta','arrivalStock','bazaar','itemMarket','items','museum','points'])settings[k]=!!overlay.querySelector('#sl-mi-'+k)?.checked;settings.travelSlots=Math.max(1,Number(overlay.querySelector('#sl-mi-slots').value)||29);settings.flightMultiplier=Math.max(.1,Number(overlay.querySelector('#sl-mi-flight').value)||1);settings.marketFeePct=Number(overlay.querySelector('#sl-mi-fee').value)||0;settings.minProfit=parseMoney(overlay.querySelector('#sl-mi-min-profit').value)||0;const api=overlay.querySelector('#sl-mi-api')?.value.trim();if(api)saveApiKey(api);saveJson(STORAGE.settings,settings);overlay.remove();scheduleScan(true);};
        overlay.querySelector('#sl-mi-refresh').onclick=()=>{overlay.remove();scheduleScan(true);};overlay.querySelector('#sl-mi-hard').onclick=()=>{marketCache={};saveJson(STORAGE.marketCache,marketCache);overlay.remove();scheduleScan(true);};
    }

    function injectCss(){if(document.getElementById('sl-mi-style'))return;const s=document.createElement('style');s.id='sl-mi-style';s.textContent=`
.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run,#sl-mi-arrival{box-sizing:border-box;margin:4px 0;padding:6px 8px;border-radius:6px;background:#15191f;border:1px solid #2c333d;color:#d7dce5;font:700 10px/1.4 Arial,sans-serif}
.sl-mi-travel strong,.sl-mi-bazaar.good,.sl-mi-bazaar.good strong,#sl-mi-market-bar strong,#sl-mi-points-bar strong,#sl-mi-museum-bar strong,#sl-mi-best-run strong,#sl-mi-arrival strong{color:#78d98b}.sl-mi-travel.loss,.sl-mi-bazaar.bad,.sl-mi-bazaar.bad strong{color:#e06c6c}
#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run,#sl-mi-arrival{margin:8px auto 10px;max-width:1100px;border-left:3px solid #d7b94c;font-size:11px}#sl-mi-market-bar.hit{border-left-color:#78d98b;background:#152219}
.sl-mi-br-head,.sl-mi-arrival-head{display:flex;align-items:center;gap:8px;cursor:pointer}.sl-mi-br-title{color:#d7b94c;font-weight:900;letter-spacing:.08em}.sl-mi-br-head strong{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-mi-br-head button,.sl-mi-arrival-head button{border:0;background:transparent;color:#d7b94c;font-size:14px}.sl-mi-br-body,.sl-mi-arrival-body{display:none;margin-top:7px;gap:4px}.open .sl-mi-br-body,.open .sl-mi-arrival-body{display:flex;flex-direction:column}.sl-mi-br-row,.sl-mi-arrival-row{display:grid;grid-template-columns:minmax(0,1.4fr) auto auto auto auto auto;gap:8px;align-items:center;padding:5px 6px;border:1px solid #292f38;border-radius:5px;font-size:10px}.sl-mi-br-row .name,.sl-mi-arrival-row .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-mi-br-row .eta,.sl-mi-arrival-row .eta{color:#d7b94c}.sl-mi-route{cursor:pointer;transition:background .12s ease,border-color .12s ease}.sl-mi-route:hover,.sl-mi-route:focus{background:#1c2522;border-color:#4d6957;outline:none}.sl-mi-route:active{background:#203028}
.sl-mi-arrival-head{justify-content:space-between}.sl-mi-arrival-head>div:first-child{display:flex;gap:8px;align-items:center}.sl-mi-arrival-note,.sl-mi-perf-note{margin-top:5px;color:#8f98a5;font-weight:600;font-size:9px}.sl-mi-perf-note{color:#7f8996}.sl-mi-arrival-row .conf{padding:2px 5px;border-radius:4px;text-align:center}.sl-mi-arrival-row .conf.high{color:#78d98b}.sl-mi-arrival-row .conf.medium{color:#d7b94c}.sl-mi-arrival-row .conf.low,.sl-mi-arrival-row .conf.learning{color:#9da6b3}
.sl-mi-museum-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer}.sl-mi-museum-head>div{display:flex;align-items:center;gap:8px;min-width:0}.sl-mi-museum-head button{border:0;background:transparent;color:#d7b94c;font-size:14px}.sl-mi-museum-note{margin-top:5px;color:#8f98a5;font-weight:600;font-size:9px}.sl-mi-museum-body{display:none;margin-top:7px;gap:4px}#sl-mi-museum-bar.open .sl-mi-museum-body{display:flex;flex-direction:column}.sl-mi-museum-row{display:grid;grid-template-columns:minmax(0,1.4fr) auto auto auto auto auto;gap:8px;align-items:center;padding:6px;border:1px solid #292f38;border-radius:5px;font-size:10px}.sl-mi-museum-row .name{font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-mi-museum-row.turn{border-left:3px solid #78d98b;background:#142019}.sl-mi-museum-row.sell{border-left:3px solid #d7b94c;background:#201d13}.sl-mi-museum-row.missing{border-left:3px solid #5c6570}.sl-mi-museum-row .edge{color:#9da6b3}.sl-mi-points-link{border:1px solid #66591d;background:#2a2512;color:#e4c95d;border-radius:6px;padding:7px 9px;font-weight:900;font-size:10px;align-self:flex-start}
.sl-mi-baz-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer}.sl-mi-baz-head>div:first-child{display:flex;gap:8px;align-items:center;min-width:0}.sl-mi-baz-head strong{color:#78d98b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-mi-baz-head button{border:0;background:transparent;color:#d7b94c;font-size:14px}.sl-mi-baz-note{margin-top:5px;color:#8f98a5;font-weight:600;font-size:9px}.sl-mi-baz-body{display:none;margin-top:7px;gap:4px}#sl-mi-bazaar-board.open .sl-mi-baz-body{display:flex;flex-direction:column}.sl-mi-baz-row{display:grid;grid-template-columns:minmax(0,1.4fr) auto auto auto auto;gap:8px;align-items:center;padding:6px;border:1px solid #292f38;border-radius:5px;font-size:10px;cursor:pointer}.sl-mi-baz-row:hover,.sl-mi-baz-row:focus{background:#1a231c;border-color:#4d6957;outline:none}.sl-mi-baz-row .name{font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-mi-focus{outline:2px solid #78d98b!important;outline-offset:2px!important}
.sl-mi-watch-row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}.sl-mi-watch-row input{flex:1 1 140px;background:#0d0f14;color:#fff;border:1px solid #363e49;border-radius:6px;padding:8px}.sl-mi-watch-row button{border:0;border-radius:6px;padding:7px 9px;background:#303844;color:#fff;font-weight:900;font-size:10px}
#sl-mi-button{position:fixed;right:10px;bottom:106px;z-index:2147483644;border:0;border-radius:999px;padding:9px 11px;background:#18181b;color:#fff;box-shadow:0 5px 18px rgba(0,0,0,.42);font-weight:900;font-size:12px}
#sl-mi-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.78);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}#sl-mi-panel{width:min(560px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0}.sl-mi-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.sl-mi-title{font-size:16px;font-weight:900}.sl-mi-sub{margin-top:3px;color:#8e96a3;font-size:9px}#sl-mi-close{width:36px;height:36px;border:0;border-radius:9px;background:#272d35;color:#fff;font-size:20px}.sl-mi-toggle,.sl-mi-field{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}.sl-mi-field input{width:45%;box-sizing:border-box;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:7px;padding:7px}.sl-mi-info{margin:10px 0;color:#a6adb8;font-size:10px}.sl-mi-primary,.sl-mi-secondary{width:100%;min-height:40px;margin-top:7px;border:0;border-radius:9px;color:#fff;font-weight:900}.sl-mi-primary{background:#2563eb}.sl-mi-secondary{background:#374151}.muted{color:#7e8793}
@media(max-width:700px){.sl-mi-br-row,.sl-mi-arrival-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-museum-row{grid-template-columns:minmax(0,1fr) auto;gap:3px 7px}.sl-mi-museum-row .name{grid-column:1/-1}.sl-mi-baz-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-baz-row .name{grid-column:1/-1}.sl-mi-br-row .eta,.sl-mi-arrival-row .eta{grid-column:1/-1}.sl-mi-arrival-head{align-items:flex-start;flex-wrap:wrap}}@media(min-width:700px){#sl-mi-overlay{align-items:center}#sl-mi-panel{border-radius:18px}}
`;document.head.appendChild(s);}

    function createButton(){if(!settings.showButton||document.getElementById('sl-mi-button'))return;const b=document.createElement('button');b.id='sl-mi-button';b.textContent='☠︎ Market';b.onclick=openSettings;document.body.appendChild(b);}
    function maybePromptHub(){if(window.SakaLuXScriptHub)return;let last=0;try{last=Number(localStorage.getItem(HUB_PROMPT_STORAGE)||0);}catch(_){}if(Date.now()-last<HUB_PROMPT_INTERVAL)return;setTimeout(()=>{if(window.SakaLuXScriptHub||document.getElementById('sl-mi-hub-prompt'))return;const box=document.createElement('div');box.id='sl-mi-hub-prompt';box.style.cssText='position:fixed;left:10px;right:10px;bottom:20px;z-index:2147483647;max-width:520px;margin:auto;background:#11161d;color:#fff;border:1px solid #39414c;border-radius:12px;padding:12px;font:12px Arial;box-shadow:0 8px 30px rgba(0,0,0,.55)';box.innerHTML='<b>☠︎ SakaLuX Script Hub</b><div style="margin:6px 0;color:#b8bec7">Install the Hub to manage Market Intelligence and the other SakaLuX add-ons from one place.</div><div style="display:flex;gap:7px"><button id="sl-mi-hub-install" style="flex:1;padding:9px;border:0;border-radius:7px;background:#2563eb;color:white;font-weight:900">INSTALL HUB</button><button id="sl-mi-hub-later" style="flex:1;padding:9px;border:0;border-radius:7px;background:#353c46;color:white;font-weight:900">NOT NOW</button></div>';document.body.appendChild(box);box.querySelector('#sl-mi-hub-install').onclick=()=>{location.href=HUB_INSTALL_URL;};box.querySelector('#sl-mi-hub-later').onclick=()=>{try{localStorage.setItem(HUB_PROMPT_STORAGE,String(Date.now()));}catch(_){}box.remove();};},1800);}
    function startObserver(){if(state.observer)return;state.observer=new MutationObserver(muts=>{const now=Date.now();const meaningful=muts.some(m=>[...m.addedNodes||[]].some(n=>{if(!(n instanceof Element))return false;if(n.id&&n.id.startsWith('sl-mi-'))return false;if(n.closest?.('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-overlay,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items'))return false;return true;}));if(!meaningful)return;if(detectPage()==='travel'&&now-state.lastObserverScan<1800){state.observerSkips++;return;}state.lastObserverScan=now;scheduleScan(false);});state.observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>scheduleScan(true));}

    window.SakaLuXMarketIntelligence={
        id:'market-intelligence',name:'Market Intelligence',version:VERSION,
        open(){openSettings();return true;},
        async refresh(){await scan(true);return true;},
        async hardRefresh(){marketCache={};saveJson(STORAGE.marketCache,marketCache);await scan(true);return true;},
        health(){return{ready:true,version:VERSION,page:state.page||detectPage(),apiMode:state.apiMode,hasApiKey:Boolean(getApiKey()),busy:state.busy,lastScan:state.lastScan,lastError:state.lastError,scanCount:state.scanCount,marketRequests:state.marketRequests,decorated:state.decorated,bestRunRows:state.bestRunRows,arrivalRows:state.arrivalRows,flightDestination:state.flightDestination,landingMins:state.landingMins,stockEtaLearned:state.stockEtaLearned,stockHistories:Object.keys(stockHistory).length,watchlistItems:Object.keys(watchlist).length,cachedMarketItems:Object.keys(marketCache).length,travelCacheHits:state.travelCacheHits,travelRefreshes:state.travelRefreshes,observerSkips:state.observerSkips,museumSets:state.museumSets,museumMissingSets:state.museumMissingSets,museumRecommendation:state.museumRecommendation,bazaarDeals:state.bazaarDeals,bazaarBestProfit:state.bazaarBestProfit,bazaarBestRoi:state.bazaarBestRoi};},
        goToTravel(){location.href='https://www.torn.com/page.php?sid=travel';return true;},
        goToBestRun(){location.href='https://www.torn.com/page.php?sid=travel';return true;},
        selectDestination(destination){return selectTravelDestination(destination);},
        async arrivalPrediction(){if(detectPage()!=='travel'||!detectInFlight())return false;await renderArrivalStock();return true;},
        goToMarket(){location.href='https://www.torn.com/page.php?sid=ItemMarket';return true;},
        goToBazaar(){location.href='https://www.torn.com/bazaar.php';return true;},
        goToMuseum(){location.href='https://www.torn.com/museum.php';return true;},
        async museumIntelligence(){if(detectPage()!=='museum')return false;await scanMuseum();return true;}
    };
    window.dispatchEvent(new CustomEvent('SakaLuX:MarketIntelligenceReady',{detail:{version:VERSION}}));

    function init(){injectCss();createButton();startObserver();maybePromptHub();scheduleScan(true);console.log('['+NAME+' v'+VERSION+'] Loaded.');}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
