from pathlib import Path

suite=Path('SakaLuX-Suite.user.js')
test=Path('tests/suite-daily-progress-regression.cjs')
doc=Path('greasyfork/SakaLuX-Suite.md')

s=suite.read_text(encoding='utf-8')
s=s.replace('// @version      0.9.972','// @version      0.9.973',1)
s=s.replace("const VERSION = '0.9.972';\n  const SUITE = Object.freeze","const VERSION = '0.9.973';\n  const SUITE = Object.freeze",1)
s=s.replace("const API_VERSION = '2.1.2';","const API_VERSION = '2.1.3';",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.2 — v0.9.972 */','/* SakaLuX Smart Daily Checklist v2.1.3 — v0.9.973 */',1)

old="    logs:'https://api.torn.com/v2/user/log'"
new="    events:'https://api.torn.com/v2/user/events',\n    logtypes:'https://api.torn.com/v2/torn/logtypes',\n    logs:'https://api.torn.com/v2/user/log'"
if old not in s: raise SystemExit('ENDPOINT logs anchor missing')
s=s.replace(old,new,1)

old_state="const state = { showCompleted:true, filter:'all', syncing:false, apiError:'', lastApiAt:0, lastData:{} };"
new_state="const state = { showCompleted:true, filter:'all', syncing:false, apiError:'', lastApiAt:0, lastData:{}, logTypes:{} };"
if old_state not in s: raise SystemExit('state anchor missing')
s=s.replace(old_state,new_state,1)

anchor="""  function applyLogCompletion(data){
    const rawLogs=data?.log ?? data?.logs ?? data?.data?.log ?? data?.data?.logs ?? [];
    const logs=Array.isArray(rawLogs)?rawLogs:(rawLogs&&typeof rawLogs==='object'?Object.values(rawLogs):[]);
    if(!logs.length) return;"""
insert="""  function applyLogTypes(data){
    const raw=data?.logtypes ?? data?.data?.logtypes ?? data?.data ?? [];
    const rows=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.entries(raw).map(([id,v])=>({id,...(typeof v==='object'?v:{title:String(v)})})):[]);
    const map={...state.logTypes};
    for(const row of rows){
      const id=String(row?.id ?? row?.log ?? row?.log_id ?? '');
      const title=String(row?.title ?? row?.name ?? row?.description ?? '');
      if(id && title) map[id]=title;
    }
    state.logTypes=map;
  }
  function applyEventCompletion(data){
    const raw=data?.events ?? data?.data?.events ?? data?.data ?? [];
    const rows=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.values(raw):[]);
    for(const row of rows){
      const ts=Number(row?.timestamp ?? row?.time ?? 0)||0;
      if(ts && ts<startOfTodaySec()) continue;
      const text=deepText(row);
      if(/wheel of lame/.test(text)) setTask('wheel_lame',{status:'done',source:'events',detail:'Detected in today\\'s Torn events'});
      if(/wheel of mediocrity/.test(text)) setTask('wheel_mediocrity',{status:'done',source:'events',detail:'Detected in today\\'s Torn events'});
      if(/wheel of awesome/.test(text)) setTask('wheel_awesome',{status:'done',source:'events',detail:'Detected in today\\'s Torn events'});
    }
  }
  function applyLogCompletion(data){
    const rawLogs=data?.log ?? data?.logs ?? data?.data?.log ?? data?.data?.logs ?? [];
    const logs=Array.isArray(rawLogs)?rawLogs:(rawLogs&&typeof rawLogs==='object'?Object.values(rawLogs):[]);
    if(!logs.length) return;"""
if anchor not in s: raise SystemExit('applyLogCompletion anchor missing')
s=s.replace(anchor,insert,1)

old_text="""      const title=String(row?.details?.title||'').toLowerCase();
      const category=String(row?.details?.category||'').toLowerCase();
      const text=(title+' '+category+' '+deepText(row?.data)+' '+deepText(row?.params)).toLowerCase();"""
new_text="""      const mappedTitle=state.logTypes[String(row?.log ?? row?.log_id ?? '')]||'';
      const title=String(row?.title ?? row?.details?.title ?? mappedTitle ?? '').toLowerCase();
      const category=String(row?.category ?? row?.details?.category ?? '').toLowerCase();
      const text=(title+' '+mappedTitle+' '+category+' '+deepText(row)).toLowerCase();"""
if old_text not in s: raise SystemExit('log text anchor missing')
s=s.replace(old_text,new_text,1)

old_interpret="""  function interpretV3(name,data){
    if(name==='logs'){ applyLogCompletion(data); return; }"""
new_interpret="""  function interpretV3(name,data){
    if(name==='events'){ applyEventCompletion(data); return; }
    if(name==='logtypes'){ applyLogTypes(data); return; }
    if(name==='logs'){ applyLogCompletion(data); return; }"""
if old_interpret not in s: raise SystemExit('interpret anchor missing')
s=s.replace(old_interpret,new_interpret,1)

suite.write_text(s,encoding='utf-8')

t=test.read_text(encoding='utf-8')
t=t.replace(r'0\.9\.972',r'0\.9\.973',1).replace("const VERSION = '0.9.972';","const VERSION = '0.9.973';",1).replace("assert.equal(api.version,'2.1.2');","assert.equal(api.version,'2.1.3');",1)
anchor_test="assert.equal(api.summary().objectives.find(x=>x.id==='casino').status,'done','zero remaining casino tokens auto-completes');"
extra=anchor_test+"\napi.applyApiSnapshot('logtypes',{logtypes:[{id:777001,title:'Casino - Wheel of Mediocrity spin'}]});\napi.applyApiSnapshot('logs',{log:{xyz:{log:777001,timestamp:1999999999,data:{cost:50000}}}});\nassert.equal(api.summary().objectives.find(x=>x.id==='wheel_mediocrity').status,'done','numeric Torn log id resolves through logtypes and completes wheel');\napi.applyApiSnapshot('events',{events:[{timestamp:1999999999,event:'You won a prize on the Wheel of Awesome'}]});\nassert.equal(api.summary().objectives.find(x=>x.id==='wheel_awesome').status,'done','Wheel of Awesome completes from Torn events fallback');"
if anchor_test not in t: raise SystemExit('casino test anchor missing')
t=t.replace(anchor_test,extra,1)
test.write_text(t,encoding='utf-8')

m=doc.read_text(encoding='utf-8')
m=m.replace('**v0.9.972**','**v0.9.973**',1).replace('- Canonical version: **v0.9.972**','- Canonical version: **v0.9.973**',1)
start=m.find('## Current release note'); hist=m.find('## Release history / Changelog')
if start<0 or hist<0: raise SystemExit('doc markers missing')
section="## Current release note\n\n**v0.9.973 — Wheel detection via official log types + events**\n- Resolves numeric `user/log` IDs against Torn's official `/torn/logtypes` endpoint before matching checklist tasks.\n- Adds `/user/events` as an independent fallback for Wheel of Lame, Mediocrity and Awesome.\n- Scans the complete log row (including top-level fields), not only `details/data/params`.\n- Keeps the direct Spin The Wheel DOM/click detection from v0.9.971.\n- Adds regression tests for numeric log IDs and events-based wheel completion.\n\n"
m=m[:start]+section+m[hist:]
entry="\n### v0.9.973 — Wheel log-type resolver + events fallback\n- Resolves numeric Torn log IDs through `/torn/logtypes`.\n- Adds `/user/events` fallback for all three Leslie wheels.\n"
pos=m.find('## Release history / Changelog')+len('## Release history / Changelog')
m=m[:pos]+entry+m[pos:]
doc.write_text(m,encoding='utf-8')
