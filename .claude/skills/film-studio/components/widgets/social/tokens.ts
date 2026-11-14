import type React from 'react';
import {Easing, interpolate, random, spring} from 'remotion';
import {contrast, fontCss, mix} from '../../engine/tokens';
import type {FontRole, Pairing} from '../../engine/types';

/**
 * Social widget token adapter. Every social widget draws only from the object `socialTokens()` returns, which it reads
 * from the ACTIVE style's design-system.json (palette roles, pairing, type scale, card/plate/tag/border tokens, easings,
 * springs). No widget holds a hex, a font name or a hard-coded border or radius.
 */
export const FW = 1080;
export const FH = 1920;
export const FPS = 30;

/** Percent of the 1080 x 1920 frame, origin top-left (same unit as storyboard boxes). */
export type Box = {x: number; y: number; w: number; h: number};
export const boxPx = (b: Box) => ({left: (b.x / 100) * FW, top: (b.y / 100) * FH, width: (b.w / 100) * FW, height: (b.h / 100) * FH});
export const boxStyle = (b: Box): React.CSSProperties => ({position: 'absolute', ...boxPx(b)});

type Spring = {damping: number; stiffness: number; mass: number};
type Border = {width?: number; role?: string; color?: string; alpha?: number; radius?: Record<string, number>};
type Layer = {radius?: number; border?: Border};
/** The parts of any style's design-system.json the widgets read. */
export type DesignJson = {
	style: string;
	palettes: {id: string; roles: Record<string, string>}[];
	fonts: (Pairing & {id: string})[];
	type_scale: Record<string, number>;
	motion: {easings: Record<string, number[]>; springs?: Record<string, Spring>; stagger_frames?: number; enter_frames?: number};
	tokens?: {frame_scale?: number; card?: Layer; plate?: Layer; tag?: Layer; border?: Border; offset_shadow?: {x: number; y: number; color: string}};
};

/** Text may only use these roles; `on()` picks the one that reads best on a fill. */
export type TextRole = 'ink' | 'bg' | 'surface';
export type FillRole = 'bg' | 'surface' | 'ink' | 'primary' | 'highlight' | 'alert';

export type SocialTokens = {
	style: string;
	palette: string;
	c: Record<FillRole, string>;
	/** Non-text shading only: dividers, empty waveform bars, placeholders. Mixes of two roles. */
	line: string;
	well: string;
	font: {display: FontRole; body: FontRole; accent: FontRole; mono: FontRole};
	size: {h2: number; body: number; label: number};
	radius: number;
	pill: number;
	border: {w: number; color: string};
	shadow: {x: number; y: number; color: string} | null;
	enter: (t: number) => number;
	move: (t: number) => number;
	spring: Spring;
	enterFrames: number;
	stagger: number;
	/** Best text role on a fill role, and its hex. */
	on: (fill: FillRole) => {role: TextRole; hex: string};
};

const MOVE_NAMES = ['focus', 'flip', 'drift', 'push', 'pan', 'sweep', 'settle'];

export const socialTokens = (ds: DesignJson, paletteId?: string, pairingId?: string): SocialTokens => {
	const pal = ds.palettes.find((p) => p.id === paletteId) ?? ds.palettes[0];
	const r = pal.roles;
	const c: Record<FillRole, string> = {
		bg: r.bg,
		surface: r.surface ?? r.bg,
		ink: r.ink,
		primary: r.primary,
		highlight: r.highlight ?? r.primary,
		alert: r.alert ?? r.highlight ?? r.primary,
	};
	const pair = ds.fonts.find((f) => f.id === pairingId) ?? ds.fonts[0];
	const T = ds.tokens ?? {};
	const k = typeof T.frame_scale === 'number' ? T.frame_scale : 1;
	const layer = T.card ?? T.plate ?? T.tag;
	const radius = k * (T.border?.radius?.card ?? layer?.radius ?? 0);
	const pill = T.border?.radius?.pill !== undefined ? k * T.border.radius.pill : radius;
	const b = T.border?.width !== undefined ? T.border : layer?.border;
	const bRole = b?.color ?? b?.role ?? 'ink';
	const bHex = r[bRole] ?? c.ink;
	const border = {w: k * (b?.width ?? 0), color: mix(c.surface, bHex, b?.alpha ?? 1)};
	const os = T.offset_shadow;
	const easings = ds.motion.easings;
	const names = Object.keys(easings);
	const bz = (n: string) => Easing.bezier(...(easings[n] as [number, number, number, number]));
	const moveName = MOVE_NAMES.find((n) => easings[n]) ?? names[0];
	const springs = ds.motion.springs ?? {};
	const ts = ds.type_scale;
	const on = (fill: FillRole) => {
		const best = (['ink', 'bg', 'surface'] as TextRole[]).map((role) => ({role, hex: c[role], k: contrast(c[role], c[fill])})).sort((a, z) => z.k - a.k)[0];
		return {role: best.role, hex: best.hex};
	};
	return {
		style: ds.style,
		palette: pal.id,
		c,
		line: mix(c.surface, c.ink, 0.22),
		well: mix(c.surface, c.ink, 0.07),
		font: {display: pair.display, body: pair.body, accent: pair.accent, mono: pair.mono},
		// Widgets are small objects inside a frame: text is capped at 44 body / 34 label / 64 heading.
		size: {h2: Math.min(ts.h2 ?? 64, 64), body: Math.min(ts.body ?? 44, 44), label: Math.min(ts.label ?? 34, 34)},
		radius,
		pill,
		border,
		shadow: os ? {x: k * os.x, y: k * os.y, color: r[os.color] ?? c.ink} : null,
		enter: bz(names[0]),
		move: bz(moveName),
		spring: springs.pop ?? Object.values(springs)[0] ?? {damping: 12, stiffness: 170, mass: 0.9},
		enterFrames: ds.motion.enter_frames ?? 10,
		stagger: ds.motion.stagger_frames ?? 5,
		on,
	};
};

/* ---------- frame helpers (pure functions of the frame: deterministic) ---------- */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** 0..1 entrance from `start` over `n` frames on the style's enter easing. */
export const enterP = (tk: SocialTokens, f: number, start: number, n = tk.enterFrames) => interpolate(f, [start, start + n], [0, 1], {...clamp, easing: tk.enter});
/** 0..1 travel on the style's move easing. */
export const moveP = (tk: SocialTokens, f: number, start: number, n: number) => interpolate(f, [start, start + n], [0, 1], {...clamp, easing: tk.move});
/** Spring from the style, 0 before `start`. */
export const popP = (tk: SocialTokens, f: number, start: number) => (f < start ? 0 : spring({frame: f - start, fps: FPS, config: tk.spring}));
export const lin = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
export const seeded = (seed: string, a: number, b: number) => a + random(seed) * (b - a);

/* ---------- shared looks ---------- */
export const txt = (tk: SocialTokens, role: keyof SocialTokens['font'], size: number, color: string): React.CSSProperties => ({
	...fontCss(tk.font[role], size),
	color,
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
});
/** A card in the style: fill role, the style's radius, border and (if it has one) offset shadow. */
export const card = (tk: SocialTokens, fill: FillRole = 'surface', r = tk.radius, lift = 1): React.CSSProperties => ({
	background: tk.c[fill],
	borderRadius: r,
	border: tk.border.w ? `${tk.border.w}px solid ${tk.border.color}` : 'none',
	boxShadow: tk.shadow ? `${tk.shadow.x * lift}px ${tk.shadow.y * lift}px 0 ${tk.shadow.color}` : 'none',
	boxSizing: 'border-box',
});
export const pillR = (tk: SocialTokens, h: number) => Math.min(tk.pill, h / 2);
export const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${Math.round(n)}`);
export const initials = (name: string) => name.replace(/^@/, '').split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
/** Seeded fill for avatars and tiles: primary or highlight. */
export const accentFill = (seed: string): FillRole => (random(seed) < 0.5 ? 'primary' : 'highlight');

/** Shared props. `frame` is the widget's own local frame: pass `useCurrentFrame() - start` or a Sequence frame. */
export type WidgetBase = {tk: SocialTokens; frame: number; box: Box};
