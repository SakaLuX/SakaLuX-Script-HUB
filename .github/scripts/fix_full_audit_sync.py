from pathlib import Path
import json,re

reg=json.loads(Path('scripts.json').read_text(encoding='utf-8'))['scripts']
p=Path('greasyfork/Script-Hub.md')
s=p.read_text(encoding='utf-8')
for item in reg:
    name=item['name']
    version=str(item['version'])
    if item['id']=='bazaar':
        pat=r'(-\s+💬\s+SakaLuX\s+Bazaar Thanker(?:\s+-\s+PDA)?\s+\*\*v)[^*]+(\*\*)'
    else:
        pat=rf'(-\s+.*?SakaLuX\s+{re.escape(name)}\s+\*\*v)[^*]+(\*\*)'
    s,n=re.subn(pat,rf'\g<1>{version}\g<2>',s,count=1,flags=re.I)
    if n!=1:
        raise SystemExit(f'Could not sync Script-Hub.md entry for {item["id"]}')
company=next(x for x in reg if x['id']=='company-intelligence')
s=re.sub(r'(Company Intelligence is currently registered at \*\*v)[^*]+(\*\*)',rf'\g<1>{company["version"]}\g<2>',s,count=1)
p.write_text(s,encoding='utf-8')
