/**
 * Camera and velocity motion primitives: ambient drift (Zero Dead Velocity), a directional whip pan with
 * speed-driven smear, a simulated dolly (Z) push through CSS perspective, and a multi-plane parallax rig.
 * Every helper is a pure function of the frame number (no state, no Math.random), so any frame renders the
 * same on any worker. Docs: references/motion-camera.md. Rules: personas/motion-choreographer.md sections 1
 * (3 to 4 s visual reset law, 105 frames) and 2 (Zero Dead Velocity, 45 frames).
 *
 * Velocity is the choreographer's definition: v = |value(f + 1) - value(f)| per frame, position in px.
 * Scale is turned into px at the frame edge (half width, 540 px on 1080) so one threshold covers both.
 * Motion blur follows a 180 degree shutter: blur = 0.5 x the px moved in one frame, capped per style.
 */
import {FPS, PRE_ROLL, held, type SfxCue, type SfxId} from './physics';

export type Bezier = readonly [number, number, number, number];

/** Named camera curves, copied from the styles' design-system.json `motion.easings`. */
export const CURVES = {
	/** hormozi-kinetic and 2-5d-parallax-depth `whip`. Slow start, violent middle, hard landing. */
	whip: [0.7, 0, 0.2, 1],
	/** 2-5d-parallax-depth `push`. Gentle ease in and out for a long dolly. */
	push: [0.25, 0.1, 0.25, 1],
	/** dark-neon-dataviz `drift`. Symmetric ease for a whole-film pan. */
	drift: [0.37, 0, 0.63, 1],
	/** tactical-vector-maps `pan`. A map move that starts slow and lands soft. */
	pan: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, Bezier>;

/** The choreographer's limits, at 30 fps. Use `perFrame(pxPerSec, fps)` for other frame rates. */
export const LIMITS = {
	/** Longest run of frames any active layer may sit at zero velocity. */
	deadFrames: 45,
	/** Longest gap between two visual resets (3.5 s). */
	resetGap: 105,
	/** Resets closer than this count as one. */
	resetMerge: 20,
	/** Ambient drift floor and ceiling in px per second (0.3 and 0.667 px per frame at 30 fps). */
	driftMin: 9,
	driftMax: 20,
	/** Ambient scale ceiling (1.5 percent). */
	breatheMax: 0.015,
	/** Breathing period ceiling in frames at 30 fps. */
	breathePeriodMax: 90,
	/** Whip smear cap range in px (motion-choreographer section 4). */
	blurMin: 12,
	blurMax: 20,
	/** Blur under this many px is not drawn: it only softens. */
	blurFloor: 0.5,
} as const;

export const perFrame = (pxPerSec: number, fps = FPS) => pxPerSec / fps;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const clamp01 = (x: number) => clamp(x, 0, 1);

/** CSS cubic-bezier(x1, y1, x2, y2) at progress x, solved exactly (Newton, then bisection), like Remotion's Easing.bezier. */
export const bezier = (b: Bezier, x: number) => {
	if (x <= 0) return 0;
	if (x >= 1) return 1;
	const [x1, y1, x2, y2] = b;
	const ax = 1 + 3 * x1 - 3 * x2, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
	const ay = 1 + 3 * y1 - 3 * y2, by = 3 * y2 - 6 * y1, cy = 3 * y1;
	const X = (t: number) => ((ax * t + bx) * t + cx) * t;
	let t = x;
	for (let i = 0; i < 8; i++) {
		const d = (3 * ax * t + 2 * bx) * t + cx;
		if (Math.abs(d) < 1e-7) break;
		const e = X(t) - x;
		if (Math.abs(e) < 1e-9) return ((ay * t + by) * t + cy) * t;
		t -= e / d;
	}
	if (!(t >= 0 && t <= 1) || Math.abs(X(t) - x) > 1e-7) {
		let lo = 0, hi = 1;
		t = x;
		for (let i = 0; i < 60; i++) {
			if (X(t) < x) lo = t;
			else hi = t;
			t = (lo + hi) / 2;
		}
	}
	return ((ay * t + by) * t + cy) * t;
};

/** Deterministic 0..1 from a string (FNV-1a). Same seed, same value, on every render. */
export const seeded = (seed: string) => {
	let h = 0x811c9dc5;
	for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193);
	return (h >>> 0) / 4294967296;
};

const cue = (sfx: SfxId, peak_frame: number, peak: string): SfxCue => ({frame: Math.max(0, peak_frame - PRE_ROLL[sfx]), sfx, peak, peak_frame, pre_roll: PRE_ROLL[sfx]});

/** Blur in px for a layer moving v px in one frame: 180 degree shutter, capped, dropped under 0.5 px. */
export const shutterBlur = (v: number, cap: number = 16, shutter = 0.5) => {
	const b = Math.min(cap, shutter * Math.abs(v));
	return b < LIMITS.blurFloor ? 0 : b;
};

// ---------------------------------------------------------------------------------------------------------
// 1. zeroDeadVelocityDrift
// ---------------------------------------------------------------------------------------------------------

export type DriftOpts = {
	start?: number;
	/** Last frame of the drift. After it the layer is at rest, so the next tween must start by end + 45. */
	end?: number;
	/** Cruise speed in px per frame. Clamped to 9..20 px per second (0.3..0.667 at 30 fps). */
	speed?: number;
	/** Direction in degrees (0 = right, 90 = down). Overrides `seed`. */
	angle?: number;
	/** Seed for the direction when no angle is given. */
	seed?: string;
	/** Ease-in and ease-out length in frames (smoothstep velocity ramp). */
	ease?: number;
	/** Breathing scale amplitude (0.015 = 1.00 to 1.015 and back). Clamped to 1.5 percent. 0 turns it off. */
	breathe?: number;
	/** Breathing period in frames. Clamped to 90 frames at 30 fps. */
	period?: number;
	/** Half the layer width in px, used to turn scale velocity into px at the edge. */
	halfW?: number;
	/** 2 = on twos (voxel-art, minimalist-doodle). */
	hold?: number;
	fps?: number;
};

export type Drift = {
	x: number;
	y: number;
	scale: number;
	/** Per-frame velocity, v = value(f + 1) - value(f). */
	vx: number;
	vy: number;
	vScale: number;
	/** |v| of the position plus the scale velocity as px at the edge. Zero Dead Velocity wants this above 0. */
	speed: number;
	/** True when the requested speed or breathing was pulled into the choreographer's band. */
	clamped: boolean;
	/** Total px travelled from start to end. */
	distance: number;
	transform: string;
};

/**
 * Ambient drift: one direction, a smoothstep velocity ramp at each end, and an optional breathing scale.
 * The velocity ramp r(u) = 3u^2 - 2u^3 integrates in closed form, so with E ease frames and D = end - start:
 *   s(t) = E (u^3 - u^4 / 2)        t < E,  u = t / E
 *   s(t) = E / 2 + (t - E)           E <= t <= D - E
 *   s(t) = (D - E) - s_ramp(D - t)   t > D - E (mirror)
 * position = speed x s(t) along the angle; total distance = speed x (D - E).
 * breathing: scale = 1 + A (1 - cos(2 pi t / P)) / 2.
 */
export const zeroDeadVelocityDrift = (frame: number, o: DriftOpts = {}): Drift => {
	const fps = o.fps ?? FPS;
	const start = o.start ?? 0;
	const end = Math.max(start + 1, o.end ?? start + 30 * fps);
	const D = end - start;
	const E = clamp(o.ease ?? 12, 0, D / 2);
	const lo = perFrame(LIMITS.driftMin, fps), hi = perFrame(LIMITS.driftMax, fps);
	const want = o.speed ?? perFrame(12, fps);
	const speed = clamp(want, lo, hi);
	const wantA = o.breathe ?? LIMITS.breatheMax;
	const A = clamp(wantA, 0, LIMITS.breatheMax);
	const pMax = (LIMITS.breathePeriodMax * fps) / FPS;
	const wantP = o.period ?? pMax;
	const P = clamp(wantP, 2, pMax);
	const clamped = speed !== want || A !== wantA || P !== wantP;
	const deg = o.angle ?? seeded(o.seed ?? 'drift') * 360;
	const ux = Math.cos((deg * Math.PI) / 180), uy = Math.sin((deg * Math.PI) / 180);
	const halfW = o.halfW ?? 540;
	const ramp = (t: number) => (E > 0 ? E * ((t / E) ** 3 - (t / E) ** 4 / 2) : t);
	const s = (t: number) => {
		if (t <= 0) return 0;
		if (t >= D) return D - E;
		if (t < E) return ramp(t);
		if (t > D - E) return D - E - ramp(D - t);
		return E / 2 + (t - E);
	};
	const at = (f: number) => {
		const t = clamp(held(f, o.hold) - start, 0, D);
		const d = speed * s(t);
		return {x: d * ux, y: d * uy, scale: 1 + (A * (1 - Math.cos((2 * Math.PI * t) / P))) / 2};
	};
	const a = at(frame), b = at(frame + 1);
	const vx = b.x - a.x, vy = b.y - a.y, vScale = b.scale - a.scale;
	return {
		...a,
		vx,
		vy,
		vScale,
		speed: Math.hypot(vx, vy) + Math.abs(vScale) * halfW,
		clamped,
		distance: speed * (D - E),
		transform: `translate(${a.x.toFixed(2)}px, ${a.y.toFixed(2)}px) scale(${a.scale.toFixed(5)})`,
	};
};

// ---------------------------------------------------------------------------------------------------------
// 2. directionalWhipPan
// ---------------------------------------------------------------------------------------------------------

export type WhipDirection = 'left' | 'right' | 'up' | 'down';
export type WhipOpts = {
	start?: number;
	/** Pan length in frames. 10 is the 2-5d-parallax-depth spec; 8 to 12 reads as a whip. */
	frames?: number;
	/** Camera travel in px. Default: the frame width along the axis (a full scene-to-scene whip). */
	distance?: number;
	/** Which way the content moves. 'left' means the new scene enters from the right. */
	direction?: WhipDirection;
	curve?: Bezier;
	/** Smear cap in px. The choreographer's range is 12 to 20. */
	blurMax?: number;
	/** Fraction of a frame the virtual shutter is open (0.5 = 180 degrees). */
	shutter?: number;
	/** Extra stretch along the axis at full smear (0.06 = 6 percent). */
	stretchMax?: number;
	frameW?: number;
	frameH?: number;
	hold?: number;
	fps?: number;
};

export type Whip = {
	p: number;
	/** Camera position along the pan axis, 0 to distance. */
	cam: number;
	/** px moved during this frame's exposure (central difference), the speed the smear follows. */
	v: number;
	blur: number;
	stretch: number;
	/** SVG feGaussianBlur stdDeviation for a one-axis smear, e.g. "14.2 0". */
	stdDeviation: string;
	/** Content offsets in px. The outgoing scene leaves, the incoming scene sits one frame-span behind it. */
	outgoing: {x: number; y: number; transform: string};
	incoming: {x: number; y: number; transform: string};
	/** First frame the incoming scene covers more of the frame than the outgoing one (cut-on-blur point). Equals the landing frame when distance is under half the span. */
	swapFrame: number;
	/** Fastest frame of the pan and its px per frame. */
	peakFrame: number;
	peakV: number;
	landed: boolean;
	sfx: SfxCue[];
};

/**
 * Whip pan: cam(t) = distance x bezier(curve, t / frames). Speed v(f) = cam(f + 0.5) - cam(f - 0.5).
 * Smear = min(blurMax, shutter x v), dropped under 0.5 px, applied on the pan axis only.
 * Stretch = 1 + stretchMax x smear / blurMax on the same axis.
 * The whoosh transient lands on the last frame of the pan (sound-designer), so the cue is fast-whoosh at
 * start + frames with its 6 frame pre-roll.
 */
export const directionalWhipPan = (frame: number, o: WhipOpts = {}): Whip => {
	const fps = o.fps ?? FPS;
	const start = o.start ?? 0;
	const n = Math.max(1, o.frames ?? Math.round((10 * fps) / FPS));
	const dir = o.direction ?? 'left';
	const horiz = dir === 'left' || dir === 'right';
	const span = horiz ? o.frameW ?? 1080 : o.frameH ?? 1920;
	const dist = o.distance ?? span;
	const curve = o.curve ?? CURVES.whip;
	const cap = clamp(o.blurMax ?? 16, 0, LIMITS.blurMax);
	const shutter = o.shutter ?? 0.5;
	const sMax = o.stretchMax ?? 0.06;
	const sign = dir === 'left' || dir === 'up' ? -1 : 1;
	const camAt = (f: number) => dist * bezier(curve, clamp01((f - start) / n));
	const f = held(frame, o.hold);
	const cam = camAt(f);
	const v = Math.abs(camAt(f + 0.5) - camAt(f - 0.5));
	const blur = shutterBlur(v, cap, shutter);
	const stretch = 1 + (cap > 0 ? (sMax * blur) / cap : 0);
	const off = sign * cam;
	const xy = (d: number) => (horiz ? {x: d, y: 0} : {x: 0, y: d});
	const tf = (d: number) => {
		const {x, y} = xy(d);
		return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) ${horiz ? 'scaleX' : 'scaleY'}(${stretch.toFixed(4)})`;
	};
	let swapFrame = start + n, peakFrame = start, peakV = 0;
	for (let k = start; k <= start + n; k++) {
		if (camAt(k) >= span / 2 && swapFrame === start + n) swapFrame = k;
		const vk = Math.abs(camAt(k + 0.5) - camAt(k - 0.5));
		if (vk > peakV) (peakV = vk), (peakFrame = k);
	}
	return {
		p: clamp01((f - start) / n),
		cam,
		v,
		blur,
		stretch,
		stdDeviation: horiz ? `${blur.toFixed(2)} 0` : `0 ${blur.toFixed(2)}`,
		outgoing: {...xy(off), transform: tf(off)},
		incoming: {...xy(off - sign * span), transform: tf(off - sign * span)},
		swapFrame,
		peakFrame,
		peakV,
		landed: f >= start + n,
		sfx: [cue('fast-whoosh', start + n, `whip-pan ${dir}, last frame`)],
	};
};

// ---------------------------------------------------------------------------------------------------------
// 3. simulatedDollyPush
// ---------------------------------------------------------------------------------------------------------

export type DollyOpts = {
	start?: number;
	frames?: number;
	/** Camera travel toward the scene in px of CSS Z. 220 is the 2-5d-parallax-depth whole-film push. */
	push?: number;
	/** CSS perspective in px. 1400 in every style that sets one. */
	perspective?: number;
	/** Depth of the layer being pushed (0 = the hero plane). */
	z?: number;
	/** A bezier, or 'constant' for a camera that never eases (glowing-plexus only). */
	curve?: Bezier | 'constant';
	halfW?: number;
	hold?: number;
	fps?: number;
};

export type Dolly = {
	p: number;
	/** Camera travel so far in px. */
	d: number;
	/** Screen scale of the layer, 1 at rest: (P - z) / (P - z - d). */
	scale: number;
	vScale: number;
	/** Scale velocity as px at the frame edge. */
	edgeV: number;
	transform: string;
	/** A short push (30 frames or less) is a reset and gets a zoom-swell on its landing; a long push is ambient. */
	sfx: SfxCue[];
};

/**
 * Simulated Z push. A layer at translateZ(z) under perspective P is drawn at P / (P - z). Moving the camera
 * forward by d is the same as moving every layer to z + d, so normalised to its rest size the layer scales by
 *   scale(d) = (P - z) / (P - z - d),   d = push x curve(t / frames).
 * Check: P 1400, push 220 gives Z2 (z 0) 1.186, Z1 (-700) 1.117, Z0 (-1400) 1.085, Z3 (500) 1.324, the
 * 19 / 12 / 9 / 32 percent growth in 2-5d-parallax-depth's continuous-z-push.
 */
export const simulatedDollyPush = (frame: number, o: DollyOpts = {}): Dolly => {
	const fps = o.fps ?? FPS;
	const start = o.start ?? 0;
	const n = Math.max(1, o.frames ?? Math.round((180 * fps) / FPS));
	const P = o.perspective ?? 1400;
	const z = o.z ?? 0;
	const push = clamp(o.push ?? 220, -(P * 4), P - z - 1);
	const curve = o.curve ?? CURVES.push;
	const halfW = o.halfW ?? 540;
	const prog = (f: number) => {
		const u = clamp01((held(f, o.hold) - start) / n);
		return curve === 'constant' ? u : bezier(curve, u);
	};
	const sc = (f: number) => (P - z) / (P - z - push * prog(f));
	const p = prog(frame);
	const scale = sc(frame);
	const vScale = sc(frame + 1) - scale;
	const sfx = n <= Math.round((30 * fps) / FPS) && push !== 0 ? [cue('zoom-swell', start + n, 'dolly push lands')] : [];
	return {p, d: push * p, scale, vScale, edgeV: Math.abs(vScale) * halfW, transform: `scale(${scale.toFixed(5)})`, sfx};
};

// ---------------------------------------------------------------------------------------------------------
// 4. multiPlaneParallaxRig
// ---------------------------------------------------------------------------------------------------------

export type Plane = {id: string; z: number; blur?: number};

/** The 2-5d-parallax-depth plane ladder: z, rest depth-of-field blur. Parallax 0.5, 0.67, 1, 1.56. */
export const DEPTH_PLANES: readonly Plane[] = [
	{id: 'Z0', z: -1400, blur: 3},
	{id: 'Z1', z: -700, blur: 2},
	{id: 'Z2', z: 0, blur: 0},
	{id: 'Z3', z: 500, blur: 7},
];

export type RigOpts = {
	planes?: readonly Plane[];
	perspective?: number;
	/** Camera position in px at the hero plane (a whip's `cam` x sign, a drift's x). */
	camX?: number;
	camY?: number;
	/** Camera travel along Z in px (a dolly's `d`). */
	push?: number;
	/** Camera velocity in px per frame at the hero plane, for the smear. */
	vx?: number;
	vy?: number;
	shutter?: number;
	blurMax?: number;
	frameW?: number;
	frameH?: number;
	/** Authored plane size. 1900 x 2200 in 2-5d-parallax-depth. */
	bleed?: {w: number; h: number};
};

export type RigPlane = {
	id: string;
	z: number;
	/** How far this plane moves per px of camera move: P / (P - z - push). */
	parallax: number;
	scale: number;
	x: number;
	y: number;
	/** Blur on each axis: depth of field combined with the smear on the moving axis. */
	blurX: number;
	blurY: number;
	stdDeviation: string;
	/** Plane size needed to cover the frame at this offset and scale. */
	needW: number;
	needH: number;
	edgeSafe: boolean;
	transform: string;
};

/**
 * Parallax rig. For each plane: parallax k = P / (P - z - push), scale = (P - z) / (P - z - push),
 * screen offset = -cam x k, smear = shutter x |v| x k (capped), combined with the rest blur b0 as
 * sqrt(b0^2 + smear^2) on the moving axis, capped at max(blurMax, b0). A plane covers the frame while bleed x scale >= frame + 2 |offset|.
 * The frame argument is not needed: feed it camera values from the other three helpers at the same frame.
 */
export const multiPlaneParallaxRig = (o: RigOpts = {}): RigPlane[] => {
	const P = o.perspective ?? 1400;
	const push = o.push ?? 0;
	const W = o.frameW ?? 1080, H = o.frameH ?? 1920;
	const bleed = o.bleed ?? {w: 1900, h: 2200};
	const cap = clamp(o.blurMax ?? 16, 0, LIMITS.blurMax);
	const sh = o.shutter ?? 0.5;
	return (o.planes ?? DEPTH_PLANES).map((pl) => {
		const k = P / (P - pl.z - push);
		const scale = (P - pl.z) / (P - pl.z - push);
		const x = -(o.camX ?? 0) * k, y = -(o.camY ?? 0) * k;
		const b0 = pl.blur ?? 0;
		const mx = shutterBlur((o.vx ?? 0) * k, cap, sh), my = shutterBlur((o.vy ?? 0) * k, cap, sh);
		const top = Math.max(cap, b0);
		const blurX = Math.min(top, Math.hypot(b0, mx)), blurY = Math.min(top, Math.hypot(b0, my));
		const needW = (W + 2 * Math.abs(x)) / scale, needH = (H + 2 * Math.abs(y)) / scale;
		return {
			id: pl.id,
			z: pl.z,
			parallax: k,
			scale,
			x,
			y,
			blurX,
			blurY,
			stdDeviation: `${blurX.toFixed(2)} ${blurY.toFixed(2)}`,
			needW,
			needH,
			edgeSafe: needW <= bleed.w && needH <= bleed.h,
			transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(5)})`,
		};
	});
};

// ---------------------------------------------------------------------------------------------------------
// Enforcement: the two laws as checks over frames.
// ---------------------------------------------------------------------------------------------------------

/**
 * Zero Dead Velocity check. `sample(f)` returns the layer's channels in px (scale as scale x half width).
 * A frame is dead when every channel moves less than `eps` px to the next frame. Returns the longest dead run.
 */
export const maxDeadRun = (sample: (f: number) => number[], from: number, to: number, eps = 0.01) => {
	let run = 0, best = 0, at = from, cur = from;
	for (let f = from; f < to; f++) {
		const a = sample(f), b = sample(f + 1);
		const dead = a.every((v, i) => Math.abs(b[i] - v) < eps);
		if (dead) {
			if (!run) cur = f;
			run++;
			if (run > best) (best = run), (at = cur);
		} else run = 0;
	}
	return {run: best, at, ok: best <= LIMITS.deadFrames};
};

/**
 * 3 to 4 s visual reset check. Frame 0 counts as a reset; resets within 20 frames of a kept reset merge
 * into it; every gap, and the gap from the last reset to the end, must be 105 frames or less.
 */
export const visualResets = (resets: number[], total: number, maxGap: number = LIMITS.resetGap, merge: number = LIMITS.resetMerge) => {
	const kept: number[] = [];
	for (const r of [0, ...resets].filter((r) => r >= 0 && r < total).sort((a, b) => a - b)) if (!kept.length || r - kept[kept.length - 1] >= merge) kept.push(r);
	const edges = [...kept, total];
	const gaps = kept.map((r, i) => ({from: r, to: edges[i + 1], gap: edges[i + 1] - r}));
	const worst = Math.max(...gaps.map((g) => g.gap));
	return {kept, gaps, maxGap: worst, ok: worst <= maxGap, violations: gaps.filter((g) => g.gap > maxGap)};
};
