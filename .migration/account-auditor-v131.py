from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Account-Auditor.user.js'
text=p.read_text(encoding='utf-8')
text,n=re.subn(r'(^// @version\s+)1\.3\.0(\s*$)',r'\g<1>1.3.1\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
text,n=re.subn(r"const VERSION = '1\.3\.0';", "const VERSION = '1.3.1';", text, count=1)
if n!=1: raise SystemExit('runtime version not found')
old="""    async function collectInventory(key){const categories={},errors={};let itemCount=0;for(const cat of INVENTORY_CATEGORIES){const r=await tornV2('inventory',key,'cat='+encodeURIComponent(cat)+'&limit=250&offset=0');if(r.ok){const clean=sanitizeDeep(r.data);categories[cat]=clean;const items=Array.isArray(clean?.inventory)?clean.inventory:[];itemCount+=items.length;}else errors[cat]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};}return{data:{categories,itemCount,categoryCount:Object.keys(categories).length},errors};}"""
new="""    function countInventoryItems(payload){
        if(!payload)return 0;
        if(Array.isArray(payload?.inventory))return payload.inventory.length;
        if(Array.isArray(payload?.pages))return payload.pages.reduce((sum,page)=>sum+countInventoryItems(page),0);
        return 0;
    }
    async function collectInventory(key){
        const categories={},errors={};let itemCount=0;
        for(const cat of INVENTORY_CATEGORIES){
            const r=await collectPagedV2('inventory',key,'cat='+encodeURIComponent(cat)+'&limit=250',200);
            if(r.ok){categories[cat]=r.data;itemCount+=countInventoryItems(r.data);}
            else errors[cat]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};
        }
        return{data:{categories,itemCount,categoryCount:Object.keys(categories).length},errors};
    }"""
if old not in text: raise SystemExit('inventory collector not found')
text=text.replace(old,new,1)
p.write_text(text,encoding='utf-8')

d=ROOT/'greasyfork/Account-Auditor.md'
doc=d.read_text(encoding='utf-8')
doc=doc.replace('**v1.3.0**','**v1.3.1**',1)
doc=doc.replace('**v1.3.0** is the current standalone Account Auditor release.', '**v1.3.1** is the current standalone Account Auditor release.',1)
insert='''\n### v1.3.1 — Complete inventory pagination\n\n- Inventory categories now follow Torn API pagination instead of stopping at the first 250 items.\n- Inventory item totals include every retrieved page while retaining the v1.3.0 deduplicated v2-first snapshot architecture.\n\n'''
doc=doc.replace('## Release history\n','## Release history\n'+insert,1)
d.write_text(doc,encoding='utf-8')
print('Account Auditor v1.3.1 inventory pagination applied')
