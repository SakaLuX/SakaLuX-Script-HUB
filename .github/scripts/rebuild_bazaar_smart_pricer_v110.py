#!/usr/bin/env python3
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / 'SakaLuX-Bazaar-Smart-Pricer.user.js'
REGISTRY = ROOT / 'scripts.json'
CHANGELOG = ROOT / 'CHANGELOG-Bazaar-Smart-Pricer.md'
GF_DOC = ROOT / 'greasyfork' / 'Bazaar-Smart-Pricer.md'
HUB_DOC = ROOT / 'greasyfork' / 'Script-Hub.md'
README = ROOT / 'README-Bazaar-Smart-Pricer.md'
INSTALL = ROOT / 'INSTALL-Bazaar-Smart-Pricer.md'
RELEASE = ROOT / 'releases' / 'bazaar-smart-pricer-v1.1.0.md'
MANIFEST = ROOT / 'releases' / 'bazaar-smart-pricer-v1.1.0-manifest.json'
UPSTREAM = 'https://raw.githubusercontent.com/Musa-dabwe/Torn-Bazaar-Quick-Pricer/f957ab548efa7b7f6365462cb9c82072ad037bdd/torn-bazaar-quick-pricer.user.js'
VERSION = '1.1.0'
DATE = '2026-09-20'

with urllib.request.urlopen(UPSTREAM, timeout=30) as r:
    src = r.read().decode('utf-8')

if '// @version      2.9.3' not in src or 'function addQuickPriceButton(itemElement)' not in src:
    raise SystemExit('Pinned upstream Quick Pricer source did not match expected v2.9.3 layout')

# Metadata / identity. Keep MIT provenance and exact Quick Pricer behavior as the base.
src = src.replace('// @name         Torn Bazaar Quick Pricer', '// @name         SakaLuX Bazaar Smart Pricer', 1)
src = src.replace('// @namespace    http://tampermonkey.net/', '// @namespace    sakalux.bazaar.smart.pricer', 1)
src = src.replace('// @version      2.9.3', f'// @version      {VERSION}', 1)
src = src.replace('// @description  Auto-fill bazaar items with market-based pricing (PDA optimized)', '// @description  SakaLuX Hub-integrated Bazaar quick pricing with exact per-item Quick Add, bulk fill, RW safety and mobile-first settings.', 1)
src = src.replace('// @author       Zedtrooper [3028329]', '// @author       SakaLuX [2380374] · based on Zedtrooper [3028329]', 1)
src = src.replace('// @homepage     https://github.com/Musa-dabwe/Torn-Bazaar-Quick-Pricer', '// @homepage     https://github.com/SakaLuX/SakaLuX-Script-HUB', 1)
src = src.replace('// @supportURL   https://github.com/Musa-dabwe/Torn-Bazaar-Quick-Pricer/issues', '// @supportURL   https://github.com/SakaLuX/SakaLuX-Script-HUB/issues', 1)
src = re.sub(r'^// @downloadURL .*$', '// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js', src, count=1, flags=re.M)
src = re.sub(r'^// @updateURL .*$', '// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js', src, count=1, flags=re.M)
src = src.replace("|| '2.9.3';", f"|| '{VERSION}';", 1)
src = src.replace('[BazaarQuickPricer]', '[SakaLuXBazaarSmartPricer]')
src = src.replace('Quick Pricer settings', 'SakaLuX Smart Pricer settings')
src = src.replace('<div class="qp-head__title">Quick Pricer</div>', '<div class="qp-head__title">SakaLuX Smart Pricer</div>')
src = src.replace('https://github.com/Musa-dabwe/Torn-Bazaar-Quick-Pricer', 'https://github.com/SakaLuX/SakaLuX-Script-HUB')

# Add explicit upstream attribution after metadata.
meta_end = '// ==/UserScript==\n'
attribution = '''// ==/UserScript==\n\n/*\n * SakaLuX Bazaar Smart Pricer\n * Behavior/UI structure rebased on Torn Bazaar Quick Pricer v2.9.3\n * by Zedtrooper [3028329] / Musa-dabwe contributors, used under MIT License.\n * SakaLuX integration, Hub skin, bonus-item protection and release packaging:\n * SakaLuX [2380374].\n */\n'''
src = src.replace(meta_end, attribution, 1)

# Add generic bonus-item safety setting alongside upstream RW protection.
config_anchor = """        get skipRwWeapons() { return getSetting('skipRwWeapons', true); },\n        set skipRwWeapons(val) { setSetting('skipRwWeapons', val); },\n"""
config_insert = config_anchor + """        get skipBonusItems() { return getSetting('skipBonusItems', true); },\n        set skipBonusItems(val) { setSetting('skipBonusItems', val); },\n"""
if config_anchor not in src:
    raise SystemExit('CONFIG skipRwWeapons anchor missing')
src = src.replace(config_anchor, config_insert, 1)

# Detect any nonblank Torn bonus icon, not only known RW names.
rw_end_anchor = """        return { isRanked: false, bonus: null, rarity: null };\n    }\n\n    /** Rarity is encoded as glow-yellow / glow-orange / glow-red on the image wrap. */\n"""
bonus_helper = """        return { isRanked: false, bonus: null, rarity: null };\n    }\n\n    function hasAnyBonus(itemElement) {\n        const icons = itemElement.querySelectorAll('ul.bonuses-wrap li.bonus i[class*=\"bonus-attachment-\"], i[class*=\"bonus-attachment-\"]');\n        return Array.from(icons).some(icon => !String(icon.className || '').includes('blank-bonus'));\n    }\n\n    /** Rarity is encoded as glow-yellow / glow-orange / glow-red on the image wrap. */\n"""
if rw_end_anchor not in src:
    raise SystemExit('RW helper anchor missing')
src = src.replace(rw_end_anchor, bonus_helper, 1)

# Add bonus toggle to the same polished settings modal.
dollar_row_anchor = """                        <div class=\"qp-toggle-row\">\n                            <div>\n                                <span class=\"qp-toggle-row__name\">Skip $1 items</span>\n"""
bonus_row = """                        <div class=\"qp-toggle-row\">\n                            <div>\n                                <span class=\"qp-toggle-row__name\">Skip bonus items</span>\n                                <div class=\"qp-toggle-row__desc\">Do not auto-price weapons/items with Torn bonus icons</div>\n                            </div>\n                            <label class=\"qp-toggle\">\n                                <input type=\"checkbox\" id=\"qpBonusCheck\" ${CONFIG.skipBonusItems ? 'checked' : ''} />\n                                <span class=\"qp-toggle-track\"></span>\n                            </label>\n                        </div>\n""" + dollar_row_anchor
if dollar_row_anchor not in src:
    raise SystemExit('Skip $1 settings row anchor missing')
src = src.replace(dollar_row_anchor, bonus_row, 1)
src = src.replace("        wireToggleRowLabel(overlay, 'qpRwCheck');\n", "        wireToggleRowLabel(overlay, 'qpRwCheck');\n        wireToggleRowLabel(overlay, 'qpBonusCheck');\n", 1)
src = src.replace("            CONFIG.skipRwWeapons = overlay.querySelector('#qpRwCheck').checked;\n", "            CONFIG.skipRwWeapons = overlay.querySelector('#qpRwCheck').checked;\n            CONFIG.skipBonusItems = overlay.querySelector('#qpBonusCheck').checked;\n", 1)

# Respect both safety toggles for one-item Quick Add / manage repricing.
add_click_anchor = """            if (!CONFIG.apiKey) { showApiKeyPrompt(); return; }\n            if (rwInfo.isRanked && !(await confirmRwPricing(rwInfo))) return;\n            btnInput.disabled = true;\n"""
add_click_new = """            if (!CONFIG.apiKey) { showApiKeyPrompt(); return; }\n            if (CONFIG.skipRwWeapons && rwInfo.isRanked) { qpToast('RW weapon skipped by Settings', 'info'); return; }\n            if (CONFIG.skipBonusItems && hasAnyBonus(itemElement)) { qpToast('Bonus item skipped by Settings', 'info'); return; }\n            if (rwInfo.isRanked && !(await confirmRwPricing(rwInfo))) return;\n            btnInput.disabled = true;\n"""
if add_click_anchor not in src:
    raise SystemExit('Add-item click anchor missing')
src = src.replace(add_click_anchor, add_click_new, 1)

manage_click_anchor = """            if (!CONFIG.apiKey) { showApiKeyPrompt(); return; }\n            if (rwInfo.isRanked && !(await confirmRwPricing(rwInfo))) return;\n            updateManageItemPrice(priceDiv, itemId, getItemName(manageItem));\n"""
manage_click_new = """            if (!CONFIG.apiKey) { showApiKeyPrompt(); return; }\n            if (CONFIG.skipRwWeapons && rwInfo.isRanked) { qpToast('RW weapon skipped by Settings', 'info'); return; }\n            if (CONFIG.skipBonusItems && hasAnyBonus(manageItem)) { qpToast('Bonus item skipped by Settings', 'info'); return; }\n            if (rwInfo.isRanked && !(await confirmRwPricing(rwInfo))) return;\n            updateManageItemPrice(priceDiv, itemId, getItemName(manageItem));\n"""
if manage_click_anchor not in src:
    raise SystemExit('Manage-item click anchor missing')
src = src.replace(manage_click_anchor, manage_click_new, 1)

# Bulk Add Items: count and skip generic bonus items too.
src = src.replace('        let skippedRw = 0;\n        const toFill = items.filter(item => {\n            if (CONFIG.skipRwWeapons && getRWBonusInfo(item).isRanked) { skippedRw++; return false; }\n            return true;\n        });',
'''        let skippedRw = 0, skippedBonus = 0;\n        const toFill = items.filter(item => {\n            if (CONFIG.skipRwWeapons && getRWBonusInfo(item).isRanked) { skippedRw++; return false; }\n            if (CONFIG.skipBonusItems && hasAnyBonus(item)) { skippedBonus++; return false; }\n            return true;\n        });''', 1)
src = src.replace("        if (skippedRw > 0) msg += ` — ${skippedRw} RW weapon${skippedRw > 1 ? 's' : ''} skipped`;\n        if (failedCount > 0)",
"        if (skippedRw > 0) msg += ` — ${skippedRw} RW weapon${skippedRw > 1 ? 's' : ''} skipped`;\n        if (skippedBonus > 0) msg += ` — ${skippedBonus} bonus item${skippedBonus > 1 ? 's' : ''} skipped`;\n        if (failedCount > 0)", 1)

# Bulk Manage: same generic bonus protection.
src = src.replace('        let skippedRw = 0, skippedDollar = 0;\n', '        let skippedRw = 0, skippedBonus = 0, skippedDollar = 0;\n', 1)
src = src.replace('            if (CONFIG.skipRwWeapons && getRWBonusInfo(item).isRanked) { skippedRw++; continue; }\n            if (CONFIG.skipDollarItems) {',
'            if (CONFIG.skipRwWeapons && getRWBonusInfo(item).isRanked) { skippedRw++; continue; }\n            if (CONFIG.skipBonusItems && hasAnyBonus(item)) { skippedBonus++; continue; }\n            if (CONFIG.skipDollarItems) {', 1)
src = src.replace("        if (skippedRw > 0) msg += ` — ${skippedRw} RW weapon${skippedRw > 1 ? 's' : ''} skipped`;\n        if (skippedDollar > 0)",
"        if (skippedRw > 0) msg += ` — ${skippedRw} RW weapon${skippedRw > 1 ? 's' : ''} skipped`;\n        if (skippedBonus > 0) msg += ` — ${skippedBonus} bonus item${skippedBonus > 1 ? 's' : ''} skipped`;\n        if (skippedDollar > 0)", 1)

# Hub-style skin layered over the exact upstream layout/geometry.
style_anchor = '    document.head.appendChild(style);\n'
hub_skin = r'''    document.head.appendChild(style);

    const sakaluxHubSkin = document.createElement('style');
    sakaluxHubSkin.id = 'slx-bsp-hub-skin';
    sakaluxHubSkin.textContent = `
      :root{
        --qp-accent:#4f8fe8;--qp-accent-bg:#172331;--qp-ink:#edf3fa;--qp-muted:#93a4b7;
        --qp-field-bg:#151f2b;--qp-border:#34465b;--qp-ok:#55d98a;--qp-ok-bg:#173126;
        --qp-danger:#ff6b78;--qp-danger-bg:#3b2028;--qp-warn:#dfbd61;--qp-warn-bg:#2d2818;
        --qp-rw:#f0a35e;--qp-rw-bg:#37281d;--qp-font:Inter,Arial,sans-serif;
      }
      .qp-overlay{background:rgba(0,0,0,.68);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
      .qp-modal{background:linear-gradient(180deg,#111a24,#0b1118);color:var(--qp-ink);border:1px solid #34465b;box-shadow:0 18px 48px rgba(0,0,0,.56)}
      .qp-head__badge{background:#172331;border:1px solid rgba(79,143,232,.28)}
      .qp-head__badge svg{filter:none}
      .qp-close{background:#172331;color:#93a4b7;border:1px solid #34465b}
      .qp-close:hover{background:#223143;color:#edf3fa}
      .qp-note{background:#2d2818;color:#dfbd61;border:1px solid rgba(223,189,97,.22)}
      .qp-numcell,.qp-toggles-card,.qp-field{background:#151f2b;border-color:#34465b}
      .qp-toggle-row:not(:last-child){border-bottom-color:#263647}
      .qp-toggle-track{background:#34465b}
      .qp-toggle-track:before{background:#edf3fa}
      .qp-btn--ghost{background:#172331;color:#93a4b7;border:1px solid #34465b}
      .qp-btn--ghost:hover{background:#223143;color:#edf3fa}
      .qp-btn--danger{background:#3b2028;color:#ff6b78;border:1px solid rgba(255,107,120,.24)}
      .qp-btn--danger:hover{background:#492630}
      .qp-btn--primary{background:#4f8fe8;color:#fff;box-shadow:0 4px 12px rgba(79,143,232,.28)}
      .qp-btn--primary:hover,.qp-item-btn:hover{background:#3f79ca!important}
      .qp-chip{background:#111a24;border:1px solid #34465b;box-shadow:0 10px 28px rgba(0,0,0,.42)}
      .qp-chip-grip{color:#60758c}.qp-chip-gear{color:#93a4b7!important}.qp-chip-gear:hover{background:#172331!important;color:#edf3fa!important}
      .qp-item-btn{background:#4f8fe8!important;box-shadow:0 3px 8px rgba(79,143,232,.28)}
      .qp-head__sub a,.qp-help{color:#dfbd61}
      .qp-toast{background:#111a24!important;color:#edf3fa!important;border:1px solid #34465b!important;box-shadow:0 10px 26px rgba(0,0,0,.38)!important}
      @media(max-width:700px){.qp-overlay{padding:8px}.qp-modal{max-width:calc(100vw - 16px);border-radius:14px}.qp-body{padding-bottom:16px}}
    `;
    document.head.appendChild(sakaluxHubSkin);
'''
if style_anchor not in src:
    raise SystemExit('Style append anchor missing')
src = src.replace(style_anchor, hub_skin, 1)

# Recolor hard-coded upstream accent SVGs/shadows without changing layout.
src = src.replace('#7a6bd6', '#4f8fe8').replace('#6a5ac6', '#3f79ca')
src = src.replace('rgba(122,107,214,.3)', 'rgba(79,143,232,.3)').replace('rgba(122,107,214,.35)', 'rgba(79,143,232,.35)')

# Hub API surface: lets SakaLuX Script Hub open settings and run Quick Fill directly.
api_anchor = '    init();\n\n})();'
api_block = f'''    try {{\n        document.documentElement?.setAttribute('data-sakalux-bazaar-smart-pricer', '1');\n        window.SakaLuXBazaarSmartPricer = {{\n            version: VERSION,\n            open: showSettingsPanel,\n            openSettings: showSettingsPanel,\n            quickFill: fillAllItems,\n            priceAll: fillAllItems,\n            refresh: () => {{ processAllItems(); processManageItems(); updateChipContext(); }},\n            isEnabled: () => true,\n            setEnabled: () => true\n        }};\n    }} catch {{}}\n\n    init();\n\n}})();'''
if api_anchor not in src:
    raise SystemExit('Final init anchor missing')
src = src.replace(api_anchor, api_block, 1)

TARGET.write_text(src)

# Registry / Hub integration.
data = json.loads(REGISTRY.read_text())
scripts = data.setdefault('scripts', [])
entry = next((x for x in scripts if x.get('id') == 'bazaar-smart-pricer'), None)
if entry is None:
    entry = {'id':'bazaar-smart-pricer','name':'Bazaar Smart Pricer','type':'addon','category':'Trading','icon':'💰','active':True}
    scripts.append(entry)
entry.update({
    'active': True,
    'apiGlobal': 'SakaLuXBazaarSmartPricer',
    'buttonSelector': '.qp-chip',
    'category': 'Trading',
    'description': 'Quick Pricer-parity Bazaar helper with per-item Quick Add/Undo, quantity + price fill, bulk pricing, RW/bonus protection and Hub-styled settings.',
    'downloadUrl': 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js',
    'sourceUrl': 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js',
    'name': 'Bazaar Smart Pricer',
    'type': 'addon',
    'version': VERSION,
    'detailsRevision': max(5, int(entry.get('detailsRevision', 1)) + 1),
    'info': 'Purpose\\nBazaar Smart Pricer is now rebased on the proven Torn Bazaar Quick Pricer v2.9.3 behavior. Add Items gets the same compact per-item Quick Add/Undo control in the native item description area; one tap fills full quantity and calculated price. Manage Bazaar gets native price-update controls.\\n\\nBulk workflow\\nThe draggable Quick Fill / Update All chip and its gear button use the upstream behavior, including visible-row processing and progress.\\n\\nSafety\\nSkip RW weapons, Skip bonus items, Skip $1 items, NPC floor enforcement, discount/markup direction, price-change alert threshold and cache controls are available in Settings. RW and generic bonus skipping default to ON.\\n\\nHub integration\\nThe settings modal keeps the polished Quick Pricer layout but uses SakaLuX Hub dark tokens. Script Hub can open Settings and run Quick Fill through the SakaLuXBazaarSmartPricer API global.',
    'quickActions': [
        {'icon':'⚙️','id':'open','label':'SETTINGS','method':'open','fallbackUrl':'https://www.torn.com/bazaar.php'},
        {'icon':'💰','id':'quick-fill','label':'QUICK FILL','method':'quickFill','fallbackUrl':'https://www.torn.com/bazaar.php'},
        {'icon':'🔄','id':'refresh','label':'REFRESH','method':'refresh','fallbackUrl':'https://www.torn.com/bazaar.php'}
    ],
    'release': {
        'version': VERSION,
        'date': DATE,
        'notes': [
            'Rebases the module on Torn Bazaar Quick Pricer v2.9.3 so per-item button placement, quantity fill, price fill, undo, Manage Bazaar repricing and bulk chip behavior match the proven script.',
            'Replaces the broken custom row layout with the upstream native description-area Quick Add button, preventing Equipped-row and right-edge overflow problems.',
            'Keeps the polished upstream settings layout but skins it with SakaLuX Hub dark UI tokens.',
            'Adds Skip bonus items alongside upstream Skip RW weapons and keeps both protections enabled by default.',
            'Exports SakaLuXBazaarSmartPricer.open / quickFill / refresh for Script Hub integration.'
        ]
    }
})
REGISTRY.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

# Release surfaces.
release_text = f'''# SakaLuX Bazaar Smart Pricer v{VERSION}\n\nRelease date: **{DATE}**\n\n## Quick Pricer parity rebuild\nThis release replaces the custom Bazaar-row implementation with the proven **Torn Bazaar Quick Pricer v2.9.3** structure (MIT licensed), then applies SakaLuX Hub integration and styling.\n\n- Per-item Quick Add / Undo is injected in the same native item-description container as upstream.\n- Quick Add fills the full available quantity and calculated price together.\n- Equipped / disabled rows are not treated as sellable Add Items rows.\n- The draggable **Quick Fill / Update All + Settings** chip follows upstream behavior.\n- Settings preserve the polished upstream layout while using SakaLuX Hub dark colors.\n- **Skip RW weapons** and **Skip bonus items** are enabled by default.\n- NPC floor, $1 protection, discount/markup, alert threshold and cache controls are retained.\n- Script Hub can call `SakaLuXBazaarSmartPricer.open()`, `.quickFill()` and `.refresh()`.\n\n## Upstream attribution\nBehavior/UI structure: Torn Bazaar Quick Pricer v2.9.3 by Zedtrooper [3028329] / Musa-dabwe contributors, MIT License.\n\n## Validation\n- `node --check SakaLuX-Bazaar-Smart-Pricer.user.js`\n- `python3 -m json.tool scripts.json`\n'''
RELEASE.parent.mkdir(parents=True, exist_ok=True)
RELEASE.write_text(release_text)
MANIFEST.write_text(json.dumps({
    'version': VERSION,
    'date': DATE,
    'canonical': 'SakaLuX-Bazaar-Smart-Pricer.user.js',
    'upstream': 'Torn Bazaar Quick Pricer v2.9.3 (MIT)',
    'documentation': 'greasyfork/Bazaar-Smart-Pricer.md',
    'releaseInfo': f'releases/bazaar-smart-pricer-v{VERSION}.md',
    'registry': 'scripts.json'
}, indent=2) + '\n')

if CHANGELOG.exists():
    old = CHANGELOG.read_text()
else:
    old = '# SakaLuX Bazaar Smart Pricer — Changelog\n\n'
block = f'''## v{VERSION} — {DATE}\n- Full Quick Pricer v2.9.3 parity rebuild under MIT provenance.\n- Restores upstream per-item Quick Add/Undo placement and full quantity + price filling.\n- Removes the custom S QUICK FILL bar and broken custom row-button layout in favor of the upstream draggable Quick Fill / Settings chip.\n- Adds SakaLuX Hub dark skin while preserving the upstream settings geometry.\n- Adds generic bonus-item skipping in addition to RW skipping; both default ON.\n- Adds Script Hub API integration and synchronizes scripts.json.\n\n'''
if f'## v{VERSION} — {DATE}' not in old:
    old = old.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n', '# SakaLuX Bazaar Smart Pricer — Changelog\n\n' + block, 1)
CHANGELOG.write_text(old)

GF_DOC.parent.mkdir(parents=True, exist_ok=True)
gf = GF_DOC.read_text() if GF_DOC.exists() else '# SakaLuX Bazaar Smart Pricer\n\n'
if '## Current version' in gf:
    gf = re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)', rf'\g<1>{VERSION}\g<2>', gf, count=1)
else:
    gf = gf.replace('# SakaLuX Bazaar Smart Pricer\n', f'# SakaLuX Bazaar Smart Pricer\n\n## Current version\n**v{VERSION}**\n', 1)
if f'### v{VERSION}' not in gf:
    gf += f'''\n### v{VERSION} — Quick Pricer parity + Hub skin\n- Uses the exact upstream Add Items button placement and quantity+price fill workflow.\n- Uses the upstream draggable Quick Fill / Settings chip and settings layout.\n- Applies SakaLuX Hub dark styling and Hub quick actions.\n- Skips RW and generic bonus items by default.\n'''
GF_DOC.write_text(gf)

README.write_text(f'''# SakaLuX Bazaar Smart Pricer\n\nCurrent version: **v{VERSION}**\n\nHub-integrated Torn Bazaar pricing helper rebased on Torn Bazaar Quick Pricer v2.9.3 (MIT). It keeps the proven per-item Quick Add/Undo, full quantity + price fill, bulk Quick Fill/Update All chip and settings workflow, with SakaLuX Hub styling and extra bonus-item protection.\n''')
INSTALL.write_text('''# Install — SakaLuX Bazaar Smart Pricer\n\nCanonical userscript:\n`https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js`\n\nInstall in TornPDA/Tampermonkey/Violentmonkey. Open Bazaar: the Quick Pricer-style per-item controls and draggable Quick Fill/Settings chip will initialize automatically. The same Settings panel is also available from SakaLuX Script Hub.\n''')

if HUB_DOC.exists():
    h = HUB_DOC.read_text()
    marker = f'### Bazaar Smart Pricer v{VERSION}'
    if marker not in h:
        h += f'''\n\n{marker}\n- Rebased on Quick Pricer v2.9.3 behavior with native per-item Quick Add/Undo.\n- Adds Hub-styled settings and Hub SETTINGS / QUICK FILL / REFRESH actions.\n- RW and generic bonus-item safety defaults to ON.\n'''
    HUB_DOC.write_text(h)

print(f'Generated SakaLuX Bazaar Smart Pricer v{VERSION} from pinned MIT upstream source.')
