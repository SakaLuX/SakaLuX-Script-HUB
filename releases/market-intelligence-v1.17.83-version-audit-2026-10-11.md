# Market Intelligence v1.17.83 — License bootstrap

Date: 2026-10-11

- Hydrates last positively verified, API-key-bound PRO grant (maximum 10 minutes, never after expiration) before initializing premium UI.
- Reduces duplicate checks while Hub's shared license status loads.
- Treats rate-limit and transport failures as inconclusive rather than explicit license denial.
- Travel Agency Best Route Basket and Bazaar Flip share Market Intelligence's entitlement state.

GitHub source and note updated. GreasyFork sync, API rate limits and TornPDA behavior are not independently verified.
