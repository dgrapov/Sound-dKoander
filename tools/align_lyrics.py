#!/usr/bin/env python3
"""align_lyrics.py: word timing for Sound dKoander (writes <song>.timing.json, format in docs/FORMATS.md).

    python tools/align_lyrics.py <audio.wav> <lyrics.txt> --song <song-id> [--road analysis/<id>/road.js] [--out timing.json]

lyrics.txt: one sung line per line, [Section] tags on their own lines; (parentheses) are echoes and are not aligned.
Speech recognition: NVIDIA Parakeet TDT 0.6B v2 (int8) through sherpa-onnx, on 12 s windows every 6 s; words heard
twice are merged; the lyric words are matched to what was heard (difflib); words not heard are interpolated and
marked "guess": true. Check the printed table and hand-fix lines that weren't heard (chants, whispers, stacked echoes).
Needs: pip install sherpa-onnx librosa numpy, and the model folder:
  https://github.com/k2-fsa/sherpa-onnx/releases (asr-models: sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8)
"""
import argparse, difflib, json, os, re, sys
import numpy as np, librosa
ap = argparse.ArgumentParser()
ap.add_argument('audio'); ap.add_argument('lyrics'); ap.add_argument('--song', required=True)
ap.add_argument('--model', default='sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8'); ap.add_argument('--road'); ap.add_argument('--out')
a = ap.parse_args()
import sherpa_onnx
m = a.model.rstrip('/') + '/'
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=m + 'encoder.int8.onnx', decoder=m + 'decoder.int8.onnx',
      joiner=m + 'joiner.int8.onnx', tokens=m + 'tokens.txt', model_type='nemo_transducer', num_threads=4)
y, sr = librosa.load(a.audio, sr=16000, mono=True); dur = len(y) / sr
WIN, STEP = 12.0, 6.0
heard, t = [], 0.0
while t < dur:
    s = rec.create_stream(); s.accept_waveform(sr, y[int(t * sr):int((t + WIN) * sr)]); rec.decode_stream(s)
    cur = None
    for ts, tk in zip(s.result.timestamps, s.result.tokens):
        if tk.startswith((' ', '▁')) or cur is None:
            if cur: heard.append(cur)
            cur = {'t': t + ts, 'w': tk.strip(' ▁'), 'c': abs(ts - WIN / 2)}
        else: cur['w'] += tk
    if cur: heard.append(cur)
    print(f'{t:6.1f} | {s.result.text}', flush=True); t += STEP
norm = lambda s: re.sub(r"[^a-z']", '', s.lower())
heard.sort(key=lambda w: w['t']); ded = []
for w in heard:                                   # windows overlap: keep each word once, from the window it was most central in
    dup = [d for d in ded[-12:] if norm(d['w']) == norm(w['w']) and abs(d['t'] - w['t']) < 1.2]
    if dup:
        if w['c'] < dup[0]['c']: dup[0].update(w)
    else: ded.append(dict(w))
heard = sorted(ded, key=lambda w: w['t'])
sec, lines = None, []
for l in open(a.lyrics, encoding='utf-8').read().splitlines():
    l = l.strip()
    if not l: continue
    mm = re.match(r'\[([^\]-]+)', l)
    if mm: sec = mm.group(1).strip(); continue
    lines.append({'section': sec, 'text': l})
lw = []
for li, ln in enumerate(lines):
    if ln['text'].startswith('('): continue
    for wd in re.sub(r'\([^)]*\)', '', ln['text']).split(): lw.append({'line': li, 'text': wd, 'n': norm(wd)})
sm = difflib.SequenceMatcher(None, [x['n'] for x in lw], [norm(w['w']) for w in heard], autojunk=False)
for i, j, n in sm.get_matching_blocks():
    for k in range(n): lw[i + k]['t'] = heard[j + k]['t']
known = [i for i, x in enumerate(lw) if 't' in x]
print(f'matched {len(known)} of {len(lw)} lyric words')
if not known: sys.exit('nothing matched: check the lyrics file and the model')
for i, x in enumerate(lw):
    if 't' in x: continue
    p = max([k for k in known if k < i], default=None); q = min([k for k in known if k > i], default=None)
    x['t'] = lw[p]['t'] + (lw[q]['t'] - lw[p]['t']) * (i - p) / (q - p) if p is not None and q is not None else \
             (lw[p]['t'] + 0.4 * (i - p) if p is not None else lw[q]['t'] - 0.4 * (q - i))
    x['guess'] = True
words = []
for i, x in enumerate(lw):
    nxt = lw[i + 1]['t'] if i + 1 < len(lw) else x['t'] + 0.5
    words.append({'text': x['text'], 'start': round(x['t'], 2), 'end': round(min(x['t'] + 0.6, max(x['t'] + 0.1, nxt - 0.02)), 2), 'line': x['line'], **({'guess': True} if x.get('guess') else {})})
for li, ln in enumerate(lines):
    ws = [w for w in words if w['line'] == li]
    if ws: ln['start'], ln['end'] = ws[0]['start'], round(ws[-1]['end'] + 0.1, 2)
    if any(w.get('guess') for w in ws) or not ws: ln['guess'] = True
for i in range(len(lines) - 1):
    if 'start' in lines[i + 1] and lines[i].get('end', 0) > lines[i + 1]['start'] - 0.05: lines[i]['end'] = round(lines[i + 1]['start'] - 0.05, 2)
secs = []
for ln in lines:
    if 'start' in ln and (not secs or secs[-1]['name'] != ln['section']): secs.append({'name': ln['section'], 'start': ln['start']})
if secs: secs[0]['start'] = 0.0
beats, downbeats = [], []
if a.road:
    r = open(a.road, encoding='utf-8').read(); R = json.loads(r[r.index('= {') + 2:].rstrip().rstrip(';'))
    beats = R.get('beats', []); downbeats = beats[R.get('bar0', 0)::4]
out = {'song': a.song, 'source': os.path.basename(a.audio), 'method': 'parakeet-tdt (sherpa-onnx) aligned to the lyrics', 'sections': secs,
       'lines': [{k: v for k, v in ln.items()} for ln in lines], 'words': words, 'beats': beats, 'downbeats': downbeats, 'events': {}}
dst = a.out or os.path.splitext(a.audio)[0] + '.timing.json'
json.dump(out, open(dst, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
for ln in lines: print(f"{ln.get('start', '-'):>7}  {ln['section'] or '':<10} {ln['text'][:60]}{'  (check)' if ln.get('guess') else ''}")
print('wrote', dst)
