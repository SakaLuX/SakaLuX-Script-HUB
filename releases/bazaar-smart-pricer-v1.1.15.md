# SakaLuX Bazaar Smart Pricer v1.1.15

Release date: **2026-09-20**

## Root-cause change
The recurring large blank area appearing at roughly the fifth processed Manage item is not treated as a pacing problem anymore. The repeatable position indicates TornPDA is reacting badly to automatic row/accordion interaction.

v1.1.15 therefore removes that interaction entirely: **Update All does not click the right-side arrow, does not expand a row, and does not close a row.** Torn already keeps the native price input mounted in the DOM while the row is collapsed, so bulk mode writes directly to that input.

## Removed
- v1.1.14's 2000 ms delay between items
- `Waiting 2s · X/N` state
- automatic row opening/closing during bulk pricing

## Preserved
- pricing calculation and market reference logic
- RW and bonus-item protection
- $1 listing protection
- 18-second per-item timeout and failure continuation
- native React-aware input/change events
- manual **SAVE CHANGES** confirmation
