from pathlib import Path
import json,re

p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()

s=re.sub(r'// @version\s+\S+','// @version      0.3.5',s,count=1)
s=re.sub(r"let v = '[^']+';","let v = '0.3.5';",s,count=1)
s=re.sub(r"const VERSION='[^']+'","const VERSION='0.3.5'",s,count=1)

old="""async function fetchFullBoard(force=false){const key=getKey();if(!key)throw new Error('No Torn API key. Add one in API settings or Script Hub.');if(!force&&CACHE.rows?.length&&Date.now()-num(CACHE.at)<30000){lastBountyRecords=num(CACHE.records)||CACHE.rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);return CACHE.rows}const map=new Map(),pages=Math.max(1,Math.min(100,num(S.maxPages)||60));let records=0;for(let p=0;p<pages;p++){const list=apiList(await fetchPage(p*100,key));records+=list.length;for(const b of list){const x=normalizeApiBounty(b);if(!x||!x.reward)continue;const old=map.get(x.id)||x;if(old!==x){old.reward+=x.reward;old.count+=1;if(old.status==='Unknown'&&x.status!=='Unknown')old.status=x.status;if(!old.hospitalUntil&&x.hospitalUntil)old.hospitalUntil=x.hospitalUntil}map.set(x.id,old)}if(list.length<100)break}const rows=[...map.values()];lastBountyRecords=records;CACHE={rows,records,at:Date.now()};saveCache();return rows}"""
new="""async function fetchFullBoard(force=false){const key=getKey();if(!key)throw new Error('No Torn API key. Add one in API settings or Script Hub.');if(!force&&CACHE.rows?.length&&Date.now()-num(CACHE.at)<30000){lastBountyRecords=num(CACHE.records)||CACHE.rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);return CACHE.rows}const map=new Map(),pages=Math.max(1,Math.min(100,num(S.maxPages)||60));let records=0,nextOffset=0,partialError='';for(let p=0;p<pages;p++){let data=null,err=null;for(let attempt=0;attempt<3;attempt++){try{data=await fetchPage(nextOffset,key);err=null;break}catch(e){err=e;if(attempt<2)await new Promise(r=>setTimeout(r,900*(attempt+1)))}}if(!data){partialError=err?.message||String(err||'API page failed');if(records>0)break;throw err||new Error(partialError)}const list=apiList(data);records+=list.length;for(const b of list){const x=normalizeApiBounty(b);if(!x||!x.reward)continue;const old=map.get(x.id)||x;if(old!==x){old.reward+=x.reward;old.count+=1;if(old.status==='Unknown'&&x.status!=='Unknown')old.status=x.status;if(!old.hospitalUntil&&x.hospitalUntil)old.hospitalUntil=x.hospitalUntil}map.set(x.id,old)}const next=data?._metadata?.links?.next||data?.metadata?.links?.next||'';if(!next||list.length===0)break;try{const u=new URL(next,'https://api.torn.com');const o=Number(u.searchParams.get('offset'));nextOffset=Number.isFinite(o)&&o>nextOffset?o:nextOffset+list.length}catch{nextOffset+=list.length}if(list.length<100&&!next)break;if(p<pages-1)await new Promise(r=>setTimeout(r,250))}const rows=[...map.values()];lastBountyRecords=records;CACHE={rows,records,at:Date.now()};saveCache();if(partialError)lastError=(lastError?lastError+' · ':'')+'API partial after '+records+' bounties: '+partialError;return rows}"""
if old not in s: raise SystemExit('fetchFullBoard anchor not found')
s=s.replace(old,new,1)

old_collect="""async function collect(force=false){lastError='';let rows=[];const key=getKey(),wantApi=S.fullBoard&&S.source!=='dom'&&!!key;try{if(wantApi){rows=mergeDomHints(await fetchFullBoard(force));lastSource='API'}else{rows=scanDom();lastSource=S.source==='api'?'DOM fallback':'DOM'}rows=await enrichRows(rows,force&&S.liveEnrich)}catch(e){lastError=e.message||String(e);rows=scanDom();lastSource='DOM fallback'}try{if(getFFKey()&&rows.length)await enrichFF(rows)}catch(e){lastError=(lastError?lastError+' · ':'')+(e.message||String(e))}lastRows=rows;lastBountyRecords=lastSource==='API'?(lastBountyRecords||rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0)):rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);return rows}"""
new_collect="""async function collect(force=false){lastError='';let rows=[];const key=getKey(),wantApi=S.fullBoard&&S.source!=='dom'&&!!key;try{if(wantApi){rows=mergeDomHints(await fetchFullBoard(force));lastSource=lastError?.startsWith('API partial')?'API partial':'API'}else{rows=scanDom();lastSource=S.source==='api'?'DOM fallback':'DOM'}rows=await enrichRows(rows,force&&S.liveEnrich)}catch(e){lastError=e.message||String(e);rows=scanDom();lastSource='DOM fallback'}try{if(getFFKey()&&rows.length)await enrichFF(rows)}catch(e){lastError=(lastError?lastError+' · ':'')+(e.message||String(e))}lastRows=rows;if(!lastSource.startsWith('API'))lastBountyRecords=rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);else if(!lastBountyRecords)lastBountyRecords=rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);return rows}"""
if old_collect not in s: raise SystemExit('collect anchor not found')
s=s.replace(old_collect,new_collect,1)

# Improve status wording in target cards so Unknown is self-explanatory.
s=s.replace("const tags=[x.status,x.level!=null?'L'+x.level:''","const tags=[x.status==='Unknown'?'Status ?':x.status,x.level!=null?'L'+x.level:''",1)

# Tooltip/title for reward and status area.
s=s.replace("left.innerHTML='<div class=\"name\">'+esc(x.name)+' <small>['+esc(x.id)+']</small></div><div class=\"meta\">'","left.innerHTML='<div class=\"name\">'+esc(x.name)+' <small>['+esc(x.id)+']</small></div><div class=\"meta\" title=\"Status ? means Torn did not provide a current status; enable Live status to enrich it.\">'",1)
s=s.replace("'<div class=\"money\">'+fmt(x.reward)+'</div>'","'<div class=\"money\" title=\"Combined reward of '+x.count+' bounty'+(x.count===1?'':'ies')+' on this player\">'+fmt(x.reward)+'</div>'",1)

p.write_text(s)

md=Path('greasyfork/Bounty-Hunter.md')
t=md.read_text()
t=re.sub(r'\*\*v[^*]+\*\*','**v0.3.5**',t,count=1)
entry='''\n### v0.3.5 — Reliable full-board paging + clearer target cards\n- Follows Torn API v2 `_metadata.links.next` pagination instead of blindly requesting every numeric offset.\n- Adds 250 ms page pacing and up to three attempts per page to reduce rate-limit failures on 4k+ bounty boards.\n- Keeps already-fetched API data if a later page fails (`API partial`) instead of discarding everything and falling back to the small DOM list.\n- Target cards now show `Status ?` instead of ambiguous `Unknown`; Live status can enrich it.\n- Reward tooltip clarifies that the green amount is the combined reward of all grouped bounties on that player.\n'''
if '### v0.3.5' not in t:t=t.replace('## Changelog','## Changelog'+entry)
md.write_text(t)

rp=Path('scripts.json')
data=json.loads(rp.read_text())
for x in data.get('scripts',[]):
    if x.get('id')=='bounty-hunter':
        x['version']='0.3.5'
        x['release']={'version':'0.3.5','date':'2026-10-05','notes':['Reliable full-board paging follows Torn API next links with pacing/retries.','Keeps partial API results instead of dropping to DOM after a later page failure.','Clarifies Status ? and grouped total bounty reward on target cards.']}
        break
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('updated Bounty Hunter to v0.3.5')
