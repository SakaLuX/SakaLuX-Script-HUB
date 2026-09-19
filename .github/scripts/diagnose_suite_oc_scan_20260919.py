#!/usr/bin/env python3
from pathlib import Path
p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
needles=['Scan failed','Scan this OC stage','Recruiting','Planning','Best of the Lot','store','function writeScan','function readScan','function writeNotInOC','const store','let store','var store']
chunks=[]
for needle in needles:
    start=0
    found=0
    while True:
        i=s.find(needle,start)
        if i<0: break
        found+=1
        a=max(0,i-3500); b=min(len(s),i+5000)
        chunks.append(f'\n\n===== {needle} #{found} @ {i} =====\n'+s[a:b])
        start=i+len(needle)
Path('.github/oc-scan-diagnostic.txt').write_text(''.join(chunks),encoding='utf-8')
print('wrote diagnostic',len(chunks))
