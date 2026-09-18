# SakaLuX performance update — 2026-09-18

Audits all 12 userscripts and optimizes 11 SakaLuX scripts for smoother TornPDA behavior.

- Stops self-triggered Recovery Planner icon updates and Hub badge rewrites.
- Reuses unchanged standalone dock entries and checks Hub state without scanning the entire document on every mutation.
- Filters unrelated chat updates from inventory, footer, Company and Suite maintenance.
- Coalesces pending refreshes so continuous mutations do not postpone work indefinitely.
- Scopes Market/Mission legacy footer repair to their actual panels.
- Preserves all 23 Suite modules, saved preferences, protection rules and trading safeguards.

Includes complete userscripts, individual version changelogs, previous-version backups, raw synthetic DOM/Chromium measurements and automated regression tests. Poker alert is included unchanged after audit.

Install the scripts you use and reload TornPDA. The bundle includes both Suite and its complementary standalone tools; those tools remain separate installations.

Synthetic measurements do not represent actual phone FPS or authenticated Torn/API performance.
