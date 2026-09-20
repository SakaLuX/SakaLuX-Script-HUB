from pathlib import Path
import json
import re
import shutil

OLD='1.1.14'
NEW='1.1.15'
DATE='2026-09-20'
ROOT=Path('.')
SCRIPT=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REGISTRY=ROOT/'scripts.json'
CHANGELOG=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
README=ROOT/'README-Bazaar-Smart-Pricer.md'
GF=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
RELEASE=ROOT/'releases'/f'bazaar-smart-pricer-v{NEW}.md'
BACKUP=ROOT/'backups'/f'bazaar-smart-pricer-v{OLD}-{DATE}'

BACKUP.mkdir(parents=True,exist_ok=True)

s=SCRIPT.read_text(encoding='utf-8')
if f'// @version      {OLD}' not in s:
    if f'// @version      {NEW}' in s:
        raise SystemExit('v1.1.15 already applied')
    raise SystemExit(f'Unexpected userscript version; expected {OLD}.')

shutil.copy2(SCRIPT,BACKUP/f'SakaLuX-Bazaar-Smart-Pricer-v{OLD}.user.js')
s=s.replace(f'// @version      {OLD}',f'// @version      {NEW}',1)
s=s.replace(f"|| '{OLD}';",f"|| '{NEW}';",1)

start=s.index('    async function updateAllManagePrices() {')
end=s.index('\n    // =====================================================================\n    // FLOATING DRAG CHIP',start)
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

        // IMPORTANT: bulk mode must not touch Torn's arrow/accordion controls.
        // Torn keeps the native price input mounted in each collapsed Manage row.
        // Opening a row is what creates the giant blank panel seen consistently
        // around the fifth item on TornPDA, so write directly to the mounted input.
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
            let result='failed';
            try{
                result=await Promise.race([
                    updateManageItemPrice(job.priceDiv,job.itemId,job.itemName,{confirmLargeChange:false}),
                    new Promise(resolve=>setTimeout(()=>resolve('failed'),18000))
                ]);
            }catch(e){
                console.error('[SakaLuXBazaarSmartPricer] Bulk pricing failed:',e);
                result='failed';
            }
            if(result==='updated')updated++;
            else if(result==='failed')failed++;

            // Tiny DOM settle only; the v1.1.14 two-second pacing is removed.
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
SCRIPT.write_text(s,encoding='utf-8')

# Registry
reg=json.loads(REGISTRY.read_text(encoding='utf-8'))
changed=False

def walk(node):
    global changed
    if isinstance(node,dict):
        url=str(node.get('downloadUrl',''))
        name=str(node.get('name',''))
        if url.endswith('/SakaLuX-Bazaar-Smart-Pricer.user.js') or name in {'SakaLuX Bazaar Smart Pricer','Bazaar Smart Pricer'} or node.get('id')=='bazaar-smart-pricer':
            node['version']=NEW
            node['release']={'version':NEW,'date':DATE,'notes':[
                'Removed the v1.1.14 two-second per-item delay.',
                'Manage Update All no longer opens or closes Torn item rows at all.',
                'Bulk pricing now writes directly to each collapsed row native price input, preventing the recurring giant blank panel around item 5 on TornPDA.',
                'Keeps per-item timeout protection, RW/bonus/$1 safeguards and manual SAVE CHANGES confirmation.'
            ]}
            node['detailsRevision']=int(node.get('detailsRevision',1))+1
            changed=True
        for v in node.values(): walk(v)
    elif isinstance(node,list):
        for v in node: walk(v)
walk(reg)
if changed:
    REGISTRY.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Docs version surfaces
for path in (README,GF):
    if not path.exists(): continue
    t=path.read_text(encoding='utf-8')
    t=re.sub(r'Current version:\s*\*\*v[0-9.]+\*\*',f'Current version: **v{NEW}**',t,count=1)
    t=re.sub(r'(## Current version\s*\n)\*\*v[0-9.]+\*\*',rf'\g<1>**v{NEW}**',t,count=1)
    if path==GF and '### v1.1.15 — No-accordion bulk pricing' not in t:
        t+='''\n\n### v1.1.15 — No-accordion bulk pricing\nManage **Update All** no longer clicks Torn row arrows or opens/closes item accordions. It writes directly to the native price input already mounted in each collapsed row. The temporary 2-second pacing from v1.1.14 has been removed. This specifically targets the repeatable giant blank panel that appeared around the fifth processed item on TornPDA.\n'''
    path.write_text(t,encoding='utf-8')

entry=f'''## v{NEW} — {DATE}\n- Removed the **2-second delay** introduced in v1.1.14.\n- Rebuilt Manage **Update All** so it **never opens or closes item rows**.\n- Bulk mode now edits Torn's already-mounted native price input directly while each row stays collapsed.\n- Fix targets the deterministic **giant blank panel around the 5th item** seen on TornPDA, which points to row/accordion interaction rather than request speed.\n- Kept the 18-second per-item timeout, failure continuation, RW/bonus protection and $1 protection.\n\n'''
if CHANGELOG.exists():
    t=CHANGELOG.read_text(encoding='utf-8')
    if f'## v{NEW} —' not in t:
        first=t.find('\n')
        t=t[:first+1]+'\n'+entry+t[first+1:]
        CHANGELOG.write_text(t,encoding='utf-8')

RELEASE.parent.mkdir(parents=True,exist_ok=True)
RELEASE.write_text(f'''# SakaLuX Bazaar Smart Pricer v{NEW}\n\nRelease date: **{DATE}**\n\n## Root-cause change\nThe recurring large blank area appearing at roughly the fifth processed Manage item is not treated as a pacing problem anymore. The repeatable position indicates TornPDA is reacting badly to automatic row/accordion interaction.\n\nv{NEW} therefore removes that interaction entirely: **Update All does not click the right-side arrow, does not expand a row, and does not close a row.** Torn already keeps the native price input mounted in the DOM while the row is collapsed, so bulk mode writes directly to that input.\n\n## Removed\n- v1.1.14's 2000 ms delay between items\n- `Waiting 2s · X/N` state\n- automatic row opening/closing during bulk pricing\n\n## Preserved\n- pricing calculation and market reference logic\n- RW and bonus-item protection\n- $1 listing protection\n- 18-second per-item timeout and failure continuation\n- native React-aware input/change events\n- manual **SAVE CHANGES** confirmation\n''',encoding='utf-8')

(BACKUP/'README.md').write_text(f'# Bazaar Smart Pricer v{OLD} backup\n\nCreated before v{NEW} no-accordion bulk-pricing update on {DATE}.\n',encoding='utf-8')

print(f'Prepared Bazaar Smart Pricer v{NEW}: removed 2s pacing and disabled bulk accordion interaction.')
