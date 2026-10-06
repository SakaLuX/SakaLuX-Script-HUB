# SakaLuX Bounty Hunter

**v0.5.0**

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

## Current release note

**v0.5.0 — Adaptive scanner + resume + smart cache**
- Full-board scanning now adapts request pacing from observed API latency and rate-limit feedback.
- Scan progress is persisted, so an interrupted/rate-limited board scan can resume from its last offset instead of always restarting.
- FFScouter FF/BS estimates use a dedicated per-target cache for up to 12 hours; live Torn status stays short-lived.
- Adds live progress indicators for board paging, FFScouter enrichment, live-status validation and API cooldown.
- Script Hub info/health diagnostics are synchronized with the current Bounty Hunter feature set.

## Changelog
### v0.5.0 — Adaptive scanner + resume + smart cache
- Adds adaptive full-board API pacing.
- Persists partial scan progress and next offset for resumable scans.
- Adds 12-hour per-target FFScouter FF/BS cache.
- Adds board/FF/status/cooldown progress UI.
- Expands Script Hub health diagnostics and updates module documentation.
- Fixes stale canonical installed-version fallback.

### v0.4.7 — Torn API rate-limit protection
- Adds a 65-second cooldown after Too many requests / HTTP 429.
- Stops duplicate broker/direct/fallback requests during rate limiting.
- Paces full-board pages at roughly one request per second.
- Extends board cache to two minutes and reuses the last successful full-board scan during cooldown.
- Keeps partial progress instead of discarding it.

### v0.4.6 — Reliable orange ON/OFF controls
- Fixes filter/toggle controls that visually stayed dark because generic button styles could override the active-state class.
- Active controls now use inline important painting plus high-specificity CSS for a clearly orange ON state.
- Inactive controls remain dark.
- Adds pointer-events and touch-action safeguards for TornPDA/mobile taps.

### v0.4.5 — Hub-aligned mobile workspace + clear toggle states
- Aligns the Bounty Hunter panel with Script Hub geometry on TornPDA.
- Removes blur/dim effects from the overlay and footer.
- Active toggles are orange; inactive toggles remain dark.
- Shared Core workspace defaults updated to v1.2.1.

### v0.4.4 — Shared Core workspace geometry
- Moves mobile panel positioning into Shared Core through applyWorkspaceLayout.
- Uses visualViewport to keep the panel stable across mobile viewport changes.
- Keeps the target list flexible while reserving the lower TornPDA navigation zone.

### v0.4.3 — Near-fullscreen TornPDA layout
- Expands the Bounty Hunter panel to almost the full mobile viewport.
- Makes the target list use the remaining vertical space with independent scrolling.
- Keeps header, filters and footer accessible.

### v0.4.2 — Footer/mobile layout repair
- Fixes the v0.4.1 footer layout regression that squeezed the panel into a narrow column.
- Moves the donation footer inside the panel and restores full-width content.

### v0.4.1 — SakaLuX donation footer
- Adds SEND MONEY, SEND ITEMS and Made with ❤️ by SakaLuX [2380374].

### v0.4.0 — Shared Core + professional Hub UI
- Embeds Shared Core and routes Torn/FFScouter requests through the shared API broker where available.
- Uses the shared SakaLuX skin, storage and performance helpers.
- Refactors the mobile UI toward the same visual system as Script Hub.

### v0.3.8 — Strict verified-status filtering
- Beatable only no longer accepts unverified Status ? targets.
- Hospital targets only pass when a valid release timestamp is known and falls inside the configured hospital window.
- Traveling, Abroad, Jail and Federal targets are excluded.

### v0.3.7 — Hospital-window and status fallback repair
- Adds stricter hospital-window filtering.
- Adds Torn API v1 basic fallback when v2 cannot provide a usable live status.
- Expands live-status validation of candidate targets.

### v0.3.6 — Travel/Abroad live-status repair
- Runs FFScouter before live-status enrichment so displayed candidates get validated first.
- Detects travel/destination/location status and excludes Abroad/Traveling targets from the attackable list.

### v0.3.5 — Reliable full-board paging + clearer target cards
- Follows Torn API v2 `_metadata.links.next` pagination instead of blindly requesting every numeric offset.
- Adds 250 ms page pacing and up to three attempts per page to reduce rate-limit failures on 4k+ bounty boards.
- Keeps already-fetched API data if a later page fails (`API partial`) instead of discarding everything and falling back to the small DOM list.
- Target cards now show `Status ?` instead of ambiguous `Unknown`; Live status can enrich it.
- Reward tooltip clarifies that the green amount is the combined reward of all grouped bounties on that player.

### v0.3.4 — Profile in new tab
- The blue Profile/person action now opens the selected Torn profile in a new tab/window instead of replacing the current Bounty Hunter page.
- Adds `noopener noreferrer` isolation for the new profile tab.

### v0.3.3 — Compact target-first UI + complete board paging
- Collapses advanced filters and toggles behind a single Filters button so bounty targets occupy most of the mobile panel.
- Keeps Search, Sort, Refresh and API access visible at all times.
- Raises the full-board paging ceiling from 20 to 100 pages and migrates the default to 60 pages, enough for boards well above 4,000 bounty rows.
- Stops automatically when the API returns a short page, so it does not request unused pages.
- Footer now distinguishes raw bounty records from grouped unique target players (`beatable / targets / bounties`).
- Preserves raw bounty count in cache and shows the same distinction in zero-result diagnostics.

### v0.3.2 — Full-board recovery + FF range repair
- Repairs the accidentally persisted `FF 1.0–1.0` range to the intended conservative `1.0–3.0` preset.
- Adds a one-tap `Safe FF 1–3` preset.
- Torn API requests now fall back from Shared Core broker to direct fetch instead of immediately dropping to DOM mode.
- Adds a second API v2 URL fallback (`/v2/torn?selections=bounties`) if the dedicated `/v2/torn/bounties` path fails.
- Keeps API errors visible in diagnostics so `DOM fallback` is actionable rather than silent.

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
