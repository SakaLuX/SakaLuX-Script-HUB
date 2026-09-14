from pathlib import Path
p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.8.7','// @version      1.8.8',1)
s=s.replace("version:'1.8.7'","version:'1.8.8'",1)
marker="function normEmp(e){\n"
helper="""function positionLabel(v){
 if(v==null)return '';
 if(typeof v==='string'||typeof v==='number')return String(v).trim();
 if(typeof v==='object')return String(first(v,['name','position','title','label','role.name','role'],'')||'').trim();
 return '';
}
"""
if helper not in s:s=s.replace(marker,helper+marker,1)
s=s.replace(" const last=first(e,['last_action.timestamp','last_action','last_action_timestamp'],null);", " const last=first(e,['last_action.timestamp','last_action','last_action_timestamp'],null),posRaw=first(e,['position','position_name','role'],'');",1)
s=s.replace("  position:first(e,['position','position_name','role'],''),", "  position:positionLabel(posRaw),",1)
s=s.replace(" return String(own||first(job(),['position','position_name','company.position','company.position_name','job.position','job.position_name'],first(userProfile(),['job.position','job.position_name','position'],cached||''))||'').trim();", " const raw=own||first(job(),['position','position_name','company.position','company.position_name','job.position','job.position_name'],first(userProfile(),['job.position','job.position_name','position'],cached||''));\n return positionLabel(raw);",1)
s=s.replace("   id:p.id||p.position_id||i,name:p.name||p.position||`Position ${i+1}`,", "   id:p.id||p.position_id||i,name:positionLabel(p.name||p.position)||`Position ${i+1}`,",1)
s=s.replace("detail=`${positive} improving · ${negative} declining · weekly income ${income>=0?'+':''}${money(income)}.`", "const unchanged=Math.max(0,keys.length-positive-negative);detail=`${positive} improving · ${negative} declining · ${unchanged} unchanged · weekly income ${income>=0?'+':''}${money(income)}.`",1)
s=s.replace("${kv('Metric samples',rows.length)}<p class=\"ci-note\">${esc(detail)} This is an evidence-based direction indicator. Torn compares companies of the same type, so it cannot guarantee the next rating.</p>", "${kv('History samples',rows.length)}<p class=\"ci-note\">${esc(detail)} History samples are saved measurements used for comparison, not a star score. Improving/declining counts refer to the five tracked metrics: weekly income, weekly customers, popularity, efficiency and environment. This indicator does not mean 2 = star up or 0 = star loss.</p>",1)
p.write_text(s,encoding='utf-8')
md=Path('greasyfork/Company-Intelligence.md')
if md.exists():
 m=md.read_text(encoding='utf-8')
 m=m.replace('**v1.8.7**','**v1.8.8**',1)
 marker='## Current release note\n'
 if marker in m:
  st=m.index(marker)+len(marker); en=m.find('\n## ',st)
  if en<0: en=len(m)
  note='\n**v1.8.8** fixes position objects showing as `[object Object]`, normalizes current and recommended position names across API shapes, and clarifies Star Direction so History samples are clearly separated from improving/declining trend signals.\n'
  m=m[:st]+note+m[en:]
 hist='## Release history\n'
 if hist in m and '### v1.8.8 — Position labels and star-direction clarity' not in m:
  m=m.replace(hist,hist+'### v1.8.8 — Position labels and star-direction clarity\n\n- Normalizes nested position objects into readable names.\n- Fixes Current Position and Best Position Advisor labels.\n- Renames Metric samples to History samples.\n- Shows improving, declining and unchanged tracked metrics separately.\n- Explains that sample count is history depth, not a star-up/star-down score.\n\n',1)
 md.write_text(m,encoding='utf-8')
