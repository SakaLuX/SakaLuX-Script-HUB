# Bazaar-Thanker v5.3.40 — Performance update

- Uses constant-time Hub detection instead of document-wide marker searches on every mutation.
- Avoids rebuilding unchanged standalone dock entries and ignores unrelated chat changes.
- Preserves buyer grouping, cooldown and message preparation.

Includes complete userscript, description/changelog, regression checks and previous-version backup in the performance bundle. Settings are preserved. Synthetic measurements do not represent actual TornPDA FPS.
