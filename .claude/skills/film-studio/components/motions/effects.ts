/**
 * Stylized distortion and frame-rate texture primitives: a perspective 3D axis flip, an RGB chromatic
 * glitch, stepped stop-motion jitter and film gate flicker. Every helper is a pure function of the frame
 * number (no state, no Math.random), so any frame renders the same on any Remotion worker. Docs:
 * references/motion-effects.md. Rules: personas/motion-choreographer.md section 4 (limits: 2 per film
 * each; glitch and jitter never share the same 20 frames) and personas/sound-designer.md section 1
 * (card-flick 3 frame pre-roll, static-zap and stop-tick on the frame).
 *
 * Deterministic means: every random value is rand(seed, pose index), and the pose index is
 * floor((frame - start) * stepFps / FPS). A frame inside one pose always gets the same pose, so a worker
 * that starts mid film draws exactly what a worker that rendered from frame 0 draws.
 */
import {FPS} from './physics';
import {bezier, type Bezier} from './camera';

// ---------------------------------------------------------------------------------------------------------
// Shared: curves, bounds, SFX cues, seeded random, stepped clock
// ---------------------------------------------------------------------------------------------------------

/** Named curves, copied from the styles' design-system.json `motion.easings`. */
export const EFFECT_CURVES = {
	/** neo-brutalist-ui `flip`. Slow off the face, fast through edge-on, slow landing. */
	flip: [0.65, 0, 0.35, 1],
	linear: [0, 0, 1, 1],
} as const satisfies Record<string, Bezier>;

/** Hard bounds. Inputs outside them are clamped, not trusted. */
export const EFFECT_BOUNDS = {
	/** Chromatic offset in px at 1080 wide. Choreographer: 4 to 10. scifi-hud's own token is 12, so 12 is the cap. */
	glitchOffset: {min: 4, max: 12},
	/** Glitch length in frames. holographic-wireframe 4, scifi-hud 8, choreographer 6 to 10. */
	glitchFrames: {min: 4, max: 10},
	/** Jitter amplitude in px. Choreographer: 1 to 3. archival-grunge token 1.6. */
	jitterPx: {min: 1, max: 3},
	/** Jitter rotation in degrees. archival-grunge token 0.5. */
	jitterDeg: {min: 0, max: 1},
	/** Gate flicker black overlay. archival-grunge failures.md: above 0.08 reads as a strobe. */
	flickerAlpha: {min: 0, max: 0.08},
	/** Stepped texture rates. 8 and 12 fps are the two the doc covers; anything 4 to 15 is accepted. */
	stepFps: {min: 4, max: 15},
} as const;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const clamp01 = (x: number) => clamp(x, 0, 1);

/** Deterministic 0..1 from a seed and integers (FNV-1a over the key, then an avalanche mix). */
export const rand = (seed: string, ...n: number[]) => {
	let h = 0x811c9dc5;
	const s = `${seed}|${n.join('|')}`;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
	h ^= h >>> 15;
	h = Math.imul(h, 0x2c1b3c6d);
	h ^= h >>> 12;
	return (h >>> 0) / 4294967296;
};
/** Deterministic -1..1. */
const sym = (seed: string, ...n: number[]) => rand(seed, ...n) * 2 - 1;

/**
 * Stepped clock. pose = floor((frame - start) * stepFps / fps). At 30 fps, 12 fps holds 3,2,3,2 frames
 * and 8 fps holds 4,4,4,3 frames; the pattern is exact and the same on every worker.
 */
export const steppedPose = (frame: number, stepFps: number, start = 0, fps = FPS) => {
	const r = clamp(stepFps, EFFECT_BOUNDS.stepFps.min, EFFECT_BOUNDS.stepFps.max);
	// The epsilon keeps 12 * 5 / 30 = 2 from landing on 1.9999 on one machine and 2 on another.
	const pose = Math.floor(((frame - start) * r) / fps + 1e-9);
	const poseStart = start + Math.ceil((pose * fps) / r - 1e-9);
	const nextStart = start + Math.ceil(((pose + 1) * fps) / r - 1e-9);
	return {pose, poseStart, holdFrames: nextStart - poseStart, isNewPose: frame === poseStart};
};

export type EffectSfxId = 'card-flick' | 'static-zap' | 'stop-tick';
export type EffectSfxCue = {frame: number; sfx: EffectSfxId; peak: string; peak_frame: number; pre_roll: number};

/** Sound designer lookup: card-flick has a 3 frame pre-roll, the other two have hard transients. */
export const EFFECT_SFX = {
	preRoll: {'card-flick': 3, 'static-zap': 0, 'stop-tick': 0} as Record<EffectSfxId, number>,
	/** Stop-ticks closer than this merge (12 fps poses would otherwise tick 12 times a second). */
	tickGap: 5,
	syncTolerance: 2,
};

const cue = (sfx: EffectSfxId, peak_frame: number, peak: string): EffectSfxCue => ({
	frame: Math.max(0, peak_frame - EFFECT_SFX.preRoll[sfx]),
	sfx,
	peak,
	peak_frame,
	pre_roll: EFFECT_SFX.preRoll[sfx],
});

// ---------------------------------------------------------------------------------------------------------
// 1. axisFlip3D
// ---------------------------------------------------------------------------------------------------------

export type FlipAxis = 'x' | 'y';
export type AxisFlipOpts = {
	start?: number;
	/** Turn length. neo-brutalist-ui 18, voxel-art 16. */
	frames?: number;
	axis?: FlipAxis;
	/**
	 * 'turn': one card with two faces rotates 0 to `turn` degrees (neo-brutalist CardFlip, voxel 360 hop).
	 * 'swap': the choreographer's flip. Content A turns 0 to 90, the content swaps on the edge-on frame,
	 * content B turns -90 to 0. One face only, so no back face to build.
	 */
	mode?: 'turn' | 'swap';
	/** Total degrees in 'turn' mode: 180 shows the back, 360 comes round to the front. */
	turn?: number;
	/** Turn direction: 1 or -1. */
	dir?: 1 | -1;
	curve?: Bezier;
	/** CSS perspective on the parent, px. 2-5d-parallax-depth and neo-brutalist-ui use 1400. */
	perspective?: number;
	/** Darken the face as it turns away: brightness = 1 - shade * (1 - |cos|). 0 turns it off. */
	shade?: number;
	sfx?: boolean;
};
export type AxisFlip = {
	t: number;
	/** Rotation applied to the turning element, degrees. */
	angle: number;
	transform: string;
	/** Put on the parent. */
	parentStyle: {perspective: string; perspectiveOrigin: string};
	/** Which content shows: 'front' (A) or 'back' (B). */
	face: 'front' | 'back';
	/** First frame at or past edge-on (|angle| >= 90). In 'swap' mode the content changes on this frame. */
	swapFrame: number;
	/** |cos(angle)| < 0.05: the card is a sliver. Edge-on frames are sampled half a frame later, so this is false for any flip of 8 frames or more. */
	edgeOn: boolean;
	brightness: number;
	/** Rotation speed this frame, degrees per frame. */
	speed: number;
	done: boolean;
	endFrame: number;
	sfx: EffectSfxCue[];
};

type FlipCore = {start: number; frames: number; mode: 'turn' | 'swap'; turn: number; dir: 1 | -1; curve: Bezier};

const flipAngle = (f: number, o: FlipCore) => {
	const t = bezier(o.curve, clamp01((f - o.start) / Math.max(1, o.frames)));
	if (o.mode === 'swap') return {t, angle: o.dir * (t < 0.5 ? 180 * t : 180 * t - 180)};
	return {t, angle: o.dir * o.turn * t};
};

const EDGE_COS = 0.05;
const isEdge = (angle: number) => Math.abs(Math.cos((angle * Math.PI) / 180)) < EDGE_COS;
/**
 * The angle actually drawn on frame f. An even `frames` puts t = 0.5 on a whole frame, which is exactly
 * 90 degrees: a sliver with both faces hidden, so a blank frame. When a frame lands edge-on, it is sampled
 * half a frame later instead (about 13 degrees past edge-on at an 18 frame flip's top speed). Pure in f.
 */
const flipSample = (f: number, o: FlipCore) => {
	const x = flipAngle(f, o);
	return f > o.start && f < o.start + o.frames && isEdge(x.angle) ? flipAngle(f + 0.5, o) : x;
};

export const axisFlip3D = (frame: number, o: AxisFlipOpts = {}): AxisFlip => {
	const p: FlipCore = {
		start: o.start ?? 0,
		frames: o.frames ?? 18,
		mode: o.mode ?? 'turn',
		turn: o.turn ?? 180,
		dir: o.dir ?? 1,
		curve: o.curve ?? EFFECT_CURVES.flip,
	};
	const axis = o.axis ?? 'y';
	const perspective = o.perspective ?? 1400;
	const shade = o.shade ?? 0.25;
	const {t, angle} = flipSample(frame, p);
	const prev = flipSample(frame - 1, p).angle;
	// Face: in 'turn' mode the back shows while the normal points away (90 < angle mod 360 < 270).
	const a = Math.abs(angle) % 360;
	const face: 'front' | 'back' = p.mode === 'swap' ? (t >= 0.5 ? 'back' : 'front') : a > 90 && a < 270 ? 'back' : 'front';
	// Swap frame: the first whole frame whose angle has passed 90.
	let swapFrame = p.start + p.frames;
	for (let f = p.start; f <= p.start + p.frames; f++) {
		const x = flipSample(f, p);
		if (p.mode === 'swap' ? x.t >= 0.5 : Math.abs(x.angle) >= 90) {
			swapFrame = f;
			break;
		}
	}
	const cos = Math.abs(Math.cos((angle * Math.PI) / 180));
	const endFrame = p.start + p.frames;
	return {
		t,
		angle,
		transform: `rotate${axis.toUpperCase()}(${angle.toFixed(3)}deg)`,
		parentStyle: {perspective: `${perspective}px`, perspectiveOrigin: '50% 50%'},
		face,
		swapFrame,
		edgeOn: cos < EDGE_COS,
		brightness: 1 - shade * (1 - cos),
		speed: Math.abs(angle - prev),
		done: frame >= endFrame,
		endFrame,
		sfx: o.sfx === false ? [] : [cue('card-flick', swapFrame, `axis flip edge-on (${p.mode})`)],
	};
};

// ---------------------------------------------------------------------------------------------------------
// 2. rgbChromaticGlitch
// ---------------------------------------------------------------------------------------------------------

/** feColorMatrix values that keep one channel (and alpha). Build the filter from these. */
export const CHANNEL_MATRIX = {
	r: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
	g: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
	b: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
} as const;

export type GlitchOpts = {
	start: number;
	frames?: number;
	/** Peak red/blue offset, px. Clamped to EFFECT_BOUNDS.glitchOffset. */
	offset?: number;
	/**
	 * 'decay': offset falls linearly to 0 over the glitch (scifi-hud).
	 * 'flip': full offset, sign flips every frame (holographic-wireframe).
	 */
	mode?: 'decay' | 'flip';
	/** Horizontal slice bands (scifi-hud 3). 0 for none. */
	bands?: number;
	/** Largest band shift as a multiple of `offset`. */
	bandShift?: number;
	/** Band layout re-rolls every this many frames, so slices do not strobe every frame. */
	bandStep?: number;
	axis?: 'x' | 'y';
	seed?: string;
	sfx?: boolean;
};
export type GlitchBand = {top: number; bottom: number; dx: number; clipPath: string; transform: string};
export type Glitch = {
	active: boolean;
	/** Frame index inside the glitch, -1 outside. */
	i: number;
	/** 0..1 strength this frame. */
	amount: number;
	/** Red channel offset; blue gets -dx; green stays put. */
	dx: number;
	redTransform: string;
	blueTransform: string;
	bands: GlitchBand[];
	/** Pad for the SVG filter region so shifted channels are not clipped: x = -pad%, width = 100 + 2 pad %. */
	filterPadPct: (elementPx: number) => number;
	endFrame: number;
	sfx: EffectSfxCue[];
};

export const rgbChromaticGlitch = (frame: number, o: GlitchOpts): Glitch => {
	const frames = Math.round(clamp(o.frames ?? 8, EFFECT_BOUNDS.glitchFrames.min, EFFECT_BOUNDS.glitchFrames.max));
	const offset = clamp(o.offset ?? 10, EFFECT_BOUNDS.glitchOffset.min, EFFECT_BOUNDS.glitchOffset.max);
	const mode = o.mode ?? 'decay';
	const nBands = Math.max(0, Math.round(o.bands ?? 3));
	const bandShift = o.bandShift ?? 1.4;
	const bandStep = Math.max(1, Math.round(o.bandStep ?? 2));
	const axis = o.axis ?? 'x';
	const seed = o.seed ?? 'glitch';
	const i = frame - o.start;
	const active = i >= 0 && i < frames;
	const endFrame = o.start + frames;
	const sfx = o.sfx === false ? [] : [cue('static-zap', o.start, 'rgb chromatic glitch onset')];
	const filterPadPct = (px: number) => Math.ceil(((offset * Math.max(1, bandShift)) / Math.max(1, px)) * 100) + 1;
	const tr = (v: number) => (axis === 'x' ? `translateX(${v.toFixed(2)}px)` : `translateY(${v.toFixed(2)}px)`);
	if (!active) return {active, i: -1, amount: 0, dx: 0, redTransform: tr(0), blueTransform: tr(0), bands: [], filterPadPct, endFrame, sfx};

	// decay: 1 - i / frames, so the last glitch frame is still visible and frame `frames` is clean.
	const amount = mode === 'decay' ? 1 - i / frames : 1;
	const sign = mode === 'flip' ? (i % 2 === 0 ? -1 : 1) : -1;
	const dx = sign * offset * amount;

	// Bands: sorted cut points re-rolled every bandStep frames; each band shifts by a seeded amount of at
	// least 0.3 of the max (no dead slice), alternating sign so neighbouring bands tear apart.
	const roll = Math.floor(i / bandStep);
	const bands: GlitchBand[] = [];
	if (nBands > 0) {
		const cuts = [0];
		for (let k = 1; k < nBands; k++) cuts.push((k + (rand(seed, o.start, roll, k) - 0.5) * 0.6) / nBands);
		cuts.push(1);
		for (let k = 0; k < nBands; k++) {
			const top = cuts[k] * 100;
			const bottom = cuts[k + 1] * 100;
			const mag = (0.3 + 0.7 * rand(seed, o.start, roll, k, 99)) * bandShift * offset * amount;
			const v = (k % 2 === 0 ? -1 : 1) * mag;
			bands.push({
				top,
				bottom,
				dx: v,
				clipPath:
					axis === 'x'
						? `inset(${top.toFixed(2)}% 0 ${(100 - bottom).toFixed(2)}% 0)`
						: `inset(0 ${(100 - bottom).toFixed(2)}% 0 ${top.toFixed(2)}%)`,
				transform: tr(v),
			});
		}
	}
	return {active, i, amount, dx, redTransform: tr(dx), blueTransform: tr(-dx), bands, filterPadPct, endFrame, sfx};
};

// ---------------------------------------------------------------------------------------------------------
// 3. stopMotionSteppedJitter
// ---------------------------------------------------------------------------------------------------------

export type JitterOpts = {
	/** Pose rate. archival-grunge 12; 8 reads chunkier and more handmade. */
	fps?: number;
	/** Max offset each axis, px. Clamped to EFFECT_BOUNDS.jitterPx. archival-grunge 1.6. */
	px?: number;
	/** Max rotation, degrees. archival-grunge 0.5. */
	deg?: number;
	/** Max scale wobble, e.g. 0.01 for 1 percent. 0 by default. */
	scale?: number;
	start?: number;
	/** Exclusive end frame. Outside [start, end) the element is at rest. */
	end?: number;
	/** One seed per element, so two lines never jitter together. */
	seed?: string;
	/** 'onset' ticks once at start; 'poses' ticks on pose changes, merged under EFFECT_SFX.tickGap; 'none'. */
	ticks?: 'onset' | 'poses' | 'none';
	/** Composition fps. */
	compFps?: number;
};
export type Jitter = {
	active: boolean;
	pose: number;
	x: number;
	y: number;
	rot: number;
	scale: number;
	transform: string;
	isNewPose: boolean;
	holdFrames: number;
	sfx: EffectSfxCue[];
};

export const stopMotionSteppedJitter = (frame: number, o: JitterOpts = {}): Jitter => {
	const stepFps = o.fps ?? 12;
	const compFps = o.compFps ?? FPS;
	const px = clamp(o.px ?? 1.6, EFFECT_BOUNDS.jitterPx.min, EFFECT_BOUNDS.jitterPx.max);
	const deg = clamp(o.deg ?? 0.5, EFFECT_BOUNDS.jitterDeg.min, EFFECT_BOUNDS.jitterDeg.max);
	const sc = o.scale ?? 0;
	const start = o.start ?? 0;
	const end = o.end ?? Infinity;
	const seed = o.seed ?? 'jitter';
	const ticks = o.ticks ?? 'onset';
	const active = frame >= start && frame < end;
	const s = steppedPose(frame, stepFps, start, compFps);

	// A pose must differ visibly from the one before it, or a 12 fps jitter drops to 6 fps on some poses.
	// If the seeded pose lands inside a 0.35 * px box around the previous drawn pose, x is pushed out to
	// that distance (toward the side with room). The previous pose is resolved the same way, back at most
	// 8 poses (past that the raw pose is used), so this is still a pure function of the frame.
	const raw = (n: number) => ({x: sym(seed, n, 1) * px, y: sym(seed, n, 2) * px});
	const posed = (n: number, depth = 8): {x: number; y: number} => {
		const c = raw(n);
		if (n <= 0) return c;
		const q = depth > 0 ? posed(n - 1, depth - 1) : raw(n - 1);
		const min = 0.35 * px;
		if (Math.abs(c.x - q.x) < min && Math.abs(c.y - q.y) < min) c.x = q.x + (q.x > 0 ? -min : min);
		return c;
	};
	const {x, y} = active ? posed(s.pose) : {x: 0, y: 0};
	const rot = active ? sym(seed, s.pose, 3) * deg : 0;
	const scale = active ? 1 + sym(seed, s.pose, 4) * sc : 1;

	const sfx: EffectSfxCue[] = [];
	if (ticks === 'onset') sfx.push(cue('stop-tick', start, 'stop-motion jitter onset'));
	if (ticks === 'poses' && Number.isFinite(end)) {
		let last = -Infinity;
		for (let f = start; f < end; f++) {
			if (!steppedPose(f, stepFps, start, compFps).isNewPose || f - last < EFFECT_SFX.tickGap) continue;
			sfx.push(cue('stop-tick', f, 'stop-motion pose'));
			last = f;
		}
	}
	return {
		active,
		pose: active ? s.pose : -1,
		x,
		y,
		rot,
		scale,
		transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)${sc ? ` scale(${scale.toFixed(4)})` : ''}`,
		isNewPose: active && s.isNewPose,
		holdFrames: s.holdFrames,
		sfx,
	};
};

// ---------------------------------------------------------------------------------------------------------
// 4. filmGateFlicker
// ---------------------------------------------------------------------------------------------------------

export type FlickerOpts = {
	/** Re-roll rate. archival-grunge 12. */
	fps?: number;
	/** Max black overlay alpha. Clamped to EFFECT_BOUNDS.flickerAlpha. archival-grunge 0.07. */
	brightness?: number;
	/** Gate weave, px, on the whole frame. archival-grunge 1. */
	weave?: number;
	/** Dust specks per pose. archival-grunge 14. */
	specks?: number;
	/** Chance a pose shows the scratch. archival-grunge recipe 0.35. */
	scratchChance?: number;
	/** Scratch alpha. archival-grunge 0.18. */
	scratchAlpha?: number;
	start?: number;
	seed?: string;
	compFps?: number;
};
export type Speck = {x: number; y: number; r: number; dark: boolean; alpha: number};
export type FilmGate = {
	pose: number;
	/** Black overlay alpha, 0..brightness. */
	overlayAlpha: number;
	/** Whole-frame offset, px: lateral weave plus half as much vertical. */
	weaveX: number;
	weaveY: number;
	weaveTransform: string;
	/** x and y in percent of the frame; r in px at 1080 wide. */
	specks: Speck[];
	scratch: {visible: boolean; x: number; width: number; alpha: number};
	isNewPose: boolean;
	holdFrames: number;
	/** Gate flicker is a bed texture: it carries no SFX cue. */
	sfx: EffectSfxCue[];
};

export const filmGateFlicker = (frame: number, o: FlickerOpts = {}): FilmGate => {
	const stepFps = o.fps ?? 12;
	const max = clamp(o.brightness ?? 0.07, EFFECT_BOUNDS.flickerAlpha.min, EFFECT_BOUNDS.flickerAlpha.max);
	const weave = o.weave ?? 1;
	const n = Math.max(0, Math.round(o.specks ?? 14));
	const scratchChance = clamp01(o.scratchChance ?? 0.35);
	const scratchAlpha = o.scratchAlpha ?? 0.18;
	const seed = o.seed ?? 'gate';
	const s = steppedPose(frame, stepFps, o.start ?? 0, o.compFps ?? FPS);
	const P = s.pose;

	const overlayAlpha = max * rand(seed, P, 1);
	const weaveX = sym(seed, P, 2) * weave;
	const weaveY = sym(seed, P, 3) * weave * 0.5;
	const specks: Speck[] = [];
	for (let k = 0; k < n; k++) {
		specks.push({
			x: rand(seed, P, 10, k) * 100,
			y: rand(seed, P, 11, k) * 100,
			r: 1 + 2.6 * rand(seed, P, 12, k),
			dark: k % 2 === 0,
			alpha: 0.25 + 0.45 * rand(seed, P, 13, k),
		});
	}
	// The scratch keeps its x for a run of 6 poses (half a second at 12 fps): a real scratch is on the
	// print, so it does not jump every pose. Only its visibility re-rolls per pose.
	const run = Math.floor(P / 6);
	const scratch = {visible: rand(seed, P, 20) < scratchChance, x: 8 + 84 * rand(seed, run, 21), width: 1.5, alpha: scratchAlpha};
	return {
		pose: P,
		overlayAlpha,
		weaveX,
		weaveY,
		weaveTransform: `translate(${weaveX.toFixed(2)}px, ${weaveY.toFixed(2)}px)`,
		specks,
		scratch,
		isNewPose: s.isNewPose,
		holdFrames: s.holdFrames,
		sfx: [],
	};
};
