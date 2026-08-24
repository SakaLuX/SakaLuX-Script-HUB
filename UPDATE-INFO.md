# SakaLuX Script HUB — Update Information

Last updated: 2026-08-24

## Current versions

- SakaLuX Script Hub: **v1.8.3**
- SakaLuX Enhancer Guard: **v1.3.2**
- SakaLuX Bazaar Thanker - PDA: **v5.3.1**
- SakaLuX Mission Rewards: **v1.0.1**

## Latest changes

### SakaLuX Script Hub v1.8.3
- Rebuilt the Hub launcher as a native Torn navigation item inserted immediately before **Messages**.
- The launcher clones Torn's own navigation structure so size, spacing and alignment match surrounding buttons.
- Replaced the emoji-style top launcher with a monochrome text-presentation skull (`☠︎`) and **HUB** label.
- The blink animation now affects only the skull icon, with a subtle native-style double blink.
- The floating circular Hub button automatically hides whenever the native Torn launcher is available and remains only as a fallback if Torn's Messages navigation cannot be detected.
- Update/error badge remains supported without disturbing Torn's navigation layout.
- **SYSTEM CHECK** now reports the native Torn HUB launcher state.
- Added exact source backup: `backups/SakaLuX-Script-Hub-v1.8.2.user.js`.

### SakaLuX Script Hub v1.8.2
- Added the first animated **☠️ SakaLuX launcher** experiment before **Messages**.
- The top-bar launcher opened the full SakaLuX Script Hub with one tap/click.
- Added repeated blink/pulse animation and update/issue status badge.
- Added a Hub setting to show/hide the top-bar launcher.
- Added Mission Rewards v1.0.1 to the Hub's offline fallback registry.
- Added the `SakaLuX:MissionRewardsReady` listener so Hub status refreshes immediately when Mission Rewards becomes available.

### SakaLuX Mission Rewards v1.0.1
- Changed `@match` to all Torn pages so `window.SakaLuXMissionRewards` is available everywhere and Script Hub no longer reports the add-on as missing outside Missions.
- Mission-specific scanning, API loading, floating button and reward processing remain restricted to `sid=missions`.
- Improved mobile/PDA reward badges by rendering them as an absolute overlay inside each reward card, preventing Torn's carousel layout from clipping the added information.
- Added the shared optional Script Hub install prompt with a 24-hour **NOT NOW** cooldown.
- Opening Mission Rewards from the Hub outside the Missions page now navigates to Missions.
- Added `activePage` to Mission Rewards health information.
- Updated `scripts.json` to v1.0.1 and synchronized Greasy Fork Additional info.

### SakaLuX Mission Rewards v1.0.0
- Imported the currently published Mission Rewards source into the GitHub repository.
- Added Mission Rewards to `scripts.json` so SakaLuX Script Hub can discover and manage it.
- Registered the existing `window.SakaLuXMissionRewards` API with Hub actions for settings, refresh and Missions navigation.
- Added the versioned source backup in `backups/`.
- Added `greasyfork/Mission-Rewards.md` for synchronized Greasy Fork Additional info.

### SakaLuX Script Hub v1.8.1
- Fixed **WHAT'S NEW** so the button is visible and usable on mobile/PDA.
- Moved Hub release notes into the Hub code itself instead of storing them in `scripts.json`.
- Cleaned `scripts.json` so it is used only as the add-on registry.
- Removed the Script Hub entry and release-note data from `scripts.json`.
- Kept automatic add-on discovery, **UPDATE ALL**, **SYSTEM CHECK**, registry refresh and the global `window.SakaLuXScriptHub` API.
- Reworked the Hub toolbar so all five controls remain visible on mobile: update check, update all, system check, what's new and settings.

### SakaLuX Enhancer Guard v1.3.2
- Added a SakaLuX Script Hub install prompt when the Hub is not detected.
- Choosing **NOT NOW** postpones the prompt for 24 hours.
- Choosing **INSTALL HUB** opens the official Greasy Fork installer for SakaLuX Script Hub.
- The shared prompt cooldown prevents multiple complementary SakaLuX scripts from showing the same prompt on the same day.

### SakaLuX Bazaar Thanker - PDA v5.3.1
- Added the same optional SakaLuX Script Hub install prompt and shared 24-hour **NOT NOW** cooldown.
- Bazaar Thanker stays available to the Hub on all Torn pages while its working features remain limited to Events/Messages.

## Central registry policy

`scripts.json` is only the registry of complementary SakaLuX add-ons that the Hub should discover and manage.

Every new complementary SakaLuX script must be added to `scripts.json` in the same release cycle.

The registry stores only information needed to identify, install, detect, update and launch add-ons. Hub metadata and Hub release notes do not belong in `scripts.json`.

## Update workflow

For every future script update:
1. Save the currently published source directly in `backups/`.
2. Include the old version number in the backup filename.
3. Do not create date subfolders.
4. Update the live source file on `main`.
5. If the updated script is an add-on, update its entry/version in `scripts.json`.
6. If a new add-on is created, add it to `scripts.json` immediately.
7. Update this `UPDATE-INFO.md` file with the new version and change summary.
8. Update the corresponding `greasyfork/*.md` additional-info file.
9. Keep Greasy Fork source synchronization pointed only at the live source files in the repository root.

## Backups available

- `backups/SakaLuX-Script-Hub-v1.8.2.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.1.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.0.user.js`
- `backups/SakaLuX-Script-Hub-v1.7.0.user.js`
- `backups/SakaLuX-Enhancer-Guard-v1.3.1.user.js`
- `backups/SakaLuX-Bazaar-Thanker-PDA-v5.3.0.user.js`
- `backups/SakaLuX-Mission-Rewards-v1.0.0.user.js`
