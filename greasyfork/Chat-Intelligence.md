# 💬 SakaLuX Chat Intelligence

> Complementary add-on for SakaLuX Script Hub.

## Current version
**v1.2.38**


## Repository synchronization

- Verified: **2026-10-02**
- Canonical version: **v1.2.38**
- License: **All Rights Reserved**
- Canonical GitHub source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
- GreasyFork description source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Chat-Intelligence.md
- GreasyFork page: Not currently registered with a verified GreasyFork script ID.
- Install/download URL: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
- Update metadata URL: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js

## What it does
- Enhances Torn chat with SakaLuX chat intelligence features.
- Keeps its standalone behavior available when Script Hub is not installed.
- Uses the shared SakaLuX performance and Hub-style UI foundation.

## Current release note

**v1.2.38 — Release documentation synchronized with the current Chat Intelligence userscript version**
- Release documentation synchronized with the current Chat Intelligence userscript version.

## Release history / Changelog



### v1.2.38 — Active-chat notification suppression recovery
- Fixes v1.2.37 suppressing every new toast merely because the newly rendered message element was visible.
- Suppresses duplicate toasts only when the actual chat root and its composer are both visible and active on screen.
- Keeps notifications available for minimized, hidden or background chat states while avoiding duplicate popups over the conversation currently being read.

### v1.2.37 — Suppress duplicate toast when the active chat message is already visible
- Does not show a floating Chat Intelligence notification for a new message that is already visibly rendered inside the currently open chat window.
- Keeps notifications for minimized, hidden or off-screen chat conversations so unread activity can still be surfaced.
- Marks visible messages as seen to prevent the same message from producing a delayed duplicate toast after DOM rescans.

### v1.2.36 — Native-flow chat header controls
- Replaced absolute right offsets with native header flow placement before Minimize/Close.
- Fixes the v1.2.35 regression where controls shifted over the chat title/name.

### v1.2.35 — Native minimize/settings collision fix
- Reserves 126px at the right of the chat header for Torn native controls.
- Moves the complete SakaLuX header control strip left so Settings no longer overlaps Minimize.

### v1.2.34 — Chat header overlap fix
- Context ⋮ is restricted to real message rows and excluded from the native chat header.
- Header controls use a compact TornPDA layout to prevent overlap with avatar/name/title controls.

### v1.2.27 — Visible context actions and safe fullscreen
- Visible per-message ⋮ context trigger.
- Sender/name tap opens Player actions.
- Direct-root fullscreen with geometry validation to prevent off-screen/disappearing chat.
- Immediate cleanup/re-render for Context actions setting.

### v1.2.26 — Full legacy feature restore, settings repair and reliable fullscreen
- Restored and exposed all legacy context actions.
- Fixed Search, Export, notifications/channel toggles and @mention cleanup behavior.
- Added individual context-action switches and reliable reset/clear actions.
- Reworked maximize/restore to use the actual chat shell and reversible important styles.
- Alias custom colors are applied to detected sender names.

### v1.2.25 — Working maximize and visible complete controls
- Fixed Maximize on TornPDA by maximizing the common native chat shell instead of depending on a fragile detected message viewport.
- Added a persistent ⚙ Chat Intelligence Settings control in the chat title bar.
- Exposed the complete context-action feature list in Settings.
- Synchronized metadata/runtime version surfaces to v1.2.25.

### v1.2.24 — Native Chat V3 control alignment fix
- Removed the pill/capsule background around Chat Intelligence header controls.
- Added Chat-specific high-specificity CSS to defeat shared/global button stretching on TornPDA.
- Kept Search, Maximize and Export as separate native-like controls beside the Torn close button.
- Added compact mobile sizing and synchronized runtime/header versions.

### v1.2.23 — Restore complete chat controls and TornPDA header layout
- Restored the Search settings switch and Clear mute / Clear aliases-favorites actions.
- Restored alias custom colors and contextual alias/color state.
- Restored favorite-first @mention suggestions with player IDs.
- Reworked Chat V3 header detection and compact mobile controls to avoid collisions with unrelated chat widgets.
- Synchronized runtime/header version surfaces to v1.2.23.


### v1.2.22 — Settings Schema v1 and safe automatic migrations
- Adds versioned settings schemas for every SakaLuX userscript through Shared Core v1.1.0.
- Automatically advances legacy settings through ordered per-version migrations without downgrading newer data.
- Keeps a last-known-good backup and restores it, or safely falls back to script defaults, when stored JSON is corrupt.

### v1.2.21 — Shared Core v1
- Centralizes shared infrastructure in the embedded SakaLuX Core.
- Adds permanent Shared Core/API broker regression coverage.
- Embeds Shared Core v1 while keeping this userscript independently installable and runnable.


### v1.2.20 — Extended performance validation
- Recent-message IDs are capped at 4,096. Weak per-element tracking preserves notification deduplication for messages still visible after cache eviction.

### v1.2.19 — Performance and TornPDA smoothness

- Batches chat scans without resetting the pending timer for every new message.
- Ignores mutations generated by its own chat controls and notification UI.
- Cancels pending scan work on disable; runtime and header versions are synchronized.
- Synthetic DOM and Chromium performance coverage; complete previous-version backup included.


### v1.2.18 — Complete standalone registration
- Added global shared-standalone registration for `chat-intelligence`.
- Synchronized metadata/runtime version surfaces to v1.2.18.
- Kept existing Chat Intelligence behavior and Hub integration unchanged.

### v1.2.17 — Performance and release metadata audit
- Restricts donation-footer updates to the native module root; unrelated Torn and other-module DOM changes no longer schedule footer repairs.

### v1.2.16 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

### v1.2.15 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.

### v1.2.14 — Hub isolation
- Excludes Script Hub and its subtree from shared module styling/fullscreen rules; restricts footer routines to native module roots.

### v1.2.13 — Full-screen performance
- Uses the full mobile viewport for SakaLuX panels.
- Removes backdrop blur and other expensive mobile visual effects.
- Reduces unnecessary observer/render work where applicable.
- Improves TornPDA scroll and tap responsiveness.

### v1.2.12 — TornPDA host-scroll contract
- Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling and mobile interaction remain stable while blur is preserved.

### v1.2.11 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v1.2.10 — Mobile top alignment
- Opens the script panel from the top of the TornPDA viewport.
- Uses the shared SakaLuX top-alignment contract.

### v1.2.9 — Performance/UI optimization
- Performance/UI optimization: reduces duplicate high-frequency DOM work and aligns Chat Intelligence surfaces with the shared SakaLuX Hub-style UI foundation.
