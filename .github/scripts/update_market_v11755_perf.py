from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / 'SakaLuX-Market-Intelligence.user.js'
REG = ROOT / 'scripts.json'
DOC = ROOT / 'greasyfork' / 'Market-Intelligence.md'
REL = ROOT / 'releases' / 'market-intelligence-v1.17.55.md'

s = SCRIPT.read_text(encoding='utf-8')

# Version synchronization
s = s.replace('// @version      1.17.54', '// @version      1.17.55', 1)
s = s.replace("let v = '1.17.54';", "let v = '1.17.55';", 1)
s = s.replace("const VERSION = '1.17.54';", "const VERSION = '1.17.55';", 1)

# Add low-cost YATA cache/in-flight dedupe. Travel used to refetch the full export repeatedly.
old = """    async function fetchYataAll(){\n        const data=await requestJson(YATA_EXPORT_URL); const countries=data?.stocks||data||{}; const rows=[];"""
new = """    let yataCacheRows=null,yataCacheAt=0,yataPending=null;\n    const YATA_CACHE_MS=60*1000;\n    async function fetchYataAll(force=false){\n        const now=Date.now();\n        if(!force&&yataCacheRows&&now-yataCacheAt<YATA_CACHE_MS)return yataCacheRows;\n        if(!force&&yataPending)return yataPending;\n        yataPending=(async()=>{\n        const data=await requestJson(YATA_EXPORT_URL,{ttl:30000}); const countries=data?.stocks||data||{}; const rows=[];"""
if old not in s:
    raise SystemExit('fetchYataAll anchor not found')
s = s.replace(old, new, 1)

old_end = """        return rows;\n    }\n\n    function ensureBadge(row,cls)"""
new_end = """        yataCacheRows=rows; yataCacheAt=Date.now(); return rows;\n        })().finally(()=>{yataPending=null;});\n        return yataPending;\n    }\n\n    function ensureBadge(row,cls)"""
if old_end not in s:
    raise SystemExit('fetchYataAll end anchor not found')
s = s.replace(old_end, new_end, 1)

# Travel scans were allowed to be requested roughly every 1.8s by the body MutationObserver.
# Throttle passive Travel scans by lifecycle state while preserving route/manual force scans.
old_sched = """    function scheduleScan(force=false){if(state.scanTimer)clearTimeout(state.scanTimer);state.scanTimer=setTimeout(()=>{state.scanTimer=null;scan(force);},450);}"""
new_sched = """    function scheduleScan(force=false){\n        if(detectPage()==='travel'&&!force){\n            const now=Date.now(),ctx=detectTravelStateRuntime();\n            const minGap=ctx.state===TRAVEL_STATES.IN_FLIGHT?10000:ctx.state===TRAVEL_STATES.LANDED_ABROAD?12000:15000;\n            if(now-Number(state.lastTravelScheduleAt||0)<minGap){state.observerSkips++;return;}\n            state.lastTravelScheduleAt=now;\n        }\n        if(state.scanTimer)clearTimeout(state.scanTimer);\n        state.scanTimer=setTimeout(()=>{state.scanTimer=null;scan(force);},force?80:500);\n    }"""
if old_sched not in s:
    raise SystemExit('scheduleScan anchor not found')
s = s.replace(old_sched, new_sched, 1)

# Tighten MutationObserver travel gate too: it previously woke about every 1.8s.
s = s.replace("now-state.lastObserverScan<1800", "now-state.lastObserverScan<5000", 1)

SCRIPT.write_text(s, encoding='utf-8')

# Registry sync
obj=json.loads(REG.read_text(encoding='utf-8'))
for row in obj.get('scripts',[]):
    if row.get('id')=='market-intelligence':
        row['version']='1.17.55'
        row['detailsRevision']=int(row.get('detailsRevision') or 0)+1
        row['release']={
            'version':'1.17.55','date':'2026-09-28',
            'notes':[
                'Performance update for Travel/TornPDA.',
                'Caches and deduplicates the full YATA travel export for 60 seconds.',
                'Throttles passive Travel scans by lifecycle state instead of allowing repeated heavy scans every few seconds.',
                'Keeps forced scans immediate for navigation, manual refreshes and meaningful landed-stock changes.'
            ]
        }
        break
REG.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')

# Documentation/release notes
if DOC.exists():
    d=DOC.read_text(encoding='utf-8')
    d=d.replace('**v1.17.54**','**v1.17.55**',1)
    d=d.replace('Canonical version: **v1.17.54**','Canonical version: **v1.17.55**',1)
    marker='## Changelog\n'
    entry='''\n### v1.17.55 — Travel performance pass\n- Adds a 60-second YATA export cache with in-flight request deduplication.\n- Throttles passive Travel rescans by lifecycle state: in-flight 10s, landed 12s, travel agency 15s.\n- Keeps forced navigation/manual refreshes responsive while cutting repeated DOM scans and API work on TornPDA.\n\n'''
    if marker in d: d=d.replace(marker,marker+entry,1)
    else: d+=entry
    DOC.write_text(d,encoding='utf-8')

REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Market Intelligence v1.17.55\n\nRelease date: **2026-09-28**\n\n## Performance\n- YATA travel export is cached for 60 seconds and concurrent requests are deduplicated.\n- Passive Travel scans are lifecycle-throttled instead of repeatedly running expensive travel calculations on nearly every DOM mutation.\n- In-flight passive scans: 10 seconds.\n- Landed-abroad passive scans: 12 seconds.\n- Travel-agency passive scans: 15 seconds.\n- Forced scans remain fast for navigation, manual actions and landed-stock refreshes.\n\n## Expected effect\nThis specifically targets TornPDA/mobile lag on Travel pages without removing Best Route, Arrival Basket, Best Buys, stock ETA, MI INFO or market-price features.\n''',encoding='utf-8')
