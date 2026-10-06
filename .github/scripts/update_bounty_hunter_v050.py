from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bounty-Hunter.user.js'
REG=ROOT/'scripts.json'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
CORE=ROOT/'src/core/sakalux-core.js'
CHANGE=ROOT/'CHANGELOG.md'
DOC=ROOT/'greasyfork/Bounty-Hunter.md'
s=P.read_text(encoding='utf-8')

# Version surfaces, including the canonical installed-version fallback that was stale.
s=s.replace('@version      0.4.7','@version      0.5.0',1)
s=s.replace("let v = '0.4.2';","let v = '0.5.0';",1)
s=s.replace("const VERSION='0.4.7'","const VERSION='0.5.0'",1)

# Extend storage keys/settings registration.
s=s.replace(
"CORE?.settings?.register?.({id:ID,version:1,keys:['SLX_BOUNTY_SETTINGS_V3','SLX_BOUNTY_WATCH_V1','SLX_BOUNTY_BLACK_V1','SLX_BOUNTY_CACHE_V2','SLX_BOUNTY_USER_CACHE_V1']})",
"CORE?.settings?.register?.({id:ID,version:1,keys:['SLX_BOUNTY_SETTINGS_V3','SLX_BOUNTY_WATCH_V1','SLX_BOUNTY_BLACK_V1','SLX_BOUNTY_CACHE_V2','SLX_BOUNTY_USER_CACHE_V1','SLX_BOUNTY_FF_CACHE_V1','SLX_BOUNTY_SCAN_STATE_V1']})",
1
)
s=s.replace(
"const KS='SLX_BOUNTY_SETTINGS_V3',KW='SLX_BOUNTY_WATCH_V1',KB='SLX_BOUNTY_BLACK_V1',KK='SakaLuX_BOUNTY_API_KEY',KF='SakaLuX_BOUNTY_FFSCOUTER_KEY',KC='SLX_BOUNTY_CACHE_V2',KU='SLX_BOUNTY_USER_CACHE_V1';",
"const KS='SLX_BOUNTY_SETTINGS_V3',KW='SLX_BOUNTY_WATCH_V1',KB='SLX_BOUNTY_BLACK_V1',KK='SakaLuX_BOUNTY_API_KEY',KF='SakaLuX_BOUNTY_FFSCOUTER_KEY',KC='SLX_BOUNTY_CACHE_V2',KU='SLX_BOUNTY_USER_CACHE_V1',KFC='SLX_BOUNTY_FF_CACHE_V1',KSCAN='SLX_BOUNTY_SCAN_STATE_V1';",
1
)

# State: target FF cache + resumable scan + progress.
old="let S={...D,...J(KS,{})},WATCH=J(KW,{}),BLACK=J(KB,{}),CACHE=J(KC,{rows:[],at:0}),UCACHE=J(KU,{}),timer=0,tickTimer=0,lastRows=[],busy=false,lastError='',lastSource='DOM',lastBountyRecords=0,notified=new Map();"
new="let S={...D,...J(KS,{})},WATCH=J(KW,{}),BLACK=J(KB,{}),CACHE=J(KC,{rows:[],at:0}),UCACHE=J(KU,{}),FFCACHE=J(KFC,{}),SCAN=J(KSCAN,{nextOffset:0,records:0,at:0,delay:950}),PROG={stage:'idle',current:0,total:0,text:''},timer=0,tickTimer=0,lastRows=[],busy=false,lastError='',lastSource='DOM',lastBountyRecords=0,notified=new Map();"
if old not in s: raise SystemExit('state anchor missing')
s=s.replace(old,new,1)

s=s.replace(
"const save=()=>W(KS,S),saveLists=()=>{W(KW,WATCH);W(KB,BLACK)},saveCache=()=>W(KC,CACHE),saveUsers=()=>W(KU,UCACHE);",
"const save=()=>W(KS,S),saveLists=()=>{W(KW,WATCH);W(KB,BLACK)},saveCache=()=>W(KC,CACHE),saveUsers=()=>W(KU,UCACHE),saveFF=()=>W(KFC,FFCACHE),saveScan=()=>W(KSCAN,SCAN);",
1
)

# Progress helpers after formatter.
fmt_anchor="function fmt(n){n=num(n);if(n>=1e9)return'$'+(n/1e9).toFixed(n>=1e10?1:2)+'B';if(n>=1e6)return'$'+(n/1e6).toFixed(n>=1e7?1:2)+'M';if(n>=1e3)return'$'+Math.round(n/1e3)+'K';return'$'+Math.round(n).toLocaleString()}"
helpers=fmt_anchor+"""\nfunction setProgress(stage,current=0,total=0,text=''){PROG={stage,current:num(current),total:num(total),text:String(text||'')};const o=document.getElementById('slx-bh');if(!o)return;const p=o.querySelector('[data-progress]'),bar=o.querySelector('[data-progress-bar]');if(!p||!bar)return;const pct=PROG.total>0?Math.max(0,Math.min(100,Math.round(PROG.current/PROG.total*100))):0;p.hidden=stage==='idle';bar.style.width=pct+'%';const label=PROG.text||({board:'Scanning board',ff:'FFScouter',status:'Checking status',cooldown:'API cooldown'}[stage]||stage);p.querySelector('span').textContent=label+(PROG.total>0?' · '+PROG.current+'/'+PROG.total:'')}\nfunction adaptiveDelay(latency=0,rateLimited=false){let d=Math.max(800,Math.min(2200,num(SCAN.delay)||950));if(rateLimited)d=Math.min(2200,d+450);else if(latency>1200)d=Math.min(1800,d+150);else if(latency<550)d=Math.max(800,d-40);SCAN.delay=Math.round(d);saveScan();return SCAN.delay}\n"""
if fmt_anchor not in s: raise SystemExit('fmt anchor missing')
s=s.replace(fmt_anchor,helpers,1)

# Replace FF enrichment with 12h per-target cache and progress.
m=re.search(r"async function enrichFF\(rows\)\{.*?return rows\}",s,re.S)
if not m: raise SystemExit('enrichFF block missing')
new_ff="""async function enrichFF(rows){const key=getFFKey();if(!key||!rows.length)return rows;const out=new Map(rows.map(x=>[String(x.id),x])),ttl=12*60*60*1000,now=Date.now(),need=[];for(const [id,x] of out){const c=FFCACHE[id];if(c&&now-num(c.at)<ttl){if(c.ff!=null)x.ff=num(c.ff);if(c.bs!=null)x.bs=num(c.bs);x.ffSource='FFScouter cache'}else need.push(id)}let done=0;setProgress('ff',0,need.length,need.length?'FFScouter':'FF cache');for(let i=0;i<need.length;i+=205){const batch=need.slice(i,i+205),data=await externalJson('https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(key)+'&targets='+batch.join(','));if(data?.code)throw new Error('FFScouter: '+(data.error||('code '+data.code)));for(const f of (Array.isArray(data)?data:[])){const id=String(f.player_id),x=out.get(id);if(!x)continue;const ff=Number.isFinite(Number(f.fair_fight))?Number(f.fair_fight):null,bs=Number.isFinite(Number(f.bs_estimate))?Number(f.bs_estimate):null;if(ff!=null)x.ff=ff;if(bs!=null)x.bs=bs;x.ffSource='FFScouter';FFCACHE[id]={at:Date.now(),ff,bs}}done+=batch.length;setProgress('ff',Math.min(done,need.length),need.length,'FFScouter');if(i+205<need.length)await new Promise(r=>setTimeout(r,180))}if(need.length)saveFF();return rows}"""
s=s[:m.start()]+new_ff+s[m.end():]

# Replace full-board scanner with resumable adaptive paging.
m=re.search(r"async function fetchFullBoard\(force=false\)\{.*?\}\nfunction mergeDomHints",s,re.S)
if not m: raise SystemExit('fetchFullBoard block missing')
new_full="""async function fetchFullBoard(force=false){const key=getKey();if(!key)throw new Error('No Torn API key. Add one in API settings or Script Hub.');const age=Date.now()-num(CACHE.at),rateUntil=getRateUntil();if(CACHE.rows?.length&&((!force&&age<120000)||rateUntil>Date.now())){lastBountyRecords=num(CACHE.records)||CACHE.rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);if(rateUntil>Date.now()){lastError='Rate limited · using cached board · retry in '+rateWaitText();setProgress('cooldown',0,0,'API cooldown '+rateWaitText())}return CACHE.rows}const resumeFresh=num(SCAN.nextOffset)>0&&Date.now()-num(SCAN.at)<10*60*1000&&CACHE.rows?.length, map=new Map((resumeFresh?CACHE.rows:[]).map(x=>[String(x.id),{...x}])),pages=Math.max(1,Math.min(100,num(S.maxPages)||60));let records=resumeFresh?num(SCAN.records):0,nextOffset=resumeFresh?num(SCAN.nextOffset):0,partialError='',donePages=0;setProgress('board',records,Math.max(records+100,(pages*100)),'Scanning board'+(resumeFresh?' · resumed':''));for(let p=0;p<pages;p++){let data=null,err=null;const started=performance.now();try{data=await fetchPage(nextOffset,key);adaptiveDelay(performance.now()-started,false)}catch(e){err=e;if(isRateLimitError(e)){setRateCooldown();adaptiveDelay(0,true);partialError='Rate limited · retry in '+rateWaitText();setProgress('cooldown',0,0,'API cooldown '+rateWaitText());break}for(let attempt=0;attempt<2&&!data;attempt++){await new Promise(r=>setTimeout(r,1400*(attempt+1)));try{const rs=performance.now();data=await fetchPage(nextOffset,key);adaptiveDelay(performance.now()-rs,false);err=null}catch(ex){err=ex;if(isRateLimitError(ex)){setRateCooldown();adaptiveDelay(0,true);partialError='Rate limited · retry in '+rateWaitText();setProgress('cooldown',0,0,'API cooldown '+rateWaitText());break}}}}if(!data){if(!partialError)partialError=err?.message||String(err||'API page failed');break}const list=apiList(data);records+=list.length;donePages++;for(const b of list){const x=normalizeApiBounty(b);if(!x||!x.reward)continue;const old=map.get(x.id)||x;if(old!==x){old.reward+=x.reward;old.count+=1;if(old.status==='Unknown'&&x.status!=='Unknown')old.status=x.status;if(!old.hospitalUntil&&x.hospitalUntil)old.hospitalUntil=x.hospitalUntil}map.set(x.id,old)}const next=data?._metadata?.links?.next||data?.metadata?.links?.next||'';let nextCandidate=nextOffset+list.length;try{if(next){const u=new URL(next,'https://api.torn.com'),o=Number(u.searchParams.get('offset'));if(Number.isFinite(o)&&o>nextOffset)nextCandidate=o}}catch{}nextOffset=nextCandidate;SCAN={...SCAN,nextOffset,records,at:Date.now()};saveScan();const partial=[...map.values()];CACHE={rows:partial,records,at:Date.now(),partial:true};saveCache();setProgress('board',records,Math.max(records+100,pages*100),'Scanning board');if(!next||list.length===0||list.length<100){SCAN={nextOffset:0,records:0,at:Date.now(),delay:SCAN.delay};saveScan();CACHE={rows:partial,records,at:Date.now(),partial:false};saveCache();lastBountyRecords=records;setProgress('board',records,records,'Board complete');return partial}if(p<pages-1)await new Promise(r=>setTimeout(r,adaptiveDelay()))}const rows=[...map.values()];if(rows.length){lastBountyRecords=records;CACHE={rows,records,at:Date.now(),partial:true};saveCache()}if(partialError)lastError=(records?'API partial after '+records+' bounties · ':'')+partialError;return rows.length?rows:(CACHE.rows||[])}\nfunction mergeDomHints"""
s=s[:m.start()]+new_full+s[m.end():]

# Add live-status progress to enrichRows by replacing the function.
m=re.search(r"async function enrichRows\(rows,force=false\)\{.*?\}\nfunction hospLeft",s,re.S)
if not m: raise SystemExit('enrichRows block missing')
new_rows="""async function enrichRows(rows,force=false){const key=getKey();if((!S.liveEnrich&&!S.onlyBeatable)||!key||!rows.length)return rows;const candidate=rows.filter(x=>!BLACK[x.id]&&x.reward>=num(S.minReward)&&(x.level==null||x.level<=num(S.maxLevel||100))&&(!S.onlyBeatable||x.ff==null||(x.ff>=num(S.minFF||1)&&x.ff<=num(S.maxFF||3)))&&(!S.maxBS||x.bs==null||x.bs<=num(S.maxBS))).sort((a,b)=>b.reward-a.reward),maxCheck=Math.max(24,Math.min(80,Math.max(num(S.enrichCount)||12,20)*3)),top=(candidate.length?candidate:rows).slice(0,maxCheck),map=new Map(rows.map(x=>[x.id,x]));let ready=0,checked=0;setProgress('status',0,top.length,'Checking status');for(let i=0;i<top.length;i+=4){const chunk=top.slice(i,i+4),got=await Promise.all(chunk.map(x=>enrichOne(x,key,force)));checked+=chunk.length;setProgress('status',checked,top.length,'Checking status');for(const x of got){map.set(x.id,x);const left=num(x.hospitalUntil)-Math.floor(Date.now()/1000),ok=x.status==='Okay'||(x.status==='Hospital'&&num(S.hospitalWindowMin)>=0&&num(x.hospitalUntil)>0&&left>0&&(num(S.hospitalWindowMin)===0||left<=num(S.hospitalWindowMin)*60));if(ok)ready++}if(ready>=20)break}return rows.map(x=>map.get(x.id)||x)}\nfunction hospLeft"""
s=s[:m.start()]+new_rows+s[m.end():]

# Add progress UI and clear it after render.
s=s.replace(
"<button data-filters style=\"margin:8px 12px 4px;width:calc(100% - 24px);min-height:34px\">⚙ Filters</button><div class=\"slx-bh-settings\">",
"<button data-filters style=\"margin:8px 12px 4px;width:calc(100% - 24px);min-height:34px\">⚙ Filters</button><div class=\"slx-bh-progress\" data-progress hidden><div><span>Scanning…</span></div><i><b data-progress-bar></b></i></div><div class=\"slx-bh-settings\">",
1
)
s=s.replace(
".slx-bh-empty{padding:20px;text-align:center;color:#9fb0c2}",
".slx-bh-empty{padding:20px;text-align:center;color:#9fb0c2}.slx-bh-progress{margin:6px 12px 2px;color:#9fb0c2;font-size:11px}.slx-bh-progress i{display:block;height:5px;margin-top:4px;border-radius:99px;background:#172331;overflow:hidden}.slx-bh-progress b{display:block;width:0;height:100%;background:linear-gradient(90deg,#4f8fe8,#ff9f1a);transition:width .18s ease}",
1
)
# Ensure progress idle after normal render completion.
s=s.replace("maybeNotify(rows);updateCountdowns()}finally{busy=false}}","maybeNotify(rows);updateCountdowns();setProgress('idle')}finally{busy=false}}",1)

# Health diagnostics exposed to Hub.
s=s.replace(
"health:()=>({version:VERSION,onBounties:onBounties(),loaded:lastRows.length,watch:Object.keys(WATCH).length,blacklist:Object.keys(BLACK).length,source:lastSource,error:lastError,fullBoard:S.fullBoard,liveEnrich:S.liveEnrich,keySource:keySource()})",
"health:()=>({version:VERSION,onBounties:onBounties(),loaded:lastRows.length,bounties:lastBountyRecords,watch:Object.keys(WATCH).length,blacklist:Object.keys(BLACK).length,source:lastSource,error:lastError,fullBoard:S.fullBoard,liveEnrich:S.liveEnrich,keySource:keySource(),progress:PROG,scanResumeOffset:num(SCAN.nextOffset),scanDelay:num(SCAN.delay)||950,boardCacheAge:Date.now()-num(CACHE.at),ffCache:Object.keys(FFCACHE).length,rateCooldown:Math.max(0,getRateUntil()-Date.now())})",
1
)

P.write_text(s,encoding='utf-8')

# Shared Core catalog knows about new caches.
if CORE.exists():
    c=CORE.read_text(encoding='utf-8')
    c=c.replace(
"{ match: /Bounty Hunter/i, id: 'bounty-hunter', version: 1, keys: ['SLX_BOUNTY_SETTINGS_V3','SLX_BOUNTY_WATCH_V1','SLX_BOUNTY_BLACK_V1','SLX_BOUNTY_CACHE_V2','SLX_BOUNTY_USER_CACHE_V1'] }",
"{ match: /Bounty Hunter/i, id: 'bounty-hunter', version: 1, keys: ['SLX_BOUNTY_SETTINGS_V3','SLX_BOUNTY_WATCH_V1','SLX_BOUNTY_BLACK_V1','SLX_BOUNTY_CACHE_V2','SLX_BOUNTY_USER_CACHE_V1','SLX_BOUNTY_FF_CACHE_V1','SLX_BOUNTY_SCAN_STATE_V1'] }",
1
)
    CORE.write_text(c,encoding='utf-8')

# Registry + modern Hub info.
info=("Purpose\nBounty Hunter scans the full Torn bounty board and builds a target-first hunt list for TornPDA and desktop. "
      "v0.5.0 adds an adaptive, resumable scanner with smart caching and live progress.\n\n"
      "Adaptive scanner\nFull-board API paging is paced automatically, reacts to latency/rate limits, preserves partial progress and can resume from the last saved offset instead of always starting over.\n\n"
      "Smart cache\nBoard results are cached separately from FF/BS and live status. FFScouter estimates are cached per target for up to 12 hours, while live status stays short-lived.\n\n"
      "Beatable filtering\nFF 1–3, reward, level, BS, Hospital window, Okay/Hospital, watchlist/blacklist and verified live status can all participate in the final list.\n\n"
      "UI and integration\nThe Hub-style panel shows scan/FF/status progress, launches from Chat V3, uses Shared Core API/storage/workspace helpers and exposes health diagnostics to Script Hub.")
if REG.exists():
    d=json.loads(REG.read_text(encoding='utf-8'))
    seq=d if isinstance(d,list) else d.get('scripts',[])
    for it in seq:
        if isinstance(it,dict) and it.get('id')=='bounty-hunter':
            it['version']='0.5.0'
            it['info']=info
            it['release']={'version':'0.5.0','date':'2026-10-06','notes':[
                'Adaptive full-board scanner adjusts pacing from API latency and rate-limit feedback.',
                'Resumable incremental scans persist next offset and partial board progress for up to 10 minutes.',
                'FFScouter FF/BS results are cached per target for 12 hours; live Torn status remains short-lived.',
                'Adds progress UI for board paging, FFScouter enrichment, live-status checks and cooldowns.',
                'Synchronizes Script Hub module info and exposes richer health diagnostics.'
            ]}
    REG.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Update embedded Hub registry/info without changing Hub version.
if HUB.exists():
    h=HUB.read_text(encoding='utf-8')
    # Replace bounty info text wherever present.
    h=re.sub(r'("id": "bounty-hunter",\n\s+"info": )"[^"]*"',lambda m:m.group(1)+json.dumps(info),h,count=1)
    # Update bounty version/release in embedded registry if adjacent object contains old version.
    pos=h.find('"id": "bounty-hunter"')
    if pos>=0:
        start=h.rfind('{',0,pos); end=h.find('\n            },',pos)
        if start>=0 and end>start:
            block=h[start:end+14]
            block=re.sub(r'"version":\s*"[^"]+"','"version": "0.5.0"',block,count=1)
            if '"release":' in block:
                block=re.sub(r'"release":\s*\{.*?\n\s*\}', '"release": '+json.dumps({'version':'0.5.0','date':'2026-10-06','notes':['Adaptive resumable scanner + smart cache + progress UI.','FFScouter per-target cache and richer Hub health diagnostics.']},ensure_ascii=False,indent=16), block, count=1, flags=re.S)
            h=h[:start]+block+h[end+14:]
    HUB.write_text(h,encoding='utf-8')

if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8')
    note="""\n## Bounty Hunter v0.5.0
- Major scanner optimization release.
- Adds adaptive API pacing based on latency and rate-limit feedback.
- Adds resumable/incremental full-board scanning with persisted next offset and partial progress.
- Adds a separate 12-hour per-target FFScouter cache for FF/BS estimates.
- Keeps live Torn status on a short cache and prioritizes relevant beatable candidates.
- Adds live progress UI for board scan, FFScouter, status enrichment and API cooldown.
- Expands Script Hub health diagnostics and synchronizes the module info/release description.
- Fixes the canonical installed-version fallback to report 0.5.0 instead of the stale 0.4.2.
"""
    if 'Bounty Hunter v0.5.0' not in c:
        CHANGE.write_text(c.rstrip()+note+'\n',encoding='utf-8')

if DOC.exists():
    d=DOC.read_text(encoding='utf-8')
    d=re.sub(r'^\*\*v[^*]+\*\*','**v0.5.0**',d,count=1,flags=re.M)
    current="""## Current release note

**v0.5.0 — Adaptive scanner + resume + smart cache**
- Full-board scanning now adapts request pacing from observed API latency and rate-limit feedback.
- Scan progress is persisted, so an interrupted/rate-limited board scan can resume from its last offset instead of always restarting.
- FFScouter FF/BS estimates use a dedicated per-target cache for up to 12 hours; live Torn status stays short-lived.
- Adds live progress indicators for board paging, FFScouter enrichment, live-status validation and API cooldown.
- Script Hub info/health diagnostics are synchronized with the current Bounty Hunter feature set.
"""
    if '## Current release note' in d:
        d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
    entry="""### v0.5.0 — Adaptive scanner + resume + smart cache
- Adds adaptive full-board API pacing.
- Persists partial scan progress and next offset for resumable scans.
- Adds 12-hour per-target FFScouter FF/BS cache.
- Adds board/FF/status/cooldown progress UI.
- Expands Script Hub health diagnostics and updates module documentation.
- Fixes stale canonical installed-version fallback.

"""
    if '### v0.5.0' not in d:
        d=d.replace('## Changelog\n','## Changelog\n'+entry,1)
    DOC.write_text(d,encoding='utf-8')
