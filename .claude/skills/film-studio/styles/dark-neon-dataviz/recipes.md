# dark-neon-dataviz recipes

Remotion 4 and SVG. Numbers come from `design-system.json` (`tokens`, `motion`). The working
specimen is `components/styles/dark-neon-dataviz/Preview.tsx`. Frames are at 30 fps on 1080 x 1920.

## 1. Role helpers and tabular numerals
```tsx
const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const alert = c.alert ?? c.highlight;                 // a fall; focused palettes have no alert role
const muted = c.muted ?? blend(c.ink, c.surface, 0.72);  // axis labels, 4.5:1 or better on surface
const tnum = {fontVariantNumeric: 'tabular-nums'};     // on every number
```

## 2. SVG feGaussianBlur glow chain
```tsx
const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');   // unique ids, a sheet draws 3 copies
<filter id={`glow${uid}`} filterUnits="userSpaceOnUse" x={CARD.x + 4} y={CARD.y + 4} width={CARD.w - 8} height={CARD.h - 8} colorInterpolationFilters="sRGB">
  <feGaussianBlur in="SourceGraphic" stdDeviation={5} result="inner" />
  <feGaussianBlur in="SourceGraphic" stdDeviation={14} result="outerRaw" />
  <feComponentTransfer in="outerRaw" result="outer"><feFuncA type="linear" slope={0.7} /></feComponentTransfer>
  <feMerge><feMergeNode in="outer" /><feMergeNode in="inner" /><feMergeNode in="SourceGraphic" /></feMerge>
</filter>
<g filter={`url(#glow${uid})`}>{/* line, head dot, nodes only */}</g>
```
The region is the card minus 4 px, so the blur is cut at the card edge. Put labels and plates in HTML
above the svg so glow can never touch them.

## 3. Path draw-on with a real length
```tsx
const PTS = Array.from({length: 181}, (_, k) => { const x = L + ((R - L) * k) / 180; return {x, y: yOf(valueAtX(x))}; });
const CUM = PTS.reduce<number[]>((a, p, k) => { a.push(k ? a[k - 1] + Math.hypot(p.x - PTS[k - 1].x, p.y - PTS[k - 1].y) : 0); return a; }, []);
const TOTAL = CUM[CUM.length - 1];
const p = interpolate(f, [20, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.2, 1)});
<path d={LINE_D} fill="none" stroke={c.primary} strokeWidth={9} strokeLinecap="round" strokeDasharray={TOTAL} strokeDashoffset={TOTAL * (1 - p)} />
```
Build the line as a 180 segment polyline from your own `valueAtX`, so the length, the head position
and the odometer value all come from the same function. Hide the path while `p` is 0, or the round cap
shows as a dot. `headAt(p)` walks `CUM` to the point at length `p * TOTAL`.

## 4. Animated area gradient
```tsx
<linearGradient id={`area${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1={TOP} x2="0" y2={BOTTOM}>
  <stop offset="0" stopColor={c.primary} stopOpacity={0.38 * (0.35 + 0.65 * p)} />   // fills in as the line draws
  <stop offset="1" stopColor={c.primary} stopOpacity={0} />
</linearGradient>
<clipPath id={`reveal${uid}`}><rect x={L - 4} y={CARD.y} width={Math.max(0, head.x - L + 4)} height={CARD.h} /></clipPath>
<path d={AREA_D} fill={`url(#area${uid})`} clipPath={`url(#reveal${uid})`} />
```
`AREA_D` is the line path plus `L R BOTTOM L L BOTTOM Z`. The clip width is the head x, so the fill
never runs ahead of the line.

## 5. Odometer roll
```tsx
const Digit = ({pos, size, color, visible, style}) => {
  const m = ((pos % 10) + 10) % 10;                      // the strip is 0..9 then 0 again, 11 cells
  return (<div style={{width: size * 0.62, height: size, overflow: 'hidden', position: 'relative', opacity: visible}}>
    <div style={{...style, color, position: 'absolute', top: 0, width: '100%', textAlign: 'center', lineHeight: 1, transform: `translateY(${-m * size}px)`}}>
      {[0,1,2,3,4,5,6,7,8,9,0].map((d, k) => <div key={k} style={{height: size}}>{d}</div>)}</div></div>);
};
// per column k from the right: q = value / 10 ** k; base = floor(q); frac = q - base
// pos = base + smooth(clamp((frac - 0.5) * 2)); visible = k === 0 ? 1 : clamp((q - 0.5) / 0.5)
```
Fixed width columns with tabular numerals mean nothing moves sideways. The unit is a sibling element.
Drive `value` from the data (`share = valueAtX(head.x)`), never from its own timer, so the number and
the line agree on every frame.

## 6. Callout node, leader and plate
```tsx
const nf = NODE_FRAME[k];                                    // first frame the head passes the node
const pop = f >= nf ? spring({frame: f - nf, fps: 30, config: {damping: 11, stiffness: 190, mass: 0.8}}) : 0;
const ring = interpolate(f, [nf, nf + 18], [0, 1], clamp);   // one pulse, radius 15 to 34
const ld = interpolate(f, [nf + 3, nf + 12], [0, 1], clamp); // the leader draws; render only when ld > 0
```
The plate is an HTML div with an opaque `surface` fill, a 3 px `alert` border, a mono label in `ink`
and the value in `alert`. Place plates above the curve, in empty ground, with 25 px or more of clearance.

## 7. Continuous camera drift and rack focus
```tsx
const dr = interpolate(f, [0, TOTAL_FRAMES], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.37, 0, 0.63, 1)});
<AbsoluteFill style={{transform: `translate(${-14 * dr}px, ${-10 * dr}px) scale(${1 + 0.03 * dr})`, transformOrigin: '50% 45%'}}>
```
Rack focus: from frame 106 to 120 dim the leaders, nodes and plate borders of the other callouts to 60
percent and lift the active plate to scale 1.05. Never lower the opacity of label text.
