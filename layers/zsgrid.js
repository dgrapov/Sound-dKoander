(() => {
let lastNode = -1, lastLog = -99, f0 = 0;
function draw(ctx, o) {
  const S = o.S || {}, clx = S['Climax'], brg = S['Bridge']; if (clx == null || brg == null) return;
  const t = o.t, a = sm(clx, clx + 2.5, t) * (1 - sm(brg - 0.5, brg + 1.5, t)) * o.endFade * (o.d > 0.5 ? 0 : 1); window.ZSGrid = a;
  if (a < 0.01) { lastNode = -1; return; }
  const P = ZSInk.path(), prog = sm(clx + 5, brg - 3, t), m = prog * 90, i0 = Math.min(89, Math.floor(m)), fr = m - i0;
  const p = [P[i0][0] + (P[i0 + 1][0] - P[i0][0]) * fr, P[i0][1] + (P[i0 + 1][1] - P[i0][1]) * fr];
  const node = Math.floor(m / 90 * 13 + 0.5), near = Math.abs(m / 90 * 13 - node);
  if (near < 0.12 && node !== lastNode && prog > 0.01) { lastNode = node; f0 = t; if (t - lastLog > 2) { lastLog = t; const C = window.__tybConsoles || []; if (C[1]) C[1].out(`!! grid fold: the traveller is at node ${node + 1} (a zero); the bend swells and settles   ; a drawing choice`, 'wn'); } }
  const swell = Math.exp(-(t - f0) / 0.9) * (f0 > 0 ? 1 : 0), cm = (0.55 + 0.45 * swell) * (0.8 + 0.4 * o.rx.low), th = 6.2832 * prog * 1.5 + t * 0.05;
  const cr = cm * Math.cos(th), ci = cm * Math.sin(th);
  const map = (x, y) => { const dx = x - p[0], dy = y - p[1], sx = dx * dx - dy * dy, sy = 2 * dx * dy; return [x + cr * sx - ci * sy, y + cr * sy + ci * sx]; };
  const { cx, cy, R } = o;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip(); ctx.lineCap = 'round';
  const N = 9;
  for (let pass = 0; pass < 2; pass++) for (let k = -N; k <= N; k++) {
    const u = k / N * 1.1; ctx.strokeStyle = pass ? 'rgba(255,205,120,' + (0.22 * a).toFixed(3) + ')' : 'rgba(244,236,218,' + (0.26 * a).toFixed(3) + ')'; ctx.lineWidth = k === 0 ? 1.8 : 1.1; ctx.beginPath();
    for (let j = 0; j <= 60; j++) { const v = -1.1 + 2.2 * j / 60, q = map(pass ? v : u, pass ? u : v); const X = cx + q[0] * R, Y = cy - q[1] * R; j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(236,70,40,' + (0.9 * a).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(cx + p[0] * R, cy - p[1] * R, 4, 0, 6.2832); ctx.fill();
  ctx.restore();
}
const sm = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
function reg() { if (!window.ZSInk || !ZSInk.hooks) return setTimeout(reg, 100); ZSInk.hooks.push(draw); }
reg();
})();
