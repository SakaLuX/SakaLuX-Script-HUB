# SakaLuX automatic GitHub releases

## Scope

All 15 userscripts declared in `release-config.json`, including Script Hub, Suite, Gym Optimizer, Halloween Assistant and the Hub-managed standalone modules.

## Normal workflow

1. Edit a root-level `*.user.js` and push or merge the change into `main`.
2. GitHub Actions runs **SakaLuX Automatic Script Releases**.
3. Only changed scripts are selected. If their `@version` was not increased, the patch component is increased once; pre-increased versions are kept.
4. The corresponding app runtime markers, Gym `.meta.js` where applicable, Hub fallback registry and `scripts.json` are synchronized without bumping unrelated scripts.
5. Release notes are generated from the commit subjects affecting each script. For meaningful changelogs, write descriptive commit messages; automatic notes cannot infer unmentioned functional details from code changes.
6. The per-script GreasyFork Markdown changelog, root `CHANGELOG.md`, and `releases/<id>-v<version>-version-audit-<date>.md` are updated.
7. The action checks syntax, version consistency, strict release preflight, Shared Core, Account Auditor and Company Training Log regressions, and builds release packages with SHA-256 checksums.
8. If checks pass, the bot commits the synchronized files, then creates one immutable-version GitHub release per changed script, attaching the userscript, release manifest, release info and SHA-256 checksums.
9. The separate repository validation, version audit and release gate workflows run against the synchronized repository after a successful automatic release.

The `[skip-sync]` marker in a commit message intentionally prevents the release process. A push only touching documentation or CI configuration does not increment script versions.

## Manual publication

Under **Actions → SakaLuX Automatic Script Releases → Run workflow**, optionally enter a configured `script_id`. Manual dispatch can prepare a fresh release for the selected script.

## Publishing boundaries

GitHub Releases and repository documentation are automated. **GreasyFork's own hosted script publication is not automated** by this workflow: the repository cannot upload to GreasyFork without separate supported authentication/integration. A Markdown description synced in GitHub is not proof that the hosted GreasyFork version was updated.

Live TornPDA functionality and API behavior must still be verified on a device when a release changes behavior. Automated tests cannot prove live in-game correctness.

## Troubleshooting

- Check the **SakaLuX Automatic Script Releases** run first; it blocks publishing when checks fail.
- Review the failing job step and the files under `releases/`.
- Correct missing version markers or release documentation; do not hide failures by deleting runs.
- If a release tag exists, it is not silently overwritten.
- Workflow runs from before an automated metadata commit may report old mismatches; post-release checks validate the new commit.

## Tools

- `tools/auto_release_prepare.py`: detect changed scripts, prepare version bumps, notes and audit files.
- `tools/sync_release_metadata.py --only <script-id> --notes <json>`: sync targeted script runtime, documentation and Hub registry.
- `tools/release_preflight.py --all --build`: validate managed userscripts and build release packages.
