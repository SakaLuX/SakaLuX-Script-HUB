from pathlib import Path

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      0.9.3','// @version      0.9.4',1)
s=s.replace("const VERSION='0.9.3';","const VERSION='0.9.4';",1)

old_css="#${IDS.dock}{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:2px!important;z-index:2147483644;order:2147483647!important;flex:0 0 auto!important}.slx-rem-btn{box-sizing:border-box!important;width:19px!important;height:19px!important;min-width:19px!important;min-height:19px!important;max-width:19px!important;max-height:19px!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:inherit!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:14px!important;font-weight:400!important;line-height:1!important;box-shadow:none!important;vertical-align:middle!important;overflow:visible!important;-webkit-appearance:none!important;appearance:none!important;-webkit-tap-highlight-color:transparent!important}.slx-rem-btn:active{transform:scale(.92)!important;opacity:.8!important}.slx-rem-fallback{position:fixed;right:10px;top:180px;display:flex;flex-direction:row;gap:3px;z-index:2147483643}"
new_css="#${IDS.dock}{--slx-rem-size:34px;--slx-rem-font:17px;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:4px!important;z-index:2147483644;order:2147483647!important;flex:0 0 auto!important}.slx-rem-btn{box-sizing:border-box!important;width:var(--slx-rem-size)!important;height:var(--slx-rem-size)!important;min-width:var(--slx-rem-size)!important;min-height:var(--slx-rem-size)!important;max-width:var(--slx-rem-size)!important;max-height:var(--slx-rem-size)!important;padding:0!important;margin:0!important;border:1px solid rgba(150,170,190,.34)!important;border-radius:50%!important;background:rgba(15,28,40,.72)!important;color:inherit!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:var(--slx-rem-font)!important;font-weight:600!important;line-height:1!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03)!important;vertical-align:middle!important;overflow:hidden!important;-webkit-appearance:none!important;appearance:none!important;-webkit-tap-highlight-color:transparent!important}.slx-rem-btn:active{transform:scale(.92)!important;opacity:.8!important}.slx-rem-fallback{position:fixed;right:10px;top:180px;display:flex;flex-direction:row;gap:3px;z-index:2147483643}"
if old_css not in s:
    raise SystemExit('CSS anchor not found')
s=s.replace(old_css,new_css,1)

old_ensure="""  d.className='';
  d.style.cssText='display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:4px!important;position:static!important;inset:auto!important;margin:0 2px!important;padding:0!important;width:auto!important;height:19px!important;min-height:19px!important;z-index:auto!important;vertical-align:middle!important;flex:0 0 auto!important;';
  return d
"""
new_ensure="""  d.className='';
  const samples=[...row.children].filter(x=>x!==d&&x.id!==IDS.native).map(x=>x.getBoundingClientRect()).filter(r=>r.width>=24&&r.width<=46&&r.height>=24&&r.height<=46);
  if(samples.length){const vals=samples.map(r=>Math.round(Math.min(r.width,r.height))).sort((a,b)=>a-b),size=vals[Math.floor(vals.length/2)];d.style.setProperty('--slx-rem-size',size+'px');d.style.setProperty('--slx-rem-font',Math.max(14,Math.round(size*.48))+'px')}
  d.style.cssText+='display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:4px!important;position:static!important;inset:auto!important;margin:0 2px!important;padding:0!important;width:auto!important;height:auto!important;min-height:0!important;z-index:auto!important;vertical-align:middle!important;flex:0 0 auto!important;';
  return d
"""
if old_ensure not in s:
    raise SystemExit('ensureDock anchor not found')
s=s.replace(old_ensure,new_ensure,1)

a=s.index('function iconButton(id,text,title,fn){')
b=s.index('function syncReminderIcons()',a)
new_icon="""function iconButton(id,text,title,fn){
 const b=document.createElement('button');
 b.type='button';b.id=id;b.className='slx-rem-btn';b.textContent=text;b.title=title;b.setAttribute('aria-label',title);
 b.onclick=e=>{e.preventDefault();e.stopPropagation();fn()};
 return b
}
"""
s=s[:a]+new_icon+s[b:]
p.write_text(s,encoding='utf-8')

d=Path('greasyfork/SakaLuX-Suite.md')
t=d.read_text(encoding='utf-8')
t=t.replace('**v0.9.3**','**v0.9.4**',1)
if '### v0.9.4 — native-row reminder scale' not in t:
    t += '\n\n### v0.9.4 — native-row reminder scale\n- Daily Prayer Bell, Recovery Planner and Chain Alarm controls now measure the surrounding Torn resource-row controls and automatically use the median native icon size.\n- Removed cloning of the larger SakaLuX launcher for reminder buttons, preventing oversized circular controls.\n- Reminder buttons keep a compact circular Torn-style shell and scale their symbol proportionally for PDA/mobile.\n'
d.write_text(t,encoding='utf-8')
