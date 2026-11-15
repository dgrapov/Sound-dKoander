// Physics layers for the Live Visualizer (MVP: 3D strange attractors).
// Each section's order value (0 chaos .. 1 order) becomes the attractor's real control
// parameter, so the shape you see is how the system actually behaves at that value.
// Kicks knock the trajectories off their path; they relax back (or scatter, in chaos).
(() => {
const lerp = (a, b, t) => a + (b - a)*t;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };

// ---------------- systems: derivative, control parameter map, integration step ----------------
const SYSTEMS = {
  lorenz: {                       // two-lobed butterfly; settles onto a still point when ordered
    label: 'Lorenz', sym: 'ρ', chaos: 28, order: 13, dt: 0.005, steps: 6, kickScale: 8, seed: [1, 1, 20], axes: [0, 2, 1],
    f: (s, p) => [10*(s[1] - s[0]), s[0]*(p - s[2]) - s[1], s[0]*s[1] - (8/3)*s[2]],
  },
  rossler: {                      // one spiral funnel; period-doubles as c rises
    label: 'Rössler', sym: 'c', chaos: 5.7, order: 2.5, dt: 0.02, steps: 6, kickScale: 4, kickAxes: [1, 1, 0], seed: [1, 1, 0], axes: [0, 1, 2],
    f: (s, c) => [-s[1] - s[2], s[0] + 0.2*s[1], 0.2 + s[2]*(s[0] - c)],
  },
  thomas: {                       // smooth cyclically symmetric eddy
    label: 'Thomas', sym: 'b', chaos: 0.18, order: 0.33, dt: 0.05, steps: 6, kickScale: 1, seed: [0.1, 0, 0], axes: [0, 1, 2],
    f: (s, b) => [Math.sin(s[1]) - b*s[0], Math.sin(s[2]) - b*s[1], Math.sin(s[0]) - b*s[2]],
  },
  aizawa: {                       // a sphere with a tube through it
    label: 'Aizawa', sym: 'e', chaos: 0.25, order: 0.02, dt: 0.01, steps: 6, kickScale: 0.4, seed: [0.1, 0, 0], axes: [0, 2, 1],
    f: (s, e) => {
      const [x, y, z] = s, a = .95, b = .7, c = .6, d = 3.5, f = .1;
      return [(z - b)*x - d*y, d*x + (z - b)*y, c + a*z - z*z*z/3 - (x*x + y*y)*(1 + e*z) + f*z*x*x*x];
    },
  },
};
function rk4(sys, s, p, h) {
  const k1 = sys.f(s, p);
  const k2 = sys.f([s[0] + h/2*k1[0], s[1] + h/2*k1[1], s[2] + h/2*k1[2]], p);
  const k3 = sys.f([s[0] + h/2*k2[0], s[1] + h/2*k2[1], s[2] + h/2*k2[2]], p);
  const k4 = sys.f([s[0] + h*k3[0], s[1] + h*k3[1], s[2] + h*k3[2]], p);
  return [s[0] + h/6*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0]), s[1] + h/6*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1]), s[2] + h/6*(k1[2] + 2*k2[2] + 2*k3[2] + k4[2])];
}

// ---------------- one attractor instance ----------------
function makeAttractor(cfg, totalPoints) {
  const sys = SYSTEMS[cfg.type] || SYSTEMS.lorenz;
  const n = Math.max(1, Math.min(8, cfg.trajectories || 4));
  const cap = Math.max(200, Math.floor(totalPoints / n));
  const tr = [];
  for (let i = 0; i < n; i++) tr.push({ s: sys.seed.map((v, k) => v + (k === 0 ? i*1e-3 : 0)), buf: new Float32Array(cap*3), head: 0, count: 0 });
  // warm up at the section's starting value and record it, so the first view fit sees the whole shape
  const p0 = cfg.param != null ? cfg.param : (cfg.range ? cfg.range[0] : sys.chaos);
  for (const t of tr) for (let i = 0; i < 1500 + cap; i++) {
    t.s = rk4(sys, t.s, p0, sys.dt);
    if (i >= 1500) { const o = t.head*3; t.buf[o] = t.s[0]; t.buf[o + 1] = t.s[1]; t.buf[o + 2] = t.s[2]; t.head = (t.head + 1) % cap; t.count = Math.min(cap, t.count + 1); }
  }
  return { cfg, sys, tr, cap, alpha: 0, target: 1, param: p0, rot: Math.random()*6.28,
           ctr: [0, 0, 0], ext: 1, fitT: 0, fitted: false };
}
function paramFor(A, S) {
  if (A.cfg.param != null) return A.cfg.param;                 // section override: a fixed value
  const r = A.cfg.range || [A.sys.chaos, A.sys.order];         // or [value at chaos, value at order]
  if (A.cfg.sweep === 'progress') return lerp(r[0], r[1], S.sectionT);   // or sweep across the section
  return lerp(r[0], r[1], smooth(0.2, 0.9, S.order));
}
function resetTraj(A, t, i) {
  t.s = A.sys.seed.map((v, k) => v + (k === 0 ? i*1e-3 : 0) + (Math.random() - .5)*1e-2);
  for (let j = 0; j < 800; j++) t.s = rk4(A.sys, t.s, A.param, A.sys.dt);   // re-enter on the attractor
  t.count = 0; t.head = 0;
}

function step(A, S) {
  A.param += (paramFor(A, S) - A.param)*Math.min(1, S.dt*3);   // glide, no jumps
  const sys = A.sys, h = sys.dt, speed = S.tune.attrSpeed ?? 1;
  const steps = Math.max(1, Math.round(sys.steps*speed*(0.6 + 0.8*S.bass)));
  A.tr.forEach((t, i) => {
    if (S.kick && S.tune.kickPhys > 0) {
      const ka = sys.kickAxes || [1, 1, 1];        // Rössler: kick in its plane only (a z kick escapes)
      const u = [0, 1, 2].map(k => (Math.random() - .5)*ka[k]), m = Math.hypot(...u) || 1;
      const k = sys.kickScale*0.3*S.tune.kickPhys;
      t.s = [t.s[0] + u[0]/m*k, t.s[1] + u[1]/m*k, t.s[2] + u[2]/m*k];
    }
    for (let j = 0; j < steps; j++) {
      t.s = rk4(sys, t.s, A.param, h);
      if (!t.s.every(v => isFinite(v) && Math.abs(v) < 60*sys.kickScale)) { resetTraj(A, t, i); break; }
      const o = t.head*3; t.buf[o] = t.s[0]; t.buf[o + 1] = t.s[1]; t.buf[o + 2] = t.s[2];
      t.head = (t.head + 1) % A.cap; if (t.count < A.cap) t.count++;
    }
  });
  // refit the view every ~0.5 s, easing so parameter changes never jump the frame
  A.fitT -= S.dt;
  if (A.fitT <= 0) {
    A.fitT = 0.5;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const t of A.tr) for (let j = 0; j < t.count; j += 7) { const i = (t.head - t.count + j + A.cap) % A.cap;   // live points only
      for (let k = 0; k < 3; k++) { const v = t.buf[i*3 + k]; if (v < lo[k]) lo[k] = v; if (v > hi[k]) hi[k] = v; } }
    if (isFinite(lo[0])) {
      const c = [0, 1, 2].map(k => (lo[k] + hi[k])/2), e = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2])/2 || 1;
      const g = A.fitted ? 0.35 : 1; A.fitted = true;
      A.ctr = A.ctr.map((v, k) => v + (c[k] - v)*g); A.ext += (Math.max(e, 0.05) - A.ext)*g;
    }
  }
  A.rot += S.dt*(0.08 + 0.35*S.highs*S.tune.react)*(S.tune.attrRot ?? 1);
  A.alpha += (A.target - A.alpha)*Math.min(1, S.dt*1.5);
}

function draw(A, ctx, S) {
  const a = A.alpha*S.tune.phys*(S.section.physicsOpacity ?? 1);
  if (a < 0.01) return;
  const [ax, ay, ad] = A.sys.axes, cosr = Math.cos(A.rot), sinr = Math.sin(A.rot);
  const k = (Math.min(S.W, S.H)*0.36)/A.ext, cx = S.W/2, cy = S.H/2, e4 = A.ext*4;
  const hues = [S.palette.flame, S.palette.flame + 22, S.palette.digital].map(h => h + S.hueShift);   // ember, gold, green: reads over the cyan particles
  ctx.lineWidth = (S.tune.attrLine ?? 1)*S.DPR;
  A.tr.forEach((t, ti) => {
    const n = t.count; if (n < 2) return;
    const start = (t.head - n + A.cap) % A.cap, CH = 40, chunks = Math.ceil(n/CH);
    const hue = hues[ti % hues.length];
    let px = null, py = null;
    for (let c = 0; c < chunks; c++) {
      const age = (c + 1)/chunks;                       // newest = brightest
      ctx.strokeStyle = `hsla(${hue|0},95%,${(58 + 18*S.highs)|0}%,${(a*(0.05 + 0.85*age*age)).toFixed(3)})`;
      ctx.beginPath();
      if (px !== null) ctx.moveTo(px, py);
      for (let j = c*CH; j < Math.min(n, (c + 1)*CH); j++) {
        const o = ((start + j) % A.cap)*3;
        const x = t.buf[o + ax] - A.ctr[ax], y = t.buf[o + ay] - A.ctr[ay], d = t.buf[o + ad] - A.ctr[ad];
        const X = x*cosr + d*sinr, D = -x*sinr + d*cosr, f = 1/(1 + D/e4);
        const sx = cx + X*k*f, sy = cy - y*k*f;
        if (px === null) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        px = sx; py = sy;
      }
      ctx.stroke();
    }
    // the trajectory's head: a small hot point
    const o = ((t.head - 1 + A.cap) % A.cap)*3;
    const x = t.buf[o + ax] - A.ctr[ax], y = t.buf[o + ay] - A.ctr[ay], d = t.buf[o + ad] - A.ctr[ad];
    const X = x*cosr + d*sinr, D = -x*sinr + d*cosr, f = 1/(1 + D/e4);
    ctx.fillStyle = `hsla(${hue|0},100%,80%,${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(cx + X*k*f, cy - y*k*f, 2.2*S.DPR*(1 + S.kickEnv), 0, 6.2832); ctx.fill();
  });
}

// ---------------- manager: section changes, crossfade, frame ----------------
let layers = [], lastSection = null, lastPoints = 0;
window.VizPhysics = {
  systems: Object.keys(SYSTEMS),
  debug: () => layers.map(l => ({ type: l.cfg.type, alpha: +l.alpha.toFixed(2), target: l.target, ext: +l.ext.toFixed(2), ctr: l.ctr.map(v => +v.toFixed(2)), param: +l.param.toFixed(3), heads: l.tr.map(t => t.s.map(v => +v.toFixed(2))) })),
  frame(ctx, S) {
    ctx.clearRect(0, 0, S.W, S.H);
    if (!S.tune.physOn) { layers = []; lastSection = null; return ''; }
    const cfg = S.section.attractor;
    if (S.section !== lastSection || (lastPoints && Math.round(S.tune.attrPoints) !== lastPoints)) {
      const cur = layers.find(l => l.target === 1);
      const pointsChanged = lastPoints && Math.round(S.tune.attrPoints) !== lastPoints;
      if (cfg && cur && cur.cfg.type === cfg.type && !pointsChanged) cur.cfg = cfg;          // same system: keep flowing
      else {
        layers.forEach(l => l.target = 0);
        if (cfg) layers.push(makeAttractor(cfg, Math.round(S.tune.attrPoints)));
      }
      lastSection = S.section; lastPoints = Math.round(S.tune.attrPoints);
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const A of layers) { step(A, S); draw(A, ctx, S); }
    ctx.restore();
    layers = layers.filter(l => l.target === 1 || l.alpha > 0.01);
    const live = layers.find(l => l.target === 1);
    return live ? `${live.sys.label} ${live.sys.sym}=${live.param.toFixed(live.param < 1 ? 3 : 2)}` : '';
  },
};
})();
