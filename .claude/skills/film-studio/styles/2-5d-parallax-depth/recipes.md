# 2-5d-parallax-depth recipes

Remotion 4, CSS 3D transforms and SVG. Numbers come from `design-system.json` (`depth_planes`, `camera`,
`tokens`, `motion`). The working specimen is `components/styles/2-5d-parallax-depth/Preview.tsx`. 30 fps, 1080 x 1920.

## 1. Perspective and scale compensation (the exact math)
One parent holds the perspective, every plane is a child:
```tsx
const P = 1400;                                   // perspective in px
<div style={{position: 'absolute', inset: 0, perspective: P, perspectiveOrigin: '50% 55%', overflow: 'hidden'}}>
  {planes.map((p) => (
    <div style={{position: 'absolute', left: 540 - 950, top: 960 - 1100, width: 1900, height: 2200,
      transform: `translate3d(${-camX}px, 0px, ${p.z + camZ}px) scale(${(P - p.z) / P})`}}>...</div>
  ))}
</div>
```
A layer at `translateZ(tz)` is drawn at `P / (P - tz)` of its size. At rest `tz = z`, so the apparent scale is
`P / (P - z)`. Multiply by `(P - z) / P` and it is exactly 1: the plane keeps the size you authored.
| Plane | z | `scale()` compensation | Apparent scale after a 220 px push |
|---|---|---|---|
| Z0 | -1400 | 2.000 | 1.085 |
| Z1 | -700 | 1.500 | 1.117 |
| Z2 | 0 | 1.000 | 1.186 |
| Z3 | 500 | 0.643 | 1.324 |
`tz` must stay below `P`. With `z = 500` and a 220 px push, `tz = 720`, so `P - tz = 680`, which is safe.

## 2. Differential parallax multipliers
Put `translateX(-camX)` on the outside of `scale()`. Then a sideways camera move shows on screen as
`camX * P / (P - tz)`, so the multiplier is a result of the perspective, not a number you type.
| Plane | At rest | After the push (tz + 220) | A 200 px pan moves it |
|---|---|---|---|
| Z0 | 0.50 | 0.54 | 100 to 108 px |
| Z1 | 0.67 | 0.74 | 134 to 149 px |
| Z2 | 1.00 | 1.19 | 200 to 237 px |
| Z3 | 1.56 | 2.06 | 313 to 412 px |
Parallax must rise from Z0 to Z3. Set the push and the pan as separate numbers: `camZ` for depth, `camX` for sideways.

## 3. Plane bleed so an edge never shows
Each plane is 1900 x 2200 centred on the frame, so it reaches x -410 to 1490. The largest sideways shift is Z3 on
the whip: 260 * 1.56 = 405 px at rest, more after the push. Z3 holds only dark shapes at the edges, so its own edge
is empty by design. Z0, Z1 and Z2 must be filled to the plane edge (sea, ground, sky run to x -410 and 1490).
Check: render the whip frame (frame 95) and look at all four edges.

## 4. Depth of field and rack focus
```tsx
const blur = (id, f) => lerp(A[id], B[id], focusW(f));          // A: {Z3: 7, Z2: 0, Z1: 2, Z0: 3}   B: {Z3: 8, Z2: 4, Z1: 0, Z0: 4}
<svg style={{filter: `blur(${blur(id, f)}px)`}} />                // on the plane's inner svg, never on a plate
const focusW = (f) => rack(f, 96, 120) - rack(f, 140, 164);       // two swaps: to Z1 then back to Z2
```
Blur goes on the inner `svg`, not on the transformed `div`. Skip the filter when blur is under 0.05 px.
A plate and its text are siblings of the 3D parent and are never filtered.

## 5. Z-push
```tsx
const camZ = 220 * Easing.bezier(0.25, 0.1, 0.25, 1)(Math.min(1, f / 180));   // forward, never linear
```
The push runs the whole film. It front-loads, so it slows toward the last beat and the hold stays calm.
Show it as a readout (`PUSH 220 PX`) on a plate so the viewer sees the camera is moving.

## 6. Directional whip pan
```tsx
const x = interpolate(f, [90, 100], [0, 260], {easing: Easing.bezier(0.7, 0, 0.2, 1), ...clamp});   // 10 frames
const settled = 260 - 60 * spring({frame: f - 100, fps: 30, config: {damping: 14, stiffness: 120, mass: 1}});
const speed = Math.abs(cx(f) - cx(f - 1));
const wb = Math.min(18, speed * 0.4) * parallax(id);              // x only blur, bigger on near planes
<filter id="whip"><feGaussianBlur stdDeviation={`${wb} 0`} /></filter>
```
Chain it with the depth blur: `filter: url(#whip) blur(3px)`. The blur follows the speed, so it is 0 when the camera rests.

## 7. The Story Actor rig
```tsx
const arm = (ox, oy, a1, a2) => {                                   // angles from straight down, positive toward +x
  const e = {x: ox + sin(a1) * 130, y: oy + cos(a1) * 130};
  const h = {x: e.x + sin(a1 + a2) * 120, y: e.y + cos(a1 + a2) * 120};  return {e, h};
};
const act = smooth((f - 138) / 26);  const react = smooth((f - 58) / 26) * (1 - act);   // state weights
const front = arm(78, -452, lerp(lerp(8, 56, react), 128, act), lerp(lerp(6, 34, react), 14, act));
```
Draw each limb as a tapered polygon between joints. Idle: sine breathing (3 px), lantern sway (5 degrees), a blink
of 6 frames every 4 s. React: features shift 14 px toward the beat, brows rise 4 px. Act: arm up, legs apart 30 px,
body leans 3 degrees. The glow radius is `110 + 150 * glowAmt` and the glow also lights the pier and the coat edge.

## 8. Atmosphere and light
```tsx
const haze = blend(primary, bg, 0.32);   const hills = blend(haze, sky, 0.5);
const mid = blend(surface, bg, 0.62);    const fore = blend('#000000', bg, 0.6);
```
Far planes are lighter and warmer; near planes are darker. The tower lamp fades in over 14 frames and its beam
crosses the actor. A radial vignette (alpha 0.5) goes above all planes and under all plates.
