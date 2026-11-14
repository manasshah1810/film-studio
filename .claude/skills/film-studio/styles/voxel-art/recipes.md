# voxel-art recipes

Remotion 4, `@remotion/three` and three. Numbers come from `design-system.json` (`voxel`, `hero`, `motion`, `tokens`).
The working specimen is `components/styles/voxel-art/Preview.tsx`. 30 fps, 1080 x 1920.

## 1. True isometric orthographic camera
```tsx
<ThreeCanvas width={1080} height={1920} orthographic flat linear gl={{antialias: true, alpha: true}}
  camera={{position: [20, 20, 20], zoom: 78, near: 0.1, far: 100}}>
```
- The canvas creates the camera looking at the origin, which gives the true isometric pitch 35.264 and yaw 45.
- `alpha: true` lets the DOM sky (`bg`, or `highlight` on an impact frame) and the SVG rays show through.
- `flat linear` turns off tone mapping and sRGB conversion, so a palette hex reaches the pixel unchanged.
- Zoom 78 means 1 world unit is 78 px. World origin projects to (540, 960).

## 2. World to pixel (for DOM labels and leaders)
```ts
// screen right = (1, 0, -1) / sqrt 2, screen up = (-1, 2, -1) / sqrt 6
const toPx = (p: V3) => ({x: 540 + (78 * (p[0] - p[2])) / Math.SQRT2,
                          y: 960 - (78 * (-p[0] + 2 * p[1] - p[2])) / Math.sqrt(6)});
```
Add the island bob to `p[1]` before projecting, so a leader follows the hero.

## 3. InstancedMesh: one draw call per material
```ts
const GEO = new THREE.BoxGeometry(1, 1, 1);
const inst = (items: {p: V3; s: V3; color: THREE.Color}[], mat: THREE.Material) => {
  const m = new THREE.InstancedMesh(GEO, mat, items.length);
  m.frustumCulled = false;                              // instances move outside the base bounds
  items.forEach((it, i) => {
    m.setMatrixAt(i, tmpM.compose(new THREE.Vector3(...it.p), tmpQ, new THREE.Vector3(...it.s)));
    m.setColorAt(i, it.color);                          // palette colour times baked shade factor
  });
  return m;
};
const col = (hex: string, k = 1) => new THREE.Color().setRGB(r(hex) * k, g(hex) * k, b(hex) * k, THREE.LinearSRGBColorSpace);
```
- Build all meshes once in `useMemo` keyed on the palette. Per frame only `setMatrixAt` and
  `instanceMatrix.needsUpdate = true`.
- A cell's centre is `(x - S / 2 + 0.5, y + 0.5, z - S / 2 + 0.5)` for an island of size `S`.

## 4. Isometric cube-face 3-shade lighting (no lights)
```glsl
// vertex: world normal including the instance matrix
mat4 m = modelMatrix;
#ifdef USE_INSTANCING
m = modelMatrix * instanceMatrix;
#endif
vN = normalize(mat3(m) * normal);
#ifdef USE_INSTANCING_COLOR
vC = instanceColor;
#endif
// fragment: uShade = (top 1, left 0.8, right 0.62, bottom 0.5), uLeftDir = normalize(-1, 0, 1)
float s = n.y > 0.5 ? uShade.x : (n.y < -0.5 ? uShade.w : (dot(n, uLeftDir) > 0.0 ? uShade.y : uShade.z));
gl_FragColor = vec4(uSil > 0.5 ? uSilCol : vC * s, 1.0);
```
- The camera sees +y (top), +x and +z. `(-1, 0, 1)` points to screen left, so the +z face is the left face and +x
  the right. Faces facing away are hidden at rest and only show in a flip.
- Because the shade comes from the world normal, a rotated cube (the flip) shades correctly on every frame.
- `uSil` and `uSilCol` drive the ImpactFrame: two materials, the world's set to `ink`, the hero's to `surface`.

## 5. Stepped ambient shadow, cast march and grain (baked once)
```ts
const solid = (x, y, z) => { const c = map.get(key(x, y, z)); return !!c && !c.cloud; };
for (const c of cells) {
  const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => solid(c.x + dx, c.y + 1, c.z + dz)).length;
  c.k *= AO[Math.min(3, n)];                                  // [1, 0.9, 0.82, 0.76]
  if (c.y < 0) c.k *= DEPTH[Math.min(3, -c.y - 1)];           // [1, 0.88, 0.78, 0.7]
  if (!solid(c.x, c.y + 1, c.z))                               // open top: march toward the light
    for (let s = 1; s <= 6; s++) if (solid(c.x - s, c.y + s, c.z + s)) { c.k *= 0.8; break; }
  c.k *= GRAIN[Math.floor(rnd() * 3)];                         // [0.96, 1, 1.04], seeded
}
```
Clouds are excluded from `solid`, so they never shade the ground.

## 6. GravityDrop block assembly
```ts
// order: lowest layer first, centre out, seeded jitter; starts spread over [2, 42]
const r = (c.y + 10) * 100 + Math.hypot(cx, cz) * 6 + rnd() * 10;
order.forEach((c, i) => (c.start = Math.round(2 + (40 * i) / (order.length - 1))));
// per frame
if (f < start) scale = 0;
else if (f < start + 8) { const t = (f - start) / 8; y = y0 + 6 * (1 - t * t); }   // constant acceleration
else if (f < start + 10) { y = y0 - (1 - 0.78) / 2; scale = [1.1, 0.78, 1.1]; }  // 2 frame squash, base on grid
else y = y0;
```

## 7. Stepped spring bounce
```ts
const stepSp = (f: number, start: number, cfg: SpringCfg) => {
  if (f < start) return 0;
  const g = Math.floor((f - start) / 2) * 2;                 // sample on twos
  const v = spring({frame: g, fps: 30, config: cfg});
  return Math.round(v / 0.125) * 0.125;                      // snap to 1/8
};
squash = (1 - stepSp(f, land, bounce)) * 0.3;               // scaleY = 1 - squash, scaleXZ = 1 + 0.6 * squash
```

## 8. Hero rig and the 3D axis flip
```ts
// root (feet on the grid) -> squash (scales about the feet) -> flip (at the body centre) -> body -> parts
flip.position.y = HERO_CENTRE; body.position.y = -HERO_CENTRE;   // pivot at the centre, not the feet
// hop: parabola, turn on the flip easing
const t = (f - HOP) / 16;
root.position.y = base + 2.5 * 4 * t * (1 - t);
flip.rotation.x = -rad(360 * ease('flip')(t));
```
- Each part (legs, torso, arms, head) is its own InstancedMesh of 0.25 cubes inside a group at its pivot, so the arm
  waves about the shoulder and the head tilts about the neck.
- Face plates are thin boxes 0.16 cell deep, 0.08 cell in front of the face.

## 9. ImpactFrame
```ts
const d = f - LAND;                     // per landing
if (d === 0) { mat.uSil = 1; heroMat.uSil = 1; sky = c.highlight; }    // silhouettes
if (d >= 0 && d < 2) drawRays(14, feetPx, c.surface, c.ink);           // SVG behind the canvas
shakeX = [10, -8, 5, 0][d] ?? 0;        // on the canvas wrapper only, never on text
```

## 10. Hero shadow patch
An opaque, 0.04 thick instance at the ground top in `primary * 0.8`. Size `(2k, 0.04, 1.25k)` with `k` stepping
1, 0.75, 0.5 as the hero rises past 0.5 and 3 units; offset away from the light by `0.25 + min(1, round(h) / 4)`.

## 11. Island float
```ts
const g = Math.floor(f / 2) * 2;
world.position.y = Math.round(0.12 * Math.sin((2 * Math.PI * g) / 72) * 32) / 32;   // on twos, 1/32 steps
```

## 12. Determinism
- One `mulberry32(fnv1a('voxel-art-21'))` for the world and one for the hero, both at module load.
- No `Math.random` and no time source. Every motion is a function of the frame.
- Render stills with `--gl=angle` on Windows.
