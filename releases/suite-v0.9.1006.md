# SakaLuX Suite v0.9.1006

Released: 2026-11-11

## Training Log — Torn Company CSV compatibility

- Import API reads two-value `working_stats_received` payloads like `50,25` as MAN +50, INT +25 (with omitted trailing END zero).
- Full Log also displays gains from old locally stored events after script upgrade; existing records do not need to be cleared.
- Three-value inputs remain supported. Invalid CSV is not assigned gains.

## Update

Install the current `SakaLuX-Suite.user.js` from the repository. In Torn PDA, reload Jobs and check Training Log > Full Log; select Import API if needed.

## Validation

Parser smoke checks: `50,25` and `50,25,0` both yield MAN +50 / INT +25; malformed input remains rejected. Live Torn PDA verification pending.
