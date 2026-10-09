# SakaLuX PRO Security Audit — 2026-10-10

## Scope
Static review of the four mixed-tier userscripts (Bazaar Smart Pricer, Mission Rewards, Market Intelligence, Elimination Assistant) and server endpoints `api/hub-premium-check.php`, `api/admin-premium-grant.php`, `api/pro-bazaar-ranking.php`, `api/_premium_private.php`, Torn API client, and throttle. Nine managed userscripts received syntax parsing checks. This was **not** a live penetration test or authenticated TornPDA integration test.

## Key findings

1. **HIGH — Bypassable client-side paywall (open).** Premium computations and control flow reside in distributable JavaScript. Button interceptors, shared global entitlement objects, and local cached state are not a security boundary against users modifying local scripts. Mitigation: move the premium-only computations that must be protected behind authenticated, server-side endpoints and re-check the license on every request.
2. **MEDIUM — Incomplete coverage and free/pro boundary (partially mitigated).** Premium button text interception was used in all four scripts. Updated Mission Rewards v1.0.54 to gate price-history storage and badge rendering; Market Intelligence v1.17.66 to gate Route Basket, Travel Planner and Best Travel Run calculations; Elimination Assistant v1.3.58 to gate Smart Score and tactical signal output; Bazaar Smart Pricer v1.1.22 retains direct checks in `fillAllItems` and `updateAllManagePrices`, and now exposes cached verified state. These gates improve normal runtime behavior, not resistance to tampering.
3. **MEDIUM — Shared entitlement verification throttling (open).** Each module may independently POST a valid Torn key to `hub-premium-check.php`; the endpoint limits requests to 20/15 minutes per IP. Multiple users behind an IP, or repeated initialization, may receive false negative access status. Mitigation: one trusted origin-specific verification broker with request coalescing and explicit unavailable/retry status; do not equate HTTP 429 with lack of a subscription.
4. **MEDIUM — Bazaar buyer leaderboard numbers are untrusted (open).** The premium ranking service authenticates subscription before calculating, but submitted buyer totals originate from the client's event snapshot; users can send arbitrary totals. Label as client-supplied analytics. Do not use for audited payments, public definitive rankings, credits or prizes without server-verified Torn events.
5. **LOW — PHP protection observed (static review).** License verification checks Torn identity via fixed API endpoints and DB validity; admin grant requires authenticated owner, CSRF, fixed seven-day grant, a throttle and SQL prepared statements; backend rejects malformed payloads and uses HTTPS. These protections should still be exercised with integration tests. Validated usernames, origins and requests only at reviewed endpoints; do not infer site-wide coverage.
6. **OPEN — Site-wide audit incomplete.** The complete website/frontend, deployment workflow, backend config/secrets, database schema/migrations, all API endpoints, TornPDA runtime and CDN/proxy settings were not exhaustively reviewed. Therefore the website or all premium actions cannot be certified secure.

## Regression checklist (manual)
- For each of the four modules, test FREE/no-key, expired PRO, active PRO, invalid API key, changed key, network error, timeout, 429 response.
- Invoke premium actions through normal buttons, programmatic calls, module API/HUB quick actions, scheduled refresh, and restored state.
- Confirm FREE core functions work with no key and safety features remain enabled.
- Confirm subscription revocation/expiry takes effect within the defined short cache period.
- Check that client/console requests cannot execute any **server-hosted** premium endpoint with expired or unrelated Torn credentials.
- For paid accounts, confirm Torn API ownership matches the licensed Torn player ID; confirm no API key is logged or retained server-side.
- For admin PRO grants, verify only owner can grant; CSRF required; 7 days additive; repeated concurrent requests correctly audited.
- For Bazaar ranking, verify input bounds, PRO requirement, and flag results as client event snapshot.

## Publication
Updated userscript versions and registry/release metadata must be published to GreasyFork separately. JavaScript syntax parsing is not equivalent to runtime or security testing.
