import React, {createContext, useContext} from 'react';
import {Easing, interpolate, random} from 'remotion';
import type {Bezier, Design, FilmDef, Role, Zone} from './types';

export type Ctx = {design: Design; meta: FilmDef['meta']; cast: FilmDef['cast']; u: number; W: number; H: number; safe: Zone};
const C = createContext<Ctx | null>(null);
export const DesignProvider = C.Provider;
export const useD = (): Ctx => {
	const c = useContext(C);
	if (!c) throw new Error('film-studio: no design context');
	return c;
};
/** Colour by role. Anything that is not a role throws: kits cannot use off-palette colour. */
export const useColor = () => {
	const {design} = useD();
	return (r: Role) => {
		const v = design.palette.roles[r];
		if (!v) throw new Error(`film-studio: "${r}" is not a palette role`);
		return v;
	};
};

export const hexRgb = (hex: string): [number, number, number] => {
	const n = parseInt(hex.replace('#', ''), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
/** Mix two palette colours: shading only, the result stays on the line between two roles. */
export const mix = (a: string, b: string, t: number) => {
	const [r1, g1, b1] = hexRgb(a), [r2, g2, b2] = hexRgb(b);
	return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
};
export const rgba = (hex: string, a: number) => {
	const [r, g, b] = hexRgb(hex);
	return `rgba(${r},${g},${b},${a})`;
};
export const lum = (hex: string) => {
	const [r, g, b] = hexRgb(hex).map((v) => {
		const s = v / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
	const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
	return (x + 0.05) / (y + 0.05);
};

export const rnd = (seed: string) => random(seed);
export const rr = (seed: string, a: number, b: number) => a + random(seed) * (b - a);
export const pick = <T,>(seed: string, arr: T[]): T => arr[Math.floor(random(seed) * arr.length) % arr.length];
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const bez = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);
/** Named easing from the design system; an unknown name throws (closed system). */
export const useEase = () => {
	const {design} = useD();
	return (name: string) => {
		const b = design.system.motion.easings[name];
		if (!b) throw new Error(`film-studio: easing "${name}" is not in ${design.style}/design-system.json`);
		return bez(b);
	};
};
/** First easing of the style: its default entrance curve. */
export const useEnterEase = () => {
	const {design} = useD();
	return bez(Object.values(design.system.motion.easings)[0]);
};
/** Entrance progress for element #i using the style's enter and stagger timing. */
export const enterP = (t: number, i: number, m: Design['system']['motion'], e: (n: number) => number, delay = 0) =>
	interpolate(t, [delay + i * m.stagger_frames, delay + i * m.stagger_frames + m.enter_frames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
/** Frame quantised to the style's hold (animating "on twos" etc). */
export const held = (t: number, hold: number) => Math.floor(t / Math.max(1, hold)) * Math.max(1, hold);

/** Some packaged fonts register under a different CSS name ("Press Start 2P" loads as "Press Start TwoP"). FontGate fills this. */
export const CSS_FAMILY: Record<string, string> = {};
export const cssFamily = (family: string) => CSS_FAMILY[family] ?? family;

type F = {family: string; weight: number; tracking: number; lineHeight: number; case?: string; italic?: boolean};
export const fontCss = (f: F, sizePx: number): React.CSSProperties => ({
	fontFamily: `'${cssFamily(f.family)}'`,
	fontWeight: f.weight,
	fontSize: sizePx,
	letterSpacing: `${f.tracking}em`,
	lineHeight: f.lineHeight,
	textTransform: f.case === 'upper' ? 'uppercase' : f.case === 'lower' ? 'lowercase' : 'none',
	fontStyle: f.italic ? 'italic' : 'normal',
});
export const abs = (z: Zone): React.CSSProperties => ({position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h});
