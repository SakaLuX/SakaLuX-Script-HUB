# SakaLuX Script HUB

SakaLuX userscripts for Torn, including the Script Hub, standalone modules, their documentation and release validation tools.

## Canonical locations

| Purpose | Location |
| --- | --- |
| Installable userscripts | Root `SakaLuX-*.user.js` files |
| Hub module registry | `scripts.json` |
| Release catalog and documentation mapping | `release-config.json` |
| Greasy Fork documentation / per-script changelog | `greasyfork/*.md` |
| Repository-wide release history | `CHANGELOG.md` |
| Historical release notes | `releases/` |
| Release preflight tool | `tools/release_preflight.py` |
| Main validation workflow | `.github/workflows/validate-userscripts.yml` |
| Maintenance audit | `docs/REPOSITORY-CLEANUP-2026-10-22.md` |

## Release maintenance

Userscript `@version` metadata is the version reference for each distributable script. The release preflight checks each script listed in `release-config.json` against its Greasy Fork Markdown documentation and, when registered, `scripts.json`.

Run before publishing:

```sh
python3 tools/release_preflight.py --all
```

To generate release packages without committing them:

```sh
python3 tools/release_preflight.py --all --build
```

The GitHub Actions validation workflow runs additional repository, version and regression tests on pull requests. Passing static checks does **not** independently prove Greasy Fork publication or live TornPDA behavior.

## Backup and cleanup policy

- Keep original source files, shared runtime dependencies and verification tests.
- Keep GitHub release tags and historical release notes unless an explicit dependency review establishes a safe migration.
- Retain the most recent **verified working** backup for each component if backup snapshots are stored in the repository.
- Do not commit local `.bak`, `.orig`, temporary output, or generated `dist/` directories. Existing tracked files are not deleted merely by adding `.gitignore`.
- Confirm references from GitHub Actions and script download/update URLs before removing files.

## Known documentation gap

As of the 2026-10-22 maintenance audit, Gym Optimizer source and update metadata declare `v1.7.10`, while repository-wide Gym notes at the top of `CHANGELOG.md` reach `v1.7.1`. Its separate release-preflight integration and missing notes still require reconciliation from actual commits; they have not been fabricated.
