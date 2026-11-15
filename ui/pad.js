// The Pad: a playable grid over the stage. P opens/closes it, Esc closes, Tab / Shift-Tab switch pages.
//   Effects  every on-demand effect (ui/fx-catalog.js), by category, one tile per effect with a preview thumbnail
//   Looks    the presets (ui/looks.js); the Demo autopilot cycles them on the downbeat
//   Modes    particle scene, attractor, text style and a few switches: change the whole stage, not a layer
//   Perform  an XY pad and hold-buttons for live playing (strobe, freeze, void, burst, mono, invert)
// Playing a tile: click/key = on/off (latch) · hold the mouse or Shift+key = only while held · Alt+click/key or right-click = solo.
// The keyboard maps the tiles of the open page row by row: 1–0, Q–O, A–L, Z–. (the key is printed on each tile).
// Active tiles pulse with the kick. "▭" shrinks the tiles. "⇲" docks the Pad (full / bottom / top / left / right); the slider
// or a drag on its inner edge sets its size, so it stays off the central image. Dock and size are remembered.
(() => {
const C = window.LVC, LK = window.LVLooks; if (!C) return;
const $ = id => document.getElementById(id);
const KEYS = ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0',
  'KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL',
  'KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period'];
const keyLabel = c => c.replace(/^Digit|^Key/, '').replace('Comma', ',').replace('Period', '.');
const CAT_HUE = { Geometry: 40, Cymatics: 185, Fractals: 280, Spectrum: 320, 'Life & bodies': 95 };
const PAGES = ['Effects', 'Looks', 'Modes', 'Perform'];
const DOCKS = { full: 'Full', bottom: 'Bottom', top: 'Top', left: 'Left', right: 'Right' };
const SIZE_DEF = { bottom: 34, top: 34, left: 32, right: 32 };
const st = Object.assign({ open: false, page: 'Effects', compact: false, dock: 'bottom', size: {} }, C.store.get('livevis:pad', {}), { open: false });
st.size = Object.assign({}, SIZE_DEF, st.size || {}); if (!DOCKS[st.dock]) st.dock = 'bottom';
const save = () => C.store.set('livevis:pad', { page: st.page, compact: st.compact, dock: st.dock, size: st.size });

// ---------------- DOM ----------------
const pad = document.createElement('section'); pad.id = 'pad'; pad.className = 'pad hidden'; pad.setAttribute('aria-label', 'Pad');
pad.innerHTML = `<header><nav></nav><span id="padNow"></span><span class="padtools">
  <button class="small" data-a="roll" title="Roll: random loadout from everything, on the Blank base (R)">🎲 Roll</button><button class="small" data-a="blank" title="Blank: no pack presets (B)">Blank</button>
  <button class="small" data-a="demo" title="Demo autopilot: a new look on the downbeat every N bars (D)">▶ Demo</button>
  <select class="small" data-a="bars" title="Bars per look">${[2,4,8,16].map(b => `<option value="${b}">${b} bars</option>`).join('')}</select>
  <select class="small" data-a="order" title="Next or random look"><option value="next">in order</option><option value="random">shuffle</option><option value="roll">roll (random)</option></select>
  <button class="small" data-a="auto" title="Section effects follow the timing">Section fx</button>
  <button class="small" data-a="off" title="All on-demand effects off (0)">All off</button>
  <select class="small" data-a="dock" title="Where the Pad sits, so it stays off the central image">${Object.entries(DOCKS).map(([k, v]) => `<option value="${k}">⇲ ${v}</option>`).join('')}</select>
  <label class="padsize" title="Pad size (or drag the Pad's inner edge)"><input type="range" data-a="size" min="12" max="85" step="1"><output></output></label>
  <button class="small" data-a="compact" title="Small / large tiles">▭</button><button class="small" data-a="close" title="Close (P or Esc)">✕</button></span></header>
  <div class="padbody"></div>`;
document.body.appendChild(pad);
const body = pad.querySelector('.padbody'), nav = pad.querySelector('nav');
const grip = document.createElement('div'); grip.className = 'padgrip'; grip.title = 'Drag to resize'; pad.appendChild(grip);
const M = 16, TOP = 84, BOT = 118;                 // keep clear of the HUD/meters (top) and the dock (bottom)
function layout() {
  const d = st.dock, z = st.size[d], ps = pad.style;
  ps.left = ps.right = ps.top = ps.bottom = ps.width = ps.height = ''; ps.maxHeight = 'none';
  if (d === 'full') { ps.left = ps.right = M + 'px'; ps.top = TOP + 'px'; ps.bottom = BOT + 'px'; }
  else if (d === 'bottom') { ps.left = ps.right = M + 'px'; ps.bottom = BOT + 'px'; ps.top = 'auto'; ps.height = `min(${z}vh, calc(100vh - ${TOP + BOT}px))`; }
  else if (d === 'top') { ps.left = ps.right = M + 'px'; ps.top = M + 'px'; ps.bottom = 'auto'; ps.height = `min(${z}vh, calc(100vh - ${M + BOT}px))`; }
  else { ps[d] = M + 'px'; ps[d === 'left' ? 'right' : 'left'] = 'auto'; ps.top = TOP + 'px'; ps.bottom = BOT + 'px'; ps.width = `min(${z}vw, calc(100vw - ${2*M}px))`; }
  pad.dataset.dock = d; pad.classList.toggle('side', d === 'left' || d === 'right');
  const sz = tool('size'); sz.disabled = d === 'full'; sz.value = z || 0; sz.nextElementSibling.textContent = d === 'full' ? '' : z + '%';
  tool('dock').value = d;
}
grip.addEventListener('pointerdown', e => {
  if (st.dock === 'full') return; e.preventDefault(); grip.setPointerCapture(e.pointerId); pad.classList.add('resizing');
  const move = ev => { const d = st.dock, W = innerWidth, H = innerHeight;
    const px = d === 'bottom' ? (H - BOT) - ev.clientY : d === 'top' ? ev.clientY - M : d === 'left' ? ev.clientX - M : (W - M) - ev.clientX;
    st.size[d] = Math.round(Math.max(12, Math.min(85, 100*px/(d === 'left' || d === 'right' ? W : H)))); layout(); };
  const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up); pad.classList.remove('resizing'); save(); };
  grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
});
addEventListener('resize', () => st.open && layout());
nav.innerHTML = PAGES.map(p => `<button class="tab" data-p="${p}">${p}</button>`).join('');
nav.querySelectorAll('.tab').forEach(b => b.onclick = () => { st.page = b.dataset.p; save(); render(); });
const tool = a => pad.querySelector(`[data-a=${a}]`);
tool('close').onclick = () => toggle(false);
tool('compact').onclick = () => { st.compact = !st.compact; save(); pad.classList.toggle('compact', st.compact); };
tool('dock').onchange = e => { st.dock = e.target.value; save(); layout(); };
tool('size').oninput = e => { st.size[st.dock] = +e.target.value; layout(); };
tool('size').onchange = save;
tool('off').onclick = () => { C.fx.allOff(); render(); };
tool('auto').onclick = () => { C.fx.auto(!C.fx.auto()); syncTools(); };
tool('demo').onclick = () => LK && LK.setDemo();
tool('roll').onclick = () => LK && LK.roll();
tool('blank').onclick = () => LK && LK.blank();
tool('bars').onchange = e => { LK.demo.bars = +e.target.value; LK.setDemo(LK.demo.on); };
tool('order').onchange = e => { LK.demo.order = e.target.value; C.store.set('livevis:demo', LK.demo); if (LK.demo.on) LK.setDemo(true); };
$('fxPadBtn') && ($('fxPadBtn').onclick = () => toggle(true));
$('padBtn') && ($('padBtn').onclick = () => toggle());
$('fxOffBtn') && ($('fxOffBtn').onclick = () => C.fx.allOff());
function syncTools() {
  tool('demo').classList.toggle('on', !!(LK && LK.demo.on)); tool('demo').textContent = LK && LK.demo.on ? '■ Demo' : '▶ Demo';
  if (LK) { tool('bars').value = String(LK.demo.bars); tool('order').value = LK.demo.order; }
  tool('auto').classList.toggle('on', C.fx.auto());
}

// ---------------- tiles ----------------
let tiles = [];          // { el, code, kind, id, on:()=>bool, press(mode), release() }
function tile(parent, o) {
  const el = document.createElement('button'); el.className = 'tile ' + (o.cls || '');
  if (o.hue != null) el.style.setProperty('--h', o.hue);
  const code = KEYS[tiles.length];
  el.innerHTML = `${o.thumb ? `<img alt="" loading="lazy" src="${o.thumb}" onerror="this.remove()">` : ''}<span class="lbl">${o.label}</span>${code ? `<kbd>${keyLabel(code)}</kbd>` : ''}${o.sub ? `<span class="sub">${typeof o.sub === 'function' ? o.sub() : o.sub}</span>` : ''}`;
  el.title = o.title || o.label;
  const t = Object.assign({ el, code }, o); tiles.push(t);
  // pointer: quick click = latch, hold > 250 ms = momentary, alt / right = solo
  let downT = 0, held = false, timer = 0;
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; downT = performance.now(); held = false;
    if (e.altKey && t.solo) { t.solo(); e.preventDefault(); downT = 0; return; }
    if (t.hold) timer = setTimeout(() => { held = true; t.hold(true); el.classList.add('held'); }, 250);
  });
  const up = () => { clearTimeout(timer); if (!downT) return; downT = 0; if (held) { t.hold(false); el.classList.remove('held'); } else t.press(); };
  el.addEventListener('pointerup', up); el.addEventListener('pointerleave', () => { if (held) up(); else { clearTimeout(timer); downT = 0; } });
  el.addEventListener('contextmenu', e => { e.preventDefault(); t.solo && t.solo(); });
  el.addEventListener('click', e => e.preventDefault());
  parent.appendChild(el); return t;
}
function row(title, note) { const r = document.createElement('div'); r.className = 'prow'; r.innerHTML = `<h4>${title}${note ? `<small>${note}</small>` : ''}</h4><div class="tiles"></div>`; body.appendChild(r); return r.querySelector('.tiles'); }

function pageEffects() {
  for (const cat of C.fx.cats()) {
    const box = row(cat);
    for (const f of C.fx.list.filter(f => f.cat === cat)) {
      tile(box, { kind: 'fx', id: f.key, label: f.label, hue: CAT_HUE[cat] ?? 200, thumb: `ui/thumbs/fx-${f.key}.jpg`,
        on: () => C.fx.on(f.key), solo: f.special ? null : () => C.fx.solo(f.key),
        press: () => C.fx.toggle(f.key), hold: f.special ? null : on => C.fx.set(f.key, on) });
    }
  }
}
function pageLooks() {
  if (!LK) return;
  const L = LK.all(), box0 = row('Loadouts', ' · Blank = no pack presets · Roll = random from every effect, scene, attractor, text style');
  tile(box0, { kind: 'look', id: 'blank', label: 'Blank', sub: 'no presets', hue: 220, cls: 'look', on: () => LK.current() === 'blank', press: () => LK.blank() });
  tile(box0, { kind: 'look', id: 'roll', label: '🎲 Roll', sub: () => { const r = L.find(l => l.rolled); return r ? r.name.replace(/^Roll \d+ · /, '') : 'random loadout'; }, hue: 300, cls: 'look', on: () => LK.current() === 'roll', press: () => { LK.roll(); render(); } });
  const groups = [['Generated looks', L.filter(l => !l.user && !l.mine && !l.loadout && !l.rolled)], ['Mine', L.filter(l => l.user || l.mine)]];
  for (const [g, list] of groups) {
    if (!list.length) continue;
    const box = row(g, g === 'Mine' ? ' · Save look in the Tune panel' : ' · from the tuning sweep (analysis/looks/sweep.js)');
    for (const l of list) tile(box, { kind: 'look', id: l.id, label: l.name, sub: (l.fx || []).length ? (l.fx.length + ' fx') : '', thumb: l.thumb, hue: l.hue ?? 30, cls: 'look',
      title: l.name + (l.tags ? ' · ' + l.tags.join(', ') : ''), on: () => LK.current() === l.id, press: () => LK.apply(l.id, { flash: true }) });
  }
}
const holdOvr = (kind, v) => { let prev = ''; return on => { if (on) { prev = C.ovr[kind]; C.setOverride(kind, v); } else C.setOverride(kind, prev); }; };
function pageModes() {
  const M = window.VIZ_MODES || { scenes: [], attractors: [] };
  let box = row('Particle scene', ' · where the particles gather');
  tile(box, { kind: 'mode', label: 'Pack', sub: 'per section', hue: 210, on: () => !C.ovr.scene, press: () => C.setOverride('scene', '') });
  for (const s of M.scenes) tile(box, { kind: 'mode', label: s, hue: 210, on: () => C.ovr.scene === s, press: () => C.setOverride('scene', C.ovr.scene === s ? '' : s), hold: holdOvr('scene', s) });
  box = row('Attractor', ' · the physics layer');
  tile(box, { kind: 'mode', label: 'Pack', sub: 'per section', hue: 150, on: () => !C.ovr.attractor, press: () => C.setOverride('attractor', '') });
  for (const a of M.attractors) tile(box, { kind: 'mode', label: a.label, hue: 150, on: () => C.ovr.attractor === a.key, press: () => C.setOverride('attractor', C.ovr.attractor === a.key ? '' : a.key) });
  box = row('Text style', ' · lyric typography (needs the timing file)');
  tile(box, { kind: 'mode', label: 'Auto', sub: 'per section', hue: 50, on: () => !C.style(), press: () => C.style('') });
  for (const s of C.styles()) tile(box, { kind: 'mode', label: s, hue: 50, on: () => C.style() === s, press: () => C.style(C.style() === s ? '' : s), hold: (() => { let prev = ''; return on => { if (on) { prev = C.style(); C.style(s); } else C.style(prev); }; })() });
  box = row('Switches');
  const sw = (label, k, hue) => tile(box, { kind: 'mode', label, hue, on: () => C.tune[k] > 0, press: () => C.setTune({ [k]: C.tune[k] > 0 ? 0 : 1 }) });
  tile(box, { kind: 'mode', label: 'Overlays everywhere', hue: 0, on: () => C.ovr.ovAll, press: () => C.setOverride('ovAll', !C.ovr.ovAll) });
  sw('Lyrics', 'lyricsOn', 60); sw('Grid', 'gridOn', 140); sw('Physics', 'physOn', 150); sw('Forms', 'formsOn', 40); sw('Fractal patches', 'patchesOn', 280); sw('Beat lock', 'beatLock', 20);
  tile(box, { kind: 'mode', label: 'Grid type', sub: () => ['square', 'hex', 'polar'][Math.round(C.tune.gridType)], hue: 140, on: () => false, press: () => C.setTune({ gridType: (Math.round(C.tune.gridType) + 1) % 3, gridOn: 1 }) });
}

// ---------------- Perform: XY pad + holds ----------------
const HOLDS = [
  { id: 'strobe', label: 'Strobe', sub: 'flash on every beat', vals: null },
  { id: 'freeze', label: 'Freeze', sub: 'long trails', vals: { trail: 1 } },
  { id: 'void',   label: 'Void', sub: 'particles only', vals: { formsOn: 0, physOn: 0, gridOn: 0 } },
  { id: 'burst',  label: 'Burst', sub: 'max reaction', vals: { react: 2, partSize: 2.2, glow: 2.5, chaos: 2 } },
  { id: 'mono',   label: 'Mono', sub: 'no colour', vals: { sat: 0 } },
  { id: 'invert', label: 'Invert', sub: 'hues +180°', vals: () => ({ hue: ((C.tune.hue + 360) % 360) - 180 }) },
  { id: 'order',  label: 'Order', sub: 'everything snaps to shape', vals: { orderBias: 0.5, chaos: 0.1 } },
  { id: 'chaos',  label: 'Chaos', sub: 'shapes dissolve', vals: { orderBias: -0.5, chaos: 2 } },
];
const holdState = {};
function hold(h, on) {
  if (on && !holdState[h.id]) {
    const vals = typeof h.vals === 'function' ? h.vals() : h.vals, prev = {};
    if (vals) { for (const k in vals) prev[k] = C.tune[k]; C.setTune(vals, false); }
    holdState[h.id] = { prev, lastBeat: -1 };
  } else if (!on && holdState[h.id]) { C.setTune(holdState[h.id].prev, false); delete holdState[h.id]; }
}
C.onFrame(S => { const s = holdState.strobe; if (s) { const b = Math.floor(S.beat); if (b !== s.lastBeat) { s.lastBeat = b; C.flash(); } } });
let xy = null;
function pagePerform() {
  const wrap = document.createElement('div'); wrap.className = 'perform'; body.appendChild(wrap);
  const area = document.createElement('div'); area.className = 'xy'; area.innerHTML = '<i></i><span class="xl">chaos ← → order</span><span class="yl">hue ↕</span><label><input type="checkbox"> latch</label>';
  wrap.appendChild(area);
  const dotEl = area.querySelector('i'), latch = area.querySelector('input');
  const at = e => { const r = area.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left)/r.width)), Math.max(0, Math.min(1, (e.clientY - r.top)/r.height))]; };
  const put = ([x, y]) => { dotEl.style.left = x*100 + '%'; dotEl.style.top = y*100 + '%'; C.setTune({ orderBias: -0.5 + x, chaos: 2*(1 - x), hue: (0.5 - y)*360 }, false); };
  area.addEventListener('pointerdown', e => { if (e.target === latch) return; area.setPointerCapture(e.pointerId); if (!xy) xy = { prev: { orderBias: C.tune.orderBias, chaos: C.tune.chaos, hue: C.tune.hue } }; put(at(e)); area.classList.add('on'); });
  area.addEventListener('pointermove', e => { if (xy && area.hasPointerCapture(e.pointerId)) put(at(e)); });
  area.addEventListener('pointerup', () => { area.classList.remove('on'); if (!latch.checked && xy) { C.setTune(xy.prev, false); xy = null; } });
  const box = document.createElement('div'); box.className = 'tiles holds'; wrap.appendChild(box);
  for (const h of HOLDS) tile(box, { kind: 'hold', id: h.id, label: h.label, sub: h.sub, hue: 0, cls: 'holdt', on: () => !!holdState[h.id],
    press: () => hold(h, !holdState[h.id]), hold: on => hold(h, on), title: h.label + ': hold (mouse or Shift+key) to play it, click to latch' });
  const help = document.createElement('p'); help.className = 'note'; help.innerHTML = 'Hold a tile (or Shift+its key) to play it only while held; click to latch. Drag the square: left = chaos, right = order, up/down = hue. <b>Releasing restores</b> your settings unless latched.';
  wrap.appendChild(help);
}

function render() {
  tiles = []; body.innerHTML = '';
  nav.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.p === st.page));
  ({ Effects: pageEffects, Looks: pageLooks, Modes: pageModes, Perform: pagePerform })[st.page]();
  syncTools(); refresh(true);
}
let lastSig = '';
function refresh(force) {
  const sig = tiles.map(t => (t.on() ? 1 : 0)).join('') + '|' + (C.fx.soloKey() || '');
  if (!force && sig === lastSig) return; lastSig = sig;
  for (const t of tiles) { t.el.classList.toggle('on', !!t.on()); t.el.classList.toggle('solo', t.kind === 'fx' && C.fx.soloKey() === t.id);
    if (typeof t.sub === 'function') { const s = t.el.querySelector('.sub'); if (s) s.textContent = t.sub(); } }
}
C.onFrame(S => {
  if (!st.open) return;
  pad.style.setProperty('--kick', (C.bands.kick || 0).toFixed(3));
  refresh(false);
  const sec = C.pack().sections[S.k], m = Math.floor(S.t/60), s = String(Math.floor(S.t % 60)).padStart(2, '0');
  const lk = LK ? LK.all().find(l => l.id === LK.current()) : null, txt = `${m}:${s} · ${sec ? sec.name : ''}${lk ? ' · look: ' + lk.name : ''}`;
  const nowEl = $('padNow'); if (nowEl.textContent !== txt) nowEl.textContent = txt;
});
LK && LK.onChange(() => { if (st.open) { if (st.page === 'Looks') render(); else syncTools(); } });

function toggle(on) {
  st.open = on == null ? !st.open : !!on;
  pad.classList.toggle('hidden', !st.open); pad.classList.toggle('compact', st.compact);
  const b = $('padBtn'); if (b) { b.classList.toggle('on', st.open); b.setAttribute('aria-pressed', String(st.open)); }
  if (st.open) { layout(); render(); $('fx').classList.add('hidden'); }
}

// ---------------- keys (called first by index.html's keydown) ----------------
const downCodes = new Map();
function key(e) {
  if (e.type !== 'keydown') return false;
  if (e.key === '?' ) { help(); return true; }
  if (e.code === 'KeyP' && !e.ctrlKey && !e.metaKey) { toggle(); return true; }
  if (LK) {
    if (e.code === 'BracketRight') { LK.step(1); return true; }
    if (e.code === 'BracketLeft') { LK.step(-1); return true; }
    if (e.code === 'Backslash') { LK.random(); return true; }
    if (e.code === 'Backspace') { LK.apply('mine', { flash: false }); return true; }
    if (e.code === 'KeyD' && !st.open) { LK.setDemo(); return true; }
    if (e.code === 'KeyR' && !st.open && !e.ctrlKey && !e.metaKey) { LK.roll(); return true; }
    if (e.code === 'KeyB' && !st.open) { LK.blank(); return true; }
  }
  if (!st.open) return false;
  if (e.code === 'Escape') { toggle(false); return true; }
  if (e.code === 'Tab') { e.preventDefault(); const i = PAGES.indexOf(st.page); st.page = PAGES[(i + (e.shiftKey ? -1 : 1) + PAGES.length) % PAGES.length]; save(); render(); return true; }
  const t = tiles.find(t => t.code === e.code); if (!t) return false;
  e.preventDefault(); if (e.repeat) return true;
  if (e.altKey && t.solo) t.solo();
  else if (e.shiftKey && t.hold) { t.hold(true); t.el.classList.add('held'); downCodes.set(e.code, t); }
  else t.press();
  return true;
}
addEventListener('keyup', e => { const t = downCodes.get(e.code); if (t) { downCodes.delete(e.code); t.hold(false); t.el.classList.remove('held'); } });
addEventListener('blur', () => { for (const t of downCodes.values()) t.hold(false); downCodes.clear(); });

// ---------------- ? : every shortcut ----------------
let helpEl = null;
function help() {
  if (!helpEl) {
    helpEl = document.createElement('div'); helpEl.id = 'keyhelp'; helpEl.className = 'hidden';
    helpEl.innerHTML = `<div><h3>Keys</h3><table>
      <tr><td>Space</td><td>play / pause</td></tr><tr><td>← →</td><td>seek 5 s</td></tr><tr><td>P</td><td>Pad (grid of everything)</td></tr>
      <tr><td>Tab</td><td>next Pad page (in the Pad)</td></tr><tr><td>1–0 Q–O A–L Z–.</td><td>the tiles of the open Pad page</td></tr>
      <tr><td>Shift + tile key</td><td>play it only while held</td></tr><tr><td>Alt + tile key</td><td>solo an effect</td></tr>
      <tr><td>[ ]</td><td>previous / next look</td></tr><tr><td>\\</td><td>random look</td></tr><tr><td>Backspace</td><td>back to my tuning</td></tr>
      <tr><td>R</td><td>Roll: random loadout from everything (Pad closed)</td></tr><tr><td>B</td><td>Blank: no pack presets (Pad closed)</td></tr><tr><td>D</td><td>Demo autopilot (Pad closed; set it to “roll” for endless random)</td></tr><tr><td colspan="2" class="hr">Pad closed:</td></tr>
      <tr><td>1–9 J K</td><td>effects on demand · K spawns a fractal patch</td></tr><tr><td>0</td><td>all on-demand effects off</td></tr>
      <tr><td>T / E</td><td>Tune / Effects panels</td></tr><tr><td>M / U</td><td>mark section / undo</td></tr><tr><td>H</td><td>hide UI</td></tr><tr><td>F</td><td>fullscreen</td></tr>
      <tr><td>?</td><td>this list</td></tr></table><p class="note">Click anywhere to close.</p></div>`;
    helpEl.onclick = () => helpEl.classList.add('hidden'); document.body.appendChild(helpEl);
  }
  helpEl.classList.toggle('hidden');
}

const css = document.createElement('style');
css.textContent = `
.pad { position:fixed; left:16px; right:16px; top:84px; bottom:118px; z-index:20; display:flex; flex-direction:column; gap:8px; background:rgba(8,10,20,.72); border:1px solid rgba(255,255,255,.14); border-radius:14px; padding:10px 12px; backdrop-filter:blur(4px); transition:opacity .2s; --kick:0; }
.pad.hidden { opacity:0; pointer-events:none; }

.pad { min-height:0; min-width:0; } .padbody { flex:1; min-height:0; }
.padgrip { position:absolute; z-index:2; touch-action:none; }
.pad[data-dock=bottom] .padgrip { left:0; right:0; top:-5px; height:10px; cursor:ns-resize; }
.pad[data-dock=top] .padgrip { left:0; right:0; bottom:-5px; height:10px; cursor:ns-resize; }
.pad[data-dock=left] .padgrip { top:0; bottom:0; right:-5px; width:10px; cursor:ew-resize; }
.pad[data-dock=right] .padgrip { top:0; bottom:0; left:-5px; width:10px; cursor:ew-resize; }
.pad[data-dock=full] .padgrip { display:none; }
.padgrip::after { content:""; position:absolute; inset:3px; border-radius:3px; background:rgba(255,138,61,0); transition:background .15s; }
.padgrip:hover::after, .pad.resizing .padgrip::after { background:rgba(255,138,61,.6); }
.pad.resizing { transition:none; user-select:none; }
.padsize { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:var(--muted); }
.padsize input { width:84px; accent-color:var(--ember); } .padsize input:disabled { opacity:.35; } .padsize output { min-width:28px; font-variant-numeric:tabular-nums; }
.pad.side .perform { grid-template-columns:1fr; }
.pad.side header { gap:6px; } .pad.side #padNow { flex-basis:100%; order:3; }
#padBtn.on { border-color:var(--ember); color:var(--ember); background:rgba(255,138,61,.12); }
.pad header { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.pad nav { display:flex; gap:4px; } .pad .tab { font-size:12px; padding:4px 12px; border-radius:14px; }
.pad .tab.on { background:rgba(255,138,61,.18); border-color:var(--ember); color:#ffc49a; }
.pad #padNow { flex:1; color:var(--muted); font-size:12px; font-variant-numeric:tabular-nums; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:120px; }
.pad .padtools { display:flex; gap:4px; flex-wrap:wrap; } .pad .padtools .on { border-color:var(--ember); color:var(--ember); }
.padbody { overflow:auto; display:grid; gap:8px; align-content:start; }
.prow h4 { margin:2px 0 4px; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); font-weight:600; } .prow h4 small { letter-spacing:0; text-transform:none; font-weight:400; opacity:.8; }
.tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(118px, 1fr)); gap:6px; }
.pad.compact .tiles { grid-template-columns:repeat(auto-fill, minmax(96px, 1fr)); }
.tile { position:relative; height:64px; padding:6px 8px; text-align:left; display:flex; flex-direction:column; justify-content:flex-end; overflow:hidden; border-radius:10px;
  background:linear-gradient(160deg, hsla(var(--h,200),60%,22%,.85), hsla(calc(var(--h,200) + 40),50%,10%,.9)); border:1px solid hsla(var(--h,200),60%,60%,.25); touch-action:none; user-select:none; }
.pad.compact .tile { height:46px; }
.tile img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.55; pointer-events:none; transition:opacity .2s; }
.tile .lbl { position:relative; font-size:12px; line-height:1.15; text-shadow:0 1px 4px #000, 0 0 10px #000; }
.tile .sub { position:relative; font-size:10px; color:var(--muted); text-shadow:0 1px 3px #000; }
.tile kbd { position:absolute; top:5px; right:6px; background:rgba(0,0,0,.45); }
.tile:hover img { opacity:.8; }
.tile.on { border-color:var(--ember); box-shadow:0 0 calc(6px + 22px*var(--kick)) rgba(255,138,61,calc(.35 + .5*var(--kick))), inset 0 0 0 1px var(--ember); }
.tile.on img { opacity:.95; } .tile.on .lbl { color:#fff; }
.tile.held { transform:scale(.97); } .tile.solo { box-shadow:0 0 0 2px var(--cyan), 0 0 18px rgba(62,232,224,.5); }
.tile.look { height:78px; } .pad.compact .tile.look { height:54px; }
.perform { display:grid; grid-template-columns:minmax(200px, 320px) 1fr; gap:12px; align-items:start; }
.perform .note { grid-column:1 / -1; margin:0; }
.xy { position:relative; aspect-ratio:1; border-radius:12px; border:1px solid rgba(255,255,255,.18); touch-action:none; cursor:crosshair;
  background:linear-gradient(90deg, rgba(255,80,80,.18), rgba(80,255,200,.18)), linear-gradient(180deg, hsla(180,80%,50%,.25), hsla(0,80%,50%,.25)); }
.xy i { position:absolute; left:50%; top:50%; width:22px; height:22px; margin:-11px; border-radius:50%; background:#fff; box-shadow:0 0 16px #fff; opacity:.4; }
.xy.on i { opacity:1; } .xy .xl, .xy .yl { position:absolute; font-size:10px; color:var(--muted); } .xy .xl { bottom:6px; left:8px; } .xy .yl { top:6px; left:8px; }
.xy label { position:absolute; right:8px; bottom:6px; font-size:11px; color:var(--muted); }
.holds .tile { height:72px; }
#keyhelp { position:fixed; inset:0; z-index:40; display:grid; place-items:center; background:rgba(5,6,15,.6); } #keyhelp.hidden { display:none; }
#keyhelp > div { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px 20px; max-width:min(520px, calc(100vw - 32px)); }
#keyhelp h3 { margin:0 0 8px; font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:var(--muted); }
#keyhelp td { padding:2px 12px 2px 0; font-size:13px; } #keyhelp td:first-child { font-family:ui-monospace, Consolas, monospace; color:#ffc49a; white-space:nowrap; } #keyhelp .hr { color:var(--muted); padding-top:8px; font-family:inherit !important; }
@media (max-width: 640px) { .pad { left:8px; right:8px; top:8px; bottom:96px; } .perform { grid-template-columns:1fr; } .tiles { grid-template-columns:repeat(auto-fill, minmax(92px, 1fr)); } }
`;
document.head.appendChild(css);

window.LVPad = { key, toggle, render, packChanged: () => { if (st.open) render(); }, state: st };
})();
