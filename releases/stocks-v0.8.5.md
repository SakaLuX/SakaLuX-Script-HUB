# Stocks v0.8.5 — TornPDA panel recovery

Fixes the inline workspace not appearing while page/chat content updates continuously. Coalesces pending mounts without resetting their timers, skips hidden stock containers and relocates the workspace when Torn loads or replaces its stock list.

Existing settings, profiles, Benefit Lock and Dry Run behavior are preserved. Includes a full v0.8.4 backup, updated Hub registry, script description and changelog.

Validation: full userscript DOM regression reproduces the old failure and verifies busy-page mounting, hidden/delayed lists, replaced content and route navigation. JavaScript syntax passes. Actual TornPDA device visual confirmation remains pending.

Install the attached complete userscript and reload TornPDA. Greasy Fork requires separate synchronization; this release contains the corrected build.
