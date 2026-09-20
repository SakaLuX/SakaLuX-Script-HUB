#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import unquote, urlparse
from datetime import date
import json
import re

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / 'scripts.json'
HUB = ROOT / 'SakaLuX-Script-Hub.user.js'
TODAY = date.today().isoformat()

MARK_BEGIN = '/* SakaLuX Canonical Installed Version — BEGIN */'
MARK_END = '/* SakaLuX Canonical Installed Version — END */'

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
    text = re.sub(
        r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(old) + r"(['\"]\s*;)",
        lambda m: m.group(1) + new + m.group(2), text, count=1
    )
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


def sync_hub_fallback_registry(text: str, registry: dict) -> str:
    start_token = '    const FALLBACK_REGISTRY = '
    end_token = '\n\n    let registry = '
    start = text.find(start_token)
    end = text.find(end_token, start)
    if start < 0 or end < 0:
        raise RuntimeError('Hub FALLBACK_REGISTRY boundaries not found')
    payload = json.dumps(registry, indent=4, ensure_ascii=False)
    replacement = start_token + payload.replace('\n', '\n    ')
    text = text[:start] + replacement + text[end:]

    # Always rebuild fallback details from the canonical registry so stale embedded
    # module INFO/NEW data cannot survive a scripts.json synchronization.
    details_pat = re.compile(
        r'\n\n    const FALLBACK_MODULE_DETAILS = Object\.fromEntries\(\n'
        r'.*?\n    \);', re.S
    )
    details = "\n\n    const FALLBACK_MODULE_DETAILS = Object.fromEntries(\n        (FALLBACK_REGISTRY.scripts || []).map(s => [s.id, { info: s.info, release: s.release }])\n    );"
    if details_pat.search(text):
        text = details_pat.sub(details, text, count=1)
    else:
        marker = '\n\n    let registry = '
        pos = text.find(marker, start)
        if pos < 0:
            raise RuntimeError('Hub registry insertion marker missing')
        text = text[:pos] + details + text[pos:]
    return text


def ensure_hub_changelog(text: str, version: str) -> str:
    if re.search(rf"[\"']version[\"']\s*:\s*[\"']{re.escape(version)}[\"']", text):
        return text
    needle = '    const HUB_CHANGELOG = [\n'
    if needle not in text:
        return text
    notes = [
        'Uses metadata-derived canonical installed versions for managed modules to prevent false UPDATE AVAILABLE states.',
        'Synchronizes scripts.json, the offline Hub registry, NEW release details and release markdown surfaces from the same release metadata.'
    ]
    entry = '        ' + json.dumps({'version': version, 'date': TODAY, 'changes': notes}, ensure_ascii=False) + ',\n'
    return text.replace(needle, needle + entry, 1)


def release_title(notes: list[str]) -> str:
    if not notes:
        return 'Release metadata synchronization'
    first = notes[0].strip().rstrip('.')
    return first if len(first) <= 90 else 'Release metadata synchronization'


def sync_release_doc(path: Path, version: str, notes: list[str], title: str | None = None) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding='utf-8')
    notes = [str(n).strip() for n in notes if str(n).strip()]
    if not notes:
        notes = ['Release metadata synchronized with the current userscript.']
    title = title or release_title(notes)
    bullets = '\n'.join(f'- {n}' for n in notes)

    current_version = f'## Current version\n**v{version}**'
    if re.search(r'(?is)##\s+Current version\s*\n+\s*\*\*v?[^*\n]+\*\*', text):
        text = re.sub(
            r'(?is)##\s+Current version\s*\n+\s*\*\*v?[^*\n]+\*\*',
            current_version,
            text,
            count=1,
        )

    release_block = f'## Current release note\n\n**v{version} — {title}**\n{bullets}\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', text)
    if m:
        text = text[:m.start()] + release_block.rstrip() + '\n' + text[m.end():]

    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', text)
    entry_pat = re.compile(rf'(?im)^###\s+v?{re.escape(version)}(?:\s|—|-|$)')
    if heading and not entry_pat.search(text):
        insert_at = heading.end()
        entry = f'\n\n### v{version} — {title}\n{bullets}\n'
        text = text[:insert_at] + entry + text[insert_at:]

    path.write_text(text, encoding='utf-8')


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
    release.setdefault('date', TODAY)
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
else:
    hub_new = header_version(hub_text)

# Keep Hub's offline registry identical to scripts.json. This also makes the NEW
# buttons show the same release/version details even when the remote registry is
# unavailable or a stale local registry would otherwise be used.
hub_text = sync_hub_fallback_registry(hub_text, registry)
hub_text = ensure_hub_changelog(hub_text, hub_new)
HUB.write_text(hub_text, encoding='utf-8')

# Synchronize all managed release markdowns from the exact metadata used by Hub NEW.
for row in registry.get('scripts', []):
    doc_name = DOC_BY_ID.get(row.get('id'))
    if not doc_name:
        continue
    release = row.get('release') or {}
    sync_release_doc(
        ROOT / doc_name,
        str(row.get('version') or release.get('version')),
        release.get('notes') if isinstance(release.get('notes'), list) else [],
    )

# Hub's own MD follows the Hub userscript/changelog version as well.
hub_notes = [
    "Makes the Fly-out Hub launcher a persistent native child of Torn's vertical navigation list, matching CAT-style behavior instead of viewport-driven mounting.",
    'Keeps SakaLuX Hub permanently as the first row of the vertical list while that Torn menu exists; scrolling no longer removes or recreates it.',
    'Keeps module INFO, NEW, scripts.json, offline fallback data, release documentation and version labels synchronized to the userscript metadata versions.'
]
hub_doc = ROOT / 'greasyfork/Script-Hub.md'
sync_release_doc(hub_doc, hub_new, hub_notes, 'Persistent native Fly-out launcher + release synchronization')

# Keep the registered add-on list and version prose on the Hub page aligned too.
if hub_doc.exists():
    md = hub_doc.read_text(encoding='utf-8')
    for row in registry.get('scripts', []):
        name = re.escape(str(row.get('name') or ''))
        if not name:
            continue
        md = re.sub(
            rf'(?m)^(- .*?{name}.*?\*\*v)[^*]+(\*\*)$',
            lambda m, v=str(row.get('version')): m.group(1) + v + m.group(2),
            md, count=1
        )
    company = next((x for x in registry.get('scripts', []) if x.get('id') == 'company-intelligence'), None)
    if company:
        md = re.sub(
            r'(Company Intelligence is currently registered at \*\*v)[^*]+(\*\*)',
            lambda m: m.group(1) + str(company.get('version')) + m.group(2),
            md, count=1
        )
    hub_doc.write_text(md, encoding='utf-8')

# Standalone tools are not Hub registry modules, but their release docs still follow metadata.
standalone_docs = [
    ('SakaLuX-Chat-Intelligence.user.js', 'greasyfork/Chat-Intelligence.md', 'Chat Intelligence'),
    ('SakaLuX-Account-Auditor.user.js', 'greasyfork/Account-Auditor.md', 'Account Auditor'),
    ('SakaLuX-Suite.user.js', 'greasyfork/SakaLuX-Suite.md', 'Suite'),
]
for src_name, doc_name, label in standalone_docs:
    src = ROOT / src_name
    doc = ROOT / doc_name
    if src.exists() and doc.exists():
        v = header_version(src.read_text(encoding='utf-8'))
        sync_release_doc(doc, v, [f'Release documentation synchronized with the current {label} userscript version.'])

print('Canonical installed-version normalization complete.')
print('Hub fallback registry and NEW release metadata synchronized.')
print('Release markdowns synchronized.')
print('Initial migrations:', ', '.join(changed_files) if changed_files else 'none')
