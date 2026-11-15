// GOD 2.0 effects for the Live Visualizer (form layers, registered with VizForms).
// Plan: songs/GOD 2.0/GOD2-visual-themes.md. Big, snappy particles; beat-locked until the Final Chorus, then free.
//
//   stabs     big white-hot particle bursts with a red tail, one per beat-onset (max 3 per section), each leaving a ring
//             { type:'stabs', max:3, words:['Global','Optimization','Daemon'] }  (words: fire on those sung words if timing has them)
//   life      Conway's Game of Life on a coarse grid of big round particles, one generation per beat
//             { type:'life', cols:64, perBeat:1, density:.22, color:'#B6FF3B', burstWords:['Greed','Of','Data'], square:false }
//             mode:'rule' = a marching 1-D automaton (Rule 30/110…) scrolling down, mirrored like a mask
//             { type:'life', mode:'rule', rule:30, rowsPerBeat:2, mirror:true, color:'#FF2E9A', burstWords:['Ghost','Design'] }
//   pfractal  fractals drawn by particles (chaos game / IFS); they fly to their attractor points and scatter on kicks
//             { type:'pfractal', kind:'sierpinski'|'fern'|'dragon', n:2400, color:'#19E6FF', zoom:true, grow:false }
//   helix     the finale body, one instance that morphs by stage (keep the same type across sections so it carries on):
//             stage 'thin' (faint, beat-snapped) · 'helix' (gold DNA; strands counter-wound and the body tumbles toward
//             the viewer through a circle: counter, tumble, tumbleSpeed, windSpeed, swell) · 'mobius' · 'torus' (bends in over the section,
//             energy streams through the hole, supernova at nova:0.86 or on the word "Now.") · 'ash' (drifts to one point)
//             { type:'helix', stage:'torus', free:true, nova:.86, color:'#FFC23A' }
(() => {
if (!window.VizForms) return;
const { clamp01, smooth, rng } = VizForms.util;
const TAU = Math.PI*2;
const hex = h => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];

// ---- sprite cache: a soft round glow with a hard core, tinted, quantised colours ----
const SPR = new Map();
function sprite(rgb, square) {
  const q = rgb.map(v => Math.max(0, Math.min(255, Math.round(v/16)*16)));
  const k = q.join(',') + (square ? 's' : '');
  let c = SPR.get(k); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  if (square) {
    g.fillStyle = `rgba(${k.replace('s', '')},0.25)`; g.fillRect(4, 4, 56, 56);
    g.fillStyle = `rgb(${k.replace('s', '')})`; g.fillRect(14, 14, 36, 36);
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(24, 24, 16, 16);
  } else {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, `rgba(${k},1)`);
    gr.addColorStop(0.45, `rgba(${k},0.35)`); gr.addColorStop(1, `rgba(${k},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }
  if (SPR.size > 400) SPR.clear();
  SPR.set(k, c); return c;
}
const dot = (ctx, rgb, x, y, r, square) => ctx.drawImage(sprite(rgb, square), x - r, y - r, r*2, r*2);

// ---- beat helpers (timing beats if loaded, else the pack bpm grid) ----
function beatIndex(S, t) {
  const b = S.timing && S.timing.beats;
  if (b && b.length > 4) {                    // binary search: number of beats at or before t
    let lo = 0, hi = b.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (b[m] <= t) lo = m + 1; else hi = m; }
    if (lo > 0 && lo < b.length) return lo - 1 + (t - b[lo - 1])/(b[lo] - b[lo - 1]);
    return lo - 1 + (lo >= b.length ? (t - b[b.length - 1])*(S.bpm || 104)/60 : 0);
  }
  return t*(S.bpm || 104)/60;
}
// words whose sung start falls in (t0, t1]
function wordsBetween(S, t0, t1) {
  const w = S.timing && S.timing.words; if (!w || !(t1 > t0) || t1 - t0 > 1) return [];
  const out = []; for (const x of w) if (x.start != null && x.start > t0 && x.start <= t1) out.push(String(x.text).replace(/[^A-Za-z]/g, ''));
  return out;
}
const sectionEnd = S => {
  const tm = S.timing, i = tm && tm.sections ? tm.sections.findIndex(s => s.name === S.section.name) : -1;
  return i >= 0 && i + 1 < tm.sections.length ? tm.sections[i + 1].start : null;
};

// =====================================================================================================  stabs
function stabs(cfg0, S0) {
  let cfg = cfg0, fired = 0, lastT = S0.t, sec = S0.section;
  const B = [], R = rng(77);
  const fire = S => {
    if (fired >= (cfg.max ?? 3)) return; fired++;
    const cx = S.W*(0.5 + (fired - 2)*0.22), cy = S.H*0.42, n = cfg.n ?? 140, P = [];
    for (let i = 0; i < n; i++) { const a = R()*TAU, v = (0.25 + R()*0.9)*S.H*0.55; P.push({ a, v, s: 0.6 + R()*1.4 }); }
    B.push({ x: cx, y: cy, t0: S.t, P });
  };
  return {
    reconfig(c) { cfg = c; },
    step(S, active) {
      if (S.section !== sec) { sec = S.section; fired = 0; }
      if (S.t < lastT - 0.3 || S.t > lastT + 2) { B.length = 0; fired = 0; }
      if (active) {
        const ws = wordsBetween(S, lastT, S.t), want = (cfg.words || []).map(x => x.toLowerCase());
        const hasWords = S.timing && S.timing.words && want.length;
        if (hasWords) { for (const w of ws) if (want.includes(w.toLowerCase())) fire(S); }
        else if (S.kick) fire(S);
      }
      lastT = S.t;
      for (let i = B.length - 1; i >= 0; i--) if (S.t - B[i].t0 > 1.6 || S.t < B[i].t0) B.splice(i, 1);
      return B.length ? `Stabs ${fired}/${cfg.max ?? 3}` : '';
    },
    draw(ctx, S, a) {
      const W = [255, 255, 255], RED = hex(cfg.tail || '#C4122F'), sz = S.H/1080;
      for (const b of B) {
        const u = (S.t - b.t0)/1.6, e = 1 - Math.pow(1 - Math.min(1, u*2.2), 3);
        if (u < 0.06) { ctx.globalAlpha = a*(1 - u/0.06)*0.55; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S.W, S.H); }   // one-frame strobe
        ctx.globalAlpha = a*(1 - u);
        ctx.strokeStyle = `rgb(${mix(W, RED, Math.min(1, u*2)).map(Math.round)})`; ctx.lineWidth = Math.max(2, 10*sz*(1 - u));
        ctx.beginPath(); ctx.arc(b.x, b.y, S.H*0.08 + e*S.H*0.38, 0, TAU); ctx.stroke();
        const col = mix(W, RED, Math.min(1, u*1.6));
        for (const p of b.P) {
          const d = p.v*e, x = b.x + Math.cos(p.a)*d, y = b.y + Math.sin(p.a)*d;
          ctx.globalAlpha = a*Math.max(0, 1 - u*1.1); dot(ctx, col, x, y, (14 + 22*(1 - u))*p.s*sz);
        }
        ctx.globalAlpha = a*Math.max(0, 1 - u*3); dot(ctx, W, b.x, b.y, S.H*0.12*(1 - u));
      }
    },
  };
}

// =====================================================================================================  life
const GLIDERS = [[[1,0],[2,1],[0,2],[1,2],[2,2]], [[1,0],[0,1],[0,2],[1,2],[2,2]], [[0,0],[1,0],[2,0],[2,1],[1,2]], [[0,0],[1,0],[2,0],[0,1],[1,2]]];
function life(cfg0, S0) {
  let cfg = cfg0, cols = 0, rows = 0, A = null, N = null, age = null, lastB = null, lastT = S0.t, R = rng(cfg0.seed || 1234);
  let flash = 0, rowsBuf = [];
  const setup = S => {
    cols = cfg.cols || 64; rows = Math.max(8, Math.round(cols*S.H/S.W));
    A = new Uint8Array(cols*rows); N = new Uint8Array(cols*rows); age = new Float32Array(cols*rows);
    if ((cfg.mode || 'life') === 'life') seed(cfg.density ?? 0.22, 0.7);
    rowsBuf = [];
  };
  const idx = (x, y) => ((y + rows) % rows)*cols + ((x + cols) % cols);
  function seed(d, span) {
    const x0 = Math.floor(cols*(1 - span)/2), x1 = cols - x0, y0 = Math.floor(rows*(1 - span)/2), y1 = rows - y0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (R() < d) { A[idx(x, y)] = 1; age[idx(x, y)] = 0; }
  }
  function glider(x, y, k) { for (const [dx, dy] of GLIDERS[k & 3]) { const i = idx(x + dx, y + dy); A[i] = 1; age[i] = 0; } }
  function burst() {                                     // a glider gun burst from a random point: 6 gliders flying out
    const x = Math.floor(cols*(0.2 + 0.6*R())), y = Math.floor(rows*(0.2 + 0.6*R()));
    for (let k = 0; k < 6; k++) glider(x + Math.round(Math.cos(k*1.05)*4), y + Math.round(Math.sin(k*1.05)*3), k);
    flash = 1;
  }
  function gen() {
    let pop = 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += A[idx(x + dx, y + dy)];
      const i = y*cols + x, v = A[i] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
      N[i] = v; if (v && !A[i]) age[i] = 0; pop += v;
    }
    [A, N] = [N, A];
    if (pop < cols*rows*0.025) seed(0.3, 0.35);           // keep it alive: reseed the centre when it dies out
  }
  function ruleRow() {
    const rule = cfg.rule ?? 30, prev = rowsBuf[0] || (() => { const r = new Uint8Array(cols); r[cols >> 1] = 1; return r; })();
    const r = new Uint8Array(cols);
    for (let x = 0; x < cols; x++) { const l = prev[(x - 1 + cols) % cols], c = prev[x], rr = prev[(x + 1) % cols]; r[x] = (rule >> (l*4 + c*2 + rr)) & 1; }
    if (cfg.mirror) for (let x = 0; x < cols >> 1; x++) r[cols - 1 - x] = r[x];
    rowsBuf.unshift(r); if (rowsBuf.length > rows) rowsBuf.length = rows;
  }
  return {
    reconfig(c, S) { const m = (cfg.mode || 'life') !== (c.mode || 'life') || cfg.cols !== c.cols; cfg = c; if (m) setup(S); },
    step(S, active) {
      if (!A) setup(S);
      const per = (cfg.mode === 'rule' ? (cfg.rowsPerBeat ?? 2) : (cfg.perBeat ?? 1));
      const bi = Math.floor(beatIndex(S, S.t)*per);
      if (S.t < lastT - 0.3 || S.t > lastT + 2) lastB = bi;   // seek: no catch-up storm
      if (lastB == null) lastB = bi;
      if (active && bi > lastB) {
        const steps = Math.min(4, bi - lastB);
        for (let k = 0; k < steps; k++) cfg.mode === 'rule' ? ruleRow() : gen();
      }
      lastB = bi;
      if (active) {
        if (cfg.mode !== 'rule' && S.kick && R() < (cfg.kickGliders ?? 0.6)) glider(Math.floor(R()*cols), Math.floor(R()*rows), Math.floor(R()*4));
        if (cfg.mode === 'rule' && S.kick && rowsBuf[0]) { const x = Math.floor(R()*cols); rowsBuf[0][x] ^= 1; if (cfg.mirror) rowsBuf[0][cols - 1 - x] = rowsBuf[0][x]; }
        const want = (cfg.burstWords || []).map(x => x.toLowerCase());
        for (const w of wordsBetween(S, lastT, S.t)) if (want.includes(w.toLowerCase())) { cfg.mode === 'rule' ? (flash = 1) : burst(); }
      }
      lastT = S.t;
      for (let i = 0; i < age.length; i++) age[i] += S.dt;
      flash *= Math.exp(-S.dt*5);
      if (cfg.mode === 'rule') return `Rule ${cfg.rule ?? 30} · ${rowsBuf.length} rows`;
      let pop = 0; for (let i = 0; i < A.length; i++) pop += A[i];
      return `Life ${pop} cells`;
    },
    draw(ctx, S, a) {
      if (!A) return;
      const cw = S.W/cols, ch = S.H/rows, base = hex(cfg.color || '#B6FF3B'), hot = mix(base, [255, 255, 255], 0.7);
      const kp = 1 + 0.45*(S.kickEnv || 0) + 0.3*flash, sq = !!cfg.square;
      if (cfg.mode === 'rule') {
        const tail = hex(cfg.tail || '#6A3BFF');
        for (let r = 0; r < rowsBuf.length; r++) {
          const row = rowsBuf[r], f = r/rows, col = mix(base, tail, f), y = (r + 0.5)*ch;
          ctx.globalAlpha = a*(1 - f*0.75)*(r === 0 ? 1 : 0.85);
          for (let x = 0; x < cols; x++) if (row[x]) dot(ctx, r < 2 ? hot : col, (x + 0.5)*cw, y, Math.min(cw, ch)*0.62*(r < 3 ? kp : 1), sq);
        }
        return;
      }
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = y*cols + x; if (!A[i]) continue;
        const young = Math.max(0, 1 - age[i]*2.5);
        ctx.globalAlpha = a*(0.75 + 0.25*young);
        dot(ctx, young > 0.2 ? mix(base, hot, young) : base, (x + 0.5)*cw, (y + 0.5)*ch, Math.min(cw, ch)*0.6*kp*(1 + 0.35*young), sq);
      }
    },
  };
}

// =====================================================================================================  pfractal
const IFS = {
  sierpinski: [[.5,0,0,.5,0,0,1/3],[.5,0,0,.5,.5,0,1/3],[.5,0,0,.5,.25,.433,1/3]],
  fern: [[0,0,0,.16,0,0,.01],[.85,.04,-.04,.85,0,1.6,.85],[.2,-.26,.23,.22,0,1.6,.07],[-.15,.28,.26,.24,0,.44,.07]],
  dragon: [[.5,-.5,.5,.5,0,0,.5],[-.5,-.5,.5,-.5,1,0,.5]],
};
function chaosPoints(kind, n, R) {
  const maps = IFS[kind] || IFS.sierpinski, pts = []; let x = 0, y = 0;
  for (let i = 0; i < n + 30; i++) {
    let r = R(), m = maps[maps.length - 1];
    for (const mm of maps) { if (r < mm[6]) { m = mm; break; } r -= mm[6]; }
    const nx = m[0]*x + m[1]*y + m[4], ny = m[2]*x + m[3]*y + m[5]; x = nx; y = ny;
    if (i >= 30) pts.push([x, y]);
  }
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [px, py] of pts) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
  const s = 1/Math.max(x1 - x0, y1 - y0);
  return pts.map(([px, py]) => [(px - (x0 + x1)/2)*s, (py - (y0 + y1)/2)*s]);    // centred, unit box, y up
}
function pfractal(cfg0, S0) {
  let cfg = cfg0, P = null, T = null, kind = null, zph = 0, lastT = S0.t; const R = rng(cfg0.seed || 99);
  const setup = () => {
    kind = cfg.kind || 'sierpinski'; const n = cfg.n || 2400;
    T = chaosPoints(kind, n, R);
    if (!P) P = T.map(() => ({ x: (R() - 0.5)*2, y: (R() - 0.5)*2, vx: 0, vy: 0 }));
    while (P.length < T.length) P.push({ x: 0, y: 0, vx: 0, vy: 0 }); P.length = T.length;
  };
  return {
    reconfig(c) { const k = c.kind !== cfg.kind; cfg = c; if (k) setup(); },
    step(S, active) {
      if (!P || kind !== (cfg.kind || 'sierpinski')) setup();
      if (S.t < lastT - 0.3 || S.t > lastT + 2) zph = 0;
      lastT = S.t;
      if (cfg.zoom) zph = (zph + S.dt*(0.18 + 0.55*S.sectionT)*(S.bpm || 104)/104) % 1;   // every loop a little faster
      const k = Math.min(1, S.dt*7), damp = Math.exp(-S.dt*5);
      if (active && S.kick) for (const p of P) if (R() < (cfg.scatter ?? 0.35)) { const a = R()*TAU, v = 0.4 + R()*0.9; p.vx += Math.cos(a)*v; p.vy += Math.sin(a)*v; }
      for (let i = 0; i < P.length; i++) {
        const p = P[i], t = T[i];
        p.vx = (p.vx + (t[0] - p.x)*k*6)*damp; p.vy = (p.vy + (t[1] - p.y)*k*6)*damp;
        p.x += p.vx*S.dt; p.y += p.vy*S.dt;
      }
      return `Particle ${kind}${cfg.zoom ? ' (zooming)' : ''}`;
    },
    draw(ctx, S, a) {
      if (!P) return;
      const col = hex(cfg.color || '#19E6FF'), hot = mix(col, [255, 255, 255], 0.6), sc = S.H*(cfg.size ?? 0.82);
      const cx = S.W/2, cy = S.H*(cfg.cy ?? 0.46), r0 = S.H/1080*(cfg.dot ?? 5.5)*(1 + 0.5*(S.kickEnv || 0));
      // sierpinski zoom: scale 2^z about the apex, clipped to the outer triangle (self-similar, so the loop is seamless)
      const zs = Math.pow(2, zph), ax = 0, ay = 0.433;
      // fern grows from the ground up across the section
      const grow = cfg.grow ? smooth(0, 0.85, S.sectionT) : 1;
      for (let i = 0; i < P.length; i++) {
        const p = P[i]; let x = p.x, y = p.y;
        if (cfg.grow && T[i][1] + 0.5 > grow*1.02) continue;
        if (cfg.zoom) { x = ax + (x - ax)*zs; y = ay + (y - ay)*zs; if (y < -0.45 || Math.abs(x) > 0.5*(0.433 - y)/0.866 + 0.02) continue; }
        const sp = Math.hypot(p.vx, p.vy);
        ctx.globalAlpha = a*(0.55 + Math.min(0.45, sp*0.6));
        dot(ctx, sp > 0.3 ? hot : col, cx + x*sc, cy - y*sc, r0*(1 + Math.min(1.5, sp)));
      }
    },
  };
}

// =====================================================================================================  helix → torus → supernova
function helix(cfg0, S0) {
  let cfg = cfg0, stage = cfg0.stage || 'helix', prev = null, morph = 1, lastT = S0.t;
  let spin = 0, spinV = 0.35, novaT = null, novaFired = false, ashT = null;
  let wind = 0, tilt = 0.28, swell = 1;                              // counter-winding phase, tumble angle, end-on radius swell
  const N = 1800, STREAM = 700, R = rng(2026);
  const U = Array.from({ length: N }, (_, i) => ({ u: i/N, s: i & 1, j: R(), rung: (i % 9) === 0 }));
  const SP = Array.from({ length: STREAM }, () => ({ u: R(), ps: R()*TAU, sp: 0.6 + R()*0.8 }));
  const pos = new Float32Array(N*3), from = new Float32Array(N*3);
  const L = 1.7, Rh = 0.24, turns = 5.5, Rm = 0.62, Rt = 0.22;
  function target(st, q, bend, out, o) {
    const th = q.u*turns*TAU + q.s*Math.PI, thT = q.u*(cfg.windings ?? 24)*TAU + q.s*Math.PI;
    let x, y, z;
    if (st === 'mobius') {
      const ph = q.u*TAU, v = (q.s ? 1 : -1)*0.32*(0.4 + 0.6*q.j);
      x = (0.62 + v*Math.cos(ph/2))*Math.cos(ph); z = (0.62 + v*Math.cos(ph/2))*Math.sin(ph); y = v*Math.sin(ph/2);
    } else if (st === 'torus' || st === 'nova' || st === 'ash') {
      // a helix bent by `bend` (0 = straight, 1 = closed ring = torus knot)
      const r = q.rung ? Rt*(q.j*2 - 1)*0.9 : Rt;
      const hx = Math.cos(th)*r, hz = Math.sin(th)*r, hy = (q.u - 0.5)*L;
      const tx = (Rm + Math.cos(thT)*r)*Math.cos(q.u*TAU), tz = (Rm + Math.cos(thT)*r)*Math.sin(q.u*TAU), ty = Math.sin(thT)*r;
      const w = smooth(0, 1, bend*1.25 - Math.abs(q.u - 0.5)*0.5);   // the ends curl in first
      x = hx + (tx - hx)*w; y = hy + (ty - hy)*w; z = hz + (tz - hz)*w;
    } else if (st === 'helix' && (cfg.counter ?? true) || st === 'thin' && cfg.counter) {
      // counter-wound: strand A winds one way, strand B the other (opposite hands, turning in opposite directions);
      // rungs are chords between the two strands at the same height, so they sweep as the strands pass each other
      const a = q.u*turns*TAU + wind, thA = a, thB = Math.PI - a, r = Rh*swell;
      y = (q.u - 0.5)*L;
      if (q.rung) { const k = q.j; x = r*(Math.cos(thA)*(1 - k) + Math.cos(thB)*k); z = r*(Math.sin(thA)*(1 - k) + Math.sin(thB)*k); }
      else { const t2 = q.s ? thB : thA; x = Math.cos(t2)*r; z = Math.sin(t2)*r; }
    } else {                                                         // 'helix' / 'thin'
      const r = q.rung ? Rh*(q.j*2 - 1) : Rh;
      x = Math.cos(th)*r; z = Math.sin(th)*r; y = (q.u - 0.5)*L;
    }
    out[o] = x; out[o + 1] = y; out[o + 2] = z;
  }
  function setStage(st, S) { if (st === stage && prev) return; from.set(pos); prev = stage; stage = st; morph = 0; if (st !== 'torus') { novaT = null; novaFired = false; } if (st === 'ash') ashT = S.t; }
  for (let i = 0; i < N; i++) target(stage, U[i], 0, pos, i*3);
  function novaTime(S) {                                            // the sung "Now." if timing has it, else nova fraction of the section
    if (S.timing && S.timing.lines) { const l = S.timing.lines.filter(l => l.section === S.section.name && /^now\.?$/i.test(l.text.trim())).at(-1); if (l && l.start) return l.start; }
    const e = sectionEnd(S); if (e && S.timing && S.timing.sections) { const s = S.timing.sections.find(s => s.name === S.section.name); if (s) return s.start + (e - s.start)*(cfg.nova ?? 0.86); }
    return null;
  }
  return {
    reconfig(c, S) { cfg = c; setStage(c.stage || 'helix', S); },
    step(S, active) {
      if (S.t < lastT - 0.3 || S.t > lastT + 2) { morph = 1; novaFired = false; }
      lastT = S.t;
      const free = cfg.free ?? (stage !== 'thin');
      // beat-snapped (thin) vs free (finale): the beat only nudges a running spin
      if (free) { spinV += ((stage === 'torus' ? 0.6 + 2.4*S.sectionT : 0.45) - spinV)*Math.min(1, S.dt*0.5); if (S.kick) spinV += 0.08; }
      else spinV = 0.25 + 0.5*(S.kickEnv || 0);
      const tumbling = stage === 'helix' && (cfg.tumble ?? true);
      spin += spinV*S.dt*(tumbling ? 0.35 : 1);                       // slower yaw while tumbling, so the roll reads clearly
      wind += S.dt*(cfg.windSpeed ?? 0.9)*(1 + 0.8*(S.kickEnv || 0));
      // tumble: the helix rolls end over end toward the viewer, passes through a circle (looking down its axis) and carries on
      if (tumbling) tilt += S.dt*(cfg.tumbleSpeed ?? 0.4)*(1 + 0.5*(S.kickEnv || 0));
      else { const want = stage === 'torus' || stage === 'nova' ? 0.55 + 0.25*S.sectionT : 0.28;
        const d = ((want - tilt + Math.PI) % TAU + TAU) % TAU - Math.PI; tilt += d*Math.min(1, S.dt*1.2); }
      tilt = ((tilt % TAU) + TAU) % TAU;
      swell = tumbling ? 1 + (cfg.swell ?? 1.2)*Math.pow(Math.sin(tilt), 2) : 1 + (swell - 1)*Math.max(0, 1 - S.dt*2);
      morph = Math.min(1, morph + S.dt/(cfg.morph ?? 2.2));
      const bend = stage === 'torus' ? smooth(0.02, 0.7, S.sectionT) : (stage === 'nova' || stage === 'ash') ? 1 : 0;
      if (stage === 'torus' && !novaFired) { const nt = novaTime(S); if (nt != null ? S.t >= nt : S.sectionT >= (cfg.nova ?? 0.86)) { novaFired = true; novaT = S.t; } }
      if (novaT != null && S.t < novaT) novaT = null;
      const tmp = [0, 0, 0], e = smooth(0, 1, morph);
      for (let i = 0; i < N; i++) { target(stage, U[i], bend, tmp, 0); const o = i*3; for (let k = 0; k < 3; k++) pos[o + k] = from[o + k] + (tmp[k] - from[o + k])*e; }
      for (const s of SP) s.ps += S.dt*s.sp*(1.5 + 3*S.sectionT)*(stage === 'torus' ? 1 : 0.3);
      return `Helix ${stage}${novaT != null ? ' · supernova' : ''} · spin ${spinV.toFixed(2)}`;
    },
    draw(ctx, S, a) {
      const gold = hex(cfg.color || '#FFC23A'), white = [255, 246, 224], cyan = hex('#19E6FF'), mag = hex('#FF2E9A');
      const cx = S.W/2, cy = S.H*0.45, sc = S.H*(stage === 'thin' ? 0.42 : 0.5)*(1 + (stage === 'thin' ? 0.12*(S.kickEnv || 0) : 0));
      const ca = Math.cos(spin), sa = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
      const nv = novaT != null ? Math.max(0, S.t - novaT) : null;
      const proj = (x, y, z) => {                       // yaw by spin, tilt about x, perspective
        const x1 = x*ca + z*sa, z1 = -x*sa + z*ca, y2 = y*ct - z1*st, z2 = y*st + z1*ct, f = 2.6/(2.6 + z2);
        return [cx + x1*sc*f, cy - y2*sc*f, f];
      };
      const thin = stage === 'thin', szBase = S.H/1080*(thin ? 3.2 : 6.5);
      for (let i = 0; i < N; i++) {
        let x = pos[i*3], y = pos[i*3 + 1], z = pos[i*3 + 2];
        if (nv != null) {                               // supernova: radial burst with a spiral twist, white core → gold arms
          const d = Math.hypot(x, y, z) + 1e-4, out = (1 - Math.exp(-nv*0.8))*(0.5 + 1.3*U[i].j), tw = out*2.2 + nv*0.25;
          const nx = x/d*(d + out), nz = z/d*(d + out), c = Math.cos(tw), s = Math.sin(tw);
          x = nx*c - nz*s; z = nx*s + nz*c; y = y*(1 + out*0.4);
        }
        const [X, Y, f] = proj(x, y, z);
        let col = thin ? (U[i].s ? cyan : mag) : gold;
        if (stage === 'helix' && (cfg.counter ?? true) && U[i].s && !U[i].rung) col = mix(gold, [255, 128, 40], 0.55);   // second strand: deeper amber, so the two directions read apart
        if (nv != null) col = mix(white, gold, Math.min(1, nv*0.7 + U[i].j*0.4));
        if (stage === 'ash' && ashT != null) { const u = clamp01((S.t - ashT)/(cfg.ashDur ?? 8)); if (U[i].j < u) continue; }
        ctx.globalAlpha = a*(thin ? 0.5 : 0.8)*(nv != null ? Math.max(0, 1 - nv*0.1) : 1)*(0.55 + 0.45*f);
        dot(ctx, U[i].rung ? mix(col, white, 0.5) : col, X, Y, szBase*f*(U[i].rung ? 0.8 : 1));
      }
      if (stage === 'torus' && nv == null) {            // energy streaming around and through the hole
        for (const s of SP) {
          const ph = s.u*TAU, ps = s.ps, r = Rt*1.25*(0.9 + 0.2*Math.sin(ps*3));
          const x = (Rm + Math.cos(ps)*r)*Math.cos(ph), z = (Rm + Math.cos(ps)*r)*Math.sin(ph), y = Math.sin(ps)*r;
          const [X, Y, f] = proj(x, y, z), inner = Math.cos(ps) < -0.3;
          ctx.globalAlpha = a*smooth(0.15, 0.6, S.sectionT)*(inner ? 0.95 : 0.5);
          dot(ctx, inner ? white : cyan, X, Y, S.H/1080*4.5*f);
        }
      }
      if (nv != null) {                                 // the core flash and the shock ring
        const g = Math.max(0, 1 - nv*0.35);
        ctx.globalAlpha = a*g; dot(ctx, white, cx, cy, S.H*(0.12 + Math.min(0.5, nv*0.25)));
        ctx.globalAlpha = a*Math.max(0, 1 - nv*0.4); ctx.strokeStyle = `rgb(${gold})`; ctx.lineWidth = Math.max(2, S.H/180*(1 - Math.min(1, nv*0.4)));
        ctx.beginPath(); ctx.arc(cx, cy, S.H*(0.1 + nv*0.7), 0, TAU); ctx.stroke();
      }
      if (stage === 'ash' && ashT != null) {           // one glowing particle left: the now
        const u = clamp01((S.t - ashT)/(cfg.ashDur ?? 8)); ctx.globalAlpha = a*smooth(0.2, 0.9, u); dot(ctx, white, cx, cy, S.H*0.03*(1 + 0.3*(S.kickEnv || 0)));
      }
    },
  };
}

VizForms.register('stabs', stabs);
VizForms.register('life', life);
VizForms.register('pfractal', pfractal);
VizForms.register('helix', helix);
})();
