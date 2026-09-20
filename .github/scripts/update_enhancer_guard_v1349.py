#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil

OLD='1.3.48'; NEW='1.3.49'; DATE='2026-09-20'
ROOT=Path('.')
SCRIPT=ROOT/'SakaLuX-Enhancer-Guard.user.js'
REG=ROOT/'scripts.json'
GF=ROOT/'greasyfork'/'Enhancer-Guard.md'
HUBDOC=ROOT/'greasyfork'/'Script-Hub.md'
REL=ROOT/'releases'/f'enhancer-guard-v{NEW}.md'
BACKUP=ROOT/'backups'/f'enhancer-guard-v{OLD}-{DATE}'
BACKUP.mkdir(parents=True,exist_ok=True)

s=SCRIPT.read_text(encoding='utf-8')
if f'// @version      {OLD}' not in s:
    if f'// @version      {NEW}' in s: raise SystemExit('v1.3.49 already applied')
    raise SystemExit(f'Unexpected version; expected {OLD}')
shutil.copy2(SCRIPT,BACKUP/f'SakaLuX-Enhancer-Guard-v{OLD}.user.js')

s=s.replace(f'// @version      {OLD}',f'// @version      {NEW}',1)
s=s.replace("let v = '1.3.48';","let v = '1.3.49';",1)
s=s.replace("{version:'1.3.48'}","{version:'1.3.49'}",1)

anchor="""    function isProtectedSalePage() {
        const href = String(location.href || '').toLowerCase();
"""
if anchor not in s: raise SystemExit('isProtectedSalePage anchor not found')
helper="""    function isManageBazaarPage() {
        const href = String(location.href || '').toLowerCase();
        if (!href.includes('bazaar.php')) return false;
        const headings = document.querySelectorAll('h1,h2,h3,[role="heading"],[class*="title"],[class*="panelHeader"]');
        for (const el of headings) {
            const text = String(el.textContent || '').trim().toLowerCase();
            if (text.includes('manage your bazaar') || text === 'manage items' || text.includes('manage bazaar')) return true;
        }
        return false;
    }

"""
s=s.replace(anchor,helper+anchor,1)

old_guard="""    function hideProtectedSaleRows() {
        if (!isProtectedSalePage()) return;
"""
new_guard="""    function hideProtectedSaleRows() {
        if (!isProtectedSalePage()) return;
        // Never mutate Torn's native Manage Bazaar rows. Hiding an accordion row
        // with display:none can leave TornPDA's parent container at its previous
        // measured height, producing the large blank panel when several price
        // editors are opened/closed. Protection remains active on Add Listing and
        // other actual sale-selection screens only.
        if (isManageBazaarPage()) return;
"""
if old_guard not in s: raise SystemExit('hideProtectedSaleRows guard not found')
s=s.replace(old_guard,new_guard,1)

SCRIPT.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
found=False
for e in reg.get('scripts',[]):
    if e.get('id')=='enhancer':
        found=True
        e['version']=NEW
        e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':NEW,'date':DATE,'notes':[
            'Stops Enhancer Guard from hiding or mutating native rows on Manage your Bazaar.',
            'Fixes the large blank accordion area that can appear after opening several Bazaar price rows on TornPDA.',
            'Keeps protected-item hiding and sale blocking active on actual Add Listing / sale-selection screens.',
            'Inventory tracking, lock badges, partial protection and Hub integration are unchanged.'
        ]}
if not found: raise SystemExit('enhancer registry entry not found')
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

if GF.exists():
    t=GF.read_text(encoding='utf-8')
    t=re.sub(r'(## Current version\s*\n)\*\*v[0-9.]+\*\*',rf'\g<1>**v{NEW}**',t,count=1)
    current_note="""**v1.3.49 — Manage Bazaar accordion isolation**
- Enhancer Guard no longer hides or mutates native rows on **Manage your Bazaar**.
- Fixes the large blank area that can remain when multiple Bazaar price rows are opened/closed on TornPDA.
- Protected-item hiding/blocking still applies on **Add Listing** and other actual sale-selection screens.
- Inventory tracking, lock badges, partial protection and Hub integration are unchanged.
"""
    t=re.sub(r'\*\*v1\.3\.48 — Release metadata synchronization\*\*\n(?:-.*\n){4}',current_note,t,count=1)
    hist="""### v1.3.49 — Manage Bazaar accordion isolation
- Stops sale-protection DOM hiding on **Manage your Bazaar** so Torn's accordion layout remains intact.
- Fixes the repeatable large blank panel seen after opening several price/detail rows on TornPDA.
- Sale protection remains active on Add Listing / sale-selection pages.

"""
    if '### v1.3.49 — Manage Bazaar accordion isolation' not in t:
        t=t.replace('## Release history / Changelog\n\n','## Release history / Changelog\n\n'+hist,1)
    GF.write_text(t,encoding='utf-8')

if HUBDOC.exists():
    t=HUBDOC.read_text(encoding='utf-8')
    t=t.replace('SakaLuX Enhancer Guard **v1.3.48**','SakaLuX Enhancer Guard **v1.3.49**')
    HUBDOC.write_text(t,encoding='utf-8')

REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Enhancer Guard v1.3.49\n\nRelease date: **2026-09-20**\n\n## Manage Bazaar accordion isolation\nEnhancer Guard previously reused its protected-sale row hiding logic on Bazaar DOM that can also exist while managing existing listings. On TornPDA, applying `display:none` inside Torn's accordion-managed list can leave the parent container with a stale measured height after several rows are opened/closed, creating the large blank area seen in Manage your Bazaar.\n\n## Fix\n- Detects **Manage your Bazaar / Manage items** explicitly.\n- `hideProtectedSaleRows()` exits without touching native Manage rows.\n- Protected-item hiding and blocking remain enabled on real Add Listing / sale-selection pages.\n- No changes to inventory tracking, lock badges, partial protection or API behavior.\n''',encoding='utf-8')
(BACKUP/'README.md').write_text(f'# Backup of Enhancer Guard v{OLD} before v{NEW}\n',encoding='utf-8')

print('Prepared Enhancer Guard v1.3.49 Manage Bazaar accordion isolation fix')
