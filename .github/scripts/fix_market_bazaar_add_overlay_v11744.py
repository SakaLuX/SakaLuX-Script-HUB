from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OLD_VERSION = "1.17.43"
NEW_VERSION = "1.17.44"
RELEASE_DATE = "2026-09-20"

MARKET_JS = ROOT / "SakaLuX-Market-Intelligence.user.js"
HUB_JS = ROOT / "SakaLuX-Script-Hub.user.js"
REGISTRY = ROOT / "scripts.json"
MARKET_MD = ROOT / "greasyfork" / "Market-Intelligence.md"
HUB_MD = ROOT / "greasyfork" / "Script-Hub.md"
RELEASE_MD = ROOT / "releases" / f"market-intelligence-v{NEW_VERSION}.md"
BACKUP_DIR = ROOT / "backups" / f"market-bazaar-add-cleanup-v{NEW_VERSION}-{RELEASE_DATE}"

RELEASE_NOTES = [
    "Stops Market Intelligence estimate badges from being injected into Bazaar add-item/sale rows that contain quantity and price editors.",
    "Removes already-rendered MI estimate badges as soon as the Bazaar sale picker is detected, including Torn SPA/TornPDA transitions.",
    "Keeps normal Items-page market estimates unchanged outside Bazaar sale-entry controls.",
]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def require_replace(text: str, old: str, new: str, *, count: int = 1, label: str = "replacement") -> str:
    found = text.count(old)
    if found < count:
        raise RuntimeError(f"{label}: expected at least {count} occurrence(s), found {found}")
    return text.replace(old, new, count)


def backup_current() -> None:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    targets = [
        (MARKET_JS, f"SakaLuX-Market-Intelligence-v{OLD_VERSION}.user.js"),
        (MARKET_MD, f"Market-Intelligence-v{OLD_VERSION}.md"),
        (REGISTRY, "scripts.json"),
    ]
    for src, name in targets:
        dst = BACKUP_DIR / name
        if not dst.exists():
            shutil.copy2(src, dst)


def patch_market_js() -> None:
    text = read(MARKET_JS)

    text = require_replace(
        text,
        f"// @version      {OLD_VERSION}",
        f"// @version      {NEW_VERSION}",
        label="userscript metadata version",
    )
    text = require_replace(
        text,
        f"let v = '{OLD_VERSION}';",
        f"let v = '{NEW_VERSION}';",
        label="canonical installed version",
    )
    text = require_replace(
        text,
        f"{{version:'{OLD_VERSION}'}});",
        f"{{version:'{NEW_VERSION}'}});",
        label="standalone registration version",
    )

    old_scan = """    async function scanItems(){
        if(!settings.items)return;const imgs=[...document.querySelectorAll('img[src*=\"/images/items/\"]')],entries=[],seen=new Set();
        for(const img of imgs){const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;const qm=(row.innerText||'').match(/\\bx\\s*([\\d,]+)/i);if(!qm)continue;const qty=Number(qm[1].replace(/,/g,''));if(!(qty>0))continue;seen.add(row);entries.push({id,row,qty});}
        await mapWithLimit(entries.slice(0,MAX_LIVE_FETCHES),async e=>{const market=await fetchMarket(e.id);if(!market)return;const net=market.price*(1-(Number(settings.marketFeePct)||0)/100),box=ensureBadge(e.row,'sl-mi-items');box.innerHTML='<b>☠︎ MI</b> est. net '+money(net)+'/ea · stack '+money(net*e.qty);state.decorated++;});
    }
"""

    new_scan = """    function isBazaarSaleEditorRow(row){
        if(!row?.querySelectorAll)return false;
        const controls=[...row.querySelectorAll('input,textarea,select,[contenteditable=\"true\"]')];
        if(controls.length<2)return false;
        const describe=el=>[
            el.getAttribute?.('placeholder'),el.getAttribute?.('aria-label'),el.getAttribute?.('name'),
            el.getAttribute?.('id'),el.getAttribute?.('class'),el.getAttribute?.('data-testid')
        ].filter(Boolean).join(' ').toLowerCase();
        const labels=controls.map(describe).join(' ');
        const text=(row.innerText||row.textContent||'').replace(/\\s+/g,' ').toLowerCase();
        const hasQty=/(?:^|[^a-z])(qty|quantity)(?:[^a-z]|$)/i.test(labels+' '+text);
        const hasPrice=/(?:^|[^a-z])price(?:[^a-z]|$)/i.test(labels+' '+text);
        return hasQty&&hasPrice;
    }

    function isBazaarAddItemsView(){
        const rows=[],seen=new Set();
        for(const img of document.querySelectorAll('img[src*=\"/images/items/\"]')){
            const row=rowContainer(img);if(!row||seen.has(row))continue;seen.add(row);rows.push(row);
        }
        const editorRows=rows.filter(isBazaarSaleEditorRow).length;
        if(editorRows>=2)return true;
        return editorRows>=1&&/bazaar|sell|add.?item/i.test(location.href);
    }

    async function scanItems(){
        if(!settings.items)return;
        if(isBazaarAddItemsView()){
            document.querySelectorAll('.sl-mi-items').forEach(n=>n.remove());
            return;
        }
        const imgs=[...document.querySelectorAll('img[src*=\"/images/items/\"]')],entries=[],seen=new Set();
        for(const img of imgs){
            const id=itemIdFromImg(img),row=rowContainer(img);
            if(!id||!row||seen.has(row))continue;
            if(isBazaarSaleEditorRow(row)){row.querySelectorAll('.sl-mi-items').forEach(n=>n.remove());continue;}
            const qm=(row.innerText||'').match(/\\bx\\s*([\\d,]+)/i);if(!qm)continue;
            const qty=Number(qm[1].replace(/,/g,''));if(!(qty>0))continue;
            seen.add(row);entries.push({id,row,qty});
        }
        await mapWithLimit(entries.slice(0,MAX_LIVE_FETCHES),async e=>{
            if(isBazaarSaleEditorRow(e.row)){e.row.querySelectorAll('.sl-mi-items').forEach(n=>n.remove());return;}
            const market=await fetchMarket(e.id);if(!market)return;
            const net=market.price*(1-(Number(settings.marketFeePct)||0)/100),box=ensureBadge(e.row,'sl-mi-items');
            box.innerHTML='<b>☠︎ MI</b> est. net '+money(net)+'/ea · stack '+money(net*e.qty);state.decorated++;
        });
    }
"""

    if old_scan not in text:
        if "function isBazaarSaleEditorRow" in text and f"// @version      {NEW_VERSION}" in text:
            return
        raise RuntimeError("scanItems block changed; refusing unsafe patch")
    text = text.replace(old_scan, new_scan, 1)
    write(MARKET_JS, text)


def patch_registry() -> None:
    data = json.loads(read(REGISTRY))
    entry = next((x for x in data.get("scripts", []) if x.get("id") == "market-intelligence"), None)
    if not entry:
        raise RuntimeError("market-intelligence missing from scripts.json")
    entry["version"] = NEW_VERSION
    entry["detailsRevision"] = max(4, int(entry.get("detailsRevision") or 0) + 1)
    entry["release"] = {
        "version": NEW_VERSION,
        "date": RELEASE_DATE,
        "notes": RELEASE_NOTES,
    }
    write(REGISTRY, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def patch_hub_offline_registry() -> None:
    text = read(HUB_JS)
    start = text.find('"id": "market-intelligence"')
    if start < 0:
        raise RuntimeError("market-intelligence offline Hub entry not found")
    end_marker = '"detailsRevision": 3'
    end = text.find(end_marker, start)
    if end < 0:
        end_marker = '"detailsRevision": 4'
        end = text.find(end_marker, start)
    if end < 0:
        raise RuntimeError("market-intelligence Hub detailsRevision boundary not found")
    end += len(end_marker)
    block = text[start:end]
    block = block.replace(f'"version": "{OLD_VERSION}"', f'"version": "{NEW_VERSION}"')
    block = block.replace('"detailsRevision": 3', '"detailsRevision": 4')

    release_re = re.compile(
        r'"release": \{\s*"version": "(?:1\.17\.43|1\.17\.44)",\s*"date": "[^"]+",\s*"notes": \[[\s\S]*?\]\s*\}',
        re.M,
    )
    release_json = json.dumps(
        {"version": NEW_VERSION, "date": RELEASE_DATE, "notes": RELEASE_NOTES},
        ensure_ascii=False,
        indent=4,
    )
    # Match the surrounding Hub indentation used by the embedded offline registry.
    release_json = release_json.replace("\n", "\n                ")
    replacement = '"release": ' + release_json
    block, n = release_re.subn(replacement, block, count=1)
    if n != 1:
        raise RuntimeError("Hub market release block not patched")
    text = text[:start] + block + text[end:]
    write(HUB_JS, text)


def patch_market_markdown() -> None:
    text = read(MARKET_MD)
    text = require_replace(text, f"**v{OLD_VERSION}**", f"**v{NEW_VERSION}**", label="Market MD current version")

    current = f"""## Current release note

**v{NEW_VERSION} — Bazaar add-item overlay isolation**
- {RELEASE_NOTES[0]}
- {RELEASE_NOTES[1]}
- {RELEASE_NOTES[2]}

"""
    text, n = re.subn(r"## Current release note\n[\s\S]*?(?=## Recommended)", current, text, count=1)
    if n != 1:
        raise RuntimeError("Market MD current release section not found")

    history_marker = "## Release history / Changelog\n\n"
    history = f"""### v{NEW_VERSION} — Bazaar add-item overlay isolation
- {RELEASE_NOTES[0]}
- {RELEASE_NOTES[1]}
- {RELEASE_NOTES[2]}

"""
    if history not in text:
        text = require_replace(text, history_marker, history_marker + history, label="Market MD changelog")
    write(MARKET_MD, text)


def patch_hub_markdown() -> None:
    text = read(HUB_MD)
    old = f"- 📈 SakaLuX Market Intelligence **v{OLD_VERSION}**"
    new = f"- 📈 SakaLuX Market Intelligence **v{NEW_VERSION}**"
    if old in text:
        text = text.replace(old, new, 1)
    elif new not in text:
        raise RuntimeError("Script-Hub.md Market version line not found")
    write(HUB_MD, text)


def write_release_info() -> None:
    text = f"""# SakaLuX Market Intelligence v{NEW_VERSION}

Release date: **{RELEASE_DATE}**

## Fix
The Items-page estimate decorator is now isolated from the Bazaar add-item/sale editor. Rows that expose both quantity and price editing controls are treated as Bazaar sale-entry rows and do not receive `MI est. net` badges.

## Changes
- {RELEASE_NOTES[0]}
- {RELEASE_NOTES[1]}
- {RELEASE_NOTES[2]}

## Release surfaces synchronized
- `SakaLuX-Market-Intelligence.user.js`
- `scripts.json`
- Script Hub embedded/offline registry
- `greasyfork/Market-Intelligence.md`
- `greasyfork/Script-Hub.md`
- this release-info file
- previous-version backup under `{BACKUP_DIR.relative_to(ROOT).as_posix()}/`

## Validation
- `node --check SakaLuX-Market-Intelligence.user.js`
- `node --check SakaLuX-Script-Hub.user.js`
- `python3 -m json.tool scripts.json`
- version/release assertions for v{NEW_VERSION}

No purchase, sale, pricing or travel calculation logic is changed by this release; the update only prevents the Items estimate decoration from polluting Bazaar sale-entry rows.
"""
    write(RELEASE_MD, text)


def validate() -> None:
    market = read(MARKET_JS)
    registry = json.loads(read(REGISTRY))
    hub = read(HUB_JS)
    md = read(MARKET_MD)
    hub_md = read(HUB_MD)
    entry = next(x for x in registry["scripts"] if x["id"] == "market-intelligence")

    assert f"// @version      {NEW_VERSION}" in market
    assert "function isBazaarSaleEditorRow" in market
    assert "function isBazaarAddItemsView" in market
    assert "document.querySelectorAll('.sl-mi-items').forEach(n=>n.remove())" in market
    assert entry["version"] == NEW_VERSION
    assert entry["release"]["version"] == NEW_VERSION
    assert entry["release"]["date"] == RELEASE_DATE
    assert f'"version": "{NEW_VERSION}"' in hub[start_for_market(hub):]
    assert f"**v{NEW_VERSION}**" in md
    assert f"### v{NEW_VERSION} — Bazaar add-item overlay isolation" in md
    assert f"Market Intelligence **v{NEW_VERSION}**" in hub_md
    assert RELEASE_MD.exists()


def start_for_market(text: str) -> int:
    pos = text.find('"id": "market-intelligence"')
    if pos < 0:
        raise AssertionError("Hub market entry missing")
    return pos


def main() -> None:
    backup_current()
    patch_market_js()
    patch_registry()
    patch_hub_offline_registry()
    patch_market_markdown()
    patch_hub_markdown()
    write_release_info()
    validate()
    print(f"Market Intelligence updated to v{NEW_VERSION}")


if __name__ == "__main__":
    main()
