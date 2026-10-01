from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
JS = ROOT / 'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG = ROOT / 'scripts.json'
DOC = ROOT / 'greasyfork/Company-Intelligence.md'
VERSION = '1.8.45'
DATE = '2026-10-02'

text = JS.read_text(encoding='utf-8')
text = re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', text, count=1)
text = re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'", f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'", text, count=1)

old_detect = r'''function detectedPositionNames(){
 const names=new Set();
 for(const e of employees().map(normEmp))if(e.position)names.add(e.position);
 const current=currentPosition();if(current&&!/not currently|not returned/i.test(current))names.add(current);
 Object.keys(positionReqCache().rows).forEach(x=>names.add(x));
 let raw=first(profile(),['positions','company_positions','type.positions'],[]);
 if(Array.isArray(raw))raw.forEach(p=>{const n=positionLabel(p?.name||p?.position);if(n)names.add(n)});
 else if(raw&&typeof raw==='object')Object.keys(raw).forEach(n=>{if(n)names.add(n)});
 return [...names].filter(Boolean).sort((a,b)=>a.localeCompare(b));
}'''

new_detect = r'''function validPositionName(raw){
 const n=cleanPositionName(raw);
 if(!n)return'';
 if(/^(?:position|positions|company positions|primary|secondary|primary gains?|secondary gains?|primary stat|secondary stat|gains?|requirements?|employees?|vacant|occupied|apply|hire|fire|save|cancel)$/i.test(n))return'';
 if(/\b(?:MAN|INT|END)\b/i.test(n)||/^\d/.test(n))return'';
 return n;
}
function rememberDetectedPositionNames(names){
 const clean=[...new Set((names||[]).map(validPositionName).filter(Boolean))];
 if(!clean.length)return clean;
 const c=positionReqCache();
 for(const name of clean){const old=c.rows[name]||{};c.rows[name]={...old,name,detected:true,source:old.source||'Company Positions',updated:old.updated||now()}}
 c.all[c.key]=c.rows;set(KEY.positionReqs,c.all);return clean;
}
function discoverCompanyPositionNamesFromPage(){
 if(document.hidden||!/(?:companies|joblist)\.php/i.test(location.pathname))return[];
 const bodyText=document.body?.innerText||'';if(!/Company Positions/i.test(bodyText))return[];
 const found=new Set();
 const add=value=>{const n=validPositionName(value);if(n)found.add(n)};
 // Prefer explicit Torn attributes/classes where available.
 document.querySelectorAll('[data-position-name],[data-position],[data-role-name],[class*=positionName],[class*=position-name],[class*=roleName],[class*=role-name]').forEach(el=>{
  add(el.getAttribute?.('data-position-name')||el.getAttribute?.('data-position')||el.getAttribute?.('data-role-name')||el.textContent);
 });
 // Discover names from the smallest Company Positions row/card that also contains stat information.
 const containers=[...document.querySelectorAll('tr,li,[class*=position],[class*=role],[class*=job]')].filter(el=>!el.closest('#ci-root,#ci-position-editor'));
 for(const box of containers){
  const full=String(box.innerText||'').replace(/\s+/g,' ').trim();
  if(!full||full.length>500)continue;
  if(!/\b(?:MAN|INT|END)\b/i.test(full)&&!/Primary\s+Gains?|Secondary\s+Gains?/i.test(full))continue;
  const pieces=[...box.querySelectorAll('h1,h2,h3,h4,h5,strong,b,label,span,div')]
   .map(el=>String(el.textContent||'').replace(/\s+/g,' ').trim())
   .filter(t=>t&&t.length<=80)
   .sort((a,b)=>a.length-b.length);
  for(const piece of pieces){const n=validPositionName(piece);if(n){add(n);break}}
 }
 // Fallback: use short lines immediately before stat/gain lines, while excluding headings.
 const lines=String(bodyText).split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
 for(let i=0;i<lines.length;i++){
  if(!/\b(?:MAN|INT|END)\b/i.test(lines[i])&&!/(?:Primary|Secondary)\s+Gains?/i.test(lines[i]))continue;
  for(let j=i-1;j>=Math.max(0,i-3);j--){const n=validPositionName(lines[j]);if(n){add(n);break}}
 }
 return rememberDetectedPositionNames([...found]);
}
function detectedPositionNames(){
 const names=new Set();
 for(const e of employees().map(normEmp))if(e.position)names.add(e.position);
 const current=currentPosition();if(current&&!/not currently|not returned/i.test(current))names.add(current);
 Object.keys(positionReqCache().rows).forEach(x=>names.add(x));
 let raw=first(profile(),['positions','company_positions','type.positions'],[]);
 if(Array.isArray(raw))raw.forEach(p=>{const n=positionLabel(p?.name||p?.position);if(n)names.add(n)});
 else if(raw&&typeof raw==='object')Object.keys(raw).forEach(n=>{if(n)names.add(n)});
 discoverCompanyPositionNamesFromPage().forEach(n=>names.add(n));
 return [...names].map(validPositionName).filter(Boolean).sort((a,b)=>a.localeCompare(b));
}'''

if old_detect not in text:
    raise SystemExit('detectedPositionNames block not found')
text = text.replace(old_detect, new_detect, 1)

# Do not turn Primary/Secondary Gains into requirements. They are gains, not minimum requirements.
scrape_start = text.find('function scrapePositionRequirements(){')
scrape_end = text.find('\nfunction apiCompanyPositions(){', scrape_start)
if scrape_start < 0 or scrape_end < 0:
    raise SystemExit('scraper block not found')
new_scraper = r'''function scrapePositionRequirements(){
 if(document.hidden||!/(?:companies|joblist)\.php/i.test(location.pathname))return [];
 const pageText=document.body?.innerText||'';if(!/Company Positions/i.test(pageText))return [];
 discoverCompanyPositionNamesFromPage();
 const known=detectedPositionNames().filter(validPositionName);
 if(!known.length)return [];
 // Only parse explicit requirement/stat labels. Do not interpret Primary/Secondary Gains as requirements.
 const hasPrimaryStat=/Primary\s+Stat/i.test(pageText),hasSecondaryStat=/Secondary\s+Stat/i.test(pageText);
 if(!hasPrimaryStat&&!hasSecondaryStat){sanitizePositionReqCache();return []}
 const out=[];
 for(const name of known){
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const candidates=[...document.querySelectorAll('tr,li,[class*=position],[class*=role],[class*=job],div')].filter(el=>{
   if(el.closest('#ci-root,#ci-position-editor'))return false;
   const t=String(el.innerText||'').replace(/\s+/g,' ').trim();
   return t.length>3&&t.length<500&&new RegExp('(^|\\b)'+escaped+'(\\b|$)','i').test(t)&&/Primary\s+Stat|Secondary\s+Stat/i.test(t)&&/\b(?:MAN|INT|END)\b/i.test(t);
  }).sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length);
  const el=candidates[0];if(!el)continue;
  const t=String(el.innerText||'').replace(/\s+/g,' ').trim();
  const row={name,source:'Company Positions'};
  const pm=t.match(/Primary\s+Stat[^\d]*(?:([\d,]+)\s*)?(MAN|INT|END)\b/i);
  const sm=t.match(/Secondary\s+Stat[^\d]*(?:([\d,]+)\s*)?(MAN|INT|END)\b/i);
  if(pm)row.primary={stat:statKey(pm[2]),value:num((pm[1]||'0').replace(/,/g,''))};
  if(sm)row.secondary={stat:statKey(sm[2]),value:num((sm[1]||'0').replace(/,/g,''))};
  if(row.primary?.stat||row.secondary?.stat)out.push(row);
 }
 if(out.length)savePositionReqRows(out);
 sanitizePositionReqCache();return out;
}'''
text = text[:scrape_start] + new_scraper + text[scrape_end:]

# Preserve detected empty position rows so EDIT POSITION DATA can list every role.
text = text.replace(
    "if(row?.manual||valid.has(n.toLowerCase()))next[n]=row;",
    "if(row?.manual||row?.detected||valid.has(n.toLowerCase()))next[n]=row;",
    1
)

# Make the editor a true top-layer modal above Company Intelligence/TornPDA.
if '#ci-position-editor{' not in text:
    css_anchor='.ci-dialogback{position:fixed;inset:0;z-index:1000000;background:#000b;display:flex;align-items:center;justify-content:center;padding:14px}'
    css_repl=css_anchor+'#ci-position-editor{position:fixed!important;inset:0!important;z-index:2147483647!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:12px!important;background:rgba(0,0,0,.78)!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;box-sizing:border-box!important}#ci-position-editor>.ci-dialog{position:relative!important;z-index:2147483647!important;width:min(720px,calc(100vw - 24px))!important;max-width:720px!important;max-height:calc(100dvh - 24px)!important;overflow:auto!important;margin:0!important;box-sizing:border-box!important}'
    if css_anchor not in text: raise SystemExit('dialog CSS anchor not found')
    text=text.replace(css_anchor,css_repl,1)

# Add a clearer note in editor and force a fresh discovery before opening it.
text=text.replace(
    "function openPositionRequirementsEditor(){\n const names=detectedPositionNames();",
    "function openPositionRequirementsEditor(){\n discoverCompanyPositionNamesFromPage();\n const names=detectedPositionNames();",
    1
)
text=text.replace(
    "No company positions detected yet. Refresh Company Intelligence or open Company Positions once, then try again.",
    "No company positions detected yet. Open the Torn Company Positions page once, then press EDIT POSITION DATA again.",
    1
)
text=text.replace(
    "API data has priority. Manual values are used only when Torn does not expose requirements and are cleared automatically when you change company.",
    "All detected company roles are listed here. API data has priority. Manual Primary/Secondary values are saved only for this company and are cleared automatically when you change company.",
    1
)

JS.write_text(text, encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='company-intelligence':
        item['version']=VERSION
        item['release']={'version':VERSION,'date':DATE,'notes':[
            'Discovers and remembers all real company role names from Company Positions, including unoccupied positions, instead of only positions held by current employees.',
            'Stops Primary Gains and Secondary Gains values from being treated as work-stat requirements.',
            'Forces EDIT POSITION DATA into a top-layer modal above Company Intelligence and TornPDA, with all detected roles available for manual Primary/Secondary entry.'
        ]}
        break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — Complete position discovery and top-layer editor**\n- Discovers and remembers real role names from the Company Positions page, including currently unoccupied roles.\n- Keeps Primary/Secondary Gains separate from position requirements so gain values are never used as qualification thresholds.\n- Opens `EDIT POSITION DATA` as a true top-layer modal above Company Intelligence/TornPDA and lists every detected role for manual data entry.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — Complete position discovery and editor layering\n- Learns all actual company role names from Company Positions and remembers them for the current company, including vacant roles.\n- Excludes headings such as `Primary Gains` / `Secondary Gains` and does not treat gain numbers as minimum work-stat requirements.\n- Keeps the clean v1.8.42-style Position Advisor while making `EDIT POSITION DATA` a topmost modal above the script.\n- Keeps saved manual position data isolated to the current company and clears it on company change.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc: doc=doc.replace(marker,marker+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} complete position discovery/editor overlay applied or already current.')
