from pathlib import Path
import json,re

p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()

s=re.sub(r'// @version\s+\S+','// @version      0.3.4',s,count=1)
s=re.sub(r"let v = '[^']+';","let v = '0.3.4';",s,count=1)
s=re.sub(r"const VERSION='[^']+'","const VERSION='0.3.4'",s,count=1)

old="const prof=document.createElement('a');prof.href=x.profile;prof.textContent='👤';prof.title='Profile';"
new="const prof=document.createElement('a');prof.href=x.profile;prof.target='_blank';prof.rel='noopener noreferrer';prof.textContent='👤';prof.title='Profile (new tab)';"
if old not in s: raise SystemExit('profile action anchor not found')
s=s.replace(old,new,1)

p.write_text(s)

md=Path('greasyfork/Bounty-Hunter.md')
t=md.read_text()
t=re.sub(r'\*\*v[^*]+\*\*','**v0.3.4**',t,count=1)
entry='''\n### v0.3.4 — Profile in new tab\n- The blue Profile/person action now opens the selected Torn profile in a new tab/window instead of replacing the current Bounty Hunter page.\n- Adds `noopener noreferrer` isolation for the new profile tab.\n'''
if '### v0.3.4' not in t:t=t.replace('## Changelog','## Changelog'+entry)
md.write_text(t)

rp=Path('scripts.json')
data=json.loads(rp.read_text())
for x in data.get('scripts',[]):
    if x.get('id')=='bounty-hunter':
        x['version']='0.3.4'
        x['release']={'version':'0.3.4','date':'2026-10-05','notes':['Profile/person action now opens the selected Torn profile in a new tab.','Adds safe new-tab isolation with noopener/noreferrer.']}
        break
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('updated Bounty Hunter to v0.3.4')
