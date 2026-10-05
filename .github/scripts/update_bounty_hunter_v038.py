from pathlib import Path
import json,re
p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()
s=s.replace('@version      0.3.7','@version      0.3.8').replace("let v = '0.3.7';","let v = '0.3.8';").replace("const VERSION='0.3.7'","const VERSION='0.3.8'")

old_enrich=re.search(r"async function enrichOne\(x,key,force=false\)\{.*?\}\nasync function enrichRows",s,re.S)
if not old_enrich: raise SystemExit('enrichOne block missing')
new_enrich="""async function enrichOne(x,key,force=false){const c=UCACHE[x.id];if(!force&&c&&Date.now()-num(c.at)<30000)return{...x,...c.data,ff:x.ff,bs:x.bs};let d=null,last='';const tries=[
 'https://api.torn.com/v2/user/'+encodeURIComponent(x.id)+'/basic?striptags=true&key='+encodeURIComponent(key),
 'https://api.torn.com/v2/user/'+encodeURIComponent(x.id)+'?selections=basic&striptags=true&key='+encodeURIComponent(key),
 'https://api.torn.com/user/'+encodeURIComponent(x.id)+'?selections=basic&key='+encodeURIComponent(key),
 'https://api.torn.com/user/'+encodeURIComponent(x.id)+'?selections=profile&key='+encodeURIComponent(key)
];for(const url of tries){try{const j=await reqJson(url,12000);const z=normalizeUserBasic(j,x.id);if(!d||z.status!=='Unknown')d=z;if(z.status!=='Unknown')break}catch(e){last=e?.message||String(e)}}if(!d){return{...x,statusCheckError:last||'No status response'}}UCACHE[x.id]={at:Date.now(),data:d};saveUsers();return{...x,name:d.name||x.name,level:d.level??x.level,status:d.status!=='Unknown'?d.status:x.status,hospitalUntil:d.hospitalUntil||x.hospitalUntil,lastAction:d.lastAction||x.lastAction,travelText:d.travelText||x.travelText||'',statusVerified:d.status!=='Unknown',statusCheckError:d.status==='Unknown'?(last||'Status unavailable'):''}}
async function enrichRows"""
s=s[:old_enrich.start()]+new_enrich+s[old_enrich.end():]

old_rows=re.search(r"async function enrichRows\(rows,force=false\)\{.*?\}\nfunction hospLeft",s,re.S)
if not old_rows: raise SystemExit('enrichRows block missing')
new_rows="""async function enrichRows(rows,force=false){const key=getKey();if((!S.liveEnrich&&!S.onlyBeatable)||!key||!rows.length)return rows;const candidate=rows.filter(x=>!BLACK[x.id]&&x.reward>=num(S.minReward)&&(x.level==null||x.level<=num(S.maxLevel||100))&&(!S.onlyBeatable||x.ff==null||(x.ff>=num(S.minFF||1)&&x.ff<=num(S.maxFF||3)))&&(!S.maxBS||x.bs==null||x.bs<=num(S.maxBS))).sort((a,b)=>b.reward-a.reward);const maxCheck=Math.max(24,Math.min(80,Math.max(num(S.enrichCount)||12,20)*3)),top=(candidate.length?candidate:rows).slice(0,maxCheck),map=new Map(rows.map(x=>[x.id,x]));let ready=0;for(let i=0;i<top.length;i+=4){const chunk=top.slice(i,i+4),got=await Promise.all(chunk.map(x=>enrichOne(x,key,force)));for(const x of got){map.set(x.id,x);const left=num(x.hospitalUntil)-Math.floor(Date.now()/1000),ok=x.status==='Okay'||(x.status==='Hospital'&&num(S.hospitalWindowMin)>=0&&num(x.hospitalUntil)>0&&left>0&&(num(S.hospitalWindowMin)===0||left<=num(S.hospitalWindowMin)*60));if(ok)ready++}if(ready>=20)break}return rows.map(x=>map.get(x.id)||x)}
function hospLeft"""
s=s[:old_rows.start()]+new_rows+s[old_rows.end():]

old_allowed=re.search(r"function allowed\(x\)\{.*?\}\nfunction score",s,re.S)
if not old_allowed: raise SystemExit('allowed block missing')
new_allowed="""function allowed(x){if(BLACK[x.id]||!textMatch(x))return false;if(S.watchOnly&&!WATCH[x.id])return false;if(x.reward<num(S.minReward))return false;if(x.level!=null&&x.level>num(S.maxLevel||100))return false;if(S.onlyBeatable){if(x.ff==null&&!S.includeUnknownFF)return false;if(x.ff!=null&&(x.ff<num(S.minFF||1)||x.ff>num(S.maxFF||3)))return false;if(x.status==='Unknown')return false;}else if(S.maxFF>0&&x.ff!=null&&x.ff>S.maxFF)return false;if(S.maxBS>0&&x.bs!=null&&x.bs>S.maxBS)return false;if(S.hideUnknown&&x.status==='Unknown')return false;if(x.status==='Okay'&&!S.okay)return false;if(x.status==='Hospital'&&!S.hospital)return false;if(['Jail','Abroad','Federal'].includes(x.status))return false;if(x.status==='Hospital'&&num(S.hospitalWindowMin)>0){const left=hospLeft(x);if(!num(x.hospitalUntil)||left<=0||left>num(S.hospitalWindowMin)*60)return false;}if(S.mode==='safe'&&!['Okay','Hospital'].includes(x.status))return false;return true}
function score"""
s=s[:old_allowed.start()]+new_allowed+s[old_allowed.end():]

p.write_text(s)
sp=Path('scripts.json')
if sp.exists():
    data=json.loads(sp.read_text())
    seq=data if isinstance(data,list) else data.get('scripts',[]) if isinstance(data,dict) else []
    for it in seq:
        if isinstance(it,dict) and it.get('id')=='bounty-hunter': it['version']='0.3.8'
    sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
cp=Path('CHANGELOG.md')
if cp.exists():
    c=cp.read_text()
    note='''\n## Bounty Hunter v0.3.8\n- Beatable-only is now status-strict: Unknown status targets are never shown as attackable.\n- Hospital window no longer has a watchlist bypass; a 5-minute setting strictly hides hospital targets with more than 5 minutes remaining or without a valid release timestamp.\n- Live status validation now checks candidates progressively until it finds enough genuinely attack-ready targets instead of validating only a fixed top-24 reward list.\n- Status lookup now tries multiple Torn v2/v1 basic/profile routes for better TornPDA compatibility.\n'''
    if 'Bounty Hunter v0.3.8' not in c: cp.write_text(c.rstrip()+"\n"+note)
