# 📈 SakaLuX Market Intelligence

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v1.17.71**

### License Manager v2 · 2026-10-10
- Shared Hub license broker, short FREE cache, and bounded PRO cache.
- Temporary network errors no longer count as confirmed FREE for upgrade prompts.
- Account/key switch protection and verification-result validation.
- Client-side entitlement guards are not tamper-proof; server operations require independent checks.



## Repository synchronization

- Verified: **2026-10-10**
- Canonical version: **v1.17.71**
- License: **All Rights Reserved**
- Canonical GitHub source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Market-Intelligence.user.js
- GreasyFork description source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Market-Intelligence.md
- GreasyFork page: https://greasyfork.org/scripts/592781
- Install/download URL: https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.user.js
- Update metadata URL: https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.meta.js

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

**v1.17.71 — 2026-10-10**
- Saved Best Run, Arrival Basket and Museum settings are not overwritten when PRO is absent.
- Premium views and calculations use effective license status and restore previously enabled features after renewed verification.

## Release history / Changelog

### v1.17.71 — 2026-10-10
- Saved Best Run, Arrival Basket and Museum settings are not overwritten when PRO is absent.
- Premium views and calculations use effective license status and restore previously enabled features after renewed verification.


### v1.17.69 — 2026-10-10
- Adds visible ✦ PRO labels for Best Travel Run, Arrival Basket Planner, and Museum Intelligence in Settings.
- Fixes intrusive Bazaar Flip Intelligence panel positioning; FREE visitors see a compact PRO teaser instead of premium ranking data.
- A locked feature opens the existing SakaLuX PRO dialog; FREE controls remain available.


### v1.17.68 — 2026-10-10
- Prevents FREE accounts from enabling premium Best Travel Run, Arrival Basket and Museum toggles.
- Checks license entitlement before saving ON state and opens the SakaLuX PRO dialog when locked.
- Keeps FREE switches available.



### v1.17.67 — 2026-10-10
- Adds a visible ✦ PRO badge to matched premium commands while leaving FREE commands accessible.
- Keeps existing SakaLuX PRO popup and entitlement checks unchanged.

### v1.17.66 — 2026-10-10
- Security audit: added internal entitlement checks to additional PRO-only execution paths rather than relying solely on button interception.
- Script remains a client-side userscript; JavaScript-level restrictions can be modified by the client.


### v1.17.65 — 2026-10-10
- Corrected duplicate async keyword after PRO entrypoint guard integration.
- Verified JavaScript source parses and GreasyFork metadata is retained.


### v1.17.64 — 2026-10-10
- Corrected invalid async declaration for the PRO Museum scanner; market indicators remain FREE.
- Client-side gating is not tamper-resistant; genuinely protected premium calculations must execute on a licensed backend.


### v1.17.64 — 2026-10-10
- Added direct execution-entry checks for covered PRO functionality, including stock rebalance, Bazaar bulk updates, Museum scan and Elimination FF/calibration.
- Retains basic FREE functions and GreasyFork distribution URLs.
- Remaining execution paths and browser integration still need verification; JavaScript alone is not a secure server-side paywall.


### v1.17.63 — 2026-10-10 · FREE/PRO
- FREE: Market price context; BUY/WAIT indicators; Basic watchlist.
- PRO: Bazaar Flip; Best Travel Run; Route Basket; Travel Planner; Museum.
- PANIC and other destructive execution paths retain explicit confirmation requirements. Client-side feature gates are not tamper-proof.


### v1.17.62 — 2026-10-09
- Added shared SakaLuX branded dialogs for informational, PRO and error notices.
- Replaced existing blocking alert messages with styled notices.
- Existing synchronous confirmations and prompts remain native for action safety.


### v1.17.61 — 2026-10-07
- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### v1.17.60 — Standalone Dock Runtime v1.1.3 status-bar fix
- Runtime-only maintenance update.
- Prevents Standalone from changing Torn's native status-list child count/order.
- Restores all native status icons while keeping the S launcher near cooldowns.

### v1.17.59 — Shared Standalone Dock Runtime v1.1.2 maintenance
- Runtime-only maintenance update.
- Embeds Standalone Dock v1.1.2 so all installed SakaLuX standalone modules share the repaired singleton behavior.
- No module feature changes.



### v1.17.58 — Release metadata synchronization
- Best Buys now detects the live Torn cash balance automatically, including a Torn-page fallback for PDA travel pages.
- Every Best Buys option is selectable instead of always using the first recommendation.
- The selected item persists per destination and recalculates quantity from live cash, travel slots and current stock.
- MARK PLAN BOUGHT now records the currently selected option and its calculated quantity.

### v1.17.57 — Automatic cash + selectable Best Buys
- Best Buys detects the live Torn cash balance automatically, with the visible foreign-travel page balance preferred and Torn API used as fallback.
- Every Best Buys candidate can be selected as the active plan instead of forcing the first recommendation.
- The selected candidate persists per destination and quantity is recalculated from live cash, travel slots and current foreign stock.
- MARK PLAN BOUGHT records the selected candidate and calculated quantity in the Travel Session.




### v1.17.56 — Performance update for Travel/TornPDA
- Performance update for Travel/TornPDA.
- Caches and deduplicates the full YATA travel export for 60 seconds.
- Throttles passive Travel scans by lifecycle state instead of allowing repeated heavy scans every few seconds.
- Keeps forced scans immediate for navigation, manual refreshes and meaningful landed-stock changes.

### v1.17.54 — Settings Schema v1 and safe automatic migrations
- Adds versioned settings schemas for every SakaLuX userscript through Shared Core v1.1.0.
- Automatically advances legacy settings through ordered per-version migrations without downgrading newer data.
- Keeps a last-known-good backup and restores it, or safely falls back to script defaults, when stored JSON is corrupt.

### v1.17.52 — Shared Core v1
- Centralizes shared infrastructure in the embedded SakaLuX Core.
- Adds permanent Shared Core/API broker regression coverage.
- Routes Market Intelligence API reads through the shared Request Broker while preserving Travel/Bazaar page behavior and strict Manage Bazaar isolation.


### v1.17.51 — Explicit Travel state machine
- Adds explicit `TORN_TRAVEL_AGENCY`, `IN_FLIGHT`, `LANDED_ABROAD` and `OTHER` travel states.
- Enforces deterministic panel scoping for Best Route, Arrival Basket, landed-country tools and Travel Session Summary.
- Cleans stale panels on SPA/TornPDA navigation and adds permanent regression coverage for the complete travel lifecycle.



### v1.17.50 — Release metadata synchronization
- Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.
- Deduplicates standalone registrations by module id before rendering.
- Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page.

### v1.17.49 — Best Route Basket only in Torn
- Restores strict Torn-side scope for Best Route Basket.
- Removes the basket immediately on landed foreign-country pages while preserving in-country travel tools.
- Keeps loading/no-profit visibility on Torn Travel itself.

### v1.17.48 — Force Best Route Basket on landed Travel pages
- Removed the scanTravel destination branch that skipped and then explicitly removed Best Route Basket after landing abroad.
- Basket is rendered before country-specific Best Buys/Planner work on all landed Travel pages.
- Added persistent loading/no-profit states so the panel never vanishes silently on a valid Travel page.
- Non-Travel cleanup still removes Basket and Travel Session Summary, keeping both strictly Travel-only.

### v1.17.47 — Best Route Basket while landed abroad
- Removes the destination-level suppression that hid Best Route Basket after landing abroad.
- Uses the Travel-page guard instead, so Hawaii/foreign-country screens can show the basket without leaking it to non-Travel pages.
- Keeps Travel Session Summary closed by default.

### v1.17.46 — Landed-abroad Travel panels + collapsed session summary
- Recognizes landed foreign-country views such as Hawaii as Travel in TornPDA/mobile.
- Keeps Best Route Basket and Travel Session Summary confined to Travel pages only.
- Forces Travel Session Summary closed by default on every render/navigation; the arrow is the only way to expand it.

### v1.17.45 — Strict Manage Bazaar isolation
- Zero Market Intelligence row/UI intervention in Manage your Bazaar / Manage items.
- Existing MI Bazaar badges/board are removed when Manage is detected.

### v1.17.44 — Bazaar add-item overlay isolation
- Stops Market Intelligence estimate badges from being injected into Bazaar add-item/sale rows that contain quantity and price editors.
- Removes already-rendered MI estimate badges as soon as the Bazaar sale picker is detected, including Torn SPA/TornPDA transitions.
- Keeps normal Items-page market estimates unchanged outside Bazaar sale-entry controls.

### v1.17.43 — Strict Travel-only inline panels
- Travel Session Summary and Arrival Basket now have hard render guards and can only mount when `detectPage()` is `travel`.
- Torn SPA navigation now removes stale travel cards immediately on Messages and every other non-Travel page.
- Prevents delayed MutationObserver/scan callbacks from recreating either panel outside Travel.




### v1.17.42 — Release metadata synchronization
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Shares active market lookups for the same item and API key.
- Shares active equipment fetches across overlapping loadout comparisons, including forced refreshes.
- Clears pending operations on success and failure so later requests recover; price estimates and explicit trade controls remain unchanged.

### v1.17.41 — Release metadata synchronization
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Shares active market lookups for the same item and API key.
- Shares active equipment fetches across overlapping loadout comparisons, including forced refreshes.
- Clears pending operations on success and failure so later requests recover; price estimates and explicit trade controls remain unchanged.

### v1.17.40 — Extended performance validation
- Coalesces overlapping per-item market requests and equipment fetches, including forced refresh calls.

### v1.17.39 — Performance and TornPDA smoothness

- Removes the multiple footer-repair timers scheduled for every page mutation.
- Scopes footer maintenance to the Market panel and ignores unrelated chat updates in scanning.
- Caches unchanged standalone dock rows and keeps travel/trading analysis unchanged.
- Synthetic DOM and Chromium performance coverage; complete previous-version backup included.


### v1.17.38 — Restore Elimination-style footer from Hub and standalone
- Restores the Elimination-style Market footer whether Market is opened standalone or from Script Hub.
- Removes the Hub suppression guard that could hide the Market-owned footer.
- Force-mounts one SEND MONEY / SEND ITEMS row and the linked SakaLuX author line.

### v1.17.37 — Elimination footer parity
- Copies the complete working Elimination Assistant donation/footer implementation into Market Intelligence, changing only the target panel selector/footer ID. Restores one native SEND MONEY / SEND ITEMS + Made with ❤️ footer.

### v1.17.36 — Restore native Market footer
- Restores SEND MONEY / SEND ITEMS and the Made with ❤️ author line inside Market settings opened through Hub.
- Removes the Market footer guard that incorrectly treated Hub-launched Market settings as a Hub-owned panel.
- Keeps Hub generic footer suppression for Market, so only one footer remains.

### v1.17.35 — Performance and release metadata audit
- Restricts donation-footer updates to the native module root; unrelated Torn and other-module DOM changes no longer schedule footer repairs.

### v1.17.34 — Full-width footer
- Extends the donation/author footer to the full panel width, compensates for the content padding and removes the bottom gap. Keeps 20px donation buttons and the mobile chat clearance.

### v1.17.33 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

### v1.17.32 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.

### v1.17.31 — Hub isolation
- Excludes Script Hub and its subtree from shared module styling/fullscreen rules; restricts footer routines to native module roots.

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

### v1.17.22 — Performance/UI optimization
- Performance/UI optimization: tunes high-frequency DOM/update paths and applies the shared SakaLuX Hub-style UI foundation across standalone controls without changing market logic.

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


### v1.17.53 — Foreign market inline toggle + stock parsing fix
- Adds a persistent **MI INFO: ON/OFF** button while landed abroad. Turning it OFF removes the per-item `MI Market / Net / Stock / next stock` rows without disabling Best Buys, planning, pricing or the rest of Market Intelligence.
- Reads stock strictly from Torn's **Stock** table cell / stock-labelled element. It no longer scans the whole item row, so numbers in names such as **Type 98 Anti-Tank** cannot be mistaken for stock.
- Synchronizes Market Intelligence runtime/version surfaces and fixes Script Hub's runtime display constant to **v1.9.88**.


### v1.17.55 — Travel performance pass
- Adds a 60-second YATA export cache with in-flight request deduplication.
- Throttles passive Travel rescans by lifecycle state: in-flight 10s, landed 12s, travel agency 15s.
- Keeps forced navigation/manual refreshes responsive while cutting repeated DOM scans and API work on TornPDA.
