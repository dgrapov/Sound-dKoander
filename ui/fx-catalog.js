// One catalog of every on-demand effect, for the Effects panel and the Pad (ui/pad.js).
// Keys of the original ten (faraday … julia) are unchanged, so recorded cues keep working.
//
// entry: { key, label, cat, cfg }   cfg = a VizForms layer config (layers/*.js document each type's options)
//   Colour tokens in cfg: '@life' '@digital' '@flame' (and '@life+30' etc., degrees added) resolve to the current
//   Tune colours, so effects follow the active Look. Entries with special:true are handled in index.html (K patch).
// Non-form "modes" (particle scene, attractor, text style) are in VIZ_MODES below; the Pad shows them on its Modes page.
(() => {
const FX = [
  // ---- geometry ----
  { key:'flower',    cat:'Geometry', label:'Flower of Life',   cfg:{ type:'flower', rings:2, dur:8 } },
  { key:'fractal',   cat:'Geometry', label:'Fractal flower',   cfg:{ type:'flower', rings:3, depth:2, dur:14 } },
  { key:'metatron',  cat:'Geometry', label:'Metatron+merkaba', cfg:{ type:'metatron', merkaba:true, dur:10 } },
  { key:'crystal',   cat:'Geometry', label:'Snow crystal',     cfg:{ type:'crystal', seed:5, rate:.22 } },
  { key:'phyllo',    cat:'Geometry', label:'Phyllotaxis',      cfg:{ type:'phyllotaxis', seeds:900, dur:10 } },
  // ---- cymatics / physics of sound ----
  { key:'faraday',   cat:'Cymatics', label:'Faraday crystal',  cfg:{ type:'faraday', waves:[4,6,8,10,12], golden:true, dur:24 } },
  { key:'chladniS',  cat:'Cymatics', label:'Chladni □ sand',   cfg:{ type:'chladni', plate:'square', mode:'pitch' } },
  { key:'chladniC',  cat:'Cymatics', label:'Chladni ○ sand',   cfg:{ type:'chladni', plate:'circle', mode:'pitch' } },
  { key:'plate',     cat:'Cymatics', label:'Chladni plate (notes)', cfg:{ type:'plate', grains:5000, dot:3.6, color:'@digital' } },
  { key:'flametube', cat:'Cymatics', label:'Flame tube (bass)', cfg:{ type:'flametube', flames:48, color:'@flame' } },
  { key:'strings',   cat:'Cymatics', label:'Harmonic strings', cfg:{ type:'strings', count:6, color:'@life' } },
  // ---- fractals ----
  { key:'halley',    cat:'Fractals', label:'Halley fractal',   cfg:null },          // shares the live FRACT config (Effects panel)
  { key:'julia',     cat:'Fractals', label:'Julia set',        cfg:{ type:'julia' } },
  { key:'sierpinski',cat:'Fractals', label:'Sierpiński zoom',  cfg:{ type:'pfractal', kind:'sierpinski', zoom:true, scatter:.2, dot:6, n:3200, color:'@life' } },
  { key:'fern',      cat:'Fractals', label:'Barnsley fern',    cfg:{ type:'pfractal', kind:'fern', grow:true, n:3500, dot:3.5, scatter:.12, color:'@digital', size:.9, cy:.48 } },
  { key:'dragon',    cat:'Fractals', label:'Dragon curve',     cfg:{ type:'pfractal', kind:'dragon', n:3200, dot:4, scatter:.15, color:'@flame' } },
  { key:'patchK',    cat:'Fractals', label:'Fractal patch (spawn)', special:true },
  // ---- spectrum / scope ----
  { key:'mandala6',  cat:'Spectrum', label:'Spectrum mandala 6',  cfg:{ type:'mandala', fold:6, color:'@life', accent:'@flame' } },
  { key:'mandala12', cat:'Spectrum', label:'Spectrum mandala 12', cfg:{ type:'mandala', fold:12, color:'@flame', accent:'@life' } },
  { key:'ridgeline', cat:'Spectrum', label:'Ridgeline waterfall', cfg:{ type:'ridgeline', lines:36, color:'@life', far:'@life+60' } },
  { key:'scopeXY',   cat:'Spectrum', label:'Stereo scope XY',     cfg:{ type:'scope', mode:'xy', color:'@flame' } },
  { key:'scopePolar',cat:'Spectrum', label:'Polar scope',         cfg:{ type:'scope', mode:'polar', color:'@life' } },
  { key:'chroma',    cat:'Spectrum', label:'Chroma wheel',        cfg:{ type:'chroma' } },
  { key:'fountain',  cat:'Spectrum', label:'Note fountain',       cfg:{ type:'fountain' } },
  { key:'lissajous', cat:'Spectrum', label:'Lissajous (bass×core)', cfg:{ type:'lissajous', color:'@flame' } },
  { key:'sphere',    cat:'Spectrum', label:'Harmonic sphere',     cfg:{ type:'sphere', color:'@life', accent:'@flame' } },
  // ---- life, automata, bodies ----
  { key:'life',      cat:'Life & bodies', label:'Game of Life',   cfg:{ type:'life', cols:64, density:.22, color:'@digital' } },
  { key:'rule30',    cat:'Life & bodies', label:'Rule 30 mask',   cfg:{ type:'life', mode:'rule', rule:30, rowsPerBeat:2, mirror:true, color:'@flame', tail:'@life' } },
  { key:'rule110',   cat:'Life & bodies', label:'Rule 110',       cfg:{ type:'life', mode:'rule', rule:110, rowsPerBeat:2, mirror:false, color:'@life', tail:'@digital' } },
  { key:'helix',     cat:'Life & bodies', label:'Gold helix (DNA)', cfg:{ type:'helix', stage:'helix', free:true } },
  { key:'mobius',    cat:'Life & bodies', label:'Möbius band',    cfg:{ type:'helix', stage:'mobius', free:true } },
  { key:'torus',     cat:'Life & bodies', label:'Torus → nova',   cfg:{ type:'helix', stage:'torus', free:true, nova:.86, dur:20 } },
  { key:'stabs',     cat:'Life & bodies', label:'Daemon stabs',   cfg:{ type:'stabs', max:6 } },
  { key:'teaser',    cat:'Life & bodies', label:'Glimpse windows', cfg:{ type:'teaser', from:0, every:2, r:[.15,.24], life:2.6, max:3, gain:2.5 } },
];

// Non-form modes. scene = particle formation (index.html SCENES), attractor = physics layer, style = lyric typography.
const MODES = {
  scenes: ['ink','slope','vortex','ring','ghost','flock','cityforest','waves','cymatics','eddy','platonic','fold','tear','mandala','melt','horizon','rain','lattice','field'],
  attractors: [
    { key:'lorenz',  label:'Lorenz',  cfg:{ type:'lorenz', trajectories:4, range:[28,14] } },
    { key:'rossler', label:'Rössler', cfg:{ type:'rossler', trajectories:4, range:[3.0,4.6], sweep:'progress' } },
    { key:'thomas',  label:'Thomas',  cfg:{ type:'thomas', trajectories:4 } },
    { key:'aizawa',  label:'Aizawa',  cfg:{ type:'aizawa', trajectories:4 } },
    { key:'none',    label:'No attractor', cfg:null },
  ],
};

window.VIZ_FX_CATALOG = FX;
window.VIZ_MODES = MODES;
window.VIZ_FX_CATS = [...new Set(FX.map(f => f.cat))];
})();
