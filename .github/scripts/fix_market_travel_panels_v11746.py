#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
DOC=ROOT/'greasyfork'/'Market-Intelligence.md'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
s=SRC.read_text(encoding='utf-8')

old='1.17.45'; new='1.17.46'
s=s.replace('// @version      '+old,'// @version      '+new,1)
s=s.replace("let v = '"+old+"';","let v = '"+new+"';",1)
s=s.replace("{version:'"+old+"'}","{version:'"+new+"'}",1)

old_detect="""        // Torn's mobile/PDA in-flight screen is not always kept on ?sid=travel.\n        // Detect the actual flight card too so Arrival Basket runs on /index.php-style travel views.\n        if(/sid=travel/i.test(u)||/Remaining Flight Time/i.test(body)||/(?:Traveling\\s+(?:from\\s+.+?\\s+)?to|Torn\\s+to)\\s+[A-Za-zÀ-ÿ .'-]+/i.test(body)) return 'travel';"""
new_detect="""        // Torn's mobile/PDA travel views are not always kept on ?sid=travel.\n        // Treat in-flight AND landed-abroad country/shop views as Travel, including Hawaii.\n        const travelLabels=Object.values(TORN_TRAVEL_LABELS||{}).flat().filter(Boolean);\n        const abroadLabel=travelLabels.some(label=>new RegExp('(?:^|\\\\b)'+String(label).replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')+'(?:\\\\b|$)','i').test(body));\n        const abroadUi=/\\b(?:return to torn|travel home|travel back|items? available|foreign market|abroad|currently in)\\b/i.test(body)\n            ||!!document.querySelector('a[href*=\"travelagency\" i],a[href*=\"sid=travel\" i],a[href*=\"travel\" i][href*=\"index\" i]');\n        if(/sid=travel/i.test(u)||/travelagency\\.php/i.test(u)||/abroad\\.php/i.test(u)||/Remaining Flight Time/i.test(body)||/(?:Traveling\\s+(?:from\\s+.+?\\s+)?to|Torn\\s+to)\\s+[A-Za-zÀ-ÿ .'-]+/i.test(body)||(abroadLabel&&abroadUi)) return 'travel';"""
if old_detect not in s:
    raise SystemExit('detectPage travel block not found')
s=s.replace(old_detect,new_detect,1)

old_session="""        const wasOpen=existing?existing.classList.contains('open'):true;\n        const bar=existing||document.createElement('div');bar.id='sl-mi-session';bar.classList.toggle('open',wasOpen);"""
new_session="""        // Travel Session Summary always starts collapsed on every render/navigation.\n        // The user opens it explicitly from the arrow when needed.\n        const bar=existing||document.createElement('div');bar.id='sl-mi-session';bar.classList.remove('open');"""
if old_session not in s:
    raise SystemExit('Travel Session open-state block not found')
s=s.replace(old_session,new_session,1)

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
entry=next((x for x in reg.get('scripts',[]) if x.get('id')=='market-intelligence'),None)
if not entry: raise SystemExit('market-intelligence registry entry missing')
entry['version']=new
entry['detailsRevision']=int(entry.get('detailsRevision',0))+1
entry['release']={
  'version':new,'date':'2026-09-23','notes':[
    'Restores Travel-page detection while landed abroad, including Hawaii and the other supported foreign destinations.',
    'Best Route Basket and Travel Session Summary remain strictly Travel-only and are removed on every non-Travel page.',
    'Travel Session Summary now always renders collapsed; it opens only when the user taps its arrow.'
  ]
}
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Keep Hub offline fallback registry synchronized with scripts.json.
h=HUB.read_text(encoding='utf-8')
start='    const FALLBACK_REGISTRY = '
end='\n\n    let registry = '
a=h.find(start); b=h.find(end,a)
if a>=0 and b>=0:
    payload=json.dumps(reg,indent=4,ensure_ascii=False).replace('\n','\n    ')
    h=h[:a]+start+payload+h[b:]
HUB.write_text(h,encoding='utf-8')

if DOC.exists():
    d=DOC.read_text(encoding='utf-8')
    d=re.sub(r'(?is)(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+new+r'\2',d,count=1)
    d=d.replace('- Verified: **2026-09-20**','- Verified: **2026-09-23**',1)
    d=d.replace('- Canonical version: **v1.17.45**','- Canonical version: **v1.17.46**',1)
    current='''## Current release note\n\n**v1.17.46 — Landed-abroad Travel panels + collapsed session summary**\n- Restores Travel-page detection while landed abroad, including Hawaii and the other supported foreign destinations.\n- Best Route Basket and Travel Session Summary remain strictly Travel-only and are removed on every non-Travel page.\n- Travel Session Summary always renders collapsed and opens only when the user taps the arrow.\n'''
    d=re.sub(r'(?is)## Current release note\b.*?(?=\n## )',current.rstrip()+'\n',d,count=1)
    marker='## Release history / Changelog\n'
    hist='''\n### v1.17.46 — Landed-abroad Travel panels + collapsed session summary\n- Recognizes landed foreign-country views such as Hawaii as Travel in TornPDA/mobile.\n- Keeps Best Route Basket and Travel Session Summary confined to Travel pages only.\n- Forces Travel Session Summary closed by default on every render/navigation; the arrow is the only way to expand it.\n'''
    if '### v1.17.46' not in d and marker in d:
        d=d.replace(marker,marker+hist,1)
    DOC.write_text(d,encoding='utf-8')

print('Market Intelligence v1.17.46 travel panel fix applied')