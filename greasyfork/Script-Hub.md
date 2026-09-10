# SakaLuX Script Hub

SakaLuX Script Hub is the main manager for the SakaLuX Torn script suite.

## Current version

**v1.9.1**

## What it does

- Automatically discovers active SakaLuX add-ons from the central `scripts.json` registry.
- Detects installed, missing and outdated SakaLuX add-ons.
- Gives every installed module exactly two card controls: a native ON/OFF slide switch and one OPEN or SETTINGS button.
- Provides **UPDATE ALL** for installed add-ons with newer versions available.
- Revalidates cached update status against the version currently installed, preventing stale false update alerts.
- Provides **SYSTEM CHECK** for registry access, Greasy Fork update sources and local add-on health.
- Provides **WHAT'S NEW**, search, health status and backup / restore without cluttering module cards.
- Adds a Torn-native **skull HUB** mobile navigation entry immediately before Messages.
- Uses Torn's own mobile navigation structure so the HUB entry matches the surrounding interface.
- Keeps a floating circular Hub button only as a fallback when the native launcher is unavailable.
- Exposes `window.SakaLuXScriptHub` so complementary scripts can detect and integrate with the Hub.
- Uses the common `setEnabled`, `toggleEnabled` and `isEnabled` API implemented by every registered add-on.
- Creates and securely stores one shared Torn API key for all registered add-ons that need it.
- Designed for Torn PDA and Tampermonkey.

## Current release notes

### v1.9.1

- Made the live `scripts.json` Registry the canonical minimum for **Latest**, so a delayed Greasy Fork mirror cannot display an older version.
- Update caches now expire immediately whenever a module Registry version changes.
- When Greasy Fork is behind, Hub install/update actions use the current GitHub userscript source to prevent downgrades.
- Synchronized the offline fallback Registry with every current module version.
- Added automated cross-file version validation for future releases.

### v1.9.0

- Redesigned the Hub with a cleaner TornPDA-first card layout and higher-contrast dark styling.
- Removed per-module refresh, scan, export, calibration, key and navigation button clusters.
- Each module card now contains only a persistent ON/OFF slider and one OPEN or SETTINGS action.
- Added native runtime power control to every registered add-on; OFF stops its timers/observers and removes injected UI.
- Added **CREATE GENERAL API KEY**, **SAVE & TEST** and **CLEAR KEY** in Hub Settings. Modules automatically prefer this shared key.
- Standalone add-ons retain their own key storage and required-key creator; Bazaar Thanker needs no Torn API key and FFScouter remains separate.
- Older add-on builds must be updated before their Hub power switch becomes available.

### v1.8.6

- Changed project licensing from MIT to **All Rights Reserved** and added explicit SakaLuX copyright/redistribution terms.
- Added `Copyright © 2026 SakaLuX [2380374]` and retained-author requirements.
- Personal use and private modification remain permitted; redistribution/republication require prior written permission.

### v1.8.5

- Fixed false **UPDATE AVAILABLE** indicators after an add-on had already been updated.
- Cached update data is reused only when its stored installed version still matches the version currently loaded.
- **Latest vs Installed** is recalculated before rendering cards, counters and the HUB alert badge.
- Added Market Intelligence to the offline fallback registry and ready-event integration.
- Added Elimination Assistant quick-action integration.
- Elimination Assistant can remain installed while disabled from Hub.
- When Elimination is **ON**, its full action set is available.
- When Elimination is **OFF**, only the red OFF control remains visible; the other Elimination actions are hidden until it is turned back ON.
- The Hub can still detect and re-enable Elimination Assistant while the add-on itself is disabled.

### v1.8.4

- Fixed the mobile layout where HUB appeared above Messages and pushed Messages onto a second row.
- HUB is mounted as its own Torn swiper/navigation entry directly before Messages.
- Reuses a native Torn SVG element and icon wrappers for sizing and alignment.
- The **HUB** label inherits Torn's own typography and spacing.
- Blink animation changes only skull opacity, keeping the navigation row stable.

### v1.8.3

- Introduced the Torn-style navigation version of the HUB launcher.
- Added the monochrome skull plus HUB label and floating-button fallback behavior.

## Current SakaLuX add-ons

Complementary add-ons currently registered in the live `scripts.json` registry:

- SakaLuX Enhancer Guard **v1.3.10**
- SakaLuX Bazaar Thanker - PDA **v5.3.3**
- SakaLuX Mission Rewards **v1.0.3**
- SakaLuX Market Intelligence **v1.17.0**
- SakaLuX Elimination Assistant **v1.3.7**

### Native module power integration

Every registered add-on exposes the same persistent power API. **ON** activates its runtime and **OFF** stops background observers/timers and removes its injected UI while leaving the small API bridge available so Hub can turn it back on.

## Standalone tool

SakaLuX Account Auditor **v1.2.1** is maintained separately and intentionally excluded from `scripts.json`, so Hub does not present it as a required/recommended complementary add-on.

Every new complementary SakaLuX script should be added to `scripts.json` and its dedicated `greasyfork/*.md` information file should be updated with the current version and release notes.

## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.
