from pathlib import Path
p=Path('SakaLuX-Suite.user.js'); s=p.read_text(encoding='utf-8')
old="['account-auditor','Account Auditor'],['bazaar-smart-pricer','Bazaar Smart Pricer'],['bazaar-thanker','Bazaar Thanker'],['chat-intelligence','Chat Intelligence'],['company-intelligence','Company Intelligence'],['elimination-assistant','Elimination Assistant'],['enhancer-guard','Enhancer Guard'],['market-intelligence','Market Intelligence'],['mission-rewards','Mission Rewards'],['stock-manager-advisor','Stock Manager']"
new="['account-auditor','Account Auditor'],['bazaar-smart-pricer','Bazaar Smart Pricer'],['bazaar','Bazaar Thanker'],['chat-intelligence','Chat Intelligence'],['company-intelligence','Company Intelligence'],['elimination-assistant','Elimination Assistant'],['enhancer','Enhancer Guard'],['market-intelligence','Market Intelligence'],['mission-rewards','Mission Rewards'],['stock-manager-advisor','Stock Manager']"
if old not in s: raise SystemExit('standalone map marker missing')
s=s.replace(old,new,1)
old_render="function render(){ensureStyle();if(!enabled()||!isGraffiti()){removeGraffiti();return;}cards().forEach(decorateCard);ensureStrip();injectMasterControl();syncHubState();}"
new_render="function render(){ensureStyle();injectMasterControl();syncHubState();if(!enabled()||!isGraffiti()){removeGraffiti();return;}cards().forEach(decorateCard);ensureStrip();}"
if old_render not in s: raise SystemExit('render marker missing')
s=s.replace(old_render,new_render,1)
p.write_text(s,encoding='utf-8')

d=Path('greasyfork/SakaLuX-Suite.md'); t=d.read_text(encoding='utf-8')
t=t.replace('**v0.9.940 — Release documentation synchronized with the current Suite userscript version**\n- Release documentation synchronized with the current Suite userscript version.','**v0.9.941 — Graffiti Spray Guide + Hub state authority**\n- Graffiti Spray Guide and Hub-authoritative module state synchronization are active in the current Suite release.',1)
d.write_text(t,encoding='utf-8')

test=Path('tests/suite-graffiti-hub-sync-regression.cjs'); q=test.read_text(encoding='utf-8')
extra="assert.ok(s.includes(\"['bazaar','Bazaar Thanker']\"),'Bazaar Thanker canonical id');assert.ok(s.includes(\"['enhancer','Enhancer Guard']\"),'Enhancer canonical id');assert.ok(s.indexOf('injectMasterControl();syncHubState();if(!enabled()||!isGraffiti())')>0,'Master Control and Hub state must reconcile on every route');"
if extra not in q: q=q.rstrip()+extra+'\n'
test.write_text(q,encoding='utf-8')
print('Suite control sync correction applied')
