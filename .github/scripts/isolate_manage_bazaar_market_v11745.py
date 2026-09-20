#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil
ROOT=Path('.')
SCRIPT=ROOT/'SakaLuX-Market-Intelligence.user.js'; REG=ROOT/'scripts.json'; GF=ROOT/'greasyfork'/'Market-Intelligence.md'; HUBDOC=ROOT/'greasyfork'/'Script-Hub.md'; HUB=ROOT/'SakaLuX-Script-Hub.user.js'
NEW='1.17.45'; DATE='2026-09-20'; REL=ROOT/'releases'/f'market-intelligence-v{NEW}.md'
s=SCRIPT.read_text(encoding='utf-8')
m=re.search(r'// @version\s+([0-9.]+)',s); old=m.group(1) if m else None
if old==NEW: raise SystemExit('already applied')
if old!='1.17.44': raise SystemExit(f'unexpected market version {old}')
BACKUP=ROOT/'backups'/f'market-manage-isolation-v{old}-{DATE}'; BACKUP.mkdir(parents=True,exist_ok=True); shutil.copy2(SCRIPT,BACKUP/f'SakaLuX-Market-Intelligence-v{old}.user.js')
s=re.sub(r'// @version\s+[0-9.]+',f'// @version      {NEW}',s,count=1)
s=re.sub(r"let v = '[0-9.]+';",f"let v = '{NEW}';",s,count=1)
s=re.sub(r"\{version:'[0-9.]+'\}\);",f"{{version:'{NEW}'}});",s,count=1)
helper='''    function isManageBazaarPage(){\n        const href=String(location.href||'').toLowerCase();\n        if(!href.includes('bazaar.php'))return false;\n        if(/#\\/?(?:manage|bazaar(?:\\/manage)?)(?:[/?#]|$)/i.test(location.hash||''))return true;\n        const text=String(document.body?.innerText||'').toLowerCase();\n        return text.includes('manage your bazaar')&&text.includes('manage items');\n    }\n\n    function purgeManageBazaarMarketUi(){\n        document.querySelectorAll('.sl-mi-items,.sl-mi-bazaar,#sl-mi-bazaar-board,[data-sl-mi-inline]').forEach(n=>n.remove());\n    }\n\n'''
anchor='    function isBazaarSaleEditorRow(row){\n'
if anchor not in s: raise SystemExit('market bazaar helper anchor missing')
s=s.replace(anchor,helper+anchor,1)
# Hard-stop every page decorator that can touch Bazaar rows.
s=s.replace("    async function scanItems(){\n        if(!settings.items)return;", "    async function scanItems(){\n        if(isManageBazaarPage()){purgeManageBazaarMarketUi();return;}\n        if(!settings.items)return;",1)
s=s.replace("    async function scanBazaar(){\n        if(!settings.bazaar)return;", "    async function scanBazaar(){\n        if(isManageBazaarPage()){purgeManageBazaarMarketUi();return;}\n        if(!settings.bazaar)return;",1)
# Prevent any Bazaar add/sale view detector from treating Manage as a decoration target.
s=s.replace("    function isBazaarAddItemsView(){\n", "    function isBazaarAddItemsView(){\n        if(isManageBazaarPage())return false;\n",1)
SCRIPT.write_text(s,encoding='utf-8')
reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']=NEW; e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':NEW,'date':DATE,'notes':['Strict Manage Bazaar isolation: Market Intelligence does not decorate, scan or inject anything into Manage your Bazaar / Manage items.','Items estimate badges and Bazaar boards are purged if TornPDA transitions into Manage Bazaar.','scanItems and scanBazaar return immediately on Manage Bazaar.','Normal Market Intelligence behavior remains unchanged outside Manage Bazaar.']}
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
if GF.exists():
    t=GF.read_text(encoding='utf-8'); t=re.sub(r'(## Current version\s*\n)\*\*v[0-9.]+\*\*',rf'\g<1>**v{NEW}**',t,count=1)
    note=f'''**v{NEW} — Strict Manage Bazaar isolation**\n- Market Intelligence does not scan, decorate, badge or inject Bazaar UI in **Manage your Bazaar / Manage items**.\n- Existing MI inline Bazaar elements are removed on SPA/TornPDA transition into Manage.\n- Normal MI features remain active elsewhere.\n'''
    t=re.sub(r'\*\*v[0-9.]+ — [^\n]+\*\*\n(?:-.*\n)+',note,t,count=1)
    hist=f'''### v{NEW} — Strict Manage Bazaar isolation\n- Zero Market Intelligence row/UI intervention in Manage your Bazaar / Manage items.\n- Existing MI Bazaar badges/board are removed when Manage is detected.\n\n'''
    if hist not in t:t=t.replace('## Release history / Changelog\n\n','## Release history / Changelog\n\n'+hist,1)
    GF.write_text(t,encoding='utf-8')
if HUBDOC.exists():
    t=HUBDOC.read_text(encoding='utf-8'); t=re.sub(r'SakaLuX Market Intelligence \*\*v[0-9.]+\*\*',f'SakaLuX Market Intelligence **v{NEW}**',t,count=1); HUBDOC.write_text(t,encoding='utf-8')
# Patch embedded Hub registry conservatively inside the market entry.
if HUB.exists():
    t=HUB.read_text(encoding='utf-8'); pos=t.find('"id": "market-intelligence"')
    if pos>=0:
        tail=t[pos:]; tail=tail.replace(f'"version": "{old}"',f'"version": "{NEW}"',1)
        t=t[:pos]+tail; HUB.write_text(t,encoding='utf-8')
REL.parent.mkdir(parents=True,exist_ok=True); REL.write_text(f'''# SakaLuX Market Intelligence v{NEW}\n\nRelease date: **{DATE}**\n\n## Strict Manage Bazaar isolation\nMarket Intelligence now treats **Manage your Bazaar / Manage items** as a hard exclusion zone. `scanItems()` and `scanBazaar()` return before any scanning or DOM injection, and existing MI inline Bazaar badges/board are purged when Manage is detected. No MI estimate badge, board or inline decoration is allowed inside the Manage list.\n''',encoding='utf-8')
print('Market Intelligence strict Manage Bazaar isolation prepared')