from pathlib import Path
import re, json, shutil

root=Path('.')
backup=root/'backups'/'ui-scroll-hotfix-2026-09-17'/'modules'
backup.mkdir(parents=True,exist_ok=True)

managed={
 'enhancer':('SakaLuX-Enhancer-Guard.user.js','1.3.37','1.3.38','VERSION','greasyfork/Enhancer-Guard.md','Enhancer Guard'),
 'bazaar':('SakaLuX-Bazaar-Thanker-PDA.user.js','5.3.29','5.3.30','BAZAAR_VERSION','greasyfork/Bazaar-Thanker.md','Bazaar Thanker - PDA'),
 'mission-rewards':('SakaLuX-Mission-Rewards.user.js','1.0.24','1.0.25','VERSION','greasyfork/Mission-Rewards.md','Mission Rewards'),
 'market-intelligence':('SakaLuX-Market-Intelligence.user.js','1.17.25','1.17.26','VERSION','greasyfork/Market-Intelligence.md','Market Intelligence'),
 'elimination-assistant':('SakaLuX-Elimination-Assistant.user.js','1.3.35','1.3.36','VERSION','greasyfork/Elimination-Assistant.md','Elimination Assistant'),
 'company-intelligence':('SakaLuX-Company-Intelligence-v1.0.0.user.js','1.8.21','1.8.22',None,'greasyfork/Company-Intelligence.md','Company Intelligence'),
}
standalone=[
 ('SakaLuX-Chat-Intelligence.user.js','1.2.11','1.2.12','greasyfork/Chat-Intelligence.md'),
 ('SakaLuX-Account-Auditor.user.js','1.3.6','1.3.7','greasyfork/Account-Auditor.md'),
 ('SakaLuX-Suite.user.js','0.9.914','0.9.915','greasyfork/SakaLuX-Suite.md'),
]

old_contract='[data-slx-fullsheet-v2="1"]{position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important;box-sizing:border-box!important;z-index:2147483200!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:blur(14px) saturate(1.08)!important;backdrop-filter:blur(14px) saturate(1.08)!important}'
new_contract='[data-slx-fullsheet-v2="1"]{width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;border-radius:0!important;box-sizing:border-box!important;z-index:2147483200!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:blur(14px) saturate(1.08)!important;backdrop-filter:blur(14px) saturate(1.08)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}'

def bump(text,old,new,runtime=None):
    text=re.sub(r'(^// @version\s+)'+re.escape(old)+r'(\s*$)',rf'\g<1>{new}\2',text,count=1,flags=re.M)
    if runtime:
        text=re.sub(r'(const\s+'+re.escape(runtime)+r'\s*=\s*[\'\"])'+re.escape(old)+r'([\'\"])',rf'\g<1>{new}\2',text,count=1)
    # Common runtime/API registration version forms, but leave historical changelog entries alone.
    text=re.sub(r'((?:version|VERSION)\s*:\s*[\'\"])'+re.escape(old)+r'([\'\"])',rf'\g<1>{new}\2',text,count=1)
    return text

def patch_surface(text):
    if old_contract in text:
        text=text.replace(old_contract,new_contract)
    # Last-rule safety override for the v2 surface marker.
    marker='slx-host-scroll-contract-v3'
    if marker not in text:
        text += r'''

/* slx-host-scroll-contract-v3 */
(()=>{if(document.getElementById('slx-host-scroll-contract-v3'))return;const s=document.createElement('style');s.id='slx-host-scroll-contract-v3';s.textContent=`@media(max-width:820px){
[data-slx-fullsheet-v2="1"]{position:relative!important;inset:auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:blur(14px) saturate(1.08)!important;backdrop-filter:blur(14px) saturate(1.08)!important}
}`;(document.head||document.documentElement).appendChild(s)})();
'''
    return text

def sync_doc(path,v,note):
    p=root/path; d=p.read_text(encoding='utf-8')
    d=re.sub(r'(## Current version\s*\n\s*\*\*v)[^*]+(\*\*)',rf'\g<1>{v}\g<2>',d,count=1,flags=re.I)
    d=re.sub(r'(## Current release note\s*\n+)\*\*v[^*]+\*\*[^\n]*',rf'\g<1>**v{v}** {note}',d,count=1,flags=re.I)
    marker='## Release history' if '## Release history' in d else '## Changelog'
    if f'### v{v}' not in d and marker in d:
        d=d.replace(marker,marker+f'\n\n### v{v} — TornPDA host-scroll contract\n- {note}\n',1)
    p.write_text(d,encoding='utf-8')

for sid,(fn,old,new,runtime,doc,name) in managed.items():
    p=root/fn; shutil.copy2(p,backup/fn)
    t=p.read_text(encoding='utf-8')
    if f'// @version      {old}' not in t and not re.search(r'^// @version\s+'+re.escape(old)+r'\s*$',t,re.M):
        raise SystemExit(f'{fn}: expected {old}')
    t=bump(t,old,new,runtime)
    t=patch_surface(t)
    if sid=='company-intelligence':
        # Whole-sheet scroll + orange footer, overriding older Company mobile rules.
        if 'slx-company-scroll-hotfix-1822' not in t:
            t += r'''

/* slx-company-scroll-hotfix-1822 */
(()=>{if(document.getElementById('slx-company-scroll-hotfix-1822'))return;const s=document.createElement('style');s.id='slx-company-scroll-hotfix-1822';s.textContent=`@media(max-width:820px){
#ci-root{overflow:hidden!important;align-items:stretch!important;justify-content:stretch!important}
#ci-root .ci-shell{position:relative!important;inset:auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:blur(14px)!important;backdrop-filter:blur(14px)!important}
#ci-root .ci-body{overflow:visible!important;max-height:none!important;min-height:auto!important;flex:0 0 auto!important}
#ci-root .ci-footer,#ci-root .sakalux-stable-module-footer{position:relative!important;inset:auto!important;width:100%!important;box-sizing:border-box!important;text-align:center!important;color:#f59e0b!important;font-weight:800!important;background:rgba(9,15,22,.96)!important;border-top:1px solid rgba(245,158,11,.24)!important;padding:10px 12px!important}
#ci-root .ci-footer a,#ci-root .sakalux-stable-module-footer a{color:#f59e0b!important;font-weight:900!important}
}`;(document.head||document.documentElement).appendChild(s)})();
'''
    p.write_text(t,encoding='utf-8')
    note=('Makes the whole Company sheet the native vertical scroll surface, fits it to the available TornPDA host height, preserves blur, and styles the SakaLuX footer in orange like Elimination.' if sid=='company-intelligence' else 'Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling works normally while the translucent blur surface is preserved.')
    sync_doc(doc,new,note)

for fn,old,new,doc in standalone:
    p=root/fn; shutil.copy2(p,backup/fn)
    t=p.read_text(encoding='utf-8')
    if not re.search(r'^// @version\s+'+re.escape(old)+r'\s*$',t,re.M):
        raise SystemExit(f'{fn}: expected {old}')
    runtime='VERSION' if fn!='SakaLuX-Chat-Intelligence.user.js' else 'V'
    t=bump(t,old,new,runtime)
    t=patch_surface(t)
    p.write_text(t,encoding='utf-8')
    sync_doc(doc,new,'Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling and mobile interaction remain stable while blur is preserved.')

# Registry versions/releases.
rp=root/'scripts.json'; shutil.copy2(rp,backup/'scripts.json')
data=json.loads(rp.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item['id'] in managed:
        new=managed[item['id']][2]
        item['version']=new
        note=('Whole Company sheet scrolls from any vertical area, uses host-container height, preserves blur, and keeps the orange author footer reachable.' if item['id']=='company-intelligence' else 'Uses host-container height instead of physical 100dvh so TornPDA scrolling remains native while blur is preserved.')
        item['release']={'version':new,'date':'2026-09-17','notes':[note]}
rp.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Hub fallback versions + current add-on list; Hub remains v1.9.49.
hp=root/'SakaLuX-Script-Hub.user.js'; h=hp.read_text(encoding='utf-8')
for sid,(fn,old,new,runtime,doc,name) in managed.items():
    h=re.sub(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,500}?version:\s*['\"])"+re.escape(old)+r"(['\"])",rf'\g<1>{new}\2',h,count=1)
hp.write_text(h,encoding='utf-8')

hubdoc=root/'greasyfork/Script-Hub.md'; hd=hubdoc.read_text(encoding='utf-8')
for sid,(fn,old,new,runtime,doc,name) in managed.items():
    hd=hd.replace(f'SakaLuX {name} **v{old}**',f'SakaLuX {name} **v{new}**')
hubdoc.write_text(hd,encoding='utf-8')
print('Module host-scroll contract synchronized.')
