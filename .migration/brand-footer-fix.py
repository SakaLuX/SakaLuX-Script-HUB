from pathlib import Path
p=Path(__file__).resolve().parents[1]/'SakaLuX-Market-Intelligence.user.js'
text=p.read_text(encoding='utf-8')
bad="v'+VERSION+' · Market • Bazaar • Travel Intelligence+'</div>"
good="v'+VERSION+' · Market • Bazaar • Travel Intelligence</div>"
if bad not in text:
    raise SystemExit('Expected Market Intelligence subtitle migration output not found')
text=text.replace(bad,good,1)
p.write_text(text,encoding='utf-8')
print('Market Intelligence subtitle syntax fixed.')
