#!/usr/bin/env python3
from pathlib import Path
root=Path(__file__).resolve().parents[2]
suite=root/'SakaLuX-Suite.user.js'
md=root/'greasyfork/SakaLuX-Suite.md'
s=suite.read_text(encoding='utf-8')
old=s
s=s.replace('// @version      0.9.935','// @version      0.9.936',1)
s=s.replace("const VERSION = '0.9.935';","const VERSION = '0.9.936';",1)

needle='function handleOcStageEntry('
pos=s.find(needle)
if pos < 0:
    raise SystemExit('handleOcStageEntry token not found')
start=s.rfind('\n',0,pos)+1
end_token='function refreshNotInOCFromPage()'
end_pos=s.find(end_token,pos)
if end_pos < 0:
    raise SystemExit('refreshNotInOCFromPage token not found')
end=s.rfind('\n',0,end_pos)+1
indent=s[start:pos].replace('async ','')
# Preserve surrounding indentation used by the module.
lead=s[start:len(s[:start])+len(s[start:pos])]
base_indent=''.join(ch for ch in s[start:pos] if ch in ' \t')
if not base_indent:
    base_indent='  '

new_handle='''{I}async function handleOcStageEntry(\n{I}  stage = getCrimesStageLabel()\n{I}) {{\n{I}  if (\n{I}    !moduleActive ||\n{I}    !isCrimesTab() ||\n{I}    (stage !== "Recruiting" && stage !== "Planning")\n{I}  ) {{\n{I}    return;\n{I}  }}\n\n{I}  if (stage === lastObservedOcStage) return;\n{I}  lastObservedOcStage = stage;\n\n{I}  // Do NOT invalidate an already completed scan merely because the user\n{I}  // re-entered the same Torn tab. Preserve persisted scan completion.\n{I}  updateStageVisuals();\n\n{I}  const statusEl = document.querySelector('.sakalux-oco-scan-status');\n{I}  if (statusEl) {{\n{I}    statusEl.classList.remove('is-success','is-error');\n{I}    statusEl.classList.add('is-scanning');\n{I}    statusEl.textContent = `Refreshing ${{stage}}...`;\n{I}    statusEl.title = `Refreshing ${{stage}} OC data. API is preferred; visible-page scan is the fallback.`;\n{I}  }}\n\n{I}  let result = await scanAvailableCrimesViaApi(stage, true);\n\n{I}  // If the faction API cannot serve private faction crimes, fall back to\n{I}  // the live Torn page instead of showing a transient raw API error.\n{I}  if (!result?.ok) {{\n{I}    const domResult = await scanCurrentCrimesStage();\n{I}    if (domResult?.ok) result = domResult;\n{I}  }}\n\n{I}  if (result?.ok && result?.stage === stage) {{\n{I}    markStageScanComplete(stage);\n{I}    updateStageVisuals();\n{I}    itemTick();\n{I}    utilitiesLastSignature = '';\n{I}    if (statusEl) flashScanStatus(statusEl, sessionScanSummary(), 'success');\n{I}    return;\n{I}  }}\n\n{I}  const reason = String(result?.reason || 'Refresh unavailable');\n{I}  const factionAccessMissing = /incorrect id-entity relation|error\\s*7|faction api access/i.test(reason);\n\n{I}  if (statusEl) {{\n{I}    if (factionAccessMissing) {{\n{I}      statusEl.classList.remove('is-scanning','is-error','is-success');\n{I}      renderScanStatus(statusEl);\n{I}      statusEl.title = 'Faction API Access is unavailable for this key/account. Suite will use the visible-page scanner instead.';\n{I}    }} else {{\n{I}      flashScanStatus(statusEl, reason, 'error', 3000);\n{I}    }}\n{I}  }}\n{I}}}\n'''.replace('{I}',base_indent)

s=s[:start]+new_handle+s[end:]
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
