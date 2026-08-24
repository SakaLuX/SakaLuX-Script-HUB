from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'

def repl(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing anchor: {label}')
    return text.replace(old,new,1)

s=SRC.read_text(encoding='utf-8')
s=repl(s,'// @version      1.15.1','// @version      1.15.2','metadata version')
s=repl(s,"const VERSION = '1.15.1';","const VERSION = '1.15.2';",'runtime version')

old_labels="""    const TORN_TRAVEL_LABELS = {\n        Mexico: ['Mexico'],\n        Caymans: ['Cayman Islands', 'Caymans'],\n        Canada: ['Canada'],\n        Hawaii: ['Hawaii'],\n        UK: ['United Kingdom', 'UK'],\n        Argentina: ['Argentina'],\n        Switzerland: ['Switzerland'],\n        Japan: ['Japan'],\n        China: ['China'],\n        UAE: ['UAE', 'United Arab Emirates'],\n        'South Africa': ['South Africa']\n    };"""
new_labels="""    const TORN_TRAVEL_LABELS = {\n        Mexico: ['Mexico', 'Ciudad Juarez'],\n        Caymans: ['Cayman Islands', 'Caymans', 'George Town'],\n        Canada: ['Canada', 'Toronto'],\n        Hawaii: ['Hawaii', 'Honolulu'],\n        UK: ['United Kingdom', 'UK', 'London'],\n        Argentina: ['Argentina', 'Buenos Aires'],\n        Switzerland: ['Switzerland', 'Zurich', 'Zürich'],\n        Japan: ['Japan', 'Tokyo'],\n        China: ['China', 'Beijing'],\n        UAE: ['UAE', 'United Arab Emirates', 'Dubai'],\n        'South Africa': ['South Africa', 'Johannesburg']\n    };"""
s=repl(s,old_labels,new_labels,'travel city aliases')

old_detect="""    function detectPage() {\n        const u=location.href;\n        if(/sid=travel/i.test(u)) return 'travel';\n        if(/sid=ItemMarket/i.test(u)) return 'itemmarket';\n        if(/bazaar\\.php/i.test(u)) return 'bazaar';\n        if(/item\\.php/i.test(u)) return 'items';\n        if(/museum\\.php/i.test(u)) return 'museum';\n        if(/pmarket\\.php/i.test(u)) return 'points';\n        return 'other';\n    }"""
new_detect="""    function detectPage() {\n        const u=location.href, body=document.body?.innerText||'';\n        // Torn's mobile/PDA in-flight screen is not always kept on ?sid=travel.\n        // Detect the actual flight card too so Arrival Basket runs on /index.php-style travel views.\n        if(/sid=travel/i.test(u)||/Remaining Flight Time/i.test(body)||/(?:Traveling\\s+(?:from\\s+.+?\\s+)?to|Torn\\s+to)\\s+[A-Za-zÀ-ÿ .'-]+/i.test(body)) return 'travel';\n        if(/sid=ItemMarket/i.test(u)) return 'itemmarket';\n        if(/bazaar\\.php/i.test(u)) return 'bazaar';\n        if(/item\\.php/i.test(u)) return 'items';\n        if(/museum\\.php/i.test(u)) return 'museum';\n        if(/pmarket\\.php/i.test(u)) return 'points';\n        return 'other';\n    }"""
s=repl(s,old_detect,new_detect,'mobile flight page detection')

old_dom="""    function detectFlightFromDom() {\n        const body=document.body?.innerText||'';\n        let destination=null, seconds=null;\n        const to=body.match(/Traveling\\s+(?:from\\s+.+?\\s+)?to\\s+([A-Za-z ]+?)(?:\\n|Remaining|$)/i);\n        if(to) destination=normalizeDestination(to[1]);"""
new_dom="""    function detectFlightFromDom() {\n        const body=document.body?.innerText||'';\n        let destination=null, seconds=null;\n        // Desktop commonly says \"Traveling ... to X\" while Torn PDA/mobile can say\n        // \"Torn to Ciudad Juarez. Remaining Flight Time - 00:16:43\".\n        const to=body.match(/(?:Traveling\\s+(?:from\\s+.+?\\s+)?to|Torn\\s+to)\\s+([A-Za-zÀ-ÿ .'-]+?)(?=\\s*(?:\\.|\\n|Remaining Flight Time|$))/i);\n        if(to) destination=normalizeDestination(to[1]);"""
s=repl(s,old_dom,new_dom,'mobile flight destination parser')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.15.2'
        entry['description']='Market/travel intelligence with route and basket optimization, Arrival Basket, in-country Best Buys, smart landing refresh, session history and corrected Torn PDA/mobile flight detection.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.15.1**','SakaLuX Market Intelligence: **v1.15.2**',1)
release='''### SakaLuX Market Intelligence v1.15.2\n- Fixed **Arrival Basket / Arrival Stock not appearing on Torn PDA/mobile while flying**.\n- `detectPage()` now recognizes the live **Remaining Flight Time** card even when Torn keeps the flight screen on a non-`sid=travel` URL.\n- Added Torn destination-city aliases used by the mobile flight UI, including **Ciudad Juarez → Mexico**, George Town, Toronto, Honolulu, London, Buenos Aires, Zurich, Tokyo, Beijing, Dubai and Johannesburg.\n- `detectFlightFromDom()` now understands the PDA/mobile format `Torn to Ciudad Juarez. Remaining Flight Time - HH:MM:SS` in addition to the desktop `Traveling ... to ...` format.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.1.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.15.1.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.15.1**','**Current version: v1.15.2**',1)
gf_release='''## v1.15.2 — Torn PDA/Mobile Flight Detection Fix\n\n- Fixed Arrival Basket / Arrival Stock failing to appear on Torn PDA/mobile flight screens.\n- Recognizes `Remaining Flight Time` as a Travel page even if the URL is not `?sid=travel`.\n- Supports Torn's city-form flight destinations such as **Ciudad Juarez → Mexico** and the equivalent cities for all travel countries.\n- Supports the mobile text format `Torn to <city>. Remaining Flight Time - HH:MM:SS`.\n\n'''
gf=gf.replace('## v1.15.1',gf_release+'## v1.15.1',1)
GF.write_text(gf,encoding='utf-8')
