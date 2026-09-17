from pathlib import Path
import re
p=Path('hubtest.user.js')
s=p.read_text(encoding='utf-8')
s=re.sub(r'^// @version\s+1\.9\.58\s*$', '// @version      1.9.59', s, count=1, flags=re.M)
s=s.replace("const VERSION = '1.9.58';","const VERSION = '1.9.59';",1)
patch=r'''

/* hubtest v1.9.59 — final compact bottom polish */
(()=>{
  const id='sakalux-hubtest-footer-1959';
  if(document.getElementById(id)) return;
  const st=document.createElement('style');
  st.id=id;
  st.textContent=`@media(max-width:820px){
#sakalux-hub-panel{
  padding-bottom:0!important;
  border-radius:0 0 20px 20px!important;
  overflow:hidden!important;
}
#sakalux-hub-panel>.slh-footer{
  position:relative!important;
  inset:auto!important;
  flex:0 0 24px!important;
  height:24px!important;
  min-height:24px!important;
  max-height:24px!important;
  margin:0!important;
  padding:0 6px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  box-sizing:border-box!important;
  line-height:24px!important;
  font-size:9px!important;
  border-radius:0 0 20px 20px!important;
  overflow:hidden!important;
  background:#080d13!important;
  border-top:1px solid rgba(223,154,55,.48)!important;
}
#sakalux-hub-panel>.slh-footer .slh-author{font-size:9px!important;line-height:24px!important}
}`;
  (document.head||document.documentElement).appendChild(st);
})();
'''
s=s.rstrip()+patch+'\n'
p.write_text(s,encoding='utf-8')
print('hubtest patched to v1.9.59 final compact bottom polish')
