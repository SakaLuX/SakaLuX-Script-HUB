from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

MANAGED = {
    'enhancer': {
        'file': 'SakaLuX-Enhancer-Guard.user.js', 'runtime': 'VERSION', 'doc': 'greasyfork/Enhancer-Guard.md',
        'display': 'Enhancer Guard', 'prefixes': ['sl-eg-']
    },
    'bazaar': {
        'file': 'SakaLuX-Bazaar-Thanker-PDA.user.js', 'runtime': 'BAZAAR_VERSION', 'doc': 'greasyfork/Bazaar-Thanker.md',
        'display': 'Bazaar Thanker - PDA', 'prefixes': ['sakalux-bt-']
    },
    'mission-rewards': {
        'file': 'SakaLuX-Mission-Rewards.user.js', 'runtime': 'VERSION', 'doc': 'greasyfork/Mission-Rewards.md',
        'display': 'Mission Rewards', 'prefixes': ['sl-mr-', 'sl-mri-']
    },
    'market-intelligence': {
        'file': 'SakaLuX-Market-Intelligence.user.js', 'runtime': 'VERSION', 'doc': 'greasyfork/Market-Intelligence.md',
        'display': 'Market Intelligence', 'prefixes': ['sl-mi-']
    },
    'elimination-assistant': {
        'file': 'SakaLuX-Elimination-Assistant.user.js', 'runtime': 'VERSION', 'doc': 'greasyfork/Elimination-Assistant.md',
        'display': 'Elimination Assistant', 'prefixes': ['slx-elim-']
    },
}

STANDALONE = {
    'account-auditor': {
        'file': 'SakaLuX-Account-Auditor.user.js', 'runtime': 'VERSION', 'doc': 'greasyfork/Account-Auditor.md',
        'display': 'Account Auditor', 'prefixes': ['sl-aa-']
    },
    'suite': {
        'file': 'SakaLuX-Suite.user.js', 'runtime': 'VERSION', 'doc': 'greasyfork/SakaLuX-Suite.md',
        'display': 'SakaLuX Suite [EXPERIMENTAL]', 'prefixes': [], 'suite': True
    },
}


def bump(v):
    parts = v.split('.')
    if not parts or not parts[-1].isdigit():
        raise SystemExit(f'Cannot patch-bump version {v!r}')
    parts[-1] = str(int(parts[-1]) + 1)
    return '.'.join(parts)


def css_scope(prefixes, suite=False):
    if suite:
        base = ['[id*="sakalux" i]', '[class*="sakalux" i]', '[id*="suite" i]', '[class*="suite" i]', '[id*="master-control" i]', '[class*="master-control" i]']
        buttons = ['button[id*="sakalux" i]', 'button[class*="sakalux" i]', 'button[id*="suite" i]', 'button[class*="suite" i]', 'button[id*="master-control" i]']
        inputs = ['input[id*="sakalux" i]', 'select[id*="sakalux" i]', 'textarea[id*="sakalux" i]', 'input[id*="suite" i]', 'select[id*="suite" i]', 'textarea[id*="suite" i]']
        checks = ['input[type="checkbox"][id*="sakalux" i]', 'input[type="checkbox"][id*="suite" i]']
        panels = ['[id*="sakalux" i][id*="panel" i]', '[id*="sakalux" i][id*="control" i]', '[id*="suite" i][id*="panel" i]', '[id*="master-control" i]']
        headers = ['[class*="sakalux" i][class*="header" i]', '[class*="suite" i][class*="header" i]', '[id*="sakalux" i][id*="header" i]']
        cards = ['[class*="sakalux" i][class*="card" i]', '[class*="sakalux" i][class*="row" i]', '[class*="suite" i][class*="card" i]', '[class*="suite" i][class*="row" i]']
    else:
        base=[];buttons=[];inputs=[];checks=[];panels=[];headers=[];cards=[]
        for p in prefixes:
            base += [f'[id^="{p}"]', f'[class*="{p}"]']
            buttons += [f'button[id^="{p}"]', f'button[class*="{p}"]']
            inputs += [f'input[id^="{p}"]', f'select[id^="{p}"]', f'textarea[id^="{p}"]', f'[id^="{p}"] input', f'[id^="{p}"] select', f'[id^="{p}"] textarea']
            checks += [f'input[type="checkbox"][id^="{p}"]']
            panels += [f'[id^="{p}"][id*="panel" i]', f'[id^="{p}"][id*="settings" i]', f'[id^="{p}"][id*="modal" i]', f'[id^="{p}"][id*="details" i]']
            headers += [f'[class*="{p}"][class*="header" i]', f'[id^="{p}"][id*="header" i]']
            cards += [f'[class*="{p}"][class*="card" i]', f'[class*="{p}"][class*="row" i]', f'[class*="{p}"][class*="section" i]', f'[class*="{p}"][class*="note" i]']
    return {k: ','.join(v) for k,v in {'base':base,'buttons':buttons,'inputs':inputs,'checks':checks,'panels':panels,'headers':headers,'cards':cards}.items()}


def theme_js(key, prefixes, suite=False):
    s = css_scope(prefixes, suite)
    safe = re.sub(r'[^A-Za-z0-9_]', '_', key)
    style_id = f'sakalux-unified-theme-{key}'
    return f'''\n\n    /* SakaLuX Unified Control Center UI — visual layer only. */\n    function installSakaLuXUnifiedTheme_{safe}() {{\n        if (document.getElementById('{style_id}')) return;\n        const style = document.createElement('style');\n        style.id = '{style_id}';\n        style.textContent = `\n:where({s['base']}){{font-family:Inter,Arial,sans-serif!important;box-sizing:border-box}}\n:where({s['panels']}){{background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%)!important;color:#e7edf5!important;border:1px solid #314154!important;border-radius:16px!important;box-shadow:0 18px 52px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.025)!important}}\n:where({s['headers']}){{background:linear-gradient(155deg,#1b2634,#111923)!important;border-color:#314154!important;color:#f8fafc!important}}\n:where({s['cards']}){{background:linear-gradient(145deg,#18212d,#131b25)!important;border-color:#2d3c4e!important;border-radius:12px!important;color:#dce6f0!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}}\n:where({s['buttons']}){{border:1px solid #3d78bf!important;border-radius:10px!important;background:linear-gradient(180deg,#377fcf,#275f9f)!important;color:#fff!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,filter .12s ease!important}}\n:where({s['buttons']}):active{{transform:translateY(1px)!important}}\n:where({s['inputs']}){{background:#0d141d!important;border:1px solid #3a4b61!important;border-radius:9px!important;color:#f4f7fb!important;outline:none!important}}\n:where({s['checks']}){{appearance:none!important;-webkit-appearance:none!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0 8px 0 0!important;vertical-align:middle!important;border:1px solid #546276!important;border-radius:999px!important;background:radial-gradient(circle at 10px 50%,#e7edf5 0 6px,transparent 6.5px),#465365!important;cursor:pointer!important;transition:.18s ease!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)!important}}\n:where({s['checks']}):checked{{border-color:#24754f!important;background:radial-gradient(circle at 27px 50%,#fff 0 6px,transparent 6.5px),#1eb36a!important}}\n:where({s['buttons']})[id*="close" i],:where({s['buttons']})[class*="close" i],:where({s['buttons']})[id*="back" i],:where({s['buttons']})[class*="gray" i],:where({s['buttons']})[class*="secondary" i]{{background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}}\n:where({s['buttons']})[id*="clear" i],:where({s['buttons']})[id*="reset" i],:where({s['buttons']})[id*="delete" i],:where({s['buttons']})[class*="danger" i],:where({s['buttons']})[class*="red" i]{{background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}}\n@media(max-width:520px){{:where({s['panels']}){{border-radius:15px!important}}:where({s['buttons']}){{min-height:34px!important}}}}\n`;\n        (document.head || document.documentElement).appendChild(style);\n    }}\n    installSakaLuXUnifiedTheme_{safe}();\n'''


def patch_script(key, cfg):
    path = ROOT / cfg['file']
    text = path.read_text(encoding='utf-8')
    meta = re.search(r'^// @version\s+([^\s]+)\s*$', text, re.M)
    if not meta:
        raise SystemExit(f'{cfg["file"]}: @version missing')
    old = meta.group(1)
    new = bump(old)
    text = re.sub(r'(^// @version\s+)' + re.escape(old) + r'(\s*$)', r'\g<1>' + new + r'\2', text, count=1, flags=re.M)
    runtime = cfg['runtime']
    rx = re.compile(r'(const\s+' + re.escape(runtime) + r'\s*=\s*[\'\"])' + re.escape(old) + r'([\'\"])')
    text, n = rx.subn(r'\g<1>' + new + r'\2', text, count=1)
    if n != 1:
        raise SystemExit(f'{cfg["file"]}: runtime version {runtime}={old} not found')
    marker = f'SakaLuX Unified Control Center UI — visual layer only.'
    if marker not in text:
        pos = text.rfind('})();')
        if pos < 0:
            raise SystemExit(f'{cfg["file"]}: final IIFE close not found')
        text = text[:pos] + theme_js(key, cfg.get('prefixes', []), cfg.get('suite', False)) + '\n' + text[pos:]
    path.write_text(text, encoding='utf-8')
    return old, new


def patch_doc(path_str, new_version, title):
    path = ROOT / path_str
    text = path.read_text(encoding='utf-8')
    text, n = re.subn(r'(## Current version\s+\n\*\*v)[^*]+(\*\*)', r'\g<1>' + new_version + r'\2', text, count=1)
    if n != 1:
        text, n = re.subn(r'(\*\*Current version:\s*v)[^*]+(\*\*)', r'\g<1>' + new_version + r'\2', text, count=1)
    if n != 1:
        raise SystemExit(f'{path_str}: current version marker not found')
    heading = '## Current release notes\n\n'
    note = f'''### v{new_version}\n\n- Adopted the unified **SakaLuX Control Center** visual system used by Script Hub.\n- Standardized panels, cards, buttons, inputs, borders, spacing and compatible settings toggles for a more consistent TornPDA/desktop experience.\n- UI-only release: existing features, APIs and saved data remain unchanged.\n\n'''
    if f'### v{new_version}' not in text:
        if heading not in text:
            raise SystemExit(f'{path_str}: release notes heading not found')
        text = text.replace(heading, heading + note, 1)
    path.write_text(text, encoding='utf-8')


versions = {}
for key, cfg in {**MANAGED, **STANDALONE}.items():
    old, new = patch_script(key, cfg)
    versions[key] = (old, new)
    patch_doc(cfg['doc'], new, cfg['display'])
    print(f'{cfg["file"]}: {old} -> {new}')

# Sync managed versions into scripts.json.
registry_path = ROOT / 'scripts.json'
registry = json.loads(registry_path.read_text(encoding='utf-8'))
for item in registry.get('scripts', []):
    if item.get('id') in MANAGED:
        item['version'] = versions[item['id']][1]
registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Sync Hub fallback registry and bump Hub itself because its fallback data changes.
hub_path = ROOT / 'SakaLuX-Script-Hub.user.js'
hub = hub_path.read_text(encoding='utf-8')
for key, cfg in MANAGED.items():
    new = versions[key][1]
    pattern = re.compile(r"(id:\s*['\"]" + re.escape(key) + r"['\"][\s\S]{0,500}?version:\s*['\"])([^'\"]+)(['\"])")
    hub, n = pattern.subn(r'\g<1>' + new + r'\3', hub, count=1)
    if n != 1:
        raise SystemExit(f'Hub fallback version for {key} not found')

hub_meta = re.search(r'^// @version\s+([^\s]+)\s*$', hub, re.M)
if not hub_meta:
    raise SystemExit('Hub @version missing')
hub_old = hub_meta.group(1)
hub_new = bump(hub_old)
hub = re.sub(r'(^// @version\s+)' + re.escape(hub_old) + r'(\s*$)', r'\g<1>' + hub_new + r'\2', hub, count=1, flags=re.M)
hub = re.sub(r"(const VERSION\s*=\s*['\"])" + re.escape(hub_old) + r"(['\"])", r'\g<1>' + hub_new + r'\2', hub, count=1)
release_marker = '    const HUB_CHANGELOG = [\n'
hub_release = f'''        {{\n            version: '{hub_new}',\n            date: '2026-09-11',\n            changes: [\n                'Embedded the unified SakaLuX Control Center theme directly into every current SakaLuX userscript.',\n                'Managed add-ons now keep the same visual language even when used without Script Hub.',\n                'Account Auditor and Suite receive the same self-contained visual layer while remaining standalone and absent from the Hub registry.',\n                'Synchronized all managed add-on patch versions across scripts.json, Hub fallback data and documentation.'\n            ]\n        }},\n'''
if f"version: '{hub_new}'" not in hub:
    hub = hub.replace(release_marker, release_marker + hub_release, 1)
hub_path.write_text(hub, encoding='utf-8')

# Hub documentation: bump version, add release note, update registered add-on versions.
hub_doc_path = ROOT / 'greasyfork/Script-Hub.md'
hub_doc = hub_doc_path.read_text(encoding='utf-8')
hub_doc = re.sub(r'(## Current version\s+\n\*\*v)[^*]+(\*\*)', r'\g<1>' + hub_new + r'\2', hub_doc, count=1)
hub_note = f'''### v{hub_new}\n\n- Embedded the unified **SakaLuX Control Center** visual theme directly into every current SakaLuX userscript so the look no longer depends on Hub being present.\n- Synchronized the managed add-on patch versions in `scripts.json`, Hub fallback data and the dedicated information pages.\n- Account Auditor and SakaLuX Suite also receive their own embedded copy of the visual layer while remaining standalone and completely absent from the Hub registry.\n\n'''
if f'### v{hub_new}' not in hub_doc:
    hub_doc = hub_doc.replace('## Current release notes\n\n', '## Current release notes\n\n' + hub_note, 1)
for key, cfg in MANAGED.items():
    old, new = versions[key]
    # Only update the registered-add-ons list occurrence, but replacing the exact old version globally is safe here because script-specific names differ.
    line_rx = re.compile(r'(- .*SakaLuX ' + re.escape(cfg['display']) + r' \*\*v)' + re.escape(old) + r'(\*\*)')
    hub_doc, n = line_rx.subn(r'\g<1>' + new + r'\2', hub_doc, count=1)
    if n != 1:
        raise SystemExit(f'Hub info registered version for {cfg["display"]} not found')
hub_doc_path.write_text(hub_doc, encoding='utf-8')

print('Hub:', hub_old, '->', hub_new)
print('Per-script unified UI embedding complete.')
