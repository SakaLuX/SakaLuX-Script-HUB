from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.956$',r'\g<1>0.9.957',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.956')

old=r'''    function selected(card){
      const h=sprayHost(card);if(!h)return null;
      const els=[h,...$$('[aria-label],[title],img',h)];
      const blob=els.map(el=>[el.getAttribute?.('aria-label'),el.getAttribute?.('title'),el.getAttribute?.('alt'),el.getAttribute?.('src'),el.getAttribute?.('srcset'),text(el)].filter(Boolean).join(' ')).join(' ').toLowerCase();
      let colour=COLOURS.find(c=>new RegExp(`\\b${c}\\b`,'i').test(blob))||null;
      let pm=blob.match(/(\d{1,3})\s*%/);let percent=pm?+pm[1]:null;
      if(percent==null){
        const area=h.parentElement||card;for(const el of $$('*',area)){const t=text(el);const m=t.match(/^\s*(\d{1,3})\s*%\s*$/);if(m){percent=+m[1];break;}}
      }
      if(!colour){
        const img=$('img',h);const src=(img?.getAttribute('src')||img?.getAttribute('srcset')||img?.getAttribute('alt')||'').toLowerCase();colour=COLOURS.find(c=>src.includes(c))||null;
      }
      return {colour,percent,host:h};
    }'''

new=r'''    function selected(card){
      const h=sprayHost(card);if(!h)return null;
      // Important: never read textContent from the host here. The advisor itself is
      // injected inside this host, so reading host text can feed our own REP/CASH
      // colour labels back into selected-spray detection and create false checkmarks.
      const nativeEls=[h,...$$('[aria-label],[title],img',h)].filter(el=>!el.closest?.('.slx-graf-spray-advisor'));
      let colour=null,percent=null;
      // 1) Prefer Torn's explicit selected-spray label when available.
      for(const el of nativeEls){
        const label=(el.getAttribute?.('aria-label')||'').trim();
        let m=label.match(/\b(red|blue|orange|white|pink|black|green|purple)\b[^,;]*\bspray\b/i)
          ||label.match(/\bspray\b[^,;]*\b(red|blue|orange|white|pink|black|green|purple)\b/i);
        if(m){colour=m[1].toLowerCase();const pm=label.match(/(\d{1,3})\s*%/);if(pm)percent=+pm[1];break;}
      }
      // 2) If TornPDA omits the aria-label colour, use only native image/attribute metadata.
      if(!colour){
        const blob=nativeEls.map(el=>[
          el.getAttribute?.('title'),el.getAttribute?.('alt'),el.getAttribute?.('src'),el.getAttribute?.('srcset')
        ].filter(Boolean).join(' ')).join(' ').toLowerCase();
        colour=COLOURS.find(c=>new RegExp(`(?:^|[^a-z])${c}(?:[^a-z]|$)`,'i').test(blob))||null;
        const pm=blob.match(/(\d{1,3})\s*%/);if(pm)percent=+pm[1];
      }
      // 3) Remaining percentage may be visible next to the native spray control.
      if(percent==null){
        const area=h.parentElement||card;
        for(const el of $$('*',area)){
          if(el.closest?.('.slx-graf-spray-advisor'))continue;
          const t=text(el),m=t.match(/^\s*(\d{1,3})\s*%\s*$/);if(m){percent=+m[1];break;}
        }
      }
      return {colour,percent,host:h};
    }'''

if old not in s:
    raise SystemExit('selected(card) 0.9.956 block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

doc=Path('greasyfork/SakaLuX-Suite.md')
d=doc.read_text(encoding='utf-8')
d=d.replace('**v0.9.956**','**v0.9.957**',1).replace('Canonical version: **v0.9.956**','Canonical version: **v0.9.957**',1)
entry='''\n### v0.9.957 — Graffiti selected-spray false-check fix\n- Fixes false green checkmarks when the equipped spray is not the recommended colour.\n- Selected-spray detection no longer reads text from the injected SakaLuX recommendation overlay, preventing REP/CASH labels from being mistaken for Torn's equipped colour.\n- Prefers Torn's native spray `aria-label`, then native image/title/alt/src metadata; if the colour cannot be confirmed, no checkmark is shown.\n- Keeps low-percentage detection and the seven-zone REP/CASH recommendation mapping unchanged.\n'''
if '### v0.9.957' not in d:
    pos=d.find('\n## Release history / Changelog')
    d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
doc.write_text(d,encoding='utf-8')

Path('tests/suite-graffiti-0957-regression.cjs').write_text(r'''const fs=require('node:fs'),assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.957$/m);for(const x of ["!el.closest?.('.slx-graf-spray-advisor')","getAttribute?.('aria-label')","getAttribute?.('title')","getAttribute?.('alt')","getAttribute?.('src')","getAttribute?.('srcset')","if(!colour)","return {colour,percent,host:h}"])assert.ok(s.includes(x),x);const m=s.match(/function selected\(card\)\{[\s\S]*?return \{colour,percent,host:h\};\n    \}/);assert.ok(m,'selected function');assert.ok(!m[0].includes('text(el)].filter'),'selected detector must not ingest advisor text');console.log('suite graffiti 0.9.957 selected-spray regression: OK');''',encoding='utf-8')
print('patched Suite to 0.9.957')
