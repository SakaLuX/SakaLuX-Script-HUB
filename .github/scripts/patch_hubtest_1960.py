from pathlib import Path
import re
p=Path('hubtest.user.js')
s=p.read_text(encoding='utf-8')
s=re.sub(r'^// @version\s+1\.9\.59\s*$', '// @version      1.9.60', s, count=1, flags=re.M)
s=s.replace("const VERSION = '1.9.59';","const VERSION = '1.9.60';",1)
patch=r'''

/* hubtest v1.9.60 — runtime compact footer enforcement */
(()=>{
  function compactFooter(){
    const panel=document.getElementById('sakalux-hub-panel');
    const footer=panel?.querySelector(':scope > .slh-footer');
    if(!panel||!footer) return false;
    const set=(el,k,v)=>el.style.setProperty(k,v,'important');
    set(panel,'padding-bottom','0px');
    set(panel,'border-radius','0 0 22px 22px');
    set(panel,'overflow','hidden');
    set(footer,'position','relative');
    set(footer,'inset','auto');
    set(footer,'flex','0 0 22px');
    set(footer,'height','22px');
    set(footer,'min-height','22px');
    set(footer,'max-height','22px');
    set(footer,'margin','0');
    set(footer,'padding','0 6px');
    set(footer,'display','flex');
    set(footer,'align-items','center');
    set(footer,'justify-content','center');
    set(footer,'box-sizing','border-box');
    set(footer,'line-height','22px');
    set(footer,'font-size','9px');
    set(footer,'overflow','hidden');
    set(footer,'border-radius','0 0 22px 22px');
    set(footer,'background','#080d13');
    set(footer,'border-top','1px solid rgba(223,154,55,.48)');
    const a=footer.querySelector('.slh-author');
    if(a){set(a,'font-size','9px');set(a,'line-height','22px')}
    return true;
  }
  const tryApply=()=>{ compactFooter(); requestAnimationFrame(compactFooter); setTimeout(compactFooter,80); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tryApply,{once:true}); else tryApply();
  const mo=new MutationObserver(ms=>{
    for(const m of ms){
      for(const n of m.addedNodes){
        if(!(n instanceof Element)) continue;
        if(n.id==='sakalux-hub-panel'||n.querySelector?.('#sakalux-hub-panel')){ tryApply(); return; }
      }
    }
  });
  mo.observe(document.documentElement,{childList:true,subtree:true});
})();
'''
s=s.rstrip()+patch+'\n'
p.write_text(s,encoding='utf-8')
print('hubtest patched to v1.9.60 runtime footer enforcement')
