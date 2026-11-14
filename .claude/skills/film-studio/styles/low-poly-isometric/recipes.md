# low-poly-isometric recipes

Remotion 4 with `@remotion/three` 4.0.543, `@react-three/fiber` 9 and `three` 0.187. Numbers come from
`design-system.json` (`iso`, `motion`, `tokens`). The working specimen is
`components/styles/low-poly-isometric/Preview.tsx`. 30 fps, 1080 x 1920.

## 1. OrthographicCamera at 35.264 degree pitch and 45 degree yaw
A camera on the (1, 1, 1) diagonal is true isometric: yaw 45 degrees, pitch `atan(1 / sqrt 2)` = 35.264 degrees.
```tsx
import {ThreeCanvas} from '@remotion/three';
<ThreeCanvas width={1080} height={1920} orthographic flat linear legacy shadows
  camera={{position: [20, 20, 20], zoom: 100, near: 0.1, far: 100}} gl={{antialias: true, alpha: true}}>
  <Diorama />
</ThreeCanvas>
```
- `orthographic` gives an OrthographicCamera; `zoom` is pixels per world unit. fiber points it at the origin.
- `flat` turns tone mapping off and `linear` keeps colours as written, so a lit face shows the palette hex.
- Use `ThreeCanvas`, not fiber's `Canvas`: it syncs each frame with `useCurrentFrame` for rendering.
- Keep the camera fixed. Turn and scale a `<group>` instead (section 5).

**Projecting a 3D point to frame pixels** so a DOM badge can sit over a pin. With the camera fixed at
(1, 1, 1), screen right is (1, 0, -1) / sqrt 2 and screen up is (-1, 2, -1) / sqrt 6:
```ts
const project = ([x, y, z], yaw, s, cx = 540, cy = 900, Z = 100) => {
  x *= s; y *= s; z *= s;                                   // world group scale
  const xr = x * Math.cos(yaw) + z * Math.sin(yaw);         // world group yaw about y
  const zr = -x * Math.sin(yaw) + z * Math.cos(yaw);
  return {x: cx + Z * (xr - zr) / Math.SQRT2, y: cy - Z * (-xr + 2 * y - zr) / Math.sqrt(6)};
};
```
Apply the same bob and shift to the DOM that you apply to the canvas wrapper.

## 2. flatShading materials and faceted parts
```tsx
const Mat = ({c}) => <meshLambertMaterial color={c} flatShading side={THREE.DoubleSide} />;
<mesh castShadow receiveShadow><boxGeometry args={[1, 0.3, 1]} /><Mat c={ground} /></mesh>
<mesh><coneGeometry args={[0.34, 0.6, 6]} /><Mat c={foliage} /></mesh>              // tree: 6 sides
<mesh><icosahedronGeometry args={[1, 0]} /><Mat c={wall} /></mesh>                   // a faceted ball
<mesh rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.54, 0.42, 4]} /><Mat c={roof} /></mesh>  // hip roof
```
- Lambert plus `flatShading` gives one tone per facet. Keep segments low: 4 to 6 on cones and cylinders,
  detail 0 on icosahedrons and octahedrons.
- A gable or sawtooth roof is a prism: 6 triangles from a `BufferGeometry`, apex at `x = ax`
  (`ax = -w / 2` makes a sawtooth). Call `computeVertexNormals()`; flat shading takes the facet normal anyway.
- The rock: `new THREE.ConeGeometry(half * sqrt 2, depth, 4, 3)`, rotated `[PI, PI / 4, 0]`, with its middle
  rings pushed by seeded noise (`Math.sin` hash, never `Math.random()`), so every render is the same.
- On a dark `bg`, lift the earth and rock (`mix(ground, white, 0.2)`); faces that point down only get ambient.

## 3. Key and rim directional lighting
```tsx
<ambientLight intensity={0.9} />
<directionalLight position={[5, 20, 11]} intensity={2.2} color="keyTint" castShadow
  shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}>
  <orthographicCamera attach="shadow-camera" args={[-9, 9, 9, -9, 1, 60]} />
</directionalLight>
<directionalLight position={[-14, 9, -12]} intensity={1.1} color="rimTint" />
```
- The key is the direction (0.25, 1, 0.55) times 20: from above, a little left and in front. Tops get the
  most light, left faces (+z) less, right faces (+x) least. The rim from behind adds a cool edge.
- Tints come from `iso.lights.*.tint` in the JSON, never a hex typed into the component.
- Only the key casts shadows. Fit its shadow camera to the island (bounds 9) or the shadows go soft and blocky.
- `castShadow` and `receiveShadow` on every mesh; the pins and the actor cast only.

## 4. Spring tile pop-up
```tsx
const k = f < 8 + (i + j) * 2 ? 0 : spring({frame: f - 8 - (i + j) * 2, fps: 30, config: {damping: 11, stiffness: 170, mass: 0.7}});
<group position={[x, (1 - k) * -1.2, z]} scale={Math.max(0.0001, k)} visible={k > 0.001}>{tile}</group>
```
`i + j` is the distance from the back corner, so the wave rolls toward the viewer. Never scale to exactly 0:
three warns about a zero matrix. Buildings use the same wrapper with the origin at their base.

## 5. Slow turntable drift and elastic pull-back zoom
```tsx
const yaw = -5 * Math.cos(Math.PI * f / 180) * Math.PI / 180;                       // -5 to +5 degrees
const pull = f < 62 ? 0 : spring({frame: f - 62, fps: 30, config: {damping: 9, stiffness: 60, mass: 1}});
const scale = 1.55 + (1 - 1.55) * pull;                                              // overshoots once
<group rotation={[0, yaw, 0]} scale={scale}>...</group>
```
Move the canvas wrapper down by `(scale - 1) * 260` px while zoomed so the close-up frames the build, not the rock.
Hide the blob shadow while zoomed in. Use the same `yaw` and `scale` in `project()`.

## 6. 3D callout pin with a DOM badge
```tsx
<group position={[x, y + (1 - k) * 3, z]}>                       // falls 3 units on spring 8/160/0.8
  <cylinder base ring r 0.13 in primary />  <stem r 0.03, 0.9 tall, dark />
  <collar r 0.36, 0.08 tall, surface />                          // separates the head from a red roof
  <octahedron r 0.3, scale y 1.25, primary, rotation y = f * 2.4 deg />
</group>
```
The badge is a 64 px DOM circle 78 px above `project(head)`, with a 4 px `ink` leader down to the head.
The plate in the row at y 69 percent carries the same number, so the eye links plate, badge and pin.
