#!/usr/bin/env python3
from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]
suite=root/'SakaLuX-Suite.user.js'
md=root/'greasyfork/SakaLuX-Suite.md'
s=suite.read_text(encoding='utf-8')
old=s
s=s.replace('// @version      0.9.935','// @version      0.9.936',1)
s=s.replace("const VERSION = '0.9.935';","const VERSION = '0.9.936';",1)

def replace_function(src,name,new_text):
    m=re.search(rf'(?m)^\s*(?:async\s+)?function\s+{re.escape(name)}\s*\([^)]*\)\s*\{{',src)
    if not m: raise SystemExit(f'function not found: {name}')
    brace=src.find('{',m.start()); depth=0; quote=None; esc=False; i=brace
    while i<len(src):
        c=src[i]
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
        else:
            if c in "'\"`": quote=c
            elif c=='{': depth+=1
            elif c=='}':
                depth-=1
                if depth==0:
                    return src[:m.start()] + new_text + src[i+1:]
        i+=1
    raise SystemExit(f'unbalanced function: {name}')

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
    // lacks Faction API Access. That must not paint a scary transient red error
    // if the visible OC page can still be scanned successfully.
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
        // Keep the saved/required state visible without flashing a raw Torn API
        // error on every page entry. Manual Scan can still use DOM fallback.
        statusEl.classList.remove('is-scanning','is-error','is-success');
        renderScanStatus(statusEl);
        statusEl.title = 'Faction API Access is unavailable for this key/account. Suite will use the visible-page scanner instead.';
      } else {
        flashScanStatus(statusEl, reason, 'error', 3000);
      }
    }
  }'''
s=replace_function(s,'handleOcStageEntry',new_handle)
if s==old: raise SystemExit('no Suite changes made')
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
