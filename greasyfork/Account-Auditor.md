# 🔎 SakaLuX Account Auditor

> Standalone SakaLuX account-auditing tool. Not registered in SakaLuX Script Hub.

## Current version
**v1.3.1**

## What it does
- Builds a structured read-only Torn account snapshot using supported Torn API data.
- Creates split snapshot files for easier review: `summary.json`, `finance.json`, `combat.json`, `crimes.json`, `messages.json`, `events.json` and `logs.json`.
- Keeps the complete `SakaLuX-Account-Snapshot.json` audit file.
- Can sync sanitized snapshot data to a user-controlled private GitHub repository.
- Uses rate-limit-aware Torn API pacing with retry/backoff behavior.
- Can explicitly capture the currently visible Torn message only when the user presses **CAPTURE CURRENT MESSAGE**.
- Never opens private conversations automatically.
- Does not intentionally export browser cookies, passwords, Torn session tokens, the Torn API key or the GitHub token into snapshot files.
- Works with Torn PDA and Tampermonkey.

## Current release note

**v1.3.1** is the current standalone Account Auditor release. It uses Torn API v2 as the canonical source, removes overlapping duplicate selections, follows paginated account history, and stores split snapshot data only once while remaining outside the Script Hub registry.

## Recommended
Use Account Auditor only with a **private GitHub repository** dedicated to your own account snapshots. Restrict the GitHub fine-grained token to the minimum required repository and **Contents: read/write** permission.

SakaLuX Script Hub is optional. Account Auditor may offer its installer, but Auditor remains a standalone tool and is intentionally excluded from `scripts.json`.

## License
MIT

## Privacy
Account Auditor handles sensitive account information. Snapshot files can contain private Torn account data, financial information, combat/account statistics, events, message metadata and any message text you explicitly choose to capture.

- Use a private GitHub repository.
- Git commit history may retain older snapshot contents after files are replaced.
- Explicitly captured message bodies are stored locally and are included in `messages.json` only when that option is enabled.
- The official Torn API does not provide private message body text; the script captures body text only after the user manually opens the message and presses the capture control.
- Do not publish or share the Torn API key or GitHub token.

## Important
Account Auditor is **not a complementary Hub module** and must not be added to the Hub registry unless that product decision is changed intentionally later.

The audit is a snapshot of data available through the configured API permissions and explicit user captures. Missing permissions or unavailable endpoints can result in incomplete sections rather than fabricated data.

## Release history

### v1.3.1 — Complete inventory pagination

- Inventory categories now follow Torn API pagination instead of stopping at the first 250 items.
- Inventory item totals include every retrieved page while retaining the v1.3.0 deduplicated v2-first snapshot architecture.


### v1.3.0 — Deduplicated full-account collection

- Switched the audit payload to **Torn API v2 as the canonical source** instead of storing matching v1 and v2 data twice.
- Removed redundant subset pairs: `basic/profile`, `attacks/attacksfull`, `revives/revivesfull`, `newmessages/messages` and `newevents/events`.
- Added missing account selections including Bazaar, crimes, criminal record, display, Hall of Fame, trade and snapshot data where API permissions allow them.
- Follows API pagination with loop protection so multi-page history is not silently limited to the first page.
- Split mode no longer uploads a second full copy of the same account data. The main snapshot path becomes a small pointer to `manifest.json`.
- Added dedicated racing, forum, inventory, contacts and activity split files plus `other.json` fallback so newly returned unmapped fields are not discarded.
- Identical GitHub file content is not rewritten unnecessarily.
- Snapshot schema upgraded to `sakalux-torn-account-snapshot-v4`.

### v1.2.4 — Inline panel signature

- Removed the floating author badge from the Torn page.
- **Made with ❤️ by SakaLuX [2380374]** now lives inside the script panel as its final footer, with the author name and ID linked to the Torn profile.

### v1.2.3 — Persistent SakaLuX signature

- Added the persistent **Made with ❤️ by SakaLuX [2380374]** author footer with the author name and Torn ID linked to the profile.
- Keeps the SakaLuX identity visible consistently across TornPDA and desktop.

### v1.2.2

- Adopted the unified **SakaLuX Control Center** visual system used by Script Hub.
- Standardized panels, cards, buttons, inputs, borders, spacing and compatible settings toggles for a more consistent TornPDA/desktop experience.
- UI-only release: existing features, APIs and saved data remain unchanged.

### v1.2.1

- Added the shared SakaLuX Script Hub installation prompt used across the SakaLuX tools.
- Uses the common `SakaLuX_HUB_INSTALL_PROMPT_LAST` local-storage cooldown.
- The Hub prompt is offered at most once every 24 hours on the same Torn origin.
- The prompt is skipped when Script Hub is already detected.
- **LATER** records the cooldown and **INSTALL HUB** opens the official Hub installer.

### v1.2.0

- Added split snapshot files for smaller and easier-to-read GitHub payloads.
- Added user-triggered **CAPTURE CURRENT MESSAGE** support.
- Added deduplication and a **CLEAR CAPTURED MESSAGES** control.
- Increased Torn API pacing to reduce rate-limit problems.
- Upgraded the snapshot schema to `sakalux-torn-account-snapshot-v3`.
