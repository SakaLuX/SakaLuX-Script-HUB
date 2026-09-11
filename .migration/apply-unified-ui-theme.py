from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / 'SakaLuX-Script-Hub.user.js'
DOC = ROOT / 'greasyfork' / 'Script-Hub.md'

hub = HUB.read_text(encoding='utf-8')

# Bump Hub only. The managed add-ons keep their own versions because this is a
# central visual theme layer and does not alter their runtime logic.
hub = re.sub(r'(^// @version\s+)1\.9\.5(\s*$)', r'\g<1>1.9.6\2', hub, count=1, flags=re.M)
hub = hub.replace("const VERSION = '1.9.5';", "const VERSION = '1.9.6';", 1)

release = """        {
            version: '1.9.6',
            date: '2026-09-11',
            changes: [
                'Added one unified SakaLuX Control Center visual theme for all current SakaLuX script interfaces.',
                'Standardized dark panels, borders, buttons, fields, cards, overlays and mobile spacing across Hub add-ons.',
                'Converted compatible prefixed settings checkboxes to the same sliding-switch visual language used by Hub.',
                'Includes visual support for Account Auditor and Suite when they are installed, without registering either standalone tool in Hub.',
                'The theme is CSS-only for external module panels and does not change their feature logic or saved data.'
            ]
        },
"""
marker = "    const HUB_CHANGELOG = [\n"
if "version: '1.9.6'" not in hub:
    if marker not in hub:
        raise SystemExit('HUB_CHANGELOG marker not found')
    hub = hub.replace(marker, marker + release, 1)

THEME = r'''
/* SakaLuX Unified Control Center theme ------------------------------------ */
/* Visual-only layer for all SakaLuX interfaces. Standalone tools remain
   standalone: these selectors do not register them in Hub or alter logic. */
:where(
 [id^="sl-eg-"],[class*="sl-eg-"],
 [id^="sakalux-bt-"],[class*="sakalux-bt-"],
 [id^="sl-mr-"],[class*="sl-mr-"],[id^="sl-mri-"],[class*="sl-mri-"],
 [id^="sl-mi-"],[class*="sl-mi-"],
 [id^="slx-elim-"],[class*="slx-elim-"],
 [id^="sl-aa-"],[class*="sl-aa-"],
 [id*="sakalux-suite" i],[class*="sakalux-suite" i],
 [id*="master-control" i],[class*="master-control" i]
){font-family:Inter,Arial,sans-serif!important;box-sizing:border-box}

/* Main panels, settings windows, modals and detail surfaces */
:where(
 [id^="sl-eg-"][id*="panel" i],[id^="sl-eg-"][id*="settings" i],[id^="sl-eg-"][id*="modal" i],[id^="sl-eg-"][id*="details" i],
 [id^="sakalux-bt-"][id*="panel" i],[id^="sakalux-bt-"][id*="settings" i],[id^="sakalux-bt-"][id*="modal" i],[id^="sakalux-bt-"][id*="details" i],
 [id^="sl-mr-"][id*="panel" i],[id^="sl-mr-"][id*="settings" i],[id^="sl-mr-"][id*="modal" i],[id^="sl-mri-"][id*="panel" i],
 [id^="sl-mi-"][id*="panel" i],[id^="sl-mi-"][id*="settings" i],[id^="sl-mi-"][id*="modal" i],[id^="sl-mi-"][id*="details" i],
 [id^="slx-elim-"][id*="panel" i],[id^="slx-elim-"][id*="settings" i],[id^="slx-elim-"][id*="modal" i],[id^="slx-elim-"][id*="details" i],
 [id^="sl-aa-"][id*="panel" i],[id^="sl-aa-"][id*="settings" i],[id^="sl-aa-"][id*="modal" i],
 [id*="sakalux-suite" i][id*="panel" i],[id*="sakalux-suite" i][id*="control" i],[id*="master-control" i]
){
 background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%)!important;
 color:#e7edf5!important;border:1px solid #314154!important;border-radius:16px!important;
 box-shadow:0 18px 52px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.025)!important;
}

/* Backdrops */
:where(
 [id^="sl-eg-"][id*="overlay" i],[id^="sakalux-bt-"][id*="overlay" i],
 [id^="sl-mr-"][id*="overlay" i],[id^="sl-mi-"][id*="overlay" i],
 [id^="slx-elim-"][id*="overlay" i],[id^="sl-aa-"][id*="overlay" i],
 [id*="sakalux-suite" i][id*="overlay" i]
){background:rgba(4,8,13,.84)!important;backdrop-filter:blur(6px)!important}

/* Headers and title bars */
:where(
 [class*="sl-eg-"][class*="header" i],[id^="sl-eg-"][id*="header" i],
 [class*="sakalux-bt-"][class*="header" i],[id^="sakalux-bt-"][id*="header" i],
 [class*="sl-mr-"][class*="header" i],[id^="sl-mr-"][id*="header" i],
 [class*="sl-mi-"][class*="header" i],[id^="sl-mi-"][id*="header" i],
 [class*="slx-elim-"][class*="header" i],[id^="slx-elim-"][id*="header" i],
 [class*="sl-aa-"][class*="header" i],[id^="sl-aa-"][id*="header" i],
 [class*="sakalux-suite" i][class*="header" i],[id*="sakalux-suite" i][id*="header" i]
){background:linear-gradient(155deg,#1b2634,#111923)!important;border-color:#314154!important;color:#f8fafc!important}

/* Cards, rows, sections and information blocks */
:where(
 [class*="sl-eg-"][class*="card" i],[class*="sl-eg-"][class*="row" i],[class*="sl-eg-"][class*="section" i],[class*="sl-eg-"][class*="note" i],
 [class*="sakalux-bt-"][class*="card" i],[class*="sakalux-bt-"][class*="row" i],[class*="sakalux-bt-"][class*="section" i],[class*="sakalux-bt-"][class*="note" i],
 [class*="sl-mr-"][class*="card" i],[class*="sl-mr-"][class*="row" i],[class*="sl-mr-"][class*="section" i],[class*="sl-mr-"][class*="note" i],
 [class*="sl-mi-"][class*="card" i],[class*="sl-mi-"][class*="row" i],[class*="sl-mi-"][class*="section" i],[class*="sl-mi-"][class*="note" i],
 [class*="slx-elim-"][class*="card" i],[class*="slx-elim-"][class*="row" i],[class*="slx-elim-"][class*="section" i],[class*="slx-elim-"][class*="note" i],
 [class*="sl-aa-"][class*="card" i],[class*="sl-aa-"][class*="row" i],[class*="sl-aa-"][class*="section" i],[class*="sl-aa-"][class*="note" i],
 [class*="sakalux-suite" i][class*="card" i],[class*="sakalux-suite" i][class*="row" i],[class*="sakalux-suite" i][class*="section" i]
){background:linear-gradient(145deg,#18212d,#131b25)!important;border-color:#2d3c4e!important;border-radius:12px!important;color:#dce6f0!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}

/* Buttons */
:where(
 button[id^="sl-eg-"],button[class*="sl-eg-"],
 button[id^="sakalux-bt-"],button[class*="sakalux-bt-"],
 button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"],
 button[id^="sl-mi-"],button[class*="sl-mi-"],
 button[id^="slx-elim-"],button[class*="slx-elim-"],
 button[id^="sl-aa-"],button[class*="sl-aa-"],
 button[id*="sakalux-suite" i],button[class*="sakalux-suite" i],button[id*="master-control" i]
){border:1px solid #3d78bf!important;border-radius:10px!important;background:linear-gradient(180deg,#377fcf,#275f9f)!important;color:#fff!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,filter .12s ease!important}
:where(
 button[id^="sl-eg-"],button[class*="sl-eg-"],button[id^="sakalux-bt-"],button[class*="sakalux-bt-"],
 button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mi-"],button[class*="sl-mi-"],
 button[id^="slx-elim-"],button[class*="slx-elim-"],button[id^="sl-aa-"],button[class*="sl-aa-"]
):active{transform:translateY(1px)!important}
:where(
 button[id*="close" i],button[class*="close" i],button[id*="back" i],button[class*="gray" i],button[class*="secondary" i]
){background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}
:where(
 button[id*="clear" i],button[id*="reset" i],button[id*="delete" i],button[class*="danger" i],button[class*="red" i]
){background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}

/* Inputs and selects */
:where(
 [id^="sl-eg-"] input,[id^="sl-eg-"] select,[id^="sl-eg-"] textarea,
 [id^="sakalux-bt-"] input,[id^="sakalux-bt-"] select,[id^="sakalux-bt-"] textarea,
 [id^="sl-mr-"] input,[id^="sl-mr-"] select,[id^="sl-mr-"] textarea,
 [id^="sl-mi-"] input,[id^="sl-mi-"] select,[id^="sl-mi-"] textarea,
 [id^="slx-elim-"] input,[id^="slx-elim-"] select,[id^="slx-elim-"] textarea,
 [id^="sl-aa-"] input,[id^="sl-aa-"] select,[id^="sl-aa-"] textarea,
 [id*="sakalux-suite" i] input,[id*="sakalux-suite" i] select,[id*="sakalux-suite" i] textarea,
 input[id^="sl-eg-"],select[id^="sl-eg-"],textarea[id^="sl-eg-"],
 input[id^="sakalux-bt-"],select[id^="sakalux-bt-"],textarea[id^="sakalux-bt-"],
 input[id^="sl-mr-"],select[id^="sl-mr-"],textarea[id^="sl-mr-"],
 input[id^="sl-mi-"],select[id^="sl-mi-"],textarea[id^="sl-mi-"],
 input[id^="slx-elim-"],select[id^="slx-elim-"],textarea[id^="slx-elim-"],
 input[id^="sl-aa-"],select[id^="sl-aa-"],textarea[id^="sl-aa-"]
){background:#0d141d!important;border:1px solid #3a4b61!important;border-radius:9px!important;color:#f4f7fb!important;outline:none!important}

/* Sliding toggles for compatible settings checkboxes */
:where(
 input[type="checkbox"][id^="sl-eg-"],input[type="checkbox"][id^="sakalux-bt-"],
 input[type="checkbox"][id^="sl-mr-"],input[type="checkbox"][id^="sl-mri-"],
 input[type="checkbox"][id^="sl-mi-"],input[type="checkbox"][id^="slx-elim-"],
 input[type="checkbox"][id^="sl-aa-"],input[type="checkbox"][id*="sakalux-suite" i]
){appearance:none!important;-webkit-appearance:none!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0 8px 0 0!important;vertical-align:middle!important;border:1px solid #546276!important;border-radius:999px!important;background:radial-gradient(circle at 10px 50%,#e7edf5 0 6px,transparent 6.5px),#465365!important;cursor:pointer!important;transition:.18s ease!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)!important}
:where(
 input[type="checkbox"][id^="sl-eg-"],input[type="checkbox"][id^="sakalux-bt-"],
 input[type="checkbox"][id^="sl-mr-"],input[type="checkbox"][id^="sl-mri-"],
 input[type="checkbox"][id^="sl-mi-"],input[type="checkbox"][id^="slx-elim-"],
 input[type="checkbox"][id^="sl-aa-"],input[type="checkbox"][id*="sakalux-suite" i]
):checked{border-color:#24754f!important;background:radial-gradient(circle at 27px 50%,#fff 0 6px,transparent 6.5px),#1eb36a!important}

/* Headings and muted copy */
:where(
 [class*="sl-eg-"][class*="title" i],[class*="sakalux-bt-"][class*="title" i],
 [class*="sl-mr-"][class*="title" i],[class*="sl-mi-"][class*="title" i],
 [class*="slx-elim-"][class*="title" i],[class*="sl-aa-"][class*="title" i],
 [class*="sakalux-suite" i][class*="title" i]
){color:#f8fafc!important;font-weight:900!important}
:where(
 [class*="sl-eg-"][class*="muted" i],[class*="sakalux-bt-"][class*="muted" i],
 [class*="sl-mr-"][class*="muted" i],[class*="sl-mi-"][class*="muted" i],
 [class*="slx-elim-"][class*="muted" i],[class*="sl-aa-"][class*="muted" i],
 [class*="sakalux-suite" i][class*="muted" i]
){color:#8799ad!important}

@media(max-width:520px){
 :where(
  [id^="sl-eg-"][id*="panel" i],[id^="sakalux-bt-"][id*="settings" i],
  [id^="sl-mr-"][id*="panel" i],[id^="sl-mi-"][id*="panel" i],
  [id^="slx-elim-"][id*="panel" i],[id^="sl-aa-"][id*="panel" i],
  [id*="sakalux-suite" i][id*="panel" i],[id*="master-control" i]
 ){border-radius:15px 15px 0 0!important}
 :where(
  button[id^="sl-eg-"],button[class*="sl-eg-"],button[id^="sakalux-bt-"],button[class*="sakalux-bt-"],
  button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mi-"],button[class*="sl-mi-"],
  button[id^="slx-elim-"],button[class*="slx-elim-"],button[id^="sl-aa-"],button[class*="sl-aa-"]
 ){min-height:34px!important;font-size:9px!important}
}
/* End unified theme ------------------------------------------------------- */
'''

if 'SakaLuX Unified Control Center theme' not in hub:
    anchor = "\n        `;\n        document.head.appendChild(style);"
    if anchor not in hub:
        raise SystemExit('Hub CSS insertion anchor not found')
    hub = hub.replace(anchor, '\n' + THEME + anchor, 1)

HUB.write_text(hub, encoding='utf-8')

# Synchronize Hub documentation.
doc = DOC.read_text(encoding='utf-8')
doc = re.sub(r'(## Current version\s+\n\*\*v)1\.9\.5(\*\*)', r'\g<1>1.9.6\2', doc, count=1)
notes_marker = '## Current release notes\n\n'
notes = """### v1.9.6

- Added a unified **SakaLuX Control Center** visual layer across current SakaLuX interfaces.
- Standardized dark surfaces, borders, cards, buttons, fields and responsive spacing for Enhancer Guard, Bazaar Thanker, Mission Rewards, Market Intelligence and Elimination Assistant.
- Compatible prefixed settings checkboxes now use the same sliding-switch visual language as Hub.
- The same visual layer also recognizes **Account Auditor** and **SakaLuX Suite** when installed, while both remain completely standalone and absent from the Hub registry.
- This release changes presentation only for external module panels; module logic, APIs and saved data are unchanged.

"""
if '### v1.9.6' not in doc:
    if notes_marker not in doc:
        raise SystemExit('Documentation release-notes marker not found')
    doc = doc.replace(notes_marker, notes_marker + notes, 1)
DOC.write_text(doc, encoding='utf-8')

print('Unified SakaLuX UI theme applied to Hub v1.9.6 and docs.')
