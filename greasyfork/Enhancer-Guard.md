# SakaLuX Enhancer Guard

Complementary add-on for SakaLuX Script Hub.

## Current version

**v1.3.12**

## What it does

- Tracks Enhancers and Enhancer Relics in Torn.
- Shows owned/missing status and quantities.
- Uses Torn API v2.
- Provides a dedicated API Access panel with exact permission creation and validation.
- Includes search, filters, sorting, favorites, compact mode and optional auto-refresh.
- Works with Torn PDA and Tampermonkey.

## Current release notes

### v1.3.12

- Moved protection badges from the Enhancer panel to the Torn Items inventory, matching Item Protector.
- Added full, partial-quantity and unlocked lock badge states with long-press quantity editing directly on item icons.
- The Enhancer header lock now cycles the Item Protector badge size directly: small → medium → large → small.
- Removed the extra injected resize button and the separate protection panel so the Items page remains the single lock interface.
- Improved item-name detection across TornPDA’s dynamically rendered inventory layouts.
- The size action now refreshes inventory badges even when Items is a dynamically switched TornPDA view and emits a shared settings-change event.

### v1.3.11

### v1.3.10

### v1.3.9

### v1.3.8

- Removed the manual item-name / `ADD ITEM` flow.

### v1.3.7

- Added manual protection for any item name, not only Enhancers.
- Removed the `Owned first` and `Auto refresh` controls; the list stays alphabetic and refresh remains manual.

### v1.3.6

- Compact single-row statistics for TornPDA.
- Item names now open the matching Item Market search directly.
- Added shared Item Protector lock controls, including full and reserved-quantity protection.
- Protected items use the same storage as `#1 Item Protector 🔐 MP` and are hidden from compatible selling screens.

### v1.3.5

- Added a gold key button to the main Enhancer header.
- Added a dedicated Market Intelligence-style API Access panel with active key source and access status.
- **CREATE ENHANCER API KEY** requests only User Inventory and Torn Items access; it requests no write permissions.
- Added save, exact Inventory + Torn Items permission check and local-key clearing controls.
- Automatically returns to the API panel after creating a key.
- Shared Hub keys remain preferred, while TornPDA injection and a local standalone fallback continue to work.

### v1.3.4

- Added persistent `setEnabled`, `toggleEnabled` and `isEnabled` Hub power controls.
- OFF closes the panel, removes the launcher and stops auto-refresh; ON restores the runtime without reloading Torn.
- Automatically uses the shared Hub key when available; standalone mode includes a creator for the required Inventory + Torn Items key.

### v1.3.3

- Changed project licensing from MIT to **All Rights Reserved** and added explicit author/copyright protection.
- Added `Copyright © 2026 SakaLuX [2380374]` and retained-author requirements.
- Personal use and private modification remain permitted; redistribution/republication require prior written permission.


### v1.3.2
- Added optional SakaLuX Script Hub installation prompt when the Hub is not detected.
- INSTALL HUB opens the official Greasy Fork installer.
- NOT NOW postpones the reminder for 24 hours.
- The 24-hour reminder cooldown is shared with other complementary SakaLuX scripts to avoid duplicate prompts on the same day.

## Recommended

Install SakaLuX Script Hub to manage this add-on together with the rest of the SakaLuX script suite.


## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.
