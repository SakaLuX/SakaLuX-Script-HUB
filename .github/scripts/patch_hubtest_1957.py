from pathlib import Path
import re
p=Path('hubtest.user.js')
s=p.read_text(encoding='utf-8')
s=re.sub(r'^// @version\s+1\.9\.56\s*$', '// @version      1.9.57', s, count=1, flags=re.M)
s=s.replace("const VERSION = '1.9.56';","const VERSION = '1.9.57';",1)
# Disable the visualViewport-based test block by forcing its CSS variable to 100dvh and append exact module-style fullscreen contract last.
s=s.replace("const VH='--slh-hubtest-vh';","const VH='--slh-hubtest-vh';",1)
patch=r'''

/* hubtest v1.9.57 — exact Enhancer/Market mobile fullscreen contract */
(()=>{
  const id='sakalux-hubtest-module-fullscreen-1957';
  if(document.getElementById(id)) return;
  const st=document.createElement('style');
  st.id=id;
  st.textContent=`@media(max-width:820px){
#sakalux-hub-overlay{
  position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
  width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;
  margin:0!important;padding:0!important;border-radius:0!important;overflow:hidden!important;
  background:#0b1118!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
}
#sakalux-hub-panel{
  position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
  width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;
  margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-sizing:border-box!important;
  display:flex!important;flex-direction:column!important;overflow:hidden!important;
  background:#0b1118!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
}
#sakalux-hub-panel>.slh-header{flex:0 0 auto!important;min-height:0!important}
#sakalux-hub-panel>.slh-list{flex:1 1 0!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;contain:layout paint!important}
#sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{flex:1 1 0!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
#sakalux-hub-panel>.slh-bottom{position:relative!important;inset:auto!important;flex:0 0 64px!important;height:64px!important;min-height:64px!important;margin:0!important;padding:7px 16px!important;box-sizing:border-box!important;background:#0b1118!important;z-index:3!important}
#sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:50px!important}
#sakalux-hub-panel>.slh-bottom .slh-bottom-btn{height:50px!important;min-height:50px!important;box-shadow:none!important}
#sakalux-hub-panel>.slh-footer{position:relative!important;inset:auto!important;flex:0 0 38px!important;height:38px!important;min-height:38px!important;margin:0!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;background:#080d13!important;border-top:1px solid rgba(223,154,55,.52)!important;z-index:3!important}
#sakalux-hub-overlay *,#sakalux-hub-panel *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;animation:none!important;transition:none!important}
}`;
  (document.head||document.documentElement).appendChild(st);
})();
'''
s=s.rstrip()+patch+'\n'
p.write_text(s,encoding='utf-8')
print('hubtest patched to v1.9.57 exact module fullscreen contract')
