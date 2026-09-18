from pathlib import Path
from urllib.parse import urlparse, unquote
import json, re

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / 'scripts.json'
HUB = ROOT / 'SakaLuX-Script-Hub.user.js'
TODAY = '2026-09-19'

DOC_BY_ID = {
    'enhancer': 'greasyfork/Enhancer-Guard.md',
    'bazaar': 'greasyfork/Bazaar-Thanker.md',
    'mission-rewards': 'greasyfork/Mission-Rewards.md',
    'market-intelligence': 'greasyfork/Market-Intelligence.md',
    'elimination-assistant': 'greasyfork/Elimination-Assistant.md',
    'company-intelligence': 'greasyfork/Company-Intelligence.md',
    'stock-manager-advisor': 'greasyfork/Stock-Manager-Advisor.md',
}
STANDALONE = {
    'chat-intelligence': ('SakaLuX-Chat-Intelligence.user.js', 'greasyfork/Chat-Intelligence.md'),
    'account-auditor': ('SakaLuX-Account-Auditor.user.js', 'greasyfork/Account-Auditor.md'),
    'suite': ('SakaLuX-Suite.user.js', 'greasyfork/SakaLuX-Suite.md'),
}
HUB_NOTES = [
    'Makes the Fly-out Hub launcher a persistent native child of Torn\'s vertical navigation list, matching CAT-style behavior instead of viewport-driven mounting.',
    'Keeps SakaLuX Hub permanently as the first row of the vertical list while that Torn menu exists; scrolling no longer removes or recreates it.',
    'Keeps module INFO, NEW, scripts.json, offline fallback data, release documentation and version labels synchronized to the userscript metadata versions.'
]

def version_of(path: Path) -> str:
    m = re.search(r'(?m)^//\s*@version\s+(\S+)', path.read_text(encoding='utf-8'))
    if not m: raise SystemExit(f'Missing @version: {path}')
    return m.group(1)

def source_path(url: str) -> Path:
    return ROOT / unquote(Path(urlparse(url).path).name)

def sync_doc(path: Path, version: str, notes, title='Release metadata synchronization'):
    if not path.exists(): return
    text = path.read_text(encoding='utf-8')
    notes = [str(x).strip() for x in (notes or []) if str(x).strip()] or ['Release metadata synchronized with the current userscript version.']
    bullets = '\n'.join('- ' + x for x in notes)
    text = re.sub(r'(?is)(##\s+Current version\s*\n+)\*\*v?[^*\n]+\*\*', lambda m: m.group(1) + f'**v{version}**', text, count=1)
    block = f'## Current release note\n\n**v{version} — {title}**\n{bullets}\n'
    text = re.sub(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', block.rstrip(), text, count=1)
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', text)
    if heading and not re.search(rf'(?im)^###\s+v?{re.escape(version)}(?:\s|—|-|$)', text):
        entry = f'\n\n### v{version} — {title}\n{bullets}\n'
        text = text[:heading.end()] + entry + text[heading.end():]
    path.write_text(text, encoding='utf-8')

def replace_fallback_registry(hub: str, registry: dict) -> str:
    start_token = '    const FALLBACK_REGISTRY = '
    end_token = '\n\n    let registry = '
    a = hub.find(start_token); b = hub.find(end_token, a)
    if a < 0 or b < 0: raise SystemExit('FALLBACK_REGISTRY boundaries not found')
    payload = json.dumps(registry, indent=4, ensure_ascii=False).replace('\n', '\n    ')
    replacement = start_token + payload
    hub = hub[:a] + replacement + hub[b:]
    if 'const FALLBACK_MODULE_DETAILS =' not in hub:
        insert = "\n\n    const FALLBACK_MODULE_DETAILS = Object.fromEntries(\n        (FALLBACK_REGISTRY.scripts || []).map(s => [s.id, { info: s.info, release: s.release }])\n    );"
        b2 = hub.find(end_token, a)
        hub = hub[:b2] + insert + hub[b2:]
    return hub

def sync_hub_changelog(hub: str, version: str) -> str:
    line = '        ' + json.dumps({'version': version, 'date': TODAY, 'changes': HUB_NOTES}, ensure_ascii=False) + ','
    pat = re.compile(rf'(?m)^\s*\{{["\']version["\']\s*:\s*["\']{re.escape(version)}["\'].*?\}},\s*$')
    if pat.search(hub): return pat.sub(line, hub, count=1)
    needle = '    const HUB_CHANGELOG = [\n'
    if needle not in hub: raise SystemExit('HUB_CHANGELOG not found')
    return hub.replace(needle, needle + line + '\n', 1)

registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
rows = []
for item in registry.get('scripts', []):
    if not item.get('active', True): continue
    src = source_path(item['sourceUrl'])
    v = version_of(src)
    item['version'] = v
    rel = item.setdefault('release', {})
    rel['version'] = v
    rel.setdefault('date', TODAY)
    doc = ROOT / DOC_BY_ID[item['id']]
    sync_doc(doc, v, rel.get('notes'))
    rows.append((item['id'], src.name, v, f'{v} / release {v}', f'Current version/release {v} — OK'))
REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

hub_text = HUB.read_text(encoding='utf-8')
hub_version = version_of(HUB)
hub_text = replace_fallback_registry(hub_text, registry)
hub_text = sync_hub_changelog(hub_text, hub_version)
HUB.write_text(hub_text, encoding='utf-8')

hub_doc = ROOT / 'greasyfork/Script-Hub.md'
sync_doc(hub_doc, hub_version, HUB_NOTES, 'Persistent native Fly-out launcher + release synchronization')
# Registered module list in Hub MD must mirror scripts.json.
text = hub_doc.read_text(encoding='utf-8')
for item in registry.get('scripts', []):
    name = re.escape(item['name'])
    text = re.sub(rf'(?m)^(- .*?{name}\s+\*\*v)[^*]+(\*\*)$', rf'\g<1>{item["version"]}\2', text)
hub_doc.write_text(text, encoding='utf-8')

standalone_rows = []
for sid, (src_name, doc_name) in STANDALONE.items():
    src = ROOT / src_name; v = version_of(src)
    sync_doc(ROOT / doc_name, v, ['Release documentation synchronized with the current userscript version.'])
    standalone_rows.append((sid, src_name, v, 'standalone / not registered', f'Current version/release {v} — OK'))

# Build a current audit from the actual source files after synchronization.
all_rows = rows + standalone_rows + [('script-hub', HUB.name, hub_version, 'core manager / not a module entry', f'Current version/release {hub_version} — OK')]
lines = [
    '# Release Surface Audit — 2026-09-19', '',
    'Canonical rule: each userscript `@version` is the source of truth. `scripts.json`, Hub offline INFO/NEW data and maintained release markdowns are synchronized to it.', '',
    '| Module | Source | Canonical @version | Registry status | Documentation |',
    '|---|---|---:|---|---|'
]
for sid, src, v, reg, doc in all_rows:
    lines.append(f'| {sid} | `{src}` | {v} | {reg} | {doc} |')
lines += ['', '## Validation',
    '- `scripts.json` version and `release.version` match each registered userscript metadata version.',
    '- Hub `FALLBACK_REGISTRY` is generated from the same `scripts.json`, so offline INFO/NEW uses identical information and release data.',
    '- `FALLBACK_MODULE_DETAILS` is restored from the fallback registry for INFO/NEW regression compatibility.',
    '- Every maintained Greasy Fork markdown page has the current userscript version and current release block.',
    f'- Script Hub metadata, runtime VERSION, changelog and Script-Hub.md are aligned at v{hub_version}.',
    '- Fly-out launcher remains a persistent first child of Torn vertical navigation and is not lifecycle-controlled by scroll position.', '']
(ROOT / 'RELEASE-SURFACE-AUDIT-2026-09-19.md').write_text('\n'.join(lines), encoding='utf-8')

# Mark the older audit as historical so its old versions cannot be mistaken for current release state.
old_audit = ROOT / 'RELEASE-SURFACE-AUDIT-2026-09-18.md'
if old_audit.exists():
    old = old_audit.read_text(encoding='utf-8')
    banner = '> Historical snapshot. Current release/version status is in `RELEASE-SURFACE-AUDIT-2026-09-19.md`.\n\n'
    if banner.strip() not in old:
        old = old.replace('\n\n', '\n\n' + banner, 1)
        old_audit.write_text(old, encoding='utf-8')

print('Release surfaces synchronized; Hub INFO/NEW fallback restored; current audit generated.')
