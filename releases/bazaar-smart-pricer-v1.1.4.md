# SakaLuX Bazaar Smart Pricer v1.1.4

Release date: **2026-09-20**

## Critical Update All fix
`Update All` could remain forever on **Pricing 1/N**. The manage-pricing callback destructured only `marketValue` and `sellPrice`, while the new v1.1.2 pricing formula also referenced `buyPrice` and `lowestMarketPrice`. JavaScript therefore threw a `ReferenceError` before the Promise resolved.

### Fixed
- Manage pricing now receives all four pricing fields.
- A per-item exception is caught and resolved as `failed`, allowing the batch to continue.
- The button is restored when the batch completes.

### Pricing rules retained
1. Cheapest live Item Market listing when available.
2. `market_value` as fallback.
3. Torn City `buy_price` as the minimum floor when enabled.
