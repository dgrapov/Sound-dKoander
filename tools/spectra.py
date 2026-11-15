"""Offline spectrum analysis for the Live Visualizer's spectrum / cymatics layers (layers/spectrum.js).

  python spectra.py <song.wav> [--song god2] [--hop 0.05] [--stems <dir with drums.wav bass.wav vocals.wav other.wav>]

Writes <song>.spectra.js next to the WAV: window.VIZ_SPECTRA[<song id>] = { hop, n, bands, chroma, cores, f0, onsets, stems? }
  bands   per frame [sub, bass, lowmid, mid, high], 0..1 (each band normalised to its own 98th percentile)
  chroma  per frame 12 values C..B, 0..1 (frame max = 1), from 55-2000 Hz
  cores   per frame up to 3 strongest spectral peaks [hz, level] in 40-2000 Hz (parabolic-interpolated)
  f0      per frame the bass fundamental in 30-250 Hz (0 when unclear)
  onsets  { kick:[t...], snare:[t...], hat:[t...] } from band spectral flux
  stems   (with --stems) { drums:{level:[...], onsets:[...]}, bass:{...}, vocals:{...}, other:{...} }
Only numpy + scipy: runs anywhere. Stems come from the Demucs 4-stem split (run demucs in WSL; see the build plan).
"""
import argparse, json, os, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import find_peaks, stft

BANDS = [(20, 60), (60, 250), (250, 1000), (1000, 4000), (4000, 16000)]


def load(path, sr_target=22050):
    sr, y = wavfile.read(path)
    if y.dtype.kind == 'i': y = y.astype(np.float32)/np.iinfo(y.dtype).max
    elif y.dtype.kind == 'u': y = (y.astype(np.float32) - 128)/128
    y = y.astype(np.float32)
    if y.ndim > 1: y = y.mean(axis=1)
    if sr != sr_target:                       # simple polyphase resample
        from scipy.signal import resample_poly
        g = np.gcd(sr, sr_target); y = resample_poly(y, sr_target//g, sr//g).astype(np.float32); sr = sr_target
    return sr, y


def spectrogram(y, sr, hop_s, nfft=4096):
    hop = int(round(sr*hop_s))
    f, t, Z = stft(y, fs=sr, nperseg=nfft, noverlap=nfft - hop, boundary=None, padded=False)
    return f, t, np.abs(Z)


def norm98(x):
    p = np.percentile(x, 98) or 1.0
    return np.clip(x/p, 0, 1)


def band_levels(f, S):
    out = []
    for lo, hi in BANDS:
        m = (f >= lo) & (f < hi)
        out.append(norm98(np.sqrt((S[m]**2).mean(axis=0))))
    return np.stack(out, axis=1)


def chroma(f, S):
    m = (f >= 55) & (f <= 2000)
    midi = 69 + 12*np.log2(f[m]/440.0)
    pc = np.round(midi).astype(int) % 12
    C = np.zeros((12, S.shape[1]), np.float32)
    P = S[m]**2
    for k in range(12): C[k] = P[pc == k].sum(axis=0)
    C = np.sqrt(C)
    mx = C.max(axis=0); mx[mx == 0] = 1
    return (C/mx).T


def cores(f, S, n=3):
    m = (f >= 40) & (f <= 2000); fm = f[m]; Sm = S[m]
    out, f0 = [], []
    gmax = np.percentile(Sm.max(axis=0), 98) or 1
    for j in range(Sm.shape[1]):
        col = Sm[:, j]
        pk, pr = find_peaks(col, prominence=col.max()*0.08 if col.max() > 0 else 1)
        top = pk[np.argsort(col[pk])[::-1][:n]] if len(pk) else []
        row = []
        for k in top:
            if 0 < k < len(col) - 1:            # parabolic interpolation
                a, b, c = col[k - 1], col[k], col[k + 1]; d = 0.5*(a - c)/(a - 2*b + c) if (a - 2*b + c) != 0 else 0
                hz = fm[k] + d*(fm[1] - fm[0])
            else: hz = fm[k]
            row.append([round(float(hz), 1), round(float(min(1, col[k]/gmax)), 3)])
        out.append(row)
        bm = (fm >= 30) & (fm <= 250); bc = col[bm]
        if bc.size and bc.max() > gmax*0.15:
            k = int(np.argmax(bc)); f0.append(round(float(fm[bm][k]), 1))
        else: f0.append(0)
    return out, f0


def onsets(f, S, hop_s, lo, hi, min_gap):
    m = (f >= lo) & (f < hi)
    E = np.log1p(S[m]*50)
    flux = np.maximum(0, np.diff(E, axis=1)).sum(axis=0)
    flux = np.concatenate([[0], flux])
    if flux.max() <= 0: return []
    w = max(3, int(1.5/hop_s))                  # adaptive threshold: rolling median * k
    med = np.array([np.median(flux[max(0, i - w):i + 1]) for i in range(len(flux))])
    pk, _ = find_peaks(flux, height=med*1.6 + flux.max()*0.05, distance=max(1, int(min_gap/hop_s)))
    return [round(float(i*hop_s), 3) for i in pk]


def analyse(path, hop_s):
    sr, y = load(path)
    f, t, S = spectrogram(y, sr, hop_s)
    return sr, f, S, len(y)/sr


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('audio'); ap.add_argument('--song', default=None); ap.add_argument('--hop', type=float, default=0.05)
    ap.add_argument('--stems', default=None); ap.add_argument('--out', default=None)
    a = ap.parse_args()
    song = a.song or re.sub(r'[^a-z0-9]', '', os.path.splitext(os.path.basename(a.audio))[0].lower())
    sr, f, S, dur = analyse(a.audio, a.hop)
    print(f'{a.audio}: {dur:.1f} s, {S.shape[1]} frames at {a.hop*1000:.0f} ms')
    B = band_levels(f, S); C = chroma(f, S); K, F0 = cores(f, S)
    D = {'song': song, 'source': os.path.basename(a.audio), 'hop': a.hop, 'n': int(S.shape[1]), 'duration': round(dur, 3),
         'bands': np.round(B, 3).tolist(), 'chroma': np.round(C, 2).tolist(), 'cores': K, 'f0': F0,
         'onsets': {'kick': onsets(f, S, a.hop, 30, 150, 0.2), 'snare': onsets(f, S, a.hop, 1000, 5000, 0.15), 'hat': onsets(f, S, a.hop, 7000, 16000, 0.08)}}
    if a.stems:
        D['stems'] = {}
        for name in ['drums', 'bass', 'vocals', 'other']:
            p = os.path.join(a.stems, name + '.wav')
            if not os.path.exists(p): continue
            _, fs, Ss, _ = analyse(p, a.hop)
            lev = norm98(np.sqrt((Ss**2).mean(axis=0)))
            D['stems'][name] = {'level': np.round(lev, 3).tolist(), 'onsets': onsets(fs, Ss, a.hop, 20, 16000, 0.1)}
            print(f'   stem {name}: {len(D["stems"][name]["onsets"])} onsets')
    for k, v in D['onsets'].items(): print(f'   {k}: {len(v)} onsets')
    # dominant pitch classes overall (a key hint)
    names = 'C C# D D# E F F# G G# A A# B'.split(); tot = np.array(D['chroma']).mean(axis=0)
    print('   strongest notes:', ', '.join(names[i] for i in np.argsort(tot)[::-1][:5]))
    out = a.out or os.path.splitext(a.audio)[0] + '.spectra.js'
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write('// written by tools/live-visualizer/analysis/spectra.py; loaded by the visualizer pack\n')
        fh.write(f'(window.VIZ_SPECTRA = window.VIZ_SPECTRA || {{}})[{json.dumps(song)}] = ')
        json.dump(D, fh, separators=(',', ':'))
        fh.write(';\n')
    print(f'wrote {out} ({os.path.getsize(out)/1e6:.1f} MB)')


if __name__ == '__main__':
    main()
