# SakaLuX Bazaar Smart Pricer

> Smart Bazaar pricing helper for Torn, designed for TornPDA and desktop userscript managers.

## Current version
**v1.0.2**

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

**v1.0.1 — Add Items QUICK FILL button**
- Adds **S QUICK FILL** directly above the Bazaar Add Items sale rows.
- One tap prices all currently visible item rows using the saved pricing mode.
- Keeps per-row **S PRICE** and panel **PRICE ALL VISIBLE** available.


### v1.0.0 — SakaLuX rebuild
- Renamed to **SakaLuX Bazaar Smart Pricer**.
- Restored an actual settings/API-key panel.
- Added robust Torn SPA/Bazaar runtime detection using `https://www.torn.com/*` plus a Bazaar guard.
- Added add-item and manage-page price-input discovery.
- Added per-row **S PRICE** and bulk **PRICE ALL VISIBLE** actions.
- Added Market Value / Lowest Listing / Undercut modes.
- Added % or flat-$ undercut rules, low-listing filtering, NPC warning, caching and API test.
- Exposes `window.SakaLuXBazaarSmartPricer` with `open`, `refresh`, `priceAll`, `isEnabled`, and `setEnabled`.

### v1.0.1 — Add Items Quick Fill
- **S QUICK FILL** fills **both quantity and price** for visible Add Items rows.
- Per-row **S PRICE** uses the same fill behavior.

### v1.0.2 — RW / bonus safety + compact launcher
- Right-side launcher is now a circular **+**.
- RW weapons and bonus items are skipped by default; both protections can be changed in Settings.
