# 📈 SakaLuX Market Intelligence

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v1.17.34**

## What it does
- Provides market, Bazaar and travel intelligence for Torn PDA and Tampermonkey.
- Adds Item Market Intelligence with live/cached price information, local history, trends and BUY NOW / FAIR / WAIT / LEARNING signals.
- Includes Bazaar Flip Intelligence with estimated net profit and ROI.
- Includes Best Travel Run, Best Route Basket, in-country Best Buys and Travel Buy Planner tools.
- Includes Arrival Stock and Arrival Basket planning while flying.
- Tracks local travel-session estimates and recent trip-planning history.
- Includes Museum Set Intelligence and a Loadout Comparator for weapons/armor.
- Supports local watchlists, market caching and travel stock/restock learning.
- Uses Torn API data and YATA public travel data where required.
- Includes an optional SakaLuX Price Network client, disabled by default.
- Exposes `window.SakaLuXMarketIntelligence` and supports persistent Hub ON/OFF control.

## Current release note




**v1.17.34** Extends the donation/author footer to the full panel width, compensates for the content padding and removes the bottom gap. Keeps 20px donation buttons and the mobile chat clearance.

## Recommended
Install **SakaLuX Script Hub** to manage Market Intelligence with the other registered add-ons, use shared Hub integration and access module controls from one place.

## Privacy
Market Intelligence is local-first. Settings, market cache, watchlist, stock history, item catalogue, price history, travel sessions, loadout cache and Price Network queue/consensus data are stored locally.

The module may request data from:
- `api.torn.com` for Torn market/player/travel/equipment information.
- `yata.yt` for public abroad travel stock and buy-price information.

The optional SakaLuX Price Network is disabled by default and has no default endpoint. If explicitly enabled/configured, it is designed to submit anonymous market observations without Torn ID, username, API key, device ID or cookies.

## Important
- Displayed prices, profits, ROI, arrival-stock estimates, restock predictions, basket recommendations, Museum comparisons and loadout verdicts are decision-support estimates.
- The script does not automatically purchase, sell, travel, trade or attack.
- Arrival/restock prediction learns from observations and may remain LEARNING/low-confidence until sufficient history exists.
- Market Intelligence is distributed through Greasy Fork. If Hub shows `PUBLISHED vX · REGISTRY v1.17.19`, the Greasy Fork public metadata is behind the registry. Publish v1.17.19 on Greasy Fork to clear that legitimate pending state.

## License
**All Rights Reserved**

## Release history

### v1.17.34 — Full-width footer
- Extends the donation/author footer to the full panel width, compensates for the content padding and removes the bottom gap. Keeps 20px donation buttons and the mobile chat clearance.


### v1.17.33 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.


### v1.17.32 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.


### v1.17.30 — Full-screen performance
- Mobile SakaLuX panels use the full available viewport.
- Removes backdrop blur and heavy mobile visual effects.
- Disables the legacy document-scanning Mobile Surface observer where present.
- Reduces mobile animation/transition cost for faster input and scrolling.


### v1.17.29 — Hub-aware observer shutdown
- Stops the standalone document observer as soon as Script Hub is detected.
- Keeps normal standalone behavior when Hub is absent.
- Reduces unnecessary work during Hub scrolling and button taps.


### v1.17.28 — TornPDA performance
- Removes the recurring standalone render interval.
- Throttles DOM-driven standalone refreshes.
- Avoids repeated work while Script Hub is active.


### v1.17.27 — Standalone panel repair
- Restores Standalone OPEN behavior.
- Removes shared full-sheet dimension forcing from the module panel.
- Keeps native module sizing and TornPDA touch behavior.


### v1.17.26 — TornPDA host-scroll contract
- Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling works normally while the translucent blur surface is preserved.

### v1.17.25 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v1.17.24 — Mobile top alignment
- Opens the script panel from the top of the TornPDA viewport.
- Uses the shared SakaLuX top-alignment contract.

### v1.17.23 — PDA top-aligned panel refinement

- Opens the SakaLuX panel from the top of the available Torn viewport.
- Improves compact Hub integration and mobile visibility.

### v1.17.21 — Shared Standalone ordering fix

- Uses the canonical SakaLuX standalone order including Company Intelligence.
- Unknown/new modules sort after known modules instead of before them.
- Keeps the mobile dock layout and Install SakaLuX Hub button readable.

### v1.17.19 — Item Market page-scope fix
- Restricted Item Market Intelligence to `sid=ItemMarket`.
- Removes stale market UI after navigation to Home, Profile, Eliminations or other pages.

### v1.17.16 — Hub detection fix
- Recognizes current Hub launchers/active marker and prevents standalone prompts while Hub is installed.

### v1.17.12 — Compact native S standalone launcher
- Added the compact native S launcher/shared standalone dock behavior.

### v1.17.8 — Violentmonkey Hub bridge
- Added isolated-context bridge support for detection, OPEN and ON/OFF.

### v1.17.7 — Travel-only panels
- Travel Session Summary and Best Route Basket now render only on Torn Travel pages.

### v1.17.6 — Inline panel signature
- Moved the SakaLuX author signature inside the module panel.

### v1.17.5 — Persistent SakaLuX signature
- Refined Market subtitle/close control and added the persistent linked author footer.

### v1.17.4 — Dedicated API Access panel
- Added the dedicated Market API Access panel and exact read-only key creation/validation flow.

### v1.17.3 — Unified Control Center visual system
- Adopted the shared SakaLuX panel/card/input/toggle visual language.

### v1.17.2 — PC Hub detection
- Added persistent installation support for PC/Tampermonkey detection.

### v1.17.1 — Page isolation cleanup
- Prevented Market Intelligence from rendering on Torn Items or player profile pages.

### v1.17.0 — Native Hub Power API
- Added `setEnabled`, `toggleEnabled` and `isEnabled`, plus shared-Hub-key preference with standalone fallback.

## Changelog

### v1.17.22

- Performance/UI optimization: tunes high-frequency DOM/update paths and applies the shared SakaLuX Hub-style UI foundation across standalone controls without changing market logic.

