# 📊 SakaLuX Stock Manager & Advisor

> Main SakaLuX module, registered in Script Hub and the standalone dock. GitHub is the canonical source; public installs and updates are delivered through Greasy Fork.

## Current version
**v0.8.8**

## What it does
- Stock vault target selection directly from Torn Stocks.
- Vault Max / Vault Keep, Withdraw / Withdraw All and Benefit Lock protected-share floors.
- Torn API sync for money, portfolio positions and stock catalogue, with dedicated API Access management.
- Portfolio dashboard, cost-basis coverage, unrealized P/L, quick BUY/SELL, favorites, sort/filter and transaction history.
- ROI / next-benefit Advisor with marginal APR, payback and bank comparison.
- Financial Advisor with benefit income per day/month/year, configurable daily costs, net profit, Best ROI and Best Affordable cards, exclusions and bank-period comparison.
- Automatic bank-rate capture when a supported Torn Bank page exposes 1w / 2w / 1m / 2m / 3m rates; manual APR remains the fallback.
- Technical Trade Assistant using locally collected 24H / 1W / 1M history, RSI 14, EMA 20 / EMA 90 and Bollinger bands.
- Portfolio Simulator for no-trade SELL-excess → BUY-target scenarios while preserving Benefit Lock.
- Smart Rebalance Engine that builds portfolio-wide preview plans from free shares only.
- Persistent SAFE / BALANCED / AGGRESSIVE Smart Rebalance strategy profiles.
- Guided rebalance preview/execution, Dry Run, Target Lock, action log and global PANIC cash-to-stock workflow.
- Shared Script Hub / Standalone Dock integration and TornPDA-first UI.

## Current release note

**v0.8.8 — Release metadata synchronization**
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Shares one active API synchronization across overlapping refresh requests.
- Twenty concurrent refreshes use three requests instead of sixty in the synthetic network regression.
- Recovers after offline, HTTP 429 and malformed JSON errors; portfolio data and explicit trading safeguards are preserved.
## Recommended
- Keep **Dry Run ON** while checking a new configuration.
- Keep **Benefit Lock ON** when benefit blocks must not be touched.
- Review every Smart Rebalance proposal before using the separate guided execution controls.
- Install/update the public build through Greasy Fork script 596192.

## Privacy
- Settings, stock history, favorites, transaction history and advisor state are stored locally in the userscript/browser environment.
- The configured Torn API key is used only for the Torn data required by the module.
- Export/import excludes the API key.
- The module does not use an external historical-price service; technical history grows locally while the module is used.

## Important
- Advisor scores, ROI, technical signals, benefit values and rebalance plans are decision-support estimates, not guaranteed outcomes.
- Smart Rebalance and Portfolio Simulator do not automatically submit trades.
- Guided execution remains protected by the module's confirmation, Dry Run, cooldown and Benefit Lock safeguards.
- Torn DOM structure, stock endpoints or API response formats can change and may require a module update.

## Installation and Hub integration
- GitHub remains the canonical source repository; Greasy Fork is the public install/update channel.
- Namespace and existing local-storage keys are retained so settings, API key and cached data survive normal updates.
- Script Hub provides OPEN, REFRESH, ON/OFF, INFO and NEW.
- The standalone dock can open the same native panel when Hub is absent.
- The ordinary Stock Manager launcher is hidden while Hub is present; the explicit PANIC action remains available while Stocks is enabled.
- OFF disconnects runtime observation, clears polling, removes inline/row controls and blocks new orders. An already submitted request is not cancelled.

## License
**All Rights Reserved — SakaLuX [2380374]**

## Release history / Changelog


### v0.8.8 — Release metadata synchronization
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Shares one active API synchronization across overlapping refresh requests.
- Twenty concurrent refreshes use three requests instead of sixty in the synthetic network regression.
- Recovers after offline, HTTP 429 and malformed JSON errors; portfolio data and explicit trading safeguards are preserved.

### v0.8.7 — Extended performance validation
- Overlapping API refreshes share one synchronization. A synthetic burst of 20 refreshes needs three requests instead of sixty and recovers after offline, HTTP 429 and invalid JSON responses.

### v0.8.6 — Performance and TornPDA smoothness

- Uses constant-time Hub detection and reuses unchanged standalone dock rows.
- Ignores unrelated chat/dock/footer changes in standalone maintenance.
- Preserves busy-page mounting, portfolio data and trading safeguards.
- Synthetic DOM and Chromium performance coverage; complete previous-version backup included.


### v0.8.5 — TornPDA panel recovery
- Prevents continuous page/chat mutations from postponing panel mounting indefinitely.
- Skips hidden stock lists and relocates the panel when Torn loads or replaces content.
- Preserves settings, profiles and trading safeguards.
- Full-userscript DOM regression covers busy pages, hidden/delayed lists, replaced content and route navigation.

### v0.8.4 — Rebalance Strategy Profiles
- Added persistent SAFE, BALANCED and AGGRESSIVE Smart Rebalance profiles.
- Added 10% / 20% / 35% per-move caps and 2 / 4 / 6 suggested-move limits by profile.
- Added profile-specific score thresholds and technical/benefit/tier/affordability weighting.
- Preserved Benefit Lock, free-share-only sell sources and preview-only planning.
- Synchronized userscript/runtime, `scripts.json`, INFO/release metadata and documentation to v0.8.4.

### v0.8.3 — Smart Rebalance Engine
- Added portfolio-wide SELL → BUY planning across detected holdings.
- Uses only free shares as sell sources so protected Benefit Lock shares remain untouched.
- Ranks source and target stocks using local technical score, benefit yield and tier context.
- Shows capital, share counts, score delta, technical delta, benefit delta and target-tier movement.
- Added RECALCULATE to refresh the local technical snapshot before rebuilding the plan.
- Remains preview-only; no automatic trade is submitted.

### v0.8.2 — Portfolio Simulator
- Added BEFORE → AFTER What-if comparison.
- Added safe reallocatable coverage while respecting Benefit Lock.
- Added benefit-yield and local technical-score deltas, target-tier movement and unused-cash/share-rounding visibility.
- Simulator remains preview-only and never submits trades.

### v0.8.1 — Technical Trade Assistant
- Added richer 24H / 1W / 1M SVG chart with Price, EMA20, EMA90 and Bollinger overlays.
- Added selected-window momentum, RSI 14, Bollinger lower/mid/upper readouts and a multi-factor technical score.
- Added BUY BIAS / SELL BIAS / WATCH / NEUTRAL states and local-history coverage diagnostics.

### v0.8.0.1 — Stabilization & TornPDA polish
- Hardened local technical-history parsing, pruning, de-duplication and storage fallback.
- Persisted Financial Advisor and Simulator controls while typing with debounced rerenders.
- Added narrow-screen overflow protection and isolated advisor render paths.

### v0.8.0 — Advisor Suite
- Added Financial Advisor, automatic bank-rate capture, Technical Trade Assistant and Portfolio Simulator foundations.
- Synchronized the main version/runtime/registry/documentation surfaces.

### v0.7.17 — Shared standalone integration
- Integrated Stock Manager into the shared SakaLuX standalone dock and current Hub module contract.

### v0.7.12 — Readable full-width native stock cards
- Moved per-stock controls into full-width companion cards for better TornPDA readability.

### v0.7.8 — Greasy Fork update channel
- Moved public installs and automatic updates to Greasy Fork while retaining GitHub as canonical source.

### v0.7.7 — Main module promotion and Hub integration
- Promoted Stock Manager & Advisor into the main SakaLuX module set and added Hub power/open/refresh integration.

### v0.7.5 — Performance & Hub-style UI
- Reduced high-frequency SPA observer work and aligned the UI with the shared SakaLuX visual foundation.

### v0.7.3 — Inline workspace/runtime fixes
- Restored Advisor, Trade Assistant and Rebalance Preview behavior in Compact mode and hardened Dry Run handling.

### v0.7.2 — API, inline layout & rebalance fixes
- Migrated stock sync to current Torn API v2 endpoints and hardened guided rebalance calculations/confirmations.

### v0.7.1 — Roadmap completion
- Added Favorite Targets, Sell → Cash, Transaction History, configurable near-benefit threshold and guided Execute Rebalance.

### v0.7.0 — UX, search, backup & diagnostics
- Added stock search, Compact mode, local export/import and live diagnostics.

### v0.6.x — Safety/watchlist foundation
- Added Target Lock, favorites, near-benefit alerts and persistent safety controls.
