import React from 'react';
import {fontCss} from '../../engine/tokens';
import {lab} from '../data/tokens';
import {cased, type FontKey, type KineticTokens} from './tokens';

export {Card, Label, Plate, Scene, SPOT, Viewport, numCss, sceneColors} from '../camera/parts';

/** Header geometry every kinetic card shares: outer padding and the label row height. */
export const frameOf = (tk: KineticTokens) => {
	const pad = 52;
	return {pad, head: pad + lab(tk, 0.82) * 1.4 + 24};
};

/** Horizontal and vertical padding of a word block, in em. Every word carries it, filled or not, so layout never shifts. */
export const WORD_PAD: [number, number] = [0.14, 0.04];

/**
 * One word in a font role. With `fill` it is a solid block (knockout or power word) in the style's radius, capped at
 * 0.14 of the size; without it the same padding is kept, transparent. Scale and tilt turn around the word's centre.
 */
export const Word: React.FC<{
	tk: KineticTokens; size: number; color: string; children: string; role?: FontKey; fill?: string | null;
	scale?: number; tilt?: number; opacity?: number; style?: React.CSSProperties;
}> = ({tk, size, color, children, role = 'display', fill, scale = 1, tilt = 0, opacity = 1, style}) => (
	<span
		style={{
			...fontCss(tk.font[role], size),
			color,
			display: 'inline-block',
			whiteSpace: 'nowrap',
			padding: `${WORD_PAD[1]}em ${WORD_PAD[0]}em`,
			background: fill ?? 'transparent',
			borderRadius: Math.min(tk.radius, size * 0.14),
			transform: `scale(${scale.toFixed(4)}) rotate(${tilt.toFixed(2)}deg)`,
			transformOrigin: '50% 55%',
			opacity,
			...style,
		}}
	>
		{cased(tk, role, children)}
	</span>
);
