#!/usr/bin/env python3
from pathlib import Path
root=Path(__file__).resolve().parents[2]
suite=root/'SakaLuX-Suite.user.js'
md=root/'greasyfork/SakaLuX-Suite.md'
s=suite.read_text(encoding='utf-8')
old=s
s=s.replace('// @version      0.9.935','// @version      0.9.936',1)
s=s.replace("const VERSION = '0.9.935';","const VERSION = '0.9.936';",1)

start=s.find('  async function handleOcStageEntry(')
if start < 0:
    start=s.find('  function handleOcStageEntry(')
if start < 0:
    raise SystemExit('handleOcStageEntry start not found')
end=s.find('\n  function refreshNotInOCFromPage()',start)
if end < 0:
    raise SystemExit('handleOcStageEntry end marker not found')

new_handle=r'''  async function handleOcStageEntry(
    stage = getCrimesStageLabel()
  ) {
    if (
      !moduleActive ||
      !isCrimesTab() ||
      (stage !== "Recruiting" && stage !== "Planning")
    ) {
      return;
    }

    if (stage === lastObservedOcStage) return;
    lastObservedOcStage = stage;

    // Do NOT invalidate an already completed scan merely because the user
    // re-entered the same Torn tab. v0.9.935 persisted this state; preserve it.
    updateStageVisuals();

    const statusEl = document.querySelector('.sakalux-oco-scan-status');
    if (statusEl) {
      statusEl.classList.remove('is-success','is-error');
      statusEl.classList.add('is-scanning');
      statusEl.textContent = `Refreshing ${stage}...`;
      statusEl.title = `Refreshing ${stage} OC data. API is preferred; visible-page scan is the fallback.`;
    }

    let result = await scanAvailableCrimesViaApi(stage, true);

    // API error 7 (Incorrect ID-entity relation) commonly means the account
    // lacks Faction API Access. Fall back to the live page instead of showing
    // a transient red API error when the DOM contains enough OC information.
    if (!result?.ok) {
      const domResult = await scanCurrentCrimesStage();
      if (domResult?.ok) result = domResult;
    }

    if (result?.ok && result?.stage === stage) {
      markStageScanComplete(stage);
      updateStageVisuals();
      itemTick();
      utilitiesLastSignature = '';
      if (statusEl) flashScanStatus(statusEl, sessionScanSummary(), 'success');
      return;
    }

    const reason = String(result?.reason || 'Refresh unavailable');
    const factionAccessMissing = /incorrect id-entity relation|error\s*7|faction api access/i.test(reason);

    if (statusEl) {
      if (factionAccessMissing) {
        statusEl.classList.remove('is-scanning','is-error','is-success');
        renderScanStatus(statusEl);
        statusEl.title = 'Faction API Access is unavailable for this key/account. Suite will use the visible-page scanner instead.';
      } else {
        flashScanStatus(statusEl, reason, 'error', 3000);
      }
    }
  }'''

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
