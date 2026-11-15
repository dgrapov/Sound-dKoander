#!/usr/bin/env python3
"""analyze_song.py: whole-song analysis for Sound dKoander (writes analysis/<song>/road.js).

    python tools/analyze_song.py <audio.wav> --song <song-id> [--out analysis/<song-id>/road.js]

Writes window.VIZ_ROAD[<song-id>] with:
  cps, nb, ncol, dur   8 columns per second, 48 mel bands (40 Hz to 8 kHz)
  spec                 base64 uint8 [ncol x nb], the spectrogram the road is made of
  steer                base64 int8, melody brightness curve (the road bends with it)
  rms, kick            base64 uint8, loudness and low-end hits per column
  beats, bar0          beat times (s) and which beat of 4 is the downbeat
  hear.perc            base64 uint8, struck (1) vs held (0) share, from a harmonic/percussive split
  hear.bright          base64 uint8, brightness of the held part
  hear.gap             base64 uint8 0/1, the drums have thinned out or stopped (2 s or more; heuristic, check by ear)
  hear.key             list, one key name per second ('G#m', 'F#', ...), Krumhansl profiles, smoothed
Needs: pip install librosa numpy scipy
"""
import argparse, base64, json, os
import numpy as np, librosa, scipy.ndimage as ndi

ap = argparse.ArgumentParser()
ap.add_argument('audio'); ap.add_argument('--song', required=True); ap.add_argument('--out')
a = ap.parse_args()
out = a.out or os.path.join('analysis', a.song, 'road.js')
CPS, NB = 8, 48
y, sr = librosa.load(a.audio, sr=22050, mono=True)
dur = len(y) / sr; hop = sr // CPS
S = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=4096, hop_length=hop, n_mels=NB, fmin=40, fmax=8000, power=2.0)
D = np.clip((librosa.power_to_db(S, ref=np.percentile(S, 99.9)) + 55) / 55, 0, 1) ** 1.5
spec = (D * 255).astype(np.uint8); ncol = spec.shape[1]
fit = lambda v: np.interp(np.arange(ncol), np.linspace(0, ncol - 1, len(v)), v) if len(v) != ncol else v
yh, yp = librosa.effects.hpss(y)
# melody steer: centroid of the held part, normalised to -1..1
lc = np.log2(np.maximum(fit(librosa.feature.spectral_centroid(y=yh, sr=sr, n_fft=4096, hop_length=hop)[0]), 100))
lc = ndi.gaussian_filter1d(ndi.median_filter(lc, size=7), 5)
lo, hi = np.percentile(lc, 5), np.percentile(lc, 95)
steer = np.clip((lc - np.median(lc)) / ((hi - lo) / 2 + 1e-9), -1, 1)
bright = np.clip((lc - lo) / (hi - lo + 1e-9), 0, 1)
# kick and low-end pulse
h2 = 256; X = np.abs(librosa.stft(y, n_fft=1024, hop_length=h2)); low = np.sqrt((X[:6] ** 2).mean(0)); per = hop // h2
kick = np.array([low[i * per:(i + 1) * per].max() if i * per < len(low) else 0 for i in range(ncol)])
kick = (kick / (np.percentile(kick, 99) + 1e-9)).clip(0, 1)
rms = fit(librosa.feature.rms(y=y, hop_length=hop)[0]); rms = (rms / (np.percentile(rms, 99) + 1e-9)).clip(0, 1)
# struck vs held
ep = fit(librosa.feature.rms(y=yp, hop_length=hop)[0]); eh = fit(librosa.feature.rms(y=yh, hop_length=hop)[0])
perc = ndi.gaussian_filter1d(ep / (ep + eh + 1e-9), 2); perc = np.clip((perc - perc.min()) / (np.ptp(perc) + 1e-9), 0, 1)
# drum gaps: peak-to-peak of the 0-130 Hz band over 1 s is small for 2 s or more
# drum gaps: the low-end hits thin out (2 s mean of the kick envelope in the quietest quarter), for 2 s or more.
# A heuristic: check the printed gap list against your ear and hand-edit hear.gap if needed.
kmean = ndi.uniform_filter1d(kick, CPS * 2)
quiet = ndi.binary_opening(ndi.binary_closing(kmean < np.percentile(kmean, 25), np.ones(CPS)), np.ones(CPS * 2))
gap = quiet.astype(np.uint8)
# key per second (Krumhansl), smoothed over 8 s
MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
N = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
ch = librosa.feature.chroma_cqt(y=yh, sr=sr, hop_length=512); fps = sr / 512
secs = int(np.ceil(dur)); keys = []
for s in range(secs):
    c = ch[:, int(max(0, s - 4) * fps):int(min(dur, s + 4) * fps) + 1].mean(1)
    best = max(((np.corrcoef(c, np.roll(P, i))[0, 1], N[i] + ('m' if m else '')) for m, P in ((0, MAJ), (1, MIN)) for i in range(12)))
    keys.append(best[1])
keys = [max(set(keys[max(0, i - 3):i + 4]), key=keys[max(0, i - 3):i + 4].count) for i in range(len(keys))]
# beats and downbeat phase
_, bf = librosa.beat.beat_track(y=yp, sr=sr, hop_length=512); bt = librosa.frames_to_time(bf, sr=sr, hop_length=512)
e = np.array([low[min(len(low) - 1, int(t * sr / h2))] for t in bt]); bi = np.arange(len(bt))
bar0 = int(max(range(4), key=lambda k: e[bi % 4 == k].mean() if np.any(bi % 4 == k) else 0))
b64 = lambda v: base64.b64encode(np.ascontiguousarray(v).tobytes()).decode()
u8 = lambda v: (np.clip(v, 0, 1) * 255).astype(np.uint8)
R = {'cps': CPS, 'nb': NB, 'ncol': int(ncol), 'dur': round(dur, 2), 'spec': b64(spec.T), 'steer': b64(np.round(steer * 127).astype(np.int8)),
     'rms': b64(u8(rms)), 'kick': b64(u8(kick)), 'beats': [round(float(t), 2) for t in bt], 'bar0': bar0,
     'hear': {'perc': b64(u8(perc)), 'bright': b64(u8(bright)), 'gap': b64(gap), 'key': keys}}
os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
with open(out, 'w') as f:
    f.write(f'// Whole-song analysis for Sound dKoander (tools/analyze_song.py), from {os.path.basename(a.audio)}.\n')
    f.write(f'(window.VIZ_ROAD = window.VIZ_ROAD || {{}})[{json.dumps(a.song)}] = {json.dumps(R, separators=(",", ":"))};\n')
runs = np.flatnonzero(np.diff(np.r_[0, gap.astype(int), 0]))
print(f'{out}: {ncol} columns, {len(bt)} beats, keys {sorted(set(keys))}, gaps', [(round(s / CPS, 1), round(e2 / CPS, 1)) for s, e2 in zip(runs[::2], runs[1::2])])
