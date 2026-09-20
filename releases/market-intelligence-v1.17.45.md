# SakaLuX Market Intelligence v1.17.45

Release date: **2026-09-20**

## Strict Manage Bazaar isolation
Market Intelligence now treats **Manage your Bazaar / Manage items** as a hard exclusion zone. `scanItems()` and `scanBazaar()` return before any scanning or DOM injection, and existing MI inline Bazaar badges/board are purged when Manage is detected. No MI estimate badge, board or inline decoration is allowed inside the Manage list.
