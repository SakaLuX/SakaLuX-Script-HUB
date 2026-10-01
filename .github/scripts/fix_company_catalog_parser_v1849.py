from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork/Company-Intelligence.md'
VERSION='1.8.49'
DATE='2026-10-02'

text=JS.read_text(encoding='utf-8')
text=re.sub(r'(?m)^(//\s*@version\s+)\S+',rf'\g<1>{VERSION}',text,count=1)
text=re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'",f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'",text,count=1)

start=text.find('function parseOfficialCompanyModule(raw){')
end=text.find('\nasync function ensureOfficialCompanyCatalog(',start)
if start<0 or end<0:
    raise SystemExit('parseOfficialCompanyModule block not found')

parser=r'''function parseOfficialCompanyModule(raw){
 const original=String(raw||'').replace(/^\uFEFF/,'').trim();
 const accept=data=>{
  if(data?.companies&&typeof data.companies==='object')return data.companies;
  if(data&&typeof data==='object'&&!Array.isArray(data)){
   const vals=Object.values(data);
   if(vals.length&&vals.some(x=>x&&typeof x==='object'&&x.positions&&typeof x.positions==='object'))return data;
  }
  return null;
 };
 const parseJson=s=>{try{const data=JSON.parse(String(s||'').trim());return accept(data)}catch{return null}};
 const decodeQuoted=(s,quote)=>{
  let out='';
  for(let i=1;i<s.length;i++){
   const c=s[i];
   if(c===quote)return {value:out,rest:s.slice(i+1)};
   if(c==='\\'&&i+1<s.length){
    const n=s[++i];
    if(n==='n')out+='\n';else if(n==='r')out+='\r';else if(n==='t')out+='\t';else if(n==='b')out+='\b';else if(n==='f')out+='\f';
    else if(n==='u'&&/^[0-9a-fA-F]{4}/.test(s.slice(i+1,i+5))){out+=String.fromCharCode(parseInt(s.slice(i+1,i+5),16));i+=4}
    else out+=n;
   }else out+=c;
  }
  return null;
 };
 const extractBalancedJson=s=>{
  const start=s.search(/\{\s*["']companies["']\s*:/i);if(start<0)return null;
  let depth=0,inStr=false,quote='',escNext=false;
  for(let i=start;i<s.length;i++){
   const c=s[i];
   if(inStr){if(escNext){escNext=false;continue}if(c==='\\'){escNext=true;continue}if(c===quote)inStr=false;continue}
   if(c==='"'||c==="'"){inStr=true;quote=c;continue}
   if(c==='{')depth++;else if(c==='}'&&--depth===0)return s.slice(start,i+1);
  }
  return null;
 };
 const attempts=[];
 const add=s=>{if(typeof s==='string'&&s.trim()&&!attempts.includes(s.trim()))attempts.push(s.trim())};
 add(original);
 if(/<!doctype|<html|<body|<pre/i.test(original)){
  try{add(new DOMParser().parseFromString(original,'text/html').body?.textContent||'')}catch{}
 }
 for(const src of attempts.slice()){
  const direct=parseJson(src);if(direct)return direct;
  const idx=src.indexOf('mw.text.jsonDecode');
  if(idx>=0){
   const open=src.indexOf('(',idx);if(open>=0){
    const arg=src.slice(open+1).trimStart();
    const long=arg.match(/^\[(=*)\[([\s\S]*?)\]\1\]/);
    if(long){const found=parseJson(long[2]);if(found)return found}
    if(arg[0]==='"'||arg[0]==="'"){
     const decoded=decodeQuoted(arg,arg[0]);if(decoded){const found=parseJson(decoded.value);if(found)return found}
    }
   }
  }
  const balanced=extractBalancedJson(src);if(balanced){const found=parseJson(balanced);if(found)return found}
  const encoded=src.match(/&quot;companies&quot;|&#34;companies&#34;/i);
  if(encoded){
   try{const ta=document.createElement('textarea');ta.innerHTML=src;const decoded=ta.value;const balanced2=extractBalancedJson(decoded);if(balanced2){const found=parseJson(balanced2);if(found)return found}}catch{}
  }
 }
 const sample=original.replace(/\s+/g,' ').slice(0,120);
 throw new Error('Official company catalogue format was not recognized'+(sample?' · response: '+sample:''));
}'''
text=text[:start]+parser+text[end:]
JS.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='company-intelligence':
        item['version']=VERSION
        item['release']={'version':VERSION,'date':DATE,'notes':[
            'Makes the official Company Data parser accept direct JSON, Lua long-bracket strings, quoted jsonDecode payloads and HTML-wrapped responses.',
            'Keeps Company Position Diagnostics and now shows the beginning of an unrecognized response if every parser strategy fails.',
            'Fixes FAILED / format was not recognized cases seen in TornPDA while preserving structured official position data and manual overrides.'
        ]}
        break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — Robust official Company Data parser**\n- Accepts direct JSON, Lua long-bracket `mw.text.jsonDecode` payloads, quoted payloads and HTML-wrapped source responses.\n- Fixes TornPDA cases where the official catalogue request succeeded but diagnostics showed `format was not recognized`.\n- Keeps the diagnostic panel and includes a short response preview only when parsing still fails, making any future format change immediately visible.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — Robust official Company Data parser\n- Replaces the single fragile jsonDecode regex with multiple safe parsing strategies.\n- Supports direct JSON, Lua long-bracket strings, single/double quoted payloads and HTML-escaped/wrapped responses.\n- Adds a short response preview to diagnostics when all parser strategies fail, without exposing the Torn API key.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc:doc=doc.replace(marker,marker+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} robust catalogue parser applied.')
