#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
MARKER = '/* SakaLuX Target Alerts Controls+Status v0.9.963 */'
VERSION = '0.9.963'

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

    # 1) Replace raw UNKNOWN with a useful activity fallback, and show SYNC while
    # live status data is still being fetched.
    old_chip = '''            const stateChip = document.createElement("span");\n            stateChip.className = "sakalux-player-state-chip";\n            stateChip.dataset.state = String(statuses?.state || "Unknown").trim().toLowerCase();\n            stateChip.textContent = statuses?.state || "Unknown";'''
    new_chip = '''            const stateChip = document.createElement("span");\n            stateChip.className = "sakalux-player-state-chip";\n            const liveState = String(statuses?.state || "").trim();\n            const liveActivity = String(statuses?.activity || "").trim();\n            const displayState =\n                liveState && liveState.toLowerCase() !== "unknown"\n                    ? liveState\n                    : (liveActivity && liveActivity.toLowerCase() !== "unknown"\n                        ? liveActivity\n                        : "SYNC");\n            stateChip.dataset.state = displayState.toLowerCase();\n            stateChip.textContent = displayState;'''
    if old_chip not in s:
        raise SystemExit('Target Alerts state-chip anchor not found')
    s = s.replace(old_chip, new_chip, 1)

    # 2) Add a small control bar to the custom panel. Back restores Torn's native
    # People panel. Minimize keeps a compact header so the list can be expanded again.
    panel_clear = '''        panel.replaceChildren();\n        let searchRoot;'''
    panel_controls = '''        panel.replaceChildren();\n        const controls = document.createElement("div");\n        controls.className = "sakalux-target-panel-controls";\n\n        const backButton = document.createElement("button");\n        backButton.type = "button";\n        backButton.className = "sakalux-target-panel-control sakalux-target-back";\n        backButton.innerHTML = "← <span>Back</span>";\n        backButton.title = "Back to Torn People panel";\n        backButton.addEventListener("click", event => {\n            event.preventDefault();\n            event.stopPropagation();\n            activePeopleListType = null;\n            restoreNativePeoplePanel();\n            queueUiUpdate();\n        });\n\n        const title = document.createElement("strong");\n        title.className = "sakalux-target-panel-title";\n        title.textContent = `${LIST_TYPES[type].label} · ${players.length}`;\n\n        const minimizeButton = document.createElement("button");\n        minimizeButton.type = "button";\n        minimizeButton.className = "sakalux-target-panel-control sakalux-target-minimize";\n        minimizeButton.textContent = "−";\n        minimizeButton.title = "Minimize list";\n        minimizeButton.setAttribute("aria-expanded", "true");\n\n        controls.append(backButton, title, minimizeButton);\n        panel.appendChild(controls);\n        let searchRoot;'''
    if panel_clear not in s:
        raise SystemExit('Target Alerts panel-clear anchor not found')
    s = s.replace(panel_clear, panel_controls, 1)

    old_append = '''        panel.append(searchRoot, list);\n        function drawRows(query = "") {'''
    new_append = '''        const contentWrap = document.createElement("div");\n        contentWrap.className = "sakalux-target-panel-body";\n        contentWrap.append(searchRoot, list);\n        panel.appendChild(contentWrap);\n        minimizeButton.addEventListener("click", event => {\n            event.preventDefault();\n            event.stopPropagation();\n            const collapsed = contentWrap.hidden !== true;\n            contentWrap.hidden = collapsed;\n            panel.classList.toggle("sakalux-target-collapsed", collapsed);\n            minimizeButton.textContent = collapsed ? "+" : "−";\n            minimizeButton.title = collapsed ? "Expand list" : "Minimize list";\n            minimizeButton.setAttribute("aria-expanded", collapsed ? "false" : "true");\n        });\n\n        // Avatars are persisted separately from the list. Request any missing ones\n        // immediately when this panel is shown, rather than waiting for a later poll.\n        hydrateMissingAvatars(type).catch(error => {\n            console.warn(`[${SCRIPT_NAME}] Could not hydrate ${type} avatars.`, error);\n        });\n\n        // If the saved list has no live states yet, request a fresh API baseline.\n        const missingLiveStatus = players.some(player => {\n            const live = previousStatuses[type].get(player.id);\n            return !live || (!live.state && !live.activity) || String(live.state || "").toLowerCase() === "unknown";\n        });\n        if (missingLiveStatus && isValidApiKey(syncSharedApiKey()) && panel.dataset.sakaluxLiveStatusRequested !== "1") {\n            panel.dataset.sakaluxLiveStatusRequested = "1";\n            setTimeout(() => {\n                pollAllLists(true)\n                    .catch(error => console.warn(`[${SCRIPT_NAME}] Could not refresh ${type} status.`, error))\n                    .finally(() => { panel.dataset.sakaluxLiveStatusRequested = "0"; });\n            }, 80);\n        }\n\n        function drawRows(query = "") {'''
    if old_append not in s:
        raise SystemExit('Target Alerts panel append anchor not found')
    s = s.replace(old_append, new_append, 1)

    # 3) Add scoped toolbar/collapse styling and improve placeholder avatar treatment.
    css_anchor = '''            #${PEOPLE_PANEL_IDS.customPanel} .profile-button-attack:hover {\n                background: rgba(239,68,68,.16) !important;\n                border-color: rgba(239,68,68,.35) !important;\n            }'''
    css_extra = css_anchor + '''\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-target-panel-controls {\n                display: grid !important;\n                grid-template-columns: auto minmax(0,1fr) auto !important;\n                align-items: center !important;\n                gap: 8px !important;\n                width: 100% !important;\n                min-width: 0 !important;\n                margin: 0 0 8px !important;\n                padding: 0 0 8px !important;\n                border-bottom: 1px solid rgba(255,255,255,.08) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-target-panel-title {\n                min-width: 0 !important;\n                overflow: hidden !important;\n                text-overflow: ellipsis !important;\n                white-space: nowrap !important;\n                color: #e5edf7 !important;\n                font-size: 12px !important;\n                font-weight: 700 !important;\n                text-align: center !important;\n                letter-spacing: .2px !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-target-panel-control {\n                appearance: none !important;\n                border: 1px solid rgba(255,255,255,.11) !important;\n                background: rgba(255,255,255,.06) !important;\n                color: #eef4fb !important;\n                min-height: 32px !important;\n                height: 32px !important;\n                border-radius: 9px !important;\n                padding: 0 10px !important;\n                font-size: 11px !important;\n                font-weight: 700 !important;\n                line-height: 1 !important;\n                display: inline-flex !important;\n                align-items: center !important;\n                justify-content: center !important;\n                cursor: pointer !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-target-minimize {\n                width: 34px !important;\n                min-width: 34px !important;\n                padding: 0 !important;\n                font-size: 18px !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel}.sakalux-target-collapsed {\n                padding-bottom: 2px !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel}.sakalux-target-collapsed .sakalux-target-panel-controls {\n                margin-bottom: 0 !important;\n                border-bottom: 0 !important;\n                padding-bottom: 0 !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-target-panel-body[hidden] {\n                display: none !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip[data-state="sync"] {\n                color: #facc15 !important;\n                border-color: rgba(250,204,21,.30) !important;\n                background: rgba(250,204,21,.10) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip[data-state="online"] {\n                color: #86efac !important;\n                border-color: rgba(34,197,94,.32) !important;\n                background: rgba(34,197,94,.10) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip[data-state="idle"] {\n                color: #fde68a !important;\n                border-color: rgba(245,158,11,.32) !important;\n                background: rgba(245,158,11,.10) !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} .sakalux-player-state-chip[data-state="offline"] {\n                color: #94a3b8 !important;\n            }\n            #${PEOPLE_PANEL_IDS.customPanel} a[data-label="avatar"] img[src*="avatar-profile_man.jpg"] {\n                opacity: .56 !important;\n                filter: grayscale(.35) !important;\n            }'''
    if css_anchor not in s:
        raise SystemExit('Target Alerts hover CSS anchor not found')
    s = s.replace(css_anchor, css_extra, 1)

    marker_anchor = '/* SakaLuX Target Alerts Mobile Width v0.9.962 */\n  function createTargetAlertsModule(context) {'
    if marker_anchor not in s:
        raise SystemExit('Target Alerts v0.9.962 marker anchor not found')
    s = s.replace(marker_anchor, marker_anchor.replace('\n  function', '\n' + MARKER + '\n  function'), 1)
    SUITE.write_text(s, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Target Alerts navigation controls, avatar hydration and live status recovery'
    bullets = [
        'Adds Back and Minimize/Expand controls to the Target/Enemy People panel so the custom view is easy to dismiss or collapse on TornPDA.',
        'Hydrates missing player avatars as soon as the list opens instead of leaving generic silhouettes until a later background refresh.',
        'Replaces persistent UNKNOWN chips with live Torn state/activity where available and shows SYNC only while a fresh API baseline is being requested.'
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

print('Suite Target Alerts controls/status/avatar fix applied or already current.')
