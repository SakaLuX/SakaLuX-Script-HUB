# SakaLuX Bazaar Smart Pricer v1.1.12

Release date: **2026-09-20**

## TornPDA exact chevron fix
The previous geometry still derived too much from the inner item node and could land on the eye/details cell. v1.1.12 anchors the target to the full Manage panel edge and probes only the last chevron column (~28–32px from the right edge). The eye column is physically outside this acceptance zone.

Opening and closing dispatch pointer/mouse events only on that exact target. If it is unavailable, the item fails safely.
