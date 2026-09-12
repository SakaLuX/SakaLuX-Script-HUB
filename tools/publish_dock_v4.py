from pathlib import Path
import json,re

FILES={
'enhancer':('SakaLuX-Enhancer-Guard.user.js','Enhancer','🛡️','#sl-eg-button','https://www.torn.com/item.php','VERSION','greasyfork/Enhancer-Guard.md'),
'bazaar':('SakaLuX-Bazaar-Thanker-PDA.user.js','Bazaar','💬','#sakalux-bt-settings-button','https://www.torn.com/page.php?sid=events','BAZAAR_VERSION','greasyfork/Bazaar-Thanker.md'),
'mission-rewards':('SakaLuX-Mission-Rewards.user.js','Missions','🎯','#sl-mri-button','https://www.torn.com/page.php?sid=missions','VERSION','greasyfork/Mission-Rewards.md'),
'market-intelligence':('SakaLuX-Market-Intelligence.user.js','Market','📈','#sl-mi-button','https://www.torn.com/page.php?sid=ItemMarket','VERSION','greasyfork/Market-Intelligence.md'),
'elimination-assistant':('SakaLuX-Elimination-Assistant.user.js','Elimination','⚔️','#slx-elim-btn','https://www.torn.com/page.php?sid=elimination','VERSION','greasyfork/Elimination-Assistant.md'),
}

def bump(v):
    p=v.split('.')
    p[-1]=str(int(p[-1])+1)
    return '.'.join(p)

registry=json.loads(Path('scripts.json').read_text())
versions={}
for item in registry['scripts']:
    if item['id'] in FILES:
        item['version']=bump(str(item['version']))
        versions[item['id']]=item['version']
Path('scripts.json').write_text(json.dumps(registry,indent=2,ensure_ascii=False)+'\n')

BOOT_BEGIN='/* SakaLuX Standalone Dock Bootstrap — BEGIN */'
BOOT_END='/* SakaLuX Standalone Dock Bootstrap — END */'

TPL=r'''/* SakaLuX Standalone Dock Bootstrap — BEGIN */
(() => {{
  'use strict';
  const SELF=Object.assign({CFG},{{version:'{VER}'}});
  const HUB_URL='https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY='SakaLuX_HUB_INSTALL_PROMPT_LAST', INTERVAL=12*60*60*1000;
  const DOCK_ID='sakalux-standalone-dock', PROMPT_ID='sakalux-hub-install-prompt', STYLE_ID='sakalux-standalone-dock-style';
  const NATIVE_ID='sakalux-standalone-native-s', FALLBACK_ID='sakalux-standalone-fallback-s';
  const REG_ATTR='data-slx-standalone-registration', OPEN_KEY='SakaLuX_STANDALONE_DOCK_OPEN';
  const ORDER=["enhancer","bazaar","mission-rewards","market-intelligence","elimination-assistant"];
  const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.querySelector('[data-sakalux-hub-installed="1"]'));
  function registerSelf(){{let m=document.querySelector(`[${{REG_ATTR}}="${{SELF.id}}"]`);if(!m){{m=document.createElement('span');m.setAttribute(REG_ATTR,SELF.id);m.hidden=true;(document.body||document.documentElement).appendChild(m);}}Object.assign(m.dataset,SELF);}}
  function addStyle(){{if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#${{DOCK_ID}}{{position:fixed;right:10px;bottom:74px;z-index:2147483000;width:min(196px,calc(100vw - 20px));max-height:min(58vh,390px);overflow:hidden;padding:8px;background:linear-gradient(180deg,rgba(13,18,26,.985),rgba(8,12,18,.985));border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 14px 34px rgba(0,0,0,.44);backdrop-filter:blur(12px);font-family:Inter,Arial,sans-serif;display:none}}
#${{DOCK_ID}}[data-open="1"]{{display:block}}
#${{DOCK_ID}} .slx-dock-head{{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:3px;padding:3px 4px 8px;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,.055)}}
#${{DOCK_ID}} .slx-dock-mark{{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:linear-gradient(180deg,#293443,#18212c);border:1px solid rgba(215,169,74,.34);color:#ddb95d;font:900 15px/28px Arial;box-shadow:inset 0 1px rgba(255,255,255,.04)}}
#${{DOCK_ID}} .slx-dock-title{{color:#f4f7fb;font-size:11px;font-weight:900;line-height:1.15;letter-spacing:.01em;text-align:center}}
#${{DOCK_ID}} .slx-dock-sub{{color:#7f8b99;font-size:7px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;text-align:center}}
#${{DOCK_ID}} .slx-dock-items{{display:flex;flex-direction:column;gap:4px;max-height:calc(min(58vh,390px) - 112px);overflow:auto}}
#${{DOCK_ID}} .slx-dock-row{{display:grid!important;grid-template-columns:18px 1fr 18px!important;align-items:center!important;width:100%!important;min-height:30px!important;margin:0!important;padding:5px 8px!important;box-sizing:border-box!important;position:static!important;inset:auto!important;transform:none!important;border:1px solid rgba(255,255,255,.075)!important;border-radius:10px!important;background:linear-gradient(180deg,#151d27,#101720)!important;color:#eef2f7!important;font:800 10px/1 Arial,sans-serif!important;box-shadow:inset 0 1px rgba(255,255,255,.018)!important}}
#${{DOCK_ID}} .slx-dock-row:active{{background:linear-gradient(180deg,#1b2531,#141c26)!important;transform:scale(.985)!important}}
#${{DOCK_ID}} .slx-dock-row .i{{grid-column:1;width:18px;text-align:center;font-size:12px}}#${{DOCK_ID}} .slx-dock-row .n{{grid-column:2;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}#${{DOCK_ID}} .slx-dock-row .pad{{grid-column:3;width:18px}}
#${{DOCK_ID}} .slx-dock-install{{display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:6px!important;padding:6px 8px!important;border-radius:10px!important;background:linear-gradient(180deg,#7c5a17,#5f4311)!important;border:1px solid rgba(221,185,91,.62)!important;color:#f9edc4!important;text-align:center!important;text-decoration:none!important;font:900 9px Arial,sans-serif!important;letter-spacing:.01em}}
#${{NATIVE_ID}}{{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border:0!important;list-style:none!important;background:none!important;box-shadow:none!important}}#${{NATIVE_ID}}::before,#${{NATIVE_ID}}::after{{content:none!important;display:none!important}}#${{NATIVE_ID}} .slx-s-link{{display:grid!important;place-items:center!important;width:17px!important;height:17px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;text-decoration:none!important;color:#dfbd61!important;font:900 15px/17px Arial,sans-serif!important;text-shadow:0 1px 1px rgba(0,0,0,.72),0 0 4px rgba(223,189,97,.18)!important}}#${{NATIVE_ID}} .slx-s-link:active{{transform:scale(.9)!important}}
#${{FALLBACK_ID}}{{position:fixed;right:10px;bottom:78px;z-index:2147483001;width:32px;height:32px;padding:0;border:1px solid #64748b;border-radius:9px;background:linear-gradient(145deg,#202b39,#111923);color:#dfbd61;box-shadow:0 8px 22px rgba(0,0,0,.42);font:900 15px Arial;display:none;align-items:center;justify-content:center}}
body:not([data-sakalux-hub-active="1"]) :is(#sl-eg-button,#sakalux-bt-settings-button,#sl-mri-button,#sl-mi-button,#slx-elim-btn){{display:none!important}}
`; (document.head||document.documentElement).appendChild(s);}}
  function findStatusIconList(){{const selectors=['ul[class*="statusIcons"][class*="big"]','ul[class*="status-icons"][class*="big"]','ul[class*="statusIcons"]','ul[class*="status-icons"]'];const lists=selectors.flatMap(q=>[...document.querySelectorAll(q)]);return lists.find(list=>list.isConnected&&[...list.children].some(item=>item.querySelector?.('a')))||null;}}
  function copyNativeCell(item,list){{const ref=[...list.children].find(x=>x!==item&&x.querySelector?.('a'));if(!ref)return;const native=[...ref.classList].filter(x=>x&&!x.startsWith('slx-')&&!x.startsWith('sakalux-'));item.className=[...native,'slx-standalone-native'].join(' ');}}
  function toggleDock(force){{const d=ensureDock();if(!d)return;const next=typeof force==='boolean'?force:d.dataset.open!=='1';d.dataset.open=next?'1':'0';try{{localStorage.setItem(OPEN_KEY,next?'1':'0')}}catch{{}}}}
  function ensureNativeLauncher(){{if(hubInstalled()){{document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return false;}}const list=findStatusIconList();let item=document.getElementById(NATIVE_ID);if(list){{if(!item){{item=document.createElement('li');item.id=NATIVE_ID;item.innerHTML='<a href="#" class="slx-s-link" aria-label="SakaLuX Scripts" title="SakaLuX Scripts">S</a>';item.querySelector('a').onclick=e=>{{e.preventDefault();e.stopPropagation();toggleDock();}};}}copyNativeCell(item,list);const children=[...list.children].filter(x=>x!==item);const cashIndex=children.findIndex(x=>/\$|cash|money/i.test((x.textContent||'')+' '+(x.className||'')));const anchor=cashIndex>=0?children[cashIndex]:children[0];if(anchor)anchor.insertAdjacentElement('afterend',item);else list.appendChild(item);document.getElementById(FALLBACK_ID)?.remove();return true;}}item?.remove();let fb=document.getElementById(FALLBACK_ID);if(!fb){{fb=document.createElement('button');fb.id=FALLBACK_ID;fb.type='button';fb.textContent='S';fb.title='SakaLuX Scripts';fb.onclick=()=>toggleDock();(document.body||document.documentElement).appendChild(fb);}}fb.style.display='flex';return false;}}
  function ensureDock(){{if(hubInstalled()){{document.body?.setAttribute('data-sakalux-hub-active','1');document.getElementById(DOCK_ID)?.remove();document.getElementById(PROMPT_ID)?.remove();document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return null;}}document.body?.removeAttribute('data-sakalux-hub-active');addStyle();let d=document.getElementById(DOCK_ID);if(d)return d;d=document.createElement('div');d.id=DOCK_ID;d.dataset.open=localStorage.getItem(OPEN_KEY)==='1'?'1':'0';d.innerHTML=`<div class="slx-dock-head"><span class="slx-dock-mark">S</span><div class="slx-dock-title">SakaLuX Scripts</div><div class="slx-dock-sub">Standalone</div></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${{HUB_URL}}">Install SakaLuX Hub</a>`;(document.body||document.documentElement).appendChild(d);return d;}}
  function openEntry(data){{const el=data.selector?document.querySelector(data.selector):null;if(el){{el.click();return;}}if(data.fallback)location.href=data.fallback;}}
  function render(){{const d=ensureDock();if(!d)return;const box=d.querySelector('.slx-dock-items');const regs=[...document.querySelectorAll(`[${{REG_ATTR}}]`)].map(x=>x.dataset).filter(x=>x.id);regs.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id));box.replaceChildren();for(const r of regs){{const b=document.createElement('button');b.type='button';b.className='slx-dock-row';b.innerHTML=`<span class="i">${{r.icon||'•'}}</span><span class="n">${{r.name||r.id}}</span><span class="pad"></span>`;b.onclick=()=>openEntry(r);box.appendChild(b);}}ensureNativeLauncher();}}
  function maybePrompt(){{if(hubInstalled()||document.getElementById(PROMPT_ID))return;let last=0;try{{last=Number(localStorage.getItem(LAST_KEY)||0)}}catch{{}}if(last&&Date.now()-last<INTERVAL)return;try{{localStorage.setItem(LAST_KEY,String(Date.now()))}}catch{{}}const p=document.createElement('div');p.id=PROMPT_ID;p.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';p.innerHTML=`<div style="width:min(350px,100%);background:#111820;color:#fff;border:1px solid #394657;border-radius:14px;padding:16px;font:13px Arial,sans-serif;box-shadow:0 16px 48px #0008"><b style="display:block;text-align:center;font-size:16px">Install SakaLuX Script Hub?</b><div style="margin-top:7px;color:#cbd5e1;line-height:1.4;text-align:center">Manage every SakaLuX add-on from one place with shared settings and controls.</div><div style="display:flex;gap:7px;margin-top:12px"><button type="button" data-later style="flex:1;padding:9px;border-radius:8px;background:#202a36;color:#fff;border:1px solid #526174">Later</button><button type="button" data-install style="flex:1;padding:9px;border-radius:8px;background:#6a4d12;color:#fff4cf;border:1px solid #cda84e;font-weight:900">Install Hub</button></div></div>`;(document.body||document.documentElement).appendChild(p);p.querySelector('[data-later]').onclick=()=>p.remove();p.querySelector('[data-install]').onclick=()=>location.href=HUB_URL;}}
  function start(){{registerSelf();render();setTimeout(maybePrompt,1200);let t=0;new MutationObserver(()=>{{clearTimeout(t);t=setTimeout(()=>{{registerSelf();render();}},80);}}).observe(document.documentElement,{{childList:true,subtree:true}});setInterval(()=>{{registerSelf();render();maybePrompt();}},60000);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{{once:true}});else start();
}})();
/* SakaLuX Standalone Dock Bootstrap — END */'''

note='Refined standalone dock with centered typography, compact premium styling, balanced icon/name alignment and a subtler Hub install action. The native S launcher remains the only primary dock toggle when available; the shared Hub reminder remains limited to once every 12 hours.'

for sid,(fn,name,icon,selector,fallback,runtime,md) in FILES.items():
    p=Path(fn); t=p.read_text()
    v=versions[sid]
    t=re.sub(r'(^// @version\s+)[^\s]+',r'\g<1>'+v,t,count=1,flags=re.M)
    t=re.sub(r"const "+runtime+r"\s*=\s*['\"][^'\"]+['\"]",lambda m:re.sub(r"['\"][^'\"]+['\"]$","'"+v+"'",m.group(0)),t,count=1)
    cfg=json.dumps({'id':sid,'name':name,'icon':icon,'selector':selector,'fallback':fallback},ensure_ascii=False,separators=(',',':'))
    block=TPL.replace('{CFG}',cfg).replace('{VER}',v)
    t=re.sub(re.escape(BOOT_BEGIN)+r'[\s\S]*?'+re.escape(BOOT_END),block,t,count=1)
    p.write_text(t)
    d=Path(md); x=d.read_text()
    x=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+v+r'\2',x,count=1)
    x=re.sub(r'(## Current release note\s*\n)(.*?)(\n## )',lambda m:m.group(1)+note+m.group(3),x,count=1,flags=re.S)
    d.write_text(x)

hubp=Path('SakaLuX-Script-Hub.user.js'); hub=hubp.read_text()
for sid,v in versions.items():
    hub=re.sub(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,500}?version:\s*['\"])[^'\"]+",r'\g<1>'+v,hub,count=1)
# bump hub
hm=re.search(r'^// @version\s+([^\s]+)',hub,re.M); hv=bump(hm.group(1))
hub=re.sub(r'(^// @version\s+)[^\s]+',r'\g<1>'+hv,hub,count=1,flags=re.M)
hub=re.sub(r"const VERSION\s*=\s*['\"][^'\"]+['\"]","const VERSION = '"+hv+"'",hub,count=1)
entry="""        {\n            version: '%s',\n            date: '2026-09-12',\n            changes: [\n                'Refined the standalone SakaLuX dock into a smaller centered premium layout.',\n                'Centered module names visually while preserving dedicated icons and native S launcher control.',\n                'Kept the shared Hub install reminder limited to once every 12 hours.'\n            ]\n        },\n"""%hv
hub=hub.replace('    const HUB_CHANGELOG = [\n','    const HUB_CHANGELOG = [\n'+entry,1)
hubp.write_text(hub)

hi=Path('greasyfork/Script-Hub.md'); h=hi.read_text()
h=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+hv+r'\2',h,count=1)
h=re.sub(r'(## Current release note\s*\n)(.*?)(\n## )',lambda m:m.group(1)+'Refined the standalone dock into a smaller centered premium layout with visually centered module labels, a subtler install action, and the native S launcher as the primary toggle. The shared Hub reminder remains limited to once every 12 hours.'+m.group(3),h,count=1,flags=re.S)
for sid,(fn,name,icon,selector,fallback,runtime,md) in FILES.items():
    display={'bazaar':'Bazaar Thanker - PDA','mission-rewards':'Mission Rewards','market-intelligence':'Market Intelligence','elimination-assistant':'Elimination Assistant','enhancer':'Enhancer Guard'}[sid]
    h=re.sub(r'(- .*SakaLuX '+re.escape(display)+r' \*\*v)[^*]+(\*\*)',r'\g<1>'+versions[sid]+r'\2',h)
hi.write_text(h)
print('published',versions,'hub',hv)
