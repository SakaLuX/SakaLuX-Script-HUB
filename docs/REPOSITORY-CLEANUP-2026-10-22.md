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
