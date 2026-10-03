from pathlib import Path

suite=Path('SakaLuX-Suite.user.js')
test=Path('tests/suite-daily-progress-regression.cjs')
doc=Path('greasyfork/SakaLuX-Suite.md')

s=suite.read_text(encoding='utf-8')
s=s.replace('// @version      0.9.974','// @version      0.9.975',1)
s=s.replace("const VERSION = '0.9.974';\n  const SUITE = Object.freeze","const VERSION = '0.9.975';\n  const SUITE = Object.freeze",1)
s=s.replace("const API_VERSION = '2.1.4';","const API_VERSION = '2.1.5';",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.4 — v0.9.974 */','/* SakaLuX Smart Daily Checklist v2.1.5 — v0.9.975 */',1)

anchor="""  function httpJson(url){
    const key=getApiKey(); if(!key) return Promise.reject(new Error('No Torn API key available'));
"""
if anchor not in s:
    raise SystemExit('httpJson anchor missing')

helper=r'''  function dailyPagedUrl(name,url){
    if(name!=='logs' && name!=='events') return url;
    try{
      const u=new URL(url,location.origin);
      u.searchParams.set('from',String(startOfTodaySec()));
      u.searchParams.set('to',String(Math.floor(Date.now()/1000)));
      u.searchParams.set('sort','asc');
      u.searchParams.set('limit','100');
      u.searchParams.delete('key');
      u.searchParams.delete('striptags');
      return u.toString();
    }catch{
      const sep=url.includes('?')?'&':'?';
      return url+sep+'from='+startOfTodaySec()+'&to='+Math.floor(Date.now()/1000)+'&sort=asc&limit=100';
    }
  }
  function sanitizeNextLink(url){
    if(!url) return '';
    try{
      const u=new URL(url,location.origin);
      if(u.origin!=='https://api.torn.com') return '';
      u.searchParams.delete('key');
      u.searchParams.delete('striptags');
      return u.toString();
    }catch{return '';}
  }
  async function httpJsonPaged(name,url){
    if(name!=='logs' && name!=='events') return httpJson(url);
    const root=name==='logs'?'log':'events';
    const merged=[];
    let next=dailyPagedUrl(name,url), pages=0, lastMeta=null;
    const seen=new Set();
    while(next && pages<25 && !seen.has(next)){
      seen.add(next); pages++;
      const data=await httpJson(next);
      const raw=data?.[root] ?? data?.data?.[root] ?? [];
      const rows=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.values(raw):[]);
      merged.push(...rows);
      lastMeta=data?._metadata ?? data?.data?._metadata ?? null;
      next=sanitizeNextLink(lastMeta?.links?.next || '');
    }
    return {[root]:merged,_metadata:{...(lastMeta||{}),sakalux:{paginated:true,pages,rows:merged.length,utcFrom:startOfTodaySec(),capped:!!next}}};
  }

'''
if 'function httpJsonPaged(name,url)' not in s:
    s=s.replace(anchor,helper+anchor,1)

old="""    const entries=Object.entries(ENDPOINTS).map(([name,url])=>[name,name==='logs'?logEndpoint():url]);
    const results=await Promise.allSettled(entries.map(([,url])=>httpJson(url)));"""
new="""    const entries=Object.entries(ENDPOINTS).map(([name,url])=>[name,name==='logs'?logEndpoint():url]);
    const results=await Promise.allSettled(entries.map(([name,url])=>httpJsonPaged(name,url)));"""
if old not in s:
    raise SystemExit('refresh pagination anchor missing')
s=s.replace(old,new,1)

# Diagnostics: expose pagination stats so future COPY DEBUG proves full-day coverage.
oldshape="""    if(Array.isArray(raw)) out.rows=raw.length;
    else if(raw&&typeof raw==='object') out.rows=Object.keys(raw).length;
    return out;"""
newshape="""    if(Array.isArray(raw)) out.rows=raw.length;
    else if(raw&&typeof raw==='object') out.rows=Object.keys(raw).length;
    const pg=d?._metadata?.sakalux;
    if(pg){out.pages=Number(pg.pages)||0;out.paginated=!!pg.paginated;out.capped=!!pg.capped;}
    return out;"""
if oldshape in s:
    s=s.replace(oldshape,newshape,1)

s=s.replace("return {suite:'0.9.974',checklist:API_VERSION", "return {suite:'0.9.975',checklist:API_VERSION",1)
suite.write_text(s,encoding='utf-8')

t=test.read_text(encoding='utf-8')
t=t.replace(r'0\.9\.974',r'0\.9\.975',1)
t=t.replace("const VERSION = '0.9.974';","const VERSION = '0.9.975';",1)
t=t.replace("assert.equal(api.version,'2.1.4');","assert.equal(api.version,'2.1.5');",1)
test.write_text(t,encoding='utf-8')

m=doc.read_text(encoding='utf-8')
m=m.replace('**v0.9.974**','**v0.9.975**',1)
m=m.replace('- Canonical version: **v0.9.974**','- Canonical version: **v0.9.975**',1)
start=m.find('## Current release note'); hist=m.find('## Release history / Changelog')
if start<0 or hist<0: raise SystemExit('doc markers missing')
section="""## Current release note

**v0.9.975 — Full-day Torn log/event pagination**
- Fixes Smart Daily Checklist only reading the first 100 `/user/log` and `/user/events` rows.
- Requests the current TCT/UTC day explicitly with `from`, `to`, `sort=asc`, `limit=100` and follows `_metadata.links.next` across all pages.
- Merges all pages before Wheel detection, so spins earlier in a busy day are still found.
- Removes API keys from pagination links before reuse and caps traversal at 25 pages as a safety guard.
- COPY DEBUG now reports row count, page count and whether pagination hit the safety cap.

"""
m=m[:start]+section+m[hist:]
entry="""
### v0.9.975 — Full-day logs/events pagination
- Follows Torn API v2 `_metadata.links.next` for `/user/log` and `/user/events` across the current UTC/TCT day.
- Fixes Wheel tasks staying at SYNC when the spin was older than the newest 100 activity rows.
"""
pos=m.find('## Release history / Changelog')+len('## Release history / Changelog')
m=m[:pos]+entry+m[pos:]
doc.write_text(m,encoding='utf-8')
