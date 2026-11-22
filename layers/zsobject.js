(() => {
if (window.__zsobjLoaded) return; window.__zsobjLoaded = 1;
const N = 1400, TAU = Math.PI * 2, RAT = 1.5597;
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x, sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); }, lerp = (a, b, k) => a + (b - a) * k;
const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + clamp(a).toFixed(3) + ')';
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const SH = [
  { id: 'line', img: 'the line, Re = 1/2', f: (s) => [0.03 * Math.sin(s * 90), 1 - 2 * s, 0.03 * Math.cos(s * 70)] },
  { id: 'pullback', img: 'pull-back onto a circle', f: (s) => { const th = TAU * 7 * s, r = 0.34 + 0.66 * Math.exp(-4.5 * s); return [r * Math.cos(th), r * Math.sin(th), 0.1 * Math.sin(th * 0.5)]; } },
  { id: 'tunnel', img: 'the ring tunnel (image 1)', f: (s) => { const th = TAU * 14 * s, r = 0.95 * Math.pow(1 / RAT, s * 6); return [r * Math.cos(th), r * Math.sin(th), 1.7 * s - 0.85]; } },
  { id: 'twist', img: 'the half-twisted strip (images 2, 4)', f: (s) => { const u = TAU * 2 * s, w = 0.3; return [(0.62 + w * Math.cos(u / 2)) * Math.cos(u), (0.62 + w * Math.cos(u / 2)) * Math.sin(u), w * Math.sin(u / 2)]; } },
  { id: 'levels', img: 'nested levels (image 7)', f: (s) => { const u = TAU * s, rr = 0.58 + 0.3 * Math.cos(9 * u); return [rr * Math.cos(2 * u), rr * Math.sin(2 * u), 0.3 * Math.sin(9 * u)]; } },
  { id: 'tree', img: 'many branches, one survivor (image 3)', f: null },
  { id: 'eye', img: "the beholder's eye (images 6, 8)", f: (s) => { if (s < 0.38) { const q = s / 0.38, th = TAU * q; return [0.95 * Math.cos(th), 0.46 * Math.sin(th) * (1 - 0.25 * Math.cos(th) * Math.cos(th)) * 1.05, 0]; } const q = (s - 0.38) / 0.62, th = TAU * 7 * q, r = 0.4 * (1 - 0.88 * q); return [r * Math.cos(th), r * Math.sin(th), 0.04 * Math.sin(q * 30)]; } },
  { id: 'whitehole', img: 'out the white hole (image 9)', f: (s) => { const K = 28, i = Math.min(K - 1, Math.floor(s * K)), q = s * K - i, tri = 1 - Math.abs(2 * q - 1), L = 0.55 + 0.45 * hash(i, 3), th = TAU * i / K + 0.9 * tri * L; return [L * tri * Math.cos(th), L * tri * Math.sin(th), 0.25 * (hash(i, 9) - 0.5) * tri]; } },
  { id: 'seed', img: 'the seed', f: (s) => { const th = TAU * 5 * s; return [0.05 * Math.cos(th), 0.05 * Math.sin(th), 0.05 * Math.sin(th * 1.3)]; } },
];
(function () {
  const pts = []; const walk = (x, y, ang, len, d) => { if (d > 6) return; const x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len; const seg = 6 + (6 - d) * 2; for (let i = 1; i <= seg; i++) pts.push([lerp(x, x2, i / seg), lerp(y, y2, i / seg), 0.06 * d * (hash(d, x * 9) - 0.5)]);
    walk(x2, y2, ang - 0.46 - 0.22 * hash(d, x2 * 5), len * 0.74, d + 1); walk(x2, y2, ang + 0.4 + 0.22 * hash(d, y2 * 5), len * 0.76, d + 1); for (let i = seg - 1; i >= 0; i--) pts.push([lerp(x, x2, i / seg), lerp(y, y2, i / seg), 0.06 * d * (hash(d, x * 9) - 0.5)]); };
  pts.push([0, 1, 0]); walk(0, 1, 0, 0.42, 0);
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  let ymin = 9, ymax = -9; pts.forEach((p) => { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }); const cy = (ymin + ymax) / 2, k = 1.9 / (ymax - ymin);
  SH[5].f = (s) => { const L = s * cum[cum.length - 1]; let lo = 0, hi = cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < L) lo = m; else hi = m; } const q = (L - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]), a = pts[lo], b = pts[hi]; return [-lerp(a[0], b[0], q) * k, -(lerp(a[1], b[1], q) - cy) * k, lerp(a[2], b[2], q)]; };
})();
const SHAPES = SH.map((sh) => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const p = sh.f(i / (N - 1)); a[i * 3] = p[0]; a[i * 3 + 1] = p[1]; a[i * 3 + 2] = p[2]; } return a; });
const PH = [['Intro', 0], ['Verse 1', 1], ['Travel', 2], ['Verse 2', 3], ['Pre-Chorus', 4], ['Rise', 5], ['Climax', 5], ['Bridge', 6], ['Final Chorus', 7], ['Outro', 8]];
let ph = 0, lastT = -1; const cur = new Float32Array(N * 3), stats = { phase: '', shape: '', alpha: 0, scale: 0, ms: 0 }; let lastPhase = -1, T = null, srcPack = null;
function table(pack) { const S = {}; (pack.sections || []).forEach((s) => { S[s.name] = s.start; }); return PH.map(([n, k]) => ({ n, k, t: S[n] ?? 0 })).filter((p, i) => i === 0 || p.t > 0).sort((a, b) => a.t - b.t); }
function say(i, t) { const P = T[i], sh = SH[P.k], C = window.__tybConsoles || []; if (!C[1] || !C[2]) return; if (P.n === 'Climax') return;
  C[1].out(`!! story object: phase ${i + 1} · ${sh.id} · ${sh.img}   ; impact: one strand, kept faint, only turns into the next form`, 'wn');
  C[2].out(`The strand in the middle is the story board, told as one object: now ${sh.img}. I keep it at about a fifth of full strength on purpose, a seed under the picture. It adds no light and never covers a lyric.`, 'mn'); }
window.ZSObj = { stats: () => stats, shapes: SH.map((s) => s.id) };
function draw(ctx, g) {
  const C = window.LVC, pack = C.pack(); if (!pack) return; if (pack !== srcPack || !T) { srcPack = pack; T = table(pack); lastPhase = -1; }
  const t = g.t, t0 = performance.now(); let i = 0; for (let j = 0; j < T.length; j++) if (T[j].t <= t) i = j;
  if (i !== lastPhase) { if (lastPhase >= 0 && i > lastPhase) say(i, t); lastPhase = i; }
  const P = T[i], Pp = T[Math.max(0, i - 1)], e = i === 0 ? 1 : sm(P.t, P.t + 7, t), next = T[Math.min(T.length - 1, i + 1)], nextE = i + 1 < T.length ? sm(next.t - 9, next.t, t) : 0;
  const A = SHAPES[Pp.k], B = SHAPES[P.k], Nx = SHAPES[next.k];
  for (let n = 0; n < N * 3; n++) cur[n] = lerp(A[n], B[n], e);
  const rx = g.rx || { low: 0, mid: 0, high: 0, hit: 0 }; ph += lastT < 0 || t < lastT ? 0 : Math.min(0.1, t - lastT) * 0.075 * (1 + 3 * rx.mid); lastT = t;
  const hollow = g.D.hollowA <= t && t < g.D.back, scale = g.R * 0.74 * (1 + 0.1 * rx.low + 0.05 * rx.hit) * (1 - sm(g.D.hollowA, g.D.hollowA + 1.2, t) * (t < g.D.back ? 1 : 0)) * (t >= g.D.back ? sm(g.D.back + 0.5, g.D.back + 4, t) : 1) * (P.k === 8 ? 1 - 0.8 * sm(P.t, P.t + 14, t) : 1);
  const alpha = (0.24 + 0.08 * g.perc + 0.1 * rx.hit) * g.endFade * (1 - g.d) * (t < 3 ? sm(0, 3, t) : 1);
  stats.phase = i + 1; stats.shape = SH[P.k].id; stats.alpha = +alpha.toFixed(2); stats.scale = +(scale / g.R).toFixed(2);
  if (alpha < 0.005 || scale < 2) { stats.ms = 0; return; }
  const ry = ph + 0.6, tlt = 0.38 * Math.sin(t * 0.031), cyy = Math.cos(ry), sy = Math.sin(ry), cx_ = Math.cos(tlt), sx = Math.sin(tlt), cxo = g.cx, cyo = g.cy;
  const pop = g.line ? Math.exp(-(t - g.line.start) / 0.9) * 0.14 : 0;
  const proj = (arr, n, wob) => { let x = arr[n * 3], y = arr[n * 3 + 1], z = arr[n * 3 + 2]; const s = n / (N - 1); x += wob * Math.sin(s * 31 + t * 0.9); y += wob * Math.cos(s * 27 + t * 0.7);
    const x1 = x * cyy + z * sy, z1 = -x * sy + z * cyy, y1 = y * cx_ - z1 * sx, z2 = y * sx + z1 * cx_, f = 1 / (1 + 0.28 * z2); return [cxo + x1 * f * scale, cyo + y1 * f * scale, z2]; };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const draws = (arr, a0, wscale) => { const CH = 46, step = Math.ceil(N / CH);
    for (let c = 0; c < CH; c++) { const n0 = c * step, n1 = Math.min(N - 1, n0 + step); if (n0 >= n1) break; const ps = []; let zs = 0; for (let n = n0; n <= n1; n += 2) { const p = proj(arr, n, 0.012 * (1 + 2 * g.perc + 4 * rx.high)); ps.push(p); zs += p[2]; } zs /= ps.length;
      const near = clamp(0.55 - zs * 0.5), dry = hash(c, Math.floor(t / 9)) < 0.28 ? [6 + 8 * hash(c, 4), 3 + 6 * hash(c, 6)] : null, al = a0 * (0.45 + near * 0.9) * (0.7 + 0.3 * Math.sin(t * (0.6 + hash(c, 1)) + c));
      ctx.setLineDash(dry || []); ctx.beginPath(); ps.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = rgba(g.ink, al * 0.35); ctx.lineWidth = (6 + 3 * g.perc + 4 * rx.low) * wscale * (0.7 + near * 0.6); ctx.stroke();
      ctx.strokeStyle = rgba(g.ink, al); ctx.lineWidth = 1.3 * wscale * (0.7 + near * 0.8); ctx.stroke(); } ctx.setLineDash([]); };
  draws(cur, alpha + pop, 1);
  if (nextE > 0.01 && next.k !== P.k) draws(Nx, 0.07 * nextE * g.endFade * (1 - g.d), 0.8);
  ctx.restore(); stats.ms = +(performance.now() - t0).toFixed(1);
}
function reg() { if (!window.ZSInk || !ZSInk.hooks) return setTimeout(reg, 100); ZSInk.hooks.push(draw); }
reg();
})();
