#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.2.md'
s=P.read_text()

s=s.replace('// @version      1.1.1','// @version      1.1.2',1)
s=s.replace("|| '1.1.1';","|| '1.1.2';",1)

# Cache now retains live market + Torn City shop price.
s=s.replace(
"    function cachePrice(itemId, marketValue, sellPrice) {\n        priceCache[itemId] = { marketValue, sellPrice, timestamp: Date.now() };",
"    function cachePrice(itemId, marketValue, buyPrice, sellPrice, lowestMarketPrice) {\n        priceCache[itemId] = { marketValue, buyPrice, sellPrice, lowestMarketPrice, timestamp: Date.now() };",1)

s=s.replace("ids.forEach(id => finishRequest(id, { marketValue: 0, sellPrice: 0 }));","ids.forEach(id => finishRequest(id, { marketValue: 0, buyPrice: 0, sellPrice: 0, lowestMarketPrice: 0 }));")
s=s.replace("finishRequest(itemId, { marketValue: 0, sellPrice: 0 });","finishRequest(itemId, { marketValue: 0, buyPrice: 0, sellPrice: 0, lowestMarketPrice: 0 });")
s=s.replace("const REQUEST_SPACING_MS = 600;", "const REQUEST_SPACING_MS = 1350;",1)

old='''                    } else if (data.items?.[itemId]) {\n                        const itemData = data.items[itemId];\n                        const marketValue = itemData.market_value || 0;\n                        const sellPrice = itemData.sell_price || 0;\n                        cachePrice(itemId, marketValue, sellPrice);\n                        finishRequest(itemId, { marketValue, sellPrice });\n                        releaseAndContinue(REQUEST_SPACING_MS);\n                    } else {'''
new='''                    } else if (data.items?.[itemId]) {\n                        const itemData = data.items[itemId];\n                        const marketValue = Number(itemData.market_value) || 0;\n                        const buyPrice = Number(itemData.buy_price) || 0;\n                        const sellPrice = Number(itemData.sell_price) || 0;\n                        // market_value is an estimate, not the current cheapest listing.\n                        // Query Item Market 2.0 and use the cheapest live offer as the pricing reference.\n                        GM_xmlhttpRequest({\n                            method:'GET',\n                            url:`https://api.torn.com/v2/market/${itemId}/itemmarket?key=${CONFIG.apiKey}`,\n                            timeout:REQUEST_TIMEOUT_MS,\n                            onload:r=>{\n                                let lowestMarketPrice=0;\n                                try{\n                                    const md=JSON.parse(r.responseText);\n                                    if(!md.error && Array.isArray(md.itemmarket) && md.itemmarket.length){\n                                        lowestMarketPrice=md.itemmarket.reduce((best,o)=>{const c=Number(o.cost)||0;return c>0&&(!best||c<best)?c:best;},0);\n                                    }\n                                }catch{}\n                                cachePrice(itemId,marketValue,buyPrice,sellPrice,lowestMarketPrice);\n                                finishRequest(itemId,{marketValue,buyPrice,sellPrice,lowestMarketPrice});\n                                releaseAndContinue(REQUEST_SPACING_MS);\n                            },\n                            onerror:()=>{cachePrice(itemId,marketValue,buyPrice,sellPrice,0);finishRequest(itemId,{marketValue,buyPrice,sellPrice,lowestMarketPrice:0});releaseAndContinue(REQUEST_SPACING_MS);},\n                            ontimeout:()=>{cachePrice(itemId,marketValue,buyPrice,sellPrice,0);finishRequest(itemId,{marketValue,buyPrice,sellPrice,lowestMarketPrice:0});releaseAndContinue(REQUEST_SPACING_MS);}\n                        });\n                    } else {'''
if old not in s: raise SystemExit('API item block anchor missing')
s=s.replace(old,new,1)

s=s.replace("callback({ marketValue: cached.marketValue, sellPrice: cached.sellPrice });",
            "callback({ marketValue: cached.marketValue||0, buyPrice: cached.buyPrice||0, sellPrice: cached.sellPrice||0, lowestMarketPrice: cached.lowestMarketPrice||0 });",1)

# Replace pricing logic: live lowest Item Market reference, then hard floor at Torn City shop buy price.
pat=re.compile(r"    function calculateFinalPrice\(marketValue, sellPrice, discount\) \{.*?\n    \}",re.S)
rep='''    function calculateFinalPrice(marketValue, buyPrice, sellPrice, lowestMarketPrice, discount) {\n        const pct = clampDiscount(discount) / 100;\n        const multiplier = CONFIG.priceBelowMarket ? (1 - pct) : (1 + pct);\n        const referencePrice = Number(lowestMarketPrice) > 0 ? Number(lowestMarketPrice) : Number(marketValue) || 0;\n        let finalPrice = Math.round(referencePrice * multiplier);\n        // Torn City rule: never list below the price Torn itself charges in a city shop.\n        // buy_price is the city-shop purchase price; sell_price is only a fallback for items without buy_price.\n        const cityShopFloor = Number(buyPrice) > 0 ? Number(buyPrice) : (Number(sellPrice) || 0);\n        if (!CONFIG.disableNpcCheck && cityShopFloor > 0 && finalPrice < cityShopFloor) {\n            log(`Price ${finalPrice} below Torn City shop price ${cityShopFloor}, adjusting...`);\n            finalPrice = cityShopFloor;\n        }\n        return finalPrice;\n    }'''
s,n=pat.subn(rep,s,count=1)
if n!=1: raise SystemExit('calculateFinalPrice not replaced')

s=s.replace("fetchItemData(itemId, ({ marketValue, sellPrice }) => {","fetchItemData(itemId, ({ marketValue, buyPrice, sellPrice, lowestMarketPrice }) => {")
s=s.replace("calculateFinalPrice(marketValue, sellPrice, CONFIG.defaultDiscount)","calculateFinalPrice(marketValue, buyPrice, sellPrice, lowestMarketPrice, CONFIG.defaultDiscount)")
s=s.replace("const borderColor = (sellPrice > 0 && newPrice === sellPrice) ? '#f0a35e' : '#4f8fe8';",
            "const cityFloor=(buyPrice>0?buyPrice:sellPrice); const borderColor = (cityFloor > 0 && newPrice === cityFloor) ? '#f0a35e' : '#4f8fe8';",1)

# Settings copy: make the rule explicit.
s=s.replace('NPC floor enforcement','Torn City shop floor')
s=s.replace('Never price below the NPC sell price','Never price below Torn City shop buy price')

# Docs/registry/release.
P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.2'; e['detailsRevision']=int(e.get('detailsRevision',7))+1
        e['release']={'version':'1.1.2','date':'2026-09-20','notes':[
          'Fixes Update All pricing source: uses the cheapest live Item Market 2.0 offer instead of relying only on Torn market_value.',
          'Adds Torn City shop floor enforcement using buy_price; calculated prices below the city-shop price are raised to that shop price.',
          'Keeps market_value as fallback if live Item Market data is unavailable and sell_price as fallback only when buy_price is unavailable.',
          'Slows the per-item request cadence to account for the extra live-market request and stay within Torn API rate limits.'
        ]
        e['info']=e.get('info','')+'\\n\\nPricing source\\nPrices use the cheapest live Item Market offer when available. Torn market_value is fallback only. Torn City buy price is a hard floor when shop-floor enforcement is enabled.'
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text(); block='''## v1.1.2 — 2026-09-20\n- Fixed **Update All** price source: it now uses the cheapest live Item Market 2.0 listing when available, instead of treating `market_value` as the live price.\n- Added **Torn City shop floor**: if the calculated price is below `buy_price`, the city-shop price wins.\n- `market_value` remains fallback; `sell_price` is only a secondary floor when no city buy price exists.\n- Adjusted request pacing for the extra live-market request.\n\n'''; CHANGE.write_text(t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1))
if DOC.exists(): DOC.write_text(DOC.read_text()+'''\n\n### v1.1.2 — Live market + Torn City floor\nUpdate All and Quick Add now calculate from the cheapest live Item Market offer when available. If that result is lower than the Torn City shop buy price, the shop price is used as the floor.\n''')
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.2\n\nRelease date: **2026-09-20**\n\n## Pricing fix\nThe previous build used Torn `market_value` as the main pricing reference. That is an estimate and can differ from current market listings. v1.1.2 queries Item Market 2.0 and uses the cheapest live offer when available.\n\n## Torn City floor\nWhen shop-floor enforcement is enabled, a calculated price can never be lower than Torn `buy_price` (the city-shop purchase price). `sell_price` is only a fallback when no `buy_price` exists.\n\n## Fallbacks\n1. Cheapest live Item Market offer.\n2. Torn `market_value` if live market lookup fails.\n3. City-shop floor uses `buy_price`, falling back to `sell_price`.\n''')
print('v1.1.2 pricing fix applied')
