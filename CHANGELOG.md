# Changelog

## Bounty Hunter v0.3.7
- Live status now falls back to Torn API v1 basic when API v2 basic does not expose a usable status, fixing Traveling/Abroad targets showing as `Status ?`.
- Hospital window is now strict: when set to 5 minutes, hospital targets are shown only when a valid release timestamp exists and is within 5 minutes. Unknown hospital release times are hidden instead of being treated as 0 minutes.
- Live enrichment checks at least 24 likely beatable candidates (up to 40) so displayed targets are much less likely to remain unverified.
- Travel destination metadata is preserved on enriched targets.
