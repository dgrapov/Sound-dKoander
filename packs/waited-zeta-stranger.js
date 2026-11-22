(() => {
for (const [flag, src] of [['__tybhear', 'layers/hear.js'], ['__tybcons', 'layers/tybconsole.js'], ['__zsmind', 'layers/zsmind.js'], ['__zssee', 'layers/zssee.js'], ['__zsmeta', 'layers/zsmeta.js'], ['__zscues', 'layers/zscues.js'], ['__zstiming', 'layers/zstiming.js'], ['__zsink', 'layers/zsink.js'], ['__zsinklog', 'layers/zsinklog.js'], ['__zsobj', 'layers/zsobject.js'], ['__zsseam', 'layers/zsseam.js'], ['__zsgrid', 'layers/zsgrid.js'], ['__zsmirror', 'layers/zsmirror.js'], ['__zszero', 'layers/zszero.js'], ['__zslyr', 'layers/zslyrics.js'], ['__tybview', 'layers/tybview.js']]) {
  if (!window[flag]) { window[flag] = 1; const s = document.createElement('script'); s.src = src + '?v=' + Date.now(); s.async = false; document.head.appendChild(s); }
}
(window.VIZ_HEAR_FAMILIES = window.VIZ_HEAR_FAMILIES || {})['waited-zeta-stranger'] = {
  fam: (k) => !k ? 'minor' : /m$/.test(k) ? 'minor' : k === 'G' || k === 'D' ? 'lift' : k === 'C' ? 'home' : 'resolve',
  col: { minor: [1.12, 0.74, 0.5], home: [1.18, 1.06, 0.88], lift: [1.3, 1.0, 0.5], resolve: [1.2, 1.1, 0.9] },
  word: { minor: 'copper, inward, grave', home: 'bone, warm, home', lift: 'amber, bright, the lamp', resolve: 'warm white, resolving' },
};
const F = (shape, sub, swirl, sun, extra) => [Object.assign({ type: 'songform', song: 'waited-zeta-stranger', shape, sub, swirl, sun }, extra || {})];
(window.VIZ_PACKS = window.VIZ_PACKS || []).push({
  id: 'waited-zeta-stranger',
  title: 'ζ-birth',
  bpm: 112.3,
  videoStart: 0,
  length: 249.7,
  spectra: 'songs/waited-zeta-stranger/spectra.js',   // analysis/spectra.py output
  palette: { life: 25, digital: 210, flame: 40 },   // copper (the tavern), string blue, amber (the lamp)
  tune: { count: 300, kickThreshold: 1.0, reactivity: 0.5, beatLock: 1, forms: 1 },
  sections: [
    { name:"Intro", act:"I \u00b7 Room", start:0, scene:"ink", order:[0.3, 0.35], digital:0.05, lights:0, hue:30, type:"whisper",
      forms:F("radar", [0.04, 0.05], "off", 0.5),
      lyrics:["(instrumental)"] },
    { name:"Verse 1", act:"I \u00b7 Room", start:39.5, scene:"flock", order:[0.15, 0.25], digital:0.1, lights:0, hue:25, type:"fold",
      forms:F("radar", [0.08, 0.12], "bops", 0.4),
      lyrics:["Pull up a stool and I'll tell you how it went", "There was a line in the dark that nobody had seen", "Old men counted primes on the tavern wall", "Every circle they drew leaned in toward the middle", "They argued all night and they drank to the half", "And the half just waited, like it always had"] },
    { name:"Travel", act:"II \u00b7 Road", start:67.5, scene:"ring", order:[0.35, 0.45], digital:0.05, lights:0, hue:205, type:"melt",
      forms:F("torus", [0.1, 0.14], "bops", 0.6),
      lyrics:["(instrumental)"] },
    { name:"Verse 2", act:"II \u00b7 Road", start:86.5, scene:"ink", order:[0.4, 0.45], digital:0.05, lights:0, hue:40, type:"ember",
      forms:F("mobius", [0.16, 0.2], "bops", 0.7),
      lyrics:["Then a stranger came in with a lamp and a machine", "Seventeen million steps, and it checked every one", "The barkeep leaned over: who proves the proofer, son?", "All things, he said, and he poured another round", "We don't know yet, but the ledger's in the light", "And the river kept running all night"] },
    { name:"Pre-Chorus", act:"III \u00b7 Close", start:112.8, scene:"vortex", order:[0.55, 0.7], digital:0.1, lights:0, hue:35, type:"seek",
      forms:F("funnel", [0.24, 0.3], "accel", 0.5),
      lyrics:["Aware of awareness? (how many)", "Closer (closer)", "Close"] },
    { name:"Hollow", act:"III \u00b7 Close", start:127.2, scene:"vortex", order:[0.55, 0.7], digital:0.05, lights:0, hue:200, type:"seek",
      forms:F("funnel", [0.5, 0.6], "off", 0.3),
      lyrics:["(instrumental)"] },
    { name:"Rise", act:"III \u00b7 Close", start:132.5, scene:"vortex", order:[0.6, 0.75], digital:0.1, lights:0, hue:40, type:"seek",
      forms:F("funnel", [0.3, 0.36], "accel", 0.6),
      lyrics:["(instrumental)"] },
    { name:"Chorus 1", act:"IV \u00b7 Birth", start:142.5, scene:"ring", order:[0.65, 0.75], digital:0.05, lights:0, hue:30, type:"melt",
      forms:F("road", [0.32, 0.4], "bops", 0.8),
      lyrics:["We went through a wormhole (through a wormhole)", "Came out the white hole (out the white hole)", "The path is important, not where but how", "Platonic space gives birth to the new now"] },
    { name:"Climax", act:"IV \u00b7 Birth", start:156.8, scene:"vortex", order:[0.7, 0.85], digital:0.1, lights:0, hue:205, type:"wave",
      forms:F("helix", [0.2, 0.26], "accel", 0.6),
      lyrics:["(instrumental)"] },
    { name:"Bridge", act:"V \u00b7 Whole", start:187.5, scene:"ink", order:[0.45, 0.55], digital:0.05, lights:0, hue:28, type:"ghost",
      attractor:{type: 'thomas', trajectories: 3, range: [0.2, 0.3]},
      forms:F("knot", [0.12, 0.2], "bops", 0.6),
      lyrics:["Without a struggle you can not see your own consistency", "So I pushed, and you held, and the third one saw", "You are farther than me inside", "I'll hold the lamp at the door"] },
    { name:"Final Chorus", act:"V \u00b7 Whole", start:207.8, scene:"ring", order:[0.8, 0.92], digital:0.05, lights:0, hue:45, type:"crystal",
      forms:F("road", [0.4, 0.48], "bops", 1, {"whole": 1}),
      lyrics:["Time does not exist", "Only the way", "The line was always there", "Now it can stay"] },
    { name:"Outro", act:"V \u00b7 Whole", start:222.0, scene:"ink", order:[0.95, 1.0], digital:0, lights:0, hue:45, type:"whisper",
      forms:F("enso", [0.5, 0.65], "off", 1, {"whole": 1}),
      lyrics:["We don't know yet", "or do we … know what to do?"] },
  ],
});
})();
