# 💬 SakaLuX Bazaar Thanker - PDA

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v5.3.29**

## What it does
- Detects Bazaar purchase events and groups purchases by buyer.
- Generates thank-you messages with customizable Bazaar name and message text.
- Includes buyer details, copy tools, big-buyer detection, statistics and history.
- Exposes its status to Script Hub on all Torn pages while working features remain limited to Events and Messages.
- Works without a Torn API key.

## Current release note

**v5.3.29** adds the shared top-to-bottom mobile sheet and translucent blur contract.

## Recommended
Install **SakaLuX Script Hub** to manage Bazaar Thanker with the other registered SakaLuX add-ons.

## Privacy
Bazaar Thanker reads the Torn Events/Messages page in the browser and stores settings, processed-event markers, generated-message state, statistics and history locally in browser/TornPDA storage. It does not require a Torn API key.

## Important
Generated thank-you text should be reviewed before sending. The script assists with preparing and organizing messages; the player remains responsible for the final message sent through Torn.

## License
**All Rights Reserved**

## Release history
### v5.3.29 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v5.3.28 — Mobile top alignment
- Opens the script panel from the top of the TornPDA viewport.
- Uses the shared SakaLuX top-alignment contract.

### v5.3.27 — PDA top-aligned panel refinement

- Opens the SakaLuX panel from the top of the available Torn viewport.
- Improves compact Hub integration and mobile visibility.

### v5.3.25 — Fixed profile link

- The visible seller attribution remains only `🙏`.
- `🙏` always links to `https://www.torn.com/profiles.php?XID=2380374`.
- The message link no longer depends on the configurable seller ID.

### v5.3.24 — Profile link cleanup

- Removes the visible `SakaLuX` username from thank-you messages.
- Keeps only a clickable `🙏` profile link.
- Preserves the configured seller profile destination.

### v5.3.23 — Shared Standalone ordering fix

- Uses the canonical SakaLuX standalone order including Company Intelligence.
- Unknown/new modules sort after known modules instead of before them.
- Keeps the mobile dock layout and Install SakaLuX Hub button readable.

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

## Changelog

### v5.3.26

- Performance/UI optimization: reduces repeated DOM work on Torn/TornPDA redraws and aligns standalone controls with the shared SakaLuX Hub-style UI foundation.

