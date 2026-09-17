from pathlib import Path
p=Path('hubtest.user.js')
s=p.read_text(encoding='utf-8')
if 'const IDS =' in s:
    raise SystemExit('IDS already exists; aborting')
s=s.replace('// @version      1.9.65-test.3','// @version      1.9.65-test.4',1)
s=s.replace("const VERSION = '1.9.65-test.3';","const VERSION = '1.9.65-test.4';",1)
anchor="    const UPDATE_CACHE_TIME = 24 * 60 * 60 * 1000;\n"
ids="""    const IDS = {
        button: 'sakalux-hub-button',
        badge: 'sakalux-hub-badge',
        topSkull: 'sakalux-hub-top-skull',
        navSkull: 'sakalux-hub-nav-skull',
        overlay: 'sakalux-hub-overlay',
        panel: 'sakalux-hub-panel',
        style: 'sakalux-hub-style'
    };

"""
if anchor not in s:
    raise SystemExit('anchor missing')
s=s.replace(anchor,anchor+'\n'+ids,1)
p.write_text(s,encoding='utf-8')
print('restored IDS and bumped Hub Test to 1.9.65-test.4')
