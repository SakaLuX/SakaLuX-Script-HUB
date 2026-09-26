# SakaLuX Bazaar Smart Pricer

> Smart Bazaar pricing helper for Torn, designed for TornPDA and desktop userscript managers.

## Current version
**v1.1.12**

## Repository synchronization

- Verified: **2026-09-26**
- Canonical version: **v1.1.12**
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

**v1.1.12 — Adds a global persistent power bridge so Hub ON/OFF works from every Torn page**
- Adds a global persistent power bridge so Hub ON/OFF works from every Torn page.
- Synchronizes Hub power state with Pricer storage.
- Keeps pricing runtime page-scoped while power control remains global.
## Release history / Changelog

### v1.1.12 — Global Hub power control
- Adds a persistent global power bridge so Script Hub ON/OFF works from every Torn page.
- Synchronizes Hub power state with Smart Pricer storage.
- Keeps pricing and Bazaar scanning page-scoped while global power control stays available.

