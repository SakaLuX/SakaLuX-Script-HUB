from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork/Company-Intelligence.md'
VERSION='1.8.52'
DATE='2026-10-02'

text=JS.read_text(encoding='utf-8')
text=re.sub(r'(?m)^(//\s*@version\s+)\S+',rf'\g<1>{VERSION}',text,count=1)
text=re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'",f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'",text,count=1)

marker='async function ensureOfficialCompanyCatalog(force=false){'
pos=text.find(marker)
if pos<0: raise SystemExit('ensureOfficialCompanyCatalog not found')
helper=r'''function parseRecommendedStatsCell(text){
 const req={manual:0,intelligence:0,endurance:0};
 const src=String(text||'').replace(/,/g,' ');
 const re=/(\d[\d\s.]*)\s*(MAN|INT|END)\b/gi;let m;
 while((m=re.exec(src))){const value=num(String(m[1]).replace(/\D/g,''));const stat=statKey(m[2]);if(stat&&value>0)req[stat]=value}
 return req;
}
function parseStatGainsCell(text){
 const gains={manual:0,intelligence:0,endurance:0};
 const src=String(text||'').replace(/,/g,' ');
 const re=/(\d+(?:\.\d+)?)\s*(MAN|INT|END)\b/gi;let m;
 while((m=re.exec(src))){const value=num(m[1]);const stat=statKey(m[2]);if(stat&&value>0)gains[stat]=value}
 return gains;
}
function parseRenderedCompanyWiki(raw,typeName){
 const html=String(raw||'').trim();if(!html)throw new Error('Rendered company wiki returned an empty response');
 let doc;try{doc=new DOMParser().parseFromString(html,'text/html')}catch{throw new Error('Rendered company wiki HTML could not be parsed')}
 if(!doc)throw new Error('Rendered company wiki HTML could not be parsed');
 const tables=[...doc.querySelectorAll('table')];
 let target=null;
 for(const table of tables){
  const headers=[...table.querySelectorAll('tr:first-child th, thead th')].map(x=>String(x.textContent||'').trim().toLowerCase());
  const joined=headers.join(' | ');
  if(/rank/.test(joined)&&/recommended\s+stats?/.test(joined)&&/stat\s+gains?/.test(joined)){target=table;break}
 }
 if(!target){
  for(const table of tables){
   const txt=String(table.textContent||'').toLowerCase();
   if(txt.includes('recommended stats')&&txt.includes('stat gains')&&txt.includes('rank')){target=table;break}
  }
 }
 if(!target)throw new Error('Rendered company wiki page did not contain a Job Positions table');
 const positions={};
 for(const tr of [...target.querySelectorAll('tr')].slice(1)){
  const cells=[...tr.querySelectorAll('th,td')].map(x=>String(x.textContent||'').replace(/\s+/g,' ').trim());
  if(cells.length<2)continue;
  const name=validPositionName(cells[0]);if(!name)continue;
  const req=parseRecommendedStatsCell(cells[1]);if(!Object.values(req).some(v=>v>0))continue;
  const gains=parseStatGainsCell(cells[2]||'');
  positions[name]={man_required:req.manual,int_required:req.intelligence,end_required:req.endurance,man_gain:gains.manual,int_gain:gains.intelligence,end_gain:gains.endurance,special_ability:cells[3]||'None'};
 }
 if(!Object.keys(positions).length)throw new Error('Rendered company wiki Job Positions table contained no readable position requirements');
 return {'rendered-'+companyTypeKey(typeName):{name:String(typeName||'Unknown company type'),positions}};
}
async function loadRenderedCompanyWiki(typeName){
 const type=String(typeName||'').trim();if(!type||/^unknown$/i.test(type))throw new Error('Company type is unknown');
 const slug=type.replace(/&/g,'and').replace(/\s+/g,'_');
 const urls=[
  'https://wiki.torn.com/wiki/'+encodeURIComponent(slug),
  'https://wiki.torn.com/wiki/'+slug.split('_').map(encodeURIComponent).join('_')
 ];
 let last='';
 for(const url of urls){
  try{const raw=await wikiText(url);return parseRenderedCompanyWiki(raw,type)}catch(e){last=String(e?.message||e||'Rendered company wiki failed')}
 }
 throw new Error(last||'Rendered company wiki fallback failed');
}
'''
text=text[:pos]+helper+text[pos:]

start=text.find('async function ensureOfficialCompanyCatalog(force=false){')
end=text.find('\nfunction companyTypeKey(',start)
if start<0 or end<0: raise SystemExit('catalogue loader block not found')
loader=r'''async function ensureOfficialCompanyCatalog(force=false){
 const cached=officialCatalogCache();
 if(!force&&cached?.companies&&now()-num(cached.updated)<7*86400000){
  S.companyCatalogDiag={state:'cached',error:'',updated:num(cached.updated),source:'cache'};
  return cached.companies;
 }
 const typeName=String(meta().type||'').trim();
 try{
  S.companyCatalogDiag={state:'loading',error:'',updated:num(cached?.updated),source:'network'};
  // TornPDA often receives HTML from wiki API endpoints. Prefer the rendered company page there.
  if(typeof window.PDA_httpGet==='function'||window.flutter_inappwebview?.callHandler){
   try{
    const companies=await loadRenderedCompanyWiki(typeName);const updated=now();set(KEY.companyCatalog,{updated,companies});
    S.companyCatalogDiag={state:'loaded',error:'',updated,source:'Rendered Torn Wiki'};return companies;
   }catch(e){console.warn('[SakaLuX Company] rendered wiki fallback first attempt failed',e)}
  }
  const endpoints=[
   'https://wiki.torn.com/wiki/api.php?action=query&prop=revisions&rvslots=main&rvprop=content&format=json&formatversion=2&titles=Module%3ACompany_Data',
   'https://wiki.torn.com/w/api.php?action=query&prop=revisions&rvslots=main&rvprop=content&format=json&formatversion=2&titles=Module%3ACompany_Data',
   'https://wiki.torn.com/api.php?action=query&prop=revisions&rvslots=main&rvprop=content&format=json&formatversion=2&titles=Module%3ACompany_Data'
  ];
  let lastError='';
  for(const url of endpoints){
   try{
    const raw=await wikiText(url),clean=String(raw||'').replace(/^\uFEFF/,'').trim();
    if(!clean)throw new Error('MediaWiki API returned an empty response');
    if(/^<!doctype|^<html/i.test(clean))throw new Error('MediaWiki API returned HTML instead of JSON');
    let envelope;try{envelope=JSON.parse(clean)}catch(e){throw new Error('MediaWiki API returned invalid JSON: '+String(e?.message||e))}
    const page=envelope?.query?.pages?.[0]||Object.values(envelope?.query?.pages||{})[0],rev=page?.revisions?.[0];
    const source=rev?.slots?.main?.content??rev?.slots?.main?.['*']??rev?.content??rev?.['*'];
    if(!source)throw new Error('MediaWiki API returned no Module:Company_Data source');
    const companies=parseOfficialCompanyModule(source),updated=now();set(KEY.companyCatalog,{updated,companies});
    S.companyCatalogDiag={state:'loaded',error:'',updated,source:'MediaWiki API'};return companies;
   }catch(e){lastError=String(e?.message||e||'Unknown MediaWiki API error')}
  }
  // Final generic fallback: parse the public company page HTML table.
  try{
   const companies=await loadRenderedCompanyWiki(typeName),updated=now();set(KEY.companyCatalog,{updated,companies});
   S.companyCatalogDiag={state:'loaded',error:'',updated,source:'Rendered Torn Wiki'};return companies;
  }catch(e){lastError=String(e?.message||e||lastError)}
  throw new Error(lastError||'All official company catalogue sources failed');
 }catch(e){
  const error=String(e?.message||e||'Unknown catalogue error');
  if(cached?.companies){S.companyCatalogDiag={state:'stale-cache',error,updated:num(cached.updated),source:'cache'};return cached.companies}
  S.companyCatalogDiag={state:'failed',error,updated:0,source:'none'};
  console.warn('[SakaLuX Company] official catalogue unavailable',e);return null;
 }
}'''
text=text[:start]+loader+text[end:]

# expose source in diagnostics
text=text.replace("matchedType:String(match?.c?.name||''),\n  positions:rows.length", "matchedType:String(match?.c?.name||''),\n  source:String(d.source||''),\n  positions:rows.length",1)
text=text.replace("${kv('Matched catalogue type',d.matchedType?esc(d.matchedType):'Not matched')}${kv('Positions loaded',String(d.positions))}", "${kv('Matched catalogue type',d.matchedType?esc(d.matchedType):'Not matched')}${d.source?kv('Source',esc(d.source)):''}${kv('Positions loaded',String(d.positions))}",1)
JS.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
 if item.get('id')=='company-intelligence':
  item['version']=VERSION;item['release']={'version':VERSION,'date':DATE,'notes':[
   'Adds a TornPDA-first fallback that reads the public company Wiki page and parses its Job Positions table when MediaWiki API endpoints return HTML.',
   'Extracts every real position, recommended MAN/INT/END requirements and stat gains from the rendered company page for the detected company type.',
   'Diagnostics now show whether data came from the MediaWiki API, rendered Torn Wiki or stale cache.'
  ]};break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — Rendered Wiki Company Positions fallback**\n- Uses the public company-specific Torn Wiki page as the preferred source on TornPDA when MediaWiki API requests are returned as HTML.\n- Parses the real `Job Positions` table for rank, recommended MAN/INT/END requirements and stat gains instead of treating HTML as JSON.\n- Keeps MediaWiki API support for compatible environments and reports the active source in Company Position Diagnostics.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — Rendered Wiki Company Positions fallback\n- Fixes the confirmed TornPDA error `MediaWiki API returned HTML instead of JSON`.\n- Reads the detected company type's public Torn Wiki page and parses only the `Job Positions` table, avoiding unrelated labels such as Primary Gains or Secondary Gains.\n- Preserves the existing official catalogue cache, manual overrides and diagnostics while adding an explicit source indicator.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc: doc=doc.replace(marker,marker+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} rendered wiki fallback applied.')
