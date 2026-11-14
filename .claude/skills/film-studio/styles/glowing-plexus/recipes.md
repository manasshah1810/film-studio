# glowing-plexus recipes

Remotion 4, plain React and a 2D canvas. Numbers come from `design-system.json` (`plexus`, `motion`, `tokens`). The
working specimen is `components/styles/glowing-plexus/Preview.tsx`. 30 fps, 1080 x 1920.

## 1. Seeded, deterministic node placement (zero flicker)
```ts
const fnv1a = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry32 = (seed: number) => { let a = seed | 0; return () => {
  a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const rnd = mulberry32(fnv1a('glowing-plexus-20'));               // ONE generator, built once at module load
const gauss = () => clampTo2_2(Math.sqrt(-2 * Math.log(Math.max(1e-6, rnd()))) * Math.cos(2 * Math.PI * rnd()));
for (const hub of HUBS) for (let i = 0; i < 36; i++) place(() => hub.map((v) => v + gauss() * 0.55));
for (let i = 0; i < 60; i++) place(() => [range(fx), range(fy), range(fz)]);
// place(): up to 40 tries for a point at least 0.2 from every placed node; else skip it
nodes.forEach((n) => { n.ph = [rnd() * TAU, rnd() * TAU, rnd() * TAU]; n.per = range([90, 150]); n.delay = rnd() * 14; });
export const NET = buildNet();                                    // module constant: every frame reads it, none writes it
```
- The rule: random numbers are drawn **only at build time**, in a fixed order, from one seeded generator. A frame is a
  pure function `draw(NET, frame)`. Never call `Math.random`, and never call `rnd()` inside `draw`.
- Everything that moves is a closed form of the frame: `bob = 0.05 * sin(2 * PI * f / per + ph)`, `camZ = 10 - 0.008 * f`.
- Rejection sampling is deterministic too: the tries consume the generator in the same order every build.
- Proof: render the same frame twice; the PNGs must match byte for byte.

## 2. Links and hub weighting
```ts
for (a < b) { const d = dist3(p[a], p[b]); const lim = 0.75 * Math.max(reach(a), reach(b));   // reach 1.6 for hubs, else 1
  if (d < lim) edges.push({a, b, lim}); }
const w = deg.map((d) => (d / maxDeg) ** 0.8);                     // hub weighting
const r = (isHub ? 11 * zoom : 2.2 + 5.5 * w) * (s / S0);          // core px, scaled by perspective
// each frame, from the live (bobbing) positions:
let a = 0.5 * (1 - d / lim) ** 1.6;                                // 0 exactly at the limit: no popping
if (crossed) a = Math.min(1, a * 2 + 0.14);
a *= fog(depth) * min(introA, introB) / (1 + coc * 0.15);
line(A, B, 5 * sm + coc, col, a * 0.18); line(A, B, 1.4 * sm + coc * 0.3, col, a);   // halo, then core
```
Topology is fixed at build time; only alpha follows the live distance. A link can fade to nothing as two nodes bob
apart and come back as they return, but it never appears or vanishes at full strength.

## 3. Projection, drift and additive light
```ts
const FOCAL = 960 / Math.tan(rad(40 / 2)), S0 = FOCAL / 10;
const proj = (p, camZ) => { const d = camZ - p[2], s = FOCAL / d; return {x: 540 + p[0] * s, y: 960 - p[1] * s, s, d}; };
ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
ctx.globalCompositeOperation = 'lighter';                          // additive: overlaps add light
```
Draw order: dust, link halos and cores, bridges, packets, node halos and cores, orbit rings. Paint the canvas in
`useLayoutEffect` keyed on the frame, so the still is complete before Remotion takes it. Each canvas is its own
instance, so sheet frames never share state.

## 4. Pulse packet propagation
```ts
t[hub] = fire[hub];                                               // 30, 70, 110
// Dijkstra inside the hub's cluster: cost of a link = 8 * d / 0.75 + 2 frames
run([hub], (j) => cluster[j] === hub && !isHub[j]);              // sets t[j], parent[j], hop[j]
run(allReached, (j) => leftOver.has(j));                          // then spill to anything still unreached
// each frame, for every node v with a parent u:
const u = (f - t[parent]) / (t[v] - t[parent]);                   // 0 to 1 along the link
head = clamp01(u); tail = clamp01(u - 0.35);                      // tail as a fraction of the link
stroke(lerp(A, B, tail) -> lerp(A, B, head), linear fade transparent -> highlight); if (u <= 1) glow + dot at head;
const flash = f >= t[v] ? Math.exp(-(f - t[v]) / 6) : 0;          // node colour mixes toward highlight
```
- A packet always rides a real link, from a node that is already lit. The tree is computed once, so the path is the same
  every render.
- Bridges: depart at 46 and 86, take 24 frames, so they land exactly on the next fire. Dashes flow with
  `lineDashOffset = -1.2 * f` until the packet lands, then the line goes solid.

## 5. Elastic hub zoom and OrbitRing
```ts
const zoom = 1 + 0.6 * spring({frame: f - fire, fps: 30, config: {damping: 6, stiffness: 170, mass: 0.6}});
const R = 3.2 * 11 * zoom * (s / S0), ry = R * 0.42;
ctx.ellipse(x, y, R, ry, 0, 0, TAU);                              // ring at 0.6 of the ring alpha
for (k < 12) dot(x + R * cos(rad(k * 30 + (f - fire) * 2)), y + ry * sin(...), 2.4);
rider at angle (f - fire) * 6 in highlight;  alpha 0.85 for the latest hub, 0.3 for older ones
```
Damping 6 gives one clear overshoot and a settle by about 20 frames: elastic, not wobbly.

## 6. RackFocus
```ts
const focus = mix(depth(hub0), mix(depth(hub1), depth(hub2), k2), k1);   // k1, k2: 14 frame eases at 70 and 110
const coc = Math.abs(depth - focus) * 6;                                   // px of blur per unit of depth
const rr = r + coc, keep = Math.max(0.15, (r / rr) ** 2);                  // bigger disc, same total light
```

## 7. Plates over glowing links
```tsx
<div style={{background: surface, border: `2px solid ${primary}`, borderRadius: 10,
  boxShadow: `0 0 28px 14px rgba(bg, 0.9)`}}>                     // the scrim knocks the links back
```
The leader starts at the plate edge nearest the hub and stops at the orbit ring radius, recomputed each frame from
the same `proj` the canvas uses.
