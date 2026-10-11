# Enhancer Guard v1.3.72 — PRO state persistence

Date: 2026-10-11

## Changes
- Cache last server-confirmed entitlement for up to 10 minutes, bounded by license expiry and the configured API key.
- Revalidate entitlement in the background; an explicitly invalid license disables protected runtime immediately.
- Preserve the user's preferred ON/OFF state independently of pending or unavailable license verification.
- Resume previously selected premium functionality when the entitlement is confirmed again, without overriding manually saved OFF choices.

## Distribution
This repository note is not proof of a published GreasyFork release or GitHub Release. Publication and TornPDA integration require separate checks.
