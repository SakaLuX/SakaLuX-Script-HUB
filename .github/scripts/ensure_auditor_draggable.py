#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / 'SakaLuX-Account-Auditor.user.js'
MARKER = '/* SakaLuX Auditor Draggable Launcher v1 */'

s = PATH.read_text(encoding='utf-8')
if MARKER in s:
    print('Account Auditor draggable launcher already installed.')
    raise SystemExit(0)

# Release bump for this feature.
m = re.search(r'(?m)^//\s*@version\s+(\d+)\.(\d+)\.(\d+)', s)
if not m:
    raise RuntimeError('Account Auditor @version not found')
old = '.'.join(m.groups())
new = f'{m.group(1)}.{m.group(2)}.{int(m.group(3))+1}'
s = re.sub(r'(?m)^(//\s*@version\s+)\S+', lambda x: x.group(1) + new, s, count=1)
s = re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(old) + r"(['\"]\s*;)", lambda x: x.group(1) + new + x.group(2), s, count=1)

old_css = "#sl-aa-button{position:fixed;right:10px;bottom:150px;z-index:2147483643;border:0;border-radius:999px;padding:9px 11px;background:#16191f;color:#fff;box-shadow:0 5px 18px rgba(0,0,0,.42);font:900 12px Arial}"
new_css = "#sl-aa-button{position:fixed;right:10px;bottom:150px;z-index:2147483643;border:1px solid #53657a;border-radius:999px;padding:9px 12px;background:linear-gradient(180deg,#202b38,#151d27);color:#fff;box-shadow:0 5px 18px rgba(0,0,0,.42);font:900 12px Arial;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}#sl-aa-button.sl-aa-dragging{cursor:grabbing;opacity:.94;box-shadow:0 8px 24px rgba(0,0,0,.55)}"
if old_css not in s:
    raise RuntimeError('Account Auditor launcher CSS anchor not found')
s = s.replace(old_css, new_css, 1)

old_button = "function createButton(){if(!settings.showButton||document.getElementById('sl-aa-button'))return;const b=document.createElement('button');b.id='sl-aa-button';b.textContent='☠︎ AUDIT';b.onclick=openSettings;document.body.appendChild(b);}"
new_button = r'''/* SakaLuX Auditor Draggable Launcher v1 */
    const AUDIT_BUTTON_POS_KEY='SakaLuX_AUDITOR_BUTTON_POSITION_V1';
    function loadAuditButtonPosition(){
        try{const p=JSON.parse(localStorage.getItem(AUDIT_BUTTON_POS_KEY)||'null');return p&&Number.isFinite(Number(p.left))&&Number.isFinite(Number(p.top))?{left:Number(p.left),top:Number(p.top)}:null;}catch(_){return null;}
    }
    function saveAuditButtonPosition(left,top){try{localStorage.setItem(AUDIT_BUTTON_POS_KEY,JSON.stringify({left:Math.round(left),top:Math.round(top)}));}catch(_){}}
    function clampAuditButtonPosition(b,left,top){const r=b.getBoundingClientRect(),w=r.width||84,h=r.height||36,pad=4;return{left:Math.max(pad,Math.min(window.innerWidth-w-pad,left)),top:Math.max(pad,Math.min(window.innerHeight-h-pad,top))};}
    function applyAuditButtonPosition(b,pos){if(!pos)return;const p=clampAuditButtonPosition(b,pos.left,pos.top);b.style.left=p.left+'px';b.style.top=p.top+'px';b.style.right='auto';b.style.bottom='auto';}
    function makeAuditButtonDraggable(b){
        const saved=loadAuditButtonPosition();if(saved)requestAnimationFrame(()=>applyAuditButtonPosition(b,saved));
        let drag=null,moved=false,suppressClick=false;
        b.addEventListener('pointerdown',e=>{
            if(e.button!=null&&e.button!==0)return;
            const r=b.getBoundingClientRect();
            drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};moved=false;
            try{b.setPointerCapture(e.pointerId);}catch(_){}
            b.classList.add('sl-aa-dragging');
            e.preventDefault();
        });
        b.addEventListener('pointermove',e=>{
            if(!drag||e.pointerId!==drag.id)return;
            const before=b.getBoundingClientRect();
            const p=clampAuditButtonPosition(b,e.clientX-drag.dx,e.clientY-drag.dy);
            if(Math.abs(p.left-before.left)>2||Math.abs(p.top-before.top)>2)moved=true;
            b.style.left=p.left+'px';b.style.top=p.top+'px';b.style.right='auto';b.style.bottom='auto';
            e.preventDefault();
        });
        const end=e=>{
            if(!drag||e.pointerId!==drag.id)return;
            const r=b.getBoundingClientRect();saveAuditButtonPosition(r.left,r.top);
            suppressClick=moved;drag=null;b.classList.remove('sl-aa-dragging');
            try{b.releasePointerCapture(e.pointerId);}catch(_){}
            if(suppressClick)setTimeout(()=>{suppressClick=false;},180);
            e.preventDefault();
        };
        b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
        b.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();return;}openSettings();});
        window.addEventListener('resize',()=>{const r=b.getBoundingClientRect();applyAuditButtonPosition(b,{left:r.left,top:r.top});const n=b.getBoundingClientRect();saveAuditButtonPosition(n.left,n.top);},{passive:true});
    }
    function createButton(){if(!settings.showButton||document.getElementById('sl-aa-button'))return;const b=document.createElement('button');b.id='sl-aa-button';b.type='button';b.textContent='☠︎ AUDIT';b.title='Tap to open · drag to move';document.body.appendChild(b);makeAuditButtonDraggable(b);}'''
if old_button not in s:
    raise RuntimeError('Account Auditor createButton anchor not found')
s = s.replace(old_button, new_button, 1)

PATH.write_text(s, encoding='utf-8')
print(f'Account Auditor launcher made draggable: {old} -> {new}')
