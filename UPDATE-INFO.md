# SakaLuX Script HUB — Update Information

Last updated: 2026-08-24

## Current versions

- SakaLuX Script Hub: **v1.8.0**
- SakaLuX Enhancer Guard: **v1.3.2**
- SakaLuX Bazaar Thanker - PDA: **v5.3.1**

## Latest changes

### SakaLuX Script Hub v1.8.0
- Added central `scripts.json` registry and automatic add-on discovery.
- New scripts can now be registered centrally without hard-coding them into the Hub.
- Added **WHAT'S NEW** inside the Hub using release notes from `scripts.json`.
- Added **UPDATE ALL** for installed add-ons that have newer Greasy Fork versions available.
- Added **SYSTEM CHECK** for `scripts.json`, Greasy Fork update sources, local installation state and add-on health.
- Added a global `window.SakaLuXScriptHub` API so complementary scripts can reliably detect that the Hub is installed.
- Added manual registry refresh from Hub Settings.
- Added `@connect raw.githubusercontent.com` so the Hub can read the registry directly from GitHub.

### SakaLuX Enhancer Guard v1.3.2
- Added a SakaLuX Script Hub install prompt when the Hub is not detected.
- Choosing **NOT NOW** postpones the prompt for 24 hours.
- Choosing **INSTALL HUB** opens the official Greasy Fork installer for SakaLuX Script Hub.
- The shared prompt cooldown prevents multiple complementary SakaLuX scripts from showing the same prompt on the same day.

### SakaLuX Bazaar Thanker - PDA v5.3.1
- Added the same optional SakaLuX Script Hub install prompt and shared 24-hour **NOT NOW** cooldown.
- Bazaar Thanker stays available to the Hub on all Torn pages while its working features remain limited to Events/Messages.

## Central registry policy

Every new SakaLuX script must be added to `scripts.json` in the same release cycle.

The registry stores the script ID, type, active status, name, version, category, description, Greasy Fork URLs, exposed API global, UI button selector and supported quick actions.

## Update workflow

For every future script update:
1. Save the currently published source directly in `backups/`.
2. Include the old version number in the backup filename.
3. Do not create date subfolders.
4. Update the live source file on `main`.
5. Update the script version in `scripts.json`.
6. Update this `UPDATE-INFO.md` file with the new version and change summary.
7. Update the corresponding `greasyfork/*.md` additional-info file.
8. Keep Greasy Fork source synchronization pointed only at the live source files in the repository root.

## Backups available for this update

- `backups/SakaLuX-Script-Hub-v1.7.0.user.js`
- `backups/SakaLuX-Enhancer-Guard-v1.3.1.user.js`
- `backups/SakaLuX-Bazaar-Thanker-PDA-v5.3.0.user.js`
