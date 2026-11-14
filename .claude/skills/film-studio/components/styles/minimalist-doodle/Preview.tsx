import React, {useId} from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import ds from '../../../styles/minimalist-doodle/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * minimalist-doodle specimen: one 6 s scene, 1080 x 1920 at 30 fps. A psychology explainer on a warm textured board.
 * An expressive illustrated host (bun, swept fringe, brows, eyes with catch-lights, a sweater in spot marker colour) is drawn
 * on in ink stroke by stroke, beside a hand-traced causal loop (Worry, Bad sleep, Tired brain). Cards spring-pop in, arrows
 * trace on, the loop closes, the host reacts, then points; LiveMarkup circles the cause and a RunningList checks off the fix.
 * Every ink line boils on twos (feTurbulence into feDisplacementMap); text and the board never boil. All text is DOM.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 180;
export const SHEET_FRAMES = [48, 124, 178];
const W = 1080;
const H = 1920;
const FPS = 30;
export const SHEET_SIZE = {width: W * SHEET_FRAMES.length, height: H};
const D = ds.doodle;
const M = ds.motion;
const T = ds.tokens;
const HOST = ds.host;

/** Text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	kicker: {x: 9, y: 6.5, w: 76, h: 2.4},
	title: {x: 9, y: 9.3, w: 76, h: 11.4},
	n1: {x: 37, y: 26.1, w: 27.8, h: 6},
	n2: {x: 56.9, y: 45.4, w: 27.8, h: 6},
	n3: {x: 15.3, y: 45.4, w: 27.8, h: 6},
	note: {x: 60, y: 54.5, w: 25, h: 3.6},
	lh: {x: 51, y: 60.5, w: 34, h: 3.6},
	i1: {x: 51, y: 65, w: 34, h: 3.4},
	i2: {x: 51, y: 69.5, w: 34, h: 3.4},
	i3: {x: 51, y: 74, w: 34, h: 3.4},
};
type Box = {x: number; y: number; w: number; h: number};
const abs = (b: Box) => ({position: 'absolute', left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H}) as React.CSSProperties;
const centre = (b: Box) => ({x: ((b.x + b.w / 2) / 100) * W, y: ((b.y + b.h / 2) / 100) * H});

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (n: keyof typeof M.easings) => Easing.bezier(...(M.easings[n] as [number, number, number, number]));
const seg = (f: number, a: number, b: number, e: keyof typeof M.easings = 'draw') => interpolate(f, [a, b], [0, 1], {...clamp, easing: ease(e)});
/** Draw-on progress for a stroke that starts at `s` and takes `n` frames. */
const dr = (f: number, s: number, n: number) => seg(f, s, s + n, 'draw');
const on2 = (f: number) => Math.floor(f / M.stepped.on) * M.stepped.on;
/** Spring sampled on twos, 0 before `start`. */
const sp = (f: number, start: number, cfg: keyof typeof M.springs) => (f < start ? 0 : spring({frame: on2(f - start), fps: FPS, config: M.springs[cfg]}));
const rad = (d: number) => (d * Math.PI) / 180;
const mixHex = (a: string, b: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const ch = (h: string, i: number) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3);
/** feColorMatrix rows: paint one flat colour, alpha from the noise. */
const flat = (h: string, a: string) => `0 0 0 0 ${ch(h, 1)} 0 0 0 0 ${ch(h, 3)} 0 0 0 0 ${ch(h, 5)} ${a}`;
type Roles = Record<string, string>;
type P2 = [number, number];

/** Focused palettes have 5 roles; the host and board roles they lack are derived. Text only ever uses ink. */
const rolesOf = (id: string): Roles => {
	const p = ds.palettes.find((x) => x.id === id) ?? ds.palettes[0];
	const r: Roles = {...(p.roles as Roles)};
	r.skin ??= r.surface;
	r.hair ??= r.ink;
	r.secondary ??= mixHex(r.primary, r.ink, 0.4);
	r.rule ??= mixHex(r.bg, r.ink, 0.18);
	r.shade ??= mixHex(r.bg, r.ink, 0.07);
	return r;
};

/* ---------- seeded hand-drawn geometry ---------- */
const fnv1a = (s: string) => {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
};
const mulberry32 = (seed: number) => () => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const n1 = (v: number) => v.toFixed(1);
/** Catmull-Rom through the points, as cubic Beziers. */
const smooth = (pts: P2[]) => {
	let d = `M ${n1(pts[0][0])} ${n1(pts[0][1])}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[i - 1] ?? pts[i];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[i + 2] ?? p2;
		d += ` C ${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
	}
	return d;
};
/**
 * A hand-drawn loop: a superellipse (n 2 = ellipse, n 8 = rounded box) with a smooth seeded wobble that depends only on the
 * angle, so the fill (turn 1) and the outline (turn > 1, overshooting its start) share one edge. `grow` spirals the overshoot out.
 */
const loop = (cx: number, cy: number, rx: number, ry: number, o: {n?: number; wobble?: number; seed: string; turn?: number; start?: number; grow?: number; k?: number}) => {
	const rnd = mulberry32(fnv1a(o.seed));
	const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
	const n = o.n ?? 2;
	const turn = o.turn ?? 1;
	const K = Math.round((o.k ?? 28) * turn);
	const pts: P2[] = [];
	for (let i = 0; i <= K; i++) {
		const a = rad(o.start ?? -150) + 2 * Math.PI * turn * (i / K);
		const c = Math.cos(a);
		const s = Math.sin(a);
		const g = 1 + (o.grow ?? 0) * (i / K);
		const w = (o.wobble ?? 3) * (0.6 * Math.sin(3 * a + ph[0]) + 0.3 * Math.sin(5 * a + ph[1]) + 0.1 * Math.sin(9 * a + ph[2]));
		pts.push([cx + (rx * g + w) * Math.sign(c) * Math.abs(c) ** (2 / n), cy + (ry * g + w) * Math.sign(s) * Math.abs(s) ** (2 / n)]);
	}
	return smooth(pts);
};
/** Quadratic arrow body plus a two-stroke head at the end, aligned to the end tangent. */
const arrow = (a: P2, c: P2, b: P2) => {
	const L = Math.hypot(b[0] - c[0], b[1] - c[1]);
	const u: P2 = [(b[0] - c[0]) / L, (b[1] - c[1]) / L];
	const hd = (s: number): P2 => {
		const r = rad(180 + s * T.arrow.head_deg);
		return [b[0] + T.arrow.head * (u[0] * Math.cos(r) - u[1] * Math.sin(r)), b[1] + T.arrow.head * (u[0] * Math.sin(r) + u[1] * Math.cos(r))];
	};
	const l = hd(1);
	const r = hd(-1);
	return {body: `M ${n1(a[0])} ${n1(a[1])} Q ${n1(c[0])} ${n1(c[1])} ${n1(b[0])} ${n1(b[1])}`, head: `M ${n1(l[0])} ${n1(l[1])} L ${n1(b[0])} ${n1(b[1])} L ${n1(r[0])} ${n1(r[1])}`};
};
/** Back-and-forth marker hatching that covers a box at an angle. Drawn on along its length, it reads as a marker fill. */
const scribble = (b: Box, angle: number, pitch: number, phase = 0) => {
	const cx = b.x + b.w / 2;
	const cy = b.y + b.h / 2;
	const R = Math.hypot(b.w, b.h) / 2 + pitch;
	const ux = Math.cos(rad(angle));
	const uy = Math.sin(rad(angle));
	const pts: string[] = [];
	let i = 0;
	for (let v = -R + phase; v <= R; v += pitch, i++) {
		const u0 = i % 2 ? R : -R;
		pts.push(`${n1(cx + u0 * ux - v * uy)} ${n1(cy + u0 * uy + v * ux)}`, `${n1(cx - u0 * ux - v * uy)} ${n1(cy - u0 * uy + v * ux)}`);
	}
	return 'M ' + pts.join(' L ');
};

/* ---------- drawing primitives ---------- */
const Ink: React.FC<{d: string; t: number; color: string; w?: number; fill?: string; op?: number}> = ({d, t, color, w = D.ink.line, fill = 'none', op = 1}) =>
	t <= 0 ? null : (
		<path d={d} fill={fill} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={op} {...(t < 1 ? {pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - t} : {})} />
	);

/** Spot marker fill: a scribble clipped to the shape, offset like a misregistered print, with darker streaks. */
const Fill: React.FC<{id: string; d: string; box: Box; color: string; t: number; ink: string; offset?: number[]; pitch?: number; width?: number; streak?: boolean}> = ({id, d, box, color, t, ink, offset = D.fill.offset, pitch = D.fill.pitch, width = D.fill.width, streak = true}) =>
	t <= 0 ? null : (
		<g transform={`translate(${offset[0]} ${offset[1]})`} clipPath={`url(#${id})`}>
			<defs>
				<clipPath id={id}>
					<path d={d} />
				</clipPath>
			</defs>
			<Ink d={scribble(box, D.fill.angle, pitch)} t={t} color={color} w={width} />
			{streak ? <Ink d={scribble(box, D.fill.angle, pitch, pitch / 2)} t={t} color={mixHex(color, ink, D.fill.streak.mix)} w={D.fill.streak.width} op={0.7} /> : null}
		</g>
	);

/* ---------- the host ---------- */
const NECK: P2 = [215, 1600];
const HEAD = 'M -100 -215 C -100 -290 -45 -325 5 -322 C 70 -320 108 -275 106 -205 C 104 -140 70 -88 8 -84 C -55 -82 -100 -135 -100 -215 Z';
const HAIR = 'M -112 -196 C -126 -292 -62 -350 12 -344 C 84 -338 124 -292 114 -232 C 104 -262 84 -282 50 -286 C 34 -262 0 -254 -34 -262 C -50 -258 -62 -250 -70 -240 C -76 -252 -90 -250 -98 -232 C -104 -222 -108 -206 -112 -196 Z';
const BACK = 'M -60 -300 C -125 -290 -142 -200 -120 -138 C -112 -116 -98 -110 -86 -120 L -86 -250 Z';
const BUN = loop(22, -352, 46, 44, {seed: 'bun', wobble: 2.5, turn: 1});
const EAR = 'M -97 -206 C -126 -212 -130 -164 -98 -158 Z';
const NECKF = 'M -34 -104 L 38 -104 L 40 4 L -32 4 Z';
const BODY = 'M -150 340 L -158 60 C -160 10 -118 -14 -60 -18 C -30 6 30 6 60 -18 C 118 -14 160 10 158 60 L 166 340 Z';
const UPPER = 'M -4 -32 C 50 -36 100 -32 140 -27 L 140 27 C 100 32 50 36 -4 32 Z';
const FORE = 'M 0 -27 C 40 -28 80 -26 110 -23 L 110 23 C 80 26 40 28 0 27 Z';
const HAND = 'M 108 -22 C 128 -32 150 -26 156 -12 L 198 -15 C 210 -15 210 1 198 1 L 156 4 C 152 22 128 30 108 22 Z';
/** The hand is drawn 1.4 times larger than the arm so the pointing finger reads at phone size. */
const HAND_K = 1.4;
const SHOULDER: P2 = [124, 26];
const ARM = HOST.arm;

const LOOP_CLOSE = 118;
const POINT = 128;
const BLINKS = [74, 160];

const Host: React.FC<{f: number; c: Roles; uid: string}> = ({f, c, uid}) => {
	const L = D.ink.line;
	const th = D.ink.thin;
	const bob = Math.round(4 * Math.sin((2 * Math.PI * on2(f)) / 48));
	const react = f >= LOOP_CLOSE && f < LOOP_CLOSE + 14;
	const hop = react ? -14 * Math.sin(Math.PI * Math.min(1, (on2(f) - LOOP_CLOSE) / 12)) : 0;
	const pk = sp(f, POINT, 'point');
	const a = ARM.rest_deg[0] + (ARM.point_deg[0] - ARM.rest_deg[0]) * pk;
	const b = ARM.rest_deg[1] + (ARM.point_deg[1] - ARM.rest_deg[1]) * pk;
	const tilt = HOST.asymmetry.head_tilt_deg * pk - (react ? 3 : 0);
	const blink = BLINKS.some((x) => f >= x && f < x + 3);
	const eyeK = blink ? 0.13 : react ? 1.35 : 1;
	const browUp = react ? 12 : 0;
	const look = pk * 3;
	const eyesIn = sp(f, 40, 'pop');
	const talk = f >= POINT + 4 && f < 168 && Math.floor((f - POINT - 4) / 6) % 2 === 0;
	const skinOn = f >= 22;
	const neckOn = f >= 26;
	const mouth = react ? 'o' : talk ? 'open' : 'smile';
	return (
		<g transform={`translate(${NECK[0]} ${NECK[1] + bob + hop})`}>
			{/* torso: sweater fill, then the line */}
			<Fill id={`${uid}-body`} d={BODY} box={{x: -170, y: -30, w: 340, h: 380}} color={c.primary} ink={c.ink} t={dr(f, 42, D.fill.frames)} />
			<Ink d="M -150 340 L -158 60 C -160 10 -118 -14 -60 -18 C -30 6 30 6 60 -18 C 118 -14 160 10 158 60 L 166 340" t={dr(f, 26, 14)} color={c.ink} />
			<Ink d="M -118 40 C -128 140 -130 230 -126 340" t={dr(f, 38, 5)} color={c.ink} w={th} />
			{/* neck */}
			{neckOn ? <path d={NECKF} fill={c.skin} /> : null}
			<Ink d="M -32 -100 L -30 0" t={dr(f, 24, 4)} color={c.ink} />
			<Ink d="M 36 -100 L 38 0" t={dr(f, 24, 4)} color={c.ink} />
			<Ink d="M -60 -18 C -40 26 40 26 60 -18" t={dr(f, 36, 4)} color={c.ink} w={th} />
			{/* head group, tilts about the neck */}
			<g transform={`rotate(${tilt} 0 -96)`}>
				<Fill id={`${uid}-bun`} d={BUN} box={{x: -26, y: -400, w: 96, h: 96}} color={c.hair} ink={c.ink} t={dr(f, 18, 6)} offset={[0, 0]} pitch={22} width={38} streak={false} />
				<Ink d={BUN} t={dr(f, 14, 6)} color={c.ink} />
				<Fill id={`${uid}-back`} d={BACK} box={{x: -145, y: -305, w: 62, h: 200}} color={c.hair} ink={c.ink} t={dr(f, 18, 6)} offset={[0, 0]} pitch={22} width={38} streak={false} />
				<Ink d="M -60 -300 C -125 -290 -142 -200 -120 -138 C -112 -116 -98 -110 -86 -120" t={dr(f, 14, 6)} color={c.ink} />
				{skinOn ? <path d={HEAD} fill={c.skin} /> : null}
				<Ink d={HEAD} t={dr(f, 10, 12)} color={c.ink} />
				{skinOn ? <path d={EAR} fill={c.skin} /> : null}
				<Ink d={EAR} t={dr(f, 22, 4)} color={c.ink} />
				<Ink d="M -104 -196 C -114 -192 -113 -176 -104 -172" t={dr(f, 25, 3)} color={c.ink} w={th} />
				<Fill id={`${uid}-hair`} d={HAIR} box={{x: -130, y: -350, w: 250, h: 160}} color={c.hair} ink={c.ink} t={dr(f, 28, 10)} offset={[0, 0]} pitch={22} width={38} streak={false} />
				<Ink d={HAIR} t={dr(f, 18, 12)} color={c.ink} />
				{/* flyaway strands from the bun */}
				<Ink d="M 44 -384 C 64 -402 80 -394 86 -410" t={dr(f, 26, 4)} color={c.ink} w={th} />
				<Ink d="M -4 -390 C -14 -406 -4 -416 -16 -426" t={dr(f, 27, 4)} color={c.ink} w={th} />
				{/* brows: the right one raised and turned, the asymmetry */}
				<g transform={`translate(0 ${-browUp})`}>
					<Ink d="M -12 -234 C 0 -242 16 -244 30 -240" t={dr(f, 38, 4)} color={c.ink} />
					<g transform={`translate(0 ${-HOST.asymmetry.brow_raise_px}) rotate(${HOST.asymmetry.brow_tilt_deg} 64 -242)`}>
						<Ink d="M 48 -240 C 58 -248 72 -248 82 -242" t={dr(f, 39, 4)} color={c.ink} />
					</g>
				</g>
				{/* eyes with catch-lights */}
				{eyesIn > 0
					? [
							[10, -204],
							[62, -206],
						].map(([x, y], i) => (
							<g key={i} transform={`translate(${x + look} ${y - look}) scale(${eyesIn})`}>
								<ellipse cx={0} cy={0} rx={10} ry={15 * eyeK} fill={c.ink} />
								{!blink ? <circle cx={3.5} cy={-5 * eyeK} r={3.5} fill={c.surface} /> : null}
							</g>
						))
					: null}
				<Ink d="M 44 -194 C 52 -180 56 -170 42 -164" t={dr(f, 42, 4)} color={c.ink} w={th} />
				{mouth === 'smile' ? <Ink d="M 14 -140 C 30 -128 50 -128 64 -142" t={dr(f, 44, 4)} color={c.ink} /> : null}
				{mouth === 'o' ? <ellipse cx={38} cy={-138} rx={11} ry={14} fill={c.ink} /> : null}
				{mouth === 'open' ? <path d="M 12 -144 C 30 -118 54 -120 66 -146 C 46 -138 28 -138 12 -144 Z" fill={c.ink} stroke={c.ink} strokeWidth={4} strokeLinejoin="round" /> : null}
				{/* surprise marks on react */}
				{react ? ['M 112 -300 L 132 -320', 'M 124 -262 L 152 -268', 'M 92 -330 L 100 -356'].map((d) => <Ink key={d} d={d} t={1} color={c.ink} w={th} />) : null}
			</g>
			{/* pointing arm: shoulder -> upper arm -> elbow -> forearm -> hand */}
			<g transform={`translate(${SHOULDER[0]} ${SHOULDER[1]}) rotate(${a})`}>
				<Fill id={`${uid}-up`} d={UPPER} box={{x: -4, y: -36, w: 144, h: 72}} color={c.primary} ink={c.ink} t={dr(f, 46, 6)} />
				<Ink d={UPPER} t={dr(f, 30, 8)} color={c.ink} />
				<g transform={`translate(${ARM.upper} 0) rotate(${b})`}>
					<Fill id={`${uid}-fo`} d={FORE} box={{x: 0, y: -28, w: 110, h: 56}} color={c.primary} ink={c.ink} t={dr(f, 48, 6)} />
					<g transform={`translate(108 0) scale(${HAND_K}) translate(-108 0)`}>
						{f >= 36 ? <path d={HAND} fill={c.skin} /> : null}
										<Ink d={HAND} t={dr(f, 36, 8)} color={c.ink} />
					<Ink d="M 130 -27 C 138 -40 152 -40 156 -28" t={dr(f, 42, 3)} color={c.ink} w={th} />
					<Ink d="M 130 6 C 138 12 146 12 152 8" t={dr(f, 43, 3)} color={c.ink} w={th} />
					</g>
					<Ink d={FORE} t={dr(f, 34, 6)} color={c.ink} />
				</g>
			</g>
		</g>
	);
};

/* ---------- the causal loop ---------- */
const C1 = centre(BOXES.n1);
const C2 = centre(BOXES.n2);
const C3 = centre(BOXES.n3);
const CARD = {rx: (BOXES.n1.w / 200) * W, ry: (BOXES.n1.h / 200) * H};
const NODES = [
	{c: C1, label: 'Worry', pop: 46, seed: 'n1'},
	{c: C2, label: 'Bad sleep', pop: 72, seed: 'n2'},
	{c: C3, label: 'Tired brain', pop: 96, seed: 'n3'},
];
const ARROWS = [
	{...arrow([C1.x + 150, C1.y + 15], [C2.x + 25, C1.y + 40], [C2.x + 10, C2.y - 70]), s: 58},
	{...arrow([C2.x - 65, C2.y + 66], [W / 2, C2.y + 160], [C3.x + 65, C3.y + 66]), s: 84},
	{...arrow([C3.x - 15, C3.y - 70], [C3.x - 15, C1.y + 40], [C1.x - 152, C1.y + 15]), s: 106},
];
const SPIN = (() => {
	const pts: P2[] = [];
	for (let i = 0; i <= 18; i++) {
		const a = rad(200 + (290 * i) / 18);
		pts.push([W / 2 + 52 * Math.cos(a), 772 + 52 * Math.sin(a)]);
	}
	const e = pts[pts.length - 1];
	const p = pts[pts.length - 2];
	return {body: smooth(pts), head: arrow(p, p, e).head};
})();
const MARK = loop(C2.x, C2.y, CARD.rx + 34, CARD.ry + 34, {seed: 'mark', wobble: 5, turn: D.markup.ellipse_turn, start: -160, grow: 0.06});
const NOTE_ARROW = arrow([885, 1080], [960, 1060], [918, 1004]);
const LIST = [
	{box: BOXES.i1, text: 'Name it', s: 146},
	{box: BOXES.i2, text: 'Write it down', s: 154},
	{box: BOXES.i3, text: 'Screens off', s: 162},
];

/** SketchWords: each word wipes in left to right behind a slanted edge, on twos, with a seeded hand-set tilt. */
const Words: React.FC<{text: string; f: number; start: number; per?: number; gap?: number; seed: string}> = ({text, f, start, per = 8, gap = 5, seed}) => {
	const rnd = mulberry32(fnv1a(seed));
	return (
		<>
			{text.split(' ').map((w, i) => {
				const p = seg(on2(f), start + i * gap, start + i * gap + per, 'settle') * 112;
				const rot = (rnd() - 0.5) * 3;
				const dy = Math.round((rnd() - 0.5) * 6);
				return (
					<span key={i} style={{display: 'inline-block', whiteSpace: 'pre', transform: `translateY(${dy}px) rotate(${rot.toFixed(2)}deg)`, clipPath: `polygon(0 -20%, ${p}% -20%, ${p - 12}% 120%, 0 120%)`}}>
						{w + (i < text.split(' ').length - 1 ? ' ' : '')}
					</span>
				);
			})}
		</>
	);
};

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
	const c = rolesOf(palette);
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const accentPx = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]).accent.size;
	const text = {color: c.ink, margin: 0, fontVariantNumeric: 'tabular-nums'} as React.CSSProperties;
	const seed = D.boil.seeds[Math.floor(f / D.boil.hold) % D.boil.seeds.length];
	const boil = `url(#${uid}-boil)`;
	const pops = NODES.map((n) => sp(f, n.pop, 'pop'));
	const markP = dr(f, 136, 14);
	const swipe = dr(f, 130, D.markup.swipe_frames);
	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			{/* the warm textured board: grain, fibres, vignette. Static, never boils. */}
			<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
				<defs>
					<filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
						<feTurbulence type="fractalNoise" baseFrequency={D.board.grain_freq} numOctaves={D.board.grain_octaves} seed={5} />
						<feColorMatrix type="matrix" values={flat(c.ink, '2.4 0 0 0 -0.95')} />
					</filter>
					<filter id={`${uid}-fibre`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
						<feTurbulence type="fractalNoise" baseFrequency={D.board.fibre_freq.join(' ')} numOctaves={2} seed={9} />
						<feColorMatrix type="matrix" values={flat(c.ink, '3 0 0 0 -1.5')} />
					</filter>
					<radialGradient id={`${uid}-vig`} cx="50%" cy="45%" r="75%">
						<stop offset="0.6" stopColor={c.ink} stopOpacity={0} />
						<stop offset="1" stopColor={c.ink} stopOpacity={D.board.vignette} />
					</radialGradient>
					<filter id={`${uid}-boil`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
						<feTurbulence type="fractalNoise" baseFrequency={D.boil.freq} numOctaves={D.boil.octaves} seed={seed} result="n" />
						<feDisplacementMap in="SourceGraphic" in2="n" scale={D.boil.scale} xChannelSelector="R" yChannelSelector="G" />
					</filter>
				</defs>
				<rect width={W} height={H} filter={`url(#${uid}-grain)`} opacity={D.board.grain_alpha} />
				<rect width={W} height={H} filter={`url(#${uid}-fibre)`} opacity={D.board.fibre_alpha} />
				<rect width={W} height={H} fill={`url(#${uid}-vig)`} />
			</svg>

			{/* the ink layer: everything drawn, boiling on twos */}
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
				<g filter={boil}>
					{/* arrows of the loop, then the centre spin */}
					{ARROWS.map((ar, i) => (
						<g key={i}>
							<Ink d={ar.body} t={dr(f, ar.s, 10)} color={c.ink} w={T.arrow.stroke} />
							<Ink d={ar.head} t={dr(f, ar.s + 9, 4)} color={c.ink} w={T.arrow.stroke} />
						</g>
					))}
					<Ink d={SPIN.body} t={dr(f, LOOP_CLOSE, 10)} color={c.ink} w={T.arrow.stroke} />
					<Ink d={SPIN.head} t={dr(f, LOOP_CLOSE + 9, 4)} color={c.ink} w={T.arrow.stroke} />
					{/* cards: spring pop, outline drawn on */}
					{NODES.map((n, i) => {
						const fill = loop(n.c.x, n.c.y, CARD.rx, CARD.ry, {n: 8, seed: n.seed, wobble: T.card.wobble});
						const line = loop(n.c.x, n.c.y, CARD.rx, CARD.ry, {n: 8, seed: n.seed, wobble: T.card.wobble, turn: 1.05});
						return pops[i] > 0 ? (
							<g key={i} transform={`translate(${n.c.x} ${n.c.y}) scale(${0.6 + 0.4 * pops[i]}) translate(${-n.c.x} ${-n.c.y})`}>
								<path d={fill} fill={c.surface} />
								{i === 1 && swipe > 0 ? <Ink d={`M ${n1(n.c.x - 118)} ${n1(n.c.y + 4)} L ${n1(n.c.x + 118)} ${n1(n.c.y - 2)}`} t={swipe} color={c.highlight} w={64} /> : null}
								<Ink d={line} t={dr(f, n.pop, 8)} color={c.ink} w={T.card.border.width} />
							</g>
						) : null;
					})}
					{/* LiveMarkup: marker ellipse round the cause, hand arrow to the note */}
					<Ink d={MARK} t={markP} color={c.primary} w={D.markup.ellipse_stroke} />
					<Ink d={NOTE_ARROW.body} t={dr(f, 148, 6)} color={c.ink} w={D.ink.thin} />
					<Ink d={NOTE_ARROW.head} t={dr(f, 153, 3)} color={c.ink} w={D.ink.thin} />
					{/* RunningList boxes and ticks */}
					{LIST.map((it, i) => {
						const bx = (it.box.x / 100) * W + 20;
						const by = ((it.box.y + it.box.h / 2) / 100) * H;
						const k = sp(f, it.s, 'pop');
						return k > 0 ? (
							<g key={i} transform={`translate(${bx} ${by}) scale(${0.6 + 0.4 * k})`}>
								<path d={loop(0, 0, T.check.box / 2, T.check.box / 2, {n: 8, seed: 'cb' + i, wobble: 2})} fill={c.surface} />
								<Ink d={loop(0, 0, T.check.box / 2, T.check.box / 2, {n: 8, seed: 'cb' + i, wobble: 2, turn: 1.05})} t={dr(f, it.s, 5)} color={c.ink} w={T.check.stroke} />
								<Ink d="M -12 -2 L -2 10 L 22 -22" t={dr(f, it.s + 4, 5)} color={c.primary} w={D.markup.ellipse_stroke} />
							</g>
						) : null;
					})}
					<Host f={f} c={c} uid={uid} />
				</g>
			</svg>

			{/* text: never boils */}
			<div style={{...abs(BOXES.kicker), ...fontCss(pair.mono, 32), ...text, whiteSpace: 'nowrap'}}>
				<Words text="PSYCHOLOGY / EP 04" f={f} start={2} per={10} gap={3} seed="k" />
			</div>
			<div style={{...abs(BOXES.title), ...fontCss(pair.display, 104), ...text}}>
				<div style={{whiteSpace: 'nowrap'}}>
					<Words text="The worry" f={f} start={6} seed="t1" />
				</div>
				<div style={{whiteSpace: 'nowrap', position: 'relative', display: 'inline-block'}}>
					<Words text="loop" f={f} start={18} seed="t2" />
					<svg viewBox="0 0 200 24" preserveAspectRatio="none" style={{position: 'absolute', left: -6, right: -10, bottom: -14, width: 'calc(100% + 16px)', height: 24, overflow: 'visible'}}>
						<g filter={boil}>
							<Ink d="M 4 14 C 50 8 110 18 196 9" t={dr(f, 28, 8)} color={c.primary} w={D.markup.ellipse_stroke} />
						</g>
					</svg>
				</div>
			</div>
			{NODES.map((n, i) => (
				<div key={i} style={{...abs([BOXES.n1, BOXES.n2, BOXES.n3][i]), ...fontCss(pair.accent, accentPx), ...text, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', transform: `scale(${0.6 + 0.4 * pops[i]})`, opacity: pops[i] > 0 ? 1 : 0}}>
					<span>
						<Words text={n.label} f={f} start={n.pop + 4} seed={n.seed} />
					</span>
				</div>
			))}
			<div style={{...abs(BOXES.note), ...fontCss(pair.accent, accentPx), ...text, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center'}}>
				<Words text="start here" f={f} start={150} seed="note" />
			</div>
			<div style={{...abs(BOXES.lh), ...fontCss(pair.accent, accentPx), ...text, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center'}}>
				<Words text="To break it:" f={f} start={140} seed="lh" />
			</div>
			{LIST.map((it, i) => (
				<div key={i} style={{...abs(it.box), ...fontCss(pair.body, 44), ...text, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', paddingLeft: 64, boxSizing: 'border-box'}}>
					<Words text={it.text} f={f} start={it.s + 6} seed={'i' + i} />
				</div>
			))}
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'kraft-red', pairing = 'kalam-nunito-courierprime'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: the host drawn on, the loop closed with the host reacting, the final frame. */
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
