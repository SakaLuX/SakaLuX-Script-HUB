from pathlib import Path
import re
p=Path(__file__).resolve().parents[1]/'SakaLuX-Script-Hub.user.js'
s=p.read_text(encoding='utf-8')
# Remove the first duplicate 1.9.37 entry added by the cache-fix follow-up, keep the existing canonical 1.9.37 entry.
pat=re.compile(r"\n        \{\n            version: '1\.9\.37',\n            date: '2026-09-13',\n            changes: \[\n                'Actually invalidates stale scripts\.json registry cache by moving registry storage to V20\.',\n                'Actually invalidates stale update-state cache by moving update storage to V18\.',\n                'Removes obsolete Mission Rewards REGISTRY v1\.0\.21 PENDING state after the rollback to v1\.0\.18\.'\n            \]\n        \},")
s,n=pat.subn('',s,count=1)
if n!=1: raise SystemExit('duplicate 1.9.37 entry not found')
p.write_text(s,encoding='utf-8')
print('cleaned duplicate 1.9.37 changelog entry')
