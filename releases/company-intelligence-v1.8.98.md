# SakaLuX Company Intelligence v1.8.98

Released: 2026-11-11

## Training history — Torn Company CSV compatibility

- Import recognizes `working_stats_received` with two values, alongside the previous three-value encoding.
- Two-value records are labelled only using a verified prior training record for the same employee, same ordered amounts, within 14 days; otherwise they remain unlabelled.
- Existing imported log entries can be enriched by reimporting. No deletion required.

## Update

The canonical GitHub source declares v1.8.98. Greasy Fork publishing requires syncing the uploaded userscript separately; repository changes alone do not publish to Greasy Fork.

## Validation

Source parser confirmed and GitHub revision updated. Live Torn PDA verification pending.
