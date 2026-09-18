Stocks v0.8.7 shares an active API synchronization across overlapping refreshes. A burst of twenty calls uses three requests instead of sixty (95% fewer). Failure clears the pending operation so a later refresh can recover.

Validation executes the actual API parsing/synchronization functions against slow, offline, HTTP 429, malformed JSON and successful synthetic responses. Checks verify twenty successful callers, cash and catalogue data after recovery. Trading controls and stored settings are preserved. Complete previous source is backed up.
