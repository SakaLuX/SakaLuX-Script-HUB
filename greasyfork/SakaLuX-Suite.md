# SakaLuX Suite [EXPERIMENTAL]

SakaLuX Suite is an experimental one-install modular toolkit for Torn PDA / Tampermonkey.

## Current version

**v0.4.1**

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
