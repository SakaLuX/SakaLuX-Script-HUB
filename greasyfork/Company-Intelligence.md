# 🏢 SakaLuX Company Intelligence

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone on TornPDA / Tampermonkey.

## Current version
**v1.8.12**

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
**v1.8.12** removes the standalone floating Company Intel button whenever SakaLuX Script Hub is installed. The launcher remains available only for true standalone use. The current userscript distribution/update source is the GitHub raw userscript, which is also the source used by Hub v1.9.38.

## Recommended
- Install **SakaLuX Script Hub** when using Company Intelligence with the modular SakaLuX ecosystem.
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
- Company Intelligence v1.8.12 is currently updated from its GitHub userscript source. A Greasy Fork metadata entry must not be used as the canonical update source unless the userscript is intentionally republished there later.

## License
**All Rights Reserved**

## Release history
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
