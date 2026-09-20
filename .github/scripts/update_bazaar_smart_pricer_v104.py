#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGELOG=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
GF=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
HUB=ROOT/'greasyfork'/'Script-Hub.md'
RELEASE=ROOT/'releases'/'bazaar-smart-pricer-v1.0.4.md'

s=SCRIPT.read_text()
s=s.replace('// @version      1.0.3','// @version      1.0.4',1)
s=s.replace("const VERSION='1.0.3';","const VERSION='1.0.4';",1)
s=s.replace('}. ${PREFIX}-noop{}\n','}\n').replace('}. ${PREFIX}-noop2{}\n','}\n')
SCRIPT.write_text(s)

data=json.loads(REG.read_text())
entry=next((x for x in data.get('scripts',[]) if x.get('id')=='bazaar-smart-pricer'),None)
if not entry: raise SystemExit('registry entry missing')
entry['version']='1.0.4'
entry['detailsRevision']=max(4,int(entry.get('detailsRevision',1))+1)
entry['release']={'version':'1.0.4','date':'2026-09-20','notes':['Keeps the new per-item + immediately before Qty.','Fixes the per-item button CSS emitted in v1.0.3 so the compact controls render consistently in TornPDA/mobile.','The + fills full quantity and smart price; right-edge S PRICE controls remain removed.','RW and bonus-item skip protections remain enabled by default.']}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGELOG.exists():
    t=CHANGELOG.read_text()
    block='## v1.0.4 — 2026-09-20\n- Hotfixes the CSS for the new per-item **+** controls.\n- Keeps each **+** immediately before **Qty**, with full quantity + price fill.\n- Keeps the overflowing right-side controls removed.\n- RW/bonus skip protection remains enabled by default.\n\n'
    if '## v1.0.4 — 2026-09-20' not in t:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGELOG.write_text(t)
if GF.exists():
    t=GF.read_text().replace('**v1.0.3**','**v1.0.4**',1)
    if '### v1.0.4' not in t:t+='\n### v1.0.4 — + button CSS hotfix\n- Fixes rendering of the compact per-item **+** before Qty on mobile/TornPDA.\n'
    GF.write_text(t)
if HUB.exists():HUB.write_text(HUB.read_text().replace('SakaLuX Bazaar Smart Pricer **v1.0.3**','SakaLuX Bazaar Smart Pricer **v1.0.4**'))
RELEASE.parent.mkdir(parents=True,exist_ok=True)
RELEASE.write_text('# SakaLuX Bazaar Smart Pricer v1.0.4\n\nRelease date: **2026-09-20**\n\n- Per-item **+** stays immediately before **Qty**.\n- One tap fills full quantity + smart price.\n- CSS hotfix ensures the compact buttons render correctly on TornPDA/mobile.\n- Right-side overflowing controls remain removed.\n- RW/bonus skip settings remain enabled by default.\n')
print('Bazaar Smart Pricer v1.0.4 synchronized.')
