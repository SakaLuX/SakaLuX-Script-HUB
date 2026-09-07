# SakaLuX Account Auditor

**Current version: v1.1.0**

**Distribution:** manual/private use only. This tool is intentionally excluded from `scripts.json`, so SakaLuX Script Hub will not show it as a required/recommended install and will not generate Hub update prompts for it.

SakaLuX Account Auditor is a private read-only Torn PDA / Tampermonkey tool that builds a structured account snapshot and can sync it to a user-controlled private GitHub repository.

## v1.1.0

- Expanded from the original 23 legacy user selections to broad Torn API v1 + v2 self-account coverage.
- Adds read-only v2 data for attacks, ammo, inventory, item market listings, item mods, job details, medals, missions, perks, organized crimes, properties, races, reports, revives, trades, virus, stocks, money, stats and other available self endpoints.
- Adds private-data mode for **messages, new messages, events, new events and account logs** using the official Torn API only.
- Private endpoints support pagination where Torn supplies a next-page link, with a configurable safety cap of 1-100 pages per endpoint.
- Never reads or syncs the Torn password, browser cookies, Torn session, GitHub token or Torn API key.
- Script remains **read-only**: it does not send messages, make trades, buy/sell items, attack, change settings or perform other Torn account actions.
- GitHub token storage now prefers userscript storage (`GM_getValue` / `GM_setValue`) instead of Torn-origin localStorage, with localStorage used only as a migration fallback.
- Snapshot schema upgraded to `sakalux-torn-account-snapshot-v2`, separated into `data.v1`, `data.v2`, and `data.private`.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.0.0.user.js`.

## v1.0.0

- Initial private account snapshot collector.
- Collected 23 legacy Torn user selections independently.
- Synced a credential-scrubbed JSON snapshot to a user-controlled GitHub repository.
- Added configurable repository / branch / path, manual **SYNC NOW**, and optional auto-sync while Torn is open.

## Security / privacy

Use a **private GitHub repository**. When private-data mode is enabled, the snapshot may contain Torn messages and detailed account history. Git commit history can retain older snapshot contents even after the current file is replaced.

The GitHub fine-grained token should be restricted to **Contents: read/write** only for the chosen private snapshot repository. Do not paste the token or Torn API key into chats.

## Snapshot file

Default target path: `SakaLuX-Account-Snapshot.json`

The snapshot contains generation metadata, account summary, API coverage, raw successful API responses grouped by version/privacy class, and a separate error section for unavailable or permission-limited endpoints.
