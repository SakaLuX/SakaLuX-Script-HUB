# Historical one-shot workflows

The 46 original migration and release workflows were archived on 2026-09-18 after completing their intended updates. Original contents are retained with `.disabled` extensions under `2026-09-18/`; GitHub Actions does not execute this directory.

Twelve original files contained invalid YAML, causing failed workflow notifications on every push before jobs could start. Other one-shot workflows were also retired to prevent old patch/release operations from being rerun against current scripts. Published releases and script versions remain unchanged.

The active `validate-userscripts.yml` now checks workflow YAML, all root userscript syntax, registry versions, Stocks panel mounting and Hub INFO/NEW behavior. It runs on main pushes, pull requests and manual dispatch, with read-only repository permissions. It does not commit, create releases or trigger additional pushes.

Invalid historical files:

- `fix-all-release-doc-semantics.yml`
- `fix-company-header-professional-v1837.yml`
- `fix-company-release-metadata-v1837.yml`
- `fix-footers-and-standalone-audit.yml`
- `fix-stocks-v084-docs.yml`
- `fix-suite-master-fullheight-v1969.yml`
- `run-company-release-metadata-v1837.yml`
- `stock-copy-bazaar-standalone-v0717.yml`
- `stocks-advisor-upgrade-0713.yml`
- `sync-all-release-surfaces.yml`
- `upgrade-stocks-portfolio-v082.yml`
- `validate-userscripts.yml`

Suite v0.9.927 and the 2026-09-18 performance release workflows were also archived after successful publication. The active workflow remains read-only validation and now includes all-script workload budgets and UI recovery checks.
