# 📊 SakaLuX Stock Manager & Advisor [EXPERIMENTAL]

> Experimental standalone build. **Not registered in SakaLuX Script Hub, Standalone dock, or GreasyFork.**

## Current version
**v0.1.0**

## What it does
- Stock vault target selection directly from the Torn Stocks page.
- Vault Max to move available on-hand cash into the selected stock.
- Vault (Keep) to preserve a configured cash amount while vaulting the rest.
- Withdraw a chosen cash value from the selected stock.
- Withdraw All with optional benefit-tier protection.
- Benefit Lock prevents withdrawals that would drop the detected benefit tier.
- Optional Torn API sync for money and portfolio data.
- Experimental portfolio advisor showing owned shares, current benefit tier, estimated cost to the next benefit tier and unrealized P/L when transaction data is available.
- Global **PANIC** button available from any Torn page.
- PANIC uses the configured vault target, navigates to Stocks when required, then buys the maximum affordable shares after the configured keep-cash amount.
- Optional Panic confirmation toggle.
- Mobile/TornPDA-first panel.

## Current release note
**v0.1.0** creates the first experimental SakaLuX stock-management build. It combines a custom stock vault manager/advisor workflow with a one-tap Panic cash-to-stock vault action. The script remains isolated from the public SakaLuX Hub registry while behavior and TornPDA compatibility are tested.

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
- Panic depends on the configured target being visible and tradeable on the Torn Stocks page.

## Planned roadmap
- **v0.2.x:** full portfolio cards, richer P/L, configurable withdrawal presets and transaction history.
- **v0.3.x:** benefit-value database and true ROI ranking.
- **v0.4.x:** Trade Assistant with buy/sell suggestions and liquidity-gap calculations.
- **v0.5.x:** bank comparison, daily income / cost model and benefit-aware portfolio optimizer.
- **v0.6.x:** hardened Panic flow, target lock, optional second fallback target and action log.
- Public/Hub integration only after the experimental build is stable.

## Changelog
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
