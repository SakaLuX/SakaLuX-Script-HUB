#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
DOC=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.11.md'
s=P.read_text()
s=s.replace('// @version      1.1.10','// @version      1.1.11',1)
s=s.replace("|| '1.1.10';","|| '1.1.11';",1)

# v1.1.10 still used the inner row's right edge. On TornPDA that inner node ends
# around the eye column, while the actual edit chevron belongs to the wider Manage
# section row. Use the Manage section's right edge + the item's vertical center.
pat=re.compile(r"    function findManageToggle\(item\) \{.*?\n    \}\n\n    async function closeManagePriceEditor",re.S)
new=r'''    function findManageToggle(item) {
        if (!item) return null;

        const section=findSectionContainer(h =>
            h.textContent.includes('Manage your Bazaar') ||
            h.textContent.includes('Manage items') ||
            h.textContent.includes('Manage Bazaar')
        ) || item.parentElement;
        if(!section) return null;

        const ir=item.getBoundingClientRect();
        const sr=section.getBoundingClientRect();
        const y=Math.round(ir.top + Math.min(ir.height,64)/2);
        const minArrowX=sr.right-58; // eye is substantially farther left on TornPDA

        const safeCandidate=(el)=>{
            if(!el || !el.getBoundingClientRect) return null;
            let node=el;
            for(let depth=0; depth<6 && node && node!==section.parentElement; depth++,node=node.parentElement){
                const r=node.getBoundingClientRect?.();
                if(!r || !r.width || !r.height) continue;
                const meta=((node.getAttribute?.('aria-label')||'')+' '+(node.title||'')+' '+(node.className||'')).toLowerCase();
                if(/eye|view|preview|inspect|details/.test(meta)) return null;
                const cx=r.left+r.width/2;
                const cy=r.top+r.height/2;
                if(cx < minArrowX || Math.abs(cy-y)>30) continue;
                const interactive=node.matches?.('button,a,[role="button"],[tabindex]') || /arrow|chevron|expand|toggle/.test(meta) || getComputedStyle(node).cursor==='pointer';
                if(interactive) return node;
            }
            return null;
        };

        // Probe from the true Manage panel edge, not the inner item node edge.
        for(const off of [18,24,30,36,42,48,54]){
            const x=Math.round(sr.right-off);
            const hit=document.elementFromPoint(x,y);
            const candidate=safeCandidate(hit);
            if(candidate) return candidate;
        }

        // Geometry fallback: find an interactive control on the same visual row whose
        // CENTER is inside the final 58px of the Manage panel. The eye icon sits left
        // of this zone, so it can never be selected even if it has no useful class.
        const all=[...section.querySelectorAll('button,a,[role="button"],[tabindex],[class*="arrow"],[class*="chevron"],[class*="expand"],[class*="toggle"]')];
        const candidates=[];
        for(const el of all){
            const r=el.getBoundingClientRect();
            if(!r.width||!r.height) continue;
            const cx=r.left+r.width/2, cy=r.top+r.height/2;
            if(cx<minArrowX || Math.abs(cy-y)>30) continue;
            const meta=((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')).toLowerCase();
            if(/eye|view|preview|inspect|details/.test(meta)) continue;
            candidates.push(el);
        }
        candidates.sort((a,b)=>(b.getBoundingClientRect().left+b.getBoundingClientRect().width/2)-(a.getBoundingClientRect().left+a.getBoundingClientRect().width/2));
        return candidates[0]||null;
    }

    async function closeManagePriceEditor'''
if not pat.search(s): raise SystemExit('findManageToggle block not found')
s=pat.sub(new,s,1)
P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='bazaar-smart-pricer':
        e['version']='1.1.11'; e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':'1.1.11','date':'2026-09-20','notes':[
            'Fixes the remaining TornPDA eye-click bug by targeting from the full Manage panel right edge instead of the narrower inner item node.',
            'Only controls whose center lies within the final 58px of the Manage panel and on the same row may be used as the edit toggle.',
            'The eye/details column is geometrically excluded even when Torn provides no identifying class or aria label.'
        ]}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text(); block='''## v1.1.11 — 2026-09-20\n- Fixed the remaining TornPDA eye/details click in **Update All**.\n- Root cause: the inner item node used for geometry ends near the eye column; the edit chevron belongs to the wider Manage row.\n- Arrow targeting now uses the **full Manage panel right edge** and only accepts controls centered in its final 58px.\n- The eye column is therefore excluded by position even if Torn gives it no identifying class/label.\n\n'''
    if '## v1.1.11 — 2026-09-20' not in t:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGE.write_text(t)
if DOC.exists():
    t=DOC.read_text()
    if '### v1.1.11 — Strict far-right Manage toggle' not in t:t+='''\n\n### v1.1.11 — Strict far-right Manage toggle\nOn TornPDA the eye button is inside the inner item node while the edit chevron sits in the wider Manage row. Smart Pricer now uses the full Manage panel edge and only accepts a same-row interactive control in the final 58px, preventing eye/details activation.\n'''
    DOC.write_text(t)
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Bazaar Smart Pricer v1.1.11\n\nRelease date: **2026-09-20**\n\n## TornPDA strict edit-arrow targeting\nThe previous geometry still used the inner item node right boundary, which can end around Torn's eye/details column. v1.1.11 instead anchors to the full **Manage your Bazaar** panel boundary.\n\n- Uses the item's vertical center only.\n- Uses the Manage panel's real right edge for horizontal targeting.\n- Accepts only interactive controls centered within the last 58px of that panel.\n- Explicitly rejects eye/view/details controls as an additional guard.\n''')
print('v1.1.11 applied')