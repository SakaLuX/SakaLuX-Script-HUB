# 🔎 SakaLuX Account Auditor

> Standalone SakaLuX account-auditing tool. **Not registered in SakaLuX Script Hub.**

## Current version
**v1.3.6**

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

**v1.3.6** adds the shared top-to-bottom mobile sheet and translucent blur contract where the script exposes a sheet/panel.

## Recommended
Use Account Auditor only with a **private GitHub repository** dedicated to your own account snapshots. Restrict the GitHub fine-grained token to the minimum required repository and Contents read/write permission.

SakaLuX Script Hub is optional. Auditor remains intentionally standalone and excluded from `scripts.json`.

## Privacy
Account Auditor handles sensitive account information. Snapshot files can contain private Torn account data, financial information, combat/account statistics, events, message metadata and message text you explicitly choose to capture.

- Use a private GitHub repository.
- Git history may retain older snapshot contents after files are replaced.
- Explicitly captured message bodies are stored locally and included only when that option is enabled.
- The official Torn API does not provide private message body text; body capture occurs only after the user manually opens a message and presses the capture control.
- Do not publish or share the Torn API key or GitHub token.

## Important
- Account Auditor is **not a complementary Hub module** and must not be added to the Hub registry unless that product decision is intentionally changed later.
- The audit is a snapshot of data available through configured permissions and explicit captures.
- Missing permissions/unavailable endpoints can produce incomplete sections rather than fabricated data.

## License
**MIT**

## Release history
### v1.3.6 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

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

## Changelog

### v1.3.5

- Performance/UI optimization: adds the shared SakaLuX performance foundation, reduces duplicate high-frequency UI work, and aligns controls/cards with the Hub visual language.

