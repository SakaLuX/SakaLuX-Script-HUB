// Reuse the established CPU benchmark with the current audit's actual mobile layout.
const fs = require('node:fs');
let source = fs.readFileSync('tests/performance/browser.cjs', 'utf8');
source = source.replace('<html><head><style>', '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>');
source = source.replace('<ul class="status-icons"></ul>', '<ul class="status-icons"><li><a href="index.php">Status</a></li></ul>');
source = source.replace('<div class="chat-messages"></div>', '<div class="chat-messages"><div data-message-id="initial"><a href="profiles.php?XID=1000">Player</a> initial</div></div>');
source = source.replace("row.textContent='message '+i;", "row.dataset.messageId='cpu-'+i;row.innerHTML='<a href=\"profiles.php?XID=1000\">Player</a> message '+i;");
source = source.replace("'backups/performance-audit-2026-09-18'", "'backups/extended-performance-2026-09-18'");
source = source.replaceAll("fs.readFileSync(path.join(dir,x),'utf8')", "fs.readFileSync(fs.existsSync(path.join(dir,x))?path.join(dir,x):x,'utf8')");
source = source.replaceAll("fs.readFileSync(path.join(dir,file),'utf8')", "fs.readFileSync(fs.existsSync(path.join(dir,file))?path.join(dir,file):file,'utf8')");
source = source.replace("const result={file,variant,mode,", "const result={file,variant,mode,version:file.startsWith('__')?'combined':source.match(/@version\\s+(\\S+)/)[1],layoutWidth:await page.evaluate(()=>innerWidth),");
source = source.replace("const report={fixture:", "const report={assertions:results.filter(x=>x.variant==='after').flatMap(x=>[{label:x.file+' '+x.mode+' current mobile CPU sample no errors',passed:x.errors.length===0},{label:x.file+' '+x.mode+' actual 412px viewport',passed:x.layoutWidth===412}]),fixture:");
source = source.replace("fs.writeFileSync(process.argv[2]||'/tmp/browser-performance.json'", "fs.writeFileSync(process.argv[2]||'reports/extended-performance-2026-09-18/browser-current.json'");
source = source.replace("for(const row of results.filter", "assert(report.assertions.every(x=>x.passed),'Current CPU fixture failed');\n for(const row of results.filter");
new Function('require', source)(require);
