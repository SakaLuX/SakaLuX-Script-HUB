# ☠️ SakaLuX Script Hub

Core manager for the SakaLuX Torn script ecosystem.

## Current version

**v1.9.3**

## What it does

- Automatically discovers active SakaLuX add-ons from the central `scripts.json` registry.
- Detects installed, missing and outdated registered SakaLuX add-ons.
- Gives installed modules a clean native ON/OFF switch plus one OPEN or SETTINGS action.
- Provides **UPDATE ALL** for installed add-ons with newer versions available.
- Revalidates update status against the actually installed version to avoid stale alerts.
- Provides **SYSTEM CHECK** for registry access, update sources and module health.
- Provides **WHAT'S NEW**, category navigation, health information and backup / restore.
- Adds a Torn-native **HUB** mobile navigation entry with a floating fallback launcher.
- Exposes `window.SakaLuXScriptHub` for integration with registered complementary add-ons.
- Uses the common `setEnabled`, `toggleEnabled` and `isEnabled` integration API.
- Can securely store one shared Torn API key locally for registered add-ons that require Torn API access.
- Works with Torn PDA and Tampermonkey.

## Current release notes

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

- 🛡️ SakaLuX Enhancer Guard **v1.3.14**
- 💬 SakaLuX Bazaar Thanker - PDA **v5.3.6**
- 🎯 SakaLuX Mission Rewards **v1.0.4**
- 📈 SakaLuX Market Intelligence **v1.17.2**
- ⚔️ SakaLuX Elimination Assistant **v1.3.8**

## Privacy

- The shared Torn API key is stored locally in the userscript/browser environment.
- Hub does not publish the user's Torn API key to the public SakaLuX registry.
- Hub contacts the configured update/registry sources to check module metadata and current versions.
- Individual registered add-ons may use their own external data sources; see each add-on's information page for its specific privacy details.

## Important

Every future complementary SakaLuX add-on intended for Hub management should be added to `scripts.json` and should keep its dedicated `greasyfork/*.md` information file synchronized with the current script version.

## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.
