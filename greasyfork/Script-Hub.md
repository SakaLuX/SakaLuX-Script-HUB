# SakaLuX Script Hub

SakaLuX Script Hub is the main manager for the SakaLuX Torn script suite.

## Current version

**v1.8.0**

## What it does

- Automatically discovers active SakaLuX add-ons from the central `scripts.json` registry.
- Detects installed and missing SakaLuX add-ons.
- Shows one-tap INSTALL actions for missing add-ons.
- Checks Greasy Fork for available updates.
- Provides **UPDATE ALL** for installed add-ons with newer versions available.
- Provides **SYSTEM CHECK** for registry access, Greasy Fork update sources and local add-on health.
- Shows **WHAT'S NEW** release notes directly inside the Hub.
- Provides quick actions, favorites, search, health status and backup/restore.
- Exposes `window.SakaLuXScriptHub` so complementary scripts can detect the Hub reliably.
- Designed for Torn PDA and Tampermonkey.

## Current release notes

### v1.8.0
- Added central `scripts.json` auto-discovery.
- Added WHAT'S NEW inside the Hub.
- Added UPDATE ALL.
- Added SYSTEM CHECK diagnostics.
- Added manual registry refresh.
- Added the global Script Hub API for reliable detection by complementary scripts.

## SakaLuX suite

Complementary add-ons currently registered:
- SakaLuX Enhancer Guard v1.3.2
- SakaLuX Bazaar Thanker - PDA v5.3.1

New SakaLuX scripts are added to `scripts.json` so the Hub can discover them automatically.
