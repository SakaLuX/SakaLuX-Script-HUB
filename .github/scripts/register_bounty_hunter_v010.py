from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[2]
REG=ROOT/'scripts.json'
data=json.loads(REG.read_text(encoding='utf-8'))
entry={
  'active': True,
  'apiGlobal': 'SakaLuXBountyHunter',
  'buttonSelector': '#slx-bh-btn',
  'category': 'Combat',
  'description': 'Mobile-first Torn bounty scanner with Safe/Profit modes, grouped rewards, watchlist, blacklist and direct attack links.',
  'icon': '🎯',
  'id': 'bounty-hunter',
  'info': 'Purpose\nBounty Hunter scans the bounty rows already loaded by Torn and builds a compact hunt list for TornPDA and desktop.\n\nModes\nSafe mode prioritizes currently available targets. Profit mode prioritizes reward value while still weighting availability.\n\nFilters and actions\nIncludes minimum reward, maximum level, status filters, grouped rewards per player, direct Attack, watchlist and blacklist. Settings are stored locally.\n\nCurrent scope\nv0.1.0 is a DOM scanner and does not require a Torn API key. Full-board API paging and optional FF/BS estimation are planned for later versions.',
  'name': 'Bounty Hunter',
  'quickActions': [
    {'icon':'🎯','id':'open','label':'OPEN','method':'open','fallbackUrl':'https://www.torn.com/bounties.php'},
    {'icon':'🔄','id':'refresh','label':'REFRESH','method':'refresh','fallbackUrl':'https://www.torn.com/bounties.php'},
    {'icon':'📰','id':'bounties','label':'BOUNTIES','method':'goToBounties','fallbackUrl':'https://www.torn.com/bounties.php'}
  ],
  'release': {'version':'0.1.0','date':'2026-10-04','notes':['Initial SakaLuX bounty hunting module.','Adds Safe / Profit modes with reward, level and status filters.','Adds grouped bounty totals, direct attacks, watchlist, blacklist and Hub integration.']},
  'sourceUrl':'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bounty-Hunter.user.js',
  'downloadUrl':'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bounty-Hunter.user.js',
  'updateUrl':'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bounty-Hunter.user.js',
  'documentationUrl':'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Bounty-Hunter.md',
  'type':'addon','version':'0.1.0','detailsRevision':1,'license':'All Rights Reserved'
}
scripts=data.setdefault('scripts',[])
for i,x in enumerate(scripts):
    if x.get('id')=='bounty-hunter': scripts[i]=entry; break
else:
    # Keep Combat-ish tools together if possible, otherwise append.
    pos=next((i for i,x in enumerate(scripts) if x.get('category')=='Combat'),len(scripts))
    scripts.insert(pos,entry)
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('registered Bounty Hunter v0.1.0')
