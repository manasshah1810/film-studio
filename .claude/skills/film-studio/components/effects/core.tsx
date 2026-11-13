import React from 'react';
import {AbsoluteFill, Easing, random} from 'remotion';
import type {Role} from '../engine/types';
import {clamp01, held, useColor, useD} from '../engine/tokens';

export type FxProps = {t: number; start: number; dur: number; panelDur: number; params: Record<string, unknown>; children: React.ReactNode};
export type Fx = React.FC<FxProps>;

/** What an effect body receives. k = 0 before the window, 0..1 inside it, 1 after. */
export type A = {
	k: number; // linear progress, clamped
	e: number; // ease in-out
	o: number; // ease out
	bell: number; // 0 -> 1 -> 0 across the window, 0 outside it
	on: boolean; // inside the window
	lt: number; // frames since the window started (style hold applied)
	t: number; // panel-local frame (style hold applied)
	dur: number;
	panelDur: number;
	W: number;
	H: number;
	u: number;
	seed: string;
	c: (role: string, fallback?: Role) => string;
	n: (key: string, d: number) => number;
	s: (key: string, d: string) => string;
	r: (key: string | number) => number; // deterministic 0..1
};
export type Out = {style?: React.CSSProperties; over?: React.ReactNode; under?: React.ReactNode};

const ROLES = ['bg', 'ink', 'primary', 'secondary', 'highlight', 'shadow'];
const eio = Easing.inOut(Easing.cubic), eo = Easing.out(Easing.cubic);

export const EFFECTS: Record<string, Fx> = {};

/**
 * Registers one effect. Every effect is a wrapper round the finished panel: it may transform or
 * filter the panel (style) and draw above (over) or below (under) it. Time is quantised to the
 * style's hold, so the same effect steps on twos in cutout and on fours in pixel without a flag.
 */
export const reg = (id: string, f: (a: A) => Out): void => {
	const C: Fx = ({t, start, dur, panelDur, params, children}) => {
		const {W, H, u, design} = useD();
		const col = useColor();
		const hold = design.system.motion.hold;
		const ht = held(t, hold), lt = held(t - start, hold);
		const k = clamp01(lt / Math.max(1, dur));
		const on = lt >= 0 && lt <= dur;
		const seed = `${design.seed}-${id}`;
		const o = f({
			k, e: eio(k), o: eo(k), bell: on ? Math.sin(Math.PI * k) : 0, on, lt, t: ht, dur, panelDur, W, H, u, seed,
			c: (role, fb = 'highlight') => col((ROLES.includes(role) ? role : fb) as Role),
			n: (key, d) => (typeof params[key] === 'number' ? (params[key] as number) : d),
			s: (key, d) => (typeof params[key] === 'string' ? (params[key] as string) : d),
			r: (key) => random(`${seed}-${key}`),
		});
		return (
			<AbsoluteFill style={{overflow: 'hidden'}}>
				{o.under}
				<AbsoluteFill style={o.style}>{children}</AbsoluteFill>
				{o.over}
			</AbsoluteFill>
		);
	};
	C.displayName = `Fx(${id})`;
	EFFECTS[id] = C;
};

export const fill: React.CSSProperties = {position: 'absolute', inset: 0, pointerEvents: 'none'};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
