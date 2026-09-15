from pathlib import Path
import json

repo = Path('.')
sp = repo / 'scripts.json'
data = json.loads(sp.read_text(encoding='utf-8'))
mods = [m for m in data.get('scripts', []) if m.get('id') != 'company-intelligence']
company = {
  "id": "company-intelligence",
  "type": "addon",
  "active": True,
  "name": "Company Intelligence",
  "icon": "🏢",
  "category": "Company",
  "version": "1.8.11",
  "description": "Employee and Director company intelligence with work-stat position advisor, effectiveness, growth/star direction, staff optimization, training, contracts and mobile-first TornPDA UI.",
  "greasyForkId": "595873",
  "metaUrl": "https://update.greasyfork.org/scripts/595873/SakaLuX%20Company%20Intelligence.meta.js",
  "downloadUrl": "https://update.greasyfork.org/scripts/595873/SakaLuX%20Company%20Intelligence.user.js",
  "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Company-Intelligence-v1.0.0.user.js",
  "apiGlobal": "SakaLuXCompanyIntelligence",
  "buttonSelector": "#ci-launch",
  "quickActions": [
    {"id": "toggle", "label": "POWER", "icon": "⏻", "method": "toggleEnabled"},
    {"id": "open", "label": "OPEN", "icon": "🏢", "method": "open"},
    {"id": "refresh", "label": "REFRESH", "icon": "🔄", "method": "refresh"}
  ]
}
mods.append(company)
data['scripts'] = mods
sp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

md = repo / 'greasyfork/Company-Intelligence.md'
if md.exists():
    text = md.read_text(encoding='utf-8')
    text = text.replace('> Standalone SakaLuX company-intelligence tool. Not registered in SakaLuX Script Hub.', '> Complementary add-on for SakaLuX Script Hub. Also works standalone on TornPDA / Tampermonkey.')
    if '## Links' not in text:
        insert = ('\n## Links\n'
                  '- GreasyFork: https://greasyfork.org/scripts/595873-sakalux-company-intelligence\n'
                  '- Source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Company-Intelligence-v1.0.0.user.js\n'
                  '- Info / release: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Company-Intelligence.md\n')
        pos = text.find('\n## License')
        if pos >= 0:
            text = text[:pos] + insert + text[pos:]
        else:
            text += insert
    md.write_text(text, encoding='utf-8')
