# SakaLuX Bazaar Smart Pricer v1.1.6

Release date: **2026-09-20**

## Manage Bazaar repair
- Uses the browser-native input value setter plus `input`/`change` events so Torn React state recognizes repriced values and enables **SAVE CHANGES**.
- Reacquires each row after pricing before collapsing it; stale accordion controls are no longer clicked.
- Waits for collapse completion before opening the next row, preventing the large blank panel shown on TornPDA.

Pricing behavior from v1.1.5 is unchanged.
