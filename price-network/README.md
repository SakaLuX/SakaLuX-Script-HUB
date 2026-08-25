# SakaLuX Price Network

Phase 1 backend foundation for anonymous shared price observations used by SakaLuX Market Intelligence.

## Privacy contract

The client must only send:

- `itemId`
- observed `price`
- `observedAt` timestamp
- observation `source` (`itemmarket`, `bazaar`, or `travel`)

It must **never** send Torn ID, username, API key, bazaar owner, device ID, persistent client ID, cookies, or account data.

## API

### `GET /v1/health`
Returns service status.

### `POST /v1/observe`
Body:

```json
{
  "observations": [
    {"itemId": 206, "price": 820000, "observedAt": 1787640000000, "source": "itemmarket"}
  ]
}
```

Maximum 50 observations per request. Invalid or implausible values are dropped.

### `GET /v1/items/:itemId`
Returns a rolling six-hour consensus from up to 500 observations with median, low/high, quartiles and sample count.

## Cloudflare deployment

1. Create a D1 database.
2. Apply `schema.sql`.
3. Deploy `worker.js` as a Worker with a D1 binding named `DB`.
4. Add the deployed Worker URL to Market Intelligence.
5. Keep contribution opt-in in the client until the privacy UI is accepted by the user.

## Next client phase

Market Intelligence will add:

- opt-in `SakaLuX Price Network` setting;
- local observation queue with rate limiting and batching;
- anonymous upload of observed market prices;
- network consensus shown as a secondary reference, never silently replacing Torn's own price data;
- health counters for queued/sent/network samples;
- automatic fallback to local/Torn data when the network is unavailable.
