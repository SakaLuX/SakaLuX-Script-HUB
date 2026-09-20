# SakaLuX Enhancer Guard v1.3.49

Release date: **2026-09-20**

## Manage Bazaar accordion isolation
Enhancer Guard previously reused its protected-sale row hiding logic on Bazaar DOM that can also exist while managing existing listings. On TornPDA, applying `display:none` inside Torn's accordion-managed list can leave the parent container with a stale measured height after several rows are opened/closed, creating the large blank area seen in Manage your Bazaar.

## Fix
- Detects **Manage your Bazaar / Manage items** explicitly.
- `hideProtectedSaleRows()` exits without touching native Manage rows.
- Protected-item hiding and blocking remain enabled on real Add Listing / sale-selection pages.
- No changes to inventory tracking, lock badges, partial protection or API behavior.
