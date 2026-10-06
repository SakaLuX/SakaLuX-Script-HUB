from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
RT=ROOT/'src/core/sakalux-dock-runtime.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG.md'
RELEASE=ROOT/'releases'/'standalone-runtime-v1.1.2.md'

if "const VERSION = '1.1.2'" not in RT.read_text(encoding='utf-8'):
    raise SystemExit('Shared Dock Runtime is not v1.1.2')

items = [
    ('SakaLuX-Enhancer-Guard.user.js','enhancer','1.3.54','1.3.55','greasyfork/Enhancer-Guard.md'),
    ('SakaLuX-Account-Auditor.user.js',None,'1.3.25','1.3.26',None),
    ('SakaLuX-Mission-Rewards.user.js','mission-rewards','1.0.47','1.0.48','greasyfork/Mission-Rewards.md'),
    ('SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar','5.3.45','5.3.46','greasyfork/Bazaar-Thanker.md'),
    ('SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar-smart-pricer','1.1.14','1.1.15','greasyfork/Bazaar-Smart-Pricer.md'),
    ('SakaLuX-Elimination-Assistant.user.js','elimination-assistant','1.3.48','1.3.49','greasyfork/Elimination-Assistant.md'),
    ('SakaLuX-Market-Intelligence.user.js','market-intelligence','1.17.58','1.17.59','greasyfork/Market-Intelligence.md'),
    ('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor','0.8.16','0.8.17','greasyfork/Stock-Manager-Advisor.md'),
    ('SakaLuX-Company-Intelligence-v1.0.0.user.js','company-intelligence','1.8.54','1.8.55','greasyfork/Company-Intelligence.md'),
    ('SakaLuX-Bounty-Hunter.user.js','bounty-hunter','0.5.4','0.5.5','greasyfork/Bounty-Hunter.md'),
]

note = [
    'Maintenance release: embeds Shared Standalone Dock Runtime v1.1.2.',
    'No module feature changes in this release.',
    'Ensures every installed standalone module participates in the same singleton dock runtime and receives the fixed open/close behavior.'
]

for filename, sid, old, new, docpath in items:
    p=ROOT/filename
    s=p.read_text(encoding='utf-8')
    if f'// @version      {old}' not in s:
        raise SystemExit(f'{filename}: expected @version {old}')
    s=s.replace(f'// @version      {old}',f'// @version      {new}',1)
    # All current files expose their canonical installed version with the same exact old value.
    s=s.replace(old,new)
    p.write_text(s,encoding='utf-8')

    if docpath:
        dpath=ROOT/docpath
        if dpath.exists():
            d=dpath.read_text(encoding='utf-8')
            d=re.sub(r'^\*\*v[^*]+\*\*',f'**v{new}**',d,count=1,flags=re.M)
            current=f"""## Current release note

**v{new} — Shared Standalone Dock Runtime v1.1.2 maintenance**
- Embeds the repaired shared Standalone Dock Runtime v1.1.2.
- No module feature changes in this maintenance release.
- Makes this installed module compatible with the common singleton Standalone Dock and its fixed open/close lifecycle.
"""
            if '## Current release note' in d:
                d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
            entry=f"""### v{new} — Shared Standalone Dock Runtime v1.1.2 maintenance
- Runtime-only maintenance update.
- Embeds Standalone Dock v1.1.2 so all installed SakaLuX standalone modules share the repaired singleton behavior.
- No module feature changes.

"""
            if f'### v{new}' not in d:
                if '## Changelog\n' in d:
                    d=d.replace('## Changelog\n','## Changelog\n'+entry,1)
                elif '## Release history / Changelog\n' in d:
                    d=d.replace('## Release history / Changelog\n','## Release history / Changelog\n'+entry,1)
                else:
                    d=d.rstrip()+'\n\n## Changelog\n'+entry
            dpath.write_text(d,encoding='utf-8')

# Registry: only managed modules. Account Auditor is intentionally not in scripts.json.
data=json.loads(REG.read_text(encoding='utf-8'))
for filename, sid, old, new, docpath in items:
    if not sid:
        continue
    row=next((x for x in data.get('scripts',[]) if x.get('id')==sid),None)
    if not row:
        raise SystemExit(f'missing registry row {sid}')
    if row.get('version') != old:
        raise SystemExit(f'{sid}: registry expected {old}, got {row.get("version")}')
    row['version']=new
    row['release']={'version':new,'date':'2026-10-06','notes':note}
    row['detailsRevision']=int(row.get('detailsRevision',0))+1
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8')
    marker='## Standalone Runtime v1.1.2 — batch maintenance releases'
    block="""\n## Standalone Runtime v1.1.2 — batch maintenance releases
- Runtime-only maintenance release across every userscript that embeds Shared Standalone Dock.
- Enhancer Guard 1.3.55
- Account Auditor 1.3.26
- Mission Rewards 1.0.48
- Bazaar Thanker 5.3.46
- Bazaar Smart Pricer 1.1.15
- Elimination Assistant 1.3.49
- Market Intelligence 1.17.59
- Stock Manager & Advisor 0.8.17
- Company Intelligence 1.8.55
- Bounty Hunter 0.5.5
- No module feature changes; the version bumps exist so installed copies actually receive Dock Runtime v1.1.2.
- Script Hub is intentionally not version-bumped by this batch.
"""
    if marker not in c:
        CHANGE.write_text(c.rstrip()+block+'\n',encoding='utf-8')

RELEASE.parent.mkdir(parents=True,exist_ok=True)
RELEASE.write_text("""# Shared Standalone Dock Runtime v1.1.2 — batch maintenance release

This release exists to distribute the repaired embedded Standalone Dock Runtime to already-installed userscripts.

Every standalone SakaLuX userscript carries an embedded runtime copy. Updating only the shared source file in GitHub cannot change copies already installed in TornPDA/Tampermonkey, so each userscript receives a patch-version maintenance release.

## Versions
- Enhancer Guard 1.3.55
- Account Auditor 1.3.26
- Mission Rewards 1.0.48
- Bazaar Thanker 5.3.46
- Bazaar Smart Pricer 1.1.15
- Elimination Assistant 1.3.49
- Market Intelligence 1.17.59
- Stock Manager & Advisor 0.8.17
- Company Intelligence 1.8.55
- Bounty Hunter 0.5.5

## Runtime change only
No module feature behavior is intentionally changed. Each release embeds Shared Standalone Dock Runtime v1.1.2 so the installed scripts can converge on one singleton Standalone Dock.

Script Hub is not part of this batch and its version is unchanged.
""",encoding='utf-8')
