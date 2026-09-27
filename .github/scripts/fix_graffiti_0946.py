from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.945$',r'\g<1>0.9.946',s,count=1)
if n!=1: raise SystemExit('Suite version 0.9.945 not found')
start=s.find('/* SAKALUX_SUITE_0941_GRAFFITI_HUB_SYNC */')
if start<0: raise SystemExit('graffiti module marker missing')
block=s[start:]
block=block.replace("const VERSION='0.9.941';","const VERSION='0.9.946';",1)
block=block.replace("const txt=e=>(e?.textContent||'').replace(/\\\\s+/g,' ').trim();","const txt=e=>(e?.textContent||'').replace(/\\s+/g,' ').trim();",1)
block=block.replace("[/red[-\\\\s]?light/i,'Red-Light']","[/red[-\\s]?light/i,'Red-Light']",1)
block=block.replace("[/city\\\\s*cent/i,'City Center']","[/city\\s*cent/i,'City Center']",1)
block=re.sub(r"const isGraffiti=\(\)=>.*?;",lambda m:"const isGraffiti=()=>{const t=txt(document.body);return /\\bGraffiti\\b/i.test(t)&&/East Side/i.test(t)&&/West Side/i.test(t)&&/North Side/i.test(t);};",block,count=1)

def replace_between(text,start_pat,end_pat,new,label):
    pat=start_pat+r'.*?(?='+end_pat+r')'
    text,n=re.subn(pat,lambda m:new+'\n',text,count=1,flags=re.S)
    if n!=1: raise SystemExit(label+' block not replaced')
    return text

block=replace_between(block,r'function locationName\(card\)\{',r'\nfunction tagCount',r'''function locationName(card){
 const explicit=card?.dataset?.slxGraffitiLocation;if(explicit)return explicit;
 const title=txt(card?.querySelector?.('[class*="title" i],[class*="name" i],h3,h4')||card);
 for(const [rx,n] of TITLE) if(rx.test(title)) return n;
 const im=card?.querySelector?.('img');const src=im?.getAttribute?.('srcset')||im?.src||'';
 for(const [rx,n] of IMG) if(rx.test(src)) return n;
 return null;
}''','locationName')

block=replace_between(block,r'function tagCount\(card\)\{',r'\nfunction nextTier',r'''function tagCount(card){
 const specific=card?.querySelector?.('[class*="tagsCount" i],[class*="tagCount" i]');
 if(specific){const m=txt(specific).match(/\d+/);if(m)return Number(m[0]);}
 const lines=(card?.innerText||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const loc=locationName(card);const i=loc?lines.findIndex(x=>x.toLowerCase()===loc.toLowerCase()):-1;
 if(i>=0){const m=(lines[i+1]||'').match(/^\d+$/);if(m)return Number(m[0]);}
 return null;
}''','tagCount')

block=replace_between(block,r'function graffitiStats\(\)\{',r'\nfunction colourStock',r'''function graffitiStats(){
 const out={cans:{}};
 $$('[aria-label]').forEach(el=>{
   const a=el.getAttribute('aria-label')||'';let m;
   if((m=a.match(/(?:Crime )?Skill:\s*([\d.]+)/i)))out.skill=Number(m[1]);
   if((m=a.match(/Enhancer:\s*(.+)/i)))out.enhancer=m[1].trim();
   if((m=a.match(/Unique outcomes?:\s*(\d+)\s*\/\s*(\d+)/i))){out.uniques=Number(m[1]);out.uniquesTotal=Number(m[2]);}
   if((m=a.match(/Spray Paint\s*:\s*(\w+)\s*:\s*(\d+)/i)))out.cans[m[1].toLowerCase()]=Number(m[2]);
 });
 const body=txt(document.body);
 if(out.skill==null){const m=body.match(/(?:Crime\s*)?Skill\D{0,12}(\d{1,3})/i);if(m)out.skill=Number(m[1]);}
 return out;
}''','graffitiStats')

block=replace_between(block,r'function colourStock\(col\)\{',r'\nfunction ensureStyle',r'''function colourStock(col){
 const body=txt(document.body);const esc=String(col).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const p=body.match(new RegExp(esc+'[^%]{0,80}(\\d{1,3})%','i'));
 const count=body.match(new RegExp(esc+'[^0-9]{0,80}(?:x|qty|quantity|stock)?\\s*(\\d+)','i'));
 return {percent:p?Number(p[1]):null,count:count?Number(count[1]):null};
}''','colourStock')

block=replace_between(block,r'function cards\(\)\{',r'\nfunction objective',r'''function cards(){
 const names=TITLE.map(x=>x[1]),out=[];
 const all=$$('body *').filter(el=>el.children.length===0&&names.some(n=>txt(el).toLowerCase()===n.toLowerCase()));
 for(const el of all){
   const name=names.find(n=>txt(el).toLowerCase()===n.toLowerCase());let cur=el;
   for(let depth=0;cur&&depth<8;depth++,cur=cur.parentElement){
     const t=txt(cur);const useful=(/%/.test(t)||cur.querySelector('button')||cur.querySelector('img'))&&t.length<900;
     if(useful){cur.dataset.slxGraffitiLocation=name;out.push(cur);break;}
   }
 }
 if(out.length)return [...new Set(out)];
 return $$('[class*="crimeOption" i],[class*="virtualItem" i]').filter(x=>locationName(x));
}''','cards')

block=block.replace("b.innerHTML=parts.map(x=>`<span class=\"${x.includes('REP')?'slx-graffiti-rep':x.includes('CASH')?'slx-graffiti-cash':''}\">${x}</span>`).join(' ');","const html=parts.map(x=>`<span class=\"${x.includes('REP')?'slx-graffiti-rep':x.includes('CASH')?'slx-graffiti-cash':''}\">${x}</span>`).join(' ');if(b.innerHTML!==html)b.innerHTML=html;",1)
block=re.sub(r"const first=cards\(\)\[0\];if\(!first\)return;.*?let bar=\$\('#slx-graffiti-strip'\);if\(!bar\)\{.*?\}",lambda m:"const first=cards()[0];if(!first)return;const anchor=first;const container=anchor.parentElement;if(!container)return;let bar=$('#slx-graffiti-strip');if(!bar){bar=document.createElement('div');bar.id='slx-graffiti-strip';bar.className='slx-graffiti-strip';container.insertBefore(bar,anchor);}",block,count=1,flags=re.S)
s=s[:start]+block
p.write_text(s,encoding='utf-8')
D=Path('greasyfork/SakaLuX-Suite.md');d=D.read_text(encoding='utf-8')
d=d.replace('**v0.9.945**','**v0.9.946**',1).replace('Canonical version: **v0.9.945**','Canonical version: **v0.9.946**',1)
entry='''\n### v0.9.946 — Graffiti TornPDA DOM repair\n- Fixes the generated Graffiti regex escaping bug.\n- Detects the live Graffiti screen from visible zone labels instead of TornPDA URL/hash format.\n- Finds all seven zone cards from visible titles with hashed-class fallbacks and injects REP/CASH badges plus the progress strip.\n- Keeps the v0.9.945 canonical 10-module list and truthful install/ON/OFF status logic unchanged.\n'''
if '### v0.9.946' not in d:
    pos=d.find('\n## Release history / Changelog');d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
D.write_text(d,encoding='utf-8')
T=Path('tests/suite-graffiti-0946-regression.cjs')
T.write_text(r'''const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.946$/m);assert.ok(s.includes("const VERSION='0.9.946'"));assert.ok(s.includes('dataset.slxGraffitiLocation'));assert.ok(s.includes("$$('body *')"));assert.ok(s.includes('East Side')&&s.includes('West Side')&&s.includes('North Side'));assert.ok(s.includes("replace(/\\s+/g,' ')")||s.includes("replace(/\\s+/g, ' ')"));assert.ok(s.includes('slx-graffiti-strip'));console.log('suite graffiti 0.9.946 regression: OK');''',encoding='utf-8')
print('patched Suite to 0.9.946')
