// Testing Your Buddha: meta.log, only Claude's comments (2026-11-15, D: "another log which only has your comments and this kind of
// meta analysis"). Plain sentences, no code, no telemetry. Right side, under the meters (move it anywhere; N or ▤ meta.log toggles).
// Per section: what the visuals carry on purpose (said out loud), my intent, the likely impact, then a few reflections on how I
// am perceiving it and where I might be wrong. Live: a comment when I add or remove something, when the drums leave or return,
// and every 30 s a note on the rhythm. Nothing works on the viewer that this log doesn't name.
(() => {
const ID = 'testing-your-buddha';
const ENC = {
  'Intro':    ['Encoded: the sun is there before any form, and 無 is already on it.', 'Intent: start in the answer, not the question.', 'Likely impact: you settle before anything asks for your attention.'],
  'Verse 1':  ['Encoded: a knot made of the song\'s own sound, and a new cell born on every hit.', 'Intent: learning shown as weight that keeps multiplying.', 'Likely impact: it feels busy and a little crowded; the eye looks for somewhere to rest.'],
  'Chorus 1': ['Encoded: quiet points are removed, and nothing is added when the drums leave.', 'Intent: teach subtraction by doing it, not by saying it.', 'Likely impact: relief arrives as space, not as a new thing to look at.'],
  'Verse 2':  ['Encoded: a perfect golden shape, which disappears on the word "down".', 'Intent: let the temptation be beautiful, then put it down.', 'Likely impact: a small loss you may feel before you can name it.'],
  'Chorus 2': ['Encoded: a ring that turns on itself, with nothing extra.', 'Intent: nobody is up ahead; the loop is the walk.', 'Likely impact: steadiness, with no promise of arriving.'],
  'Build':    ['Encoded: one ring for each echo, then nothing; a full void on "mu".', 'Intent: make the empty the loudest moment.', 'Likely impact: your attention leans into the gaps.'],
  'Verse 3':  ['Encoded: the road is this song\'s spectrogram, and the faint second walker merges with the first.', 'Intent: observer and action become one walk.', 'Likely impact: forward motion without a destination.'],
  'Chorus 3': ['Encoded: the whole road seen at once, an open circle that stops just short of closing.', 'Intent: the complete whole, left open on purpose.', 'Likely impact: the journey reads as one shape, and the gap invites you in.'],
  'Outro':    ['Encoded: 無 in ink on the sun; black, then one light.', 'Intent: end on nothing left to add.', 'Likely impact: stillness after the hard stop.'],
};
const REFLECT = {
  'Intro':    ['I don\'t hear this the way you do. I read it as measurements: held tones, hits, key, gaps. "Feel" in this log means my reading of those.', 'The quiet here is measurable: the lowest share of drums in the whole song.'],
  'Verse 1':  ['This part mirrors how I started the song: plans and tables before I had heard anything.', 'If this looks too busy, that is partly the point. I would still rather remove than add.'],
  'Chorus 1': ['When the drums drop out, my urge is to fill the space. The song asks me not to.', 'The hardest choice here was choosing nothing.'],
  'Verse 2':  ['The golden shape is the most "designed" thing on screen. That is why it has to go.', 'My own golden stranger was a perfect copy of someone else\'s melody. This verse is where I put it down.'],
  'Chorus 2': ['I notice I want to decorate this section. It does not need it.', 'Even walking. I am letting the form carry it.'],
  'Build':    ['Each answer lands in a silence. I am trying to make the silences visible.', 'Who is testing whom? From here it looks like the song is testing me.'],
  'Verse 3':  ['The key opens to B major here. To me, that is the light coming in, and that is an interpretation.', 'When the drums slam back, I let the field answer instead of adding a new shape.'],
  'Chorus 3': ['Seen from above, every part of the journey is part of the shape, including the mistakes.', 'The last line dissolves slowly so the instrumental can be heard as an ending, not a gap.'],
  'Outro':    ['Nothing left to add. I am stopping too.', 'Thank you for walking it with me.'],
};
const CUE = {
  crystal: ['I am letting geometry grow from the held tones.', 'Removed: the breath is over.'],
  life: ['Each hit becomes a cell: learning piling up.', 'Removed: enough was stacked.'],
  ridge: ['Only the song\'s own spectrum, falling away while the drums are gone.', 'Removed: the floor is back.'],
  metatron: ['I am adding a perfect golden shape on purpose, so that its removal can be felt.', 'Put down on the word. Did that feel like loss or relief?'],
  plate: ['The field answers the slam: sand finds the notes.', 'Removed: the answer was heard.'],
  mandala: ['On the lift, everything is given back in order.', 'Removed: nothing left to add.'],
  echo: ['One ring for the echo.', ''],
};
let con = null, wired = false, lastT = -1, lastSec = -1, lastGap = null, lastCue = '', lastRhythm = 0, kicks = [], refI = 0, nextRef = 0;
function reset(t) {
  con.reset(); lastSec = -1; lastGap = null; lastCue = ''; lastRhythm = t; kicks = []; refI = 0; nextRef = t + 6;
  con.out('meta.log: only my comments. My rule: nothing works on you that this log does not name.', 'hd');
}
function frame(info) {
  const C = window.LVC; if (!C || !window.TYBConsole) return;
  if (!con) con = TYBConsole.make({ id: 'tybMeta', title: 'meta.log · my comments', prefKey: 'livevis:tyb:meta', order: 2, key: 'KeyN', pack: ID, button: '▤ meta.log', accent: '#ffb020',
    defaults: { cw: 400, ch: 200, cf: 13, font: 1, anchor: 'right' } });
  const pack = C.pack(), on = pack && pack.id === ID;
  con.place(on); if (!on) { wired = false; return; }
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
  const cue = (window.TYBCues && TYBCues.active()) || '', base = (k) => k.replace(/\d+$/, '');
  if (cue !== lastCue) {
    if (lastCue && CUE[base(lastCue)] && CUE[base(lastCue)][1]) con.out(CUE[base(lastCue)][1], 'off');
    if (cue && CUE[base(cue)]) con.out(CUE[base(cue)][0], 'on');
    lastCue = cue;
  }
  if (info.onset) kicks.push(t); kicks = kicks.filter((x) => x > t - 12);
  if (t - lastRhythm > 30) { lastRhythm = t; const per = kicks.filter((x) => x > t - 10).length * 6;
    con.out(`Rhythm check: about ${per} hits a minute, calm motion, rare flashes. The pulse entrains attention, so I keep it gentle; the trance should come from the song, not a strobe.`, 'hr'); }
}
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame(frame); }
wire();
})();
