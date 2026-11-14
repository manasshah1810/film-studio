# tactical-vector-maps recipes

Remotion 4 and SVG. Numbers come from `design-system.json` (`tokens`, `motion`). The working
specimen is `components/styles/tactical-vector-maps/Preview.tsx`. Frames are at 30 fps on 1080 x 1920.

## 1. One camera, one projection
```tsx
const K = 0.8;                                  // authoring 1000 x 800 to view pixels at zoom 1
const proj = (a: P): P => ({x: VC.x + (a.x - cam.c.x) * K * cam.s, y: VC.y + (a.y - cam.c.y) * K * cam.s});
```
`cam` is `{c, s}`: a centre in authoring coordinates and a zoom. Project every point each frame
(landmasses, routes, beacons, grid) instead of scaling a group. Strokes stay a fixed pixel width, dashes
keep their length, and the rulers stay true. Pins and labels are HTML placed at `proj(point)`.

## 2. Landmass elevation layers
```tsx
const d = closedSpline(points.map(proj));       // closed Catmull-Rom as a cubic Bezier path
<path d={d} transform={`translate(0 ${14 * cam.s})`} fill={shadow} />                 // drop shadow
<path d={d} fill="none" stroke={shelf} strokeWidth={2 * 24 * cam.s} />                // tier 1 shelf
<path d={d} fill={ridge} />                                                           // tier 4 core
<g clipPath={`url(#land${uid})`}>
  <path d={d} fill="none" stroke={highland} strokeWidth={2 * 34 * cam.s} />           // tier 3 band
  <path d={d} fill="none" stroke={lowland} strokeWidth={2 * 14 * cam.s} />            // tier 2 band
</g>
<path d={d} fill="none" stroke={coast} strokeWidth={2} />
```
The `clipPath` holds the same path, so each stroke shows only its inner half. Bands are derived with
`blend(ink, surface, 0.10)` and `0.20`; a faction tint is `blend(faction, band, 0.22)`. Author each
landmass to bleed off every edge (x from -400 to 1400, y from -400 to 1200) so a zoom out never shows a seam.

## 3. Curved Bezier route spline
```tsx
const bez = (a, b, c, d, t) => { const u = 1 - t; return {x: u*u*u*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t*t*t*d.x, y: /* same for y */}; };
const ROUTE = Array.from({length: 161}, (_, k) => bez(P0, P1, P2, P3, k / 160));
```
Sample at 160 points and keep it as a polyline. The head position, the dash length and the camera all
come from the same samples. Keep 40 px or more of sea between a route and any coast it is not meant to touch.

## 4. Dashed route that traces itself
```tsx
<mask id={`m${uid}`} maskUnits="userSpaceOnUse" x={VIEW.l} y={VIEW.t} width={VIEW.w} height={VIEW.h}>
  <path d={pts(S)} fill="none" stroke="#fff" strokeWidth={16} strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
</mask>
<g mask={`url(#m${uid})`}>
  <path d={pts(S)} fill="none" stroke={primary} strokeWidth={8} strokeDasharray="30 18" strokeDashoffset={-f * 1.4} />
</g>
```
`L` is the projected length this frame. The mask reveals the route and the dashes keep marching under it.
Hide the head dot when `p` is 0 or 1. The cut part of a route is a second path, dotted `10 14`, in `alert`.

## 5. Concentric radar ping rings
```tsx
const age = f - start;
{[0, 1, 2].map((r) => { const a = age - r * 13; if (a < 0) return null; const u = (a % 40) / 40;
  const rad = lerp(14, 80, 1 - (1 - u) * (1 - u));
  return <circle cx={s.x} cy={s.y} r={rad} fill="none" stroke={col} strokeWidth={3} opacity={0.9 * (1 - u) ** 1.5} />; })}
```
Rings are drawn under the beacon dot and under every HTML pin and plate, so they never touch text.
A cut beacon has no dot: the `alert` X is the marker.

## 6. Coordinate grid overlay and rulers
```tsx
for (let k = -8; k <= 14; k++) { const x = VC.x + (k * 160 - cam.c.x) * K * cam.s; if (x > VIEW.l + 4 && x < VIEW.r - 4) vLines.push({k, x}); }
// lines: ink at 12 percent, 2 px; a 10 px cross tick at each crossing, ink at 40 percent
```
Labels sit on opaque `surface` strips (120 px left, 64 px bottom) in `muted` mono 34. Show a label only when
its line is 60 px inside the view, so a label never crosses a corner. Lon is `20 + 10k` east, lat is `60 - 10j` north.

## 7. Pins, stamp and DayDial
```tsx
// pin: a 44 px stem whose tip sits on the beacon, a 28 px badge with the number in `bg` on the beacon colour
// stamp: opaque surface plate, 4 px alert border, serif accent 56 px upper case, rotate(-8deg),
//        scale from 1.7 to 1 on the stamp spring {9, 220, 0.9}; a 4 px leader runs from its base to the pin badge
// dial: 24 ticks from r 84 to 100, event ticks from r 72, arc r 108 (strokeDasharray = circumference)
const day = 24 * clamp((f - 8) / 164);          // the day counter and the arc share one value
```
The day odometer rolls only in the last 40 percent of each day (`rollFrom` 0.6), so a still is rarely
caught between two digits. Put the sheet's last frame after the counter has stopped.

## 8. Camera pacing and elastic pull-back
```tsx
// frames 14-50 follow route 1 (centre lerps with the same bezier as the trace, zoom 2.0 to 2.1)
// frames 50-78 dwell on the strait (zoom 2.1 to 2.4); 78-92 pan back to the origin (zoom 2.4 to 1.8)
// frames 92-132 follow route 2 (centre = its head, zoom 1.8 to 1.5)
const q = spring({frame: f - 132, fps: 30, config: {damping: 8, stiffness: 70, mass: 1}});   // overshoots to about 1.18
return {c: lerpP(KEST, MAPC, q), s: 1.5 - 0.65 * q};                                          // 1.5 to 0.85, dips to 0.75
```
Because `q` overshoots, the camera pulls back past its rest and settles. That is the elastic pull-back.
