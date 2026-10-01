from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork/Company-Intelligence.md'
VERSION='1.8.47'
DATE='2026-10-02'

text=JS.read_text(encoding='utf-8')
text=re.sub(r'(?m)^(//\s*@version\s+)\S+',rf'\g<1>{VERSION}',text,count=1)
text=re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'",f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'",text,count=1)
if '// @connect      wiki.torn.com' not in text:
    text=text.replace('// @connect      api.torn.com','// @connect      api.torn.com\n// @connect      wiki.torn.com',1)
text=text.replace("ownEffectiveness:APP.key+':own_effectiveness', positionReqs:APP.key+':position_requirements'","ownEffectiveness:APP.key+':own_effectiveness', positionReqs:APP.key+':position_requirements', companyCatalog:APP.key+':company_catalog'",1)

# Replace the fragile DOM role-name discovery with a structured official-company catalogue.
start=text.find('function normalizedPositionDisplayName(raw){')
end=text.find('\nfunction fit(stats,p){',start)
if start<0 or end<0:
    raise SystemExit('company position block not found')

block=r'''function normalizedPositionDisplayName(raw){
 return cleanPositionName(raw);
}
function positionNameKey(raw){return normalizedPositionDisplayName(raw).toLowerCase().replace(/[^a-z0-9]+/g,'')}
function validPositionName(raw){
 const n=normalizedPositionDisplayName(raw);if(!n)return'';
 if(/^(?:position|positions|company positions|primary|secondary|primary gains?|secondary gains?|primary stat|secondary stat|gains?|requirements?|employees?|vacant|occupied|apply|hire|fire|save|cancel)\s*[:\-–—]*$/i.test(n))return'';
 if(/^(?:primary|secondary)\b/i.test(n)||/\b(?:gains?|stat|requirements?)\b/i.test(n))return'';
 if(/\b(?:MAN|INT|END)\b/i.test(n)||/^\d/.test(n))return'';
 return n;
}
function officialCatalogCache(){
 const c=get(KEY.companyCatalog,null);return c&&typeof c==='object'?c:null;
}
function wikiText(url){
 return new Promise((resolve,reject)=>{
  let done=false;const finish=(fn,v)=>{if(done)return;done=true;fn(v)};
  const parse=r=>finish(resolve,String(r?.responseText??r?.response??''));
  try{
   const x=GM_xmlhttpRequest({method:'GET',url,timeout:15000,headers:{Accept:'text/plain'},onload:parse,onerror:()=>finish(reject,new Error('Official company catalogue request failed')),ontimeout:()=>finish(reject,new Error('Official company catalogue request timed out'))});
   if(x&&typeof x.then==='function')x.then(parse).catch(e=>finish(reject,e));
  }catch(e){fetch(url).then(r=>r.text()).then(t=>finish(resolve,t)).catch(err=>finish(reject,err))}
 })
}
function parseOfficialCompanyModule(raw){
 const src=String(raw||'');
 const m=src.match(/mw\.text\.jsonDecode\(\"([\s\S]*)\"\)\s*$/);
 if(!m)throw new Error('Official company catalogue format was not recognized');
 let jsonText;try{jsonText=JSON.parse('"'+m[1]+'"')}catch{throw new Error('Official company catalogue could not be decoded')}
 const data=JSON.parse(jsonText);if(!data?.companies||typeof data.companies!=='object')throw new Error('Official company catalogue has no companies data');return data.companies;
}
async function ensureOfficialCompanyCatalog(force=false){
 const cached=officialCatalogCache();
 if(!force&&cached?.companies&&now()-num(cached.updated)<7*86400000)return cached.companies;
 try{
  const raw=await wikiText('https://wiki.torn.com/wiki/Module:Company_Data?action=raw');
  const companies=parseOfficialCompanyModule(raw);set(KEY.companyCatalog,{updated:now(),companies});return companies;
 }catch(e){
  if(cached?.companies)return cached.companies;
  console.warn('[SakaLuX Company] official catalogue unavailable',e);return null;
 }
}
function companyTypeKey(v){return String(v||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'')}
function currentOfficialCompanyType(companies=officialCatalogCache()?.companies){
 if(!companies)return null;const wanted=companyTypeKey(meta().type);if(!wanted||wanted==='unknown')return null;
 let fallback=null;
 for(const [id,c] of Object.entries(companies)){
  const key=companyTypeKey(c?.name);if(key===wanted)return{id,c};
  if(key&&wanted&&(key.includes(wanted)||wanted.includes(key)))fallback={id,c};
 }
 return fallback;
}
function officialCompanyPositions(){
 const match=currentOfficialCompanyType();if(!match?.c?.positions)return[];
 const rows=[];
 for(const [name,p] of Object.entries(match.c.positions)){
  const req={manual:num(p?.man_required),intelligence:num(p?.int_required),endurance:num(p?.end_required)};
  const active=[['manual',req.manual],['intelligence',req.intelligence],['endurance',req.endurance]].filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  const primary=active[0]?{stat:active[0][0],value:active[0][1]}:null,secondary=active[1]?{stat:active[1][0],value:active[1][1]}:null;
  rows.push({id:name,name,req,primary,secondary,gains:{manual:num(p?.man_gain),intelligence:num(p?.int_gain),endurance:num(p?.end_gain)},official:true,source:'Torn official company catalogue'});
 }
 return rows;
}
function cleanupPositionCacheAgainstOfficial(){
 const official=officialCompanyPositions(),c=positionReqCache();if(!official.length)return c.rows||{};
 const byKey=new Map(official.map(r=>[positionNameKey(r.name),r.name])),next={};
 for(const [raw,row] of Object.entries(c.rows||{})){
  const key=positionNameKey(raw||row?.name),canonical=byKey.get(key);if(!canonical)continue;
  if(row?.manual)next[canonical]={...row,name:canonical};
 }
 if(JSON.stringify(next)!==JSON.stringify(c.rows||{})){c.all[c.key]=next;set(KEY.positionReqs,c.all)}
 return next;
}
function detectedPositionNames(){
 const official=officialCompanyPositions();if(official.length){cleanupPositionCacheAgainstOfficial();return official.map(x=>x.name).sort((a,b)=>a.localeCompare(b))}
 const names=new Map(),add=raw=>{const n=validPositionName(raw),k=positionNameKey(n);if(n&&k&&!names.has(k))names.set(k,n)};
 for(const e of employees().map(normEmp))add(e.position);add(currentPosition());
 for(const [n,row] of Object.entries(positionReqCache().rows||{}))if(row?.manual)add(n);
 return [...names.values()].sort((a,b)=>a.localeCompare(b));
}
function scrapePositionRequirements(){return []}
function apiCompanyPositions(){
 let x=first(profile(),['positions','company_positions','type.positions'],[]);
 if(!Array.isArray(x)&&x&&typeof x==='object')x=Object.entries(x).map(([name,v])=>({name,...v}));if(!Array.isArray(x))return[];
 return x.map((p,i)=>{const r=p.requirements||p.required_stats||p.stats||{},req={manual:num(first(r,['manual_labor','manual','man'],first(p,['manual_labor_required'],0))),intelligence:num(first(r,['intelligence','int'],first(p,['intelligence_required'],0))),endurance:num(first(r,['endurance','end'],first(p,['endurance_required'],0)))},active=Object.entries(req).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]),primary=p.primary?.stat?{stat:statKey(p.primary.stat),value:num(p.primary.value)}:(active[0]?{stat:active[0][0],value:active[0][1]}:null),secondary=p.secondary?.stat?{stat:statKey(p.secondary.stat),value:num(p.secondary.value)}:(active[1]?{stat:active[1][0],value:active[1][1]}:null);return{id:p.id||p.position_id||i,name:positionLabel(p.name||p.position)||`Position ${i+1}`,req,gains:{manual:0,intelligence:0,endurance:0},primary,secondary,official:true,source:'Torn API'}}).filter(p=>Object.values(p.req).some(v=>v>0)||p.primary||p.secondary)
}
function manualPositionRows(){
 const official=officialCompanyPositions(),officialMap=new Map(official.map(x=>[positionNameKey(x.name),x.name]));const out=[];
 for(const [raw,row] of Object.entries(positionReqCache().rows||{})){
  if(!row?.manual)continue;const canonical=officialMap.get(positionNameKey(raw))||validPositionName(raw);if(!canonical)continue;
  const primary=row.primary||null,secondary=row.secondary||null;if(!primary&&!secondary)continue;
  out.push({name:canonical,primary,secondary,req:reqObj(primary,secondary),gains:{manual:0,intelligence:0,endurance:0},official:true,source:'Manual override'});
 }
 return out;
}
function positions(){
 const apiRows=apiCompanyPositions();if(apiRows.length)return apiRows;
 const official=officialCompanyPositions();if(official.length){
  const overrides=new Map(manualPositionRows().map(x=>[positionNameKey(x.name),x]));
  return official.map(p=>{const m=overrides.get(positionNameKey(p.name));return m?{...p,primary:m.primary||p.primary,secondary:m.secondary||p.secondary,req:reqObj(m.primary||p.primary,m.secondary||p.secondary),source:'Manual override'}:p});
 }
 return manualPositionRows();
}
async function openPositionRequirementsEditor(){
 await ensureOfficialCompanyCatalog();cleanupPositionCacheAgainstOfficial();const names=detectedPositionNames();
 if(!names.length){alert('Official position data is not available yet for this company type. Check the company type/API data and try again.');return}
 const cache=positionReqCache().rows,official=new Map(officialCompanyPositions().map(x=>[positionNameKey(x.name),x])),back=document.createElement('div');back.className='ci-dialogback';back.id='ci-position-editor';
 const statOptions=value=>['','manual','intelligence','endurance'].map(v=>`<option value="${v}" ${v===value?'selected':''}>${v?statShort(v):'— Select —'}</option>`).join('');
 back.innerHTML=`<div class="ci-dialog ci-position-editor"><h3>Company Position Requirements</h3><p class="ci-note">Company: <b>${esc(meta().name)}</b> · Type: <b>${esc(meta().type)}</b>. Positions come from Torn's structured official company catalogue. Change a value only when you want a manual override for this company.</p><div class="ci-position-edit-list">${names.map(name=>{const base=official.get(positionNameKey(name))||{},row=cache[name]?.manual?cache[name]:{},primary=row.primary||base.primary,secondary=row.secondary||base.secondary;return `<div class="ci-position-edit-row" data-pos-row data-name="${esc(name)}"><b>${esc(name)}</b><small>${row.manual?'MANUAL OVERRIDE':'OFFICIAL'}</small><label>Primary<select data-primary-stat>${statOptions(primary?.stat||'')}</select><input data-primary-value type="number" min="0" value="${num(primary?.value)}"></label><label>Secondary<select data-secondary-stat>${statOptions(secondary?.stat||'')}</select><input data-secondary-value type="number" min="0" value="${num(secondary?.value)}"></label></div>`}).join('')}</div><div class="ci-actions"><button class="ci-btn primary" data-save>Save overrides</button><button class="ci-btn" data-reset>Reset to official</button><button class="ci-btn" data-cancel>Cancel</button></div></div>`;
 document.body.appendChild(back);$('[data-cancel]',back).onclick=()=>back.remove();$('[data-reset]',back).onclick=()=>{const c=positionReqCache();c.all[c.key]={};set(KEY.positionReqs,c.all);back.remove();render()};$('[data-save]',back).onclick=()=>{const rows=[];$$('[data-pos-row]',back).forEach(el=>{const name=el.dataset.name,base=official.get(positionNameKey(name))||{},ps=$('[data-primary-stat]',el)?.value,pv=num($('[data-primary-value]',el)?.value),ss=$('[data-secondary-stat]',el)?.value,sv=num($('[data-secondary-value]',el)?.value),bp=base.primary,bs=base.secondary;const changed=(ps||'')!==(bp?.stat||'')||pv!==num(bp?.value)||(ss||'')!==(bs?.stat||'')||sv!==num(bs?.value);if(changed&&((ps&&pv)||(ss&&sv)))rows.push({name,primary:ps&&pv?{stat:ps,value:pv}:null,secondary:ss&&sv?{stat:ss,value:sv}:null,manual:true,source:'Manual override'})});const c=positionReqCache();c.all[c.key]={};set(KEY.positionReqs,c.all);savePositionReqRows(rows);back.remove();render()};
}'''
text=text[:start]+block+text[end:]

# Start loading the structured catalogue after company data has been refreshed, then repaint once.
needle='S.loading=false;S.updated=now();render();'
if needle in text:
    text=text.replace(needle,"S.loading=false;S.updated=now();render();ensureOfficialCompanyCatalog().then(()=>{cleanupPositionCacheAgainstOfficial();if(S.open)render()}).catch(()=>{});",1)
else:
    print('warning: refresh repaint anchor not found')

JS.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='company-intelligence':
        item['version']=VERSION
        item['release']={'version':VERSION,'date':DATE,'notes':[
            'Replaces fragile Company Positions DOM scraping with Torn official structured Company Data for every company type.',
            'Loads exact official role names and MAN/INT/END requirements, so labels such as Primary Gains and Primary Stat can no longer become fake positions.',
            'Keeps per-company manual overrides in EDIT POSITION DATA, adds Reset to official, and removes poisoned scraper cache rows automatically.'
        ]}
        break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — Structured official Company Position catalogue**\n- Replaces heuristic page-text scraping with Torn's structured official Company Data catalogue for all company types.\n- Uses exact official role names and MAN/INT/END requirements, preventing headings such as `Primary Gains`, `Primary Stat`, or `Secondary Gains` from entering the position list.\n- Keeps the top-layer editor as a per-company manual override and adds `Reset to official`; stale scraper-generated rows are purged automatically.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — Structured official Company Position catalogue\n- Stops discovering position names from arbitrary Company Positions DOM text.\n- Loads all roles and their recommended work-stat requirements from Torn's official structured Company Data module.\n- Makes the Position Advisor work for company types beyond Pub without relying on brittle label heuristics.\n- Preserves manual per-company overrides, clears invalid legacy scraper rows, and provides a Reset to official action.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc:doc=doc.replace(marker,marker+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} structured company catalogue applied.')
