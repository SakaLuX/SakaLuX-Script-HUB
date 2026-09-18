"""Publish reviewed performance assets; no requests to Torn or user accounts."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import zipfile

manifest=json.loads(Path('releases/performance-2026-09-18-manifest.json').read_text())
dist=Path('dist/performance-2026-09-18');dist.mkdir(parents=True,exist_ok=True)
for entry in manifest:
    source=Path(entry['file'])
    asset=dist/(source.name.removesuffix('.user.js')+'-v'+entry['version']+'.user.js')
    shutil.copy2(source,asset)
    entry['asset']=str(asset)
    if subprocess.run(['gh','release','view',entry['tag']],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
        command=['gh','release','create',entry['tag'],str(asset),entry['notes'],'--target',subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'--title',source.name.removesuffix('.user.js')+' v'+entry['version']+' — Performance','--notes-file',entry['notes'],'--latest=false']
        if entry['id']=='suite':command.append('--prerelease')
        subprocess.run(command,check=True)
    else:
        subprocess.run(['gh','release','upload',entry['tag'],str(asset),entry['notes'],'--clobber'],check=True)
with zipfile.ZipFile(dist/'SakaLuX-Performance-2026-09-18.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for pattern in ['*.user.js','scripts.json','greasyfork/*.md','releases/performance-*.md','reports/performance-2026-09-18/*','tests/performance/*.cjs']:
        for path in Path('.').glob(pattern):archive.write(path,path.as_posix())
with zipfile.ZipFile(dist/'SakaLuX-Previous-Versions-2026-09-18.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for path in Path('backups/performance-audit-2026-09-18').rglob('*'):
        if path.is_file():archive.write(path,path.relative_to('backups/performance-audit-2026-09-18').as_posix())
shutil.copy2('releases/performance-2026-09-18.md',dist/'CHANGELOG.md')
shutil.copy2('reports/performance-2026-09-18/browser.json',dist/'BROWSER-PERFORMANCE.json')
assets=sorted(dist.glob('*'))
(dist/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in assets))
assets=sorted(dist.glob('*'))
tag='performance-2026-09-18'
if subprocess.run(['gh','release','view',tag],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
    subprocess.run(['gh','release','create',tag,*map(str,assets),'--target',subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'--title','SakaLuX — Performance update 2026-09-18','--notes-file','releases/performance-2026-09-18.md','--latest=false'],check=True)
else:subprocess.run(['gh','release','upload',tag,*map(str,assets),'--clobber'],check=True)
