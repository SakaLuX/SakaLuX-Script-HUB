# SakaLuX Account Auditor

**Current version: v1.0.0**

**Distribution:** manual/private use only. This tool is intentionally excluded from `scripts.json`, so SakaLuX Script Hub will not show it as a required/recommended install and will not generate Hub update prompts for it.

SakaLuX Account Auditor is a Torn PDA / Tampermonkey add-on that builds a structured account snapshot and can sync it to a user-controlled GitHub repository.

## v1.0.0

- Collects a broad set of Torn account API selections independently.
- Stores successful selections in a structured JSON snapshot and records unavailable selections separately.
- Never writes the Torn API key, GitHub token, browser cookies, passwords or session data into the snapshot.
- Adds GitHub repository / branch / path settings.
- Adds **SYNC NOW** and optional periodic auto-sync while Torn is open.
- Designed for a **private GitHub repository** because account snapshots may contain detailed personal Torn account data.
- Fine-grained GitHub token stays in local browser/PDA storage and should be restricted to Contents read/write access for the chosen snapshot repository only.
- Public API: `window.SakaLuXAccountAuditor.open()`, `.sync()`, `.snapshot()` and `.status()`.

## Snapshot file

Default target path: `SakaLuX-Account-Snapshot.json`

The snapshot includes generation metadata, a small account summary, selection coverage, raw API data grouped by selection, and errors for unavailable/permission-limited selections.
