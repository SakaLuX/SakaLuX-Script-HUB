# 💬 SakaLuX Bazaar Thanker - PDA

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v5.3.21**

## What it does
- Detects Bazaar purchase events and groups purchases by buyer.
- Generates thank-you messages with customizable Bazaar name and message text.
- Includes buyer details, copy tools, big-buyer detection, statistics and history.
- Exposes its status to Script Hub on all Torn pages while working features remain limited to Events and Messages.
- Works without a Torn API key.

## Current release note
**v5.3.21** keeps the Bazaar Thanker panel above the shared standalone dock while settings remain accessible through Script Hub or the standalone dock without a separate floating launcher.

## Recommended
Install **SakaLuX Script Hub** to manage Bazaar Thanker with the other registered SakaLuX add-ons.

## Privacy
Bazaar Thanker reads the Torn Events/Messages page in the browser and stores settings, processed-event markers, generated-message state, statistics and history locally in browser/TornPDA storage. It does not require a Torn API key.

## Important
Generated thank-you text should be reviewed before sending. The script assists with preparing and organizing messages; the player remains responsible for the final message sent through Torn.

## License
**All Rights Reserved**

## Release history
### v5.3.21 — Panel layering and launcher cleanup
- Keeps the panel above the shared standalone dock.
- Preserves Settings access through Hub/shared dock without a separate floating launcher.

### v5.3.19 — Runtime version synchronization
- Synchronized `@version`, runtime version, standalone registration and Hub bridge version.
- Fixed the false UPDATE AVAILABLE state caused by an internal version mismatch.

### v5.3.18 — Hub detection fix
- Recognizes current Hub launchers/active marker and suppresses standalone prompts while Hub is installed.

### v5.3.14 — Compact native S standalone launcher
- Added the compact native S/shared standalone dock behavior.

### v5.3.10 — Violentmonkey Hub bridge
- Added isolated-context detection, OPEN and ON/OFF bridge support.

### v5.3.9 — Inline panel signature
- Moved the SakaLuX signature inside the module panel.

### v5.3.8 — Persistent SakaLuX signature
- Added the persistent linked author footer.

### v5.3.7 — Unified Control Center visual system
- Adopted the shared SakaLuX interface style.

### v5.3.6 — PC detection and message-price fix
- Added reliable installation detection, refreshed the Settings UI and corrected per-item price display in generated purchase messages.
