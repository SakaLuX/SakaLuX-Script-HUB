from pathlib import Path
import json,re

p=Path('SakaLuX-Bazaar-Thanker-PDA.user.js')
s=p.read_text(encoding='utf-8')

for old,new in [
    ('// @version      5.3.24','// @version      5.3.25'),
    ("{version:'5.3.24'}","{version:'5.3.25'}"),
    ("const BAZAAR_VERSION='5.3.24';","const BAZAAR_VERSION='5.3.25';"),
]:
    if old not in s:
        raise SystemExit(f'Missing version marker: {old}')
    s=s.replace(old,new,1)

old="""        const sellerLink = makeLink(
            'https://www.torn.com/profiles.php?XID=' + encodeURIComponent(settings.sellerId),
            '🙏'
        );
"""
new="""        const sellerLink = makeLink(
            'https://www.torn.com/profiles.php?XID=2380374',
            '🙏'
        );
"""
if old not in s:
    raise SystemExit('sellerLink block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

sp=Path('scripts.json')
data=json.loads(sp.read_text(encoding='utf-8'))
for item in data.get('scripts',[]):
    if item.get('id')=='bazaar':
        item['version']='5.3.25'
        break
else:
    raise SystemExit('bazaar registry entry not found')
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

md=Path('greasyfork/Bazaar-Thanker.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v5.3.25**',m,count=1)
marker='## Current release note\n'; st=m.find(marker)
if st>=0:
    st+=len(marker); en=m.find('\n## ',st); en=len(m) if en<0 else en
    m=m[:st]+"\n**v5.3.25** keeps only the clickable 🙏 in thank-you messages and hard-links it to SakaLuX profile ID 2380374, independent of any configurable seller ID.\n"+m[en:]
h='## Release history\n'
entry='### v5.3.25 — Fixed profile link\n\n- The visible seller attribution remains only `🙏`.\n- `🙏` always links to `https://www.torn.com/profiles.php?XID=2380374`.\n- The message link no longer depends on the configurable seller ID.\n\n'
if h in m and '### v5.3.25 — Fixed profile link' not in m:
    m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
