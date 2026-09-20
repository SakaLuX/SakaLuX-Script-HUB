# SakaLuX Bazaar Smart Pricer — Changelog

## v1.0.1 — 2026-09-20
- Added **S QUICK FILL** directly to Add Items.
- QUICK FILL now fills **both quantity and price** for each visible item, following the behavior of Torn Bazaar Quick Pricer.
- Quantity is taken from the visible `xN` stack amount, or the Torn quantity checkbox is enabled where that UI is used.
- Per-item **S PRICE** uses the same quantity + price fill path on Add Items.

## v1.0.0 — 2026-09-20
- Initial SakaLuX rebuild and rename.
- Restored API-key onboarding and a persistent settings panel.
- Added Bazaar add-item and manage/reprice input detection.
- Added Market Value, Lowest Listing and Undercut pricing modes.
- Added percentage and flat-dollar undercut options.
- Added low-listing filtering, NPC sell-price warnings and API caching.
- Added per-row **S PRICE** and **PRICE ALL VISIBLE** actions.
- Added Torn SPA / TornPDA navigation handling.
- Added public `SakaLuXBazaarSmartPricer` integration API.
