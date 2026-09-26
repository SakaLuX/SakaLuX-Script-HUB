# ☠️ SakaLuX Script Hub

> Core manager for the SakaLuX Torn script ecosystem.

## Current version
**v1.9.85**


## Repository synchronization

- Verified: **2026-09-26**
- Canonical version: **v1.9.83**
- License: **All Rights Reserved**
- Canonical GitHub source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Script-Hub.user.js
- GreasyFork description source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Script-Hub.md
- GreasyFork page: https://greasyfork.org/scripts/592699
- Install/download URL: https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js
- Update metadata URL: https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.meta.js

## What it does
- Automatically discovers active SakaLuX add-ons from the central `scripts.json` registry.
- Detects installed, missing and outdated registered SakaLuX add-ons.
- Gives installed modules native INFO, NEW, ON/OFF and OPEN/SETTINGS controls.
- **CHECK** refreshes the live registry and verifies available updates.
- **UPDATE** refreshes the registry/update state before opening installers.
- Revalidates update status against the actually installed version to avoid stale alerts.
- Provides SYSTEM CHECK, WHAT'S NEW, category navigation, health information and backup/restore.
- Uses a TornPDA-first control-center layout with desktop userscript-manager support.
- Adds a Torn-native HUB mobile launcher with a fallback launcher when required.
- Exposes `window.SakaLuXScriptHub` for registered complementary add-ons.
- Supports the shared `setEnabled`, `toggleEnabled` and `isEnabled` integration API.
- Can store one shared Torn API key locally for compatible registered add-ons.
- Uses live module presence/bridges rather than stale installation markers for current status.

## Current release note

**v1.9.85 — Persistent native Fly-out launcher + release synchronization**
- Makes the Fly-out Hub launcher a persistent native child of Torn's vertical navigation list, matching CAT-style behavior instead of viewport-driven mounting.
- Keeps SakaLuX Hub permanently as the first row of the vertical list while that Torn menu exists; scrolling no longer removes or recreates it.
- Keeps module INFO, NEW, scripts.json, offline fallback data, release documentation and version labels synchronized to the userscript metadata versions.

## Release history / Changelog

### v1.9.85 — Shared Core v1
- Centralizes shared infrastructure in the embedded SakaLuX Core.
- Adds permanent Shared Core/API broker regression coverage.
- Embeds Shared Core v1 while keeping this userscript independently installable and runnable.







### v1.9.84 — Persistent native Fly-out launcher + release synchronization
- Makes the Fly-out Hub launcher a persistent native child of Torn's vertical navigation list, matching CAT-style behavior instead of viewport-driven mounting.
- Keeps SakaLuX Hub permanently as the first row of the vertical list while that Torn menu exists; scrolling no longer removes or recreates it.
- Keeps module INFO, NEW, scripts.json, offline fallback data, release documentation and version labels synchronized to the userscript metadata versions.

### v1.9.83 — Persistent native Fly-out launcher + release synchronization
- Makes the Fly-out Hub launcher a persistent native child of Torn's vertical navigation list, matching CAT-style behavior instead of viewport-driven mounting.
- Keeps SakaLuX Hub permanently as the first row of the vertical list while that Torn menu exists; scrolling no longer removes or recreates it.
- Keeps module INFO, NEW, scripts.json, offline fallback data, release documentation and version labels synchronized to the userscript metadata versions.

### v1.9.82 — Persistent native Fly-out launcher + release synchronization
- Makes the Fly-out Hub launcher a persistent native child of Torn's vertical navigation list, matching CAT-style behavior instead of viewport-driven mounting.
- Keeps SakaLuX Hub permanently as the first row of the vertical list while that Torn menu exists; scrolling no longer removes or recreates it.
- Keeps module INFO, NEW, scripts.json, offline fallback data, release documentation and version labels synchronized to the userscript metadata versions.

### v1.9.75 — Canonical release/version synchronization
- Uses metadata-derived canonical installed versions for managed modules to prevent false UPDATE AVAILABLE states.
- Synchronizes scripts.json, the offline Hub registry, NEW release details and release markdown surfaces from the same release metadata.

### v1.9.74 — Canonical release/version synchronization
- Uses metadata-derived canonical installed versions for managed modules to prevent false UPDATE AVAILABLE states.
- Synchronizes scripts.json, the offline Hub registry, NEW release details and release markdown surfaces from the same release metadata.

### v1.9.73 — Stocks synchronization
- Updates Stocks to v0.8.7 in the registry, offline fallback and cached NEW details.

### v1.9.72 — Performance and TornPDA smoothness

- Avoids rewriting badge text when its value is unchanged, preventing self-triggered observer work.
- Ignores unrelated chat/dock/footer changes and coalesces launcher maintenance.
- Synchronizes current performance release notes for all seven registered modules.
- Synthetic DOM and Chromium performance coverage; complete previous-version backup included.


### v1.9.70 — Market + Mission Elimination-footer parity
- Synchronizes Market v1.17.37 and Mission v1.0.36.
- Both use the complete working Elimination donation/footer implementation, adapted only to their own panel selector/footer ID.



### v1.9.68 — Stocks native row layout release

- Synchronizes Stocks v0.7.12 and its full-width native-row layout release notes in the registry and offline INFO/NEW.
### v1.9.67 — Stocks UI release synchronization
- Synchronizes Stocks v0.7.11 and its compact UI/footer release details in the registry and offline fallback.
### v1.9.66 — Hub open/runtime fix
- Restores the missing `IDS` map used by launchers, overlay, panel and style selectors.
- Fixes `ReferenceError: IDS is not defined`, which prevented the Hub from opening in TornPDA.

### v1.9.65 — Visible launcher fallback + Stocks panel parity
- Detects real launcher visibility with computed style and viewport geometry.
- Keeps the floating Hub button available whenever native launchers are hidden, clipped or off-screen.
- Synchronizes Stock Manager v0.7.9 with the shared full-sheet panel/footer layout.

### v1.9.64 — Launcher recovery
- Recreates the Hub topbar/mobile launcher when Torn replaces the native navigation DOM.
- Keeps the floating Hub button as a fallback when native launchers are unavailable.
- Adds an explicit Stock Manager POWER action in the Hub registry/fallback.

### v1.9.63 — Stocks Greasy Fork update channel
- Moves Stock Manager & Advisor v0.7.8 install/update checks to Greasy Fork script 596192.
- GitHub remains the canonical source repository.

### v1.9.62 — Stocks promotion
- Adds Stock Manager & Advisor v0.7.7 to the managed modules, offline registry and INFO/NEW release details.
- Stocks installs and checks updates from its main GitHub source.

### v1.9.61 — Performance and release metadata audit
- Synchronizes module INFO/NEW fallback details and versions with the registry.
- Updates release histories and registered-module documentation after the UI and performance audit.

### v1.9.60 — Compact status cards and toolbar
- Makes the Hub header more compact: 38px summary cards and 32px toolbar buttons matching module INFO / NEW controls. Preserves the rounded mobile panel and 20px donation buttons.

### v1.9.59 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

### v1.9.58 — Compact Hub footer
- Reduces SEND MONEY / SEND ITEMS buttons to 40px while preserving the validated Hub layout. SakaLuX modules now use the same compact footer.

### v1.9.57 — Settings switch fix
- Fixes switch dimensions and centers the thumb in ON and OFF states.
- Keeps thumbs inside the track despite older shared/mobile styles.
- Preserves the validated Hub panel layout.

### v1.9.56 — UI refinement and performance tweaks
- Refines mobile panel height, donation controls and compact author-footer placement.
- Rounds donation/footer outer corners to match SEND MONEY.
- Keeps Managed Modules as the primary scrolling area.
- Applies lightweight rendering and reduces global DOM scanning.

### v1.9.55 — Add-on parity full-screen
- Uses the same full-screen container structure as Enhancer Guard and Market Intelligence.
- Makes the overlay own the viewport and lets the Hub panel fill it with flex.
- Removes the double-fixed geometry that could leave unused space below the Hub in TornPDA.
- Keeps blur disabled and only the Managed Modules area as the main scroll surface.

### v1.9.54 — Full-screen performance
- Mobile SakaLuX panels use the full available viewport.
- Removes backdrop blur and heavy mobile visual effects.
- Disables the legacy document-scanning Mobile Surface observer where present.
- Reduces mobile animation/transition cost for faster input and scrolling.

### v1.9.53 — Bottom layout + input latency
- Uses a real flex footer for SEND MONEY / SEND ITEMS and the author line, so nothing overlaps module cards.
- Extends the Hub to the lower TornPDA host edge.
- Disconnects Hub observers while Hub sheets are open.
- Removes the global language MutationObserver.
- Closes Hub before awaiting OPEN/SETTINGS module APIs for immediate tap feedback.
- Coordinates managed modules that fully stop standalone observation while Hub is active.

### v1.9.52 — Scroll performance + bottom layout
- Keeps SEND MONEY / SEND ITEMS fully visible.
- Moves the author footer lower in the available TornPDA area.
- Reduces blur/shadow rendering cost while scrolling.
- Ignores unrelated Torn DOM mutations while Hub is open.
- Coordinates managed module standalone performance updates.

### v1.9.51 — TornPDA performance + compact footer
- Keeps only Managed Modules as the main scroll surface.
- Anchors SEND MONEY / SEND ITEMS and the author footer at the bottom without consuming list height.
- Removes the document-wide Mobile Surface scan and obsolete recurring card repair timer.
- Replaces the managed module footer observer with a one-shot repair.

### v1.9.50 — List-only scroll + Standalone repair
- Keeps Hub header, stats, controls and tabs fixed.
- Makes only Managed Modules the main vertical scroll surface.
- Restores Standalone module opening by removing shared forced panel dimensions.

### v1.9.49 — TornPDA host-scroll hotfix
- Replaces the physical `100dvh` Hub override with host-container sizing.
- Makes the complete Hub panel scrollable with native vertical touch gestures.
- Keeps bottom actions/footer reachable and preserves blur plus 2×2 module controls.

### v1.9.48 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v1.9.47 — Global mobile top alignment
- Applies top alignment directly in Hub, managed modules and Chat Intelligence.
- Enforces the compact right-side 2×2 Hub controls after legacy CSS.
- Keeps Settings switches compact and uniform.

### v1.9.46 — Authoritative PDA layout correction
- Keeps INFO, NEW, ON/OFF and OPEN/SETTINGS in a compact 2×2 block on the right side of managed module cards.
- Makes Hub Settings switches smaller and uniform.
- Opens Hub and managed SakaLuX panels from the top of the available Torn viewport.
- Makes Company Intelligence scroll as a whole sheet and keeps only the fully visible SakaLuX author footer.

### v1.9.45 — Compact module cards and detailed INFO
- Moves INFO, NEW, ON/OFF and OPEN/SETTINGS into a compact 2x2 block on the right side of each managed module card.
- Aligns the Hub panel with the top of the available Torn viewport on mobile.
- Refines Settings switches to smaller proportions.
- Expands per-module INFO content in `scripts.json`.
- Updates Company Intelligence integration for whole-panel scrolling and a simplified footer.

### v1.9.44 — Mobile control and Company footer refinement
- Uses two rows for managed module actions on narrow screens: INFO + ON/OFF, then NEW + OPEN/SETTINGS.
- Keeps Company Intelligence content independently scrollable while its SakaLuX author footer stays visible at the bottom of the panel.
- Reduces Hub Settings toggle dimensions for Torn launchers and automatic update checks.
- Preserves the existing desktop layout.

### v1.9.43 — Native module information and release center
- Adds INFO and NEW buttons directly to every managed module card.
- Keeps only version, update state, ACTIVE/DISABLED state and last-check time on the compact card body.
- INFO explains what each script does; NEW shows the current module release notes from `scripts.json`.
- Restores Greasy Fork as the public version/update verification source for all registered modules.
- Keeps the SakaLuX author footer stable inside managed module panels.
- Removes the temporary standalone Hub Card UX layer.

### v1.9.42
- Performance/UI optimization release: adds the shared single-instance SakaLuX performance foundation used across compatible scripts, synchronizes optimized module versions, and keeps the Hub as the canonical visual design reference.

### v1.9.41 — Fallback registry synchronization
- Synchronizes all Hub offline fallback add-on versions with `scripts.json`.
- Fixes the stale Bazaar Thanker fallback version that caused CI cross-file synchronization failure.
- Keeps the registered add-on information list synchronized with the canonical registry.

### v1.9.40 — Installed version reporting fix
- Uses the newest valid live version signal instead of trusting the first bridge value.
- Synchronizes runtime version constants with userscript headers.
- Updates the Hub offline fallback registry to current add-on versions.

### v1.9.39 — Reliable Hub presence handshake
- Marks Hub as installed/active immediately when the userscript starts.
- Prevents managed add-ons from showing the standalone dock while Hub is running.
- Established the Hub detection contract used by Company Intelligence and the other managed add-ons.
- Keeps Company Intelligence public update checks on Greasy Fork script 595873; the current registry entry is v1.8.14.

### v1.9.38 — Registry and distribution synchronization
- Built from the stable v1.9.37 baseline.
- Synchronized fallback registry versions with the live registry.
- Added Company Intelligence v1.8.12 to the Hub fallback registry and runtime integration.
- Updated Market Intelligence to v1.17.19 and Elimination Assistant to v1.3.31.
- Corrected Company Intelligence update metadata to use its GitHub distribution source.
- Improved pending-version labels to show the published and registry versions explicitly.
- Rotated Hub update/registry cache keys so old rollback-era cache data cannot mask the new registry.

### v1.9.37 — Stable registry/cache baseline
- Kept live module presence as the source of truth for installed status.
- Restored Mission Rewards v1.0.18 as the stable registered release.
- Rotated registry/update caches after rollback so stale cached versions no longer survive.

### v1.9.36 — Rollback cache invalidation
- Invalidated cached registry/update data after reverting experimental module versions.
- Preserved the stable module-presence detection model.

### v1.9.35 — Live installation status
- Removed ghost installation state derived from local installation markers.
- Installed status is based on current live module presence, bridge/API registration or standalone registration.

### v1.9.34 — Generic runtime compatibility
- Removed userscript-manager-specific compatibility handling.
- Kept generic runtime API and DOM bridge integration across supported managers.

### v1.9.33 — Panel stacking
- Corrected Hub panel stacking relative to the shared standalone dock.

### v1.9.32 — Hub panel runtime restoration
- Restored Hub panel runtime after the bridge-only launcher migration.

### v1.9.29–v1.9.31 — Managed launcher cleanup
- Removed managed add-on floating launchers while Hub is active.
- Managed modules are opened through Hub bridges/APIs instead of duplicate page buttons.

### v1.9.27–v1.9.28 — Published/registry version handling
- Distinguished published Greasy Fork version from registry version without creating an update loop.
- Added live bridge/API/standalone version detection and synchronized fallback data.

### v1.9.22–v1.9.26 — Standalone launcher and detection work
- Added the compact native S launcher/shared standalone dock behavior.
- Refined Hub install reminders and eliminated false standalone detection.

### v1.9.12 — Extensible shared languages
- English became the guaranteed standalone default.
- Added an extensible locale registry with bundled English/Romanian fallback.
- Language choices are generated from the locale registry.

### v1.9.11 — English and Romanian interfaces
- Added the persistent Language selector and shared localization across managed SakaLuX interfaces.

### v1.9.10 — Cross-context module detection
- Added hidden DOM bridges for isolated userscript contexts and corrected false OFF/INSTALL states.

### v1.9.5 — Update-control cleanup
- Converted Hub boolean settings to slide switches and consolidated registry/update controls into CHECK and UPDATE.

### v1.9.4 — Control Center redesign
- Rebuilt the Hub around the current premium TornPDA-first control-center layout.

### v1.9.1 — Canonical registry minimum
- Made `scripts.json` the canonical minimum version and invalidated update cache when registry versions change.

### v1.9.0 — Native module power control
- Introduced the current module-card ON/OFF model and shared Hub API-key management.

### v1.9.71 — Detailed INFO and current NEW
- Rewrites INFO for all seven registered modules into detailed feature sections.
- Synchronizes NEW with each module's actual current version and latest changes.
- Synchronizes offline details and refreshes stale cached information while retaining newer metadata.

Latest Hub refresh improvement: overlapping registry/update checks share one active operation.


### Bazaar Smart Pricer v1.1.0
- Rebased on Quick Pricer v2.9.3 behavior with native per-item Quick Add/Undo.
- Adds Hub-styled settings and Hub SETTINGS / QUICK FILL / REFRESH actions.
- RW and generic bonus-item safety defaults to ON.
