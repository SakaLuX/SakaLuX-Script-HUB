from pathlib import Path
import re, json
from urllib.parse import urlparse, parse_qs

root=Path('.')
files=[p for p in root.glob('*.user.js') if p.is_file()]
# Suite is an orchestration/UI layer; it does not own a Torn-data API contract.
manager_only={'SakaLuX-Suite.user.js'}
rows=[]
for p in sorted(files):
    s=p.read_text(encoding='utf-8',errors='ignore')
    uses_api=(p.name not in manager_only) and ('api.torn.com' in s or '###PDA-APIKEY###' in s)
    urls=re.findall(r"https://www\.torn\.com/preferences\.php#tab=api\?step=addNewKey[^'\"`\s]+",s)
    perms=[]
    for u in urls:
        q=parse_qs(urlparse(u.replace('#tab=api?','?')).query)
        perms.append({k:v[0] for k,v in q.items() if k not in {'step','title'}})
    rows.append({
        'file':p.name,
        'uses_api':uses_api,
        'create_urls':urls,
        'permissions':perms,
        'hub_storage':'SakaLuX_HUB_TORN_API_KEY' in s,
        'hub_global':bool(re.search(r'SakaLuXScriptHub\?\.getApiKey|SakaLuXScriptHub\.getApiKey',s)),
        'has_create_button':bool(re.search(r'CREATE[^\n]{0,80}API|createRequired(?:Api|Torn)Key|API_CREATE_URL|REQUIRED_API_KEY_URL|AUDITOR_API_CREATE_URL',s,re.I)),
        'delegates_create_to_hub':bool(re.search(r'createRequiredApiKey[\s\S]{0,350}SakaLuXScriptHub\?\.createRequiredTornKey',s)),
    })

hub=next(r for r in rows if r['file']=='SakaLuX-Script-Hub.user.js')
aud=next(r for r in rows if r['file']=='SakaLuX-Account-Auditor.user.js')
shared=hub['permissions'][0] if hub['permissions'] else {}
union={}
for r in rows:
    if r['file'] in {'SakaLuX-Script-Hub.user.js','SakaLuX-Account-Auditor.user.js'} or r['file'] in manager_only: continue
    for d in r['permissions']:
        for scope,val in d.items():
            union.setdefault(scope,set()).update(x for x in val.split(',') if x)
shared_sets={k:set(v.split(',')) for k,v in shared.items()}
missing={k:sorted(v-shared_sets.get(k,set())) for k,v in union.items() if v-shared_sets.get(k,set())}
extra={k:sorted(v-union.get(k,set())) for k,v in shared_sets.items() if v-union.get(k,set())}

lines=['# API Key Architecture Audit — 2026-09-19','',
       'Policy: each Torn-API data module keeps its own create-key flow; Script Hub owns one shared superset key for shared modules; Account Auditor is isolated and must not use or contribute to the Hub shared key. Suite is a manager/orchestration layer and does not own a Torn-data key contract.','',
       '## Active top-level userscripts','',
       '| Script | Torn-data API | Own create URL | Create control | Reads Hub key | Create delegates to Hub |','|---|---:|---:|---:|---:|---:|']
for r in rows:
    lines.append(f"| {r['file']} | {'yes' if r['uses_api'] else 'no'} | {'yes' if r['create_urls'] else 'no'} | {'yes' if r['has_create_button'] else 'no'} | {'yes' if r['hub_storage'] or r['hub_global'] else 'no'} | {'YES' if r['delegates_create_to_hub'] else 'no'} |")
lines += ['', '## Discovered create-key permissions','']
for r in rows:
    if r['permissions']:
        lines.append(f"- **{r['file']}**: `{json.dumps(r['permissions'],ensure_ascii=False)}`")
lines += ['', '## Hub shared-key coverage','',f"- Union excluding Account Auditor: `{json.dumps({k:sorted(v) for k,v in union.items()},ensure_ascii=False)}`",f"- Hub shared URL: `{json.dumps({k:sorted(v) for k,v in shared_sets.items()},ensure_ascii=False)}`",f"- Missing from Hub shared key: `{json.dumps(missing,ensure_ascii=False)}`",f"- Extra in Hub shared key versus discovered module create URLs: `{json.dumps(extra,ensure_ascii=False)}`",'', '## Account Auditor isolation','',f"- Reads Hub key markers: **{'YES (problem)' if aud['hub_storage'] or aud['hub_global'] else 'no'}**",f"- Own create URL discovered: **{'yes' if aud['create_urls'] else 'no'}**",f"- Own create/API control detected: **{'yes' if aud['has_create_button'] else 'no'}**",'', '## Findings','']
problems=[]
if missing: problems.append('Hub shared create URL is missing permissions used by one or more shared modules.')
if aud['hub_storage'] or aud['hub_global']: problems.append('Account Auditor is coupled to Hub API state; it must be isolated.')
if aud['uses_api'] and (not aud['has_create_button'] or not aud['create_urls']): problems.append('Account Auditor uses Torn API data but lacks its own create-key flow.')
for r in rows:
    if r['file'] in manager_only: continue
    if r['delegates_create_to_hub'] and r['file']!='SakaLuX-Script-Hub.user.js': problems.append(f"{r['file']} delegates its module create-key button to Hub instead of creating its own module-specific key.")
    if r['uses_api'] and r['file'] not in {'SakaLuX-Script-Hub.user.js','SakaLuX-Account-Auditor.user.js'} and (not r['create_urls'] or not r['has_create_button']):
        problems.append(f"{r['file']} uses Torn API data but lacks a complete module-specific create-key flow.")
if problems: lines.extend(f'- ❌ {x}' for x in problems)
else: lines.append('- ✅ Architecture matches the requested policy.')
Path('API-KEY-ARCHITECTURE-AUDIT-2026-09-19.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines[-max(20,len(problems)+4):]))
