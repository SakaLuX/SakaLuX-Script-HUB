# SakaLuX Bazaar Smart Pricer — Changelog

## v1.1.14 — 2026-09-20
- Added a **2-second delay between every item** during Manage Bazaar **Update All**.
- During the pause the chip shows **Waiting 2s · X/N**.
- Keeps the v1.1.13 original working arrow-opening flow unchanged.
- Existing pricing calculations and protection rules are unchanged.
- The slower pacing is intended to reduce TornPDA/React rerender collisions that can leave a batch apparently stuck near the end.


## v1.1.13 — 2026-09-20
- Restored the original **v1.1.1 Manage editor opening logic**, which was the first flow that targeted the working TornPDA arrow correctly.
- Removed the later geometry/`elementFromPoint` targeting that kept opening the eye/details panel.
- Added bounded waits so a slow/broken item cannot freeze **Update All**: ~2.6 s to open editor and 18 s max for pricing.
- Reacquires the live row before each item and continues after failures instead of locking the batch.

## v1.1.12 — 2026-09-20
- Hard-fixed TornPDA **Update All** to use only the far-right chevron column.
- The target is calculated from the **Manage panel right edge** at roughly 28–32px inset; the eye icon sits much farther left and cannot match.
- Opening/closing now dispatches pointer + mouse events on that exact target.
- If the chevron cannot be identified, the item is skipped safely rather than falling back to the eye/details control.

## v1.1.11 — 2026-09-20
- Fixed the remaining TornPDA eye/details click in **Update All**.
- Root cause: the inner item node used for geometry ends near the eye column; the edit chevron belongs to the wider Manage row.
- Arrow targeting now uses the **full Manage panel right edge** and only accepts controls centered in its final 58px.
- The eye column is therefore excluded by position even if Torn gives it no identifying class/label.

## v1.1.10 — 2026-09-20
- Fixed TornPDA **Update All** clicking the eye/details icon instead of the far-right edit arrow.
- The script now targets the visual row's extreme-right control using `elementFromPoint`, matching the arrow position shown in TornPDA.
- Descendant-only lookup was removed as the primary strategy because the far-right arrow can live outside the inner `item___` node.
- Eye/details controls are explicitly excluded.

## v1.1.9 — 2026-09-20
- Fixed **Update All** for TornPDA builds where the Manage price input is not mounted until the row arrow is opened.
- Bulk processing now opens the **far-right row arrow**, waits for the price field, updates it, then closes that same row before continuing.
- Eye/View controls are explicitly excluded, and live rows are reacquired after every Torn React rerender.

## v1.1.8 — 2026-09-20
- Rebuilt **Update All** so it does **not open or close any Manage item row**.
- Torn keeps the manage price input mounted in the DOM while collapsed; bulk mode now updates that hidden/native input directly, as the original Quick Pricer does.
- This removes the recurring giant blank details panel and avoids row/accordion React rerenders.
- Native input/change events remain in place so Torn can enable **SAVE CHANGES**.

## v1.1.7 — 2026-09-20
- Fixed the large blank panel during **Update All**: the fallback selector could click Torn's **eye/details** control instead of the far-right price-editor chevron.
- Manage automation now selects only the right-most interactive control on the row and explicitly excludes eye/view/details controls.
- Price writes now send native setter + `InputEvent` + `keyup` + `change` + blur for stronger Torn/React state synchronization.
- Collapse only runs if the live row is still actually expanded.

## v1.1.6 — 2026-09-20
- Fixed **SAVE CHANGES** remaining disabled after bulk repricing. Price fields are now changed through the native input setter so Torn/React records the edits.
- Fixed the large blank expanded area left behind by **Update All**. Torn replaces accordion-row DOM nodes while editing, so the old toggle reference became stale; the script now reacquires the live row and fresh collapse control.
- Waits for each editor to close before processing the next item.

## v1.1.5 — 2026-09-20
- Fixed **Update All skipping every second item**. Torn rerenders accordion rows when they open/close, so the batch now stores only stable item IDs and reacquires each live DOM row before processing it.
- Removed live Item Market listings as the automatic pricing reference because transient/outlier listings produced incorrect bulk prices.
- Restored the proven Quick Pricer reference: **Torn `market_value`**.
- Keeps the user-requested **Torn City shop floor**: calculated price can never fall below `buy_price` while the setting is enabled.
- Deduplicates Manage rows by item ID and clears stale price cache on upgrade.

## v1.1.4 — 2026-09-20
- Fixed the **Update All** permanent hang at `Pricing 1/N`.
- Root cause: the Manage callback used `buyPrice` and `lowestMarketPrice` without receiving them from `fetchItemData`, causing a `ReferenceError` before the Promise could resolve.
- Added a guarded `try/catch` around Manage pricing so one bad item is counted as failed instead of freezing the complete batch.
- Live Item Market pricing and Torn City `buy_price` floor remain unchanged.

## v1.1.3 — 2026-09-20
- Fixed **Update All** freezing/stalling on an item. Live Item Market lookups now have a 6.5s watchdog and always release the queue.
- Supports both Torn v2 Item Market response formats (`itemmarket[]/cost` and `itemmarket.listings[]/price`).
- Bulk **Update All** no longer waits for a hidden per-item large-price confirmation; manual single-item updates still keep that safety prompt.
- Torn City `buy_price` floor remains enforced.

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
