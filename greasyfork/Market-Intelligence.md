# 📈 SakaLuX Market Intelligence

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v1.17.18**

## What it does
- Provides market, Bazaar and travel intelligence for Torn PDA and Tampermonkey.
- Adds Item Market Intelligence with live/cached price information, local price history, trend data and BUY NOW / FAIR / WAIT / LEARNING signals.
- Includes Bazaar Flip Intelligence with estimated net profit and ROI.
- Includes Best Travel Run, Best Route Basket, in-country Best Buys and Travel Buy Planner tools.
- Includes Arrival Stock and Arrival Basket planning while flying.
- Tracks local travel-session estimates and recent trip planning history.
- Includes Museum Set Intelligence to compare set turn-in value with estimated item-sale value.
- Includes a Loadout Comparator for weapons and armor.
- Supports local item watchlists, market caching and travel stock/restock learning.
- Uses Torn API data and YATA public travel data where required.
- Includes an optional SakaLuX Price Network client, disabled by default.
- Exposes `window.SakaLuXMarketIntelligence` for SakaLuX Script Hub integration and quick actions.
- Supports persistent ON/OFF control from SakaLuX Script Hub.

## Current release note

**v1.17.17** removes the standalone floating launcher button from Market Intelligence. The panel remains fully accessible from SakaLuX Script Hub and the standalone SakaLuX dock through the module bridge/API.

## Recommended
Install **SakaLuX Script Hub** to manage Market Intelligence together with the rest of the SakaLuX add-ons, use shared Hub integration and access its quick actions from one place.

## License
All Rights Reserved

## Privacy
Market Intelligence is local-first. Settings, market cache, watchlist, stock history, item catalogue, price history, travel sessions, loadout cache and Price Network queue/consensus data are stored locally in browser/TornPDA storage.

The module can request data from:

- `api.torn.com` for Torn market/player/travel/equipment information required by enabled features.
- `yata.yt` for public abroad travel stock and buy-price information.

The optional **SakaLuX Price Network** is **disabled by default** and has no default endpoint configured. If a user explicitly enables it and configures an endpoint, the client may submit anonymous market observations containing item ID, observed market price, timestamp and source. It is designed not to include Torn ID, username, API key, device ID or cookies in those observation payloads.

## Important
All displayed prices, profits, ROI values, arrival-stock estimates, restock predictions, basket recommendations, Museum comparisons and loadout verdicts are decision-support estimates. Market prices, foreign stock and player equipment can change after the latest scan.

The script does **not** automatically purchase, sell, travel, trade or attack. Always verify Torn's final values before committing money or items.

Arrival/restock prediction learns from observations made while the script is active. Until enough history exists, predictions may be labelled **LEARNING** or lower-confidence and should not be treated as guaranteed future stock.

## Release history
### v1.17.16 — Hub detection fix

- Recognizes the current Hub S/Fly-out launchers and Hub-active marker.
- Prevents the standalone dock/install prompt from appearing while Hub is installed.

### v1.17.12 — Compact native S standalone launcher

- Smaller professional standalone dock.
- Native gold **S** launcher mounts after Torn cash and opens/closes the dock.
- Removed the dock **+** control.
- Compact fallback **S** appears only when Torn status icons are unavailable.
- Shared Hub reminder remains limited to once every 12 hours.

### v1.17.8 — Violentmonkey Hub bridge

- Added an isolated-context DOM bridge so Script Hub can detect, open and switch Market Intelligence ON/OFF in Violentmonkey.

### v1.17.7 — Travel-only panels

- Travel Session Summary, Best Route Basket and the related travel panels now appear only on Torn Travel pages.
- Moving to Log, Events, Items, profiles or another page immediately removes stale Travel panels.
- Added render-time route guards for TornPDA internal navigation.

### v1.17.6 — Inline panel signature

- Removed the floating author badge from the Torn page.
- **Made with ❤️ by SakaLuX [2380374]** now lives inside the script panel as its final footer, with the author name and ID linked to the Torn profile.

### v1.17.5 — Persistent SakaLuX signature

- Replaced the technical `Manual · page: other` style subtitle with **Market • Bazaar • Travel Intelligence**.
- Enlarged the close button to the Hub control size.
- Added the persistent **Made with ❤️ by SakaLuX [2380374]** linked author footer.

### v1.17.4 — Dedicated API Access panel

- Moved Torn API controls out of the main Market Intelligence settings list.
- Added a dedicated gold key button next to the close button in the Market Intelligence header.
- Added an Elimination-style API Access panel customized for Market Intelligence permissions, source/status diagnostics, key creation, Save & Test, Check Access and local-key clearing.
- Removed the old inline API ACCESS block and bottom CREATE REQUIRED API KEY button from Settings.
- The dedicated key creator now always requests the exact Market Intelligence read-only permission set.

### v1.17.3

- Adopted the unified **SakaLuX Control Center** visual system used by Script Hub.
- Standardized panels, cards, buttons, inputs, borders, spacing and compatible settings toggles for a more consistent TornPDA/desktop experience.
- UI-only release: existing features, APIs and saved data remain unchanged.

### v1.17.2 — PC Hub detection

- Added a persistent installation marker for reliable Script Hub detection on PC/Tampermonkey.

### v1.17.1 — Page isolation cleanup

- Market Intelligence no longer renders its market panel on Torn Items or player profile pages.

### v1.17.0 — Native Hub Power API

- Added `setEnabled`, `toggleEnabled` and `isEnabled` for direct Script Hub control.
- OFF disconnects the DOM/route observer, cancels scheduled scans and removes injected Market Intelligence panels.
- ON restores observation, scanning and configured background services without reloading Torn.
- Automatically prefers the shared Hub key while keeping its standalone required-key creator and local fallback key.
