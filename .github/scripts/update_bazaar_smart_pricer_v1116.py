#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil

OLD='1.1.15'; NEW='1.1.16'; DATE='2026-09-20'
ROOT=Path('.')
SCRIPT=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
README=ROOT/'README-Bazaar-Smart-Pricer.md'
GF=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/f'bazaar-smart-pricer-v{NEW}.md'
BACKUP=ROOT/'backups'/f'bazaar-smart-pricer-v{OLD}-{DATE}'
BACKUP.mkdir(parents=True,exist_ok=True)

s=SCRIPT.read_text(encoding='utf-8')
if f'// @version      {OLD}' not in s:
    if f'// @version      {NEW}' in s: raise SystemExit('v1.1.16 already applied')
    raise SystemExit(f'Unexpected version; expected {OLD}')
shutil.copy2(SCRIPT,BACKUP/f'SakaLuX-Bazaar-Smart-Pricer-v{OLD}.user.js')
s=s.replace(f'// @version      {OLD}',f'// @version      {NEW}',1)
s=s.replace(f"|| '{OLD}';",f"|| '{NEW}';",1)

start=s.index('    async function ensureManagePriceEditor(item) {')
end=s.index('\n    // =====================================================================\n    // FLOATING DRAG CHIP',start)
new_block=r'''    function findManageArrow(item) {
        if(!item) return null;
        const controls=[...item.querySelectorAll('button,[role="button"],a')];
        const meta=el=>((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')).toLowerCase();
        // The eye control is commonly labelled view/details. Never allow it.
        const safe=controls.filter(el=>!/eye|view|preview|inspect|details/.test(meta(el)));
        let toggle=safe.find(el=>/arrow|chevron|expand|toggle|edit/.test(meta(el)));
        if(!toggle && safe.length) toggle=safe[safe.length-1];
        if(!toggle){
            const raw=item.querySelector('[class*="arrow"],[class*="chevron"],[class*="expand"]');
            toggle=raw?.closest('button,[role="button"],a')||raw||null;
        }
        return toggle;
    }

    async function ensureManagePriceEditor(item) {
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
        const toggle=findManageArrow(item);
        if(!toggle) return null;
        toggle.click();
        for(let i=0;i<28;i++){
            await new Promise(r=>setTimeout(r,75));
            p=findEditor();
            if(p) return {priceDiv:p,opened:true};
        }
        return null;
    }

    async function closeManagePriceEditor(itemId,itemName) {
        const live=findLiveManageItem(itemId,itemName);
        if(!live) return;
        const toggle=findManageArrow(live);
        if(!toggle) return;
        try{toggle.click();}catch{return;}
        await new Promise(r=>setTimeout(r,140));
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
                if(editor.opened) await closeManagePriceEditor(job.itemId,job.itemName);
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
            if(editor.opened) await closeManagePriceEditor(job.itemId,job.itemName);
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
SCRIPT.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']=NEW
        e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':NEW,'date':DATE,'notes':[
            'Restores required open → price → close Manage-row workflow.',
            'Fixes the deterministic fifth-item blank panel by excluding eye/view/details controls from arrow selection.',
            'Uses a freshly reacquired live far-right arrow when closing after Torn React rerenders.',
            'Keeps the 2-second delay removed; only short DOM settle waits remain.'
        ]}
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

for p in (README,GF):
    if not p.exists(): continue
    t=p.read_text(encoding='utf-8')
    t=re.sub(r'Current version:\s*\*\*v[0-9.]+\*\*',f'Current version: **v{NEW}**',t,count=1)
    t=re.sub(r'(## Current version\s*\n)\*\*v[0-9.]+\*\*',rf'\g<1>**v{NEW}**',t,count=1)
    if p==GF and '### v1.1.16 — Fifth-item arrow fix' not in t:
        t+='''\n\n### v1.1.16 — Fifth-item arrow fix\nManage Update All again opens each item row, prices it, and closes it. The arrow finder now permanently excludes controls labelled eye/view/preview/details, preventing the fifth-row fallback from opening Torn's details panel. Closing uses a freshly reacquired row/arrow after rerenders.\n'''
    p.write_text(t,encoding='utf-8')

if CHANGE.exists():
    t=CHANGE.read_text(encoding='utf-8')
    block='''## v1.1.16 — 2026-09-20\n- Restored the required **open → price → close** Manage workflow.\n- Root cause of the repeatable 5th-item blank panel: the v1.1.13 selector treated `details` as a valid editor signal, so when the price input was not already mounted it could select Torn's **eye/details** control instead of the far-right arrow.\n- Arrow selection now explicitly rejects **eye / view / preview / inspect / details** controls and prefers arrow/chevron/expand/edit controls.\n- Closing reacquires the live row and a fresh arrow after React rerenders instead of clicking a stale element.\n- The 2-second timer stays removed.\n\n'''
    if '## v1.1.16 — 2026-09-20' not in t:
        t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
        CHANGE.write_text(t,encoding='utf-8')

REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.16\n\nRelease date: **2026-09-20**\n\n## Fifth-item root cause\nThe break at item 5 was not caused by speed. The restored v1.1.13 opener accepted `details` as a valid control label. On rows where the price editor was not already mounted, TornPDA could therefore choose the eye/details control and create the large blank panel.\n\n## Fix\n- Restores open → price → close for every Manage item.\n- Excludes eye/view/preview/inspect/details from arrow selection.\n- Prefers arrow/chevron/expand/edit metadata, then the final safe interactive control.\n- Reacquires the live row before closing, so React rerenders cannot leave a stale toggle reference.\n- Keeps the 2-second delay removed.\n''',encoding='utf-8')
(BACKUP/'README.md').write_text(f'# Backup of v{OLD} before v{NEW}\n',encoding='utf-8')
print('Prepared v1.1.16 fifth-item arrow selector fix')
