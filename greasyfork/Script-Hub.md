# SakaLuX Script Hub

SakaLuX Script Hub is the main manager for the SakaLuX Torn script suite.

## Current version

**v1.8.3**

## What it does

- Automatically discovers active SakaLuX add-ons from the central `scripts.json` registry.
- `scripts.json` is dedicated only to complementary add-ons managed by the Hub.
- Detects installed and missing SakaLuX add-ons.
- Shows one-tap INSTALL actions for missing add-ons.
- Checks Greasy Fork for available updates.
- Provides **UPDATE ALL** for installed add-ons with newer versions available.
- Provides **SYSTEM CHECK** for registry access, Greasy Fork update sources and local add-on health.
- Provides a dedicated **WHAT'S NEW** view for Hub release notes.
- Provides quick actions, favorites, search, health status and backup/restore.
- Adds a native Torn-style **☠︎ HUB** navigation item immediately before **Messages**.
- Uses Torn's own navigation structure so the HUB launcher matches surrounding buttons in size, spacing and alignment.
- The monochrome skull performs a subtle double-blink animation while the **HUB** label stays fixed.
- The old floating circular Hub button automatically hides when the native navigation launcher is available and remains only as a fallback.
- Exposes `window.SakaLuXScriptHub` so complementary scripts can detect the Hub reliably.
- Designed for Torn PDA and Tampermonkey.

## Current release notes

### v1.8.3
- Rebuilt the launcher as a native Torn navigation item directly before Messages.
- Clones Torn's own menu structure rather than drawing a floating icon over the page.
- Uses a monochrome text-presentation skull (`☠︎`) plus **HUB** label.
- Blink animation affects only the skull icon.
- Floating circular launcher hides automatically when the native item is available.
- Existing Hub panel, updates, diagnostics, registry and add-on controls remain available.

### v1.8.2
- Added the first animated top-bar launcher experiment.
- Added issue/update badge support and a launcher visibility setting.
- Added Mission Rewards v1.0.1 to the offline fallback registry.

## SakaLuX suite

Complementary add-ons currently registered:
- SakaLuX Enhancer Guard v1.3.2
- SakaLuX Bazaar Thanker - PDA v5.3.1
- SakaLuX Mission Rewards v1.0.1

Every new complementary SakaLuX script is added to `scripts.json` so the Hub can discover it automatically.
