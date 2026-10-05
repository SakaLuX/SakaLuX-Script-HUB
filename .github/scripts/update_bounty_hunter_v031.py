from pathlib import Path
import json,re

p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()

# Version
s=re.sub(r'// @version\s+\S+','// @version      0.3.1',s,count=1)
s=re.sub(r"let v = '[^']+';","let v = '0.3.1';",s,count=1)
s=re.sub(r"const VERSION='[^']+'","const VERSION='0.3.1'",s,count=1)

# One-time migration from pre-0.3.0 persisted defaults that were masking the new beatable configuration.
anchor="let S={...D,...J(KS,{})},WATCH=J(KW,{}),BLACK=J(KB,{}),CACHE=J(KC,{rows:[],at:0}),UCACHE=J(KU,{}),timer=0,tickTimer=0,lastRows=[],busy=false,lastError='',lastSource='DOM',notified=new Map();"
if anchor not in s: raise SystemExit('settings anchor not found')
insert=anchor+"\ntry{const mk='SLX_BOUNTY_MIGRATED_031';if(!localStorage.getItem(mk)){if(num(S.minReward)===50000)S.minReward=500000;if(num(S.notifyMinReward)===25000||num(S.notifyMinReward)===250000)S.notifyMinReward=500000;if(num(S.refreshSec)===20)S.refreshSec=60;if(num(S.maxPages)===8)S.maxPages=20;if(num(S.hospitalWindowMin)===0)S.hospitalWindowMin=5;if(num(S.minFF)<=0)S.minFF=1;if(num(S.maxFF)<=0)S.maxFF=3;localStorage.setItem(mk,'1');W(KS,S)}}catch{}"
s=s.replace(anchor,insert,1)

# FFScouter uses the same registered Torn key when no explicit FF key exists.
old="function getFFKey(){try{return String(localStorage.getItem(KF)||localStorage.getItem('bh_ffscouterKey')||'').trim()}catch{return''}}"
new="function getFFKey(){try{return String(localStorage.getItem(KF)||localStorage.getItem('bh_ffscouterKey')||getKey()||'').trim()}catch{return getKey()||''}}"
if old not in s: raise SystemExit('FF key helper anchor not found')
s=s.replace(old,new,1)

# Safe mode should not silently eliminate API rows whose status is still Unknown; Hide unknown controls that explicitly.
old="if(S.mode==='safe'&&x.status!=='Okay'&&x.status!=='Hospital')return false;return true}"
new="if(S.mode==='safe'&&!['Okay','Hospital','Unknown'].includes(x.status))return false;return true}"
if old not in s: raise SystemExit('safe mode anchor not found')
s=s.replace(old,new,1)

# API panel must open visibly below the header instead of being appended below a clipped list/footer.
old="o.querySelector('section').appendChild(p)}"
new="o.querySelector('header').insertAdjacentElement('afterend',p)}"
if old not in s: raise SystemExit('API panel mount anchor not found')
s=s.replace(old,new,1)

# Clarify key behavior and add a live FFScouter test button.
old="<b>API Access</b><div>Source: '+source+'. Torn API scans the full bounty board. FFScouter decides which targets are in your configured fair-fight range.</div>"
new="<b>API Access</b><div>Source: '+source+'. FFScouter uses the same registered Torn API key by default; an explicit FF key is optional.</div>"
if old in s:s=s.replace(old,new,1)
old="<button data-ffsave>Save FF key</button><button data-ffclear>Clear FF key</button><button data-notify>Notifications</button>"
new="<button data-ffsave>Save FF key</button><button data-ffclear>Clear FF key</button><button data-fftest>Test FFScouter</button><button data-notify>Notifications</button>"
if old in s:s=s.replace(old,new,1)
needle="p.querySelector('[data-ffclear]').onclick=()=>{setFFKey('');toast('FFScouter key cleared');render(false)};"
if needle in s:
    s=s.replace(needle,needle+"p.querySelector('[data-fftest]').onclick=async()=>{const id=lastRows[0]?.id;if(!id)return toast('Refresh the bounty board first');try{const d=await externalJson('https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(getFFKey())+'&targets='+encodeURIComponent(id));if(Array.isArray(d))toast('FFScouter OK · '+d.length+' result');else toast('FFScouter error · '+(d?.error||d?.code||'invalid response'))}catch(e){toast('FFScouter error · '+(e.message||e))}};",1)

# Better diagnostics in footer: distinguish board load from FFScouter coverage and actual beatable range.
old="o.querySelector('[data-count]').textContent=rows.length+' matches / '+lastRows.length+' loaded';"
new="const ffKnown=lastRows.filter(x=>x.ff!=null).length,ffBeatable=lastRows.filter(x=>x.ff!=null&&x.ff>=num(S.minFF||1)&&x.ff<=num(S.maxFF||3)).length;o.querySelector('[data-count]').textContent=rows.length+' matches / '+lastRows.length+' loaded · FF '+ffKnown+' known / '+ffBeatable+' beatable';"
if old not in s: raise SystemExit('count footer anchor not found')
s=s.replace(old,new,1)

# If no matches, explain the most likely cause instead of a blank result.
old="if(!rows.length)list.innerHTML='<div class=\"slx-bh-empty\">No matching targets.'+(lastError?'<br>'+esc(lastError):'')+'</div>';"
new="if(!rows.length){const known=lastRows.filter(x=>x.ff!=null).length,beat=lastRows.filter(x=>x.ff!=null&&x.ff>=num(S.minFF||1)&&x.ff<=num(S.maxFF||3)).length;list.innerHTML='<div class=\"slx-bh-empty\">No matching targets.<br>Board: '+lastRows.length+' · FF known: '+known+' · FF in range: '+beat+(lastError?'<br>'+esc(lastError):'')+'</div>';}"
if old not in s: raise SystemExit('empty-state anchor not found')
s=s.replace(old,new,1)

p.write_text(s)

# Docs + registry
md=Path('greasyfork/Bounty-Hunter.md')
t=md.read_text()
t=re.sub(r'\*\*v[^*]+\*\*','**v0.3.1**',t,count=1)
entry='''\n### v0.3.1 — API panel + zero-match diagnostics\n- Fixes the key/API button so the API panel opens immediately below the Bounty Hunter header instead of below the clipped results area.\n- Reuses the active Torn/Hub API key for FFScouter by default, matching FFScouter's registered-key model.\n- Adds a Test FFScouter button and visible FF-known / FF-beatable counters.\n- Fixes Safe mode so API targets with temporarily unknown Torn status are controlled by Hide unknown instead of being silently removed.\n- Migrates stale v0.2.x defaults (50k reward, 20s refresh, 8 pages, FF 0/0) to the intended v0.3.x defaults once.\n'''
if '### v0.3.1' not in t:t=t.replace('## Changelog','## Changelog'+entry)
md.write_text(t)

rp=Path('scripts.json')
data=json.loads(rp.read_text())
for x in data.get('scripts',[]):
    if x.get('id')=='bounty-hunter':
        x['version']='0.3.1'
        x['release']={'version':'0.3.1','date':'2026-10-05','notes':['Fixes the API/key panel visibility in TornPDA.','Adds FFScouter test and FF-known/beatable diagnostics.','Fixes Safe-mode unknown-status filtering and migrates stale v0.2.x defaults.']}
        break
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('updated Bounty Hunter to v0.3.1')
