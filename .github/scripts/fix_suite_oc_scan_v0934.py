#!/usr/bin/env python3
from pathlib import Path
import re

root=Path(__file__).resolve().parents[2]
suite=root/'SakaLuX-Suite.user.js'
md=root/'greasyfork/SakaLuX-Suite.md'
s=suite.read_text(encoding='utf-8')
old=s

s=s.replace('// @version      0.9.933','// @version      0.9.934',1)
s=s.replace("const VERSION = '0.9.933';","const VERSION = '0.9.934';",1)

def replace_function(src,name,new_text):
    # match either async function name or function name and replace through balanced closing brace
    m=re.search(rf'(?m)^\s*(?:async\s+)?function\s+{re.escape(name)}\s*\([^)]*\)\s*\{{',src)
    if not m: raise SystemExit(f'function not found: {name}')
    brace=src.find('{',m.start())
    depth=0; quote=None; esc=False; i=brace
    while i<len(src):
        c=src[i]
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
        else:
            if c in "'\"`": quote=c
            elif c=='{': depth+=1
            elif c=='}':
                depth-=1
                if depth==0:
                    return src[:m.start()] + new_text + src[i+1:]
        i+=1
    raise SystemExit(f'unbalanced function: {name}')

new_scan=r'''  async function scanCurrentCrimesStage() {
    const stage = getCrimesStageLabel();
    refreshNotInOCFromPage();
    if (stage !== "Recruiting" && stage !== "Planning") {
      return { ok: false, stage, reason: "Open Recruiting or Planning first" };
    }

    // Torn often paints the stage tabs before the OC role cards are actually mounted.
    // Give the live DOM a short window to finish rendering instead of failing instantly.
    let roots = findSlotRoots();
    for (let attempt = 0; attempt < 8 && !roots.length; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 250));
      roots = findSlotRoots();
    }

    if (!roots.length) {
      return {
        ok: false,
        stage,
        reason: `${stage} loaded, but no OC role slots are visible yet`
      };
    }

    const usersInOC = new Set();
    const reqByUser = {};
    const roleByUser = {};
    const rootErrors = [];

    for (const root of roots) {
      try {
        let xid = directSlotXid(root);
        if (!xid) {
          try { xid = await openMenuAndGetXid(root); }
          catch (error) { rootErrors.push(`member: ${error?.message || error}`); }
        }
        if (!xid) continue;

        usersInOC.add(xid);
        if (!reqByUser[xid]) reqByUser[xid] = [];

        const roleName = (
          root.querySelector('[class*="title"], [class*="role"]')?.textContent || ""
        ).replace(/\s+/g, " ").trim();
        if (roleName) roleByUser[xid] = roleName;

        let itemId = directSlotItemId(root);
        if (!itemId) {
          try {
            const hoverHost =
              root.querySelector('button[class*="slotHeader"],[class*="slotHeader"]') ||
              root.querySelector('[aria-describedby]') ||
              root;
            const tip = await hoverAndGetTooltip(hoverHost);
            itemId = extractItemIdFromTooltip(tip);
          } catch (error) {
            // Required-item tooltip failure must not abort the entire stage scan.
            rootErrors.push(`item: ${error?.message || error}`);
          }
        }

        if (isAllowedItemId(itemId)) {
          const sid = String(itemId);
          if (!reqByUser[xid].includes(sid)) reqByUser[xid].push(sid);
        }
      } catch (error) {
        rootErrors.push(error?.message || String(error));
        log("OC slot scan skipped after error:", error);
      }
    }

    if (!usersInOC.size) {
      const suffix = rootErrors.length ? ` (${rootErrors[0]})` : "";
      return {
        ok: false,
        stage,
        reason: `Found ${roots.length} OC role slots but could not read members${suffix}`
      };
    }

    const scan = {
      stage,
      ts: now(),
      source: "dom",
      usersInOC: [...usersInOC],
      reqByUser,
      missingByUser: {},
      roleByUser
    };
    writeScan(scan);
    sessionScanState[stage] = true;
    log("Scan saved:", {
      stage,
      users: scan.usersInOC.length,
      roots: roots.length,
      skippedErrors: rootErrors.length
    });
    return { ok: true, stage, scan, skippedErrors: rootErrors.length };
  }'''

s=replace_function(s,'scanCurrentCrimesStage',new_scan)

# Generic catch should expose the actual runtime problem instead of the unhelpful 'Scan failed'.
old_catch='''      } catch (err) {\n        console.error("[SakaLuX OC Role Match + Readiness] Scan error:", err);\n        flashScanStatus(statusEl, "Scan failed", "error", 2200);\n      } finally {'''
new_catch='''      } catch (err) {\n        console.error("[SakaLuX OC Role Match + Readiness] Scan error:", err);\n        const detail = err?.message ? `Scan failed: ${err.message}` : "Scan failed: unexpected OC page error";\n        flashScanStatus(statusEl, detail, "error", 4200);\n      } finally {'''
if old_catch not in s:
    raise SystemExit('manual scan catch block not found')
s=s.replace(old_catch,new_catch,1)

if s==old: raise SystemExit('no Suite changes made')
suite.write_text(s,encoding='utf-8')

if md.exists():
    t=md.read_text(encoding='utf-8')
    t=t.replace('**v0.9.933**','**v0.9.934**',1)
    t=t.replace('**v0.9.933 — Target Alerts runtime viewport lock**','**v0.9.934 — OC Recruiting/Planning scan reliability**',1)
    entry=("### v0.9.934 — OC Recruiting/Planning scan reliability\n"
           "- Waits briefly for Torn to finish mounting OC role slots before a manual DOM scan.\n"
           "- Isolates member/menu and required-item tooltip failures per role, so one unreadable slot no longer aborts the whole scan.\n"
           "- Replaces the generic `Scan failed` message with the concrete runtime cause when an unexpected error remains.\n\n")
    if '### v0.9.934 — OC Recruiting/Planning scan reliability' not in t:
        pos=t.find('## Release history / Changelog')
        if pos<0: raise SystemExit('Suite release marker missing')
        ins=t.find('\n',pos)+1
        t=t[:ins]+'\n'+entry+t[ins:]
    md.write_text(t,encoding='utf-8')
print('Suite OC scan fixed -> v0.9.934')
