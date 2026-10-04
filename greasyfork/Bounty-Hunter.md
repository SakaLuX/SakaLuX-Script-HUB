# SakaLuX Bounty Hunter

**v0.1.0**

## Purpose
SakaLuX Bounty Hunter is a mobile-first helper for Torn's bounty board. It scans the bounty rows already loaded by Torn and builds a compact hunt list without requiring a Torn API key.

## Features
- Safe and Profit modes.
- Minimum reward and maximum level filters.
- Okay / Hospital / Unknown status filters.
- Groups multiple bounties for the same player and totals their reward.
- Direct Attack button.
- Local watchlist and blacklist.
- Persistent settings.
- Auto refresh of the local board scan.
- TornPDA-friendly bottom sheet UI.
- Script Hub bridge and quick actions.

## Safe mode
Prioritizes targets currently Okay, then Hospital targets, and excludes unavailable/unknown states unless explicitly allowed.

## Profit mode
Sorts primarily by estimated bounty value with a small availability weighting.

## Important limitation
v0.1.0 scans the bounty rows that Torn has already loaded in the page DOM. It does not yet fetch every bounty page and does not yet use FFScouter / battle-score estimates. Those are planned for the next development stage.

## Changelog
### v0.1.0 — Initial module
- Added mobile-first bounty dashboard.
- Added Safe / Profit modes.
- Added reward, level and status filters.
- Added grouped rewards, watchlist, blacklist and direct attack links.
- Added Hub bridge and persistent settings.
