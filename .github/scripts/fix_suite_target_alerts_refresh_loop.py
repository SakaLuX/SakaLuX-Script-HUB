#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
MARKER = '/* SakaLuX Target Alerts Refresh Guard v0.9.965 */'
VERSION = '0.9.965'

s = SUITE.read_text(encoding='utf-8')

if MARKER not in s:
    old_m = re.search(r'(?m)^//\s*@version\s+(\S+)', s)
    if not old_m:
        raise SystemExit('Suite @version missing')
    old = old_m.group(1)
    s = re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', s, count=1)
    s = re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(old) + r"(['\"]\s*;)", lambda m: m.group(1)+VERSION+m.group(2), s, count=1)

    # Guard repeated DOM rebuilds caused by TornPDA/People-panel MutationObservers.
    sig = '    function renderPeopleListPanel(type, host = null) {'
    repl = '''    function renderPeopleListPanel(type, host = null) {\n        const refreshGuardHost = host || document.getElementById("people_panel");\n        if (refreshGuardHost) {\n            const now = Date.now();\n            const last = Number(refreshGuardHost.dataset.sakaluxTargetLastRender || 0);\n            if (last && now - last < 1200) return;\n            refreshGuardHost.dataset.sakaluxTargetLastRender = String(now);\n        }'''
    if sig not in s:
        raise SystemExit('renderPeopleListPanel signature not found')
    s = s.replace(sig, repl, 1)

    # Avatar hydration should not restart on every render.
    old_avatar = '''        hydrateMissingAvatars(type).catch(error => {\n            console.warn(`[${SCRIPT_NAME}] Could not hydrate ${type} avatars.`, error);\n        });'''
    new_avatar = '''        const avatarHydrateAt = Number(panel.dataset.sakaluxAvatarHydrateAt || 0);\n        if (!avatarHydrateAt || Date.now() - avatarHydrateAt > 60000) {\n            panel.dataset.sakaluxAvatarHydrateAt = String(Date.now());\n            hydrateMissingAvatars(type).catch(error => {\n                console.warn(`[${SCRIPT_NAME}] Could not hydrate ${type} avatars.`, error);\n            });\n        }'''
    if old_avatar not in s:
        raise SystemExit('avatar hydration anchor not found')
    s = s.replace(old_avatar, new_avatar, 1)

    # Live status baseline gets a real cooldown. v0.9.963 reset the flag after every
    # request, so each observer-driven render could immediately start another poll.
    old_poll = '''        if (missingLiveStatus && isValidApiKey(syncSharedApiKey()) && panel.dataset.sakaluxLiveStatusRequested !== "1") {\n            panel.dataset.sakaluxLiveStatusRequested = "1";\n            setTimeout(() => {\n                pollAllLists(true)\n                    .catch(error => console.warn(`[${SCRIPT_NAME}] Could not refresh ${type} status.`, error))\n                    .finally(() => { panel.dataset.sakaluxLiveStatusRequested = "0"; });\n            }, 80);\n        }'''
    new_poll = '''        const lastLiveRefresh = Number(panel.dataset.sakaluxLiveStatusAt || 0);\n        if (\n            missingLiveStatus &&\n            isValidApiKey(syncSharedApiKey()) &&\n            panel.dataset.sakaluxLiveStatusRequested !== "1" &&\n            (!lastLiveRefresh || Date.now() - lastLiveRefresh > 45000)\n        ) {\n            panel.dataset.sakaluxLiveStatusRequested = "1";\n            panel.dataset.sakaluxLiveStatusAt = String(Date.now());\n            setTimeout(() => {\n                pollAllLists(true)\n                    .catch(error => console.warn(`[${SCRIPT_NAME}] Could not refresh ${type} status.`, error))\n                    .finally(() => { panel.dataset.sakaluxLiveStatusRequested = "0"; });\n            }, 120);\n        }'''
    if old_poll not in s:
        raise SystemExit('live status poll anchor not found')
    s = s.replace(old_poll, new_poll, 1)

    marker_anchor = '/* SakaLuX Target Alerts Controls+Status v0.9.963 */\n'
    if marker_anchor not in s:
        # v0.9.964 marker may sit between 963 and module declaration; insert after 963.
        raise SystemExit('v0.9.963 marker not found')
    s = s.replace(marker_anchor, marker_anchor + MARKER + '\n', 1)
    SUITE.write_text(s, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Target Alerts refresh-loop and TornPDA performance guard'
    bullets = [
        'Throttles Target/Enemy panel DOM reconstruction so TornPDA MutationObservers cannot rebuild the list many times per second.',
        'Adds a 60-second avatar hydration cooldown instead of restarting avatar requests on every UI render.',
        'Adds a 45-second live-status refresh cooldown, preventing repeated pollAllLists API calls while status data is still missing or synchronizing.'
    ]
    block = '## Current release note\n\n**v' + VERSION + ' — ' + title + '**\n' + '\n'.join('- ' + x for x in bullets) + '\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', d)
    if m:
        d = d[:m.start()] + block.rstrip() + '\n' + d[m.end():]
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', d)
    if heading and not re.search(r'(?im)^###\s+v?0\.9\.965(?:\s|—|-|$)', d):
        entry = '\n\n### v0.9.965 — ' + title + '\n' + '\n'.join('- ' + x for x in bullets) + '\n'
        d = d[:heading.end()] + entry + d[heading.end():]
    DOC.write_text(d, encoding='utf-8')

print('Suite Target Alerts refresh guard applied or already current.')
