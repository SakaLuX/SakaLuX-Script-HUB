# SakaLuX Functional Optimization — phase 1 (2026-10-23)

## Scope and verified baseline

The cleanup in PR #47 is merged; this is a **new, non-destructive** audit branch for PRO startup, update delivery and performance.

Last verified CI workload (offline jsdom fixture):
- Hub: 42–43 scheduled timeouts, about 486–487 DOM queries
- Suite: 144 scheduled timeouts with default modules, 318 with all native modules enabled
- Market Intelligence: 7–9 scheduled timeouts
- All values are test-fixture measurements, not live TornPDA profiles.

## Potential issues requiring live verification

1. **PRO before opening Hub:** confirm on a fresh TornPDA page that independent premium modules read entitlement without manually opening Hub, react to revoked licenses, and restore saved ON/OFF choices after revalidation. Never equate cached unverified PRO with a newly authorized entitlement.
2. **Canonical updates:** Greasy Fork `@updateURL` and `@downloadURL` may lag repository source. Check both sources separately; an unpublished GitHub version must not be presented as installable from Greasy Fork.
3. **Suite timers:** measure the 318-timer all-enabled baseline, identify the top scheduling call stacks and only then coalesce timers; increasing CI thresholds is not optimization.
4. **API duplication:** count identical concurrent requests per origin, per API key, across Hub / Suite / modules without exposing keys in telemetry. Verify deduplication and backoff under timeout and 429 conditions.

## Acceptance criteria for the next code pass

- PRO controls work without manually launching Hub, with authenticated checks and preserved user preferences.
- No additional API calls when switching between Hub and Market with equal request identities.
- Core smoke tests, per-module tests and release gate all pass.
- Normal and all-enabled Suite timer counts are **lower** than this baseline under identical fixture settings (or the change is not labeled a performance optimization).
- Update badges distinguish registry version, GitHub source, Greasy Fork published version, and installed version correctly.

## Guardrails

No API keys or license tokens in logs, no bypass of premium restrictions, no automatic publication, no undocumented version bump, and no deletion of user settings.
