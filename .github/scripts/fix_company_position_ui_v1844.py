from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
JS = ROOT / 'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG = ROOT / 'scripts.json'
DOC = ROOT / 'greasyfork/Company-Intelligence.md'
VERSION = '1.8.44'
DATE = '2026-10-02'

text = JS.read_text(encoding='utf-8')
text = re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', text, count=1)
text = re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'", f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'", text, count=1)

# Replace the overly broad generic Company Positions scraper with a conservative one.
start = text.find('function cleanPositionName(raw){')
end = text.find('\nfunction apiCompanyPositions(){', start)
if start < 0 or end < 0:
    raise SystemExit('Company Positions scraper block not found')

scraper = r'''function cleanPositionName(raw){
 let t=String(raw||'').replace(/\s+/g,' ').trim();
 if(!t||t.length>80||/^(?:primary|secondary)(?:\s+stat|\s+gains?)?$/i.test(t)||/company positions/i.test(t))return'';
 return t;
}
function sanitizePositionReqCache(){
 const c=positionReqCache(),valid=new Set(detectedPositionNames().map(x=>String(x).toLowerCase())),next={};
 for(const [name,row] of Object.entries(c.rows||{})){
  const n=cleanPositionName(name);
  if(!n)continue;
  if(/^(?:primary|secondary)(?:\s+stat|\s+gains?)?$/i.test(n))continue;
  // Preserve manual entries and rows tied to an actually detected company position.
  if(row?.manual||valid.has(n.toLowerCase()))next[n]=row;
 }
 if(JSON.stringify(next)!==JSON.stringify(c.rows||{})){c.all[c.key]=next;set(KEY.positionReqs,c.all)}
 return next;
}
function scrapePositionRequirements(){
 if(document.hidden||!/(?:companies|joblist)\.php/i.test(location.pathname))return [];
 const pageText=document.body?.innerText||'';if(!/Company Positions/i.test(pageText))return [];
 const known=detectedPositionNames().filter(n=>cleanPositionName(n));
 if(!known.length)return [];
 const pagePrimary=/Primary Stat/i.test(pageText)&&!/Secondary Stat/i.test(pageText);
 const pageSecondary=/Secondary Stat/i.test(pageText)&&!/Primary Stat/i.test(pageText);
 const out=[];
 for(const name of known){
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const candidates=[...document.querySelectorAll('tr,li,[class*=position],[class*=role],div')].filter(el=>{
   if(el.closest('#ci-root'))return false;
   const t=String(el.innerText||'').replace(/\s+/g,' ').trim();
   return t.length>3&&t.length<420&&new RegExp('(^|\\b)'+escaped+'(\\b|$)','i').test(t)&&/\b(?:MAN|INT|END)\b/i.test(t)&&/[\d,]+/.test(t);
  }).sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length);
  const el=candidates[0];if(!el)continue;
  const t=String(el.innerText||'').replace(/\s+/g,' ').trim();
  const pairs=[...t.matchAll(/([\d,]+)\s*(MAN|INT|END)\b/ig)];if(!pairs.length)continue;
  const row={name,source:'Company Positions'};
  if(pairs.length>=2&&!pagePrimary&&!pageSecondary){
   row.primary={stat:statKey(pairs[0][2]),value:num(pairs[0][1].replace(/,/g,''))};
   row.secondary={stat:statKey(pairs[1][2]),value:num(pairs[1][1].replace(/,/g,''))};
  }else{
   const mode=pagePrimary?'primary':pageSecondary?'secondary':null;
   if(!mode)continue;
   row[mode]={stat:statKey(pairs[0][2]),value:num(pairs[0][1].replace(/,/g,''))};
  }
  if(row.primary?.stat||row.secondary?.stat)out.push(row);
 }
 if(out.length)savePositionReqRows(out);
 sanitizePositionReqCache();
 return out;
}'''
text = text[:start] + scraper + text[end:]

# Make cached rows self-clean before use.
text = text.replace(
    "function cachedOfficialPositions(){\n scrapePositionRequirements();const c=positionReqCache().rows,seed=seededCompanyPositions()",
    "function cachedOfficialPositions(){\n scrapePositionRequirements();const c=sanitizePositionReqCache(),seed=seededCompanyPositions()",
    1
)

# Restore the cleaner v1.8.42-style Position UI while keeping the manual editor.
pos_start = text.find('function employeePosition(){')
pos_end = text.find('\nfunction employeeTrains(){', pos_start)
if pos_start < 0 or pos_end < 0:
    raise SystemExit('employeePosition block not found')

new_pos = r'''function employeePosition(){
 const w=work(),a=advisor(w),observed=!a.length?observedPositionAdvisor(w):[],rows=a.length?a:observed,best=rows[0],current=currentPosition(),eff=currentEffectiveness(),daysHere=ownDaysInCompany(),estimated=!a.length;
 const currentCard=card('Current Position',kv('Position',current?esc(current):'Not returned by Torn API')+kv('Effectiveness',eff==null?'Not exposed yet':fmt(eff))+kv('Days in company',daysHere||'Not returned'));
 const edit=`<div class="ci-actions ci-position-actions"><button class="ci-btn" data-act="edit-positions">⚙ EDIT POSITION DATA</button></div>`;
 if(!rows.length)return `<div class="ci-grid">${currentCard}${card('Best Position Advisor',empty('No reliable position requirements are available yet.')+`<p class="ci-note">Open Company Positions so the script can read known positions, or use EDIT POSITION DATA to enter Primary and Secondary manually.</p>${edit}<p class="ci-note">Current stats: MAN ${fmt(w.manual)} · INT ${fmt(w.intelligence)} · END ${fmt(w.endurance)}</p>`)}</div>`;
 const source=a.length?(a[0]?.source||'Official company position requirements'):'Estimated from real coworkers in each position';
 const recommendation=best?card('Recommended Position',kv('Best match',esc(best.name))+kv(estimated?'Estimated fit':'Fit',best.fit+'%')+kv('Status',estimated?badge('ESTIMATED MATCH','warn'):badge(best.qualified?'QUALIFIED':'BUILD STATS',best.qualified?'good':'warn'))+`<p class="ci-note">${esc(source)}${best.estimated?` · ${best.sample} employee sample${best.sample===1?'':'s'}`:''}.</p>${edit}`):'';
 const table=card('Best Position Advisor',`<div class="ci-tablewrap ci-mobile-cards ci-position-table"><table><thead><tr><th>Position</th><th>Fit</th><th>Primary</th><th>Secondary</th><th>Status</th></tr></thead><tbody>${rows.map(p=>`<tr><td class="ci-person-cell" data-label="Position"><b>${esc(p.name)}${p.name===current?' · CURRENT':''}</b></td><td data-label="Fit">${p.fit}%</td><td data-label="Primary">${p.primary?fmt(p.primary.value)+' '+statShort(p.primary.stat):'—'}</td><td data-label="Secondary">${p.secondary?fmt(p.secondary.value)+' '+statShort(p.secondary.stat):'—'}</td><td data-label="Status">${p.estimated?badge('ESTIMATED','warn'):badge(p.qualified?'QUALIFIED':'BUILD STATS',p.qualified?'good':'warn')}</td></tr>`).join('')}</tbody></table></div><p class="ci-note">${esc(source)}. Priority: Torn API → Company Positions → manual values → coworker estimate.</p>`);
 return `<div class="ci-grid">${currentCard}${recommendation}${table}</div>`;
}'''
text = text[:pos_start] + new_pos + text[pos_end:]

# Small unobtrusive editor button styling.
if '.ci-position-actions{' not in text:
    text = text.replace('.ci-actions{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:9px}', '.ci-actions{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:9px}.ci-position-actions{margin:9px 0 0}.ci-position-actions .ci-btn{padding:6px 9px;font-size:10px}', 1)

JS.write_text(text, encoding='utf-8')

reg = json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts', []):
    if item.get('id') == 'company-intelligence':
        item['version'] = VERSION
        item['release'] = {
            'version': VERSION,
            'date': DATE,
            'notes': [
                'Restores the cleaner Position Advisor layout used before v1.8.43 while keeping the manual position-data editor.',
                'Prevents Company Positions headings such as Primary Gains and Secondary Gains from being misread as job positions.',
                'Only imports Company Positions data when it can be tied to a real detected company position, and removes poisoned cached rows.'
            ]
        }
        break
REG.write_text(json.dumps(reg, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

doc = DOC.read_text(encoding='utf-8')
doc = re.sub(r'## Current version\n\*\*v[^*]+\*\*', f'## Current version\n**v{VERSION}**', doc, count=1)
doc = re.sub(r'- Canonical version: \*\*v[^*]+\*\*', f'- Canonical version: **v{VERSION}**', doc, count=1)
release = f'''## Current release note\n\n**v{VERSION} — Position Advisor UI restoration and safe company-position parsing**\n- Restores the cleaner Position Advisor layout used before v1.8.43 while keeping the manual position-data editor.\n- Prevents headings such as `Primary Gains` and `Secondary Gains` from being interpreted as company positions.\n- Imports Company Positions requirements only when they match a real detected company position and removes invalid cached rows.\n'''
doc = re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)', release.rstrip()+'\n', doc, count=1, flags=re.S)
entry = f'''\n### v{VERSION} — Position Advisor UI restoration and safe parsing\n- Restores the compact Position Advisor presentation from the previous stable layout.\n- Keeps `EDIT POSITION DATA` as a small secondary action instead of changing the whole Position screen.\n- Stops generic headings such as `Primary Gains` and `Secondary Gains` from becoming fake positions.\n- Cleans invalid cached position rows and only accepts scraped requirements tied to a real detected company position.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc:
    doc=doc.replace(marker, marker+entry, 1)
DOC.write_text(doc, encoding='utf-8')

print(f'Company Intelligence v{VERSION} UI/scraper recovery applied or already current.')
