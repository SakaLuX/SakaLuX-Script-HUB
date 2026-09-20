#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.13.md'
s=P.read_text()
s=s.replace('// @version      1.1.12','// @version      1.1.13',1)
s=s.replace("|| '1.1.12';","|| '1.1.13';",1)

# Restore the original Manage-row opening strategy from v1.1.1 — this was the
# first implementation that actually opened the intended editor arrow on TornPDA.
# Keep later safety improvements: no large-change modal during bulk, bounded waits,
# error continuation, native React-aware input writes, and live row reacquisition.
start=s.index('    async function ensureManagePriceEditor(item) {')
end=s.index('\n    // =====================================================================\n    // FLOATING DRAG CHIP', start)
new_block=r'''    async function ensureManagePriceEditor(item) {
        const findEditor=()=>{
            const direct=item.querySelector(SELECTORS.managePriceWrap);
            if(direct?.querySelector(SELECTORS.managePriceInput)) return direct;
            const name=getItemName(item);
            const container=findSectionContainer(h => h.textContent.includes('Manage your Bazaar') || h.textContent.includes('Manage items') || h.textContent.includes('Manage Bazaar')) || item.parentElement;
            if(!container) return null;
            for(const candidate of container.querySelectorAll(SELECTORS.manageItems)){
                if(name && getItemName(candidate)!==name) continue;
                const p=candidate.querySelector(SELECTORS.managePriceWrap);
                if(p?.querySelector(SELECTORS.managePriceInput)) return p;
            }
            return null;
        };
        let p=findEditor();
        if(p) return {priceDiv:p,opened:false,toggle:null};

        // ORIGINAL v1.1.1 selector path — intentionally restored.
        const controls=[...item.querySelectorAll('button,[role="button"],a')];
        let toggle=controls.find(el=>/expand|edit|details|open/i.test((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')));
        if(!toggle) toggle=controls[controls.length-1] || item.querySelector('[class*="arrow"],[class*="chevron"],[class*="expand"]');
        if(!toggle) return null;

        toggle.click();
        for(let i=0;i<28;i++){
            await new Promise(r=>setTimeout(r,75));
            p=findEditor();
            if(p) return {priceDiv:p,opened:true,toggle};
        }
        return null;
    }

    async function updateAllManagePrices() {
        const updateButton=chipFillBtn;
        if(updateButton){updateButton.disabled=true;updateButton.style.opacity='0.5';updateButton.textContent='Loading…';}
        const restoreButton=()=>{if(updateButton){updateButton.disabled=false;updateButton.style.opacity='1';updateButton.textContent='Update All';}};
        const items=getManageItems();
        if(items.length===0){restoreButton();qpToast('No items found to update!','error');return;}
        const moreBelow=mayHaveUnloadedItems(items);
        let skippedRw=0,skippedBonus=0,skippedDollar=0,updated=0,failed=0,done=0;
        const work=[];
        const seenIds=new Set();

        for(const item of items){
            const image=item.querySelector('img'); if(!image)continue;
            const itemId=getItemIdFromImage(image); if(!itemId||seenIds.has(itemId))continue;
            seenIds.add(itemId);
            if(CONFIG.skipRwWeapons&&getRWBonusInfo(item).isRanked){skippedRw++;continue;}
            if(CONFIG.skipBonusItems&&hasAnyBonus(item)){skippedBonus++;continue;}
            work.push({itemId,itemName:getItemName(item)});
        }

        for(const job of work){
            done++;
            if(updateButton)updateButton.textContent=`Opening ${done}/${work.length}`;

            // Reacquire row each pass because Torn can rerender after close.
            const liveItem=findLiveManageItem(job.itemId,job.itemName);
            if(!liveItem){failed++;continue;}

            let editor=null;
            try{
                editor=await Promise.race([
                    ensureManagePriceEditor(liveItem),
                    new Promise(resolve=>setTimeout(()=>resolve(null),2600))
                ]);
            }catch(e){console.error('[SakaLuXBazaarSmartPricer] Open editor failed:',e);}
            if(!editor){failed++;continue;}

            const input=editor.priceDiv.querySelector(SELECTORS.managePriceInput);
            const current=input?parseInt(String(input.value||'').replace(/,/g,''),10)||0:0;
            if(CONFIG.skipDollarItems&&current===1){
                skippedDollar++;
                if(editor.opened&&editor.toggle){try{editor.toggle.click();}catch{}}
                await new Promise(r=>setTimeout(r,120));
                continue;
            }

            if(updateButton)updateButton.textContent=`Pricing ${done}/${work.length}`;
            let result='failed';
            try{
                result=await Promise.race([
                    updateManageItemPrice(editor.priceDiv,job.itemId,job.itemName,{confirmLargeChange:false}),
                    new Promise(resolve=>setTimeout(()=>resolve('failed'),18000))
                ]);
            }catch(e){console.error('[SakaLuXBazaarSmartPricer] Bulk pricing failed:',e);result='failed';}
            if(result==='updated')updated++; else if(result==='failed')failed++;

            await new Promise(r=>setTimeout(r,120));
            if(editor.opened&&editor.toggle){
                try{editor.toggle.click();}catch{}
                await new Promise(r=>setTimeout(r,140));
            }
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
        e['version']='1.1.13'; e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':'1.1.13','date':'2026-09-20','notes':[
            'Restores the original v1.1.1 Manage arrow-opening strategy — the first version that opened the correct TornPDA editor control.',
            'Removes the later geometry/elementFromPoint arrow targeting that repeatedly selected the eye/details panel on TornPDA.',
            'Keeps hang protection: bounded editor-open wait, bounded pricing wait, per-item error continuation and live row reacquisition.'
        ]}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text(); block='''## v1.1.13 — 2026-09-20\n- Restored the original **v1.1.1 Manage editor opening logic**, which was the first flow that targeted the working TornPDA arrow correctly.\n- Removed the later geometry/`elementFromPoint` targeting that kept opening the eye/details panel.\n- Added bounded waits so a slow/broken item cannot freeze **Update All**: ~2.6 s to open editor and 18 s max for pricing.\n- Reacquires the live row before each item and continues after failures instead of locking the batch.\n\n'''
    if '## v1.1.13 — 2026-09-20' not in t:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)
if DOC.exists():
    t=DOC.read_text()
    if '### v1.1.13 — Original TornPDA arrow flow restored' not in t:t+='''\n\n### v1.1.13 — Original TornPDA arrow flow restored\nManage **Update All** is back on the first working row-opening strategy from v1.1.1. The later coordinate/geometry targeting was removed. Timeouts and per-item failure continuation were retained to prevent the original batch freeze.\n'''
    DOC.write_text(t)
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.13\n\nRelease date: **2026-09-20**\n\n## Restore first working Manage flow\nThis release intentionally restores the original v1.1.1 Manage-row opening logic — the first implementation that correctly opened the TornPDA editor arrow. Later geometry-based targeting is removed because it repeatedly selected the eye/details control.\n\nThe original freeze is addressed separately with bounded waits and per-item failure continuation, without changing the working arrow-selection method.\n''')
print('v1.1.13 original arrow flow restored with hang guards')
