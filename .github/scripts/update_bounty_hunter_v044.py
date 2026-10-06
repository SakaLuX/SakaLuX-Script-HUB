from pathlib import Path
import json,re

corep=Path('src/core/sakalux-core.js')
core=corep.read_text()
core=core.replace("const CORE_VERSION = '1.1.0';","const CORE_VERSION = '1.2.0';",1)

anchor="""  const ui = {
    ensureSharedSkin() {"""
if anchor not in core:
    raise SystemExit('ui anchor missing')
core=core.replace(anchor,"""  const ui = {
    applyWorkspaceLayout(overlay, panel, options = {}) {
      if (!overlay || !panel || typeof window === 'undefined') return null;
      const top = Math.max(0, Number(options.top ?? 8));
      const bottom = Math.max(0, Number(options.bottom ?? 92));
      const side = Math.max(0, Number(options.side ?? 4));
      const maxWidth = Math.max(240, Number(options.maxWidth ?? 760));
      const apply = () => {
        const vv = window.visualViewport;
        const width = Math.max(0, Number(vv?.width || window.innerWidth || 0));
        const height = Math.max(0, Number(vv?.height || window.innerHeight || 0));
        const offsetTop = Math.max(0, Number(vv?.offsetTop || 0));
        const offsetLeft = Math.max(0, Number(vv?.offsetLeft || 0));
        Object.assign(overlay.style, {
          position: 'fixed',
          inset: '0px',
          width: 'auto',
          height: 'auto',
          maxHeight: 'none',
          display: 'block'
        });
        const usable = Math.max(240, height - top - bottom);
        const panelWidth = Math.min(maxWidth, Math.max(240, width - side * 2));
        Object.assign(panel.style, {
          position: 'fixed',
          top: (offsetTop + top) + 'px',
          bottom: 'auto',
          left: (offsetLeft + Math.max(side, (width - panelWidth) / 2)) + 'px',
          width: panelWidth + 'px',
          height: usable + 'px',
          maxHeight: usable + 'px',
          margin: '0',
          boxSizing: 'border-box'
        });
      };
      apply();
      const vv = window.visualViewport;
      vv?.addEventListener?.('resize', apply);
      vv?.addEventListener?.('scroll', apply);
      window.addEventListener?.('resize', apply);
      return () => {
        vv?.removeEventListener?.('resize', apply);
        vv?.removeEventListener?.('scroll', apply);
        window.removeEventListener?.('resize', apply);
      };
    },
    ensureSharedSkin() {""",1)
corep.write_text(core)

bh=Path('SakaLuX-Bounty-Hunter.user.js')
s=bh.read_text()
s=s.replace('@version      0.4.3','@version      0.4.4',1)
s=s.replace("const VERSION='0.4.3'","const VERSION='0.4.4'",1)

# Remove the v0.4.3 mobile geometry override; Shared Core now owns workspace geometry.
old="@media(max-width:520px){#slx-bh{width:auto!important;height:auto!important;max-height:none!important;border-radius:0!important;inset:0!important;align-items:flex-end!important;justify-content:center!important}#slx-bh>section{width:calc(100vw - 8px)!important;max-width:none!important;height:calc(100dvh - 72px)!important;max-height:calc(100dvh - 72px)!important;border-radius:16px 16px 0 0!important}#slx-bh .head{min-height:52px!important;padding:8px 10px!important}#slx-bh .slx-bh-list{padding:7px 8px 8px!important;gap:7px!important;flex:1 1 auto!important;min-height:0!important;overflow:auto!important}#slx-bh .slx-bh-list>div{padding:9px 10px!important;border-radius:12px!important}#slx-bh .slx-bh-settings{margin:6px 8px 8px!important;padding:8px!important;max-height:54dvh!important;overflow:auto!important}#slx-bh [data-filters]{margin:7px 8px!important;width:calc(100% - 16px)!important}}"
new="@media(max-width:520px){#slx-bh>section{border-radius:16px!important}#slx-bh .head{min-height:52px!important;padding:8px 10px!important}#slx-bh .slx-bh-list{padding:7px 8px 8px!important;gap:7px!important;flex:1 1 auto!important;min-height:0!important;overflow:auto!important}#slx-bh .slx-bh-list>div{padding:9px 10px!important;border-radius:12px!important}#slx-bh .slx-bh-settings{margin:6px 8px 8px!important;padding:8px!important;max-height:54dvh!important;overflow:auto!important}#slx-bh [data-filters]{margin:7px 8px!important;width:calc(100% - 16px)!important}}"
if old not in s:
    raise SystemExit('v043 mobile anchor missing')
s=s.replace(old,new,1)

# Call Shared Core workspace geometry immediately after mounting.
needle="document.body.appendChild(o);o.querySelector('[data-x]').onclick=()=>o.remove();"
repl="document.body.appendChild(o);try{const panel=o.querySelector(':scope > section');o._slxWorkspaceCleanup=CORE?.ui?.applyWorkspaceLayout?.(o,panel,{top:8,bottom:92,side:4,maxWidth:760})||null}catch{};o.querySelector('[data-x]').onclick=()=>{try{o._slxWorkspaceCleanup?.()}catch{}o.remove()};"
if needle not in s:
    raise SystemExit('open mount anchor missing')
s=s.replace(needle,repl,1)

# Overlay click cleanup too.
s=s.replace("o.addEventListener('click',e=>{if(e.target===o)o.remove()});","o.addEventListener('click',e=>{if(e.target===o){try{o._slxWorkspaceCleanup?.()}catch{}o.remove()}});",1)
bh.write_text(s)

# re-embed updated Shared Core into Bounty Hunter
