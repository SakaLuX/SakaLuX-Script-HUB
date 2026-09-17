from pathlib import Path
import re, shutil

hub=Path('SakaLuX-Script-Hub.user.js')
md=Path('greasyfork/Script-Hub.md')
backup=Path('backups/hub-fullscreen-1955-2026-09-17')
backup.mkdir(parents=True, exist_ok=True)

t=hub.read_text(encoding='utf-8')
if not re.search(r'^// @version\s+1\.9\.54\s*$',t,re.M):
    raise SystemExit('Expected Hub 1.9.54 baseline')
shutil.copy2(hub, backup/'SakaLuX-Script-Hub-v1.9.54.user.js')
shutil.copy2(md, backup/'Script-Hub-v1.9.54.md')

t=re.sub(r'^(// @version\s+)1\.9\.54\s*$',r'\g<1>1.9.55',t,count=1,flags=re.M)
t=t.replace("const VERSION = '1.9.54';","const VERSION = '1.9.55';",1)

# Add release entry before 1.9.54.
anchor="{ version: '1.9.54',"
entry="{ version: '1.9.55', date: '2026-09-17', changes: ['Makes Hub use the same reliable full-screen container model as Enhancer Guard and Market Intelligence.','The overlay owns the viewport with fixed inset:0 and maximum stacking; the Hub panel fills that container with flex instead of using a second fixed viewport.','Removes double-fixed geometry that could leave unused space at the bottom in TornPDA.','Keeps blur disabled and Managed Modules as the only primary scroll surface.'] },\n        "
if anchor not in t: raise SystemExit('Hub changelog anchor missing')
t=t.replace(anchor,entry+anchor,1)

# Replace 1.9.54 layout block with 1.9.55 model copied from the working add-on structure.
start=t.find('/* SakaLuX Hub mobile layout v1.9.54')
if start<0: raise SystemExit('1.9.54 layout block missing')
# block is last runtime section; replace through EOF safely.
new_block=r'''/* SakaLuX Hub mobile layout v1.9.55 — add-on parity full-screen */
(()=>{
  if(document.getElementById('sakalux-hub-layout-1955')) return;
  const s=document.createElement('style');
  s.id='sakalux-hub-layout-1955';
  s.textContent=`@media(max-width:820px){
    #sakalux-hub-overlay{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      z-index:2147483647!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;padding:0!important;box-sizing:border-box!important;overflow:hidden!important;
      display:flex!important;align-items:stretch!important;justify-content:stretch!important;
      background:#0b1118!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:none!important
    }
    #sakalux-hub-panel{
      position:relative!important;inset:auto!important;flex:1 1 auto!important;align-self:stretch!important;
      width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;
      margin:0!important;padding:0!important;box-sizing:border-box!important;border-radius:0!important;
      display:flex!important;flex-direction:column!important;overflow:hidden!important;
      background:#0b1118!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important
    }
    #sakalux-hub-panel>.slh-header{flex:0 0 auto!important;position:relative!important;background:#0d151f!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
    #sakalux-hub-panel>.slh-list{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:8px!important;contain:layout paint style!important}
    #sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}
    #sakalux-hub-panel>.slh-bottom{position:relative!important;flex:0 0 66px!important;height:66px!important;min-height:66px!important;margin:0!important;padding:8px 20px!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important}
    #sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:50px!important}
    #sakalux-hub-panel>.slh-bottom .slh-bottom-btn{height:50px!important;min-height:50px!important;box-shadow:none!important}
    #sakalux-hub-panel>.slh-footer{position:relative!important;flex:0 0 38px!important;height:38px!important;min-height:38px!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#080d13!important;border-top:1px solid rgba(223,154,55,.52)!important;color:#df9a37!important}
    #sakalux-hub-overlay *,#sakalux-hub-panel *{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
    #sakalux-hub-panel *{animation:none!important;transition:none!important}
  }`;
  (document.head||document.documentElement).appendChild(s);
})();
'''
t=t[:start].rstrip()+"\n\n"+new_block+"\n"
hub.write_text(t,encoding='utf-8')

# Docs
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n\*\*v)1\.9\.54(\*\*)',r'\g<1>1.9.55\g<2>',m,count=1)
m=re.sub(r'(## Current release note\s*\n+).*?(?=\n\n## Recommended)',r'''\1**v1.9.55** uses the same proven full-screen container model as Enhancer Guard and Market Intelligence: one fixed viewport overlay and one flex-filled Hub panel, eliminating the double-fixed TornPDA height issue while keeping blur disabled and scrolling lightweight.''',m,count=1,flags=re.S)
entry_md='''### v1.9.55 — Add-on parity full-screen\n- Uses the same full-screen container structure as Enhancer Guard and Market Intelligence.\n- Makes the overlay own the viewport and lets the Hub panel fill it with flex.\n- Removes the double-fixed geometry that could leave unused space below the Hub in TornPDA.\n- Keeps blur disabled and only the Managed Modules area as the main scroll surface.\n\n'''
if '## Release history' not in m: raise SystemExit('Release history missing')
m=m.replace('## Release history','## Release history\n\n'+entry_md,1)
md.write_text(m,encoding='utf-8')
print('Hub 1.9.55 patched')
