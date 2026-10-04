from pathlib import Path

p=Path('SakaLuX-Suite.user.js')
doc=Path('greasyfork/SakaLuX-Suite.md')
s=p.read_text(encoding='utf-8')

# Start only from the proven rollback baseline.
if '// @version      0.9.980' not in s:
    raise SystemExit('expected stable v0.9.980 baseline')
if "const API_VERSION = '2.1.4';" not in s:
    raise SystemExit('expected stable checklist API 2.1.4')

s=s.replace('// @version      0.9.980','// @version      0.9.982',1)
s=s.replace("const VERSION = '0.9.980';","const VERSION = '0.9.982';",1)
s=s.replace("return {suite:'0.9.980',checklist:API_VERSION", "return {suite:'0.9.982',checklist:API_VERSION",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.4 — rollback v0.9.980 */','/* SakaLuX Smart Daily Checklist v2.1.4 — stable + clickable rows v0.9.982 */',1)

anchor="  const ALIASES = Object.freeze({ faction:'faction_oc' });"
nav=r'''  const TASK_LINKS = Object.freeze({
    energy_refill:'https://www.torn.com/points.php',
    nerve_refill:'https://www.torn.com/points.php',
    token_refill:'https://www.torn.com/points.php',
    drug:'https://www.torn.com/item.php',
    booster:'https://www.torn.com/item.php',
    medical:'https://www.torn.com/item.php',
    missions:'https://www.torn.com/loader.php?sid=missions',
    shops:'https://www.torn.com/shops.php',
    virus:'https://www.torn.com/item.php',
    education:'https://www.torn.com/education.php',
    casino:'https://www.torn.com/casino.php',
    wheel_lame:'https://www.torn.com/page.php?sid=spinTheWheel',
    wheel_mediocrity:'https://www.torn.com/page.php?sid=spinTheWheel',
    wheel_awesome:'https://www.torn.com/page.php?sid=spinTheWheel',
    city:'https://www.torn.com/city.php',
    gym:'https://www.torn.com/gym.php',
    crimes:'https://www.torn.com/page.php?sid=crimes',
    travel:'https://www.torn.com/travelagency.php',
    racing:'https://www.torn.com/loader.php?sid=racing',
    job:'https://www.torn.com/joblist.php',
    faction_oc:'https://www.torn.com/factions.php?step=your',
    prayer:'https://www.torn.com/church.php',
    blood_bags:'https://www.torn.com/item.php',
    item_market:'https://www.torn.com/page.php?sid=ItemMarket',
    bazaar:'https://www.torn.com/bazaar.php',
    stocks:'https://www.torn.com/page.php?sid=stocks',
    points:'https://www.torn.com/points.php'
  });
  function navigateToTask(id){
    const url=TASK_LINKS[String(id||'')];
    if(!url) return false;
    try{ location.href=url; return true; }catch{}
    try{ window.location.assign(url); return true; }catch{}
    return false;
  }

'''
if anchor not in s: raise SystemExit('ALIASES anchor missing')
s=s.replace(anchor,nav+anchor,1)

# Independent row tap listener: existing buttons remain untouched.
keydown=r'''    p.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.sdp-custom input'))p.querySelector('[data-sdp=\"add\"]')?.click();});'''
row_listener=r'''    p.addEventListener('click',e=>{if(e.target.closest('button,input,textarea,select,a'))return;const row=e.target.closest('.sdp-task[data-nav-id]');if(row)navigateToTask(row.dataset.navId);});
'''
if keydown not in s: raise SystemExit('stable keydown anchor missing')
s=s.replace(keydown,row_listener+keydown,1)

# Source uses escaped quotes inside the template literal.
old=r'''<div class=\"sdp-task ${x.status}\">'''
new=r'''<div class=\"sdp-task ${x.status}\"${TASK_LINKS[x.id]&&!x.id.startsWith('custom-')?` data-nav-id=\"${x.id}\" style=\"cursor:pointer\"`:''}>'''
if old not in s: raise SystemExit('escaped task card opening tag missing')
s=s.replace(old,new,1)

oldapi='wheelDiagnostics,copyWheelDiagnostics,applyApiSnapshot:interpretV3'
newapi='wheelDiagnostics,copyWheelDiagnostics,navigateToTask,taskLinks:TASK_LINKS,applyApiSnapshot:interpretV3'
if oldapi not in s: raise SystemExit('public API anchor missing')
s=s.replace(oldapi,newapi,1)

for needle in [
    '// @version      0.9.982',
    "const VERSION = '0.9.982';",
    "const API_VERSION = '2.1.4';",
    'const TASK_LINKS = Object.freeze({',
    'function navigateToTask(id){',
    'data-nav-id=',
    'navigateToTask,taskLinks:TASK_LINKS',
    "wheel_lame:'https://www.torn.com/page.php?sid=spinTheWheel'",
    "crimes:'https://www.torn.com/page.php?sid=crimes'",
    'function copyWheelDiagnostics()'
]:
    if needle not in s: raise SystemExit('missing '+needle)
p.write_text(s,encoding='utf-8')

m=doc.read_text(encoding='utf-8')
m=m.replace('**v0.9.980**','**v0.9.982**',1)
m=m.replace('- Canonical version: **v0.9.980**','- Canonical version: **v0.9.982**',1)
start=m.find('## Current release note')
hist=m.find('## Release history / Changelog')
if start<0 or hist<=start: raise SystemExit('doc markers missing')
section="""## Current release note

**v0.9.982 — Clickable Daily Checklist**
- Tap any standard Smart Daily Checklist card to open its relevant Torn page.
- DONE / ACTION / SYNC controls retain their existing behavior and do not trigger navigation.
- Wheel of Lame, Mediocrity and Awesome all open Spin The Wheel.
- Custom tasks remain non-navigable.
- Preserves the known-good v0.9.980 rollback Daily Checklist, COPY DEBUG and API 2.1.4 logic.

"""
m=m[:start]+section+m[hist:]
pos=m.find('## Release history / Changelog')+len('## Release history / Changelog')
m=m[:pos]+"\n\n### v0.9.982 — Clickable Daily Checklist\n- Adds direct card navigation without changing detection, synchronization or COPY DEBUG.\n"+m[pos:]
doc.write_text(m,encoding='utf-8')
