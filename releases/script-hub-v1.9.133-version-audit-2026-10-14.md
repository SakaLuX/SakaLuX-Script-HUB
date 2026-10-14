# Script Hub v1.9.133

- Shared PRO verification automatically retries after a failed startup request even if the Hub panel is never opened.
- Exponential backoff from 30 seconds to five minutes, with a longer pause for rate-limited responses.
- Successful validation clears retry state and broadcasts the shared PRO status to modules.

GitHub source note only; GreasyFork publishing and TornPDA testing remain unconfirmed.
