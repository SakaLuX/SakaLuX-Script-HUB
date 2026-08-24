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
s=repl(s,'// @version      1.13.0','// @version      1.14.0','metadata version')
s=repl(s,
'// @description  Torn market and travel intelligence with Best Route Basket Optimizer, in-country Best Buys and an Arrival Basket Planner that prepares the optimal shopping mix before landing.',
'// @description  Torn market and travel intelligence with Best Route Basket, Arrival Basket, in-country Best Buys and smart post-landing refresh that reacts to stock changes without hammering the APIs.',
'metadata description')
s=repl(s,"const VERSION = '1.13.0';","const VERSION = '1.14.0';",'runtime version')

s=repl(s,
"    const PRICE_HISTORY_MIN_GAP = 5 * 60 * 1000;",
"    const PRICE_HISTORY_MIN_GAP = 5 * 60 * 1000;\n    const LANDED_REFRESH_MIN_MS = 12 * 1000;\n    const LANDED_MARKET_REFRESH_MS = 2 * 60 * 1000;\n    const LANDED_SIGNATURE_DEBOUNCE_MS = 1200;",
'smart refresh constants')

s=repl(s,
"        arrivalStock: true,\n        arrivalBasket: true,",
"        arrivalStock: true,\n        arrivalBasket: true,\n        smartLandedRefresh: true,",
'smart refresh setting')

s=repl(s,
"        countryBestBuysRows: 0, countryBestBuyName: '', countryBestBuyProfit: 0, countryBestBuyQty: 0, countryBestBuysDestination: ''",
"        countryBestBuysRows: 0, countryBestBuyName: '', countryBestBuyProfit: 0, countryBestBuyQty: 0, countryBestBuysDestination: '',\n        landedRefreshes: 0, landedStockRefreshes: 0, landedMarketRefreshes: 0, landedRefreshSkips: 0, landedLastRefresh: 0, landedLastMarketRefresh: 0, landedSignature: '', landedRefreshTimer: null",
'smart refresh state')

helpers=r'''

    function travelShopSignature(){
        const destination=detectDestination();if(!destination)return '';
        const parts=[];
        const seen=new Set();
        document.querySelectorAll('img[src*="/images/items/"]').forEach(img=>{
            const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))return;
            seen.add(row);
            const buy=extractFirstPrice(row),stock=extractStock(row);
            if(!(buy>0))return;
            parts.push(id+':'+Math.max(0,Number(stock)||0)+':'+Math.round(buy));
        });
        parts.sort();
        return destination+'|'+parts.join('|');
    }

    function scheduleLandedSmartRefresh(reason='mutation'){
        if(!settings.smartLandedRefresh||detectPage()!=='travel'||detectInFlight()||!detectDestination())return;
        if(state.landedRefreshTimer)clearTimeout(state.landedRefreshTimer);
        state.landedRefreshTimer=setTimeout(()=>{
            state.landedRefreshTimer=null;
            const now=Date.now(),signature=travelShopSignature();
            if(!signature)return;
            if(signature===state.landedSignature){state.landedRefreshSkips++;return;}
            if(now-state.landedLastRefresh<LANDED_REFRESH_MIN_MS){state.landedRefreshSkips++;return;}
            state.landedSignature=signature;
            state.landedLastRefresh=now;
            state.landedRefreshes++;
            state.landedStockRefreshes++;
            const marketDue=now-state.landedLastMarketRefresh>=LANDED_MARKET_REFRESH_MS;
            if(marketDue){
                state.landedLastMarketRefresh=now;
                state.landedMarketRefreshes++;
                marketCache={};saveJson(STORAGE.marketCache,marketCache);
            }
            scheduleScan(true);
        },LANDED_SIGNATURE_DEBOUNCE_MS);
    }
'''
s=repl(s,
"    function rowContainer(img) { return img.closest('tr')||img.closest('li')||img.closest('[class*=\"row\"]')||img.closest('[class*=\"Row\"]')||img.closest('[class*=\"item\"]')||img.parentElement?.parentElement||img.parentElement; }",
helpers+"\n    function rowContainer(img) { return img.closest('tr')||img.closest('li')||img.closest('[class*=\"row\"]')||img.closest('[class*=\"Row\"]')||img.closest('[class*=\"item\"]')||img.parentElement?.parentElement||img.parentElement; }",
'smart refresh helpers')

s=repl(s,
"        if(settings.countryBestBuys) paintCountryBestBuys(destination,unique,marketMap);\n        else paintTravelBuyPlan(buildTravelBuyPlan(destination,unique,marketMap));",
"        if(settings.countryBestBuys) paintCountryBestBuys(destination,unique,marketMap);\n        else paintTravelBuyPlan(buildTravelBuyPlan(destination,unique,marketMap));\n        state.landedSignature=travelShopSignature();\n        state.landedLastRefresh=Date.now();",
'capture landed signature')

old_observer="    function startObserver(){if(state.observer)return;state.observer=new MutationObserver(muts=>{const now=Date.now();const meaningful=muts.some(m=>[...m.addedNodes||[]].some(n=>{if(!(n instanceof Element))return false;if(n.id&&n.id.startsWith('sl-mi-'))return false;if(n.closest?.('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-overlay,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items'))return false;return true;}));if(!meaningful)return;if(detectPage()==='travel'&&now-state.lastObserverScan<1800){state.observerSkips++;return;}state.lastObserverScan=now;scheduleScan(false);});state.observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>scheduleScan(true));}"
new_observer="    function startObserver(){if(state.observer)return;state.observer=new MutationObserver(muts=>{const now=Date.now();const meaningful=muts.some(m=>[...m.addedNodes||[]].some(n=>{if(!(n instanceof Element))return false;if(n.id&&n.id.startsWith('sl-mi-'))return false;if(n.closest?.('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items'))return false;return true;}));if(!meaningful)return;if(detectPage()==='travel'&&detectDestination()&&!detectInFlight()){scheduleLandedSmartRefresh('mutation');return;}if(detectPage()==='travel'&&now-state.lastObserverScan<1800){state.observerSkips++;return;}state.lastObserverScan=now;scheduleScan(false);});state.observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>scheduleScan(true));}"
s=repl(s,old_observer,new_observer,'observer integration')

s=repl(s,
"+toggle('arrivalStock','Arrival-stock prediction while flying')+toggle('arrivalBasket','Arrival Basket Planner while flying')+toggle('bazaar','Bazaar deal detection')",
"+toggle('arrivalStock','Arrival-stock prediction while flying')+toggle('arrivalBasket','Arrival Basket Planner while flying')+toggle('smartLandedRefresh','Smart refresh after landing')+toggle('bazaar','Bazaar deal detection')",
'settings toggle UI')

s=repl(s,
"for(const k of['enabled','travel','bestRun','countryBestBuys','stockEta','arrivalStock','arrivalBasket','bazaar','itemMarket','items','museum','points'])settings[k]",
"for(const k of['enabled','travel','bestRun','countryBestBuys','stockEta','arrivalStock','arrivalBasket','smartLandedRefresh','bazaar','itemMarket','items','museum','points'])settings[k]",
'settings save list')

s=repl(s,
"countryBestBuysDestination:state.countryBestBuysDestination,arrivalRows:state.arrivalRows",
"countryBestBuysDestination:state.countryBestBuysDestination,landedRefreshes:state.landedRefreshes,landedStockRefreshes:state.landedStockRefreshes,landedMarketRefreshes:state.landedMarketRefreshes,landedRefreshSkips:state.landedRefreshSkips,landedLastRefresh:state.landedLastRefresh,arrivalRows:state.arrivalRows",
'health landed fields')

s=repl(s,
"        async arrivalPrediction(){if(detectPage()!=='travel'||!detectInFlight())return false;await renderArrivalStock();return true;},",
"        async arrivalPrediction(){if(detectPage()!=='travel'||!detectInFlight())return false;await renderArrivalStock();return true;},\n        smartLandedRefresh(){if(detectPage()!=='travel'||detectInFlight()||!detectDestination())return false;scheduleLandedSmartRefresh('api');return true;},",
'public api')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.14.0'
        entry['description']='Market/travel intelligence with Best Route Basket, Arrival Basket, Valigia-style in-country Best Buys and smart post-landing refresh that reacts to stock changes while throttling live market refreshes.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.13.0**','SakaLuX Market Intelligence: **v1.14.0**',1)
release='''### SakaLuX Market Intelligence v1.14.0\n- Added **Smart Auto Refresh after landing** for the foreign Travel shop.\n- Detects meaningful changes in the currently displayed shop item/stock signature instead of blindly polling on a fixed interval.\n- Debounces Torn DOM mutations and ignores SakaLuX-owned UI updates, reducing duplicate rescans on PDA/mobile.\n- Rebuilds **BEST BUYS** when the foreign shop stock changes so the recommended quantities and basket stay current.\n- Enforces a minimum 12-second landed refresh interval to avoid repeated work while Torn hydrates or rerenders the page.\n- Live Item Market data is hard-refreshed at most once every 2 minutes during landed smart refreshes; intermediate stock changes reuse cached prices.\n- Added a **Smart refresh after landing** setting.\n- Added refresh/skip counters and timestamps to `health()` plus `smartLandedRefresh()` to the public API.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.13.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.13.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.13.0**','**Current version: v1.14.0**',1)
gf_release='''## v1.14.0 — Smart Auto Refresh After Landing\n\n- Added smart post-landing refresh for foreign Travel shops.\n- Detects actual shop item/stock changes and refreshes **BEST BUYS** only when the visible shop signature changes.\n- Debounces Torn DOM mutations and ignores the script's own panels to avoid self-triggered loops.\n- Uses a 12-second minimum refresh interval for PDA-friendly behavior.\n- Item Market prices are force-refreshed at most once every 2 minutes; stock-only changes reuse the existing cache.\n- Added a Settings toggle for **Smart refresh after landing**.\n- Added landed refresh counters/timestamps to `health()` and `smartLandedRefresh()` to the public API.\n\n'''
gf=gf.replace('## v1.13.0',gf_release+'## v1.13.0',1)
gf=gf.replace('No observations are uploaded to a SakaLuX server in v1.13.0.','No observations are uploaded to a SakaLuX server in v1.14.0.',1)
GF.write_text(gf,encoding='utf-8')

# trigger update after workflow is present
