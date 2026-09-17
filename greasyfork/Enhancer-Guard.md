# 🛡️ SakaLuX Enhancer Guard

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v1.3.37**

## What it does
- Tracks Enhancers and Enhancer Relics in Torn.
- Shows owned/missing status and quantities.
- Uses Torn API v2.
- Provides a dedicated API Access panel with exact permission creation and validation.
- Includes search, filters, sorting, favorites, compact mode and optional auto-refresh.
- Integrates Item Protector lock badges directly into Torn Items.
- Supports full, partial-quantity and unlocked protection states.
- Works with Torn PDA and Tampermonkey.

## Current release note

**v1.3.37** adds the shared top-to-bottom mobile sheet and translucent blur contract.

## Recommended
Install **SakaLuX Script Hub** to manage Enhancer Guard with the other registered add-ons and use shared Hub integration/API access when compatible.

## Privacy
- Enhancer settings, protection preferences, favorites and local cache/state are stored locally in the userscript/browser environment.
- Torn API requests are sent to `api.torn.com` using the active key required for inventory/item information.
- Enhancer Guard does not require Torn API write permissions for its inventory intelligence/protection display.

## Important
- Bazaar protection is a client-side safety guard. Always verify the final Torn sale list before confirming a sale.
- Inventory/API values can briefly lag behind Torn after item changes until the next refresh.
- Partial protection quantities are local preferences and should be reviewed after major inventory changes.

## License
**All Rights Reserved**

## Release history
### v1.3.37 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v1.3.36 — Mobile top alignment
- Opens the script panel from the top of the TornPDA viewport.
- Uses the shared SakaLuX top-alignment contract.

### v1.3.35 — PDA top-aligned panel refinement

- Opens the SakaLuX panel from the top of the available Torn viewport.
- Improves compact Hub integration and mobile visibility.

### v1.3.33 — Shared Standalone ordering fix

- Uses the canonical SakaLuX standalone order including Company Intelligence.
- Unknown/new modules sort after known modules instead of before them.
- Keeps the mobile dock layout and Install SakaLuX Hub button readable.

### v1.3.31 — Protected Bazaar items
- Preserves every v1.3.30 behavior.
- Hides fully protected items from legacy/current mobile/PDA Bazaar sale lists.
- Blocks the add control before a protected item enters Bazaar selection.

### v1.3.30 — Panel layering above standalone dock
- Keeps Enhancer Guard panels above the shared standalone dock.

### v1.3.29 — Standalone launcher cleanup
- Removed the separate Enhancer floating launcher while preserving Hub/shared-dock access.

### v1.3.28 — Hub detection fix
- Recognizes current Hub launchers/active marker and prevents standalone prompts while Hub is installed.

### v1.3.24 — Compact native S standalone launcher
- Added the compact native S/shared standalone dock behavior.

### v1.3.20 — English standalone baseline
- Made English the standalone default while allowing Hub-selected language integration.

### v1.3.19 — Priority star alignment
- Corrected priority-star sizing/alignment under shared styling.

### v1.3.18 — Violentmonkey Hub bridge
- Added isolated-context detection, OPEN and ON/OFF bridge support.

### v1.3.17 — Inline panel signature
- Moved the SakaLuX signature inside the module panel.

### v1.3.16 — Persistent SakaLuX signature
- Added the persistent linked author footer.

### v1.3.15 — Unified Control Center visual system
- Adopted the shared SakaLuX interface style.

### v1.3.14 — Item Protector integration
- Added reliable installation detection and full/partial/unlocked lock badges directly on Torn Items with local quantity editing.

## Changelog

### v1.3.34

- Performance/UI optimization: uses the shared single-instance SakaLuX performance helpers, reduces repeated observer/render work and aligns the standalone UI with the Hub visual system.

