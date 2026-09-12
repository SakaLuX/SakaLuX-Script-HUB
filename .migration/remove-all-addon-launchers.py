from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]

OLD_OPEN="function openEntry(data){const el=data.selector?document.querySelector(data.selector):null;if(el){el.click();return;}if(data.fallback)location.href=data.fallback;}"
NEW_OPEN="function openEntry(data){const el=data.selector?document.querySelector(data.selector):null;if(el){el.click();return;}const bridge=document.getElementById('sakalux-module-bridge-'+data.id);if(bridge){bridge.dataset.action='open';bridge.click();return;}if(data.fallback)location.href=data.fallback;}"

def sub1(s,pat,repl,label,flags=0):
    s,n=re.subn(pat,repl,s,count=1,flags=flags)
    if n!=1: raise SystemExit(label)
    return s

def bump_header_runtime(path,old,new,runtime_pattern="const VERSION"):
    p=ROOT/path; s=p.read_text(encoding='utf-8')
    s=sub1(s,rf'(^// @version\s+){re.escape(old)}(\s*$)',rf'\g<1>{new}\2',f'{path} metadata',re.M)
    if runtime_pattern=='BAZAAR_VERSION':
        s=sub1(s,rf"const BAZAAR_VERSION=['\"]{re.escape(old)}['\"];",f"const BAZAAR_VERSION='{new}';",f'{path} runtime')
    else:
        s=sub1(s,rf"const VERSION\s*=\s*['\"]{re.escape(old)}['\"]",f"const VERSION = '{new}'",f'{path} runtime')
    return p,s

# Bazaar Thanker
p,s=bump_header_runtime('SakaLuX-Bazaar-Thanker-PDA.user.js','5.3.19','5.3.20','BAZAAR_VERSION')
s=s.replace("{version:'5.3.19'}","{version:'5.3.20'}",1)
s=s.replace('"selector":"#sakalux-bt-settings-button",','"selector":"",',1)
if OLD_OPEN not in s: raise SystemExit('bazaar openEntry')
s=s.replace(OLD_OPEN,NEW_OPEN,1)
block=re.compile(r"\n        const settingsButton = document\.createElement\('button'\);\n        settingsButton\.id = 'sakalux-bt-settings-button';\n        settingsButton\.textContent = '⚙️';\n        settingsButton\.style\.cssText = '[^']*';\n        settingsButton\.onclick = function \(\) \{\n            const open = panel\.style\.display === 'none';\n            panel\.style\.display = open \? 'block' : 'none';\n            if \(open\) updateStats\(\);\n        \};\n        document\.body\.appendChild\(settingsButton\);\n")
s,n=block.subn('\n',s,count=1)
if n!=1: raise SystemExit('bazaar settings button block')
s=s.replace("        document.getElementById('sakalux-bt-settings-button')?.remove();\n",'',1)
p.write_text(s,encoding='utf-8')

# Mission Rewards
p,s=bump_header_runtime('SakaLuX-Mission-Rewards.user.js','1.0.16','1.0.17')
s=s.replace("{version:'1.0.16'}","{version:'1.0.17'}",1)
s=s.replace('"selector":"#sl-mri-button",','"selector":"",',1)
if OLD_OPEN not in s: raise SystemExit('mission openEntry')
s=s.replace(OLD_OPEN,NEW_OPEN,1)
s=s.replace("            #sl-mri-button{position:fixed;right:12px;bottom:150px;z-index:2147483645;border:0;border-radius:999px;padding:10px 13px;background:#18181b;color:#fff;font-size:13px;font-weight:900;box-shadow:0 5px 18px rgba(0,0,0,.4)}\n",'',1)
mission_create=re.compile(r"\n    function createButton\(\) \{\n        if \(!state\.enabled \|\| !isMissionsPage\(\) \|\| document\.getElementById\('sl-mri-button'\)\) return;\n        const button = document\.createElement\('button'\);\n        button\.id = 'sl-mri-button';\n        button\.textContent = '🎯 Missions';\n        button\.onclick = openSettings;\n        document\.body\.appendChild\(button\);\n    \}\n")
s,n=mission_create.subn('\n',s,count=1)
if n!=1: raise SystemExit('mission createButton block')
s=s.replace('        createButton();\n','',1)
s=s.replace("        document.getElementById('sl-mri-button')?.remove();\n",'',1)
p.write_text(s,encoding='utf-8')

# Elimination Assistant
p,s=bump_header_runtime('SakaLuX-Elimination-Assistant.user.js','1.3.28','1.3.29')
s=s.replace("{version:'1.3.28'}","{version:'1.3.29'}",1)
s=s.replace('"selector":"#slx-elim-btn",','"selector":"",',1)
if OLD_OPEN not in s: raise SystemExit('elimination openEntry')
s=s.replace(OLD_OPEN,NEW_OPEN,1)
s=s.replace("const IDS={button:'slx-elim-btn',panel:'slx-elim',style:'slx-elim-style'};","const IDS={panel:'slx-elim',style:'slx-elim-style'};",1)
s=s.replace("s.textContent=`#${IDS.button}{position:fixed;right:12px;bottom:82px;z-index:999999;background:#171b21;color:#fff;border:1px solid #414a55;border-radius:999px;padding:11px 14px;font-weight:900;font-size:14px}#${IDS.panel}","s.textContent=`#${IDS.panel}",1)
s=s.replace("function inject(){if(!state.enabled||$('#'+IDS.panel))return;css();compactCss();const b=document.createElement('button');b.id=IDS.button;b.textContent='ELIM ⚔';const p=document.createElement('div');", "function inject(){if(!state.enabled||$('#'+IDS.panel))return;css();compactCss();const p=document.createElement('div');",1)
s=s.replace("document.body.append(b,p);guardAgainstForeignTargetWidgets();b.onclick=()=>{p.classList.toggle('open');guardAgainstForeignTargetWidgets()};", "document.body.append(p);guardAgainstForeignTargetWidgets();",1)
s=s.replace("function removeUI(){$('#'+IDS.panel)?.remove();$('#'+IDS.button)?.remove();$('#'+HUB_PROMPT_ID)?.remove()}","function removeUI(){$('#'+IDS.panel)?.remove();$('#'+HUB_PROMPT_ID)?.remove()}",1)
s=s.replace("if(e.target?.id==='slx-elim-btn'||e.target?.id==='slx-close')setTimeout(persistTargetUI,0)","if(e.target?.id==='slx-close')setTimeout(persistTargetUI,0)",1)
p.write_text(s,encoding='utf-8')

# Registry: all five modules are bridge/API only, no buttonSelector.
rp=ROOT/'scripts.json'; data=json.loads(rp.read_text(encoding='utf-8'))
versions={'bazaar':'5.3.20','mission-rewards':'1.0.17','elimination-assistant':'1.3.29'}
for item in data['scripts']:
    item.pop('buttonSelector',None)
    if item['id'] in versions: item['version']=versions[item['id']]
rp.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Hub: bridge/API only for all managed modules; remove dead button-visibility setting.
hp=ROOT/'SakaLuX-Script-Hub.user.js'; h=hp.read_text(encoding='utf-8')
h=sub1(h,r'(^// @version\s+)1\.9\.30(\s*$)',r'\g<1>1.9.31\2','hub metadata',re.M)
h=sub1(h,r"const VERSION\s*=\s*'1\.9\.30';","const VERSION = '1.9.31';",'hub runtime')
for sid,old,new in [('bazaar','5.3.19','5.3.20'),('mission-rewards','1.0.16','1.0.17'),('elimination-assistant','1.3.28','1.3.29')]:
    h=sub1(h,rf"(id:\s*'{re.escape(sid)}'[\s\S]{{0,450}}?version:\s*'){re.escape(old)}(')",rf'\g<1>{new}\2',f'hub fallback {sid}')
# Strip every fallback buttonSelector declaration.
h=re.sub(r",\s*buttonSelector:\s*'#[^']+'",'',h)
# Remove obsolete preference from defaults/settings save/UI.
h=h.replace('        hideIndividualButtons: true,\n','',1)
h=re.sub(r"\s*\$\{settingSwitch\('slhs-hide',[^\n]*\)\}\n",'\n',h,count=1)
h=h.replace("            settings.hideIndividualButtons = settingToggleValue('slhs-hide');\n",'',1)
# updateHiddenButtons becomes harmless cleanup for legacy selectors only.
old_func=re.compile(r"    function updateHiddenButtons\(\) \{[\s\S]*?\n    \}\n\n    function settingSwitch",re.M)
new_func="""    function updateHiddenButtons() {
        for (const selector of ['#sl-eg-button','#sakalux-bt-settings-button','#sl-mri-button','#sl-mi-button','#slx-elim-btn']) {
            document.querySelectorAll(selector).forEach(element => element.remove());
        }
    }

    function settingSwitch"""
h,n=old_func.subn(new_func,h,count=1)
if n!=1: raise SystemExit('hub updateHiddenButtons function')
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.31',
            date: '2026-09-12',
            changes: [
                'All five managed add-ons now use bridge/API-only access with no individual floating launcher buttons.',
                'Bazaar Thanker, Mission Rewards and Elimination Assistant no longer create their own page launchers.',
                'Removed the obsolete Hide individual script buttons setting and cleans up legacy launchers from older loaded versions.'
            ]
        },
"""
if needle not in h: raise SystemExit('hub changelog anchor')
h=h.replace(needle,entry,1)
hp.write_text(h,encoding='utf-8')

# Docs
def doc_version(path,old,new,note):
    fp=ROOT/path; d=fp.read_text(encoding='utf-8')
    d=d.replace(f'## Current version\n**v{old}**',f'## Current version\n**v{new}**',1)
    d=d.replace(f'## Current version\n{old}',f'## Current version\n**v{new}**',1)
    d=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',f'## Current release note\n\n**v{new}** {note}\n\n## Recommended',d,count=1,flags=re.S)
    fp.write_text(d,encoding='utf-8')

doc_version('greasyfork/Bazaar-Thanker.md','5.3.19','5.3.20','removes the standalone floating settings launcher. Settings remain available from Script Hub and Standalone Dock through the module bridge/API.')
doc_version('greasyfork/Mission-Rewards.md','1.0.16','1.0.17','removes the standalone floating Missions launcher. Settings remain available from Script Hub and Standalone Dock through the module bridge/API.')
doc_version('greasyfork/Elimination-Assistant.md','1.3.28','1.3.29','removes the standalone floating Elimination launcher. The full panel remains available from Script Hub and Standalone Dock through the module bridge/API.')
fp=ROOT/'greasyfork/Script-Hub.md'; d=fp.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.30**','## Current version\n**v1.9.31**',1)
for old,new,name in [('5.3.19','5.3.20','Bazaar Thanker'),('1.0.16','1.0.17','Mission Rewards'),('1.3.28','1.3.29','Elimination Assistant')]:
    d=d.replace(f'{name} **v{old}**',f'{name} **v{new}**')
d=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',"""## Current release note

**v1.9.31** completes bridge/API-only access for all five managed add-ons. No managed add-on creates an individual floating launcher on Torn pages; Hub and Standalone Dock open every module through its internal bridge/API.

## Recommended""",d,count=1,flags=re.S)
fp.write_text(d,encoding='utf-8')

print('Unified all five managed add-ons to bridge/API-only access')
