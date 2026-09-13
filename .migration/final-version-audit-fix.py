from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]

# 1) Hub: necessary fallback-source consistency patch only.
hp=ROOT/'SakaLuX-Script-Hub.user.js'
h=hp.read_text(encoding='utf-8')
h=h.replace('// @version      1.9.37','// @version      1.9.38',1)
h=h.replace("const VERSION = '1.9.37';","const VERSION = '1.9.38';",1)
needle="""    const HUB_CHANGELOG = [
        {
            version: '1.9.37',"""
replacement="""    const HUB_CHANGELOG = [
        {
            version: '1.9.38',
            date: '2026-09-13',
            changes: [
                'Synchronizes Mission Rewards fallback update URLs with the stable v1.0.18 GitHub source used by scripts.json.',
                'Prevents offline/fallback registry mode from pointing Mission Rewards back to a newer Greasy Fork release after rollback.',
                'Extends repository validation so registry URLs and standalone release information cannot silently drift.'
            ]
        },
        {
            version: '1.9.37',"""
if needle not in h: raise SystemExit('Hub changelog insertion point missing')
h=h.replace(needle,replacement,1)
mission_pat=r"(id:\s*'mission-rewards'[\s\S]{0,900}?greasyForkId:\s*'592711',[\s\S]{0,300}?metaUrl:\s*)'[^']+'([\s\S]{0,200}?downloadUrl:\s*)'[^']+'"
mission_rep=r"\1'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Mission-Rewards.user.js'\2'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Mission-Rewards.user.js'"
h,n=re.subn(mission_pat,mission_rep,h,count=1)
if n!=1: raise SystemExit('Mission fallback URL block not found')
hp.write_text(h,encoding='utf-8')

# 2) Hub info/release.
dp=ROOT/'greasyfork/Script-Hub.md'
d=dp.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v1.9.38**',d,count=1)
d=re.sub(r'## Current release notes\s*\n\n.*?\n\n## Recommended',
'''## Current release notes\n\n**v1.9.38** synchronizes the Mission Rewards fallback update source with the stable **v1.0.18** GitHub source already used by `scripts.json`. Offline/fallback registry mode can no longer point Mission Rewards back to a newer Greasy Fork build after rollback. The repository validator is also strengthened to detect registry URL drift and standalone script/info version mismatches.\n\n## Recommended''',d,count=1,flags=re.S)
dp.write_text(d,encoding='utf-8')

# 3) Strengthen stable validator without adding permanent workflows.
vp=ROOT/'.github/workflows/validate-userscripts.yml'
v=vp.read_text(encoding='utf-8')
old="""              if item.get('sourceUrl') != expected_source or not fallback_source:
                  raise SystemExit(f'{display_name}: canonical sourceUrl mismatch')

              info_text = Path(info_file).read_text(encoding='utf-8')"""
new="""              if item.get('sourceUrl') != expected_source or not fallback_source:
                  raise SystemExit(f'{display_name}: canonical sourceUrl mismatch')

              # Registry update URLs must also match the Hub offline fallback row exactly.
              block = re.search(
                  r\"id:\\s*['\\\"]\" + re.escape(script_id) + r\"['\\\"][\\s\\S]{0,1800}?(?=\\n\\s*\\},\\n\\s*\\{|\\n\\s*\\}\\n\\s*\\])\",
                  hub,
              )
              if not block:
                  raise SystemExit(f'{display_name}: Hub fallback block missing')
              for field in ('metaUrl', 'downloadUrl', 'sourceUrl'):
                  registry_value = str(item.get(field) or '')
                  match = re.search(field + r\"\\s*:\\s*['\\\"]([^'\\\"]+)['\\\"]\", block.group(0))
                  fallback_value = match.group(1) if match else ''
                  if registry_value != fallback_value:
                      raise SystemExit(f'{display_name}: {field} registry/fallback mismatch ({registry_value} != {fallback_value})')

              info_text = Path(info_file).read_text(encoding='utf-8')"""
if old not in v: raise SystemExit('Managed validator insertion point missing')
v=v.replace(old,new,1)

old2="""          print('All Hub, registry, userscript and documentation versions: synchronized')

      - name: Validate Suite metadata"""
new2="""          # Standalone SakaLuX scripts must remain outside Hub and keep their info pages synchronized.
          standalone = [
              ('SakaLuX-Account-Auditor.user.js', 'greasyfork/Account-Auditor.md', 'Account Auditor', 'account-auditor'),
              ('SakaLuX-Company-Intelligence-v1.0.0.user.js', 'greasyfork/Company-Intelligence.md', 'Company Intelligence', 'company-intelligence'),
              ('SakaLuX-Suite.user.js', 'greasyfork/SakaLuX-Suite.md', 'SakaLuX Suite', 'sakalux-suite'),
          ]
          registry_ids = {str(x.get('id','')).lower() for x in registry}
          for filename, info_file, display_name, forbidden_id in standalone:
              source = Path(filename).read_text(encoding='utf-8')
              info_text = Path(info_file).read_text(encoding='utf-8')
              meta = re.search(r'^// @version\\s+([^\\s]+)\\s*$', source, re.M)
              runtime = re.search(r\"const VERSION\\s*=\\s*['\\\"]([^'\\\"]+)['\\\"]\", source)
              current = re.search(r'## Current version\\s+\\*\\*v([^*]+)\\*\\*', info_text)
              if not meta or not runtime or not current:
                  raise SystemExit(f'{display_name}: standalone version marker missing')
              versions={meta.group(1),runtime.group(1),current.group(1).strip()}
              if len(versions)!=1:
                  raise SystemExit(f'{display_name}: standalone userscript/info mismatch: {sorted(versions)}')
              if forbidden_id in registry_ids:
                  raise SystemExit(f'{display_name}: standalone script must not be registered in scripts.json')

          print('All Hub, registry, userscript and documentation versions: synchronized')
          print('Standalone Auditor, Company Intelligence and Suite versions/info: synchronized and excluded from Hub')

      - name: Validate Suite metadata"""
if old2 not in v: raise SystemExit('Standalone validator insertion point missing')
v=v.replace(old2,new2,1)
vp.write_text(v,encoding='utf-8')

print('Applied Hub v1.9.38 fallback URL consistency and strengthened full-repo audit validator.')
# trigger