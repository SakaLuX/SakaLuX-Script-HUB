#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
MARKER = '/* SakaLuX Target Alerts Render Recovery v0.9.960 */'
VERSION = '0.9.960'

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

    # The first TornPDA isolation fix correctly scoped Target Alerts to #people_panel,
    # but the renderer could still start with an empty in-memory list. Rehydrate the
    # persisted list before clearing/rebuilding the custom panel so a route/UI rebuild
    # cannot leave a large blank panel.
    old_render = '''        panel.replaceChildren();\n        const players = playerLists[type]\n            .filter(player =>'''
    new_render = '''        const persistedPlayers = loadPlayerList(type);\n        if (persistedPlayers.length && (!Array.isArray(playerLists[type]) || !playerLists[type].length)) {\n            playerLists[type] = persistedPlayers;\n        }\n        const players = (Array.isArray(playerLists[type]) ? playerLists[type] : [])\n            .filter(player =>'''
    if old_render not in s:
        raise SystemExit('Target Alerts render-list anchor not found')
    s = s.replace(old_render, new_render, 1)

    # Clear only after the player source has been recovered.
    clear_anchor = '''            .sort((a, b) =>\n                a.name.localeCompare(\n                    b.name,\n                    undefined,\n                    { sensitivity: "base" }\n                )\n            );\n        let searchRoot;'''
    clear_repl = '''            .sort((a, b) =>\n                a.name.localeCompare(\n                    b.name,\n                    undefined,\n                    { sensitivity: "base" }\n                )\n            );\n        panel.replaceChildren();\n        let searchRoot;'''
    if clear_anchor not in s:
        raise SystemExit('Target Alerts post-sort anchor not found')
    s = s.replace(clear_anchor, clear_repl, 1)

    # Empty lists previously kept a zero-height inner element, so even the empty-state
    # text was clipped. Always give the empty state a visible row.
    old_empty = '''            if (!filtered.length) {\n                const empty = document.createElement("div");\n                empty.className = "sakalux-native-empty";\n                empty.style.height = "40px";'''
    new_empty = '''            if (!filtered.length) {\n                inner.style.height = "40px";\n                inner.style.minHeight = "40px";\n                const empty = document.createElement("div");\n                empty.className = "sakalux-native-empty";\n                empty.style.height = "40px";'''
    if old_empty not in s:
        raise SystemExit('Target Alerts empty-state anchor not found')
    s = s.replace(old_empty, new_empty, 1)

    # When rows exist, remove the temporary empty-state minimum height.
    rows_anchor = '''            filtered.forEach((player, index) => {\n                let row;'''
    rows_repl = '''            inner.style.minHeight = "0px";\n            filtered.forEach((player, index) => {\n                let row;'''
    if rows_anchor not in s:
        raise SystemExit('Target Alerts rows anchor not found')
    s = s.replace(rows_anchor, rows_repl, 1)

    # If no persisted rows exist yet, immediately ask the existing API poller to
    # populate Targets/Enemies. The poller re-renders this panel when it finishes.
    activation_anchor = '''        hideNativePeopleContent(host);\n        renderPeopleListPanel(type, host);\n    }\n    function cacheNativePeopleTemplate() {'''
    activation_repl = '''        hideNativePeopleContent(host);\n        renderPeopleListPanel(type, host);\n        if (!playerLists[type]?.length && isValidApiKey(syncSharedApiKey())) {\n            pollAllLists(true).catch(error => {\n                console.warn(`[${SCRIPT_NAME}] Could not refresh ${type} for People panel.`, error);\n            });\n        }\n    }\n    function cacheNativePeopleTemplate() {'''
    if activation_anchor not in s:
        raise SystemExit('Target Alerts activation anchor not found')
    s = s.replace(activation_anchor, activation_repl, 1)

    # Do not force a 400px blank custom panel when no rows are available.
    css_old = '''            #${PEOPLE_PANEL_IDS.customPanel} {\n                box-sizing: border-box;\n                width: 100%;\n                min-height: 400px;\n                overflow: hidden;\n            }'''
    css_new = '''            #${PEOPLE_PANEL_IDS.customPanel} {\n                box-sizing: border-box;\n                width: 100%;\n                min-height: 0;\n                overflow: hidden;\n            }'''
    if css_old not in s:
        raise SystemExit('Target Alerts custom-panel min-height anchor not found')
    s = s.replace(css_old, css_new, 1)

    module_anchor = '/* SakaLuX Target Alerts Mobile Isolation v0.9.959 */\n  function createTargetAlertsModule(context) {'
    if module_anchor not in s:
        raise SystemExit('Target Alerts module marker anchor not found')
    s = s.replace(module_anchor, module_anchor.replace('\n  function', '\n' + MARKER + '\n  function'), 1)
    SUITE.write_text(s, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Target Alerts saved-list render recovery on TornPDA'
    bullets = [
        'Rehydrates persisted Target/Enemy players before rebuilding the custom People panel so a UI or route refresh cannot leave the list blank.',
        'Makes the zero-player state visible instead of clipping it inside a zero-height list container, and removes the forced 400px empty panel.',
        'Triggers the existing Torn API list refresh when a selected Target/Enemy tab has no local rows, while retaining the v0.9.959 private-chat isolation and 32px avatar containment.'
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

print('Suite Target Alerts render recovery applied or already current.')
