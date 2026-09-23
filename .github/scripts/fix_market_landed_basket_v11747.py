#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
DOC=ROOT/'greasyfork'/'Market-Intelligence.md'
old='1.17.46'; new='1.17.47'
s=SRC.read_text(encoding='utf-8')
s=s.replace('// @version      '+old,'// @version      '+new,1)
s=s.replace("let v = '"+old+"';","let v = '"+new+"';",1)
s=s.replace("{version:'"+old+"'}","{version:'"+new+"'}",1)
needle="if(!settings.bestRun||detectDestination()||detectInFlight()){existing?.remove();return;}"
repl="if(!settings.bestRun||detectPage()!=='travel'||detectInFlight()){existing?.remove();return;}"
if needle not in s: raise SystemExit('Best Route Basket guard not found')
s=s.replace(needle,repl,1)
SRC.write_text(s,encoding='utf-8')
reg=json.loads(REG.read_text(encoding='utf-8'))
entry=next((x for x in reg.get('scripts',[]) if x.get('id')=='market-intelligence'),None)
if not entry: raise SystemExit('registry entry missing')
entry['version']=new
entry['detailsRevision']=int(entry.get('detailsRevision',0))+1
entry['release']={'version':new,'date':'2026-09-23','notes':[
 'Restores Best Route Basket while landed in a foreign destination such as Hawaii.',
 'Best Route Basket now keys off Travel-page scope instead of suppressing every detected destination.',
 'Travel Session Summary remains Travel-only and collapsed by default.'
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
 d=d.replace('- Canonical version: **v1.17.46**','- Canonical version: **v1.17.47**',1)
 current='''## Current release note\n\n**v1.17.47 — Best Route Basket while landed abroad**\n- Restores Best Route Basket while landed in Hawaii and other supported foreign destinations.\n- Basket rendering remains strictly limited to Travel pages.\n- Travel Session Summary remains collapsed by default and opens only from its arrow.\n'''
 d=re.sub(r'(?is)## Current release note\b.*?(?=\n## )',current.rstrip()+'\n',d,count=1)
 marker='## Release history / Changelog\n'
 hist='''\n### v1.17.47 — Best Route Basket while landed abroad\n- Removes the destination-level suppression that hid Best Route Basket after landing abroad.\n- Uses the Travel-page guard instead, so Hawaii/foreign-country screens can show the basket without leaking it to non-Travel pages.\n- Keeps Travel Session Summary closed by default.\n'''
 if '### v1.17.47' not in d and marker in d: d=d.replace(marker,marker+hist,1)
 DOC.write_text(d,encoding='utf-8')
print('Market Intelligence v1.17.47 landed basket fix applied')