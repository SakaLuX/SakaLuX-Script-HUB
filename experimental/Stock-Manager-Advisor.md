# 📊 SakaLuX Stock Manager & Advisor [EXPERIMENTAL]

> Experimental standalone build. **Not registered in SakaLuX Script Hub, Standalone dock, or GreasyFork.**

## Current version
**v0.4.0**

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

**v0.4.0** adds a benefit-value engine, marginal annual ROI ranking and the first SakaLuX Trade Assistant. Item-based benefits can load current Torn market values, cash benefits have editable defaults, manual overrides are supported, active benefit tiers use cumulative block math, and Buy Gap performs a user-confirmed direct purchase without automatically selling lower-ROI holdings.

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
- **v0.5.x:** bank comparison, daily income / cost model and benefit-aware portfolio optimizer.
- **v0.5.x:** bank comparison, daily income / cost model and benefit-aware portfolio optimizer.
- **v0.6.x:** hardened Panic flow, target lock, optional second fallback target and action log.
- Public/Hub integration only after the experimental build is stable.

## Changelog
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
