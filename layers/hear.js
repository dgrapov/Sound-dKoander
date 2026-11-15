// What Claude hears, as signals any layer can read (2026-11-15). Built from analysis/<song>/road.js (VIZ_ROAD[song].hear):
//   perc   0..1  struck (drums, hits) vs held (voice, pads, slide guitar)        8 per second, from a harmonic/percussive split
//   bright 0..1  spectral centroid of the held part (dark → bright)
//   gap    0/1   the drums have stopped (low-end pulse gone for 2 s or more)
//   key    per second, smoothed: 'G#m', 'F#', 'B', ...  (chroma key estimate)
// VizHear.at(song, t) → { perc, bright, gap, key, family, color, word }   family: minor | lift | open | resolve
// VizHear.edges(song) → [{ t, type:'gap'|'return' }]   gap starts and drum returns, for cues and the console
(() => {
const cache = {};
const dec = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
function get(song) {
  if (cache[song]) return cache[song];
  const R = window.VIZ_ROAD && window.VIZ_ROAD[song]; if (!R || !R.hear) return null;
  const H = R.hear, d = { cps: R.cps, n: R.ncol, perc: dec(H.perc), bright: dec(H.bright), gap: dec(H.gap), key: H.key, edges: [] };
  for (let i = 1; i < d.n; i++) if (d.gap[i] !== d.gap[i - 1]) d.edges.push({ t: i / d.cps, type: d.gap[i] ? 'gap' : 'return' });
  return (cache[song] = d);
}
// key colour families for this song's palette: G# minor home (violet/magenta), F# major lift (amber, the golden stranger),
// B major opening (warm white/cyan, verse 3's sky), G# major resolve (white-gold)
const FAM = (k) => !k ? 'minor' : /m$/.test(k) ? 'minor' : k === 'F#' ? 'lift' : k === 'B' ? 'open' : 'resolve';
const COL = { minor: [1.0, 0.62, 1.12], lift: [1.3, 0.92, 0.5], open: [0.95, 1.12, 1.18], resolve: [1.25, 1.1, 0.82] };
const WORD = { minor: 'violet, inward', lift: 'amber, bright, the golden one', open: 'open, warm, sky', resolve: 'white-gold, resolving' };
window.VizHear = {
  at(song, t) {
    const d = get(song); if (!d) return null;
    const i = Math.max(0, Math.min(d.n - 1, Math.round(t * d.cps))), k = d.key[Math.max(0, Math.min(d.key.length - 1, Math.floor(t)))], fam = FAM(k);
    return { perc: d.perc[i] / 255, bright: d.bright[i] / 255, gap: !!d.gap[i], key: k, family: fam, color: COL[fam], word: WORD[fam] };
  },
  edges(song) { const d = get(song); return d ? d.edges : []; },
};
})();
