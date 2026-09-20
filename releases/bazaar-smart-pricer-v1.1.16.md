# SakaLuX Bazaar Smart Pricer v1.1.16

Release date: **2026-09-20**

## Fifth-item root cause
The break at item 5 was not caused by speed. The restored v1.1.13 opener accepted `details` as a valid control label. On rows where the price editor was not already mounted, TornPDA could therefore choose the eye/details control and create the large blank panel.

## Fix
- Restores open → price → close for every Manage item.
- Excludes eye/view/preview/inspect/details from arrow selection.
- Prefers arrow/chevron/expand/edit metadata, then the final safe interactive control.
- Reacquires the live row before closing, so React rerenders cannot leave a stale toggle reference.
- Keeps the 2-second delay removed.
