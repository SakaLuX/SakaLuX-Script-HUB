#!/usr/bin/env python3
"""Synchronize application version signals and release surfaces without changing shared runtimes."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sync_runtime(source, version):
    # Embedded components have independent version numbers.
    parts = re.split(r'(/\* SakaLuX Shared (?:Core|Dock Runtime) — BEGIN \*/.*?/\* SakaLuX Shared (?:Core|Dock Runtime) — END \*/)', source, flags=re.S)
    for i in range(0, len(parts), 2):
        text = parts[i]
        text = re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])[^'\"]+(['\"])", lambda m: m[1]+version+m[2], text)
        text = re.sub(r"(\blet\s+v\s*=\s*['\"])[^'\"]+(['\"])", lambda m: m[1]+version+m[2], text)
        text = re.sub(r"(\{\s*version\s*:\s*['\"])[^'\"]+(['\"]\s*\}\s*\)\))", lambda m: m[1]+version+m[2], text)
        text = re.sub(r"(\bconst\s+APP\s*=\s*\{\s*name\s*:\s*['\"][^'\"]+['\"]\s*,\s*version\s*:\s*['\"])[^'\"]+(['\"])", lambda m: m[1]+version+m[2], text)
        text = re.sub(r"(Object.assign\(e.dataset,\{id:'chat-intelligence'[^\n]*?version:')[^']+(')", lambda m: m[1]+version+m[2], text)
        parts[i] = text
    return ''.join(parts)


def sync_doc(path, version, notes, day):
    text = path.read_text()
    # Update current summaries while preserving historical changelog entries.
    text = re.sub(r'(?m)^(\*\*v)[^*\n]+(\*\*)$', lambda m: m[1]+version+m[2], text, count=1)
    text = re.sub(r'(Canonical version:\s*\*\*v)[^*]+(\*\*)', lambda m: m[1]+version+m[2], text)
    text = re.sub(r'(Verified:\s*\*\*)[^*]+(\*\*)', lambda m: m[1]+day+m[2], text)
    bullets = '\n'.join('- '+note for note in notes)
    release = f'## Current release note\n\n**v{version} — Version and release synchronization**\n{bullets}\n'
    pattern = r'(?m)^## Current release note\b.*?(?=\n## |\Z)'
    if re.search(pattern, text, re.S):
        text = re.sub(pattern, lambda _: release, text, count=1, flags=re.S)
    else:
        text += '\n'+release
    if not re.search(rf'(?m)^### v{re.escape(version)}(?:\s|$)', text):
        entry = f'\n\n### v{version} — {day}\n{bullets}\n'
        heading = re.search(r'(?m)^## (?:Release history / Changelog|Changelog)\s*$', text)
        if heading:
            text = text[:heading.end()]+entry+text[heading.end():]
        else:
            text += '\n## Changelog'+entry
    path.write_text(text)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bump', action='store_true', help='Increment patch, removing fourth version component')
    parser.add_argument('--date', default=__import__('datetime').date.today().isoformat())
    parser.add_argument('--notes', type=Path, required=True, help='JSON mapping script IDs to accurate release notes')
    args = parser.parse_args()
    notes_by_id = json.loads(args.notes.read_text())
    config = json.loads((ROOT/'release-config.json').read_text())
    registry = json.loads((ROOT/'scripts.json').read_text())
    by_id = {row['id']: row for row in registry['scripts']}
    changes = []
    for entry in config['scripts']:
        path = ROOT/entry['file']
        source = path.read_text()
        old = re.search(r'(?m)^//\s*@version\s+(\S+)', source)[1]
        version = old
        if args.bump:
            digits = [int(n) for n in old.split('.')]
            if len(digits) not in (3, 4):
                raise ValueError(f'Unsupported version: {old}')
            version = f'{digits[0]}.{digits[1]}.{digits[2]+1}'
        notes = notes_by_id[entry['id']]
        source = re.sub(r'(?m)^(//\s*@version\s+)\S+', lambda m: m[1]+version, source, count=1)
        source = sync_runtime(source, version)
        path.write_text(source)
        sync_doc(ROOT/entry['doc'], version, notes, args.date)
        if entry['id'] in by_id:
            row = by_id[entry['id']]
            changed = row.get('version') != version or row.get('release', {}).get('notes') != notes
            row.update(version=version, release={'version': version, 'date': args.date, 'notes': notes})
            if changed:
                row['detailsRevision'] = int(row.get('detailsRevision', 0))+1
            row['info'] = row['info'].replace('\\n', '\n')
            row['info'] = re.sub(r'The current stable branch is v[\d.]+; ', '', row['info'])
        changes.append((entry['id'], old, version))
    registry['lastVerified'] = args.date
    (ROOT/'scripts.json').write_text(json.dumps(registry, indent=2, ensure_ascii=False)+'\n')
    hub_path = ROOT/'SakaLuX-Script-Hub.user.js'
    hub = hub_path.read_text()
    start = '    const FALLBACK_REGISTRY = '
    end = '\n\n    const FALLBACK_MODULE_DETAILS = '
    a = hub.index(start)
    b = hub.index(end, a)
    hub = hub[:a]+start+json.dumps(registry, indent=4, ensure_ascii=False).replace('\n', '\n    ')+hub[b:]
    version = next(v for key, _, v in changes if key == 'script-hub')
    if not re.search(rf"[\"']version[\"']?\s*:\s*[\"']{re.escape(version)}[\"']", hub[:a]):
        changelog = {'version': version, 'date': args.date, 'changes': notes_by_id['script-hub']}
        hub = hub.replace('    const HUB_CHANGELOG = [\n', '    const HUB_CHANGELOG = [\n        '+json.dumps(changelog, ensure_ascii=False)+',\n', 1)
    hub_path.write_text(hub)
    hub_doc = ROOT/'greasyfork/Script-Hub.md'
    text = hub_doc.read_text()
    for row in registry['scripts']:
        text = re.sub(rf'(?m)^(- .*?{re.escape(row["name"])}.*?\*\*v)[^*]+(\*\*)$', lambda m: m[1]+row['version']+m[2], text)
    hub_doc.write_text(text)
    for key, old, new in changes:
        print(f'{key}: {old} -> {new}')


if __name__ == '__main__':
    main()
