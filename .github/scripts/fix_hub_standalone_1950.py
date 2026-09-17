from pathlib import Path
import re, json, shutil

root=Path('.')
backup=root/'backups'/'hub-standalone-repair-2026-09-17'
backup.mkdir(parents=True,exist_ok=True)

files={
 'SakaLuX-Enhancer-Guard.user.js':('1.3.38','1.3.39','VERSION','enhancer','greasyfork/Enhancer-Guard.md'),
 'SakaLuX-Bazaar-Thanker-PDA.user.js':('5.3.30','5.3.31','BAZAAR_VERSION','bazaar','greasyfork/Bazaar-Thanker.md'),
 'SakaLuX-Mission-Rewards.user.js':('1.0.25','1.0.26','VERSION','mission-rewards','greasyfork/Mission-Rewards.md'),
 'SakaLuX-Market-Intelligence.user.js':('1.17.26','1.17.27','VERSION','market-intelligence','greasyfork/Market-Intelligence.md'),
}

# Hub backup + version.
hubp=root/'SakaLuX-Script-Hub.user.js'
hub=hubp.read_text(encoding='utf-8')
shutil.copy2(hubp, backup/'SakaLuX-Script-Hub-v1.9.49.user.js')
if '// @version      1.9.49' not in hub or "const VERSION = '1.9.49';" not in hub:
    raise SystemExit('Expected Hub 1.9.49 baseline')
hub=hub.replace('// @version      1.9.49','// @version      1.9.50',1)
hub=hub.replace("const VERSION = '1.9.49';","const VERSION = '1.9.50';",1)
# Stop the shared geometry contract from rewriting add-on panels.
hub=hub.replace("p.dataset.slxFullsheetV2='1';","p.removeAttribute('data-slx-fullsheet-v2');")
# New final override: panel is fixed in place, only module list scrolls.
if 'sakalux-hub-scroll-1950' not in hub:
    hub += r'''

/* SakaLuX Hub list-only scrolling + standalone geometry repair v1.9.50 */
(()=>{
  if(document.getElementById('sakalux-hub-scroll-1950')) return;
  const s=document.createElement('style');
  s.id='sakalux-hub-scroll-1950';
  s.textContent=`@media(max-width:820px){
    #sakalux-hub-overlay{position:fixed!important;inset:0!important;overflow:hidden!important;display:flex!important;align-items:stretch!important;justify-content:stretch!important;padding:0!important;box-sizing:border-box!important}
    #sakalux-hub-panel{position:relative!important;inset:auto!important;display:flex!important;flex-direction:column!important;flex:1 1 auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;border-radius:0!important;overflow:hidden!important;touch-action:auto!important;overscroll-behavior:none!important;padding-bottom:max(4px,env(safe-area-inset-bottom,0px))!important}
    #sakalux-hub-panel>.slh-header,#sakalux-hub-panel>.slh-toolbar,#sakalux-hub-panel>.slh-tabs,#sakalux-hub-panel>.slh-bottom,#sakalux-hub-panel>.slh-footer{flex:0 0 auto!important;position:relative!important;bottom:auto!important}
    #sakalux-hub-panel>.slh-list{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
    #sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important}
  }`;
  (document.head||document.documentElement).appendChild(s);
})();
'''
# changelog
anchor="{ version: '1.9.49',"
entry="{ version: '1.9.50', date: '2026-09-17', changes: ['Restores list-only scrolling: Hub chrome stays fixed while Managed Modules scrolls independently.','Removes the shared full-sheet geometry mutation from add-on panels, restoring Standalone OPEN behavior.','Keeps TornPDA host sizing and blur without forcing add-on panel dimensions.'] },\n        "
if anchor in hub and "version: '1.9.50'" not in hub:
    hub=hub.replace(anchor,entry+anchor,1)
hubp.write_text(hub,encoding='utf-8')

# Managed modules: remove geometry mutation, bump versions, backup.
registry=json.loads((root/'scripts.json').read_text(encoding='utf-8'))
for fn,(old,new,const_name,sid,mdname) in files.items():
    p=root/fn; t=p.read_text(encoding='utf-8'); shutil.copy2(p,backup/f'{fn[:-8]}-v{old}.user.js')
    if re.search(r'^// @version\s+'+re.escape(old)+r'\s*$',t,re.M) is None:
        raise SystemExit(f'{fn}: expected {old}')
    t=re.sub(r'^(// @version\s+)'+re.escape(old)+r'\s*$',r'\g<1>'+new,t,count=1,flags=re.M)
    # runtime version constants
    t=re.sub(r"(const\s+"+re.escape(const_name)+r"\s*=\s*['\"])"+re.escape(old)+r"(['\"])",r'\g<1>'+new+r'\g<2>',t,count=1)
    # standalone SELF version literals are allowed to be separate
    t=t.replace("{version:'"+old+"'}","{version:'"+new+"'}")
    t=t.replace("p.dataset.slxFullsheetV2='1';","p.removeAttribute('data-slx-fullsheet-v2');")
    p.write_text(t,encoding='utf-8')
    for item in registry['scripts']:
        if item.get('id')==sid:
            item['version']=new
            item.setdefault('release',{})['version']=new
            item['release']['date']='2026-09-17'
            item['release']['notes']=['Restores Standalone panel opening by removing the shared full-sheet geometry mutation while keeping the module’s own native panel layout.']
            break
    # docs
    md=root/mdname; d=md.read_text(encoding='utf-8')
    d=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+new+r'\g<2>',d,count=1)
    d=re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+',r'\g<1>**v'+new+'** restores Standalone panel opening by removing the shared full-sheet geometry mutation and leaving panel sizing to the module itself.',d,count=1)
    marker='## Release history'
    if f'### v{new}' not in d and marker in d:
        d=d.replace(marker,marker+f'\n\n### v{new} — Standalone panel repair\n- Restores Standalone OPEN behavior.\n- Removes shared full-sheet dimension forcing from the module panel.\n- Keeps native module sizing and TornPDA touch behavior.\n',1)
    md.write_text(d,encoding='utf-8')

(root/'scripts.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Account Auditor: standalone-only script; same geometry repair + version bump/docs.
ap=root/'SakaLuX-Account-Auditor.user.js'; a=ap.read_text(encoding='utf-8'); shutil.copy2(ap,backup/'SakaLuX-Account-Auditor-v1.3.7.user.js')
a=re.sub(r'^(// @version\s+)1\.3\.7\s*$',r'\g<1>1.3.8',a,count=1,flags=re.M)
a=a.replace("p.dataset.slxFullsheetV2='1';","p.removeAttribute('data-slx-fullsheet-v2');")
# common runtime VERSION when present
a=re.sub(r"(const\s+VERSION\s*=\s*['\"])1\.3\.7(['\"])",r'\g<1>1.3.8\g<2>',a,count=1)
ap.write_text(a,encoding='utf-8')
md=root/'greasyfork/Account-Auditor.md'; d=md.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>1.3.8\g<2>',d,count=1)
d=re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+',r'\g<1>**v1.3.8** restores the standalone auditor panel’s native geometry instead of forcing the shared full-sheet dimensions.',d,count=1)
if '### v1.3.8' not in d and '## Release history' in d:
    d=d.replace('## Release history','## Release history\n\n### v1.3.8 — Standalone panel repair\n- Removes shared full-sheet dimension forcing so the auditor panel opens normally again.\n',1)
md.write_text(d,encoding='utf-8')

# Hub docs and fallback versions.
for sid,ver in [('enhancer','1.3.39'),('bazaar','5.3.31'),('mission-rewards','1.0.26'),('market-intelligence','1.17.27')]:
    hub=hubp.read_text(encoding='utf-8')
    pat=r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,500}?version:\s*['\"])([^'\"]+)(['\"] )"
    # tolerate no trailing space
    m=re.search(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,500}?version:\s*['\"])([^'\"]+)(['\"])",hub)
    if not m: raise SystemExit(f'Hub fallback not found {sid}')
    hub=hub[:m.start(2)]+ver+hub[m.end(2):]
    hubp.write_text(hub,encoding='utf-8')

hmd=root/'greasyfork/Script-Hub.md'; h=hmd.read_text(encoding='utf-8')
h=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>1.9.50\g<2>',h,count=1)
h=re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+',r'\g<1>**v1.9.50** restores the intended mobile layout: only Managed Modules scrolls while Hub controls stay fixed, and removes the shared panel geometry mutation that broke Standalone OPEN actions.',h,count=1)
if '### v1.9.50' not in h and '## Release history' in h:
    h=h.replace('## Release history','## Release history\n### v1.9.50 — List-only scroll + Standalone repair\n- Keeps Hub header, stats, controls and tabs fixed.\n- Makes only Managed Modules the main vertical scroll surface.\n- Restores Standalone module opening by removing shared forced panel dimensions.\n',1)
# update displayed managed versions in Script-Hub info
for name,old,new in [('Enhancer Guard','1.3.38','1.3.39'),('Bazaar Thanker - PDA','5.3.30','5.3.31'),('Mission Rewards','1.0.25','1.0.26'),('Market Intelligence','1.17.26','1.17.27')]:
    h=h.replace(f'SakaLuX {name} **v{old}**',f'SakaLuX {name} **v{new}**')
hmd.write_text(h,encoding='utf-8')
print('Hub 1.9.50 list-only scroll and standalone repair prepared.')
