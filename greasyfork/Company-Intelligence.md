# SakaLuX Company Intelligence

> Standalone SakaLuX company-intelligence tool. Not registered in SakaLuX Script Hub.

## Current version
**v1.8.7**

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

**v1.8.7** fixes Employee mode intelligence. It loads the employee feed for ordinary company members when Torn exposes it, caches your own effectiveness, reads your real position and days-in-company from your employee record, removes the misleading Director-only diagnostic, and adds an evidence-based Best Position Advisor fallback using median coworker work stats when official position requirements are unavailable.

## Recommended
- Use the API-key button to create a key with the displayed selections.
- Refresh after Torn's daily company report to build useful history.
- Director-only modules require the key owner to be the company director.
- Add several same-type companies at the next star level before trusting Benchmark direction.

## License
All Rights Reserved

## Release history
### v1.8.7 — Employee intelligence fix

- Loads employee data in Employee mode when the API permits it.
- Persists own effectiveness across Torn pages.
- Uses own employee record for exact position and days in company.
- Replaces misleading Director-only diagnostics.
- Adds observed-position recommendations when official requirements are unavailable.

### v1.8.6 — Self-company discovery fix

- Loads the API key owner company profile without requiring a company ID first.
- Restores company ID, stars and company age in Employee mode.
- Uses the recovered company ID for subsequent company requests.
- Sync Diagnostics labels employee details as Director only while in Employee mode.

### v1.8.5 — Company ID compatibility fix

- Always fetches legacy `user -> job` as a compatibility fallback.
- Resolves `company_id` from v2 job, legacy job, user profile, or page URL.
- Uses legacy job star rating as an additional fallback.
- Sync Diagnostics now shows `Director only` for employee-list data in employee mode.

### v1.8.4 — Company star detection fix

- Uses company profile rating when available.
- Falls back to `user -> job` company star rating for employee mode.
- Supports multiple current/legacy field names and nested company objects.
- Fixes internal version display mismatch (1.8.1 shown while header was newer).

- v1.8.1: The selected Employee/Director mode and active section now remain saved and are restored when Company Intelligence is reopened.
- Added reliable per-selection API v2 to classic API fallback for Basic, Job, Work Stats and Profile.
- Fixed missing Employee position and stopped the Position tab from surfacing transient backend errors when classic fallback succeeds.
- Added Employee Progress with observed work-stat pace and promised/received train tracking.
- Added intraday metric history so Growth Signals no longer remain at a misleading `+0` after same-day refreshes.
- Added a clear estimated Star Direction: `LIKELY STAR UP`, `STABLE` or `STAR LOSS RISK`.
- Effectiveness now uses director employee data, job/profile data or the visible Torn page; otherwise it explains that Director data is required.
- Fixed Advice, Offers and Trains navigation resetting the panel position on TornPDA.
- Prevented Company Intelligence buttons from being interpreted as Torn page form actions.
- Removed the combined Modules card from Employee Overview and kept the module summary in Director Overview.
- Expanded the complete feature line from v1.1.0 through v1.7.0.
- Fixed company identity being lost after a successful refresh.
- Added persistent last-known company data and one valid snapshot per company day.
- Removed the duplicate Train Promise card from Overview.
- Added Growth, Staff Optimizer, Smart Training, Contracts, Balance, Benchmark, Timeline and Advice modules.
- Added CSV contract/report exports and complete JSON backup/restore support.
- Star predictions remain confidence-based and never invent an exact probability without comparison data.

## Privacy and important information
- The API key and all company notes, contracts, benchmarks and history are stored locally in the script manager/browser.
- No hidden gameplay actions are performed.
- Financial totals exclude costs that Torn does not expose; missing values are not silently treated as real zeroes.
- Company rating is comparative and evaluated by Torn. Star Outlook is decision support, not a guarantee.
