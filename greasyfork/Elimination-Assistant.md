# SakaLuX Elimination Assistant

**Current version:** v1.1.1  
**Greasy Fork:** 594921  
**Category:** Combat / Eliminations

## What it does

SakaLuX Elimination Assistant is a Torn PDA / Tampermonkey helper for the Eliminations event. It does not attack automatically and does not perform game actions for you. It organizes public/API information and gives quick links to profiles and the normal Torn attack page.

## v1.1.1

- Added a single visible target signal in every row: `FF x.xx · BS ~estimate · SAFE/RISKY/SKIP`.
- Added the numeric risk score and a short explanation under the signal.
- Added a 30-minute configurable FFScouter cache to reduce repeated requests and make team reloads much faster.
- Manual `FF SCAN` forces a fresh FFScouter scan; automatic scans reuse fresh cached values where possible.
- Added FF coverage summary such as `FF 92/100` so you can see how much of the loaded team has estimates.
- Added live SAFE and RISKY target counts in the summary bar.
- Added `BEST 10` shortcut behavior that switches to SAFE+RISKY and sorts by lowest risk.
- Attack history now stores the FF and BS estimate that was visible when the attack link was opened.
- Improved mobile layout by combining FF, BS and risk status into one compact column.
- Kept optional FFScouter integration, Torn-only fallback, MIT license and Greasy Fork auto-update metadata.

## v1.1.0

- Added optional FFScouter integration.
- Batch FFScouter lookup for up to 205 targets per request.
- Shows Fair Fight values and battle-stat estimates when available.
- SAFE / RISKY / SKIP scoring prioritizes FFScouter data when present and falls back to visible Torn data otherwise.
- Added Fair Fight, battle-stat, level, activity, contribution and risk sorting.
- Added SAFE-only, SAFE+RISKY, recently active, inactive 24h+ and not-opened filters.
- Detects unavailable targets such as hospital/federal/fallen/jail states when those values are present.
- Added improved local attack/open history.
- Added team score summary and FF scan status.
- Added dedicated `FF SCAN` quick action for SakaLuX Script Hub.

## Notes

FFScouter data is an estimate and cannot guarantee that a fight is safe. The script labels targets using a heuristic and should be treated as an assistant, not a guaranteed win predictor.

The FFScouter API key is optional. Without it, the script still works using Torn Eliminations data and visible target information.
