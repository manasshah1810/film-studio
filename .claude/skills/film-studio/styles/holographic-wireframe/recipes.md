# holographic-wireframe recipes

Remotion 4 with `@remotion/three` 4.0.543, `@react-three/fiber` 9 and `three` 0.187. Numbers come from
`design-system.json` (`holo`, `motion`, `tokens`). The working specimen is
`components/styles/holographic-wireframe/Preview.tsx`. 30 fps, 1080 x 1920.

## 1. Canvas and colours
```tsx
<ThreeCanvas width={1080} height={1920} flat linear gl={{antialias: true}}
  camera={{fov: 30, position: [0, 2.6, 11], near: 0.1, far: 60}}>
  <color attach="background" args={[col(bg)]} />
  <primitive object={hologram} />
</ThreeCanvas>
const col = (h) => new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.LinearSRGBColorSpace);
```
- `flat` turns tone mapping off, `linear` turns colour conversion off, and `col()` keeps the hex bytes, so an
  edge at full strength is exactly the palette hex.
- The background is `bg` inside the canvas. Additive light then adds onto the sky colour, not onto
  transparent black.
- Build the scene graph once per palette in `useMemo` and mutate positions and uniforms each frame. Each
  Preview instance owns its own materials and clipping planes, so frames on a sheet never share state.

## 2. EdgesGeometry into fat lines
```ts
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
const edges = new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo, 15));
const lineMat = (hex, px, opacity, planes = []) => {
  const m = new LineMaterial({color: col(hex).getHex(THREE.LinearSRGBColorSpace), linewidth: px, transparent: true,
    opacity, depthWrite: false, blending: THREE.AdditiveBlending, clippingPlanes: planes});
  m.resolution.set(1080, 1920);                    // linewidth is in these pixels
  return m;
};
part.add(new THREE.Mesh(geo, faceMat), new LineSegments2(edges, lineMat(primary, 2.2, 1)),
         new LineSegments2(edges, lineMat(primary, 9, 0.16)), new LineSegments2(edges, scanMat));
```
- `EdgesGeometry(geo, 15)` keeps an edge only where the faces meet at more than 15 degrees. A 28 segment
  cylinder (12.9 degrees a step) keeps only its end rings; a box keeps all 12 edges.
- Toothed or holed flat profiles: skip `EdgesGeometry` and draw the outline wire, `shape.getPoints(8)` and each
  hole's points as loops at y 0 and y depth. Shape `(x, y)` maps to `(x, y_level, -y)` after `rotateX(-PI / 2)`.
- `LineMaterial` supports clipping planes, which the scan copy needs.

## 3. Additive fresnel faces
```glsl
// vertex: vY = (modelMatrix * vec4(position, 1.0)).y; vN = normalMatrix * normal; vV = -mvPosition.xyz;
float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
float d = vY - uScanY;
float band = 1.0 - smoothstep(0.0, 0.07, abs(d));
float trail = d > 0.0 ? exp(-d / 0.35) : 0.0;
gl_FragColor = vec4(uColor * (0.05 + 0.32 * fr) + uScan * uOn * (band * 0.3 + trail * 0.12), 1.0);
```
`ShaderMaterial` with `transparent`, `depthWrite: false`, `blending: AdditiveBlending`, `side: DoubleSide` and
`clipping: true`, plus `#include <clipping_planes_*>` in both shaders. The face is clear where it looks at you
and bright where it turns away: that is the glass.

## 4. Scanline sweep math
```ts
const yTop = centreY + half * S + 0.15, yBot = centreY - half * S - 0.15;   // world y bounds of the object
const t = (f - start) / 36;                                                  // one sweep, 0 to 1
const ys = yTop + (yBot - yTop) * ease('sweep')(t);                          // bezier 0.45, 0, 0.55, 1
reveal.constant = f < 12 ? -(yTop + 1) : firstSweep ? -ys : 100;             // Plane(0, 1, 0): keep y >= ys
lo.constant = -(ys - 0.07); hi.constant = ys + 0.07;                         // Plane(0, 1, 0) and (0, -1, 0)
```
- A `THREE.Plane` clips where `normal . p + constant < 0`. `(0, 1, 0)` with `-ys` keeps everything above the band.
- Faces and the core and halo edges carry `[reveal]`. The scan copy carries `[reveal, lo, hi]`, so it exists
  only inside the band. Set `scanMat.visible = false` between sweeps.
- The planes are in world space, so the band stays level while the object turns and tilts.
- 4 corner marks (half size 1.6, arm 0.35) at `ys` show the scan plane. A full square reads as a floor tile.

## 5. Projecting a 3D anchor for a DOM leader
```ts
const cam = new THREE.PerspectiveCamera(30, 1080 / 1920, 0.1, 60);
cam.position.set(0, 2.6, 11); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
const v = new THREE.Vector3(x, y + layer * gap * e - centre, z).multiplyScalar(S)
  .applyEuler(new THREE.Euler(tilt, yaw, 0));                 // same order as group.rotation
v.x += shiftX; v.y += centreY; v.project(cam);
const px = {x: (v.x + 1) / 2 * 1080, y: (1 - v.y) / 2 * 1920};
```
fiber points the canvas camera at the origin, so this camera matches it exactly. The leader is an SVG
polyline: tag edge, 40 px out, then `px`; it draws with `pathLength={1}` and `strokeDashoffset={1 - k}`.

## 6. RGB chromatic glitch
```tsx
<filter id="rgb" colorInterpolationFilters="sRGB" x="-5%" y="-5%" width="110%" height="110%">
  <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
  <feOffset in="r" dx={-d} result="ro" />
  <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g" />
  <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b" />
  <feOffset in="b" dx={d} result="bo" />
  <feBlend in="ro" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="bo" mode="screen" />
</filter>
<div style={{filter: 'url(#rgb)', transform: `translateX(${d / 2}px)`}}><ThreeCanvas ... /></div>
```
`d = 10 * (f % 2 ? 1 : -1)` for 4 frames at 58 and 150. It is channel maths, so no palette colour is needed.
Give the filter a unique id per instance. Apply it to the canvas and the title, never to tags or readouts.

## 7. LayerExplode
```ts
const e = f < 62 ? 0 : spring({frame: f - 62, fps: 30, config: {damping: 14, stiffness: 70, mass: 1}});
layers.forEach((g, i) => (g.position.y = i * 0.5 * e));      // motor -1, housing 0, board 1, gears 2, cap 3, horn 4
root.scale.setScalar(0.88 + (0.58 - 0.88) * e); root.position.x = 0.6 * e;
inner.position.y = -(bottom + top) / 2;                        // keeps the stack centred as it grows
```
