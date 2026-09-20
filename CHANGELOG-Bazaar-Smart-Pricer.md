# SakaLuX Bazaar Smart Pricer — Changelog

## v1.0.3 — 2026-09-20
- Replaced right-side **S PRICE** controls with compact **+** buttons placed immediately before **Qty**.
- Per-item **+** fills the full visible stack quantity and smart price together.
- Removes legacy right-edge controls that could overflow outside the mobile viewport.
- RW/bonus items remain protected by the skip settings and show a disabled per-item control when skipped.

## v1.0.2 — 2026-09-20
- Replaced the right-side launcher with a compact circular **+** button.
- Added **Skip Ranked War (RW) weapons** setting, enabled by default.
- Added **Skip items / weapons with bonus icons** setting, enabled by default.
- RW/bonus detection uses Torn bonus-attachment icons and rarity glow; skipped rows are never given quantity or price.

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
