// Looks: named presets (tuning + on-demand effects + text style + particle scene / attractor), cycled by hand or by the
// Demo autopilot on the downbeat. Generated looks come from analysis/looks/sweep.js (ui/looks.generated.js); your own
// are saved in this browser ("Save look"). Applying a look morphs the numeric settings over ~1 beat instead of cutting.
//
// look: { id, name, tags:[], tune:{ key:value }, fx:['flower',…], style:'', scene:'', attractor:'', ovAll:false, auto:true|false }
//   auto: whether the section's own effects stay on (false = a pure on-demand look; undefined = leave as it is)
// Keys: [ ] previous/next · \ random · R roll (random loadout from everything) · B blank · D demo autopilot · Backspace back to my tuning
// look.blank: true = no pack presets (index.html blankSection). Loadouts: Blank, and the last Roll.
(() => {
const C = window.LVC; if (!C) return;
const $ = id => document.getElementById(id);
const USER_KEY = 'livevis:looks:user';
// screen/sync preferences a look never changes unless it names them
const PERSONAL = ['hudOn', 'metersOn', 'renderMax', 'lyricsOn', 'beatLock', 'kickSens', 'textSize', 'textBright', 'kickV'];
let userLooks = C.store.get(USER_KEY, []);
const gen = () => (window.VIZ_LOOKS_GEN || []);
// Blank: no pack presets at all (neutral sections, nothing switched on), a calm neutral palette: the empty canvas to roll on.
const BLANK = { id: 'blank', name: 'Blank', tags: ['loadout', 'no presets'], blank: true, fx: [], style: '', scene: '', attractor: 'none', loadout: true,
  tune: { lifeHue: 210, digHue: 190, flameHue: 35, gridHue: 200, hue: 0, sat: 22, bgHue: 230, bgLight: 3, trail: 0.5, partSize: 1, glow: 1, chaos: 1, orderBias: 0, gridOn: 0, waveAmt: 0, place: 0, tilt: 0 } };
let lastRoll = null, rollN = 0;
const all = () => [{ id: 'mine', name: 'My tuning', tags: ['base'], mine: true }, BLANK].concat(lastRoll ? [lastRoll] : [], gen(), userLooks.map(l => Object.assign({ user: true }, l)));
let cur = 'mine', base = null, morph = null;
const listeners = [];

function snapshot() { return { tune: Object.assign({}, C.tune), fx: C.fx.live(), style: C.style(), scene: C.ovr.scene, attractor: C.ovr.attractor, ovAll: C.ovr.ovAll, auto: C.fx.auto(), blank: C.ovr.blank }; }

function apply(look, opts = {}) {
  if (!look) return;
  if (!base && !look.mine) base = snapshot();                 // the first look remembers your own tuning
  const D = C.tuneDefaults(), src = look.mine ? (base || snapshot()) : null;
  const target = look.mine ? src.tune : Object.assign({}, D, look.tune || {});
  if (!look.mine) for (const k of PERSONAL) if (!(look.tune && k in look.tune)) target[k] = C.tune[k];   // your screen prefs stay
  // non-numeric / structural keys switch at once; the rest morph
  const now = {}, from = {}, to = {};
  for (const [k, , , , , , , kind] of C.TUNE_DEF) {
    if (target[k] == null) continue;
    if (kind || C.MORPH_SKIP.has(k)) now[k] = target[k]; else { from[k] = C.tune[k]; to[k] = target[k]; }
  }
  C.setTune(now, false);
  const dur = opts.instant ? 0 : (opts.dur ?? 60/((C.pack().bpm) || 120)*1.5);
  morph = dur > 0 ? { from, to, t0: performance.now(), dur: dur*1000 } : null;
  if (!morph) C.setTune(to, false);
  const L = look.mine ? src : look;
  C.fx.setLive(L.fx || []);
  if (L.auto != null) C.fx.auto(L.auto);
  C.style(L.style || '');
  C.setOverride('scene', L.scene || ''); C.setOverride('attractor', L.attractor || ''); C.setOverride('ovAll', !!L.ovAll); C.setOverride('blank', !!L.blank);
  if (look.mine) base = null;
  cur = look.id;
  if (opts.flash) C.flash();
  toast((look.mine ? '' : (index(look.id) + '/' + (all().length - 1) + ' · ')) + look.name);
  listeners.forEach(f => f(look));
}
const index = id => all().findIndex(l => l.id === id);
function step(d) { const L = all().filter(l => !l.mine && !l.loadout && !l.rolled); if (!L.length) return; const i = L.findIndex(l => l.id === cur); apply(L[i < 0 ? (d > 0 ? 0 : L.length - 1) : (i + d + L.length) % L.length], { flash: demo.on }); }
function random() { const L = all().filter(l => !l.mine && !l.loadout && !l.rolled && l.id !== cur); if (L.length) apply(L[Math.floor(Math.random()*L.length)], { flash: demo.on }); }

// ---------------- Roll: a random loadout drawn uniformly from everything, on the Blank base ----------------
// Every effect in the catalog, every particle scene, every attractor (or none), every text style (or auto) is equally likely;
// colours come from a random palette scheme so a roll still hangs together. Save look keeps one you like.
const HUEWORD = [[0,'Crimson'],[18,'Ember'],[35,'Amber'],[52,'Gold'],[75,'Lime'],[110,'Jade'],[150,'Mint'],[178,'Cyan'],[200,'Azure'],[225,'Cobalt'],[255,'Indigo'],[280,'Violet'],[305,'Orchid'],[330,'Magenta'],[350,'Rose']];
const hueWord = h => { let w = 'Crimson'; for (const [a, n] of HUEWORD) if (h >= a) w = n; return w; };
const SCHEMES = [h => [h, h + 28, h - 28], h => [h, h + 180, h + 25], h => [h, h + 120, h + 240], h => [h, h + 150, h + 210], h => [h, h + 8, h - 8], h => [h, h + 90, h + 300]];
function makeRoll() {
  const R = Math.random, pick = a => a[Math.floor(R()*a.length)], rr = (a, b) => a + R()*(b - a), r2 = v => Math.round(v*100)/100;
  const si = Math.floor(R()*SCHEMES.length), [life, dig, flame] = SCHEMES[si](Math.floor(R()*360)).map(h => ((Math.round(h) % 360) + 360) % 360);
  const fxAll = C.fx.list.filter(f => !f.special).map(f => f.key), n = 1 + Math.floor(R()*3), fx = [];
  while (fx.length < n) { const k = pick(fxAll); if (!fx.includes(k)) fx.push(k); }
  const M = window.VIZ_MODES || { scenes: [], attractors: [] };
  const tune = { lifeHue: life, digHue: dig, flameHue: flame, gridHue: pick([life, dig]), hue: 0,
    sat: si === 4 ? Math.round(rr(10, 45)) : si === 5 ? 100 : Math.round(rr(55, 100)), bgHue: Math.round(R() < 0.6 ? (life + 180 + rr(-30, 30)) % 360 : life), bgLight: r2(R() < 0.1 ? rr(15, 24) : rr(0, 9)),
    trail: r2(rr(0.1, 0.95)), partSize: r2(rr(0.5, 2.4)), glow: r2(rr(0.3, 2.4)), chaos: r2(rr(0.2, 1.9)), orderBias: r2(rr(-0.35, 0.45)), react: r2(rr(0.7, 1.7)),
    kickPhys: r2(rr(0.4, 1.8)), phys: r2(rr(0.3, 1)), attrSpeed: r2(rr(0.5, 1.8)), forms: r2(rr(0.6, 1.3)),
    gridOn: R() < 0.5 ? 1 : 0, gridType: Math.floor(R()*3), gridBase: r2(rr(0, 0.5)), gridAmt: r2(rr(0.5, 2)), gridSize: r2(rr(0.08, 0.4)),
    textFont: Math.floor(R()*4), clarity: r2(rr(0.3, 0.9)), waveAmt: R() < 0.4 ? r2(rr(0.1, 0.45)) : 0, waveMode: Math.floor(R()*4), waveFreq: r2(rr(0.3, 1.2)), waveSpeed: r2(rr(1, 6)) };
  const scene = pick(M.scenes), attractor = pick(M.attractors.map(a => a.key)), style = pick([''].concat(C.styles()));
  const lab = C.fx.list.find(f => f.key === fx[0]).label;
  rollN++;
  return { id: 'roll', rolled: true, blank: true, name: `Roll ${rollN} · ${hueWord(life)} ${lab}`, tags: ['roll', scene, attractor].concat(fx), tune, fx, scene, attractor, style };
}
function roll(opts = {}) { lastRoll = makeRoll(); apply(lastRoll, Object.assign({ flash: demo.on }, opts)); return lastRoll; }

C.onFrame(() => {                                              // the morph: smoothstep over the duration, sliders refreshed at the end
  if (!morph) return;
  const u = Math.min(1, (performance.now() - morph.t0)/morph.dur), e = u*u*(3 - 2*u), v = {};
  for (const k in morph.to) {
    let a = morph.from[k], b = morph.to[k];
    if (/Hue$|^hue$/.test(k) && k !== 'hue') { const d = ((b - a + 540) % 360) - 180; v[k] = (a + d*e + 360) % 360; }   // hues the short way round
    else v[k] = a + (b - a)*e;
  }
  C.setTune(v, false);
  if (u >= 1) { morph = null; refreshTuneUI(); }
});
function refreshTuneUI() { C.refreshUI(); }

// ---------------- Demo autopilot: next look every N bars, on the downbeat ----------------
const demo = Object.assign({ on: false, bars: 8, order: 'next', flash: true }, C.store.get('livevis:demo', {}), { on: false });
let lastT = null, barCount = 0;
function downbeatsBetween(a, b) {
  const tm = C.timing();
  if (tm && tm.downbeats && tm.downbeats.length) { let n = 0; for (const d of tm.downbeats) if (d > a && d <= b) n++; return n; }
  const bar = 240/((C.pack().bpm) || 120); return Math.floor(b/bar) - Math.floor(a/bar);
}
C.onFrame(S => {
  if (!demo.on || !S.playing) { lastT = S.t; return; }
  if (lastT != null && S.t > lastT && S.t - lastT < 1.5) {          // larger jumps are seeks
    barCount += downbeatsBetween(lastT, S.t);
    if (barCount >= demo.bars) { barCount = 0; demo.order === 'random' ? random() : demo.order === 'roll' ? roll() : step(1); }
  }
  lastT = S.t;
});
function setDemo(on) { demo.on = on == null ? !demo.on : !!on; barCount = demo.bars - 1; C.store.set('livevis:demo', demo); toast(demo.on ? `Demo autopilot: ${demo.order === 'roll' ? 'a new random roll' : 'a new look'} every ${demo.bars} bars` : 'Demo autopilot off'); listeners.forEach(f => f()); }

// ---------------- save / delete your own ----------------
function saveCurrent(name) {
  const D = C.tuneDefaults(), s = snapshot(), tune = {};
  for (const [k] of C.TUNE_DEF) if (s.tune[k] != null && Math.abs(s.tune[k] - (D[k] ?? 0)) > 1e-9 && k !== 'renderMax') tune[k] = +(+s.tune[k]).toFixed(3);
  const look = { id: 'u' + Date.now().toString(36), name: name || ('My look ' + (userLooks.length + 1)), tags: ['mine'], tune, fx: s.fx, style: s.style, scene: s.scene, attractor: s.attractor, ovAll: s.ovAll, auto: s.auto, blank: s.blank };
  userLooks.push(look); C.store.set(USER_KEY, userLooks); cur = look.id; listeners.forEach(f => f(look)); toast('Saved: ' + look.name); return look;
}
function remove(id) { userLooks = userLooks.filter(l => l.id !== id); C.store.set(USER_KEY, userLooks); listeners.forEach(f => f()); }

// ---------------- toast ----------------
let toastEl = null, toastTimer = 0;
function toast(msg) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'lookToast'; document.body.appendChild(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

// ---------------- Look bar in the Tune panel ----------------
function buildBar() {
  const bar = $('lookBar'); if (!bar) return;
  const L = all(), l = L[Math.max(0, index(cur))];
  bar.innerHTML = `<div class="lookrow"><button class="small" data-a="prev" title="Previous look ([)">◂</button><span class="lookname" title="${(l.tags || []).join(', ')}">${l.name}</span><button class="small" data-a="next" title="Next look (])">▸</button>
    <button class="small" data-a="rand" title="Random look (\\)">⚄</button><button class="small" data-a="roll" title="Roll: a random loadout from every effect, scene, attractor and text style, on the Blank base (R)">🎲 Roll</button><button class="small" data-a="blank" title="Blank: no pack presets, nothing on (B)">Blank</button><button class="small" data-a="save" title="Save the current tuning, effects, text style and modes as a look">Save look</button>${l.user ? '<button class="small" data-a="del" title="Delete this saved look">✕</button>' : ''}</div>`;
  bar.querySelector('[data-a=prev]').onclick = () => step(-1); bar.querySelector('[data-a=next]').onclick = () => step(1); bar.querySelector('[data-a=rand]').onclick = random; bar.querySelector('[data-a=roll]').onclick = () => roll(); bar.querySelector('[data-a=blank]').onclick = () => apply(BLANK);
  bar.querySelector('[data-a=save]').onclick = () => { const n = prompt('Name this look', 'My look ' + (userLooks.length + 1)); if (n !== null) saveCurrent(n.trim()); };
  const del = bar.querySelector('[data-a=del]'); if (del) del.onclick = () => { remove(l.id); apply(all()[0], { instant: true }); };
}
listeners.push(buildBar); buildBar();

const css = document.createElement('style');
css.textContent = `#lookToast { position:fixed; left:50%; top:18px; transform:translate(-50%,-8px); background:rgba(12,14,26,.85); border:1px solid rgba(255,255,255,.16); color:#dfe8ee; padding:6px 14px; border-radius:16px; font-size:13px; letter-spacing:.04em; opacity:0; transition:opacity .25s, transform .25s; pointer-events:none; z-index:30; }
#lookToast.show { opacity:1; transform:translate(-50%,0); }
.lookrow { display:flex; gap:5px; align-items:center; flex-wrap:wrap; } .lookname { flex:1; text-align:center; font-size:12px; color:#ffb27a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }`;
document.head.appendChild(css);

window.LVLooks = { roll, blank: () => apply(BLANK, { flash: false }), all, apply: (id, o) => apply(typeof id === 'string' ? all().find(l => l.id === id) : id, o), step, random, current: () => cur,
  save: saveCurrent, remove, demo, setDemo, onChange: f => listeners.push(f), toast };
})();
