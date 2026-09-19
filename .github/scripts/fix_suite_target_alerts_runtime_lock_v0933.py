#!/usr/bin/env python3
from pathlib import Path
import re

root=Path(__file__).resolve().parents[2]
suite=root/'SakaLuX-Suite.user.js'
md=root/'greasyfork/SakaLuX-Suite.md'
s=suite.read_text(encoding='utf-8')
old=s

s=s.replace('// @version      0.9.932','// @version      0.9.933',1)
s=s.replace("const VERSION = '0.9.932';","const VERSION = '0.9.933';",1)

marker='    function createSettingsPanel() {'
helper='''    function applyTargetAlertsViewportLock(panel) {\n        if (!panel) return;\n        const mobile = window.matchMedia?.('(max-width: 700px)')?.matches ?? (window.innerWidth <= 700);\n        panel.style.setProperty('position', 'fixed', 'important');\n        panel.style.setProperty('top', mobile ? '4px' : '8px', 'important');\n        panel.style.setProperty('left', '50vw', 'important');\n        panel.style.setProperty('right', 'auto', 'important');\n        panel.style.setProperty('bottom', 'auto', 'important');\n        panel.style.setProperty('transform', 'translateX(-50%)', 'important');\n        panel.style.setProperty('width', mobile ? 'calc(100vw - 8px)' : 'min(520px, calc(100vw - 16px))', 'important');\n        panel.style.setProperty('max-width', mobile ? 'calc(100vw - 8px)' : 'calc(100vw - 16px)', 'important');\n        panel.style.setProperty('min-width', '0', 'important');\n        panel.style.setProperty('max-height', mobile ? 'calc(100dvh - 8px)' : 'calc(100dvh - 16px)', 'important');\n        panel.style.setProperty('overflow-y', 'auto', 'important');\n        panel.style.setProperty('overflow-x', 'hidden', 'important');\n        panel.style.setProperty('margin', '0', 'important');\n        panel.style.setProperty('box-sizing', 'border-box', 'important');\n        panel.style.setProperty('z-index', '2147483647', 'important');\n    }\n'''
if 'function applyTargetAlertsViewportLock(panel)' not in s:
    if marker not in s: raise SystemExit('createSettingsPanel marker not found')
    s=s.replace(marker,helper+marker,1)

oldblock="""        panel.id = IDS.settingsPanel;\n        panel.style.removeProperty('left');\n        panel.style.removeProperty('right');\n        panel.style.removeProperty('top');\n        panel.style.removeProperty('bottom');\n        panel.style.removeProperty('transform');\n"""
newblock="""        panel.id = IDS.settingsPanel;\n        applyTargetAlertsViewportLock(panel);\n"""
if oldblock in s:
    s=s.replace(oldblock,newblock,1)
elif 'panel.id = IDS.settingsPanel;' in s and 'applyTargetAlertsViewportLock(panel);' not in s[s.find('panel.id = IDS.settingsPanel;'):s.find('panel.id = IDS.settingsPanel;')+180]:
    s=s.replace('        panel.id = IDS.settingsPanel;','        panel.id = IDS.settingsPanel;\n        applyTargetAlertsViewportLock(panel);',1)

# Re-assert on every open, after Torn/Suite mutations or any old draggable/popover code had a chance to alter inline geometry.
toggle='''        const panel = document.getElementById(IDS.settingsPanel);\n        const backdrop = ensureSettingsBackdrop();\n        if (!panel) return;\n'''
replacement='''        const panel = document.getElementById(IDS.settingsPanel);\n        const backdrop = ensureSettingsBackdrop();\n        if (!panel) return;\n        applyTargetAlertsViewportLock(panel);\n'''
if replacement not in s:
    if toggle not in s: raise SystemExit('toggleSettingsPanel marker not found')
    s=s.replace(toggle,replacement,1)

# Also keep it inside viewport after orientation/visual viewport changes while open.
anchor='    function isInsideSakaLuXSettings(target) {'
resize='''    if (!window.__sakaluxTargetAlertsViewportLockBound) {\n        window.__sakaluxTargetAlertsViewportLockBound = true;\n        const reflowTargetAlertsSettings = () => {\n            const panel = document.getElementById(IDS.settingsPanel);\n            if (panel && !panel.hidden) applyTargetAlertsViewportLock(panel);\n        };\n        window.addEventListener('resize', reflowTargetAlertsSettings, { passive: true });\n        window.visualViewport?.addEventListener('resize', reflowTargetAlertsSettings, { passive: true });\n        window.visualViewport?.addEventListener('scroll', reflowTargetAlertsSettings, { passive: true });\n    }\n'''
if '__sakaluxTargetAlertsViewportLockBound' not in s:
    if anchor not in s: raise SystemExit('isInside settings marker not found')
    s=s.replace(anchor,resize+anchor,1)

if s==old: raise SystemExit('no Suite changes made')
suite.write_text(s,encoding='utf-8')

if md.exists():
    t=md.read_text(encoding='utf-8')
    t=t.replace('**v0.9.932**','**v0.9.933**',1)
    t=t.replace('**v0.9.932 — Target Alerts mobile viewport fix**','**v0.9.933 — Target Alerts runtime viewport lock**',1)
    entry=("### v0.9.933 — Target Alerts runtime viewport lock\n"
           "- Forces the Target Alerts Settings dialog geometry with inline `!important` properties when it is created and every time it opens.\n"
           "- Uses `50vw` centering plus viewport-bounded width/height, so later Suite/Torn CSS cannot shift the dialog off-screen.\n"
           "- Re-applies the lock after viewport resize/orientation changes.\n\n")
    if '### v0.9.933 — Target Alerts runtime viewport lock' not in t:
        pos=t.find('## Release history / Changelog')
        if pos<0: raise SystemExit('release marker missing')
        ins=t.find('\n',pos)+1
        t=t[:ins]+'\n'+entry+t[ins:]
    md.write_text(t,encoding='utf-8')

print('Suite Target Alerts runtime viewport lock -> v0.9.933')
