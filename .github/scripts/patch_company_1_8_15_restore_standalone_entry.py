from pathlib import Path
import json

p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.8.14','// @version      1.8.15',1)
s=s.replace("version:'1.8.14'","version:'1.8.15'",1)

marker="const S={open:false,loading:false,mode:'employee',tab:'overview',compact:true,enabled:true,data:{},errors:[],updated:0};\n"
insert="""
const STANDALONE_REG_ATTR='data-slx-standalone-registration';
function registerStandaloneEntry(){
 try{
  let m=document.querySelector(`[${STANDALONE_REG_ATTR}=\"company-intelligence\"]`);
  if(!m){m=document.createElement('span');m.setAttribute(STANDALONE_REG_ATTR,'company-intelligence');m.hidden=true;(document.body||document.documentElement).appendChild(m)}
  Object.assign(m.dataset,{id:'company-intelligence',name:'Company',icon:'🏢',selector:'',fallback:'https://www.torn.com/joblist.php',version:APP.version});
 }catch{}
}
"""
if marker not in s: raise SystemExit('state marker missing')
s=s.replace(marker,marker+insert,1)

old="function init(){\n css();S.enabled=get(KEY.enabled,true)!==false;"
new="function init(){\n registerStandaloneEntry();\n css();S.enabled=get(KEY.enabled,true)!==false;"
if old not in s: raise SystemExit('init marker missing')
s=s.replace(old,new,1)

# Keep the registration alive across Torn SPA body changes, but do not create/modify the dock itself.
needle="setTimeout(()=>{try{scrapePositionRequirements()}catch{}},800);"
replacement=needle+"\nsetInterval(registerStandaloneEntry,15000);"
if needle not in s: raise SystemExit('observer tail marker missing')
s=s.replace(needle,replacement,1)

p.write_text(s,encoding='utf-8')

sp=Path('scripts.json'); data=json.loads(sp.read_text(encoding='utf-8'))
for x in data.get('scripts',[]):
    if x.get('id')=='company-intelligence':
        x['version']='1.8.15'
        x['buttonSelector']=''
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

md=Path('greasyfork/Company-Intelligence.md'); m=md.read_text(encoding='utf-8')
m=m.replace('**v1.8.14**','**v1.8.15**',1)
marker='## Current release note\n'; st=m.index(marker)+len(marker); en=m.find('\n## ',st)
if en<0: en=len(m)
m=m[:st]+"\n**v1.8.15** restores Company Intelligence to the shared SakaLuX standalone menu, but no longer injects or restyles that menu. The shared dock keeps its normal compact design, while Company appears as a regular entry and opens through the hidden module bridge. The separate floating Company Intel button remains removed.\n"+m[en:]
h='## Release history\n'
if '### v1.8.15 — Restore clean standalone entry' not in m:
    m=m.replace(h,h+'### v1.8.15 — Restore clean standalone entry\n\n- Restores Company Intelligence as an entry in the shared standalone SakaLuX Scripts menu.\n- Does not inject standalone dock CSS or create a second dock.\n- Keeps the floating Company Intel button removed.\n- Opens from the shared menu through the hidden Company module bridge.\n\n',1)
md.write_text(m,encoding='utf-8')
