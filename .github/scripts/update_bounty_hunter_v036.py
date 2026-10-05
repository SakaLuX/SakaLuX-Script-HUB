from pathlib import Path
import re, json

p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()

s=s.replace('// @version      0.3.5','// @version      0.3.6',1)
s=s.replace("let v = '0.3.5';","let v = '0.3.6';",1)
s=s.replace("const VERSION='0.3.5'","const VERSION='0.3.6'",1)

old_norm=re.search(r"function normalizeUserBasic\(j,id\)\{.*?\}\nasync function enrichOne",s,re.S)
if not old_norm:
    raise SystemExit('normalizeUserBasic block not found')
new_norm="""function normalizeUserBasic(j,id){const u=j?.user||j?.profile||j||{},st=u.status||{},tr=u.travel||u.travel_info||u.traveling||{},loc=u.location||{};let until=num(st?.until||st?.timestamp||0);if(until>1e12)until=Math.floor(until/1000);const statusBits=[typeof st==='object'?[st.state,st.description,st.details].filter(Boolean).join(' '):String(st||''),typeof tr==='object'?[tr.state,tr.status,tr.destination,tr.destination_name,tr.country,tr.description].filter(Boolean).join(' '):String(tr||''),typeof loc==='object'?[loc.name,loc.country,loc.description].filter(Boolean).join(' '):String(loc||'')].filter(Boolean).join(' ');let status=statusOf(statusBits);if(status==='Unknown'&&tr&&typeof tr==='object'&&Object.keys(tr).length)status='Abroad';return{id:String(id),name:String(u.name||u.player_name||u.playername||''),level:u.level==null?null:num(u.level),status,hospitalUntil:until,lastAction:String(u.last_action?.relative||u.last_action?.status||''),travelText:typeof tr==='object'?String(tr.destination_name||tr.destination||tr.country||tr.status||tr.state||''):String(tr||'')}}
async function enrichOne"""
s=s[:old_norm.start()]+new_norm+s[old_norm.end():]

old_enrich=re.search(r"async function enrichRows\(rows,force=false\)\{.*?\}\nfunction hospLeft",s,re.S)
if not old_enrich:
    raise SystemExit('enrichRows block not found')
new_enrich="""async function enrichRows(rows,force=false){const key=getKey();if(!S.liveEnrich||!key||!rows.length)return rows;const n=Math.max(1,Math.min(25,num(S.enrichCount)||12)),candidate=rows.filter(x=>x.reward>=num(S.minReward)&&(!S.onlyBeatable||x.ff==null||(x.ff>=num(S.minFF||1)&&x.ff<=num(S.maxFF||3)))&&(x.level==null||x.level<=num(S.maxLevel||100))).sort((a,b)=>b.reward-a.reward),top=(candidate.length?candidate:rows).slice(0,n),map=new Map(rows.map(x=>[x.id,x]));for(let i=0;i<top.length;i+=4){const chunk=top.slice(i,i+4),got=await Promise.all(chunk.map(x=>enrichOne(x,key,force)));got.forEach(x=>map.set(x.id,x))}return rows.map(x=>map.get(x.id)||x)}
function hospLeft"""
s=s[:old_enrich.start()]+new_enrich+s[old_enrich.end():]

old_collect=re.search(r"async function collect\(force=false\)\{.*?\}\nfunction bestRows",s,re.S)
if not old_collect:
    raise SystemExit('collect block not found')
new_collect="""async function collect(force=false){lastError='';let rows=[];const key=getKey(),wantApi=S.fullBoard&&S.source!=='dom'&&!!key;try{if(wantApi){rows=mergeDomHints(await fetchFullBoard(force));lastSource='API'}else{rows=scanDom();lastSource=S.source==='api'?'DOM fallback':'DOM'}try{if(getFFKey()&&rows.length)await enrichFF(rows)}catch(e){lastError=(lastError?lastError+' · ':'')+(e.message||String(e))}rows=await enrichRows(rows,force&&S.liveEnrich)}catch(e){lastError=e.message||String(e);if(wantApi&&CACHE.rows?.length){rows=mergeDomHints(CACHE.rows);lastBountyRecords=num(CACHE.records)||rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);lastSource='API cache';try{if(getFFKey()&&rows.length)await enrichFF(rows)}catch(ff){lastError+=' · '+(ff.message||String(ff))}try{rows=await enrichRows(rows,false)}catch{}}else{rows=scanDom();lastSource='DOM fallback';try{if(getFFKey()&&rows.length)await enrichFF(rows)}catch(ff){lastError+=' · '+(ff.message||String(ff))}try{rows=await enrichRows(rows,false)}catch{}}}lastRows=rows;lastBountyRecords=lastSource.startsWith('API')?(lastBountyRecords||rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0)):rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);return rows}
function bestRows"""
s=s[:old_collect.start()]+new_collect+s[old_collect.end():]

# Show travel destination/status when known.
s=s.replace("const tags=[x.status,x.level!=null?'L'+x.level:'',x.ff!=null?'FF '+x.ff:'',x.bs!=null?'BS '+fmt(x.bs).replace('$',''):'',x.count+' bounty'+(x.count===1?'':'ies'),x.lastAction||''].filter(Boolean);",
"const tags=[x.status==='Unknown'?'Status ?':x.status,(x.status==='Abroad'&&x.travelText)?('→ '+x.travelText):'',x.level!=null?'L'+x.level:'',x.ff!=null?'FF '+x.ff:'',x.bs!=null?'BS '+fmt(x.bs).replace('$',''):'',x.count+' bounty'+(x.count===1?'':'ies'),x.lastAction||''].filter(Boolean);",1)

p.write_text(s)

# changelog
cp=Path('CHANGELOG.md')
if cp.exists():
    c=cp.read_text()
    note="""\n## Bounty Hunter v0.3.6\n- Live status enrichment now runs after FFScouter enrichment, so displayed/beatable candidates are checked first instead of unrelated high-reward targets.\n- Travel/flying data from Torn user responses is recognized as Abroad and can show a destination hint.\n- Full-board API failures now reuse the last API cache before falling back to the small DOM list.\n- Abroad targets remain excluded from attack results.\n"""
    if 'Bounty Hunter v0.3.6' not in c:
        cp.write_text(note+c)

# registry
sp=Path('scripts.json')
if sp.exists():
    data=json.loads(sp.read_text())
    changed=False
    if isinstance(data,list):
        for x in data:
            if isinstance(x,dict) and x.get('id')=='bounty-hunter': x['version']='0.3.6'; changed=True
    elif isinstance(data,dict):
        arr=data.get('scripts',[])
        for x in arr:
            if isinstance(x,dict) and x.get('id')=='bounty-hunter': x['version']='0.3.6'; changed=True
    if changed: sp.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
