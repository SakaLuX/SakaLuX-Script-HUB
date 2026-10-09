#!/usr/bin/env python3
"""Static release gate for desired-vs-effective SakaLuX PRO states."""
from __future__ import annotations
import json, re, subprocess
from pathlib import Path

root=Path(__file__).resolve().parents[1]
cfg=json.loads((root/'release-config.json').read_text(encoding='utf-8'))
registry=json.loads((root/'scripts.json').read_text(encoding='utf-8'))
entries={row['id']:row for row in cfg['scripts']}
catalog={row['id']:row for row in registry['scripts']}
premium=('bazaar-smart-pricer','mission-rewards','market-intelligence','bounty-hunter',
         'elimination-assistant','stock-manager-advisor','company-intelligence','enhancer','bazaar')
markers={
 'bazaar-smart-pricer':('SakaLuX:PremiumStatus','SakaLuXFreemium'),
 'mission-rewards':('SakaLuX:PremiumStatus','sl-mr-learn-mods'),
 'market-intelligence':('premiumSettingActive','restorePremiumSettingsUI','SakaLuX:PremiumStatus'),
 'bounty-hunter':('bountyProEffective','SakaLuX:PremiumStatus'),
 'elimination-assistant':('SakaLuX:PremiumStatus','SakaLuXFreemium'),
 'stock-manager-advisor':('applyInlineButtonPrefs','SakaLuX:PremiumStatus'),
 'company-intelligence':('reconcileDirectorPreference','SakaLuX:PremiumStatus'),
 'enhancer':('slxApplyEntitlement','inventoryProtectionObserver','SakaLuX:PremiumStatus'),
 'bazaar':('slxApplyEntitlement','stopRuntime','SakaLuX:PremiumStatus'),
 'script-hub':('refreshHubProStatus','SakaLuX:PremiumStatus')
}
errors=[]
for sid in (*premium,'script-hub'):
    conf=entries[sid]
    source=(root/conf['file']).read_text(encoding='utf-8')
    doc=(root/conf['doc']).read_text(encoding='utf-8')
    v=re.search(r'^//\s*@version\s+(\S+)',source,re.M)
    if not v:
        errors.append(f'{sid}: missing @version');continue
    version=v[1]
    for marker in markers[sid]:
        if marker not in source:
            errors.append(f'{sid}: missing lifecycle marker {marker}')
    if not re.search(rf'^###\s+v{re.escape(version)}(?:\s|$)',doc,re.M):
        errors.append(f'{sid}: no changelog for v{version}')
    if f'**v{version}**' not in doc:
        errors.append(f'{sid}: stale documentation header')
    tag='script-hub' if sid=='script-hub' else sid
    if not (root/'releases'/f'{tag}-v{version}.md').exists():
        errors.append(f'{sid}: missing release note v{version}')
    if sid in premium:
        row=catalog.get(sid)
        if not row or row['version']!=version or row.get('release',{}).get('version')!=version:
            errors.append(f'{sid}: outdated scripts.json release')
    parse=subprocess.run(['node','--check',str(root/conf['file'])],capture_output=True,text=True)
    if parse.returncode:
        errors.append(f'{sid}: JavaScript syntax: {parse.stderr.strip()[:220]}')
if errors:
    raise SystemExit('Premium lifecycle preflight failed:\n'+'\n'.join('- '+err for err in errors))
print(f'PASS: {len(markers)} userscripts have current release metadata, lifecycle integration and valid syntax.')
