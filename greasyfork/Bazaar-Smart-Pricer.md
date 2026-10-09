# SakaLuX Bazaar Smart Pricer

> Smart Bazaar pricing helper for Torn, designed for TornPDA and desktop userscript managers.

## Current version
**v1.1.21**

## Repository synchronization

- Verified: **2026-10-07**
- Canonical version: **v1.1.21**
- License: **MIT**
- Canonical GitHub source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js
- GreasyFork description source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Bazaar-Smart-Pricer.md
- GreasyFork page: https://greasyfork.org/scripts/596672
- Install/download URL: https://update.greasyfork.org/scripts/596672/SakaLuX%20Bazaar%20Smart%20Pricer.user.js
- Update metadata URL: https://update.greasyfork.org/scripts/596672/SakaLuX%20Bazaar%20Smart%20Pricer.meta.js

## What it does
- Prices Bazaar items from Torn market value with the configured discount or markup and optional Torn City shop-price floor.
- Adds compact per-item Quick Add / Undo controls on Bazaar Add Items.
- Adds Manage Bazaar repricing controls and an Update All flow that opens collapsed rows sequentially when needed.
- Includes the draggable Quick Fill / Update All chip with Settings access.
- Can skip ranked-war weapons, generic bonus items and $1 Bazaar entries according to Settings.
- Stores settings and API data locally and supports the SakaLuX Hub shared API key with a local fallback.
- Uses cached item data and request coalescing to reduce unnecessary API traffic.
- Leaves Torn's final **SAVE CHANGES** action to the player.

## Hub integration
Smart Pricer v1.1.7 publishes its installed-version marker on every `www.torn.com` page so Script Hub can detect that it is installed even when the Hub is opened outside Bazaar. The actual pricing/runtime code remains strictly scoped to `/bazaar.php`, so no Bazaar scanning or UI runs on unrelated Torn pages.

On Bazaar itself, the script also exposes `SakaLuXBazaarSmartPricer` for Hub actions such as Settings, Quick Fill and Refresh.

## API
The script uses a Torn API key for item information. The key is stored locally in the userscript environment; when Script Hub is installed, the compatible shared Hub key can be preferred with the script's own local key as fallback.

## Credits / License
MIT-licensed implementation based on the proven Torn Bazaar Quick Pricer behavior by Zedtrooper [3028329] / community contributors, with SakaLuX Hub integration, mobile/TornPDA support and additional safety controls.

## Current release note

**v1.1.17 — Version and release synchronization**
- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## Release history / Changelog

### v1.1.21 — 2026-10-10
- Added execution-entry PRO checks beyond UI labels and click interceptors.
- Verified JavaScript parses successfully; device behavior remains to be tested.


### v1.1.20 — 2026-10-10
- Guards Quick Fill and Update All at their execution entry points. Also fixes Update All async declaration.
- Client-side checks are usability controls; server-hosting premium calculations is required to prevent code bypass.


### v1.1.20 — 2026-10-10
- Added direct execution-entry checks for covered PRO functionality, including stock rebalance, Bazaar bulk updates, Museum scan and Elimination FF/calibration.
- Retains basic FREE functions and GreasyFork distribution URLs.
- Remaining execution paths and browser integration still need verification; JavaScript alone is not a secure server-side paywall.


### v1.1.19 — 2026-10-10 · FREE/PRO
- FREE: Per-item Quick Add and Undo; Individual pricing; RW/bonus item safety controls.
- PRO: Bulk Pricing; Update All; Quick Fill.
- PANIC and other destructive execution paths retain explicit confirmation requirements. Client-side feature gates are not tamper-proof.


### v1.1.18 — 2026-10-09
- Added shared SakaLuX branded dialogs for informational, PRO and error notices.
- Replaced existing blocking alert messages with styled notices.
- Existing synchronous confirmations and prompts remain native for action safety.


### v1.1.17 — 2026-10-07
- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### v1.1.16 — Standalone Dock Runtime v1.1.3 status-bar fix
- Runtime-only maintenance update.
- Prevents Standalone from changing Torn's native status-list child count/order.
- Restores all native status icons while keeping the S launcher near cooldowns.

### v1.1.15 — Shared Standalone Dock Runtime v1.1.2 maintenance
- Runtime-only maintenance update.
- Embeds Standalone Dock v1.1.2 so all installed SakaLuX standalone modules share the repaired singleton behavior.
- No module feature changes.




### v1.1.14 — Correct Torn City sell-price floor
- Fixes the Torn City shop floor to use sell_price, the amount the NPC shop pays you, instead of buy_price.
- Prevents Smart Pricer from incorrectly raising a Bazaar price to the NPC shop purchase price when market value is lower.
- Resets stale pricing cache data and keeps the floor indicator aligned with sell_price.

### v1.1.13 — Settings Schema v1 and safe automatic migrations
- Adds versioned settings schemas for every SakaLuX userscript through Shared Core v1.1.0.
- Automatically advances legacy settings through ordered per-version migrations without downgrading newer data.
- Keeps a last-known-good backup and restores it, or safely falls back to script defaults, when stored JSON is corrupt.

### v1.1.12 — Global Hub power control
- Adds a persistent global power bridge so Script Hub ON/OFF works from every Torn page.
- Synchronizes Hub power state with Smart Pricer storage.
- Keeps pricing and Bazaar scanning page-scoped while global power control stays available.

