# SakaLuX Bazaar Smart Pricer — Changelog

## v1.1.2 — 2026-09-20
- Fixed **Update All** price source: it now uses the cheapest live Item Market 2.0 listing when available, instead of treating `market_value` as the live price.
- Added **Torn City shop floor**: if the calculated price is below `buy_price`, the city-shop price wins.
- `market_value` remains fallback; `sell_price` is only a secondary floor when no city buy price exists.
- Adjusted request pacing for the extra live-market request.

## v1.1.1 — 2026-09-20
- Added dedicated **API Access** beside Close; Hub shared key is used automatically when available.
- Removed the GitHub link from the settings header.
- Fixed false **bonus item** detection on normal armor/items.
- **Update All** can now open collapsed Manage Bazaar rows sequentially, update prices and close them again; Torn **SAVE CHANGES** remains the final confirmation.

## v1.1.0 — 2026-09-20
- Full Quick Pricer v2.9.3 parity rebuild under MIT provenance.
- Restores upstream per-item Quick Add/Undo placement and full quantity + price filling.
- Removes the custom S QUICK FILL bar and broken custom row-button layout in favor of the upstream draggable Quick Fill / Settings chip.
- Adds SakaLuX Hub dark skin while preserving the upstream settings geometry.
- Adds generic bonus-item skipping in addition to RW skipping; both default ON.
- Adds Script Hub API integration and synchronizes scripts.json.

## v1.0.4 — 2026-09-20
- Hotfixes the CSS for the new per-item **+** controls.
- Keeps each **+** immediately before **Qty**, with full quantity + price fill.
- Keeps the overflowing right-side controls removed.
- RW/bonus skip protection remains enabled by default.

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
