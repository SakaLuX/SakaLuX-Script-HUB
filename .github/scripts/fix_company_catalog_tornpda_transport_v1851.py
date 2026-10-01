from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork/Company-Intelligence.md'
VERSION='1.8.51'
DATE='2026-10-02'

text=JS.read_text(encoding='utf-8')
text=re.sub(r'(?m)^(//\s*@version\s+)\S+',rf'\g<1>{VERSION}',text,count=1)
text=re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'",f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'",text,count=1)

start=text.find('function wikiText(url){')
end=text.find('\nfunction parseOfficialCompanyModule(',start)
if start<0 or end<0:
    raise SystemExit('wikiText block not found')

transport=r'''async function wikiText(url){
 const checked=response=>{
  const raw=typeof response==='string'?response:(response?.responseText??response?.body??response?.data??response?.response??response);
  if(raw==null)throw new Error('Empty response received from catalogue transport');
  const text=typeof raw==='string'?raw:JSON.stringify(raw);
  if(!String(text||'').trim())throw new Error('Empty response received from catalogue transport');
  return String(text);
 };
 const viaGM=()=>new Promise((resolve,reject)=>{
  let settled=false;const done=(fn,v)=>{if(settled)return;settled=true;fn(v)};
  try{
   const req=GM_xmlhttpRequest({
    method:'GET',url,timeout:15000,headers:{Accept:'application/json, text/plain, */*'},
    onload:r=>{try{if(Number(r?.status||200)>=400)throw new Error('HTTP '+r.status);done(resolve,checked(r))}catch(e){done(reject,e)}},
    onerror:()=>done(reject,new Error('GM catalogue request failed')),
    ontimeout:()=>done(reject,new Error('GM catalogue request timed out'))
   });
   if(req&&typeof req.then==='function')req.then(r=>{try{done(resolve,checked(r))}catch(e){done(reject,e)}}).catch(e=>done(reject,e));
  }catch(e){done(reject,e)}
 });
 const viaFetch=async()=>{
  const r=await fetch(url,{method:'GET',headers:{Accept:'application/json, text/plain, */*'},credentials:'omit',cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return checked(await r.text());
 };
 let last=null;
 if(typeof window.PDA_httpGet==='function'){
  try{return checked(await window.PDA_httpGet(url,{Accept:'application/json, text/plain, */*'}))}catch(e){last=e}
 }
 if(window.flutter_inappwebview?.callHandler){
  try{return checked(await window.flutter_inappwebview.callHandler('PDA_httpGet',url,{Accept:'application/json, text/plain, */*'}))}catch(e){last=e}
 }
 if(typeof GM_xmlhttpRequest==='function'){
  try{return await viaGM()}catch(e){last=e}
 }
 try{return await viaFetch()}catch(e){last=e}
 throw last||new Error('No catalogue HTTP transport is available');
}'''
text=text[:start]+transport+text[end:]

# Make MediaWiki envelope parsing explicit so an empty/HTML response reports the real transport problem.
old="""    const raw=await wikiText(url);\n    const envelope=JSON.parse(String(raw||'').replace(/^\\uFEFF/,'').trim());"""
new="""    const raw=await wikiText(url);\n    const clean=String(raw||'').replace(/^\\uFEFF/,'').trim();\n    if(!clean)throw new Error('MediaWiki API returned an empty response');\n    if(/^<!doctype|^<html/i.test(clean))throw new Error('MediaWiki API returned HTML instead of JSON');\n    let envelope;try{envelope=JSON.parse(clean)}catch(e){throw new Error('MediaWiki API returned invalid JSON: '+String(e?.message||e))}"""
if old not in text:
    raise SystemExit('MediaWiki JSON parse anchor not found')
text=text.replace(old,new,1)
JS.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='company-intelligence':
        item['version']=VERSION
        item['release']={'version':VERSION,'date':DATE,'notes':[
            'Uses TornPDA PDA_httpGet first for the official Company catalogue, with flutter bridge, GM_xmlhttpRequest and fetch fallbacks.',
            'Accepts TornPDA responseText, body, data, response, direct string and object response shapes instead of accidentally turning a valid response into an empty string.',
            'Replaces the generic Unexpected end of JSON input failure with explicit empty-response, HTML-response or invalid-JSON diagnostics.'
        ]}
        break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — TornPDA-safe Company catalogue transport**\n- Uses TornPDA `PDA_httpGet` first and falls back through the Flutter bridge, `GM_xmlhttpRequest` and normal `fetch`.\n- Understands all response shapes used by TornPDA (`responseText`, `body`, `data`, `response`, direct text/object), fixing the empty-response path that caused `Unexpected end of JSON input`.\n- Adds precise diagnostics for empty, HTML and malformed JSON responses so future catalogue failures identify the actual transport problem.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — TornPDA-safe Company catalogue transport\n- Fixes the confirmed `Unexpected end of JSON input` error from Company Position Diagnostics.\n- Routes catalogue reads through the same TornPDA-compatible transport strategy already used by stable SakaLuX modules.\n- Preserves MediaWiki API parsing, official position matching, cache fallback and manual per-company overrides.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc:doc=doc.replace(marker,marker+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} TornPDA catalogue transport applied.')
