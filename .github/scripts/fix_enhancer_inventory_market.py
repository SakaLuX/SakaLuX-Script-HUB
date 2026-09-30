#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / 'SakaLuX-Enhancer-Guard.user.js'
REGISTRY = ROOT / 'scripts.json'
DOC = ROOT / 'greasyfork' / 'Enhancer-Guard.md'
TARGET = '1.3.54'
DATE = '2026-09-30'


def replace_once(text, old, new, label):
    if old not in text:
        if new in text:
            return text
        raise SystemExit(f'Missing expected {label} block')
    return text.replace(old, new, 1)

s = SCRIPT.read_text(encoding='utf-8')
if f'// @version      {TARGET}' not in s:
    s = replace_once(s, '// @version      1.3.53', f'// @version      {TARGET}', 'metadata version')
    s = s.replace('"version":"1.3.53"', f'"version":"{TARGET}"', 1)
    s = replace_once(s, "const VERSION = '1.3.53';", f"const VERSION = '{TARGET}';", 'runtime version')

old_state = "        inventory: new Map(),\n        loading: false,"
new_state = "        inventory: new Map(),\n        inventorySnapshotAt: 0,\n        loading: false,"
s = replace_once(s, old_state, new_state, 'inventory snapshot state')

old_market = """    function itemMarketUrl(item) {
        const value = item?.id
            ? 'itemID=' + encodeURIComponent(item.id)
            : 'searchname=' + encodeURIComponent(item?.name || '');
        return 'https://www.torn.com/page.php?sid=ItemMarket#/market?' + value;
    }
"""
new_market = """    function itemMarketUrl(item) {
        const params = new URLSearchParams();
        if (item?.id) params.set('itemID', String(item.id));
        if (item?.name) params.set('itemName', String(item.name));
        if (item?.category) params.set('itemType', String(item.category));
        return 'https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&' + params.toString();
    }
"""
s = replace_once(s, old_market, new_market, 'Item Market URL')

old_refresh_start = """            state.categories = detectCategories();
            state.diagnostics.push('Categories: ' + state.categories.join(', '));
            const merged = new Map();

            for (const category of state.categories) {
"""
new_refresh_start = """            state.categories = detectCategories();
            state.diagnostics.push('Categories: ' + state.categories.join(', '));
            const merged = new Map();
            state.inventorySnapshotAt = 0;

            for (const category of state.categories) {
"""
s = replace_once(s, old_refresh_start, new_refresh_start, 'refresh snapshot reset')

old_refresh_data = """                const normalized = normalizeInventory(data);
                mergeInventory(merged, normalized);
                state.diagnostics.push(category + ': ' + normalized.size + ' item types');
"""
new_refresh_data = """                const normalized = normalizeInventory(data);
                mergeInventory(merged, normalized);
                const snapshotAt = Number(data?.inventory?.timestamp || 0);
                if (Number.isFinite(snapshotAt) && snapshotAt > state.inventorySnapshotAt) state.inventorySnapshotAt = snapshotAt;
                state.diagnostics.push(category + ': ' + normalized.size + ' item types' + (snapshotAt ? ' · snapshot ' + new Date(snapshotAt * 1000).toLocaleTimeString() : ''));
"""
s = replace_once(s, old_refresh_data, new_refresh_data, 'inventory snapshot capture')

old_css = ".sl-eg-empty{padding:30px 10px;text-align:center;color:#9ca3af}.sl-eg-error{padding:15px;background:#32191d;border:1px solid #6b252d;color:#fca5a5;border-radius:12px;margin:10px;font-size:12px;line-height:1.5}"
new_css = ".sl-eg-empty{padding:30px 10px;text-align:center;color:#9ca3af}.sl-eg-cache-warning{margin:0 0 9px;padding:9px 10px;border:1px solid #66591d;border-radius:9px;background:#211d10;color:#f5d85f;font-size:10px;line-height:1.45}.sl-eg-error{padding:15px;background:#32191d;border:1px solid #6b252d;color:#fca5a5;border-radius:12px;margin:10px;font-size:12px;line-height:1.5}"
s = replace_once(s, old_css, new_css, 'cache warning CSS')

old_html = """        let html = '';
        const filteredNormal = filterItems(normal);
"""
new_html = """        let html = '';
        if (state.inventorySnapshotAt) {
            const ageMinutes = Math.max(0, Math.floor((Date.now() - state.inventorySnapshotAt * 1000) / 60000));
            if (ageMinutes >= 2) {
                html += `<div class=\"sl-eg-cache-warning\">⚠️ Torn inventory API snapshot is ${ageMinutes} min old. New purchases can remain shown as NOT OWNED until Torn refreshes its inventory cache (up to about 1 hour). The Refresh button cannot bypass Torn's server-side cache.</div>`;
            }
        }
        const filteredNormal = filterItems(normal);
"""
s = replace_once(s, old_html, new_html, 'cache warning render')

SCRIPT.write_text(s, encoding='utf-8')

registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
for row in registry.get('scripts', []):
    if row.get('id') != 'enhancer':
        continue
    row['version'] = TARGET
    row['release'] = {
        'version': TARGET,
        'date': DATE,
        'notes': [
            'Fixes Enhancer item links so they open Item Market directly in the selected item search instead of only opening the generic market page.',
            'Reads Torn API inventory.timestamp and shows a visible stale-cache warning when the inventory snapshot is old, explaining why a newly purchased enhancer can still appear as NOT OWNED.',
            'Keeps manual Refresh accurate about Torn server-side inventory caching instead of implying that a refresh can bypass the API cache.'
        ]
    }
    row['info'] = str(row.get('info') or '').replace('Inventory data can lag until refreshed.', 'Torn API inventory is cached server-side for up to about one hour, so newly purchased items may remain pending even after a manual refresh. The panel shows the snapshot age when the API data is stale.')
    break
else:
    raise SystemExit('Enhancer entry missing from scripts.json')
REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

doc = DOC.read_text(encoding='utf-8')
doc = re.sub(r'(?m)^\*\*v1\.3\.53\*\*$', f'**v{TARGET}**', doc, count=1)
doc = re.sub(r'(?m)^- Canonical version: \*\*v1\.3\.53\*\*$', f'- Canonical version: **v{TARGET}**', doc, count=1)
release_re = re.compile(r'(?s)## Current release note\n\n.*?(?=\n## Release history / Changelog)')
release_block = f'''## Current release note\n\n**v{TARGET} — Inventory cache visibility and direct Item Market search**\n- Fixes Enhancer item links so they open Item Market directly on the selected item search.\n- Reads Torn's inventory snapshot timestamp and warns when server-side cached inventory is stale.\n- Explains that newly purchased enhancers can remain NOT OWNED until Torn refreshes its roughly one-hour inventory cache.\n'''
if not release_re.search(doc):
    raise SystemExit('Current release note block missing')
doc = release_re.sub(release_block.rstrip(), doc, count=1)
heading = '## Release history / Changelog\n'
entry = f'''\n\n### v{TARGET} — Inventory cache visibility and direct market search\n- Fixes item links to use `/page.php?sid=ItemMarket#/market/view=search&itemID=...` with item name/type context, so the selected Enhancer opens directly instead of the generic Item Market.\n- Captures `inventory.timestamp` from Torn API v2 and displays the age of stale inventory snapshots.\n- Adds an explicit warning that Torn caches `user/inventory` per category for up to about one hour, so a new purchase may remain marked NOT OWNED even after manual refresh.\n'''
if f'### v{TARGET} ' not in doc:
    if heading not in doc:
        raise SystemExit('Changelog heading missing')
    doc = doc.replace(heading, heading + entry, 1)
DOC.write_text(doc, encoding='utf-8')

print(f'Enhancer Guard v{TARGET} inventory-cache and Item Market fixes applied or already current.')
