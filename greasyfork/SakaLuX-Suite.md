# SakaLuX Suite [EXPERIMENTAL]

SakaLuX Suite is an experimental one-install modular master control for the SakaLuX Torn script ecosystem.

## Current version

**v0.1.0**

## Status

**CONTROL-LAYER PROTOTYPE**

The existing standalone SakaLuX scripts are not removed, replaced or modified by this test build.

## What this prototype does

- Adds one central **SakaLuX Suite** Master Control panel.
- Detects the existing standalone SakaLuX modules already installed in Torn PDA / Tampermonkey.
- Provides persistent Suite-level ON / OFF switches for:
  - Enhancer Guard
  - Bazaar Thanker
  - Mission Rewards
  - Market Intelligence
  - Elimination Assistant
- Provides OPEN bridging to the existing standalone module when detected.
- Adds **ENABLE READY** and **DISABLE ALL** controls.
- Adds **EXPORT SETTINGS** and **IMPORT SETTINGS**.
- Keeps the Torn API key out of exported Suite settings.
- Adds a dedicated **SHARED TORN API KEY** field that future embedded modules will use through one central key store.
- Keeps module state persistent between page reloads.
- Exposes `window.SakaLuXSuite` for diagnostics and future integration.

## Important prototype behavior

The module switches in v0.1.0 control the Suite prototype state and bridge visibility. They do not disable or uninstall the existing standalone scripts.

This is intentional so the Suite can be tested safely alongside the current Script Hub and all existing SakaLuX add-ons.

## Planned migration path

After the Master Control UI and performance are validated, the real module code will be moved inside the Suite progressively:

1. Shared core and API manager.
2. Enhancer Guard internal module.
3. Bazaar Thanker internal module.
4. Mission Rewards internal module.
5. Market Intelligence internal module.
6. Elimination Assistant internal module.
7. Dynamic API permission helper based on enabled modules.
8. Final single-install bundled release.

Until those migrations are complete, the current standalone scripts remain the production versions.

## Privacy / API key

The shared Torn API key is stored only in browser localStorage under `SakaLuX_SUITE_TORN_API_KEY` and is not included in exported Suite settings.

## Current release notes

### v0.1.0

- Initial experimental SakaLuX Suite Master Control.
- Added modular category layout and persistent ON / OFF state.
- Added legacy-script detection and OPEN bridge actions.
- Added shared Torn API key storage.
- Added Enable Ready / Disable All controls.
- Added Suite settings export/import without API key export.
- Existing SakaLuX Script Hub and standalone add-ons remain untouched.
