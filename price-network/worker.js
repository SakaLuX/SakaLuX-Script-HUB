const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': status === 200 ? 'public, max-age=60' : 'no-store',
    ...extra,
  },
});

const clampInt = (v, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i >= min && i <= max ? i : null;
};

const sourceOk = (v) => ['itemmarket', 'bazaar', 'travel'].includes(String(v || ''));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' } });

    if (url.pathname === '/v1/health' && request.method === 'GET') {
      return json({ ok: true, service: 'SakaLuX Price Network', version: 1 });
    }

    if (url.pathname === '/v1/observe' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
      const rows = Array.isArray(body?.observations) ? body.observations.slice(0, 50) : [];
      if (!rows.length) return json({ ok: false, error: 'no_observations' }, 400);

      const now = Date.now();
      const clean = [];
      for (const r of rows) {
        const itemId = clampInt(r?.itemId, 1, 1000000);
        const price = clampInt(r?.price, 1, 2000000000000);
        const observedAt = clampInt(r?.observedAt ?? now, now - 6 * 3600000, now + 5 * 60000);
        const source = String(r?.source || 'itemmarket');
        if (!itemId || !price || !observedAt || !sourceOk(source)) continue;
        clean.push({ itemId, price, observedAt, source });
      }
      if (!clean.length) return json({ ok: false, error: 'no_valid_observations' }, 400);

      const statements = clean.map(r => env.DB.prepare(
        'INSERT INTO observations (item_id, price, observed_at, source, received_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(r.itemId, r.price, r.observedAt, r.source, now));
      await env.DB.batch(statements);
      return json({ ok: true, accepted: clean.length });
    }

    const m = url.pathname.match(/^\/v1\/items\/(\d+)$/);
    if (m && request.method === 'GET') {
      const itemId = clampInt(m[1], 1, 1000000);
      if (!itemId) return json({ ok: false, error: 'invalid_item' }, 400);
      const since = Date.now() - 6 * 3600000;
      const result = await env.DB.prepare(
        `SELECT price, observed_at FROM observations
         WHERE item_id = ? AND observed_at >= ?
         ORDER BY observed_at DESC LIMIT 500`
      ).bind(itemId, since).all();
      const rows = result?.results || [];
      if (!rows.length) return json({ ok: true, itemId, samples: 0, consensus: null });
      const prices = rows.map(r => Number(r.price)).filter(Number.isFinite).sort((a,b)=>a-b);
      const q = p => prices[Math.min(prices.length - 1, Math.max(0, Math.floor((prices.length - 1) * p)))];
      const median = q(0.5);
      const p25 = q(0.25), p75 = q(0.75);
      const filtered = prices.filter(v => v >= p25 * 0.5 && v <= p75 * 1.5);
      const use = filtered.length >= Math.max(3, Math.floor(prices.length * 0.5)) ? filtered : prices;
      const mid = use[Math.floor(use.length / 2)];
      return json({
        ok: true,
        itemId,
        samples: prices.length,
        consensus: {
          median: mid,
          low: use[0],
          high: use[use.length - 1],
          p25,
          p75,
          latestAt: Math.max(...rows.map(r => Number(r.observed_at) || 0)),
        }
      });
    }

    return json({ ok: false, error: 'not_found' }, 404);
  }
};
