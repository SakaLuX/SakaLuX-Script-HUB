from pathlib import Path
import json,re

ROOT=Path('.')
BEGIN='/* SakaLuX Standalone Dock Bootstrap — BEGIN */'
END='/* SakaLuX Standalone Dock Bootstrap — END */'
RELEASE='Standalone Dock v3 is smaller and cleaner, opens from a native gold S icon mounted after Torn cash, removes the + control, uses a compact fallback S only when the native status bar is unavailable, and keeps the shared Hub reminder limited to once every 12 hours.'

CONFIG={
'SakaLuX-Enhancer-Guard.user.js':dict(id='enhancer',name='Enhancer',icon='🛡️',selector='#sl-eg-button',fallback='https://www.torn.com/item.php',runtime='VERSION'),
'SakaLuX-Bazaar-Thanker-PDA.user.js':dict(id='bazaar',name='Bazaar',icon='💬',selector='#sakalux-bt-settings-button',fallback='https://www.torn.com/page.php?sid=events',runtime='BAZAAR_VERSION'),
'SakaLuX-Mission-Rewards.user.js':dict(id='mission-rewards',name='Mission Rewards',icon='🎯',selector='#sl-mri-button',fallback='https://www.torn.com/page.php?sid=missions',runtime='VERSION'),
'SakaLuX-Market-Intelligence.user.js':dict(id='market-intelligence',name='Market',icon='📈',selector='#sl-mi-button',fallback='https://www.torn.com/page.php?sid=ItemMarket',runtime='VERSION'),
'SakaLuX-Elimination-Assistant.user.js':dict(id='elimination-assistant',name='Elimination',icon='⚔️',selector='#slx-elim-btn',fallback='https://www.torn.com/page.php?sid=elimination',runtime='VERSION'),
}
DOCS={
'enhancer':'greasyfork/Enhancer-Guard.md','bazaar':'greasyfork/Bazaar-Thanker.md','mission-rewards':'greasyfork/Mission-Rewards.md','market-intelligence':'greasyfork/Market-Intelligence.md','elimination-assistant':'greasyfork/Elimination-Assistant.md'}
ORDER=['enhancer','bazaar','mission-rewards','market-intelligence','elimination-assistant']

def bump(v):
    p=v.split('.')
    p[-1]=str(int(p[-1])+1)
    return '.'.join(p)

def current_version(text):
    m=re.search(r'^// @version\s+([^\s]+)\s*$',text,re.M)
    if not m: raise RuntimeError('missing @version')
    return m.group(1)

def block(c,version):
    cfg=json.dumps({k:c[k] for k in ('id','name','icon','selector','fallback')},ensure_ascii=False,separators=(',',':'))
    return f'''{BEGIN}
(() => {{
  'use strict';
  const SELF=Object.assign({cfg},{{version:'{version}'}});
  const HUB_URL='https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY='SakaLuX_HUB_INSTALL_PROMPT_LAST', INTERVAL=12*60*60*1000;
  const DOCK_ID='sakalux-standalone-dock', PROMPT_ID='sakalux-hub-install-prompt', STYLE_ID='sakalux-standalone-dock-style';
  const NATIVE_ID='sakalux-standalone-native-s', FALLBACK_ID='sakalux-standalone-fallback-s';
  const REG_ATTR='data-slx-standalone-registration';
  const OPEN_KEY='SakaLuX_STANDALONE_DOCK_OPEN';
  const ORDER={json.dumps(ORDER)};
  const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.querySelector('[data-sakalux-hub-installed="1"]'));

  function registerSelf(){{
    let m=document.querySelector(`[${{REG_ATTR}}="${{SELF.id}}"]`);
    if(!m){{m=document.createElement('span');m.setAttribute(REG_ATTR,SELF.id);m.hidden=true;(document.body||document.documentElement).appendChild(m);}}
    Object.assign(m.dataset,SELF);
  }}

  function addStyle(){{
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#${{DOCK_ID}}{{position:fixed;right:9px;bottom:74px;z-index:2147483000;width:min(208px,calc(100vw - 18px));max-height:min(62vh,420px);overflow:hidden;padding:6px;background:linear-gradient(160deg,rgba(20,27,37,.985),rgba(10,15,22,.985));border:1px solid rgba(121,145,174,.34);border-radius:13px;box-shadow:0 12px 34px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.035);backdrop-filter:blur(10px);font-family:Inter,Arial,sans-serif;display:none}}
#${{DOCK_ID}}[data-open="1"]{{display:block}}
#${{DOCK_ID}} .slx-dock-head{{display:flex;align-items:center;gap:7px;padding:3px 5px 7px;margin-bottom:2px;border-bottom:1px solid rgba(121,145,174,.16)}}
#${{DOCK_ID}} .slx-dock-mark{{width:20px;height:20px;display:grid;place-items:center;border-radius:7px;background:linear-gradient(145deg,#2a3544,#151d27);border:1px solid rgba(215,169,74,.34);color:#e6c56e;font:900 12px Arial}}
#${{DOCK_ID}} .slx-dock-title{{flex:1;min-width:0;color:#eef3f8;font-size:11px;font-weight:900;letter-spacing:.02em}}#${{DOCK_ID}} .slx-dock-sub{{color:#77889d;font-size:7px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}}
#${{DOCK_ID}} .slx-dock-items{{display:flex;flex-direction:column;gap:3px;max-height:calc(min(62vh,420px) - 78px);overflow:auto;padding-top:4px}}
#${{DOCK_ID}} .slx-dock-row{{display:flex!important;align-items:center!important;gap:7px!important;width:100%!important;min-height:30px!important;margin:0!important;padding:5px 7px!important;box-sizing:border-box!important;position:static!important;inset:auto!important;transform:none!important;border:1px solid rgba(121,145,174,.22)!important;border-radius:8px!important;background:linear-gradient(180deg,#1a2430,#141c26)!important;color:#e9eef5!important;font:800 10px/1.15 Arial,sans-serif!important;text-align:left!important;white-space:nowrap!important;overflow:hidden!important;box-shadow:none!important}}
#${{DOCK_ID}} .slx-dock-row:active{{background:#223044!important;transform:scale(.985)!important}}#${{DOCK_ID}} .slx-dock-row .i{{width:16px;flex:0 0 16px;text-align:center;font-size:12px}}#${{DOCK_ID}} .slx-dock-row .n{{overflow:hidden;text-overflow:ellipsis}}
#${{DOCK_ID}} .slx-dock-install{{display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:5px!important;padding:6px 8px!important;border-radius:8px!important;background:linear-gradient(180deg,#8a6417,#65470f)!important;border:1px solid rgba(236,194,91,.7)!important;color:#fff4cf!important;text-align:center!important;text-decoration:none!important;font:900 9px Arial,sans-serif!important;letter-spacing:.02em}}
#${{NATIVE_ID}}{{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border:0!important;list-style:none!important;vertical-align:top!important;background:none!important;box-shadow:none!important;overflow:visible!important}}#${{NATIVE_ID}}::before,#${{NATIVE_ID}}::after{{content:none!important;display:none!important}}#${{NATIVE_ID}} .slx-s-link{{display:grid!important;place-items:center!important;width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;text-decoration:none!important;box-shadow:none!important;color:#dfbd61!important;font:900 15px/17px Arial,sans-serif!important;text-shadow:0 1px 1px rgba(0,0,0,.7),0 0 4px rgba(223,189,97,.2)!important}}#${{NATIVE_ID}} .slx-s-link:active{{transform:scale(.9)!important}}
#${{FALLBACK_ID}}{{position:fixed;right:10px;bottom:78px;z-index:2147483001;width:34px;height:34px;padding:0;border:1px solid #68788d;border-radius:10px;background:linear-gradient(145deg,#202b39,#111923);color:#dfbd61;box-shadow:0 8px 22px rgba(0,0,0,.45);font:900 16px Arial;display:none;align-items:center;justify-content:center}}
body:not([data-sakalux-hub-active="1"]) :is(#sl-eg-button,#sakalux-bt-settings-button,#sl-mri-button,#sl-mi-button,#slx-elim-btn){{display:none!important}}
`; (document.head||document.documentElement).appendChild(s);
  }}

  function findStatusIconList(){{
    const selectors=['ul[class*="statusIcons"][class*="big"]','ul[class*="status-icons"][class*="big"]','ul[class*="statusIcons"]','ul[class*="status-icons"]'];
    const lists=selectors.flatMap(q=>[...document.querySelectorAll(q)]);
    return lists.find(list=>list.isConnected&&[...list.children].some(item=>item.querySelector?.('a')))||null;
  }}
  function copyNativeCell(item,list){{
    const ref=[...list.children].find(x=>x!==item&&x.querySelector?.('a'));if(!ref)return;
    const native=[...ref.classList].filter(x=>x&&!x.startsWith('slx-')&&!x.startsWith('sakalux-'));
    item.className=[...native,'slx-standalone-native'].join(' ');
  }}
  function toggleDock(force){{
    const d=ensureDock();if(!d)return;
    const next=typeof force==='boolean'?force:d.dataset.open!=='1';d.dataset.open=next?'1':'0';try{{localStorage.setItem(OPEN_KEY,next?'1':'0')}}catch{{}}
  }}
  function ensureNativeLauncher(){{
    if(hubInstalled()){{document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return false;}}
    const list=findStatusIconList();
    let item=document.getElementById(NATIVE_ID);
    if(list){{
      if(!item){{item=document.createElement('li');item.id=NATIVE_ID;item.innerHTML='<a href="#" class="slx-s-link" aria-label="SakaLuX Scripts" title="SakaLuX Scripts">S</a>';item.querySelector('a').onclick=e=>{{e.preventDefault();e.stopPropagation();toggleDock();}};}}
      copyNativeCell(item,list);
      const first=[...list.children].find(x=>x!==item);
      if(first)first.insertAdjacentElement('afterend',item);else list.appendChild(item);
      document.getElementById(FALLBACK_ID)?.remove();return true;
    }}
    item?.remove();
    let fb=document.getElementById(FALLBACK_ID);if(!fb){{fb=document.createElement('button');fb.id=FALLBACK_ID;fb.type='button';fb.textContent='S';fb.title='SakaLuX Scripts';fb.onclick=()=>toggleDock();(document.body||document.documentElement).appendChild(fb);}}
    fb.style.display='flex';return false;
  }}

  function ensureDock(){{
    if(hubInstalled()){{document.body?.setAttribute('data-sakalux-hub-active','1');document.getElementById(DOCK_ID)?.remove();document.getElementById(PROMPT_ID)?.remove();document.getElementById(NATIVE_ID)?.remove();document.getElementById(FALLBACK_ID)?.remove();return null;}}
    document.body?.removeAttribute('data-sakalux-hub-active');addStyle();let d=document.getElementById(DOCK_ID);if(d)return d;
    d=document.createElement('div');d.id=DOCK_ID;d.dataset.open=localStorage.getItem(OPEN_KEY)==='1'?'1':'0';d.innerHTML=`<div class="slx-dock-head"><span class="slx-dock-mark">S</span><span class="slx-dock-title">SakaLuX Scripts<div class="slx-dock-sub">Standalone</div></span></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${{HUB_URL}}">Install SakaLuX Hub</a>`;(document.body||document.documentElement).appendChild(d);return d;
  }}
  function openEntry(data){{const el=data.selector?document.querySelector(data.selector):null;if(el){{el.click();return;}}if(data.fallback)location.href=data.fallback;}}
  function render(){{const d=ensureDock();if(!d)return;const box=d.querySelector('.slx-dock-items');const regs=[...document.querySelectorAll(`[${{REG_ATTR}}]`)].map(x=>x.dataset).filter(x=>x.id);regs.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id));box.replaceChildren();for(const r of regs){{const b=document.createElement('button');b.type='button';b.className='slx-dock-row';b.innerHTML=`<span class="i">${{r.icon||'•'}}</span><span class="n">${{r.name||r.id}}</span>`;b.onclick=()=>openEntry(r);box.appendChild(b);}}ensureNativeLauncher();}}
  function maybePrompt(){{if(hubInstalled()||document.getElementById(PROMPT_ID))return;let last=0;try{{last=Number(localStorage.getItem(LAST_KEY)||0)}}catch{{}}if(last&&Date.now()-last<INTERVAL)return;try{{localStorage.setItem(LAST_KEY,String(Date.now()))}}catch{{}}const p=document.createElement('div');p.id=PROMPT_ID;p.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';p.innerHTML=`<div style="width:min(360px,100%);background:#111820;color:#fff;border:1px solid #465365;border-radius:14px;padding:16px;font:13px Arial,sans-serif;box-shadow:0 16px 48px #0008"><b style="font-size:16px">Install SakaLuX Script Hub?</b><div style="margin-top:7px;color:#cbd5e1;line-height:1.4">Manage every SakaLuX add-on from one place with shared settings and controls.</div><div style="display:flex;gap:7px;margin-top:12px"><button type="button" data-later style="flex:1;padding:9px;border-radius:8px;background:#202a36;color:#fff;border:1px solid #526174">Later</button><button type="button" data-install style="flex:1;padding:9px;border-radius:8px;background:#76540e;color:#fff4cf;border:1px solid #d7a94a;font-weight:900">Install Hub</button></div></div>`;(document.body||document.documentElement).appendChild(p);p.querySelector('[data-later]').onclick=()=>p.remove();p.querySelector('[data-install]').onclick=()=>location.href=HUB_URL;}}
  function start(){{registerSelf();render();setTimeout(maybePrompt,1200);let t=0;new MutationObserver(()=>{{clearTimeout(t);t=setTimeout(()=>{{registerSelf();render();}},80);}}).observe(document.documentElement,{{childList:true,subtree:true}});setInterval(()=>{{registerSelf();render();maybePrompt();}},60000);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{{once:true}});else start();
}})();
{END}'''

versions={}
for fn,c in CONFIG.items():
    p=ROOT/fn;text=p.read_text(encoding='utf-8');old=current_version(text);new=bump(old);versions[c['id']]=new
    text=re.sub(r'^// @version\s+[^\s]+\s*$',f'// @version      {new}',text,count=1,flags=re.M)
    text=re.sub(re.escape(BEGIN)+r'[\s\S]*?'+re.escape(END),block(c,new),text,count=1)
    rn=c['runtime']
    text=re.sub(r'(const\s+'+re.escape(rn)+r'\s*=\s*[\'\"])[^\'\"]+([\'\"])',r'\g<1>'+new+r'\2',text,count=1)
    p.write_text(text,encoding='utf-8')
    print(fn,old,'->',new)

# Registry
rp=ROOT/'scripts.json';reg=json.loads(rp.read_text(encoding='utf-8'))
for item in reg['scripts']:
    if item['id'] in versions:item['version']=versions[item['id']]
rp.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub fallback + Hub version
hp=ROOT/'SakaLuX-Script-Hub.user.js';hub=hp.read_text(encoding='utf-8');hub_old=current_version(hub);hub_new=bump(hub_old)
hub=re.sub(r'^// @version\s+[^\s]+\s*$',f'// @version      {hub_new}',hub,count=1,flags=re.M)
hub=re.sub(r"(const VERSION\s*=\s*['\"])[^'\"]+(['\"])",r'\g<1>'+hub_new+r'\2',hub,count=1)
for sid,v in versions.items():
    hub=re.sub(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,500}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>'+v+r'\2',hub,count=1)
# add changelog newest
anchor='    const HUB_CHANGELOG = [\n'
entry=f"""        {{\n            version: '{hub_new}',\n            date: '2026-09-12',\n            changes: [\n                'Refined standalone add-on launcher into a smaller professional dock.',\n                'Replaced the dock + control with a native gold S status-bar launcher mounted after cash.',\n                'Added compact fallback S launcher only when Torn statusIcons are unavailable.'\n            ]\n        }},\n"""
if anchor in hub:hub=hub.replace(anchor,anchor+entry,1)
hp.write_text(hub,encoding='utf-8')

# Dedicated docs versions/release notes
for sid,path in DOCS.items():
    p=ROOT/path;t=p.read_text(encoding='utf-8');v=versions[sid]
    t=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+v+r'\2',t,count=1)
    t=re.sub(r'(## Current release note\s*\n)([\s\S]*?)(?=\n## )',r'\1'+RELEASE+'\n',t,count=1)
    hist='## Release history\n'
    note=f"### v{v} — Compact native S standalone launcher\n\n- Smaller professional standalone dock.\n- Native gold **S** launcher mounts after Torn cash and opens/closes the dock.\n- Removed the dock **+** control.\n- Compact fallback **S** appears only when Torn status icons are unavailable.\n- Shared Hub reminder remains limited to once every 12 hours.\n\n"
    if hist in t and f'### v{v} ' not in t:t=t.replace(hist,hist+note,1)
    p.write_text(t,encoding='utf-8')

# Hub doc
sp=ROOT/'greasyfork/Script-Hub.md';t=sp.read_text(encoding='utf-8')
t=re.sub(r'(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+hub_new+r'\2',t,count=1)
t=re.sub(r'(## Current release note\s*\n)([\s\S]*?)(?=\n## )',r'\1Compatibility release synchronized with Standalone Dock v3: compact professional dock and native gold S launcher after Torn cash.\n',t,count=1)
name_map={'enhancer':'Enhancer Guard','bazaar':'Bazaar Thanker - PDA','mission-rewards':'Mission Rewards','market-intelligence':'Market Intelligence','elimination-assistant':'Elimination Assistant'}
for sid,v in versions.items():
    t=re.sub(r'(- .*SakaLuX '+re.escape(name_map[sid])+r' \*\*v)[^*]+(\*\*)',r'\g<1>'+v+r'\2',t,count=1)
hist='## Release history\n';note=f"### v{hub_new} — Standalone Dock v3 compatibility\n\n- Synced managed add-on versions for the compact standalone dock release.\n- Standalone add-ons now use a native gold **S** launcher after cash instead of the dock **+** control.\n\n"
if hist in t and f'### v{hub_new} ' not in t:t=t.replace(hist,hist+note,1)
sp.write_text(t,encoding='utf-8')

print('Hub',hub_old,'->',hub_new)
