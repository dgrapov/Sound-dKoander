# File formats

Every song is a few plain script files that set a global the player reads. Script files (not JSON fetched over the
network) are used so the player works both from disk and on a web server.

## 1. Audio
WAV (16-bit PCM or 32-bit float), MP3 or OGG. Chrome cannot play 32-bit *integer* WAV; convert with
`ffmpeg -i take.wav -c:a pcm_s16le take16.wav`.

## 2. Timing: `songs/<id>/timing.js`
```js
(window.VIZ_TIMING = window.VIZ_TIMING || {})["<id>"] = { ... };
```
The object (also accepted as a plain `.json` through **Load timing**):

| Key | Type | Meaning |
|---|---|---|
| `song` | string | the song id |
| `sections` | `[{name, start}]` | section names must match the pack's section names; `start` in seconds |
| `lines` | `[{section, text, start, end, guess?}]` | every sung line in order |
| `words` | `[{text, start, end, line, guess?}]` | `line` is the index into `lines`; these exact keys are required |
| `beats`, `downbeats` | `[seconds]` | the beat grid (kick detection locks to it) |
| `events` | `{name: seconds or [a, b]}` | free-form moments for cues |
| `pitch` | optional `{t0, hop, midi:[...]}` | sung-note track |

`guess: true` marks times that were interpolated, not heard.

## 3. Song analysis: `analysis/<id>/road.js`
```js
(window.VIZ_ROAD = window.VIZ_ROAD || {})["<id>"] = { cps, nb, ncol, dur, spec, steer, rms, kick, beats, bar0, hear };
```
| Key | Type | Meaning |
|---|---|---|
| `cps`, `nb`, `ncol`, `dur` | numbers | columns per second (8), mel bands (48, 40 Hz–8 kHz), column count, seconds |
| `spec` | base64 uint8 `[ncol × nb]` | the spectrogram: the road, the song forms and the Möbius are drawn from it |
| `steer` | base64 int8 | melody brightness curve, −127..127: the road bends with it |
| `rms`, `kick` | base64 uint8 | loudness and low-end hits per column |
| `beats`, `bar0` | `[seconds]`, int | beat times and which beat of 4 is the downbeat |
| `hear.perc` | base64 uint8 | struck (255) vs held (0) |
| `hear.bright` | base64 uint8 | brightness of the held part |
| `hear.gap` | base64 uint8 0/1 | the drums have stopped or thinned out |
| `hear.key` | `["G#m", ...]` | one key per second |

`layers/hear.js` turns this into `VizHear.at(song, t) → {perc, bright, gap, key, family, color, word}`.

## 4. Spectra: `songs/<id>/spectra.js`
```js
(window.VIZ_SPECTRA = window.VIZ_SPECTRA || {})["<id>"] = { song, hop, n, duration, bands, chroma, cores, f0, onsets };
```
Per frame (every `hop` seconds): `bands` [sub, bass, lowmid, mid, high] 0..1, `chroma` 12 values C..B, `cores` the 3
strongest peaks `[hz, level]`, `f0` the bass fundamental. `onsets` = `{kick:[t], snare:[t], hat:[t]}`. These let the
cymatics, chroma and spectrum layers work while scrubbing, not only while audio plays.

## 5. Pack: `packs/<id>.js`
```js
(window.VIZ_PACKS = window.VIZ_PACKS || []).push({ id, title, bpm, length, spectra, palette, tune, sections: [...] });
```
| Key | Meaning |
|---|---|
| `id`, `title`, `bpm`, `length` | identity, tempo, seconds |
| `spectra` | path to the spectra file, e.g. `'songs/<id>/spectra.js'` |
| `palette` | `{life, digital, flame}` hues 0–360 |
| `tune` | default Tune values, e.g. `{count, reactivity, kickThreshold, beatLock, forms}` |
| `sections[]` | one entry per section (below) |

Each section:

| Field | Meaning |
|---|---|
| `name`, `act` | labels (names must match the timing file) |
| `start` | default start in seconds (the timing file overrides it) |
| `scene` | particle scene: ink, slope, vortex, ring, ghost, flock, cityforest, waves, cymatics, eddy, platonic, fold, tear, mandala, melt |
| `order: [a, b]` | chaos (0) to order (1) across the section |
| `digital` | share of square digital particles, 0–1 |
| `hue` | colour of the section |
| `type` | lyric style: whisper, fold, melt, ember, ghost, seek, wave, crystal, rise, glitch... |
| `attractor` | `{type: lorenz / rossler / thomas / aizawa, trajectories, range: [chaos, order]}` |
| `forms` | layers drawn on top; the WebGL song form is `{type:'songform', song:<id>, shape, sub:[a, b], swirl, sun, whole?}` with shape `radar, torus, twist, mobius, helix, knot, funnel, enso, road` |
| `lyrics` | the section's lines (used when no timing is loaded) |

A pack may also load its own layer scripts (consoles, timed cues, lyric placement). Testing Your Buddha shows how:
`layers/tybcues.js` switches one extra effect layer on and off from time windows, the `tyb*` console layers print text
per section, and `layers/tyblyrics.js` places the lyrics around the picture.

## 6. Site list: `songs/index.js`
```js
window.SITE_SONGS = [{ id, title, blurb, cover, audio }];   // audio: null = visitors load their own copy
```
