import React from 'react';
import {random} from 'remotion';
import {rgba} from '../../engine/tokens';
import {txt} from '../social/tokens';
import {TAB, lab} from '../data/tokens';
import {mix, type CameraTokens} from './tokens';

export {Card, Label, numCss} from '../data/parts';

/**
 * Shared camera parts. `Scene` is the code-drawn shot every lens widget looks at: sky, far ridge, a skyline with one
 * landmark tower, the subject (a figure in a coat) and a foreground edge, each on its own layer so a widget can blur,
 * scale or move one plane. Colours are mixes of palette roles. Layers are drawn with a bleed, so a blur or a shrink
 * never shows a layer's edge inside the viewport. Text is never drawn on the scene: labels sit on opaque plates.
 */
export type LayerId = 'sky' | 'far' | 'mid' | 'subject' | 'near';
export type LayerFx = {blur?: number; scale?: number; x?: number; y?: number; opacity?: number};
/** Silhouette paint for an impact frame: one fill for the sky, one for the world, one for the subject, plus rays. */
export type Paint = {sky: string; world: string; subject: string; rays?: {color: string; n: number; rot?: number}};

/** Scene landmarks as fractions of the scene box (used for focus brackets, lens targets and samples). */
export const SPOT = {
	horizon: 0.6,
	subject: {x: 0.36, top: 0.5, feet: 0.9, w: 0.2},
	tower: {x0: 0.62, x1: 0.78, top: 0.28},
	window: {x: 0.735, y: 0.395, w: 0.03, h: 0.032},
	sun: {x: 0.8, y: 0.2, r: 0.07},
};

export const sceneColors = (tk: CameraTokens, night = false) => {
	const s = tk.c.surface;
	const dark = tk.light ? tk.c.ink : tk.c.bg;
	return {
		skyTop: night ? mix(tk.c.bg, s, 0.25) : mix(s, tk.c.bg, tk.light ? 0.2 : 0.45),
		skyBot: night ? s : mix(s, tk.c.highlight, 0.24),
		floor: mix(s, dark, night ? 0.45 : 0.28),
		sun: night ? mix(s, tk.c.ink, 0.72) : tk.c.highlight,
		far: mix(s, tk.c.ink, night ? 0.1 : 0.16),
		mid: mix(s, dark, 0.46),
		near: mix(s, dark, 0.8),
		lit: tk.c.highlight,
		dim: mix(mix(s, dark, 0.46), tk.c.highlight, night ? 0.5 : 0.22),
		coat: tk.c.primary,
		head: mix(tk.c.primary, dark, 0.35),
		shade: tk.shade,
	};
};

const ridge = (seed: string, x0: number, x1: number, base: number, amp: number, bottom: number, steps: number) => {
	const pts: string[] = [];
	const n = Math.max(2, Math.ceil(steps));
	for (let i = 0; i <= n; i++) pts.push(`${(x0 + ((x1 - x0) * i) / n).toFixed(1)},${(base - amp * (0.35 + 0.65 * random(`${seed}-${i}`))).toFixed(1)}`);
	return `M${x0},${bottom} L${pts.join(' L')} L${x1},${bottom} Z`;
};

export const Scene: React.FC<{
	tk: CameraTokens; w: number; h: number; seed: string; fx?: Partial<Record<LayerId, LayerFx>>; night?: boolean; paint?: Paint;
	/** Extra width drawn each side, as a fraction of w (for a layer that shrinks). */ span?: number;
	/** Transform origin as fractions of the scene box. */ origin?: [number, number];
	/** Hide a layer. */ hide?: LayerId[];
}> = ({tk, w, h, seed, fx = {}, night = false, paint, span = 0.15, origin = [0.5, SPOT.horizon], hide = []}) => {
	const C = sceneColors(tk, night);
	const B = 60;
	const X0 = -span * w - B, X1 = w + span * w + B;
	const hz = SPOT.horizon * h;
	const id = `sc-${seed}`;
	const layer = (k: LayerId, body: React.ReactNode) => {
		if (hide.includes(k)) return null;
		const e = fx[k] ?? {};
		return (
			<div
				key={k}
				style={{
					position: 'absolute', left: -B, top: -B, width: w + 2 * B, height: h + 2 * B,
					transform: `translate(${e.x ?? 0}px, ${e.y ?? 0}px) scale(${e.scale ?? 1})`,
					transformOrigin: `${B + origin[0] * w}px ${B + origin[1] * h}px`,
					filter: e.blur && e.blur > 0.05 ? `blur(${e.blur.toFixed(2)}px)` : 'none',
					opacity: e.opacity ?? 1,
				}}
			>
				<svg width={w + 2 * B} height={h + 2 * B} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<g transform={`translate(${B},${B})`}>{body}</g>
				</svg>
			</div>
		);
	};
	const sx = SPOT.subject.x * w, fy = SPOT.subject.feet * h, sh = (SPOT.subject.feet - SPOT.subject.top) * h;
	const hr = sh * 0.075;
	const world = paint?.world;
	// Skyline: seeded blocks, the landmark tower left out of the seeded run.
	const blocks: React.ReactNode[] = [];
	let x = X0;
	for (let i = 0; x < X1; i++) {
		const bw = w * (0.07 + 0.06 * random(`${seed}-bw${i}`));
		const bh = h * (0.05 + 0.13 * random(`${seed}-bh${i}`));
		const inTower = x + bw > SPOT.tower.x0 * w - 6 && x < SPOT.tower.x1 * w + 6;
		if (!inTower) {
			blocks.push(<rect key={`b${i}`} x={x} y={hz + h * 0.06 - bh} width={bw - 4} height={bh + h * 0.1} fill={world ?? C.mid} />);
			if (!paint) {
				for (let k = 0; k < 3; k++) {
					if (random(`${seed}-w${i}-${k}`) > 0.55) blocks.push(<rect key={`w${i}-${k}`} x={x + bw * (0.2 + 0.25 * k)} y={hz + h * 0.06 - bh + h * 0.02} width={bw * 0.12} height={h * 0.014} fill={random(`${seed}-l${i}-${k}`) > 0.5 ? C.lit : C.dim} />);
				}
			}
		}
		x += bw;
	}
	const T = SPOT.tower, Wn = SPOT.window;
	const tx0 = T.x0 * w, tx1 = T.x1 * w, ty = T.top * h;
	const wins: React.ReactNode[] = [];
	if (!paint) {
		for (let r = 0; r < 6; r++) {
			for (let c = 0; c < 2; c++) {
				const wx = tx0 + (tx1 - tx0) * (c === 0 ? 0.24 : 0.62);
				const wy = ty + h * 0.05 + r * h * 0.05;
				const target = r === 1 && c === 1;
				wins.push(<rect key={`tw${r}${c}`} x={target ? Wn.x * w - (Wn.w * w) / 2 : wx} y={target ? Wn.y * h - (Wn.h * h) / 2 : wy} width={Wn.w * w} height={Wn.h * h} fill={target ? C.lit : C.dim} />);
			}
		}
		// The detail only a lens sees: a small figure in the lit window.
		const dx = Wn.x * w, dy = Wn.y * h + (Wn.h * h) / 2;
		const u = Wn.h * h;
		wins.push(
			<g key="detail" fill={C.shade}>
				<circle cx={dx} cy={dy - u * 0.62} r={u * 0.16} />
				<path d={`M${dx - u * 0.26},${dy} Q${dx - u * 0.24},${dy - u * 0.42} ${dx},${dy - u * 0.44} Q${dx + u * 0.24},${dy - u * 0.42} ${dx + u * 0.26},${dy} Z`} />
			</g>,
		);
	}
	const rays = paint?.rays;
	return (
		<div style={{position: 'absolute', inset: 0}}>
			{layer(
				'sky',
				<>
					<defs>
						<linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor={paint?.sky ?? C.skyTop} />
							<stop offset="1" stopColor={paint?.sky ?? C.skyBot} />
						</linearGradient>
						<radialGradient id={`${id}-halo`}>
							<stop offset="0" stopColor={rgba(C.sun, 0.55)} />
							<stop offset="1" stopColor={rgba(C.sun, 0)} />
						</radialGradient>
					</defs>
					<rect x={X0} y={-B} width={X1 - X0} height={hz + B + 2} fill={`url(#${id}-sky)`} />
					<rect x={X0} y={hz} width={X1 - X0} height={h - hz + B} fill={paint?.sky ?? C.floor} />
					{!paint && (
						<>
							<circle cx={SPOT.sun.x * w} cy={SPOT.sun.y * h} r={SPOT.sun.r * Math.min(w, h) * 2.4} fill={`url(#${id}-halo)`} />
							<circle cx={SPOT.sun.x * w} cy={SPOT.sun.y * h} r={SPOT.sun.r * Math.min(w, h) * (night ? 0.7 : 1)} fill={C.sun} />
						</>
					)}
					{rays &&
						Array.from({length: rays.n}, (_, i) => {
							const R = Math.hypot(w, h) * 1.2;
							const a0 = ((i / rays.n) * 360 + (rays.rot ?? 0)) * (Math.PI / 180);
							const a1 = a0 + (Math.PI / rays.n) * 0.9;
							return <path key={i} d={`M${sx},${fy - sh * 0.5} L${sx + R * Math.cos(a0)},${fy - sh * 0.5 + R * Math.sin(a0)} L${sx + R * Math.cos(a1)},${fy - sh * 0.5 + R * Math.sin(a1)} Z`} fill={rays.color} />;
						})}
				</>,
			)}
			{layer('far', <path d={ridge(`${seed}-far`, X0, X1, hz + h * 0.02, h * 0.13, hz + h * 0.06, (X1 - X0) / (w / 7))} fill={world ?? C.far} />)}
			{layer(
				'mid',
				<>
					{blocks}
					<rect x={tx0} y={ty} width={tx1 - tx0} height={hz + h * 0.1 - ty} fill={world ?? C.mid} />
					<rect x={(tx0 + tx1) / 2 - 3} y={ty - h * 0.05} width={6} height={h * 0.05} fill={world ?? C.mid} />
					{wins}
				</>,
			)}
			{layer(
				'subject',
				<>
					{!paint && <ellipse cx={sx} cy={fy} rx={sh * 0.2} ry={sh * 0.03} fill={rgba(C.shade, 0.35)} />}
					<g fill={paint?.subject ?? C.coat}>
						<rect x={sx - sh * 0.1} y={fy - sh * 0.2} width={sh * 0.07} height={sh * 0.2} fill={paint?.subject ?? C.head} />
						<rect x={sx + sh * 0.03} y={fy - sh * 0.2} width={sh * 0.07} height={sh * 0.2} fill={paint?.subject ?? C.head} />
						<path d={`M${sx - sh * 0.15},${fy - sh + hr * 2.3} L${sx + sh * 0.15},${fy - sh + hr * 2.3} L${sx + sh * 0.2},${fy - sh * 0.16} L${sx - sh * 0.2},${fy - sh * 0.16} Z`} />
						{!paint && <rect x={sx - sh * 0.15} y={fy - sh + hr * 2.3} width={sh * 0.3} height={sh * 0.05} fill={tk.c.highlight} />}
						<circle cx={sx} cy={fy - sh + hr} r={hr} fill={paint?.subject ?? C.head} />
					</g>
				</>,
			)}
			{layer(
				'near',
				<>
					<path d={ridge(`${seed}-near`, X0, X1, h * 0.97, h * 0.05, h + B, (X1 - X0) / (w / 12))} fill={world ?? C.near} />
					<rect x={X0} y={-B} width={-X0 + w * 0.06} height={h + 2 * B} fill={world ?? C.near} />
					<rect x={w * 0.06} y={h * 0.62} width={w * 0.22} height={h * 0.016} fill={world ?? C.near} />
				</>,
			)}
		</div>
	);
};

/** A clipped viewport (the shot) with the style's plate radius and a hairline frame. */
export const Viewport: React.FC<{tk: CameraTokens; x: number; y: number; w: number; h: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({tk, x, y, w, h, children, style}) => (
	<div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', borderRadius: tk.plateR, background: tk.c.bg, ...style}}>
		{children}
		<div style={{position: 'absolute', inset: 0, borderRadius: tk.plateR, boxShadow: `inset 0 0 0 ${tk.stroke.hair}px ${tk.grid}`, pointerEvents: 'none'}} />
	</div>
);

/** An opaque label plate (surface fill, so text never sits on the shot). */
export const Plate: React.FC<{tk: CameraTokens; children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({tk, children, color, size, style}) => (
	<span
		style={{
			...txt(tk, 'mono', size ?? lab(tk, 0.72), color ?? tk.text), ...TAB, textTransform: 'uppercase', letterSpacing: '0.1em',
			display: 'inline-block', padding: '8px 16px', background: tk.c.surface, borderRadius: Math.min(tk.plateR, 14),
			border: `${tk.stroke.hair}px solid ${tk.grid}`, lineHeight: 1.15, ...style,
		}}
	>
		{children}
	</span>
);

/** Four corner brackets around a rect (focus marks, lock boxes). */
export const Brackets: React.FC<{x: number; y: number; w: number; h: number; color: string; stroke: number; len?: number; opacity?: number; filter?: string}> = ({x, y, w, h, color, stroke, len, opacity = 1, filter}) => {
	const L = len ?? Math.min(w, h) * 0.22;
	const d = `M${x},${y + L} V${y} H${x + L} M${x + w - L},${y} H${x + w} V${y + L} M${x + w},${y + h - L} V${y + h} H${x + w - L} M${x + L},${y + h} H${x} V${y + h - L}`;
	return (
		<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity, filter}} width={1} height={1}>
			<path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="square" />
		</svg>
	);
};

/** Polygon of the rect [-b, -b, w+b, h+b] on one side of the line through (cx, cy) at `deg` (side +1 or -1). */
export const halfPoly = (w: number, h: number, cx: number, cy: number, deg: number, side: 1 | -1, b = 0): [number, number][] => {
	const a = (deg * Math.PI) / 180;
	const nx = -Math.sin(a), ny = Math.cos(a);
	const s = (p: [number, number]) => side * ((p[0] - cx) * nx + (p[1] - cy) * ny);
	const rect: [number, number][] = [[-b, -b], [w + b, -b], [w + b, h + b], [-b, h + b]];
	const out: [number, number][] = [];
	for (let i = 0; i < 4; i++) {
		const p = rect[i], q = rect[(i + 1) % 4];
		const sp = s(p), sq = s(q);
		if (sp >= 0) out.push(p);
		if (sp * sq < 0) {
			const t = sp / (sp - sq);
			out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
		}
	}
	return out;
};
export const polyCss = (pts: [number, number][], dx = 0, dy = 0) => `polygon(${pts.map(([x, y]) => `${(x + dx).toFixed(1)}px ${(y + dy).toFixed(1)}px`).join(', ')})`;
