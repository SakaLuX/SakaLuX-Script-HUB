# SakaLuX Bazaar Smart Pricer v1.1.7

Release date: **2026-09-20**

## Root cause fixed
The large empty panel seen during Update All was Torn's item-details area. Our fallback could select the eye/details control when it could not identify the price accordion arrow.

## Fixes
- Never selects eye/view/details controls during Manage automation.
- Selects the far-right interactive row control as the price-editor chevron.
- Only collapses if that item's live row still contains the price editor.
- Uses native setter + InputEvent + keyup + change + blur so Torn/React registers edited prices more reliably.
