#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import unquote, urlparse
from datetime import date
import json
import re

ROOT = Path(__file__).resolve().parents[2]
TODAY = date.today().isoformat()
REGISTRY = ROOT / 'scripts.json'

DOC_BY_ID = {
    'enhancer': 'greasyfork/Enhancer-Guard.md',
    'bazaar': 'greasyfork/Bazaar-Thanker.md',
    'bazaar-smart-pricer': 'greasyfork/Bazaar-Smart-Pricer.md',
    'mission-rewards': 'greasyfork/Mission-Rewards.md',
    'market-intelligence': 'greasyfork/Market-Intelligence.md',
    'elimination-assistant': 'greasyfork/Elimination-Assistant.md',
    'company-intelligence': 'greasyfork/Company-Intelligence.md',
    'stock-manager-advisor': 'greasyfork/Stock-Manager-Advisor.md',
}
STANDALONE = [
    ('SakaLuX-Script-Hub.user.js', 'greasyfork/Script-Hub.md'),
    ('SakaLuX-Chat-Intelligence.user.js', 'greasyfork/Chat-Intelligence.md'),
    ('SakaLuX-Account-Auditor.user.js', 'greasyfork/Account-Auditor.md'),
    ('SakaLuX-Suite.user.js', 'greasyfork/SakaLuX-Suite.md'),
]

def version(path):
    text = path.read_text(encoding='utf-8')
    m = re.search(r'(?m)^//\s*@version\s+(\S+)', text)
    return m.group(1).strip() if m else ''

def sync_doc(path, v):
    if not path.exists() or not v:
        return
    text = path.read_text(encoding='utf-8')
    text = re.sub(
        r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)',
        lambda m: m.group(1) + v + m.group(2), text, count=1
    )
    text = re.sub(
        r'(?im)^(-\s*Verified:\s*\*\*)[^*\n]+(\*\*)$',
        lambda m: m.group(1) + TODAY + m.group(2), text, count=1
    )
    text = re.sub(
        r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)$',
        lambda m: m.group(1) + v + m.group(2), text, count=1
    )
    path.write_text(text, encoding='utf-8')

registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
for row in registry.get('scripts', []):
    if not row.get('active', True):
        continue
    src = ROOT / unquote(Path(urlparse(str(row.get('sourceUrl') or '')).path).name)
    doc_name = DOC_BY_ID.get(row.get('id'))
    if src.exists() and doc_name:
        sync_doc(ROOT / doc_name, version(src))

for src_name, doc_name in STANDALONE:
    src = ROOT / src_name
    if src.exists():
        sync_doc(ROOT / doc_name, version(src))

print('Release documentation version headers synchronized.')
