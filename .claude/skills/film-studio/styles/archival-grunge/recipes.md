# archival-grunge recipes

Remotion 4, SVG and CSS. Numbers come from `design-system.json` (`paper`, `tokens`, `motion`). The working
specimen is `components/styles/archival-grunge/Preview.tsx`. 30 fps, 1080 x 1920.

## 1. SVG feTurbulence paper grain
Two filters paint one flat colour and take their alpha from noise. Set `colorInterpolationFilters="sRGB"` or the
colours drift into a rainbow.
```tsx
const flat = (hex, alphaRow) => `0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} ${alphaRow}`;   // r, g, b are 0 to 1
<svg width={972} height={1498}>
  <filter id="grain" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={4} />
    <feColorMatrix type="matrix" values={flat(ink, '1.2 1.2 1.2 0 -1.55')} />
  </filter>
  <filter id="blot" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency={0.008} numOctaves={3} seed={9} />
    <feColorMatrix type="matrix" values={flat(stain, '2.6 0 0 0 -0.85')} />
  </filter>
  <rect width={972} height={1498} filter="url(#blot)" opacity={0.4} />
  <rect width={972} height={1498} filter="url(#grain)" opacity={0.26} />
</svg>
```
Blotches first, grain on top. Keep the grain at 0.26 or less: at 0.5 the body text loses contrast. The paper grain keeps
one seed so the page is still; the desk grain takes `seed={ff % 24}` so it boils at 12 fps.
Add a burnt edge `boxShadow: inset 0 0 90px 12px stain` and one 26 px fold at 52 percent of the height.

## 2. Jagged clip-path tears
```tsx
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const tearPoly = (w, h, seed, amp, step, inset) => {
  const pts = [];  const push = (x, y) => pts.push(`${x}px ${y}px`);
  for (let x = 0; x < w; x += step) push(x, inset + rnd(seed + x * 0.37) * amp);             // top
  for (let y = 0; y < h; y += step * 2.2) push(w - inset - rnd(seed + 7 + y * 0.41) * amp * 0.35, y);  // right
  for (let x = w; x > 0; x -= step) push(x, h - inset - rnd(seed + 13 + x * 0.29) * amp);   // bottom
  for (let y = h; y > 0; y -= step * 2.2) push(inset + rnd(seed + 19 + y * 0.43) * amp * 0.35, y);      // left
  return `polygon(${pts.join(',')})`;
};
const FIBRE = tearPoly(972, 1498, 3, 10, 18, 0);        // light, outside
const PAPER = tearPoly(972, 1498, 41, 10, 18, 8);       // the page, 8 px inside, so it never pokes out
```
Use `Math.sin` noise, never `Math.random()`, so a still is the same on every render. The fibre layer is
`lighten(surface, 0.4)`. Put the drop shadow on the parent: `filter: drop-shadow(0 18px 24px shadow)`.
The tear reveal is a third polygon on a wrapper, a ragged line moving down:
```tsx
const reveal = (p) => { const r = p * (1498 + 70) - 35;
  const pts = ['0px 0px', '972px 0px'];
  for (let x = 972; x >= 0; x -= 22) pts.push(`${x}px ${r + rnd(x * 0.17 + 5) * 30}px`);
  return `polygon(${pts.join(',')})`; };
```
`p` is `interpolate(f, [2, 20], [0, 1], {easing: bezier(.65, 0, .35, 1)})`.

## 3. Animated marker masks
```tsx
const markClip = (p) => { const X = p * 100;
  return `polygon(0% 0%, calc(${X}% + 1px) 0%, calc(${X}% - 3px) 28%, calc(${X}% + 7px) 52%, calc(${X}% - 2px) 76%, calc(${X}% + 1px) 100%, 0% 100%)`; };
<span style={{position: 'relative', display: 'inline-block'}}>
  losing ground to rivals
  <span style={{position: 'absolute', left: -8, right: -8, top: 7, bottom: 2, background: highlight,
    mixBlendMode: 'multiply', clipPath: markClip(p), transform: 'skewX(-4deg)'}} />
</span>
```
The wrapper is the line's own span, so the marker is as wide as the words in any font. Multiply keeps the ink dark.
`p` runs 0 to 1 over 24 frames. Type the line first, then sweep. The same clip, as `inset(-10% X% -10% -6%)`, writes a
handwritten note on from the left.

## 4. Red pen: circle, arrow, underline
```tsx
const circle = (cx, cy, rx, ry) => Array.from({length: 71}, (_, k) => { const u = k / 70;
  const a = -2.4 + u * Math.PI * 2 * 1.12;  const m = 1 + 0.12 * u + 0.03 * Math.sin(a * 3);   // spirals out 12 percent
  return `${k ? 'L' : 'M'} ${cx + Math.cos(a) * rx * m} ${cy + Math.sin(a) * ry * m}`; }).join(' ');
<path d={circle(350, 82, 335, 60)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
```
Do not use `vectorEffect="non-scaling-stroke"`: it breaks `pathLength`, and the pen is already drawn when it should start.
Give the svg a viewBox close to its real pixel size so the stroke is not stretched.

## 5. Stop-motion jitter and film gate
```tsx
const ff = Math.floor(f * 12 / 30);                      // 12 fps pose index
const jit = (seed) => `translate(${(rnd(ff * 3.1 + seed) - 0.5) * 3.2}px, ${(rnd(ff * 5.7 + seed + 9) - 0.5) * 3.2}px)
                       rotate(${(rnd(ff * 7.3 + seed + 4) - 0.5)}deg)`;
const flicker = 0.07 * rnd(ff * 5.3 + 1);                // black overlay alpha
const weave = (rnd(ff * 2.9 + 3) - 0.5) * 2;             // px, on the whole frame
```
Dust is 14 circles of 1 to 3.6 px at random places, half dark and half light. A scratch is a 1.5 px vertical line
that shows in 35 percent of poses. Draw the film layer last, over the stamp and the tape.

## 6. Stamp with ink dropouts
```tsx
<filter id="rough" colorInterpolationFilters="sRGB" x="-5%" y="-10%" width="110%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency={0.55} numOctaves={2} seed={7} result="n" />
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -6 0 0 0 4.1" result="m" />
  <feComposite in="SourceGraphic" in2="m" operator="in" />
</filter>
```
The alpha row `-6 R + 4.1` is zero where the noise is high, so small holes eat the ink. Scale from 1.7x to 1 on a
spring 12/220/0.9 from frame 146, rotate -9 degrees, blend with multiply.
