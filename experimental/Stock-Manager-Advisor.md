# 📊 SakaLuX Stock Manager & Advisor [EXPERIMENTAL]

> Experimental standalone build. **Not registered in SakaLuX Script Hub, Standalone dock, or GreasyFork.**

## Current version
**v0.7.2**

## What it does
- Stock vault target selection directly from the Torn Stocks page.
- Vault Max to move available on-hand cash into the selected stock.
- Vault (Keep) to preserve a configured cash amount while vaulting the rest.
- Withdraw a chosen cash value from the selected stock.
- Withdraw All with optional benefit-tier protection.
- Benefit Lock prevents withdrawals that would drop the detected benefit tier.
- Dedicated Torn API Key Manager with Save, Show/Hide, Test & Sync, Create Required Key and Clear controls.
- Torn API sync for money, portfolio positions and the public stock catalog.
- Portfolio dashboard with position count, market value, cash, known unrealized P/L, per-stock benefit tier and protected-share floor.
- Experimental portfolio advisor showing owned shares, current benefit tier, estimated cost to the next benefit tier and unrealized P/L when transaction data is available.
- Global **PANIC** button available from any Torn page.
- PANIC uses the configured vault target and buys directly from the current Torn page without navigating to Stocks.
- Optional Panic confirmation toggle.
- Mobile/TornPDA-first panel.

## Current release note

**v0.7.2** fixes Torn API key testing/sync with API v2 endpoints, repairs the inline Settings gear, moves advanced Sort/Filter/Watchlist/Rebalance controls below the preset/PANIC/settings area, and fixes NaN SELL quantities in Guided Rebalance.

## Experimental rules
- Do **not** add this script to `scripts.json` yet.
- Do **not** add it to the shared Standalone dock yet.
- Do **not** publish it to GreasyFork yet.
- Keep a backup branch before every update after v0.1.0.
- Test stock-ID detection, Torn trade responses, benefit protection and Panic behavior before promotion to a public release.

## Design notes
The feature set is inspired by publicly visible stock-vault/advisor workflows in **Stock Manager & Advisor v7.6** and the Panic workflow in **Smart Panic**. This SakaLuX implementation is written as a separate experimental codebase and does not register as either original script.

The Panic behavior in this build means **cash → configured stock target**: it buys as many shares of the configured target as the available cash allows, optionally leaving the configured keep-cash amount on hand.

## Known experimental limitations
- Torn may change stock-page DOM classes or trade endpoints; detection must be tested on both desktop Torn and TornPDA.
- Average buy price / unrealized P&L depends on the transaction fields returned by the user's Torn API response.
- Advisor v0.1.0 ranks benefit progress and next-tier cost; a full ROI engine, benefit-value pricing, bank comparison and trade scoring are planned for later versions.
- Direct trade endpoints and returned response shapes remain experimental and must be verified in TornPDA with small transactions first.

## Planned roadmap
- **v0.4.x:** refine benefit values, transaction history, withdrawal presets and Trade Assistant liquidity planning.
- **v0.5.x:** refine optimizer, income/cost modelling, rebalance preview and capital-allocation scenarios.
- **v0.6.x:** hardened Panic flow, target lock, optional second fallback target and action log.
- Public/Hub integration only after the experimental build is stable.

## Changelog
### v0.7.2 — API, Inline Layout & Rebalance Fixes

- Migrated API sync to current Torn API v2 endpoints: `user/money`, `user/stocks`, and `torn/stocks`.
- Added normalization for the v2 user stocks array so existing portfolio/benefit logic continues to work.
- API test errors now include the failing endpoint/permission message in the panel status instead of only showing `Error`.
- Fixed Inline Settings gear: it now visibly toggles the settings block and scrolls it into view when opened.
- Moved the complete advanced block (Sort, Filter, Search, Favorites, Target Lock, Compact, Diagnostics, Export/Import, Favorite Targets, Near %, Cash Target, Sell → Cash, Execute Rebalance and History) below the presets/settings/PANIC area.
- Renamed the top Rebalance button to **Rebalance Preview** to clarify that it only previews a plan and never trades.
- Fixed the optimizer row `price` field that could resolve to a page-global DOM value and produce `SELL NaN`.
- Hardened rebalance calculations against non-finite prices/shares/proceeds.
- Execute Rebalance now shows every planned SELL symbol, exact share count, estimated proceeds, total estimated sale, cash before/after SELL, reserve, and the planned BUY before the first confirmation.
- Execute Rebalance still requires a second explicit confirmation before the BUY phase.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.7.1 — Roadmap Completion

- Added a separate **Favorite Targets** list, independent from the general stock watchlist.
- Added **Sell → Cash** with a configurable cash target; Benefit Lock limits shares that may be sold.
- Added dedicated persistent **Transaction History** (up to 200 BUY/SELL records), separate from the general Action Log.
- Transaction History includes BUY/SELL filter, text search, timestamp, shares, estimated value, status and server/log message.
- Added an inline **Near Benefit %** control; the existing near-benefit alert threshold is now user configurable.
- Added **Execute Rebalance**, a guided two-phase SELL → BUY flow using only free/excess shares for funding and preserving protected benefit floors.
- Guided Rebalance requires explicit confirmation before the SELL phase and a second explicit confirmation before BUY.
- Dry Run, trade serialization, 1.5 second cooldown and Action Log remain active for every guided transaction.
- Added a History shortcut directly in the Stock Market toolbar.
- API key remains excluded from Export/Import backup data.
- This closes the outstanding feature ideas previously listed for the 0.7 roadmap.

### v0.7.0 — UX, Search, Backup & Diagnostics

- Added stock search directly in the Stock Market workspace.
- Added Compact mode for smaller mobile/TornPDA footprint.
- Added one-click local settings + Action Log export/import (API key excluded).
- Added live Diagnostics line for API, Dry Run, locks, target, detected stocks/rows and portfolio positions.
- Preserves all v0.6 safety controls and v0.5 native row tools.

### v0.6.5 — Safety Center & Target Lock

- Added persistent Target Lock to prevent accidental target changes from stock rows.
- Added a consolidated safety snapshot/diagnostic state.
- Existing direct trades continue through confirmation, Dry Run, cooldown, serialization and Action Log.
- PANIC fallback and protected benefit-floor behavior remain active.

### v0.6.0 — Watchlist-aware Trading Workspace

- Favorites integrate with stock rows and filters.
- Added Favorites-only view and persistent watchlist state.
- Near-benefit status is shown directly beside benefit progress without executing trades automatically.

### v0.5.8 — Watchlist & Near-Benefit Alerts

- Added ★/☆ favorite toggle to every enhanced stock row.
- Added Favorites-only quick filter.
- Added configurable near-benefit calculation (default 90%) and visual ⚡ gap indicator.
- Favorites persist locally across Torn sessions.

### v0.5.7 — Stock Sort, Filters & Opportunity Highlights

- Added persistent **Sort** controls directly in the inline Stock Market workspace.
- Sort modes: Torn default, Owned shares, Position value, Best ROI, Closest benefit, Biggest P/L, Biggest loss and Excess shares.
- Added persistent **Filter** controls: All, Owned only, Profit only, Loss only, Excess shares and Has next benefit.
- Added one-tap **Reset** to restore Torn's default stock view and show all rows.
- Sorting reorders only detected Torn stock rows while keeping the rest of the page structure intact.
- Added visual ROI opportunity badges for the current top 3 benefit ROI candidates.
- The #1 ROI opportunity receives a stronger highlight in the original Torn stock list.
- Sorting/filtering preferences persist locally and are reapplied after Torn SPA redraws.
- Compatible with the v0.5.6 quick BUY/SELL controls, benefit progress, Dry Run and Benefit Lock.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.5.6 — Quick Row Trades & Benefit Progress

- Added a compact quick-trade selector to every enhanced stock row using the editable inline preset values plus **MAX**.
- Added direct **BUY** and **SELL** buttons beside the quick amount selector.
- Quick BUY converts the selected cash preset into shares using the live stock price.
- Quick BUY **MAX** spends only cash above the configured Vault Keep reserve.
- Quick SELL converts the selected cash preset into shares and never exceeds the available position.
- Quick SELL **MAX** sells only the sellable portion when Benefit Lock is enabled; protected benefit-floor shares are preserved.
- Every quick trade shows an exact confirmation with shares and estimated value before sending the order.
- Quick trades continue to use Dry Run, trade serialization/cooldown and the Action Log through the existing hardened trade path.
- Added a live progress bar for each stock showing percentage progress from the current benefit floor to the next detected tier.
- Added a progress label such as `63.2% to Tier 3` directly below the benefit status.
- Mobile/TornPDA layout keeps the amount selector and BUY/SELL controls on a dedicated full-width row.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.5.5 — Native Per-Stock Row Tools

- Added a SakaLuX metrics/action strip directly inside every detected Torn stock row.
- Shows symbol, live price, Owned shares, position value, Average Buy, unrealized P/L and P/L %.
- Shows current benefit tier and the number of shares needed for the next detected tier.
- Added per-stock **Target** button to change the active vault/PANIC target instantly.
- Added per-stock **Buy gap** with exact confirmation and the hardened BUY path.
- Added per-stock **Sell excess** that only sells shares above the currently protected benefit floor.
- Row BUY/SELL respects Dry Run, trade locking and existing API refresh behavior.
- Selected target is highlighted directly in the stock list.
- Row tools remount after Torn SPA redraws and use a compact TornPDA/mobile layout.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.5.4 — Native Metrics, API Mode & Inline Customization

- Total Invested now uses known transaction cost basis instead of incorrectly mirroring market value.
- Added Market Value as a separate live metric.
- Unrealized P/L now shows amount and percentage using known cost basis.
- Added cost-basis coverage indicator so incomplete API transaction history is obvious.
- Added inline **API Mode** ON/OFF switch; manual refresh respects it.
- Added editable withdrawal presets directly from the Stock Market card.
- Added inline settings to show/hide Advisor, Trade Assistant, Rebalance, PANIC and Full controls.
- Preset and control preferences persist locally.
- Kept the full modal for API setup, benefit values and diagnostics.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.5.3 — Inline Advisor / Trade / Rebalance Workspace

- Advisor, Trade Assistant and Rebalance now expand **inside the Stock Market dashboard** instead of forcing the full modal panel.
- Added persistent inline workspace tab state.
- Inline Advisor shows the top five ROI opportunities with tier, APR, gap, payback and bank comparison.
- Inline Trade Assistant shows Best ROI / Best Affordable candidates with **Target** and **Buy gap** actions.
- Buy gap continues to use the hardened trade path and respects Dry Run.
- Inline Rebalance shows the selected target, proposed SELL sources, funding status and shortfall without executing trades.
- Added inline refresh button for API/catalog/portfolio refresh.
- Full modal remains available for API setup, Benefit Values and detailed diagnostics.
- Throttled Torn SPA remounts to reduce repeated inline rendering on mobile/TornPDA.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.5.2 — Inline Stock Market Dashboard

- Added a compact **SakaLuX Stock Manager** dashboard directly inside the Torn Stocks page.
- Shows Total Invested, known Unrealized P/L and on-hand Cash.
- Added inline Target selector and live Owned shares display.
- Added inline Vault Max, Vault Keep, Withdraw and Withdraw All controls.
- Added 50K / 250K / 1M / 5M / 10M / 25M withdrawal presets.
- Added inline Benefit Lock, Dry Run and PANIC controls.
- Added quick links to API settings, full panel, ROI Advisor, Trade Assistant and Rebalance Preview.
- Inline dashboard can be collapsed and the preference persists locally.
- Dashboard remounts automatically after Torn SPA redraws and is removed outside the Stocks page.
- Existing full modal panel remains available for advanced settings and diagnostics.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.5.1 — Panel Recovery & Rebalance Preview

- Fixed the **Stock Manager** button/panel regression from v0.5.0.
- Panel is opened before any renderer runs, so one failed section can no longer keep the entire panel hidden.
- Added safe per-section rendering with console/status error reporting.
- Launcher and PANIC buttons are restored automatically after Torn SPA redraws.
- Added **Rebalance Preview** with configurable cash reserve.
- Preview identifies excess/free shares that could be released without crossing the Benefit Lock floor.
- Selects an ROI candidate and estimates required SELL sources, funding, shortfall, target shares, payback and approximate ROI shift.
- Rebalance Preview is analysis-only and never executes SELL/BUY automatically.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.5.0 — Portfolio Optimizer & Bank Comparison

- Added Portfolio Optimizer for held stocks.
- Splits holdings into Benefit-Lock protected shares and free/excess shares.
- Calculates protected, excess/free and below-threshold capital.
- Added manual Bank APR comparison and Minimum acceptable APR.
- Added payback days and percentage-point comparison versus bank to ROI candidates.
- Added Best ROI and Best Affordable optimizer opportunity cards.
- Flags positions as Protected, Excess shares, or Below threshold.
- Keeps Dry Run, Action Log, hardened trades and Panic v2 protections.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.4.2 — Panic v2

- Added separate **primary** and **fallback** Panic stock targets.
- Fallback is used if the primary target cannot be resolved or cannot buy at least one share with the configured spend.
- Added Panic-only **Keep cash** independent from normal Vault Keep.
- Added **Maximum Panic spend**; `0` means unlimited.
- Added optional **PANIC uses 100% cash** mode, which ignores Panic keep/max limits.
- Added **Preview PANIC** with exact stock, share count, estimated spend, cash before and estimated cash remaining.
- Confirm Panic now uses the calculated preview values instead of a generic confirmation.
- Panic continues to buy directly from the current Torn page and remains protected by v0.4.1 trade locking/cooldown/Dry Run.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.4.1 — Trade Hardening & Safety

- Added global transaction lock so two BUY/SELL requests cannot run concurrently.
- Added 1.5-second anti-double-click cooldown.
- Added stricter HTTP / Torn-response validation and session-token validation.
- Added **Dry Run** mode: calculations and logs run, but no BUY/SELL request is sent.
- Added persistent local Action Log for BUY, SELL, errors and Dry Run simulations.
- Disabled trade controls while a real stock request is in progress.
- Added estimated transaction value to each action-log entry.
- Fixed a stale duplicate `renderAdvisor()` implementation that could override the ROI Advisor at runtime.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.4.0 — Benefit ROI & Trade Assistant

- Added benefit value models for item, cash, average-cache and manual-value stock benefits.
- Added Fetch Market Values for supported item benefits through Torn API item values.
- Added editable benefit value and payout-frequency overrides stored locally.
- Corrected active benefit-tier math to cumulative blocks: base + 2×base + 4×base, matching marginal-tier ROI calculations.
- Added Benefit ROI Advisor ranking next benefit tiers by estimated annual marginal ROI.
- Added affordability and missing-cash calculations.
- Added Trade Assistant cards for Best ROI and Best Affordable candidates.
- Added Set Target and user-confirmed Buy Gap actions. Buy Gap never auto-sells holdings.
- Kept PANIC direct-buy behavior and Benefit Lock protection.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.3.0 — API Key Manager & Portfolio

- Added a dedicated API Key section matching the SakaLuX module workflow.
- Added Save Key, Show/Hide, Test & Sync, Create Required Key and Clear controls.
- Added a prefilled Torn API-key creation link requesting user money/stocks and torn stocks selections.
- Added API connection status feedback and synchronized target-stock discovery from any Torn page.
- Added Portfolio summary: position count, market value, cash and known unrealized P/L.
- Added per-position shares, current value, average buy when available, benefit tier and Benefit Lock floor.
- Refreshes portfolio/advisor data after successful vault/withdraw actions when an API key is available.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

### v0.2.0 — Direct Panic Buy

- PANIC no longer redirects to the Stocks page.
- Resolves stock ID and current price from the Torn stocks API when DOM stock data is unavailable.
- Uses on-hand cash from the user API and submits the buy request directly from the current Torn page.
- Keeps confirmation and keep-cash safeguards.
- A failed direct trade stays on the current page and reports the error instead of redirecting.
- Remains experimental and is not registered in Hub, Standalone, or `scripts.json`.

### v0.1.0 — Experimental foundation
- Added stock scanning and target selection.
- Added Vault Max and Vault (Keep).
- Added Withdraw and Withdraw All.
- Added benefit-tier lock.
- Added optional Torn API portfolio/money sync.
- Added first Advisor view with next-benefit cost and experimental unrealized P/L.
- Added global Panic button.
- Added automatic navigation to Stocks for pending Panic actions.
- Kept the script completely outside Hub, Standalone and GreasyFork.

## Privacy / important
- Settings and cached portfolio data are stored locally in the browser/TornPDA userscript environment.
- The optional API key is stored locally by this experimental script.
- Trades are submitted to Torn's own stock-market page while the user is logged in.
- PANIC can cause an immediate stock purchase; select the target carefully before enabling one-tap use.

## License
**All Rights Reserved.**

Copyright © 2026 SakaLuX [2380374].
