#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'release-config.json'
REGISTRY = ROOT / 'scripts.json'


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def metadata(source: str, key: str):
    m = re.search(rf'^//\s*@{re.escape(key)}\s+(.+?)\s*$', source, re.M)
    return m.group(1).strip() if m else None


def sha256(path: Path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def registry_filename(row):
    return unquote(urlparse(row.get('sourceUrl', '')).path.rsplit('/', 1)[-1])


def validate_entry(entry, registry_by_id):
    errors = []
    script = ROOT / entry['file']
    doc = ROOT / entry['doc']
    if not script.exists(): return [f"{entry['id']}: missing userscript {entry['file']}"]
    if not doc.exists(): return [f"{entry['id']}: missing documentation {entry['doc']}"]
    source = script.read_text(encoding='utf-8', errors='replace')
    version = metadata(source, 'version')
    name = metadata(source, 'name')
    license_name = metadata(source, 'license')
    download = metadata(source, 'downloadURL')
    update = metadata(source, 'updateURL')
    if not version: errors.append(f"{entry['id']}: missing @version")
    if not name: errors.append(f"{entry['id']}: missing @name")
    if not license_name: errors.append(f"{entry['id']}: missing @license")
    if not download: errors.append(f"{entry['id']}: missing @downloadURL")
    if not update: errors.append(f"{entry['id']}: missing @updateURL")
    try:
        subprocess.run(['node', '--check', str(script)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    except subprocess.CalledProcessError as exc:
        errors.append(f"{entry['id']}: node --check failed: {exc.stderr.strip()}")

    doc_text = doc.read_text(encoding='utf-8', errors='replace')
    if version:
        if f'**v{version}**' not in doc_text:
            errors.append(f"{entry['id']}: documentation current version does not match v{version}")
        if not re.search(rf'(?m)^###\s+v{re.escape(version)}(?:\s|$|—|-)', doc_text):
            errors.append(f"{entry['id']}: changelog entry missing for v{version}")
        current_note = re.search(r'## Current release note\s+\n+\*\*v([^\s*]+)', doc_text)
        if current_note and current_note.group(1) != version:
            errors.append(f"{entry['id']}: current release note is v{current_note.group(1)}, expected v{version}")
        canonical = re.search(r'Canonical version:\s*\*\*v([^*]+)\*\*', doc_text)
        if canonical and canonical.group(1).strip() != version:
            errors.append(f"{entry['id']}: canonical documentation version is v{canonical.group(1).strip()}, expected v{version}")

    row = registry_by_id.get(entry['id'])
    if entry.get('registry'):
        if not row:
            errors.append(f"{entry['id']}: marked registry=true but missing from scripts.json")
        elif version:
            if row.get('version') != version: errors.append(f"{entry['id']}: scripts.json version {row.get('version')} != {version}")
            if row.get('release', {}).get('version') != version: errors.append(f"{entry['id']}: release.version drift")
            if registry_filename(row) != entry['file']: errors.append(f"{entry['id']}: sourceUrl does not target {entry['file']}")
            if not row.get('release', {}).get('notes'): errors.append(f"{entry['id']}: release notes missing in scripts.json")
            if entry['doc'] not in row.get('documentationUrl', ''): errors.append(f"{entry['id']}: documentationUrl drift")
    elif row:
        errors.append(f"{entry['id']}: marked registry=false but unexpectedly present in scripts.json")

    return errors


def build_package(entry, out_root: Path, registry_by_id):
    script = ROOT / entry['file']
    doc = ROOT / entry['doc']
    source = script.read_text(encoding='utf-8', errors='replace')
    version = metadata(source, 'version')
    name = metadata(source, 'name') or entry['id']
    tag = f"{entry['tagPrefix']}{version}"
    target = out_root / f"{entry['id']}-v{version}"
    if target.exists(): shutil.rmtree(target)
    target.mkdir(parents=True, exist_ok=True)
    shutil.copy2(script, target / script.name)
    shutil.copy2(doc, target / doc.name)
    row = registry_by_id.get(entry['id'])
    notes = ''
    if row: notes = str(row.get('release', {}).get('notes') or '').strip()
    doc_text = doc.read_text(encoding='utf-8', errors='replace')
    current = re.search(r'## Current release note\s+\n+(.+?)(?=\n## |\Z)', doc_text, re.S)
    if current: notes = current.group(1).strip()
    release_info = target / 'RELEASE_INFO.md'
    release_info.write_text(
        f"# {name} v{version}\n\n"
        f"- Script ID: `{entry['id']}`\n"
        f"- Version: `{version}`\n"
        f"- Tag: `{tag}`\n"
        f"- Userscript: `{script.name}`\n"
        f"- Documentation: `{entry['doc']}`\n"
        f"- Registry managed: `{str(bool(entry.get('registry'))).lower()}`\n\n"
        f"## Release notes\n\n{notes or 'See the bundled documentation changelog.'}\n",
        encoding='utf-8'
    )
    manifest = {
        'schema': 'sakalux-release-package-v1', 'id': entry['id'], 'name': name,
        'version': version, 'tag': tag, 'script': script.name, 'documentation': entry['doc'],
        'registryManaged': bool(entry.get('registry'))
    }
    (target / 'release-manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    assets = [target / script.name, target / doc.name, release_info, target / 'release-manifest.json']
    sums = '\n'.join(f"{sha256(p)}  {p.name}" for p in assets) + '\n'
    (target / 'SHA256SUMS').write_text(sums, encoding='utf-8')
    return target, manifest


def main():
    ap = argparse.ArgumentParser()
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument('--all', action='store_true')
    group.add_argument('--id')
    ap.add_argument('--out', default='dist/releases')
    args = ap.parse_args()

    cfg = load_json(CONFIG)
    entries = cfg.get('scripts', [])
    registry = load_json(REGISTRY).get('scripts', [])
    registry_by_id = {row['id']: row for row in registry}
    ids = [e['id'] for e in entries]
    if len(ids) != len(set(ids)):
        raise SystemExit('release-config.json has duplicate ids')
    targets = entries if args.all else [e for e in entries if e['id'] == args.id]
    if not targets:
        raise SystemExit(f'Unknown release id: {args.id}')

    errors = []
    for entry in targets: errors.extend(validate_entry(entry, registry_by_id))
    if errors:
        print('Release preflight FAILED:', file=sys.stderr)
        for err in errors: print(' - ' + err, file=sys.stderr)
        raise SystemExit(1)

    print(f'Release preflight passed for {len(targets)} script(s).')
    if args.id:
        target, manifest = build_package(targets[0], ROOT / args.out, registry_by_id)
        print(json.dumps({'package': str(target.relative_to(ROOT)), **manifest}, ensure_ascii=False))

if __name__ == '__main__': main()
