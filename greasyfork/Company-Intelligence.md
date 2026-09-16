# 🏢 SakaLuX Company Intelligence

> Complementary add-on for **SakaLuX Script Hub**. It is managed through the Hub on TornPDA / Tampermonkey.

## Current version
**v1.8.20**

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

## Current release note

**v1.8.20** PDA/mobile top-aligned sheet and compact Hub integration refinement.

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
- The active userscript, Hub registry entry and this information page are synchronized at **v1.8.18**.
- The Hub registry uses Greasy Fork script **595873** for public version checks, while the userscript retains its own raw-GitHub `@downloadURL` / `@updateURL` metadata.

## License
**All Rights Reserved**

## Release history
### v1.8.20 — PDA top-aligned panel refinement

- Opens the SakaLuX panel from the top of the available Torn viewport.
- Improves compact Hub integration and mobile visibility.
- Makes the whole Company sheet scrollable and keeps only the fully visible SakaLuX author footer.

### v1.8.19 — Whole-panel mobile scrolling

- The entire Company Intelligence panel is now the scroll surface on mobile.
- Removed the visible `Updated … · SakaLuX Script Hub · no automated company actions` status line.
- Keeps the `Made with ❤️ by SakaLuX [2380374]` footer as the only bottom attribution line.

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

## Changelog

### v1.8.18

- Performance/UI optimization: throttles expensive redraw paths and applies the shared Hub-style surface, controls, spacing and mobile-friendly visual foundation.

