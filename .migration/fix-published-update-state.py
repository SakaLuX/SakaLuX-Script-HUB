from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
text=p.read_text(encoding='utf-8')

# Hub version
text,n=re.subn(r'(^// @version\s+)1\.9\.26(\s*$)',r'\g<1>1.9.27\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('hub metadata version')
text,n=re.subn(r"const VERSION\s*=\s*'1\.9\.26';","const VERSION = '1.9.27';",text,count=1)
if n!=1: raise SystemExit('hub runtime version')

needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.27',
            date: '2026-09-12',
            changes: [
                'Update availability now follows the version actually published by the configured Greasy Fork meta source.',
                'Registry versions ahead of Greasy Fork are shown as PUBLISH PENDING instead of creating an update loop.',
                'UPDATE no longer redirects to the raw GitHub source when the public distribution is behind.'
            ]
        },
"""
if needle not in text: raise SystemExit('changelog anchor')
text=text.replace(needle,entry,1)

old="""    function canonicalLatestVersion(script, publishedVersion) {
        const registryVersion = String(script?.expectedVersion || script?.version || '0');
        const published = publishedVersion ? String(publishedVersion) : null;
        return published && compareVersions(published, registryVersion) > 0 ? published : registryVersion;
    }

    function getInstallUrl(script) {
        const data = normalizeCachedUpdate(script);
        if (data?.distributionBehind && script.sourceUrl) return script.sourceUrl;
        return script.downloadUrl || script.sourceUrl || '';
    }
"""
new="""    function canonicalLatestVersion(script, publishedVersion) {
        const registryVersion = String(script?.expectedVersion || script?.version || '0');
        const published = publishedVersion ? String(publishedVersion) : null;
        return published || registryVersion;
    }

    function getInstallUrl(script) {
        return script.downloadUrl || script.sourceUrl || '';
    }
"""
if old not in text: raise SystemExit('canonical/getInstallUrl block')
text=text.replace(old,new,1)

old="""        const publishedLatest = data.publishedLatest ? String(data.publishedLatest) : (data.latest ? String(data.latest) : null);
        const latest = canonicalLatestVersion(script, publishedLatest);
        const distributionBehind = Boolean(publishedLatest && compareVersions(publishedLatest, script.expectedVersion) < 0);
        const available = Boolean(installed && latest && compareVersions(latest, installed) > 0);
"""
new="""        const publishedLatest = data.publishedLatest ? String(data.publishedLatest) : null;
        const latest = canonicalLatestVersion(script, publishedLatest);
        const distributionBehind = Boolean(publishedLatest && compareVersions(publishedLatest, script.expectedVersion) < 0);
        const available = Boolean(installed && publishedLatest && compareVersions(publishedLatest, installed) > 0);
"""
if old not in text: raise SystemExit('normalize update block')
text=text.replace(old,new,1)

old="""            available: Boolean(installed && compareVersions(latest, installed) > 0),
"""
new="""            available: Boolean(installed && publishedLatest && compareVersions(publishedLatest, installed) > 0),
"""
if old not in text: raise SystemExit('checkScriptUpdate available')
text=text.replace(old,new,1)

old="""        if (data.error) return { state: 'failed', text: 'CHECK FAILED', data };
        if (data.available) return { state: 'available', text: 'UPDATE AVAILABLE', data };
        return { state: 'current', text: 'UP TO DATE', data };
"""
new="""        if (data.error) return { state: 'failed', text: 'CHECK FAILED', data };
        if (data.available) return { state: 'available', text: 'UPDATE AVAILABLE', data };
        if (data.distributionBehind) return { state: 'pending', text: 'PUBLISH PENDING', data };
        return { state: 'current', text: 'UP TO DATE', data };
"""
if old not in text: raise SystemExit('getUpdateState block')
text=text.replace(old,new,1)

old="""        const latest = update.data?.latest || script.expectedVersion || '?';
"""
new="""        const latest = update.data?.publishedLatest || update.data?.latest || script.expectedVersion || '?';
"""
if old not in text: raise SystemExit('render latest')
text=text.replace(old,new,1)

old="""        const updateChipClass = update.state === 'current' ? 'good' : update.state === 'available' ? 'warn' : update.state === 'failed' ? 'bad' : 'muted';
"""
new="""        const updateChipClass = update.state === 'current' ? 'good' : update.state === 'available' ? 'warn' : update.state === 'pending' ? 'info' : update.state === 'failed' ? 'bad' : 'muted';
"""
if old not in text: raise SystemExit('update chip class')
text=text.replace(old,new,1)

old="""                    ${latest !== '?' && update.state === 'available' ? `<span class=\"slh-chip info\">LATEST v${escapeHtml(latest)}</span>` : ''}
"""
new="""                    ${update.state === 'pending' ? `<span class=\"slh-chip muted\">REGISTRY v${escapeHtml(script.expectedVersion || '?')} PENDING</span>` : latest !== '?' && update.state === 'available' ? `<span class=\"slh-chip info\">LATEST v${escapeHtml(latest)}</span>` : ''}
"""
if old not in text: raise SystemExit('latest chip')
text=text.replace(old,new,1)

text=text.replace("(mirror behind; GitHub source used)","(publish pending)")

p.write_text(text,encoding='utf-8')

# Documentation/release info sync.
hubdoc=ROOT/'greasyfork/Script-Hub.md'
d=hubdoc.read_text(encoding='utf-8')
d=d.replace('## Current version\n1.9.26','## Current version\n1.9.27',1)
release_note="""## Current release note

Update checks now distinguish **registry/source development versions** from versions actually published on Greasy Fork. **UPDATE AVAILABLE** is shown only when the configured Greasy Fork `meta.js` exposes a newer installable version. When `scripts.json` is ahead of Greasy Fork, Hub shows **PUBLISH PENDING** instead of repeatedly asking the user to install an unavailable release.
"""
d=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',release_note+'\n## Recommended',d,count=1,flags=re.S)
d=d.replace('- 🛡️ SakaLuX Enhancer Guard **v1.3.27**','- 🛡️ SakaLuX Enhancer Guard **v1.3.28**')
d=d.replace('- 💬 SakaLuX Bazaar Thanker - PDA **v5.3.17**','- 💬 SakaLuX Bazaar Thanker - PDA **v5.3.18**')
d=d.replace('- 🎯 SakaLuX Mission Rewards **v1.0.15**','- 🎯 SakaLuX Mission Rewards **v1.0.16**')
d=d.replace('- 📈 SakaLuX Market Intelligence **v1.17.15**','- 📈 SakaLuX Market Intelligence **v1.17.16**')
d=d.replace('- ⚔️ SakaLuX Elimination Assistant **v1.3.27**','- ⚔️ SakaLuX Elimination Assistant **v1.3.28**')
if '### v1.9.27 — Published release-aware updates' not in d:
    d=d.replace('## Release history\n','## Release history\n### v1.9.27 — Published release-aware updates\n\n- Uses the configured Greasy Fork `meta.js` version as the installable update source.\n- Registry-ahead versions show **PUBLISH PENDING** and do not increase the update counter.\n- Removed the raw-GitHub-source update fallback that could leave TornPDA on the previous installed version.\n\n',1)
hubdoc.write_text(d,encoding='utf-8')

addon_docs={
 'greasyfork/Enhancer-Guard.md':('1.3.28','Enhancer Guard'),
 'greasyfork/Bazaar-Thanker.md':('5.3.18','Bazaar Thanker'),
 'greasyfork/Mission-Rewards.md':('1.0.16','Mission Rewards'),
 'greasyfork/Market-Intelligence.md':('1.17.16','Market Intelligence'),
 'greasyfork/Elimination-Assistant.md':('1.3.28','Elimination Assistant'),
}
for path,(version,name) in addon_docs.items():
    q=ROOT/path
    s=q.read_text(encoding='utf-8')
    note=f"""## Current release note

**v{version}** fixes Hub/standalone detection for the current SakaLuX launchers. When Script Hub is installed, {name} recognizes the native **S** status-bar launcher, the Fly-out **HUB** launcher and the Hub-active page marker, so the standalone dock and **Install SakaLuX Hub** prompt do not appear at the same time as Hub.
"""
    s=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',note+'\n## Recommended',s,count=1,flags=re.S)
    if f'### v{version} — Hub detection fix' not in s:
        s=s.replace('## Release history\n',f'## Release history\n### v{version} — Hub detection fix\n\n- Recognizes the current Hub S/Fly-out launchers and Hub-active marker.\n- Prevents the standalone dock/install prompt from appearing while Hub is installed.\n\n',1)
    q.write_text(s,encoding='utf-8')

print('Published update-state and release-info sync applied')
