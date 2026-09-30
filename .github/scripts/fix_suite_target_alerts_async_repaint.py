#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
MARKER = '/* SakaLuX Target Alerts Async Repaint v0.9.966 */'
VERSION = '0.9.966'

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

    old_sig = '''    function renderPeopleListPanel(type, host = null) {\n        const refreshGuardHost = host || document.getElementById("people_panel");\n        if (refreshGuardHost) {\n            const now = Date.now();\n            const last = Number(refreshGuardHost.dataset.sakaluxTargetLastRender || 0);\n            if (last && now - last < 1200) return;\n            refreshGuardHost.dataset.sakaluxTargetLastRender = String(now);\n        }'''
    new_sig = '''    function renderPeopleListPanel(type, host = null, force = false) {\n        const refreshGuardHost = host || document.getElementById("people_panel");\n        if (refreshGuardHost) {\n            const now = Date.now();\n            const last = Number(refreshGuardHost.dataset.sakaluxTargetLastRender || 0);\n            if (!force && last && now - last < 1200) return;\n            refreshGuardHost.dataset.sakaluxTargetLastRender = String(now);\n        }'''
    if old_sig not in s:
        raise SystemExit('v0.9.965 render guard anchor not found')
    s = s.replace(old_sig, new_sig, 1)

    old_avatar = '''            hydrateMissingAvatars(type).catch(error => {\n                console.warn(`[${SCRIPT_NAME}] Could not hydrate ${type} avatars.`, error);\n            });'''
    new_avatar = '''            hydrateMissingAvatars(type)\n                .then(() => {\n                    if (activePeopleListType === type && document.contains(panel)) {\n                        renderPeopleListPanel(type, host, true);\n                    }\n                })\n                .catch(error => {\n                    console.warn(`[${SCRIPT_NAME}] Could not hydrate ${type} avatars.`, error);\n                });'''
    if old_avatar not in s:
        raise SystemExit('v0.9.965 avatar hydration anchor not found')
    s = s.replace(old_avatar, new_avatar, 1)

    old_poll = '''                pollAllLists(true)\n                    .catch(error => console.warn(`[${SCRIPT_NAME}] Could not refresh ${type} status.`, error))\n                    .finally(() => { panel.dataset.sakaluxLiveStatusRequested = "0"; });'''
    new_poll = '''                pollAllLists(true)\n                    .then(() => {\n                        if (activePeopleListType === type && document.contains(panel)) {\n                            renderPeopleListPanel(type, host, true);\n                        }\n                    })\n                    .catch(error => console.warn(`[${SCRIPT_NAME}] Could not refresh ${type} status.`, error))\n                    .finally(() => { panel.dataset.sakaluxLiveStatusRequested = "0"; });'''
    if old_poll not in s:
        raise SystemExit('v0.9.965 live-status poll anchor not found')
    s = s.replace(old_poll, new_poll, 1)

    marker_anchor = '/* SakaLuX Target Alerts Refresh Guard v0.9.965 */\n'
    if marker_anchor not in s:
        raise SystemExit('v0.9.965 marker not found')
    s = s.replace(marker_anchor, marker_anchor + MARKER + '\n', 1)
    SUITE.write_text(s, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Target Alerts async avatar/status repaint recovery'
    bullets = [
        'Keeps the v0.9.965 observer throttle for performance but allows a forced data-driven repaint after asynchronous Target/Enemy data finishes loading.',
        'Repaints the panel immediately after avatar hydration completes so real player avatars replace placeholders without restarting the request loop.',
        'Repaints after the live status baseline finishes so SYNC is replaced by the returned Torn state/activity instead of remaining stuck.'
    ]
    block = '## Current release note\n\n**v' + VERSION + ' — ' + title + '**\n' + '\n'.join('- ' + x for x in bullets) + '\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', d)
    if m:
        d = d[:m.start()] + block.rstrip() + '\n' + d[m.end():]
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', d)
    if heading and not re.search(r'(?im)^###\s+v?0\.9\.966(?:\s|—|-|$)', d):
        entry = '\n\n### v0.9.966 — ' + title + '\n' + '\n'.join('- ' + x for x in bullets) + '\n'
        d = d[:heading.end()] + entry + d[heading.end():]
    DOC.write_text(d, encoding='utf-8')

print('Suite Target Alerts async repaint recovery applied or already current.')
