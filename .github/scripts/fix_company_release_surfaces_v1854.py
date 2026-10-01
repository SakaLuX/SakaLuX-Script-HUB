from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork/Company-Intelligence.md'
VERSION='1.8.54'
DATE='2026-10-02'

text=JS.read_text(encoding='utf-8')
text=re.sub(r'(?m)^(//\s*@version\s+)\S+',rf'\g<1>{VERSION}',text,count=1)
text=re.sub(r"const APP=\{name:'SakaLuX Company Intelligence',version:'[^']+'",f"const APP={{name:'SakaLuX Company Intelligence',version:'{VERSION}'",text,count=1)

# Keep the canonical installed-version fallback aligned with the final release.
mb='/* SakaLuX Canonical Installed Version — BEGIN */'
me='/* SakaLuX Canonical Installed Version — END */'
a=text.find(mb); b=text.find(me,a)
if a>=0 and b>a:
    block=text[a:b]
    block=re.sub(r"let v = '[^']+';",f"let v = '{VERSION}';",block,count=1)
    text=text[:a]+block+text[b:]

# Collapse repeated companyCatalog properties accumulated by historical patch scripts.
key_token="companyCatalog:APP.key+':company_catalog'"
if text.count(key_token)>1:
    first=True
    def dedupe_key(m):
        nonlocal_dummy=None
        return m.group(0)
    # Work only inside KEY object.
    ks=text.find('const KEY={')
    ke=text.find('\n};',ks)
    if ks>=0 and ke>ks:
        block=text[ks:ke]
        parts=block.split(',')
        seen=False; out=[]
        for part in parts:
            if key_token in part:
                if seen: continue
                seen=True
            out.append(part)
        text=text[:ks]+','.join(out)+text[ke:]

# Collapse consecutive duplicate catalogue refresh calls to one call per location.
call="ensureOfficialCompanyCatalog().then(()=>{cleanupPositionCacheAgainstOfficial();if(S.open)render()}).catch(()=>{});"
text=re.sub(r'(?:'+re.escape(call)+r'){2,}',call,text)

JS.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='company-intelligence':
        item['version']=VERSION
        item['release']={
            'version':VERSION,
            'date':DATE,
            'notes':[
                'Synchronizes the Company Intelligence userscript header, runtime version, canonical installed-version marker, Script Hub registry and release surfaces to the same final version.',
                'Removes duplicate company-catalogue storage-key entries and repeated catalogue refresh calls accumulated by earlier incremental patches.',
                'Prevents Script Hub from showing a false UPDATE AVAILABLE badge when the installed Company Intelligence script is already current.'
            ]
        }
        break
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*',f'## Current version\n**v{VERSION}**',doc,count=1)
doc=re.sub(r'- Canonical version: \*\*v[^*]+\*\*',f'- Canonical version: **v{VERSION}**',doc,count=1)
release=f'''## Current release note\n\n**v{VERSION} — Final version-surface synchronization and cleanup**\n- Synchronizes the userscript header, runtime version, canonical installed-version marker, Hub registry and release metadata to the same final version.\n- Removes duplicate company-catalogue key entries and repeated catalogue refresh calls left by the incremental v1.8.43–v1.8.53 patch chain.\n- Prevents false `UPDATE AVAILABLE` status in Script Hub when Company Intelligence is already current.\n'''
doc=re.sub(r'## Current release note\n.*?(?=\n## Release history / Changelog)',release.rstrip()+'\n',doc,count=1,flags=re.S)
entry=f'''\n### v{VERSION} — Final version-surface synchronization and cleanup\n- Aligns `@version`, `APP.version`, the canonical installed-version marker, scripts.json and Hub fallback metadata so every version signal reports v{VERSION}.\n- Cleans duplicate `companyCatalog` storage-key entries and repeated catalogue refresh calls accumulated by the previous Company Position fixes.\n- Keeps the verified Private Security Firm built-in catalogue from v1.8.53 unchanged while fixing the false Hub update state.\n'''
marker='## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc: doc=doc.replace(marker,marker+entry,1)
DOC.write_text(doc,encoding='utf-8')
print(f'Company Intelligence v{VERSION} final release surfaces synchronized and duplicate patch residue cleaned.')
