# Changelog

## Bounty Hunter v0.3.7
- Live status now falls back to Torn API v1 basic when API v2 basic does not expose a usable status, fixing Traveling/Abroad targets showing as `Status ?`.
- Hospital window is now strict: when set to 5 minutes, hospital targets are shown only when a valid release timestamp exists and is within 5 minutes. Unknown hospital release times are hidden instead of being treated as 0 minutes.
- Live enrichment checks at least 24 likely beatable candidates (up to 40) so displayed targets are much less likely to remain unverified.
- Travel destination metadata is preserved on enriched targets.

## Bounty Hunter v0.3.8
- Beatable-only is now status-strict: Unknown status targets are never shown as attackable.
- Hospital window no longer has a watchlist bypass; a 5-minute setting strictly hides hospital targets with more than 5 minutes remaining or without a valid release timestamp.
- Live status validation now checks candidates progressively until it finds enough genuinely attack-ready targets instead of validating only a fixed top-24 reward list.
- Status lookup now tries multiple Torn v2/v1 basic/profile routes for better TornPDA compatibility.

## Bounty Hunter v0.4.0
- Embedded SakaLuX Shared Core v1 into the standalone Bounty Hunter build.
- Registered Bounty Hunter in Shared Core settings protection and dock ordering.
- Settings/cache storage now uses Shared Core storage when available, with localStorage fallback.
- Torn/FFScouter requests now consistently benefit from the Shared Core API broker, request dedupe, TTL cache, retry/backoff, concurrency control and route-scoped cancellation.
- Enabled the Shared Core Hub skin and added a Bounty-specific professional UI layer using the same SakaLuX design tokens.
- Tightened mobile spacing, card hierarchy, filters, controls, focus states and footer/list readability.
- Added Shared Core performance debounce plumbing for future incremental renders.

## Bounty Hunter v0.4.1
- Adds the compact SakaLuX footer used by the other modules: SEND MONEY, SEND ITEMS and Made with ❤️ by SakaLuX [2380374].
- Donation buttons and author link open the SakaLuX Torn profile, matching Script Hub behavior.
- Footer styling follows Shared Core / Hub tokens and remains compact on TornPDA.
## Bounty Hunter v0.4.2
- Fixed the v0.4.1 TornPDA layout regression where the donation footer became a sibling of the panel and squeezed the Bounty Hunter UI into a narrow left column.
- Donation footer now lives inside the panel section and spans its full width.
- Hub/Shared Core professional skin now applies to the actual panel section instead of styling the full-screen overlay.
- Preserves SEND MONEY, SEND ITEMS and Made with ❤️ by SakaLuX [2380374].
## Bounty Hunter v0.4.3
- TornPDA/mobile panel now uses almost the full available screen: full width minus 8px and viewport height minus the top app area.
- Fixed the mobile media rule that was shrinking the full overlay itself.
- Target results now flex to fill remaining space and scroll independently.
- Footer remains compact at the bottom while results keep maximum usable space.

## Bounty Hunter v0.4.4
- Added reusable Shared Core v1.2.0 workspace layout helper.
- Bounty Hunter now fills the usable TornPDA viewport from the top while reserving the bottom chat/navigation zone.
- Uses visualViewport so panel geometry stays correct across phone viewport changes.
## Bounty Hunter v0.4.5
- Aligns the mobile workspace with Script Hub: top 0, side 4px and bottom reserve 36px so the panel reaches down to just above the TornPDA chat/navigation area.
- Removes overlay and footer blur/dim effects.
- Active filter/toggle chips now use a clear orange ON state; inactive controls stay dark.
- Adds aria-pressed/data-state to filter chips for reliable visual/semantic state.
- Shared Core updated to v1.2.1 with Hub-aligned workspace defaults for reuse by other modules.
## Bounty Hunter v0.4.6
- Fixed filter/toggle controls that visually remained dark even when enabled.
- Active controls now render orange through both high-specificity CSS and inline important state painting.
- Added mobile pointer/touch safeguards so taps reliably execute on TornPDA.

## Bounty Hunter v0.4.7
- Added rate-limit-aware Torn API paging.
- Stops duplicate broker/direct/fallback calls on Too many requests / HTTP 429.
- Full-board pages are paced at ~950ms and cached for 2 minutes.
- Activates a 65-second cooldown after a rate-limit response and reuses the last successful board cache during cooldown.
- Keeps partial progress instead of discarding it.
## Bounty Hunter v0.5.0
- Major scanner optimization release.
- Adds adaptive API pacing based on latency and rate-limit feedback.
- Adds resumable/incremental full-board scanning with persisted next offset and partial progress.
- Adds a separate 12-hour per-target FFScouter cache for FF/BS estimates.
- Keeps live Torn status on a short cache and prioritizes relevant beatable candidates.
- Adds live progress UI for board scan, FFScouter, status enrichment and API cooldown.
- Expands Script Hub health diagnostics and synchronizes the module info/release description.
- Fixes the canonical installed-version fallback to report 0.5.0 instead of the stale 0.4.2.
## Bounty Hunter v0.5.1 + Script Hub v1.9.91
- Bounty Hunter public distribution moves to GreasyFork #598988; GitHub remains the source repository.
- Shared Hub API key creation now includes Torn: Bounties.
- Hub API CHECK validates Bounties access and reports a specific missing-permission error.
- Bounty Hunter separates transient rate-limit/cache warnings from fatal health errors, preventing false Hub API ERROR badges.
- Adds stale/capped FFScouter and live-status cache pruning.

## Bounty Hunter v0.5.2 + Shared Standalone Dock v1.0.1
- Adds Bounty Hunter to the common Standalone Dock.
- Removes Bounty Hunter chat/floating launchers.
- Dock no longer persists open state; closes on S, module selection, route change, outside tap, or after 8 seconds.
- Restores and rebinds the compact native S launcher.
