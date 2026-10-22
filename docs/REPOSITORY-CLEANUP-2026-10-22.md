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
