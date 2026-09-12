from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
hub = ROOT / 'SakaLuX-Script-Hub.user.js'
doc = ROOT / 'greasyfork/Script-Hub.md'

s = hub.read_text(encoding='utf-8')

# Release version from the rolled-back v1.9.33 base.
s = re.sub(r'(^// @version\s+)1\.9\.33(\s*$)', r'\g<1>1.9.34\2', s, count=1, flags=re.M)
s = s.replace("const VERSION = '1.9.33';", "const VERSION = '1.9.34';", 1)

# Add clean release entry.
anchor = "    const HUB_CHANGELOG = [\n"
entry = """    const HUB_CHANGELOG = [
        {
            version: '1.9.34',
            date: '2026-09-13',
            changes: [
                'Removed all Violentmonkey-specific wording and compatibility handling from Script Hub.',
                'Module control now uses the generic runtime API or DOM bridge without userscript-manager-specific behavior.',
                'Removed the obsolete Violentmonkey compatibility release entry from the active Hub changelog.'
            ]
        },
"""
if anchor not in s:
    raise SystemExit('HUB_CHANGELOG anchor not found')
s = s.replace(anchor, entry, 1)

# Remove the historical v1.9.10 Violentmonkey-specific changelog object entirely.
s, n = re.subn(
    r"\n\s*\{\n\s*version: '1\.9\.10',\n\s*date: '2026-09-11',\n\s*changes: \[.*?\n\s*\]\n\s*\},",
    '', s, count=1, flags=re.S
)
if n != 1:
    raise SystemExit('v1.9.10 Violentmonkey changelog block not found')

# Make power-control bridge failure generic.
s = s.replace(
    "if (!bridge) throw new Error('Update ' + script.name + ' to the latest version to use its Violentmonkey control bridge.');",
    "if (!bridge) throw new Error(script.name + ' control interface is unavailable on this page.');"
)

# Remove the special installed-but-no-bridge Violentmonkey alert branch.
old = """            if (getInstalledVersion(script)) {
                alert(script.name + ' is installed, but this version needs the Violentmonkey bridge update before Hub can open it.');
                return;
            }
            const url = getInstallUrl(script);
"""
new = """            const url = getInstallUrl(script);
"""
if old not in s:
    raise SystemExit('Violentmonkey OPEN alert branch not found')
s = s.replace(old, new, 1)

if re.search(r'violentmonkey', s, flags=re.I):
    raise SystemExit('Violentmonkey text still present in Hub userscript')

hub.write_text(s, encoding='utf-8')

# Documentation: version + release note and remove v1.9.10 section.
d = doc.read_text(encoding='utf-8')
d = re.sub(r'(## Current version\s*\n)\*\*v1\.9\.33\*\*', r'\1**v1.9.34**', d, count=1)
d = re.sub(
    r'## Current release note\s*\n\n.*?\n\n## Recommended',
    """## Current release note

**v1.9.34** is based on the stable v1.9.33 Hub and removes all Violentmonkey-specific compatibility wording and handling. Module controls use only the generic runtime API / DOM bridge integration.

## Recommended""",
    d, count=1, flags=re.S
)
d = re.sub(
    r'\n### v1\.9\.10[^\n]*\n.*?(?=\n### v1\.9\.9|\n## |\Z)',
    '\n', d, count=1, flags=re.S
)
if re.search(r'violentmonkey', d, flags=re.I):
    raise SystemExit('Violentmonkey text still present in Hub documentation')
doc.write_text(d, encoding='utf-8')

print('Removed all Violentmonkey-specific Hub handling; Hub v1.9.34')
