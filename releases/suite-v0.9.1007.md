# SakaLuX Suite v0.9.1007

Released: 2026-11-11

## Hotfix — Training Log

- Fixes the incorrectly escaped CSV regex introduced in v0.9.1006.
- Accepts Torn's `working_stats_received: "50,25"` and `"50,25,0"` and displays MAN +50 / INT +25.
- Import API updates previously stored events rather than requiring Clear All Logs.
- Retains saved Full Log gain backfill for old entries.
- Adds a regression test at `tests/suite-training-log-csv-2026-11.cjs`.

## Installation

Update SakaLuX Suite from the GitHub userscript source. Torn PDA may need its installed script refreshed/reinstalled to load a new version. Do not clear training logs.

## Verification

Numeric CSV regression cases added; live Torn PDA verification still pending.
