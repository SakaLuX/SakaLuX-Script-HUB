# SakaLuX Bazaar Smart Pricer v1.1.2

Release date: **2026-09-20**

## Pricing fix
The previous build used Torn `market_value` as the main pricing reference. That is an estimate and can differ from current market listings. v1.1.2 queries Item Market 2.0 and uses the cheapest live offer when available.

## Torn City floor
When shop-floor enforcement is enabled, a calculated price can never be lower than Torn `buy_price` (the city-shop purchase price). `sell_price` is only a fallback when no `buy_price` exists.

## Fallbacks
1. Cheapest live Item Market offer.
2. Torn `market_value` if live market lookup fails.
3. City-shop floor uses `buy_price`, falling back to `sell_price`.
