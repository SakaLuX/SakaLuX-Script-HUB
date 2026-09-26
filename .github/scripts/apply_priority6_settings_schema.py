#!/usr/bin/env python3
"""Release Shared Core settings schemas across every standalone userscript."""

from datetime import date
from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
TODAY = date.today().isoformat()
REGISTRY_PATH = ROOT / 'scripts.json'
HUB_PATH = ROOT / 'SakaLuX-Script-Hub.user.js'

DOCS = {
    'SakaLuX-Account-Auditor.user.js': 'greasyfork/Account-Auditor.md',
    'SakaLuX-Bazaar-Smart-Pricer.user.js': 'greasyfork/Bazaar-Smart-Pricer.md',
    'SakaLuX-Bazaar-Thanker-PDA.user.js': 'greasyfork/Bazaar-Thanker.md',
    'SakaLuX-Chat-Intelligence.user.js': 'greasyfork/Chat-Intelligence.md',
    'SakaLuX-Company-Intelligence-v1.0.0.user.js': 'greasyfork/Company-Intelligence.md',
    'SakaLuX-Elimination-Assistant.user.js': 'greasyfork/Elimination-Assistant.md',
    'SakaLuX-Enhancer-Guard.user.js': 'greasyfork/Enhancer-Guard.md',
    'SakaLuX-Market-Intelligence.user.js': 'greasyfork/Market-Intelligence.md',
    'SakaLuX-Mission-Rewards.user.js': 'greasyfork/Mission-Rewards.md',
    'SakaLuX-Script-Hub.user.js': 'greasyfork/Script-Hub.md',
    'SakaLuX-Stock-Manager-Advisor.user.js': 'greasyfork/Stock-Manager-Advisor.md',
    'SakaLuX-Suite.user.js': 'greasyfork/SakaLuX-Suite.md',
}

TITLE = 'Settings Schema v1 and safe automatic migrations'
NOTES = [
    'Adds versioned settings schemas for every SakaLuX userscript through Shared Core v1.1.0.',
    'Automatically advances legacy settings through ordered per-version migrations without downgrading newer data.',
    'Keeps a last-known-good backup and restores it, or safely falls back to script defaults, when stored JSON is corrupt.',
]


def version(text: str) -> str:
    match = re.search(r'(?m)^//\s*@version\s+(\S+)', text)
    if not match:
        raise RuntimeError('Missing @version')
    return match.group(1)


def bump_patch(value: str) -> str:
    parts = value.split('.')
    if not parts or not all(part.isdigit() for part in parts):
        raise RuntimeError(f'Cannot bump version {value}')
    parts[-1] = str(int(parts[-1]) + 1)
    return '.'.join(parts)


def update_doc(path: Path, new_version: str) -> None:
    text = path.read_text(encoding='utf-8')
    text = re.sub(
        r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)',
        lambda m: m.group(1) + new_version + m.group(2), text, count=1,
    )
    text = re.sub(
        r'(?m)(Canonical version:\s*\*\*v)[^*]+(\*\*)',
        lambda m: m.group(1) + new_version + m.group(2), text, count=1,
    )
    bullets = '\n'.join(f'- {note}' for note in NOTES)
    current = f'## Current release note\n\n**v{new_version} — {TITLE}**\n{bullets}\n'
    match = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', text)
    if not match:
        raise RuntimeError(f'{path}: Current release note section missing')
    text = text[:match.start()] + current.rstrip() + '\n' + text[match.end():]
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', text)
    if not heading:
        raise RuntimeError(f'{path}: changelog heading missing')
    if not re.search(rf'(?im)^###\s+v{re.escape(new_version)}(?:\s|—|-|$)', text):
        entry = f'\n\n### v{new_version} — {TITLE}\n{bullets}\n'
        text = text[:heading.end()] + entry + text[heading.end():]
    path.write_text(text, encoding='utf-8')


def sync_hub_registry(text: str, registry: dict) -> str:
    start_token = '    const FALLBACK_REGISTRY = '
    end_token = '\n\n    let registry = '
    start = text.find(start_token)
    end = text.find(end_token, start)
    if start < 0 or end < 0:
        raise RuntimeError('Hub FALLBACK_REGISTRY boundaries missing')
    payload = json.dumps(registry, indent=4, ensure_ascii=False).replace('\n', '\n    ')
    details = (
        "\n\n    const FALLBACK_MODULE_DETAILS = Object.fromEntries(\n"
        "        (FALLBACK_REGISTRY.scripts || []).map(s => [s.id, { info: s.info, release: s.release }])\n"
        "    );"
    )
    return text[:start] + start_token + payload + details + text[end:]


subprocess.run(['node', 'tools/embed-shared-core-all.cjs'], cwd=ROOT, check=True)

versions = {}
for filename, doc_name in DOCS.items():
    path = ROOT / filename
    text = path.read_text(encoding='utf-8')
    old = version(text)
    new = bump_patch(old)
    text = re.sub(r'(?m)^(//\s*@version\s+)\S+', lambda m: m.group(1) + new, text, count=1)
    if filename == 'SakaLuX-Script-Hub.user.js':
        text = re.sub(
            r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(old) + r"(['\"]\s*;)",
            lambda m: m.group(1) + new + m.group(2), text, count=1,
        )
        marker = '    const HUB_CHANGELOG = [\n'
        entry = '        ' + json.dumps({'version': new, 'date': TODAY, 'changes': NOTES}, ensure_ascii=False) + ',\n'
        if marker not in text:
            raise RuntimeError('Hub changelog marker missing')
        text = text.replace(marker, marker + entry, 1)
    else:
        text = text.replace(old, new)
    if filename == 'SakaLuX-Company-Intelligence-v1.0.0.user.js':
        text = re.sub(r"(const APP=\{name:'SakaLuX Company Intelligence',version:')[^']+(')", lambda m: m.group(1) + new + m.group(2), text, count=1)
    if filename == 'SakaLuX-Stock-Manager-Advisor.user.js':
        text = re.sub(r"(name:\s*'SakaLuX Stock Manager & Advisor',\s*version:\s*')[^']+(')", lambda m: m.group(1) + new + m.group(2), text, count=1)
    path.write_text(text, encoding='utf-8')
    update_doc(ROOT / doc_name, new)
    versions[filename] = new

registry = json.loads(REGISTRY_PATH.read_text(encoding='utf-8'))
registry['lastVerified'] = TODAY
for row in registry.get('scripts', []):
    filename = Path(row['sourceUrl']).name
    if filename not in versions:
        continue
    new = versions[filename]
    row['version'] = new
    row['detailsRevision'] = int(row.get('detailsRevision') or 0) + 1
    row['release'] = {'version': new, 'date': TODAY, 'notes': NOTES}
REGISTRY_PATH.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

hub = HUB_PATH.read_text(encoding='utf-8')
hub = sync_hub_registry(hub, registry)
HUB_PATH.write_text(hub, encoding='utf-8')

print('Priority 6 settings schemas embedded and release metadata synchronized for', len(versions), 'userscripts.')
