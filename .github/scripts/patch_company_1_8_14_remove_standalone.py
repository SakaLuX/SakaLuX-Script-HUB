from pathlib import Path
import json,re

p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=p.read_text(encoding='utf-8')

s=s.replace('// @version      1.8.13','// @version      1.8.14',1)
s=s.replace("version:'1.8.13'","version:'1.8.14'",1)

start=s.find('/* SakaLuX Standalone Dock Bootstrap — BEGIN */')
end=s.find('/* SakaLuX Standalone Dock Bootstrap — END */')
if start < 0 or end < 0:
    raise SystemExit('standalone bootstrap block not found')
end += len('/* SakaLuX Standalone Dock Bootstrap — END */')
s=s[:start] + '/* Company Intelligence is Hub-managed. No standalone dock/launcher is created. */' + s[end:]

old=" const hubActive=!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.getElementById('sakalux-hub-top-skull')||document.getElementById('sakalux-hub-nav-skull')||document.getElementById('sakalux-hub-panel')||document.getElementById('sakalux-hub-style')||document.querySelector('[data-sakalux-hub-installed=\"1\"]')||document.querySelector('[data-sakalux-hub-active=\"1\"]'));if(hubActive)$('#ci-launch')?.remove();if(S.enabled&&!hubActive&&!$('#ci-launch')){const b=document.createElement('button');b.id='ci-launch';b.textContent='🏢 Company Intel';b.onclick=()=>{S.open=true;render();if(!S.updated&&apiKey())refresh()};document.body.appendChild(b)}"
new=" $('#ci-launch')?.remove();"
if old not in s:
    raise SystemExit('launcher creation block not found')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

sp=Path('scripts.json')
data=json.loads(sp.read_text(encoding='utf-8'))
for x in data.get('scripts',[]):
    if x.get('id')=='company-intelligence':
        x['version']='1.8.14'
        # Hub opens Company through apiGlobal/hidden bridge; there is no visible page launcher anymore.
        x['buttonSelector']=''
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

md=Path('greasyfork/Company-Intelligence.md')
m=md.read_text(encoding='utf-8')
m=m.replace('**v1.8.13**','**v1.8.14**',1)
marker='## Current release note\n'
st=m.index(marker)+len(marker)
en=m.find('\n## ',st)
if en<0: en=len(m)
m=m[:st]+"\n**v1.8.14** removes Company Intelligence from the shared standalone dock completely and removes its floating Company Intel launcher. Company Intelligence is now opened only through SakaLuX Script Hub using its runtime API/hidden bridge, preventing it from changing or breaking the standalone dock layout used by the other add-ons.\n"+m[en:]
h='## Release history\n'
if '### v1.8.14 — Remove standalone Company launcher' not in m:
    m=m.replace(h,h+'### v1.8.14 — Remove standalone Company launcher\n\n- Removes the Company entry from the shared standalone SakaLuX Scripts dock.\n- Removes the floating Company Intel page button completely.\n- Keeps Hub integration through `window.SakaLuXCompanyIntelligence` and the hidden module bridge.\n- Stops Company Intelligence from injecting its own standalone dock CSS/layout.\n\n',1)
md.write_text(m,encoding='utf-8')
