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
