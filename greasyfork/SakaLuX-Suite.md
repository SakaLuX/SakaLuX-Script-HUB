# SakaLuX Suite [EXPERIMENTAL]

SakaLuX Suite is an experimental one-install modular toolkit for Torn PDA / Tampermonkey.

## Current version

**v0.9.902**

## What it does

- Provides one central **SakaLuX Suite** Master Control.
- Uses persistent ON / OFF state per module.
- Keeps one shared Torn API key store for future API-driven embedded modules.
- Includes import/export of Suite settings without exporting the API key.
- Keeps the current standalone SakaLuX scripts untouched while the bundled Suite is tested.
- Bridges to the current Enhancer Guard, Bazaar Thanker, Market Intelligence, Mission Rewards and Elimination Assistant when those scripts are installed.

## REMINDERS

The old `Quality of Life` category has been renamed to **REMINDERS** and all public-facing tool names were changed to SakaLuX-specific names.

### Daily Prayer Bell
- Daily UTC prayer cue.
- Adds a small in-game prayer icon when enabled.
- Hides after prayer until the next Torn UTC day.

### Recovery Planner
- Reads visible Life / hospital information when available.
- Provides advisory medical-item recommendations.
- Includes its own **SETTINGS** panel.
- Supports item source, education bonuses, faction bonus, recommendation priority and drug exclusion.
- Never consumes an item automatically.

### Item Signal
- Adds compact O / E / C and resource markers directly over recognized item images.
- Opens a centered Torn-native tooltip with the item purpose and effect on tap or click.
- Covers OC role items plus Energy, Nerve, Happiness, Heal and Enhancer signals.
- Uses stable item IDs when available and visible item information as fallback.

### Event Lens
- Replaces the native Events list with a compact categorized dashboard on the Events page.
- Adds horizontally scrollable filter chips, category counts, search, refresh, reset and visible/total count.
- Groups cards by day and uses category-specific icons, accent colors, time, date and amount styling.
- Adds collapsible day sections and locally saved events.
- Saved event text remains local to the browser.

### Chain Alarm
- Reads visible chain count / timer information when available.
- Adds a compact chain control icon and warning panel.

## FACTION

### Faction Pulse
- Summarizes visible faction-member activity signals.
- Tracks visible Online, Hospital and Traveling / Abroad text states.

### Armory Loan Radar
- Highlights visible loaned armory entries.
- Summarizes visible loan / availability signals.

### Member Travel Map
- Adds compact country-flag markers when a known travel destination is visible on faction member rows.

### OC Role Match
- Surfaces visible OC role / success percentages as quick match indicators.
- Advisory only; it does not join or execute crimes.

### OC Readiness
- Warns when visible page text indicates no active OC, missing required items or vacant roles.

### War Performance
- Summarizes visible ranked-war result markers into wins, losses and an approximate visible win rate.

## COMPANY

### Company Console
- Adds a compact company-page summary.
- Surfaces visible employee, stock, wage, training and tax-related signals.

## CASINO

### Odds Scout
- Adds implied-probability hints beside recognizable decimal sports-betting odds.
- Does not place bets or automate casino actions.

## RACING

### Race League Board
- Reads recognizable visible race-result rows.
- Assigns local F1-style points and builds a compact standings panel.
- Does not enter races automatically.

## Existing SakaLuX modules

The following remain bridge modules during testing and keep their existing SakaLuX names:

- Enhancer Guard
- Bazaar Thanker
- Market Intelligence
- Mission Rewards
- Elimination Assistant

Their production standalone scripts are not removed or modified by Suite v0.4.0.

## Current release notes

### v0.8.0 — final documented-parity hardening
- Added `@updateURL` and `@downloadURL` for direct raw-GitHub update support in compatible userscript managers.
- Added Suite Diagnostics and route-aware scan throttling for Torn PDA/mobile performance.
- Prayer completion detection hardened so the reminder hides only after success text is detected.
- Recovery Planner now reads visible medical cooldown and can use the saved faction-armory snapshot as an item source.
- Item Signals avoids nested ancestor duplication and keeps item-ID + name-based detection.
- Armory Loan Radar now fully cleans its styling when rescanned/disabled.
- OC Role Match visibly applies the configured suitability threshold.
- War Performance now keeps a local visible ranked-war W/L history in addition to reports/AAR/risk view.
- Company Console adds a visible employee/wage report alongside stock, pricing, training and tax history.
- Odds Scout nested-market duplicate protection and Race League duplicate signatures were hardened.
- Export/import now includes all internal module settings while still excluding the Torn API key.


### v0.4.1

- Changed SakaLuX Suite licensing from MIT to **All Rights Reserved** and added explicit author/copyright protection.
- Added `Copyright © 2026 SakaLuX [2380374]` and retained-author requirements.
- Personal use and private modification remain permitted; redistribution/republication require prior written permission.


### v0.4.0

- Renamed **Quality of Life** to **REMINDERS**.
- Renamed all externally-inspired prototype tools to original SakaLuX names.
- Added **Chain Alarm**.
- Added **Faction Pulse**.
- Added **Armory Loan Radar**.
- Added **Member Travel Map**.
- Added **OC Role Match**.
- Added **OC Readiness**.
- Added **War Performance**.
- Added **Company Console**.
- Added **Odds Scout**.
- Added **Race League Board**.
- Renamed the earlier internal modules:
  - Prayer Reminder → Daily Prayer Bell
  - Med Advisor → Recovery Planner
  - Item Intel → Item Signals
  - Event Intel → Event Lens
- Introduced a new Suite module-state namespace (`SakaLuX_SUITE_MODULES_V2`) for the renamed module IDs.
- Kept all new implementations independent and SakaLuX-specific rather than reusing third-party source code.
- Existing standalone SakaLuX scripts remain untouched.

### v0.3.0

- Added in-game prayer and medical icons.
- Added configurable recovery settings.
- Expanded item markers and event filtering.

### v0.2.0

- Added the first four internal prototype modules.

### v0.1.1

- Added single-scroll Master Control layout and Torn-style Suite launcher.

### v0.1.0

- Initial experimental Suite Master Control.

## Privacy

The shared Torn API key is stored locally under `SakaLuX_SUITE_TORN_API_KEY` and is not included in exported Suite settings.

The Suite does not automate attacks, crimes, bets, item consumption or race entry.


## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.


### v0.5.0 — internal module functional upgrade
- Upgraded all experimental internal modules from simple page counters to working local tools and scanners.
- Chain Alarm now has a floating timer, warning thresholds and drag support.
- Faction Pulse now parses member rows and statuses.
- Armory Loan Radar stores local loan snapshots.
- Member Travel Map adds editable local country overrides.
- OC Role Match surfaces the strongest visible role suitability and OC Readiness warns about missing participation/readiness.
- War Performance stores local report snapshots and MVP signals.
- Company Console adds employee/income/train signals and a price calculator.
- Odds Scout calculates implied probabilities and market margin.
- Race League Board persists F1-style points across detected results with duplicate protection.
- Added Torn API permission plumbing for the shared-key architecture; modules remain read-only/advisory.


### v0.6.0 — parity expansion
- Daily Prayer Bell now marks completion only after detected prayer success; clicking the icon only opens Church.
- Recovery Planner now shows ranked recommendations, visible owned quantities when detectable, waste estimates and No Drug Usage behavior.
- Item Signals gained per-category settings and tighter item-row scanning.
- Event Lens gained Saved-only mode and local export.
- Chain Alarm gained persistent drag/resize, warning/critical thresholds, focus dimming, flashing and Alt+C toggle.
- Faction Pulse now provides member-level attention signals.
- Armory Loan Radar gained explicit scan controls, saved snapshots and per-loan popup buttons.
- Member Travel Map gained country summaries plus editable overrides.
- OC Role Match now adds estimated success/risk and configurable suitability threshold; OC Readiness captures visible requirements.
- War Performance now stores de-duplicated reports, command-style rankings and risk flags.
- Company Console now stores snapshots and local training/tax logs in addition to wage/income/train signals and price calculator.
- Odds Scout scans complete visible markets, displays margin and provides a research shortcut without placing bets.
- Race League Board now supports separate championships, driver stats, backup/import and duplicate protection.
- All internal modules now expose a SETTINGS action in Master Control.


### v0.7.0 — parity hardening
- Item Signals now prefers stable item IDs when available and keeps text fallback.
- Armory Loan Radar adds member/profile loan buttons from the saved armory snapshot.
- Member Travel Map adds country filtering, show-all and wipe controls.
- OC Readiness cross-references stored armory loans and captured OC requirements.
- War Performance adds wide command view, search, risk sort, member hiding, AAR summary and backup.
- Company Console adds stock signal, history, pricing records and larger training/tax logs.
- Odds Scout adds collapsed state, market de-duplication and sport-aware research.
- Race League Board adds race logs, stats, driver recent history, delete championship and backup/import.
- Faction Pulse adds sorting and watchlist export.


### v0.8.1
- Fixed missing Daily Prayer Bell and Recovery Planner reminder icons on Torn PDA/mobile.
- Added one-time reminder bootstrap for older installs that inherited those modules as OFF.
- Hardened reminder dock placement and SPA self-healing.
- Prayer completion is now only detected on the Church page.


### v0.9.0 — deep parity pass
- Item Signals now uses richer DOM/item-ID discovery, semantic effect inference, touch/click tooltips, and duplicate-safe markers.
- Recovery Planner now respects medical cooldown, owned quantity, estimated restore, waste, and efficiency ranking.
- Member Travel Map now covers all Torn travel destinations with aliases, filter cards, sorting, profile/faction flags, and mobile-friendly controls.
- OC Role Match now exposes Low/Normal/High/Critical suitability tiers and configurable threshold status.
- OC Readiness now scans visible Recruiting/Planning sections, caches role-item requirements, and correlates armory loans to those requirements.
- War Performance now adds reliability, participation, L5 history, risk levels and risk filters.
- Company Console adds employee effectiveness ranking, stock-change history and richer local management records.
- Odds Scout adds sport detection, favourite/risk context and improved market analysis.
- Race League Board adds championship rename and CSV export.
- Daily Prayer completion was made idempotent to prevent recursive rerender loops.


### v0.9.1 — reminder row placement
- Moved Daily Prayer Bell, Recovery Planner and Chain Alarm icons out of the profile/settings popup.
- Reminder icons now attach to the same Torn resource row as the SakaLuX skull/money balance and are appended at the end of that row.
- Kept a horizontal PDA fallback only when the native resource row is unavailable.


### v0.9.2 — native-size reminder icons
- Reset Torn inherited button sizing so Suite reminder controls stay compact on PDA.
- Prayer, Recovery and Chain reminder buttons are now fixed at 30×30 px with native-like circular styling.
- The reminder dock receives maximum flex order so it stays at the visual end of the resource icon row.
- Tightened spacing and removed oversized padding/shadows for better integration with Torn and other compact helper icons.


### v0.9.3 — native reminder icon polish
- Reduced Daily Prayer Bell, Recovery Planner and Chain Alarm controls to the compact Torn resource-row size.
- Removed oversized padding/inherited button sizing and normalized circular styling.
- Detects reversed resource-row direction so the SakaLuX reminder group stays at the visual end of the row on Torn PDA.


### v0.9.2 — native resource-row icon styling
- Reduced Daily Prayer Bell, Recovery Planner and Chain Alarm controls to native resource-row scale.
- Removed the oversized circular background, border and shadow.
- Reminder controls clone the existing SakaLuX/Torn resource-row control structure when available, so spacing and alignment match the surrounding row.
- Kept only a compact transparent PDA fallback when the native row is unavailable.


### v0.9.4 — native-row reminder scale
- Daily Prayer Bell, Recovery Planner and Chain Alarm controls now measure the surrounding Torn resource-row controls and automatically use the median native icon size.
- Removed cloning of the larger SakaLuX launcher for reminder buttons, preventing oversized circular controls.
- Reminder buttons keep a compact circular Torn-style shell and scale their symbol proportionally for PDA/mobile.


### v0.9.5 — compact resource-row integration
- Finds the full Torn resource strip instead of the money-item wrapper, so reminder controls are appended at the visual far-right end.
- Uses compact 28 px circular controls with 15 px glyphs and restrained native-style borders/shading.
- Prevents the reminder group from inheriting oversized resource-item dimensions.


### v0.9.6 — compact reminder controls
- Rebuilt reminder icons as a compact 22 px hit area with an 18 px visible circle, preventing Torn PDA CSS from inflating the controls.
- Reduced spacing and retained far-right placement in the resource strip.
- Original SakaLuX implementation based on observed public behavior only.


### v0.9.7 — reminder cleanup and Recovery Planner card
- Only Recovery Planner keeps a Settings button in the Reminders group.
- Daily Prayer Bell hides its top-bar icon immediately after prayer completion is detected and resets by UTC day.
- Recovery Planner now opens a dedicated SakaLuX card with HP, hospital, bonus, item source, rescan and recommendation sections.

### v0.9.8 — Item Signal and Event Lens visual rebuild
- Rebuilt Item Signal as compact image-corner markers with touch-friendly floating effect tooltips.
- Added ID-backed enhancer, energy, nerve and health details while retaining visible-text fallbacks.
- Rebuilt Event Lens as the full mobile event dashboard with filter chips, category counts, search, refresh, reset, day grouping, colored cards and Saved Events.
- Kept the implementation stable under Torn's dynamic PDA navigation without recreating unchanged panels on every scan.

### v0.9.9 — complete Item Signal data and TornPDA Event Lens fix
- Replaced the partial Item Signal catalogue with the complete OC, enhancer, crime, energy, nerve, happiness and health ID maps used by the reference behavior.
- Added every multi-purpose marker combination, including O/E/C overlaps and the full effect tooltip details.
- Replaced the generic event-row detector with TornPDA's native `listItemWrapper`, message and `dateTime` structure.
- Ported the full Event Lens lifecycle: delayed startup, PDA synchronization, native-list observation, filters, search, quick statistics, saved events, expanded cards and responsive layouts.

### v0.9.901 — persistent Suite panel and Events SPA adapter
- Kept Item Signal as an exact transformed copy of Fortie's complete Item Intel module, including every OC, enhancer, crime, energy, nerve, happiness and health item map.
- Kept Fortie's Event Lens dashboard and added a Suite-to-TornPDA adapter for Events routes exposed through query strings, hashes or SPA navigation.
- Added a TornPDA fallback discovery layer for event rows whose generated wrapper classes differ, while retaining Fortie's native selectors as the first choice.
- Replaced the Suite's text ON/OFF buttons with Fortie-style sliding switches.
- The Suite window is now created once and hidden/reopened in place, so toggling modules no longer closes it or resets its scroll position.
- Tightened spacing, controls and mobile sizing so more modules remain readable on small screens.
- Added Event Lens route, row-count, waiting and mount information to Suite Diagnostics.

### v0.9.902 — Event Lens factory scope fix
- Removed the stray unary `+` that turned the Event Lens factory declaration into an isolated expression.
- Event Lens can now instantiate when its Suite switch is enabled.
- Added a validation invariant for the exact factory declaration so this scope regression cannot pass CI again.
