// ==UserScript==
// @name         SakaLuX Market Intelligence
// @namespace    sakalux.market.intelligence
// @version      1.1.0
// @description  Torn market and travel intelligence with Best Travel Run, stock/restock ETA, Bazaar deals, Item Market watchlist, Items, Museum and Points Market support.
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

    const VERSION = '1.1.0';
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
        stockHistory: 'SakaLuX_MI_STOCK_HISTORY_V1'
    };

    const MARKET_CACHE_MS = 10 * 60 * 1000;
    const MAX_LIVE_FETCHES = 45;
    const CONCURRENCY = 4;
    const MAX_HISTORY_EVENTS = 8;
    const STOCK_HISTORY_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

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

    const DEFAULT_SETTINGS = {
        enabled: true,
        travel: true,
        bestRun: true,
        stockEta: true,
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
        scanTimer: null, bestRunRows: 0, stockEtaLearned: 0
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
    function detectDestination() { const body=document.body?.innerText||''; const m=body.match(/You are in ([A-Z][A-Za-z ]+?) and have/); return m?m[1].trim():null; }
    function detectInFlight() { const body=document.body?.innerText||''; return /Remaining Flight Time/i.test(body); }

    function rowContainer(img) { return img.closest('tr')||img.closest('li')||img.closest('[class*="row"]')||img.closest('[class*="Row"]')||img.closest('[class*="item"]')||img.parentElement?.parentElement||img.parentElement; }
    function itemIdFromImg(img) { const m=(img?.getAttribute('src')||'').match(/\/images\/items\/(\d+)\//); return m?Number(m[1]):null; }
    function extractFirstPrice(node) { const txt=(node?.innerText||node?.textContent||'').replace(/\s+/g,' '); const m=txt.match(/\$\s*([\d,.]+)/); return m?parseMoney(m[1]):NaN; }
    function extractStock(node) { const txt=(node?.innerText||'').replace(/\$\s*[\d,.]+/g,' '); const nums=txt.match(/\b\d[\d,]*\b/g)||[]; if(!nums.length) return null; const vals=nums.map(x=>Number(x.replace(/,/g,''))).filter(Number.isFinite); return vals.length?Math.max(...vals):null; }

    function cacheGet(itemId) { const row=marketCache[String(itemId)]; if(!row||!row.at||Date.now()-row.at>MARKET_CACHE_MS) return null; return row; }
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

    // Local stock intelligence: every observation is kept per destination/item.
    // When stock jumps upward we learn a real restock event. After two events we
    // estimate the next refill from the median interval. Until then we show the
    // next possible Torn quarter-hour stock tick as a clearly-labelled fallback.
    function stockKey(destination,itemId){return destination+'|'+itemId;}
    function nextQuarterHourMins(now=Date.now()){const tick=15*60*1000; return (Math.ceil(now/tick)*tick-now)/60000;}
    function recordStock(destination,itemId,stock,now=Date.now()) {
        if(!destination||!Number.isFinite(Number(stock))) return;
        const key=stockKey(destination,itemId), qty=Number(stock);
        let h=stockHistory[key]||{last:null,restocks:[]};
        if(h.last&&Number.isFinite(h.last.qty)&&qty>h.last.qty){
            h.restocks=(h.restocks||[]).filter(t=>now-t<STOCK_HISTORY_MAX_AGE); h.restocks.push(now); h.restocks=h.restocks.slice(-MAX_HISTORY_EVENTS);
        }
        h.last={qty,at:now}; stockHistory[key]=h;
    }
    function estimateRestock(destination,itemId,now=Date.now()) {
        const h=stockHistory[stockKey(destination,itemId)];
        const events=(h?.restocks||[]).filter(t=>now-t<STOCK_HISTORY_MAX_AGE).sort((a,b)=>a-b);
        if(events.length>=2){
            const gaps=[]; for(let i=1;i<events.length;i++){const g=(events[i]-events[i-1])/60000;if(g>0&&g<24*60)gaps.push(g);}
            if(gaps.length){gaps.sort((a,b)=>a-b); const med=gaps[Math.floor(gaps.length/2)]; const last=events[events.length-1]; let target=last+med*60000; while(target<=now) target+=med*60000; state.stockEtaLearned++; return {mins:(target-now)/60000,learned:true,samples:events.length};}
        }
        return {mins:nextQuarterHourMins(now),learned:false,samples:events.length};
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
            for(const s of arr){const id=Number(s.id); const buy=Number(s.cost); const stock=Number(s.quantity); if(!id||!(buy>0)) continue; rows.push({itemId:id,name:s.name||('Item #'+id),destination,buyPrice:buy,stock:Number.isFinite(stock)?stock:null});}
        }
        return rows;
    }

    function ensureBadge(row,cls){let box=row.querySelector(':scope > .'+cls); if(!box){box=document.createElement('div');box.className=cls;row.appendChild(box);} return box;}

    async function renderBestTravelRun(){
        document.getElementById('sl-mi-best-run')?.remove();
        if(!settings.bestRun||detectDestination()||detectInFlight()) return;
        const yata=await fetchYataAll(); if(!yata.length) return;
        const profitableCandidates=[];
        for(const r of yata){ if(r.stock!=null) recordStock(r.destination,r.itemId,r.stock); if(r.stock===0) continue; profitableCandidates.push(r); }
        flushStockHistory();
        const ids=[...new Set(profitableCandidates.map(r=>r.itemId))].slice(0,MAX_LIVE_FETCHES);
        const marketMap=new Map(); await mapWithLimit(ids,async id=>{const m=await fetchMarket(id);if(m)marketMap.set(id,m);});
        const slots=Math.max(1,Number(settings.travelSlots)||29), mult=Math.max(0.1,Number(settings.flightMultiplier)||1);
        const ranked=[];
        for(const r of profitableCandidates){
            const market=marketMap.get(r.itemId); const flight=FLIGHT_MINS[r.destination]; if(!market||!flight) continue;
            const m=metrics(r.buyPrice,market.price); if(m.profit<=0) continue;
            const qty=r.stock==null?slots:Math.min(slots,r.stock); if(qty<=0) continue;
            const profitRun=m.profit*qty, roundTrip=flight*mult*2, profitHour=profitRun/(roundTrip/60);
            ranked.push(Object.assign({},r,{market:market.price,net:m.net,profitItem:m.profit,roi:m.roi,qty,profitRun,profitHour,flightMins:flight*mult,eta:estimateRestock(r.destination,r.itemId)}));
        }
        ranked.sort((a,b)=>b.profitHour-a.profitHour); const top=ranked.slice(0,11); state.bestRunRows=top.length; if(!top.length) return;
        const bar=document.createElement('div'); bar.id='sl-mi-best-run';
        const best=top[0];
        bar.innerHTML='<div class="sl-mi-br-head"><span class="sl-mi-br-title">☠︎ BEST TRAVEL RUN</span><strong>'+esc(best.name)+' → '+esc(best.destination)+'</strong><span>'+money(best.profitHour)+'/hr</span><button type="button">▾</button></div><div class="sl-mi-br-body"></div>';
        const body=bar.querySelector('.sl-mi-br-body');
        for(const r of top){
            const row=document.createElement('div'); row.className='sl-mi-br-row';
            const eta=r.eta.learned?('next '+fmtDuration(r.eta.mins)):('ETA learning · possible ≤'+Math.max(1,Math.ceil(r.eta.mins))+'m');
            row.innerHTML='<span class="name">'+esc(r.name)+'</span><span>'+esc(r.destination)+'</span><span>stock '+(r.stock==null?'?':Number(r.stock).toLocaleString('en-US'))+'</span><span class="eta">'+eta+'</span><span>'+money(r.profitRun)+'/run</span><strong>'+money(r.profitHour)+'/hr</strong>';
            body.appendChild(row);
        }
        bar.querySelector('.sl-mi-br-head').onclick=()=>bar.classList.toggle('open'); mountTop(bar);
    }

    async function scanTravel(){
        if(!settings.travel) return;
        if(!detectDestination()&&!detectInFlight()){await renderBestTravelRun();return;}
        const destination=detectDestination(); if(!destination) return;
        document.getElementById('sl-mi-best-run')?.remove();
        const imgs=[...document.querySelectorAll('img[src*="/images/items/"]')], entries=[], seen=new Set();
        for(const img of imgs){const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;const buy=extractFirstPrice(row);if(!(buy>0))continue;seen.add(row);entries.push({id,row,buy,name:img.alt||('Item #'+id),stock:extractStock(row)});}
        const unique=[...new Map(entries.map(e=>[e.id,e])).values()].slice(0,MAX_LIVE_FETCHES);
        await mapWithLimit(unique,async e=>{if(e.stock!=null)recordStock(destination,e.id,e.stock);const market=await fetchMarket(e.id);if(!market)return;const m=metrics(e.buy,market.price);const box=ensureBadge(e.row,'sl-mi-travel');box.classList.toggle('loss',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>☠︎ MI</b> Market '+money(market.price)+' · Net '+money(m.net)+' · <strong>'+money(m.profit)+' ('+pct(m.roi)+')</strong>'+(e.stock!=null?' · Stock '+e.stock.toLocaleString('en-US')+stockEtaText(destination,e.id,e.stock):'');state.decorated++;});
        flushStockHistory();
    }

    async function scanBazaar(){
        if(!settings.bazaar)return; const imgs=[...document.querySelectorAll('img[src*="/images/items/"]')],entries=[],seen=new Set();
        for(const img of imgs){const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;const buy=extractFirstPrice(row);if(!(buy>1))continue;seen.add(row);entries.push({id,row,buy});}
        const ids=[...new Set(entries.map(e=>e.id))].slice(0,MAX_LIVE_FETCHES),map=new Map(); await mapWithLimit(ids,async id=>{const m=await fetchMarket(id);if(m)map.set(id,m);});
        for(const e of entries){const market=map.get(e.id);if(!market)continue;const m=metrics(e.buy,market.price);const box=ensureBadge(e.row,'sl-mi-bazaar');box.classList.toggle('good',m.profit>=Number(settings.minProfit||0));box.classList.toggle('bad',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>'+(m.profit>=0?'▲ DEAL':'▼ NO FLIP')+'</b> · Market '+money(market.price)+' · '+money(m.profit)+' · '+pct(m.roi);state.decorated++;}
    }

    function selectedMarketItemId(){const m=(location.hash||'').match(/itemID=(\d+)/i);return m?Number(m[1]):null;}
    async function scanItemMarket(){
        if(!settings.itemMarket)return; const id=selectedMarketItemId();document.getElementById('sl-mi-market-bar')?.remove();if(!id)return;const market=await fetchMarket(id,true);if(!market)return;const watched=watchlist[String(id)]||null;const bar=document.createElement('div');bar.id='sl-mi-market-bar';bar.innerHTML='<div><b>☠︎ Market Intelligence</b> · floor <strong>'+money(market.minPrice)+'</strong> · effective <strong>'+money(market.price)+'</strong> · '+market.count+' listings</div><div class="sl-mi-watch-row"><input id="sl-mi-watch-price" inputmode="numeric" placeholder="Watch below..." value="'+esc(watched?.maxPrice||'')+'"><button id="sl-mi-watch-save">'+(watched?'UPDATE WATCH':'ADD WATCH')+'</button>'+(watched?'<button id="sl-mi-watch-remove">REMOVE</button>':'')+'</div>';mountTop(bar);bar.querySelector('#sl-mi-watch-save').onclick=()=>{const n=parseMoney(bar.querySelector('#sl-mi-watch-price').value);if(!(n>0))return;watchlist[String(id)]={itemId:id,maxPrice:n,updatedAt:Date.now()};saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};const rm=bar.querySelector('#sl-mi-watch-remove');if(rm)rm.onclick=()=>{delete watchlist[String(id)];saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};if(watched&&market.minPrice<=watched.maxPrice)bar.classList.add('hit');
    }

    async function scanItems(){
        if(!settings.items)return; const imgs=[...document.querySelectorAll('img[src*="/images/items/"]')],entries=[],seen=new Set();for(const img of imgs){const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;const qm=(row.innerText||'').match(/\bx\s*([\d,]+)/i);if(!qm)continue;const qty=Number(qm[1].replace(/,/g,''));if(!(qty>0))continue;seen.add(row);entries.push({id,row,qty});}await mapWithLimit(entries.slice(0,MAX_LIVE_FETCHES),async e=>{const market=await fetchMarket(e.id);if(!market)return;const net=market.price*(1-(Number(settings.marketFeePct)||0)/100);const box=ensureBadge(e.row,'sl-mi-items');box.innerHTML='<b>☠︎ MI</b> est. net '+money(net)+'/ea · stack '+money(net*e.qty);state.decorated++;});
    }

    function scrapePointsRate(){const vals=[];document.querySelectorAll('*').forEach(el=>{if(el.children.length)return;const m=(el.textContent||'').trim().match(/^\$\s*([\d,]+)$/);if(!m)return;const n=parseMoney(m[1]);if(n>=5000&&n<=200000)vals.push(n);});return vals.length?Math.min(...vals):null;}
    function scanPoints(){if(!settings.points)return;const rate=scrapePointsRate();if(!rate)return;saveJson(STORAGE.pointsRate,{rate,at:Date.now()});document.getElementById('sl-mi-points-bar')?.remove();const bar=document.createElement('div');bar.id='sl-mi-points-bar';bar.innerHTML='<b>☠︎ Points Intelligence</b> · captured <strong>'+money(rate)+'/point</strong>';mountTop(bar);}
    function scanMuseum(){if(!settings.museum)return;document.getElementById('sl-mi-museum-bar')?.remove();const rate=loadJson(STORAGE.pointsRate,null);const bar=document.createElement('div');bar.id='sl-mi-museum-bar';bar.innerHTML='<b>☠︎ Museum Intelligence</b> · Points rate: <strong>'+(rate?.rate?money(rate.rate)+'/pt':'not captured yet')+'</strong><span class="muted"> · Full set valuation is the next module.</span>';mountTop(bar);}
    function mountTop(el){const host=document.querySelector('#mainContainer .content-wrapper')||document.querySelector('.content-wrapper')||document.querySelector('#mainContainer')||document.body;host.insertBefore(el,host.firstChild);}

    async function scan(force=false){if(!settings.enabled||state.busy)return;state.busy=true;state.page=detectPage();state.decorated=0;state.marketRequests=0;state.stockEtaLearned=0;state.lastError='';try{if(force)document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run').forEach(n=>n.remove());switch(state.page){case'travel':await scanTravel();break;case'bazaar':await scanBazaar();break;case'itemmarket':await scanItemMarket();break;case'items':await scanItems();break;case'points':scanPoints();break;case'museum':scanMuseum();break;}state.lastScan=Date.now();state.scanCount++;}catch(e){state.lastError=String(e?.message||e);console.error('['+NAME+']',e);}finally{state.busy=false;}}
    function scheduleScan(force=false){if(state.scanTimer)clearTimeout(state.scanTimer);state.scanTimer=setTimeout(()=>{state.scanTimer=null;scan(force);},450);}

    function toggle(key,label){return '<label class="sl-mi-toggle"><input id="sl-mi-'+key+'" type="checkbox" '+(settings[key]?'checked':'')+'><span>'+esc(label)+'</span></label>';}
    function openSettings(){
        document.getElementById('sl-mi-overlay')?.remove();const overlay=document.createElement('div');overlay.id='sl-mi-overlay';overlay.innerHTML='<div id="sl-mi-panel"><div class="sl-mi-head"><div><div class="sl-mi-title">☠︎ SakaLuX Market Intelligence</div><div class="sl-mi-sub">v'+VERSION+' · '+esc(state.apiMode||'API idle')+' · page: '+esc(state.page||detectPage())+'</div></div><button id="sl-mi-close">×</button></div>'+toggle('enabled','Enable Market Intelligence')+toggle('travel','Travel profit intelligence')+toggle('bestRun','Best Travel Run board')+toggle('stockEta','Stock + restock ETA')+toggle('bazaar','Bazaar deal detection')+toggle('itemMarket','Item Market + local watchlist')+toggle('items','Inventory market estimates')+toggle('museum','Museum intelligence')+toggle('points','Points Market rate capture')+'<label class="sl-mi-field">Travel slots<input id="sl-mi-slots" type="number" min="1" max="100" value="'+esc(settings.travelSlots)+'"></label><label class="sl-mi-field">Flight multiplier<input id="sl-mi-flight" type="number" min="0.1" max="1" step="0.01" value="'+esc(settings.flightMultiplier)+'"></label><label class="sl-mi-field">Market fee %<input id="sl-mi-fee" type="number" min="0" max="100" step="0.1" value="'+esc(settings.marketFeePct)+'"></label><label class="sl-mi-field">Minimum highlighted profit<input id="sl-mi-min-profit" inputmode="numeric" value="'+esc(settings.minProfit)+'"></label>'+(!getApiKey()?'<label class="sl-mi-field">Manual Torn API key<input id="sl-mi-api" type="password" placeholder="Public/limited key"></label>':'')+'<div class="sl-mi-info">Watchlist: <b>'+Object.keys(watchlist).length+'</b> · Cached market: <b>'+Object.keys(marketCache).length+'</b> · Stock histories: <b>'+Object.keys(stockHistory).length+'</b></div><button class="sl-mi-primary" id="sl-mi-save">SAVE</button><button class="sl-mi-secondary" id="sl-mi-refresh">REFRESH PAGE DATA</button><button class="sl-mi-secondary" id="sl-mi-hard">HARD REFRESH MARKET CACHE</button></div>';document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};overlay.querySelector('#sl-mi-close').onclick=()=>overlay.remove();overlay.querySelector('#sl-mi-save').onclick=()=>{for(const k of['enabled','travel','bestRun','stockEta','bazaar','itemMarket','items','museum','points'])settings[k]=!!overlay.querySelector('#sl-mi-'+k)?.checked;settings.travelSlots=Math.max(1,Number(overlay.querySelector('#sl-mi-slots').value)||29);settings.flightMultiplier=Math.max(.1,Number(overlay.querySelector('#sl-mi-flight').value)||1);settings.marketFeePct=Number(overlay.querySelector('#sl-mi-fee').value)||0;settings.minProfit=parseMoney(overlay.querySelector('#sl-mi-min-profit').value)||0;const api=overlay.querySelector('#sl-mi-api')?.value.trim();if(api)saveApiKey(api);saveJson(STORAGE.settings,settings);overlay.remove();scheduleScan(true);};overlay.querySelector('#sl-mi-refresh').onclick=()=>{overlay.remove();scheduleScan(true);};overlay.querySelector('#sl-mi-hard').onclick=()=>{marketCache={};saveJson(STORAGE.marketCache,marketCache);overlay.remove();scheduleScan(true);};
    }

    function injectCss(){if(document.getElementById('sl-mi-style'))return;const s=document.createElement('style');s.id='sl-mi-style';s.textContent=`
.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run{box-sizing:border-box;margin:4px 0;padding:6px 8px;border-radius:6px;background:#15191f;border:1px solid #2c333d;color:#d7dce5;font:700 10px/1.4 Arial,sans-serif}
.sl-mi-travel strong,.sl-mi-bazaar.good,.sl-mi-bazaar.good strong,#sl-mi-market-bar strong,#sl-mi-points-bar strong,#sl-mi-museum-bar strong,#sl-mi-best-run strong{color:#78d98b}.sl-mi-travel.loss,.sl-mi-bazaar.bad,.sl-mi-bazaar.bad strong{color:#e06c6c}
#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run{margin:8px auto 10px;max-width:1100px;border-left:3px solid #d7b94c;font-size:11px}#sl-mi-market-bar.hit{border-left-color:#78d98b;background:#152219}
.sl-mi-br-head{display:flex;align-items:center;gap:8px;cursor:pointer}.sl-mi-br-title{color:#d7b94c;font-weight:900;letter-spacing:.08em}.sl-mi-br-head strong{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-mi-br-head button{border:0;background:transparent;color:#d7b94c;font-size:14px}.sl-mi-br-body{display:none;margin-top:7px;gap:4px}.open .sl-mi-br-body{display:flex;flex-direction:column}.sl-mi-br-row{display:grid;grid-template-columns:minmax(0,1.4fr) auto auto auto auto auto;gap:8px;align-items:center;padding:5px 6px;border:1px solid #292f38;border-radius:5px;font-size:10px}.sl-mi-br-row .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-mi-br-row .eta{color:#d7b94c}
.sl-mi-watch-row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}.sl-mi-watch-row input{flex:1 1 140px;background:#0d0f14;color:#fff;border:1px solid #363e49;border-radius:6px;padding:8px}.sl-mi-watch-row button{border:0;border-radius:6px;padding:7px 9px;background:#303844;color:#fff;font-weight:900;font-size:10px}
#sl-mi-button{position:fixed;right:10px;bottom:106px;z-index:2147483644;border:0;border-radius:999px;padding:9px 11px;background:#18181b;color:#fff;box-shadow:0 5px 18px rgba(0,0,0,.42);font-weight:900;font-size:12px}
#sl-mi-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.78);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}#sl-mi-panel{width:min(560px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0}.sl-mi-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.sl-mi-title{font-size:16px;font-weight:900}.sl-mi-sub{margin-top:3px;color:#8e96a3;font-size:9px}#sl-mi-close{width:36px;height:36px;border:0;border-radius:9px;background:#272d35;color:#fff;font-size:20px}.sl-mi-toggle,.sl-mi-field{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}.sl-mi-field input{width:45%;box-sizing:border-box;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:7px;padding:7px}.sl-mi-info{margin:10px 0;color:#a6adb8;font-size:10px}.sl-mi-primary,.sl-mi-secondary{width:100%;min-height:40px;margin-top:7px;border:0;border-radius:9px;color:#fff;font-weight:900}.sl-mi-primary{background:#2563eb}.sl-mi-secondary{background:#374151}.muted{color:#7e8793}
@media(max-width:700px){.sl-mi-br-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-br-row .eta{grid-column:1/-1}}@media(min-width:700px){#sl-mi-overlay{align-items:center}#sl-mi-panel{border-radius:18px}}
`;document.head.appendChild(s);}

    function createButton(){if(!settings.showButton||document.getElementById('sl-mi-button'))return;const b=document.createElement('button');b.id='sl-mi-button';b.textContent='☠︎ Market';b.onclick=openSettings;document.body.appendChild(b);}
    function maybePromptHub(){if(window.SakaLuXScriptHub)return;let last=0;try{last=Number(localStorage.getItem(HUB_PROMPT_STORAGE)||0);}catch(_){}if(Date.now()-last<HUB_PROMPT_INTERVAL)return;setTimeout(()=>{if(window.SakaLuXScriptHub||document.getElementById('sl-mi-hub-prompt'))return;const box=document.createElement('div');box.id='sl-mi-hub-prompt';box.style.cssText='position:fixed;left:10px;right:10px;bottom:20px;z-index:2147483647;max-width:520px;margin:auto;background:#11161d;color:#fff;border:1px solid #39414c;border-radius:12px;padding:12px;font:12px Arial;box-shadow:0 8px 30px rgba(0,0,0,.55)';box.innerHTML='<b>☠︎ SakaLuX Script Hub</b><div style="margin:6px 0;color:#b8bec7">Install the Hub to manage Market Intelligence and the other SakaLuX add-ons from one place.</div><div style="display:flex;gap:7px"><button id="sl-mi-hub-install" style="flex:1;padding:9px;border:0;border-radius:7px;background:#2563eb;color:white;font-weight:900">INSTALL HUB</button><button id="sl-mi-hub-later" style="flex:1;padding:9px;border:0;border-radius:7px;background:#353c46;color:white;font-weight:900">NOT NOW</button></div>';document.body.appendChild(box);box.querySelector('#sl-mi-hub-install').onclick=()=>{location.href=HUB_INSTALL_URL;};box.querySelector('#sl-mi-hub-later').onclick=()=>{try{localStorage.setItem(HUB_PROMPT_STORAGE,String(Date.now()));}catch(_){}box.remove();};},1800);}
    function startObserver(){if(state.observer)return;state.observer=new MutationObserver(muts=>{if(muts.some(m=>m.addedNodes?.length))scheduleScan(false);});state.observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>scheduleScan(true));}

    window.SakaLuXMarketIntelligence={id:'market-intelligence',name:'Market Intelligence',version:VERSION,open(){openSettings();return true;},async refresh(){await scan(true);return true;},async hardRefresh(){marketCache={};saveJson(STORAGE.marketCache,marketCache);await scan(true);return true;},health(){return{ready:true,version:VERSION,page:state.page||detectPage(),apiMode:state.apiMode,hasApiKey:Boolean(getApiKey()),busy:state.busy,lastScan:state.lastScan,lastError:state.lastError,scanCount:state.scanCount,marketRequests:state.marketRequests,decorated:state.decorated,bestRunRows:state.bestRunRows,stockEtaLearned:state.stockEtaLearned,stockHistories:Object.keys(stockHistory).length,watchlistItems:Object.keys(watchlist).length,cachedMarketItems:Object.keys(marketCache).length};},goToTravel(){location.href='https://www.torn.com/page.php?sid=travel';return true;},goToBestRun(){location.href='https://www.torn.com/page.php?sid=travel';return true;},goToMarket(){location.href='https://www.torn.com/page.php?sid=ItemMarket';return true;},goToBazaar(){location.href='https://www.torn.com/bazaar.php';return true;}};
    window.dispatchEvent(new CustomEvent('SakaLuX:MarketIntelligenceReady',{detail:{version:VERSION}}));

    function init(){injectCss();createButton();startObserver();maybePromptHub();scheduleScan(true);console.log('['+NAME+' v'+VERSION+'] Loaded.');}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
