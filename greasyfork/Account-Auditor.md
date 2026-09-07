# SakaLuX Account Auditor

**Current version: v1.2.0**

**Distribution:** Greasy Fork / GitHub source sync. The script remains intentionally excluded from `scripts.json`, so SakaLuX Script Hub does not show it as a required/recommended install.

SakaLuX Account Auditor is a private read-only Torn PDA / Tampermonkey tool that builds a structured account snapshot and syncs sanitized data to a user-controlled private GitHub repository.

## v1.2.0

- Added split snapshots for easier reading and much smaller GitHub payloads: `summary.json`, `finance.json`, `combat.json`, `crimes.json`, `messages.json`, `events.json`, and `logs.json`.
- Keeps the full `SakaLuX-Account-Snapshot.json` as the complete audit file.
- Added **CAPTURE CURRENT MESSAGE**. The user must first open a Torn message/conversation and explicitly press the capture button.
- Captured message text is stored in userscript storage and can be included in `messages.json` during sync.
- The script never opens private conversations automatically and does not read/export browser cookies, passwords, Torn session tokens, Torn API keys, or the GitHub token.
- Official Torn API message metadata remains automatic: message ID, sender, timestamp, topic, type, seen/read state.
- Added deduplication for captured messages and a **CLEAR CAPTURED MESSAGES** control.
- Increased central Torn API pacing to about 1.1 seconds minimum between requests and retained progressive retry/backoff for code 5 / Too many requests.
- Snapshot schema upgraded to `sakalux-torn-account-snapshot-v3`.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.2.user.js`.

## Split files

- `summary.json` — account summary, profile, bars, cooldowns, travel, education, job, merits, refills, notifications and coverage.
- `finance.json` — money, net worth, stocks, properties, trades and item-market data.
- `combat.json` — battle stats, attacks, ammo, equipment, revives, weapon experience, work stats and skills.
- `crimes.json` — criminal record, personal stats, organized crime data and missions.
- `messages.json` — official Torn message metadata plus message bodies explicitly captured by the user.
- `events.json` — events, new events and notifications.
- `logs.json` — account logs when the API key has the required permission, otherwise the API error/unavailable reason.

## Messages

The official Torn API does not expose message body/content. Account Auditor therefore does not pretend it can retrieve message text from the API.

For body text, open the message yourself in Torn, open **☠︎ AUDIT**, then press **CAPTURE CURRENT MESSAGE**. If Torn's current page markup cannot be detected automatically, select the visible message text and press the button again. The captured text is stored locally and can be synced to `messages.json` when **Include explicitly captured message bodies** is enabled.

## v1.1.2

- Added centralized API pacing and progressive retry/backoff for Torn code 5 / Too many requests.
- Prioritized messages, events and logs before the broad audit.
- Reduced default private pagination to 5 pages for routine syncs.
- Inventory, contacts and personal stats use the same retry-aware scheduler.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.1.user.js`.

## v1.1.1

- Fixed v2 category handling for inventory, contact lists and personal stats.
- Added broad additional read-only account endpoints and `key/info` capability reporting.
- Treated `user/log` access error 16 as an unavailable capability rather than a broken endpoint.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.0.user.js`.

## v1.1.0

- Expanded to broad Torn API v1 + v2 read-only coverage.
- Added messages, new messages, events, new events and logs through the official API.
- Added private endpoint pagination and userscript-storage preference for secrets.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.0.0.user.js`.

## v1.0.0

- Initial private account snapshot collector.

## Security / privacy

Use a **private GitHub repository**. Split files and the full snapshot can contain private Torn account data and explicitly captured message text. Git commit history can retain older contents even after files are replaced.

The GitHub fine-grained token should be restricted to **Contents: read/write** only for the chosen private snapshot repository. Do not paste the token or Torn API key into chats.
