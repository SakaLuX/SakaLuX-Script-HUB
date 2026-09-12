from pathlib import Path
import re, json

ROOT=Path(__file__).resolve().parents[1]
hub=ROOT/'SakaLuX-Script-Hub.user.js'
doc=ROOT/'greasyfork/Script-Hub.md'
reg=ROOT/'scripts.json'

s=hub.read_text(encoding='utf-8')
# Restore Hub release number only; keep current registry/fallback data such as Mission Rewards 1.2.0.
s=re.sub(r'(^//\s*@version\s+)1\.9\.36\s*$',r'\g<1>1.9.35',s,count=1,flags=re.M)
s=s.replace("const VERSION = '1.9.36';","const VERSION = '1.9.35';",1)
# Remove only the 1.9.36 changelog entry added for Mission Hints sync.
s=re.sub(r"\n\s*\{\s*version:\s*'1\.9\.36'.*?\n\s*\},(?=\n\s*\{\s*version:\s*'1\.9\.35')",'',s,count=1,flags=re.S)
hub.write_text(s,encoding='utf-8')

# Keep Mission Rewards 1.2.0 in scripts.json; verify rather than rewrite.
data=json.loads(reg.read_text(encoding='utf-8'))
row=next(x for x in data['scripts'] if x['id']=='mission-rewards')
assert row['version']=='1.2.0',row

# Hub info page back to 1.9.35, while keeping registered add-on list current.
d=doc.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s*\n)\*\*v1\.9\.36\*\*',r'\1**v1.9.35**',d,count=1)
d=re.sub(r'## Current release note\s*\n\n.*?\n\n## Recommended',"""## Current release note

**v1.9.35** uses live runtime presence only for installation detection. Persistent `SakaLuX_Installed_*` markers and old launcher-button fallbacks do not count as proof that an add-on is currently installed, preventing deleted or disabled scripts from remaining as ghost modules.

## Recommended""",d,count=1,flags=re.S)
doc.write_text(d,encoding='utf-8')

print('Hub rolled back to 1.9.35; Mission Rewards registry remains',row['version'])
