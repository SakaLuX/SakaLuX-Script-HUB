# SakaLuX Shared Core v1

Release date: 2026-09-26

Shared Core is source/build infrastructure, not a separately installed userscript. It is embedded into every standalone SakaLuX userscript.

## Included
- Shared performance helpers and mutation filtering.
- Hub detection and canonical standalone dock order/deduplication.
- Shared SPA route signaling.
- JSON storage helpers.
- API Request Broker with inflight dedupe, TTL cache, bounded concurrency, retry/backoff, timeout/abort handling, route-scoped stale suppression and privacy-safe diagnostics.
- Market Intelligence and Stock Manager API-read migration.
- Stock BUY/SELL transaction POSTs remain outside the broker.
- Permanent regression coverage for Core, broker, Market Travel, Stock rebalance and repository-wide standalone compatibility.
