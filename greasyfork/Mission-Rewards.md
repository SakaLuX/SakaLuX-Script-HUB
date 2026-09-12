# 🎯 SakaLuX Mission Rewards

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v1.0.10**

## What it does
- Enhances Torn's Mission Shop with practical reward information for PDA and Tampermonkey users.
- Shows estimated market value for item rewards.
- Calculates estimated value per mission credit.
- Shows currently owned special ammo.
- Tracks normal and special weapon mod credit ranges locally from offers seen on the device.
- Adds extra information directly to Mission Shop reward cards.
- Adds a detailed reward information panel.
- Includes refresh controls, local caching and API-key support.
- Exposes `window.SakaLuXMissionRewards` for integration with SakaLuX Script Hub on every Torn page.
- Keeps Mission-specific scanning inactive outside the Missions page.

## Current release note
Standalone mode now groups SakaLuX launch buttons in one shared dock when Script Hub is not installed. The Hub install reminder is shared by all scripts and can appear at most once every 12 hours, preventing stacked or repeated prompts.

## Recommended
Install **SakaLuX Script Hub** to manage Mission Rewards together with the rest of the SakaLuX add-ons and to use the shared Hub API key when available.

## License
All Rights Reserved

## Privacy
Mission Rewards stores settings, catalogue cache, ammo cache and learned weapon-mod ranges locally in browser/TornPDA storage. Its Torn API requests are sent to `api.torn.com` and use the active API key only for the data required by the module. The script requests no Torn API write permissions.

## Important
Displayed market values and value-per-credit calculations are estimates based on available item data. Weapon-mod ranges are learned locally from offers seen by the script and should be treated as guidance rather than guaranteed future Mission Shop prices.

## Release history
### v1.0.8 — Violentmonkey Hub bridge

- Added an isolated-context DOM bridge so Script Hub can detect, open and switch Mission Rewards ON/OFF in Violentmonkey.

### v1.0.7 — Inline panel signature

- Removed the floating author badge from the Torn page.
- **Made with ❤️ by SakaLuX [2380374]** now lives inside the script panel as its final footer, with the author name and ID linked to the Torn profile.

### v1.0.6 — Persistent SakaLuX signature

- Added the persistent **Made with ❤️ by SakaLuX [2380374]** author footer with the author name and Torn ID linked to the profile.
- Keeps the SakaLuX identity visible consistently across TornPDA and desktop.

### v1.0.5

- Adopted the unified **SakaLuX Control Center** visual system used by Script Hub.
- Standardized panels, cards, buttons, inputs, borders, spacing and compatible settings toggles for a more consistent TornPDA/desktop experience.
- UI-only release: existing features, APIs and saved data remain unchanged.

### v1.0.4

- Added a persistent installation marker for reliable Script Hub detection on PC.
- Added persistent `setEnabled`, `toggleEnabled` and `isEnabled` Hub power controls.
- OFF disconnects Mission Shop scanning and removes injected badges/panels; ON restores them without a page reload.
- Automatically uses the shared Hub key when available.
- Standalone mode includes a creator for the required Ammo + Torn Items API key.
