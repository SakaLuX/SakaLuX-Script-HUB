#!/usr/bin/env python3
from pathlib import Path
root=Path(__file__).resolve().parents[2]
suite=root/'SakaLuX-Suite.user.js'
md=root/'greasyfork/SakaLuX-Suite.md'
s=suite.read_text(encoding='utf-8')
old=s
s=s.replace('// @version      0.9.935','// @version      0.9.936',1)
s=s.replace("const VERSION = '0.9.935';","const VERSION = '0.9.936';",1)

# Keep persisted completion when the player revisits Recruiting/Planning.
old_required='''    markStageScanRequired(stage);\n    updateStageVisuals();'''
new_required='''    // Do NOT invalidate an already completed scan merely because the user revisited this stage.\n    updateStageVisuals();'''
if old_required not in s:
    raise SystemExit('stage-required entry block not found')
s=s.replace(old_required,new_required,1)

# Automatic page-entry refresh: API first, live DOM fallback second.
old_api='''    const result =\n      await scanAvailableCrimesViaApi(\n        stage,\n        true\n      );'''
new_api='''    let result =\n      await scanAvailableCrimesViaApi(\n        stage,\n        true\n      );\n\n    if (!result?.ok) {\n      const domResult = await scanCurrentCrimesStage();\n      if (domResult?.ok) result = domResult;\n    }'''
if old_api not in s:
    raise SystemExit('stage-entry API block not found')
s=s.replace(old_api,new_api,1)

# Do not flash the raw faction API access error if DOM fallback cannot run yet.
old_fail='''    if (statusEl) {\n      flashScanStatus(\n        statusEl,\n        result?.reason ||\n          "API refresh failed",\n        "error",\n        2200\n      );\n    }'''
new_fail='''    if (statusEl) {\n      const reason = String(result?.reason || "API refresh failed");\n      const factionAccessMissing = /incorrect id-entity relation|error\\s*7|faction api access/i.test(reason);\n      if (factionAccessMissing) {\n        statusEl.classList.remove("is-scanning", "is-error", "is-success");\n        renderScanStatus(statusEl);\n        statusEl.title = "Faction API Access unavailable; Suite is using the visible-page OC scanner.";\n      } else {\n        flashScanStatus(statusEl, reason, "error", 3000);\n      }\n    }'''
if old_fail not in s:
    raise SystemExit('stage-entry failure block not found')
s=s.replace(old_fail,new_fail,1)

if s==old:
    raise SystemExit('no Suite changes made')
suite.write_text(s,encoding='utf-8')

if md.exists():
    t=md.read_text(encoding='utf-8')
    t=t.replace('**v0.9.935**','**v0.9.936**',1)
    t=t.replace('**v0.9.935 — OC scan state storage fix**','**v0.9.936 — OC scan visual state + API fallback**',1)
    entry=("### v0.9.936 — OC scan visual state + API fallback\n"
           "- Keeps a completed Recruiting/Planning scan marked complete when revisiting the tab instead of resetting it to Scan Required.\n"
           "- Falls back automatically to the visible-page OC scanner when the faction crimes API request fails.\n"
           "- Suppresses the transient red `Incorrect ID-entity relation` banner on page entry when Faction API Access is unavailable; the manual DOM scan remains usable.\n\n")
    if '### v0.9.936 — OC scan visual state + API fallback' not in t:
        pos=t.find('## Release history / Changelog')
        if pos<0: raise SystemExit('release marker missing')
        ins=t.find('\n',pos)+1
        t=t[:ins]+'\n'+entry+t[ins:]
    md.write_text(t,encoding='utf-8')
print('Suite OC entry behavior fixed -> v0.9.936')
