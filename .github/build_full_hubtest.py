from pathlib import Path
import re

src = Path('SakaLuX-Script-Hub.user.js').read_text(encoding='utf-8')

# TEST metadata only; production Hub stays untouched.
src = src.replace('// @name         SakaLuX Script Hub','// @name         SakaLuX Script Hub TEST',1)
src = re.sub(r'^// @version\s+\S+\s*$', '// @version      1.9.65-test.1', src, count=1, flags=re.M)
src = re.sub(r'^// @downloadURL.*$', '// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/hubtest.user.js', src, count=1, flags=re.M)
src = re.sub(r'^// @updateURL.*$', '// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/hubtest.user.js', src, count=1, flags=re.M)
src = src.replace("const VERSION = '1.9.65';", "const VERSION = '1.9.65-test.1';", 1)

# Independent launcher proven to work in TornPDA. It does not depend on the production launcher logic.
addon = r'''

/* ===== SakaLuX Hub TEST launcher override ===== */
(() => {
  'use strict';
  const ID = 'sakalux-hub-test-force-launcher';
  const STYLE_ID = 'sakalux-hub-test-force-launcher-style';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const st=document.createElement('style'); st.id=STYLE_ID;
    st.textContent=`#${ID}{position:fixed!important;right:10px!important;bottom:74px!important;z-index:2147483647!important;width:58px!important;height:58px!important;display:flex!important;align-items:center!important;justify-content:center!important;border:2px solid #f4a641!important;border-radius:16px!important;background:linear-gradient(180deg,#f4a641,#b86210)!important;color:#fff!important;font:900 10px/1 Inter,Arial,sans-serif!important;letter-spacing:.04em!important;box-shadow:0 8px 24px #000b!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;transform:none!important}`;
    (document.head||document.documentElement).appendChild(st);
  }

  function openRealHub(){
    const candidates=['sakalux-hub-button','sakalux-hub-top-skull','sakalux-hub-nav-skull'];
    for(const id of candidates){
      const el=document.getElementById(id);
      if(el){ try{el.click(); return;}catch{} }
    }
    try {
      const fn = window.SakaLuXScriptHub?.open || window.SakaLuXHub?.open || window.SakaLuXScriptHub?.openHub;
      if(typeof fn==='function'){ fn(); return; }
    } catch{}
    // Last resort: dispatch a test-only event; production code remains untouched.
    document.dispatchEvent(new CustomEvent('sakalux-hub-test-open-request'));
  }

  function mount(){
    ensureStyle();
    let b=document.getElementById(ID);
    if(!b){
      b=document.createElement('button');
      b.id=ID; b.type='button'; b.textContent='HUB TEST';
      b.title='SakaLuX Script Hub TEST';
      b.addEventListener('click',openRealHub);
      (document.body||document.documentElement).appendChild(b);
    }
    b.style.setProperty('display','flex','important');
    b.style.setProperty('visibility','visible','important');
    b.style.setProperty('opacity','1','important');
    b.style.setProperty('pointer-events','auto','important');
  }

  mount();
  setInterval(mount,1200);
  new MutationObserver(()=>{ if(!document.getElementById(ID)) mount(); }).observe(document.documentElement,{childList:true,subtree:true});
})();
'''

src += addon
Path('hubtest.user.js').write_text(src, encoding='utf-8')
print('Built full Hub TEST from production Hub with forced TornPDA launcher')
