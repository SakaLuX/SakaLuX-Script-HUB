#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
REG = ROOT / 'scripts.json'
DOC = ROOT / 'greasyfork/Bazaar-Smart-Pricer.md'

notes = [
    'Fixes the Torn City shop floor to use sell_price, the amount the NPC shop pays you, instead of buy_price.',
    'Prevents Smart Pricer from incorrectly raising a Bazaar price to the NPC shop purchase price when market value is lower.',
    'Resets stale pricing cache data and keeps the floor indicator aligned with sell_price.'
]

data = json.loads(REG.read_text(encoding='utf-8'))
changed = False
for row in data.get('scripts', []):
    if row.get('id') != 'bazaar-smart-pricer' or str(row.get('version')) != '1.1.14':
        continue
    release = row.setdefault('release', {})
    release['version'] = '1.1.14'
    release['date'] = '2026-09-30'
    release['notes'] = notes
    info = str(row.get('info') or '')
    old = 'If Torn City shop-floor enforcement is enabled, buy_price is the hard minimum; sell_price is only a fallback when buy_price is unavailable.'
    new = 'If Torn City shop-floor enforcement is enabled, sell_price is the hard minimum because it is the amount the NPC shop pays you; buy_price is not used as the Bazaar price floor.'
    if old in info:
        row['info'] = info.replace(old, new)
    changed = True
if changed:
    REG.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

if DOC.exists():
    text = DOC.read_text(encoding='utf-8')
    title = 'Correct Torn City sell-price floor'
    bullets = '\n'.join('- ' + n for n in notes)
    block = f'## Current release note\n\n**v1.1.14 — {title}**\n{bullets}\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', text)
    if m:
        text = text[:m.start()] + block.rstrip() + '\n' + text[m.end():]
    entry = f'### v1.1.14 — {title}\n{bullets}\n'
    em = re.search(r'(?ims)^###\s+v1\.1\.14\b.*?(?=^###\s+v|\Z)', text)
    if em:
        text = text[:em.start()] + entry + '\n' + text[em.end():]
    DOC.write_text(text, encoding='utf-8')

print('Bazaar Smart Pricer v1.1.14 release metadata corrected or already current.')
