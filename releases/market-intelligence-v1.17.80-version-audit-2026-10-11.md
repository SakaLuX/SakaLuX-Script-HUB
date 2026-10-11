# Market Intelligence v1.17.80 — Best Route startup recovery

Date: 2026-10-11

- Keeps the Travel Agency Best Route Basket initialization retry active while the page remains open and the module enabled.
- Recovers when licensing finishes or a scan was previously occupied, without requiring the Hub interface to open.
- Stops its polling and entitlement listener when the module is disabled.
- JavaScript syntax parsed successfully.

Repository release note only. GreasyFork publishing and TornPDA runtime behavior not yet independently confirmed.
