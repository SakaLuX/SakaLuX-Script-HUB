from pathlib import Path
import shutil

script = Path('SakaLuX-Suite.user.js')
s = script.read_text(encoding='utf-8')
old = '0.9.922'
new = '0.9.923'

if f'// @version      {new}' in s:
    print('Suite already at', new)
    raise SystemExit(0)
if f'// @version      {old}' not in s:
    raise SystemExit(f'Expected Suite {old}; refusing unsafe patch')

backup = Path('backups/suite-tornpda-fullheight-v0.9.923-2026-09-17/SakaLuX-Suite-v0.9.922.user.js')
backup.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(script, backup)

s = s.replace(f'// @version      {old}', f'// @version      {new}', 1)
s = s.replace(f"const VERSION = '{old}';", f"const VERSION = '{new}';", 1)

marker = '/* Suite TornPDA coarse-pointer full-height contract 0.9.923 */'
if marker in s:
    raise SystemExit('0.9.923 marker unexpectedly already present')

# v0.9.922 used only max-width:820px. TornPDA can expose a wider CSS viewport,
# so that media query never fired even though the page is being used on a phone.
# This contract targets touch/coarse-pointer devices instead and is appended last
# so it wins against earlier Suite/Hub compatibility rules.
patch = r'''

/* Suite TornPDA coarse-pointer full-height contract 0.9.923 */
(()=>{
  const id='sakalux-suite-tornpda-fullheight-v0923';
  if(document.getElementById(id)) return;
  const st=document.createElement('style');
  st.id=id;
  st.textContent=`
@media (pointer:coarse), (hover:none) {
  #sakalux-master-suite-panel#sakalux-master-suite-panel#sakalux-master-suite-panel {
    position:fixed!important;
    inset:0 4px 36px 4px!important;
    top:0!important;
    right:4px!important;
    bottom:36px!important;
    left:4px!important;
    width:auto!important;
    height:auto!important;
    min-width:0!important;
    min-height:0!important;
    max-width:none!important;
    max-height:none!important;
    margin:0!important;
    padding:0!important;
    transform:none!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:stretch!important;
    justify-content:stretch!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
    border:0!important;
    border-radius:14px!important;
    background:transparent!important;
    backdrop-filter:none!important;
    -webkit-backdrop-filter:none!important;
    touch-action:pan-y!important;
  }

  #sakalux-master-suite-panel#sakalux-master-suite-panel#sakalux-master-suite-panel > .sakalux-suite-window {
    position:relative!important;
    inset:auto!important;
    flex:1 1 0!important;
    align-self:stretch!important;
    display:flex!important;
    flex-direction:column!important;
    width:100%!important;
    height:100%!important;
    min-width:0!important;
    min-height:0!important;
    max-width:100%!important;
    max-height:100%!important;
    margin:0!important;
    padding:0!important;
    transform:none!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
    border:1px solid #3c4652!important;
    border-radius:14px!important;
    background:#0b1118!important;
    box-shadow:0 10px 26px rgba(0,0,0,.34)!important;
    backdrop-filter:none!important;
    -webkit-backdrop-filter:none!important;
  }

  #sakalux-master-suite-panel .sakalux-suite-header {
    position:relative!important;
    inset:auto!important;
    flex:0 0 auto!important;
    min-height:0!important;
    height:auto!important;
    margin:0!important;
    padding:8px 10px!important;
    box-sizing:border-box!important;
    border-radius:13px 13px 0 0!important;
  }
  #sakalux-master-suite-panel .sakalux-suite-header h1,
  #sakalux-master-suite-panel .sakalux-suite-header h2,
  #sakalux-master-suite-panel .sakalux-suite-header .sakalux-suite-title {
    margin:0!important;
    font-size:18px!important;
    line-height:1.1!important;
  }
  #sakalux-master-suite-panel .sakalux-suite-header p,
  #sakalux-master-suite-panel .sakalux-suite-header .sakalux-suite-subtitle,
  #sakalux-master-suite-panel .sakalux-suite-header .sakalux-suite-description {
    margin:3px 0 0!important;
    font-size:10px!important;
    line-height:1.25!important;
  }
  #sakalux-master-suite-panel .sakalux-suite-close {
    width:34px!important;
    height:34px!important;
    min-width:34px!important;
    min-height:34px!important;
    max-width:34px!important;
    max-height:34px!important;
    padding:0!important;
    border-radius:10px!important;
    font-size:18px!important;
    line-height:32px!important;
  }

  #sakalux-master-suite-panel .sakalux-suite-toolbar {
    position:relative!important;
    inset:auto!important;
    flex:0 0 auto!important;
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:5px!important;
    min-height:0!important;
    height:auto!important;
    margin:0!important;
    padding:6px 8px!important;
    box-sizing:border-box!important;
  }
  #sakalux-master-suite-panel .sakalux-suite-toolbar button,
  #sakalux-master-suite-panel .sakalux-suite-toolbar .sakalux-suite-button {
    width:100%!important;
    height:30px!important;
    min-width:0!important;
    min-height:30px!important;
    max-height:30px!important;
    margin:0!important;
    padding:0 5px!important;
    border-radius:9px!important;
    font-size:9px!important;
    line-height:1.05!important;
    white-space:normal!important;
    overflow:hidden!important;
  }

  #sakalux-master-suite-panel > .sakalux-suite-window > .sakalux-suite-content {
    position:relative!important;
    inset:auto!important;
    flex:1 1 0!important;
    display:block!important;
    width:100%!important;
    height:0!important;
    min-width:0!important;
    min-height:0!important;
    max-width:100%!important;
    max-height:none!important;
    margin:0!important;
    box-sizing:border-box!important;
    overflow-y:auto!important;
    overflow-x:hidden!important;
    overscroll-behavior:contain!important;
    touch-action:pan-y!important;
    -webkit-overflow-scrolling:touch!important;
  }

  #sakalux-master-suite-panel > .sakalux-suite-window > #sakalux-inline-footer-suite {
    position:relative!important;
    inset:auto!important;
    flex:0 0 50px!important;
    width:100%!important;
    height:50px!important;
    min-height:50px!important;
    max-height:50px!important;
    margin:0!important;
    padding:0!important;
    border-radius:0 0 13px 13px!important;
    overflow:hidden!important;
  }
}
`;
  (document.head||document.documentElement).appendChild(st);
})();
'''
s += patch
script.write_text(s, encoding='utf-8')

# Release notes.
doc = Path('greasyfork/SakaLuX-Suite.md')
if doc.exists():
    d = doc.read_text(encoding='utf-8')
    d = d.replace('**v0.9.922**', '**v0.9.923**', 1)
    note = ('**v0.9.923** fixes TornPDA Master Control height detection. The previous mobile rule depended only on a '
            '`max-width:820px` media query, which may not match TornPDA\'s CSS viewport on phones. The new final override '
            'targets coarse-pointer/no-hover devices, forces the Master Control shell to the full usable viewport with 4px '
            'side gaps and 36px chat clearance, keeps header/actions/footer fixed, and leaves only the module list scrollable.\n\n')
    anchor = '## Current release note\n\n'
    if anchor in d and note not in d:
        d = d.replace(anchor, anchor + note, 1)
    doc.write_text(d, encoding='utf-8')

print('Prepared Suite v0.9.923')
