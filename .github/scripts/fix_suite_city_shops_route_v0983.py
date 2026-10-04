from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
doc=Path('greasyfork/SakaLuX-Suite.md')
s=p.read_text(encoding='utf-8')

# Keep the installed clickable-checklist implementation; change only the City Shops destination.
api_match=re.search(r"const API_VERSION = '(2\.1\.[45])';", s)
if not api_match:
    raise SystemExit('expected checklist API 2.1.4 or 2.1.5')
api_version=api_match.group(1)

bad_routes=[
    "shops:'https://www.torn.com/shops.php'",
    "shops:'https://www.torn.com/city.php?step=shops'",
    "shops:'/shops.php'",
    "shops:'/city.php?step=shops'"
]
if not any(x in s for x in bad_routes):
    raise SystemExit('bad City Shops route not found')

s=re.sub(r'// @version      0\.9\.98[12]', '// @version      0.9.983', s, count=1)
s=re.sub(r"const VERSION = '0\.9\.98[12]';", "const VERSION = '0.9.983';", s, count=1)
s=s.replace("return {suite:'0.9.981',checklist:API_VERSION", "return {suite:'0.9.983',checklist:API_VERSION",1)
s=s.replace("return {suite:'0.9.982',checklist:API_VERSION", "return {suite:'0.9.983',checklist:API_VERSION",1)
for old in bad_routes:
    if old in s:
        s=s.replace(old, "shops:'https://www.torn.com/city.php'", 1)
        break

# Preserve every other route and all sync/debug logic.
for needle in [
    '// @version      0.9.983',
    "const VERSION = '0.9.983';",
    f"const API_VERSION = '{api_version}';",
    "shops:'https://www.torn.com/city.php'",
    'function wheelDiagnostics',
    'function copyWheelDiagnostics',
    'spinTheWheel'
]:
    if needle not in s:
        raise SystemExit('missing '+needle)
for old in bad_routes:
    if old in s:
        raise SystemExit('broken shops route still present: '+old)

p.write_text(s,encoding='utf-8')

if doc.exists():
    m=doc.read_text(encoding='utf-8')
    m=re.sub(r'\*\*v0\.9\.98[12]\*\*','**v0.9.983**',m,count=1)
    m=re.sub(r'- Canonical version: \*\*v0\.9\.98[12]\*\*','- Canonical version: **v0.9.983**',m,count=1)
    start=m.find('## Current release note')
    hist=m.find('## Release history / Changelog')
    if start>=0 and hist>start:
        section="""## Current release note

**v0.9.983 — City Shops navigation hotfix**
- Fixes the Smart Daily Checklist `City shops` card opening obsolete shop routes that trigger Torn's `actionShops` error.
- `City shops` now opens `/city.php`, where Torn exposes the East Side city shops.
- No changes to checklist detection, sync, Wheels, COPY DEBUG, or other task routes.

"""
        m=m[:start]+section+m[hist:]
        pos=m.find('## Release history / Changelog')+len('## Release history / Changelog')
        m=m[:pos]+"\n\n### v0.9.983 — City Shops route hotfix\n- Replaces broken `/shops.php` and `/city.php?step=shops` routes with `/city.php`.\n"+m[pos:]
    doc.write_text(m,encoding='utf-8')
