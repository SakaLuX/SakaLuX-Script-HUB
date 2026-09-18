"""Read-only validation of active workflows, userscripts and Hub registry."""
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
rows = json.loads((root / 'scripts.json').read_text())['scripts']
assert rows and len({row['id'] for row in rows}) == len(rows), 'Duplicate registry IDs'
for row in rows:
    filename = unquote(urlparse(row['sourceUrl']).path.rsplit('/', 1)[-1])
    source = (root / filename).read_text()
    version = re.search(r'^//\s*@version\s+(\S+)', source, re.M)
    assert version and version.group(1) == row['version'], row['id']
    assert row['release']['version'] == row['version'], row['id']
    assert len(row['info']) > 1000 and row['release']['notes'], row['id']
print(f'Validated {len(workflows)} active workflows, {len(scripts)} userscripts and {len(rows)} registry modules.')
