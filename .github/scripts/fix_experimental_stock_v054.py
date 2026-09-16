from pathlib import Path
p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('  function openPanelAt  function openPanelAt(selector) {','  function openPanelAt(selector) {',1)
p.write_text(s,encoding='utf-8')
