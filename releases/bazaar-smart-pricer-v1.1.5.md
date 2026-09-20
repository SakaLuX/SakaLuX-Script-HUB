# SakaLuX Bazaar Smart Pricer v1.1.5

Release date: **2026-09-20**

## Why items were skipped
Torn can replace Bazaar row DOM nodes whenever an accordion row opens or closes. The old batch captured row elements once at startup; after one row changed, the next saved element could already be detached. v1.1.5 stores item IDs and reacquires the live row immediately before each update.

## Pricing model corrected
Automatic bulk pricing no longer uses the cheapest live Item Market listing. It now uses Torn `market_value`, the same base behavior as Quick Pricer, then applies the configured discount/markup.

## Torn City floor
When enabled, the final calculated price is never lower than `buy_price`. If `buy_price` is unavailable, `sell_price` is used only as a fallback floor.

## Cache
The previous pricing cache is cleared automatically once on upgrade so old live-market values cannot leak into the new model.
