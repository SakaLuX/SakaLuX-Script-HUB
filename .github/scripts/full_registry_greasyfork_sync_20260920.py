from pathlib import Path
import json, re
from urllib.parse import quote, unquote, urlparse

ROOT = Path(__file__).resolve().parents[2]
TODAY = '2026-09-20'
REPO_RAW = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/'
REPO_PAGE = 'https://github.com/SakaLuX/SakaLuX-Script-HUB'

DOC_MAP = {
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

# IDs verified from the owner's GreasyFork page / current project metadata.
FORCED_GF_IDS = {
    'SakaLuX-Bazaar-Smart-Pricer.user.js': '596672',
    'SakaLuX-Script-Hub.user.js': '592699',
}
MIT_DEFAULT = {
    'SakaLuX-Account-Auditor.user.js',
    'SakaLuX-Bazaar-Smart-Pricer.user.js',
}


def parse_meta(text):
    end = text.find('// ==/UserScript==')
    if end < 0:
        raise SystemExit('Missing userscript metadata block')
    header = text[:end + len('// ==/UserScript==')]
    meta = {}
    for line in header.splitlines():
        m = re.match(r'^//\s*@([^\s]+)\s*(.*)$', line)
        if m:
            meta.setdefault(m.group(1), []).append(m.group(2).strip())
    return header, meta


def one(meta, key, default=''):
    vals = meta.get(key, [])
    return vals[0] if vals else default


def replace_meta(text, key, value):
    pat = re.compile(rf'^//\s*@{re.escape(key)}\s+.*$', re.M)
    line = f'// @{key:<12} {value}'
    if pat.search(text):
        return pat.sub(line, text, count=1)
    anchor = re.search(r'^//\s*@author\s+.*$', text, re.M)
    if key == 'license' and anchor:
        pos = anchor.end()
        return text[:pos] + '\n' + line + text[pos:]
    marker = '// ==/UserScript=='
    return text.replace(marker, line + '\n' + marker, 1)


def infer_gf_id(row, meta, filename):
    if filename in FORCED_GF_IDS:
        return FORCED_GF_IDS[filename]
    candidates = [
        str((row or {}).get('greasyForkId') or ''),
        str((row or {}).get('downloadUrl') or ''),
        str((row or {}).get('metaUrl') or ''),
        one(meta, 'downloadURL'), one(meta, 'updateURL')
    ]
    for value in candidates:
        m = re.search(r'(?:greasyfork\.org/(?:[^/]+/)?scripts/|update\.greasyfork\.org/scripts/)(\d+)', value)
        if m:
            return m.group(1)
    return ''


def update_doc(path, filename, meta, row, gf_id):
    old = path.read_text(encoding='utf-8') if path.exists() else ''
    name = one(meta, 'name', (row or {}).get('name', filename))
    version = one(meta, 'version', (row or {}).get('version', ''))
    desc = one(meta, 'description', (row or {}).get('description', ''))
    license_name = one(meta, 'license', 'All Rights Reserved')
    source = REPO_RAW + filename
    doc_raw = REPO_RAW + DOC_MAP[filename]
    download = one(meta, 'downloadURL', source)
    update = one(meta, 'updateURL', source)
    gf_page = f'https://greasyfork.org/scripts/{gf_id}' if gf_id else 'Not currently registered with a verified GreasyFork script ID.'

    if not old.strip():
        old = f'# {name}\n\n> {desc}\n\n## Current version\n**v{version}**\n'

    # Keep the hand-written details/changelog, but always make the displayed current version canonical.
    cv = re.compile(r'(##\s+Current version\s*\n+)(?:\s*)\*\*v[^*]+\*\*', re.I)
    if cv.search(old):
        old = cv.sub(rf'\1**v{version}**', old, count=1)
    else:
        first_break = old.find('\n')
        insert = f'\n\n## Current version\n**v{version}**\n'
        old = old[:first_break] + insert + old[first_break:] if first_break >= 0 else old + insert

    block = (
        '## Repository synchronization\n\n'
        f'- Verified: **{TODAY}**\n'
        f'- Canonical version: **v{version}**\n'
        f'- License: **{license_name}**\n'
        f'- Canonical GitHub source: {source}\n'
        f'- GreasyFork description source: {doc_raw}\n'
        f'- GreasyFork page: {gf_page}\n'
        f'- Install/download URL: {download}\n'
        f'- Update metadata URL: {update}\n'
    )
    sync_re = re.compile(r'## Repository synchronization\n.*?(?=\n## |\Z)', re.S)
    if sync_re.search(old):
        old = sync_re.sub(block.rstrip(), old, count=1)
    else:
        marker = re.search(r'##\s+Current version\s*\n+\*\*v[^*]+\*\*[^\n]*\n?', old, re.I)
        if marker:
            pos = marker.end()
            old = old[:pos] + '\n\n' + block + old[pos:]
        else:
            old = block + '\n' + old

    path.write_text(old.rstrip() + '\n', encoding='utf-8')


def main():
    reg_path = ROOT / 'scripts.json'
    data = json.loads(reg_path.read_text(encoding='utf-8'))
    rows = data.get('scripts') or []
    if not rows:
        raise SystemExit('scripts.json has no modules')

    by_file = {}
    for row in rows:
        source = row.get('sourceUrl', '')
        fn = unquote(urlparse(source).path.rsplit('/', 1)[-1]) if source else ''
        if fn:
            by_file[fn] = row

    managed = sorted(ROOT.glob('SakaLuX-*.user.js'))
    summary = []
    registry_failures = []

    for path in managed:
        filename = path.name
        row = by_file.get(filename)
        text = path.read_text(encoding='utf-8')
        _, meta = parse_meta(text)
        version = one(meta, 'version')
        name = one(meta, 'name')
        if not version or not name:
            raise SystemExit(f'Missing @name/@version in {filename}')

        # Preserve an explicit existing license. For SakaLuX-owned files missing one,
        # default to restrictive ARR except the two explicitly MIT-derived tools.
        if not one(meta, 'license'):
            license_name = 'MIT' if filename in MIT_DEFAULT else 'All Rights Reserved'
            text = replace_meta(text, 'license', license_name)
            _, meta = parse_meta(text)

        gf_id = infer_gf_id(row, meta, filename)
        source = REPO_RAW + filename
        if gf_id:
            encoded_name = quote(name, safe='')
            gf_download = f'https://update.greasyfork.org/scripts/{gf_id}/{encoded_name}.user.js'
            gf_update = f'https://update.greasyfork.org/scripts/{gf_id}/{encoded_name}.meta.js'
            text = replace_meta(text, 'downloadURL', gf_download)
            text = replace_meta(text, 'updateURL', gf_update)
        else:
            # Do not invent a GreasyFork ID for unpublished/private standalone scripts.
            # Keep them self-updating from the canonical GitHub source until a real ID exists.
            text = replace_meta(text, 'downloadURL', source)
            text = replace_meta(text, 'updateURL', source)

        if not one(meta, 'homepage'):
            text = replace_meta(text, 'homepage', REPO_PAGE)
        if not one(meta, 'supportURL'):
            text = replace_meta(text, 'supportURL', REPO_PAGE + '/issues')
        path.write_text(text, encoding='utf-8')
        _, meta = parse_meta(text)

        # scripts.json is intentionally the Hub complementary-addon registry, not a list
        # of every standalone/private SakaLuX userscript. Only synchronize entries that
        # are actually registered there.
        if row is not None:
            if not gf_id:
                registry_failures.append(filename)
            else:
                encoded_name = quote(name, safe='')
                gf_download = f'https://update.greasyfork.org/scripts/{gf_id}/{encoded_name}.user.js'
                gf_update = f'https://update.greasyfork.org/scripts/{gf_id}/{encoded_name}.meta.js'
                row['version'] = version
                row['sourceUrl'] = source
                row['downloadUrl'] = gf_download
                row['updateUrl'] = gf_update
                row['metaUrl'] = gf_update
                row['greasyForkId'] = str(gf_id)
                row['greasyForkUrl'] = f'https://greasyfork.org/scripts/{gf_id}'
                row['documentationUrl'] = REPO_RAW + DOC_MAP[filename]
                row['license'] = one(meta, 'license')
                release = row.setdefault('release', {})
                if release.get('version') != version:
                    release['version'] = version
                    release['date'] = TODAY
                    release['notes'] = ['Repository registry and GreasyFork metadata synchronized with the canonical userscript.']
                elif not release.get('notes'):
                    release['notes'] = ['Repository metadata synchronized with the canonical userscript.']
                release.setdefault('date', TODAY)

        doc_rel = DOC_MAP.get(filename)
        if doc_rel:
            doc_path = ROOT / doc_rel
            if not doc_path.exists():
                raise SystemExit(f'Missing GreasyFork MD for {filename}: {doc_rel}')
            update_doc(doc_path, filename, meta, row, gf_id)

        summary.append((filename, version, gf_id or 'GitHub-only'))

    if registry_failures:
        raise SystemExit('Hub registry scripts without verified GreasyFork IDs: ' + ', '.join(registry_failures))

    data['lastVerified'] = TODAY
    data['repository'] = REPO_PAGE
    reg_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'Synchronized {len(summary)} SakaLuX userscripts; {len(rows)} Hub registry entries checked.')
    for fn, ver, gid in summary:
        print(f' - {fn}: v{ver} / {gid}')

if __name__ == '__main__':
    main()
