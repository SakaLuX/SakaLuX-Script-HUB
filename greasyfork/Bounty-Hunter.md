# SakaLuX Bounty Hunter

**v0.3.1**

## Purpose
SakaLuX Bounty Hunter is a mobile-first helper for Torn's bounty board. It can scan the visible Torn board or, when a Torn API key is available, page through the full Torn API v2 bounty board and build one grouped target list.

## Features
- Safe and Profit modes.
- Smart / Reward / Hospital soon / Lowest FF / Lowest BS sorting.
- Player-name / ID search.
- Full-board Torn API v2 paging with configurable page limit.
- Optional live enrichment of top candidates through `/user/{id}/basic`.
- Automatic fallback to DOM scanning when API access is unavailable or fails.
- Minimum reward and maximum level filters.
- Okay / Hospital / Unknown status filters.
- Hospital release countdown and configurable hospital-window filtering.
- Reads FF / Fair Fight and BS / Battle Score hints from compatible helpers already visible in the Torn page when available.
- Optional maximum FF and maximum BS filters.
- Groups multiple bounties for the same player and totals their reward.
- Direct Attack and Profile buttons.
- Local watchlist, Watch-only mode and blacklist.
- Target alerts for valuable or watched targets.
- Optional browser notifications plus in-page TornPDA toasts.
- Persistent settings and short-lived API caches.
- Auto refresh with request throttling/cache.
- TornPDA-friendly bottom-sheet UI.
- Script Hub bridge and quick actions.

## API Access
The module first checks the shared Script Hub Torn API key and then falls back to the local Bounty Hunter key. Full-board loading uses Torn API v2 `/torn/bounties`. Live candidate enrichment uses `/user/{id}/basic` only for the highest-priority targets and is cached to avoid excessive requests.

## FF / BS intelligence
Bounty Hunter does not invent battle-stat estimates. If another compatible helper has already rendered `FF`, `Fair Fight`, `FFS`, `BS`, `Battle Score` or `Battle Stats` text into a visible bounty row, Bounty Hunter reads that value and can use it for sorting, filtering and Safe/Profit scoring. Missing values remain unknown.

## Hospital countdown
When Torn/API data exposes a hospital-until timestamp, Bounty Hunter shows a live one-second countdown. Hospital targets can be limited to a configurable release window so Safe mode does not fill with players who still have hours remaining.

## Alerts
Target alerts can notify when a matching target is Okay or is close to hospital release. Watched targets can bypass the normal reward threshold. A per-target cooldown prevents repeated alert spam.

## Changelog
### v0.3.1 — API panel + zero-match diagnostics
- Fixes the key/API button so the API panel opens immediately below the Bounty Hunter header instead of below the clipped results area.
- Reuses the active Torn/Hub API key for FFScouter by default, matching FFScouter's registered-key model.
- Adds a Test FFScouter button and visible FF-known / FF-beatable counters.
- Fixes Safe mode so API targets with temporarily unknown Torn status are controlled by Hide unknown instead of being silently removed.
- Migrates stale v0.2.x defaults (50k reward, 20s refresh, 8 pages, FF 0/0) to the intended v0.3.x defaults once.

### v0.3.0 — Chat launcher + beatable-only scan
- Adds a 🎯 Bounty Hunter button beside the Torn Chat V3 message composer; the floating button remains only as a bounty-page fallback.
- Full-board Torn API scanning can now run from any Torn page.
- Adds direct FFScouter bulk lookup (up to 205 targets per request) through `/api/v1/get-stats`.
- Adds `Beatable only`, enabled by default, with FF range 1.0–3.0 and unknown-FF targets excluded by default.
- Adds FFScouter key storage and reuses the original Bounty Hunter `bh_ffscouterKey` when already present.
- Raises the default auto-refresh interval to 60 seconds to reduce Torn API pressure.

### v0.2.2 — Live target intelligence and filtering
- Synchronized userscript header, canonical installed marker and runtime version to v0.2.2.
- Added live `/user/{id}/basic` enrichment for the top configurable number of candidates.
- Added live one-second hospital countdown updates while the panel is open.
- Added search by player name or ID.
- Added Smart, Reward, Hospital soon, Lowest FF and Lowest BS sorting modes.
- Added explicit Auto / API / DOM source selection.
- Added Watch-only mode and direct Profile action.
- Added separate Hub/Local API-key source reporting and expanded module health diagnostics.
- Preserved short caches, API→DOM fallback, FF/BS helper detection, Safe/Profit scoring and notifications.

### v0.2.0 — Full-board intelligence
- Added Torn API v2 full-board paging with configurable maximum pages and short cache.
- Added shared Hub API-key support plus standalone local-key fallback.
- Added automatic API → DOM fallback.
- Added hospital release timestamps/countdowns and release-window filtering.
- Added compatible FF / Fair Fight / FFScouter and BS / Battle Score hint detection from rendered bounty rows.
- Added optional Max FF and Max BS filters and risk-aware scoring.
- Added target alerts for high-value and watched players, with in-page toast and optional system notifications.
- Added API source/status diagnostics to the panel and public module health output.

### v0.1.0 — Initial module
- Added mobile-first bounty dashboard.
- Added Safe / Profit modes.
- Added reward, level and status filters.
- Added grouped rewards, watchlist, blacklist and direct attack links.
- Added Hub bridge and persistent settings.
