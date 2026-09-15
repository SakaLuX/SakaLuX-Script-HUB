from pathlib import Path
import re

p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.8.9','// @version      1.8.10',1)
s=s.replace("version:'1.8.9'","version:'1.8.10'",1)

pat=r"function employeeOptimizer\(\)\{.*?\n\}\nfunction trainingManager\(\)\{"
repl=r'''function employeeOptimizer(){
 const list=employees().map(normEmp),pos=positions();
 if(!list.length)return card('Position Optimizer',empty('Employee data is unavailable for this API response.'));
 const rows=list.map(e=>{const stats={manual:e.manual,intelligence:e.intelligence,endurance:e.endurance},ranked=pos.map(p=>({...p,score:fit(stats,p)})).sort((a,b)=>(Number(b.qualified)-Number(a.qualified))||(b.demand||0)-(a.demand||0)||b.score-a.score),best=ranked[0],current=ranked.find(p=>p.name===e.position),gain=best?Math.max(0,best.score-(current?.score||0)):0;return {...e,best:best?.name||'No requirements',fit:best?.score||0,gain}}).sort((a,b)=>b.gain-a.gain||a.effectiveness-b.effectiveness);
 return card('Employee Effectiveness & Position Optimizer',`<div class="ci-tablewrap ci-mobile-cards ci-optimizer-table"><table><thead><tr><th>Employee</th><th>Current</th><th>EE</th><th>Suggested</th><th>Fit</th><th>Potential</th></tr></thead><tbody>${rows.map(e=>`<tr><td class="ci-person-cell" data-label="Employee"><b>${esc(e.name)}</b><small>#${e.id||''}</small></td><td data-label="Current">${esc(e.position||'Unassigned')}</td><td data-label="Effectiveness">${fmt(e.effectiveness)}</td><td data-label="Suggested"><b>${esc(e.best)}</b></td><td data-label="Fit">${e.fit}%</td><td data-label="Potential">${e.gain?badge('+'+e.gain+' fit','good'):badge('KEEP')}</td></tr>`).join('')}</tbody></table></div><p class="ci-note">Suggestions use official position requirements when available. Torn's effectiveness value remains authoritative.</p>`);
}
function trainingManager(){'''
s,n=re.subn(pat,lambda m:repl,s,count=1,flags=re.S)
if n!=1: raise SystemExit('employeeOptimizer block not found')

pat=r"function directorEmployees\(\)\{.*?\n\}\nfunction directorTrains\(\)\{"
repl=r'''function directorEmployees(){
 const e=employees().map(normEmp).sort((a,b)=>b.effectiveness-a.effectiveness);
 return card('Smart Roster',e.length?`<div class="ci-tablewrap ci-mobile-cards ci-roster-table"><table><thead><tr><th>Employee</th><th>Position</th><th>MAN</th><th>INT</th><th>END</th><th>EE</th><th>Wage</th><th>Flags</th></tr></thead><tbody>${e.map(x=>{let f=[];if(x.effectiveness&&x.effectiveness<90)f.push(badge('LOW EE','bad'));if(x.lastTs&&days(now()-x.lastTs)>=3)f.push(badge('INACTIVE','bad'));return `<tr><td class="ci-person-cell" data-label="Employee"><b>${esc(x.name)}</b><small>#${x.id||''}</small></td><td data-label="Position">${esc(x.position||'Unassigned')}</td><td data-label="MAN">${fmt(x.manual)}</td><td data-label="INT">${fmt(x.intelligence)}</td><td data-label="END">${fmt(x.endurance)}</td><td data-label="Effectiveness">${fmt(x.effectiveness)}</td><td data-label="Wage">${money(x.wage)}</td><td data-label="Flags">${f.join(' ')||badge('OK','good')}</td></tr>`}).join('')}</tbody></table></div>`:empty('No employee data available.'));
}
function directorTrains(){'''
s,n=re.subn(pat,lambda m:repl,s,count=1,flags=re.S)
if n!=1: raise SystemExit('directorEmployees block not found')

mobile_css='''
@media(max-width:720px){
 .ci-mobile-cards{overflow:visible!important}
 .ci-mobile-cards table,.ci-mobile-cards tbody,.ci-mobile-cards tr,.ci-mobile-cards td{display:block!important;width:100%!important;box-sizing:border-box!important}
 .ci-mobile-cards thead{display:none!important}
 .ci-mobile-cards tr{margin:0 0 10px!important;padding:8px 10px!important;border:1px solid #304156!important;border-radius:10px!important;background:#0f1721!important;box-shadow:0 3px 10px rgba(0,0,0,.18)!important}
 .ci-mobile-cards td{display:grid!important;grid-template-columns:minmax(92px,42%) minmax(0,1fr)!important;align-items:center!important;gap:8px!important;padding:5px 0!important;border:0!important;border-bottom:1px solid #222d39!important;white-space:normal!important;overflow-wrap:anywhere!important;text-align:right!important;font-size:12px!important}
 .ci-mobile-cards td:last-child{border-bottom:0!important}
 .ci-mobile-cards td::before{content:attr(data-label);color:#8291a2;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;text-align:left!important}
 .ci-mobile-cards .ci-person-cell{display:block!important;text-align:left!important;padding:2px 0 8px!important;margin-bottom:2px!important;border-bottom:1px solid #334152!important}
 .ci-mobile-cards .ci-person-cell::before{display:none!important}
 .ci-mobile-cards .ci-person-cell b{display:block!important;color:#f2f6fa!important;font-size:14px!important;line-height:1.2!important}
 .ci-mobile-cards .ci-person-cell small{display:block!important;margin-top:2px!important;color:#7f8da0!important;font-size:10px!important}
 .ci-mobile-cards .ci-badge{font-size:10px!important;padding:4px 7px!important}
 .ci-roster-table td[data-label="MAN"],.ci-roster-table td[data-label="INT"],.ci-roster-table td[data-label="END"]{font-variant-numeric:tabular-nums!important}
 .ci-optimizer-table td[data-label="Suggested"] b{color:#7dd3fc!important}
}
'''
needle='@media(max-width:720px){#ci-root{'
if mobile_css not in s:
    idx=s.find(needle)
    if idx<0: raise SystemExit('mobile media marker not found')
    s=s[:idx]+mobile_css+s[idx:]

p.write_text(s,encoding='utf-8')

md=Path('greasyfork/Company-Intelligence.md')
if md.exists():
 m=md.read_text(encoding='utf-8')
 m=m.replace('**v1.8.9**','**v1.8.10**',1)
 marker='## Current release note\n'
 if marker in m:
  st=m.index(marker)+len(marker);en=m.find('\n## ',st)
  if en<0: en=len(m)
  note='\n**v1.8.10** redesigns the Director Staff view for phones. Smart Roster and Position Optimizer now switch from squeezed desktop tables to readable employee cards on mobile, with labeled rows for position, work stats, effectiveness, wage, flags and recommendation data. Desktop tables remain unchanged.\n'
  m=m[:st]+note+m[en:]
 hist='## Release history\n'
 if hist in m and '### v1.8.10 — Mobile Staff readability' not in m:
  m=m.replace(hist,hist+'### v1.8.10 — Mobile Staff readability\n\n- Converts Smart Roster to stacked employee cards on mobile.\n- Converts Employee Effectiveness & Position Optimizer to stacked cards on mobile.\n- Adds explicit field labels so values no longer run together.\n- Keeps desktop table layout unchanged.\n- Improves spacing, wrapping and badge readability on TornPDA.\n\n',1)
 md.write_text(m,encoding='utf-8')
