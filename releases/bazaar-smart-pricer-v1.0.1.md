# SakaLuX Bazaar Smart Pricer v1.0.1

Release date: **2026-09-20**

## Add Items workflow
- Adds a prominent **S QUICK FILL** button directly above the Bazaar Add Items sale rows.
- The button calls the same pricing engine as **PRICE ALL VISIBLE** and fills all detected visible price inputs.
- It works with Torn SPA/TornPDA navigation and is removed automatically outside the Add Items flow.
- Per-row **S PRICE**, settings and Manage/Reprice support remain unchanged.

## Validation
- JavaScript syntax checked with `node --check`.
- `scripts.json` validated with `python3 -m json.tool`.
