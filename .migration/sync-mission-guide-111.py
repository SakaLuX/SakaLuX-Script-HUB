from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]

p=ROOT/'SakaLuX-Mission-Rewards.user.js'
s=p.read_text(encoding='utf-8')

# Version bump
s,n=re.subn(r'(^// @version\s+)1\.1\.0(\s*$)',r'\g<1>1.1.1\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('Mission Rewards metadata version not found')
s,n=re.subn(r"const VERSION\s*=\s*['\"]1\.1\.0['\"]", "const VERSION = '1.1.1'", s, count=1)
if n!=1: raise SystemExit('Mission Rewards runtime version not found')
s=s.replace("{version:'1.1.0'}", "{version:'1.1.1'}", 1)

# Keep clean-room implementation note explicit and point to the current public reference.
old_comment='''    /*\n     * SakaLuX Mission Guide\n     * Independent implementation. Mission requirements were cross-checked against\n     * public TornTools Mission Hints references and community documentation.\n     * Text below is intentionally concise/rephrased for the SakaLuX UI.\n     */'''
new_comment='''    /*\n     * SakaLuX Mission Guide\n     * Independent implementation inspired by the public TornTools Mission Hints feature:\n     * https://github.com/Mephiles/torntools_extension/tree/master/src/common/features/mission-hints\n     * Mission facts are cross-checked against TornTools/community references, while the\n     * implementation and wording here are independently written for the SakaLuX UI.\n     */'''
if old_comment in s: s=s.replace(old_comment,new_comment,1)

repls={
"a_problem_at_the_tracks:{task:'Defeat 3 targets without using guns.',hint:'Other weapons are fine; firing a gun fails it.'}":"a_problem_at_the_tracks:{task:'Defeat 3 targets using only fists or melee weapons.',hint:'Other weapon types may stay equipped, but using them fails the mission.'}",
"a_thor_loser:{task:\"Hit 8–16 unique body parts with Duke’s hammer.\",hint:'Long fights/stalemates give more chances.'}":"a_thor_loser:{task:\"Hit 6–14 unique body parts with Duke’s hammer.\",hint:'Long fights or stalemates give you more chances to hit different body parts.'}",
"army_of_one:{task:'Attack the target 3 times while changing masks.',hint:'One attack must be with no mask; winning is not required every time.'}":"army_of_one:{task:'Attack the target 3 times while changing masks.',hint:'Use the two masks Duke sends and make one attack with no mask; simply attacking is enough.'}",
"double_jeopardy:{task:'Place a bounty on the target and defeat them.',hint:'The bounty does not need to be claimed.'}":"double_jeopardy:{task:'Place a bounty on a player, then defeat that player.',hint:'The bounty can be any amount and does not need to be claimed.'}",
"emotional_debt:{task:'Hit the target with tear gas or pepper spray.',hint:'The temporary weapon must not be blocked.'}":"emotional_debt:{task:'Hit the target with tear gas or pepper spray.'}",
"estranged:{task:'Injure one of the target’s legs.'}":"estranged:{task:'Injure one of the target’s legs.',hint:'Feet count as leg hits for this mission.'}",
"frenzy:{task:'Defeat 5–15 players.'}":"frenzy:{task:'Defeat 5–15 players.',hint:'You must initiate the attacks yourself; bought losses do not count.'}",
"graffiti:{task:'Hit the target with pepper spray.'}":"graffiti:{task:'Hit the target with pepper spray.',hint:'It still counts even if the pepper spray effect is ineffective.'}",
"inside_job:{task:'Attack the target and plant the required item on them.'}":"inside_job:{task:'Attack the target and plant the item Duke gives you.',hint:'The Secrete option appears after you defeat the target.'}",
"loud_and_clear:{task:'Use 3–11 explosive grenades.',hint:'Use damaging grenade types.'}":"loud_and_clear:{task:'Use 3–11 explosive grenades.',hint:'Use grenades classified as explosive, such as HEG or Grenade; flash-type utility items may not qualify.'}",
"make_it_slow:{task:'Defeat the target only after the required minimum number of turns.',hint:'Keep the fight alive until the turn requirement is met.'}":"make_it_slow:{task:'Defeat the target in no fewer than the required 5–9 turns.',hint:'Keep the fight alive until the required turn count, then finish the target.'}",
"motivator:{task:'Lose or stalemate against the target on your first attempt.',hint:'Do not let the fight time out.'}":"motivator:{task:'Lose or stalemate against the target on your first attempt.',hint:'Lowering your health and unequipping armor can make this easier.'}",
"painleth_dentitht:{task:'Defeat the target with a baseball bat.',hint:'Do not use other weapons during the fight.'}":"painleth_dentitht:{task:'Defeat the target with a baseball bat.',hint:'Other weapons may stay equipped; the baseball bat must satisfy the mission condition.'}",
"safari:{task:'Defeat the target with a rifle in South Africa.'}":"safari:{task:'Defeat the target with a rifle in South Africa.',hint:'All damaging hits should be made with a rifle; other weapons may remain equipped.'}",
"sellout_slayer:{task:'Buy a gun, use it against 2–6 players, then sell it.'}":"sellout_slayer:{task:'Buy a gun, use that gun against 2–6 players, then sell it.',hint:'Not every ranged weapon is treated as a gun for this mission.'}",
"some_people:{task:'Send any item as a parcel to the target.'}":"some_people:{task:'Send any item as a parcel to the target.'}",
"standard_routine:{task:'Defeat the target using fists, kicks, or a clubbing weapon.'}":"standard_routine:{task:'Defeat the target using fists, kicks, or a clubbing weapon.'}",
"the_executive_game:{task:'Defeat the target using only fists or kicks.',hint:'Weapons may remain equipped if unused.'}":"the_executive_game:{task:'Defeat the target using only fists or kicks.',hint:'Weapons can remain equipped as long as you do not use them.'}",
"the_tattoo_artist:{task:'Defeat the target using only a slashing or piercing weapon.',hint:'Do not fire equipped guns.'}":"the_tattoo_artist:{task:'Defeat the target using only a slashing or piercing weapon.',hint:'Guns can stay equipped, but do not use them.'}",
"withdrawal:{task:'Injure both of the target’s arms.',hint:'Hands count as arm hits.'}":"withdrawal:{task:'Injure both of the target’s arms.',hint:'Hands count as arms for this mission.'}",
}
for a,b in repls.items():
    if a not in s: print('WARN missing entry:',a[:60])
    else: s=s.replace(a,b,1)

# Improve unknown/conflicting mission behavior instead of silently omitting the box.
old="""            const guide = MISSION_GUIDE[normalizeMissionKey(title)];
            if (!guide) { existing?.remove(); continue; }
            const body = context.querySelector('.max-height-fix') || context;
"""
new="""            const key = normalizeMissionKey(title);
            const guide = MISSION_GUIDE[key];
            const body = context.querySelector('.max-height-fix') || context;
"""
if old in s: s=s.replace(old,new,1)
old2="""            box.innerHTML = `<div class=\"sl-mr-guide-title\">🎯 SakaLuX Mission Guide</div><div class=\"sl-mr-guide-row\"><b>Task:</b> ${escapeHtml(guide.task)}</div>${guide.hint ? `<div class=\"sl-mr-guide-row sl-mr-guide-hint\"><b>Hint:</b> ${escapeHtml(guide.hint)}</div>` : ''}`;
"""
new2="""            if (guide) {
                box.innerHTML = `<div class=\"sl-mr-guide-title\">🎯 SakaLuX Mission Guide</div><div class=\"sl-mr-guide-row\"><b>Task:</b> ${escapeHtml(guide.task)}</div>${guide.hint ? `<div class=\"sl-mr-guide-row sl-mr-guide-hint\"><b>Hint:</b> ${escapeHtml(guide.hint)}</div>` : ''}`;
                box.classList.remove('unknown');
            } else {
                box.classList.add('unknown');
                box.innerHTML = `<div class=\"sl-mr-guide-title\">🎯 SakaLuX Mission Guide</div><div class=\"sl-mr-guide-row\"><b>Info:</b> No guide entry found for <b>${escapeHtml(title || 'this mission')}</b>.</div><div class=\"sl-mr-guide-row sl-mr-guide-hint\">If another script changes mission titles, disable that title modification and refresh.</div>`;
            }
"""
if old2 in s: s=s.replace(old2,new2,1)

# Styling for unknown state.
s=s.replace(".sl-mr-guide-hint{color:#cbd5e1!important}.sl-mr-external-mission-info{display:none!important}",".sl-mr-guide-hint{color:#cbd5e1!important}.sl-mr-mission-guide.unknown{border-color:#735d2a!important;background:linear-gradient(145deg,rgba(50,41,22,.96),rgba(25,22,17,.96))!important}.sl-mr-external-mission-info{display:none!important}",1)

p.write_text(s,encoding='utf-8')

# Registry sync
rp=ROOT/'scripts.json'; data=json.loads(rp.read_text(encoding='utf-8'))
for row in data['scripts']:
    if row.get('id')=='mission-rewards': row['version']='1.1.1'
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub fallback sync
hp=ROOT/'SakaLuX-Script-Hub.user.js'; h=hp.read_text(encoding='utf-8')
h,n=re.subn(r"(id:\s*['\"]mission-rewards['\"][\s\S]{0,500}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>1.1.1\2',h,count=1)
if n!=1: raise SystemExit('Hub mission fallback version not found')
hp.write_text(h,encoding='utf-8')

# Dedicated docs
md=ROOT/'greasyfork/Mission-Rewards.md'; d=md.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s+\*\*v)[^*]+(\*\*)',r'\g<1>1.1.1\2',d,count=1)
if '## Current release notes' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## )',"""## Current release notes
- **v1.1.1:** Mission Guide synchronized with the current public TornTools Mission Hints behavior and recent mission requirement corrections.
- Adds updated guidance for missions including A Problem at the Tracks, A Thor Loser, Estranged, Frenzy, Graffiti, Inside Job, Safari and Sellout Slayer.
- Unknown or title-conflicted missions now show a clear SakaLuX diagnostic instead of silently showing nothing.
- The integration is independently implemented and reworded for SakaLuX Mission Rewards; no TornTools source code is embedded.
""",d,count=1)
md.write_text(d,encoding='utf-8')

# Hub info list version
md=ROOT/'greasyfork/Script-Hub.md'; d=md.read_text(encoding='utf-8')
d=re.sub(r'(- .*SakaLuX Mission Rewards \*\*v)[^*]+(\*\*)',r'\g<1>1.1.1\2',d)
md.write_text(d,encoding='utf-8')

# Invariants
src=p.read_text(encoding='utf-8')
for needle in ['@version      1.1.1',"const VERSION = '1.1.1'",'const MISSION_GUIDE = {','a_thor_loser:{task:"Hit 6–14 unique body parts','estranged:{task:\'Injure one of the target’s legs.\',hint:\'Feet count as leg hits']:
    if needle not in src: raise SystemExit('Missing invariant: '+needle)
print('Mission Rewards v1.1.1 current Mission Hints sync applied')
