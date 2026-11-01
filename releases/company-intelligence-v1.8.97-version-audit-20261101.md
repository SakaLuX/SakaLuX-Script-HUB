# company-intelligence v1.8.97 — shared license cache and rate-limit recovery

Date: 2026-11-01

- Reuses independently verified Ed25519 grants bound to the authenticated API key for the original certificate lifetime (at most five minutes).
- Coordinates online checks across isolated userscripts and pages; server cooldown deadlines survive reloads.
- Source, installed-version markers, Hub registry, offline registry and Greasy Fork documentation are synchronized.
- Validation: isolated-realm and Hub-startup regression tests, certificate/identity/entitlement/expiry tests, repository release gates, and full userscript performance budgets.
