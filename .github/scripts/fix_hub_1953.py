from pathlib import Path
import re, json, shutil

root=Path('.')
backup=root/'backups'/'hub-responsive-perf-2026-09-17'
backup.mkdir(parents=True,exist_ok=True)

hubp=root/'SakaLuX-Script-Hub.user.js'
hub=hubp.read_text(encoding='utf-8')
mdp=root/'greasyfork/Script-Hub.md'
shutil.copy2(hubp, backup/'SakaLuX-Script-Hub-v1.9.52.user.js')
shutil.copy2(mdp, backup/'Script-Hub-v1.9.52.md')

if '// @version      1.9.52' not in hub or "const VERSION = '1.9.52';" not in hub:
    raise SystemExit('Expected Hub v1.9.52 baseline')
hub=hub.replace('// @version      1.9.52','// @version      1.9.53',1)
hub=hub.replace("const VERSION = '1.9.52';","const VERSION = '1.9.53';",1)

# Remove the global language MutationObserver. Managed modules already react to the
# SakaLuX:LanguageChanged event; the Hub only needs a direct pass when it renders.
pat=r"function startLanguageObserver\(\)\{[\s\S]*?\}\n\n    function getSharedApiKey"
rep="function startLanguageObserver(){applyLanguage()}\n\n    function getSharedApiKey"
hub,n=re.subn(pat,rep,hub,count=1)
if n!=1:
    raise SystemExit('Could not replace language observer')

# Pause Hub DOM observation while any Hub sheet is open. Reconnect only after close.
pat=r"    function closeHub\(\) \{[\s\S]*?\n    \}\n\n    function createOverlay\(content\) \{[\s\S]*?\n        return overlay;\n    \}"
rep="""    function pauseHubObserver() {
        if (observer) { observer.disconnect(); observer = null; }
    }

    function closeHub(resumeObserver = true) {
        document.getElementById(IDS.overlay)?.remove();
        if (resumeObserver) setTimeout(startObserver, 0);
    }

    function createOverlay(content) {
        document.getElementById(IDS.overlay)?.remove();
        pauseHubObserver();
        const overlay = document.createElement('div');
        overlay.id = IDS.overlay;
        overlay.innerHTML = `<div id="${IDS.panel}">${content}</div>`;
        document.body.appendChild(overlay);
        overlay.onclick = event => { if (event.target === overlay) closeHub(true); };
        requestAnimationFrame(() => applyLanguage());
        return overlay;
    }"""
hub,n=re.subn(pat,rep,hub,count=1)
if n!=1:
    raise SystemExit('Could not replace overlay lifecycle')

# Lightweight observer while Hub is closed; bind navigation listeners only once.
pat=r"    function startObserver\(\) \{[\s\S]*?\n    \}\n\n    window\.SakaLuXScriptHub"
rep="""    function startObserver() {
        if (observer || document.getElementById(IDS.overlay)) return;
        observer = new MutationObserver(mutations => {
            if (!mutations.some(mutation => mutation.addedNodes.length || mutation.removedNodes.length)) return;
            queueEnsure();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        if (!startObserver.routeBound) {
            const routeRefresh = () => setTimeout(queueEnsure, 500);
            window.addEventListener('hashchange', routeRefresh, { passive: true });
            window.addEventListener('popstate', routeRefresh, { passive: true });
            startObserver.routeBound = true;
        }
    }

    window.SakaLuXScriptHub"""
hub,n=re.subn(pat,rep,hub,count=1)
if n!=1:
    raise SystemExit('Could not replace Hub observer')

# Make OPEN/SETTINGS respond immediately: remove heavy Hub sheet before waiting on module API.
old="""            if (typeof api[action.method] === 'function') {
                recordUsage(id);
                const result = await api[action.method]();
                setTimeout(ensureManagedModuleFooters, 120);
                if (result === false && action.fallbackUrl) { location.href = action.fallbackUrl; return; }
                if (isPanelAction) closeHub(); else setTimeout(openHub, 100);
                return;
            }"""
new="""            if (typeof api[action.method] === 'function') {
                recordUsage(id);
                if (isPanelAction) {
                    closeHub(false);
                    await new Promise(resolve => requestAnimationFrame(() => resolve()));
                }
                const result = await api[action.method]();
                setTimeout(ensureManagedModuleFooters, 160);
                setTimeout(startObserver, 500);
                if (result === false && action.fallbackUrl) { location.href = action.fallbackUrl; return; }
                if (!isPanelAction) setTimeout(openHub, 100);
                return;
            }"""
if old not in hub:
    raise SystemExit('runAction API anchor missing')
hub=hub.replace(old,new,1)

# Replace the 1.9.52 layout with a non-overlapping flex footer and a taller host extension.
start='/* SakaLuX Hub lightweight mobile layout v1.9.52 */'
if start not in hub:
    raise SystemExit('1.9.52 layout block missing')
hub=hub[:hub.index(start)].rstrip()+"\n"
hub += r'''

/* SakaLuX Hub mobile layout v1.9.53 — real footer + low-overhead scroll */
(()=>{
  if(document.getElementById('sakalux-hub-layout-1953')) return;
  const s=document.createElement('style');
  s.id='sakalux-hub-layout-1953';
  s.textContent=`@media(max-width:820px){
    #sakalux-hub-overlay{position:fixed!important;inset:0!important;height:calc(100% + 210px)!important;max-height:none!important;overflow:hidden!important;display:flex!important;align-items:stretch!important;justify-content:stretch!important;padding:0!important;box-sizing:border-box!important;background:rgba(3,7,12,.48)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
    #sakalux-hub-panel{position:relative!important;inset:auto!important;display:flex!important;flex-direction:column!important;flex:1 1 auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;margin:0!important;border-radius:0!important;overflow:hidden!important;touch-action:auto!important;overscroll-behavior:none!important;padding:0!important;background:rgba(9,15,22,.985)!important;box-shadow:none!important}
    #sakalux-hub-panel>.slh-header{flex:0 0 auto!important;position:relative!important;z-index:20!important;background:rgba(12,20,29,.985)!important;-webkit-backdrop-filter:blur(2px)!important;backdrop-filter:blur(2px)!important}
    #sakalux-hub-panel>.slh-list{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:12px!important;contain:layout paint style!important;will-change:auto!important}
    #sakalux-hub-panel>.slh-list .slh-card{box-shadow:none!important;contain:layout paint style!important}
    #sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding-bottom:12px!important}
    #sakalux-hub-panel>.slh-bottom{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;flex:0 0 66px!important;height:66px!important;min-height:66px!important;z-index:30!important;box-sizing:border-box!important;margin:0!important;padding:8px 20px!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important}
    #sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:50px!important;align-items:stretch!important}
    #sakalux-hub-panel>.slh-bottom .slh-bottom-btn{min-height:50px!important;height:50px!important;margin:0!important;box-shadow:none!important}
    #sakalux-hub-panel>.slh-footer{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;flex:0 0 38px!important;height:38px!important;min-height:38px!important;z-index:31!important;margin:0!important;padding:0 10px!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;background:#080d13!important;border-top:1px solid rgba(223,154,55,.52)!important;color:#df9a37!important}
    #sakalux-hub-panel>.slh-footer .slh-author{color:#df9a37!important}
  }`;
  (document.head||document.documentElement).appendChild(s);
})();
'''

anchor="{ version: '1.9.52',"
entry="{ version: '1.9.53', date: '2026-09-17', changes: ['Extends the TornPDA Hub sheet to the lower host edge and makes SEND MONEY / SEND ITEMS plus the author line a real non-overlapping flex footer.','Removes full-screen backdrop blur from the Hub scroll surface while keeping a subtle header blur for a smoother GPU path.','Disconnects Hub DOM observation while Hub sheets are open and removes the global language MutationObserver.','OPEN/SETTINGS now closes the Hub before awaiting a module API so taps feel immediate.','Managed standalone observers fully disconnect once Script Hub is detected.'] },\n        "
if anchor not in hub:
    raise SystemExit('Hub changelog anchor missing')
hub=hub.replace(anchor,entry+anchor,1)
hubp.write_text(hub,encoding='utf-8')

# Optimize standalone bootstraps so their document observers fully stop once Hub exists.
mods={
 'SakaLuX-Enhancer-Guard.user.js':('1.3.40','1.3.41','VERSION','enhancer','greasyfork/Enhancer-Guard.md'),
 'SakaLuX-Bazaar-Thanker-PDA.user.js':('5.3.32','5.3.33','BAZAAR_VERSION','bazaar','greasyfork/Bazaar-Thanker.md'),
 'SakaLuX-Mission-Rewards.user.js':('1.0.27','1.0.28','VERSION','mission-rewards','greasyfork/Mission-Rewards.md'),
 'SakaLuX-Market-Intelligence.user.js':('1.17.28','1.17.29','VERSION','market-intelligence','greasyfork/Market-Intelligence.md'),
}

def replace_function(text, signature, replacement):
    i=text.find(signature)
    if i<0: raise SystemExit(f'Function signature missing: {signature}')
    brace=text.find('{',i); depth=0; quote=None; esc=False; j=brace
    while j<len(text):
        ch=text[j]
        if quote:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch==quote: quote=None
        else:
            if ch in "'\"`": quote=ch
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0: return text[:i]+replacement+text[j+1:]
        j+=1
    raise SystemExit('Unbalanced function')

registry=json.loads((root/'scripts.json').read_text(encoding='utf-8'))
for fn,(old,newver,const_name,sid,mdpath) in mods.items():
    p=root/fn; t=p.read_text(encoding='utf-8')
    shutil.copy2(p, backup/f'{fn[:-8]}-v{old}.user.js')
    if re.search(r'^// @version\s+'+re.escape(old)+r'\s*$',t,re.M) is None:
        raise SystemExit(f'{fn}: expected {old}')
    t=re.sub(r'^(// @version\s+)'+re.escape(old)+r'\s*$',r'\g<1>'+newver,t,count=1,flags=re.M)
    t=t.replace("{version:'"+old+"'}","{version:'"+newver+"'}",1)
    t=re.sub(r"(const\s+"+re.escape(const_name)+r"\s*=\s*['\"])"+re.escape(old)+r"(['\"])",r'\g<1>'+newver+r'\g<2>',t,count=1)
    replacement="""function start(){
    registerSelf();render();setTimeout(maybePrompt,1200);
    let t=0, observer=null;
    const refresh=()=>{registerSelf();render();};
    const stopForHub=()=>{
      clearTimeout(t);
      if(observer){observer.disconnect();observer=null;}
      render();
    };
    if(hubInstalled()){stopForHub();return;}
    const queue=(wait=700)=>{clearTimeout(t);t=setTimeout(refresh,wait);};
    const root=document.body||document.documentElement;
    observer=new MutationObserver(ms=>{
      if(hubInstalled()){stopForHub();return;}
      if(ms.some(m=>m.addedNodes.length||m.removedNodes.length))queue(700);
    });
    observer.observe(root,{childList:true,subtree:true});
    addEventListener('SakaLuX:ScriptHubReady',stopForHub,{once:true});
    addEventListener('hashchange',()=>queue(350),{passive:true});
    addEventListener('popstate',()=>queue(350),{passive:true});
  }"""
    t=replace_function(t,'function start(){',replacement)
    p.write_text(t,encoding='utf-8')
    for item in registry['scripts']:
        if item.get('id')==sid:
            item['version']=newver
            item['release']['version']=newver
            item['release']['date']='2026-09-17'
            item['release']['notes']=['Standalone DOM observation now disconnects completely as soon as Script Hub is detected, reducing TornPDA scroll and tap latency.']
            break
    md=root/mdpath; d=md.read_text(encoding='utf-8')
    d=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+newver+r'\g<2>',d,count=1)
    d=re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+',r'\g<1>**v'+newver+'** disconnects standalone DOM observation completely once Script Hub is present, reducing TornPDA scroll and tap latency.',d,count=1)
    if f'### v{newver}' not in d and '## Release history' in d:
        d=d.replace('## Release history','## Release history\n\n### v'+newver+' — Hub-aware observer shutdown\n- Stops the standalone document observer as soon as Script Hub is detected.\n- Keeps normal standalone behavior when Hub is absent.\n- Reduces unnecessary work during Hub scrolling and button taps.\n',1)
    md.write_text(d,encoding='utf-8')

(root/'scripts.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Sync Hub fallback versions after module bumps.
hub=hubp.read_text(encoding='utf-8')
for sid,ver in [('enhancer','1.3.41'),('bazaar','5.3.33'),('mission-rewards','1.0.28'),('market-intelligence','1.17.29')]:
    m=re.search(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,550}?version:\s*['\"])([^'\"]+)(['\"])",hub)
    if not m: raise SystemExit(f'Hub fallback missing {sid}')
    hub=hub[:m.start(2)]+ver+hub[m.end(2):]
hubp.write_text(hub,encoding='utf-8')

# Hub INFO/RELEASE.
md=mdp.read_text(encoding='utf-8')
md=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>1.9.53\g<2>',md,count=1)
md=re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+',r'\g<1>**v1.9.53** makes the TornPDA footer non-overlapping and truly bottom-aligned, removes expensive open-Hub observers, and makes module OPEN/SETTINGS react immediately before asynchronous work.',md,count=1)
if '### v1.9.53' not in md and '## Release history' in md:
    md=md.replace('## Release history','## Release history\n\n### v1.9.53 — Bottom layout + input latency\n- Uses a real flex footer for SEND MONEY / SEND ITEMS and the author line, so nothing overlaps module cards.\n- Extends the Hub to the lower TornPDA host edge.\n- Disconnects Hub observers while Hub sheets are open.\n- Removes the global language MutationObserver.\n- Closes Hub before awaiting OPEN/SETTINGS module APIs for immediate tap feedback.\n- Coordinates managed modules that fully stop standalone observation while Hub is active.\n',1)
for old,newver in [('1.3.40','1.3.41'),('5.3.32','5.3.33'),('1.0.27','1.0.28'),('1.17.28','1.17.29')]:
    md=md.replace('**v'+old+'**','**v'+newver+'**')
mdp.write_text(md,encoding='utf-8')

print('Prepared Hub 1.9.53 responsive footer/input performance patch')
