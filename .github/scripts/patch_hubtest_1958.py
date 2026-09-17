from pathlib import Path
import re
p=Path('hubtest.user.js')
s=p.read_text(encoding='utf-8')
s=re.sub(r'^// @version\s+1\.9\.57\s*$', '// @version      1.9.58', s, count=1, flags=re.M)
s=s.replace("const VERSION = '1.9.57';","const VERSION = '1.9.58';",1)
patch=r'''

/* hubtest v1.9.58 — compact rounded bottom footer */
(()=>{
  const id='sakalux-hubtest-footer-1958';
  if(document.getElementById(id)) return;
  const st=document.createElement('style');
  st.id=id;
  st.textContent=`@media(max-width:820px){
#sakalux-hub-panel{
  padding-bottom:0!important;
  border-radius:0 0 18px 18px!important;
  overflow:hidden!important;
}
#sakalux-hub-panel>.slh-bottom{
  position:relative!important;
  flex:0 0 58px!important;
  height:58px!important;
  min-height:58px!important;
  max-height:58px!important;
  margin:0!important;
  padding:4px 14px!important;
  box-sizing:border-box!important;
}
#sakalux-hub-panel>.slh-bottom .slh-bottom-grid{
  height:50px!important;
  min-height:50px!important;
  max-height:50px!important;
}
#sakalux-hub-panel>.slh-bottom .slh-bottom-btn{
  height:50px!important;
  min-height:50px!important;
  max-height:50px!important;
}
#sakalux-hub-panel>.slh-footer{
  position:relative!important;
  inset:auto!important;
  flex:0 0 30px!important;
  height:30px!important;
  min-height:30px!important;
  max-height:30px!important;
  margin:0!important;
  padding:0 8px!important;
  box-sizing:border-box!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  line-height:30px!important;
  overflow:hidden!important;
  border-radius:0 0 18px 18px!important;
  background:#080d13!important;
  border-top:1px solid rgba(223,154,55,.52)!important;
}
}`;
  (document.head||document.documentElement).appendChild(st);
})();
'''
s=s.rstrip()+patch+'\n'
p.write_text(s,encoding='utf-8')
print('hubtest patched to v1.9.58 compact rounded footer')
