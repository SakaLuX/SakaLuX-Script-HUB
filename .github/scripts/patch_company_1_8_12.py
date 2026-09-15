from pathlib import Path
import json
p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.8.11','// @version      1.8.12',1)
s=s.replace("version:'1.8.11'","version:'1.8.12'",1)
old="if(S.enabled&&!$('#ci-launch')){const b=document.createElement('button');b.id='ci-launch';b.textContent='🏢 Company Intel';b.onclick=()=>{S.open=true;render();if(!S.updated&&apiKey())refresh()};document.body.appendChild(b)}"
new="const hubActive=!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button'));if(hubActive)$('#ci-launch')?.remove();if(S.enabled&&!hubActive&&!$('#ci-launch')){const b=document.createElement('button');b.id='ci-launch';b.textContent='🏢 Company Intel';b.onclick=()=>{S.open=true;render();if(!S.updated&&apiKey())refresh()};document.body.appendChild(b)}"
if old not in s: raise SystemExit('launcher block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
sp=Path('scripts.json');d=json.loads(sp.read_text(encoding='utf-8'))
for x in d.get('scripts',[]):
    if x.get('id')=='company-intelligence': x['version']='1.8.12'
sp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
md=Path('greasyfork/Company-Intelligence.md')
m=md.read_text(encoding='utf-8')
m=m.replace('**v1.8.11**','**v1.8.12**',1)
marker='## Current release note\n'
if marker in m:
    st=m.index(marker)+len(marker); en=m.find('\n## ',st)
    if en<0: en=len(m)
    m=m[:st]+'\n**v1.8.12** removes the standalone floating Company Intel button whenever SakaLuX Script Hub is installed. The launcher remains available only for true standalone use.\n'+m[en:]
h='## Release history\n'
if h in m and '### v1.8.12 — Hub launcher cleanup' not in m:
    m=m.replace(h,h+'### v1.8.12 — Hub launcher cleanup\n\n- Hides/removes the bottom-right Company Intel floating button when SakaLuX Script Hub is active.\n- Keeps the standalone launcher only when the script is used without the Hub.\n\n',1)
md.write_text(m,encoding='utf-8')
