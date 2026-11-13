import React from 'react';
import type {Role, Shape, Zone} from './types';
import {outline, ptsToD, smoothD, wobble} from './shapes';
import {fitBox} from './layout';
import {clamp01, useColor} from './tokens';

export type MarkOpts = {
	/** stroke role for outlines; null = no outlines at all */
	outline?: Role | null;
	/** outline every filled shape, even ones without a stroke in the definition */
	outlineAll?: boolean;
	sw?: number; // outline width in shape units
	wobble?: number; // hand wobble amplitude, shape units
	passes?: 1 | 2; // 2 = sketchy double stroke
	fill?: 'flat' | 'hatch' | 'none';
	hatch?: {gap: number; w: number; angle: number};
	enter?: 'draw' | 'pop' | 'cut' | 'fade' | 'drop' | 'slide';
	/** hard offset copy under every shape (cut-paper or cartoon shadow) */
	shadow?: {dx: number; dy: number; color: string; opacity?: number};
	filter?: string; // url(#id) applied to the whole group
	fillFilter?: string;
	fillOpacity?: number; // translucent fills (watercolour, coloured pencil)
	cap?: 'round' | 'butt' | 'square';
	color?: (role: Role, s: Shape) => string; // remap roles (e.g. silhouettes)
	lineScale?: number; // multiply limb / line widths
	ax?: number; ay?: number; // alignment inside the zone
	extra?: (s: Shape, d: string, i: number) => React.ReactNode;
	boilSeed?: string | number; // change to re-wobble (line boil)
};

/** One vector renderer for every flat style. A kit is mostly a choice of these options plus its own defs. */
export const VectorMarks: React.FC<{shapes: Shape[]; vb: [number, number]; zone: Zone; p: number; seed: string; flip?: boolean; kind?: 'figure' | 'prop'; opts: MarkOpts; dim?: boolean}> = ({shapes, vb, zone, p, seed, flip, kind, opts, dim}) => {
	const c = useColor();
	const col = (r: Role, s: Shape) => (opts.color ? opts.color(r, s) : c(r));
	const box = fitBox(zone, vb, opts.ax ?? 0.5, opts.ay ?? (kind === 'figure' ? 1 : 0.5));
	const k = box.w / vb[0];
	const sw = opts.sw ?? 1.6;
	const enter = opts.enter ?? 'fade';
	const pid = `h-${seed.replace(/[^a-z0-9]/gi, '')}`;
	const paths = shapes.map((s, i) => {
		const closed = s.t !== 'line';
		let pts = outline(s);
		const sd = `${seed}-${i}-${opts.boilSeed ?? 0}`;
		const fine = s.tag === 'face' || s.tag === 'acc' || s.tag === 'hand'; // small details stay crisp
		const mk = (pp: number[][], tag: string) => (opts.wobble ? smoothD(wobble(pp, opts.wobble * (fine ? 0.25 : 1), sd + tag, closed), closed) : ptsToD(pp, closed));
		return {s, closed, d: mk(pts, 'a'), d2: opts.passes === 2 && !fine ? mk(pts, 'b') : null};
	});
	const usedFills = [...new Set(shapes.map((s) => s.fill).filter((f): f is Role => !!f && f !== 'none'))];
	const group: React.CSSProperties =
		enter === 'pop' ? {transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `scale(${0.5 + 0.5 * p})`, opacity: clamp01(p * 4)}
		: enter === 'fade' ? {opacity: p}
		: enter === 'cut' ? {opacity: p > 0.01 ? 1 : 0}
		: enter === 'drop' ? {transform: `translateY(${(1 - p) * -vb[1] * 0.12}px)`, opacity: clamp01(p * 3)}
		: enter === 'slide' ? {transform: `translateX(${(1 - p) * (flip ? -1 : 1) * vb[0] * 0.3}px)`, opacity: clamp01(p * 3)}
		: {};
	const drawP = enter === 'draw' ? p : 1;
	const fillOp = enter === 'draw' ? clamp01((p - 0.45) / 0.4) : 1;
	const render = (shadow: boolean) =>
		paths.map(({s, closed, d, d2}, i) => {
			const isLine = s.t === 'line';
			const hasFill = closed && s.fill && s.fill !== 'none' && opts.fill !== 'none';
			// outline-free styles still need the stroke of shapes that are only a stroke (a clock face, a ring)
			const bare = opts.outline === null && closed && !!s.stroke && s.stroke !== 'none' && (!hasFill || s.fill === 'bg');
			const strokeRole: Role | null = isLine ? ((s.stroke as Role) ?? 'ink') : bare ? (s.stroke as Role) : opts.outline === null ? null : s.stroke && s.stroke !== 'none' ? (opts.outline ?? (s.stroke as Role)) : opts.outlineAll || (!hasFill && closed) ? (opts.outline ?? 'ink') : null;
			const lw = isLine ? (s as {w: number}).w * (opts.lineScale ?? 1) : (s.sw ?? sw);
			const stroke = shadow ? opts.shadow!.color : strokeRole ? col(isLine || bare ? strokeRole : (opts.outline ?? strokeRole), s) : 'none';
			// local draw progress so shapes draw one after another
			const n = paths.length;
			const lp = enter === 'draw' ? clamp01(drawP * (1 + n * 0.35) - i * 0.35) : 1;
			const dash = enter === 'draw' ? {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - lp} : {};
			return (
				<g key={i}>
					{hasFill && !(bare && s.fill === 'bg') ? (
						<path d={d} stroke="none" opacity={fillOp * (shadow ? 1 : opts.fillOpacity ?? 1)} filter={shadow ? undefined : opts.fillFilter}
							fill={shadow ? opts.shadow!.color : opts.fill === 'hatch' ? `url(#${pid}-${s.fill})` : col(s.fill as Role, s)} />
					) : null}
					{(strokeRole || shadow) && (isLine || strokeRole) ? (
						<>
							<path d={d} fill="none" stroke={stroke} strokeWidth={lw} strokeLinecap={opts.cap ?? 'round'} strokeLinejoin="round" {...dash} />
							{d2 && !shadow ? <path d={d2} fill="none" stroke={stroke} strokeWidth={lw * 0.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} {...dash} /> : null}
						</>
					) : null}
					{!shadow && opts.extra ? opts.extra(s, d, i) : null}
				</g>
			);
		});
	return (
		<svg viewBox={`0 0 ${vb[0]} ${vb[1]}`} width={box.w} height={box.h} style={{position: 'absolute', left: box.x, top: box.y, overflow: 'visible', opacity: dim ? 0.55 : 1}}>
			{opts.fill === 'hatch' ? (
				<defs>
					{usedFills.map((r) => (
						<pattern key={r} id={`${pid}-${r}`} patternUnits="userSpaceOnUse" width={opts.hatch?.gap ?? 4} height={opts.hatch?.gap ?? 4} patternTransform={`rotate(${opts.hatch?.angle ?? -38})`}>
							<line x1={0} y1={0} x2={opts.hatch?.gap ?? 4} y2={0} stroke={col(r, shapes[0])} strokeWidth={opts.hatch?.w ?? 1.6} strokeLinecap="round" />
						</pattern>
					))}
				</defs>
			) : null}
			<g transform={flip ? `translate(${vb[0]} 0) scale(-1 1)` : undefined}>
				<g style={group} filter={opts.filter}>
					{opts.shadow ? <g transform={`translate(${opts.shadow.dx / k} ${opts.shadow.dy / k})`} opacity={opts.shadow.opacity ?? 1}>{render(true)}</g> : null}
					{render(false)}
				</g>
			</g>
		</svg>
	);
};

/** Seeded paper / board grain as an SVG turbulence layer. `freq` and `opacity` come from design-system textures. */
export const Grain: React.FC<{id: string; freq: number; opacity: number; seed?: number; blend?: React.CSSProperties['mixBlendMode']; octaves?: number}> = ({id, freq, opacity, seed = 3, blend = 'multiply', octaves = 2}) => (
	<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity, mixBlendMode: blend, pointerEvents: 'none'}}>
		<filter id={id} x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={octaves} seed={seed} />
			<feColorMatrix type="saturate" values="0" />
		</filter>
		<rect width="100%" height="100%" filter={`url(#${id})`} />
	</svg>
);
