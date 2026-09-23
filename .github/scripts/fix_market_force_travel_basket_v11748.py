#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
DOC=ROOT/'greasyfork'/'Market-Intelligence.md'
old='1.17.47'; new='1.17.48'
s=SRC.read_text(encoding='utf-8')

# Version sync
s=s.replace('// @version      '+old,'// @version      '+new,1)
s=s.replace("let v = '"+old+"';","let v = '"+new+"';",1)
s=s.replace("{version:'"+old+"'}","{version:'"+new+"'}",1)

# 1) Never suppress Best Route Basket just because a destination is detected.
old_scan="""        if(detectInFlight()){document.getElementById('sl-mi-best-run')?.remove();await renderArrivalStock();return;}\n        document.getElementById('sl-mi-arrival')?.remove();\n        if(!detectDestination()){await renderBestTravelRun();paintTravelSessionSummary();return;}\n        const destination=detectDestination();if(!destination)return;\n        document.getElementById('sl-mi-best-run')?.remove();"""
new_scan="""        if(detectInFlight()){document.getElementById('sl-mi-best-run')?.remove();await renderArrivalStock();return;}\n        document.getElementById('sl-mi-arrival')?.remove();\n        // On every landed Travel page, render Best Route Basket first.\n        // Being abroad (Hawaii, Mexico, etc.) must never suppress this panel.\n        await renderBestTravelRun();\n        paintTravelSessionSummary();\n        const destination=detectDestination();\n        if(!destination)return;"""
if old_scan not in s:
    raise SystemExit('scanTravel landed suppression block not found')
s=s.replace(old_scan,new_scan,1)

# 2) Make renderBestTravelRun itself only care about: feature enabled, Travel page, and not currently flying.
old_guard="if(!settings.bestRun||detectPage()!=='travel'||detectInFlight()){existing?.remove();return;}"
new_guard="if(!settings.bestRun||detectPage()!=='travel'||detectInFlight()){existing?.remove();return;}"
if old_guard not in s:
    raise SystemExit('renderBestTravelRun guard not found')
# unchanged intentionally; verified as the only legitimate scope guard.

# 3) Show a visible Basket status card while data is loading / if no profitable rows exist,
# so the feature never silently disappears on a valid Travel page.
needle="""    async function renderBestTravelRun(){\n        const existing=document.getElementById('sl-mi-best-run');\n        if(!settings.bestRun||detectPage()!=='travel'||detectInFlight()){existing?.remove();return;}\n        const yata=await fetchYataAll(); if(!yata.length) return;"""
repl="""    async function renderBestTravelRun(){\n        const existing=document.getElementById('sl-mi-best-run');\n        if(!settings.bestRun||detectPage()!=='travel'||detectInFlight()){existing?.remove();return;}\n        if(!existing){\n            const loading=document.createElement('div');loading.id='sl-mi-best-run';loading.className='open';\n            loading.innerHTML='<div class=\"sl-mi-br-head\"><span class=\"sl-mi-br-title\">☠︎ BEST ROUTE BASKET</span><strong>Loading routes…</strong><span>Travel only</span><button type=\"button\">▾</button></div><div class=\"sl-mi-perf-note\">Refreshing YATA stock and market prices…</div><div class=\"sl-mi-br-body\"></div>';\n            loading.querySelector('.sl-mi-br-head').onclick=()=>loading.classList.toggle('open');\n            mountTop(loading);\n        }\n        const yata=await fetchYataAll();\n        if(!yata.length){\n            const bar=document.getElementById('sl-mi-best-run');\n            if(bar){const note=bar.querySelector('.sl-mi-perf-note');if(note)note.textContent='No travel stock data available yet · retrying on next scan';}\n            return;\n        }"""
if needle not in s:
    raise SystemExit('renderBestTravelRun start block not found')
s=s.replace(needle,repl,1)

# 4) If cached/live calculations find no profitable route, keep the panel visible with an explicit state.
old_cached="""        const cachedTop=buildBestRunRows(candidates,cachedMap,actualTimes);\n        if(cachedTop.length) paintBestTravelRun(cachedTop,'route baskets · instant cache · '+(settings.travelBudget>0?('budget '+money(settings.travelBudget)+' · '):'')+(actualTimes.size?'actual Torn times '+actualTimes.size+'/'+Object.keys(FLIGHT_MINS).length:'fallback flight times')+' · refreshing '+TRAVEL_REFRESH_LIMIT+' prices');"""
new_cached="""        const cachedTop=buildBestRunRows(candidates,cachedMap,actualTimes);\n        if(cachedTop.length) paintBestTravelRun(cachedTop,'route baskets · instant cache · '+(settings.travelBudget>0?('budget '+money(settings.travelBudget)+' · '):'')+(actualTimes.size?'actual Torn times '+actualTimes.size+'/'+Object.keys(FLIGHT_MINS).length:'fallback flight times')+' · refreshing '+TRAVEL_REFRESH_LIMIT+' prices');\n        else {\n            const bar=document.getElementById('sl-mi-best-run');\n            if(bar){const note=bar.querySelector('.sl-mi-perf-note');if(note)note.textContent='No profitable cached route yet · refreshing live prices';}\n        }"""
if old_cached not in s:
    raise SystemExit('cachedTop block not found')
s=s.replace(old_cached,new_cached,1)

old_final="""        const finalTop=buildBestRunRows(candidates,finalMap,actualTimes);\n        if(finalTop.length) paintBestTravelRun(finalTop,'route baskets · live-refreshed · '+(settings.travelBudget>0?('budget '+money(settings.travelBudget)+' · '):'')+(actualTimes.size?'actual Torn flight times':'fallback flight times')+' · '+ids.length+' prices checked');"""
new_final="""        const finalTop=buildBestRunRows(candidates,finalMap,actualTimes);\n        if(finalTop.length) paintBestTravelRun(finalTop,'route baskets · live-refreshed · '+(settings.travelBudget>0?('budget '+money(settings.travelBudget)+' · '):'')+(actualTimes.size?'actual Torn flight times':'fallback flight times')+' · '+ids.length+' prices checked');\n        else {\n            const bar=document.getElementById('sl-mi-best-run');\n            if(bar){\n                const strong=bar.querySelector('.sl-mi-br-head strong');if(strong)strong.textContent='No profitable route right now';\n                const note=bar.querySelector('.sl-mi-perf-note');if(note)note.textContent='Basket is active · '+ids.length+' live prices checked · waiting for a profitable route';\n            }\n        }"""
if old_final not in s:
    raise SystemExit('finalTop block not found')
s=s.replace(old_final,new_final,1)

# 5) Extend travel scope cleanup to Best Route Basket too, so it is visible ONLY on Travel pages.
old_scope="""    function enforceTravelPanelScope(){\n        if(isTravelPanelPage()) return;\n        document.getElementById('sl-mi-session')?.remove();\n        document.getElementById('sl-mi-arrival')?.remove();\n    }"""
new_scope="""    function enforceTravelPanelScope(){\n        if(isTravelPanelPage()) return;\n        document.getElementById('sl-mi-session')?.remove();\n        document.getElementById('sl-mi-arrival')?.remove();\n        document.getElementById('sl-mi-best-run')?.remove();\n    }"""
if old_scope not in s:
    raise SystemExit('enforceTravelPanelScope block not found')
s=s.replace(old_scope,new_scope,1)

SRC.write_text(s,encoding='utf-8')

# Sanity audit: no landed/destination suppression is allowed for sl-mi-best-run.
text=SRC.read_text(encoding='utf-8')
for forbidden in [
    "if(!detectDestination()){await renderBestTravelRun();paintTravelSessionSummary();return;}",
    "document.getElementById('sl-mi-best-run')?.remove();\n        const availableCash",
    "detectDestination()||detectInFlight()"
]:
    if forbidden in text:
        raise SystemExit('forbidden Best Route Basket suppression remains: '+forbidden)

reg=json.loads(REG.read_text(encoding='utf-8'))
entry=next((x for x in reg.get('scripts',[]) if x.get('id')=='market-intelligence'),None)
if not entry: raise SystemExit('registry entry missing')
entry['version']=new
entry['detailsRevision']=int(entry.get('detailsRevision',0))+1
entry['release']={'version':new,'date':'2026-09-23','notes':[
 'Removes every landed-destination suppression that could hide Best Route Basket in Hawaii or any other foreign country.',
 'Best Route Basket now renders on every non-flight Travel page, before country-specific Best Buys processing.',
 'Keeps a visible Basket status card while YATA/market data loads or when no profitable route currently exists.',
 'Travel Session Summary remains Travel-only and collapsed by default; Best Route Basket is also purged when leaving Travel.'
]}
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Hub fallback registry sync
h=HUB.read_text(encoding='utf-8')
start='    const FALLBACK_REGISTRY = '; end='\n\n    let registry = '
a=h.find(start); b=h.find(end,a)
if a<0 or b<0: raise SystemExit('Hub fallback registry boundaries missing')
payload=json.dumps(reg,indent=4,ensure_ascii=False).replace('\n','\n    ')
h=h[:a]+start+payload+h[b:]
HUB.write_text(h,encoding='utf-8')

if DOC.exists():
    d=DOC.read_text(encoding='utf-8')
    d=re.sub(r'(?is)(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+new+r'\2',d,count=1)
    d=d.replace('- Canonical version: **v1.17.47**','- Canonical version: **v1.17.48**',1)
    current='''## Current release note\n\n**v1.17.48 — Force Best Route Basket on landed Travel pages**\n- Removes all destination-level suppression of Best Route Basket.\n- Renders Basket on every non-flight Travel page, including Hawaii and all supported foreign destinations.\n- Keeps the Basket card visible while data loads or when no profitable route exists instead of silently disappearing.\n- Travel Session Summary remains Travel-only and collapsed by default.\n'''
    d=re.sub(r'(?is)## Current release note\b.*?(?=\n## )',current.rstrip()+'\n',d,count=1)
    marker='## Release history / Changelog\n'
    hist='''\n### v1.17.48 — Force Best Route Basket on landed Travel pages\n- Removed the scanTravel destination branch that skipped and then explicitly removed Best Route Basket after landing abroad.\n- Basket is rendered before country-specific Best Buys/Planner work on all landed Travel pages.\n- Added persistent loading/no-profit states so the panel never vanishes silently on a valid Travel page.\n- Non-Travel cleanup still removes Basket and Travel Session Summary, keeping both strictly Travel-only.\n'''
    if '### v1.17.48' not in d and marker in d:d=d.replace(marker,marker+hist,1)
    DOC.write_text(d,encoding='utf-8')

print('Market Intelligence v1.17.48 force Travel Basket fix applied and audited')
