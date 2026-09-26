# 🔎 SakaLuX Account Auditor

> Standalone SakaLuX account-auditing tool. **Not registered in SakaLuX Script Hub.**

## Current version
**v1.3.24**


## Repository synchronization

- Verified: **2026-09-26**
- Canonical version: **v1.3.24**
- License: **MIT**
- Canonical GitHub source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
- GreasyFork description source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Account-Auditor.md
- GreasyFork page: Not currently registered with a verified GreasyFork script ID.
- Install/download URL: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
- Update metadata URL: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js

## What it does
- Builds a structured read-only Torn account snapshot using supported Torn API data.
- Creates split snapshot files including summary, finance, combat, crimes, messages, events, logs and other account sections.
- Keeps the complete SakaLuX Account Snapshot audit file/pointer structure.
- Can sync sanitized snapshot data to a user-controlled private GitHub repository.
- Uses rate-limit-aware Torn API pacing with retry/backoff.
- Can explicitly capture the currently visible Torn message only when the user presses CAPTURE CURRENT MESSAGE.
- Never opens private conversations automatically.
- Does not intentionally export browser cookies, passwords, Torn session tokens, Torn API key or GitHub token into snapshot files.
- Works with Torn PDA and Tampermonkey.

## Current release note

**v1.3.24 — Release documentation synchronized with the current Account Auditor userscript version**
- Release documentation synchronized with the current Account Auditor userscript version.

## Release history / Changelog

### v1.3.24 — Changes Since Last Audit
- Adds a compact local baseline/fingerprint for the previous successful audit.
- Produces a bounded, prioritized change report covering account, finance, battle/work stats, skills, crimes, racing, stocks and related tracked selections.
- Adds `changes-since-last-audit.json`, panel change count and public read-only diagnostics access.
- Keeps the comparison baseline unchanged when a sync fails.


### v1.3.23 — Shared Core v1
- Centralizes shared infrastructure in the embedded SakaLuX Core.
- Adds permanent Shared Core/API broker regression coverage.
- Embeds Shared Core v1 while keeping this userscript independently installable and runnable.




### v1.3.22 — Release documentation synchronized with the current Account Auditor userscript version
- Release documentation synchronized with the current Account Auditor userscript version.

### v1.3.21 — Release documentation synchronized with the current Account Auditor userscript version
- Release documentation synchronized with the current Account Auditor userscript version.

### v1.3.17 — Isolated Auditor API key creation
- Adds an Auditor-only CREATE AUDITOR API KEY button prefilled with the selections collected by Account Auditor.
- Keeps the Auditor Torn key completely separate from the Script Hub shared key.
- Auditor permissions are intentionally excluded from the Hub shared-key superset.


### v1.3.16 — Extended performance validation
- Serializes the API rate gate to preserve the 1,100ms minimum gap under concurrent callers. Overlapping read-only snapshots share one collection; API scopes, retries and privacy behavior are preserved.

### v1.3.15 — Performance and TornPDA smoothness

- Ignores unrelated chat/dock/footer changes in standalone launcher collection.
- Coalesces pending launcher refreshes instead of creating a timer per mutation.
- Preserves user-controlled account collection, privacy and synchronization settings.
- Synthetic DOM and Chromium performance coverage; complete previous-version backup included.


### v1.3.14 — Complete standalone registration
- Added global shared-standalone registration for `account-auditor`.
- Synchronized metadata/runtime version surfaces to v1.3.14.
- Kept Account Auditor standalone and excluded from `scripts.json`.

### v1.3.13 — Performance and release metadata audit
- Restricts donation-footer updates to the native module root; unrelated Torn and other-module DOM changes no longer schedule footer repairs.

### v1.3.12 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

### v1.3.11 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.

### v1.3.10 — Hub isolation
- Excludes Script Hub and its subtree from shared module styling/fullscreen rules; restricts footer routines to native module roots.

### v1.3.9 — Full-screen performance
- Mobile SakaLuX panels use the full available viewport.
- Removes backdrop blur and heavy mobile visual effects.
- Disables the legacy document-scanning Mobile Surface observer where present.
- Reduces mobile animation/transition cost for faster input and scrolling.

### v1.3.8 — Standalone panel repair
- Removes shared full-sheet dimension forcing so the auditor panel opens normally again.

### v1.3.7 — TornPDA host-scroll contract
- Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling and mobile interaction remain stable while blur is preserved.

### v1.3.6 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v1.3.5
- Performance/UI optimization: adds the shared SakaLuX performance foundation, reduces duplicate high-frequency UI work, and aligns controls/cards with the Hub visual language.

### v1.3.2 — API diagnostics and readable merits
- Saved Auditor API key takes priority over TornPDA injection.
- Added canonical v2 `selections=` fallback for selections rejecting path form.
- Removed invalid bare `trade` detail polling while retaining `trades` collection.
- Fixed nested profile extraction and added readable merit/education reference data.
- Added sanitized API-key capability information for log/access diagnostics.
- Snapshot schema is `sakalux-torn-account-snapshot-v5`; split manifest schema is `sakalux-account-split-v3`.

### v1.3.1 — Complete inventory pagination
- Inventory categories follow Torn API pagination instead of stopping at the first 250 items.

### v1.3.0 — Deduplicated full-account collection
- Made Torn API v2 the canonical snapshot source and removed redundant duplicated v1/v2 selections.
- Added missing account selections and protected paginated collection with loop detection.
- Split mode avoids uploading a duplicate second full account payload.
- Added racing, forum, inventory, contacts, activity and other split files.

### v1.2.4 — Inline panel signature
- Moved the SakaLuX signature inside the Auditor panel.

### v1.2.3 — Persistent SakaLuX signature
- Added the persistent linked author footer.

### v1.2.2 — Unified Control Center visual system
- Adopted the shared SakaLuX interface style.

### v1.2.1 — Shared Hub installation prompt
- Added the shared Hub installer prompt/cooldown while keeping Auditor standalone.

### v1.2.0 — Split snapshots and explicit message capture
- Added split snapshot files, explicit current-message capture, deduplication and safer API pacing.
