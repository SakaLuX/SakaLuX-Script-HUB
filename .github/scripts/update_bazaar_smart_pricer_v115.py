#!/usr/bin/env python3
import json,re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.5.md'

s=SCRIPT.read_text()
s=s.replace('// @version      1.1.4','// @version      1.1.5',1)
s=s.replace("|| '1.1.4';","|| '1.1.5';",1)

# 1) Pricing source: restore proven Quick Pricer behavior (Torn market_value),
# but keep the user's requested Torn City shop floor via buy_price.
# Remove the extra live Item Market request which was causing incorrect values
# and unnecessary delay/instability in Update All.
pat=re.compile(r"                    \} else if \(data\.items\?\.\[itemId\]\) \{.*?\n                    \} else \{",re.S)
rep='''                    } else if (data.items?.[itemId]) {\n                        const itemData = data.items[itemId];\n                        const marketValue = Number(itemData.market_value) || 0;\n                        const buyPrice = Number(itemData.buy_price) || 0;\n                        const sellPrice = Number(itemData.sell_price) || 0;\n                        cachePrice(itemId, marketValue, buyPrice, sellPrice, 0);\n                        finishRequest(itemId, { marketValue, buyPrice, sellPrice, lowestMarketPrice: 0 });\n                        releaseAndContinue(REQUEST_SPACING_MS);\n                    } else {'''
s,n=pat.subn(rep,s,count=1)
if n!=1: raise SystemExit(f'API pricing block replacement count={n}')

s=s.replace('const REQUEST_SPACING_MS = 1350;', 'const REQUEST_SPACING_MS = 650;',1)

old_calc='''    function calculateFinalPrice(marketValue, buyPrice, sellPrice, lowestMarketPrice, discount) {\n        const pct = clampDiscount(discount) / 100;\n        const multiplier = CONFIG.priceBelowMarket ? (1 - pct) : (1 + pct);\n        const referencePrice = Number(lowestMarketPrice) > 0 ? Number(lowestMarketPrice) : Number(marketValue) || 0;\n        let finalPrice = Math.round(referencePrice * multiplier);\n        const cityShopFloor = Number(buyPrice) > 0 ? Number(buyPrice) : (Number(sellPrice) || 0);\n        if (!CONFIG.disableNpcCheck && cityShopFloor > 0 && finalPrice < cityShopFloor) {\n            log(`Price ${finalPrice} below Torn City shop price ${cityShopFloor}, adjusting...`);\n            finalPrice = cityShopFloor;\n        }\n        return finalPrice;\n    }'''
new_calc='''    function calculateFinalPrice(marketValue, buyPrice, sellPrice, lowestMarketPrice, discount) {\n        const pct = clampDiscount(discount) / 100;\n        const multiplier = CONFIG.priceBelowMarket ? (1 - pct) : (1 + pct);\n        // Use Torn market_value as the canonical reference, matching the proven\n        // Quick Pricer behavior. live Item Market was removed because it can\n        // include transient/outlier listings and produced wrong bulk prices.\n        const referencePrice = Number(marketValue) || 0;\n        let finalPrice = Math.round(referencePrice * multiplier);\n        const cityShopFloor = Number(buyPrice) > 0 ? Number(buyPrice) : (Number(sellPrice) || 0);\n        if (!CONFIG.disableNpcCheck && cityShopFloor > 0 && finalPrice < cityShopFloor) {\n            log(`Price ${finalPrice} below Torn City shop price ${cityShopFloor}, adjusting...`);\n            finalPrice = cityShopFloor;\n        }\n        return finalPrice;\n    }'''
if old_calc not in s: raise SystemExit('calculateFinalPrice anchor missing')
s=s.replace(old_calc,new_calc,1)

# 2) Every-other-row bug: opening/closing one Torn row can rerender neighboring
# rows, invalidating DOM element references collected at batch start. Store only
# stable IDs/names, then re-query the live row immediately before processing it.
anchor='''    async function ensureManagePriceEditor(item) {'''
insert='''    function findLiveManageItem(itemId, itemName) {\n        const items=getManageItems();\n        for(const item of items){\n            const image=item.querySelector('img');\n            if(!image) continue;\n            if(getItemIdFromImage(image)!==itemId) continue;\n            if(itemName){\n                const n=getItemName(item);\n                if(n && n!==itemName) continue;\n            }\n            return item;\n        }\n        return null;\n    }\n\n'''
if anchor not in s: raise SystemExit('ensureManagePriceEditor anchor missing')
s=s.replace(anchor,insert+anchor,1)

pat_batch=re.compile(r"    async function updateAllManagePrices\(\) \{.*?\n    \}\n\n    // =====================================================================\n    // FLOATING DRAG CHIP",re.S)
new_batch='''    async function updateAllManagePrices() {\n        const updateButton=chipFillBtn;\n        if(updateButton){updateButton.disabled=true;updateButton.style.opacity='0.5';updateButton.textContent='Loading…';}\n        const restoreButton=()=>{if(updateButton){updateButton.disabled=false;updateButton.style.opacity='1';updateButton.textContent='Update All';}};\n        const items=getManageItems();\n        if(items.length===0){restoreButton();qpToast('No items found to update!','error');return;}\n        const moreBelow=mayHaveUnloadedItems(items);\n        let skippedRw=0,skippedBonus=0,skippedDollar=0,updated=0,failed=0,done=0;\n        const work=[];\n        const seenIds=new Set();\n        for(const item of items){\n            const image=item.querySelector('img'); if(!image)continue;\n            const itemId=getItemIdFromImage(image); if(!itemId||seenIds.has(itemId))continue;\n            seenIds.add(itemId);\n            if(CONFIG.skipRwWeapons&&getRWBonusInfo(item).isRanked){skippedRw++;continue;}\n            if(CONFIG.skipBonusItems&&hasAnyBonus(item)){skippedBonus++;continue;}\n            work.push({itemId,itemName:getItemName(item)});\n        }\n        for(const job of work){\n            done++;\n            if(updateButton)updateButton.textContent=`Opening ${done}/${work.length}`;\n            // Always reacquire the current live row; Torn may replace row nodes\n            // whenever an accordion row opens/closes.\n            const liveItem=findLiveManageItem(job.itemId,job.itemName);\n            if(!liveItem){failed++;continue;}\n            const editor=await ensureManagePriceEditor(liveItem);\n            if(!editor){failed++;continue;}\n            const input=editor.priceDiv.querySelector(SELECTORS.managePriceInput);\n            const current=input?parseInt(String(input.value||'').replace(/,/g,''),10)||0:0;\n            if(CONFIG.skipDollarItems&&current===1){\n                skippedDollar++;\n                if(editor.opened&&editor.toggle){editor.toggle.click();await new Promise(r=>setTimeout(r,180));}\n                continue;\n            }\n            if(updateButton)updateButton.textContent=`Pricing ${done}/${work.length}`;\n            const result=await updateManageItemPrice(editor.priceDiv,job.itemId,job.itemName,{confirmLargeChange:false});\n            if(result==='updated')updated++;else if(result==='failed')failed++;\n            if(editor.opened&&editor.toggle){\n                editor.toggle.click();\n                await new Promise(r=>setTimeout(r,220));\n            } else {\n                await new Promise(r=>setTimeout(r,120));\n            }\n        }\n        restoreButton();\n        let msg=`Updated ${updated} of ${work.length} item price${work.length===1?'':'s'}`;\n        if(skippedRw)msg+=` — ${skippedRw} RW skipped`;\n        if(skippedBonus)msg+=` — ${skippedBonus} bonus skipped`;\n        if(skippedDollar)msg+=` — ${skippedDollar} $1 skipped`;\n        if(failed)msg+=` — ${failed} failed`;\n        if(moreBelow)msg+=' — scroll down to load more items, then run again';\n        msg+=' — press SAVE CHANGES in Torn to commit';\n        qpToast(msg,failed?'error':'success',6500);\n    }\n\n    // =====================================================================\n    // FLOATING DRAG CHIP'''
s,n=pat_batch.subn(new_batch,s,count=1)
if n!=1: raise SystemExit(f'updateAll block replacement count={n}')

# Clear stale cached values from the live-market era after upgrade.
needle="console.log(`[SakaLuXBazaarSmartPricer] v${VERSION} Starting (PDA optimized)...`);"
add="""console.log(`[SakaLuXBazaarSmartPricer] v${VERSION} Starting (PDA optimized)...`);\n\n    if (GM_getValue('pricingModelVersion', '') !== 'market-value-city-floor-v1') {\n        GM_setValue('priceCache', {});\n        GM_setValue('pricingModelVersion', 'market-value-city-floor-v1');\n    }"""
if needle not in s: raise SystemExit('startup anchor missing')
s=s.replace(needle,add,1)

SCRIPT.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.5'
        e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':'1.1.5','date':'2026-09-20','notes':[
            'Fixes Update All skipping every second Bazaar row by re-querying each live row before opening it instead of keeping stale Torn DOM references.',
            'Removes the live Item Market listing as the automatic bulk-pricing reference; prices now use Torn market_value, matching Quick Pricer behavior.',
            'Keeps the requested Torn City shop floor: if the calculated market-value price is lower than buy_price, buy_price is used.',
            'Deduplicates manage rows by item ID and clears stale pricing cache from the previous live-market model.'
        ]}
        info=e.get('info','')
        info=re.sub(r'\\n\\nPricing source\\n.*?(?=\\n\\n|$)','',info)
        e['info']=info+'\\n\\nPricing source\\nAutomatic pricing uses Torn market_value with the configured discount/markup. If Torn City shop-floor enforcement is enabled, buy_price is the hard minimum; sell_price is only a fallback when buy_price is unavailable.'
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text()
    block='''## v1.1.5 — 2026-09-20\n- Fixed **Update All skipping every second item**. Torn rerenders accordion rows when they open/close, so the batch now stores only stable item IDs and reacquires each live DOM row before processing it.\n- Removed live Item Market listings as the automatic pricing reference because transient/outlier listings produced incorrect bulk prices.\n- Restored the proven Quick Pricer reference: **Torn `market_value`**.\n- Keeps the user-requested **Torn City shop floor**: calculated price can never fall below `buy_price` while the setting is enabled.\n- Deduplicates Manage rows by item ID and clears stale price cache on upgrade.\n\n'''
    if '## v1.1.5 — 2026-09-20' not in t:
        t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)

if DOC.exists():
    t=DOC.read_text().replace('**v1.1.1**','**v1.1.5**',1)
    if '### v1.1.5 — Manage row + pricing model fix' not in t:
        t += '''\n\n### v1.1.5 — Manage row + pricing model fix\n- Update All reacquires every live row by item ID so Torn accordion rerenders cannot make it skip alternating items.\n- Automatic price reference is Torn `market_value` again, matching the upstream Quick Pricer behavior.\n- Torn City `buy_price` remains the hard minimum when shop-floor enforcement is enabled.\n- Upgrade clears stale cache from the previous live-market pricing model.\n'''
    DOC.write_text(t)

REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.5\n\nRelease date: **2026-09-20**\n\n## Why items were skipped\nTorn can replace Bazaar row DOM nodes whenever an accordion row opens or closes. The old batch captured row elements once at startup; after one row changed, the next saved element could already be detached. v1.1.5 stores item IDs and reacquires the live row immediately before each update.\n\n## Pricing model corrected\nAutomatic bulk pricing no longer uses the cheapest live Item Market listing. It now uses Torn `market_value`, the same base behavior as Quick Pricer, then applies the configured discount/markup.\n\n## Torn City floor\nWhen enabled, the final calculated price is never lower than `buy_price`. If `buy_price` is unavailable, `sell_price` is used only as a fallback floor.\n\n## Cache\nThe previous pricing cache is cleared automatically once on upgrade so old live-market values cannot leak into the new model.\n''')

print('Bazaar Smart Pricer v1.1.5 applied')
