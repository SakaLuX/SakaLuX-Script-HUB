from pathlib import Path
import json,re

# Synchronize Script Hub info page with canonical scripts.json registry.
reg=json.loads(Path('scripts.json').read_text(encoding='utf-8'))['scripts']
p=Path('greasyfork/Script-Hub.md')
s=p.read_text(encoding='utf-8')
for item in reg:
    name=item['name']
    version=str(item['version'])
    # Accept the historical Bazaar display suffix in docs.
    if item['id']=='bazaar':
        pat=r'(-\s+💬\s+SakaLuX\s+Bazaar Thanker(?:\s+-\s+PDA)?\s+\*\*v)[^*]+(\*\*)'
    else:
        pat=rf'(-\s+.*?SakaLuX\s+{re.escape(name)}\s+\*\*v)[^*]+(\*\*)'
    s,n=re.subn(pat,rf'\g<1>{version}\g<2>',s,count=1,flags=re.I)
    if n!=1:
        raise SystemExit(f'Could not sync Script-Hub.md entry for {item["id"]}')
# Keep the explicit Company note current too.
company=next(x for x in reg if x['id']=='company-intelligence')
s=re.sub(r'(Company Intelligence is currently registered at \*\*v)[^*]+(\*\*)',rf'\g<1>{company["version"]}\g<2>',s,count=1)
p.write_text(s,encoding='utf-8')

# Strengthen the stable validator so every active userscript is syntax checked,
# including standalone and experimental scripts, while historical backups are excluded.
w=Path('.github/workflows/validate-userscripts.yml')
y=w.read_text(encoding='utf-8')
y=y.replace("      - '*.user.js'\n", "      - '**/*.user.js'\n", 2)
old="""          shopt -s nullglob
          files=(SakaLuX-*.user.js)
          if ((${#files[@]} == 0)); then
            echo 'No root SakaLuX userscripts found.' >&2
            exit 1
          fi
          printf 'Checking %d userscripts\\n' "${#files[@]}"
          for file in "${files[@]}"; do
            echo "node --check $file"
            node --check "$file"
          done
"""
new="""          mapfile -t files < <(find . -type f -name '*.user.js' \\
            ! -path './backups/*' \\
            ! -path './.migration/*' \\
            ! -path './node_modules/*' | sort)
          if ((${#files[@]} == 0)); then
            echo 'No active userscripts found.' >&2
            exit 1
          fi
          printf 'Checking %d active userscripts\\n' "${#files[@]}"
          for file in "${files[@]}"; do
            echo "node --check $file"
            node --check "$file"
          done
"""
if old not in y: raise SystemExit('syntax-check block not found')
y=y.replace(old,new,1)
old_line="              'elimination-assistant': ('SakaLuX-Elimination-Assistant.user.js', 'Elimination Assistant', 'greasyfork/Elimination-Assistant.md', 'VERSION'),\n"
if old_line not in y: raise SystemExit('files map anchor missing')
y=y.replace(old_line,old_line+"              'company-intelligence': ('SakaLuX-Company-Intelligence-v1.0.0.user.js', 'Company Intelligence', 'greasyfork/Company-Intelligence.md', 'VERSION'),\n",1)
w.write_text(y,encoding='utf-8')
