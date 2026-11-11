#!/usr/bin/env python3
"""Prepare changed userscripts for a validated, idempotent GitHub release."""
import argparse
import datetime as dt
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "release-config.json").read_text(encoding="utf-8"))["scripts"]
BY_FILE = {item["file"]: item for item in CONFIG}
DATE = dt.datetime.now(dt.timezone.utc).date().isoformat()


def git(*args, check=True):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=check).stdout.strip()


def version(text):
    match = re.search(r"(?m)^//\s*@version\s+(\d+\.\d+\.\d+)\s*$", text)
    if not match:
        raise ValueError("Missing three-component @version metadata")
    return match.group(1)


def bump(value):
    parts = [int(n) for n in value.split(".")]
    parts[-1] += 1
    return ".".join(map(str, parts))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True, help="Previous commit SHA or ref")
    parser.add_argument("--script-id", help="Force a selected script on workflow_dispatch")
    args = parser.parse_args()
    git("rev-parse", "--verify", args.base)
    changed = set(git("diff", "--name-only", "--diff-filter=ACMRT", args.base, "HEAD").splitlines())
    if args.script_id:
        selected = [e for e in CONFIG if e["id"] == args.script_id]
        if not selected:
            raise ValueError("Unknown script id: " + args.script_id)
    else:
        selected = [e for e in CONFIG if e["file"] in changed]
    if not selected:
        Path(".release-plan.json").write_text('{"releases":[]}\n', encoding="utf-8")
        print("No changed managed userscripts; no release required.")
        return
    discovered = {p for p in changed if p.endswith(".user.js") and Path(p).parent == Path(".")}
    unknown = discovered - set(BY_FILE)
    if unknown:
        raise ValueError("Unmanaged userscripts must be registered first: " + ", ".join(sorted(unknown)))

    notes_by_id = {}
    plan = []
    for entry in selected:
        path = ROOT / entry["file"]
        source = path.read_text(encoding="utf-8")
        current = version(source)
        previous = git("show", f"{args.base}:{entry['file']}", check=False)
        old = version(previous) if previous else None
        if old:
            if tuple(map(int, current.split("."))) < tuple(map(int, old.split("."))):
                raise ValueError(f"{entry['id']}: version rollback {old} -> {current}")
            if current == old:
                current = bump(current)
                source = re.sub(r"(?m)^(//\s*@version\s+)\d+\.\d+\.\d+", lambda m: m[1] + current, source, count=1)
                path.write_text(source, encoding="utf-8")
        if entry["id"] == "gym-optimizer":
            source = re.sub(r"(const id=\x27gym-optimizer\x27,v=\x27)\d+\.\d+\.\d+(\x27)", lambda m: m[1] + current + m[2], source, count=1)
            path.write_text(source, encoding="utf-8")
            meta_path = ROOT / "SakaLuX-Gym-Optimizer.meta.js"
            meta = meta_path.read_text(encoding="utf-8")
            meta = re.sub(r"(?m)^(//\s*@version\s+)\d+\.\d+\.\d+", lambda m: m[1] + current, meta, count=1)
            meta_path.write_text(meta, encoding="utf-8")

        subjects = git("log", "--format=%s", f"{args.base}..HEAD", "--", entry["file"]).splitlines()
        subjects = list(dict.fromkeys(x.strip() for x in subjects if x.strip() and "[skip-sync]" not in x))
        if not subjects:
            subjects = ["Repository script update"]
        notes = [f"Source change: {subject}." for subject in subjects[:8]]
        notes.append(f"Updated canonical userscript version to v{current}; package verified by GitHub Actions.")
        notes_by_id[entry["id"]] = notes
        plan.append({"id": entry["id"], "version": current, "file": entry["file"],
                     "doc": entry["doc"], "tag": f"{entry['tagPrefix']}{current}"})

    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".json", delete=False) as temp:
        json.dump(notes_by_id, temp, ensure_ascii=False)
        notes_path = temp.name
    subprocess.run([sys.executable, "tools/sync_release_metadata.py", "--date", DATE,
                    "--notes", notes_path, "--only", *[p["id"] for p in plan]],
                   cwd=ROOT, check=True)

    for item in plan:
        release_path = ROOT / "releases" / f"{item['id']}-v{item['version']}-version-audit-{DATE.replace('-', '')}.md"
        release_path.parent.mkdir(exist_ok=True)
        release_path.write_text(f"# {item['id']} v{item['version']}\n\n"
                                f"Release date: {DATE}\n\n" +
                                "\n".join("- " + n for n in notes_by_id[item["id"]]) +
                                "\n\nValidation: GitHub Actions preflight, regression and syntax gates are required before publishing.\n",
                                encoding="utf-8")
    # Update the repository-wide changelog as well as each module's GreasyFork documentation.
    global_log = ROOT / "CHANGELOG.md"
    existing = global_log.read_text(encoding="utf-8") if global_log.exists() else "# Changelog\n"
    additions = []
    for item in plan:
        heading = f"## {item['id']} v{item['version']} — automatic release ({DATE})"
        if heading not in existing:
            additions.append(heading + "\n\n" +
                             "\n".join("- " + note for note in notes_by_id[item["id"]]) + "\n")
    if additions:
        if existing.startswith("# Changelog"):
            first_line, _, remainder = existing.partition("\n")
            global_log.write_text(first_line + "\n\n" + "\n".join(additions) + "\n" +
                                  remainder.lstrip("\n"), encoding="utf-8")
        else:
            global_log.write_text("\n\n".join(additions) + "\n" + existing, encoding="utf-8")
    (ROOT / ".release-plan.json").write_text(json.dumps({"releases": plan}, indent=2) + "\n", encoding="utf-8")
    print("Prepared releases:", ", ".join(p["tag"] for p in plan))


if __name__ == "__main__":
    main()
