from pathlib import Path
p=Path('SakaLuX-Suite.user.js')
t=p.read_text(encoding='utf-8')
if '// @version      0.9.916' not in t:
    raise SystemExit('Expected Suite metadata 0.9.916')
old="const VERSION = '0.9.915';"
if old not in t:
    old='const VERSION="0.9.915";'
if old not in t:
    raise SystemExit('Suite runtime 0.9.915 not found')
new="const VERSION = '0.9.916';"
t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')
print('Suite runtime synced to 0.9.916')
