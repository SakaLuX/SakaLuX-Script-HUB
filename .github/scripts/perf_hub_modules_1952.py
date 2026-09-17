from pathlib import Path
import re, json, shutil

root=Path('.')
backup=root/'backups'/'hub-module-performance-2026-09-17'
backup.mkdir(parents=True,exist_ok=True)

hubp=root/'SakaLuX-Script-Hub.user.js'
hub=hubp.read_text(encoding='utf-8')
shutil.copy2(hubp,backup/'SakaLuX-Script-Hub-v1.9.51.user.js')

if '// @version      1.9.51' not in hub or "const VERSION = '1.9.51';" not in hub:
    raise SystemExit('Expected Hub v1.9.51 baseline')
hub=hub.replace('// @version      1.9.51','// @version      1.9.52',1)
hub=hub.replace("const VERSION = '1.9.51';","const VERSION = '1.9.52';",1)

# Limit Hub language observer to SakaLuX UI only instead of translating every Torn DOM addition.
old="function startLanguageObserver(){if(languageObserver)return;languageObserver=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1||node.nodeType===3)translateSakaLuX(node.nodeType===1?node:node.parentElement)});languageObserver.observe(document.documentElement,{childList:true,subtree:true});applyLanguage()}"
new="function startLanguageObserver(){if(languageObserver)return;languageObserver=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){const el=node.nodeType===1?node:node.parentElement;if(!el)continue;const target=el.closest?.('#sakalux-hub-overlay,[id^=\"sakalux-\"],[id^=\"slx-\"],[id^=\"sl-\"],[class*=\"sakalux-\"]')||el.matches?.('[id^=\"sakalux-\"],[id^=\"slx-\"],[id^=\"sl-\"],[class*=\"sakalux-\"]');if(target)translateSakaLuX(el)}});languageObserver.observe(document.documentElement,{childList:true,subtree:true});applyLanguage()}"
if old not in hub: raise SystemExit('language observer anchor missing')
hub=hub.replace(old,new,1)

# Hub DOM observer: do no maintenance while the Hub overlay itself is open.
pat=r"function startObserver\(\) \{\n        if \(observer\) return;\n        observer = new MutationObserver\(mutations => \{ if \(mutations\.some\(mutation => mutation\.addedNodes\.length \|\| mutation\.removedNodes\.length\)\) queueEnsure\(\); \}\);\n        observer\.observe\(document\.body, \{ childList: true, subtree: true \}\);\n        window\.addEventListener\('hashchange', \(\) => setTimeout\(queueEnsure, 250\)\);\n    \}"
rep="""function startObserver() {
        if (observer) return;
        observer = new MutationObserver(mutations => {
            if (document.getElementById(IDS.overlay)) return;
            if (!mutations.some(mutation => mutation.addedNodes.length || mutation.removedNodes.length)) return;
            queueEnsure();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('hashchange', () => setTimeout(queueEnsure, 450), { passive: true });
    }"""
hub,n=re.subn(pat,rep,hub,count=1)
if n!=1: raise SystemExit('Hub startObserver anchor missing')

# Replace the final 1.9.51 mobile contract with a lighter/fixed layout.
start='/* SakaLuX Hub lightweight mobile layout v1.9.51 */'
if start not in hub: raise SystemExit('1.9.51 layout block missing')
hub=hub[:hub.index(start)].rstrip()+"\n"
hub += r'''

/* SakaLuX Hub lightweight mobile layout v1.9.52 */
(()=>{
  if(document.getElementById('sakalux-hub-layout-1952')) return;
  const s=document.createElement('style');
  s.id='sakalux-hub-layout-1952';
  s.textContent=`@media(max-width:820px){
    #sakalux-hub-overlay{position:fixed!important;inset:0!important;height:calc(100% + 78px)!important;max-height:none!important;overflow:visible!important;display:flex!important;align-items:stretch!important;justify-content:stretch!important;padding:0!important;box-sizing:border-box!important;background:rgba(3,7,12,.42)!important;-webkit-backdrop-filter:blur(4px)!important;backdrop-filter:blur(4px)!important}
    #sakalux-hub-panel{position:relative!important;inset:auto!important;display:flex!important;flex-direction:column!important;flex:1 1 auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;margin:0!important;border-radius:0!important;overflow:hidden!important;touch-action:auto!important;overscroll-behavior:none!important;padding-bottom:0!important;background:rgba(9,15,22,.97)!important}
    #sakalux-hub-panel>.slh-header{flex:0 0 auto!important;position:relative!important;z-index:20!important}
    #sakalux-hub-panel>.slh-list{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:112px!important;contain:layout paint style!important;will-change:scroll-position!important}
    #sakalux-hub-panel>.slh-list .slh-card{box-shadow:none!important;contain:layout paint style!important}
    #sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding-bottom:112px!important}
    #sakalux-hub-panel>.slh-bottom{position:absolute!important;left:0!important;right:0!important;bottom:36px!important;z-index:60!important;height:66px!important;box-sizing:border-box!important;margin:0!important;padding:8px 20px!important;background:rgba(11,17,24,.98)!important;border-top:1px solid rgba(255,255,255,.07)!important}
    #sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:50px!important;align-items:stretch!important}
    #sakalux-hub-panel>.slh-bottom .slh-bottom-btn{min-height:50px!important;height:50px!important;margin:0!important}
    #sakalux-hub-panel>.slh-footer{position:absolute!important;left:0!important;right:0!important;bottom:0!important;z-index:61!important;height:36px!important;min-height:36px!important;margin:0!important;padding:0 10px!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;background:#080d13!important;border-top:1px solid rgba(223,154,55,.48)!important}
  }`;
  (document.head||document.documentElement).appendChild(s);
})();
'''

anchor="{ version: '1.9.51',"
entry="{ version: '1.9.52', date: '2026-09-17', changes: ['Extends the mobile Hub lower into the available TornPDA area so the author footer sits closer to the bottom navigation.','Keeps SEND MONEY / SEND ITEMS fully visible above the author footer.','Reduces mobile blur/shadow compositor cost and contains module cards for smoother scrolling.','Hub DOM and language observers now ignore unrelated Torn mutations while the Hub is open.','Managed module standalone bootstraps no longer run periodic render loops while Script Hub is active.'] },\n        "
if anchor not in hub: raise SystemExit('Hub changelog anchor missing')
hub=hub.replace(anchor,entry+anchor,1)
hubp.write_text(hub,encoding='utf-8')

# Optimize repeated standalone bootstrap loops in the four affected managed modules.
mods={
 'SakaLuX-Enhancer-Guard.user.js':('1.3.39','1.3.40','VERSION','enhancer','greasyfork/Enhancer-Guard.md'),
 'SakaLuX-Bazaar-Thanker-PDA.user.js':('5.3.31','5.3.32','BAZAAR_VERSION','bazaar','greasyfork/Bazaar-Thanker.md'),
 'SakaLuX-Mission-Rewards.user.js':('1.0.26','1.0.27','VERSION','mission-rewards','greasyfork/Mission-Rewards.md'),
 'SakaLuX-Market-Intelligence.user.js':('1.17.27','1.17.28','VERSION','market-intelligence','greasyfork/Market-Intelligence.md'),
}

def replace_function(text, signature, replacement):
    i=text.find(signature)
    if i<0: raise SystemExit(f'Function signature missing: {signature}')
    brace=text.find('{',i)
    depth=0; quote=None; esc=False; template=False
    j=brace
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
                if depth==0:
                    return text[:i]+replacement+text[j+1:]
        j+=1
    raise SystemExit('Unbalanced function')

registry=json.loads((root/'scripts.json').read_text(encoding='utf-8'))
for fn,(old,newver,const_name,sid,mdpath) in mods.items():
    p=root/fn; t=p.read_text(encoding='utf-8'); shutil.copy2(p,backup/f'{fn[:-8]}-v{old}.user.js')
    if re.search(r'^// @version\s+'+re.escape(old)+r'\s*$',t,re.M) is None: raise SystemExit(f'{fn}: expected {old}')
    t=re.sub(r'^(// @version\s+)'+re.escape(old)+r'\s*$',r'\g<1>'+newver,t,count=1,flags=re.M)
    t=t.replace("{version:'"+old+"'}","{version:'"+newver+"'}",1)
    t=re.sub(r"(const\s+"+re.escape(const_name)+r"\s*=\s*['\"])"+re.escape(old)+r"(['\"])",r'\g<1>'+newver+r'\g<2>',t,count=1)
    replacement="""function start(){
    registerSelf();render();setTimeout(maybePrompt,1200);
    let t=0;
    const refresh=()=>{registerSelf();render();};
    const queue=(wait=650)=>{clearTimeout(t);t=setTimeout(refresh,wait);};
    const root=document.body||document.documentElement;
    const observer=new MutationObserver(ms=>{
      if(hubInstalled()){
        const stale=document.getElementById(DOCK_ID)||document.getElementById(NATIVE_ID)||document.getElementById(FALLBACK_ID)||document.getElementById(PROMPT_ID);
        if(stale)queue(120);
        return;
      }
      if(ms.some(m=>m.addedNodes.length||m.removedNodes.length))queue(650);
    });
    observer.observe(root,{childList:true,subtree:true});
    addEventListener('hashchange',()=>queue(300),{passive:true});
    addEventListener('popstate',()=>queue(300),{passive:true});
  }"""
    t=replace_function(t,'function start(){registerSelf();render();setTimeout(maybePrompt,1200);',replacement)
    p.write_text(t,encoding='utf-8')
    for item in registry['scripts']:
        if item.get('id')==sid:
            item['version']=newver; item['release']['version']=newver; item['release']['date']='2026-09-17'
            item['release']['notes']=['Removes the periodic standalone render loop and throttles DOM reactions while Script Hub is active, reducing TornPDA scroll overhead.']
            break
    md=root/mdpath; d=md.read_text(encoding='utf-8')
    d=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+newver+r'\g<2>',d,count=1)
    d=re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+',r'\g<1>**v'+newver+'** removes the periodic standalone render loop and throttles DOM reactions while Script Hub is active to improve TornPDA scrolling performance.',d,count=1)
    if f'### v{newver}' not in d and '## Release history' in d:
        d=d.replace('## Release history','## Release history\n\n### v'+newver+' — TornPDA performance\n- Removes the recurring standalone render interval.\n- Throttles DOM-driven standalone refreshes.\n- Avoids repeated work while Script Hub is active.\n',1)
    md.write_text(d,encoding='utf-8')

(root/'scripts.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Synchronize Hub fallback versions for those modules.
hub=hubp.read_text(encoding='utf-8')
for sid,ver in [('enhancer','1.3.40'),('bazaar','5.3.32'),('mission-rewards','1.0.27'),('market-intelligence','1.17.28')]:
    m=re.search(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,550}?version:\s*['\"])([^'\"]+)(['\"])",hub)
    if not m: raise SystemExit(f'Hub fallback missing {sid}')
    hub=hub[:m.start(2)]+ver+hub[m.end(2):]
hubp.write_text(hub,encoding='utf-8')

# Hub INFO/RELEASE doc.
mdp=root/'greasyfork/Script-Hub.md'; md=mdp.read_text(encoding='utf-8'); shutil.copy2(mdp,backup/'Script-Hub-v1.9.51.md')
md=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>1.9.52\g<2>',md,count=1)
md=re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+',r'\g<1>**v1.9.52** fixes the mobile bottom actions/footer placement and reduces TornPDA scroll lag by cutting Hub and managed-module DOM observer work plus mobile compositor cost.',md,count=1)
if '### v1.9.52' not in md and '## Release history' in md:
    md=md.replace('## Release history','## Release history\n\n### v1.9.52 — Scroll performance + bottom layout\n- Keeps SEND MONEY / SEND ITEMS fully visible.\n- Moves the author footer lower in the available TornPDA area.\n- Reduces blur/shadow rendering cost while scrolling.\n- Ignores unrelated Torn DOM mutations while Hub is open.\n- Coordinates managed module standalone performance updates.\n',1)
for old,newver in [('1.3.39','1.3.40'),('5.3.31','5.3.32'),('1.0.26','1.0.27'),('1.17.27','1.17.28')]:
    md=md.replace('**v'+old+'**','**v'+newver+'**')
mdp.write_text(md,encoding='utf-8')

print('Prepared Hub 1.9.52 + managed module performance patch')
