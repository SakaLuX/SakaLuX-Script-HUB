# 💬 SakaLuX Bazaar Thanker - PDA

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
5.3.18

## What it does
- Detects Bazaar purchase events and groups purchases by buyer.
- Generates thank-you messages with customizable Bazaar name and message text.
- Includes buyer details, copy tools, big-buyer detection, statistics and history.
- Exposes its status to SakaLuX Script Hub on all Torn pages while its working features remain limited to Events and Messages.
- Works without a Torn API key.

## Current release note

Made the S badge inside the standalone dock a real close control. Tapping the header S now closes the panel immediately while the native Torn S launcher continues to toggle the dock. Added button semantics, touch feedback and accessibility labels without changing the ultra-professional dock layout.

## Recommended
Install **SakaLuX Script Hub** to manage Bazaar Thanker together with the rest of the SakaLuX add-ons.

## License
All Rights Reserved

## Privacy
Bazaar Thanker reads the Torn Events/Messages page in the browser and stores its settings, processed-event markers, generated-message state, statistics and history locally in browser/TornPDA storage. It does not require a Torn API key.

## Important
Generated thank-you text should be reviewed before sending. The script assists with preparing and organizing messages; the player remains responsible for the final message sent through Torn.

## Release history
### v5.3.14 — Compact native S standalone launcher

- Smaller professional standalone dock.
- Native gold **S** launcher mounts after Torn cash and opens/closes the dock.
- Removed the dock **+** control.
- Compact fallback **S** appears only when Torn status icons are unavailable.
- Shared Hub reminder remains limited to once every 12 hours.

### v5.3.10 — Violentmonkey Hub bridge

- Added an isolated-context DOM bridge so Script Hub can detect, open and switch Bazaar Thanker ON/OFF in Violentmonkey.

### v5.3.9 — Inline panel signature

- Removed the floating author badge from the Torn page.
- **Made with ❤️ by SakaLuX [2380374]** now lives inside the script panel as its final footer, with the author name and ID linked to the Torn profile.

### v5.3.8 — Persistent SakaLuX signature

- Added the persistent **Made with ❤️ by SakaLuX [2380374]** author footer with the author name and Torn ID linked to the profile.
- Keeps the SakaLuX identity visible consistently across TornPDA and desktop.

### v5.3.7

- Adopted the unified **SakaLuX Control Center** visual system used by Script Hub.
- Standardized panels, cards, buttons, inputs, borders, spacing and compatible settings toggles for a more consistent TornPDA/desktop experience.
- UI-only release: existing features, APIs and saved data remain unchanged.

### v5.3.6

- Added a persistent installation marker for reliable Script Hub detection on PC.
- Refreshed the Settings panel and floating Settings button with a cleaner professional TornPDA-style UI.
- Fixed purchase messages to show the per-item price instead of the full batch total.
