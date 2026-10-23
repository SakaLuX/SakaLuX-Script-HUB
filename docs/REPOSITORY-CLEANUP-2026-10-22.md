# Repository cleanup audit — 2026-10-22

## Changes in this maintenance branch

- Removed `testing/SakaLuX-Halloween-Assistant-v0.3.3-TEST.user.js`, an exact blob duplicate of `testing/SakaLuX-Halloween-Assistant-v0.2.6-TEST.user.js`. Both declared internal version `0.2.6`. Retained the correctly named test snapshot.
- Clarified that Gym Optimizer userscript and metadata currently declare v1.7.10 whereas the top Gym release entry in `CHANGELOG.md` is v1.7.1.

## Not deleted (pending dependency and inventory checks)

- Historic `releases/` documents and GitHub releases/tags, which might be referenced by distribution or changelog workflows.
- `.github/scripts/` migration scripts, which may still be referenced by workflows.
- `diagnostics/` Gym investigation scripts and additional `testing/` files: retaining until call sites and most recent validated snapshots have been mapped.
- Runtime backup/recovery logic in Shared Core and userscripts: not repository backup files and must not be removed.

## Verified repository structure

- `release-config.json` lists 13 release entries, including the Hub, Suite and Company Intelligence.
- `tools/release_preflight.py` checks release metadata, Greasy Fork docs, script registry, and Hub fallback synchronization.
- Gym Optimizer is absent from `release-config.json`, and no `greasyfork/Gym-Optimizer.md` exists; integration requires deciding whether it should be covered by that preflight.
- `README.md` and `.gitignore` were not found at repository root during this audit.

## Follow-up validation

1. Enumerate the full tracked file tree and compare snapshots by blob hash.
2. Check workflows and all reference paths before removing any other file.
3. Preserve the newest **valid** backup per component; filenames alone do not establish valid or latest versions.
4. Reconstruct missing Gym release notes from actual commits and validate `@version` / Greasy Fork docs / GitHub releases.
5. Run `python tools/release_preflight.py --all` and test suites in CI, verify installation/update URLs on TornPDA, before merging.

This document distinguishes verified fixes from work not yet done. No claim is made that the entire repository, GitHub Releases, or Greasy Fork are fully synchronized.

## Follow-up pass

- Confirmed `.github/workflows/validate-userscripts.yml` actively references release preflight, consistency checks and regression scripts. Do not prune `tests/` or `.github/scripts/` based on file age alone.
- Added repository root `README.md` mapping canonical sources, release metadata, documentation and preflight commands.
- Added `.gitignore` for future `.bak`, `.orig`, `dist/` and temporary/generated files. This does not remove files already tracked by Git.
- No further backups were deleted: a full tracked-tree inventory and positive working-snapshot verification remain incomplete.

## Diagnostic snapshot inventory (second pass)

Reviewed 15 `diagnostics/SakaLuX-Gym-*.user.js` files (Diagnostic, Execution-Probe, Lean-Test, Bootstrap-Test, Code-Test, Info-Only-Test, Info-ASCII-Test, Size-Test, Export-Only-Test, Parse-Test, History-Only-Test, CSS-Isolation-Test, v1.5.3-ASCII-Test, History-Isolation-Test, v1.5.5-Details-Test). All 15 returned **distinct Git blob SHAs**, so none is an exact file duplicate of another in this inspected set. These are historical isolation/probe variants and **not** confirmed as valid production backups. They were retained pending a complete workflow and dependency inventory.

GitHub code search for five individual diagnostic file basenames returned no indexed references. A no-result search is insufficient evidence that no dependencies exist, so no diagnostic file deletion was attempted.

## Historical GitHub Actions workflow audit

- `.github/workflows/update-chat-v123.yml` asserts Chat Intelligence `1.2.23`; automatic push triggers have been removed. Manual launch remains available, but may downgrade current scripts.
- `.github/workflows/update-bounty-hunter-v040.yml` asserts Bounty Hunter `0.4.0`; automatic push triggers have been removed. Manual launch remains available, but may downgrade current scripts.
- `validate-userscripts.yml`, `release-gate.yml`, and `sakalux-release-sync.yml` remain enabled because they perform current validation or release synchronization.
- Other version-specific workflows remain to be audited; this is not a complete workflow inventory.

## Additional historical workflow checks — 2026-10-23

- Inspected Suite rollback `suite-rollback-v0980.yml`: explicitly restores source from an old Git commit before relabeling it 0.9.980. Disabled its `push` trigger; manual execution remains potentially destructive.
- Inspected Chat update `update-chat-v136.yml`, Suite patch `suite-smart-daily-v0975.yml`, and Bounty Hunter update `update-bounty-hunter-v045.yml`: each invokes a version-specific patch and can commit code. Disabled their `push` triggers; manual execution remains available for reference but should not be used on current main.
- Verified `version-consistency-audit.yml` is a validation job and retained its automatic triggers.
- Confirmed retained release infrastructure: `release-gate.yml`, `validate-userscripts.yml` and `sakalux-release-sync.yml`.
- Many additional version-specific workflow files exist. They have NOT all been inspected or disabled, and no comprehensive safety assurance is implied.

## Bulk workflow-trigger remediation — 2026-10-23

GitHub indexed **93 workflow files exposing `workflow_dispatch`** during this pass. These were grouped as follows:

- **8 maintained workflows**: `release-gate.yml`, `version-consistency-audit.yml`, `sakalux-release-sync.yml`, `validate-userscripts.yml`, `pro-license-syntax-check.yml`, `test-shared-core-v1.yml`, `test-tornpda-navigation.yml`, and `test-market-travel-state-machine.yml`. Their automatic validation/synchronization triggers are intentionally retained.
- **85 historical/version-specific workflows**: no longer have their `push` event triggers in this maintenance branch; `workflow_dispatch` remains. **79 were changed in the bulk pass, and 6 had already been changed earlier in the PR.**
- Representative spot checks confirmed manual-only triggers in `update-chat-v134.yml`, `suite-smart-daily-checklist-v0968.yml`, `publish-license-manager-v2.yml`, and `update-bounty-hunter-v034.yml`. The current `sakalux-release-sync.yml` still has its main-branch push trigger.

**Safety caveat:** Manual execution of retired version-specific workflows may still modify scripts or roll them back. They remain in Git for historical inspection, and no execution was performed. Search indexing is not a Git tree listing; other workflow files without `workflow_dispatch` may exist and were not exhaustively enumerated. GitHub Actions validation and live installation checks remain pending.

## Full-tree and release CI follow-up — 2026-10-23

- Added `.github/scripts/audit_tracked_repository.py`, executed by `validate-userscripts.yml`. It uses `git ls-files` rather than GitHub code search, covering the complete **tracked tree at CI runtime**. Reports exact-content duplicate groups, tracked backup/temporary filenames, release-config source/Markdown version mismatches, missing distribution files and unexpected auto-writing workflows.
- Source and current Markdown version labels match in the **12 verifiable pairs** inspected via GitHub fetch. Suite's source metadata was not returned by the limited file read, so its v0.9.1001 label is **not independently confirmed**; the new CI audit checks it.
- Existing `tools/release_preflight.py` and `.github/scripts/verify_release_consistency.py` remain in the validation pipeline. Historic release notes cannot be reconstructed faithfully merely from filenames; no speculative release text or release tags were created.
- The complete tracked-file audit has **not yet executed**. CI run discovery and commit status returned no runs/statuses for the PR head. Do not interpret this as success or failure.
- No remaining test/backup file deletions are proposed without the exact-duplicate and reference report generated by CI.

## CI regression remediation — 2026-10-23

- Full-tree audit reported `errors: []` in the first available CI job log, so tracked tree verification successfully executed; identical-content groups and backup warnings should still be evaluated before further deletion.
- Existing validation failed on Gym Optimizer because registry pinned v1.7.1 although source and meta.js were v1.7.10. Updated registry and Hub offline fallback together.
- `validate_repository.py` now validates Gym as a GitHub-hosted standalone module instead of falsely requiring Greasy Fork metadata.
- `verify_version_consistency.py` now handles Gym with source, registry, embedded Hub, and meta.js checks without looking up an absent Greasy Fork doc.
- TornPDA regression now allows the repository to grow beyond 13 userscripts while still requiring substantial embedded-core coverage.
- Suite regression updated from the stale 24-module assumption to the observed 25 modules and asserts ID uniqueness.
- At the time of this note, latest PR CI success is not yet confirmed. The previous CI logs exposed these specific failures; rechecks must conclude before merging.
