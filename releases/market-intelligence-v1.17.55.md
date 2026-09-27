# SakaLuX Market Intelligence v1.17.55

Release date: **2026-09-28**

## Performance
- YATA travel export is cached for 60 seconds and concurrent requests are deduplicated.
- Passive Travel scans are lifecycle-throttled instead of repeatedly running expensive travel calculations on nearly every DOM mutation.
- In-flight passive scans: 10 seconds.
- Landed-abroad passive scans: 12 seconds.
- Travel-agency passive scans: 15 seconds.
- Forced scans remain fast for navigation, manual actions and landed-stock refreshes.

## Expected effect
This specifically targets TornPDA/mobile lag on Travel pages without removing Best Route, Arrival Basket, Best Buys, stock ETA, MI INFO or market-price features.
