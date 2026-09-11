# SakaLuX Mission Rewards

SakaLuX Mission Rewards enhances Torn's Mission Shop with practical reward information for PDA and Tampermonkey users.

## Current version

**v1.0.4**

## What it does

- Shows estimated market value for item rewards.
- Calculates estimated value per mission credit.
- Shows currently owned special ammo.
- Tracks normal and special weapon mod credit ranges locally from offers seen on the device.
- Adds extra information directly to Mission Shop reward cards.
- Adds a detailed reward information panel.
- Includes refresh controls, local caching and API-key support for Torn PDA / Tampermonkey.
- Exposes `window.SakaLuXMissionRewards` for integration with SakaLuX Script Hub on every Torn page.

## Script Hub integration

Mission Rewards is registered as a complementary add-on in the SakaLuX Script Hub registry.

The Hub can now detect Mission Rewards as installed even when you are not on the Missions page. Mission-specific scanning remains inactive outside `sid=missions`.

If Script Hub is not installed, Mission Rewards can offer the optional Hub installer with the shared 24-hour **NOT NOW** cooldown used by the other SakaLuX add-ons.

## Current release notes

### v1.0.4

- Added a persistent installation marker for reliable Script Hub detection on PC.

- Added persistent `setEnabled`, `toggleEnabled` and `isEnabled` Hub power controls.
- OFF disconnects Mission Shop scanning and removes injected badges/panels; ON restores them without a page reload.
- Automatically uses the shared Hub key when available; standalone mode includes a creator for the required Ammo + Torn Items key.

### v1.0.2

- Changed project licensing from MIT to **All Rights Reserved** and added explicit author/copyright protection.
- Added `Copyright © 2026 SakaLuX [2380374]` and retained-author requirements.
- Personal use and private modification remain permitted; redistribution/republication require prior written permission.


### v1.0.1
- Changed the userscript match to all Torn pages so Script Hub can reliably detect Mission Rewards everywhere.
- Kept Mission Shop scanning and reward processing restricted to the Missions page.
- Improved mobile/PDA reward badges so information is shown as a visible overlay inside the reward card instead of being clipped by the Torn carousel layout.
- Added optional Script Hub installation prompt with shared 24-hour cooldown.
- Opening Mission Rewards from the Hub outside Missions now navigates to the Missions page.
- Health information now reports whether the Missions page is currently active.

### v1.0.0
- Initial SakaLuX Mission Rewards release.
- Item value and value-per-credit information.
- Special ammo ownership display.
- Local weapon mod price-range learning.
- Mission Shop card badges and detailed reward information.
- SakaLuX Script Hub API included.


## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.
