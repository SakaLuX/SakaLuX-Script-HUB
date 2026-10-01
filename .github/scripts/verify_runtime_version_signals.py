#!/usr/bin/env python3
from pathlib import Path
import re,sys

ROOT=Path(__file__).resolve().parents[2]
errors=[]
checked=[]

for path in sorted(ROOT.glob('SakaLuX*.user.js')):
    text=path.read_text(encoding='utf-8')
    hm=re.search(r'(?m)^//\s*@version\s+(\S+)',text)
    if not hm: continue
    version=hm.group(1).strip(); checked.append(f'{path.name} v{version}')

    begin='/* SakaLuX Canonical Installed Version — BEGIN */'
    end='/* SakaLuX Canonical Installed Version — END */'
    a=text.find(begin); b=text.find(end,a)
    if a>=0 and b>a:
        block=text[a:b]
        m=re.search(r"let v = '([^']+)';",block)
        if not m: errors.append(f'{path.name}: canonical installed-version marker has no fallback version')
        elif m.group(1)!=version: errors.append(f'{path.name}: canonical marker {m.group(1)} != @version {version}')

    m=re.search(r"const APP=\{[^\n]*?version:'([^']+)'",text)
    if m and m.group(1)!=version:
        errors.append(f'{path.name}: APP.version {m.group(1)} != @version {version}')

    m=re.search(r"(?m)^\s*const VERSION\s*=\s*['\"]([^'\"]+)['\"]",text)
    if m and m.group(1)!=version:
        errors.append(f'{path.name}: VERSION constant {m.group(1)} != @version {version}')

company=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
if company.exists():
    text=company.read_text(encoding='utf-8')
    key_token="companyCatalog:APP.key+':company_catalog'"
    count=text.count(key_token)
    if count!=1: errors.append(f'Company Intelligence: companyCatalog KEY appears {count} times; expected 1')
    call="ensureOfficialCompanyCatalog().then(()=>{cleanupPositionCacheAgainstOfficial();if(S.open)render()}).catch(()=>{});"
    # More than two normally means a duplicate patch chain survived cleanup.
    calls=text.count(call)
    if calls>2: errors.append(f'Company Intelligence: catalogue refresh call appears {calls} times; expected at most 2')

print('Runtime version-signal audit')
for item in checked: print('  OK  ',item)
if errors:
    print('\nRuntime version-signal errors:',file=sys.stderr)
    for e in errors: print('  FAIL',e,file=sys.stderr)
    sys.exit(1)
print(f'PASS: {len(checked)} userscripts have synchronized runtime version signals.')
