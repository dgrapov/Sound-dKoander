(() => {
if (window.__zsinkLoaded) return; window.__zsinkLoaded = 1;
const ID = 'waited-zeta-stranger', PK = 'livevis:zs:look';
const RAT = 1.5597, LN = Math.log(RAT), TAU = Math.PI * 2, DT = 1 / 30, TRAIL = 540;
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x, sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); }, lerp = (a, b, k) => a + (b - a) * k;
const mix = (A, B, k) => [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)];
const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + clamp(a).toFixed(3) + ')';
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PAPER = hex('#f4efe4'), DARK = hex('#0a0913'), CREAM = hex('#f4e9c8'), VERM = hex('#c8442b'), LAMP = hex('#ffd27a'), TEAL = hex('#5DCAA5'), CORAL = hex('#F0997B'), SAND = hex('#c9b48a'), DAWN = hex('#f0c4ad'), DAWN2 = hex('#9fcfcb');
const INKS = { minor: hex('#3a2736'), home: hex('#2b2d4a'), lift: hex('#4a3a22'), resolve: hex('#2b2d4a') };
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const angd = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };   // a - b wrapped

const PG = 'livevis:zs:ground', BONE = { minor: hex('#d6aa96'), home: hex('#e8e2d0'), lift: hex('#f0d696'), resolve: hex('#ece6d6') };
let look = 'B';
let ground = 'dark', DK = true, tintInit = false, gbtn, msAvg = 0;
let cv, ctx, btn, grain, W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 1;
let D = null, srcTiming = null, srcPack = null;
const G = 96, pher = new Float32Array(G * G);
let agents = [], simT = 0, lastT = -1, bi = 0, acc = 0, nextId = 1;
const RX = { low: 0, mid: 0, high: 0, lvl: 0, hit: 0, prevF: 0, pv: [0, 0, 0], edge: [0, 0, 0], spec: new Float32Array(32) };
let priming = false, ringsNow = [], lastBk = null, tunPh = 0, lastTT = -1;
let tint = INKS.home.slice(), perc = 0, stats = { rings: 0, agents: 0, trailPts: 0, verm: 0, dark: 0, flash: 0, level: 0, sched: '' };

function derive(timing, pack) {
  const ev = timing.events || {}, L = timing.lines || [], S = {}; (pack.sections || []).forEach((s) => { S[s.name] = s.start; });
  const find = (re) => L.find((l) => re.test(String(l.text)));
  const stranger = find(/stranger came in/i), allthings = find(/all things, he said/i), always = find(/line was always there/i), question = find(/or do we/i);
  const sung = L.filter((l) => !/^\(instrumental\)/i.test(String(l.text)) && l.start != null);
  const d = { S, ev, sung, beats: (timing.beats || []).slice(),
    drumsIn: ev.drums_in ?? 11.9, gap2a: ev.drums_gap_2 ?? 20, gap2b: ev.drums_back_2 ?? 23, hollowA: ev.hollow_start ?? 127.4, back: ev.drums_return ?? 132.5, fadeA: ev.fade_start ?? 244.5, sil: ev.silence ?? 246.8,
    tLamp: (stranger ? stranger.start : 87) + 1, tDown: allthings ? allthings.start : 99.7, tAlways: always ? always.start : 212, tQ: question ? question.start : 229 };
  d.preStarts = sung.filter((l) => l.start >= (S['Pre-Chorus'] || 112.8) && l.start < d.hollowA).map((l) => l.start);
  const n = Math.ceil(262 / 0.05); d.sig = new Float32Array(n + 1); let s = 0;
  for (let i = 0; i <= n; i++) { const t = i * 0.05; const rate = ((t >= d.hollowA && t < d.back) || t >= d.fadeA) ? 0 : 0.02; s += rate * 0.05; let add = 0; for (const l of sung) add += sm(l.start, l.start + 1.8, t); d.sig[i] = s + LN * add; }
  return d;
}
const sigma = (t) => { const f = clamp(t, 0, 262) / 0.05, i = f | 0, k = f - i; return lerp(D.sig[i], D.sig[Math.min(i + 1, D.sig.length - 1)], k); };

function sched(t) {
  const S = D.S, P = { rate: 0, origin: 'rim', swirl: 0.45, speed: 1, attract: null, aw: 0 };
  if (t < D.drumsIn) return P;
  P.rate = 0.35; P.swirl = 0.6;
  if (t >= (S['Verse 1'] ?? 39.5)) P.rate = 0;                                                                   // verse 1: the primes
  if (t >= (S['Travel'] ?? 67.5)) { P.rate = 0.9; P.swirl = 1; P.speed = 1.15; }                                  // travel: swirls come alive
  if (t >= (S['Verse 2'] ?? 86.5)) P.rate = 0;                                                                   // verse 2: the ledger in the lamp's light
  if (t >= (S['Pre-Chorus'] ?? 112.8)) { P.rate = 1; P.attract = 'dot'; P.aw = 0.5; P.swirl = 0.8; }               // pre-chorus: closer, they gather toward the beholder
  if (t >= D.hollowA) { P.rate = 0; P.attract = null; }
  if (t >= D.back) P.rate = 0;                                                                                   // rise and chorus 1: cymatics
  if (t >= (S['Climax'] ?? 156.8)) { P.rate = 0.85; P.attract = null; P.swirl = 1.2; P.speed = 1.3; }
  if (t >= (S['Bridge'] ?? 187.5)) { P.rate = 0; P.swirl = 0.5; P.speed = 0.9; }
  if (t >= D.fadeA) P.rate = 0;
  if (t >= D.gap2a && t < D.gap2b) { P.rate = 0; P.speed *= 0.35; }
  return P;
}
const lampPos = (t) => { const p = sm(D.tLamp, D.tDown, t); return [lerp(-1.06, 0.34, p), lerp(-0.25, -0.12, p) + 0.06 * Math.sin(p * Math.PI) + (p < 1 && p > 0 ? 0.012 * Math.sin(t * 3.1) : 0)]; };

const VORT = [{ x: -0.45, y: 0.25, s: 1.0, w: 0.11, p: 0.3 }, { x: 0.5, y: -0.2, s: -0.9, w: 0.09, p: 2.1 }, { x: 0.05, y: -0.55, s: 0.8, w: 0.13, p: 4.0 }];
let vc = [];
function vortices(t) {
  vc.length = 0;
  for (const v of VORT) vc.push([v.x + 0.22 * Math.sin(t * v.w * 6 + v.p), v.y + 0.2 * Math.cos(t * v.w * 5 + v.p * 2), v.s]);
  if (t >= D.tLamp && t < D.hollowA) { const l = lampPos(t); vc.push([l[0], l[1], -1.3]); }
}
function field(x, y, out) {
  let fx = 0, fy = 0;
  for (let i = 0; i < vc.length; i++) { const v = vc[i], dx = x - v[0], dy = y - v[1], k = v[2] / (1 + 6 * (dx * dx + dy * dy)); fx += -dy * k; fy += dx * k; }
  out[0] = fx; out[1] = fy;
}

const cell = (x, y) => { const gx = ((x + 1.15) / 2.3 * G) | 0, gy = ((y + 1.15) / 2.3 * G) | 0; return gx < 0 || gy < 0 || gx >= G || gy >= G ? -1 : gy * G + gx; };
const pget = (x, y) => { const c = cell(x, y); return c < 0 ? 0 : pher[c]; };
const F2 = [0, 0];
function spawn(t, P, beatIdx) {
  if (agents.filter((a) => a.alive).length >= 40) return;
  const r = rng(beatIdx * 977 + 13), a = { id: nextId++, rnd: rng(beatIdx * 31 + 7), alive: true, age: 0, life: 22 + r() * 14, tx: [], ty: [], born: t, hue: r(), kind: P.origin };
  if (P.origin === 'dot') { a.x = (r() - 0.5) * 0.06; a.y = 0.97; a.ang = -Math.PI / 2 + (r() - 0.5) * 2.2; }
  else { const th = r() * TAU; a.x = Math.cos(th) * 1.07; a.y = Math.sin(th) * 1.07; a.ang = th + Math.PI + (r() - 0.5) * 0.9; }
  a.tx.push(a.x); a.ty.push(a.y); agents.push(a);
}
function stepSim(ts) {
  const P = sched(ts); vortices(ts);
  while (bi < D.beats.length && D.beats[bi] <= ts) { if (D.beats[bi] > ts - 0.2 && P.rate > 0) { acc += P.rate; while (acc >= 1) { acc -= 1; spawn(ts, P, bi); } } bi++; }
  const wipe = ts >= D.hollowA && ts < D.hollowA + 1.2, bridge = ts >= (D.S['Bridge'] ?? 187.5) && ts < (D.S['Bridge'] ?? 187.5) + 4;
  for (const a of agents) {
    a.age += DT;
    if (a.alive && (a.age > a.life || wipe || (bridge && a.rnd() < 0.02) || ts >= D.fadeA)) a.alive = false;
    if (!a.alive) { const k = (ts >= D.hollowA && ts < D.back) || ts >= D.fadeA ? 14 : 3; a.tx.splice(0, k); a.ty.splice(0, k); continue; }
    const sa = 0.5, sd = 0.085, l = pget(a.x + Math.cos(a.ang - sa) * sd, a.y + Math.sin(a.ang - sa) * sd), m = pget(a.x + Math.cos(a.ang) * sd, a.y + Math.sin(a.ang) * sd), rr = pget(a.x + Math.cos(a.ang + sa) * sd, a.y + Math.sin(a.ang + sa) * sd);
    let turn = 0; if (m > l && m > rr) turn = 0; else if (m < l && m < rr) turn = (a.rnd() < 0.5 ? -1 : 1) * 0.05; else turn = l > rr ? -0.05 : 0.05;
    a.ang += turn + (a.rnd() - 0.5) * 0.03;
    field(a.x, a.y, F2); const fa = Math.atan2(F2[1], F2[0]); a.ang += clamp(angd(fa, a.ang), -0.07, 0.07) * P.swirl * 0.8;
    if (P.attract) {
      let tx = 0, ty = 0; if (P.attract === 'lamp') { const lp = lampPos(ts); tx = lp[0]; ty = lp[1]; } else if (P.attract === 'dot') { tx = 0; ty = 0.98; }
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), want = Math.atan2(dy, dx) + (d < 0.32 ? Math.PI / 2 : 0); a.ang += clamp(angd(want, a.ang), -0.05, 0.05) * P.aw;
    }
    const rad = Math.hypot(a.x, a.y); if (rad > 0.99 && a.age > 1.2) a.ang += clamp(angd(Math.atan2(-a.y, -a.x), a.ang), -0.12, 0.12) * 0.7;
    const sp = 0.24 * P.speed * (1 + 0.5 * perc) * (priming ? 1 : 0.9 + 0.5 * RX.lvl + 0.5 * RX.hit); a.x += Math.cos(a.ang) * sp * DT; a.y += Math.sin(a.ang) * sp * DT;
    const c = cell(a.x, a.y); if (c >= 0) pher[c] = Math.min(4, pher[c] + 0.35);
    a.tx.push(a.x); a.ty.push(a.y);
  }
  for (const a of agents) { const n = a.tx.length; for (let i = 0; i < n - 90; i += 2) { field(a.tx[i], a.ty[i], F2); a.tx[i] += F2[0] * 0.0006 * P.swirl; a.ty[i] += F2[1] * 0.0006 * P.swirl; } if (n > TRAIL) { a.tx.splice(0, n - TRAIL); a.ty.splice(0, n - TRAIL); } }
  agents = agents.filter((a) => a.alive || a.tx.length > 2);
  for (let i = 0; i < pher.length; i++) pher[i] *= 0.995;
}
function prime(t) {
  agents = []; pher.fill(0); acc = 0; simT = Math.max(0, t - 14);
  bi = 0; while (bi < D.beats.length && D.beats[bi] < simT) bi++;
  priming = true; while (simT + DT <= t) { simT += DT; stepSim(simT); } priming = false;
}


const PRIMES = (() => { const N = 1500, sv = new Uint8Array(N + 1), p = []; for (let i = 2; i <= N; i++) if (!sv[i]) { p.push(i); for (let j = i * i; j <= N; j += i) sv[j] = 1; } return p; })();
function drawRipples(t, a) { for (const rp of ripples) { const age = t - rp.t0, rr = age * 0.62 * R; if (rr > R) continue; for (let k = 0; k < 3; k++) { ctx.strokeStyle = rgba(prism(rp.h + k * 0.09, 0.7), 0.3 * rp.amp * a * (1 - age / 1.6) * (1 - k * 0.3)); ctx.lineWidth = 3 - k; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, rr - k * 6), 0, TAU); ctx.stroke(); } } }
function drawPrimes(t, ink, a) {
  if (a < 0.01) return; a *= 1 + 0.3 * RX.hit; if (DK) drawRipples(t, a); const v1 = D.S['Verse 1'] ?? 39.5, trv = D.S['Travel'] ?? 67.5, cnt = Math.floor(PRIMES.length * Math.pow(clamp((t - v1 - 1) / (trv - v1 - 6)), 1.15)), sc = R * 0.9 / Math.sqrt(1500); stats.primes = cnt;
  for (let i = 0; i < cnt; i++) {
    const n = PRIMES[i], r = Math.sqrt(n) * sc, th = TAU * Math.sqrt(n), px = cx + r * Math.cos(th), py = cy - r * Math.sin(th), fresh = clamp(1 - (cnt - i) / 10), big = i < 4, rg = ripGain(r / R, t), col = DK ? mix(ink, prism(0.55 + 0.5 * r / R + rg * 0.15 + t * 0.012, 0.72), clamp(0.12 + 0.7 * rg + 0.3 * RX.mid)) : ink;   // diffraction colour follows the spiral arm; the resonance wave passing through lights it
    if (fresh > 0.05 || rg > 0.1) { ctx.fillStyle = rgba(col, (0.09 * fresh + 0.22 * rg) * a); ctx.beginPath(); ctx.arc(px, py, 8 * fresh + 3 + 9 * rg, 0, TAU); ctx.fill(); }
    ctx.fillStyle = rgba(col, clamp(0.45 + 0.3 * fresh + 0.5 * rg + 0.3 * RX.low) * a); ctx.beginPath(); ctx.arc(px, py, (big ? 4.6 : 2 + 1.2 * fresh) * (1 + 0.9 * RX.low + 0.9 * rg), 0, TAU); ctx.fill();
  }
}
const LEAN = ['riemannZeta s = 0', '∀ s : ℂ', 's.re = 1 / 2', 's ≠ 1', '¬∃ n : ℕ, s = -2 * (n + 1)', 'theorem riemannHypothesis : RiemannHypothesis', 'DirichletCharacter.LFunction χ s ≠ 0', '1 / 2 < s.re', '0 < s.re → s.re < 1', 'χ.IsPrimitive', '∀ (N : ℕ) [NeZero N]', 'LFunction_eq_zero_re', 'LFunction_ne_zero_of_half_lt_re'];
const NCOL = 26, LEDGER = Array.from({ length: NCOL }, (_, i) => { const special = i % 9 === 4; return { u: (i + 0.5) / NCOL * 2 - 1, v: 34 + hash(i, 1) * 52, off: hash(i, 2) * 900, str: (special ? 's.re = 1 / 2   ' : LEAN[(i * 5 + 3) % LEAN.length] + '   '), special }; });
function drawLedger(t, ink, a, lamp) {
  a = clamp(a * (0.8 + 0.5 * RX.high + 0.25 * RX.hit), 0, 1.2);
  if (a < 0.01) return; const t0 = D.S['Verse 2'] ?? 86.5, act = Math.floor(NCOL * sm(t0, t0 + 18, t)), rowH = 17, len = 14, lx = cx + lamp[0] * R, ly = cy - lamp[1] * R; stats.ledger = act;
  ctx.font = '15px ui-monospace, Consolas, "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < act; i++) {
    const c = LEDGER[i], span = 2 * R + len * rowH, pos = (t * c.v + c.off), head = cy - R + (pos % span), step = Math.floor(pos / rowH), x = cx + c.u * R * 0.97, L = c.str.length;
    for (let j = 0; j < len; j++) {
      const y = head - j * rowH; if (y < cy - R - 6 || y > cy + R + 6) continue; const ch = c.str[((step - j) % L + L) % L]; if (ch === ' ') continue;
      const dl = Math.hypot(x - lx, y - ly) / (0.5 * R), lit = 0.3 + 0.7 * Math.exp(-dl * dl), al = Math.pow(1 - j / len, 1.1) * lit * a * (c.special ? 1.25 : 0.95);
      ctx.fillStyle = j === 0 ? rgba(DK ? [255, 214, 130] : [138, 90, 16], 0.95 * a * lit) : rgba(c.special ? mix(ink, DK ? [255, 200, 110] : [138, 90, 16], DK ? 0.55 : 0.35) : ink, al); ctx.fillText(ch, x, y);
    }
  }
}
const MODES = [[3, 5], [2, 6], [4, 7], [5, 8]], NG = 2600; let sand = null, sandT = -9;
const plate = (u, v, n, m) => Math.cos(n * Math.PI * u) * Math.cos(m * Math.PI * v) - Math.cos(m * Math.PI * u) * Math.cos(n * Math.PI * v);
function sandStep(tj, r) {
  const md = MODES[Math.floor(Math.max(0, tj - D.back) / 5) % MODES.length], amp = 0.05 * (0.5 + perc) * (1 + 3.5 * RX.hit + 1.5 * RX.low);
  for (let i = 0; i < NG; i++) { const u = sand[2 * i], v = sand[2 * i + 1], f = Math.abs(plate(u, v, md[0], md[1])); const nu = u + (r() - 0.5) * amp * f, nv = v + (r() - 0.5) * amp * f; if (nu * nu + nv * nv < 0.96) { sand[2 * i] = nu; sand[2 * i + 1] = nv; } }
}
function drawTunnel(t, ink, a, dt) {
  if (a < 0.01) { lastTT = -1; return; } tunPh += Math.min(0.1, dt) * (0.3 + 0.6 * RX.lvl + 1.0 * RX.hit); stats.tunnel = +a.toFixed(2); const LNZ = Math.log(6);
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const u = (tunPh + i / 6) % 1, z = Math.exp(u * LNZ), fade = a * Math.pow(1 - u, 0.8) * sm(0, 0.1, u);   // rings, spaced evenly in depth, rushing outward and past the edges
    const c = prism(0.55 + 0.4 * u + t * 0.01, 0.72); ctx.strokeStyle = rgba(c, 0.5 * fade * (0.6 + 0.6 * RX.lvl)); ctx.lineWidth = 1.5 + 5 * u * u + 3 * RX.hit; ctx.beginPath(); ctx.arc(cx, cy, R * z * 0.92, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(c, 0.12 * fade); ctx.lineWidth = 10 + 24 * u; ctx.stroke(); }
  if (lastBk) for (let i = 1; i <= 3; i++) { const u = (tunPh * 0.8 + i / 3.4) % 1, z = Math.exp(u * LNZ), fade = a * Math.pow(1 - u, 0.7) * sm(0, 0.12, u) * 0.85, sz = (1.6 + 1.6 * RX.mid) * (1 + z * 0.3);   // the plate's pattern, itself flying toward us
    for (let b = 0; b < lastBk.length; b++) { const c = b === 0 ? mix(ink, [255, 246, 226], 0.6) : mix(ink, prism(0.5 + 0.42 * (b / lastBk.length) + u * 0.2, 0.7), 0.35 + 0.4 * RX.lvl); ctx.fillStyle = rgba(c, (b === 0 ? 0.85 : 0.55) * fade); for (let q = 0; q < lastBk[b].length; q += 2) { const k = lastBk[b][q]; ctx.fillRect(cx + sand[2 * k] * R * z, cy - sand[2 * k + 1] * R * z, sz, sz); } } }
  ctx.restore();
}
function drawSand(t, ink, a) {
  if (a < 0.01) return; if (DK) drawRipples(t, a); const r = rng(Math.floor(t * 30) + 5);
  if (!sand || t < sandT - 0.05 || t > sandT + 1) { const r0 = rng(99); sand = new Float32Array(2 * NG); for (let i = 0; i < NG; i++) { const th = r0() * TAU, rr = Math.sqrt(r0()) * 0.96; sand[2 * i] = Math.cos(th) * rr; sand[2 * i + 1] = Math.sin(th) * rr; } const warm = Math.min(260, Math.floor((t - D.back) * 30)); for (let j = 0; j < warm; j++) sandStep(t - (warm - j) / 30, r0); }
  else { const n = clamp(Math.round((t - sandT) * 30), 1, 3) + (RX.hit > 0.5 ? 1 : 0); for (let j = 0; j < n; j++) sandStep(t, r); }
  sandT = t; lastBk = null; const mdD = MODES[Math.floor(Math.max(0, t - D.back) / 5) % MODES.length], sz = 1.5 + 1.8 * RX.mid + 1.2 * RX.hit, NB = 7, bk = Array.from({ length: NB }, () => []);
  for (let i = 0; i < NG; i++) { const u = sand[2 * i], v = sand[2 * i + 1], f = Math.abs(plate(u, v, mdD[0], mdD[1])), b = Math.min(NB - 1, (clamp(f * 1.2) * NB) | 0); bk[b].push(i); }
  lastBk = bk;
  for (let b = 0; b < NB; b++) { const hue = 0.5 + 0.42 * (b / NB) + (t * 0.01), c = DK ? (b === 0 ? mix(ink, [255, 246, 226], 0.6) : mix(ink, prism(hue, 0.7), 0.2 + 0.6 * Math.min(1, RX.lvl + 0.4 * RX.hit))) : ink; ctx.fillStyle = rgba(c, (b === 0 ? 0.9 : 0.62) * a * (0.75 + 0.5 * RX.lvl + 0.4 * RX.hit)); const s2 = b === 0 ? sz * 1.2 : sz; for (const i of bk[b]) ctx.fillRect(cx + sand[2 * i] * R, cy - sand[2 * i + 1] * R, s2, s2); }
  stats.sand = MODES[Math.floor(Math.max(0, t - D.back) / 5) % MODES.length].join(':');
}

function brushCircle(x, y, rad, w, wet, k, t, col, alpha, dash) {
  const n = clamp(rad * 0.9 | 0, 80, 240), seg = 8, oa = 0.02 * (0.35 + RX.lvl + 0.4 * RX.hit); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pul = 0.5 + 0.5 * Math.sin(t * (0.3 + 0.25 * hash(k, 3)) + hash(k, 9) * TAU), pw = (0.7 + 0.6 * pul * pul) * (1 + 1.0 * RX.low + 0.6 * RX.hit); alpha *= 0.55 + 0.9 * RX.lvl + 0.35 * RX.hit; col = mix(col, [255, 244, 220], 0.45 * RX.hit);        // each ring pulses at its own random time
  for (let pass = 0; pass < 2; pass++) {
    const ww = pass === 0 ? w * 2.6 : w, aa = pass === 0 ? alpha * 0.1 * (0.3 + wet) : alpha; if (aa < 0.004) continue;
    ctx.strokeStyle = rgba(col, aa); if (dash && pass === 1) ctx.setLineDash(dash); else ctx.setLineDash([]);
    for (let s = 0; s < seg; s++) {
      ctx.lineWidth = Math.max(0.5, ww * pw * (0.55 + 0.9 * hash(k * 13 + s, 1 + (t * 0.04 | 0))) * (pass === 1 ? 0.8 + 0.4 * wet : 1));
      ctx.beginPath();
      for (let i = 0; i <= n / seg + 1; i++) { const th = (s * (n / seg) + i) / n * TAU, rr = rad * (1 + 0.012 * Math.sin(3 * th + 0.35 * t + k * 1.7) + 0.008 * Math.sin(5 * th - 0.27 * t + k) + oa * scAt(th / TAU + k * 0.11)); const px = x + Math.cos(th) * rr, py = y + Math.sin(th) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}
function strokePts(xs, ys, from, to, col, a, w) {
  if (to - from < 2 || a < 0.004) return; ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w; ctx.beginPath();
  for (let i = from; i < to; i++) { const px = cx + xs[i] * R, py = cy - ys[i] * R; i === from ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke();
}
function drawTrail(a, t, ink, mul) {
  const n = a.tx.length; if (n < 3) return; const grow = sm(0, 1.3, a.age), segLen = 52, tiers = 5;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const rxw = 1 + 0.25 * RX.low + 0.2 * RX.hit;
  const col = mix(ink, DK ? [255, 255, 255] : DARK, 0.25 * a.hue);
  for (let i = 0; i < tiers; i++) {
    const to = n - i * segLen, from = Math.max(0, to - segLen - 1); if (to < 2) break;
    const age = i / tiers, base = (1 - age) ** 1.3 * mul * grow * 0.65, wet = i < 2 ? 1 : 0, pw = (0.8 + 0.4 * hash(a.id, i)) * rxw;
    if (wet) strokePts(a.tx, a.ty, from, to, col, base * 0.10, (10 - 3 * i) * pw);           // the wet bleed around the fresh stroke
    strokePts(a.tx, a.ty, from, to, col, base * (0.55 - 0.3 * age), (3.6 - 2.5 * age) * pw);
  }
}
function drawHead(a, t, ink, mul) {
  const n = a.tx.length; if (n < 3 || !a.alive) return; const al = sm(0, 1.3, a.age) * (1 - sm(a.life - 3, a.life, a.age)) * mul; if (al < 0.01) return;
  const px = cx + a.x * R, py = cy - a.y * R, tb = D.beats.length ? beatSince(t) : 1, pulse = Math.max(Math.exp(-tb / 0.25), RX.hit * 0.8), sc = 0.35 + 0.65 * sm(0, 1.3, a.age);
  const ang = a.ang, ox = -Math.sin(ang), oy = Math.cos(ang);
  if (a.age < 1.6) { ctx.strokeStyle = rgba(ink, 0.28 * (1 - a.age / 1.6)); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, 4 + a.age * 26, 0, TAU); ctx.stroke(); }        // the beat it was born from, as a ripple
  ctx.fillStyle = rgba(DK ? mix(ink, [255, 255, 255], 0.15) : mix(ink, DARK, 0.5), 0.9 * al); ctx.beginPath(); ctx.ellipse(px, py, (6.4 + 2.2 * pulse + 3 * RX.lvl) * sc, (4.6 + 1.6 * pulse + 2 * RX.lvl) * sc, ang, 0, TAU); ctx.fill();
  ctx.fillStyle = rgba(LAMP, (0.55 + 0.45 * pulse) * al); for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(px + Math.cos(ang) * 2.2 + ox * 2.4 * s, py + Math.sin(ang) * 2.2 + oy * 2.4 * s, 1.3 + 0.9 * pulse, 0, TAU); ctx.fill(); }
}
let lastBeatT = -9, lastBeatI = 0;
function beatSince(t) { const b = D.beats; if (!b.length) return 9; let i = lastBeatI; if (i >= b.length || b[i] > t) i = 0; while (i + 1 < b.length && b[i + 1] <= t) i++; lastBeatI = i; return Math.max(0, t - b[i]); }

const PATH = (() => { const p = []; for (let i = 0; i <= 90; i++) { const s = i / 90; p.push([0.16 * Math.sin(5 * s) * (1 - 0.35 * s), 0.985 - 1.9 * s]); } return p; })();
const PATH_CENTRE = 45;
function drawPath(prog, thick, alpha, upto) {
  stats.pathProg = prog; if (alpha < 0.01) return; const last = Math.min(PATH.length - 1, upto != null ? upto : PATH.length - 1), m = prog * last; if (m < 1) return; stats.verm++;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i <= Math.ceil(m); i++) {
      const f = Math.min(1, m - (i - 1)), a = PATH[i - 1], b = PATH[i], bx = lerp(a[0], b[0], f), by = lerp(a[1], b[1], f), s = i / PATH.length;
      ctx.strokeStyle = rgba(DK ? [236, 92, 62] : VERM, pass ? alpha * 0.95 : alpha * 0.14); ctx.lineWidth = (pass ? 1 : 3.2) * thick * (0.55 + 0.9 * Math.sin(Math.PI * Math.min(1, s * 1.1)) + 0.25 * hash(i, 4));
      ctx.beginPath(); ctx.moveTo(cx + a[0] * R, cy - a[1] * R); ctx.lineTo(cx + bx * R, cy - by * R); ctx.stroke();
    }
  }
}

let seamYaw = 0, seamIns = 0, seamPulse = 0;
function seamTurn(t, d, dt, pre, clx, brg, fin) {
  const hol = D.hollowA, back = D.back;
  let A = 0;
  if (t >= pre && t < hol) A = 0.12 + 0.1 * sm(pre, hol, t);
  else if (t >= clx && t < brg) A = 0.2;
  seamPulse = lerp(seamPulse, Math.min(1, RX.low * 0.6 + RX.hit * 0.8), 0.2);
  const ins = sm(brg + 1, brg + 9, t) * (1 - sm(fin - 1, fin + 5, t)) * (t >= brg && t < fin + 6 ? 1 : 0);
  let target = A * Math.sin(t * 0.12) * (0.55 + 0.9 * seamPulse); target = target * (1 - ins) + 1.38 * ins;
  if (d > 0.5) target = 0;
  const k = 1 - Math.exp(-(dt || 1 / 60) / 0.35); seamYaw += (target - seamYaw) * k; seamIns = lerp(seamIns, ins, 0.2);
  stats.yaw = +(seamYaw * 180 / Math.PI).toFixed(1); stats.inside = +seamIns.toFixed(2);
}
function layout() {
  W = innerWidth; H = innerHeight; DPR = Math.min(window.devicePixelRatio || 1, 1.5); cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  R = Math.min(W * 0.36, H * 0.34); cx = W / 2; cy = H * 0.40;
}
function ensure() {
  if (cv) return;
  cv = document.createElement('canvas'); cv.id = 'zsInk'; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:3;pointer-events:none'; document.body.appendChild(cv); ctx = cv.getContext('2d'); layout(); addEventListener('resize', layout);
  grain = document.createElement('canvas'); grain.width = grain.height = 160; const g = grain.getContext('2d'), im = g.createImageData(160, 160); for (let i = 0; i < im.data.length; i += 4) { const v = 90 + (Math.random() * 110) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0);
  const css = `body.zsB #hud,body.zsB #meters,body.zsB #dock,body.zsB #fx,body.zsB #tune,body.zsB #drop{z-index:6}
body.zsB #zsLyr{color:#2b2d4a;text-shadow:0 0 5px #f4efe4,0 0 14px #f4efe4,0 0 30px rgba(244,239,228,.9)}
body.zsB #zsLyr .w.on{color:#1d1f38}body.zsB #zsLyr .w.now{color:#8a5a10}body.zsB #zsLyr .echo{color:#2d7a66}body.zsB #zsLyr .mu{color:#1d1f38;text-shadow:0 0 22px rgba(255,176,32,.7)}
body.zsB.zsdark #zsLyr{color:#f4e9c8;text-shadow:0 1px 2px rgba(10,9,19,.95),0 0 18px rgba(10,9,19,.9)}body.zsB.zsdark #zsLyr .w.on{color:#fff7e6}body.zsB.zsdark #zsLyr .w.now{color:#ffd58a}
#zsLookBtn.on{color:#19e3ff}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const ctl = document.getElementById('controls');
  if (ctl) { /* no look/ground buttons: one look, dark ground */ }

}
function setGround(g) { return;  ground = g; DK = g === 'dark'; tintInit = false; try { localStorage.setItem(PG, g); } catch (e) {} if (gbtn) { gbtn.textContent = '◑ ground: ' + (DK ? 'dark' : 'paper'); } lastT = -1; }
function setLook(l) { return;  look = l; try { localStorage.setItem(PK, l); } catch (e) {} if (btn) { btn.textContent = '◐ look ' + l; btn.classList.toggle('on', l === 'B'); } lastT = -1; }
addEventListener('keydown', (e) => { const C = window.LVC; if (!C || !C.pack() || C.pack().id !== ID || e.code !== 'Backquote' || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return; if (e.shiftKey) setGround(DK ? 'paper' : 'dark'); else setLook(look === 'B' ? 'A' : 'B'); e.preventDefault(); }, true);

const hsl = (h, sat, l) => { h = ((h % 1) + 1) % 1; const f = (n) => { const k = (n + h * 12) % 12, a = sat * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0) * 255, f(8) * 255, f(4) * 255]; };
const prism = (h, l = 0.68) => hsl(h, 0.62, l);   // a soft spectrum: the colours of light split by a grating
const SC = new Float32Array(128), scBuf = new Float32Array(2048);   // the oscilloscope: one short, steady slice of the waveform (triggered on a rising zero crossing, like a scope)
function scopeRead() { const A = window.VizAudio; if (!(A && A.playing && A.playing() && A.timeL)) { for (let i = 0; i < 128; i++) SC[i] *= 0.9; return; }
  try { A.timeL(scBuf); } catch (e) { return; } let z = 1; while (z < 900 && !(scBuf[z - 1] < 0 && scBuf[z] >= 0)) z++; if (z >= 900) z = 1; for (let i = 0; i < 128; i++) SC[i] += (clamp(scBuf[z + i * 4] * 2.6, -1, 1) - SC[i]) * 0.6; }
const scAt = (u) => { const f = (((u % 1) + 1) % 1) * 128, i = f | 0, k = f - i; return lerp(SC[i], SC[(i + 1) % 128], k); };
const ripples = [];   // a resonance wave leaves the centre on every hit; primes and sand light up as it passes
function ripEmit(t) { if (RX.edge[0] || RX.edge[1]) { if (!ripples.length || t - ripples[ripples.length - 1].t0 > 0.3) ripples.push({ t0: t, amp: 0.5 + 0.5 * RX.lvl, h: (t * 0.07) % 1 }); } while (ripples.length && t - ripples[0].t0 > 1.6) ripples.shift(); }
const ripGain = (r01, t) => { let g = 0; for (const rp of ripples) { const rr = (t - rp.t0) * 0.62, d = (r01 - rr) / 0.09; g += rp.amp * Math.exp(-d * d) * (1 - (t - rp.t0) / 1.6); } return Math.min(1.5, g); };
function react(dt) {   // what the music is doing right now, read live from the analyser: bass, mids, highs, loudness, and a hit on every sudden rise
  const A = window.VizAudio; let lo = 0, mi = 0, hi = 0;
  if (A && A.playing && A.playing() && A.freq) { const f = A.freq, bw = A.sampleRate() / A.fftSize(), band = (a, b) => { let sum = 0, n = 0; for (let i = Math.max(1, Math.round(a / bw)); i <= Math.round(b / bw) && i < f.length; i++) { sum += f[i]; n++; } return n ? sum / n / 255 : 0; };
    lo = clamp((band(40, 200) - 0.6) / 0.38); mi = clamp((band(200, 2000) - 0.45) / 0.22); hi = clamp((band(2000, 8000) - 0.28) / 0.3); }   // floors and spans measured on this take: the master is loud, so only the part above the usual level counts
  const k = (v, x) => v + (x - v) * (x > v ? 0.5 : 0.12), prevF = RX.prevF; RX.low = k(RX.low, lo); RX.mid = k(RX.mid, mi); RX.high = k(RX.high, hi); RX.lvl = clamp(0.5 * RX.low + 0.3 * RX.mid + 0.2 * RX.high);
  const bv = [lo, mi, hi]; for (let i = 0; i < 3; i++) { RX.edge[i] = bv[i] - RX.pv[i] > (i === 2 ? 0.2 : 0.17) ? 1 : 0; RX.pv[i] += (bv[i] - RX.pv[i]) * 0.5; }
  if (A && A.playing && A.playing() && A.freq) { const f = A.freq, bw = A.sampleRate() / A.fftSize(); for (let j = 0; j < 32; j++) { const f0 = 60 * Math.pow(8000 / 60, j / 32), f1 = 60 * Math.pow(8000 / 60, (j + 1) / 32); let sum = 0, n = 0; for (let i = Math.max(1, Math.round(f0 / bw)); i <= Math.max(Math.round(f1 / bw), Math.round(f0 / bw)) && i < f.length; i++) { sum += f[i]; n++; } RX.spec[j] = clamp((sum / Math.max(1, n) / 255 - 0.25) / 0.6); } } else RX.spec.fill(0);
  const F = lo + 0.6 * mi; if (F - prevF > 0.13) RX.hit = 1; RX.hit *= Math.exp(-dt / 0.2); RX.prevF = prevF + (F - prevF) * 0.6; }
const waves = []; let sonarGlints = 0;
function emitWaves(t) {
  const alive = agents.filter((a) => a.alive && a.age > 0.3);
  for (const a of alive) { if (!a.sb) { a.sb = 1; a.lw = t; waves.push(mkWave(a, t, 0.55)); } }
  for (let b = 0; b < 3; b++) if (RX.edge[b]) for (const a of alive) if (a.id % 3 === b && t - (a.lw || 0) > 0.25) { a.lw = t; waves.push(mkWave(a, t, 0.5 + 0.5 * RX.lvl)); }
  while (waves.length > 90) waves.shift();
}
function mkWave(a, t, amp) { return { x: a.x, y: a.y, t0: t, amp, sp: Float32Array.from(RX.spec), band: a.id % 3 }; }
function drawWaves(t, ink, mul) {
  stats.waves = 0; sonarGlints = 0; if (mul < 0.01) { waves.length = 0; return; }
  const life = 2.0, speed = R * 0.34, live = [];
  for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i], age = t - w.t0; if (age > life || age < 0) { if (age > life || age < -1) waves.splice(i, 1); continue; } w.age = age; w.r = 4 + age * speed; w.px = cx + w.x * R; w.py = cy - w.y * R; w.al = (1 - age / life) * (1 - age / life) * w.amp * mul; live.push(w); }
  stats.waves = live.length; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); ctx.lineCap = 'round';
  for (const w of live) { const seg = 40; ctx.strokeStyle = rgba(ink, 0.5 * w.al); ctx.lineWidth = 1.1 + 1.2 * (1 - w.age / life); ctx.beginPath();
    for (let i = 0; i <= seg; i++) { const th = TAU * i / seg, q = Math.abs(((i / seg) * 2) % 2 - 1), j = q * 31, j0 = Math.floor(j), v = lerp(w.sp[j0], w.sp[Math.min(31, j0 + 1)], j - j0), rr = w.r * (1 + 0.16 * v * (1 - w.age / life)); const px = w.px + Math.cos(th) * rr, py = w.py + Math.sin(th) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); }
  const glint = DK ? [255, 240, 205] : DARK; let g = 0, vermG = 0;
  for (let i = 0; i < live.length && g < 140; i++) for (let j = i + 1; j < live.length && g < 140; j++) { const A = live[i], B = live[j], dx = B.px - A.px, dy = B.py - A.py, d = Math.hypot(dx, dy); if (d < 1 || d > A.r + B.r || d < Math.abs(A.r - B.r)) continue;
    const a2 = (A.r * A.r - B.r * B.r + d * d) / (2 * d), h2 = A.r * A.r - a2 * a2; if (h2 < 0) continue; const h = Math.sqrt(h2), mx = A.px + dx * a2 / d, my = A.py + dy * a2 / d, str = Math.min(A.al, B.al);
    if (str < 0.04) continue; for (const sg of [1, -1]) { const gx = mx + sg * h * dy / d, gy = my - sg * h * dx / d, tw = 0.6 + 0.4 * Math.sin(t * 17 + g * 2.3); let onRing = false; for (const rg of ringsNow) { if (Math.abs(Math.hypot(gx - cx, gy - (cy - rg.c * R)) - rg.rad * R) < 6) { onRing = true; break; } }
      if (onRing) { vermG++; ctx.fillStyle = rgba(DK ? [236, 92, 62] : VERM, clamp(str * 2 * tw + 0.15)); ctx.beginPath(); ctx.arc(gx, gy, 2.4 + 3.4 * str, 0, TAU); ctx.fill(); } else { ctx.fillStyle = rgba(glint, clamp(str * 1.3 * tw)); ctx.beginPath(); ctx.arc(gx, gy, 1.2 + 2.2 * str, 0, TAU); ctx.fill(); } g++; } }
  for (const A of live) for (const rg of ringsNow) { if (g >= 200) break; const bx = cx, by = cy - rg.c * R, br = rg.rad * R, dx = bx - A.px, dy = by - A.py, d = Math.hypot(dx, dy); if (d < 1 || d > A.r + br || d < Math.abs(A.r - br)) continue;
    const a2 = (A.r * A.r - br * br + d * d) / (2 * d), h2 = A.r * A.r - a2 * a2; if (h2 < 0) continue; const h = Math.sqrt(h2), mx = A.px + dx * a2 / d, my = A.py + dy * a2 / d, str = A.al; if (str < 0.05) continue;
    for (const sg of [1, -1]) { const gx = mx + sg * h * dy / d, gy = my - sg * h * dx / d, tw = 0.6 + 0.4 * Math.sin(t * 19 + g * 1.7); vermG++; ctx.fillStyle = rgba(DK ? [236, 92, 62] : VERM, clamp(str * 2 * tw + 0.15)); ctx.beginPath(); ctx.arc(gx, gy, 2.2 + 3 * str, 0, TAU); ctx.fill(); g++; } }
  sonarGlints = g; stats.glints = g; stats.vermGlints = vermG; ctx.restore();
}
const idb = () => new Promise((res, rej) => { try { const r = indexedDB.open('zsink', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
const songSave = (file) => idb().then((db) => { db.transaction('f', 'readwrite').objectStore('f').put(file, 'song'); }).catch(() => {});
const songLoad = () => idb().then((db) => new Promise((res) => { const q = db.transaction('f').objectStore('f').get('song'); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); })).catch(() => null);
let autoS = 0, songHook = 0;
function songKeep() {
  const inp = document.getElementById('file'); if (inp && !songHook) { songHook = 1; inp.addEventListener('change', (e) => { const C = window.LVC, f = inp.files && inp.files[0]; if (e.isTrusted && f && C && C.pack() && C.pack().id === ID) songSave(f); }); }
  const au = document.getElementById('audio'); if (autoS || !au || !inp) return; if (au.src && au.src !== location.href) { autoS = 1; return; }
  autoS = 1; songLoad().then((f) => { if (!f || (au.src && au.src !== location.href)) return; try { const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true })); const C = window.__tybConsoles || []; if (C[2]) C[2].out('The last song you loaded (' + f.name + ') came back by itself, so it does not have to be loaded again.', 'mn'); } catch (e) { console.error('zs song restore', e); } });
}
function frame0(info) {
  const C = window.LVC; if (!C) return; const t0ms = performance.now();
  const pack = C.pack(), mine = pack && pack.id === ID; ensure();
  if (btn) btn.style.display = mine ? '' : 'none'; if (gbtn) gbtn.style.display = mine && look === 'B' ? '' : 'none';
  if (mine) songKeep();
  if (mine && !wasMine) { try { if (window.TYBView && TYBView.mode() && TYBView.set) TYBView.set(0); ['dock', 'readout'].forEach((id) => { const e = document.getElementById(id); if (e) e.classList.remove('hidden'); }); document.body.classList.remove('tyb-zen', 'tyb-zen-all'); } catch (e) {} } wasMine = !!mine;
  { const S = window.TYBStage; if (S && W) { cx = S.x + S.w / 2; R = Math.min(S.w * 0.36, H * 0.34); } }
  const on = mine && look === 'B'; document.body.classList.toggle('zsB', !!on); cv.style.display = on ? '' : 'none'; if (!on) { lastT = -1; return; }
  if (mine && !autoT && (!C.timing() || !C.timing().lines) && window.ZS_TIMING) { autoT = 1; try { const inp = document.getElementById('timingFile'), dt = new DataTransfer(); dt.items.add(new File([JSON.stringify(window.ZS_TIMING)], 'zeta-birth.timing.json', { type: 'application/json' })); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { console.error('zs auto timing', e); } }
  const timing = C.timing(); if (!timing || !timing.lines) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = rgba(DK ? [8, 7, 17] : PAPER, 1); ctx.fillRect(0, 0, W, H); return; }
  if (timing !== srcTiming || pack !== srcPack || !D) { srcTiming = timing; srcPack = pack; D = derive(timing, pack); lastT = -1; }
  const t = info.t, hear = (window.VizHear && VizHear.at(ID, t)) || { perc: 0, gap: false, family: 'home' };
  perc = lerp(perc, hear.perc, 0.15); react(info.dt || 1 / 60); ripEmit(info.t); scopeRead(); stats.rx = [RX.low, RX.mid, RX.high, RX.lvl, RX.hit].map((v) => +v.toFixed(2)).join('/');
  if (lastT < 0 || Math.abs(t - lastT) > 0.6 || t < lastT - 0.05) prime(t); else while (simT + DT <= t) { simT += DT; stepSim(simT); }
  lastT = t;
  const tg = (DK ? BONE : INKS)[hear.family] || (DK ? BONE.home : INKS.home); tint = tintInit ? mix(tint, tg, 0.03) : tg.slice(); tintInit = true;
  const dHollow = sm(D.hollowA, D.hollowA + 0.9, t) * (t < D.back ? 1 : 0), dSil = sm(D.sil, D.sil + 0.1, t), d = Math.max(dHollow, dSil);
  document.body.classList.toggle('zsdark', DK || d > 0.5); stats.ground = ground;
  const gnd = mix(DK ? [8, 7, 17] : PAPER, DK ? [1, 1, 4] : DARK, d), ink = mix(tint, CREAM, d), endFade = 1 - sm(D.fadeA, D.sil, t) * (t >= D.sil ? 1 : 0.999);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = rgba(gnd, 1); ctx.fillRect(0, 0, W, H);
  stats.verm = 0; stats.dark = d; stats.pathProg = 0;
  const S = D.S, tt = t;
  const dawn = sm(D.back, D.back + 0.4, t) * (1 - sm(S['Climax'] ?? 156.8, (S['Climax'] ?? 156.8) + 6, t));
  if (dawn > 0.01) { const g = ctx.createRadialGradient(cx, cy - R, 4, cx, cy - R, R * 1.7); const dk2 = DK ? 0.5 : 1; g.addColorStop(0, rgba(CREAM, 0.95 * dawn * dk2)); g.addColorStop(0.18, rgba(DAWN, 0.6 * dawn * dk2)); g.addColorStop(0.6, rgba(DAWN2, 0.22 * dawn * dk2)); g.addColorStop(1, rgba(DAWN2, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  if (!DK && d < 0.5 && grain) { ctx.globalAlpha = 0.07 * (1 - d); ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  const sig = sigma(t), kc = Math.floor(sig / LN), ringsOn = sm(D.drumsIn, D.drumsIn + 3, t) * (t >= D.hollowA && t < D.back ? 0 : 1) * endFade * (t >= D.back ? sm(D.back, D.back + 0.2, t) : 1);
  const brg = S['Bridge'] ?? 187.5, fin = S['Final Chorus'] ?? 207.8, clx = S['Climax'] ?? 156.8, pre = S['Pre-Chorus'] ?? 112.8;
  const ringsMul = ringsOn * (t >= clx ? 0.5 * (t < brg ? 1 - sm(clx, clx + 2.5, t) : 1) : 1) * (1 - sm(brg + 1, brg + 3.5, t) * (t < fin ? 1 : 0)) * (t >= fin ? sm(fin, fin + 3, t) * 0.4 : 1);
  const rings = [];
  if (ringsMul > 0.01) for (let kk = kc - 9; kk <= kc + 9; kk++) { const Y = Math.pow(RAT, kk) * Math.exp(-sig); if (Y < 0.07 || Y > 14) continue; const tt2 = (Y - 1) / (Y + 1); rings.push({ k: kk, rad: (1 - tt2) / 2, c: (1 + tt2) / 2 }); }
  rings.sort((a, b) => b.rad - a.rad); stats.rings = rings.length; const mv = Math.max(0, (sigma(t) - sigma(t - 0.15)) / 0.15) * (t >= D.back || t < D.hollowA ? 1 : 0); ringsNow = rings; stats.moving = +mv.toFixed(3);
  const lv = t >= pre && t < D.hollowA ? 3 + 2 * D.preStarts.filter((s) => s <= t).length : 99, lvA = sm(pre, pre + 2, t) * (t < D.hollowA ? 1 : 0); stats.level = lv === 99 ? 0 : lv;
  seamTurn(t, d, info.dt, pre, clx, brg, fin); ctx.save(); ctx.translate(cx, cy); ctx.transform(Math.cos(seamYaw), 0.12 * Math.sin(seamYaw), 0, 1, 0, 0); ctx.translate(-cx, -cy);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  rings.forEach((r, i) => {
    const line = D.sung[r.k - 1], bump = line && t >= line.start ? Math.exp(-(t - line.start) / 1.3) : 0, wet = clamp(1 - r.rad / 0.55), w = (1.1 + r.rad * 4.2) * (1 + 0.5 * bump), edge = sm(0.05, 0.14, r.rad) * (1 - sm(0.92, 1, r.rad)) * (1 - 0.45 * clamp(Math.abs(Math.log(r.c > 0 ? (2 * r.rad > 0 ? (1 + (1 - 2 * r.rad)) / (1 - (1 - 2 * r.rad)) : 1) : 1)) / 2.6));
    let col = ink, dash = null, al = (0.5 + 0.35 * bump + 0.15 * perc) * ringsMul * edge * (1 - 0.35 * (1 - wet));
    if (lvA > 0.01) { if (i >= lv) al *= 1 - lvA; else if (i < 4) col = mix(ink, TEAL, lvA); else if (i < 6) { col = mix(ink, CORAL, lvA); dash = [10, 7]; } else { col = mix(ink, SAND, lvA); dash = [1.5, 6]; } }
    if (!dash && wet < 0.45) dash = [R * r.rad * (0.5 + 0.4 * hash(r.k, 2)), 3 + 9 * (0.45 - wet) * hash(r.k, 5)];            // dry brush: the bristles skip
    brushCircle(cx, cy - r.c * R, r.rad * R, w, wet, r.k, t, col, al, dash);
    if (mv > 0.004) for (let e = 1; e <= 5; e++) { const sE = sigma(t - 0.11 * e), YE = Math.pow(RAT, r.k) * Math.exp(-sE), tE = (YE - 1) / (YE + 1), rE = (1 - tE) / 2 * R, cE = (1 + tE) / 2 * R; if (rE < 2) continue;
      ctx.strokeStyle = rgba(col, al * 0.34 * (1 - e / 6) * clamp(mv * 14)); ctx.lineWidth = Math.max(0.8, w * (1 - e / 7)); ctx.beginPath(); ctx.arc(cx, cy - cE, rE, 0, TAU); ctx.stroke(); }
  });
  { const aLayer = (d > 0.5 ? 0 : 1) * endFade, v1 = S['Verse 1'] ?? 39.5, trv = S['Travel'] ?? 67.5, v2 = S['Verse 2'] ?? 86.5;
    stats.primes = 0; stats.ledger = 0; stats.sand = '';
    drawPrimes(t, ink, sm(v1, v1 + 2, t) * (1 - sm(trv - 1, trv + 2, t)) * aLayer);
    drawLedger(t, ink, sm(v2, v2 + 3, t) * (1 - sm(pre - 3, pre, t)) * aLayer, lampPos(t));
    drawSand(t, ink, sm(D.back + 0.3, D.back + 1.2, t) * (1 - sm(clx - 2, clx, t)) * aLayer); }
  ctx.restore();
  { const ch1 = S['Chorus 1'] ?? 142.5, aT = sm(D.back + 0.2, D.back + 2.5, t) * (1 - sm(ch1 - 1, ch1 + 3, t)) * (d > 0.5 ? 0 : 1) * endFade; drawTunnel(t, ink, aT, info.dt || 1 / 60); }
  { const ln = D.sung.filter((l) => l.start <= t).pop(); for (const h of hooks) { try { h(ctx, { t, cx, cy, R, ink, d, endFade, perc, S, yaw: seamYaw, rx: RX, D, line: ln && t - ln.start < 3 ? ln : null }); } catch (e) { console.error('zshook', e); } } }
  const spMul = endFade * (d > 0.5 ? 0 : 1), brgFade = 1 - sm(brg + 4, brg + 14, t) * (t < fin ? 1 : 0);
  stats.agents = agents.filter((a) => a.alive).length; stats.trailPts = 0;
  for (const a of agents) { stats.trailPts += a.tx.length; drawTrail(a, t, ink, spMul * (d > 0 ? 0 : 1)); }
  emitWaves(t); drawWaves(t, ink, spMul * (d > 0 ? 0 : 1)); for (const a of agents) drawHead(a, t, ink, spMul);
  const out = S['Outro'] ?? 222;
  if (t >= clx + 5 && t < brg + 3) drawPath(sm(clx + 5, brg - 3, t), 1.2, 0.95 * (1 - sm(brg, brg + 3, t)) * endFade);
  else if (t >= D.tAlways && t < out) { drawPath(1, 0.8, 0.55 * sm(D.tAlways, D.tAlways + 3, t) * endFade); for (let i = 0; i <= 13; i++) { const p = PATH[Math.round(i / 13 * 90)]; ctx.fillStyle = rgba(ink, 0.55 * sm(D.tAlways + i * 0.15, D.tAlways + i * 0.15 + 1.5, t) * endFade); ctx.beginPath(); ctx.arc(cx + p[0] * R, cy - p[1] * R, 3.2, 0, TAU); ctx.fill(); } }
  else if (t >= out && t < D.sil) { drawPath(sm(out, D.tQ, t), 1.7, 0.95 * endFade, PATH_CENTRE); if (t > D.tQ) { const e = sm(D.tQ, D.tQ + 6, t), p = PATH[PATH_CENTRE]; ctx.strokeStyle = rgba(ink, 0.4 * (1 - e) * endFade); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx + p[0] * R, cy - p[1] * R, 6 + 40 * e, 0, TAU); ctx.stroke(); } }
  if (t >= brg + 1 && t < fin + 1.5) {
    const a = sm(brg + 1, brg + 3, t) * (1 - sm(fin - 1, fin + 1.5, t)) * endFade, prog = sm(brg + 1.5, brg + 12, t) * 2, r0 = 0.46, rot = t * 0.03;
    for (let lap = 0; lap < 2; lap++) { const col = lap ? CORAL : TEAL, th0 = lap * TAU, span = clamp(prog - lap, 0, 1) * TAU; if (span < 0.02) continue; ctx.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) { ctx.strokeStyle = rgba(col, a * (pass ? 0.9 : 0.1)); ctx.lineWidth = pass ? 3.4 : 11; ctx.beginPath();
        for (let i = 0; i <= 80; i++) { const th = th0 + span * i / 80, rr = r0 * (1 + 0.1 * Math.cos(th / 2)), px = cx + Math.cos(th + rot) * rr * R, py = cy - ((1 - r0) + Math.sin(th + rot) * rr) * R; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); } }
  }
  if (t >= D.tLamp && t < D.sil) {
    const lp = lampPos(t), lx = cx + lp[0] * R, ly = cy - lp[1] * R, fl = 1 + 0.04 * Math.sin(t * 13) + 0.03 * Math.sin(t * 7.3), a = sm(D.tLamp, D.tLamp + 2, t) * endFade;
    const g = ctx.createRadialGradient(lx, ly, 1, lx, ly, R * 0.38 * fl * (1 + 0.25 * RX.lvl + 0.2 * RX.low)); g.addColorStop(0, rgba(LAMP, 0.95 * a)); g.addColorStop(0.3, rgba(LAMP, 0.38 * a)); g.addColorStop(1, rgba(LAMP, 0)); ctx.fillStyle = g; ctx.fillRect(lx - R * 0.5, ly - R * 0.5, R, R);
    ctx.fillStyle = rgba(mix(LAMP, [255, 250, 230], 0.5), a); ctx.beginPath(); ctx.ellipse(lx, ly, 3.2 * fl, 5.4 * fl, 0, 0, TAU); ctx.fill();
  }
  const bp = sm(0.5, 7, t); ctx.lineCap = 'round'; ctx.strokeStyle = rgba(ink, 0.8 * endFade); ctx.lineWidth = 2.2 * (1 + 0.8 * RX.low);
  if (bp > 0.001 && !(t >= D.sil)) { ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2 - Math.PI * bp, -Math.PI / 2 + Math.PI * bp); ctx.stroke(); ctx.strokeStyle = rgba(ink, 0.08); ctx.lineWidth = 7; ctx.stroke(); }
  const dr = (5.5 + 1.5 * perc + 3 * RX.hit) * (1 + (d > 0.5 ? 0.3 : 0)), dx = cx, dy = cy - R, gl = ctx.createRadialGradient(dx, dy, 1, dx, dy, dr * 4); gl.addColorStop(0, rgba(d > 0.5 ? CREAM : mix(ink, LAMP, 0.15), 0.35)); gl.addColorStop(1, rgba(ink, 0)); ctx.fillStyle = gl; ctx.fillRect(dx - dr * 4, dy - dr * 4, dr * 8, dr * 8);
  ctx.fillStyle = rgba(d > 0.5 ? CREAM : ink, 0.95 * sm(1, 2.5, t)); ctx.beginPath(); ctx.arc(dx, dy, dr, 0, TAU); ctx.fill();
  ctx.restore(); for (const h of post) { try { h(ctx, { t, cx, cy, R, ink, d, endFade, yaw: seamYaw, inside: seamIns, rx: RX }); } catch (e) { console.error('zs post', e); } }
  const fl = t >= D.back && t < D.back + 0.6 ? Math.exp(-(t - D.back) / 0.18) : 0; stats.flash = fl; if (fl > 0.01) { ctx.fillStyle = rgba(CREAM, (DK ? 0.5 : 0.8) * fl); ctx.fillRect(0, 0, W, H); }
  if (d < 0.5) { const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, rgba(ink, 0)); v.addColorStop(1, DK ? 'rgba(0,0,0,0.38)' : rgba(ink, 0.16 * (1 - d))); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
  stats.sched = JSON.stringify(sched(t)); msAvg = lerp(msAvg, performance.now() - t0ms, 0.05); stats.ms = +msAvg.toFixed(1);
}
const hooks = [], post = []; let errOnce = 0, wasMine = false, autoT = 0;
function frame(info) { try { frame0(info); } catch (e) { try { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = rgba(DK ? [8, 7, 17] : PAPER, 1); ctx.fillRect(0, 0, W, H); } catch (e2) {} try { ctx.fillStyle = '#ffb020'; ctx.font = '13px monospace'; ctx.fillText('Look B error: ' + (e && e.message), 16, H - 20); } catch (e3) {} if (errOnce++ < 3) { console.error('zsink frame', e); const C = window.__tybConsoles || []; if (C[2]) C[2].out('Look B hit an error and drew only the ground: ' + (e && e.message), 'wn'); } } }
window.ZSInk = { hooks, post, path: () => PATH, agentsNow: () => agents.filter((a) => a.alive && a.age > 1).map((a) => [a.id, a.x, a.y, a.tx, a.ty, a.age, a.life]), rx: () => RX, look: () => look, set: setLook, ground: () => ground, setGround, stats: () => stats, moments: () => D && { drumsIn: D.drumsIn, hollowA: D.hollowA, back: D.back, sil: D.sil, tLamp: D.tLamp, tDown: D.tDown } };
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame(frame); }
wire();
})();
