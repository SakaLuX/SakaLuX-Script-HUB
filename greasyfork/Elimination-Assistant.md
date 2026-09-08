# SakaLuX Elimination Assistant

**Current version:** v1.2.7  
**Greasy Fork:** 594921  
**Category:** Combat / Eliminations

## v1.2.7

- Fixed a Torn PDA / Hub lock introduced by v1.2.6.
- Removed the global `MutationObserver` used for the Hub power button. It could retrigger itself while changing the button and make the Hub stop opening.
- Replaced it with a lightweight guarded sync that does not observe or rewrite the Torn DOM continuously.
- Hub power state is now explicit: **ON = green**, **OFF = red**.
- OFF remains persistent in `slx_elim_enabled` and removes the Elimination UI without uninstalling the script.
- The script API remains loaded while OFF so SakaLuX Script Hub can turn it back ON.
- API key creation is single-navigation only, preventing the duplicate key-creator action seen in Torn PDA.
- Kept `TEST TORN KEY` to identify whether `battlestats`, `elimination`, or `eliminationteam` is the endpoint returning API error 16.

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

The Torn API key is separate from the optional FFScouter API key. If Torn reports `Access level of this key is not high enough`, open Settings and run **TEST TORN KEY**. The result shows which API selection is actually failing instead of treating every API 16 as the same problem.

The key helper opens Torn's key creator once. After creating the key, copy it into the Torn API key field and run **TEST TORN KEY** before loading a team.

## Important

FFScouter battle stats are estimates and Smart Target Score is advisory only. The userscript never attacks automatically.