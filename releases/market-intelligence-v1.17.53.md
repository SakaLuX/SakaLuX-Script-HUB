# SakaLuX Market Intelligence v1.17.53

Release date: **2026-09-26**

## Changes
- Persistent **MI INFO: ON/OFF** control on landed foreign markets for the per-item Market Intelligence rows.
- Foreign-market stock parser now reads Torn's Stock column/cell only, fixing item names containing numbers such as **Type 98 Anti-Tank**.
- Market Intelligence version surfaces are synchronized to **v1.17.53**.
- Script Hub runtime version display is synchronized to its metadata version **v1.9.88**.

## Validation
- `node --check SakaLuX-Market-Intelligence.user.js`
- `node --check SakaLuX-Script-Hub.user.js`
- `python3 -m json.tool scripts.json`
