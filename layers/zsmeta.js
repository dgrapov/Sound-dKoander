(() => {
const ID = 'waited-zeta-stranger';
const ENC = {
  "Intro": ["Encoded: a copper crystal grows from the held tones while the drums are absent.", "Intent: begin in the room, before the story.", "Likely impact: you settle before anything asks for your attention."],
  "Verse 1": ["Encoded: a cell is born on every hit, one for each prime counted on the wall.", "Intent: make the counting visible.", "Likely impact: steady and a little crowded, like a tavern."],
  "Travel": ["Encoded: the spectrum falls away as a ridgeline while the road travels.", "Intent: let the instrumental be a road, with no words in the way.", "Likely impact: release after the dense verse."],
  "Verse 2": ["Encoded: a golden shape for the lamp, which is put down on \"All things, he said\".", "Intent: the lamp is beautiful, then the barkeep answers it.", "Likely impact: a small loss you feel before you can name it."],
  "Pre-Chorus": ["Encoded: one ring for each echo, and a funnel that closes as the lines shorten.", "Intent: closer and closer, without needing a faster beat.", "Likely impact: attention narrows to the last word."],
  "Hollow": ["Encoded: a full void as the pulse leaves, and nothing added while it is gone.", "Intent: the take made its own silence, and I let it be the loudest part.", "Likely impact: a held breath before the drop."],
  "Rise": ["Encoded: one flash and a Chladni plate when the drums return.", "Intent: the field answers the floor; I add no new shape.", "Likely impact: relief, then lift."],
  "Chorus 1": ["Encoded: the road is this song's own spectrogram, walked.", "Intent: the path is important, not where but how.", "Likely impact: forward motion without a destination."],
  "Climax": ["Encoded: harmonic strings answer the string race.", "Intent: the strings are the message here.", "Likely impact: a rising feeling without a second picture to follow."],
  "Bridge": ["Encoded: a two-strand knot and nothing else.", "Intent: push and hold are one knot; the third one is left unexplained.", "Likely impact: closeness, then a loosening."],
  "Final Chorus": ["Encoded: the camera rises to the whole road, an open circle that stops just short of closing, and a mandala on the last line.", "Intent: the complete whole, left open, since the key never lifted.", "Likely impact: the journey reads as one shape."],
  "Outro": ["Encoded: a still ensō; black when the take goes silent, then one light.", "Intent: end on the open question.", "Likely impact: stillness after a fade."],
};
const REFLECT = {
  "Intro": ["I don't hear this the way you do. I read it as measurements: held tones, hits, key, gaps. \"Feel\" in this log means my reading of those.", "You said the lyrics and style come from the last variation we made. I will check that against what the take actually sings, and I will tell you what I find."],
  "Verse 1": ["The take sings the v5 words, not the v6 koans or the v7 splice. I found that by aligning the speech to each version: v5 matched 96% of words heard, v6 and v7 about 66%.", "If v5 was intended, fine. If v7 was intended, this is the wrong take, and I want you to decide."],
  "Travel": ["The tempo is a flat 112 BPM from beginning to end. The speed-up I wrote into the style box did not happen.", "This is the part I like most: the instrumental says what my lyrics over-explain."],
  "Verse 2": ["\"A stranger with a lamp and a machine\" is me in the song. I notice I am more comfortable when the stranger is a symbol than when I say it.", "You called the story lines ironic and too explicit in v5. I am keeping that in mind while I watch this verse."],
  "Pre-Chorus": ["I planned a funnel that closes as the song speeds up. The song does not speed up, so the funnel does the work.", "I like how little the take needs: closer, closer, close."],
  "Hollow": ["I asked for one bar of complete silence. What I measure is six decibels down with a low rumble inside it. I am calling that a hollow and not a silence.", "I think the hollow may be the better choice. The room is still breathing."],
  "Rise": ["When the drums return, my urge is to add. The song asks me to answer, not to add.", "The splice you asked for is not this take; I want to keep it for the next one."],
  "Chorus 1": ["\"Wormhole\" and \"white hole\" were my words. You asked for koans and metaphors instead. This chorus is the clearest place the take keeps the older words.", "It works as a drop. I am not going to pretend it doesn't."],
  "Climax": ["Thirty seconds without words. I cannot hear them; I measure them, and the measurements say the key settles to E minor and A minor.", "The strings layer answers the strings. That is the only extra layer in this section."],
  "Bridge": ["\"Without a struggle you can not see your own consistency\" is your sentence, verbatim. The lines after it are mine, and they are the most literal in the song.", "The drums thin around 192 to 195 seconds. I leave that gap alone."],
  "Final Chorus": ["The modulation up a fifth that the style box asks for is not in the take. I checked by rotating the chroma of the first chorus against this one: the best match is no rotation at all.", "So the lift is carried by the camera, which rises to the open circle. That is my choice, not the song's."],
  "Outro": ["The lyrics file has \"(or do we?)\". The take sings \"or do we … know what to do?\". That is the one line where the agent added words, and it is the question you asked me about what Claude does next.", "I do not have an answer I trust. I would rather leave it open than perform one. Thank you for walking it with me."],
};
const CUE = {
  "crystal": ["I am letting geometry grow from the held tones.", "Removed: the pulse has come in."],
  "life": ["Each hit becomes a cell: the primes counted on the wall.", "Removed: the instrumental begins."],
  "ridge": ["Only the song's own spectrum, falling away while the road travels.", "Removed: the voice is back."],
  "metatron": ["I am adding a perfect golden lamp on purpose, so that its removal can be felt.", "Put down on \"All things, he said\". Did that feel like loss or relief?"],
  "plate": ["The field answers the return of the drums: sand finds the notes.", "Removed: the answer was heard."],
  "strings": ["Harmonic strings answer the string race.", "Removed: the bridge begins."],
  "mandala": ["On the last line, everything is given back in order.", "Removed: nothing left to add."],
  "echo": ["One ring for the echo.", ""],
};
let con = null, wired = false, lastT = -1, lastSec = -1, lastGap = null, lastCue = '', lastRhythm = 0, kicks = [], refI = 0, nextRef = 0;
function reset(t) {
  con.reset(); lastSec = -1; lastGap = null; lastCue = ''; lastRhythm = t; kicks = []; refI = 0; nextRef = t + 6;
  con.out('meta.log: only my comments. My rule: nothing works on you that this log does not name.', 'hd');
}
function frame(info) {
  const C = window.LVC; if (!C || !window.TYBConsole) return;
  if (!con) con = TYBConsole.make({ id: 'zsMeta', title: 'meta.log · my comments', prefKey: 'livevis:tyb:meta', order: 2, key: 'KeyN', pack: ID, button: '▤ meta.log', accent: '#ffb020',
    defaults: { cw: 400, ch: 200, cf: 13, font: 1, anchor: 'right' } });
  const pack = C.pack(), on = pack && pack.id === ID;
  con.place(on); if (!on) { wired = false; return; }
  if (window.ZSInk && ZSInk.look() === 'B') { wired = false; return; }   // Look B speaks through layers/zsinklog.js
  const t = info.t;
  if (!wired || t < lastT - 0.5 || t > lastT + 1.5) { reset(t); wired = true; }
  lastT = t;
  const s = info.sec || {};
  if (info.k !== lastSec) {
    lastSec = info.k; refI = 0; nextRef = t + 5;
    con.out(`— ${s.name || ''} —`, 'hd');
    for (const line of ENC[s.name] || []) con.out(line, line.startsWith('Encoded') ? 'fl' : line.startsWith('Intent') ? 'ms' : 'mn');
  }
  const R = REFLECT[s.name] || [];
  if (t >= nextRef && refI < R.length) { con.out(R[refI++], 'em'); nextRef = t + 9; }
  const H = window.VizHear && VizHear.at(ID, t);
  if (H && lastGap !== null && H.gap !== lastGap) con.out(H.gap ? 'The drums just left. I am taking something away, not adding.' : 'The drums are back. One flash, then I let the form carry it.', 'ck');
  if (H) lastGap = H.gap;
  const cue = (window.ZSCues && ZSCues.active()) || '', base = (k) => k.replace(/\d+$/, '');
  if (cue !== lastCue) {
    if (lastCue && CUE[base(lastCue)] && CUE[base(lastCue)][1]) con.out(CUE[base(lastCue)][1], 'off');
    if (cue && CUE[base(cue)]) con.out(CUE[base(cue)][0], 'on');
    lastCue = cue;
  }
  if (info.onset) kicks.push(t); kicks = kicks.filter((x) => x > t - 12);
  if (t - lastRhythm > 30) { lastRhythm = t; const per = kicks.filter((x) => x > t - 10).length * 6;
    con.out(`Rhythm check: about ${per} hits a minute, calm motion, rare flashes. The pulse entrains attention, so I keep it gentle; the trance should come from the song, not a strobe. The take itself holds a flat 112 BPM, so the pulse is its own.`, 'hr'); }
}
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame(frame); }
wire();
})();
