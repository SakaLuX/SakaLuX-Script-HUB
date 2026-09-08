from pathlib import Path

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      0.8.0','// @version      0.8.1',1)
s=s.replace("const VERSION='0.8.0';","const VERSION='0.8.1';",1)

# One-time migration: make the two reminder icons visible for existing installs
# where all internal modules were inherited as OFF from older experimental builds.
needle="for(const m of MODULES)if(typeof state[m.id]!=='boolean')state[m.id]=m.enabled;\nsave(K.modules,state);"
replacement="""for(const m of MODULES)if(typeof state[m.id]!=='boolean')state[m.id]=m.enabled;
const REMINDER_BOOTSTRAP='SakaLuX_SUITE_REMINDER_BOOTSTRAP_V1';
if(!localStorage.getItem(REMINDER_BOOTSTRAP)){
 state['daily-prayer']=true;
 state['recovery-planner']=true;
 localStorage.setItem(REMINDER_BOOTSTRAP,'1');
}
save(K.modules,state);"""
if needle not in s:
    raise SystemExit('state bootstrap anchor not found')
s=s.replace(needle,replacement,1)

# Make the dock attachment deterministic on Torn PDA/mobile.
start=s.index('function ensureDock(){')
end=s.index('function iconButton', start)
new_ensure=r'''function ensureDock(){
 let d=document.getElementById(IDS.dock);
 if(!d){d=document.createElement('div');d.id=IDS.dock}
 const target=settingsTarget();
 if(target?.parentElement){
  if(!d.isConnected){try{target.parentElement.insertBefore(d,target)}catch{}}
  if(d.isConnected){d.className='';d.style.display='flex';return d}
 }
 if(!d.isConnected){document.body.appendChild(d)}
 d.className='slx-rem-fallback';
 d.style.display='flex';
 d.style.position='fixed';
 d.style.right='10px';
 d.style.top='150px';
 d.style.zIndex='2147483644';
 return d
}
'''
s=s[:start]+new_ensure+s[end:]

# Only mark prayer complete from actual church-page confirmation text.
old="function observePrayerSuccess(){const t=(document.body.innerText||'').toLowerCase();if(state['daily-prayer']&&/you (?:have )?prayed|prayer (?:was )?successful|already prayed today/.test(t))markPrayed()}"
new="function observePrayerSuccess(){if(!/church\\.php/i.test(location.href))return;const t=(document.body.innerText||'').toLowerCase();if(state['daily-prayer']&&/you (?:have )?prayed|prayer (?:was )?successful|already prayed today/.test(t))markPrayed()}"
if old not in s:
    raise SystemExit('prayer observer anchor not found')
s=s.replace(old,new,1)

# Add a lightweight self-heal if the reminder dock was removed by Torn SPA rerenders.
old_interval="setInterval(()=>{if(!document.getElementById(IDS.native))nativeLauncher();syncLaunchers();syncReminderIcons();if(state['chain-alarm'])chainAlarm()},1800);"
new_interval="setInterval(()=>{if(!document.getElementById(IDS.native))nativeLauncher();syncLaunchers();if(!document.getElementById(IDS.dock))ensureDock();syncReminderIcons();if(state['chain-alarm'])chainAlarm()},1800);"
if old_interval not in s:
    raise SystemExit('interval anchor not found')
s=s.replace(old_interval,new_interval,1)

# Docs version bump.
doc=Path('greasyfork/SakaLuX-Suite.md')
if doc.exists():
    d=doc.read_text(encoding='utf-8')
    d=d.replace('**v0.8.0**','**v0.8.1**',1)
    d += "\n\n### v0.8.1\n- Fixed missing Daily Prayer Bell and Recovery Planner reminder icons on Torn PDA/mobile.\n- Added one-time reminder bootstrap for older installs that inherited those modules as OFF.\n- Hardened reminder dock placement and SPA self-healing.\n- Prayer completion is now only detected on the Church page.\n"
    doc.write_text(d,encoding='utf-8')

p.write_text(s,encoding='utf-8')
