from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')

s=s.replace('// @version      0.9.980','// @version      0.9.981',1)
s=s.replace("const VERSION = '0.9.980';","const VERSION = '0.9.981';",1)
s=s.replace("const API_VERSION = '2.1.4';","const API_VERSION = '2.1.5';",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.4 — v0.9.980 */','/* SakaLuX Smart Daily Checklist v2.1.5 — v0.9.981 */',1)

anchor="  function routeType(url=location.href){\n"
nav=r'''  const TASK_NAV = Object.freeze({
    energy_refill:'/points.php',
    nerve_refill:'/points.php',
    token_refill:'/points.php',
    drug:'/item.php',
    booster:'/item.php',
    medical:'/item.php',
    missions:'/loader.php?sid=missions',
    shops:'/city.php?step=shops',
    virus:'/item.php',
    education:'/education.php',
    casino:'/casino.php',
    wheel_lame:'/page.php?sid=spinTheWheel',
    wheel_mediocrity:'/page.php?sid=spinTheWheel',
    wheel_awesome:'/page.php?sid=spinTheWheel',
    city:'/city.php',
    gym:'/gym.php',
    crimes:'/loader.php?sid=crimes',
    travel:'/travelagency.php',
    racing:'/loader.php?sid=racing',
    job:'/joblist.php',
    faction_oc:'/factions.php?step=your&type=1#/tab=crimes',
    prayer:'/church.php',
    blood_bags:'/item.php',
    item_market:'/page.php?sid=ItemMarket',
    bazaar:'/bazaar.php',
    stocks:'/page.php?sid=stocks',
    points:'/points.php'
  });
  function taskNavUrl(id){ return TASK_NAV[String(id||'')]||''; }
  function navigateTask(id){
    const target=taskNavUrl(id); if(!target) return false;
    close();
    try{
      const url=new URL(target,location.origin).href;
      if(typeof g.SakaLuXCore?.router?.navigate==='function'){ g.SakaLuXCore.router.navigate(url); return true; }
      location.assign(url); return true;
    }catch{
      try{ location.href=target; return true; }catch{}
    }
    return false;
  }
'''
if 'const TASK_NAV = Object.freeze({' not in s:
    if anchor not in s: raise SystemExit('routeType anchor missing')
    s=s.replace(anchor,nav+anchor,1)

old="p.addEventListener('click',e=>{ const a=e.target.closest('[data-sdp]'); if(!a)return; const act=a.dataset.sdp,id=a.dataset.id;if(act==='close')close();if(act==='refresh')refreshApi(true);if(act==='toggle-completed'){state.showCompleted=!state.showCompleted;const s=getStore();save(s);render();}if(act==='filter'){state.filter=a.dataset.value||'all';const s=getStore();save(s);render();}if(act==='toggle-task')setObjective(id,summary().objectives.find(x=>x.id===id)?.status!=='done');if(act==='remove')removeObjective(id);if(act==='reset'&&confirm('Reset today checklist?'))resetToday();if(act==='add'){const input=p.querySelector('.sdp-custom input');const x=addObjective(input?.value);if(x&&input)input.value='';}});"
new="p.addEventListener('click',e=>{ const a=e.target.closest('[data-sdp]'); if(a){const act=a.dataset.sdp,id=a.dataset.id;if(act==='close')close();if(act==='refresh')refreshApi(true);if(act==='toggle-completed'){state.showCompleted=!state.showCompleted;const s=getStore();save(s);render();}if(act==='filter'){state.filter=a.dataset.value||'all';const s=getStore();save(s);render();}if(act==='toggle-task')setObjective(id,summary().objectives.find(x=>x.id===id)?.status!=='done');if(act==='remove')removeObjective(id);if(act==='reset'&&confirm('Reset today checklist?'))resetToday();if(act==='add'){const input=p.querySelector('.sdp-custom input');const x=addObjective(input?.value);if(x&&input)input.value='';}return;} const row=e.target.closest('[data-nav-task]'); if(row&&!e.target.closest('button,input,textarea,select,a')) navigateTask(row.dataset.navTask);});"
if old not in s: raise SystemExit('panel click handler anchor missing')
s=s.replace(old,new,1)

oldrow='<div class="sdp-task ${x.status}"><div class="sdp-icon">${x.icon||\'•\'}</div>'
newrow='<div class="sdp-task ${x.status}" ${taskNavUrl(x.id)?`data-nav-task="${x.id}" role="link" tabindex="0" style="cursor:pointer"`:\'\'}><div class="sdp-icon">${x.icon||\'•\'}</div>'
if oldrow not in s: raise SystemExit('task row anchor missing')
s=s.replace(oldrow,newrow,1)

oldkeydown="p.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.sdp-custom input'))p.querySelector('[data-sdp=\"add\"]')?.click();});"
newkeydown="p.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.sdp-custom input'))p.querySelector('[data-sdp=\"add\"]')?.click();else if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-nav-task]')){e.preventDefault();navigateTask(e.target.dataset.navTask);}});"
if oldkeydown not in s: raise SystemExit('keydown anchor missing')
s=s.replace(oldkeydown,newkeydown,1)

# Expose for regression/debug without altering stable diagnostics.
oldapi='wheelDiagnostics,copyWheelDiagnostics,applyApiSnapshot:interpretV3'
newapi='wheelDiagnostics,copyWheelDiagnostics,taskNavUrl,navigateTask,applyApiSnapshot:interpretV3'
if oldapi in s: s=s.replace(oldapi,newapi,1)

for needle in ["const TASK_NAV = Object.freeze({","function navigateTask(id){","data-nav-task=","wheel_lame:'/page.php?sid=spinTheWheel'","shops:'/city.php?step=shops'"]:
    if needle not in s: raise SystemExit('missing '+needle)

p.write_text(s,encoding='utf-8')
