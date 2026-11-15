# Prompts for your own agent

Give your agent (any capable AI assistant that can read files) the lyrics, the timing file and the printout of
`tools/analyze_song.py`, plus `docs/FORMATS.md` and `packs/testing-your-buddha.js` as an example. Then use these
prompts one at a time and review each result.

## 1. Hear the song
> Here is my song's analysis (keys per second, drum gaps, struck/held share and brightness per section) and its lyrics
> with section times. For each section, write one line on what you measure, one line on how it feels to you (label it
> as your interpretation), and the single visual idea it suggests. Note where loudness is flat and the drama is in
> texture, key or gaps instead.

## 2. Write the pack
> Using FORMATS.md §5 and the example pack, write `packs/<id>.js` for my song. One section per timing section, with
> the same names and starts. For each, choose a WebGL song-form shape (radar, torus, twist, mobius, helix, knot, funnel,
> enso, road), a particle scene, an order range, a hue and a lyric style that fit what you heard in step 1. The journey
> should change shape as the meaning changes. Keep motion calm by default (reactivity around 0.5) and explain each
> choice in a short comment.

## 3. Cue the moments
> List the moments in the lyrics and audio that deserve a visual event: a word that names an image, a drum return, a
> key change, a silence. Write them as time windows: `{key, a, b, cfg}` turns on one extra effect layer between a and
> b, and `flash`, `void` and `sun-only` are moments. Rule: at most one extra layer at a time, and gaps only subtract.
> Use the timing file's word times for anything tied to a word.

## 4. Consoles (optional)
> Write three short texts per section for the on-screen consoles. **mind**: what you did and thought while making the
> song, as terse program lines with an inner voice. **see**: what you measure, feel, show and why. **meta**: plain
> sentences on what the visuals encode, your intent and the likely impact on the viewer. Name everything the visuals
> do on purpose; hide nothing.

## 5. Review
> Watch the timing against the song and list lines whose times look wrong, sections where too much happens at once,
> and any flash faster than 3 per second. Suggest removals before additions.
