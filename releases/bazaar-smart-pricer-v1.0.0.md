# SakaLuX Bazaar Smart Pricer v1.0.0

Release date: **2026-09-20**

## Summary
Initial SakaLuX rebuild of the MIT-licensed Torn Bazaar Quick Pricer concept under the new name **SakaLuX Bazaar Smart Pricer**.

## Main fixes compared with the referenced v3.2.3 script
- Restores a usable API-key/settings interface.
- Runs through Torn SPA navigation with a broad Torn match and Bazaar runtime guard.
- Does not depend on only `td:last-child input[type="text"]`.
- Detects price inputs in both add-item and manage/reprice Bazaar rows.
- Adds per-item pricing and bulk visible-row pricing.

## Pricing features
- Torn market-value pricing with optional discount.
- Lowest item-market listing pricing.
- Lowest-listing undercut by flat dollars or percent.
- Optional filtering of ultra-low/storage listings.
- Optional warning below NPC sell value.
- Local caching and overlapping-request coalescing.

## UI
- Floating **S Smart Pricer** launcher.
- Mobile-friendly settings sheet.
- **S PRICE** row buttons.
- **PRICE ALL VISIBLE**, **TEST API**, **CLEAR CACHE** controls.

## Compatibility
Designed for TornPDA, Tampermonkey and Violentmonkey-style userscript environments.

## Validation
- JavaScript syntax checked with `node --check` before publication.

## Credits
Rebuilt from the behavior of the MIT-licensed **Torn Bazaar Quick Pricer + Smart Bazaar Pricing Panel** by R4G3RUNN3R [3877028], based on Zedtrooper [3028329] and community extensions.
