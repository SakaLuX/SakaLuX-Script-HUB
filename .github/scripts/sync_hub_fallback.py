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

# Keep standalone registration metadata aligned with the actual userscript version.
standalone_versions={
  'SakaLuX-Enhancer-Guard.user.js':'1.3.37',
  'SakaLuX-Bazaar-Thanker-PDA.user.js':'5.3.29',
  'SakaLuX-Mission-Rewards.user.js':'1.0.24',
  'SakaLuX-Market-Intelligence.user.js':'1.17.25',
  'SakaLuX-Elimination-Assistant.user.js':'1.3.35',
}
for filename,version in standalone_versions.items():
    fp=Path(filename)
    if not fp.exists(): continue
    text=fp.read_text(encoding='utf-8')
    text=re.sub(r"(const\s+SELF\s*=\s*Object\.assign\([\s\S]{0,500}?\},\s*\{version:\s*')[^']+('\}\);)",r'\g<1>'+version+r'\g<2>',text,count=1)
    fp.write_text(text,encoding='utf-8')

# Bazaar uses a dedicated runtime constant too.
bp=Path('SakaLuX-Bazaar-Thanker-PDA.user.js')
if bp.exists():
    b=bp.read_text(encoding='utf-8')
    b=b.replace("const BAZAAR_VERSION='5.3.28';", "const BAZAAR_VERSION='5.3.29';")
    b=b.replace('Version 5.3.5 · buyer messages and bazaar analytics', 'Version 5.3.29 · buyer messages and bazaar analytics')
    bp.write_text(b,encoding='utf-8')

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
