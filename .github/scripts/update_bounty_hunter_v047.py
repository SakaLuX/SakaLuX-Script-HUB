from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bounty-Hunter.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG.md'
DOC=ROOT/'greasyfork/Bounty-Hunter.md'
s=P.read_text(encoding='utf-8')

s=s.replace('@version      0.4.6','@version      0.4.7',1)
s=s.replace("const VERSION='0.4.6'","const VERSION='0.4.7'",1)

# Add rate-limit helpers near apiList.
anchor="function apiList(data){if(Array.isArray(data))return data;if(Array.isArray(data?.bounties))return data.bounties;if(data?.bounties&&typeof data.bounties==='object')return Object.values(data.bounties);if(Array.isArray(data?.data))return data.data;return[]}"
insert=anchor+"""\nconst BH_RATE_KEY='slx_bh_rate_until_v1';\nfunction isRateLimitError(e){const m=String(e?.message||e||'').toLowerCase();return m.includes('too many requests')||m.includes('rate limit')||m.includes('http 429')||m.includes('code 5')}\nfunction getRateUntil(){try{return Number(localStorage.getItem(BH_RATE_KEY)||0)||0}catch{return 0}}\nfunction setRateCooldown(ms=65000){const until=Date.now()+Math.max(15000,Number(ms)||65000);try{localStorage.setItem(BH_RATE_KEY,String(until))}catch{}return until}\nfunction rateWaitText(){const left=Math.max(0,getRateUntil()-Date.now());return left?Math.ceil(left/1000)+'s':''}\n"""
if anchor not in s: raise SystemExit('apiList anchor missing')
s=s.replace(anchor,insert,1)

# Replace reqJson so rate limit does not fan out broker -> direct immediately.
pat=r"async function reqJson\(url,ttl=8000\)\{.*?\}\nasync function fetchPage"
m=re.search(pat,s,re.S)
if not m: raise SystemExit('reqJson block missing')
new_req="""async function reqJson(url,ttl=8000){const until=getRateUntil();if(until>Date.now())throw new Error('Rate limit cooldown · retry in '+rateWaitText());const core=window.SakaLuXCore?.api;let coreErr='';if(core?.requestJson){try{const j=await core.requestJson({url,ttl,retries:0,timeout:12000,throwApiError:true});if(j?.error)throw new Error(j.error.error||j.error.message||'Torn API error');return j}catch(e){coreErr=e?.message||String(e);if(isRateLimitError(e)){setRateCooldown();throw new Error('Too many requests · cooldown '+rateWaitText())}}}try{const r=await fetch(url,{credentials:'omit',headers:{Accept:'application/json'}});if(r.status===429){const ra=Number(r.headers?.get?.('retry-after')||0);setRateCooldown(ra>0?ra*1000:65000);throw new Error('HTTP 429 · cooldown '+rateWaitText())}if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(j?.error){const msg=j.error.error||j.error.message||'Torn API error';if(isRateLimitError(msg)){setRateCooldown();throw new Error('Too many requests · cooldown '+rateWaitText())}throw new Error(msg)}return j}catch(e){if(isRateLimitError(e)){setRateCooldown();throw new Error('Too many requests · cooldown '+rateWaitText())}throw new Error('Torn API failed'+(coreErr?' · broker: '+coreErr:'')+' · direct: '+(e?.message||e))}}\nasync function fetchPage"""
s=s[:m.start()]+new_req+s[m.end():]

# Replace fetchPage: do not hit fallback endpoint on a rate-limit error.
old="async function fetchPage(offset,key){const q='limit=100&offset='+offset+'&key='+encodeURIComponent(key);try{return await reqJson('https://api.torn.com/v2/torn/bounties?'+q,8000)}catch(e1){try{return await reqJson('https://api.torn.com/v2/torn?selections=bounties&'+q,8000)}catch(e2){throw new Error((e1?.message||e1)+' · fallback: '+(e2?.message||e2))}}}"
new="async function fetchPage(offset,key){const q='limit=100&offset='+offset+'&key='+encodeURIComponent(key);try{return await reqJson('https://api.torn.com/v2/torn/bounties?'+q,120000)}catch(e1){if(isRateLimitError(e1))throw e1;try{return await reqJson('https://api.torn.com/v2/torn?selections=bounties&'+q,120000)}catch(e2){throw new Error((e1?.message||e1)+' · fallback: '+(e2?.message||e2))}}}"
if old not in s: raise SystemExit('fetchPage anchor missing')
s=s.replace(old,new,1)

# Replace full board loader: longer cache, paced pages, stop immediately on 429, preserve stale cache.
pat=r"async function fetchFullBoard\(force=false\)\{.*?\}\nfunction mergeDomHints"
m=re.search(pat,s,re.S)
if not m: raise SystemExit('fetchFullBoard block missing')
new_full="""async function fetchFullBoard(force=false){const key=getKey();if(!key)throw new Error('No Torn API key. Add one in API settings or Script Hub.');const age=Date.now()-num(CACHE.at);const rateUntil=getRateUntil();if(CACHE.rows?.length&&(!force&&age<120000||rateUntil>Date.now())){lastBountyRecords=num(CACHE.records)||CACHE.rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);if(rateUntil>Date.now())lastError='Rate limited · using cached board · retry in '+rateWaitText();return CACHE.rows}const map=new Map(),pages=Math.max(1,Math.min(100,num(S.maxPages)||60));let records=0,nextOffset=0,partialError='';for(let p=0;p<pages;p++){let data=null,err=null;try{data=await fetchPage(nextOffset,key)}catch(e){err=e;if(isRateLimitError(e)){setRateCooldown();partialError='Rate limited · retry in '+rateWaitText();break}for(let attempt=0;attempt<2&&!data;attempt++){await new Promise(r=>setTimeout(r,1400*(attempt+1)));try{data=await fetchPage(nextOffset,key);err=null}catch(ex){err=ex;if(isRateLimitError(ex)){setRateCooldown();partialError='Rate limited · retry in '+rateWaitText();break}}}}if(!data){if(!partialError)partialError=err?.message||String(err||'API page failed');if(records>0)break;if(CACHE.rows?.length){lastBountyRecords=num(CACHE.records)||0;lastError=partialError+' · using cached board';return CACHE.rows}throw err||new Error(partialError)}const list=apiList(data);records+=list.length;for(const b of list){const x=normalizeApiBounty(b);if(!x||!x.reward)continue;const old=map.get(x.id)||x;if(old!==x){old.reward+=x.reward;old.count+=1;if(old.status==='Unknown'&&x.status!=='Unknown')old.status=x.status;if(!old.hospitalUntil&&x.hospitalUntil)old.hospitalUntil=x.hospitalUntil}map.set(x.id,old)}const next=data?._metadata?.links?.next||data?.metadata?.links?.next||'';if(!next||list.length===0)break;try{const u=new URL(next,'https://api.torn.com');const o=Number(u.searchParams.get('offset'));nextOffset=Number.isFinite(o)&&o>nextOffset?o:nextOffset+list.length}catch{nextOffset+=list.length}if(p<pages-1)await new Promise(r=>setTimeout(r,950))}const rows=[...map.values()];if(rows.length){lastBountyRecords=records;CACHE={rows,records,at:Date.now()};saveCache()}if(partialError)lastError=(lastError?lastError+' · ':'')+(records?'API partial after '+records+' bounties · ':'')+partialError;return rows.length?rows:(CACHE.rows||[])}\nfunction mergeDomHints"""
s=s[:m.start()]+new_full+s[m.end():]

# Friendly UI message instead of repeated raw broker/direct error spam.
s=s.replace("+(lastError?'<br>'+esc(lastError):'')","+(lastError?'<br><span class="slx-bh-api-note">'+esc(lastError)+'</span>':'')",1)

P.write_text(s,encoding='utf-8')

if REG.exists():
    d=json.loads(REG.read_text(encoding='utf-8'))
    seq=d if isinstance(d,list) else d.get('scripts',[])
    for it in seq:
        if isinstance(it,dict) and it.get('id')=='bounty-hunter':
            it['version']='0.4.7'
            if isinstance(it.get('release'),dict):
                it['release']['version']='0.4.7'
                it['release']['date']='2026-10-06'
                it['release']['notes']=[
                    'Adds Torn API rate-limit protection with a shared cooldown window.',
                    'Stops broker/direct/fallback request fan-out when Torn returns Too many requests / HTTP 429.',
                    'Paces full-board paging to roughly one request per second and extends board cache to two minutes.',
                    'Uses the last good full-board cache during cooldown instead of dropping to a tiny partial/DOM board.'
                ]
    REG.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8')
    note="""\n## Bounty Hunter v0.4.7
- Added rate-limit-aware Torn API paging.
- Stops duplicate broker/direct/fallback calls when Torn reports Too many requests / HTTP 429.
- Full-board pages are paced at ~950ms and cached for 2 minutes.
- A 65-second cooldown is activated after a rate-limit response; during cooldown the last successful board cache is reused.
- Partial scans are preserved and the UI now shows a short cooldown message instead of repeated raw request errors.
"""
    if 'Bounty Hunter v0.4.7' not in c:
        CHANGE.write_text(c.rstrip()+note+'\n',encoding='utf-8')

if DOC.exists():
    d=DOC.read_text(encoding='utf-8')
    d=re.sub(r'^\*\*v[^*]+\*\*','**v0.4.7**',d,count=1,flags=re.M)
    current="""## Current release note

**v0.4.7 — Torn API rate-limit protection**
- Prevents the full-board scanner from hammering Torn when the API returns Too many requests / HTTP 429.
- Stops broker → direct → fallback request fan-out on rate-limit errors.
- Paces board paging to about one request per second and keeps a two-minute full-board cache.
- Uses the last good board cache during cooldown instead of collapsing to a tiny partial/DOM result set.
- Shows a short retry countdown rather than repeated raw API errors.
"""
    if '## Current release note' in d:
        d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
    else:
        pos=d.find('\n## Changelog')
        d=d[:pos+1]+current+'\n\n'+d[pos+1:] if pos>=0 else d+'\n\n'+current
    entry="""### v0.4.7 — Torn API rate-limit protection
- Adds a 65-second cooldown after Too many requests / HTTP 429.
- Stops duplicate broker/direct/fallback requests during rate limiting.
- Paces full-board pages at roughly one request per second.
- Extends board cache to two minutes and reuses the last successful full-board scan during cooldown.
- Keeps partial progress instead of discarding it.

"""
    if '### v0.4.7' not in d:
        d=d.replace('## Changelog\n','## Changelog\n'+entry,1)
    DOC.write_text(d,encoding='utf-8')
