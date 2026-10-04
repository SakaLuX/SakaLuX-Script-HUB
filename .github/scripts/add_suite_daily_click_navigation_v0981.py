from pathlib import Path

p=Path('SakaLuX-Suite.user.js')
doc=Path('greasyfork/SakaLuX-Suite.md')
s=p.read_text(encoding='utf-8')

# Keep the proven Daily Checklist/COPY DEBUG logic on API 2.1.4; only add navigation.
s=s.replace('// @version      0.9.980','// @version      0.9.981',1)
s=s.replace("const VERSION = '0.9.980';","const VERSION = '0.9.981';",1)
s=s.replace("return {suite:'0.9.980',checklist:API_VERSION", "return {suite:'0.9.981',checklist:API_VERSION",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.4 — rollback v0.9.980 */','/* SakaLuX Smart Daily Checklist v2.1.4 — stable + clickable rows v0.9.981 */',1)

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

# Separate row-tap listener; controls keep their existing behavior.
mount='    document.body.appendChild(p); return p;'
listener="    p.addEventListener('click',e=>{if(e.target.closest('button,input,textarea,select,a'))return;const row=e.target.closest('.sdp-task[data-nav-id]');if(row)navigateToTask(row.dataset.navId);});\n"
if mount not in s: raise SystemExit('panel mount anchor missing')
s=s.replace(mount,listener+mount,1)

# Patch only the opening tag of every rendered standard task card.
old='<div class="sdp-task ${x.status}">'
new='<div class="sdp-task ${x.status}"${TASK_LINKS[x.id]&&!x.id.startsWith(\'custom-\')?` data-nav-id="${x.id}" style="cursor:pointer"`:\'\'}>'
if old not in s: raise SystemExit('task card opening tag missing')
s=s.replace(old,new,1)

oldapi='wheelDiagnostics,copyWheelDiagnostics,applyApiSnapshot:interpretV3'
newapi='wheelDiagnostics,copyWheelDiagnostics,navigateToTask,taskLinks:TASK_LINKS,applyApiSnapshot:interpretV3'
if oldapi not in s: raise SystemExit('public API anchor missing')
s=s.replace(oldapi,newapi,1)

for needle in [
    '// @version      0.9.981',
    "const VERSION = '0.9.981';",
    "const API_VERSION = '2.1.4';",
    'const TASK_LINKS = Object.freeze({',
    'function navigateToTask(id){',
    'data-nav-id=',
    'navigateToTask,taskLinks:TASK_LINKS',
    "wheel_lame:'https://www.torn.com/page.php?sid=spinTheWheel'",
    "crimes:'https://www.torn.com/page.php?sid=crimes'"
]:
    if needle not in s: raise SystemExit('missing '+needle)
p.write_text(s,encoding='utf-8')

# Documentation/release note.
m=doc.read_text(encoding='utf-8')
m=m.replace('**v0.9.980**','**v0.9.981**',1)
m=m.replace('- Canonical version: **v0.9.980**','- Canonical version: **v0.9.981**',1)
start=m.find('## Current release note')
hist=m.find('## Release history / Changelog')
if start>=0 and hist>start:
    section="""## Current release note

**v0.9.981 — Clickable Daily Checklist**
- Every standard Smart Daily Checklist card can be tapped to open its relevant Torn page.
- The DONE / ACTION / SYNC buttons keep their existing behavior and do not trigger navigation.
- All three Leslie Wheel cards open Spin The Wheel.
- Custom tasks remain non-navigable.
- Preserves the known-good Daily Checklist/COPY DEBUG implementation and API logic from the v0.9.980 rollback (checklist API 2.1.4).

"""
    m=m[:start]+section+m[hist:]
    pos=m.find('## Release history / Changelog')+len('## Release history / Changelog')
    m=m[:pos]+"\n\n### v0.9.981 — Clickable Daily Checklist\n- Adds direct card navigation without changing detection, sync, DONE/ACTION/SYNC, or COPY DEBUG logic.\n"+m[pos:]
doc.write_text(m,encoding='utf-8')
