from pathlib import Path
p=Path('hubtest.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.9.65-test.1','// @version      1.9.65-test.2',1)
s=s.replace("const VERSION = '1.9.65-test.1';","const VERSION = '1.9.65-test.2';",1)
needle="""    window.SakaLuXScriptHub = {
        id: 'script-hub', name: 'SakaLuX Script Hub', version: VERSION, ready: true,
"""
if needle not in s:
    raise SystemExit('global hub api anchor missing')
s=s.replace(needle,"""    document.addEventListener('sakalux-hub-test-open-request', () => {
        try { openHub(); } catch (error) { console.error('[SakaLuX Hub TEST] direct open failed', error); }
    });

    window.SakaLuXScriptHub = {
        id: 'script-hub', name: 'SakaLuX Script Hub TEST', version: VERSION, ready: true,
""",1)
old="""  function openRealHub(){
    const candidates=['sakalux-hub-button','sakalux-hub-top-skull','sakalux-hub-nav-skull'];
    for(const id of candidates){
      const el=document.getElementById(id);
      if(el){ try{el.click(); return;}catch{} }
    }
    try {
      const fn = window.SakaLuXScriptHub?.open || window.SakaLuXHub?.open || window.SakaLuXScriptHub?.openHub;
      if(typeof fn==='function'){ fn(); return; }
    } catch{}
    // Last resort: dispatch a test-only event; production code remains untouched.
    document.dispatchEvent(new CustomEvent('sakalux-hub-test-open-request'));
  }
"""
new="""  function openRealHub(){
    // TEST v2: direct same-script bridge. No dependency on Torn launchers or page globals.
    document.dispatchEvent(new CustomEvent('sakalux-hub-test-open-request', {detail:{source:'forced-test-launcher'}}));
  }
"""
if old not in s:
    raise SystemExit('test launcher openRealHub block missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('hubtest event bridge patched')
