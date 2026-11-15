import type React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {fontCss} from '../engine/tokens';
import type {Pairing} from '../engine/types';

/**
 * The bespoke-scene contract. A bespoke scene is a component coded for ONE topic's story beat
 * (components/bespoke/<topic>/). Creative execution is open; the guardrails are not:
 *   - colours come only from `role(name)` (palette roles of the active design system), never a hex;
 *   - text comes only from `font(role, px)` (the brief's pairing) and only says words from script.json;
 *   - easings come only from `ease(name)` (the system's motion.easings) and `pop(at)` (its spring);
 *   - everything readable stays inside `box` (the panel's safe rectangle placement, already in px).
 */
export type BespokeKit = {
	/** frame since the scene mounted, and how long it stays */
	frame: number;
	frames: number;
	fps: number;
	/** placement in px on the real frame */
	box: {left: number; top: number; width: number; height: number};
	/** px per design px (1080-wide frame = 1) */
	k: number;
	role: (name: string) => string;
	font: (role: 'display' | 'body' | 'accent' | 'mono', px: number) => React.CSSProperties;
	/** 0..1 progress from `at` over `frames`, through a named design-system easing */
	ease: (name: string, at: number, frames: number) => number;
	/** the style's pop spring, 0..1 (may overshoot), starting at `at` */
	pop: (at: number) => number;
	props: Record<string, unknown>;
};
export type BespokeScene = React.FC<{kit: BespokeKit}>;
type Bez = [number, number, number, number];

export const makeKit = (o: {frame: number; frames: number; fps: number; box: BespokeKit['box']; k: number; role: (r: string) => string; pairing: Pairing; easings: Record<string, Bez>; springs?: Record<string, {damping: number; stiffness: number; mass: number}>; props: Record<string, unknown>}): BespokeKit => ({
	frame: o.frame,
	frames: o.frames,
	fps: o.fps,
	box: o.box,
	k: o.k,
	role: o.role,
	font: (r, px) => fontCss(o.pairing[r], px * o.k),
	ease: (name, at, frames) => {
		const b = o.easings[name];
		if (!b) throw new Error(`film-studio bespoke: easing "${name}" is not in the design system`);
		return interpolate(o.frame, [at, at + Math.max(1, frames)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(...b)});
	},
	pop: (at) => spring({frame: o.frame - at, fps: o.fps, config: o.springs?.pop ?? {damping: 12, stiffness: 180, mass: 0.8}}),
	props: o.props,
});

/** Linear map clamped to 0..1, for progress between two frames (callers shape it with ease()). */
export const span = (f: number, a: number, b: number) => Math.max(0, Math.min(1, (f - a) / Math.max(1, b - a)));
/** Deterministic pseudo-random in 0..1 from an integer seed. */
export const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
