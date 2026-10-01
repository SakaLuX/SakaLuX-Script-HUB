from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork/Company-Intelligence.md'
VERSION='1.8.53'
DATE='2026-10-02'

text=JS.read_text(encoding='utf-8')
text=re.sub(r'(?m)^(//\s*@version\s+)\S+',rf'\g<1>{VERSION}',text,count=1)
text=re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'",f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'",text,count=1)

marker='function officialCatalogCache(){'
if 'const BUILTIN_COMPANY_CATALOG=' not in text:
    builtin=r'''const BUILTIN_COMPANY_CATALOG={
 '37':{name:'Private Security Firm',positions:{
  'Security Contractor':{man_required:70000,int_required:0,end_required:35000,man_gain:64,int_gain:0,end_gain:32,special_ability:'None'},
  'Team Leader':{man_required:110000,int_required:0,end_required:55000,man_gain:68,int_gain:0,end_gain:34,special_ability:'Manager'},
  'Defense Consultant':{man_required:0,int_required:135000,end_required:67500,man_gain:0,int_gain:70,end_gain:35,special_ability:'Trainer'},
  'Spokesperson':{man_required:0,int_required:80000,end_required:40000,man_gain:0,int_gain:65,end_gain:33,special_ability:'Marketer'},
  'Company Liaison':{man_required:0,int_required:57500,end_required:115000,man_gain:0,int_gain:34,end_gain:68,special_ability:'Secretary'},
  'Chief Strategist':{man_required:0,int_required:165000,end_required:82500,man_gain:0,int_gain:71,end_gain:36,special_ability:'None'},
  'Reconnaissance':{man_required:80000,int_required:40000,end_required:0,man_gain:65,int_gain:33,end_gain:0,special_ability:'None'},
  'Disposal Engineer':{man_required:0,int_required:85000,end_required:42500,man_gain:0,int_gain:66,end_gain:33,special_ability:'None'},
  'Armorer':{man_required:40000,int_required:0,end_required:80000,man_gain:33,int_gain:0,end_gain:65,special_ability:'None'},
  'Medic':{man_required:0,int_required:90000,end_required:45000,man_gain:0,int_gain:66,end_gain:33,special_ability:'Cleaner'},
  'Comms Engineer':{man_required:0,int_required:85000,end_required:42500,man_gain:0,int_gain:66,end_gain:33,special_ability:'None'}
 }}
};
function builtinCompanyCatalogFor(typeName){
 const wanted=companyTypeKey(typeName);if(!wanted)return null;
 const out={};for(const [id,c] of Object.entries(BUILTIN_COMPANY_CATALOG)){if(companyTypeKey(c?.name)===wanted)out[id]=c}
 return Object.keys(out).length?out:null;
}
'''
    pos=text.find(marker)
    if pos<0: raise SystemExit('officialCatalogCache marker not found')
    text=text[:pos]+builtin+text[pos:]

needle=" const typeName=String(meta().type||'').trim();\n try{"
replacement=" const typeName=String(meta().type||'').trim();\n const builtin=builtinCompanyCatalogFor(typeName);\n if(builtin){const updated=now();set(KEY.companyCatalog,{updated,companies:builtin});S.companyCatalogDiag={state:'loaded',error:'',updated,source:'Built-in verified catalogue'};return builtin}\n try{"
if needle not in text:
    raise SystemExit('ensureOfficialCompanyCatalog insertion point not found')
text=text.replace(needle,replacement,1)

JS.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='company-intelligence':
        item['version']=VERSION
        item['release']={'version':VERSION,'date':DATE,'notes':[
            'Adds a verified built-in Private Security Firm position catalogue so TornPDA no longer depends on Wiki HTML/API compatibility for this company type.',
            'Loads all 11 official Private Security Firm positions with MAN/INT/END requirements and stat gains before attempting any remote Wiki source.',
            'Company Position Diagnostics reports Built-in verified catalogue when this reliable fallback is active.'
        ]}
        break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — Verified built-in Company Position fallback**\n- Adds a verified built-in `Private Security Firm` catalogue with all official positions and MAN/INT/END requirements.\n- Uses the built-in catalogue before Wiki network requests, avoiding TornPDA responses that return HTML without the expected Job Positions table.\n- Diagnostics reports `Built-in verified catalogue` when this source is active.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — Verified built-in Company Position fallback\n- Fixes the confirmed TornPDA error `Rendered company wiki page did not contain a Job Positions table` for Private Security Firm.\n- Embeds all 11 official positions and their required working stats, including Reconnaissance 80,000 MAN / 40,000 INT and Armorer 40,000 MAN / 80,000 END.\n- Keeps remote catalogue loading as a fallback for other company types while preserving manual overrides and diagnostics.\n'''
marker2='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc: doc=doc.replace(marker2,marker2+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} verified built-in fallback applied.')
