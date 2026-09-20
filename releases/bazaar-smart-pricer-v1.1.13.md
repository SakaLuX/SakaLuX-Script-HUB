# SakaLuX Bazaar Smart Pricer v1.1.13

Release date: **2026-09-20**

## Restore first working Manage flow
This release intentionally restores the original v1.1.1 Manage-row opening logic — the first implementation that correctly opened the TornPDA editor arrow. Later geometry-based targeting is removed because it repeatedly selected the eye/details control.

The original freeze is addressed separately with bounded waits and per-item failure continuation, without changing the working arrow-selection method.
