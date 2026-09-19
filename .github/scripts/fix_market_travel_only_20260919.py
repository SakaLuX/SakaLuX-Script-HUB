from pathlib import Path
import re, json

p=Path('SakaLuX-Market-Intelligence.user.js')
s=p.read_text(encoding='utf-8')
old=s

# Version bump.
s=s.replace('// @version      1.17.42','// @version      1.17.43',1)
s=s.replace("let v = '1.17.42';","let v = '1.17.43';",1)
s=s.replace("version:'1.17.42'","version:'1.17.43'")
s=s.replace("const VERSION = '1.17.42';","const VERSION = '1.17.43';",1)

# Find the two render functions from their visible titles and guard them at the source.
def guard_title(title):
    global s
    idx=s.find(title)
    if idx < 0:
        raise SystemExit(f'title not found: {title}')
    before=s[:idx]
    matches=list(re.finditer(r'(?m)^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{', before))
    if not matches:
        raise SystemExit(f'function not found for {title}')
    fn=matches[-1]
    fn_name=fn.group(1)
    open_brace=fn.end()-1
    chunk=s[open_brace:idx]
    ids=re.findall(r"(?:\.id\s*=\s*|getElementById\()\s*['\"]([^'\"]*sl-mi[^'\"]*)['\"]", chunk)
    panel_id=ids[-1] if ids else ''
    if panel_id:
        cleanup=f"document.getElementById('{panel_id}')?.remove();"
    else:
        cleanup=("document.querySelectorAll('[id^=\"sl-mi-\"], .sl-mi-travel').forEach(n=>{"
                 f"if(n.textContent?.includes('{title}')) n.remove();" "});")
    guard=("\n        // v1.17.43: travel-only hard guard. These inline cards must never exist outside Travel.\n"
           f"        if (detectPage() !== 'travel') {{ {cleanup} return; }}")
    look=s[open_brace:open_brace+500]
    if 'v1.17.43: travel-only hard guard' not in look:
        s=s[:open_brace+1]+guard+s[open_brace+1:]
    return fn_name,panel_id

session_fn,session_id=guard_title('TRAVEL SESSION SUMMARY')
arrival_fn,arrival_id=guard_title('ARRIVAL BASKET')

needle="state.busy=true;state.page=detectPage();"
if needle not in s:
    raise SystemExit('scan page-detection marker not found')
ids=[x for x in (session_id,arrival_id) if x]
if ids:
    selector=','.join('#'+x for x in dict.fromkeys(ids))
    cleanup=f"if(state.page!=='travel')document.querySelectorAll('{selector}').forEach(n=>n.remove());"
else:
    cleanup=("if(state.page!=='travel')document.querySelectorAll('[id^=\"sl-mi-\"], .sl-mi-travel').forEach(n=>{"
             "const t=n.textContent||'';if(t.includes('TRAVEL SESSION SUMMARY')||t.includes('ARRIVAL BASKET'))n.remove();});")
replacement=needle+cleanup
if replacement not in s:
    s=s.replace(needle,replacement,1)

reg=Path('scripts.json')
if reg.exists():
    data=json.loads(reg.read_text(encoding='utf-8'))
    for row in data.get('scripts',[]):
        if row.get('id')=='market-intelligence':
            row['version']='1.17.43'
            row['release']={'version':'1.17.43','date':'2026-09-19','notes':['Hard-locks Travel Session Summary and Arrival Basket to Torn Travel pages only.','Removes stale travel cards immediately when Torn SPA navigation moves to Messages or any non-Travel page.','Adds render-time guards so mutations or delayed scans cannot recreate either panel outside Travel.']}
    reg.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

md=Path('greasyfork/Market-Intelligence.md')
if md.exists():
    t=md.read_text(encoding='utf-8')
    t=re.sub(r'\*\*v1\.17\.42\*\*','**v1.17.43**',t,count=1)
    entry=('### v1.17.43 — Strict Travel-only inline panels\n'
           '- Travel Session Summary and Arrival Basket now have hard render guards and can only mount when `detectPage()` is `travel`.\n'
           '- Torn SPA navigation now removes stale travel cards immediately on Messages and every other non-Travel page.\n'
           '- Prevents delayed MutationObserver/scan callbacks from recreating either panel outside Travel.\n\n')
    if '### v1.17.43 — Strict Travel-only inline panels' not in t:
        pos=t.find('## Release history')
        if pos>=0:
            ins=t.find('\n',pos)+1
            t=t[:ins]+'\n'+entry+t[ins:]
        else:
            t+='\n'+entry
    md.write_text(t,encoding='utf-8')

if s==old:
    raise SystemExit('no script changes made')
p.write_text(s,encoding='utf-8')
print('patched',session_fn,session_id,arrival_fn,arrival_id)
# trigger
