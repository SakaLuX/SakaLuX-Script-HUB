from pathlib import Path
import json,re
p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()
s=s.replace('@version      0.3.6','@version      0.3.7').replace("let v = '0.3.6';","let v = '0.3.7';").replace("const VERSION='0.3.6'","const VERSION='0.3.7'")
old="""async function enrichOne(x,key,force=false){const c=UCACHE[x.id];if(!force&&c&&Date.now()-num(c.at)<30000)return{...x,...c.data,ff:x.ff,bs:x.bs};try{const j=await reqJson('https://api.torn.com/v2/user/'+encodeURIComponent(x.id)+'/basic?striptags=true&key='+encodeURIComponent(key),20000);const d=normalizeUserBasic(j,x.id);UCACHE[x.id]={at:Date.now(),data:d};saveUsers();return{...x,name:d.name||x.name,level:d.level??x.level,status:d.status!=='Unknown'?d.status:x.status,hospitalUntil:d.hospitalUntil||x.hospitalUntil,lastAction:d.lastAction||x.lastAction}}catch{return x}}"""
new="""async function enrichOne(x,key,force=false){const c=UCACHE[x.id];if(!force&&c&&Date.now()-num(c.at)<30000)return{...x,...c.data,ff:x.ff,bs:x.bs};let d=null;try{const j=await reqJson('https://api.torn.com/v2/user/'+encodeURIComponent(x.id)+'/basic?striptags=true&key='+encodeURIComponent(key),20000);d=normalizeUserBasic(j,x.id)}catch{}if(!d||d.status==='Unknown'){try{const j1=await reqJson('https://api.torn.com/user/'+encodeURIComponent(x.id)+'?selections=basic&key='+encodeURIComponent(key),15000);const d1=normalizeUserBasic(j1,x.id);if(!d||d1.status!=='Unknown')d=d1}catch{}}if(!d)return x;UCACHE[x.id]={at:Date.now(),data:d};saveUsers();return{...x,name:d.name||x.name,level:d.level??x.level,status:d.status!=='Unknown'?d.status:x.status,hospitalUntil:d.hospitalUntil||x.hospitalUntil,lastAction:d.lastAction||x.lastAction,travelText:d.travelText||x.travelText||''}}"""
if old not in s: raise SystemExit('enrichOne anchor missing')
s=s.replace(old,new)
old2="""if(S.hideUnknown&&x.status==='Unknown')return false;if(x.status==='Okay'&&!S.okay)return false;if(x.status==='Hospital'&&!S.hospital)return false;if(['Jail','Abroad','Federal'].includes(x.status))return false;if(x.status==='Hospital'&&num(S.hospitalWindowMin)>0&&hospLeft(x)>num(S.hospitalWindowMin)*60&&!WATCH[x.id])return false;"""
new2="""if(S.hideUnknown&&x.status==='Unknown')return false;if(x.status==='Okay'&&!S.okay)return false;if(x.status==='Hospital'&&!S.hospital)return false;if(['Jail','Abroad','Federal'].includes(x.status))return false;if(x.status==='Hospital'&&num(S.hospitalWindowMin)>0&&!WATCH[x.id]){const left=hospLeft(x);if(!num(x.hospitalUntil)||left<=0||left>num(S.hospitalWindowMin)*60)return false;}"""
if old2 not in s: raise SystemExit('allowed anchor missing')
s=s.replace(old2,new2)
old3="""const n=Math.max(1,Math.min(25,num(S.enrichCount)||12)),candidate=rows.filter"""
new3="""const n=Math.max(1,Math.min(40,Math.max(num(S.enrichCount)||12,24))),candidate=rows.filter"""
if old3 not in s: raise SystemExit('enrich count anchor missing')
s=s.replace(old3,new3)
p.write_text(s)
sp=Path('scripts.json')
if sp.exists():
    data=json.loads(sp.read_text())
    changed=False
    if isinstance(data,list):
        for it in data:
            if isinstance(it,dict) and it.get('id')=='bounty-hunter': it['version']='0.3.7'; changed=True
    elif isinstance(data,dict):
        seq=data.get('scripts') if isinstance(data.get('scripts'),list) else []
        for it in seq:
            if isinstance(it,dict) and it.get('id')=='bounty-hunter': it['version']='0.3.7'; changed=True
    if changed: sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
cp=Path('CHANGELOG.md')
if not cp.exists(): cp.write_text('# Changelog\n')
c=cp.read_text()
note='''\n## Bounty Hunter v0.3.7\n- Live status now falls back to Torn API v1 basic when API v2 basic does not expose a usable status, fixing Traveling/Abroad targets showing as `Status ?`.\n- Hospital window is now strict: when set to 5 minutes, hospital targets are shown only when a valid release timestamp exists and is within 5 minutes. Unknown hospital release times are hidden instead of being treated as 0 minutes.\n- Live enrichment checks at least 24 likely beatable candidates (up to 40) so displayed targets are much less likely to remain unverified.\n- Travel destination metadata is preserved on enriched targets.\n'''
if 'Bounty Hunter v0.3.7' not in c: cp.write_text(c.rstrip()+"\n"+note)
