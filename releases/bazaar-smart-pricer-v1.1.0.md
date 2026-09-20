# SakaLuX Bazaar Smart Pricer v1.1.0

Release date: **2026-09-20**

## Quick Pricer parity rebuild
This release replaces the custom Bazaar-row implementation with the proven **Torn Bazaar Quick Pricer v2.9.3** structure (MIT licensed), then applies SakaLuX Hub integration and styling.

- Per-item Quick Add / Undo is injected in the same native item-description container as upstream.
- Quick Add fills the full available quantity and calculated price together.
- Equipped / disabled rows are not treated as sellable Add Items rows.
- The draggable **Quick Fill / Update All + Settings** chip follows upstream behavior.
- Settings preserve the polished upstream layout while using SakaLuX Hub dark colors.
- **Skip RW weapons** and **Skip bonus items** are enabled by default.
- NPC floor, $1 protection, discount/markup, alert threshold and cache controls are retained.
- Script Hub can call `SakaLuXBazaarSmartPricer.open()`, `.quickFill()` and `.refresh()`.

## Upstream attribution
Behavior/UI structure: Torn Bazaar Quick Pricer v2.9.3 by Zedtrooper [3028329] / Musa-dabwe contributors, MIT License.

## Validation
- `node --check SakaLuX-Bazaar-Smart-Pricer.user.js`
- `python3 -m json.tool scripts.json`
