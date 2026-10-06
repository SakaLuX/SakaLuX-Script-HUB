from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
RUNTIME=ROOT/'src/core/sakalux-dock-runtime.js'
BH=ROOT/'SakaLuX-Bounty-Hunter.user.js'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG.md'
BMD=ROOT/'greasyfork/Bounty-Hunter.md'
HMD=ROOT/'greasyfork/Script-Hub.md'
RTTEST=ROOT/'tests/priority6-shared-dock-runtime-regression.cjs'
SORTTEST=ROOT/'tests/module-active-alpha-sort-regression.cjs'

rt=RUNTIME.read_text(encoding='utf-8')
rt=rt.replace("const VERSION = '1.0.0-test.3';","const VERSION = '1.1.0';",1)
rt=rt.replace("  if (g[NS]?.version === VERSION) return;","""  function cmpVersion(a,b){const pa=String(a||'0').match(/\\d+/g)?.map(Number)||[0],pb=String(b||'0').match(/\\d+/g)?.map(Number)||[0];for(let i=0;i<Math.max(pa.length,pb.length);i++){const x=pa[i]||0,y=pb[i]||0;if(x!==y)return x>y?1:-1}return 0}
  const existingRuntime=g.__SakaLuXDockRuntimeCurrent||g[NS];
  if(existingRuntime?.version&&cmpVersion(existingRuntime.version,VERSION)>=0)return;""",1)
rt=rt.replace("function readOpen() { try { return localStorage.getItem(OPEN_KEY) === '1'; } catch { return false; } }","function readOpen() { return false; }",1)
rt=rt.replace("function writeOpen(value) { try { localStorage.setItem(OPEN_KEY, value ? '1' : '0'); } catch {} }","function writeOpen(value) { try { localStorage.setItem(OPEN_KEY, '0'); } catch {} return Boolean(value); }",1)

rt=rt.replace(
"#${IDS.dock} .slx-dock-head{display:grid;grid-template-columns:28px 1fr auto;gap:7px;align-items:center;margin-bottom:8px}\n#${IDS.dock} .slx-dock-mark{width:28px;height:28px;border:0;border-radius:8px;background:#d79b49;color:#111;font-weight:900}\n#${IDS.dock} .slx-dock-title{font-size:12px;font-weight:900;color:#f5f7fa}.slx-dock-sub{font-size:9px;color:#8d98a6}",
"#${IDS.dock} .slx-dock-head{display:grid;grid-template-columns:28px 1fr 28px;gap:7px;align-items:center;margin-bottom:8px}\n#${IDS.dock} .slx-dock-mark{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:8px;background:#d79b49;color:#111;font:900 16px/1 Arial,sans-serif}\n#${IDS.dock} .slx-dock-close{display:flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#151f2b;color:#dce7f2;font:900 17px/1 Arial,sans-serif}\n#${IDS.dock} .slx-dock-title{font-size:12px;font-weight:900;color:#f5f7fa}.slx-dock-sub{display:block;font-size:9px;color:#8d98a6}",
1)
rt=rt.replace(
"#${IDS.native} .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;font-weight:900!important;color:#e9a84d!important;text-decoration:none!important}",
"#${IDS.native}{display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important}#${IDS.native} .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:100%!important;min-width:26px!important;min-height:26px!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;color:#e9a84d!important;text-decoration:none!important;font:900 16px/1 Arial,sans-serif!important;text-indent:0!important;letter-spacing:0!important}#${IDS.native} .slx-s-link:before,#${IDS.native} .slx-s-link:after{content:none!important;display:none!important}",
1)
rt=rt.replace("      item.className = [...native, 'slx-standalone-native'].join(' ');","      item.className = [...native, 'slx-standalone-native'].join(' '); item.removeAttribute?.('style');",1)

old="""      panel.dataset.open = readOpen() ? '1' : '0';
      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const close = d.createElement('button'); close.type = 'button'; close.className = 'slx-dock-mark'; close.textContent = 'S'; close.title = 'Close SakaLuX Scripts';
      close.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); });
      const title = d.createElement('div'); title.className = 'slx-dock-title'; title.textContent = 'SakaLuX Scripts';
      const sub = d.createElement('div'); sub.className = 'slx-dock-sub'; sub.textContent = 'Standalone';
      head.appendChild(close); head.appendChild(title); head.appendChild(sub);"""
new="""      panel.dataset.open = '0';
      panel.hidden = true;
      writeOpen(false);
      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const mark = d.createElement('div'); mark.className = 'slx-dock-mark'; mark.textContent = 'S'; mark.setAttribute?.('aria-hidden','true');
      const titleBox = d.createElement('div');
      const title = d.createElement('div'); title.className = 'slx-dock-title'; title.textContent = 'SakaLuX Scripts';
      const sub = d.createElement('div'); sub.className = 'slx-dock-sub'; sub.textContent = 'Standalone';
      titleBox.appendChild(title); titleBox.appendChild(sub);
      const close = d.createElement('button'); close.type = 'button'; close.className = 'slx-dock-close'; close.textContent = '×'; close.title = 'Close SakaLuX Scripts'; close.setAttribute?.('aria-label','Close SakaLuX Scripts');
      close.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); });
      head.appendChild(mark); head.appendChild(titleBox); head.appendChild(close);"""
if old not in rt: raise SystemExit('dock head anchor missing')
rt=rt.replace(old,new,1)
rt=rt.replace("    writeOpen(next);\n    return next;","    writeOpen(false);\n    return next;",1)
old_signal="""      core()?.router?.onChange?.(() => scheduleRefresh(180));
      core()?.router?.bind?.();"""
new_signal="""      core()?.router?.onChange?.(() => { toggleDock(false); scheduleRefresh(180); });
      core()?.router?.bind?.();"""
if old_signal not in rt: raise SystemExit('router signal anchor missing')
rt=rt.replace(old_signal,new_signal,1)
bind_anchor="    try { g.addEventListener?.('SakaLuX:ScriptHubReady', () => removeUi(), { passive: true }); } catch {}"
rt=rt.replace(bind_anchor,bind_anchor+"""
    try { g.addEventListener?.('keydown', e => { if(e?.key==='Escape') toggleDock(false); }, { passive: true }); } catch {}
    try { doc()?.addEventListener?.('click', e => { const p=doc()?.getElementById(IDS.dock); if(!p||p.dataset.open!=='1')return; const native=doc()?.getElementById(IDS.native),fallback=doc()?.getElementById(IDS.fallback); if(p.contains?.(e.target)||native?.contains?.(e.target)||fallback?.contains?.(e.target))return; toggleDock(false); }, true); } catch {}""",1)
end_old="""  const api = Object.freeze({ version: VERSION, ids: IDS, register, unregister, list, render, toggleDock, removeUi, hubInstalled, maybePrompt });
  g[NS] = api;
})();"""
end_new="""  const api = Object.freeze({ version: VERSION, ids: IDS, register, unregister, list, render, toggleDock, removeUi, hubInstalled, maybePrompt });
  g.__SakaLuXDockRuntimeCurrent = api;
  try {
    const descriptor=Object.getOwnPropertyDescriptor(g,NS);
    if(!descriptor||descriptor.configurable){
      Object.defineProperty(g,NS,{configurable:true,enumerable:true,get(){return g.__SakaLuXDockRuntimeCurrent},set(value){if(value?.version&&cmpVersion(value.version,g.__SakaLuXDockRuntimeCurrent?.version)>=0)g.__SakaLuXDockRuntimeCurrent=value}});
    } else g[NS]=api;
  } catch { try { g[NS]=api; } catch {} }
})();"""
if end_old not in rt: raise SystemExit('runtime export anchor missing')
rt=rt.replace(end_old,end_new,1)
RUNTIME.write_text(rt,encoding='utf-8')

# Future releases of all standalone modules inherit the repaired runtime.
rb='/* SakaLuX Shared Dock Runtime — BEGIN */'; re_='/* SakaLuX Shared Dock Runtime — END */'
for name in ['SakaLuX-Enhancer-Guard.user.js','SakaLuX-Account-Auditor.user.js','SakaLuX-Mission-Rewards.user.js','SakaLuX-Bazaar-Thanker-PDA.user.js','SakaLuX-Bazaar-Smart-Pricer.user.js','SakaLuX-Elimination-Assistant.user.js','SakaLuX-Market-Intelligence.user.js','SakaLuX-Stock-Manager-Advisor.user.js','SakaLuX-Company-Intelligence-v1.0.0.user.js']:
    p=ROOT/name;t=p.read_text(encoding='utf-8');a=t.find(rb);b=t.find(re_,a)
    if a>=0 and b>=0:
        b+=len(re_);p.write_text(t[:a]+rb+'\n'+rt.rstrip()+'\n'+re_+t[b:],encoding='utf-8')

bh=BH.read_text(encoding='utf-8')
bh=bh.replace('@version      0.5.1','@version      0.5.2',1).replace("const VERSION='0.5.1'","const VERSION='0.5.2'",1).replace("let v = '0.5.1';","let v = '0.5.2';",1)
m=re.search(r"function mountChatButtons\(\)\{.*?\}\nfunction button\(\)\{.*?\}\nfunction paintChip",bh,re.S)
if not m: raise SystemExit('Bounty launcher block missing')
bh=bh[:m.start()]+"function removeLegacyLaunchers(){document.querySelectorAll('.slx-bh-chat-btn,#slx-bh-btn').forEach(e=>e.remove())}\nfunction button(){removeLegacyLaunchers()}\nfunction paintChip"+bh[m.end():]
bh=bh.replace("#slx-bh-btn{position:fixed;right:8px;bottom:128px;z-index:999999;background:#d7a94a;color:#111;border:0;border-radius:10px;width:42px;height:42px;font-size:19px;font-weight:900}.slx-bh-chat-btn{min-width:28px!important;width:28px!important;height:28px!important;min-height:28px!important;margin:0 3px!important;padding:0!important;border-radius:7px!important;font-size:14px!important;line-height:1!important}","",1)
bh=bh.replace("pruneCaches();window[API]={id:ID,version:VERSION,open,","pruneCaches();removeLegacyLaunchers();window[API]={id:ID,version:VERSION,open,",1)
old_tail="addEventListener('hashchange',()=>setTimeout(button,300));setInterval(()=>{button();mountChatButtons()},1800);dispatchEvent"
new_tail="addEventListener('hashchange',()=>setTimeout(removeLegacyLaunchers,300));try{globalThis.SakaLuXDockRuntime?.register?.({id:ID,name:'Bounty Hunter',icon:'🎯',version:VERSION,open:()=>open(),enabled:()=>S.enabled!==false})}catch{}dispatchEvent"
if old_tail not in bh: raise SystemExit('Bounty init tail anchor missing')
bh=bh.replace(old_tail,new_tail,1)
BH.write_text(bh,encoding='utf-8')

hub=HUB.read_text(encoding='utf-8')
hub=hub.replace('// @version      1.9.91','// @version      1.9.92',1)
hub=re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])1\.9\.91(['\"])",r"\g<1>1.9.92\2",hub,count=1)
cl="    const HUB_CHANGELOG = [\n"
hub=hub.replace(cl,cl+"        {version:'1.9.92',date:'2026-10-06',changes:['Fixes the shared Standalone Dock so it always starts closed, closes on route/outside tap/Escape and has an explicit close button.','Restores the canonical gold S standalone launcher styling and hardens the shared runtime against older embedded runtime overwrites.','Adds Bounty Hunter to Standalone Dock and removes Bounty Hunter chat/floating launch buttons.']},\n",1)
HUB.write_text(hub,encoding='utf-8')

data=json.loads(REG.read_text(encoding='utf-8'))
row=next(x for x in data['scripts'] if x.get('id')=='bounty-hunter')
row['version']='0.5.2';row['detailsRevision']=int(row.get('detailsRevision',0))+1
row['release']={'version':'0.5.2','date':'2026-10-06','notes':['Adds Bounty Hunter to the shared Standalone Dock as its only standalone launcher.','Removes the Bounty Hunter button from chat and the floating button from the Bounties page.','Shared Standalone Dock now starts closed and auto-closes on module launch, route change, outside tap or Escape.','Restores the compact canonical gold S standalone launcher and adds an explicit X close button.','Shared Dock Runtime v1.1.0 prevents older embedded runtime copies from overwriting the current runtime.']}
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8');note="""\n## Bounty Hunter v0.5.2 + Script Hub v1.9.92 — Standalone Dock repair
- Repairs Shared Standalone Dock open/close lifecycle and restores the canonical S launcher.
- Dock starts closed and auto-closes on module launch, route changes, outside taps and Escape.
- Adds an explicit X close control.
- Bounty Hunter is registered in the shared Standalone Dock.
- Removes Bounty Hunter chat and floating-page launch buttons.
- Shared Dock Runtime v1.1.0 protects the current runtime from older embedded copies loaded later.
"""
    if 'Bounty Hunter v0.5.2 + Script Hub v1.9.92' not in c:CHANGE.write_text(c.rstrip()+note+'\n',encoding='utf-8')

if BMD.exists():
    d=BMD.read_text(encoding='utf-8');d=re.sub(r'^\*\*v[^*]+\*\*','**v0.5.2**',d,count=1,flags=re.M)
    current="""## Current release note

**v0.5.2 — Shared Standalone Dock integration**
- Bounty Hunter now opens from the common SakaLuX Standalone Dock.
- Removes the extra Bounty Hunter button from chat and the floating Bounties-page button.
- Shared Standalone Dock starts closed and automatically closes after launching a module, on route changes, outside taps or Escape.
- Restores the compact gold S launcher and adds an explicit X close button.
"""
    if '## Current release note' in d:d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
    if '### v0.5.2' not in d:d=d.replace('## Changelog\n','## Changelog\n### v0.5.2 — Shared Standalone Dock integration\n- Adds Bounty Hunter to the common Standalone Dock.\n- Removes chat and floating Bounty Hunter launch buttons.\n- Includes Shared Dock Runtime v1.1.0 close/launcher fixes.\n\n',1)
    BMD.write_text(d,encoding='utf-8')

if HMD.exists():
    d=HMD.read_text(encoding='utf-8').replace('**v1.9.91**','**v1.9.92**',1).replace('Canonical version: **v1.9.91**','Canonical version: **v1.9.92**',1)
    entry="""### v1.9.92 — Standalone Dock repair
- Shared Standalone Dock starts closed and auto-closes on module open, route change, outside tap and Escape.
- Restores the canonical compact gold S launcher and adds an explicit X close button.
- Bounty Hunter joins Standalone Dock; its duplicate chat/floating launchers are removed.
- Shared Dock Runtime v1.1.0 rejects older runtime overwrites.

"""
    if '### v1.9.92' not in d:
        marker='## Changelog\n';d=d.replace(marker,marker+entry,1) if marker in d else d.rstrip()+'\n\n'+entry
    HMD.write_text(d,encoding='utf-8')

if SORTTEST.exists():
    t=SORTTEST.read_text(encoding='utf-8').replace("[[a,'1.9.91']","[[a,'1.9.92']");SORTTEST.write_text(t,encoding='utf-8')
if RTTEST.exists():
    t=RTTEST.read_text(encoding='utf-8')
    if "assert.equal(rt.version,'1.1.0');" not in t:t=t.replace("assert(rt);","assert(rt);assert.equal(rt.version,'1.1.0');",1)
    RTTEST.write_text(t,encoding='utf-8')
