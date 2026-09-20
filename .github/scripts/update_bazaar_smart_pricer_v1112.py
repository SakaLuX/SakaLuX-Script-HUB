#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.12.md'
s=P.read_text()
s=s.replace('// @version      1.1.11','// @version      1.1.12',1)
s=s.replace("|| '1.1.11';","|| '1.1.12';",1)

# Stop trying to infer the chevron from descendants. On TornPDA the eye and the
# edit chevron live in separate right-side cells. We now click the exact visual
# chevron column: a fixed offset from the Manage panel's right edge, on the row's
# vertical center. This matches the actual UI geometry shown in PDA.
pat=re.compile(r"    function findManageToggle\(item\) \{.*?\n    \}\n\n    async function closeManagePriceEditor",re.S)
new=r'''    function getManagePanelRect() {
        const container=findSectionContainer(h =>
            h.textContent.includes('Manage your Bazaar') ||
            h.textContent.includes('Manage items') ||
            h.textContent.includes('Manage Bazaar')
        );
        return container?.getBoundingClientRect?.() || null;
    }

    function getExactManageArrowTarget(item) {
        if (!item) return null;
        const ir=item.getBoundingClientRect();
        const pr=getManagePanelRect();
        if(!pr) return null;

        // TornPDA layout: far-right chevron center is ~28-32 px left of the
        // Manage panel edge. Probe only this narrow column. The eye is ~85-95 px
        // left of the panel edge, so it can never be selected here.
        const y=Math.round(ir.top + Math.min(ir.height,64)/2);
        for(const off of [28,30,26,32,24,34]){
            const x=Math.round(pr.right-off);
            const stack=document.elementsFromPoint(x,y);
            for(const raw of stack){
                if(!raw || raw===document.documentElement || raw===document.body) continue;
                let el=raw;
                for(let d=0;d<5&&el;d++,el=el.parentElement){
                    const r=el.getBoundingClientRect?.();
                    if(!r||!r.width||!r.height) continue;
                    // Hard geometry guard: target must physically occupy the last
                    // 55px of the Manage panel and overlap this item's row.
                    if(r.right < pr.right-58 || r.left > pr.right+2) continue;
                    if(r.bottom < ir.top || r.top > ir.bottom) continue;
                    const meta=((el.getAttribute?.('aria-label')||'')+' '+(el.title||'')+' '+String(el.className||'')).toLowerCase();
                    if(/eye|view|preview|inspect|details/.test(meta)) continue;
                    const clickable = el.matches?.('button,a,[role="button"],[tabindex]') ||
                        /arrow|chevron|expand|toggle/.test(meta) ||
                        getComputedStyle(el).cursor==='pointer';
                    if(clickable) return el;
                }
            }
        }
        return null;
    }

    function clickExactManageArrow(item) {
        const target=getExactManageArrowTarget(item);
        if(!target) return false;
        const r=target.getBoundingClientRect();
        const x=Math.round(r.left+r.width/2), y=Math.round(r.top+r.height/2);
        for(const type of ['pointerdown','mousedown','pointerup','mouseup','click']){
            const C=type.startsWith('pointer')?PointerEvent:MouseEvent;
            try{target.dispatchEvent(new C(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,buttons:type.includes('down')?1:0,pointerType:'mouse'}));}
            catch{target.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0}));}
        }
        return true;
    }

    function findManageToggle(item) {
        // Kept as compatibility wrapper for close/open helpers.
        return getExactManageArrowTarget(item);
    }

    async function closeManagePriceEditor'''
if not pat.search(s): raise SystemExit('findManageToggle block not found')
s=pat.sub(new,s,1)

# Make opening use the exact far-right arrow dispatch, never .click() on an
# inferred control. If the editor does not appear, fail safely instead of trying
# another control such as the eye.
s=s.replace('''        const toggle=findManageToggle(item);
        if(!toggle) return null;
        toggle.click();
        for(let i=0;i<24;i++){await new Promise(r=>setTimeout(r,75));p=findEditor();if(p)return{priceDiv:p,opened:true,toggle};}
        return null;''','''        const toggle=findManageToggle(item);
        if(!toggle) return null;
        if(!clickExactManageArrow(item)) return null;
        for(let i=0;i<28;i++){await new Promise(r=>setTimeout(r,75));p=findEditor();if(p)return{priceDiv:p,opened:true,toggle};}
        return null;''',1)

# Closing uses the same exact arrow column.
s=s.replace('''        const toggle=findManageToggle(live);
        if(!toggle) return;
        toggle.click();''','''        const toggle=findManageToggle(live);
        if(!toggle) return;
        if(!clickExactManageArrow(live)) return;''',1)

P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.12'; e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':'1.1.12','date':'2026-09-20','notes':[
            'Hard-fixes TornPDA Manage Update All to target only the far-right chevron column.',
            'Arrow targeting is now anchored to the Manage panel right edge (~28-32px inset), not the item node, so the eye column cannot match.',
            'Opening and closing use synthetic pointer/mouse events on that exact chevron target; if no arrow is found, the item fails safely instead of clicking another control.'
        ]}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text(); block='''## v1.1.12 — 2026-09-20\n- Hard-fixed TornPDA **Update All** to use only the far-right chevron column.\n- The target is calculated from the **Manage panel right edge** at roughly 28–32px inset; the eye icon sits much farther left and cannot match.\n- Opening/closing now dispatches pointer + mouse events on that exact target.\n- If the chevron cannot be identified, the item is skipped safely rather than falling back to the eye/details control.\n\n'''
    if '## v1.1.12 — 2026-09-20' not in t:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)
if DOC.exists():
    t=DOC.read_text()
    if '### v1.1.12 — Exact chevron column' not in t:t+='''\n\n### v1.1.12 — Exact chevron column\nOn TornPDA, Manage bulk repricing now opens/closes rows only through the far-right chevron column, anchored to the Manage panel's right edge. No fallback is allowed to eye/details controls.\n'''
    DOC.write_text(t)
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.12\n\nRelease date: **2026-09-20**\n\n## TornPDA exact chevron fix\nThe previous geometry still derived too much from the inner item node and could land on the eye/details cell. v1.1.12 anchors the target to the full Manage panel edge and probes only the last chevron column (~28–32px from the right edge). The eye column is physically outside this acceptance zone.\n\nOpening and closing dispatch pointer/mouse events only on that exact target. If it is unavailable, the item fails safely.\n''')
print('v1.1.12 exact far-right arrow fix applied')
