from pathlib import Path
import re

p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.8.8','// @version      1.8.9',1)
s=s.replace("version:'1.8.8'","version:'1.8.9'",1)
s=s.replace("metrics:APP.key+':metrics', ownEffectiveness:APP.key+':own_effectiveness'", "metrics:APP.key+':metrics', ownEffectiveness:APP.key+':own_effectiveness', positionReqs:APP.key+':position_requirements'",1)

marker='function positions(){\n'
helper=r'''const PUB_POSITIONS=[
 {name:'Bartender',primary:{stat:'endurance',value:3000},secondary:{stat:'manual',value:1500}},
 {name:'Bouncer',primary:{stat:'manual',value:6000},secondary:{stat:'endurance',value:3000}},
 {name:'Waiter',primary:{stat:'endurance',value:3000},secondary:{stat:'manual',value:1500}},
 {name:'Cleaner',primary:{stat:'manual',value:1500},secondary:{stat:'endurance',value:750}},
 {name:'Manager',primary:{stat:'endurance',value:6000},secondary:{stat:'intelligence',value:3000}},
 {name:'Bookkeeper',primary:{stat:'endurance',value:4500},secondary:{stat:'intelligence',value:2250}},
 {name:'Trainer',primary:{stat:'intelligence',value:9000},secondary:{stat:'endurance',value:4500}},
 {name:'Promoter',primary:{stat:'intelligence',value:6000},secondary:{stat:'endurance',value:3000}}
];
function statKey(label){const t=String(label||'').toUpperCase();if(/\bMAN\b|MANUAL/.test(t))return'manual';if(/\bINT\b|INTELLIGENCE/.test(t))return'intelligence';if(/\bEND\b|ENDURANCE/.test(t))return'endurance';return''}
function reqObj(primary,secondary){const r={manual:0,intelligence:0,endurance:0};for(const x of [primary,secondary])if(x?.stat&&x?.value)r[x.stat]=num(x.value);return r}
function seededCompanyPositions(){const type=String(meta().type||'').toLowerCase();return type.includes('pub')?PUB_POSITIONS:[]}
function positionReqCache(){const all=get(KEY.positionReqs,{})||{},key=String(detectCompanyId()||meta().name||'unknown');return {all,key,rows:all[key]||{}}}
function savePositionReqRows(rows){if(!rows?.length)return;const c=positionReqCache();for(const row of rows){if(!row?.name)continue;const old=c.rows[row.name]||{};c.rows[row.name]={...old,...row,primary:row.primary||old.primary,secondary:row.secondary||old.secondary,updated:now()}}c.all[c.key]=c.rows;set(KEY.positionReqs,c.all)}
function scrapePositionRequirements(){
 const text=document.body?.innerText||'';if(!/Company Positions/i.test(text))return [];
 const isPrimary=/Primary Stat/i.test(text)&&!/Secondary Stat/i.test(text),isSecondary=/Secondary Stat/i.test(text)&&!/Primary Stat/i.test(text);
 const mode=isPrimary?'primary':isSecondary?'secondary':null;if(!mode)return [];
 const names=['Bartender','Bouncer','Waiter','Cleaner','Manager','Bookkeeper','Trainer','Promoter'];
 const out=[];
 for(const name of names){
  const nodes=[...document.querySelectorAll('tr,li,div')].filter(el=>{const t=(el.innerText||'').trim();return t.startsWith(name)&&/\b(?:MAN|INT|END)\b/i.test(t)&&/[\d,]+/.test(t)});
  const el=nodes.sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length)[0];if(!el)continue;
  const t=(el.innerText||'').replace(/\s+/g,' ').trim(),m=t.match(/([\d,]+)\s*(MAN|INT|END)\b/i);if(!m)continue;
  out.push({name,[mode]:{stat:statKey(m[2]),value:num(m[1].replace(/,/g,''))}})
 }
 savePositionReqRows(out);return out
}
function cachedOfficialPositions(){
 scrapePositionRequirements();const c=positionReqCache().rows,seed=seededCompanyPositions(),names=new Set([...Object.keys(c),...seed.map(x=>x.name)]),out=[];
 for(const name of names){const base=seed.find(x=>x.name===name)||{},row=c[name]||{},primary=row.primary||base.primary,secondary=row.secondary||base.secondary;if(!primary&&!secondary)continue;out.push({name,primary,secondary,req:reqObj(primary,secondary),official:true,source:(row.primary||row.secondary)?'Company Positions':'Pub requirements'})}
 return out
}
'''
if helper not in s:s=s.replace(marker,helper+marker,1)

pat=r"function positions\(\)\{.*?\n\}\nfunction fit\(stats,p\)\{"
repl=r'''function positions(){
 const official=cachedOfficialPositions();if(official.length)return official.map((p,i)=>({id:i,name:p.name,req:p.req,gains:{manual:0,intelligence:0,endurance:0},primary:p.primary,secondary:p.secondary,official:true,source:p.source}));
 let x=first(profile(),['positions','company_positions','type.positions'],[]);
 if(!Array.isArray(x)&&x&&typeof x==='object')x=Object.entries(x).map(([name,v])=>({name,...v}));
 if(!Array.isArray(x))return[];
 return x.map((p,i)=>{
  const r=p.requirements||p.required_stats||p.stats||{},g=p.stat_gains||p.gains||p.daily_gains||{};
  return {
   id:p.id||p.position_id||i,name:positionLabel(p.name||p.position)||`Position ${i+1}`,
   req:{manual:num(first(r,['manual_labor','manual','man'],first(p,['manual_labor_required'],0))),intelligence:num(first(r,['intelligence','int'],first(p,['intelligence_required'],0))),endurance:num(first(r,['endurance','end'],first(p,['endurance_required'],0)))},
   gains:{manual:num(first(g,['manual_labor','manual','man'],0)),intelligence:num(first(g,['intelligence','int'],0)),endurance:num(first(g,['endurance','end'],0))},official:true,source:'API requirements'
  };
 });
}
function fit(stats,p){'''
s,n=re.subn(pat,lambda m:repl,s,count=1,flags=re.S)
if n!=1: raise SystemExit('positions block not found')

pat=r"function advisor\(stats\)\{.*?\n\}"
repl=r'''function advisor(stats){
 return positions().map(p=>{const qualified=stats.manual>=p.req.manual&&stats.intelligence>=p.req.intelligence&&stats.endurance>=p.req.endurance;const primaryValue=num(p.primary?.value),secondaryValue=num(p.secondary?.value),demand=primaryValue+secondaryValue*.5||Object.values(p.req).reduce((a,v)=>a+num(v),0);return {...p,fit:fit(stats,p),qualified,demand}})
 .sort((a,b)=>(Number(b.qualified)-Number(a.qualified))||(b.qualified?b.demand-a.demand:b.fit-a.fit)||b.fit-a.fit);
}'''
s,n=re.subn(pat,lambda m:repl,s,count=1,flags=re.S)
if n!=1: raise SystemExit('advisor block not found')

# Make the Position table explain the requirement source and primary/secondary pair.
s=s.replace("const source=a.length?'Official company position requirements':'Estimated from real coworkers in each position';", "const source=a.length?(a[0]?.source||'Official company position requirements'):'Estimated from real coworkers in each position';",1)
s=s.replace("<th>Position</th><th>Fit</th><th>MAN</th><th>INT</th><th>END</th><th>Status</th>", "<th>Position</th><th>Fit</th><th>Primary</th><th>Secondary</th><th>Status</th>",1)
s=s.replace("<td>${fmt(p.req.manual)}</td><td>${fmt(p.req.intelligence)}</td><td>${fmt(p.req.endurance)}</td><td>${badge(p.qualified?'QUALIFIED':'BUILD STATS',p.qualified?'good':'warn')}</td>", "<td>${p.primary?fmt(p.primary.value)+' '+p.primary.stat.slice(0,3).toUpperCase():'—'}</td><td>${p.secondary?fmt(p.secondary.value)+' '+p.secondary.stat.slice(0,3).toUpperCase():'—'}</td><td>${badge(p.qualified?'QUALIFIED':'BUILD STATS',p.qualified?'good':'warn')}</td>",1)
# Update note to avoid claiming coworker medians when official rows are used.
s=s.replace("${esc(source)}. Estimated rows use median work stats of coworkers already assigned to that position; they are guidance, not Torn's hidden official requirement.", "${esc(source)}. Official Company Positions requirements are preferred. Coworker medians are used only when Torn does not expose requirements.",1)

# Capture requirements whenever the page changes while the script is alive.
init_marker="document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();"
observer=r'''let ciPosTimer=0;new MutationObserver(()=>{clearTimeout(ciPosTimer);ciPosTimer=setTimeout(()=>{try{scrapePositionRequirements()}catch{}},300)}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
setTimeout(()=>{try{scrapePositionRequirements()}catch{}},800);
'''
if observer not in s:s=s.replace(init_marker,observer+init_marker,1)

p.write_text(s,encoding='utf-8')

md=Path('greasyfork/Company-Intelligence.md')
if md.exists():
 m=md.read_text(encoding='utf-8')
 m=m.replace('**v1.8.8**','**v1.8.9**',1)
 marker='## Current release note\n'
 if marker in m:
  st=m.index(marker)+len(marker);en=m.find('\n## ',st)
  if en<0:en=len(m)
  note='\n**v1.8.9** fixes Best Position Advisor ranking. It now prefers official Company Positions primary/secondary requirements, caches requirements seen in Torn, includes empty positions such as Promoter even when no coworker currently occupies them, and ranks fully-qualified roles by the highest meaningful requirement rather than simply rewarding overqualification in low-level roles. Pub requirements are seeded from the official in-game table and DOM observations override the cache.\n'
  m=m[:st]+note+m[en:]
 hist='## Release history\n'
 if hist in m and '### v1.8.9 — Official position requirements' not in m:
  m=m.replace(hist,hist+'### v1.8.9 — Official position requirements\n\n- Uses Company Positions primary/secondary requirements before coworker estimates.\n- Includes unoccupied roles such as Promoter.\n- Caches requirements observed in Torn.\n- Fixes recommendation ranking so overqualification for easy roles does not beat a higher qualified role.\n- Shows Primary and Secondary requirement columns directly.\n\n',1)
 md.write_text(m,encoding='utf-8')
