#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
MARKER = '/* SakaLuX Target Alerts Professional UI v0.9.961 */'
VERSION = '0.9.961'

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

    # Increase row height for a clean mobile-friendly layout.
    s = s.replace('row.style.height = "40px";\n        row.style.transform =\n            `translateY(${index * 40}px)`;',
                  'row.style.height = "54px";\n        row.style.transform =\n            `translateY(${index * 54}px)`;', 1)
    s = s.replace('`${filtered.length * 40}px`;', '`${filtered.length * 54}px`;', 1)

    # Add a compact state chip next to the attack button.
    old_action = '''        if (actionContainer) {\n            actionContainer.replaceChildren();\n            const attackIcon = createListActionIcon(\n                type,\n                sampleRow,\n                `${suffix}_attack`,\n                player.id\n            );\n            actionContainer.append(\n                attackIcon\n            );\n        }'''
    new_action = '''        if (actionContainer) {\n            actionContainer.replaceChildren();\n            const stateChip = document.createElement("span");\n            stateChip.className = "sakalux-player-state-chip";\n            stateChip.dataset.state = String(statuses?.state || "Unknown").trim().toLowerCase();\n            stateChip.textContent = statuses?.state || "Unknown";\n            const attackIcon = createListActionIcon(\n                type,\n                sampleRow,\n                `${suffix}_attack`,\n                player.id\n            );\n            actionContainer.append(\n                stateChip,\n                attackIcon\n            );\n        }'''
    if old_action not in s:
        raise SystemExit('Target Alerts action-container anchor not found')
    s = s.replace(old_action, new_action, 1)

    # Append a scoped visual layer. It deliberately avoids Torn hashed class names.
    css_anchor = '''            #${PEOPLE_PANEL_IDS.customPanel} a[data-label="avatar"] img {\n                width: 32px !important;\n                height: 32px !important;\n                min-width: 32px !important;\n                min-height: 32px !important;\n                max-width: 32px !important;\n                max-height: 32px !important;\n                object-fit: cover !important;\n                border-radius: 50% !important;\n            }'''
    css_extra = css_anchor + '''\n            #${PEOPLE_PANEL_IDS.customPanel} {\n                padding: 10px !important;\n                border-radius: 14px !important;\n                background: rgba(15, 23, 32, .96) !important;\n                border: 1px solid rgba(255,255,255,.08) !important;\n                box-shadow: 0 12px 30px rgba(0,0,0,.28) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} input[placeholder="Search by player name"] {\n                width: 100% !important;\n                height: 42px !important;\n                padding: 0 42px 0 14px !important;\n                border-radius: 11px !important;\n                border: 1px solid rgba(255,255,255,.12) !important;\n                background: rgba(255,255,255,.055) !important;\n                color: #f5f7fa !important;\n                font-size: 14px !important;\n                outline: none !important;\n                box-shadow: none !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} input[placeholder="Search by player name"]:focus {\n                border-color: rgba(59,130,246,.75) !important;\n                background: rgba(255,255,255,.075) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} [id$="-user-list"] {\n                margin-top: 9px !important;\n                border: 1px solid rgba(255,255,255,.07) !important;\n                border-radius: 12px !important;\n                background: rgba(4,10,16,.38) !important;\n                scrollbar-width: thin !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} [id$="-user-list"] > div > div {\n                min-height: 54px !important;\n                height: 54px !important;\n                padding: 7px 9px !important;\n                border-bottom: 1px solid rgba(255,255,255,.055) !important;\n                background: transparent !important;\n                transition: background .15s ease !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} [id$="-user-list"] > div > div:hover {\n                background: rgba(255,255,255,.045) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} [id$="-user-list"] > div > div:last-child {\n                border-bottom: 0 !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} a[data-label="avatar"] {\n                margin-right: 9px !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} a[data-label="avatar"] img {\n                border: 1px solid rgba(255,255,255,.14) !important;\n                background: rgba(255,255,255,.06) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-status-name {\n                color: #f5f7fa !important;\n                font-weight: 700 !important;\n                font-size: 14px !important;\n                line-height: 18px !important;\n                text-decoration: none !important;\n                max-width: 175px !important;\n                overflow: hidden !important;\n                text-overflow: ellipsis !important;\n                white-space: nowrap !important;\n                display: block !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-native-subtext {\n                margin: 1px 0 0 !important;\n                color: rgba(225,231,239,.58) !important;\n                font-size: 12px !important;\n                line-height: 16px !important;\n                max-width: 190px !important;\n                overflow: hidden !important;\n                text-overflow: ellipsis !important;\n                white-space: nowrap !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} div[class*="actionContainer"] {\n                display: flex !important;\n                align-items: center !important;\n                justify-content: flex-end !important;\n                gap: 7px !important;\n                margin-left: auto !important;\n                min-width: 92px !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip {\n                display: inline-flex !important;\n                align-items: center !important;\n                justify-content: center !important;\n                min-width: 50px !important;\n                max-width: 72px !important;\n                height: 22px !important;\n                padding: 0 7px !important;\n                border-radius: 999px !important;\n                border: 1px solid rgba(148,163,184,.26) !important;\n                background: rgba(148,163,184,.10) !important;\n                color: #cbd5e1 !important;\n                font-size: 10px !important;\n                font-weight: 700 !important;\n                line-height: 1 !important;\n                white-space: nowrap !important;\n                overflow: hidden !important;\n                text-overflow: ellipsis !important;\n                text-transform: uppercase !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip[data-state="okay"] {\n                color: #86efac !important;\n                border-color: rgba(34,197,94,.35) !important;\n                background: rgba(34,197,94,.12) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip[data-state="hospital"] {\n                color: #fda4af !important;\n                border-color: rgba(244,63,94,.35) !important;\n                background: rgba(244,63,94,.12) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip[data-state="traveling"],\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip[data-state="abroad"] {\n                color: #93c5fd !important;\n                border-color: rgba(59,130,246,.35) !important;\n                background: rgba(59,130,246,.12) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .profile-button-attack {\n                width: 30px !important;\n                height: 30px !important;\n                min-width: 30px !important;\n                border-radius: 9px !important;\n                color: #f1f5f9 !important;\n                background: rgba(255,255,255,.07) !important;\n                border: 1px solid rgba(255,255,255,.09) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .profile-button-attack:hover {\n                background: rgba(239,68,68,.16) !important;\n                border-color: rgba(239,68,68,.35) !important;\n            }\n            @media (max-width: 460px) {\n                #${PEOPLE_PANEL_IDS.customPanel} {\n                    padding: 8px !important;\n                    border-radius: 12px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} .sakalux-status-name {\n                    max-width: 135px !important;\n                    font-size: 13px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} .sakalux-native-subtext {\n                    max-width: 145px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} div[class*="actionContainer"] {\n                    min-width: 82px !important;\n                    gap: 5px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip {\n                    min-width: 42px !important;\n                    max-width: 58px !important;\n                    padding: 0 5px !important;\n                    font-size: 9px !important;\n                }\n            }'''
    if css_anchor not in s:
        raise SystemExit('Target Alerts professional UI CSS anchor not found')
    s = s.replace(css_anchor, css_extra, 1)

    marker_anchor = '/* SakaLuX Target Alerts Render Recovery v0.9.960 */\n  function createTargetAlertsModule(context) {'
    if marker_anchor not in s:
        raise SystemExit('Target Alerts v0.9.960 marker anchor not found')
    s = s.replace(marker_anchor, marker_anchor.replace('\n  function', '\n' + MARKER + '\n  function'), 1)
    SUITE.write_text(s, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Professional Target Alerts People-panel redesign'
    bullets = [
        'Reworks Target/Enemy rows into a compact 54px mobile layout with cleaner spacing, neutral dark surfaces and consistent typography.',
        'Adds a compact player-state pill beside the attack action, with distinct Okay, Hospital and travel states.',
        'Restyles search, list container, avatars, player names, descriptions and attack actions without depending on Torn hashed CSS class names.'
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

print('Suite Target Alerts professional UI polish applied or already current.')
