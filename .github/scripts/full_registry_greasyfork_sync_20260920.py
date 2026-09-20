from pathlib import Path
import json, re
from urllib.parse import quote, unquote, urlparse
from datetime import date

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

# Known page supplied by owner in this cleanup/sync pass.
FORCED_GF_IDS = {'SakaLuX-Bazaar-Smart-Pricer.user.js': '596672'}


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
    candidates = [str(row.get('greasyForkId') or ''), str(row.get('downloadUrl') or ''), str(row.get('metaUrl') or ''), one(meta, 'downloadURL'), one(meta, 'updateURL')]
    for value in candidates:
        m = re.search(r'(?:greasyfork\.org/(?:[^/]+/)?scripts/|update\.greasyfork\.org/scripts/)(\d+)', value)
        if m:
            return m.group(1)
    return ''


def render_info(info):
    s = str(info or '').replace('\\n', '\n').strip()
    if not s:
        return 'No additional module notes are registered.'
    chunks = [c.strip() for c in re.split(r'\n\s*\n', s) if c.strip()]
    out = []
    for chunk in chunks:
        lines = [x.strip() for x in chunk.splitlines() if x.strip()]
        if len(lines) > 1 and len(lines[0]) < 80 and not lines[0].endswith('.'):
            out.append(f'### {lines[0]}\n\n' + ' '.join(lines[1:]))
        else:
            out.append(' '.join(lines))
    return '\n\n'.join(out)


def render_doc(filename, meta, row, gf_id):
    name = one(meta, 'name', row.get('name', filename))
    version = one(meta, 'version', row.get('version', ''))
    desc = one(meta, 'description', row.get('description', ''))
    license_name = one(meta, 'license', 'MIT')
    source = REPO_RAW + filename
    doc_path = DOC_MAP[filename]
    doc_raw = REPO_RAW + doc_path
    gf_page = f'https://greasyfork.org/scripts/{gf_id}'
    update = row['downloadUrl']
    grants = meta.get('grant', []) or ['none']
    connects = meta.get('connect', [])
    matches = meta.get('match', [])
    release = row.get('release') or {}
    notes = release.get('notes') or ['Repository metadata synchronized with the canonical userscript.']
    parts = [
        f'# {name}',
        '',
        f'> {desc}',
        '',
        '## Current version',
        '',
        f'**v{version}** — verified against the canonical userscript on {TODAY}.',
        '',
        '## What it does',
        '',
        render_info(row.get('info')),
        '',
        '## Installation and automatic updates',
        '',
        f'- GreasyFork page: {gf_page}',
        f'- GreasyFork update source: {update}',
        f'- Canonical GitHub source: {source}',
        f'- GreasyFork description source: {doc_raw}',
        '',
        '## Userscript metadata',
        '',
        f'- License: **{license_name}**',
        f'- Version: **{version}**',
        f'- Author: {one(meta, "author", "SakaLuX")}',
        f'- Run at: {one(meta, "run-at", "userscript default")}',
        f'- Grants: {", ".join(grants)}',
    ]
    if connects:
        parts.append(f'- Connects: {", ".join(connects)}')
    if matches:
        parts += ['', '### Supported pages', ''] + [f'- `{x}`' for x in matches]
    parts += ['', '## Latest release', '', f'**v{version}**'] + [f'- {n}' for n in notes]
    parts += ['', '## License', '', f'{license_name}. See the repository LICENSE file for the project license text.', '']
    return '\n'.join(parts)


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
    missing_registry = [p.name for p in managed if p.name not in by_file]
    if missing_registry:
        raise SystemExit('Managed userscripts missing from scripts.json: ' + ', '.join(missing_registry))

    missing_ids = []
    summary = []
    for path in managed:
        filename = path.name
        row = by_file[filename]
        text = path.read_text(encoding='utf-8')
        _, meta = parse_meta(text)
        version = one(meta, 'version')
        name = one(meta, 'name')
        if not version or not name:
            raise SystemExit(f'Missing @name/@version in {filename}')

        gf_id = infer_gf_id(row, meta, filename)
        if not gf_id:
            missing_ids.append(filename)
            continue

        encoded_name = quote(name, safe='')
        gf_update = f'https://update.greasyfork.org/scripts/{gf_id}/{encoded_name}.user.js'
        gf_meta = f'https://update.greasyfork.org/scripts/{gf_id}/{encoded_name}.meta.js'

        # Every SakaLuX userscript is explicitly licensed and points updates to GreasyFork.
        if not one(meta, 'license'):
            text = replace_meta(text, 'license', 'MIT')
        text = replace_meta(text, 'downloadURL', gf_update)
        text = replace_meta(text, 'updateURL', gf_update)
        if not one(meta, 'homepage'):
            text = replace_meta(text, 'homepage', REPO_PAGE)
        if not one(meta, 'supportURL'):
            text = replace_meta(text, 'supportURL', REPO_PAGE + '/issues')
        path.write_text(text, encoding='utf-8')

        # Reparse after metadata updates.
        _, meta = parse_meta(text)
        row['version'] = version
        row['sourceUrl'] = REPO_RAW + filename
        row['downloadUrl'] = gf_update
        row['updateUrl'] = gf_update
        row['metaUrl'] = gf_meta
        row['greasyForkId'] = str(gf_id)
        row['greasyForkUrl'] = f'https://greasyfork.org/scripts/{gf_id}'
        row['documentationUrl'] = REPO_RAW + DOC_MAP[filename]
        row['license'] = one(meta, 'license', 'MIT')
        release = row.setdefault('release', {})
        if release.get('version') != version:
            release['version'] = version
            release['date'] = TODAY
            release['notes'] = ['Repository registry, GreasyFork documentation, license metadata and update endpoints synchronized with the canonical userscript.']
        elif not release.get('notes'):
            release['notes'] = ['Repository metadata synchronized with the canonical userscript.']
        release.setdefault('date', TODAY)

        doc_path = ROOT / DOC_MAP[filename]
        if not doc_path.exists():
            raise SystemExit(f'Missing GreasyFork MD for {filename}: {DOC_MAP[filename]}')
        doc_path.write_text(render_doc(filename, meta, row, gf_id), encoding='utf-8')
        summary.append((filename, version, gf_id))

    if missing_ids:
        raise SystemExit('Missing GreasyFork IDs for: ' + ', '.join(missing_ids))

    data['lastVerified'] = TODAY
    data['repository'] = REPO_PAGE
    reg_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'Synchronized {len(summary)} managed userscripts.')
    for fn, ver, gid in summary:
        print(f' - {fn}: v{ver} / GreasyFork {gid}')

if __name__ == '__main__':
    main()
