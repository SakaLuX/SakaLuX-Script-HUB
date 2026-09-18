#!/usr/bin/env python3
from pathlib import Path
import json, re, shutil
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parents[2]
TODAY = "2026-09-18"
BACKUP = ROOT / "backups" / "all-release-surfaces-sync-2026-09-18"
BACKUP.mkdir(parents=True, exist_ok=True)

DOC_BY_ID = {
    "enhancer": "greasyfork/Enhancer-Guard.md",
    "bazaar": "greasyfork/Bazaar-Thanker.md",
    "mission-rewards": "greasyfork/Mission-Rewards.md",
    "market-intelligence": "greasyfork/Market-Intelligence.md",
    "elimination-assistant": "greasyfork/Elimination-Assistant.md",
    "company-intelligence": "greasyfork/Company-Intelligence.md",
    "chat-intelligence": "greasyfork/Chat-Intelligence.md",
    "stock-manager-advisor": "greasyfork/Stock-Manager-Advisor.md",
    "account-auditor": "greasyfork/Account-Auditor.md",
}

EXTRA = [
    ("script-hub", "SakaLuX-Script-Hub.user.js", "greasyfork/Script-Hub.md"),
    ("suite", "SakaLuX-Suite.user.js", "greasyfork/SakaLuX-Suite.md"),
]


def backup(path: Path):
    if not path.exists():
        return
    rel = path.relative_to(ROOT)
    out = BACKUP / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    if not out.exists():
        shutil.copy2(path, out)


def get_version(path: Path):
    if not path.exists():
        return None
    # Avoid loading the 1.9MB Suite more than needed.
    with path.open("r", encoding="utf-8", errors="replace") as f:
        head = "".join(f.readline() for _ in range(80))
    m = re.search(r"(?m)^//\s*@version\s+([^\s]+)", head)
    return m.group(1).strip() if m else None


def doc_versions(text: str):
    cv = None
    cr = None
    m = re.search(r"(?is)##\s+Current version\s*\n+\s*\*\*v?([^*\n]+)\*\*", text)
    if m:
        cv = m.group(1).strip()
    m = re.search(r"(?is)##\s+Current release note\b(.*?)(?=\n##\s|\Z)", text)
    if m:
        section = m.group(1)
        vm = re.search(r"\*\*v?([0-9][0-9A-Za-z._-]*)(?=\s|\*|—|-)", section)
        if vm:
            cr = vm.group(1).strip()
    return cv, cr


def sync_doc(path: Path, version: str):
    if not path.exists() or not version:
        return {"doc_before": None, "release_before": None, "changed": False}
    text = path.read_text(encoding="utf-8", errors="replace")
    before_v, before_r = doc_versions(text)
    original = text

    # Canonical Current version surface.
    pat = re.compile(r"(?is)(##\s+Current version\s*\n+\s*\*\*v?)([^*\n]+)(\*\*)")
    if pat.search(text):
        text = pat.sub(lambda m: m.group(1) + version + m.group(3), text, count=1)
    else:
        insert = f"\n## Current version\n**v{version}**\n"
        # Put it after the title/intro, before the first existing H2.
        pos = text.find("\n## ")
        text = text[:pos] + insert + text[pos:] if pos >= 0 else text + insert

    # Canonical Current release note surface. We only change/add the version label;
    # existing human-written feature notes remain intact.
    sec = re.search(r"(?is)(##\s+Current release note\b)(.*?)(?=\n##\s|\Z)", text)
    if sec:
        body = sec.group(2)
        vpat = re.compile(r"(\*\*v?)([0-9][0-9A-Za-z._-]*)(?=\s|\*|—|-)")
        if vpat.search(body):
            body2 = vpat.sub(lambda m: m.group(1) + version, body, count=1)
        else:
            body2 = f"\n\n**v{version} — Current release**\n- Release metadata synchronized with the current userscript.\n" + body
        text = text[:sec.start(2)] + body2 + text[sec.end(2):]
    else:
        anchor = re.search(r"(?is)##\s+Current version.*?(?=\n##\s|\Z)", text)
        block = f"\n## Current release note\n\n**v{version} — Current release**\n- Release metadata synchronized with the current userscript.\n"
        if anchor:
            text = text[:anchor.end()] + block + text[anchor.end():]
        else:
            text += block

    if text != original:
        backup(path)
        path.write_text(text, encoding="utf-8")
    return {"doc_before": before_v, "release_before": before_r, "changed": text != original}


def source_path_from_url(url: str):
    if not url:
        return None
    return ROOT / unquote(Path(urlparse(url).path).name)


registry_path = ROOT / "scripts.json"
backup(registry_path)
registry = json.loads(registry_path.read_text(encoding="utf-8"))
rows = []
registry_changed = False

for entry in registry.get("scripts", []):
    sid = entry.get("id", "")
    source = source_path_from_url(entry.get("sourceUrl", ""))
    version = get_version(source) if source else None
    if not version:
        rows.append((sid, str(source.relative_to(ROOT)) if source and source.exists() else "missing", "NO @version", entry.get("version"), entry.get("release", {}).get("version"), "SKIPPED"))
        continue

    before_reg = str(entry.get("version", ""))
    release = entry.setdefault("release", {})
    before_rel = str(release.get("version", ""))

    if before_reg != version:
        entry["version"] = version
        registry_changed = True
    if before_rel != version:
        release["version"] = version
        release["date"] = TODAY
        notes = release.get("notes")
        if not isinstance(notes, list):
            notes = []
        sync_note = f"Release/version metadata synchronized with current userscript v{version}; existing feature notes retained."
        if sync_note not in notes:
            notes.insert(0, sync_note)
        release["notes"] = notes
        registry_changed = True

    doc_path = ROOT / DOC_BY_ID.get(sid, "") if sid in DOC_BY_ID else None
    d = sync_doc(doc_path, version) if doc_path else {"doc_before": None, "release_before": None, "changed": False}
    status = "SYNCED" if (before_reg != version or before_rel != version or d["changed"]) else "OK"
    rows.append((sid, source.name, version, before_reg, before_rel, f"{status}; doc {d['doc_before'] or '-'} / release {d['release_before'] or '-'}"))

if registry_changed:
    registry_path.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

for sid, source_name, doc_name in EXTRA:
    source = ROOT / source_name
    version = get_version(source)
    doc = ROOT / doc_name
    if not version:
        rows.append((sid, source_name, "NO @version", "n/a", "n/a", "SKIPPED (no userscript metadata header detected)"))
        continue
    d = sync_doc(doc, version)
    rows.append((sid, source_name, version, "n/a", "n/a", f"{'SYNCED' if d['changed'] else 'OK'}; doc {d['doc_before'] or '-'} / release {d['release_before'] or '-'}"))

# Write an explicit audit so later changes can be checked quickly.
audit = ROOT / "RELEASE-SURFACE-AUDIT-2026-09-18.md"
lines = [
    "# Release Surface Audit — 2026-09-18",
    "",
    "Canonical rule: the userscript `@version` is the source of truth. `scripts.json` version/release surfaces and Greasy Fork Current version/Current release note labels must match it.",
    "",
    "| Module | Source | Canonical @version | Registry before | Release before | Result |",
    "|---|---|---:|---:|---:|---|",
]
for row in rows:
    lines.append("| " + " | ".join(str(x).replace("|", "\\|") for x in row) + " |")
lines += [
    "",
    "## Validation",
    "- Active `scripts.json` entries are checked against their source userscript metadata.",
    "- Greasy Fork `Current version` and `Current release note` version labels are synchronized without rewriting human-authored feature notes.",
    "- Script Hub is checked separately because it is the manager, not a registry add-on.",
    "- Suite is synchronized only when a readable userscript metadata header is present.",
]
if audit.exists(): backup(audit)
audit.write_text("\n".join(lines) + "\n", encoding="utf-8")

# Hard validation after edits.
registry2 = json.loads(registry_path.read_text(encoding="utf-8"))
errors = []
for entry in registry2.get("scripts", []):
    source = source_path_from_url(entry.get("sourceUrl", ""))
    version = get_version(source) if source else None
    if not version:
        errors.append(f"{entry.get('id')}: missing canonical @version")
        continue
    if str(entry.get("version")) != version:
        errors.append(f"{entry.get('id')}: registry version {entry.get('version')} != {version}")
    if str(entry.get("release", {}).get("version")) != version:
        errors.append(f"{entry.get('id')}: release version {entry.get('release', {}).get('version')} != {version}")
    doc_name = DOC_BY_ID.get(entry.get("id"))
    if doc_name:
        dv, dr = doc_versions((ROOT / doc_name).read_text(encoding="utf-8", errors="replace"))
        if dv != version:
            errors.append(f"{entry.get('id')}: doc Current version {dv} != {version}")
        if dr != version:
            errors.append(f"{entry.get('id')}: doc Current release note {dr} != {version}")

for sid, source_name, doc_name in EXTRA:
    version = get_version(ROOT / source_name)
    if not version:
        continue
    dv, dr = doc_versions((ROOT / doc_name).read_text(encoding="utf-8", errors="replace"))
    if dv != version: errors.append(f"{sid}: doc Current version {dv} != {version}")
    if dr != version: errors.append(f"{sid}: doc Current release note {dr} != {version}")

if errors:
    raise SystemExit("\n".join(errors))

print("All active release/version surfaces synchronized and validated.")
