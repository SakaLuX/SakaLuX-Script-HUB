from pathlib import Path
import re
p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
t=p.read_text(encoding='utf-8')
meta=re.search(r'^// @version\s+([^\s]+)\s*$',t,re.M)
if not meta: raise SystemExit('Company @version missing')
v=meta.group(1)
old=re.search(r"const APP=\{name:'SakaLuX Company Intelligence',version:'([^']+)'",t)
if not old: raise SystemExit('Company APP.version missing')
if old.group(1)!=v:
    t=t[:old.start(1)]+v+t[old.end(1):]
p.write_text(t,encoding='utf-8')
# Verify bridge/standalone registration derives from APP.version.
if "version:APP.version" not in t:
    raise SystemExit('Company standalone/runtime registration is not derived from APP.version')
print(f'Company APP.version synchronized to {v}')
