from pathlib import Path
import json

p=Path('SakaLuX-Market-Intelligence.user.js')
s=p.read_text()
s=s.replace('// @version      1.16.2','// @version      1.16.3',1)
s=s.replace("const VERSION = '1.16.2';","const VERSION = '1.16.3';",1)
s=s.replace('const PRICE_NETWORK_BATCH = 25;','const PRICE_NETWORK_BATCH = 25;\n    const CASH_CACHE_MS = 30 * 1000;',1)
s=s.replace("networkBusy: false, networkQueued: networkQueue.length, networkSent: 0, networkLastFlush: 0, networkLastError: '', networkSamples: 0, networkMedian: 0, networkLastConsensusAt: 0","networkBusy: false, networkQueued: networkQueue.length, networkSent: 0, networkLastFlush: 0, networkLastError: '', networkSamples: 0, networkMedian: 0, networkLastConsensusAt: 0,\n        availableCash: null, availableCashAt: 0",1)
anchor="    function saveApiKey(key) { try { localStorage.setItem(STORAGE.apiKey,key); state.apiMode='Manual'; } catch (_) {} }\n"
insert="""    function saveApiKey(key) { try { localStorage.setItem(STORAGE.apiKey,key); state.apiMode='Manual'; } catch (_) {} }\n\n    async function fetchAvailableCash(force=false) {\n        const now=Date.now();\n        if(!force&&Number.isFinite(state.availableCash)&&now-state.availableCashAt<CASH_CACHE_MS)return state.availableCash;\n        const key=getApiKey();if(!key)return Number.isFinite(state.availableCash)?state.availableCash:null;\n        try{\n            const data=await requestJson('https://api.torn.com/user/?selections=money&key='+encodeURIComponent(key));\n            checkApiError(data);\n            const raw=data?.money_onhand??data?.money?.onhand??data?.money?.cash??data?.cash;\n            const cash=Number(raw);\n            if(Number.isFinite(cash)&&cash>=0){state.availableCash=Math.floor(cash);state.availableCashAt=now;return state.availableCash;}\n        }catch(_){}\n        return Number.isFinite(state.availableCash)?state.availableCash:null;\n    }\n"""
if anchor not in s: raise SystemExit('saveApiKey anchor not found')
s=s.replace(anchor,insert,1)
s=s.replace("function buildTravelBuyPlan(destination, entries, marketMap) {\n        const slots=Math.max(1,Number(settings.travelSlots)||29);\n        const configuredBudget=Math.max(0,Number(settings.travelBudget)||0);","function buildTravelBuyPlan(destination, entries, marketMap, budgetOverride=null) {\n        const slots=Math.max(1,Number(settings.travelSlots)||29);\n        const configuredBudget=Number.isFinite(Number(budgetOverride))&&Number(budgetOverride)>=0?Math.max(0,Number(budgetOverride)):Math.max(0,Number(settings.travelBudget)||0);",1)
s=s.replace('function paintCountryBestBuys(destination,entries,marketMap){','function paintCountryBestBuys(destination,entries,marketMap,availableCash=null){',1)
s=s.replace('const plan=buildTravelBuyPlan(destination,entries,marketMap);','const plan=buildTravelBuyPlan(destination,entries,marketMap,availableCash);',1)
s=s.replace("const budgetText=plan?.budget>0?(' · budget '+money(plan.budget)):' · unlimited budget';","const budgetText=Number.isFinite(Number(availableCash))?(' · cash '+money(availableCash)):(plan?.budget>0?(' · fallback budget '+money(plan.budget)):' · cash unavailable');",1)
s=s.replace("'<div class=\"sl-mi-country-note\">Shows what is best to buy here right now. Green rows are in the optimized basket; alternatives stay ranked below. Tap an item to jump to it in Torn.</div>'+","'<div class=\"sl-mi-country-note\">Shows what is best to buy here right now. The recommended basket uses your live Torn cash balance automatically; the manual Travel budget is ignored for this Best Buys panel. Green rows are recommended; alternatives stay ranked below.</div>'+",1)
s=s.replace("const destination=detectDestination();if(!destination)return;\n        document.getElementById('sl-mi-best-run')?.remove();","const destination=detectDestination();if(!destination)return;\n        document.getElementById('sl-mi-best-run')?.remove();\n        const availableCash=await fetchAvailableCash(true);",1)
s=s.replace('if(settings.countryBestBuys) paintCountryBestBuys(destination,unique,marketMap);','if(settings.countryBestBuys) paintCountryBestBuys(destination,unique,marketMap,availableCash);',1)
s=s.replace("countryBestBuysDestination:state.countryBestBuysDestination,travelSessionCount:","countryBestBuysDestination:state.countryBestBuysDestination,availableCash:state.availableCash,availableCashAt:state.availableCashAt,travelSessionCount:",1)
p.write_text(s)

# scripts.json
jp=Path('scripts.json')
data=json.loads(jp.read_text())
for x in data.get('scripts',[]):
    if x.get('id')=='market-intelligence':
        x['version']='1.16.3'
        x['description']='Torn PDA-first market/travel intelligence with automatic live-cash Best Buys, stable Travel/Bazaar panels, Price Network, Bazaar Flip and travel basket tools.'
jp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

# UPDATE-INFO.md
up=Path('UPDATE-INFO.md')
u=up.read_text()
u=u.replace('SakaLuX Market Intelligence: **v1.16.2**','SakaLuX Market Intelligence: **v1.16.3**',1)
entry="""### SakaLuX Market Intelligence v1.16.3\n- In-country **BEST BUYS** now reads the player's current Torn on-hand cash automatically through the existing API key.\n- The manual Travel budget setting is ignored for the in-country Best Buys calculation.\n- Added a 30-second cash cache and exposes `availableCash` / `availableCashAt` in `health()`.\n- Best Buys labels the live cash used for the recommendation and falls back gracefully if cash cannot be read.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.2.user.js`.\n\n"""
anchor='## Latest changes\n\n'
if entry not in u:u=u.replace(anchor,anchor+entry,1)
up.write_text(u)

# greasyfork info
mp=Path('greasyfork/Market-Intelligence.md')
m=mp.read_text()
m=m.replace('**Current version: v1.16.2**','**Current version: v1.16.3**',1)
entry2="""## v1.16.3\n\n- **BEST BUYS** now checks your current Torn on-hand cash automatically and uses it as the basket budget.\n- The manually configured Travel budget no longer controls the in-country Best Buys panel.\n- Cash is cached briefly to avoid unnecessary API calls and refreshed when the landed Best Buys scan runs.\n- The panel shows the live cash amount used for the calculation.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.2.user.js`.\n\n"""
if entry2 not in m:
    pos=m.find('\n## v1.16.2')
    if pos!=-1:m=m[:pos+1]+entry2+m[pos+1:]
    else:m += '\n'+entry2
mp.write_text(m)
