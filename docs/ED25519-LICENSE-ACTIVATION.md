# SakaLuX Ed25519 license verification — activation checklist

Status: **prepared in PR, not enabled in production**.

1. Generate a 32-byte Ed25519 seed/key pair on a trusted admin machine using PHP sodium. Do not upload or commit secret keys.
2. Configure the existing backend environment variable `SAKALUX_ED25519_SECRET_KEY_B64` with the base64 of the **64-byte Ed25519 secret key** on the hosting PHP process.
3. Obtain the matching **32-byte public key** and pin its base64 value into `LICENSE_PUBLIC_KEY_B64` inside Script Hub. Never trust a public key fetched dynamically from the same untrusted license response.
4. Confirm PHP signing is configured via Admin > License Security, then verify the `signed_certificate` format on a real PRO response without disclosing the user's Torn API key.
5. Test signature rejection after tampering with payload or signature; subject mismatch, expiry, and incorrect entitlement claims. Verify that the target browsers support WebCrypto Ed25519.
6. Before requiring signatures, implement an explicit server-verified rollout mode. The current Hub still allows an unsigned PRO response for backwards compatibility while signing is not configured. This is **not yet certificate-enforced licensing**.
7. Server-side operations must always recheck the user's license. Signed certificates in editable browser scripts are not a substitute for server authorization.

Never expose secret key material or actual API keys in screenshots, tickets, or logs.
