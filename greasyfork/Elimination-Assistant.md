# SakaLuX Elimination Assistant

**Current version:** v1.1.0  
**Greasy Fork:** 594921  
**Category:** Combat / Eliminations

## What it does

SakaLuX Elimination Assistant is a Torn PDA / Tampermonkey helper for the Eliminations event. It does not attack automatically and does not perform game actions for you. It organizes public/API information and gives quick links to profiles and the normal Torn attack page.

## v1.1.0

- Added optional FFScouter integration.
- Batch FFScouter lookup for up to 205 targets per request.
- Shows Fair Fight values and battle-stat estimates when available.
- SAFE / RISKY / SKIP scoring now prioritizes FFScouter data when present and falls back to visible Torn data otherwise.
- Added Fair Fight, battle-stat, level, activity, contribution and risk sorting.
- Added SAFE-only, SAFE+RISKY, recently active, inactive 24h+ and not-opened filters.
- Detects unavailable targets such as hospital/federal/fallen/jail states when those values are present.
- Added improved local attack/open history.
- Added team score summary and FF scan status.
- Added dedicated `FF SCAN` quick action for SakaLuX Script Hub.
- Added FFScouter key storage in localStorage; the key is optional.
- Torn API and FFScouter calls support Torn PDA request bridges when available, with userscript request fallback.
- Keeps MIT license and Greasy Fork auto-update metadata.

## Notes

FFScouter data is an estimate and cannot guarantee that a fight is safe. The script labels targets using a heuristic and should be treated as an assistant, not a guaranteed win predictor.

The FFScouter API key is optional. Without it, the script still works using Torn Eliminations data and visible target information.
