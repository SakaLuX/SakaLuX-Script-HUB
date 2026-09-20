#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.6.md'
s=P.read_text()

s=s.replace('// @version      1.1.5','// @version      1.1.6',1)
s=s.replace("|| '1.1.5';","|| '1.1.6';",1)

# React-controlled inputs need the native setter, not direct .value assignment.
anchor="    function clearItemInputs(itemElement) {\n"
helper="""    function setNativeInputValue(input, value) {\n        if (!input) return;\n        const proto = Object.getPrototypeOf(input);\n        const desc = proto && Object.getOwnPropertyDescriptor(proto, 'value');\n        if (desc && typeof desc.set === 'function') desc.set.call(input, String(value));\n        else input.value = String(value);\n        input.dispatchEvent(new Event('input', { bubbles: true }));\n        input.dispatchEvent(new Event('change', { bubbles: true }));\n    }\n\n"""
if 'function setNativeInputValue(' not in s:
    if anchor not in s: raise SystemExit('clearItemInputs anchor missing')
    s=s.replace(anchor,helper+anchor,1)

# Make all pricing writes React-aware.
s=s.replace("                        input.value = finalPrice;\n                        input.dispatchEvent(new Event('input', { bubbles: true }));",
            "                        setNativeInputValue(input, finalPrice);",1)
s=s.replace("                priceInput.value = newPrice;\n                priceInput.dispatchEvent(new Event('input', { bubbles: true }));\n                priceInput.dispatchEvent(new Event('change', { bubbles: true }));",
            "                setNativeInputValue(priceInput, newPrice);",1)

# Fresh toggle lookup after Torn re-renders the row. The old element reference is
# stale after pricing and caused a large blank expanded panel to remain on screen.
anchor2="    async function updateAllManagePrices() {\n"
close_helper="""    function findManageToggle(item) {\n        if (!item) return null;\n        const controls=[...item.querySelectorAll('button,[role=\"button\"],a')];\n        let toggle=controls.find(el=>/expand|edit|details|open|collapse|close/i.test((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')));\n        if (!toggle) toggle=item.querySelector('[class*=\"arrow\"],[class*=\"chevron\"],[class*=\"expand\"]');\n        if (!toggle && controls.length) toggle=controls[controls.length-1];\n        return toggle;\n    }\n\n    async function closeManagePriceEditor(itemId, itemName) {\n        const live=findLiveManageItem(itemId,itemName);\n        if(!live) return;\n        const toggle=findManageToggle(live);\n        if(!toggle) return;\n        const container=findSectionContainer(h => h.textContent.includes('Manage your Bazaar') || h.textContent.includes('Manage items') || h.textContent.includes('Manage Bazaar')) || live.parentElement;\n        const before=container ? container.querySelectorAll(SELECTORS.managePriceInput).length : 0;\n        toggle.click();\n        for(let i=0;i<16;i++){\n            await new Promise(r=>setTimeout(r,75));\n            const now=container ? container.querySelectorAll(SELECTORS.managePriceInput).length : 0;\n            if(now<before) break;\n        }\n    }\n\n"""
if 'async function closeManagePriceEditor(' not in s:
    if anchor2 not in s: raise SystemExit('updateAllManagePrices anchor missing')
    s=s.replace(anchor2,close_helper+anchor2,1)

# Reuse the same robust toggle helper while opening.
old_toggle="""        const controls=[...item.querySelectorAll('button,[role=\"button\"],a')];\n        let toggle=controls.find(el=>/expand|edit|details|open/i.test((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')));\n        if(!toggle) toggle=controls[controls.length-1] || item.querySelector('[class*=\"arrow\"],[class*=\"chevron\"],[class*=\"expand\"]');\n        if(!toggle) return null;\n"""
new_toggle="""        const toggle=findManageToggle(item);\n        if(!toggle) return null;\n"""
if old_toggle in s:
    s=s.replace(old_toggle,new_toggle,1)

# Never click the stale toggle reference after pricing. Reacquire the live row and
# collapse its editor only after React has accepted the value.
old_close="""            if(editor.opened&&editor.toggle){\n                editor.toggle.click();\n                await new Promise(r=>setTimeout(r,220));\n            } else {\n                await new Promise(r=>setTimeout(r,120));\n            }\n"""
new_close="""            if(editor.opened){\n                await new Promise(r=>setTimeout(r,120));\n                await closeManagePriceEditor(job.itemId,job.itemName);\n                await new Promise(r=>setTimeout(r,120));\n            } else {\n                await new Promise(r=>setTimeout(r,120));\n            }\n"""
if old_close not in s: raise SystemExit('batch close anchor missing')
s=s.replace(old_close,new_close,1)

# Same stale-toggle issue on skipped $1 rows.
old_skip="""                if(editor.opened&&editor.toggle){editor.toggle.click();await new Promise(r=>setTimeout(r,180));}\n                continue;\n"""
new_skip="""                if(editor.opened){await closeManagePriceEditor(job.itemId,job.itemName);await new Promise(r=>setTimeout(r,120));}\n                continue;\n"""
if old_skip in s: s=s.replace(old_skip,new_skip,1)

P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.6'
        e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={
          'version':'1.1.6','date':'2026-09-20','notes':[
            'Fixes Manage Bazaar SAVE CHANGES staying disabled by writing price inputs through the native input setter so Torn React state receives the change.',
            'Fixes giant blank/expanded gaps after Update All by reacquiring the live row and fresh expand/collapse control after every Torn rerender.',
            'Update All now waits for the editor to collapse before continuing to the next item.'
          ]
        }
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text()
    block='''## v1.1.6 — 2026-09-20\n- Fixed **SAVE CHANGES** remaining disabled after bulk repricing. Price fields are now changed through the native input setter so Torn/React records the edits.\n- Fixed the large blank expanded area left behind by **Update All**. Torn replaces accordion-row DOM nodes while editing, so the old toggle reference became stale; the script now reacquires the live row and fresh collapse control.\n- Waits for each editor to close before processing the next item.\n\n'''
    if '## v1.1.6 — 2026-09-20' not in t:
        t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)
if DOC.exists():
    t=DOC.read_text().replace('**v1.1.1**','**v1.1.6**',1)
    if '### v1.1.6 — Manage save-state fix' not in t:
        t+='''\n\n### v1.1.6 — Manage save-state fix\nBulk Manage pricing now writes through Torn's React-controlled input setter, enabling **SAVE CHANGES** correctly. Accordion rows are collapsed using a freshly reacquired live toggle after each rerender, preventing blank expanded gaps.\n'''
    DOC.write_text(t)
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.6\n\nRelease date: **2026-09-20**\n\n## Manage Bazaar repair\n- Uses the browser-native input value setter plus `input`/`change` events so Torn React state recognizes repriced values and enables **SAVE CHANGES**.\n- Reacquires each row after pricing before collapsing it; stale accordion controls are no longer clicked.\n- Waits for collapse completion before opening the next row, preventing the large blank panel shown on TornPDA.\n\nPricing behavior from v1.1.5 is unchanged.\n''')
print('v1.1.6 applied')
