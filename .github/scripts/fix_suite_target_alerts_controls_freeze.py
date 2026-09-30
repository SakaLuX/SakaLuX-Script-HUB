#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
MARKER = '/* SakaLuX Target Alerts Controls Freeze Fix v0.9.964 */'
VERSION = '0.9.964'

s = SUITE.read_text(encoding='utf-8')

if MARKER not in s:
    old_m = re.search(r'(?m)^//\s*@version\s+(\S+)', s)
    if not old_m:
        raise SystemExit('Suite @version missing')
    old = old_m.group(1)
    s = re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', s, count=1)
    s = re.sub(
        r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(old) + r"(['\"]\s*;)",
        lambda m: m.group(1) + VERSION + m.group(2),
        s,
        count=1,
    )

    # Persist collapsed state outside the rebuilt DOM. This avoids fighting the
    # People-panel observer every time the toolbar body is hidden/shown.
    state_anchor = '    let activePeopleListType = null;'
    if state_anchor not in s:
        raise SystemExit('activePeopleListType anchor not found')
    s = s.replace(
        state_anchor,
        state_anchor + '\n    const peopleListCollapsed = { targets: false, enemies: false };',
        1,
    )

    old_back = '''        backButton.addEventListener("click", event => {\n            event.preventDefault();\n            event.stopPropagation();\n            activePeopleListType = null;\n            restoreNativePeoplePanel();\n            queueUiUpdate();\n        });'''
    new_back = '''        const isolateToolbarPointer = event => {\n            event.stopPropagation();\n            event.stopImmediatePropagation();\n        };\n        backButton.addEventListener("pointerdown", isolateToolbarPointer);\n        backButton.addEventListener("click", event => {\n            event.preventDefault();\n            event.stopPropagation();\n            event.stopImmediatePropagation();\n            backButton.disabled = true;\n            activePeopleListType = null;\n            // Defer restoration until Torn's current pointer/click dispatch is done.\n            // Calling queueUiUpdate here caused the People-panel observer to rebuild\n            // the custom panel while it was being restored, which could lock TornPDA.\n            setTimeout(() => {\n                restoreNativePeoplePanel();\n                backButton.disabled = false;\n            }, 0);\n        });'''
    if old_back not in s:
        raise SystemExit('Back button handler anchor not found')
    s = s.replace(old_back, new_back, 1)

    old_min = '''        minimizeButton.addEventListener("click", event => {\n            event.preventDefault();\n            event.stopPropagation();\n            const collapsed = contentWrap.hidden !== true;\n            contentWrap.hidden = collapsed;\n            panel.classList.toggle("sakalux-target-collapsed", collapsed);\n            minimizeButton.textContent = collapsed ? "+" : "−";\n            minimizeButton.title = collapsed ? "Expand list" : "Minimize list";\n            minimizeButton.setAttribute("aria-expanded", collapsed ? "false" : "true");\n        });'''
    new_min = '''        const applyCollapsedState = collapsed => {\n            peopleListCollapsed[type] = Boolean(collapsed);\n            contentWrap.style.display = collapsed ? "none" : "block";\n            panel.classList.toggle("sakalux-target-collapsed", collapsed);\n            minimizeButton.textContent = collapsed ? "+" : "−";\n            minimizeButton.title = collapsed ? "Expand list" : "Minimize list";\n            minimizeButton.setAttribute("aria-expanded", collapsed ? "false" : "true");\n        };\n        applyCollapsedState(Boolean(peopleListCollapsed[type]));\n        minimizeButton.addEventListener("pointerdown", isolateToolbarPointer);\n        minimizeButton.addEventListener("click", event => {\n            event.preventDefault();\n            event.stopPropagation();\n            event.stopImmediatePropagation();\n            applyCollapsedState(!peopleListCollapsed[type]);\n        });'''
    if old_min not in s:
        raise SystemExit('Minimize handler anchor not found')
    s = s.replace(old_min, new_min, 1)

    marker_anchor = '/* SakaLuX Target Alerts Controls+Status v0.9.963 */\n  function createTargetAlertsModule(context) {'
    if marker_anchor not in s:
        raise SystemExit('Target Alerts v0.9.963 marker anchor not found')
    s = s.replace(marker_anchor, marker_anchor.replace('\n  function', '\n' + MARKER + '\n  function'), 1)
    SUITE.write_text(s, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Target Alerts Back/Minimize freeze prevention on TornPDA'
    bullets = [
        'Removes the immediate queueUiUpdate call from Back restoration so TornPDA no longer rebuilds the custom People panel while it is being restored.',
        'Isolates pointer/click events from Torn delegated handlers with stopImmediatePropagation and defers Back restoration until the active click dispatch has completed.',
        'Stores Minimize/Expand state outside the rebuilt DOM and toggles the body directly, preventing observer-driven re-render loops while keeping the collapsed state stable.'
    ]
    block = '## Current release note\n\n**v' + VERSION + ' — ' + title + '**\n' + '\n'.join('- ' + x for x in bullets) + '\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', d)
    if m:
        d = d[:m.start()] + block.rstrip() + '\n' + d[m.end():]
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', d)
    version_pat = re.compile(rf'(?im)^###\s+v?{re.escape(VERSION)}(?:\s|—|-|$)')
    entry = '\n\n### v' + VERSION + ' — ' + title + '\n' + '\n'.join('- ' + x for x in bullets) + '\n'
    if heading and not version_pat.search(d):
        d = d[:heading.end()] + entry + d[heading.end():]
    DOC.write_text(d, encoding='utf-8')

print('Suite Target Alerts control freeze fix applied or already current.')
