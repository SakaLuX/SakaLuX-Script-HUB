from pathlib import Path

hub = Path('SakaLuX-Script-Hub.user.js')
text = hub.read_text(encoding='utf-8')
if 'const IDS =' in text:
    raise SystemExit('Production IDS already exists; aborting')
text = text.replace('// @version      1.9.65','// @version      1.9.66',1)
text = text.replace("const VERSION = '1.9.65';","const VERSION = '1.9.66';",1)
anchor = "    const UPDATE_CACHE_TIME = 24 * 60 * 60 * 1000;\n"
ids = """    const IDS = {
        button: 'sakalux-hub-button',
        badge: 'sakalux-hub-badge',
        topSkull: 'sakalux-hub-top-skull',
        navSkull: 'sakalux-hub-nav-skull',
        overlay: 'sakalux-hub-overlay',
        panel: 'sakalux-hub-panel',
        style: 'sakalux-hub-style'
    };

"""
if anchor not in text:
    raise SystemExit('UPDATE_CACHE_TIME anchor missing')
text = text.replace(anchor, anchor + '\n' + ids, 1)
ch = "    const HUB_CHANGELOG = [\n"
entry = "        {version:'1.9.66',date:'2026-09-17',changes:['Restores the missing IDS map used by Hub launchers, overlay, panel and style selectors.','Fixes the runtime ReferenceError that prevented the Hub from opening in TornPDA.']},\n"
if ch not in text:
    raise SystemExit('HUB_CHANGELOG anchor missing')
text = text.replace(ch, ch + entry, 1)
hub.write_text(text, encoding='utf-8')

md = Path('greasyfork/Script-Hub.md')
info = md.read_text(encoding='utf-8')
info = info.replace('## Current version\n**v1.9.65**','## Current version\n**v1.9.66**',1)
old_note = '**v1.9.65** Keeps a guaranteed Hub fallback launcher whenever native Torn/TornPDA launch controls are mounted but not actually visible, and synchronizes Stock Manager v0.7.9 panel/footer integration.'
new_note = '**v1.9.66** Restores the missing Hub IDS map and fixes the TornPDA runtime error that prevented Script Hub from opening.'
if old_note not in info:
    raise SystemExit('current release note anchor missing')
info = info.replace(old_note,new_note,1)
release_anchor = '## Release history / Changelog\n\n'
release = '### v1.9.66 — Hub open/runtime fix\n- Restores the missing `IDS` map used by launchers, overlay, panel and style selectors.\n- Fixes `ReferenceError: IDS is not defined`, which prevented the Hub from opening in TornPDA.\n\n'
if release_anchor not in info:
    raise SystemExit('release history anchor missing')
info = info.replace(release_anchor, release_anchor + release, 1)
md.write_text(info, encoding='utf-8')

Path('hubtest.user.js').unlink(missing_ok=True)
print('Promoted IDS fix to production Hub v1.9.66 and removed hubtest.user.js')
