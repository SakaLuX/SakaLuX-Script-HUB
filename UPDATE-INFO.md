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
1. Save the currently published source in `backups/YYYY-MM-DD/`.
2. Include the old version number in the backup filename.
3. Update the live source file on `main`.
4. Update this `UPDATE-INFO.md` file with the new current version and change summary.
5. Keep Greasy Fork synchronization pointed only at the live source files in the repository root.

## Backup created for this update

- `backups/2026-08-24/SakaLuX-Script-Hub-v1.6.0.user.js`
- `backups/2026-08-24/SakaLuX-Enhancer-Guard-v1.3.1.user.js`
- `backups/2026-08-24/SakaLuX-Bazaar-Thanker-PDA-v5.2.1.user.js`
