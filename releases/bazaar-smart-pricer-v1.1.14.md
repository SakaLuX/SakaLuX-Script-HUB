# SakaLuX Bazaar Smart Pricer v1.1.14

Release date: **2026-09-20**

## 2-second per-item pacing
Manage Bazaar **Update All** now deliberately waits **2000 ms between completed items**. The v1.1.13 working arrow-opening flow is left intact; the new pause happens after the editor has been closed and settled, before the next row is acquired.

This makes large runs slower by design but gives Torn's React UI and TornPDA more time to finish row rerenders. It targets stalls like a run remaining on `Pricing 29/33`.

## Progress indicator
During each pause the chip displays `Waiting 2s · X/N`, then changes back to `Opening X/N` / `Pricing X/N` when the next item begins.

## Unchanged
- Original v1.1.13 Manage arrow targeting
- Price calculation / discount / markup logic
- Market reference data logic
- RW and bonus-item protection
- $1 listing protection
- Per-item manual pricing

## Validation
- `node --check SakaLuX-Bazaar-Smart-Pricer.user.js`
- `python3 -m json.tool scripts.json`
- version and 2000 ms pacing assertions
