#!/usr/bin/env python3
from pathlib import Path
p=Path('SakaLuX-Account-Auditor.user.js')
text=p.read_text(encoding='utf-8')
text=text.replace('// @version      1.3.19','// @version      1.3.20',1)
text=text.replace("const VERSION = '1.3.19';","const VERSION = '1.3.20';",1)
text=text.replace("version:'1.3.19'","version:'1.3.20'",1)

anchor="    async function keyInfo(key){return apiJsonWithRetry(withKey('https://api.torn.com/v2/key/info',key));}\n"
insert="""    async function keyInfo(key){return apiJsonWithRetry(withKey('https://api.torn.com/v2/key/info',key));}
    async function testAuditorApiKey(candidate=''){
        const key=String(candidate||getTornApiKey()||'').trim();
        if(!key){setStatus('API KEY MISSING · create or paste an Auditor key first.');return false;}
        setStatus('Testing Auditor API key…');
        const info=await keyInfo(key);
        if(!info.ok){setStatus('API INVALID · '+String(info.error||'Unknown Torn API error'));return false;}
        const profile=await tornV2('profile',key);
        if(!profile.ok){setStatus('API ACCESS ERROR · '+String(profile.error||'Profile access failed'));return false;}
        rawSet(STORAGE.apiKey,key);
        const root=profile.data?.profile||profile.data||{};
        setStatus('API OK · '+String(root.name||'Torn account')+(root.player_id||root.id?' ['+(root.player_id||root.id)+']':''));
        return true;
    }
    function clearAuditorApiKey(){rawSet(STORAGE.apiKey,'');setStatus('Auditor API key cleared.');}
"""
if anchor not in text: raise SystemExit('keyInfo anchor missing')
text=text.replace(anchor,insert,1)

old="""        '<label>GitHub fine-grained token <input id=\"sl-aa-gh\" type=\"password\" placeholder=\"Stored in userscript storage\"></label>'+\n        '<button id=\"sl-aa-create-api\" type=\"button\">🔑 CREATE AUDITOR API KEY</button>'+\n        '<div class=\"sl-aa-note\"><b>Auditor key is isolated.</b> It is never read from or written to the Script Hub shared API key.</div>'+(!getTornApiKey()?'<label>Torn API key <input id=\"sl-aa-torn\" type=\"password\" placeholder=\"Auditor-only Torn API key\"></label>':'')+\n"""
new="""        '<label>GitHub fine-grained token <input id=\"sl-aa-gh\" type=\"password\" placeholder=\"Stored in userscript storage\"></label>'+\n        '<div class=\"sl-aa-api-box\"><div class=\"sl-aa-api-title\">🔑 AUDITOR API ACCESS</div>'+\n        '<div class=\"sl-aa-note\"><b>Required access:</b> read-only account data for profile, money/stocks/properties, battle/work stats, inventory/equipment, crimes/missions, racing, forum, contacts, messages/events and Torn merit/education catalogues. <b>Full access is required only if you also want user logs.</b> The Auditor key is isolated from the Script Hub shared key.</div>'+\n        '<label>Auditor Torn API key <input id=\"sl-aa-torn\" type=\"password\" value=\"\" placeholder=\"'+(getTornApiKey()?'Saved key present — paste a replacement to change it':'Paste the newly created key here')+'\"></label>'+\n        '<div class=\"sl-aa-api-actions\"><button id=\"sl-aa-create-api\" type=\"button\">🔑 CREATE KEY</button><button id=\"sl-aa-test-api\" type=\"button\">🧪 TEST & SAVE</button><button id=\"sl-aa-clear-api\" type=\"button\">🗑 CLEAR</button></div>'+\n        '<div class=\"sl-aa-api-state\">Current key: <b>'+(getTornApiKey()?'SAVED':'MISSING')+'</b></div></div>'+\n"""
if old not in text: raise SystemExit('API UI anchor missing')
text=text.replace(old,new,1)

old_handlers="""document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};overlay.querySelector('#sl-aa-close').onclick=()=>overlay.remove();overlay.querySelector('#sl-aa-create-api').onclick=()=>{location.href=AUDITOR_API_CREATE_URL;};overlay.querySelector('#sl-aa-capture').onclick=()=>captureCurrentMessage();overlay.querySelector('#sl-aa-clear').onclick=()=>clearCapturedMessages();\n"""
new_handlers="""document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};overlay.querySelector('#sl-aa-close').onclick=()=>overlay.remove();overlay.querySelector('#sl-aa-create-api').onclick=()=>{location.href=AUDITOR_API_CREATE_URL;};overlay.querySelector('#sl-aa-test-api').onclick=async()=>{const input=overlay.querySelector('#sl-aa-torn');await testAuditorApiKey(input?.value.trim()||'');updatePanelStatus();};overlay.querySelector('#sl-aa-clear-api').onclick=()=>{clearAuditorApiKey();const input=overlay.querySelector('#sl-aa-torn');if(input)input.value='';updatePanelStatus();};overlay.querySelector('#sl-aa-capture').onclick=()=>captureCurrentMessage();overlay.querySelector('#sl-aa-clear').onclick=()=>clearCapturedMessages();\n"""
if old_handlers not in text: raise SystemExit('handler anchor missing')
text=text.replace(old_handlers,new_handlers,1)

# Saving settings should no longer silently accept an invalid key. Save non-empty key only after TEST & SAVE.
old_save="const tk=overlay.querySelector('#sl-aa-torn')?.value.trim();if(tk)rawSet(STORAGE.apiKey,tk);saveJson(STORAGE.settings,settings);"
new_save="saveJson(STORAGE.settings,settings);"
if old_save not in text: raise SystemExit('save key anchor missing')
text=text.replace(old_save,new_save,1)

css_anchor="#sl-aa-clear{background:#7f1d1d!important}"
css_new="#sl-aa-clear{background:#7f1d1d!important}.sl-aa-api-box{margin:10px 0;padding:10px;border:1px solid #355173;border-radius:12px;background:#0f1824}.sl-aa-api-title{font-size:12px;font-weight:900;color:#8fc2ff;margin-bottom:6px}.sl-aa-api-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.sl-aa-api-actions button{min-height:38px;border:0;border-radius:8px;color:#fff;font-weight:900;background:#334155}.sl-aa-api-actions #sl-aa-test-api{background:#166534}.sl-aa-api-actions #sl-aa-clear-api{background:#7f1d1d}.sl-aa-api-state{margin-top:7px;font-size:10px;color:#cbd5e1}"
if css_anchor not in text: raise SystemExit('CSS anchor missing')
text=text.replace(css_anchor,css_new,1)

p.write_text(text,encoding='utf-8')
print('Account Auditor v1.3.20: dedicated API Access panel added')
