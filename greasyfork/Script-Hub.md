# SakaLuX Script Hub

SakaLuX Script Hub is the main manager for the SakaLuX Torn script suite.

## Current version

**v1.8.5**

## What it does

- Automatically discovers active SakaLuX add-ons from the central `scripts.json` registry.
- `scripts.json` is dedicated only to complementary add-ons managed by the Hub.
- Detects installed and missing SakaLuX add-ons.
- Shows one-tap INSTALL actions for missing add-ons.
- Checks Greasy Fork for available updates.
- Provides **UPDATE ALL** for installed add-ons with newer versions available.
- Revalidates cached update status against the version currently installed, preventing stale false update alerts after an add-on has already been updated.
- Provides **SYSTEM CHECK** for registry access, Greasy Fork update sources and local add-on health.
- Provides a dedicated **WHAT'S NEW** view for Hub release notes.
- Provides quick actions, favorites, search, health status and backup/restore.
- Adds a Torn-native **skull HUB** mobile navigation entry immediately before **Messages**.
- Reuses Torn's own `mobileLink`, area row, swiper slide, SVG sizing and label classes so the HUB entry matches surrounding navigation buttons.
- Only the skull artwork and subtle blink are custom; size, spacing, typography and theme colors come from Torn.
- The floating circular Hub button automatically hides when the native navigation entry is available and remains only as a fallback.
- Exposes `window.SakaLuXScriptHub` so complementary scripts can detect the Hub reliably.
- Designed for Torn PDA and Tampermonkey.

## Current release notes

### v1.8.5
- Fixed false **UPDATE AVAILABLE** indicators after an add-on has already been updated.
- A cached update result is reused only when its stored installed version still equals the version currently loaded.
- **Latest vs Installed** is recalculated before rendering cards, the UPDATES counter and the native HUB alert badge.
- Added Market Intelligence v1.1.1 to the offline fallback registry.
- Added the Market Intelligence ready-event integration.

### v1.8.4
- Fixed the mobile layout where HUB appeared above Messages and pushed Messages onto a second row.
- HUB is now mounted as its own Torn swiper/navigation entry directly before Messages.
- Reuses a native Torn SVG element and icon wrappers for exact sizing and alignment.
- The **HUB** label inherits Torn's own typography and spacing.
- Removed custom launcher dimensions that made the previous version look detached from Torn.
- Blink animation now changes only skull opacity, keeping the whole navigation row stable.

### v1.8.3
- Introduced the first Torn-style navigation version of the HUB launcher.
- Added the monochrome skull plus HUB label and floating-button fallback behavior.

## SakaLuX suite

Complementary add-ons currently registered:
- SakaLuX Enhancer Guard v1.3.2
- SakaLuX Bazaar Thanker - PDA v5.3.1
- SakaLuX Mission Rewards v1.0.1
- SakaLuX Market Intelligence v1.1.1

Every new complementary SakaLuX script is added to `scripts.json` so the Hub can discover it automatically.
