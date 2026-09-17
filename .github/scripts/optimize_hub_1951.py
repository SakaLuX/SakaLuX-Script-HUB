from pathlib import Path
import re, shutil

root=Path('.')
hubp=root/'SakaLuX-Script-Hub.user.js'
mdp=root/'greasyfork/Script-Hub.md'
backup=root/'backups'/'hub-performance-2026-09-17'
backup.mkdir(parents=True,exist_ok=True)

hub=hubp.read_text(encoding='utf-8')
shutil.copy2(hubp,backup/'SakaLuX-Script-Hub-v1.9.50.user.js')
shutil.copy2(mdp,backup/'Script-Hub-v1.9.50.md')

if '// @version      1.9.50' not in hub or "const VERSION = '1.9.50';" not in hub:
    raise SystemExit('Expected Hub v1.9.50 baseline')

hub=hub.replace('// @version      1.9.50','// @version      1.9.51',1)
hub=hub.replace("const VERSION = '1.9.50';","const VERSION = '1.9.51';",1)

# Replace footer observer with an inexpensive one-shot repair.
pat=r"function startManagedFooterObserver\(\) \{[\s\S]*?\n    \}\n\n    function openModuleInfo"
rep="""function startManagedFooterObserver() {
        // v1.9.51: one-shot footer repair only. A document-wide MutationObserver was
        // expensive on TornPDA and unnecessary because module actions already call
        // ensureManagedModuleFooters() after opening a panel.
        ensureManagedModuleFooters();
    }

    function openModuleInfo"""
hub,n=re.subn(pat,rep,hub,count=1)
if n!=1: raise SystemExit('Could not replace managed footer observer')

# Remove expensive/redundant post-runtime repair blocks from older hotfixes.
markers=[
    ('/* SakaLuX Mobile Surface Contract v2 — full-height + blur */','/* SakaLuX Hub mobile card/runtime repair v1 */'),
    ('/* SakaLuX Hub mobile card/runtime repair v1 */','/* SakaLuX Hub TornPDA host-scroll hotfix v1.9.49 */'),
    ('/* SakaLuX Hub TornPDA host-scroll hotfix v1.9.49 */','/* SakaLuX Hub list-only scrolling + standalone geometry repair v1.9.50 */'),
]
for start,end in markers:
    if start in hub and end in hub:
        a=hub.index(start); b=hub.index(end,a); hub=hub[:a]+hub[b:]

# Remove old 1.9.50 block to replace it with one clean final contract.
start='/* SakaLuX Hub list-only scrolling + standalone geometry repair v1.9.50 */'
if start in hub:
    hub=hub[:hub.index(start)].rstrip()+"\n"

# Add a single lightweight layout contract: only modules scroll; footer/actions overlay at bottom.
hub += r'''

/* SakaLuX Hub lightweight mobile layout v1.9.51 */
(()=>{
  if(document.getElementById('sakalux-hub-layout-1951')) return;
  const s=document.createElement('style');
  s.id='sakalux-hub-layout-1951';
  s.textContent=`@media(max-width:820px){
    #sakalux-hub-overlay{position:fixed!important;inset:0!important;overflow:hidden!important;display:flex!important;align-items:stretch!important;justify-content:stretch!important;padding:0!important;box-sizing:border-box!important;background:rgba(3,7,12,.46)!important;-webkit-backdrop-filter:blur(10px)!important;backdrop-filter:blur(10px)!important}
    #sakalux-hub-panel{position:relative!important;inset:auto!important;display:flex!important;flex-direction:column!important;flex:1 1 auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;border-radius:0!important;overflow:hidden!important;touch-action:auto!important;overscroll-behavior:none!important;padding-bottom:0!important;background:rgba(9,15,22,.94)!important}
    #sakalux-hub-panel>.slh-header{flex:0 0 auto!important;position:relative!important;z-index:20!important}
    #sakalux-hub-panel>.slh-list{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:112px!important}
    #sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding-bottom:112px!important}
    #sakalux-hub-panel>.slh-bottom{position:absolute!important;left:0!important;right:0!important;bottom:34px!important;z-index:60!important;margin:0!important;padding:7px 20px!important;background:linear-gradient(180deg,rgba(11,17,24,.70),rgba(11,17,24,.97))!important;-webkit-backdrop-filter:blur(10px)!important;backdrop-filter:blur(10px)!important;border-top:1px solid rgba(255,255,255,.07)!important}
    #sakalux-hub-panel>.slh-bottom .slh-bottom-btn{min-height:48px!important;height:48px!important}
    #sakalux-hub-panel>.slh-footer{position:absolute!important;left:0!important;right:0!important;bottom:0!important;z-index:61!important;height:34px!important;min-height:34px!important;margin:0!important;padding:0 10px!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;background:rgba(8,13,19,.98)!important;border-top:1px solid rgba(223,154,55,.42)!important;-webkit-backdrop-filter:blur(10px)!important;backdrop-filter:blur(10px)!important}
  }`;
  (document.head||document.documentElement).appendChild(s);
})();
'''

# Changelog entry.
anchor="{ version: '1.9.50',"
entry="{ version: '1.9.51', date: '2026-09-17', changes: ['Moves SEND MONEY / SEND ITEMS and the author footer to a compact bottom overlay so more module cards remain visible.','Keeps only Managed Modules as the primary Hub scroll surface.','Removes the expensive document-wide Mobile Surface scan and the obsolete 1.2-second card repair timer.','Replaces the global managed-footer MutationObserver with a one-shot repair to reduce TornPDA DOM overhead.'] },\n        "
if anchor not in hub: raise SystemExit('Changelog anchor missing')
hub=hub.replace(anchor,entry+anchor,1)
hubp.write_text(hub,encoding='utf-8')

md=mdp.read_text(encoding='utf-8')
md=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>1.9.51\g<2>',md,count=1)
md=re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+',r'\g<1>**v1.9.51** reduces TornPDA lag by removing redundant document-wide DOM observers/scans, keeps only Managed Modules scrollable, and anchors the donation/actions footer compactly at the bottom to expose more module cards.',md,count=1)
if '### v1.9.51' not in md and '## Release history' in md:
    md=md.replace('## Release history','## Release history\n\n### v1.9.51 — TornPDA performance + compact footer\n- Keeps only Managed Modules as the main scroll surface.\n- Anchors SEND MONEY / SEND ITEMS and the author footer at the bottom without consuming list height.\n- Removes the document-wide Mobile Surface scan and obsolete recurring card repair timer.\n- Replaces the managed module footer observer with a one-shot repair.\n',1)
mdp.write_text(md,encoding='utf-8')

print('Prepared Hub v1.9.51 performance/layout patch')
