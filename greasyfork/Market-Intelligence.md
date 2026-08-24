# SakaLuX Market Intelligence

**Current version: v1.15.4**

**Greasy Fork:** script **592781**

SakaLuX Market Intelligence is a Torn PDA / Tampermonkey add-on for market and travel decisions, fully integrated with **SakaLuX Script Hub**.

## v1.15.4 — Torn PDA Price + Restock Accuracy

- Fixed compact travel prices such as `$3M` being interpreted as `$3`.
- Profit calculations now use Torn item-market `average_price` when available, matching the market-value style figure shown by Torn/Torn PDA more closely; the live floor listing remains cached separately.
- Added guards against corrupted restock history and impossible multi-million arrival-stock projections.
- Very short false restock intervals are ignored and projected stock is clamped to a sane travel-stock range.

## v1.15.3 — Torn PDA Arrival Basket No-Flicker

- Fixed Arrival Basket disappearing briefly during Torn PDA flight-page rerenders.
- The current panel remains visible while fresh data is fetched and is swapped only when the replacement is ready.
- Force refresh no longer clears Arrival Basket before async work completes.

## v1.15.2 — Torn PDA/Mobile Flight Detection Fix

- Fixed Arrival Basket / Arrival Stock failing to appear on Torn PDA/mobile flight screens.
- Recognizes `Remaining Flight Time` as a Travel page even if the URL is not `?sid=travel`.
- Supports Torn's city-form flight destinations such as **Ciudad Juarez → Mexico** and the equivalent cities for all travel countries.
- Supports the mobile text format `Torn to <city>. Remaining Flight Time - HH:MM:SS`.

## v1.15.1 — Travel Session Tracking Hotfix

- Fixed false session creation while the home Travel screen evaluates Best Route Baskets.
- Landed-session data is now recorded only from the actual foreign-country **BEST BUYS** view.
- Repeating a trip to the same destination now archives the previous session and starts a new one correctly.

## v1.15.0 — Travel Session Summary

- Added a local **Travel Session Summary** with up to 20 recent trips.
- Captures the Arrival Basket estimate while flying and the live BEST BUYS basket after landing.
- Shows estimated profit before landing, at landing and the resulting delta.
- Added **MARK PLAN BOUGHT** so the user can explicitly record the displayed basket as the plan they purchased. This is a local confirmation only; the script does not claim to verify later market sales or realized profit.
- The summary shows the active trip and five recent archived trips.
- Added a Settings toggle and **CLEAR TRAVEL HISTORY** control.
- Added session status/profit fields to `health()` and `travelSessionSummary()` to the public API.
- Session data stays local and is never uploaded to a SakaLuX server.

## v1.14.0 — Smart Auto Refresh After Landing

- Added smart post-landing refresh for foreign Travel shops.
- Detects actual shop item/stock changes and refreshes **BEST BUYS** only when the visible shop signature changes.
- Debounces Torn DOM mutations and ignores the script's own panels to avoid self-triggered loops.
- Uses a 12-second minimum refresh interval for PDA-friendly behavior.
- Item Market prices are force-refreshed at most once every 2 minutes; stock-only changes reuse the existing cache.
- Added a Settings toggle for **Smart refresh after landing**.
- Added landed refresh counters/timestamps to `health()` and `smartLandedRefresh()` to the public API.

## v1.13.0 — Arrival Basket Planner

- While flying, Market Intelligence now prepares the **best basket to buy immediately after landing**.
- Predicted stock combines current YATA stock with the script's locally learned restock timing and refill quantities.
- Uses your configured travel slots and optional Travel budget to optimize the basket.
- Recommended rows show **BUY × quantity**, current stock, estimated landing stock, profit per item, prediction confidence and planned total profit.
- Profitable alternatives are still shown below the selected basket.
- The panel shows planned slot usage, expected profit and optimization mode before landing.
- Added a dedicated Settings toggle and `arrivalBasket()` public API action.

## v1.12.0 — In-Country Best Buys

- Added a dedicated **Best Buys** board when you are already in an abroad destination.
- Provides at-a-glance buying guidance similar in usefulness to dedicated travel-helper scripts, using SakaLuX's own interface and calculations.
- Shows the optimized basket, planned spend, expected net profit, used travel slots and remaining budget.
- Ranks up to 12 profitable items.
- Items selected by the optimizer show **BUY × quantity**; other profitable choices appear as **ALT**.
- Each item shows current stock, abroad buy price, Item Market estimate, profit per item, ROI and profit contribution.
- Recommended items are highlighted and can be tapped to jump to the matching Torn travel-shop row.
- No automatic purchase is performed.
- Added a setting to enable/disable the in-country Best Buys board and added related fields to `health()`.

## v1.11.0 — Best Route Basket Optimizer

- Replaced the old one-item-per-route ranking with **Best Route Basket Optimizer**.
- Every destination is evaluated as a complete shopping basket.
- For each country, the script combines multiple profitable items while respecting:
  - configured travel slots,
  - current abroad stock,
  - optional Travel budget,
  - current/cached Item Market resale values,
  - configured market fee.
- With a cash budget, the same bounded optimizer used by Travel Buy Planner searches the most profitable affordable mix for that destination.
- With unlimited budget, the route basket uses the optimal slot-only highest-profit fill.
- Countries are ranked by the basket's estimated **profit per hour** using actual Torn flight times when available.
- Each Best Route Basket row shows destination, basket summary, number of item types, slots used, planned cost, profit/run and profit/hour.
- Tapping a route still selects that destination in Torn Travel.
- The 15-item live refresh pass now gives destinations a fair first candidate before spending the remaining refresh slots, reducing country bias without returning to the old 45-request Travel load.
- `health()` now exposes `bestRunBasketRoutes`, `bestRunBasketItems` and `bestRunBasketProfit`.

## v1.10.0 — Budget-Aware Best Travel Run

- Best Travel Run respects the configured **Travel budget ($)**.
- Each route is evaluated using only the quantity that can actually be purchased with the configured budget.
- Routes where the budget cannot afford even one unit are excluded from the ranking.
- Recommendations show planned buy quantity, total trip purchase cost and whether the route is **budget capped**.
- Profit per run and profit per hour are recalculated from the affordable quantity instead of assuming every route can fill all travel slots.
- The live Item Market refresh shortlist is also budget-aware, avoiding refreshes for routes that the configured budget cannot use.
- Budget calculations are applied consistently to both instant cached results and live-refreshed results.
- `health()` exposes `bestRunBudgetAware`, `bestRunAffordableRoutes` and `bestRunBlockedRoutes`.

## v1.9.0 — Travel Profit Optimizer

- Travel Budget Planner optimizes the item combination for **maximum estimated total net profit** under both slot and cash-budget constraints.
- Uses current stock and item buy prices together with the existing Item Market profit estimates.
- The budget optimizer uses a Pareto-frontier dynamic-programming approach rather than a dollar-by-dollar budget matrix.
- With no budget limit, the existing highest-profit-per-item fill remains because it is already optimal for a pure slot constraint.
- Planner clearly shows **OPTIMIZED** or **GREEDY** mode.
- When optimization beats the old greedy budget plan, the panel shows the additional expected profit gained.
- `health()` exposes optimizer mode and optimization gain.

## v1.8.0 — Travel Budget Planner

- Travel Buy Planner can use an optional cash budget in addition to travel capacity.
- Set **Travel budget ($)** in Settings; `0` keeps the old unlimited-budget behavior.
- Recommended quantities are automatically capped by both available slots and remaining budget.
- The planner shows total spend, expected net profit, remaining budget, used capacity and unused slots.
- Existing item jump/highlight behavior remains unchanged.
- `health()` exposes configured and unused planner budget.

## v1.7.0 — Travel Buy Planner

- Added an automatic **Travel Buy Planner** while abroad.
- Uses the configured travel capacity, current abroad stock and current/cached Item Market prices.
- Fills available slots with the highest estimated net-profit items first.
- Shows recommended quantity, buy price, total spend, expected net profit and ROI per planned item.
- Shows total spend, total expected profit, used slots and unused capacity.
- Tapping a planner row jumps to the corresponding abroad listing and highlights it.
- Reuses the Travel market results already being fetched, avoiding a second independent request pass.
- `health()` exposes planner items, planned cost, planned profit and used slots.

## v1.6.0 — Real Torn Flight Times

- Best Travel Run detects destination flight durations directly from Torn's Travel Agency page.
- Profit/hour ranking uses the player's currently displayed Torn travel times whenever they are available.
- Current travel modifiers are therefore reflected automatically instead of relying only on static baseline durations.
- Static flight times remain as a fallback if a destination time cannot be read.
- Fallback Flight Multiplier is used only for fallback times.
- Best Travel Run rows show the detected one-way flight time and whether it is actual or fallback.
- `health()` exposes how many actual destination times were detected and the active travel-time source.

## v1.5.0 — Item Market Intelligence

- Added local Item Market price history per item.
- Records floor/effective prices with a 5-minute minimum sample gap and retains up to 14 days / 120 samples.
- Shows recent price **trend**, **median**, **volatility** and effective-vs-floor **spread**.
- Adds **BUY NOW / FAIR / WAIT / LEARNING** signals from the current floor versus the locally observed range and trend.
- Includes a compact recent-price sparkline.
- Existing price watch thresholds remain available in the same panel.
- Added Item Market intelligence fields to `health()` and `itemMarketIntelligence()` to the public API.
- Price history stays local and creates no separate background polling.

## v1.4.0 — Bazaar Flip Intelligence

- Added a dedicated **Bazaar Flip Intelligence** board.
- Profitable Bazaar listings are ranked by estimated net profit after the configured market fee.
- The board shows buy price, Item Market price, net profit and ROI for the top 10 opportunities.
- Tapping a board row jumps to the matching Bazaar listing and highlights it.
- Existing per-item DEAL / NO FLIP labels remain available.
- Uses the existing cache-first market layer and bounded requests to avoid unnecessary API load.
- `health()` exposes Bazaar deal count, best profit and best ROI.

## v1.3.0 — Museum Set Intelligence

- Added full **Museum Set Intelligence**.
- Calculates each supported set's current Item Market value and estimated net proceeds after the configured market fee.
- Converts the Museum Points reward into a cash value using the Points Market rate captured by the script.
- Shows a direct **TURN IN SET** or **SELL ITEMS** recommendation.
- Shows the absolute dollar advantage and percentage edge of the better option.
- Supports Arrowhead, Medieval Coin, Patagonian Fossil, Meteorite Fragment, Vairocana Buddha, Ganesha, Shabti, Senet, Companion Script and Egyptian Amulet rewards.
- Missing market data is labelled instead of producing a false recommendation.
- A missing/stale Points Market rate is clearly indicated with a button to open Points Market.
- Added a 30-day local Torn item-catalog cache for Museum member resolution.
- Added `museumIntelligence()` and `goToMuseum()` to `window.SakaLuXMarketIntelligence`.
- Added Museum status fields to `health()` and a **MUSEUM** Hub quick action.

## v1.2.1 — Travel Performance Update

- Travel is **cache-first**: cached market data can paint Best Travel Run immediately after YATA loads.
- Live Item Market refresh work is limited to a prioritized **15-item shortlist** instead of up to 45 items.
- Arrival Stock refreshes a prioritized **12-item shortlist**.
- The smaller live shortlist runs at concurrency 6.
- Cached Travel prices may be reused for up to 6 hours for the instant first paint; refreshed shortlist values replace them afterward.
- Best Travel Run shows whether it is displaying instant cache data or the live-refreshed shortlist.
- MutationObserver rescans are throttled on Travel and SakaLuX-owned DOM changes are ignored, reducing repeated work during Torn page hydration.
- `health()` exposes Travel cache hits, refresh count and skipped observer rescans.

## v1.2.0

- Added **Arrival Stock Intelligence** while flying.
- Detects the destination and remaining flight time from Torn travel data, with a page fallback when needed.
- Combines current YATA destination stock with live Torn Item Market prices before landing.
- Shows the best items to target on arrival, including current stock, estimated stock on arrival, likely/possible restocks before landing, prediction confidence and projected profit per travel run.
- Stock learning records observed refill quantity as well as refill timing.
- Learned refill timing is based on the local median interval between observed restocks.
- Learned refill quantity is based on the local median increase seen when stock refills.
- When there is not enough history, the result is explicitly marked **LEARNING** instead of presenting a false exact prediction.
- Added an **Arrival-stock prediction while flying** toggle in Settings.
- Added `arrivalPrediction()` to the public `window.SakaLuXMarketIntelligence` API.

## v1.1.1

- Best Travel Run recommendations are directly actionable.
- Tap any recommended route and the script automatically selects that destination in Torn's Travel Agency list.
- Supports Torn destination labels such as **Cayman Islands**, **United Kingdom** and **UAE** while keeping internal SakaLuX/YATA destination names.
- Added keyboard activation and button-like route feedback.
- Added `selectDestination(destination)` to the public Hub API.

## v1.1.0

- Added **Best Travel Run** to the Torn Travel home screen.
- Uses public YATA abroad stock/buy-price data together with live Torn Item Market prices.
- Ranks destinations by estimated profit per hour.
- Added configurable travel capacity/slots and flight multiplier.
- Added stock/restock ETA intelligence with local learning.
- Added **BEST RUN** quick action in SakaLuX Script Hub.

## v1.0.0

- Travel profit intelligence using current Torn Item Market listings.
- Bazaar deal detection with estimated net resale profit after the configured market fee.
- Item Market floor/effective-price panel.
- Local item watchlist with per-item price thresholds.
- Inventory estimated net market value and stack value.
- Points Market rate capture for later Museum/points calculations.
- Initial Museum intelligence surface.
- Market price caching, bounded live requests and limited concurrency for PDA friendliness.
- Manual API-key fallback outside Torn PDA.
- Full `window.SakaLuXMarketIntelligence` API for Script Hub detection and quick actions.

## Stock and arrival prediction accuracy

The script does not invent a guaranteed refill time or guaranteed future stock. It learns from stock increases observed while the script is active.

When enough real observations exist, the arrival panel uses the learned median restock interval and median refill quantity. Until enough history exists, the prediction is labelled **LEARNING** / **possible**.

Actual stock can still change before landing because other players may buy items after the latest YATA observation.

## Privacy / data

SakaLuX Market Intelligence remains local-first. Stock history, refill quantities, watchlist, price history and market cache are stored locally in the browser/PDA. No observations or travel-session history are uploaded to a SakaLuX server in v1.15.0.

Current external data sources used by this version:
- Torn API for Item Market listings and the player's own travel information.
- YATA public travel export for current abroad stock and buy prices.

## Planned next modules

- Optional SakaLuX community price/restock network after the local version is stable.
