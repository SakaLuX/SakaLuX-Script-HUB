#!/usr/bin/env python3
from pathlib import Path
from datetime import date
import json
import re

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / 'scripts.json'
HUB = ROOT / 'SakaLuX-Script-Hub.user.js'
TODAY = date.today().isoformat()

ORDER = [
    'enhancer', 'bazaar', 'bazaar-smart-pricer', 'mission-rewards',
    'market-intelligence', 'elimination-assistant', 'company-intelligence',
    'chat-intelligence', 'stock-manager-advisor', 'account-auditor'
]
ORDER_JS = "const ORDER=[" + ",".join(repr(x) for x in ORDER) + "];"

RELEASE_NOTES = [
    'Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.',
    'Deduplicates standalone registrations by module id before rendering.',
    'Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page.'
]
HUB_NOTES = [
    'Stops installed module SETTINGS/OPEN actions from falling through to the install/source URL when the module API is unavailable on the current page.',
    'Bazaar Smart Pricer now routes to Bazaar first when needed; pressing it again opens its own settings through the module API.',
    'Keeps standalone module ordering deterministic across all shared dock renderers.'
]


def header_version(text: str) -> str:
    m = re.search(r'(?m)^//\s*@version\s+(\d+(?:\.\d+)+)', text)
    if not m:
        raise RuntimeError('Missing @version')
    return m.group(1)


def bump_patch(v: str) -> str:
    parts = [int(x) for x in v.split('.')]
    while len(parts) < 3:
        parts.append(0)
    parts[-1] += 1
    return '.'.join(str(x) for x in parts)


def bump_script(text: str) -> tuple[str, str]:
    old = header_version(text)
    new = bump_patch(old)
    text = re.sub(r'(?m)^(//\s*@version\s+)\S+', lambda m: m.group(1) + new, text, count=1)
    # Canonical marker fallback version.
    text = re.sub(r"(let\s+v\s*=\s*['\"])" + re.escape(old) + r"(['\"])", lambda m: m.group(1) + new + m.group(2), text, count=1)
    # Common runtime constants.
    text = re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(old) + r"(['\"])", lambda m: m.group(1) + new + m.group(2), text, count=1)
    text = re.sub(r"(\{\s*version\s*:\s*['\"])" + re.escape(old) + r"(['\"]\s*\}\s*\))", lambda m: m.group(1) + new + m.group(2), text, count=1)
    return text, new


def patch_standalone(text: str) -> tuple[str, bool]:
    if 'SakaLuX Standalone Dock Bootstrap' not in text:
        return text, False
    original = text

    # Every renderer gets the exact same ranking table.
    text = re.sub(r"const ORDER=\[[^\n;]*\];", ORDER_JS, text, count=1)

    # Deduplicate transient/legacy registration nodes before sorting. This removes
    # race-dependent rows and makes the output independent of userscript start order.
    old_regs = "const regs=[...document.querySelectorAll(`[${REG_ATTR}]`)].map(x=>x.dataset).filter(x=>x.id);"
    new_regs = "const regsRaw=[...document.querySelectorAll(`[${REG_ATTR}]`)].map(x=>x.dataset).filter(x=>x.id); const regs=[...new Map(regsRaw.map(r=>[r.id,r])).values()];"
    if old_regs in text:
        text = text.replace(old_regs, new_regs, 1)

    # The standalone row must never treat Smart Pricer as an installer link. On a
    # non-Bazaar page it routes to Bazaar; on Bazaar it asks the module API to open
    # Settings. Other modules keep their existing selector/bridge/fallback behavior.
    open_pat = re.compile(r"function openEntry\(data\)\{const el=data\.selector\?document\.querySelector\(data\.selector\):null;if\(el\)\{el\.click\(\);return;\}const bridge=document\.getElementById\('sakalux-module-bridge-'\+data\.id\);if\(bridge\)\{bridge\.dataset\.action='open';bridge\.click\(\);return;\}if\(data\.fallback\)location\.href=data\.fallback;\}")
    open_new = """function openEntry(data){
    if(data.id==='bazaar-smart-pricer'){
      if(location.pathname!=='/bazaar.php'){location.href=data.fallback||'https://www.torn.com/bazaar.php';return;}
      try{const api=window.SakaLuXBazaarSmartPricer;if(api&&typeof api.open==='function'){api.open();return;}}catch{}
    }
    const el=data.selector?document.querySelector(data.selector):null;if(el){el.click();return;}
    const bridge=document.getElementById('sakalux-module-bridge-'+data.id);if(bridge){bridge.dataset.action='open';bridge.click();return;}
    if(data.fallback)location.href=data.fallback;
  }"""
    text = open_pat.sub(open_new, text, count=1)
    return text, text != original


def patch_hub(text: str) -> tuple[str, bool]:
    original = text
    old = """            if (script.fallbackOpen()) {
                recordUsage(id);
                closeHub();
                return;
            }
            const url = getInstallUrl(script);
            if (url) location.href = url;
            return;"""
    new = """            // Installed modules must never fall through to their installer/source URL
            // just because their runtime API is not active on this Torn page.
            if (script.id === 'bazaar-smart-pricer') {
                const smartAction = (script.quickActions || []).find(item => item.id === actionId)
                    || (script.quickActions || []).find(item => item.id === 'open');
                if (smartAction?.fallbackUrl && location.pathname !== '/bazaar.php') {
                    recordUsage(id);
                    closeHub();
                    location.href = smartAction.fallbackUrl;
                    return;
                }
            }
            if (script.fallbackOpen()) {
                recordUsage(id);
                closeHub();
                return;
            }
            const fallbackAction = (script.quickActions || []).find(item => item.id === actionId)
                || (script.quickActions || []).find(item => item.id === 'open');
            if (fallbackAction?.fallbackUrl) {
                recordUsage(id);
                closeHub();
                location.href = fallbackAction.fallbackUrl;
                return;
            }
            if (getInstalledVersion(script)) {
                alert(script.name + ' is installed but its panel is not available on this page. Open the module page and press SETTINGS again.');
                return;
            }
            const url = getInstallUrl(script);
            if (url) location.href = url;
            return;"""
    if old in text:
        text = text.replace(old, new, 1)
    return text, text != original


def update_registry_versions(changed_versions: dict[str, str], hub_version: str | None):
    data = json.loads(REGISTRY.read_text(encoding='utf-8'))
    for row in data.get('scripts', []):
        sid = row.get('id')
        if sid not in changed_versions:
            continue
        v = changed_versions[sid]
        row['version'] = v
        release = row.setdefault('release', {})
        release['version'] = v
        release['date'] = TODAY
        release['notes'] = RELEASE_NOTES[:]
    REGISTRY.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


changed_versions = {}
registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
source_to_id = {}
for row in registry.get('scripts', []):
    src = row.get('sourceUrl', '').split('/')[-1]
    if src:
        from urllib.parse import unquote
        source_to_id[unquote(src)] = row.get('id')

# Patch every userscript that carries the shared standalone renderer, not only the
# modules currently visible in one screenshot. This keeps future combinations stable.
for path in ROOT.glob('*.user.js'):
    text = path.read_text(encoding='utf-8')
    patched, changed = patch_standalone(text)
    if not changed:
        continue
    patched, new_version = bump_script(patched)
    path.write_text(patched, encoding='utf-8')
    sid = source_to_id.get(path.name)
    if sid:
        changed_versions[sid] = new_version
    print(f'patched standalone dock: {path.name} -> {new_version}')

hub_text = HUB.read_text(encoding='utf-8')
hub_patched, hub_changed = patch_hub(hub_text)
hub_version = None
if hub_changed:
    hub_patched, hub_version = bump_script(hub_patched)
    # Keep a visible Hub changelog entry for this behavior fix.
    needle = '    const HUB_CHANGELOG = [\n'
    if needle in hub_patched and not any(note in hub_patched for note in HUB_NOTES):
        entry = '        ' + json.dumps({'version': hub_version, 'date': TODAY, 'changes': HUB_NOTES}, ensure_ascii=False) + ',\n'
        hub_patched = hub_patched.replace(needle, needle + entry, 1)
    HUB.write_text(hub_patched, encoding='utf-8')
    print(f'patched Hub routing: {hub_version}')

update_registry_versions(changed_versions, hub_version)
print('Standalone order/navigation fix complete.')
