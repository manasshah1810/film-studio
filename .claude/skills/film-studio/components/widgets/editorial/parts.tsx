import React, {useId} from 'react';
import {random} from 'remotion';
import type {EditorialTokens} from './tokens';

export type Pt = [number, number];
export const poly = (pts: Pt[]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
export const pathOf = (pts: Pt[], close = true) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}${close ? ' Z' : ''}`;

/** A jagged run from a to b: a point every `step` px, pushed up to `amp` px along (nx, ny); `both` = either side. */
export const jagged = (a: Pt, b: Pt, step: number, amp: number, seed: string, nx: number, ny: number, both = false): Pt[] => {
	const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
	const out: Pt[] = [];
	for (let i = 0; i <= n; i++) {
		const t = i / n;
		const r = random(`${seed}-${i}`);
		const d = both ? (r - 0.5) * 2 * amp : (i === 0 || i === n ? 0 : r * amp);
		out.push([a[0] + (b[0] - a[0]) * t + nx * d, a[1] + (b[1] - a[1]) * t + ny * d]);
	}
	return out;
};

/** Torn outline of a w x h rectangle inset by `o` (negative = outside), each point pushed inward up to `amp`. */
export const tornRect = (w: number, h: number, amp: number, step: number, seed: string, o = 0): Pt[] => [
	...jagged([o, o], [w - o, o], step, amp, `${seed}t`, 0, 1),
	...jagged([w - o, o], [w - o, h - o], step, amp, `${seed}r`, -1, 0).slice(1),
	...jagged([w - o, h - o], [o, h - o], step, amp, `${seed}b`, 0, -1).slice(1),
	...jagged([o, h - o], [o, o], step, amp, `${seed}l`, 1, 0).slice(1),
];

/** Paper grain from the style's grain token: feTurbulence in the text colour. Nothing for a style without grain. */
export const Grain: React.FC<{tk: EditorialTokens; w: number; h: number; seed?: number}> = ({tk, w, h, seed = 3}) => {
	const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const g = tk.paper.grain;
	if (!g) return null;
	return (
		<svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none', opacity: g.opacity * 0.55}}>
			<filter id={id} x="0" y="0" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency={g.freq} numOctaves={g.octaves} seed={seed} />
				<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.25" />
			</filter>
			<rect width={w} height={h} filter={`url(#${id})`} fill={tk.text} />
		</svg>
	);
};

/**
 * A sheet of paper in the style. Style with a tear token: soft drop shadow, fibre edge, jagged outline, grain
 * (archival-grunge). Without one: the style's own card (radius, border, offset shadow). `outline` replaces the
 * rectangle (PaperTear pieces); the border, if the style has one, is stroked along that outline.
 */
export const Paper: React.FC<{
	tk: EditorialTokens; w: number; h: number; seed: string; torn?: boolean; outline?: Pt[]; fibre?: Pt[] | null;
	style?: React.CSSProperties; children?: React.ReactNode; fill?: string;
}> = ({tk, w, h, seed, torn = true, outline, fibre, style, children, fill}) => {
	const t = tk.paper.tear;
	const bg = fill ?? tk.c.surface;
	const shape = outline ?? (torn && t ? tornRect(w, h, t.amp, t.step, seed) : null);
	if (!shape) {
		return (
			<div style={{position: 'absolute', width: w, height: h, filter: tk.paper.drop, ...style}}>
				<div style={{position: 'absolute', inset: 0, background: bg, borderRadius: tk.radius, border: tk.border.w ? `${tk.border.w}px solid ${tk.border.color}` : 'none', boxSizing: 'border-box', overflow: 'hidden'}}>
					<Grain tk={tk} w={w} h={h} />
					{children}
				</div>
			</div>
		);
	}
	const fib = fibre !== undefined ? fibre : t && t.fibre ? tornRect(w, h, t.amp, t.step, `${seed}f`, -t.fibre) : null;
	return (
		<div style={{position: 'absolute', width: w, height: h, filter: tk.paper.drop, ...style}}>
			{fib ? <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, background: tk.paper.fibre, opacity: 0.75, clipPath: poly(fib)}} /> : null}
			<div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, background: bg, clipPath: poly(shape), overflow: 'hidden'}}>
				<Grain tk={tk} w={w} h={h} />
				{children}
			</div>
			{tk.border.w ? (
				<svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
					<path d={pathOf(shape)} fill="none" stroke={tk.border.color} strokeWidth={tk.border.w} strokeLinejoin="round" />
				</svg>
			) : null}
		</div>
	);
};

/** Halftone picture: dots in the text colour, one optional spot in the pen colour. Generic subjects, never a photo. */
export type Subject = 'portrait' | 'skyline' | 'horizon' | 'crowd' | 'building';
const ell = (u: number, v: number, cx: number, cy: number, rx: number, ry: number) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1;
const density = (s: Subject, u: number, v: number, seed: string) => {
	const sky = 0.08 + 0.16 * v;
	if (s === 'portrait') {
		if (ell(u, v, 0.5, 0.42, 0.18, 0.23) || ell(u, v, 0.5, 1.04, 0.42, 0.36)) return 0.6 + 0.32 * (1 - u);
		return 0.06 + 0.1 * u;
	}
	if (s === 'skyline') {
		const col = Math.floor(u * 9);
		const top = 0.34 + random(`${seed}-b${col}`) * 0.38;
		if (v > top) return Math.floor(v * 40) % 3 === 0 && Math.floor(u * 50) % 3 === 0 ? 0.22 : 0.82;
		return sky;
	}
	if (s === 'building') {
		if (u > 0.2 && u < 0.8 && v > 0.22) return Math.floor(v * 16) % 3 === 0 ? 0.3 : 0.72 + 0.2 * (u - 0.2);
		return v > 0.9 ? 0.9 : sky;
	}
	if (s === 'crowd') {
		for (let i = 0; i < 7; i++) {
			const cx = 0.08 + i * 0.14 + (random(`${seed}-c${i}`) - 0.5) * 0.06;
			const cy = 0.5 + random(`${seed}-h${i}`) * 0.14;
			if (ell(u, v, cx, cy, 0.06, 0.08) || ell(u, v, cx, cy + 0.32, 0.1, 0.24)) return 0.8;
		}
		return sky;
	}
	if (ell(u, v, 0.68, 0.4, 0.1, 0.13)) return 0.03;
	const ground = 0.6 + Math.sin(u * 7 + random(seed) * 6) * 0.04;
	return v > ground ? 0.7 + 0.2 * v : 0.1 + 0.3 * v;
};
export const Halftone: React.FC<{tk: EditorialTokens; w: number; h: number; subject: Subject; seed: string; pitch?: number; grow?: number; spot?: boolean}> = ({tk, w, h, subject, seed, pitch = 12, grow = 1, spot = false}) => {
	const cols = Math.max(1, Math.floor(w / pitch)), rows = Math.max(1, Math.floor(h / pitch));
	const ox = (w - cols * pitch) / 2 + pitch / 2, oy = (h - rows * pitch) / 2 + pitch / 2;
	const sx = 0.25 + random(`${seed}-sx`) * 0.5, sy = 0.2 + random(`${seed}-sy`) * 0.3;
	const dots: React.ReactNode[] = [];
	for (let j = 0; j < rows; j++)
		for (let i = 0; i < cols; i++) {
			const u = (i + 0.5) / cols, v = (j + 0.5) / rows;
			const r = Math.sqrt(density(subject, u, v, seed)) * pitch * 0.52 * grow;
			if (r < 0.5) continue;
			const red = spot && ell(u, v, sx, sy, 0.08, 0.06);
			dots.push(<circle key={`${i}-${j}`} cx={ox + i * pitch} cy={oy + j * pitch} r={r} fill={red ? tk.pen.hex : tk.text} />);
		}
	return (
		<svg width={w} height={h} style={{display: 'block'}}>
			{dots}
		</svg>
	);
};

/** Hand-drawn ellipse that overshoots and spirals by 12 percent, in a 100 x 100 box. */
export const ringPath = (seed: string, over = 1.12) => {
	const n = 48, a0 = -2.4 + random(seed) * 0.6;
	const pts: string[] = [];
	for (let i = 0; i <= n; i++) {
		const t = i / n, a = a0 + t * Math.PI * 2 * over, g = 1 + (t - 0.5) * 0.1;
		pts.push(`${(50 + Math.cos(a) * 50 * g).toFixed(1)} ${(50 + Math.sin(a) * 50 * g * 0.94).toFixed(1)}`);
	}
	return `M${pts.join(' L')}`;
};

/** A pen mark over an inline span: an SVG that stretches over the span, stroke kept at `w` px. */
export const PenOver: React.FC<{d: string; color: string; w: number; p: number; inset?: [number, number]; blend?: boolean}> = ({d, color, w, p, inset = [0, 0]}) => (
	<svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', left: -inset[0], right: -inset[0], top: -inset[1], bottom: -inset[1], width: `calc(100% + ${inset[0] * 2}px)`, height: `calc(100% + ${inset[1] * 2}px)`, overflow: 'visible', pointerEvents: 'none'}}>
		<path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" {...drawProps(p)} />
	</svg>
);
const drawProps = (p: number) => (p >= 1 ? {} : {pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - Math.max(0, Math.min(1, p))});
