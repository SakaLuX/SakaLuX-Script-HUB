from pathlib import Path
import json

ROOT=Path('.')
BACKUP=ROOT/'backups'/'stock-company-elimination-api-layout-2026-09-18'
(BACKUP/'greasyfork').mkdir(parents=True,exist_ok=True)
for src,dst in [
 ('SakaLuX-Stock-Manager-Advisor.user.js','SakaLuX-Stock-Manager-Advisor-v0.7.15.user.js'),
 ('SakaLuX-Company-Intelligence-v1.0.0.user.js','SakaLuX-Company-Intelligence-v1.8.33.user.js'),
 ('scripts.json','scripts.json')]:
 p=ROOT/src
 if p.exists():(BACKUP/dst).write_text(p.read_text())
for fn in ['Stock-Manager-Advisor.md','Company-Intelligence.md']:
 p=ROOT/'greasyfork'/fn
 if p.exists():(BACKUP/'greasyfork'/fn).write_text(p.read_text())

p=ROOT/'SakaLuX-Stock-Manager-Advisor.user.js'
s=p.read_text().replace('0.7.15','0.7.16')
marker='/* SAKALUX_STOCK_API_ELIMINATION_LAYOUT_V0716 */'
if marker not in s:
 s+=r'''

/* SAKALUX_STOCK_API_ELIMINATION_LAYOUT_V0716 */
(()=>{
 const st=document.createElement('style');st.id='sakalux-stock-api-elimination-layout-v0716';st.textContent=`
#slx-stock-panel#slx-stock-panel{z-index:2147483646!important}
#slx-stock-panel .head{display:flex!important;align-items:center!important;gap:7px!important;padding:8px 10px!important;min-height:54px!important}
#slx-stock-panel .head>div:first-child{min-width:0!important;flex:1 1 auto!important}
#slx-stock-panel .head button,#slx-stock-panel .slx-stock-api-trigger{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;max-width:38px!important;max-height:38px!important;padding:0!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important}
#slx-stock-api-sheet#slx-stock-api-sheet{position:absolute!important;inset:8px!important;z-index:2147483647!important;display:flex!important;flex-direction:column!important;min-height:0!important;max-height:calc(100% - 16px)!important;padding:0!important;overflow:hidden!important;border:1px solid #3c4652!important;border-radius:14px!important;background:#0b1118!important;box-shadow:0 18px 48px rgba(0,0,0,.55)!important}
#slx-stock-api-sheet .slx-api-sheet-head{display:flex!important;align-items:center!important;gap:8px!important;flex:0 0 58px!important;height:58px!important;padding:8px 10px!important;border-bottom:1px solid #2d3d50!important;background:linear-gradient(155deg,#18212d,#101720 72%)!important}
#slx-stock-api-sheet .slx-api-sheet-head>div{min-width:0!important;flex:1!important}
#slx-stock-api-sheet .slx-api-sheet-title{font-size:15px!important;font-weight:900!important;line-height:1.15!important}
#slx-stock-api-sheet .slx-api-sheet-sub{font-size:9px!important;color:#93a4b7!important;margin-top:2px!important}
#slx-stock-api-sheet .slx-api-sheet-close{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;padding:0!important;border-radius:10px!important;font-size:20px!important}
#slx-stock-api-sheet .slx-api-sheet-body{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;padding:10px!important;display:flex!important;flex-direction:column!important;gap:8px!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
#slx-stock-api-sheet .slx-api-box{margin:0!important;padding:10px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#111a24!important;font-size:11px!important;line-height:1.45!important}
#slx-stock-api-sheet .slx-api-box p{margin:5px 0!important;color:#93a4b7!important}
#slx-stock-api-sheet label{display:block!important;margin:5px 0 4px!important;font-size:10px!important;color:#c7d2df!important}
#slx-stock-api-sheet input{width:100%!important;height:40px!important;min-height:40px!important;margin:0!important;padding:8px 10px!important;box-sizing:border-box!important;border-radius:9px!important}
#slx-stock-api-sheet button{min-height:40px!important;height:40px!important;margin:0!important;border-radius:10px!important;font-size:11px!important;font-weight:900!important;line-height:1.1!important}
#slx-stock-api-sheet #slx-stock-api-create{width:100%!important;background:linear-gradient(180deg,#a87b17,#79550e)!important;border-color:#c79b34!important;color:#fff!important}
#slx-stock-api-sheet .slx-api-sheet-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:0!important}
#slx-stock-api-sheet .slx-api-sheet-actions button{width:100%!important;min-width:0!important}
#slx-stock-api-sheet #slx-stock-api-save,#slx-stock-api-sheet #slx-stock-api-check{background:linear-gradient(180deg,#377fcf,#275f9f)!important;border-color:#3d78bf!important;color:#fff!important}
#slx-stock-api-sheet #slx-stock-api-clear{width:100%!important;background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
#slx-stock-api-sheet .slx-api-sheet-result{min-height:16px!important;margin:0!important;font-size:10px!important;color:#93a4b7!important;overflow-wrap:anywhere!important}
@media(max-width:820px){#slx-stock-api-sheet#slx-stock-api-sheet{inset:6px!important;max-height:calc(100% - 12px)!important}}
`;(document.head||document.documentElement).appendChild(st);
})();
'''
p.write_text(s)

p=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
s=p.read_text().replace('1.8.33','1.8.34')
marker='/* SAKALUX_COMPANY_ELIMINATION_LAYOUT_V1834 */'
if marker not in s:
 s+=r'''

/* SAKALUX_COMPANY_ELIMINATION_LAYOUT_V1834 */
(()=>{
 const st=document.createElement('style');st.id='sakalux-company-elimination-layout-v1834';st.textContent=`
#ci-root#ci-root{z-index:2147483646!important}
#ci-root .ci-head{display:grid!important;grid-template-columns:minmax(120px,1fr) auto 40px 40px 40px!important;align-items:center!important;gap:6px!important;padding:8px 10px!important;min-height:60px!important}
#ci-root .ci-brand{min-width:0!important;overflow:hidden!important}
#ci-root .ci-brand b{display:block!important;font-size:15px!important;line-height:1.1!important;white-space:normal!important}
#ci-root .ci-brand small{display:block!important;margin-top:3px!important;font-size:9px!important;line-height:1.15!important;color:#8fa1b5!important;white-space:normal!important}
#ci-root .ci-mode{display:grid!important;grid-template-columns:1fr 1fr!important;gap:0!important;min-width:190px!important;height:38px!important;border:1px solid #40536a!important;border-radius:10px!important;overflow:hidden!important}
#ci-root .ci-mode button{height:38px!important;min-height:38px!important;padding:0 12px!important;border:0!important;border-radius:0!important;font-size:11px!important;white-space:nowrap!important}
#ci-root .ci-head>.ci-icon{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;max-width:40px!important;max-height:40px!important;margin:0!important;padding:0!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important}
#ci-root .ci-head>.ci-icon.api{color:#f5d85f!important;background:#29240f!important;border-color:#78621b!important}
#ci-root .ci-tabs{display:flex!important;gap:4px!important;padding:5px 7px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important}
#ci-root .ci-tabs::-webkit-scrollbar{display:none!important}
#ci-root .ci-tabs button{flex:0 0 auto!important;min-width:82px!important;min-height:34px!important;height:34px!important;padding:0 10px!important;border-radius:8px!important;font-size:10px!important;white-space:nowrap!important}
#ci-root .ci-body{padding:10px!important}
#ci-root .ci-body input#ci-api{width:100%!important;height:40px!important;min-height:40px!important;margin:5px 0 8px!important;padding:8px 10px!important;box-sizing:border-box!important;border-radius:9px!important}
#ci-root .ci-body .ci-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:8px 0!important}
#ci-root .ci-body .ci-actions>.ci-btn{width:100%!important;min-width:0!important;min-height:40px!important;height:40px!important;margin:0!important;padding:0 8px!important;border-radius:10px!important;font-size:10px!important;line-height:1.1!important;white-space:normal!important}
#ci-root .ci-body [data-act="save-key"],#ci-root .ci-body [data-act="test-key"]{background:linear-gradient(180deg,#377fcf,#275f9f)!important;border-color:#3d78bf!important;color:#fff!important}
#ci-root .ci-body [data-act="clear-key"]{grid-column:1/-1!important;width:100%!important;min-height:40px!important;height:40px!important;margin:0!important;background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
#ci-root .ci-body [data-act="create-key"]{width:100%!important;min-height:40px!important;height:40px!important;margin:0 0 8px!important;background:linear-gradient(180deg,#a87b17,#79550e)!important;border-color:#c79b34!important;color:#fff!important}
@media(max-width:620px){
 #ci-root .ci-head{grid-template-columns:minmax(100px,1fr) 170px 38px 38px 38px!important;gap:5px!important;padding:7px!important}
 #ci-root .ci-mode{min-width:170px!important;height:36px!important}
 #ci-root .ci-mode button{height:36px!important;min-height:36px!important;padding:0 8px!important;font-size:10px!important}
 #ci-root .ci-head>.ci-icon{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;max-width:38px!important;max-height:38px!important}
}
`;(document.head||document.documentElement).appendChild(st);
})();
'''
p.write_text(s)

rp=ROOT/'scripts.json'
data=json.loads(rp.read_text())
versions={'stock-manager-advisor':'0.7.16','company-intelligence':'1.8.34'}
def walk(o):
 if isinstance(o,dict):
  if o.get('id') in versions:o['version']=versions[o['id']]
  for v in o.values():walk(v)
 elif isinstance(o,list):
  for v in o:walk(v)
walk(data)
rp.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

notes={
 'greasyfork/Stock-Manager-Advisor.md':'\n## Current release note — v0.7.16\n- Rebuilds API Access with compact Elimination-style geometry: aligned header controls, equal two-column actions, full-width create/clear controls and clean mobile scrolling.\n',
 'greasyfork/Company-Intelligence.md':'\n## Current release note — v1.8.34\n- Aligns the Company header and API controls with Elimination: compact Employee/Director selector, equal refresh/key/close buttons, tighter tabs and balanced API action buttons.\n'
}
for fn,note in notes.items():
 q=ROOT/fn;t=q.read_text()
 if note.strip() not in t:t+=note
 q.write_text(t)
