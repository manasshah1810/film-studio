# neo-brutalist-ui recipes

Remotion 4 code. Numbers come from `design-system.json` (`tokens`, `motion.springs`, `motion.easings`).
The working specimen is `components/styles/neo-brutalist-ui/Preview.tsx`. Frames are at 30 fps.
`U` is `tokens.frame_scale` (3), so a 3 px border is 9 px on the 1080 frame.

## 1. Role helpers
```tsx
const lin = (h: string) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a: string, b: string) => (Math.max(lin(a), lin(b)) + 0.05) / (Math.min(lin(a), lin(b)) + 0.05);
const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const onFill = (c, fill) => (contrast(c.ink, fill) >= contrast(c.bg, fill) ? c.ink : c.bg);  // text on primary or highlight
```

## 2. Card with border and hard shadow
```tsx
const U = 3;
const card = (c, lift = 0) => ({
  boxSizing: 'border-box', border: `${3 * U}px solid ${c.ink}`, borderRadius: 10 * U,
  boxShadow: `${5 * U + lift * 9}px ${5 * U + lift * 9}px 0 ${c.ink}`,   // blur is always 0
});
```

## 3. Hard-shadow button press
```tsx
const press = interpolate(f, [CLICK - 2, CLICK, CLICK + 5], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
<div style={{...card(c), background: c.primary, color: onFill(c, c.primary),
  boxShadow: `${15 * (1 - 0.8 * press)}px ${15 * (1 - 0.8 * press)}px 0 ${c.ink}`,   // 15 px shrinks to 3 px
  transform: `translate(${press * 12}px, ${press * 12}px)`}}>Generate</div>          // moves 4 design px
```
Start the next beat (the flip, the count) on `CLICK + 2` so the result follows the press.

## 4. Spring overshoot sticker stamp
```tsx
import {spring} from 'remotion';
const OVER = {damping: 12, stiffness: 170, mass: 0.9};
const p = f >= 14 ? spring({frame: f - 14, fps: 30, config: OVER}) : 0;
// lands at -6 degrees from +8, scale 1.6 to 1, hard 3 design px shadow
transform: `rotate(${-6 + (1 - p) * 14}deg) scale(${1 + (1 - p) * 0.6})`, opacity: Math.min(1, p * 4)
```

## 5. Gravity drop with squash
```tsx
const GRAV = {damping: 7, stiffness: 220, mass: 1.1};
const drop = (f: number, start: number, dist: number) => {
  if (f < start) return {y: -dist, sx: 1, sy: 1};
  const p = spring({frame: f - start, fps: 30, config: GRAV});
  const y = p < 1 ? -(1 - p) * dist : -(p - 1) * 70;               // falls, then rebounds a little
  const sq = p > 0.9 ? Math.max(0, 1 - Math.abs(p - 1) / 0.1) : 0;   // squash only at contact
  return {y, sx: 1 + 0.03 * sq, sy: 1 - 0.06 * sq};
};
// style: transform `translateY(${d.y}px) scale(${d.sx}, ${d.sy})`, transformOrigin '50% 100%'
```
Use `dist` = the slot's top in px plus 400, so the card starts above the frame.

## 6. 3D axis card flip
```tsx
import {Easing} from 'remotion';
const flip = Easing.bezier(0.65, 0, 0.35, 1);
const t = interpolate(f, [FLIP_AT, FLIP_AT + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: flip});
<div style={{perspective: 1400, width, height, position: 'relative'}}>
  <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${180 * t}deg)`}}>
    <div style={{...card(c), position: 'absolute', inset: 0, backfaceVisibility: 'hidden'}}>{/* front */}</div>
    <div style={{...card(c), position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>{/* back */}</div>
  </div>
</div>
```
Both faces are full cards with their own border and shadow, so neither shows a seam at 90 degrees.

## 7. Frosted glass card
```tsx
<div style={{...card(c),
  background: hexA(c.surface, 0.74),                         // tokens.backdrop_blur.fill_alpha
  backdropFilter: 'blur(36px) saturate(1.4)',                // 12 design px x 3
  WebkitBackdropFilter: 'blur(36px) saturate(1.4)'}}>{/* ink text, 34 px or more */}</div>
```
Put a dot grid, a `primary` band and a `highlight` disc under it, or the blur has nothing to show.
```tsx
backgroundImage: `radial-gradient(circle, ${hexA(c.ink, 0.22)} 4px, transparent 4.6px)`, backgroundSize: '42px 42px'
```

## 8. LiveCursor on a bezier path
```tsx
const K = [{f: 4, x: 1180, y: 640}, {f: 18, x: 470, y: 700}, {f: 48, x: btnX, y: btnY}, {f: 56, x: btnX, y: btnY}];
let i = 0; while (i < K.length - 2 && f > K[i + 1].f) i++;
const t = interpolate(f, [K[i].f, K[i + 1].f], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.9, 0.2, 1)});
const x = K[i].x + (K[i + 1].x - K[i].x) * t;
const y = K[i].y + (K[i + 1].y - K[i].y) * t - 46 * Math.sin(Math.PI * t);   // the arc; 0 when the two keys match
```
Aim the tip at an empty corner of the target, never on its label. The name tag sits 40 px right and
62 px below the tip in `highlight`. On a click the cursor scales to 0.8 with the `press` spring.

## 9. Typed prompt and count-up
```tsx
const typed = PROMPT.slice(0, Math.max(0, Math.min(PROMPT.length, Math.floor((f - TYPE_FROM) * 1.4))));
const caret = Math.floor(f / 8) % 2 === 0;                                   // block caret, 8 frame blink
const n = Math.round(interpolate(f, [start + 8, start + 32], [0, 4812], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.36, 1)}));
const text = n.toLocaleString('en-US');                                      // keep the unit in its own span
```
