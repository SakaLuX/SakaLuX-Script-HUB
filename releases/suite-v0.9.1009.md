# SakaLuX Suite v0.9.1009

Released: 2026-11-11

## Training Log recovery

- Fixes train entries reporting "No exact stat breakdown found" while the Torn API field still contains two numeric values such as `"50,25"`.
- Normalizes quoted or escaped saved Company log values and preserves a fallback from stored `trainingAmounts`.
- Displays PRIMARY +50 / SECONDARY +25 unless exact historical position mapping is confirmed.
- Adds **Set historical role stats by date** within Full Log. Enter the start date of a known position, select its primary and secondary stats, then confirm the affected count. Does not alter prior train records.
- Keeps existing 39+ saved records; never use Clear All Logs for this update.
- Regression examples include escaped and nested-escaped values.

## Install

Update SakaLuX Suite from its canonical GitHub userscript, reload Jobs in Torn PDA, and check Training Log > Full Log. Verify `Suite v0.9.1009` below the title. Historical stat labels are assigned only after role confirmation.

## Verification

Syntax and parser examples checked against repository source. In-app Torn PDA confirmation pending.
