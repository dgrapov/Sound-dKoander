(() => {
const sm = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const GW = 64, GH = 64; let grid = new Uint8Array(GW * GH);
function draw(ctx, o) {
  const S = o.S || {}, t = o.t, { cx, cy, R } = o; if (o.d > 0.5) { window.ZSMirror = { n: 0, chain: 0 }; return; }
  const drums = (ZSInk.moments() || {}).drumsIn || 11.9, v1 = S['Verse 1'], tr = S['Travel'], v2 = S['Verse 2'], pre = S['Pre-Chorus'], hol = S['Hollow'];
  const ca = v1 == null ? 0 : sm(drums + 1, drums + 4, t) * (1 - sm(v1 - 1, v1 + 2, t)) * o.endFade; let nChain = 0;
  if (ca > 0.01) {
    const N = 5, adv = sm(drums + 1, v1 - 2, t) * 1.0; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip(); ctx.lineCap = 'round'; ctx.setLineDash([5, 6]);
    for (let k = 0; k < N; k++) { const f = Math.max(0, Math.min(1, adv * N - k)); if (f <= 0) break; nChain++; const u = k / (N - 1), x = -0.15 - 0.42 * Math.sin(u * 1.6), y = 0.78 - 1.5 * u, r = 0.2 + 0.12 * u;
      ctx.strokeStyle = 'rgba(255,205,120,' + (0.5 * ca * f).toFixed(3) + ')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx + x * R, cy - y * R, r * R * f, 0, 6.2832); ctx.stroke(); }
    ctx.restore();
  }
  const ga = (tr == null ? 0 : sm(tr, tr + 2, t) * (1 - sm(v2 - 2, v2, t))) + (pre == null || hol == null ? 0 : sm(pre, pre + 2, t) * (1 - sm(hol - 1, hol, t))); const A = Math.min(1, ga) * o.endFade;
  let nG = 0, duck = 0;
  if (A > 0.01) {
    const ag = ZSInk.agentsNow(); grid.fill(0);
    for (const a of ag) { const X = a[3], Y = a[4]; for (let i = Math.max(0, X.length - 40); i < X.length; i++) { const gx = Math.floor((X[i] * 0.5 + 0.5) * GW), gy = Math.floor((Y[i] * 0.5 + 0.5) * GH); if (gx >= 0 && gx < GW && gy >= 0 && gy < GH) grid[gy * GW + gx] = 1; } }
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const a of ag) {
      const al = sm(0, 1.3, a[5]) * (1 - sm(a[6] - 3, a[6], a[5])) * A; if (al < 0.02) continue; nG++;
      const X = a[3], Y = a[4], n = X.length, i0 = Math.max(0, n - 36);
      for (let i = i0 + 1; i < n; i++) {
        const mx = -X[i], my = Y[i], gx = Math.floor((mx * 0.5 + 0.5) * GW), gy = Math.floor((my * 0.5 + 0.5) * GH), occ = gx >= 0 && gx < GW && gy >= 0 && gy < GH && grid[gy * GW + gx];
        if (occ) duck++; const f = (i - i0) / (n - i0);
        ctx.strokeStyle = 'rgba(127,227,238,' + (al * 0.4 * f * (occ ? 0.35 : 1)).toFixed(3) + ')'; ctx.lineWidth = 0.8 + 2.2 * f;
        ctx.beginPath(); ctx.moveTo(cx - X[i - 1] * R, cy - Y[i - 1] * R); ctx.lineTo(cx + mx * R, cy - my * R); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(180,240,246,' + (al * 0.7).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(cx - a[1] * R, cy - a[2] * R, 5, 3.6, 0, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }
  window.ZSMirror = { n: nG, chain: nChain, duck };
}
function reg() { if (!window.ZSInk || !ZSInk.hooks) return setTimeout(reg, 100); ZSInk.hooks.push(draw); }
reg();
})();
