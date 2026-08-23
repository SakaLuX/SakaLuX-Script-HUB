# SakaLuX Script HUB — Update Information

Last updated: 2026-08-24

## Current versions

- SakaLuX Script Hub: **v1.7.0**
- SakaLuX Enhancer Guard: **v1.3.2**
- SakaLuX Bazaar Thanker - PDA: **v5.3.1**

## Latest changes

### SakaLuX Enhancer Guard v1.3.2
- Added a SakaLuX Script Hub install prompt when the Hub is not detected.
- Choosing **NOT NOW** postpones the prompt for 24 hours.
- Choosing **INSTALL HUB** opens the official Greasy Fork installer for SakaLuX Script Hub.
- The shared prompt cooldown prevents multiple complementary SakaLuX scripts from showing the same prompt on the same day.

### SakaLuX Bazaar Thanker - PDA v5.3.1
- Added the same optional SakaLuX Script Hub install prompt and shared 24-hour **NOT NOW** cooldown.
- Bazaar Thanker continues to stay available to the Hub on all Torn pages while its working features remain limited to Events/Messages.

### SakaLuX Script Hub v1.7.0
- No code change in this release cycle.
- Remains the main SakaLuX manager/installer for complementary add-ons.

## Backup policy

Before every future script update:
1. Save the currently published source directly in `backups/`.
2. Include the old version number in the backup filename, for example `backups/SakaLuX-Script-Hub-v1.7.0.user.js`.
3. Do not create date subfolders; the versioned filename is the identifier.
4. Update the live source file on `main`.
5. Update this `UPDATE-INFO.md` file with the new current version and change summary.
6. Keep Greasy Fork synchronization pointed only at the live source files in the repository root.

## Backups available for this update

- `backups/SakaLuX-Enhancer-Guard-v1.3.1.user.js`
- `backups/SakaLuX-Bazaar-Thanker-PDA-v5.3.0.user.js`
