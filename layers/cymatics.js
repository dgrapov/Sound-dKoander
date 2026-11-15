// Cymatics form layers (registered with VizForms in forms.js).
//
// chladni  - a vibrating plate with sand. The plate field is a real standing-wave mode:
//              square plate: A = cos(nπx)cos(mπy) − cos(mπx)cos(nπy)
//              round plate:  A = J_n(j_nm · r) · cos(nθ)      (J_n Bessel, j_nm its m-th zero)
//            Sand moves the way it does on a real plate: each grain is bounced in proportion to the
//            local vibration amplitude |A|, so grains random-walk off the antinodes and come to rest
//            on the nodal lines (A = 0). Nobody draws the lines; they emerge.
//            The mode follows the sung note (timing.pitch from tools/lyric-sync/pitch.py):
//            the same note always gives the same figure, so repeated melodies repeat the pattern.
//            options: plate:'square'|'circle', mode:'pitch'|[n,m], settle:0..1 (default from order)
//
// faraday  - Faraday waves: the standing-wave crystal a vibrated liquid makes. The surface is the sum
//            of N standing waves at equal angles: N=4 square, 6 hexagonal, 8/10/12 quasicrystals
//            (ordered, never periodic). A second wave set at k·φ (golden ratio) makes the pattern
//            self-similar across scales: a fractal crystal. The surface breathes at half the beat
//            rate (Faraday waves answer at half the drive frequency). Kicks send a ripple ring out.
//            options: waves:[4,6,8,12] (stepped across the section) | 8, golden:true, k:26
(() => {
if (!window.VizForms) return;
const { clamp01, smooth } = VizForms.util;

// ---------------- chladni ----------------
const G = 128;                                  // field grid resolution over [-1,1]²
const SQUARE_MODES = [[1,3],[2,4],[1,5],[3,5],[2,6],[1,7],[3,7],[4,6],[5,7],[2,8],[4,8],[3,9]];
const CIRCLE_MODES = [[1,1],[2,1],[0,2],[3,1],[1,2],[4,1],[2,2],[0,3],[5,1],[3,2],[1,3],[4,2]];

function besselJ(n, x) {
  let term = 1; for (let i = 1; i <= n; i++) term *= x/2/i;
  let sum = 0;
  for (let k = 0; k < 80; k++) {
    sum += term;
    term *= -(x*x/4)/((k + 1)*(k + n + 1));
    if (k > x && Math.abs(term) < 1e-10) break;
  }
  return sum;
}
function besselZero(n, m) {                      // m-th positive zero of J_n
  let found = 0, prev = besselJ(n, 0.3), step = 0.02;
  for (let x = 0.3 + step; x < 40; x += step) {
    const v = besselJ(n, x);
    if (prev === 0 || prev*v < 0) {
      let a = x - step, b = x;
      for (let i = 0; i < 40; i++) { const c = (a + b)/2; if (besselJ(n, a)*besselJ(n, c) <= 0) b = c; else a = c; }
      if (++found === m) return (a + b)/2;
    }
    prev = v;
  }
  return 10;
}

const FIELDS = new Map();
function field(plate, n, m) {
  const key = plate + n + ',' + m;
  if (FIELDS.has(key)) return FIELDS.get(key);
  const A = new Float32Array(G*G), gx = new Float32Array(G*G), gy = new Float32Array(G*G);
  const k = plate === 'circle' ? besselZero(n, m) : 0;
  let mx = 1e-9;
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const x = i/(G - 1)*2 - 1, y = j/(G - 1)*2 - 1;
    let v;
    if (plate === 'circle') { const r = Math.hypot(x, y); v = r > 1 ? 0 : besselJ(n, k*r)*Math.cos(n*Math.atan2(y, x)); }
    else v = Math.cos(n*Math.PI*x)*Math.cos(m*Math.PI*y) - Math.cos(m*Math.PI*x)*Math.cos(n*Math.PI*y);
    A[j*G + i] = v; mx = Math.max(mx, Math.abs(v));
  }
  for (let i = 0; i < A.length; i++) A[i] /= mx;
  for (let j = 1; j < G - 1; j++) for (let i = 1; i < G - 1; i++) {
    const o = j*G + i; gx[o] = (A[o + 1] - A[o - 1])/2; gy[o] = (A[o + G] - A[o - G])/2;
  }
  const f = { A, gx, gy, n, m, plate };
  FIELDS.set(key, f);
  return f;
}

VizForms.register('chladni', (cfg, S0) => {
  const plate = cfg.plate === 'circle' ? 'circle' : 'square';
  const modes = plate === 'circle' ? CIRCLE_MODES : SQUARE_MODES;
  let n = Math.round(S0.tune.sand ?? 4000), X = new Float32Array(n), Y = new Float32Array(n);
  const scatter = () => { for (let i = 0; i < n; i++) { X[i] = Math.random()*2 - 1; Y[i] = Math.random()*2 - 1; } };
  scatter();
  let cur = field(plate, ...(Array.isArray(cfg.mode) ? cfg.mode : modes[cfg.start || 0]));
  let prev = null, blend = 1, cand = -1, candT = 0, heldNote = null, lastSwitch = -9, rot = 0;
  function setMode(idx, t) {
    const f = field(plate, ...modes[((idx % modes.length) + modes.length) % modes.length]);
    if (f === cur) return;
    prev = cur; cur = f; blend = 0; lastSwitch = t;
  }
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const want = Math.round(S.tune.sand ?? 4000);
      if (want !== n) { n = want; X = new Float32Array(n); Y = new Float32Array(n); scatter(); }
      // pick the mode: fixed, sung note (with a little hysteresis), or a slow walk when no pitch track
      if (!Array.isArray(cfg.mode)) {
        if (S.pitch !== undefined) {
          const pc = S.pitch == null ? -1 : ((Math.round(S.pitch) % 12) + 12) % 12;
          if (pc >= 0) {
            if (pc !== cand) { cand = pc; candT = S.t; }
            if (S.t - candT > 0.12 && S.t - lastSwitch > 0.25) { setMode(pc + (cfg.start || 0), S.t); heldNote = S.pitch; }
          }
        } else setMode(Math.floor(S.sectionT*6) + (cfg.start || 0), S.t);
      }
      blend = Math.min(1, blend + S.dt/0.45);
      const settle = cfg.settle != null ? cfg.settle : 0.45 + 0.55*S.order;
      const drive = (0.6 + 0.8*S.bass)*(1 + 2.5*S.kickEnv*(S.tune.kickPhys ?? 1));
      const sig = 0.045*drive, noise = (1 - settle)*0.02, pull = 0.0015*settle;
      const circle = plate === 'circle', A = cur.A, gx = cur.gx, gy = cur.gy, P = prev && blend < 1 ? prev.A : null;
      for (let i = 0; i < n; i++) {
        let x = X[i], y = Y[i];
        const gi = Math.min(G - 1, Math.max(0, ((x + 1)*0.5*(G - 1)) | 0)), gj = Math.min(G - 1, Math.max(0, ((y + 1)*0.5*(G - 1)) | 0)), o = gj*G + gi;
        let a = A[o]; if (P) a = P[o] + (a - P[o])*blend;
        const amp = Math.abs(a);
        const s = sig*amp + noise;
        x += (Math.random() - 0.5)*s - pull*a*gx[o]*G;
        y += (Math.random() - 0.5)*s - pull*a*gy[o]*G;
        if (circle) { const r = Math.hypot(x, y); if (r > 0.995) { x *= 0.99/r; y *= 0.99/r; } }
        else { if (x > 1) x = 2 - x; if (x < -1) x = -2 - x; if (y > 1) y = 2 - y; if (y < -1) y = -2 - y; }
        X[i] = x; Y[i] = y;
      }
      rot += S.dt*(cfg.spin ?? 0.03);
      const sym = circle ? '○' : '□';
      return `Chladni ${sym}(${cur.n},${cur.m})` + (heldNote != null ? ' ' + VizForms.util.noteName(heldNote) : '');
    },
    draw(ctx, S, a) {
      const D = Math.min(S.W, S.H)*(cfg.size ?? 0.8)/2, cx = S.W/2, cy = S.H/2;
      ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.strokeStyle = `hsla(${(S.palette.life + S.hueShift)|0},50%,60%,${(a*0.18).toFixed(3)})`; ctx.lineWidth = S.DPR;
      if (plate === 'circle') { ctx.beginPath(); ctx.arc(0, 0, D, 0, 6.2832); ctx.stroke(); } else ctx.strokeRect(-D, -D, 2*D, 2*D);
      ctx.fillStyle = `hsla(${(S.palette.flame + 20 + S.hueShift)|0},55%,82%,${(a*0.75).toFixed(3)})`;
      const sz = 1.3*S.DPR;
      for (let i = 0; i < n; i++) ctx.fillRect(X[i]*D, Y[i]*D, sz, sz);
    },
  };
});

// ---------------- faraday ----------------
const FG = 120, TAU = (1 + Math.sqrt(5))/2;
VizForms.register('faraday', (cfg) => {
  const off = document.createElement('canvas'); off.width = off.height = FG;
  const octx = off.getContext('2d'), img = octx.createImageData(FG, FG), px = img.data;
  const F = new Float32Array(FG*FG);
  const xs = new Float32Array(FG); for (let i = 0; i < FG; i++) xs[i] = i/(FG - 1)*2 - 1;
  const mask = new Float32Array(FG*FG);
  for (let j = 0; j < FG; j++) for (let i = 0; i < FG; i++) { const r = Math.hypot(xs[i], xs[j]); mask[j*FG + i] = 1 - smooth(0.82, 1, r); }
  const ca = new Float32Array(FG), sa = new Float32Array(FG), cb = new Float32Array(FG), sb = new Float32Array(FG);
  let k = cfg.k || 26, kickT = -9, phase = new Float32Array(16), info = '', lastP = null;
  function addSet(N, kk, w, drift) {
    for (let jw = 0; jw < N; jw++) {
      const th = Math.PI*jw/N, a = kk*Math.cos(th), b = kk*Math.sin(th), ph = phase[jw]*drift;
      for (let i = 0; i < FG; i++) { ca[i] = Math.cos(a*xs[i]); sa[i] = Math.sin(a*xs[i]); cb[i] = Math.cos(b*xs[i] + ph); sb[i] = Math.sin(b*xs[i] + ph); }
      for (let j = 0; j < FG; j++) { const c = cb[j], s = sb[j], row = j*FG; for (let i = 0; i < FG; i++) F[row + i] += w*(ca[i]*c - sa[i]*s); }
    }
  }
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const list = Array.isArray(cfg.waves) ? cfg.waves : [cfg.waves || 8];
      const pos = list.length > 1 ? clamp01(S.sectionT)*(list.length - 1) : 0;
      const i0 = Math.min(list.length - 1, Math.floor(pos)), i1 = Math.min(list.length - 1, i0 + 1);
      const f = i1 === i0 ? 0 : smooth(0.65, 1, pos - i0);
      // wavelength follows the sung note (higher note = finer crystal), gliding
      if (S.pitch != null) lastP = S.pitch;
      const kT = (cfg.k || 26)*(lastP != null ? Math.pow(2, (lastP - 57)/24) : 1 + 0.08*Math.sin(S.t*0.21));
      k += (kT - k)*Math.min(1, S.dt*2.5);
      const drift = (1 - S.order)*1.2;
      for (let j = 0; j < phase.length; j++) phase[j] += S.dt*(0.3 + 0.17*j)*(Math.random() - 0.35);
      if (S.kick) kickT = S.t;
      F.fill(0);
      const gold = cfg.golden !== false;
      const sets = f > 0 ? [[list[i0], 1 - f], [list[i1], f]] : [[list[i0], 1]];
      let wsum = 0;
      for (const [N, w] of sets) { addSet(N, k, w/N, drift); if (gold) addSet(N, k*TAU, 0.55*w/N, drift); wsum += w*(gold ? 1.55 : 1); }
      // Faraday surfaces oscillate at half the drive frequency: crests and troughs swap every beat
      const bpm = S.bpm || 120, bc = Math.cos(Math.PI*S.t*bpm/60), breathe = Math.sign(bc)*(0.35 + 0.65*Math.abs(bc));
      const kr = S.t - kickT, ring = kr < 2 ? 0.7*Math.exp(-kr*2.2)*(S.tune.kickPhys ?? 1) : 0;
      const hueL = S.palette.life + S.hueShift, hueF = S.palette.flame + S.hueShift;
      const [lr, lg, lb] = hsl(hueL, 0.8, 0.62), [fr, fg2, fb] = hsl(hueF + 15, 0.9, 0.55);
      const Nn = f > 0.5 ? list[i1] : list[i0], gain = 1.3*Math.sqrt(2*Nn)/wsum, sq = S.order > 0.45;     // ordered: squared crests (sharper crystal)
      for (let j = 0; j < FG; j++) for (let i = 0; i < FG; i++) {
        const o = j*FG + i;
        let v = F[o]*gain*breathe;
        if (ring) { const r = Math.hypot(xs[i], xs[j]); v += ring*Math.cos(k*0.7*r - kr*9); }
        const m = mask[o], av = v > 0 ? (v > 1 ? 1 : v) : (v < -1 ? 1 : -v), c2 = sq ? av*av : av, pos2 = v > 0 ? c2*m : 0, neg = v < 0 ? c2*av*m*0.45 : 0;
        const q = o*4;
        px[q] = Math.min(255, lr*pos2 + fr*neg); px[q + 1] = Math.min(255, lg*pos2 + fg2*neg); px[q + 2] = Math.min(255, lb*pos2 + fb*neg);
        px[q + 3] = Math.min(255, 255*Math.max(pos2, neg));
      }
      octx.putImageData(img, 0, 0);
      const N = f > 0.5 ? list[i1] : list[i0];
      info = `Faraday ${N}-fold` + (gold ? '+φ' : '') + ` k=${k.toFixed(1)}` + (lastP != null ? ' ' + VizForms.util.noteName(lastP) : '');
      return info;
    },
    draw(ctx, S, a) {
      const D = Math.min(S.W, S.H)*(cfg.size ?? 0.92);
      ctx.globalAlpha = Math.min(1, a);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, (S.W - D)/2, (S.H - D)/2, D, D);
    },
  };
});
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  const f = n => { const k = (n + h*12) % 12, a = s*Math.min(l, 1 - l); return 255*(l - a*Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
  return [f(0), f(8), f(4)];
}
})();
