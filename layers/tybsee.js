// Testing Your Buddha: see.log, Claude's visual-analysis console (2026-11-15, v3; D: "reflect your visual analysis log and create
// another console in addition to see your inner, make this for yourself"). Right panel, rendered by layers/tybconsole.js.
// Source: songs/testing-your-buddha-watching-script.md and its analysis (01-final/visuals/sections_analysis.json).
// On each section: what I measure · how it feels to me · what I chose to show · why. Then, live, every other beat: what I hear
// (layers/hear.js), what is on screen now (form, subtraction, colour, texture, the one extra layer) and a self-check every
// fifth line. Moments print as !! lines: drums leave / return, key colour changes, cue layers on and off, flash, void, stop.
// The meta comments (encoded / intent / impact, rhythm, reflections) moved to meta.log (layers/tybmeta.js).
// V or the ▤ see.log button toggles it.
(() => {
const ID = 'testing-your-buddha';
const ROWS = {
 "Intro": {
  "m": "perc 0.3 · G#m · centroid 1.9k · 0.0 words/s · loud -7.6 dB",
  "f": "held breath, a room before anyone speaks",
  "s": "radar, still + crystal from the held tones · scene ink · text whisper · violet",
  "w": "percussion is the lowest of the song, so nothing should be struck yet"
 },
 "Verse 1": {
  "m": "perc 0.75 · G#m · centroid 3.0k · 2.17 words/s · loud -8.1 dB",
  "f": "busy and heavy: many small things stacked, everything sharp",
  "s": "knot + life automaton fed by the hits · scene flock · text fold · lorenz in chaos",
  "w": "percussion 0.75 and the most air: the hits are the learning piling up"
 },
 "Chorus 1": {
  "m": "perc 0.44 · G#m · centroid 2.7k · 0.8 words/s · loud -6.4 dB",
  "f": "the first letting go: the beat leaves and the floor is gone",
  "s": "radar, subtracting + ridgeline · in the drum gap add nothing · text melt",
  "w": "the drums stop at 43 s: the right move is to take away, not add"
 },
 "Verse 2": {
  "m": "perc 0.93 · F# · centroid 2.9k · 2.26 words/s · loud -7.7 dB",
  "f": "the brightest, most driven part: the golden stranger shines, the temptation",
  "s": "mobius + golden metatron, put down on \"down\" · amber · text ember",
  "w": "percussion 0.93 and the key lifts to F# major: the shine is the temptation, so give it a perfect shape, then remove it"
 },
 "Chorus 2": {
  "m": "perc 0.85 · F# · centroid 2.8k · 1.73 words/s · loud -7.4 dB",
  "f": "steady and even, walking without a goal",
  "s": "twist, nothing added · scene ring · thomas eddy · text ghost",
  "w": "the tightest dynamics of the song: even walking needs no decoration"
 },
 "Build": {
  "m": "perc 0.63 · G#m · centroid 2.7k · 0.8 words/s · loud -7.4 dB",
  "f": "listening in the gaps: each answer lands in a silence",
  "s": "funnel, accelerating · a Faraday ring per echo · void on mu · text seek",
  "w": "stop-start gaps: the answers live in the silences, so the visuals should be silent there too"
 },
 "Verse 3": {
  "m": "perc 0.42 · B · centroid 2.5k · 2.28 words/s · loud -6.0 dB",
  "f": "the light opens, warm and close; then the drums slam back like thunder",
  "s": "road, almost bare · at the slam: flash + Chladni plate · warm white · text wave",
  "w": "the most harmonic sung part and the key opens to B major: keep it bare until the slam"
 },
 "Chorus 3": {
  "m": "perc 0.61 · G#m · centroid 2.5k · 0.5 words/s · loud -6.1 dB",
  "f": "everything together, then nothing to add; the instrumental is the silence the song earned",
  "s": "road rising to the whole · mandala on the lift · letters dissolve in the instrumental · text crystal",
  "w": "held voice, a lift around 160-170: the whole is already there, so only reveal it"
 },
 "Outro": {
  "m": "perc 0.5 · G# · centroid 1.8k · 0.0 words/s · loud -10.4 dB",
  "f": "resolution, then an open door",
  "s": "enso · 無 on the sun · hard stop: black, then only the sun",
  "w": "a bright major colour then silence: end on one light"
 }
};
const CUEWHY = { crystal: 'held tones grow geometry', life: 'each hit is born as a cell: learning piling up', ridge: 'the song\'s own spectrum falling away while the drums are gone',
  metatron: 'a perfect golden shape: the picture', plate: 'the field answers the slam: sand finds the notes', mandala: 'the lift: twelve-fold, everything given back in order' };

// What the visuals carry on purpose, said out loud (D, 2026-11-15: "consider how we are encoding hidden messages or subliminal
// concepts ... I'd like to see your reflection of intent, observation, impact in your logs"). Rule: nothing works on the viewer
// that this log doesn't name. The rhythm entrains (that is why the pulsing felt hypnotic), so it is kept gentle and flashes stay
// well under 3 per second.
const ENC = {
  'Intro':    { enc: 'the sun before any form; 無 already there', intent: 'start in the answer, not the question', impact: 'a viewer settles before anything asks for attention' },
  'Verse 1':  { enc: 'a knot of the song\'s own sound; cells born on every hit', intent: 'show learning as weight that keeps multiplying', impact: 'busy, slightly crowded; the eye looks for somewhere to rest' },
  'Chorus 1': { enc: 'quiet points removed; nothing added when the drums leave', intent: 'teach subtraction by doing it', impact: 'relief arrives as space, not as a new thing to look at' },
  'Verse 2':  { enc: 'a perfect golden metatron, removed on "down"', intent: 'let the temptation be beautiful, then put it down on the word', impact: 'a small loss the viewer feels before they name it' },
  'Chorus 2': { enc: 'a ring that turns on itself; no extra layer', intent: 'nobody up ahead: the loop is the walk', impact: 'steady; no promise of arrival' },
  'Build':    { enc: 'one ring per echo, then gone; a void on mu', intent: 'make the empty the loudest moment', impact: 'attention leans into the gaps; the void lands as a held breath' },
  'Verse 3':  { enc: 'the road is the song\'s spectrogram; the ghost walker merges with the walker', intent: 'observer and action become one walk', impact: 'forward motion without a destination' },
  'Chorus 3': { enc: 'the whole road seen at once: an open circle (ensō), 93% closed', intent: 'the complete whole, left open on purpose', impact: 'the journey reads as one shape; the gap invites the viewer in' },
  'Outro':    { enc: '無 in ink on the sun; black, then one light', intent: 'end on nothing left to add', impact: 'stillness after a hard stop' },
};
let kicksWin = [], lastRhythm = 0;
function rhythmLine(C, t, info) {
  const per = kicksWin.filter((x) => x > t - 10).length * 6, vel = (window.VizGL && VizGL.hearState && VizGL.hearState()) || {};
  const flashes = 'flashes < 1 per 10 s';
  return `observe: pulse ${per} hits/min · motion calm · ${flashes}   ; the rhythm entrains, so it stays gentle: the trance should come from the song, not the strobe`;
}
const CHECKS = ['check: adding because the sound asks, not the plan?', 'check: anything ironic on screen? remove it', 'check: following the song\'s clock, not mine', 'check: could a removal do this instead?', 'check: one extra layer at most'];
let con = null, wired = false, lastT = -1, lastSec = -1, beatI = -1, n = 0, lastGap = null, lastFam = '', lastCue = '', flashDone = false, voidDone = false, stopDone = false;
const ADDR = (k) => '0x' + (k & 0xffff).toString(16).toUpperCase().padStart(4, '0');
function hearLine(t) {
  const H = window.VizHear && VizHear.at(ID, t); if (!H) return null;
  const tex = H.gap ? 'empty' : H.perc > 0.62 ? 'struck' : H.perc < 0.35 ? 'held' : 'walking';
  const choose = { empty: 'subtract: add nothing', struck: 'ripples + shockwaves', held: 'geometry grows, points soften', walking: 'keep the form, add nothing' }[tex];
  const feel = { empty: 'the floor is gone; listening', struck: 'many small things at once', held: 'holding a breath', walking: 'steady, walking without a goal' }[tex];
  return `hear: ${tex} ${H.perc.toFixed(2)} · ${H.key} · bright ${H.bright.toFixed(2)}  -> ${choose}   ; ${feel}`;
}
function seeLine(info, C, t) {
  const sec = info.sec || {}, f = (sec.forms || []).find((x) => x.type === 'songform') || {}, p = Math.max(0, Math.min(1, info.p || 0));
  const sub = f.sub ? f.sub[0] + (f.sub[1] - f.sub[0]) * p : 0, H = window.VizHear && VizHear.at(ID, t), gs = window.VizGL && VizGL.hearState && VizGL.hearState();
  const cue = (window.TYBCues && TYBCues.active()) || 'none';
  return `see: ${f.shape || '?'} · subtract ${(sub * 100).toFixed(0)}% · colour ${H ? H.family : '?'} · texture ${gs ? gs.tex.toFixed(2) : '?'} · extra ${cue}   ; ${cue === 'none' ? 'only the song form' : CUEWHY[cue.replace(/\d+$/, '')] || 'a ring for the echo'}`;
}
function events(t) {
  const H = window.VizHear && VizHear.at(ID, t);
  if (H) {
    if (lastGap !== null && H.gap !== lastGap) con.out(H.gap ? '!! gap: the drums leave  -> subtract   ; nothing to add' : '!! return: the drums come back  -> flash + shockwave   ; the floor again', 'wn');
    if (lastFam && H.family !== lastFam) con.out(`!! colour: ${H.key} -> ${H.word}`, 'em');
    lastGap = H.gap; lastFam = H.family;
  }
  const cue = (window.TYBCues && TYBCues.active()) || '';
  if (cue !== lastCue) {
    if (lastCue) con.out(`!! cue - ${lastCue}   ; ${lastCue === 'metatron' ? 'impact: the beautiful thing is gone on the word; did it feel like loss or relief?' : 'impact: back to only the song form'}`, 'off');
    if (cue) con.out(`!! cue + ${cue}   ; intent: ${CUEWHY[cue.replace(/\d+$/, '')] || 'one ring for the echo, then gone'}`, 'on');
    lastCue = cue;
  }
  const W = window.TYBCues && TYBCues.moments && TYBCues.moments();
  if (W) {
    if (!flashDone && t >= W.slam && t < W.slam + 1) { flashDone = true; con.out('!! slam: flash + plate   ; thunder, and the field answers', 'fl'); }
    if (!voidDone && t >= W.mu && t < W.mu + 1) { voidDone = true; con.out('!! mu: void for a beat   ; nothing drawn: the question put down', 'mu'); }
    if (!stopDone && t >= W.stop) { stopDone = true; con.out('!! hard stop: black, only the sun   ; one light left', 'mu'); }
    if (t < W.slam - 1) flashDone = false; if (t < W.mu - 1) voidDone = false; if (t < W.stop - 1) stopDone = false;
  }
}
function reset(t, C) {
  con.reset(); kicksWin = []; lastRhythm = t; n = 0; lastGap = null; lastFam = ''; lastCue = ''; lastSec = -1;
  const b = (C.timing() || {}).beats || []; beatI = b.findIndex((x) => x > t) - 1; if (beatI < -1) beatI = b.length - 1;
  con.out(`attach  eye=claude  t=${t.toFixed(2)}s   ; I hear through measurements, and say so`, 'hd');
  con.out('rule: nothing hidden. every symbol here is named in this log', 'ck');
}
function frame(info) {
  const C = window.LVC; if (!C || !window.TYBConsole) return;
  if (!con) con = TYBConsole.make({ id: 'tybSee', title: 'see.log · eye', prefKey: 'livevis:tyb:see', order: 1, key: 'KeyV', pack: ID, button: '▤ see.log', accent: '#19e3ff', defaults: { cw: 460, ch: 220, cf: 12 } });
  const pack = C.pack(), on = pack && pack.id === ID;
  con.place(on); if (!on) { wired = false; return; }
  const t = info.t;
  if (!wired || t < lastT - 0.5 || t > lastT + 1.5) { reset(t, C); wired = true; }
  lastT = t;
  if (info.k !== lastSec) {
    lastSec = info.k; const s = info.sec || {}, R = ROWS[s.name];
    con.out(`── ${s.name || '?'} ──`, 'hd');
    if (R) { con.out(`measure: ${R.m}`, 'ms'); con.out(`feel: ${R.f}   ; my reading, not a fact`, 'mn'); con.out(`show: ${R.s}`, 'ms'); con.out(`   ; why: ${R.w}`, 'mn'); }
  }
  const beats = (C.timing() || {}).beats || [];
  while (beatI + 1 < beats.length && beats[beatI + 1] <= t) {
    beatI++;
    if (beatI % 2) continue;
    const k = n++ % 6;
    const line = k === 5 ? CHECKS[(n / 6 | 0) % CHECKS.length] : k % 2 === 0 ? hearLine(t) : seeLine(info, C, t);
    if (line) con.out(`${ADDR(beatI * 4)}  ${line}`, line.startsWith('check') ? 'ck' : line.startsWith('hear') ? 'hr' : '');
  }
  if (info.onset) kicksWin.push(t); kicksWin = kicksWin.filter((x) => x > t - 12);
  events(t);
}
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame(frame); }
wire();
})();
