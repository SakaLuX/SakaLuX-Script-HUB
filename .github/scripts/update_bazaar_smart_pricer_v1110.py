#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.10.md'
s=P.read_text()
s=s.replace('// @version      1.1.9','// @version      1.1.10',1)
s=s.replace("|| '1.1.9';","|| '1.1.10';",1)

# Replace the toggle picker completely. On TornPDA the visible right arrow is not
# necessarily a descendant of the inner item node, while the eye/details button is.
# Target the actual visual right-edge control using elementFromPoint at row center.
pat=re.compile(r"    function findManageToggle\(item\) \{.*?\n    \}\n\n    async function closeManagePriceEditor",re.S)
new=r'''    function findManageToggle(item) {
        if (!item) return null;

        // Ascend to the compact visual row. The inner item___ node on TornPDA can
        // exclude the far-right arrow, so searching descendants alone hits the eye.
        let row=item;
        const itemRect=item.getBoundingClientRect();
        for(let i=0;i<4&&row?.parentElement;i++){
            const p=row.parentElement, r=p.getBoundingClientRect();
            if(r.width>=itemRect.width && r.height<=Math.max(90,itemRect.height*1.8)) row=p;
            else break;
        }
        const rr=row.getBoundingClientRect();
        const y=Math.round(rr.top+Math.min(rr.height,64)/2);

        // In TornPDA the arrow sits at the extreme right of the row, typically
        // ~20-35 px from the edge. Probe several points there and climb to the
        // nearest clickable ancestor. This cannot resolve to the eye, which is
        // materially further left.
        for(const off of [18,24,30,36,42]){
            const x=Math.round(rr.right-off);
            let el=document.elementFromPoint(x,y);
            if(!el) continue;
            for(let depth=0;depth<5&&el;depth++,el=el.parentElement){
                const er=el.getBoundingClientRect?.();
                if(!er||!er.width||!er.height) continue;
                const meta=((el.getAttribute?.('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')).toLowerCase();
                if(/eye|view|preview|inspect|details/.test(meta)) break;
                const interactive = el.matches?.('button,a,[role="button"],[tabindex]') || /arrow|chevron|expand|toggle/.test(meta) || getComputedStyle(el).cursor==='pointer';
                if(interactive && er.left>rr.left+rr.width*0.88) return el;
            }
        }

        // DOM fallback: search the visual row (not only the inner item node), and
        // accept only controls in the last 12% of row width.
        const candidates=[...row.querySelectorAll('button,a,[role="button"],[tabindex],[class*="arrow"],[class*="chevron"],[class*="expand"],[class*="toggle"]')].filter(el=>{
            const r=el.getBoundingClientRect();
            if(!r.width||!r.height||r.left<=rr.left+rr.width*0.88) return false;
            const meta=((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')).toLowerCase();
            return !/eye|view|preview|inspect|details/.test(meta);
        });
        candidates.sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right);
        return candidates[0]||null;
    }

    async function closeManagePriceEditor'''
if not pat.search(s): raise SystemExit('findManageToggle block not found')
s=pat.sub(new,s,1)
P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.10'; e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':'1.1.10','date':'2026-09-20','notes':[
            'Fixes TornPDA Manage Update All opening the eye/details panel instead of the far-right price editor arrow.',
            'Arrow targeting now uses the actual visual row and probes the extreme-right control with elementFromPoint, then falls back to right-edge DOM controls only.',
            'The eye/details control is explicitly excluded and is too far left to match the new right-edge threshold.'
        ]}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
if CHANGE.exists():
    t=CHANGE.read_text(); block='''## v1.1.10 — 2026-09-20\n- Fixed TornPDA **Update All** clicking the eye/details icon instead of the far-right edit arrow.\n- The script now targets the visual row's extreme-right control using `elementFromPoint`, matching the arrow position shown in TornPDA.\n- Descendant-only lookup was removed as the primary strategy because the far-right arrow can live outside the inner `item___` node.\n- Eye/details controls are explicitly excluded.\n\n'''
    if '## v1.1.10 — 2026-09-20' not in t:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)
if DOC.exists():
    t=DOC.read_text();
    if '### v1.1.10 — TornPDA arrow targeting' not in t:t+='''\n\n### v1.1.10 — TornPDA arrow targeting\nManage **Update All** now targets the far-right edit arrow by its visual row position instead of relying on descendants of the inner item node. This prevents the eye/details panel from opening on TornPDA.\n'''
    DOC.write_text(t)
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.10\n\nRelease date: **2026-09-20**\n\n## TornPDA Manage arrow fix\nThe far-right edit arrow is not always contained inside Torn's inner item node on PDA. Previous versions therefore found the eye/details button instead.\n\nv1.1.10 identifies the compact visual row, probes its extreme-right edge with `elementFromPoint`, and only accepts a clickable control in the final 12% of the row width. The eye icon is explicitly excluded.\n''')
print('v1.1.10 applied')