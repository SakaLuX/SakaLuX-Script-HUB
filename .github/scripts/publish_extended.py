"""Publish only reviewed complete sources and measured offline reports."""
from pathlib import Path
import hashlib,json,shutil,subprocess,zipfile

manifest=json.loads(Path('releases/extended-performance-2026-09-18-manifest.json').read_text())
for entry in manifest:
    import re
    actual=re.search(r'@version\s+(\S+)',Path(entry['file']).read_text()).group(1)
    assert actual==entry['version'],(entry['file'],actual,entry['version'])
route_report=json.loads(Path('reports/extended-performance-2026-09-18/stocks-route-verification.json').read_text())
assert route_report['assertions'] and all(x['passed'] for x in route_report['assertions'])
assert len(route_report['results'][0]['cycles'])==100 and all(x['mounted'] and not x['deadline'] for x in route_report['results'][0]['cycles'])
original=json.loads(Path('reports/extended-performance-2026-09-18/results.json').read_text())
assert [x['label'] for x in original['assertions'] if not x['passed']] in ([],['Stocks remounts once on each of 100 return routes'])
for name in ['interactive','network-browser','suite-stability','browser-current','browser-focused']:
    data=json.loads(Path('reports/extended-performance-2026-09-18/'+name+'.json').read_text())
    assert data['assertions'] and all(x['passed'] for x in data['assertions']),name
soak=json.loads(Path('reports/extended-performance-2026-09-18/results.json').read_text())['soak']
assert len(soak)==62 and all(max(x['elapsedSeconds'] for x in soak if x['file']==f)>=1800 for f in {x['file'] for x in soak})
out=Path('dist/extended-performance-2026-09-18');out.mkdir(parents=True,exist_ok=True)
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
for entry in manifest:
    source=Path(entry['file']);asset=out/(source.name.removesuffix('.user.js')+'-v'+entry['version']+'.user.js');shutil.copy2(source,asset)
    args=['gh','release','create',entry['tag'],str(asset),entry['notes'],'--target',sha,'--title',source.name.removesuffix('.user.js')+' v'+entry['version'],'--notes-file',entry['notes'],'--latest=false']
    if entry['id']=='suite':args.append('--prerelease')
    if subprocess.run(['gh','release','view',entry['tag']],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:subprocess.run(args,check=True)
    else:subprocess.run(['gh','release','upload',entry['tag'],str(asset),entry['notes'],'--clobber'],check=True)
with zipfile.ZipFile(out/'SakaLuX-Extended-Performance-2026-09-18.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for pattern in ['*.user.js','scripts.json','greasyfork/*.md','releases/*v1.2.20.md','releases/*v0.8.7.md','releases/*v1.3.44.md','releases/*v1.17.40.md','releases/*v1.3.16.md','releases/*v1.9.73.md','releases/*v0.9.929.md','reports/extended-performance-2026-09-18/*','tests/performance/*.cjs']:
        for path in Path('.').glob(pattern):archive.write(path,path.as_posix())
with zipfile.ZipFile(out/'SakaLuX-Previous-Versions-Extended-2026-09-18.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for path in Path('backups/extended-performance-2026-09-18').rglob('*'):
        if path.is_file():archive.write(path,path.relative_to('backups/extended-performance-2026-09-18').as_posix())
for path in Path('reports/extended-performance-2026-09-18').glob('*.json'):shutil.copy2(path,out/path.name)
shutil.copy2('reports/extended-performance-2026-09-18/README.md',out/'TEST-REPORT.md');shutil.copy2('releases/extended-performance-2026-09-18.md',out/'CHANGELOG.md')
assets=sorted(out.glob('*'));(out/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in assets));assets=sorted(out.glob('*'))
tag='extended-performance-2026-09-18'
if subprocess.run(['gh','release','view',tag],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:subprocess.run(['gh','release','create',tag,*map(str,assets),'--target',sha,'--title','SakaLuX — Extended performance verification','--notes-file','releases/extended-performance-2026-09-18.md','--latest=false'],check=True)
else:subprocess.run(['gh','release','upload',tag,*map(str,assets),'--clobber'],check=True)
