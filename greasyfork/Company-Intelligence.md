# 🏢 SakaLuX Company Intelligence

> Complementary add-on for **SakaLuX Script Hub**. It is managed through the Hub on TornPDA / Tampermonkey.

## Current version
**v1.8.39**

## What it does
- Reliable Torn API v2 sync with classic API and local company-cache fallbacks.
- Employee dashboard, work-stat position advisor, train tracking, offer comparison and history.
- Employee Progress with work-stat changes, train compliance and 30/90-day projections.
- Company Growth Center with daily snapshots, Sunday rating countdown and honest star outlook.
- Director staff overview, effectiveness/position optimizer and actionable employee flags.
- Smart training rotation, training debt and per-employee training history.
- Train-sale contracts with delivered/remaining counters, balances and CSV export.
- Weekly finance and balance view using only known API and locally logged values.
- Stock intelligence and competitor benchmark workspace.
- Company timeline, report export, diagnostics and actionable advice.
- Shared Bazaar-style SakaLuX Standalone Dock integration: Company registers as a module and never creates a second standalone menu.

## Current release note

**v1.8.39 — Release metadata synchronization**
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Ignores unrelated chat changes in Company page scraping and dock maintenance.
- Removes duplicate legacy registration timers that overwrote current module metadata.
- Preserves Company panel stacking and current standalone registration.

## Recommended
- Install **SakaLuX Script Hub** to use Company Intelligence with the modular SakaLuX ecosystem.
- Use the API-key button to create a key with the displayed selections.
- Refresh after Torn's daily company report to build useful history.
- Director-only modules require the key owner to be the company director.
- Add several same-type companies at the next star level before trusting Benchmark direction.

## Privacy
- The API key, company notes, contracts, benchmarks, snapshots and history are stored locally in the script manager/browser.
- Company Intelligence requests Torn data required by the enabled employee/director features.
- No hidden gameplay action is performed by the information and planning modules.

## Important
- Financial totals exclude costs Torn does not expose; missing values are not silently treated as real zeroes.
- Company rating is comparative and evaluated by Torn.
- Star Outlook, growth direction, position advice and benchmark results are decision-support estimates, not guarantees.
- The userscript header, runtime version, `scripts.json` registry entry and this information page are synchronized at **v1.8.38**.
- The Hub registry uses Greasy Fork script **595873** for public version checks, while the userscript retains its own raw-GitHub `@downloadURL` / `@updateURL` metadata.

## License
**All Rights Reserved**

## Release history / Changelog


### v1.8.39 — Release metadata synchronization
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Ignores unrelated chat changes in Company page scraping and dock maintenance.
- Removes duplicate legacy registration timers that overwrote current module metadata.
- Preserves Company panel stacking and current standalone registration.

### v1.8.38 — Performance and TornPDA smoothness

- Ignores unrelated chat changes in Company page scraping and dock maintenance.
- Removes duplicate legacy registration timers that overwrote current module metadata.
- Preserves Company panel stacking and current standalone registration.
- Synthetic DOM and Chromium performance coverage; complete previous-version backup included.


### v1.8.37 — Professional TornPDA header layout
- Synchronizes runtime `APP.version` with `@version`, standalone registration, Hub bridge, ModuleReady event and local installed-version marker at v1.8.37, removing the false UPDATE AVAILABLE state.
- Rebuilds the Company mobile header into a stable two-row layout.
- Gives the title the remaining width instead of squeezing it between controls.
- Groups Refresh, API Key and Close tightly on the right and keeps all three inside the viewport.
- Places Employee / Director on a full-width second row with equal halves.
- Keeps the shared standalone registration behavior intact.

### v1.8.36 — Mobile header overflow guard
- Keeps Refresh, API Key and Close visible on narrow TornPDA screens.
- Moves Employee / Director away from the action-button row to prevent right-side overflow.

### v1.8.35 — Shared Standalone Dock bootstrap
- Copies the common Bazaar-style standalone bootstrap into Company.
- Uses the shared `sakalux-standalone-dock`, style, launcher and registration IDs.
- Registers Company as `company-intelligence`; whichever SakaLuX module loads first owns the common dock and later modules only join it.
- Does not create a second Company-specific standalone menu.

### v1.8.34 — Elimination-style controls
- Aligns the Company header and API controls with the compact Elimination layout.
- Normalizes action-button sizing, tabs and API action spacing.

### v1.8.33 — Standalone bridge opening
- Makes the Company standalone row open through the Company module bridge.
- Layers the Company panel above the shared SakaLuX Scripts Standalone panel.

### v1.8.32 — Footer and standalone compatibility
- Keeps Company compatible with the shared compact donation footer and standalone registration flow used across SakaLuX modules.

### v1.8.31 — Performance and release metadata audit
- Restricts donation-footer updates to the native module root; unrelated Torn and other-module DOM changes no longer schedule footer repairs.
- Runs native position scraping only on visible Company/Job pages and ignores changes inside Company/Hub panels.
- Prevents duplicate standalone placement timers after OFF/ON.
- Clears employment caches through the same GM/local-storage abstraction used to save them.

### v1.8.30 — Scroll gestures across the panel
- Routes vertical touch gestures from the header, tabs, content and footer into the main content scroll area. Preserves horizontal tab swipes and taps, and forwards header/footer mouse-wheel scrolling.

### v1.8.29 — Current employment refresh
- Refresh prioritizes fresh job status over cached company profiles. Confirmed departure clears current company, employee, stock and effectiveness caches while preserving historical snapshots and planning records.

### v1.8.28 — Fixed navigation/footer and content scrolling
- Fixes Company panel scrolling: header and Overview/other tabs remain fixed, only the body scrolls, and the full-width 50px footer stays at the bottom. Removes leftover shell bottom padding and the legacy whole-sheet scroll repair.

### v1.8.27 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

### v1.8.26 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.

### v1.8.25 — Hub isolation
- Excludes Script Hub and its subtree from shared module styling/fullscreen rules; restricts footer routines to native module roots.

### v1.8.23 — Full-screen performance
- Mobile SakaLuX panels use the full available viewport.
- Removes backdrop blur and heavy mobile visual effects.
- Disables the legacy document-scanning Mobile Surface observer where present.
- Reduces mobile animation/transition cost for faster input and scrolling.

### v1.8.22 — TornPDA host-scroll contract
- Makes the whole Company sheet the native vertical scroll surface, fits it to the available TornPDA host height, preserves blur, and styles the SakaLuX footer in orange like Elimination.
- Synchronizes runtime `APP.version` with the userscript and registry at v1.8.22.

### v1.8.21 — Whole-sheet scroll and footer repair
- Makes the complete Company sheet the mobile scroll surface.
- Opens the sheet top-to-bottom with shared SakaLuX blur.
- Restyles `Made with ❤️ by SakaLuX [2380374]` with the orange SakaLuX attribution treatment.

### v1.8.20 — PDA top-aligned panel refinement
- Opens the SakaLuX panel from the top of the available Torn viewport.
- Improves compact Hub integration and mobile visibility.
- Makes the whole Company sheet scrollable and keeps only the fully visible SakaLuX author footer.

### v1.8.19 — Whole-panel mobile scrolling
- The entire Company Intelligence panel is now the scroll surface on mobile.
- Removed the visible `Updated … · SakaLuX Script Hub · no automated company actions` status line.
- Keeps the `Made with ❤️ by SakaLuX [2380374]` footer as the only bottom attribution line.

### v1.8.18
- Performance/UI optimization: throttles expensive redraw paths and applies the shared Hub-style surface, controls, spacing and mobile-friendly visual foundation.

### v1.8.17 — Standalone placement hardening
- Repairs legacy/malformed dock placement for the Company row.
- Keeps Company inside the module list, after the other known add-ons.
- Preserves Hub integration and removes no standalone functionality.

### v1.8.16 — Standalone ordering fix
- Keeps Company in the shared Standalone menu.
- Forces the Company row to the end of the script list instead of directly under the Standalone subtitle.
- Works even when another installed SakaLuX add-on still uses an older dock ordering table.

### v1.8.15 — Restore clean standalone entry
- Restores Company Intelligence as an entry in the shared standalone SakaLuX Scripts menu.
- Does not inject standalone dock CSS or create a second dock.
- Keeps the floating Company Intel button removed.
- Opens from the shared menu through the hidden Company module bridge.

### v1.8.14 — Remove standalone Company launcher
- Removes the Company entry from the shared standalone SakaLuX Scripts dock.
- Removes the floating Company Intel page button completely.
- Keeps Hub integration through `window.SakaLuXCompanyIntelligence` and the hidden module bridge.
- Stops Company Intelligence from injecting its own standalone dock CSS/layout.

### v1.8.13 — Hub integration detection
- Uses all current Script Hub DOM presence signals.
- Removes the Company Intel floating button as soon as Hub is detected.
- Registers Company Intelligence in the shared standalone dock only when Hub is truly absent.
- Keeps standalone operation intact.

### v1.8.12 — Hub launcher cleanup
- Hides/removes the bottom-right Company Intel floating button when SakaLuX Script Hub is active.
- Keeps the standalone launcher only when the script is used without the Hub.

### v1.8.11 — Contrast, Position cards and tenure fallback
- Forces readable foreground colors inside Company Intelligence regardless of Torn dark-theme CSS.
- Makes Employee Position Advisor mobile-friendly.
- Improves badge/value contrast and Days in company fallbacks.

### v1.8.10 — Mobile Staff readability
- Converts Smart Roster and Employee Effectiveness/Position Optimizer to stacked mobile cards.
- Adds explicit field labels and preserves the desktop table layout.

### v1.8.9 — Official position requirements
- Uses Company Positions primary/secondary requirements before coworker estimates.
- Includes unoccupied roles, caches observed requirements and improves role ranking.

### v1.8.8 — Position labels and star-direction clarity
- Normalizes position labels and separates improving, declining and unchanged tracked metrics.
- Clarifies that history sample count is not a star-up/star-down score.

### v1.8.7 — Employee intelligence fix
- Restores employee-mode data, own effectiveness/position/tenure and observed-position recommendations.

### v1.8.6 — Self-company discovery fix
- Loads the API-key owner's company profile without requiring a company ID first.
- Recovers company ID, stars and age in Employee mode.

### v1.8.5 — Company ID compatibility fix
- Adds legacy `user -> job` compatibility and multiple company-ID/star fallbacks.

### v1.8.4 — Company star detection fix
- Improves company rating/star extraction across current and legacy response shapes.
- Fixes the internal displayed-version mismatch.

### v1.8.1 — Persistent modes and expanded intelligence
- Persists Employee/Director mode and active section.
- Added reliable API v2/classic fallbacks, Employee Progress, Growth, Staff Optimizer, Smart Training, Contracts, Balance, Benchmark, Timeline and Advice.
- Added CSV/report exports and complete JSON backup/restore.
- Star predictions remain confidence-based and never invent an exact probability without comparison data.
