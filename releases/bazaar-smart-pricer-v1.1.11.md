# SakaLuX Bazaar Smart Pricer v1.1.11

Release date: **2026-09-20**

## TornPDA strict edit-arrow targeting
The previous geometry still used the inner item node right boundary, which can end around Torn's eye/details column. v1.1.11 instead anchors to the full **Manage your Bazaar** panel boundary.

- Uses the item's vertical center only.
- Uses the Manage panel's real right edge for horizontal targeting.
- Accepts only interactive controls centered within the last 58px of that panel.
- Explicitly rejects eye/view/details controls as an additional guard.
