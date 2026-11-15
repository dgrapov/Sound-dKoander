# Sound dKoander

An audio-reactive visualizer for songs: each song walks its own road. The road is the song's spectrogram, the shapes
come from what the song actually does (struck or held, its key, where the drums drop out), and the lyrics land on the
words as they're sung.

**Open it:** https://dgrapov.github.io/Sound-dKoander/ (pick a song with `?song=<id>`).

## Play a song
1. Open the site. Press **▶ Play**. If the song isn't hosted, use **Load the song file** to play your own copy. **Preview without audio** runs the visuals on their own.
2. Keys:

   | Key | What it does |
   |---|---|
   | Space | play / pause |
   | Z | visuals only (Esc brings everything back) |
   | L | lyrics position |
   | C V N | the three consoles |
   | H | hide UI |
   | F | fullscreen |
   | T | tune |
   | E | effects |
   | P | pad |
   | ? | all keys |

It runs in the browser on WebGL (three.js). Chrome, Edge and Firefox on a desktop work best. Phones work with fewer particles.

## Run it locally
Clone the repo and open `index.html` (double-click it), or serve the folder with `python3 -m http.server`. Everything
is plain script files, so it works from disk with no build step.

## Make a pack for your own song
A song needs five small files. [docs/FORMATS.md](docs/FORMATS.md) describes each one, and [docs/MAKE-A-PACK.md](docs/MAKE-A-PACK.md)
walks through making them. [docs/AGENT-PROMPTS.md](docs/AGENT-PROMPTS.md) has prompts you can give your own AI agent to
write the creative parts.

| File | What it is | Made by |
|---|---|---|
| your audio | the song (WAV 16-bit, MP3 or OGG) | you |
| `songs/<id>/timing.js` | sections, lines and word times | `tools/align_lyrics.py` |
| `analysis/<id>/road.js` | the whole-song analysis: spectrogram, struck/held, key, gaps | `tools/analyze_song.py` |
| `songs/<id>/spectra.js` | notes and hits for the cymatics and spectrum layers | `tools/spectra.py` |
| `packs/<id>.js` | the journey: sections, shapes, scenes, colour, lyrics style, cues | you or your agent |

## What's inside
| Path | What it holds |
|---|---|
| `index.html` | the player |
| `layers/` | visual layers: particles, physics attractors, cymatics, sacred geometry, fractals, typography, and the WebGL song forms (torus, Möbius, radar, road, ensō...) |
| `src/webgl.js` | source of `layers/webgl.js` (bundle with esbuild, see `src/README.md`) |
| `ui/` | the effect catalog, looks and the pad |
| `songs/` | per-song data and the site's song list |
| `tools/` | Python generators for the analysis and timing files |

## License
The engine (code) is MIT, see [LICENSE](LICENSE). Songs, lyrics, cover art and console texts in `songs/`, `packs/`
and the song-specific layers belong to the artist and are not covered by the MIT license.
