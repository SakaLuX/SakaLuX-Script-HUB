# SakaLuX Account Auditor

**Current version: v1.1.2**

**Distribution:** manual/private use only. This tool is intentionally excluded from `scripts.json`, so SakaLuX Script Hub will not show it as a required/recommended install and will not generate Hub update prompts for it.

SakaLuX Account Auditor is a private read-only Torn PDA / Tampermonkey tool that builds a structured account snapshot and can sync it to a user-controlled private GitHub repository.

## v1.1.2

- Added centralized API pacing (~900 ms minimum gap) for all Torn requests.
- Added automatic retries with progressive backoff when Torn returns code 5 / Too many requests.
- Messages, events and logs are now collected before the broad audit so private/high-value data is prioritized.
- Reduced default private pagination from 20 pages to 5 for safer routine syncs.
- Inventory, contacts and personal stats now use the same retry-aware scheduler.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.1.user.js`.

## v1.1.1

- Fixes the v1.1.0 category errors for inventory, contacts lists and v2 personal stats.
- Requests v2 personal stats with `cat=all`.
- Reads Friends, Enemies and Targets separately with the required `cat` parameter.
- Reads inventory category-by-category using Torn's official inventory category values.
- Adds more official read-only self endpoints: battle stats, bounties, calendar, casino, competition, cooldowns, Discord, education, enlisted cars, equipment, faction, forum activity, gym, honors and icons.
- Adds sanitized `key/info` capability data so snapshot coverage can explain what the current API key can access without exposing the key itself.
- Treats `user/log` access error 16 as an unavailable capability rather than a broken endpoint. Torn requires a **Full access** API key for account logs.
- Continues to sync message metadata returned by Torn: message ID, sender, timestamp, topic, type and seen/read state.
- Explicitly records that Torn's official API v2 `UserMessage` schema does **not** expose the message body/content, so Account Auditor does not claim to read text Torn does not provide.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.0.user.js`.

## v1.1.0

- Expanded from the original 23 legacy user selections to broad Torn API v1 + v2 self-account coverage.
- Added private-data mode for messages, new messages, events, new events and account logs through the official Torn API.
- Added pagination support with a configurable page cap.
- Moved secrets to userscript storage (`GM_getValue` / `GM_setValue`) where available.
- Snapshot schema upgraded to `sakalux-torn-account-snapshot-v2`.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.0.0.user.js`.

## v1.0.0

- Initial private account snapshot collector.
- Collected 23 legacy Torn user selections independently.
- Synced a credential-scrubbed JSON snapshot to a user-controlled GitHub repository.
- Added configurable repository / branch / path, manual **SYNC NOW**, and optional auto-sync while Torn is open.

## Security / privacy

Use a **private GitHub repository**. When private-data mode is enabled, the snapshot may contain Torn messages metadata, events and detailed account history. Git commit history can retain older snapshot contents even after the current file is replaced.

The GitHub fine-grained token should be restricted to **Contents: read/write** only for the chosen private snapshot repository. Do not paste the token or Torn API key into chats.

## Message limitation

The current official Torn API v2 `UserMessage` object provides message ID, sender, timestamp, topic, type and seen/read status. It does not provide the actual message body/content, so the Auditor cannot retrieve message text through the documented official API.

## Snapshot file

Default target path: `SakaLuX-Account-Snapshot.json`

The snapshot contains generation metadata, account summary, API/key capability information, raw successful API responses grouped by version/privacy class, special parameterized endpoint results, and separate `errors` / `unavailable` sections.
