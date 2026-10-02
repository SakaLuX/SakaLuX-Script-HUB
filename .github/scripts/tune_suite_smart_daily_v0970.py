#!/usr/bin/env python3
from pathlib import Path

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')

# Visiting a shop/wheel page is only an observation, not proof the daily action is complete.
s=s.replace("!(type==='wheels' && /^wheel_/.test(t.id))","!(type==='wheels' && /^wheel_/.test(t.id)) && !(type==='shops' && t.id==='shops')",1)

# /user/log is an optional accuracy layer requiring Full Access. Do not make the otherwise-successful sync look failed if log permission is missing.
old="results.forEach((r,i)=>{ const name=entries[i][0]; if(r.status==='fulfilled'){ok++;state.lastData[name]=r.value;try{interpretV3(name,r.value);}catch(e){err=String(e?.message||e);}} else err=String(r.reason?.message||r.reason||'API error'); });"
new="results.forEach((r,i)=>{ const name=entries[i][0]; if(r.status==='fulfilled'){ok++;state.lastData[name]=r.value;try{interpretV3(name,r.value);}catch(e){if(name!=='logs')err=String(e?.message||e);}} else if(name!=='logs') err=String(r.reason?.message||r.reason||'API error'); });"
if old not in s:
    raise SystemExit('refresh result handler not found')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
