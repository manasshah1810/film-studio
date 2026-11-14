import {contrast, mix, rgba} from '../../engine/tokens';
import {socialTokens, type Box, type DesignJson, type FillRole, type SocialTokens} from '../social/tokens';

/**
 * Editorial widget tokens: the social token object (palette roles, pairing, sizes, radius, border, shadow, easings,
 * spring) plus the paper, pen, marker, stamp and jitter tokens a print or documentary widget needs. All of it is read
 * from the ACTIVE style's design-system.json; a style with no paper block gets its own card instead of torn paper.
 */
type Spring = {damping: number; stiffness: number; mass: number};
type PaperJson = {
	tear?: {amp_px: number; step_px: number; fibre_px: number};
	grain?: {freq: number; octaves: number; opacity: number};
	marker?: {blend?: string; edge_jitter_px?: number; height_pct?: number};
	pen?: {stroke: number};
	jitter?: {fps: number; px: number; deg: number};
};
export type EditorialJson = DesignJson & {
	paper?: PaperJson;
	tokens?: DesignJson['tokens'] & {rule?: {thick: number; thin: number}; shadow?: {role: string; blur: number; y: number; alpha: number}};
};

export type EditorialTokens = SocialTokens & {
	/** Text colour on the paper (`surface`): ink when it reaches 4.5:1, else the best of bg and surface. */
	text: string;
	/** Title size for TitleCard and PressFront: type_scale.h1, capped at 96. */
	h1: number;
	paper: {
		/** Jagged edge in px, or null for a straight-edged card. */
		tear: {amp: number; step: number; fibre: number} | null;
		grain: {freq: number; octaves: number; opacity: number} | null;
		/** CSS filter: the soft drop shadow (tokens.shadow), else the offset shadow, else none. */
		drop: string;
		fibre: string;
	};
	/** The edge PaperTear cuts with: the style's tear, else 12 / 24 / 0 (a tear needs an edge). */
	tearCut: {amp: number; step: number; fibre: number};
	pen: {role: FillRole; hex: string; w: number};
	marker: {hex: string; blend: 'multiply' | 'normal'; jitter: number; height: number};
	stamp: {role: FillRole; hex: string; spring: Spring};
	rule: {thick: number; thin: number};
	jitter: {fps: number; px: number; deg: number} | null;
	tearEase: (t: number) => number;
};

/** First role in `cands` with at least `min` contrast on `on`, else ink. */
const pick = (c: Record<FillRole, string>, cands: FillRole[], on: string, min: number): FillRole => cands.find((r) => contrast(c[r], on) >= min) ?? 'ink';

/** Cubic bezier easing (x1, y1, x2, y2) by bisection. */
const cubic = ([x1, y1, x2, y2]: number[], t: number) => {
	let a = 0, b = 1, x = t;
	for (let i = 0; i < 24; i++) {
		x = (a + b) / 2;
		const bx = 3 * (1 - x) * (1 - x) * x * x1 + 3 * (1 - x) * x * x * x2 + x * x * x;
		if (bx < t) a = x;
		else b = x;
	}
	return 3 * (1 - x) * (1 - x) * x * y1 + 3 * (1 - x) * x * x * y2 + x * x * x;
};

export const editorialTokens = (ds: EditorialJson, paletteId?: string, pairingId?: string): EditorialTokens => {
	const tk = socialTokens(ds, paletteId, pairingId);
	const P = ds.paper ?? {};
	const T = ds.tokens ?? {};
	const roles = (ds.palettes.find((p) => p.id === tk.palette) ?? ds.palettes[0]).roles;
	const text = contrast(tk.c.ink, tk.c.surface) >= 4.5 ? tk.c.ink : tk.on('surface').hex;
	// Pen and stamp are display marks: 3:1 on the paper. archival-grunge newsprint -> primary, butter-ink -> ink.
	const penRole = pick(tk.c, ['primary', 'alert', 'highlight'], tk.c.surface, 3);
	// The marker sits UNDER text: the text keeps 4.5:1 on it, and it is never the pen colour.
	const markRole = (['highlight', 'primary'] as FillRole[]).find((r) => r !== penRole && contrast(text, tk.c[r]) >= 4.5);
	const sh = T.shadow && typeof T.shadow.blur === 'number' ? T.shadow : null;
	const drop = sh ? `drop-shadow(0px ${sh.y}px ${sh.blur}px ${rgba(roles[sh.role] ?? tk.c.ink, sh.alpha)})` : tk.shadow ? `drop-shadow(${tk.shadow.x}px ${tk.shadow.y}px 0px ${tk.shadow.color})` : 'none';
	const springs = (ds.motion.springs ?? {}) as Record<string, Spring>;
	const tearBz = ds.motion.easings.tear;
	const tear = P.tear ? {amp: P.tear.amp_px, step: P.tear.step_px, fibre: P.tear.fibre_px} : null;
	return {
		...tk,
		text,
		h1: Math.min(ds.type_scale.h1 ?? 84, 96),
		paper: {
			tear,
			grain: P.grain ? {freq: P.grain.freq, octaves: P.grain.octaves, opacity: P.grain.opacity} : null,
			drop,
			fibre: mix(tk.c.surface, text, 0.05),
		},
		tearCut: tear ?? {amp: 12, step: 24, fibre: 0},
		pen: {role: penRole, hex: tk.c[penRole], w: P.pen?.stroke ?? Math.max(5, tk.border.w)},
		marker: {
			hex: markRole ? tk.c[markRole] : tk.well,
			blend: P.marker?.blend === 'multiply' ? 'multiply' : 'normal',
			jitter: P.marker?.edge_jitter_px ?? 0,
			height: (P.marker?.height_pct ?? 82) / 100,
		},
		stamp: {role: penRole, hex: tk.c[penRole], spring: springs.stamp ?? springs.press ?? tk.spring},
		rule: T.rule ? {thick: T.rule.thick, thin: T.rule.thin} : {thick: Math.max(4, tk.border.w), thin: Math.max(2, Math.round(tk.border.w / 3))},
		jitter: P.jitter ? {fps: P.jitter.fps, px: P.jitter.px, deg: P.jitter.deg} : null,
		tearEase: tearBz ? (t: number) => cubic(tearBz, t) : tk.move,
	};
};

/** Stop-motion jitter from the style (a new pose `fps` times a second), else 'none'. Pure function of the frame. */
export const jit = (tk: EditorialTokens, f: number, seed: string, k = 1) => {
	if (!tk.jitter) return 'none';
	const step = Math.floor((f * tk.jitter.fps) / 30);
	const r = (s: string) => {
		let h = 2166136261;
		for (const ch of `${seed}-${step}-${s}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
		return ((h >>> 0) % 10000) / 10000 - 0.5;
	};
	return `translate(${(r('x') * 2 * tk.jitter.px * k).toFixed(2)}px, ${(r('y') * 2 * tk.jitter.px * k).toFixed(2)}px) rotate(${(r('r') * 2 * tk.jitter.deg * k).toFixed(3)}deg)`;
};

/** Pen draw-on: dash props for an SVG path with pathLength 1. */
export const draw = (p: number) => ({pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - Math.max(0, Math.min(1, p))});

export type EditorialBase = {tk: EditorialTokens; frame: number; box: Box};
