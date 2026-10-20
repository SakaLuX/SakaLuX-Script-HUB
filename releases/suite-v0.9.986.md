# SakaLuX Suite v0.9.986

Released: 2026-10-20

## Lottery Max Buy — native BUY integration

- Fixes the missing control on Torn's Lottery page, which exposes a `BUY` button instead of a ticket quantity input.
- Adds `MAX BUY · available tokens` immediately beside Torn's native button.
- Requires a confirmation before starting.
- Uses the native Torn purchase action one ticket at a time and waits for the displayed Casino Token count to decrease before continuing.
- Shows `STOP · remaining` while active and supports immediate user cancellation.
- Stops automatically if Torn does not confirm a purchase, displays another dialog or replaces the expected interface.
