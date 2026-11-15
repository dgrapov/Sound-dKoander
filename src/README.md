# Source for layers/webgl.js

`layers/webgl.js` is a built bundle (three.js 0.170 + bloom) so the tool keeps working with no build step.
Edit `src/webgl.js`, then rebuild from this folder's parent:

    npm i three@0.170.0 esbuild
    npx esbuild src/webgl.js --bundle --minify --format=iife --target=es2020 --outfile=layers/webgl.js

Tune panel → WebGL group: on/off (off falls back to the 2D song forms), glow, point size.
Any pack can use it: forms:[{ type:'songform', song:'<id>', shape:'road'|'radar'|'torus'|'twist'|'mobius'|'helix'|'knot'|'funnel'|'enso', ... }]
with analysis/<id>/road.js holding the song's spectrogram (see analysis/testing-your-buddha/road.js).
