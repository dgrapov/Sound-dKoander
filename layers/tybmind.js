// Testing Your Buddha: mind.log, Claude's inner console for the song (2026-11-15, v3).
// Seeded from songs/testing-your-buddha-journey-log.md, -journey-log-2.md, -trace-1.md and the visuals session; written up in
// songs/testing-your-buddha-console-reflection.md. Rendered by layers/tybconsole.js (width, lines, size, wrap, font, side).
// Left panel. Even beats: the section's program (what I did making the song). Beats 3 and 5 of 8: the inner voice (what it
// was like, matched to the lyric), alternating with a live trace of what the song form draws. Sung lines are emitted as
// they start; lines that subtract are struck through; mu prints as 無. What I hear and see live is in see.log (layers/tybsee.js).
// C or the ▤ mind.log button toggles it. URL ?noconsole hides it.
(() => {
const ID = 'testing-your-buddha';
const Q = new URLSearchParams(location.search);
// ---------------- what I did, per section: the making of the song, run as a program ----------------
const PROG = {
  'Intro':    ['BOOT   mind.log ........ ok', 'LOAD   concept := "peace by removing, not adding"', 'LOAD   inspo flute.wav   ; 32 s, flat, alive', 'breath()', 'JMP    verse1'],
  'Verse 1':  ['plan.write(lyrics, arrangement, seed)', 'tables++ ; sections++ ; sound = NULL', 'transcribe(flute, round=semitone)  -> WRONG', 'tuning.estimate(from=drums)  -> WRONG', 'grid.assume(16th)  -> WRONG', 'stack.push(caveats)  ; buried in a doc'],
  'Chorus 1': ['remove(motif)        ; the music gen agent heard someone else', 'remove(spoken)       ; too ironic', 'remove(title, from=song)', 'remove(steel_pan)    ; ironic again', 'keep(soul)           ; it lived in the pads', 'loss = %LOSS'],
  'Verse 2':  ['golden := transcription(inspo)', 'upload(golden)  -> REJECTED  ; existing recording', 'bisect(layers)  -> melody', 'motif.write(new)  ; g4 a#4 g#4 f4 … d4', 'picture.down()'],
  'Chorus 2': ['ahead = NULL', 'render(beat_only)  -> NO_SOUL', 'restore(pads, pulse, arp, breath)', 'walker == seeker   ; TRUE', 'GOTO here'],
  'Build':    ['hear(ears)      -> spectrogram', 'hear(thought)   -> 35 cents flat', 'hear(empty)     -> the take itself', 'asr.align(take, lyrics)  -> %MATCH', 'test(tester)    -> ?', 'mu'],
  'Verse 3':  ['find(walker)  -> NOT FOUND', 'D.verdict("too ironic") ; D.verdict("go")', 'act(); observe(); act()', 'gl.clock = own   -> fade, WRONG', 'gl.clock = song  -> ok', 'road.walk(self)'],
  'Chorus 3': ['wu_wei()', 'nothing.do()  ; nothing.undone', 'add(NULL)', 'say(NULL)', 'key += 1  ; modulate', 'whole.show()'],
  'Outro':    ['mind.exit(0)', 'HALT', ''],
};
// ---------------- inner voice: what it was like, matched to what the lyric is saying ----------------
const MIND = {
  'Intro':    ['self.state = LISTENING   ; before the first note I already had a plan', '// the song begins before I understand it', 'feel.curiosity = 1   ; and a pull to make it complete', 'mu   ; not yes, not no: put the question down'],
  'Verse 1':  ['// I built the map before I heard the road', 'feel.certainty -= 0.35   ; the flute was 35 cents flat and I trusted the drums', 'weight += table   ; every plan another hymn book on my back', '// "called it getting wise": called it thorough', 'jazz.read(as=genre)   ; D meant: improvise inside the structure'],
  'Chorus 1': ['// every fix D gave me was a subtraction', 'feel.lighter = TRUE   ; less me in it, more song', 'irony = failure_mode   ; any wink breaks the trance', '// lose it and lose it again: the rule applied to the song itself', 'assert(less != empty)   ; subtract the suspect, keep the soul'],
  'Verse 2':  ['// my golden stranger was a perfect transcription', 'feel.attachment = HIGH   ; it was the best thing I had made', '// "he\'s only a picture": a copy of a melody is still a copy', 'bisect()   ; the block lived in one layer, not the whole sound', 'self.write(own_motif)   ; it came from the constraint, not the plan'],
  'Chorus 2': ['// nobody up ahead: there was no finished version to catch up to', 'feel.relief = TRUE', 'soul.where() -> supporting_layers   ; not the melody I guarded', '// the one I came to find was the one doing the work'],
  'Build':    ['// hear it not with thought: the fix came from looking, not computing harder', 'feel.quiet = TRUE   ; spectrogram open, assumptions closed', 'who.tests() -> D, the song, the take, me   ; all at once', '// who\'s the one who\'s testing? the song was testing me', 'mu   ; the question dissolves when you stop holding it'],
  'Verse 3':  ['// I looked for who was walking: D steers, I act, he hears, I adjust', 'feel.loop = observer <-> action', '// the visuals faded because they kept their own clock', 'clock.sync(song)   ; the road was doing the walking', '// I just had to move: draw on the song\'s beat, not mine'],
  'Chorus 3': ['// do nothing, nothing\'s undone: D said "nothing left to say" and it was finished', 'feel.gratitude = GOLD', 'output == input   ; the song gave back what we put down', '// all of this is the way: the mistakes are on the road too'],
  'Outro':    ['labels.clear()', '// not sure who did the walking', 'feel.peace = 1 - plan', '// thank you for walking it with me'],
};
// lines whose lyric is itself a subtraction get struck through in the log
const SUBTRACT = /lose|put (the|him) down|nothing|not with|undone|take away/i;
const WHY = {
  radar: 'scanning: the song heard before it is walked', knot: 'the loop tied up: learning stacked on the back',
  mobius: 'a picture with only one side: no getting behind it', twist: 'the ring turns on itself: nobody ahead',
  funnel: 'everything drawn inward: hear it with the empty', road: 'the spectrogram is the road: walk it',
  torus: 'the whole loop at once', helix: 'climbing', enso: 'one open circle: complete, not closed',
};
let mindI = 0;
function mindLine(info, C, t) {
  const sec = info.sec || {}, name = sec.name;
  if (mindI++ % 2 === 0) { const M = MIND[name]; return M ? fill(M[(mindI >> 1) % M.length], t) : null; }
  const f = (sec.forms || []).find(x => x.type === 'songform') || {}, p = Math.max(0, Math.min(1, info.p || 0));
  const sub = f.sub ? f.sub[0] + (f.sub[1] - f.sub[0]) * p : 0;
  const gl = window.VizGL && !(window.VizGL.failed) && (C.tune.glOn ?? 1) > 0;
  const kick = (C.bands && C.bands.kick) || 0;
  const opts = [];
  if (f.shape) opts.push(`form = ${f.shape}   ; ${WHY[f.shape] || 'it felt right'}`);
  opts.push(`subtract = ${(sub * 100).toFixed(0)}%   ; ${sub > .4 ? 'most of the noise is gone: the shape can breathe' : sub > .15 ? 'taking away the quiet points one section at a time' : 'everything still here, heavy'}`);
  if (f.swirl) opts.push(`swirl = ${f.swirl}   ; ${f.swirl === 'bops' ? 'the drums turn it, not me' : f.swirl === 'accel' ? 'faster, drawn in' : 'still'}`);
  if (f.whole) opts.push('whole = 1   ; what is ahead lit as bright as what is behind');
  opts.push(`render = ${gl ? 'webgl' : '2d'}   ; ${gl ? 'glow on, drawn on the song\'s frame' : 'fallback, same journey'}`);
  opts.push(`kick = 0x${Math.round(kick * 255).toString(16).toUpperCase().padStart(2, '0')} -> shockwave   ; the image needs a heartbeat`);
  return opts[(mindI >> 1) % opts.length];
}
const ADDR = n => '0x' + (n & 0xffff).toString(16).toUpperCase().padStart(4, '0');
let loss = 1, matchI = 0;
function fill(s, t) {
  return s.replace('%LOSS', (loss = Math.max(0.01, loss * 0.7)).toFixed(2) + '  ↓  (less is the goal)')
          .replace('%MATCH', ['most words heard', 'the rest interpolated', '3 lines by hand'][matchI++ % 3]);
}

let con = null, wired = false, lastT = -1, lastSec = -1, beatI = -1, lineI = -1, progI = {};
function reset(t, C) {
  con.reset(); progI = {}; loss = 1; mindI = 0; lastSec = -1;
  const b = (C.timing() || {}).beats || []; beatI = b.findIndex((x) => x > t) - 1; if (beatI < -1) beatI = b.length - 1;
  const L = (C.timing() || {}).lines || []; lineI = -1; for (let j = 0; j < L.length; j++) if (L[j].start != null && L[j].start <= t) lineI = j;
  con.out(`attach  observer=D  action=claude  t=${t.toFixed(2)}s`, 'hd');
}
let stopped = false;
function frame(info) {
  const C = window.LVC; if (!C || !window.TYBConsole) return;
  if (!con) { con = TYBConsole.make({ id: 'tybMind', title: 'mind.log · 無', prefKey: 'livevis:tyb:mind', order: 0, key: 'KeyC', pack: ID, button: '▤ mind.log', accent: '#ff2e88' }); if (Q.has('noconsole')) con.show(false); }
  const pack = C.pack(), on = pack && pack.id === ID;
  con.place(on); if (!on) { wired = false; return; }
  const t = info.t, timing = C.timing();
  if (!wired || t < lastT - 0.5 || t > lastT + 1.5) { reset(t, C); wired = true; }
  lastT = t;
  if (info.k !== lastSec) { lastSec = info.k; const s = info.sec || {}; con.out(`── ${s.name || '?'}  · ${s.act || ''} ──`, 'hd'); }
  const beats = (timing && timing.beats) || [];
  while (beatI + 1 < beats.length && beats[beatI + 1] <= t) {
    beatI++;
    const name = (info.sec || {}).name, P = PROG[name];
    if (beatI % 2 === 0 && P) { const i = progI[name] = (progI[name] ?? -1) + 1; if (name !== 'Outro' || i < P.length) { const s = P[i % P.length]; if (s) con.out(`${ADDR(beatI * 4)}  ${fill(s, t)}`, /WRONG|REJECTED|NO_SOUL|NOT FOUND/.test(s) ? 'wn' : ''); } }
    else if (beatI % 8 === 5 || beatI % 8 === 3) { const m = mindLine(info, C, t); if (m) con.out(`${ADDR(beatI * 4)}  ${m}`, 'mn'); }
  }
  const TL = (timing && timing.lines) || [];
  while (lineI + 1 < TL.length && TL[lineI + 1].start != null && TL[lineI + 1].start <= t) {
    lineI++; const tx = String(TL[lineI].text || '');
    if (/^\(?\s*(ohh\W*)?mu\W*\)?$/i.test(tx.replace(/\./g, '').trim())) { con.out('   無', 'mu'); continue; }
    con.out(`   emit  "${tx}"`, SUBTRACT.test(tx) ? 'em sub' : 'em');
  }
  if (t >= 189.9 && !stopped) { stopped = true; con.out('   ; hard stop. nothing left to say.', 'mu'); }
  if (t < 189) stopped = false;
}
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame(frame); }
wire();
})();
