# SakaLuX Bazaar Smart Pricer v1.1.8

Release date: **2026-09-20**

## Manage Update All architecture fix
The previous builds tried to open every Manage row, edit its price, then close it again. On TornPDA that could open the item-details panel instead of the price accordion and leave a large blank area.

v1.1.8 removes that interaction completely. Torn already mounts the Manage price input in the collapsed row DOM, so Update All writes directly to that input without expanding anything.

- No automatic row opening.
- No automatic row closing.
- No eye/details control interaction.
- Native React-aware input events are still dispatched.
- SAVE CHANGES remains a manual user confirmation.
