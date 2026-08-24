# SakaLuX Script HUB — Update Information

Last updated: 2026-08-24

## Current versions

- SakaLuX Script Hub: **v1.8.5**
- SakaLuX Enhancer Guard: **v1.3.2**
- SakaLuX Bazaar Thanker - PDA: **v5.3.1**
- SakaLuX Mission Rewards: **v1.0.1**
- SakaLuX Market Intelligence: **v1.8.0** — Greasy Fork **592781**

## Latest changes

### SakaLuX Market Intelligence v1.8.0
- Added **Travel Budget Planner** on top of the existing Travel Buy Planner.
- Added a configurable **Travel budget ($)** field; `0` means unlimited budget.
- Recommended shopping quantities now respect both available travel slots and available cash budget.
- The planner automatically reduces quantities when the next item would exceed the configured budget.
- Shows configured budget, planned spend, remaining budget, expected net profit, used slots and unused slots.
- Keeps the existing direct jump/highlight behavior for recommended abroad items.
- Added `travelPlanBudget` and `travelPlanUnusedBudget` to `health()`.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.7.0.user.js`.

### SakaLuX Market Intelligence v1.7.0
- Added **Travel Buy Planner** for the abroad shop page.
- Builds an automatic shopping mix using the configured travel capacity and current destination stock.
- Ranks available items by estimated net profit per item and fills the available slots greedily with the best-profit items first.
- Shows recommended quantity for each item, unit buy price, total spend, expected net profit and ROI.
- Shows total planned spend, total expected profit, used slots and any unused capacity.
- Tapping a planner row scrolls directly to the matching abroad item and highlights it temporarily.
- Uses the same market cache/API results already fetched for Travel overlays, so it does not add a second independent round of requests.
- Added planner item/cost/profit/slot fields to `health()`.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.6.0.user.js`.

### SakaLuX Market Intelligence v1.6.0
- Added **real Torn Travel Agency flight-time detection** for Best Travel Run.
- Best Travel Run now reads the currently displayed one-way time for each destination directly from the Travel page when available.
- Actual detected times automatically include the player's current Torn travel modifiers, so profit/hour no longer depends on the old static baseline when Torn provides a time.
- Static `FLIGHT_MINS` values remain only as a safe fallback for destinations whose time cannot be detected.
- The existing Flight Multiplier setting is now explicitly a **Fallback flight multiplier** and is not applied on top of a real Torn time.
- Each Best Travel Run row shows its one-way flight duration and whether it is **actual** or **fallback**.
- The performance line shows how many destination times were detected from Torn.
- Added `actualFlightTimes` and `travelTimeSource` to `health()`.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.5.0.user.js`.

### SakaLuX Market Intelligence v1.5.0
- Added **Item Market Intelligence** with local price history per item.
- Records Item Market floor/effective prices locally with a 5-minute minimum sampling gap and keeps up to 14 days / 120 samples.
- Added **trend**, recent **median**, **volatility** and effective-vs-floor **spread** calculations.
- Added direct **BUY NOW / FAIR / WAIT / LEARNING** signals based on the current floor versus recent local history and trend.
- Added a compact 12-sample sparkline for quick price direction context.
- Existing per-item price watchlist remains available inside the same panel.
- Added Item Market signal/trend/volatility/sample fields to `health()` and `itemMarketIntelligence()` to the public API.
- No additional recurring API traffic is added: history is recorded from Item Market checks the script already performs.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.4.0.user.js`.

### SakaLuX Market Intelligence v1.4.0
- Added **Bazaar Flip Intelligence** with a dedicated ranked deal board.
- Scans Bazaar listings, compares buy price with current/cached Torn Item Market price, applies the configured market fee and ranks profitable flips by estimated net profit.
- Shows item, buy price, market price, profit and ROI for the top 10 deals.
- Tapping a deal scrolls directly to the matching Bazaar listing and highlights it temporarily.
- Keeps the existing per-item **DEAL / NO FLIP** overlays.
- Uses cache-first market data and refreshes through the existing bounded request system.
- Added Bazaar deal count, best profit and best ROI to `health()`.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.3.0.user.js`.

### SakaLuX Market Intelligence v1.3.0
- Added **Museum Set Intelligence**.
- Values the known Museum sets using current Torn Item Market prices and the configured market fee.
- Compares **net Item Market sale value** against the cash-equivalent value of the set's Museum Points reward.
- Gives a direct **TURN IN SET** or **SELL ITEMS** recommendation with the dollar advantage and percentage edge.
- Supports Arrowhead, Medieval Coin, Patagonian Fossil, Meteorite Fragment, Vairocana Buddha, Ganesha, Shabti, Senet, Companion Script and Egyptian Amulet rewards.
- Uses the Points Market rate captured by Market Intelligence; a missing/stale rate is clearly shown and links to Points Market.
- Added a 30-day local Torn item-catalog cache so set member IDs do not need to be rediscovered on every Museum visit.
- Added Museum set/recommendation fields to `health()` and `museumIntelligence()` / `goToMuseum()` to the public API.
- Added a **MUSEUM** quick action to Script Hub through `scripts.json`.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.2.1.user.js`.

### SakaLuX Market Intelligence v1.2.1
- Added **cache-first Travel rendering**: existing market prices are displayed immediately after YATA loads instead of waiting for every live Item Market request.
- Reduced Best Travel Run live refreshes from up to 45 item lookups to a prioritized shortlist of **15**.
- Reduced Arrival Stock live refreshes to a prioritized shortlist of **12**.
- Increased market-request concurrency from 4 to 6 for the smaller shortlist.
- Travel can reuse market cache up to 6 hours for the instant first paint, then replaces shortlist prices with live results.
- Added a small performance status line showing whether the board is using instant cache or the refreshed shortlist.
- Added Travel MutationObserver throttling and ignores SakaLuX-owned DOM changes, preventing the script from repeatedly rescanning itself while Torn hydrates the page.
- Added performance counters to `health()`: cache hits, live Travel refresh count and observer skips.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.2.0.user.js`.

### SakaLuX Market Intelligence v1.2.0
- Added **Arrival Stock Intelligence** while the player is flying.
- Detects destination and remaining flight time using Torn travel data, with a page-text fallback when needed.
- Pulls the current YATA stock for the destination and combines it with live Torn Item Market prices.
- Shows the best items to target on arrival, current stock, estimated arrival stock, likely/possible restocks before landing, confidence and projected profit per run.
- Stock history now also learns observed refill quantities in addition to refill timing.
- Learned refill timing uses local median intervals; learned refill quantity uses the local median observed refill amount.
- When there is not enough history, the panel clearly shows **LEARNING** instead of presenting an exact refill prediction as guaranteed.
- Added a new **Arrival-stock prediction while flying** setting.
- Added `arrivalPrediction()` plus arrival/flight fields to `window.SakaLuXMarketIntelligence.health()`.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.1.1.user.js`.

### SakaLuX Script Hub v1.8.5
- Fixed false **UPDATE AVAILABLE** states left behind by a cached check made before an add-on was updated.
- Cached update data is now considered fresh only when its recorded installed version still matches the version currently loaded.
- Hub cards, the **UPDATES** counter and the blinking HUB alert recalculate availability from **Latest vs Installed** before rendering.
- Added Market Intelligence v1.1.1 to the offline fallback registry.
- Added the `SakaLuX:MarketIntelligenceReady` integration hook.
- Added exact backup: `backups/SakaLuX-Script-Hub-v1.8.4.user.js`.

### SakaLuX Market Intelligence v1.1.1
- Best Travel Run rows are now actionable.
- Tapping a recommended route automatically finds and selects the matching destination in Torn's Travel Agency list.
- Added destination-name aliases for Torn labels such as **Cayman Islands**, **United Kingdom** and **UAE**.
- Added keyboard activation support for clickable route rows.
- Added subtle hover/focus/active styling so the route rows clearly behave like buttons.
- Added `selectDestination(destination)` to `window.SakaLuXMarketIntelligence`.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.1.0.user.js`.

### SakaLuX Market Intelligence v1.1.0
- Added **Best Travel Run** on the Torn Travel home screen.
- Uses current YATA abroad stock/buy-price data plus live Torn Item Market prices to rank travel opportunities.
- Shows recommended item, destination, current stock, estimated profit per run and estimated profit per hour.
- Added configurable **travel slots** and **flight multiplier** in Market Intelligence settings.
- Added local stock-history learning per destination/item.
- When a real stock increase is observed, it is saved as a restock event.
- After enough local restock observations are collected, the script estimates the next stock refill using the median learned interval.
- Until enough history exists, sold-out items show a clearly labelled next-possible quarter-hour restock estimate instead of pretending to know an exact refill time.
- Landed Travel item overlays now show current stock plus stock/restock ETA information.
- Added **BEST RUN** quick action to SakaLuX Script Hub.
- Added `@connect yata.yt` for the public travel export used by Best Travel Run.
- Changed userscript update/download metadata to the official Greasy Fork **592781** URLs.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.0.0.user.js`.

### SakaLuX Market Intelligence v1.0.0
- Added a new local-first market intelligence add-on written for the SakaLuX suite.
- Added Travel profit overlays using current Torn Item Market prices, net sell after configurable market fee, absolute profit and ROI.
- Added Bazaar deal detection with profitable/non-profitable flip verdicts.
- Added Item Market floor/effective-price panel and a local per-item watchlist.
- Added Items-page estimated net market value and stack value.
- Added Points Market rate capture and the initial Museum intelligence surface.
- Added bounded market requests, 10-minute local market cache and limited concurrency for PDA friendliness.
- Added Torn PDA API-key support plus manual API-key fallback.
- Added `window.SakaLuXMarketIntelligence` with Hub actions.
- Published on Greasy Fork as script **592781**.

### SakaLuX Script Hub v1.8.4
- Rebuilt the mobile **HUB** entry using Torn's real mobile navigation structure.
- The HUB item is mounted as its own navigation entry immediately before **Messages**.
- The skull icon reuses native Torn SVG sizing/theme and blinks without moving the navigation item.
- The floating circular Hub button remains only as fallback.

### SakaLuX Mission Rewards v1.0.1
- Changed `@match` to all Torn pages so the Hub can detect it globally.
- Improved mobile/PDA reward badges and added the shared Hub install prompt.

### SakaLuX Enhancer Guard v1.3.2
- Added a SakaLuX Script Hub install prompt with 24-hour NOT NOW cooldown.

### SakaLuX Bazaar Thanker - PDA v5.3.1
- Added the same optional SakaLuX Script Hub install prompt and cooldown.

## Central registry policy

`scripts.json` is only the registry of complementary SakaLuX add-ons that the Hub should discover and manage.

Every new complementary SakaLuX script must be added to `scripts.json` in the same release cycle.

The registry stores only information needed to identify, install, detect, update and launch add-ons. Hub metadata and Hub release notes do not belong in `scripts.json`.

## Update workflow

For every future script update:
1. Save the currently published source directly in `backups/`.
2. Include the old version number in the backup filename.
3. Do not create date subfolders.
4. Update the live source file on `main`.
5. If the updated script is an add-on, update its entry/version in `scripts.json`.
6. If a new add-on is created, add it to `scripts.json` immediately.
7. Update this `UPDATE-INFO.md` file with the new version and change summary.
8. Update the corresponding `greasyfork/*.md` additional-info file.
9. Keep Greasy Fork source synchronization pointed only at the live source files in the repository root.

## Backups available

- `backups/SakaLuX-Market-Intelligence-v1.7.0.user.js`
- `backups/SakaLuX-Market-Intelligence-v1.6.0.user.js`
- `backups/SakaLuX-Market-Intelligence-v1.5.0.user.js`
- `backups/SakaLuX-Market-Intelligence-v1.4.0.user.js`
- `backups/SakaLuX-Market-Intelligence-v1.3.0.user.js`
- `backups/SakaLuX-Market-Intelligence-v1.2.1.user.js`
- `backups/SakaLuX-Market-Intelligence-v1.2.0.user.js`
- `backups/SakaLuX-Market-Intelligence-v1.1.1.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.4.user.js`
- `backups/SakaLuX-Market-Intelligence-v1.1.0.user.js`
- `backups/SakaLuX-Market-Intelligence-v1.0.0.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.3.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.2.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.1.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.0.user.js`
- `backups/SakaLuX-Script-Hub-v1.7.0.user.js`
- `backups/SakaLuX-Enhancer-Guard-v1.3.1.user.js`
- `backups/SakaLuX-Bazaar-Thanker-PDA-v5.3.0.user.js`
- `backups/SakaLuX-Mission-Rewards-v1.0.0.user.js`
