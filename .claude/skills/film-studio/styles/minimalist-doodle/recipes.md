# minimalist-doodle recipes

Remotion 4 and inline SVG. Numbers come from `design-system.json` (`doodle`, `host`, `motion`, `tokens`).
The working specimen is `components/styles/minimalist-doodle/Preview.tsx`. 30 fps, 1080 x 1920.

## 1. One real-pixel canvas
```tsx
<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
```
- The viewBox equals the frame, so stroke widths and lengths are real pixels and `pathLength` stays exact.
- Never `vector-effect="non-scaling-stroke"` on a draw-on path: it breaks `pathLength` and the stroke shows at t 0.
- Layers: board svg (static), ink svg (boils), then DOM text (never boils).

## 2. stroke-dashoffset progressive tracing
```tsx
const dr = (f, s, n) => interpolate(f, [s, s + n], [0, 1], {...clamp, easing: Easing.bezier(0.45, 0, 0.55, 1)});
const Ink = ({d, t, color, w = 7}) => t <= 0 ? null : (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
    {...(t < 1 ? {pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - t} : {})} />);
```
- `pathLength = 1` normalises any path, so `1 - t` is the share still hidden.
- Render nothing at t 0: a round cap on a zero-length dash leaves a dot.
- Drop the dash props at t 1, so a closed path has no hairline seam.
- Duration: `clamp(round(length / 45), 4, 16)` frames. Pen order: each stroke starts 2 frames before the last ends.
- A fill follows its outline: skin pops when the outline closes; a spot fill starts as the outline ends.

## 3. Subtle 2-frame feTurbulence line boil
```tsx
const seed = [3, 11, 23][Math.floor(f / 2) % 3];          // held 2 frames, 3 drawings
<filter id={`${uid}-boil`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency={0.018} numOctaves={2} seed={seed} result="n" />
  <feDisplacementMap in="SourceGraphic" in2="n" scale={3.5} xChannelSelector="R" yChannelSelector="G" />
</filter>
<g filter={`url(#${uid}-boil)`}>{/* every ink line, card, fill and markup */}</g>
```
- Displacement is `scale * (channel - 0.5)`, so 3.5 moves a pixel at most 1.75 px. Above 5 lines tear.
- Low frequency (0.018) bends a whole stroke gently; high frequency makes lines furry.
- Only the seed changes; frequency and scale never animate. The same frame always gives the same pixels.
- `colorInterpolationFilters="sRGB"` keeps palette hexes exact through the filter.
- Ids carry `useId()`, so the 3 beats of a sheet do not share one filter (and one seed).

## 4. The warm textured board
```tsx
const flat = (hex, alphaRow) => `0 0 0 0 r 0 0 0 0 g 0 0 0 0 b ${alphaRow}`;   // r, g, b of hex in 0..1
<feTurbulence type="fractalNoise" baseFrequency={0.8} numOctaves={3} seed={5} />
<feColorMatrix type="matrix" values={flat(ink, '2.4 0 0 0 -0.95')} />        // rect opacity 0.16
<feTurbulence type="fractalNoise" baseFrequency="0.012 0.9" numOctaves={2} seed={9} />   // fibres, opacity 0.08
```
A radial gradient from `ink` at 0 to `ink` at 0.07 past 60 percent makes the vignette. The board has fixed seeds.

## 5. Spot colour marker fill
```ts
const scribble = (b, angle, pitch, phase = 0) => {           // back-and-forth rows covering the box
  const R = Math.hypot(b.w, b.h) / 2 + pitch, ux = cos(angle), uy = sin(angle);
  for (let v = -R + phase, i = 0; v <= R; v += pitch, i++) { const u0 = i % 2 ? R : -R;
    pts.push([cx + u0 * ux - v * uy, cy + u0 * uy + v * ux], [cx - u0 * ux - v * uy, cy - u0 * uy + v * ux]); }
};
```
```tsx
<g transform="translate(7 5)" clipPath={`url(#${id})`}>       {/* misregistration moves fill and clip together */}
  <clipPath id={id}><path d={shape} /></clipPath>
  <Ink d={scribble(box, -35, 30)} t={t} color={primary} w={42} />
  <Ink d={scribble(box, -35, 30, 15)} t={t} color={mix(primary, ink, 0.2)} w={5} />   {/* streaks */}
</g>
```
Hair uses the same fill in `hair`, pitch 22, width 38, no offset and no streaks.

## 6. Hand-drawn loops: cards, ellipses, check boxes
```ts
// superellipse: n 2 = ellipse, n 8 = rounded box. The wobble depends only on the angle.
w(a) = wob * (0.6 sin(3a + p0) + 0.3 sin(5a + p1) + 0.1 sin(9a + p2));
x = cx + (rx * g + w) * sign(cos a) * |cos a| ^ (2 / n);   g = 1 + grow * i / K
```
- Phases come from `mulberry32(fnv1a(seed))`, so a shape is the same every frame. The boil adds the life.
- Fill with `turn: 1`; outline with `turn: 1.05` (cards) or `1.15` and `grow: 0.06` (markup) for the overshoot.
- Points go through Catmull-Rom into cubic Beziers, so there are no corners.

## 7. Arrows
`M a Q c b` for the body, then a two-stroke head: rotate the unit vector `b - c` by 180 plus and minus 28 degrees,
26 px long. The head draws in 4 frames, starting 1 frame before the body ends.

## 8. The layered host
```tsx
<g transform={`translate(215 ${1600 + bob + hop})`}>       // neck base
  {/* sweater fill, sweater line, neck, then the head group */}
  <g transform={`rotate(${tilt} 0 -96)`}>{/* bun, back lock, head, ear, hair, brows, eyes, nose, mouth */}</g>
  <g transform={`translate(124 26) rotate(${a})`}>            // shoulder
    {/* upper arm */}<g transform={`translate(140 0) rotate(${b})`}>{/* forearm, hand x 1.4 */}</g>
  </g>
</g>
```
- `a, b = rest + (point - rest) * spring(on2(f - 128), point)` with rest (78, 8) and point (-54, -22).
- Eyes: ink ellipse 10 x 15 times `eyeK` (blink 0.13, react 1.35) with a 3.5 px `surface` catch-light.
- Right brow: `translate(0 -9) rotate(-8)` about its centre. React lifts both brows 12 px.

## 9. SketchWords
```tsx
const p = interpolate(on2(f), [s, s + 8], [0, 1], {...clamp, easing: settle}) * 112;
<span style={{display: 'inline-block', clipPath: `polygon(0 -20%, ${p}% -20%, ${p - 12}% 120%, 0 120%)`,
  transform: `translateY(${dy}px) rotate(${rot}deg)`}}>{word}</span>
```

## 10. LiveMarkup and RunningList
- Highlighter: one 64 px round-cap stroke in `highlight` inside the card, under the label, 8 frames.
- Ellipse: the loop of section 6 around the card plus 34 px, `primary` 10 px, 14 frames, after the swipe.
- List row: check box pops on the pop spring, outline 5 frames, tick `M -12 -2 L -2 10 L 22 -22` in `primary`
  4 frames later, words wipe 2 frames after the tick starts. Rows 8 frames apart.

## 11. Determinism
- Seeds are strings (`fnv1a` into `mulberry32`) evaluated in render, never `Math.random`, never time.
- Render stills with `--gl=angle` on Windows, like the other styles.
