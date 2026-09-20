# SakaLuX Bazaar Smart Pricer v1.0.3

Release date: **2026-09-20**

## Mobile Add Items UI
- Replaces the overflowing right-side per-item buttons with a compact **+** placed immediately before **Qty**.
- The **+** fills the item’s full visible stack quantity and calculated price in one tap.
- The bulk **S QUICK FILL** remains available.
- RW weapons and bonus items remain skipped by default; their per-item + is disabled.

## Validation
- `node --check SakaLuX-Bazaar-Smart-Pricer.user.js`
- `python3 -m json.tool scripts.json`
