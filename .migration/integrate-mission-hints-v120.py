from pathlib import Path
import json,re,subprocess

ROOT=Path(__file__).resolve().parents[1]
OLD_COMMIT='cfe227f23114fc96d7beed7fa6e3f368dd244cbf'
MISSION=ROOT/'SakaLuX-Mission-Rewards.user.js'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
REG=ROOT/'scripts.json'
MD=ROOT/'greasyfork/Mission-Rewards.md'
HUB_MD=ROOT/'greasyfork/Script-Hub.md'
NEW_VERSION='1.2.0'
NEW_HUB_VERSION='1.9.36'
BEGIN='/* SAKALUX_MISSION_HINTS_V120_BEGIN */'
END='/* SAKALUX_MISSION_HINTS_V120_END */'

# Reuse only the independently written/rephrased SakaLuX mission facts from the
# previous experimental branch. Do not reuse the old runtime/bootstrap code.
old=subprocess.check_output(
    ['git','show',f'{OLD_COMMIT}:SakaLuX-Mission-Rewards.user.js'],
    cwd=ROOT,text=True,encoding='utf-8'
)
start=old.find('    const MISSION_GUIDE = {')
if start < 0:
    raise SystemExit('Historical SakaLuX MISSION_GUIDE not found')
end=old.find('\n    };',start)
if end < 0:
    raise SystemExit('Historical SakaLuX MISSION_GUIDE end not found')
guide=old[start:end+7]
# De-indent for a standalone isolated integration block.
guide='\n'.join(line[4:] if line.startswith('    ') else line for line in guide.splitlines())

s=MISSION.read_text(encoding='utf-8')
# Idempotency: remove only our new isolated block if this migration is rerun.
if BEGIN in s and END in s:
    s=re.sub(re.escape(BEGIN)+r'.*?'+re.escape(END)+r'\s*','',s,flags=re.S)

# Version synchronization inside the stable v1.0.18 base.
s=re.sub(r'(^//\s*@version\s+)\S+',rf'\g<1>{NEW_VERSION}',s,count=1,flags=re.M)
s=re.sub(r'(\{version:\s*[\'\"])[^\'\"]+([\'\"]\}\);)',rf'\g<1>{NEW_VERSION}\2',s,count=1)
s=re.sub(r"(const VERSION\s*=\s*['\"])[^'\"]+(['\"]\s*;)",rf'\g<1>{NEW_VERSION}\2',s,count=1)
s=s.replace(
    '// @description  Advanced Mission Shop reward information, value per credit, ammo ownership and weapon mod tracking for Torn PDA / Tampermonkey.',
    '// @description  Mission Shop reward intelligence plus integrated Duke mission task and hint guidance for Torn PDA / Tampermonkey.'
)

integration=f'''\n\n{BEGIN}\n/*\n * Integrated Duke Mission Task + Hint guide.\n * Independent SakaLuX implementation inspired by the public TornTools Mission Hints feature.\n * No external runtime dependency, no userscript-manager bridge, and no Violentmonkey-specific code.\n */\n(() => {{\n    'use strict';\n\n{guide}\n\n    const STYLE_ID = 'sl-mr-integrated-mission-hints-style';\n    const BOX_CLASS = 'sl-mr-mission-hint';\n    let renderTimer = 0;\n\n    function isMissionsPage() {{\n        const u = String(location.href || '');\n        return /(?:loader|page)\\.php\\?[^#]*sid=missions/i.test(u) || /#.*missions/i.test(u);\n    }}\n\n    function moduleEnabled() {{\n        try {{\n            const api = window.SakaLuXMissionRewards;\n            if (api && typeof api.isEnabled === 'function') return api.isEnabled() !== false;\n        }} catch {{}}\n        return true;\n    }}\n\n    function normalizeMissionKey(title) {{\n        return String(title || '')\n            .toLowerCase()\n            .replace(/&nbsp;/g, ' ')\n            .replace(/[’']/g, '')\n            .replace(/[^a-z0-9\\s-]/g, '')\n            .replace(/[-\\s]+/g, '_')\n            .replace(/_+/g, '_')\n            .replace(/^_+|_+$/g, '');\n    }}\n\n    function missionTitle(card) {{\n        const node = card.querySelector('.title-black, [class*="title-black"]');\n        if (!node) return '';\n        const raw = node.childNodes?.[0]?.wholeText || node.textContent || '';\n        return String(raw).replace(/\\s+/g, ' ').trim();\n    }}\n\n    function missionCards() {{\n        const exact = [...document.querySelectorAll('.giver-cont-wrap > div[id^="mission"]')];\n        if (exact.length) return exact;\n        return [...document.querySelectorAll('#missionsMainContainer div[id^="mission"], [id^="mission"][class*="mission"]')];\n    }}\n\n    function ensureStyle() {{\n        if (document.getElementById(STYLE_ID)) return;\n        const style=document.createElement('style');\n        style.id=STYLE_ID;\n        style.textContent=`\n.${{BOX_CLASS}}{{margin:14px 0 2px;padding:10px 12px;border:1px solid rgba(69,157,255,.32);border-radius:10px;background:linear-gradient(145deg,rgba(20,31,44,.96),rgba(13,21,30,.96));color:#dce8f5;font:12px/1.45 Arial,sans-serif;box-sizing:border-box}}\n.${{BOX_CLASS}} .sl-mr-hint-title{{margin:0 0 7px;color:#71b7ff;text-align:center;font-size:12px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}}\n.${{BOX_CLASS}} .sl-mr-hint-row{{margin:3px 0;white-space:normal;overflow-wrap:anywhere}}\n.${{BOX_CLASS}} .sl-mr-hint-label{{color:#f3f7fb;font-weight:900}}\n.${{BOX_CLASS}} .sl-mr-hint-text{{color:#cbd8e6}}\n`;\n        (document.head||document.documentElement).appendChild(style);\n    }}\n\n    function removeExternalDuplicates(card) {{\n        card.querySelectorAll('.tt-mission-information,.tpda-mission-information').forEach(el=>{{\n            if (!el.classList.contains(BOX_CLASS)) el.style.setProperty('display','none','important');\n        }});\n    }}\n\n    function renderMissionHints() {{\n        if (!isMissionsPage()) return;\n        ensureStyle();\n        const enabled=moduleEnabled();\n        for (const card of missionCards()) {{\n            const existing=card.querySelector('.'+BOX_CLASS);\n            if (!enabled) {{ existing?.remove(); continue; }}\n            const title=missionTitle(card);\n            if (!title) continue;\n            const info=MISSION_GUIDE[normalizeMissionKey(title)];\n            if (!info) {{ existing?.remove(); continue; }}\n            removeExternalDuplicates(card);\n            const host=card.querySelector('.max-height-fix') || card;\n            const box=existing || document.createElement('div');\n            box.className=BOX_CLASS;\n            box.replaceChildren();\n            const heading=document.createElement('div');\n            heading.className='sl-mr-hint-title';\n            heading.textContent='Mission Information';\n            box.appendChild(heading);\n            const task=document.createElement('div');\n            task.className='sl-mr-hint-row';\n            const tl=document.createElement('span'); tl.className='sl-mr-hint-label'; tl.textContent='Task: ';\n            const tv=document.createElement('span'); tv.className='sl-mr-hint-text'; tv.textContent=info.task || '';\n            task.append(tl,tv); box.appendChild(task);\n            if (info.hint) {{\n                const hint=document.createElement('div');\n                hint.className='sl-mr-hint-row';\n                const hl=document.createElement('span'); hl.className='sl-mr-hint-label'; hl.textContent='Hint: ';\n                const hv=document.createElement('span'); hv.className='sl-mr-hint-text'; hv.textContent=info.hint;\n                hint.append(hl,hv); box.appendChild(hint);\n            }}\n            if (!existing) host.appendChild(box);\n        }}\n    }}\n\n    function scheduleRender() {{\n        clearTimeout(renderTimer);\n        renderTimer=setTimeout(renderMissionHints,80);\n    }}\n\n    function start() {{\n        scheduleRender();\n        const root=document.getElementById('missionsMainContainer') || document.body || document.documentElement;\n        if (!root) return;\n        new MutationObserver(scheduleRender).observe(root,{{childList:true,subtree:true}});\n        window.addEventListener('hashchange',scheduleRender);\n        window.addEventListener('popstate',scheduleRender);\n        document.addEventListener('sakalux:mission-rewards-state',scheduleRender);\n    }}\n\n    window.SakaLuXMissionHints={{\n        version:'{NEW_VERSION}',\n        refresh:renderMissionHints,\n        count:()=>Object.keys(MISSION_GUIDE).length\n    }};\n\n    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{{once:true}});\n    else start();\n}})();\n{END}\n'''

s=s.rstrip()+integration+'\n'
MISSION.write_text(s,encoding='utf-8')

# Registry: Mission Rewards is one of the five Hub-managed modules.
data=json.loads(REG.read_text(encoding='utf-8'))
for row in data['scripts']:
    if row.get('id')=='mission-rewards':
        row['version']=NEW_VERSION
        row['description']='Mission Shop reward intelligence with integrated Duke mission task and hint guidance.'
        break
else:
    raise SystemExit('mission-rewards missing from scripts.json')
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub offline fallback + Hub release bump so existing installations can receive the new fallback metadata.
h=HUB.read_text(encoding='utf-8')
h=re.sub(r'(^//\s*@version\s+)\S+',rf'\g<1>{NEW_HUB_VERSION}',h,count=1,flags=re.M)
h=re.sub(r"(const VERSION\s*=\s*')[^']+(';)",rf'\g<1>{NEW_HUB_VERSION}\2',h,count=1)
# Update only Mission Rewards fallback row.
m=re.search(r"(id\s*:\s*'mission-rewards'.*?version\s*:\s*')([^']+)(')",h,re.S)
if not m: raise SystemExit('Hub Mission Rewards fallback row not found')
h=h[:m.start(2)]+NEW_VERSION+h[m.end(2):]
# Add Hub changelog entry exactly once.
if "version: '1.9.36'" not in h:
    anchor='    const HUB_CHANGELOG = [\n'
    entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.36',
            date: '2026-09-13',
            changes: [
                'Registers Mission Rewards v1.2.0 with the integrated Duke Mission Task + Hint guide.',
                'Keeps Mission Hints fully local with no userscript-manager-specific bridge or external runtime dependency.',
                'Synchronizes the Mission Rewards fallback registry with scripts.json.'
            ]
        },
"""
    if anchor not in h: raise SystemExit('Hub changelog anchor missing')
    h=h.replace(anchor,entry,1)
HUB.write_text(h,encoding='utf-8')

# Mission Rewards information page.
d=MD.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',rf'\1**v{NEW_VERSION}**',d,count=1)
if 'Shows the Duke mission task and a practical hint before accepting supported missions.' not in d:
    d=d.replace('## What it does\n', '## What it does\n- Shows the Duke mission task and a practical hint before accepting supported missions.\n',1)
d=re.sub(
    r'## Current release note\s*\n\n.*?\n\n## Recommended',
    f'''## Current release note\n\n**v{NEW_VERSION}** integrates Duke Mission Task + Hint guidance directly into Mission Rewards on top of the stable v1.0.18 base. The guide is local and isolated from the Mission Shop/API runtime, with no Violentmonkey-specific bridge and no external runtime dependency.\n\n## Recommended''',
    d,count=1,flags=re.S
)
if '### v1.2.0 — Integrated Mission Hints' not in d:
    marker='## Release history\n'
    history='''## Release history\n### v1.2.0 — Integrated Mission Hints\n\n- Added locally integrated Duke mission Task + Hint guidance.\n- Uses the stable v1.0.18 Mission Rewards runtime as the base.\n- Kept the Mission Hints renderer isolated so Mission Shop/API startup remains unchanged.\n- No Violentmonkey-specific compatibility layer or external runtime dependency.\n\n'''
    if marker in d: d=d.replace(marker,history,1)
MD.write_text(d,encoding='utf-8')

# Hub information page.
hd=HUB_MD.read_text(encoding='utf-8')
hd=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',rf'\1**v{NEW_HUB_VERSION}**',hd,count=1)
hd=re.sub(
    r'## Current release note\s*\n\n.*?\n\n## Recommended',
    f'''## Current release note\n\n**v{NEW_HUB_VERSION}** synchronizes Mission Rewards v{NEW_VERSION} after the safe integrated Duke Mission Task + Hint release and keeps the offline fallback registry aligned with `scripts.json`.\n\n## Recommended''',
    hd,count=1,flags=re.S
)
hd=re.sub(r'(SakaLuX Mission Rewards\s+\*\*v)[^*]+(\*\*)',rf'\g<1>{NEW_VERSION}\2',hd)
HUB_MD.write_text(hd,encoding='utf-8')

print('Integrated Mission Hints safely into Mission Rewards',NEW_VERSION)
print('Hub synchronized to',NEW_HUB_VERSION)
