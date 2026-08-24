# SakaLuX Market Intelligence

**Current version: v1.1.0**

**Greasy Fork:** script **592781**

SakaLuX Market Intelligence is a Torn PDA / Tampermonkey add-on for market and travel decisions, fully integrated with **SakaLuX Script Hub**.

## v1.1.0

- Added **Best Travel Run** to the Torn Travel home screen.
- Uses public YATA abroad stock/buy-price data together with live Torn Item Market prices.
- Ranks destinations by estimated profit per hour.
- Shows item, destination, current stock, estimated profit per run and estimated profit per hour.
- Added configurable travel capacity/slots and flight multiplier.
- Added **stock + restock ETA intelligence**.
- Stock observations are stored locally per destination/item.
- Real stock increases are learned as restock events.
- After enough observations, next refill ETA is estimated from the learned median restock interval.
- Before enough history exists, sold-out items show a clearly-labelled **possible restock** estimate based on the next quarter-hour tick, rather than claiming an exact refill time.
- Landed Travel overlays now show current stock and refill information directly beside profit data.
- Added **BEST RUN** quick action in SakaLuX Script Hub.
- Official Greasy Fork update/download URLs are now embedded in the userscript metadata.

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

## Stock ETA accuracy

The script does not invent an exact stock refill time. It learns from stock increases observed while the script is active. Until enough real restock events are collected for an item/destination pair, the displayed quarter-hour estimate is marked as **possible**, not guaranteed.

## Privacy / data

SakaLuX Market Intelligence remains local-first. Stock history, watchlist and market cache are stored locally in the browser/PDA. No observations are uploaded to a SakaLuX server in v1.1.0.

Current external data sources used by this version:
- Torn API for Item Market listings.
- YATA public travel export for current abroad stock and buy prices.

## Planned next modules

- Improved arrival-stock prediction while flying.
- Museum set / Points value calculations.
- Expanded Bazaar and Item Market deal surfaces.
- Optional SakaLuX community price/restock network after the local version is stable.
