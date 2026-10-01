from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
JS = ROOT / 'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG = ROOT / 'scripts.json'
DOC = ROOT / 'greasyfork/Company-Intelligence.md'
VERSION = '1.8.43'
DATE = '2026-10-02'

text = JS.read_text(encoding='utf-8')
text = re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', text, count=1)
text = re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'", f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'", text, count=1)

old_clear = """function clearCurrentCompany(){
 delete S.data.profile;delete S.data.employees;delete S.data.stock;
 del(KEY.company);del(KEY.ownEffectiveness);
}"""
new_clear = """function clearCurrentCompany(){
 delete S.data.profile;delete S.data.employees;delete S.data.stock;
 del(KEY.company);del(KEY.ownEffectiveness);del(KEY.positionReqs);
}"""
if old_clear in text:
    text = text.replace(old_clear, new_clear, 1)

start = text.find('const PUB_POSITIONS=[')
end = text.find('\nfunction fit(stats,p){', start)
if start < 0 or end < 0:
    raise SystemExit('position requirements block not found')

block = r'''const PUB_POSITIONS=[
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
function statShort(stat){return stat==='manual'?'MAN':stat==='intelligence'?'INT':stat==='endurance'?'END':'—'}
function reqObj(primary,secondary){const r={manual:0,intelligence:0,endurance:0};for(const x of [primary,secondary])if(x?.stat&&x?.value)r[x.stat]=num(x.value);return r}
function seededCompanyPositions(){const type=String(meta().type||'').toLowerCase();return type.includes('pub')?PUB_POSITIONS:[]}
function positionReqCache(){const all=get(KEY.positionReqs,{})||{},key=String(detectCompanyId()||meta().name||'unknown');return {all,key,rows:all[key]||{}}}
function savePositionReqRows(rows){if(!rows?.length)return;const c=positionReqCache();for(const row of rows){if(!row?.name)continue;const old=c.rows[row.name]||{};c.rows[row.name]={...old,...row,primary:row.primary||old.primary,secondary:row.secondary||old.secondary,updated:now()}}c.all[c.key]=c.rows;set(KEY.positionReqs,c.all)}
function detectedPositionNames(){
 const names=new Set();
 for(const e of employees().map(normEmp))if(e.position)names.add(e.position);
 const current=currentPosition();if(current&&!/not currently|not returned/i.test(current))names.add(current);
 Object.keys(positionReqCache().rows).forEach(x=>names.add(x));
 let raw=first(profile(),['positions','company_positions','type.positions'],[]);
 if(Array.isArray(raw))raw.forEach(p=>{const n=positionLabel(p?.name||p?.position);if(n)names.add(n)});
 else if(raw&&typeof raw==='object')Object.keys(raw).forEach(n=>{if(n)names.add(n)});
 return [...names].filter(Boolean).sort((a,b)=>a.localeCompare(b));
}
function cleanPositionName(raw){
 let t=String(raw||'').replace(/\s+/g,' ').trim();
 t=t.replace(/\b(?:Primary|Secondary)\s+Stat\b.*$/i,'').replace(/\b[\d,]+\s*(?:MAN|INT|END)\b.*$/i,'').trim();
 t=t.replace(/^[\s:|·\-]+|[\s:|·\-]+$/g,'').trim();
 if(!t||t.length>80||/company positions|primary stat|secondary stat/i.test(t))return'';
 return t;
}
function scrapePositionRequirements(){
 if(document.hidden||!/(?:companies|joblist)\.php/i.test(location.pathname))return [];
 const pageText=document.body?.innerText||'';if(!/Company Positions/i.test(pageText))return [];
 const pagePrimary=/Primary Stat/i.test(pageText)&&!/Secondary Stat/i.test(pageText);
 const pageSecondary=/Secondary Stat/i.test(pageText)&&!/Primary Stat/i.test(pageText);
 const known=detectedPositionNames(),out=[];
 const candidates=[...document.querySelectorAll('tr,li,[class*=position],[class*=role],div')].filter(el=>{
  const t=String(el.innerText||'').replace(/\s+/g,' ').trim();
  return t.length>3&&t.length<420&&/\b(?:MAN|INT|END)\b/i.test(t)&&/[\d,]+/.test(t)&&!el.closest('#ci-root');
 });
 const used=new Set();
 for(const el of candidates){
  const t=String(el.innerText||'').replace(/\s+/g,' ').trim();
  const pairs=[...t.matchAll(/([\d,]+)\s*(MAN|INT|END)\b/ig)];if(!pairs.length)continue;
  let name=known.find(n=>new RegExp('(^|\\s)'+n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s|$)','i').test(t));
  if(!name)name=cleanPositionName(t.slice(0,pairs[0].index));
  if(!name||used.has(name+'|'+t))continue;used.add(name+'|'+t);
  const row={name,source:'Company Positions'};
  if(pairs.length>=2&&!pagePrimary&&!pageSecondary){row.primary={stat:statKey(pairs[0][2]),value:num(pairs[0][1].replace(/,/g,''))};row.secondary={stat:statKey(pairs[1][2]),value:num(pairs[1][1].replace(/,/g,''))};}
  else{const mode=pagePrimary?'primary':pageSecondary?'secondary':/secondary\s+stat/i.test(t)?'secondary':'primary';row[mode]={stat:statKey(pairs[0][2]),value:num(pairs[0][1].replace(/,/g,''))};}
  out.push(row);
 }
 if(out.length)savePositionReqRows(out);return out
}
function apiCompanyPositions(){
 let x=first(profile(),['positions','company_positions','type.positions'],[]);
 if(!Array.isArray(x)&&x&&typeof x==='object')x=Object.entries(x).map(([name,v])=>({name,...v}));
 if(!Array.isArray(x))return[];
 return x.map((p,i)=>{const r=p.requirements||p.required_stats||p.stats||{},g=p.stat_gains||p.gains||p.daily_gains||{},req={manual:num(first(r,['manual_labor','manual','man'],first(p,['manual_labor_required'],0))),intelligence:num(first(r,['intelligence','int'],first(p,['intelligence_required'],0))),endurance:num(first(r,['endurance','end'],first(p,['endurance_required'],0)))},primary=p.primary?.stat?{stat:statKey(p.primary.stat),value:num(p.primary.value)}:null,secondary=p.secondary?.stat?{stat:statKey(p.secondary.stat),value:num(p.secondary.value)}:null;return {id:p.id||p.position_id||i,name:positionLabel(p.name||p.position)||`Position ${i+1}`,req,gains:{manual:num(first(g,['manual_labor','manual','man'],0)),intelligence:num(first(g,['intelligence','int'],0)),endurance:num(first(g,['endurance','end'],0))},primary,secondary,official:true,source:'API'}}).filter(p=>Object.values(p.req).some(v=>v>0)||p.primary||p.secondary);
}
function cachedOfficialPositions(){
 scrapePositionRequirements();const c=positionReqCache().rows,seed=seededCompanyPositions(),names=new Set([...Object.keys(c),...seed.map(x=>x.name)]),out=[];
 for(const name of names){const base=seed.find(x=>x.name===name)||{},row=c[name]||{},primary=row.primary||base.primary,secondary=row.secondary||base.secondary;if(!primary&&!secondary)continue;const source=row.source||(row.manual?'Manual':(row.primary||row.secondary)?'Company Positions':'Pub requirements');out.push({name,primary,secondary,req:reqObj(primary,secondary),official:true,source})}
 return out
}
function positions(){const apiRows=apiCompanyPositions();if(apiRows.length)return apiRows;const cached=cachedOfficialPositions();if(cached.length)return cached.map((p,i)=>({id:i,name:p.name,req:p.req,gains:{manual:0,intelligence:0,endurance:0},primary:p.primary,secondary:p.secondary,official:true,source:p.source}));return []}
function openPositionRequirementsEditor(){
 const names=detectedPositionNames();if(!names.length){alert('No company positions detected yet. Refresh Company Intelligence or open Company Positions once, then try again.');return}
 const cache=positionReqCache().rows,back=document.createElement('div');back.className='ci-dialogback';back.id='ci-position-editor';
 const statOptions=value=>['','manual','intelligence','endurance'].map(v=>`<option value="${v}" ${v===value?'selected':''}>${v?statShort(v):'— Select —'}</option>`).join('');
 back.innerHTML=`<div class="ci-dialog ci-position-editor"><h3>Company Position Requirements</h3><p class="ci-note">Company: <b>${esc(meta().name)}</b>. API data has priority. Manual values are used only when Torn does not expose requirements and are cleared automatically when you change company.</p><div class="ci-position-edit-list">${names.map(name=>{const row=cache[name]||{};return `<div class="ci-position-edit-row" data-pos-row data-name="${esc(name)}"><b>${esc(name)}</b><label>Primary<select data-primary-stat>${statOptions(row.primary?.stat||'')}</select><input data-primary-value type="number" min="0" value="${num(row.primary?.value)}"></label><label>Secondary<select data-secondary-stat>${statOptions(row.secondary?.stat||'')}</select><input data-secondary-value type="number" min="0" value="${num(row.secondary?.value)}"></label></div>`}).join('')}</div><div class="ci-actions"><button class="ci-btn primary" data-save>Save positions</button><button class="ci-btn" data-cancel>Cancel</button></div></div>`;
 document.body.appendChild(back);$('[data-cancel]',back).onclick=()=>back.remove();$('[data-save]',back).onclick=()=>{const rows=[];$$('[data-pos-row]',back).forEach(el=>{const name=el.dataset.name,ps=$('[data-primary-stat]',el)?.value,pv=num($('[data-primary-value]',el)?.value),ss=$('[data-secondary-stat]',el)?.value,sv=num($('[data-secondary-value]',el)?.value);if((ps&&pv)||(ss&&sv))rows.push({name,primary:ps&&pv?{stat:ps,value:pv}:null,secondary:ss&&sv?{stat:ss,value:sv}:null,manual:true,source:'Manual'})});const c=positionReqCache();c.all={[c.key]:{}};set(KEY.positionReqs,c.all);savePositionReqRows(rows);back.remove();render()};
}
'''
text = text[:start] + block + text[end:]

pos_start = text.find('function employeePosition(){')
pos_end = text.find('\nfunction employeeTrains(){', pos_start)
if pos_start < 0 or pos_end < 0:
    raise SystemExit('employeePosition block not found')
new_pos = r'''function employeePosition(){
 const w=work(),a=advisor(w),observed=!a.length?observedPositionAdvisor(w):[],rows=a.length?a:observed,best=rows[0],current=currentPosition(),eff=currentEffectiveness(),daysHere=ownDaysInCompany(),estimated=!a.length;
 const actions=`<div class="ci-actions"><button class="ci-btn primary" data-act="edit-positions">⚙ EDIT POSITIONS</button></div>`;
 const currentCard=card('Current Position',kv('Position',current?esc(current):'Not returned by Torn API')+kv('Effectiveness',eff==null?'Not exposed yet':fmt(eff))+kv('Days in company',daysHere||'Not returned'));
 if(!rows.length)return actions+`<div class="ci-grid">${currentCard}${card('Best Position Advisor',empty('Position requirements are not exposed by your current API response and no coworker work-stat samples are available yet.')+`<p class="ci-note">Open Company Positions so the script can learn the requirements, or use EDIT POSITIONS to enter Primary and Secondary manually.</p><p class="ci-note">Current stats: MAN ${fmt(w.manual)} · INT ${fmt(w.intelligence)} · END ${fmt(w.endurance)}</p>`)}</div>`;
 const source=a.length?(a[0]?.source||'Official company position requirements'):'Estimated from real coworkers in each position';
 const recommendation=best?card('Recommended Position',kv('Best match',esc(best.name))+kv(estimated?'Estimated fit':'Fit',best.fit+'%')+kv('Status',estimated?badge('ESTIMATED MATCH','warn'):badge(best.qualified?'QUALIFIED':'BUILD STATS',best.qualified?'good':'warn'))+`<p class="ci-note">${esc(source)}${best.estimated?` · ${best.sample} employee sample${best.sample===1?'':'s'}`:''}.</p>`):'';
 const table=card('Best Position Advisor',`<div class="ci-tablewrap ci-mobile-cards ci-position-table"><table><thead><tr><th>Position</th><th>Fit</th><th>Primary</th><th>Secondary</th><th>Status</th></tr></thead><tbody>${rows.map(p=>`<tr><td class="ci-person-cell" data-label="Position"><b>${esc(p.name)}${p.name===current?' · CURRENT':''}</b><small>${esc(p.source||source)}</small></td><td data-label="Fit">${p.fit}%</td><td data-label="Primary">${p.primary?fmt(p.primary.value)+' '+statShort(p.primary.stat):'Not available'}</td><td data-label="Secondary">${p.secondary?fmt(p.secondary.value)+' '+statShort(p.secondary.stat):'Not available'}</td><td data-label="Status">${p.estimated?badge('ESTIMATED','warn'):badge(p.qualified?'QUALIFIED':'BUILD STATS',p.qualified?'good':'warn')}</td></tr>`).join('')}</tbody></table></div><p class="ci-note">Priority: Torn API → Company Positions → manual values → coworker estimate. Manual values are stored only for the current company and are cleared when the company changes.</p>`);
 return actions+`<div class="ci-grid">${currentCard}${recommendation}${table}</div>`;
}'''
text = text[:pos_start] + new_pos + text[pos_end:]

marker = " if(a==='refresh'){refresh();return}\n"
if "if(a==='edit-positions')" not in text:
    text = text.replace(marker, marker + " if(a==='edit-positions'){openPositionRequirementsEditor();return}\n", 1)

css_marker = '.ci-form .wide{grid-column:1/-1}'
if '.ci-position-editor{' not in text:
    css_add = '.ci-form .wide{grid-column:1/-1}.ci-position-editor{width:min(720px,100%);max-height:88vh;overflow:auto}.ci-position-edit-list{display:grid;gap:8px;margin:10px 0}.ci-position-edit-row{display:grid;grid-template-columns:minmax(140px,1fr) minmax(180px,1fr) minmax(180px,1fr);gap:8px;align-items:center;padding:9px;border:1px solid #304156;border-radius:9px;background:#0f1721}.ci-position-edit-row>label{display:grid;grid-template-columns:1fr 90px;gap:6px;color:#9ba8b7;font-size:10px}.ci-position-edit-row select,.ci-position-edit-row input{min-width:0;width:100%;box-sizing:border-box;background:#0d141d;color:#f4f7fb;border:1px solid #3a4b61;border-radius:7px;padding:7px}@media(max-width:720px){.ci-position-edit-row{grid-template-columns:1fr}.ci-position-edit-row>label{grid-template-columns:1fr 100px}}'
    text = text.replace(css_marker, css_add, 1)

JS.write_text(text, encoding='utf-8')

data = json.loads(REG.read_text(encoding='utf-8'))
entry = next(x for x in data['scripts'] if x.get('id') == 'company-intelligence')
entry['version'] = VERSION
entry['release'] = {'version': VERSION, 'date': DATE, 'notes': [
    'Adds generic Company Positions requirement detection for every company type instead of relying on Pub-only position names.',
    'Adds an EDIT POSITIONS editor for manually saving Primary and Secondary work-stat requirements when Torn does not expose them.',
    'Uses requirement priority API → Company Positions → manual values → coworker estimate, labels estimated matches honestly, and clears saved position requirements automatically when the player changes company.'
]}
REG.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

doc = DOC.read_text(encoding='utf-8')
doc = re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)', rf'\g<1>{VERSION}\g<2>', doc, count=1)
entry_md = f'''### v{VERSION} — Generic company position requirements and manual editor\n- Detects Primary and Secondary requirements from Company Positions for arbitrary company types instead of only Pub roles.\n- Adds **EDIT POSITIONS** in the Position tab so missing requirements can be entered and saved manually per current company.\n- Prioritizes Torn API requirements, then Company Positions, then manual values, and uses coworker medians only as the final estimated fallback.\n- Clears saved position requirements automatically when the player changes company so values cannot leak between different companies.\n- Labels coworker-only results as **ESTIMATED MATCH** rather than claiming guaranteed qualification.\n\n'''
if f'### v{VERSION} ' not in doc:
    idx = doc.find('## Release history')
    if idx < 0: idx = doc.find('## Changelog')
    if idx < 0: raise SystemExit('release history heading not found')
    line_end = doc.find('\n', idx) + 1
    doc = doc[:line_end] + '\n' + entry_md + doc[line_end:]
DOC.write_text(doc, encoding='utf-8')
