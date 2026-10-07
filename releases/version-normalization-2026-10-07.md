# SakaLuX version normalization — 2026-10-07

Fixes mismatched userscript headers and installed-version signals, stale offline registry data, release documentation and update-cache behavior. Versions use three numeric components, increasing the patch before removing the fourth component. Shared runtime versions remain independent.

INFO describes each module’s purpose and features. NEW shows that module’s current release version, date and changes. The Hub verifies GitHub metadata when GreasyFork is behind or unavailable before offering the GitHub installer.

| Script | Previous | Current |
|---|---|---|
| account-auditor | 1.3.27.7 | 1.3.28 |
| bazaar-smart-pricer | 1.1.16.7 | 1.1.17 |
| bazaar | 5.3.47.7 | 5.3.48 |
| chat-intelligence | 1.2.38 | 1.2.39 |
| company-intelligence | 1.8.56.7 | 1.8.57 |
| elimination-assistant | 1.3.50.7 | 1.3.51 |
| enhancer | 1.3.56.7 | 1.3.57 |
| market-intelligence | 1.17.60.7 | 1.17.61 |
| mission-rewards | 1.0.49.7 | 1.0.50 |
| script-hub | 1.9.93 | 1.9.94 |
| stock-manager-advisor | 0.8.18.7 | 0.8.19 |
| suite | 0.9.983.1 | 0.9.984 |
| bounty-hunter | 0.5.6.7 | 0.5.7 |

## account-auditor v1.3.28

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## bazaar-smart-pricer v1.1.17

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## bazaar v5.3.48

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## chat-intelligence v1.2.39

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.

## company-intelligence v1.8.57

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## elimination-assistant v1.3.51

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## enhancer v1.3.57

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## market-intelligence v1.17.61

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## mission-rewards v1.0.50

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## script-hub v1.9.94

- Repairs installed-version detection after updates and synchronizes all module versions with scripts.json and the offline registry.
- Verifies GitHub source metadata when GreasyFork is behind or unavailable, and offers the verified current installer.
- Refreshes stale update metadata; INFO describes module features and NEW shows the current version, date and actual changes.

## stock-manager-advisor v0.8.19

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## suite v0.9.984

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.

## bounty-hunter v0.5.7

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

## Release checks

Strict preflight builds all 13 packages, each with RELEASE_INFO.md, a release manifest and SHA256SUMS. CI checks installed-version signals, registry consistency, INFO/NEW rendering and verified update-source behavior.
