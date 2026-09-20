# SakaLuX Bazaar Smart Pricer v1.1.10

Release date: **2026-09-20**

## TornPDA Manage arrow fix
The far-right edit arrow is not always contained inside Torn's inner item node on PDA. Previous versions therefore found the eye/details button instead.

v1.1.10 identifies the compact visual row, probes its extreme-right edge with `elementFromPoint`, and only accepts a clickable control in the final 12% of the row width. The eye icon is explicitly excluded.
