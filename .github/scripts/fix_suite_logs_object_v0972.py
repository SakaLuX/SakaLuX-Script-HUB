from pathlib import Path

suite=Path('SakaLuX-Suite.user.js')
test=Path('tests/suite-daily-progress-regression.cjs')
doc=Path('greasyfork/SakaLuX-Suite.md')

s=suite.read_text(encoding='utf-8')
s=s.replace('// @version      0.9.971','// @version      0.9.972',1)
s=s.replace("const VERSION = '0.9.971';\n  const SUITE = Object.freeze","const VERSION = '0.9.972';\n  const SUITE = Object.freeze",1)
s=s.replace("const API_VERSION = '2.1.1';","const API_VERSION = '2.1.2';",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.1 — v0.9.971 */','/* SakaLuX Smart Daily Checklist v2.1.2 — v0.9.972 */',1)
old="""  function applyLogCompletion(data){
    const logs=Array.isArray(data?.log)?data.log:(Array.isArray(data?.logs)?data.logs:[]);
    if(!logs.length) return;"""
new="""  function applyLogCompletion(data){
    const rawLogs=data?.log ?? data?.logs ?? data?.data?.log ?? data?.data?.logs ?? [];
    const logs=Array.isArray(rawLogs)?rawLogs:(rawLogs&&typeof rawLogs==='object'?Object.values(rawLogs):[]);
    if(!logs.length) return;"""
if old not in s:
    raise SystemExit('log parser anchor not found')
s=s.replace(old,new,1)
suite.write_text(s,encoding='utf-8')

t=test.read_text(encoding='utf-8')
t=t.replace(r'0\.9\.971',r'0\.9\.972',1).replace("const VERSION = '0.9.971';","const VERSION = '0.9.972';",1).replace("assert.equal(api.version,'2.1.1');","assert.equal(api.version,'2.1.2');",1)
anchor="api.applyApiSnapshot('casino',{casino:{tokens:0,streak:4}});\nassert.equal(api.summary().objectives.find(x=>x.id==='casino').status,'done','zero remaining casino tokens auto-completes');"
extra=anchor+"\napi.applyApiSnapshot('logs',{log:{abc123:{log:999,timestamp:1999999999,details:{title:'Wheel of Lame',category:'Casino'},data:{wheel:'lame'}}}});\nassert.equal(api.summary().objectives.find(x=>x.id==='wheel_lame').status,'done','object-mapped Torn logs auto-complete Wheel of Lame');"
if anchor not in t: raise SystemExit('test anchor not found')
t=t.replace(anchor,extra,1)
test.write_text(t,encoding='utf-8')

m=doc.read_text(encoding='utf-8')
m=m.replace('**v0.9.971**','**v0.9.972**',1).replace('- Canonical version: **v0.9.971**','- Canonical version: **v0.9.972**',1)
start=m.find('## Current release note')
hist=m.find('## Release history / Changelog')
if start<0 or hist<0: raise SystemExit('doc markers missing')
section="## Current release note\n\n**v0.9.972 — Torn log object parser hotfix**\n- Fixes Smart Daily Checklist log parsing for the real Torn API v2 `/user/log` response, where `log` is an object keyed by log ID rather than an array.\n- Daily Wheels and every other log-backed auto-check can now consume `Object.values(log)` correctly.\n- Preserves the v0.9.971 DOM wheel detection as an independent fallback.\n- Adds a regression test using an object-mapped Wheel of Lame log entry.\n\n"
m=m[:start]+section+m[hist:]
entry="\n### v0.9.972 — Torn log object parser hotfix\n- Fixes `/user/log` object-map parsing and wheel auto-completion.\n- Adds regression coverage for the real keyed-log response shape.\n"
pos=m.find('## Release history / Changelog')+len('## Release history / Changelog')
m=m[:pos]+entry+m[pos:]
doc.write_text(m,encoding='utf-8')
