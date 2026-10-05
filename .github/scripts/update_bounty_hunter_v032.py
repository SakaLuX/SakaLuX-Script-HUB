from pathlib import Path
import json,re

p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()

# Version sync
s=re.sub(r'// @version\s+\S+','// @version      0.3.2',s,count=1)
s=re.sub(r"let v = '[^']+';","let v = '0.3.2';",s,count=1)
s=re.sub(r"const VERSION='[^']+'","const VERSION='0.3.2'",s,count=1)

# Repair the bad 1..1 FF range that could be persisted by the previous numeric binding/migration.
anchor="try{const mk='SLX_BOUNTY_MIGRATED_031';"
if anchor not in s: raise SystemExit('031 migration anchor not found')
insert="try{const mk='SLX_BOUNTY_MIGRATED_032';if(!localStorage.getItem(mk)){if(num(S.minFF)===1&&num(S.maxFF)===1)S.maxFF=3;if(num(S.maxFF)<num(S.minFF))S.maxFF=Math.max(3,num(S.minFF));localStorage.setItem(mk,'1');W(KS,S)}}catch{}\n"
s=s.replace(anchor,insert+anchor,1)

# Core broker failure must not force DOM fallback. Try broker, then direct Torn API fetch.
old="async function reqJson(url,ttl=8000){const core=window.SakaLuXCore?.api;if(core?.requestJson)return core.requestJson({url,ttl,retries:1,timeout:12000,throwApiError:true});const r=await fetch(url,{credentials:'omit'});if(!r.ok)throw new Error('Torn API HTTP '+r.status);const j=await r.json();if(j?.error)throw new Error(j.error.error||j.error.message||'Torn API error');return j}"
new="async function reqJson(url,ttl=8000){const core=window.SakaLuXCore?.api;let coreErr='';if(core?.requestJson){try{const j=await core.requestJson({url,ttl,retries:1,timeout:12000,throwApiError:true});if(j?.error)throw new Error(j.error.error||j.error.message||'Torn API error');return j}catch(e){coreErr=e?.message||String(e)}}try{const r=await fetch(url,{credentials:'omit',headers:{Accept:'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(j?.error)throw new Error(j.error.error||j.error.message||'Torn API error');return j}catch(e){throw new Error('Torn API failed'+(coreErr?' · broker: '+coreErr:'')+' · direct: '+(e?.message||e))}}"
if old not in s: raise SystemExit('reqJson anchor not found')
s=s.replace(old,new,1)

# API v2 fallback: path selection first, generic selections endpoint second.
old="async function fetchPage(offset,key){return reqJson('https://api.torn.com/v2/torn/bounties?limit=100&offset='+offset+'&key='+encodeURIComponent(key),8000)}"
new="async function fetchPage(offset,key){const q='limit=100&offset='+offset+'&key='+encodeURIComponent(key);try{return await reqJson('https://api.torn.com/v2/torn/bounties?'+q,8000)}catch(e1){try{return await reqJson('https://api.torn.com/v2/torn?selections=bounties&'+q,8000)}catch(e2){throw new Error((e1?.message||e1)+' · fallback: '+(e2?.message||e2))}}}"
if old not in s: raise SystemExit('fetchPage anchor not found')
s=s.replace(old,new,1)

# Preserve the API error in DOM fallback diagnostics instead of clearing it later.
# collect() already assigns lastError on API failure; make sure successful DOM scan doesn't hide it.
s=s.replace("lastSource='DOM fallback';rows=scanDom()","lastSource='DOM fallback';rows=scanDom()")

# Make the UI self-heal invalid beatable range at render/filter time.
old="function allowed(x){if(BLACK[x.id])return false;"
new="function allowed(x){if(S.onlyBeatable&&num(S.maxFF)<num(S.minFF)){S.maxFF=Math.max(3,num(S.minFF));save()}if(BLACK[x.id])return false;"
if old not in s: raise SystemExit('allowed anchor not found')
s=s.replace(old,new,1)

# Add a one-tap conservative preset chip near Beatable only.
needle="chip('Beatable only',S.onlyBeatable,()=>{S.onlyBeatable=!S.onlyBeatable;save();rebuild();render(false)}),"
if needle not in s: raise SystemExit('Beatable chip anchor not found')
s=s.replace(needle,needle+"chip('Safe FF 1–3',num(S.minFF)===1&&num(S.maxFF)===3,()=>{S.minFF=1;S.maxFF=3;S.onlyBeatable=true;S.includeUnknownFF=false;save();rebuild();render(false)}),",1)

# More useful footer source diagnostics.
s=s.replace("lastSource+(getKey()?' · Torn API ✓':' · Torn API ✕')+(getFFKey()?' · FFScouter ✓':' · FFScouter ✕')","lastSource+(getKey()?' · Torn API ✓':' · Torn API ✕')+(getFFKey()?' · FFScouter ✓':' · FFScouter ✕')+(lastError?' · ERROR':'')")

p.write_text(s)

# Docs
md=Path('greasyfork/Bounty-Hunter.md')
t=md.read_text()
t=re.sub(r'\*\*v[^*]+\*\*','**v0.3.2**',t,count=1)
entry='''\n### v0.3.2 — Full-board recovery + FF range repair\n- Repairs the accidentally persisted `FF 1.0–1.0` range to the intended conservative `1.0–3.0` preset.\n- Adds a one-tap `Safe FF 1–3` preset.\n- Torn API requests now fall back from Shared Core broker to direct fetch instead of immediately dropping to DOM mode.\n- Adds a second API v2 URL fallback (`/v2/torn?selections=bounties`) if the dedicated `/v2/torn/bounties` path fails.\n- Keeps API errors visible in diagnostics so `DOM fallback` is actionable rather than silent.\n'''
if '### v0.3.2' not in t:t=t.replace('## Changelog','## Changelog'+entry)
md.write_text(t)

# Registry
rp=Path('scripts.json')
data=json.loads(rp.read_text())
for x in data.get('scripts',[]):
    if x.get('id')=='bounty-hunter':
        x['version']='0.3.2'
        x['release']={'version':'0.3.2','date':'2026-10-05','notes':['Repairs the persisted 1.0–1.0 FF range and adds Safe FF 1–3 preset.','Adds Shared Core → direct fetch API recovery and a second Torn API v2 bounty URL fallback.','Keeps API fallback errors visible in diagnostics.']}
        break
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('updated Bounty Hunter to v0.3.2')
