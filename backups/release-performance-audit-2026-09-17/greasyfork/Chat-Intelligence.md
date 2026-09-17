# 💬 SakaLuX Chat Intelligence

> Complementary add-on for SakaLuX Script Hub.

## Current version
**v1.2.16**

## What it does
- Enhances Torn chat with SakaLuX chat intelligence features.
- Keeps its standalone behavior available when Script Hub is not installed.
- Uses the shared SakaLuX performance and Hub-style UI foundation.

## Current release note



**v1.2.16** Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

## Recommended
- Use together with SakaLuX Script Hub for consistent controls and status handling.

## License
All Rights Reserved — SakaLuX [2380374].

## Changelog

### v1.2.12 — TornPDA host-scroll contract
- Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling and mobile interaction remain stable while blur is preserved.

### v1.2.11 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.


### v1.2.10 — Mobile top alignment
- Opens the script panel from the top of the TornPDA viewport.
- Uses the shared SakaLuX top-alignment contract.

### v1.2.9

- Performance/UI optimization: reduces duplicate high-frequency DOM work and aligns Chat Intelligence surfaces with the shared SakaLuX Hub-style UI foundation.


## Release history

### v1.2.16 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.


### v1.2.15 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.


### v1.2.13 — Full-screen performance
- Uses the full mobile viewport for SakaLuX panels.
- Removes backdrop blur and other expensive mobile visual effects.
- Reduces unnecessary observer/render work where applicable.
- Improves TornPDA scroll and tap responsiveness.

