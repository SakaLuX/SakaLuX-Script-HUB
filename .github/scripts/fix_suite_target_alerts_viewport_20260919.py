#!/usr/bin/env python3
from pathlib import Path
import re

root=Path(__file__).resolve().parents[2]
suite=root/'SakaLuX-Suite.user.js'
md=root/'greasyfork/SakaLuX-Suite.md'
s=suite.read_text(encoding='utf-8')
old=s

# Version bump for this UI fix only.
s=s.replace('// @version      0.9.931','// @version      0.9.932',1)
s=s.replace("const VERSION = '0.9.931';","const VERSION = '0.9.932';",1)

# Add a narrowly-scoped viewport contract for Target Alerts settings. The panel is appended
# directly to document.body, so fixed + 50% centering is stable regardless of Suite scroll.
marker="""body [id^=\"sakalux-\"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .card,body [id^=\"slx-\"] .card{border-color:var(--slx-border-soft);background:linear-gradient(180deg,rgba(19,28,39,.98),rgba(11,17,24,.98))}\n"""
css="""/* Suite v0.9.932 — Target Alerts settings viewport lock */
#sakalux-list-alert-settings-panel{
 position:fixed!important;
 top:max(8px,env(safe-area-inset-top,0px))!important;
 left:50%!important;
 right:auto!important;
 bottom:auto!important;
 transform:translateX(-50%)!important;
 width:min(520px,calc(100vw - 16px))!important;
 max-width:calc(100vw - 16px)!important;
 min-width:0!important;
 max-height:calc(100dvh - 16px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px))!important;
 overflow-y:auto!important;
 overflow-x:hidden!important;
 margin:0!important;
 box-sizing:border-box!important;
 overscroll-behavior:contain!important;
 z-index:2147483601!important;
}
#sakalux-list-alert-settings-backdrop{
 position:fixed!important;
 inset:0!important;
 width:100vw!important;
 height:100dvh!important;
 margin:0!important;
 z-index:2147483600!important;
}
@media(max-width:700px){
 #sakalux-list-alert-settings-panel{
  top:max(4px,env(safe-area-inset-top,0px))!important;
  width:calc(100vw - 8px)!important;
  max-width:calc(100vw - 8px)!important;
  max-height:calc(100dvh - 8px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px))!important;
  border-radius:12px!important;
 }
}
"""
if 'Suite v0.9.932 — Target Alerts settings viewport lock' not in s:
    if marker not in s:
        raise SystemExit('shared Suite CSS marker not found')
    s=s.replace(marker,marker+css,1)

# Defensive runtime correction as well: old inline popover coordinates must not survive.
# This is deliberately scoped to the Target Alerts settings panel only.
needle="panel.id = IDS.settingsPanel;"
if needle not in s:
    needle="panel.id=IDS.settingsPanel;"
if needle not in s:
    raise SystemExit('Target Alerts settings panel marker not found')
fix="""
        panel.style.removeProperty('left');
        panel.style.removeProperty('right');
        panel.style.removeProperty('top');
        panel.style.removeProperty('bottom');
        panel.style.removeProperty('transform');
"""
if "panel.style.removeProperty('left');" not in s[s.find(needle):s.find(needle)+1000]:
    s=s.replace(needle,needle+fix,1)

if s==old:
    raise SystemExit('no Suite changes made')
suite.write_text(s,encoding='utf-8')

# Keep the standalone Suite release surface synchronized. Suite intentionally stays out of scripts.json.
if md.exists():
    t=md.read_text(encoding='utf-8')
    t=t.replace('**v0.9.931**','**v0.9.932**',1)
    current=re.compile(r"\*\*v0\.9\.931 — Release documentation synchronized with the current Suite userscript version\*\*\n- Release documentation synchronized with the current Suite userscript version\.")
    t=current.sub("**v0.9.932 — Target Alerts mobile viewport fix**\n- Centers the Target Alerts Settings window inside the real browser viewport.\n- Prevents left/right clipping on TornPDA and keeps long settings scrollable inside the dialog.\n- Clears stale inline popover coordinates so Suite scrolling/navigation cannot push the dialog off-screen.",t,count=1)
    entry=("### v0.9.932 — Target Alerts mobile viewport fix\n"
           "- Centers the Target Alerts Settings window in the dynamic viewport on TornPDA and desktop.\n"
           "- Constrains width and height to the visible viewport with safe-area support and internal vertical scrolling.\n"
           "- Removes stale inline popover coordinates that could leave the settings panel partially outside the screen.\n\n")
    if '### v0.9.932 — Target Alerts mobile viewport fix' not in t:
        pos=t.find('## Release history / Changelog')
        if pos<0: raise SystemExit('Suite release-history marker not found')
        ins=t.find('\n',pos)+1
        t=t[:ins]+'\n'+entry+t[ins:]
    md.write_text(t,encoding='utf-8')

print('Suite Target Alerts viewport fixed -> v0.9.932')
