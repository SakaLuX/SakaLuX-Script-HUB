# Changelog

## Additional premium pathway checks — 2026-10-10

- Bazaar Smart Pricer v1.1.21: corrected `async async` parser regression and retained direct Update All PRO validation.
- Bounty Hunter v0.5.11: checked PRO entitlement before full-board loading or FFScouter enrichment, while keeping the basic DOM list FREE.
- JavaScript syntax for all seven mixed modules was checked using a parser (not browser runtime testing).
- Continued audit is necessary for other non-click entry points, and true tamper resistance requires server-hosted premium operations.

## Freemium execution-path audit — 2026-10-10

- Checked the six mixed-tier modules for UI-only access guards.
- Added direct PRO guards to Stock Manager rebalance execution (v0.8.22), Bazaar Smart Pricer bulk Update All (v1.1.20), Market Intelligence Museum scan (v1.17.64), and Elimination FF loading/calibration (v1.3.55).
- Stock PANIC execution already performed a PRO check; left that guard intact.
- Remaining premium pathways, including other background scans, calculations and direct API entry points, have not yet been exhaustively secured. JavaScript guards are bypassable; stronger access control requires server-hosted premium computation.
- Updated registry release notes and GreasyFork documentation for the modified modules.

## Freemium release — 2026-10-10

- Split six previously FREE modules into FREE baseline and PRO advanced features: Bazaar Smart Pricer v1.1.19, Mission Rewards v1.0.53, Market Intelligence v1.17.63, Bounty Hunter v0.5.9, Elimination Assistant v1.3.54 and Stock Manager & Advisor v0.8.21.
- Added conditional client-side access checks on identified premium action controls, using the verified Hub entitlement for the same Torn API key or the premium verification endpoint.
- Made the floating Stock Manager PANIC feature PRO and added an explicit entitlement check inside `panic()`, guarding non-button invocation paths.
- Preserved baseline analysis and safety functionality for FREE users.
- Expanded premium entitlements in `SakaLuX-Website/api/hub-premium-check.php`; deployed backend availability must be checked separately.
- Updated `scripts.json` with mixed access tiers, feature lists and release notes and updated six GreasyFork documents.
- **Limitations:** client-side access checks can be bypassed; not every alternate invocation path has been integration-tested. Do not represent this release as secure server-side enforcement. GreasyFork publication and TornPDA regression tests are separate.


## PRO synchronization and confirmation dialogs — 2026-10-09

- Hub v1.9.121 publishes its successful server-confirmed PRO status to installed modules for the matching API key.
- Enhancer Guard v1.3.65 and Bazaar Thanker v5.3.64 consult Hub's verified PRO state when opened, avoiding false paywall messages after a previous failed verification.
- Bazaar Thanker v5.3.64, Mission Rewards v1.0.52 and Elimination Assistant v1.3.53 move selected destructive reset confirmations to branded asynchronous SakaLuX popups.
- Other synchronous confirmations, notably Stock Manager trade confirmations, remain native until each transaction flow can be safely converted.
- Synchronized scripts.json and affected GreasyFork documentation.

## Unified SakaLuX Dialogs — 2026-10-09

- Introduced a reusable branded dialog component in all 9 managed userscripts and Script Hub v1.9.120.
- Existing native alert notifications have been replaced with styled dialogs for PRO, errors and notices; supports actionable buttons for future use.
- Native synchronous confirm/prompt calls remain until the underlying workflows are migrated safely to asynchronous dialogs.
- Refreshed registry, per-script release notes and GreasyFork documentation.

- Enhancer Guard: v1.3.63
- Bazaar Thanker: v5.3.61
- Bazaar Smart Pricer: v1.1.18
- Mission Rewards: v1.0.51
- Market Intelligence: v1.17.62
- Bounty Hunter: v0.5.8
- Elimination Assistant: v1.3.52
- Company Intelligence: v1.8.67
- Stock Manager & Advisor: v0.8.20

## Company Intelligence v1.8.66 — 2026-10-09

- Director selection verifies active PRO before unlocking its mode; persisted Director choice resets until validated.
- Network, timeout, HTTP and rate-limit failures no longer appear as a definitive statement that the subscription is inactive.
- Replaced contradictory native alert with inline feedback; Employee stays free and private Torn company data still requires actual director permissions.
- Synchronized the script version, `scripts.json` release notes and GreasyFork documentation.

## Company Intelligence v1.8.65 — 2026-10-09

- Labeled the Company interface's two modes **EMPLOYEE · FREE** and **DIRECTOR · PRO**.
- Retained free Employee access and the existing server-confirmed PRO entitlement requirement for Director.
- Updated `scripts.json` release notes, current version, and GreasyFork documentation.

## Company Intelligence v1.8.64 — 2026-10-09

- Fixed the still-present single-element `$('[data-mode]', root).forEach(...)` crash by using `$('[data-mode]', root).forEach(...)`.
- Verified the saved source uses `$` for the mode buttons.
- Updated the Hub registry release details and GreasyFork documentation; GreasyFork remains the update/download provider.

## Company Intelligence v1.8.63 — 2026-10-09

- Fixed `$(...).forEach is not a function` when initializing Employee/Director mode buttons.
- Uses `$('[data-mode]', root)` so the buttons are iterated as a collection.
- Synchronized `@version`, runtime/canonical installed-version markers, Hub registry release notes, and GreasyFork documentation.
- Retains GreasyFork `@downloadURL` and `@updateURL` metadata.

## Release validation follow-up — 2026-10-09

All 13 userscript sources were parsed successfully with JavaScript syntax validation, including the full 0.9.984 Suite source. This is a syntax check, not an execution or browser integration test.

The following newer versions supersede the earlier release-documentation reconciliation, which remains historical:

| Script | Current source version |
|---|---|
| Bazaar Thanker | 5.3.64 |
| Company Intelligence | 1.8.66 |
| Enhancer Guard | 1.3.65 |
| Script Hub | 1.9.119 |
| SakaLuX Suite | 0.9.984 |

The four matching Greasy Fork Markdown release documents now contain current-version headers and changelog entries. GitHub Actions release-preflight completion and Greasy Fork remote synchronization were not independently verified.


## Release documentation reconciliation — 2026-10-09

Current version sources are the userscript `@version` fields. Earlier entries below are retained as historical records, not overwritten.

| Script | Current checked version | Release documentation |
|---|---|---|
| Account Auditor | 1.3.28 | matches |
| Bazaar Smart Pricer | 1.1.17 | matches |
| Bazaar Thanker | 5.3.59 | corrected |
| Chat Intelligence | 1.2.39 | matches |
| Company Intelligence | 1.8.61 | corrected |
| Elimination Assistant | 1.3.51 | matches |
| Enhancer Guard | 1.3.61 | corrected |
| Market Intelligence | 1.17.61 | matches |
| Mission Rewards | 1.0.50 | matches |
| Script Hub | 1.9.111 | corrected |
| Stock Manager & Advisor | 0.8.19 | matches |
| Bounty Hunter | 0.5.7 | matches |
| SakaLuX Suite | requires separate full-file version validation | pending |

Bazaar Thanker v5.3.59 fixes malformed ranking code and a duplicated corrupt block that prevented Greasy Fork from parsing the updated userscript. The release documentation for Bazaar Thanker, Company Intelligence, Enhancer Guard and Script Hub is now aligned with the published repository userscript metadata.


## Version normalization — 2026-10-07

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

### account-auditor v1.3.28

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### bazaar-smart-pricer v1.1.17

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### bazaar v5.3.48

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### chat-intelligence v1.2.39

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.

### company-intelligence v1.8.57

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### elimination-assistant v1.3.51

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### enhancer v1.3.57

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### market-intelligence v1.17.61

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### mission-rewards v1.0.50

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### script-hub v1.9.94

- Repairs installed-version detection after updates and synchronizes all module versions with scripts.json and the offline registry.
- Verifies GitHub source metadata when GreasyFork is behind or unavailable, and offers the verified current installer.
- Refreshes stale update metadata; INFO describes module features and NEW shows the current version, date and actual changes.

### stock-manager-advisor v0.8.19

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### suite v0.9.984

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.

### bounty-hunter v0.5.7

- Returns to a three-part version with a higher patch number, so updates from the previous four-part version are detected.
- Synchronizes the installed version reported to Script Hub with userscript metadata and the module runtime.
- Updates the current release notes and documentation; INFO explains features and NEW lists changes.
- Includes Shared Standalone Dock Runtime v1.1.10: the gold S stays first in the status bar and sits 2px lower.

### Release checks

Strict preflight builds all 13 packages, each with RELEASE_INFO.md, a release manifest and SHA256SUMS. CI checks installed-version signals, registry consistency, INFO/NEW rendering and verified update-source behavior.


## Bounty Hunter v0.3.7
- Live status now falls back to Torn API v1 basic when API v2 basic does not expose a usable status, fixing Traveling/Abroad targets showing as `Status ?`.
- Hospital window is now strict: when set to 5 minutes, hospital targets are shown only when a valid release timestamp exists and is within 5 minutes. Unknown hospital release times are hidden instead of being treated as 0 minutes.
- Live enrichment checks at least 24 likely beatable candidates (up to 40) so displayed targets are much less likely to remain unverified.
- Travel destination metadata is preserved on enriched targets.

## Bounty Hunter v0.3.8
- Beatable-only is now status-strict: Unknown status targets are never shown as attackable.
- Hospital window no longer has a watchlist bypass; a 5-minute setting strictly hides hospital targets with more than 5 minutes remaining or without a valid release timestamp.
- Live status validation now checks candidates progressively until it finds enough genuinely attack-ready targets instead of validating only a fixed top-24 reward list.
- Status lookup now tries multiple Torn v2/v1 basic/profile routes for better TornPDA compatibility.

## Bounty Hunter v0.4.0
- Embedded SakaLuX Shared Core v1 into the standalone Bounty Hunter build.
- Registered Bounty Hunter in Shared Core settings protection and dock ordering.
- Settings/cache storage now uses Shared Core storage when available, with localStorage fallback.
- Torn/FFScouter requests now consistently benefit from the Shared Core API broker, request dedupe, TTL cache, retry/backoff, concurrency control and route-scoped cancellation.
- Enabled the Shared Core Hub skin and added a Bounty-specific professional UI layer using the same SakaLuX design tokens.
- Tightened mobile spacing, card hierarchy, filters, controls, focus states and footer/list readability.
- Added Shared Core performance debounce plumbing for future incremental renders.

## Bounty Hunter v0.4.1
- Adds the compact SakaLuX footer used by the other modules: SEND MONEY, SEND ITEMS and Made with ❤️ by SakaLuX [2380374].
- Donation buttons and author link open the SakaLuX Torn profile, matching Script Hub behavior.
- Footer styling follows Shared Core / Hub tokens and remains compact on TornPDA.
## Bounty Hunter v0.4.2
- Fixed the v0.4.1 TornPDA layout regression where the donation footer became a sibling of the panel and squeezed the Bounty Hunter UI into a narrow left column.
- Donation footer now lives inside the panel section and spans its full width.
- Hub/Shared Core professional skin now applies to the actual panel section instead of styling the full-screen overlay.
- Preserves SEND MONEY, SEND ITEMS and Made with ❤️ by SakaLuX [2380374].
## Bounty Hunter v0.4.3
- TornPDA/mobile panel now uses almost the full available screen: full width minus 8px and viewport height minus the top app area.
- Fixed the mobile media rule that was shrinking the full overlay itself.
- Target results now flex to fill remaining space and scroll independently.
- Footer remains compact at the bottom while results keep maximum usable space.

## Bounty Hunter v0.4.4
- Added reusable Shared Core v1.2.0 workspace layout helper.
- Bounty Hunter now fills the usable TornPDA viewport from the top while reserving the bottom chat/navigation zone.
- Uses visualViewport so panel geometry stays correct across phone viewport changes.
## Bounty Hunter v0.4.5
- Aligns the mobile workspace with Script Hub: top 0, side 4px and bottom reserve 36px so the panel reaches down to just above the TornPDA chat/navigation area.
- Removes overlay and footer blur/dim effects.
- Active filter/toggle chips now use a clear orange ON state; inactive controls stay dark.
- Adds aria-pressed/data-state to filter chips for reliable visual/semantic state.
- Shared Core updated to v1.2.1 with Hub-aligned workspace defaults for reuse by other modules.
## Bounty Hunter v0.4.6
- Fixed filter/toggle controls that visually remained dark even when enabled.
- Active controls now render orange through both high-specificity CSS and inline important state painting.
- Added mobile pointer/touch safeguards so taps reliably execute on TornPDA.

## Bounty Hunter v0.4.7
- Added rate-limit-aware Torn API paging.
- Stops duplicate broker/direct/fallback calls on Too many requests / HTTP 429.
- Full-board pages are paced at ~950ms and cached for 2 minutes.
- Activates a 65-second cooldown after a rate-limit response and reuses the last successful board cache during cooldown.
- Keeps partial progress instead of discarding it.
## Bounty Hunter v0.5.0
- Major scanner optimization release.
- Adds adaptive API pacing based on latency and rate-limit feedback.
- Adds resumable/incremental full-board scanning with persisted next offset and partial progress.
- Adds a separate 12-hour per-target FFScouter cache for FF/BS estimates.
- Keeps live Torn status on a short cache and prioritizes relevant beatable candidates.
- Adds live progress UI for board scan, FFScouter, status enrichment and API cooldown.
- Expands Script Hub health diagnostics and synchronizes the module info/release description.
- Fixes the canonical installed-version fallback to report 0.5.0 instead of the stale 0.4.2.
## Bounty Hunter v0.5.1 + Script Hub v1.9.91
- Bounty Hunter public distribution moves to GreasyFork #598988; GitHub remains the source repository.
- Shared Hub API key creation now includes Torn: Bounties.
- Hub API CHECK validates Bounties access and reports a specific missing-permission error.
- Bounty Hunter separates transient rate-limit/cache warnings from fatal health errors, preventing false Hub API ERROR badges.
- Adds stale/capped FFScouter and live-status cache pruning.

## Bounty Hunter v0.5.2 + Shared Standalone Dock v1.0.1
- Adds Bounty Hunter to the common Standalone Dock.
- Removes Bounty Hunter chat/floating launchers.
- Dock no longer persists open state; closes on S, module selection, route change, outside tap, or after 8 seconds.
- Restores and rebinds the compact native S launcher.
## Bounty Hunter v0.5.3 + Script Hub v1.9.92 — Shared Standalone Dock v1.1.0
- Audits and rebuilds the Standalone Dock runtime used by every managed standalone SakaLuX userscript.
- Dock now always starts closed instead of inheriting a stale open state.
- Adds a dedicated X close button and restores the compact native gold S launcher.
- Closes on module launch, route change, outside tap, Escape and a six-second idle timeout.
- Protects runtime v1.1.0 from older embedded dock copies loaded later by other scripts.
- Bounty Hunter remains Dock-only; legacy chat and floating page launchers are removed.
## Bounty Hunter v0.5.4 + Script Hub v1.9.93 — Standalone Dock v1.1.1
- Restores the previous Standalone panel header/logo design; removes the separate X button.
- Restores the original compact native S launcher styling beside Torn status/cooldown icons.
- Adds capture-phase launcher handling so the S button works even if an older installed userscript injected stale handlers.
- Adds a DOM close enforcer so stale runtimes cannot reopen/leave the panel open.
- Hard-closes on startup, registration, route change, outside tap, module launch, Escape and timeout.
- Bounty Hunter remains Dock-only; no chat or floating Bounties launcher.
## Standalone Runtime v1.1.2 — batch maintenance releases
- Runtime-only maintenance release across every userscript that embeds Shared Standalone Dock.
- Enhancer Guard 1.3.55
- Account Auditor 1.3.26
- Mission Rewards 1.0.48
- Bazaar Thanker 5.3.46
- Bazaar Smart Pricer 1.1.15
- Elimination Assistant 1.3.49
- Market Intelligence 1.17.59
- Stock Manager & Advisor 0.8.17
- Company Intelligence 1.8.55
- Bounty Hunter 0.5.5
- No module feature changes; the version bumps exist so installed copies actually receive Dock Runtime v1.1.2.
- Script Hub is intentionally not version-bumped by this batch.
## Standalone Runtime v1.1.3 — Torn status-bar regression fix
- Stops injecting an extra <li> into Torn's native statusIcons list.
- The S launcher is now an absolutely positioned overlay anchored near the drug/cooldown area, so Torn's responsive child-count rules remain untouched.
- Fixes native status icons disappearing after Points/Merits/Refill on TornPDA.
- Runtime-only maintenance bumps: Enhancer 1.3.56, Auditor 1.3.27, Missions 1.0.49, Bazaar Thanker 5.3.47, Smart Pricer 1.1.16, Elimination 1.3.50, Market 1.17.60, Stocks 0.8.18, Company 1.8.56, Bounty 0.5.6.
- Script Hub version is unchanged.
## Standalone Runtime v1.1.4 — legacy launcher restore
- Restores the exact native S launcher implementation from the previously working runtime.
- No status-bar redesign/repositioning.
- Keeps singleton/version arbitration and deterministic close lifecycle.
- Maintenance releases use a fourth numeric component .1 as requested.
- Enhancer 1.3.56.1, Auditor 1.3.27.1, Missions 1.0.49.1, Bazaar Thanker 5.3.47.1, Smart Pricer 1.1.16.1, Elimination 1.3.50.1, Market 1.17.60.1, Stocks 0.8.18.1, Company 1.8.56.1, Bounty 0.5.6.1.
- Script Hub is intentionally unchanged.

\n## Standalone Runtime v1.1.5 Sep-15 restore\n- Restores Sep-15 plain gold S launcher and old Standalone visuals.\n- Keeps singleton/open-close fixes.\n- Uses .2 maintenance suffixes; Hub unchanged.\n
## Standalone Runtime v1.1.6 + Suite launcher cleanup
- Shared Standalone S is now a neutral plain-gold glyph and never inherits Torn/racing icon classes.
- Launcher prefers placement beside Drug/Cooldown status.
- Removed Suite's obsolete Standalone collector bootstrap, which was independently creating/moving standalone UI.
- Suite master launcher no longer clones Torn icon classes.
- Maintenance suffix .3 distributed to standalone modules; Hub unchanged.

## Standalone Runtime v1.1.7 — plain S CSS selector fix
- Fixed escaped CSS selectors introduced in v1.1.6.
- Plain gold S styles now target the real launcher.
- Added all:unset to block inherited Torn/racing/status backgrounds.

## Standalone Runtime v1.1.8 — fixed first-slot S
- Standalone S is always inserted as the first status icon.
- Removed anchor heuristics entirely.
- Forced 24x24 flex centering with zero positional offset and no inherited Torn/racing artwork.
- Runtime-only .5 maintenance releases; Hub unchanged.

## Standalone Runtime v1.1.9 — optical S centering
- Moves the plain gold S down by 1px for optical alignment with Torn status icons.
- Keeps S permanently first in the status bar.
- Runtime-only .6 maintenance releases; Hub unchanged.
