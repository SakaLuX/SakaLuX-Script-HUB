from pathlib import Path
import re, json, subprocess
ROOT=Path(__file__).resolve().parents[1]
REPO='SakaLuX/SakaLuX-Script-HUB'
BASE='ad61fc552f8477ca091a825ac47154b803e7c88d'
GUIDE_COMMIT='535b4a5ed7428fb977f260e39181b5e4888c0a5e'
MISSION='SakaLuX-Mission-Rewards.user.js'
RAW='https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Mission-Rewards.user.js'

def git_show(ref,path):
    return subprocess.check_output(['git','show',f'{ref}:{path}'],text=True)

# 1) Restore the known-good v1.0.18 implementation exactly, then bump to v1.0.19.
base=git_show(BASE,MISSION)
base=re.sub(r'(^// @version\s+)1\.0\.18(\s*$)',r'\g<1>1.0.19\2',base,count=1,flags=re.M)
base=base.replace("{version:'1.0.18'}","{version:'1.0.19'}",1)
base=base.replace("const VERSION = '1.0.18';","const VERSION = '1.0.19';",1)
# Keep this stabilization line independent from the old Greasy Fork 1.1.x branch.
base=re.sub(r'^// @downloadURL .*$',f'// @downloadURL {RAW}',base,flags=re.M)
base=re.sub(r'^// @updateURL .*$',f'// @updateURL {RAW}',base,flags=re.M)

# 2) Reuse only the mission-data object from the old 1.1.0 experiment, but isolate it in a separate IIFE.
exp=git_show(GUIDE_COMMIT,MISSION)
m=re.search(r'const MISSION_GUIDE = \{[\s\S]*?\n    \};',exp)
if not m: raise SystemExit('MISSION_GUIDE not found in v1.1.0')
guide_obj=m.group(0).replace('    const MISSION_GUIDE','  const MISSION_GUIDE')

isolated=f'''\n\n/* SakaLuX Mission Guide — isolated UI layer\n * Runs independently from Mission Rewards core/Hub bridge/API/power logic.\n * Removing this entire IIFE restores the exact v1.0.18 behavior.\n */\n(() => {{\n  'use strict';\n{guide_obj}\n  const STYLE_ID='sl-mr-guide-isolated-style';\n  const BOX_CLASS='sl-mr-mission-guide';\n  function esc(v){{return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}}\n  function key(v){{return String(v||'').toLowerCase().replace(/&nbsp;/g,' ').replace(/[’']/g,'').replace(/[^a-z0-9\\s-]/g,'').replace(/[-\\s]+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'')}}\n  function addStyle(){{\n    if(document.getElementById(STYLE_ID))return;\n    const s=document.createElement('style');s.id=STYLE_ID;\n    s.textContent=`.{{BOX_CLASS}}{{margin:10px 0;padding:10px 12px;border:1px solid rgba(59,130,246,.32);border-radius:10px;background:rgba(15,23,42,.82);color:#dbeafe;font:13px/1.35 Arial,sans-serif}}.{{BOX_CLASS}} .sl-mr-guide-title{{font-weight:900;color:#93c5fd;margin-bottom:6px}}.{{BOX_CLASS}} .sl-mr-guide-row{{margin-top:3px}}.{{BOX_CLASS}} .sl-mr-guide-hint{{color:#cbd5e1}}`;\n    (document.head||document.documentElement).appendChild(s);\n  }}\n  function missionTitle(ctx){{\n    const n=ctx.querySelector('.title-black'); if(!n)return '';\n    return String(n.childNodes?.[0]?.wholeText||n.textContent||'').replace(/\\n/g,' ').trim();\n  }}\n  function render(){{\n    if(!location.href.includes('sid=missions'))return;\n    addStyle();\n    for(const ctx of document.querySelectorAll('.giver-cont-wrap > div[id^="mission"]')){{\n      const data=MISSION_GUIDE[key(missionTitle(ctx))];\n      let box=ctx.querySelector(':scope .'+BOX_CLASS);\n      if(!data){{box?.remove();continue}}\n      if(!box){{box=document.createElement('div');box.className=BOX_CLASS;(ctx.querySelector('.max-height-fix')||ctx).appendChild(box)}}\n      box.innerHTML=`<div class="sl-mr-guide-title">🎯 SakaLuX Mission Guide</div><div class="sl-mr-guide-row"><b>Task:</b> ${{esc(data.task)}}</div>${{data.hint?`<div class="sl-mr-guide-row sl-mr-guide-hint"><b>Hint:</b> ${{esc(data.hint)}}</div>`:''}}`;\n    }}\n  }}\n  let t=0; function schedule(){{clearTimeout(t);t=setTimeout(render,120)}}\n  function start(){{render();new MutationObserver(schedule).observe(document.documentElement,{{childList:true,subtree:true}});window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule)}}\n  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{{once:true}});else start();\n}})();\n'''.replace('.{BOX_CLASS}',f'.{ "sl-mr-mission-guide" }')

Path(ROOT/MISSION).write_text(base.rstrip()+isolated,encoding='utf-8')

# 3) Registry: canonical v1.0.19 and GitHub distribution during stabilization.
p=ROOT/'scripts.json'; data=json.loads(p.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item.get('id')=='mission-rewards':
        item['version']='1.0.19'
        item['metaUrl']=RAW
        item['downloadUrl']=RAW
        item['sourceUrl']=RAW
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# 4) Hub: return Mission Rewards to the normal generic bridge path used by v1.0.18.
hp=ROOT/'SakaLuX-Script-Hub.user.js'; hs=hp.read_text(encoding='utf-8')
hs=re.sub(r'(^// @version\s+)1\.9\.42(\s*$)',r'\g<1>1.9.43\2',hs,count=1,flags=re.M)
hs=hs.replace("const VERSION = '1.9.42';","const VERSION = '1.9.43';",1)
hs=re.sub(r"(id:\s*'mission-rewards',[\s\S]*?version:\s*')1\.1\.4(')",r'\g<1>1.0.19\2',hs,count=1)
# If fallback object is minified/different, handle simple name/version form too.
hs=hs.replace("name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.1.4',","name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.0.19',")

# Undo v1.9.42 Mission-only power special case -> generic bridge.
hs=re.sub(r"\s*if \(script\.id === 'mission-rewards'\) \{\s*localStorage\.setItem\('SakaLuX_MR_ENABLED',[\s\S]*?\}\s*else \{\s*const bridge = document\.getElementById\('sakalux-module-bridge-' \+ script\.id\);\s*if \(!bridge\) throw new Error\('Module control is unavailable for ' \+ script\.name \+ '\.'\);\s*bridge\.dataset\.action = enabled \? 'on' : 'off';\s*bridge\.click\(\);\s*\}","\n            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);\n            if (!bridge) throw new Error('Module control is unavailable for ' + script.name + '.');\n            bridge.dataset.action = enabled ? 'on' : 'off';\n            bridge.click();",hs,count=1)

# Undo Mission-only localStorage OPEN command in runAction.
hs=re.sub(r"\s*if \(script\.id === 'mission-rewards'\) \{\s*try \{ localStorage\.setItem\('SakaLuX_MR_HUB_COMMAND',[\s\S]*?return;\s*\}\s*const bridge = document\.getElementById\('sakalux-module-bridge-' \+ script\.id\);","\n            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);",hs,count=1)
# Power readiness no longer needs Mission registration exception.
hs=hs.replace(" || (script.id === 'mission-rewards' && document.querySelector('[data-slx-standalone-registration=\"mission-rewards\"]'))",'')

# New changelog entry documents stable rebase.
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.43',
            date: '2026-09-13',
            changes: [
                'Mission Rewards is rebased on the confirmed-stable v1.0.18 runtime and released as v1.0.19.',
                'The Mission Guide is now an isolated visual-only layer and no longer touches Mission Rewards init, Hub bridge, API or power logic.',
                'Mission Rewards update metadata now follows the v1.0.19 GitHub stabilization line instead of the broken Greasy Fork 1.1.x branch.'
            ]
        },
"""
if "version: '1.9.43'" not in hs: hs=hs.replace(needle,entry,1)
hp.write_text(hs,encoding='utf-8')

# 5) Current release documentation.
md=ROOT/'greasyfork/Mission-Rewards.md'
if md.exists():
    d=md.read_text(encoding='utf-8')
    d=re.sub(r'(## Current version\s*\n)(?:\*\*)?v?\d+\.\d+\.\d+(?:\*\*)?',r'\g<1>**v1.0.19**',d,count=1)
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.0.19:** Rebased on the confirmed-stable Mission Rewards v1.0.18 runtime.
- Adds the SakaLuX Mission Guide as an isolated visual-only layer for Task + Hint information.
- The guide does not modify Mission Rewards initialization, Hub bridge, ON/OFF state, API access, reward scanning or Standalone Dock behavior.
- Update distribution temporarily follows the GitHub stabilization line so Hub no longer points users to the broken 1.1.x release.
""",d,count=1)
    md.write_text(d,encoding='utf-8')

hd=ROOT/'greasyfork/Script-Hub.md'
if hd.exists():
    d=hd.read_text(encoding='utf-8')
    d=re.sub(r'(## Current version\s*\n)(?:\*\*)?v?\d+\.\d+\.\d+(?:\*\*)?',r'\g<1>**v1.9.43**',d,count=1)
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.9.43:** Mission Rewards is pinned to the stable v1.0.19 line based on the working v1.0.18 runtime.
- Hub no longer treats the old Mission Rewards 1.1.x Greasy Fork branch as the desired release.
- Mission Rewards returns to its normal generic bridge/API control path; the Task + Hint guide is isolated from Hub integration.
""",d,count=1)
    # Current registered list/version mentions.
    d=re.sub(r'(Mission Rewards[^\n]*?)v?1\.1\.\d+',lambda m:m.group(1)+'v1.0.19',d)
    hd.write_text(d,encoding='utf-8')

# Update any current, non-history registry/reference docs if present.
for name in ['README.md','RELEASE-INFO.md','release-info.md','UPDATE-INFO.md']:
    q=ROOT/name
    if not q.exists(): continue
    txt=q.read_text(encoding='utf-8')
    txt=re.sub(r'(Mission Rewards[^\n]{0,120}?)(?:v)?1\.1\.\d+',lambda m:m.group(1)+'v1.0.19',txt)
    q.write_text(txt,encoding='utf-8')

print('Mission Rewards rebased to stable v1.0.19 + isolated guide; Hub v1.9.43')
