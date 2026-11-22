(() => {
const ID = 'waited-zeta-stranger';
const ROWS = {
 "Intro": {
  "m": "perc 0.38 \u00b7 E \u00b7 centroid 2.0k \u00b7 0.0 words/s \u00b7 loud -15.9 dB (dyn 0.36) \u00b7 held tones before the story: slide guitar and a low hum; the drums are absent 0 to 12 s and again 20 to 23 s",
  "f": "a room before anyone speaks; the pulse arrives late",
  "s": "radar, still + crystal grown from the held tones \u00b7 scene ink \u00b7 text whisper \u00b7 copper",
  "w": "nothing should be struck while only held tones are measurable"
 },
 "Verse 1": {
  "m": "perc 0.49 \u00b7 C \u00b7 centroid 2.1k \u00b7 2.1 words/s \u00b7 loud -15.6 dB (dyn 0.38) \u00b7 the train beat is steady; the voice is half spoken, half sung; no change of tempo",
  "f": "a storyteller leaning in, lamp low",
  "s": "radar turning with the beat + life cells for the primes counted on the wall \u00b7 scene flock \u00b7 text fold",
  "w": "the hits are even, so a cell born on each hit makes the counting visible"
 },
 "Travel": {
  "m": "perc 0.44 \u00b7 G \u00b7 centroid 2.4k \u00b7 0.0 words/s \u00b7 loud -16.5 dB (dyn 0.28) \u00b7 instrumental; the brightest band share of the song, fiddle and banjo run over the beat",
  "f": "travelling: the road moves under the tavern",
  "s": "torus + ridgeline of the spectrum falling away \u00b7 scene ring \u00b7 cool string-blue",
  "w": "no words to protect, so brightness may lead; nothing else is added"
 },
 "Verse 2": {
  "m": "perc 0.48 \u00b7 C \u00b7 centroid 2.2k \u00b7 2.1 words/s \u00b7 loud -15.0 dB (dyn 0.31) \u00b7 the voice again; the key track leans to G, the brighter neighbour of C",
  "f": "the story turns: a lamp comes in and a question is asked",
  "s": "mobius + a golden metatron for the lamp, put down on \"All things, he said\" \u00b7 amber \u00b7 text ember",
  "w": "a bright beautiful thing is shown on purpose so that putting it down can be felt"
 },
 "Pre-Chorus": {
  "m": "perc 0.41 \u00b7 G \u00b7 centroid 2.0k \u00b7 0.6 words/s \u00b7 loud -15.2 dB (dyn 0.25) \u00b7 the lines shorten to one word; the beat stays at 112 BPM",
  "f": "leaning in, closer and closer",
  "s": "funnel, accelerating \u00b7 one Faraday ring per echo \u00b7 text seek",
  "w": "the speed-up I planned (100 to 160) is not in the take, so the funnel supplies it"
 },
 "Hollow": {
  "m": "perc 0.46 \u00b7 G \u00b7 centroid 2.6k \u00b7 0.0 words/s \u00b7 loud -21.3 dB (dyn 0.49) \u00b7 low-end pulse gone 127.4 to 132.5 s; level 6 dB under the sections around it; not silent",
  "f": "a held breath with only a rumble in it",
  "s": "funnel drawn inward, subtract only, a void as it starts \u00b7 scene vortex",
  "w": "a gap only ever subtracts: nothing is added where the take itself left space"
 },
 "Rise": {
  "m": "perc 0.41 \u00b7 G \u00b7 centroid 2.3k \u00b7 0.0 words/s \u00b7 loud -15.4 dB (dyn 0.19) \u00b7 the pulse returns at 132.5 s and the strings begin to climb; dynamics are the tightest so far",
  "f": "the floor again, then lift",
  "s": "funnel, accelerating + Chladni plate, one flash on the return \u00b7 scene vortex",
  "w": "the field answers the return; I do not add a new shape"
 },
 "Chorus 1": {
  "m": "perc 0.46 \u00b7 C \u00b7 centroid 2.4k \u00b7 2.3 words/s \u00b7 loud -14.8 dB (dyn 0.25) \u00b7 stomping chorus, 2.3 words/s, the most words per second of the song; key track C and G",
  "f": "the drop, everyone singing",
  "s": "road: the spectrogram walked, subtract 30 to 40% \u00b7 scene ring \u00b7 text melt",
  "w": "wormhole and white hole are in the words, so the picture is the road itself, not a tunnel"
 },
 "Climax": {
  "m": "perc 0.43 \u00b7 Em \u00b7 centroid 2.1k \u00b7 0.0 words/s \u00b7 loud -16.6 dB (dyn 0.32) \u00b7 instrumental, 30 s; the key track settles to Em and Am; fiddle, balalaika and strings",
  "f": "the race upward",
  "s": "helix climbing + harmonic strings, the one extra layer \u00b7 scene vortex \u00b7 text wave",
  "w": "the strings are the message here, so the strings layer answers them"
 },
 "Bridge": {
  "m": "perc 0.49 \u00b7 G \u00b7 centroid 1.8k \u00b7 1.7 words/s \u00b7 loud -16.5 dB (dyn 0.41) \u00b7 the voice drops low; the widest dynamics of the song (0.41); drums thin around 192 to 195 s",
  "f": "low and close; the third one sees",
  "s": "knot, two strands, nothing extra \u00b7 scene ink \u00b7 text ghost",
  "w": "widest dynamics, so leave room; the knot is I pushed, you held"
 },
 "Final Chorus": {
  "m": "perc 0.44 \u00b7 C \u00b7 centroid 2.4k \u00b7 1.1 words/s \u00b7 loud -15.8 dB (dyn 0.21) \u00b7 the lines get shorter; the key track stays in the C-major family, with no fifth up as planned",
  "f": "letting go, one line at a time",
  "s": "road with whole:1, the camera rises to the open circle; a mandala on \"Now it can stay\" \u00b7 text crystal",
  "w": "the planned modulation is not in the take, so the lift is carried by the rising camera and not by colour"
 },
 "Outro": {
  "m": "perc 0.44 \u00b7 Am \u00b7 centroid 2.0k \u00b7 0.4 words/s \u00b7 loud -18.0 dB (dyn 0.51) \u00b7 a question is sung and a bell is struck; the take fades to silence at 246.8 s, with no hard stop",
  "f": "left open on purpose: \"we don't know yet, or do we?\"",
  "s": "enso, still; black when the take goes silent, then only the sun \u00b7 text whisper",
  "w": "the ending is a fade, so black arrives with the silence"
 }
};
const CUEWHY = { crystal: 'held tones grow geometry', life: 'each hit is born as a cell: the primes counted on the wall', ridge: 'the song\'s own spectrum falling away while the road travels',
  metatron: 'the lamp: a perfect golden shape, shown so it can be put down', plate: 'the field answers the return of the drums: sand finds the notes', strings: 'the string race, answered by harmonic strings', mandala: 'the lift: twelve-fold, everything given back in order' };

const ENC = {
  "Intro": { enc: "the sun before any form; copper held-tone crystal", intent: "begin with the room, not the story", impact: "a viewer settles before anyone speaks" },
  "Verse 1": { enc: "cells born on every hit; the radar turns with the beat", intent: "make the counting visible", impact: "steady, a little crowded, like a tavern" },
  "Travel": { enc: "the spectrum falls away as a ridgeline", intent: "let the instrumental be a road", impact: "release after the dense verse" },
  "Verse 2": { enc: "a golden metatron for the lamp, removed on \"All things\"", intent: "the lamp is beautiful; then the barkeep answers", impact: "a small loss that arrives with the word" },
  "Pre-Chorus": { enc: "one ring per echo; the funnel closes", intent: "closer and closer", impact: "attention narrows to the last word" },
  "Hollow": { enc: "a void as the pulse leaves; nothing added", intent: "let the take's own gap be the loudest part", impact: "a held breath before the drop" },
  "Rise": { enc: "a flash and a Chladni plate on the return", intent: "the field answers the floor coming back", impact: "relief, then lift" },
  "Chorus 1": { enc: "the song's spectrogram, walked as a road", intent: "the path is important, not where but how", impact: "forward motion without a destination" },
  "Climax": { enc: "harmonic strings answer the string race", intent: "the strings are the message", impact: "a rising feeling without adding a second picture" },
  "Bridge": { enc: "a two-strand knot, nothing extra", intent: "push and hold are one knot", impact: "closeness, then a loosening" },
  "Final Chorus": { enc: "the camera rises to the open circle; a mandala on the last line", intent: "the whole at once, left open", impact: "the journey reads as one shape" },
  "Outro": { enc: "a still ens\u014d; black at the silence, then one light", intent: "end on the open question", impact: "stillness after a fade" },
};
let kicksWin = [], lastRhythm = 0;
function rhythmLine(C, t, info) {
  const per = kicksWin.filter((x) => x > t - 10).length * 6, vel = (window.VizGL && VizGL.hearState && VizGL.hearState()) || {};
  const flashes = 'flashes < 1 per 10 s';
  return `observe: pulse ${per} hits/min · motion calm · ${flashes}   ; the rhythm entrains, so it stays gentle (the take sits at a flat 112 BPM): the trance should come from the song, not the strobe`;
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
  const cue = (window.ZSCues && ZSCues.active()) || 'none';
  return `see: ${f.shape || '?'} · subtract ${(sub * 100).toFixed(0)}% · colour ${H ? H.family : '?'} · texture ${gs ? gs.tex.toFixed(2) : '?'} · extra ${cue}   ; ${cue === 'none' ? 'only the song form' : CUEWHY[cue.replace(/\d+$/, '')] || 'a ring for the echo'}`;
}
function events(t) {
  const H = window.VizHear && VizHear.at(ID, t);
  if (H) {
    if (lastGap !== null && H.gap !== lastGap) con.out(H.gap ? '!! gap: the drums leave  -> subtract   ; nothing to add' : '!! return: the drums come back  -> flash + shockwave   ; the floor again', 'wn');
    if (lastFam && H.family !== lastFam) con.out(`!! colour: ${H.key} -> ${H.word}`, 'em');
    lastGap = H.gap; lastFam = H.family;
  }
  const cue = (window.ZSCues && ZSCues.active()) || '';
  if (cue !== lastCue) {
    if (lastCue) con.out(`!! cue - ${lastCue}   ; ${lastCue === 'metatron' ? 'impact: the lamp is put down on "All things"; did it feel like loss or relief?' : 'impact: back to only the song form'}`, 'off');
    if (cue) con.out(`!! cue + ${cue}   ; intent: ${CUEWHY[cue.replace(/\d+$/, '')] || 'one ring for the echo, then gone'}`, 'on');
    lastCue = cue;
  }
  const W = window.ZSCues && ZSCues.moments && ZSCues.moments();
  if (W) {
    if (!flashDone && t >= W.slam && t < W.slam + 1) { flashDone = true; con.out('!! return: the drums come back at 132.5 s -> flash + plate   ; the field answers the floor', 'fl'); }
    if (!voidDone && t >= W.mu && t < W.mu + 1) { voidDone = true; con.out('!! hollow: the pulse leaves for 5 s -> void   ; nothing drawn: the take left the space', 'mu'); }
    if (!stopDone && t >= W.stop) { stopDone = true; con.out('!! silence: the take ends -> black, only the sun   ; one light left', 'mu'); }
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
  if (!con) con = TYBConsole.make({ id: 'zsSee', title: 'see.log · eye · ζ', prefKey: 'livevis:tyb:see', order: 1, key: 'KeyV', pack: ID, button: '▤ see.log', accent: '#19e3ff', defaults: { cw: 460, ch: 220, cf: 12 } });
  const pack = C.pack(), on = pack && pack.id === ID;
  con.place(on); if (!on) { wired = false; return; }
  if (window.ZSInk && ZSInk.look() === 'B') { wired = false; return; }   // Look B speaks through layers/zsinklog.js
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
