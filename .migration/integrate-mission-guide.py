from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]

p=ROOT/'SakaLuX-Mission-Rewards.user.js'
s=p.read_text(encoding='utf-8')
old='1.0.18'; new='1.1.0'

# Version sync
s=re.sub(r'(^// @version\s+)'+re.escape(old)+r'(\s*$)',r'\g<1>'+new+r'\2',s,count=1,flags=re.M)
s=re.sub(r"const VERSION\s*=\s*['\"]"+re.escape(old)+r"['\"]",f"const VERSION = '{new}'",s,count=1)
s=s.replace(f"version:'{old}'",f"version:'{new}'")

# Settings
s=s.replace("        showCardBadges: true\n", "        showCardBadges: true,\n        showMissionGuide: true\n", 1)

GUIDE=r'''
    /*
     * SakaLuX Mission Guide
     * Independent implementation. Mission requirements were cross-checked against
     * public TornTools Mission Hints references and community documentation.
     * Text below is intentionally concise/rephrased for the SakaLuX UI.
     */
    const MISSION_GUIDE = {
        a_good_day_to_get_hard:{task:'Build a 3–10 kill streak.',hint:'Buying losses can help.'},
        a_kimpossible_task:{task:'Defeat the target using melee and temporary weapons only.',hint:'Guns may stay equipped; do not use them.'},
        a_problem_at_the_tracks:{task:'Defeat 3 targets without using guns.',hint:'Other weapons are fine; firing a gun fails it.'},
        a_thor_loser:{task:"Hit 8–16 unique body parts with Duke’s hammer.",hint:'Long fights/stalemates give more chances.'},
        against_the_odds:{task:'Defeat 2 targets.'},
        an_honorary_degree:{task:'Defeat the target without using guns.',hint:'Guns can remain equipped.'},
        army_of_one:{task:'Attack the target 3 times while changing masks.',hint:'One attack must be with no mask; winning is not required every time.'},
        bakeout_breakout:{task:'Combine a fruitcake with the lock pick, then send the special fruitcake to a jailed player.'},
        bare_knuckle:{task:'Defeat the target with no weapons or armor equipped.',hint:'Unequip everything before the fight.'},
        batshit_crazy:{task:'Deal the required damage with Penelope.',hint:'Duke supplies Penelope.'},
        battering_ram:{task:'Attack the target 3 times.'},
        big_tub_of_muscle:{task:'Defeat the target despite boosted strength.'},
        birthday_surprise:{task:'Send Duke the requested item as a present.',hint:'Use an empty box and gift wrap to make a parcel.'},
        bonnie_and_clyde:{task:'Defeat the target and their spouse.'},
        bountiful:{task:'Successfully claim 2–5 bounties.',hint:'Hospitalize the bounty target for the claim.'},
        bounty_on_the_mutiny:{task:'Place a bounty on the target and wait for someone to claim it.',hint:'You cannot claim your own bounty.'},
        bring_it:{task:'Defeat Duke in a group attack.',hint:'Joining a loot fight can count; you do not need the finishing hit.'},
        candy_from_babies:{task:'Collect the required total bounty value.',hint:'It may be split across multiple bounties.'},
        charity_work:{task:'Successfully mug 2 targets.',hint:'A small transfer beforehand can guarantee mug cash.'},
        cracking_up:{task:'Interrogate the target for Duke’s safe code, open the safe, then send Duke its contents.',hint:'It may take several attempts to obtain the code.'},
        critical_education:{task:'Land 3–9 critical hits.'},
        cut_them_down_to_size:{task:'Defeat any player at your level or higher.'},
        dirty_little_secret:{task:'Bounty the target, then attack the player who claims that bounty.',hint:'Anonymous claimers can still expose an ID in the mission panel.'},
        double_jeopardy:{task:'Place a bounty on the target and defeat them.',hint:'The bounty does not need to be claimed.'},
        drug_problem:{task:'Defeat 4–7 targets.'},
        emotional_debt:{task:'Hit the target with tear gas or pepper spray.',hint:'The temporary weapon must not be blocked.'},
        estranged:{task:'Injure one of the target’s legs.'},
        family_ties:{task:'Hospitalize the target 3 times.'},
        field_trip:{task:'Win the required amount on 3 casino games.'},
        fireworks:{task:'Use 250–1,250 rounds of ammunition.'},
        forgotten_bills:{task:'Defeat the target.'},
        frenzy:{task:'Defeat 5–15 players.'},
        get_things_jumping:{task:'Deal and receive the required amount of damage.'},
        graffiti:{task:'Hit the target with pepper spray.'},
        guardian:{task:'Defeat the target.'},
        hammer_time:{task:'Defeat the target with a hammer.',hint:'Dual hammers do not count.'},
        hands_off:{task:'Defeat 3–5 targets.'},
        hare_meet_tortoise:{task:'Defeat the target despite boosted speed.',hint:'Flash or smoke can reduce speed.'},
        hide_and_seek:{task:'Identify the correct player from the listed clues and defeat them.'},
        hiding_in_plain_view:{task:'Defeat the target while they are in the required foreign country.'},
        high_fliers:{task:'Defeat 3 targets in the specified foreign countries.'},
        hobgoblin:{task:'Defeat a player of your choice 5 times.'},
        immovable_object:{task:'Defeat the target despite boosted defense.'},
        inside_job:{task:'Attack the target and plant the required item on them.'},
        introduction_duke:{task:'Complete 10 Duke contracts.'},
        keeping_up_appearances:{task:'Mug the target, then return the money.',hint:'The mug must be successful.'},
        kiss_of_death:{task:'Defeat the target and choose the kiss finishing option.'},
        lack_of_awareness:{task:'Defeat the target.'},
        lost_and_found:{task:'Hospitalize the target for 12 hours.'},
        loud_and_clear:{task:'Use 3–11 explosive grenades.',hint:'Use damaging grenade types.'},
        loyal_customer:{task:'Defeat the target.'},
        make_it_slow:{task:'Defeat the target only after the required minimum number of turns.',hint:'Keep the fight alive until the turn requirement is met.'},
        marriage_counseling:{task:'Defeat the target’s spouse.'},
        massacrist:{task:'Defeat the target.'},
        meeting_the_challenge:{task:'Mug players until the required total cash has been collected.'},
        motivator:{task:'Lose or stalemate against the target on your first attempt.',hint:'Do not let the fight time out.'},
        new_kid_on_the_block:{task:'Defeat 5 players.'},
        no_man_is_an_island:{task:'Mug 2 of the 3 listed targets.',hint:'Any two different listed targets count.'},
        no_second_chances:{task:'Defeat the target on the first attempt.'},
        out_of_the_frying_pan:{task:'Go to jail, use Felovax to move to hospital, then use Zylkene.'},
        painleth_dentitht:{task:'Defeat the target with a baseball bat.',hint:'Do not use other weapons during the fight.'},
        party_tricks:{task:'Defeat the target despite boosted dexterity.'},
        pass_the_word:{task:'Send the target a message containing the required keyword.',hint:'Copying the relevant mission text into Torn mail is the safest method.'},
        peak_experience:{task:'Defeat the target.'},
        proof_of_the_pudding:{task:'Use the requested weapon type on the target, then send that weapon type to them.',hint:'It does not have to be the exact same item instance.'},
        rabbit_response:{task:'Defeat 3 targets within the mission time window.',hint:'The timer begins after you attack the first target.'},
        reconstruction:{task:'Equip a kitchen knife and leather gloves, defeat the target, then dump both items.',hint:'The knife only needs to be equipped.'},
        red_faced:{task:'Land the finishing hit with a trout.'},
        rising_costs:{task:'Hit the target with a brick.',hint:'The brick must connect.'},
        rolling_in_it:{task:'Successfully mug the target.',hint:'A small transfer beforehand can guarantee mug cash.'},
        safari:{task:'Defeat the target with a rifle in South Africa.'},
        scammer:{task:'Defeat the target.',hint:'Mugging may be worthwhile if they are carrying cash.'},
        sellout_slayer:{task:'Buy a gun, use it against 2–6 players, then sell it.'},
        sending_a_message:{task:'Defeat the target.'},
        show_some_muscle:{task:'Attack the target.',hint:'You only need to initiate the attack; a win is not required.'},
        sleep_aid:{task:'Defeat the target.'},
        some_people:{task:'Send any item as a parcel to the target.'},
        standard_routine:{task:'Defeat the target using fists, kicks, or a clubbing weapon.'},
        stomach_upset:{task:'Injure the target’s stomach.'},
        swan_step_too_far:{task:'Find an item in the dump, then defeat its previous owner.',hint:'Keep searching until the previous owner is a viable target.'},
        the_executive_game:{task:'Defeat the target using only fists or kicks.',hint:'Weapons may remain equipped if unused.'},
        the_tattoo_artist:{task:'Defeat the target using only a slashing or piercing weapon.',hint:'Do not fire equipped guns.'},
        three_peat:{task:'Leave one player, mug one player, and hospitalize one player.'},
        training_day:{task:'Spend 250–1,250 energy in the gym.'},
        tree_huggers:{task:'Defeat 5–8 targets.'},
        undercutters:{task:'Defeat 3 targets.'},
        unwanted_attention:{task:'Hospitalize 4 targets.'},
        withdrawal:{task:'Injure both of the target’s arms.',hint:'Hands count as arm hits.'},
        wrath_of_duke:{task:'Defeat 4 targets.'}
    };

    function normalizeMissionKey(title) {
        return String(title || '')
            .toLowerCase()
            .replace(/&nbsp;/g, ' ')
            .replace(/[’']/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[-\s]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function getMissionTitle(context) {
        const titleNode = context.querySelector('.title-black');
        if (!titleNode) return '';
        const raw = titleNode.childNodes?.[0]?.wholeText || titleNode.textContent || '';
        return String(raw).replace(/\n/g, ' ').trim();
    }

    function suppressExternalMissionInfo(context) {
        for (const node of context.querySelectorAll('.tpda-mission-information,.tt-mission-information,[class*="mission-information"]')) {
            if (node.classList.contains('sl-mr-mission-guide')) continue;
            const text = String(node.textContent || '').toLowerCase();
            if (text.includes('mission information') || text.includes('torntools')) {
                node.classList.add('sl-mr-external-mission-info');
                node.style.setProperty('display','none','important');
            }
        }
    }

    function renderMissionGuides() {
        if (!state.enabled || !isMissionsPage()) return;
        const contexts = [...document.querySelectorAll('.giver-cont-wrap > div[id^="mission"]')];
        for (const context of contexts) {
            suppressExternalMissionInfo(context);
            const existing = context.querySelector('.sl-mr-mission-guide');
            if (!settings.showMissionGuide) { existing?.remove(); continue; }
            const title = getMissionTitle(context);
            const guide = MISSION_GUIDE[normalizeMissionKey(title)];
            if (!guide) { existing?.remove(); continue; }
            const body = context.querySelector('.max-height-fix') || context;
            let box = existing;
            if (!box) {
                box = document.createElement('div');
                box.className = 'sl-mr-mission-guide';
                body.appendChild(box);
            }
            box.innerHTML = `<div class="sl-mr-guide-title">🎯 SakaLuX Mission Guide</div><div class="sl-mr-guide-row"><b>Task:</b> ${escapeHtml(guide.task)}</div>${guide.hint ? `<div class="sl-mr-guide-row sl-mr-guide-hint"><b>Hint:</b> ${escapeHtml(guide.hint)}</div>` : ''}`;
        }
    }

    function clearMissionGuides() {
        document.querySelectorAll('.sl-mr-mission-guide').forEach(el => el.remove());
        document.querySelectorAll('.sl-mr-external-mission-info').forEach(el => {
            el.classList.remove('sl-mr-external-mission-info');
            el.style.removeProperty('display');
        });
    }
'''

anchor='    function getApiKey() {'
if 'const MISSION_GUIDE = {' not in s:
    if anchor not in s: raise SystemExit('Mission Guide insertion anchor missing')
    s=s.replace(anchor,GUIDE+'\n'+anchor,1)

# Scan integration
s=s.replace("    async function scanRewards(force = false) {\n        if (!state.enabled || !isMissionsPage()) return;\n", "    async function scanRewards(force = false) {\n        if (!state.enabled || !isMissionsPage()) return;\n        renderMissionGuides();\n",1)

# Settings UI + save
needle="                <label class=\"sl-mr-setting\"><input id=\"sl-mr-show-badges\" type=\"checkbox\" ${settings.showCardBadges ? 'checked' : ''}> Show information directly on reward cards</label>\n"
repl=needle+"                <label class=\"sl-mr-setting\"><input id=\"sl-mr-show-guide\" type=\"checkbox\" ${settings.showMissionGuide ? 'checked' : ''}> Show Duke mission Task + Hint guide</label>\n"
if needle not in s: raise SystemExit('Settings UI anchor missing')
s=s.replace(needle,repl,1)
s=s.replace("            settings.showCardBadges = document.getElementById('sl-mr-show-badges').checked;\n", "            settings.showCardBadges = document.getElementById('sl-mr-show-badges').checked;\n            settings.showMissionGuide = document.getElementById('sl-mr-show-guide').checked;\n",1)

# CSS
css_anchor='            .sl-mr-detail{margin-top:10px;padding:10px;border-radius:9px;background:#111827;border:1px solid #303640;color:#e5e7eb;font-size:11px;line-height:1.6}.sl-mr-detail-title{color:#fbbf24;font-size:12px;font-weight:900;margin-bottom:6px}.sl-mr-highlight{margin-top:5px;color:#4ade80;font-size:12px}.sl-mr-note{margin-top:7px;color:#9ca3af;font-size:9px}\n'
css_add=css_anchor+'            .sl-mr-mission-guide{margin-top:14px!important;padding:11px 12px!important;border-top:1px solid rgba(255,255,255,.12)!important;border-radius:10px!important;background:linear-gradient(145deg,rgba(24,33,45,.96),rgba(15,20,28,.96))!important;border:1px solid #314154!important;color:#e7edf5!important;font-size:12px!important;line-height:1.45!important;box-shadow:0 6px 18px rgba(0,0,0,.18)!important}.sl-mr-guide-title{text-align:center!important;margin-bottom:7px!important;color:#6fa6ef!important;font-weight:900!important;font-size:12px!important;letter-spacing:.03em!important}.sl-mr-guide-row{margin-top:4px!important}.sl-mr-guide-row b{color:#f8fafc!important}.sl-mr-guide-hint{color:#cbd5e1!important}.sl-mr-external-mission-info{display:none!important}\n'
if css_anchor not in s: raise SystemExit('CSS anchor missing')
s=s.replace(css_anchor,css_add,1)

# Runtime cleanup + health
s=s.replace("        removeDetailPanel();\n        document.querySelectorAll('.sl-mr-card-info')", "        removeDetailPanel();\n        clearMissionGuides();\n        document.querySelectorAll('.sl-mr-card-info')",1)
s=s.replace("                rewardCards: isMissionsPage() ? getRewardCards().length : 0,\n", "                rewardCards: isMissionsPage() ? getRewardCards().length : 0,\n                missionGuides: isMissionsPage() ? document.querySelectorAll('.sl-mr-mission-guide').length : 0,\n",1)

p.write_text(s,encoding='utf-8')

# Registry
rp=ROOT/'scripts.json'; data=json.loads(rp.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item.get('id')=='mission-rewards':
        item['version']=new
        item['description']='Duke mission Task + Hint guide plus Mission Shop reward value, ammo ownership and mod intelligence.'
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub fallback + Hub release
hp=ROOT/'SakaLuX-Script-Hub.user.js'; h=hp.read_text(encoding='utf-8')
h=re.sub(r"(id:\s*['\"]mission-rewards['\"][\s\S]{0,500}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>'+new+r'\2',h,count=1)
h=re.sub(r'(^// @version\s+)1\.9\.33(\s*$)',r'\g<1>1.9.34\2',h,count=1,flags=re.M)
h=h.replace("const VERSION = '1.9.33';","const VERSION = '1.9.34';",1)
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.34',
            date: '2026-09-12',
            changes: [
                'Mission Rewards v1.1.0 now includes an integrated Duke Mission Guide with Task and Hint information.',
                'Mission Guide works inside the managed Mission Rewards module and avoids duplicate TornTools-style information boxes.',
                'Registry and release information are synchronized with the new Missions feature release.'
            ]
        },
"""
if "version: '1.9.34'" not in h: h=h.replace(needle,entry,1)
hp.write_text(h,encoding='utf-8')

# Mission doc
md=ROOT/'greasyfork/Mission-Rewards.md'; d=md.read_text(encoding='utf-8')
d=d.replace('**v1.0.18**','**v1.1.0**',1)
if 'Duke Mission Guide' not in d:
    d=d.replace('## What it does\n','## What it does\n- Adds a **Duke Mission Guide** directly to mission cards with a concise **Task** and optional **Hint**.\n- Recognizes the standard Duke mission catalogue locally and does not require API access for mission hints.\n- Suppresses duplicate TornTools/TornPDA mission-information boxes when the integrated guide is active.\n',1)
# Replace current release note section conservatively
if '## Current release notes\n' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?\n## Recommended',"""## Current release notes
- **v1.1.0:** Integrated Duke Mission Guide with Task + Hint information, based on independently implemented mission-title matching and publicly documented mission requirements.
- Added a Settings switch to enable/disable the Mission Guide.
- Prevents duplicate TornTools/TornPDA mission-information boxes when SakaLuX Mission Guide is active.
- Existing Mission Shop value/credit, ammo and weapon-mod features remain unchanged.

## Recommended""",d,count=1)
md.write_text(d,encoding='utf-8')

# Hub info
md=ROOT/'greasyfork/Script-Hub.md'; d=md.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.33**','## Current version\n**v1.9.34**',1)
d=re.sub(r'(- .*SakaLuX Mission Rewards \*\*v)[^*]+(\*\*)',r'\g<1>1.1.0\2',d)
if '## Current release notes\n' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?\n## Recommended',"""## Current release notes
- **v1.9.34:** Mission Rewards v1.1.0 adds the integrated Duke Mission Guide (Task + Hint) while preserving the existing reward-intelligence features.

## Recommended""",d,count=1)
md.write_text(d,encoding='utf-8')

print('Mission Guide integrated into Mission Rewards v1.1.0; Hub v1.9.34')