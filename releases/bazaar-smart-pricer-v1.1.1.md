# SakaLuX Bazaar Smart Pricer v1.1.1

Release date: **2026-09-20**

- Removed the GitHub header link.
- Added API Access beside Close with automatic SakaLuX Hub shared-key selection and local fallback.
- Tightened bonus detection so ordinary armor such as Construction Helmet / Leather Gloves is not skipped.
- Update All now expands collapsed Manage Bazaar rows one at a time, updates the price, collapses the row, and leaves **SAVE CHANGES** to the user.

Validation: `node --check` + `python3 -m json.tool scripts.json`.
