# 🛡️ SakaLuX Enhancer Guard

Complementary add-on for SakaLuX Script Hub.

## Current version

**v1.3.15**

## What it does

- Tracks Enhancers and Enhancer Relics in Torn.
- Shows owned/missing status and quantities.
- Uses Torn API v2.
- Provides a dedicated API Access panel with exact permission creation and validation.
- Includes search, filters, sorting, favorites, compact mode and optional auto-refresh.
- Integrates Item Protector lock badges directly into Torn Items.
- Supports full, partial-quantity and unlocked protection states.
- Works with Torn PDA and Tampermonkey.

## Current release notes

### v1.3.15

- Adopted the unified **SakaLuX Control Center** visual system used by Script Hub.
- Standardized panels, cards, buttons, inputs, borders, spacing and compatible settings toggles for a more consistent TornPDA/desktop experience.
- UI-only release: existing features, APIs and saved data remain unchanged.

### v1.3.14

- Added a persistent installation marker so Script Hub can detect the add-on reliably on PC/Tampermonkey.
- Moved protection badges from the Enhancer panel to the Torn Items inventory, matching Item Protector.
- Added full, partial-quantity and unlocked lock badge states with long-press quantity editing directly on item icons.
- The Enhancer header lock now cycles Item Protector badge size: small → medium → large → small.
- Removed the extra injected resize button and separate protection panel so Torn Items remains the single lock interface.
- Improved item-name detection across dynamically rendered TornPDA inventory layouts.
- Improved live refresh of inventory badges after settings changes.
- Removed the unused Enhancer-header lock control.

## Recommended

Install **SakaLuX Script Hub** to manage Enhancer Guard together with the rest of the SakaLuX add-ons and to use shared Hub integration where available.

## Privacy

Enhancer Guard stores its settings, protection state and cached interface data locally in the browser/TornPDA storage. Torn inventory and item information is requested from the Torn API using the active API key. The script does not need write permissions for Torn API access.

## Important

Item Protector is a client-side safety layer. Always verify Torn's final sell/send/trade screen before confirming a transaction involving valuable items.

## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.
