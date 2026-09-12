# ☠️ SakaLuX Script Hub

> Central manager for the SakaLuX script ecosystem.

## Current version
1.9.24

## What it does
- Automatically discovers active SakaLuX add-ons from the central `scripts.json` registry.
- Detects installed, missing and outdated registered SakaLuX add-ons.
- Gives installed modules a clean native ON/OFF switch plus one OPEN or SETTINGS action.
- **CHECK** refreshes the live registry and then verifies available updates.
- **UPDATE** refreshes the live registry and update state before opening available installers.
- Revalidates update status against the actually installed version to avoid stale alerts.
- Provides **SYSTEM CHECK** for registry access, update sources and module health.
- Provides **WHAT'S NEW**, category navigation, health information and backup / restore.
- Uses a premium control-center layout optimized for both Torn PDA and desktop userscript managers.
- Adds a Torn-native **HUB** mobile navigation entry with a floating fallback launcher.
- Exposes `window.SakaLuXScriptHub` for integration with registered complementary add-ons.
- Uses the common `setEnabled`, `toggleEnabled` and `isEnabled` integration API.
- Can securely store one shared Torn API key locally for registered add-ons that require Torn API access.
- Works with Torn PDA and Tampermonkey.

## Current release note
Ultra-professional standalone dock polish: icon badges now sit inside balanced button geometry, labels are optically centered, spacing and shadows are refined, the Hub action is visually quieter, and the native S launcher remains the only primary toggle. The shared Hub reminder remains limited to once every 12 hours.

## Recommended
Install SakaLuX Script Hub when using multiple registered SakaLuX add-ons. It provides one place for installation status, updates, module power control, shared API access and health diagnostics.

### Registered complementary add-ons

- 🛡️ SakaLuX Enhancer Guard **v1.3.26**
- 💬 SakaLuX Bazaar Thanker - PDA **v5.3.16**
- 🎯 SakaLuX Mission Rewards **v1.0.13**
- 📈 SakaLuX Market Intelligence **v1.17.14**
- ⚔️ SakaLuX Elimination Assistant **v1.3.26**

## License
All Rights Reserved

## Privacy
- The shared Torn API key is stored locally in the userscript/browser environment.
- Hub does not publish the user's Torn API key to the public SakaLuX registry.
- Hub contacts the configured update/registry sources to check module metadata and current versions.
- Individual registered add-ons may use their own external data sources; see each add-on's information page for its specific privacy details.

## Important
Every future complementary SakaLuX add-on intended for Hub management should be added to `scripts.json` and should keep its dedicated `greasyfork/*.md` information file synchronized with the current script version.

## Release history
### v1.9.22 — Standalone Dock v3 compatibility

- Synced managed add-on versions for the compact standalone dock release.
- Standalone add-ons now use a native gold **S** launcher after cash instead of the dock **+** control.

### v1.9.18 — Floating fallback fix

- Hides the floating skull whenever the native **S** launcher is present in Torn `statusIcons`.
- Keeps the Fly-out **HUB** skull before Messages when that navigation bar is available.
- Uses the floating skull only when neither native launcher can be mounted.

### v1.9.17 — Three-tier Torn launcher behavior

- Keeps the compact **S** as the first native `statusIcons` item before cash.
- Restores the skull launcher before **Messages** when Touchscreen Navigation exposes the **Fly-out sidebar**.
- Shows the floating skull only when the Fly-out sidebar navigation is unavailable.

### v1.9.16 — Launcher before cash

- Places the native Hub launcher as the first `statusIcons` item so it appears directly before the cash resource on the current Torn mobile layout.
- Removed the unreliable money/cash element detector from v1.9.15.
- Fortie-style native mounting and skull fallback remain unchanged.

### v1.9.15 — Launcher before money

- Keeps the native Fortie-style `statusIcons` mounting introduced in v1.9.14.
- Positions the SakaLuX Hub icon immediately before Torn money/cash when that status cell is identifiable.
- Falls back safely to the end of the native status row if Torn changes the money cell internals.

### v1.9.14 — Native Torn status launcher

- Replaced the guessed money-resource detector with Torn's native `statusIcons` list detection used by the Fortie launcher strategy.
- The Hub launcher is now a real 17px Torn status icon and inherits native cell classes from adjacent Torn icons.
- The floating skull remains only as fallback when the native status icon list is unavailable.

### v1.9.13 — Resource-bar launcher

- Replaced the native navigation skull entry with a compact SakaLuX **S** launcher mounted directly in Torn's resource/status bar.
- The launcher is inserted immediately before the money resource when Torn exposes the resource bar.
- The existing floating skull is now strictly an automatic fallback when that native resource-bar anchor cannot be detected.
- Update/issue badges are preserved on the new compact launcher.

### v1.9.12 — Extensible shared languages

- English is the guaranteed standalone default for every SakaLuX script.
- Hub loads the shared `locales.json` registry and applies its selected language to every SakaLuX interface.
- The selector is generated from the locale registry, allowing additional languages without changing its UI code.
- Added `getLanguages()` alongside `getLanguage()` and `setLanguage()` for add-on integration.

### v1.9.11 — English and Romanian interfaces

- Added a persistent **Language** selector beside **Fallback button position** in a balanced two-column row.
- Added shared **English / Română** localization for Script Hub and all SakaLuX add-on interfaces managed by it.
- Language changes apply immediately and also translate UI elements created later by TornPDA navigation.
- Exposed `getLanguage()` and `setLanguage()` for native localization in every add-on.

### v1.9.10 — Violentmonkey/macOS detection

- Fixed installed modules incorrectly appearing as **OFF + INSTALL** when Violentmonkey isolates each userscript's `window` API.
- Installation markers and DOM bridges are now checked before the sandboxed runtime API.
- Added cross-context ON/OFF and OPEN support through hidden DOM control bridges.
- Corrected the Elimination Assistant marker mismatch.

### v1.9.9 — Inline panel signature

- Removed the floating author badge from the Torn page.
- **Made with ❤️ by SakaLuX [2380374]** now lives inside the script panel as its final footer, with the author name and ID linked to the Torn profile.

### v1.9.8 — Persistent SakaLuX signature

- Restored **Made with ❤️ by SakaLuX [2380374]** in the Hub footer with the linked Torn profile.
- Added the persistent shared author footer used by every current SakaLuX userscript.
- Market Intelligence now uses a cleaner subtitle and a larger Hub-style close button.

### v1.9.7

- Embedded the unified **SakaLuX Control Center** visual theme directly into every current SakaLuX userscript so the look no longer depends on Hub being present.
- Synchronized the managed add-on patch versions in `scripts.json`, Hub fallback data and the dedicated information pages.
- Account Auditor and SakaLuX Suite also receive their own embedded copy of the visual layer while remaining standalone and completely absent from the Hub registry.

### v1.9.6

- Added a unified **SakaLuX Control Center** visual layer across current SakaLuX interfaces.
- Standardized dark surfaces, borders, cards, buttons, fields and responsive spacing for Enhancer Guard, Bazaar Thanker, Mission Rewards, Market Intelligence and Elimination Assistant.
- Compatible prefixed settings checkboxes now use the same sliding-switch visual language as Hub.
- The same visual layer also recognizes **Account Auditor** and **SakaLuX Suite** when installed, while both remain completely standalone and absent from the Hub registry.
- This release changes presentation only for external module panels; module logic, APIs and saved data are unchanged.

### v1.9.5

- Converted boolean Hub Settings controls to professional slide switches.
- Removed the duplicate **REFRESH scripts.json** button from Settings.
- Removed the duplicate **CHECK UPDATES NOW** button from Settings.
- **CHECK** now refreshes `scripts.json` before checking published versions.
- **UPDATE** now refreshes `scripts.json` and update state before opening update installers.
- Removed the fallback floating-skull long-press Quick Menu option and its gesture handling.
- Kept fallback button position and size controls, shared API key management, backup/restore and reset controls.

### v1.9.4

- Redesigned the Hub as a premium **SakaLuX Control Center** with stronger visual hierarchy and cleaner TornPDA readability.
- Rebuilt the header, health summary, command bar, category navigation and module cards around a consistent dark control-room design.
- Replaced icon-only management controls with compact labelled actions for **CHECK**, **UPDATE**, **HEALTH**, **NEW** and **SETTINGS**.
- Added concise module status chips for installed version, update state, active/disabled state and contextual module information.
- Reduced raw technical text inside module cards while keeping detailed diagnostics available through **SYSTEM CHECK**.

### v1.9.3

- Added PC/Tampermonkey-safe persistent installation markers so Hub can detect registered scripts even when isolated userscript sandboxes hide their runtime APIs.

### v1.9.2

- Removed the Hub search field; registered modules remain available through the category tabs.

### v1.9.1

- Made the live `scripts.json` registry the canonical minimum for **Latest**.
- Update caches now expire immediately when a registry version changes.
- When the Greasy Fork mirror is behind, install/update actions can use the current GitHub userscript source to prevent downgrades.
- Synchronized the offline fallback registry with the current module versions.
- Added automated cross-file version validation.

### v1.9.0

- Redesigned the Hub with a cleaner TornPDA-first card layout.
- Reduced every registered module card to a persistent ON/OFF slider and one OPEN or SETTINGS action.
- Added native runtime power control for registered add-ons.
- Added shared Torn API-key creation, save/test and clear controls.
- Registered add-ons automatically prefer the shared Hub key when compatible.
