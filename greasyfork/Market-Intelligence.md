# SakaLuX Market Intelligence

**Current version: v1.2.0**

**Greasy Fork:** script **592781**

SakaLuX Market Intelligence is a Torn PDA / Tampermonkey add-on for market and travel decisions, fully integrated with **SakaLuX Script Hub**.

## v1.2.0

- Added **Arrival Stock Intelligence** while flying.
- Detects the destination and remaining flight time from Torn travel data, with a page fallback when needed.
- Combines current YATA destination stock with live Torn Item Market prices before landing.
- Shows the best items to target on arrival, including:
  - current stock,
  - estimated stock on arrival,
  - likely or possible restocks before landing,
  - prediction confidence,
  - projected profit per travel run.
- Stock learning now records observed refill quantity as well as refill timing.
- Learned refill timing is based on the local median interval between observed restocks.
- Learned refill quantity is based on the local median increase seen when stock refills.
- When there is not enough history, the result is explicitly marked **LEARNING** instead of presenting a false exact prediction.
- Added an **Arrival-stock prediction while flying** toggle in Settings.
- Added `arrivalPrediction()` to the public `window.SakaLuXMarketIntelligence` API.
- Health data now includes arrival rows, detected flight destination and remaining landing minutes.

## v1.1.1

- Best Travel Run recommendations are directly actionable.
- Tap any recommended route and the script automatically selects that destination in Torn's Travel Agency list.
- Supports Torn destination labels such as **Cayman Islands**, **United Kingdom** and **UAE** while keeping the internal SakaLuX/YATA destination names.
- Route rows have button-like hover/focus/active feedback.
- Added keyboard activation for route rows.
- Added `selectDestination(destination)` to the public Hub API.

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
- Landed Travel overlays show current stock and refill information directly beside profit data.
- Added **BEST RUN** quick action in SakaLuX Script Hub.
- Official Greasy Fork update/download URLs are embedded in the userscript metadata.

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

SakaLuX Market Intelligence remains local-first. Stock history, refill quantities, watchlist and market cache are stored locally in the browser/PDA. No observations are uploaded to a SakaLuX server in v1.2.0.

Current external data sources used by this version:
- Torn API for Item Market listings and the player's own travel information.
- YATA public travel export for current abroad stock and buy prices.

## Planned next modules

- Museum set / Points value calculations.
- Expanded Bazaar and Item Market deal surfaces.
- Optional SakaLuX community price/restock network after the local version is stable.
