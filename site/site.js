// Sound dKoander: public site layer (loaded after the packs, before the player starts).
// 1) picks the song from ?song=<id> (or the first in SITE_SONGS), 2) preloads its timing (word-by-word lyrics),
// 3) shows a start card: play the hosted audio, or load your own copy, or preview without audio.
// The player itself is unchanged: this only drives its own controls (#file, #play) like a person would.
(() => {
const SONGS = window.SITE_SONGS || [];
const q = new URLSearchParams(location.search);
const song = SONGS.find((s) => s.id === q.get('song')) || SONGS[0];
if (!song) return;
try {
  localStorage.setItem('livevis:lastPack', JSON.stringify(song.id));
  const T = window.VIZ_TIMING && window.VIZ_TIMING[song.id], k = 'livevis:' + song.id + ':timing';
  const cur = JSON.parse(localStorage.getItem(k) || 'null');
  if (T && (!cur || cur._site !== T._site || q.has('fresh'))) {
    localStorage.setItem(k, JSON.stringify(T));
    localStorage.removeItem('livevis:' + song.id + ':starts');
  }
} catch (e) {}

const css = `
#siteCard{position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;background:rgba(5,4,12,.72);backdrop-filter:blur(6px);font:15px/1.5 Inter,system-ui,sans-serif;color:#f4efe6}
#siteCard .box{width:min(560px,92vw);background:rgba(14,10,28,.92);border:1px solid rgba(255,255,255,.12);border-radius:14px;overflow:hidden;box-shadow:0 20px 80px rgba(0,0,0,.6)}
#siteCard img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#07060f}
#siteCard .in{padding:18px 22px 20px}
#siteCard h1{margin:0 0 4px;font-weight:300;letter-spacing:.18em;font-size:20px;text-transform:uppercase}
#siteCard p{margin:6px 0 12px;color:rgba(244,239,230,.75)}
#siteCard .row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
#siteCard button,#siteCard a.b{all:unset;cursor:pointer;padding:9px 14px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06)}
#siteCard button.main{background:#ff2e88;border-color:#ff2e88;color:#fff}
#siteCard button:hover,#siteCard a.b:hover{background:rgba(255,255,255,.14)}
#siteCard button.main:hover{background:#ff4d9a}
#siteCard .keys{font-size:12.5px;color:rgba(244,239,230,.55)}
#siteCard .songs{display:flex;gap:6px;flex-wrap:wrap;font-size:13px}
#siteCard .songs a{color:#19e3ff;text-decoration:none}
#siteCard kbd{font:inherit;border:1px solid rgba(255,255,255,.25);border-radius:4px;padding:0 4px}`;

function card() {
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'siteCard';
  const others = SONGS.filter((s) => s.id !== song.id);
  el.innerHTML = `<div class="box">${song.cover ? `<img src="${song.cover}" alt="">` : ''}<div class="in">
    <h1>${song.title}</h1><p>${song.blurb || ''}</p>
    <div class="row">
      ${song.audio ? '<button class="main" id="sPlay">▶ Play</button>' : ''}
      <button ${song.audio ? '' : 'class="main"'} id="sLoad">${song.audio ? 'Use my own copy' : '▶ Load the song file'}</button>
      <button id="sPreview">Preview without audio</button>
    </div>
    <p class="keys" id="sNote">${song.audio ? '' : (song.audioNote || 'This site ships the visuals and analysis only. Load your copy of the song to play it in sync.')}</p>
    <p class="keys"><kbd>Space</kbd> play · <kbd>Z</kbd> visuals only · <kbd>L</kbd> lyrics position · <kbd>C</kbd> <kbd>V</kbd> <kbd>N</kbd> consoles · <kbd>H</kbd> hide UI · <kbd>F</kbd> fullscreen</p>
    ${song.youtube ? `<p class="keys"><a class="b" style="padding:4px 9px" href="${song.youtube}" target="_blank" rel="noopener">▶ Watch the video on YouTube</a> <a class="b" style="padding:4px 9px" href="https://www.youtube.com/@dKoan-hashimoto" target="_blank" rel="noopener">All songs on the channel</a></p>` : ''}
    ${others.length ? `<div class="songs">More: ${others.map((s) => `<a href="?song=${s.id}">${s.title}</a>`).join(' · ')}</div>` : ''}
    <p class="keys"><a class="b" style="padding:4px 9px;margin-top:6px" href="${window.SITE_REPO || '#'}" target="_blank" rel="noopener">How it works · make your own pack</a></p>
  </div></div>`;
  document.body.appendChild(el);
  const $ = (id) => document.getElementById(id), file = $('file'), play = $('play');
  const close = () => el.remove();
  const start = () => { close(); play && play.click(); };
  const ready = (label) => { $('sNote').textContent = label + ' loaded.'; const b = $('sLoad'); b.textContent = '▶ Start'; b.className = 'main'; b.onclick = start; };
  file && file.addEventListener('change', () => { if (document.getElementById('siteCard')) ready('Your copy'); });
  $('sLoad').onclick = () => file && file.click();
  $('sPreview').onclick = start;
  if ($('sPlay')) $('sPlay').onclick = async () => {
    $('sPlay').textContent = 'Loading…';
    try {
      const r = await fetch(song.audio); if (!r.ok) throw new Error(r.status);
      const blob = await r.blob(), f = new File([blob], song.audio.split('/').pop(), { type: blob.type || 'audio/mpeg' });
      const dt = new DataTransfer(); dt.items.add(f); file.files = dt.files; file.dispatchEvent(new Event('change'));
      start();
    } catch (e) { $('sPlay').textContent = 'Audio unavailable'; $('sNote').textContent = 'Could not load the hosted audio. Load your own copy instead.'; }
  };
}
if (document.readyState === 'complete') card(); else addEventListener('load', card);
})();
