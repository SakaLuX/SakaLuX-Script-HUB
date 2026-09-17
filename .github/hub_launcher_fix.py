from pathlib import Path
import json,re

hub=Path('SakaLuX-Script-Hub.user.js')
h=hub.read_text(encoding='utf-8')
h=h.replace('// @version      1.9.63','// @version      1.9.64',1)
h=h.replace("const VERSION = '1.9.63';","const VERSION = '1.9.64';",1)
old="{version:'1.9.63',date:'2026-09-17',changes:['Moves Stock Manager & Advisor v0.7.8 public install/update checks to Greasy Fork script 596192 while retaining GitHub as source.']},"
new="{version:'1.9.64',date:'2026-09-17',changes:['Restores Hub launch controls defensively when Torn replaces native topbar/mobile navigation nodes.','Adds explicit Stock Manager POWER action to the Hub registry/fallback in addition to the generic ON/OFF switch.']},\n        "+old
if old in h and "version:'1.9.64'" not in h:
    h=h.replace(old,new,1)

marker="    function createTopbarSkull() {"
if 'function startLauncherRepair()' not in h:
    repair="""    let launcherRepairTimer = null;\n    function startLauncherRepair() {\n        if (launcherRepairTimer) return;\n        launcherRepairTimer = setInterval(() => {\n            if (document.hidden || document.getElementById(IDS.overlay)) return;\n            try {\n                createTopbarSkull();\n                createNavSkull();\n                createHubButton();\n                syncFloatingButtonVisibility();\n            } catch (error) {\n                console.debug('[SakaLuX Hub] launcher repair retry', error);\n            }\n        }, 1500);\n    }\n\n"""
    h=h.replace(marker,repair+marker,1)

needle="        suppressStandaloneDock();\n        injectCss(); createTopbarSkull(); createNavSkull(); createHubButton(); updateHiddenButtons(); updateBadge(); syncFloatingButtonVisibility();\n    }"
repl="        suppressStandaloneDock();\n        injectCss(); createTopbarSkull(); createNavSkull(); createHubButton(); updateHiddenButtons(); updateBadge(); syncFloatingButtonVisibility(); startLauncherRepair();\n    }"
if needle in h:
    h=h.replace(needle,repl,1)
else:
    raise SystemExit('ensureEverything launcher line not found')

# Add explicit POWER quick action to Stock fallback block if missing.
pat=re.compile(r'("id": "stock-manager-advisor"[\s\S]{0,2500}?"quickActions": \[\n)(\s*\{)',re.M)
m=pat.search(h)
if m:
    block=m.group(0)
    if '"method": "toggleEnabled"' not in block:
        insertion='                {\n                    "icon": "⏻",\n                    "id": "toggle",\n                    "label": "POWER",\n                    "method": "toggleEnabled"\n                },\n'
        h=h[:m.start(2)]+insertion+h[m.start(2):]

hub.write_text(h,encoding='utf-8')

rp=Path('scripts.json')
data=json.loads(rp.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item.get('id')=='stock-manager-advisor':
        qa=item.setdefault('quickActions',[])
        if not any(a.get('method')=='toggleEnabled' for a in qa):
            qa.insert(0,{"icon":"⏻","id":"toggle","label":"POWER","method":"toggleEnabled"})
        break
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

md=Path('greasyfork/Script-Hub.md')
s=md.read_text(encoding='utf-8')
s=s.replace('**v1.9.63**','**v1.9.64**',2)
s=s.replace('**v1.9.63** Moves Stock Manager & Advisor v0.7.8 install/update checks to Greasy Fork script 596192 while GitHub remains its source repository.','**v1.9.64** Restores Hub launch controls when Torn replaces native launcher nodes and adds an explicit Stocks POWER action in the Hub registry.',1)
if '### v1.9.64' not in s:
    marker='## Release history\n'
    entry='### v1.9.64 — Launcher recovery\n- Recreates Hub topbar/mobile launch controls if Torn replaces their DOM nodes.\n- Keeps the floating Hub button as a fallback when native launchers are unavailable.\n- Adds explicit Stock Manager POWER action in registry/fallback.\n\n'
    s=s.replace(marker,marker+entry,1)
md.write_text(s,encoding='utf-8')
