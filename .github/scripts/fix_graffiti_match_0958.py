from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.957$',r'\g<1>0.9.958',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.957')
start=s.find('    function selected(card){')
end=s.find('    function cards(){',start)
if start<0 or end<0: raise SystemExit('selected/cards block not found')
new=r'''    function selected(card){
      const h=sprayHost(card);if(!h)return null;
      // Strict mode: only trust Torn-native semantics that explicitly identify
      // the equipped/selected/current spray. Never infer the selected colour
      // from generic image/src/title metadata because those nodes can contain
      // preview/recommendation colours and create false green checks.
      let colour=null,percent=null;
      const native=[h,...$$('[aria-label]',h)].filter(el=>!el.closest?.('.slx-graf-spray-advisor'));
      for(const el of native){
        const label=(el.getAttribute?.('aria-label')||'').trim();
        if(!/(selected|equipped|current|in use|using)/i.test(label))continue;
        const m=label.match(/\b(red|blue|orange|white|pink|black|green|purple)\b/i);
        if(!m)continue;
        colour=m[1].toLowerCase();
        const pm=label.match(/(\d{1,3})\s*%/);if(pm)percent=+pm[1];
        break;
      }
      // Percentage may still be read visually, independently of colour.
      if(percent==null){
        const area=h.parentElement||card;
        for(const el of $$('*',area)){
          if(el.closest?.('.slx-graf-spray-advisor'))continue;
          const m=text(el).match(/^\s*(\d{1,3})\s*%\s*$/);if(m){percent=+m[1];break;}
        }
      }
      return {colour,percent,host:h};
    }
'''
s=s[:start]+new+s[end:]
p.write_text(s,encoding='utf-8')

d=Path('greasyfork/SakaLuX-Suite.md')
t=d.read_text(encoding='utf-8')
t=t.replace('**v0.9.957**','**v0.9.958**',1).replace('Canonical version: **v0.9.957**','Canonical version: **v0.9.958**',1)
entry='''\n### v0.9.958 — Strict Graffiti selected-spray matching\n- Removes heuristic colour detection for the equipped spray.\n- A REP/CASH recommendation is marked as matched only when Torn itself exposes an aria-label that explicitly says the spray is selected/equipped/current/in use and contains the colour.\n- If TornPDA does not expose a trustworthy selected-colour signal, no green checkmark is shown instead of guessing.\n- Remaining paint percentage detection stays active independently.\n'''
if '### v0.9.958' not in t:
    pos=t.find('\n## Release history / Changelog')
    t=t[:pos]+entry+t[pos:] if pos>=0 else t+entry
d.write_text(t,encoding='utf-8')
Path('tests/suite-graffiti-0958-regression.cjs').write_text(r'''const fs=require('node:fs'),assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.958$/m);const m=s.match(/function selected\(card\)\{[\s\S]*?return \{colour,percent,host:h\};\n    \}/);assert.ok(m);for(const x of ['selected|equipped|current|in use|using','getAttribute?.(\'aria-label\')'])assert.ok(m[0].includes(x));for(const x of ['getAttribute?.(\'src\')','getAttribute?.(\'srcset\')','getAttribute?.(\'title\')','getAttribute?.(\'alt\')'])assert.ok(!m[0].includes(x));console.log('suite graffiti 0.9.958 strict match regression: OK');''',encoding='utf-8')
print('patched Suite to 0.9.958')
