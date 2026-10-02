#!/usr/bin/env python3
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
SUITE=ROOT/'SakaLuX-Suite.user.js'
TEST=ROOT/'tests'/'suite-daily-progress-regression.cjs'
DOC=ROOT/'greasyfork'/'SakaLuX-Suite.md'

s=SUITE.read_text(encoding='utf-8')

# Versions
s=s.replace('// @version      0.9.969','// @version      0.9.970',1)
s=s.replace("const VERSION = '0.9.969';\n  const SUITE = Object.freeze","const VERSION = '0.9.970';\n  const SUITE = Object.freeze",1)
s=s.replace("const API_VERSION = '2.0.1';","const API_VERSION = '2.1.0';",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.0.1 — v0.9.969 */','/* SakaLuX Smart Daily Checklist v2.1.0 — v0.9.970 */',1)

# Exactly 28 built-in rows. Keep existing IDs where possible so stored completion survives.
new_tasks="""  const TASKS = Object.freeze([
    { id:'energy_refill', label:'Energy refill', icon:'⚡', category:'Refills', auto:'api', endpoint:'refills' },
    { id:'nerve_refill', label:'Nerve refill', icon:'🧠', category:'Refills', auto:'api', endpoint:'refills' },
    { id:'token_refill', label:'Casino token refill', icon:'🎟️', category:'Refills', auto:'api', endpoint:'refills', optional:true },
    { id:'drug', label:'Drug used today', icon:'💊', category:'Cooldowns', auto:'api+logs', endpoint:'cooldowns' },
    { id:'booster', label:'Booster used today', icon:'🍬', category:'Cooldowns', auto:'api+logs', endpoint:'cooldowns' },
    { id:'medical', label:'Medical item used today', icon:'🩸', category:'Cooldowns', auto:'api+logs', endpoint:'cooldowns', optional:true },
    { id:'missions', label:'Daily missions', icon:'🎯', category:'Daily', auto:'api+route', endpoint:'missions', routes:['missions'] },
    { id:'shops', label:'City shops 100/100', icon:'🛒', category:'Daily', auto:'logs+route', routes:['shops'] },
    { id:'virus', label:'Virus coding', icon:'💻', category:'Daily', auto:'api', endpoint:'virus', optional:true },
    { id:'education', label:'Education course active', icon:'🎓', category:'Daily', auto:'api', endpoint:'education', optional:true },
    { id:'casino', label:'Use daily casino tokens', icon:'🎰', category:'Casino', auto:'api', endpoint:'casino', optional:true },
    { id:'wheel_lame', label:'Wheel of Lame', icon:'🎡', category:'Casino', auto:'logs+route', routes:['wheels'], optional:true },
    { id:'wheel_mediocrity', label:'Wheel of Mediocrity', icon:'🎡', category:'Casino', auto:'logs+route', routes:['wheels'], optional:true },
    { id:'wheel_awesome', label:'Wheel of Awesome', icon:'🎡', category:'Casino', auto:'logs+route', routes:['wheels'], optional:true },
    { id:'city', label:'Check City map', icon:'🏙️', category:'Activity', auto:'logs+route', routes:['city'] },
    { id:'gym', label:'Spend energy / Gym', icon:'🏋️', category:'Activity', auto:'logs+route', routes:['gym'] },
    { id:'crimes', label:'Spend nerve / Crimes', icon:'🔫', category:'Activity', auto:'logs+route', routes:['crimes'] },
    { id:'travel', label:'Travel / fly', icon:'✈️', category:'Activity', auto:'api+logs+route', endpoint:'travel', routes:['travel'] },
    { id:'racing', label:'Race today', icon:'🏎️', category:'Activity', auto:'logs+route', routes:['racing'], optional:true },
    { id:'job', label:'Job / company check', icon:'🏢', category:'Activity', auto:'logs+route', routes:['job'], optional:true },
    { id:'faction_oc', label:'Organized crime slot', icon:'👥', category:'Faction', auto:'api+route', endpoint:'organizedcrime', routes:['faction'], optional:true },
    { id:'prayer', label:'Church prayer', icon:'⛪', category:'Daily', auto:'logs+route', routes:['prayer'], optional:true },
    { id:'blood_bags', label:'Fill / use blood bags', icon:'🩸', category:'Daily', auto:'logs', optional:true },
    { id:'item_market', label:'Check Item Market', icon:'📈', category:'Market', auto:'route', routes:['item_market'], optional:true },
    { id:'bazaar', label:'Check Bazaar', icon:'🏪', category:'Market', auto:'route', routes:['bazaar'], optional:true },
    { id:'stocks', label:'Check Stocks / benefits', icon:'📊', category:'Market', auto:'route', routes:['stocks'], optional:true },
    { id:'points', label:'Check Points / refills', icon:'🔷', category:'Daily', auto:'route', routes:['points'], optional:true },
    { id:'review', label:'Review daily plan', icon:'📋', category:'Custom', auto:'manual' }
  ]);"""
pat=r"  const TASKS = Object\.freeze\(\[.*?\n  \]\);"
s,n=re.subn(pat,new_tasks,s,count=1,flags=re.S)
if n!=1: raise SystemExit('TASKS block not found')

# Torn day is TCT/UTC, not browser local time.
old_day="""  function dayKey(d = new Date()) {
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function startOfTodayMs() { const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); }"""
new_day="""  function dayKey(d = new Date()) {
    const y=d.getUTCFullYear(), m=String(d.getUTCMonth()+1).padStart(2,'0'), day=String(d.getUTCDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function startOfTodayMs() { const d=new Date(); return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()); }
  function startOfTodaySec(){ return Math.floor(startOfTodayMs()/1000); }"""
if old_day not in s: raise SystemExit('day key block not found')
s=s.replace(old_day,new_day,1)

# More route fallbacks without pretending that merely opening Wheels completes all 3 spins.
s=s.replace("    if(/casino.*wheel|wheel/.test(u)) return 'wheels';\n    if(/shops|shop\\.php|points\\.php/.test(u)) return 'shops';",
"    if(/casino.*wheel|wheel/.test(u)) return 'wheels';\n    if(/itemmarket|item-market|sid=itemmarket/.test(u)) return 'item_market';\n    if(/bazaar|sid=bazaar/.test(u)) return 'bazaar';\n    if(/stock|stocks/.test(u)) return 'stocks';\n    if(/points\\.php|sid=points/.test(u)) return 'points';\n    if(/shops|shop\\.php/.test(u)) return 'shops';",1)

# Do not auto-complete all wheel rows merely from opening the wheel page.
s=s.replace("      const targets=TASKS.filter(t=>(t.routes||[]).includes(type) || t.id===type);",
"      const targets=TASKS.filter(t=>((t.routes||[]).includes(type) || t.id===type) && !(type==='wheels' && /^wheel_/.test(t.id)));",1)

# Logs require full access, matching torn.gg's documented Full Access requirement. Other endpoints remain useful without it.
s=s.replace("    organizedcrime:'https://api.torn.com/v2/user/organizedcrime'",
"    organizedcrime:'https://api.torn.com/v2/user/organizedcrime',\n    logs:'https://api.torn.com/v2/user/log'",1)

insert="""
  function deepText(v){
    try{return JSON.stringify(v||{}).toLowerCase();}catch{return String(v||'').toLowerCase();}
  }
  function applyLogCompletion(data){
    const logs=Array.isArray(data?.log)?data.log:(Array.isArray(data?.logs)?data.logs:[]);
    if(!logs.length) return;
    let shopQty=0;
    const hit=id=>setTask(id,{status:'done',source:'logs',detail:'Detected in today\\'s Torn logs'});
    for(const row of logs){
      const title=String(row?.details?.title||'').toLowerCase();
      const category=String(row?.details?.category||'').toLowerCase();
      const text=(title+' '+category+' '+deepText(row?.data)+' '+deepText(row?.params)).toLowerCase();
      if(/xanax|drug (use|used)|used .*drug|take .*drug/.test(text)) hit('drug');
      if(/booster|energy drink|candy|alcohol|feathery hotel coupon|fhc/.test(text)) hit('booster');
      if(/medical|blood bag|first aid|morphine|small first aid|large first aid/.test(text)) hit('medical');
      if(/blood bag|bloodbag/.test(text)) hit('blood_bags');
      if(/gym|train|training/.test(text)) hit('gym');
      if(/crime/.test(text) && !/organized crime/.test(text)) hit('crimes');
      if(/travel|flight|flying|departed.*(mexico|cayman|canada|hawaii|uk|argentina|switzerland|japan|china|uae|south africa)/.test(text)) hit('travel');
      if(/race (joined|finished|completed|started)|racing/.test(text)) hit('racing');
      if(/pray|prayer|church/.test(text)) hit('prayer');
      if(/wheel of lame/.test(text)) hit('wheel_lame');
      if(/wheel of mediocrity/.test(text)) hit('wheel_mediocrity');
      if(/wheel of awesome/.test(text)) hit('wheel_awesome');
      if(/city (find|item)|found .*city/.test(text)) hit('city');
      if(/shop/.test(text) && /buy|bought|purchase/.test(text)){
        const q=Number(row?.data?.quantity ?? row?.data?.amount ?? row?.params?.quantity ?? row?.params?.amount ?? 1)||1;
        shopQty+=Math.max(1,q);
      }
    }
    if(shopQty>=100) setTask('shops',{status:'done',source:'logs',detail:`${shopQty}/100 shop items detected today`});
    else if(shopQty>0) setTask('shops',{status:'action',source:'logs',detail:`${shopQty}/100 shop items detected today`});
  }

  function interpretV3(name,data){
    if(name==='logs'){ applyLogCompletion(data); return; }
    if(name==='refills'){
      const r=data?.refills ?? data?.data?.refills ?? data?.data ?? {};
      // API v2 schema: energy / nerve / token are booleans representing whether that daily refill has been used.
      const apply=(id,key,label)=>{
        const v=r?.[key];
        if(typeof v==='boolean') setTask(id,{status:v?'done':'action',source:'api',detail:v?`${label} used today`:`${label} still available`});
        else setTask(id,{status:'pending',source:'api',detail:`${label} state unavailable`});
      };
      apply('energy_refill','energy','Energy refill');
      apply('nerve_refill','nerve','Nerve refill');
      apply('token_refill','token','Token refill');
      return;
    }
    if(name==='cooldowns'){
      const c=data?.cooldowns ?? data?.data?.cooldowns ?? data?.data ?? {};
      const drug=Number(c?.drug)||0, booster=Number(c?.booster)||0, medical=Number(c?.medical)||0;
      if(drug>0) setTask('drug',{status:'done',source:'api',detail:`Drug cooldown ${fmtDuration(drug)}`});
      else if(get().tasks?.drug?.source!=='logs') setTask('drug',{status:'action',source:'api',detail:'Drug cooldown ready'});
      if(booster>0) setTask('booster',{status:'done',source:'api',detail:`Booster cooldown ${fmtDuration(booster)}`});
      else if(get().tasks?.booster?.source!=='logs') setTask('booster',{status:'action',source:'api',detail:'Booster cooldown ready'});
      if(medical>0) setTask('medical',{status:'done',source:'api',detail:`Medical cooldown ${fmtDuration(medical)}`});
      else if(get().tasks?.medical?.source!=='logs') setTask('medical',{status:'action',source:'api',detail:'Medical cooldown ready'});
      return;
    }
    if(name==='casino'){
      const c=data?.casino ?? data?.data?.casino ?? data?.data ?? {};
      const tokens=Number(c?.tokens);
      if(Number.isFinite(tokens)) setTask('casino',{status:tokens<=0?'done':'action',source:'api',detail:tokens<=0?'Daily casino tokens used':`${tokens} casino tokens remaining`});
      return;
    }
    if(name==='virus'){
      const v=('virus' in (data||{}))?data.virus:data?.data?.virus;
      setTask('virus',{status:v?'done':'action',source:'api',detail:v?`Coding ${v?.item?.name||'virus'}`:'No virus currently coding'});
      return;
    }
    if(name==='education'){
      const e=data?.education ?? data?.data?.education ?? {};
      const cur=e?.current ?? null;
      setTask('education',{status:cur?'done':'action',source:'api',detail:cur?`Course active${cur.until?` • ends ${new Date(cur.until*1000).toLocaleString()}`:''}`:'No active education course'});
      return;
    }
    if(name==='missions'){
      const m=data?.missions ?? data?.data?.missions ?? {};
      const contracts=[];
      for(const giver of (Array.isArray(m?.givers)?m.givers:[])) for(const c of (Array.isArray(giver?.contracts)?giver.contracts:[])) contracts.push(c);
      const active=contracts.filter(c=>/available|accepted|active/i.test(String(c?.status||'')));
      const today=contracts.filter(c=>Number(c?.created_at||c?.completed_at||0)>=startOfTodaySec());
      setTask('missions',{status:active.length?'action':'done',source:'api',detail:active.length?`${active.length} mission${active.length===1?'':'s'} available/active`:(today.length?'Today\\'s missions cleared':'No active missions')});
      return;
    }
    if(name==='travel'){
      const t=data?.travel ?? data?.data?.travel ?? {};
      const departed=Number(t?.departed_at)||0;
      const currentlyAway=(Number(t?.time_left)||0)>0 || (t?.destination && !/torn/i.test(String(t.destination)));
      if(currentlyAway || departed>=startOfTodaySec()) setTask('travel',{status:'done',source:'api',detail:currentlyAway?`Travel active • ${t.destination||''}`:'Flight detected today'});
      else if(get().tasks?.travel?.source!=='route' && get().tasks?.travel?.source!=='logs') setTask('travel',{status:'action',source:'api',detail:'No flight detected today'});
      return;
    }
    if(name==='organizedcrime'){
      const oc=data?.organizedCrime ?? data?.organizedcrime ?? data?.data?.organizedCrime ?? data?.data?.organizedcrime ?? null;
      if(oc && !oc?.error) setTask('faction_oc',{status:'done',source:'api',detail:`OC assigned${oc?.name?` • ${oc.name}`:''}`});
      else setTask('faction_oc',{status:'action',source:'api',detail:'No current OC assignment detected'});
      return;
    }
    // Preserve compatibility for any endpoint shape not covered above.
    try{ interpret(name,data); }catch{}
  }

  function logEndpoint(){
    const from=startOfTodaySec();
    const to=Math.floor(Date.now()/1000);
    return `https://api.torn.com/v2/user/log?from=${from}&to=${to}&limit=100`;
  }
"""
marker="  async function refreshApi(force=false){"
if 'function interpretV3(' not in s:
    if marker not in s: raise SystemExit('refreshApi marker not found')
    s=s.replace(marker,insert+'\n'+marker,1)

s=s.replace("    const entries=Object.entries(ENDPOINTS);","    const entries=Object.entries(ENDPOINTS).map(([name,url])=>[name,name==='logs'?logEndpoint():url]);",1)
s=s.replace("try{interpret(name,r.value);}","try{interpretV3(name,r.value);}",1)

# Expose snapshot application for diagnostics/regression tests.
old_api="g.SakaLuXSuiteDailyProgress=Object.freeze({version:API_VERSION,storageKey:STORAGE_KEY,dayKey,get,summary,setObjective,addObjective,removeObjective,recordActivity,refreshApi,moduleStatus,open,close,resetToday,routeType,getApiKey});"
new_api="g.SakaLuXSuiteDailyProgress=Object.freeze({version:API_VERSION,storageKey:STORAGE_KEY,dayKey,get,summary,setObjective,addObjective,removeObjective,recordActivity,refreshApi,moduleStatus,open,close,resetToday,routeType,getApiKey,applyApiSnapshot:interpretV3});"
if old_api not in s: raise SystemExit('public API line not found')
s=s.replace(old_api,new_api,1)

SUITE.write_text(s,encoding='utf-8')

# Regression: exact 28 rows + real v2 shapes for the bugs reported.
t=TEST.read_text(encoding='utf-8')
t=t.replace(r"0\.9\.969",r"0\.9\.970",1)
t=t.replace("const VERSION = '0.9.969';","const VERSION = '0.9.970';",1)
t=t.replace("assert.equal(api.version,'2.0.1');","assert.equal(api.version,'2.1.0');",1)
t=t.replace("assert.ok(s.total>=15,'full smart checklist installed');","assert.equal(s.total,28,'28 built-in Smart Daily Checklist rows installed');",1)
anchor="let s=api.summary();"
checks="""let s=api.summary();
api.applyApiSnapshot('refills',{refills:{energy:true,nerve:false,token:true,special_count:0}});
assert.equal(api.summary().objectives.find(x=>x.id==='energy_refill').status,'done','used energy refill auto-completes from v2 boolean');
assert.equal(api.summary().objectives.find(x=>x.id==='nerve_refill').status,'action','unused nerve refill stays actionable');
assert.equal(api.summary().objectives.find(x=>x.id==='token_refill').status,'done','used casino token refill auto-completes');
api.applyApiSnapshot('casino',{casino:{tokens:0,streak:4}});
assert.equal(api.summary().objectives.find(x=>x.id==='casino').status,'done','zero remaining casino tokens auto-completes');
api.applyApiSnapshot('virus',{virus:{item:{id:1,name:'Computer Virus'},until:1999999999}});
assert.equal(api.summary().objectives.find(x=>x.id==='virus').status,'done','active virus coding auto-completes');
api.applyApiSnapshot('education',{education:{complete:[],current:{id:1,until:1999999999}}});
assert.equal(api.summary().objectives.find(x=>x.id==='education').status,'done','active education auto-completes');"""
if anchor in t and 'used energy refill auto-completes from v2 boolean' not in t:
    t=t.replace(anchor,checks,1)
TEST.write_text(t,encoding='utf-8')

md=DOC.read_text(encoding='utf-8')
md=md.replace('**v0.9.969**','**v0.9.970**',1)
md=md.replace('- Canonical version: **v0.9.969**','- Canonical version: **v0.9.970**',1)
start=md.find('## Current release note')
end=md.find('## Release history / Changelog',start)
if start>=0 and end>start:
    md=md[:start]+"""## Current release note

**v0.9.970 — Smart Daily Checklist 28/28 + API accuracy pass**
- Expands the built-in checklist to exactly **28 rows**.
- Fixes Torn API v2 refill parsing: `refills.energy`, `refills.nerve` and `refills.token` are handled as booleans instead of objects, fixing used refills incorrectly showing ACTION.
- Separates **Casino token refill** from **Use daily casino tokens**; the former comes from `/user/refills`, while remaining tokens come from `/user/casino`.
- Corrects API parsing for missions, education, virus coding, travel and organized crime against the current official v2 schemas.
- Uses Full Access `/user/log` as a second detection layer for same-day drug/booster/medical use, blood bags, gym, crimes, travel, racing, prayer, wheels, city activity and city-shop purchase progress.
- Uses Torn day rollover at **00:00 TCT / UTC** instead of browser-local midnight.
- Keeps route detection as a fallback for TornPDA where API/log evidence is unavailable.

"""+md[end:]
entry="""
### v0.9.970 — Smart Daily Checklist 28/28 + API accuracy pass
- 28 built-in checklist rows.
- Correct v2 boolean handling for Energy, Nerve and Casino Token refills.
- Casino tokens and token refill tracked separately.
- Full-access daily log inference added as a second auto-completion layer.
- Torn day key switched to UTC/TCT.
- Regression coverage added for reported refill/casino failures and current official v2 response shapes.

"""
idx=md.find('## Release history / Changelog')
if idx>=0 and entry.strip() not in md:
    pos=idx+len('## Release history / Changelog')
    md=md[:pos]+'\n'+entry+md[pos:]
DOC.write_text(md,encoding='utf-8')
