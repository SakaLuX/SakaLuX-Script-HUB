# Shared Standalone Dock Runtime v1.1.2 — batch maintenance release

This release exists to distribute the repaired embedded Standalone Dock Runtime to already-installed userscripts.

Every standalone SakaLuX userscript carries an embedded runtime copy. Updating only the shared source file in GitHub cannot change copies already installed in TornPDA/Tampermonkey, so each userscript receives a patch-version maintenance release.

## Versions
- Enhancer Guard 1.3.55
- Account Auditor 1.3.26
- Mission Rewards 1.0.48
- Bazaar Thanker 5.3.46
- Bazaar Smart Pricer 1.1.15
- Elimination Assistant 1.3.49
- Market Intelligence 1.17.59
- Stock Manager & Advisor 0.8.17
- Company Intelligence 1.8.55
- Bounty Hunter 0.5.5

## Runtime change only
No module feature behavior is intentionally changed. Each release embeds Shared Standalone Dock Runtime v1.1.2 so the installed scripts can converge on one singleton Standalone Dock.

Script Hub is not part of this batch and its version is unchanged.
