# Market Intelligence v1.17.82 — PRO verification, Bazaar Flip and Best Route Basket

Date: 2026-10-11

- Reads the verified Hub entitlement and bounded local cache before calling the license endpoint.
- Coalesces simultaneous Market Intelligence entitlement checks.
- Waits 90 seconds after a rate-limited license response before retrying (20 seconds for other temporary network errors).
- Restores active Bazaar Flip / Travel premium access only with a recent confirmed grant tied to the same Torn API key and before expiry.
- Explicit denial invalidates cached entitlement. This is not a permanent license bypass.
- JavaScript syntax validated; live TornPDA and GreasyFork publication unconfirmed.
