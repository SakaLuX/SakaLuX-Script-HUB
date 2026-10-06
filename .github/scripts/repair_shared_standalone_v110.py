from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
RT=ROOT/'src/core/sakalux-dock-runtime.js'
BH=ROOT/'SakaLuX-Bounty-Hunter.user.js'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG.md'
BMD=ROOT/'greasyfork/Bounty-Hunter.md'
HMD=ROOT/'greasyfork/Script-Hub.md'

rt=RT.read_text(encoding='utf-8')
rt=rt.replace("const VERSION = '1.0.1';","const VERSION = '1.1.0';",1)

rt=rt.replace(
"  if (g[NS]?.version === VERSION) return;\n  try { if (g[NS] && g[NS].version !== VERSION) g[NS].removeUi?.(); } catch {}",
"""  function versionParts(v){return String(v||'0').match(/\\d+/g)?.map(Number)||[0]}
  function compareVersion(a,b){const x=versionParts(a),y=versionParts(b);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0?1:-1}return 0}
  const currentRuntime=g.__SakaLuXDockRuntimeCurrent||g[NS];
  if(currentRuntime?.version&&compareVersion(currentRuntime.version,VERSION)>=0)return;
  try { currentRuntime?.removeUi?.(); } catch {}""",1)

rt=rt.replace("  let openState = false;\n  let autoCloseTimer = 0;\n  function readOpen() { return openState; }\n  function writeOpen(value) { openState = Boolean(value); try { localStorage.removeItem(OPEN_KEY); } catch {} }\n  function armAutoClose() { clearTimeout(autoCloseTimer); if (!openState) return; autoCloseTimer = setTimeout(() => toggleDock(false), 8000); }",
"""  let openState = false;
  let autoCloseTimer = 0;
  function readOpen() { return false; }
  function writeOpen(value) { openState = Boolean(value); try { localStorage.removeItem(OPEN_KEY); } catch {} }
  function armAutoClose() { clearTimeout(autoCloseTimer); if (!openState) return; autoCloseTimer = setTimeout(() => toggleDock(false), 6000); }""",1)

rt=rt.replace(
'#${IDS.dock} .slx-dock-head{display:grid;grid-template-columns:28px 1fr auto;gap:7px;align-items:center;margin-bottom:8px}\n#${IDS.dock} .slx-dock-mark{width:28px;height:28px;border:0;border-radius:8px;background:#d79b49;color:#111;font-weight:900}\n#${IDS.dock} .slx-dock-title{font-size:12px;font-weight:900;color:#f5f7fa}.slx-dock-sub{font-size:9px;color:#8d98a6}',
'#${IDS.dock} .slx-dock-head{display:grid;grid-template-columns:28px 1fr 30px;gap:7px;align-items:center;margin-bottom:8px}\n#${IDS.dock} .slx-dock-mark{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:8px;background:#d79b49;color:#111;font:900 15px/1 Arial,sans-serif}\n#${IDS.dock} .slx-dock-close{display:flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#17212d;color:#eef3f8;font:900 18px/1 Arial,sans-serif}\n#${IDS.dock} .slx-dock-title{font-size:12px;font-weight:900;color:#f5f7fa}.slx-dock-sub{font-size:9px;color:#8d98a6}',
1)

rt=rt.replace(
'#${IDS.native}{display:flex!important;align-items:center!important;justify-content:center!important}#${IDS.native} .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;padding:0!important;margin:0!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;font:900 14px/28px Arial,sans-serif!important;color:#e9a84d!important;text-decoration:none!important;cursor:pointer!important;touch-action:manipulation!important}',
'#${IDS.native}{display:flex!important;align-items:center!important;justify-content:center!important}#${IDS.native} .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:100%!important;min-width:28px!important;min-height:28px!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;box-shadow:none!important;font:900 16px/1 Arial,sans-serif!important;color:#e9a84d!important;text-decoration:none!important;text-indent:0!important;letter-spacing:0!important;cursor:pointer!important;touch-action:manipulation!important}#${IDS.native} .slx-s-link:before,#${IDS.native} .slx-s-link:after{content:none!important;display:none!important}',
1)

old="""      panel.dataset.open = '0';
      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const close = d.createElement('button'); close.type = 'button'; close.className = 'slx-dock-mark'; close.textContent = 'S'; close.title = 'Close SakaLuX Scripts';
      close.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); };
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
      const close = d.createElement('button'); close.type = 'button'; close.className = 'slx-dock-close'; close.textContent = '×'; close.title = 'Close'; close.setAttribute?.('aria-label','Close SakaLuX Scripts');
      close.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); };
      head.appendChild(mark); head.appendChild(titleBox); head.appendChild(close);"""
if old not in rt: raise SystemExit('ensureDock old header block not found')
rt=rt.replace(old,new,1)
rt=rt.replace("    const close = panel.querySelector('.slx-dock-mark'); if (close) close.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); };",
              "    const close = panel.querySelector('.slx-dock-close'); if (close) close.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); };",1)

rt=rt.replace(
"    try { doc()?.addEventListener?.('pointerdown', e => { if (!openState) return; const t=e?.target; if (t?.closest?.('#'+IDS.dock+',#'+IDS.native+',#'+IDS.fallback)) return; toggleDock(false); }, true); } catch {}",
"""    try { doc()?.addEventListener?.('pointerdown', e => { const panel=doc()?.getElementById(IDS.dock); if (!panel || panel.dataset.open!=='1') return; const t=e?.target; if (t?.closest?.('#'+IDS.dock+',#'+IDS.native+',#'+IDS.fallback)) return; toggleDock(false); }, true); } catch {}
    try { g.addEventListener?.('keydown',e=>{if(e?.key==='Escape')toggleDock(false)},{passive:true}); } catch {}""",1)

old_export="""  const api = Object.freeze({ version: VERSION, ids: IDS, register, unregister, list, render, toggleDock, removeUi, hubInstalled, maybePrompt });
  g[NS] = api;
})();"""
new_export="""  const api = Object.freeze({ version: VERSION, ids: IDS, register, unregister, list, render, toggleDock, removeUi, hubInstalled, maybePrompt });
  g.__SakaLuXDockRuntimeCurrent = api;
  try {
    const desc=Object.getOwnPropertyDescriptor(g,NS);
    if(!desc||desc.configurable){
      Object.defineProperty(g,NS,{configurable:true,enumerable:true,get(){return g.__SakaLuXDockRuntimeCurrent},set(v){if(v?.version&&compareVersion(v.version,g.__SakaLuXDockRuntimeCurrent?.version)>=0)g.__SakaLuXDockRuntimeCurrent=v}});
    } else g[NS]=api;
  } catch { try { g[NS]=api; } catch {} }
})();"""
if old_export not in rt: raise SystemExit('runtime export block not found')
rt=rt.replace(old_export,new_export,1)
RT.write_text(rt,encoding='utf-8')

# Bounty v0.5.3
bh=BH.read_text(encoding='utf-8')
bh=bh.replace('@version      0.5.2','@version      0.5.3',1)
bh=bh.replace("const VERSION='0.5.2'","const VERSION='0.5.3'",1)
bh=bh.replace("let v = '0.5.2';","let v = '0.5.3';",1)
bh=bh.replace("version:'0.5.2'","version:'0.5.3'",1)
# Legacy Bounty launchers must only be removed, never mounted.
bh=bh.replace("function mountChatButtons(){document.querySelectorAll('.slx-bh-chat-btn').forEach(x=>x.remove());return 0}\nfunction button(){document.getElementById('slx-bh-btn')?.remove();document.querySelectorAll('.slx-bh-chat-btn').forEach(x=>x.remove())}",
"""function removeLegacyLaunchers(){document.getElementById('slx-bh-btn')?.remove();document.querySelectorAll('.slx-bh-chat-btn').forEach(x=>x.remove())}
function button(){removeLegacyLaunchers()}""",1)
bh=bh.replace("function init(){ensureCss();button();bridge();schedule();pruneCaches();",
              "function init(){ensureCss();removeLegacyLaunchers();bridge();schedule();pruneCaches();",1)
BH.write_text(bh,encoding='utf-8')

# Hub release bump for shared runtime integration.
hub=HUB.read_text(encoding='utf-8')
hub=hub.replace('// @version      1.9.91','// @version      1.9.92',1)
hub=re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])1\.9\.91(['\"])",r"\g<1>1.9.92\2",hub,count=1)
anchor="    const HUB_CHANGELOG = [\n"
if anchor in hub and "version:'1.9.92'" not in hub:
    hub=hub.replace(anchor,anchor+"        {version:'1.9.92',date:'2026-10-06',changes:['Rebuilds Shared Standalone Dock runtime v1.1.0 across every managed standalone userscript.','Standalone now always starts closed, has a dedicated X close control, closes on outside tap, Escape, route change, module launch and after six seconds.','Protects the newest shared runtime from older embedded runtime copies loaded by another userscript.','Bounty Hunter v0.5.3 remains Dock-only and removes its legacy chat/floating launchers.']},\n",1)
HUB.write_text(hub,encoding='utf-8')

# registry
data=json.loads(REG.read_text(encoding='utf-8'))
row=next(x for x in data['scripts'] if x.get('id')=='bounty-hunter')
row['version']='0.5.3'
row['detailsRevision']=int(row.get('detailsRevision',0))+1
row['release']={'version':'0.5.3','date':'2026-10-06','notes':[
'Moves Bounty Hunter exclusively into Shared Standalone Dock and removes any legacy chat/floating launchers.',
'Ships Shared Dock Runtime v1.1.0 with deterministic closed startup and dedicated X close control.',
'Standalone closes on outside tap, Escape, route change, module launch, or six-second idle timeout.',
'Newest runtime is protected from older embedded dock runtimes loaded by another SakaLuX userscript.'
]}
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8')
    note="""\n## Bounty Hunter v0.5.3 + Script Hub v1.9.92 — Shared Standalone Dock v1.1.0
- Audits and rebuilds the Standalone Dock runtime used by every managed standalone SakaLuX userscript.
- Dock now always starts closed instead of inheriting a stale open state.
- Adds a dedicated X close button and restores the compact native gold S launcher.
- Closes on module launch, route change, outside tap, Escape and a six-second idle timeout.
- Protects runtime v1.1.0 from older embedded dock copies loaded later by other scripts.
- Bounty Hunter remains Dock-only; legacy chat and floating page launchers are removed.
"""
    if 'Bounty Hunter v0.5.3 + Script Hub v1.9.92' not in c: CHANGE.write_text(c.rstrip()+note+'\n',encoding='utf-8')

if BMD.exists():
    d=BMD.read_text(encoding='utf-8')
    d=re.sub(r'^\*\*v[^*]+\*\*','**v0.5.3**',d,count=1,flags=re.M)
    current="""## Current release note

**v0.5.3 — Standalone Dock v1.1.0 repair**
- Bounty Hunter is available only through the common SakaLuX Standalone Dock when Hub is absent.
- Removes legacy Bounty chat/floating launchers.
- Dock always starts closed, has a dedicated X close control and auto-closes after six seconds.
- Also closes on outside tap, Escape, route change or module launch.
- Protects the newest Dock Runtime from older embedded copies loaded by another SakaLuX script.
"""
    if '## Current release note' in d:
        d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
    if '### v0.5.3' not in d:
        d=d.replace('## Changelog\n','## Changelog\n### v0.5.3 — Standalone Dock v1.1.0 repair\n- Rebuilds the shared standalone lifecycle and close behavior.\n- Keeps Bounty Hunter Dock-only and removes duplicate launchers.\n- Protects the newest shared runtime from older embedded copies.\n\n',1)
    BMD.write_text(d,encoding='utf-8')

if HMD.exists():
    d=HMD.read_text(encoding='utf-8')
    d=d.replace('**v1.9.91**','**v1.9.92**',1)
    d=d.replace('Canonical version: **v1.9.91**','Canonical version: **v1.9.92**',1)
    entry="""### v1.9.92 — Shared Standalone Dock v1.1.0
- Rebuilds the common Standalone Dock runtime used by all managed standalone scripts.
- Dock starts closed and closes on module launch, route changes, outside taps, Escape or a six-second timeout.
- Adds an explicit X close control and restores the native gold S launcher.
- Newer runtime copies cannot be overwritten by older embedded runtime versions.
- Bounty Hunter v0.5.3 is Dock-only with legacy launch buttons removed.

"""
    if '### v1.9.92' not in d:
        marker='## Changelog\n'
        d=d.replace(marker,marker+entry,1) if marker in d else d.rstrip()+'\n\n'+entry
    HMD.write_text(d,encoding='utf-8')
