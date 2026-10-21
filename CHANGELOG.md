# Changelog

## Gym Optimizer v1.7.0 - 10 E native TRAIN and locally remembered gym progression (2026-10-21)

- Permit one explicit native TRAIN click when the player has enough energy for one repetition, even when Torn's own selector shows 999. Torn performs final validation; never synthesize 999 clicks. Preserve 0 E and insufficient-E safeguards.
- Match TornPDA TRAIN control using innerText, textContent and value to address WebView button detection.
- Keep a separate local gym progression ledger: highest native-confirmed active gym, explicitly observed unlocked gym controls and earlier sequential standard gym stages for recommendations. Prior stages count as reached but do not imply paid ownership.
- Select the best dot-value gym for recommended stat from recorded progression; switch automatically only if the current Torn UI explicitly exposes an unlocked clickable control. No guessing at locked icons.
- Mock-verified 10 E / 999 selection, 0 E, 5 E, progression and explicit unlock persistence. JavaScript syntax and ASCII checks passed; on-device training result still unconfirmed.

## Gym Optimizer v1.6.9 - persisted active gym confirmation (2026-10-21)

- Save the gym name only after Torn has positively confirmed it, and reuse the cached selection when Torn temporarily removes the gym banner while updating controls. This fixes a gold button repeatedly displaying CHECK ACTIVE GYM BANNER while Overview still shows the selected gym.
- Do not treat a cached gym as an unlocked-gym list. A requested change of gym invalidates the fallback until Torn confirms the new selection.
- Throttle local writes and retain the energy-aware native repetition and TRAIN checks.
- Mock tests passed for disappearing banner and switching gym; full script parses and remains ASCII-only. TornPDA live check pending.

## Gym Optimizer v1.6.8 - stable gym confirmation and affordable trains (2026-10-21)

- Cache an explicitly confirmed native Gym banner for up to 15 seconds while Torn redraws Gym controls; invalidate it on a gym switch. This prevents the gold button from falling back to WAIT FOR GYM CONFIRMATION while the overview still displays the active gym.
- Calculate native training repetitions using remaining energy and the displayed energy per train. Example: with 10 E in Complete Cardio, only 1 repetition is affordable, so do not assume 999 repetitions can be performed.
- Ask the user to set the native selector manually if Torn exposes only arrow controls. Update the gold button after native changes.
- Before executing an explicitly requested TRAIN, recheck gym, repetitions, remaining energy and training cost; never blindly train when values are unavailable.
- Mock validation for 0/10/20/150 E, Javascript parse and ASCII checks passed; on-device validation remains pending.

## Gym Optimizer v1.6.7 - energy status and actual specialist gym requirements (2026-10-21)

- Show NO ENERGY - WAIT FOR REGENERATION when live Torn HUD or verified API says 0 E; distinguish from gym selection errors. For nonzero insufficient E, show required energy per train where identified.
- Rebuild Headroom using Torn wiki specialist gym rules, independent of saved SakaLuX ratios. Select Elites, Total Rebound, Gym 3000, Mr. Isoyamas, Balboas, Frontline Fitness or Sports Science Lab; see current stat requirements, precise gap, prerequisites and purchase cost.
- Explain specific preceding standard gyms: George's, Cha Cha's or Last Round. Do not claim eligibility if prereq/fees/consumables are unverified.
- Persist specialist gym selection; prioritize live Torn energy bar over cached API.
- Calculations verified using sample user's public stat values; Javascript parse and ASCII checks passed. TornPDA device test pending.

## Gym Optimizer v1.6.6 - reliable gym confirmation and four-stat headroom (2026-10-21)

- Prefer the active gym name from Torn's own energy banner to transient icon selection when they disagree. Fallback to explicit selected icon only if banner not available.
- Restore four-stat headroom display using current configured ratio and actual battle stats, showing current/target plus need per Strength, Speed, Defense and Dexterity. Dump stat clearly marked.
- Clarify that special gym unlocks need the specific ratio and additional gym prerequisites, which can include previous gym access, energy spent or membership; targets are planning guidance only.
- JavaScript/ASCII verified and simulated conflicting banner versus selected-icon readings; on-device verification pending.

## Gym Optimizer v1.6.5 - Torn stepper repetitions and headroom clarity (2026-10-21)

- Detect the native TornPDA repetition spinner [-] 999 [+] even without a text input and use that value to advance the gold button sequence.
- Keep the single gold button synchronized with Torn control changes without losing UI state; native TRAIN remains an explicit, separately tapped action.
- Where the native selector is not safely editable programmatically, direct user to select 999 in Torn instead of assuming it was set.
- Replace nonfunctional four-line 'limit not verified' placeholders with labeled DEX-ratio planning headroom and a warning that specialist gym eligibility is not confirmed.
- Preserve ASCII syntax and GitHub automatic update metadata. TornPDA on-device control matching still needs confirmation.

## Gym Optimizer v1.6.4 - TornPDA active gym banner detection (2026-10-21)

- Also detect the active gym through the visible native banner name plus 'You have X/Y energy', including Complete Cardio, when class-based Gym title detection fails.
- Retain v1.6.3's persistent panel across React gym switches and safety checks on selected gym icons.
- Do not guess which gym an unlabeled 3% lock tile refers to. Device verification pending.

## Gym Optimizer v1.6.3 - persistent Gym panel and safer gym selection (2026-10-21)

- Keep Gym interface visible during Torn React re-mount and gym selection changes; fallback to a stable Gym heading if the native training tile anchor is temporarily absent.
- Require an unambiguous selected gym; avoid trusting an outdated banner if selection icon conflicts.
- Clear pending gym switch only after selected gym confirmation. Update Overview after the active gym changes.
- Associate locked gym progress only with a clearly labeled next gym tile; icon-only 3 percent is not enough to infer its identity or energy remaining.
- Keep update metadata and ASCII compatibility. Device verification pending.

## Gym Optimizer v1.6.2 - automatic updates and gym energy progression (2026-10-21)

- Overview displays total battle stats and the latest verified auto-saved delta as +X SINCE LAST TRAIN, not since snapshot. Without two real samples it says AWAITING NEXT TRAIN.
- Overview rerenders after automatic stat changes are saved, as already done for History.
- Next gym progress is expressed in gym energy. Only show exact energy remaining when a relevant API field exists; otherwise, with verified current gym and progress percentage, use the Wiki approximate gym energy threshold to show explicitly approximate energy remaining. Without progress show the stage total only; never invent clock-based ETA.
- Add Github raw @downloadURL and @updateURL metadata, plus SakaLuX-Gym-Optimizer.meta.js to support manager update checks. TornPDA remote URL may require initial configuration.
- Verified JavaScript parsing and tested 3%, direct API remaining, missing progress and unknown gym outcomes in a controlled mock. Device confirmation pending.

## Gym Optimizer v1.6.1 - automatic training history and compact gains (2026-10-21)

- Automatically capture stat snapshots on Gym when all four native stats are present and stable across two polls. First complete reading establishes a baseline; subsequent increases are saved.
- Skip duplicates, partial readings and suspicious stat decreases. Retain up to 180 snapshots locally, displaying the newest 15.
- Show per-stat increases and TBS gains in green below colored compact values; remove manual SAVE SNAPSHOT button. Retain CLEAR HISTORY and CSV export.
- Pure logic tests confirmed baseline, increases, no duplicates, incomplete values and decrease rejection. Real TornPDA validation pending.

## Gym Optimizer v1.6.0 - sequential gold Train Next action (2026-10-21)

- Replace SET 999, SWITCH GYM and TRAIN buttons in Overview with one styled gold action, conditional on Torn gym state.
- The user must tap separately for each stage. SET 999 checks the native input; SWITCH GYM requires affirmative unlock evidence; TRAIN rechecks the native 999 field and clicks Torn TRAIN only once.
- Best verified gym only appears when the current selected gym can be identified or a gym control has explicit unlocked evidence; otherwise shows not verified.
- Existing Gym perk/category checks are unchanged. Company NOT RETURNED means API did not provide a company_perks array, not necessarily that the user has no company bonus.
- JavaScript syntax and ASCII check passed; TornPDA functional testing of actions is still required. Do not use live training until tested.

## Gym Optimizer v1.5.9 - full perk-source audit and single-row controls (2026-10-21)

- Check all nine supported Torn user perk categories: faction, education, property, company, job, book, merit, stock and enhancer (API v1 flat arrays and v2 nested arrays).
- Show returned categories out of nine, active perk counts by source and gym-related entries, including active books and faction perks. Distinguish 0 active from missing API information.
- Center all stat names, including Defense, within the same middle column; preserve red dump marker.
- Fit each Active Ratio, Highest Stat and Dump Stat selection in a single row and abbreviate the stat buttons STR, SPD, DEF, DEX.
- Tested parser with mocked API v1/v2 payloads and verified JavaScript syntax; real account/on-device confirmation pending.

## Gym Optimizer v1.5.8 - Torn gym perk parser and compact Settings (2026-10-21)

- Remove Aec3 from ratio selection; legacy saved choice migrates to SakaLuX.
- Align Defense with the other ratio multiplier labels and preserve its purple color; dump (x0) remains red.
- Position smaller CREATE KEY beside SET API KEY in Settings.
- Fix gym gain multiplier reading from Torn API v1 root-level faction_perks, education_perks, property_perks etc. Also handle v2 categorized perks. Request perks separately for reliable parsing and display response status.
- Combine verified independent training bonus percentages multiplicatively, not additively. Do not invent unknown bonus percentages.
- Tests with sample Torn API v1 and v2 perk payloads passed; device test remains pending.

## Gym Optimizer v1.5.7 / Hub v1.9.149 - compact UI and key permissions (2026-10-21)

- Gym: reduce spacing in ratio choices, stat order, multiplier inputs and API controls for TornPDA.
- Gym: add CREATE GYM API KEY before CLEAR KEY. Opens Torn custom key creation with user perks, bars, gym and battlestats preselected; Torn still requires user confirmation and the key must be pasted/saved.
- Hub: centralize the existing combined master API scope list covering the examined SakaLuX add-ons, excluding Auditor-only private selections (e.g. logs, messages, attack history and private forum data). Master key URL requests necessary scopes but cannot modify an existing key. Re-create/save the key to change its permissions.
- No API secrets are generated, sent, or copied by SakaLuX.
- Static JavaScript parsing verified; TornPDA on-device validation pending.

## Gym Optimizer v1.5.6 - Settings stat colors and API gym bonuses (2026-10-21)

- Color the dump (x0) multiplier red and keep Defense in the same four-stat display order and label layout.
- Show per-stat API-derived gym gain modifiers with individual stat colors. Display unverified or partial status instead of invented figures.
- Refresh Torn gym data on the first Settings opening when an API key is available. Manual REFRESH NOW remains available.
- Preserve ASCII-only script text for TornPDA compatibility. Device validation pending.

## Gym Optimizer v1.5.5 - expanded Settings and Details (2026-10-21)

- Rebuild Settings with mobile ratio choice, highest/dump stat, color-coded order, editable custom multipliers and Dark/Light controls.
- Show available gym perks, latest API update time and guarded API key controls.
- Restore expanded, color-coded Info cards for gym dots, Baldr/Hank builds and four stat explanations.
- Keep script source ASCII-safe to prevent the TornPDA loading regression. Device validation of this new build pending.

## Gym Optimizer v1.5.4 — TornPDA startup compatibility (2026-10-21)

- Fixes a script-loading regression introduced in Gym Optimizer v1.2.0, traced with isolated TornPDA tests to special Unicode typography in the Info section.
- Replaces problematic non-ASCII UI strings with ASCII-safe equivalents throughout Gym Optimizer; preserves existing training, API, Gym, and History functions.
- Verified on TornPDA with Gym v1.5.3 ASCII Test before official publication.

## Gym Optimizer v1.5.3 / Hub v1.9.148 — early startup diagnostics (2026-10-21)

- Bootstrap installs a DOM marker before Shared Core or Gym UI to diagnose startup errors, rather than relying on the Gym page being rendered.
- Separates loaded, ready and error states; guarded initial render preserves the installed marker.
- Hub reads the marker even if Gym initialization fails. Device validation still needed.


## Gym Optimizer v1.5.2 / Hub v1.9.147 — TornPDA installed-state regression fix (2026-10-21)

- Reverted Gym Optimizer to page-context `@grant none`, matching versions that were recognized before v1.4.0.
- Install version bridge is published before duplicate-script detection and visible via document DOM.
- Hub explicitly checks the bridge independently of any inline Gym panel.
- All existing saved strategies and personal API keys are retained.


## Gym Optimizer v1.5.1 / Hub v1.9.146 — Install detection and API persistence (2026-10-21)

- Register Gym Optimizer version in explicit document and global installation markers even outside Gym.
- Hub prioritizes the Gym runtime global when evaluating installed version.
- Gym API access uses Hub shared key when exposed and locally persisted personal key fallback.
- Settings adds save/clear controls for personal 16-character Torn API key; key never appears in UI logs.


## Gym Optimizer v1.5.0 — Gain model, headroom and conditional ETA (2026-10-21)

- Computes approximate training gains using the wiki formula and parseable, per-stat gym perk percentages.
- Computes DEX 1.25 specialist ratio headroom for secondary stats (advisory, not ownership status).
- Next-gym remaining energy and ETA use explicit API fields if available; never substitutes a fabricated estimate when progress or regeneration is unavailable.
- Precise perk stacking and unlock ETA remain dependent on verified v2 API fields and player-specific readings; gym switching remains guarded.


## Gym Optimizer v1.4.0 — API perks and safer gym calculations (2026-10-21)

- Added Torn user API refresh for perks, bars, gym and battle stats using the Hub API key; reports missing authorization or errors.
- Displays available gym-relevant perks by source, energy, timestamp and DEX ratio safety.
- Repetition limit derives from energy only when the native tile explicitly supplies an energy cost; otherwise preserves manual input and warnings.
- Accurate combined gym-gain multipliers, special gym limits and real remaining gym EXP require validated server response schemas and are NOT yet delivered.


## Gym Optimizer v1.3.1 / Script Hub v1.9.145 — Installation detection fix (2026-10-21)

- Restored Gym Optimizer installable status and GitHub raw download URLs in both scripts.json and Hub offline registry.
- Replaced stale floating button selector with the real inline Gym panel selector.
- Preserved Gym config and runtime while advancing the metadata version.


## Gym Optimizer v1.3.0 — Verified gym routing and Train action (2026-10-21)

- Added gym-dot table for standard gyms, per-stat best available gym among explicitly confirmed unlocked gyms.
- Switch button appears only for positively verified unlocked gyms; a label alone is not proof.
- TRAIN button requests one native training action on explicit user press, checking the preferred verified gym first.
- Added wiki-based approximate energy per standard unlock step; cannot claim accurate remaining energy or ETA without gym EXP data.
- Actual TornPDA selectors must be regression-tested on device before relying on actions.


## Gym Optimizer v1.2.1 — Train Next interaction and mobile scroll (2026-10-21)

- Train Next can set 999 repetitions in the matching native stat tile; Torn TRAIN remains a manual action.
- Gym switch requires explicit unlock proof and therefore refuses unverified gyms instead of trying Deep Burn.
- Reduced padding and removed overflow constraints that prevented TornPDA scrolling.
- Exact automatic best-gym switching requires verified unlocked gym state; not claimed as delivered.


## Gym Optimizer v1.2.0 — StatForge-style secondary tabs (2026-10-21)

- History: 15 snapshots in colored Strength, Speed, Defense, Dexterity, TBS table with deltas and clear history.
- Export: formatted text report with clipboard copy, plus CSV history.
- Info: ratio explanations, gym dots, and four-stat guide.
- Existing Overview and DEX-first strategy preserved; gym unlock verification remains pending.


## Gym Optimizer v1.1.0 — StatForge-reference full layout (2026-10-21)

- Rebuilt mobile interface with Overview, History, Export, Settings and Info tabs matching the reference information hierarchy.
- Added Ratio Health summary, Total Battle Stats, Train Next, Headroom, four color-coded stat rows, local history and CSV export.
- Preserved SakaLuX DEX-focused training preset, native Gym insertion and locked-gym safeguards.
- Exact StatForge formula parity and true special gym headroom remain unsupported; values are marked as unverified instead of being invented.


## Gym Optimizer v1.0.6 — SakaLuX DEX focus and compact UI (2026-10-21)

- Renamed Aec3 template to SakaLuX, with default DEX-priority weights (DEX 1.25, Speed 1, Strength 0.8, Defense dump).
- Migrates prior Aec3 selections to SakaLuX automatically, preserving other strategies.
- Tightened widget spacing, headings and colored stat bars toward StatForge reference.
- Suppressed misleading initial Train Next results without sufficient stat values.
- Strategy weights remain custom training targets, not a mathematically verified reproduction of Aec3.


## Gym Optimizer v1.0.5 — Stat bars and native stat reading (2026-10-20)

- Added compact four-stat colored progress bars and target/gap indicators like the StatForge layout.
- Reads displayed values from native Gym training tiles when recognized, with manual values as fallback.
- Preserves safe training-grid anchor; does not guess gym unlocks or cap values.
- Baldr, Hank and Aec3 still use editable starter templates rather than proven StatForge algorithms.


## Gym Optimizer v1.0.4 — Native training anchor fix (2026-10-20)

- Mounts directly before the native four-stat training tiles, not within an arbitrary Gym root container.
- Forces normal-flow/static positioning to prevent covering HUD, stat bars and train buttons on TornPDA.
- Fails closed (hides the script panel) when its training anchor is not identifiable.
- Still a simplified planner; full StatForge formula/visual parity remains pending.


## Gym Optimizer v1.0.3 — Dark Gym interface and safer mount (2026-10-20)

- Restyled sections toward StatForge's dark native Gym appearance.
- Disabled generic main-container insertion to avoid overlapping Torn's navigation and native controls.
- Retained collapsed settings and nonautomatic training.
- Further exact StatForge feature and stats parity remains pending.


## Gym Optimizer v1.0.2 — Compact Gym layout fix (2026-10-20)

- Replaced oversized expanded form with compact inline Train Next and Gym summary.
- Moved stat inputs, strategy editing, snapshots into collapsible Settings.
- Reduced height, width and spacing so native Torn gym training stays visible and accessible.
- No unverified gym switch automation. Actual TornPDA device regression testing remains required.


## Gym Optimizer v1.0.1 — Inline Gym integration (2026-10-20)

- Embedded the optimizer within the native Gym content column above gym training controls.
- Removed the separate floating launcher and fixed-position popup; live remount supports TornPDA route navigation.
- Retained manual stats, strategy templates and no-switch safety for unverified gyms.
- Needs real-device TornPDA layout testing; gym data autofill remains pending.


## Gym Optimizer v1.0.0 — Initial MVP (2026-10-20)

- New TornPDA/Tampermonkey userscript with Balanced, 2-stat, 3-stat, Baldr, Hank, Aec3 and Custom editable templates.
- Manual stat values, relative catch-up recommendation and local snapshots.
- Strict no-switch behavior for any unverified gym (including locked Deep Burn).
- Hub registry entry, standalone source and release notes.
- Limitations: preset weights are starting templates, not verified StatForge formula parity; no auto-training or verified gym unlock tracking yet.

## Enhancer Guard v1.3.73 — Faction Deposit visibility fix (2026-10-18)

- Excluded all Faction Armory/Deposit views from protected-sale row filtering.
- Prevented protected item locks from hiding native faction deposit panels and controls.
- Retained protection on actual Bazaar, Trade, Display Case and Add Listing sale screens.

## Script Hub v1.9.133 — Background PRO license recovery (2026-10-14)

- Retries shared license verification after initial transport/server failures without opening Hub.
- Uses escalating 30-second to five-minute delays; honors rate limits with a longer minimum cooldown.
- Cancels pending retries after a successful response and retries after returning to the foreground when appropriate.

## Market Intelligence v1.17.87 — strict page isolation (2026-10-13)

- Fixed travel panels appearing on Bazaar, Bargain Vault and profile views because travel text in the global page was detected before the actual route.
- Explicit Bazaar/profile/items/market routes now override all travel detection.
- Best Route Basket rejects late asynchronous updates outside the Travel Agency and mounts only on travel surfaces.

## Market Intelligence v1.17.86 — autonomous Travel panel startup (2026-10-11)

- Starts missing Travel Agency and landed-country panels independently of opening Script Hub.
- Records a local diagnostic separating page detection from PRO verification failure.
- Respects existing license request deduplication and backoff.

## Market Intelligence v1.17.85 — standalone licensing permission (2026-10-11)

- Declares sakalux.ro as an allowed cross-origin license endpoint in userscript metadata.
- Enables Market Intelligence to verify PRO directly without waiting for Hub to open.

## Script Hub v1.9.132 — automatic license boot (2026-10-11)

- Starts a shared PRO entitlement verification explicitly during Hub initialization without opening the panel.
- Retains the in-flight broker deduplication and last verified grant behavior.

## Market Intelligence v1.17.84 — automatic PRO panel recovery (2026-10-11)

- Reopens Best Buys and Best Route Basket as soon as the shared Hub license state becomes verified.
- Works on landed-country and Torn Travel Agency pages without opening the Hub UI.
- Recovery polling reads only local entitlement state and adds no network license requests.

## Market Intelligence v1.17.83 — PRO bootstrap and rate limit handling (2026-10-11)

- Restores a recent positively verified PRO entitlement before Travel and Bazaar Flip initialization.
- Avoids immediately duplicating the Hub license request when a valid grant is cached.
- Treats unavailable and rate-limited checks as inconclusive instead of denying PRO.

## Script Hub v1.9.131 — early shared license verification (2026-10-11)

- Triggers shared PRO license verification on script startup rather than waiting for Hub UI to be opened.
- Retains the existing bounded verified entitlement cache and deduplicated request broker.
- Market Intelligence v1.17.82 already includes short-term validated PRO restoration and rate-limit backoff for Best Route Basket and Bazaar Flip.

## Market Intelligence v1.17.82 — PRO verification and rate-limit resilience (2026-10-11)

- Reuses the Hub's verified premium grant on Market Intelligence startup, including Bazaar Flip and Best Route Basket.
- Coalesces simultaneous requests and backs off on `rate_limited` errors for 90 seconds.
- Keeps only recent, unexpired entitlement while a new check is unavailable; explicit denial invalidates cache.

## Market Intelligence v1.17.80 — Travel Agency basket startup (2026-10-11)

- Prevents Best Route Basket initialization retries from expiring while the Travel Agency is open.
- Retries after entitlement verification and after busy scans, independently of opening Script Hub.
- Stops startup polling when the module is disabled.

## Market Intelligence v1.17.79 — Travel Agency basket startup (2026-10-11)

- Retries premium validation while Travel Agency initializes, then renders Best Route Basket automatically.
- Responds to PRO status events without needing to open Script Hub.
- Cancels bootstrap timers and listener when the module is stopped.

## Market Intelligence v1.17.78 — TornPDA landed Best Buys startup (2026-10-11)

- Best Buys initializes automatically upon loading a foreign-country shop, without opening Script Hub.
- A bounded bootstrap retry handles shop content rendered after DOMContentLoaded.
- Existing cached-first pricing and background refresh are retained.

## Market Intelligence v1.17.77 — fast landed-country Best Buys (2026-10-11)

- Renders the Mexico and other landed-country Best Buys panel from cached quotes before asynchronous price refresh completes.
- Avoids waiting for a separate remote cash request before drawing cached recommendations.
- Uses no invented price data; fresher market quotes update the displayed plan after retrieval.

## Market Intelligence v1.17.76 — two Best Route rankings (2026-10-11)

- Displays three optimized route baskets respecting the saved Travel Budget.
- Displays three greedy route baskets without a spending limit.
- Both groups rank by estimated profit per hour and are recomputed after online price refresh, with cached recommendations labeled when displayed.

## Market Intelligence v1.17.75 — budget-capped fast travel baskets (2026-10-11)

- Fixed a null budget override erroneously disabling the configured budget limit.
- Excludes baskets costing more than the configured Travel Budget.
- Paints cached travel recommendations before online YATA/market refreshes, with a visible cache label.

## PRO license persistence and ON/OFF preference — 2026-10-11

- Enhancer Guard v1.3.72 and Bazaar Thanker v5.3.71: retain last positively verified entitlement for up to 10 minutes, bounded by the server license expiry and tied to the configured API key.
- Treat an unavailable/pending license check as temporary rather than overwriting user-selected ON/OFF preferences.
- Restore active premium runtime when a valid entitlement is confirmed while keeping any user-disabled modules OFF.
- Hub reports the preferred power state independently of active premium authorization.

## Stock Manager v0.8.34 — TornPDA installed version detection (2026-10-10)

- Fixed the canonical installed version fallback which still advertised v0.8.30 without GM_info.
- Bumped Stock Manager to v0.8.34 and aligned the Hub offline registry and scripts.json.

## Script Hub v1.9.129 — GreasyFork parser fix (2026-10-10)

- Fixes GreasyFork synchronization failure: `Uncaught SyntaxError: Private field '#sakalux' must be declared in an enclosing class` caused by raw CSS injected into JavaScript.
- Wraps UPDATE control badge styles in a valid JavaScript style element.
- Confirms parsing of the full Hub userscript with the JavaScript parser.
- Does not change license rules, paid capabilities or trading behavior.

## Version registry and release audit — 2026-10-10

- Script Hub **1.9.128**: synchronized internal version and offline registry; UPDATE remains a FREE maintenance action. Removed badge decorations inside the UPDATE control where identified.
- Bounty Hunter: fixed stale runtime version **0.5.3** to **0.5.19** (metadata-only; not a behavioral change).
- Stock Manager & Advisor: aligned remaining runtime/registry/documentation versions to **0.8.33**. Versions 0.8.31–0.8.33 address TornPDA Withdraw click reporting and the inline control `forEach` TypeError.
- Updated the GreasyFork Markdown documentation current-version labels where stale. Added an audit release note for each managed add-on and the Hub. These repository notes do not automatically create GitHub Releases or publish to GreasyFork.
- Public GreasyFork sync and installed TornPDA versions must be verified independently.

- Enhancer Guard: **1.3.71** (source, internal runtime, registry, Hub offline registry, release metadata and documentation checked)
- Bazaar Thanker: **5.3.70** (source, internal runtime, registry, Hub offline registry, release metadata and documentation checked)
- Bazaar Smart Pricer: **1.1.28** (source, internal runtime, registry, Hub offline registry, release metadata and documentation checked)
- Mission Rewards: **1.0.61** (source, internal runtime, registry, Hub offline registry, release metadata and documentation checked)
- Market Intelligence: **1.17.74** (source, internal runtime, registry, Hub offline registry, release metadata and documentation checked)
- Bounty Hunter: **0.5.19** (source, internal runtime, registry, Hub offline registry, release metadata and documentation checked)
- Elimination Assistant: **1.3.64** (source, internal runtime, registry, Hub offline registry, release metadata and documentation checked)
- Company Intelligence: **1.8.73** (source, internal runtime, registry, Hub offline registry, release metadata and documentation checked)
- Stock Manager & Advisor: **0.8.33** (source, internal runtime, registry, Hub offline registry, release metadata and documentation checked)

## Premium Xanax offer text — 2026-10-10

- Updated all 9 userscripts' shared PRO dialogs to display **Send 1 Xanax for 7 days PRO** and a direct link to the recipient's Torn profile.
- Updated the Script Hub Premium popup offer text for both active and inactive PRO states (Hub v1.9.127).
- License validity checks, grants, and free/premium gates are unchanged.
- Synchronized per-script release notes, scripts.json and GreasyFork documentation.

- Enhancer Guard v1.3.71
- Bazaar Thanker v5.3.70
- Bazaar Smart Pricer v1.1.28
- Mission Rewards v1.0.61
- Market Intelligence v1.17.74
- Bounty Hunter v0.5.19
- Elimination Assistant v1.3.64
- Company Intelligence v1.8.73
- Stock Manager & Advisor v0.8.30

## Premium badge coverage v2 — 2026-10-10

Expanded ✦ PRO indicators to premium buttons, setting labels, toggles, and select-menu options across all nine paid/mixed modules. Only premium-matched entries are tagged; FREE entries remain unmarked. Existing access checks and saved ON/OFF preferences are unchanged.

- enhancer: v1.3.69
- bazaar: v5.3.68
- bazaar-smart-pricer: v1.1.26
- mission-rewards: v1.0.59
- market-intelligence: v1.17.72
- bounty-hunter: v0.5.17
- elimination-assistant: v1.3.62
- company-intelligence: v1.8.71
- stock-manager-advisor: v0.8.28

JavaScript parser validation completed for changed source files. UI completeness and Greasy Fork publishing require runtime confirmation.


## Explicit PRO option badges — 2026-10-10

- Mission Rewards v1.0.58: Weapon Mod Price Learning displays ✦ PRO.
- Bounty Hunter v0.5.16: Smart/FF/BS sorting, Full Board, Beatable Only and Live Status display ✦ PRO.
- Stock Manager & Advisor v0.8.27: Advisor, Rebalance and PANIC settings display ✦ PRO.
- Company Intelligence v1.8.70: Director mode displays ✦ PRO.
- Nine premium-bearing modules retain their previously installed generic badge behavior; the four updates above add explicit labels where the generic matcher was insufficient.
- UI rendering on TornPDA and Greasy Fork publication not yet confirmed.


## Script Hub v1.9.125 — Signed certificate diagnostics (2026-10-10)

- Added certificate-received, signature-verified and signed-expiry diagnostics under Hub Settings.
- Added a manual fresh verification action without exposing the Torn key or raw certificate.
- Signature enforcement remains staged until a successful TornPDA test of a signed PRO response.

## License Manager v2 distribution — 2026-10-10

- Hub v1.9.124: shared in-flight license verification broker, safe account switching, strict verification response validation, and faster FREE-status rechecks.
- Bazaar Smart Pricer v1.1.25, Bazaar Thanker v5.3.67, Enhancer Guard v1.3.68, Mission Rewards v1.0.57, Market Intelligence v1.17.71, Elimination Assistant v1.3.61, Bounty Hunter v0.5.15, Stock Manager & Advisor v0.8.26: shared broker integration and clearer pending/unavailable license treatment.
- Added license checking regression workflow and documented testing cases.
- Remaining: browser-side access controls are bypassable by modified user scripts; server-side authorization is required for sensitive operations. Signing server groundwork is managed separately in SakaLuX-Website and client signature verification is not yet deployed.

## PRO preference suspension and automatic restoration — 2026-10-10

The premium license now controls the effective state of premium-only functions. User-selected ON/OFF preferences remain stored separately from the effective license state. On verified PRO loss, gated actions stop or display OFF without erasing the selected option; on successful revalidation, modules restore their previous choices.

- Script Hub publishes the current entitlement status to all installed modules and refreshes the license on a five-minute cycle when Torn is visible.
- Bazaar Thanker and Enhancer Guard suspend and resume their premium runtime while preserving the saved module-enabled preference.
- Company Intelligence preserves the user's preferred Director mode and temporarily uses Employee mode while PRO is unavailable.
- Market Intelligence preserves the saved Best Run, Arrival Basket and Museum choices; premium calculation/display paths check effective entitlement.
- Mission Rewards and Stock Manager & Advisor show selected advanced switches as OFF during license inactivity without resetting underlying preferences.
- Bounty Hunter uses FREE-safe sorting/scanning while preserving premium sort, full-board and enrichment preferences.
- Bazaar Smart Pricer and Elimination Assistant continue enforcing premium execution checks and now respond to license-status changes without altering FREE settings.

| Script | Version |
|---|---|
| Script Hub | 1.9.123 |
| Enhancer Guard | 1.3.67 |
| Bazaar Thanker | 5.3.66 |
| Bazaar Smart Pricer | 1.1.24 |
| Mission Rewards | 1.0.56 |
| Market Intelligence | 1.17.70 |
| Bounty Hunter | 0.5.14 |
| Elimination Assistant | 1.3.60 |
| Company Intelligence | 1.8.69 |
| Stock Manager & Advisor | 0.8.25 |

JavaScript parsing was checked on the updated userscripts; real TornPDA integration, server revocation latency and Greasy Fork propagation must also be confirmed.


## Market Intelligence v1.17.69 — 2026-10-10

- Added ✦ PRO badges to premium travel and museum switches, including the previously unmarked Arrival Basket Planner.
- Moved the Bazaar Flip Intelligence widget away from the top of Bazaar and limited full premium deal rankings to licensed users.
- FREE players see a compact Bazaar Flip PRO teaser; tapping it opens the SakaLuX PRO dialog.


## Market Intelligence v1.17.68 — PRO toggle enforcement — 2026-10-10

- Prevents FREE users from switching on Best Travel Run, Arrival Basket Planner and Museum intelligence.
- Revalidates PRO before applying the ON state and displays the existing SakaLuX popup when access is denied.
- Preserves the FREE settings and existing execution-level PRO checks.


## Premium badges distribution — 2026-10-10

Premium actions in nine scripts now have ✦ PRO visual labels. Script Hub uses ✦ PRO and FREE / ✦ PRO module badges. Existing license checks and PRO dialogs remain unchanged; FREE actions are not deliberately hidden.

| Script | Version |
|---|---|
| Script Hub | 1.9.122 |
| Bazaar Thanker | 5.3.65 |
| Enhancer Guard | 1.3.66 |
| Company Intelligence | 1.8.68 |
| Bazaar Smart Pricer | 1.1.23 |
| Mission Rewards | 1.0.55 |
| Market Intelligence | 1.17.67 |
| Bounty Hunter | 0.5.13 |
| Elimination Assistant | 1.3.59 |
| Stock Manager & Advisor | 0.8.24 |

Release documents: `greasyfork/*.md`, `releases/*-v*.md`. Module release notes and versions: `scripts.json` and Script Hub offline fallback. All ten edited JavaScript sources passed a parser syntax check. Deployment via Greasy Fork and browser behavior remain to be confirmed separately.


## FREE/PRO execution-path hardening and security audit — 2026-10-10

- Bazaar Smart Pricer v1.1.22: verified premium entry points for Quick Fill and Update All; added cached entitlement state helper.
- Mission Rewards v1.0.54: guarded weapon-mod history observation and premium badge rendering, beyond button interception.
- Market Intelligence v1.17.66: guarded Route Basket and Travel Planner/Best Travel Run calculations; existing Museum scan gate retained.
- Elimination Assistant v1.3.58: guarded advanced Smart Score and tactical signal output; existing FF loading, calibration and WIN/LOSS recording checks retained.
- These are **client-side** defenses and can be modified by anyone controlling the userscript/runtime; they are NOT tamper-proof licensing.
- Server audit: premium-check endpoint verifies Torn identity and license in DB; manual PRO grant enforces owner + CSRF + validated days + prepared statements; PRO Bazaar ranking verifies active subscription.
- Open findings: premium analytics still execute locally, so determined users may bypass the paywall; Bazaar ranking totals originate from untrusted client-provided data; independent PRO verification requests can hit the 20/15min/IP rate limit; no live penetration or authenticated TornPDA tests were performed.
- All updates retain GreasyFork metadata and require publishing there for normal userscript auto-update.


## Execution-entry PRO review — 2026-10-10

- Bounty Hunter v0.5.12: added PRO check within live target enrichment; FREE users retain basic target records.
- Stock Manager & Advisor v0.8.23: PANIC preview now requires PRO, matching PANIC execution.
- Confirmed backend premium entitlement response includes dedicated rights for all six freemium modules. Other function-level paths still require systematic integration testing; client-side checks are not tamper-resistant.
- Updated scripts.json and GreasyFork descriptions for the changed modules.

## Market and Elimination syntax hotfix — 2026-10-10

- Market Intelligence v1.17.65: fixed duplicate `async` on Museum scan PRO guard.
- Elimination Assistant v1.3.57: fixed duplicate `async` on calibration PRO guard.
- Updated scripts.json and corresponding GreasyFork release documentation.

## Freemium execution-path audit — 2026-10-10

- Bazaar Smart Pricer v1.1.20: PRO checks inside Quick Fill / Update All execution paths; fixed an invalid non-async declaration using await.
- Bounty Hunter v0.5.10: PRO guard inside full-board API fetch and FFScouter enrichment; basic DOM target listing remains free.
- Elimination Assistant v1.3.56: guards WIN/LOSS learning data mutations and fixes invalid async calibration declaration.
- Market Intelligence v1.17.64: fixes invalid async PRO Museum scanner declaration.
- Confirmed Stock Manager PANIC and rebalance execution already have explicit isPro checks (further alternative invocation audit remains).
- Limitation: JavaScript gating cannot prevent a user from modifying locally executed source. Strong protection requires moving premium calculations/operations to a server endpoint with license authorization.


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

### suite v0.9.986

- Fixes Lottery Max Buy visibility on Torn's button-only Lottery interface.
- Adds `MAX BUY · tokens` directly beside the native `BUY` button, with confirmation and a live `STOP · remaining` state.
- Purchases sequentially only after Torn confirms each Casino Token decrease and stops on errors or user cancellation.

### suite v0.9.985

- Adds the enabled-by-default **Lottery Max Buy** Casino module for Daily Dime, Lucky Shot Lotto and Holy Grail.
- Detects available Casino Tokens and places a mobile-friendly `MAX BUY` button beside Torn's ticket quantity input.
- Fills the maximum amount through native reactive input events while leaving the final purchase confirmation to Torn.

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
