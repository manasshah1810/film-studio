/**
 * Physics motion primitives: spring pop-in, elastic pull-back zoom, gravity drop with bounces, and
 * volume-preserving squash and stretch. Every helper is a pure function of the frame number (no state, no
 * random), so any frame renders the same on any worker. Docs: references/motion-physics.md.
 *
 * The spring is the closed-form damped oscillator Remotion's own `spring()` steps frame by frame
 * (remotion/dist/cjs/spring/spring-utils.js). Because the step is exact, `springValue(cfg, n)` equals
 * `spring({frame: n, fps, config: cfg})` to float precision, and the peak and settle frames below are
 * computed, not guessed. Like Remotion, damping ratios of 1 or more use the critically damped branch.
 *
 * SFX cues follow personas/sound-designer.md: `peak` is the frame the motion lands, `pre_roll` is how
 * early a swell starts, and `frame = peak - pre_roll` is where the file starts.
 */

export type SpringConfig = {damping: number; stiffness: number; mass: number};
export type SfxId = 'tactile-pop' | 'zoom-swell' | 'sub-bass-hit' | 'click-soft' | 'stop-tick' | 'fast-whoosh';
export type SfxCue = {frame: number; sfx: SfxId; peak: string; peak_frame: number; pre_roll: number};

export const FPS = 30;

/** Named presets. All sit inside motion-choreographer's spring-overshoot band (damping 10 to 14, stiffness 160 to 200). */
export const PRESETS = {
	/** Fast, one small overshoot (about 7 percent). UI, captions, data labels. */
	snappy: {damping: 14, stiffness: 200, mass: 0.6},
	/** Big rubbery overshoot (about 24 percent) and a visible second swing. Characters, stickers, wins. */
	bouncy: {damping: 10, stiffness: 180, mass: 0.8},
	/** Slow, weighty, moderate overshoot (about 16 percent). Cards, blocks, world-scale moves. */
	heavy: {damping: 14, stiffness: 160, mass: 1.2},
} as const satisfies Record<string, SpringConfig>;
export type PresetName = keyof typeof PRESETS;

/** SFX pre-roll in frames, from personas/sound-designer.md section 2. Sounds not listed there start on the peak. */
export const PRE_ROLL: Record<SfxId, number> = {'tactile-pop': 0, 'zoom-swell': 9, 'sub-bass-hit': 0, 'click-soft': 0, 'stop-tick': 0, 'fast-whoosh': 6};

const cue = (sfx: SfxId, peak_frame: number, peak: string): SfxCue => ({frame: Math.max(0, peak_frame - PRE_ROLL[sfx]), sfx, peak, peak_frame, pre_roll: PRE_ROLL[sfx]});
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** Frame quantised to a hold (2 = on twos). A hold of 1 leaves the frame alone. */
export const held = (frame: number, hold = 1) => (hold > 1 ? Math.floor(frame / hold) * hold : frame);
export const resolveSpring = (s: PresetName | SpringConfig): SpringConfig => (typeof s === 'string' ? PRESETS[s] : s);

/** Damping ratio zeta, natural frequency w0 and damped frequency wd (rad per second). */
export const springParams = (cfg: SpringConfig) => {
	const zeta = cfg.damping / (2 * Math.sqrt(cfg.stiffness * cfg.mass));
	const w0 = Math.sqrt(cfg.stiffness / cfg.mass);
	const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
	return {zeta, w0, wd};
};

/**
 * Spring position from 0 to 1, `t` frames after release, starting at rest.
 * Underdamped (zeta < 1): x(t) = 1 - e^(-zeta w0 s) (cos(wd s) + (zeta w0 / wd) sin(wd s)), with s = t / fps.
 * Otherwise: x(t) = 1 - e^(-w0 s) (1 + w0 s).
 */
export const springValue = (cfg: SpringConfig, t: number, fps = FPS) => {
	if (t <= 0) return 0;
	const {zeta, w0, wd} = springParams(cfg);
	const s = t / fps;
	if (zeta < 1) return 1 - Math.exp(-zeta * w0 * s) * (Math.cos(wd * s) + ((zeta * w0) / wd) * Math.sin(wd * s));
	return 1 - Math.exp(-w0 * s) * (1 + w0 * s);
};

/** Spring velocity in units per frame. Underdamped: x'(s) = (w0^2 / wd) e^(-zeta w0 s) sin(wd s), divided by fps. */
export const springVelocity = (cfg: SpringConfig, t: number, fps = FPS) => {
	if (t <= 0) return 0;
	const {zeta, w0, wd} = springParams(cfg);
	const s = t / fps;
	if (zeta < 1) return ((w0 * w0) / wd) * Math.exp(-zeta * w0 * s) * Math.sin(wd * s) / fps;
	return w0 * w0 * s * Math.exp(-w0 * s) / fps;
};

export type SpringInfo = {
	zeta: number;
	/** Fraction past the target at the first peak: e^(-zeta pi / sqrt(1 - zeta^2)). 0 when zeta >= 1. */
	overshoot: number;
	/** Frame (fractional) the value first reaches 1: s1 = (pi - atan(sqrt(1 - zeta^2) / zeta)) / wd. */
	cross: number;
	/** Frames (fractional) of the first three extremes: s_k = k pi / wd. Odd k are overshoots, even k undershoots. */
	extremes: number[];
	/**
	 * First integer frame from which |1 - x| stays under `eps` on every later frame. Found by scanning back from the
	 * envelope bound s = ln(1 / (eps sqrt(1 - zeta^2))) / (zeta w0), past which no frame can exceed eps.
	 */
	settle: number;
};

const exactSettle = (cfg: SpringConfig, fps: number, eps: number, bound: number) => {
	let n = bound;
	while (n > 0 && Math.abs(1 - springValue(cfg, n - 1, fps)) < eps) n--;
	return n;
};

export const springInfo = (s: PresetName | SpringConfig, fps = FPS, eps = 0.005): SpringInfo => {
	const cfg = resolveSpring(s);
	const {zeta, w0, wd} = springParams(cfg);
	if (zeta < 1) {
		const r = Math.sqrt(1 - zeta * zeta);
		return {
			zeta,
			overshoot: Math.exp((-zeta * Math.PI) / r),
			cross: ((Math.PI - Math.atan(r / zeta)) / wd) * fps,
			extremes: [1, 2, 3].map((k) => ((k * Math.PI) / wd) * fps),
			settle: exactSettle(cfg, fps, eps, Math.ceil((Math.log(1 / (eps * r)) / (zeta * w0)) * fps)),
		};
	}
	let n = 0;
	while (n < 3000 && 1 - springValue(cfg, n, fps) >= eps) n++;
	return {zeta, overshoot: 0, cross: Infinity, extremes: [], settle: n};
};

const peakFrame = (start: number, info: SpringInfo, hold: number) => {
	// With a hold the overshoot shows on the first held frame at or after the true peak.
	const raw = start + (info.extremes[0] ?? info.settle);
	return hold > 1 ? start + Math.ceil((raw - start) / hold) * hold : Math.round(raw);
};

// ---------------------------------------------------------------------------------------------------------
// 1. springPopIn
// ---------------------------------------------------------------------------------------------------------

export type PopInOptions = {
	/** Release frame. */
	start?: number;
	spring?: PresetName | SpringConfig;
	/** Scale at release. 0 pops from nothing; 0.6 is a softer pop. */
	from?: number;
	/** Frames over which opacity reaches 1 (opacity never overshoots). */
	fadeFrames?: number;
	/** Rise in px that settles with the same spring (0 for none). */
	rise?: number;
	/** Sample on holds (2 for voxel-art and minimalist-doodle `stepped`). */
	hold?: number;
	fps?: number;
};
export type PopIn = {progress: number; scale: number; opacity: number; y: number; info: SpringInfo; sfx: SfxCue};

/**
 * scale(f) = from + (1 - from) x(f - start); opacity(f) = clamp((f - start) / fadeFrames); y(f) = rise (1 - x).
 * SFX: tactile-pop on the overshoot top, start + pi / wd frames.
 */
export const springPopIn = (frame: number, o: PopInOptions = {}): PopIn => {
	const {start = 0, spring = 'snappy', from = 0, fadeFrames = 3, rise = 0, hold = 1, fps = FPS} = o;
	const cfg = resolveSpring(spring);
	const t = held(frame - start, hold);
	const x = springValue(cfg, t, fps);
	const info = springInfo(cfg, fps);
	return {
		progress: x,
		scale: from + (1 - from) * x,
		opacity: clamp01(t / Math.max(1, fadeFrames)),
		y: rise * (1 - x),
		info,
		sfx: cue('tactile-pop', peakFrame(start, info, hold), 'spring-overshoot, pop-in lands'),
	};
};

// ---------------------------------------------------------------------------------------------------------
// 2. elasticPullBackZoom
// ---------------------------------------------------------------------------------------------------------

export type PullBackOptions = {
	/** First frame of the anticipation. The release is start + anticipation. */
	start?: number;
	/** Scale before the move (the tight shot). Styles: hormozi 1.15 default, low-poly-isometric 1.55. */
	from?: number;
	to?: number;
	/** Anticipation length in frames. 0 releases at once. */
	anticipation?: number;
	/** How far the anticipation leans in, as a fraction of (from - to). */
	lean?: number;
	spring?: PresetName | SpringConfig;
	hold?: number;
	fps?: number;
};
export type PullBack = {scale: number; phase: 'hold' | 'anticipate' | 'release' | 'settled'; release: number; info: SpringInfo; sfx: SfxCue};

/**
 * Anticipation, f in [start, R), with u = (f - start) / anticipation and R = start + anticipation:
 *   scale = from + lean (from - to) (3u^2 - 2u^3)   (smoothstep in: the camera leans further in, slows, stops)
 * Release, f >= R, with x = x(f - R):
 *   scale = top + (to - top) x, where top = from + lean (from - to)
 * The spring overshoots below `to` (the world shows a little more than its rest framing) and settles.
 * SFX: zoom-swell, transient on the undershoot bottom, R + pi / wd frames, starting 9 frames early.
 */
export const elasticPullBackZoom = (frame: number, o: PullBackOptions = {}): PullBack => {
	const {start = 0, from = 1.15, to = 1, anticipation = 6, lean = 0.12, spring = 'heavy', hold = 1, fps = FPS} = o;
	const cfg = resolveSpring(spring);
	const info = springInfo(cfg, fps);
	const R = start + anticipation;
	const top = from + lean * (from - to);
	const f = start + held(frame - start, hold);
	let scale = from;
	let phase: PullBack['phase'] = 'hold';
	if (f >= R) {
		const t = f - R;
		scale = top + (to - top) * springValue(cfg, t, fps);
		phase = t >= info.settle ? 'settled' : 'release';
	} else if (f >= start && anticipation > 0) {
		const u = (f - start) / anticipation;
		scale = from + lean * (from - to) * (u * u * (3 - 2 * u));
		phase = 'anticipate';
	}
	return {scale, phase, release: R, info, sfx: cue('zoom-swell', peakFrame(R, info, hold), 'elastic pull-back zoom, undershoot')};
};

// ---------------------------------------------------------------------------------------------------------
// 3. gravityDropBounce
// ---------------------------------------------------------------------------------------------------------

export type DropOptions = {
	/** Frame the fall begins. */
	start?: number;
	/** Fall height in px (positive; the object starts this far above its rest line). */
	height?: number;
	/** Frames for the first fall. g = 2 height / fallFrames^2 px per frame squared. */
	fallFrames?: number;
	/** Fraction of speed kept at each contact (0 for a dead landing). */
	restitution?: number;
	/** Bounces after the first contact. */
	bounces?: number;
	hold?: number;
	/** Use 'sub-bass-hit' only when this landing is the film's one impact frame. */
	sfx?: 'tactile-pop' | 'sub-bass-hit' | 'stop-tick' | 'click-soft';
};
export type Drop = {
	/** Offset in px from the rest line: negative is above it. Apply as translateY. */
	y: number;
	/** Speed in px per frame, positive downward. Feed it to squashStretchImpact for the stretch. */
	vy: number;
	/** Downward speed at the first contact, the scale for the stretch. */
	vImpact: number;
	/** Contact frames (fractional): the first landing, then each bounce. */
	contacts: number[];
	/** Index of the last contact at or before this frame (-1 while falling). */
	lastContact: number;
	landed: boolean;
	sfx: SfxCue[];
};

/**
 * Fall: y = -height (1 - (t / T)^2) for t in [0, T], T = fallFrames (constant acceleration from rest).
 * Contact speed v0 = 2 height / T. Bounce k (k = 1..bounces) leaves at v_k = v0 e^k, flies 2 v_k / g frames
 * and peaks at v_k^2 / (2 g) = height e^(2k). Contact frames: c_0 = start + T, c_k = c_(k-1) + 2 T e^k.
 * SFX: one cue on the first contact; bounces whose height is under 12 px are left silent.
 */
export const gravityDropBounce = (frame: number, o: DropOptions = {}): Drop => {
	const {start = 0, height = 600, fallFrames = 8, restitution = 0.35, bounces = 1, hold = 1, sfx = 'tactile-pop'} = o;
	const T = Math.max(1, fallFrames);
	const g = (2 * height) / (T * T);
	const v0 = g * T;
	const contacts = [start + T];
	for (let k = 1; k <= bounces; k++) contacts.push(contacts[k - 1] + 2 * T * Math.pow(restitution, k));
	const f = start + held(frame - start, hold);
	const t = f - start;
	let y = -height, vy = 0, last = -1;
	if (t >= 0 && f < contacts[0]) {
		y = -height + 0.5 * g * t * t;
		vy = g * t;
	} else if (t >= 0) {
		y = 0;
		for (let k = 1; k <= bounces; k++) {
			if (f < contacts[k]) {
				const vk = v0 * Math.pow(restitution, k);
				const s = f - contacts[k - 1];
				y = -(vk * s - 0.5 * g * s * s);
				vy = -vk + g * s;
				last = k - 1;
				break;
			}
			last = k;
		}
		if (f >= contacts[bounces]) last = bounces;
	}
	const cues = [cue(sfx, Math.round(contacts[0]), 'gravity drop, first contact')];
	for (let k = 1; k <= bounces; k++) if (height * Math.pow(restitution, 2 * k) >= 12) cues.push(cue(sfx === 'sub-bass-hit' ? 'tactile-pop' : sfx, Math.round(contacts[k]), `gravity drop, bounce ${k} lands`));
	return {y, vy, vImpact: v0, contacts, lastContact: last, landed: f >= contacts[bounces], sfx: cues};
};

// ---------------------------------------------------------------------------------------------------------
// 4. squashStretchImpact
// ---------------------------------------------------------------------------------------------------------

export type SquashOptions = {
	/** Contact frame (may be fractional, e.g. gravityDropBounce().contacts[0]). */
	impactAt: number;
	/** Peak squash: scaleY bottoms at 1 - amount. 0.06 for UI cards (neo-brutalist), 0.22 for voxel blocks (0.78). */
	amount?: number;
	/** Speed into the contact in px per frame and the speed that gives full stretch. Leave out for no stretch. */
	velocity?: number;
	vMax?: number;
	/** Peak stretch before contact: scaleY tops at 1 + stretch at vMax. */
	stretch?: number;
	/** Recovery spring after contact. Bouncy gives a jelly wobble; snappy a firm card. */
	spring?: PresetName | SpringConfig;
	/** 'area' keeps sx * sy = 1 (flat 2D). 'volume' keeps sx^2 * sy = 1 (a 3D block scaled in x and z). */
	preserve?: 'area' | 'volume';
	hold?: number;
	fps?: number;
	sfx?: 'tactile-pop' | 'sub-bass-hit' | 'stop-tick' | 'click-soft';
};
export type Squash = {scaleX: number; scaleY: number; /** Always scale about the contact edge. */ transformOrigin: string; phase: 'stretch' | 'squash' | 'rest'; sfx: SfxCue};

/**
 * Before contact: sy = 1 + stretch min(1, velocity / vMax).
 * From contact, t = f - impactAt: sy = 1 - amount (1 - x(t)), the recovery spring pulling the squash back to 1
 * (its overshoot makes the object briefly taller than rest, the rebound).
 * Width from the preserve rule: area sx = 1 / sy; volume sx = 1 / sqrt(sy).
 * Origin '50% 100%': the base stays on the contact line, so the object never sinks into the floor.
 * SFX: one cue on the contact frame.
 */
export const squashStretchImpact = (frame: number, o: SquashOptions): Squash => {
	const {impactAt, amount = 0.12, velocity, vMax = 60, stretch = 0.1, spring = 'bouncy', preserve = 'area', hold = 1, fps = FPS, sfx = 'tactile-pop'} = o;
	const cfg = resolveSpring(spring);
	const f = held(frame, hold);
	let sy = 1;
	let phase: Squash['phase'] = 'rest';
	if (f < impactAt) {
		if (velocity !== undefined && velocity > 0) {
			sy = 1 + stretch * Math.min(1, velocity / Math.max(1e-6, vMax));
			phase = 'stretch';
		}
	} else {
		const t = f - impactAt;
		sy = 1 - amount * (1 - springValue(cfg, t, fps));
		phase = t < springInfo(cfg, fps).settle ? 'squash' : 'rest';
	}
	const sx = preserve === 'volume' ? 1 / Math.sqrt(sy) : 1 / sy;
	return {scaleX: sx, scaleY: sy, transformOrigin: '50% 100%', phase, sfx: cue(sfx, Math.round(impactAt), 'squash on contact')};
};

/** CSS transform for a drop + squash pair: translate first, then scale about the base. */
export const dropSquashTransform = (d: Drop, s: Squash) => `translateY(${d.y.toFixed(2)}px) scale(${s.scaleX.toFixed(4)}, ${s.scaleY.toFixed(4)})`;
