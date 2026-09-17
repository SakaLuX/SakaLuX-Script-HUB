# SakaLuX Suite v0.9.925 — Master Control height near chat

Master Control now uses explicit viewport heights to extend to 36px above the bottom edge, matching Elimination's chat clearance. This also applies to TornPDA touch layouts with desktop-width viewports up to 1100 CSS pixels.

## Changes

- Bounds both the outer shell and Suite window to the viewport instead of relying on percentage heights inside an automatically sized container.
- Keeps module scrolling inside the middle content area, with a fixed 50px donation/author footer at the bottom of the window.
- Removes the mobile rule that forced the panel to display independently of its open class.
- Updates the userscript header and internal version to 0.9.925.
- Includes the complete v0.9.924 backup and updated script description/changelog.

## Installation

Install or replace the existing Suite script with `SakaLuX-Suite-v0.9.925.user.js`, then reload TornPDA/Torn. Existing module settings and stored data are preserved.

## Validation

- `node --check SakaLuX-Suite.user.js` passed locally.
- GitHub release workflow repeats syntax and version checks before publishing.
- Local browser layout verification could not run because the browser download timed out. Actual TornPDA device confirmation remains pending.

Suite remains experimental. This release updates Suite only.
