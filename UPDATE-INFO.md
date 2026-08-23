# SakaLuX Script HUB — Update Information

Last updated: 2026-08-24

## Current versions

- SakaLuX Script Hub: **v1.7.0**
- SakaLuX Enhancer Guard: **v1.3.1**
- SakaLuX Bazaar Thanker - PDA: **v5.3.0**

## Latest changes

### SakaLuX Script Hub v1.7.0
- Hub is the main SakaLuX script and manages the complementary add-ons.
- Added add-on installation state and INSTALL actions for missing complementary scripts.
- Added installed add-on count/status in the Hub.
- Keeps Greasy Fork update checking and update actions.

### SakaLuX Bazaar Thanker - PDA v5.3.0
- Script now loads on all Torn pages so SakaLuX Script Hub can detect that it is installed.
- Bazaar Thanker features remain active only on the relevant Events/Messages pages.

### SakaLuX Enhancer Guard v1.3.1
- No code change in this release cycle.
- Already loads on all Torn pages and is detectable by the Hub.

## Backup policy

Before every future script update:
1. Save the currently published source directly in `backups/`.
2. Include the old version number in the backup filename, for example `SakaLuX-Script-Hub-v1.7.0.user.js`.
3. Do not create date subfolders; all backups stay directly inside `backups/` and are identified by script name + version.
4. Update the live source file on `main`.
5. Update this `UPDATE-INFO.md` file with the new current version and change summary.
6. Keep Greasy Fork synchronization pointed only at the live source files in the repository root.

## Available backups

- `backups/SakaLuX-Script-Hub-v1.6.0.user.js`
- `backups/SakaLuX-Enhancer-Guard-v1.3.1.user.js`
- `backups/SakaLuX-Bazaar-Thanker-PDA-v5.2.1.user.js`
