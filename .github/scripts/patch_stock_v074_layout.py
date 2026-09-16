from pathlib import Path
import re
p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      0.7.3','// @version      0.7.4',1).replace("version: '0.7.3',","version: '0.7.4',",1)
old='''        <div class="slx-inline-actions"><button id="slx-inline-vault-max" class="primary" type="button">Vault Max</button><label><input id="slx-inline-keep" value="${esc(get(K.keep,'0'))}" placeholder="Keep cash"></label><button id="slx-inline-vault-keep" type="button">Vault (Keep)</button><label><input id="slx-inline-withdraw-value" value="${esc(get(K.withdraw,'1m'))}" placeholder="Withdraw"></label><button id="slx-inline-withdraw" class="danger" type="button">Withdraw</button><button id="slx-inline-withdraw-all" class="danger" type="button">Withdraw All</button></div>'''
new='''        <div class="slx-inline-actions"><button id="slx-inline-vault-max" class="primary" type="button">Vault Max</button><button id="slx-inline-withdraw-all" class="danger" type="button">Withdraw All</button><button id="slx-inline-vault-keep" type="button">Vault Keep</button><label><input id="slx-inline-keep" value="${esc(get(K.keep,'0'))}" placeholder="Keep cash"></label><button id="slx-inline-withdraw" class="danger" type="button">Withdraw</button><label><input id="slx-inline-withdraw-value" value="${esc(get(K.withdraw,'1m'))}" placeholder="Withdraw amount"></label></div>'''
if old not in s: raise SystemExit('layout anchor missing')
s=s.replace(old,new,1)
s,n=re.subn(r'<button id="slx-inline-panic"[^>]*>PANIC</button>','',s,count=1)
if n!=1: raise SystemExit('panic anchor missing')
s=s.replace("    $('#slx-inline-panic',card).onclick=panic;\n",'',1)
s=s.replace("    $('#slx-inline-vault-max',card).onclick=()=>vault().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));","    $('#slx-inline-vault-max',card).onclick=()=>{if(!confirm('Vault Max: continue?'))return;vault().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));};",1)
s=s.replace("    $('#slx-inline-withdraw-all',card).onclick=()=>withdrawAll().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));","    $('#slx-inline-withdraw-all',card).onclick=()=>{if(!confirm('Withdraw All: continue?'))return;withdrawAll().then(()=>syncAllApi().catch(()=>refreshInlinePanel())).catch(e=>inlineStatus(e.message,'bad'));};",1)
p.write_text(s,encoding='utf-8')
md=Path('experimental/Stock-Manager-Advisor.md')
d=md.read_text(encoding='utf-8').replace('**v0.7.3**','**v0.7.4**',1)
d=d.replace('## Changelog\n','## Changelog\n### v0.7.4 — Vault Layout Cleanup\n\n- Vault Max and Withdraw All share the top row and both require confirmation.\n- Vault Keep is followed by its keep-amount field.\n- Withdraw is followed by its amount field.\n- Removed the inline PANIC button under Compact; global PANIC remains available.\n\n',1)
md.write_text(d,encoding='utf-8')
