#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
MARKER = '/* SakaLuX Target Alerts Mobile Isolation v0.9.959 */'
VERSION = '0.9.959'

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

    # Scope Target/Enemy tab discovery strictly to Torn's People panel. The old
    # global selector could bind to the private-chat tab bar, which produced the
    # broken chat/Target Alerts behaviour seen on TornPDA.
    old_tabs = '''    function findPeopleTabBar() {\n        const nativeButtons = [\n            ...document.querySelectorAll('button[role="tab"][title]')\n        ];'''
    new_tabs = '''    function findPeopleTabBar() {\n        const peoplePanel = document.getElementById("people_panel");\n        if (!peoplePanel) return null;\n        const nativeButtons = [\n            ...peoplePanel.querySelectorAll('button[role="tab"][title]')\n        ];'''
    if old_tabs not in s:
        raise SystemExit('Target Alerts tab-bar anchor not found')
    s = s.replace(old_tabs, new_tabs, 1)

    # Keep cloned/native Torn rows contained. TornPDA class changes can otherwise
    # make an avatar inherit an unconstrained image rule and fill the whole panel.
    row_anchor = '''        row.style.left = "0px";\n        row.style.height = "40px";'''
    row_repl = '''        row.style.left = "0px";\n        row.style.width = "100%";\n        row.style.maxWidth = "100%";\n        row.style.boxSizing = "border-box";\n        row.style.overflow = "hidden";\n        row.style.height = "40px";'''
    if row_anchor not in s:
        raise SystemExit('Target Alerts row geometry anchor not found')
    s = s.replace(row_anchor, row_repl, 1)

    image_anchor = '''            image.onerror = () => {'''
    image_repl = '''            image.style.setProperty("width", "32px", "important");\n            image.style.setProperty("height", "32px", "important");\n            image.style.setProperty("max-width", "32px", "important");\n            image.style.setProperty("max-height", "32px", "important");\n            image.style.setProperty("object-fit", "cover", "important");\n            image.style.setProperty("border-radius", "50%", "important");\n            image.onerror = () => {'''
    if image_anchor not in s:
        raise SystemExit('Target Alerts avatar anchor not found')
    s = s.replace(image_anchor, image_repl, 1)

    css_anchor = '''            #${PEOPLE_PANEL_IDS.customPanel} {\n                box-sizing: border-box;\n                width: 100%;\n                min-height: 400px;\n                overflow: hidden;\n            }'''
    css_repl = css_anchor + '''\n            #${PEOPLE_PANEL_IDS.customPanel} [id$="-user-list"] {\n                position: relative !important;\n                width: 100% !important;\n                max-width: 100% !important;\n                max-height: min(56vh, 420px) !important;\n                overflow-x: hidden !important;\n                overflow-y: auto !important;\n                box-sizing: border-box !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} [id$="-user-list"] > div {\n                position: relative !important;\n                width: 100% !important;\n                max-width: 100% !important;\n                box-sizing: border-box !important;\n                overflow: hidden !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} a[data-label="avatar"] {\n                width: 36px !important;\n                min-width: 36px !important;\n                max-width: 36px !important;\n                height: 36px !important;\n                min-height: 36px !important;\n                max-height: 36px !important;\n                display: inline-flex !important;\n                align-items: center !important;\n                justify-content: center !important;\n                overflow: hidden !important;\n                flex: 0 0 36px !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} a[data-label="avatar"] img {\n                width: 32px !important;\n                height: 32px !important;\n                min-width: 32px !important;\n                min-height: 32px !important;\n                max-width: 32px !important;\n                max-height: 32px !important;\n                object-fit: cover !important;\n                border-radius: 50% !important;\n            }'''
    if css_anchor not in s:
        raise SystemExit('Target Alerts custom-panel CSS anchor not found')
    s = s.replace(css_anchor, css_repl, 1)

    panel_anchor = '''            panel.id = PEOPLE_PANEL_IDS.customPanel;\n            host.appendChild(panel);\n        }\n        panel.replaceChildren();'''
    panel_repl = '''            panel.id = PEOPLE_PANEL_IDS.customPanel;\n            host.appendChild(panel);\n        }\n        if (panel.dataset.sakaluxTargetIsolationBound !== "1") {\n            panel.dataset.sakaluxTargetIsolationBound = "1";\n            panel.addEventListener("mouseover", event => event.stopPropagation());\n            panel.addEventListener("pointerover", event => event.stopPropagation());\n        }\n        panel.replaceChildren();'''
    if panel_anchor not in s:
        raise SystemExit('Target Alerts custom-panel render anchor not found')
    s = s.replace(panel_anchor, panel_repl, 1)

    # Marker lives by the module declaration so the fix is idempotent.
    module_anchor = '  function createTargetAlertsModule(context) {'
    if module_anchor not in s:
        raise SystemExit('Target Alerts module anchor not found')
    s = s.replace(module_anchor, MARKER + '\n' + module_anchor, 1)
    SUITE.write_text(s, encoding='utf-8')

# Reassert the detailed release note after the generic standalone-doc synchronizer
# runs. This is intentionally idempotent so future workflow runs keep the real
# changelog details instead of replacing them with a generic synchronization note.
if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Target Alerts People-panel isolation and TornPDA avatar containment'
    bullets = [
        'Scopes Target/Enemy tab discovery to Torn\'s actual #people_panel so Target Alerts can no longer attach to the private-chat tab bar.',
        'Constrains Target Alerts player rows and avatars on TornPDA so a player image cannot expand across the whole People panel.',
        'Stops custom Target/Enemy list hover events from leaking into Torn\'s native delegated profile-preview handlers while preserving normal links and list actions.'
    ]
    block = '## Current release note\n\n**v' + VERSION + ' — ' + title + '**\n' + '\n'.join('- ' + x for x in bullets) + '\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', d)
    if m:
        d = d[:m.start()] + block.rstrip() + '\n' + d[m.end():]
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', d)
    version_pat = re.compile(rf'(?im)^###\s+v?{re.escape(VERSION)}(?:\s|—|-|$)')
    if heading and not version_pat.search(d):
        entry = '\n\n### v' + VERSION + ' — ' + title + '\n' + '\n'.join('- ' + x for x in bullets) + '\n'
        d = d[:heading.end()] + entry + d[heading.end():]
    elif version_pat.search(d):
        # Replace any generic current-version history entry with the detailed one.
        vm = version_pat.search(d)
        nextm = re.search(r'(?im)^###\s+v?[0-9]+(?:\.[0-9]+){1,3}(?:\s|—|-|$)', d[vm.end():])
        end = vm.end() + nextm.start() if nextm else len(d)
        entry = '### v' + VERSION + ' — ' + title + '\n' + '\n'.join('- ' + x for x in bullets) + '\n\n'
        d = d[:vm.start()] + entry + d[end:]
    DOC.write_text(d, encoding='utf-8')

print('Suite Target Alerts mobile isolation fix applied or already current.')
