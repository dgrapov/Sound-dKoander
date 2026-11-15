// Sacred-geometry form layers (registered with VizForms in forms.js). Every figure is built from
// its own construction rule and grows in over the section; a form that continues into the next
// section keeps what it has built and grows further. Kicks pulse the lines.
//
// flower      Seed → Flower of Life on a hex lattice, ring by ring; with depth:2 every circle then grows
//             its own seed of life inside it (self-similar: a fractal flower). options: rings:1..3, depth:1|2
// metatron    the 13 Fruit-of-Life centres, then all 78 connecting lines (Metatron's Cube), then a
//             rotating 3D star tetrahedron (merkaba) inside it. options: merkaba:true
// crystal     a snowflake that grows like ice: one arm grows tip by tip, branching at 60°, branches
//             branch again (3 generations, a fractal), drawn with 6-fold mirror symmetry. Growth
//             speeds up with order and bursts on kicks. options: seed, size, rate
// phyllotaxis seeds placed at k·137.508° and r ∝ √k (Vogel's sunflower), added one by one.
//             options: seeds:900, fadeOut:true
(() => {
if (!window.VizForms) return;
const { clamp01, smooth, rng } = VizForms.util;
const TAU = Math.PI*2, SQ3 = Math.sqrt(3);
const gold = (S, l = 65, s = 90) => `${(S.palette.flame + 22 + S.hueShift)|0},${s}%,${l}%`;
const cyan = (S, l = 72, s = 70) => `${(S.palette.life + S.hueShift)|0},${s}%,${l}%`;

// grow-only progress: target from the section, never shrinks while the form lives
function grower() { let v = 0; return target => (v = Math.max(v, target)); }

// ---------------- flower ----------------
function hexCenters(rings) {
  const pts = [];
  for (let q = -rings; q <= rings; q++) for (let r = -rings; r <= rings; r++) {
    const s = -q - r, d = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
    if (d <= rings) pts.push({ x: q + r/2, y: r*SQ3/2, ring: d, ang: Math.atan2(r*SQ3/2, q + r/2) });
  }
  return pts.sort((a, b) => a.ring - b.ring || ((a.ang + TAU) % TAU) - ((b.ang + TAU) % TAU));
}
VizForms.register('flower', (cfg) => {
  let grow = grower(), rot = 0, pulse = 0;
  const all = hexCenters(3);
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const rings = cfg.rings || 2, depth = cfg.depth || 1;
      const count = all.filter(p => p.ring <= rings).length;
      const total = count + (depth > 1 ? count : 0) + 1;     // outer circles, inner flowers, the bounding circle
      this.b = grow(smooth(0, cfg.buildBy ?? 0.85, S.sectionT)*total);
      this.count = count; this.depth = depth; this.rings = rings;
      rot += S.dt*0.025; pulse = Math.max(pulse*Math.exp(-S.dt*5), S.kick ? 1 : 0);
      return `Flower of Life ${rings} ring${rings > 1 ? 's' : ''}` + (depth > 1 ? ' · fractal' : '');
    },
    draw(ctx, S, a) {
      const R = Math.min(S.W, S.H)*(cfg.size ?? 0.095)*(3/Math.max(3, (this.rings || 2) + 1))*1.25;
      const jit = (1 - S.order)*R*0.04;
      ctx.translate(S.W/2, S.H/2); ctx.rotate(rot);
      ctx.lineWidth = 1.2*S.DPR*(1 + 0.6*pulse);
      const b = this.b || 0, n = this.count || 0;
      ctx.strokeStyle = `hsla(${gold(S)},${(a*(0.55 + 0.35*pulse)).toFixed(3)})`;
      ctx.beginPath();
      for (let i = 0; i < n && i < b; i++) {
        const p = all[i], f = Math.min(1, b - i), x = p.x*R + (Math.random() - .5)*jit, y = p.y*R + (Math.random() - .5)*jit;
        ctx.moveTo(x + R, y); ctx.arc(x, y, R, 0, TAU*f);
      }
      ctx.stroke();
      // inner seed-of-life in every circle: the flower repeats inside itself
      if (this.depth > 1 && b > n) {
        const r = R/2;
        ctx.strokeStyle = `hsla(${cyan(S)},${(a*0.45).toFixed(3)})`; ctx.lineWidth = 0.8*S.DPR;
        ctx.beginPath();
        for (let i = 0; i < n && i < b - n; i++) {
          const p = all[i], f = Math.min(1, b - n - i), cx = p.x*R, cy = p.y*R;
          for (let k = 0; k < 7; k++) {
            const ox = k ? Math.cos(k*TAU/6 + rot*3)*r : 0, oy = k ? Math.sin(k*TAU/6 + rot*3)*r : 0;
            ctx.moveTo(cx + ox + r, cy + oy); ctx.arc(cx + ox, cy + oy, r, 0, TAU*f);
          }
        }
        ctx.stroke();
      }
      const fb = b - n*(this.depth > 1 ? 2 : 1);
      if (fb > 0) {
        ctx.strokeStyle = `hsla(${gold(S, 75)},${(a*0.7).toFixed(3)})`; ctx.lineWidth = 1.6*S.DPR;
        ctx.beginPath(); ctx.arc(0, 0, R*((this.rings || 2) + 1), -Math.PI/2, -Math.PI/2 + TAU*Math.min(1, fb)); ctx.stroke();
      }
    },
  };
});

// ---------------- metatron ----------------
const TETRA = [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
VizForms.register('metatron', (cfg) => {
  const C = [[0, 0]];
  for (let k = 0; k < 6; k++) C.push([Math.cos(k*TAU/6 + Math.PI/6)*2, Math.sin(k*TAU/6 + Math.PI/6)*2]);
  for (let k = 0; k < 6; k++) C.push([Math.cos(k*TAU/6 + Math.PI/6)*4, Math.sin(k*TAU/6 + Math.PI/6)*4]);
  const E = [];
  for (let i = 0; i < 13; i++) for (let j = i + 1; j < 13; j++) E.push([i, j, Math.hypot(C[i][0] - C[j][0], C[i][1] - C[j][1])]);
  E.sort((p, q) => p[2] - q[2]);
  let grow = grower(), rot = 0, spin = 0, pulse = 0;
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      this.b = grow(smooth(0, cfg.buildBy ?? 0.9, S.sectionT));
      rot += S.dt*0.02; spin += S.dt*(0.25 + 0.6*S.highs); pulse = Math.max(pulse*Math.exp(-S.dt*5), S.kick ? 1 : 0);
      return 'Metatron\'s Cube' + (this.b > 0.7 && cfg.merkaba !== false ? ' · merkaba' : '');
    },
    draw(ctx, S, a) {
      const R = Math.min(S.W, S.H)*(cfg.size ?? 0.085), b = this.b || 0;
      ctx.translate(S.W/2, S.H/2); ctx.rotate(rot);
      const cb = smooth(0, 0.3, b), nC = cb*13;
      ctx.strokeStyle = `hsla(${cyan(S)},${(a*0.5).toFixed(3)})`; ctx.lineWidth = S.DPR;
      ctx.beginPath();
      for (let i = 0; i < 13 && i < nC; i++) { const f = Math.min(1, nC - i), [x, y] = C[i]; ctx.moveTo(x*R + R, y*R); ctx.arc(x*R, y*R, R, 0, TAU*f); }
      ctx.stroke();
      const lb = smooth(0.3, 0.85, b)*E.length;
      ctx.strokeStyle = `hsla(${gold(S)},${(a*(0.45 + 0.4*pulse)).toFixed(3)})`; ctx.lineWidth = 1.1*S.DPR*(1 + 0.5*pulse);
      ctx.beginPath();
      for (let i = 0; i < E.length && i < lb; i++) {
        const [p, q] = E[i], f = Math.min(1, lb - i), [x1, y1] = C[p], [x2, y2] = C[q];
        ctx.moveTo(x1*R, y1*R); ctx.lineTo((x1 + (x2 - x1)*f)*R, (y1 + (y2 - y1)*f)*R);
      }
      ctx.stroke();
      const mb = cfg.merkaba === false ? 0 : smooth(0.7, 1, b);
      if (mb > 0.01) {                                 // star tetrahedron: two interlocked tetrahedra, rotating in 3D
        ctx.rotate(-rot);
        const s = R*2.3, cy = Math.cos(spin), sy = Math.sin(spin), cx = Math.cos(0.6), sx = Math.sin(0.6);
        const proj = v => { let [x, y, z] = v; [x, z] = [x*cy - z*sy, x*sy + z*cy]; [y, z] = [y*cx - z*sx, y*sx + z*cx]; const f = 1/(1 + z*0.12); return [x*s*f, y*s*f]; };
        for (const sign of [1, -1]) {
          const P = TETRA.map(v => proj(v.map(c => c*sign)));
          ctx.strokeStyle = sign > 0 ? `hsla(${gold(S, 75)},${(a*mb*0.8).toFixed(3)})` : `hsla(${cyan(S, 75)},${(a*mb*0.8).toFixed(3)})`;
          ctx.lineWidth = 1.5*S.DPR; ctx.beginPath();
          for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { ctx.moveTo(...P[i]); ctx.lineTo(...P[j]); }
          ctx.stroke();
        }
      }
    },
  };
});

// ---------------- crystal (fractal snowflake) ----------------
VizForms.register('crystal', (cfg, S0) => {
  const rand = rng(cfg.seed || 7);
  const tips = [{ x: 0, y: 0, a: 0, len: 0, max: 1, gen: 0, next: 0.07 + rand()*0.05, done: false }];
  let rot = 0, pulse = 0, grown = 0;
  function spawn(p, ang) {
    const ex = p.x + Math.cos(p.a)*p.len, ey = p.y + Math.sin(p.a)*p.len;
    const remain = p.max - p.len, env = p.gen === 0 ? (1 - p.len/p.max) : remain/p.max;
    const max = (p.gen === 0 ? 0.42 : 0.5)*env*(0.6 + 0.6*rand())*(p.gen === 0 ? 1 : p.max);
    if (max < 0.02 || tips.length >= 600) return;
    tips.push({ x: ex, y: ey, a: p.a + ang, len: 0, max, gen: p.gen + 1, next: max*(0.18 + rand()*0.2), done: false });
  }
  function grow(budget) {
    for (let i = 0; i < tips.length && i < 900; i++) {
      const p = tips[i]; if (p.done) continue;
      const sp = [1, 0.9, 0.75, 0.6][p.gen];
      p.len = Math.min(p.max, p.len + budget*sp*(p.gen ? 1.6 : 1));
      if (p.len >= p.next && p.gen < 3) {
        if (p.gen === 0) spawn(p, Math.PI/3);             // main arm: one side (the mirror makes the other)
        else { spawn(p, Math.PI/3); spawn(p, -Math.PI/3); }
        p.next += (p.gen === 0 ? 0.06 + rand()*0.07 : p.max*(0.2 + rand()*0.25));
      }
      if (p.len >= p.max) p.done = true;
    }
  }
  // seeking into the middle of a section: pre-grow what would already be there (~20 s per section)
  for (let i = 0, n = Math.floor(clamp01(S0.sectionT)*600); i < n; i++) grow((1/30)*(cfg.rate ?? 0.12)*(0.35 + S0.order));
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      grow(S.dt*(cfg.rate ?? 0.12)*(0.35 + S.order)*(1 + 4*S.kickEnv));
      grown = tips.length;
      rot += S.dt*0.015; pulse = Math.max(pulse*Math.exp(-S.dt*5), S.kick ? 1 : 0);
      return `crystal 6-fold · ${grown} branches`;
    },
    draw(ctx, S, a) {
      const R = Math.min(S.W, S.H)*(cfg.size ?? 0.4);
      ctx.translate(S.W/2, S.H/2); ctx.rotate(rot);
      ctx.lineCap = 'round';
      const passes = [[3.2, 0.12, 60], [1.1, 0.8, 88]];      // soft glow, then the bright ice line
      for (const [w, al, light] of passes) for (let g = 0; g < 4; g++) {
        ctx.strokeStyle = `hsla(${cyan(S, light, 60)},${(a*al*(1 + 0.5*pulse)/(1 + g*0.35)).toFixed(3)})`;
        ctx.lineWidth = w*S.DPR*[1.6, 1.1, 0.8, 0.6][g];
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const c = Math.cos(k*TAU/6), s = Math.sin(k*TAU/6);
          for (const m of [1, -1]) for (const p of tips) {
            if (p.gen !== g || p.len < 1e-3) continue;
            const x1 = p.x, y1 = p.y*m, x2 = p.x + Math.cos(p.a)*p.len, y2 = (p.y + Math.sin(p.a)*p.len)*m;
            ctx.moveTo((x1*c - y1*s)*R, (x1*s + y1*c)*R); ctx.lineTo((x2*c - y2*s)*R, (x2*s + y2*c)*R);
          }
        }
        ctx.stroke();
      }
      // hexagonal plate at the heart
      const hp = Math.min(1, grown/40)*R*0.08;
      ctx.strokeStyle = `hsla(${cyan(S, 85)},${(a*0.7).toFixed(3)})`; ctx.lineWidth = 1.2*S.DPR; ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const x = Math.cos(k*TAU/6)*hp, y = Math.sin(k*TAU/6)*hp; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    },
  };
});

// ---------------- phyllotaxis ----------------
VizForms.register('phyllotaxis', (cfg) => {
  let grow = grower(), rot = 0, ripple = -9;
  const GA = 137.508*Math.PI/180;
  return {
    reconfig(c) { cfg = c; },
    step(S) {
      const N = cfg.seeds || 900;
      this.n = Math.floor(grow(smooth(0, cfg.buildBy ?? 0.7, S.sectionT))*N);
      this.fade = cfg.fadeOut ? 1 - smooth(0.75, 1, S.sectionT) : 1;
      rot += S.dt*0.04; if (S.kick) ripple = S.t; this.rt = S.t - ripple;
      return `phyllotaxis ${this.n} seeds`;
    },
    draw(ctx, S, a) {
      const N = cfg.seeds || 900, n = this.n || 0, rmax = Math.min(S.W, S.H)*(cfg.size ?? 0.42), c = rmax/Math.sqrt(N);
      const A = a*this.fade; if (A < 0.01) return;
      ctx.translate(S.W/2, S.H/2); ctx.rotate(rot);
      const wave = this.rt < 1.5 ? this.rt*rmax*0.9 : -1e9;
      for (let k = 1; k <= n; k++) {
        const r = c*Math.sqrt(k), th = k*GA, x = Math.cos(th)*r, y = Math.sin(th)*r;
        const hit = Math.exp(-Math.pow((r - wave)/(rmax*0.06), 2));
        const hue = (S.palette.life + S.hueShift + (k % 21)*4)|0;
        ctx.fillStyle = `hsla(${hue},75%,${(60 + 25*hit)|0}%,${(A*(0.5 + 0.5*hit)).toFixed(3)})`;
        const sz = (0.8 + 1.6*k/N + hit)*S.DPR;
        ctx.beginPath(); ctx.arc(x, y, sz, 0, TAU); ctx.fill();
      }
    },
  };
});
})();
