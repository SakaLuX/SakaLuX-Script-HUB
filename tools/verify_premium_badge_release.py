#!/usr/bin/env python3
"""Fail CI when PRO badge releases drift from scripts, registry or release notes."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
cfg = json.loads((ROOT / 'release-config.json').read_text(encoding='utf-8'))
reg = json.loads((ROOT / 'scripts.json').read_text(encoding='utf-8'))
by_id = {row['id']: row for row in reg['scripts']}
premium = {'enhancer','bazaar','bazaar-smart-pricer','mission-rewards',
           'market-intelligence','bounty-hunter','elimination-assistant',
           'company-intelligence','stock-manager-advisor'}
errors = []
for entry in cfg['scripts']:
    sid = entry['id']
    if sid not in premium and sid != 'script-hub':
        continue
    src = (ROOT / entry['file']).read_text(encoding='utf-8')
    doc = (ROOT / entry['doc']).read_text(encoding='utf-8')
    found = re.search(r'^//\s*@version\s+(\S+)', src, re.M)
    if not found:
        errors.append(f'{sid}: missing @version')
        continue
    version = found.group(1)
    if sid in premium:
        if '/* SakaLuX Premium Badges v1 — BEGIN */' not in src:
            errors.append(f'{sid}: missing PRO badge integration')
        row = by_id.get(sid)
        if not row or row.get('version') != version or row.get('release', {}).get('version') != version:
            errors.append(f'{sid}: registry release mismatch')
        elif not row.get('release', {}).get('notes'):
            errors.append(f'{sid}: missing release notes')
    else:
        if 'FREE / ✦ PRO' not in src or '✦ PRO' not in src:
            errors.append('script-hub: missing FREE/PRO module badges')
    current = re.search(r'## Current version\s+\*\*v([\d.]+)\*\*', doc)
    if not current or current.group(1) != version:
        errors.append(f'{sid}: current documentation version mismatch (expected {version})')
    canonical = re.search(r'Canonical version:\s*\*\*v([\d.]+)\*\*', doc)
    if canonical and canonical.group(1) != version:
        errors.append(f'{sid}: canonical documentation version mismatch')
    if not re.search(rf'^###\s+v{re.escape(version)}(?:\s|$)', doc, re.M):
        errors.append(f'{sid}: missing release history for {version}')
hub = (ROOT / 'SakaLuX-Script-Hub.user.js').read_text(encoding='utf-8')
start = '    const FALLBACK_REGISTRY = '
end = '\n\n    const FALLBACK_MODULE_DETAILS = '
a, b = hub.find(start), hub.find(end)
if a < 0 or b < 0:
    errors.append('script-hub: missing offline registry')
else:
    try:
        fallback = json.loads(hub[a+len(start):b])
        if fallback != {key:reg.get(key) for key in ('scripts','lastVerified','repository')}:
            errors.append('script-hub: offline registry differs from scripts.json')
    except ValueError as exc:
        errors.append(f'script-hub: invalid fallback JSON: {exc}')
if errors:
    raise SystemExit('PRO release validation failed:\n' + '\n'.join('- ' + e for e in errors))
print(f'PRO release validation PASS: {len(premium)} premium scripts plus Hub')
