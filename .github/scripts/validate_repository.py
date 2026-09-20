"""Read-only validation of active workflows, userscripts, Hub registry and publication metadata."""
from pathlib import Path
import json
import re
import subprocess
from urllib.parse import unquote, urlparse
import yaml

root = Path(__file__).resolve().parents[2]
workflows = sorted((root / '.github/workflows').glob('*.y*ml'))
assert workflows, 'No active workflows'
for path in workflows:
    data = yaml.load(path.read_text(), Loader=yaml.BaseLoader)
    assert isinstance(data, dict) and data.get('on') and data.get('jobs'), path
    for job in data['jobs'].values():
        assert job.get('runs-on') and job.get('steps'), path
        for step in job['steps']:
            assert 'uses' in step or 'run' in step, path

scripts = sorted(root.glob('*.user.js'))
for path in scripts:
    subprocess.run(['node', '--check', str(path)], check=True)

# Every SakaLuX-owned userscript must declare its license explicitly.
sakalux_scripts = sorted(root.glob('SakaLuX-*.user.js'))
for path in sakalux_scripts:
    source = path.read_text(encoding='utf-8', errors='replace')
    assert re.search(r'^//\s*@license\s+\S.+$', source, re.M), f'Missing @license: {path.name}'
    assert re.search(r'^//\s*@version\s+\S+', source, re.M), f'Missing @version: {path.name}'

rows = json.loads((root / 'scripts.json').read_text(encoding='utf-8'))['scripts']
assert rows and len({row['id'] for row in rows}) == len(rows), 'Duplicate registry IDs'

for row in rows:
    filename = unquote(urlparse(row['sourceUrl']).path.rsplit('/', 1)[-1])
    path = root / filename
    assert path.exists(), f"Missing registry source: {filename}"
    source = path.read_text(encoding='utf-8', errors='replace')
    version = re.search(r'^//\s*@version\s+(\S+)', source, re.M)
    license_meta = re.search(r'^//\s*@license\s+(.+)$', source, re.M)
    download_meta = re.search(r'^//\s*@downloadURL\s+(\S+)', source, re.M)
    update_meta = re.search(r'^//\s*@updateURL\s+(\S+)', source, re.M)

    assert version and version.group(1) == row['version'], row['id']
    assert row['release']['version'] == row['version'], row['id']
    assert len(row['info']) > 1000 and row['release']['notes'], row['id']
    assert license_meta and row.get('license') == license_meta.group(1).strip(), f"License drift: {row['id']}"

    gf_id = str(row.get('greasyForkId') or '')
    assert gf_id.isdigit(), f"Missing GreasyFork ID: {row['id']}"
    expected_prefix = f'https://update.greasyfork.org/scripts/{gf_id}/'
    assert row.get('downloadUrl', '').startswith(expected_prefix) and row['downloadUrl'].endswith('.user.js'), f"Bad downloadUrl: {row['id']}"
    assert row.get('updateUrl', '').startswith(expected_prefix) and row['updateUrl'].endswith('.meta.js'), f"Bad updateUrl: {row['id']}"
    assert row.get('metaUrl') == row.get('updateUrl'), f"metaUrl/updateUrl drift: {row['id']}"
    assert row.get('greasyForkUrl') == f'https://greasyfork.org/scripts/{gf_id}', f"Bad GreasyFork page: {row['id']}"
    assert download_meta and download_meta.group(1) == row['downloadUrl'], f"@downloadURL drift: {row['id']}"
    assert update_meta and update_meta.group(1) == row['updateUrl'], f"@updateURL drift: {row['id']}"

    doc_url = row.get('documentationUrl', '')
    doc_name = unquote(urlparse(doc_url).path).split('/main/', 1)[-1] if '/main/' in urlparse(doc_url).path else ''
    assert doc_name and (root / doc_name).exists(), f"Missing documentation: {row['id']}"
    doc = (root / doc_name).read_text(encoding='utf-8', errors='replace')
    assert re.search(rf'\*\*v{re.escape(row["version"])}\*\*', doc), f"MD version drift: {row['id']}"

# The Hub itself is not a complementary-addon registry row, but it is published on GreasyFork.
hub = root / 'SakaLuX-Script-Hub.user.js'
if hub.exists():
    src = hub.read_text(encoding='utf-8', errors='replace')
    assert re.search(r'^//\s*@downloadURL\s+https://update\.greasyfork\.org/scripts/592699/.+\.user\.js$', src, re.M), 'Hub @downloadURL drift'
    assert re.search(r'^//\s*@updateURL\s+https://update\.greasyfork\.org/scripts/592699/.+\.meta\.js$', src, re.M), 'Hub @updateURL drift'
    hv = re.search(r'^//\s*@version\s+(\S+)', src, re.M).group(1)
    hdoc = (root / 'greasyfork/Script-Hub.md').read_text(encoding='utf-8', errors='replace')
    assert f'**v{hv}**' in hdoc, 'Hub MD version drift'

print(f'Validated {len(workflows)} active workflows, {len(scripts)} userscripts and {len(rows)} registry modules, including licenses and GreasyFork metadata.')
