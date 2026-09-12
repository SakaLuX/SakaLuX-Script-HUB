from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
hub = ROOT / 'SakaLuX-Script-Hub.user.js'
s = hub.read_text(encoding='utf-8')

# Real Hub bugfix release: invalidate stale registry/update caches left by a registry rollback.
s = s.replace('// @version      1.9.35', '// @version      1.9.36', 1)
s = s.replace("const VERSION = '1.9.35';", "const VERSION = '1.9.36';", 1)
s = s.replace("updates: 'SakaLuX_HUB_UPDATES_V16'", "updates: 'SakaLuX_HUB_UPDATES_V17'", 1)
s = s.replace("registry: 'SakaLuX_HUB_REGISTRY_V18'", "registry: 'SakaLuX_HUB_REGISTRY_V19'", 1)

anchor = "    const HUB_CHANGELOG = [\n"
entry = """    const HUB_CHANGELOG = [
        {
            version: '1.9.36',
            date: '2026-09-13',
            changes: [
                'Invalidates stale registry and update caches after an add-on registry rollback.',
                'Prevents rolled-back modules from showing an obsolete REGISTRY version as PUBLISH PENDING.',
                'Mission Rewards registry state now resolves cleanly to the restored stable v1.0.18.'
            ]
        },
"""
if anchor not in s:
    raise SystemExit('HUB_CHANGELOG anchor not found')
s = s.replace(anchor, entry, 1)

# Keep Mission Rewards fallback pinned to the restored stable version.
s, n = re.subn(r"(id\s*:\s*'mission-rewards'.*?version\s*:\s*')([^']+)(')", r"\g<1>1.0.18\3", s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('Mission Rewards fallback row not found')

hub.write_text(s, encoding='utf-8')

# Sync Hub release/info page only. Mission Rewards/scripts.json are already v1.0.18.
doc = ROOT / 'greasyfork/Script-Hub.md'
d = doc.read_text(encoding='utf-8')
d = re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*', r'\1**v1.9.36**', d, count=1)
d = re.sub(
    r'## Current release notes?\s*\n\n.*?\n\n## Recommended',
    '## Current release notes\n\n**v1.9.36** fixes stale registry/update cache after an add-on version rollback. Cached Mission Rewards v1.0.21 state is invalidated so the Hub immediately uses the restored registry version v1.0.18 instead of showing `REGISTRY v1.0.21 PENDING`.\n\n## Recommended',
    d,
    count=1,
    flags=re.S,
)
doc.write_text(d, encoding='utf-8')

print('Hub v1.9.36 registry rollback cache fix applied')
