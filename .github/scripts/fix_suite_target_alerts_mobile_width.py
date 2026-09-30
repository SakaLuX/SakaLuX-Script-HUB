#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
MARKER = '/* SakaLuX Target Alerts Mobile Width v0.9.962 */'
VERSION = '0.9.962'

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

    # The TornPDA People panel itself can keep a desktop width/offset even when our
    # custom list is responsive. Constrain the actual parent panel to the viewport.
    hover_anchor = '''            #${PEOPLE_PANEL_IDS.customPanel} .profile-button-attack:hover {\n                background: rgba(239,68,68,.16) !important;\n                border-color: rgba(239,68,68,.35) !important;\n            }'''
    responsive_css = hover_anchor + '''\n            #people_panel:has(#${PEOPLE_PANEL_IDS.customPanel}) {\n                box-sizing: border-box !important;\n                width: min(430px, calc(100vw - 12px)) !important;\n                max-width: calc(100vw - 12px) !important;\n                min-width: 0 !important;\n                left: auto !important;\n                right: 6px !important;\n                margin-left: 0 !important;\n                margin-right: 0 !important;\n                transform: none !important;\n                overflow: hidden !important;\n            }\n            #people_panel:has(#${PEOPLE_PANEL_IDS.customPanel}) > div,\n            #people_panel:has(#${PEOPLE_PANEL_IDS.customPanel}) [class*="content"] {\n                box-sizing: border-box !important;\n                max-width: 100% !important;\n                min-width: 0 !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} {\n                box-sizing: border-box !important;\n                width: 100% !important;\n                max-width: 100% !important;\n                min-width: 0 !important;\n                margin: 0 !important;\n                overflow: hidden !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} > * {\n                box-sizing: border-box !important;\n                max-width: 100% !important;\n                min-width: 0 !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} [id$="-user-list"] {\n                width: 100% !important;\n                max-width: 100% !important;\n                min-width: 0 !important;\n                overflow-x: hidden !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} [id$="-user-list"] > div > div {\n                display: flex !important;\n                align-items: center !important;\n                width: 100% !important;\n                max-width: 100% !important;\n                min-width: 0 !important;\n                overflow: hidden !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} div[class*="textContainer"] {\n                flex: 1 1 auto !important;\n                min-width: 0 !important;\n                max-width: none !important;\n                overflow: hidden !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} div[class*="actionContainer"] {\n                flex: 0 0 auto !important;\n                width: auto !important;\n                max-width: 88px !important;\n                min-width: 0 !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-status-name,\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-native-subtext {\n                width: 100% !important;\n                max-width: 100% !important;\n                min-width: 0 !important;\n            }'''
    if hover_anchor not in s:
        raise SystemExit('Target Alerts professional UI hover anchor not found')
    s = s.replace(hover_anchor, responsive_css, 1)

    # Extra-small phones need a denser action area so the status/attack controls do
    # not push the player name outside the visible viewport.
    mobile_anchor = '''                #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip {\n                    min-width: 42px !important;\n                    max-width: 58px !important;\n                    padding: 0 5px !important;\n                    font-size: 9px !important;\n                }'''
    mobile_repl = mobile_anchor + '''\n                #people_panel:has(#${PEOPLE_PANEL_IDS.customPanel}) {\n                    width: calc(100vw - 8px) !important;\n                    max-width: calc(100vw - 8px) !important;\n                    right: 4px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} {\n                    padding: 6px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} [id$="-user-list"] > div > div {\n                    padding: 6px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} a[data-label="avatar"] {\n                    width: 34px !important;\n                    min-width: 34px !important;\n                    max-width: 34px !important;\n                    margin-right: 7px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} a[data-label="avatar"] img {\n                    width: 30px !important;\n                    height: 30px !important;\n                    min-width: 30px !important;\n                    min-height: 30px !important;\n                    max-width: 30px !important;\n                    max-height: 30px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} div[class*="actionContainer"] {\n                    gap: 4px !important;\n                    max-width: 72px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip {\n                    min-width: 36px !important;\n                    max-width: 44px !important;\n                    height: 20px !important;\n                    padding: 0 4px !important;\n                    font-size: 8px !important;\n                }\n                #${PEOPLE_PANEL_IDS.customPanel} .profile-button-attack {\n                    width: 26px !important;\n                    height: 26px !important;\n                    min-width: 26px !important;\n                }'''
    if mobile_anchor not in s:
        raise SystemExit('Target Alerts mobile chip anchor not found')
    s = s.replace(mobile_anchor, mobile_repl, 1)

    marker_anchor = '/* SakaLuX Target Alerts Professional UI v0.9.961 */\n  function createTargetAlertsModule(context) {'
    if marker_anchor not in s:
        raise SystemExit('Target Alerts v0.9.961 marker anchor not found')
    s = s.replace(marker_anchor, marker_anchor.replace('\n  function', '\n' + MARKER + '\n  function'), 1)
    SUITE.write_text(s, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Target Alerts viewport containment and compact mobile rows'
    bullets = [
        'Constrains TornPDA\'s actual People panel to the phone viewport so Target/Enemy lists can no longer extend past the right edge of the screen.',
        'Makes row layout genuinely responsive with shrinkable text, fixed compact actions and full-width search/list containers.',
        'Adds a denser layout for narrow phones, reducing avatar, state-chip and attack-action footprints while preserving readable player names and descriptions.'
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

print('Suite Target Alerts mobile viewport containment applied or already current.')
