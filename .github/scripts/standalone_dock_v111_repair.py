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
rt=rt.replace("const VERSION = '1.1.0';","const VERSION = '1.1.1';",1)

# Restore the previous visual design: no separate X; the gold S in the panel header closes it.
rt=rt.replace(
'#${IDS.dock} .slx-dock-head{display:grid;grid-template-columns:28px 1fr 30px;gap:7px;align-items:center;margin-bottom:8px}\n#${IDS.dock} .slx-dock-mark{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:8px;background:#d79b49;color:#111;font:900 15px/1 Arial,sans-serif}\n#${IDS.dock} .slx-dock-close{display:flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#17212d;color:#eef3f8;font:900 18px/1 Arial,sans-serif}\n#${IDS.dock} .slx-dock-title{font-size:12px;font-weight:900;color:#f5f7fa}.slx-dock-sub{font-size:9px;color:#8d98a6}',
'#${IDS.dock} .slx-dock-head{display:grid;grid-template-columns:28px 1fr auto;gap:7px;align-items:center;margin-bottom:8px}\n#${IDS.dock} .slx-dock-mark{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:8px;background:#d79b49;color:#111;font:900 15px/1 Arial,sans-serif;cursor:pointer}\n#${IDS.dock} .slx-dock-title{font-size:12px;font-weight:900;color:#f5f7fa}.slx-dock-sub{font-size:9px;color:#8d98a6}',
1)

# Restore the original native S launcher look next to Torn cooldown icons.
rt=rt.replace(
'#${IDS.native}{display:flex!important;align-items:center!important;justify-content:center!important}#${IDS.native} .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:100%!important;min-width:28px!important;min-height:28px!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;box-shadow:none!important;font:900 16px/1 Arial,sans-serif!important;color:#e9a84d!important;text-decoration:none!important;text-indent:0!important;letter-spacing:0!important;cursor:pointer!important;touch-action:manipulation!important}#${IDS.native} .slx-s-link:before,#${IDS.native} .slx-s-link:after{content:none!important;display:none!important}',
'#${IDS.native}{display:flex!important;align-items:center!important;justify-content:center!important}#${IDS.native} .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;padding:0!important;margin:0!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;font:900 14px/28px Arial,sans-serif!important;color:#e9a84d!important;text-decoration:none!important;cursor:pointer!important;touch-action:manipulation!important}',
1)

old_head="""      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const mark = d.createElement('div'); mark.className = 'slx-dock-mark'; mark.textContent = 'S'; mark.setAttribute?.('aria-hidden','true');
      const titleBox = d.createElement('div');
      const title = d.createElement('div'); title.className = 'slx-dock-title'; title.textContent = 'SakaLuX Scripts';
      const sub = d.createElement('div'); sub.className = 'slx-dock-sub'; sub.textContent = 'Standalone';
      titleBox.appendChild(title); titleBox.appendChild(sub);
      const close = d.createElement('button'); close.type = 'button'; close.className = 'slx-dock-close'; close.textContent = '×'; close.title = 'Close'; close.setAttribute?.('aria-label','Close SakaLuX Scripts');
      close.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); };
      head.appendChild(mark); head.appendChild(titleBox); head.appendChild(close);"""
new_head="""      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const mark = d.createElement('button'); mark.type='button'; mark.className = 'slx-dock-mark'; mark.textContent = 'S'; mark.title='Close SakaLuX Scripts'; mark.setAttribute?.('aria-label','Close SakaLuX Scripts');
      mark.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); forceCloseDock(); };
      const title = d.createElement('div'); title.className = 'slx-dock-title'; title.textContent = 'SakaLuX Scripts';
      const sub = d.createElement('div'); sub.className = 'slx-dock-sub'; sub.textContent = 'Standalone';
      head.appendChild(mark); head.appendChild(title); head.appendChild(sub);"""
if old_head not in rt: raise SystemExit('v1.1.0 header block not found')
rt=rt.replace(old_head,new_head,1)
rt=rt.replace("    const close = panel.querySelector('.slx-dock-close'); if (close) close.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); };",
              "    const mark = panel.querySelector('.slx-dock-mark'); if (mark) mark.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); forceCloseDock(); };",1)

# Add hard DOM enforcement that also beats stale embedded runtimes from scripts the user has not updated yet.
anchor="  function armAutoClose() { clearTimeout(autoCloseTimer); if (!openState) return; autoCloseTimer = setTimeout(() => toggleDock(false), 6000); }"
extra=anchor+"""
  let userOpenUntil = 0;
  function markUserOpen(){ userOpenUntil = Date.now()+1600; }
  function forceCloseDock(){
    openState=false; clearTimeout(autoCloseTimer);
    const p=doc()?.getElementById(IDS.dock);
    if(p){p.dataset.open='0';p.hidden=true;p.style?.removeProperty?.('display')}
    try{localStorage.removeItem(OPEN_KEY)}catch{}
    return false;
  }
  function enforceClosedUnlessUserOpened(){
    const p=doc()?.getElementById(IDS.dock);
    if(!p)return;
    const visiblyOpen=p.dataset.open==='1'||p.hidden===false;
    if(visiblyOpen && Date.now()>userOpenUntil) forceCloseDock();
  }"""
if anchor not in rt: raise SystemExit('autoclose anchor missing')
rt=rt.replace(anchor,extra,1)

# Launcher click is always handled by the newest canonical runtime.
rt=rt.replace(
"      link.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(); };",
"      link.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); markUserOpen(); toggleDock(); };",
1)
rt=rt.replace(
"      button.addEventListener?.('click', () => toggleDock());",
"      button.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); markUserOpen(); toggleDock(); });",
1)

# Explicit opens are user-intended; forced closes never persist.
old_toggle="""    const next = typeof force === 'boolean' ? force : panel.dataset.open !== '1';
    panel.dataset.open = next ? '1' : '0';
    panel.hidden = !next;
    writeOpen(next);
    if (next) armAutoClose(); else clearTimeout(autoCloseTimer);
    return next;"""
new_toggle="""    const next = typeof force === 'boolean' ? force : panel.dataset.open !== '1';
    if(next){ markUserOpen(); panel.dataset.open='1'; panel.hidden=false; writeOpen(true); armAutoClose(); }
    else { forceCloseDock(); }
    return next;"""
if old_toggle not in rt: raise SystemExit('toggle block missing')
rt=rt.replace(old_toggle,new_toggle,1)

# On every render/init it is closed unless an actual user launcher click just occurred.
rt=rt.replace("    panel.hidden = panel.dataset.open !== '1';\n    return panel;",
              "    if(Date.now()>userOpenUntil) forceCloseDock(); else panel.hidden = panel.dataset.open !== '1';\n    return panel;",1)

# Capture-phase protection: native launcher works even if a stale runtime attached a broken handler;
# outside touch closes even a panel created by an old runtime.
bind_anchor="    try { g.addEventListener?.('SakaLuX:ScriptHubReady', () => removeUi(), { passive: true }); } catch {}"
bind_extra=bind_anchor+"""
    try { doc()?.addEventListener?.('click', e => {
      const launcher=e?.target?.closest?.('#'+IDS.native+' .slx-s-link,#'+IDS.fallback);
      if(launcher){e.preventDefault?.();e.stopPropagation?.();e.stopImmediatePropagation?.();markUserOpen();toggleDock();return}
    }, true); } catch {}"""
if bind_anchor not in rt: raise SystemExit('bind anchor missing')
rt=rt.replace(bind_anchor,bind_extra,1)

old_ptr="    try { doc()?.addEventListener?.('pointerdown', e => { const panel=doc()?.getElementById(IDS.dock); if (!panel || panel.dataset.open!=='1') return; const t=e?.target; if (t?.closest?.('#'+IDS.dock+',#'+IDS.native+',#'+IDS.fallback)) return; toggleDock(false); }, true); } catch {}"
new_ptr="    try { doc()?.addEventListener?.('pointerdown', e => { const panel=doc()?.getElementById(IDS.dock); if (!panel || (panel.dataset.open!=='1'&&panel.hidden!==false)) return; const t=e?.target; if (t?.closest?.('#'+IDS.dock+',#'+IDS.native+',#'+IDS.fallback)) return; forceCloseDock(); }, true); } catch {}"
if old_ptr not in rt: raise SystemExit('pointer listener missing')
rt=rt.replace(old_ptr,new_ptr,1)

# Mutation observer actively corrects old runtimes reopening/recreating the panel.
old_obs="""        observer = new MutationObserver(records => {
          if (core()?.perf?.unrelated?.(records)) return;
          scheduleRefresh(240);
        });"""
new_obs="""        observer = new MutationObserver(records => {
          enforceClosedUnlessUserOpened();
          if (core()?.perf?.unrelated?.(records)) return;
          scheduleRefresh(240);
        });"""
if old_obs not in rt: raise SystemExit('observer block missing')
rt=rt.replace(old_obs,new_obs,1)

# Route and startup always hard-close.
rt=rt.replace("      core()?.router?.onChange?.(() => { toggleDock(false); scheduleRefresh(180); });",
              "      core()?.router?.onChange?.(() => { forceCloseDock(); scheduleRefresh(180); });",1)
rt=rt.replace("    modules.set(normalized.id, normalized); // latest registration wins\n    render();",
              "    modules.set(normalized.id, normalized); // latest registration wins\n    forceCloseDock();\n    render();",1)

RT.write_text(rt,encoding='utf-8')

# Bounty v0.5.4 and only Standalone registration.
bh=BH.read_text(encoding='utf-8')
bh=bh.replace('@version      0.5.3','@version      0.5.4',1)
bh=bh.replace("const VERSION='0.5.3'","const VERSION='0.5.4'",1)
bh=bh.replace("let v = '0.5.3';","let v = '0.5.4';",1)
BH.write_text(bh,encoding='utf-8')

# Hub v1.9.93 changelog.
hub=HUB.read_text(encoding='utf-8')
hub=hub.replace('// @version      1.9.92','// @version      1.9.93',1)
hub=re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])1\.9\.92(['\"])",r"\g<1>1.9.93\2",hub,count=1)
cl="    const HUB_CHANGELOG = [\n"
if cl in hub and "version:'1.9.93'" not in hub:
    hub=hub.replace(cl,cl+"        {version:'1.9.93',date:'2026-10-06',changes:['Shared Standalone Dock v1.1.1 restores the previous panel logo/header design and original native S launcher styling.','Adds a canonical capture-phase launcher handler and DOM enforcer so stale embedded dock runtimes cannot leave Standalone open or break outside-tap close.','Standalone now hard-closes on startup, registration, route change, outside tap, module launch and timeout; Bounty Hunter v0.5.4 remains Dock-only.']},\n",1)
HUB.write_text(hub,encoding='utf-8')

# Registry + docs.
data=json.loads(REG.read_text(encoding='utf-8'))
row=next(x for x in data['scripts'] if x.get('id')=='bounty-hunter')
row['version']='0.5.4'; row['detailsRevision']=int(row.get('detailsRevision',0))+1
row['release']={'version':'0.5.4','date':'2026-10-06','notes':[
'Shared Standalone Dock v1.1.1 restores the previous header/logo appearance and original native S launcher styling.',
'Adds a hard close enforcer that also corrects stale older dock runtimes loaded by other installed scripts.',
'Standalone starts closed and closes on outside tap, module launch, route change, Escape and timeout.',
'Bounty Hunter remains Standalone-Dock only with no chat or floating page launcher.'
]}
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8')
    note="""\n## Bounty Hunter v0.5.4 + Script Hub v1.9.93 — Standalone Dock v1.1.1
- Restores the previous Standalone panel header/logo design; removes the separate X button.
- Restores the original compact native S launcher styling beside Torn status/cooldown icons.
- Adds capture-phase launcher handling so the S button works even if an older installed userscript injected stale handlers.
- Adds a DOM close enforcer so stale runtimes cannot reopen/leave the panel open.
- Hard-closes on startup, registration, route change, outside tap, module launch, Escape and timeout.
- Bounty Hunter remains Dock-only; no chat or floating Bounties launcher.
"""
    if 'Bounty Hunter v0.5.4 + Script Hub v1.9.93' not in c: CHANGE.write_text(c.rstrip()+note+'\n',encoding='utf-8')

if BMD.exists():
    d=BMD.read_text(encoding='utf-8')
    d=re.sub(r'^\*\*v[^*]+\*\*','**v0.5.4**',d,count=1,flags=re.M)
    current="""## Current release note

**v0.5.4 — Standalone Dock v1.1.1 compatibility repair**
- Restores the previous Standalone panel header/logo and native Torn-style S launcher.
- Removes the separate X control; the original S mark in the panel header can close the panel.
- Adds hard close enforcement so older installed SakaLuX scripts cannot leave the shared panel open.
- The native S launcher is handled by the newest runtime even if stale scripts attached older click handlers.
- Bounty Hunter remains available only through the shared Standalone Dock when Hub is absent.
"""
    if '## Current release note' in d:
        d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
    if '### v0.5.4' not in d:
        d=d.replace('## Changelog\n','## Changelog\n### v0.5.4 — Standalone Dock v1.1.1 compatibility repair\n- Restores the old logo/header and native S launcher visuals.\n- Adds stale-runtime protection and hard outside-tap/startup close enforcement.\n- Keeps Bounty Hunter Dock-only.\n\n',1)
    BMD.write_text(d,encoding='utf-8')

if HMD.exists():
    d=HMD.read_text(encoding='utf-8')
    d=d.replace('**v1.9.92**','**v1.9.93**',1).replace('Canonical version: **v1.9.92**','Canonical version: **v1.9.93**',1)
    entry="""### v1.9.93 — Standalone Dock v1.1.1 compatibility repair
- Restores the previous panel logo/header and native status-bar S launcher visuals.
- Removes the separate X button.
- Adds hard-close enforcement and capture-phase launcher handling against stale older embedded runtimes.
- Standalone starts closed and closes on outside tap, module launch, route change, Escape and timeout.

"""
    if '### v1.9.93' not in d:
        marker='## Changelog\n'; d=d.replace(marker,marker+entry,1) if marker in d else d.rstrip()+'\n\n'+entry
    HMD.write_text(d,encoding='utf-8')
