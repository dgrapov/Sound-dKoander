(() => {
function draw(ctx, o) {
  const a = Math.max(0, (o.inside - 0.15) / 0.85) * o.endFade * (o.d > 0.5 ? 0 : 1); if (a < 0.01) return;
  const { cx, cy, R, t } = o, N = 14;
  ctx.save(); ctx.lineCap = 'round';
  for (let k = 0; k < N; k++) {
    const z = ((k + t * 0.28) % N) / N, u = 1 - (1 - z) * (1 - z), y = cy - R * (-0.9 + 1.885 * u), w = R * 0.62 * Math.pow(1 - z, 1.25), al = a * 0.38 * Math.pow(Math.sin(Math.PI * z), 0.8) * (1 + 0.5 * o.rx.low);
    ctx.lineWidth = 1 + 2.2 * (1 - z);
    ctx.strokeStyle = 'rgba(244,236,218,' + al.toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(cx - w, y); ctx.lineTo(cx - 3, y); ctx.stroke();
    ctx.strokeStyle = 'rgba(127,227,238,' + (al * 0.85).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(cx + 3, y); ctx.lineTo(cx + w, y); ctx.stroke();
  }
  ctx.restore();
}
function reg() { if (!window.ZSInk || !ZSInk.post) return setTimeout(reg, 100); ZSInk.post.push(draw); }
reg();
})();
