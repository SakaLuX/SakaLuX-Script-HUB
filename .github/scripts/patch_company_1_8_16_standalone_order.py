from pathlib import Path
import json,re

p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.8.15','// @version      1.8.16',1)
s=s.replace("version:'1.8.15'","version:'1.8.16'",1)

marker="function registerStandaloneEntry(){\n try{\n  let m=document.querySelector(`[${STANDALONE_REG_ATTR}=\"company-intelligence\"]`);\n  if(!m){m=document.createElement('span');m.setAttribute(STANDALONE_REG_ATTR,'company-intelligence');m.hidden=true;(document.body||document.documentElement).appendChild(m)}\n  Object.assign(m.dataset,{id:'company-intelligence',name:'Company',icon:'🏢',selector:'',fallback:'https://www.torn.com/joblist.php',version:APP.version});\n }catch{}\n}\n"
insert="""
function normalizeStandaloneCompanyPlacement(){
 try{
  const box=document.querySelector('#sakalux-standalone-dock .slx-dock-items');
  if(!box) return;
  const rows=[...box.querySelectorAll('.slx-dock-row')];
  const company=rows.find(row=>String(row.querySelector('.slx-title')?.textContent||row.textContent||'').trim().toLowerCase()==='company');
  if(company&&company!==box.lastElementChild) box.appendChild(company);
 }catch{}
}
"""
if marker not in s: raise SystemExit('standalone registration marker missing')
s=s.replace(marker,marker+insert,1)

old="function init(){\n registerStandaloneEntry();\n css();S.enabled=get(KEY.enabled,true)!==false;"
new="function init(){\n registerStandaloneEntry();\n setTimeout(normalizeStandaloneCompanyPlacement,250);\n setTimeout(normalizeStandaloneCompanyPlacement,900);\n setInterval(normalizeStandaloneCompanyPlacement,2000);\n css();S.enabled=get(KEY.enabled,true)!==false;"
if old not in s: raise SystemExit('init marker missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

sp=Path('scripts.json'); data=json.loads(sp.read_text(encoding='utf-8'))
for x in data.get('scripts',[]):
    if x.get('id')=='company-intelligence': x['version']='1.8.16'
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

md=Path('greasyfork/Company-Intelligence.md'); m=md.read_text(encoding='utf-8')
m=m.replace('**v1.8.15**','**v1.8.16**',1)
m=m.replace('synchronized at **v1.8.14**','synchronized at **v1.8.16**')
marker='## Current release note\n'; st=m.index(marker)+len(marker); en=m.find('\n## ',st)
if en<0: en=len(m)
m=m[:st]+"\n**v1.8.16** keeps Company Intelligence inside the shared Standalone menu but forces its row to stay with the script list instead of appearing directly under the Standalone header. This remains compatible with older installed dock providers that do not yet know the Company module order.\n"+m[en:]
h='## Release history\n'
if '### v1.8.16 — Standalone ordering fix' not in m:
    m=m.replace(h,h+'### v1.8.16 — Standalone ordering fix\n\n- Keeps Company in the shared Standalone menu.\n- Forces the Company row to the end of the script list instead of directly under the Standalone subtitle.\n- Works even when another installed SakaLuX add-on still uses an older dock ordering table.\n\n',1)
md.write_text(m,encoding='utf-8')
