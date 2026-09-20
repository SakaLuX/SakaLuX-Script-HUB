#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.8.md'
s=P.read_text()
s=s.replace('// @version      1.1.7','// @version      1.1.8',1)
s=s.replace("|| '1.1.7';","|| '1.1.8';",1)

# Root cause of the recurring blank accordion / SAVE issue: bulk mode should not
# open Torn's manage accordions at all. Torn already keeps each row's price input
# mounted in the DOM while collapsed (the original Quick Pricer relies on this).
# Opening/closing rows adds React rerenders and can target the wrong visual control.
start=s.index('    async function updateAllManagePrices() {')
end=s.index('\n    // =====================================================================\n    // FLOATING DRAG CHIP', start)
new_func=r'''    async function updateAllManagePrices() {
        const updateButton=chipFillBtn;
        if(updateButton){updateButton.disabled=true;updateButton.style.opacity='0.5';updateButton.textContent='Loading…';}
        const restoreButton=()=>{if(updateButton){updateButton.disabled=false;updateButton.style.opacity='1';updateButton.textContent='Update All';}};

        const items=getManageItems();
        if(items.length===0){restoreButton();qpToast('No items found to update!','error');return;}
        const moreBelow=mayHaveUnloadedItems(items);
        let skippedRw=0,skippedBonus=0,skippedDollar=0,updated=0,failed=0,done=0;
        const work=[];
        const seenIds=new Set();

        // IMPORTANT: do not expand/collapse any Torn rows here. The manage price
        // editor is already mounted in the row DOM even while the row is collapsed.
        for(const item of items){
            const image=item.querySelector('img');
            const priceDiv=item.querySelector(SELECTORS.managePriceWrap);
            if(!image||!priceDiv) continue;
            const priceInput=priceDiv.querySelector(SELECTORS.managePriceInput);
            if(!priceInput) continue;
            const itemId=getItemIdFromImage(image);
            if(!itemId||seenIds.has(itemId)) continue;
            seenIds.add(itemId);
            if(CONFIG.skipRwWeapons&&getRWBonusInfo(item).isRanked){skippedRw++;continue;}
            if(CONFIG.skipBonusItems&&hasAnyBonus(item)){skippedBonus++;continue;}
            const current=parseInt(String(priceInput.value||'').replace(/,/g,''),10)||0;
            if(CONFIG.skipDollarItems&&current===1){skippedDollar++;continue;}
            work.push({priceDiv,itemId,itemName:getItemName(item)});
        }

        for(const job of work){
            done++;
            if(updateButton)updateButton.textContent=`Pricing ${done}/${work.length}`;
            const result=await updateManageItemPrice(job.priceDiv,job.itemId,job.itemName,{confirmLargeChange:false});
            if(result==='updated') updated++;
            else if(result==='failed') failed++;
            await new Promise(r=>setTimeout(r,90));
        }

        restoreButton();
        let msg=`Updated ${updated} of ${work.length} item price${work.length===1?'':'s'}`;
        if(skippedRw)msg+=` — ${skippedRw} RW skipped`;
        if(skippedBonus)msg+=` — ${skippedBonus} bonus skipped`;
        if(skippedDollar)msg+=` — ${skippedDollar} $1 skipped`;
        if(failed)msg+=` — ${failed} failed`;
        if(moreBelow)msg+=' — scroll down to load more items, then run again';
        msg+=' — press SAVE CHANGES in Torn to commit';
        qpToast(msg,failed?'error':'success',6500);
    }
'''
s=s[:start]+new_func+s[end:]

P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.8'; e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':'1.1.8','date':'2026-09-20','notes':[
            'Reworks Manage Update All to never open or close Torn item accordions.',
            'Bulk repricing writes directly to the already-mounted hidden price inputs used by Torn, matching the original Quick Pricer architecture.',
            'Removes the source of the giant blank detail panel and avoids accordion rerenders while preserving native React input events for SAVE CHANGES.'
        ]}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text(); block='''## v1.1.8 — 2026-09-20\n- Rebuilt **Update All** so it does **not open or close any Manage item row**.\n- Torn keeps the manage price input mounted in the DOM while collapsed; bulk mode now updates that hidden/native input directly, as the original Quick Pricer does.\n- This removes the recurring giant blank details panel and avoids row/accordion React rerenders.\n- Native input/change events remain in place so Torn can enable **SAVE CHANGES**.\n\n'''
    if '## v1.1.8 — 2026-09-20' not in t:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)
if DOC.exists():
    t=DOC.read_text();
    if '### v1.1.8 — Hidden-editor bulk pricing' not in t:t+='''\n\n### v1.1.8 — Hidden-editor bulk pricing\nManage **Update All** no longer interacts with Torn accordions. It updates each row's already-mounted price input directly while the row remains collapsed, preventing details-panel gaps and reducing React rerenders.\n'''
    DOC.write_text(t)
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.8\n\nRelease date: **2026-09-20**\n\n## Manage Update All architecture fix\nThe previous builds tried to open every Manage row, edit its price, then close it again. On TornPDA that could open the item-details panel instead of the price accordion and leave a large blank area.\n\nv1.1.8 removes that interaction completely. Torn already mounts the Manage price input in the collapsed row DOM, so Update All writes directly to that input without expanding anything.\n\n- No automatic row opening.\n- No automatic row closing.\n- No eye/details control interaction.\n- Native React-aware input events are still dispatched.\n- SAVE CHANGES remains a manual user confirmation.\n''')
print('v1.1.8 hidden-editor bulk fix applied')