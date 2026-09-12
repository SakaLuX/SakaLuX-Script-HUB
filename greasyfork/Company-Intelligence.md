# SakaLuX Company Intelligence

Complementary add-on for SakaLuX Script Hub, designed for Torn PDA, Tampermonkey and Violentmonkey.

## Current version

v1.8.1

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

## Current release notes

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

## Recommended

- Use the API-key button to create a key with the displayed selections.
- Refresh after Torn's daily company report to build useful history.
- Director-only modules require the key owner to be the company director.
- Add several same-type companies at the next star level before trusting Benchmark direction.

## Privacy and important information

- The API key and all company notes, contracts, benchmarks and history are stored locally in the script manager/browser.
- No hidden gameplay actions are performed.
- Financial totals exclude costs that Torn does not expose; missing values are not silently treated as real zeroes.
- Company rating is comparative and evaluated by Torn. Star Outlook is decision support, not a guarantee.

## License

All Rights Reserved © 2026 SakaLuX [2380374].
