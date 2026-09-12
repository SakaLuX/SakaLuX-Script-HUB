from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
MARK_START = '/* SakaLuX Standalone Dock Bootstrap — BEGIN */'
MARK_END = '/* SakaLuX Standalone Dock Bootstrap — END */'
RELEASE_NOTE = (
    'Standalone mode now groups SakaLuX launch buttons in one shared dock when Script Hub is not installed. '
    'The Hub install reminder is shared by all scripts and can appear at most once every 12 hours, preventing stacked or repeated prompts.'
)

BOOTSTRAP = r'''/* SakaLuX Standalone Dock Bootstrap — BEGIN */
(() => {
  'use strict';
  const HUB_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
  const INTERVAL = 12 * 60 * 60 * 1000;
  const DOCK_ID = 'sakalux-standalone-dock';
  const PROMPT_ID = 'sakalux-hub-install-prompt';
  const STYLE_ID = 'sakalux-standalone-dock-style';

  const hubInstalled = () => !!(window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button'));

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#${DOCK_ID}{position:fixed;right:10px;bottom:72px;z-index:2147483000;display:flex;flex-direction:column;gap:6px;max-width:min(260px,calc(100vw - 20px));padding:8px;background:rgba(13,17,23,.96);border:1px solid #3b4654;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.45);font:12px Arial,sans-serif}
#${DOCK_ID}[data-collapsed="1"] .slx-dock-items{display:none}
#${DOCK_ID} .slx-dock-head{display:flex;align-items:center;gap:6px}
#${DOCK_ID} .slx-dock-title{flex:1;color:#facc15;font-weight:900}
#${DOCK_ID} button,#${DOCK_ID} a{box-sizing:border-box!important;position:static!important;inset:auto!important;transform:none!important;float:none!important;margin:0!important;min-width:0!important;max-width:none!important;width:100%!important;height:auto!important;min-height:34px!important;padding:7px 9px!important;border-radius:8px!important;font:700 12px/1.2 Arial,sans-serif!important;white-space:normal!important}
#${DOCK_ID} .slx-dock-head button{width:auto!important;min-height:28px!important;padding:4px 7px!important}
#${DOCK_ID} .slx-dock-install{background:#8a5a00!important;border:1px solid #f59e0b!important;color:#fff!important;text-decoration:none!important;text-align:center!important;display:block!important}
#${DOCK_ID} .slx-dock-items{display:flex;flex-direction:column;gap:5px}
`;
    (document.head || document.documentElement).appendChild(s);
  }

  function ensureDock() {
    if (hubInstalled()) {
      document.getElementById(DOCK_ID)?.remove();
      document.getElementById(PROMPT_ID)?.remove();
      return null;
    }
    addStyle();
    let dock = document.getElementById(DOCK_ID);
    if (dock) return dock;
    dock = document.createElement('div');
    dock.id = DOCK_ID;
    dock.innerHTML = `<div class="slx-dock-head"><span class="slx-dock-title">SakaLuX Scripts</span><button type="button" data-slx-collapse>−</button></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${HUB_URL}">⬇ Install SakaLuX Hub</a>`;
    (document.body || document.documentElement).appendChild(dock);
    dock.querySelector('[data-slx-collapse]').addEventListener('click', () => {
      const collapsed = dock.dataset.collapsed === '1';
      dock.dataset.collapsed = collapsed ? '0' : '1';
      dock.querySelector('[data-slx-collapse]').textContent = collapsed ? '−' : '+';
    });
    return dock;
  }

  function eligible(el) {
    if (!el || el.nodeType !== 1 || el.closest('#' + DOCK_ID) || el.id === 'sakalux-hub-button') return false;
    if (!['BUTTON','A','DIV'].includes(el.tagName)) return false;
    const ident = `${el.id || ''} ${el.className || ''}`.toLowerCase();
    if (!/(slx|sakalux)/.test(ident)) return false;
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.width > 320 || r.height > 100) return false;
    if (/panel|modal|prompt|toast|style|overlay|dock/i.test(ident)) return false;
    return true;
  }

  function collectLaunchers() {
    const dock = ensureDock();
    if (!dock) return;
    const items = dock.querySelector('.slx-dock-items');
    document.querySelectorAll('button,a,div').forEach(el => {
      if (!eligible(el)) return;
      el.dataset.slxDocked = '1';
      items.appendChild(el);
    });
  }

  function maybePrompt() {
    if (hubInstalled() || document.getElementById(PROMPT_ID)) return;
    let last = 0;
    try { last = Number(localStorage.getItem(LAST_KEY) || 0); } catch {}
    if (last && Date.now() - last < INTERVAL) return;
    try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch {}
    const p = document.createElement('div');
    p.id = PROMPT_ID;
    p.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';
    p.innerHTML = `<div style="width:min(380px,100%);background:#111820;color:#fff;border:1px solid #465365;border-radius:14px;padding:18px;font:14px Arial,sans-serif;box-shadow:0 16px 50px #0008"><b style="font-size:17px">Install SakaLuX Script Hub?</b><div style="margin-top:8px;color:#cbd5e1;line-height:1.45">Keep all SakaLuX scripts together, with shared settings and controls.</div><div style="display:flex;gap:8px;margin-top:14px"><button type="button" data-slx-later style="flex:1;padding:10px;border-radius:8px;background:#202a36;color:#fff;border:1px solid #526174">Later</button><button type="button" data-slx-install style="flex:1;padding:10px;border-radius:8px;background:#8a5a00;color:#fff;border:1px solid #f59e0b;font-weight:900">Install Hub</button></div></div>`;
    (document.body || document.documentElement).appendChild(p);
    p.querySelector('[data-slx-later]').addEventListener('click', () => p.remove());
    p.querySelector('[data-slx-install]').addEventListener('click', () => { location.href = HUB_URL; });
  }

  function start() {
    if (hubInstalled()) return;
    ensureDock();
    collectLaunchers();
    setTimeout(maybePrompt, 1200);
    let timer = 0;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (hubInstalled()) {
          document.getElementById(DOCK_ID)?.remove();
          document.getElementById(PROMPT_ID)?.remove();
        } else collectLaunchers();
      }, 80);
    }).observe(document.documentElement, {childList:true, subtree:true});
    setInterval(() => { if (!hubInstalled()) { collectLaunchers(); maybePrompt(); } }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
/* SakaLuX Standalone Dock Bootstrap — END */'''

DOC_MAP = {
    'SakaLuX-Account-Auditor.user.js': 'greasyfork/Account-Auditor.md',
    'SakaLuX-Bazaar-Thanker-PDA.user.js': 'greasyfork/Bazaar-Thanker.md',
    'SakaLuX-Company-Intelligence-v1.0.0.user.js': 'greasyfork/Company-Intelligence.md',
    'SakaLuX-Elimination-Assistant.user.js': 'greasyfork/Elimination-Assistant.md',
    'SakaLuX-Enhancer-Guard.user.js': 'greasyfork/Enhancer-Guard.md',
    'SakaLuX-Market-Intelligence.user.js': 'greasyfork/Market-Intelligence.md',
    'SakaLuX-Mission-Rewards.user.js': 'greasyfork/Mission-Rewards.md',
    'SakaLuX-Script-Hub.user.js': 'greasyfork/Script-Hub.md',
    'SakaLuX-Suite.user.js': 'greasyfork/SakaLuX-Suite.md',
}

DESCRIPTIONS = {
    'SakaLuX-Account-Auditor.user.js': 'Private read-only Torn account auditor with safe API collection, snapshots and account diagnostics.',
    'SakaLuX-Bazaar-Thanker-PDA.user.js': 'Groups bazaar buyers, prepares thank-you messages and keeps useful sales history and statistics.',
    'SakaLuX-Company-Intelligence-v1.0.0.user.js': 'Company intelligence tools for employees and directors, including performance and management views.',
    'SakaLuX-Elimination-Assistant.user.js': 'Eliminations target advisor with Torn and FFScouter support, safe-target memory, filtering and export.',
    'SakaLuX-Enhancer-Guard.user.js': 'Tracks enhancers and relics, inventory ownership and item protection helpers.',
    'SakaLuX-Market-Intelligence.user.js': 'Market and travel intelligence with pricing, item-market tools, loadout comparison and travel helpers.',
    'SakaLuX-Mission-Rewards.user.js': 'Adds mission reward values, value-per-credit guidance and related inventory information.',
    'SakaLuX-Script-Hub.user.js': 'Central manager, launcher, language/settings bridge and health monitor for SakaLuX Torn scripts.',
    'SakaLuX-Suite.user.js': 'Unified SakaLuX suite containing the complete set of integrated Torn helper modules.',
}


def bump_patch(v: str) -> str:
    m = re.fullmatch(r'(\d+)\.(\d+)\.(\d+)', v.strip())
    if not m:
        raise ValueError(f'Unsupported version: {v}')
    return f'{m.group(1)}.{m.group(2)}.{int(m.group(3)) + 1}'


def metadata(text: str, key: str) -> str:
    m = re.search(r'^// @' + re.escape(key) + r'\s+(.+?)\s*$', text, re.M)
    return m.group(1).strip() if m else ''


def strip_old_bootstrap(text: str) -> str:
    pattern = re.compile(re.escape(MARK_START) + r'.*?' + re.escape(MARK_END) + r'\n?', re.S)
    return re.sub(pattern, '', text)


def normalize_12h(text: str) -> str:
    text = re.sub(r'(HUB_PROMPT_INTERVAL\s*=\s*)86400000\b', r'\g<1>43200000', text)
    text = re.sub(r'(HUB_PROMPT_INTERVAL\s*=\s*)24\s*\*\s*60\s*\*\s*60\s*\*\s*1000', r'\g<1>12 * 60 * 60 * 1000', text)
    return text


def inject_bootstrap(text: str) -> str:
    text = strip_old_bootstrap(text)
    text = normalize_12h(text)
    marker = '// ==/UserScript=='
    idx = text.find(marker)
    if idx < 0:
        raise ValueError('Missing userscript metadata terminator')
    end = idx + len(marker)
    return text[:end] + '\n\n' + BOOTSTRAP + text[end:]


def bump_script(path: Path, add_bootstrap: bool) -> tuple[str, str, str]:
    text = path.read_text(encoding='utf-8')
    old = metadata(text, 'version')
    if not old:
        raise ValueError(f'{path.name}: missing @version')
    new = bump_patch(old)
    text = re.sub(r'(^// @version\s+)' + re.escape(old) + r'(\s*$)', rf'\g<1>{new}\g<2>', text, count=1, flags=re.M)
    text = re.sub(
        r"(const\s+[A-Z0-9_]*VERSION[A-Z0-9_]*\s*=\s*['\"])" + re.escape(old) + r"(['\"])",
        rf'\g<1>{new}\g<2>', text,
    )
    text = normalize_12h(text)
    if add_bootstrap:
        text = inject_bootstrap(text)
    path.write_text(text, encoding='utf-8')
    return old, new, metadata(text, 'name') or path.stem


def ensure_section(text: str, heading: str, body: str) -> str:
    pattern = re.compile(r'^## ' + re.escape(heading) + r'\s*\n.*?(?=^## |\Z)', re.M | re.S)
    replacement = f'## {heading}\n{body.strip()}\n\n'
    if pattern.search(text):
        return pattern.sub(replacement, text, count=1)
    return text.rstrip() + '\n\n' + replacement


def update_doc(path: Path, script_file: str, version: str, display_name: str, license_name: str):
    text = path.read_text(encoding='utf-8') if path.exists() else f'# {display_name}\n\n'
    if not re.search(r'^#\s+', text, re.M):
        text = f'# {display_name}\n\n' + text
    if script_file != 'SakaLuX-Script-Hub.user.js' and 'Complementary add-on for **SakaLuX Script Hub**' not in text:
        first_nl = text.find('\n')
        text = text[:first_nl+1] + '\n> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.\n' + text[first_nl+1:]
    text = re.sub(r'## Current version\s+\*\*v[^*]+\*\*', f'## Current version\n**v{version}**', text)
    text = re.sub(r'\*\*Current version:\s*v[^*]+\*\*', f'## Current version\n**v{version}**', text)
    if not re.search(r'^## Current version\s*$', text, re.M):
        text = ensure_section(text, 'Current version', f'**v{version}**')
    text = ensure_section(text, 'Current release note', RELEASE_NOTE if script_file != 'SakaLuX-Script-Hub.user.js' else (
        'Compatibility release for the shared standalone dock and 12-hour global Hub reminder used by SakaLuX add-ons. '
        'Hub fallback version references were synchronized with the newly released add-on versions.'
    ))
    if not re.search(r'^## What it does\s*$', text, re.M):
        text = ensure_section(text, 'What it does', DESCRIPTIONS.get(script_file, metadata((ROOT / script_file).read_text(encoding='utf-8'), 'description')))
    if not re.search(r'^## Recommended\s*$', text, re.M):
        recommendation = ('Use this as the central manager for SakaLuX scripts.' if script_file == 'SakaLuX-Script-Hub.user.js'
                          else 'Install **SakaLuX Script Hub** for centralized launch controls, language/settings sharing and easier management.')
        text = ensure_section(text, 'Recommended', recommendation)
    text = ensure_section(text, 'License', license_name or 'All Rights Reserved')
    if script_file in {'SakaLuX-Account-Auditor.user.js','SakaLuX-Elimination-Assistant.user.js','SakaLuX-Enhancer-Guard.user.js','SakaLuX-Market-Intelligence.user.js'}:
        if not re.search(r'^## Privacy\s*$', text, re.M):
            text = ensure_section(text, 'Privacy', 'API keys and script settings are handled locally by the userscript unless a feature explicitly states that it communicates with an external service.')
    path.write_text(text.rstrip() + '\n', encoding='utf-8')


versions = {}
names = {}
licenses = {}
for path in sorted(ROOT.glob('*.user.js')):
    # The Hub itself should not inject a dock that advertises installing the Hub.
    old, new, name = bump_script(path, add_bootstrap=(path.name != 'SakaLuX-Script-Hub.user.js'))
    versions[path.name] = new
    names[path.name] = name
    licenses[path.name] = metadata(path.read_text(encoding='utf-8'), 'license')
    print(f'{path.name}: {old} -> {new}')

# Synchronize the canonical registry with the bumped source versions.
registry_path = ROOT / 'scripts.json'
registry = json.loads(registry_path.read_text(encoding='utf-8'))
for item in registry.get('scripts', []):
    source = str(item.get('sourceUrl', ''))
    filename = source.rsplit('/', 1)[-1]
    if filename in versions:
        item['version'] = versions[filename]
registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Synchronize Hub fallback entries for every registered script.
hub_path = ROOT / 'SakaLuX-Script-Hub.user.js'
hub = hub_path.read_text(encoding='utf-8')
for item in registry.get('scripts', []):
    sid = str(item.get('id', ''))
    version = str(item.get('version', ''))
    if not sid or not version:
        continue
    pattern = re.compile(r"(id:\s*['\"]" + re.escape(sid) + r"['\"][\s\S]{0,500}?version:\s*['\"])([^'\"]+)(['\"])")
    hub, count = pattern.subn(rf'\g<1>{version}\g<3>', hub, count=1)
    if count == 0:
        print(f'WARNING: Hub fallback not found for {sid}')
hub_path.write_text(hub, encoding='utf-8')

# Update dedicated GreasyFork/info pages.
for script_file, doc_file in DOC_MAP.items():
    if script_file not in versions:
        continue
    update_doc(ROOT / doc_file, script_file, versions[script_file], names[script_file], licenses[script_file])

# Keep Script Hub info list versions synchronized for registered add-ons.
hub_info = ROOT / 'greasyfork/Script-Hub.md'
text = hub_info.read_text(encoding='utf-8')
for item in registry.get('scripts', []):
    name = str(item.get('name', '')).strip()
    version = str(item.get('version', '')).strip()
    if not name or not version:
        continue
    line_pat = re.compile(r'^(- .*SakaLuX ' + re.escape(name) + r' )\*\*v[^*]+\*\*', re.M)
    text = line_pat.sub(rf'\g<1>**v{version}**', text)
hub_info.write_text(text, encoding='utf-8')

print('Release synchronization complete.')
