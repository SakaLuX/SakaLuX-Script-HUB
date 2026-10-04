# SakaLuX Bounty Hunter

**v0.2.0**

## Purpose
SakaLuX Bounty Hunter is a mobile-first helper for Torn's bounty board. It can scan the visible Torn board or, when a Torn API key is available, page through the full Torn API v2 bounty board and build one grouped target list.

## Features
- Safe and Profit modes.
- Full-board Torn API v2 paging with configurable page limit.
- Automatic fallback to DOM scanning when API access is unavailable or fails.
- Minimum reward and maximum level filters.
- Okay / Hospital / Unknown status filters.
- Hospital release countdown and configurable hospital-window filtering.
- Reads FF / Fair Fight and BS / Battle Score hints from compatible helpers already visible in the Torn page when available.
- Optional maximum FF and maximum BS filters.
- Groups multiple bounties for the same player and totals their reward.
- Direct Attack button.
- Local watchlist and blacklist.
- Target alerts for valuable or watched targets.
- Optional browser notifications plus in-page TornPDA toasts.
- Persistent settings and API cache.
- Auto refresh with request throttling/cache.
- TornPDA-friendly bottom sheet UI.
- Script Hub bridge and quick actions.

## API Access
The module first checks the shared Script Hub Torn API key (`SakaLuX_HUB_TORN_API_KEY`). A local Bounty Hunter key can also be saved from the 🔑 API panel as a standalone fallback. The full-board reader uses Torn API v2 `/torn/bounties` with `limit` and `offset` paging. If the API cannot be used, Bounty Hunter falls back to the currently loaded Torn bounty DOM.

## FF / BS intelligence
Bounty Hunter does not invent battle-stat estimates. If another compatible helper such as FFScouter/BSP has already rendered `FF`, `Fair Fight`, `FFS`, `BS`, `Battle Score` or `Battle Stats` text into a visible bounty row, v0.2.0 reads that value and uses it for filtering/scoring. Missing values remain unknown and are not treated as zero.

## Hospital countdown
When Torn/API data exposes a hospital-until timestamp, Bounty Hunter shows a live release countdown. Hospital targets can be limited to a configurable release window so Safe mode does not fill with people who still have hours remaining.

## Alerts
`Target alerts` can notify when a matching target is Okay or is within roughly five minutes of hospital release. Alerts use an in-page toast. System notifications are optional and require browser/TornPDA permission. A per-target cooldown prevents repeated alert spam.

## Safe mode
Prioritizes currently available targets, then hospital targets close to release. FF/BS limits, when enabled, are applied before scoring.

## Profit mode
Prioritizes total bounty value while weighting availability, hospital release timing, and any known FF/BS hints.

## Changelog
### v0.2.0 — Full-board intelligence
- Added Torn API v2 full-board paging with configurable maximum pages and short cache.
- Added shared Hub API-key support plus standalone local-key fallback.
- Added automatic API → DOM fallback.
- Added hospital release timestamps/countdowns and release-window filtering.
- Added compatible FF / Fair Fight / FFScouter and BS / Battle Score hint detection from rendered bounty rows.
- Added optional Max FF and Max BS filters and risk-aware scoring.
- Added target alerts for high-value and watched players, with in-page toast and optional system notifications.
- Added API source/status diagnostics to the Bounty Hunter panel and public module health output.

### v0.1.0 — Initial module
- Added mobile-first bounty dashboard.
- Added Safe / Profit modes.
- Added reward, level and status filters.
- Added grouped rewards, watchlist, blacklist and direct attack links.
- Added Hub bridge and persistent settings.
