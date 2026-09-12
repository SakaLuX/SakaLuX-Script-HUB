from pathlib import Path
import re, json

ROOT = Path(__file__).resolve().parents[1]
hub = ROOT / 'SakaLuX-Script-Hub.user.js'
s = hub.read_text(encoding='utf-8')

# Hub patch version: this is a Hub cache bug fix, not an add-on bump.
s = s.replace('// @version      1.9.36', '// @version      1.9.37', 1)
s = s.replace("const VERSION = '1.9.36';", "const VERSION = '1.9.37';", 1)

# Hard-invalidate the old persistent registry/update caches by rotating keys.
s = s.replace("updates: 'SakaLuX_HUB_UPDATES_V17'", "updates: 'SakaLuX_HUB_UPDATES_V18'", 1)
s = s.replace("registry: 'SakaLuX_HUB_REGISTRY_V19'", "registry: 'SakaLuX_HUB_REGISTRY_V20'", 1)

# Add explicit changelog entry before 1.9.36.
needle = "    const HUB_CHANGELOG = [\n        {\n            version: '1.9.36',"
entry = "    const HUB_CHANGELOG = [\n        {\n            version: '1.9.37',\n            date: '2026-09-13',\n            changes: [\n                'Rotates the persistent registry and update cache keys so stale rolled-back add-on versions cannot survive a Hub update.',\n                'Mission Rewards now starts from registry v1.0.18 instead of cached v1.0.21 PUBLISH PENDING state.',\n                'Keeps scripts.json and the offline fallback registry as the authoritative current version sources.'\n            ]\n        },\n        {\n            version: '1.9.36',"
if needle not in s:
    raise SystemExit('Hub changelog insertion point not found')
s = s.replace(needle, entry, 1)
hub.write_text(s, encoding='utf-8')

# Verify scripts.json remains authoritative and correct.
sp = ROOT / 'scripts.json'
data = json.loads(sp.read_text(encoding='utf-8'))
mission = next((x for x in data.get('scripts', []) if x.get('id') == 'mission-rewards'), None)
if not mission or mission.get('version') != '1.0.18':
    raise SystemExit('scripts.json Mission Rewards must be v1.0.18')

# Sync Hub info/release page.
doc = ROOT / 'greasyfork/Script-Hub.md'
d = doc.read_text(encoding='utf-8')
d = re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*', r'\1**v1.9.37**', d, count=1)
d = re.sub(
    r'## Current release notes\s*\n\n.*?\n\n## Recommended',
    "## Current release notes\n\n**v1.9.37** hard-invalidates the old persistent Hub registry/update caches by rotating their storage keys. This removes stale Mission Rewards `REGISTRY v1.0.21 PENDING` state after the rollback and forces Hub to start from the current `scripts.json` / fallback registry value **v1.0.18**.\n\n## Recommended",
    d, count=1, flags=re.S
)
doc.write_text(d, encoding='utf-8')

print('Applied Hub v1.9.37 registry rollback cache fix.')
