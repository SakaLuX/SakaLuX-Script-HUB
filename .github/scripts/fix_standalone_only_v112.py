from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
RT=ROOT/'src/core/sakalux-dock-runtime.js'

rt=RT.read_text(encoding='utf-8')
rt=rt.replace("const VERSION = '1.1.1';","const VERSION = '1.1.2';",1)

# Do not use the panel logo as a close control; restore it as a plain visual mark.
old="""      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const mark = d.createElement('button'); mark.type='button'; mark.className = 'slx-dock-mark'; mark.textContent = 'S'; mark.title='Close SakaLuX Scripts'; mark.setAttribute?.('aria-label','Close SakaLuX Scripts');
      mark.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); forceCloseDock(); };
      const title = d.createElement('div'); title.className = 'slx-dock-title'; title.textContent = 'SakaLuX Scripts';
      const sub = d.createElement('div'); sub.className = 'slx-dock-sub'; sub.textContent = 'Standalone';
      head.appendChild(mark); head.appendChild(title); head.appendChild(sub);"""
new="""      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const mark = d.createElement('div'); mark.className = 'slx-dock-mark'; mark.textContent = 'S'; mark.setAttribute?.('aria-hidden','true');
      const title = d.createElement('div'); title.className = 'slx-dock-title'; title.textContent = 'SakaLuX Scripts';
      const sub = d.createElement('div'); sub.className = 'slx-dock-sub'; sub.textContent = 'Standalone';
      head.appendChild(mark); head.appendChild(title); head.appendChild(sub);"""
if old not in rt: raise SystemExit('header block not found')
rt=rt.replace(old,new,1)
rt=rt.replace("    const mark = panel.querySelector('.slx-dock-mark'); if (mark) mark.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); forceCloseDock(); };\n","",1)

# Native S is the ONLY open/close control. A click toggles, and cannot be eaten by old runtimes.
# Keep an explicit "user opened" flag instead of a time window that can leave it open during rerenders.
rt=rt.replace("  let userOpenUntil = 0;\n  function markUserOpen(){ userOpenUntil = Date.now()+1600; }",
              "  let userOpened = false;\n  function markUserOpen(){ userOpened = true; }",1)
rt=rt.replace("    if(visiblyOpen && Date.now()>userOpenUntil) forceCloseDock();",
              "    if(visiblyOpen && !userOpened) forceCloseDock();",1)
rt=rt.replace("    if(Date.now()>userOpenUntil) forceCloseDock(); else panel.hidden = panel.dataset.open !== '1';",
              "    if(!userOpened) forceCloseDock(); else panel.hidden = panel.dataset.open !== '1';",1)

# force close also resets the user-open flag.
rt=rt.replace("  function forceCloseDock(){\n    openState=false; clearTimeout(autoCloseTimer);",
              "  function forceCloseDock(){\n    userOpened=false; openState=false; clearTimeout(autoCloseTimer);",1)

# Toggle logic: only explicit launcher clicks can open; forced/programmatic renders never do.
old_toggle="""    const next = typeof force === 'boolean' ? force : panel.dataset.open !== '1';
    if(next){ markUserOpen(); panel.dataset.open='1'; panel.hidden=false; writeOpen(true); armAutoClose(); }
    else { forceCloseDock(); }
    return next;"""
new_toggle="""    const next = typeof force === 'boolean' ? force : panel.dataset.open !== '1';
    if(next){ userOpened=true; panel.dataset.open='1'; panel.hidden=false; writeOpen(true); armAutoClose(); }
    else forceCloseDock();
    return next;"""
if old_toggle not in rt: raise SystemExit('toggle block not found')
rt=rt.replace(old_toggle,new_toggle,1)

# Replace launcher onclick assignment with no bubble handler; capture handler below is canonical.
rt=rt.replace("      link.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); markUserOpen(); toggleDock(); };",
              "      link.onclick = null;",1)
rt=rt.replace("      button.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); markUserOpen(); toggleDock(); });",
              "      button.onclick = null;",1)

# Robust close for mobile: pointer/touch/mouse/click capture. Clicking native S toggles.
# This replaces the previous single pointerdown + separate click launcher handler.
old_bind="""    try { doc()?.addEventListener?.('click', e => {
      const launcher=e?.target?.closest?.('#'+IDS.native+' .slx-s-link,#'+IDS.fallback);
      if(launcher){e.preventDefault?.();e.stopPropagation?.();e.stopImmediatePropagation?.();markUserOpen();toggleDock();return}
    }, true); } catch {}
    try { doc()?.addEventListener?.('pointerdown', e => { const panel=doc()?.getElementById(IDS.dock); if (!panel || (panel.dataset.open!=='1'&&panel.hidden!==false)) return; const t=e?.target; if (t?.closest?.('#'+IDS.dock+',#'+IDS.native+',#'+IDS.fallback)) return; forceCloseDock(); }, true); } catch {}
    try { g.addEventListener?.('keydown',e=>{if(e?.key==='Escape')toggleDock(false)},{passive:true}); } catch {}"""
new_bind="""    try {
      const outsideClose = e => {
        const d=doc(), panel=d?.getElementById(IDS.dock), t=e?.target;
        const launcher=t?.closest?.('#'+IDS.native+' .slx-s-link,#'+IDS.fallback);
        if(launcher){
          if(e.type==='click'){
            e.preventDefault?.();e.stopPropagation?.();e.stopImmediatePropagation?.();
            const isOpen=panel?.dataset.open==='1'&&panel.hidden===false;
            if(isOpen) forceCloseDock(); else { markUserOpen(); toggleDock(true); }
          }
          return;
        }
        if(!panel || (panel.dataset.open!=='1'&&panel.hidden!==false)) return;
        if(t?.closest?.('#'+IDS.dock)) return;
        forceCloseDock();
      };
      for(const ev of ['pointerdown','touchstart','mousedown','click']) doc()?.addEventListener?.(ev,outsideClose,true);
    } catch {}
    try { g.addEventListener?.('keydown',e=>{if(e?.key==='Escape')forceCloseDock()},{passive:true}); } catch {}"""
if old_bind not in rt: raise SystemExit('bind block not found')
rt=rt.replace(old_bind,new_bind,1)

# Never let registration/open state leak across page boot.
rt=rt.replace("    forceCloseDock();\n    render();\n    bindRuntimeSignals();",
              "    forceCloseDock();\n    render();\n    forceCloseDock();\n    bindRuntimeSignals();",1)

# Mutation observer must close stale old-runtime opens immediately, not just schedule.
rt=rt.replace("          enforceClosedUnlessUserOpened();\n          if (core()?.perf?.unrelated?.(records)) return;",
              "          enforceClosedUnlessUserOpened();\n          if(!userOpened) forceCloseDock();\n          if (core()?.perf?.unrelated?.(records)) return;",1)

RT.write_text(rt,encoding='utf-8')
