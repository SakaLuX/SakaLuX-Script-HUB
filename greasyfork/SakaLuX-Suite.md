# SakaLuX Suite [EXPERIMENTAL]

SakaLuX Suite is an experimental one-install modular master control for the SakaLuX Torn script ecosystem.

## Current version

**v0.2.0**

## Status

**EXPERIMENTAL MODULAR SUITE**

The existing standalone SakaLuX scripts are not removed, replaced or modified by this test build.

## What this prototype does

- Adds one central **SakaLuX Suite** Master Control panel.
- Detects the existing standalone SakaLuX modules already installed in Torn PDA / Tampermonkey.
- Provides persistent Suite-level ON / OFF switches for Enhancer Guard, Bazaar Thanker, Mission Rewards, Market Intelligence and Elimination Assistant.
- Provides OPEN bridging to the existing standalone module when detected.
- Adds **ENABLE READY**, **DISABLE ALL**, **EXPORT SETTINGS** and **IMPORT SETTINGS** controls.
- Adds a dedicated **SHARED TORN API KEY** field for future embedded modules.
- Keeps the Torn API key out of exported Suite settings.
- Keeps module state persistent between page reloads.
- Exposes `window.SakaLuXSuite` for diagnostics and future integration.

## Quality of Life modules

v0.2.0 introduces the first real internal Suite modules. These are implemented independently inside SakaLuX Suite and do not depend on Fortie code.

### Prayer Reminder
- Daily UTC prayer reminder.
- Shows a compact **PRAY** button while enabled.
- After marking the day as prayed, the reminder stays hidden until the next UTC day.

### Med Advisor
- Reads currently visible Torn life values when available.
- Gives a quick medical-item recommendation based on the current life percentage.
- Does not use or consume items automatically.

### Item Intel
- Activates on Torn item-related pages.
- Adds compact purpose markers to recognized items such as HEAL, ENERGY, HAPPY, DRUG, ENHANCER and MUSEUM.
- Does not alter inventory or perform item actions.

### Event Intel
- Activates on Torn Events pages.
- Adds a compact searchable event helper.
- Filters visible event rows locally on the page.

All four modules have persistent real **ON / OFF** controls in the Suite Master Control.

## Important prototype behavior

The legacy module switches still control Suite bridge access and do not disable or uninstall the existing standalone scripts. The new Quality of Life modules are different: they are true internal Suite modules and their ON / OFF switches directly control their functionality.

## Current release notes

### v0.2.0

- Added the **QUALITY OF LIFE** category.
- Added internal **Prayer Reminder**.
- Added internal **Med Advisor**.
- Added internal **Item Intel**.
- Added internal **Event Intel**.
- Added INTERNAL status badges so embedded Suite modules are visually distinct from legacy BRIDGE modules.
- Added `window.SakaLuXSuite.runModule()` for internal-module testing.
- Kept all existing standalone SakaLuX scripts untouched.

### v0.1.1

- Removed the large TEST BUILD information banner from the Master Control panel.
- Reworked the panel into a single scrolling content area so the top controls, Shared Torn API Key and module categories all move together when scrolling.
- Added a Torn-style skull launcher that attempts to mount directly before the game's Money control.
- The original floating skull is now only a fallback when the native Torn launcher cannot be detected.
- Existing standalone scripts remain untouched.

### v0.1.0

- Initial experimental SakaLuX Suite Master Control.
- Added modular category layout and persistent ON / OFF state.
- Added legacy-script detection and OPEN bridge actions.
- Added shared Torn API key storage.
- Added Enable Ready / Disable All controls.
- Added Suite settings export/import without API key export.

## Planned migration path

After the Master Control UI and performance are validated, the real legacy module code can be moved inside the Suite progressively: shared core/API manager, Enhancer Guard, Bazaar Thanker, Mission Rewards, Market Intelligence, Elimination Assistant, and a dynamic API permission helper based on enabled modules.

Until those migrations are complete, the current standalone scripts remain the production versions.

## Privacy / API key

The shared Torn API key is stored only in browser localStorage under `SakaLuX_SUITE_TORN_API_KEY` and is not included in exported Suite settings.
