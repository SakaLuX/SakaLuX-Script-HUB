from pathlib import Path
import subprocess,re

ROOT=Path(__file__).resolve().parents[1]
PATH='SakaLuX-Script-Hub.user.js'
BASE='609c3a8d3651d9a58c235a241ee1570fbf2c33b4'
cur=(ROOT/PATH).read_text(encoding='utf-8')
old=subprocess.check_output(['git','show',f'{BASE}:{PATH}'],text=True)

# Restore the UI/runtime functions accidentally deleted by the launcher migration.
start=old.index('    function closeHub() {')
end=old.index('    function settingSwitch(', start)
block=old[start:end]
anchor='    function settingSwitch('
if '    function openHub() {' not in cur:
    if anchor not in cur:
        raise SystemExit('settingSwitch anchor missing')
    cur=cur.replace(anchor,block+anchor,1)

# Keep the new bridge-only launcher policy. Remove obsolete settings references restored from old runtime block if any.
cur=cur.replace("        bindSettingToggle('slhs-hide');\n",'')
cur=cur.replace("            settings.hideIndividualButtons = settingToggleValue('slhs-hide');\n",'')

# Ensure legacy floating add-on launchers are only cleaned up, never relied upon.
pat=re.compile(r"    function updateHiddenButtons\(\) \{[\s\S]*?\n    \}\n\n    function closeHub\(\)",re.M)
replacement="""    function updateHiddenButtons() {
        for (const selector of ['#sl-eg-button','#sakalux-bt-settings-button','#sl-mri-button','#sl-mi-button','#slx-elim-btn']) {
            document.querySelectorAll(selector).forEach(element => element.remove());
        }
    }

    function closeHub()"""
cur,n=pat.subn(replacement,cur,count=1)
if n!=1:
    raise SystemExit('updateHiddenButtons runtime block patch failed')

# Bump Hub version and add release note.
cur=re.sub(r'(^// @version\s+)1\.9\.31(\s*$)',r'\g<1>1.9.32\2',cur,count=1,flags=re.M)
cur=cur.replace("const VERSION = '1.9.31';","const VERSION = '1.9.32';",1)
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.32',
            date: '2026-09-12',
            changes: [
                'Restores the Hub panel runtime accidentally removed during the bridge-only launcher migration.',
                'Fixes the S status launcher, Fly-out HUB launcher and floating fallback so all open the Hub panel again.',
                'Adds runtime validation for openHub, closeHub and createOverlay to prevent this regression.'
            ]
        },
"""
if "version: '1.9.32'" not in cur:
    cur=cur.replace(needle,entry,1)

# Hard runtime invariant: launcher-visible builds must contain the panel entrypoints.
required=['function openHub()','function closeHub()','function createOverlay(','function renderList()','function bindCards()','function runAction(']
missing=[x for x in required if x not in cur]
if missing:
    raise SystemExit('Missing restored Hub runtime symbols: '+', '.join(missing))

(ROOT/PATH).write_text(cur,encoding='utf-8')

# Sync Hub information page.
doc=ROOT/'greasyfork/Script-Hub.md'
d=doc.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.31**','## Current version\n**v1.9.32**',1)
d=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',"""## Current release note

**v1.9.32** restores the Hub panel runtime after the bridge-only migration. The native **S**, Fly-out **HUB** and floating fallback launchers all open Script Hub again, while managed add-ons remain bridge/API-only with no individual floating launch buttons.

## Recommended""",d,count=1,flags=re.S)
doc.write_text(d,encoding='utf-8')

print('Hub runtime restored and bridge-only policy preserved')
