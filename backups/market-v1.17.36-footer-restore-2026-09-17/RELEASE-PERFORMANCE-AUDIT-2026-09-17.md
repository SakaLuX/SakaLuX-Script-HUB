# SakaLuX release and performance audit — 2026-09-17

## Scope
Reviewed all 12 current repository userscripts: ten main SakaLuX scripts, Private module and the experimental Stock Manager. Historical backups were not treated as installable releases.

## Published versions
| Script | Version |
| --- | --- |
| SakaLuX-Account-Auditor.user.js | 1.3.13 |
| SakaLuX-Bazaar-Thanker-PDA.user.js | 5.3.39 |
| SakaLuX-Chat-Intelligence.user.js | 1.2.17 |
| SakaLuX-Company-Intelligence-v1.0.0.user.js | 1.8.31 |
| SakaLuX-Elimination-Assistant.user.js | 1.3.42 |
| SakaLuX-Enhancer-Guard.user.js | 1.3.46 |
| SakaLuX-Market-Intelligence.user.js | 1.17.35 |
| SakaLuX-Mission-Rewards.user.js | 1.0.35 |
| SakaLuX-Suite.user.js | 0.9.920 |
| SakaLuX-Script-Hub.user.js | 1.9.61 |
| private-module.user.js | 0.7.2 (unchanged) |
| experimental/SakaLuX-Stock-Manager-Advisor.user.js | 0.7.6 (unchanged) |

## Release consistency
- Userscript metadata, live runtime versions, standalone registration versions, six registry entries and their release versions were checked.
- Hub offline fallback versions and INFO/NEW metadata are synchronized with scripts.json.
- Hub's registered-module documentation and Company registration reference are current.
- Documentation release histories and changelogs are consolidated, deduplicated and sorted newest first. All original release bullets were retained.
- Missing historical Hub-isolation releases were restored from the known rollout history.

## Implemented performance corrections
- Nine native footer observers ignore unrelated Torn/other-module mutations and their own footer mutations. They still handle native panel insertion and re-rendering.
- Elimination SAFE/persistence lifecycle observers watch top-level body additions rather than every document subtree change.
- Elimination standalone dock rebuilds only when registered entry data changes.
- Mission reward observer ignores its own injected decorations and Mission/Hub settings changes.
- Company native position scraping is restricted to visible Company/Job pages and ignores Company/Hub panel mutations.
- Company standalone placement timer is initialized once, including after repeated OFF/ON operations.
- Company current-employment caches are deleted through the GM/local-storage adapter used for writes.

## Other scripts
- Suite module timers/observers were inspected for activation, route guards and cleanup. Its footer observer was optimized; gameplay modules and their required periodic checks remain unchanged.
- Hub already debounces its DOM observer and avoids full observer work while sheets are open. This release synchronizes offline release metadata.
- Stock Manager initial 650ms discovery polling is bounded to ten seconds; normal inline updates are debounced and stock scans are page scoped. No change required from this static review.
- Poker Exit Alert uses node-based mutation processing and a one-second heartbeat for real-time table state. Removing that heartbeat would alter monitoring behavior; it was preserved.

## Validation
- All 12 input scripts parse as JavaScript; all ten updated scripts parse after changes.
- Ten metadata/runtime/document version checks and six registry/release/offline fallback checks passed.
- Duplicate grants and duplicate release-history headings were checked.
- Every original documentation release bullet is still present.
- Mocked regressions passed: unrelated/self footer mutations are ignored, native insertion/re-render triggers repair, repeated unchanged dock renders rebuild once, and Company current-company caches clear through the persistent-storage adapter.
- Existing mobile panel geometry, chat clearance and 20px donation-button styling were retained.
- Performance conclusions come from source review and targeted mocked regressions. No live TornPDA device profiling, authenticated gameplay test or measured frame-time benchmark was performed.

## Distribution
Changes are published to GitHub. Existing Greasy Fork download/update URLs are preserved; this audit does not publish a Greasy Fork release.
