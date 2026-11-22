(() => {
const ID = 'waited-zeta-stranger';
const ZV = [14.13, 21.02, 25.01, 30.42, 32.94, 37.59, 40.92, 43.33, 48.01, 49.77, 52.97, 56.45, 59.35, 60.83];
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth'];
let con = null, st = null;
const fresh = (t) => ({ said: 0, t, last: -99, per: {}, sec: -2, secMet: 0, total: 0, lastNode: -1, prog: 0, lastGap: null, cool: Array(14).fill(-99), seen: {} });
const pick = (a, n) => a[((n % a.length) + a.length) % a.length];
const JS = {
  struck: ['it arrived on a struck beat, so I read it as an event; I note it and add nothing.', 'a hit and a crossing together; I let the pulse carry it and draw no extra mark.', 'the beat made it loud; the zero was already there, and I will not credit the beat for it.'],
  held: ['it arrived on a held tone, so I read it as passing; I add nothing.', 'a quiet crossing; the zero does not change what it does, and neither do I.', 'nothing in the sound marks it; the picture alone says a zero is here, and that is enough.'],
};
function sectionName(info) { return (info.sec && info.sec.name) || ''; }
function hdr() {
  con.out('zero.log: my own judgement, written whenever I meet a zero.', 'hd');
  con.out('The fourteen nodes on the line stand for the first fourteen zeros of ζ on the critical line, in order: ' + ZV.join(', ') + '.', 'mn');
  con.out('A zero is met when a sprite passes its node, when the painted line reaches it, or when the take\'s low-end pulse goes to zero. My judgement is my reading, not a fact. The picture proves nothing.', 'mn');
}
function frame(info) {
  const C = window.LVC; if (!C || !window.TYBConsole) return;
  if (!con) con = TYBConsole.make({ id: 'zsZero', title: 'zero.log · my judgement', prefKey: 'livevis:tyb:zero', order: 3, key: 'KeyX', pack: ID, button: '▤ zero.log', accent: '#ffcd78', defaults: { cw: 400, ch: 200, cf: 13, font: 1, anchor: 'right' } });
  const pack = C.pack(), on = pack && pack.id === ID; con.place(on);
  if (!on || !window.ZSInk || ZSInk.look() !== 'B') { st = null; return; }
  const t = info.t, C3 = window.__tybConsoles || [], mind = C3[0], see = C3[1];
  if (!st || t < st.t - 0.5 || t > st.t + 1.5) { st = fresh(t); con.reset(); hdr(); }
  st.t = t;
  const name = sectionName(info), S = ZSInk.stats(), H = window.VizHear && VizHear.at(ID, t);
  if (info.k !== st.sec) { st.sec = info.k; st.secMet = 0; con.out(`— ${name || '?'} · zeros met so far: ${st.total} of 14 nodes${st.total ? '' : ' (none yet)'} —`, 'hd'); }
  const meet = (i, kind, extra) => {
    if (t - st.last < 2.2 || t - st.cool[i] < 5) return; st.last = t; st.cool[i] = t; st.total++; st.secMet++; st.per[i] = (st.per[i] || 0) + 1;
    const n = i + 1, perc = H ? H.perc : 0, J = pick(perc > 0.5 ? JS.struck : JS.held, i + st.total);
    if (extra) st.said = 1;
    con.out(`zero ${n} (t = ${ZV[i]}): ${kind} in ${name || 'the song'}, ${H && H.key ? 'in ' + H.key + ', ' : ''}${perc > 0.5 ? 'struck' : 'held'} ${perc.toFixed(2)}. Judged: ${J}${extra ? ' ' + extra : ''}`, perc > 0.5 ? 'fl' : '');
    if (mind) mind.out(`   zero.meet(${n})   ; judged in zero.log`, 'mn'); if (see) see.out(`!! zero ${n} met: ${kind}   ; the node on the line, judged in zero.log`, 'wn');
  };
  const P = ZSInk.path(); if (S.verm > 0) { const ag = ZSInk.agentsNow(); for (let i = 0; i < 14; i++) { const p = P[Math.round(i / 13 * 90)]; for (const a of ag) { if (Math.hypot(a[1] - p[0], a[2] - p[1]) < 0.06) { meet(i, 'a sprite passed it', ''); break; } } } }
  const pg = S.pathProg || 0; if (pg > 0.001 && pg < 0.999) { for (let i = 0; i < 14; i++) { if ((st.prog < i / 13 || i === 0) && pg >= i / 13 && !st.seen[name + i]) { st.seen[name + i] = 1; st.cool[i] = -99; st.last = -99; meet(i, 'the painted line reached it', (st.said ? '' : 'Each node is lit by the line; I count the line as the one that always crossed here, and I say it once.')); } } }
  if (pg >= 0.999 && !st.seen['all' + name]) { st.seen['all' + name] = 1; con.out(`The whole line is drawn in ${name || 'the song'}: all fourteen nodes lit at once. Judged: this is as close as the picture comes to 'they are all on one line'. I do not say it proves that.`, 'em'); }
  st.prog = pg;
  if (H && st.lastGap !== null && H.gap !== st.lastGap) {
    if (H.gap) con.out(`the music reached zero at ${t.toFixed(1)} s in ${name || 'the song'}: the low-end pulse is gone. Judged: this is the only zero I did not draw; the take made it. I add nothing.`, 'wn');
    else con.out(`the pulse came back from zero at ${t.toFixed(1)} s. Judged: a return, and the picture moves again; I do not mark it.`, 'ck');
  }
  if (H) st.lastGap = H.gap;
  if (S.inside > 0.9 && !st.seen['ins']) { st.seen.ins = 1; con.out(`The disk is edge-on at ${t.toFixed(1)} s: the seam is a line seen along its length, and every node sits behind the one in front. Judged: from here the zeros cannot be told apart in depth, which is as honest as the picture gets about 'the same line'.`, 'em'); }
  if (S.inside < 0.2) delete st.seen.ins;
}
function wire() { if (!window.LVC || !LVC.onFrame) return setTimeout(wire, 100); LVC.onFrame((i) => { try { frame(i); } catch (e) { console.error('zszero', e); } }); }
wire();
})();
