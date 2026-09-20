# SakaLuX Bazaar Smart Pricer v1.0.2

Release date: **2026-09-20**

## Changes
- The floating launcher at the right edge is now a compact circular **+** button.
- **Skip Ranked War (RW) weapons** is enabled by default.
- **Skip items / weapons with bonus icons** is enabled by default.
- Detection uses Torn bonus attachment icons plus RW rarity glow.
- When a protected item is detected, Smart Pricer does not write either quantity or price.
- Existing Quick Fill quantity + price behavior remains unchanged for normal items.

## Validation
- `node --check` for the userscript.
- `python3 -m json.tool` for `scripts.json`.
