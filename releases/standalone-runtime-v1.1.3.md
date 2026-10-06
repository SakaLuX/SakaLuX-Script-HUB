# Shared Standalone Dock Runtime v1.1.3 — Torn status-bar regression fix

The v1.1.2 launcher still inserted an additional list cell into Torn's native mobile status-icons list. TornPDA applies responsive visibility rules to that list, so the extra child could push/hide native status icons after Points/Merits/Refill.

v1.1.3 no longer changes the native list child count. The S launcher is a positioned overlay anchored near the cooldown area.

No module feature changes are included.
