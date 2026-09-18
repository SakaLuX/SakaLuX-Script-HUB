Market v1.17.40 coalesces overlapping per-item market requests and equipment lookups by active API key. Forced refresh bypasses settled cache while sharing an already active request. Pending lookups clear on success and rejection.

Validation: real-browser read-only loadout comparator burst, slow/offline/429/malformed/recovery modes with synthetic data and fake key. Initial 20-call burst reproduced 40 requests; results include the measured post-fix request count. Complete previous source is backed up.
