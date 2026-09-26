#!/usr/bin/env python3
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / 'src/core/sakalux-dock-runtime.js'
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


def extract_layer_suffix(body: str) -> str:
    markers = [
        "(() => {\n  const id='sakalux-standalone-layer-style'",
        "(()=>{const id='sakalux-standalone-layer-style'",
        '(() => {\n  const id="sakalux-standalone-layer-style"',
    ]
    starts = [body.rfind(m) for m in markers]
    start = max(starts)
    if start < 0:
        return ''
    suffix = body[start:].strip()
    # Preserve only the dedicated layer-style IIFE, which sits at the end of the legacy block.
    if not suffix.endswith('})();'):
        raise RuntimeError('Standalone layer-style suffix did not end cleanly')
    return suffix


def adapter(meta: dict, version: str) -> str:
    payload = json.dumps(meta, ensure_ascii=False, separators=(',', ':'))
    return f'''(() => {{
  'use strict';
  const SELF = Object.freeze(Object.assign({payload}, {{ version: {json.dumps(version)} }}));
  function openSelf() {{
    if (SELF.id === 'bazaar-smart-pricer') {{
      if (location.pathname !== '/bazaar.php') {{ location.href = SELF.fallback || 'https://www.torn.com/bazaar.php'; return; }}
      try {{ const api = window.SakaLuXBazaarSmartPricer; if (api && typeof api.open === 'function') {{ api.open(); return; }} }} catch {{}}
    }}
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

changed = []
for name in TARGETS:
    path = ROOT / name
    text = path.read_text(encoding='utf-8')
    if RUNTIME_BEGIN in text:
        # Already migrated: enforce no legacy block remains.
        if BEGIN in text or 'function ensureDock' in text:
            raise RuntimeError(f'{name}: mixed legacy/shared dock state')
        continue
    start = text.find(BEGIN)
    end = text.find(END, start)
    if start < 0 or end < 0:
        raise RuntimeError(f'{name}: legacy standalone dock block missing')
    end += len(END)
    body = text[start + len(BEGIN): end - len(END)]
    match = self_re.search(body)
    if not match:
        raise RuntimeError(f'{name}: SELF registration metadata not found')
    meta = json.loads(match.group(1))
    version = match.group(2)
    layer = extract_layer_suffix(body)
    replacement = '\n'.join([
        RUNTIME_BEGIN,
        runtime,
        RUNTIME_END,
        '',
        '/* SakaLuX Shared Dock Registration — BEGIN */',
        adapter(meta, version),
        '/* SakaLuX Shared Dock Registration — END */',
        *((['', layer]) if layer else []),
    ])
    text = text[:start] + replacement + text[end:]
    if text.count(RUNTIME_BEGIN) != 1 or text.count(RUNTIME_END) != 1:
        raise RuntimeError(f'{name}: runtime embedded more than once')
    if 'function ensureDock' in text[start:start + len(replacement) + 100]:
        raise RuntimeError(f'{name}: legacy ensureDock survived migration')
    path.write_text(text, encoding='utf-8')
    changed.append(name)

print(f'Priority 6 shared dock migration applied to {len(changed)} userscripts.')
for name in changed:
    print(' -', name)
