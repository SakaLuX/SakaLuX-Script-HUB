from pathlib import Path
import json,re

p=Path('SakaLuX-Bazaar-Thanker-PDA.user.js')
s=p.read_text(encoding='utf-8')

# Version bump: header, standalone registration and runtime constant.
repls=[
    ('// @version      5.3.23','// @version      5.3.24'),
    ("{version:'5.3.23'}","{version:'5.3.24'}"),
    ("const BAZAAR_VERSION='5.3.23';","const BAZAAR_VERSION='5.3.24';"),
]
for old,new in repls:
    if old not in s:
        raise SystemExit(f'Missing version marker: {old}')
    s=s.replace(old,new,1)

# Keep the seller profile link, but show only the prayer emoji instead of the username.
old="""        const sellerLink = makeLink(
            'https://www.torn.com/profiles.php?XID=' + encodeURIComponent(settings.sellerId),
            'SakaLuX'
        );
"""
new="""        const sellerLink = makeLink(
            'https://www.torn.com/profiles.php?XID=' + encodeURIComponent(settings.sellerId),
            '🙏'
        );
"""
if old not in s:
    raise SystemExit('sellerLink block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# Registry version.
sp=Path('scripts.json')
data=json.loads(sp.read_text(encoding='utf-8'))
found=False
for item in data.get('scripts',[]):
    if item.get('id')=='bazaar':
        item['version']='5.3.24'
        found=True
        break
if not found:
    raise SystemExit('bazaar registry entry not found')
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# GreasyFork info/release.
md=Path('greasyfork/Bazaar-Thanker.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v5.3.24**',m,count=1)
marker='## Current release note\n'
st=m.find(marker)
if st>=0:
    st+=len(marker)
    en=m.find('\n## ',st)
    en=len(m) if en<0 else en
    note='\n**v5.3.24** removes the visible seller username from generated thank-you messages. The profile attribution is now a single clickable 🙏 emoji that still opens the configured SakaLuX profile.\n'
    m=m[:st]+note+m[en:]
h='## Release history\n'
entry='### v5.3.24 — Profile link cleanup\n\n- Removes the visible `SakaLuX` username from thank-you messages.\n- Keeps only a clickable `🙏` profile link.\n- Preserves the configured seller profile destination.\n\n'
if h in m and '### v5.3.24 — Profile link cleanup' not in m:
    m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
