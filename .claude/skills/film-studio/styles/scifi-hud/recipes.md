# scifi-hud recipes

Remotion 4, SVG and CSS. Numbers come from `design-system.json` (`hud`, `tokens`, `motion`). The working
specimen is `components/styles/scifi-hud/Preview.tsx`. 30 fps, 1080 x 1920. Reticle centre (540, 800).

## 1. Segmented arcs with stroke-dasharray
A ring is a `circle` with no fill. N segments with a gap fraction `g` fit the circumference exactly:
```tsx
const ringDash = (r: number, n: number, g: number) => {
  const seg = (2 * Math.PI * r) / n;             // one segment plus one gap
  return `${seg * (1 - g)} ${seg * g}`;          // dash, gap
};
<circle cx={540} cy={800} r={296} fill="none" stroke={c.primary} strokeWidth={6}
  strokeDasharray={ringDash(296, 6, 0.22)} transform={`rotate(${f * 0.5} 540 800)`} />
```
Spin with `rotate(deg cx cy)`, never by moving the circle. Counter-rotate neighbours:
| Ring | r | N, gap | deg per frame |
|---|---|---|---|
| outer arcs | 296 | 6, 0.22 | +0.5 |
| fine dashes | 228 | 36, 0.5 | -0.9 |
| inner arcs | 190 | 4, 0.30 | +1.6 |
A gauge is one partial arc: `strokeDasharray={`${C * value} ${C}`}` with `C = 2 * PI * r` and `rotate(-90)` so it
starts at the top. The orbit dot is `cx = 540 + r*cos(a)`, `cy = 800 + r*sin(a)`, `a = f * 2.2 deg`.

## 2. Tick rings
Ticks are very short dashes on a thick stroke, so one circle draws a whole ring of marks:
```tsx
const tickDash = (r: number, n: number, tick: number) => `${tick} ${(2 * Math.PI * r) / n - tick}`;
<circle r={330} strokeWidth={12} strokeOpacity={0.55} strokeDasharray={tickDash(330, 120, 2.5)} />  // minor
<circle r={330} strokeWidth={24} strokeDasharray={tickDash(330, 24, 4)} />                           // major
```
Stroke width is the tick length. 120 minor and 24 major ticks line up every fifth mark.

## 3. Corner brackets and registration marks
```tsx
const Corner = ({x, y, sx, sy, arm, p}) => (   // sx, sy are +1 or -1 and point the arms inward
  <path d={`M ${x} ${y + sy * arm} L ${x} ${y} L ${x + sx * arm} ${y}`} fill="none" strokeWidth={5}
    strokeDasharray={arm * 2} strokeDashoffset={(1 - p) * arm * 2} />
);
<Corner x={36} y={36} sx={1} sy={1} arm={110} p={draw} />          // p goes 0 to 1 over 12 frames
<Corner x={1044} y={1884} sx={-1} sy={-1} arm={110} p={draw} />
```
The path length is `2 * arm`, so the dash length equals it and the offset draws the corner outward. A plus mark
is `M x-14 y L x+14 y M x y-14 L x y+14` at each edge middle. Edge rulers are a vertical line with
`strokeDasharray="2 38"` and `strokeDashoffset = f * 1.5`, so they crawl.

## 4. Scanline overlay
```tsx
<div style={{position: 'absolute', inset: 0, backgroundImage:
  'repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)'}} />
<div style={{position: 'absolute', left: 0, width: 1080, height: 220, top: ((f * 9) % (1920 + 440)) - 220,
  background: `linear-gradient(180deg, rgba(0,0,0,0), ${hexA(c.primary, 0.06)}, rgba(0,0,0,0))`}} />
```
Draw both after the reticle and before the plates, so text is never scanned. A plate is opaque.

## 5. Text scramble decode
```tsx
const CHARS = '0123456789ABCDEF#%/<>';
const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const scramble = (live: string, f: number, start: number, dur: number, seed: number) => {
  const p = (f - start) / dur;
  if (p < 0) return live.replace(/./g, ' ');                  // reserve the width, show nothing
  return live.split('').map((ch, i) =>
    ch === ' ' || p * live.length >= i + 1 ? ch : CHARS[Math.floor(rnd(Math.floor(f / 2) * 31 + i * 7 + seed) * CHARS.length)]).join('');
};
```
Characters lock from the left. The random glyph changes every 2 frames, so it flickers and stays readable.
Pass the live value, not a final one, so a ticking number is correct the moment it locks. Stagger readouts by 8 frames.

## 6. Live signal bars
```tsx
const bar = (i, f) => 0.14 + 0.86 * Math.abs(Math.sin(f * 0.21 + i * 0.7) * Math.sin(f * 0.13 + i * 0.31)) * smooth(f / 30);
```
28 bars in a flex row on a plate, `gap 6`. The tallest bar takes `highlight`. Deterministic, so a still render is the same.

## 7. RGB chromatic glitch
```tsx
const glitching = f >= LOCK && f < LOCK + 8;   const gv = 1 - (f - LOCK) / 8;   const off = 12 * gv;
// two ghosts, one colour each, blended with screen, moved in x
<svg style={{transform: `translateX(${-off}px)`, mixBlendMode: 'screen'}}><Reticle mono={c.alert} /></svg>
<svg style={{transform: `translateX(${off}px)`, mixBlendMode: 'screen'}}><Reticle mono={c.primary} /></svg>
// three slices of the real reticle, each shifted
[[0, 34, -16], [34, 66, 10], [66, 100, -7]].map(([a, b, dx]) =>
  <svg style={{clipPath: `inset(${a}% 0 ${100 - b}% 0)`, transform: `translateX(${dx * gv}px)`}}><Reticle /></svg>)
```
The effect decays to zero over 8 frames. Only the reticle glitches; plates and text stay still.

## 8. Lock on
```tsx
const lockW = spring({frame: f - 62, fps: 30, config: {damping: 13, stiffness: 150, mass: 1}});
const box = lerp(640, 250, Math.min(1.08, lockW));       // lock box side
const bx = 540 + target(f - 5).x * lockW;                // follows the target with a 5 frame lag
```
At frame 96 the box turns `highlight`, a 5 frame flash fills it, the state word scrambles to LOCKED and the glitch runs.
