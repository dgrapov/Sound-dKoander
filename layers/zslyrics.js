(() => {
const ID = 'waited-zeta-stranger', PK = 'livevis:zs:lyrics', MODES = ['bottom', 'top', 'right', 'scene'];
let mode = (() => { try { return localStorage.getItem(PK) || 'bottom'; } catch (e) { return 'bottom'; } })();
const css = `
#zsLyr{position:fixed;z-index:4;pointer-events:none;font-family:Fraunces,Georgia,"Times New Roman",serif;font-weight:300;color:#f4efe6;
  text-shadow:0 1px 2px rgba(7,6,15,.95),0 0 18px rgba(7,6,15,.9),0 0 42px rgba(7,6,15,.75);transition:opacity .5s}
#zsLyr.bottom{left:var(--stcx,50%);bottom:168px;transform:translateX(-50%);width:min(calc(var(--stw,100vw)*.64),1100px);text-align:center;font-size:clamp(22px,2.6vw,44px)}
#zsLyr.top{left:var(--stcx,50%);top:22px;transform:translateX(-50%);width:min(calc(var(--stw,100vw)*.58),1000px);text-align:center;font-size:clamp(20px,2.3vw,40px)}
#zsLyr.right{right:calc(var(--strr,0px) + 28px);top:50%;transform:translateY(-50%);width:min(30vw,520px);text-align:right;font-size:clamp(20px,2.2vw,38px);line-height:1.25}
#zsLyr .w{display:inline-block;margin:0 .14em;opacity:.38;transform:translateY(4px);transition:opacity .35s ease,transform .6s ease,color .5s}
#zsLyr .w.on{opacity:1;transform:none;color:#fff7e6}
#zsLyr .w.now{color:#ffd58a}
#zsLyr .c{transition:opacity 1.2s ease,filter 1.2s ease}
#zsLyr .c.gone{opacity:0;filter:blur(6px)}
#zsLyr .echo{display:block;margin-top:.25em;font-style:italic;font-size:.62em;letter-spacing:.35em;color:#7feeff;opacity:0;transition:opacity .5s}
#zsLyr .echo.on{opacity:1}
#zsLyr .mu{font-size:2.4em;font-weight:400;color:#fff7d6;text-shadow:0 0 30px rgba(255,176,32,.7),0 0 4px rgba(7,6,15,.9)}
#zsLyrBtn.on{color:#19e3ff}
body.tyb-zen #zsLyr.bottom{bottom:56px}
body.tyb-zen #zsLyr.top{top:28px}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
let box, btn, cur = -1, words = [], chars = [], echoEl = null, endT = 0, lineSub = 0;
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function setMode(m) { mode = m; try { localStorage.setItem(PK, m); } catch (e) {} if (btn) btn.textContent = '♪ lyrics: ' + m; cur = -1; if (box) box.className = m; }
window.TYBLyrics = { mode: () => (active() ? mode : 'scene'), set: setMode };
let isOn = false; const active = () => isOn;
function ensure() {
  if (box) return;
  box = document.createElement('div'); box.id = 'zsLyr'; box.className = mode; document.body.appendChild(box);
  const ctl = document.getElementById('controls');
  if (ctl) { btn = document.createElement('button'); btn.id = 'zsLyrBtn'; btn.className = 'tybdock'; btn.title = 'Where the lyrics sit (L): bottom, top, right, or in the scene';
    btn.onclick = () => setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]); ctl.insertBefore(btn, document.getElementById('dockMin') || null); setMode(mode); }
}
addEventListener('keydown', (e) => {
  const C = window.LVC; if (!C || !C.pack() || C.pack().id !== ID) return;
  if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
  if (e.code === 'KeyL') { setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]); e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
function hideTool(h) { for (const id of ['lyric', 'lyricStage', 'typefx']) { const e = document.getElementById(id); if (e) e.style.visibility = h ? 'hidden' : ''; } }
function build(L, W, li) {
  box.innerHTML = ''; words = []; chars = []; echoEl = null;
  if (li < 0) return;
  const line = L[li], txt = String(line.text || '');
  
  const ws = W.filter((w) => w.line === li && w.start != null);
  const list = ws.length ? ws : txt.replace(/\([^)]*\)/g, '').trim().split(/\s+/).map((w, k, a) => ({ text: w, start: line.start + (line.end - line.start) * k / a.length, end: line.start + (line.end - line.start) * (k + 1) / a.length }));
  list.forEach((w, k) => {
    const sp = document.createElement('span'); sp.className = 'w';
    for (const ch of String(w.text)) { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; sp.appendChild(c); chars.push({ el: c, k: chars.length }); }
    box.appendChild(sp); words.push({ el: sp, s: w.start, e: w.end ?? w.start + 0.4 });
  });
  const echo = txt.match(/\(([^)]*)\)/); if (echo) { echoEl = document.createElement('span'); echoEl.className = 'echo'; echoEl.textContent = echo[1]; box.appendChild(echoEl); }
}
function frame(info) {
  const C = window.LVC; if (!C) return;
  const pack = C.pack(), on = pack && pack.id === ID && mode !== 'scene';
  if (pack && pack.id === ID) ensure();
  if (btn) btn.style.display = pack && pack.id === ID ? '' : 'none';
  if (!on) { if (isOn) { isOn = false; if (box) box.style.display = 'none'; hideTool(false); } return; }
  isOn = true; box.style.display = ''; hideTool(true);
  const timing = C.timing() || {}, L = timing.lines || [], W = timing.words || [], t = info.t;
  let li = -1, hold = 0;
  for (let j = L.length - 1; j >= 0; j--) { const a = L[j], nx = L[j + 1], e = (a.end ?? a.start) + 1.4, h = nx && nx.start - e > 6 ? nx.start - 0.4 : e; if (a.start != null && t >= a.start - 0.35 && t <= h) { li = j; endT = a.end ?? a.start; break; } }
  if (li !== cur) { cur = li; build(L, W, li); const f = ((info.sec || {}).forms || []).find((x) => x.type === 'songform'); lineSub = f && f.sub ? f.sub[1] : 0.1; }
  for (const w of words) { w.el.classList.toggle('on', t >= w.s - 0.05); w.el.classList.toggle('now', t >= w.s - 0.05 && t < w.e + 0.15); }
  if (echoEl) echoEl.classList.toggle('on', t >= endT - 0.6);
  const after = t - endT - 0.8, held = Math.max(0, t - endT - 2.5);
  const drop = after > 0 ? Math.min(0.97, Math.max(0, (lineSub - 0.04) * 0.9) + held / 24) : 0;
  for (const c of chars) c.el.classList.toggle('gone', drop > 0 && hash(c.k, cur) < drop);
}
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame(frame); }
wire();
})();
