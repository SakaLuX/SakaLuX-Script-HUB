# SakaLuX Suite v0.9.1008

Released: 2026-11-11

## Company Training Log — position-aware gains

- Corrects the false assumption that two values always represent MAN/INT. Torn employee trains increase the primary and secondary work stats for the position.
- Fetches current position via Torn API and its position requirements via the company catalogue. Current role is shown as advisory for historical records, not silently applied to the past.
- Older mislabelled events are repaired on reimport without deletion.
- Historical entries without position evidence show PRIMARY and SECONDARY amounts; a confirmation button permits using the current position when the user knows it was the same at that date.
- Adds a regression test.

Live Torn PDA verification pending.
