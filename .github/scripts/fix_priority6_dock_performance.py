#!/usr/bin/env python3
from pathlib import Path

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
BEGIN = '/* SakaLuX Shared Dock Runtime — BEGIN */'
END = '/* SakaLuX Shared Dock Runtime — END */'

src = RUNTIME.read_text(encoding='utf-8')
src = src.replace("const VERSION = '1.0.0-test.2';", "const VERSION = '1.0.0-test.3';", 1)
src = src.replace(
    "  let observer = null;\n  let observerQueued = false;\n",
    "  let observer = null;\n  let observerQueued = false;\n  let runtimeSignalsBound = false;\n  let promptScheduled = false;\n",
    1,
)
src = src.replace(
    "  function bindRuntimeSignals() {\n    try {",
    "  function bindRuntimeSignals() {\n    if (runtimeSignalsBound) return;\n    runtimeSignalsBound = true;\n    try {",
    1,
)
src = src.replace(
    "    bindRuntimeSignals();\n    setTimeout(() => maybePrompt(), 1200);\n    return normalized;",
    "    bindRuntimeSignals();\n    if (!promptScheduled) {\n      promptScheduled = true;\n      Promise.resolve().then(() => maybePrompt());\n    }\n    return normalized;",
    1,
)
if "1.0.0-test.3" not in src or "runtimeSignalsBound" not in src or "Promise.resolve().then(() => maybePrompt())" not in src:
    raise SystemExit('Priority 6 performance patch anchors did not apply')
RUNTIME.write_text(src, encoding='utf-8')

runtime = src.rstrip()
for name in TARGETS:
    path = ROOT / name
    text = path.read_text(encoding='utf-8')
    start = text.find(BEGIN)
    end = text.find(END, start)
    if start < 0 or end < 0:
        raise SystemExit(f'{name}: shared dock runtime markers missing')
    end += len(END)
    replacement = BEGIN + '\n' + runtime + '\n' + END
    text = text[:start] + replacement + text[end:]
    path.write_text(text, encoding='utf-8')

print('Priority 6 dock runtime performance scheduling patched and re-embedded in 9 userscripts.')
