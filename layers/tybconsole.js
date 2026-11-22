(() => {
if (window.TYBConsole) return;
const FONTS = [['mono', 'ui-monospace, Consolas, "Space Mono", monospace'], ['sans', 'system-ui, "Segoe UI", Inter, sans-serif'], ['serif', 'Georgia, "Times New Roman", serif']];
const css = `
.tybc{position:fixed;top:96px;pointer-events:none;z-index:5;line-height:1.5;border-radius:8px;overflow:hidden;
  border:1px solid var(--acc33);box-shadow:0 0 24px var(--acc1f);backdrop-filter:blur(2px)}
.tybc .bar{cursor:grab;user-select:none;pointer-events:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;height:20px;line-height:20px;padding:0 9px;font:10px ui-monospace,Consolas,monospace;
  letter-spacing:.08em;color:#ffb020;border-bottom:1px solid var(--acc33);background:var(--acc10)}
.tybc .tools{display:flex;gap:1px;pointer-events:auto;opacity:.4;transition:opacity .2s;flex-wrap:nowrap}
.tybc:hover .tools{opacity:1}
.tybc .tools button{all:unset;cursor:pointer;font:10px ui-monospace,Consolas,monospace;color:#19e3ff;padding:0 4px;border-radius:3px;line-height:18px}
.tybc .tools button:hover,.tybc .tools button.on{background:rgba(25,227,255,.18);color:#fff}
.tybc .body{padding:6px 10px 7px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end}
.tybc .ln{display:block;color:#ddd8f2;overflow:hidden;flex:0 0 auto}
.tybc.cut .ln{white-space:nowrap;text-overflow:ellipsis}
.tybc.wrap .ln{white-space:pre-wrap;word-break:break-word;padding-left:2ch;text-indent:-2ch;margin-bottom:.18em}
.tybc .grip{position:absolute;right:0;bottom:0;width:14px;height:14px;cursor:nwse-resize;pointer-events:auto;opacity:.3;
  background:linear-gradient(135deg,transparent 50%,var(--acc) 50%)}
.tybc .ln.hd{color:#19e3ff;text-shadow:0 0 6px rgba(25,227,255,.55);margin-top:.3em}
.tybc .ln.mn{color:#f4d6ff}
.tybc .ln.mn .x-cm{color:rgba(255,190,240,.9);font-style:italic}
.tybc .ln.em{color:#ffe7b0}
.tybc .ln.em .x-st{color:#ffb020;text-shadow:0 0 8px rgba(255,176,32,.6)}
.tybc .ln.sub .x-st{text-decoration:line-through;text-decoration-color:rgba(255,46,136,.8);color:rgba(255,231,176,.75)}
.tybc .ln.mu{color:#fff7d6;text-shadow:0 0 10px rgba(255,176,32,.9);letter-spacing:.2em}
.tybc .ln.wn{background:rgba(255,46,136,.10)}
.tybc .ln.hr{color:#bff6ff}
.tybc .ln.hr .x-cm{color:rgba(160,240,255,.85);font-style:italic}
.tybc .ln.ck{color:rgba(255,176,32,.9);font-style:italic}
.tybc .ln.on{color:#b6ff3b}
.tybc .ln.off{color:rgba(255,120,190,.9)}
.tybc .ln.ms{color:#e9e5ff}.tybc .ln.ms .x-k{color:#ffb020}
.tybc .ln.fl{color:#fff;font-style:italic}
.tybc .x-ad{color:rgba(167,159,214,.5)}.tybc .x-kw{color:#19e3ff;font-weight:700}.tybc .x-fn{color:#ff7ac6}
.tybc .x-st{color:#ffd58a}.tybc .x-nu{color:#ffb020}.tybc .x-k{color:#fff7d6;font-weight:700}.tybc .x-op{color:#a79fd6}
.tybc .x-cm{color:rgba(214,206,240,.6);font-style:italic}.tybc .x-bad{color:#ff2e88;font-weight:700}.tybc .x-id{color:#e6e1f7}
.tybc .cur{display:inline-block;width:.6em;height:1.05em;vertical-align:-.15em;background:var(--acc);box-shadow:0 0 6px var(--acc);animation:tybb 1s steps(1) infinite}
@keyframes tybb{50%{opacity:0}}
.tybc.col .body,.tybc.col .grip{display:none}
body.tyb-zen .tybc,body.tyb-zen .tybdock{display:none!important}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const KW = /^(hear|see|show|measure|feel|check|cue|BOOT|LOAD|JMP|GOTO|HALT|RET|assert|remove|keep|restore|upload|bisect|act|observe|find|test|add|say)$/;
const KC = /^(TRUE|FALSE|NULL|ok|GOLD|here|mu|NO_SOUL|whole)$/;
const BAD = /^(WRONG|REJECTED|NOT|FOUND)$/;
const TOK = /(\s;\s.*$|^\/\/.*$|\s\/\/.*$)|("[^"]*"?)|(0x[0-9A-Fa-f]+)|(\d+(?:\.\d+)?%?)|(:=|->|<->|==|!=|\+=|-=|\+\+|[=<>→↓*/!(){}\[\];,|.·…])|([\p{L}_#][\p{L}\p{N}_#]*)/gu;
function hl(src) {
  let h = '', m, last = 0, first = true; TOK.lastIndex = 0;
  while ((m = TOK.exec(src))) {
    h += esc(src.slice(last, m.index)); last = TOK.lastIndex;
    const [x, cm, s, hex, num, op, id] = m; let c;
    if (cm) c = 'x-cm'; else if (s) c = 'x-st'; else if (hex) c = first ? 'x-ad' : 'x-nu'; else if (num) c = 'x-nu'; else if (op) c = 'x-op';
    else if (BAD.test(id)) c = 'x-bad'; else if (KW.test(id)) c = 'x-kw'; else if (KC.test(id)) c = 'x-k'; else if (src[TOK.lastIndex] === '(') c = 'x-fn'; else c = 'x-id';
    first = false; h += `<span class="${c}">${esc(x)}</span>`;
  }
  return h + esc(src.slice(last));
}
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };

const LK = 'livevis:tyb:layout', MODES = ['dock', 'overlap', 'hidden'];
const TL = window.TYBLayout = {
  mode: (() => { try { const m = localStorage.getItem(LK); return MODES.includes(m) ? m : 'dock'; } catch (e) { return 'dock'; } })(),
  last: 'dock', cur: { l: 0, r: 0 }, btn: null,
  eff() { return this.mode === 'dock' && (innerWidth < 1100 || this.tooNarrow) ? 'overlap' : this.mode; },
  set(m) { if (!MODES.includes(m)) return; if (m !== 'hidden') this.last = m; this.mode = m; try { localStorage.setItem(LK, m); } catch (e) {} document.body.classList.toggle('tyb-lay-hidden', m === 'hidden'); this.label(); },
  next() { this.set(MODES[(MODES.indexOf(this.mode) + 1) % 3]); },
  label() { if (this.btn) { this.btn.textContent = '▥ ' + this.mode; this.btn.title = 'Panel layout: dock / overlap / hidden (Tab)'; } },
  button() { if (this.btn) return; const ctl = document.getElementById('controls'); if (!ctl) return; this.btn = document.createElement('button'); this.btn.className = 'tybdock'; this.btn.onclick = () => this.next(); ctl.insertBefore(this.btn, document.getElementById('dockMin') || null); this.label(); },
  rect() { return { x: this.cur.l, y: 0, w: Math.max(200, innerWidth - this.cur.l - this.cur.r), h: innerHeight }; },
};
{ const st = document.createElement('style'); st.textContent = 'body.tyb-lay-hidden .tybc{display:none!important}'; document.head.appendChild(st);
  document.body && document.body.classList.toggle('tyb-lay-hidden', TL.mode === 'hidden'); addEventListener('DOMContentLoaded', () => document.body.classList.toggle('tyb-lay-hidden', TL.mode === 'hidden'));
  let t0 = 0;
  const tick = (ts) => {
    const dt = Math.min(0.5, (ts - t0) / 1000 || 0.016); t0 = ts;
    let l = 0, r = 0; TL.tooNarrow = false;
    if (TL.mode === 'dock' && innerWidth >= 1100) { for (const a of (window.__tybConsoles || [])) { const d = a && a.dockInfo && a.dockInfo(); if (!d) continue; if (d.side === 'right') r = Math.max(r, d.w + 24); else l = Math.max(l, d.w + 24); }
      if (innerWidth - l - r < 520) { TL.tooNarrow = true; l = r = 0; } }
    const k = 1 - Math.exp(-dt / 0.1); TL.cur.l += (l - TL.cur.l) * k; TL.cur.r += (r - TL.cur.r) * k; if (Math.abs(TL.cur.l - l) < 0.4) TL.cur.l = l; if (Math.abs(TL.cur.r - r) < 0.4) TL.cur.r = r;
    const R_ = TL.rect(), de = document.documentElement.style; de.setProperty('--stcx', (R_.x + R_.w / 2).toFixed(1) + 'px'); de.setProperty('--stw', R_.w.toFixed(1) + 'px'); de.setProperty('--strr', TL.cur.r.toFixed(1) + 'px');
    window.TYBStage = R_; requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  addEventListener('keydown', (e) => { if (e.code !== 'Tab' || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || /INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target && e.target.tagName) || '')) return;
    const C = window.LVC; if (!C || !C.pack() || !(window.__tybConsoles || []).length) return; TL.next(); e.preventDefault(); e.stopImmediatePropagation(); }, true);
}
window.TYBConsole = {
  make(o) {
    const D = Object.assign({ console: true, cw: 460, ch: 260, cf: 12, wrap: true, font: 0, bg: 0.72, x: null, y: null, col: false, anchor: 'left' }, o.defaults || {});
    const load = () => { try { return Object.assign({}, D, JSON.parse(localStorage.getItem(o.prefKey) || '{}')); } catch (e) { return Object.assign({}, D); } };
    const P = load(), save = () => { try { localStorage.setItem(o.prefKey, JSON.stringify(P)); } catch (e) {} };
    let lines = [], el, body, dock, built = false;
    function build() {
      if (built) return; built = true;
      el = document.createElement('div'); el.className = 'tybc'; el.id = o.id;
      el.style.setProperty('--acc', o.accent); el.style.setProperty('--acc33', hexA(o.accent, .33)); el.style.setProperty('--acc1f', hexA(o.accent, .12)); el.style.setProperty('--acc10', hexA(o.accent, .08));
      el.innerHTML = `<div class="bar"><span>${esc(o.title)}</span><span class="tools">
        <button data-g="f-" title="Smaller text">A−</button><button data-g="f+" title="Larger text">A+</button><button data-g="wrap" title="Wrap long lines">↵</button>
        <button data-g="pin" title="Pinned: sits in the side column and the stage makes room. Click to float it over the picture.">⌖</button><button data-g="col" title="Collapse / expand">▾</button><button data-g="x" title="Hide">✕</button></span></div><div class="body"></div><div class="grip" title="Drag to resize"></div>`;
      body = el.querySelector('.body');
      el.querySelector('.tools').addEventListener('click', (e) => { const g = e.target.dataset && e.target.dataset.g; if (!g) return; e.stopPropagation();
        if (g === 'x') return api.show(false);
        if (g === 'pin') P.pin = P.pin === false; else if (g === 'wrap') P.wrap = !P.wrap; else if (g === 'col') P.col = !P.col; else P.cf += g[1] === '+' ? 1 : -1;
        style(); save(); });
      const bar = el.querySelector('.bar');
      bar.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; e.preventDefault(); bar.setPointerCapture(e.pointerId); bar.style.cursor = 'grabbing';
        const r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
        const move = (ev) => { if (P.pin !== false && TL.eff() === 'dock') P.pin = false; P.x = Math.max(0, Math.min(innerWidth - 80, ev.clientX - ox)); P.y = Math.max(0, Math.min(innerHeight - 30, ev.clientY - oy)); style(); };
        const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.style.cursor = ''; save(); };
        bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); });
      bar.addEventListener('dblclick', () => { P.x = null; P.y = null; P.pin = true; style(); save(); });
      const grip = el.querySelector('.grip');
      grip.addEventListener('pointerdown', (e) => { e.preventDefault(); grip.setPointerCapture(e.pointerId); const r = el.getBoundingClientRect();
        const move = (ev) => { P.cw = ev.clientX - r.left; P.ch = ev.clientY - r.top - 30; style(); };
        const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); save(); };
        grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); });
      const ctl = document.getElementById('controls');
      if (ctl && o.button) { dock = document.createElement('button'); dock.className = 'tybdock'; dock.textContent = o.button; dock.title = `Show / hide ${o.title} (${o.key ? o.key.replace('Key', '') : ''})`;
        dock.onclick = () => { if (TL.mode === 'hidden') { TL.set(TL.last); api.show(true); } else api.show(!P.console); }; ctl.insertBefore(dock, document.getElementById('dockMin') || null); }
      document.body.appendChild(el); style(); addEventListener('resize', style);
    }
    function style() {
      if (!el) return;
      P.cf = Math.max(9, Math.min(22, Math.round(P.cf))); P.cw = Math.max(240, Math.min(innerWidth - 16, Math.round(P.cw))); P.ch = Math.max(60, Math.min(innerHeight - 120, Math.round(P.ch)));
      el.style.width = P.cw + 'px'; el.style.fontSize = P.cf + 'px'; el.style.fontFamily = FONTS[P.font || 0][1];
      el.style.background = `linear-gradient(180deg,rgba(7,6,15,${P.bg}),rgba(21,10,51,${P.bg * 0.85}))`;
      el.classList.toggle('wrap', !!P.wrap); el.classList.toggle('cut', !P.wrap); el.classList.toggle('col', !!P.col);
      body.style.height = P.ch + 'px';
      for (const b of el.querySelectorAll('[data-g=wrap]')) b.classList.toggle('on', !!P.wrap);
      for (const b of el.querySelectorAll('[data-g=pin]')) b.classList.toggle('on', P.pin !== false);
      for (const b of el.querySelectorAll('[data-g=col]')) b.textContent = P.col ? '▸' : '▾';
      position(); draw();
    }
    function position() {
      if (!el) return;
      if (P.x != null && !(P.pin !== false && TL.eff() === 'dock')) { el.style.left = P.x + 'px'; el.style.top = P.y + 'px'; el.style.right = 'auto'; el._top = null; return; }
      if (P.anchor === 'right') { const mt = document.getElementById('meters'), mr = mt && mt.getBoundingClientRect(), mv = mr && mr.height > 0 && getComputedStyle(mt).display !== 'none';
        let top = mv ? Math.round(mr.bottom + 10) : 16;
        if (o.order) { const prev = (window.__tybConsoles || []).slice(0, o.order).reverse().find((c) => c && c.right && c.right() && c.el() && c.el().style.display !== 'none' && c.el().getBoundingClientRect().height); if (prev) top = Math.round(prev.el().getBoundingClientRect().bottom + 10); }
        el.style.left = 'auto'; el.style.right = '16px'; el._top = top; el.style.top = top + 'px'; return; }
      const hud = document.getElementById('hud'), r = hud && hud.getBoundingClientRect(), hv = r && r.height > 0 && getComputedStyle(hud).display !== 'none' && !document.body.classList.contains('tyb-zen');
      let top = hv ? Math.round(r.bottom + 10) : 16;
      if (o.order) { const above = (window.__tybConsoles || [])[o.order - 1]; const ae = above && above.el(); if (ae && ae.style.display !== 'none') { const ar = ae.getBoundingClientRect(); if (ar.height) top = Math.round(ar.bottom + 10); } }
      el.style.left = '16px'; el.style.right = 'auto'; if (el._top !== top) { el._top = top; el.style.top = top + 'px'; }
    }
    function draw() {
      if (!body) return;
      const shown = lines.slice(-40), n = shown.length;
      body.innerHTML = shown.map((L, i) => `<span class="ln ${L.cls}" style="opacity:${(0.35 + 0.65 * Math.pow((i + 1) / n, 1.4)).toFixed(2)}">${L.cls === 'hd' || L.cls === 'mu' ? esc(L.text) : hl(L.text)}</span>`).join('') + '<span class="ln"><span class="cur"></span></span>';
    }
    const api = {
      out(text, cls = '') { lines.push({ text, cls }); if (lines.length > 80) lines.shift(); draw(); },
      reset() { lines = []; draw(); },
      show(on) { P.console = !!on; save(); build(); el.style.display = on ? '' : 'none'; if (dock) dock.classList.toggle('on', !!on); },
      visible: () => P.console,
      right: () => P.anchor === 'right' && P.x == null,
      dockInfo() { if (!el || !P.console || el.style.display === 'none' || P.pin === false || TL.eff() !== 'dock') return null; return { side: P.anchor === 'right' ? 'right' : 'left', w: Math.min(P.cw, innerWidth * 0.3) }; },
      el: () => el,
      place(active) {
        if (!active) { if (el) el.style.display = 'none'; if (dock) dock.style.display = 'none'; return; }
        build(); el.style.display = P.console ? '' : 'none'; TL.button(); if (dock) { dock.style.display = ''; dock.classList.toggle('on', P.console); }
        position();
      },
    };
    if (o.key) addEventListener('keydown', (e) => {
      const C = window.LVC; if (!C || !C.pack() || C.pack().id !== o.pack) return;
      if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
      if (window.LVPad && LVPad.state && LVPad.state.open) return;
      if (e.code === o.key) { if (TL.mode === 'hidden') { TL.set(TL.last); api.show(true); } else api.show(!P.console); e.stopImmediatePropagation(); e.preventDefault(); }
    }, true);
    (window.__tybConsoles = window.__tybConsoles || [])[o.order || 0] = api;
    return api;
  },
};
})();
