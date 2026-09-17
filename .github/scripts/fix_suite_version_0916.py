from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js')
t=p.read_text(encoding='utf-8')
meta=re.search(r'^// @version\s+([^\s]+)\s*$',t,re.M)
if not meta or meta.group(1)!='0.9.916':
    raise SystemExit(f'Expected Suite metadata 0.9.916, got {meta.group(1) if meta else "missing"}')
pat=r"const\s+VERSION\s*=\s*(['\"])0\.9\.915\1\s*;"
t,n=re.subn(pat,"const VERSION = '0.9.916';",t,count=1)
if n!=1:
    found=re.search(r"const\s+VERSION\s*=\s*(['\"])([^'\"]+)\1\s*;",t)
    raise SystemExit(f'Suite runtime 0.9.915 not found; current={found.group(2) if found else "missing"}')
p.write_text(t,encoding='utf-8')
print('Suite runtime synced to 0.9.916')
