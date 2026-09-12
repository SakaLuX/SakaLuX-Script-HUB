from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[1]
mission=ROOT/'SakaLuX-Mission-Rewards.user.js'
text=mission.read_text(encoding='utf-8')

# Extract the already-validated Mission Hints source from the v1.0.19 dynamic wrapper.
m=re.search(r"const missionHintsSource = (\"(?:\\.|[^\"\\])*\");\s*\(0, Function\)\(missionHintsSource\)\(\);", text, re.S)
if not m:
    raise SystemExit('missionHintsSource wrapper not found')
source=json.loads(m.group(1))

start='/* SAKALUX_MISSION_HINTS_ISOLATED_V1019_BEGIN'
end='/* SAKALUX_MISSION_HINTS_ISOLATED_V1019_END */'
a=text.find(start); b=text.find(end)
if a<0 or b<0: raise SystemExit('isolated wrapper markers not found')
b += len(end)

# Keep core untouched; replace only the isolated runtime loader with static validated code.
wrapper = '''/* SAKALUX_MISSION_HINTS_ISOLATED_V1020_BEGIN\n * Runtime-isolated Mission Hints. Mission Rewards core initializes before this block.\n * Static execution avoids CSP/WebView restrictions on Function/eval in TornPDA.\n */\n(() => {\n    'use strict';\n    try {\n''' + source + '''\n    } catch (error) {\n        console.error('[SakaLuX Mission Rewards] Mission Hints isolated module failed; base Mission Rewards remains active.', error);\n    }\n})();\n/* SAKALUX_MISSION_HINTS_ISOLATED_V1020_END */'''
text=text[:a]+wrapper+text[b:]

# Version only Mission Rewards; Hub version remains unchanged.
text=text.replace('// @version      1.0.19','// @version      1.0.20',1)
text=text.replace("{version:'1.0.19'}","{version:'1.0.20'}",1)
text=text.replace("const VERSION = '1.0.19';","const VERSION = '1.0.20';",1)
text=text.replace('Stable Mission Rewards with isolated Duke mission task and hint guidance','Stable Mission Rewards with TornPDA-safe isolated Duke mission task and hint guidance',1)
mission.write_text(text,encoding='utf-8')

# scripts.json
sp=ROOT/'scripts.json'
data=json.loads(sp.read_text(encoding='utf-8'))
for row in data['scripts']:
    if row.get('id')=='mission-rewards':
        row['version']='1.0.20'
        row['description']='Stable Mission Shop reward intelligence with TornPDA-safe isolated Duke mission task and hint guidance.'
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Mission release info
p=ROOT/'greasyfork/Mission-Rewards.md'
d=p.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v1.0.20**',d,count=1)
d=re.sub(r'## Current release note\s*\n\n.*?\n\n## Recommended',"""## Current release note

**v1.0.20** keeps the proven v1.0.18 Mission Rewards core and runs Duke Mission Task + Hint guidance as a separate static, runtime-isolated module. The dynamic `Function(...)` loader used in v1.0.19 was removed because TornPDA/WebView can block dynamic code execution. If Mission Hints fails at runtime, Mission Rewards and Hub registration remain active.

## Recommended""",d,count=1,flags=re.S)
p.write_text(d,encoding='utf-8')

# Hub fallback registry only: do NOT bump Hub VERSION/changelog.
hp=ROOT/'SakaLuX-Script-Hub.user.js'
h=hp.read_text(encoding='utf-8')
h,n=re.subn(r"(id:\s*'mission-rewards'.*?version:\s*')[^']+(')",r"\g<1>1.0.20\2",h,count=1,flags=re.S)
if n!=1: raise SystemExit('Hub fallback Mission Rewards version not found')
hp.write_text(h,encoding='utf-8')

# Hub info managed-version row only.
hd=ROOT/'greasyfork/Script-Hub.md'
s=hd.read_text(encoding='utf-8')
s=re.sub(r'(Mission Rewards\s+\*\*v)[^*]+(\*\*)',r'\g<1>1.0.20\2',s)
hd.write_text(s,encoding='utf-8')

print('Mission Rewards v1.0.20 static hints runtime prepared; Hub version unchanged.')
