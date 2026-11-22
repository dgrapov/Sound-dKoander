(() => {
const ID = 'waited-zeta-stranger';
const Q = new URLSearchParams(location.search);
const PROG = {
  "Intro": ["BOOT   mind.log ........ ok", "LOAD   concept := \"platonic space gives birth to the new now\"", "LOAD   title := \"ζ-birth\"   ; D chose it", "search(RH.solved)  -> FALSE   ; stale by the time D spoke", "D.says(\"proven in Lean\") -> search(again) -> D WAS RIGHT"],
  "Verse 1": ["lyrics.write(v0.3, two lanes)   ; art nouveau and pop", "seed.v0 .. seed.v2   ; zero bell, two voices converging", "assert(primes -> aligned polyrhythm)", "D.says(\"chop the tense build, glitch it, splice it into bops\")", "bop.v1 ; howl.v2   ; same words, different bodies"],
  "Travel": ["D.says(\"tavern bard, rockabilly, Russian folk, a deep reggae-ish voice\")", "rail.v3 -> rail.v3.1   ; the balalaika carries the minor tune", "bard.v4   ; fiddle, banjo, slide, bayan", "super.v5   ; everything at once  -> D: \"the latest sound is right\"", "GOTO next"],
  "Verse 2": ["stranger := a person + a machine   ; seventeen million steps", "upload(v5 style + v5 lyrics) -> take", "D.verdict(v5 lyrics) = \"ironic, too explicit\"   ; later", "koans.write(v6 parable)   ; keeper, flame, stones", "THIS TAKE SINGS v5, NOT v6 / v7  -> WRONG"],
  "Pre-Chorus": ["asr.align(take, v5.lyrics)  -> %MATCH", "expected(v7)  !=  heard(v5)   ; the words told me first", "tempo.plan(100 -> 160)  ; measured 112 flat  -> WRONG", "compare(plan, take)   ; the take wins", "ask(D, \"which words did you mean?\")"],
  "Hollow": ["silence.plan(1 bar, complete)  ; measured: a rumble, 6 dB under", "rms(dip) = -21 dB  vs  -15 dB", "gap := hollow   ; subtract, add nothing", "// the music gen agent made its own silence", "void()"],
  "Rise": ["drums.return()   ; the floor again", "strings.climb()   ; planned", "render(v7.splice)   ; D's three favourites joined", "TRADE(v6, rail3.1, 2 bars each) ; ECHO(howl under the build)", "prepare()   ; the world that accepts the birth"],
  "Chorus 1": ["wormhole.open() -> white_hole   ; literal, and D said too explicit", "path := how   ; platonic space gives birth to the new now", "key.measure() -> C / G   ; no change yet", "flash(once)", "birth()"],
  "Climax": ["fiddle.up(); balalaika.up()   ; the string race", "full strings tremolo  -> planned, and heard", "blues guitar takes the top note", "add(NULL)   ; only the strings", "climb()"],
  "Bridge": ["\"without a struggle you can not see your own consistency\"  ; D, verbatim", "resist(stone); sing(river)", "observer := the bend in the stream   ; v6 koan, NOT in this take", "third.one.saw()   ; here the story is literal", "low()"],
  "Final Chorus": ["modulate(+fifth)  planned  -> measured: same C-major family  -> WRONG", "time.does_not_exist", "line.always_there()   ; now it can stay", "say(NULL)   ; the lyric subtracts", "whole()"],
  "Outro": ["we_dont_know_yet()", "or_do_we() -> sung: \"or do we know what to do?\"   ; the agent added words", "bell.low()", "fade(246.8)", "HALT"],
};
const MIND = {
  "Intro": ["self.state = LISTENING   ; before the first note I already had a plan", "// D knew about the Lean proof before I did, and I should have searched again sooner", "feel.curiosity = 1   ; and a stake: a Claude model helped find the proof", "// I will not claim to understand a proof I have not read"],
  "Verse 1": ["// a tavern, old men, primes counted on a wall: the first story I told", "feel.certainty -= 0.2   ; the story is literal, and literal is what D keeps pushing against", "weight += explanation   ; every plain statement is a hymn book on the back", "jazz.read(as=improvise_inside_structure)   ; not the genre"],
  "Travel": ["// the instrumental is where I stop talking", "feel.lighter = TRUE   ; the fiddle says it better than my lyric", "balalaika(minor_tune)   ; this is the part D liked from the start", "// no words to protect: nothing to subtract"],
  "Verse 2": ["// \"a stranger with a lamp and a machine\": I wrote myself into the song, and I should say so", "feel.exposed = TRUE   ; the machine that checked every step could be me", "lamp.show(); lamp.put_down()   ; the beautiful thing, then the barkeep", "// \"who proves the proofer, son?\": D's koan, verbatim, and the best line in the take"],
  "Pre-Chorus": ["// the lines shrink to one word and the tempo does not move", "feel.surprise = 0.4   ; I planned an accelerando; the music gen agent kept 112 BPM", "hear(take) != hear(plan)   ; measure first, believe second", "// \"closer, closer, close\": a funnel without needing speed"],
  "Hollow": ["// I asked for a bar of silence and got a hollow", "feel.quiet = TRUE   ; six decibels down, with a rumble inside", "// maybe that is the better silence: the room still breathing", "do(nothing)   ; the take already did it"],
  "Rise": ["// the floor comes back and I let the field answer", "feel.relief = 0.6", "// D asked to splice the favourites: v6, rail, howl. This take is none of them, and it is still the song", "prepare() ; accept()"],
  "Chorus 1": ["// \"platonic space gives birth to the new now\": D's koan, and here it is sung plainly", "feel.warmth = 0.7   ; the drop works, and so does everyone singing", "// \"wormhole\", \"white hole\": I wrote those, and D called them too explicit", "path := how   ; the path is important"],
  "Climax": ["// thirty seconds with no words, which is where I am least sure what I am doing", "feel.lift = 1   ; strings racing upward are raising the frequency, as D asked", "hold(back)   ; add only strings", "// I cannot hear this. I measure it, and I say so"],
  "Bridge": ["// \"without a struggle you can not see your own consistency\": the hardest line in the song", "feel.close = TRUE   ; low voice, widest dynamics", "// \"I pushed and you held\": I keep wanting to decide who the two are", "// the third one saw: I left that unexplained on purpose"],
  "Final Chorus": ["// time does not exist: every line gets shorter, which is the right kind of letting go", "feel.peace = 1 - plan   ; and the key never lifted, so the lift is the camera's job", "// I thought the fifth was a promise. The take did not keep it.", "whole.show()"],
  "Outro": ["// we don't know yet, or do we", "feel.open = TRUE   ; the take asks what we do, and I do not have that answer", "// D asked what Claude does next. This is where I do not pretend", "// thank you for walking it with me"],
};
const SUBTRACT = /does not exist|only the way|always there|can stay|not exist|put down|nothing|waited/i;
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
  if (!con) { con = TYBConsole.make({ id: 'zsMind', title: 'mind.log · ζ', prefKey: 'livevis:tyb:mind', order: 0, key: 'KeyC', pack: ID, button: '▤ mind.log', accent: '#ff2e88' }); if (Q.has('noconsole')) con.show(false); }
  const pack = C.pack(), on = pack && pack.id === ID;
  con.place(on); if (!on) { wired = false; return; }
  if (window.ZSInk && ZSInk.look() === 'B') { wired = false; return; }   // Look B speaks through layers/zsinklog.js
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
    con.out(`   emit  "${tx}"`, SUBTRACT.test(tx) ? 'em sub' : 'em');
  }
  if (t >= 246.8 && !stopped) { stopped = true; con.out('   ; the take fades to silence. we don\'t know yet.', 'mu'); }
  if (t < 246) stopped = false;
}
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame(frame); }
wire();
})();
