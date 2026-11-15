// Spectrum, oscilloscope and cymatics layers for the Live Visualizer (registered with VizForms).
// Plan: songs/GOD 2.0/GOD2-spectrum-build-plan.md (project doc visuals/god2-spectrum-build-plan.md).
// Data: live audio via window.VizAudio (index.html) and offline analysis via window.VIZ_SPECTRA[pack id]
// (tools/live-visualizer/analysis/spectra.py writes <song>.spectra.js; the pack loads it). Every layer works paused/scrubbing
// from the offline frames; mandala, ridgeline and scope prefer live audio while it plays.
//
//   mandala   { type:'mandala', fold:6, bins:72, color:'#19E6FF', accent:'#FF2E9A' }
//   ridgeline { type:'ridgeline', lines:36, color:'#19E6FF' }
//   scope     { type:'scope', mode:'xy'|'polar', color:'#FF2E9A', persist:.82 }
//   chroma    { type:'chroma' }                       12-note wheel; the strongest note turns to the top
//   fountain  { type:'fountain' }                     12 note emitters spray big particles
//   lissajous { type:'lissajous', color:'#FFC23A' }   bass fundamental vs the strongest upper core frequency
//   plate     { type:'plate', grains:5000, color:'#B6FF3B' }   true Chladni plate from the core frequencies
//   flametube { type:'flametube', flames:48 }        flames tracing the bass note's standing wave
//   strings   { type:'strings', count:6 }            harmonic series of the strongest core frequency
//   sphere    { type:'sphere', points:1600 }         spherical-harmonic shell deformed by the bands
(() => {
if (!window.VizForms) return;
const { clamp01, smooth, rng } = VizForms.util;
const TAU = Math.PI*2;
const NOTES = 'C C# D D# E F F# G G# A A# B'.split(' ');
const hex = h => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
const hsl = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h/30) % 12, a = s*Math.min(l, 1 - l), f = n => l - a*Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [255*f(0), 255*f(8), 255*f(4)]; };
const SPR = new Map();
function sprite(rgb) {
  const q = rgb.map(v => Math.max(0, Math.min(255, Math.round(v/16)*16))), k = q.join(',');
  let c = SPR.get(k); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d');
  const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, `rgba(${k},1)`); gr.addColorStop(0.5, `rgba(${k},0.3)`); gr.addColorStop(1, `rgba(${k},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
  if (SPR.size > 400) SPR.clear(); SPR.set(k, c); return c;
}
const dot = (ctx, rgb, x, y, r) => ctx.drawImage(sprite(rgb), x - r, y - r, r*2, r*2);
const rgbs = c => `rgb(${c.map(Math.round).join(',')})`;

// ---------------- data access ----------------
const SPEC = S => { const P = window.VIZ_SPECTRA || {}; return P[S.packId] || P[S.timing && S.timing.song] || Object.values(P)[0] || null; };
function frame(S) {
  const D = SPEC(S); if (!D) return null;
  const i = Math.max(0, Math.min(D.n - 1, Math.floor(S.t/D.hop)));
  return { D, i, bands: D.bands[i], chroma: D.chroma[i], cores: D.cores[i] || [], f0: D.f0[i] || 0 };
}
const live = () => { const A = window.VizAudio; return A && A.playing && A.playing() ? A : null; };
// log-spaced spectrum bins 0..1: live FFT while playing, else rebuilt from the offline bands + core peaks
function spectrumBins(S, n) {
  const out = new Float32Array(n), A = live(), lo = 40, hi = 12000;
  if (A && A.freq) {
    const hz = A.sampleRate()/A.fftSize();
    for (let k = 0; k < n; k++) {
      const f0 = lo*Math.pow(hi/lo, k/n), f1 = lo*Math.pow(hi/lo, (k + 1)/n);
      let s = 0, c = 0; for (let b = Math.floor(f0/hz); b <= Math.ceil(f1/hz) && b < A.freq.length; b++) { s = Math.max(s, A.freq[b]); c++; }
      out[k] = c ? Math.pow(s/255, 1.4) : 0;
    }
    return out;
  }
  const F = frame(S); if (!F) return out;
  const centers = [40, 120, 500, 2000, 8000];
  for (let k = 0; k < n; k++) {
    const f = lo*Math.pow(hi/lo, (k + 0.5)/n), lf = Math.log(f);
    let v = 0; for (let b = 0; b < 5; b++) v += F.bands[b]*Math.exp(-Math.pow((lf - Math.log(centers[b]))/0.7, 2));
    for (const [cf, cl] of F.cores) v += cl*Math.exp(-Math.pow((lf - Math.log(cf))/0.05, 2));
    out[k] = Math.min(1, v*0.8);
  }
  return out;
}
const kickPulse = S => S.kickEnv || 0;

// ======================================================================== mandala
VizForms.register('mandala', (cfg0) => {
  let cfg = cfg0, bins = null, sm = null;
  return {
    reconfig(c) { cfg = c; },
    step(S) { const n = cfg.bins || 72; bins = spectrumBins(S, n); if (!sm || sm.length !== n) sm = new Float32Array(n);
      for (let k = 0; k < n; k++) sm[k] += (bins[k] - sm[k])*Math.min(1, S.dt*(bins[k] > sm[k] ? 30 : 8)); return `Mandala ${cfg.fold || 6}-fold${live() ? ' · live' : ''}`; },
    draw(ctx, S, a) {
      if (!sm) return;
      const n = sm.length, fold = cfg.fold || 6, cx = S.W/2, cy = S.H*0.45, r0 = S.H*(0.12 + 0.03*kickPulse(S)), amp = S.H*0.3;
      const col = hex(cfg.color || '#19E6FF'), acc = hex(cfg.accent || '#FF2E9A'), rot = S.t*0.08;
      ctx.lineWidth = Math.max(1.5, S.H/400);
      for (let f = 0; f < fold; f++) for (const mir of [1, -1]) {
        ctx.beginPath();
        for (let k = 0; k <= n; k++) {
          const v = sm[Math.min(n - 1, k)], ang = rot + (f + mir*(k/n)*0.5)*TAU/fold, r = r0 + v*amp;
          const x = cx + Math.cos(ang)*r, y = cy + Math.sin(ang)*r; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.globalAlpha = a*0.85; ctx.strokeStyle = rgbs(col); ctx.stroke();
        for (let k = 0; k < n; k += 3) {                  // big tip particles on the loud bins
          const v = sm[k]; if (v < 0.35) continue;
          const ang = rot + (f + mir*(k/n)*0.5)*TAU/fold, r = r0 + v*amp;
          ctx.globalAlpha = a*v; dot(ctx, mix(col, acc, k/n), cx + Math.cos(ang)*r, cy + Math.sin(ang)*r, S.H/1080*(6 + 10*v));
        }
      }
    },
  };
});

// ======================================================================== ridgeline waterfall
VizForms.register('ridgeline', (cfg0) => {
  let cfg = cfg0; const hist = []; let acc = 0;
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      acc += S.dt; const every = cfg.every ?? 0.06;
      if (acc >= every || !hist.length) { acc = 0; hist.unshift(spectrumBins(S, cfg.bins || 96)); if (hist.length > (cfg.lines || 36)) hist.pop(); }
      return `Ridgeline ${hist.length}`;
    },
    draw(ctx, S, a) {
      const col = hex(cfg.color || '#19E6FF'), far = hex(cfg.far || '#6A3BFF'), L = cfg.lines || 36;
      for (let j = hist.length - 1; j >= 0; j--) {
        const z = j/L, pz = 1/(1 + z*2.2), w = S.W*0.9*pz, x0 = S.W/2 - w/2, yb = S.H*(0.9 - 0.62*(1 - pz)/0.69), h = S.H*0.22*pz, row = hist[j];
        ctx.beginPath();
        for (let k = 0; k < row.length; k++) { const x = x0 + w*k/(row.length - 1), env = Math.sin(Math.PI*k/(row.length - 1)); const y = yb - row[k]*h*(0.4 + 0.6*env); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.globalAlpha = a*(1 - z)*(j === 0 ? 1 : 0.7); ctx.strokeStyle = rgbs(mix(col, far, z)); ctx.lineWidth = Math.max(1, S.H/540*(1.6 - z)); ctx.stroke();
      }
    },
  };
});

// ======================================================================== scope (stereo XY / polar waveform)
VizForms.register('scope', (cfg0) => {
  let cfg = cfg0; const L = new Float32Array(2048), R = new Float32Array(2048);
  const ph = document.createElement('canvas'), pctx = ph.getContext('2d'); let src = '';
  function fill(S) {
    const A = live();
    if (A && A.timeL && A.timeR) { A.timeL(L); A.timeR(R); src = 'live'; return; }
    const F = frame(S); src = 'offline';                // synthesize from the core frequencies (slowed for the eye)
    const cs = F ? F.cores.slice(0, 3) : [[110, 0.5]], base = cs.length ? cs[0][0] : 110;
    for (let i = 0; i < L.length; i++) {
      const u = i/L.length*TAU*4 + S.t*0.7; let l = 0, r = 0;
      cs.forEach(([f, lv], k) => { const m = f/base; l += lv*Math.sin(u*m); r += lv*Math.sin(u*m + 0.6 + k*0.9 + S.t*0.3); });
      L[i] = l*0.6; R[i] = r*0.6;
    }
  }
  return {
    reconfig(c) { cfg = c; },
    step(S) { fill(S); return `Scope ${cfg.mode || 'xy'} · ${src}`; },
    draw(ctx, S, a) {
      if (ph.width !== S.W || ph.height !== S.H) { ph.width = S.W; ph.height = S.H; }
      pctx.globalCompositeOperation = 'destination-out'; pctx.fillStyle = `rgba(0,0,0,${1 - (cfg.persist ?? 0.82)})`; pctx.fillRect(0, 0, S.W, S.H);
      pctx.globalCompositeOperation = 'lighter';
      const col = hex(cfg.color || '#FF2E9A'), cx = S.W/2, cy = S.H*0.45, sc = S.H*0.34*(1 + 0.08*kickPulse(S));
      pctx.strokeStyle = rgbs(col); pctx.lineWidth = Math.max(1.2, S.H/450); pctx.globalAlpha = 0.9; pctx.beginPath();
      if ((cfg.mode || 'xy') === 'xy') {
        for (let i = 0; i < L.length; i += 2) { const sg = cfg.side ?? 3.5, x = cx + (L[i] - R[i])*0.7071*sc*1.6*sg, y = cy - (L[i] + R[i])*0.7071*sc*1.6; i ? pctx.lineTo(x, y) : pctx.moveTo(x, y); }
      } else {
        const r0 = S.H*0.2;
        for (let i = 0; i <= 512; i++) { const v = (L[i*4 % L.length] + R[i*4 % R.length])*0.5, ang = i/512*TAU - Math.PI/2, r = r0 + v*sc*0.9; const x = cx + Math.cos(ang)*r, y = cy + Math.sin(ang)*r; i ? pctx.lineTo(x, y) : pctx.moveTo(x, y); }
      }
      pctx.stroke();
      ctx.globalAlpha = a; ctx.drawImage(ph, 0, 0);
    },
  };
});

// ======================================================================== chroma wheel
VizForms.register('chroma', (cfg0) => {
  let cfg = cfg0, rot = 0, sm = new Float32Array(12), top = 0;
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const F = frame(S); if (!F) return 'Chroma: no analysis loaded';
      for (let k = 0; k < 12; k++) sm[k] += (F.chroma[k] - sm[k])*Math.min(1, S.dt*10);
      let best = 0; for (let k = 1; k < 12; k++) if (sm[k] > sm[best]) best = k; top = best;
      const want = -best*TAU/12; let d = want - rot; d = Math.atan2(Math.sin(d), Math.cos(d)); rot += d*Math.min(1, S.dt*1.2);   // the wheel turns the strongest note to the top
      return `Chroma ${NOTES[top]}`;
    },
    draw(ctx, S, a) {
      const cx = S.W/2, cy = S.H*0.45, r0 = S.H*0.16, r1 = S.H*0.38, kp = kickPulse(S);
      for (let k = 0; k < 12; k++) {
        const ang = rot + k*TAU/12 - Math.PI/2, v = sm[k], col = hsl(k*30, 90, 58), len = r0 + (r1 - r0)*v*(1 + 0.15*kp);
        ctx.globalAlpha = a*(0.25 + 0.75*v); ctx.strokeStyle = rgbs(col); ctx.lineWidth = S.H*0.045*(0.4 + 0.6*v); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang)*r0, cy + Math.sin(ang)*r0); ctx.lineTo(cx + Math.cos(ang)*len, cy + Math.sin(ang)*len); ctx.stroke();
        dot(ctx, col, cx + Math.cos(ang)*len, cy + Math.sin(ang)*len, S.H/1080*(10 + 22*v));
        if (cfg.labels !== false) { ctx.globalAlpha = a*(0.35 + 0.65*v); ctx.fillStyle = '#fff'; ctx.font = `${Math.round(S.H/48)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(NOTES[k], cx + Math.cos(ang)*(r1 + S.H*0.05), cy + Math.sin(ang)*(r1 + S.H*0.05)); }
      }
    },
  };
});

// ======================================================================== note fountains
VizForms.register('fountain', (cfg0) => {
  let cfg = cfg0; const P = [], R = rng(12); let lastT = 0;
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const F = frame(S); if (!F) return 'Fountain: no analysis loaded';
      if (S.t < lastT - 0.3 || S.t > lastT + 2) P.length = 0; lastT = S.t;
      const burst = S.kick ? 3 : 1;
      for (let k = 0; k < 12; k++) {
        const v = F.chroma[k]; if (v < 0.45) continue;
        const nspawn = Math.round(v*v*burst*(cfg.rate ?? 2));
        for (let j = 0; j < nspawn; j++) P.push({ k, x: (k + 0.5)/12 + (R() - 0.5)*0.02, y: 1, vx: (R() - 0.5)*0.06, vy: -(0.55 + 0.75*v + R()*0.25), life: 0 });
      }
      for (const p of P) { p.vy += S.dt*0.9; p.x += p.vx*S.dt; p.y += p.vy*S.dt; p.life += S.dt; }
      for (let i = P.length - 1; i >= 0; i--) if (P[i].y > 1.02 || P[i].life > 3) P.splice(i, 1);
      if (P.length > 2500) P.splice(0, P.length - 2500);
      return `Fountain ${P.length}`;
    },
    draw(ctx, S, a) {
      for (const p of P) { ctx.globalAlpha = a*Math.max(0, 1 - p.life/3); dot(ctx, hsl(p.k*30, 90, 60), p.x*S.W, S.H*0.08 + p.y*S.H*0.86, S.H/1080*9); }
    },
  };
});

// ======================================================================== lissajous from core frequencies
VizForms.register('lissajous', (cfg0) => {
  let cfg = cfg0, ratio = 1.5, ph = 0, info = '';
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const F = frame(S); if (!F) return 'Lissajous: no analysis loaded';
      const f0 = F.f0 || (F.cores[0] && F.cores[0][0]) || 110;
      const up = F.cores.map(c => c[0]).filter(f => f > f0*1.2).sort((x, y) => x - y)[0];
      if (up) { let r = up/f0; while (r > 4) r /= 2; ratio += (r - ratio)*Math.min(1, S.dt*3); }
      ph += S.dt*(0.25 + 0.6*kickPulse(S));
      info = `Lissajous ${ratio.toFixed(3)} (${Math.round(f0)} Hz)`; return info;
    },
    draw(ctx, S, a) {
      const cx = S.W/2, cy = S.H*0.45, sc = S.H*0.33*(1 + 0.06*kickPulse(S)), col = hex(cfg.color || '#FFC23A');
      ctx.globalAlpha = a; ctx.strokeStyle = rgbs(col); ctx.lineWidth = Math.max(1.5, S.H/360); ctx.beginPath();
      const N = 900, turns = cfg.turns ?? 4;
      for (let i = 0; i <= N; i++) { const u = i/N*TAU*turns; const x = cx + Math.sin(u + ph)*sc*1.25, y = cy + Math.sin(u*ratio)*sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    },
  };
});

// ======================================================================== true Chladni plate from the core frequencies
// square plate mode (m,n): cos(nπx)cos(mπy) − cos(mπx)cos(nπy); its frequency ∝ m²+n². Each core frequency picks the
// mode whose m²+n² best matches its pitch; up to 3 modes are superposed, weighted by level; sand walks off the antinodes.
const MODES = []; for (let m = 1; m <= 14; m++) for (let n = 1; n < m; n++) if ((m + n) % 2) MODES.push([m, n, m*m + n*n]);
function modeFor(f) { const s = Math.max(5, Math.min(180, 5*f/55)); let best = MODES[0]; for (const M of MODES) if (Math.abs(M[2] - s) < Math.abs(best[2] - s)) best = M; return best; }
VizForms.register('plate', (cfg0) => {
  let cfg = cfg0, G = null, modes = [], info = '', hold = 0, acc = new Map(), names = ''; const R = rng(5);
  const A = (x, y) => { let s = 0; for (const [m, n, , w] of modes) s += w*(Math.cos(n*Math.PI*x)*Math.cos(m*Math.PI*y) - Math.cos(m*Math.PI*x)*Math.cos(n*Math.PI*y)); return s; };
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const F = frame(S); if (!G) { const n = cfg.grains || 5000; G = new Float32Array(n*2); for (let i = 0; i < G.length; i++) G[i] = R()*2 - 1; }
      if (!F) return 'Plate: no analysis loaded';
      // collect the core notes for a while, then re-tune the plate to the strongest ones (a held chord settles the sand)
      for (const [f, l] of F.cores) { if (l < 0.06) continue; const m = Math.round(69 + 12*Math.log2(f/440)); acc.set(m, (acc.get(m) || 0) + l*S.dt); }
      hold += S.dt;
      if (!modes.length || hold > (cfg.hold ?? 1.6) || (S.kick && hold > 0.9)) {
        const top = [...acc.entries()].sort((x, y) => y[1] - x[1]).slice(0, cfg.voices ?? 2);
        if (top.length) {
          const tot = top.reduce((s, x) => s + x[1], 0);
          modes = top.map(([m, w]) => { const M = modeFor(440*Math.pow(2, (m - 69)/12)); return [M[0], M[1], M[2], w/tot]; });
          names = top.map(([m]) => NOTES[((m % 12) + 12) % 12]).join(' ');
        }
        acc = new Map(); hold = 0;
      }
      const shake = 0.03 + 0.06*kickPulse(S);
      for (let it = 0; it < 2; it++) for (let i = 0; i < G.length; i += 2) {
        const amp = Math.min(1, Math.abs(A(G[i], G[i + 1]))*1.3), st = shake*(0.02 + amp*amp*1.8);
        G[i] = Math.max(-1, Math.min(1, G[i] + (R() - 0.5)*st)); G[i + 1] = Math.max(-1, Math.min(1, G[i + 1] + (R() - 0.5)*st));
      }
      info = 'Plate ' + modes.map(m => `(${m[0]},${m[1]})`).join('+') + ' ← ' + names;
      return info;
    },
    draw(ctx, S, a) {
      if (!G) return;
      const side = S.H*0.72, x0 = S.W/2 - side/2, y0 = S.H*0.45 - side/2, col = hex(cfg.color || '#B6FF3B'), r = S.H/1080*(cfg.dot ?? 3.2);
      ctx.globalAlpha = a*0.25; ctx.strokeStyle = rgbs(col); ctx.lineWidth = 1; ctx.strokeRect(x0, y0, side, side);
      ctx.globalAlpha = a*0.8;
      const spr = sprite(col);
      for (let i = 0; i < G.length; i += 2) ctx.drawImage(spr, x0 + (G[i] + 1)/2*side - r, y0 + (G[i + 1] + 1)/2*side - r, r*2, r*2);
    },
  };
});

// ======================================================================== flame tube (standing wave of the bass note)
VizForms.register('flametube', (cfg0) => {
  let cfg = cfg0, nodes = 4, lev = 0; const R = rng(9);
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const F = frame(S); if (!F) return 'Flame tube: no analysis loaded';
      const f0 = F.f0 || 55; nodes += (Math.max(2, Math.min(10, Math.round(f0/22))) - nodes)*Math.min(1, S.dt*2);
      lev += ((F.bands[0]*0.5 + F.bands[1]*0.8) - lev)*Math.min(1, S.dt*12);
      return `Flame tube ${Math.round(f0)} Hz · ${nodes.toFixed(1)} antinodes`;
    },
    draw(ctx, S, a) {
      const n = cfg.flames || 48, x0 = S.W*0.08, w = S.W*0.84, yb = S.H*(cfg.y ?? 0.86), hot = [255, 246, 224], gold = hex(cfg.color || '#FFC23A'), red = hex('#C4122F');
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5)/n, sw = Math.abs(Math.sin(Math.PI*nodes*u)), h = S.H*0.28*(0.08 + 0.92*sw*lev)*(1 + 0.25*kickPulse(S))*(0.85 + 0.3*R());
        const x = x0 + u*w, steps = 7;
        for (let k = 0; k < steps; k++) { const q = k/steps; ctx.globalAlpha = a*(1 - q)*0.85; dot(ctx, q < 0.3 ? hot : q < 0.7 ? gold : red, x + (R() - 0.5)*S.H*0.004, yb - q*h, S.H/1080*(16 - 9*q)); }
      }
    },
  };
});

// ======================================================================== harmonic strings
VizForms.register('strings', (cfg0) => {
  let cfg = cfg0, f = 110, amps = new Float32Array(8);
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const F = frame(S); if (!F) return 'Strings: no analysis loaded';
      const c0 = F.f0 || (F.cores[0] && F.cores[0][0]) || f; f += (c0 - f)*Math.min(1, S.dt*3);
      const bins = spectrumBins(S, 96), lo = 40, hi = 12000;
      for (let k = 1; k <= (cfg.count || 6); k++) {
        const fk = f*k, idx = Math.max(0, Math.min(95, Math.floor(Math.log(fk/lo)/Math.log(hi/lo)*96)));
        amps[k - 1] += ((bins[idx] || 0) - amps[k - 1])*Math.min(1, S.dt*10);
      }
      return `Strings ${Math.round(f)} Hz`;
    },
    draw(ctx, S, a) {
      const n = cfg.count || 6, x0 = S.W*0.1, w = S.W*0.8, col = hex(cfg.color || '#19E6FF'), top = hex('#FFC23A');
      for (let k = 1; k <= n; k++) {
        const y = S.H*(0.2 + 0.55*(k - 1)/(n - 1 || 1)), A = S.H*0.06*amps[k - 1]*(1 + 0.4*kickPulse(S)), om = Math.cos(S.t*TAU*0.7*k);
        const c = mix(col, top, (k - 1)/(n - 1 || 1));
        ctx.globalAlpha = a*(0.35 + 0.65*amps[k - 1]); ctx.strokeStyle = rgbs(c); ctx.lineWidth = Math.max(1.5, S.H/500); ctx.beginPath();
        for (let i = 0; i <= 160; i++) { const u = i/160, yy = y + Math.sin(Math.PI*k*u)*A*om; i ? ctx.lineTo(x0 + u*w, yy) : ctx.moveTo(x0, yy); }
        ctx.stroke();
        for (let j = 1; j <= k; j++) { const u = (j - 0.5)/k; dot(ctx, c, x0 + u*w, y + Math.sin(Math.PI*k*u)*A*om, S.H/1080*(6 + 10*amps[k - 1])); }   // antinodes
      }
    },
  };
});

// ======================================================================== cymatic sphere
VizForms.register('sphere', (cfg0) => {
  let cfg = cfg0, rot = 0, co = new Float32Array(5); const pts = [];
  const N = cfg0.points || 1600, ga = Math.PI*(3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) { const y = 1 - 2*(i + 0.5)/N, r = Math.sqrt(1 - y*y), th = i*ga; pts.push([Math.cos(th)*r, y, Math.sin(th)*r]); }
  const P = (l, x) => { let p0 = 1, p1 = x; if (l === 0) return 1; for (let k = 2; k <= l; k++) { const p2 = ((2*k - 1)*x*p1 - (k - 1)*p0)/k; p0 = p1; p1 = p2; } return p1; };   // Legendre
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const F = frame(S), b = F ? F.bands : [0.3, 0.3, 0.3, 0.3, 0.3];
      for (let l = 0; l < 5; l++) co[l] += (b[l] - co[l])*Math.min(1, S.dt*(b[l] > co[l] ? 20 : 6));
      rot += S.dt*(0.3 + 0.8*kickPulse(S));
      return 'Sphere ' + Array.from(co).map(v => v.toFixed(2)).join(' ');
    },
    draw(ctx, S, a) {
      const cx = S.W/2, cy = S.H*0.45, sc = S.H*0.26, ca = Math.cos(rot), sa = Math.sin(rot), col = hex(cfg.color || '#19E6FF'), hot = hex(cfg.accent || '#FF2E9A');
      for (const [x, y, z] of pts) {
        const phi = Math.atan2(z, x); let d = 0;
        for (let l = 0; l < 5; l++) d += co[l]*0.16*P(l + 2, y)*Math.cos((l + 2 >> 1)*phi + l);   // l = 2..6, m = l/2
        const r = 1 + d*(1 + 0.6*kickPulse(S)), X = x*r, Y = y*r, Z = z*r;
        const x1 = X*ca + Z*sa, z1 = -X*sa + Z*ca, f = 2.8/(2.8 + z1);
        ctx.globalAlpha = a*(0.35 + 0.65*(1 - (z1 + 1.4)/2.8))*Math.min(1, 0.6 + Math.abs(d)*3);
        dot(ctx, d > 0.03 ? mix(col, hot, Math.min(1, d*6)) : col, cx + x1*sc*f, cy - Y*sc*f, S.H/1080*5.5*f);
      }
    },
  };
});
})();
