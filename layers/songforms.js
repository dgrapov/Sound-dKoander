// Song forms for the Live Visualizer (registered with VizForms): the WHOLE song's spectrogram as one 3D shape.
// Each point is one moment x one pitch band of the recording. The playhead walks the shape; what has been sung stays lit,
// what is still ahead is dim, and quiet points are subtracted as the song goes on. Built for Testing Your Buddha (2026-11-14).
//
// Pack, per section:  forms: [{ type:'songform', song:'testing-your-buddha', shape:'torus', sub:[.05,.1], swirl:'bops', sun:1 }]
//   WebGL: when layers/webgl.js is loaded and Tune → WebGL is on, the same settings render on the GPU with bloom (and shape 'road' works).
//   shape  road (walk the song's spectrogram; with whole:1 the camera rises to the open circle) | radar | torus | twist | mobius | helix | enso | knot (trefoil torus knot) | funnel (vortex drawing inward)   (changing shape between sections morphs, the instance is kept)
//   sub    [start, end] share of quiet points removed across the section (0..0.8)
//   swirl  off | bops (kicks spin it) | accel (keeps speeding up)
//   sun    0..1 sun in the centre;  whole 0..1 shows the future as bright as the past;  tilt (radians) camera elevation
// Data: window.VIZ_ROAD[song] from analysis/<song>/road.js (loaded on demand). Live bands come from S and window.VizAudio.
(() => {
if (!window.VizForms) return;
const TAU = Math.PI * 2;
const SH = { radar: 0, torus: 1, twist: 2, mobius: 3, helix: 4, enso: 5, knot: 6, funnel: 7, road: 5 };   // road needs layers/webgl.js; in 2D it draws as the enso
const CAM = { road: 1.25, radar: 1.0, torus: 0.45, twist: 0.55, mobius: 0.32, helix: 0.1, enso: 1.25, knot: 0.5, funnel: 0.62 };
const STOPS = [[0.03,0.02,0.06],[0.17,0.06,0.39],[0.48,0.10,0.63],[1.0,0.18,0.53],[1.0,0.69,0.13],[1.0,0.97,0.84]];
const NCOL = 14;
const COLS = Array.from({ length: NCOL }, (_, k) => {
  const x = 0.15 + 0.85 * k / (NCOL - 1), s = Math.min(4.999, x * 5), i = Math.floor(s), f = s - i;
  const c = STOPS[i].map((v, j) => Math.round(255 * (v + (STOPS[i + 1][j] - v) * f)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
});
const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const loading = {};
function data(song) {
  const R = window.VIZ_ROAD && window.VIZ_ROAD[song];
  if (R) return R;
  if (!loading[song]) { loading[song] = 1; const s = document.createElement('script'); s.src = `analysis/${song}/road.js`; s.onerror = () => console.warn('songform: missing analysis/' + song + '/road.js'); document.head.appendChild(s); }
  return null;
}
function build(R) {
  const spec = Uint8Array.from(atob(R.spec), c => c.charCodeAt(0));
  const N = R.ncol, NB = R.nb, DS = 4, NC = Math.floor(N / DS);
  const U = [], B = [], E = [], Rn = [];
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let c = 0; c < NC; c++) for (let b = 0; b < NB; b++) {
    let e = 0; for (let k = 0; k < DS; k++) e = Math.max(e, spec[(c * DS + k) * NB + b]);
    e /= 255; if (e < 0.06) continue;
    U.push(c / NC); B.push(b / (NB - 1)); E.push(e); Rn.push(rnd());
  }
  const n = U.length;
  const ci = new Uint8Array(n); for (let i = 0; i < n; i++) ci[i] = Math.min(NCOL - 1, Math.floor(E[i] * NCOL));
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => ci[a] - ci[b]);
  return { spec, N, NB, dur: R.dur, cps: R.cps, n, U: Float32Array.from(U), B: Float32Array.from(B), E: Float32Array.from(E), Rn: Float32Array.from(Rn), ci, order,
    X: new Float32Array(n), Y: new Float32Array(n), Z: new Float32Array(n) };
}
function pos(shape, u, b, e, r, spin, kick, low) {
  const th = u * TAU + spin, bulge = 1 + 0.04 * kick;
  switch (shape) {
    case 0: { const rad = (14 + b * 48) * bulge; return [Math.cos(th) * rad, e * e * 10 * (0.4 + low), Math.sin(th) * rad]; }
    case 1: case 2: { const R = 44, rr = (11 + low * 8) * bulge + e * 6, ph = b * TAU + (shape === 2 ? 3 * th : 0);
      return [(R + rr * Math.cos(ph)) * Math.cos(th), rr * Math.sin(ph), (R + rr * Math.cos(ph)) * Math.sin(th)]; }
    case 3: { const R = 44, s = (b - 0.5) * 2 * (18 + low * 8) * bulge, h = th * 0.5;
      return [(R + s * Math.cos(h)) * Math.cos(th), s * Math.sin(h) + e * 3, (R + s * Math.cos(h)) * Math.sin(th)]; }
    case 4: { const a = u * TAU * 5 + spin * 2 + (r > 0.5 ? Math.PI : 0), rad = (12 + b * 12 + e * 4) * bulge;
      return [Math.cos(a) * rad, (u - 0.5) * 120, Math.sin(a) * rad]; }
    case 6: { const ph = th, R = 34, r0 = 14 * bulge, tr = 3 + e * 5 + low * 4, k = R + r0 * Math.cos(3 * ph) + Math.cos(b * TAU) * tr;
      return [k * Math.cos(2 * ph), r0 * Math.sin(3 * ph) + Math.sin(b * TAU) * tr, k * Math.sin(2 * ph)]; }
    case 7: { const a = u * TAU * 2 + spin * 1.5 + b * 1.2, rad = (5 + Math.pow(b, 1.25) * 54) * bulge;
      return [Math.cos(a) * rad, -42 + b * 74 + e * 5, Math.sin(a) * rad]; }
    default: { const a = u * TAU * 0.93 - Math.PI * 0.5 + spin * 0.15, rad = 46 + (b - 0.5) * 16 * bulge + e * 3;
      return [Math.cos(a) * rad, e * 2, Math.sin(a) * rad]; }
  }
}

VizForms.register('songform', (cfg0) => {
  let cfg = cfg0, D = null;
  let from = SH[cfg.shape] ?? 1, to = from, mixT = 9, spin = 0, vel = 0, az = 0.7, el = CAM[cfg.shape] ?? 0.45, kick = 0, low = 0, mid = 0, high = 0;
  const waves = [], rips = [];
  return {
    reconfig(c) {
      const s = SH[c.shape] ?? 1;
      if (s !== to) { from = mixT < 0.9 ? from : to; to = s; mixT = 0; }
      cfg = c;
    },
    step(S) {
      if (!D) { const R = data(cfg.song || 'testing-your-buddha'); if (R) D = build(R); else return 'Song form: loading'; }
      const dt = S.dt || 1 / 60;
      mixT += dt / 1.8;
      kick = Math.max(S.kickEnv || 0, kick * Math.exp(-dt * 7));
      low += ((S.bass || 0) - low) * Math.min(1, dt * 14); mid += ((S.mids || 0) - mid) * Math.min(1, dt * 8); high += ((S.highs || 0) - high) * Math.min(1, dt * 12);
      const sw = cfg.swirl || 'bops';
      if (S.kick) { if (sw === 'bops') vel += 0.25; waves.push({ age: 0, p: 0.6 + 0.4 * (S.kickEnv || 1) }); rips.push({ age: 0, u: S.t / D.dur }); }
      if (sw === 'accel') vel = Math.min(1.6, vel + dt * (0.1 + mid * 0.4)); else vel *= Math.exp(-dt * (sw === 'off' ? 3 : 1.6));
      spin += (0.03 + vel * 0.6) * dt;
      az += dt * (0.035 + vel * 0.08);
      el += ((cfg.tilt ?? CAM[Object.keys(SH)[to]] ?? 0.45) - el) * Math.min(1, dt * 1.2);
      for (const w of waves) w.age += dt; for (const r of rips) r.age += dt;
      while (waves.length && waves[0].age > 1.3) waves.shift();
      while (rips.length && rips[0].age > 1.6) rips.shift();
      if (waves.length > 8) waves.shift(); if (rips.length > 4) rips.shift();
      return `Song form ${Object.keys(SH)[to]} · ${D.n} points`;
    },
    draw(ctx, S, a) {
      if (window.VizGL && window.VizGL.submit(S, cfg, a)) return;   // WebGL layer draws it (layers/webgl.js)
      if (!D) return;
      const W = S.W, H = S.H, cx = W / 2, cy = H * 0.47, sc = H / 175, FD = 260;
      const t = S.t, uV = t / D.dur, m = ease(Math.min(1, mixT)), t1 = S.sectionT ?? 0;
      const subA = cfg.sub ? cfg.sub[0] + (cfg.sub[1] - cfg.sub[0]) * t1 : 0.06;
      const whole = cfg.whole ?? 0;
      const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
      const proj = (x, y, z) => { const x1 = x * ca - z * sa, z1 = x * sa + z * ca, y2 = y * ce - z1 * se, z2 = y * se + z1 * ce, f = FD / (FD + z2); return [cx + x1 * f * sc, cy - y2 * f * sc, f]; };
      // sun
      const sun = cfg.sun ?? 0.8;
      if (sun > 0) {
        const r = (16 + 8 * kick) * sc * (0.6 + 0.6 * sun), g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
        g.addColorStop(0, 'rgba(255,176,32,1)'); g.addColorStop(0.32, 'rgba(255,176,32,0.95)'); g.addColorStop(0.38, 'rgba(255,46,136,0.45)'); g.addColorStop(1, 'rgba(255,46,136,0)');
        ctx.globalAlpha = a * sun; ctx.fillStyle = g; ctx.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
      }
      // points
      const { U, B, E, Rn, ci, order, X, Y } = D, n = D.n;
      const now = performance.now() / 1000, base = H / 1080;
      let lastC = -1;
      for (let q = 0; q < n; q++) {
        const i = order[q];
        if (E[i] < subA) continue;
        const u = U[i];
        let p0 = pos(from, u, B[i], E[i], Rn[i], spin, kick, low);
        if (m < 1) { const p1 = pos(to, u, B[i], E[i], Rn[i], spin, kick, low); p0 = [p0[0] + (p1[0] - p0[0]) * m, p0[1] + (p1[1] - p0[1]) * m, p0[2] + (p1[2] - p0[2]) * m]; }
        else p0 = pos(to, u, B[i], E[i], Rn[i], spin, kick, low);
        let [x, y, z] = p0;
        const len = Math.hypot(x, y, z) || 1, du = u - uV, near = Math.exp(-Math.abs(du) * 70);
        let push = near * kick * 3 * E[i];
        for (const r of rips) { let d = Math.abs(u - r.u); d = Math.min(d, 1 - d); push += Math.exp(-Math.pow((d - r.age * 0.2) / 0.018, 2)) * (1 - r.age / 1.6) * 3.5; }
        const jr = mid * 1.6 * E[i];
        x += x / len * push + Math.sin(Rn[i] * 91 + now * 2.1) * jr; y += y / len * push + Math.sin(Rn[i] * 57 + now * 1.7) * jr; z += z / len * push + Math.cos(Rn[i] * 33 + now * 2.4) * jr;
        const [sx, sy, f] = proj(x, y, z);
        const vis = du <= 0 ? 1 : 0.16 + 0.84 * whole;
        const sparkle = high > 0.25 && ((Rn[i] * 13 + now * 3) % 1) > 0.86 ? 1 : 0;
        const s = base * f * (1.1 + E[i] * 2.4 + near * 3 * (1 + kick) + sparkle * high * 3);
        if (near > 0.5) { ctx.globalAlpha = a * Math.min(1, 0.5 + kick); ctx.fillStyle = '#fff7d6'; lastC = -2; }
        else { if (ci[i] !== lastC) { ctx.fillStyle = COLS[ci[i]]; lastC = ci[i]; } ctx.globalAlpha = a * vis * 0.85; }
        ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
      // kick shockwaves in the ground plane
      ctx.lineWidth = Math.max(1, 2 * base);
      for (let k = 0; k < waves.length; k++) {
        const w = waves[k], prog = w.age / 1.3, R = 20 + prog * 95;
        ctx.globalAlpha = a * (1 - prog) * 0.8 * w.p; ctx.strokeStyle = k % 2 ? '#19e3ff' : '#ff2e88';
        ctx.beginPath();
        for (let j = 0; j <= 72; j++) { const th = j / 72 * TAU, [px, py] = proj(Math.cos(th) * R, 0, Math.sin(th) * R); j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke();
      }
      // live spectrum halo
      const F = window.VizAudio && window.VizAudio.playing && window.VizAudio.playing() ? window.VizAudio.freq : null;
      const col = Math.max(0, Math.min(D.N - 1, Math.round(t * D.cps)));
      const r0 = (24 + 6 * kick) * sc;
      for (const [rr, colr, al, dir] of [[r0, '#ff2e88', 0.8, 1], [r0 * 0.82, '#19e3ff', 0.5, -0.4]]) {
        ctx.globalAlpha = a * al; ctx.strokeStyle = colr; ctx.beginPath();
        for (let j = 0; j <= 160; j++) {
          const jj = j % 160, v = F ? F[Math.floor(2 + Math.pow(jj / 160, 1.6) * 300)] / 255 : D.spec[col * D.NB + Math.floor(jj / 160 * D.NB)] / 255;
          const th = jj / 160 * TAU + spin * 0.5, R = rr + dir * v * 16 * sc;
          const px = cx + Math.cos(th) * R, py = cy + Math.sin(th) * R; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  };
});
})();
