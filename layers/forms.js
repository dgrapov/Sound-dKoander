// Form layers for the Live Visualizer: cymatics (cymatics.js) and sacred geometry (geometry.js).
// This file is the shared manager: a registry of form types, per-section layer lists with 1 s
// crossfades, and continuity (the same form type in the next section keeps its state and grows on).
//
// Pack schema, per section (all optional; at most ~2 forms per section reads best):
//   forms: [ { type:'faraday', waves:[4,12] }, { type:'crystal' } ]
// Each type documents its own options in cymatics.js / geometry.js.
(() => {
const TYPES = {};
const lerp = (a, b, t) => a + (b - a)*t;
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const smooth = (a, b, x) => { const t = clamp01((x - a)/(b - a)); return t*t*(3 - 2*t); };
// tiny seeded RNG so a form grows the same way every time a section plays
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const NOTE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const noteName = m => m == null ? '' : NOTE[((Math.round(m) % 12) + 12) % 12] + (Math.floor(Math.round(m)/12) - 1);

let live = [], lastSection = null, lastOn = true, auto = true, manual = [], dirty = false;
function sectionForms(sec) { return (sec.forms || []).filter(f => TYPES[f.type]); }

window.VizForms = {
  util: { lerp, clamp01, smooth, rng, noteName },
  register(type, factory) { TYPES[type] = factory; },
  make: (type, cfg, S) => TYPES[type] ? TYPES[type](Object.assign({ type }, cfg), S) : null,   // an instance of another form (used by teaser.js)
  types: () => Object.keys(TYPES),
  // On demand: manual = [{ key, cfg }] layered on top of (or instead of) the section's own forms.
  // A manual layer grows on its own clock (cfg.dur seconds, default 12) from t0 (a cue's time) or the moment it is switched on.
  setAuto(on) { if (auto !== !!on) { auto = !!on; dirty = true; } },
  setManual(list) { manual = list.filter(m => TYPES[m.cfg.type]); dirty = true; },
  debug: () => live.map(l => ({ key: l.key, alpha: +l.alpha.toFixed(2), target: l.target })),
  // S: { t, dt, order, bass, mids, highs, kick, kickEnv, section, sectionT, palette, hueShift, tune, W, H, DPR, pitch, bpm }
  frame(ctx, S) {
    ctx.clearRect(0, 0, S.W, S.H);
    const on = (S.tune.formsOn ?? 1) > 0;
    if (!on) { if (lastOn) { live = []; lastSection = null; } lastOn = false; return ''; }
    lastOn = true;
    if (S.section !== lastSection || dirty) {
      const want = (auto ? sectionForms(S.section).map(cfg => ({ key: 'auto:' + cfg.type, cfg, manual: false })) : [])
        .concat(manual.map(m => ({ key: 'man:' + m.key, cfg: m.cfg, manual: true, t0: m.t0 })));
      const keep = new Set();
      for (const w of want) {
        const cur = live.find(l => l.target === 1 && l.key === w.key && !keep.has(l));
        if (cur) { if (!w.manual) { cur.cfg = w.cfg; cur.inst.reconfig?.(w.cfg, S); } keep.add(cur); }   // same form: keep growing
        else { const l = { key: w.key, cfg: w.cfg, manual: w.manual, t0: w.t0 ?? S.t, inst: TYPES[w.cfg.type](w.cfg, S), alpha: 0, target: 1 }; live.push(l); keep.add(l); }
      }
      live.forEach(l => { if (!keep.has(l)) l.target = 0; });
      lastSection = S.section; dirty = false;
    }
    const strength = (S.tune.forms ?? 0.8)*(S.section.formsOpacity ?? 1);
    let info = '';
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const l of live) {
      l.alpha += (l.target - l.alpha)*Math.min(1, S.dt*1.6);
      const a = l.alpha*strength*(l.cfg.opacity ?? 1);
      const SS = l.manual ? Object.assign({}, S, { sectionT: clamp01((S.t - l.t0)/(l.cfg.dur || 12)) }) : S;
      const r = l.inst.step(SS, l.target === 1);
      if (a > 0.01) { ctx.save(); l.inst.draw(ctx, SS, a); ctx.restore(); }
      if (l.target === 1 && r) info = info ? info + ' · ' + r : r;
    }
    ctx.restore();
    live = live.filter(l => l.target === 1 || l.alpha > 0.01);
    return info;
  },
};
})();
