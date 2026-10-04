from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[2]
REG=ROOT/'scripts.json'

data=json.loads(REG.read_text(encoding='utf-8'))
found=False
for item in data.get('scripts',[]):
    if item.get('id')=='bounty-hunter':
        found=True
        item['version']='0.2.0'
        item['description']='Full-board Torn bounty intelligence with API paging, Safe/Profit scoring, FF/BS hints, hospital countdown, alerts, watchlist and blacklist.'
        item['info']=(
            'Purpose\nBounty Hunter builds a compact target list from Torn bounties for TornPDA and desktop. It can use the visible board or Torn API v2 full-board paging when an API key is available.\n\n'
            'Full board\nUses /v2/torn/bounties with limit/offset paging, short caching and automatic fallback to DOM scanning if the API is unavailable. It prefers the shared SakaLuX Hub API key and supports a local fallback key.\n\n'
            'Target intelligence\nSafe and Profit modes support minimum reward, maximum level, status, hospital-release window, optional Max FF and Max BS filters. FF/BS values are read only when a compatible page helper has rendered them; unknown values stay unknown.\n\n'
            'Alerts\nShows hospital release countdowns and can alert for high-value or watched targets when they are Okay or close to hospital release. In-page toasts always work; system notifications are optional.\n\n'
            'Actions\nGroups duplicate bounties per player, totals rewards, provides direct Attack, watchlist and blacklist controls, persistent settings, auto-refresh and Hub integration.'
        )
        item['release']={
            'version':'0.2.0',
            'date':'2026-10-04',
            'notes':[
                'Adds Torn API v2 full-board bounty paging with caching and DOM fallback.',
                'Adds hospital countdown/release-window filtering plus compatible FF and BS hint detection.',
                'Adds high-value/watch target alerts, optional system notifications and API source diagnostics.'
            ]
        }
        item['detailsRevision']=int(item.get('detailsRevision',0) or 0)+1
        break
if not found:
    raise SystemExit('bounty-hunter entry not found')
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('updated bounty-hunter registry to v0.2.0')
