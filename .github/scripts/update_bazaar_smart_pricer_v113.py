#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.3.md'
s=P.read_text()

s=s.replace('// @version      1.1.2','// @version      1.1.3',1)
s=s.replace("|| '1.1.2';","|| '1.1.3';",1)

# Market lookup must never hold the queue forever, and support both old/new Torn v2 response shapes.
old='''                        GM_xmlhttpRequest({\n                            method:'GET',\n                            url:`https://api.torn.com/v2/market/${itemId}/itemmarket?key=${CONFIG.apiKey}`,\n                            timeout:REQUEST_TIMEOUT_MS,\n                            onload:r=>{\n                                let lowestMarketPrice=0;\n                                try{\n                                    const md=JSON.parse(r.responseText);\n                                    if(!md.error && Array.isArray(md.itemmarket) && md.itemmarket.length){\n                                        lowestMarketPrice=md.itemmarket.reduce((best,o)=>{const c=Number(o.cost)||0;return c>0&&(!best||c<best)?c:best;},0);\n                                    }\n                                }catch{}\n                                cachePrice(itemId,marketValue,buyPrice,sellPrice,lowestMarketPrice);\n                                finishRequest(itemId,{marketValue,buyPrice,sellPrice,lowestMarketPrice});\n                                releaseAndContinue(REQUEST_SPACING_MS);\n                            },\n                            onerror:()=>{cachePrice(itemId,marketValue,buyPrice,sellPrice,0);finishRequest(itemId,{marketValue,buyPrice,sellPrice,lowestMarketPrice:0});releaseAndContinue(REQUEST_SPACING_MS);},\n                            ontimeout:()=>{cachePrice(itemId,marketValue,buyPrice,sellPrice,0);finishRequest(itemId,{marketValue,buyPrice,sellPrice,lowestMarketPrice:0});releaseAndContinue(REQUEST_SPACING_MS);}\n                        });'''
new='''                        let marketSettled=false;\n                        let marketWatchdog=null;\n                        const finishMarket=(lowestMarketPrice=0)=>{\n                            if(marketSettled)return;\n                            marketSettled=true;\n                            if(marketWatchdog)clearTimeout(marketWatchdog);\n                            cachePrice(itemId,marketValue,buyPrice,sellPrice,lowestMarketPrice);\n                            finishRequest(itemId,{marketValue,buyPrice,sellPrice,lowestMarketPrice});\n                            releaseAndContinue(REQUEST_SPACING_MS);\n                        };\n                        marketWatchdog=setTimeout(()=>finishMarket(0),6500);\n                        GM_xmlhttpRequest({\n                            method:'GET',\n                            url:`https://api.torn.com/v2/market/${itemId}/itemmarket?key=${CONFIG.apiKey}`,\n                            timeout:6000,\n                            onload:r=>{\n                                let lowestMarketPrice=0;\n                                try{\n                                    const md=JSON.parse(r.responseText);\n                                    if(!md.error){\n                                        // Torn v2 has existed in two shapes:\n                                        // legacy: itemmarket:[{cost,...}]\n                                        // current: itemmarket:{listings:[{price,...}]}\n                                        const rows=Array.isArray(md.itemmarket)\n                                            ? md.itemmarket\n                                            : (Array.isArray(md.itemmarket?.listings)?md.itemmarket.listings:[]);\n                                        lowestMarketPrice=rows.reduce((best,o)=>{\n                                            const c=Number(o?.cost ?? o?.price) || 0;\n                                            return c>0&&(!best||c<best)?c:best;\n                                        },0);\n                                    }\n                                }catch(e){ log('Item Market parse fallback',e); }\n                                finishMarket(lowestMarketPrice);\n                            },\n                            onerror:()=>finishMarket(0),\n                            ontimeout:()=>finishMarket(0),\n                            onabort:()=>finishMarket(0)\n                        });'''
if old not in s: raise SystemExit('v1.1.2 market block anchor missing')
s=s.replace(old,new,1)

# Bulk Update All must not wait on per-item confirmation dialogs.
s=s.replace("    function updateManageItemPrice(priceDiv, itemId, itemName) {","    function updateManageItemPrice(priceDiv, itemId, itemName, { confirmLargeChange = true } = {}) {",1)
s=s.replace("                if (percentDiff > CONFIG.priceDiffThreshold && currentPrice > 0) {","                if (confirmLargeChange && percentDiff > CONFIG.priceDiffThreshold && currentPrice > 0) {",1)
s=s.replace("            const result=await updateManageItemPrice(editor.priceDiv,job.itemId,job.itemName);","            const result=await updateManageItemPrice(editor.priceDiv,job.itemId,job.itemName,{confirmLargeChange:false});",1)

# Better progress text makes long batches obvious instead of looking frozen.
s=s.replace("if(updateButton)updateButton.textContent=`Updating ${done}/${work.length}`;","if(updateButton)updateButton.textContent=`Pricing ${done}/${work.length}`;",1)

P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.3'
        e['detailsRevision']=int(e.get('detailsRevision',8))+1
        e['release']={
          'version':'1.1.3','date':'2026-09-20','notes':[
            'Fixes Update All getting stuck on an item by adding a hard watchdog around live Item Market requests.',
            'Supports both Torn Item Market v2 response shapes: itemmarket array/cost and itemmarket.listings/price.',
            'Bulk Update All no longer pauses for per-item large-price confirmation dialogs; individual manual updates still keep the warning.',
            'Keeps the Torn City buy_price floor introduced in v1.1.2.'
          ]
        }
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text()
    block='''## v1.1.3 — 2026-09-20\n- Fixed **Update All** freezing/stalling on an item. Live Item Market lookups now have a 6.5s watchdog and always release the queue.\n- Supports both Torn v2 Item Market response formats (`itemmarket[]/cost` and `itemmarket.listings[]/price`).\n- Bulk **Update All** no longer waits for a hidden per-item large-price confirmation; manual single-item updates still keep that safety prompt.\n- Torn City `buy_price` floor remains enforced.\n\n'''
    CHANGE.write_text(t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1))
if DOC.exists():
    DOC.write_text(DOC.read_text()+'''\n\n### v1.1.3 — Update All stall fix\nBulk repricing can no longer be held indefinitely by an Item Market request. The parser supports both known Torn v2 response shapes and falls back safely to `market_value` after the watchdog timeout. Bulk mode also suppresses per-item confirmation dialogs while keeping the Torn City shop floor.\n''')
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.3\n\nRelease date: **2026-09-20**\n\n## Fixes\n- Update All cannot stay indefinitely on `Pricing 1/N`; Item Market requests have a hard watchdog.\n- Supports both known Torn v2 Item Market payloads.\n- Bulk mode does not pause for per-item big-change confirmation dialogs.\n- Individual item repricing still shows the large-change safety prompt.\n- Torn City `buy_price` remains the minimum allowed price when shop-floor enforcement is enabled.\n''')
print('v1.1.3 stall fix applied')
