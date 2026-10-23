#!/usr/bin/env python3
"""One-time release metadata bump for all consumers changed by PR #50.

Runs on a checked-out Git repository, so large Suite source stays intact.
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/"release-config.json").read_text())
REGISTRY_PATH=ROOT/"scripts.json"
registry=json.loads(REGISTRY_PATH.read_text())
TARGETS={entry['id'] for entry in CONFIG['scripts']}
NOTE="Integrate independently verified, digitally signed PRO grants and Hub-independent license startup (PR #50)."
today="2026-10-23"
mapping={}
for entry in CONFIG["scripts"]:
    sid=entry["id"]
    if sid not in TARGETS: continue
    source_path=ROOT/entry["file"]
    source=source_path.read_text(encoding="utf-8")
    match=re.search(r"(?m)^(//\s*@version\s+)(\d+\.\d+\.\d+)(\s*)$",source)
    if not match: raise RuntimeError(f"Missing version: {source_path}")
    old=match.group(2)
    major,minor,patch=map(int,old.split("."))
    new=f"{major}.{minor}.{patch+1}"
    # Replace version string across THIS script to keep internal version identifiers aligned.
    source=source.replace(old,new)
    source_path.write_text(source,encoding="utf-8")
    doc_path=ROOT/entry["doc"]
    doc=doc_path.read_text(encoding="utf-8")
    if f"**v{old}**" not in doc:
        raise RuntimeError(f"Current version missing in {doc_path}")
    doc=doc.replace(f"**v{old}**",f"**v{new}**",1)
    doc=re.sub(r"(?m)^([ \t]*-?[ \t]*Canonical version:[ \t]*\*\*v)"+re.escape(old)+r"(\*\*)",lambda m:m.group(1)+new+m.group(2),doc,count=1)
    # Current release note and newest history entry are independent of old history.
    doc=re.sub(r"(## Current release note\s*\n+\*\*v)"+re.escape(old),lambda m:m.group(1)+new,doc,count=1)
    hist=re.search(r"(?im)^##\s+Release history\s*/\s*Changelog\s*$",doc)
    release_note=NOTE if sid not in {"account-auditor","chat-intelligence"} else "Version synchronization for the SakaLuX script release set; no feature behavior change."
    entry_text=f"\n### v{new} — {today}\n- {release_note}\n"
    if hist:
        pos=hist.end()
        doc=doc[:pos]+entry_text+doc[pos:]
    else:
        doc+="\n## Release history / Changelog\n"+entry_text
    doc_path.write_text(doc,encoding="utf-8")
    mapping[sid]=(old,new)
for item in registry["scripts"]:
    sid=item.get("id")
    if sid not in mapping: continue
    new=mapping[sid][1]
    item["version"]=new
    rel=item.setdefault("release",{})
    rel["version"]=new
    rel["date"]=today
    rel["notes"]=[NOTE]
REGISTRY_PATH.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
# Keep the Hub's offline fallback registry *identical* to scripts.json.
hub=ROOT/"SakaLuX-Script-Hub.user.js"
source=hub.read_text(encoding="utf-8")
begin="    const FALLBACK_REGISTRY = "
end="\n\n    const FALLBACK_MODULE_DETAILS = "
a=source.find(begin);b=source.find(end,a)
if a<0 or b<0: raise RuntimeError("Hub fallback boundary missing")
fallback={"scripts":registry.get("scripts",[]),"lastVerified":registry.get("lastVerified"),"repository":registry.get("repository")}
source=source[:a+len(begin)]+json.dumps(fallback,ensure_ascii=False,indent=2)+source[b:]
hub.write_text(source,encoding="utf-8")
print(json.dumps(mapping,indent=2))
