# ☠️ SakaLuX Script Hub

Core manager for the SakaLuX Torn script ecosystem.

## Current version

**v1.9.9**

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

## Current release notes

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

## Recommended

Install SakaLuX Script Hub when using multiple registered SakaLuX add-ons. It provides one place for installation status, updates, module power control, shared API access and health diagnostics.

### Registered complementary add-ons

- 🛡️ SakaLuX Enhancer Guard **v1.3.17**
- 💬 SakaLuX Bazaar Thanker - PDA **v5.3.9**
- 🎯 SakaLuX Mission Rewards **v1.0.7**
- 📈 SakaLuX Market Intelligence **v1.17.6**
- ⚔️ SakaLuX Elimination Assistant **v1.3.15**

## Privacy

- The shared Torn API key is stored locally in the userscript/browser environment.
- Hub does not publish the user's Torn API key to the public SakaLuX registry.
- Hub contacts the configured update/registry sources to check module metadata and current versions.
- Individual registered add-ons may use their own external data sources; see each add-on's information page for its specific privacy details.

## Important

Every future complementary SakaLuX add-on intended for Hub management should be added to `scripts.json` and should keep its dedicated `greasyfork/*.md` information file synchronized with the current script version.

## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.
