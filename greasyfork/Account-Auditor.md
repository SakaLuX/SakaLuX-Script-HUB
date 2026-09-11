# 🔎 SakaLuX Account Auditor

Standalone SakaLuX account-audit tool. It is intentionally not registered as a SakaLuX Script Hub add-on.

## Current version

**v1.2.1**

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

## Current release notes

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

## Recommended

Use Account Auditor only with a **private GitHub repository** dedicated to your own account snapshots. Restrict the GitHub fine-grained token to the minimum required repository and **Contents: read/write** permission.

SakaLuX Script Hub is optional. Account Auditor may offer its installer, but Auditor remains a standalone tool and is intentionally excluded from `scripts.json`.

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

## License

**MIT License.** The current Account Auditor userscript declares `@license MIT`; this documentation intentionally matches the license currently present in the script metadata.
