# SakaLuX Bazaar Smart Pricer v1.0.1

Release date: **2026-09-20**

## Add Items Quick Fill
- Adds **S QUICK FILL** directly on the Add Items page.
- One tap fills **quantity and price** for every currently visible item row.
- Quantity comes from the displayed stack (`xN`) or enables Torn’s quantity checkbox when applicable.
- Uses the saved Smart Pricer price mode for the price.
- Per-item **S PRICE** follows the same quantity + price behavior.

## Validation
- JavaScript checked with `node --check`.
- `scripts.json` checked with `python3 -m json.tool`.
