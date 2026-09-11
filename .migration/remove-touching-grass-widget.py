from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]
script_path = ROOT / 'SakaLuX-Elimination-Assistant.user.js'
hub_path = ROOT / 'SakaLuX-Script-Hub.user.js'
registry_path = ROOT / 'scripts.json'
info_path = ROOT / 'greasyfork' / 'Elimination-Assistant.md'
hub_info_path = ROOT / 'greasyfork' / 'Script-Hub.md'

text = script_path.read_text(encoding='utf-8')
text = re.sub(r'(^// @version\s+)1\.3\.9(\s*$)', r'\g<1>1.3.10\2', text, count=1, flags=re.M)
text = text.replace("const VERSION='1.3.9';", "const VERSION='1.3.10';", 1)

marker = "function inject(){"
patch = r'''function removeTouchingGrassWidget(){
  const panel=$('#'+IDS.panel);if(!panel)return false;
  const leaves=[...panel.querySelectorAll('*')].filter(el=>/touching\s+grass\s+targets/i.test((el.textContent||'').trim()));
  for(const leaf of leaves){
    let node=leaf;
    for(let depth=0;node&&node!==panel&&depth<7;depth++,node=node.parentElement){
      const txt=(node.textContent||'').replace(/\s+/g,' ').trim();
      if(/touching\s+grass\s+targets/i.test(txt)&&/target\s*list/i.test(txt)&&/show\s*all/i.test(txt)&&/apply/i.test(txt)){
        node.remove();
        return true;
      }
    }
  }
  return false;
}
function guardAgainstForeignTargetWidgets(){
  const panel=$('#'+IDS.panel);if(!panel)return;
  removeTouchingGrassWidget();
  if(panel.__slxForeignWidgetObserver)return;
  const observer=new MutationObserver(()=>removeTouchingGrassWidget());
  observer.observe(panel,{childList:true,subtree:true});
  panel.__slxForeignWidgetObserver=observer;
  setTimeout(removeTouchingGrassWidget,100);
  setTimeout(removeTouchingGrassWidget,800);
}
'''
if 'function removeTouchingGrassWidget()' not in text:
    if marker not in text:
        raise SystemExit('inject marker not found')
    text = text.replace(marker, patch + marker, 1)

old = "document.body.append(b,p);b.onclick=()=>p.classList.toggle('open');"
new = "document.body.append(b,p);guardAgainstForeignTargetWidgets();b.onclick=()=>{p.classList.toggle('open');guardAgainstForeignTargetWidgets()};"
if old in text:
    text = text.replace(old, new, 1)
elif 'guardAgainstForeignTargetWidgets();b.onclick=' not in text:
    raise SystemExit('append marker not found')

script_path.write_text(text, encoding='utf-8')

registry = json.loads(registry_path.read_text(encoding='utf-8'))
for item in registry['scripts']:
    if item.get('id') == 'elimination-assistant':
        item['version'] = '1.3.10'
registry_path.write_text(json.dumps(registry, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')

hub = hub_path.read_text(encoding='utf-8')
pat = r"(id:\s*['\"]elimination-assistant['\"][\s\S]{0,500}?version:\s*['\"])1\.3\.9(['\"] )"
m = re.search(pat, hub)
if not m:
    pat = r"(id:\s*['\"]elimination-assistant['\"][\s\S]{0,500}?version:\s*['\"])1\.3\.9(['\"])"
    hub, n = re.subn(pat, r'\g<1>1.3.10\2', hub, count=1)
else:
    hub, n = re.subn(pat, r'\g<1>1.3.10\2', hub, count=1)
if n != 1:
    raise SystemExit('Hub elimination fallback version not updated')
hub_path.write_text(hub, encoding='utf-8')

info = info_path.read_text(encoding='utf-8')
info = info.replace('**v1.3.9**','**v1.3.10**',1)
release_marker = '## Current release notes\n'
release = '''\n### v1.3.10\n\n- Removes the foreign **Touching Grass Targets** widget if another userscript injects it inside the SakaLuX Elimination Assistant panel.\n- Adds a lightweight mutation guard so the foreign Apply / Target list / Show all card cannot reappear inside the assistant after panel updates.\n- No targeting, API, FFScouter or attack logic was changed.\n'''
if '### v1.3.10' not in info:
    info = info.replace(release_marker, release_marker + release, 1)
info_path.write_text(info, encoding='utf-8')

hub_info = hub_info_path.read_text(encoding='utf-8')
hub_info = hub_info.replace('SakaLuX Elimination Assistant **v1.3.9**','SakaLuX Elimination Assistant **v1.3.10**')
hub_info_path.write_text(hub_info, encoding='utf-8')

print('Elimination Assistant patched to v1.3.10')
