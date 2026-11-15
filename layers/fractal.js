// Live GPU fractal form layers (registered with VizForms in forms.js), rendered every frame by a
// WebGL fragment shader and composited onto the forms canvas.
//
// halley  Halley's method on any formula f(z, t) you type, after the MATLAB "Newtonsmethod"
//         script from thoughtforms.life:
//           z ← z − (f/f') / (1 − f·f'' / (2 f'²)),   up to 50 steps, stop when |z|² changes < 1e-5
//         Colour = mod(k, N) for pixels that converged in an even number of steps k, else black, using
//         the classic 8-colour map (black, blue, green, red, cyan, magenta, yellow, white) or smooth
//         hsv(N). A third colouring, 'basins', colours by the root reached instead.
//         f' and f'' are exact: the formula is compiled to GLSL that carries (f, f', f'') through every
//         operation (forward-mode automatic differentiation), standing in for MATLAB's symbolic diff().
//         The movie parameter t sweeps t:[from, to] with the section (tMode 'section'), loops in time
//         ('time'), or follows the sung note ('pitch').
//         options: formula:'z^3 - 1 + t*z', t:[0,1], tMode, view:[rmin, rmax, imin, imax], colors:'classic8'|N|'basins',
//                  iter:50, size, res, spin, zoom
// julia   z ← z² + c, smooth escape colouring; c orbits the edge of the Mandelbrot set.
(() => {
if (!window.VizForms) return;
const { clamp01 } = VizForms.util;

// ---------------- formula → GLSL jet code (value, first, second derivative) ----------------
// grammar: expr = term (± term)* ; term = unary ((*|/) unary)* ; unary = -unary | pow ; pow = atom (^ unary)? ;
// atom = number | z | t | i | e | pi | fn(expr[, expr]) | (expr). MATLAB-style .^ .* ./ are accepted.
const FN1 = { sin: 'jsin', cos: 'jcos', tan: 'jtan', exp: 'jexp', log: 'jlog', sqrt: 'jsqrt', sinh: 'jsinh', cosh: 'jcosh', tanh: 'jtanh' };
function compileFormula(src) {
  const s = String(src).replace(/\.(?=[\^*\/])/g, '').replace(/\*\*/g, '^').trim();
  const toks = s.match(/\d*\.?\d+(?:[eE][-+]?\d+)?|[A-Za-z_]\w*|[-+*\/^(),]/g) || [];
  if (toks.join('') !== s.replace(/\s+/g, '')) throw new Error('unexpected character in formula');
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  const want = v => { if (next() !== v) throw new Error(`expected "${v}"`); };
  const num = x => `jc(vec2(${(+x).toFixed(8)},0.0))`;
  function expr() { let a = term(); while (peek() === '+' || peek() === '-') { const op = next(), b = term(); a = op === '+' ? `jadd(${a},${b})` : `jsub(${a},${b})`; } return a; }
  function term() { let a = unary(); while (peek() === '*' || peek() === '/') { const op = next(), b = unary(); a = op === '*' ? `jmul(${a},${b})` : `jdiv(${a},${b})`; } return a; }
  function unary() { if (peek() === '-') { next(); return `jneg(${unary()})`; } if (peek() === '+') { next(); return unary(); } return pow(); }
  function pow() {
    const base = atom();
    if (peek() !== '^') return base;
    next();
    const neg = peek() === '-' && /^\d+$/.test(toks[p + 1] || '');
    if ((/^\d+$/.test(peek() || '') || neg) && (toks[p + (neg ? 2 : 1)] === undefined || /^[-+*\/),]$/.test(toks[p + (neg ? 2 : 1)]))) {
      if (neg) next();
      const n = +next();
      if (n > 16) throw new Error('integer powers up to 16');
      let out = n === 0 ? num(1) : base;
      for (let k = 1; k < n; k++) out = `jmul(${out},${base})`;
      return neg ? `jdiv(${num(1)},${out})` : out;
    }
    return `jexp(jmul(${unary()},jlog(${base})))`;         // general power via exp(b·log a)
  }
  function atom() {
    const tk = next();
    if (tk === undefined) throw new Error('formula ends early');
    if (/^\d|^\./.test(tk)) return num(tk);
    if (tk === '(') { const e = expr(); want(')'); return e; }
    if (tk === 'z') return 'jz';
    if (tk === 't') return 'jc(vec2(uT,0.0))';
    if (tk === 'i' || tk === 'j') return 'jc(vec2(0.0,1.0))';
    if (tk === 'e') return num(Math.E);
    if (tk === 'pi') return num(Math.PI);
    if (FN1[tk]) { want('('); const a = expr(); want(')'); return `${FN1[tk]}(${a})`; }
    if (tk === 'power') { want('('); const a = expr(); want(','); const b = expr(); want(')'); return `jexp(jmul(${b},jlog(${a})))`; }
    throw new Error(`unknown name "${tk}" (use z, t, i, e, pi, sin, cos, tan, exp, log, sqrt, sinh, cosh, tanh, power)`);
  }
  const out = expr();
  if (p < toks.length) throw new Error(`unexpected "${toks[p]}"`);
  return out;
}

const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const LIB = `
precision highp float;
uniform vec2 uRes; uniform float uScale, uRot, uTime, uKick, uOrder, uT, uIter, uColors, uCmode, uHue0, uHueE;
uniform vec4 uView; uniform vec2 uC;
float chf(float x){ return 0.5*(exp(x) + exp(-x)); }
float shf(float x){ return 0.5*(exp(x) - exp(-x)); }
vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }
vec2 cdiv(vec2 a, vec2 b){ float d = dot(b, b) + 1e-30; return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y)/d; }
vec2 cexp(vec2 a){ return exp(a.x)*vec2(cos(a.y), sin(a.y)); }
vec2 clog(vec2 a){ return vec2(log(length(a) + 1e-30), atan(a.y, a.x)); }
vec2 csin(vec2 a){ return vec2(sin(a.x)*chf(a.y), cos(a.x)*shf(a.y)); }
vec2 ccos(vec2 a){ return vec2(cos(a.x)*chf(a.y), -sin(a.x)*shf(a.y)); }
struct J { vec2 v; vec2 d; vec2 dd; };
J jc(vec2 c){ return J(c, vec2(0.0), vec2(0.0)); }
J jadd(J a, J b){ return J(a.v + b.v, a.d + b.d, a.dd + b.dd); }
J jsub(J a, J b){ return J(a.v - b.v, a.d - b.d, a.dd - b.dd); }
J jneg(J a){ return J(-a.v, -a.d, -a.dd); }
J jmul(J a, J b){ return J(cmul(a.v, b.v), cmul(a.d, b.v) + cmul(a.v, b.d), cmul(a.dd, b.v) + 2.0*cmul(a.d, b.d) + cmul(a.v, b.dd)); }
J jdiv(J a, J b){ vec2 q = cdiv(a.v, b.v); vec2 q1 = cdiv(a.d - cmul(q, b.d), b.v); vec2 q2 = cdiv(a.dd - 2.0*cmul(q1, b.d) - cmul(q, b.dd), b.v); return J(q, q1, q2); }
J jchain(J a, vec2 g, vec2 g1, vec2 g2){ return J(g, cmul(g1, a.d), cmul(g2, cmul(a.d, a.d)) + cmul(g1, a.dd)); }
J jexp(J a){ vec2 e = cexp(a.v); return jchain(a, e, e, e); }
J jlog(J a){ vec2 r = cdiv(vec2(1.0, 0.0), a.v); return jchain(a, clog(a.v), r, -cmul(r, r)); }
J jsin(J a){ vec2 s = csin(a.v), c = ccos(a.v); return jchain(a, s, c, -s); }
J jcos(J a){ vec2 s = csin(a.v), c = ccos(a.v); return jchain(a, c, -s, -c); }
J jtan(J a){ return jdiv(jsin(a), jcos(a)); }
J jsinh(J a){ return jmul(jc(vec2(0.5, 0.0)), jsub(jexp(a), jexp(jneg(a)))); }
J jcosh(J a){ return jmul(jc(vec2(0.5, 0.0)), jadd(jexp(a), jexp(jneg(a)))); }
J jtanh(J a){ return jdiv(jsinh(a), jcosh(a)); }
J jsqrt(J a){ vec2 s = cexp(0.5*clog(a.v)); vec2 g1 = cdiv(vec2(0.5, 0.0), s); return jchain(a, s, g1, cdiv(-0.5*g1, a.v)); }
vec3 hsv2rgb(float h, float s, float v){ vec3 k = clamp(abs(mod(h*6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); return v*mix(vec3(1.0), k, s); }
vec3 classic8(float k){                                     // MATLAB clrmp = [0 0 0; 0 0 1; 0 1 0; 1 0 0; 0 1 1; 1 0 1; 1 1 0; 1 1 1]
  if (k < 0.5) return vec3(0.0); if (k < 1.5) return vec3(0.0, 0.0, 1.0); if (k < 2.5) return vec3(0.0, 1.0, 0.0); if (k < 3.5) return vec3(1.0, 0.0, 0.0);
  if (k < 4.5) return vec3(0.0, 1.0, 1.0); if (k < 5.5) return vec3(1.0, 0.0, 1.0); if (k < 6.5) return vec3(1.0, 1.0, 0.0); return vec3(1.0);
}
vec2 pix(){
  vec2 q = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x, uRes.y);  // -0.5..0.5
  float cs = cos(uRot), sn = sin(uRot); q = vec2(cs*q.x - sn*q.y, sn*q.x + cs*q.y)/uScale;
  return vec2(mix(uView.x, uView.y, q.x + 0.5), mix(uView.z, uView.w, q.y + 0.5));
}
float window(){ vec2 q = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x, uRes.y); return 1.0 - smoothstep(0.42, 0.5, length(q)); }
`;
function halleyFS(formulaGLSL) {
  return LIB + `
J F(vec2 z){ J jz = J(z, vec2(1.0, 0.0), vec2(0.0)); return ${formulaGLSL}; }
void main(){
  float vig = window(); if (vig <= 0.0) { gl_FragColor = vec4(0.0); return; }
  vec2 z = pix(); float g = dot(z, z), gp = g, k = 0.0; bool conv = false;
  for (int n = 1; n <= 80; n++) {
    if (float(n) > uIter) break;
    J f = F(z);
    vec2 r = cdiv(f.v, f.d);                                     // f/f'
    vec2 den = vec2(1.0, 0.0) - cdiv(cmul(f.v, f.dd), 2.0*cmul(f.d, f.d));
    z -= cdiv(r, den);                                           // Halley step (as in the MATLAB script)
    k = float(n); gp = g; g = dot(z, z);
    if (n > 1 && abs(g - gp) < 1e-5) { conv = true; break; }
  }
  vec3 col; float a;
  if (uCmode < 0.5) {                                            // classic 8: mod(k, 8) on even-k converged pixels
    float idx = (conv && mod(k, 2.0) < 0.5) ? mod(k, 8.0) : 0.0;
    col = classic8(idx); a = idx > 0.0 ? 0.95 : 0.0;
  } else if (uCmode < 1.5) {                                     // smooth hsv(N), same rule
    float N = max(2.0, uColors), idx = (conv && mod(k, 2.0) < 0.5) ? mod(k, N) : 0.0;
    col = idx > 0.0 ? hsv2rgb(fract(idx/N + uHue0), 1.0, 1.0) : vec3(0.0); a = idx > 0.0 ? 0.9 : 0.0;
  } else {                                                       // basins: hue by the root reached, shade by steps
    float h = fract(atan(z.y, z.x)/6.2831853 + 0.5*length(z)*0.1 + uHue0), sh = 1.0 - k/uIter;
    col = hsv2rgb(h, 0.8, 0.25 + 0.75*sh) + hsv2rgb(uHueE, 0.9, 1.0)*smoothstep(0.75, 1.0, k/uIter)*(0.5 + uKick);
    a = conv ? 0.35 + 0.6*sh : 0.15;
  }
  a *= vig*(0.85 + 0.3*uKick);
  gl_FragColor = vec4(col*a, a);
}`;
}
const JULIA_FS = LIB + `
void main(){
  float vig = window(); if (vig <= 0.0) { gl_FragColor = vec4(0.0); return; }
  vec2 z = pix(); float it = 0.0; bool esc = false;
  for (int i = 0; i < 200; i++) { if (float(i) >= uIter) break; z = cmul(z, z) + uC; if (dot(z, z) > 64.0) { esc = true; break; } it += 1.0; }
  vec3 col; float a;
  if (esc) { float sm = max(0.0, it + 1.0 - log2(log2(dot(z, z))*0.5)), u = log(sm + 1.0)/log(uIter + 1.0);   // log scale: most points escape fast
    col = hsv2rgb(fract(mix(uHue0, uHueE, smoothstep(0.2, 0.9, u)) + 0.06*sin(sm*0.25 + uTime*0.2)), 0.85, 0.1 + 0.9*pow(u, 1.4)); a = smoothstep(0.12, 0.75, u); }
  else { col = hsv2rgb(fract(uHue0 + 0.5), 0.6, 0.25 + 0.25*uKick); a = 0.8; }
  a *= vig; gl_FragColor = vec4(col*a, a);
}`;

// ---------------- WebGL plumbing ----------------
const UN = ['uRes', 'uScale', 'uRot', 'uTime', 'uKick', 'uOrder', 'uT', 'uIter', 'uColors', 'uCmode', 'uHue0', 'uHueE', 'uView', 'uC'];
function makeGL() {
  const cv = document.createElement('canvas');
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false });
  if (!gl) return null;
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  return { cv, gl, prog: null, U: {} };
}
function useProgram(G, fs, names = UN) {
  const { gl } = G;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const m = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(m); } return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  if (G.prog) gl.deleteProgram(G.prog);
  G.prog = pr; gl.useProgram(pr);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  G.U = {}; for (const n of names) G.U[n] = gl.getUniformLocation(pr, n);
}

function factory(mode) {
  return (cfg) => {
    let G = null, err = '', compiled = null, rot = 0, kickZ = 0, th = Math.random()*6.28, lastP = null, tv = 0, cx = 0, cy = 0;
    try { G = makeGL(); if (!G) err = 'no WebGL'; else if (mode === 'julia') useProgram(G, JULIA_FS); } catch (e) { err = 'shader: ' + e.message; G = null; }
    function ensure() {                                 // (re)compile when the formula changes
      if (!G || mode !== 'halley') return;
      const f = cfg.formula || 'z^3 - 1';
      if (f === compiled) return;
      compiled = f;
      try { useProgram(G, halleyFS(compileFormula(f))); err = ''; } catch (e) { err = 'formula: ' + e.message; G.prog = null; }
      VizFractal.lastError = err;
    }
    return {
      reconfig(c) { cfg = c; },
      step(S) {
        if (!G) return 'fractal: ' + err;
        ensure();
        if (err) return 'fractal: ' + err;
        rot += S.dt*(cfg.spin ?? 0.03)*(1 + S.highs);
        kickZ = Math.max(kickZ*Math.exp(-S.dt*4), S.kick ? 1 : 0);
        if (S.pitch != null) lastP = S.pitch;
        const pn = lastP != null ? ((lastP % 12) + 12) % 12/12 : 0;
        if (mode === 'halley') {
          const [t0, t1] = cfg.t || [0, 1], m = cfg.tMode || 'section';
          const u = m === 'time' ? 0.5 - 0.5*Math.cos(S.t*2*Math.PI/(cfg.period || 16)) : m === 'pitch' ? pn : clamp01(S.sectionT);
          const target = t0 + (t1 - t0)*u;
          tv += (target - tv)*Math.min(1, S.dt*(m === 'pitch' ? 3 : 8));
          return `Halley ${cfg.formula || 'z^3 - 1'} · t=${tv.toFixed(3)}`;
        }
        th += S.dt*(0.05 + 0.1*S.mids) + (S.kick ? 0.04*(S.tune.kickPhys ?? 1) : 0);
        const R = 0.7885 + 0.02*Math.sin(S.t*0.4) + pn*0.01;
        cx = R*Math.cos(th + pn*0.5); cy = R*Math.sin(th + pn*0.5);
        return `Julia c=${cx.toFixed(3)}${cy >= 0 ? '+' : '−'}${Math.abs(cy).toFixed(3)}i`;
      },
      draw(ctx, S, a) {
        if (!G || !G.prog || err) return;
        const side = Math.min(S.W, S.H)*(cfg.size ?? 0.95), res = cfg.res ?? 0.6;
        const px = Math.max(64, Math.round(side*res));
        if (G.cv.width !== px) { G.cv.width = G.cv.height = px; }
        const { gl, U } = G;
        gl.viewport(0, 0, px, px); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        const v = cfg.view || (mode === 'halley' ? [-2, 2, -2, 2] : [-1.6, 1.6, -1.6, 1.6]);
        gl.uniform2f(U.uRes, px, px);
        gl.uniform1f(U.uScale, (cfg.zoom ?? 1)*(1 + 0.05*kickZ));
        gl.uniform1f(U.uRot, rot); gl.uniform1f(U.uTime, S.t);
        gl.uniform1f(U.uKick, S.kickEnv); gl.uniform1f(U.uOrder, S.order);
        gl.uniform1f(U.uT, tv);
        gl.uniform1f(U.uIter, cfg.iter ?? (mode === 'halley' ? 50 : 120));
        const col = cfg.colors ?? 'classic8';
        gl.uniform1f(U.uCmode, col === 'classic8' ? 0 : col === 'basins' ? 2 : 1);
        gl.uniform1f(U.uColors, typeof col === 'number' ? col : 16);
        const h = d => (((d + S.hueShift) % 360) + 360) % 360/360;
        gl.uniform1f(U.uHue0, h(S.palette.life)); gl.uniform1f(U.uHueE, h(S.palette.flame));
        gl.uniform4f(U.uView, v[0], v[1], v[2], v[3]);
        gl.uniform2f(U.uC, cx, cy);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        ctx.globalAlpha = Math.min(1, a); ctx.imageSmoothingEnabled = true;
        ctx.drawImage(G.cv, (S.W - side)/2, (S.H - side)/2, side, side);
      },
    };
  };
}
window.VizFractal = { compileFormula, lastError: '' };
VizForms.register('halley', factory('halley'));
VizForms.register('julia', factory('julia'));

// ---------------- fractalPatches: small round fractal windows in the empty parts of the frame ----------------
// One full-screen GLSL pass draws up to 8 patches. Each patch is a feathered disc (edge = 25% of its radius) with its
// own view (zoom/offset from its seed). Fragments outside every patch are discarded, so cost scales with covered area.
// Overlaps blend screen-wise (a + b·(1 − a), capped at 1). Lyric boxes are masked out in the shader, so patches
// never cover text, and placement steers away from them.
//   kind:'julia'|'halley'  formula (halley)  colors:'basins'|'steps' (halley)  c:[re,im]|'drift'|'dust' (julia)
//   count  max  r:[r0,r1] (fraction of screen height)  place:'empty'|'corner'  t:[t0,t1] (halley t, across the section)
//   grow: 'section' r0→r1 across the section · 'kick' +dr per kick, slow decay, spreads up to max
//         'line'   a new patch at each lyric line start · 'multiply' doubles every `every` beats from `at`/`fromS`
//         'nest'   each patch gets a half-size child inside it · 'orbit' two patches orbit, merging on the `merge` word
//         'outro'  patches go out one by one, the last one on the `at` line · 'flicker' opacity follows the kicks
//         'demand' patches spawned by the K key / recorded cues (VizPatches.spawn)
//   at: lyric text that starts the behaviour (looked up in the timing file), fromS: fallback time in seconds
const MAXP = 8;
const PATCH_UN = ['uEdge', 'uKick', 'uIter', 'uCmode', 'uN', 'uP', 'uQ', 'uCC', 'uKeep', 'uFeather', 'uPal0', 'uPal1', 'uPal2'];
function patchFS(kind, formulaGLSL) {
  const body = kind === 'halley' ? `
float gT;
J F(vec2 z){ J jz = J(z, vec2(1.0, 0.0), vec2(0.0)); return ${formulaGLSL.replace(/\buT\b/g, 'gT')}; }
vec4 patchCol(vec2 q, vec4 Q, vec2 c){
  gT = Q.w; vec2 z = q*Q.x + Q.yz; float g = dot(z, z), gp = g, k = 0.0; bool conv = false;
  for (int n = 1; n <= 60; n++) {
    if (float(n) > uIter) break;
    J f = F(z); vec2 r = cdiv(f.v, f.d);
    vec2 den = vec2(1.0, 0.0) - cdiv(cmul(f.v, f.dd), 2.0*cmul(f.d, f.d));
    z -= cdiv(r, den); k = float(n); gp = g; g = dot(z, z);
    if (n > 1 && abs(g - gp) < 1e-5) { conv = true; break; }
  }
  if (!conv) return vec4(0.0);
  float sh = 1.0 - k/uIter;
  if (uCmode > 1.5) {                                   // root basins in ember / gold / green
    float ang = fract(atan(z.y, z.x)/6.2831853 + 1.0/6.0 + 1.0);
    vec3 col = ang < 0.33333 ? uPal0 : ang < 0.66667 ? uPal1 : uPal2;
    return vec4(col*(0.3 + 0.7*sh), 0.35 + 0.6*sh);
  }
  if (mod(k, 2.0) > 0.5) return vec4(0.0);              // the MATLAB rule: colour only even-step converged pixels
  float idx = mod(k*0.5, 3.0);
  return vec4(idx < 0.5 ? uPal0 : idx < 1.5 ? uPal1 : uPal2, 0.9);
}` : `
vec4 patchCol(vec2 q, vec4 Q, vec2 c){
  vec2 z = q*Q.x + Q.yz; float it = 0.0; bool esc = false;
  for (int n = 0; n < 160; n++) { if (float(n) >= uIter) break; z = cmul(z, z) + c; if (dot(z, z) > 64.0) { esc = true; break; } it += 1.0; }
  if (esc) {
    float sm = max(0.0, it + 1.0 - log2(log2(dot(z, z))*0.5)), u = log(sm + 1.0)/log(uIter + 1.0);
    return vec4(pal3(smoothstep(0.15, 0.95, u))*(0.25 + 0.75*pow(u, 1.2)), smoothstep(0.08, 0.6, u));
  }
  return vec4(uPal0*0.35*(0.6 + 0.6*uKick), 0.55);
}`;
  return LIB + `
#define MAXP ${MAXP}
uniform float uN, uFeather, uEdge;   // uEdge: feathered fraction of the radius
uniform vec4 uP[MAXP];      // centre x, y (GL px), radius (px), opacity
uniform vec4 uQ[MAXP];      // zoom, view offset x, y, halley t
uniform vec2 uCC[MAXP];     // julia c
uniform vec4 uKeep[2];      // lyric keep-out boxes (GL px): x0, y0, x1, y1
uniform vec3 uPal0, uPal1, uPal2;
vec3 pal3(float x){ return x < 0.5 ? mix(uPal0, uPal1, x*2.0) : mix(uPal1, uPal2, x*2.0 - 1.0); }
${body}
float keepMask(vec2 f){
  float m = 1.0;
  for (int i = 0; i < 2; i++) {
    vec4 r = uKeep[i]; if (r.z <= r.x) continue;
    vec2 d = max(r.xy - f, f - r.zw);
    m = min(m, smoothstep(0.0, uFeather, max(d.x, d.y)));   // 0 inside the box, feathered to 1 outside
  }
  return m;
}
void main(){
  vec2 f = gl_FragCoord.xy;
  float km = keepMask(f); if (km <= 0.0) discard;
  vec3 acc = vec3(0.0); float aa = 0.0; bool any = false;
  for (int i = 0; i < MAXP; i++) {
    if (float(i) >= uN) break;
    vec4 P = uP[i]; vec2 d = f - P.xy; float dist = length(d);
    if (dist >= P.z || P.w <= 0.003) continue;
    float op = (1.0 - smoothstep(P.z*(1.0 - uEdge), P.z, dist))*P.w;
    vec4 c = patchCol(d/P.z, uQ[i], uCC[i]);
    float a = c.a*op;
    acc += c.rgb*a*(1.0 - acc); aa += a*(1.0 - aa); any = true;   // screen blend, capped at 1
  }
  if (!any) discard;
  gl_FragColor = vec4(acc*km, aa*km);
}`;
}

const hsl = (h, s, l) => {                               // -> [r,g,b] 0..1
  h = ((h % 360) + 360) % 360/360; const q = l < 0.5 ? l*(1 + s) : l + s - l*s, p = 2*l - q;
  const f = t => { t = (t + 1) % 1; return t < 1/6 ? p + (q - p)*6*t : t < 1/2 ? q : t < 2/3 ? p + (q - p)*(2/3 - t)*6 : p; };
  return [f(h + 1/3), f(h), f(h - 1/3)];
};
// lyric boxes in device px: tight boxes around the visible text of each line (a DOM Range measures the glyphs, not the
// full-width line element), at most 2 (the shader's uKeep[2]); `union` is their bounding box (for placement), or null
function lyricBoxes(DPR) {
  const st = document.getElementById('lyricStage');
  if (st && +getComputedStyle(st).opacity === 0) return null;
  const boxes = [], rg = document.createRange();
  for (const el of document.querySelectorAll('#lyricStage .ly, #lyric')) {
    if (!el.textContent.trim() || +getComputedStyle(el).opacity < 0.05) continue;
    rg.selectNodeContents(el); const r = rg.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    boxes.push([r.left*DPR, r.top*DPR, r.right*DPR, r.bottom*DPR]);
  }
  if (!boxes.length) return null;
  boxes.sort((a, b) => (b[2] - b[0])*(b[3] - b[1]) - (a[2] - a[0])*(a[3] - a[1]));
  while (boxes.length > 2) { const b = boxes.pop(), a = boxes[boxes.length - 1]; boxes[boxes.length - 1] = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]; }
  const u = boxes.reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
  return { boxes, union: u };
}
// the line / word time of some lyric text inside a section (timing file), or null
function lyricTime(timing, secName, text, word) {
  if (!timing || !text) return null;
  const re = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (word) { const w = (timing.words || []).find(w => re.test(w.text) && (timing.lines[w.line] || {}).section === secName); return w ? w.start : null; }
  const l = (timing.lines || []).find(l => l.section === secName && re.test(l.text)); return l ? l.start : null;
}
const demandQ = []; let demandLive = 0;
window.VizPatches = {
  spawn() { demandQ.push(1); },
  demandActive: () => demandQ.length > 0 || demandLive > 0,
  DEMAND_CFG: { type:'fractalPatches', kind:'julia', grow:'demand', r:[0.035, 0.11], max:8, opacity:0.7, c:'drift' },
  bench: null,                                          // last draw() cost in ms (set when VizPatches.benchOn)
  benchOn: /[?&]bench\b/.test(location.search),       // open index.html?bench to show the cost in the readout
  debug: [],                                            // per-instance state for tests (patches + live lyric box)
};

function patchesFactory(cfg0, S0) {
  let cfg = cfg0, G = null, err = '', progKey = '', lum = null, lumT = -9, keepMem = null, keepMemT = -9, lastT = S0.t, secName = S0.section.name;
  let modeT0 = S0.t, multN = 0, multNext = null, merged = false, inited = false;
  const P = [], R = VizForms.util.rng((cfg.seed || 11)*7919 + Math.floor(S0.t*10)), lumCv = document.createElement('canvas');
  lumCv.width = 64; lumCv.height = 36; const lctx = lumCv.getContext('2d', { willReadFrequently: true });
  try { G = makeGL(); if (!G) err = 'no WebGL'; } catch (e) { err = e.message; }
  const kindOf = () => cfg.kind === 'halley' ? 'halley' : 'julia';
  function ensureProg() {
    if (!G) return;
    const k = kindOf() + '|' + (kindOf() === 'halley' ? (cfg.formula || 'z^3 - 1') : '');
    if (k === progKey) return; progKey = k;
    try { useProgram(G, patchFS(kindOf(), kindOf() === 'halley' ? compileFormula(cfg.formula || 'z^3 - 1') : ''), PATCH_UN); err = ''; }
    catch (e) { err = 'patches: ' + e.message; G.prog = null; }
  }
  const secBounds = S => {                              // [start, end] of this section in song time
    const tm = S.timing, i = tm && tm.sections ? tm.sections.findIndex(s => s.name === S.section.name) : -1;
    if (i >= 0) return [tm.sections[i].start, i + 1 < tm.sections.length ? tm.sections[i + 1].start : Infinity];
    return [S.t - 1e-3, Infinity];
  };
  const [r0d, r1d] = [0.03, 0.09];
  const rr = () => cfg.r || [r0d, r1d];
  const maxN = S => Math.max(0, Math.min(cfg.max ?? 6, MAXP, Math.round(S.tune.patchMax ?? MAXP)));
  const alive = () => P.filter(p => !p.dying);
  function sampleLum(S) {
    if (S.t - lumT < 0.5 && lum) return; lumT = S.t;
    try {
      lctx.clearRect(0, 0, 64, 36);
      for (const id of ['stage', 'physics']) { const c = document.getElementById(id); if (c) lctx.drawImage(c, 0, 0, 64, 36); }
      const d = lctx.getImageData(0, 0, 64, 36).data; lum = new Float32Array(64*36);
      for (let i = 0; i < lum.length; i++) lum[i] = (0.2126*d[i*4] + 0.7152*d[i*4 + 1] + 0.0722*d[i*4 + 2])/255;
    } catch (e) { lum = null; }
  }
  function cellLum(x, y, S) {                           // mean luminance around (x, y) device px
    if (!lum) return 0;
    const cx = Math.floor(x/S.W*64), cy = Math.floor(y/S.H*36); let s = 0, n = 0;
    for (let j = cy - 4; j <= cy + 4; j++) for (let i = cx - 5; i <= cx + 5; i++) if (i >= 0 && j >= 0 && i < 64 && j < 36) { s += lum[j*64 + i]; n++; }
    return n ? s/n : 0;
  }
  const boxDist = (x, y, b) => !b ? 1e9 : Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3]));
  function scoreAt(x, y, r, S) {
    const H = S.H, kb = keepMem, dk = boxDist(x, y, kb);
    if (dk < r*1.05) return -1e9;                        // would touch the lyric band
    const dc = Math.hypot((x - S.W/2)/S.W, (y - S.H/2)/S.H)/0.7;
    let dp = 1e9; for (const p of alive()) dp = Math.min(dp, Math.hypot(p.x - x, p.y - y) - p.r*H);
    return (1 - cellLum(x, y, S))*1.2 + Math.min(1, dc)*0.7 + Math.min(1, dk/(0.25*H))*0.6 + Math.min(1, dp/(0.3*H))*0.9 + R()*0.08;
  }
  function placeNew(S, r, near) {                       // best of the 6×4 grid (or corners), or next to a parent
    const H = S.H, W = S.W; let best = null, bs = -1e10;
    const cands = [];
    if (near) { for (let k = 0; k < 8; k++) { const a = k*Math.PI/4 + R()*0.4, d = (near.r + r)*H*0.8; cands.push([near.x + Math.cos(a)*d, near.y + Math.sin(a)*d]); } }
    else if (cfg.place === 'corner') { for (const [i, j] of [[0, 0], [5, 0], [0, 3], [5, 3]]) cands.push([(i + 0.5)/6*W, (j + 0.5)/4*H]); }
    else for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) cands.push([(i + 0.5 + (R() - 0.5)*0.5)/6*W, (j + 0.5 + (R() - 0.5)*0.5)/4*H]);
    for (const [x0, y0] of cands) {
      const x = Math.max(r*H, Math.min(W - r*H, x0)), y = Math.max(r*H, Math.min(H - r*H, y0));
      let s = scoreAt(x, y, r, S);
      if (cfg.far) { let dmin = 1e9; for (const p of alive()) dmin = Math.min(dmin, Math.hypot(p.x - x, p.y - y)); if (dmin < 1e9) s += 3*dmin/W; }   // "far corners"
      if (s > bs) { bs = s; best = [x, y]; }
    }
    return bs > -1e8 ? best : null;
  }
  function spawn(S, opt = {}) {
    if (alive().length >= maxN(S)) return null;
    const [r0] = rr(), r = opt.r ?? r0, pos = opt.at || placeNew(S, Math.min(0.15, Math.max(r, rr()[1]*0.6)), opt.near);   // big patches: place by their core; the shader masks lyrics
    if (!pos) return null;
    const seed = R(), p = { x: pos[0], y: pos[1], r: opt.r0 ?? r*0.4, rT: r, a: 0, born: S.t, dying: false, seed,
      zoom: (kindOf() === 'halley' ? 1.6 : 1.25)*(0.75 + 0.5*R()), ox: (R() - 0.5)*0.5, oy: (R() - 0.5)*0.5, th: R()*6.283,
      vx: (R() - 0.5), vy: (R() - 0.5), parent: opt.parent || null, life: opt.life ?? Infinity, child: !!opt.parent };
    if (opt.parent) { p.zoom = opt.parent.zoom*0.5; p.ox = opt.parent.ox; p.oy = opt.parent.oy; p.th = opt.parent.th; }   // the shape inside the shape
    P.push(p); return p;
  }
  const kill = p => { p.dying = true; };
  function onReconfig(S) {                              // section change with the same form type: carry patches on
    secName = S.section.name; modeT0 = S.t; multN = 0; multNext = null; merged = false; inited = true;
    const g = cfg.grow, lim = maxN(S);
    alive().forEach((p, i) => { if (i >= lim) kill(p); p.parent = null; p.child = false; });
    if (g === 'multiply') { this._sched = null; alive().slice(cfg.count ?? 0).forEach(kill); }   // the build starts fresh: carried patches hand off
    if (g === 'nest') {                                 // keep up to half as parents, each gets a half-size child
      const par = alive().sort((a, b) => b.r - a.r), keepN = Math.max(1, Math.floor(lim/2));
      par.slice(keepN).forEach(kill);
      while (par.length < Math.min(keepN, cfg.count ?? 2)) { const p = spawn(S, { r: rr()[0] }); if (!p) break; par.push(p); }   // fresh start (e.g. after a seek)
      for (const p of par.slice(0, keepN)) { p.rT = Math.min(p.rT, rr()[1]); spawn(S, { at: [p.x, p.y], r: p.rT*0.5, r0: p.r*0.1, parent: p }); }
    }
    if (g === 'outro') {                                // schedule: one by one, the last on the `at` line
      const [s0] = secBounds(S), tEnd = lyricTime(S.timing, secName, cfg.at) ?? cfg.fromS ?? s0 + 10, list = alive();
      while (list.length < (cfg.count ?? 3)) { const p = spawn(S); if (!p) break; list.push(p); }
      list.forEach((p, i) => { p.dieAt = s0 + (tEnd - s0)*(i + 1)/list.length; });
    }
  }
  return {
    reconfig(c, S) { const old = cfg; cfg = c; if (S && (old !== c)) { ensureProg(); onReconfig(S); } },
    step(S, active) {
      if (!G) return 'patches: ' + err;
      ensureProg(); if (err) return err;
      const on = (S.tune.patchesOn ?? 1) > 0, dt = S.dt, H = S.H, [r0, r1] = rr(), g = cfg.grow || 'section';
      if (S.t < lastT - 0.5 || S.t > lastT + 2) { this._mid = null; inited = false; }   // a seek: re-derive the schedule
      if (!inited && active) { inited = true; secName = S.section.name; if (g === 'outro' || g === 'nest' || g === 'multiply') onReconfig(S); }
      sampleLum(S);
      const lb = lyricBoxes(S.DPR), kb = lb && lb.union; // remember the lyric band for ~8 s for placement
      if (kb) { keepMem = keepMem && S.t - keepMemT < 8 ? [Math.min(keepMem[0], kb[0]), Math.min(keepMem[1], kb[1]), Math.max(keepMem[2], kb[2]), Math.max(keepMem[3], kb[3])] : kb; keepMemT = S.t; }
      else if (!keepMem) keepMem = [S.W*0.08, S.H*0.62, S.W*0.92, S.H*0.95];   // default: bottom band until text shows
      this._kb = kb; this._kboxes = lb ? lb.boxes : [];
      if (active && on) {
        const want = cfg.count ?? 1, n = alive().length;
        if (g === 'section' || g === 'flicker' || g === 'orbit') { if (n < Math.min(want, maxN(S))) spawn(S); }
        if (g === 'section') for (const p of alive()) p.rT = r0 + (r1 - r0)*S.sectionT;
        if (g === 'kick') {
          if (n < 1) spawn(S);
          for (const p of alive()) { if (S.kick) p.rT = Math.min(r1, p.rT + (cfg.dr ?? 0.012)); p.rT = Math.max(r0, p.rT - dt*0.004); }
          if (S.kick && alive().every(p => p.rT >= r1*0.85)) { const par = alive()[Math.floor(R()*alive().length)]; spawn(S, { near: par }); }
        }
        if (g === 'line') {
          const ls = S.timing && S.timing.lines ? S.timing.lines.filter(l => l.section === secName) : [];
          if (ls.length) { for (const l of ls) if (l.start > lastT && l.start <= S.t + 1e-3) spawn(S, { r: r1 }); if (!n && ls[0].start <= S.t && S.t - ls[0].start < 1) spawn(S, { r: r1 }); }
          else if (Math.floor(S.sectionT*(cfg.max ?? 4)) >= n && S.sectionT < 0.98) spawn(S, { r: r1 });
          for (const p of alive()) p.rT = r1;
        }
        if (g === 'multiply') {                         // stateless: count = base·2^k after the k-th doubling point (safe for seeks)
          const tAt = lyricTime(S.timing, secName, cfg.at) ?? cfg.fromS ?? Infinity, ev = cfg.every ?? 2, base = cfg.count ?? 0;
          if (!this._sched || this._sched[0] !== tAt) {     // doubling points: `at`, then every `ev` beats
            const b = S.timing && S.timing.beats, pts = [tAt];
            for (let i = 0; i < 10 && isFinite(tAt); i++) { const t0 = pts[pts.length - 1]; let nx = t0 + ev*60/(S.bpm || 120);
              if (b && b.length) { const j = b.findIndex(x => x > t0 + 0.05); if (j >= 0) nx = b[Math.min(b.length - 1, j + ev - 1)]; } pts.push(nx); }
            this._sched = pts;
          }
          const k = this._sched.filter(x => S.t >= x).length;
          const target = Math.min(maxN(S), k === 0 ? base : base ? base*2**k : 2**(k - 1));
          const par = alive(); let i = 0;
          while (alive().length < target && i < 32) { spawn(S, (par.length && cfg.spread === false) ? { near: par[i % par.length], r: r0 } : { r: r0 }); i++; }   // default: spread to empty spots
          alive().slice(target).forEach(kill);
          const fill = k ? Math.min(1, alive().length/Math.max(1, maxN(S))) : 0;
          for (const p of alive()) p.rT = r0 + (r1 - r0)*fill;
        }
        if (g === 'nest') for (const p of alive()) { if (p.child && p.parent) { p.x = p.parent.x; p.y = p.parent.y; p.rT = p.parent.r*0.5; } else p.rT = Math.min(r1, r0 + (r1 - r0)*S.sectionT); }
        if (g === 'orbit') {                            // two whirlpools: orbit, then merge on the word
          const ps = alive().slice(0, 2), [s0, s1] = secBounds(S);
          const lines = S.timing && S.timing.lines ? S.timing.lines.filter(l => l.section === secName && new RegExp(cfg.at || 'whirlpools', 'i').test(l.text)) : [];
          let sep = 1;
          for (const l of lines) {
            const tm = (S.timing.words || []).find(w => w.line === S.timing.lines.indexOf(l) && new RegExp(cfg.merge || 'flame', 'i').test(w.text));
            const tMerge = tm ? tm.start : l.end;
            if (S.t >= l.start && S.t < tMerge) sep = 1 - (S.t - l.start)/Math.max(0.5, tMerge - l.start);
            else if (S.t >= tMerge && S.t < tMerge + 6) sep = 0;
          }
          if (!this._mid) this._mid = placeNew(S, r1*1.8) || [S.W*0.2, S.H*0.3];
          const [mx, my] = this._mid, om = S.t*2*Math.PI/8, D = sep*r1*H*1.4;
          ps.forEach((p, i) => { const a = om + i*Math.PI; p.x += (mx + Math.cos(a)*D - p.x)*Math.min(1, dt*3); p.y += (my + Math.sin(a)*D*0.6 - p.y)*Math.min(1, dt*3); p.rT = sep < 0.05 ? r1*1.15 : r0 + (r1 - r0)*(1 - sep*0.5); p.fixed = true; });
          merged = sep < 0.05;
        }
        if (g === 'outro') { for (const p of alive()) { if (p.dieAt != null && S.t >= p.dieAt) kill(p); else p.rT = Math.max(r0*0.5, p.rT - dt*0.002); } }
      }
      if (g === 'demand' && on) {                       // K key / cue spawns
        while (demandQ.length) { demandQ.shift(); spawn(S, { r: r1, life: 14 }); }
        for (const p of alive()) { p.rT = r0 + (r1 - r0)*Math.min(1, (S.t - p.born)/8); if (S.t - p.born > p.life) kill(p); }
        demandLive = P.length;
      }
      // life: fade in 1.5 s / out 2 s, ease radius, slow drift away from lyrics and each other
      for (const p of P) {
        p.a = p.dying || !active ? Math.max(0, p.a - dt/2) : Math.min(1, p.a + dt/1.5);
        p.r += (p.rT - p.r)*Math.min(1, dt*1.5);
        if (!p.child && !p.fixed) {
          p.th += dt*0.15; const sp = (cfg.drift ?? 0.006)*H;
          p.x += (Math.cos(p.th + p.seed*9)*sp + p.vx*sp*0.3)*dt; p.y += (Math.sin(p.th*0.8 + p.seed*5)*sp + p.vy*sp*0.3)*dt;
          const kbm = keepMem, d = boxDist(p.x, p.y, kbm), need = Math.min(p.r, 0.15)*H*1.1;
          if (kbm && d < need) { const cx = (kbm[0] + kbm[2])/2, cy = (kbm[1] + kbm[3])/2; const ax = p.x < kbm[0] || p.x > kbm[2] ? Math.sign(p.x - cx) : 0, ay = Math.sign(p.y - cy) || -1; p.x += ax*(need - d)*Math.min(1, dt*2); p.y += (ax ? 0 : ay)*(need - d)*Math.min(1, dt*2); }
          p.x = Math.max(p.r*H*0.6, Math.min(S.W - p.r*H*0.6, p.x)); p.y = Math.max(p.r*H*0.6, Math.min(S.H - p.r*H*0.6, p.y));
        }
      }
      for (let i = P.length - 1; i >= 0; i--) if ((P[i].dying || !active) && P[i].a <= 0) P.splice(i, 1);
      if (g === 'demand') demandLive = P.length;
      lastT = S.t;
      const n = alive().length;
      if (!this._dbg) { this._dbg = {}; VizPatches.debug = VizPatches.debug.filter(d => performance.now() - d.stepAt < 500); VizPatches.debug.push(this._dbg); }
      Object.assign(this._dbg, { t: S.t, grow: g, kind: kindOf(), kb, patches: alive().map(p => ({ x: p.x, y: p.y, r: p.r*H, a: p.a })), stepAt: performance.now(), gl: G, res: cfg.res ?? 0.5, H: S.H });
      return n ? `Patches ${n} · ${g}${g === 'orbit' && merged ? ' (one flame)' : ''}${VizPatches.benchOn && VizPatches.bench != null ? ' · ' + VizPatches.bench.toFixed(1) + ' ms' : ''}` : '';
    },
    draw(ctx, S, a) {
      if (!G || !G.prog || err || (S.tune.patchesOn ?? 1) <= 0 || !P.length) return;
      const t0 = VizPatches.benchOn ? performance.now() : 0;
      const res = cfg.res ?? 0.5, w = Math.max(64, Math.round(S.W*res)), h = Math.max(36, Math.round(S.H*res));
      if (G.cv.width !== w || G.cv.height !== h) { G.cv.width = w; G.cv.height = h; }
      const { gl, U } = G; gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const g = cfg.grow || 'section', fl = g === 'flicker' ? 0.25 + 0.75*S.kickEnv : 1;
      const list = P.slice(0, MAXP), uP = new Float32Array(MAXP*4), uQ = new Float32Array(MAXP*4), uC = new Float32Array(MAXP*2);
      const [t0h, t1h] = cfg.t || [0, 0];
      list.forEach((p, i) => {
        uP.set([p.x*res, (S.H - p.y)*res, Math.max(1, p.r*S.H*res), p.a*fl], i*4);
        uQ.set([p.zoom*(1 + 0.04*S.kickEnv), p.ox, p.oy, t0h + (t1h - t0h)*clamp01(S.sectionT) + 0.05*Math.sin(p.th)], i*4);
        let c;
        if (Array.isArray(cfg.c)) c = [cfg.c[0] + 0.015*Math.cos(p.th*1.3), cfg.c[1] + 0.015*Math.sin(p.th)];
        else { const Rr = cfg.c === 'dust' ? 0.98 + 0.06*Math.sin(S.t*0.7 + p.seed*6) : 0.7885 + 0.012*Math.sin(S.t*0.4 + p.seed*6), th = p.th*0.6 + p.seed*6.283 + S.t*0.03; c = [Rr*Math.cos(th), Rr*Math.sin(th)]; }
        uC.set(c, i*2);
      });
      gl.uniform1f(U.uEdge, cfg.edge ?? 0.25); gl.uniform1f(U.uN, list.length); gl.uniform4fv(U.uP, uP); gl.uniform4fv(U.uQ, uQ); gl.uniform2fv(U.uCC, uC);
      const m = 0.02*S.H, kk = new Float32Array(8);   // mask each live lyric line's text box (+ margin) in GL px
      (this._kboxes || []).forEach((b, i) => kk.set([(b[0] - m)*res, (S.H - b[3] - m)*res, (b[2] + m)*res, (S.H - b[1] + m)*res], i*4));
      gl.uniform4fv(U.uKeep, kk); gl.uniform1f(U.uFeather, 0.05*S.H*res);
      gl.uniform1f(U.uKick, S.kickEnv); gl.uniform1f(U.uIter, cfg.iter ?? (kindOf() === 'halley' ? 30 : 90));
      gl.uniform1f(U.uCmode, (cfg.colors || 'basins') === 'basins' ? 2 : 0);
      const pl = S.palette, hs = S.hueShift || 0;
      gl.uniform3fv(U.uPal0, hsl(pl.flame + hs, 0.95, 0.55)); gl.uniform3fv(U.uPal1, hsl(pl.flame + 20 + hs, 0.95, 0.58)); gl.uniform3fv(U.uPal2, hsl(pl.digital + hs, 0.85, 0.5));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (VizPatches.benchOn) { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); VizPatches.bench = performance.now() - t0; }   // readPixels forces the GPU to finish (gl.finish may not block)
      ctx.globalAlpha = Math.min(1, a*(S.tune.patches ?? 1)); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(G.cv, 0, 0, S.W, S.H);
    },
  };
}
VizForms.register('fractalPatches', patchesFactory);
})();
