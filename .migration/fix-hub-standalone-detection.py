from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]

# 1) Hub: mark itself active and aggressively remove stale standalone dock UI.
hub=ROOT/'SakaLuX-Script-Hub.user.js'
text=hub.read_text(encoding='utf-8')
text,n=re.subn(r'(^// @version\s+)1\.9\.18(\s*$)',r'\g<1>1.9.19\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('hub metadata version')
text,n=re.subn(r"const VERSION = '1\.9\.18';","const VERSION = '1.9.19';",text,count=1)
if n!=1: raise SystemExit('hub runtime version')
needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.19',
            date: '2026-09-12',
            changes: [
                'Fixes false standalone mode detection when the Hub is already installed.',
                'Marks the page as Hub-active and removes stale standalone dock/install prompts from older add-ons.',
                'Keeps native S and Fly-out HUB launchers as authoritative Hub-presence signals.'
            ]
        },
"""
if needle not in text: raise SystemExit('hub changelog anchor')
text=text.replace(needle,entry,1)
anchor="    function ensureEverything() {\n"
helper="""    function suppressStandaloneDock() {
        try {
            document.documentElement?.setAttribute('data-sakalux-hub-active', '1');
            document.body?.setAttribute('data-sakalux-hub-active', '1');
            for (const id of ['sakalux-standalone-dock','sakalux-hub-install-prompt','sakalux-standalone-native-s','sakalux-standalone-fallback-s']) {
                document.getElementById(id)?.remove();
            }
        } catch {}
    }

"""
if anchor not in text: raise SystemExit('ensureEverything anchor')
text=text.replace(anchor,helper+anchor,1)
old="""    function ensureEverything() {
        injectCss(); createTopbarSkull(); createNavSkull(); createHubButton(); updateHiddenButtons(); updateBadge(); syncFloatingButtonVisibility();
    }
"""
new="""    function ensureEverything() {
        suppressStandaloneDock();
        injectCss(); createTopbarSkull(); createNavSkull(); createHubButton(); updateHiddenButtons(); updateBadge(); syncFloatingButtonVisibility();
        suppressStandaloneDock();
    }
"""
if old not in text: raise SystemExit('ensureEverything block')
text=text.replace(old,new,1)
hub.write_text(text,encoding='utf-8')

# 2) Add-ons: robust Hub presence detection across isolated userscript worlds.
files={
 'SakaLuX-Enhancer-Guard.user.js':('1.3.27','1.3.28'),
 'SakaLuX-Bazaar-Thanker-PDA.user.js':('5.3.17','5.3.18'),
 'SakaLuX-Mission-Rewards.user.js':('1.0.15','1.0.16'),
 'SakaLuX-Market-Intelligence.user.js':('1.17.15','1.17.16'),
 'SakaLuX-Elimination-Assistant.user.js':('1.3.27','1.3.28'),
}
old_detector="const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.querySelector('[data-sakalux-hub-installed=\"1\"]'));"
new_detector="const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.getElementById('sakalux-hub-top-skull')||document.getElementById('sakalux-hub-nav-skull')||document.getElementById('sakalux-hub-panel')||document.getElementById('sakalux-hub-style')||document.querySelector('[data-sakalux-hub-installed=\"1\"]')||document.querySelector('[data-sakalux-hub-active=\"1\"]'));"
for name,(oldv,newv) in files.items():
    p=ROOT/name
    s=p.read_text(encoding='utf-8')
    if old_detector not in s: raise SystemExit(f'detector missing in {name}')
    s=s.replace(old_detector,new_detector,1)
    s,n=re.subn(rf'(^// @version\s+){re.escape(oldv)}(\s*$)',rf'\g<1>{newv}\2',s,count=1,flags=re.M)
    if n!=1: raise SystemExit(f'metadata version {name}')
    # Standalone bootstrap SELF version near file start.
    s=s.replace("{version:'"+oldv+"'}","{version:'"+newv+"'}",1)
    # Common runtime version constants if present.
    s=s.replace("const VERSION = '"+oldv+"';","const VERSION = '"+newv+"';",1)
    s=s.replace("const VERSION='"+oldv+"';","const VERSION='"+newv+"';",1)
    p.write_text(s,encoding='utf-8')

# 3) Registry versions.
regp=ROOT/'scripts.json'
data=json.loads(regp.read_text(encoding='utf-8'))
versions={
 'enhancer':'1.3.28','bazaar':'5.3.18','mission-rewards':'1.0.16',
 'market-intelligence':'1.17.16','elimination-assistant':'1.3.28'
}
for item in data['scripts']:
    if item['id'] in versions: item['version']=versions[item['id']]
regp.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# 4) Docs current versions + concise release note.
docs={
 'greasyfork/Script-Hub.md':('1.9.18','1.9.19','Standalone dock detection fix','Hub now marks Torn as Hub-active and removes stale standalone launcher/install UI from older add-ons.'),
 'greasyfork/Enhancer-Guard.md':('1.3.27','1.3.28','Hub detection fix','Recognizes the current Hub S/Fly-out launchers and no longer opens standalone mode when Hub is installed.'),
 'greasyfork/Bazaar-Thanker.md':('5.3.17','5.3.18','Hub detection fix','Recognizes the current Hub S/Fly-out launchers and no longer opens standalone mode when Hub is installed.'),
 'greasyfork/Mission-Rewards.md':('1.0.15','1.0.16','Hub detection fix','Recognizes the current Hub S/Fly-out launchers and no longer opens standalone mode when Hub is installed.'),
 'greasyfork/Market-Intelligence.md':('1.17.15','1.17.16','Hub detection fix','Recognizes the current Hub S/Fly-out launchers and no longer opens standalone mode when Hub is installed.'),
 'greasyfork/Elimination-Assistant.md':('1.3.27','1.3.28','Hub detection fix','Recognizes the current Hub S/Fly-out launchers and no longer opens standalone mode when Hub is installed.'),
}
for path,(oldv,newv,title,note) in docs.items():
    p=ROOT/path
    d=p.read_text(encoding='utf-8')
    d,n=re.subn(rf'(## Current version\s+\*\*v){re.escape(oldv)}(\*\*)',rf'\g<1>{newv}\2',d,count=1)
    if n!=1: raise SystemExit(f'doc version {path}')
    heading=f'### v{newv}'
    if heading not in d:
        d=d.replace('## Current release notes\n',f'## Current release notes\n\n### v{newv} — {title}\n\n- {note}\n',1)
    p.write_text(d,encoding='utf-8')

print('Hub/add-on standalone detection fix applied')
