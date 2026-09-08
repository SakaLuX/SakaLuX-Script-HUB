# SakaLuX Elimination Assistant

**Current version:** v1.2.8  
**Greasy Fork:** 594921  
**Category:** Combat / Eliminations

## v1.2.8

- Treats Torn API **32** on `eliminationteam` as a temporary endpoint-unavailable state instead of a bad API key.
- `TEST TORN KEY` now reports `eliminationteam: UNAVAILABLE (API 32) — key not rejected`.
- Loading a team that returns API 32 now shows a clear message telling the user the event endpoint is currently unavailable.
- Improved Hub power behavior: when Elimination Assistant is **OFF**, every other action in its Hub card is hidden and only the red **OFF** button remains.
- When switched back **ON**, the button turns green and OPEN / REFRESH / FF SCAN / CALIBRATE / TEST KEY / API KEY / ELIMS reappear.
- The OFF state remains persistent and the userscript stays installed so Hub can re-enable it.

## v1.2.7

- Fixed a Torn PDA / Hub lock introduced by v1.2.6.
- Removed the global `MutationObserver` used for the Hub power button. It could retrigger itself while changing the button and make the Hub stop opening.
- Replaced it with a lightweight guarded sync that does not observe or rewrite the Torn DOM continuously.
- Hub power state is explicit: **ON = green**, **OFF = red**.
- API key creation is single-navigation only, preventing the duplicate key-creator action seen in Torn PDA.
- Kept `TEST TORN KEY` to identify whether `battlestats`, `elimination`, or `eliminationteam` is the endpoint returning an API error.

## Core features

- Eliminations team/target scanner.
- SAFE / RISKY / SKIP target signal.
- Smart Target Score.
- Optional FFScouter FF and target BS estimates.
- Personal battle-stat calibration or manual BS fallback.
- WIN / LOSS target learning.
- Torn PDA support.
- Shared once-per-24h SakaLuX Hub installation reminder.

## API keys

The Torn API key is separate from the optional FFScouter API key. Use **TEST TORN KEY** to test `battlestats`, `elimination`, and `eliminationteam` independently.

API 16 is treated as an access/permission problem. API 32 on `eliminationteam` is displayed as endpoint unavailable and does not mark the key itself as rejected.

The key helper opens Torn's key creator once. After creating the key, copy it into the Torn API key field and run **TEST TORN KEY** before loading a team.

## Important

FFScouter battle stats are estimates and Smart Target Score is advisory only. The userscript never attacks automatically.