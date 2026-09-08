# SakaLuX Suite [EXPERIMENTAL]

SakaLuX Suite is an experimental one-install modular toolkit for Torn PDA / Tampermonkey.

## Current version

**v0.7.0**

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

### Item Signals
- Adds compact markers to recognized items.
- Covers OC role items plus Energy, Nerve, Happiness, Heal and Enhancer signals.
- Works locally from visible item information.

### Event Lens
- Searchable Torn Events helper.
- Adds local categories, counts and Saved Events.
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
