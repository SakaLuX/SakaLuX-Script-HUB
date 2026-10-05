from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
REG = ROOT / 'scripts.json'

data = json.loads(REG.read_text(encoding='utf-8'))
found = False
for item in data.get('scripts', []):
    if item.get('id') == 'bounty-hunter':
        found = True
        item['version'] = '0.2.2'
        item['description'] = 'Mobile-first Torn bounty intelligence with full-board API paging, live target enrichment, FF/BS hints, hospital countdowns, alerts, Safe/Profit modes, watchlist and blacklist.'
        item['info'] = (
            'Purpose\nBounty Hunter builds a compact hunt list from Torn bounties for TornPDA and desktop. '
            'It can use the full Torn API v2 bounty board or fall back to the currently loaded DOM.\n\n'
            'Target intelligence\nSupports live /user/{id}/basic enrichment for top candidates, hospital countdowns, '
            'FF/BS hints from compatible rendered helpers, grouped bounty totals, watchlist and blacklist.\n\n'
            'Filters and sorting\nIncludes Safe/Profit modes, reward and level limits, Max FF/BS, hospital-window filtering, '
            'search by player/ID, Watch-only mode, and Smart/Reward/Hospital/FF/BS sorting.\n\n'
            'API\nUses the shared Script Hub Torn API key first, with a local fallback key. API calls use short caches '
            'and fall back to DOM scanning when unavailable.'
        )
        item['release'] = {
            'version': '0.2.2',
            'date': '2026-10-05',
            'notes': [
                'Adds live user/basic enrichment for the highest-priority bounty targets.',
                'Adds player/ID search, multiple sort modes, Auto/API/DOM source selection and Watch-only filtering.',
                'Adds live hospital countdown updates, direct profile actions and expanded API/source diagnostics.',
                'Synchronizes userscript header, runtime version, changelog and Hub registry to v0.2.2.'
            ]
        }
        item['detailsRevision'] = int(item.get('detailsRevision', 0) or 0) + 1
        break

if not found:
    raise SystemExit('bounty-hunter registry entry not found')

REG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('updated bounty-hunter registry to v0.2.2')
