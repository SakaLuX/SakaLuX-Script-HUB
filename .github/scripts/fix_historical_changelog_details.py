#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

TITLE_FIXES = {
    'greasyfork/Enhancer-Guard.md': ('### v1.3.34\n', '### v1.3.34 — Performance/UI optimization\n'),
    'greasyfork/Bazaar-Thanker.md': ('### v5.3.26\n', '### v5.3.26 — Performance/UI optimization\n'),
    'greasyfork/Mission-Rewards.md': ('### v1.0.21\n', '### v1.0.21 — Performance/UI optimization\n'),
    'greasyfork/Market-Intelligence.md': ('### v1.17.22\n', '### v1.17.22 — Performance/UI optimization\n'),
    'greasyfork/Elimination-Assistant.md': ('### v1.3.32\n', '### v1.3.32 — Performance/UI optimization\n'),
    'greasyfork/Company-Intelligence.md': ('### v1.8.18\n', '### v1.8.18 — Performance/UI optimization\n'),
    'greasyfork/Script-Hub.md': ('### v1.9.42\n', '### v1.9.42 — Performance/UI optimization release\n'),
    'greasyfork/Chat-Intelligence.md': ('### v1.2.9\n', '### v1.2.9 — Performance/UI optimization\n'),
    'greasyfork/Account-Auditor.md': ('### v1.3.5\n', '### v1.3.5 — Performance/UI optimization\n'),
    'greasyfork/SakaLuX-Suite.md': ('### v0.9.913\n', '### v0.9.913 — Performance/UI optimization\n'),
}

for rel, (old, new) in TITLE_FIXES.items():
    path = ROOT / rel
    if not path.exists():
        continue
    text = path.read_text(encoding='utf-8')
    if old in text:
        text = text.replace(old, new, 1)
        path.write_text(text, encoding='utf-8')

stock = ROOT / 'greasyfork/Stock-Manager-Advisor.md'
if stock.exists():
    text = stock.read_text(encoding='utf-8')
    old = '''### v0.8.11 — Vault control layout\nThe Vault & Panic card now groups controls by action: Vault (Keep) beside Vault keep cash, Withdraw beside Withdraw amount, and Vault Max beside the red Withdraw All action. PANIC keep/max values remain preserved internally.\n'''
    new = '''### v0.8.11 — Vault control layout\n- Rearranges the Vault & Panic controls into action-based pairs for the mobile layout.\n- Places **Vault (Keep)** beside **Vault keep cash**, then **Withdraw** beside **Withdraw amount**.\n- Places **Vault Max** beside the red **Withdraw All** action while preserving PANIC keep/max values internally.\n'''
    if old in text:
        text = text.replace(old, new, 1)
        stock.write_text(text, encoding='utf-8')

print('Historical changelog detail gaps repaired or already current.')
