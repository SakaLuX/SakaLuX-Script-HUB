from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js'); s=p.read_text(encoding='utf-8')
# bump version
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.942$',r'\g<1>0.9.943',s,count=1)
if n!=1: raise SystemExit('version marker missing')
s=s.replace("const VERSION='0.9.942';","const VERSION='0.9.943';",1)
# better graffiti page detection
old="const isGraffiti=()=>/graffiti/i.test(location.href+' '+txt(document.querySelector('h1,h2,[class*=title]')));"
new="const isGraffiti=()=>/sid=crimes/i.test(location.href)&&(/graffiti/i.test(location.hash)||/\\bGraffiti\\b/i.test(txt(document.body)));"
if old not in s: raise SystemExit('isGraffiti marker missing')
s=s.replace(old,new,1)
# upstream-derived card detection/readers (stable Torn selectors)
old_loc=re.search(r"function locationName\(card\)\{.*?\n\}",s,re.S)
if not old_loc: raise SystemExit('locationName missing')
new_loc="""function locationName(card){
 const im=card.querySelector('[class*=\"crimeOptionImage\" i] img'); const src=im?.getAttribute('srcset')||im?.src||'';
 for(const [rx,n] of IMG) if(rx.test(src)) return n;
 const title=txt(card.querySelector('[class*=\"tabletTitleAndTagCount\" i]')||card);
 for(const [rx,n] of TITLE) if(rx.test(title)) return n; return null;
}"""
s=s[:old_loc.start()]+new_loc+s[old_loc.end():]
old_tag=re.search(r"function tagCount\(card\)\{.*?\n\}",s,re.S)
if not old_tag: raise SystemExit('tagCount missing')
new_tag="""function tagCount(card){
 const v=txt(card.querySelector('[class*=\"tagsCount\" i]')||card).replace(/\+\d+→\d+|MAX/g,''); const m=v.match(/\d+/); return m?Number(m[0]):null;
}"""
s=s[:old_tag.start()]+new_tag+s[old_tag.end():]
old_cards=re.search(r"function cards\(\)\{.*?\n\}",s,re.S)
if not old_cards: raise SystemExit('cards missing')
new_cards="""function cards(){return $$('[class*=\"crimeOption___\" i]').filter(x=>locationName(x));}"""
s=s[:old_cards.start()]+new_cards+s[old_cards.end():]
# place strip using the same stable structure as upstream helper
s=s.replace("let root=cards()[0]?.parentElement;if(!root)return;let bar=$('#slx-graffiti-strip');if(!bar){bar=document.createElement('div');bar.id='slx-graffiti-strip';bar.className='slx-graffiti-strip';root.parentElement?.insertBefore(bar,root);}","const first=cards()[0];if(!first)return;const list=first.closest('[class*=\"virtualItem\" i]')?.parentElement||first.parentElement;const container=list?.parentElement;if(!container)return;let bar=$('#slx-graffiti-strip');if(!bar){bar=document.createElement('div');bar.id='slx-graffiti-strip';bar.className='slx-graffiti-strip';container.insertBefore(bar,list);}",1)
# richer stats read, matching actual Torn aria labels
insert_marker="function pageNumber(rx){const m=txt(document.body).match(rx);return m?Number(String(m[1]).replace(/,/g,'')):null;}"
if insert_marker not in s: raise SystemExit('pageNumber marker missing')
replacement=insert_marker+"\nfunction graffitiStats(){const out={cans:{}};$$('li[class*=\"statistic\" i] button[aria-label]').forEach(btn=>{const a=btn.getAttribute('aria-label')||'';let m;if((m=a.match(/^Skill:\\s*([\\d.]+)/i)))out.skill=Number(m[1]);if((m=a.match(/^Enhancer:\\s*(.+)/i)))out.enhancer=m[1].trim();if((m=a.match(/^Unique outcomes:\\s*(\\d+)\\s*\\/\\s*(\\d+)/i))){out.uniques=Number(m[1]);out.uniquesTotal=Number(m[2]);}if((m=a.match(/^Spray Paint\\s*:\\s*(\\w+):\\s*(\\d+)/i)))out.cans[m[1].toLowerCase()]=Number(m[2]);});return out;}"
s=s.replace(insert_marker,replacement,1)
# make ensureStrip use real stats first
s=s.replace("const cs=pageNumber(/(?:crime\\s*skill|skill)\\D{0,10}(\\d{1,3})/i), nerve=pageNumber(/nerve\\D{0,10}(\\d{1,3})/i), uniques=txt(document.body).match(/unique(?:\\s*outcomes?)?\\D{0,10}(\\d+)\\s*\\/\\s*(\\d+)/i); const mask=/paint\\s*mask/i.test(txt(document.body));","const gs=graffitiStats(), cs=gs.skill??pageNumber(/(?:crime\\s*skill|skill)\\D{0,10}(\\d{1,3})/i), nerve=pageNumber(/nerve\\D{0,10}(\\d{1,3})/i), uniques=gs.uniques!=null?[null,String(gs.uniques),String(gs.uniquesTotal??'?')]:txt(document.body).match(/unique(?:\\s*outcomes?)?\\D{0,10}(\\d+)\\s*\\/\\s*(\\d+)/i); const mask=/paint\\s*mask/i.test(gs.enhancer||txt(document.body));",1)
# standalone map => API truth instead of dock-runtime guesses
m=re.search(r"const STANDALONE=\[.*?\n\];",s,re.S)
if not m: raise SystemExit('standalone map missing')
new_map="""const STANDALONE=[
 ['account-auditor','Account Auditor','SakaLuXAccountAuditor'],['bazaar-smart-pricer','Bazaar Smart Pricer','SakaLuXBazaarSmartPricer'],['bazaar','Bazaar Thanker','SakaLuXBazaarThanker'],['chat-intelligence','Chat Intelligence','SakaLuXChatIntelligence'],['company-intelligence','Company Intelligence','SakaLuXCompanyIntelligence'],['elimination-assistant','Elimination Assistant','SakaLuXEliminationAssistant'],['enhancer','Enhancer Guard','SakaLuXEnhancerGuard'],['market-intelligence','Market Intelligence','SakaLuXMarketIntelligence'],['mission-rewards','Mission Rewards','SakaLuXMissionRewards'],['stock-manager-advisor','Stock Manager','SakaLuXStockManagerAdvisor']
];"""
s=s[:m.start()]+new_map+s[m.end():]
# remove duplicate custom NOT READY badge + derive enabled from native API/bridge
start=s.find('function badgeState(')
end=s.find("window.SakaLuXGraffitiSprayGuide",start)
if start<0 or end<0: raise SystemExit('sync block missing')
new_sync="""function standaloneState(id,apiGlobal){
 const api=window[apiGlobal]; const bridge=document.getElementById('sakalux-module-bridge-'+id);
 const installed=Boolean(api||bridge); let enabled=null;
 try{if(api&&typeof api.isEnabled==='function')enabled=Boolean(api.isEnabled());else if(bridge?.dataset?.enabled!=null)enabled=bridge.dataset.enabled==='true';}catch{enabled=null;}
 return {installed,enabled};
}
function syncHubState(){
 const panel=masterPanel();if(!panel)return;
 panel.querySelectorAll('.slx-hub-not-ready').forEach(x=>x.remove());
 for(const [id,name,apiGlobal] of STANDALONE){const row=rowFor(panel,name);if(!row)continue;const st=standaloneState(id,apiGlobal);const c=row.querySelector('input[type=checkbox]');const b=row.querySelector('[role=switch]');
   if(c)c.disabled=!st.installed;if(b){b.setAttribute('aria-disabled',st.installed?'false':'true');if(!st.installed)b.setAttribute('disabled','');else b.removeAttribute('disabled');}
   if(st.enabled!==null)switchState(row,st.enabled);
 }
}
"""
s=s[:start]+new_sync+s[end:]
p.write_text(s,encoding='utf-8')
# docs
D=Path('greasyfork/SakaLuX-Suite.md'); d=D.read_text(encoding='utf-8')
d=d.replace('**v0.9.942**','**v0.9.943**',1).replace('Canonical version: **v0.9.942**','Canonical version: **v0.9.943**',1)
d=d.replace('**v0.9.942 — Release documentation synchronized with the current Suite userscript version**\n- Release documentation synchronized with the current Suite userscript version.','**v0.9.943 — Graffiti + module-state correction**\n- Uses Torn\'s current Crimes 2.0 graffiti selectors so the guide renders on TornPDA.\n- Removes duplicate READY/NOT READY overlays and mirrors standalone ON/OFF from each script\'s native `isEnabled()` API.',1)
D.write_text(d,encoding='utf-8')
# regression
t=Path('tests/suite-graffiti-status-0943-regression.cjs')
t.write_text("""const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\\/\\/\\s*@version\\s+0\\.9\\.943$/m);assert.ok(s.includes('[class*=\\\"crimeOption___\\\" i]'),'current Torn graffiti cards');assert.ok(s.includes('tabletTitleAndTagCount'),'graffiti title fallback');assert.ok(s.includes('statistic\\\" i] button[aria-label]'),'stats aria reader');assert.ok(s.includes('SakaLuXEliminationAssistant'),'native Elimination API');assert.ok(s.includes("typeof api.isEnabled==='function'"),'native enabled state');assert.ok(!s.includes("badgeState(row,'NOT READY')"),'no duplicate not-ready badge');console.log('Suite 0.9.943 graffiti/status regression: OK');\n""",encoding='utf-8')
print('patched Suite 0.9.943')
