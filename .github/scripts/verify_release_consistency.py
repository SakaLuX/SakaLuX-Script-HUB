#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import unquote, urlparse
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / 'scripts.json'

DOC_BY_ID = {
    'enhancer': 'greasyfork/Enhancer-Guard.md',
    'bazaar': 'greasyfork/Bazaar-Thanker.md',
    'bazaar-smart-pricer': 'greasyfork/Bazaar-Smart-Pricer.md',
    'mission-rewards': 'greasyfork/Mission-Rewards.md',
    'market-intelligence': 'greasyfork/Market-Intelligence.md',
    'elimination-assistant': 'greasyfork/Elimination-Assistant.md',
    'company-intelligence': 'greasyfork/Company-Intelligence.md',
    'stock-manager-advisor': 'greasyfork/Stock-Manager-Advisor.md',
}

STANDALONE_DOCS = [
    ('SakaLuX-Script-Hub.user.js', 'greasyfork/Script-Hub.md', 'Script Hub'),
    ('SakaLuX-Chat-Intelligence.user.js', 'greasyfork/Chat-Intelligence.md', 'Chat Intelligence'),
    ('SakaLuX-Account-Auditor.user.js', 'greasyfork/Account-Auditor.md', 'Account Auditor'),
    ('SakaLuX-Suite.user.js', 'greasyfork/SakaLuX-Suite.md', 'SakaLuX Suite'),
]

errors = []
warnings = []
checked = []


def fail(msg):
    errors.append(msg)


def header_version(path: Path):
    if not path.exists():
        fail(f'Missing userscript: {path.relative_to(ROOT)}')
        return None
    text = path.read_text(encoding='utf-8')
    m = re.search(r'(?m)^//\s*@version\s+(\S+)', text)
    if not m:
        fail(f'Missing @version: {path.relative_to(ROOT)}')
        return None
    return m.group(1).strip()


def source_path(url: str):
    return ROOT / unquote(Path(urlparse(url).path).name)


def check_doc(path: Path, version: str, label: str):
    if not path.exists():
        fail(f'{label}: missing release doc {path.relative_to(ROOT)}')
        return
    text = path.read_text(encoding='utf-8')
    current = re.search(r'(?is)##\s+Current version\s*\n+\s*\*\*v?([^*\n]+)\*\*', text)
    if not current:
        fail(f'{label}: missing Current version in {path.relative_to(ROOT)}')
    elif current.group(1).strip() != version:
        fail(f'{label}: doc Current version {current.group(1).strip()} != userscript {version}')

    canonical = re.search(r'(?im)^-\s*Canonical version:\s*\*\*v?([^*\n]+)\*\*', text)
    if canonical and canonical.group(1).strip() != version:
        fail(f'{label}: repository Canonical version {canonical.group(1).strip()} != userscript {version}')

    release = re.search(r'(?is)##\s+Current release note\b(.*?)(?=\n##\s|\Z)', text)
    if not release:
        fail(f'{label}: missing Current release note')
    elif not re.search(rf'\*\*v?{re.escape(version)}(?:\s|—|-)', release.group(1)):
        fail(f'{label}: Current release note is not for v{version}')

    if not re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', text):
        fail(f'{label}: missing Release history / Changelog heading')
    elif not re.search(rf'(?im)^###\s+v?{re.escape(version)}(?:\s|—|-|$)', text):
        fail(f'{label}: changelog has no v{version} entry')


registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
registry_sources = set()

for row in registry.get('scripts', []):
    if not row.get('active', True):
        continue
    label = str(row.get('name') or row.get('id') or 'unknown')
    src = source_path(str(row.get('sourceUrl') or ''))
    registry_sources.add(src.name)
    version = header_version(src)
    if not version:
        continue
    checked.append(f'{label} v{version}')

    reg_version = str(row.get('version') or '').strip()
    if reg_version != version:
        fail(f'{label}: scripts.json version {reg_version or "<missing>"} != userscript {version}')

    release = row.get('release') or {}
    release_version = str(release.get('version') or '').strip()
    if release_version != version:
        fail(f'{label}: release.version {release_version or "<missing>"} != userscript {version}')
    notes = release.get('notes')
    if not isinstance(notes, list) or not any(str(x).strip() for x in notes):
        fail(f'{label}: current release has no release notes')
    if not str(release.get('date') or '').strip():
        fail(f'{label}: current release has no date')

    doc_name = DOC_BY_ID.get(row.get('id'))
    if doc_name:
        check_doc(ROOT / doc_name, version, label)
    else:
        warnings.append(f'{label}: no managed release-doc mapping')

for src_name, doc_name, label in STANDALONE_DOCS:
    src = ROOT / src_name
    if not src.exists():
        continue
    version = header_version(src)
    if version:
        checked.append(f'{label} v{version}')
        check_doc(ROOT / doc_name, version, label)

# Every root SakaLuX userscript must at least have a valid version. If it is not
# represented by scripts.json or the standalone release-doc list, report it so a
# newly added script cannot silently escape release coverage.
covered = registry_sources | {x[0] for x in STANDALONE_DOCS}
for src in sorted(ROOT.glob('SakaLuX*.user.js')):
    version = header_version(src)
    if src.name not in covered:
        warnings.append(f'Unmapped userscript: {src.name} v{version or "?"} — add it to release coverage when publishing it')

print('Release consistency audit')
for item in checked:
    print('  OK  ', item)
for item in warnings:
    print('  WARN', item)
if errors:
    print('\nRelease consistency errors:', file=sys.stderr)
    for item in errors:
        print('  FAIL', item, file=sys.stderr)
    sys.exit(1)
print(f'PASS: {len(checked)} release surfaces are version/changelog consistent.')
