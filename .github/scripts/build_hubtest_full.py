from pathlib import Path
import re

src=Path('SakaLuX-Script-Hub.user.js').read_text(encoding='utf-8')
if not re.search(r'^// @version\s+1\.9\.55\s*$',src,re.M):
    raise SystemExit('Expected official Hub 1.9.55 baseline')

src=re.sub(r'^// @name\s+.*$', '// @name         hubtest', src, count=1, flags=re.M)
src=re.sub(r'^// @namespace\s+.*$', '// @namespace    sakalux.script.hub.test', src, count=1, flags=re.M)
src=re.sub(r'^// @version\s+1\.9\.55\s*$', '// @version      1.9.56', src, count=1, flags=re.M)
src=re.sub(r'^// @description\s+.*$', '// @description  Full TEST build of SakaLuX Script Hub with TornPDA fullscreen viewport sizing.', src, count=1, flags=re.M)
src=re.sub(r'^// @downloadURL\s+.*$', '// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/hubtest.user.js', src, count=1, flags=re.M)
src=re.sub(r'^// @updateURL\s+.*$', '// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/hubtest.user.js', src, count=1, flags=re.M)
src=src.replace("const VERSION = '1.9.55';","const VERSION = '1.9.56';",1)

patch=r'''

/* hubtest integrated TornPDA real-viewport fullscreen test */
(()=>{
  const STYLE_ID='sakalux-hubtest-real-viewport';
  const VH='--slh-hubtest-vh';
  const setViewport=()=>{
    const vv=window.visualViewport;
    const h=Math.max(320,Math.round((vv&&Number.isFinite(vv.height)?vv.height:window.innerHeight)||window.innerHeight));
    document.documentElement.style.setProperty(VH,h+'px');
  };
  setViewport();
  if(!document.getElementById(STYLE_ID)){
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
#sakalux-hub-overlay{
  position:fixed!important;inset:0 auto auto 0!important;top:0!important;left:0!important;right:auto!important;bottom:auto!important;
  width:100vw!important;height:var(${VH})!important;min-height:var(${VH})!important;max-height:var(${VH})!important;
  margin:0!important;padding:0!important;box-sizing:border-box!important;overflow:hidden!important;
  display:flex!important;align-items:stretch!important;justify-content:stretch!important;
  background:#0b1118!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important;transform:none!important
}
#sakalux-hub-panel{
  position:relative!important;inset:auto!important;flex:1 1 auto!important;align-self:stretch!important;
  width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;
  margin:0!important;padding:0!important;box-sizing:border-box!important;border:0!important;border-radius:0!important;
  display:flex!important;flex-direction:column!important;overflow:hidden!important;background:#0b1118!important;
  box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;transform:none!important
}
#sakalux-hub-panel>.slh-header{flex:0 0 auto!important;min-height:0!important;position:relative!important;z-index:2!important}
#sakalux-hub-panel>.slh-list{flex:1 1 0!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;contain:layout paint!important;padding-bottom:8px!important}
#sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{flex:1 1 0!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
#sakalux-hub-panel>.slh-bottom{position:relative!important;inset:auto!important;flex:0 0 64px!important;height:64px!important;min-height:64px!important;margin:0!important;padding:7px 16px!important;box-sizing:border-box!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important;z-index:3!important}
#sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:50px!important}
#sakalux-hub-panel>.slh-bottom .slh-bottom-btn{height:50px!important;min-height:50px!important;box-shadow:none!important}
#sakalux-hub-panel>.slh-footer{position:relative!important;inset:auto!important;flex:0 0 38px!important;height:38px!important;min-height:38px!important;margin:0!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;background:#080d13!important;border-top:1px solid rgba(223,154,55,.52)!important;z-index:3!important}
#sakalux-hub-overlay *,#sakalux-hub-panel *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;animation:none!important;transition:none!important}
`;
    (document.head||document.documentElement).appendChild(s);
  }
  const vv=window.visualViewport;
  vv?.addEventListener('resize',setViewport,{passive:true});
  window.addEventListener('resize',setViewport,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(setViewport,80),{passive:true});
})();
'''

Path('hubtest.user.js').write_text(src.rstrip()+patch+'\n',encoding='utf-8')
print('hubtest full build created from official Hub 1.9.55')
