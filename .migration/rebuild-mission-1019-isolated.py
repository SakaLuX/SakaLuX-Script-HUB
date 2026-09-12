from pathlib import Path
import subprocess, json, re

ROOT=Path(__file__).resolve().parents[1]
mission=ROOT/'SakaLuX-Mission-Rewards.user.js'
current=mission.read_text(encoding='utf-8')
marker='/* SAKALUX_MISSION_HINTS_V120_BEGIN */'
pos=current.find(marker)
if pos<0:
    raise SystemExit('Current Mission Hints block not found')
# Reuse only the already-written hint feature as an isolated payload; do not reuse its bootstrap/core edits.
hints=current[pos:]

stable=subprocess.check_output([
    'git','show','17848cae628043a59b460f8e35e2d6bd2b810c3b:SakaLuX-Mission-Rewards.user.js'
], text=True)

# Keep the proven v1.0.18 runtime byte-for-byte except release metadata/version identifiers.
stable=stable.replace('// @version      1.0.18','// @version      1.0.19',1)
stable=stable.replace('// @description  Advanced Mission Shop reward information, value per credit, ammo ownership and weapon mod tracking for Torn PDA / Tampermonkey.',
'''// @description  Stable Mission Rewards with isolated Duke mission task and hint guidance for Torn PDA / Tampermonkey.''',1)
stable=stable.replace("{version:'1.0.18'}","{version:'1.0.19'}",1)
stable=stable.replace("const VERSION = '1.0.18';","const VERSION = '1.0.19';",1)

payload=json.dumps(hints, ensure_ascii=False)
isolated=f'''\n\n/* SAKALUX_MISSION_HINTS_ISOLATED_V1019_BEGIN\n * Fail-safe boundary: Mission Rewards v1.0.18 core has already initialized before this code runs.\n * Any parse/startup failure inside Mission Hints is caught here and cannot stop Hub registration or Mission Rewards.\n */\n(() => {{\n    'use strict';\n    try {{\n        const missionHintsSource = {payload};\n        (0, Function)(missionHintsSource)();\n    }} catch (error) {{\n        console.error('[SakaLuX Mission Rewards] Mission Hints isolated module failed; base Mission Rewards remains active.', error);\n    }}\n}})();\n/* SAKALUX_MISSION_HINTS_ISOLATED_V1019_END */\n'''
mission.write_text(stable.rstrip()+isolated,encoding='utf-8')

# scripts.json
sp=ROOT/'scripts.json'
data=json.loads(sp.read_text(encoding='utf-8'))
found=False
for row in data.get('scripts',[]):
    if row.get('id')=='mission-rewards':
        row['version']='1.0.19'
        row['description']='Stable Mission Shop reward intelligence with isolated Duke mission task and hint guidance.'
        found=True
if not found: raise SystemExit('mission-rewards missing from scripts.json')
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub fallback registry: metadata only, NO Hub version bump.
hubp=ROOT/'SakaLuX-Script-Hub.user.js'
hub=hubp.read_text(encoding='utf-8')
# Restrict replacement to mission fallback row.
m=re.search(r"(id\s*:\s*'mission-rewards'.*?version\s*:\s*')([^']+)(')",hub,re.S)
if not m: raise SystemExit('Mission fallback row not found in Hub')
hub=hub[:m.start(2)]+'1.0.19'+hub[m.end(2):]
hubp.write_text(hub,encoding='utf-8')

# Mission release/info page.
docp=ROOT/'greasyfork/Mission-Rewards.md'
doc=docp.read_text(encoding='utf-8')
doc=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v1.0.19**',doc,count=1)
release='''## Current release note\n\n**v1.0.19** keeps the proven v1.0.18 Mission Rewards core, Hub registration, ON/OFF control, API logic and initialization unchanged. Duke Mission Task + Hint guidance is loaded only after the stable core starts, inside a fail-safe isolated module. If Mission Hints fails, base Mission Rewards and Hub detection continue to work.\n\n## Recommended'''
doc,n=re.subn(r'## Current release notes?\s*\n.*?\n## Recommended',release,doc,count=1,flags=re.S|re.I)
if n!=1: raise SystemExit('Mission release note block not found')
docp.write_text(doc,encoding='utf-8')

# Hub info only reflects registered add-on version; Hub's own version/release text is untouched.
hubdocp=ROOT/'greasyfork/Script-Hub.md'
hd=hubdocp.read_text(encoding='utf-8')
hd=re.sub(r'(SakaLuX Mission Rewards\s+\*\*v)[^*]+(\*\*)',r'\g<1>1.0.19\2',hd)
hubdocp.write_text(hd,encoding='utf-8')

print('Mission Rewards rebuilt from stable v1.0.18 core as v1.0.19 with isolated hints; Hub version untouched.')
