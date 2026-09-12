from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
hub=ROOT/'SakaLuX-Script-Hub.user.js'
doc=ROOT/'greasyfork/Script-Hub.md'

s=hub.read_text(encoding='utf-8')
s=re.sub(r'(^//\s*@version\s+)1\.9\.36\s*$',r'\g<1>1.9.35',s,count=1,flags=re.M)
s=s.replace("const VERSION = '1.9.36';","const VERSION = '1.9.35';",1)
# Remove only the v1.9.36 changelog entry introduced for Mission Rewards metadata sync.
s=re.sub(r"\n\s*\{\n\s*version: '1\.9\.36',.*?\n\s*\},(?=\n\s*\{\n\s*version: '1\.9\.35')",'',s,count=1,flags=re.S)
# Keep Mission Rewards fallback aligned with the live managed release.
m=re.search(r"(id\s*:\s*'mission-rewards'.*?version\s*:\s*')([^']+)(')",s,re.S)
if not m: raise SystemExit('Mission Rewards fallback row not found')
s=s[:m.start(2)]+'1.2.0'+s[m.end(2):]
hub.write_text(s,encoding='utf-8')

d=doc.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s*\n)\*\*v1\.9\.36\*\*',r'\1**v1.9.35**',d,count=1)
d=re.sub(r'## Current release note\s*\n\n.*?\n\n## Recommended',"""## Current release note

**v1.9.35** uses live runtime presence only for installation detection. Persistent `SakaLuX_Installed_*` markers and old launcher-button fallbacks no longer count as proof that an add-on is currently installed, preventing deleted or disabled scripts from remaining as ghost modules.

## Recommended""",d,count=1,flags=re.S)
# Keep managed-module documentation aligned with Mission Rewards 1.2.0.
d=re.sub(r'(SakaLuX Mission Rewards\s+\*\*v)[^*]+(\*\*)',r'\g<1>1.2.0\2',d)
doc.write_text(d,encoding='utf-8')
print('Hub rolled back to 1.9.35 while keeping Mission Rewards fallback at 1.2.0')
