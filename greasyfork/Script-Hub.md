# ☠️ SakaLuX Script Hub

> Core manager for the SakaLuX Torn script ecosystem.

## Current version
**v1.9.40**

## What it does
- Automatically discovers active SakaLuX add-ons from the central `scripts.json` registry.
- Detects installed, missing and outdated registered SakaLuX add-ons.
- Gives installed modules a native ON/OFF switch plus one OPEN or SETTINGS action.
- **CHECK** refreshes the live registry and verifies available updates.
- **UPDATE** refreshes the registry/update state before opening installers.
- Revalidates update status against the actually installed version to avoid stale alerts.
- Provides SYSTEM CHECK, WHAT'S NEW, category navigation, health information and backup/restore.
- Uses a TornPDA-first control-center layout with desktop userscript-manager support.
- Adds a Torn-native HUB mobile launcher with a fallback launcher when required.
- Exposes `window.SakaLuXScriptHub` for registered complementary add-ons.
- Supports the shared `setEnabled`, `toggleEnabled` and `isEnabled` integration API.
- Can store one shared Torn API key locally for compatible registered add-ons.
- Uses live module presence/bridges rather than stale installation markers for current status.

## Current release note

**v1.9.40** fixes installed-version detection in the Hub. The Hub now compares all live version signals (module bridge, API/health and standalone registration) and uses the newest valid version, so a stale runtime constant can no longer make an up-to-date script appear outdated. Runtime constants for Enhancer, Bazaar, Missions and Market are synchronized with their userscript headers.

## Recommended
Install Script Hub when using multiple registered SakaLuX add-ons. It provides one place for installation status, updates, module power control, shared API access and health diagnostics.

### Registered complementary add-ons
- 🛡️ SakaLuX Enhancer Guard **v1.3.33**
- 💬 SakaLuX Bazaar Thanker - PDA **v5.3.25**
- 🎯 SakaLuX Mission Rewards **v1.0.20**
- 📈 SakaLuX Market Intelligence **v1.17.21**
- ⚔️ SakaLuX Elimination Assistant **v1.3.31**
- 🏢 SakaLuX Company Intelligence **v1.8.17**

Account Auditor and SakaLuX Suite remain standalone tools and are intentionally not registered in `scripts.json`.

## Privacy
- The shared Torn API key is stored locally in the userscript/browser environment.
- Hub does not publish the user's Torn API key to the public registry.
- Hub contacts configured registry/update sources to check metadata and versions.
- Individual add-ons may use their own external data sources; see each add-on's information page.

## Important
- `scripts.json` is the canonical registry/minimum version source used by Hub.
- A **PUBLISHED / REGISTRY** mismatch means the configured public distribution source has not yet caught up with the registry; it does not automatically mean the installed script is broken.
- Market Intelligence is distributed through Greasy Fork, so a registry version newer than its Greasy Fork meta version legitimately appears as publish pending until that Greasy Fork release is published.
- Company Intelligence is currently registered at **v1.8.17** and uses Greasy Fork script **595873** for Hub public-version checks.
- Future complementary modules intended for Hub management must be added to `scripts.json` and keep their dedicated information page synchronized.

## License
**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding or publication of modified versions requires prior written permission.

## Release history
### v1.9.40 — Installed version reporting fix

- Uses the newest valid live version signal instead of trusting the first bridge value.
- Synchronizes runtime version constants with userscript headers.
- Updates the Hub offline fallback registry to current add-on versions.

### v1.9.39 — Reliable Hub presence handshake
- Marks Hub as installed/active immediately when the userscript starts.
- Prevents managed add-ons from showing the standalone dock while Hub is running.
- Established the Hub detection contract used by Company Intelligence and the other managed add-ons.
- Keeps Company Intelligence public update checks on Greasy Fork script 595873; the current registry entry is v1.8.14.

### v1.9.38 — Registry and distribution synchronization
- Built from the stable v1.9.37 baseline.
- Synchronized fallback registry versions with the live registry.
- Added Company Intelligence v1.8.12 to the Hub fallback registry and runtime integration.
- Updated Market Intelligence to v1.17.19 and Elimination Assistant to v1.3.31.
- Corrected Company Intelligence update metadata to use its GitHub distribution source.
- Improved pending-version labels to show the published and registry versions explicitly.
- Rotated Hub update/registry cache keys so old rollback-era cache data cannot mask the new registry.

### v1.9.37 — Stable registry/cache baseline
- Kept live module presence as the source of truth for installed status.
- Restored Mission Rewards v1.0.18 as the stable registered release.
- Rotated registry/update caches after rollback so stale cached versions no longer survive.

### v1.9.36 — Rollback cache invalidation
- Invalidated cached registry/update data after reverting experimental module versions.
- Preserved the stable module-presence detection model.

### v1.9.35 — Live installation status
- Removed ghost installation state derived from local installation markers.
- Installed status is based on current live module presence, bridge/API registration or standalone registration.

### v1.9.34 — Generic runtime compatibility
- Removed userscript-manager-specific compatibility handling.
- Kept generic runtime API and DOM bridge integration across supported managers.

### v1.9.33 — Panel stacking
- Corrected Hub panel stacking relative to the shared standalone dock.

### v1.9.32 — Hub panel runtime restoration
- Restored Hub panel runtime after the bridge-only launcher migration.

### v1.9.29–v1.9.31 — Managed launcher cleanup
- Removed managed add-on floating launchers while Hub is active.
- Managed modules are opened through Hub bridges/APIs instead of duplicate page buttons.

### v1.9.27–v1.9.28 — Published/registry version handling
- Distinguished published Greasy Fork version from registry version without creating an update loop.
- Added live bridge/API/standalone version detection and synchronized fallback data.

### v1.9.22–v1.9.26 — Standalone launcher and detection work
- Added the compact native S launcher/shared standalone dock behavior.
- Refined Hub install reminders and eliminated false standalone detection.

### v1.9.12 — Extensible shared languages
- English became the guaranteed standalone default.
- Added an extensible locale registry with bundled English/Romanian fallback.
- Language choices are generated from the locale registry.

### v1.9.11 — English and Romanian interfaces
- Added the persistent Language selector and shared localization across managed SakaLuX interfaces.

### v1.9.10 — Cross-context module detection
- Added hidden DOM bridges for isolated userscript contexts and corrected false OFF/INSTALL states.

### v1.9.5 — Update-control cleanup
- Converted Hub boolean settings to slide switches and consolidated registry/update controls into CHECK and UPDATE.

### v1.9.4 — Control Center redesign
- Rebuilt the Hub around the current premium TornPDA-first control-center layout.

### v1.9.1 — Canonical registry minimum
- Made `scripts.json` the canonical minimum version and invalidated update cache when registry versions change.

### v1.9.0 — Native module power control
- Introduced the current module-card ON/OFF model and shared Hub API-key management.
