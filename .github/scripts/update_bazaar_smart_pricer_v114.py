#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.4.md'

s=SCRIPT.read_text()

s=s.replace('// @version      1.1.3','// @version      1.1.4',1)
s=s.replace("|| '1.1.3';","|| '1.1.4';",1)

# Root cause of Update All hanging at Pricing 1/N:
# updateManageItemPrice destructured only marketValue and sellPrice, but then
# referenced buyPrice and lowestMarketPrice. That throws ReferenceError inside
# the async callback before resolve(), leaving the outer Promise pending forever.
bad="fetchItemData(itemId, async ({ marketValue, sellPrice }) => {"
good="fetchItemData(itemId, async ({ marketValue, buyPrice, sellPrice, lowestMarketPrice }) => {"
count=s.count(bad)
if count != 1:
    raise SystemExit(f'Expected exactly one broken manage callback, found {count}')
s=s.replace(bad,good,1)

# Make the manage path self-protecting against unexpected callback exceptions so
# a future pricing bug cannot leave Update All permanently disabled.
old="""            fetchItemData(itemId, async ({ marketValue, buyPrice, sellPrice, lowestMarketPrice }) => {\n                priceInput.disabled = false;\n                priceInput.style.opacity = '1';\n                if (marketValue <= 0) {"""
new="""            fetchItemData(itemId, async ({ marketValue, buyPrice, sellPrice, lowestMarketPrice }) => {\n                try {\n                    priceInput.disabled = false;\n                    priceInput.style.opacity = '1';\n                    if (marketValue <= 0) {"""
if old not in s:
    raise SystemExit('manage callback start anchor missing')
s=s.replace(old,new,1)

old_end="""                setTimeout(() => priceInput.style.border = '', 1000);\n                resolve('updated');\n            });\n        });\n    }\n"""
new_end="""                    setTimeout(() => priceInput.style.border = '', 1000);\n                    resolve('updated');\n                } catch (e) {\n                    console.error('[SakaLuXBazaarSmartPricer] Manage pricing failed:', e);\n                    priceInput.disabled = false;\n                    priceInput.style.opacity = '1';\n                    qpToast(`Pricing failed for ${itemName || 'this item'}`, 'error');\n                    resolve('failed');\n                }\n            });\n        });\n    }\n"""
if old_end not in s:
    raise SystemExit('manage callback end anchor missing')
s=s.replace(old_end,new_end,1)

SCRIPT.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.4'
        e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={
            'version':'1.1.4',
            'date':'2026-09-20',
            'notes':[
                'Fixes the Update All deadlock at Pricing 1/N caused by missing buyPrice and lowestMarketPrice variables in the manage pricing callback.',
                'Adds exception containment so a single item pricing error resolves as failed instead of leaving the entire batch permanently pending.',
                'Keeps live Item Market pricing and the Torn City buy_price floor introduced in v1.1.2.'
            ]
        }
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text()
    block='''## v1.1.4 — 2026-09-20\n- Fixed the **Update All** permanent hang at `Pricing 1/N`.\n- Root cause: the Manage callback used `buyPrice` and `lowestMarketPrice` without receiving them from `fetchItemData`, causing a `ReferenceError` before the Promise could resolve.\n- Added a guarded `try/catch` around Manage pricing so one bad item is counted as failed instead of freezing the complete batch.\n- Live Item Market pricing and Torn City `buy_price` floor remain unchanged.\n\n'''
    if '## v1.1.4 — 2026-09-20' not in t:
        t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)

if DOC.exists():
    t=DOC.read_text()
    if '### v1.1.4 — Update All deadlock fix' not in t:
        t += '''\n\n### v1.1.4 — Update All deadlock fix\nFixes the permanent `Pricing 1/N` hang in Manage Bazaar. The manage callback now receives all pricing fields (`marketValue`, `buyPrice`, `sellPrice`, `lowestMarketPrice`) and safely resolves failed items instead of freezing the batch.\n'''
    DOC.write_text(t)

REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.4\n\nRelease date: **2026-09-20**\n\n## Critical Update All fix\n`Update All` could remain forever on **Pricing 1/N**. The manage-pricing callback destructured only `marketValue` and `sellPrice`, while the new v1.1.2 pricing formula also referenced `buyPrice` and `lowestMarketPrice`. JavaScript therefore threw a `ReferenceError` before the Promise resolved.\n\n### Fixed\n- Manage pricing now receives all four pricing fields.\n- A per-item exception is caught and resolved as `failed`, allowing the batch to continue.\n- The button is restored when the batch completes.\n\n### Pricing rules retained\n1. Cheapest live Item Market listing when available.\n2. `market_value` as fallback.\n3. Torn City `buy_price` as the minimum floor when enabled.\n''')

print('Bazaar Smart Pricer v1.1.4 deadlock fix applied')
