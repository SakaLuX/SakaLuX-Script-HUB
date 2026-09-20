# SakaLuX Bazaar Smart Pricer v1.1.3

Release date: **2026-09-20**

## Fixes
- Update All cannot stay indefinitely on `Pricing 1/N`; Item Market requests have a hard watchdog.
- Supports both known Torn v2 Item Market payloads.
- Bulk mode does not pause for per-item big-change confirmation dialogs.
- Individual item repricing still shows the large-change safety prompt.
- Torn City `buy_price` remains the minimum allowed price when shop-floor enforcement is enabled.
