# hormozi-kinetic recipes

Remotion 4 code. Numbers come from `design-system.json` (`motion.springs`, `motion.easings`). The
working specimen is `components/styles/hormozi-kinetic/Preview.tsx`. Frames are at 30 fps.

## 1. Word entrance with the pop spring
```tsx
import {spring, interpolate, useCurrentFrame} from 'remotion';
const POP = {damping: 11, stiffness: 190, mass: 0.8};
// word.s = the frame the word is spoken
const f = useCurrentFrame();
const p = f >= word.s ? spring({frame: f - word.s, fps: 30, config: POP}) : 0;
const scale = 0.6 + 0.4 * p;                       // overshoots past 1 once, then settles
const opacity = f >= word.s ? Math.min(1, (f - word.s) / 2 + 0.2) : 0;
```

## 2. Word highlight (knockout block that follows the spoken word)
```tsx
const next = WORDS[i + 1]?.s ?? Infinity;
const active = f >= word.s && f < next;           // exactly one active word at a time
const block = active ? (word.power ? roles.highlight : roles.primary) : 'transparent';
const colour = active ? roles.bg                  // knockout: the text is cut out of the block
  : word.power && f >= word.s ? roles.primary     // a spoken power word keeps its colour
  : roles.ink;
<span style={{
  display: 'inline-block', padding: '0 0.09em',   // padding always on, so the line never reflows
  background: block, color: colour,
  transform: `scale(${scale * (active ? (word.power ? 1.1 : 1.06) : 1)}) rotate(${active ? (word.power ? -2 : 1.5) : 0}deg)`,
  transformOrigin: '50% 70%',
}}>{word.t}</span>
```

## 3. Punch-in on a power word
```tsx
import {Easing} from 'remotion';
const settle = Easing.bezier(0.22, 1, 0.36, 1);
const last = WORDS.filter((w) => w.power && w.s <= f).pop();
const k = last ? interpolate(f - last.s, [0, 3, 17], [0, 1, 0], {extrapolateRight: 'clamp', easing: settle}) : 0;
const zoom = 1 + 0.04 * k;                         // 3 frames in, 14 frames out
<AbsoluteFill style={{transform: `scale(${zoom})`}}>{/* text, bust, widget */}</AbsoluteFill>
```
Keep every box inside x 8 to 83 and y 10 to 78 so a 4% zoom still clears the platform UI.

## 4. Elastic pull-back zoom (background layer only)
```tsx
const PULL = {damping: 12, stiffness: 150, mass: 1};
const bgScale = 1 + 0.15 * (1 - spring({frame: f, fps: 30, config: PULL}));   // 1.15 settles to 1
```
Apply it to the background, not to text or the face, so nothing readable leaves the safe zone.

## 5. Whip pan between beats
```tsx
const whip = Easing.bezier(0.7, 0, 0.2, 1);
const t = interpolate(f, [cut - 4, cut], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: whip});
<div style={{transform: `translateX(${-t * 1080}px)`, filter: `blur(${t * 16}px)`}}>{/* old beat */}</div>
```

## 6. Impact frame (once per film, on the payoff word)
```tsx
import {random} from 'remotion';
const d = f - IMPACT;                              // IMPACT = frame of the payoff word
const shake = d >= 0 && d < 6 ? (6 - d) * 2 : 0;  // px, decays over 6 frames
const sx = shake * (random(`sx${f}`) - 0.5) * 2;  // seeded: same render every time
const flash = d >= 0 && d < 3 ? 0.85 * (1 - d / 3) : 0;
// stage: translate(sx, sy); overlay: background roles.ink, opacity flash
```

## 7. CommentDrop
```tsx
const SLAM = {damping: 9, stiffness: 240, mass: 0.9};
const t = f - COMMENT_AT;
const p = spring({frame: t, fps: 30, config: SLAM});
const likes = Math.round(interpolate(t, [4, 24], [0, 4200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
// card: translateY((1 - p) * 220px) rotate(2deg) scale(0.9 + 0.1 * p); fill ink, text bg, 12px hard offset shadow in primary
```

## 8. Narrator visemes from the spoken word
```tsx
const VIS = {a: 'AA', o: 'OH', u: 'OH', e: 'EE', i: 'EE', f: 'FV', v: 'FV', b: 'MBP', m: 'MBP', p: 'MBP'};
const seq = [...word.say.toLowerCase()].map((c) => VIS[c]).filter(Boolean);
const mouth = seq[Math.min(Math.floor((f - word.s) / 2), seq.length - 1)] ?? 'MBP';   // MBP is also the rest mouth
```
`say` is how the word is spoken ("fifty percent" for 50%), so digits still drive the mouth.

## 9. Blink
Eye states open (1), half (0.5), closed (0.08). A blink is 6 frames: half, half, closed, closed, half, half.
Start blinks every 75 to 135 frames (2.5 to 4.5 s), never on a power word.
