// teaser: the hook for the opening. On the beat, small round windows "materialize" glimpses of the song's later
// effects (flower of life, Metatron, Chladni sand, crystal, Julia, Faraday, phyllotaxis, Halley), each a cropped,
// feathered piece of the real form layer, flashing in on the beat and fading over ~2.5 s. Like a trailer for the video.
//   pack: forms:[{ type:'teaser', from:29.6, every:2, slowAt:41.36, slowEvery:4, stopBefore:2, r:[.13,.2], life:2.6 }]
//   from: song time the glimpses start · every: beats between glimpses · slowAt/slowEvery: sparser once singing starts
//   stopBefore: seconds before the section ends to stop spawning · r: window radius range (× screen height)
(() => {
if (!window.VizForms) return;
const { clamp01, rng } = VizForms.util;
const KINDS = [
  { type:'flower',      cfg:{ rings:2 } },
  { type:'julia',       cfg:{ size:0.9 } },
  { type:'chladni',     cfg:{ plate:'circle', mode:'pitch' } },
  { type:'metatron',    cfg:{ merkaba:true } },
  { type:'faraday',     cfg:{ waves:[6, 8, 10], golden:true } },
  { type:'crystal',     cfg:{ seed:7 } },
  { type:'halley',      cfg:{ formula:'z^3 - 1', colors:'basins', size:0.9 } },
  { type:'phyllotaxis', cfg:{ seeds:600 } },
];
function teaser(cfg0, S0) {
  let cfg = cfg0; const R = rng(4242), inst = {}, G = [];
  let k = 0, nextT = null, lastT = S0.t;
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  const win = document.createElement('canvas'), wctx = win.getContext('2d');
  const kinds = () => (cfg.kinds || KINDS).filter(x => VizForms.types().includes(x.type));
  function secEnd(S) {
    const tm = S.timing, i = tm && tm.sections ? tm.sections.findIndex(s => s.name === S.section.name) : -1;
    return i >= 0 && i + 1 < tm.sections.length ? tm.sections[i + 1].start : Infinity;
  }
  function nextBeat(S, t0) {                             // the beat `every` beats after t0 (timing beats, else bpm grid)
    const ev = cfg.slowAt != null && t0 >= cfg.slowAt ? (cfg.slowEvery ?? 4) : (cfg.every ?? 2);
    const b = S.timing && S.timing.beats;
    if (b && b.length) { const j = b.findIndex(x => x > t0 + 0.05); if (j >= 0) return b[Math.min(b.length - 1, j + ev - 1)]; }
    return t0 + ev*60/(S.bpm || 120);
  }
  function firstBeat(S, t0) { const b = S.timing && S.timing.beats; if (b && b.length) { const x = b.find(x => x >= t0 - 0.01); if (x != null) return x; } return t0; }
  function place(S, r) {                                 // away from the centre, the lower lyric band and other windows
    let best = null, bs = -1e9;
    for (let i = 0; i < 14; i++) {
      const a = R()*Math.PI*2, d = (0.24 + 0.2*R())*Math.min(S.W, S.H)*1.5;
      const x = S.W/2 + Math.cos(a)*d*(S.W/S.H)*0.75, y = S.H*0.42 + Math.sin(a)*d*0.55;
      if (x < r || x > S.W - r || y < r || y > S.H*0.66 - r*0.4) continue;
      let dm = 1e9; for (const g of G) dm = Math.min(dm, Math.hypot(g.x - x, g.y - y) - g.r);
      const s = Math.min(dm, S.H*0.5) + R()*S.H*0.05;
      if (s > bs) { bs = s; best = [x, y]; }
    }
    return best || [S.W*(0.2 + 0.6*R()), S.H*(0.18 + 0.3*R())];
  }
  function spawn(S) {
    const ks = kinds(); if (!ks.length) return;
    const kd = ks[k++ % ks.length], key = kd.type;
    if (!inst[key]) inst[key] = VizForms.make(kd.type, kd.cfg, S);
    if (!inst[key]) return;
    const [r0, r1] = cfg.r || [0.13, 0.2], r = (r0 + (r1 - r0)*R())*S.H, [x, y] = place(S, r);
    G.push({ key, x, y, r, born: S.t, life: cfg.life ?? 2.6, zoom: 0.55 + R()*0.35, rot: (R() - 0.5)*0.6 });   // zoom < 1: magnify a piece
    while (G.length > (cfg.max ?? 3)) G.shift();
  }
  return {
    reconfig(c) { cfg = c; },
    step(S, active) {
      if (S.t < lastT - 0.5 || S.t > lastT + 2) { nextT = null; G.length = 0; }   // seek
      lastT = S.t;
      const from = cfg.from ?? 0, stopAt = secEnd(S) - (cfg.stopBefore ?? 2);
      if (active && S.t >= from && S.t < stopAt) {
        if (nextT == null) { nextT = firstBeat(S, Math.max(from, S.t)); if (S.t >= nextT - 0.05) { spawn(S); nextT = nextBeat(S, nextT); } }
        else if (S.t >= nextT) { spawn(S); nextT = nextBeat(S, nextT); }
      }
      for (let i = G.length - 1; i >= 0; i--) if (S.t - G[i].born > G[i].life || S.t < G[i].born - 0.1) G.splice(i, 1);
      if (S.kick) for (const g of G) g.kick = 1;
      for (const g of G) g.kick = (g.kick || 0)*Math.exp(-S.dt*6);
      // step each visible effect once per frame, well into its growth so the glimpse shows the developed form
      const seen = new Set(G.map(g => g.key));
      for (const key of seen) {
        const g = G.filter(x => x.key === key).at(-1), u = clamp01((S.t - g.born)/g.life);
        inst[key].step(Object.assign({}, S, { sectionT: 0.45 + 0.5*u }), true);
      }
      return G.length ? 'Teaser ' + G.map(g => g.key).join(' · ') : '';
    },
    draw(ctx, S, a) {
      if (!G.length) return;
      if (off.width !== S.W || off.height !== S.H) { off.width = S.W; off.height = S.H; }
      for (const g of G) {
        const u = clamp01((S.t - g.born)/g.life);
        const env = u < 0.05 ? u/0.05 : u < 0.45 ? 1 : 1 - (u - 0.45)/0.55;          // snap in on the beat, then fade
        const flash = Math.max(0, 1 - u*8)*0.6 + g.kick*0.35;                          // a bright first instant + kick pulses
        const alpha = Math.min(1, env*(0.85 + flash))*a; if (alpha < 0.01) continue;
        const rr = g.r*(0.88 + 0.16*u + 0.05*g.kick), side = Math.ceil(rr*2);
        octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, S.W, S.H);
        octx.save(); inst[g.key].draw(octx, Object.assign({}, S, { sectionT: 0.45 + 0.5*u }), 1); octx.restore();
        if (win.width !== side) { win.width = win.height = side; }
        wctx.globalCompositeOperation = 'source-over'; wctx.clearRect(0, 0, side, side);
        const src = rr*g.zoom*(S.H/1080)*1.4;                                          // crop a magnified piece near the form's centre
        wctx.save(); wctx.translate(side/2, side/2); wctx.rotate(g.rot);
        wctx.drawImage(off, S.W/2 - src, S.H/2 - src, src*2, src*2, -side/2, -side/2, side, side); wctx.restore();
        const m = wctx.createRadialGradient(side/2, side/2, rr*0.55, side/2, side/2, rr);   // feathered round window
        m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
        wctx.globalCompositeOperation = 'destination-in'; wctx.fillStyle = m; wctx.fillRect(0, 0, side, side);
        const gain = cfg.gain ?? 2.5, passes = Math.ceil(gain);                         // additive gain: thin form lines read at a glance
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gl = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, rr*1.1), hue = (S.palette.flame + (S.hueShift || 0)) % 360;
        gl.addColorStop(0, `hsla(${hue},90%,55%,${(0.10 + 0.25*flash)*env})`); gl.addColorStop(1, 'hsla(0,0%,0%,0)');
        ctx.globalAlpha = a; ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(g.x, g.y, rr*1.1, 0, 6.2832); ctx.fill();   // glow
        for (let p = 0; p < passes; p++) { ctx.globalAlpha = Math.min(1, alpha*gain/passes); ctx.drawImage(win, g.x - side/2, g.y - side/2); }
        if (u < 0.3) {                                                                 // materialize: an ember ring bursting out on the beat
          const q = u/0.3; ctx.globalAlpha = (1 - q)*0.9*a; ctx.strokeStyle = `hsl(${(hue + 15) % 360},95%,62%)`;
          ctx.lineWidth = Math.max(1.5, S.H/540)*(1.5 - q); ctx.beginPath(); ctx.arc(g.x, g.y, rr*(0.55 + 0.6*q), 0, 6.2832); ctx.stroke();
        }
        ctx.restore();
      }
    },
  };
}
VizForms.register('teaser', teaser);
})();
