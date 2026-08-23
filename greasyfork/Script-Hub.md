# SakaLuX Script Hub

SakaLuX Script Hub is the main manager for the SakaLuX Torn script suite.

## Current version

**v1.8.1**

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
- Exposes `window.SakaLuXScriptHub` so complementary scripts can detect the Hub reliably.
- Designed for Torn PDA and Tampermonkey.

## Current release notes

### v1.8.1
- Fixed the **WHAT'S NEW** control so it remains visible on mobile/PDA.
- Reworked the top toolbar so update check, update all, system check, what's new and settings are all accessible.
- Removed Hub metadata and release notes from `scripts.json`.
- `scripts.json` now contains only complementary add-ons for automatic discovery.
- Hub release notes are now owned directly by the Script Hub instead of the add-on registry.

## SakaLuX suite

Complementary add-ons currently registered:
- SakaLuX Enhancer Guard v1.3.2
- SakaLuX Bazaar Thanker - PDA v5.3.1

Every new complementary SakaLuX script is added to `scripts.json` so the Hub can discover it automatically.
