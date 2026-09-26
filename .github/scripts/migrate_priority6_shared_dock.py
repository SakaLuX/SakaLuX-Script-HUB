#!/usr/bin/env python3
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / 'src/core/sakalux-dock-runtime.js'
REGISTRY = json.loads((ROOT / 'scripts.json').read_text(encoding='utf-8'))
TARGETS = [
    'SakaLuX-Enhancer-Guard.user.js',
    'SakaLuX-Bazaar-Thanker-PDA.user.js',
    'SakaLuX-Bazaar-Smart-Pricer.user.js',
    'SakaLuX-Mission-Rewards.user.js',
    'SakaLuX-Market-Intelligence.user.js',
    'SakaLuX-Elimination-Assistant.user.js',
    'SakaLuX-Company-Intelligence-v1.0.0.user.js',
    'SakaLuX-Stock-Manager-Advisor.user.js',
    'SakaLuX-Account-Auditor.user.js',
]
BEGIN = '/* SakaLuX Standalone Dock Bootstrap — BEGIN */'
END = '/* SakaLuX Standalone Dock Bootstrap — END */'
RUNTIME_BEGIN = '/* SakaLuX Shared Dock Runtime — BEGIN */'
RUNTIME_END = '/* SakaLuX Shared Dock Runtime — END */'

runtime = RUNTIME.read_text(encoding='utf-8').rstrip()
self_re = re.compile(r"const\s+SELF\s*=\s*Object\.assign\(\s*(\{.*?\})\s*,\s*\{\s*version\s*:\s*'([^']+)'\s*\}\s*\)\s*;", re.S)
header_version_re = re.compile(r'(?m)^//\s*@version\s+(\S+)')
api_global_by_id = {str(x.get('id')): str(x.get('apiGlobal') or '') for x in REGISTRY.get('scripts', [])}
META_OVERRIDES = {
    'SakaLuX-Account-Auditor.user.js': {
        'id': 'account-auditor', 'name': 'Auditor', 'icon': '🔎',
        'selector': '#sl-aa-button', 'fallback': 'https://www.torn.com/index.php'
    }
}


def extract_layer_suffix(body: str) -> str:
    markers = [
        "(() => {\n  const id='sakalux-standalone-layer-style'",
        "(()=>{const id='sakalux-standalone-layer-style'",
        '(() => {\n  const id="sakalux-standalone-layer-style"',
    ]
    start = max(body.rfind(m) for m in markers)
    if start < 0:
        return ''
    suffix = body[start:].strip()
    if not suffix.endswith('})();'):
        raise RuntimeError('Standalone layer-style suffix did not end cleanly')
    return suffix


def adapter(meta: dict, version: str, api_global: str) -> str:
    payload = json.dumps(meta, ensure_ascii=False, separators=(',', ':'))
    api_name = json.dumps(api_global)
    return f'''(() => {{
  'use strict';
  const SELF = Object.freeze(Object.assign({payload}, {{ version: {json.dumps(version)} }}));
  const API_GLOBAL = {api_name};
  function openSelf() {{
    if (SELF.id === 'bazaar-smart-pricer' && location.pathname !== '/bazaar.php') {{
      location.href = SELF.fallback || 'https://www.torn.com/bazaar.php';
      return;
    }}
    try {{
      const api = API_GLOBAL ? window[API_GLOBAL] : null;
      if (api && typeof api.open === 'function') {{ api.open(); return; }}
    }} catch {{}}
    const el = SELF.selector ? document.querySelector(SELF.selector) : null;
    if (el) {{ el.click(); return; }}
    const bridge = document.getElementById('sakalux-module-bridge-' + SELF.id);
    if (bridge) {{ bridge.dataset.action = 'open'; bridge.click(); return; }}
    if (SELF.fallback) location.href = SELF.fallback;
  }}
  function register() {{
    const dock = globalThis.SakaLuXDockRuntime;
    if (!dock || typeof dock.register !== 'function') throw new Error('SakaLuX Shared Dock Runtime is unavailable');
    dock.register({{ ...SELF, open: openSelf }});
  }}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register, {{ once: true }}); else register();
}})();'''


def sync_runtime_block(text: str) -> str:
    start = text.find(RUNTIME_BEGIN)
    end = text.find(RUNTIME_END, start)
    if start < 0 or end < 0:
        return text
    end += len(RUNTIME_END)
    return text[:start] + '\n'.join([RUNTIME_BEGIN, runtime, RUNTIME_END]) + text[end:]

changed = []
for name in TARGETS:
    path = ROOT / name
    text = path.read_text(encoding='utf-8')
    if RUNTIME_BEGIN in text:
        if BEGIN in text or 'function ensureDock' in text:
            raise RuntimeError(f'{name}: mixed legacy/shared dock state')
        synced = sync_runtime_block(text)
        if synced != text:
            path.write_text(synced, encoding='utf-8')
            changed.append(name)
        continue
    start = text.find(BEGIN)
    end = text.find(END, start)
    if start < 0 or end < 0:
        raise RuntimeError(f'{name}: legacy standalone dock block missing')
    end += len(END)
    body = text[start + len(BEGIN): end - len(END)]
    match = self_re.search(body)
    if match:
        meta = json.loads(match.group(1))
        version = match.group(2)
    elif name in META_OVERRIDES:
        meta = dict(META_OVERRIDES[name])
        hv = header_version_re.search(text)
        if not hv:
            raise RuntimeError(f'{name}: metadata version missing')
        version = hv.group(1)
    else:
        raise RuntimeError(f'{name}: SELF registration metadata not found')
    layer = extract_layer_suffix(body)
    replacement = '\n'.join([
        RUNTIME_BEGIN,
        runtime,
        RUNTIME_END,
        '',
        '/* SakaLuX Shared Dock Registration — BEGIN */',
        adapter(meta, version, api_global_by_id.get(str(meta.get('id')), '')),
        '/* SakaLuX Shared Dock Registration — END */',
        *((['', layer]) if layer else []),
    ])
    text = text[:start] + replacement + text[end:]
    if name == 'SakaLuX-Account-Auditor.user.js':
        text = re.sub(
            r'\n?/\* SAKALUX_GLOBAL_STANDALONE_ACCOUNT_AUDITOR \*/\s*\(\(\)=>\{.*?\}\)\(\);\s*',
            '\n', text, count=1, flags=re.S
        )
    if text.count(RUNTIME_BEGIN) != 1 or text.count(RUNTIME_END) != 1:
        raise RuntimeError(f'{name}: runtime embedded more than once')
    if 'function ensureDock' in text[start:start + len(replacement) + 100]:
        raise RuntimeError(f'{name}: legacy ensureDock survived migration')
    path.write_text(text, encoding='utf-8')
    changed.append(name)

print(f'Priority 6 shared dock migration/sync updated {len(changed)} userscripts.')
for name in changed:
    print(' -', name)
