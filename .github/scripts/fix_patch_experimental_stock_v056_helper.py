from pathlib import Path
p=Path('.github/scripts/patch_experimental_stock_v056.py')
s=p.read_text(encoding='utf-8')
old="""bind_anchor=\"\"\"      const sell=$('[data-row-sell]',li); if(sell) sell.onclick=()=>stockRowSellExcess(sym);\n\"\"\"\n"""
new="""bind_anchor=\"\"\"      $('[data-row-sell]',li).onclick=e=>{e.preventDefault();e.stopPropagation();stockRowSellExcess(sym);};\n\"\"\"\n"""
if old not in s:
    raise SystemExit('old helper bind anchor declaration missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
