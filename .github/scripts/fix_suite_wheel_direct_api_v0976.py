from pathlib import Path
import re

suite=Path('SakaLuX-Suite.user.js')
test=Path('tests/suite-daily-progress-regression.cjs')
doc=Path('greasyfork/SakaLuX-Suite.md')

s=suite.read_text(encoding='utf-8')

# Accept either current v0.9.974 or the pagination experiment v0.9.975 as input.
s=re.sub(r'// @version      0\.9\.97[45]', '// @version      0.9.976', s, count=1)
s=re.sub(r"const VERSION = '0\.9\.97[45]';\n  const SUITE = Object\.freeze", "const VERSION = '0.9.976';\n  const SUITE = Object.freeze", s, count=1)
s=re.sub(r"const API_VERSION = '2\.1\.[45]';", "const API_VERSION = '2.1.6';", s, count=1)
s=re.sub(r'/\* SakaLuX Smart Daily Checklist v2\.1\.[45] — v0\.9\.97[45] \*/', '/* SakaLuX Smart Daily Checklist v2.1.6 — v0.9.976 */', s, count=1)

anchor="  function applyLogCompletion(data){"
helper=r'''  function resolveWheelLogIds(){
    const out={wheel_lame:[],wheel_mediocrity:[],wheel_awesome:[]};
    for(const [id,titleRaw] of Object.entries(state.logTypes||{})){
      const title=String(titleRaw||'').toLowerCase();
      const wheelish=/wheel|spin/.test(title);
      if((/wheel of lame/.test(title)||(wheelish&&/\blame\b/.test(title)))) out.wheel_lame.push(String(id));
      if((/wheel of mediocrity/.test(title)||(wheelish&&/\bmediocrity\b/.test(title)))) out.wheel_mediocrity.push(String(id));
      if((/wheel of awesome/.test(title)||(wheelish&&/\bawesome\b/.test(title)))) out.wheel_awesome.push(String(id));
    }
    return out;
  }
  async function refreshWheelLogsDirect(){
    const idsByWheel=resolveWheelLogIds();
    const allIds=[...new Set(Object.values(idsByWheel).flat())];
    if(!allIds.length){
      state.endpointErrors.wheelLogs='No Leslie Wheel log IDs resolved from /torn/logtypes';
      return false;
    }
    const from=startOfTodaySec();
    const to=Math.floor(Date.now()/1000);
    const url=`https://api.torn.com/v2/user/log?log=${encodeURIComponent(allIds.join(','))}&from=${from}&to=${to}&limit=100&sort=asc`;
    const data=await httpJson(url);
    state.lastData.wheelLogs=data;
    delete state.endpointErrors.wheelLogs;
    const raw=data?.log ?? data?.logs ?? data?.data?.log ?? data?.data?.logs ?? [];
    const rows=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.values(raw):[]);
    const idToWheel={};
    for(const [wheel,ids] of Object.entries(idsByWheel)) for(const id of ids) idToWheel[String(id)]=wheel;
    for(const row of rows){
      const ts=Number(row?.timestamp ?? row?.time ?? 0)||0;
      if(ts && ts<from) continue;
      const wheel=idToWheel[String(row?.log ?? row?.log_id ?? '')];
      if(wheel) setTask(wheel,{status:'done',source:'wheel-api',detail:'Detected directly from filtered Torn user/log'});
    }
    applyLogCompletion(data);
    return true;
  }

'''
if 'function resolveWheelLogIds(){' not in s:
    if anchor not in s: raise SystemExit('applyLogCompletion anchor missing')
    s=s.replace(anchor,helper+anchor,1)

needle="    state.lastApiAt=Date.now(); state.apiError=ok?err:(err||'API sync failed'); state.syncing=false;"
replacement="""    try{ await refreshWheelLogsDirect(); }catch(e){ state.endpointErrors.wheelLogs=String(e?.message||e||'Wheel API error'); }
    state.lastApiAt=Date.now(); state.apiError=ok?err:(err||'API sync failed'); state.syncing=false;"""
if 'await refreshWheelLogsDirect();' not in s:
    if needle not in s: raise SystemExit('refreshApi completion anchor missing')
    s=s.replace(needle,replacement,1)

old_diag="logTypesCount:Object.keys(state.logTypes||{}).length,endpoints,wheels,logCandidates,eventCandidates"
new_diag="logTypesCount:Object.keys(state.logTypes||{}).length,wheelLogIds:resolveWheelLogIds(),wheelLogsShape:endpointShape('wheelLogs'),endpoints,wheels,logCandidates,eventCandidates"
if old_diag in s:
    s=s.replace(old_diag,new_diag,1)

old_api="getApiKey,wheelIdFromText,activeWheelFromDom,scanWheelPage"
new_api="getApiKey,wheelIdFromText,activeWheelFromDom,scanWheelPage,resolveWheelLogIds,refreshWheelLogsDirect"
if old_api in s and 'refreshWheelLogsDirect' not in s.split('g.SakaLuXSuiteDailyProgress=Object.freeze(',1)[-1].split('});',1)[0]:
    s=s.replace(old_api,new_api,1)

if 'function resolveWheelLogIds(){' not in s or 'async function refreshWheelLogsDirect(){' not in s:
    raise SystemExit('direct Wheel API helpers missing after patch')
if 'await refreshWheelLogsDirect();' not in s:
    raise SystemExit('direct Wheel API refresh hook missing after patch')

suite.write_text(s,encoding='utf-8')

# Keep existing runtime regression aligned with the new Suite/checklist versions.
t=test.read_text(encoding='utf-8')
t=re.sub(r'0\\\.9\\\.97[45]', r'0\\.9\\.976', t, count=1)
t=re.sub(r"const VERSION = '0\.9\.97[45]';", "const VERSION = '0.9.976';", t, count=1)
t=re.sub(r"assert\.equal\(api\.version,'2\.1\.[45]'\);", "assert.equal(api.version,'2.1.6');", t, count=1)
test.write_text(t,encoding='utf-8')

m=doc.read_text(encoding='utf-8')
m=re.sub(r'\*\*v0\.9\.97[45]\*\*','**v0.9.976**',m,count=1)
m=re.sub(r'- Canonical version: \*\*v0\.9\.97[45]\*\*','- Canonical version: **v0.9.976**',m,count=1)
start=m.find('## Current release note'); hist=m.find('## Release history / Changelog')
if start>=0 and hist>start:
    section="""## Current release note

**v0.9.976 — Direct filtered Wheel API detection**
- Resolves Wheel of Lame / Mediocrity / Awesome log IDs dynamically from `/torn/logtypes`.
- Queries `/user/log` directly with the resolved `log=` IDs and today's TCT/UTC `from`/`to` window.
- No longer relies on finding a Wheel entry among the first 100 generic account logs.
- Keeps generic log, events and DOM detection as independent fallbacks.
- COPY DEBUG now includes resolved Wheel log IDs and the filtered Wheel-log response shape.

"""
    m=m[:start]+section+m[hist:]
entry="""
### v0.9.976 — Direct filtered Wheel API detection
- Uses official log type IDs to request only Leslie Wheel logs for the current Torn day.
- Avoids the generic 100-log limit that caused Wheels to stay at SYNC on active accounts.

"""
pos=m.find('## Release history / Changelog')
if pos>=0 and '### v0.9.976' not in m:
    pos += len('## Release history / Changelog')
    m=m[:pos]+entry+m[pos:]
doc.write_text(m,encoding='utf-8')
