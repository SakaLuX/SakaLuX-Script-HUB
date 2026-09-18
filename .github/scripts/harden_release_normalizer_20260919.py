from pathlib import Path

p = Path('.github/scripts/normalize_installed_versions.py')
s = p.read_text(encoding='utf-8')

# 1) Permanent INFO/NEW fallback contract.
old = """    payload = json.dumps(registry, indent=4, ensure_ascii=False)\n    replacement = start_token + payload.replace('\\n', '\\n    ')\n    return text[:start] + replacement + text[end:]\n"""
new = """    payload = json.dumps(registry, indent=4, ensure_ascii=False)\n    replacement = start_token + payload.replace('\\n', '\\n    ')\n    text = text[:start] + replacement + text[end:]\n    if 'const FALLBACK_MODULE_DETAILS =' not in text:\n        marker = '\\n\\n    let registry = '\n        pos = text.find(marker, start)\n        if pos < 0:\n            raise RuntimeError('Hub registry insertion marker missing')\n        details = \"\\n\\n    const FALLBACK_MODULE_DETAILS = Object.fromEntries(\\n        (FALLBACK_REGISTRY.scripts || []).map(s => [s.id, { info: s.info, release: s.release }])\\n    );\"\n        text = text[:pos] + details + text[pos:]\n    return text\n"""
if old not in s:
    raise SystemExit('sync_hub_fallback_registry block not found')
s = s.replace(old, new, 1)

# 2) Hub release notes must describe the actual current 1.9.82 release, not an older generic sync release.
old = """hub_notes = [\n    'Uses metadata-derived canonical installed versions for managed modules to prevent false UPDATE AVAILABLE states.',\n    'Synchronizes scripts.json, the offline Hub registry, NEW release details and release markdown surfaces from the same release metadata.'\n]\nsync_release_doc(ROOT / 'greasyfork/Script-Hub.md', hub_new, hub_notes, 'Canonical release/version synchronization')\n"""
new = """hub_notes = [\n    \"Makes the Fly-out Hub launcher a persistent native child of Torn's vertical navigation list, matching CAT-style behavior instead of viewport-driven mounting.\",\n    'Keeps SakaLuX Hub permanently as the first row of the vertical list while that Torn menu exists; scrolling no longer removes or recreates it.',\n    'Keeps module INFO, NEW, scripts.json, offline fallback data, release documentation and version labels synchronized to the userscript metadata versions.'\n]\nhub_doc = ROOT / 'greasyfork/Script-Hub.md'\nsync_release_doc(hub_doc, hub_new, hub_notes, 'Persistent native Fly-out launcher + release synchronization')\n\n# Keep the registered add-on list and version prose on the Hub page aligned too.\nif hub_doc.exists():\n    md = hub_doc.read_text(encoding='utf-8')\n    for row in registry.get('scripts', []):\n        name = re.escape(str(row.get('name') or ''))\n        if not name:\n            continue\n        md = re.sub(\n            rf'(?m)^(- .*?{name}.*?\\*\\*v)[^*]+(\\*\\*)$',\n            lambda m, v=str(row.get('version')): m.group(1) + v + m.group(2),\n            md, count=1\n        )\n    company = next((x for x in registry.get('scripts', []) if x.get('id') == 'company-intelligence'), None)\n    if company:\n        md = re.sub(\n            r'(Company Intelligence is currently registered at \\*\\*v)[^*]+(\\*\\*)',\n            lambda m: m.group(1) + str(company.get('version')) + m.group(2),\n            md, count=1\n        )\n    hub_doc.write_text(md, encoding='utf-8')\n"""
if old not in s:
    raise SystemExit('Hub notes block not found')
s = s.replace(old, new, 1)

# 3) Standalone docs: Chat + Account Auditor + Suite all follow their own metadata.
old = """# Standalone Suite is not a Hub registry module, but keep its MD version label aligned.\nsuite = ROOT / 'SakaLuX-Suite.user.js'\nsuite_doc = ROOT / 'greasyfork/SakaLuX-Suite.md'\nif suite.exists() and suite_doc.exists():\n    suite_version = header_version(suite.read_text(encoding='utf-8'))\n    sync_release_doc(suite_doc, suite_version, ['Release documentation synchronized with the current Suite userscript version.'])\n"""
new = """# Standalone tools are not Hub registry modules, but their release docs still follow metadata.\nstandalone_docs = [\n    ('SakaLuX-Chat-Intelligence.user.js', 'greasyfork/Chat-Intelligence.md', 'Chat Intelligence'),\n    ('SakaLuX-Account-Auditor.user.js', 'greasyfork/Account-Auditor.md', 'Account Auditor'),\n    ('SakaLuX-Suite.user.js', 'greasyfork/SakaLuX-Suite.md', 'Suite'),\n]\nfor src_name, doc_name, label in standalone_docs:\n    src = ROOT / src_name\n    doc = ROOT / doc_name\n    if src.exists() and doc.exists():\n        v = header_version(src.read_text(encoding='utf-8'))\n        sync_release_doc(doc, v, [f'Release documentation synchronized with the current {label} userscript version.'])\n"""
if old not in s:
    raise SystemExit('Standalone Suite block not found')
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
print('Permanent release normalizer hardened.')
