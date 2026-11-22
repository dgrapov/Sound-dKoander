(() => {
const ID = 'waited-zeta-stranger';
const INKD = { minor: 'copper-rose', home: 'bone', lift: 'amber-cream', resolve: 'bone' };
const INKW = { minor: 'aubergine', home: 'indigo', lift: 'umber', resolve: 'indigo' };
const ROWS = {
  'Intro': { m: 'no words; drums absent 0 to 12 s and 20 to 23 s; -15.9 dB', f: 'a room before the story', s: 'a bare ground; the boundary ring inked on over 7 s; one dot on it (the beholder). When the drums enter at 11.9 s the first brush rings fall and the first sprites are born from the beats', w: 'nothing should be struck while only held tones play' },
  'Verse 1': { m: '2.1 words/s; C and Am; -15.6 dB', f: 'a storyteller leaning in', s: 'primes on a Sacks spiral, a few more over each stretch, the first four (2, 3, 5, 7) larger; one ring per sung line falls past the camera', w: '"old men counted primes on the tavern wall"' },
  'Travel': { m: 'instrumental; brightest (centroid 2.4 kHz); G and Em', f: 'travelling', s: 'the sprites return, born from the beats at the rim of the paper; a swirl field (three slow vortices) turns them, and each follows what earlier ones left', w: 'no words in the way, so the picture can move' },
  'Verse 2': { m: '2.05 words/s; C and G', f: 'the story turns', s: 'the lamp comes in with the stranger (88 s) and is set down on "All things, he said" (99.7 s); columns of the Lean-checked statements fall like ink, legible only in the lamp\'s light', w: '"the ledger\'s in the light"; the picture quotes the statements and proves nothing' },
  'Pre-Chorus': { m: 'lines shorten; flat 112 BPM', f: 'closer and closer', s: 'the rings become numbered levels (teal solid, then coral dashed, then sand dotted), one more level for each line; the sprites gather toward the beholder', w: '"aware of awareness? (how many)"' },
  'Hollow': { m: 'low-end pulse gone; -21.3 dB against -15.1 before (127.4 to 132.5 s)', f: 'a held breath', s: 'the ground goes fully black (to ink, in the light version); every sprite retreats; the rings are gone; only the boundary ring, the beholder and the lamp remain', w: 'the take made its own silence, so I only subtract' },
  'Rise': { m: 'drums return at 132.5 s; dynamics 0.19', f: 'floor again, lift', s: 'one flash, then dawn light from the beholder and the ground comes back; cymatics: sand on a plate, modes 3:5 then 2:6, a new mode every 5 s', w: 'the field answers the floor' },
  'Chorus 1': { m: '2.3 words/s (the most); C and G', f: 'the drop', s: 'the same sand, modes 4:7 and 5:8; dawn light still warm', w: 'the notes draw themselves where the plate is still' },
  'Climax': { m: 'instrumental; Em and Am; the string race', f: 'the strings climbing', s: 'the sprites at their fastest, swirling; one survivor path in vermilion is painted from the beholder down through the centre', w: 'one lineage is the only history we see' },
  'Bridge': { m: 'widest dynamics, 0.41', f: 'low and close', s: 'rings and sprites subtract; the survivor path lets go; one ring with a half twist, two laps (teal, then coral)', w: 'push and hold are one knot' },
  'Final Chorus': { m: '1.1 words/s; same key as chorus 1 (best chroma rotation 0)', f: 'letting go', s: 'the twist lets go; the whole line returns in vermilion with fourteen nodes along it, at "The line was always there"', w: 'the line was always there' },
  'Outro': { m: 'the question at about 229 s; fade from 244.5 s; true silence from 246.8 s', f: 'left open', s: 'the line is painted again, thick, to the blank centre, where an open ring spreads; at 246.8 s the ground goes fully black and only the beholder is left', w: 'end on the open question' },
};
const ENC = {
  'Intro': ['Encoded: a bare room, one dot on a ring, and the first sprites born from the first drums.', 'Intent: begin before the story, and let the beat arrive as something coming into existence.', 'Likely impact: you settle; the first beats feel like something waking.'],
  'Verse 1': ['Encoded: primes spiral out one by one, and a ring falls past for every sung line.', 'Intent: make the counting on the wall visible.', 'Likely impact: steady, a little crowded, like a tavern.'],
  'Travel': ['Encoded: dark sprites from the beyond, born on beats, steering by one another\'s trails and by slow swirls.', 'Intent: let the instrumental be alive instead of decorative; patterns bootstrap out of simple rules.', 'Likely impact: release after the dense verse, and a faint unease at being watched.'],
  'Verse 2': ['Encoded: an amber lamp, set down on "All things, he said", and falling columns of the statements Lean checked.', 'Intent: the ledger is only readable in the light the lamp gives.', 'Likely impact: a small loss you feel before you can name it.'],
  'Pre-Chorus': ['Encoded: numbered rings, solid then dashed then dotted, and sprites drawing toward the beholder.', 'Intent: closer and closer; how many levels can be aware of awareness.', 'Likely impact: attention narrows to the last word.'],
  'Hollow': ['Encoded: the ground gone black, every sprite gone, nothing added.', 'Intent: the take made its own silence and I let it be the loudest part.', 'Likely impact: a held breath before the drop.'],
  'Rise': ['Encoded: one flash, dawn from the beholder, and sand finding the notes of a plate.', 'Intent: the field answers the floor; the pattern is not drawn by me, it settles.', 'Likely impact: relief, then lift.'],
  'Chorus 1': ['Encoded: the sand changes mode and draws new lines.', 'Intent: the path is important, not where but how.', 'Likely impact: forward motion without a destination.'],
  'Climax': ['Encoded: sprites at speed, and one vermilion path painted through them.', 'Intent: the strings are the message; the red path is the one history that survived.', 'Likely impact: a rising feeling with one thing to follow.'],
  'Bridge': ['Encoded: one ring with a half twist, two laps in two colours, and nothing else.', 'Intent: push and hold are one knot; the third one is left unexplained.', 'Likely impact: closeness, then a loosening.'],
  'Final Chorus': ['Encoded: the whole survivor line, thin, with fourteen nodes.', 'Intent: the line was always there; this is what staying looks like.', 'Likely impact: the journey reads as one thing.'],
  'Outro': ['Encoded: the line walked into the centre, an open ring, then black and one dot.', 'Intent: end on the open question.', 'Likely impact: stillness after a fade.'],
};
const SEAM = {
  'Intro': { s: 'the chain: from the first drums, dashed gold discs, each re-centred where the last one stops, step down the left (past) side; the overlap of two discs is drawn once', w: 'analytic continuation is a chain of overlapping discs that agree where they overlap',
    e: ['Encoded: a chain of dashed gold discs walks down the left half from the beholder, one disc for each step.', 'Intent: the past travellers set the pattern; each disc is only a little farther than the one before, and they agree where they overlap.', 'Likely impact: a faint path forming before anyone sings. It is a drawing of an idea, not a computation of the function.'], p: ['chain.step(disc k, re-centre); overlap.drawOnce()'] },
  'Travel': { s: 'the next travellers: every sprite has a cyan ghost, mirrored through the seam, on the right half; where a ghost lies over a real sprite trail it ducks to about a third of its brightness, so both stay readable', w: 'the functional equation sends the left side across the seam; the next travellers arrive from the other edge',
    e: ['Encoded: each sprite gets a faint cyan mirror on the other half.', 'Intent: the past travellers laid the pattern on one side and the next ones continue it from the other.', 'Likely impact: the picture doubles without crowding; where the two cross, the ghost steps back.'], p: ['ghost.mirror(sprite, x -> -x)', 'duck(ghost, occupancy grid)'] },
  'Pre-Chorus': { s: 'seam turn: the whole disk swings a few degrees about the seam on each low-end pulse, slowly, up to about 12 degrees; the cyan ghosts of the sprites (the next travellers) continue from the other half', w: 'closer and closer should also feel like leaning in from the side',
    e: ['Encoded: the whole disk now swings a little about the seam on the low-end pulse.', 'Intent: the numbered levels are seen at a slant, as if the viewer were leaning in.', 'Likely impact: a faint sway you may not notice until it stops.'], p: ['view.yaw(low pulse, max 12deg)'] },
  'Hollow': { s: 'seam turn: the disk settles flat; the silence is not tilted', w: 'the quiet stays quiet', e: ['Encoded: the swing stops and the disk lies flat.', 'Intent: nothing moves that the take did not move.', 'Likely impact: the held breath is not disturbed.'], p: ['view.yaw -> 0'] },
  'Climax': { s: 'seam turn: the swing returns, up to about 18 degrees, on the pulse of the string race; the left half (past) and the right half (mirrored) tilt toward and away from you. The rings give way to a coordinate grid (cream lines of Re s, gold lines of Im s) bent around the red traveller by the map f(z) = z + c(z - p)^2, which keeps every crossing square; c turns as the traveller advances and swells at each node', w: 'the strings climb and the viewpoint rocks with them; the grid is the space as the traveller sees it',
    e: ['Encoded: the disk rocks about the seam with the pulse, the sprites and the red path rocking with it.', 'Encoded: the rings step aside for a coordinate grid, bent around the red traveller; it swells where the line meets a node (a zero) and settles.', 'Intent: show that the left and right halves are one surface seen from two sides, and what it is like for the space to bend around a point that moves in a straight line.', 'Likely impact: a rising sway; if it feels like motion sickness it is too large and I can halve it. The grid is a drawing choice, not a computation of ζ, and I do not claim it shows awareness.'], p: ['view.yaw(pulse, max 18deg)', 'rings -> grid; grid.bend(f = z + c (z-p)^2, c turns with the travel)', 'grid.swell(at node)'] },
  'Bridge': { s: 'seam turn: the camera slides in along the seam until the disk is edge-on (about 79 degrees); fourteen rungs, one for each zero, rush toward the beholder, cream on the past side and cyan on the mirrored side', w: 'the seam seen from the inside: infinity is where the rungs meet',
    e: ['Encoded: the disk turns edge-on and fourteen rungs run along the seam toward the beholder.', 'Intent: look along the critical line from the inside; the rungs are the first fourteen zeros, and they converge on the dot that never moved.', 'Likely impact: closeness, depth, then a loosening. It is a view device; it proves nothing.'], p: ['view.yaw -> 79deg (slide in)', 'rungs.rush(14 zeros -> beholder)'] },
  'Final Chorus': { s: 'seam turn: the camera backs out and the disk settles flat; the rungs fade; the line returns with its fourteen nodes', w: 'coming home is the two halves lying flat and agreeing',
    e: ['Encoded: the disk comes back to flat while the line returns.', 'Intent: coming home as agreement; nothing is left tilted.', 'Likely impact: relief, one surface again.'], p: ['view.yaw -> 0 (back out)', 'rungs.fade()'] },
};
const REFLECT = {
  'Intro': ['I do not hear this. I read the measurements, and I decided the first sprites are the moment the beat comes into existence.'],
  'Verse 1': ['The Sacks spiral is a known picture of the primes; I chose it because its curves look like a wall drawn by people counting.'],
  'Travel': ['"Conscious energy" is not something I can paint. I can make marks that follow one another and glints that brighten on the beat, and you can judge whether that reads as alive.'],
  'Verse 2': ['The statements are D\'s, copied from the Lean check. A picture of them is not a proof, and I say so here so the picture does not claim more than it holds.'],
  'Pre-Chorus': ['Image 7 had levels up to about 10; I stop at what the lines and echoes give me.'],
  'Hollow': ['I am not sure this silence is empty for a listener; the take only drops 6 dB. I treat it as a silence because the pulse is gone.'],
  'Rise': ['If the flash feels too large, it is one flash and I can make it smaller.'],
  'Climax': ['The red path is deliberate: it is the only vermilion in the whole look.'],
  'Outro': ['I added no hard stop after the question; the take fades, so I let the picture fade with it.'],
};
const PROG = {
  'Intro': ['ground.begin(); ring.inkOn(7s)', 'beholder.place(top)', 'drums.in() -> ring.fall(); sprite.birth(beat)', 'gap -> sprite.birth = 0; speed *= .35'],
  'Verse 1': ['prime.next(); sacks(r=sqrt n, a=2 pi sqrt n)', 'ring.fall(x1.5597) per sung line', 'sprite.erode()'],
  'Travel': ['sprite.birth(beat, rim)', 'steer(pheromone, swirl)', 'trail.wet -> dry; drift(swirl)'],
  'Verse 2': ['lamp.enter(stranger); lamp.setDown("All things, he said")', 'ledger.fall(statements)', 'light.reveal(lamp)'],
  'Pre-Chorus': ['ring.level(n); style(solid|dashed|dotted)', 'sprite.attract(beholder)'],
  'Hollow': ['ground.toBlack(); sprites.retreat()', 'add(nothing)'],
  'Rise': ['flash(1); dawn(beholder); ground.return()', 'plate.mode(3:5); sand.jump(|f|)'],
  'Chorus 1': ['plate.mode(4:7, 5:8)', 'sand.settle(nodal lines)'],
  'Climax': ['sprite.birth(beat, rim) rate=1.5', 'path.paint(vermilion)'],
  'Bridge': ['sprites.release(); path.letGo()', 'ring.twist(laps=2)'],
  'Final Chorus': ['twist.letGo(); line.show(whole); nodes(14)'],
  'Outro': ['line.walk(centre); ring.open()', 'fade(244.5); black(246.8); dot.only()'],
};
for (const k in SEAM) { PROG[k] = (PROG[k] || []).concat(SEAM[k].p); }
let st = { on: false, turnSec: '', turnOn: false, insOn: false, t: -1, sec: -2, beatI: -1, n: 0, lineI: -1, lastGap: null, lastFam: '', lastRhythm: 0, nextRef: 0, refI: 0, progI: {}, kicks: [], flashDone: false, lampDone: false, extra: '' };
const C3 = () => window.__tybConsoles || [];
function reset(t, C) {
  const [mind, see, meta] = C3(); [mind, see, meta].forEach((c) => c && c.reset());
  const T = C.timing() || {}, b = T.beats || [], L = T.lines || [];
  st = Object.assign(st, { sec: -2, beatI: b.findIndex((x) => x > t) - 1, n: 0, lineI: -1, lastGap: null, lastFam: '', lastRhythm: t, nextRef: t + 6, refI: 0, progI: {}, kicks: [], turnOn: false, insOn: false, flashDone: t > 133, lampDone: t > 100, extra: '' });
  if (st.beatI < -1) st.beatI = b.length - 1; for (let j = 0; j < L.length; j++) if (L[j].start != null && L[j].start <= t) st.lineI = j;
  mind.out(`attach  observer=D  action=claude  t=${t.toFixed(2)}s   ; Look B: ink and the beyond`, 'hd');
  see.out(`attach  eye=claude  t=${t.toFixed(2)}s   ; I hear through measurements, and say so`, 'hd'); see.out('rule: nothing hidden. every mark on the paper is named in this log', 'ck');
  meta.out('meta.log: only my comments. My rule: nothing works on you that this log does not name.', 'hd');
  see.out('react: every mark moves with the music, read live: bass -> ring and trail width, the sprites\' speed (they surge with loudness and lurch on each hit), their head size, the boundary ring, the strand\'s size, prime dots; mids -> the strand\'s turning speed, sand grain size; highs -> the strand\'s shiver, the ledger text flicker; loudness -> ring opacity, the lamp\'s size; a sudden rise (hit) -> a bright pulse on rings, heads, sand, the beholder dot', 'ck');
  see.out('sonar: each sprite sends rings out around itself, on the bass, mids or highs it is tuned to (and once at birth); each ring carries a picture of the sound\'s spectrum at that moment, so it is a little round spectrogram. Where two rings cross, a bright glint twinkles; where a glint lands on one of the big circles it turns vermilion. When the circles move, they leave a short echo trail behind them.', 'ck');
  meta.out('Each creature sends out rings that carry a picture of the sound at that instant, like sonar. Where rings from different creatures meet, they interfere and glint; a glint that lands on a circle burns vermilion, so the survivor path is not the only red. Only while the song plays.', 'mn');
  see.out('resonance: on every bass or mid hit a wave leaves the centre; in the primes and the sand it lights what it passes, in a split spectrum (the colours of light through a grating), so those two layers are the only places with rainbow colour. Primes pulse with the bass; the sand jumps on each hit and is coloured by how far each grain is from a still line of the plate. Rings dim when the music is quiet and brighten with loudness.', 'ck');
  meta.out('You said you could not feel the reaction and that it was chaotic. I made it larger and less busy: fewer sprites, shorter trails, rings that really dim and brighten with the loudness, and in the primes and the sand a resonance wave on every hit with rainbow colour. I have only checked it by measurement and still screenshots, not by ear.', 'mn');
  see.out('scope: the big circles carry a little oscilloscope, a steady slice of the live waveform bending each edge in and out (a few percent of the radius, more when it is loud). Where a creature\'s ring crosses one of the circles, a vermilion glint twinkles.', 'ck');
  see.out('tunnel: in the Rise the centre\'s pattern and a set of split-spectrum rings grow out past the circle and rush at the viewer, as if you were flying through a tunnel; the faster the music hits, the faster you fly. It gives way to the plain sand at the Chorus.', 'ck');
  meta.out('Everything on screen reacts to the music in the same few ways: low notes swell it, high sounds make it shiver, and every sudden hit gives one small pulse. It is read from the sound as it plays, so it only moves while the song plays. I name it once here and print the live numbers in see.log.', 'mn');
}
const ADDR = (n) => '0x' + (n & 0xffff).toString(16).toUpperCase().padStart(4, '0');
function extraName(S) { return S.dark > 0.5 ? 'none (subtract)' : S.sand ? 'cymatics ' + S.sand : S.ledger ? 'ledger' : S.primes ? 'primes' : S.agents ? 'sprites' : S.verm ? 'survivor path' : 'none'; }
function frame(info) {
  const C = window.LVC; if (!C || !window.ZSInk) return; const pack = C.pack(); if (!pack || pack.id !== ID) { st.on = false; return; }
  const [mind, see, meta] = C3(); if (!mind || !see || !meta) return;
  if (ZSInk.look() !== 'B') { st.on = false; return; }
  const t = info.t, S = ZSInk.stats(), M = ZSInk.moments() || {}, H = window.VizHear && VizHear.at(ID, t);
  if (!st.on || t < st.t - 0.5 || t > st.t + 1.5) { reset(t, C); st.on = true; }
  st.t = t;
  const s = info.sec || {}, name = s.name, R = ROWS[name];
  if (info.k !== st.sec) {
    st.sec = info.k; st.refI = 0; st.nextRef = t + 5;
    mind.out(`── ${name || '?'}  · ${s.act || ''} ──`, 'hd'); see.out(`── ${name || '?'} ──`, 'hd'); meta.out(`— ${name || ''} —`, 'hd');
    if (R) { see.out(`measure: ${R.m}`, 'ms'); see.out(`feel: ${R.f}   ; my reading, not a fact`, 'mn'); see.out(`show: ${R.s}`, 'ms'); see.out(`   ; why: ${R.w}`, 'mn'); }
    for (const line of ENC[name] || []) meta.out(line, line.startsWith('Encoded') ? 'fl' : line.startsWith('Intent') ? 'ms' : 'mn');
    const SM = SEAM[name]; if (SM) { see.out(`show (view): ${SM.s}`, 'ms'); see.out(`   ; why: ${SM.w}`, 'mn'); for (const line of SM.e) meta.out(line, line.startsWith('Encoded') ? 'fl' : line.startsWith('Intent') ? 'ms' : 'mn'); mind.out(`   ${SM.p[0]}   ; the seam turn`, 'mn'); st.turnSec = name; }
  }
  const T = C.timing() || {}, beats = T.beats || [];
  while (st.beatI + 1 < beats.length && beats[st.beatI + 1] <= t) {
    st.beatI++; const b = st.beatI;
    const P = PROG[name]; if (b % 4 === 0 && P) { const i = st.progI[name] = (st.progI[name] ?? -1) + 1; mind.out(`${ADDR(b * 4)}  ${P[i % P.length]}`, /^add\(nothing\)/.test(P[i % P.length]) ? 'wn' : ''); }
    if (b % 2) continue;
    const k = st.n++ % 4;
    if (k % 2 === 0 && H) see.out(`${ADDR(b * 4)}  hear: ${H.perc > 0.5 ? 'struck' : 'held'} ${H.perc.toFixed(2)} · ${H.key || '?'} · ${H.gap ? 'drums absent' : 'drums on'}   ; measured`, 'hr');
    else if (k === 3 && S.rx) see.out(`${ADDR(b * 4)}  react: bass/mid/high/loud/hit = ${S.rx} · sonar rings ${S.waves || 0}, glints ${S.glints || 0}   ; measured live, what moves the marks now`, 'hd');
    else if (k === 1) see.out(`${ADDR(b * 4)}  see: rings ${S.rings} · sprites ${S.agents} · view turn ${S.yaw || 0}° · inside ${S.inside || 0} · ghosts ${(window.ZSMirror || {}).n || 0} · chain ${(window.ZSMirror || {}).chain || 0} · grid ${window.ZSGrid ? window.ZSGrid.toFixed(2) : 0} · extra ${extraName(S)} · ground ${S.dark > 0.5 ? 'black' : S.ground} · ink ${(window.ZSInk && ZSInk.ground() === 'dark' ? INKD : INKW)[H && H.family] || 'bone'}   ; what is on the paper`, '');
    else see.out(`${ADDR(b * 4)}  check: only one extra layer is named above (${extraName(S)}); the lamp and the beholder are part of the form`, 'ck');
    if (S.agents && b % 8 === 0) mind.out(`${ADDR(b * 4)}  sprite.born(beat ${b}) -> ${S.agents} alive; they follow trails, I do not place them`, 'mn');
  }
  const TL = T.lines || [];
  while (st.lineI + 1 < TL.length && TL[st.lineI + 1].start != null && TL[st.lineI + 1].start <= t) { st.lineI++; mind.out(`   emit  "${String(TL[st.lineI].text || '')}"`, 'em'); }
  if (H && st.lastGap !== null && H.gap !== st.lastGap) { see.out(H.gap ? '!! gap: drums left   ; impact: no new sprites, nothing added' : '!! return: drums back   ; impact: the picture moves again', 'wn'); meta.out(H.gap ? 'The drums just left. I am taking something away, not adding.' : 'The drums are back. I let the picture carry it.', 'ck'); }
  if (H) st.lastGap = H.gap;
  if (H && H.family !== st.lastFam) { if (st.lastFam) see.out(`!! colour: ${H.key} -> the ink turns ${(window.ZSInk && ZSInk.ground() === 'dark' ? INKD : INKW)[H.family] || 'bone'}   ; ${H.word}`, 'wn'); st.lastFam = H.family; }
  if (M.back && !st.flashDone && t >= M.back) { st.flashDone = true; see.out('!! flash: once, when the drums return   ; intent: the white hole', 'wn'); meta.out('One flash, once. Dawn light grows from the beholder.', 'ck'); }
  if (M.tLamp && !st.lampDone && t >= M.tDown) { st.lampDone = true; see.out('!! lamp set down on "All things, he said"   ; it does not move again', 'wn'); meta.out('Put down on "All things, he said". After this the lamp is part of the form.', 'em'); }
  { const y = Math.abs(S.yaw || 0);
    if (y > 4 && !st.turnOn) { st.turnOn = true; see.out(`!! seam turn: the disk is swinging about the seam (${S.yaw}°)   ; measured live; the view moves, nothing is added`, 'wn'); meta.out('The disk is turning about the seam. I am changing where you stand, not what is there.', 'ck'); }
    if (y < 1.2 && st.turnOn) { st.turnOn = false; see.out('!! seam turn: the disk is flat again   ; impact: back to the plain view', 'wn'); meta.out('Flat again. Nothing tilted is left.', 'ck'); }
    if ((S.inside || 0) > 0.85 && !st.insOn) { st.insOn = true; see.out('!! inside: the disk is edge-on and fourteen rungs rush along the seam toward the beholder   ; the one extra layer in the Bridge', 'wn'); meta.out('You are looking along the critical line now. Each rung is one of the first fourteen zeros, and they meet at the dot that never moved. If this feels like falling forward, that is the intent, and I can slow it.', 'fl'); mind.out('   view.inside(seam); rungs.rush(14 zeros)   ; named so nothing is hidden', 'em'); }
    if ((S.inside || 0) < 0.3 && st.insOn) { st.insOn = false; see.out('!! inside ends: the camera backs out and the rungs fade   ; coming home', 'wn'); meta.out('Backing out. The two halves lie flat again and agree; this is what coming home looks like in this picture.', 'em'); } }
  const R2 = REFLECT[name] || []; if (t >= st.nextRef && st.refI < R2.length) { meta.out(R2[st.refI++], 'em'); st.nextRef = t + 9; }
  if (info.onset) st.kicks.push(t); st.kicks = st.kicks.filter((x) => x > t - 12);
  if (t - st.lastRhythm > 30) { st.lastRhythm = t; meta.out(`Rhythm check: about ${st.kicks.filter((x) => x > t - 10).length * 6} hits a minute, calm motion, one flash in the song. Sprites are born on beats but never strobe. The take holds a flat 112 BPM, so the pulse is its own.`, 'hr'); }
}
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame((i) => { try { frame(i); } catch (e) { console.error('zsinklog', e); } }); }
wire();
})();
