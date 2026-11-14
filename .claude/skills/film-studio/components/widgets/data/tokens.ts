import type React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {contrast, mix, rgba} from '../../engine/tokens';
import {FPS, socialTokens, type Box, type DesignJson, type FillRole, type SocialTokens} from '../social/tokens';

/**
 * Data widget tokens: the social token object plus what a number, a chart mark or a readout needs, all read from the
 * ACTIVE style's design-system.json: text and label colours, a text-safe accent, two series colours, grid colour, line
 * weights, glow (marks only, never text), the numeral font and the draw, roll and lock motion.
 */
type Spring = {damping: number; stiffness: number; mass: number};
type GlowJson = {inner?: number; outer?: number; outer_alpha?: number; max_radius?: number; blur?: number; alpha?: number};
export type DataJson = DesignJson & {
	numerals?: {tabular?: boolean; rule?: string};
	tokens?: DesignJson['tokens'] & {
		line?: {width?: number};
		stroke?: {hair: number; line: number; heavy: number};
		grid?: {role?: string; alpha?: number};
		ground?: {grid?: {role?: string; alpha?: number}};
		glow?: GlowJson;
	};
};

export type DataTokens = SocialTokens & {
	/** Body and numeral colour on the card (`surface`): ink when it reaches 4.5:1, else the best text role. */
	text: string;
	/** Axis labels and captions: the palette's muted or dim role when it reaches 4.5:1 on surface, else `text`. */
	label: string;
	/** Text accent (a key number): first of primary, highlight with 4.5:1 on surface, else `text`. */
	accent: string;
	/** Two mark colours (bars, rings, lines): first of primary, highlight, alert with 3:1 on surface, else ink. */
	series: [string, string];
	/** Text on a series-0 fill. */
	onSeries: string;
	grid: string;
	stroke: {hair: number; line: number; heavy: number};
	/** CSS filter glow for a mark in `hex`; 'none' for a style with no glow token. Never put it on text. */
	glow: (hex: string) => string;
	/** Numeral font role: mono when the style's numeral rule says so, else display. Always tabular. */
	num: 'mono' | 'display';
	/** Big number size: type_scale.numeral (else display), capped at 140. */
	numeral: number;
	plateR: number;
	/** Smallest label the style allows (its hud.readout.label_px, 34 in scifi-hud); 0 when the style sets none. */
	labelMin: number;
	draw: (t: number) => number;
	roll: (t: number) => number;
	lock: Spring;
};

const firstAt = (c: Record<FillRole, string>, cands: FillRole[], on: string, min: number) => cands.find((r) => contrast(c[r], on) >= min);

export const dataTokens = (ds: DataJson, paletteId?: string, pairingId?: string): DataTokens => {
	const tk = socialTokens(ds, paletteId, pairingId);
	const roles = (ds.palettes.find((p) => p.id === tk.palette) ?? ds.palettes[0]).roles;
	const T = ds.tokens ?? {};
	const k = typeof T.frame_scale === 'number' ? T.frame_scale : 1;
	const sf = tk.c.surface;
	const text = contrast(tk.c.ink, sf) >= 4.5 ? tk.c.ink : tk.on('surface').hex;
	const quiet = roles.muted ?? roles.dim;
	const label = quiet && contrast(quiet, sf) >= 4.5 ? quiet : text;
	const acc = firstAt(tk.c, ['primary', 'highlight'], sf, 4.5);
	const s0 = firstAt(tk.c, ['primary', 'highlight', 'alert'], sf, 3) ?? 'ink';
	const s1 = firstAt(tk.c, (['highlight', 'alert', 'primary'] as FillRole[]).filter((r) => tk.c[r] !== tk.c[s0]), sf, 3) ?? 'ink';
	const g = T.grid ?? T.ground?.grid;
	const grid = g?.role && roles[g.role] ? (g.role === 'ink' ? mix(sf, roles.ink, Math.max(0.14, g.alpha ?? 0.14)) : roles[g.role]) : g ? mix(sf, tk.c.primary, 0.16) : tk.line;
	const line = T.stroke?.line ?? T.line?.width ?? Math.max(4, tk.border.w * 2);
	const stroke = {hair: T.stroke?.hair ?? Math.max(2, Math.round(line / 3)), line, heavy: T.stroke?.heavy ?? Math.round(line * 1.5)};
	const G = T.glow;
	const cap = G?.max_radius ?? 28;
	const glow = (hex: string) => {
		if (!G) return 'none';
		if (typeof G.inner === 'number') return `drop-shadow(0 0 ${Math.min(G.inner, cap)}px ${hex}) drop-shadow(0 0 ${Math.min(G.outer ?? G.inner * 2, cap)}px ${rgba(hex, G.outer_alpha ?? 0.6)})`;
		return `drop-shadow(0 0 ${Math.min(G.blur ?? 12, cap)}px ${rgba(hex, Math.min(1, (G.alpha ?? 0.3) * 3))})`;
	};
	const E = ds.motion.easings;
	const bz = (n: string) => (E[n] ? Easing.bezier(...(E[n] as [number, number, number, number])) : null);
	const springs = (ds.motion.springs ?? {}) as Record<string, Spring>;
	const ts = ds.type_scale;
	const plate = (T as {plate?: {radius?: number}}).plate;
	return {
		...tk,
		text,
		label,
		accent: acc ? tk.c[acc] : text,
		series: [tk.c[s0], tk.c[s1]],
		onSeries: tk.on(s0).hex,
		grid,
		stroke,
		glow,
		num: /mono/i.test(ds.numerals?.rule ?? '') ? 'mono' : 'display',
		numeral: Math.min(ts.numeral ?? ts.display ?? 108, 140),
		plateR: k * (plate?.radius ?? tk.radius),
		labelMin: (ds as {hud?: {readout?: {label_px?: number}}}).hud?.readout?.label_px ?? 0,
		draw: bz('draw') ?? tk.move,
		roll: bz('roll') ?? bz('settle') ?? tk.move,
		lock: springs.lock ?? springs.pulse ?? tk.spring,
	};
};

/** A small label size: size.label x k, never under the style's label floor. */
export const lab = (tk: DataTokens, k: number) => Math.max(tk.size.label * k, tk.labelMin);

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** 0..1 on the style's draw easing (path draw-on, sweeps). */
export const drawP = (tk: DataTokens, f: number, start: number, n: number) => interpolate(f, [start, start + n], [0, 1], {...clamp, easing: tk.draw});
/** 0..1 on the style's roll easing (counters). */
export const rollP = (tk: DataTokens, f: number, start: number, n: number) => interpolate(f, [start, start + n], [0, 1], {...clamp, easing: tk.roll});
/** Lock spring from the style, 0 before `start`. */
export const lockP = (tk: DataTokens, f: number, start: number) => (f < start ? 0 : spring({frame: f - start, fps: FPS, config: tk.lock}));

/** Tabular numerals: every digit the same width, so a changing number never shifts sideways. */
export const TAB: React.CSSProperties = {fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1'};
/** Grouped number with a fixed decimal count, e.g. 12,480.50. */
export const fmt = (n: number, dec = 0) => n.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec});
/** HH:MM from hours (6.5 -> 06:30). */
export const hhmm = (h: number) => {
	const m = Math.round((((h % 24) + 24) % 24) * 60);
	return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
/** SMPTE timecode HH:MM:SS:FF at 30 fps. */
export const timecode = (frames: number) => {
	const f = Math.max(0, Math.floor(frames));
	const p = (n: number) => String(n).padStart(2, '0');
	return `${p(Math.floor(f / 108000))}:${p(Math.floor(f / 1800) % 60)}:${p(Math.floor(f / 30) % 60)}:${p(f % 30)}`;
};

export type DataBase = {tk: DataTokens; frame: number; box: Box};
