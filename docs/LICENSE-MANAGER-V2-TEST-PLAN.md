# License Manager v2 — security and regression checklist

Status: work in progress; these checks are **not** all passing or verified in TornPDA.

## Core tests
1. One Torn API key, 8 modules initialized together: inspect network requests; same-flight checks must coalesce.
2. Valid PRO: grants only listed entitlements until server expiry or the cache TTL.
3. Verified FREE: purchase dialog only on an actual premium action; refresh within 30 seconds after grant.
4. HTTP 429, 503, timeout, offline: present verification unavailable, **not** confirmed FREE. Never grant PRO on first failed check.
5. Change Torn API key while first request is pending: prior response must not grant new account.
6. Expire or revoke license: refresh/invalidate and ensure background tasks and privileged callbacks stop. Current five-minute cache means server revocation is not instantaneous.
7. Enable premium features, let license expire, renew: saved ON/OFF preferences should be restored without running PRO tasks while unlicensed.
8. TornPDA standalone vs Hub installed: compare requests, ordering, storage isolation and modal behavior.
9. Check Chrome/Tampermonkey and TornPDA on mobile, including SPA navigation, tab sleep and network recovery.

## Threat model
- The user's device runs editable JavaScript. Browser globals, localStorage and functions can be modified by the user. UI guards and even signed offline certificates cannot make purely local functionality tamper-proof.
- Authorize **every server-side premium operation on the server** against the actual account/license and a server-managed identity/session. Never accept a client-supplied `premium_active` as authorization.
- Limit raw Torn API key exposure and avoid persisting it in logs or license diagnostics.
- Retain 5-minute maximum cache only if a 5-minute revocation lag is acceptable. Invalidation is a client-side convenience, not an enforcement guarantee.
- Client-reported Bazaar buyer statistics are not authoritative sales records; do not use them as trusted payments or prizes.

## Open items
- Live regression and penetration tests are not run.
- Reported exploit has not been reproduced or eliminated.
- Signed server grant, central token exchange and admin security analytics are not implemented.
- Review release/version metadata before merging or distributing.
