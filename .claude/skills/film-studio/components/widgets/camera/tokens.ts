import {Easing, interpolate, spring} from 'remotion';
import {contrast, lum, mix} from '../../engine/tokens';
import {dataTokens, type DataJson, type DataTokens} from '../data/tokens';
import {FPS, type Box, type FillRole} from '../social/tokens';

/**
 * Camera widget tokens: the data token object plus what a lens, a cut and a film print need, all read from the ACTIVE
 * style's design-system.json: the off-focus blur and rack length (tokens.blur), the rack and whip easings, the whip
 * blur, vignette alpha, film grain and gate flicker (paper.grain, paper.flicker), the impact-frame silhouette roles and
 * shake (voxel.impact) and the slam spring. A style that lacks one gets the default named in widgets-camera.md.
 */
type Spring = {damping: number; stiffness: number; mass: number};
type Flicker = {fps?: number; brightness?: number; weave_px?: number; specks?: number; scratch_alpha?: number};
type GrainJson = {freq?: number; octaves?: number; opacity?: number};
type Impact = {frames?: number; silhouette?: Partial<Record<'sky' | 'rays' | 'world' | 'hero', string>>; shake_px?: number[]; rays?: number};
type Bag = Record<string, unknown>;
export type CameraJson = DataJson & {paper?: Bag; voxel?: Bag; doodle?: {board?: Bag}};

export type CameraTokens = DataTokens & {
	/** Blur in px of a plane at the far end of the depth of field: the largest tokens.blur z value, else 8. */
	blurOff: number;
	rackFrames: number;
	rack: (t: number) => number;
	whip: (t: number) => number;
	whipBlur: number;
	vignette: number;
	grain: {freq: number; octaves: number; opacity: number};
	flicker: {fps: number; brightness: number; weave: number; specks: number; scratch: number};
	impact: {frames: number; sky: string; rays: string; world: string; hero: string; onSky: string; shake: number[]; n: number};
	slam: Spring;
	/** Mark colour for a strike or a blade edge: first of alert, highlight, primary with 3:1 on surface, else series 0. */
	strike: string;
	/** True when the card is lighter than the ink (paper): multiply grain, dark dust. */
	light: boolean;
	/** The darker of bg and ink: vignette and flicker shade. */
	shade: string;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const cameraTokens = (ds: CameraJson, paletteId?: string, pairingId?: string): CameraTokens => {
	const tk = dataTokens(ds, paletteId, pairingId);
	const roles = (ds.palettes.find((p) => p.id === tk.palette) ?? ds.palettes[0]).roles;
	const T = (ds.tokens ?? {}) as Bag;
	const find = <V,>(k: string): V | undefined => [T, ds.paper, ds.voxel, ds.doodle?.board].map((o) => o?.[k]).find((v) => v !== undefined) as V | undefined;
	const blur = find<Record<string, number>>('blur');
	const zs = blur ? Object.entries(blur).filter(([k, v]) => /^z\d/.test(k) && typeof v === 'number').map(([, v]) => v) : [];
	const E = ds.motion.easings;
	const bz = (n: string) => (E[n] ? Easing.bezier(...(E[n] as [number, number, number, number])) : null);
	const whip = find<{blur_px?: number}>('whip');
	const vig = find<{alpha?: number} | number>('vignette');
	const g = find<GrainJson>('grain');
	const fl = find<Flicker>('flicker') ?? {};
	const im = find<Impact>('impact') ?? {};
	const hex = (role: string | undefined, fb: FillRole) => (role && roles[role] ? roles[role] : tk.c[fb]);
	const sky = hex(im.silhouette?.sky, 'highlight');
	const springs = (ds.motion.springs ?? {}) as Record<string, Spring>;
	const strikeRole = (['alert', 'highlight', 'primary'] as FillRole[]).find((r) => contrast(tk.c[r], tk.c.surface) >= 3);
	return {
		...tk,
		blurOff: zs.length ? Math.max(...zs) : 8,
		rackFrames: blur?.rack_frames ?? 24,
		rack: bz('rack') ?? bz('focus') ?? tk.move,
		whip: bz('whip') ?? bz('punch') ?? tk.move,
		whipBlur: whip?.blur_px ?? 18,
		vignette: typeof vig === 'number' ? vig : vig?.alpha ?? 0.4,
		grain: {freq: g?.freq ?? 0.85, octaves: g?.octaves ?? 2, opacity: Math.min(0.3, g?.opacity ?? 0.14)},
		// A flicker over 8 percent reads as a fault (archival-grunge forbids it), so the cap holds for every style.
		flicker: {fps: fl.fps ?? 12, brightness: Math.min(0.08, fl.brightness ?? 0.06), weave: fl.weave_px ?? 1, specks: fl.specks ?? 12, scratch: fl.scratch_alpha ?? 0.16},
		impact: {
			frames: im.frames ?? 2,
			sky,
			rays: hex(im.silhouette?.rays, 'surface'),
			world: hex(im.silhouette?.world, 'ink'),
			hero: hex(im.silhouette?.hero, 'surface'),
			onSky: (['ink', 'bg', 'surface'] as FillRole[]).map((r) => tk.c[r]).sort((a, b) => contrast(b, sky) - contrast(a, sky))[0],
			shake: im.shake_px ?? [10, -8, 5, 0],
			n: im.rays ?? 14,
		},
		slam: springs.slam ?? springs.stamp ?? springs.pop ?? tk.spring,
		strike: strikeRole ? tk.c[strikeRole] : tk.series[0],
		light: lum(tk.c.surface) > lum(tk.c.ink),
		shade: lum(tk.c.bg) < lum(tk.c.ink) ? tk.c.bg : tk.c.ink,
	};
};

/** 0..1 on the style's rack easing. */
export const rackP = (tk: CameraTokens, f: number, start: number, n = tk.rackFrames) => interpolate(f, [start, start + n], [0, 1], {...clamp, easing: tk.rack});
/** 0..1 on the style's whip easing. */
export const whipP = (tk: CameraTokens, f: number, start: number, n: number) => interpolate(f, [start, start + n], [0, 1], {...clamp, easing: tk.whip});
/** Slam spring (slam, stamp or pop), 0 before `start`. */
export const slamP = (tk: CameraTokens, f: number, start: number) => (f < start ? 0 : spring({frame: f - start, fps: FPS, config: tk.slam}));
/** Index of the current film frame when a look runs at `fps` (12 fps re-rolls every 2.5 video frames). */
export const filmTick = (f: number, fps: number) => Math.floor((Math.max(0, f) * fps) / FPS);
/** Shake offset in px after `at`: one value of `px` per frame, then 0. */
export const shakeAt = (px: number[], f: number, at: number) => (f < at || f - at >= px.length ? 0 : px[f - at]);
export {mix};

export type CameraBase = {tk: CameraTokens; frame: number; box: Box};
