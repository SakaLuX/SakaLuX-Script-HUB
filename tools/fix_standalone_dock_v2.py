from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
START='/* SakaLuX Standalone Dock Bootstrap — BEGIN */'
END='/* SakaLuX Standalone Dock Bootstrap — END */'
CFG={
'enhancer':('SakaLuX-Enhancer-Guard.user.js','Enhancers','🛡️','#sl-eg-button','https://www.torn.com/item.php','VERSION'),
'bazaar':('SakaLuX-Bazaar-Thanker-PDA.user.js','Bazaar Thanker','💬','#sakalux-bt-settings-button','https://www.torn.com/page.php?sid=events','BAZAAR_VERSION'),
'mission-rewards':('SakaLuX-Mission-Rewards.user.js','Mission Rewards','🎯','#sl-mri-button','https://www.torn.com/page.php?sid=missions','VERSION'),
'market-intelligence':('SakaLuX-Market-Intelligence.user.js','Market','📈','#sl-mi-button','https://www.torn.com/page.php?sid=ItemMarket','VERSION'),
'elimination-assistant':('SakaLuX-Elimination-Assistant.user.js','Elimination','⚔️','#slx-elim-btn','https://www.torn.com/page.php?sid=elimination','VERSION')}
DOC={'enhancer':'greasyfork/Enhancer-Guard.md','bazaar':'greasyfork/Bazaar-Thanker.md','mission-rewards':'greasyfork/Mission-Rewards.md','market-intelligence':'greasyfork/Market-Intelligence.md','elimination-assistant':'greasyfork/Elimination-Assistant.md'}
ORDER=['enhancer','bazaar','mission-rewards','market-intelligence','elimination-assistant']
NOTE='Standalone Dock v2 now uses its own uniform buttons instead of moving script launchers. All installed Hub add-ons register themselves in the shared dock, preventing overlaps and missing entries. The Hub install reminder remains shared and limited to once every 12 hours.'

def bump(v):
 p=v.split('.'); p[-1]=str(int(p[-1])+1); return '.'.join(p)

def bootstrap(sid,name,icon,selector,fallback,version):
 hide=','.join(x[3] for x in CFG.values())
 return f'''{START}
(() => {{
  'use strict';
  const SELF={{id:{sid!r},name:{name!r},icon:{icon!r},selector:{selector!r},fallback:{fallback!r},version:{version!r}}};
  const HUB_URL='https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY='SakaLuX_HUB_INSTALL_PROMPT_LAST', INTERVAL=12*60*60*1000;
  const DOCK_ID='sakalux-standalone-dock', PROMPT_ID='sakalux-hub-install-prompt', STYLE_ID='sakalux-standalone-dock-style';
  const REG_ATTR='data-slx-standalone-registration';
  const ORDER={json.dumps(ORDER)};
  const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.querySelector('[data-sakalux-hub-installed="1"]'));
  function registerSelf(){{
    let m=document.querySelector(`[${{REG_ATTR}}="${{SELF.id}}"]`);
    if(!m){{m=document.createElement('span');m.setAttribute(REG_ATTR,SELF.id);m.hidden=true;(document.body||document.documentElement).appendChild(m);}}
    Object.assign(m.dataset,{{id:SELF.id,name:SELF.name,icon:SELF.icon,selector:SELF.selector,fallback:SELF.fallback,version:SELF.version}});
  }}
  function addStyle(){{if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#${{DOCK_ID}}{{position:fixed;right:10px;bottom:72px;z-index:2147483000;width:min(238px,calc(100vw - 20px));max-height:calc(100vh - 150px);overflow:hidden;padding:8px;background:rgba(13,17,23,.97);border:1px solid #3b4654;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.45);font:12px Arial,sans-serif}}
#${{DOCK_ID}} .slx-dock-head{{display:flex;align-items:center;gap:6px;margin-bottom:6px}}#${{DOCK_ID}} .slx-dock-title{{flex:1;color:#facc15;font-weight:900;font-size:14px}}
#${{DOCK_ID}} .slx-dock-collapse{{width:30px!important;height:30px!important;min-height:30px!important;padding:0!important;background:#202a36!important;border:1px solid #526174!important;color:#fff!important;border-radius:8px!important}}
#${{DOCK_ID}} .slx-dock-items{{display:flex;flex-direction:column;gap:5px;max-height:calc(100vh - 250px);overflow:auto}}#${{DOCK_ID}}[data-collapsed="1"] .slx-dock-items,#${{DOCK_ID}}[data-collapsed="1"] .slx-dock-install{{display:none!important}}
#${{DOCK_ID}} .slx-dock-row{{display:flex!important;align-items:center!important;gap:8px!important;width:100%!important;min-height:38px!important;margin:0!important;padding:8px 10px!important;box-sizing:border-box!important;position:static!important;transform:none!important;border:1px solid #3b4654!important;border-radius:8px!important;background:#17202b!important;color:#fff!important;font:800 12px/1.15 Arial,sans-serif!important;text-align:left!important;white-space:nowrap!important;overflow:hidden!important}}
#${{DOCK_ID}} .slx-dock-row .i{{width:20px;flex:0 0 20px;text-align:center}}#${{DOCK_ID}} .slx-dock-row .n{{overflow:hidden;text-overflow:ellipsis}}#${{DOCK_ID}} .slx-dock-install{{display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:6px!important;padding:9px!important;border-radius:8px!important;background:#8a5a00!important;border:1px solid #f59e0b!important;color:#fff!important;text-align:center!important;text-decoration:none!important;font-weight:900!important}}
body:not([data-sakalux-hub-active="1"]) :is({hide}){{display:none!important}}
`; (document.head||document.documentElement).appendChild(s);}}
  function ensureDock(){{if(hubInstalled()){{document.body?.setAttribute('data-sakalux-hub-active','1');document.getElementById(DOCK_ID)?.remove();document.getElementById(PROMPT_ID)?.remove();return null;}}document.body?.removeAttribute('data-sakalux-hub-active');addStyle();let d=document.getElementById(DOCK_ID);if(d)return d;d=document.createElement('div');d.id=DOCK_ID;d.dataset.collapsed=localStorage.getItem('SakaLuX_STANDALONE_DOCK_COLLAPSED')==='1'?'1':'0';d.innerHTML=`<div class="slx-dock-head"><span class="slx-dock-title">SakaLuX Scripts</span><button type="button" class="slx-dock-collapse">${{d.dataset.collapsed==='1'?'+':'−'}}</button></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${{HUB_URL}}">⬇ Install SakaLuX Hub</a>`;(document.body||document.documentElement).appendChild(d);d.querySelector('.slx-dock-collapse').onclick=()=>{{d.dataset.collapsed=d.dataset.collapsed==='1'?'0':'1';localStorage.setItem('SakaLuX_STANDALONE_DOCK_COLLAPSED',d.dataset.collapsed);d.querySelector('.slx-dock-collapse').textContent=d.dataset.collapsed==='1'?'+':'−';}};return d;}}
  function openEntry(data){{const el=data.selector?document.querySelector(data.selector):null;if(el){{el.click();return;}}if(data.fallback)location.href=data.fallback;}}
  function render(){{const d=ensureDock();if(!d)return;const box=d.querySelector('.slx-dock-items');const regs=[...document.querySelectorAll(`[${{REG_ATTR}}]`)].map(x=>x.dataset).filter(x=>x.id);regs.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id));box.replaceChildren();for(const r of regs){{const b=document.createElement('button');b.type='button';b.className='slx-dock-row';b.dataset.scriptId=r.id;b.innerHTML=`<span class="i">${{r.icon||'•'}}</span><span class="n">${{r.name||r.id}}</span>`;b.onclick=()=>openEntry(r);box.appendChild(b);}}}}
  function maybePrompt(){{if(hubInstalled()||document.getElementById(PROMPT_ID))return;let last=0;try{{last=Number(localStorage.getItem(LAST_KEY)||0)}}catch{{}}if(last&&Date.now()-last<INTERVAL)return;try{{localStorage.setItem(LAST_KEY,String(Date.now()))}}catch{{}}const p=document.createElement('div');p.id=PROMPT_ID;p.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';p.innerHTML=`<div style="width:min(380px,100%);background:#111820;color:#fff;border:1px solid #465365;border-radius:14px;padding:18px;font:14px Arial,sans-serif"><b style="font-size:17px">Install SakaLuX Script Hub?</b><div style="margin-top:8px;color:#cbd5e1;line-height:1.45">Keep all SakaLuX scripts together with shared settings and controls.</div><div style="display:flex;gap:8px;margin-top:14px"><button type="button" data-later style="flex:1;padding:10px">Later</button><button type="button" data-install style="flex:1;padding:10px">Install Hub</button></div></div>`;(document.body||document.documentElement).appendChild(p);p.querySelector('[data-later]').onclick=()=>p.remove();p.querySelector('[data-install]').onclick=()=>location.href=HUB_URL;}}
  function start(){{registerSelf();render();setTimeout(maybePrompt,1200);let t=0;new MutationObserver(()=>{{clearTimeout(t);t=setTimeout(()=>{{registerSelf();render();}},60);}}).observe(document.documentElement,{{childList:true,subtree:true}});setInterval(()=>{{registerSelf();render();maybePrompt();}},60000);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{{once:true}});else start();
}})();
{END}'''

reg=json.loads((ROOT/'scripts.json').read_text())
versions={}
for sid,(fn,name,icon,selector,fallback,runtime) in CFG.items():
 p=ROOT/fn; text=p.read_text()
 old=re.search(r'^// @version\s+([^\s]+)',text,re.M).group(1); new=bump(old); versions[sid]=new
 text=re.sub(r'^// @version\s+[^\s]+',f'// @version      {new}',text,count=1,flags=re.M)
 text=re.sub(rf"(const\s+{runtime}\s*=\s*['\"]){re.escape(old)}(['\"])",rf'\g<1>{new}\2',text,count=1)
 pat=re.compile(re.escape(START)+r'.*?'+re.escape(END),re.S)
 text=pat.sub(bootstrap(sid,name,icon,selector,fallback,new),text,count=1)
 p.write_text(text)
 doc=ROOT/DOC[sid]; dt=doc.read_text(); dt=re.sub(r'(## Current version\s+\*\*v)[^*]+(\*\*)',rf'\g<1>{new}\2',dt,count=1); dt=re.sub(r'(## Current release note\s+)(.*?)(?=\n## )',lambda m:m.group(1)+NOTE+'\n',dt,count=1,flags=re.S); doc.write_text(dt)
for item in reg['scripts']:
 if item['id'] in versions:item['version']=versions[item['id']]
(ROOT/'scripts.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n')
# Hub fallback versions + Hub patch bump
hp=ROOT/'SakaLuX-Script-Hub.user.js'; ht=hp.read_text(); h_old=re.search(r'^// @version\s+([^\s]+)',ht,re.M).group(1); h_new=bump(h_old); ht=re.sub(r'^// @version\s+[^\s]+',f'// @version      {h_new}',ht,count=1,flags=re.M); ht=re.sub(rf"(const VERSION\s*=\s*['\"]){re.escape(h_old)}(['\"])",rf'\g<1>{h_new}\2',ht,count=1)
for sid,v in versions.items(): ht=re.sub(rf"(id:\s*['\"]{re.escape(sid)}['\"][\s\S]{{0,500}}?version:\s*['\"])[^'\"]+",rf'\g<1>{v}',ht,count=1)
hp.write_text(ht)
hd=ROOT/'greasyfork/Script-Hub.md'; d=hd.read_text(); d=re.sub(r'(## Current version\s+\*\*v)[^*]+(\*\*)',rf'\g<1>{h_new}\2',d,count=1); d=re.sub(r'(## Current release note\s+)(.*?)(?=\n## )',lambda m:m.group(1)+'Standalone Dock v2 compatibility release. Installed add-ons now register into a uniform shared dock without moving their native buttons, eliminating overlap and missing-module issues.\n',d,count=1,flags=re.S)
for sid,(fn,name,icon,selector,fallback,runtime) in CFG.items(): d=re.sub(rf'(- .*SakaLuX {re.escape(name if sid!="bazaar" else "Bazaar Thanker - PDA")} \*\*v)[^*]+(\*\*)',rf'\g<1>{versions[sid]}\2',d)
hd.write_text(d)
print('versions',versions,'hub',h_new)
