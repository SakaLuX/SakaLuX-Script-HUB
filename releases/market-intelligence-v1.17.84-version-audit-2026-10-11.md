# Market Intelligence v1.17.84 — Automatic PRO recovery

Date: 2026-10-11

- Best Buys and Best Route Basket redraw on valid shared Hub PRO grant without opening the Hub panel.
- Landed-country view retries license status no more frequently than once every 90 seconds, honoring local backoff and existing request deduplication.
- UI-only recovery checks every 2.5 seconds without making network requests.
- Keeps protected features blocked when no valid grant is available.

This is a GitHub source release note. GreasyFork publication and device testing are not confirmed.
