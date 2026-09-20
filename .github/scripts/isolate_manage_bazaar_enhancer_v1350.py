#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil
ROOT=Path('.')
SCRIPT=ROOT/'SakaLuX-Enhancer-Guard.user.js'; REG=ROOT/'scripts.json'; GF=ROOT/'greasyfork'/'Enhancer-Guard.md'; HUBDOC=ROOT/'greasyfork'/'Script-Hub.md'
NEW='1.3.50'; DATE='2026-09-20'; REL=ROOT/'releases'/f'enhancer-guard-v{NEW}.md'
s=SCRIPT.read_text(encoding='utf-8')
m=re.search(r'// @version\s+([0-9.]+)',s); old=m.group(1) if m else None
if old==NEW: raise SystemExit('already applied')
if old not in {'1.3.48','1.3.49'}: raise SystemExit(f'unexpected enhancer version {old}')
BACKUP=ROOT/'backups'/f'enhancer-manage-isolation-v{old}-{DATE}'; BACKUP.mkdir(parents=True,exist_ok=True); shutil.copy2(SCRIPT,BACKUP/f'SakaLuX-Enhancer-Guard-v{old}.user.js')
s=re.sub(r'// @version\s+[0-9.]+',f'// @version      {NEW}',s,count=1)
s=re.sub(r"let v = '[0-9.]+';",f"let v = '{NEW}';",s,count=1)
s=re.sub(r"\{version:'[0-9.]+'\}\);",f"{{version:'{NEW}'}});",s,count=1)
helper='''    function isManageBazaarPage() {\n        const href = String(location.href || '').toLowerCase();\n        if (!href.includes('bazaar.php')) return false;\n        if (/#\\/?(?:manage|bazaar(?:\\/manage)?)(?:[/?#]|$)/i.test(location.hash || '')) return true;\n        const text = String(document.body?.innerText || '').toLowerCase();\n        return text.includes('manage your bazaar') && text.includes('manage items');\n    }\n\n'''
if 'function isManageBazaarPage()' in s:
    s=re.sub(r'    function isManageBazaarPage\(\) \{[\s\S]*?\n    \}\n\n(?=    function isProtectedSalePage)',helper,s,count=1)
else:
    anchor='    function isProtectedSalePage() {\n'
    if anchor not in s: raise SystemExit('isProtectedSalePage anchor missing')
    s=s.replace(anchor,helper+anchor,1)
# Absolute isolation: the sale-protection subsystem must never consider Manage Bazaar a protected-sale surface.
s=s.replace("    function isProtectedSalePage() {\n        const href = String(location.href || '').toLowerCase();", "    function isProtectedSalePage() {\n        if (isManageBazaarPage()) return false;\n        const href = String(location.href || '').toLowerCase();",1)
# Also hard-stop the only DOM row mutator even if another caller reaches it.
s=s.replace("    function hideProtectedSaleRows() {\n        if (!isProtectedSalePage()) return;", "    function hideProtectedSaleRows() {\n        if (isManageBazaarPage()) return;\n        if (!isProtectedSalePage()) return;",1)
SCRIPT.write_text(s,encoding='utf-8')
reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='enhancer':
        e['version']=NEW; e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':NEW,'date':DATE,'notes':['Strict Manage Bazaar isolation: Enhancer Guard sale-protection logic returns before touching any Manage your Bazaar row.','Manage Bazaar is explicitly excluded from protected-sale page detection.','No protected-row hiding, sale-row mutation or sale blocking runs in Manage items.','Protection remains unchanged on Add Listing and real sale-selection pages.']}
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
if GF.exists():
    t=GF.read_text(encoding='utf-8'); t=re.sub(r'(## Current version\s*\n)\*\*v[0-9.]+\*\*',rf'\g<1>**v{NEW}**',t,count=1)
    note=f'''**v{NEW} — Strict Manage Bazaar isolation**\n- Enhancer Guard does not run sale-protection DOM logic in **Manage your Bazaar / Manage items**.\n- Manage Bazaar is excluded before protected-sale detection and before any row-hiding mutation.\n- Add Listing protection remains active.\n'''
    t=re.sub(r'\*\*v[0-9.]+ — [^\n]+\*\*\n(?:-.*\n)+',note,t,count=1)
    hist=f'''### v{NEW} — Strict Manage Bazaar isolation\n- Zero sale-row intervention in Manage your Bazaar / Manage items.\n- Protection remains active only on actual sale-selection surfaces.\n\n'''
    if hist not in t:t=t.replace('## Release history / Changelog\n\n','## Release history / Changelog\n\n'+hist,1)
    GF.write_text(t,encoding='utf-8')
if HUBDOC.exists():
    t=HUBDOC.read_text(encoding='utf-8'); t=re.sub(r'SakaLuX Enhancer Guard \*\*v[0-9.]+\*\*',f'SakaLuX Enhancer Guard **v{NEW}**',t,count=1); HUBDOC.write_text(t,encoding='utf-8')
REL.parent.mkdir(parents=True,exist_ok=True); REL.write_text(f'''# SakaLuX Enhancer Guard v{NEW}\n\nRelease date: **{DATE}**\n\n## Strict Manage Bazaar isolation\nEnhancer Guard now treats **Manage your Bazaar / Manage items** as a hard exclusion zone. The sale-protection subsystem returns before protected-sale detection and before the protected-row DOM mutator, so it cannot hide, restyle, block, annotate or otherwise alter native Manage Bazaar rows. Add Listing protection remains unchanged.\n''',encoding='utf-8')
print('Enhancer Guard strict Manage Bazaar isolation prepared')