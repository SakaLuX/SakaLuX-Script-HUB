#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.7.md'
s=P.read_text()

s=s.replace('// @version      1.1.6','// @version      1.1.7',1)
s=s.replace("|| '1.1.6';","|| '1.1.7';",1)

# Root cause of the giant blank panel: the generic fallback could select the eye
# (item-details) button instead of the far-right price-editor chevron. Use geometry
# and strict exclusions so Manage automation only touches the rightmost row toggle.
old='''    function findManageToggle(item) {
        if (!item) return null;
        const controls=[...item.querySelectorAll('button,[role="button"],a')];
        let toggle=controls.find(el=>/expand|edit|details|open|collapse|close/i.test((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')));
        if (!toggle) toggle=item.querySelector('[class*="arrow"],[class*="chevron"],[class*="expand"]');
        if (!toggle && controls.length) toggle=controls[controls.length-1];
        return toggle;
    }
'''
new='''    function findManageToggle(item) {
        if (!item) return null;
        const rowRect=item.getBoundingClientRect();
        const selectors='button,[role="button"],a,[tabindex],[class*="arrow"],[class*="chevron"],[class*="expand"],[class*="toggle"]';
        const candidates=[...item.querySelectorAll(selectors)].filter(el=>{
            const r=el.getBoundingClientRect();
            if(!r.width||!r.height) return false;
            const meta=((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')).toLowerCase();
            // Never press Torn's eye/details control; that opens the huge item-info panel.
            if(/eye|view|preview|inspect|details/.test(meta)) return false;
            // Keep candidates on the right side of the compact manage row.
            return r.left >= rowRect.left + rowRect.width*0.72;
        });
        if(!candidates.length) return null;
        // The price accordion chevron is the right-most interactive control in the row.
        candidates.sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right);
        return candidates[0]||null;
    }
'''
if old not in s: raise SystemExit('findManageToggle anchor missing')
s=s.replace(old,new,1)

# Strengthen React/Torn input-state notification: native setter + real InputEvent,
# keyboard signal and blur. This mirrors an actual edit more closely on TornPDA.
old2='''    function setNativeInputValue(input, value) {
        if (!input) return;
        const proto = Object.getPrototypeOf(input);
        const desc = proto && Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && typeof desc.set === 'function') desc.set.call(input, String(value));
        else input.value = String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
'''
new2='''    function setNativeInputValue(input, value) {
        if (!input) return;
        const next=String(value);
        try{input.focus({preventScroll:true});}catch{try{input.focus();}catch{}}
        const proto = window.HTMLInputElement?.prototype || Object.getPrototypeOf(input);
        const desc = proto && Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && typeof desc.set === 'function') desc.set.call(input, next);
        else input.value = next;
        try{input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:next}));}
        catch{input.dispatchEvent(new Event('input',{bubbles:true}));}
        input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'0',code:'Digit0'}));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        try{input.blur();}catch{}
    }
'''
if old2 not in s: raise SystemExit('setNativeInputValue anchor missing')
s=s.replace(old2,new2,1)

# Do not attempt to collapse an editor unless the live row still has the price input.
# This prevents toggling a different control after Torn has already auto-collapsed/re-rendered.
old3='''    async function closeManagePriceEditor(itemId, itemName) {
        const live=findLiveManageItem(itemId,itemName);
        if(!live) return;
        const toggle=findManageToggle(live);
        if(!toggle) return;
        const container=findSectionContainer(h => h.textContent.includes('Manage your Bazaar') || h.textContent.includes('Manage items') || h.textContent.includes('Manage Bazaar')) || live.parentElement;
        const before=container ? container.querySelectorAll(SELECTORS.managePriceInput).length : 0;
        toggle.click();
        for(let i=0;i<16;i++){
            await new Promise(r=>setTimeout(r,75));
            const now=container ? container.querySelectorAll(SELECTORS.managePriceInput).length : 0;
            if(now<before) break;
        }
    }
'''
new3='''    async function closeManagePriceEditor(itemId, itemName) {
        const live=findLiveManageItem(itemId,itemName);
        if(!live) return;
        const currentInput=live.querySelector(SELECTORS.managePriceInput);
        if(!currentInput) return; // already closed by Torn
        const toggle=findManageToggle(live);
        if(!toggle) return;
        toggle.click();
        for(let i=0;i<20;i++){
            await new Promise(r=>setTimeout(r,75));
            const refreshed=findLiveManageItem(itemId,itemName);
            if(!refreshed || !refreshed.querySelector(SELECTORS.managePriceInput)) break;
        }
    }
'''
if old3 not in s: raise SystemExit('closeManagePriceEditor anchor missing')
s=s.replace(old3,new3,1)

P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.7'
        e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={
          'version':'1.1.7','date':'2026-09-20','notes':[
            'Fixes the giant blank Manage Bazaar panel by preventing Update All from clicking Torn\'s eye/item-details control; only the far-right accordion toggle is selected.',
            'Makes price writes more React/TornPDA-compatible with native setter, InputEvent, keyup, change and blur.',
            'Collapse logic now checks that the live row is still expanded before clicking anything, avoiding accidental secondary toggles after rerenders.'
          ]
        }
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text()
    block='''## v1.1.7 — 2026-09-20\n- Fixed the large blank panel during **Update All**: the fallback selector could click Torn's **eye/details** control instead of the far-right price-editor chevron.\n- Manage automation now selects only the right-most interactive control on the row and explicitly excludes eye/view/details controls.\n- Price writes now send native setter + `InputEvent` + `keyup` + `change` + blur for stronger Torn/React state synchronization.\n- Collapse only runs if the live row is still actually expanded.\n\n'''
    if '## v1.1.7 — 2026-09-20' not in t:
        t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)
if DOC.exists():
    t=DOC.read_text().replace('**v1.1.6**','**v1.1.7**',1)
    if '### v1.1.7 — Manage accordion selector fix' not in t:
        t+='''\n\n### v1.1.7 — Manage accordion selector fix\nUpdate All no longer mistakes Torn's eye/details button for the price-editor arrow. It targets the far-right row toggle, verifies expansion state before collapsing, and uses a stronger React-compatible input event sequence so SAVE CHANGES can track edits reliably.\n'''
    DOC.write_text(t)
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.7\n\nRelease date: **2026-09-20**\n\n## Root cause fixed\nThe large empty panel seen during Update All was Torn's item-details area. Our fallback could select the eye/details control when it could not identify the price accordion arrow.\n\n## Fixes\n- Never selects eye/view/details controls during Manage automation.\n- Selects the far-right interactive row control as the price-editor chevron.\n- Only collapses if that item's live row still contains the price editor.\n- Uses native setter + InputEvent + keyup + change + blur so Torn/React registers edited prices more reliably.\n''')
print('v1.1.7 applied')
