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

