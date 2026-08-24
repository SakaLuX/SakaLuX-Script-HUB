# SakaLuX Market Intelligence

**Current version: v1.0.0**

SakaLuX Market Intelligence is a local-first Torn PDA / Tampermonkey add-on for market and travel decisions. It is designed to work with **SakaLuX Script Hub** and does not depend on Valigia servers or copy its shared-data infrastructure.

## v1.0.0

- Travel profit intelligence using current Torn Item Market listings.
- Bazaar deal detection with estimated net resale profit after the configured market fee.
- Item Market floor/effective-price panel.
- Local item watchlist with per-item price thresholds.
- Inventory estimated net market value and stack value.
- Points Market rate capture for later Museum/points calculations.
- Museum intelligence shell ready for the next valuation module.
- Market price caching, bounded live requests and limited concurrency for PDA friendliness.
- Manual API-key fallback outside Torn PDA.
- Full `window.SakaLuXMarketIntelligence` API for SakaLuX Script Hub detection and quick actions.
- Shared optional SakaLuX Script Hub installation prompt with 24-hour **NOT NOW** cooldown.

## Privacy / data

v1.0.0 is **local-first**. It does not upload observations to a SakaLuX server. Market data is requested directly from Torn API and cached locally in the browser/PDA storage.

## Planned next modules

- Better Travel destination ranking and profit/hour calculations.
- Museum set / Points value calculations.
- Expanded Bazaar and Item Market deal surfaces.
- Optional SakaLuX community price network after the local version is stable.
