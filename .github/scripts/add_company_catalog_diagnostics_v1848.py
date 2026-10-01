from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork/Company-Intelligence.md'
VERSION='1.8.48'
DATE='2026-10-02'

text=JS.read_text(encoding='utf-8')
text=re.sub(r'(?m)^(//\s*@version\s+)\S+',rf'\g<1>{VERSION}',text,count=1)
text=re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'",f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'",text,count=1)

# Replace catalogue loader so failures/cached fallback are visible to the UI.
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
 try{
  S.companyCatalogDiag={state:'loading',error:'',updated:num(cached?.updated),source:'network'};
  const raw=await wikiText('https://wiki.torn.com/wiki/Module:Company_Data?action=raw');
  const companies=parseOfficialCompanyModule(raw);
  const updated=now();set(KEY.companyCatalog,{updated,companies});
  S.companyCatalogDiag={state:'loaded',error:'',updated,source:'network'};
  return companies;
 }catch(e){
  const error=String(e?.message||e||'Unknown catalogue error');
  if(cached?.companies){S.companyCatalogDiag={state:'stale-cache',error,updated:num(cached.updated),source:'cache'};return cached.companies}
  S.companyCatalogDiag={state:'failed',error,updated:0,source:'none'};
  console.warn('[SakaLuX Company] official catalogue unavailable',e);return null;
 }
}'''
text=text[:start]+loader+text[end:]

# Add a compact diagnostics helper after company-type matching.
anchor='function officialCompanyPositions(){'
pos=text.find(anchor)
if pos<0: raise SystemExit('officialCompanyPositions anchor not found')
diag=r'''function companyCatalogDiagnostics(){
 const cached=officialCatalogCache(),companies=cached?.companies||null,match=currentOfficialCompanyType(companies),rows=match?.c?.positions?Object.keys(match.c.positions):[];
 const d=S.companyCatalogDiag||{};
 const state=d.state||(companies?'cached':'not-loaded');
 return {
  state,
  error:String(d.error||''),
  updated:num(d.updated||cached?.updated),
  companyType:String(meta().type||'Unknown'),
  matchedType:String(match?.c?.name||''),
  positions:rows.length
 };
}
function companyCatalogDiagnosticsHtml(){
 const d=companyCatalogDiagnostics();
 const ok=d.positions>0&&d.matchedType;
 const status=d.state==='failed'?'FAILED ❌':d.state==='loading'?'LOADING…':d.state==='stale-cache'?'STALE CACHE ⚠️':ok?'LOADED ✅':'NOT MATCHED ⚠️';
 const age=d.updated?Math.max(0,Math.floor((now()-d.updated)/60000)):null;
 return `<div class="ci-card" style="margin:10px 0"><div class="ci-card-title">Company Position Diagnostics</div>${kv('Official catalogue',status)}${kv('Company type',esc(d.companyType||'Unknown'))}${kv('Matched catalogue type',d.matchedType?esc(d.matchedType):'Not matched')}${kv('Positions loaded',String(d.positions))}${d.updated?kv('Catalogue age',age+' min'):''}${d.error?`<div class="ci-note" style="color:#ffb3b3;margin-top:8px">${esc(d.error)}</div>`:''}<div class="ci-actions" style="margin-top:8px"><button class="ci-btn" data-refresh-catalog>↻ RETRY CATALOGUE</button></div></div>`;
}
'''
text=text[:pos]+diag+text[pos:]

# Inject diagnostics into the editor and add retry action.
old="back.innerHTML=`<div class=\"ci-dialog ci-position-editor\"><h3>Company Position Requirements</h3><p class=\"ci-note\">Company: <b>${esc(meta().name)}</b> · Type: <b>${esc(meta().type)}</b>. Positions come from Torn's structured official company catalogue. Change a value only when you want a manual override for this company.</p><div class=\"ci-position-edit-list\">${names.map(name=>{"
new="back.innerHTML=`<div class=\"ci-dialog ci-position-editor\"><h3>Company Position Requirements</h3><p class=\"ci-note\">Company: <b>${esc(meta().name)}</b> · Type: <b>${esc(meta().type)}</b>. Positions come from Torn's structured official company catalogue. Change a value only when you want a manual override for this company.</p>${companyCatalogDiagnosticsHtml()}<div class=\"ci-position-edit-list\">${names.map(name=>{"
if old not in text:
    raise SystemExit('editor HTML anchor not found')
text=text.replace(old,new,1)

old2="document.body.appendChild(back);$('[data-cancel]',back).onclick=()=>back.remove();$('[data-reset]',back).onclick=()=>{"
new2="document.body.appendChild(back);const retry=$('[data-refresh-catalog]',back);if(retry)retry.onclick=async()=>{retry.disabled=true;retry.textContent='Loading…';await ensureOfficialCompanyCatalog(true);cleanupPositionCacheAgainstOfficial();back.remove();openPositionRequirementsEditor()};$('[data-cancel]',back).onclick=()=>back.remove();$('[data-reset]',back).onclick=()=>{"
if old2 not in text:
    raise SystemExit('editor event anchor not found')
text=text.replace(old2,new2,1)

JS.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='company-intelligence':
        item['version']=VERSION
        item['release']={'version':VERSION,'date':DATE,'notes':[
            'Adds live diagnostics to EDIT POSITION DATA for the official Torn company catalogue.',
            'Shows catalogue state, detected company type, matched official type, loaded position count, cache age and the exact loader error.',
            'Adds RETRY CATALOGUE to force a fresh official-data request without clearing valid manual overrides.'
        ]}
        break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — Company Position catalogue diagnostics**\n- Adds a diagnostics block to `EDIT POSITION DATA` showing whether the official catalogue loaded, the detected company type, the matched catalogue type and the number of positions loaded.\n- Shows cache age and the exact catalogue loader/parser error when official values are unavailable.\n- Adds `RETRY CATALOGUE` to force a fresh official-data request directly from the editor.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — Company Position catalogue diagnostics\n- Adds an on-screen health check for the structured official Company Position catalogue.\n- Distinguishes loaded, cached, stale-cache, not-matched and failed states so missing Primary/Secondary values can be diagnosed immediately.\n- Displays company-type matching, position count, cache age and loader errors, with a one-tap forced retry.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc: doc=doc.replace(marker,marker+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} catalogue diagnostics applied.')
