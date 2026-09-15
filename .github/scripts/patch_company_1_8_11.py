from pathlib import Path
import re
p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.8.10','// @version      1.8.11',1)
s=s.replace("version:'1.8.10'","version:'1.8.11'",1)
old="""function ownDaysInCompany(){
 const id=num(first(basic(),['id','player_id'],0)),raw=employees().find(e=>num(e?.id||e?.player_id||e?.user_id)===id)||{};
 return num(first(raw,['days_in_company','days','company_days'],0));
}"""
new="""function ownDaysInCompany(){
 const id=num(first(basic(),['id','player_id'],0)),raw=employees().find(e=>num(e?.id||e?.player_id||e?.user_id)===id)||{};
 let v=first(raw,['days_in_company','days','company_days','employment.days','company.days'],null);
 if(v==null)v=first(job(),['days_in_company','company_days','company.days_in_company','company.days','job.days_in_company','employment.days'],null);
 if(v==null)v=first(legacyJob(),['days_in_company','company_days','company.days_in_company','company.days','job.days_in_company','employment.days'],null);
 if(v==null)v=first(userProfile(),['days_in_company','company_days','job.days_in_company','job.company_days','job.company.days_in_company','employment.days'],null);
 if(v!=null&&Number.isFinite(Number(v))&&Number(v)>=0)return num(v);
 const txt=document.body?.innerText||'';
 const m=txt.match(/(?:Days\s+in\s+company|Company\s+days|Days\s+employed)\s*[:\-]?\s*(\d+)/i);
 return m?num(m[1]):0;
}"""
if old not in s: raise SystemExit('ownDays block not found')
s=s.replace(old,new,1)
# make employee Position advisor mobile-readable cards
s=s.replace('<div class="ci-tablewrap"><table><thead><tr><th>Position</th><th>Fit</th><th>Primary</th><th>Secondary</th><th>Status</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.name)}${p.name===current?\' · CURRENT\':\'\'}</td><td>${p.fit}%</td><td>${p.primary?fmt(p.primary.value)+\' \'+p.primary.stat.slice(0,3).toUpperCase():\'—\'}</td><td>${p.secondary?fmt(p.secondary.value)+\' \'+p.secondary.stat.slice(0,3).toUpperCase():\'—\'}</td><td>${badge(p.qualified?\'QUALIFIED\':\'BUILD STATS\',p.qualified?\'good\':\'warn\')}</td></tr>`).join(\'\')}</tbody></table></div>', '<div class="ci-tablewrap ci-mobile-cards ci-position-table"><table><thead><tr><th>Position</th><th>Fit</th><th>Primary</th><th>Secondary</th><th>Status</th></tr></thead><tbody>${rows.map(p=>`<tr><td class="ci-person-cell" data-label="Position"><b>${esc(p.name)}${p.name===current?\' · CURRENT\':\'\'}</b></td><td data-label="Fit">${p.fit}%</td><td data-label="Primary">${p.primary?fmt(p.primary.value)+\' \'+p.primary.stat.slice(0,3).toUpperCase():\'—\'}</td><td data-label="Secondary">${p.secondary?fmt(p.secondary.value)+\' \'+p.secondary.stat.slice(0,3).toUpperCase():\'—\'}</td><td data-label="Status">${badge(p.qualified?\'QUALIFIED\':\'BUILD STATS\',p.qualified?\'good\':\'warn\')}</td></tr>`).join(\'\')}</tbody></table></div>',1)
# inject high-contrast overrides after module-list CSS
needle='.ci-module-list{display:grid;grid-template-columns:auto 1fr;gap:8px 12px}.ci-module-list b{color:#f2bd52;font-size:10px}.ci-module-list span{color:#cbd5df;font-size:11px;line-height:1.45}\n'
add='''#ci-root .ci-card,#ci-root .ci-card table,#ci-root .ci-card tr,#ci-root .ci-card td{color:#e8eef6!important}\n#ci-root .ci-card td b,#ci-root .ci-kv b,#ci-root .ci-line b{color:#f8fafc!important}\n#ci-root .ci-card th,#ci-root .ci-mobile-cards td::before{color:#9fb0c3!important}\n#ci-root .ci-note,#ci-root .ci-empty,#ci-root .ci-kv span{color:#aab7c6!important}\n#ci-root .ci-badge.good{color:#83f0bc!important}#ci-root .ci-badge.warn{color:#ffe08a!important}#ci-root .ci-badge.bad{color:#ffaaaa!important}\n'''
if needle not in s: raise SystemExit('css needle missing')
s=s.replace(needle,needle+add,1)
# stronger mobile right-side values, avoid Torn theme leakage
needle2=' .ci-mobile-cards td{display:grid!important;grid-template-columns:minmax(92px,42%) minmax(0,1fr)!important;align-items:center!important;gap:8px!important;padding:5px 0!important;border:0!important;border-bottom:1px solid #222d39!important;white-space:normal!important;overflow-wrap:anywhere!important;text-align:right!important;font-size:12px!important}\n'
rep2=needle2+' .ci-mobile-cards td{color:#e8eef6!important;text-shadow:none!important}\n .ci-mobile-cards td>*,.ci-mobile-cards td b,.ci-mobile-cards td span{color:inherit}\n .ci-position-table .ci-person-cell b{color:#f8fafc!important}\n'
if needle2 not in s: raise SystemExit('mobile css needle missing')
s=s.replace(needle2,rep2,1)
p.write_text(s,encoding='utf-8')
md=Path('greasyfork/Company-Intelligence.md')
if md.exists():
 m=md.read_text(encoding='utf-8').replace('**v1.8.10**','**v1.8.11**',1)
 marker='## Current release note\n'
 if marker in m:
  st=m.index(marker)+len(marker); en=m.find('\n## ',st); en=len(m) if en<0 else en
  m=m[:st]+'\n**v1.8.11** fixes dark-theme readability across Staff and Position views, converts the Employee Best Position Advisor into mobile cards, and expands Days in company detection across employee records, job/profile payloads and the visible Torn page.\n'+m[en:]
 hist='## Release history\n'
 if hist in m and '### v1.8.11' not in m:
  m=m.replace(hist,hist+'### v1.8.11 — Contrast, Position cards and tenure fallback\n\n- Forces readable foreground colors inside Company Intelligence regardless of Torn dark-theme CSS.\n- Makes Employee Position Advisor mobile-friendly.\n- Improves badge and value contrast.\n- Expands Days in company fallbacks for Director/Employee modes.\n\n',1)
 md.write_text(m,encoding='utf-8')
