import {spring} from 'remotion';
import {contrast, cssFamily} from '../../engine/tokens';
import {cameraTokens, type CameraJson, type CameraTokens} from '../camera/tokens';
import {FPS, type Box, type FillRole} from '../social/tokens';

/**
 * Kinetic widget tokens: the camera token object plus what a spoken caption, a Z-dive and a falling block need, all
 * read from the ACTIVE style's design-system.json: the hero and h1 display sizes, the knockout (active word) and
 * power-word block fills with their best text colour, the active and power scales and tilt, the pull-back and
 * explode springs, the camera perspective and the gravity-drop timing. A style that lacks one gets the default named
 * in widgets-kinetic.md. `breakLines` measures real glyph widths and never leaves one word alone on a last line.
 */
type Spring = {damping: number; stiffness: number; mass: number};
type Bag = Record<string, unknown>;
type KineticJson = {active_scale?: number; power_scale?: number; power_tilt?: number; punch?: number; beat_frames?: number; explode_gap_px?: number};
export type KinJson = CameraJson & {camera?: {perspective?: number}; kinetic?: KineticJson; motion: CameraJson['motion'] & {pull_back?: {from?: number}}};

export type FontKey = 'display' | 'body' | 'accent' | 'mono';
export type KineticTokens = CameraTokens & {
	/** Hook size: type_scale.hero (else display), capped at 180. */
	hero: number;
	/** Caption size: type_scale.h1 (else display), capped at 130. */
	h1: number;
	/** Active (spoken) word: a block in `primary`, text in the best of ink, bg, surface on it. */
	knock: {fill: string; text: string};
	/** Power word: a block in `highlight` (else alert), text in the best text role on it. */
	power: {fill: string; text: string};
	/** Display colour of a power word once spoken: series 0 when it reaches 3:1 on surface (display rule), else text. */
	powerInk: string;
	activeScale: number;
	powerScale: number;
	powerTilt: number;
	/** Stage punch-in on a power word (1 to this, back over 14 frames). */
	punch: number;
	/** Default frames between spoken words when no timings are given. */
	beat: number;
	pullFrom: number;
	pullback: Spring;
	explode: Spring;
	explodeGap: number;
	perspective: number;
	drop: {fall: number; squash: number; spread: [number, number]};
	/** True when a role's font is set upper case by the pairing. */
	upper: (role: FontKey) => boolean;
};

export const kineticTokens = (ds: KinJson, paletteId?: string, pairingId?: string): KineticTokens => {
	const tk = cameraTokens(ds, paletteId, pairingId);
	const ts = ds.type_scale;
	const K = ds.kinetic ?? {};
	const springs = (ds.motion.springs ?? {}) as Record<string, Spring>;
	const vox = (ds as {voxel?: Bag}).voxel;
	const dr = (vox?.drop ?? (ds.tokens as Bag | undefined)?.drop) as {fall_frames?: number; squash?: number; spread?: [number, number]} | undefined;
	const pw: FillRole = tk.c.highlight !== tk.c.primary ? 'highlight' : 'alert';
	const pair = ds.fonts.find((f) => f.id === pairingId) ?? ds.fonts[0];
	return {
		...tk,
		hero: Math.min(ts.hero ?? ts.display ?? 150, 180),
		h1: Math.min(ts.h1 ?? ts.display ?? 120, 130),
		knock: {fill: tk.c.primary, text: tk.on('primary').hex},
		power: {fill: tk.c[pw], text: tk.on(pw).hex},
		powerInk: contrast(tk.series[0], tk.c.surface) >= 3 ? tk.series[0] : tk.text,
		activeScale: K.active_scale ?? 1.06,
		powerScale: K.power_scale ?? 1.1,
		powerTilt: K.power_tilt ?? -2,
		punch: K.punch ?? 1.06,
		beat: K.beat_frames ?? 8,
		pullFrom: ds.motion.pull_back?.from ?? 1.15,
		pullback: springs.pullback ?? springs.pull_back ?? springs.settle ?? tk.spring,
		explode: springs.explode ?? springs.settle ?? tk.spring,
		explodeGap: K.explode_gap_px ?? 120,
		perspective: ds.camera?.perspective ?? 1400,
		drop: {fall: dr?.fall_frames ?? 8, squash: dr?.squash ?? 0.78, spread: dr?.spread ?? [2, 42]},
		upper: (role) => (pair[role] as {case?: string}).case === 'upper',
	};
};

/** Spring from any config, 0 before `start`. */
export const springAt = (cfg: Spring, f: number, start: number) => (f < start ? 0 : spring({frame: f - start, fps: FPS, config: cfg}));

/* ---------- text measuring and orphan-free line breaks ---------- */
let ctx: CanvasRenderingContext2D | null | undefined;
const getCtx = () => {
	if (ctx === undefined) ctx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
	return ctx;
};
/** Text as the pairing sets it (upper case when the role's case is upper). */
export const cased = (tk: KineticTokens, role: FontKey, s: string) => (tk.upper(role) ? s.toUpperCase() : s);
/** Width in px of `s` in a font role at `size`, tracking included. Real glyph metrics (FontGate loads the fonts first). */
export const measure = (tk: KineticTokens, role: FontKey, size: number, s: string) => {
	const f = tk.font[role] as {family: string; weight: number; tracking: number; italic?: boolean};
	const t = cased(tk, role, s);
	const c = getCtx();
	const track = f.tracking * size * t.length;
	if (!c) return t.length * size * 0.56 + track;
	c.font = `${f.italic ? 'italic ' : ''}${f.weight} ${size}px '${cssFamily(f.family)}'`;
	return c.measureText(t).width + track;
};

/** Ink box of `s` (cased) from its left alignment point: left and right edges, ascent and descent from the baseline. */
export const glyphBox = (tk: KineticTokens, role: FontKey, size: number, s: string) => {
	const f = tk.font[role] as {family: string; weight: number; italic?: boolean};
	const c = getCtx();
	if (!c) return {left: 0, right: s.length * size * 0.56, ascent: size * 0.72, descent: 0};
	c.font = `${f.italic ? 'italic ' : ''}${f.weight} ${size}px '${cssFamily(f.family)}'`;
	const m = c.measureText(cased(tk, role, s));
	return {left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent};
};

/**
 * Greedy break to `maxW` (and `maxChars` when set), then orphan control: when the last line holds one word and the
 * line above holds two or more, the line above gives up its last word if the pair still fits. Returns word arrays.
 */
export const breakLines = (tk: KineticTokens, role: FontKey, size: number, words: string[], maxW: number, maxChars = Infinity, padEm = 0): string[][] => {
	const fits = (ws: string[]) => measure(tk, role, size, ws.join(' ')) + ws.length * padEm * size <= maxW && ws.join(' ').length <= maxChars;
	const lines: string[][] = [];
	for (const w of words) {
		const cur = lines[lines.length - 1];
		if (cur && fits([...cur, w])) cur.push(w);
		else lines.push([w]);
	}
	for (let i = lines.length - 1; i > 0; i--) {
		const a = lines[i - 1], b = lines[i];
		if (b.length === 1 && a.length >= 2 && fits([a[a.length - 1], ...b])) b.unshift(a.pop() as string);
	}
	return lines;
};
/** True when the last line of a break holds a single word while the line above holds more (an orphan). */
export const hasOrphan = (lines: string[][]) => lines.length > 1 && lines[lines.length - 1].length === 1 && lines[lines.length - 2].length > 1;

/** `padEm`: block padding each word carries (both sides, in em), counted in the width. */
/** Largest size from `size` down to `min` (2 px steps) at which `words` break into `maxLines` or fewer and every word fits. */
export const fitSize = (tk: KineticTokens, role: FontKey, size: number, words: string[], maxW: number, maxLines: number, min = 40, maxChars = Infinity, padEm = 0) => {
	for (let s = size; s > min; s -= 2) {
		if (words.some((w) => measure(tk, role, s, w) + padEm * s > maxW)) continue;
		if (breakLines(tk, role, s, words, maxW, maxChars, padEm).length <= maxLines) return s;
	}
	return min;
};

/** Splits "a *power* word" into words and the set of power-word indices (a word wrapped in asterisks). */
export const parseWords = (text: string) => {
	const words: string[] = [];
	const power = new Set<number>();
	text.split(/\s+/).filter(Boolean).forEach((w, i) => {
		const m = /^\*(.+)\*([.,!?:;]*)$/.exec(w);
		if (m) power.add(i);
		words.push(m ? m[1] + m[2] : w);
	});
	return {words, power};
};

export type KineticBase = {tk: KineticTokens; frame: number; box: Box};
