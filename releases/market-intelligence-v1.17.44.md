# SakaLuX Market Intelligence v1.17.44

Release date: **2026-09-20**

## Fix
The Items-page estimate decorator is now isolated from the Bazaar add-item/sale editor. Rows that expose both quantity and price editing controls are treated as Bazaar sale-entry rows and do not receive `MI est. net` badges.

## Changes
- Stops Market Intelligence estimate badges from being injected into Bazaar add-item/sale rows that contain quantity and price editors.
- Removes already-rendered MI estimate badges as soon as the Bazaar sale picker is detected, including Torn SPA/TornPDA transitions.
- Keeps normal Items-page market estimates unchanged outside Bazaar sale-entry controls.

## Release surfaces synchronized
- `SakaLuX-Market-Intelligence.user.js`
- `scripts.json`
- Script Hub embedded/offline registry
- `greasyfork/Market-Intelligence.md`
- `greasyfork/Script-Hub.md`
- this release-info file
- previous-version backup under `backups/market-bazaar-add-cleanup-v1.17.44-2026-09-20/`

## Validation
- `node --check SakaLuX-Market-Intelligence.user.js`
- `node --check SakaLuX-Script-Hub.user.js`
- `python3 -m json.tool scripts.json`
- version/release assertions for v1.17.44

No purchase, sale, pricing or travel calculation logic is changed by this release; the update only prevents the Items estimate decoration from polluting Bazaar sale-entry rows.
