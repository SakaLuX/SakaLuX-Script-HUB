# SakaLuX Script Hub

SakaLuX Script Hub is the main manager for the SakaLuX Torn script suite.

## Current version

**v1.8.2**

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
- Adds an animated **☠️ launcher before Messages** in Torn's top navigation.
- The top-bar skull opens the full Hub and shows the same update/issue count as the floating Hub button.
- Exposes `window.SakaLuXScriptHub` so complementary scripts can detect the Hub reliably.
- Designed for Torn PDA and Tampermonkey.

## Current release notes

### v1.8.2
- Added a blinking/pulsing **☠️ SakaLuX launcher** in Torn's top bar before Messages.
- Tapping the skull opens SakaLuX Script Hub directly.
- Added a faster alert blink plus numeric badge when updates, missing add-ons or errors are detected.
- Added a setting to enable or disable the top-bar skull.
- Added the top-bar launcher to **SYSTEM CHECK**.
- Added Mission Rewards v1.0.1 to the offline fallback registry.
- Hub now listens for `SakaLuX:MissionRewardsReady` and refreshes its status immediately.

## SakaLuX suite

Complementary add-ons currently registered:
- SakaLuX Enhancer Guard v1.3.2
- SakaLuX Bazaar Thanker - PDA v5.3.1
- SakaLuX Mission Rewards v1.0.1

Every new complementary SakaLuX script is added to `scripts.json` so the Hub can discover it automatically.
