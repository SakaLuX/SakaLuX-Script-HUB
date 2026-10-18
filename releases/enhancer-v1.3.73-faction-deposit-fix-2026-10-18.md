# Enhancer Guard v1.3.73 — Faction Deposit visibility fix

Release date: 2026-10-18

## Fixed
- Faction Armory and Deposit no longer enter the protected sale-row filtering path.
- Prevent accidental hiding of native Faction Deposit rows/controls caused by broad item selectors and full-stack protection.

## Preserved
- Existing locked-item protections on Bazaar, Trade, Display Case and Add Listing.
- Item protection state, license checks and settings.

## Verification
- Source guard verified to exclude all `factions.php` routes from sale filtering.
- Manual in-app validation still required on TornPDA and Tampermonkey.
