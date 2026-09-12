from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]
hub=ROOT/'SakaLuX-Script-Hub.user.js'
s=hub.read_text(encoding='utf-8')
s=s.replace('// @version      1.9.36','// @version      1.9.37',1)
s=s.replace("const VERSION = '1.9.36';","const VERSION = '1.9.37';",1)
s=s.replace("registry: 'SakaLuX_HUB_REGISTRY_V19'","registry: 'SakaLuX_HUB_REGISTRY_V20'",1)
s=s.replace("updates: 'SakaLuX_HUB_UPDATES_V17'","updates: 'SakaLuX_HUB_UPDATES_V18'",1)
marker="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [\n        {\n            version: '1.9.37',\n            date: '2026-09-13',\n            changes: [\n                'Actually invalidates stale scripts.json registry cache by moving registry storage to V20.',\n                'Actually invalidates stale update-state cache by moving update storage to V18.',\n                'Removes obsolete Mission Rewards REGISTRY v1.0.21 PENDING state after the rollback to v1.0.18.'\n            ]\n        },\n"""
if marker not in s: raise SystemExit('changelog marker missing')
s=s.replace(marker,entry,1)
# Ensure fallback Mission Rewards is stable 1.0.18
s,n=re.subn(r"(id\s*:\s*'mission-rewards'.*?version\s*:\s*')([^']+)(')",r"\g<1>1.0.18\3",s,count=1,flags=re.S)
if n!=1: raise SystemExit('mission fallback row missing')
hub.write_text(s,encoding='utf-8')

# Hub info/release page only. Hub is not a managed add-on entry in scripts.json.
p=ROOT/'greasyfork/Script-Hub.md'
d=p.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v1.9.37**',d,count=1)
d=re.sub(r'## Current release note\s*\n\n.*?\n\n## Recommended',
'''## Current release note\n\n**v1.9.37** fixes stale registry/update cache invalidation. Hub now uses new storage generations for both the scripts.json registry and update-state cache, so a rolled-back add-on version such as Mission Rewards v1.0.21 can no longer remain displayed as `REGISTRY v1.0.21 PENDING` after the canonical registry has returned to v1.0.18.\n\n## Recommended''',
d,count=1,flags=re.S)
p.write_text(d,encoding='utf-8')

# Verify canonical scripts.json still says Mission Rewards 1.0.18; do not change it unnecessarily.
data=json.loads((ROOT/'scripts.json').read_text(encoding='utf-8'))
mr=next(x for x in data['scripts'] if x.get('id')=='mission-rewards')
if mr.get('version')!='1.0.18': raise SystemExit(f"scripts.json Mission Rewards is {mr.get('version')}, expected 1.0.18")
print('Hub registry cache fix prepared: v1.9.37')
