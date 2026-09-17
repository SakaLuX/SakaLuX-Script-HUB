# Hub Test footer and isolation audit — 2026-09-17

Audited all 13 current userscripts (including experimental Stock Manager and Suite), plus the Price Network worker. Historical backups are retained.

Hub Test v1.9.65 preserves the working v1.9.64 separate donation and attribution rows. The overlay uses fixed inset:0 with auto height. The stretched panel uses auto height rather than 100dvh. Final root selectors have two IDs, so older CSS injected after asynchronous initialization cannot restore the shorter dvh geometry. The attribution remains 22px high with zero vertical padding.

Nine add-ons carried shared style/fullscreen rules whose broad sakalux ID selectors could also match Hub. Those selectors now explicitly exclude the Hub overlay, panel and all their descendants using zero-specificity :where exclusions. Disabled global title-based Mobile Surface scanners were removed. Native footer routines reject any module root nested inside Hub. Company sheet repair remains restricted to #ci-root (the fix introduced in v1.8.24).

No runtime footer or panel injection into Hub was found in Apocalypse Poker Exit Alert or experimental Stock Manager. Price Network is a server worker and does not modify the DOM.

Validation: JavaScript syntax and regression checks for metadata/runtime versions, Company root isolation, footer native-root guards, shared selector exclusions and stronger final geometry selectors. Live TornPDA rendering remains to be confirmed on the device.
