(() => {
const ID = 'waited-zeta-stranger', SONG = ID;
const C_ = { copper: '#c8743a', blue: '#7fb4ff', amber: '#ffb020', ember: '#ff5a36', bone: '#f4efe6' };
let windows = null, src = null, lastKey = '', black = null, firedFlash = -1, firedVoid = -1;
const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z']/g, '');
function build(timing) {
  const W = [], L = (timing && timing.lines) || [], ev = (timing && timing.events) || {};
  const line = (re) => L.find((l) => re.test(String(l.text)));
  const allthings = line(/all things, he said/i), stranger = line(/stranger came in/i);
  const tDown = allthings ? allthings.start : 99.7, tLamp = stranger ? stranger.start + 1 : 88;
  W.push({ key: 'crystal', a: 0.5, b: ev.drums_in || 11.9, cfg: { type: 'crystal', seed: 9, rate: 0.16, color: C_.copper, opacity: 0.55 } });
  W.push({ key: 'life', a: 40.2, b: 66.8, cfg: { type: 'life', color: C_.copper, cols: 56, density: 0.2, opacity: 0.45 } });
  W.push({ key: 'ridge', a: 67.8, b: 86.0, cfg: { type: 'ridgeline', lines: 30, color: C_.blue, far: C_.copper, opacity: 0.55 } });
  W.push({ key: 'metatron', a: tLamp, b: tDown, cfg: { type: 'metatron', merkaba: true, dur: 10, color: C_.amber, opacity: 0.8 } });
  L.forEach((l) => { if (/\((how many|closer|through a wormhole|out the white hole)\)/i.test(l.text) && l.end) W.push({ key: 'echo' + Math.round(l.end), a: l.end - 0.5, b: l.end + 2.2, cfg: { type: 'faraday', waves: [4, 6], dur: 2.5, opacity: 0.75 } }); });
  const back = ev.drums_return || 132.5;
  W.push({ key: 'plate', a: back, b: 142.4, cfg: { type: 'plate', grains: 4500, dot: 3.4, color: C_.amber, opacity: 0.6 } });
  W.push({ key: 'strings', a: 157.5, b: 186.5, cfg: { type: 'strings', count: 6, color: C_.blue, opacity: 0.6 } });
  const last = line(/now it can stay/i), tLast = last ? last.start : 216.3;
  W.push({ key: 'mandala', a: tLast, b: 222.0, cfg: { type: 'mandala', fold: 12, color: C_.amber, accent: C_.copper, opacity: 0.6 } });
  return { W, tDown, slam: back, mu: ev.hollow_start || 127.4, stop: ev.silence || 246.8 };
}
function frame(info) {
  const C = window.LVC; if (!C) return;
  const pack = C.pack(), on = pack && pack.id === ID;
  if (!on) { if (lastKey) { lastKey = ''; window.VizForms && VizForms.setManual([]); } if (black) black.style.opacity = 0; return; }
  const timing = C.timing(), t = info.t;
  if (src !== timing || !windows) { src = timing; windows = build(timing); }
  const act = windows.W.filter((w) => t >= w.a && t < w.b).slice(-1);          // rule of one
  const key = act.map((w) => w.key).join(',');
  if (key !== lastKey && window.VizForms) { lastKey = key; VizForms.setManual(act.map((w) => ({ key: w.key, cfg: w.cfg, t0: w.a }))); }
  if (window.VizGL && VizGL.event) {
    if (t >= windows.slam && t < windows.slam + 0.5 && firedFlash !== windows.slam) { firedFlash = windows.slam; VizGL.event('flash', 1.2); }
    if (t < windows.slam - 1) firedFlash = -1;
    if (t >= windows.mu && t < windows.mu + 0.5 && firedVoid !== windows.mu) { firedVoid = windows.mu; VizGL.event('void', 0.7); }
    if (t < windows.mu - 1) firedVoid = -1;
    VizGL.event('sunonly', t >= windows.stop ? 1 : 0, true);
  }
  if (!black) { black = document.createElement('div'); black.style.cssText = 'position:fixed;inset:0;background:#000;pointer-events:none;opacity:0;transition:opacity .08s'; const gl = document.getElementById('gl') || document.getElementById('forms'); (gl ? gl.parentNode : document.body).insertBefore(black, gl || null); }
  else if (black.nextSibling && black.nextSibling.id !== 'gl' && document.getElementById('gl')) { const gl = document.getElementById('gl'); gl.parentNode.insertBefore(black, gl); }
  black.style.opacity = t >= windows.stop ? 1 : 0;
}
window.ZSCues = { active: () => lastKey, moments: () => windows && { slam: windows.slam, mu: windows.mu, stop: windows.stop } };
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame(frame); }
wire();
})();
