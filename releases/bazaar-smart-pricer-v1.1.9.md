# SakaLuX Bazaar Smart Pricer v1.1.9

Release date: **2026-09-20**

## TornPDA Manage fix
The previous hidden-input assumption was incorrect for the current TornPDA layout: collapsed rows do not contain the editable price field.

v1.1.9 restores sequential row automation, but with a stricter control target:
- finds the far-right pointer/arrow in the compact row header;
- explicitly rejects Eye/View controls;
- waits until the actual price input is mounted;
- writes the new price through Torn/React-aware events;
- reacquires the live row and closes it before continuing.

SAVE CHANGES remains manual.
