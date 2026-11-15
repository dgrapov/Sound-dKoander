// Song pack: Testing Your Buddha, v3 "watching" (v2 + consoles) (2026-11-15). the music gen agent's take (file "testing-your-buddha.wav"), 3:15, ~96 BPM dembow,
// G# minor home, F# major lift in Verse 2 / Chorus 2, B major opening in Verse 3, bright major colour at the end, hard stop 189.9 s.
// Section starts come from songs/Testing Your Buddha/01-final/testing-your-buddha.timing.json (load it for word-by-word lyrics).
// Play the 16-bit copy "testing-your-buddha.wav" (Chrome can't play the 32-bit original).
//
// Direction: songs/testing-your-buddha-watching-script.md (how Claude hears the song, section by section, and why each element).
// v1 (2026-11-14): the journey of shapes. v2 adds what the spectrogram showed: loudness barely moves (about 4 dB), so the
// drama is texture (struck vs held), key colour and gaps. Those now drive the visuals (layers/hear.js), and timed cues
// (layers/tybcues.js) add at most ONE extra layer at a time on top of the song form; gaps only ever subtract.
//   Intro     radar  + crystal growing from the held tones   scene ink     text whisper   violet
//   Verse 1   knot   + life automaton fed by the hits         scene flock   text fold      lorenz in chaos
//   Chorus 1  radar  + ridgeline (the drums leave at 43 s)   scene ring    text melt
//   Verse 2   mobius + golden metatron, put down on "down"   scene ink     text ember     amber (F# major)
//   Chorus 2  twist, nothing added                            scene ring    text ghost     thomas eddy
//   Build     funnel, a Faraday ring on each echo, void on "mu"  scene vortex  text seek  cyan
//   Verse 3   road; at the slam (139.9) flash + Chladni plate  scene ink     text wave      warm (B major)
//   Chorus 3  road rising to the whole; mandala on the lift (~160)  scene ring  text crystal
//   Outro     enso; hard stop cuts to black, then only the sun  text whisper
// Claude's consoles (layers/tybconsole.js renders both; width, lines, size, wrap, font, side adjustable in each bar):
//   mind.log (left, C): what I did making the song and the inner voice.  see.log (right, V): what I measure, feel, show and why,
//   then live: what I hear, what is on screen, cue layers on/off, self-checks.
// v3.2 (2026-11-15): meta.log (layers/tybmeta.js, right side, N): only Claude's comments, in plain sentences: what is encoded,
//   intent, likely impact, reflections, a note on every cue and on the rhythm. see.log keeps the technical lines.
// v3.1 (2026-11-15): calmer motion (less pulse, slower swirl and camera), lyrics around the picture (L: bottom / top / right /
//   scene, layers/tyblyrics.js), Z focus view (layers/tybview.js), consoles draggable and resizable in a left column.
// v3 (2026-11-15): see.log, the shared console renderer, a gentler dissolve of the last line, 無 in ink with a dark halo.
(() => {
for (const [flag, src] of [['__tybhear', 'layers/hear.js'], ['__tybcons', 'layers/tybconsole.js'], ['__tybmind', 'layers/tybmind.js'], ['__tybsee', 'layers/tybsee.js'], ['__tybmeta', 'layers/tybmeta.js'], ['__tybcues', 'layers/tybcues.js'], ['__tyblyr', 'layers/tyblyrics.js'], ['__tybview', 'layers/tybview.js']]) {
  if (!window[flag]) { window[flag] = 1; const s = document.createElement('script'); s.src = src; s.async = false; document.head.appendChild(s); }
}
const F = (shape, sub, swirl, sun, extra) => [Object.assign({ type: 'songform', song: 'testing-your-buddha', shape, sub, swirl, sun }, extra || {})];
(window.VIZ_PACKS = window.VIZ_PACKS || []).push({
  id: 'testing-your-buddha',
  title: 'Testing Your Buddha',
  bpm: 95.7,
  videoStart: 0,
  length: 194.9,
  spectra: 'songs/testing-your-buddha/spectra.js',   // analysis/spectra.py output
  palette: { life: 320, digital: 188, flame: 40 },   // magenta (saw synth), laser cyan, amber (slide guitar)
  tune: { count: 300, kickThreshold: 1.0, reactivity: 0.5, beatLock: 1, forms: 1 },   // reactivity halved: calmer (D, 2026-11-15)
  sections: [
    { name:'Intro',    act:'I · Breath',   start:0,      scene:'ink',    order:[.30,.35], digital:.05, lights:0, hue:280, type:'whisper',
      forms:F('radar', [.04,.05], 'off', .5),
      lyrics:['(Ohh... mu)'] },
    { name:'Verse 1',  act:'I · Breath',   start:21.76,  scene:'flock',  order:[.15,.25], digital:.10, lights:0, hue:300, type:'fold',
      attractor:{ type:'lorenz', trajectories:4, range:[28,24] },
      forms:F('knot', [.04,.06], 'bops', .4),
      lyrics:['Learned a little more each day and stacked it on my back','Names for every sorrow, maps for every track','Heavy as a hymn book, and I called it getting wise','Till the road got narrow and I couldn\'t see the sky'] },
    { name:'Chorus 1', act:'II · Losing',  start:41.12,  scene:'ring',   order:[.35,.45], digital:.05, lights:0, hue:320, type:'melt',
      forms:F('radar', [.08,.18], 'bops', .6),
      lyrics:['Lose a little every day','Lose it and lose it again','Till there\'s nothing left to push','And the road moves like the wind'] },
    { name:'Verse 2',  act:'II · Losing',  start:71.0,   scene:'ink',    order:[.40,.45], digital:.05, lights:0, hue:40,  type:'ember',
      forms:F('mobius', [.16,.20], 'bops', .7),
      lyrics:['Met a golden stranger at a bend in the road','Sat there like a promise that would carry off my load','I heard the old ones whisper, if he\'s standing over there','Then he\'s only a picture, put him down and breathe the air'] },
    { name:'Chorus 2', act:'II · Losing',  start:90.48,  scene:'ring',   order:[.45,.55], digital:.05, lights:0, hue:35,  type:'ghost',
      attractor:{ type:'thomas', trajectories:3, range:[.2,.3] },
      forms:F('twist', [.20,.26], 'bops', .7),
      lyrics:['Put the picture down','Nobody\'s up ahead','The one you came to find','Is the one who\'s walking instead'] },
    { name:'Build',    act:'III · Empty',  start:101.44, scene:'vortex', order:[.55,.70], digital:.10, lights:0, hue:188, type:'seek',
      forms:F('funnel', [.26,.32], 'accel', .5),
      lyrics:['Hear it, not with ears (ears)','Hear it, not with thought (thought)','Hear it with the empty (empty)','Where nothing\'s ever caught (caught)','Who\'s the one who\'s testing? (mu)'] },
    { name:'Verse 3',  act:'III · Empty',  start:131.3,  scene:'ink',    order:[.65,.75], digital:.05, lights:0, hue:50,  type:'wave',
      forms:F('road', [.32,.40], 'bops', .8),
      lyrics:['I looked for who was walking till I couldn\'t find the one','Then the wheat began to answer, and the thunder, and the sun','Nothing to protect now, nothing left to prove','The road was doing the walking, I just had to move'] },
    { name:'Chorus 3', act:'IV · Whole',   start:150.2,  scene:'ring',   order:[.80,.92], digital:.05, lights:0, hue:320, type:'crystal',
      forms:F('road', [.40,.48], 'bops', 1, { whole: 1 }),
      lyrics:['Do nothing, nothing\'s undone','All of this is the way','Nothing left to add','Nothing left to say'] },
    { name:'Outro',    act:'IV · Whole',   start:186.0,  scene:'ink',    order:[.95,1.0], digital:.0, lights:0, hue:45,  type:'whisper',
      forms:F('enso', [.50,.65], 'off', 1, { whole: 1 }),
      lyrics:['(mu)'] },
  ],
});
})();
