from pathlib import Path
p=Path('.github/workflows/validate-userscripts.yml')
s=p.read_text(encoding='utf-8')
anchor='      - name: Validate scripts.json\n'
step='''      - name: Validate Hub runtime entrypoints\n        shell: bash\n        run: |\n          set -euo pipefail\n          hub=SakaLuX-Script-Hub.user.js\n          grep -q "function openHub()" "$hub"\n          grep -q "function closeHub()" "$hub"\n          grep -q "function createOverlay(" "$hub"\n          grep -q "function renderList()" "$hub"\n          grep -q "function bindCards()" "$hub"\n          grep -q "function runAction(" "$hub"\n          echo 'Hub runtime entrypoints: OK'\n\n'''
if 'Validate Hub runtime entrypoints' not in s:
    if anchor not in s: raise SystemExit('validator anchor missing')
    s=s.replace(anchor,step+anchor,1)
p.write_text(s,encoding='utf-8')
