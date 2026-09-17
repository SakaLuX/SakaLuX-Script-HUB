from pathlib import Path
import re, json, shutil

root=Path('.')
backup=root/'backups'/'fullscreen-performance-2026-09-17'
backup.mkdir(parents=True,exist_ok=True)

scripts={
 'SakaLuX-Script-Hub.user.js':'greasyfork/Script-Hub.md',
 'SakaLuX-Enhancer-Guard.user.js':'greasyfork/Enhancer-Guard.md',
 'SakaLuX-Bazaar-Thanker-PDA.user.js':'greasyfork/Bazaar-Thanker.md',
 'SakaLuX-Mission-Rewards.user.js':'greasyfork/Mission-Rewards.md',
 'SakaLuX-Market-Intelligence.user.js':'greasyfork/Market-Intelligence.md',
 'SakaLuX-Elimination-Assistant.user.js':'greasyfork/Elimination-Assistant.md',
 'SakaLuX-Company-Intelligence-v1.0.0.user.js':'greasyfork/Company-Intelligence.md',
 'SakaLuX-Chat-Intelligence.user.js':'greasyfork/Chat-Intelligence.md',
 'SakaLuX-Account-Auditor.user.js':'greasyfork/Account-Auditor.md',
 'SakaLuX-Suite.user.js':'greasyfork/SakaLuX-Suite.md',
}

managed_ids={
 'SakaLuX-Enhancer-Guard.user.js':'enhancer',
 'SakaLuX-Bazaar-Thanker-PDA.user.js':'bazaar',
 'SakaLuX-Mission-Rewards.user.js':'mission-rewards',
 'SakaLuX-Market-Intelligence.user.js':'market-intelligence',
 'SakaLuX-Elimination-Assistant.user.js':'elimination-assistant',
 'SakaLuX-Company-Intelligence-v1.0.0.user.js':'company-intelligence',
}

def bump(v):
    p=v.split('.')
    p[-1]=str(int(p[-1])+1)
    return '.'.join(p)

def header_version(t):
    m=re.search(r'^// @version\s+([^\s]+)\s*$',t,re.M)
    if not m: raise SystemExit('missing @version')
    return m.group(1)

def set_header(t,old,new):
    return re.sub(r'^(// @version\s+)'+re.escape(old)+r'\s*$',r'\g<1>'+new,t,count=1,flags=re.M)

versions={}
for fn in scripts:
    p=root/fn
    t=p.read_text(encoding='utf-8')
    old=header_version(t); new=bump(old)
    versions[fn]=(old,new)
    shutil.copy2(p, backup/f'{Path(fn).stem}-v{old}.user.js')

# Hub is explicitly 1.9.54 for this release.
if versions['SakaLuX-Script-Hub.user.js'][0] != '1.9.53':
    raise SystemExit('Expected Hub 1.9.53 baseline')
versions['SakaLuX-Script-Hub.user.js']=('1.9.53','1.9.54')

perf_css=r'''
/* SakaLuX Mobile Full-Screen Performance Contract */
(()=>{
  if(document.getElementById('sakalux-fullscreen-performance-contract')) return;
  const s=document.createElement('style');
  s.id='sakalux-fullscreen-performance-contract';
  s.textContent=`@media(max-width:820px){
    [id^="sakalux-"][id*="overlay"],
    [id^="slx-"][id*="overlay"],
    [id^="sl-"][id*="overlay"]{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;padding:0!important;border-radius:0!important;overflow:hidden!important;
      -webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:#0b1118!important;box-shadow:none!important
    }
    [data-slx-fullsheet-v2="1"],
    [id^="sakalux-"][id*="panel"],[id^="slx-"][id*="panel"],[id^="sl-"][id*="panel"],
    [id^="sakalux-"][id*="modal"],[id^="slx-"][id*="modal"],[id^="sl-"][id*="modal"]{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;border-radius:0!important;box-sizing:border-box!important;overflow:auto!important;
      touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;
      -webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:none!important
    }
    [id^="sakalux-"] *,[id^="slx-"] *,[id^="sl-"] *{ -webkit-backdrop-filter:none!important;backdrop-filter:none!important }
    [id^="sakalux-"][id*="panel"] *,[id^="slx-"][id*="panel"] *,[id^="sl-"][id*="panel"] *,
    [id^="sakalux-"][id*="modal"] *,[id^="slx-"][id*="modal"] *,[id^="sl-"][id*="modal"] *{
      animation:none!important;transition:none!important
    }
  }`;
  (document.head||document.documentElement).appendChild(s);
})();
'''

for fn,mdpath in scripts.items():
    p=root/fn; t=p.read_text(encoding='utf-8'); old,new=versions[fn]
    t=set_header(t,old,new)

    # Keep common runtime version constants synchronized where present.
    t=t.replace("const VERSION = '"+old+"';","const VERSION = '"+new+"';",1)
    t=t.replace('const VERSION="'+old+'";','const VERSION="'+new+'";',1)
    t=t.replace("const V='"+old+"'","const V='"+new+"'",1)
    t=t.replace("const BAZAAR_VERSION = '"+old+"';","const BAZAAR_VERSION = '"+new+"';",1)
    t=t.replace("const BAZAAR_VERSION='"+old+"';","const BAZAAR_VERSION='"+new+"';",1)
    t=t.replace("version:'"+old+"'","version:'"+new+"'",1)
    t=t.replace('version:"'+old+'"','version:"'+new+'"',1)
    t=t.replace("version: '"+old+"'","version: '"+new+"'",1)

    # Disable the old document-scanning Mobile Surface contract if present.
    t=t.replace("if(window.__SakaLuXMobileSurfaceV2)return;\n  window.__SakaLuXMobileSurfaceV2=1;",
                "return; // legacy Mobile Surface observer disabled for performance\n  window.__SakaLuXMobileSurfaceV2=1;",1)

    # Remove blur everywhere in current script styles.
    t=re.sub(r'-webkit-backdrop-filter\s*:\s*[^;}`]+;?', '-webkit-backdrop-filter:none!important;', t)
    t=re.sub(r'(?<!webkit-)backdrop-filter\s*:\s*[^;}`]+;?', 'backdrop-filter:none!important;', t)

    # Hub gets an explicit viewport-sized flex layout; list remains the scroll surface.
    if fn=='SakaLuX-Script-Hub.user.js':
        marker='/* SakaLuX Hub mobile layout v1.9.53 — real footer + low-overhead scroll */'
        if marker in t:
            t=t[:t.index(marker)].rstrip()+"\n"
        hub_css=r'''
/* SakaLuX Hub mobile layout v1.9.54 — true viewport full screen */
(()=>{
  if(document.getElementById('sakalux-hub-layout-1954')) return;
  const s=document.createElement('style');
  s.id='sakalux-hub-layout-1954';
  s.textContent=`@media(max-width:820px){
    #sakalux-hub-overlay{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#0b1118!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
    #sakalux-hub-panel{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:100dvh!important;margin:0!important;border-radius:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:#0b1118!important;box-shadow:none!important}
    #sakalux-hub-panel>.slh-header{flex:0 0 auto!important;position:relative!important;background:#0d151f!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
    #sakalux-hub-panel>.slh-list{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:8px!important;contain:layout paint style!important}
    #sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important}
    #sakalux-hub-panel>.slh-bottom{position:relative!important;flex:0 0 66px!important;height:66px!important;min-height:66px!important;margin:0!important;padding:8px 20px!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important}
    #sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:50px!important}
    #sakalux-hub-panel>.slh-bottom .slh-bottom-btn{height:50px!important;min-height:50px!important;box-shadow:none!important}
    #sakalux-hub-panel>.slh-footer{position:relative!important;flex:0 0 38px!important;height:38px!important;min-height:38px!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#080d13!important;border-top:1px solid rgba(223,154,55,.52)!important;color:#df9a37!important}
    #sakalux-hub-panel *{animation:none!important;transition:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
  }`;
  (document.head||document.documentElement).appendChild(s);
})();
'''
        t=t.rstrip()+"\n\n"+hub_css+"\n"
        anchor="{ version: '1.9.53',"
        entry="{ version: '1.9.54', date: '2026-09-17', changes: ['Uses the real mobile viewport: Hub overlay and panel are exactly 100vw x 100dvh with no artificial height offsets.','Removes blur from the entire Hub and disables mobile panel animation/transition cost.','Keeps header and footer in the fixed Hub flex structure while only Managed Modules scrolls.','Introduces the common full-screen/no-blur performance contract for SakaLuX panels.'] },\n        "
        if anchor in t: t=t.replace(anchor,entry+anchor,1)
    else:
        t=t.rstrip()+"\n\n"+perf_css+"\n"

    p.write_text(t,encoding='utf-8')

    md=root/mdpath
    if md.exists():
        d=md.read_text(encoding='utf-8')
        shutil.copy2(md, backup/f'{Path(mdpath).stem}-v{old}.md')
        d=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+new+r'\g<2>',d,count=1)
        note='full-screen mobile panels, removes all blur, disables the legacy Mobile Surface observer, and reduces rendering cost for faster TornPDA scrolling and taps.'
        d=re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+',r'\g<1>**v'+new+'** '+note,d,count=1)
        if f'### v{new}' not in d and '## Release history' in d:
            d=d.replace('## Release history','## Release history\n\n### v'+new+' — Full-screen performance\n- Mobile SakaLuX panels use the full available viewport.\n- Removes backdrop blur and heavy mobile visual effects.\n- Disables the legacy document-scanning Mobile Surface observer where present.\n- Reduces mobile animation/transition cost for faster input and scrolling.\n',1)
        md.write_text(d,encoding='utf-8')

# Registry sync for managed modules.
regp=root/'scripts.json'; reg=json.loads(regp.read_text(encoding='utf-8'))
for fn,sid in managed_ids.items():
    new=versions[fn][1]
    for item in reg.get('scripts',[]):
        if item.get('id')==sid:
            item['version']=new
            item.setdefault('release',{})['version']=new
            item['release']['date']='2026-09-17'
            item['release']['notes']=['Uses full-screen mobile panels with no blur and lower rendering overhead for faster TornPDA scrolling and taps.']
            break
regp.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Sync Hub fallback managed versions.
hubp=root/'SakaLuX-Script-Hub.user.js'; hub=hubp.read_text(encoding='utf-8')
for fn,sid in managed_ids.items():
    ver=versions[fn][1]
    m=re.search(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,600}?version:\s*['\"])([^'\"]+)(['\"])",hub)
    if not m: raise SystemExit(f'Hub fallback missing {sid}')
    hub=hub[:m.start(2)]+ver+hub[m.end(2):]
hubp.write_text(hub,encoding='utf-8')

print(json.dumps({fn:new for fn,(old,new) in versions.items()},indent=2))
