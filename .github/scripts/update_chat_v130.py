from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
text=CHAT.read_text(encoding='utf-8')

# Version sync.
text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.30',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.30',ID='chat-intelligence'",text,count=1); assert n==1
text=text.replace("version:'1.2.29'","version:'1.2.30'")

# Replace the native free-text hex prompt with a TornPDA-friendly named palette.
needle="function menu(){"
assert needle in text
picker=r'''function chooseAliasColor(current,onPick){
 document.getElementById('slx-color-picker')?.remove();
 const colors=[
  ['','Default','#68717b'],
  ['#22c55e','Green','#22c55e'],
  ['#facc15','Yellow','#facc15'],
  ['#ef4444','Red','#ef4444'],
  ['#3b82f6','Blue','#3b82f6'],
  ['#ffffff','White','#ffffff'],
  ['#000000','Black','#000000'],
  ['#f97316','Orange','#f97316'],
  ['#a855f7','Purple','#a855f7']
 ];
 const o=document.createElement('div');o.id='slx-color-picker';
 o.innerHTML='<section><header><b>Choose alias color</b><button type="button" data-close>×</button></header><main></main><footer><button type="button" data-cancel>Cancel</button></footer></section>';
 const m=o.querySelector('main');
 colors.forEach(([value,label,swatch])=>{const b=document.createElement('button');b.type='button';b.className='slx-color-choice';b.dataset.color=value;b.innerHTML='<span class="slx-color-swatch"></span><span>'+label+'</span><span class="slx-color-check">'+((current||'').toLowerCase()===value.toLowerCase()?'✓':'')+'</span>';b.querySelector('.slx-color-swatch').style.background=swatch;b.onclick=()=>{o.remove();onPick(value)};m.appendChild(b)});
 const close=()=>o.remove();o.querySelector('[data-close]').onclick=close;o.querySelector('[data-cancel]').onclick=close;o.addEventListener('click',e=>{if(e.target===o)close()});document.body.appendChild(o)
}
'''
text=text.replace(needle,picker+needle,1)

old="if(a==='alias'&&S.contextAlias){const d=pd(p),al=prompt('Alias for '+(p.name||p.id),d.alias||'');if(al===null)return;const co=prompt('Optional color (#d7a94a). Blank = default.',d.color||'');if(co===null)return;P[k]={...d,alias:N(al),color:N(co)};saveP();hideMenu();scan()}"
new="if(a==='alias'&&S.contextAlias){const d=pd(p),al=prompt('Alias for '+(p.name||p.id),d.alias||'');if(al===null)return;hideMenu();chooseAliasColor(d.color||'',co=>{P[k]={...d,alias:N(al),color:co};saveP();scan()})}"
assert old in text, 'legacy alias color prompt not found'
text=text.replace(old,new,1)

# Palette styling.
css=r'''#slx-color-picker{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;background:#000b!important;box-sizing:border-box!important}#slx-color-picker>section{width:min(390px,94vw)!important;max-height:82dvh!important;overflow:hidden!important;border:1px solid #485563!important;border-radius:14px!important;background:#171c21!important;color:#eee!important;box-shadow:0 16px 44px #000c!important}#slx-color-picker header{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:12px 14px!important;background:#242b32!important;font-size:15px!important}#slx-color-picker header button{width:34px!important;height:34px!important;border:0!important;border-radius:8px!important;background:#303840!important;color:#fff!important;font-size:20px!important}#slx-color-picker main{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;padding:12px!important;overflow:auto!important}.slx-color-choice{display:grid!important;grid-template-columns:28px 1fr 20px!important;align-items:center!important;gap:9px!important;min-height:44px!important;padding:7px 9px!important;border:1px solid #3d4854!important;border-radius:9px!important;background:#20272e!important;color:#f1f5f9!important;text-align:left!important;font-weight:700!important}.slx-color-choice:active{background:#2b343d!important}.slx-color-swatch{width:26px!important;height:26px!important;border:2px solid rgba(255,255,255,.55)!important;border-radius:50%!important;box-shadow:0 0 0 1px #0008 inset!important}.slx-color-check{text-align:center!important;color:#6ee7b7!important;font-size:17px!important}#slx-color-picker footer{padding:0 12px 12px!important}#slx-color-picker footer button{width:100%!important;min-height:38px!important;border:1px solid #465462!important;border-radius:8px!important;background:#303840!important;color:#eee!important;font-weight:700!important}@media(max-width:420px){#slx-color-picker main{grid-template-columns:1fr 1fr!important;gap:6px!important;padding:9px!important}.slx-color-choice{min-height:40px!important;padding:6px!important;font-size:12px!important}}
'''
marker='#slx-menu{position:fixed!important;'
assert marker in text, 'menu CSS marker missing'
text=text.replace(marker,css+marker,1)

CHAT.write_text(text,encoding='utf-8')

if DOC.exists():
 doc=DOC.read_text(encoding='utf-8')
 doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.30**', doc, count=1)
 doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.30**', doc, count=1)
 note='**v1.2.30 — Named alias color palette**\n- Replaces the free-text hex color prompt with a touch-friendly color picker.\n- Adds Default, Green, Yellow, Red, Blue, White, Black, Orange and Purple.\n- Keeps the selected alias color saved per player and highlights the current choice.'
 doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
 DOC.write_text(doc,encoding='utf-8')

print('patched v1.2.30')
