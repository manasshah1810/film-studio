import React from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import ds from '../../../styles/tactical-vector-maps/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * tactical-vector-maps specimen: one 6 s supply route story, 1080 x 1920 at 30 fps. Mode C, data first, no people.
 * A fictional map. Layered landmasses (shelf, lowland, highland, ridge, shadow), a coordinate grid with rulers,
 * a dashed Bezier supply route traced onto the map, a cut at the strait with a serif stamp, a reroute, radar
 * pings on numbered pin beacons, a DayDial timeline, and a map camera that pans and zooms by coordinate and
 * ends with an elastic pull-back. Every point is projected each frame so strokes stay crisp at any zoom.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 180;
export const SHEET_FRAMES = [40, 80, 176];
const W = 1080;
const H = 1920;
const FPS = 30;
const T = ds.tokens;
const SPR = ds.motion.springs;

/** Text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	title: {x: 8, y: 8, w: 76, h: 12},
	tag: {x: 18, y: 22.6, w: 29, h: 3.6},
	stamp: {x: 52, y: 25.5, w: 27, h: 5},
	plate1: {x: 8, y: 61, w: 22, h: 5.5},
	plate2: {x: 33, y: 61, w: 22, h: 5.5},
	plate3: {x: 58, y: 61, w: 22, h: 5.5},
	dial: {x: 8, y: 68, w: 24, h: 12},
	stat: {x: 36, y: 68, w: 49, h: 12},
};
const px = (b: {x: number; y: number; w: number; h: number}) => ({left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H});

/** Map card, rulers and the view rectangle the map is drawn in. */
const CARD = {x: 65, y: 413, w: 950, h: 730};
const RL = T.map.ruler.left;
const RB = T.map.ruler.bottom;
const VIEW = {l: CARD.x + RL, t: CARD.y, r: CARD.x + CARD.w, b: CARD.y + CARD.h - RB};
const VC = {x: (VIEW.l + VIEW.r) / 2, y: (VIEW.t + VIEW.b) / 2};
const K = T.map.to_px;

type P = {x: number; y: number};
/** Fictional landmasses in a 1000 x 800 authoring space. They bleed off every edge of the map. */
const LAND: {id: string; pts: [number, number][]; faction?: 'faction_a' | 'faction_b' | 'faction_c'}[] = [
	{id: 'west', faction: 'faction_a', pts: [[-400, -400], [280, -400], [280, -200], [282, -60], [290, 30], [276, 100], [262, 165], [276, 225], [290, 285], [278, 340], [262, 385], [240, 440], [236, 500], [258, 560], [252, 620], [240, 700], [245, 900], [245, 1200], [-400, 1200]]},
	{id: 'east', faction: 'faction_b', pts: [[1400, -400], [700, -400], [700, -200], [698, -60], [690, 30], [706, 100], [724, 165], [710, 225], [692, 285], [704, 340], [700, 385], [728, 440], [736, 500], [710, 560], [722, 620], [732, 700], [715, 900], [715, 1200], [1400, 1200]]},
	{id: 'north', faction: 'faction_c', pts: [[420, -400], [600, -400], [600, -200], [592, -60], [575, 80], [545, 170], [500, 250], [470, 300], [440, 235], [418, 140], [406, 40], [408, -60], [412, -200]]},
	{id: 'isle', pts: [[430, 445], [480, 430], [540, 450], [565, 495], [520, 535], [455, 530], [420, 490]]},
];
const ALDER: P = {x: 262, y: 385};
const KEST: P = {x: 700, y: 385};
const MAPC: P = {x: 500, y: 400};
const bez = (a: P, b: P, c: P, d: P, t: number): P => {
	const u = 1 - t;
	return {x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x, y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y};
};
const N = 160;
const sample = (a: P, b: P, c: P, d: P) => Array.from({length: N + 1}, (_, k) => bez(a, b, c, d, k / N));
const DIRECT = sample(ALDER, {x: 380, y: 368}, {x: 590, y: 372}, KEST);
const STRAIT = bez(ALDER, {x: 380, y: 368}, {x: 590, y: 372}, KEST, 0.5);
const KCUT = Math.round(N * 0.5);
const R1 = DIRECT.slice(0, KCUT + 1); // Alder to the strait
const GHOST = DIRECT.slice(KCUT); // the cut remainder
const R2 = sample(ALDER, {x: 270, y: 820}, {x: 690, y: 830}, KEST); // the reroute
const cumLen = (pts: P[]) => pts.reduce<number[]>((a, p, k) => {
	a.push(k === 0 ? 0 : a[k - 1] + Math.hypot(p.x - pts[k - 1].x, p.y - pts[k - 1].y));
	return a;
}, []);
const pointAt = (pts: P[], cum: number[], p: number): P => {
	const L = Math.min(1, Math.max(0, p)) * cum[cum.length - 1];
	let k = 1;
	while (k < cum.length - 1 && cum[k] < L) k++;
	const u = (L - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]);
	return {x: pts[k - 1].x + (pts[k].x - pts[k - 1].x) * u, y: pts[k - 1].y + (pts[k].y - pts[k - 1].y) * u};
};
const CUM1 = cumLen(R1);
const CUM2 = cumLen(R2);

/** Timeline in frames. */
const F = {r1: [14, 50], cut: 50, stamp: 54, r2: [92, 132], arrive: 132, dwellEnd: 78, panEnd: 92};
const DAYS = 24;
const dayAt = (f: number) => DAYS * Math.min(1, Math.max(0, (f - 8) / 164));
const DAY_EVENTS = [Math.floor(dayAt(F.cut)), Math.floor(dayAt(F.r2[0])), Math.floor(dayAt(F.arrive))];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (n: keyof typeof ds.motion.easings) => Easing.bezier(...(ds.motion.easings[n] as [number, number, number, number]));
const smooth = (u: number) => u * u * (3 - 2 * u);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpP = (a: P, b: P, t: number): P => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
const p1Of = (f: number) => interpolate(f, F.r1, [0, 1], {...clamp, easing: ease('trace')});
const p2Of = (f: number) => interpolate(f, F.r2, [0, 1], {...clamp, easing: ease('trace')});
const sp = (f: number, cfg: {damping: number; stiffness: number; mass: number}) => spring({frame: f, fps: FPS, config: cfg});

/** The map camera: a centre in authoring coordinates and a zoom. */
const camAt = (f: number): {c: P; s: number} => {
	if (f <= F.r1[0]) return {c: ALDER, s: 2.0};
	if (f <= F.r1[1]) {
		const e = p1Of(f);
		return {c: lerpP(ALDER, STRAIT, e), s: 2.0 + 0.1 * e};
	}
	if (f <= F.dwellEnd) {
		const u = interpolate(f, [F.r1[1], F.dwellEnd], [0, 1], {...clamp, easing: ease('pan')});
		return {c: STRAIT, s: 2.1 + 0.3 * u};
	}
	if (f <= F.panEnd) {
		const u = interpolate(f, [F.dwellEnd, F.panEnd], [0, 1], {...clamp, easing: ease('pan')});
		return {c: lerpP(STRAIT, ALDER, u), s: 2.4 - 0.6 * u};
	}
	if (f <= F.r2[1]) {
		const e = p2Of(f);
		return {c: pointAt(R2, CUM2, e), s: 1.8 - 0.3 * e};
	}
	const q = sp(f - F.arrive, SPR.elastic); // overshoots, so the pull-back is elastic
	return {c: lerpP(KEST, MAPC, q), s: 1.5 - 0.65 * q};
};

const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const blend = (a: string, b: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
type Roles = Record<string, string>;
const pts2d = (pts: P[]) => pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
/** Closed Catmull-Rom spline through the projected points, as a cubic Bezier path. */
const closedSpline = (q: P[]) => {
	const n = q.length;
	let d = `M${q[0].x.toFixed(1)} ${q[0].y.toFixed(1)}`;
	for (let i = 0; i < n; i++) {
		const p0 = q[(i - 1 + n) % n];
		const p1 = q[i];
		const p2 = q[(i + 1) % n];
		const p3 = q[(i + 2) % n];
		d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
	}
	return d + ' Z';
};

/** One rolling digit column. pos is the continuous digit position; the strip is 0 to 9 then 0 again. */
const Digit: React.FC<{pos: number; size: number; color: string; visible: number; style: React.CSSProperties}> = ({pos, size, color, visible, style}) => {
	const m = ((pos % 10) + 10) % 10;
	return (
		<div style={{width: size * 0.62, height: size, overflow: 'hidden', position: 'relative', opacity: visible}}>
			<div style={{...style, color, position: 'absolute', left: 0, top: 0, width: '100%', textAlign: 'center', transform: `translateY(${-m * size}px)`, lineHeight: 1}}>
				{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, k) => (
					<div key={k} style={{height: size}}>{d}</div>
				))}
			</div>
		</div>
	);
};
const Odometer: React.FC<{value: number; cols: number; size: number; color: string; style: React.CSSProperties; rollFrom?: number}> = ({value, cols, size, color, style, rollFrom = 0.5}) => (
	<div style={{display: 'flex', flexDirection: 'row', height: size}}>
		{Array.from({length: cols}, (_, k) => cols - 1 - k).map((k) => {
			const q = value / 10 ** k;
			const base = Math.floor(q);
			const fr = q - base;
			const pos = base + smooth(Math.min(1, Math.max(0, (fr - rollFrom) / (1 - rollFrom))));
			const vis = k === 0 ? 1 : Math.min(1, Math.max(0, (q - 0.5) / 0.5));
			return <Digit key={k} pos={pos} size={size} color={color} visible={vis} style={style} />;
		})}
	</div>
);

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
	const pal = ds.palettes.find((p) => p.id === palette) ?? ds.palettes[0];
	const c = pal.roles as Roles;
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const alert = c.alert ?? c.highlight;
	const muted = c.muted ?? blend(c.ink, c.surface, 0.72);
	const tnum: React.CSSProperties = {fontVariantNumeric: 'tabular-nums'};

	const cam = camAt(f);
	const proj = (a: P): P => ({x: VC.x + (a.x - cam.c.x) * K * cam.s, y: VC.y + (a.y - cam.c.y) * K * cam.s});
	const inView = (p: P, m: number) => p.x >= VIEW.l + m && p.x <= VIEW.r - m && p.y >= VIEW.t + m && p.y <= VIEW.b - m;

	// elevation colours: tier 2 lowland, tier 3 highland, tier 4 ridge, tier 1 shelf, shadow below it all
	const shadowC = blend('#000000', c.bg, 0.55);
	const shelfC = blend(c.surface, c.bg, 0.35);
	const bands = (fac?: string) => {
		const t = (col: string) => (fac ? blend(c[fac], col, T.land.faction_tint) : col);
		return {low: t(c.surface), high: t(blend(c.ink, c.surface, 0.10)), ridge: t(blend(c.ink, c.surface, 0.20))};
	};

	const cardIn = interpolate(f, [2, 14], [0, 1], {...clamp, easing: ease('roll')});
	const titleIn = (s: number) => interpolate(f, [s, s + 10], [0, 1], {...clamp, easing: ease('roll')});
	const pop = (s: number) => (f >= s ? sp(f - s, SPR.pop) : 0);

	// routes, projected this frame
	const p1 = p1Of(f);
	const p2 = p2Of(f);
	const S1 = R1.map(proj);
	const S2 = R2.map(proj);
	const SG = GHOST.map(proj);
	const len = (q: P[]) => cumLen(q)[q.length - 1];
	const L1 = len(S1);
	const L2 = len(S2);
	const head1 = pointAt(S1, cumLen(S1), p1);
	const head2 = pointAt(S2, cumLen(S2), p2);
	const march = -Math.min(f, F.dwellEnd) * T.route.march_px_per_frame;
	const march2 = -f * T.route.march_px_per_frame;
	const r1Dead = interpolate(f, [F.dwellEnd, F.dwellEnd + 12], [1, T.route.dead_alpha], clamp);
	const ghostIn = interpolate(f, [F.cut, F.cut + 8], [0, 1], clamp);

	// beacons: Alder, the strait, Kestrel
	const BEACONS = [
		{n: 1, at: ALDER, start: 6, col: c.highlight},
		{n: 2, at: STRAIT, start: F.cut, col: alert},
		{n: 3, at: KEST, start: F.arrive, col: c.highlight},
	];

	// grid lines in authoring units
	const gs = T.grid.spacing;
	const vLines: {k: number; x: number}[] = [];
	for (let k = -8; k <= 14; k++) {
		const x = VC.x + (k * gs - cam.c.x) * K * cam.s;
		if (x > VIEW.l + 4 && x < VIEW.r - 4) vLines.push({k, x});
	}
	const hLines: {j: number; y: number}[] = [];
	for (let j = -8; j <= 12; j++) {
		const y = VC.y + (j * gs - cam.c.y) * K * cam.s;
		if (y > VIEW.t + 4 && y < VIEW.b - 4) hLines.push({j, y});
	}
	const lon = (k: number) => 20 + k * 10;
	const lat = (j: number) => 60 - j * 10;
	const fmt = (v: number, pos: string, neg: string) => `${Math.abs(v)}°${v >= 0 ? pos : neg}`;

	const day = dayAt(f);
	const km = 2140 * p2;
	const label: React.CSSProperties = {...fontCss(pair.mono, 34), color: muted, whiteSpace: 'nowrap', ...tnum};
	const dialBox = px(BOXES.dial);
	const dcx = dialBox.left + dialBox.width / 2;
	const dcy = dialBox.top + dialBox.height / 2;
	const circ = 2 * Math.PI * 108;
	const dialIn = pop(8);
	const statIn = pop(84);
	const stampS = f >= F.stamp ? sp(f - F.stamp, SPR.stamp) : 0;
	const stampBox = px(BOXES.stamp);

	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			{/* title */}
			<div style={{position: 'absolute', ...px(BOXES.title), ...fontCss(pair.display, 108), color: c.ink}}>
				<div style={{opacity: titleIn(2), transform: `translateY(${(1 - titleIn(2)) * 40}px)`}}>Strait closed.</div>
				<div style={{opacity: titleIn(8), transform: `translateY(${(1 - titleIn(8)) * 40}px)`, color: c.primary}}>Route rerouted.</div>
			</div>

			{/* map card */}
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, opacity: cardIn}}>
				<defs>
					<clipPath id={`card${uid}`}><rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={T.card.radius} /></clipPath>
					<clipPath id={`view${uid}`}><rect x={VIEW.l} y={VIEW.t} width={VIEW.r - VIEW.l} height={VIEW.b - VIEW.t} /></clipPath>
					{LAND.map((ld) => (
						<clipPath key={ld.id} id={`land-${ld.id}${uid}`}><path d={closedSpline(ld.pts.map((p) => proj({x: p[0], y: p[1]})))} /></clipPath>
					))}
					<mask id={`m1${uid}`} maskUnits="userSpaceOnUse" x={VIEW.l} y={VIEW.t} width={VIEW.r - VIEW.l} height={VIEW.b - VIEW.t}>
						<path d={pts2d(S1)} fill="none" stroke="#fff" strokeWidth={T.route.mask_width} strokeDasharray={L1} strokeDashoffset={L1 * (1 - p1)} />
					</mask>
					<mask id={`m2${uid}`} maskUnits="userSpaceOnUse" x={VIEW.l} y={VIEW.t} width={VIEW.r - VIEW.l} height={VIEW.b - VIEW.t}>
						<path d={pts2d(S2)} fill="none" stroke="#fff" strokeWidth={T.route.mask_width} strokeDasharray={L2} strokeDashoffset={L2 * (1 - p2)} />
					</mask>
				</defs>
				<g clipPath={`url(#card${uid})`}>
					<rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} fill={c.bg} />
					<g clipPath={`url(#view${uid})`}>
						{/* landmasses: shadow, shelf, ridge fill, highland and lowland bands, coast */}
						{LAND.map((ld) => {
							const q = ld.pts.map((p) => proj({x: p[0], y: p[1]}));
							const d = closedSpline(q);
							const b = bands(ld.faction && c[ld.faction] ? ld.faction : undefined);
							const coast = ld.faction && c[ld.faction] ? hexA(c[ld.faction], 0.8) : hexA(c.ink, T.land.coast.alpha);
							return (
								<g key={ld.id}>
									<path d={d} transform={`translate(0 ${T.land.shadow.dy * cam.s})`} fill={shadowC} />
									<path d={d} fill="none" stroke={shelfC} strokeWidth={2 * T.land.shelf.width * cam.s} strokeLinejoin="round" />
									<path d={d} fill={b.ridge} />
									<g clipPath={`url(#land-${ld.id}${uid})`}>
										<path d={d} fill="none" stroke={b.high} strokeWidth={2 * T.land.bands.mid_depth * cam.s} strokeLinejoin="round" />
										<path d={d} fill="none" stroke={b.low} strokeWidth={2 * T.land.bands.edge_depth * cam.s} strokeLinejoin="round" />
									</g>
									<path d={d} fill="none" stroke={coast} strokeWidth={ld.faction && c[ld.faction] ? 3 : T.land.coast.width} strokeLinejoin="round" />
								</g>
							);
						})}

						{/* coordinate grid overlay */}
						{vLines.map(({k, x}) => <line key={`v${k}`} x1={x} x2={x} y1={VIEW.t} y2={VIEW.b} stroke={hexA(c.ink, T.grid.alpha)} strokeWidth={T.grid.width} />)}
						{hLines.map(({j, y}) => <line key={`h${j}`} x1={VIEW.l} x2={VIEW.r} y1={y} y2={y} stroke={hexA(c.ink, T.grid.alpha)} strokeWidth={T.grid.width} />)}
						{vLines.flatMap(({k, x}) => hLines.map(({j, y}) => (
							<path key={`t${k}_${j}`} d={`M${x - T.grid.tick} ${y} H${x + T.grid.tick} M${x} ${y - T.grid.tick} V${y + T.grid.tick}`} stroke={hexA(c.ink, 0.4)} strokeWidth={2} />
						)))}

						{/* the cut remainder of the direct route, then the dead route, then the live reroute */}
						<path d={pts2d(SG)} fill="none" stroke={alert} strokeWidth={T.route.width * 0.75} strokeDasharray={T.route.ghost.dash.join(' ')} opacity={T.route.ghost.alpha * ghostIn} />
						<g mask={`url(#m1${uid})`} opacity={r1Dead}>
							<path d={pts2d(S1)} fill="none" stroke={c.primary} strokeWidth={T.route.width} strokeDasharray={T.route.dash.join(' ')} strokeDashoffset={march} />
						</g>
						<g mask={`url(#m2${uid})`}>
							<path d={pts2d(S2)} fill="none" stroke={c.primary} strokeWidth={T.route.width} strokeDasharray={T.route.dash.join(' ')} strokeDashoffset={march2} />
						</g>
						{p1 > 0.002 && p1 < 0.999 && <circle cx={head1.x} cy={head1.y} r={T.route.head_radius} fill={c.ink} stroke={c.primary} strokeWidth={4} />}
						{p2 > 0.002 && p2 < 0.999 && <circle cx={head2.x} cy={head2.y} r={T.route.head_radius} fill={c.ink} stroke={c.primary} strokeWidth={4} />}

						{/* the cut: an X on the strait */}
						{f >= F.cut && (() => {
							const s = proj(STRAIT);
							const a = 20 * Math.min(1.15, pop(F.cut));
							return <path d={`M${s.x - a} ${s.y - a} L${s.x + a} ${s.y + a} M${s.x + a} ${s.y - a} L${s.x - a} ${s.y + a}`} stroke={alert} strokeWidth={8} strokeLinecap="round" />;
						})()}

						{/* beacons with radar pings */}
						{BEACONS.map((bc) => {
							if (f < bc.start) return null;
							const s = proj(bc.at);
							if (!inView(s, -60)) return null;
							const age = f - bc.start;
							const pg = T.beacon.ping;
							return (
								<g key={bc.n}>
									{Array.from({length: pg.rings}, (_, r) => {
										const a = age - r * pg.stagger;
										if (a < 0) return null;
										const u = (a % pg.period) / pg.period;
										const rad = lerp(T.beacon.radius + 2, pg.max_radius, 1 - (1 - u) * (1 - u));
										return <circle key={r} cx={s.x} cy={s.y} r={rad} fill="none" stroke={bc.col} strokeWidth={pg.width} opacity={0.9 * (1 - u) ** pg.alpha_curve} />;
									})}
									{bc.n !== 2 && <circle cx={s.x} cy={s.y} r={T.beacon.radius * Math.min(1.2, pop(bc.start))} fill={bc.col} stroke={c.bg} strokeWidth={4} />}
								</g>
							);
						})}
					</g>

					{/* rulers: opaque strips that hold the coordinate labels */}
					<rect x={CARD.x} y={CARD.y} width={RL} height={CARD.h} fill={c.surface} />
					<rect x={CARD.x} y={VIEW.b} width={CARD.w} height={RB} fill={c.surface} />
					{vLines.map(({k, x}) => <line key={`rv${k}`} x1={x} x2={x} y1={VIEW.b} y2={VIEW.b + 14} stroke={hexA(c.ink, 0.5)} strokeWidth={2} />)}
					{hLines.map(({j, y}) => <line key={`rh${j}`} x1={VIEW.l - 14} x2={VIEW.l} y1={y} y2={y} stroke={hexA(c.ink, 0.5)} strokeWidth={2} />)}
				</g>
				<rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={T.card.radius} fill="none" stroke={hexA(c.ink, T.card.border.alpha)} strokeWidth={T.card.border.width} />
			</svg>

			{/* ruler labels, on the opaque strips */}
			<div style={{opacity: cardIn}}>
				{hLines.filter(({y}) => y > VIEW.t + 26 && y < VIEW.b - 26).map(({j, y}) => (
					<div key={`lh${j}`} style={{position: 'absolute', left: CARD.x, width: RL - 20, top: y - 21, textAlign: 'right', ...label}}>{fmt(lat(j), 'N', 'S')}</div>
				))}
				{vLines.filter(({x}) => x > VIEW.l + 60 && x < VIEW.r - 60).map(({k, x}) => (
					<div key={`lv${k}`} style={{position: 'absolute', left: x - 60, width: 120, top: VIEW.b + 16, textAlign: 'center', ...label}}>{fmt(lon(k), 'E', 'W')}</div>
				))}
			</div>

			{/* numbered pins: the stem tip sits on the beacon */}
			{BEACONS.map((bc) => {
				if (f < bc.start) return null;
				const s = proj(bc.at);
				const cy = s.y - T.pin.stem - T.pin.badge_radius;
				if (!inView({x: s.x, y: cy - T.pin.badge_radius}, 10) || !inView(s, 10)) return null;
				const sc = Math.min(1.15, pop(bc.start));
				return (
					<div key={bc.n}>
						<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
							<line x1={s.x} y1={s.y} x2={s.x} y2={cy} stroke={bc.col} strokeWidth={4} strokeLinecap="butt" />
							{bc.n === 2 && stampS > 0 && <line x1={Math.min(stampBox.left + stampBox.width - 30, Math.max(stampBox.left + 30, s.x))} y1={stampBox.top + stampBox.height - 4} x2={s.x} y2={cy - T.pin.badge_radius} stroke={alert} strokeWidth={4} opacity={Math.min(1, stampS * 2)} />}
							<circle cx={s.x} cy={cy} r={T.pin.badge_radius * sc} fill={bc.col} />
						</svg>
						<div style={{position: 'absolute', left: s.x - 30, top: cy - 21, width: 60, textAlign: 'center', ...fontCss(pair.mono, 34), color: c.bg, lineHeight: '42px', transform: `scale(${sc})`}}>{bc.n}</div>
					</div>
				);
			})}

			{/* map tag, on an opaque plate */}
			<div style={{position: 'absolute', ...px(BOXES.tag), boxSizing: 'border-box', background: c.surface, border: `${T.card.border.width}px solid ${hexA(c.ink, 0.3)}`, borderRadius: 14, padding: '0 16px', display: 'flex', alignItems: 'center', ...fontCss(pair.mono, 34), color: c.ink, whiteSpace: 'nowrap', opacity: cardIn}}>FICTIONAL MAP</div>

			{/* serif stamp on the strait */}
			{stampS > 0 && (
				<div style={{position: 'absolute', left: stampBox.left, top: stampBox.top, width: stampBox.width, height: stampBox.height, boxSizing: 'border-box', background: c.surface, border: `${T.stamp.border}px solid ${alert}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', ...fontCss(pair.accent, 56), textTransform: 'uppercase', color: alert, whiteSpace: 'nowrap', opacity: Math.min(1, stampS * 3), transform: `rotate(${T.stamp.rotate}deg) scale(${lerp(T.stamp.from_scale, 1, Math.min(1.08, stampS))})`}}>Closed</div>
			)}

			{/* callout plates */}
			{[
				{box: BOXES.plate1, n: 1, name: 'ALDER', val: 'DEPART', col: c.ink, at: 10},
				{box: BOXES.plate2, n: 2, name: 'NARROWS', val: 'CLOSED', col: alert, at: F.stamp},
				{box: BOXES.plate3, n: 3, name: 'KESTREL', val: 'ARRIVE', col: c.primary, at: F.arrive + 4},
			].map((pl) => {
				const pp = pop(pl.at);
				const b = px(pl.box);
				return (
					<div key={pl.n} style={{position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height, boxSizing: 'border-box', background: c.surface, border: `${T.plate.border.width}px solid ${alert}`, borderRadius: T.plate.radius, padding: '6px 18px', opacity: Math.min(1, pp * 3), transform: `scale(${0.9 + 0.1 * Math.min(1.1, pp)})`, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
						<div style={{...fontCss(pair.mono, 34), color: c.ink, lineHeight: 1.1, whiteSpace: 'nowrap'}}>{pl.n} {pl.name}</div>
						<div style={{...fontCss(pair.body, 44), color: pl.col, lineHeight: 1.05, whiteSpace: 'nowrap'}}>{pl.val}</div>
					</div>
				);
			})}

			{/* DayDial */}
			<div style={{position: 'absolute', ...dialBox, boxSizing: 'border-box', background: c.surface, border: `${T.card.border.width}px solid ${hexA(c.ink, T.card.border.alpha)}`, borderRadius: T.card.radius, opacity: Math.min(1, dialIn * 3)}} />
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, dialIn * 3)}}>
				{Array.from({length: T.dial.ticks}, (_, d) => {
					const a = (d / T.dial.ticks) * Math.PI * 2 - Math.PI / 2;
					const ev = DAY_EVENTS.indexOf(d);
					const r1 = ev >= 0 ? 72 : 84;
					const col = ev === 0 ? alert : ev > 0 ? c.primary : c.ink;
					const on = d < day;
					return <line key={d} x1={dcx + Math.cos(a) * r1} y1={dcy + Math.sin(a) * r1} x2={dcx + Math.cos(a) * 100} y2={dcy + Math.sin(a) * 100} stroke={col} strokeWidth={ev >= 0 ? 6 : 4} strokeLinecap="butt" opacity={ev >= 0 ? (on ? 1 : 0.55) : on ? 0.9 : 0.25} />;
				})}
				<circle cx={dcx} cy={dcy} r={108} fill="none" stroke={hexA(c.ink, 0.14)} strokeWidth={T.dial.progress_width} />
				<circle cx={dcx} cy={dcy} r={108} fill="none" stroke={c.primary} strokeWidth={T.dial.progress_width} strokeDasharray={circ} strokeDashoffset={circ * (1 - day / DAYS)} transform={`rotate(-90 ${dcx} ${dcy})`} />
				<circle cx={dcx + Math.cos((day / DAYS) * Math.PI * 2 - Math.PI / 2) * 108} cy={dcy + Math.sin((day / DAYS) * Math.PI * 2 - Math.PI / 2) * 108} r={10} fill={c.ink} stroke={c.primary} strokeWidth={4} />
			</svg>
			<div style={{position: 'absolute', left: dcx - 60, top: dcy - 56, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: Math.min(1, dialIn * 3)}}>
				<div style={{...fontCss(pair.mono, 34), color: muted, lineHeight: 1.1}}>DAY</div>
				<Odometer value={Math.min(DAYS, day)} rollFrom={0.6} cols={2} size={72} color={c.ink} style={{...fontCss(pair.display, 72), ...tnum}} />
			</div>

			{/* stat card */}
			{(() => {
				const b = px(BOXES.stat);
				return (
					<div style={{position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height, boxSizing: 'border-box', background: c.surface, border: `${T.card.border.width}px solid ${hexA(c.ink, T.card.border.alpha)}`, borderRadius: T.card.radius, padding: '10px 28px', opacity: Math.min(1, statIn * 3), transform: `translateY(${(1 - Math.min(1, statIn)) * 60}px)`, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
						<div style={{...fontCss(pair.mono, 34), color: muted, lineHeight: 1.1}}>DETOUR ADDED</div>
						<div style={{display: 'flex', alignItems: 'center', height: 84}}>
							<Odometer value={km} cols={4} size={84} color={alert} style={{...fontCss(pair.display, 84), ...tnum}} />
							<div style={{...fontCss(pair.display, 44), color: alert, marginLeft: 14}}>KM</div>
						</div>
						<div style={{...fontCss(pair.mono, 34), color: muted, lineHeight: 1.1}}>ILLUSTRATIVE DATA</div>
					</div>
				);
			})()}
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'night-atlas', pairing = 'oswald-inter-playfair'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: the route trace, the cut and stamp at the strait, the elastic pull-back finish. */
export const PreviewSheet: React.FC<PreviewProps> = (props) => (
	<AbsoluteFill style={{flexDirection: 'row'}}>
		{SHEET_FRAMES.map((fr) => (
			<div key={fr} style={{position: 'relative', width: W, height: H, flex: 'none'}}>
				<Freeze frame={fr}>
					<Preview {...props} />
				</Freeze>
			</div>
		))}
	</AbsoluteFill>
);
export const SHEET_SIZE = {width: W * SHEET_FRAMES.length, height: H};
