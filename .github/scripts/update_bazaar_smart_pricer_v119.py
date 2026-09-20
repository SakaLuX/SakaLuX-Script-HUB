#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.9.md'
s=P.read_text()
s=s.replace('// @version      1.1.8','// @version      1.1.9',1)
s=s.replace("|| '1.1.8';","|| '1.1.9';",1)

start=s.index('    async function updateAllManagePrices() {')
end=s.index('\n    // =====================================================================\n    // FLOATING DRAG CHIP', start)
new_block=r'''    function findManageRowArrow(item) {
        if(!item) return null;
        const rowRect=item.getBoundingClientRect();
        const headerBottom=rowRect.top+Math.min(64, Math.max(48,rowRect.height));
        const all=[...item.querySelectorAll('*')];
        const pointer=all.filter(el=>{
            const r=el.getBoundingClientRect();
            if(!r.width||!r.height) return false;
            if(r.top<rowRect.top-2 || r.top>headerBottom) return false;
            if(r.right < rowRect.right-82) return false;
            const meta=((el.getAttribute?.('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')).toLowerCase();
            if(/eye|view|preview|inspect/.test(meta)) return false;
            try{return getComputedStyle(el).cursor==='pointer';}catch{return false;}
        });
        if(pointer.length){
            pointer.sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right || a.getBoundingClientRect().width-b.getBoundingClientRect().width);
            return pointer[0];
        }
        const fallback=[...item.querySelectorAll('button,a,[role="button"],[tabindex],[class*="arrow"],[class*="chevron"]')].filter(el=>{
            const r=el.getBoundingClientRect();
            if(!r.width||!r.height||r.right<rowRect.right-82||r.top>headerBottom) return false;
            const meta=((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')).toLowerCase();
            return !/eye|view|preview|inspect/.test(meta);
        });
        fallback.sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right);
        return fallback[0]||null;
    }

    async function openManageEditorForJob(itemId,itemName){
        const live=findLiveManageItem(itemId,itemName);
        if(!live) return null;
        let input=live.querySelector(SELECTORS.managePriceInput);
        if(input) return {item:live,input,opened:false};
        const arrow=findManageRowArrow(live);
        if(!arrow) return null;
        arrow.click();
        for(let i=0;i<28;i++){
            await new Promise(r=>setTimeout(r,75));
            const fresh=findLiveManageItem(itemId,itemName);
            input=fresh?.querySelector(SELECTORS.managePriceInput)||null;
            if(input) return {item:fresh,input,opened:true};
        }
        return null;
    }

    async function closeManageEditorForJob(itemId,itemName){
        const live=findLiveManageItem(itemId,itemName);
        if(!live || !live.querySelector(SELECTORS.managePriceInput)) return true;
        const arrow=findManageRowArrow(live);
        if(!arrow) return false;
        arrow.click();
        for(let i=0;i<24;i++){
            await new Promise(r=>setTimeout(r,75));
            const fresh=findLiveManageItem(itemId,itemName);
            if(!fresh || !fresh.querySelector(SELECTORS.managePriceInput)) return true;
        }
        return false;
    }

    async function updateAllManagePrices() {
        const updateButton=chipFillBtn;
        if(updateButton){updateButton.disabled=true;updateButton.style.opacity='0.5';updateButton.textContent='Loading…';}
        const restoreButton=()=>{if(updateButton){updateButton.disabled=false;updateButton.style.opacity='1';updateButton.textContent='Update All';}};
        const items=getManageItems();
        if(items.length===0){restoreButton();qpToast('No items found to update!','error');return;}
        const moreBelow=mayHaveUnloadedItems(items);
        let skippedRw=0,skippedBonus=0,skippedDollar=0,updated=0,failed=0,done=0;
        const work=[]; const seenIds=new Set();
        for(const item of items){
            const image=item.querySelector('img'); if(!image) continue;
            const itemId=getItemIdFromImage(image); if(!itemId||seenIds.has(itemId)) continue;
            seenIds.add(itemId);
            if(CONFIG.skipRwWeapons&&getRWBonusInfo(item).isRanked){skippedRw++;continue;}
            if(CONFIG.skipBonusItems&&hasAnyBonus(item)){skippedBonus++;continue;}
            work.push({itemId,itemName:getItemName(item)});
        }
        for(const job of work){
            done++;
            if(updateButton)updateButton.textContent=`Opening ${done}/${work.length}`;
            const editor=await openManageEditorForJob(job.itemId,job.itemName);
            if(!editor){failed++;continue;}
            const priceDiv=editor.input.closest('div[class*="price"]')||editor.input.parentElement;
            const current=parseInt(String(editor.input.value||'').replace(/,/g,''),10)||0;
            if(CONFIG.skipDollarItems&&current===1){
                skippedDollar++;
                if(editor.opened) await closeManageEditorForJob(job.itemId,job.itemName);
                continue;
            }
            if(updateButton)updateButton.textContent=`Pricing ${done}/${work.length}`;
            const result=await updateManageItemPrice(priceDiv,job.itemId,job.itemName,{confirmLargeChange:false});
            if(result==='updated') updated++; else if(result==='failed') failed++;
            await new Promise(r=>setTimeout(r,120));
            if(editor.opened){
                const closed=await closeManageEditorForJob(job.itemId,job.itemName);
                if(!closed) console.warn('[SakaLuXBazaarSmartPricer] Could not collapse',job.itemName||job.itemId);
            }
            await new Promise(r=>setTimeout(r,100));
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
s=s[:start]+new_block+s[end:]
P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.9'; e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':'1.1.9','date':'2026-09-20','notes':[
            'Fixes Update All on TornPDA where manage price inputs only exist after the row arrow is opened.',
            'Processes each Manage row sequentially: targets the far-right arrow, waits for the price editor, updates the price, then closes the same row.',
            'Explicitly excludes the eye/view control and reacquires the live row after Torn React rerenders.'
        ]}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
if CHANGE.exists():
    t=CHANGE.read_text(); block='''## v1.1.9 — 2026-09-20\n- Fixed **Update All** for TornPDA builds where the Manage price input is not mounted until the row arrow is opened.\n- Bulk processing now opens the **far-right row arrow**, waits for the price field, updates it, then closes that same row before continuing.\n- Eye/View controls are explicitly excluded, and live rows are reacquired after every Torn React rerender.\n\n'''
    if '## v1.1.9 — 2026-09-20' not in t:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)
if DOC.exists():
    t=DOC.read_text()
    if '### v1.1.9 — TornPDA Manage row automation' not in t:t+='''\n\n### v1.1.9 — TornPDA Manage row automation\nOn TornPDA, collapsed Manage rows may not contain a price input at all. Update All now opens each row through its far-right arrow, waits for the input to mount, reprices it, then closes the row before moving on. Eye/View controls are never used.\n'''
    DOC.write_text(t)
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.9\n\nRelease date: **2026-09-20**\n\n## TornPDA Manage fix\nThe previous hidden-input assumption was incorrect for the current TornPDA layout: collapsed rows do not contain the editable price field.\n\nv1.1.9 restores sequential row automation, but with a stricter control target:\n- finds the far-right pointer/arrow in the compact row header;\n- explicitly rejects Eye/View controls;\n- waits until the actual price input is mounted;\n- writes the new price through Torn/React-aware events;\n- reacquires the live row and closes it before continuing.\n\nSAVE CHANGES remains manual.\n''')
print('v1.1.9 applied')