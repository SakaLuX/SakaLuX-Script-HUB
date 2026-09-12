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
    p=str(v).split('.')
    p[-1]=str(int(p[-1])+1)
    return '.'.join(p)

def set_runtime_version(text,const_name,version):
    pat=r"const\s+"+re.escape(const_name)+r"\s*=\s*['\"][^'\"]+['\"]"
    return re.sub(pat, f"const {const_name}='{version}'", text, count=1)

registry=json.loads(Path('scripts.json').read_text())
versions={}
for item in registry['scripts']:
    if item['id'] in FILES:
        item['version']=bump(item['version'])
        versions[item['id']]=item['version']
Path('scripts.json').write_text(json.dumps(registry,indent=2,ensure_ascii=False)+'\n')

BOOT_BEGIN='/* SakaLuX Standalone Dock Bootstrap — BEGIN */'
BOOT_END='/* SakaLuX Standalone Dock Bootstrap — END */'

TPL=r'''/* SakaLuX Standalone Dock Bootstrap — BEGIN */
(() => {
  'use strict';
  const SELF=Object.assign(__CFG__,{version:'__VER__'});
  const HUB_URL='https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY='SakaLuX_HUB_INSTALL_PROMPT_LAST', INTERVAL=12*60*60*1000;
  const DOCK_ID='sakalux-standalone-dock', PROMPT_ID='sakalux-hub-install-prompt', STYLE_ID='sakalux-standalone-dock-style';
  const NATIVE_ID='sakalux-standalone-native-s', FALLBACK_ID='sakalux-standalone-fallback-s';
  const REG_ATTR='data-slx-standalone-registration', OPEN_KEY='SakaLuX_STANDALONE_DOCK_OPEN';
  const ORDER=['enhancer','bazaar','mission-rewards','market-intelligence','elimination-assistant'];
  const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.querySelector('[data-sakalux-hub-installed="1"]'));

  function registerSelf(){
    let m=document.querySelector(`[${REG_ATTR}="${SELF.id}"]`);
    if(!m){m=document.createElement('span');m.setAttribute(REG_ATTR,SELF.id);m.hidden=true;(document.body||document.documentElement).appendChild(m);}
    Object.assign(m.dataset,SELF);
  }

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
#${DOCK_ID}{position:fixed;right:10px;bottom:74px;z-index:2147483000;width:min(198px,calc(100vw - 20px));max-height:min(58vh,390px);overflow:hidden;padding:9px;background:linear-gradient(180deg,rgba(10,14,20,.988),rgba(7,10,15,.988));border:1px solid rgba(255,255,255,.07);border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.03);backdrop-filter:blur(12px);font-family:Inter,Arial,sans-serif;display:none}
#${DOCK_ID}[data-open="1"]{display:block}
#${DOCK_ID} .slx-dock-head{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;padding:4px 6px 10px;margin-bottom:7px;border-bottom:1px solid rgba(255,255,255,.055)}
#${DOCK_ID} .slx-dock-mark{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(180deg,#293545,#1a2430);border:1px solid rgba(223,189,97,.38);color:#dfbd61;font:900 16px/30px Arial,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.2)}
#${DOCK_ID} .slx-dock-title{color:#f4f7fb;font-size:11px;font-weight:900;line-height:1.15;letter-spacing:.01em;text-align:center}
#${DOCK_ID} .slx-dock-sub{color:#8693a3;font-size:8px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;text-align:center}
#${DOCK_ID} .slx-dock-items{display:flex;flex-direction:column;gap:6px;max-height:calc(min(58vh,390px) - 116px);overflow:auto;padding-top:2px}
#${DOCK_ID} .slx-dock-row{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:42px!important;margin:0!important;padding:0 12px!important;box-sizing:border-box!important;inset:auto!important;border:1px solid rgba(255,255,255,.075)!important;border-radius:14px!important;background:linear-gradient(180deg,rgba(17,25,35,.96),rgba(12,18,26,.96))!important;color:#f2f5f9!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.02),0 4px 10px rgba(0,0,0,.14)!important;overflow:hidden!important;transform:none!important}
#${DOCK_ID} .slx-dock-row:active{transform:scale(.985)!important;background:linear-gradient(180deg,#1b2531,#141c26)!important}
#${DOCK_ID} .slx-left{width:22px;height:22px;min-width:22px;display:grid;place-items:center;border-radius:7px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#202b38,#151d27);box-shadow:inset 0 1px 0 rgba(255,255,255,.03);z-index:1}
#${DOCK_ID} .slx-left .i{font-size:13px;line-height:1}
#${DOCK_ID} .slx-title{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:112px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;font:800 10px/1 Arial,sans-serif;letter-spacing:.01em;pointer-events:none}
#${DOCK_ID} .slx-right-pad{margin-left:auto;width:22px;min-width:22px;height:22px;opacity:0;pointer-events:none}
#${DOCK_ID} .slx-dock-install{display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:8px!important;padding:8px 10px!important;border-radius:13px!important;background:linear-gradient(180deg,#80601d,#624813)!important;border:1px solid rgba(223,189,97,.54)!important;color:#fff3cb!important;text-align:center!important;text-decoration:none!important;font:800 10px Arial,sans-serif!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.16)!important}
#${DOCK_ID} .slx-dock-install:active{transform:scale(.985)}
#${NATIVE_ID}{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border:0!important;list-style:none!important;background:none!important;box-shadow:none!important}#${NATIVE_ID}::before,#${NATIVE_ID}::after{content:none!important;display:none!important}#${NATIVE_ID} .slx-s-link{display:grid!important;place-items:center!important;width:17px!important;height:17px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;text-decoration:none!important;color:#dfbd61!important;font:900 15px/17px Arial,sans-serif!important;text-shadow:0 1px 1px rgba(0,0,0,.72),0 0 4px rgba(223,189,97,.18)!important}#${NATIVE_ID} .slx-s-link:active{transform:scale(.9)!important}
#${FALLBACK_ID}{position:fixed;right:10px;bottom:78px;z-index:2147483001;width:32px;height:32px;padding:0;border:1px solid #64748b;border-radius:9px;background:linear-gradient(145deg,#202b39,#111923);color:#dfbd61;box-shadow:0 8px 22px rgba(0,0,0,.42);font:900 15px Arial;display:none;align-items:center;justify-content:center}
body:not([data-sakalux-hub-active="1"]) :is(#sl-eg-button,#sakalux-bt-settings-button,#sl-mri-button,#sl-mi-button,#slx-elim-btn){display:none!important}
`;
    (document.head||document.documentElement).appendChild(s);
  }

  function findStatusIconList(){
    const selectors=['ul[class*="statusIcons"][class*="big"]','ul[class*="status-icons"][class*="big"]','ul[class*="statusIcons"]','ul[class*="status-icons"]'];
    const lists=selectors.flatMap(q=>[...document.querySelectorAll(q)]);
    return lists.find(list=>list.isConnected&&[...list.children].some(item=>item.querySelector?.('a')))||null;
  }
  function copyNativeCell(item,list){
    const ref=[...list.children].find(x=>x!==item&&x.querySelector?.('a')); if(!ref) return;
    const native=[...ref.classList].filter(x=>x&&!x.startsWith('slx-')&&!x.startsWith('sakalux-'));
    item.className=[...native,'slx-standalone-native'].join(' ');
  }
  function toggleDock(force){
    const d=ensureDock(); if(!d) return;
    const next=typeof force==='boolean'?force:d.dataset.open!=='1';
    d.dataset.open=next?'1':'0';
    try{localStorage.setItem(OPEN_KEY,next?'1':'0')}catch{}
  }
  function ensureNativeLauncher(){
    if(hubInstalled()){document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return false;}
    const list=findStatusIconList(); let item=document.getElementById(NATIVE_ID);
    if(list){
      if(!item){item=document.createElement('li');item.id=NATIVE_ID;item.innerHTML='<a href="#" class="slx-s-link" aria-label="SakaLuX Scripts" title="SakaLuX Scripts">S</a>';item.querySelector('a').onclick=e=>{e.preventDefault();e.stopPropagation();toggleDock();};}
      copyNativeCell(item,list);
      const children=[...list.children].filter(x=>x!==item);
      const cashIndex=children.findIndex(x=>/\$|cash|money/i.test((x.textContent||'')+' '+(x.className||'')));
      const anchor=cashIndex>=0?children[cashIndex]:children[0];
      if(anchor) anchor.insertAdjacentElement('afterend',item); else list.appendChild(item);
      document.getElementById(FALLBACK_ID)?.remove(); return true;
    }
    item?.remove();
    let fb=document.getElementById(FALLBACK_ID);
    if(!fb){fb=document.createElement('button');fb.id=FALLBACK_ID;fb.type='button';fb.textContent='S';fb.title='SakaLuX Scripts';fb.onclick=()=>toggleDock();(document.body||document.documentElement).appendChild(fb);}
    fb.style.display='flex'; return false;
  }
  function ensureDock(){
    if(hubInstalled()){document.body?.setAttribute('data-sakalux-hub-active','1');document.getElementById(DOCK_ID)?.remove();document.getElementById(PROMPT_ID)?.remove();document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return null;}
    document.body?.removeAttribute('data-sakalux-hub-active'); addStyle();
    let d=document.getElementById(DOCK_ID); if(d) return d;
    d=document.createElement('div'); d.id=DOCK_ID; d.dataset.open=localStorage.getItem(OPEN_KEY)==='1'?'1':'0';
    d.innerHTML=`<div class="slx-dock-head"><span class="slx-dock-mark">S</span><div class="slx-dock-title">SakaLuX Scripts</div><div class="slx-dock-sub">Standalone</div></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${HUB_URL}">Install SakaLuX Hub</a>`;
    (document.body||document.documentElement).appendChild(d); return d;
  }
  function openEntry(data){const el=data.selector?document.querySelector(data.selector):null;if(el){el.click();return;}if(data.fallback)location.href=data.fallback;}
  function render(){
    const d=ensureDock(); if(!d) return;
    const box=d.querySelector('.slx-dock-items');
    const regs=[...document.querySelectorAll(`[${REG_ATTR}]`)].map(x=>x.dataset).filter(x=>x.id);
    regs.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id)); box.replaceChildren();
    for(const r of regs){
      const b=document.createElement('button'); b.type='button'; b.className='slx-dock-row';
      b.innerHTML=`<span class="slx-left"><span class="i">${r.icon||'•'}</span></span><span class="slx-title">${r.name||r.id}</span><span class="slx-right-pad"></span>`;
      b.onclick=()=>openEntry(r); box.appendChild(b);
    }
    ensureNativeLauncher();
  }
  function maybePrompt(){
    if(hubInstalled()||document.getElementById(PROMPT_ID)) return;
    let last=0; try{last=Number(localStorage.getItem(LAST_KEY)||0)}catch{}
    if(last&&Date.now()-last<INTERVAL) return;
    try{localStorage.setItem(LAST_KEY,String(Date.now()))}catch{}
    const p=document.createElement('div'); p.id=PROMPT_ID; p.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';
    p.innerHTML=`<div style="width:min(350px,100%);background:#111820;color:#fff;border:1px solid #394657;border-radius:14px;padding:16px;font:13px Arial,sans-serif;box-shadow:0 16px 48px #0008"><b style="display:block;text-align:center;font-size:16px">Install SakaLuX Script Hub?</b><div style="margin-top:7px;color:#cbd5e1;line-height:1.4;text-align:center">Manage every SakaLuX add-on from one place with shared settings and controls.</div><div style="display:flex;gap:7px;margin-top:12px"><button type="button" data-later style="flex:1;padding:9px;border-radius:8px;background:#202a36;color:#fff;border:1px solid #526174">Later</button><button type="button" data-install style="flex:1;padding:9px;border-radius:8px;background:#6a4d12;color:#fff4cf;border:1px solid #cda84e;font-weight:900">Install Hub</button></div></div>`;
    (document.body||document.documentElement).appendChild(p);
    p.querySelector('[data-later]').onclick=()=>p.remove();
    p.querySelector('[data-install]').onclick=()=>location.href=HUB_URL;
  }
  function start(){registerSelf();render();setTimeout(maybePrompt,1200);let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{registerSelf();render();},80);}).observe(document.documentElement,{childList:true,subtree:true});setInterval(()=>{registerSelf();render();maybePrompt();},60000);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
/* SakaLuX Standalone Dock Bootstrap — END */'''

note='Ultra-professional standalone dock polish: icon badges now sit inside balanced button geometry, labels are optically centered, spacing and shadows are refined, the Hub action is visually quieter, and the native S launcher remains the only primary toggle. The shared Hub reminder remains limited to once every 12 hours.'

for sid,(fn,name,icon,selector,fallback,runtime,md) in FILES.items():
    p=Path(fn); t=p.read_text(); v=versions[sid]
    t=re.sub(r'(^// @version\s+)[^\s]+',r'\g<1>'+v,t,count=1,flags=re.M)
    t=set_runtime_version(t,runtime,v)
    cfg=json.dumps({'id':sid,'name':name,'icon':icon,'selector':selector,'fallback':fallback},ensure_ascii=False,separators=(',',':'))
    block=TPL.replace('__CFG__',cfg).replace('__VER__',v)
    t=re.sub(re.escape(BOOT_BEGIN)+r'[\s\S]*?'+re.escape(BOOT_END),lambda m:block,t,count=1)
    p.write_text(t)
    d=Path(md)
    if d.exists():
        x=d.read_text()
        x=re.sub(r'(## Current version\s*\n+)[^\n]+',lambda m:m.group(1)+v,x,count=1)
        if '## Current release note' in x:
            x=re.sub(r'(## Current release note\s*\n+)([\s\S]*?)(?=\n## )',lambda m:m.group(1)+note+'\n',x,count=1)
        d.write_text(x)

hub=Path('SakaLuX-Script-Hub.user.js'); h=hub.read_text()
hub_m=re.search(r'^// @version\s+([^\s]+)',h,re.M)
hub_v=bump(hub_m.group(1))
h=re.sub(r'(^// @version\s+)[^\s]+',r'\g<1>'+hub_v,h,count=1,flags=re.M)
h=re.sub(r"const VERSION\s*=\s*['\"][^'\"]+['\"]",f"const VERSION = '{hub_v}'",h,count=1)
for sid,v in versions.items():
    h=re.sub(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,260}?version:\s*['\"])[^'\"]+",r'\g<1>'+v,h,count=1)
entry=f"""        {{\n            version: '{hub_v}',\n            date: '2026-09-12',\n            changes: [\n                'Final standalone dock polish with icon badges and true optical centering.',\n                'Refined compact spacing, borders, shadows and Hub install action for a more professional mobile presentation.',\n                'Keeps the native S launcher after cash and the shared 12-hour Hub reminder behavior.'\n            ]\n        }},\n"""
h=h.replace('    const HUB_CHANGELOG = [\n','    const HUB_CHANGELOG = [\n'+entry,1)
hub.write_text(h)

hubmd=Path('greasyfork/Script-Hub.md')
if hubmd.exists():
    x=hubmd.read_text()
    x=re.sub(r'(## Current version\s*\n+)[^\n]+',lambda m:m.group(1)+hub_v,x,count=1)
    if '## Current release note' in x:
        x=re.sub(r'(## Current release note\s*\n+)([\s\S]*?)(?=\n## )',lambda m:m.group(1)+note+'\n',x,count=1)
    for sid,v in versions.items():
        name=FILES[sid][1]
        x=re.sub(r'('+re.escape(name)+r'[^\n]*?v)\d+(?:\.\d+)+',r'\g<1>'+v,x)
    hubmd.write_text(x)

print('published',versions,'hub',hub_v)
