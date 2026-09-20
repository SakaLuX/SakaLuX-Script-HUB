#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REG = ROOT / 'scripts.json'
HUB = ROOT / 'SakaLuX-Script-Hub.user.js'
HUB_MD = ROOT / 'greasyfork' / 'Script-Hub.md'

entry = {
  "active": True,
  "apiGlobal": "SakaLuXBazaarSmartPricer",
  "buttonSelector": "#sl-bsp-launcher",
  "category": "Trading",
  "description": "Smart Bazaar pricing for add-item and manage/reprice flows with market value, lowest listing and configurable undercut modes.",
  "downloadUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js",
  "icon": "💰",
  "id": "bazaar-smart-pricer",
  "info": "Purpose\nBazaar Smart Pricer prices Torn Bazaar sale fields using Torn market value, the lowest current item-market listing or a configurable undercut. It supports both add-item and manage/reprice workflows.\n\nPricing\nChoose Torn market value with an optional discount, lowest listing, or undercut the lowest listing by a flat dollar amount or percentage. Ultra-low storage/grief listings can be ignored. NPC sell-price warnings are optional and never block the final price.\n\nWorkflow\nA floating S Smart Pricer launcher opens settings and bulk actions. S PRICE buttons can be added beside detected Bazaar price fields. PRICE ALL VISIBLE prices the currently rendered sale rows; Torn still requires the player to review and submit/save the Bazaar changes.\n\nAPI and storage\nRequires a Torn read-only/public API key. The key and settings are stored locally and requests go only to api.torn.com. Item/market responses are cached locally in memory to reduce repeated requests.\n\nCompatibility\nDesigned for Torn SPA navigation, TornPDA and desktop userscript managers. It exposes SakaLuXBazaarSmartPricer for Hub integration.",
  "name": "Bazaar Smart Pricer",
  "quickActions": [
    {"icon": "⚙️", "id": "open", "label": "SETTINGS", "method": "open", "fallbackUrl": "https://www.torn.com/bazaar.php"},
    {"icon": "💰", "id": "price-all", "label": "PRICE ALL", "method": "priceAll", "fallbackUrl": "https://www.torn.com/bazaar.php"},
    {"icon": "🔄", "id": "refresh", "label": "REFRESH", "method": "refresh", "fallbackUrl": "https://www.torn.com/bazaar.php"}
  ],
  "release": {
    "version": "1.0.0",
    "date": "2026-09-20",
    "notes": [
      "Initial SakaLuX rebuild with a working API/settings panel.",
      "Supports Bazaar add-item and manage/reprice price fields instead of only one legacy table selector.",
      "Adds Market Value, Lowest Listing and flat/percentage Undercut modes with per-row and bulk pricing actions."
    ]
  },
  "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js",
  "type": "addon",
  "version": "1.0.0",
  "detailsRevision": 1
}

data = json.loads(REG.read_text())
scripts = data.setdefault('scripts', [])
if not any(x.get('id') == entry['id'] for x in scripts):
    # Keep trading tools grouped: insert after Bazaar Thanker when possible.
    idx = next((i + 1 for i, x in enumerate(scripts) if x.get('id') == 'bazaar'), len(scripts))
    scripts.insert(idx, entry)
else:
    for i, x in enumerate(scripts):
        if x.get('id') == entry['id']:
            scripts[i] = entry
            break
REG.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

# Add the version line to Hub documentation if it is not already present.
if HUB_MD.exists():
    text = HUB_MD.read_text()
    line = '- 💰 SakaLuX Bazaar Smart Pricer **v1.0.0**\n'
    if line not in text:
        anchor = '- 💬 SakaLuX Bazaar Thanker - PDA **'
        pos = text.find(anchor)
        if pos >= 0:
            end = text.find('\n', pos)
            text = text[:end+1] + line + text[end+1:]
        else:
            text += '\n' + line
        HUB_MD.write_text(text)

print('Bazaar Smart Pricer registry surface synchronized.')
