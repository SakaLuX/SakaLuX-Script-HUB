# 💬 SakaLuX Bazaar Thanker - PDA

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v5.3.45**


## Repository synchronization

- Verified: **2026-09-26**
- Canonical version: **v5.3.45**
- License: **All Rights Reserved**
- Canonical GitHub source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Thanker-PDA.user.js
- GreasyFork description source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Bazaar-Thanker.md
- GreasyFork page: https://greasyfork.org/scripts/592388
- Install/download URL: https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.user.js
- Update metadata URL: https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.meta.js

## What it does
- Detects Bazaar purchase events and groups purchases by buyer.
- Generates thank-you messages with customizable Bazaar name and message text.
- Includes buyer details, copy tools, big-buyer detection, statistics and history.
- Exposes its status to Script Hub on all Torn pages while working features remain limited to Events and Messages.
- Works without a Torn API key.

## Current release note

**v5.3.45 — Adds versioned settings schemas for every SakaLuX userscript through Shared Core v1.1.0**
- Adds versioned settings schemas for every SakaLuX userscript through Shared Core v1.1.0.
- Automatically advances legacy settings through ordered per-version migrations without downgrading newer data.
- Keeps a last-known-good backup and restores it, or safely falls back to script defaults, when stored JSON is corrupt.

## Release history / Changelog


### v5.3.45 — Settings Schema v1 and safe automatic migrations
- Adds versioned settings schemas for every SakaLuX userscript through Shared Core v1.1.0.
- Automatically advances legacy settings through ordered per-version migrations without downgrading newer data.
- Keeps a last-known-good backup and restores it, or safely falls back to script defaults, when stored JSON is corrupt.

### v5.3.44 — Shared Core v1
- Centralizes shared infrastructure in the embedded SakaLuX Core.
- Adds permanent Shared Core/API broker regression coverage.
- Embeds Shared Core v1 while keeping this userscript independently installable and runnable.





### v5.3.43 — Release metadata synchronization
- Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.
- Deduplicates standalone registrations by module id before rendering.
- Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page.

### v5.3.42 — Release metadata synchronization
- Integrates Bazaar Thanker actions with Suite Event Lens: removes the inline clipboard button and exposes Thanks/Details through the Suite action row when Bazaar Thanker is active.
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Uses constant-time Hub detection instead of document-wide marker searches on every mutation.
- Avoids rebuilding unchanged standalone dock entries and ignores unrelated chat changes.
- Preserves buyer grouping, cooldown and message preparation.

### v5.3.41 — Release metadata synchronization
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Uses constant-time Hub detection instead of document-wide marker searches on every mutation.
- Avoids rebuilding unchanged standalone dock entries and ignores unrelated chat changes.
- Preserves buyer grouping, cooldown and message preparation.

### v5.3.40 — Performance and TornPDA smoothness

- Uses constant-time Hub detection instead of document-wide marker searches on every mutation.
- Avoids rebuilding unchanged standalone dock entries and ignores unrelated chat changes.
- Preserves buyer grouping, cooldown and message preparation.
- Synthetic DOM and Chromium performance coverage; complete previous-version backup included.


### v5.3.39 — Performance and release metadata audit
- Restricts donation-footer updates to the native module root; unrelated Torn and other-module DOM changes no longer schedule footer repairs.

### v5.3.38 — Fixed header/footer and form scrolling
- Keeps the title and full-width donation footer fixed while the settings form scrolls independently. Fixes the stale displayed version and keeps fields within the panel.

### v5.3.37 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

### v5.3.36 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.

### v5.3.35 — Hub isolation
- Excludes Script Hub and its subtree from shared module styling/fullscreen rules; restricts footer routines to native module roots.

### v5.3.34 — Full-screen performance
- Mobile SakaLuX panels use the full available viewport.
- Removes backdrop blur and heavy mobile visual effects.
- Disables the legacy document-scanning Mobile Surface observer where present.
- Reduces mobile animation/transition cost for faster input and scrolling.

### v5.3.33 — Hub-aware observer shutdown
- Stops the standalone document observer as soon as Script Hub is detected.
- Keeps normal standalone behavior when Hub is absent.
- Reduces unnecessary work during Hub scrolling and button taps.

### v5.3.32 — TornPDA performance
- Removes the recurring standalone render interval.
- Throttles DOM-driven standalone refreshes.
- Avoids repeated work while Script Hub is active.

### v5.3.31 — Standalone panel repair
- Restores Standalone OPEN behavior.
- Removes shared full-sheet dimension forcing from the module panel.
- Keeps native module sizing and TornPDA touch behavior.

### v5.3.30 — TornPDA host-scroll contract
- Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling works normally while the translucent blur surface is preserved.

### v5.3.29 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v5.3.28 — Mobile top alignment
- Opens the script panel from the top of the TornPDA viewport.
- Uses the shared SakaLuX top-alignment contract.

### v5.3.27 — PDA top-aligned panel refinement
- Opens the SakaLuX panel from the top of the available Torn viewport.
- Improves compact Hub integration and mobile visibility.

### v5.3.26
- Performance/UI optimization: reduces repeated DOM work on Torn/TornPDA redraws and aligns standalone controls with the shared SakaLuX Hub-style UI foundation.

### v5.3.25 — Fixed profile link
- The visible seller attribution remains only `🙏`.
- `🙏` always links to `https://www.torn.com/profiles.php?XID=2380374`.
- The message link no longer depends on the configurable seller ID.

### v5.3.24 — Profile link cleanup
- Removes the visible `SakaLuX` username from thank-you messages.
- Keeps only a clickable `🙏` profile link.
- Preserves the configured seller profile destination.

### v5.3.23 — Shared Standalone ordering fix
- Uses the canonical SakaLuX standalone order including Company Intelligence.
- Unknown/new modules sort after known modules instead of before them.
- Keeps the mobile dock layout and Install SakaLuX Hub button readable.

### v5.3.21 — Panel layering and launcher cleanup
- Keeps the panel above the shared standalone dock.
- Preserves Settings access through Hub/shared dock without a separate floating launcher.

### v5.3.19 — Runtime version synchronization
- Synchronized `@version`, runtime version, standalone registration and Hub bridge version.
- Fixed the false UPDATE AVAILABLE state caused by an internal version mismatch.

### v5.3.18 — Hub detection fix
- Recognizes current Hub launchers/active marker and suppresses standalone prompts while Hub is installed.

### v5.3.14 — Compact native S standalone launcher
- Added the compact native S/shared standalone dock behavior.

### v5.3.10 — Violentmonkey Hub bridge
- Added isolated-context detection, OPEN and ON/OFF bridge support.

### v5.3.9 — Inline panel signature
- Moved the SakaLuX signature inside the module panel.

### v5.3.8 — Persistent SakaLuX signature
- Added the persistent linked author footer.

### v5.3.7 — Unified Control Center visual system
- Adopted the shared SakaLuX interface style.

### v5.3.6 — PC detection and message-price fix
- Added reliable installation detection, refreshed the Settings UI and corrected per-item price display in generated purchase messages.
