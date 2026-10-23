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

## Phase 1 measured result — GitHub Actions run 39906117603

A focused Suite optimization skips DOM mutation batches originating solely in `#chat-box` / `.chat-messages` in three observers: Lottery Max Buy, module-card refresh and ensure-all module cards. Other DOM changes continue to trigger the pre-existing scans.

| Offline jsdom workload | Before | After | Change |
|---|---:|---:|---:|
| Suite default scheduled timeouts | 145 | 24 | -121 (~83.4%) |
| Suite all-native-enabled scheduled timeouts | 318 | 156 | -162 (~50.9%) |

This is not a full TornPDA benchmark: tests use 40 unrelated chat mutations with offline API mocks. CI validation, PRO syntax, release gate, version consistency and TornPDA navigation all passed for the modified PR head. The reduction comes from avoiding irrelevant work, not increasing a timer threshold. Live module behavior remains to be smoke-tested before publication.

## Shared licensing request audit — 2026-10-23

- Existing Hub broker coalesces simultaneous checks for the same key in the **same userscript JavaScript realm**, caches server-accepted PRO responses up to five minutes and FREE responses up to 30 seconds, and enforces expiry.
- Bounty Hunter and Stock Manager now share an **in-flight** fallback request through `globalThis.__SakaLuXLicenseStandaloneFlight`, only for the same API key; each module still checks its own entitlement against the server response. The shared entry is cleared once the request completes.
- A global JavaScript property is not guaranteed to cross isolated userscript worlds in TornPDA/Tampermonkey. **No cross-world deduplication guarantee** should be claimed. Persisting a raw PRO flag in localStorage without separate signed-grant verification would be unsafe.
- Market Intelligence has its own short-lived, locally persisted prior-verification cache and explicit revalidation; it is not yet a consumer of the Bounty/Stock in-flight fallback.
- Next architectural pass: unify an opt-in broker into a canonical shared-core component and test isolated-world behavior with TornPDA and Tampermonkey before advertising one request across all scripts. Preserve server validation, account identity, signature and revocation handling.

CI note: one run exceeded the former 12-second per-worker **wall-clock** limit for Hub in a loaded CI runner. The process allowance was adjusted to 20 seconds, without increasing the measured timeout-count budget or removing assertions.

## Phase 2 — Company and Enhancer (2026-10-23)

- Company Director now checks the Hub broker first, otherwise joins the same-key standalone in-flight request shared with Market/Bounty/Stock. It checks `company_director` in the response and rejects account-key changes.
- Enhancer Guard now joins the same-key in-flight request when its broker is absent, validates `enhancer_guard` itself and normalizes UTC expiry.
- License syntax CI includes `tests/company-enhancer-license-sharing-regression.cjs`, which confirms scoped entitlements and that JavaScript globals **cannot be assumed shared between isolated userscript realms**.
- Not yet implemented: a secure cross-realm cache. A value in localStorage alone is not trustworthy authorization; each isolated realm would need to authenticate a signed, account-bound, short-lived grant before reusing it. No unsafe PRO flag sharing has been introduced.

## Signed Ed25519 grant foundation — 2026-10-23

The Hub's certificate panel already validates `slx-ed25519-v1` grants; its existing local PRO flag cache does **not** preserve an independently verifiable signed grant. A separate, currently **not yet embedded in production userscripts**, verifier is now available at `src/core/sakalux-signed-license-grant.js`.

- Uses the pinned Ed25519 server public key, signature, issuer/version, account subject, issue/expiry bounds (maximum 300 seconds), and exact entitlement list.
- Requires the *current Torn account ID obtained independently*; data embedded in a cached grant alone cannot establish identity.
- Uses a SHA-256 API-key fingerprint in shared storage, without persisting the API key.
- Storage is untrusted transport; every isolated realm must independently check the signature and current authenticated identity before allowing PRO.
- Synthetic signed fixture and tampering/expiry/replay tests run as part of PRO License CI.

**Not yet shipped/connected:** publication of authenticated signed grants by Hub, identity retrieval in every userscript realm, secure cache-consumer integration and end-to-end TornPDA/Tampermonkey tests. The screenshot confirms the Hub verification UI, not that these cross-realm steps already work.

## Hub signed-grant publication integration

Hub now writes a separate `SakaLuX_SIGNED_PRO_GRANT_V1` cache entry with certificate, entitlements and account claims **only after its Ed25519 broker diagnostics report verified=true**. The entry uses the SHA-256 fingerprint of the current API key, is cleared on key change or an authoritative FREE response, and is not used as an unsigned PRO flag. An independent realm must still validate the signature, expiry, entitlement and authenticated Torn user ID with `src/core/sakalux-signed-license-grant.js` before making an authorization decision.

Pending before claiming cross-world licensing is operational: embedding the verifier into the userscripts, obtaining a trusted current-user ID in each realm, handling certificate refresh and safe revocation, and real TornPDA/Tampermonkey tests.

## Cross-realm validation fixture

The signed-grant regression now constructs **two independent VM globals** sharing only a storage adapter. The second realm validates the certificate with its own Ed25519 verifier and checks that altered entitlements and a different authenticated Torn user ID are rejected. This is an automated isolated-realm simulation, **not** a TornPDA field test.

Production gating remains unchanged: no standalone script can safely use a signed cache entry until its own current Torn identity is established from an authenticated source. The certificate screenshot alone does not establish that per-script identity contract.
