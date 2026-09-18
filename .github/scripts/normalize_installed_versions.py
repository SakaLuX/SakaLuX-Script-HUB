#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import unquote, urlparse
import json
import re

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / 'scripts.json'
HUB = ROOT / 'SakaLuX-Script-Hub.user.js'

MARK_BEGIN = '/* SakaLuX Canonical Installed Version — BEGIN */'
MARK_END = '/* SakaLuX Canonical Installed Version — END */'


def header_version(text: str) -> str:
    m = re.search(r'(?m)^//\s*@version\s+(\S+)', text)
    if not m:
        raise RuntimeError('Missing @version')
    return m.group(1).strip()


def bump_patch(v: str) -> str:
    parts = v.split('.')
    if not all(p.isdigit() for p in parts):
        raise RuntimeError(f'Cannot bump non-numeric version {v}')
    while len(parts) < 3:
        parts.append('0')
    parts[-1] = str(int(parts[-1]) + 1)
    return '.'.join(parts)


def source_path(url: str) -> Path:
    return ROOT / unquote(Path(urlparse(url).path).name)


def marker_block(script_id: str, version: str) -> str:
    return f'''{MARK_BEGIN}\n(() => {{\n  'use strict';\n  let v = '{version}';\n  try {{\n    const meta = globalThis.GM_info && globalThis.GM_info.script && globalThis.GM_info.script.version;\n    if (meta) v = String(meta);\n  }} catch {{}}\n  const g = globalThis;\n  g.__SakaLuXInstalledVersions = g.__SakaLuXInstalledVersions || Object.create(null);\n  g.__SakaLuXInstalledVersions['{script_id}'] = v;\n  try {{\n    document.documentElement?.setAttribute('data-sakalux-installed-{script_id}', v);\n  }} catch {{}}\n}})();\n{MARK_END}'''


def upsert_marker(text: str, script_id: str, version: str) -> str:
    block = marker_block(script_id, version)
    pat = re.compile(re.escape(MARK_BEGIN) + r'.*?' + re.escape(MARK_END), re.S)
    if pat.search(text):
        return pat.sub(block, text, count=1)
    end = text.find('// ==/UserScript==')
    if end < 0:
        raise RuntimeError(f'{script_id}: userscript header terminator missing')
    end += len('// ==/UserScript==')
    return text[:end] + '\n\n' + block + text[end:]


def replace_header_version(text: str, version: str) -> str:
    return re.sub(r'(?m)^(//\s*@version\s+)\S+', lambda m: m.group(1) + version, text, count=1)


def sync_obvious_runtime_constants(text: str, old: str, new: str) -> str:
    # Keep the common runtime constants aligned too. The canonical marker remains
    # authoritative for Hub detection, so unusual module internals cannot create
    # false UPDATE AVAILABLE states.
    text = re.sub(
        r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(old) + r"(['\"]\s*;)",
        lambda m: m.group(1) + new + m.group(2), text, count=1
    )
    # Standalone dock SELF registration is another installed-version signal.
    text = re.sub(
        r"(\{\s*version\s*:\s*['\"])" + re.escape(old) + r"(['\"]\s*\}\s*\))",
        lambda m: m.group(1) + new + m.group(2), text, count=1
    )
    return text


def ensure_hub_prefers_canonical(text: str) -> tuple[str, bool]:
    sentinel = 'Canonical metadata marker: authoritative installed version.'
    if sentinel in text:
        return text, False
    needle = '    function getInstalledVersion(script) {\n'
    if needle not in text:
        raise RuntimeError('Hub getInstalledVersion() not found')
    injected = needle + "        // Canonical metadata marker: authoritative installed version.\n        try {\n            const canonical = globalThis.__SakaLuXInstalledVersions?.[script.id]\n                || document.documentElement?.getAttribute('data-sakalux-installed-' + script.id);\n            const v = String(canonical || '').trim();\n            if (/^\\d+(?:\\.\\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?$/.test(v)) return v;\n        } catch {}\n"
    return text.replace(needle, injected, 1), True


registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
changed_files = []

for row in registry.get('scripts', []):
    if not row.get('active', True):
        continue
    path = source_path(row['sourceUrl'])
    text = path.read_text(encoding='utf-8')
    old = header_version(text)
    first_install = MARK_BEGIN not in text
    new = bump_patch(old) if first_install else old
    if new != old:
        text = replace_header_version(text, new)
        text = sync_obvious_runtime_constants(text, old, new)
    text = upsert_marker(text, row['id'], new)
    path.write_text(text, encoding='utf-8')
    if first_install:
        changed_files.append(path.name)

    row['version'] = new
    release = row.setdefault('release', {})
    release['version'] = new
    if first_install:
        notes = release.get('notes') if isinstance(release.get('notes'), list) else []
        note = 'Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.'
        if note not in notes:
            notes.insert(0, note)
        release['notes'] = notes

REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

hub_text = HUB.read_text(encoding='utf-8')
hub_old = header_version(hub_text)
hub_text, hub_detection_changed = ensure_hub_prefers_canonical(hub_text)
if hub_detection_changed:
    hub_new = bump_patch(hub_old)
    hub_text = replace_header_version(hub_text, hub_new)
    hub_text = re.sub(
        r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(hub_old) + r"(['\"]\s*;)",
        lambda m: m.group(1) + hub_new + m.group(2), hub_text, count=1
    )
    changed_files.append(HUB.name)
HUB.write_text(hub_text, encoding='utf-8')

print('Canonical installed-version normalization complete.')
print('Initial migrations:', ', '.join(changed_files) if changed_files else 'none')
