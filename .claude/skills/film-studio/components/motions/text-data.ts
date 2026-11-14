/**
 * Text and data reveal primitives: a seeded hacker decode scramble, an odometer number roll, an SVG path
 * draw-on, and an active word highlight synced to word timestamps. Every helper is a pure function of the
 * frame number (no state, no Math.random), so any frame renders the same on any worker. Docs:
 * references/motion-text-data.md. Rules: personas/motion-choreographer.md section 4 (decode resolves over
 * 20 frames, odometer is stepped per digit column, draw-on is stroke-dashoffset from length to 0, seeded
 * randomness) and personas/sound-designer.md section 1 (onset within 2 frames of the visual peak, one
 * sound per peak).
 *
 * Flicker-free means: a scrambled glyph holds for `step` frames and never shows its target before it
 * locks; an odometer column never spins faster than `maxCells` per frame and lands exactly on its digit;
 * a draw-on hides its round cap at p = 0 and p = 1; a highlighted word never lights for fewer than
 * `minHold` frames and never blinks off in a short gap between two words.
 */
import {getLength} from '@remotion/paths';
import {FPS, held} from './physics';
import {bezier, type Bezier} from './camera';

// ---------------------------------------------------------------------------------------------------------
// Shared: curves, SFX cues
// ---------------------------------------------------------------------------------------------------------

/** Named reveal curves, copied from the styles' design-system.json `motion.easings`. */
export const TEXT_CURVES = {
	/** dark-neon-dataviz and tactical-vector-maps `roll`. Fast start, long soft landing on the digit. */
	roll: [0.22, 1, 0.36, 1],
	/** dark-neon-dataviz `draw`. The data line draws on. */
	draw: [0.45, 0, 0.2, 1],
	/** hormozi-kinetic `punch`. The highlight block swipes in behind the active word. */
	punch: [0.16, 1, 0.3, 1],
	/** Linear: the decode lock order is already the timing. */
	linear: [0, 0, 1, 1],
} as const satisfies Record<string, Bezier>;

export type TextSfxId = 'key-click' | 'soft-chime';
export type TextSfxCue = {frame: number; sfx: TextSfxId; peak: string; peak_frame: number; pre_roll: number};

/** SFX sync numbers. Both sounds have a hard transient, so pre-roll is 0 and onset = peak frame. */
export const TEXT_SFX = {
	/** Clicks closer than this merge into the earlier one (15 clicks a second at most at 30 fps). */
	clickGap: 2,
	/** Chimes closer than this merge into the earlier one. */
	chimeGap: 20,
	/** Sound designer contract: |onset - peak| <= 2 frames. */
	syncTolerance: 2,
	preRoll: {'key-click': 0, 'soft-chime': 0} as Record<TextSfxId, number>,
};

const cue = (sfx: TextSfxId, peak_frame: number, peak: string): TextSfxCue => ({
	frame: Math.max(0, peak_frame - TEXT_SFX.preRoll[sfx]),
	sfx,
	peak,
	peak_frame,
	pre_roll: TEXT_SFX.preRoll[sfx],
});

/**
 * Build a cue list: one key-click per tick frame (merged under `clickGap`), and one chime on `chimeAt`.
 * The chime replaces any click within `clickGap` frames of it (one sound per peak).
 */
export const tickCues = (ticks: number[], label: string, chimeAt?: number, chimeLabel = `${label} lands`): TextSfxCue[] => {
	const out: TextSfxCue[] = [];
	let last = -Infinity;
	for (const t of [...ticks].sort((a, b) => a - b)) {
		if (t - last < TEXT_SFX.clickGap) continue;
		if (chimeAt !== undefined && Math.abs(t - chimeAt) < TEXT_SFX.clickGap) continue;
		out.push(cue('key-click', t, label));
		last = t;
	}
	if (chimeAt !== undefined) out.push(cue('soft-chime', chimeAt, chimeLabel));
	return out.sort((a, b) => a.frame - b.frame);
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const progress = (f: number, start: number, frames: number, curve: Bezier) => bezier(curve, clamp01((f - start) / Math.max(1, frames)));

/** Deterministic 0..1 from a seed and integers (FNV-1a over the key, then an avalanche mix). */
const rand = (seed: string, ...n: number[]) => {
	let h = 0x811c9dc5;
	const s = `${seed}|${n.join('|')}`;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
	h ^= h >>> 15;
	h = Math.imul(h, 0x2c1b3c6d);
	h ^= h >>> 12;
	return (h >>> 0) / 4294967296;
};

// ---------------------------------------------------------------------------------------------------------
// 1. hackerDecodeScramble
// ---------------------------------------------------------------------------------------------------------

/** Glyph pools. A character only scrambles inside its own class, so digits stay digits (tabular width). */
export const GLYPHS = {
	upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	lower: 'abcdefghijklmnopqrstuvwxyz',
	digit: '0123456789',
	symbol: '#%&*+=<>/\\$@?!',
} as const;
type GlyphClass = keyof typeof GLYPHS;

const classOf = (ch: string): GlyphClass | null =>
	/[A-Z]/.test(ch) ? 'upper' : /[a-z]/.test(ch) ? 'lower' : /[0-9]/.test(ch) ? 'digit' : null;

export type DecodeOrder = 'ltr' | 'rtl' | 'center-out' | 'random';

export type DecodeOpts = {
	text: string;
	/** First frame of the scramble. */
	start?: number;
	/** Frames from start until the last character locks (choreographer: 20). */
	frames?: number;
	/** Frames every character scrambles before the first one locks. */
	lead?: number;
	/** A scrambled glyph holds this many frames before it changes (2 = 15 changes a second). */
	step?: number;
	/** Lock order. scifi-hud locks left to right; anything else reads as random. */
	order?: DecodeOrder;
	/** Chance (0..1) that a scrambling letter shows a symbol instead. Digits never do. Use 0 outside mono fonts. */
	symbols?: number;
	/** Characters that are not letters or digits scramble too (as symbols). Default: they hold. */
	scramblePunctuation?: boolean;
	seed?: string;
	/** Chime on the last lock (the reveal lands). */
	chime?: boolean;
	/** Frame hold for stepped styles (2 = on twos). */
	hold?: number;
};

export type DecodeChar = {ch: string; target: string; locked: boolean; lockFrame: number; scrambles: boolean};

export type Decode = {
	/** The string to draw this frame. Same length as `text`. Before start it is spaces (reserve the width). */
	text: string;
	chars: DecodeChar[];
	locked: number;
	total: number;
	progress: number;
	phase: 'before' | 'scramble' | 'done';
	done: boolean;
	/** Frame of the last lock. */
	endFrame: number;
	sfx: TextSfxCue[];
};

/**
 * Seeded decode. Character i (rank r of m scrambling characters in `order`) locks at
 * `start + lead + round((frames - lead) * (r + 1) / m)`. Until then it shows glyph
 * `pool[floor(rand(seed, i, s) * pool.length)]` with `s = floor((f - start) / step)`, nudged so it is never
 * the target and never the glyph of the previous step.
 */
export const hackerDecodeScramble = (frame: number, o: DecodeOpts): Decode => {
	const {text, start = 0, frames = 20, lead = 4, step = 2, order = 'ltr', symbols = 0.2, scramblePunctuation = false, seed = 'decode', chime = true, hold = 1} = o;
	const f = held(frame, hold);
	const chars = [...text];
	const idx = chars.map((c, i) => ({c, i})).filter(({c}) => c.trim() !== '' && (classOf(c) !== null || scramblePunctuation)).map(({i}) => i);
	const m = idx.length;
	const mid = (chars.length - 1) / 2;
	const ranked =
		order === 'ltr' ? idx
		: order === 'rtl' ? [...idx].reverse()
		: order === 'center-out' ? [...idx].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b)
		: [...idx].sort((a, b) => rand(seed, a, -1) - rand(seed, b, -1));
	const span = Math.max(0, frames - lead);
	const lockAt = new Map<number, number>(ranked.map((i, r) => [i, start + lead + Math.round((span * (r + 1)) / Math.max(1, m))]));
	const endFrame = m ? start + lead + span : start;

	const rawGlyph = (i: number, s: number, target: string) => {
		const cls = classOf(target);
		const pool: string = cls === null || (cls !== 'digit' && rand(seed, i, s, 7) < symbols) ? GLYPHS.symbol : GLYPHS[cls];
		return pool[Math.floor(rand(seed, i, s) * pool.length)];
	};
	const glyph = (i: number, s: number, target: string) => {
		const cls = classOf(target);
		const pool: string = cls === null || (cls !== 'digit' && rand(seed, i, s, 7) < symbols) ? GLYPHS.symbol : GLYPHS[cls];
		const prev = s > 0 ? rawGlyph(i, s - 1, target) : '';
		let g = Math.floor(rand(seed, i, s) * pool.length);
		for (let t = 0; t < 3 && (pool[g] === target || pool[g] === prev); t++) g = (g + 1) % pool.length;
		return pool[g];
	};

	const s = Math.floor(Math.max(0, f - start) / Math.max(1, step));
	const out: DecodeChar[] = chars.map((target, i) => {
		const lf = lockAt.get(i);
		if (lf === undefined) return {ch: target, target, locked: true, lockFrame: start, scrambles: false};
		const locked = f >= lf;
		return {ch: locked ? target : glyph(i, s, target), target, locked, lockFrame: lf, scrambles: true};
	});
	const before = f < start;
	const locked = out.filter((c) => c.scrambles && c.locked).length;
	return {
		text: before ? chars.map((c) => (c === '\n' ? c : ' ')).join('') : out.map((c) => c.ch).join(''),
		chars: out,
		locked,
		total: m,
		progress: m ? locked / m : 1,
		phase: before ? 'before' : f >= endFrame ? 'done' : 'scramble',
		done: f >= endFrame,
		endFrame,
		sfx: m ? tickCues([...lockAt.values()], 'decode char locks', chime ? endFrame : undefined, 'decode resolves') : [],
	};
};

// ---------------------------------------------------------------------------------------------------------
// 2. odometerNumberRoll
// ---------------------------------------------------------------------------------------------------------

export type OdometerStrip = 'stepped' | 'carry';

export type OdometerOpts = {
	from?: number;
	to: number;
	start?: number;
	frames?: number;
	curve?: Bezier;
	/** Digits after the decimal point. */
	decimals?: number;
	/** Minimum column count (fixed width: pass the widest value the panel will show). */
	columns?: number;
	/** 'stepped' (choreographer and dark-neon-dataviz: each column rolls on the second half of its step) or 'carry'. */
	strip?: OdometerStrip;
	/** Fastest a column may move, in cells (digits) per frame. Faster columns spin a shorter, same-digit path. */
	maxCells?: number;
	/** One cell's height in px (font size x line height), for the blur. */
	cellPx?: number;
	shutter?: number;
	blurMax?: number;
	/** Thousands separators in `text`. */
	group?: boolean;
	chime?: boolean;
	hold?: number;
};

export type OdometerColumn = {
	/** Power of ten of the column in the scaled integer (0 = last digit shown). */
	place: number;
	/** Unwrapped strip position; `pos mod 10` is the digit under the window. */
	pos: number;
	/** Digit nearest the window this frame. */
	digit: number;
	/** CSS translateY of an 11-cell strip (0..9 then 0), in percent of the strip height. */
	translateY: number;
	/** Cells moved this frame. */
	rate: number;
	/** Vertical motion blur in px (180 degree shutter), 0 under 0.5 px. */
	blur: number;
	/** feGaussianBlur stdDeviation, vertical only. */
	stdDeviation: string;
	/** True when the column's real path was too fast and it spins the short path instead. */
	spun: boolean;
	/** 0..1 opacity and width factor for a leading column (leading zeros fade out). */
	visible: number;
	/** First frame the column sits on its final digit and stays there. */
	settleFrame: number;
};

export type Odometer = {
	value: number;
	text: string;
	columns: OdometerColumn[];
	progress: number;
	done: boolean;
	endFrame: number;
	sfx: TextSfxCue[];
};

/**
 * Odometer. `V(f) = from + (to - from) * bezier(curve, (f - start) / frames)`, scaled by 10^decimals.
 * Column k: `q = |V| / 10^k`, `r = |V| - floor(q) * 10^k`. Stepped:
 * `pos_k = floor(q) + smoothstep(clamp((r - (10^k - 0.5)) * 2))` (k = 0 is the recipe's
 * `floor + smooth((frac - 0.5) * 2)`), so every column rolls in step with the units' 9 to 0.
 * Carry: `pos_0 = q_0`, `pos_k = floor(q_k) + max(0, pos_(k-1) mod 10 - 9)`. The strip is 11 cells, so
 * `translateY = -(pos mod 10) / 11 * 100 %`. If any column's per-frame step passes `maxCells`, every column
 * spins instead: `pos = d0 + sign * T * e(f)`, with T the largest `r + 10 n` (r = digit distance) that keeps
 * `T * max de` within `maxCells`. Both paths land exactly on the final digit.
 */
export const odometerNumberRoll = (frame: number, o: OdometerOpts): Odometer => {
	const {from = 0, to, start = 0, frames = 45, curve = TEXT_CURVES.roll, decimals = 0, columns = 1, strip = 'stepped', maxCells = 1.5, cellPx = 100, shutter = 0.5, blurMax = 16, group = true, chime = true, hold = 1} = o;
	if (from * to < 0) throw new Error('odometerNumberRoll: from and to must share a sign (a roll does not cross zero).');
	const f = held(frame, hold);
	const sc = 10 ** decimals;
	const A = Math.round(Math.abs(from) * sc);
	const B = Math.round(Math.abs(to) * sc);
	const neg = from < 0 || to < 0;
	const n = Math.max(String(A).length, String(B).length, decimals + 1, columns);
	const end = start + frames;
	const e = (g: number) => progress(g, start, frames, curve);
	const V = (g: number) => A + (B - A) * e(g);

	const smooth = (x: number) => x * x * (3 - 2 * x);
	const truePos = (v: number): number[] => {
		const pos: number[] = [];
		for (let k = 0; k < n; k++) {
			const q = v / 10 ** k;
			const base = Math.floor(q + 1e-9);
			if (strip === 'stepped') {
				// Every column rolls on the second half of the last unit before it changes, so a column rolls
				// exactly while the units roll 9 to 0: remainder r = v - base * 10^k inside [10^k - 0.5, 10^k).
				const r = v - base * 10 ** k;
				pos.push(base + smooth(clamp01((r - (10 ** k - 0.5)) * 2)));
			}
			else pos.push(k === 0 ? q : base + Math.max(0, (pos[k - 1] % 10) - 9));
		}
		return pos;
	};

	let peakDe = 0;
	for (let g = start; g < end; g++) peakDe = Math.max(peakDe, Math.abs(e(g + 1) - e(g)));
	const path: number[][] = [];
	for (let g = start; g <= end; g++) path.push(truePos(V(g)));
	const dir = B >= A ? 1 : -1;
	// One column too fast means every column spins on the same curve, so the slow high columns cannot lag
	// behind and show a wrong number while the low ones land (0 -> 2013 would read "1,013" for 2 frames).
	const anySpun = path.slice(1).some((p, j) => p.some((x, k) => Math.abs(x - path[j][k]) > maxCells));
	const spunCol = Array.from({length: n}, () => anySpun);
	const digitOf = (v: number, k: number) => Math.floor(v / 10 ** k) % 10;
	const travel = Array.from({length: n}, (_, k) => {
		const r = ((((digitOf(B, k) - digitOf(A, k)) * dir) % 10) + 10) % 10;
		const nMax = peakDe > 0 ? Math.floor((maxCells / peakDe - r) / 10) : 0;
		return r + 10 * Math.max(0, nMax);
	});
	const posAt = (g: number, k: number) => (spunCol[k] ? digitOf(A, k) + dir * travel[k] * e(g) : truePos(V(g))[k]);

	const cols: OdometerColumn[] = [];
	const vNow = V(f);
	for (let k = n - 1; k >= 0; k--) {
		const pos = posAt(f, k);
		const rate = Math.abs(posAt(f + 1, k) - pos);
		const b0 = Math.min(blurMax, shutter * rate * cellPx);
		const blur = b0 < 0.5 ? 0 : b0;
		const finalPos = posAt(end, k);
		let settleFrame = start;
		for (let g = end; g >= start; g--) {
			if (Math.abs(posAt(g, k) - finalPos) >= 0.01) {
				settleFrame = g + 1;
				break;
			}
		}
		const m10 = ((pos % 10) + 10) % 10;
		cols.push({
			place: k,
			pos,
			digit: Math.round(m10) % 10,
			translateY: (-m10 / 11) * 100,
			rate,
			blur,
			stdDeviation: `0 ${blur.toFixed(2)}`,
			spun: spunCol[k],
			visible: k <= decimals ? 1 : clamp01((vNow / 10 ** k - 0.5) / 0.5),
			settleFrame: Math.min(settleFrame, end),
		});
	}

	let txt = '';
	cols.forEach((c) => {
		if (c.visible < 0.5 && c.place > decimals) return;
		txt += String(c.digit);
		if (c.place === decimals && decimals > 0) txt += '.';
		else if (group && c.place > decimals && (c.place - decimals) % 3 === 0) txt += ',';
	});
	return {
		value: f >= end ? to : f <= start ? from : (neg ? -1 : 1) * (vNow / sc),
		text: (neg ? '-' : '') + (txt || '0'),
		columns: cols,
		progress: clamp01((f - start) / Math.max(1, frames)),
		done: f >= end,
		endFrame: end,
		sfx: tickCues(cols.filter((c) => c.settleFrame > start).map((c) => c.settleFrame), 'odometer digit stops', chime ? end : undefined, 'odometer lands'),
	};
};

// ---------------------------------------------------------------------------------------------------------
// 3. svgPathDrawOn
// ---------------------------------------------------------------------------------------------------------

export type DrawOnOpts = {
	/** The path `d` (length measured with @remotion/paths getLength) or its length in px. */
	path: string | number;
	start?: number;
	frames?: number;
	curve?: Bezier;
	/** Stroke width in px; the dash pad hides round and square caps at p = 0 and p = 1. 0 for butt caps. */
	strokeWidth?: number;
	/** Draw from the path's end back to its start. */
	reverse?: boolean;
	chime?: boolean;
	hold?: number;
};

export type DrawOn = {
	p: number;
	length: number;
	/** px of the path drawn (0..length). */
	drawn: number;
	/** Distance along the path of the pen tip, for getPointAtLength (reverse: counted from the start). */
	tip: number;
	strokeDasharray: string;
	strokeDashoffset: number;
	/** Pen speed in px per frame this frame. */
	speed: number;
	/** Hide the path while nothing is drawn (belt and braces for the cap dot). */
	visible: boolean;
	done: boolean;
	endFrame: number;
	sfx: TextSfxCue[];
};

/**
 * Draw-on. `pad = strokeWidth`, `strokeDasharray = "L  L + 2 pad"`,
 * `strokeDashoffset = (L + pad) * (1 - p)` (negated for reverse), `p = bezier(curve, (f - start) / frames)`.
 * At p = 0 the dash and both caps sit outside the path; at p = 1 the dash is exactly [0, L].
 */
export const svgPathDrawOn = (frame: number, o: DrawOnOpts): DrawOn => {
	const {path, start = 0, frames = 40, curve = TEXT_CURVES.draw, strokeWidth = 0, reverse = false, chime = false, hold = 1} = o;
	const f = held(frame, hold);
	const L = typeof path === 'number' ? path : getLength(path);
	const pad = Math.max(0, strokeWidth);
	const pAt = (g: number) => progress(g, start, frames, curve);
	const p = pAt(f);
	const off = (L + pad) * (1 - p);
	const drawn = Math.max(0, Math.min(L, L * p));
	const end = start + frames;
	return {
		p,
		length: L,
		drawn,
		tip: reverse ? L - drawn : drawn,
		strokeDasharray: `${L} ${L + 2 * pad}`,
		strokeDashoffset: reverse ? -off : off,
		speed: L * Math.abs(pAt(f + 1) - p),
		visible: p > 0,
		done: f >= end,
		endFrame: end,
		sfx: chime ? tickCues([], 'path draw-on', end, 'path completes') : [],
	};
};

// ---------------------------------------------------------------------------------------------------------
// 4. activeWordHighlight
// ---------------------------------------------------------------------------------------------------------

/** One timed word. Same fields as @remotion/captions `Caption`, so its output can be passed straight in. */
export type TimedWord = {text: string; startMs: number; endMs: number};

export type HighlightOpts = {
	words: TimedWord[];
	fps?: number;
	/** Frames the highlight lands before the spoken onset (hormozi-kinetic: 0, on the spoken frame). */
	lead?: number;
	/** Frames for the block to swipe in behind the word. */
	swipe?: number;
	curve?: Bezier;
	/** A word stays lit at least this long; words that start closer together light as one group. */
	minHold?: number;
	/** A gap this short between two words is bridged, so the block never blinks off. */
	bridge?: number;
	/** Indices of power words (the number, the turn, the payoff): chime on their onset. */
	power?: number[];
	/** A key-click on every word onset (typewriter captions). */
	clicks?: boolean;
	hold?: number;
};

export type HighlightWord = {
	text: string;
	index: number;
	state: 'future' | 'active' | 'past';
	/** 0..1 swipe of the block behind the word (width or colour mix). 0 when not active. */
	t: number;
	on: number;
	off: number;
	power: boolean;
	/** Index of the hold group the word lights with. */
	group: number;
};

export type Highlight = {words: HighlightWord[]; activeIndex: number; activeCount: number; sfx: TextSfxCue[]};

/**
 * Active word highlight. `on_i = round(startMs / 1000 * fps) - lead`. Words whose onsets fall within
 * `minHold` frames of a group's first word join that group; every word in a group stays lit until the
 * group's `off`. `off = max(round(endMs / 1000 * fps) - lead, on + minHold)`, extended to the next
 * group's `on` when the gap is `bridge` frames or less, and never past it. `t = bezier(curve, (f - on + 1) / swipe)`.
 */
export const activeWordHighlight = (frame: number, o: HighlightOpts): Highlight => {
	const {words, fps = FPS, lead = 0, swipe = 4, curve = TEXT_CURVES.punch, minHold = 6, bridge = 6, power = [], clicks = false, hold = 1} = o;
	const f = held(frame, hold);
	const on = words.map((w) => Math.round((w.startMs / 1000) * fps) - lead);
	const rawOff = words.map((w) => Math.round((w.endMs / 1000) * fps) - lead);

	const groups: {first: number; last: number}[] = [];
	words.forEach((_, i) => {
		const g = groups[groups.length - 1];
		if (g && on[i] - on[g.first] < minHold) g.last = i;
		else groups.push({first: i, last: i});
	});
	const gOff = groups.map((g) => Math.max(rawOff[g.last], on[g.first] + minHold));
	groups.forEach((g, gi) => {
		const next = groups[gi + 1];
		if (!next) return;
		if (on[next.first] - gOff[gi] <= bridge) gOff[gi] = on[next.first];
		gOff[gi] = Math.min(gOff[gi], on[next.first]);
	});
	const groupOf = words.map((_, i) => groups.findIndex((g) => i >= g.first && i <= g.last));

	const out: HighlightWord[] = words.map((w, i) => {
		const off = gOff[groupOf[i]];
		const state = f < on[i] ? 'future' : f < off ? 'active' : 'past';
		const t = state === 'active' ? bezier(curve, clamp01((f - on[i] + 1) / Math.max(1, swipe))) : 0;
		return {text: w.text, index: i, state, t, on: on[i], off, power: power.includes(i), group: groupOf[i]};
	});
	const active = out.filter((w) => w.state === 'active');

	const chimes: number[] = [];
	for (const i of [...power].sort((a, b) => a - b)) {
		if (i < 0 || i >= words.length) continue;
		const at = on[i] + lead;
		if (chimes.length === 0 || at - chimes[chimes.length - 1] >= TEXT_SFX.chimeGap) chimes.push(at);
	}
	const sfx: TextSfxCue[] = chimes.map((c) => cue('soft-chime', c, 'power word spoken'));
	if (clicks) {
		let last = -Infinity;
		for (let i = 0; i < words.length; i++) {
			const at = on[i] + lead;
			if (at - last < TEXT_SFX.clickGap || chimes.some((c) => Math.abs(c - at) < TEXT_SFX.clickGap)) continue;
			sfx.push(cue('key-click', at, 'word spoken'));
			last = at;
		}
	}
	return {words: out, activeIndex: active.length ? active[active.length - 1].index : -1, activeCount: active.length, sfx: sfx.sort((a, b) => a.frame - b.frame)};
};
