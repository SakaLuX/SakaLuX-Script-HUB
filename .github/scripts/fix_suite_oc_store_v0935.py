#!/usr/bin/env python3
from pathlib import Path
root=Path(__file__).resolve().parents[2]
suite=root/'SakaLuX-Suite.user.js'
md=root/'greasyfork/SakaLuX-Suite.md'
s=suite.read_text(encoding='utf-8')
old=s
s=s.replace('// @version      0.9.934','// @version      0.9.935',1)
s=s.replace("const VERSION = '0.9.934';","const VERSION = '0.9.935';",1)
old_read='''  function readStageScanState() {\n    const saved = store.get(\n      STAGE_SCAN_STATE_KEY,\n      {}\n    );\n'''
new_read='''  function readStageScanState() {\n    const saved = loadLS(STAGE_SCAN_STATE_KEY) || {};\n'''
if old_read not in s:
    raise SystemExit('readStageScanState store.get block not found')
s=s.replace(old_read,new_read,1)
old_write='''  function writeStageScanState(stateValue) {\n    store.set(\n      STAGE_SCAN_STATE_KEY,\n      stateValue\n    );\n  }\n'''
new_write='''  function writeStageScanState(stateValue) {\n    saveLS(STAGE_SCAN_STATE_KEY, stateValue);\n  }\n'''
if old_write not in s:
    raise SystemExit('writeStageScanState store.set block not found')
s=s.replace(old_write,new_write,1)
if 'store.get(\n      STAGE_SCAN_STATE_KEY' in s or 'store.set(\n      STAGE_SCAN_STATE_KEY' in s:
    raise SystemExit('stale OC store reference remains')
if s==old:
    raise SystemExit('no changes')
suite.write_text(s,encoding='utf-8')
if md.exists():
    t=md.read_text(encoding='utf-8')
    t=t.replace('**v0.9.934**','**v0.9.935**',1)
    t=t.replace('**v0.9.934 — OC Recruiting/Planning scan reliability**','**v0.9.935 — OC scan state storage fix**',1)
    entry=("### v0.9.935 — OC scan state storage fix\n"
           "- Fixes `ReferenceError: store is not defined` when scanning Recruiting/Planning OC stages.\n"
           "- Uses the Suite OC module's existing `loadLS` / `saveLS` helpers for scan-state persistence.\n"
           "- Keeps Recruiting and Planning completion state persistent without depending on an undefined storage object.\n\n")
    if '### v0.9.935 — OC scan state storage fix' not in t:
        pos=t.find('## Release history / Changelog')
        if pos<0: raise SystemExit('release marker missing')
        ins=t.find('\n',pos)+1
        t=t[:ins]+'\n'+entry+t[ins:]
    md.write_text(t,encoding='utf-8')
print('Suite OC store reference fixed -> v0.9.935')
