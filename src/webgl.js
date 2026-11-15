// WebGL layer for the Live Visualizer (three.js + bloom), drawn on its own canvas behind the 2D forms and lyrics.
// Driven by the 'songform' form type (layers/songforms.js): when this layer is loaded and Tune → WebGL is on,
// songform hands every frame here instead of drawing points on the 2D canvas.
// Source: tools/live-visualizer/src/webgl.js  →  build: npx esbuild src/webgl.js --bundle --minify --format=iife --outfile=layers/webgl.js
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const TAU = Math.PI * 2;
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, m) => a + (b - a) * m;
const SHAPES = { radar: 0, torus: 1, twist: 2, mobius: 3, helix: 4, enso: 5, knot: 6, funnel: 7 };
const CAM = { radar: [1.0, 125], torus: [0.45, 128], twist: [0.55, 128], mobius: [0.32, 122], helix: [0.1, 150], enso: [1.25, 120], knot: [0.5, 118], funnel: [0.62, 132] };
const RAMP = `vec3 ramp(float x){
  vec3 c0=vec3(0.03,0.02,0.06), c1=vec3(0.17,0.06,0.39), c2=vec3(0.48,0.10,0.63), c3=vec3(1.0,0.18,0.53), c4=vec3(1.0,0.69,0.13), c5=vec3(1.0,0.97,0.84);
  if(x<0.2) return mix(c0,c1,x/0.2); if(x<0.4) return mix(c1,c2,(x-0.2)/0.2); if(x<0.6) return mix(c2,c3,(x-0.4)/0.2);
  if(x<0.8) return mix(c3,c4,(x-0.6)/0.2); return mix(c4,c5,(x-0.8)/0.2); }`;

let GL = null;          // built lazily per song
let last = null;        // last submitted frame {S, cfg, a, at}
const st = { from: 1, to: 1, mixT: 9, spin: 0, vel: 0, az: 0.7, el: 0.45, dist: 128, c: 1, k: 0, low: 0, mid: 0, high: 0, alpha: 0, lastKickT: -1, flash: 0, voidT: 0, sunOnly: 0, gapP: 0, wasGap: null, tint: [1, 1, 1], tex: 0.5 };

function b64(s) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }
function smoothArr(arr, r) {
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const j = i + k; if (j >= 0 && j < arr.length) { s += arr[j]; n++; } } out[i] = s / n; }
  return out;
}

function build(song, R) {
  const canvas = document.createElement('canvas');
  canvas.id = 'gl';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen;';
  const forms = document.getElementById('forms');
  (forms ? forms.parentNode : document.body).insertBefore(canvas, forms || null);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.0018);
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 6000);

  const SPEC = b64(R.spec), N = R.ncol, NB = R.nb, CPS = R.cps, DUR = R.dur;
  const STEER = R.steer ? new Int8Array(b64(R.steer).buffer) : new Int8Array(N);
  const RMS = R.rms ? b64(R.rms) : new Uint8Array(N).fill(100);
  const KICK = R.kick ? b64(R.kick) : new Uint8Array(N);
  const BEATS = R.beats || [];
  const DOWN = new Set(BEATS.filter((_, i) => i % 4 === (R.bar0 || 0)));

  // ---------- the road: one open circle, centred on the origin ----------
  const steerS = smoothArr(Float32Array.from(STEER, (v) => v / 127), 6), rmsS = smoothArr(Float32Array.from(RMS, (v) => v / 255), 10);
  const PX = new Float32Array(N), PZ = new Float32Array(N), PY = new Float32Array(N), PH = new Float32Array(N), PW = new Float32Array(N);
  { let x = 0, z = 0; for (let c = 0; c < N; c++) { const th = TAU * 0.93 * (c / CPS / DUR) + 0.42 * steerS[c]; x += Math.cos(th) * 6 / CPS; z += Math.sin(th) * 6 / CPS; PX[c] = x; PZ[c] = z; PH[c] = th; PY[c] = 2.2 * rmsS[c]; PW[c] = 9 + 4 * rmsS[c]; } }
  let cx = 0, cz = 0; for (let c = 0; c < N; c++) { cx += PX[c]; cz += PZ[c]; } cx /= N; cz /= N;
  let RAD = 0; for (let c = 0; c < N; c++) { PX[c] -= cx; PZ[c] -= cz; RAD = Math.max(RAD, Math.hypot(PX[c], PZ[c])); }
  const at = (t) => { const f = Math.max(0, Math.min(N - 1.001, t * CPS)), i = Math.floor(f), a = f - i, L = (A) => A[i] * (1 - a) + A[i + 1] * a, th = L(PH);
    return { x: L(PX), y: L(PY), z: L(PZ), th, w: L(PW), nx: -Math.sin(th), nz: Math.cos(th), tx: Math.cos(th), tz: Math.sin(th) }; };
  const road = new THREE.Group(); scene.add(road);
  const specTex = new THREE.DataTexture(SPEC, NB, N, THREE.RedFormat, THREE.UnsignedByteType);
  specTex.magFilter = specTex.minFilter = THREE.LinearFilter; specTex.unpackAlignment = 1; specTex.needsUpdate = true;
  const roadU = { uTint: { value: new THREE.Vector3(1, 1, 1) }, uSpec: { value: specTex }, uV: { value: 0 }, uKick: { value: 0 }, uWhole: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 1 }, uFogD: { value: 0.012 } };
  {
    const pos = new Float32Array(N * 6), uv = new Float32Array(N * 4), av = new Float32Array(N * 2), idx = [];
    for (let c = 0; c < N; c++) { const nx = -Math.sin(PH[c]), nz = Math.cos(PH[c]), hw = PW[c] / 2, v = c / (N - 1);
      pos.set([PX[c] + nx * hw, PY[c], PZ[c] + nz * hw, PX[c] - nx * hw, PY[c], PZ[c] - nz * hw], c * 6); uv.set([0, v, 1, v], c * 4); av[c * 2] = av[c * 2 + 1] = v; }
    for (let c = 0; c < N - 1; c++) { const a = c * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aV', new THREE.BufferAttribute(av, 1)); g.setIndex(idx);
    road.add(new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: roadU, side: THREE.DoubleSide,
      vertexShader: `attribute float aV; varying vec2 vUv; varying float vV; varying float vDepth; uniform float uV; uniform float uKick; uniform float uTime;
        void main(){ vUv = uv; vV = aV; vec3 p = position; float d = (aV - uV) * 195.0;
          p.y += uKick * 0.4 * exp(-abs(d) * 0.9) + 0.08 * uKick * sin(d * 2.4 - uTime * 6.0) * exp(-abs(d) * 0.35);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uTint; uniform sampler2D uSpec; uniform float uV; uniform float uWhole; uniform float uKick; uniform float uAlpha; uniform float uFogD;
        varying vec2 vUv; varying float vV; varying float vDepth; ${RAMP}
        void main(){ float s = pow(texture2D(uSpec, vUv).r, 1.7); float d = (vV - uV) * 195.0; float past = step(d, 0.0); float near = exp(-abs(d) * 0.6);
          float vis = mix(mix(0.42, 0.16, past), 1.35, uWhole);
          vec3 col = ramp(s) * (vis + near * (0.45 + 0.5 * uKick));
          float edge = smoothstep(0.0, 0.025, vUv.x) * smoothstep(1.0, 0.975, vUv.x);
          col += vec3(0.10, 0.89, 1.0) * (1.0 - edge) * (0.25 + 0.5 * near + 0.3 * uWhole);
          col *= mix(vec3(1.0), uTint, 0.55);
          float f = exp(-uFogD * uFogD * vDepth * vDepth); gl_FragColor = vec4(col * f * uAlpha, 1.0); }` })));
  }
  const beatU = { uTime: { value: 0 }, uFogD: roadU.uFogD, uAlpha: roadU.uAlpha };
  if (BEATS.length) {
    const pos = [], aT = [], aD = [];
    for (const bt of BEATS) { const p = at(bt), hw = p.w / 2 + 0.3, y = p.y + 0.04, ox = p.tx * 0.07, oz = p.tz * 0.07;
      const ax = p.x + p.nx * hw, az = p.z + p.nz * hw, bx = p.x - p.nx * hw, bz = p.z - p.nz * hw;
      pos.push(ax - ox, y, az - oz, bx - ox, y, bz - oz, ax + ox, y, az + oz, bx - ox, y, bz - oz, bx + ox, y, bz + oz, ax + ox, y, az + oz);
      for (let k = 0; k < 6; k++) { aT.push(bt); aD.push(DOWN.has(bt) ? 1 : 0); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1)); g.setAttribute('aD', new THREE.Float32BufferAttribute(aD, 1));
    road.add(new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: beatU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'attribute float aT; attribute float aD; varying float vT; varying float vD; varying float vDepth; void main(){ vT=aT; vD=aD; vec4 mv = modelViewMatrix*vec4(position,1.0); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }',
      fragmentShader: `uniform float uTime; uniform float uFogD; uniform float uAlpha; varying float vT; varying float vD; varying float vDepth;
        void main(){ float dt = uTime - vT; float flash = dt >= 0.0 ? exp(-dt * 3.5) : 0.0; float b = 0.06 + 0.12 * vD + flash * (0.9 + vD);
          vec3 c = mix(vec3(0.10,0.89,1.0), vec3(1.0,0.97,0.84), flash * 0.6); gl_FragColor = vec4(c * b * exp(-uFogD * uFogD * vDepth * vDepth) * uAlpha, 1.0); }` })));
  }
  const walker = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 6, 12), new THREE.MeshBasicMaterial({ color: '#f4efe6', transparent: true }));
  const ghost = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 6, 12), new THREE.MeshBasicMaterial({ color: '#ff2e88', transparent: true, opacity: 0.4, depthWrite: false }));
  road.add(walker, ghost);

  // ---------- the song forms: every point is one moment x one pitch band ----------
  const STAGE = new THREE.Vector3(0, 52, 0);
  const ptsU = { uFrom: { value: 1 }, uTo: { value: 1 }, uMix: { value: 1 }, uSpin: { value: 0 }, uTime: { value: 0 }, uV: { value: 0 }, uKick: { value: 0 },
    uLow: { value: 0 }, uMid: { value: 0 }, uHigh: { value: 0 }, uSub: { value: 0.06 }, uSize: { value: 1 }, uWhole: { value: 0 }, uAlpha: { value: 0 },
    uPx: { value: 1 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uTex: { value: 0.5 }, uRipA: { value: new THREE.Vector4(9, 9, 9, 9) }, uRipU: { value: new THREE.Vector4() } };
  {
    const DS = 3, NC = Math.floor(N / DS), U = [], B = [], E = [], Rr = [];
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let c = 0; c < NC; c++) for (let b = 0; b < NB; b++) { let e = 0; for (let k = 0; k < DS; k++) e = Math.max(e, SPEC[(c * DS + k) * NB + b]); e /= 255; if (e < 0.04) continue; U.push(c / NC); B.push(b / (NB - 1)); E.push(e); Rr.push(rnd()); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(U.length * 3), 3));
    g.setAttribute('aU', new THREE.Float32BufferAttribute(U, 1)); g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 1)); g.setAttribute('aE', new THREE.Float32BufferAttribute(E, 1)); g.setAttribute('aR', new THREE.Float32BufferAttribute(Rr, 1));
    const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: ptsU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aU; attribute float aB; attribute float aE; attribute float aR;
        uniform float uFrom, uTo, uMix, uSpin, uTime, uV, uKick, uLow, uMid, uHigh, uSub, uSize, uWhole, uPx, uTex; uniform vec4 uRipA; uniform vec4 uRipU;
        varying float vE; varying float vNear; varying float vVis; varying float vR;
        const float TAU = 6.2831853;
        vec3 formPos(float f, float u, float b, float e, float r){
          float th = u * TAU + uSpin; float bulge = 1.0 + 0.04 * uKick;
          if (f < 0.5) { float rad = (16.0 + b * 46.0) * bulge; return vec3(cos(th) * rad, e * e * 10.0 * (0.4 + uLow), sin(th) * rad); }
          if (f < 2.5) { float R = 42.0; float rr = (11.0 + uLow * 7.0) * bulge + e * 6.0; float ph = b * TAU + (f > 1.5 ? 3.0 * th : 0.0);
            return vec3((R + rr * cos(ph)) * cos(th), rr * sin(ph), (R + rr * cos(ph)) * sin(th)); }
          if (f < 3.5) { float R = 42.0; float s = (b - 0.5) * 2.0 * (17.0 + uLow * 7.0) * bulge;
            return vec3((R + s * cos(th * 0.5)) * cos(th), s * sin(th * 0.5) + e * 3.0, (R + s * cos(th * 0.5)) * sin(th)); }
          if (f < 4.5) { float a = u * TAU * 5.0 + uSpin * 2.0 + (r > 0.5 ? 3.14159 : 0.0); float rad = (12.0 + b * 12.0 + e * 4.0) * bulge;
            return vec3(cos(a) * rad, (u - 0.5) * 120.0, sin(a) * rad); }
          if (f < 5.5) { float a = u * TAU * 0.93 - 1.5708 + uSpin * 0.15; float rad = 46.0 + (b - 0.5) * 16.0 * bulge + e * 3.0; return vec3(cos(a) * rad, e * 2.0, sin(a) * rad); }
          if (f < 6.5) { float R = 34.0; float r0 = 14.0 * bulge; float tr = 3.0 + e * 5.0 + uLow * 4.0; float k = R + r0 * cos(3.0 * th) + cos(b * TAU) * tr;
            return vec3(k * cos(2.0 * th), r0 * sin(3.0 * th) + sin(b * TAU) * tr, k * sin(2.0 * th)); }
          float a = u * TAU * 2.0 + uSpin * 1.5 + b * 1.2; float rad = (5.0 + pow(b, 1.25) * 54.0) * bulge;
          return vec3(cos(a) * rad, -42.0 + b * 74.0 + e * 5.0, sin(a) * rad);
        }
        void main(){
          float du = aU - uV; float near = exp(-abs(du) * 70.0); float cut = step(uSub, aE);
          vec3 p = mix(formPos(uFrom, aU, aB, aE, aR), formPos(uTo, aU, aB, aE, aR), uMix);
          vec3 o = normalize(p + vec3(0.0001));
          p += vec3(sin(aR * 91.0 + uTime * 2.1), sin(aR * 57.0 + uTime * 1.7), cos(aR * 33.0 + uTime * 2.4)) * uMid * 1.6 * aE * (0.35 + 1.3 * uTex);
          for (int i = 0; i < 4; i++) { float a = uRipA[i]; if (a < 1.6) { float d = abs(aU - uRipU[i]); d = min(d, 1.0 - d); p += o * exp(-pow((d - a * 0.2) / 0.018, 2.0)) * (1.0 - a / 1.6) * 3.5; } }
          p += o * near * uKick * 3.0 * aE;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float sparkle = step(0.86, fract(aR * 13.0 + uTime * 3.0));
          gl_PointSize = cut * uSize * uPx * mix(1.25, 0.85, uTex) * (1.0 + aE * 2.6 + near * 2.2 * (1.0 + 0.3 * uKick) + uHigh * 1.5 * sparkle) * 260.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
          vE = aE; vNear = near; vR = aR; vVis = du <= 0.0 ? 1.0 : mix(0.16, 1.0, uWhole);
        }`,
      fragmentShader: `uniform float uAlpha; uniform float uHigh; uniform float uKick; uniform vec3 uTint; varying float vE; varying float vNear; varying float vVis; varying float vR; ${RAMP}
        void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; float a = smoothstep(0.5, 0.05, d);
          vec3 col = ramp(vE) * (0.3 + 0.9 * vVis) + vec3(1.0, 0.97, 0.84) * vNear * (0.35 + 0.6 * uKick);
          col += vec3(0.10, 0.89, 1.0) * uHigh * 0.5 * step(0.9, vR);
          col *= mix(vec3(1.0), uTint, 0.65);
          gl_FragColor = vec4(col * a * uAlpha, 1.0); }` }));
    pts.position.copy(STAGE); pts.frustumCulled = false; scene.add(pts);
  }
  // sun, live spectrum halo, kick shockwaves
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, '#ffb020'); g.addColorStop(0.32, '#ffb020'); g.addColorStop(0.36, 'rgba(255,46,136,0.55)'); g.addColorStop(1, 'rgba(255,46,136,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(sun);
  const HN = 160, mkHalo = (col) => { const l = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    l.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(HN * 3), 3)); l.frustumCulled = false; scene.add(l); return l; };
  const halo = mkHalo('#ff2e88'), halo2 = mkHalo('#19e3ff'), haloV = new Float32Array(HN);
  const waves = [];
  for (let i = 0; i < 8; i++) { const w = new THREE.Mesh(new THREE.RingGeometry(0.988, 1, 160), new THREE.MeshBasicMaterial({ color: i % 2 ? '#19e3ff' : '#ff2e88', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    w.rotation.x = -Math.PI / 2; w.position.copy(STAGE); w.userData.age = 9; w.frustumCulled = false; scene.add(w); waves.push(w); }
  let waveIx = 0, ripIx = 0;
  // ---------- lyrics in the scene: one sprite per letter ----------
  const glyphs = new Map();
  const glyph = (ch) => { let t = glyphs.get(ch); if (t) return t;
    const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d');
    x.font = "italic 300 72px Fraunces, Georgia, 'Times New Roman', serif"; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(255,255,255,.6)'; x.shadowBlur = 6; x.fillText(ch, 48, 52);
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; glyphs.set(ch, t); return t; };
  const muBack = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(7,6,15,0.85)'); g.addColorStop(0.55, 'rgba(7,6,15,0.55)'); g.addColorStop(1, 'rgba(7,6,15,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false, fog: false, opacity: 0 }));
    sp.visible = false; sp.frustumCulled = false; sp.renderOrder = 5; scene.add(sp); return sp; })();
  const letters = [];
  for (let i = 0; i < 90; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    sp.visible = false; sp.frustumCulled = false; scene.add(sp); letters.push(sp); }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1280, 720), 0.6, 0.45, 0.3);
  composer.addPass(bloom); composer.addPass(new OutputPass());
  let size = '';
  function resize(tune) {
    const cap = [1920, 2560, Infinity][Math.round((tune && tune.renderMax) || 0)] || 1920;
    const dpr = Math.min(window.devicePixelRatio || 1, 2, cap / innerWidth), key = innerWidth + 'x' + innerHeight + '@' + dpr.toFixed(3);
    if (key === size) return; size = key;
    renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight, false); composer.setPixelRatio(dpr); composer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); ptsU.uPx.value = innerHeight * dpr / 1080;
  }
  return { muBack, glyph, letters, lyr: { line: -1, chars: [] }, song, canvas, renderer, scene, camera, composer, bloom, resize, at, RAD, N, NB, CPS, DUR, SPEC, KICK, ptsU, roadU, beatU, road, walker, ghost, sun, halo, halo2, haloV, HN, waves, STAGE,
    spawn(power, u) { const w = waves[waveIx++ % waves.length]; w.userData.age = 0; w.userData.p = power; ptsU.uRipA.value.setComponent(ripIx, 0); ptsU.uRipU.value.setComponent(ripIx, u); ripIx = (ripIx + 1) % 4; } };
}

const roadCam = new THREE.Vector3(), roadLook = new THREE.Vector3(), orbit = new THREE.Vector3(), camR = new THREE.Vector3(), camU = new THREE.Vector3(), camZ = new THREE.Vector3(), jig = new THREE.Vector3();
let lastNow = performance.now();
// ---------- lyrics: readable while sung, then subtracted letter by letter ----------
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const lp = new THREE.Vector3();
function lyrics(S, t, now, c, sub, tune, m) {
  if (window.TYBLyrics && TYBLyrics.mode && TYBLyrics.mode() !== 'scene') { for (const l of GL.letters) l.visible = false; GL.muBack.visible = false; return; }
  const L = GL.lyr, TL = (S.timing && S.timing.lines) || [], W = (S.timing && S.timing.words) || [];
  let li = -1;
  for (let j = TL.length - 1; j >= 0; j--) { const a = TL[j], nx = TL[j + 1], e = (a.end ?? a.start) + 1.6, hold = nx && nx.start - e > 6 ? nx.start - 0.4 : e;   // a line before a long instrumental stays and dissolves
    if (a.start != null && t >= a.start - 0.3 && t <= hold) { li = j; L.endT = (a.end ?? a.start); break; } }
  if (li !== L.line) {
    L.line = li; L.chars = [];
    if (li >= 0) {
      const ws = W.filter((w) => w.line === li && w.start != null);
      const list = ws.length ? ws : [{ text: String(TL[li].text).replace(/[()]/g, ''), start: TL[li].start, end: TL[li].end }];
      let k = 0;
      for (const w of list) { const txt = String(w.text).replace(/[()]/g, ''); for (const ch of txt) L.chars.push({ ch, ws: w.start, we: w.end ?? w.start + 0.4, k: k++ }); L.chars.push({ ch: ' ', ws: w.start, we: w.end, k: k++ }); }
      if (/^\W*(ohh\W*)?mu\W*$/i.test(String(TL[li].text))) L.chars = [{ ch: '無', ws: TL[li].start, we: TL[li].end ?? TL[li].start + 3, k: 0, big: 1 }];
    }
  }
  const n = L.chars.length, step = 3.6, drop = Math.min(0.75, Math.max(0, (sub - 0.04) * 1.3));
  const az = st.az, R = 66, y0 = GL.STAGE.y - 30;
  let muShown = false;
  for (let i = 0; i < GL.letters.length; i++) {
    const sp = GL.letters[i], C = L.chars[i];
    if (!C || C.ch === ' ' || (tune.glLyrics ?? 1) <= 0) { sp.visible = false; continue; }
    if (sp.userData.ch !== C.ch) { sp.material.map = GL.glyph(C.ch); sp.material.needsUpdate = true; sp.userData.ch = C.ch; }
    const age = t - C.ws, h = hash(i, L.line), sung = age >= 0, live = age >= 0 && age < (C.we - C.ws) + 0.7;
    const held = Math.max(0, t - (L.endT ?? t) - 1), gone = !C.big && sung && !live && h < Math.min(0.995, (held > 0 ? drop * 0.3 + held / 28 : drop));                                  // subtracted after it was heard
    const fade = gone ? Math.max(0, 1 - (age - (C.we - C.ws) - 0.7) * 1.8) : 1;
    const drift = sung ? Math.max(0, age - (C.we - C.ws) - 0.4) : 0;          // sung letters wander into the form
    // forms: a gently curved line under the sun, facing the camera; sung letters drift up into the form
    const bl = Math.max(c, m), dk = Math.max(1, GL.camera.position.distanceTo(GL.STAGE) / 128);
    const sz0 = 3.4 * dk * (tune.glLyricSize ?? 1), gap = sz0 * 0.56, dx = C.big ? 0 : (C.k - n / 2) * gap;
    const down = C.big ? 0 : (23 - drift * 2.6) * dk + dx * dx * 0.0035 / dk, depth = (C.big ? 20 : 8 + drift * 2) * dk;
    let fx = GL.STAGE.x + camR.x * dx - camU.x * down + camZ.x * depth, fy = GL.STAGE.y + camR.y * dx - camU.y * down + camZ.y * depth + Math.sin(now * 1.3 + i * 0.7) * 0.3,
      fz = GL.STAGE.z + camR.z * dx - camU.z * down + camZ.z * depth;
    if (drift) { const sw = Math.sin(i * 2.1) * drift * 1.4; fx += camR.x * sw; fy += camR.y * sw; fz += camR.z * sw; }
    // road: the words ride the road ahead and pass the walker
    const p = GL.at(C.ws + 2.4 * (1 - m)), off = (C.k - n / 2) * 0.62 * (1 + 7 * m);
    const rx = p.x + p.nx * off, ry = p.y + 2.4 * (1 + 4 * m) + drift * 0.9 + (sung ? 0 : 0.6), rz = p.z + p.nz * off;
    lp.set(lerp(rx, fx, bl), lerp(ry, fy, bl), lerp(rz, fz, bl));
    // weirdness: kicks scatter, mids tilt, highs glitch
    const j = st.k * st.k * lerp(0.15, 0.8, c);
    lp.x += (hash(i, now * 0.01) - 0.5) * j; lp.y += (hash(i + 7, now * 0.01) - 0.5) * j; lp.z += (hash(i + 3, now * 0.01) - 0.5) * j;
    sp.position.copy(lp);
    sp.material.rotation = Math.sin(now * 0.002 + i) * 0.35 * st.mid + (drift ? Math.sin(i) * 0.2 * Math.min(1, drift) : 0);
    if (st.high > 0.3 && hash(i, Math.floor(now / 90)) > 0.97 && !live) { sp.material.map = GL.glyph(String.fromCharCode(0x2591 + (i % 3))); sp.userData.ch = ''; }
    const size = lerp(1.6, 3.4 * dk, bl) * (C.big ? 4 : 1) * (live ? 1.25 + 0.15 * st.k : 1) * (tune.glLyricSize ?? 1);
    sp.scale.set(size, size, 1);
    const col = live ? [1.0, 0.95, 0.82] : sung ? [1.0, 0.45, 0.75] : [0.65, 0.62, 0.85];
    sp.material.color.setRGB(col[0], col[1], col[2]);
    sp.material.opacity = st.alpha * fade * (live ? 1 : sung ? Math.max(held > 0 ? 0.45 : 0, 0.75 - drift * 0.12) : 0.28);
    const bigMode = !!C.big;   // mu is drawn in ink on the sun, not as light
    if (sp.userData.big !== bigMode) { sp.userData.big = bigMode; sp.material.blending = bigMode ? THREE.NormalBlending : THREE.AdditiveBlending; sp.material.needsUpdate = true; }
    if (bigMode) { sp.material.color.setRGB(0.03, 0.02, 0.06); sp.material.opacity = st.alpha * Math.min(1, Math.max(0, age + 0.3) * 1.5); sp.renderOrder = 6; sp.material.depthTest = false;
      GL.muBack.visible = true; GL.muBack.position.copy(sp.position); GL.muBack.scale.set(size * 1.9, size * 1.9, 1); GL.muBack.material.opacity = sp.material.opacity * 0.9; muShown = true; }
    sp.visible = sp.material.opacity > 0.01;
  }
  for (let i = L.chars.length; i < GL.letters.length; i++) GL.letters[i].visible = false;
  if (!muShown) GL.muBack.visible = false;
}
let lyr2d = null;
function hide2dLyrics(hide) {
  if (lyr2d === hide) return; lyr2d = hide;
  for (const id of ['lyric', 'lyricStage', 'typefx']) { const e = document.getElementById(id); if (e) e.style.visibility = hide ? 'hidden' : ''; }
}
// drawn in step with the tool's own frame (from submit); a watchdog hides the canvas when no song form is asking for it
function watchdog() {
  requestAnimationFrame(watchdog);
  if (GL && (!last || performance.now() - last.at > 400)) { GL.canvas.style.display = 'none'; hide2dLyrics(false); }
}
requestAnimationFrame(watchdog);
function render(now) {
  if (!GL || !last) return;
  const dt = Math.min(0.1, Math.max(0.001, (now - lastNow) / 1000)); lastNow = now;
  st.alpha = last.a;
  GL.canvas.style.display = st.alpha < 0.005 ? 'none' : '';
  if (st.alpha < 0.005) return;
  const { S, cfg } = last, tune = S.tune || {}, t = S.t;
  GL.resize(tune);
  const shape = cfg.shape || 'torus', isRoad = shape === 'road';
  // music signals
  st.k = Math.max(S.kickEnv || 0, st.k * Math.exp(-dt * 7));
  st.low += ((S.bass || 0) - st.low) * Math.min(1, dt * 14); st.mid += ((S.mids || 0) - st.mid) * Math.min(1, dt * 8); st.high += ((S.highs || 0) - st.high) * Math.min(1, dt * 12);
  const kicked = S.kick && t !== st.lastKickT; if (kicked) st.lastKickT = t;
  // morph between shapes; the road blends by camera
  if (!isRoad && SHAPES[shape] !== undefined && SHAPES[shape] !== st.to) { st.from = st.mixT < 0.9 ? st.from : st.to; st.to = SHAPES[shape]; st.mixT = 0; }
  st.mixT += dt / 1.8;
  st.c += ((isRoad ? 0 : 1) - st.c) * Math.min(1, dt * 1.8);
  const c = ease(st.c);
  // swirl
  const sw = cfg.swirl || 'bops';
  if (sw === 'bops') { if (kicked) st.vel += 0.25; st.vel *= Math.exp(-dt * 1.2); }
  else if (sw === 'accel') st.vel = Math.min(1.6, st.vel + dt * (0.1 + st.mid * 0.4)); else st.vel *= Math.exp(-dt * 3);
  GL.ptsU.uSpin.value += (0.03 + st.vel * 0.6) * dt;
  if (kicked && c > 0.05 && (S.kickEnv || 1) > 0.8 && t - (st.lastWave || -9) > 0.9) { st.lastWave = t; GL.spawn(0.6, t / GL.DUR); }
  for (let i = 0; i < 4; i++) GL.ptsU.uRipA.value.setComponent(i, GL.ptsU.uRipA.value.getComponent(i) + dt);
  for (const w of GL.waves) { w.userData.age += dt; const k = w.userData.age / 1.3; w.material.opacity = k < 1 && !st.sunOnly && st.voidT <= 0 ? (1 - k) * 0.45 * w.userData.p * c * st.alpha : 0; const s = 20 + k * 95; w.scale.set(s, s, s); w.visible = k < 1; }
  // uniforms
  const sec = S.sectionT ?? 0, sub = cfg.sub ? cfg.sub[0] + (cfg.sub[1] - cfg.sub[0]) * sec : 0.06, whole = cfg.whole ?? 0;
  // what I hear: texture, key colour, gaps (layers/hear.js)
  const Hh = window.VizHear && window.VizHear.at(GL.song, t);
  if (Hh) {
    st.tex += (Hh.perc - st.tex) * Math.min(1, dt * 2);
    for (let q = 0; q < 3; q++) st.tint[q] += (Hh.color[q] - st.tint[q]) * Math.min(1, dt * 0.8);
    if (st.wasGap !== null && Hh.gap !== st.wasGap) { if (Hh.gap) st.gapP = 1; else { st.flash = Math.max(st.flash, 0.8); GL.spawn(1, t / GL.DUR); } }
    st.wasGap = Hh.gap;
  }
  st.gapP *= Math.exp(-dt * 0.35); st.flash *= Math.exp(-dt * 2.6); st.voidT = Math.max(0, st.voidT - dt);
  const P = GL.ptsU;
  P.uFrom.value = st.from; P.uTo.value = st.to; P.uMix.value = ease(st.mixT); P.uSub.value = Math.min(0.95, sub + 0.12 * st.gapP + (Hh && Hh.gap ? 0.06 : 0)); P.uTex.value = st.tex; P.uTint.value.set(st.tint[0], st.tint[1], st.tint[2]); GL.roadU.uTint.value.set(st.tint[0], st.tint[1], st.tint[2]); P.uV.value = t / GL.DUR; P.uTime.value = now / 1000;
  P.uKick.value = st.k; P.uLow.value = st.low; P.uMid.value = st.mid; P.uHigh.value = st.high; P.uWhole.value = whole; P.uAlpha.value = c * st.alpha * (st.voidT > 0 ? 0 : 1) * (1 - st.sunOnly); P.uSize.value = tune.glSize ?? 1;
  // road camera: walk, then rise to the whole when cfg.whole is set
  const m = ease(whole > 0 ? (isRoad ? Math.min(1, (S.sectionT ?? 0) * 1.6) * whole : 1) : 0);
  const pb = GL.at(t - 2.6), pa = GL.at(t + 8);
  roadCam.set(lerp(pb.x, 0, m), lerp(pb.y + 4.4 + 0.06 * st.k, GL.RAD * 2.35, m), lerp(pb.z, GL.RAD * 0.85, m));
  roadLook.set(lerp(pa.x, 0, m), lerp(pa.y + 1.4, 0, m), lerp(pa.z, 0, m));
  GL.roadU.uV.value = t / GL.DUR; GL.roadU.uKick.value = st.k; GL.roadU.uWhole.value = m; GL.roadU.uTime.value = now / 1000; GL.roadU.uAlpha.value = (1 - 0.55 * c) * st.alpha * (st.voidT > 0 ? 0 : 1) * (1 - st.sunOnly);
  GL.roadU.uFogD.value = lerp(lerp(0.012, 0.0006, m), 0.0018, c); GL.beatU.uTime.value = t;
  const pw = GL.at(t), late = 0.45 * (1 - t / GL.DUR), side = 2.4 * (1 - t / GL.DUR), pg = GL.at(Math.max(0, t - late));
  GL.walker.position.set(pw.x, pw.y + 0.5 + 0.04 * st.k, pw.z); GL.ghost.position.set(pg.x + pg.nx * side, pg.y + 0.5, pg.z + pg.nz * side);
  GL.walker.scale.setScalar(1 + 5 * m); GL.ghost.scale.setScalar(1 + 5 * m); GL.walker.material.opacity = st.alpha * (1 - c);
  // orbit camera for the forms
  const fc = CAM[Object.keys(SHAPES).find((k) => SHAPES[k] === st.to)] || CAM.torus;
  st.el += ((cfg.tilt ?? fc[0]) - st.el) * Math.min(1, dt * 1.2); st.dist += (fc[1] - 2 * st.k - st.dist) * Math.min(1, dt * 1.2); st.az += dt * (0.035 + st.vel * 0.08);
  orbit.set(GL.STAGE.x + Math.cos(st.el) * Math.cos(st.az) * st.dist, GL.STAGE.y + Math.sin(st.el) * st.dist, GL.STAGE.z + Math.cos(st.el) * Math.sin(st.az) * st.dist);
  const cam = GL.camera;
  cam.position.copy(roadCam).lerp(orbit, c);
  cam.position.add(jig.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(st.k * st.k * lerp(0.08, 0.35, c)));
  cam.lookAt(roadLook.lerp(GL.STAGE, c));
  cam.fov = lerp(lerp(58, 46, m), 50, c) - 1 * st.k; cam.updateProjectionMatrix();
  GL.scene.fog.density = GL.roadU.uFogD.value;
  // sun
  const sunOn = cfg.sun ?? 0.8, sunS = (40 + 30 * sunOn + 2 * st.k) * lerp(1.6 + 1.2 * m, 1, c);
  GL.sun.position.set(0, lerp(34, GL.STAGE.y, c), 0); GL.sun.scale.set(sunS, sunS, 1); GL.sun.material.opacity = st.alpha * Math.max(0.25, sunOn);
  // halo from live audio, or the song's own spectrum while paused
  const F = window.VizAudio && window.VizAudio.playing && window.VizAudio.playing() ? window.VizAudio.freq : null;
  const col = Math.max(0, Math.min(GL.N - 1, Math.round(t * GL.CPS)));
  for (let i = 0; i < GL.HN; i++) GL.haloV[i] = F ? F[Math.floor(2 + Math.pow(i / GL.HN, 1.6) * 300)] / 255 : GL.SPEC[col * GL.NB + Math.floor(i / GL.HN * GL.NB)] / 255;
  cam.updateMatrixWorld(); cam.matrixWorld.extractBasis(camR, camU, camZ);
  const base = 24 + 2 * st.k;
  for (const [L, r0, dir, op] of [[GL.halo, base, 1, 0.75], [GL.halo2, base * 0.82, -0.4, 0.45]]) {
    const p = L.geometry.attributes.position.array;
    for (let i = 0; i < GL.HN; i++) { const a = (i / GL.HN) * TAU + GL.ptsU.uSpin.value * 0.5, r = r0 + dir * GL.haloV[i] * 16, ca = Math.cos(a), sa = Math.sin(a);
      p[i * 3] = GL.STAGE.x + (camR.x * ca + camU.x * sa) * r; p[i * 3 + 1] = GL.STAGE.y + (camR.y * ca + camU.y * sa) * r; p[i * 3 + 2] = GL.STAGE.z + (camR.z * ca + camU.z * sa) * r; }
    L.geometry.attributes.position.needsUpdate = true; L.material.opacity = op * c * st.alpha;
  }
  if (st.voidT > 0 || st.sunOnly) { for (const l of GL.letters) l.visible = false; GL.muBack.visible = false; GL.halo.material.opacity = GL.halo2.material.opacity = 0; } else lyrics(S, t, now, c, sub, tune, m);
  hide2dLyrics(((tune.glLyrics ?? 1) > 0 || !!window.TYBLyrics) && !!(S.timing && S.timing.lines && S.timing.lines.length));
  GL.bloom.strength = (tune.glGlow ?? 1) * (0.45 + 0.1 * st.k + 0.35 * c * 0.4 + 0.08 * st.k + 0.15 * (1 - st.tex) + 1.0 * st.flash);
  GL.renderer.toneMappingExposure = 0.9 + 0.7 * st.flash;
  GL.composer.render();
}

window.VizGL = {
  // cue events from song layers: flash (dur s), void (dur s: nothing drawn), sunonly (1/0, hold=true sets the state)
  event(type, v, hold) { if (type === 'flash') st.flash = 1; else if (type === 'void') st.voidT = v || 0.6; else if (type === 'sunonly') st.sunOnly = v ? 1 : 0; },
  hearState: () => ({ tex: st.tex, tint: st.tint.slice(), gapP: st.gapP }),
  debug: () => ({ lyr: GL && { line: GL.lyr.line, n: GL.lyr.chars.length, vis: GL.letters.filter((l) => l.visible).length, p0: GL.letters[0].position.toArray().map((v) => +v.toFixed(1)), s0: +GL.letters[0].scale.x.toFixed(1), o0: +GL.letters[0].material.opacity.toFixed(2) }, alpha: st.alpha, c: st.c, to: st.to, shape: last && last.cfg.shape, a: last && last.a, whole: last && last.cfg.whole, t: last && last.S.t, cam: GL && GL.camera.position.toArray().map((v) => +v.toFixed(1)) }),
  // called by layers/songforms.js from its draw() every frame; returns false when the 2D path should draw instead
  submit(S, cfg, a) {
    if ((S.tune && S.tune.glOn) === 0) return false;
    const song = cfg.song || 'testing-your-buddha', R = window.VIZ_ROAD && window.VIZ_ROAD[song];
    if (!R) return false;
    if (!GL || GL.song !== song) {
      try { if (GL) { GL.renderer.dispose(); GL.canvas.remove(); } GL = build(song, R); }
      catch (e) { console.warn('WebGL layer unavailable, using 2D:', e); window.VizGL.failed = true; GL = null; return false; }
    }
    if (window.VizGL.failed) return false;
    last = { S, cfg, a, at: performance.now() };
    render(last.at);
    return true;
  },
};
