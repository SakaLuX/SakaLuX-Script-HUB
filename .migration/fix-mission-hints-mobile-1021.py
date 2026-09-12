from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
mission=ROOT/'SakaLuX-Mission-Rewards.user.js'
s=mission.read_text(encoding='utf-8')
# Version only Mission Rewards; Hub version stays unchanged.
s=s.replace('// @version      1.0.20','// @version      1.0.21',1)
s=s.replace("{version:'1.0.20'}","{version:'1.0.21'}",1)
s=s.replace("const VERSION = '1.0.20';","const VERSION = '1.0.21';",1)

old_title='''    function missionTitle(card) {\n        const node = card.querySelector('.title-black, [class*="title-black"]');\n        if (!node) return '';\n        const raw = node.childNodes?.[0]?.wholeText || node.textContent || '';\n        return String(raw).replace(/\\s+/g, ' ').trim();\n    }\n\n    function missionCards() {\n        const exact = [...document.querySelectorAll('.giver-cont-wrap > div[id^="mission"]')];\n        if (exact.length) return exact;\n        return [...document.querySelectorAll('#missionsMainContainer div[id^="mission"], [id^="mission"][class*="mission"]')];\n    }'''
new_title='''    function missionTitle(card) {\n        const stored = card?.dataset?.slxMissionTitle || '';\n        if (stored) return stored;\n        const node = card?.querySelector?.('.title-black, [class*="title-black"], h1, h2, h3, h4, [class*="title"], [class*="name"]');\n        if (!node) return '';\n        const raw = node.childNodes?.[0]?.wholeText || node.textContent || '';\n        return String(raw).replace(/\\s+/g, ' ').trim();\n    }\n\n    function isVisibleElement(el) {\n        if (!el || !el.isConnected) return false;\n        const r=el.getBoundingClientRect?.();\n        if (!r || r.width < 2 || r.height < 2) return false;\n        const cs=getComputedStyle(el);\n        return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) !== 0;\n    }\n\n    function findMobileActiveMissionHost() {\n        const root=document.getElementById('missionsMainContainer') || document.body;\n        if (!root) return null;\n        const candidates=[];\n        for (const el of root.querySelectorAll('h1,h2,h3,h4,h5,strong,b,span,div')) {\n            if (!isVisibleElement(el)) continue;\n            if (el.children.length > 3) continue;\n            const text=String(el.textContent||'').replace(/\\s+/g,' ').trim();\n            if (!text || text.length > 80) continue;\n            const key=normalizeMissionKey(text);\n            if (!MISSION_GUIDE[key]) continue;\n            candidates.push({el,text,key});\n        }\n        if (!candidates.length) return null;\n        // TornPDA renders the selected mission detail after the mission list. Prefer\n        // the last visible matching title and a compact parent host around it.\n        const chosen=candidates[candidates.length-1];\n        let host=chosen.el.parentElement || chosen.el;\n        for (let i=0;i<3 && host?.parentElement;i++) {\n            const txt=String(host.textContent||'').trim();\n            if (txt.length >= 90 && txt.length <= 1800) break;\n            host=host.parentElement;\n        }\n        if (!host) return null;\n        host.dataset.slxMissionTitle=chosen.text;\n        return host;\n    }\n\n    function missionCards() {\n        const exact = [...document.querySelectorAll('.giver-cont-wrap > div[id^="mission"], #missionsMainContainer div[id^="mission"], [id^="mission"][class*="mission"]')];\n        const mobile=findMobileActiveMissionHost();\n        if (mobile && !exact.includes(mobile)) exact.push(mobile);\n        return exact;\n    }'''
if old_title not in s:
    raise SystemExit('missionTitle/missionCards block not found')
s=s.replace(old_title,new_title,1)
mission.write_text(s,encoding='utf-8')

# Registry canonical version.
sp=ROOT/'scripts.json'; data=json.loads(sp.read_text(encoding='utf-8'))
for row in data['scripts']:
    if row.get('id')=='mission-rewards':
        row['version']='1.0.21'
        row['description']='Stable Mission Shop reward intelligence with isolated Duke mission hints and TornPDA mobile-detail detection.'
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub fallback only: do NOT bump Hub VERSION / changelog.
hp=ROOT/'SakaLuX-Script-Hub.user.js'; h=hp.read_text(encoding='utf-8')
h,n=re.subn(r"(id\s*:\s*'mission-rewards'.*?version\s*:\s*')([^']+)(')",r"\g<1>1.0.21\3",h,count=1,flags=re.S)
if n!=1: raise SystemExit('Hub fallback mission row not found')
hp.write_text(h,encoding='utf-8')

# Mission info/release.
dp=ROOT/'greasyfork/Mission-Rewards.md'; d=dp.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v1.0.21**',d,count=1)
d=re.sub(r'## Current release note\s*\n\n.*?\n\n## Recommended', '''## Current release note\n\n**v1.0.21** keeps the proven v1.0.18 Mission Rewards core and the isolated Mission Hints module, and adds TornPDA mobile-layout detection for the currently selected mission detail panel. Task + Hint can now render when Torn uses the newer mobile mission layout instead of the legacy `.title-black` mission-card structure. The Hub/bootstrap/init core is unchanged.\n\n## Recommended''',d,count=1,flags=re.S)
dp.write_text(d,encoding='utf-8')

# Hub info may list managed versions; update only Mission version, never Hub version.
hdoc=ROOT/'greasyfork/Script-Hub.md'; hd=hdoc.read_text(encoding='utf-8')
hd=re.sub(r'(Mission Rewards\s+\*\*v)[^*]+(\*\*)',r'\g<1>1.0.21\2',hd)
hdoc.write_text(hd,encoding='utf-8')
print('Mission Rewards v1.0.21 mobile hints fix applied; Hub version untouched.')