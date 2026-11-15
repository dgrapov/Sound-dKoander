# Make a pack for your song

You need Python 3 with `pip install librosa numpy scipy sherpa-onnx`, plus `ffmpeg`. Pick a short id for the song,
e.g. `my-song`.

1. **Audio.** Export the song as a WAV. If Chrome won't play it, convert it: `ffmpeg -i take.wav -c:a pcm_s16le my-song.wav`.
2. **Lyrics.** Write `my-song.lyrics.txt`: one sung line per line, `[Section]` tags on their own lines (e.g. `[Verse 1]`), and echoes in (parentheses).
3. **Song analysis:**
   ```
   python tools/analyze_song.py my-song.wav --song my-song
   ```
   This writes `analysis/my-song/road.js` and prints the keys and drum gaps it found. Check the gaps by ear.
4. **Spectra:**
   ```
   python tools/spectra.py my-song.wav --song my-song --out songs/my-song/spectra.js
   ```
5. **Timing.** Download the Parakeet model folder once (see the header of `tools/align_lyrics.py`), then:
   ```
   python tools/align_lyrics.py my-song.wav my-song.lyrics.txt --song my-song --road analysis/my-song/road.js --out my-song.timing.json
   ```
   Lines marked `(check)` were partly guessed. Fix their times in the JSON. Then wrap it for the site as `songs/my-song/timing.js` (see FORMATS.md §2), or load the JSON with **Load timing**.
6. **Pack.** Copy `packs/testing-your-buddha.js` to `packs/my-song.js` and change the id, title, bpm, length, spectra path and sections. Section names must match the timing file. Or ask your agent, using the prompts in AGENT-PROMPTS.md.
7. **Add it to the page.** Add `<script src="packs/my-song.js"></script>` next to the other packs in `index.html`, and add `<script src="songs/my-song/timing.js"></script>`. If you use the site's song list, also add an entry to `songs/index.js`.
8. **Check it.** Open `index.html?song=my-song`, load the audio, and scrub through every section. `index.html?bench` shows the frame rate. In Tune (T), lower **Particles** or **Glow** on a slow machine.

## Tips that came from real songs
- Generated songs are often mastered loud and flat, so loudness barely changes. Drive the visuals from texture (struck or held), key colour and gaps instead. `hear.js` gives you those.
- Use at most one extra layer at a time on top of the song form. Let gaps take things away rather than add.
- Keep flashes rare, well under 3 a second, for viewers sensitive to flashing light.
- Put the lyrics around the picture, not over its centre (L cycles bottom, top, right and in-scene).
