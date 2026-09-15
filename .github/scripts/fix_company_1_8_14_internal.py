from pathlib import Path
p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=p.read_text(encoding='utf-8')
if "version:'1.8.13'" not in s: raise SystemExit('internal version marker missing')
s=s.replace("version:'1.8.13'","version:'1.8.14'",1)
p.write_text(s,encoding='utf-8')
