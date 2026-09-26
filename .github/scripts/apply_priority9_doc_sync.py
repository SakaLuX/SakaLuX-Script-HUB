#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERSIONS = {
    'greasyfork/Bazaar-Smart-Pricer.md': ('1.1.7', '1.1.12'),
    'greasyfork/Bazaar-Thanker.md': ('5.3.42', '5.3.44'),
    'greasyfork/Company-Intelligence.md': ('1.8.39', '1.8.41'),
    'greasyfork/Elimination-Assistant.md': ('1.3.45', '1.3.47'),
    'greasyfork/Enhancer-Guard.md': ('1.3.50', '1.3.52'),
    'greasyfork/Mission-Rewards.md': ('1.0.44', '1.0.46'),
}

changed=[]
for rel,(old,new) in VERSIONS.items():
    path=ROOT/rel
    text=path.read_text(encoding='utf-8')
    before=text
    text=text.replace(f'Canonical version: **v{old}**', f'Canonical version: **v{new}**', 1)
    if rel.endswith('Bazaar-Smart-Pricer.md') and f'### v{new}' not in text:
        block=(
            '\n## Release history / Changelog\n\n'
            f'### v{new} — Global Hub power control\n'
            '- Adds a persistent global power bridge so Script Hub ON/OFF works from every Torn page.\n'
            '- Synchronizes Hub power state with Smart Pricer storage.\n'
            '- Keeps pricing and Bazaar scanning page-scoped while global power control stays available.\n'
        )
        text=text.rstrip()+block+'\n'
    if text != before:
        path.write_text(text,encoding='utf-8')
        changed.append(rel)

print(f'Synchronized {len(changed)} release documentation file(s).')
for rel in changed: print(' -',rel)
