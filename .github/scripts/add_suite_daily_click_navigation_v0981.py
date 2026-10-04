from pathlib import Path

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')

s=s.replace('// @version      0.9.980','// @version      0.9.981',1)
s=s.replace("const VERSION = '0.9.980';","const VERSION = '0.9.981';",1)
s=s.replace("return {suite:'0.9.980',checklist:API_VERSION", "return {suite:'0.9.981',checklist:API_VERSION",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.4 — rollback v0.9.980 */','/* SakaLuX Smart Daily Checklist v2.1.4 — stable + clickable rows v0.9.981 */',1)

anchor="  const ALIASES = Object.freeze({ faction:'faction_oc' });"
nav=r'''  const TASK_LINKS = Object.freeze({
    energy_refill:'https://www.torn.com/points.php', nerve_refill:'https://www.torn.com/points.php', token_refill:'https://www.torn.com/points.php',
    drug:'https://www.torn.com/item.php', booster:'https://www.torn.com/item.php', medical:'https://www.torn.com/item.php',
    missions:'https://www.torn.com/loader.php?sid=missions', shops:'https://www.torn.com/shops.php', virus:'https://www.torn.com/item.php', education:'https://www.torn.com/education.php', casino:'https://www.torn.com/casino.php',
    wheel_lame:'https://www.torn.com/page.php?sid=spinTheWheel', wheel_mediocrity:'https://www.torn.com/page.php?sid=spinTheWheel', wheel_awesome:'https://www.torn.com/page.php?sid=spinTheWheel',
    city:'https://www.torn.com/city.php', gym:'https://www.torn.com/gym.php', crimes:'https://www.torn.com/loader.php?sid=crimes', travel:'https://www.torn.com/travelagency.php', racing:'https://www.torn.com/loader.php?sid=racing', job:'https://www.torn.com/joblist.php', faction_oc:'https://www.torn.com/factions.php?step=your', prayer:'https://www.torn.com/church.php', blood_bags:'https://www.torn.com/item.php',
    item_market:'https://www.torn.com/page.php?sid=ItemMarket', bazaar:'https://www.torn.com/bazaar.php', stocks:'https://www.torn.com/page.php?sid=stocks', points:'https://www.torn.com/points.php'
  });
  function navigateToTask(id){
    const url=TASK_LINKS[String(id||'')]; if(!url) return false;
    try{ location.href=url; return true; }catch{}
    try{ window.location.assign(url); return true; }catch{}
    return false;
  }

'''
if anchor not in s: raise SystemExit('ALIASES anchor missing')
s=s.replace(anchor,nav+anchor,1)

old="    p.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.sdp-custom input'))p.querySelector('[data-sdp=\"add\"]')?.click();});"
new="    p.addEventListener('click',e=>{if(e.target.closest('button,input,textarea,select,a'))return;const row=e.target.closest('.sdp-task[data-nav-id]');if(row)navigateToTask(row.dataset.navId);});\n"+old
if old not in s: raise SystemExit('keydown anchor missing')
s=s.replace(old,new,1)

oldrow='${rows.map(x=>`<div class="sdp-task ${x.status}"><div class="sdp-icon">${x.icon||\'•\'}'
newrow='${rows.map(x=>`<div class="sdp-task ${x.status}"${TASK_LINKS[x.id]?` data-nav-id="${x.id}" style="cursor:pointer"`:\'\'}><div class="sdp-icon">${x.icon||\'•\'}'
if oldrow not in s: raise SystemExit('row render anchor missing')
s=s.replace(oldrow,newrow,1)

oldapi='wheelDiagnostics,copyWheelDiagnostics,applyApiSnapshot:interpretV3'
newapi='wheelDiagnostics,copyWheelDiagnostics,navigateToTask,taskLinks:TASK_LINKS,applyApiSnapshot:interpretV3'
if oldapi not in s: raise SystemExit('public API anchor missing')
s=s.replace(oldapi,newapi,1)

for needle in ['const TASK_LINKS = Object.freeze({','function navigateToTask(id){','data-nav-id=','navigateToTask,taskLinks:TASK_LINKS']:
    if needle not in s: raise SystemExit('missing '+needle)
p.write_text(s,encoding='utf-8')
