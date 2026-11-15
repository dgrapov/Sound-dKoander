// Focus view (2026-11-15, D: "one shortcut to hide all controls and overlays and just focus on the visuals, closing the
// console logs as well"). Z cycles:  all on  →  visuals + lyrics  →  visuals only  →  all on.   Esc returns to all on.
// Hides the tool's controls (LVC.hideUI), the section title, the meters, both consoles and their dock buttons; the last step
// hides the lyrics too. Nothing is lost: Z or Esc brings everything back where it was.
(() => {
const css = `body.tyb-zen #hud,body.tyb-zen #meters,body.tyb-zen #godConsole{display:none!important}
body.tyb-zen-all #tybLyr,body.tyb-zen-all #lyric,body.tyb-zen-all #lyricStage,body.tyb-zen-all #typefx{display:none!important}
#tybToast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:30;pointer-events:none;font:12px ui-monospace,Consolas,monospace;color:#19e3ff;
  background:rgba(7,6,15,.8);border:1px solid rgba(25,227,255,.3);border-radius:6px;padding:5px 12px;opacity:0;transition:opacity .4s}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
let mode = 0, toastEl, tt;
const NAMES = ['all on', 'focus: visuals + lyrics', 'focus: visuals only'];
function toast(m) { if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'tybToast'; document.body.appendChild(toastEl); } toastEl.textContent = m + '   (Z / Esc)'; toastEl.style.opacity = 1; clearTimeout(tt); tt = setTimeout(() => toastEl.style.opacity = 0, 1400); }
function set(m) {
  mode = m; const C = window.LVC;
  document.body.classList.toggle('tyb-zen', m > 0); document.body.classList.toggle('tyb-zen-all', m === 2);
  if (C && C.hideUI) C.hideUI(m > 0);
  toast(NAMES[m]);
}
window.TYBView = { set, mode: () => mode };
addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
  if (e.code === 'KeyZ') { set((mode + 1) % 3); e.preventDefault(); e.stopImmediatePropagation(); }
  else if (e.code === 'Escape' && mode) { set(0); }
}, true);
function dock() { const ctl = document.getElementById('controls'); if (!ctl) return setTimeout(dock, 200);
  if (document.getElementById('tybFocus')) return; const b = document.createElement('button'); b.id = 'tybFocus'; b.className = 'tybdock'; b.textContent = '◎ focus';
  b.title = 'Hide everything but the visuals (Z cycles: all → visuals + lyrics → visuals only; Esc returns)'; b.onclick = () => set(1);
  ctl.insertBefore(b, document.getElementById('dockMin') || null); }
dock();
})();
