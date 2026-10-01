from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork/Company-Intelligence.md'
VERSION='1.8.46'
DATE='2026-10-02'

text=JS.read_text(encoding='utf-8')
text=re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', text, count=1)
text=re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'", f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'", text, count=1)

start=text.find('function validPositionName(raw){')
end=text.find('\nfunction discoverCompanyPositionNamesFromPage(){', start)
if start<0 or end<0:
    raise SystemExit('position name helper block not found')

block=r'''function normalizedPositionDisplayName(raw){
 let n=cleanPositionName(raw);
 if(!n)return'';
 // Torn can append slot counts, icons or decorative markers to the visible role label.
 // Strip those presentation-only suffixes before storing/deduplicating the role.
 let previous='';
 while(n&&n!==previous){
  previous=n;
  n=n.replace(/\s+(?:\d+|[^A-Za-z0-9&'()\/-]+)$/g,'').trim();
 }
 return n;
}
function positionNameKey(raw){
 return normalizedPositionDisplayName(raw).toLowerCase().replace(/[^a-z0-9]+/g,'');
}
function validPositionName(raw){
 const n=normalizedPositionDisplayName(raw);
 if(!n)return'';
 if(/^(?:position|positions|company positions|primary|secondary|primary gains?|secondary gains?|primary stat|secondary stat|gains?|requirements?|employees?|vacant|occupied|apply|hire|fire|save|cancel)$/i.test(n))return'';
 if(/\b(?:MAN|INT|END)\b/i.test(n)||/^\d/.test(n))return'';
 return n;
}
function dedupePositionReqCache(){
 const c=positionReqCache(),groups=new Map();
 for(const [rawName,row] of Object.entries(c.rows||{})){
  const name=validPositionName(rawName||row?.name);if(!name)continue;
  const key=positionNameKey(name);if(!key)continue;
  const old=groups.get(key);
  if(!old){groups.set(key,{name,row:{...row,name}});continue}
  const oldName=old.name;
  // Prefer the shortest clean label (e.g. "Armorer" over "Armorer 3" / icon variants).
  const chosen=name.length<oldName.length?name:oldName;
  const manualOld=!!old.row?.manual,manualNew=!!row?.manual;
  const preferred=manualNew&&!manualOld?row:old.row;
  const fallback=preferred===row?old.row:row;
  groups.set(key,{name:chosen,row:{...fallback,...preferred,name:chosen,primary:preferred?.primary||fallback?.primary||null,secondary:preferred?.secondary||fallback?.secondary||null,detected:!!(preferred?.detected||fallback?.detected),manual:!!(preferred?.manual||fallback?.manual),updated:Math.max(Number(preferred?.updated||0),Number(fallback?.updated||0))}});
 }
 const next={};for(const {name,row} of groups.values())next[name]=row;
 if(JSON.stringify(next)!==JSON.stringify(c.rows||{})){c.all[c.key]=next;set(KEY.positionReqs,c.all)}
 return next;
}
function rememberDetectedPositionNames(names){
 const byKey=new Map();
 for(const raw of names||[]){const name=validPositionName(raw),key=positionNameKey(name);if(!name||!key)continue;const old=byKey.get(key);if(!old||name.length<old.length)byKey.set(key,name)}
 const clean=[...byKey.values()];if(!clean.length)return clean;
 const c=positionReqCache();
 for(const name of clean){
  const key=positionNameKey(name);let existingName=Object.keys(c.rows).find(x=>positionNameKey(x)===key);const old=existingName?c.rows[existingName]:{};
  if(existingName&&existingName!==name)delete c.rows[existingName];
  c.rows[name]={...old,name,detected:true,source:old.source||'Company Positions',updated:old.updated||now()};
 }
 c.all[c.key]=c.rows;set(KEY.positionReqs,c.all);dedupePositionReqCache();return clean;
}'''
text=text[:start]+block+text[end:]

# Replace detectedPositionNames with canonical-key dedupe across employees, cache, API and page discovery.
start=text.find('function detectedPositionNames(){')
end=text.find('\nfunction cleanPositionName(raw){', start)
if start<0 or end<0:
    raise SystemExit('detectedPositionNames block not found')
new_detect=r'''function detectedPositionNames(){
 dedupePositionReqCache();
 const names=new Map();
 const add=raw=>{const n=validPositionName(raw),k=positionNameKey(n);if(!n||!k)return;const old=names.get(k);if(!old||n.length<old.length)names.set(k,n)};
 for(const e of employees().map(normEmp))add(e.position);
 const current=currentPosition();if(current&&!/not currently|not returned/i.test(current))add(current);
 Object.keys(positionReqCache().rows).forEach(add);
 let raw=first(profile(),['positions','company_positions','type.positions'],[]);
 if(Array.isArray(raw))raw.forEach(p=>add(positionLabel(p?.name||p?.position)));
 else if(raw&&typeof raw==='object')Object.keys(raw).forEach(add);
 discoverCompanyPositionNamesFromPage().forEach(add);
 return [...names.values()].sort((a,b)=>a.localeCompare(b));
}'''
text=text[:start]+new_detect+text[end:]

# sanitize cache should start from canonicalized rows.
text=text.replace("function sanitizePositionReqCache(){\n const c=positionReqCache(),valid=", "function sanitizePositionReqCache(){\n dedupePositionReqCache();\n const c=positionReqCache(),valid=",1)

JS.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='company-intelligence':
        item['version']=VERSION
        item['release']={'version':VERSION,'date':DATE,'notes':[
            'Deduplicates Company Positions by a canonical role name so the editor no longer shows the same role twice.',
            'Strips Torn presentation-only suffixes such as slot counts and decorative icons from discovered position names.',
            'Merges duplicate cached role rows while preserving manual Primary/Secondary values and detected company-position data.'
        ]}
        break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — Company Position duplicate cleanup**\n- Deduplicates discovered company roles using a canonical role-name key.\n- Removes presentation-only slot counts and decorative suffixes from Torn position labels.\n- Merges duplicate cached rows while preserving manual Primary/Secondary values.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — Company Position duplicate cleanup\n- Deduplicates the Position Data editor by canonical role name.\n- Normalizes role labels before saving so one Torn role cannot appear twice because of icons or slot-count suffixes.\n- Merges previously duplicated cached rows and keeps the most useful Primary/Secondary data.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc: doc=doc.replace(marker,marker+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} position dedupe applied.')
