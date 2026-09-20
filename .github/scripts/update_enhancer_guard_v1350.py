#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil

OLD='1.3.49'; NEW='1.3.50'; DATE='2026-09-20'
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
    if f'// @version      {NEW}' in s: raise SystemExit('v1.3.50 already applied')
    raise SystemExit(f'Unexpected version; expected {OLD}')
shutil.copy2(SCRIPT,BACKUP/f'SakaLuX-Enhancer-Guard-v{OLD}.user.js')

s=s.replace(f'// @version      {OLD}',f'// @version      {NEW}',1)
s=s.replace("let v = '1.3.49';","let v = '1.3.50';",1)
s=s.replace("{version:'1.3.49'}","{version:'1.3.50'}",1)

# Make Manage Bazaar a hard exclusion for all sale-protection logic.
old_manage="""    function isManageBazaarPage() {
        const href = String(location.href || '').toLowerCase();
        if (!href.includes('bazaar.php')) return false;
        const headings = document.querySelectorAll('h1,h2,h3,[role=\"heading\"],[class*=\"title\"],[class*=\"panelHeader\"]');
        for (const el of headings) {
            const text = String(el.textContent || '').trim().toLowerCase();
            if (text.includes('manage your bazaar') || text === 'manage items' || text.includes('manage bazaar')) return true;
        }
        return false;
    }
"""
new_manage="""    function isManageBazaarPage() {
        const href = String(location.href || '').toLowerCase();
        if (!href.includes('bazaar.php')) return false;
        const bodyText = String(document.body?.innerText || document.body?.textContent || '').toLowerCase();
        return bodyText.includes('manage your bazaar') || bodyText.includes('manage items') || bodyText.includes('manage bazaar');
    }
"""
if old_manage in s:
    s=s.replace(old_manage,new_manage,1)
elif 'function isManageBazaarPage()' not in s:
    raise SystemExit('Manage Bazaar helper missing')

old_sale="""    function isProtectedSalePage() {
        const href = String(location.href || '').toLowerCase();
"""
new_sale="""    function isProtectedSalePage() {
        if (isManageBazaarPage()) return false;
        const href = String(location.href || '').toLowerCase();
"""
if new_sale not in s:
    if old_sale not in s: raise SystemExit('isProtectedSalePage anchor missing')
    s=s.replace(old_sale,new_sale,1)

# Hard-stop all row protection/decorating on Manage Bazaar.
for old,new in [
("""    function hideProtectedSaleRows() {
        if (!isProtectedSalePage()) return;
""","""    function hideProtectedSaleRows() {
        if (isManageBazaarPage()) return;
        if (!isProtectedSalePage()) return;
"""),
("""    function protectSaleRows() {
""","""    function protectSaleRows() {
        if (isManageBazaarPage()) return;
"""),
("""    function decorateSaleRows() {
""","""    function decorateSaleRows() {
        if (isManageBazaarPage()) return;
""")]:
    if old in s and new not in s:
        s=s.replace(old,new,1)

# Ensure already-added Enhancer sale DOM artifacts are removed if user navigates into Manage Bazaar.
cleanup_anchor='''    function hideProtectedSaleRows() {
        if (isManageBazaarPage()) return;
'''
cleanup='''    function clearManageBazaarEnhancerArtifacts() {
        if (!isManageBazaarPage()) return;
        document.querySelectorAll('[data-sakalux-protected-sale], .sakalux-sale-lock, .sakalux-protector-sale, .slx-protected-sale').forEach(n=>n.remove());
    }

'''
if cleanup not in s and cleanup_anchor in s:
    s=s.replace(cleanup_anchor,cleanup+cleanup_anchor,1)

# Call cleanup from the sale-protection refresh path if present.
for anchor in [
    '        hideProtectedSaleRows();',
    '      hideProtectedSaleRows();'
]:
    if anchor in s and 'clearManageBazaarEnhancerArtifacts();\n'+anchor not in s:
        s=s.replace(anchor,'        clearManageBazaarEnhancerArtifacts();\n'+anchor.strip(),1)
        break

SCRIPT.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='enhancer':
        e['version']=NEW
        e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={'version':NEW,'date':DATE,'notes':[
            'Hard-excludes Manage your Bazaar / Manage items from every Enhancer Guard sale-protection path.',
            'No row hiding, blocking, badges, sale locks or DOM mutations are allowed on Manage Bazaar.',
            'Removes any stale Enhancer sale-protection artifacts if Torn SPA navigation enters Manage Bazaar.',
            'Protection remains active only on real Add Listing / sale-selection screens.'
        ]}
        break
else: raise SystemExit('enhancer registry entry not found')
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

if GF.exists():
    t=GF.read_text(encoding='utf-8')
    t=re.sub(r'(## Current version\s*\n)\*\*v[0-9.]+\*\*',rf'\g<1>**v{NEW}**',t,count=1)
    t=re.sub(r'## Current release note\n[\s\S]*?(?=## Recommended)',f'''## Current release note\n\n**v{NEW} — Strict Manage Bazaar isolation**\n- Enhancer Guard does absolutely nothing to native rows on **Manage your Bazaar / Manage items**.\n- No hiding, blocking, badges, sale locks or DOM mutations are allowed there.\n- Any stale Enhancer sale artifacts are removed on entry.\n- Protection remains active only on real sale-selection/Add Listing screens.\n\n''',t,count=1)
    hist=f'''### v{NEW} — Strict Manage Bazaar isolation\n- Hard-excludes Manage Bazaar from all sale-protection logic.\n- Removes stale Enhancer sale artifacts on SPA navigation into Manage Bazaar.\n- Keeps protection only on actual Add Listing/sale-selection screens.\n\n'''
    if hist not in t:
        t=t.replace('## Release history / Changelog\n\n','## Release history / Changelog\n\n'+hist,1)
    GF.write_text(t,encoding='utf-8')

if HUBDOC.exists():
    t=HUBDOC.read_text(encoding='utf-8')
    t=re.sub(r'SakaLuX Enhancer Guard \*\*v[0-9.]+\*\*',f'SakaLuX Enhancer Guard **v{NEW}**',t,count=1)
    HUBDOC.write_text(t,encoding='utf-8')

REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text(f'''# SakaLuX Enhancer Guard v{NEW}\n\nRelease date: **{DATE}**\n\n## Strict Manage Bazaar isolation\nEnhancer Guard is now completely excluded from **Manage your Bazaar / Manage items**.\n\n- no row hiding\n- no blocking\n- no sale lock badges\n- no sale-protection DOM mutations\n- stale Enhancer sale artifacts are removed when entering Manage Bazaar\n- protection remains active only on real Add Listing / sale-selection screens\n''',encoding='utf-8')
(BACKUP/'README.md').write_text(f'# Backup of Enhancer Guard v{OLD} before v{NEW}\n',encoding='utf-8')
print('Prepared Enhancer Guard v1.3.50 strict Manage Bazaar isolation')
