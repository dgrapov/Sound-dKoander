// Testing Your Buddha: timed cues from the watching script (songs/testing-your-buddha-watching-script.md, 2026-11-15).
// Rule of one: at most one extra layer at a time on top of the song form, and gaps only ever subtract.
// Extra layers are driven through VizForms.setManual from time windows, so seeking and scrubbing always show the right state.
// Moments (from the take's timing file and analysis): the golden metatron is put down on "down"; each build echo
// (ears / thought / empty / caught) rings one Faraday crystal; "mu" voids the scene for a beat; the slam at 139.9 flashes and
// the Chladni plate answers; the lift at ~160 grows a 12-fold mandala; the hard stop at 189.9 cuts to black, then only the sun.
// Loaded by packs/testing-your-buddha.js; active only while that pack plays. While it plays it owns the manual effect layers.
(() => {
const ID = 'testing-your-buddha', SONG = ID;
const C_ = { violet: '#8a5cff', magenta: '#ff2e88', cyan: '#19e3ff', amber: '#ffb020', bone: '#f4efe6' };
let windows = null, src = null, lastKey = '', black = null, firedFlash = -1, firedVoid = -1;
const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z']/g, '');
function build(timing) {
  const W = [], L = (timing && timing.lines) || [], words = (timing && timing.words) || [];
  const line = (re) => L.find((l) => re.test(String(l.text)));
  const pic = line(/only a picture/i), down = pic && words.find((w) => w.line === L.indexOf(pic) && /^down/i.test(clean(w.text)));
  const tDown = down ? down.start : 87.5;
  W.push({ key: 'crystal', a: 0.5, b: 21.6, cfg: { type: 'crystal', seed: 9, rate: 0.16, color: C_.violet, opacity: 0.55 } });
  W.push({ key: 'life', a: 21.8, b: 41.0, cfg: { type: 'life', color: C_.magenta, cols: 56, density: 0.2, opacity: 0.45 } });
  W.push({ key: 'ridge', a: 41.2, b: 70.8, cfg: { type: 'ridgeline', lines: 30, color: C_.cyan, far: C_.violet, opacity: 0.55 } });
  W.push({ key: 'metatron', a: 72.0, b: tDown, cfg: { type: 'metatron', merkaba: true, dur: 12, color: C_.amber, opacity: 0.8 } });
  // build echoes: one ring each, then gone
  L.forEach((l) => { if (/\((ears|thought|empty|caught)\)/i.test(l.text) && l.end) W.push({ key: 'echo' + Math.round(l.end), a: l.end - 0.5, b: l.end + 2.2, cfg: { type: 'faraday', waves: [4, 6], dur: 2.5, opacity: 0.75 } }); });
  const ev = (timing && timing.events) || {}, slam = ev.drums_slam_back || 139.9;
  W.push({ key: 'plate', a: slam, b: 150.0, cfg: { type: 'plate', grains: 4500, dot: 3.4, color: C_.amber, opacity: 0.6 } });
  W.push({ key: 'mandala', a: 159.0, b: 171.0, cfg: { type: 'mandala', fold: 12, color: C_.amber, accent: C_.magenta, opacity: 0.6 } });
  const muLine = line(/who's the one who's testing/i);
  return { W, tDown, slam, mu: muLine ? (muLine.end || muLine.start + 3) - 0.3 : 129.5, stop: ev.hard_stop || 189.9 };
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
  // one-shot moments, re-armed when seeking back
  if (window.VizGL && VizGL.event) {
    if (t >= windows.slam && t < windows.slam + 0.5 && firedFlash !== windows.slam) { firedFlash = windows.slam; VizGL.event('flash', 1.2); }
    if (t < windows.slam - 1) firedFlash = -1;
    if (t >= windows.mu && t < windows.mu + 0.5 && firedVoid !== windows.mu) { firedVoid = windows.mu; VizGL.event('void', 0.7); }
    if (t < windows.mu - 1) firedVoid = -1;
    VizGL.event('sunonly', t >= windows.stop ? 1 : 0, true);
  }
  // the hard stop: black over everything under the GL layer for a beat, then only the sun
  if (!black) { black = document.createElement('div'); black.style.cssText = 'position:fixed;inset:0;background:#000;pointer-events:none;opacity:0;transition:opacity .08s'; const gl = document.getElementById('gl') || document.getElementById('forms'); (gl ? gl.parentNode : document.body).insertBefore(black, gl || null); }
  else if (black.nextSibling && black.nextSibling.id !== 'gl' && document.getElementById('gl')) { const gl = document.getElementById('gl'); gl.parentNode.insertBefore(black, gl); }
  black.style.opacity = t >= windows.stop ? 1 : 0;
}
window.TYBCues = { active: () => lastKey, moments: () => windows && { slam: windows.slam, mu: windows.mu, stop: windows.stop } };
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame(frame); }
wire();
})();
