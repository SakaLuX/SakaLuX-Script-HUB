#!/usr/bin/env python3
from pathlib import Path
s=Path('SakaLuX-Suite.user.js').read_text(encoding='utf-8')

def extract(name):
    needle=f'function {name}'
    i=s.find(needle)
    if i<0:
        needle=f'async function {name}'
        i=s.find(needle)
    if i<0: return f'NOT FOUND {name}\n'
    brace=s.find('{',i)
    depth=0; in_str=None; esc=False; j=brace
    while j<len(s):
        c=s[j]
        if in_str:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==in_str: in_str=None
        else:
            if c in "'\"`": in_str=c
            elif c=='{': depth+=1
            elif c=='}':
                depth-=1
                if depth==0:
                    return s[i:j+1]+'\n'
        j+=1
    return s[i:i+20000]

names=['getCrimesStageLabel','getStageButtons','getTabsBar','getNotInvolvedCards','scanCurrentCrimesStage','scanAvailableCrimesViaApi','handleOcStageEntry','refreshNotInOCFromPage','ensureScanButton']
out=[]
for n in names:
    out.append(f'\n===== {n} =====\n'+extract(n))
Path('.github/oc-functions.txt').write_text(''.join(out),encoding='utf-8')
print('done')
