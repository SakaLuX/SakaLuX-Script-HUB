from pathlib import Path
import re

p=Path('SakaLuX-Script-Hub.user.js')
s=p.read_text(encoding='utf-8')
start=s.index('const FALLBACK_REGISTRY = {')
end=s.index('const UI_RO', start)
head,block,tail=s[:start],s[start:end],s[end:]
versions={
  '1.3.36':'1.3.37',
  '5.3.28':'5.3.29',
  '1.0.23':'1.0.24',
  '1.17.24':'1.17.25',
  '1.3.34':'1.3.35',
  '1.8.20':'1.8.21',
}
for old,new in versions.items():
    block=block.replace("version: '"+old+"'", "version: '"+new+"'")
p.write_text(head+block+tail,encoding='utf-8')

md=Path('greasyfork/Script-Hub.md')
if md.exists():
    t=md.read_text(encoding='utf-8')
    repl={
      'SakaLuX Enhancer Guard **v1.3.36**':'SakaLuX Enhancer Guard **v1.3.37**',
      'SakaLuX Bazaar Thanker - PDA **v5.3.28**':'SakaLuX Bazaar Thanker - PDA **v5.3.29**',
      'SakaLuX Mission Rewards **v1.0.23**':'SakaLuX Mission Rewards **v1.0.24**',
      'SakaLuX Market Intelligence **v1.17.24**':'SakaLuX Market Intelligence **v1.17.25**',
      'SakaLuX Elimination Assistant **v1.3.34**':'SakaLuX Elimination Assistant **v1.3.35**',
      'SakaLuX Company Intelligence **v1.8.20**':'SakaLuX Company Intelligence **v1.8.21**',
    }
    for a,b in repl.items():t=t.replace(a,b)
    md.write_text(t,encoding='utf-8')
