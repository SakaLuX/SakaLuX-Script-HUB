from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork/Company-Intelligence.md'
VERSION='1.8.50'
DATE='2026-10-02'

text=JS.read_text(encoding='utf-8')
text=re.sub(r'(?m)^(//\s*@version\s+)\S+',rf'\g<1>{VERSION}',text,count=1)
text=re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'",f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'",text,count=1)

start=text.find('async function ensureOfficialCompanyCatalog(force=false){')
end=text.find('\nfunction companyTypeKey(',start)
if start<0 or end<0:
    raise SystemExit('official catalogue loader block not found')

loader=r'''async function ensureOfficialCompanyCatalog(force=false){
 const cached=officialCatalogCache();
 if(!force&&cached?.companies&&now()-num(cached.updated)<7*86400000){
  S.companyCatalogDiag={state:'cached',error:'',updated:num(cached.updated),source:'cache'};
  return cached.companies;
 }
 const endpoints=[
  'https://wiki.torn.com/wiki/api.php?action=query&prop=revisions&rvslots=main&rvprop=content&format=json&formatversion=2&titles=Module%3ACompany_Data',
  'https://wiki.torn.com/w/api.php?action=query&prop=revisions&rvslots=main&rvprop=content&format=json&formatversion=2&titles=Module%3ACompany_Data',
  'https://wiki.torn.com/api.php?action=query&prop=revisions&rvslots=main&rvprop=content&format=json&formatversion=2&titles=Module%3ACompany_Data'
 ];
 try{
  S.companyCatalogDiag={state:'loading',error:'',updated:num(cached?.updated),source:'network'};
  let lastError='';
  for(const url of endpoints){
   try{
    const raw=await wikiText(url);
    const envelope=JSON.parse(String(raw||'').replace(/^\uFEFF/,'').trim());
    const page=envelope?.query?.pages?.[0]||Object.values(envelope?.query?.pages||{})[0];
    const rev=page?.revisions?.[0];
    const source=rev?.slots?.main?.content??rev?.slots?.main?.['*']??rev?.content??rev?.['*'];
    if(!source)throw new Error('MediaWiki API returned no Module:Company_Data source');
    const companies=parseOfficialCompanyModule(source);
    const updated=now();set(KEY.companyCatalog,{updated,companies});
    S.companyCatalogDiag={state:'loaded',error:'',updated,source:'MediaWiki API'};
    return companies;
   }catch(e){lastError=String(e?.message||e||'Unknown MediaWiki API error')}
  }
  throw new Error(lastError||'All MediaWiki API endpoints failed');
 }catch(e){
  const error=String(e?.message||e||'Unknown catalogue error');
  if(cached?.companies){S.companyCatalogDiag={state:'stale-cache',error,updated:num(cached.updated),source:'cache'};return cached.companies}
  S.companyCatalogDiag={state:'failed',error,updated:0,source:'none'};
  console.warn('[SakaLuX Company] official catalogue unavailable',e);return null;
 }
}'''
text=text[:start]+loader+text[end:]
JS.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='company-intelligence':
        item['version']=VERSION
        item['release']={'version':VERSION,'date':DATE,'notes':[
            'Stops requesting the rendered Torn Wiki page for Company Data, which returned HTML in TornPDA instead of raw module source.',
            'Loads Module:Company_Data through the MediaWiki revisions API and extracts the raw module content before parsing positions.',
            'Tries multiple standard Torn Wiki API paths and keeps diagnostics/manual overrides intact if the network source is unavailable.'
        ]}
        break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — MediaWiki API Company catalogue loader**\n- Replaces the rendered `Module:Company_Data?action=raw` page request, which TornPDA was receiving as HTML, with MediaWiki revision API requests.\n- Extracts the module source from the API response and feeds that source into the existing structured Company Data parser.\n- Tries multiple standard Torn Wiki API paths and preserves diagnostics, cache fallback and per-company manual overrides.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — MediaWiki API Company catalogue loader\n- Fixes the confirmed TornPDA failure where the Company Data request returned a full HTML page beginning with `<!DOCTYPE html>`.\n- Retrieves raw `Module:Company_Data` source through the MediaWiki revisions API instead of scraping/rendered page HTML.\n- Keeps structured position matching, diagnostics, cache fallback and manual overrides unchanged.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc:doc=doc.replace(marker,marker+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} MediaWiki API catalogue loader applied.')
