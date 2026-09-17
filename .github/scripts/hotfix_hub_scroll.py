from pathlib import Path
import re, shutil

root = Path('.')
p = root / 'SakaLuX-Script-Hub.user.js'
text = p.read_text(encoding='utf-8')

if '// @version      1.9.48' not in text:
    raise SystemExit('Expected Hub v1.9.48 baseline')

backup = root / 'backups' / 'ui-scroll-hotfix-2026-09-17'
backup.mkdir(parents=True, exist_ok=True)
shutil.copy2(p, backup / 'SakaLuX-Script-Hub-v1.9.48.user.js')

text = text.replace('// @version      1.9.48', '// @version      1.9.49', 1)
text = text.replace("const VERSION = '1.9.48';", "const VERSION = '1.9.49';", 1)

old_contract = '''[data-slx-fullsheet-v2=\"1\"]{position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important;box-sizing:border-box!important;z-index:2147483200!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:blur(14px) saturate(1.08)!important;backdrop-filter:blur(14px) saturate(1.08)!important}'''
new_contract = '''[data-slx-fullsheet-v2=\"1\"]{width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;border-radius:0!important;box-sizing:border-box!important;z-index:2147483200!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:blur(14px) saturate(1.08)!important;backdrop-filter:blur(14px) saturate(1.08)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}'''
if old_contract not in text:
    raise SystemExit('Shared v2 contract anchor not found')
text = text.replace(old_contract, new_contract, 1)

old_hub = '''#sakalux-hub-panel{inset:0!important;width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important;margin:0!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:blur(14px)!important;backdrop-filter:blur(14px)!important}'''
new_hub = '''#sakalux-hub-panel{position:relative!important;inset:auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;border-radius:0!important;margin:0!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:blur(14px)!important;backdrop-filter:blur(14px)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}\n#sakalux-hub-panel>.slh-list,#sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{overflow:visible!important;flex:0 0 auto!important;min-height:auto!important}\n#sakalux-hub-panel>.slh-bottom,#sakalux-hub-panel>.slh-footer{flex:0 0 auto!important}'''
if old_hub not in text:
    raise SystemExit('Hub v1.9.48 runtime repair anchor not found')
text = text.replace(old_hub, new_hub, 1)

text = text.replace("hub.dataset.slxFullsheetV2='1';", "hub.removeAttribute('data-slx-fullsheet-v2');", 1)

old_entry = "{ version: '1.9.48', date: '2026-09-17', changes: ['Makes Hub a true top-to-bottom mobile sheet with translucent blur.','Enforces INFO / ON-OFF / NEW / OPEN-SETTINGS as a runtime 2x2 module control block.','Introduces the shared SakaLuX full-height + blur surface contract.','Company Intelligence now uses whole-sheet scrolling and orange SakaLuX attribution.'] },"
new_entry = "{ version: '1.9.49', date: '2026-09-17', changes: ['Fixes TornPDA vertical scrolling by sizing Hub to the available host container instead of forcing physical 100dvh.','Makes the complete Hub panel the vertical pan-y scroll surface so footer and bottom actions remain reachable.','Keeps blur and the 2x2 module controls while removing the fixed fullscreen override that could extend under TornPDA navigation.'] },\n        " + old_entry
if old_entry not in text:
    raise SystemExit('Hub changelog v1.9.48 anchor not found')
text = text.replace(old_entry, new_entry, 1)

# Final mobile override: the overlay owns the available TornPDA area, Hub scrolls inside it.
append = r'''

/* SakaLuX Hub TornPDA host-scroll hotfix v1.9.49 */
(()=>{
  if(document.getElementById('sakalux-hub-scroll-1949')) return;
  const s=document.createElement('style');
  s.id='sakalux-hub-scroll-1949';
  s.textContent=`@media(max-width:820px){
    #sakalux-hub-overlay{position:fixed!important;inset:0!important;overflow:hidden!important;display:flex!important;align-items:stretch!important;justify-content:stretch!important;padding:0!important;box-sizing:border-box!important}
    #sakalux-hub-panel{position:relative!important;inset:auto!important;flex:1 1 auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;border-radius:0!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:max(8px,env(safe-area-inset-bottom,0px))!important}
    #sakalux-hub-panel>.slh-list,#sakalux-hub-panel>.slh-view,#sakalux-hub-panel>.slh-settings{overflow:visible!important;flex:0 0 auto!important;min-height:auto!important;max-height:none!important}
    #sakalux-hub-panel>.slh-bottom,#sakalux-hub-panel>.slh-footer{position:relative!important;flex:0 0 auto!important;bottom:auto!important}
  }`;
  (document.head||document.documentElement).appendChild(s);
})();
'''
if 'sakalux-hub-scroll-1949' not in text:
    text += append

p.write_text(text, encoding='utf-8')

# Update Hub info page only.
doc = root / 'greasyfork' / 'Script-Hub.md'
d = doc.read_text(encoding='utf-8')
d = re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)', r'\g<1>1.9.49\g<2>', d, count=1)
d = re.sub(r'(## Current release note\s*\n+)\*\*v[^\n]+', r'\g<1>**v1.9.49** fixes TornPDA scrolling by fitting Hub to the available host container instead of forcing physical `100dvh`. The whole Hub panel is now the vertical scroll surface, while blur and the 2×2 module controls are preserved.', d, count=1)
marker='## Release history'
entry='''## Release history\n### v1.9.49 — TornPDA host-scroll hotfix\n- Replaces the physical `100dvh` Hub override with host-container sizing.\n- Makes the complete Hub panel scrollable with native vertical touch gestures.\n- Keeps bottom actions/footer reachable and preserves blur plus 2×2 module controls.\n'''
if '### v1.9.49' not in d and marker in d:
    d=d.replace(marker,entry,1)
doc.write_text(d,encoding='utf-8')
print('Hub v1.9.49 patched and backup created.')
