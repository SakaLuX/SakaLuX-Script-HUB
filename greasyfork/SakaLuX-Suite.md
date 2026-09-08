# SakaLuX Suite [EXPERIMENTAL]

SakaLuX Suite is an experimental one-install modular master control for the SakaLuX Torn script ecosystem.

## Current version

**v0.3.0**

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

These are true internal Suite modules and do not depend on Fortie code.

### Prayer Reminder
- Adds a compact prayer icon into Torn's top controls when possible.
- Falls back to a small floating QOL icon if the native control row cannot be detected.
- The reminder is visible only when enabled and not yet completed for the current UTC day.
- Clicking it marks the current UTC day and opens Torn's Church page.
- It also watches for visible prayer-success wording and keeps the icon hidden until the next UTC day.

### Med Advisor
- Adds its own compact medical icon into Torn's top controls when enabled.
- Clicking the icon opens a quick medical recommendation panel.
- Reads visible Torn Life and hospital information when available.
- Includes a **SETTINGS** button both from the Suite module card and the Med Advisor panel.
- Settings include:
  - Personal Items / Faction Armory source
  - Intermediate Biochemistry +10%
  - Advanced Biochemistry +10%
  - Intravenous Therapy
  - Faction bonus slider
  - Smart Best / Exit Fastest / Full HP / Least Waste / Cooldown / Strongest recommendation order
  - No Drug Usage flag
- Recommendations remain advisory only; the Suite never consumes an item automatically.

### Item Intel
- Expands the internal marker system beyond the original v0.2.0 prototype.
- Recognizes common Organized Crime role items.
- Adds compact purpose tags for **OC**, **ENERGY**, **NERVE**, **HAPPY**, **HEAL** and **ENH**.
- Tags include tooltips explaining what each marker represents.
- Does not alter inventory or perform item actions.

### Event Intel
- Activates on Torn Events pages.
- Builds a compact searchable event dashboard from the visible event rows.
- Automatically categorizes visible events into Combat, Trading, Faction, Games and Other.
- Includes category filtering and quick visible-event statistics.
- Adds local **SAVE / SAVED** support for events.
- Saved event text is stored locally only.

All four Quality of Life modules have persistent real **ON / OFF** controls in the Suite Master Control.

## Important prototype behavior

The legacy module switches still control Suite bridge access and do not disable or uninstall the existing standalone scripts. The Quality of Life modules are different: they are true internal Suite modules and their ON / OFF switches directly control their functionality.

## Current release notes

### v0.3.0

- Reworked Prayer Reminder to use an in-game QOL icon instead of only a standalone reminder control.
- Reworked Med Advisor to use an in-game medical icon and quick recommendation panel.
- Added a full Med Advisor **SETTINGS** interface modeled on the useful options seen in similar public tools but implemented independently for SakaLuX Suite.
- Added source selection, education toggles, faction bonus, six recommendation order modes and No Drug Usage.
- Expanded Item Intel with OC / Energy / Nerve / Happiness / Heal / Enhancer markers.
- Expanded Event Intel with categorization, search, category filter, quick stats and Saved Events.
- Existing standalone SakaLuX scripts remain untouched.

### v0.2.0

- Added the **QUALITY OF LIFE** category.
- Added internal **Prayer Reminder**.
- Added internal **Med Advisor**.
- Added internal **Item Intel**.
- Added internal **Event Intel**.
- Added INTERNAL status badges so embedded Suite modules are visually distinct from legacy BRIDGE modules.

### v0.1.1

- Removed the large TEST BUILD information banner from the Master Control panel.
- Reworked the panel into a single scrolling content area so the top controls, Shared Torn API Key and module categories all move together when scrolling.
- Added a Torn-style skull launcher that attempts to mount directly before the game's Money control.
- The original floating skull is now only a fallback when the native Torn launcher cannot be detected.

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
