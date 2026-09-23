#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
DOC=ROOT/'greasyfork'/'Market-Intelligence.md'
old='1.17.48'; new='1.17.49'
s=SRC.read_text(encoding='utf-8')
s=s.replace('// @version      '+old,'// @version      '+new,1)
s=s.replace("let v = '"+old+"';","let v = '"+new+"';",1)
s=s.replace("{version:'"+old+"'}","{version:'"+new+"'}",1)

old_guard="if(!settings.bestRun||detectPage()!=='travel'||detectInFlight()){existing?.remove();return;}"
new_guard="if(!settings.bestRun||detectPage()!=='travel'||detectInFlight()||detectDestination()){existing?.remove();return;}"
if old_guard not in s: raise SystemExit('Best Route guard not found')
s=s.replace(old_guard,new_guard,1)

old_scan="""        // On every landed Travel page, render Best Route Basket first.\n        // Being abroad (Hawaii, Mexico, etc.) must never suppress this panel.\n        await renderBestTravelRun();\n        paintTravelSessionSummary();\n        const destination=detectDestination();\n        if(!destination)return;"""
new_scan="""        const destination=detectDestination();\n        // Best Route Basket belongs only to Torn's Travel page, never to a landed foreign-country shop.\n        if(!destination){await renderBestTravelRun();paintTravelSessionSummary();return;}\n        document.getElementById('sl-mi-best-run')?.remove();"""
if old_scan not in s: raise SystemExit('scanTravel landed block not found')
s=s.replace(old_scan,new_scan,1)
SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
entry=next((x for x in reg.get('scripts',[]) if x.get('id')=='market-intelligence'),None)
if not entry: raise SystemExit('market-intelligence registry entry missing')
entry['version']=new
entry['detailsRevision']=int(entry.get('detailsRevision',0))+1
entry['release']={'version':new,'date':'2026-09-23','notes':[
 'Best Route Basket is now shown only on Torn City Travel, not while landed in Hawaii or any other foreign destination.',
 'Foreign-country pages keep their country-specific Best Buys/Travel Planner and Travel Session Summary behavior.',
 'Best Route Basket is removed immediately when a landed foreign destination is detected.'
]}
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

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
 d=d.replace('- Canonical version: **v1.17.48**','- Canonical version: **v1.17.49**',1)
 current='''## Current release note\n\n**v1.17.49 — Best Route Basket only in Torn**\n- Best Route Basket appears only on Torn City Travel before departure.\n- It is hidden while landed in Hawaii, Mexico, Canada and every other foreign destination.\n- Foreign-country Best Buys/Planner and Travel Session Summary remain unchanged.\n'''
 d=re.sub(r'(?is)## Current release note\b.*?(?=\n## )',current.rstrip()+'\n',d,count=1)
 marker='## Release history / Changelog\n'
 hist='''\n### v1.17.49 — Best Route Basket only in Torn\n- Restores strict Torn-side scope for Best Route Basket.\n- Removes the basket immediately on landed foreign-country pages while preserving in-country travel tools.\n- Keeps loading/no-profit visibility on Torn Travel itself.\n'''
 if '### v1.17.49' not in d and marker in d: d=d.replace(marker,marker+hist,1)
 DOC.write_text(d,encoding='utf-8')
print('Market Intelligence v1.17.49 Torn-only Best Route Basket applied')