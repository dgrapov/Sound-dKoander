// Lyric typography for the Live Visualizer: one distinct text treatment per section, driven by the
// sung word times in the .timing.json (tools/lyric-sync/align.py). Everything is computed from the
// song clock each frame, so seeking, pausing and scrubbing always show the right state.
//
// A line enters a little before its first word, each word reacts when it is sung (long held notes
// stretch), and the line exits with its section's own exit while the next line is already entering.
//
// Pack: per section  type:'ink'|'rise'|'ghost'|'wave'|'seek'|'ember'|'whisper'|'rail'|'fold'|'glitch'|'crystal'|'melt'
// (missing = 'rise'). The 'seek' style draws its answer words out of particles (call-and-response lines
// like "Seeking — cloud vortex": the first word is the call, the rest is the answer).
(() => {
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const ramp = (t, a, d) => clamp01((t - a)/Math.max(1e-3, d));
const eo = x => 1 - Math.pow(1 - x, 3);                       // ease out
const eio = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
const back = x => { const c = 1.9; return 1 + (c + 1)*Math.pow(x - 1, 3) + c*Math.pow(x - 1, 2); };
const hash = (i, j = 0) => { const s = Math.sin(i*127.1 + j*311.7)*43758.5453; return s - Math.floor(s); };
const GLYPHS = '01<>/\\|#%&*+=?ABCDEFXYZΣΔΩ∴∵≡';

// ---------------- styles ----------------
// word(W, t, L, K) / letter(C, t, W, L, K) return { o, x, y, s, rot, rx, ry, blur, ls, sh, col }
// x, y in em. K = { kick, exit (0..1), enter (0..1), hue }.
const STYLES = {
  ink: { pos: 'mid', lead: 0.6, exit: 1.2, scale: 1.15,
    word: (W, t, L, K) => { const a = ramp(t, W.start - 0.25, 1.0); return { o: eo(a)*(1 - K.exit), blur: (1 - eo(a))*14 + K.exit*10, ls: 0.4 - 0.33*eo(a) + K.exit*0.3, y: -K.exit*0.4, col: 'hsl(215,40%,86%)' }; } },
  rise: { pos: 'low', lead: 0.45, exit: 0.6,
    word: (W, t, L, K) => {
      const a = ramp(t, W.start - 0.18, 0.35), on = t >= W.start && t < W.end + 0.05, ex = eio(clamp01(K.exit*1.6 - W.i*0.08));
      return { o: (0.28 + 0.72*a)*(1 - ex), y: (1 - back(a))*0.7 + ex*1.1, s: on ? 1.12 : 1, sh: on ? '0 0 18px rgba(120,220,255,.8)' : '0 0 14px rgba(0,0,0,.9)' };
    } },
  ghost: { pos: 'low', lead: 0.3, exit: 0.8,
    word: (W, t, L, K) => {
      const a = ramp(t, W.start - 0.05, 0.3), on = t >= W.start && t < W.end, d = 0.06 + (on ? 0.12 : 0.04) + K.exit*0.5;
      const sh = `${(-d).toFixed(2)}em 0 2px hsla(270,80%,70%,.55), ${(-2*d).toFixed(2)}em 0 4px hsla(270,80%,60%,.3), ${(-3*d).toFixed(2)}em 0 7px hsla(270,80%,50%,.15)`;
      return { o: eo(a)*(1 - K.exit), x: -K.exit*1.5 + (on ? (hash(W.i, Math.floor(t*20)) - 0.5)*0.05 : 0), sh, col: 'hsl(265,60%,88%)' };
    } },
  wave: { pos: 'low', lead: 0.4, exit: 0.8, letters: true,
    letter: (C, t, W, L, K) => {
      const a = ramp(t, C.t - 0.15, 0.3), x = C.gi*0.55;
      const amp = 0.08 + 0.18*(t >= W.start && t < W.end + 0.3 ? 1 : 0) + K.exit*0.9;
      const y = amp*(Math.sin(x - t*5) + Math.sin(-x*1.3 - t*3.7))/2;     // two waves crossing: interference
      return { o: (0.3 + 0.7*a)*(1 - K.exit), y, col: `hsl(${185 + 30*Math.sin(x - t*5)|0},70%,82%)` };
    } },
  seek: { pos: 'mid', lead: 0.5, exit: 0.9, particles: true,
    word: (W, t, L, K) => {
      if (W.i === 0) {                                         // the call: "Seeking"
        const a = ramp(t, W.start - 0.12, 0.3), on = t >= W.start && t < W.end;
        return { o: eo(a)*(1 - K.exit), s: (0.6 + 0.4*back(a))*(1 + 0.08*K.kick), ls: on ? 0.12 : 0.04, sh: '0 0 22px rgba(255,150,70,.7)', col: 'hsl(28,95%,72%)', x: -K.exit*0.6 };
      }
      const a = ramp(t, W.start + 0.25, 0.8);                   // the answer: particles form it, the text fades in under them
      return { o: 0.08 + 0.55*eo(a)*(1 - K.exit), col: 'hsl(185,80%,85%)', blur: (1 - a)*3 };
    } },
  ember: { pos: 'mid', lead: 0.35, exit: 1.0, scale: 1.45, letters: true,
    word: (W, t, L, K) => {
      const dur = W.end - W.start, held = dur > 1.1 ? clamp01((t - W.start)/dur) : 0, on = t >= W.start && t < W.end;
      return { ls: 0.03 + 0.45*held*(t < W.end + 0.6 ? 1 : 0), sh: on ? '0 0 28px rgba(255,140,50,.95), 0 0 6px rgba(255,220,160,.9)' : '0 0 16px rgba(255,120,40,.45)' };
    },
    letter: (C, t, W, L, K) => {
      const a = ramp(t, W.start - 0.06, 0.22), flare = t >= W.start && t < W.start + 0.25 ? 1 - (t - W.start)/0.25 : 0;
      const ex = clamp01(K.exit*1.4 - hash(C.gi)*0.4), up = eo(ex);
      return { o: (0.18 + 0.82*a)*(1 - ex), s: 1 + 0.35*flare, y: -up*(1.5 + hash(C.gi, 2)*2), x: (hash(C.gi, 3) - 0.5)*up*1.4, rot: (hash(C.gi, 4) - 0.5)*up*60,
               col: `hsl(${28 + 14*a|0},95%,${62 + 20*flare|0}%)` };
    } },
  whisper: { pos: 'low', lead: 0.5, exit: 1.3, scale: 0.9, letters: true,
    word: (W, t, L, K) => ({ ls: 0.22 + 0.06*Math.sin(t*1.3 + W.i) + K.exit*0.5 }),
    letter: (C, t, W, L, K) => {
      const a = ramp(t, C.t - 0.1, 0.45);
      return { o: 0.55*eo(a)*(1 - K.exit), blur: (1 - a)*4 + K.exit*5, y: Math.sin(t*0.9 + C.gi*0.4)*0.08 - K.exit*0.3, col: 'hsl(220,30%,82%)', it: true };
    } },
  rail: { pos: 'low', lead: 0.7, exit: 0.9,
    word: (W, t, L, K) => {
      const u = eo(ramp(t, W.start - 0.55, 0.55)), ex = eio(clamp01(K.exit*1.5 - W.i*0.06));
      const x = (1 - u)*14 - ex*16, y = -Math.sin(u*Math.PI)*1.2 + Math.sin(ex*Math.PI)*0.9;
      const slope = (1 - u) > 0.001 ? -Math.cos(u*Math.PI)*25 : 0;
      return { o: Math.min(1, u*2)*(1 - ex*0.9), x, y, rot: slope*(1 - u) - ex*15, col: 'hsl(150,70%,80%)', sh: '0 0 14px rgba(87,242,138,.5)' };
    } },
  fold: { pos: 'low', lead: 0.25, exit: 0.7, persp: true,
    word: (W, t, L, K) => {
      const u = eo(ramp(t, W.start - 0.1, 0.45)), ex = eio(clamp01(K.exit*1.4 - W.i*0.05)), dir = W.i % 2 ? 1 : -1;
      return { o: Math.min(1, u*1.5)*(1 - ex), rx: -(1 - u)*95, ry: ex*95*dir, origin: ex > 0 ? (dir > 0 ? 'left center' : 'right center') : 'center top', col: `hsl(45,80%,${70 + 15*u|0}%)` };
    } },
  glitch: { pos: 'mid', lead: 0.3, exit: 0.6, letters: true, mono: true, scale: 1.2,
    letter: (C, t, W, L, K) => {
      const locked = t >= C.t, ex = clamp01(K.exit*1.5 - hash(C.gi)*0.5), scr = !locked || ex > 0.05;
      const ch = scr && C.ch !== ' ' ? GLYPHS[Math.floor(hash(C.gi, Math.floor(t*22))*GLYPHS.length)] : null;
      const kx = K.kick*(hash(C.gi, Math.floor(t*30)) - 0.5)*0.35;
      return { o: (locked ? 1 : 0.45)*(1 - ex), x: kx, ch, col: locked ? 'hsl(140,90%,70%)' : 'hsl(140,60%,45%)',
               sh: K.kick > 0.2 ? `${(0.06*K.kick).toFixed(3)}em 0 rgba(255,40,80,.8), ${(-0.06*K.kick).toFixed(3)}em 0 rgba(40,200,255,.8)` : '0 0 10px rgba(87,242,138,.6)' };
    } },
  crystal: { pos: 'mid', lead: 0.4, exit: 0.9, letters: true, scale: 1.4,
    letter: (C, t, W, L, K) => {
      const u = ramp(t, C.t - 0.35, 0.35), k = Math.floor(hash(C.gi)*6), cells = 1 + Math.floor(hash(C.gi, 1)*3);
      const ang = k*Math.PI/3, d = (1 - back(u))*cells*1.4;
      const ex = eo(clamp01(K.exit*1.3 - hash(C.gi, 5)*0.3)), ea = Math.floor(hash(C.gi, 6)*6)*Math.PI/3;
      const on = t >= W.start && t < W.end, glint = on ? 0.5 + 0.5*Math.sin(t*9 + C.gi) : 0;
      return { o: Math.min(1, u*1.3)*(1 - ex), x: Math.cos(ang)*d + Math.cos(ea)*ex*3, y: Math.sin(ang)*d + Math.sin(ea)*ex*3, rot: (1 - u)*60*(k % 2 ? 1 : -1),
               col: `hsl(${44 - 10*glint|0},${70 + 25*glint|0}%,${74 + 18*glint|0}%)`, sh: `0 0 ${(10 + 16*glint)|0}px rgba(255,210,140,.8)` };
    } },
  melt: { pos: 'mid', lead: 0.8, exit: 2.2, letters: true,
    letter: (C, t, W, L, K) => {
      const a = ramp(t, C.t - 0.3, 0.9), drip = Math.max(0, t - W.end)*(0.15 + hash(C.gi)*0.35) + K.exit*(1 + hash(C.gi, 1)*2);
      return { o: eo(a)*(1 - K.exit), y: drip, blur: (1 - a)*6 + drip*2.5, s: 1 + drip*0.1, col: `hsl(230,40%,${84 - 20*clamp01(drip)|0}%)` };
    } },
};

// ---------------- lines ----------------
let model = null, modelFor = null, styleFor = null;
function build(timing, styleOf) {
  const lines = timing.lines.map((L, j) => ({ j, text: L.text, section: L.section, start: L.start, end: L.end ?? L.start, words: [], style: STYLES[styleOf(L.section)] ? styleOf(L.section) : 'rise' }));
  (timing.words || []).forEach(w => { const L = lines[w.line]; if (L && w.start != null) L.words.push({ text: String(w.text), start: w.start, end: Math.max(w.end ?? w.start, w.start + 0.08) }); });
  lines.forEach(L => {
    L.words.forEach((W, i) => { W.i = i; });
    let gi = 0;
    L.words.forEach(W => { W.letters = [...W.text].map((ch, k) => ({ ch, k, gi: gi++, t: W.start + (W.end - W.start)*Math.min(0.85, k/Math.max(1, W.text.length)) })); });
    if (L.words.length) { L.start = Math.min(L.start ?? 1e9, L.words[0].start); L.end = Math.max(L.end, L.words[L.words.length - 1].end); }
  });
  const ok = lines.filter(L => L.start != null && L.words.length);
  ok.forEach((L, i) => {
    const st = STYLES[L.style], nx = ok[i + 1];
    L.lead = st.lead; L.exitDur = st.exit;
    L.exitStart = Math.min(nx ? nx.start - STYLES[nx.style].lead*0.5 : 1e9, L.end + 2.2);
    L.exitStart = Math.max(L.exitStart, L.start + 0.3);
    L.show0 = L.start - L.lead; L.show1 = L.exitStart + L.exitDur;
  });
  return ok;
}

// ---------------- particles for the 'seek' answer ----------------
const PN = 1600;
const PX = new Float32Array(PN), PY = new Float32Array(PN), VX = new Float32Array(PN), VY = new Float32Array(PN), TX = new Float32Array(PN), TY = new Float32Array(PN), HAS = new Uint8Array(PN);
let pInit = false, pLine = -1, pTargets = null, pAlpha = 0;
function sampleWord(span, DPR) {
  const r = span.getBoundingClientRect(); if (r.width < 2) return null;
  const cs = getComputedStyle(span), c = document.createElement('canvas');
  const w = Math.ceil(r.width*DPR) + 8, h = Math.ceil(r.height*DPR) + 8; c.width = w; c.height = h;
  const x = c.getContext('2d'); x.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize)*DPR}px ${cs.fontFamily}`;
  x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#fff'; x.fillText(span.textContent, 4, h/2);
  const d = x.getImageData(0, 0, w, h).data, pts = [], step = Math.max(2, Math.round(parseFloat(cs.fontSize)*DPR/16));
  for (let yy = 0; yy < h; yy += step) for (let xx = 0; xx < w; xx += step) if (d[(yy*w + xx)*4 + 3] > 128) pts.push([r.left*DPR + xx - 4, r.top*DPR + yy - h/2 + r.height*DPR/2]);
  return pts;
}
function particles(ctx, S, L, el, t, exitK) {
  const W = S.W, H = S.H;
  if (!pInit) { for (let i = 0; i < PN; i++) { PX[i] = Math.random()*W; PY[i] = Math.random()*H; } pInit = true; }
  if (L && el && pLine !== L.j) {                       // new seek line: sample each answer word where it sits on screen
    const spans = el.querySelectorAll('.w'), sets = [];
    L.words.forEach((Wd, i) => { if (i > 0 && spans[i]) { const pts = sampleWord(spans[i], S.DPR); if (pts && pts.length) sets.push({ Wd, pts }); } });
    if (sets.length) {
      const total = sets.reduce((s, x) => s + x.pts.length, 0);
      pTargets = []; let k = 0;
      for (const st of sets) { const n = Math.round(PN*st.pts.length/total); for (let i = 0; i < n && k < PN; i++, k++) { const p = st.pts[Math.floor(i*st.pts.length/n)]; pTargets.push({ x: p[0], y: p[1], t: st.Wd.start }); } }
      pLine = L.j;
    }
  }
  const active = L && pTargets && pLine === L.j;
  pAlpha += ((active ? 1 : 0) - pAlpha)*Math.min(1, S.dt*3);
  if (pAlpha < 0.01 && !active) return;
  const cx = W/2, cy = H*0.55;
  for (let i = 0; i < PN; i++) {
    const tg = active ? pTargets[i] : null;
    if (tg && t >= tg.t - 0.05 && exitK < 0.02) {
      VX[i] = VX[i]*0.8 + (tg.x - PX[i])*0.07; VY[i] = VY[i]*0.8 + (tg.y - PY[i])*0.07;
    } else if (exitK > 0.02 || !active) {                // exit: the answer bursts back into a cloud
      const dx = PX[i] - cx, dy = PY[i] - cy, d = Math.hypot(dx, dy) + 1;
      VX[i] = VX[i]*0.94 + dx/d*0.6 + (Math.random() - 0.5)*0.8; VY[i] = VY[i]*0.94 + dy/d*0.6 + (Math.random() - 0.5)*0.8;
    } else {                                               // waiting: a slow swirl around the line
      const dx = PX[i] - cx, dy = PY[i] - cy, d = Math.hypot(dx, dy) + 1, want = Math.min(W, H)*0.28;
      VX[i] = VX[i]*0.92 + (-dy/d)*0.9 + dx/d*(want - d)*0.002 + (Math.random() - 0.5)*0.5;
      VY[i] = VY[i]*0.92 + (dx/d)*0.9 + dy/d*(want - d)*0.002 + (Math.random() - 0.5)*0.5;
    }
    if (S.kick) { VX[i] += (Math.random() - 0.5)*3; VY[i] += (Math.random() - 0.5)*3; }
    PX[i] += VX[i]; PY[i] += VY[i];
  }
  ctx.fillStyle = `hsla(${(S.palette.life + S.hueShift)|0},85%,80%,${(0.85*pAlpha).toFixed(3)})`;
  const sz = 1.6*S.DPR;
  for (let i = 0; i < PN; i++) ctx.fillRect(PX[i], PY[i], sz, sz);
}

// ---------------- DOM ----------------
const els = new Map();
function makeEl(L, host) {
  const st = STYLES[L.style], el = document.createElement('div');
  el.className = 'ly ly-' + L.style + ' ly-' + st.pos + (st.mono ? ' ly-mono' : '') + (st.persp ? ' ly-persp' : '');
  L.words.forEach((W, i) => {
    const w = document.createElement('span'); w.className = 'w';
    W.letters.forEach(C => { const c = document.createElement('span'); c.className = 'c'; c.textContent = C.ch; w.appendChild(c); });   // letters always split: wave distortion works on every style
    el.appendChild(w);
    if (i < L.words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  host.appendChild(el);
  return el;
}
let BLUR = 1;                                              // clarity: 0 = effects blur freely, 1 = no blur
function apply(el, o) {
  if (o.blur) o.blur *= BLUR;
  let tr = '';
  if (o.x || o.y) tr += `translate(${(o.x || 0).toFixed(3)}em,${(o.y || 0).toFixed(3)}em) `;
  if (o.s != null && o.s !== 1) tr += `scale(${o.s.toFixed(3)}) `;
  if (o.rot) tr += `rotate(${o.rot.toFixed(1)}deg) `;
  if (o.rx) tr += `rotateX(${o.rx.toFixed(1)}deg) `;
  if (o.ry) tr += `rotateY(${o.ry.toFixed(1)}deg) `;
  el.style.transform = tr || 'none';
  el.style.opacity = (o.o ?? 1).toFixed(3);
  el.style.filter = o.blur > 0.05 ? `blur(${o.blur.toFixed(2)}px)` : 'none';
  if (o.ls != null) el.style.letterSpacing = o.ls.toFixed(3) + 'em';
  if (o.sh !== undefined) el.style.textShadow = o.sh;
  if (o.col) el.style.color = o.col;
  if (o.origin) el.style.transformOrigin = o.origin;
  if (o.it) el.style.fontStyle = 'italic';
  if (o.ch !== undefined) { const want = o.ch ?? el.dataset.ch; if (el.textContent !== want) el.textContent = want; }
}

window.VizType = {
  styles: Object.keys(STYLES),
  // S: { t, dt, timing, styleOf(sectionName), host (div), ctx (canvas 2d), W, H, DPR, kick, kickEnv, palette, hueShift, fontSize, fx (0 = plain) }
  frame(S) {
    if (S.timing !== modelFor || S.styleKey !== styleFor) {
      for (const e of els.values()) e.remove(); els.clear();
      model = S.timing ? build(S.timing, S.styleOf) : null; modelFor = S.timing; styleFor = S.styleKey; pLine = -1;
    }
    S.ctx.clearRect(0, 0, S.W, S.H);
    if (!model) return;
    const t = S.t, vis = new Set(), X = Object.assign({ clarity: 0.5, waveAmt: 0, waveFreq: 0.6, waveSpeed: 3, waveMode: 0, waveBeat: 0 }, S.textFx || {});
    const wave = X.waveAmt > 0.001;
    BLUR = Math.max(0, 1.6 - 1.6*X.clarity);
    const halo = X.clarity > 0.5 ? `drop-shadow(0 0 ${(2 + 10*(X.clarity - 0.5))|0}px rgba(0,0,0,${(1.6*(X.clarity - 0.5)).toFixed(2)}))` : 'none';
    let seekL = null, seekEl = null, seekExit = 0;
    for (const L of model) {
      if (t < L.show0 || t > L.show1) continue;
      vis.add(L.j);
      let el = els.get(L.j);
      if (!el) { el = makeEl(L, S.host); els.set(L.j, el); el.querySelectorAll('.c').forEach(c => c.dataset.ch = c.textContent); }
      const st = STYLES[L.style];
      el.style.fontSize = `calc(${S.fontSize} * ${st.scale || 1})`;
      el.style.filter = halo;
      const K = { kick: S.kickEnv, exit: ramp(t, L.exitStart, L.exitDur), enter: ramp(t, L.show0, L.lead) };
      el.style.translate = K.exit > 0 ? (S.vertical ? `${(1.6*eo(K.exit)).toFixed(3)}em 0` : `0 ${(-1.5*eo(K.exit)).toFixed(3)}em`) : '0 0';   // the leaving line lifts away so it never sits on the new one
      const wEls = el.children;
      L.words.forEach((W, i) => {
        const we = wEls[i]; if (!we) return;
        if (st.word) apply(we, st.word(W, t, L, K));
        else apply(we, { o: 1 });
        const cs = we.children;
        W.letters.forEach((C, k) => {
          if (!cs[k]) return;
          const o = st.letter ? st.letter(C, t, W, L, K) : {};
          if (wave) {                                         // user wave distortion, layered on the style
            const ph = C.gi*X.waveFreq - t*X.waveSpeed, A = X.waveAmt*(1 + X.waveBeat*S.kickEnv);
            const across = S.vertical ? 'x' : 'y', along = S.vertical ? 'y' : 'x';   // ripple perpendicular to the text
            if (X.waveMode === 1) o[along] = (o[along] || 0) + A*Math.sin(ph);
            else if (X.waveMode === 2) o.rot = (o.rot || 0) + A*40*Math.sin(ph);
            else if (X.waveMode === 3) o[across] = (o[across] || 0) + A*(Math.sin(ph) + Math.sin(-C.gi*X.waveFreq*1.37 - t*X.waveSpeed*0.8))/2;
            else o[across] = (o[across] || 0) + A*Math.sin(ph);
          }
          apply(cs[k], o);
        });
      });
      if (st.particles) { seekL = L; seekEl = el; seekExit = K.exit; }
    }
    for (const [j, e] of els) if (!vis.has(j)) { e.remove(); els.delete(j); }
    particles(S.ctx, S, seekL, seekEl, t, seekExit);
  },
  reset() { for (const e of els.values()) e.remove(); els.clear(); modelFor = null; pLine = -1; },
};
})();
