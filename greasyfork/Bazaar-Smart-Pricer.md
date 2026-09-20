# SakaLuX Bazaar Smart Pricer

> Smart Bazaar pricing helper for Torn, designed for TornPDA and desktop userscript managers.

## Current version
**v1.1.6**


## Repository synchronization

- Verified: **2026-09-20**
- Canonical version: **v1.1.5**
- License: **MIT**
- Canonical GitHub source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js
- GreasyFork description source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Bazaar-Smart-Pricer.md
- GreasyFork page: https://greasyfork.org/scripts/596672
- Install/download URL: https://update.greasyfork.org/scripts/596672/SakaLuX%20Bazaar%20Smart%20Pricer.user.js
- Update metadata URL: https://update.greasyfork.org/scripts/596672/SakaLuX%20Bazaar%20Smart%20Pricer.meta.js

## What it does
- Prices Bazaar items from Torn market value, the lowest visible item-market listing, or an undercut of the lowest listing.
- Supports flat-dollar or percentage undercutting.
- Works on Bazaar add-item and manage/reprice flows by detecting the current Torn price inputs instead of relying on one old table selector.
- Adds an optional **S PRICE** button beside detected price fields.
- Includes **PRICE ALL VISIBLE** for bulk repricing of the currently rendered Bazaar rows.
- Stores settings locally and includes an in-script Torn API key setup/test panel.
- Can ignore ultra-low storage/grief listings such as $1 offers.
- Warns when the calculated price is below the item's NPC sell price; it does not block the user's final price.
- Uses cached item/market data to reduce API calls and coalesces overlapping requests for the same item.

## Why this rebuild exists
The older MIT-licensed Torn Bazaar Quick Pricer v3.2.3 still described settings and add-item pricing, but its published source only injected a Quick Reprice control for the Manage Bazaar page and no longer exposed a working API-key/settings onboarding UI. It also depended on a narrow legacy price-input selector. SakaLuX Bazaar Smart Pricer rebuilds those workflows with current SPA/TornPDA-friendly detection.

## API
The script requires a Torn read-only/public API key for item information and item-market pricing. The key is stored locally in the userscript environment and sent only to `api.torn.com`.

## Credits / License
MIT-licensed rebuild inspired by **Torn Bazaar Quick Pricer + Smart Bazaar Pricing Panel** by R4G3RUNN3R [3877028], based on Zedtrooper [3028329] and community extensions.

## Current release note

**v1.1.6 — Release metadata synchronization**
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Rollback: restored the exact Bazaar Smart Pricer v1.1.5 userscript from commit f0ea0e5b0d629b214635eff1f3473b4a466ab710.
